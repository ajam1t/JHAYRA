import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

import { T } from './adminUI';

const s = {
  toprow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.6rem', color: T.text, margin: 0 },
  addBtn: { display: 'inline-block', padding: '0.6rem 1.15rem', background: T.gold, color: '#fff', borderRadius: '9px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '700', boxShadow: '0 2px 8px rgba(182,141,64,.28)' },
  searchRow: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  search: { flex: 1, minWidth: '200px', background: T.surface, border: `1.5px solid ${T.border2}`, borderRadius: '9px', color: T.text, padding: '0.6rem 0.9rem', fontSize: '0.875rem', outline: 'none' },
  select: { background: T.surface, border: `1.5px solid ${T.border2}`, borderRadius: '9px', color: T.text2, padding: '0.6rem 0.9rem', fontSize: '0.875rem', outline: 'none' },
  wrap: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', overflowX: 'auto', boxShadow: T.shadow },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.68rem', letterSpacing: '0.1em', color: T.muted, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}`, background: T.surface2 },
  td: { padding: '0.75rem 1rem', borderBottom: `1px solid ${T.border}`, color: T.text2, verticalAlign: 'middle' },
  badge: (active) => ({ display: 'inline-block', padding: '2px 9px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600, background: active ? T.okBg : '#F2ECE0', color: active ? T.ok : T.muted2, border: `1px solid ${active ? '#BFE3C6' : T.border2}` }),
  homeBadge: { display: 'inline-block', padding: '2px 9px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600, background: T.goldSoft, color: T.goldDeep, border: `1px solid ${T.border2}` },
  actionBtn: (variant = 'default') => ({ border: `1.5px solid ${variant === 'danger' ? '#EBC3B7' : variant === 'edit' ? '#C3D3EB' : T.border2}`, borderRadius: '7px', padding: '0.45rem 0.7rem', minHeight: '34px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, marginLeft: '4px', background: variant === 'danger' ? T.dangerBg : variant === 'edit' ? '#EDF2FB' : T.surface, color: variant === 'danger' ? T.danger : variant === 'edit' ? '#3A6BB0' : T.text2 }),
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
          <div style={{ padding: '2rem', color: T.muted2, textAlign: 'center' }}>Loading…</div>
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
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.75rem', color: T.muted2 }}>{p.legacy_id}</td>
                  <td style={{ ...s.td, fontWeight: '500', color: T.text }}>{p.name}</td>
                  <td style={{ ...s.td, fontSize: '0.8rem', color: T.muted2 }}>{p.category_slug}</td>
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
                <tr><td colSpan="7" style={{ ...s.td, textAlign: 'center', color: T.muted2, padding: '2rem' }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: T.muted2 }}>
        Showing {filtered.length} of {products.length} products
      </div>
    </div>
  );
}
