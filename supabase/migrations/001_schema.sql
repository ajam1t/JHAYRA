-- JHAYRA Database Schema
-- Run in Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (admin role management)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────
create table if not exists public.categories (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  name         text not null,
  description  text,
  image_url    text,
  display_order int default 0,
  active       boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────
create table if not exists public.products (
  id               uuid primary key default uuid_generate_v4(),
  legacy_id        text unique,           -- e.g. "p001" for URL backward-compat
  name             text not null,
  slug             text unique,
  description      text,
  category_slug    text references public.categories(slug) on update cascade,
  price            numeric(10,2) not null default 499,
  compare_price    numeric(10,2),
  tags             text[] default '{}',
  rating           numeric(3,1) default 4.5,
  review_count     int default 0,
  is_bestseller    boolean default false,
  is_new_arrival   boolean default false,
  homepage_visible boolean default false,  -- controls homepage display
  display_order    int default 0,
  active           boolean default true,   -- soft-delete / inactive hides from storefront
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Full-text search index on products
create index if not exists idx_products_search
  on public.products using gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

create index if not exists idx_products_category on public.products(category_slug);
create index if not exists idx_products_active    on public.products(active);
create index if not exists idx_products_homepage  on public.products(homepage_visible);
create index if not exists idx_products_order     on public.products(display_order);

-- ─────────────────────────────────────────────
-- PRODUCT IMAGES
-- ─────────────────────────────────────────────
create table if not exists public.product_images (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid not null references public.products(id) on delete cascade,
  storage_path  text not null,   -- path inside Supabase Storage bucket
  url           text,            -- public URL (can be computed)
  alt_text      text,
  display_order int default 0,
  is_primary    boolean default false,
  created_at    timestamptz default now()
);

create index if not exists idx_product_images_product on public.product_images(product_id);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at  before update on public.profiles  for each row execute procedure public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute procedure public.set_updated_at();
create trigger products_updated_at  before update on public.products  for each row execute procedure public.set_updated_at();
