// Editorial collections, built from live inventory by category and name keywords.
// `tone` and `layout` give each one its own look within the design system.
export const COLLECTIONS = [
  {
    id: 'nature-reimagined',
    title: 'Nature Reimagined',
    kicker: 'Landscapes & light',
    story: 'Sunrises, mountains and open water — calm, wide horizons for walls that need to breathe.',
    cats: ['nature', 'photography'],
    words: ['sunrise', 'mountain', 'ocean', 'horizon', 'misty'],
    tone: 'mist',
    layout: 'triptych',
  },
  {
    id: 'abstract-forms',
    title: 'Abstract Forms',
    kicker: 'Colour, shape, texture',
    story: 'Bold modern pieces that anchor a room and start conversations.',
    cats: ['art-abstract', 'modern-art'],
    words: ['abstract', 'geometric', 'neon'],
    tone: 'obsidian',
    layout: 'feature',
  },
  {
    id: 'minimalist-living',
    title: 'Minimalist Living',
    kicker: 'Quiet, considered',
    story: 'Soft textures and restrained palettes for clean, architectural spaces.',
    cats: ['canvas'],
    words: ['canvas', 'textured', 'watercolour', 'velvet'],
    tone: 'stone',
    layout: 'mosaic',
  },
  {
    id: 'botanical-stories',
    title: 'Botanical Stories',
    kicker: 'Blooms & leaves',
    story: 'Lotus, blossom and autumn leaves — gentle botanicals that bring the outside in.',
    cats: [],
    words: ['bloom', 'blossom', 'lotus', 'leaves', 'floral', 'koi', 'peacock'],
    tone: 'porcelain',
    layout: 'triptych',
  },
  {
    id: 'personal-memories',
    title: 'Personal Memories',
    kicker: 'Your photos, framed',
    story: 'Weddings, first steps, family portraits — designs made to hold your own photographs.',
    cats: ['personalized', 'family', 'wedding', 'baby-kids', 'love-romance'],
    words: [],
    tone: 'champagne',
    layout: 'feature',
    personal: true,
  },
  {
    id: 'art-for-gifting',
    title: 'Art for Gifting',
    kicker: 'Anniversaries, birthdays, housewarmings',
    story: 'Thoughtful gifts that last longer than flowers — with a free gift note and prices hidden.',
    cats: ['occasions', 'love-romance', 'religious', 'family'],
    words: ['anniversary', 'birthday', 'love', 'diwali'],
    tone: 'mist',
    layout: 'mosaic',
  },
];
export const COLLECTION_MAP = Object.fromEntries(COLLECTIONS.map((c) => [c.id, c]));

export function collectionProducts(c, products) {
  return (products || []).filter((p) => c.cats.includes(p.category) || c.words.some((w) => p.name.toLowerCase().includes(w)));
}
