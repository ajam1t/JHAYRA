# What works today, and what needs backend work

Everything on the live site is connected to real data and real checkout. The
items below are deliberately **not** shown as working features until the
backend pieces exist.

## Working now

| Feature | How it works |
| --- | --- |
| Catalogue, prices, options | Supabase `products`, `product_options`, `frame_*` tables |
| Checkout | Razorpay via `create-razorpay-order` / `verify-razorpay-payment` Edge Functions |
| Living Art Studio treatments | Original, Monochrome, Vintage, Pencil sketch, Soft glow run in the browser (`src/lib/treatments.js`). The **same function** renders the preview and the print file; the cropped, treated, captioned JPEG is uploaded to `customer-artwork` with the original, and the order's `customization` carries `source: "living-studio"`, `treatment`, `texts`, `printReady: true`. |
| Visualise in my room | Sample rooms drawn to scale (84-inch sofa), or the customer's own wall photo with drag, size, wall-angle and before/after. Live camera mode with A4 calibration on phones. It is a photo preview, not AR. |
| Editable templates & festivals | JSON in `product-images/site-config/`, edited from Admin |

## Needs integration

### 1. Generative art styles (watercolour, oil painting, line art)

These need an image model. Keep it behind one server-side function so keys never reach the browser.

- **Edge Function** `stylise-artwork` (POST, authenticated with the publishable key + rate limit by IP)
  - Body: `{ "path": "<customer-artwork path>", "style": "watercolour" | "oil" | "line-art" }`
  - Reads the original from `customer-artwork` with the service role, calls the provider, writes the result to `customer-artwork/<folder>/styled-<style>.jpg`, returns `{ path, previewUrl }` (signed, 1 hour).
- **Secrets**: provider API key as an Edge Function secret only.
- **Front end**: `remoteTreatment()` in `src/lib/treatments.js` is the hook. Add the styles to `TREATMENTS` with `remote: true` only once the function is deployed.
- **Cost control**: cache by `(path, style)`; cap requests per session.

### 2. Email newsletter

The footer currently offers WhatsApp updates (a real link). For email sign-up:

```sql
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source text default 'footer',
  created_at timestamptz default now(),
  unsubscribed_at timestamptz
);
alter table public.newsletter_subscribers enable row level security;
create policy "anyone can subscribe" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);
-- no select/update/delete for anon; admins read via the dashboard or a role-checked policy
```

Then add the form back to `Footer` in `src/components/Layout.jsx` with an `insert` call. Pair with a provider (e.g. Resend, Mailchimp) and a double opt-in email.

### 3. Customer accounts

Today the account icon opens **My orders**, which lists orders placed on that device. Real accounts need:

- Supabase Auth with phone OTP (Indian customers expect mobile login) — enable the SMS provider in Supabase.
- `orders.customer_user_id uuid references auth.users` set by `create-razorpay-order` when a session exists.
- RLS: `create policy "own orders" on orders for select using (customer_user_id = auth.uid());` and the same for `order_items` via a join.
- Then `/orders` can read live status instead of the estimated timeline.

### 4. Verified reviews

No reviews are invented on the site. Product ratings come from the `rating` and `review_count` fields that admins maintain.

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  order_id uuid references public.orders(id),
  rating int not null check (rating between 1 and 5),
  body text,
  photo_path text,
  customer_name text,
  approved boolean default false,
  created_at timestamptz default now()
);
alter table public.reviews enable row level security;
create policy "read approved" on public.reviews for select using (approved);
```

Collect through a link sent after delivery (tied to a paid `order_id`), moderate in Admin, and only then show them.

### 5. True augmented reality

The live camera mode overlays the frame on the camera feed and uses an A4 sheet for scale. Real AR (surface tracking, perspective lock) would use WebXR (`immersive-ar`, Android Chrome) and Quick Look with USDZ models (iOS). That needs 3D frame models per size and is a separate project.

## Worlds (/worlds)

Twenty-three themed worlds, defined in `src/lib/worlds.js`. Each one fills itself from live products (by category slug and name keywords) and from personalised templates (by group). No backend work is needed. A world with nothing live shows an honest "Launching soon" page with a WhatsApp notify link.

To fill the empty worlds, add products under these category slugs. Admin → Worlds can create any missing category in one click:

- `anime`: original anime-style art only, with no copyrighted characters.
- `mithila`: hand-painted originals for the premium Heritage world.
- `sikh`, `buddhist`, `jain`, `christian`, `islamic`: the faith tabs in Divine.
- `genz-quotes`, `desi-quotes`: optional ready-made prints. These worlds already list editable quote templates.
- `sports`, `cities`, `name-boards`: optional ready-made prints. These worlds already have live builders (jersey, city skyline, kids' name board) on editable templates.

Template links can pre-fill text: `/customize/<template-id>?text.<field>=<value>`, for example `/customize/tmpl-name-aarav?text.name=Myra`. The Worlds builders and the homepage "Thought of the day" (`src/lib/thoughts.js`) use this.

Note: bundled templates live in `src/templates.json`. If an admin saves templates from Admin → Templates, the saved copy in storage replaces the bundled list. Any templates added to the code after that save will not appear until they are added in the admin too.

## Gift Finder (/gift-finder)

Deterministic scoring in `src/lib/giftfinder.js`; no AI or paid services. Answers live in the URL (`?who=&when=&budget=&style=&type=&step=`), so results can be shared and Back/Forward work.

- **Budget** options come from the live `frame_sizes` prices. A budget shows every size at or below that price, and product links preselect the largest size that fits.
- **Templates** are matched on their `recipient` and `occasion` fields.
- **Products** only have a category, so recipient, occasion and style map to categories and to words in the name.

Recommendations would get sharper with product **tags** in Admin → Products, e.g.:

- recipient: `for-partner`, `for-parents`, `for-friends`
- occasion: `anniversary`, `housewarming`, `diwali`
- style: `minimalist`, `floral`, `traditional`

`giftfinder.js` can read `product.tags` once they're filled in.

## Signature Experience (homepage #signature)

| Card | Status |
|---|---|
| Curated artwork | Live: bestseller data, real prices and links. |
| Packaging | Describes only what the policies state: quality-checked, packed securely, printed gift card inside the box with the price hidden. No gift-wrap option exists. Add packaging photos when available. |
| Personal gift messages | Live: the free gift card at checkout (to, from, message, hide price). `/checkout?gift=1` opens it. |
| Priority delivery | Not bookable online: no option, fee or date logic exists in checkout or the payment function. The card sends a WhatsApp enquiry. Needs a delivery-tier table, pincode serviceability and a fee passed to `create-razorpay-order`. |
| Founder delivery | WhatsApp request only, clearly marked "not confirmed until we accept". No location list or booking system exists. |
| Art concierge | WhatsApp (+91 84464 40469). |

## Reviews

The database has no reviews table, so the homepage shows the brand story and studio photography instead of testimonials. Per-product `rating` and `review_count` come from the products table. A verified-reviews table (order-linked, moderated) is needed before showing named reviews or customer room photos.
