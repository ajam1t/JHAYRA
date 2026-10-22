// Frame sizes and finishes. Product pages read live options from Supabase
// (frame_sizes / frame_colours / frame_materials / product_options); these
// tables are the fallback and the source of truth for custom photo frames,
// matching what the payment function expects.

export const SIZES = [
  { slug: 'a4', name: 'A4', dimensions: '9.5 × 13 inches', w: 9.5, h: 13, price: 499 },
  { slug: 'a3plus', name: 'A3+', dimensions: '12 × 18 inches', w: 12, h: 18, price: 999 },
  { slug: '18x24', name: '18 × 24', dimensions: '18 × 24 inches', w: 18, h: 24, price: 1499 },
  { slug: '24x36', name: '24 × 36', dimensions: '24 × 36 inches', w: 24, h: 36, price: 2999 },
];

export const COLOURS = {
  Black: { slug: 'black', hex: '#1C1C1C' },
  Gold: { slug: 'gold', hex: '#B8932A' },
  Brown: { slug: 'brown', hex: '#6B4423' },
  Natural: { slug: 'natural', hex: '#C8A47E' },
  White: { slug: 'white', hex: '#F5F5F5' },
  Silver: { slug: 'silver', hex: '#C0C0C0' },
};

// Custom (customer photo) frames are offered in these size + colour pairs.
const CUSTOM = [
  ['A4', 'Black'],
  ['A3+', 'Black'],
  ['18 × 24', 'Black'],
  ['18 × 24', 'Gold'],
  ['24 × 36', 'Gold'],
  ['24 × 36', 'Brown'],
  ['24 × 36', 'Black'],
];

export const CUSTOM_SIZES = SIZES;
export function customColours(sizeName) {
  return CUSTOM.filter(([s]) => s === sizeName).map(([, c]) => c);
}
export function customOption(sizeName, colour) {
  const size = SIZES.find((s) => s.name === sizeName);
  if (!size || !CUSTOM.some(([s, c]) => s === sizeName && c === colour)) return null;
  return {
    id: `${size.slug.replace('plus', 'PLUS').toUpperCase()}_${colour.toUpperCase()}`,
    size: size.name,
    dimensions: size.dimensions,
    material: 'PS Moulding',
    colour,
    price: size.price,
    w: size.w,
    h: size.h,
  };
}
export const MIN_PRICE = Math.min(...SIZES.map((s) => s.price));

export function colourHex(name) {
  return (COLOURS[name] || COLOURS.Black).hex;
}
