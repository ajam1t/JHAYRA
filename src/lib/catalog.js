import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { SIZES, COLOURS } from './frames';

// Small promise cache so navigating between pages never refetches the catalog.
const cache = new Map();
function cached(key, loader, ttl = 5 * 60 * 1000) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.p;
  const p = loader().catch((e) => {
    cache.delete(key);
    throw e;
  });
  cache.set(key, { p, t: Date.now() });
  return p;
}
export function invalidateCatalog() {
  cache.clear();
}

export function mapProduct(row) {
  const images = [...(row.product_images || [])]
    .filter((i) => i.active !== false)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const primary = images.find((i) => i.is_primary) || images[0];
  return {
    ...row,
    dbId: row.id,
    id: row.legacy_id || row.id,
    category: row.category_slug,
    images,
    thumbnail: primary?.url || '',
  };
}

export function loadProducts() {
  return cached('products', async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('active', true)
      .order('display_order');
    if (error) throw error;
    return (data || []).map(mapProduct);
  });
}

export function loadCategories() {
  return cached('categories', async () => {
    const { data, error } = await supabase.from('categories').select('*').eq('active', true).order('display_order');
    if (error) throw error;
    return data || [];
  });
}

export function loadCollections() {
  return cached('collections', async () => {
    const { data, error } = await supabase
      .from('homepage_collections')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  });
}

function loadFrameTables() {
  return cached('frame-tables', async () => {
    const [s, c, m] = await Promise.all([
      supabase.from('frame_sizes').select('*').eq('active', true).order('display_order'),
      supabase.from('frame_colours').select('*').eq('active', true).order('display_order'),
      supabase.from('frame_materials').select('*').eq('active', true).order('display_order'),
    ]);
    return { sizes: s.data || [], colours: c.data || [], materials: m.data || [] };
  });
}

function fallbackConfig() {
  return {
    sizes: SIZES.map((s, i) => ({ slug: s.slug, name: s.name, dimensions: s.dimensions, ratioW: s.w, ratioH: s.h, price: s.price, isDefault: i === 0 })),
    colours: ['Black', 'Gold', 'Brown'].map((n, i) => ({ slug: COLOURS[n].slug, name: n, hex: COLOURS[n].hex, isDefault: i === 0 })),
    materials: [{ slug: 'ps-moulding', name: 'PS Moulding', isDefault: true }],
  };
}

// Mirrors the options logic of the original site so prices match the payment function.
export function loadFrameConfig(productDbId) {
  return cached('cfg:' + productDbId, async () => {
    const [{ data: opts }, tables] = await Promise.all([
      supabase.from('product_options').select('*').eq('product_id', productDbId),
      loadFrameTables(),
    ]);
    if (!opts || !opts.length) return fallbackConfig();
    const bySlug = (rows) => new Map(rows.map((r) => [r.slug, r]));
    const sizes = bySlug(tables.sizes);
    const colours = bySlug(tables.colours);
    const materials = bySlug(tables.materials);
    const pick = (type) => opts.filter((o) => o.option_type === type).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const cfg = {
      sizes: pick('size')
        .map((o) => {
          const s = sizes.get(o.option_slug);
          return s && { slug: s.slug, name: s.name, dimensions: s.dimensions, ratioW: +s.ratio_w, ratioH: +s.ratio_h, price: o.price_override != null ? +o.price_override : +s.base_price, isDefault: o.is_default };
        })
        .filter(Boolean),
      colours: pick('colour')
        .map((o) => {
          const c = colours.get(o.option_slug);
          return c && { slug: c.slug, name: c.name, hex: c.hex, isDefault: o.is_default };
        })
        .filter(Boolean),
      materials: pick('material')
        .map((o) => {
          const m = materials.get(o.option_slug);
          return m && { slug: m.slug, name: m.name, description: m.description, isDefault: o.is_default };
        })
        .filter(Boolean),
    };
    if (!cfg.sizes.length || !cfg.colours.length || !cfg.materials.length) return fallbackConfig();
    return cfg;
  });
}

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch((error) => live && setState({ data: null, loading: false, error }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export const useProducts = () => useAsync(loadProducts, []);
export const useCategories = () => useAsync(loadCategories, []);
export const useCollections = () => useAsync(loadCollections, []);

// Light fuzzy search across names, categories, tags and descriptions.
export function searchProducts(products, q) {
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return products;
  return products
    .map((p) => {
      const hay = [p.name, p.category, (p.tags || []).join(' '), p.description].join(' ').toLowerCase();
      const name = p.name.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (name.startsWith(t)) score += 5;
        else if (name.includes(t)) score += 3;
        else if (hay.includes(t)) score += 1;
        else if (t.length > 3 && hay.includes(t.slice(0, -1))) score += 0.5;
        else return null;
      }
      return { p, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}
