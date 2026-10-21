-- The rivals table, the duel log, their guards and the two functions that read them (docs/DUEL.md section 6, docs/TELEMETRY.md
-- "Rivals and high scores"). Run the whole of this once in the Supabase SQL editor. It can be run again without harm: tables,
-- indexes and policies are `if not exists` or dropped and made again, the functions and their row types are dropped and made
-- again, and no row, no key and no word of the deny-list is touched.
--
-- The public (publishable) key may INSERT into `rivals` (a character snapshot) and into `duels` (the result of a fight it played),
-- with the checks below. It may not select, update or delete anything, and may do nothing at all to the other tables. It reads
-- through two functions only:
--
--   rivals_for(save_version, map, k, exclude_token_hash)
--     up to k (at most 20) snapshots of that save version within 10 maps of `map` (within 25 when fewer than k are found),
--     never the caller's own (its token hash), players before bots, newest first with a random tiebreak. Each row is
--     id, name, class_id, level, map, outcome, difficulty, save_version, game_version, bot, build, rating, fights, wins.
--     No token hash, no address.
--
--   high_scores(k, save_version, outdated)
--     the top k (at most 100) snapshots by duel rating, one row per snapshot, only those that have fought (fights > 0) and
--     never a bot: id, name, class_id, level, map, outcome, rating, fights, wins, game_version, posted_on (the day it was
--     posted). With a save version, only the snapshots of that version (the ones a game of that version can fight), or with
--     `outdated` those of older versions; without one, all of them (what builds before 2026-10-20 ask for).
--
--   my_snapshots(token_hash)
--     the caller's own snapshots, newest first (at most 50), by the token hash that only its browser knows: id, created_at,
--     name, class_id, level, map, outcome, save_version, rating, fights, wins. The game needs its own snapshot's id to compute
--     the seed of a rated fight and to report it, and an insert cannot return it (the public key may not read the table).
--
-- Identity and abuse. Each write is stamped with a keyed hash of the address it came from (the key lives in a private table
-- nobody but these functions can read, so the hash cannot be turned back into an address) and with the hash of a token the
-- player's browser made. The token hash is never returned, so it also serves as proof of ownership: only the browser that
-- posted a snapshot can report that snapshot's fights. Either hash can be put on the block list to refuse a writer.
--
-- Rating. A snapshot starts at ten times its level (a level 100 character at 1000). A reported duel moves both ratings at once
-- (Elo; each side's K starts at 128 for its first fight and falls to 32 by its tenth) so the ladder follows what players play;
-- the duel log is the source of truth, and a nightly job with the service role (a later plan, docs/DUEL.md 13) replays every
-- duel at its game version, recomputes every rating from the verified ones alone, starting again from ten times the level with
-- the same K schedule, and writes the result back. A duel is a pure function of the two builds and
-- the seed, and the seed is fixed by the pair, so a report can be checked exactly.

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
  -- SHA-256 of a random token that stays in the player's browser: 64 hex characters. Never returned by a function; it proves
  -- ownership of the snapshot when a fight is reported, counts a browser's writes, and can be blocked.
  token_hash    text    not null check (token_hash ~ '^[0-9a-f]{64}$'),
  -- A keyed hash of the address the row came from (set by the server, see 4 and 7), or null when the gateway gave none.
  ip_hash       text    check (ip_hash ~ '^[0-9a-f]{64}$'),
  -- (A bot's map-100 build is 9.8 KB of JSON; jsonb is about 1.45 times that, so 16 KB was too near. The client sends nothing
  -- but `run.build`, so the cap is a guard against junk, not a budget.)
  build         jsonb   not null check (pg_column_size(build) < 32768),
  -- The rating. Set by the server to ten times the level on insert (whatever the row sent), moved by every reported duel (12),
  -- recomputed by the nightly job; the public key has no update.
  rating        int         not null default 1000,
  fights        int         not null default 0,
  wins          int         not null default 0,
  rated_at      timestamptz
);

-- 2. Indexes: `rivals_for` looks at one save version near one map; the caps look at one token or one address over the last day.
create index if not exists rivals_version_map_idx on public.rivals (save_version, map);
create index if not exists rivals_token_idx on public.rivals (token_hash, created_at);
create index if not exists rivals_ip_idx on public.rivals (ip_hash, created_at);

