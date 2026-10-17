-- The rivals table, its guards and the two functions that read it (docs/DUEL.md section 6, docs/TELEMETRY.md "Rivals and high
-- scores"). Run the whole of this once in the Supabase SQL editor. It can be run again without harm: tables, indexes and
-- policies are `if not exists` or dropped and made again, the functions and their row types are dropped and made again, and no
-- row and no word of the deny-list is touched.
--
-- The public (publishable) key may INSERT into `rivals`, with the checks below. It may not select, update or delete a row of
-- `rivals`, and may do nothing at all to `blocked_words`. It reads the pool through two functions only:
--
--   rivals_for(save_version, map, k, exclude_token_hash)
--     up to k (at most 20) snapshots of that save version within 10 maps of `map` (within 25 when fewer than k are found),
--     never the caller's own (its token hash), players before bots, newest first with a random tiebreak. Each row is
--     id, name, class_id, level, map, outcome, difficulty, save_version, game_version, bot, build. No token hash.
--
--   high_scores(k)
--     the top k (at most 100) snapshots by duel rating, one row per snapshot, only those that have fought (fights > 0) and
--     never a bot: id, name, class_id, level, map, outcome, rating, fights, wins, game_version, posted_on (the day it was
--     posted). The rating columns are written by a ranking job with the service role, which is a later plan; until it has run,
--     this returns no rows.

-- 1. A captured character: the snapshot of a run that ended, as docs/DUEL.md 6.1 describes it. `build` is the character as the
--    game holds it; the table limits its size, not its content (the client skips a row whose ids it does not know).
create table if not exists public.rivals (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  -- Typed by the player (3 to 16 characters on the client) or made up by the game (up to 48): ASCII letters, digits, spaces
  -- and hyphens, starting and ending with a letter or digit.
  name          text    not null check (char_length(name) between 3 and 48 and name ~ '^[A-Za-z0-9][A-Za-z0-9 -]*[A-Za-z0-9]$'),
  class_id      text    not null check (char_length(class_id) <= 32),
  level         int     not null check (level between 1 and 100),
  map           int     not null check (map between 1 and 100),
  outcome       text    not null check (outcome in ('died', 'won')),
  difficulty    jsonb   not null check (pg_column_size(difficulty) < 512),
  -- The format of `build` (SAVE_VERSION in the game): a rival is fightable only by a game of the same version.
  save_version  int     not null check (save_version between 1 and 100000),
  game_version  text    check (char_length(game_version) <= 64),
  -- A character the bot built to fill the pool.
  bot           boolean not null default false,
  -- SHA-256 of a random token that stays in the player's browser: 64 hex characters. It counts a device's inserts and leaves a
  -- player's own characters out of what they are shown. It is never returned by a function.
  token_hash    text    not null check (token_hash ~ '^[0-9a-f]{64}$'),
  -- (A bot's map-100 build is 9.8 KB of JSON; jsonb is about 1.45 times that, so 16 KB was too near. The client sends nothing
  -- but `run.build`, so the cap is a guard against junk, not a budget.)
  build         jsonb   not null check (pg_column_size(build) < 32768),
  -- The ranking's, never the client's. A ranking job with the service role will fight the pool and write these (docs/DUEL.md
  -- section 13); the trigger in 4 resets them to these defaults on every insert, whatever the row sent, and the public key has
  -- no update.
  rating        int         not null default 1000,
  fights        int         not null default 0,
  wins          int         not null default 0,
  rated_at      timestamptz
);

-- 2. Indexes: `rivals_for` looks at one save version near one map; the rate cap looks at one token over the last day.
create index if not exists rivals_version_map_idx on public.rivals (save_version, map);
create index if not exists rivals_token_idx on public.rivals (token_hash, created_at);

-- 3. The deny-list for names: made EMPTY here and filled by hand in the Supabase table editor (one lowercase word or phrase per
--    row; a name is refused when it contains one anywhere, in any case). The words are not kept in the repository.
create table if not exists public.blocked_words (
  word text primary key check (word = lower(word) and char_length(btrim(word)) > 0)
);

-- 4. Triggers on insert, which fire in the order of their names. This one does not trust the row: it sets what only the server
--    may say (the time it was made, which the rate cap and "newest first" read, and the four columns of the ranking) back to
--    their defaults, so a client can neither post itself with a rating nor back-date a row to dodge the cap.
create or replace function public.rivals_defaults() returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  new.rating := 1000;
  new.fights := 0;
  new.wins := 0;
  new.rated_at := null;
  return new;
end
$$;

drop trigger if exists rivals_1_defaults on public.rivals;
create trigger rivals_1_defaults
  before insert on public.rivals
  for each row execute function public.rivals_defaults();

-- 5. Refuses a name that contains a word of the deny-list. `security definer`, with a fixed search_path, because a trigger runs
--    with the privileges of the role that inserts: that is `anon`, which may not read `blocked_words`, so without it every insert
--    would fail with "permission denied". The function runs as its owner (which is not subject to row-level security), and the
--    public key still gets no select on anything.
create or replace function public.rivals_check_name() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.blocked_words b
    where char_length(btrim(b.word)) > 0 and position(lower(b.word) in lower(new.name)) > 0
  ) then
    raise exception 'that name is not allowed' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

