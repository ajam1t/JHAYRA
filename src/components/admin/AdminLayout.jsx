import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '◼' },
  { to: '/admin/orders', label: 'Orders', icon: '📦' },
  { to: '/admin/products', label: 'Products', icon: '🖼' },
  { to: '/admin/categories', label: 'Categories', icon: '📂' },
  { to: '/admin/homepage', label: 'Homepage', icon: '🏠' },
];

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="2" y1="5" x2="20" y2="5" />
      <line x1="2" y1="11" x2="20" y2="11" />
      <line x1="2" y1="17" x2="20" y2="17" />
    </svg>
  );
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  const navLinkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.65rem 0.75rem',
    borderRadius: '6px',
    textDecoration: 'none',
    color: isActive ? '#c9a96e' : '#999',
    fontSize: '0.875rem',
    marginBottom: '2px',
    background: isActive ? 'rgba(201,169,110,0.12)' : 'transparent',
    transition: 'all 0.15s',
  });

  const sidebarStyle = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 1000,
        width: '240px',
        background: '#111',
        borderRight: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 2rem',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        overflowY: 'auto',
      }
    : {
        width: '220px',
        flexShrink: 0,
        background: '#111',
        borderRight: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 2rem',
      };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d4', fontFamily: 'var(--fs, sans-serif)' }}>

      {/* Mobile overlay */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 999 }}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside style={sidebarStyle}>
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid #222', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontFamily: 'var(--fd, serif)', fontSize: '1.3rem', letterSpacing: '0.15em', color: '#c9a96e', display: 'block' }}>JHAYRA</span>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: '#666', textTransform: 'uppercase', display: 'block', marginTop: '2px' }}>Admin Panel</span>
          </div>
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0.3rem' }}
            >
              ✕
            </button>
          )}
        </div>
        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              style={({ isActive }) => navLinkStyle(isActive)}
            >
              <span style={{ fontSize: '0.9rem' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a1a', background: '#0d0d0d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
              >
                <HamburgerIcon />
              </button>
            )}
            <span style={{ fontSize: '0.8rem', color: '#555' }}>{user?.email}</span>
          </div>
          <button
            style={{ background: 'none', border: '1px solid #333', color: '#999', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem' }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
