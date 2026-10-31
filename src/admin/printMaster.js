import { supabase } from '../lib/supabase';
import { SIZES } from '../lib/frames';

// HD print files for catalogue artwork. Kept in the private customer-artwork
// bucket under masters/<productId>/ — admins can read and add files there,
// the public cannot. The newest file is the one used for printing.
const BUCKET = 'customer-artwork';
const dir = (pid) => `masters/${pid}`;

export async function getMaster(pid) {
  const { data, error } = await supabase.storage.from(BUCKET).list(dir(pid), { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });
  if (error || !data) return null;
  const f = data.find((x) => x.name && !x.name.startsWith('.'));
  return f ? { path: `${dir(pid)}/${f.name}`, name: f.name, size: f.metadata?.size, created: f.created_at } : null;
}

export async function uploadMaster(pid, file) {
  const extn = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${dir(pid)}/${Date.now()}.${extn}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw error;
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
