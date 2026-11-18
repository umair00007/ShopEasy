import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/shop/StatusBadge.jsx';
import CartThumb from '../components/shop/CartThumb.jsx';
import { formatDate, formatPrice } from '../utils/format.js';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders/mine').then((r) => setOrders(r.data.orders)).catch((e) => setError(getErrorMessage(e)));
  }, []);

  if (error) return <p className="py-24 text-center text-red-600">{error}</p>;
  if (!orders) return <Spinner />;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">My orders</h1>
      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-14 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-3 font-semibold text-slate-900">No orders yet</p>
          <p className="mt-1 text-sm text-slate-500">When you place an order it will show up here.</p>
          <Link to="/products" className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Start shopping</Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o._id}>
              <Link to={`/orders/${o._id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-500 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-slate-500">Order <span className="font-mono font-semibold text-slate-800">#{o._id.slice(-8).toUpperCase()}</span> · {formatDate(o.createdAt)}</p>
                  <div className="flex gap-2">
                    {o.paymentStatus !== 'Paid' && <StatusBadge status={`Payment ${o.paymentStatus}`} />}
                    <StatusBadge status={o.orderStatus} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {o.items.slice(0, 4).map((i) => <CartThumb key={i.product} image={i.image} category={undefined} className="h-14 w-14" />)}
                  {o.items.length > 4 && <span className="text-sm text-slate-500">+{o.items.length - 4} more</span>}
                  <p className="ml-auto text-lg font-bold text-slate-900">{formatPrice(o.totalPrice)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
