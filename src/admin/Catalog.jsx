import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { invalidateCatalog } from '../lib/catalog';
import { optimized } from '../lib/img';

/**
 * Inline editor for a simple Supabase table.
 * columns: [{ key, label, type: 'text'|'number'|'bool'|'color'|'textarea'|'image', width }]
 */
function TableEditor({ table, title, columns, defaults, order = 'display_order', imagePrefix, hint }) {
  const [rows, setRows] = useState(null);
  const [dirty, setDirty] = useState({});
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    const { data, error } = await supabase.from(table).select('*').order(order);
    if (error) setErr(error.message);
    setRows(data || []);
  };
  useEffect(() => {
    load();
  }, [table]); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (id, k, v) => {
    setRows((l) => l.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
    setDirty((d) => ({ ...d, [id]: true }));
  };
  const save = async (row) => {
    setErr('');
    const patch = Object.fromEntries(columns.map((c) => [c.key, c.type === 'number' ? (row[c.key] === '' ? null : +row[c.key]) : row[c.key]]));
    const { error } = await supabase.from(table).update(patch).eq('id', row.id);
    if (error) return setErr(error.message);
    setDirty((d) => ({ ...d, [row.id]: false }));
    invalidateCatalog();
    setOk('Saved');
    setTimeout(() => setOk(''), 1500);
  };
  const add = async () => {
    setErr('');
    const { error } = await supabase.from(table).insert({ ...defaults, display_order: (rows?.length || 0) + 1 });
    if (error) return setErr(error.message);
    load();
  };
  const remove = async (row) => {
    if (!confirm('Delete this row? This cannot be undone.')) return;
    const { error } = await supabase.from(table).delete().eq('id', row.id);
    if (error) return setErr(error.message);
    if (row.storage_path) await supabase.storage.from('product-images').remove([row.storage_path]);
    invalidateCatalog();
    load();
  };
  const upload = async (row, file) => {
    const path = `${imagePrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return setErr(error.message);
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    if (row.storage_path) await supabase.storage.from('product-images').remove([row.storage_path]);
    await supabase.from(table).update({ image_url: data.publicUrl, storage_path: path }).eq('id', row.id);
    invalidateCatalog();
    load();
  };

  if (!rows) return <div className="ad-muted">Loading…</div>;
  return (
    <div className="ad-card">
      <div className="ad-row-between">
        <h2>{title}</h2>
        <button className="ad-btn ad-btn-primary" onClick={add}>
          + Add
        </button>
      </div>
      {hint && <p className="ad-muted">{hint}</p>}
      {err && <div className="ad-err">{err}</div>}
      {ok && <div className="ad-ok">{ok}</div>}
      <div className="ad-scroll">
        <table className="ad-table ad-edit">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {columns.map((c) => (
                  <td key={c.key} style={{ minWidth: c.width }}>
                    {c.type === 'bool' ? (
                      <button className={`ad-switch ${r[c.key] ? 'on' : ''}`} onClick={() => edit(r.id, c.key, !r[c.key])} aria-pressed={!!r[c.key]} aria-label={c.label} />
                    ) : c.type === 'image' ? (
                      <label className="ad-imgcell">
                        {r.image_url ? <img src={optimized(r.image_url, 160)} alt="" /> : <span className="ad-muted">No image</span>}
                        <span className="ad-link">Change</span>
                        <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(r, e.target.files[0])} />
                      </label>
                    ) : c.type === 'color' ? (
                      <span className="ad-color">
                        <input type="color" value={r[c.key] || '#000000'} onChange={(e) => edit(r.id, c.key, e.target.value)} />
                        <input className="ad-input" value={r[c.key] || ''} onChange={(e) => edit(r.id, c.key, e.target.value)} />
                      </span>
                    ) : c.type === 'textarea' ? (
                      <textarea className="ad-input" rows={2} value={r[c.key] ?? ''} onChange={(e) => edit(r.id, c.key, e.target.value)} />
                    ) : (
                      <input className="ad-input" type={c.type === 'number' ? 'number' : 'text'} step="any" value={r[c.key] ?? ''} onChange={(e) => edit(r.id, c.key, e.target.value)} />
                    )}
                  </td>
                ))}
                <td className="ad-actions">
                  <button className={`ad-btn ${dirty[r.id] ? 'ad-btn-primary' : ''}`} disabled={!dirty[r.id]} onClick={() => save(r)}>
                    Save
                  </button>
                  <button className="ad-btn" onClick={() => remove(r)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Categories() {
  return (
    <>
      <h1 className="ad-h1">Categories</h1>
      <TableEditor
        table="categories"
        title="Shop categories"
        hint="The slug is used in links (e.g. /shop?category=religious). Changing a slug also requires updating products in that category."
        defaults={{ slug: `new-${Date.now().toString(36)}`, name: 'New category', active: false }}
        columns={[
          { key: 'name', label: 'Name', width: 160 },
          { key: 'slug', label: 'Slug', width: 140 },
          { key: 'description', label: 'Description', type: 'textarea', width: 240 },
          { key: 'display_order', label: 'Order', type: 'number', width: 70 },
          { key: 'active', label: 'Live', type: 'bool' },
        ]}
      />
    </>
  );
}

export function FrameOptions() {
  return (
    <>
      <h1 className="ad-h1">Sizes & finishes</h1>
      <TableEditor
        table="frame_sizes"
        title="Frame sizes"
        hint="Base price applies to every product offering this size (unless overridden). Ratio sets the preview shape."
        defaults={{ name: 'New size', slug: `size-${Date.now().toString(36)}`, dimensions: '', ratio_w: 12, ratio_h: 16, base_price: 999, active: false }}
        columns={[
          { key: 'name', label: 'Name', width: 110 },
          { key: 'slug', label: 'Slug', width: 100 },
          { key: 'dimensions', label: 'Dimensions', width: 140 },
          { key: 'ratio_w', label: 'Width (in)', type: 'number', width: 80 },
          { key: 'ratio_h', label: 'Height (in)', type: 'number', width: 80 },
          { key: 'base_price', label: 'Price ₹', type: 'number', width: 90 },
          { key: 'display_order', label: 'Order', type: 'number', width: 70 },
          { key: 'active', label: 'Live', type: 'bool' },
        ]}
      />
      <TableEditor
        table="frame_colours"
        title="Frame colours"
        defaults={{ name: 'New colour', slug: `colour-${Date.now().toString(36)}`, hex: '#1C1C1C', active: false }}
        columns={[
          { key: 'name', label: 'Name', width: 120 },
          { key: 'slug', label: 'Slug', width: 110 },
          { key: 'hex', label: 'Colour', type: 'color', width: 160 },
          { key: 'display_order', label: 'Order', type: 'number', width: 70 },
          { key: 'active', label: 'Live', type: 'bool' },
        ]}
      />
      <TableEditor
        table="frame_materials"
        title="Finishes / materials"
        defaults={{ name: 'New finish', slug: `finish-${Date.now().toString(36)}`, description: '', active: false }}
        columns={[
          { key: 'name', label: 'Name', width: 140 },
          { key: 'slug', label: 'Slug', width: 120 },
          { key: 'description', label: 'Description', type: 'textarea', width: 240 },
          { key: 'display_order', label: 'Order', type: 'number', width: 70 },
          { key: 'active', label: 'Live', type: 'bool' },
        ]}
      />
    </>
  );
}

export function HomepageCollections() {
  return (
    <>
      <h1 className="ad-h1">Homepage collections</h1>
      <TableEditor
        table="homepage_collections"
        title="“Every wall has a story” tiles"
        hint="The first tile is shown largest. Link can be any page, e.g. /shop?category=religious or /customize?moment=wedding."
        imagePrefix="homepage-collections"
        defaults={{ title: 'New collection', subtitle: '', link: '/shop', active: false }}
        order="display_order"
        columns={[
          { key: 'image_url', label: 'Image', type: 'image', width: 110 },
          { key: 'title', label: 'Title', width: 150 },
          { key: 'subtitle', label: 'Subtitle', width: 140 },
          { key: 'link', label: 'Link', width: 170 },
          { key: 'alt_text', label: 'Image description', width: 170 },
          { key: 'display_order', label: 'Order', type: 'number', width: 70 },
          { key: 'active', label: 'Live', type: 'bool' },
        ]}
      />
    </>
  );
}
