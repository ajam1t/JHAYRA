# JHAYRA — search & AI discoverability

How the site is set up for Google, Bing and AI assistants, which page targets
which searches, and the steps that have to be done outside the codebase.

## How pages reach crawlers

`npm run build` runs `scripts/prerender.mjs` after Vite. For every public URL it
writes a static HTML file with the page's own title, meta description,
canonical URL, Open Graph tags, JSON-LD and a readable HTML version of the
content (headings, product names, descriptions, prices, sizes, image alt text
and internal links). Crawlers that don't run JavaScript (most AI crawlers) see
that HTML; browsers swap in the full app.

The build also writes:

| File | Purpose |
| --- | --- |
| `/sitemap.xml` | Every indexable URL, with product images (`image:image`) and product `lastmod` from the database |
| `/robots.txt` | Allows all crawlers; keeps admin, internal search and filter/sort combinations out of the crawl |
| `/llms.txt` | Plain-text brand summary for AI assistants (optional convention, not a ranking factor) |
| `/feeds/google-merchant.xml` | Google Merchant Center feed: one item per product and size, real prices, free shipping, handling 1–2 days, transit 5–7 days |
| `/data/catalog.json` | Catalogue snapshot used by the app for fast first paint |

Shared sources of truth: `src/lib/schema.js` (JSON-LD), `src/lib/seoContent.js`
(category copy and titles), `src/lib/policies.js` (policy text),
`src/lib/faq.js`, `src/lib/giftfinder.js` (gift guide), `src/lib/journal.js`.

## Structured data

- Homepage: `Organization`, `WebSite` (with site search), `FAQPage`
- Product pages: `Product` with one `Offer` per size (price in INR, in stock,
  free shipping to India with handling/transit times, return policy) and
  `BreadcrumbList`
- Category pages `/shop/:slug`: `BreadcrumbList`, `CollectionPage` + `ItemList`, `FAQPage`
- Personalised designs: `BreadcrumbList`; `/customize`: `CollectionPage` + `ItemList`
- Journal: `Article` + `BreadcrumbList`; Help: `FAQPage`; Contact: `ContactPage`
- Returns are declared as `MerchantReturnNotPermitted` (made to order; damaged or
  incorrect orders are replaced — see /refund and /replacement-policy).
- **No `AggregateRating` or `Review` markup.** Products carry rating numbers in
  the database, but there are no individual customer reviews on the site to
  support them. Add review markup only once genuine reviews are collected and
  shown on the page.

## Keyword → URL map

One primary page per search intent, so pages don't compete.

| Search intent | Page |
| --- | --- |
| wall art online india, buy wall art online, framed wall art india, wall decor online | `/shop` |
| JHAYRA, jhayra wall art (brand) | `/` |
| personalised photo frames, custom photo frames, photo frame online with names | `/customize` |
| custom photo frame from one photo, photo to framed print | `/customize/photo` |
| religious wall art, god photo frame, ganesha / shiva / radha krishna frame | `/shop/religious` |
| nature wall art, landscape wall art | `/shop/nature` |
| abstract wall art | `/shop/art-abstract` |
| modern wall art, contemporary wall art | `/shop/modern-art` |
| running horses painting / wall art | `/shop/running-horses` |
| vastu wall art, vastu painting for living room | `/shop/home-vastu` |
| couple photo frame, love frame | `/shop/love-romance` |
| wedding photo frame, wedding gift frame | `/shop/wedding` |
| family photo frame | `/shop/family` |
| baby photo frame, kids name board | `/shop/baby-kids` |
| motivational quote frame | `/shop/quotes` |
| living room wall art | `/shop?room=living` + journal: living rooms |
| bedroom wall decor | `/shop?room=bedroom` + journal: bedroom guide |
| office wall art | `/shop?room=office` |
| pooja room wall art | `/shop?room=pooja` + journal: devotional art |
| personalised gifts, anniversary / wedding / housewarming gift ideas | `/gift-finder` + journal: gift guide |
| how to make a personalised photo frame | `/journal/how-to-make-a-personalised-photo-frame` |
| what size wall art, how high to hang art | `/journal/how-high-to-hang-art` |
| gallery wall ideas | `/journal/gallery-wall-planning`, `/wall-planner` |
| corporate gifts wall art | `/corporate` |

Category pages live at clean URLs (`/shop/religious`); old `/shop?category=…`
links redirect there permanently.

## External steps (need account access)

1. **Google Search Console** — add the `https://www.jhayra.com` property
   (domain verification via DNS is simplest), then submit
   `https://www.jhayra.com/sitemap.xml`. Use URL Inspection on `/`, `/shop`,
   one category and one product to confirm Google renders them.
2. **Bing Webmaster Tools** — import the site from Search Console and submit the
   same sitemap (Bing also feeds Copilot and other AI search).
3. **Google Merchant Center** — create an account for India/INR, verify and
   claim `www.jhayra.com`, add a scheduled feed fetch from
   `https://www.jhayra.com/feeds/google-merchant.xml` (daily), set shipping to
   free / India, and the return policy (no change-of-mind returns; replacement
   for damage within 48 hours). Then enable free listings.
4. **Google Business Profile** — only if JHAYRA has a real address customers can
   visit or a service area; don't create one otherwise.
5. **Visitor stats** — run `docs/sql/analytics.sql` once in Supabase → SQL
   Editor to switch on the Admin dashboard's visitor and page-speed figures.
6. Re-run `npm run build` (any deploy) after adding products so their static
   pages, sitemap entries and feed items are generated. New products work
   immediately in the app either way.

## What to measure

Search Console: impressions, clicks, CTR and position per page and query;
indexed pages; Core Web Vitals. Merchant Center: approved products, clicks.
Admin → Dashboard: visitors, daily visitors by page, sources, real-visitor
page speed, conversion.
