const COLORS = {
  Pending: 'bg-amber-50 text-amber-700',
  Shipped: 'bg-sky-50 text-sky-700',
  Delivered: 'bg-brand-50 text-brand-700',
  Cancelled: 'bg-red-50 text-red-700',
  Paid: 'bg-brand-50 text-brand-700',
  Failed: 'bg-red-50 text-red-700',
};
export default function StatusBadge({ status }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}
