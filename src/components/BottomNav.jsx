import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function BottomNav() {
  const { cartCount } = useCart();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      <Link to="/" className={`bottom-nav-item${pathname === '/' ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Home
      </Link>
      <Link to="/shop" className={`bottom-nav-item${pathname === '/shop' || pathname === '/collections' ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        Shop
      </Link>
      <Link to="/gift-finder" className={`bottom-nav-item${pathname === '/gift-finder' ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
        Gifts
      </Link>
      <Link to="/customize" className={`bottom-nav-item${pathname.startsWith('/customize') ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Create
      </Link>
      <Link to="/cart" className={`bottom-nav-item${pathname === '/cart' ? ' active' : ''}`}>
        {cartCount > 0 && <span className="bottom-nav-badge">{cartCount}</span>}
        <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        Cart
      </Link>
    </nav>
  );
}
