import { supabase } from '../lib/supabase';
import { SIZES } from '../lib/frames';

// HD print files for catalogue artwork. Kept in the private customer-artwork
// bucket under masters/<productId>/ — admins can read them, the public cannot.
// Customers may upload photos into that bucket, so a file is trusted only when
// it is listed in the admin-written index below (product-images is writable by
// admins only); anything else in masters/ is ignored.
const BUCKET = 'customer-artwork';
const INDEX = 'site-config/print-masters.json';
const dir = (pid) => `masters/${pid}`;
let indexCache = null;

async function readIndex(force = false) {
  if (indexCache && !force) return indexCache;
  try {
    const { data } = supabase.storage.from('product-images').getPublicUrl(INDEX);
    const r = await fetch(`${data.publicUrl}?t=${Date.now()}`, { cache: 'no-store' });
    indexCache = r.ok ? await r.json() : {};
  } catch {
    indexCache = {};
  }
  return indexCache;
}

async function writeIndex(next) {
  const blob = new Blob([JSON.stringify(next, null, 1)], { type: 'application/json' });
  const { error } = await supabase.storage.from('product-images').upload(INDEX, blob, { upsert: true, contentType: 'application/json', cacheControl: '0' });
  if (error) throw error;
  indexCache = next;
}

export async function getMaster(pid) {
  const idx = await readIndex();
  const e = idx?.[pid];
  if (!e?.path || !e.path.startsWith(`${dir(pid)}/`)) return null;
  return { path: e.path, name: e.name || e.path.split('/').pop(), size: e.size, created: e.created };
}

export async function uploadMaster(pid, file) {
  const extn = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${dir(pid)}/${Date.now()}.${extn}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw error;
  const idx = await readIndex(true);
  await writeIndex({ ...idx, [pid]: { path, name: file.name, size: file.size, created: new Date().toISOString() } });
  return path;
}

export async function downloadPrivate(path, name) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600, { download: name });
  if (error || !data?.signedUrl) throw error || new Error('not found');
  saveLink(data.signedUrl, name);
}

// Public artwork (product-images): fetched and saved under the order's name.
export async function downloadPublic(url, name) {
  try {
    const blob = await (await fetch(url)).blob();
    const href = URL.createObjectURL(blob);
    saveLink(href, name);
    setTimeout(() => URL.revokeObjectURL(href), 30000);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

function saveLink(href, name) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Sharpness at the ordered size: pixels per inch on the long side.
export function dpiFor(sizeName, w, h) {
  const s = SIZES.find((x) => x.name === sizeName) || null;
  if (!s || !w || !h) return null;
  return Math.round(Math.min(Math.max(w, h) / Math.max(s.w, s.h), Math.min(w, h) / Math.min(s.w, s.h)));
}
export const dpiLabel = (d) => (d == null ? '' : d >= 200 ? `${d} dpi · excellent` : d >= 150 ? `${d} dpi · good` : d >= 110 ? `${d} dpi · acceptable` : `${d} dpi · too low for this size`);
export const dpiTone = (d) => (d == null ? '' : d >= 150 ? 'ok' : d >= 110 ? 'warn' : 'bad');
