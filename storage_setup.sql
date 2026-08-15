-- JHAYRA Supabase Storage Setup
-- Run this in the Supabase SQL Editor AFTER creating the bucket via Dashboard
-- OR use the Supabase Dashboard to create the bucket manually (Storage → New Bucket)
-- Bucket name: product-images | Public: true

-- If using SQL to create the bucket:
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Storage RLS policies
-- Anyone can view images
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only admins can upload/update/delete images
create policy "Admins can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and public.is_admin()
  );

create policy "Admins can update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and public.is_admin()
  );

create policy "Admins can delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and public.is_admin()
  );
