import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/shop/StatusBadge.jsx';
import CartThumb from '../components/shop/CartThumb.jsx';
import { formatDate, formatPrice } from '../utils/format.js';

const STEPS = ['Pending', 'Shipped', 'Delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const justPaid = useLocation().state?.justPaid;
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data.order)).catch((e) => setError(e.response?.status === 404 ? 'Order not found' : getErrorMessage(e)));
  }, [id]);

  if (error) return (
    <div className="py-28 text-center">
      <p className="text-lg font-semibold text-slate-900">{error}</p>
      <Link to="/orders" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">← My orders</Link>
    </div>
  );
  if (!order) return <Spinner />;

  const a = order.shippingAddress;
  const step = STEPS.indexOf(order.orderStatus);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/orders" className="text-sm font-medium text-brand-600 hover:underline">← Back to orders</Link>

      {justPaid && (
        <div className="mt-4 rounded-2xl bg-brand-50 p-5 text-brand-700">
          <p className="font-bold">🎉 Thank you! Your payment was successful.</p>
          <p className="mt-1 text-sm">We&apos;ve received your order and will start processing it shortly.</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-slate-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2"><StatusBadge status={order.orderStatus} /><StatusBadge status={order.paymentStatus} /></div>
      </div>

      {order.orderStatus === 'Cancelled' ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">This order was cancelled.{order.paymentStatus === 'Paid' && ' Any amount paid will be refunded.'}</p>
      ) : (
        <ol className="mt-6 flex items-center" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center last:flex-none">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i <= step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{i <= step ? '✓' : i + 1}</span>
              <span className={`ml-2 text-sm font-medium ${i <= step ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <span className={`mx-3 h-0.5 flex-1 ${i < step ? 'bg-brand-600' : 'bg-slate-200'}`} />}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_18rem]">
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5">
          {order.items.map((i) => (
            <li key={i.product} className="flex items-center gap-4 py-4">
              <CartThumb image={i.image} className="h-16 w-16" />
              <div className="flex-1">
                <Link to={`/products/${i.product}`} className="font-semibold text-slate-900 hover:text-brand-600">{i.name}</Link>
                <p className="text-sm text-slate-500">{formatPrice(i.price)} × {i.quantity}</p>
              </div>
              <p className="font-bold">{formatPrice(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="space-y-4">
          {order.user?.name && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
              <p className="font-bold text-slate-900">Customer</p>
              <p className="mt-2 text-slate-600">{order.user.name}<br />{order.user.email}</p>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
            <p className="font-bold text-slate-900">Delivery address</p>
            <p className="mt-2 leading-6 text-slate-600">{a.fullName}<br />{a.line1}<br />{a.city}, {a.state} {a.postalCode}<br />📞 {a.phone}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
            <p className="font-bold text-slate-900">Payment</p>
            <dl className="mt-2 space-y-1.5 text-slate-600">
              <div className="flex justify-between"><dt>Items</dt><dd>{formatPrice(order.itemsPrice)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{order.shippingPrice ? formatPrice(order.shippingPrice) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900"><dt>Total</dt><dd>{formatPrice(order.totalPrice)}</dd></div>
            </dl>
            {order.paymentId && <p className="mt-3 break-all text-xs text-slate-400">Payment ID: {order.paymentId}</p>}
          </div>
        </aside>
      </div>
    </section>
  );
}
