# JHAYRA — how the site works

A single-page React app (Vite) deployed on Vercel, backed by an existing Supabase
project. There is no custom server: the browser talks to Supabase directly, and
payments run through Supabase Edge Functions that wrap Razorpay.

## Stack

| Layer | What | Where |
| --- | --- | --- |
| UI | React 18, React Router 6, plain CSS with design tokens | `src/` |
| Build | Vite 5, then `scripts/prerender.mjs` writes static HTML per route | `package.json` |
| Hosting | Vercel (`vercel.json`: rewrites, headers, CSP, caching) | `main` → jhayra.com, other branches → preview URLs |
| Data | Supabase Postgres + Storage, publishable key in `src/lib/supabase.js` | Row Level Security decides access |
| Payments | Razorpay Checkout via Edge Functions `create-razorpay-order`, `verify-razorpay-payment` | `src/pages/Checkout.jsx` |
| Images | Supabase Storage originals, resized on the fly by wsrv.nl | `src/lib/img.js`, `src/components/Img.jsx` |

## Source of truth (Supabase)

Read by the storefront with the publishable key:

- `products` (+ `product_images`) — catalogue. `legacy_id` (e.g. `p018`) is the public product id used in URLs and sent to checkout as `legacyId`.
- `product_options` — which sizes / colours / materials each product offers, plus `price_override`.
- `frame_sizes`, `frame_colours`, `frame_materials` — option tables. Size `base_price` is the price unless overridden.
- `categories`, `homepage_collections`.

Written only by signed-in admins (RLS): everything above, `orders.order_status`.

Written by Edge Functions (service role): `orders`, `order_items`.

Storage buckets:

- `product-images` (public) — product photos, homepage tiles, and `site-config/templates.json` + `site-config/festivals.json` (admin-editable config).
- `customer-artwork` (private) — customer uploads; admins read them through signed URLs.

## Checkout contract (unchanged from the original site)

`create-razorpay-order` body:

```json
{
  "items": [{ "legacyId": "p018 | custom", "name": "", "qty": 1, "price": 999, "size": "A3+", "colour": "Black",
              "orientation": "Vertical", "category": "", "artworkPaths": ["<customer-artwork path>"], "customization": {} }],
  "customer": { "name": "", "mobile": "", "email": null, "address": "", "city": "", "state": null, "pin": "", "coupon": null }
}
```

Returns `{ razorpay_order_id, amount, currency, key_id, order_id, order_number }`. After Razorpay
succeeds, `verify-razorpay-payment` is called with the three Razorpay fields plus `order_id`.
`validate-coupon` takes `{ code }` and returns `{ valid, discount }` (percent).

Customer-photo products are sent as `legacyId: "custom"` with the uploaded paths in
`artworkPaths` and everything the workshop needs (template, texts, transforms, treatment,
gift note) in `customization`. The admin Orders screen renders that object.

## Front-end map

```
src/
  App.jsx                 routes (lazy-loaded pages, admin in its own chunk)
  components/
    Layout.jsx            header, nav drawer, cart drawer, search palette, footer
    Frame.jsx             the framed-artwork renderer used everywhere
    RoomScene.jsx         true-scale room (sofa/bed/console) for wall previews
    WallStudio.jsx        room / own-wall-photo / live camera preview
    TemplateCanvas.jsx    renders a personalised template (photos + text + ornaments)
    PanZoom.jsx           drag / pinch / wheel photo positioning
  lib/                    data loading, pricing tables, uploads, SEO, festivals, templates
  state/                  cart, wishlist, toasts, admin auth, festival theme
  pages/                  storefront pages
  admin/                  admin panel (orders, products, catalogue, templates, festivals)
scripts/prerender.mjs     static HTML + sitemap + robots + 404 after each build
```

## Local development

```
npm install
npm run dev        # http://localhost:5173
npm run build      # production build + prerender (needs network for the product list)
```
