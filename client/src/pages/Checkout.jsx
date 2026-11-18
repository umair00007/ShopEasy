import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { loadRazorpay } from '../utils/razorpay.js';
import { formatPrice } from '../utils/format.js';
import CartThumb from '../components/shop/CartThumb.jsx';
import OrderSummary from '../components/shop/OrderSummary.jsx';

const inputClass = 'mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40';

// Defined OUTSIDE Checkout on purpose: a component declared inside another is re-created on every render,
// which would remount the <input> and drop keyboard focus after each keystroke.
function Field({ form, errors, onChange, name, label, className = '', ...rest }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>{label}
      <input name={name} value={form[name]} onChange={onChange} className={`${inputClass} ${errors[name] ? 'border-red-400' : 'border-slate-300'}`} {...rest} />
      {errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]}</span>}
    </label>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, syncing, itemsPrice, shippingPrice, totalPrice, resetLocal } = useCart();
  const navigate = useNavigate();
  const a = user.address || {};
  const [form, setForm] = useState({
    fullName: user.name, phone: a.phone || '', line1: a.line1 || '', city: a.city || 'Hyderabad', state: a.state || 'Telangana', postalCode: a.postalCode || '',
  });
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);

  if (!syncing && items.length === 0) return <Navigate to="/cart" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a 10-digit mobile number';
    if (!form.line1.trim()) e.line1 = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    if (!/^\d{6}$/.test(form.postalCode)) e.postalCode = 'Enter a 6-digit PIN code';
    return e;
  };

  const pay = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return toast.error('Please fix the highlighted fields');

    setPaying(true);
    try {
      // 1) Our server prices the cart from the database and creates a Razorpay order.
      const { data } = await api.post('/orders/checkout', {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: form,
      });
      await loadRazorpay();

      // 2) Razorpay's popup collects the payment. Card details never touch OUR server.
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'Shabbir Traders',
        description: `${items.length} item(s)`,
        prefill: { name: form.fullName, email: user.email, contact: form.phone },
        theme: { color: '#6b8e3d' },
        handler: async (response) => {
          // 3) Payment done in the popup. Now OUR server must verify the signature.
          try {
            const res = await api.post('/orders/verify', response);
            resetLocal();
            toast.success('Payment successful!');
            navigate(`/orders/${res.data.order._id}`, { replace: true, state: { justPaid: true } });
          } catch (err) {
            toast.error(getErrorMessage(err), { duration: 7000 });
            navigate('/orders', { replace: true });
          }
        },
        modal: { ondismiss: () => { setPaying(false); toast('Payment cancelled'); } },
      });
      rzp.on('payment.failed', (r) => toast.error(r.error?.description || 'Payment failed'));
      rzp.open();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPaying(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
      <form onSubmit={pay} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Delivery address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field form={form} errors={errors} onChange={onChange} name="fullName" label="Full name" autoComplete="name" />
              <Field form={form} errors={errors} onChange={onChange} name="phone" label="Mobile number" inputMode="numeric" maxLength={10} autoComplete="tel-national" />
              <Field form={form} errors={errors} onChange={onChange} name="line1" label="Address (house no, street, area)" className="sm:col-span-2" autoComplete="street-address" />
              <Field form={form} errors={errors} onChange={onChange} name="city" label="City" autoComplete="address-level2" />
              <Field form={form} errors={errors} onChange={onChange} name="state" label="State" autoComplete="address-level1" />
              <Field form={form} errors={errors} onChange={onChange} name="postalCode" label="PIN code" inputMode="numeric" maxLength={6} autoComplete="postal-code" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Items ({items.length})</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 py-3">
                  <CartThumb image={i.image} category={i.category} className="h-14 w-14" />
                  <p className="flex-1 text-sm font-medium text-slate-900">{i.name} <span className="text-slate-500">× {i.quantity}</span></p>
                  <p className="text-sm font-semibold">{formatPrice(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <OrderSummary itemsPrice={itemsPrice} shippingPrice={shippingPrice} totalPrice={totalPrice}>
          <button disabled={paying} className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {paying ? 'Processing…' : `Pay ${formatPrice(totalPrice)}`}
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">🔒 Secure payment by Razorpay</p>
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <p className="font-semibold">Test mode: no real money</p>
            <p className="mt-1">Card <strong>4111 1111 1111 1111</strong>, any future expiry, any CVV, any OTP. Or UPI <strong>success@razorpay</strong>.</p>
          </div>
        </OrderSummary>
      </form>
    </section>
  );
}
