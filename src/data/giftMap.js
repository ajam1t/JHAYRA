/* Gift → product-category mapping.
   ------------------------------------------------------------------------
   The Gift Finder previously resolved hardcoded static product ids against
   src/data/products.js, while the product pages resolve the SAME ids against
   Supabase — so "Birthday → Personalized Frame" opened as "Eternal Bloom
   Canvas". The two catalogues share the p0xx id namespace but hold different
   products.

   Fix: map each gift occasion / recipient to PRODUCT CATEGORIES and resolve
   recommendations from the LIVE catalogue the product pages use. Card and
   detail page now always reference the same product. New gift occasions or
   recipients only need a category list here — no code changes. */

export const GIFT_CATEGORIES = {
  occasion: {
    birthday:        ['personalized', 'occasions', 'baby-kids', 'quotes', 'family'],
    anniversary:     ['love-romance', 'wedding', 'personalized', 'occasions'],
    wedding:         ['wedding', 'love-romance', 'personalized'],
    engagement:      ['love-romance', 'wedding', 'personalized'],
    valentines:      ['love-romance', 'personalized', 'quotes'],
    'mothers-day':   ['family', 'personalized', 'love-romance', 'quotes'],
    'fathers-day':   ['family', 'personalized', 'quotes', 'photography'],
    'baby-shower':   ['baby-kids', 'family', 'personalized'],
    housewarming:    ['home-vastu', 'running-horses', 'religious', 'nature'],
    farewell:        ['photography', 'quotes', 'occasions', 'personalized'],
    retirement:      ['quotes', 'photography', 'nature', 'occasions'],
    graduation:      ['quotes', 'personalized', 'occasions', 'photography'],
    christmas:       ['occasions', 'family', 'personalized'],
    diwali:          ['religious', 'home-vastu', 'occasions'],
    'raksha-bandhan':['personalized', 'family', 'occasions'],
    friendship:      ['personalized', 'quotes', 'photography'],
    'thank-you':     ['quotes', 'personalized', 'nature'],
    congratulations: ['occasions', 'quotes', 'personalized'],
    festivals:       ['occasions', 'religious', 'home-vastu'],
    milestones:      ['occasions', 'personalized', 'quotes', 'family'],
  },
  recipient: {
    husband:      ['love-romance', 'personalized', 'photography', 'quotes'],
    wife:         ['love-romance', 'personalized', 'family'],
    boyfriend:    ['love-romance', 'personalized', 'quotes'],
    girlfriend:   ['love-romance', 'personalized'],
    mother:       ['family', 'personalized', 'love-romance', 'religious'],
    father:       ['family', 'quotes', 'photography', 'personalized'],
    parents:      ['family', 'personalized', 'religious'],
    brother:      ['personalized', 'quotes', 'running-horses'],
    sister:       ['personalized', 'love-romance', 'family'],
    friend:       ['personalized', 'quotes', 'photography'],
    couple:       ['love-romance', 'wedding', 'personalized'],
    kids:         ['baby-kids', 'family', 'animals-pets'],
    grandparents: ['family', 'religious', 'home-vastu', 'personalized'],
    colleague:    ['quotes', 'modern-art', 'photography'],
    boss:         ['quotes', 'modern-art', 'home-vastu', 'running-horses'],
    family:       ['family', 'personalized', 'home-vastu'],
  },
};

/**
 * Resolve gift recommendations from the LIVE catalogue by category.
 * @param {'occasion'|'recipient'} type
 * @param {string} id            occasion/recipient id
 * @param {Array}  liveProducts  products from useProducts() (Supabase or static fallback)
 * @param {number} limit
 * @returns {Array} products (same objects the product pages use) in category order,
 *                  bestsellers first — or [] if nothing maps.
 */
export function resolveGiftProducts(type, id, liveProducts, limit = 8) {
  const cats = (GIFT_CATEGORIES[type] || {})[id];
  if (!cats || !cats.length || !Array.isArray(liveProducts) || !liveProducts.length) return [];

  const rank = new Map(cats.map((c, i) => [c, i])); // preserve category priority order
  const matched = liveProducts.filter(p => rank.has(p.category));
  matched.sort((a, b) => {
    const ca = rank.get(a.category), cb = rank.get(b.category);
    if (ca !== cb) return ca - cb;                                   // primary categories first
    const bs = Number(!!b.bestSeller) - Number(!!a.bestSeller);      // then bestsellers
    if (bs !== 0) return bs;
    return (b.rating || 0) - (a.rating || 0);                        // then rating
  });
  return matched.slice(0, limit);
}
