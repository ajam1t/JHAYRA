import { supabase } from './supabase';

const MAX_BYTES = 15 * 1024 * 1024;

function ext(type = '') {
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('heic')) return 'heic';
  if (type.includes('heif')) return 'heif';
  return 'jpg';
}

function uid() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Uploads customer photos to the private customer-artwork bucket, in the same
// path format the admin panel and payment function already understand.
export async function uploadArtwork(photos) {
  const list = (Array.isArray(photos) ? photos : [photos]).filter((p) => p && p.file);
  const result = { requested: list.length, uploaded: 0, paths: [], meta: [] };
  if (!list.length) return result;
  const folder = uid();
  for (let i = 0; i < list.length; i++) {
    const { file, name = null, width = null, height = null } = list[i];
    if (!file.size || file.size > MAX_BYTES) continue;
    const type = file.type || 'image/jpeg';
    const path = `${folder}/${Date.now()}-${i}.${ext(type)}`;
    const { error } = await supabase.storage.from('customer-artwork').upload(path, file, { contentType: type, upsert: false });
    if (error) continue;
    result.paths.push(path);
    result.meta.push({ path, name: name || file.name || null, width, height, bytes: file.size, type });
  }
  result.uploaded = result.paths.length;
  return result;
}

// Reads a picked file into an object URL plus its pixel size and a print-quality grade.
export function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, WebP or HEIC).'));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('That photo is over 15 MB. Please choose a smaller one.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const px = img.naturalWidth * img.naturalHeight;
      resolve({
        file,
        url,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        quality: px < 5e5 ? 'low' : px < 2e6 ? 'good' : 'excellent',
      });
    };
    // HEIC can't be previewed in most browsers, but it still prints fine.
    img.onerror = () => resolve({ file, url, name: file.name, width: null, height: null, quality: 'unknown', noPreview: true });
    img.src = url;
  });
}

export const QUALITY_LABEL = {
  excellent: { text: 'Excellent print quality', tone: 'ok' },
  good: { text: 'Good print quality', tone: 'ok' },
  low: { text: 'Low resolution — may look soft when printed large', tone: 'warn' },
  unknown: { text: 'Photo received — preview not supported in this browser', tone: 'info' },
};

// A shared hand-off so a photo dropped on the homepage opens straight in the builder.
let pending = null;
export const photoHandoff = {
  set(p) {
    pending = p;
  },
  take() {
    const p = pending;
    pending = null;
    return p;
  },
};
