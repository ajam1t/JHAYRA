/* ── JHAYRA FRAME MASTER — single source of truth ──────────────────────────
   All 7 purchasable frame options. Every component that shows a price,
   size selector, or colour picker must import from here — never hardcode. */

export const FRAME_OPTIONS = [
  {
    id: 'A4_BLACK',
    size: 'A4',
    dimensions: '9.5 × 13 inches',
    material: 'PS Moulding',
    colour: 'Black',
    price: 499,
  },
  {
    id: 'A3PLUS_BLACK',
    size: 'A3+',
    dimensions: '12 × 18 inches',
    material: 'PS Moulding',
    colour: 'Black',
    price: 999,
  },
  {
    id: '18X24_BLACK',
    size: '18 × 24',
    dimensions: '18 × 24 inches',
    material: 'PS Moulding',
    colour: 'Black',
    price: 1499,
  },
  {
    id: '18X24_GOLD',
    size: '18 × 24',
    dimensions: '18 × 24 inches',
    material: 'PS Moulding',
    colour: 'Gold',
    price: 1499,
  },
  {
    id: '24X36_GOLD',
    size: '24 × 36',
    dimensions: '24 × 36 inches',
    material: 'PS Moulding',
    colour: 'Gold',
    price: 2999,
  },
  {
    id: '24X36_BROWN',
    size: '24 × 36',
    dimensions: '24 × 36 inches',
    material: 'PS Moulding',
    colour: 'Brown',
    price: 2999,
  },
  {
    id: '24X36_BLACK',
    size: '24 × 36',
    dimensions: '24 × 36 inches',
    material: 'PS Moulding',
    colour: 'Black',
    price: 2999,
  },
];

/* Ordered unique sizes */
export const FRAME_SIZES = ['A4', 'A3+', '18 × 24', '24 × 36'];

/* Returns all available colours for a given size (preserves order) */
export function coloursForSize(size) {
  return FRAME_OPTIONS.filter(o => o.size === size).map(o => o.colour);
}

/* Returns the single frame option for a size+colour pair, or null */
export function getFrameOption(size, colour) {
  return FRAME_OPTIONS.find(o => o.size === size && o.colour === colour) || null;
}

/* Cheapest frame option price — used for "from ₹X" labels */
export const MIN_FRAME_PRICE = Math.min(...FRAME_OPTIONS.map(o => o.price)); // 499

/* CSS hex for each frame colour */
export const FRAME_COLOUR_HEX = {
  Black: '#1C1C1C',
  Gold:  '#B8932A',
  Brown: '#6B4423',
};

/* ── FRAME GEOMETRY — single source of truth ───────────────────────────────
   The frame is a website rendering responsibility, never baked into artwork.
   Every surface that draws a frame (cards, product detail, customize, cart,
   checkout) derives its pixel geometry from here so a given size + orientation
   always looks identical. */

/* Physical portrait dimensions (inches) — drive each frame's true aspect ratio */
export const SIZE_DIMS = {
  'A4':      { w: 9.5, h: 13 },
  'A3+':     { w: 12,  h: 18 },
  '18 × 24': { w: 18,  h: 24 },
  '24 × 36': { w: 24,  h: 36 },
};

/* Portrait display height (px) per size — larger sizes render physically larger */
export const FRAME_SCALE_H = { 'A4': 320, 'A3+': 390, '18 × 24': 470, '24 × 36': 560 };

/* Physical moulding thickness (px) per size */
export const FRAME_BW = { 'A4': 12, 'A3+': 14, '18 × 24': 16, '24 × 36': 20 };

/* Drop shadow per frame colour */
export const FRAME_SHADOW = {
  Black: '0 12px 40px rgba(0,0,0,.22),0 4px 14px rgba(0,0,0,.14)',
  Gold:  '0 12px 40px rgba(0,0,0,.18),0 4px 14px rgba(0,0,0,.10),0 0 0 1px rgba(196,155,46,.30)',
  Brown: '0 12px 40px rgba(0,0,0,.20),0 4px 14px rgba(0,0,0,.12)',
};

/**
 * Resolve the pixel geometry for a frame.
 * @param {string} size         one of FRAME_SIZES
 * @param {string} orientation  'Vertical' (portrait) | 'Horizontal' (landscape)
 * @param {number} [baseH]      override portrait height in px (used for small
 *                              cards/thumbnails); omit to use per-size scaling.
 * @returns {{frameW:number, frameH:number, borderWidth:number, dims:{w:number,h:number}, isPortrait:boolean, actualSize:string}}
 */
export function frameGeometry(size, orientation = 'Vertical', baseH, ratioOverride) {
  // ratioOverride lets admin-added sizes (unknown to SIZE_DIMS) render correctly
  // from their DB aspect ratio, with a size-scaled height derived from the ratio.
  const dims       = ratioOverride || SIZE_DIMS[size] || SIZE_DIMS['18 × 24'];
  const isPortrait = orientation !== 'Horizontal';
  const derivedH   = ratioOverride ? Math.round(320 + Math.min(240, Math.max(0, (dims.h / Math.max(dims.w, 1) - 1) * 260))) : (FRAME_SCALE_H[size] || 320);
  const scaleH     = baseH || derivedH;
  const scaleW     = Math.round(scaleH * dims.w / dims.h);
  return {
    frameH:      isPortrait ? scaleH : scaleW,
    frameW:      isPortrait ? scaleW : scaleH,
    borderWidth: FRAME_BW[size] || 16,
    dims,
    isPortrait,
    actualSize:  isPortrait ? `${dims.w} × ${dims.h} inches` : `${dims.h} × ${dims.w} inches`,
  };
}
