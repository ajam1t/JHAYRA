// ════════════════════════════════════════════════════════════════════════
// Festival calendar. While a festival's window is open, the homepage turns
// into that festival's "world": colours, hero, particles, countdown, offer
// banner, curated products/templates, and the coupon auto-applies at checkout.
//
// To change an offer: edit `coupon` / `offer` below. The coupon code must
// also exist in the Supabase coupon system (validate-coupon function).
// Preview any theme on any day: add ?festival=<id> to the URL
// (and ?festival=off to clear the preview).
//
// Dates marked `verify: true` follow the lunar calendar — please confirm
// them with a panchang before the window opens.
// ════════════════════════════════════════════════════════════════════════

export const FESTIVALS = [
  {
    id: 'karva-chauth',
    name: 'Karva Chauth',
    enabled: false,
    date: '2026-10-29',
    from: '2026-10-12',
    to: '2026-10-29',
    verify: true,
    particles: 'diya',
    theme: { bg: '#2a0710', bg2: '#5c0c1c', ink: '#fbe9d2', accent: '#e8b75c', glow: 'rgba(232, 183, 92, 0.45)', moon: true },
    eyebrow: 'Karva Chauth',
    title: ['Her fast.', 'Your forever.', 'Framed.'],
    lead: 'Personalised couple & moon frames, handcrafted for the night she waits for the moon. Your names, your date, your photo.',
    coupon: 'KARVA10',
    offer: '10% off couple & moon frames',
    cta: { label: 'Create her Karva Chauth frame', to: '/customize?moment=moon' },
    cta2: { label: 'Shop couple frames', to: '/shop?category=love-romance' },
    categories: ['love-romance', 'wedding', 'religious'],
    templateGroups: ['moon-style', 'couple-frame', 'love', 'anniversary', 'wedding'],
    keywords: ['couple', 'love', 'moon', 'shiva', 'parvati', 'radha', 'krishna'],
    banner: 'Karva Chauth special — 10% off with KARVA10',
  },
  {
    id: 'diwali',
    name: 'Diwali',
    enabled: false,
    date: '2026-11-08',
    from: '2026-10-30',
    to: '2026-11-09',
    verify: true,
    particles: 'sparkle',
    theme: { bg: '#1a0d02', bg2: '#4a2508', ink: '#fff1d6', accent: '#f4b740', glow: 'rgba(244, 183, 64, 0.5)', rangoli: true },
    eyebrow: 'Diwali',
    title: ['Light up', 'their walls', 'this Diwali.'],
    lead: 'Lakshmi–Ganesha art, family frames and personalised gifts — wrapped, framed and delivered free across India.',
    coupon: 'DIWALI10',
    offer: '10% off every Diwali gift',
    cta: { label: 'Shop Diwali gifts', to: '/shop?category=religious' },
    cta2: { label: 'Personalise a family frame', to: '/customize?moment=family' },
    categories: ['religious', 'home-vastu', 'family'],
    templateGroups: ['festivals', 'spiritual', 'family', 'collage-frame'],
    keywords: ['ganesha', 'lakshmi', 'om', 'diya', 'vastu', 'family'],
    banner: 'Diwali gifting — 10% off with DIWALI10',
  },
  {
    id: 'bhai-dooj',
    name: 'Bhai Dooj',
    enabled: false,
    date: '2026-11-11',
    from: '2026-11-10',
    to: '2026-11-11',
    verify: true,
    particles: 'sparkle',
    theme: { bg: '#2b1405', bg2: '#6b3410', ink: '#fff1d6', accent: '#f0a848', glow: 'rgba(240, 168, 72, 0.45)' },
    eyebrow: 'Bhai Dooj',
    title: ['For the one', 'who always', 'had your back.'],
    lead: 'Sibling frames with your childhood photos, names and a note only the two of you understand.',
    coupon: null,
    cta: { label: 'Create a sibling frame', to: '/customize?moment=family' },
    cta2: { label: 'Shop all frames', to: '/shop' },
    categories: ['family'],
    templateGroups: ['family', 'friendship', 'collage-frame'],
    keywords: ['family', 'brother', 'sister'],
  },
  {
    id: 'christmas',
    name: 'Christmas & New Year',
    enabled: false,
    date: '2026-12-25',
    from: '2026-12-12',
    to: '2027-01-01',
    particles: 'snow',
    theme: { bg: '#0b1f1a', bg2: '#143a2f', ink: '#f2f7f2', accent: '#d9b25f', glow: 'rgba(217, 178, 95, 0.4)' },
    eyebrow: 'Christmas & New Year',
    title: ['Hang this year’s', 'best memory', 'forever.'],
    lead: 'A collage of 2026’s moments — trips, birthdays, firsts — made into one frame for the new year.',
    coupon: null,
    cta: { label: 'Make my 2026 collage', to: '/customize?moment=family' },
    cta2: { label: 'Shop gifts', to: '/shop' },
    categories: ['family', 'photography', 'quotes'],
    templateGroups: ['collage-frame', 'mosaic-frame', 'calendar', 'travel'],
    keywords: ['collage', 'family', 'calendar'],
  },
  {
    id: 'valentines',
    name: 'Valentine’s Day',
    enabled: false,
    date: '2027-02-14',
    from: '2027-01-30',
    to: '2027-02-14',
    particles: 'petals',
    theme: { bg: '#2a0812', bg2: '#5e1028', ink: '#ffe9ee', accent: '#f08aa0', glow: 'rgba(240, 138, 160, 0.45)', moon: true },
    eyebrow: 'Valentine’s Day',
    title: ['The night', 'you met,', 'framed.'],
    lead: 'Moon-phase frames, couple collages and love notes in your own words. Made for two.',
    coupon: null,
    cta: { label: 'Create a love frame', to: '/customize?moment=moon' },
    cta2: { label: 'Shop couple frames', to: '/shop?category=love-romance' },
    categories: ['love-romance', 'wedding'],
    templateGroups: ['moon-style', 'love', 'couple-frame', 'anniversary'],
    keywords: ['love', 'couple', 'heart', 'moon'],
  },
  {
    id: 'holi',
    name: 'Holi',
    enabled: false,
    date: '2027-03-22',
    from: '2027-03-12',
    to: '2027-03-22',
    verify: true,
    particles: 'colour',
    theme: { bg: '#2a0f2e', bg2: '#5a1450', ink: '#fff4fb', accent: '#ffcc33', glow: 'rgba(255, 92, 168, 0.4)' },
    eyebrow: 'Holi',
    title: ['Colours fade.', 'Memories', 'don’t.'],
    lead: 'Turn this Holi’s happiest, messiest photos into a frame the whole family will love.',
    coupon: null,
    cta: { label: 'Frame my Holi photo', to: '/customize/photo' },
    cta2: { label: 'Shop modern art', to: '/shop?category=modern-art' },
    categories: ['modern-art', 'art-abstract', 'family'],
    templateGroups: ['festivals', 'family', 'friendship', 'collage-frame'],
    keywords: ['colour', 'abstract', 'family'],
  },
  {
    id: 'mothers-day',
    name: 'Mother’s Day',
    enabled: false,
    date: '2027-05-09',
    from: '2027-04-28',
    to: '2027-05-09',
    particles: 'petals',
    theme: { bg: '#2b1220', bg2: '#5b2a44', ink: '#fff0f4', accent: '#f2b6c4', glow: 'rgba(242, 182, 196, 0.45)' },
    eyebrow: 'Mother’s Day · 9 May',
    title: ['For the woman', 'who kept', 'every photo.'],
    lead: 'Family frames, “Maa” quote frames and childhood collages — say it on her wall.',
    coupon: null,
    cta: { label: 'Create a frame for Maa', to: '/customize?moment=family' },
    cta2: { label: 'Shop family frames', to: '/shop?category=family' },
    categories: ['family', 'quotes'],
    templateGroups: ['parents', 'family', 'quotes', 'collage-frame'],
    keywords: ['mother', 'maa', 'family'],
  },
  {
    id: 'fathers-day',
    name: 'Father’s Day',
    enabled: false,
    date: '2027-06-20',
    from: '2027-06-09',
    to: '2027-06-20',
    particles: 'sparkle',
    theme: { bg: '#0f1622', bg2: '#1f3048', ink: '#eef3fa', accent: '#d9b25f', glow: 'rgba(217, 178, 95, 0.4)' },
    eyebrow: 'Father’s Day · 20 June',
    title: ['He never says it.', 'Put it', 'on his wall.'],
    lead: 'Father–child frames, then-and-now collages and quote frames for Papa.',
    coupon: null,
    cta: { label: 'Create a frame for Papa', to: '/customize?moment=family' },
    cta2: { label: 'Shop frames', to: '/shop?category=family' },
    categories: ['family', 'quotes', 'running-horses'],
    templateGroups: ['parents', 'family', 'milestones'],
    keywords: ['father', 'papa', 'family', 'horse'],
  },
  {
    id: 'raksha-bandhan',
    name: 'Raksha Bandhan',
    enabled: false,
    date: '2027-08-17',
    from: '2027-08-06',
    to: '2027-08-17',
    verify: true,
    particles: 'sparkle',
    theme: { bg: '#2a1004', bg2: '#6a2a0c', ink: '#fff2e0', accent: '#f6b44c', glow: 'rgba(246, 180, 76, 0.45)' },
    eyebrow: 'Raksha Bandhan',
    title: ['A thread', 'for a lifetime.', 'A frame too.'],
    lead: 'Rakhi frames with your photos and names — the gift your sibling will actually keep.',
    coupon: null,
    cta: { label: 'Create a Rakhi frame', to: '/customize?moment=festivals' },
    cta2: { label: 'Shop family frames', to: '/shop?category=family' },
    categories: ['family'],
    templateGroups: ['festivals', 'family', 'friendship'],
    keywords: ['rakhi', 'brother', 'sister', 'family'],
  },
];

