import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS } from '../data/products';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jhayra_cart') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('jhayra_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((id) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(c => { const n = { ...c }; delete n[id]; return n; });
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart(c => {
      const n = { ...c, [id]: (c[id] || 0) + delta };
      if (n[id] <= 0) delete n[id];
      return n;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    product: PRODUCTS[id], id, qty
  })).filter(item => item.product);

  const subtotal = cartItems.reduce((s, item) => s + item.product.price * item.qty, 0);
  const shipping = subtotal > 0 && subtotal < 999 ? 79 : 0;
  const total = subtotal + shipping;

  const money = (n) => '₹' + n.toLocaleString('en-IN');

  return (
    <CartContext.Provider value={{ cart, cartItems, cartCount, subtotal, shipping, total, money, addToCart, removeFromCart, changeQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
