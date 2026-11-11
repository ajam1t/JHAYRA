import { supabase } from './supabase';
import { SITE } from './site';

/* JHAYRA Gift Reveal — one reveal per order, valid until the order is delivered.
   Everything goes through the `gift-reveal` Edge Function, which checks the
   real order every time (see supabase/functions/gift-reveal). */

export const BUCKET = 'gift-reveals';
export const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Housewarming', 'Festival', 'Thank you', 'Just because'];
export { THEMES } from './revealContent';
export const LIMITS = { photos: 4, message: 600, name: 40, clipMB: 25, voiceSeconds: 60 };
const HANDOFF = 'jh_gr_handoff';

async function call(body) {
  const { data, error } = await supabase.functions.invoke('gift-reveal', { body });
  if (error) {
    let payload = null;
    try {
      payload = await error.context?.json();
    } catch {}
    const e = new Error(payload?.error || 'Something went wrong. Please check your connection and try again.');
    e.status = error.context?.status;
    e.code = payload?.code;
    e.payload = payload;
    throw e;
  }
  return data;
}

export const verifyOrder = (orderNumber, mobile) => call({ action: 'verify', orderNumber, mobile });
export const openReveal = (token) => call({ action: 'open', token });
export const revealUrl = (token) => `${SITE.url}/gift/${token}`;

// Hand the order number + mobile from the confirmation / My Orders screen to the
// creator page without putting the mobile in a URL.
export function handOff(orderNumber, mobile) {
  try {
    sessionStorage.setItem(HANDOFF, JSON.stringify({ orderNumber, mobile }));
  } catch {}
}
export function takeHandOff() {
  try {
    const v = JSON.parse(sessionStorage.getItem(HANDOFF) || 'null');
    sessionStorage.removeItem(HANDOFF);
    return v;
  } catch {
    return null;
  }
}

/* ── media ─────────────────────────────────────────────────────────────── */
// Photos are resized to at most 1600 px and re-encoded as JPEG, so they load
// quickly and carry no camera metadata (location, device).
export function preparePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Please choose a photo (JPG, PNG or WebP).'));
    if (file.size > 25 * 1024 * 1024) return reject(new Error('That photo is over 25 MB. Please choose a smaller one.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((blob) => (blob ? resolve({ blob, url: URL.createObjectURL(blob), mime: 'image/jpeg' }) : reject(new Error('That photo could not be read.'))), 'image/jpeg', 0.86);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That photo could not be opened in this browser. Please try a JPG or PNG.'));
    };
    img.src = url;
  });
}

const CLIP_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/aac'];
export function prepareClip(file) {
  const type = (file.type || '').split(';')[0];
  const kind = type.startsWith('video/') ? 'video' : type.startsWith('audio/') ? 'voice' : null;
  if (!kind || !CLIP_TYPES.includes(type)) throw new Error('Please choose an MP4, MOV or WebM video, or an MP3, M4A, WAV or WebM audio file.');
  if (file.size > LIMITS.clipMB * 1024 * 1024) throw new Error(`That file is over ${LIMITS.clipMB} MB. Please choose a shorter clip.`);
  return { kind, blob: file, url: URL.createObjectURL(file), mime: type };
}

/* ── save (create once / edit) ─────────────────────────────────────────── */
// draft: { to, from, occasion, message, theme, sound, publishAt|null,
//          photos:[{path}|{blob,mime}], clip:{path,kind,mime}|{blob,kind,mime}|null }
export async function saveReveal(session, mode, draft, onProgress) {
  const fresh = [...draft.photos.filter((p) => p.blob), ...(draft.clip?.blob ? [draft.clip] : [])];
  const total = fresh.length + 1;
  let done = 0;
  const step = () => onProgress?.(++done / total);
  let uploads = [];
  if (fresh.length) {
    const r = await call({ action: 'upload', session, files: fresh.map((f) => ({ type: f.mime })) });
    uploads = r.uploads;
    for (let i = 0; i < fresh.length; i++) {
      let ok = false;
      let last = null;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        if (attempt) await new Promise((res) => setTimeout(res, 1200 * attempt));
        const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(uploads[i].path, uploads[i].token, fresh[i].blob, { contentType: fresh[i].mime });
        ok = !error;
        last = error;
      }
      if (!ok) throw last || new Error('A file could not be uploaded. Please try again.');
      fresh[i].path = uploads[i].path;
      step();
    }
  }
  const res = await call({
    action: 'save',
    session,
    mode,
    content: {
      to: draft.to,
      from: draft.from,
      occasion: draft.occasion,
      message: draft.message,
      theme: draft.theme,
      sound: draft.sound,
      publishAt: draft.publishAt || null,
      photos: draft.photos.map((p) => p.path).filter(Boolean),
      clip: draft.clip?.path ? { path: draft.clip.path, kind: draft.clip.kind, mime: draft.clip.mime } : null,
    },
  });
  step();
  return res;
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

/* ── a soft chime (Web Audio, no files) ────────────────────────────────── */
let actx = null;
export function chime(kind = 'open') {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const now = actx.currentTime;
    const notes = kind === 'open' ? [880, 1108.73, 1318.51, 1760] : [659.25, 987.77, 1318.51];
    notes.forEach((f, i) => {
      const t = now + i * (kind === 'open' ? 0.16 : 0.22);
      const o = actx.createOscillator();
      const o2 = actx.createOscillator();
      const g = actx.createGain();
      o.type = 'sine';
      o2.type = 'sine';
      o.frequency.value = f;
      o2.frequency.value = f * 2.01;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      const g2 = actx.createGain();
      g2.gain.value = 0.25;
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(actx.destination);
      o.start(t);
      o2.start(t);
      o.stop(t + 2.3);
      o2.stop(t + 2.3);
    });
  } catch {}
}
