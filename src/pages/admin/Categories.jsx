import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const s = {
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.5rem', color: '#c9a96e', margin: 0 },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '520px' },
  th: { textAlign: 'left', padding: '0.65rem 1rem', fontSize: '0.7rem', letterSpacing: '0.1em', color: '#666', textTransform: 'uppercase', borderBottom: '1px solid #1e1e1e', whiteSpace: 'nowrap' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid #161616', color: '#ccc', verticalAlign: 'middle' },
  badge: (active) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', background: active ? 'rgba(80,200,120,0.12)' : 'rgba(200,80,80,0.12)', color: active ? '#6cda96' : '#e07070', border: `1px solid ${active ? 'rgba(80,200,120,0.25)' : 'rgba(200,80,80,0.25)'}` }),
  btn: (variant = 'default') => ({ border: 'none', borderRadius: '5px', padding: '0.45rem 0.7rem', minHeight: '34px', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '0.4rem', background: variant === 'danger' ? 'rgba(200,80,80,0.15)' : 'rgba(201,169,110,0.12)', color: variant === 'danger' ? '#e07070' : '#c9a96e' }),
  addBtn: { border: 'none', borderRadius: '6px', padding: '0.6rem 1.1rem', minHeight: '40px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: '#c9a96e', color: '#111' },
  wrap: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', overflowX: 'auto' },
  panel: { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '.35rem', marginBottom: '.9rem' },
  label: { fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', color: '#888' },
  input: { padding: '0.6rem 0.8rem', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#e8e0d4', fontSize: '0.9rem', fontFamily: 'inherit' },
  err: { color: '#e07070', fontSize: '.8rem', marginBottom: '.75rem' },
};

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const EMPTY = { id: null, name: '', slug: '', description: '', slugTouched: false };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = closed; object = add/edit
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('products').select('category_slug'),
    ]);
    setCategories(cats || []);
    const tally = {};
    (prods || []).forEach((p) => { if (p.category_slug) tally[p.category_slug] = (tally[p.category_slug] || 0) + 1; });
    setCounts(tally);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(cat) {
    await supabase.from('categories').update({ active: !cat.active }).eq('id', cat.id);
    load();
  }

  async function moveOrder(cat, dir) {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swap = categories[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from('categories').update({ display_order: swap.display_order }).eq('id', cat.id),
      supabase.from('categories').update({ display_order: cat.display_order }).eq('id', swap.id),
    ]);
    load();
  }

  function openAdd() { setError(null); setForm({ ...EMPTY }); }
  function openEdit(cat) {
    setError(null);
    setForm({ id: cat.id, name: cat.name || '', slug: cat.slug || '', description: cat.description || '', slugTouched: true });
  }

  async function save() {
    if (!form.name.trim()) { setError('Category name is required.'); return; }
    const slug = (form.slug.trim() || slugify(form.name));
    if (!slug) { setError('A valid slug is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      if (form.id) {
        const { error: err } = await supabase.from('categories')
          .update({ name: form.name.trim(), slug, description: form.description.trim() || null })
          .eq('id', form.id);
        if (err) throw err;
      } else {
        const maxOrder = categories.reduce((m, c) => Math.max(m, c.display_order || 0), 0);
        const { error: err } = await supabase.from('categories')
          .insert({ name: form.name.trim(), slug, description: form.description.trim() || null, active: true, display_order: maxOrder + 1 });
        if (err) throw err;
      }
      setForm(null);
      load();
    } catch (e) {
      setError(e.message?.includes('duplicate') ? 'That slug already exists. Choose a unique slug.' : (e.message || 'Could not save category.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={s.topbar}>
        <h1 style={s.heading}>Categories</h1>
        {!form && <button style={s.addBtn} onClick={openAdd}>+ Add Category</button>}
      </div>

      {form && (
        <div style={s.panel}>
          <div style={{ fontSize: '.95rem', color: '#e8e0d4', marginBottom: '1rem', fontWeight: 600 }}>
            {form.id ? 'Edit Category' : 'New Category'}
          </div>
          {error && <div style={s.err}>{error}</div>}
          <div style={s.field}>
            <label style={s.label}>Name</label>
            <input
              style={s.input}
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: f.slugTouched ? f.slug : slugify(e.target.value) }))}
              placeholder="e.g. Wedding"
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Slug <span style={{ textTransform: 'none', color: '#555' }}>(must match product category_slug)</span></label>
            <input
              style={{ ...s.input, fontFamily: 'monospace' }}
              value={form.slug}
              onChange={(e) => setForm(f => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))}
              placeholder="wedding"
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Description <span style={{ textTransform: 'none', color: '#555' }}>(optional)</span></label>
            <textarea
              style={{ ...s.input, minHeight: '70px', resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description shown on the storefront"
            />
          </div>
          <div style={{ display: 'flex', gap: '.6rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
            <button style={s.addBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button style={{ ...s.btn(), marginLeft: 0, padding: '0.6rem 1.1rem', minHeight: '40px' }} onClick={() => setForm(null)} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      <div style={s.wrap}>
        {loading ? (
          <div style={{ padding: '2rem', color: '#555', textAlign: 'center' }}>Loading…</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Order</th>
                <th style={s.th}>Slug</th>
                <th style={s.th}>Name</th>
                <th style={s.th}>Products</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={cat.id}>
                  <td style={s.td}>
                    <button style={s.btn()} onClick={() => moveOrder(cat, -1)} disabled={idx === 0}>↑</button>
                    <button style={s.btn()} onClick={() => moveOrder(cat, 1)} disabled={idx === categories.length - 1}>↓</button>
                  </td>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.8rem', color: '#888' }}>{cat.slug}</td>
                  <td style={s.td}>{cat.name}</td>
                  <td style={{ ...s.td, color: '#888' }}>{counts[cat.slug] || 0}</td>
                  <td style={s.td}><span style={s.badge(cat.active)}>{cat.active ? 'Active' : 'Hidden'}</span></td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                    <button style={s.btn()} onClick={() => openEdit(cat)}>Edit</button>
                    <button style={s.btn(cat.active ? 'danger' : 'default')} onClick={() => toggleActive(cat)}>
                      {cat.active ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td style={{ ...s.td, textAlign: 'center', color: '#555' }} colSpan={6}>No categories yet. Add your first one.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
