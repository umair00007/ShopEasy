import Product, { CATEGORIES } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadImage, deleteImage, getImageUrl } from '../utils/s3.js';

// Turn a DB product into an API response: images become [{ key, url }] with pre-signed URLs.
async function present(product) {
  const obj = product.toObject();
  obj.images = await Promise.all(obj.images.map(async (key) => ({ key, url: await getImageUrl(key) })));
  return obj;
}

const pick = (b) => ({
  name: b.name,
  description: b.description,
  price: Number(b.price),
  stock: Number(b.stock),
  category: b.category,
  brand: b.brand || '',
});

// Escape regex special characters so user input is treated as plain text.
// Without this, "(a+)+$" could freeze the database (ReDoS) and "." would match everything.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1, numReviews: -1 },
};

// GET /api/products  (public)
// Query params: search, category, minPrice, maxPrice, inStock, sort, page, limit
// e.g. /api/products?search=wire&category=Electronics&minPrice=500&maxPrice=5000&sort=price_asc&page=2&limit=12
export async function getProducts(req, res) {
  const { search, category, minPrice, maxPrice, inStock, stock, sort = 'newest' } = req.query;

  // 1) Build the filter object (the "WHERE" clause).
  const filter = {};
  if (search?.trim()) {
    const rx = { $regex: escapeRegex(search.trim()), $options: 'i' }; // case-insensitive "contains"
    filter.$or = [{ name: rx }, { brand: rx }]; // customers search by product OR brand (e.g. "Jaquar")
  }
  if (category && CATEGORIES.includes(category)) filter.category = category;
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if ((minPrice !== undefined && minPrice !== '' && !Number.isNaN(min)) || (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(max))) {
    filter.price = {};
    if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(min)) filter.price.$gte = min;
    if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(max)) filter.price.$lte = max;
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (stock === 'out') filter.stock = 0; // admin filters: out of stock / running low (under 10)
  if (stock === 'low') filter.stock = { $gt: 0, $lt: 10 };

  // 2) Pagination: page 3 with limit 12 → skip the first 24, take 12. Clamp values so nobody asks for 1,000,000 rows.
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 48);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  // 3) Run the page query and the count in parallel. _id is a tie-breaker so equal prices don't shuffle between pages.
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ ...(SORTS[sort] || SORTS.newest), _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    limit,
    products: await Promise.all(products.map(present)),
  });
}

// GET /api/products/categories (public): each category with its product count, via aggregation.
export async function getCategories(_req, res) {
  const rows = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, categories: rows.map((r) => ({ name: r._id, count: r.count })) });
}

// GET /api/products/:id  (public)
export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product: await present(product) });
}

// POST /api/products  (admin, multipart/form-data)
export async function createProduct(req, res) {
  const images = await Promise.all((req.files || []).map(uploadImage));
  const product = await Product.create({ ...pick(req.body), images });
  res.status(201).json({ success: true, product: await present(product) });
}

// PUT /api/products/:id  (admin)
// Body: product fields + optional "keepImages" (JSON array of existing keys to keep) + new files in "images".
export async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  let keep = product.images;
  if (req.body.keepImages !== undefined) {
    try {
      const requested = JSON.parse(req.body.keepImages);
      keep = product.images.filter((k) => requested.includes(k)); // can only keep images it already owns
    } catch {
      throw new ApiError(400, 'keepImages must be a JSON array');
    }
  }
  const removed = product.images.filter((k) => !keep.includes(k));
  const added = await Promise.all((req.files || []).map(uploadImage));
  if (keep.length + added.length > 5) throw new ApiError(400, 'A product can have at most 5 images');

  Object.assign(product, pick(req.body), { images: [...keep, ...added] });
  await product.save();
  await Promise.all(removed.map(deleteImage)); // delete from S3 only after the DB save succeeded
  res.json({ success: true, product: await present(product) });
}

// DELETE /api/products/:id  (admin). Also removes the images from S3 so we don't pay for orphans.
export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await Promise.all(product.images.map(deleteImage));
  res.json({ success: true, message: 'Product deleted' });
}
