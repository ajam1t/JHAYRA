-- Admin sign-in with a mobile number + the account's existing password.
-- Numbers are mapped to an admin account here; the website asks
-- admin_login_email() for the account's sign-in email and then signs in
-- normally (Supabase checks the password). Rows can't be read directly.
create table if not exists public.admin_login_ids (
  phone text primary key check (phone ~ '^[6-9][0-9]{9}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_login_ids enable row level security;
revoke all on public.admin_login_ids from anon, authenticated;

create or replace function public.admin_login_email(p_phone text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.admin_login_ids a
  join auth.users u on u.id = a.user_id
  join public.profiles p on p.id = u.id and p.role = 'admin'
  where a.phone = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
  limit 1;
$$;
revoke all on function public.admin_login_email(text) from public;
grant execute on function public.admin_login_email(text) to anon, authenticated;
