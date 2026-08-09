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
