-- Gift Reveal: six more opening animations (bloom, balloons, teddy, locket,
-- butterfly, diya). Widens the allowed theme list; no data changes.
begin;
alter table public.gift_reveals drop constraint if exists gift_reveals_theme_check;
alter table public.gift_reveals add constraint gift_reveals_theme_check
  check (theme in ('envelope', 'box', 'night', 'bloom', 'balloons', 'teddy', 'locket', 'butterfly', 'diya'));
commit;
