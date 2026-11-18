import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';
import { formatPrice } from '../utils/format.js';

function Card({ label, value, hint, icon, to }) {
  const body = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="text-xl" aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

// Orders per day for the last 7 days, drawn with plain divs (no chart library needed for 7 bars).
function OrdersChart({ days }) {
  const max = Math.max(...days.map((d) => d.orders), 1);
  const total = days.reduce((s, d) => s + d.orders, 0);
  const label = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short' });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-slate-900">Orders, last 7 days</h2>
        <p className="text-sm text-slate-500">{total} order{total === 1 ? '' : 's'}</p>
      </div>
      <div className="mt-6 flex h-48 items-end gap-2 sm:gap-4" role="img" aria-label={`Orders per day: ${days.map((d) => `${label(d.date)} ${d.orders}`).join(', ')}`}>
        {days.map((d) => (
          <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end" title={`${d.date}: ${d.orders} orders, ${formatPrice(d.revenue)}`}>
            <span className="mb-1 text-xs font-semibold text-slate-700">{d.orders}</span>
            <div className="w-full rounded-t-md bg-brand-500 transition group-hover:bg-brand-700" style={{ height: `${(d.orders / max) * 100}%`, minHeight: d.orders ? 4 : 2, opacity: d.orders ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2 sm:gap-4">
        {days.map((d) => <span key={d.date} className="flex-1 text-center text-xs text-slate-500">{label(d.date)}</span>)}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data.stats)).catch((e) => setError(getErrorMessage(e)));
  }, []);

  if (error) return <p className="py-20 text-center text-red-600">{error}</p>;
  if (!stats) return <Spinner />;

  return (
    <section className="pb-12">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-sm text-slate-500">A quick look at how the store is doing.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Total revenue" value={formatPrice(stats.revenue)} hint="Paid, not cancelled" icon="💰" />
        <Card label="Total orders" value={stats.totalOrders} hint={`${stats.pendingOrders} waiting to ship`} icon="📦" to="/admin/orders" />
        <Card label="Products" value={stats.totalProducts} hint={`${stats.lowStock} low or out of stock`} icon="🏷️" to="/admin/products" />
        <Card label="Customers" value={stats.totalUsers} hint="Registered accounts" icon="👥" />
      </div>

      <div className="mt-6"><OrdersChart days={stats.last7Days} /></div>
    </section>
  );
}
