import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios.js';
import useDebounce from '../hooks/useDebounce.js';
import useRefreshOnFocus from '../hooks/useRefreshOnFocus.js';
import ProductCard, { ProductCardSkeleton } from '../components/shop/ProductCard.jsx';
import Pagination from '../components/shop/Pagination.jsx';
import { CATEGORIES } from '../utils/format.js';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40';

// The filters live in the URL (?category=Books&page=2). Benefits: links are shareable,
// the Back button works, and a refresh keeps your filters.
export default function Products() {
  const [params, setParams] = useSearchParams();
  const get = (k, d = '') => params.get(k) ?? d;

  const [search, setSearch] = useState(get('search'));
  const debouncedSearch = useDebounce(search);
  const [data, setData] = useState({ products: [], total: 0, page: 1, pages: 1 });
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === '' || v === undefined ? next.delete(k) : next.set(k, v)));
    if (!('page' in changes)) next.delete('page'); // any filter change goes back to page 1
    setParams(next, { replace: true });
  };

  // Push the debounced search text into the URL.
  useEffect(() => {
    if (debouncedSearch !== get('search')) update({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = params.toString();
  const focusTick = useRefreshOnFocus();
  useEffect(() => {
    const controller = new AbortController(); // cancel the previous request if filters change quickly
    if (focusTick === 0) setStatus('loading'); // on refocus, update quietly in the background
    api.get(`/products?${query}&limit=12`, { signal: controller.signal })
      .then((res) => { setData(res.data); setStatus('ready'); })
      .catch((e) => {
        if (e.code === 'ERR_CANCELED') return;
        setError(getErrorMessage(e));
        setStatus('error');
      });
    return () => controller.abort();
  }, [query, focusTick]);

  const clear = () => { setSearch(''); setParams({}, { replace: true }); };
  const hasFilters = ['search', 'category', 'minPrice', 'maxPrice', 'inStock'].some((k) => params.has(k));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Shop</h1>
      <p className="mt-1 text-sm text-slate-500">{status === 'ready' ? `${data.total} product${data.total === 1 ? '' : 's'}` : ' '}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* Filters */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <label className="block text-sm font-medium text-slate-700">Search
            <input type="search" placeholder="Search products or brands…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${field} mt-1`} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Category
            <select value={get('category')} onChange={(e) => update({ category: e.target.value })} className={`${field} mt-1`}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div>
            <p className="text-sm font-medium text-slate-700">Price (₹)</p>
            <div className="mt-1 flex items-center gap-2">
              <PriceInput placeholder="Min" value={get('minPrice')} onCommit={(v) => update({ minPrice: v })} className={field} />
              <span className="text-slate-400">–</span>
              <PriceInput placeholder="Max" value={get('maxPrice')} onCommit={(v) => update({ maxPrice: v })} className={field} />
            </div>
          </div>
          <label className="block text-sm font-medium text-slate-700">Sort by
            <select value={get('sort', 'newest')} onChange={(e) => update({ sort: e.target.value })} className={`${field} mt-1`}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={get('inStock') === 'true'} onChange={(e) => update({ inStock: e.target.checked ? 'true' : '' })} className="h-4 w-4 accent-[#6b8e3d]" />
            In stock only
          </label>
          {hasFilters && <button onClick={clear} className="text-sm font-semibold text-brand-600 hover:underline">Clear all filters</button>}
        </aside>

        {/* Results */}
        <div>
          {status === 'error' ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
              <p className="font-semibold">Couldn&apos;t load products</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          ) : status === 'loading' ? (
            <Grid>{Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}</Grid>
          ) : data.products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-3 font-semibold text-slate-900">No products found</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search or remove some filters.</p>
              <button onClick={clear} className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Clear filters</button>
            </div>
          ) : (
            <>
              <Grid>{data.products.map((p) => <ProductCard key={p._id} product={p} />)}</Grid>
              <Pagination page={data.page} pages={data.pages} onChange={(n) => { update({ page: n > 1 ? n : '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const Grid = ({ children }) => <div className="grid grid-cols-2 gap-4 md:grid-cols-3 sm:gap-6">{children}</div>;

// Number input that updates the URL only when you leave the box or press Enter (not on every keystroke).
function PriceInput({ value, onCommit, ...props }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => v !== value && onCommit(v);
  return <input type="number" min="0" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} {...props} />;
}
