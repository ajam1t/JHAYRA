import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { T } from './adminUI';

const BLANK = {
  name: '', slug: '', legacy_id: '', description: '', category_slug: '',
  price: 499, compare_price: '', tags: '',
  rating: 4.5, review_count: 0,
  is_bestseller: false, is_new_arrival: false,
  homepage_visible: false, display_order: 0, active: true,
  customer_photo_eligible: false,
};

const s = {
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.5rem', color: T.text, marginBottom: '1.5rem' },
  form: { maxWidth: '720px' },
  row: { marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '0.72rem', letterSpacing: '0.1em', color: T.muted, textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 700 },
  input: { width: '100%', background: T.surface, border: `1.5px solid ${T.border2}`, borderRadius: '8px', color: T.text, fontSize: '0.9rem', padding: '0.6rem 0.9rem', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: T.surface, border: `1.5px solid ${T.border2}`, borderRadius: '8px', color: T.text, fontSize: '0.875rem', padding: '0.6rem 0.9rem', outline: 'none', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' },
  select: { width: '100%', background: T.surface, border: `1.5px solid ${T.border2}`, borderRadius: '8px', color: T.text, fontSize: '0.9rem', padding: '0.6rem 0.9rem', outline: 'none', boxSizing: 'border-box' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: T.text2, cursor: 'pointer' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  btnRow: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  saveBtn: { padding: '0.7rem 1.6rem', background: T.gold, color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(182,141,64,.28)' },
  cancelBtn: { padding: '0.7rem 1.3rem', background: T.surface, color: T.text2, border: `1.5px solid ${T.border2}`, borderRadius: '9px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  err: { background: T.dangerBg, border: '1px solid #F0C9BC', borderRadius: '8px', color: T.danger, fontSize: '0.82rem', padding: '0.6rem 0.8rem', marginBottom: '1rem' },
  success: { background: T.okBg, border: '1px solid #BFE3C6', borderRadius: '8px', color: T.ok, fontSize: '0.82rem', padding: '0.6rem 0.8rem', marginBottom: '1rem' },
  imgSection: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: T.shadow },
  imgTitle: { fontSize: '0.72rem', letterSpacing: '0.1em', color: T.muted, textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 },
  fileInput: { fontSize: '0.82rem', color: T.muted },
  imgGrid: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' },
  imgThumb: { width: '84px', height: '84px', objectFit: 'cover', borderRadius: '8px', border: `1.5px solid ${T.border2}`, display: 'block' },
  delImg: { fontSize: '0.68rem', color: T.danger, background: 'none', border: 'none', cursor: 'pointer', display: 'block', textAlign: 'center', marginTop: '2px' },
  optChip: (on) => ({ padding: '.45rem .85rem', borderRadius: '20px', border: `1.5px solid ${on ? T.gold : T.border2}`, background: on ? T.goldSoft : T.surface, color: on ? T.goldDeep : T.muted, fontSize: '.8rem', fontWeight: on ? 700 : 500, cursor: 'pointer' }),
  starBtn: (on) => ({ fontSize: '.68rem', background: 'none', border: 'none', cursor: 'pointer', color: on ? T.gold : T.muted2, fontWeight: on ? 700 : 400 }),
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function ProductForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(BLANK);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Per-product option catalogs + enabled options (#5)
  const [catalog, setCatalog] = useState({ size: [], material: [], colour: [] });
  const [options, setOptions] = useState([]); // rows from product_options

  async function loadImages(productId) {
    const { data: imgs } = await supabase.from('product_images').select('*').eq('product_id', productId).order('display_order');
    setImages(imgs || []);
  }
  async function loadOptions(productId) {
    const { data } = await supabase.from('product_options').select('*').eq('product_id', productId);
    setOptions(data || []);
  }

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const [{ data: cats }, { data: sizes }, { data: colours }, { data: materials }] = await Promise.all([
        supabase.from('categories').select('slug,name').order('display_order'),
        supabase.from('frame_sizes').select('*').eq('active', true).order('display_order'),
        supabase.from('frame_colours').select('*').eq('active', true).order('display_order'),
        supabase.from('frame_materials').select('*').eq('active', true).order('display_order'),
      ]);
      setCategories(cats || []);
      setCatalog({ size: sizes || [], colour: colours || [], material: materials || [] });

      if (!isNew) {
        const { data: p } = await supabase.from('products').select('*').eq('id', id).single();
        if (p) setForm({ ...p, tags: (p.tags || []).join(', '), compare_price: p.compare_price || '', customer_photo_eligible: !!p.customer_photo_eligible });
        await Promise.all([loadImages(id), loadOptions(id)]);
      }
    }
    load();
  }, [id, isNew]);

  const isEnabled = (type, slug) => options.some(o => o.option_type === type && o.option_slug === slug);
  const isDefaultOpt = (type, slug) => options.some(o => o.option_type === type && o.option_slug === slug && o.is_default);

  async function toggleOption(type, slug, order) {
    if (isNew) { setError('Save the product first, then configure options.'); return; }
    if (isEnabled(type, slug)) {
      await supabase.from('product_options').delete().eq('product_id', id).eq('option_type', type).eq('option_slug', slug);
    } else {
      const firstOfType = !options.some(o => o.option_type === type);
      await supabase.from('product_options').insert({ product_id: id, option_type: type, option_slug: slug, display_order: order || 0, is_default: firstOfType });
    }
    loadOptions(id);
  }

  async function setDefaultOption(type, slug) {
    if (!isEnabled(type, slug)) return;
    // Clear existing default for this type, then set the new one
    const cur = options.filter(o => o.option_type === type && o.is_default);
    await Promise.all([
      ...cur.map(o => supabase.from('product_options').update({ is_default: false }).eq('id', o.id)),
      supabase.from('product_options').update({ is_default: true }).eq('product_id', id).eq('option_type', type).eq('option_slug', slug),
    ]);
    loadOptions(id);
  }

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && isNew) next.slug = slugify(value);
      return next;
    });
  }

  async function uploadImages(files) {
    if (!supabase || !files.length) return;
    setUploading(true);
    const productId = isNew ? null : id;
    if (!productId) { setError('Save the product first, then upload images.'); setUploading(false); return; }

    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${productId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file);
      if (upErr) { setError(`Upload failed: ${upErr.message}`); continue; }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('product_images').insert({ product_id: productId, storage_path: path, url: publicUrl, display_order: images.length });
    }

    await loadImages(productId);
    setUploading(false);
  }

  async function deleteImage(img) {
    await supabase.storage.from('product-images').remove([img.storage_path]);
    await supabase.from('product_images').delete().eq('id', img.id);
    setImages(prev => prev.filter(i => i.id !== img.id));
  }

  // Artwork variants (#6): default (is_primary), enable/disable (active), reorder
  async function setDefaultImage(img) {
    await Promise.all([
      ...images.filter(i => i.is_primary).map(i => supabase.from('product_images').update({ is_primary: false }).eq('id', i.id)),
      supabase.from('product_images').update({ is_primary: true }).eq('id', img.id),
    ]);
    loadImages(id);
  }
  async function toggleImageActive(img) {
    await supabase.from('product_images').update({ active: img.active === false ? true : false }).eq('id', img.id);
    loadImages(id);
  }
  async function moveImage(img, dir) {
    const idx = images.findIndex(i => i.id === img.id);
    const swap = images[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from('product_images').update({ display_order: swap.display_order ?? 0 }).eq('id', img.id),
      supabase.from('product_images').update({ display_order: img.display_order ?? 0 }).eq('id', swap.id),
    ]);
    loadImages(id);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      legacy_id: form.legacy_id || null,
      description: form.description,
      category_slug: form.category_slug,
      price: parseFloat(form.price) || 499,
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      rating: parseFloat(form.rating) || 4.5,
      review_count: parseInt(form.review_count) || 0,
      is_bestseller: form.is_bestseller,
      is_new_arrival: form.is_new_arrival,
      homepage_visible: form.homepage_visible,
      display_order: parseInt(form.display_order) || 0,
      active: form.active,
      customer_photo_eligible: !!form.customer_photo_eligible,
    };

    try {
      if (isNew) {
        const { data, error: err } = await supabase.from('products').insert(payload).select().single();
        if (err) throw err;
        setSuccess('Product created! You can now upload images.');
        navigate(`/admin/products/${data.id}`, { replace: true });
      } else {
        const { error: err } = await supabase.from('products').update(payload).eq('id', id);
        if (err) throw err;
        setSuccess('Product saved successfully.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={s.heading}>{isNew ? 'Add Product' : 'Edit Product'}</h1>

      {error && <div style={s.err}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.row}>
          <label style={s.label}>Product Name *</label>
          <input style={s.input} value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div style={s.grid2}>
          <div style={s.row}>
            <label style={s.label}>Slug</label>
            <input style={s.input} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated from name" />
          </div>
          <div style={s.row}>
            <label style={s.label}>Legacy ID (p001…)</label>
            <input style={s.input} value={form.legacy_id} onChange={e => set('legacy_id', e.target.value)} placeholder="e.g. p001" />
          </div>
        </div>
        <div style={s.row}>
          <label style={s.label}>Description</label>
          <textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div style={s.row}>
          <label style={s.label}>Category</label>
          <select style={s.select} value={form.category_slug} onChange={e => set('category_slug', e.target.value)}>
            <option value="">— Select —</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div style={s.grid2}>
          <div style={s.row}>
            <label style={s.label}>Price (₹) *</label>
            <input style={s.input} type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} required />
          </div>
          <div style={s.row}>
            <label style={s.label}>Compare Price (₹)</label>
            <input style={s.input} type="number" min="0" value={form.compare_price} onChange={e => set('compare_price', e.target.value)} placeholder="Original price (optional)" />
          </div>
        </div>
        <div style={s.row}>
          <label style={s.label}>Tags (comma-separated)</label>
          <input style={s.input} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="gift, personalized, custom" />
        </div>
        <div style={s.grid2}>
          <div style={s.row}>
            <label style={s.label}>Rating (0–5)</label>
            <input style={s.input} type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => set('rating', e.target.value)} />
          </div>
          <div style={s.row}>
            <label style={s.label}>Review Count</label>
            <input style={s.input} type="number" min="0" value={form.review_count} onChange={e => set('review_count', e.target.value)} />
          </div>
        </div>
        <div style={s.row}>
          <label style={s.label}>Display Order</label>
          <input style={s.input} type="number" min="0" value={form.display_order} onChange={e => set('display_order', e.target.value)} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ ...s.label, marginBottom: '0.5rem' }}>Flags</label>
          {[
            ['active', 'Active (visible on storefront)'],
            ['homepage_visible', 'Show on Homepage'],
            ['is_bestseller', 'Bestseller'],
            ['is_new_arrival', 'New Arrival'],
            ['customer_photo_eligible', 'Customer can replace artwork with their own photo'],
          ].map(([field, label]) => (
            <label key={field} style={s.checkRow}>
              <input type="checkbox" checked={!!form[field]} onChange={e => set(field, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>

        <div style={s.btnRow}>
          <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
          <button type="button" style={s.cancelBtn} onClick={() => navigate('/admin/products')}>Cancel</button>
        </div>
      </form>

      {!isNew && (
        <div style={{ maxWidth: '720px' }}>
          {/* Per-product frame options (#5) */}
          <div style={{ ...s.imgSection, marginTop: '2rem' }}>
            <div style={s.imgTitle}>Frame Options — enable what this product offers</div>
            <div style={{ fontSize: '.75rem', color: T.muted2, marginBottom: '1rem' }}>
              Click to enable/disable. ★ marks the default the customer sees first. Manage the master lists in <b>Catalog</b>.
            </div>
            {[['size', 'Sizes'], ['material', 'Materials'], ['colour', 'Colours']].map(([type, label]) => (
              <div key={type} style={{ marginBottom: '1rem' }}>
                <div style={{ ...s.label, marginBottom: '.5rem' }}>{label}</div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {catalog[type].map((opt, i) => {
                    const on = isEnabled(type, opt.slug);
                    return (
                      <div key={opt.slug} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <button type="button" style={s.optChip(on)} onClick={() => toggleOption(type, opt.slug, opt.display_order ?? i)}>
                          {type === 'colour' && <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: opt.hex, border: '1px solid rgba(0,0,0,.15)', marginRight: '5px', verticalAlign: 'middle' }} />}
                          {opt.name}{type === 'size' && opt.base_price ? ` · ₹${(+opt.base_price).toLocaleString('en-IN')}` : ''}
                        </button>
                        {on && (
                          <button type="button" style={s.starBtn(isDefaultOpt(type, opt.slug))} onClick={() => setDefaultOption(type, opt.slug)}>
                            {isDefaultOpt(type, opt.slug) ? '★ default' : '☆ set default'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {catalog[type].length === 0 && <span style={{ fontSize: '.78rem', color: T.muted2 }}>No {label.toLowerCase()} in Catalog yet.</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Artwork variants (#6) */}
          <div style={{ ...s.imgSection }}>
            <div style={s.imgTitle}>Artwork Variants</div>
            <div style={{ fontSize: '.75rem', color: T.muted2, marginBottom: '.5rem' }}>
              Upload one or more clean artworks (no frame). ★ = default shown first. Customers swipe through the enabled variants.
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              style={s.fileInput}
              onChange={e => uploadImages(Array.from(e.target.files))}
              disabled={uploading}
            />
            {uploading && <div style={{ fontSize: '0.8rem', color: T.gold, marginTop: '0.5rem' }}>Uploading…</div>}
            <div style={s.imgGrid}>
              {images.map((img, i) => (
                <div key={img.id} style={{ width: '84px', opacity: img.active === false ? .45 : 1 }}>
                  <div style={{ position: 'relative' }}>
                    <img src={img.url} alt={img.alt_text || ''} style={s.imgThumb} />
                    {img.is_primary && <span style={{ position: 'absolute', top: '2px', left: '2px', fontSize: '.6rem', background: T.gold, color: '#fff', borderRadius: '4px', padding: '0 4px', fontWeight: 700 }}>★</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                    <button type="button" style={s.starBtn(false)} onClick={() => moveImage(img, -1)} disabled={i === 0}>↑</button>
                    <button type="button" style={s.starBtn(false)} onClick={() => moveImage(img, 1)} disabled={i === images.length - 1}>↓</button>
                  </div>
                  <button type="button" style={s.starBtn(img.is_primary)} onClick={() => setDefaultImage(img)}>{img.is_primary ? '★ default' : '☆ default'}</button>
                  <button type="button" style={{ ...s.starBtn(false), display: 'block', margin: '0 auto' }} onClick={() => toggleImageActive(img)}>{img.active === false ? 'Enable' : 'Disable'}</button>
                  <button style={s.delImg} onClick={() => deleteImage(img)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
