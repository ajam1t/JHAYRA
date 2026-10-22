import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const CartCtx = createContext(null);
const KEY = 'jhayra_cart_v2';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [coupon, setCoupon] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // item: { productId, name, image, price, category, option: {id,size,dimensions,colour,material}, orientation, artworkPaths, customization, preview }
  const add = useCallback((item, { open = true } = {}) => {
    const isCustom = item.productId === 'custom';
    const key = isCustom ? `custom__${item.option.id}__${Date.now().toString(36)}` : `${item.productId}__${item.option.id}`;
    setItems((list) => {
      const found = list.find((i) => i.key === key);
      if (found) return list.map((i) => (i.key === key ? { ...i, qty: i.qty + (item.qty || 1) } : i));
      return [...list, { ...item, key, qty: item.qty || 1 }];
    });
    setLastAdded(key);
    if (open) setDrawerOpen(true);
  }, []);

  const setQty = useCallback((key, qty) => {
    setItems((list) => (qty <= 0 ? list.filter((i) => i.key !== key) : list.map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i))));
  }, []);
  const remove = useCallback((key) => setItems((list) => list.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const applyCoupon = useCallback(async (raw) => {
    const code = raw.trim().toUpperCase();
    if (!code) return { ok: false };
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', { body: { code } });
      if (error || !data?.valid) {
        setCoupon(null);
        return { ok: false };
      }
      setCoupon({ code, discount: data.discount });
      return { ok: true, discount: data.discount };
    } catch {
      setCoupon(null);
      return { ok: false };
    }
  }, []);

  const totals = useMemo(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = coupon ? Math.round((subtotal * coupon.discount) / 100) : 0;
    return { count, subtotal, discount, total: Math.max(0, subtotal - discount) };
  }, [items, coupon]);

  const value = { items, ...totals, coupon, add, setQty, remove, clear, applyCoupon, clearCoupon: () => setCoupon(null), drawerOpen, setDrawerOpen, lastAdded };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
