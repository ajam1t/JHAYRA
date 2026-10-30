import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../state/store';
import { Seo } from '../lib/seo';
import Orders from './Orders';
import { ProductList, ProductForm } from './Products';
import { Categories, FrameOptions, HomepageCollections } from './Catalog';
import Templates from './Templates';
import Festivals from './Festivals';
import Worlds from './Worlds';
import Campaigns from './Campaigns';
import Coupons from './Coupons';
import Dashboard from './Dashboard';
import SignatureManager from './Signature';
import { supabase } from '../lib/supabase';
import { mobile10 } from '../lib/site';
import Gate, { GATE_KEY } from './Gate';
import { FESTIVALS, FESTIVALS_PATH, saveFestivals } from '../lib/festivals';
import { CAMPAIGNS_PATH, DEFAULT_CAMPAIGNS, saveCampaigns } from '../lib/campaigns';
import { TEMPLATES_PATH, saveTemplates } from '../lib/templates';
import { SIGNATURE_PATH, DEFAULT_SIGNATURE, saveSignature } from '../lib/signature';
import seedTemplates from '../templates.json';

// The storefront reads its editable settings from Supabase Storage. Until an
// admin saves each one, every page load hits a missing file (a 400 in the
// console), so the first admin visit stores the current defaults.
let ensured = false;
async function ensureSiteConfig() {
  if (ensured) return;
  ensured = true;
  const missing = async (path) => {
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    const r = await fetch(`${data.publicUrl}?v=${Date.now()}`, { method: 'HEAD' }).catch(() => null);
    return r && !r.ok;
  };
  const jobs = [
    [FESTIVALS_PATH, () => saveFestivals(FESTIVALS)],
    [CAMPAIGNS_PATH, () => saveCampaigns(DEFAULT_CAMPAIGNS)],
    [TEMPLATES_PATH, () => saveTemplates(seedTemplates)],
    [SIGNATURE_PATH, () => saveSignature(DEFAULT_SIGNATURE)],
  ];
  for (const [path, save] of jobs) if (await missing(path)) await save().catch(() => {});
}
import './admin.css';

