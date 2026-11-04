-- Only admins may write HD print files (customer-artwork/masters/...).
-- Customers keep uploading their photos everywhere else in the bucket.
-- Run in the Supabase SQL editor. Changes access rules only; no data is touched.
begin;
drop policy if exists "anon upload customer artwork" on storage.objects;
create policy "anon upload customer artwork" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'customer-artwork' and coalesce((storage.foldername(name))[1], '') <> 'masters');
drop policy if exists "admins upload print masters" on storage.objects;
create policy "admins upload print masters" on storage.objects for insert to authenticated
  with check (bucket_id = 'customer-artwork' and (storage.foldername(name))[1] = 'masters' and public.is_admin());
commit;
