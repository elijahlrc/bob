# Run statistics (anonymous)

When a run ends, by a death or a win, the published game sends one record to a Supabase table, so the balance can be read from
what players actually meet ("killed by a rare Gnawer on map 37 as a Vanguard at level 41, on a Crescendo map with these
modifiers"). It is on until the player switches it off (a checkbox on the title screen). Page views are counted separately by
GoatCounter (`index.html`). Sending a character to the rivals other players fight is a different thing, with its own opt-in, a name
and a stored token: see "Rivals and high scores" at the end. Nothing in it changes what is said here of `runs`.

## What is sent

`src/run/telemetry.ts` (`RunRecord`, tested in `telemetry.test.ts`). Game facts only: no name, no save, no text a player typed, no
cookie, no id that links one run to a person. Every string is cut to 64 characters and every list to 12.

| Column                                                  | What                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outcome`                                               | `died` or `won`                                                                                                                                                  |
| `class_id`, `level`, `map`                              | the class, the character's level, the map (floor) the run ended on                                                                                               |
| `area_level`, `map_type`, `theme`, `affixes`            | the monsters' level there, the map type, the faction theme, the map's modifiers                                                                                  |
| `killer`, `killer_type`, `killer_rarity`, `killer_mods` | what delivered the killing blow                                                                                                                                  |
| `seed`, `game_version`                                  | the run's seed (the run can be replayed), and the commit of the build                                                                                            |
| `details` (json)                                        | difficulty settings, maps played, seconds, kills, passives allocated, build signature (main gem, keystones, uniques), the gear, and for a death the fields below |

### `details` for a death

Compact on purpose: a row's `details` must stay under 4096 bytes as jsonb, which is about 1.45 times the compact JSON, so the record
keeps to 2600 characters of JSON (`DETAILS_ROOM`) and sheds `strat`, then `gear`, then the oldest hits if it would not fit. A row
the table refuses is lost whole.

| Key                                                | What                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hits`                                             | the last 14 hits within 10 s, oldest first, each `[tenths of a second before death, from, via, rarity, damage type, amount, life+shield just before]`. `via` is the monster behind a slam or a blast (empty for a monster's own hit); `rarity` is `effect` for ground effects. Burning, bleeding and poison are left out (their totals are not in the record) |
| `vit`                                              | `[life, energy shield, mana]` at the moment of death                                                                                                                                                                                                                                                                                                          |
| `def`                                              | `arm` armour, `eva` evasion, `blk` `[attack %, spell %]`, `pr` extra physical reduction %, `reg` life regeneration per second, `ms` movement speed                                                                                                                                                                                                            |
| `max_life`, `max_es`, `res`, `max_res`, `ailments` | as before: maximums, resistances (capped) and their caps, ailments carried                                                                                                                                                                                                                                                                                    |
| `flasks`                                           | per flask `[kind, charges, max charges, running (1/0), times drunk on this map]`                                                                                                                                                                                                                                                                              |
| `near`                                             | living monsters within 8 tiles `[all, magic, rare, boss or miniboss]`                                                                                                                                                                                                                                                                                         |
| `gear`                                             | per worn item `slot\|rarity letter + item level\|gems socketed, joined by +` (also on a win)                                                                                                                                                                                                                                                                  |
| `strat`                                            | the Strategy tab's globals `[target, spacing, life flask threshold, utility flask use]`, blank when unset                                                                                                                                                                                                                                                     |

Damage type indices: 0 physical, 1 lightning, 2 cold, 3 fire, 4 chaos.

The published game sends to `runs`; the dev server, localhost and local files send to `sim_runs` instead (below). Nothing is sent when the player has switched it off.
Nothing is sent when the project URL or the key in `src/telemetry.ts` is empty.

## Development and bot runs: `sim_runs`

A second table, `sim_runs`, takes the same record plus `source` and `batch`, so what the game does in development and what the bot
does can be set beside what players do, at the same game version, without ever mixing with it.

- **The dev server and local copies** (`npm run dev`, localhost, a file) send their finished runs to `sim_runs` as source `dev`
  (the checkbox on the title screen still applies). The published game sends to `runs` only.
- **The bot sim** sends with `--log <batch>`: `npm run sim -- --runs 6 --class all --seed 2 --log seed2-tree`, or through
  `scripts/simpar.sh <dir> 6 3 --seed 2 --log seed2-tree` (each process sends its own runs). Source is `bot:<themes>/<crafting>`
  (`/abandon` when it abandons maps). The version is the short commit hash, with a `+` when `src/` differs from that commit.
  Nothing is sent without `--log`, and a failed send only prints a warning.
- **Unit tests never send anything**: they stay offline and deterministic.

Setup: run `docs/telemetry-dev.sql` once, after `docs/telemetry.sql`.

Compare at one version (replace the hash; `game_version` of a bot batch is that hash, plus `+` if the tree was dirty):

```sql
-- what kills players and what kills the bot, as shares of deaths
with a as (select 'players' as who, killer, count(*) n from runs where outcome = 'died' and game_version = 'abc1234' group by 2),
     b as (select 'bot' as who, killer, count(*) n from sim_runs where source like 'bot:%' and outcome = 'died' and game_version = 'abc1234' group by 2)
select killer, round(100.0 * a.n / sum(a.n) over (), 1) as players_pct, round(100.0 * b.n / sum(b.n) over (), 1) as bot_pct
from a full join b using (killer) order by coalesce(a.n, 0) desc;
-- median map reached by class, players against the bot
select class_id, 'players' as who, percentile_cont(0.5) within group (order by map) from runs group by 1
union all
select class_id, 'bot', percentile_cont(0.5) within group (order by map) from sim_runs where source like 'bot:%' group by 1
order by 1, 2;
```

## Setup (once)

1. In the Supabase project, SQL editor: run `docs/telemetry.sql` (and `docs/telemetry-dev.sql` for the development table). It makes the table `runs` and a policy that lets the public key
   **insert and nothing else** (no select, update or delete).
2. Put the project URL and the **publishable** key in `SINK` (`src/telemetry.ts`). That key is meant to be public. The secret
   or service key must never be in the repo.

## Reading it

Table editor, or SQL editor (CSV export from either). For example:

```sql
-- what kills, by class
select class_id, killer, count(*) from runs where outcome = 'died' group by 1, 2 order by 3 desc;
-- median map reached
select class_id, percentile_cont(0.5) within group (order by map) from runs group by 1;
-- deaths by map type and a modifier
select map_type, a as affix, count(*) from runs, unnest(affixes) a where outcome = 'died' group by 1, 2 order by 3 desc;
-- only the current balance
select * from runs where game_version = '<short commit hash>';
```

## Limits

- Anyone can read the public key from the page and insert rows, so the data can be spammed or faked. The table limits what a row
  may hold (lengths, ranges, size) but cannot stop junk. Read it as indicative, and delete bad rows in the table editor.
- A blocker on the Supabase domain, or being offline, drops a record silently (the game never waits for it).
- Only runs that end are counted: a player who closes the tab mid-run sends nothing.
- A free Supabase project pauses after about a week without use; resume it in the dashboard.

## Rivals and high scores

A player may add their characters to the **rivals** other players fight (docs/DUEL.md section 6). This is a **separate opt-in from
the run statistics above**, off until the player turns it on: its own checkbox on the title screen ("Add my characters to the
rivals and high scores other players see") and its own preference (`bob.pref.rivals`). The statistics' promise of no name and no
identity stays true of `runs`; this table holds both, and says so here.

### What is sent

When a run ends, by a death or a win, and only when the box is ticked, one row goes to the `rivals` table
(`src/run/rivals.ts`, `rivalRecord`; tested in `rivals.test.ts`):

| Column                                 | What                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                                 | the name the player typed (3 to 16 ASCII letters, digits, spaces and hyphens), or one the game makes up ("The Ashen Sentinel of the Low Road") when the field is blank    |
| `class_id`, `level`, `map`, `outcome`  | the class, the character's level, the map the run ended on, `died` or `won`                                                                                               |
| `difficulty`                           | the run's three difficulty settings                                                                                                                                       |
| `build`                                | the character as the game holds it: class, level, passive tree, gear with its gems, flasks, the main skill and the Strategy settings (3 to 9 KB; nothing else of the run) |
| `save_version`, `game_version`         | the save format of `build` (a rival can be fought only by a game of the same version) and the commit of the build                                                         |
| `bot`                                  | true for the characters the bot sim posts to fill the pool                                                                                                                |
| `token_hash`                           | SHA-256 of a random token (below)                                                                                                                                         |
| `rating`, `fights`, `wins`, `rated_at` | the ranking's: set by the database (1000, 0, 0, null) and by nothing else; see "High scores"                                                                              |

The name is the one thing a player types. It is shown to other players beside the character, so it is checked by the database
(below). No account, no e-mail, no address, no run history, no killer, no seed.

### The token

The first time it is needed, the browser makes a random 128-bit token and keeps it in `localStorage` under `bob.rival.token`. Only its
SHA-256 hash is sent. It has two jobs: to leave a player's own characters out of the rivals they are shown, and to count a day's
inserts (at most 20 rows per token hash in 24 hours; the table refuses more). It is not shown to anyone and no function returns it.
Clearing the browser's storage makes a new token, which is fine at this scale. Two players with the same name are two players: the
token tells them apart, not the name.

### How it is read

The public key may insert into `rivals` and may not select, update or delete a row. It reads the pool through two functions
(`docs/rivals.sql`), neither of which returns the token hash:

- `rivals_for(save_version, map, k, exclude_token_hash)`: up to 20 rivals of that save version within 10 maps of `map` (25 if there
  are fewer than `k`), not the caller's own, players before bots, newest first. The game checks every row before it offers it
  (`validateRival`: the save version, and that every passive node, item base, affix, gem, unique and flask the build names exists in
  this version) and skips one that fails.
- `high_scores(k)`: the top rated rival snapshots, at most 100, one row per snapshot, never a bot, and only a snapshot that has
  fought. Their ratings are written by a ranking job with the service role, which is a later plan (docs/DUEL.md section 13); until
  it has run the list is empty. A trigger resets `rating`, `fights`, `wins` and `rated_at` on every insert, so a client cannot post
  itself with a rating.

### Setup (once)

1. In the SQL editor of the Supabase project, run `docs/rivals.sql`. It can be run again without harm. It makes `rivals`,
   `blocked_words` (empty), the triggers, the two functions and the policy that lets the public key **insert and nothing else**.
2. Fill the deny-list (below).
3. Seed the pool with the bot: `npm run sim -- --runs 10 --class all --seed 1 --rivals` posts the character each run ends with
   as `bot: true` with a made-up name (one request each; a name the deny-list stops loses only its own row). Run it again with
   `--legacy` for deeper characters, and with other `--seed` values for more; the pool needs rivals at the current save version,
   and it is replaced by players' own as they come.
4. The same project and key as the run statistics (`SINK`, `src/run/telemetry.ts`). No new secret anywhere.

### The deny-list

`blocked_words` is created empty and holds **words that no name may contain**, one per row, lowercase: in the Supabase table editor,
open `blocked_words`, Insert row, type the word (a name is refused when it contains the word anywhere, in any letter case: a short
word also stops names that merely contain it, so prefer whole words and check the made-up names, which come from the two lists in
`src/data/rivalNames.ts`). The table rejects a word that is not lowercase. Editing it takes effect on the next insert. It is not in
the repository on purpose. The rule is a plain substring test: it does not catch letters spaced out or swapped for digits, and a name
that slips through is deleted by hand.

### Deleting

Table editor: open `rivals`, select the rows, delete. By SQL, for a name or for a whole device (a player who wants their characters
gone can read their token from the browser's storage, `bob.rival.token`, and send it):

```sql
delete from rivals where name = 'Wren';
delete from rivals where token_hash = encode(sha256(convert_to('<the token>', 'UTF8')), 'hex');
-- by hand when the table has grown: older than 90 days, or of a save version older than the three most recent
delete from rivals
 where created_at < now() - interval '90 days'
    or save_version not in (select distinct save_version from rivals order by save_version desc limit 3);
```

A player who turns the box off stops new rows; the rows already sent stay until they are deleted or cleaned up.

### Checking it works

After step 3, with the project's URL and the publishable key from `SINK`:

```sh
# the pool at the current save version near map 10 (rows, no token_hash); the id and build of each
curl -s "$URL/rest/v1/rpc/rivals_for" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d '{"save_version": 19, "map": 10, "k": 5, "exclude_token_hash": null}'
# the high scores: [] until a ranking job has written ratings
curl -s "$URL/rest/v1/rpc/high_scores" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{"k": 10}'
# the table itself must refuse the public key: a permission error, never rows
curl -s "$URL/rest/v1/rivals?select=*" -H "apikey: $KEY"
```

### Limits

- Anyone can read the public key from the page and insert rows, so a snapshot can be faked. The table limits what a row may hold
  and the game skips a build with an id it does not know, but nothing checks that a build is legal (docs/LADDER.md section 8); a
  fake rival is only a rival nobody enjoys fighting, and a row can be deleted.
- A name the deny-list stops loses its row, silently to the player (the title screen says the rule of a name, not the list).
- A blocker on the Supabase domain, or being offline, drops a snapshot silently (the game never waits for it). Only runs that end
  are captured.
