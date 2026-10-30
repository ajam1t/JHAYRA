import { useEffect, useState } from 'react';
import seed from '../templates.json';
import { supabase } from './supabase';

// Templates and their groups live in Supabase Storage as one JSON file that the
// admin "Templates" screen edits (public read, admin write — the same bucket as
// product photos). The bundled JSON is the starting set and offline fallback.
export const CONFIG_BUCKET = 'product-images';
export const TEMPLATES_PATH = 'site-config/templates.json';

let current = normalise(seed);
let loading = null;
const listeners = new Set();

function normalise(data) {
  const groups = data.groups || [];
  const templates = (data.templates || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  return {
    groups,
    templates,
    active: templates.filter((t) => t.status !== 'inactive'),
    groupMap: Object.fromEntries(groups.map((g) => [g.id, g])),
    map: Object.fromEntries(templates.map((t) => [t.id, t])),
  };
}

export function loadTemplates(force = false) {
  if (loading && !force) return loading;
  const { data } = supabase.storage.from(CONFIG_BUCKET).getPublicUrl(TEMPLATES_PATH);
  loading = fetch(`${data.publicUrl}?v=${force ? Date.now() : Math.floor(Date.now() / 60000)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (json && Array.isArray(json.templates) && json.templates.length) {
        current = normalise(json);
        listeners.forEach((fn) => fn(current));
      }
      return current;
    })
    .catch(() => current);
  return loading;
}

export async function saveTemplates({ groups, templates }) {
  const blob = new Blob([JSON.stringify({ version: 2, updatedAt: new Date().toISOString(), groups, templates })], { type: 'application/json' });
  const { error } = await supabase.storage.from(CONFIG_BUCKET).upload(TEMPLATES_PATH, blob, { upsert: true, contentType: 'application/json', cacheControl: '60' });
  if (error) throw error;
  current = normalise({ groups, templates });
  listeners.forEach((fn) => fn(current));
  return current;
}

export function useTemplates() {
  const [state, setState] = useState(current);
  useEffect(() => {
    listeners.add(setState);
    loadTemplates();
    return () => listeners.delete(setState);
  }, []);
  return state;
}

export function templatesSnapshot() {
  return current;
}

// Gift-finder and homepage shortcuts into the template library.
export const MOMENTS = [
  { id: 'wedding', label: 'Wedding', groups: ['wedding'], hint: 'Names, date & 5 photos' },
  { id: 'anniversary', label: 'Anniversary', groups: ['anniversary', 'love', 'couple-frame'], hint: 'For the two of you' },
  { id: 'birthday', label: 'Birthday', groups: ['birthday', 'milestones'], hint: 'Make the day last' },
  { id: 'family', label: 'Family', groups: ['family', 'parents', 'collage-frame', 'mosaic-frame'], hint: 'Everyone in one frame' },
  { id: 'baby', label: 'Baby & Kids', groups: ['baby'], hint: 'First smiles, first steps' },
  { id: 'moon', label: 'Moon & Stars', groups: ['moon-style'], hint: 'The night you met' },
  { id: 'festivals', label: 'Festivals', groups: ['festivals', 'spiritual'], hint: 'Diwali, Rakhi & more' },
  { id: 'friends', label: 'Friends', groups: ['friendship', 'travel'], hint: 'Trips & inside jokes' },
  { id: 'quotes', label: 'Quotes', groups: ['genz', 'desi', 'quotes'], hint: 'Witty lines, your words' },
  { id: 'names', label: 'Name Boards', groups: ['names'], hint: 'For the nursery door' },
  { id: 'sports', label: 'Sports', groups: ['sports'], hint: 'Your name, your number' },
  { id: 'cities', label: 'City Love', groups: ['cities'], hint: 'Hometown in big type' },
];

// Building blocks for the from-scratch designer and the admin template editor.
export const LAYOUTS = [
  { id: 'single', label: '1 photo', slots: 1 },
  { id: 'pair', label: '2 side by side', slots: 2 },
  { id: 'three-col', label: '3 in a row', slots: 3 },
  { id: 'four-grid', label: '4 grid', slots: 4 },
  { id: 'five-1main', label: '1 big + 4', slots: 5 },
  { id: 'five-main-row', label: '1 tall + 4', slots: 5 },
  { id: 'six-grid', label: '6 grid', slots: 6 },
  { id: 'nine-grid', label: '9 mosaic', slots: 9 },
  { id: 'calendar-1', label: 'Photo + calendar', slots: 1 },
  { id: 'calendar-multi', label: '4 + calendar', slots: 4 },
  { id: 'text-only', label: 'Words only', slots: 0 },
];

export const DECORATIONS = [
  ['gold-border', 'Gold border'],
  ['ornate-border', 'Double border'],
  ['floral-corners', 'Floral corners'],
  ['gold-corners', 'Gold corners'],
  ['hearts', 'Hearts'],
  ['moon-stars', 'Moon & stars'],
  ['stars', 'Stars'],
  ['om-symbol', 'Om'],
  ['diya', 'Diya'],
  ['marigold', 'Marigold'],
  ['balloons', 'Balloons'],
  ['confetti', 'Confetti'],
  ['paw-print', 'Paw'],
  ['map-pin', 'Map pin'],
];

export function slotsFor(layout, n) {
  const count = n ?? LAYOUTS.find((l) => l.id === layout)?.slots ?? 1;
  return Array.from({ length: count }, (_, i) => ({ id: i === 0 ? 'main' : `s${i}`, label: i === 0 ? 'Main photo' : `Photo ${i + 1}`, shape: 'rect', required: i === 0 }));
}
