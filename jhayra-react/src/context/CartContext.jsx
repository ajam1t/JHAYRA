import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS } from '../data/products';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jhayra_cart') || '{}'); }
    catch { return {}; }
  });

  /* Per-item metadata: price (from frame option), size, colour, displayName */
  const [cartMeta, setCartMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jhayra_cart_meta') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('jhayra_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('jhayra_cart_meta', JSON.stringify(cartMeta));
  }, [cartMeta]);

  /* Legacy quick-add (uses product.price as fallback) */
  const addToCart = useCallback((id) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }, []);

  /* Frame-aware add: key = "productId__frameOptionId" */
  const addToCartWithFrame = useCallback((productId, frameOption, displayName, qty = 1) => {
    const key = `${productId}__${frameOption.id}`;
    setCart(c => ({ ...c, [key]: (c[key] || 0) + qty }));
    setCartMeta(m => ({
      ...m,
      [key]: {
        productId,
        price: frameOption.price,
        frameOptionId: frameOption.id,
        size: frameOption.size,
        dimensions: frameOption.dimensions,
        colour: frameOption.colour,
        material: frameOption.material,
        displayName: displayName || '',
      },
    }));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(c => { const n = { ...c }; delete n[id]; return n; });
    setCartMeta(m => { const n = { ...m }; delete n[id]; return n; });
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart(c => {
      const n = { ...c, [id]: (c[id] || 0) + delta };
      if (n[id] <= 0) delete n[id];
      return n;
    });
  }, []);

  const clearCart = useCallback(() => { setCart({}); setCartMeta({}); }, []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const cartItems = Object.entries(cart).map(([key, qty]) => {
    const meta = cartMeta[key];
    const productId = meta?.productId || key.split('__')[0] || key;
    const product = PRODUCTS[productId] || PRODUCTS['custom'];
    const price = meta?.price ?? product?.price ?? 499;
    return { id: key, product, qty, price, meta };
  }).filter(item => item.product);

  const subtotal  = cartItems.reduce((s, item) => s + item.price * item.qty, 0);
  const shipping  = 0; // FREE DELIVERY ACROSS INDIA — ON ALL ORDERS
  const total     = subtotal + shipping;

  const money = (n) => '₹' + n.toLocaleString('en-IN');

  return (
    <CartContext.Provider value={{ cart, cartItems, cartCount, subtotal, shipping, total, money, addToCart, addToCartWithFrame, removeFromCart, changeQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
