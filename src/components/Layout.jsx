import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFestival } from '../state/festival';

// Desktop header. Visualise stays one tap away from product pages, Create
// and the menu rather than taking a permanent slot here.
const NAV = [
  ['/', 'Home', true],
  ['/shop', 'Shop'],
  ['/customize', 'Create'],
  ['/gift-finder', 'Gift Finder'],
];

// Hamburger menu, grouped. Every route here exists in App.jsx.
const MENU = [
  ['Shop', [['/shop', 'All Wall Art'], ['/shop?room=living', 'Living Room'], ['/shop?room=bedroom', 'Bedroom'], ['/shop?room=office', 'Office'], ['/shop?room=dining', 'Dining Room'], ['/customize', 'Personalised Frames']]],
  ['Create', [['/customize', 'Create Your Own Art'], ['/customize/photo', 'Upload Your Photo'], ['/visualise', 'Visualise on Your Wall'], ['/wall-planner', 'Plan a Gallery Wall']]],
  ['Discover', [['/gift-finder', 'Gift Finder'], ['/shop?sort=bestsellers', 'Bestsellers'], ['/shop?sort=new', 'New Arrivals'], ['/collections', 'Collections'], ['/worlds', 'Worlds'], ['/journal', 'Inspiration Journal']]],
  ['About', [['/about', 'Our Story'], ['/contact', 'Contact'], ['/support', 'Help & FAQs'], ['/orders', 'My Orders'], ['/wishlist', 'Wishlist'], ['/corporate', 'Corporate Gifting']]],
];

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="JHAYRA home">
      <img className="logo-mark" src="/logo-mark.webp" alt="" width="44" height="40" />
      <span className="logo-words">
        <b>JHAYRA</b>
        <small>{SITE.tagline}</small>
      </span>
    </Link>
  );
}

function Announce() {
  const festival = useFestival();
  const msgs = [
    ...(festival?.banner ? [festival.banner] : festival?.offer && festival?.coupon ? [`${festival.name}: ${festival.offer} — code ${festival.coupon}`] : []),'Free delivery across India — on every order', `Trusted by ${BRAND.homes} homes since ${BRAND.since}`, 'Handcrafted to order in India'];
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

// The branding bar stays fixed while you scroll: menu, logo and tagline only.
// Search and cart live in the bottom bar and menu on phones; desktop keeps
// them as quiet text links beside the main navigation.
function Header({ onMenu, menuOpen }) {
  const { count, setDrawerOpen } = useCart();
  const { setSearchOpen } = useShop();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap">
        <div className="header-start">
          <button className="icon-btn header-menu" onClick={onMenu} aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="site-menu">
            <Icon name="menu" />
          </button>
          <Logo />
        </div>
        <nav className="nav" aria-label="Main">
          {NAV.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions header-text-actions">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search (Ctrl K)">
            Search
          </button>
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label={`Cart, ${count} items`}>
            Cart{count > 0 ? ` (${count})` : ''}
          </button>
        </div>
      </div>
    </header>
  );
}

// Invitation to the Signature Experience section on the homepage. The link
// carries #signature; the homepage scrolls to it (see Home.jsx), so browser
// back/forward and opening in a new tab behave like any link.
function SignatureStrip() {
  return (
    <Link to="/#signature" className="sig-strip">
      <span className="sig-rule" aria-hidden="true" />
      <span className="sig-text">
        <span className="sig-star" aria-hidden="true">
          ✦
        </span>
        <span className="sig-kicker">The Jhayra</span> <em>Signature Experience</em>
        <span className="sig-arrow" aria-hidden="true">
          <Icon name="arrow" size={12} stroke={2} />
        </span>
      </span>
      <span className="sig-rule" aria-hidden="true" />
    </Link>
  );
}

// Rolls the new number in when the cart count changes (static when reduced motion).
function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span className="badge badge-roll" aria-hidden="true">
      <span key={count}>{count}</span>
    </span>
  );
}

