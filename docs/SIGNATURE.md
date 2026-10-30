# Signature Experience — server-side pricing

The Signature page, admin manager and checkout run entirely on the existing
stack. Settings live in Supabase Storage at
`product-images/site-config/signature.json` (Admin → Signature collection).

## Why online payment is off by default

Prices must be enforced on the server. The payment Edge Function
`create-razorpay-order` lives in the Supabase project, not in this repository.
Until it applies Signature pricing itself, **Admin → Signature → “Take online
payment for Signature orders” must stay off**. While off, a cart containing
Signature pieces completes through the Signature concierge on WhatsApp, at
the same prices, with a payment link you send. Regular carts are unaffected
and pay online as before.

## What the checkout sends

Signature lines are ordinary items with two additions:

```json
{ "legacyId": "p018", "qty": 1, "price": 2997, "size": "A3+", "colour": "Gold",
  "signature": true,
  "customization": { "source": "signature", "signature": { "price": 2997, "regularPrice": 999, "custom": false } } }
```

and, when chosen, a top-level `"founderDelivery": { "fee": 5000, "slot": "Saturday · 11 am – 2 pm" }`.

## Add to `create-razorpay-order`

Never trust `price` from the browser. Compute it:

```ts
// 1. Load the published Signature settings.
const { data: file } = await admin.storage.from('product-images').download('site-config/signature.json');
const sig = file ? JSON.parse(await file.text()) : null;
const enabled = sig?.enabled !== false;
const multiplier = sig?.pricing?.enabled === false ? 1 : Number(sig?.pricing?.multiplier) || 3;
const itemCfg = Object.fromEntries((sig?.items || []).map((i) => [i.productId, i]));
const allowed = new Set((sig?.items || []).filter((i) => i.enabled !== false).map((i) => i.productId));

// 2. For each item, compute the regular unit price exactly as today
//    (frame_sizes.base_price or product_options.price_override), then:
if (item.signature) {
  if (!enabled || !allowed.has(item.legacyId)) throw new Error('This Signature piece is not available.');
  const custom = Number(itemCfg[item.legacyId]?.prices?.[sizeSlug]);   // admin-set price wins
  unitPrice = custom > 0 ? custom : regularUnitPrice * multiplier;   // once per line — never re-multiplied
}

// 3. Founder delivery: only if enabled, the cart has a Signature item and the
//    pincode is in the configured list (same rules as src/lib/signature.js).
if (body.founderDelivery) {
  const rules = String(sig.founder.pincodes).split(/[\s,;]+/).filter(Boolean)
    .map((x) => x.split('-').map(Number)).map(([a, b]) => [a, b ?? a]);
  const pin = Number(customer.pin);
  const ok = sig.founder.enabled !== false && items.some((i) => i.signature) && rules.some(([a, b]) => pin >= a && pin <= b);
  if (!ok) throw new Error('Founder delivery is not available for this address.');
  extras += Number(sig.founder.fee) || 0;            // from settings, never from the request
  orderNotes.founderDelivery = { fee: Number(sig.founder.fee), slot: String(body.founderDelivery.slot || '') };
}

// 4. Amount = Σ(unitPrice × qty) − coupon discount + extras. Store the
//    per-line unit price, `signature: true`, and founder details on the order.
```

After deploying, place one test order, then switch on online payment in the admin.
