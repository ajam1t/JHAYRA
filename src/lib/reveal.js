import { supabase } from './supabase';
import { SITE } from './site';

/* JHAYRA Gift Reveal — shared logic for the sender's creator and the
   recipient's page.

   Privacy: everything personal (names, message, photos, video or voice) is
   encrypted in the browser with AES-GCM. The key is put in the link after "#",
   which browsers never send to a server, so our database and storage only
   ever hold ciphertext. The server controls availability (expiry, the
   sender's off switch, deletion) — see docs/sql/2026-11-10-gift-reveals.sql. */

export const BUCKET = 'gift-reveals';
export const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Housewarming', 'Festival', 'Thank you', 'Just because'];
export const THEMES = [
  { id: 'envelope', name: 'Ivory Letter', line: 'A wax-sealed envelope on warm ivory' },
  { id: 'box', name: 'Champagne Gift Box', line: 'A ribboned box that opens to light' },
  { id: 'night', name: 'Midnight Keepsake', line: 'An espresso keepsake case with gold' },
];
export const EXPIRY = [
  [7, '7 days'],
  [30, '30 days'],
  [90, '90 days'],
];
export const LIMITS = { photos: 4, message: 600, name: 40, videoMB: 20, voiceSeconds: 60 };

/* ── bytes ↔ text ──────────────────────────────────────────────────────── */
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const b64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');

/* ── encryption ────────────────────────────────────────────────────────── */
export async function newKey() {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  return { key: await importKey(raw), text: b64u(raw) };
}
export const importKey = (raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
export const keyFromText = (text) => importKey(unb64u(text));

// iv (12 bytes) + ciphertext
async function seal(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return out;
}
async function open(key, bytes) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, key, bytes.subarray(12)));
}
export const sealJson = async (key, obj) => b64(await seal(key, new TextEncoder().encode(JSON.stringify(obj))));
export const openJson = async (key, text) => JSON.parse(new TextDecoder().decode(await open(key, unb64(text))));

/* ── media preparation ─────────────────────────────────────────────────── */
// Photos are resized to at most 1600 px and re-encoded, so they load quickly
// and carry no camera metadata (location, device).
export function preparePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Please choose a photo (JPG, PNG or WebP).'));
    if (file.size > 20 * 1024 * 1024) return reject(new Error('That photo is over 20 MB. Please choose a smaller one.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((blob) => (blob ? resolve({ blob, url: URL.createObjectURL(blob), w: c.width, h: c.height, mime: 'image/jpeg' }) : reject(new Error('That photo could not be read.'))), 'image/jpeg', 0.86);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That photo could not be opened in this browser. Please try a JPG or PNG.'));
    };
    img.src = url;
  });
}

export function prepareClip(file) {
  const kind = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'voice' : null;
  if (!kind) throw new Error('Please choose a video or an audio file.');
  if (file.size > LIMITS.videoMB * 1024 * 1024) throw new Error(`That file is over ${LIMITS.videoMB} MB. Please choose a shorter clip.`);
  return { kind, blob: file, url: URL.createObjectURL(file), mime: file.type };
}

/* ── create (sender) ───────────────────────────────────────────────────── */
async function putEncrypted(key, blob, onStep) {
  const name = `${hex(16)}.bin`;
  const sealed = await seal(key, new Uint8Array(await blob.arrayBuffer()));
  let last = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1200 * attempt));
    const { error } = await supabase.storage.from(BUCKET).upload(name, new Blob([sealed], { type: 'application/octet-stream' }), { contentType: 'application/octet-stream', upsert: false });
    if (!error || /exists|duplicate/i.test(error.message || '')) {
      onStep?.();
      return name;
    }
    last = error;
  }
  throw last || new Error('upload failed');
}

/** draft: { to, from, occasion, message, theme, product, photos:[{blob,w,h}], clip:{kind,blob,mime}|null, days } */
export async function createReveal(draft, onProgress) {
  const { key, text: keyText } = await newKey();
  // A personalised gift's picture is the customer's own design: it is encrypted
  // like the photos. A catalogue picture is already public and is linked.
  const ownPicture = draft.product?.image?.startsWith('data:') ? await (await fetch(draft.product.image)).blob() : null;
  const total = draft.photos.length + (draft.clip ? 1 : 0) + (ownPicture ? 1 : 0) + 1;
  let done = 0;
  const step = () => onProgress?.(++done / total);
  const photos = [];
  for (const p of draft.photos) photos.push({ file: await putEncrypted(key, p.blob, step), w: p.w, h: p.h, mime: 'image/jpeg' });
  const clip = draft.clip ? { kind: draft.clip.kind, mime: draft.clip.mime, file: await putEncrypted(key, draft.clip.blob, step) } : null;
  const product = draft.product ? (ownPicture ? { name: draft.product.name, file: await putEncrypted(key, ownPicture, step), mime: ownPicture.type || 'image/jpeg' } : { name: draft.product.name, image: draft.product.image }) : null;
  const payload = await sealJson(key, {
    v: 1,
    to: draft.to.trim(),
    from: draft.from.trim(),
    occasion: draft.occasion,
    message: draft.message.trim(),
    theme: draft.theme,
    product,
    photos,
    clip,
  });
  const manage = hex(24);
  const { data, error } = await supabase.rpc('create_gift_reveal', { p_payload: payload, p_media: [...photos.map((p) => p.file), ...(clip ? [clip.file] : []), ...(product?.file ? [product.file] : [])], p_manage_secret: manage, p_days: draft.days });
  if (error || !data) throw error || new Error('could not create');
  step();
  const rec = { id: data, key: keyText, manage, to: draft.to.trim(), occasion: draft.occasion, created: new Date().toISOString(), days: draft.days };
  saveMine(rec);
  return rec;
}

