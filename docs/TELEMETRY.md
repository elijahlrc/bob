# Run statistics (anonymous)

When a run ends, by a death or a win, the published game sends one record to a Supabase table, so the balance can be read from
what players actually meet ("killed by a rare Gnawer on map 37 as a Vanguard at level 41, on a Crescendo map with these
modifiers"). It is on until the player switches it off (a checkbox on the title screen). Page views are counted separately by
GoatCounter (`index.html`).

## What is sent

`src/run/telemetry.ts` (`RunRecord`, tested in `telemetry.test.ts`). Game facts only: no name, no save, no text a player typed, no
cookie, no id that links one run to a person. Every string is cut to 64 characters and every list to 12.

| Column                                                  | What                                                                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outcome`                                               | `died` or `won`                                                                                                                                                                                             |
| `class_id`, `level`, `map`                              | the class, the character's level, the map (floor) the run ended on                                                                                                                                          |
| `area_level`, `map_type`, `theme`, `affixes`            | the monsters' level there, the map type, the faction theme, the map's modifiers                                                                                                                             |
| `killer`, `killer_type`, `killer_rarity`, `killer_mods` | what delivered the killing blow                                                                                                                                                                             |
| `seed`, `game_version`                                  | the run's seed (the run can be replayed), and the commit of the build                                                                                                                                       |
| `details` (json)                                        | difficulty settings, maps played, seconds, kills, passives allocated, build signature (main gem, keystones, uniques), and for a death: life, energy shield, resistances, ailments and the last damage taken |

Not sent from the dev server, a local file or localhost (`published()` in `src/telemetry.ts`), nor when the player has switched it off.
Nothing is sent when the project URL or the key in `src/telemetry.ts` is empty.

## Setup (once)

1. In the Supabase project, SQL editor: run `docs/telemetry.sql`. It makes the table `runs` and a policy that lets the public key
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
