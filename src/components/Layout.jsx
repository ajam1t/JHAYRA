import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon, { WhatsAppGlyph } from './Icon';
import Frame from './Frame';
import Img from './Img';
import { useCart } from '../state/cart';
import { useShop } from '../state/store';
import { SITE, money, waLink } from '../lib/site';
import { BRAND } from '../lib/brand';
import { loadProducts, searchProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';

const NAV = [
  ['/shop', 'Shop'],
  ['/customize', 'Personalise'],
  ['/collections', 'Collections'],
  ['/gift-finder', 'Gift Finder'],
  ['/room-inspiration', 'Inspiration'],
  ['/corporate', 'Corporate'],
];

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="JHAYRA home">
      <b>JHAYRA</b>
      <small>{SITE.tagline}</small>
    </Link>
  );
}

function Announce() {
  const msgs = ['Free delivery across India — on every order', `Trusted by ${BRAND.homes} homes since ${BRAND.since}`, 'Handcrafted to order in India', 'Free replacement if it arrives damaged'];
  return (
    <div className="announce" aria-label="Store announcements">
      <div className="announce-track">
        {msgs.map((m) => (
          <span key={m}>{m}</span>
        ))}
        {msgs.map((m) => (
          <span key={'d' + m} className="dup" aria-hidden="true">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function Header({ onMenu }) {
  const { count, setDrawerOpen } = useCart();
  const { wish, setSearchOpen } = useShop();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 400 && y > last.current + 4);
      if (y < last.current - 4 || y < 400) setHidden(false);
      last.current = y;
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''} ${hidden ? 'hide' : ''}`}>
      <div className="wrap">
        <button className="icon-btn header-menu" onClick={onMenu} aria-label="Open menu">
          <Icon name="menu" />
        </button>
        <Logo />
        <nav className="nav" aria-label="Main">
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search (Ctrl K)">
            <Icon name="search" />
          </button>
          <Link to="/wishlist" className="icon-btn hide-sm" aria-label={`Wishlist, ${wish.length} items`}>
            <Icon name="heart" />
            {wish.length > 0 && <span className="badge">{wish.length}</span>}
          </Link>
          <button className="icon-btn" onClick={() => setDrawerOpen(true)} aria-label={`Cart, ${count} items`}>
            <Icon name="bag" />
            {count > 0 && (
              <span className="badge" key={count}>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function MenuSheet({ onClose }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="sheet sheet-left" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="sheet-head">
          <Logo />
          <button className="icon-btn" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">
          <nav className="menu-links">
            <Link to="/">Home</Link>
            {NAV.map(([to, label]) => (
              <Link key={to} to={to}>
                {label} <Icon name="arrow" size={18} />
              </Link>
            ))}
          </nav>
          <div className="menu-sub">
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/orders">My orders</Link>
            <Link to="/support">Help & FAQ</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/about">Our story</Link>
            <Link to="/replacement-policy">Replacement promise</Link>
          </div>
        </div>
        <div className="sheet-foot">
          <a className="btn btn-wa btn-block" href={waLink('Hi JHAYRA! I need help choosing a frame.')} target="_blank" rel="noopener noreferrer">
            <WhatsAppGlyph /> Chat with us on WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}

function BottomNav() {
  const { count, setDrawerOpen } = useCart();
  return (
    <nav className="bottom-nav" aria-label="Quick">
      <NavLink to="/" end>
        <Icon name="home" size={21} />
        Home
      </NavLink>
      <NavLink to="/shop">
        <Icon name="grid" size={21} />
        Shop
      </NavLink>
      <NavLink to="/customize" className="create">
        <Icon name="sparkle" size={21} />
        Create
      </NavLink>
      <NavLink to="/gift-finder">
        <Icon name="gift" size={21} />
        Gifts
      </NavLink>
      <button onClick={() => setDrawerOpen(true)}>
        <Icon name="bag" size={21} />
        Cart
        {count > 0 && <span className="badge">{count}</span>}
      </button>
    </nav>
  );
}

export function CartThumb({ item }) {
  return (
    <div className="thumb">
      {item.preview || item.image ? (
        <Frame src={item.preview || item.image} colour={item.colourHex || '#1C1C1C'} glare={false} thickness={6} sizes="80px" />
      ) : (
        <Icon name="image" />
      )}
    </div>
  );
}

function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, setQty, remove, subtotal, count } = useCart();
  const navigate = useNavigate();
  const close = () => setDrawerOpen(false);
  if (!drawerOpen) return null;
  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="sheet sheet-right" role="dialog" aria-modal="true" aria-label="Your cart">
        <div className="sheet-head">
          <h2>
            Your cart <span className="muted small">({count})</span>
          </h2>
          <button className="icon-btn" onClick={close} aria-label="Close cart">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">
          {items.length === 0 ? (
            <div className="empty">
              <Frame colour="#B8932A" glare={false} />
              <h3 className="h3">Your walls are waiting</h3>
              <p className="muted" style={{ margin: '10px 0 22px' }}>
                Pick a design, or turn your own photo into a frame.
              </p>
              <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={() => (close(), navigate('/shop'))}>
                  Shop frames
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => (close(), navigate('/customize'))}>
                  Frame my photo
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="free-ship">
                <Icon name="truck" size={20} /> You've unlocked <b>free delivery</b> across India
              </div>
              {items.map((i) => (
                <div className="cart-line" key={i.key}>
                  <CartThumb item={i} />
                  <div>
                    <h4>{i.name}</h4>
                    <div className="opts">
                      {i.option.size} · {i.option.colour} frame{i.orientation === 'Horizontal' ? ' · Landscape' : ''}
                    </div>
                    <div className="qty">
                      <button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Decrease quantity">
                        <Icon name="minus" size={15} />
                      </button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.key, i.qty + 1)} aria-label="Increase quantity">
                        <Icon name="plus" size={15} />
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <b>{money(i.price * i.qty)}</b>
                    <div>
                      <button className="small muted" style={{ marginTop: 10, textDecoration: 'underline' }} onClick={() => remove(i.key)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {items.length > 0 && (
          <div className="sheet-foot">
            <div className="sum-row">
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div className="sum-row muted small" style={{ marginBottom: 12 }}>
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <button className="btn btn-gold btn-lg btn-block" onClick={() => (close(), navigate('/checkout'))}>
              <Icon name="lock" size={18} /> Checkout · {money(subtotal)}
            </button>
            <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 10 }} onClick={() => (close(), navigate('/cart'))}>
              View cart & apply coupon
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function SearchPalette() {
  const { searchOpen, setSearchOpen } = useShop();
  const [q, setQ] = useState('');
  const [products, setProducts] = useState([]);
  const [sel, setSel] = useState(0);
  const { active: TEMPLATES } = useTemplates();
  const navigate = useNavigate();
  const input = useRef(null);

  useEffect(() => {
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [setSearchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    loadProducts().then(setProducts).catch(() => {});
    setTimeout(() => input.current?.focus(), 30);
  }, [searchOpen]);

  if (!searchOpen) return null;
  const close = () => {
    setSearchOpen(false);
    setQ('');
    setSel(0);
  };
  const results = q ? searchProducts(products, q).slice(0, 7) : products.filter((p) => p.is_bestseller).slice(0, 5);
  const tmpl = q
    ? TEMPLATES.filter((t) => (t.title + ' ' + t.group + ' ' + (t.occasion || []).join(' ')).toLowerCase().includes(q.toLowerCase())).slice(0, 4)
    : [];
  const all = [...results.map((p) => `/product/${p.id}`), ...tmpl.map((t) => `/customize/${t.id}`)];
  const go = (to) => {
    close();
    navigate(to);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(all.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      if (all[sel]) go(all[sel]);
      else if (q) go(`/shop?q=${encodeURIComponent(q)}`);
    }
  };
  return (
    <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search">
      <div className="scrim" onClick={close} />
      <div className="search-panel">
        <div className="search-input">
          <Icon name="search" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKey}
            placeholder="Search Ganesha, wedding, horses, couple…"
            aria-label="Search products and templates"
          />
          <button className="icon-btn" onClick={close} aria-label="Close search">
            <Icon name="close" />
          </button>
        </div>
        <div className="search-results" role="listbox">
          {!q && (
            <div className="chips" style={{ padding: '6px 10px 4px' }}>
              {['Ganesha', 'Wedding', 'Couple', 'Horses', 'Krishna', 'Abstract', 'Family', 'Moon'].map((s) => (
                <button key={s} className="chip" onClick={() => setQ(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {results.length > 0 && <h3>{q ? 'Frames' : 'Bestsellers'}</h3>}
          {results.map((p, i) => (
            <Link key={p.id} to={`/product/${p.id}`} onClick={close} className="search-item" aria-selected={sel === i} role="option">
              <span className="thumb">
                <Img src={p.thumbnail} alt="" sizes="48px" width={120} />
              </span>
              <span className="grow">
                <b>{p.name}</b>
                <small>from {money(p.price)}</small>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          ))}
          {tmpl.length > 0 && <h3>Personalised designs</h3>}
          {tmpl.map((t, i) => (
            <Link key={t.id} to={`/customize/${t.id}`} onClick={close} className="search-item" aria-selected={sel === results.length + i} role="option">
              <span className="thumb" style={{ display: 'grid', placeItems: 'center' }}>
                <Icon name="sparkle" />
              </span>
              <span className="grow">
                <b>{t.title}</b>
                <small>{t.subtitle}</small>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          ))}
          {q && results.length === 0 && tmpl.length === 0 && (
            <div className="empty">
              <p className="muted">
                Nothing found for “{q}”. Try another word — or{' '}
                <a className="link" href={waLink(`Hi JHAYRA! I'm looking for a frame: ${q}`)} target="_blank" rel="noopener noreferrer">
                  ask us on WhatsApp
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Logo />
            <p style={{ marginTop: 18, maxWidth: 360, lineHeight: 1.7 }}>
              Handcrafted photo frames and wall art, made to order in India since {BRAND.since}. {BRAND.homes} homes have hung a JHAYRA.
            </p>
            <div className="footer-promise">
              <span>
                <Icon name="truck" size={16} /> Free delivery
              </span>
              <span>
                <Icon name="refresh" size={16} /> Free replacement
              </span>
              <span>
                <Icon name="lock" size={16} /> Secure payments
              </span>
            </div>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li>
                <Link to="/shop">All frames</Link>
              </li>
              <li>
                <Link to="/customize">Personalise a frame</Link>
              </li>
              <li>
                <Link to="/collections">Collections</Link>
              </li>
              <li>
                <Link to="/gift-finder">Gift finder</Link>
              </li>
              <li>
                <Link to="/corporate">Corporate gifting</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li>
                <Link to="/support">FAQ & support</Link>
              </li>
              <li>
                <Link to="/orders">Track my order</Link>
              </li>
              <li>
                <Link to="/shipping-policy">Shipping</Link>
              </li>
              <li>
                <Link to="/replacement-policy">Replacement promise</Link>
              </li>
              <li>
                <Link to="/contact">Contact us</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Talk to us</h4>
            <ul>
              <li>
                <a href={waLink()} target="_blank" rel="noopener noreferrer">
                  WhatsApp {SITE.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li>
                <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram @jhayra.in
                </a>
              </li>
              <li className="small">Mon–Sat 9–7 · Sun 10–4</li>
            </ul>
          </div>
        </div>
        <div className="footer-word" aria-hidden="true">
          JHAYRA
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} JHAYRA · Made with love in India
          </span>
          <nav aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/refund">Refunds</Link>
            <Link to="/cookie-policy">Cookies</Link>
            <Link to="/about">About</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFab() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/checkout') || pathname.startsWith('/customize/')) return null;
  return (
    <a className="wa-fab" href={waLink('Hi JHAYRA! I have a question.')} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
      <WhatsAppGlyph size={26} />
      <span>Chat with us</span>
    </a>
  );
}

export default function Layout() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const { setDrawerOpen } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenu(false);
    setDrawerOpen(false);
  }, [pathname, setDrawerOpen]);

  useEffect(() => {
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, []);

  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <Announce />
      <Header onMenu={() => setMenu(true)} />
      <main id="main" key={pathname} className="page-enter">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppFab />
      {menu && <MenuSheet onClose={() => setMenu(false)} />}
      <CartDrawer />
      <SearchPalette />
    </>
  );
}
