-- Run the whole of this in the Supabase SQL editor (docs/TELEMETRY.md). It makes one table, `runs`, that the public key can
-- insert into and nothing else: no select, no update, no delete.

create table if not exists public.runs (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
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

alter table public.runs enable row level security;

-- The public (anon / publishable) key may add rows, and may not read, change or delete any.
drop policy if exists "anyone can add a run" on public.runs;
create policy "anyone can add a run" on public.runs
  for insert to anon, authenticated
  with check (true);

revoke all on public.runs from anon, authenticated;
grant insert on public.runs to anon, authenticated;
