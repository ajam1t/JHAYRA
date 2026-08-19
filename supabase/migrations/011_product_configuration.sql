-- JHAYRA — dynamic product configuration (#5/#6/#7)
-- ------------------------------------------------------------------------
-- Options are DATA, not code. Admin manages the global catalogs (materials,
-- colours, sizes) and enables a subset per product. New materials/colours/
-- sizes need no frontend changes. Artwork variants reuse product_images.
-- All additive — existing products/data are untouched and back-filled so
-- current behaviour is preserved.

/* ── Global option catalogs (admin-managed) ─────────────────────────────── */
create table if not exists public.frame_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.frame_colours (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  hex text not null,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.frame_sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  dimensions text,
  ratio_w numeric not null default 3,
  ratio_h numeric not null default 4,
  base_price numeric(10,2) not null default 499,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

/* ── Per-product enabled options ────────────────────────────────────────── */
-- One flat table: enable an option by inserting a row, disable by deleting it.
-- price_override applies to 'size' rows (null → frame_sizes.base_price).
create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_type text not null check (option_type in ('size','material','colour')),
  option_slug text not null,
  price_override numeric(10,2),
  is_default boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, option_type, option_slug)
);
create index if not exists product_options_pid_idx on public.product_options(product_id);

/* ── Product-level flags + artwork variants ─────────────────────────────── */
alter table public.products      add column if not exists customer_photo_eligible boolean not null default false;
-- Artwork variants reuse product_images (multiple rows, display_order, is_primary=default).
alter table public.product_images add column if not exists active boolean not null default true;
alter table public.product_images add column if not exists title  text;

/* ── updated_at triggers ────────────────────────────────────────────────── */
drop trigger if exists frame_materials_updated_at on public.frame_materials;
create trigger frame_materials_updated_at before update on public.frame_materials for each row execute procedure public.set_updated_at();
drop trigger if exists frame_colours_updated_at on public.frame_colours;
create trigger frame_colours_updated_at before update on public.frame_colours for each row execute procedure public.set_updated_at();
drop trigger if exists frame_sizes_updated_at on public.frame_sizes;
create trigger frame_sizes_updated_at before update on public.frame_sizes for each row execute procedure public.set_updated_at();

/* ── RLS: public reads active catalog + all product options; admins manage ─ */
alter table public.frame_materials enable row level security;
alter table public.frame_colours   enable row level security;
alter table public.frame_sizes     enable row level security;
alter table public.product_options enable row level security;

drop policy if exists "Public read active materials" on public.frame_materials;
create policy "Public read active materials" on public.frame_materials for select using (active = true);
drop policy if exists "Admins manage materials" on public.frame_materials;
create policy "Admins manage materials" on public.frame_materials for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read active colours" on public.frame_colours;
create policy "Public read active colours" on public.frame_colours for select using (active = true);
drop policy if exists "Admins manage colours" on public.frame_colours;
create policy "Admins manage colours" on public.frame_colours for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read active sizes" on public.frame_sizes;
create policy "Public read active sizes" on public.frame_sizes for select using (active = true);
drop policy if exists "Admins manage sizes" on public.frame_sizes;
create policy "Admins manage sizes" on public.frame_sizes for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read product options" on public.product_options;
create policy "Public read product options" on public.product_options for select using (true);
drop policy if exists "Admins manage product options" on public.product_options;
create policy "Admins manage product options" on public.product_options for all using (public.is_admin()) with check (public.is_admin());

/* ── Seed catalogs ──────────────────────────────────────────────────────── */
insert into public.frame_materials (name, slug, description, display_order) values
  ('PS Moulding',          'ps-moulding', 'Premium polystyrene moulding — the JHAYRA classic.', 1),
  ('Canvas / Gallery Wrap','canvas',      'Stretched canvas gallery wrap.',                     2),
  ('Solid Wood',           'solid-wood',  'Natural solid-wood frame.',                          3),
  ('Metal',                'metal',       'Slim aluminium/metal frame.',                        4)
on conflict (slug) do nothing;

insert into public.frame_colours (name, slug, hex, display_order) values
  ('Black',   'black',   '#1C1C1C', 1),
  ('Gold',    'gold',    '#B8932A', 2),
  ('Brown',   'brown',   '#6B4423', 3),
  ('Natural', 'natural', '#C8A47E', 4),
  ('White',   'white',   '#F5F5F5', 5),
  ('Silver',  'silver',  '#C0C0C0', 6)
on conflict (slug) do nothing;

insert into public.frame_sizes (name, slug, dimensions, ratio_w, ratio_h, base_price, display_order) values
  ('A4',      'a4',    '9.5 × 13 inches', 9.5, 13, 499,  1),
  ('A3+',     'a3plus','12 × 18 inches',  12,  18, 999,  2),
  ('18 × 24', '18x24', '18 × 24 inches',  18,  24, 1499, 3),
  ('24 × 36', '24x36', '24 × 36 inches',  24,  36, 2999, 4)
on conflict (slug) do nothing;

/* ── Back-fill: every active product gets the current default option set ──── */
-- Sizes: all four (A4 default). Preserves the existing 4-size choice + pricing.
insert into public.product_options (product_id, option_type, option_slug, is_default, display_order)
select p.id, 'size', s.slug, (s.slug = 'a4'), s.display_order
from public.products p cross join public.frame_sizes s
where p.active
on conflict (product_id, option_type, option_slug) do nothing;

-- Material: PS Moulding (current global default), set as default.
insert into public.product_options (product_id, option_type, option_slug, is_default, display_order)
select p.id, 'material', 'ps-moulding', true, 1
from public.products p where p.active
on conflict (product_id, option_type, option_slug) do nothing;

-- Colours: Black (default), Gold, Brown — the current global palette.
insert into public.product_options (product_id, option_type, option_slug, is_default, display_order)
select p.id, 'colour', c.slug, (c.slug = 'black'), c.display_order
from public.products p cross join public.frame_colours c
where p.active and c.slug in ('black','gold','brown')
on conflict (product_id, option_type, option_slug) do nothing;
