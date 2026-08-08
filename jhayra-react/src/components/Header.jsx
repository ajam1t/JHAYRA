import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';

export default function Header() {
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <>
      <div className="announce">🎁 <b>FREE SHIPPING</b> on orders above ₹999 &nbsp;|&nbsp; Code <b>JHAYRA10</b> for 10% off &nbsp;|&nbsp; <b>MADE IN INDIA 🇮🇳</b></div>
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="nav-inner">
            <Link to="/" className="nav-logo">JHAYRA<small>Crafting Memories Into Art</small></Link>
            <ul className="nav-menu" style={mobileOpen ? {display:'flex',flexDirection:'column',position:'fixed',top:'var(--nav)',left:0,right:0,background:'#fff',padding:'1.5rem',zIndex:300,gap:'1rem',boxShadow:'0 8px 24px rgba(0,0,0,.12)'} : {}}>
              <li><Link to="/" className={`nav-link${location.pathname==='/'?' active':''}`}>Home</Link></li>
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
              <Link to="/shop" className="nav-ic" aria-label="Search">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
              </Link>
              <Link to="/wishlist" className="nav-ic" aria-label="Wishlist">
                <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.9 1-.9-1a5.5 5.5 0 0 0-7.8 7.8l8.7 8.7 8.7-8.7a5.5 5.5 0 0 0 0-7.8z"/></svg>
              </Link>
              <Link to="/cart" className="nav-ic" aria-label="Cart" style={{position:'relative'}}>
                <svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {cartCount > 0 && <span className="nav-badge" id="cartBadge">{cartCount}</span>}
              </Link>
              <button className={`hamb${mobileOpen ? ' is-open' : ''}`} onClick={() => setMobileOpen(o => !o)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
