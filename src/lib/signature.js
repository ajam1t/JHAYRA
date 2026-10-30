import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// ════════════════════════════════════════════════════════════════════════
// JHAYRA Signature Experience — admin-curated luxury collection.
// Settings live in Supabase Storage (site-config/signature.json), edited in
// Admin → Signature. Only products the admin adds AND enables appear; the
// full catalogue is never included automatically.
//
// Pricing: by default Signature price = regular size price × 3 (multiplier
// editable in the admin). The admin may also set a custom price per size
// for any Signature product, which then wins.
// ════════════════════════════════════════════════════════════════════════

export const SIGNATURE_PATH = 'site-config/signature.json';
export const SIGNATURE_MULTIPLIER = 3;
export const PREVIEW_KEY = 'jh_signature_preview';

export const DEFAULT_SIGNATURE = {
  enabled: true,
  pricing: { enabled: true, multiplier: 3 },
  hero: {
    kicker: 'By invitation',
    title: 'The Jhayra Signature Experience',
    subtitle: 'Artistry · Exclusivity · Personal Service',
    lead: 'A small collection our founder considers our finest work — framed to order, presented beautifully, and delivered with personal care.',
    productId: 'p048',
  },
  // { productId, enabled, featured, note, prices? } — a starting selection the
  // admin can replace; publishing from Admin → Signature takes over from here.
  items: [
    { productId: 'p048', enabled: true, featured: true, note: 'Our most-loved devotional piece.' },
    { productId: 'p018', enabled: true, featured: false, note: '' },
    { productId: 'p003', enabled: true, featured: false, note: '' },
    { productId: 'p005', enabled: true, featured: true, note: '' },
    { productId: 'p016', enabled: true, featured: false, note: '' },
    { productId: 'p002', enabled: true, featured: false, note: '' },
    { productId: 'p007', enabled: true, featured: false, note: '' },
    { productId: 'p004', enabled: true, featured: false, note: '' },
    { productId: 'p006', enabled: true, featured: false, note: '' },
    { productId: 'p009', enabled: true, featured: false, note: '' },
  ],
  packaging: {
    enabled: true,
    title: 'Presented, not just packed',
    text: 'Every Signature piece is quality-checked by hand and packed securely for its journey. Premium packaging is included in the Signature price — never an extra charge.',
    points: ['Hand-checked before it leaves our workshop', 'Packed securely to arrive ready to hang', 'Printed gift card inside — prices hidden on gifts', 'Premium packaging included in every Signature price'],
    images: [],
  },
  founder: {
    enabled: true,
    fee: 5000,
    areas: ['Mumbai', 'Thane', 'Navi Mumbai'],
    // Ranges or single codes, comma/newline separated.
    pincodes: '400001-400104, 400601-400615, 400701-400710, 410206, 410208, 410209, 410210',
    slots: ['Saturday · 11 am – 2 pm', 'Saturday · 4 pm – 7 pm', 'Sunday · 11 am – 2 pm', 'Sunday · 4 pm – 7 pm'],
    note: 'Our founder delivers your artwork personally, at a slot confirmed with you on WhatsApp before your order ships.',
  },
  // Online payment for Signature carts needs the create-razorpay-order Edge
  // Function to apply the Signature price on the server (see
  // docs/SIGNATURE.md). Until then orders complete with the Signature
  // concierge on WhatsApp, at the same prices.
  checkout: { online: false },
  faq: [
    ['How is Signature pricing set?', 'Signature pieces are priced separately from our regular collection, and every Signature price includes premium packaging and personal service.'],
    ['Can I choose the size and frame finish?', 'Yes — every Signature piece is offered in the same sizes and frame finishes as the artwork in our regular collection.'],
    ['What is founder delivery?', 'An optional service in Mumbai, Thane and Navi Mumbai: our founder delivers your order personally at a confirmed slot. It is added to your order separately.'],
    ['How do I pay?', 'You can review your Signature bag at checkout. We confirm your order, delivery and slot with you personally on WhatsApp.'],
  ],
};

