import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { getRazorpay } from '../config/razorpay.js';
import { ApiError } from '../utils/ApiError.js';
import { calcTotals } from '../utils/pricing.js';
import { getImageUrl } from '../utils/s3.js';

export async function present(order) {
  const o = order.toObject();
  o.items = await Promise.all(o.items.map(async (i) => ({ ...i, image: i.image ? await getImageUrl(i.image) : null })));
  return o;
}

// STEP 1 of payment. POST /api/orders/checkout
// The browser sends product ids + quantities + address. It does NOT send prices:
// we read prices from the database, so nobody can buy a ₹6,490 commode for ₹1 by editing the request.
export async function createCheckout(req, res) {
  const { items: requested, shippingAddress } = req.body;

  const wanted = new Map();
  for (const { productId, quantity } of requested) wanted.set(productId, (wanted.get(productId) || 0) + Number(quantity));

  const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
  if (products.length !== wanted.size) throw new ApiError(400, 'Some products in your cart are no longer available');

  const lines = products.map((p) => {
    const quantity = wanted.get(String(p._id));
    if (p.stock < quantity) throw new ApiError(409, `Only ${p.stock} of "${p.name}" in stock`);
    return { product: p._id, name: p.name, price: p.price, quantity, image: p.images[0] };
  });
  const totals = calcTotals(lines);

  // Ask Razorpay to create a payment order. Amounts are in PAISE (₹1 = 100 paise), as integers.
  let rzp;
  try {
    rzp = await getRazorpay().orders.create({
      amount: Math.round(totals.totalPrice * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
  } catch (err) {
    // The Razorpay SDK rejects with a plain object ({ statusCode, error: { description } }), NOT an Error,
    // so without this our error handler would only ever show "Something went wrong".
    if (err instanceof ApiError) throw err;
    console.error('Razorpay order creation failed:', err?.error || err);
    throw new ApiError(502, `Payment provider error: ${err?.error?.description || 'could not create payment order'}`);
  }

  // Save our own order as Pending. Stock is NOT reduced yet: only a verified payment does that.
  const order = await Order.create({ user: req.user._id, items: lines, shippingAddress, ...totals, razorpayOrderId: rzp.id });

  res.status(201).json({
    success: true,
    orderId: order._id,
    razorpayOrderId: rzp.id,
    amount: rzp.amount,
    currency: rzp.currency,
    keyId: env.RAZORPAY_KEY_ID, // the PUBLIC key id is meant for the browser; the secret never leaves the server
    ...totals,
  });
}

// STEP 3 of payment. POST /api/orders/verify
// After paying, Razorpay's checkout hands the browser {order_id, payment_id, signature}.
// WHY we verify on the server: the browser is untrusted. Anyone could call our API with a fake
// "payment successful" message. The signature is an HMAC-SHA256 of "order_id|payment_id" made with
// our SECRET key, which only Razorpay and our server know. A valid signature proves Razorpay issued it.
export async function verifyPayment(req, res) {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;

  const order = await Order.findOne({ razorpayOrderId: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus === 'Paid') return res.json({ success: true, order: await present(order) }); // idempotent: safe to call twice

  const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET || '').update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b); // constant-time compare avoids timing attacks
  if (!valid) {
    order.paymentStatus = 'Failed';
    await order.save();
    throw new ApiError(400, 'Payment verification failed');
  }

  // Reduce stock atomically: the filter { stock: { $gte: qty } } and the $inc happen as ONE operation,
  // so two buyers of the last item can't both succeed.
  const done = [];
  for (const item of order.items) {
    const r = await Product.updateOne({ _id: item.product, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } });
    if (r.modifiedCount === 0) {
      // Someone else bought the last units while this customer was paying. Undo and flag for refund.
      await Promise.all(done.map((d) => Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity } })));
      order.paymentStatus = 'Paid';
      order.paymentId = paymentId;
      order.paidAt = new Date();
      order.orderStatus = 'Cancelled';
      await order.save();
      throw new ApiError(409, `"${item.name}" just went out of stock. Your order was cancelled and the payment will be refunded.`);
    }
    done.push(item);
  }

  order.paymentStatus = 'Paid';
  order.paymentId = paymentId;
  order.paidAt = new Date();
  await order.save();

  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  await User.findByIdAndUpdate(req.user._id, { address: { ...order.shippingAddress.toObject() } }); // remember the address for next time

  res.json({ success: true, order: await present(order) });
}

// GET /api/orders/mine
export async function getMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id, paymentStatus: { $ne: 'Pending' } }).sort({ createdAt: -1 });
  res.json({ success: true, orders: await Promise.all(orders.map(present)) });
}

// GET /api/orders/:id  (owner or admin)
export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  const ownerId = order.user._id ? String(order.user._id) : String(order.user);
  if (ownerId !== String(req.user._id) && req.user.role !== 'admin') throw new ApiError(404, 'Order not found'); // 404, not 403: don't reveal it exists
  res.json({ success: true, order: await present(order) });
}
