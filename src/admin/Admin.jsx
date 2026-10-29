import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../state/store';
import { supabase } from '../lib/supabase';
import { money } from '../lib/site';
import { Seo } from '../lib/seo';
import Orders from './Orders';
import { ProductList, ProductForm } from './Products';
import { Categories, FrameOptions, HomepageCollections } from './Catalog';
import Templates from './Templates';
import Festivals from './Festivals';
import Worlds from './Worlds';
import Campaigns from './Campaigns';
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

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: orders }, { count: products }] = await Promise.all([
        supabase.from('orders').select('id,order_number,customer_name,total_amount,payment_status,order_status,created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
      ]);
      const list = orders || [];
      const paid = list.filter((o) => o.payment_status === 'paid');
      const recent = paid.filter((o) => o.created_at >= since);
      setStats({
        products,
        paid30: recent.length,
        revenue30: recent.reduce((s, o) => s + (+o.total_amount || 0), 0),
        toShip: paid.filter((o) => !['shipped', 'delivered', 'cancelled'].includes(o.order_status)).length,
        latest: list.slice(0, 8),
      });
    })();
  }, []);
  if (!stats) return <div className="ad-muted">Loading…</div>;
  return (
    <>
      <h1 className="ad-h1">Dashboard</h1>
      <div className="ad-stats">
        <div>
          <span>Revenue, last 30 days</span>
          <b>{money(stats.revenue30)}</b>
        </div>
        <div>
          <span>Paid orders, 30 days</span>
          <b>{stats.paid30}</b>
        </div>
        <div>
          <span>Waiting to ship</span>
          <b>{stats.toShip}</b>
        </div>
        <div>
          <span>Live products</span>
          <b>{stats.products ?? '—'}</b>
        </div>
      </div>
      <div className="ad-card">
        <div className="ad-row-between">
          <h2>Latest orders</h2>
          <Link to="/admin/orders" className="ad-link">
            All orders →
          </Link>
        </div>
        <table className="ad-table">
          <tbody>
            {stats.latest.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number || o.id.slice(0, 8)}</td>
                <td>{o.customer_name}</td>
                <td>{money(o.total_amount)}</td>
                <td>
                  <span className={`ad-badge s-${o.payment_status}`}>{o.payment_status}</span>
                </td>
                <td>
                  <span className="ad-badge">{o.order_status}</span>
                </td>
                <td className="ad-muted">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {!stats.latest.length && (
              <tr>
                <td className="ad-muted">No orders yet — they’ll appear here the moment someone pays.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="ad-tips ad-card">
        <h2>Quick links</h2>
        <div className="ad-quick">
          <Link to="/admin/products/new">+ Add product</Link>
          <Link to="/admin/templates">Edit personalised templates</Link>
          <Link to="/admin/festivals">Festival themes & offers</Link>
          <Link to="/admin/homepage">Homepage collections</Link>
          <a href="/?festival=diwali" target="_blank" rel="noreferrer">
            Preview Diwali theme ↗
          </a>
        </div>
      </div>
    </>
  );
}

const NAV = [
  ['/admin', 'Dashboard', 'home', true],
  ['/admin/orders', 'Orders', 'box'],
  ['/admin/products', 'Products', 'grid'],
  ['/admin/templates', 'Templates', 'sparkle'],
  ['/admin/campaigns', 'Campaigns', 'calendar'],
  ['/admin/festivals', 'Festivals & offers', 'gift'],
  ['/admin/homepage', 'Homepage', 'image'],
  ['/admin/worlds', 'Worlds', 'sparkle'],
  ['/admin/categories', 'Categories', 'filter'],
  ['/admin/catalog', 'Sizes & finishes', 'wall'],
];

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
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
                <aside className="ad-side">
                  <Link to="/" className="ad-brand">
                    <img src="/logo-mark.webp" alt="" width="30" height="27" /> JHAYRA
                  </Link>
                  <nav onClick={() => setOpen(false)}>
                    {NAV.map(([to, label, ic, end]) => (
                      <NavLink key={to} to={to} end={end}>
                        <Icon name={ic} size={18} /> {label}
                      </NavLink>
                    ))}
                  </nav>
                  <div className="ad-side-foot">
                    <small>{user.email}</small>
                    <button className="ad-btn" onClick={signOut}>
                      <Icon name="logout" size={16} /> Sign out
                    </button>
                  </div>
                </aside>
                <main className="ad-main">
                  <button className="ad-menu" onClick={() => setOpen((o) => !o)} aria-label="Menu">
                    <Icon name="menu" />
                  </button>
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
                    <Route path="categories" element={<Categories />} />
                    <Route path="catalog" element={<FrameOptions />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </main>
              </div>
            )
          }
        />
      </Routes>
    </>
  );
}