function MenuSheet({ onClose, returnFocus }) {
  const { setSearchOpen } = useShop();
  const panel = useRef(null);
  // Focus the panel, trap Tab inside it, close on Escape, restore focus on close.
  useEffect(() => {
    const el = panel.current;
    const opener = document.activeElement;
    el?.querySelector('a, button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const f = [...el.querySelectorAll('a[href], button:not([disabled])')];
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      (returnFocus?.current || opener)?.focus?.();
    };
  }, [onClose, returnFocus]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="sheet sheet-left menu-sheet" id="site-menu" role="dialog" aria-modal="true" aria-label="Menu" ref={panel}>
        <div className="sheet-head">
          <Logo />
          <button className="icon-btn" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">
          <button type="button" className="menu-search" onClick={() => (onClose(), setSearchOpen(true))}>
            <Icon name="search" size={18} /> Search art, designs and gifts
          </button>
          <Link to="/" className="menu-home" onClick={onClose}>
            Home <Icon name="arrow" size={18} />
          </Link>
          {MENU.map(([title, links]) => (
            <nav key={title} className="menu-group" aria-label={title}>
              <h2>{title}</h2>
              <ul>
                {links.map(([to, label]) => (
                  <li key={to + label}>
                    <Link to={to} onClick={onClose}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
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

const BOTTOM = [
  ['/', 'Home', 'home', true],
  ['/shop', 'Shop', 'grid'],
  ['/customize', 'Create', 'sparkle'],
  ['/gift-finder', 'Gift Finder', 'gift'],
];
function BottomNav() {
  const { count, setDrawerOpen, drawerOpen } = useCart();
  const { pathname } = useLocation();
  // Checkout and the design editors have their own fixed action bars.
  if (pathname.startsWith('/checkout') || /^\/customize\/.+/.test(pathname)) return null;
  return (
    <nav className="bottom-nav" aria-label="Quick">
      {BOTTOM.map(([to, label, icon, end]) =>
        to === '/gift-finder' ? (
          <NavLink key={to} to={to} className="bn-gift">
            <span className="bn-gift-ic" aria-hidden="true">
              <Icon name={icon} size={21} />
              <i className="bn-spark s1" />
              <i className="bn-spark s2" />
              <i className="bn-spark s3" />
            </span>
            <span>{label}</span>
          </NavLink>
        ) : (
          <NavLink key={to} to={to} end={end}>
            <Icon name={icon} size={21} />
            <span>{label}</span>
          </NavLink>
        ),
      )}
      <button type="button" className={drawerOpen || pathname === '/cart' ? 'active' : ''} onClick={() => setDrawerOpen(true)} aria-label={`Cart, ${count} items`}>
        <Icon name="bag" size={21} />
        <span>Cart</span>
        <CountBadge count={count} />
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
              <Frame colour="#1C1C1C" glare={false} />
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
  const cols = [
    ['Shop', [['/shop', 'All wall art'], ['/shop?room=living', 'Living room'], ['/shop?room=bedroom', 'Bedroom'], ['/shop?room=office', 'Office'], ['/shop?room=dining', 'Dining room'], ['/shop?sort=bestsellers', 'Bestsellers'], ['/collections', 'Collections']]],
    ['Create', [['/customize', 'Create your own'], ['/customize/photo', 'Upload your photo'], ['/visualise', 'Visualise on your wall'], ['/wall-planner', 'Gallery wall planner'], ['/gift-finder', 'Gift finder'], ['/corporate', 'Corporate gifting']]],
    ['Help', [['/support', 'Help & FAQs'], ['/orders', 'Track my order'], ['/shipping-policy', 'Shipping policy'], ['/refund', 'Returns & refunds'], ['/replacement-policy', 'Replacement promise'], ['/contact', 'Contact us']]],
    ['Jhayra', [['/about', 'About Jhayra'], ['/worlds', 'Worlds'], ['/journal', 'Inspiration journal'], ['/privacy', 'Privacy policy'], ['/terms', 'Terms & conditions']]],
  ];
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p className="footer-claim">Art that lives with you.</p>
            <p>
              Wall art and personalised photo art, handcrafted in India since {BRAND.since}. {BRAND.homes} homes and counting.
            </p>
            <div className="footer-join">
              <b>New collections, first</b>
              <span>Get a WhatsApp message when we launch new art — no spam, leave any time.</span>
              <a className="btn btn-light btn-sm" href={waLink('Hi JHAYRA! Please send me updates about new collections.')} target="_blank" rel="noopener noreferrer">
                <WhatsAppGlyph size={16} /> Join on WhatsApp
              </a>
            </div>
          </div>
          {cols.map(([title, links]) => (
            <div key={title}>
              <h4>{title}</h4>
              <ul>
                {links.map(([to, label]) => (
                  <li key={to}>
                    <Link to={to}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-contact">
          <a href={waLink()} target="_blank" rel="noopener noreferrer">
            <WhatsAppGlyph size={16} /> {SITE.phoneDisplay}
          </a>
          <a href={`mailto:${SITE.email}`}>
            <Icon name="mail" size={16} /> {SITE.email}
          </a>
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
            <Icon name="instagram" size={16} /> @thejhayra
          </a>
          <span>
            <Icon name="clock" size={16} /> Mon–Sat 9–7 · Sun 10–4
          </span>
        </div>
        <div className="footer-word" aria-hidden="true">
          JHAYRA
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} JHAYRA · Made in India</span>
          <nav aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/refund">Refunds</Link>
            <Link to="/shipping-policy">Shipping</Link>
            <Link to="/cookie-policy">Cookies</Link>
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
  const closeMenu = useCallback(() => setMenu(false), []);
  const { pathname } = useLocation();
  const { setDrawerOpen } = useCart();

  const { hash } = useLocation();
  useEffect(() => {
    // A #fragment (e.g. /#signature) is scrolled to by the page itself.
    if (!hash) window.scrollTo(0, 0);
    setMenu(false);
    setDrawerOpen(false);
  }, [pathname, setDrawerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const bottomNav = !(pathname.startsWith('/checkout') || /^\/customize\/.+/.test(pathname));
  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', bottomNav);
    return () => document.body.classList.remove('has-bottom-nav');
  }, [bottomNav]);

  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <Announce />
      <Header onMenu={() => setMenu(true)} menuOpen={menu} />
      {!pathname.startsWith('/checkout') && <SignatureStrip />}
      <main id="main" key={pathname} className="page-enter">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppFab />
      {menu && <MenuSheet onClose={closeMenu} />}
      <CartDrawer />
      <SearchPalette />
    </>
  );
}
