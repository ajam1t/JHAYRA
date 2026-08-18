import { supabase, isSupabaseEnabled } from './supabase';

/* Customer artwork capture.
   Photos are personalised, one-off customer content. They are uploaded to the
   PRIVATE `customer-artwork` bucket (no public read) at Add-to-Cart — the only
   point where the base64 image is still in memory. The returned storage paths
   travel with the cart item → order_item so the admin can retrieve the exact
   ORIGINAL image for production.

   The ORIGINAL is stored as-uploaded (no resize / recompress / crop / frame) so
   production always has full HD quality. The website preview (frame + size +
   colour) is generated separately by FramedArt and NEVER overwrites the original.

   Alongside the storage path we capture lightweight metadata (original filename,
   pixel dimensions, byte size, mime type) so the admin production view can show
   resolution / file details without downloading. This metadata rides inside the
   existing `customization` jsonb — no schema change required. */

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
 * Upload customer artwork originals to the private bucket.
 *
 * @param {Array<string|{dataUrl:string, name?:string, width?:number, height?:number}>} items
 *        Either bare base64 data-URL strings, or objects carrying the data-URL
 *        plus optional capture metadata (original filename, pixel dimensions).
 * @returns {Promise<{
 *   supabaseEnabled: boolean,   // whether persistent storage is even available
 *   requested: number,          // how many valid images were submitted
 *   uploaded: number,           // how many actually persisted
 *   paths: string[],            // storage paths (order preserved) — for order_items.artwork_paths
 *   meta: Array<{path:string,name:string|null,width:number|null,height:number|null,bytes:number,type:string}>
 * }>}
 */
export async function uploadCustomerArtwork(items) {
  // Normalise input → [{ dataUrl, name?, width?, height? }]
  const list = (Array.isArray(items) ? items : [items])
    .map((it) => (typeof it === 'string' ? { dataUrl: it } : it))
    .filter((it) => it && typeof it.dataUrl === 'string' && it.dataUrl.startsWith('data:'));

  const result = {
    supabaseEnabled: isSupabaseEnabled,
    requested: list.length,
    uploaded: 0,
    paths: [],
    meta: [],
  };

  if (!supabase || !list.length) return result;

  const folder = randomFolder();
  try {
    for (let i = 0; i < list.length; i++) {
      const { dataUrl, name = null, width = null, height = null } = list[i];
      let blob;
      try { blob = await dataUrlToBlob(dataUrl); } catch { continue; }
      if (!blob || blob.size === 0 || blob.size > MAX_BYTES) continue;

      const contentType = blob.type || 'image/jpeg';
      const path = `${folder}/${Date.now()}-${i}.${extFromMime(contentType)}`;
      // Upload the ORIGINAL bytes untouched — no transformation.
      const { error } = await supabase.storage
        .from('customer-artwork')
        .upload(path, blob, { contentType, upsert: false });
      if (error) continue;

      result.paths.push(path);
      result.meta.push({
        path,
        name: name || null,
        width: Number.isFinite(width) ? width : null,
        height: Number.isFinite(height) ? height : null,
        bytes: blob.size,
        type: contentType,
      });
    }
  } catch {
    /* fail-open — return whatever uploaded; caller decides whether to block */
  }

  result.uploaded = result.paths.length;
  return result;
}
