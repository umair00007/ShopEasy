import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import CartThumb from '../components/shop/CartThumb.jsx';
import OrderSummary from '../components/shop/OrderSummary.jsx';
import QuantityInput from '../components/shop/QuantityInput.jsx';
import { formatPrice } from '../utils/format.js';

export default function Cart() {
  const { items, setQuantity, removeItem, itemsPrice, shippingPrice, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Looks like you haven&apos;t added anything yet.</p>
        <Link to="/products" className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">Browse products</Link>
      </div>
    );
  }

  const checkout = () => (user ? navigate('/checkout') : navigate('/login', { state: { from: '/checkout' } }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-4 p-4 sm:p-5">
              <Link to={`/products/${i.productId}`}><CartThumb image={i.image} category={i.category} /></Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link to={`/products/${i.productId}`} className="font-semibold text-slate-900 hover:text-brand-600">{i.name}</Link>
                  <p className="font-bold text-slate-900">{formatPrice(i.price * i.quantity)}</p>
                </div>
                <p className="text-sm text-slate-500">{formatPrice(i.price)} each</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityInput value={i.quantity} max={i.stock} size="h-9 w-9" onChange={(n) => setQuantity(i.productId, n)} />
                  <button onClick={() => removeItem(i.productId)} className="text-sm font-semibold text-red-600 hover:underline">Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <OrderSummary itemsPrice={itemsPrice} shippingPrice={shippingPrice} totalPrice={totalPrice}>
          <button onClick={checkout} className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            {user ? 'Proceed to checkout' : 'Log in to checkout'}
          </button>
          <Link to="/products" className="mt-3 block text-center text-sm font-medium text-brand-600 hover:underline">Continue shopping</Link>
        </OrderSummary>
      </div>
    </section>
  );
}