-- 3. The deny-list for names: made EMPTY here and filled by hand in the Supabase table editor (one lowercase word or phrase per
--    row; a name is refused when it contains one anywhere, in any case). The words are not kept in the repository.
create table if not exists public.blocked_words (
  word text primary key check (word = lower(word) and char_length(btrim(word)) > 0)
);

-- 4. The block list: a token hash or an address hash whose writes are refused. Filled by hand from the hashes seen on a
--    spammer's rows (or by the nightly job when a reported duel does not replay). `note` is for you.
create table if not exists public.blocked (
  hash       text primary key check (hash ~ '^[0-9a-f]{64}$'),
  kind       text not null check (kind in ('token', 'ip')),
  note       text,
  created_at timestamptz not null default now()
);

-- 5. The private key that hashes addresses, in a schema the public key cannot even see. Made once, with a random value, and
--    never touched by a second run of this file. (Changing it would make every stored address hash a stranger to new writes,
--    so the block list would stop matching addresses.)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.keys (
  name  text primary key,
  value text not null
);
revoke all on private.keys from public, anon, authenticated;
insert into private.keys (name, value)
  values ('ip', gen_random_uuid()::text || gen_random_uuid()::text)
  on conflict (name) do nothing;

-- 6. The keyed hash of the caller's address, read from the header the gateway passes to the database: Cloudflare's
--    `cf-connecting-ip`, which Cloudflare sets itself and a client cannot forge. (`x-forwarded-for` is not used: a client can
--    put anything first in it.) Null when there is none (a call from the SQL editor, or a gateway that passes no such header:
--    check a stored row after the first insert). `security definer` so that it may read the secret; it is granted to nobody,
--    the triggers call it.
create or replace function private.client_ip_hash() returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  headers json;
  ip text;
  secret text;
begin
  begin
    headers := current_setting('request.headers', true)::json;
  exception when others then
    headers := null;
  end;
  if headers is null then
    return null;
  end if;
  ip := btrim(coalesce(headers ->> 'cf-connecting-ip', ''));
  if ip = '' then
    return null;
  end if;
  select k.value into secret from private.keys k where k.name = 'ip';
  if secret is null then
    return null;
  end if;
  return encode(sha256(convert_to(secret || '|' || ip, 'utf8')), 'hex');
end
$$;
revoke all on function private.client_ip_hash() from public, anon, authenticated;

-- 7. Triggers on inserting a snapshot, which fire in the order of their names. Every one is `security definer` with a fixed
--    search_path: a trigger runs with the privileges of the role that inserts, which is `anon`, and `anon` may read none of the
--    tables these consult; as definer they run as the file's owner (not subject to row-level security), and the public key
--    still gets no select on anything.
--
--    7a. Does not trust the row: sets what only the server may say (the time, the address hash, the rating at ten times the
--    level, no fights) back to the server's values, so a client can neither post itself with a rating nor back-date a row.
create or replace function public.rivals_defaults() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_at := now();
  new.ip_hash := private.client_ip_hash();
  new.rating := new.level * 10;
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

--    7b. Refuses a writer on the block list, by token or by address.
create or replace function public.refuse_blocked(token text, ip text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.blocked b where b.hash = token or (ip is not null and b.hash = ip)) then
    raise exception 'this writer is blocked' using errcode = 'check_violation';
  end if;
end
$$;
revoke all on function public.refuse_blocked(text, text) from public, anon, authenticated;

create or replace function public.rivals_blocked() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refuse_blocked(new.token_hash, new.ip_hash);
  return new;
end
$$;

drop trigger if exists rivals_2_blocked on public.rivals;
create trigger rivals_2_blocked
  before insert on public.rivals
  for each row execute function public.rivals_blocked();

--    7c. Refuses a name that contains a word of the deny-list.
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

drop trigger if exists rivals_3_check_name on public.rivals;
create trigger rivals_3_check_name
  before insert on public.rivals
  for each row execute function public.rivals_check_name();

