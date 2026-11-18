import { formatPrice, FREE_SHIPPING_ABOVE } from '../../utils/format.js';

export default function OrderSummary({ itemsPrice, shippingPrice, totalPrice, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-slate-600">Items</dt><dd className="font-medium">{formatPrice(itemsPrice)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-600">Delivery</dt><dd className="font-medium">{shippingPrice === 0 ? 'Free' : formatPrice(shippingPrice)}</dd></div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-bold">{formatPrice(totalPrice)}</dd></div>
      </dl>
      {shippingPrice > 0 && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
          Add {formatPrice(FREE_SHIPPING_ABOVE - itemsPrice)} more for free delivery.
        </p>
      )}
      {children}
    </div>
  );
}
