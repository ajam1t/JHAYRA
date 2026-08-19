import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

import { T } from './adminUI';

const s = {
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.6rem', color: T.text, marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: T.shadow },
  stat: { fontFamily: 'var(--fd, serif)', fontSize: '2.1rem', fontWeight: '700', color: T.gold, display: 'block' },
  statLabel: { fontSize: '0.72rem', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px', display: 'block' },
  section: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1rem', boxShadow: T.shadow },
  secTitle: { fontSize: '0.72rem', letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 700 },
  linkBtn: { display: 'inline-block', padding: '0.55rem 1.1rem', background: T.goldSoft, border: `1px solid ${T.border2}`, borderRadius: '9px', color: T.goldDeep, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, marginRight: '0.5rem', marginTop: '0.5rem' },
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
