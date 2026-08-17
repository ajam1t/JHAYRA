import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS } from '../data/products';
import { supabase } from '../lib/supabase';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jhayra_cart') || '{}'); }
    catch { return {}; }
  });

  /* Per-item metadata: price (from Supabase product), size, colour, orientation, displayName */
  const [cartMeta, setCartMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jhayra_cart_meta') || '{}'); }
    catch { return {}; }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount }

  useEffect(() => {
    localStorage.setItem('jhayra_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('jhayra_cart_meta', JSON.stringify(cartMeta));
  }, [cartMeta]);

  /* Quick-add (no frame selection): stores name + Supabase price in meta */
  const addToCart = useCallback((id, productMeta = null) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    if (productMeta) {
      setCartMeta(m => ({
        ...m,
        [id]: { productId: id, price: productMeta.price, displayName: productMeta.name || '' },
      }));
    }
  }, []);

  /* Frame-aware add: key = "productId__frameOptionId".
     `extra` may carry { artworkPaths: string[], customization: object } for
     personalised (custom) items so the uploaded photos + selections reach the order. */
  const addToCartWithFrame = useCallback((productId, frameOption, displayName, qty = 1, orientation = 'Vertical', productPrice = null, extra = {}) => {
    /* Custom items get a unique key so two different personalisations never merge. */
    const isCustom = productId === 'custom';
    const key = isCustom
      ? `${productId}__${frameOption.id}__${Date.now().toString(36)}`
      : `${productId}__${frameOption.id}`;
    setCart(c => ({ ...c, [key]: (c[key] || 0) + qty }));
    setCartMeta(m => ({
      ...m,
      [key]: {
        productId,
        price: productPrice != null ? productPrice : frameOption.price,
        frameOptionId: frameOption.id,
        size: frameOption.size,
        dimensions: frameOption.dimensions,
        colour: frameOption.colour,
        material: frameOption.material,
        orientation,
        displayName: displayName || '',
        ...(Array.isArray(extra.artworkPaths) && extra.artworkPaths.length ? { artworkPaths: extra.artworkPaths } : {}),
        ...(extra.customization ? { customization: extra.customization } : {}),
      },
    }));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(c => { const n = { ...c }; delete n[id]; return n; });
    setCartMeta(m => { const n = { ...m }; delete n[id]; return n; });
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart(c => {
      const newQty = (c[id] || 0) + delta;
      const n = { ...c };
      if (newQty <= 0) { delete n[id]; } else { n[id] = newQty; }
      return n;
    });
  }, []);

  const clearCart = useCallback(() => { setCart({}); setCartMeta({}); setAppliedCoupon(null); }, []);

  const applyCoupon = useCallback(async (code) => {
    const upper = code.trim().toUpperCase();
    if (!upper) return { ok: false };
    if (!supabase) {
      setAppliedCoupon(null);
      return { ok: false };
    }
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: upper },
      });
      if (error || !data?.valid) {
        setAppliedCoupon(null);
        return { ok: false };
      }
      setAppliedCoupon({ code: upper, discount: data.discount });
      return { ok: true, discount: data.discount };
    } catch {
      setAppliedCoupon(null);
      return { ok: false };
    }
  }, []);

  const clearCoupon = useCallback(() => setAppliedCoupon(null), []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const cartItems = Object.entries(cart).map(([key, qty]) => {
    const meta = cartMeta[key];
    const productId = meta?.productId || key.split('__')[0] || key;
    const product = PRODUCTS[productId];
    const price = meta?.price ?? product?.price ?? 499;
    return { id: key, product, qty, price, meta };
  }).filter(item => item.product);

  const subtotal       = cartItems.reduce((s, item) => s + item.price * item.qty, 0);
  const shipping       = 0; // FREE DELIVERY ACROSS INDIA — ON ALL ORDERS
  const total          = subtotal + shipping;
  const discountAmt    = appliedCoupon ? Math.round(subtotal * appliedCoupon.discount / 100) : 0;
  const discountedTotal = Math.max(0, total - discountAmt);

  const money = (n) => '₹' + n.toLocaleString('en-IN');

  return (
    <CartContext.Provider value={{ cart, cartItems, cartCount, subtotal, shipping, total, discountAmt, discountedTotal, appliedCoupon, money, addToCart, addToCartWithFrame, removeFromCart, changeQty, clearCart, applyCoupon, clearCoupon }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
