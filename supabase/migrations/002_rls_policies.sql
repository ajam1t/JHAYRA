-- JHAYRA Row Level Security Policies
-- Run AFTER 001_schema.sql

-- ─────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;

-- ─────────────────────────────────────────────
-- Helper: is the current user an admin?
-- ─────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────
-- PROFILES policies
-- ─────────────────────────────────────────────
drop policy if exists "Users can read own profile"  on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update profiles"   on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

-- ─────────────────────────────────────────────
-- CATEGORIES policies
-- ─────────────────────────────────────────────
drop policy if exists "Public can read active categories" on public.categories;
drop policy if exists "Admins can manage categories"      on public.categories;

create policy "Public can read active categories"
  on public.categories for select
  using (active = true);

create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────
-- PRODUCTS policies
-- ─────────────────────────────────────────────
drop policy if exists "Public can read active products"  on public.products;
drop policy if exists "Admins can manage products"       on public.products;

create policy "Public can read active products"
  on public.products for select
  using (active = true);

create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────
-- PRODUCT IMAGES policies
-- ─────────────────────────────────────────────
drop policy if exists "Public can read images of active products" on public.product_images;
drop policy if exists "Admins can manage product images"          on public.product_images;

create policy "Public can read images of active products"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.active = true
    )
  );

create policy "Admins can manage product images"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());
