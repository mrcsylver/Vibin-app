-- =============================================================================
-- Vibin / LocalVibe — Supabase schema (PostgreSQL + PostGIS)
-- Paste this entire file into the Supabase SQL Editor and run it once.
-- =============================================================================

create extension if not exists postgis;

do $$
begin
  execute 'create extension if not exists pg_cron';
exception
  when others then
    raise notice 'Could not create pg_cron (enable it in Database → Extensions). Trigger-based expiry still works.';
end;
$$;

-- -----------------------------------------------------------------------------
-- Ephemeral presence. Rows are dropped after 15 minutes of inactivity.
-- spotify_id is a SHA-256 hash computed on-device — not the raw Spotify user id.
-- -----------------------------------------------------------------------------
create table if not exists public.active_users (
  id uuid primary key default gen_random_uuid(),
  spotify_id text not null unique,
  username text not null,
  avatar_url text not null,
  status text not null default '',
  track_title text,
  track_artist text,
  album_art_url text,
  album_color text,
  location geography(Point, 4326) not null,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists active_users_location_gix
  on public.active_users using gist (location);

create index if not exists active_users_last_seen_idx
  on public.active_users (last_seen_at);

-- -----------------------------------------------------------------------------
-- Nudge / like events. Realtime subscription delivers these to the receiver.
-- -----------------------------------------------------------------------------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_spotify_id text not null,
  to_spotify_id text not null,
  distance_ft integer not null check (distance_ft >= 0),
  created_at timestamptz not null default now()
);

create index if not exists likes_to_created_idx
  on public.likes (to_spotify_id, created_at desc);

alter table public.likes replica identity full;

-- -----------------------------------------------------------------------------
-- 15-minute expiry (used by both the write trigger and pg_cron)
-- -----------------------------------------------------------------------------
create or replace function public.expire_stale_presence()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.active_users
  where last_seen_at < now() - interval '15 minutes';

  delete from public.likes
  where created_at < now() - interval '15 minutes';
$$;

-- Statement-level trigger: every presence write also sweeps stale rows.
create or replace function public.trg_expire_stale_presence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.expire_stale_presence();
  return null;
end;
$$;

drop trigger if exists active_users_expire_stale on public.active_users;
create trigger active_users_expire_stale
  after insert or update on public.active_users
  for each statement
  execute function public.trg_expire_stale_presence();

-- Minute cron as a safety net if the app goes quiet and no writes arrive.
do $$
declare
  jid bigint;
begin
  for jid in select jobid from cron.job where jobname = 'expire-stale-presence' loop
    perform cron.unschedule(jid);
  end loop;

  perform cron.schedule(
    'expire-stale-presence',
    '* * * * *',
    $cron$select public.expire_stale_presence();$cron$
  );
exception
  when undefined_function then
    raise notice 'pg_cron is not enabled. The write trigger still expires rows after 15 minutes.';
  when undefined_table then
    raise notice 'pg_cron catalog missing. Enable the extension, then re-run the cron statements.';
end;
$$;

-- -----------------------------------------------------------------------------
-- RPCs — the only way the anon key can touch data (tables stay locked by RLS).
-- Coordinates of other users are never returned; only distance + bearing.
-- -----------------------------------------------------------------------------
create or replace function public.upsert_presence(
  p_spotify_id text,
  p_username text,
  p_avatar_url text,
  p_status text,
  p_track_title text,
  p_track_artist text,
  p_album_art_url text,
  p_album_color text,
  p_lat double precision,
  p_lng double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_spotify_id is null or length(p_spotify_id) < 16 then
    raise exception 'invalid presence id';
  end if;

  insert into public.active_users (
    spotify_id,
    username,
    avatar_url,
    status,
    track_title,
    track_artist,
    album_art_url,
    album_color,
    location,
    last_seen_at,
    updated_at
  )
  values (
    p_spotify_id,
    left(coalesce(p_username, 'anon'), 24),
    coalesce(p_avatar_url, ''),
    left(coalesce(p_status, ''), 80),
    p_track_title,
    p_track_artist,
    p_album_art_url,
    p_album_color,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    now(),
    now()
  )
  on conflict (spotify_id) do update set
    username = excluded.username,
    avatar_url = excluded.avatar_url,
    status = excluded.status,
    track_title = excluded.track_title,
    track_artist = excluded.track_artist,
    album_art_url = excluded.album_art_url,
    album_color = excluded.album_color,
    location = excluded.location,
    last_seen_at = now(),
    updated_at = now();
end;
$$;

create or replace function public.update_status(
  p_spotify_id text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.active_users
  set
    status = left(coalesce(p_status, ''), 80),
    updated_at = now(),
    last_seen_at = now()
  where spotify_id = p_spotify_id;
end;
$$;

create or replace function public.nearby_users(
  p_lat double precision,
  p_lng double precision,
  p_spotify_id text,
  p_radius_m double precision default 91.44
)
returns table (
  spotify_id text,
  username text,
  avatar_url text,
  status text,
  track_title text,
  track_artist text,
  album_art_url text,
  album_color text,
  distance_m double precision,
  bearing_deg double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with origin as (
    select ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography as geom
  )
  select
    u.spotify_id,
    u.username,
    u.avatar_url,
    u.status,
    u.track_title,
    u.track_artist,
    u.album_art_url,
    u.album_color,
    ST_Distance(u.location, origin.geom) as distance_m,
    degrees(ST_Azimuth(origin.geom, u.location)) as bearing_deg
  from public.active_users u, origin
  where u.spotify_id <> p_spotify_id
    and u.last_seen_at >= now() - interval '15 minutes'
    and ST_DWithin(u.location, origin.geom, p_radius_m);
$$;

create or replace function public.insert_like(
  p_from_spotify_id text,
  p_to_spotify_id text,
  p_distance_ft integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_from_spotify_id = p_to_spotify_id then
    raise exception 'cannot like yourself';
  end if;

  insert into public.likes (from_spotify_id, to_spotify_id, distance_ft)
  values (p_from_spotify_id, p_to_spotify_id, greatest(p_distance_ft, 0))
  returning id into new_id;

  return new_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Lock tables; grant execute on RPCs to the anonymous (and authenticated) roles.
-- -----------------------------------------------------------------------------
alter table public.active_users enable row level security;
alter table public.likes enable row level security;

revoke all on public.active_users from anon, authenticated;
revoke all on public.likes from anon, authenticated;

grant execute on function public.upsert_presence(
  text, text, text, text, text, text, text, text, double precision, double precision
) to anon, authenticated;

grant execute on function public.update_status(text, text) to anon, authenticated;

grant execute on function public.nearby_users(
  double precision, double precision, text, double precision
) to anon, authenticated;

grant execute on function public.insert_like(text, text, integer) to anon, authenticated;

grant execute on function public.expire_stale_presence() to postgres;

-- Realtime: Database → Replication → supabase_realtime must include `likes`.
do $$
begin
  execute 'alter publication supabase_realtime add table public.likes';
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'Enable Realtime for public.likes in the Supabase dashboard if this publication is missing.';
end;
$$;
