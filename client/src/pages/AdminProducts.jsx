import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axios.js';
import Spinner from '../components/Spinner.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Pagination from '../components/shop/Pagination.jsx';
import ImagePlaceholder from '../components/shop/ImagePlaceholder.jsx';
import useDebounce from '../hooks/useDebounce.js';
import { CATEGORY_ICONS, formatPrice } from '../utils/format.js';

const PAGE_SIZE = 10;
const STOCK_FILTERS = [
  { value: '', label: 'Any stock' },
  { value: 'low', label: 'Low stock (under 10)' },
  { value: 'out', label: 'Out of stock' },
];

// Products are grouped by category (chips with counts, like the home page), with search,
// a stock filter and pagination, all done by the server so any number of products works.
export default function AdminProducts() {
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Category chips + counts (re-fetched after a delete so the counts stay right).
  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.data.categories)).catch(() => {});
  }, [refresh]);

  useEffect(() => {
    let ignore = false;
    const q = new URLSearchParams({ page, limit: PAGE_SIZE, sort: 'newest' });
    if (category) q.set('category', category);
    if (stock) q.set('stock', stock);
    if (debouncedSearch.trim()) q.set('search', debouncedSearch.trim());
    api.get(`/products?${q}`)
      .then((r) => { if (!ignore) setData(r.data); })
      .catch((e) => { if (!ignore) { toast.error(getErrorMessage(e)); setData({ products: [], total: 0, page: 1, pages: 1 }); } });
    return () => { ignore = true; };
  }, [category, stock, debouncedSearch, page, refresh]);

  // Any filter change goes back to page 1 and shows the loader.
  const change = (setter) => (value) => { setter(value); setPage(1); setData(null); };
  const pickCategory = change(setCategory);

  const totalAll = categories.reduce((n, c) => n + c.count, 0);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${toDelete._id}`);
      toast.success('Product deleted');
      setToDelete(null);
      setData(null);
      setRefresh((n) => n + 1);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const chip = (active) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${active ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`;

  return (
    <section className="pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">{totalAll} in total{data ? `, showing ${data.total}` : ''}</p>
        </div>
        <Link to="/admin/products/new" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">+ Add product</Link>
      </div>

      {/* Category chips */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by category">
        <button role="tab" aria-selected={category === ''} onClick={() => pickCategory('')} className={chip(category === '')}>
          All <span className={`text-xs ${category === '' ? 'text-brand-100' : 'text-slate-400'}`}>{totalAll}</span>
        </button>
        {categories.map((c) => (
          <button key={c.name} role="tab" aria-selected={category === c.name} onClick={() => pickCategory(c.name)} className={chip(category === c.name)}>
            <span aria-hidden="true">{CATEGORY_ICONS[c.name]}</span>{c.name}
            <span className={`text-xs ${category === c.name ? 'text-brand-100' : 'text-slate-400'}`}>{c.count}</span>
          </button>
        ))}
      </div>

      {/* Search + stock filter */}
      <div className="mt-4 flex flex-wrap gap-3">
        <input type="search" value={search} onChange={(e) => change(setSearch)(e.target.value)} placeholder="Search by name or brand…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 sm:w-72" />
        <select value={stock} onChange={(e) => change(setStock)(e.target.value)} aria-label="Stock filter"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40">
          {STOCK_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {!data ? (
        <Spinner />
      ) : data.products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          No products match. Try another category or clear the search.
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                          {p.images[0] ? <img src={p.images[0].url} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder category={p.category} className="[&>span]:text-xl" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.category}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.stock === 0 ? 'bg-red-50 text-red-700' : p.stock < 10 ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
                        {p.stock === 0 ? 'Out of stock' : p.stock}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link to={`/admin/products/${p._id}/edit`} className="mr-3 font-semibold text-brand-600 hover:underline">Edit</Link>
                      <button onClick={() => setToDelete(p)} className="font-semibold text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={(n) => { setData(null); setPage(n); }} />
        </>
      )}

      {toDelete && (
        <ConfirmModal title="Delete product?" message={`"${toDelete.name}" and its images will be permanently removed.`} loading={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
      )}
    </section>
  );
}
