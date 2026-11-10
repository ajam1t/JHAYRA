-- JHAYRA Gift Reveal — a private digital unboxing a sender creates for a recipient.
--
-- Privacy model: names, message, photos and media are encrypted in the sender's
-- browser (AES-GCM). The key lives only in the reveal link, after the "#", and
-- is never sent to the server. This table and the bucket hold ciphertext only.
-- The server controls availability: expiry, the sender's off switch and deletion.
--
-- Additive only: one new table, three functions, one bucket, two storage rules.

begin;

create table if not exists public.gift_reveals (
  id text primary key,                       -- unguessable: 128 random bits, hex
  payload text not null,                     -- encrypted JSON (base64)
  media text[] not null default '{}',        -- encrypted file names in the gift-reveals bucket
  manage_hash text not null,                 -- sha256 of the sender's manage secret
  expires_at timestamptz not null,
  revoked boolean not null default false,    -- sender's off switch
  deleted_at timestamptz,
  views integer not null default 0,
  first_opened_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists gift_reveals_created_idx on public.gift_reveals (created_at);
create index if not exists gift_reveals_media_idx on public.gift_reveals using gin (media);

-- No direct access for anyone: everything goes through the functions below.
alter table public.gift_reveals enable row level security;
revoke all on public.gift_reveals from anon, authenticated;

-- Create a reveal. Returns its id.
create or replace function public.create_gift_reveal(p_payload text, p_media text[], p_manage_secret text, p_days integer)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_id text := encode(extensions.gen_random_bytes(16), 'hex');
  m text;
begin
  if p_payload is null or length(p_payload) < 40 or length(p_payload) > 60000 then raise exception 'invalid payload'; end if;
  if p_manage_secret is null or length(p_manage_secret) < 20 or length(p_manage_secret) > 200 then raise exception 'invalid secret'; end if;
  if p_days not in (7, 30, 90) then raise exception 'invalid expiry'; end if;
  if coalesce(array_length(p_media, 1), 0) > 6 then raise exception 'too many files'; end if;
  foreach m in array coalesce(p_media, '{}') loop
    if m !~ '^[a-f0-9]{32}\.bin$' then raise exception 'invalid file name'; end if;
  end loop;
  -- A simple brake on abuse: at most 300 reveals an hour, site-wide.
  if (select count(*) from gift_reveals where created_at > now() - interval '1 hour') >= 300 then raise exception 'busy, please try again later'; end if;
  insert into gift_reveals (id, payload, media, manage_hash, expires_at)
  values (v_id, p_payload, coalesce(p_media, '{}'), encode(sha256(convert_to(p_manage_secret, 'utf8')), 'hex'), now() + make_interval(days => p_days));
  return v_id;
end;
$$;

-- Open a reveal (recipient). Returns the encrypted payload while it is available.
create or replace function public.open_gift_reveal(p_id text, p_count boolean default true)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare r gift_reveals;
begin
  select * into r from gift_reveals where id = p_id;
  if not found or r.deleted_at is not null then return jsonb_build_object('status', 'not_found'); end if;
  if r.revoked then return jsonb_build_object('status', 'off'); end if;
  if r.expires_at < now() then return jsonb_build_object('status', 'expired'); end if;
  if p_count then
    update gift_reveals set views = views + 1, first_opened_at = coalesce(first_opened_at, now()) where id = p_id;
  end if;
  return jsonb_build_object('status', 'ok', 'payload', r.payload, 'media', to_jsonb(r.media), 'expires_at', r.expires_at);
end;
$$;

-- Sender controls: status, turn off / on, change expiry, delete. Needs the manage secret.
create or replace function public.manage_gift_reveal(p_id text, p_manage_secret text, p_action text, p_days integer default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare r gift_reveals;
begin
  select * into r from gift_reveals where id = p_id and manage_hash = encode(sha256(convert_to(coalesce(p_manage_secret, ''), 'utf8')), 'hex');
  if not found or r.deleted_at is not null then return jsonb_build_object('status', 'not_found'); end if;
  if p_action = 'off' then update gift_reveals set revoked = true where id = p_id;
  elsif p_action = 'on' then update gift_reveals set revoked = false where id = p_id;
  elsif p_action = 'extend' then
    if p_days not in (7, 30, 90) then raise exception 'invalid expiry'; end if;
    update gift_reveals set expires_at = now() + make_interval(days => p_days) where id = p_id;
  elsif p_action = 'delete' then
    -- The message is erased now; the encrypted files become unreadable at once
    -- (see the storage rule) and are removed by clean-up.
    update gift_reveals set deleted_at = now(), revoked = true, payload = '' where id = p_id;
    return jsonb_build_object('status', 'deleted');
  elsif p_action <> 'status' then raise exception 'unknown action';
  end if;
  select * into r from gift_reveals where id = p_id;
  return jsonb_build_object('status', 'ok', 'revoked', r.revoked, 'expires_at', r.expires_at, 'expired', r.expires_at < now(), 'views', r.views, 'first_opened_at', r.first_opened_at);
end;
$$;

revoke all on function public.create_gift_reveal(text, text[], text, integer) from public;
revoke all on function public.open_gift_reveal(text, boolean) from public;
revoke all on function public.manage_gift_reveal(text, text, text, integer) from public;
grant execute on function public.create_gift_reveal(text, text[], text, integer) to anon, authenticated;
grant execute on function public.open_gift_reveal(text, boolean) to anon, authenticated;
grant execute on function public.manage_gift_reveal(text, text, text, integer) to anon, authenticated;

-- Is this encrypted file part of a reveal that is still available?
create or replace function public.gift_media_readable(p_name text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from gift_reveals where media @> array[p_name] and not revoked and deleted_at is null and expires_at > now());
$$;
revoke all on function public.gift_media_readable(text) from public;
grant execute on function public.gift_media_readable(text) to anon, authenticated;

-- Private bucket for the encrypted files (opaque bytes, up to 25 MB each).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gift-reveals', 'gift-reveals', false, 26214400, array['application/octet-stream'])
on conflict (id) do nothing;

drop policy if exists "anyone can add encrypted gift media" on storage.objects;
create policy "anyone can add encrypted gift media" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'gift-reveals' and name ~ '^[a-f0-9]{32}\.bin$');

drop policy if exists "gift media readable while the reveal is active" on storage.objects;
create policy "gift media readable while the reveal is active" on storage.objects for select to anon, authenticated
  using (bucket_id = 'gift-reveals' and public.gift_media_readable(name));

commit;
