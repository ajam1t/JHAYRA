import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { JHAYRA_PRODUCTS } from '../data/products';

// Normalize Supabase row → same shape as static product data
// so ProductCard and all other components work without changes
function normalize(p) {
  const imgs = [...(p.product_images || [])].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  return {
    ...p,
    id: p.legacy_id || p.id,
    category: p.category_slug,
    bestSeller: p.is_bestseller,
    newArrival: p.is_new_arrival,
    reviewCount: p.review_count,
    featured: p.homepage_visible,
    stockStatus: p.active ? 'in-stock' : 'out-of-stock',
    tags: p.tags || [],
    images: imgs.map(i => i.url),
    // use first image if none is marked primary (newly uploaded images default to is_primary=false)
    thumbnail: imgs.find(i => i.is_primary)?.url || imgs[0]?.url || '',
  };
}

export function useProducts({ category, homepage, limit, search } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      let data = [...JHAYRA_PRODUCTS];
      if (category) data = data.filter(p => p.category === category);
      if (homepage) data = data.filter(p => p.bestSeller);
      if (search) data = data.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      if (limit) data = data.slice(0, limit);
      setProducts(data);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      let q = supabase.from('products').select('*, product_images(url, is_primary, display_order)').eq('active', true).order('display_order');
      if (category) q = q.eq('category_slug', category);
      if (homepage) q = q.eq('homepage_visible', true);
      if (search) q = q.ilike('name', `%${search}%`);
      if (limit) q = q.limit(limit);

      const { data, error: err } = await q;
      if (err) { setError(err.message); setLoading(false); return; }
      setProducts((data || []).map(normalize));
      setLoading(false);
    }

    load();
  }, [category, homepage, limit, search]);

  return { products, loading, error };
}

export function useProduct(legacyId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!legacyId) return;

    if (!supabase) {
      const p = JHAYRA_PRODUCTS.find(p => p.id === legacyId);
      setProduct(p || null);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('legacy_id', legacyId)
        .eq('active', true)
        .single();
      if (err) { setError(err.message); setLoading(false); return; }
      setProduct(data ? normalize(data) : null);
      setLoading(false);
    }

    load();
  }, [legacyId]);

  return { product, loading, error };
}
