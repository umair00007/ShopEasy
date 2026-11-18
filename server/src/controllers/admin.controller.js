import Order, { ORDER_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { present } from './order.controller.js';

const TZ = 'Asia/Kolkata'; // group "days" by Indian time, otherwise an 11pm order lands on the next UTC day
const istDay = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date); // "2026-11-18"

// Which status can follow which. Delivered and Cancelled are final.
const NEXT = { Pending: ['Shipped', 'Cancelled'], Shipped: ['Delivered', 'Cancelled'], Delivered: [], Cancelled: [] };

// GET /api/admin/stats
export async function getStats(_req, res) {
  // Last 7 calendar days including today, oldest first.
  const days = Array.from({ length: 7 }, (_, i) => istDay(new Date(Date.now() - (6 - i) * 86400000)));
  const since = new Date(`${days[0]}T00:00:00+05:30`);

  const [revenueAgg, paidOrders, pendingOrders, products, customers, lowStock, perDay] = await Promise.all([
    // Revenue counts only PAID orders that were not cancelled.
    Order.aggregate([
      { $match: { paymentStatus: 'Paid', orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ paymentStatus: 'Paid' }),
    Order.countDocuments({ paymentStatus: 'Paid', orderStatus: 'Pending' }),
    Product.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ stock: { $lt: 10 } }),
    // Aggregation pipeline: $match (filter) → $group (bucket by day, count + sum) → $sort. Runs inside MongoDB.
    Order.aggregate([
      { $match: { paymentStatus: 'Paid', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, orders: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Days with no orders don't appear in the aggregation result, so fill them with zeros for the chart.
  const byDay = new Map(perDay.map((d) => [d._id, d]));
  const last7Days = days.map((day) => ({ date: day, orders: byDay.get(day)?.orders || 0, revenue: byDay.get(day)?.revenue || 0 }));

  res.json({
    success: true,
    stats: { revenue: revenueAgg[0]?.revenue || 0, totalOrders: paidOrders, pendingOrders, totalProducts: products, totalUsers: customers, lowStock, last7Days },
  });
}

// GET /api/admin/orders?status=Pending&page=1&limit=10
export async function listOrders(req, res) {
  const filter = { paymentStatus: 'Paid' }; // abandoned/failed payment attempts are not real orders
  if (ORDER_STATUSES.includes(req.query.status)) filter.orderStatus = req.query.status;

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const [orders, total, counts] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
    Order.aggregate([{ $match: { paymentStatus: 'Paid' } }, { $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    total, page, pages: Math.max(Math.ceil(total / limit), 1),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.count])), // for the tab badges
    orders: await Promise.all(orders.map(present)),
  });
}

// PUT /api/admin/orders/:id/status   body: { status }
export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!NEXT[order.orderStatus]?.includes(status)) {
    throw new ApiError(400, `Cannot change an order from ${order.orderStatus} to ${status}`);
  }

  // Cancelling puts the items back on the shelf. (The refund itself is done by hand in the Razorpay dashboard.)
  if (status === 'Cancelled' && order.paymentStatus === 'Paid') {
    await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
  }
  order.orderStatus = status;
  await order.save();
  await order.populate('user', 'name email');
  res.json({ success: true, order: await present(order) });
}
