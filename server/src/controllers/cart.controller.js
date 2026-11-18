import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { getImageUrl } from '../utils/s3.js';
import { MAX_QTY_PER_ITEM } from '../utils/pricing.js';

// Turn [{ productId, quantity }] into the full cart the UI needs, using CURRENT product data.
// Products that were deleted are dropped; quantities are capped by stock and MAX_QTY_PER_ITEM.
async function buildCart(rawItems) {
  const merged = new Map(); // same product listed twice → add quantities
  for (const { productId, quantity } of rawItems || []) {
    const q = Math.floor(Number(quantity));
    if (!productId || !(q > 0)) continue;
    merged.set(String(productId), (merged.get(String(productId)) || 0) + q);
  }
  const ids = [...merged.keys()].filter((id) => /^[a-f\d]{24}$/i.test(id));
  const products = await Product.find({ _id: { $in: ids } });

  const items = [];
  for (const p of products) {
    if (p.stock === 0) continue; // out of stock items can't stay in the cart
    const quantity = Math.min(merged.get(String(p._id)), p.stock, MAX_QTY_PER_ITEM);
    items.push({
      productId: String(p._id),
      name: p.name,
      price: p.price,
      stock: p.stock,
      image: p.images[0] ? await getImageUrl(p.images[0]) : null,
      category: p.category,
      quantity,
    });
  }
  return items;
}

const toStored = (items) => items.map((i) => ({ product: i.productId, quantity: i.quantity }));
const fromStored = (cart) => (cart?.items || []).map((i) => ({ productId: i.product, quantity: i.quantity }));

async function saveCart(userId, items) {
  await Cart.findOneAndUpdate({ user: userId }, { items: toStored(items) }, { upsert: true });
  return items;
}

// POST /api/cart/preview (public): refreshes a GUEST cart from localStorage with current prices/stock.
export async function previewCart(req, res) {
  res.json({ success: true, items: await buildCart(req.body.items) });
}

// GET /api/cart (logged in)
export async function getCart(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });
  const items = await buildCart(fromStored(cart));
  if (cart && items.length !== cart.items.length) await saveCart(req.user._id, items); // prune dead items
  res.json({ success: true, items });
}

// PUT /api/cart (logged in): replace the whole cart.
export async function setCart(req, res) {
  const items = await buildCart(req.body.items);
  await saveCart(req.user._id, items);
  res.json({ success: true, items });
}

// POST /api/cart/merge (logged in): called right after login with the guest cart.
// Quantities of the same product are added together (still capped by stock).
export async function mergeCart(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });
  const items = await buildCart([...fromStored(cart), ...(req.body.items || [])]);
  await saveCart(req.user._id, items);
  res.json({ success: true, items });
}
