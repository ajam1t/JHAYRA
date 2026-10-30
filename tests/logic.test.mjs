// Business-logic tests: run with `npm test` (Node's built-in test runner).
import test from 'node:test';
import assert from 'node:assert/strict';
import { cartTotals } from '../src/state/cartTotals.js';
import { signaturePrice, multiplierOf, founderEligible, pincodeRules, DEFAULT_SIGNATURE } from '../src/lib/signature.js';
import { budgets, recommend, STYLES } from '../src/lib/giftfinder.js';
import { safePath, money } from '../src/lib/site.js';
import { productLd, breadcrumbLd } from '../src/lib/schema.js';
import { campaignStatus, liveCampaigns } from '../src/lib/campaigns.js';
import { categoryFaq } from '../src/lib/seoContent.js';

const SIZES = [
  { slug: 'a4', name: 'A4', dimensions: '9.5 × 13 inches', price: 499 },
  { slug: 'a3plus', name: 'A3+', dimensions: '12 × 18 inches', price: 999 },
  { slug: '18x24', name: '18 × 24', dimensions: '18 × 24 inches', price: 1499 },
  { slug: '24x36', name: '24 × 36', dimensions: '24 × 36 inches', price: 2999 },
];

test('bag totals: subtotal, count and payable amount', () => {
  const t = cartTotals([{ price: 999, qty: 2 }, { price: 499, qty: 1 }]);
  assert.deepEqual(t, { count: 3, subtotal: 2497, discount: 0, total: 2497 });
});

test('bag totals: percentage coupon rounds to the rupee', () => {
  const t = cartTotals([{ price: 999, qty: 1 }], { code: 'X', discount: 10 });
  assert.equal(t.discount, 100); // 99.9 → 100
  assert.equal(t.total, 899);
});

test('bag totals: a malformed coupon can never make the total negative or add to it', () => {
  assert.equal(cartTotals([{ price: 499, qty: 1 }], { discount: 150 }).total, 0);
  assert.equal(cartTotals([{ price: 499, qty: 1 }], { discount: -20 }).total, 499);
  assert.equal(cartTotals([{ price: 499, qty: 1 }], { discount: 'abc' }).total, 499);
  assert.equal(cartTotals([]).total, 0);
});

test('signature price: 3× the regular size price by default', () => {
  assert.equal(multiplierOf(DEFAULT_SIGNATURE), 3);
  assert.equal(signaturePrice(999, DEFAULT_SIGNATURE), 2997);
});

test('signature price: an admin custom price for the size wins', () => {
  const item = { prices: { a3plus: 3500 } };
  assert.equal(signaturePrice(999, DEFAULT_SIGNATURE, item, 'a3plus'), 3500);
  assert.equal(signaturePrice(499, DEFAULT_SIGNATURE, item, 'a4'), 1497);
});

test('signature price: multiplier off means regular price', () => {
  assert.equal(signaturePrice(999, { pricing: { enabled: false } }), 999);
});

test('founder delivery: Mumbai / Thane / Navi Mumbai pincodes only', () => {
  const s = DEFAULT_SIGNATURE;
  assert.equal(founderEligible('400001', s), true);
  assert.equal(founderEligible('400601', s), true);
  assert.equal(founderEligible('410210', s), true);
  assert.equal(founderEligible('110001', s), false); // Delhi
  assert.equal(founderEligible('4000', s), false);
  assert.equal(founderEligible('', s), false);
  assert.deepEqual(pincodeRules('400001-400003, 410206'), [[400001, 400003], [410206, 410206]]);
});

test('gift finder: budget options come from real size prices', () => {
  const b = budgets(SIZES);
  assert.deepEqual(b.map((x) => x.max), [499, 999, 1499, 2999]);
  assert.deepEqual(b[1].sizes.map((s) => s.slug), ['a4', 'a3plus']);
});