--    7d. The caps: 20 snapshots a day from one token, 60 from one address (several people can share one), and 300 an hour
--    from everyone together, which bounds a flood from many addresses to what you would notice and delete.
create or replace function public.rivals_rate_cap() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.rivals r
      where r.token_hash = new.token_hash and r.created_at > now() - interval '24 hours') >= 20 then
    raise exception 'too many characters from this browser today' using errcode = 'check_violation';
  end if;
  if new.ip_hash is not null and
     (select count(*) from public.rivals r
      where r.ip_hash = new.ip_hash and r.created_at > now() - interval '24 hours') >= 60 then
    raise exception 'too many characters from this address today' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.rivals r where r.created_at > now() - interval '1 hour') >= 300 then
    raise exception 'the pool is taking a rest; try again later' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

drop trigger if exists rivals_4_rate_cap on public.rivals;
create trigger rivals_4_rate_cap
  before insert on public.rivals
  for each row execute function public.rivals_rate_cap();

-- The trigger functions are for the triggers alone: nobody calls them.
revoke all on function public.rivals_defaults() from public, anon, authenticated;
revoke all on function public.rivals_blocked() from public, anon, authenticated;
revoke all on function public.rivals_check_name() from public, anon, authenticated;
revoke all on function public.rivals_rate_cap() from public, anon, authenticated;

-- 8. Row-level security: the public key may add snapshots and may not read, change or delete any; the deny-list and the block
--    list have no policy and no grant, so it may do nothing to them.
alter table public.rivals enable row level security;
alter table public.blocked_words enable row level security;
alter table public.blocked enable row level security;

drop policy if exists "anyone can add a rival" on public.rivals;
create policy "anyone can add a rival" on public.rivals
  for insert to anon, authenticated
  with check (true);

revoke all on public.rivals from anon, authenticated;
grant insert on public.rivals to anon, authenticated;
revoke all on public.blocked_words from anon, authenticated;
revoke all on public.blocked from anon, authenticated;

-- 9. The duel log: one row per rated fight, reported by the browser that played it. `a_id` is the reporter's own snapshot (side
--    0, "you"), `b_id` the rival it fought. `winner` is 0 for a, 1 for b, null for a draw. The seed is the pair's (11), not the
--    client's. One rated fight per ordered pair, ever: "Again" is unrated. `verified` is null until the nightly job replays it,
--    then true or false.
create table if not exists public.duels (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  a_id         bigint not null references public.rivals (id) on delete cascade,
  b_id         bigint not null references public.rivals (id) on delete cascade,
  seed         bigint not null,
  winner       smallint check (winner in (0, 1)),
  how          text    not null check (how in ('death', 'time', 'stall')),
  seconds      real    not null,
  game_version text    check (char_length(game_version) <= 64),
  token_hash   text    not null check (token_hash ~ '^[0-9a-f]{64}$'),
  ip_hash      text    check (ip_hash ~ '^[0-9a-f]{64}$'),
  verified     boolean,
  constraint duels_one_per_pair unique (a_id, b_id),
  constraint duels_not_self check (a_id <> b_id)
);

-- The rules of a fight's end and length (docs/DUEL-BALANCE.md 5, 2026-10-20), as constraints of their own so that a table made
-- before can be brought up to them: a death names a winner unless both fell in one tick, the time cap names the side that used
-- fewer reprieves (a draw when both used as many), and a stall is a draw. A fight lasts at most the cap (250 s), with room.
alter table public.duels drop constraint if exists duels_seconds_check;
alter table public.duels drop constraint if exists duels_seconds;
alter table public.duels add constraint duels_seconds check (seconds >= 0 and seconds <= 600);
alter table public.duels drop constraint if exists duels_winner_how;
alter table public.duels add constraint duels_winner_how check (how <> 'stall' or winner is null);

create index if not exists duels_token_idx on public.duels (token_hash, created_at);
create index if not exists duels_ip_idx on public.duels (ip_hash, created_at);
create index if not exists duels_unverified_idx on public.duels (created_at) where verified is null;

-- 10. Row-level security on the log: the public key may add a report and nothing else.
alter table public.duels enable row level security;
drop policy if exists "anyone can report a duel" on public.duels;
create policy "anyone can report a duel" on public.duels
  for insert to anon, authenticated
  with check (true);
revoke all on public.duels from anon, authenticated;
grant insert on public.duels to anon, authenticated;

-- 11. The seed of the rated fight between two snapshots: fixed by the pair, so that a reporter cannot shop for a seed it won
--     and the replay fights the very same duel. The game computes the same (`duelSeedFor` in src/run/rivals.ts).
create or replace function public.duel_seed(a bigint, b bigint) returns bigint
language sql
immutable
as $$
  select ((a * 1000003) + (b * 7919)) % 2147483647;
