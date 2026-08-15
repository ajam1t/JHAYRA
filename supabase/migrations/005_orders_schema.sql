-- JHAYRA Orders Schema
-- Run in Supabase SQL Editor after existing migrations

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
create table if not exists public.orders (
  id                  uuid primary key default uuid_generate_v4(),
  -- Customer (guest checkout — user_id optional)
  user_id             uuid references auth.users(id) on delete set null,
  customer_name       text not null,
  customer_email      text,
  customer_mobile     text not null,
  -- Delivery
  address             text not null,
  city                text not null,
  state               text,
  pin                 text not null,
  -- Pricing
  subtotal            numeric(10,2) not null,
  discount_amount     numeric(10,2) default 0,
  coupon_code         text,
  shipping            numeric(10,2) default 0,
  total_amount        numeric(10,2) not null,
  -- Razorpay
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  razorpay_signature  text,
  -- Payment
  payment_status      text not null default 'pending'
                        check (payment_status in ('pending','paid','failed','refunded')),
  payment_amount      numeric(10,2),
  currency            text default 'INR',
  paid_at             timestamptz,
  failure_reason      text,
  -- Order lifecycle
  order_status        text not null default 'pending'
                        check (order_status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_orders_razorpay_order_id on public.orders(razorpay_order_id);
create index if not exists idx_orders_payment_status    on public.orders(payment_status);
create index if not exists idx_orders_created_at        on public.orders(created_at desc);
create index if not exists idx_orders_customer_mobile   on public.orders(customer_mobile);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
create table if not exists public.order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  legacy_id    text,
  name         text not null,
  category     text,
  frame_size   text,
  frame_colour text,
  quantity     int not null default 1 check (quantity > 0),
  unit_price   numeric(10,2) not null,
  total_price  numeric(10,2) not null,
  created_at   timestamptz default now()
);

create index if not exists idx_order_items_order on public.order_items(order_id);

-- updated_at trigger
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
alter table public.orders     enable row level security;
alter table public.order_items enable row level security;

-- Admins can read/update all orders
create policy "admins_read_orders"
  on public.orders for select
  using (public.is_admin());

create policy "admins_update_orders"
  on public.orders for update
  using (public.is_admin());

-- Admins can read all order items
create policy "admins_read_order_items"
  on public.order_items for select
  using (public.is_admin());

-- Service role (Edge Functions) bypasses RLS automatically — no insert policy needed
-- for anon/authenticated frontend; all inserts go through Edge Functions.
