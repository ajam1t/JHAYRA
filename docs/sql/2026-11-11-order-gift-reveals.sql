-- JHAYRA Gift Reveal, order-based edition. Replaces 2026-11-10-gift-reveals.sql
-- (the standalone version; its only row was a deleted test reveal).
--
-- Rules enforced here, in the database:
--   * one reveal per order          -> unique (order_id)
--   * nobody reads reveals directly -> RLS on, admins may read; customers and
--     recipients go through the gift-reveal Edge Function (service role)
--   * a reveal closes with the order -> trigger keeps closed_reason in step with
--     the real order status (delivered / cancelled / refunded); the Edge
--     Function also checks the live status on every open
--   * order details never travel in a URL -> links carry a random token only;
--     media live in a random folder, not under the order id
--
-- Additive for orders: no column of orders or order_items is changed.

begin;

-- the standalone version
drop function if exists public.create_gift_reveal(text, text[], text, integer);
drop function if exists public.open_gift_reveal(text, boolean);
drop function if exists public.manage_gift_reveal(text, text, text, integer);
drop policy if exists "anyone can add encrypted gift media" on storage.objects;
drop policy if exists "gift media readable while the reveal is active" on storage.objects;
drop function if exists public.gift_media_readable(text);
drop table if exists public.gift_reveals;

create table public.gift_reveals (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{43}$'),
  media_folder text not null check (media_folder ~ '^[a-f0-9]{32}$'),
  recipient_name text not null check (char_length(recipient_name) between 1 and 40),
  sender_name text not null check (char_length(sender_name) between 1 and 40),
  occasion text not null check (char_length(occasion) <= 40),
  message text not null default '' check (char_length(message) <= 600),
  theme text not null check (theme in ('envelope', 'box', 'night')),
  sound boolean not null default true,
  photos text[] not null default '{}' check (coalesce(array_length(photos, 1), 0) <= 4),
  clip_path text,
  clip_kind text check (clip_kind in ('video', 'voice')),
  clip_mime text,
  publish_at timestamptz not null default now(),
  views integer not null default 0,
  first_opened_at timestamptz,
  closed_reason text check (closed_reason in ('delivered', 'cancelled', 'refunded')),
  closed_at timestamptz,
  edit_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gift_reveals enable row level security;
revoke all on public.gift_reveals from anon, authenticated;
grant select on public.gift_reveals to authenticated;
create policy "admins read gift reveals" on public.gift_reveals for select to authenticated using (public.is_admin());

-- Close (or reopen, if an admin corrects a status) a reveal with its order.
create or replace function public.sync_gift_reveal_with_order()
returns trigger language plpgsql security definer set search_path = public as $$
declare reason text;
begin
  reason := case
    when new.payment_status = 'refunded' then 'refunded'
    when new.order_status = 'cancelled' then 'cancelled'
    when new.order_status = 'delivered' then 'delivered'
    else null end;
  update gift_reveals
     set closed_reason = reason,
         closed_at = case when reason is null then null else coalesce(closed_at, now()) end
   where order_id = new.id and closed_reason is distinct from reason;
  return new;
end;
$$;
drop trigger if exists gift_reveal_follows_order on public.orders;
create trigger gift_reveal_follows_order after update of order_status, payment_status on public.orders
  for each row execute function public.sync_gift_reveal_with_order();

-- Order-lookup attempts, so order number + mobile can't be guessed by brute force.
create table if not exists public.gift_reveal_attempts (
  id bigserial primary key,
  order_number text not null,
  ip text,
  ok boolean not null,
  at timestamptz not null default now()
);
create index if not exists gift_reveal_attempts_num_idx on public.gift_reveal_attempts (order_number, at);
create index if not exists gift_reveal_attempts_ip_idx on public.gift_reveal_attempts (ip, at);
alter table public.gift_reveal_attempts enable row level security;
revoke all on public.gift_reveal_attempts from anon, authenticated;

-- Media: private bucket; uploads only through signed upload URLs that the Edge
-- Function issues to a verified order owner; reads through short-lived signed
-- URLs while the reveal is valid. Admins may read for support.
update storage.buckets
   set public = false,
       file_size_limit = 26214400,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp',
         'video/mp4', 'video/quicktime', 'video/webm',
         'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/aac']
 where id = 'gift-reveals';
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'gift-reveals', 'gift-reveals', false, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/aac']
where not exists (select 1 from storage.buckets where id = 'gift-reveals');
drop policy if exists "admins read gift reveal media" on storage.objects;
create policy "admins read gift reveal media" on storage.objects for select to authenticated
  using (bucket_id = 'gift-reveals' and public.is_admin());

commit;