export const revealUrl = (rec) => `${SITE.url}/gift/${rec.id}#${rec.key}`;

/* ── open (recipient) ──────────────────────────────────────────────────── */
/** Returns { status } or { status:'ok', data } with photo/clip object URLs ready to show. */
export async function openReveal(id, keyText, { count = true } = {}) {
  if (!/^[a-f0-9]{32}$/.test(id || '')) return { status: 'not_found' };
  if (!keyText) return { status: 'no_key' };
  const { data: res, error } = await supabase.rpc('open_gift_reveal', { p_id: id, p_count: count });
  if (error) return { status: 'error' };
  if (res?.status !== 'ok') return { status: res?.status || 'not_found' };
  let key, body;
  try {
    key = await keyFromText(keyText);
    body = await openJson(key, res.payload);
  } catch {
    return { status: 'bad_key' };
  }
  const fetchOne = async (file, mime) => {
    const { data: blob, error: e } = await supabase.storage.from(BUCKET).download(file);
    if (e || !blob) return null;
    try {
      return URL.createObjectURL(new Blob([await open(key, new Uint8Array(await blob.arrayBuffer()))], { type: mime }));
    } catch {
      return null;
    }
  };
  // The first photo is needed straight away; the rest load alongside.
  const photos = (await Promise.all((body.photos || []).map((p) => fetchOne(p.file, p.mime || 'image/jpeg').then((url) => url && { url, w: p.w, h: p.h })))).filter(Boolean);
  const product = body.product ? { name: body.product.name, image: body.product.file ? await fetchOne(body.product.file, body.product.mime || 'image/jpeg') : safeImage(body.product.image) } : null;
  return {
    status: 'ok',
    expires: res.expires_at,
    data: { ...body, photos, product, clip: null },
    // Video / voice can be large: fetched only when the memory is on screen.
    loadClip: body.clip ? () => fetchOne(body.clip.file, body.clip.mime).then((url) => (url ? { kind: body.clip.kind, url } : null)) : null,
  };
}

// Only pictures from our own site or image services are shown as the gift.
const safeImage = (u) => (typeof u === 'string' && /^https:\/\/([a-z0-9-]+\.supabase\.co|wsrv\.nl|www\.jhayra\.com)\//.test(u) ? u : null);

/* ── manage (sender) ───────────────────────────────────────────────────── */
export async function manageReveal(rec, action, days) {
  const { data, error } = await supabase.rpc('manage_gift_reveal', { p_id: rec.id, p_manage_secret: rec.manage, p_action: action, p_days: days ?? null });
  if (error) throw error;
  return data;
}

// The sender's own reveals (with their keys) stay on the sender's device.
const MINE = 'jh_gift_reveals';
export function myReveals() {
  try {
    const v = JSON.parse(localStorage.getItem(MINE) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function saveMine(rec) {
  try {
    localStorage.setItem(MINE, JSON.stringify([rec, ...myReveals().filter((r) => r.id !== rec.id)].slice(0, 20)));
  } catch {}
}
export function forgetMine(id) {
  try {
    localStorage.setItem(MINE, JSON.stringify(myReveals().filter((r) => r.id !== id)));
  } catch {}
}

/* ── is the feature switched on? ───────────────────────────────────────── */
// True once the database side exists (docs/sql/2026-11-10-gift-reveals.sql).
// Until then the site hides its Gift Reveal links. A "yes" is remembered for
// the tab; a "no" is checked again on the next page load.
let availability;
export function revealAvailable() {
  try {
    if (sessionStorage.getItem('jh_gr_on') === '1') return Promise.resolve(true);
  } catch {}
  availability ||= supabase
    .rpc('open_gift_reveal', { p_id: '0'.repeat(32), p_count: false })
    .then(({ data, error }) => {
      const on = !error && !!data?.status;
      try {
        if (on) sessionStorage.setItem('jh_gr_on', '1');
      } catch {}
      return on;
    })
    .catch(() => false);
  return availability;
}

/* ── QR code ───────────────────────────────────────────────────────────── */
export async function qrDataUrl(text, { size = 720, dark = '#29221D', light = '#FBF8F2' } = {}) {
  const { default: qrcode } = await import('qrcode-generator');
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 4;
  const cell = Math.floor(size / (n + quiet * 2));
  const dim = cell * (n + quiet * 2);
  const c = document.createElement('canvas');
  c.width = c.height = dim;
  const g = c.getContext('2d');
  g.fillStyle = light;
  g.fillRect(0, 0, dim, dim);
  g.fillStyle = dark;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) g.fillRect((x + quiet) * cell, (y + quiet) * cell, cell, cell);
  return c.toDataURL('image/png');
}
