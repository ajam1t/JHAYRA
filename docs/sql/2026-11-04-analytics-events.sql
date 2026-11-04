-- Lets the anonymous visit statistics record the extra funnel events the site
-- now sends (remove from bag, search, filters, wishlist, Gift Finder finished,
-- personalised design finished, WhatsApp clicks). Changes one access rule only.
begin;
drop policy if exists "visitors record events" on public.site_events;
create policy "visitors record events" on public.site_events for insert to anon, authenticated
  with check (
    char_length(coalesce(path, '')) <= 300 and char_length(coalesce(referrer, '')) <= 120
    and char_length(coalesce(visitor, '')) <= 40 and char_length(coalesce(country, '')) <= 2
    and char_length(coalesce(state, '')) <= 60 and char_length(coalesce(city, '')) <= 60
    and (name is null or name = any (array['product_view', 'add_to_cart', 'checkout_start', 'remove_from_cart', 'search', 'filter',
      'wishlist_add', 'gift_finder_complete', 'personalise_complete', 'whatsapp_click']))
  );
commit;
