-- JHAYRA — finishing steps. Supabase → SQL Editor → New query → paste → Run.
-- Safe to run more than once. Nothing here reads or changes orders, customers
-- or products.

-- 1. Customer uploads: images only, 15 MB maximum.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    file_size_limit = 15728640
where id = 'customer-artwork';

-- 2. Review (read-only): who may write to each table. Every row that shows
--    INSERT / UPDATE / DELETE / ALL for the roles {anon} or {public} on
--    products, categories, frame_*, product_options, product_images,
--    homepage_collections, orders, order_items or profiles should be removed —
--    send a screenshot of this result if you're unsure.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- 3. Review (read-only): storage write rules.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd;

-- 4. Visitor stats: open Admin → Dashboard → "Copy setup script" and run that
--    as a separate query (docs/sql/analytics.sql).
