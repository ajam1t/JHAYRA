import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/* Admin-managed homepage "Explore Our Collections" tiles.
   One source of truth: the `homepage_collections` table. Images upload to the
   existing public `product-images` bucket under a `homepage-collections/` prefix
   (admin-write / public-read), so no new bucket is required. The homepage reads
   the ACTIVE rows via useHomepageCollections(). */

const BUCKET = 'product-images';
const PREFIX = 'homepage-collections';
const MAX_BYTES = 5 * 1024 * 1024; // 5MB — homepage images should be reasonably sized
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const s = {
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.5rem', color: '#c9a96e', margin: 0 },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1rem' },
  sub: { color: '#777', fontSize: '.82rem', marginBottom: '1.25rem', lineHeight: 1.6 },
  wrap: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '640px' },
  th: { textAlign: 'left', padding: '0.65rem 1rem', fontSize: '0.7rem', letterSpacing: '0.1em', color: '#666', textTransform: 'uppercase', borderBottom: '1px solid #1e1e1e', whiteSpace: 'nowrap' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid #161616', color: '#ccc', verticalAlign: 'middle' },
  badge: (active) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', background: active ? 'rgba(80,200,120,0.12)' : 'rgba(200,80,80,0.12)', color: active ? '#6cda96' : '#e07070', border: `1px solid ${active ? 'rgba(80,200,120,0.25)' : 'rgba(200,80,80,0.25)'}` }),
  btn: (variant = 'default') => ({ border: 'none', borderRadius: '5px', padding: '0.45rem 0.7rem', minHeight: '34px', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '0.4rem', background: variant === 'danger' ? 'rgba(200,80,80,0.15)' : 'rgba(201,169,110,0.12)', color: variant === 'danger' ? '#e07070' : '#c9a96e' }),
  addBtn: { border: 'none', borderRadius: '6px', padding: '0.6rem 1.1rem', minHeight: '40px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: '#c9a96e', color: '#111' },
  panel: { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '.35rem', marginBottom: '.9rem' },
  label: { fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', color: '#888' },
  input: { padding: '0.6rem 0.8rem', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#e8e0d4', fontSize: '0.9rem', fontFamily: 'inherit' },
  err: { color: '#e07070', fontSize: '.8rem', marginBottom: '.75rem' },
  note: { background: '#1a1408', border: '1px solid #6b5320', borderRadius: '8px', color: '#d9b96a', fontSize: '.8rem', padding: '.7rem 1rem', marginBottom: '1.25rem', lineHeight: 1.6 },
  thumb: { width: '64px', height: '48px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #2a2a2a', background: '#0d0d0d', display: 'block' },
};

const EMPTY = { id: null, title: '', subtitle: '', link: '', alt_text: '', image_url: '', storage_path: '' };

export default function HomepageCollections() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data, error: err } = await supabase
      .from('homepage_collections')
      .select('*')
      .order('display_order', { ascending: true });
    if (err) {
      // Table not created yet → guide the admin to run the migration.
      if (/relation .* does not exist|not find the table|schema cache/i.test(err.message)) setMissingTable(true);
      else setError(err.message);
      setLoading(false);
      return;
    }
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setError(null); setForm({ ...EMPTY }); }
  function openEdit(row) {
    setError(null);
    setForm({ id: row.id, title: row.title || '', subtitle: row.subtitle || '', link: row.link || '', alt_text: row.alt_text || '', image_url: row.image_url || '', storage_path: row.storage_path || '' });
  }

  async function uploadImage(file) {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) { setError('Unsupported image type. Use JPG, PNG, WebP or AVIF.'); return; }
    if (file.size > MAX_BYTES) { setError('Image is larger than 5MB. Please use a smaller/optimized image.'); return; }
    setError(null);
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${PREFIX}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) { setError(`Upload failed: ${upErr.message}`); return; }
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setForm(f => ({ ...f, image_url: publicUrl, storage_path: path, alt_text: f.alt_text || '' }));
    } finally {
      setUploading(false);
    }
  }

  function validate(f) {
    if (!f.title.trim()) return 'Title is required.';
    if (!f.image_url) return 'Please upload an image.';
    if (!f.alt_text.trim()) return 'Alt text is required (accessibility & SEO).';
    if (f.link && !(f.link.startsWith('/') || /^https?:\/\//i.test(f.link))) {
      return 'Link must be an internal route (start with /) or a full http(s) URL.';
    }
    return null;
  }

  async function save() {
    const v = validate(form);
    if (v) { setError(v); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        link: form.link.trim() || null,
        alt_text: form.alt_text.trim(),
        image_url: form.image_url,
        storage_path: form.storage_path || null,
      };
      if (form.id) {
        const { error: err } = await supabase.from('homepage_collections').update(payload).eq('id', form.id);
        if (err) throw err;
      } else {
        const maxOrder = rows.reduce((m, r) => Math.max(m, r.display_order || 0), 0);
        const { error: err } = await supabase.from('homepage_collections').insert({ ...payload, active: true, display_order: maxOrder + 1 });
        if (err) throw err;
      }
      setForm(null);
      load();
    } catch (e) {
      setError(e.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    await supabase.from('homepage_collections').update({ active: !row.active }).eq('id', row.id);
    load();
  }

  async function moveOrder(row, dir) {
    const idx = rows.findIndex(r => r.id === row.id);
    const swap = rows[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from('homepage_collections').update({ display_order: swap.display_order }).eq('id', row.id),
      supabase.from('homepage_collections').update({ display_order: row.display_order }).eq('id', swap.id),
    ]);
    load();
  }

  async function remove(row) {
    if (!window.confirm(`Delete "${row.title}" from the homepage?`)) return;
    // Best-effort remove the uploaded file too (leave legacy /Images assets alone).
    if (row.storage_path) {
      try { await supabase.storage.from(BUCKET).remove([row.storage_path]); } catch { /* noop */ }
    }
    await supabase.from('homepage_collections').delete().eq('id', row.id);
    load();
  }

  return (
    <div>
      <div style={s.topbar}>
        <h1 style={s.heading}>Homepage Collections</h1>
        {!form && !missingTable && <button style={s.addBtn} onClick={openAdd}>+ Add Image</button>}
      </div>
      <p style={s.sub}>
        These are the tiles under <strong>“Explore Our Collections — Every Wall Has a Story”</strong> on the homepage.
        Changes appear on the site immediately. If no active tiles exist, the homepage safely falls back to the built-in defaults.
      </p>

      {missingTable && (
        <div style={s.note}>
          The <code>homepage_collections</code> table doesn’t exist yet. Run migration{' '}
          <code>supabase/migrations/010_homepage_collections.sql</code> (Supabase SQL editor or <code>supabase db push</code>),
          then reload. Until then the homepage shows the built-in default tiles.
        </div>
      )}

      {form && (
        <div style={s.panel}>
          <div style={{ fontSize: '.95rem', color: '#e8e0d4', marginBottom: '1rem', fontWeight: 600 }}>
            {form.id ? 'Edit Tile' : 'New Tile'}
          </div>
          {error && <div style={s.err}>{error}</div>}

          <div style={s.field}>
            <label style={s.label}>Image</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {form.image_url
                ? <img src={form.image_url} alt="" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #2a2a2a' }} />
                : <div style={{ width: '120px', height: '90px', borderRadius: '6px', border: '1px dashed #333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '.72rem' }}>No image</div>}
              <label style={{ ...s.btn(), marginLeft: 0, padding: '0.55rem 1rem', minHeight: '38px', display: 'inline-block' }}>
                {uploading ? 'Uploading…' : (form.image_url ? 'Replace image' : 'Upload image')}
                <input type="file" accept={ACCEPT.join(',')} style={{ display: 'none' }} disabled={uploading}
                  onChange={(e) => { uploadImage(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </div>
            <span style={{ color: '#555', fontSize: '.7rem' }}>JPG / PNG / WebP / AVIF · up to 5MB · landscape works best.</span>
          </div>

          <div style={s.field}>
            <label style={s.label}>Title</label>
            <input style={s.input} value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Wedding Season" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Subtitle <span style={{ textTransform: 'none', color: '#555' }}>(optional caption)</span></label>
            <input style={s.input} value={form.subtitle} onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. 120+ designs" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Link <span style={{ textTransform: 'none', color: '#555' }}>(internal route like /shop?category=nature, or full URL)</span></label>
            <input style={{ ...s.input, fontFamily: 'monospace', fontSize: '.82rem' }} value={form.link} onChange={(e) => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/shop?category=nature" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Alt text <span style={{ textTransform: 'none', color: '#555' }}>(describes the image)</span></label>
            <input style={s.input} value={form.alt_text} onChange={(e) => setForm(f => ({ ...f, alt_text: e.target.value }))} placeholder="Nature inspired wall art collection" />
          </div>

          <div style={{ display: 'flex', gap: '.6rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
            <button style={s.addBtn} onClick={save} disabled={saving || uploading}>{saving ? 'Saving…' : 'Save'}</button>
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
                <th style={s.th}>Image</th>
                <th style={s.th}>Title</th>
                <th style={s.th}>Link</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id}>
                  <td style={s.td}>
                    <button style={s.btn()} onClick={() => moveOrder(row, -1)} disabled={idx === 0}>↑</button>
                    <button style={s.btn()} onClick={() => moveOrder(row, 1)} disabled={idx === rows.length - 1}>↓</button>
                  </td>
                  <td style={s.td}>
                    {row.image_url
                      ? <img src={row.image_url} alt={row.alt_text || row.title} style={s.thumb} />
                      : <div style={{ ...s.thumb, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '.6rem' }}>—</div>}
                  </td>
                  <td style={s.td}>
                    <div style={{ color: '#e8e0d4' }}>{row.title}</div>
                    {row.subtitle && <div style={{ color: '#777', fontSize: '.72rem' }}>{row.subtitle}</div>}
                  </td>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '.72rem', color: '#888', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.link || '—'}</td>
                  <td style={s.td}><span style={s.badge(row.active)}>{row.active ? 'Active' : 'Hidden'}</span></td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                    <button style={s.btn()} onClick={() => openEdit(row)}>Edit</button>
                    <button style={s.btn(row.active ? 'danger' : 'default')} onClick={() => toggleActive(row)}>{row.active ? 'Hide' : 'Show'}</button>
                    <button style={s.btn('danger')} onClick={() => remove(row)}>Delete</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !missingTable && (
                <tr><td style={{ ...s.td, textAlign: 'center', color: '#555' }} colSpan={6}>No tiles yet. Add your first image — until then the homepage shows the built-in defaults.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
