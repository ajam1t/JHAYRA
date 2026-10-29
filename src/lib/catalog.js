import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { SIZES, COLOURS } from './frames';

// Small promise cache so navigating between pages never refetches the catalog.
const cache = new Map();
const listeners = new Map();
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

// Build-time snapshot (/data/catalog.json) from the site's own CDN. Lists show
// it instantly, then the live database answer replaces it if anything changed.
let snap = null;
function snapshot() {
  if (!snap) snap = typeof fetch === 'undefined' ? Promise.resolve(null) : fetch('/data/catalog.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return snap;
}
function fresh(key, fromSnap, live, ttl) {
  return cached(
    key,
    () =>
      new Promise((resolve, reject) => {
        let done = false;
        let snapJson = '';
        const l = live().then(
          (data) => {
            if (!done) {
              done = true;
              resolve(data);
            } else if (JSON.stringify(data) !== snapJson) {
              cache.set(key, { p: Promise.resolve(data), t: Date.now() });
              (listeners.get(key) || new Set()).forEach((fn) => fn(data));
            }
            return data;
          },
          (e) => {
            if (!done) reject(e);
          }
        );
        snapshot().then((s) => {
          const data = s && fromSnap(s);
          if (data && !done) {
            done = true;
            snapJson = JSON.stringify(data);
            resolve(data);
          }
        });
        return l;
      }),
    ttl
  );
}
function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
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
  return fresh(
    'products',
    (s) => s.products?.length && s.products.map(mapProduct),
    async () => {
      const { data, error } = await supabase.from('products').select('*, product_images(*)').eq('active', true).order('display_order');
      if (error) throw error;
      return (data || []).map(mapProduct);
    }
  );
}

export function loadCategories() {
  return fresh(
    'categories',
    (s) => s.categories?.length && s.categories,
    async () => {
      const { data, error } = await supabase.from('categories').select('*').eq('active', true).order('display_order');
      if (error) throw error;
      return data || [];
    }
  );
}

export function loadCollections() {
  return fresh('collections', (s) => s.collections?.length && s.collections, async () => {
    const { data, error } = await supabase
      .from('homepage_collections')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  });
}

async function frameTablesLive() {
  const [s, c, m] = await Promise.all([
    supabase.from('frame_sizes').select('*').eq('active', true).order('display_order'),
    supabase.from('frame_colours').select('*').eq('active', true).order('display_order'),
    supabase.from('frame_materials').select('*').eq('active', true).order('display_order'),
  ]);
  return { sizes: s.data || [], colours: c.data || [], materials: m.data || [] };
}
// For display (swatches, size names). Prices always use the live tables below.
export function loadFrameTables() {
  return fresh('frame-tables', (s) => s.frameTables?.sizes?.length && s.frameTables, frameTablesLive);
}
const loadFrameTablesLive = () => cached('frame-tables-live', frameTablesLive);

function fallbackConfig() {
  return {
    sizes: SIZES.map((s, i) => ({ slug: s.slug, name: s.name, dimensions: s.dimensions, ratioW: s.w, ratioH: s.h, price: s.price, isDefault: i === 0 })),
    colours: ['Black', 'Gold', 'Brown'].map((n, i) => ({ slug: COLOURS[n].slug, name: n, hex: COLOURS[n].hex, isDefault: i === 0 })),
    materials: [{ slug: 'ps-moulding', name: 'PS Moulding', isDefault: true }],
  };
}

// Sizes and frame finishes offered per product, in one query for whole grids.
// Map of product dbId → { sizes, colours }. Products without option rows use
// the standard fallback (all four sizes, black/gold/brown).
function summarise(rows) {
  const out = {};
  for (const o of rows || []) {
    const x = (out[o.product_id] ||= { sizes: 0, colours: 0, colourSlugs: [] });
    if (o.option_type === 'size') x.sizes++;
    else if (o.option_type === 'colour') {
      x.colours++;
      x.colourSlugs.push(o.option_slug);
    }
  }
  return out;
}
export function loadOptionSummary() {
  return fresh(
    'opt-summary',
    (s) => s.options?.length && summarise(s.options),
    async () => {
      const { data, error } = await supabase.from('product_options').select('product_id,option_type,option_slug');
      if (error) throw error;
      return summarise(data);
    }
  );
}
export const useOptionSummary = () => useAsync(loadOptionSummary, [], 'opt-summary');
export const useFrameTables = () => useAsync(loadFrameTables, [], 'frame-tables');

// Mirrors the options logic of the original site so prices match the payment function.
export function loadFrameConfig(productDbId) {
  return cached('cfg:' + productDbId, async () => {
    const [{ data: opts }, tables] = await Promise.all([
      supabase.from('product_options').select('*').eq('product_id', productDbId),
      loadFrameTablesLive(),
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

export function useAsync(fn, deps = [], key) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => (key ? subscribe(key, (data) => setState({ data, loading: false, error: null })) : undefined), [key]);
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

export const useProducts = () => useAsync(loadProducts, [], 'products');
export const useCategories = () => useAsync(loadCategories, [], 'categories');
export const useCollections = () => useAsync(loadCollections, [], 'collections');

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

// A real catalogue photo used as the Living Art Studio's sample before a customer uploads.
export function useSamplePhoto() {
  const { data: products } = useProducts();
  const p = (products || []).find((x) => x.category === 'family' && x.thumbnail) || (products || []).find((x) => x.category === 'photography' && x.thumbnail);
  return p?.thumbnail;
}
