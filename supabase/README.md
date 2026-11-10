# Supabase Edge Functions

Source recovered from the deployed functions (30 Oct 2026) and kept under
version control. **Deployed on 10 Nov 2026** (create-razorpay-order v12,
verify-razorpay-payment v5, razorpay-webhook v5) — the deployed code matches
this source, including the hardening:

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

Checked after deploying with requests that create nothing: a forged verify →
404, an unsigned webhook → 401, a print-file path or founder delivery at order
creation → 400, order count unchanged. A real payment has not been tested from
here (no test-mode keys) — place one small order to confirm end to end.

Tests: `npm test` runs `tests/edge.test.mjs` against this source with an
in-memory database and a fake Razorpay. 

Deploy (Supabase CLI): `supabase functions deploy create-razorpay-order --project-ref gwxdzemazqontjobqnyy`
