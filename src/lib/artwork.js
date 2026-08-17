import { supabase } from './supabase';

/* Customer artwork capture.
   Photos are personalised, one-off customer content. They are uploaded to the
   PRIVATE `customer-artwork` bucket (no public read) at Add-to-Cart — the only
   point where the base64 image is still in memory. The returned storage paths
   travel with the cart item → order_item so the admin can retrieve the exact
   image needed for production. All failures are non-fatal: the customer can
   always still order (the WhatsApp artwork-confirmation path remains). */

const MAX_BYTES = 15 * 1024 * 1024; // matches bucket file_size_limit

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

function extFromMime(mime = '') {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('heif')) return 'heif';
  if (mime.includes('heic')) return 'heic';
  return 'jpg';
}

function randomFolder() {
  try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch { /* noop */ }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Upload an array of base64 data-URL photos to the private bucket.
 * @returns {Promise<string[]>} storage paths (empty array on any failure).
 */
export async function uploadCustomerArtwork(dataUrls) {
  if (!supabase) return [];
  const urls = (Array.isArray(dataUrls) ? dataUrls : [dataUrls]).filter(
    (u) => typeof u === 'string' && u.startsWith('data:')
  );
  if (!urls.length) return [];

  const folder = randomFolder();
  const paths = [];
  try {
    for (let i = 0; i < urls.length; i++) {
      let blob;
      try { blob = await dataUrlToBlob(urls[i]); } catch { continue; }
      if (!blob || blob.size === 0 || blob.size > MAX_BYTES) continue;
      const contentType = blob.type || 'image/jpeg';
      const path = `${folder}/${Date.now()}-${i}.${extFromMime(contentType)}`;
      const { error } = await supabase.storage
        .from('customer-artwork')
        .upload(path, blob, { contentType, upsert: false });
      if (!error) paths.push(path);
    }
  } catch {
    /* fail-open — return whatever uploaded */
  }
  return paths;
}
