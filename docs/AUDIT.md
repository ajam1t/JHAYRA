# Production readiness audit — 30 Oct 2026

Scope: every public route (291 pages crawled at 390 px), 491 unique links, the
codebase, dependencies, live security headers, anonymous database/storage
access (read-only), the core purchase journeys (with the payment functions
mocked — no real orders or payments), accessibility and lab performance.

## Fixed in this pass

| Area | Issue | Fix |
| --- | --- | --- |
| Security | React Router (open-redirect / XSS advisories, high) | 6.26.2 → 6.30.6 |
| Security | Supabase auth-js path-routing advisory | supabase-js 2.45.4 → 2.52.0 (smallest patched; latest would have doubled the library to 58 KB gz) |
| Security | Admin-typed festival button links rendered as-is (`javascript:` possible) | `safePath()` — only same-site paths are followed |
| Security / SEO | `/admin` had no noindex header | `X-Robots-Tag: noindex, nofollow` + `no-store`; noindex header on bag/checkout/orders/wishlist |
| Bug | `site-config/signature.json` missing → a 400 request on every page | Created automatically on the next admin sign-in (like the other config files) |
| Bug / SEO | Missing collection, journal article, design and world pages were indexable | Not-found states are `noindex` |
| Bug | `/shop/<unknown-category>` silently showed the whole shop | "This category has moved", `noindex` |
| Bug | Checkout rejected `+91 98765 43210` and `098…` (14-char field cut the last digit) | Numbers normalised to 10 digits; must start 6–9; field allows 16 chars |
| Accessibility | "Shop the look" thumbnails were unnamed links | `aria-label` with the design name |
| Mobile | 4 px horizontal scroll on Worlds → Art | Decorative light kept inside the page |
| Performance | Entrance animations started from fully transparent, holding back LCP by ~1.5 s | First-view content is visible at once and glides in (same look) |
| Performance | Crawler-readable product images were also downloaded by every browser (≈360 KB on Shop) | Wrapped in `<noscript>` (crawlers still read them; sitemap lists them) |
| Performance | Each page's code started downloading only after the main bundle ran | Prerendered pages `modulepreload` their own chunk and CSS |
| Performance | Create page rendered ~50 live design previews at load | Below-the-fold rails and grid mount on approach |
| Performance | Bag styles loaded on every page | Loaded with the Bag page only |
| Quality | No automated tests | `npm test`: 16 business-logic tests (Node test runner, no new dependencies) |

### Lab performance (throttled: slow 4G, 4× CPU, 390 px)

| Page | LCP before | LCP after | CLS | Transfer before → after |
| --- | --- | --- | --- | --- |
| Home | 3.7 s | 1.95 s | 0.002 | 957 → 603 KB |
| Shop | ~6.0 s | 2.7 s | 0.006 | 1188 → 835 KB |
| Product | 3.0 s | 2.6 s | 0.004 | 652 → 298 KB |
| Create | 4.4 s | 2.9 s | 0.005 | 901 → 467 KB |
| Gift Finder | 4.0 s | 2.7 s | 0.000 | 618 → 264 KB |
| Bag | 3.4 s | 2.0 s | 0.004 | 578 → 224 KB |

Throttling is deliberately harsher than typical Indian 4G. Real-visitor numbers
appear in Admin → Dashboard once visitor stats are switched on.

## Verified working (tests executed)