drop trigger if exists rivals_2_check_name on public.rivals;
create trigger rivals_2_check_name
  before insert on public.rivals
  for each row execute function public.rivals_check_name();

-- 6. Refuses a twenty-first row from one token hash within 24 hours. `security definer` for the same reason as 5: `anon` may not
--    read `rivals`, so as `anon` the count would see no rows and the cap would never trigger.
create or replace function public.rivals_rate_cap() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.rivals r
    where r.token_hash = new.token_hash and r.created_at > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'too many characters from this browser today' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

drop trigger if exists rivals_3_rate_cap on public.rivals;
create trigger rivals_3_rate_cap
  before insert on public.rivals
  for each row execute function public.rivals_rate_cap();

-- The trigger functions are for the triggers alone: nobody calls them.
revoke all on function public.rivals_defaults() from public, anon, authenticated;
revoke all on function public.rivals_check_name() from public, anon, authenticated;
revoke all on function public.rivals_rate_cap() from public, anon, authenticated;

-- 7. Row-level security: the public key may add rows and may not read, change or delete any; `blocked_words` has no policy and
--    no grant, so it may do nothing to it.
alter table public.rivals enable row level security;
alter table public.blocked_words enable row level security;

drop policy if exists "anyone can add a rival" on public.rivals;
create policy "anyone can add a rival" on public.rivals
  for insert to anon, authenticated
  with check (true);

revoke all on public.rivals from anon, authenticated;
grant insert on public.rivals to anon, authenticated;
revoke all on public.blocked_words from anon, authenticated;

-- 8. The shapes the two functions return (a declared type, so that `token_hash` cannot go out with the rest of a row).
drop function if exists public.rivals_for(int, int, int, text);
drop function if exists public.high_scores(int);
drop type if exists public.rival_row;
drop type if exists public.high_score_row;

create type public.rival_row as (
  id            bigint,
  name          text,
  class_id      text,
  level         int,
  map           int,
  outcome       text,
  difficulty    jsonb,
  save_version  int,
  game_version  text,
  bot           boolean,
  build         jsonb
);

create type public.high_score_row as (
  id            bigint,
  name          text,
  class_id      text,
  level         int,
  map           int,
  outcome       text,
  rating        int,
  fights        int,
  wins          int,
  game_version  text,
  posted_on     date
);

-- 9. The rivals a player may fight: see the header. `security definer` so that the public key can read through it and nowhere
--    else; not `stable` because of `random()`. The parameters are written `rivals_for.<name>` where a column has the same name.
create function public.rivals_for(save_version int, map int, k int, exclude_token_hash text default null)
returns setof public.rival_row
language sql
security definer
set search_path = public
as $$
  with near as (
    select r.id, r.name, r.class_id, r.level, r.map, r.outcome, r.difficulty, r.save_version, r.game_version, r.bot, r.build,
           r.created_at, abs(r.map - rivals_for.map) as away
    from public.rivals r
    where r.save_version = rivals_for.save_version
      and abs(r.map - rivals_for.map) <= 25
      and r.token_hash is distinct from rivals_for.exclude_token_hash
  ),
  reach as (
    select case
      when (select count(*) from near where away <= 10) >= least(greatest(coalesce(rivals_for.k, 0), 0), 20) then 10
      else 25
    end as maps
  )
  select n.id, n.name, n.class_id, n.level, n.map, n.outcome, n.difficulty, n.save_version, n.game_version, n.bot, n.build
  from near n, reach
  where n.away <= reach.maps
  order by n.bot, n.created_at desc, random()
  limit least(greatest(coalesce(rivals_for.k, 0), 0), 20);
$$;

revoke all on function public.rivals_for(int, int, int, text) from public;
grant execute on function public.rivals_for(int, int, int, text) to anon, authenticated;

-- 10. The high score list: see the header. One row per snapshot (not per player); the rating columns are the ranking job's.
create function public.high_scores(k int)
returns setof public.high_score_row
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.name, r.class_id, r.level, r.map, r.outcome, r.rating, r.fights, r.wins, r.game_version,
         (r.created_at at time zone 'utc')::date
  from public.rivals r
  where r.fights > 0 and not r.bot
  order by r.rating desc, r.wins desc, r.created_at asc
  limit least(greatest(coalesce(high_scores.k, 0), 0), 100);
$$;

revoke all on function public.high_scores(int) from public;
grant execute on function public.high_scores(int) to anon, authenticated;

-- 11. Cleanup, by hand when the table has grown (nothing runs it): rows older than 90 days, and rows of a save version older than
--     the three most recent (nobody can fight those).
-- delete from public.rivals
--  where created_at < now() - interval '90 days'
--     or save_version not in (select distinct save_version from public.rivals order by save_version desc limit 3);

-- 12. Ask the API to look at the new functions at once (it also notices by itself within moments).
notify pgrst, 'reload schema';