$$;
revoke all on function public.duel_seed(bigint, bigint) from public, anon, authenticated;

-- 12. Triggers on reporting a duel.
--     12a. Before insert: the reporter must own side 0 (its token hash is the snapshot's, and the snapshot is a player's, never a
--     bot's), the rival must exist and be of the same save version, the server's values are forced (time, address, seed,
--     unverified), the block list and the caps apply (50 reports a day from one token, 150 from one address, 1000 an hour from
--     everyone).
create or replace function public.duels_check() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a_token text;
  a_version int;
  a_bot boolean;
  b_version int;
begin
  new.created_at := now();
  new.ip_hash := private.client_ip_hash();
  new.verified := null;
  new.seed := public.duel_seed(new.a_id, new.b_id);
  perform public.refuse_blocked(new.token_hash, new.ip_hash);
  select r.token_hash, r.save_version, r.bot into a_token, a_version, a_bot
    from public.rivals r where r.id = new.a_id;
  if a_token is null then
    raise exception 'no such character' using errcode = 'check_violation';
  end if;
  if a_token <> new.token_hash then
    raise exception 'not your character' using errcode = 'check_violation';
  end if;
  -- A bot's token is made by a script anyone can read, so a bot never reports: only a player's snapshot can be side 0.
  if a_bot then
    raise exception 'a bot does not report its fights' using errcode = 'check_violation';
  end if;
  select r.save_version into b_version from public.rivals r where r.id = new.b_id;
  if b_version is null then
    raise exception 'no such rival' using errcode = 'check_violation';
  end if;
  if a_version <> b_version then
    raise exception 'the two characters are of different versions' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.duels d
      where d.token_hash = new.token_hash and d.created_at > now() - interval '24 hours') >= 50 then
    raise exception 'too many reports from this browser today' using errcode = 'check_violation';
  end if;
  if new.ip_hash is not null and
     (select count(*) from public.duels d
      where d.ip_hash = new.ip_hash and d.created_at > now() - interval '24 hours') >= 150 then
    raise exception 'too many reports from this address today' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.duels d where d.created_at > now() - interval '1 hour') >= 1000 then
    raise exception 'the ladder is taking a rest; try again later' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

drop trigger if exists duels_1_check on public.duels;
create trigger duels_1_check
  before insert on public.duels
  for each row execute function public.duels_check();

--     12b. After insert: Elo on both snapshots at once. The expected score of a is 1 / (1 + 10^((rb - ra) / 400)); a win scores
--     1, a draw 0.5, a loss 0. Each side moves by its own K, which starts at 128 for a snapshot's first fight and falls in a
--     straight line to 32 by its tenth (`elo_k`), so a new character finds its place fast and a settled one is not thrown about.
--     Ratings are whole numbers. The nightly job recomputes all of this from the verified log, so a lie moves the ladder for a
--     day at most.
create or replace function public.elo_k(fights int) returns double precision
language sql
immutable
as $$
  select 32.0 + 96.0 * greatest(0, 10 - fights) / 10.0;
$$;
revoke all on function public.elo_k(int) from public, anon, authenticated;

create or replace function public.duels_elo() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ra int;
  rb int;
  fa int;
  fb int;
  ea double precision;
  sa double precision;
begin
  select r.rating, r.fights into ra, fa from public.rivals r where r.id = new.a_id;
  select r.rating, r.fights into rb, fb from public.rivals r where r.id = new.b_id;
  ea := 1.0 / (1.0 + power(10.0, (rb - ra) / 400.0));
  sa := case when new.winner = 0 then 1.0 when new.winner = 1 then 0.0 else 0.5 end;
  -- A rating never goes below 0: a level 2 starts at 20, and a loss at K 128 can cost 31.
  update public.rivals set
    rating = greatest(0, round(ra + public.elo_k(fa) * (sa - ea))::int),
    fights = fights + 1,
    wins = wins + case when new.winner = 0 then 1 else 0 end,
    rated_at = now()
  where id = new.a_id;
  update public.rivals set
    rating = greatest(0, round(rb + public.elo_k(fb) * ((1.0 - sa) - (1.0 - ea)))::int),
    fights = fights + 1,
    wins = wins + case when new.winner = 1 then 1 else 0 end,
    rated_at = now()
  where id = new.b_id;
  return new;
