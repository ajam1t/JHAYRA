import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon, { InstagramLogo, WhatsAppGlyph } from './Icon';
import Frame from './Frame';
import Img from './Img';
import { optimized } from '../lib/img';
import { useCart } from '../state/cart';
import { trackView } from '../lib/analytics';
import { useShop } from '../state/store';
import { SITE, money, waLink } from '../lib/site';
import { BRAND } from '../lib/brand';
import { loadProducts, searchProducts } from '../lib/catalog';
import { useTemplates } from '../lib/templates';
import { useFestival } from '../state/festival';
import { useActiveCampaign } from '../lib/campaigns';
import { useSignature } from '../lib/signature';
import { EventStrip } from './EventExperience';

// Cinematic opening: decided before first paint by the script in index.html.
// Its code only downloads when it will actually play.
const INTRO = typeof document !== 'undefined' && document.documentElement.classList.contains('jh-intro');
const GatewayIntro = INTRO ? lazy(() => import('./GatewayIntro')) : null;
// If the opening can't load or breaks, the visitor simply gets the homepage.
class IntroGuard extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    document.documentElement.classList.remove('jh-intro', 'jh-intro-run');
    const root = document.getElementById('root');
    if (root) root.inert = false;
    this.props.onDone();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Desktop header. Visualise stays one tap away from product pages, Create
// and the menu rather than taking a permanent slot here.
const NAV = [
  ['/', 'Home', true],
  ['/shop', 'Shop'],
  ['/customize', 'Create'],
  ['/gift-finder', 'Gift Finder'],
  ['/celebrations', 'Celebrations'],
];

// Hamburger menu, grouped. Every route here exists in App.jsx.
const MENU = [
  ['Shop', [['/shop', 'All Wall Art'], ['/shop?room=living', 'Living Room'], ['/shop?room=bedroom', 'Bedroom'], ['/shop?room=office', 'Office'], ['/shop?room=dining', 'Dining Room'], ['/customize', 'Personalised Frames']]],
  ['Create', [['/customize', 'Create Your Own Art'], ['/customize/photo', 'Upload Your Photo'], ['/visualise', 'Visualise on Your Wall'], ['/wall-planner', 'Plan a Gallery Wall']]],
  ['Celebrations', [['/celebrations', 'All Celebrations'], ['/worlds/festivals', 'Festivals'], ['/worlds/wedding', 'Weddings'], ['/customize?moment=anniversary', 'Anniversaries'], ['/customize?moment=birthday', 'Birthdays'], ['/collections/art-for-gifting', 'Gifting']]],
  ['Discover', [['/signature-experience', 'Signature Experience ✦'], ['/gift-finder', 'Gift Finder'], ['/shop?sort=bestsellers', 'Bestsellers'], ['/shop?sort=new', 'New Arrivals'], ['/collections', 'Collections'], ['/worlds', 'Worlds'], ['/journal', 'Inspiration Journal']]],
  ['About', [['/about', 'Our Story'], ['/contact', 'Contact'], ['/support', 'Help & FAQs'], ['/orders', 'My Orders'], ['/wishlist', 'Wishlist'], ['/corporate', 'Corporate Gifting']]],
];

