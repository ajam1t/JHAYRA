import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const s = {
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.5rem', color: '#c9a96e', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1.25rem 1.5rem' },
  stat: { fontSize: '2rem', fontWeight: '700', color: '#c9a96e', display: 'block' },
  statLabel: { fontSize: '0.75rem', color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px', display: 'block' },
  section: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '1rem' },
  secTitle: { fontSize: '0.8rem', letterSpacing: '0.12em', color: '#888', textTransform: 'uppercase', marginBottom: '1rem' },
  linkBtn: { display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '6px', color: '#c9a96e', textDecoration: 'none', fontSize: '0.82rem', marginRight: '0.5rem', marginTop: '0.5rem' },
};

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, categories: 0, homepage: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const [{ count: total }, { count: active }, { count: categories }, { count: homepage }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('categories').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('homepage_visible', true),
      ]);
      setStats({ total: total || 0, active: active || 0, inactive: (total || 0) - (active || 0), categories: categories || 0, homepage: homepage || 0 });
      setLoading(false);
    }
    load();
  }, []);

  const items = [
    { label: 'Total Products', value: stats.total },
    { label: 'Active', value: stats.active },
    { label: 'Inactive', value: stats.inactive },
    { label: 'Categories', value: stats.categories },
    { label: 'On Homepage', value: stats.homepage },
  ];

  return (
    <div>
      <h1 style={s.heading}>Dashboard</h1>

      <div style={s.grid}>
        {items.map(({ label, value }) => (
          <div key={label} style={s.card}>
            <span style={s.stat}>{loading ? '…' : value}</span>
            <span style={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.secTitle}>Quick Actions</div>
        <Link to="/admin/products/new" style={s.linkBtn}>+ Add Product</Link>
        <Link to="/admin/products" style={s.linkBtn}>Manage Products</Link>
        <Link to="/admin/categories" style={s.linkBtn}>Manage Categories</Link>
        <a href="/" target="_blank" rel="noopener noreferrer" style={s.linkBtn}>View Storefront ↗</a>
      </div>

      {!supabase && (
        <div style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '8px', padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#c9a96e' }}>
          ⚠ Supabase not configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env.local</code>.
        </div>
      )}
    </div>
  );
}
