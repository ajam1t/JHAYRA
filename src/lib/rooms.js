// "Shop by room" collections: each room maps to the product categories that suit it.
export const ROOMS = [
  { id: 'living', label: 'Living room', blurb: 'Statement art for the heart of the home', cats: ['modern-art', 'art-abstract', 'canvas', 'nature'], wall: 'ivory', furniture: 'sofa' },
  { id: 'bedroom', label: 'Bedroom', blurb: 'Calm, soft and personal', cats: ['love-romance', 'nature', 'photography', 'wedding'], wall: 'sage', furniture: 'bed' },
  { id: 'pooja', label: 'Pooja & Vastu', blurb: 'Divine art and Vastu favourites', cats: ['religious', 'home-vastu'], wall: 'terracotta', furniture: 'console' },
  { id: 'study', label: 'Study & office', blurb: 'Motivation you’ll see every day', cats: ['running-horses', 'quotes', 'modern-art'], wall: 'dusk', furniture: 'console' },
  { id: 'kids', label: 'Kids & family', blurb: 'Little moments, big memories', cats: ['baby-kids', 'animals-pets', 'family', 'occasions'], wall: 'blush', furniture: 'bed' },
];
export const ROOM_MAP = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
