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
import Dashboard from './Dashboard';
import SignatureManager from './Signature';
import { supabase } from '../lib/supabase';
import { FESTIVALS, FESTIVALS_PATH, saveFestivals } from '../lib/festivals';
import { CAMPAIGNS_PATH, DEFAULT_CAMPAIGNS, saveCampaigns } from '../lib/campaigns';
import { TEMPLATES_PATH, saveTemplates } from '../lib/templates';
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
  const navigate = useNavigate();
  useEffect(() => {
    if (user && isAdmin) navigate('/admin', { replace: true });
  }, [user, isAdmin, navigate]);
  return (
    <div className="ad-login">
      <form
        className="ad-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr('');
          setBusy(true);
          try {
            await signIn(email, password);
          } catch (x) {
            setErr(x.message || 'Sign in failed');
          } finally {
            setBusy(false);
          }
        }}
      >
        <img src="/logo-mark.webp" alt="" width="56" height="50" style={{ margin: '0 auto 8px' }} />
        <h1>JHAYRA Admin</h1>
        <label>
          Email
          <input className="ad-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input className="ad-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {err && <div className="ad-err">{err}</div>}
        {user && !isAdmin && <div className="ad-err">This account doesn't have admin access.</div>}
        <button className="ad-btn ad-btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="ad-muted" style={{ textAlign: 'center' }}>
          ← Back to store
        </Link>
      </form>
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
      <Seo title="Admin" path="/admin" noindex />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          path="*"
          element={
            !user || !isAdmin ? (
              <Navigate to="/admin/login" replace />
            ) : (
              <div className={`ad ${open ? 'nav-open' : ''}`}>
                <aside className="ad-side" aria-label="Admin menu">
                  <Link to="/admin" className="ad-brand" onClick={() => setOpen(false)}>
                    <img src="/logo-mark.webp" alt="" width="30" height="27" />
                    <span>
                      JHAYRA <small>Admin</small>
                    </span>
                  </Link>
                  <SideNav onPick={() => setOpen(false)} />
                  <div className="ad-side-foot">
                    <a href="/" target="_blank" rel="noreferrer" className="ad-btn ad-btn-ghost">
                      View store ↗
                    </a>
                    <small>{user.email}</small>
                    <button className="ad-btn ad-btn-ghost" onClick={signOut}>
                      <Icon name="logout" size={16} /> Sign out
                    </button>
                  </div>
                </aside>
                {open && <button className="ad-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
                <header className="ad-top">
                  <Link to="/admin" className="ad-top-brand">
                    <img src="/logo-mark.webp" alt="" width="26" height="23" /> Admin
                  </Link>
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
                    <Route path="signature" element={<SignatureManager />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="catalog" element={<FrameOptions />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </main>
                <nav className="ad-tabs" aria-label="Admin sections">
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
