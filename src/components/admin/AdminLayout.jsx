import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '◼' },
  { to: '/admin/orders', label: 'Orders', icon: '📦' },
  { to: '/admin/products', label: 'Products', icon: '🖼' },
  { to: '/admin/categories', label: 'Categories', icon: '📂' },
];

const s = {
  layout: { display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d4', fontFamily: 'var(--fs, sans-serif)' },
  sidebar: { width: '220px', flexShrink: 0, background: '#111', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', padding: '0 0 2rem' },
  logo: { padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid #222', marginBottom: '1rem' },
  logoText: { fontFamily: 'var(--fd, serif)', fontSize: '1.3rem', letterSpacing: '0.15em', color: '#c9a96e', display: 'block' },
  logoSub: { fontSize: '0.65rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginTop: '2px' },
  nav: { flex: 1, padding: '0 0.75rem' },
  link: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.75rem', borderRadius: '6px', textDecoration: 'none', color: '#999', fontSize: '0.875rem', marginBottom: '2px', transition: 'all 0.15s' },
  linkActive: { background: 'rgba(201,169,110,0.12)', color: '#c9a96e' },
  main: { flex: 1, overflow: 'auto' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a1a', background: '#0d0d0d' },
  signout: { background: 'none', border: '1px solid #333', color: '#999', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem' },
  content: { padding: '1.5rem' },
};

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div style={s.layout}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={s.logoText}>JHAYRA</span>
          <span style={s.logoSub}>Admin Panel</span>
        </div>
        <nav style={s.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              style={({ isActive }) => ({ ...s.link, ...(isActive ? s.linkActive : {}) })}
            >
              <span style={{ fontSize: '0.9rem' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div style={s.main}>
        <div style={s.topbar}>
          <span style={{ fontSize: '0.8rem', color: '#555' }}>{user?.email}</span>
          <button style={s.signout} onClick={handleSignOut}>Sign out</button>
        </div>
        <div style={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
