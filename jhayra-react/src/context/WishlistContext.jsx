import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jhayra_wishlist') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('jhayra_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (id) => setWishlist(w => w.includes(id) ? w : [...w, id]);
  const removeFromWishlist = (id) => setWishlist(w => w.filter(i => i !== id));
  const toggleWishlist = (id) => wishlist.includes(id) ? removeFromWishlist(id) : addToWishlist(id);
  const isWishlisted = (id) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
