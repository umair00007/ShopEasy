// Shows: ‹ Prev  1 … 4 5 6 … 12  Next ›
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const btn = 'min-w-9 rounded-lg border px-3 py-1.5 text-sm font-medium transition';

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} className={`${btn} border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40`}>‹ Prev</button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - nums[i - 1] > 1 && <span className="text-slate-400">…</span>}
          <button onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
            className={`${btn} ${n === page ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>{n}</button>
        </span>
      ))}
      <button disabled={page === pages} onClick={() => onChange(page + 1)} className={`${btn} border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40`}>Next ›</button>
    </nav>
  );
}
