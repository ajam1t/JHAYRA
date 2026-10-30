// Post-build step: writes a static HTML file per route with its own title,
// description, canonical URL, social tags, structured data and a readable
// content version of the page, so search engines, AI crawlers that don't run
// JavaScript, and WhatsApp/Instagram link previews all see real pages. Also
// writes sitemap.xml (with images), robots.txt, llms.txt, a Google Merchant
// product feed, the catalogue snapshot and 404.html.
// If the catalogue can't be fetched (offline build), product and category
// pages are skipped and the SPA fallback in vercel.json still serves them.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORGANIZATION, WEBSITE, productLd, breadcrumbLd } from '../src/lib/schema.js';
import { CATEGORY_SEO, categoryFaq, productTitle } from '../src/lib/seoContent.js';
import { HOME_FAQ, FAQ } from '../src/lib/faq.js';
import { LEGAL } from '../src/lib/policies.js';
import { ROOMS } from '../src/lib/rooms.js';
import { GIFT_GUIDE, GIFT_HOW } from '../src/lib/giftfinder.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://www.jhayra.com';
const SUPABASE = process.env.VITE_SUPABASE_URL || 'https://gwxdzemazqontjobqnyy.supabase.co';
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_aY3MrFdQflveTXhDNb_YyQ_S7HOZUE3';
const OG = `${SITE}/og-image.jpg`;
const shell = readFileSync(join(dist, 'index.html'), 'utf8');

