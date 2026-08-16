import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import SearchOverlay from './SearchOverlay';

export default function Header() {
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [inspireOpen, setInspireOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const close = () => setMobileOpen(false);

  return (
    <>
      <div className="announce">
        <span className="announce-ticker" aria-hidden="true">
          🚚 FREE DELIVERY ACROSS INDIA — ON ALL ORDERS &nbsp;|&nbsp; MADE IN INDIA 🇮🇳 &nbsp;&nbsp;&nbsp;&nbsp; 🚚 FREE DELIVERY ACROSS INDIA — ON ALL ORDERS &nbsp;|&nbsp; MADE IN INDIA 🇮🇳 &nbsp;&nbsp;&nbsp;&nbsp;
        </span>
        <span className="announce-static">
          🚚 <b>FREE DELIVERY ACROSS INDIA</b> — ON ALL ORDERS &nbsp;|&nbsp; <b>MADE IN INDIA 🇮🇳</b>
        </span>
      </div>

      {/* Mobile drawer backdrop */}
      <div
        className={`drawer-backdrop${mobileOpen ? ' open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile slide-in drawer */}
      <div className={`mobile-drawer${mobileOpen ? ' open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="drawer-head">
          <Link to="/" className="drawer-logo" onClick={close}>JHAYRA</Link>
          <button className="drawer-close" onClick={close} aria-label="Close menu">
            <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <nav className="drawer-nav">
          <Link to="/" className={`drawer-link${location.pathname === '/' ? ' active' : ''}`} onClick={close}>Home</Link>

          <button className={`drawer-accordion-btn${shopOpen ? ' open' : ''}`} onClick={() => setShopOpen(o => !o)}>
            Shop
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div className={`drawer-sub${shopOpen ? ' open' : ''}`}>
            <Link to="/shop" className="drawer-sub-link" onClick={close}>All Products</Link>
            <Link to="/shop?view=new" className="drawer-sub-link" onClick={close}>New Arrivals</Link>
            <Link to="/shop?view=best" className="drawer-sub-link" onClick={close}>Best Sellers</Link>
            <Link to="/collections" className="drawer-sub-link" onClick={close}>Collections</Link>
          </div>

          <Link to="/gift-finder" className="drawer-link" onClick={close}>Gift Finder</Link>
          <Link to="/customize" className="drawer-link" onClick={close}>Customize</Link>

          <button className={`drawer-accordion-btn${inspireOpen ? ' open' : ''}`} onClick={() => setInspireOpen(o => !o)}>
            Inspire
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div className={`drawer-sub${inspireOpen ? ' open' : ''}`}>
            <Link to="/room-inspiration" className="drawer-sub-link" onClick={close}>Room Inspiration</Link>
            <Link to="/stories" className="drawer-sub-link" onClick={close}>Customer Stories</Link>
          </div>

          <Link to="/corporate" className="drawer-link" onClick={close}>Corporate Gifts</Link>

          <button className={`drawer-accordion-btn${moreOpen ? ' open' : ''}`} onClick={() => setMoreOpen(o => !o)}>
            More
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div className={`drawer-sub${moreOpen ? ' open' : ''}`}>
            <Link to="/about" className="drawer-sub-link" onClick={close}>About Us</Link>
            <Link to="/contact" className="drawer-sub-link" onClick={close}>Contact</Link>
            <Link to="/support" className="drawer-sub-link" onClick={close}>Support Center</Link>
            <Link to="/orders" className="drawer-sub-link" onClick={close}>My Orders</Link>
            <Link to="/wishlist" className="drawer-sub-link" onClick={close}>Wishlist</Link>
          </div>
        </nav>
      </div>

      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="nav-inner">
            <Link to="/" className="nav-logo">JHAYRA<small>Crafting Memories Into Art</small></Link>
            <ul className="nav-menu">
              <li><Link to="/" className={`nav-link${location.pathname === '/' ? ' active' : ''}`}>Home</Link></li>
              <li className="nav-dropdown">
                <Link to="/shop" className="nav-link">Shop<span className="drop-arrow">▾</span></Link>
                <div className="drop">
                  <Link to="/shop">All Products</Link>
                  <Link to="/shop?view=new">New Arrivals</Link>
                  <Link to="/shop?view=best">Best Sellers</Link>
                  <Link to="/collections">Collections</Link>
                </div>
              </li>
              <li><Link to="/gift-finder" className="nav-link">Gift Finder</Link></li>
              <li><Link to="/customize" className="nav-link">Customize</Link></li>
              <li className="nav-dropdown">
                <Link to="/room-inspiration" className="nav-link">Inspire<span className="drop-arrow">▾</span></Link>
                <div className="drop">
                  <Link to="/room-inspiration">Room Inspiration</Link>
                  <Link to="/stories">Customer Stories</Link>
                </div>
              </li>
              <li><Link to="/corporate" className="nav-link">Corporate</Link></li>
              <li className="nav-dropdown">
                <Link to="/about" className="nav-link">More<span className="drop-arrow">▾</span></Link>
                <div className="drop">
                  <Link to="/about">About Us</Link>
                  <Link to="/contact">Contact</Link>
                  <Link to="/support">Support Center</Link>
                  <Link to="/orders">My Orders</Link>
                  <Link to="/wishlist">Wishlist</Link>
                </div>
              </li>
            </ul>
            <div className="nav-actions">
              <button className="nav-ic" aria-label="Search" onClick={() => setSearchOpen(true)}>
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
              <Link to="/wishlist" className="nav-ic" aria-label="Wishlist">
                <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.9 1-.9-1a5.5 5.5 0 0 0-7.8 7.8l8.7 8.7 8.7-8.7a5.5 5.5 0 0 0 0-7.8z"/></svg>
              </Link>
              <Link to="/cart" className="nav-ic" aria-label="Cart" style={{position:'relative'}}>
                <svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {cartCount > 0 && <span className="nav-badge" id="cartBadge">{cartCount}</span>}
              </Link>
              <button
                className={`hamb${mobileOpen ? ' is-open' : ''}`}
                onClick={() => setMobileOpen(o => !o)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
