import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios.js';
import useRefreshOnFocus from '../hooks/useRefreshOnFocus.js';
import { useCart } from '../context/CartContext.jsx';
import Spinner from '../components/Spinner.jsx';
import QuantityInput from '../components/shop/QuantityInput.jsx';
import Rating from '../components/shop/Rating.jsx';
import ImagePlaceholder from '../components/shop/ImagePlaceholder.jsx';
import { formatPrice } from '../utils/format.js';

export default function Product() {
  const { id } = useParams();
  const { addItem } = useCart();
  const focusTick = useRefreshOnFocus();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setProduct(null);
    setError('');
    setActive(0);
    setQty(1);
    api.get(`/products/${id}`).then((r) => setProduct(r.data.product)).catch((e) => setError(e.response?.status === 404 ? 'not-found' : getErrorMessage(e)));
  }, [id]);

  // When you come back to this tab, quietly refresh price/stock (no spinner, keeps your chosen quantity).
  useEffect(() => {
    if (focusTick === 0) return;
    api.get(`/products/${id}`).then((r) => setProduct(r.data.product)).catch(() => {});
  }, [focusTick, id]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <p className="text-4xl">😕</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{error === 'not-found' ? 'Product not found' : 'Something went wrong'}</h1>
        {error !== 'not-found' && <p className="mt-1 text-slate-500">{error}</p>}
        <Link to="/products" className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Back to shop</Link>
      </div>
    );
  }
  if (!product) return <Spinner />;

  const out = product.stock === 0;
  const maxQty = product.stock; // you can order everything we have

  const addToCart = () => addItem(product, qty);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-500">
        <Link to="/products" className="hover:text-brand-600">Shop</Link> / <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-brand-600">{product.category}</Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {product.images[active]
              ? <img src={product.images[active].url} alt={product.name} className="h-full w-full object-cover" />
              : <ImagePlaceholder category={product.category} className="[&>span]:text-8xl" />}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button key={img.key} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`}
                  className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${i === active ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{product.brand || product.category}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{product.name}</h1>
          <Rating value={product.rating} count={product.numReviews} className="mt-3" />
          <p className="mt-5 text-3xl font-extrabold text-slate-900">{formatPrice(product.price)}</p>
          <p className="mt-1 text-xs text-slate-500">Inclusive of all taxes</p>

          <p className="mt-6 leading-7 text-slate-600">{product.description}</p>

          <p className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${out ? 'text-red-600' : product.stock < 10 ? 'text-amber-600' : 'text-brand-700'}`}>
            <span className={`h-2 w-2 rounded-full ${out ? 'bg-red-500' : product.stock < 10 ? 'bg-amber-500' : 'bg-brand-600'}`} />
            {out ? 'Out of stock' : product.stock < 10 ? `Only ${product.stock} left` : `In stock (${product.stock} available)`}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <QuantityInput value={out ? 1 : qty} max={Math.max(maxQty, 1)} onChange={setQty} disabled={out} />
            <button onClick={addToCart} disabled={out} className="h-11 flex-1 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:flex-none">
              {out ? 'Unavailable' : 'Add to cart'}
            </button>
          </div>

          <ul className="mt-8 space-y-2 border-t border-slate-200 pt-6 text-sm text-slate-600">
            <li>🚚 Free delivery on orders over ₹999</li>
            <li>↩️ 7-day easy returns</li>
            <li>🔒 Secure payments with Razorpay</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