function Login() {
  const { signIn, user, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem(GATE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const navigate = useNavigate();
  useEffect(() => {
    if (user && isAdmin) navigate('/admin', { replace: true });
  }, [user, isAdmin, navigate]);
  return (
    <div className="ad-login gt-stage">
      <div className="gt-grid" aria-hidden="true" />
      <div className="gt-orb" aria-hidden="true" />
      {!open ? (
        <Gate onUnlock={() => setOpen(true)} />
      ) : (
        <form
          className="gt-card"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            setBusy(true);
            try {
              // Sign-in is by mobile number: it maps to the admin account it's linked to.
              const phone = mobile10(email);
              if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('Please enter your 10-digit mobile number');
              const { data: id } = await supabase.rpc('admin_login_email', { p_phone: phone });
              if (!id) throw new Error('Incorrect mobile number or password');
              await signIn(id, password);
            } catch (x) {
              setErr(/invalid login|incorrect/i.test(x.message || '') ? 'Incorrect mobile number or password' : x.message || 'Sign in failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="gt-card-head">
            <img src="/founder/sandeep-jha.webp" alt="" width="48" height="48" />
            <div>
              <b>Hello, Sandeep</b>
              <small>Sign in to the JHAYRA studio</small>
            </div>
          </div>
          <label className="gt-field">
            <span>Mobile number</span>
            <input type="tel" inputMode="tel" autoComplete="username" maxLength={16} required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </label>
          <label className="gt-field">
            <span>Password</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {err && <div className="gt-err">{err}</div>}
          {user && !isAdmin && <div className="gt-err">This account doesn't have access.</div>}
          <button className="gt-go" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'} <Icon name="arrow" size={17} />
          </button>
          <Link to="/" className="gt-back">
            <Icon name="arrowL" size={14} /> Back to store
          </Link>
        </form>
      )}
    </div>
  );
}

const NAV = [
  ['Overview', [['/admin', 'Dashboard', 'grid', true]]],
  [
    'Sell',
    [
      ['/admin/orders', 'Orders', 'box'],
      ['/admin/products', 'Products', 'image'],
      ['/admin/templates', 'Personalised templates', 'sparkle'],
      ['/admin/signature', 'Signature collection', 'star'],
    ],
  ],
  [
    'Marketing',
    [
      ['/admin/campaigns', 'Events & Campaigns', 'calendar'],
      ['/admin/coupons', 'Coupons', 'rupee'],
      ['/admin/festivals', 'Festivals & offers', 'gift'],
      ['/admin/homepage', 'Homepage collections', 'home'],
    ],
  ],
  [
    'Catalogue',
    [
      ['/admin/worlds', 'Worlds & starter art', 'palette'],
      ['/admin/categories', 'Categories', 'filter'],
      ['/admin/catalog', 'Sizes & finishes', 'wall'],
    ],
  ],
];
const FLAT = NAV.flatMap(([, l]) => l);
const TABS = [FLAT[0], FLAT[1], FLAT[2], ['/admin/campaigns', 'Events', 'calendar']];

// Phones: "More" opens a bottom sheet with every section, the account and
// sign-out (the side menu is for larger screens).
function MoreSheet({ user, onClose, signOut }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="ad-more" role="dialog" aria-modal="true" aria-label="All sections">
      <button type="button" className="ad-more-scrim" aria-label="Close" onClick={onClose} />
      <div className="ad-more-sheet">
        <span className="ad-more-grab" aria-hidden="true" />
        <div className="ad-more-me">
          <img src="/founder/sandeep-jha.webp" alt="" width="44" height="44" />
          <div>
            <b>Sandeep Jha</b>
            <small>Owner · JHAYRA Studio</small>
          </div>
          <button type="button" className="ad-more-x" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        {NAV.map(([group, links]) => (
          <div key={group} className="ad-more-group">
            <span>{group}</span>
            <div className="ad-more-grid">
              {links.map(([to, label, ic, end], i) => (
                <NavLink key={to} to={to} end={end} onClick={onClose} style={{ '--i': i }}>
                  <i>
                    <Icon name={ic} size={20} />
                  </i>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <div className="ad-more-foot">
          <a href="/" target="_blank" rel="noreferrer">
            <Icon name="arrow" size={17} /> View store
          </a>
          <button type="button" onClick={signOut}>
            <Icon name="logout" size={17} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function SideNav({ onPick }) {
  return (
    <nav onClick={onPick}>
      {NAV.map(([group, links]) => (
        <div key={group} className="ad-nav-group">
          <span>{group}</span>
          {links.map(([to, label, ic, end]) => (
            <NavLink key={to} to={to} end={end}>
              <Icon name={ic} size={18} /> {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (user && isAdmin) ensureSiteConfig();
  }, [user, isAdmin]);
  if (loading) return <div className="ad-login ad-muted">Loading…</div>;
  return (
    <>
      <Seo title="Studio" path="/admin" noindex />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          path="*"
          element={
            !user || !isAdmin ? (
              <Navigate to="/admin/login" replace />
            ) : (
              <div className={`ad ${open ? 'nav-open' : ''}`}>
                <aside className="ad-side" aria-label="Studio menu">
                  <Link to="/admin" className="ad-brand" onClick={() => setOpen(false)}>
                    <img src="/logo-mark.webp" alt="" width="30" height="27" />
                    <span>
                      JHAYRA <small>Studio</small>
                    </span>
                  </Link>
                  <SideNav onPick={() => setOpen(false)} />
                  <div className="ad-side-foot">
                    <a href="/" target="_blank" rel="noreferrer" className="ad-btn ad-btn-ghost">
                      View store ↗
                    </a>
                    <small>Signed in as owner</small>
                    <button className="ad-btn ad-btn-ghost" onClick={signOut}>
                      <Icon name="logout" size={16} /> Sign out
                    </button>
                  </div>
                </aside>
                {open && <button className="ad-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
                {open && <MoreSheet user={user} signOut={signOut} onClose={() => setOpen(false)} />}
                <header className="ad-top">
                  <Link to="/admin" className="ad-top-brand">
                    <img src="/logo-mark.webp" alt="" width="26" height="23" /> Studio
                  </Link>
                  <button type="button" className="ad-top-me" onClick={() => setOpen(true)} aria-label="Account and all sections">
                    <img src="/founder/sandeep-jha.webp" alt="" width="34" height="34" />
                  </button>
                  <a href="/" target="_blank" rel="noreferrer" className="ad-top-link">
                    Store ↗
                  </a>
                </header>
                <main className="ad-main">
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="products" element={<ProductList />} />
                    <Route path="products/:id" element={<ProductForm />} />
                    <Route path="templates" element={<Templates />} />
                    <Route path="festivals" element={<Festivals />} />
                    <Route path="homepage" element={<HomepageCollections />} />
                    <Route path="worlds" element={<Worlds />} />
                    <Route path="campaigns" element={<Campaigns />} />
                    <Route path="coupons" element={<Coupons />} />
                    <Route path="signature" element={<SignatureManager />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="catalog" element={<FrameOptions />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </main>
                <nav className="ad-tabs" aria-label="Studio sections">
                  {TABS.map(([to, label, ic, end]) => (
                    <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
                      <Icon name={ic} size={20} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                  <button type="button" className={open ? 'active' : ''} onClick={() => setOpen((x) => !x)} aria-expanded={open}>
                    <Icon name="menu" size={20} />
                    <span>More</span>
                  </button>
                </nav>
              </div>
            )
          }
        />
      </Routes>
    </>
  );
}
