-- Visitor location (approximate country / Indian state / city from the edge;
-- no IP addresses are stored) and an admin-only report. Safe to run again.
alter table public.site_events add column if not exists country text;
alter table public.site_events add column if not exists state text;
alter table public.site_events add column if not exists city text;

drop policy if exists "visitors record events" on public.site_events;
create policy "visitors record events" on public.site_events for insert to anon, authenticated
  with check (
    char_length(coalesce(path, '')) <= 300 and char_length(coalesce(referrer, '')) <= 120 and char_length(coalesce(visitor, '')) <= 40
    and char_length(coalesce(country, '')) <= 2 and char_length(coalesce(state, '')) <= 60 and char_length(coalesce(city, '')) <= 60
  );

-- Visitors by state, with the top cities in each, for a date range.
create or replace function public.site_geo(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r jsonb;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admins only';
  end if;
  with v as (
    select visitor, coalesce(nullif(state, ''), 'Unknown') as state, nullif(city, '') as city
    from site_events
    where kind = 'view' and created_at >= p_from and created_at < p_to
  )
  select coalesce(jsonb_agg(s order by s.visitors desc), '[]'::jsonb) into r
  from (
    select v.state, count(distinct v.visitor) as visitors,
      coalesce((select jsonb_agg(c order by c.visitors desc) from (
        select v2.city, count(distinct v2.visitor) as visitors from v v2
        where v2.state = v.state and v2.city is not null group by v2.city order by 2 desc limit 8) c), '[]'::jsonb) as cities
    from v group by v.state order by 2 desc limit 40
  ) s;
  return r;
end;
$$;
revoke all on function public.site_geo(timestamptz, timestamptz) from public;
grant execute on function public.site_geo(timestamptz, timestamptz) to authenticated;
notify pgrst, 'reload schema';
