import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { T, ui } from './adminUI';

/* Global option catalogs (#5) — materials, colours, sizes.
   These are the master lists; each product enables a subset in Product → Frame
   Options. Adding a new material/colour/size here makes it available across the
   store with no code changes. */

const TABS = [
  { key: 'frame_sizes',     label: 'Sizes' },
  { key: 'frame_materials', label: 'Materials' },
  { key: 'frame_colours',   label: 'Colours' },
];

const slugify = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function blankFor(table) {
  if (table === 'frame_sizes')     return { name: '', slug: '', dimensions: '', ratio_w: 3, ratio_h: 4, base_price: 499 };
  if (table === 'frame_materials') return { name: '', slug: '', description: '' };
  return { name: '', slug: '', hex: '#1C1C1C' };
}

export default function Catalog() {
  const [tab, setTab] = useState('frame_sizes');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true); setMissing(false); setError(null);
    const { data, error: err } = await supabase.from(tab).select('*').order('display_order');
    if (err) {
      if (/does not exist|schema cache|not find/i.test(err.message)) setMissing(true);
      else setError(err.message);
      setRows([]); setLoading(false); return;
    }
    setRows(data || []); setLoading(false);
  }
  useEffect(() => { load(); setForm(null); /* eslint-disable-next-line */ }, [tab]);

  async function toggleActive(r) { await supabase.from(tab).update({ active: !r.active }).eq('id', r.id); load(); }
  async function move(r, dir) {
    const idx = rows.findIndex(x => x.id === r.id); const swap = rows[idx + dir]; if (!swap) return;
    await Promise.all([
      supabase.from(tab).update({ display_order: swap.display_order }).eq('id', r.id),
      supabase.from(tab).update({ display_order: r.display_order }).eq('id', swap.id),
    ]); load();
  }
  async function remove(r) {
    if (!window.confirm(`Delete "${r.name}"? Products using it will stop offering it.`)) return;
    const { error: err } = await supabase.from(tab).delete().eq('id', r.id);
    if (err) setError(err.message); load();
  }
  function openAdd() { setError(null); setForm(blankFor(tab)); }
  function openEdit(r) { setError(null); setForm({ ...r }); }

  async function save() {
    if (!form.name?.trim()) { setError('Name is required.'); return; }
    const slug = form.slug?.trim() || slugify(form.name);
    const payload = { ...form, slug };
    delete payload.created_at; delete payload.updated_at;
    if (tab === 'frame_sizes') { payload.ratio_w = +form.ratio_w || 1; payload.ratio_h = +form.ratio_h || 1; payload.base_price = +form.base_price || 0; }
    try {
      if (form.id) {
        const { error: err } = await supabase.from(tab).update(payload).eq('id', form.id); if (err) throw err;
      } else {
        const maxOrder = rows.reduce((m, r) => Math.max(m, r.display_order || 0), 0);
        const { error: err } = await supabase.from(tab).insert({ ...payload, active: true, display_order: maxOrder + 1 }); if (err) throw err;
      }
      setForm(null); load();
    } catch (e) { setError(/duplicate/i.test(e.message) ? 'That slug already exists.' : e.message); }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v, ...(k === 'name' && !p.id ? { slug: slugify(v) } : {}) }));
  const inp = { ...ui.input };

  return (
    <div>
      <div style={ui.topbar}>
        <div>
          <h1 style={ui.heading}>Catalog</h1>
          <div style={ui.sub}>Master lists of frame sizes, materials and colours available across the store.</div>
        </div>
        {!form && !missing && <button style={ui.addBtn} onClick={openAdd}>+ Add {TABS.find(t => t.key === tab).label.replace(/s$/, '')}</button>}
      </div>

      <div style={{ display: 'flex', gap: '4px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '4px', width: 'fit-content', marginBottom: '1.25rem' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '.5rem 1.1rem', border: 'none', borderRadius: '8px', fontSize: '.82rem', fontWeight: 700, cursor: 'pointer',
              background: tab === t.key ? T.gold : 'transparent', color: tab === t.key ? '#fff' : T.muted }}>
            {t.label}
          </button>
        ))}
      </div>

      {missing && <div style={{ ...ui.panel, color: T.goldDeep, background: T.goldSoft }}>Run migration <code>011_product_configuration.sql</code> to create the catalog tables.</div>}
      {error && <div style={ui.err}>{error}</div>}

      {form && (
        <div style={ui.panel}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: '1rem' }}>{form.id ? 'Edit' : 'New'} {TABS.find(t => t.key === tab).label.replace(/s$/, '')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem' }}>
            <div style={ui.field}><label style={ui.label}>Name</label><input style={inp} value={form.name} onChange={e => f('name', e.target.value)} /></div>
            <div style={ui.field}><label style={ui.label}>Slug</label><input style={{ ...inp, fontFamily: 'monospace' }} value={form.slug} onChange={e => f('slug', slugify(e.target.value))} /></div>
            {tab === 'frame_sizes' && <>
              <div style={ui.field}><label style={ui.label}>Dimensions</label><input style={inp} value={form.dimensions || ''} onChange={e => f('dimensions', e.target.value)} placeholder="9.5 × 13 inches" /></div>
              <div style={ui.field}><label style={ui.label}>Ratio W</label><input style={inp} type="number" value={form.ratio_w} onChange={e => f('ratio_w', e.target.value)} /></div>
              <div style={ui.field}><label style={ui.label}>Ratio H</label><input style={inp} type="number" value={form.ratio_h} onChange={e => f('ratio_h', e.target.value)} /></div>
              <div style={ui.field}><label style={ui.label}>Base Price ₹</label><input style={inp} type="number" value={form.base_price} onChange={e => f('base_price', e.target.value)} /></div>
            </>}
            {tab === 'frame_materials' && <div style={{ ...ui.field, gridColumn: '1 / -1' }}><label style={ui.label}>Description</label><input style={inp} value={form.description || ''} onChange={e => f('description', e.target.value)} /></div>}
            {tab === 'frame_colours' && <div style={ui.field}><label style={ui.label}>Hex</label>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <input type="color" value={form.hex} onChange={e => f('hex', e.target.value)} style={{ width: '42px', height: '38px', border: `1.5px solid ${T.border2}`, borderRadius: '8px', background: 'none', cursor: 'pointer' }} />
                <input style={{ ...inp, fontFamily: 'monospace' }} value={form.hex} onChange={e => f('hex', e.target.value)} />
              </div></div>}
          </div>
          <div style={{ display: 'flex', gap: '.6rem', marginTop: '.75rem' }}>
            <button style={ui.addBtn} onClick={save}>Save</button>
            <button style={{ ...ui.btn(), marginLeft: 0, padding: '.6rem 1.1rem', minHeight: '40px' }} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={ui.wrap}>
        {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: T.muted2 }}>Loading…</div> : (
          <table style={ui.table}>
            <thead><tr>
              <th style={ui.th}>Order</th>
              <th style={ui.th}>{tab === 'frame_colours' ? 'Colour' : 'Name'}</th>
              <th style={ui.th}>Slug</th>
              {tab === 'frame_sizes' && <><th style={ui.th}>Dimensions</th><th style={ui.th}>Price</th></>}
              <th style={ui.th}>Status</th>
              <th style={ui.th}>Actions</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td style={ui.td}>
                    <button style={ui.btn()} onClick={() => move(r, -1)} disabled={i === 0}>↑</button>
                    <button style={ui.btn()} onClick={() => move(r, 1)} disabled={i === rows.length - 1}>↓</button>
                  </td>
                  <td style={{ ...ui.td, color: T.text, fontWeight: 600 }}>
                    {tab === 'frame_colours' && <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', background: r.hex, border: '1px solid rgba(0,0,0,.15)', marginRight: '8px', verticalAlign: 'middle' }} />}
                    {r.name}
                  </td>
                  <td style={{ ...ui.td, fontFamily: 'monospace', fontSize: '.78rem', color: T.muted }}>{r.slug}</td>
                  {tab === 'frame_sizes' && <><td style={ui.td}>{r.dimensions}</td><td style={ui.td}>₹{(+r.base_price).toLocaleString('en-IN')}</td></>}
                  <td style={ui.td}><span style={ui.badge(r.active)}>{r.active ? 'Active' : 'Hidden'}</span></td>
                  <td style={{ ...ui.td, whiteSpace: 'nowrap' }}>
                    <button style={ui.btn()} onClick={() => openEdit(r)}>Edit</button>
                    <button style={ui.btn(r.active ? 'danger' : 'default')} onClick={() => toggleActive(r)}>{r.active ? 'Hide' : 'Show'}</button>
                    <button style={ui.btn('danger')} onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !missing && <tr><td colSpan={7} style={{ ...ui.td, textAlign: 'center', color: T.muted2 }}>Nothing here yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
