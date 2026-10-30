-- JHAYRA — order tracking, coupon manager and sales funnel (30 Oct 2026).
-- Additive only: new columns, a new table and new functions. Safe to run again.

-- ── 2. Order tracking ───────────────────────────────────────────────────
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists shipped_at timestamptz;

-- Customers look up their own order with its number + the mobile used to
-- place it. Returns only what the tracking page shows — no address, email
-- or payment details.
create or replace function public.track_order(p_order text, p_mobile text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'placed_at', o.created_at,
    'payment_status', o.payment_status,
    'order_status', o.order_status,
    'courier', o.courier,
    'tracking_number', o.tracking_number,
    'tracking_url', o.tracking_url,
    'shipped_at', o.shipped_at,
    'city', o.city,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'qty', i.quantity, 'size', i.frame_size, 'colour', i.frame_colour)) from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where upper(trim(o.order_number)) = upper(trim(p_order))
    and right(regexp_replace(coalesce(o.customer_mobile, ''), '\D', '', 'g'), 10) = right(regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g'), 10)
    and length(regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g')) >= 10
  limit 1;
$$;
revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- ── 3. Coupon manager ───────────────────────────────────────────────────
create table if not exists public.coupons (
  code text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  percent int not null check (percent between 1 and 90),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;
drop policy if exists "admins manage coupons" on public.coupons;
create policy "admins manage coupons" on public.coupons for all to authenticated using (is_admin()) with check (is_admin());
-- The two codes the payment function already honoured.
insert into public.coupons (code, percent, note) values ('JHAYRA10', 10, 'Existing code'), ('JHAYRA15', 15, 'Existing code')
on conflict (code) do nothing;

-- ── 6. Sales funnel ─────────────────────────────────────────────────────
alter table public.site_events add column if not exists name text;
alter table public.site_events drop constraint if exists site_events_kind_check;
alter table public.site_events add constraint site_events_kind_check check (kind in ('view', 'vitals', 'event'));
drop policy if exists "visitors record events" on public.site_events;
create policy "visitors record events" on public.site_events for insert to anon, authenticated
  with check (
    char_length(coalesce(path, '')) <= 300 and char_length(coalesce(referrer, '')) <= 120 and char_length(coalesce(visitor, '')) <= 40
    and char_length(coalesce(country, '')) <= 2 and char_length(coalesce(state, '')) <= 60 and char_length(coalesce(city, '')) <= 60
    and (name is null or name in ('product_view', 'add_to_cart', 'checkout_start'))
  );

-- Sessions reaching each step, plus paid orders, for a date range.
create or replace function public.site_funnel(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admins only';
  end if;
  return jsonb_build_object(
    'sessions', (select count(distinct session) from site_events where kind = 'view' and created_at >= p_from and created_at < p_to),
    'product_view', (select count(distinct session) from site_events where name = 'product_view' and created_at >= p_from and created_at < p_to),
    'add_to_cart', (select count(distinct session) from site_events where name = 'add_to_cart' and created_at >= p_from and created_at < p_to),
    'checkout_start', (select count(distinct session) from site_events where name = 'checkout_start' and created_at >= p_from and created_at < p_to),
    'paid', (select count(*) from orders where payment_status = 'paid' and created_at >= p_from and created_at < p_to)
  );
end;
$$;
revoke all on function public.site_funnel(timestamptz, timestamptz) from public;
grant execute on function public.site_funnel(timestamptz, timestamptz) to authenticated;

notify pgrst, 'reload schema';
