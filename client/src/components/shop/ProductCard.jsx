import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format.js';
import Rating from './Rating.jsx';
import ImagePlaceholder from './ImagePlaceholder.jsx';

export default function ProductCard({ product: p }) {
  const out = p.stock === 0;
  return (
    <Link to={`/products/${p._id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {!p.images[0] && <ImagePlaceholder category={p.category} className={out ? 'opacity-60' : ''} />}
        {p.images[0] && (
          <img src={p.images[0].url} alt={p.name} loading="lazy" className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${out ? 'opacity-60' : ''}`} />
        )}
        {out && <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">Out of stock</span>}
        {!out && p.stock < 10 && <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">Only {p.stock} left</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{p.category}</p>
        <h3 className="mt-1 line-clamp-2 font-semibold text-slate-900">{p.name}</h3>
        <Rating value={p.rating} count={p.numReviews} className="mt-2" />
        <p className="mt-auto pt-3 text-lg font-bold text-slate-900">{formatPrice(p.price)}</p>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="aspect-square bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-slate-100" />
        <div className="h-4 w-4/5 rounded bg-slate-100" />
        <div className="h-5 w-1/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}
