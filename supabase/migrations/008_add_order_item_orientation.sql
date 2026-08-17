-- JHAYRA — capture frame orientation on order items
-- Additive, backward-compatible. Existing rows get NULL (unknown orientation).
-- The customer's Vertical/Horizontal choice is captured in the cart but was
-- previously dropped at checkout; this column lets it reach the fulfilment team.

alter table public.order_items
  add column if not exists frame_orientation text;
