// Artistic treatments for the Living Art Studio. They run entirely in the
// browser on a canvas, and the exact same function produces both the preview
// and the print file, so what the customer sees is what the workshop prints.
//
// Styles that need a generative AI model (watercolour, oil painting…) are not
// faked here: see `remoteTreatment` and docs/INTEGRATIONS.md.

export const TREATMENTS = [
  { id: 'original', label: 'Original', hint: 'True to your photo' },
  { id: 'mono', label: 'Monochrome', hint: 'Rich black & white' },
  { id: 'vintage', label: 'Vintage', hint: 'Warm, faded film' },
  { id: 'sketch', label: 'Pencil sketch', hint: 'Hand-drawn look' },
  { id: 'soft', label: 'Soft glow', hint: 'Dreamy and bright' },
];

// Box-blur approximation that works in every browser (Safari has no ctx.filter):
// scale down, then scale back up with smoothing.
function blurred(src, w, h, factor) {
  const sw = Math.max(1, Math.round(w / factor));
  const sh = Math.max(1, Math.round(h / factor));
  const small = document.createElement('canvas');
  small.width = sw;
  small.height = sh;
  const sc = small.getContext('2d');
  sc.imageSmoothingQuality = 'high';
  sc.drawImage(src, 0, 0, sw, sh);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const oc = out.getContext('2d');
  oc.imageSmoothingQuality = 'high';
  oc.drawImage(small, 0, 0, w, h);
  return oc.getImageData(0, 0, w, h).data;
}

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** Applies a treatment in place to a canvas. */
export function applyTreatment(canvas, id) {
  if (id === 'original') return canvas;
  const { width: w, height: h } = canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  if (id === 'mono') {
    for (let i = 0; i < d.length; i += 4) {
      let y = lum(d[i], d[i + 1], d[i + 2]) / 255;
      y = y < 0.5 ? 2 * y * y * 0.92 + y * 0.08 : 1 - 2 * (1 - y) * (1 - y) * 0.92 - (1 - y) * 0.08; // gentle S-curve
      d[i] = d[i + 1] = d[i + 2] = clamp(y * 255);
    }
  } else if (id === 'vintage') {
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      // 70% sepia, lifted blacks, softened highlights
      d[i] = clamp((r * 0.3 + sr * 0.7) * 0.86 + 22);
      d[i + 1] = clamp((g * 0.3 + sg * 0.7) * 0.84 + 18);
      d[i + 2] = clamp((b * 0.3 + sb * 0.7) * 0.8 + 14);
    }
  } else if (id === 'sketch') {
    const gray = new Uint8ClampedArray(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) gray[p] = lum(d[i], d[i + 1], d[i + 2]);
    // inverted, blurred copy for the colour-dodge pencil effect
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tc = tmp.getContext('2d');
    const inv = tc.createImageData(w, h);
    for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
      inv.data[i] = inv.data[i + 1] = inv.data[i + 2] = 255 - gray[p];
      inv.data[i + 3] = 255;
    }
    tc.putImageData(inv, 0, 0);
    const bl = blurred(tmp, w, h, Math.max(6, Math.round(Math.max(w, h) / 160)));
    for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
      const base = gray[p];
      const blend = bl[i];
      let v = blend >= 255 ? 255 : Math.min(255, (base * 255) / (255 - blend));
      v = 255 - (255 - v) * 1.35; // darken the strokes a little
      d[i] = clamp(v * 0.99 + 2);
      d[i + 1] = clamp(v * 0.98 + 2);
      d[i + 2] = clamp(v * 0.95 + 4); // a hint of warm paper
    }
  } else if (id === 'soft') {
    const bl = blurred(canvas, w, h, Math.max(5, Math.round(Math.max(w, h) / 220)));
    for (let i = 0; i < d.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        const a = d[i + k] / 255;
        const b = bl[i + k] / 255;
        const screen = 1 - (1 - a) * (1 - b);
        d[i + k] = clamp((a * 0.62 + screen * 0.38) * 255 + (k === 0 ? 4 : k === 2 ? -3 : 0));
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Whole photo with the treatment applied, scaled to `longEdge` (used for preview and print). */
export function treatedSource(image, treatment, longEdge) {
  const k = Math.min(1, longEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(image.naturalWidth * k);
  c.height = Math.round(image.naturalHeight * k);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, c.width, c.height);
  return applyTreatment(c, treatment);
}

/**
 * Renders the inside of the frame exactly as it will be printed:
 * the photo cropped by the customer's zoom/pan, the treatment, and an optional
 * caption band. `aspect` = width / height of the print.
 */
export function composePrint(image, { aspect, transform = { zoom: 1, panX: 0, panY: 0 }, treatment = 'original', caption, longEdge = 1600 }) {
  const W = aspect >= 1 ? longEdge : Math.round(longEdge * aspect);
  const H = aspect >= 1 ? Math.round(longEdge / aspect) : longEdge;
  const hasCaption = caption && (caption.title || caption.sub || caption.msg);
  const capH = hasCaption ? Math.round(H * 0.17) : 0;
  const pw = W;
  const ph = H - capH;

  // photo area: object-fit cover, then the PanZoom transform (scale, then translate in pre-scale units)
  const photo = document.createElement('canvas');
  photo.width = pw;
  photo.height = ph;
  const pc = photo.getContext('2d');
  pc.imageSmoothingQuality = 'high';
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const ir = iw / ih;
  const ar = pw / ph;
  let dw = pw;
  let dh = ph;
  if (ir > ar) dw = ph * ir;
  else dh = pw / ir;
  const z = transform.zoom || 1;
  pc.translate(pw / 2, ph / 2);
  pc.scale(z, z);
  pc.translate(transform.panX * pw, transform.panY * ph);
  pc.drawImage(image, -dw / 2, -dh / 2, dw, dh);
  applyTreatment(photo, treatment);

  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const oc = out.getContext('2d');
  oc.fillStyle = '#fbfaf7';
  oc.fillRect(0, 0, W, H);
  oc.drawImage(photo, 0, 0);
  if (hasCaption) {
    oc.fillStyle = '#171916';
    oc.textAlign = 'center';
    oc.textBaseline = 'middle';
    const cy = ph + capH / 2;
    const lines = [caption.title && ['title', caption.title], caption.sub && ['sub', caption.sub], caption.msg && ['msg', caption.msg]].filter(Boolean);
    const step = capH / (lines.length + 1);
    lines.forEach(([kind, text], i) => {
      const y = ph + step * (i + 1);
      if (kind === 'title') oc.font = `400 ${Math.round(capH * 0.3)}px "Instrument Serif", Georgia, serif`;
      else if (kind === 'sub') {
        oc.font = `600 ${Math.round(capH * 0.13)}px "Inter Tight", Arial, sans-serif`;
        text = text.toUpperCase().split('').join(String.fromCharCode(8202));
      } else oc.font = `italic 400 ${Math.round(capH * 0.17)}px "Instrument Serif", Georgia, serif`;
      oc.fillText(text, W / 2, lines.length === 1 ? cy : y, W * 0.9);
    });
  }
  return out;
}

export function canvasToBlob(canvas, quality = 0.92) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Future: generative styles (watercolour, oil, line art) via an external model.
 * Contract documented in docs/INTEGRATIONS.md. Not enabled — returns null so the
 * UI never offers a style that can't be produced.
 */
export async function remoteTreatment() {
  return null;
}
