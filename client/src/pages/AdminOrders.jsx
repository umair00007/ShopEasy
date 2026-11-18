import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import StatusBadge from '../components/shop/StatusBadge.jsx';
import Pagination from '../components/shop/Pagination.jsx';
import { formatDate, formatPrice } from '../utils/format.js';

const TABS = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];
// Mirrors the server rules (the server enforces them; this only decides which buttons to offer).
const NEXT = { Pending: ['Shipped', 'Cancelled'], Shipped: ['Delivered', 'Cancelled'], Delivered: [], Cancelled: [] };

export default function AdminOrders() {
  const [tab, setTab] = useState('All');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    let ignore = false;
    const q = new URLSearchParams({ page, ...(tab !== 'All' && { status: tab }) });
    api.get(`/admin/orders?${q}`)
      .then((r) => { if (!ignore) { setData(r.data); setError(''); } })
      .catch((e) => { if (!ignore) setError(getErrorMessage(e)); });
    return () => { ignore = true; };
  }, [tab, page]);

  const changeTab = (t) => { setTab(t); setPage(1); setData(null); };

  const setStatus = async (order, status) => {
    setBusyId(order._id);
    try {
      const { data: res } = await api.put(`/admin/orders/${order._id}/status`, { status });
      toast.success(`Order marked ${status}`);
      // Update the row, and the tab counts, without refetching everything.
      setData((d) => ({
        ...d,
        orders: tab === 'All' ? d.orders.map((o) => (o._id === order._id ? res.order : o)) : d.orders.filter((o) => o._id !== order._id),
        counts: { ...d.counts, [order.orderStatus]: (d.counts[order.orderStatus] || 1) - 1, [status]: (d.counts[status] || 0) + 1 },
      }));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusyId(null);
      setCancelling(null);
    }
  };

  const counts = data?.counts || {};
  const countFor = (t) => (t === 'All' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[t] || 0);

  return (
    <section className="pb-12">
      <h1 className="text-2xl font-bold text-slate-900">Orders</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => changeTab(t)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
            {t}{data && <span className={`ml-1.5 text-xs ${tab === t ? 'text-brand-100' : 'text-slate-400'}`}>{countFor(t)}</span>}
          </button>
        ))}
      </div>

      {error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : !data ? (
        <Spinner />
      ) : data.orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-14 text-center text-slate-500">No {tab === 'All' ? '' : tab.toLowerCase() + ' '}orders yet.</div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Update</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><Link to={`/orders/${o._id}`} className="font-mono font-semibold text-brand-700 hover:underline">#{o._id.slice(-8).toUpperCase()}</Link>
                      <p className="text-xs text-slate-500">{o.items.length} item{o.items.length === 1 ? '' : 's'}</p></td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-900">{o.user?.name || 'Deleted user'}</p><p className="text-xs text-slate-500">{o.shippingAddress.phone}</p></td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(o.totalPrice)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.orderStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      {NEXT[o.orderStatus].length === 0 ? <span className="text-xs text-slate-400">Final</span> : (
                        <select aria-label={`Update status of order ${o._id.slice(-8)}`} disabled={busyId === o._id} value=""
                          onChange={(e) => (e.target.value === 'Cancelled' ? setCancelling(o) : setStatus(o, e.target.value))}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-50">
                          <option value="" disabled>Change…</option>
                          {NEXT[o.orderStatus].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={(n) => { setData(null); setPage(n); }} />
        </>
      )}

      {cancelling && (
        <ConfirmModal title="Cancel this order?" confirmText="Cancel order" loading={busyId === cancelling._id}
          message="The items go back into stock. Refund the customer manually in the Razorpay dashboard. This can't be undone."
          onConfirm={() => setStatus(cancelling, 'Cancelled')} onCancel={() => setCancelling(null)} />
      )}
    </section>
  );
}