// Each route's page chunk (and its CSS) is preloaded in the HTML, so the
// browser fetches it alongside the main bundle instead of after it runs.
let manifest = {};
try {
  manifest = JSON.parse(readFileSync(join(dist, '.vite', 'manifest.json'), 'utf8'));
} catch {}
const PAGE_FILES = [
  [/^\/shop(\/|$)/, 'src/pages/Shop.jsx'],
  [/^\/product\//, 'src/pages/Product.jsx'],
  [/^\/customize$/, 'src/pages/Customize.jsx'],
  [/^\/customize\/photo$/, 'src/pages/PhotoBuilder.jsx'],
  [/^\/customize\//, 'src/pages/TemplateEditor.jsx'],
  [/^\/cart$/, 'src/pages/Cart.jsx'],
  [/^\/checkout$/, 'src/pages/Checkout.jsx'],
  [/^\/orders$/, 'src/pages/Orders.jsx'],
  [/^\/wishlist$/, 'src/pages/Wishlist.jsx'],
  [/^\/gift-finder$/, 'src/pages/GiftFinder.jsx'],
  [/^\/collections/, 'src/pages/Collections.jsx'],
  [/^\/journal/, 'src/pages/Journal.jsx'],
  [/^\/worlds/, 'src/pages/Worlds.jsx'],
  [/^\/celebrations$/, 'src/pages/Celebrations.jsx'],
  [/^\/signature-experience$/, 'src/pages/Signature.jsx'],
  [/^\/visualise$/, 'src/pages/Visualise.jsx'],
  [/^\/wall-planner$/, 'src/pages/WallPlanner.jsx'],
  [/^\/room-inspiration$/, 'src/pages/Inspiration.jsx'],
  [/^\/(about|contact|support|corporate|privacy|terms|refund|replacement-policy|shipping-policy|cookie-policy)$/, 'src/pages/Info.jsx'],
];
const entryChunks = new Set();
(function walk(key) {
  const c = manifest[key];
  if (!c || entryChunks.has(key)) return;
  entryChunks.add(key);
  (c.imports || []).forEach(walk);
})('index.html');
function preloadsFor(path) {
  const src = PAGE_FILES.find(([re]) => re.test(path))?.[1];
  if (!src || !manifest[src]) return '';
  const js = new Set();
  const css = new Set();
  (function walk(key) {
    const c = manifest[key];
    if (!c || entryChunks.has(key) || js.has(c.file)) return;
    js.add(c.file);
    (c.css || []).forEach((f) => css.add(f));
    (c.imports || []).forEach(walk);
  })(src);
  return [...[...css].map((f) => `<link rel="preload" as="style" href="/${f}" />`), ...[...js].map((f) => `<link rel="modulepreload" crossorigin href="/${f}" />`)].join('\n    ');
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const strip = ({ '@context': _, ...x }) => x;
const withBrand = (t) => (t.includes('JHAYRA') ? t : `${t} | JHAYRA`);

/* ── Crawler-readable page chrome: the same main links as the app's menu. ── */
const NAV = [
  ['/', 'Home'],
  ['/shop', 'Shop wall art'],
  ['/customize', 'Personalised photo frames'],
  ['/gift-finder', 'Gift finder'],
  ['/collections', 'Collections'],
  ['/celebrations', 'Celebrations'],
  ['/journal', 'Journal'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];
const FOOT = [
  ['/support', 'Help & FAQ'],
  ['/shipping-policy', 'Shipping policy'],
  ['/refund', 'Refund policy'],
  ['/replacement-policy', 'Replacement promise'],
  ['/privacy', 'Privacy policy'],
  ['/terms', 'Terms of service'],
  ['/corporate', 'Corporate gifting'],
];
const links = (list) => list.map(([u, l]) => `<a href="${u}">${esc(l)}</a>`).join(' · ');
const chrome = (main) =>
  `<header><p><a href="/"><strong>JHAYRA</strong></a> — Crafting Memories Into Art</p><nav aria-label="Main">${links(NAV)}</nav></header>` +
  `<main>${main}</main>` +
  `<footer><nav aria-label="Help">${links(FOOT)}</nav><p>JHAYRA · framed wall art and personalised photo frames, handcrafted to order in India · WhatsApp <a href="https://wa.me/918446440469">+91 84464 40469</a> · <a href="mailto:hello@jhayra.in">hello@jhayra.in</a> · <a href="https://www.instagram.com/thejhayra/">Instagram @thejhayra</a></p></footer>`;
const crumbs = (items) => `<nav aria-label="Breadcrumb">${items.map(([l, u], i) => (i === items.length - 1 ? esc(l) : `<a href="${u}">${esc(l)}</a>`)).join(' / ')}</nav>`;
const faqHtml = (items, title = 'Frequently asked questions') => (items?.length ? `<h2>${esc(title)}</h2>${items.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}` : '');
const faqLd = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

function page({ path, title, description, image = OG, noindex = false, jsonLd, body = '' }) {
  const url = SITE + (path === '/' ? '/' : path);
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`);
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const extra = [
    preloadsFor(path),
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    // Same id the app uses, so client-side navigation replaces it (no duplicates).
    ld.length ? `<script type="application/ld+json" id="page-jsonld">${JSON.stringify(ld.length === 1 ? ld[0] : ld).replace(/</g, '\\u003c')}</script>` : '',
  ].join('\n    ');
  html = html.replace('</head>', `    ${extra}\n  </head>`);
  if (body) html = html.replace('<div id="root"></div>', `<div id="root"><div class="prerender">${chrome(body)}</div></div>`);
  return html;
}

function write(path, html) {
  const file = path === '/' ? join(dist, 'index.html') : join(dist, path.replace(/^\//, ''), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

async function rest(q) {
  const r = await fetch(`${SUPABASE}/rest/v1/${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${q}: ${r.status}`);
  return r.json();
}

/* ── Catalogue (one fetch, used everywhere below) ─────────────────────────── */
let cat = { products: [], categories: [], collections: [], sizes: [], colours: [], materials: [], options: [] };
try {
  const [products, categories, collections, sizes, colours, materials, options] = await Promise.all([
    rest('products?select=*,product_images(*)&active=eq.true&order=display_order.asc'),
    rest('categories?select=*&active=eq.true&order=display_order.asc'),
    rest('homepage_collections?select=*&active=eq.true&order=display_order.asc').catch(() => []),
    rest('frame_sizes?select=*&active=eq.true&order=display_order.asc'),
    rest('frame_colours?select=*&active=eq.true&order=display_order.asc'),
    rest('frame_materials?select=*&active=eq.true&order=display_order.asc'),
    rest('product_options?select=*'),
  ]);
  cat = { products, categories, collections, sizes, colours, materials, options };
  // Catalogue snapshot served from the same domain (CDN edge near the visitor),
  // so product grids paint without waiting on the database; the app refreshes
  // from Supabase right after and swaps in any newer data.
  mkdirSync(join(dist, 'data'), { recursive: true });
  writeFileSync(join(dist, 'data', 'catalog.json'), JSON.stringify({ at: new Date().toISOString(), products, categories, collections, frameTables: { sizes, colours, materials }, options }));
} catch (e) {
  console.warn('[prerender] catalogue fetch failed — product and category pages skipped:', e.message);
}

// Sizes, finishes and material for one product, priced exactly as the app does.
function config(p) {
  const opts = cat.options.filter((o) => o.product_id === p.id).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const of = (type) => opts.filter((o) => o.option_type === type);
  const sizes = of('size')
    .map((o) => {
      const s = cat.sizes.find((x) => x.slug === o.option_slug);
      return s && { slug: s.slug, name: s.name, dimensions: s.dimensions, price: o.price_override != null ? +o.price_override : +s.base_price };
    })
    .filter(Boolean);
  const colours = of('colour').map((o) => cat.colours.find((x) => x.slug === o.option_slug)).filter(Boolean);
  const material = of('material').map((o) => cat.materials.find((x) => x.slug === o.option_slug)).filter(Boolean)[0];
  return { sizes, colours, material };
}
// Images in the crawler-readable HTML sit inside <noscript>: crawlers read
// them, while browsers running the app don't download them a second time.
const thumb = (u, w = 480) => `https://wsrv.nl/?url=${encodeURIComponent(u)}&w=${w}&output=webp&q=78`;
const images = (p) => (p.product_images || []).filter((i) => i.active !== false).sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.display_order || 0) - (b.display_order || 0));
const catName = (slug) => cat.categories.find((c) => c.slug === slug)?.name || slug;
const products = cat.products.filter((p) => p.legacy_id);
const fromPrice = (p) => Math.min(...(config(p).sizes.map((s) => s.price).concat(p.price ? [+p.price] : [])));
const productItem = (p) => {
  const img = images(p)[0]?.url;
  return `<li><a href="/product/${p.legacy_id}">${esc(p.name)}</a> — <a href="/shop/${p.category_slug}">${esc(catName(p.category_slug))} wall art</a>, from ${inr(fromPrice(p))}${p.description ? `. ${esc(p.description)}` : ''}${img ? `<noscript><img src="${esc(thumb(img))}" alt="${esc(`${p.name} — framed ${catName(p.category_slug).toLowerCase()} wall art by JHAYRA`)}" width="240" loading="lazy" /></noscript>` : ''}</li>`;
};
const usedCats = cat.categories.filter((c) => products.some((p) => p.category_slug === c.slug));
const shopFacts = cat.sizes.length
  ? `<p>Every design comes in ${cat.sizes.length} sizes — ${cat.sizes.map((s) => `${esc(s.name)} (${esc(s.dimensions)}) ${inr(s.base_price)}`).join(', ')} — in a premium PS moulding frame. Made to order in 1–2 business days, then 5–7 business days in transit, with free delivery across India.</p>`
  : '';

/* ── Static pages ─────────────────────────────────────────────────────────── */
const STATIC = [
  ['/', 'JHAYRA — Framed Wall Art & Personalised Photo Frames Online in India', 'JHAYRA — Crafting Memories Into Art. Framed wall art and personalised photo frames, handcrafted to order in India since 2017. Shop by room, design your own and see it on your wall. Free delivery across India.'],
  ['/shop', 'Buy Framed Wall Art & Personalised Photo Frames Online in India | JHAYRA', 'Shop handcrafted framed wall art and personalised photo frames online — religious, nature, abstract, modern, couple and family designs in four sizes. Free delivery across India.'],
  ['/collections', 'Collections — Curated Wall Art | JHAYRA', 'Curated JHAYRA collections: nature reimagined, abstract forms, minimalist living, botanical stories, personal memories and art for gifting.'],
  ['/customize', 'Personalised Photo Frames Online — Design Yours Live | JHAYRA', 'Design a personalised photo frame online: 150+ designs for weddings, anniversaries, birthdays, babies and festivals. Add photos, names and dates and see it live. From ₹499.'],
  ['/customize/photo', 'Custom Photo Frame — Turn Your Photo Into Framed Art | JHAYRA', 'Upload a photo, choose a treatment (original, monochrome, vintage, pencil sketch, soft glow), add names or a date, and order it framed from ₹499 with free delivery in India.'],
  ['/customize/scratch', 'Design Your Own Photo Frame | JHAYRA', 'Design a personalised frame from scratch: any layout, up to 9 photos, your words, colours and decorations.'],
  ['/gift-finder', 'Gift Finder — Personalised Gift Ideas in Five Questions | JHAYRA', 'Answer five quick questions — who it’s for, the occasion, budget, style and type of art — and get matching JHAYRA artwork and personalised frames.'],
  ['/room-inspiration', 'Wall Décor Ideas by Room — Living Room, Bedroom & Pooja Room | JHAYRA', 'Living room, pooja room, bedroom and staircase gallery wall ideas — shop each look in one tap, true to size.'],
  ['/wall-planner', 'Gallery Wall Planner — Design Your Wall | JHAYRA', 'Plan a gallery wall true to scale above your sofa or bed and add the whole set to your bag.'],
  ['/visualise', 'Visualise Wall Art in Your Room | JHAYRA', 'Upload a photo of your wall, choose any JHAYRA artwork, size and frame, and see how it looks before you buy.'],
  ['/signature-experience', 'The JHAYRA Signature Experience — Founder-Curated Art', 'An exclusive, founder-curated collection: framed to order, premium packaging included and personal service.'],
  ['/celebrations', 'Celebrations — Festival, Wedding & Gifting Collections | JHAYRA', 'Festive art, wedding keepsakes and personalised gifts for every celebration — curated JHAYRA collections, delivered free across India.'],
  ['/worlds', 'Worlds — Divine Art, Gen Z Quotes, Scenery & More | JHAYRA', 'JHAYRA worlds: Gen Z and desi quotes, divine art for every faith, festivals, scenery, Mithila heritage, Vastu, sports, city love, kids’ name boards and more.'],
  ['/journal', 'Wall Art Ideas & Framing Guides — JHAYRA Journal', 'Practical guides: gallery wall planning, how high to hang art and what size to choose, styling by room, personalised gift ideas and framed art care.'],
  ['/about', 'About JHAYRA — Our Story Since 2017', 'JHAYRA makes framed wall art and personalised photo frames, handcrafted to order in India since 2017. Meet the founder and how every piece is made.'],
  ['/contact', 'Contact JHAYRA', 'WhatsApp +91 84464 40469, email hello@jhayra.in or Instagram @thejhayra — talk to a real person.'],
  ['/support', 'Help & FAQ — Delivery, Sizes, Photos & Payments | JHAYRA', 'Answers to common questions: delivery times, sizes and frames, photo quality, payments, damaged orders and bulk orders.'],
  ['/corporate', 'Corporate Gifting — Personalised Wall Art in Bulk | JHAYRA', 'Branded, personalised frames for employee milestones, client thank-yous and festive gifting.'],
];
const PRIVATE = [
  ['/cart', 'Your Bag | JHAYRA'],
  ['/checkout', 'Secure Checkout | JHAYRA'],
  ['/orders', 'My Orders | JHAYRA'],
  ['/wishlist', 'My Wishlist | JHAYRA'],
  ['/track', 'Track Your Order | JHAYRA'],
];

const urls = []; // [path, priority, lastmod?, images?]
const today = new Date().toISOString().slice(0, 10);
const catLinks = usedCats.map((c) => `<li><a href="/shop/${c.slug}">${esc(CATEGORY_SEO[c.slug]?.h1 || c.name)}</a> (${products.filter((p) => p.category_slug === c.slug).length} designs)</li>`).join('');
const roomLinks = ROOMS.map((r) => `<li><a href="/shop?room=${r.id}">${esc(r.label)} wall art</a> — ${esc(r.blurb)}</li>`).join('');

const TEMPLATES = (() => {
  try {
    const t = JSON.parse(readFileSync(join(root, 'src/templates.json'), 'utf8'));
    return { groups: t.groups || [], list: (t.templates || []).filter((x) => x.status !== 'inactive') };
  } catch {
    return { groups: [], list: [] };
  }
})();
const tmplItem = (x) => `<li><a href="/customize/${x.id}">${esc(x.title)}</a>${x.subtitle ? ` — ${esc(x.subtitle)}` : ''}${x.slots?.length ? ` (${x.slots.length} photo${x.slots.length > 1 ? 's' : ''})` : ''}</li>`;
const tmplByGroup = () =>
  TEMPLATES.groups
    .map((g) => [g, TEMPLATES.list.filter((x) => x.group === g.id)])
    .filter(([, l]) => l.length)
    .map(([g, l]) => `<h3>${esc(g.label)}</h3><ul>${l.map(tmplItem).join('')}</ul>`)
    .join('');
const fromSize = cat.sizes[0] ? inr(cat.sizes[0].base_price) : '₹499';

const { ARTICLES: ARTICLE_LIST } = await import('../src/lib/journal.js');

const BODIES = {
  '/': () =>
    `<h1>Framed wall art &amp; personalised photo frames, handcrafted in India</h1><p>JHAYRA — Crafting Memories Into Art. We make framed wall art and personalised photo frames to order, and deliver free across India.</p>${shopFacts}` +
    `<h2>Shop by category</h2><ul>${catLinks}</ul><h2>Shop by room</h2><ul>${roomLinks}</ul>` +
    `<h2>Bestsellers</h2><ul>${products.filter((p) => p.is_bestseller).slice(0, 12).map(productItem).join('')}</ul>` +
    `<h2>Create your own</h2><p><a href="/customize">Design a personalised photo frame</a> with your photos, names and dates and see it live, <a href="/customize/photo">frame a single photo</a>, or <a href="/gift-finder">find a gift</a> in five questions.</p>${faqHtml(HOME_FAQ)}`,
  '/shop': () => `<h1>Shop framed wall art &amp; personalised frames</h1>${shopFacts}<h2>Categories</h2><ul>${catLinks}</ul><h2>Rooms</h2><ul>${roomLinks}</ul><h2>All designs</h2><ul>${products.map(productItem).join('')}</ul>`,
  '/support': () => `<h1>Help &amp; FAQ</h1>${faqHtml(FAQ, 'Common questions')}`,
  '/customize': () =>
    `<h1>Personalised photo frames — design yours live</h1><p>Choose a design, add your photos, names and dates, and see the finished frame update as you go. Then pick a size and a frame; every personalised frame starts at ${fromSize} and is delivered free across India.</p>` +
    `<p>Other ways to start: <a href="/customize/photo">frame a single photo</a>, <a href="/customize/scratch">design from scratch</a> (any layout, up to 9 photos), or <a href="/wall-planner">plan a gallery wall</a>.</p>${shopFacts}<h2>All ${TEMPLATES.list.length} designs</h2>${tmplByGroup()}`,
  '/gift-finder': () =>
    `<h1>Gift Finder — personalised gift ideas</h1><p>Answer five quick questions — who the gift is for, the occasion, your budget, their style and whether you want ready-made or personalised art — and the Gift Finder suggests matching JHAYRA artwork and personalised frames from the live collection.</p><h2>How recommendations work</h2><p>${esc(GIFT_HOW)}</p>` +
    `<h2>Gift ideas by recipient and occasion</h2>${GIFT_GUIDE.map(([h, t, l]) => `<h3>${esc(h)}</h3><p>${esc(t)}</p><p>${links(l)}</p>`).join('')}` +
    `<h2>Budgets</h2><p>Every design comes in these sizes: ${cat.sizes.map((s) => `${esc(s.name)} (${esc(s.dimensions)}) ${inr(s.base_price)}`).join(', ') || 'A4 to 24 × 36 inches, from ₹499'}.</p>` +
    `<h2>Gift-ready</h2><p>Add a printed gift card at checkout and hide the price (₹100). Made to order in 1–2 business days, then 5–7 business days in transit, with free delivery across India.</p>` +
    `<h2>Popular gifts</h2><ul>${products.filter((p) => p.is_bestseller).slice(0, 8).map(productItem).join('')}</ul><p>Read the <a href="/journal/wall-art-gift-guide-occasions">wall art gift guide</a> or <a href="/journal/how-to-make-a-personalised-photo-frame">how to make a personalised photo frame gift</a>.</p>`,
  '/about': () =>
    `<h1>About JHAYRA</h1><p>JHAYRA — Crafting Memories Into Art — was founded in 2017 by Sandeep Jha with one idea: the moments people love most deserve a place on their walls, not just on their phones.</p>` +
    `<h2>What we make</h2><p>Framed wall art — devotional, nature, abstract, modern, Vastu and more — and personalised photo frames that customers design live on this website with their own photos, names and dates.</p>` +
    `<h2>How every piece is made</h2>${shopFacts}<p>Each order is printed, framed, quality-checked and packed for its journey. If anything arrives damaged or not as ordered, we replace it — see our <a href="/replacement-policy">replacement promise</a>.</p>` +
    `<h2>Talk to us</h2><p>WhatsApp <a href="https://wa.me/918446440469">+91 84464 40469</a>, email <a href="mailto:hello@jhayra.in">hello@jhayra.in</a> or Instagram <a href="https://www.instagram.com/thejhayra/">@thejhayra</a>.</p>`,
  '/contact': () =>
    `<h1>Contact JHAYRA</h1><p>Talk to a real person about an order, a custom size, a bulk order or help choosing a design.</p><ul><li>WhatsApp / phone: <a href="https://wa.me/918446440469">+91 84464 40469</a></li><li>Email: <a href="mailto:hello@jhayra.in">hello@jhayra.in</a></li><li>Instagram: <a href="https://www.instagram.com/thejhayra/">@thejhayra</a></li></ul><p>Hours: Monday–Saturday 9:00 AM – 7:00 PM, Sunday 10:00 AM – 4:00 PM (India time).</p>`,
  '/collections': () => `<h1>Collections</h1><p>Curated JHAYRA collections and every category in the shop.</p><h2>Categories</h2><ul>${catLinks}</ul>`,
  '/journal': () => `<h1>Wall art ideas &amp; framing guides</h1><p>Practical guides from JHAYRA on choosing, sizing, hanging and gifting wall art.</p><ul>${ARTICLE_LIST.map((a) => `<li><a href="/journal/${a.slug}">${esc(a.title)}</a> — ${esc(a.dek)}</li>`).join('')}</ul>`,
};
const LD = {
  '/': () => [ORGANIZATION, WEBSITE, faqLd(HOME_FAQ)],
  '/support': () => [faqLd(FAQ)],
  '/about': () => [ORGANIZATION],
  '/contact': () => [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Contact JHAYRA', url: `${SITE}/contact`, about: { '@id': ORGANIZATION['@id'] } }, ORGANIZATION],
};

for (const [path, title, description] of STATIC) {
  const body = BODIES[path]?.() || `<h1>${esc(title.split('|')[0].split(' — ')[0].trim())}</h1><p>${esc(description)}</p>`;
  write(path, page({ path, title, description, jsonLd: LD[path]?.(), body }));
  urls.push([path, path === '/' ? '1.0' : path === '/shop' || path === '/customize' ? '0.9' : '0.7']);
}
// Policy pages: the full published text.
for (const [slug, p] of Object.entries(LEGAL)) {
  const path = `/${slug}`;
  const sections = p.sections.map(([h, v]) => `<h2>${esc(h)}</h2>${Array.isArray(v) ? `<ul>${v.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(v)}</p>`}`).join('');
  write(path, page({ path, title: withBrand(p.title), description: p.desc, body: `${crumbs([['Home', '/'], [p.title, path]])}<h1>${esc(p.title)}</h1><p>${esc(p.sub || p.desc)}</p>${sections}` }));
  urls.push([path, '0.4']);
}
for (const [path, title] of PRIVATE) write(path, page({ path, title, description: 'JHAYRA', noindex: true }));
// Shell for routes created after this build (new products, admin): vercel.json rewrites to it.
// Left indexable: the app sets the real title, canonical and robots tags once the page loads.
write('/app-shell', page({ path: '/', title: 'JHAYRA — Framed Wall Art & Personalised Photo Frames', description: 'Handcrafted wall art and personalised photo frames, made in India since 2017. Free delivery across India.' }));
// 404: same app shell, marked noindex. Vercel serves it with a real 404 status.
writeFileSync(join(dist, '404.html'), page({ path: '/404', title: 'Page Not Found | JHAYRA', description: 'This page has moved.', noindex: true }));

/* ── Category pages (/shop/:slug) ─────────────────────────────────────────── */
for (const c of usedCats) {
  const seo = CATEGORY_SEO[c.slug] || {};
  const path = `/shop/${c.slug}`;
  const name = seo.h1 || c.name;
  const list = products.filter((p) => p.category_slug === c.slug);
  const faq = categoryFaq(name, { sizes: cat.sizes, colours: cat.colours.filter((x) => cat.options.some((o) => o.option_type === 'colour' && o.option_slug === x.slug)) });
  const title = withBrand(seo.title || `${c.name} Wall Art & Frames`);
  const description = seo.description || c.description || `${c.name} framed wall art, handcrafted to order with free delivery across India.`;
  const img = images(list[0] || {})[0]?.url;
  write(
    path,
    page({
      path,
      title,
      description,
      image: img ? `https://wsrv.nl/?url=${encodeURIComponent(img)}&w=1200&h=630&fit=contain&cbg=efe5d4&output=jpg&q=82` : OG,
      jsonLd: [
        breadcrumbLd([['Home', '/'], ['Shop', '/shop'], [name, path]]),
        { '@context': 'https://schema.org', '@type': 'CollectionPage', name, description, url: SITE + path, isPartOf: { '@id': WEBSITE['@id'] }, mainEntity: { '@type': 'ItemList', numberOfItems: list.length, itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/product/${p.legacy_id}`, name: p.name })) } },
        faqLd(faq),
      ],
      body: `${crumbs([['Home', '/'], ['Shop', '/shop'], [name, path]])}<h1>${esc(name)}</h1><p>${esc(seo.intro || c.description || '')}</p><ul>${list.map(productItem).join('')}</ul>${shopFacts}${faqHtml(faq, 'Good to know')}<p>More categories: ${usedCats.filter((x) => x.slug !== c.slug).map((x) => `<a href="/shop/${x.slug}">${esc(CATEGORY_SEO[x.slug]?.h1 || x.name)}</a>`).join(' · ')}</p>`,
    }),
  );
  urls.push([path, '0.8', today, list.slice(0, 1).flatMap((p) => images(p).slice(0, 1).map((i) => [i.url, p.name]))]);
}

/* ── Product pages ────────────────────────────────────────────────────────── */
for (const p of products) {
  const imgs = images(p);
  const main = imgs[0]?.url;
  const image = main ? `https://wsrv.nl/?url=${encodeURIComponent(main)}&w=1200&h=630&fit=contain&cbg=efe5d4&output=jpg&q=82` : OG;
  const path = `/product/${p.legacy_id}`;
  const cName = catName(p.category_slug);
  const { sizes, colours, material } = config(p);
  const low = sizes.length ? Math.min(...sizes.map((s) => s.price)) : +p.price || 499;
  const description = `${p.description || p.name} Framed to order in India, from ${inr(low)}. Free delivery across India.`;
  const related = products.filter((x) => x.category_slug === p.category_slug && x.id !== p.id).slice(0, 4);
  const body =
    crumbs([['Home', '/'], ['Shop', '/shop'], [cName, `/shop/${p.category_slug}`], [p.name, path]]) +
    `<h1>${esc(p.name)}</h1>` +
    (main ? `<noscript><img src="${esc(thumb(main, 800))}" alt="${esc(`${p.name} — framed ${cName.toLowerCase()} wall art by JHAYRA`)}" width="600" /></noscript>` : '') +
    `<p>${esc(p.description || '')}</p>` +
    (p.customer_photo_eligible ? '<p>You can add your own photo to this design before it is framed.</p>' : '') +
    (sizes.length ? `<h2>Sizes &amp; prices</h2><ul>${sizes.map((s) => `<li>${esc(s.name)} — ${esc(s.dimensions)} — ${inr(s.price)}</li>`).join('')}</ul>` : '') +
    (colours.length ? `<h2>Frame</h2><p>${esc(material?.name || 'PS moulding')} frame in ${colours.map((c) => esc(c.name.toLowerCase())).join(', ')}. High-definition print with a protective front sheet; ready to hang.</p>` : '') +
    `<h2>Delivery &amp; replacement</h2><p>Made to order: 1–2 business days to craft and quality-check, then 5–7 business days in transit. Free delivery across India. Because each piece is made to order, change-of-mind returns aren’t accepted; if it arrives damaged or not as ordered, message us within 48 hours and we’ll replace it — see the <a href="/replacement-policy">replacement promise</a>.</p>` +
    (related.length ? `<h2>More ${esc(cName.toLowerCase())} wall art</h2><ul>${related.map(productItem).join('')}</ul>` : '') +
    `<p><a href="/shop/${p.category_slug}">See all ${esc(CATEGORY_SEO[p.category_slug]?.h1 || cName)}</a></p>`;
  write(
    path,
    page({
      path,
      title: withBrand(productTitle(p.name, cName)),
      description,
      image,
      jsonLd: [productLd({ id: p.legacy_id, name: p.name, description: p.description || p.name, images: imgs.map((i) => i.url), category: cName, sizes, colours, material: material?.name }), breadcrumbLd([['Home', '/'], ['Shop', '/shop'], [cName, `/shop/${p.category_slug}`], [p.name, path]])],
      body,
    }),
  );
  urls.push([path, '0.7', (p.updated_at || '').slice(0, 10) || today, imgs.slice(0, 4).map((i) => [i.url, p.name])]);
}

/* ── Editorial collections, journal articles and worlds ───────────────────── */
try {
  const { COLLECTIONS } = await import('../src/lib/collections.js');
  for (const c of COLLECTIONS) {
    const path = `/collections/${c.id}`;
    write(path, page({ path, title: `${c.title} — Wall Art Collection | JHAYRA`, description: c.story, jsonLd: breadcrumbLd([['Home', '/'], ['Collections', '/collections'], [c.title, path]]), body: `${crumbs([['Home', '/'], ['Collections', '/collections'], [c.title, path]])}<h1>${esc(c.title)}</h1><p>${esc(c.story)}</p>` }));
    urls.push([path, '0.6']);
  }
  const { ARTICLES } = await import('../src/lib/journal.js');
  for (const a of ARTICLES) {
    const path = `/journal/${a.slug}`;
    const text = a.body
      .map(([k, v]) => (k === 'h' ? `<h2>${esc(v)}</h2>` : k === 'p' ? `<p>${esc(v)}</p>` : Array.isArray(v) ? `<ul>${v.map((x) => `<li>${esc(typeof x === 'string' ? x : x?.[0] || '')}</li>`).join('')}</ul>` : ''))
      .join('');
    write(
      path,
      page({
        path,
        title: `${a.title} | JHAYRA Journal`,
        description: a.dek,
        jsonLd: [
          { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.dek, inLanguage: 'en-IN', author: { '@type': 'Organization', name: 'JHAYRA', url: `${SITE}/` }, publisher: { '@id': ORGANIZATION['@id'] }, mainEntityOfPage: SITE + path, image: OG },
          breadcrumbLd([['Home', '/'], ['Journal', '/journal'], [a.title, path]]),
        ],
        body: `${crumbs([['Home', '/'], ['Journal', '/journal'], [a.title, path]])}<article><h1>${esc(a.title)}</h1><p>${esc(a.dek)}</p>${text}</article>`,
      }),
    );
    urls.push([path, '0.6']);
  }
  // Only worlds with something to show (empty ones redirect to /worlds).
  const { WORLDS, worldProducts, worldTemplates } = await import('../src/lib/worlds.js');
  const tmplList = JSON.parse(readFileSync(join(root, 'src/templates.json'), 'utf8')).templates.filter((t) => t.status === 'active');
  const forWorlds = products.map((p) => ({ ...p, category: p.category_slug, thumbnail: images(p)[0]?.url || '' }));
  for (const w of WORLDS.filter((w) => worldProducts(w, forWorlds).length + worldTemplates(w, tmplList).length > 0)) {
    const path = `/worlds/${w.id}`;
    write(path, page({ path, title: `${w.title} — Wall Art World | JHAYRA`, description: w.line, body: `<h1>${esc(w.title)}</h1><p>${esc(w.kicker)}</p><p>${esc(w.line)}</p>` }));
    urls.push([path, '0.6']);
  }
} catch (e) {
  console.warn('[prerender] collections/journal/worlds skipped:', e.message);
}

/* ── Personalised template pages ──────────────────────────────────────────── */
try {
  const t = JSON.parse(readFileSync(join(root, 'src/templates.json'), 'utf8'));
  const from = cat.sizes[0] ? inr(cat.sizes[0].base_price) : '₹499';
  for (const x of t.templates || []) {
    if (x.status === 'inactive') continue;
    const path = `/customize/${x.id}`;
    const n = x.slots?.length || 0;
    const fields = (x.textFields || []).map((f) => f.label).filter(Boolean);
    write(
      path,
      page({
        path,
        title: `${x.title} — Personalised Photo Frame | JHAYRA`,
        description: `${x.description || x.subtitle || x.title} Personalise it live with your photos and names. From ${from}, free delivery across India.`,
        jsonLd: breadcrumbLd([['Home', '/'], ['Personalised frames', '/customize'], [x.title, path]]),
        body: `${crumbs([['Home', '/'], ['Personalised frames', '/customize'], [x.title, path]])}<h1>${esc(x.title)}</h1><p>${esc(x.description || x.subtitle || '')}</p><p>${n ? `Holds ${n} photo${n > 1 ? 's' : ''}` : 'A words-only design'}${fields.length ? `; personalise ${esc(fields.join(', ').toLowerCase())}` : ''}. Preview it live, then choose the size and frame. From ${from}.</p>`,
      }),
    );
    urls.push([path, '0.6']);
  }
} catch (e) {
  console.warn('[prerender] templates skipped:', e.message);
}

/* ── sitemap.xml with image entries ───────────────────────────────────────── */
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls
    .map(([u, pr, mod, imgs]) => `  <url><loc>${SITE}${u === '/' ? '/' : u}</loc><lastmod>${mod || today}</lastmod><priority>${pr}</priority>${(imgs || []).map(([src]) => `<image:image><image:loc>${esc(src)}</image:loc></image:image>`).join('')}</url>`)
    .join('\n')}\n</urlset>\n`,
);

/* ── robots.txt ───────────────────────────────────────────────────────────── */
// Search and AI crawlers are welcome. The admin, internal search results and
// filter/sort combinations are kept out of the crawl (their canonical pages are
// crawled instead). Bag, checkout, orders and wishlist stay crawlable so their
// noindex tag can be read, which keeps them out of results reliably.
writeFileSync(
  join(dist, 'robots.txt'),
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /app-shell',
    ...['q', 'sort', 'size', 'price', 'finish', 'orient', 'photo', 'style', 'mood', 'campaign', 'campaign-preview', 'preview', 'step'].flatMap((k) => [`Disallow: /*?${k}=`, `Disallow: /*&${k}=`]),
    '',
    `Sitemap: ${SITE}/sitemap.xml`,
    '',
  ].join('\n'),
);

/* ── llms.txt: a plain summary for AI assistants (optional convention) ────── */
writeFileSync(
  join(dist, 'llms.txt'),
  `# JHAYRA

> JHAYRA (“Crafting Memories Into Art”) is an Indian online store for framed wall art and personalised photo frames, handcrafted to order and delivered free across India. Founded in 2017 by Sandeep Jha.

## What JHAYRA sells
- Framed wall art: ${usedCats.map((c) => (CATEGORY_SEO[c.slug]?.h1 || c.name).toLowerCase()).join(', ')}.
- Personalised photo frames designed live on the website: weddings, anniversaries, birthdays, babies, family, festivals, mosaic, collage, calendar, moon & stars, quote and name-board designs.
- A single-photo framing studio and a gallery-wall planner.

## Sizes, frames and prices
${cat.sizes.map((s) => `- ${s.name} (${s.dimensions}): ${inr(s.base_price)}`).join('\n') || '- A4 to 24 × 36 inches, from ₹499'}
- Frames: premium PS moulding in ${cat.colours.filter((x) => cat.options.some((o) => o.option_type === 'colour' && o.option_slug === x.slug)).map((c) => c.name.toLowerCase()).join(', ') || 'black, gold or brown'}; high-definition print with a protective front sheet.
- Prices in Indian rupees (INR), shown per size on every product page.

## Delivery, returns and payment
- Made to order in 1–2 business days, then 5–7 business days in transit. Free delivery across India; no international shipping yet.
- Made-to-order items can't be returned for a change of mind. Damaged, defective or incorrect orders are replaced free when reported on WhatsApp within 48 hours of delivery.
- Payments via Razorpay: UPI, cards, netbanking and wallets.

## Key pages
- [Shop all wall art](${SITE}/shop)
${usedCats.map((c) => `- [${CATEGORY_SEO[c.slug]?.h1 || c.name}](${SITE}/shop/${c.slug})`).join('\n')}
- [Personalised photo frames](${SITE}/customize)
- [Frame a single photo](${SITE}/customize/photo)
- [Gift finder](${SITE}/gift-finder)
- [Journal: wall art and framing guides](${SITE}/journal)
- [About JHAYRA](${SITE}/about)
- [Help & FAQ](${SITE}/support)
- [Shipping policy](${SITE}/shipping-policy)
- [Refund policy](${SITE}/refund)
- [Replacement promise](${SITE}/replacement-policy)

## Contact
- WhatsApp / phone: +91 84464 40469
- Email: hello@jhayra.in
- Instagram: https://www.instagram.com/thejhayra/
`,
);

/* ── Google Merchant Center feed (RSS 2.0) ────────────────────────────────── */
// One item per product and size (grouped by item_group_id), priced exactly as
// on the product page, which opens on that size via ?size=.
const feedItems = products.flatMap((p) => {
  const { sizes, colours, material } = config(p);
  const imgs = images(p);
  if (!imgs.length) return [];
  const cName = catName(p.category_slug);
  return sizes.map(
    (s) => `    <item>
      <g:id>${esc(`${p.legacy_id}-${s.slug}`)}</g:id>
      <g:item_group_id>${esc(p.legacy_id)}</g:item_group_id>
      <g:title>${esc(`${p.name} — Framed ${cName} Wall Art, ${s.name} (${s.dimensions})`)}</g:title>
      <g:description>${esc(`${p.description || p.name} ${s.name} (${s.dimensions}) framed print in ${material?.name || 'PS moulding'}; frame finishes: ${colours.map((c) => c.name).join(', ')}. Handcrafted to order in India.`)}</g:description>
      <g:link>${SITE}/product/${esc(p.legacy_id)}?size=${esc(s.slug)}</g:link>
      <g:image_link>${esc(imgs[0].url)}</g:image_link>
${imgs
  .slice(1, 6)
  .map((i) => `      <g:additional_image_link>${esc(i.url)}</g:additional_image_link>`)
  .join('\n')}
      <g:availability>in_stock</g:availability>
      <g:price>${Math.round(s.price)}.00 INR</g:price>
      <g:brand>JHAYRA</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>Home &amp; Garden &gt; Decor &gt; Artwork &gt; Posters, Prints, &amp; Visual Artwork</g:google_product_category>
      <g:product_type>${esc(`Wall Art > ${cName}`)}</g:product_type>
      <g:size>${esc(`${s.name} (${s.dimensions})`)}</g:size>
      <g:material>${esc(material?.name || 'PS Moulding')}</g:material>
      <g:shipping><g:country>IN</g:country><g:price>0.00 INR</g:price><g:min_handling_time>1</g:min_handling_time><g:max_handling_time>2</g:max_handling_time><g:min_transit_time>5</g:min_transit_time><g:max_transit_time>7</g:max_transit_time></g:shipping>
    </item>`,
  );
});
mkdirSync(join(dist, 'feeds'), { recursive: true });
writeFileSync(
  join(dist, 'feeds', 'google-merchant.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>JHAYRA — Framed Wall Art &amp; Personalised Photo Frames</title>\n    <link>${SITE}/</link>\n    <description>JHAYRA product feed</description>\n${feedItems.join('\n')}\n  </channel>\n</rss>\n`,
);

rmSync(join(dist, '.vite'), { recursive: true, force: true });
console.log(`[prerender] ${urls.length} indexable pages, ${products.length} products, ${usedCats.length} categories, ${feedItems.length} feed items`);
