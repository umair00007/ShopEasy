import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from './AuthContext.jsx';
import { calcTotals, MAX_QTY_PER_ITEM } from '../utils/format.js';

// Cart item shape: { productId, name, price, stock, image, category, quantity }
// Guests: saved in localStorage. Logged-in users: saved in the database (so it follows them across devices).
// On login the guest cart is MERGED into the account cart.
const GUEST_KEY = 'shabbir_guest_cart';
const CartContext = createContext(null);

const readGuest = () => {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; } catch { return []; }
};
const writeGuest = (items) => {
  try { items.length ? localStorage.setItem(GUEST_KEY, JSON.stringify(items)) : localStorage.removeItem(GUEST_KEY); } catch { /* storage blocked */ }
};
const minimal = (items) => items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState(readGuest); // show the guest cart instantly, then refresh from the server
  const [syncing, setSyncing] = useState(true);

  // Runs whenever the user logs in or out (and once on page load).
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const guest = readGuest();
        let res;
        if (user) {
          res = guest.length ? await api.post('/cart/merge', { items: minimal(guest) }) : await api.get('/cart');
          writeGuest([]); // the guest cart now lives in the account
        } else if (guest.length) {
          res = await api.post('/cart/preview', { items: minimal(guest) }); // refresh prices/stock
        }
        if (!cancelled) setItems(res ? res.data.items : []);
        if (!cancelled && !user && res) writeGuest(res.data.items);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err));
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Apply a change locally right away (fast UI), then save it.
  const commit = useCallback((next) => {
    setItems(next);
    if (user) api.put('/cart', { items: minimal(next) }).catch((e) => toast.error(getErrorMessage(e)));
    else writeGuest(next);
  }, [user]);

  const addItem = useCallback((product, quantity = 1) => {
    const max = Math.min(product.stock, MAX_QTY_PER_ITEM);
    const existing = items.find((i) => i.productId === product._id);
    const nextQty = Math.min((existing?.quantity || 0) + quantity, max);
    if (existing && nextQty === existing.quantity) return toast.error(`You already have the maximum (${max}) in your cart`);
    const line = {
      productId: product._id, name: product.name, price: product.price, stock: product.stock,
      image: product.images?.[0]?.url || null, category: product.category, quantity: nextQty,
    };
    commit(existing ? items.map((i) => (i.productId === line.productId ? line : i)) : [...items, line]);
    toast.success('Added to cart');
  }, [items, commit]);

  const setQuantity = useCallback((productId, quantity) => {
    commit(items.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock, MAX_QTY_PER_ITEM)) } : i)));
  }, [items, commit]);

  const removeItem = useCallback((productId) => commit(items.filter((i) => i.productId !== productId)), [items, commit]);

  // After a successful payment the server already emptied the DB cart, so only reset local state.
  const resetLocal = useCallback(() => { setItems([]); writeGuest([]); }, []);

  const value = useMemo(() => ({
    items, syncing, addItem, setQuantity, removeItem, resetLocal,
    count: items.reduce((n, i) => n + i.quantity, 0),
    ...calcTotals(items),
  }), [items, syncing, addItem, setQuantity, removeItem, resetLocal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
