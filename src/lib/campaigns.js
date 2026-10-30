import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { withoutPromo } from './site';
import { COLLECTIONS } from './collections';
import { EVENT_THEMES, themeFor } from './eventThemes';

// Homepage campaigns (festivals, weddings, gifting moments). Admins edit them
// in Admin → Campaigns; the list is stored as JSON in Supabase Storage next to
// the templates and festivals config, so no database migration is needed.
// A campaign shows only while enabled and between its start and end dates
// (inclusive, India time) — expired and scheduled ones are hidden automatically.

export const CAMPAIGNS_PATH = 'site-config/campaigns.json';

// Where a campaign can send people: every option is an existing route.
export const TARGETS = [
  ...COLLECTIONS.map((c) => ({ id: `collection:${c.id}`, label: `Collection · ${c.title}`, to: `/collections/${c.id}` })),
  { id: 'shop:wedding', label: 'Shop · Wedding', to: '/shop/wedding' },
  { id: 'shop:love-romance', label: 'Shop · Love & Romance', to: '/shop/love-romance' },
  { id: 'shop:occasions', label: 'Shop · Occasions', to: '/shop/occasions' },
  { id: 'shop:religious', label: 'Shop · Religious', to: '/shop/religious' },
  { id: 'shop:family', label: 'Shop · Family', to: '/shop/family' },
  { id: 'shop:baby-kids', label: 'Shop · Baby & Kids', to: '/shop/baby-kids' },
  { id: 'world:festivals', label: 'World · Festivals', to: '/worlds/festivals' },
  { id: 'world:wedding', label: 'World · Wedding', to: '/worlds/wedding' },
  { id: 'world:divine', label: 'World · Divine', to: '/worlds/divine' },
  { id: 'world:love', label: 'World · Love Stories', to: '/worlds/love' },
  { id: 'world:gifts', label: 'World · Gifts by Budget', to: '/worlds/gifts' },
  { id: 'create:festivals', label: 'Personalised · Festival designs', to: '/customize?moment=festivals' },
  { id: 'create:wedding', label: 'Personalised · Wedding designs', to: '/customize?moment=wedding' },
  { id: 'create:anniversary', label: 'Personalised · Anniversary designs', to: '/customize?moment=anniversary' },
  { id: 'page:gift-finder', label: 'Gift Finder', to: '/gift-finder' },
  { id: 'page:shop', label: 'Shop · All wall art', to: '/shop' },
  { id: 'page:bestsellers', label: 'Shop · Bestsellers', to: '/shop?sort=bestsellers' },
  { id: 'page:photo', label: 'Personalised · Frame your photo', to: '/customize/photo' },
  { id: 'world:heritage', label: 'World · Mithila Heritage', to: '/worlds/heritage' },
  { id: 'page:celebrations', label: 'Celebrations page', to: '/celebrations' },
];
export const targetFor = (id) => TARGETS.find((t) => t.id === id) || TARGETS.find((t) => t.id === 'page:celebrations');

// Seeded annual events: one campaign per occasion, all paused until an admin
// switches them on. Lunar-calendar dates are marked `verify` — confirm with a
// panchang before activating. Times are India time (IST).
const SEED = [
  // theme, start, end, event date, verify
  ['diwali', '2026-10-28', '2026-11-09', '2026-11-08', true],
  ['bhai-dooj', '2026-11-10', '2026-11-11', '2026-11-11', true],
  ['chhath', '2026-11-12', '2026-11-16', '2026-11-15', true],
  ['wedding', '2026-11-17', '2027-02-28', '', false],
  ['christmas', '2026-12-12', '2026-12-26', '2026-12-25', false],
  ['new-year', '2026-12-27', '2027-01-03', '2027-01-01', false],
  ['lohri', '2027-01-08', '2027-01-13', '2027-01-13', false],
  ['pongal', '2027-01-09', '2027-01-16', '2027-01-14', false],
  ['valentines', '2027-01-30', '2027-02-14', '2027-02-14', false],
  ['eid', '2027-02-28', '2027-03-11', '2027-03-10', true],
  ['holi', '2027-03-12', '2027-03-22', '2027-03-22', true],
  ['mothers-day', '2027-04-28', '2027-05-09', '2027-05-09', false],
  ['fathers-day', '2027-06-09', '2027-06-20', '2027-06-20', false],
  ['independence-day', '2027-08-10', '2027-08-15', '2027-08-15', false],
  ['raksha-bandhan', '2027-08-06', '2027-08-17', '2027-08-17', true],
  ['janmashtami', '2027-08-18', '2027-08-25', '2027-08-25', true],
  ['ganesh-chaturthi', '2027-08-28', '2027-09-04', '2027-09-04', true],
  ['onam', '2027-09-05', '2027-09-12', '2027-09-12', true],
  ['navratri', '2027-09-28', '2027-10-10', '2027-10-07', true],
  ['karva-chauth', '2027-10-08', '2027-10-18', '2027-10-18', true],
];

