-- JHAYRA — admin-managed homepage "Explore Our Collections" tiles
-- One source of truth for the homepage collection/inspiration images. Admin
-- manages the records; the homepage reads the ACTIVE records ordered by
-- display_order. Images are stored in the existing public `product-images`
-- bucket under a `homepage-collections/` prefix (admin-write / public-read),
-- so no new bucket or storage policy is required.

create table if not exists public.homepage_collections (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  subtitle      text,                       -- small caption under the title (e.g. "120+ designs")
  image_url     text not null,              -- public URL used by the homepage
  storage_path  text,                       -- path inside product-images bucket (null for legacy /Images assets)
  link          text,                       -- internal route ("/shop?category=nature") or external URL
  alt_text      text,
  display_order int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists homepage_collections_order_idx  on public.homepage_collections(display_order);
create index if not exists homepage_collections_active_idx on public.homepage_collections(active);

drop trigger if exists homepage_collections_updated_at on public.homepage_collections;
create trigger homepage_collections_updated_at
  before update on public.homepage_collections
  for each row execute procedure public.set_updated_at();

-- RLS: public reads only ACTIVE tiles; only admins can manage.
alter table public.homepage_collections enable row level security;

drop policy if exists "Public can read active homepage collections" on public.homepage_collections;
create policy "Public can read active homepage collections"
  on public.homepage_collections for select
  using (active = true);

drop policy if exists "Admins can manage homepage collections" on public.homepage_collections;
create policy "Admins can manage homepage collections"
  on public.homepage_collections for all
  using (public.is_admin()) with check (public.is_admin());

-- Seed the six current homepage tiles so the section is immediately Admin-managed
-- with the existing content (only if the table is still empty). image_url points
-- at the current /Images assets; the admin can replace them from the panel.
insert into public.homepage_collections (title, subtitle, image_url, link, alt_text, display_order, active)
select v.title, v.subtitle, v.image_url, v.link, v.alt_text, v.display_order, true
from (values
  ('Personalized',     '120+ designs',            '/Images/personalized.jpg', '/shop?category=personalized',   'Personalized photo frames and gifts', 1),
  ('Religious',        'Ganesha, Shiv Ji & more', '/Images/religious.jpg',    '/shop?category=religious',      'Religious and spiritual wall art',    2),
  ('7 Running Horses', 'Vastu approved',          '/Images/horses.jpg',       '/shop?category=running-horses', '7 running horses vastu painting',     3),
  ('Nature',           'Calming scenes',          '/Images/nature.jpg',       '/shop?category=nature',         'Nature inspired wall art',            4),
  ('Modern Art',       'Contemporary',            '/Images/modern.jpg',       '/shop?category=modern-art',     'Modern contemporary wall art',        5),
  ('Canvas Prints',    'Gallery quality',         '/Images/canvas.jpg',       '/shop?category=canvas',         'Gallery quality canvas prints',       6)
) as v(title, subtitle, image_url, link, alt_text, display_order)
where not exists (select 1 from public.homepage_collections);
