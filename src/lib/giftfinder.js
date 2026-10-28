// Gift Finder: deterministic scoring over the live catalogue. No AI, no
// network calls beyond the catalogue the shop already loads.
//
// Products carry only a category (no tags), so recipient, occasion and style
// map to categories and to words in the product name. Personalised templates
// carry `recipient` and `occasion` lists, which are matched directly.

export const WHO = [
  { id: 'partner', label: 'Partner', cats: ['love-romance', 'wedding', 'nature', 'photography'], recipients: ['couple', 'wife', 'husband', 'boyfriend', 'girlfriend'] },
  { id: 'parents', label: 'Parents', cats: ['family', 'religious', 'home-vastu', 'quotes'], recipients: ['parents', 'father', 'mother', 'grandparents'] },
  { id: 'friends', label: 'Friends', cats: ['quotes', 'modern-art', 'art-abstract', 'photography'], recipients: ['friend', 'colleague', 'boss'] },
  { id: 'family', label: 'Family', cats: ['family', 'baby-kids', 'animals-pets', 'religious'], recipients: ['family', 'kids', 'sibling', 'sister', 'brother', 'baby', 'grandparents'] },
  { id: 'housewarming', label: 'Housewarming', cats: ['home-vastu', 'religious', 'nature', 'canvas', 'modern-art', 'running-horses'], recipients: ['family', 'couple', 'self'] },
  { id: 'myself', label: 'Myself', cats: ['modern-art', 'art-abstract', 'nature', 'canvas', 'photography'], recipients: ['self'] },
  { id: 'other', label: 'Someone else', cats: [], recipients: [] },
];

export const WHEN = [
  { id: 'birthday', label: 'Birthday', cats: ['occasions', 'baby-kids', 'quotes', 'family'], occasions: ['birthday', 'milestones'] },
  { id: 'anniversary', label: 'Anniversary', cats: ['love-romance', 'wedding'], occasions: ['anniversary', 'engagement'] },
  { id: 'wedding', label: 'Wedding', cats: ['wedding', 'love-romance', 'religious'], occasions: ['wedding', 'engagement'] },
  { id: 'housewarming', label: 'Housewarming', cats: ['home-vastu', 'religious', 'nature', 'canvas', 'running-horses'], occasions: ['housewarming'] },
  { id: 'festival', label: 'Festival', cats: ['religious', 'occasions', 'home-vastu'], occasions: ['festivals', 'diwali', 'christmas', 'raksha-bandhan'] },
  { id: 'valentines', label: 'Valentine’s Day', cats: ['love-romance'], occasions: ['valentines'] },
  { id: 'just', label: 'Just Because', cats: [], occasions: [] },
  { id: 'other', label: 'Something else', cats: [], occasions: [] },
];

const FLORAL = /\b(floral|flower|bloom|blossom|lotus|rose|petal|sunflower)/i;

// Styles shown only when the catalogue has something for them.
export const STYLES = [
  { id: 'minimalist', label: 'Minimalist', test: (p) => ['modern-art', 'canvas'].includes(p.category) },
  { id: 'abstract', label: 'Abstract', test: (p) => p.category === 'art-abstract' },
  { id: 'floral', label: 'Floral', test: (p) => FLORAL.test(p.name) },
  { id: 'nature', label: 'Nature', test: (p) => ['nature', 'photography'].includes(p.category) },
  { id: 'personalised', label: 'Personalised Photo Art', test: (p) => !!p.customer_photo_eligible, templates: true },
  { id: 'traditional', label: 'Traditional & Cultural', test: (p) => ['religious', 'home-vastu', 'mithila', 'running-horses', 'buddhist', 'jain', 'christian'].includes(p.category), groups: ['spiritual', 'festivals', 'desi'] },
];

export const TYPES = [
  { id: 'ready', label: 'Ready-made artwork', hint: 'Designs to hang as they are' },
  { id: 'personal', label: 'Personalised artwork', hint: 'With their photos, names or dates' },
  { id: 'unsure', label: 'Not sure', hint: 'Show me both' },
];

// Budget options from the real frame-size prices (ascending): "up to ₹X"
// means every size at or below X is affordable.
export function budgets(sizes) {
  const list = [...sizes].sort((a, b) => a.price - b.price);
  return list.map((s, i) => ({ id: s.slug, max: s.price, sizes: list.slice(0, i + 1) }));
}

const overlap = (a = [], b = []) => a.some((x) => b.includes(x));

export function recommend({ products = [], templates = [], sizes = [], a }) {
  const who = WHO.find((x) => x.id === a.who);
  const when = WHEN.find((x) => x.id === a.when);
  const style = STYLES.find((x) => x.id === a.style);
  const budget = budgets(sizes).find((b) => b.id === a.budget);
  const max = budget ? budget.max : Infinity;
  const fits = budget ? budget.sizes : sizes;
  const wantProducts = a.type !== 'personal';
  const wantTemplates = a.type !== 'ready';

  // Products: hard filters are budget (its starting price) and style; then score.
  let prods = [];
  if (wantProducts) {
    prods = products
      .filter((p) => p.thumbnail && (p.price || 0) <= max && (!style || style.test(p)))
      .map((p) => {
        const why = [];
        let score = 0;
        if (who?.cats.includes(p.category)) (score += 2), why.push(`For ${who.label.toLowerCase()}`);
        if (when?.cats.includes(p.category)) (score += 2), why.push(when.label);
        if (style) why.push(style.label);
        if (p.is_bestseller) (score += 1), why.push('Bestseller');
        return { p, score, why };
      })
      .sort((x, y) => y.score - x.score || (y.p.review_count || 0) - (x.p.review_count || 0) || x.p.name.localeCompare(y.p.name));
    // With a recipient or occasion chosen, show matches first; keep a few
    // general favourites only if nothing matched.
    const matched = prods.filter((x) => x.score >= 2);
    prods = (matched.length ? matched : prods).slice(0, 8);
  }

  // Templates: price starts at the smallest size, so they fit any budget the
  // catalogue offers; style narrows only where templates have a matching group.
  let tmpls = [];
  if (wantTemplates && (!style || style.templates || style.groups)) {
    tmpls = templates
      .filter((t) => !style?.groups || style.groups.includes(t.group))
      .map((t) => {
        const why = [];
        let score = 0;
        if (who && overlap(t.recipient, who.recipients)) (score += 2), why.push(`For ${who.label.toLowerCase()}`);
        if (when && overlap(t.occasion, when.occasions)) (score += 3), why.push(when.label);
        if (t.bestSeller) (score += 1), why.push('Bestseller');
        else if (t.popular) score += 0.5;
        return { t, score, why };
      })
      .sort((x, y) => y.score - x.score || (x.t.sortOrder || 0) - (y.t.sortOrder || 0));
    const matched = tmpls.filter((x) => x.score >= 2);
    tmpls = (matched.length ? matched : tmpls.filter((x) => x.t.popular || x.t.bestSeller)).slice(0, 8);
  }

  return { products: prods, templates: tmpls, fits, budget, who, when, style };
}
