import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { CATEGORY_ICONS } from '../utils/format.js';
import ProductCard, { ProductCardSkeleton } from '../components/shop/ProductCard.jsx';


export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/products?sort=rating&inStock=true&limit=4').then((r) => setFeatured(r.data.products)).catch(() => setFeatured([]));
    api.get('/products/categories').then((r) => setCategories(r.data.categories)).catch(() => {});
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-slate-100">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">Authorised dealers: Jaquar · Cera · Astral · Sintex</span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Sanitary, electricals &amp; building materials, <span className="text-brand-600">delivered easy.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Everything for your bathroom, wiring, plumbing and construction work from trusted brands at fair prices. Order online, we deliver to your site.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products" className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">Start shopping</Link>
              <Link to="/products?sort=price_asc" className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">Lowest prices</Link>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-4 lg:grid" aria-hidden="true">
            {['🚿', '🔌', '💡', '🚰'].map((e, i) => (
              <div key={e} className={`flex aspect-square items-center justify-center rounded-3xl text-6xl shadow-sm ${i % 3 === 0 ? 'bg-brand-100' : 'bg-slate-100'} ${i % 2 ? 'translate-y-6' : ''}`}>{e}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.name} to={`/products?category=${encodeURIComponent(c.name)}`} className="rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md">
              <p className="text-3xl">{CATEGORY_ICONS[c.name] || '🛍️'}</p>
              <p className="mt-2 font-semibold text-slate-900">{c.name}</p>
              <p className="text-xs text-slate-500">{c.count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Top rated picks</h2>
          <Link to="/products?sort=rating" className="text-sm font-semibold text-brand-600 hover:underline">View all →</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured ? featured.map((p) => <ProductCard key={p._id} product={p} />) : Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </section>
    </>
  );
}
