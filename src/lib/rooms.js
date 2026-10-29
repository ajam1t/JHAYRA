// "Shop by room" environments: each maps to the product categories that suit it.
export const ROOMS = [
  { id: 'living', label: 'Living room', blurb: 'Statement art for the heart of the home', cats: ['modern-art', 'art-abstract', 'canvas', 'nature'], wall: 'porcelain', furniture: 'sofa' },
  { id: 'bedroom', label: 'Bedroom', blurb: 'Calm, soft and personal', cats: ['love-romance', 'nature', 'photography', 'wedding'], wall: 'mist', furniture: 'bed' },
  { id: 'office', label: 'Office', blurb: 'Focus, drive and a little inspiration', cats: ['running-horses', 'quotes', 'modern-art'], wall: 'stone', furniture: 'console' },
  { id: 'dining', label: 'Dining room', blurb: 'Warm, gathering-table art', cats: ['nature', 'canvas', 'art-abstract', 'home-vastu'], wall: 'porcelain', furniture: 'dining' },
  { id: 'pooja', label: 'Pooja & Vastu', blurb: 'Divine art and Vastu favourites', cats: ['religious', 'home-vastu'], wall: 'stone', furniture: 'console' },
  { id: 'entryway', label: 'Entryway', blurb: 'A warm first impression', cats: ['home-vastu', 'religious', 'nature'], wall: 'stone', furniture: 'console' },
  { id: 'kids', label: 'Kids & family', blurb: 'Little moments, big memories', cats: ['baby-kids', 'animals-pets', 'family', 'occasions'], wall: 'mist', furniture: 'bed' },
];
export const ROOM_MAP = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
// Old link kept working.
ROOM_MAP.study = ROOM_MAP.office;
