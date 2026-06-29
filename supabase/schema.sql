-- Visual Funnel — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) to provision the
-- backend. It creates the journeys table, row-level security, and a public
-- screenshots bucket.

-- 1. Journeys table -----------------------------------------------------------

create table if not exists public.journeys (
  id          text primary key,
  owner       uuid references auth.users (id) on delete set null,
  name        text not null default 'Untitled journey',
  structure   jsonb not null default '{"sections": []}'::jsonb,
  updated_at  timestamptz not null default now()
);

create index if not exists journeys_owner_idx on public.journeys (owner);
create index if not exists journeys_updated_at_idx on public.journeys (updated_at desc);

-- 2. Row-level security -------------------------------------------------------
-- Trusted, signed-in users. Each user sees and edits their own journeys.

alter table public.journeys enable row level security;

drop policy if exists "owners read own journeys" on public.journeys;
create policy "owners read own journeys"
  on public.journeys for select
  using (auth.uid() = owner);

drop policy if exists "owners insert own journeys" on public.journeys;
create policy "owners insert own journeys"
  on public.journeys for insert
  with check (auth.uid() = owner);

drop policy if exists "owners update own journeys" on public.journeys;
create policy "owners update own journeys"
  on public.journeys for update
  using (auth.uid() = owner)
  with check (auth.uid() = owner);

drop policy if exists "owners delete own journeys" on public.journeys;
create policy "owners delete own journeys"
  on public.journeys for delete
  using (auth.uid() = owner);

-- 3. Screenshots storage bucket ----------------------------------------------
-- Public read so screenshot URLs render anywhere (including read-only share
-- links). Authenticated users can upload.

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

drop policy if exists "public read screenshots" on storage.objects;
create policy "public read screenshots"
  on storage.objects for select
  using (bucket_id = 'screenshots');

drop policy if exists "authenticated upload screenshots" on storage.objects;
create policy "authenticated upload screenshots"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'screenshots');