const merge = (d) => ({
  ...DEFAULT_SIGNATURE,
  ...d,
  pricing: { ...DEFAULT_SIGNATURE.pricing, ...(d?.pricing || {}) },
  hero: { ...DEFAULT_SIGNATURE.hero, ...(d?.hero || {}) },
  packaging: { ...DEFAULT_SIGNATURE.packaging, ...(d?.packaging || {}) },
  founder: { ...DEFAULT_SIGNATURE.founder, ...(d?.founder || {}) },
  checkout: { ...DEFAULT_SIGNATURE.checkout, ...(d?.checkout || {}) },
  items: Array.isArray(d?.items) ? d.items : [],
  faq: Array.isArray(d?.faq) && d.faq.length ? d.faq : DEFAULT_SIGNATURE.faq,
});

let cfg = DEFAULT_SIGNATURE;
let loading = null;
const listeners = new Set();

export function loadSignature(force = false) {
  if (loading && !force) return loading;
  const { data } = supabase.storage.from('product-images').getPublicUrl(SIGNATURE_PATH);
  loading = fetch(`${data.publicUrl}?v=${force ? Date.now() : Math.floor(Date.now() / 60000)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (json) {
        cfg = merge(json);
        listeners.forEach((fn) => fn(cfg));
      }
      return cfg;
    })
    .catch(() => cfg);
  return loading;
}

export async function saveSignature(next) {
  const body = { ...next, version: 1, updatedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
  const { error } = await supabase.storage.from('product-images').upload(SIGNATURE_PATH, blob, { upsert: true, contentType: 'application/json', cacheControl: '60' });
  if (error) throw error;
  cfg = merge(next);
  listeners.forEach((fn) => fn(cfg));
  return cfg;
}

export async function uploadSignatureImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `signature/${Date.now()}.${ext || 'jpg'}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type || 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

// Preview: Admin → Signature opens /signature-experience?preview=1 with the
// unsaved draft in localStorage.
function preview() {
  if (typeof window === 'undefined' || !new URLSearchParams(window.location.search).get('preview')) return null;
  try {
    return JSON.parse(localStorage.getItem(PREVIEW_KEY) || 'null');
  } catch {
    return null;
  }
}

export function useSignature() {
  const [state, setState] = useState(cfg);
  useEffect(() => {
    listeners.add(setState);
    loadSignature().then(setState);
    return () => listeners.delete(setState);
  }, []);
  const p = preview();
  return p ? { ...merge(p), preview: true } : state;
}

// ── Pricing ───────────────────────────────────────────────────────────────
// Admin-set price for this product and size wins; otherwise regular × multiplier.
export const multiplierOf = (s = cfg) => (s.pricing?.enabled === false ? 1 : Number(s.pricing?.multiplier) > 0 ? Number(s.pricing.multiplier) : SIGNATURE_MULTIPLIER);
export const signaturePrice = (regular, s = cfg, item, sizeSlug) => {
  const custom = Number(item?.prices?.[sizeSlug]);
  return custom > 0 ? Math.round(custom) : Math.round((Number(regular) || 0) * multiplierOf(s));
};

// Enabled items in display order, joined to live products. Never the whole
// catalogue: an empty list stays empty.
export function signatureItems(s, products) {
  const byId = Object.fromEntries((products || []).map((p) => [p.id, p]));
  return (s.items || [])
    .filter((i) => i.enabled !== false && byId[i.productId]?.thumbnail)
    .map((i) => ({ ...i, product: byId[i.productId] }));
}

// ── Founder delivery ──────────────────────────────────────────────────────
export function pincodeRules(text = '') {
  return String(text)
    .split(/[\s,;]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const [a, b] = x.split('-').map((n) => parseInt(n, 10));
      return [a, Number.isFinite(b) ? b : a];
    })
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
}
export function founderEligible(pin, s = cfg) {
  if (!s.founder?.enabled || !/^\d{6}$/.test(String(pin || ''))) return false;
  const n = parseInt(pin, 10);
  return pincodeRules(s.founder.pincodes).some(([a, b]) => n >= a && n <= b);
}