- `npm run build` (Vite + prerender: 277 indexable pages, 50 products, 16 categories, 200 feed items)
- `npm test` — 16/16 pass (bag totals & coupon rounding, Signature 3× and custom prices, founder-delivery pincodes, Gift Finder budget/style filters, link guard, rupee formatting, Product schema offers, category FAQ facts, campaign IST windows & priority, mobile normalisation)
- Crawl of 291 routes: no JavaScript errors; no horizontal scroll; no broken images; every image has alt text
- 287 unique internal links: none lead to a not-found page
- Checkout journey (payment functions mocked): product + custom photo frame → upload (2 files) → address & pincode lookup → gift card → order payload with catalogue prices (A3+ ₹999) → mocked verify → confirmation; no page errors
- Bag: quantity, save for later, undo, remove; mobile bar; totals
- Gift Finder: wheel → five answers → reveal and results
- Menu (ivory drawer), sign-in PIN gate, dashboard (mocked admin data)
- Accessibility (axe, WCAG A/AA) on the audited page set, menu, sign-in, Bag, Create, Gift Finder — no violations
- Live headers: CSP, HSTS (preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy
- No secrets in the bundle, source or git history (only the public Supabase URL and publishable key, by design)
- Anonymous reads of `orders`, `order_items`, `profiles` return nothing; `customer-artwork` can't be listed

## Feature inventory

| Feature | Status |
| --- | --- |
| Catalogue, categories, product pages, sizes/finishes pricing | Working |
| Shop filters, search, sort, rooms, clean category URLs | Working |
| Personalised templates (150), single-photo studio, from-scratch designer | Working |
| Photo upload to private storage | Working (client checks type/size) |
| Gift Finder | Working |
| Wishlist & recently viewed | Working (stored on the device) |
| Bag, coupons (server-validated), checkout, Razorpay | Working — server-side pricing to be confirmed (see below) |
| Order confirmation & "My orders" | Partially: lists orders placed on this device; no customer accounts |
| Customer accounts / login | Not implemented (documented in docs/INTEGRATIONS.md) |
| Reviews | Not implemented (no review records; product ratings are admin-entered numbers) |
| Signature Experience | Working; online payment off by design — orders complete via WhatsApp concierge until the payment function applies Signature pricing (docs/SIGNATURE.md) |
| Events & campaigns, festivals | Working |
| Admin: products, orders, catalogue, templates, campaigns, Signature, dashboard | Working (UI tested with mocked data) |
| Visitor & speed analytics | UI ready; database table not yet created |
| Visualise / Wall planner / Room inspiration | Working (photo preview, not AR) |

## Needs your action

1. **Confirm server-side pricing** (critical). The browser sends item prices to
   `create-razorpay-order`. Its code lives in Supabase, not this repository, so it
   couldn't be inspected, and testing it would create a real order. In Supabase →
   Edge Functions → `create-razorpay-order`, confirm the amount is computed from
   `frame_sizes.base_price` / `product_options.price_override` (and the coupon from
   the database), never from `items[].price`. If not, fix it before scaling
   traffic — a modified browser request could otherwise pay less. docs/SIGNATURE.md
   has the pricing logic to copy.
2. **Check write policies** (Supabase → Authentication → Policies). Anonymous
   visitors must not be able to insert/update/delete `products`, `categories`,
   `frame_*`, `product_options`, `product_images`, `homepage_collections`,
   `orders`, `order_items`, `profiles`. Storage: anonymous upload only to
   `customer-artwork`; `product-images` writes for admins only. (Write probes
   against production were not run.)
3. **Restrict the `customer-artwork` bucket** (Storage → bucket settings): allowed
   MIME types `image/jpeg, image/png, image/webp, image/heic, image/heif`; max file
   size 15 MB. The browser enforces this, but only the bucket setting stops direct
   uploads.
4. **Sign in to Admin once** — creates `signature.json` and stops the 400 request.
5. **Visitor stats** — run the setup script from Admin → Dashboard in the SQL editor.
6. **Backups** — confirm Supabase daily backups / point-in-time recovery for your plan.
7. **Rate limiting** — Supabase applies limits to auth; for `validate-coupon` and
   `create-razorpay-order`, confirm per-IP limits in the functions (prevents coupon
   guessing and order spam).
8. **React Router 7** — one moderate advisory remains that only v7 fixes; low
   practical risk (no link targets come from visitors). Plan the upgrade.
9. **Dev-only Vite advisories** affect the local dev server, not the live site;
   fixed by Vite 6+ when convenient.
10. **Claims to confirm**: "10,000+ homes", "48 hrs bulk turnaround", "from ₹799/unit",
    product star ratings.
