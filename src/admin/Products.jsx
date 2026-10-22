import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { money } from '../lib/site';
import { invalidateCatalog } from '../lib/catalog';
import { optimized } from '../lib/img';

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function ProductList() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    supabase
      .from('products')
      .select('id,legacy_id,name,category_slug,price,is_bestseller,homepage_visible,active,display_order,product_images(url,is_primary)')
      .order('display_order')
      .then(({ data }) => setRows(data || []));
  }, []);
  const toggle = async (p, key) => {
    const { error } = await supabase.from('products').update({ [key]: !p[key] }).eq('id', p.id);
    if (!error) {
      setRows((l) => l.map((x) => (x.id === p.id ? { ...x, [key]: !p[key] } : x)));
      invalidateCatalog();
    }
  };
  if (!rows) return <div className="ad-muted">Loading…</div>;
  const list = rows.filter((p) => !q || [p.name, p.legacy_id, p.category_slug].join(' ').toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="ad-row-between">
        <h1 className="ad-h1">Products ({rows.length})</h1>
        <Link to="/admin/products/new" className="ad-btn ad-btn-primary">
          + Add product
        </Link>
      </div>
      <div className="ad-toolbar">
        <input className="ad-input" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="ad-card" style={{ padding: 0 }}>
        <table className="ad-table">
          <thead>
            <tr>
              <th />
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Bestseller</th>
              <th>Homepage</th>
              <th>Live</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const img = (p.product_images || []).find((i) => i.is_primary) || p.product_images?.[0];
              return (
                <tr key={p.id}>
                  <td style={{ width: 56 }}>{img && <img className="ad-thumb" src={optimized(img.url, 120)} alt="" />}</td>
                  <td>
                    <Link to={`/admin/products/${p.id}`} className="ad-link">
                      {p.name}
                    </Link>
                    <div className="ad-muted">{p.legacy_id}</div>
                  </td>
                  <td>{p.category_slug}</td>
                  <td>{money(p.price)}</td>
                  {['is_bestseller', 'homepage_visible', 'active'].map((k) => (
                    <td key={k}>
                      <button className={`ad-switch ${p[k] ? 'on' : ''}`} onClick={() => toggle(p, k)} aria-pressed={!!p[k]} aria-label={k} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

const EMPTY = { name: '', slug: '', legacy_id: '', description: '', category_slug: '', price: 499, compare_price: '', tags: '', rating: 4.8, review_count: 0, is_bestseller: false, is_new_arrival: true, homepage_visible: false, display_order: 0, active: true, customer_photo_eligible: false };

export function ProductForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [cats, setCats] = useState([]);
  const [images, setImages] = useState([]);
  const [opts, setOpts] = useState([]);
  const [tables, setTables] = useState({ size: [], colour: [], material: [] });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadImages = async (pid) => {
    const { data } = await supabase.from('product_images').select('*').eq('product_id', pid).order('display_order');
    setImages(data || []);
  };
  const loadOpts = async (pid) => {
    const { data } = await supabase.from('product_options').select('*').eq('product_id', pid);
    setOpts(data || []);
  };

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: s }, { data: co }, { data: m }] = await Promise.all([
        supabase.from('categories').select('slug,name').order('display_order'),
        supabase.from('frame_sizes').select('*').eq('active', true).order('display_order'),
        supabase.from('frame_colours').select('*').eq('active', true).order('display_order'),
        supabase.from('frame_materials').select('*').eq('active', true).order('display_order'),
      ]);
      setCats(c || []);
      setTables({ size: s || [], colour: co || [], material: m || [] });
      if (!isNew) {
        const { data } = await supabase.from('products').select('*').eq('id', id).single();
        if (data) setF({ ...data, tags: (data.tags || []).join(', '), compare_price: data.compare_price || '' });
        await Promise.all([loadImages(id), loadOpts(id)]);
      }
    })();
  }, [id, isNew]);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v, ...(k === 'name' && isNew ? { slug: slugify(v) } : {}) }));

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    const row = {
      name: f.name,
      slug: f.slug || slugify(f.name),
      legacy_id: f.legacy_id || null,
      description: f.description,
      category_slug: f.category_slug,
      price: parseFloat(f.price) || 499,
      compare_price: f.compare_price ? parseFloat(f.compare_price) : null,
      tags: f.tags ? f.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      rating: parseFloat(f.rating) || 4.5,
      review_count: parseInt(f.review_count) || 0,
      is_bestseller: !!f.is_bestseller,
      is_new_arrival: !!f.is_new_arrival,
      homepage_visible: !!f.homepage_visible,
      display_order: parseInt(f.display_order) || 0,
      active: !!f.active,
      customer_photo_eligible: !!f.customer_photo_eligible,
    };
    try {
      if (isNew) {
        const { data, error } = await supabase.from('products').insert(row).select().single();
        if (error) throw error;
        invalidateCatalog();
        navigate(`/admin/products/${data.id}`, { replace: true });
        setMsg('Product created — now add photos and options below.');
      } else {
        const { error } = await supabase.from('products').update(row).eq('id', id);
        if (error) throw error;
        invalidateCatalog();
        setMsg('Saved.');
      }
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (files) => {
    setErr('');
    for (const file of files) {
      const path = `${id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) {
        setErr(`Upload failed: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('product_images').insert({ product_id: id, storage_path: path, url: data.publicUrl, display_order: images.length, is_primary: images.length === 0 });
    }
    await loadImages(id);
    invalidateCatalog();
  };
  const removeImage = async (img) => {
    if (!confirm('Delete this photo?')) return;
    await supabase.storage.from('product-images').remove([img.storage_path]);
    await supabase.from('product_images').delete().eq('id', img.id);
    loadImages(id);
    invalidateCatalog();
  };
  const makePrimary = async (img) => {
    await Promise.all([...images.filter((i) => i.is_primary).map((i) => supabase.from('product_images').update({ is_primary: false }).eq('id', i.id)), supabase.from('product_images').update({ is_primary: true }).eq('id', img.id)]);
    loadImages(id);
    invalidateCatalog();
  };
  const moveImage = async (img, d) => {
    const i = images.findIndex((x) => x.id === img.id);
    const other = images[i + d];
    if (!other) return;
    await Promise.all([supabase.from('product_images').update({ display_order: other.display_order ?? i + d }).eq('id', img.id), supabase.from('product_images').update({ display_order: img.display_order ?? i }).eq('id', other.id)]);
    loadImages(id);
  };

  const has = (type, slug) => opts.some((o) => o.option_type === type && o.option_slug === slug);
  const isDefault = (type, slug) => opts.some((o) => o.option_type === type && o.option_slug === slug && o.is_default);
  const toggleOpt = async (type, row) => {
    if (has(type, row.slug)) await supabase.from('product_options').delete().eq('product_id', id).eq('option_type', type).eq('option_slug', row.slug);
    else await supabase.from('product_options').insert({ product_id: id, option_type: type, option_slug: row.slug, display_order: row.display_order || 0, is_default: !opts.some((o) => o.option_type === type) });
    loadOpts(id);
    invalidateCatalog();
  };
  const setDefault = async (type, slug) => {
    await Promise.all([...opts.filter((o) => o.option_type === type && o.is_default).map((o) => supabase.from('product_options').update({ is_default: false }).eq('id', o.id)), supabase.from('product_options').update({ is_default: true }).eq('product_id', id).eq('option_type', type).eq('option_slug', slug)]);
    loadOpts(id);
    invalidateCatalog();
  };

  const field = (k, label, props = {}) => (
    <label className="ad-field">
      {label}
      <input className="ad-input" value={f[k] ?? ''} onChange={(e) => set(k, e.target.value)} {...props} />
    </label>
  );

  return (
    <>
      <Link to="/admin/products" className="ad-link">
        ← Products
      </Link>
      <h1 className="ad-h1">{isNew ? 'Add product' : f.name || 'Edit product'}</h1>
      {msg && <div className="ad-ok">{msg}</div>}
      {err && <div className="ad-err">{err}</div>}
      <form className="ad-card ad-form" onSubmit={save}>
        <div className="ad-grid2">
          {field('name', 'Name', { required: true })}
          {field('legacy_id', 'Product code (used in the URL, e.g. p051)')}
          <label className="ad-field">
            Category
            <select className="ad-input" value={f.category_slug || ''} onChange={(e) => set('category_slug', e.target.value)}>
              <option value="">—</option>
              {cats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {field('slug', 'Slug')}
          {field('price', 'From price (₹)', { type: 'number' })}
          {field('compare_price', 'Compare-at price (₹, optional)', { type: 'number' })}
          {field('rating', 'Rating (from Amazon)', { type: 'number', step: '0.1', min: 0, max: 5 })}
          {field('review_count', 'Review count (from Amazon)', { type: 'number' })}
          {field('display_order', 'Display order', { type: 'number' })}
          {field('tags', 'Tags (comma separated)')}
        </div>
        <label className="ad-field">
          Description
          <textarea className="ad-input" rows={3} value={f.description || ''} onChange={(e) => set('description', e.target.value)} />
        </label>
        <div className="ad-toolbar">
          {[
            ['active', 'Live on site'],
            ['is_bestseller', 'Bestseller'],
            ['is_new_arrival', 'New arrival'],
            ['homepage_visible', 'Show on homepage'],
            ['customer_photo_eligible', 'Customers can add their photo'],
          ].map(([k, l]) => (
            <label key={k} className="ad-check">
              <input type="checkbox" checked={!!f[k]} onChange={(e) => set(k, e.target.checked)} /> {l}
            </label>
          ))}
        </div>
        <button className="ad-btn ad-btn-primary" disabled={busy}>
          {busy ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
      </form>

      {!isNew && (
        <>
          <div className="ad-card">
            <div className="ad-row-between">
              <h2>Photos</h2>
              <label className="ad-btn ad-btn-primary">
                + Upload
                <input type="file" accept="image/*" multiple hidden onChange={(e) => upload([...e.target.files])} />
              </label>
            </div>
            <p className="ad-muted">Tip: JPG or WebP around 1500px wide uploads fastest. The site resizes images automatically for each screen.</p>
            <div className="ad-images">
              {images.map((img, i) => (
                <div key={img.id} className={img.is_primary ? 'primary' : ''}>
                  <img src={optimized(img.url, 300)} alt="" />
                  <div className="ad-img-actions">
                    {img.is_primary ? <span className="ad-badge s-paid">Main</span> : <button onClick={() => makePrimary(img)}>Make main</button>}
                    <button onClick={() => moveImage(img, -1)} disabled={i === 0}>
                      ←
                    </button>
                    <button onClick={() => moveImage(img, 1)} disabled={i === images.length - 1}>
                      →
                    </button>
                    <button onClick={() => removeImage(img)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="ad-card">
            <h2>Options offered</h2>
            <p className="ad-muted">Tick what customers can choose. ★ marks the default.</p>
            {['size', 'colour', 'material'].map((type) => (
              <div key={type} className="ad-opts">
                <b>{type === 'size' ? 'Sizes' : type === 'colour' ? 'Frame colours' : 'Finishes'}</b>
                <div className="ad-toolbar">
                  {tables[type].map((row) => (
                    <span key={row.slug} className={`ad-chip ${has(type, row.slug) ? 'on' : ''}`}>
                      <button type="button" onClick={() => toggleOpt(type, row)}>
                        {row.name}
                        {type === 'size' && row.base_price ? ` · ${money(row.base_price)}` : ''}
                      </button>
                      {has(type, row.slug) && (
                        <button type="button" title="Make default" onClick={() => setDefault(type, row.slug)}>
                          {isDefault(type, row.slug) ? '★' : '☆'}
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <a className="ad-link" href={`/product/${f.legacy_id || id}`} target="_blank" rel="noreferrer">
            View on site ↗
          </a>
        </>
      )}
    </>
  );
}
