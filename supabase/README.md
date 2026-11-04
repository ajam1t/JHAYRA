# Supabase Edge Functions

Source recovered from the deployed functions (30 Oct 2026) and kept under
version control. Deployed versions as of 4 Nov 2026 match this source **except
the hardening below, which is committed but not yet deployed**:

- `verify-razorpay-payment` — looks the order up (id + Razorpay order) before
  writing anything, so a forged request can no longer mark another order as
  failed; never downgrades a paid order; confirms the payment with Razorpay's
  API (same order, captured/authorised, full amount) before marking it paid.
- `razorpay-webhook` — refuses to mark an order paid when the captured amount
  is below the order total (flagged for review instead); also accepts
  `order.paid`; a late `payment.failed` never touches a paid order.
- `create-razorpay-order` — accepts only genuine customer-upload paths for
  photos (never `masters/…` or other bucket paths), caps the personalisation
  payload, and refuses founder delivery (concierge-only) so it can never be
  under-charged.

Tests: `npm test` runs `tests/edge.test.mjs` against this source with an
in-memory database and a fake Razorpay. Before deploying, place one Razorpay
**test-mode** payment end to end.

Deploy (Supabase CLI): `supabase functions deploy create-razorpay-order --project-ref gwxdzemazqontjobqnyy`
