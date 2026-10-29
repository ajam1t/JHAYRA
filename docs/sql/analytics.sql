-- JHAYRA visitor & speed analytics: run once in Supabase → SQL Editor.
-- Stores anonymous page views and real-visitor page-speed timings. No names,
-- emails or IP addresses: just the page, a random browser ID, device type and
-- the referring website. Safe to run again.

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null default 'view' check (kind in ('view', 'vitals')),
  path text,
  visitor text,
  session text,
  is_new boolean default false,
  entry boolean default false,
  referrer text,
  device text,
  lcp real,
  inp real,
  cls real,
  fcp real,
  ttfb real
);
create index if not exists site_events_created_idx on public.site_events (created_at);

alter table public.site_events enable row level security;

drop policy if exists "visitors record events" on public.site_events;
create policy "visitors record events" on public.site_events for insert to anon, authenticated
  with check (char_length(coalesce(path, '')) <= 300 and char_length(coalesce(referrer, '')) <= 120 and char_length(coalesce(visitor, '')) <= 40);

drop policy if exists "admins read events" on public.site_events;
create policy "admins read events" on public.site_events for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins delete events" on public.site_events;
create policy "admins delete events" on public.site_events for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

grant insert on public.site_events to anon, authenticated;
grant select, delete on public.site_events to authenticated;

-- One call returns everything the dashboard needs for a date range (India time).
create or replace function public.site_stats(p_from timestamptz, p_to timestamptz)
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
    select * from site_events where created_at >= p_from and created_at < p_to
  ), pv as (
    select * from v where kind = 'view'
  )
  select jsonb_build_object(
    'views', (select count(*) from pv),
    'visitors', (select count(distinct visitor) from pv),
    'new_visitors', (select count(distinct visitor) from pv where is_new),
    'sessions', (select count(distinct session) from pv),
    'bounce_sessions', (select count(*) from (select session from pv group by session having count(*) = 1) b),
    'daily', coalesce((select jsonb_agg(d order by d.day) from (
        select (created_at at time zone 'Asia/Kolkata')::date as day, count(*) as views, count(distinct visitor) as visitors
        from pv group by 1) d), '[]'::jsonb),
    'hours', coalesce((select jsonb_agg(h order by h.hour) from (
        select extract(hour from created_at at time zone 'Asia/Kolkata')::int as hour, count(*) as views
        from pv group by 1) h), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(p) from (
        select path, count(*) as views, count(distinct visitor) as visitors
        from pv group by path order by 2 desc limit 12) p), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(s) from (
        select coalesce(nullif(referrer, ''), 'Direct') as source, count(*) as sessions
        from pv where entry group by 1 order by 2 desc limit 10) s), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(d) from (
        select coalesce(device, 'unknown') as device, count(distinct visitor) as visitors
        from pv group by 1 order by 2 desc) d), '[]'::jsonb),
    'vitals', coalesce((select jsonb_agg(x) from (
        select coalesce(device, 'all') as device, count(*) as samples,
          percentile_cont(0.75) within group (order by lcp) as lcp,
          percentile_cont(0.75) within group (order by inp) as inp,
          percentile_cont(0.75) within group (order by cls) as cls,
          percentile_cont(0.75) within group (order by fcp) as fcp,
          percentile_cont(0.75) within group (order by ttfb) as ttfb
        from v where kind = 'vitals' group by rollup (device)) x), '[]'::jsonb),
    'slow_pages', coalesce((select jsonb_agg(sp) from (
        select path, count(*) as samples, percentile_cont(0.75) within group (order by lcp) as lcp
        from v where kind = 'vitals' and lcp is not null group by path having count(*) >= 3 order by 3 desc limit 6) sp), '[]'::jsonb),
    'live', (select count(distinct visitor) from site_events where kind = 'view' and created_at > now() - interval '5 minutes')
  ) into r;
  return r;
end;
$$;

revoke all on function public.site_stats(timestamptz, timestamptz) from public, anon;
grant execute on function public.site_stats(timestamptz, timestamptz) to authenticated;
