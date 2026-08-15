-- Fix order_status CHECK constraint — add 'personalization' status
-- AdminOrders.jsx includes 'personalization' as a valid status option,
-- but the original constraint in 005_orders_schema.sql omitted it.
-- Without this fix, any admin attempt to set order_status='personalization'
-- silently fails at the database level (check constraint violation).

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN (
    'pending',
    'confirmed',
    'personalization',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ));