import { supabase } from './supabase';

// Admin-edited copy lives in Supabase Storage next to the templates file.
export const FESTIVALS_PATH = 'site-config/festivals.json';
let list = FESTIVALS;
export let FESTIVAL_MAP = Object.fromEntries(list.map((f) => [f.id, f]));
function setList(next) {
  list = next;
  FESTIVAL_MAP = Object.fromEntries(list.map((f) => [f.id, f]));
}
export const festivalList = () => list;

let loading = null;
export function loadFestivals(force = false) {
  if (loading && !force) return loading;
  const { data } = supabase.storage.from('product-images').getPublicUrl(FESTIVALS_PATH);
  loading = fetch(`${data.publicUrl}?v=${force ? Date.now() : Math.floor(Date.now() / 300000)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (json && Array.isArray(json.festivals)) setList(json.festivals);
      return list;
    })
    .catch(() => list);
  return loading;
}

export async function saveFestivals(next) {
  const blob = new Blob([JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), festivals: next })], { type: 'application/json' });
  const { error } = await supabase.storage.from('product-images').upload(FESTIVALS_PATH, blob, { upsert: true, contentType: 'application/json', cacheControl: '60' });
  if (error) throw error;
  setList(next);
}

const day = (s) => new Date(s + 'T00:00:00+05:30');

export function activeFestival(now = new Date()) {
  return list.find((f) => f.enabled !== false && now >= day(f.from) && now < new Date(day(f.to).getTime() + 86400000)) || null;
}

export function daysUntil(f, now = new Date()) {
  return Math.ceil((day(f.date) - now) / 86400000);
}

// "Order by" date so standard delivery (up to 9 business days) lands before the festival.
export function orderBy(f) {
  const d = day(f.date);
  let n = 9;
  while (n > 0) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0) n--;
  }
  return d;
}
