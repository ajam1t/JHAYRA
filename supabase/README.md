# Supabase Edge Functions

Source recovered from the deployed functions (30 Oct 2026) so it is now under
version control. `create-razorpay-order` here is the **corrected** version, not
yet deployed:

- Prices come from `frame_sizes` / `product_options.price_override` (was a
  hard-coded list missing A4 Gold/Brown, A3+ Gold/Brown and 18 × 24 Brown —
  those orders were rejected with "Invalid frame option").
- The chosen size and finish must be offered for that product.
- Signature items are refused online (concierge flow) until Signature pricing
  is implemented here.

Deploy (Supabase CLI): `supabase functions deploy create-razorpay-order --project-ref gwxdzemazqontjobqnyy`
