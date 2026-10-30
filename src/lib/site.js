export const SITE = {
  name: 'JHAYRA',
  url: 'https://www.jhayra.com',
  tagline: 'Crafting Memories Into Art',
  whatsapp: '918446440469',
  phoneDisplay: '+91 84464 40469',
  email: 'hello@jhayra.in',
  instagram: 'https://www.instagram.com/thejhayra/',
  ogImage: 'https://www.jhayra.com/og-image.jpg',
  hours: [
    ['Mon – Sat', '9:00 AM – 7:00 PM'],
    ['Sunday', '10:00 AM – 4:00 PM'],
  ],
};

export function waLink(text = '') {
  return `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

// Made to order: 1–2 business days to craft, then 5–7 business days in transit.
// Business days skip Sundays.
const addBiz = (d, n) => {
  const x = new Date(d);
  while (n > 0) {
    x.setDate(x.getDate() + 1);
    if (x.getDay() !== 0) n--;
  }
  return x;
};

export function deliveryWindow(from = new Date()) {
  const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return { early: fmt(addBiz(from, 6)), late: fmt(addBiz(from, 9)) };
}

// Order placed → dispatched (1–2 business days) → delivered (5–7 more).
export function deliveryTimeline(from = new Date()) {
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return { placed: fmt(from), ship: [fmt(addBiz(from, 1)), fmt(addBiz(from, 2))], arrive: [fmt(addBiz(from, 6)), fmt(addBiz(from, 9))] };
}

// Admin-entered link targets: only same-site paths are followed (never
// javascript:, protocol-relative or external URLs); anything else goes home.
export const safePath = (to) => (typeof to === 'string' && /^\/(?!\/|\\)/.test(to.trim()) ? to.trim() : '/');

// Indian mobile as 10 digits: accepts +91 / 91 / 0 prefixes, spaces and dashes.
export const mobile10 = (v = '') => String(v).replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, '');

// Promotional coupons (festival and campaign codes) are paused: the payment
// function only honours its own codes. While true, festival/campaign offers,
// banners naming a code and checkout auto-apply are hidden. The manual coupon
// box in the bag is unaffected.
export const PROMO_COUPONS_PAUSED = true;
const MENTIONS_OFFER = /\d+\s*%|\boff\b|\bcode\b|coupon/i;
export function withoutPromo(x) {
  if (!x || !PROMO_COUPONS_PAUSED) return x;
  return { ...x, coupon: null, offer: null, banner: x.banner && MENTIONS_OFFER.test(x.banner) ? null : x.banner };
}
