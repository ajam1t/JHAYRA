import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const s = {
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.5rem', color: '#c9a96e', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.65rem 1rem', fontSize: '0.7rem', letterSpacing: '0.1em', color: '#666', textTransform: 'uppercase', borderBottom: '1px solid #1e1e1e' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid #161616', color: '#ccc', verticalAlign: 'middle' },
  badge: (active) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', background: active ? 'rgba(80,200,120,0.12)' : 'rgba(200,80,80,0.12)', color: active ? '#6cda96' : '#e07070', border: `1px solid ${active ? 'rgba(80,200,120,0.25)' : 'rgba(200,80,80,0.25)'}` }),
  btn: (variant = 'default') => ({ border: 'none', borderRadius: '5px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '0.4rem', background: variant === 'danger' ? 'rgba(200,80,80,0.15)' : 'rgba(201,169,110,0.12)', color: variant === 'danger' ? '#e07070' : '#c9a96e' }),
  wrap: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', overflow: 'hidden' },
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('categories').select('*').order('display_order');
    setCategories(data || []);
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

  return (
    <div>
      <h1 style={s.heading}>Categories</h1>
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
                  <td style={s.td}><span style={s.badge(cat.active)}>{cat.active ? 'Active' : 'Hidden'}</span></td>
                  <td style={s.td}>
                    <button style={s.btn(cat.active ? 'danger' : 'default')} onClick={() => toggleActive(cat)}>
                      {cat.active ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