// A new campaign pre-filled from a theme.
export function campaignFromTheme(themeId, extra = {}) {
  const t = themeFor(themeId);
  return {
    id: `${t.id}-${Date.now().toString(36)}`,
    theme: t.id,
    title: t.name,
    kicker: t.copy.kicker,
    headline: t.copy.title,
    em: t.copy.em,
    subtitle: t.copy.subtitle,
    cta: t.copy.cta,
    target: t.copy.target,
    image: '',
    imageMobile: '',
    imageProduct: '',
    palette: null,
    decor: null,
    particles: undefined,
    intensity: 1,
    duration: 0,
    layout: '',
    showStrip: true,
    showBanner: true,
    showPicks: true,
    showCountdown: true,
    coupon: '',
    start: '',
    end: '',
    eventDate: '',
    verify: false,
    enabled: false,
    priority: 5,
    ...extra,
  };
}

export const DEFAULT_CAMPAIGNS = SEED.map(([theme, start, end, eventDate, verify], i) => ({
  ...campaignFromTheme(theme),
  id: `${theme}-${(start || '').slice(0, 4)}`,
  start: `${start}T00:00`,
  end: `${end}T23:59`,
  eventDate,
  verify,
  // Wedding season runs for months, so festivals that fall inside it win.
  priority: theme === 'wedding' ? 9 : ['lohri', 'independence-day'].includes(theme) ? 4 : 3,
  sort: i,
}));

// ── Dates: everything is India time (IST, UTC+5:30) ───────────────────────
// Now as 'YYYY-MM-DDTHH:mm' in IST.
export function nowIST(now = new Date()) {
  return new Date(now.getTime() + 5.5 * 3600000).toISOString().slice(0, 16);
}
export const todayIST = (now = new Date()) => nowIST(now).slice(0, 10);
// Older campaigns stored dates only: start of day / end of day.
const startOf = (s) => (!s ? '' : s.length === 10 ? `${s}T00:00` : s.slice(0, 16));
const endOf = (s) => (!s ? '' : s.length === 10 ? `${s}T23:59` : s.slice(0, 16));

// paused · scheduled · live · expired
export function campaignStatus(c, now = nowIST()) {
  const t = now.length === 10 ? `${now}T12:00` : now;
  if (c.enabled === false) return 'paused';
  if (c.start && t < startOf(c.start)) return 'scheduled';
  if (c.end && t > endOf(c.end)) return 'expired';
  return 'live';
}

// Live campaigns, best first: lowest priority number, then the one that
// started most recently (so a short festival inside a long season wins).
export const liveCampaigns = (all, now = nowIST()) =>
  all
    .filter((c) => campaignStatus(c, now) === 'live')
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99) || startOf(b.start).localeCompare(startOf(a.start)));