test('gift finder: budget and style are hard filters', () => {
  const products = [
    { id: 'a', name: 'Lotus', category: 'nature', price: 499, thumbnail: 'x' },
    { id: 'b', name: 'Horse', category: 'running-horses', price: 1499, thumbnail: 'x' },
    { id: 'c', name: 'Ganesha', category: 'religious', price: 499, thumbnail: 'x' },
  ];
  const r = recommend({ products, templates: [], sizes: SIZES, a: { budget: 'a4', style: 'nature', type: 'ready' } });
  assert.deepEqual(r.products.map((x) => x.p.id), ['a']);
  assert.ok(STYLES.length > 0);
});

test('safePath: only on-site paths are followed', () => {
  assert.equal(safePath('/shop/religious'), '/shop/religious');
  assert.equal(safePath('javascript:alert(1)'), '/');
  assert.equal(safePath('//evil.com'), '/');
  assert.equal(safePath('/\\evil.com'), '/');
  assert.equal(safePath('https://evil.com'), '/');
  assert.equal(safePath(undefined), '/');
});

test('money: Indian rupee formatting', () => {
  assert.equal(money(2997), '₹2,997');
  assert.equal(money(149900), '₹1,49,900');
});

test('product schema: one offer per size at the real price, no ratings', () => {
  const ld = productLd({ id: 'p018', name: 'Lord Shiva Canvas', description: 'd', images: ['i'], sizes: SIZES, colours: [{ name: 'Black' }] });
  assert.equal(ld.offers.length, 4);
  assert.deepEqual(ld.offers.map((o) => o.price), [499, 999, 1499, 2999]);
  assert.ok(ld.offers.every((o) => o.priceCurrency === 'INR' && o.url.startsWith('https://www.jhayra.com/product/p018?size=')));
  assert.equal(ld.aggregateRating, undefined);
  assert.equal(breadcrumbLd([['Home', '/'], ['Shop', '/shop']]).itemListElement[1].item, 'https://www.jhayra.com/shop');
});

test('category FAQ states the real sizes and prices', () => {
  const faq = categoryFaq('Religious Wall Art', { sizes: SIZES.map((s) => ({ ...s, base_price: s.price })), colours: [{ name: 'Black' }, { name: 'Gold' }] });
  assert.match(faq[0][1], /A4 \(9\.5 × 13 inches\) ₹499/);
  assert.match(faq[1][1], /black, gold/);
});

test('campaigns: status follows India time windows', () => {
  const c = { enabled: true, start: '2026-11-01T00:00', end: '2026-11-05T23:59' };
  assert.equal(campaignStatus(c, '2026-10-31T23:59'), 'scheduled');
  assert.equal(campaignStatus(c, '2026-11-03T10:00'), 'live');
  assert.equal(campaignStatus(c, '2026-11-06T00:00'), 'expired');
  assert.equal(campaignStatus({ ...c, enabled: false }, '2026-11-03T10:00'), 'paused');
});

test('campaigns: lowest priority number wins, then most recent start', () => {
  const now = '2026-11-03T10:00';
  const list = liveCampaigns(
    [
      { id: 'season', priority: 2, start: '2026-10-01', end: '2026-12-31' },
      { id: 'diwali', priority: 1, start: '2026-11-01', end: '2026-11-05' },
      { id: 'weekend', priority: 2, start: '2026-11-02', end: '2026-11-04' },
    ],
    now,
  );
  assert.deepEqual(list.map((c) => c.id), ['diwali', 'weekend', 'season']);
});

test('mobile numbers: +91, 0 and spacing are normalised to 10 digits', async () => {
  const { mobile10 } = await import('../src/lib/site.js');
  assert.equal(mobile10('+91 98765 43210'), '9876543210');
  assert.equal(mobile10('09876543210'), '9876543210');
  assert.equal(mobile10('98765-43210'), '9876543210');
  assert.equal(mobile10('919876543210'), '9876543210');
  assert.equal(mobile10('12345'), '12345');
});
