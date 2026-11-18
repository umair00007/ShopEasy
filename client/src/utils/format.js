export const formatPrice = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const CATEGORIES = ['Sanitaryware', 'Bath Fittings', 'Pipes & Fittings', 'Water Tanks', 'Wires & Cables', 'Lighting', 'Electricals', 'Building Materials'];

export const CATEGORY_ICONS = {
  Sanitaryware: '🚽',
  'Bath Fittings': '🚿',
  'Pipes & Fittings': '🔧',
  'Water Tanks': '🛢️',
  'Wires & Cables': '🔌',
  Lighting: '💡',
  Electricals: '⚡',
  'Building Materials': '🧱',
};

// Shipping rule: keep in sync with server/src/utils/pricing.js (the server is the one that actually charges).
export const FREE_SHIPPING_ABOVE = 999;
export const SHIPPING_FEE = 49;
export const MAX_QTY_PER_ITEM = 10000; // sanity ceiling only: the real limit is the product stock

export function calcTotals(items) {
  const itemsPrice = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  const shippingPrice = itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  return { itemsPrice, shippingPrice, totalPrice: itemsPrice + shippingPrice };
}

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
