import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { COLLECTIONS } from './collections';

// Homepage campaigns (festivals, weddings, gifting moments). Admins edit them
// in Admin → Campaigns; the list is stored as JSON in Supabase Storage next to
// the templates and festivals config, so no database migration is needed.
// A campaign shows only while enabled and between its start and end dates
// (inclusive, India time) — expired and scheduled ones are hidden automatically.

export const CAMPAIGNS_PATH = 'site-config/campaigns.json';

// Where a campaign can send people: every option is an existing route.
export const TARGETS = [
  ...COLLECTIONS.map((c) => ({ id: `collection:${c.id}`, label: `Collection · ${c.title}`, to: `/collections/${c.id}` })),
  { id: 'shop:wedding', label: 'Shop · Wedding', to: '/shop?category=wedding' },
  { id: 'shop:love-romance', label: 'Shop · Love & Romance', to: '/shop?category=love-romance' },
  { id: 'shop:occasions', label: 'Shop · Occasions', to: '/shop?category=occasions' },
  { id: 'shop:religious', label: 'Shop · Religious', to: '/shop?category=religious' },
  { id: 'shop:family', label: 'Shop · Family', to: '/shop?category=family' },
  { id: 'shop:baby-kids', label: 'Shop · Baby & Kids', to: '/shop?category=baby-kids' },
  { id: 'world:festivals', label: 'World · Festivals', to: '/worlds/festivals' },
  { id: 'world:wedding', label: 'World · Wedding', to: '/worlds/wedding' },
  { id: 'world:divine', label: 'World · Divine', to: '/worlds/divine' },
  { id: 'world:love', label: 'World · Love Stories', to: '/worlds/love' },
  { id: 'world:gifts', label: 'World · Gifts by Budget', to: '/worlds/gifts' },
  { id: 'create:festivals', label: 'Personalised · Festival designs', to: '/customize?moment=festivals' },
  { id: 'create:wedding', label: 'Personalised · Wedding designs', to: '/customize?moment=wedding' },
  { id: 'create:anniversary', label: 'Personalised · Anniversary designs', to: '/customize?moment=anniversary' },
  { id: 'page:gift-finder', label: 'Gift Finder', to: '/gift-finder' },
  { id: 'page:celebrations', label: 'Celebrations page', to: '/celebrations' },
];
export const targetFor = (id) => TARGETS.find((t) => t.id === id) || TARGETS.find((t) => t.id === 'page:celebrations');

// Shipped defaults, used until an admin saves the first list. Images are the
// shop's own product photography (by product code) until a banner is uploaded.
export const DEFAULT_CAMPAIGNS = [
  {
    id: 'diwali-2026',
    title: 'Diwali Collection',
    kicker: 'Festival special',
    subtitle: 'Light up your home with meaningful art — Lakshmi, Ganesha and festive frames, plus gifts that say shubh Deepavali.',
    cta: 'Explore Collection',
    target: 'world:festivals',
    image: '',
    imageProduct: 'p043',
    start: '2026-10-20',
    end: '2026-11-08',
    enabled: false,
    priority: 1,
  },
  {
    id: 'wedding-season-2026',
    title: 'The Wedding Season',
    kicker: 'Shaadi 2026–27',
    subtitle: 'Names, dates and the photographs that matter — keepsakes and gifts for every wedding on your calendar.',
    cta: 'Explore Collection',
    target: 'shop:wedding',
    image: '',
    imageProduct: 'p024',
    start: '2026-10-25',
    end: '2027-02-28',
    enabled: false,
    priority: 2,
  },
  {
    id: 'gifting',
    title: 'Gifts They’ll Keep',
    kicker: 'For every occasion',
    subtitle: 'Birthdays, anniversaries and housewarmings — framed art and personalised gifts, delivered free across India.',
    cta: 'Explore Collection',
    target: 'collection:art-for-gifting',
    image: '',
    imageProduct: 'p028',
    start: '2026-01-01',
    end: '2027-12-31',
    enabled: false,
    priority: 3,
  },
];

// Today as YYYY-MM-DD in India time.
export function todayIST(now = new Date()) {
  return new Date(now.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
}

export function campaignStatus(c, today = todayIST()) {
  if (c.enabled === false) return 'disabled';
  if (c.start && today < c.start) return 'scheduled';
  if (c.end && today > c.end) return 'expired';
  return 'live';
}

export const liveCampaigns = (list, today = todayIST()) => list.filter((c) => campaignStatus(c, today) === 'live').sort((a, b) => (a.priority || 99) - (b.priority || 99));

let list = DEFAULT_CAMPAIGNS;
const listeners = new Set();
let loading = null;

export function loadCampaigns(force = false) {
  if (loading && !force) return loading;
  const { data } = supabase.storage.from('product-images').getPublicUrl(CAMPAIGNS_PATH);
  loading = fetch(`${data.publicUrl}?v=${force ? Date.now() : Math.floor(Date.now() / 300000)}`)
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
