// Shipping rule (keep in sync with client/src/utils/format.js): free delivery from ₹999.
export const FREE_SHIPPING_ABOVE = 999;
export const SHIPPING_FEE = 49;
export const MAX_QTY_PER_ITEM = 10000; // sanity ceiling only: the real limit is the product stock

export function calcTotals(lines) {
  const itemsPrice = Math.round(lines.reduce((sum, l) => sum + l.price * l.quantity, 0) * 100) / 100;
  const shippingPrice = itemsPrice === 0 || itemsPrice >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  return { itemsPrice, shippingPrice, totalPrice: itemsPrice + shippingPrice };
}
