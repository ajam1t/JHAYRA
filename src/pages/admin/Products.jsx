import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const s = {
  toprow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.5rem', color: '#c9a96e', margin: 0 },
  addBtn: { display: 'inline-block', padding: '0.55rem 1.1rem', background: '#c9a96e', color: '#0a0a0a', borderRadius: '7px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' },
  searchRow: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  search: { flex: 1, minWidth: '200px', background: '#111', border: '1px solid #222', borderRadius: '7px', color: '#e8e0d4', padding: '0.55rem 0.9rem', fontSize: '0.875rem', outline: 'none' },
  select: { background: '#111', border: '1px solid #222', borderRadius: '7px', color: '#e8e0d4', padding: '0.55rem 0.9rem', fontSize: '0.875rem', outline: 'none' },
  wrap: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.65rem 1rem', fontSize: '0.7rem', letterSpacing: '0.1em', color: '#666', textTransform: 'uppercase', borderBottom: '1px solid #1e1e1e' },
  td: { padding: '0.7rem 1rem', borderBottom: '1px solid #161616', color: '#ccc', verticalAlign: 'middle' },
  badge: (active) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', background: active ? 'rgba(80,200,120,0.12)' : 'rgba(200,80,80,0.12)', color: active ? '#6cda96' : '#e07070', border: `1px solid ${active ? 'rgba(80,200,120,0.25)' : 'rgba(200,80,80,0.25)'}` }),
  homeBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', background: 'rgba(201,169,110,0.1)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.2)' },
  actionBtn: (variant = 'default') => ({ border: 'none', borderRadius: '5px', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.72rem', marginLeft: '4px', background: variant === 'danger' ? 'rgba(200,80,80,0.15)' : variant === 'edit' ? 'rgba(100,140,200,0.12)' : 'rgba(201,169,110,0.1)', color: variant === 'danger' ? '#e07070' : variant === 'edit' ? '#7aaeee' : '#c9a96e' }),
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('id,legacy_id,name,category_slug,price,is_bestseller,homepage_visible,active,display_order').order('display_order'),
      supabase.from('categories').select('slug,name').order('display_order'),
    ]);
    setProducts(prods || []);
    setCategories(cats || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(p) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    load();
  }

  async function toggleHomepage(p) {
    await supabase.from('products').update({ homepage_visible: !p.homepage_visible }).eq('id', p.id);
    load();
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.legacy_id || '').includes(search);
    const matchCat = filterCat === 'all' || p.category_slug === filterCat;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? p.active : !p.active);
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div>
      <div style={s.toprow}>
        <h1 style={s.heading}>Products</h1>
        <Link to="/admin/products/new" style={s.addBtn}>+ Add Product</Link>
      </div>

      <div style={s.searchRow}>
        <input style={s.search} placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={s.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div style={s.wrap}>
        {loading ? (
          <div style={{ padding: '2rem', color: '#555', textAlign: 'center' }}>Loading…</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Name</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Price</th>
                <th style={s.th}>Homepage</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>{p.legacy_id}</td>
                  <td style={{ ...s.td, fontWeight: '500', color: '#e8e0d4' }}>{p.name}</td>
                  <td style={{ ...s.td, fontSize: '0.8rem', color: '#888' }}>{p.category_slug}</td>
                  <td style={s.td}>₹{p.price}</td>
                  <td style={s.td}>
                    {p.homepage_visible && <span style={s.homeBadge}>Visible</span>}
                  </td>
                  <td style={s.td}>
                    <span style={s.badge(p.active)}>{p.active ? 'Active' : 'Hidden'}</span>
                  </td>
                  <td style={s.td}>
                    <Link to={`/admin/products/${p.id}`} style={{ ...s.actionBtn('edit'), textDecoration: 'none', display: 'inline-block' }}>Edit</Link>
                    <button style={s.actionBtn()} onClick={() => toggleHomepage(p)}>
                      {p.homepage_visible ? 'Hide HP' : 'Show HP'}
                    </button>
                    <button style={s.actionBtn(p.active ? 'danger' : 'default')} onClick={() => toggleActive(p)}>
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{ ...s.td, textAlign: 'center', color: '#555', padding: '2rem' }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#555' }}>
        Showing {filtered.length} of {products.length} products
      </div>
    </div>
  );
}
