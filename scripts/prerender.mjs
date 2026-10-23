// Post-build step: writes a static HTML file per route with its own title,
// description, canonical URL, social tags, structured data and a readable
// content summary, so Google and WhatsApp/Instagram link previews see real
// pages before JavaScript runs. Also writes sitemap.xml, robots.txt and 404.html.
// If the catalog can't be fetched (offline build), product pages are skipped and
// the SPA fallback in vercel.json still serves them.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://www.jhayra.com';
const SUPABASE = process.env.VITE_SUPABASE_URL || 'https://gwxdzemazqontjobqnyy.supabase.co';
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_aY3MrFdQflveTXhDNb_YyQ_S7HOZUE3';
const OG = `${SITE}/og-image.jpg`;
const shell = readFileSync(join(dist, 'index.html'), 'utf8');

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
  const extra = [
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '',
  ].join('\n    ');
  html = html.replace('</head>', `    ${extra}\n  </head>`);
  if (body) html = html.replace('<div id="root"></div>', `<div id="root"><div class="prerender">${body}</div></div>`);
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

const STATIC = [
  ['/', 'JHAYRA — Art That Lives With You | Wall Art & Personalised Frames', 'Premium wall art and personalised photo art in black frames, handcrafted in India since 2017. Discover by room, create your own, and visualise it on your wall.'],
  ['/shop', 'Shop Personalised Photo Frames & Wall Art | JHAYRA', 'Handcrafted frames — spiritual, modern, nature, couple and family wall art in four sizes. Free delivery across India.'],
  ['/collections', 'Collections — Spiritual, Modern, Nature & Personalised Wall Art | JHAYRA', 'Browse JHAYRA collections: religious and Vastu art, modern and abstract, nature, running horses, couple and family frames.'],
  ['/customize', 'Personalised Photo Frames — Design Yours Live | JHAYRA', 'Choose from 100+ personalised frame designs for weddings, anniversaries, birthdays and festivals. Add photos, names and dates and see it live.'],
  ['/customize/photo', 'Living Art Studio — Turn Your Photo Into Framed Art | JHAYRA', 'Upload a photo, choose a treatment (original, monochrome, vintage, pencil sketch, soft glow), add names or a date, and order it in a black frame from ₹499.'],
  ['/customize/scratch', 'Design Your Own Photo Frame | JHAYRA', 'Design a personalised frame from scratch: any layout, up to 9 photos, your words, colours and decorations.'],
  ['/gift-finder', 'Gift Finder — The Perfect Personalised Gift in 30 Seconds | JHAYRA', 'Answer four quick questions and find the perfect personalised frame or wall art for anyone.'],
  ['/room-inspiration', 'Wall Décor Ideas — Room Inspiration | JHAYRA', 'Living room, pooja room, bedroom and staircase gallery wall ideas — shop each look in one tap, true to size.'],
  ['/wall-planner', 'Gallery Wall Planner — Design Your Wall | JHAYRA', 'Plan a gallery wall true to scale above your sofa or bed and add the whole set to your cart.'],
  ['/visualise', 'Visualise Art in Your Room | JHAYRA', 'Upload a photo of your wall, choose any JHAYRA artwork, size and frame, and see how it looks before you buy.'],
  ['/worlds', 'Worlds — Anime, Divine, Gen Z Quotes, Scenery & More | JHAYRA', 'Twenty JHAYRA worlds: anime, Gen Z and desi quotes, divine art for every faith, festivals, scenery, Mithila heritage, Vastu, love, kids, pets and more.'],
  ['/journal', 'Inspiration Journal — Wall Art Ideas & Guides | JHAYRA', 'Gallery wall planning, how high to hang art, styling by room, personalised gift ideas and framed art care.'],
  ['/about', 'About JHAYRA — Our Story Since 2017', 'From a small workshop to 10,000+ homes: handcrafted photo frames and wall art made in India since 2017.'],
  ['/contact', 'Contact JHAYRA', 'WhatsApp +91 84464 40469, email hello@jhayra.in or Instagram @thejhayra — talk to a real person.'],
  ['/support', 'Help & FAQ | JHAYRA', 'Delivery times, replacements, photo quality and payments — answers to common questions.'],
  ['/corporate', 'Corporate Gifting — Personalised Wall Art in Bulk | JHAYRA', 'Branded, personalised frames for employees and clients. Volume pricing from ₹799/unit.'],
  ['/privacy', 'Privacy Policy | JHAYRA', 'How JHAYRA collects, uses and protects your personal information and photos.'],
  ['/terms', 'Terms of Service | JHAYRA', 'Terms for using the JHAYRA website and placing orders.'],
  ['/refund', 'Refund Policy | JHAYRA', 'Personalised products, made exclusively for you — and our free replacement promise.'],
  ['/replacement-policy', 'Our Replacement Promise | JHAYRA', 'If your JHAYRA arrives damaged or not as ordered, we replace it free.'],
  ['/shipping-policy', 'Shipping Policy — Free Delivery Across India | JHAYRA', 'Free delivery on every order. Made to order in 1–2 days, delivered in 5–7.'],
  ['/cookie-policy', 'Cookie Policy | JHAYRA', 'How JHAYRA uses cookies and local storage.'],
];
const PRIVATE = [
  ['/cart', 'Your Cart | JHAYRA'],
  ['/checkout', 'Secure Checkout | JHAYRA'],
  ['/orders', 'My Orders | JHAYRA'],
  ['/wishlist', 'My Wishlist | JHAYRA'],
];

