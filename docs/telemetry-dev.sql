-- Run this in the Supabase SQL editor after docs/telemetry.sql (docs/TELEMETRY.md). It makes `sim_runs`: the same record as
-- `runs` plus where it came from (`source`: 'dev' for the dev server, 'bot:best/greedy' for the bot sim) and a `batch` label,
-- so development and bot runs never mix with real players. Same rules: the public key may insert and nothing else.

create table if not exists public.sim_runs (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  source        text   not null check (char_length(source) <= 64),
  batch         text   not null check (char_length(batch) <= 64),
  outcome       text   not null check (outcome in ('died', 'won')),
  class_id      text   not null check (char_length(class_id) <= 32),
  level         int    not null check (level between 1 and 100),
  map           int    not null check (map between 1 and 100),
  area_level    int    check (area_level between 1 and 120),
  map_type      text   check (char_length(map_type) <= 64),
  theme         text   check (char_length(theme) <= 64),
  affixes       text[] not null default '{}' check (cardinality(affixes) <= 12),
  killer        text   check (char_length(killer) <= 64),
  killer_type   text   check (char_length(killer_type) <= 64),
  killer_rarity text   check (char_length(killer_rarity) <= 64),
  killer_mods   text[] not null default '{}' check (cardinality(killer_mods) <= 12),
  seed          bigint,
  game_version  text   check (char_length(game_version) <= 64),
  details       jsonb  not null default '{}' check (pg_column_size(details) < 4096)
);

alter table public.sim_runs enable row level security;

drop policy if exists "anyone can add a sim run" on public.sim_runs;
create policy "anyone can add a sim run" on public.sim_runs
  for insert to anon, authenticated
  with check (true);

revoke all on public.sim_runs from anon, authenticated;
grant insert on public.sim_runs to anon, authenticated;