end
$$;

drop trigger if exists duels_2_elo on public.duels;
create trigger duels_2_elo
  after insert on public.duels
  for each row execute function public.duels_elo();

revoke all on function public.duels_check() from public, anon, authenticated;
revoke all on function public.duels_elo() from public, anon, authenticated;

-- 13. The shapes the two functions return (a declared type, so that no hash can go out with the rest of a row).
drop function if exists public.rivals_for(int, int, int, text);
drop function if exists public.high_scores(int);
drop function if exists public.high_scores(int, int, boolean);
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
  build         jsonb,
  rating        int,
  fights        int,
  wins          int
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

-- 14. The rivals a player may fight: see the header. `security definer` so that the public key can read through it and nowhere
--     else; not `stable` because of `random()`. The parameters are written `rivals_for.<name>` where a column has the same name.
create function public.rivals_for(save_version int, map int, k int, exclude_token_hash text default null)
returns setof public.rival_row
language sql
security definer
set search_path = public
as $$
  with near as (
    select r.id, r.name, r.class_id, r.level, r.map, r.outcome, r.difficulty, r.save_version, r.game_version, r.bot, r.build,
           r.rating, r.fights, r.wins, r.created_at, abs(r.map - rivals_for.map) as away
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
  select n.id, n.name, n.class_id, n.level, n.map, n.outcome, n.difficulty, n.save_version, n.game_version, n.bot, n.build,
         n.rating, n.fights, n.wins
  from near n, reach
  where n.away <= reach.maps
  order by n.bot, n.created_at desc, random()
  limit least(greatest(coalesce(rivals_for.k, 0), 0), 20);
$$;

revoke all on function public.rivals_for(int, int, int, text) from public;
grant execute on function public.rivals_for(int, int, int, text) to anon, authenticated;

-- 15. The high score list: see the header. One row per snapshot (not per player), by rating. A game asks for its own save
--     version, since only those snapshots can be fought (`rivals_for`); a new save version starts an empty list, and the older
--     versions' list stays readable with `outdated`. Ratings are never reset: the version filter is the reset.
create function public.high_scores(k int, save_version int default null, outdated boolean default false)
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
    and (high_scores.save_version is null
         or (coalesce(high_scores.outdated, false) and r.save_version < high_scores.save_version)
         or (not coalesce(high_scores.outdated, false) and r.save_version = high_scores.save_version))
  order by r.rating desc, r.wins desc, r.created_at asc
  limit least(greatest(coalesce(high_scores.k, 0), 0), 100);
$$;

revoke all on function public.high_scores(int, int, boolean) from public;
grant execute on function public.high_scores(int, int, boolean) to anon, authenticated;

-- 15b. A browser's own snapshots, by the token hash that only it knows (the same proof of ownership as a report's): the ids the
--      game needs for the seed of a rated fight and for the report, and what it may show the player of their own characters.
--      Never another's: a hash nobody knows matches nothing.
drop function if exists public.my_snapshots(text);
drop type if exists public.my_snapshot_row;

create type public.my_snapshot_row as (
  id            bigint,
  created_at    timestamptz,
  name          text,
  class_id      text,
  level         int,
  map           int,
  outcome       text,
  save_version  int,
  rating        int,
  fights        int,
  wins          int
);

create function public.my_snapshots(token_hash text)
returns setof public.my_snapshot_row
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.created_at, r.name, r.class_id, r.level, r.map, r.outcome, r.save_version, r.rating, r.fights, r.wins
  from public.rivals r
  where r.token_hash = my_snapshots.token_hash
  order by r.created_at desc
  limit 50;
$$;

revoke all on function public.my_snapshots(text) from public;
grant execute on function public.my_snapshots(text) to anon, authenticated;

-- 16. Cleanup, by hand when the tables have grown (nothing runs it): snapshots older than 90 days, and snapshots of a save
--     version older than the three most recent (nobody can fight those). A snapshot's duels go with it (`on delete cascade`).
-- delete from public.rivals
--  where created_at < now() - interval '90 days'
--     or save_version not in (select distinct save_version from public.rivals order by save_version desc limit 3);

-- 17. Ask the API to look at the new functions at once (it also notices by itself within moments).
notify pgrst, 'reload schema';