const urls = [];
for (const [path, title, description] of STATIC) {
  write(path, page({ path, title, description, body: `<h1>${esc(title.split('|')[0].trim())}</h1><p>${esc(description)}</p>` }));
  urls.push([path, path === '/' ? '1.0' : '0.8']);
}
for (const [path, title] of PRIVATE) write(path, page({ path, title, description: 'JHAYRA', noindex: true }));
// Shell for routes created after this build (new products, admin): vercel.json rewrites to it.
write('/app-shell', page({ path: '/', title: 'JHAYRA — Personalised Photo Frames & Wall Art', description: 'Handcrafted photo frames and wall art, made in India since 2017. Free delivery across India.' }));

// 404: same app shell, marked noindex. Vercel serves it with a real 404 status.
writeFileSync(join(dist, '404.html'), page({ path: '/404', title: 'Page Not Found | JHAYRA', description: 'This page has moved.', noindex: true }));

let products = [];
try {
  products = await rest('products?select=legacy_id,name,description,price,category_slug,rating,review_count,product_images(url,is_primary,display_order,active)&active=eq.true');
} catch (e) {
  console.warn('[prerender] product fetch failed, skipping product pages:', e.message);
}
for (const p of products) {
  if (!p.legacy_id) continue;
  const imgs = (p.product_images || []).filter((i) => i.active !== false).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const main = (imgs.find((i) => i.is_primary) || imgs[0])?.url;
  const image = main ? `https://wsrv.nl/?url=${encodeURIComponent(main)}&w=1200&h=630&fit=contain&cbg=efe5d4&output=jpg&q=82` : OG;
  const path = `/product/${p.legacy_id}`;
  const description = `${p.description || p.name} Handcrafted in India, from ₹${Math.round(p.price || 499)}. Free delivery & free replacement if damaged.`;
  write(
    path,
    page({
      path,
      title: `${p.name} | JHAYRA`,
      description,
      image,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.description,
        image: imgs.map((i) => i.url),
        sku: p.legacy_id,
        brand: { '@type': 'Brand', name: 'JHAYRA' },
        ...(p.rating && p.review_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.review_count } } : {}),
        offers: { '@type': 'AggregateOffer', priceCurrency: 'INR', lowPrice: Math.round(p.price || 499), highPrice: 2999, availability: 'https://schema.org/InStock', url: SITE + path },
      },
      body: `<h1>${esc(p.name)}</h1><p>${esc(description)}</p>`,
    }),
  );
  urls.push([path, '0.7']);
}

// Editorial collections and journal articles
try {
  const { COLLECTIONS } = await import('../src/lib/collections.js');
  for (const c of COLLECTIONS) {
    const path = `/collections/${c.id}`;
    write(path, page({ path, title: `${c.title} — Wall Art Collection | JHAYRA`, description: c.story, body: `<h1>${esc(c.title)}</h1><p>${esc(c.story)}</p>` }));
    urls.push([path, '0.7']);
  }
  const { ARTICLES } = await import('../src/lib/journal.js');
  for (const a of ARTICLES) {
    const path = `/journal/${a.slug}`;
    const text = a.body.filter(([k]) => k === 'p' || k === 'h').map(([k, v]) => (k === 'h' ? `<h2>${esc(v)}</h2>` : `<p>${esc(v)}</p>`)).join('');
    write(
      path,
      page({
        path,
        title: `${a.title} | JHAYRA Journal`,
        description: a.dek,
        jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.dek, author: { '@type': 'Organization', name: 'JHAYRA' }, mainEntityOfPage: SITE + path },
        body: `<h1>${esc(a.title)}</h1><p>${esc(a.dek)}</p>${text}`,
      }),
    );
    urls.push([path, '0.6']);
  }
  const { WORLDS } = await import('../src/lib/worlds.js');
  for (const w of WORLDS) {
    const path = `/worlds/${w.id}`;
    write(path, page({ path, title: `${w.title} — Wall Art World | JHAYRA`, description: w.line, body: `<h1>${esc(w.title)}</h1><p>${esc(w.kicker)}</p><p>${esc(w.line)}</p>` }));
    urls.push([path, '0.6']);
  }
} catch (e) {
  console.warn('[prerender] collections/journal/worlds skipped:', e.message);
}

// Personalised template pages
try {
  const t = JSON.parse(readFileSync(join(root, 'src/templates.json'), 'utf8'));
  for (const x of t.templates || []) {
    if (x.status === 'inactive') continue;
    const path = `/customize/${x.id}`;
    write(path, page({ path, title: `${x.title} — Personalised Frame | JHAYRA`, description: `${x.description || x.subtitle} Personalise it live with your photos and names. From ₹499, free delivery.`, body: `<h1>${esc(x.title)}</h1><p>${esc(x.description || x.subtitle || '')}</p>` }));
    urls.push([path, '0.6']);
  }
} catch (e) {
  console.warn('[prerender] templates skipped:', e.message);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, pr]) => `  <url><loc>${SITE}${u === '/' ? '/' : u}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`,
);
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /checkout\nDisallow: /orders\nDisallow: /wishlist\nDisallow: /admin\nDisallow: /app-shell\n\nSitemap: ${SITE}/sitemap.xml\n`,
);
console.log(`[prerender] ${urls.length} indexable pages, ${products.length} products`);
