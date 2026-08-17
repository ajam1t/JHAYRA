-- JHAYRA — customer artwork capture
-- Personalised customer photos are private, one-off content. They are stored in a
-- PRIVATE bucket (no public read); only admins (and the service role) can read them.
-- Applied to production 2026-08-18.

-- Private bucket with a 15MB per-file cap and image-only mime allow-list.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-artwork', 'customer-artwork', false, 15728640,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update
  set public = false,
      file_size_limit = 15728640,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif'];

-- Guests (anon) may upload their photo at checkout; nobody but admins can read it.
drop policy if exists "anon upload customer artwork" on storage.objects;
create policy "anon upload customer artwork"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'customer-artwork');

drop policy if exists "admins read customer artwork" on storage.objects;
create policy "admins read customer artwork"
  on storage.objects for select
  using (bucket_id = 'customer-artwork' and public.is_admin());

-- Order items carry the storage paths of the uploaded photos + a customization blob
-- (template, personalisation text, orientation, crop transforms) for reproduction.
alter table public.order_items add column if not exists artwork_paths text[];
alter table public.order_items add column if not exists customization  jsonb;
