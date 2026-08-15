import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const BLANK = {
  name: '', slug: '', legacy_id: '', description: '', category_slug: '',
  price: 499, compare_price: '', tags: '',
  rating: 4.5, review_count: 0,
  is_bestseller: false, is_new_arrival: false,
  homepage_visible: false, display_order: 0, active: true,
};

const s = {
  heading: { fontFamily: 'var(--fd, serif)', fontSize: '1.4rem', color: '#c9a96e', marginBottom: '1.5rem' },
  form: { maxWidth: '680px' },
  row: { marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '0.72rem', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: '0.35rem' },
  input: { width: '100%', background: '#111', border: '1px solid #252525', borderRadius: '7px', color: '#e8e0d4', fontSize: '0.9rem', padding: '0.6rem 0.9rem', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: '#111', border: '1px solid #252525', borderRadius: '7px', color: '#e8e0d4', fontSize: '0.875rem', padding: '0.6rem 0.9rem', outline: 'none', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' },
  select: { width: '100%', background: '#111', border: '1px solid #252525', borderRadius: '7px', color: '#e8e0d4', fontSize: '0.9rem', padding: '0.6rem 0.9rem', outline: 'none', boxSizing: 'border-box' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#ccc', cursor: 'pointer' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  btnRow: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  saveBtn: { padding: '0.7rem 1.5rem', background: '#c9a96e', color: '#0a0a0a', border: 'none', borderRadius: '7px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '0.7rem 1.25rem', background: 'none', color: '#888', border: '1px solid #252525', borderRadius: '7px', fontSize: '0.875rem', cursor: 'pointer' },
  err: { background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.25)', borderRadius: '6px', color: '#e07070', fontSize: '0.82rem', padding: '0.6rem 0.8rem', marginBottom: '1rem' },
  success: { background: 'rgba(80,200,120,0.08)', border: '1px solid rgba(80,200,120,0.2)', borderRadius: '6px', color: '#6cda96', fontSize: '0.82rem', padding: '0.6rem 0.8rem', marginBottom: '1rem' },
  imgSection: { background: '#111', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' },
  imgTitle: { fontSize: '0.72rem', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: '0.75rem' },
  fileInput: { fontSize: '0.82rem', color: '#888' },
  imgGrid: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' },
  imgThumb: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #252525' },
  delImg: { fontSize: '0.7rem', color: '#e07070', background: 'none', border: 'none', cursor: 'pointer', display: 'block', textAlign: 'center', marginTop: '2px' },
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

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const { data: cats } = await supabase.from('categories').select('slug,name').order('display_order');
      setCategories(cats || []);

      if (!isNew) {
        const { data: p } = await supabase.from('products').select('*').eq('id', id).single();
        if (p) setForm({ ...p, tags: (p.tags || []).join(', '), compare_price: p.compare_price || '' });

        const { data: imgs } = await supabase.from('product_images').select('*').eq('product_id', id).order('display_order');
        setImages(imgs || []);
      }
    }
    load();
  }, [id, isNew]);

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

    const { data: imgs } = await supabase.from('product_images').select('*').eq('product_id', productId).order('display_order');
    setImages(imgs || []);
    setUploading(false);
  }

  async function deleteImage(img) {
    await supabase.storage.from('product-images').remove([img.storage_path]);
    await supabase.from('product_images').delete().eq('id', img.id);
    setImages(prev => prev.filter(i => i.id !== img.id));
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
        <div style={{ ...s.imgSection, marginTop: '2rem', maxWidth: '680px' }}>
          <div style={s.imgTitle}>Product Images</div>
          <input
            type="file"
            accept="image/*"
            multiple
            style={s.fileInput}
            onChange={e => uploadImages(Array.from(e.target.files))}
            disabled={uploading}
          />
          {uploading && <div style={{ fontSize: '0.8rem', color: '#c9a96e', marginTop: '0.5rem' }}>Uploading…</div>}
          <div style={s.imgGrid}>
            {images.map(img => (
              <div key={img.id}>
                <img src={img.url} alt={img.alt_text || ''} style={s.imgThumb} />
                <button style={s.delImg} onClick={() => deleteImage(img)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