// Active campaigns whose windows overlap at the same priority — the admin is
// warned, because the homepage can only feature one of them.
export function findConflicts(all) {
  const on = all.filter((c) => c.enabled !== false && campaignStatus(c) !== 'expired');
  const out = [];
  for (let i = 0; i < on.length; i++)
    for (let j = i + 1; j < on.length; j++) {
      const a = on[i];
      const b = on[j];
      const overlap = startOf(a.start || '0000') <= endOf(b.end || '9999') && startOf(b.start || '0000') <= endOf(a.end || '9999');
      if (overlap && (a.priority ?? 99) === (b.priority ?? 99)) out.push([a, b]);
    }
  return out;
}

// Theme defaults merged with the campaign's own choices: what the site renders.
// Campaigns saved before themes existed get one from their id or title.
export function guessTheme(c) {
  if (c.theme) return c.theme;
  const text = `${c.id} ${c.title}`.toLowerCase();
  return EVENT_THEMES.find((t) => t.id !== 'custom' && (text.includes(t.id) || text.includes(t.name.toLowerCase())))?.id || 'custom';
}

export function resolveCampaign(c) {
  if (!c) return null;
  const t = themeFor(guessTheme(c));
  return {
    ...c,
    theme: t.id,
    themeName: t.name,
    motif: t.motif,
    headline: c.headline ?? c.title,
    em: c.em ?? '',
    palette: { ...t.palette, ...(c.palette || {}) },
    decor: c.decor || t.decor,
    particles: c.particles === undefined ? t.particles : c.particles || null,
    layout: c.layout || t.layout,
    intensity: c.intensity ?? 1,
    duration: c.duration ?? 0,
    categories: c.categories || t.picks.categories,
    keywords: c.keywords || t.picks.keywords,
    showStrip: c.showStrip !== false,
    showBanner: c.showBanner !== false,
    showPicks: c.showPicks !== false,
    showCountdown: c.showCountdown !== false,
  };
}

// Preview: Admin opens /?campaign-preview=1 with the draft in localStorage,
// or /?campaign=<id> to preview any saved campaign regardless of its dates.
export const PREVIEW_KEY = 'jh_campaign_preview';
function previewCampaign(all) {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  try {
    if (q.get('campaign-preview')) return JSON.parse(localStorage.getItem(PREVIEW_KEY) || 'null');
  } catch {}
  const id = q.get('campaign');
  return id ? all.find((c) => c.id === id) || null : null;
}

// The campaign that dresses the site right now (or the preview).
export function useActiveCampaign() {
  const all = useCampaigns();
  const [, tick] = useState(0);
  // Re-check every minute so a campaign starts/ends on time without a reload.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  const preview = previewCampaign(all);
  return withoutPromo(resolveCampaign(preview ? { ...preview, preview: true } : liveCampaigns(all)[0] || null));
}

let list = DEFAULT_CAMPAIGNS;
const listeners = new Set();
let loading = null;

export function loadCampaigns(force = false) {
  if (loading && !force) return loading;
  const { data } = supabase.storage.from('product-images').getPublicUrl(CAMPAIGNS_PATH);
  loading = fetch(`${data.publicUrl}?v=${force ? Date.now() : Math.floor(Date.now() / 60000)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (json && Array.isArray(json.campaigns)) {
        list = json.campaigns;
        listeners.forEach((fn) => fn(list));
      }
      return list;
    })
    .catch(() => list);
  return loading;
}

export async function saveCampaigns(next) {
  const blob = new Blob([JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), campaigns: next })], { type: 'application/json' });
  const { error } = await supabase.storage.from('product-images').upload(CAMPAIGNS_PATH, blob, { upsert: true, contentType: 'application/json', cacheControl: '60' });
  if (error) throw error;
  list = next;
  listeners.forEach((fn) => fn(list));
  return list;
}

export async function uploadCampaignImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `campaigns/${Date.now()}.${ext || 'jpg'}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type || 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

export function useCampaigns() {
  const [state, setState] = useState(list);
  useEffect(() => {
    listeners.add(setState);
    loadCampaigns().then(setState);
    return () => listeners.delete(setState);
  }, []);
  return state;
}

// Banner image: uploaded image, else the chosen product's photo.
export const campaignImage = (c, products) => c.image || (products || []).find((p) => p.id === c.imageProduct)?.thumbnail || '';