// Always lands on the top of the homepage: from another page it navigates;
// on the homepage itself it clears any hash and scrolls up.
// Home links: on the homepage itself, clear any #hash/?query and scroll to the top.
function useHomeClick(onNavigate) {
  const { pathname, hash, search } = useLocation();
  const navigate = useNavigate();
  return (e) => {
    onNavigate?.();
    if (pathname !== '/') return;
    e.preventDefault();
    if (hash || search) navigate('/', { replace: true });
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
}

function Logo({ onNavigate }) {
  const { pathname } = useLocation();
  // On the homepage the logo reloads it fresh (latest event, offers, artwork).
  const onClick = (e) => {
    onNavigate?.();
    if (pathname !== '/' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    window.scrollTo(0, 0);
    window.location.assign('/');
  };
  return (
    <Link to="/" className="logo" aria-label="JHAYRA home" onClick={onClick}>
      <img className="logo-mark" src="/logo-mark-88.webp" srcSet="/logo-mark-88.webp 88w, /logo-mark.webp 180w" sizes="44px" alt="" width="44" height="40" fetchpriority="high" />
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
  const homeClick = useHomeClick();
  const { count } = useCart();
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
            <NavLink key={to} to={to} end={end} onClick={to === '/' ? homeClick : undefined}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions header-text-actions">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search (Ctrl K)">
            Search
          </button>
          <Link to="/cart" aria-label={`Bag, ${count} items`}>
            Bag{count > 0 ? ` (${count})` : ''}
          </Link>
        </div>
      </div>
    </header>
  );
}

// Slim strip under the header. On the homepage it carries the live campaign
// (e.g. Diwali) when there is one; everywhere else it invites people to the
// Signature Experience.
export function SignatureInvite({ className = '' }) {
  return (
      <Link to="/signature-experience" className={`sg-strip ${className}`} aria-label="The Jhayra Signature Experience — discover the experience">
        <span className="sg-strip-title">
          <b>The Jhayra</b>
          <em>Signature Experience</em>
        </span>
        <span className="sg-strip-sub">Artistry · Exclusivity · Personal Service</span>
        <span className="sg-strip-cta">
          <span>Discover the Experience</span> <Icon name="arrow" size={13} stroke={2} />
        </span>
      </Link>
  );
}

function TopStrip() {
  const { pathname } = useLocation();
  const c = useActiveCampaign();
  const sig = useSignature();
  if (pathname === '/') {
    if (c?.showStrip) return <EventStrip c={c} />;
    // No festival running: feature the Mithila (Madhubani) heritage collection.
    return (
      <Link to="/worlds/heritage" className="fest-strip mith-strip">
        <span className="mith-motif" aria-hidden="true">
          ❁
        </span>
        <span className="fest-text">
          <span className="fest-kicker">Heritage of Bihar</span>
          <em>Mithila Art</em>
        </span>
        <span className="mith-motif" aria-hidden="true">
          ❁
        </span>
        <span className="fest-cta">
          Explore <Icon name="arrow" size={13} stroke={2} />
        </span>
      </Link>
    );
  }
  return (
    sig.enabled !== false && <SignatureInvite />
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

// Ivory side drawer: the main sections with artwork thumbnails, expanding
// into their links; Discover and About as compact links below.
const MAIN = [
  ['Shop', 'Wall art for every room', 'Shop'],
  ['Create', 'Design your own frame', 'Create'],
  ['Gift Finder', 'The right gift in five questions', null, '/gift-finder'],
  ['Celebrations', 'Festivals, weddings & gifting', 'Celebrations'],
  ['Signature', 'Founder-curated collection', null, '/signature-experience', true],
];
const SUB = Object.fromEntries(MENU);

function MenuSheet({ onClose, returnFocus }) {
  const [closing, setClosing] = useState(false);
  const shut = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 360);
  }, [onClose]);
  const homeClick = useHomeClick(shut);
  const { setSearchOpen } = useShop();
  const panel = useRef(null);
  const { pathname, search } = useLocation();
  const here = (to) => to === pathname + search || (to !== '/' && !to.includes('?') && pathname.startsWith(to));
  const [open, setOpen] = useState(() => MAIN.find(([, , sub]) => sub && SUB[sub].some(([to]) => to === pathname + search))?.[0] || '');
  const [art, setArt] = useState([]);
  useEffect(() => {
    loadProducts()
      .then((l) => setArt((l || []).filter((p) => p.thumbnail && p.is_bestseller)))
      .catch(() => {});
  }, []);
  const thumbs = [art[0], art[3], art[6], art[2]];
  // Focus the panel, trap Tab inside it, close on Escape, restore focus on close.
  useEffect(() => {
    const el = panel.current;
    const opener = document.activeElement;
    el?.querySelector('.m5-close')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        shut();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const f = [...el.querySelectorAll('a[href], button:not([disabled])')].filter((n) => n.offsetParent !== null && n.tabIndex !== -1);
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
  }, [shut, returnFocus]);

  return (
    <div className={`m5-wrap ${closing ? 'closing' : ''}`}>
      <div className="m5-scrim" onClick={shut} />
      <aside className="m5" id="site-menu" role="dialog" aria-modal="true" aria-label="Menu" ref={panel}>
        <div className="m5-head">
          <Logo onNavigate={shut} />
          <button type="button" className="m5-close" onClick={shut} aria-label="Close menu">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="m5-body">
          <button type="button" className="m5-search" onClick={() => (shut(), setTimeout(() => setSearchOpen(true), 250))}>
            <Icon name="search" size={18} /> Search art, designs and gifts
          </button>
          <Link to="/" className={`m5-home ${pathname === '/' ? 'on' : ''}`} onClick={homeClick} style={{ '--i': 0 }}>
            <Icon name="home" size={17} /> Home
          </Link>
          <ul className="m5-main">
            {MAIN.map(([label, sub, group, to, gold], i) => {
              const kids = group ? SUB[group] : null;
              const isOpen = open === label;
              const img = thumbs[i];
              const inner = (
                <>
                  <span className={`m5-thumb ${gold ? 'gold' : ''}`} aria-hidden="true">
                    {gold ? <span>✦</span> : img ? <img src={optimized(img.thumbnail, 160)} alt="" loading="lazy" decoding="async" /> : null}
                  </span>
                  <span className="m5-txt">
                    <b>{label}</b>
                    <small>{sub}</small>
                  </span>
                  <Icon name={kids ? 'chevronD' : 'chevron'} size={18} />
                </>
              );
              return (
                <li key={label} className={`m5-item ${isOpen ? 'open' : ''} ${gold ? 'gold' : ''}`} style={{ '--i': i + 1 }}>
                  {kids ? (
                    <button type="button" className="m5-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : label)}>
                      {inner}
                    </button>
                  ) : (
                    <Link to={to} className={`m5-row ${here(to) ? 'on' : ''}`} onClick={shut}>
                      {inner}
                    </Link>
                  )}
                  {kids && (
                    <div className="m5-sub">
                      <ul>
                        {kids.map(([kto, kl], j) => (
                          <li key={kto + kl} style={{ '--j': j }}>
                            <Link to={kto} onClick={shut} tabIndex={isOpen ? undefined : -1} className={here(kto) ? 'on' : ''}>
                              {kl}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="m5-more">
            {['Discover', 'About'].map((g, gi) => (
              <nav key={g} aria-label={g} style={{ '--i': 7 + gi }}>
                <h2>{g}</h2>
                <ul>
                  {SUB[g]
                    .filter(([to]) => to !== '/signature-experience' && to !== '/gift-finder')
                    .map(([to, l]) => (
                      <li key={to + l}>
                        <Link to={to} onClick={shut} className={here(to) ? 'on' : ''}>
                          {l}
                        </Link>
                      </li>
                    ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="m5-foot">
          <a className="m5-wa" href={waLink('Hi JHAYRA! I need help choosing a frame.')} target="_blank" rel="noopener noreferrer">
            <WhatsAppGlyph size={18} /> Chat on WhatsApp
          </a>
          <Link to="/wishlist" onClick={shut} className="m5-ic" aria-label="Wishlist">
            <Icon name="heart" size={18} />
          </Link>
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="m5-ic" aria-label="Instagram">
            <Icon name="instagram" size={18} />
          </a>
        </div>
      </aside>
    </div>
  );
}

const BOTTOM = [
  ['/', 'Home', 'home', true],
  ['/shop', 'Shop', 'grid'],
  ['/customize', 'Create', 'sparkle'],
  ['/gift-finder', 'Gift Finder', 'gift'],
];
function BottomNav() {
  const { count } = useCart();
  const homeClick = useHomeClick();
  const { pathname } = useLocation();
  // Checkout and the design editors have their own fixed action bars.
  if (pathname.startsWith('/checkout') || /^\/customize\/.+/.test(pathname)) return null;
  return (
    <nav className="bottom-nav" aria-label="Quick">
      {BOTTOM.map(([to, label, icon, end]) => (
        <NavLink key={to} to={to} end={end} onClick={to === '/' ? homeClick : undefined}>
          <span className="bn-ic" aria-hidden="true">
            <Icon name={icon} size={21} />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
      <NavLink to="/cart" aria-label={`Bag, ${count} items`}>
        <span className="bn-ic" aria-hidden="true">
          <Icon name="bag" size={21} />
        </span>
        <span>Bag</span>
        <CountBadge count={count} />
      </NavLink>
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
      <aside className="sheet sheet-right" role="dialog" aria-modal="true" aria-label="Your bag">
        <div className="sheet-head">
          <h2>
            Your bag <span className="muted small">({count})</span>
          </h2>
          <button className="icon-btn" onClick={close} aria-label="Close bag">
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
              View bag & apply coupon
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
    ['Shop', [['/shop', 'All wall art'], ['/shop?sort=bestsellers', 'Bestsellers'], ['/collections', 'Collections'], ['/customize', 'Create your own'], ['/gift-finder', 'Gift finder'], ['/corporate', 'Corporate gifting']]],
    ['Help', [['/support', 'Help & FAQs'], ['/track', 'Track my order'], ['/shipping-policy', 'Shipping'], ['/refund', 'Returns & refunds'], ['/contact', 'Contact us']]],
    ['Jhayra', [['/signature-experience', 'Signature'], ['/about', 'About us'], ['/worlds', 'Worlds'], ['/journal', 'Journal'], ['/visualise', 'Visualise']]],
  ];
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>Handcrafted wall art and personalised frames, made in India since {BRAND.since}.</p>
            <div className="footer-social">
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" aria-label="JHAYRA on Instagram" className="fs-ig">
                <InstagramLogo size={40} />
              </a>
              <a href={waLink()} target="_blank" rel="noopener noreferrer" aria-label="Chat with JHAYRA on WhatsApp" className="fs-wa">
                <WhatsAppGlyph size={20} />
              </a>
            </div>
          </div>
          {cols.map(([title, links]) => (
            <nav key={title} className="footer-col" aria-label={title}>
              <h4>{title}</h4>
              <ul>
                {links.map(([to, label]) => (
                  <li key={to}>
                    <Link to={to}>{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} JHAYRA · Made in India</span>
          <nav aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
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
  const [intro, setIntro] = useState(INTRO);
  const endIntro = useCallback(() => setIntro(false), []);
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
  useEffect(() => trackView(pathname), [pathname]);

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
      {!pathname.startsWith('/checkout') && <TopStrip />}
      <main id="main" key={pathname} className="page-enter">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppFab />
      {menu && <MenuSheet onClose={closeMenu} />}
      <CartDrawer />
      <SearchPalette />
      {intro && GatewayIntro && (
        <IntroGuard onDone={endIntro}>
          <Suspense fallback={null}>
            <GatewayIntro onDone={endIntro} />
          </Suspense>
        </IntroGuard>
      )}
    </>
  );
}
