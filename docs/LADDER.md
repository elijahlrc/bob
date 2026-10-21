# Bob — Ladder investigation: a high-score ladder with simulated PvP

Status: **investigation only (2026-10-16); nothing is built and no decision is taken** · Owner: the user · Author: Claude

The idea (the user, 2026-10-16): when a run ends, the build is sent to a database; the game then simulates it in PvP against a few
other players' builds and the player gets a rank, "how good was this build in the grand scheme". Later, the same fights at
other points of a run. Database costs are to be kept to a minimum; cheating matters little while the player base is small,
but cheap protections are welcome.

This document says what the code and the services allow today, what was measured, and the forks only the user can decide
(section 10). **Section 11** (the same day) sizes the real fight, two characters in one world, which the user chose over the
proxies of section 5; the plan for it is [DUEL.md](DUEL.md). A plan for the ranking comes after the decisions of section 10.

---

## 1. Short answer

**Plausible, and cheap.** The database is not the hard part: the game already sends every finished run to a Supabase table
(docs/TELEMETRY.md), a build is 3 to 9 KB of JSON, and a headless duel costs 3 to 40 ms. The free plan holds tens of thousands
of builds and hundreds of thousands of fights a month. The hard parts are elsewhere:

1. **The sim has one player.** Two full characters in one arena needs the player singleton replaced by sides of the world.
   Driven by the compiler, with a codemod for the tests, that extraction is three to five days (DUEL.md section 3), not the
   weeks section 5 guessed. Two cheaper fights exist on today's code and tell builds apart, but neither values movement,
   range or kiting (section 5).
2. **A stored build is fightable only at its own version.** The save format changed 17 times in 10 days and the tree's node
   ids renumber on every bake; the sim's balance moved every day (section 4.5). A ladder is therefore a sequence of short
   seasons, or the fights are re-run at one version by a nightly job, or the build gets a stable serialisation first.
3. **PvP damage scale decides what wins.** At the game's own numbers a duel is over in 1.5 to 7 s at maps 40 to 60, the first
   hit or two: the ladder would rank use time. Scaled down, sustain and regeneration start to count, and the order changes
   (section 4.3). The scale is a design choice, not a tuning detail.

---

## 2. What exists already

| Piece                                                                                                     | Where                                                                           | Bearing on the ladder                                                                                                                           |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| A Supabase project with `runs` and `sim_runs`; the public key may **insert and nothing else**             | `src/run/telemetry.ts`, `docs/telemetry.sql`, docs/TELEMETRY.md                 | The ladder needs a **read** path, which no table has today (section 7).                                                                         |
| Every finished run is sent, unless the player switches it off; no name, no id that links runs to a person | `src/telemetry.ts`, the title-screen checkbox                                   | A ladder with names and a stable identity breaks the promise in TELEMETRY.md (section 8.3).                                                     |
| `RunRecord.details.build` is a signature (main gem, keystones, uniques) and `gear` a list of strings      | `src/run/telemetry.ts`, `src/run/metrics.ts`                                    | Not enough to fight with: the ladder needs the whole `Build` (equipment with sockets, flasks, allocated nodes, strategy).                       |
| The sim is deterministic (seeded sfc32, no `Math.random`)                                                 | DESIGN.md 8.2, `src/core/rng.ts`                                                | Any fight can be replayed by anyone from the two builds and a seed: a reported result is checkable, so results need not be trusted (section 8). |
| A training-dummy arena whose dummy takes any `Defence`                                                    | `createDummyWorld`, `dummyDefence` in `src/sim/dummy.ts`; `Character.defence()` | The crossfire duel of section 5.1 needs no new sim code.                                                                                        |
| `migrate` carries a save across the versions it can; `SAVE_VERSION` otherwise rejects it                  | `src/run/save.ts`                                                               | The same rule can say which stored builds a version can still fight (section 4.5).                                                              |
| The published game is built and deployed by a GitHub Actions workflow; the repository is public           | `.github/workflows/pages.yml`                                                   | Actions is free on public repositories: a nightly job can run the tournament in Node at full speed (section 6).                                 |
| No Web Worker in `src/`; the Skills tab slices its sheets over frames                                     | docs/PERFORMANCE.md                                                             | A death's sparring (60 duels) is 0.2 to 2.5 s: a worker or slicing keeps the summary screen responsive.                                         |

---

## 3. How the numbers were measured

`scripts/ladder-probe.ts` (2026-10-16): the bot plays six classes from two seeds on the legacy difficulty (the default kills the
bot on maps 10 to 20; legacy reaches map 80 on half the runs), a copy of `run.build` is kept on first reaching maps 10, 20, 40,
60 and 80, then every pair of builds at one map fights both ways from three seeds. A fight is the crossfire of section 5.1: the
attacker in the dummy arena, the dummy wearing the other build's `Character.defence()`, 4 tiles apart, mana and life not free,
120 simulated seconds at most; the time to the dummy's death is the result. `--scale` multiplies the dummy's damage taken.

---

## 4. Findings

### 4.1 A build is small

`JSON.stringify(run.build)` over 39 snapshots (bytes; gzip is `zlib` level 6):

| Map | JSON (min to max) | gzip           | Allocated nodes |
| --- | ----------------- | -------------- | --------------- |
| 10  | 3,344 to 5,611    | 921 to 1,183   | 8 to 10         |
| 20  | 5,420 to 7,308    | 1,308 to 1,542 | 20 to 23        |
| 40  | 6,533 to 8,108    | 1,614 to 1,807 | 49 to 52        |
| 60  | 7,025 to 8,544    | 1,768 to 2,001 | 77 to 79        |
| 80  | 6,867 to 8,950    | 1,756 to 2,067 | 104 to 107      |

The size follows the affixes on the gear (11 to 44) and the allocated list; items carry their names and every rolled value. As
jsonb a row is 1.2 to 1.5 times the JSON (TELEMETRY.md measured 1.45 for its records; TOAST compresses values over 2 KB), so
**500 MB holds 35,000 to 50,000 builds**; as gzipped text, about four times that. Either is far beyond a small player base.

### 4.2 A duel is cheap

Wall time per crossfire duel on this machine (Node 24, one core), 120 simulated seconds at most:

| Damage scale | Fight length at map 40       | Fight length at map 60 | Wall per duel |
| ------------ | ---------------------------- | ---------------------- | ------------- |
| ×1           | 1.5 to 5 s                   | 1.5 to 4 s             | 3 to 7 ms     |
| ×0.1         | 4 to 60 s                    | 2.5 to 11 s            | 9 to 15 ms    |
| ×0.03        | 10 to 110 s (one never dies) | 5 to 37 s              | 24 to 41 ms   |

A death's sparring at 10 opponents, both directions, 3 seeds is 60 duels: **0.2 to 0.4 s at ×1, 2.5 s at ×0.03.** A nightly round robin
of 200 builds is 40,000 pairs, 240,000 duels, 15 to 160 minutes on one core; a Swiss or Elo scheme needs a small fraction of
that. A bot run to map 80 is about 45 s wall.

### 4.3 The crossfire tells builds apart, and the damage scale decides who wins

Wins by median time to kill (the attacker who kills first wins the pair), six builds at map 40 and five at map 60:

| Build (class, bot seed, level) | ×1, map 40 | ×0.1, map 40 | ×0.03, map 40 | ×1, map 60 | ×0.1, map 60 | ×0.03, map 60 |
| ------------------------------ | ---------- | ------------ | ------------- | ---------- | ------------ | ------------- |
| Mystic 2 (42 / 63)             | **5**      | **5**        | 4             | **4**      | **4**        | **4**         |
| Vanguard 1 (44 / 65)           | 4          | 3            | **5**         | 3          | 1            | 2             |
| Shade 1 (41)                   | 3          | 3            | 3             | –          | –            | –             |
| Reaver 2 (41 / 63)             | 2          | 2            | 2             | 1          | 3            | 3             |
| Shade 2 (42 / 64)              | 1          | 1            | 1             | 2          | 2            | 1             |
| Strider 2 (42 / 64)            | 0          | 1            | 0             | 0          | 0            | 0             |

- **Seed spread:** at maps 40 and 60 the three seeds of a pair agree to within a few tenths of a second at ×1 and within
  about 10% at ×0.03; at map 20 some pairs spread more (6.0 / 7.6 / 8.8 s). The wins are counted from the medians; an order
  per seed was not computed.
- **At ×1 the first hit or two decides it.** Mystic 2 kills every opponent in exactly 1.5 s at map 60 (one cast after the walk),
  whatever their defences: the ladder would rank cast time and reach, and armour, block, regeneration and energy shield would
  count for nothing. This is the game's own balance (player damage against player life is lopsided, as in the reference game,
  which scales PvP damage down for the same reason).
- **At ×0.03 sustain counts.** Vanguard 1's defences outlast every attacker at map 40 (no one kills it within 120 s) and it
  wins the bracket; Mystic 2 drops from first to second. The scale is therefore a design knob: it says whether the ladder is
  about burst or about a whole character.
- **The Strider is last at maps 40 and 60** (mid-table at map 20, where Zealot 2 and Vanguard 2 were last). A bow build kites,
  keeps its distance and dodges telegraphs; a crossfire gives it no credit for any of that. Any fight without movement
  (sections 5.1 and 5.2) has this bias.

### 4.4 What the dummy arena already gets right, and what it leaves out

- Life regeneration, leech and energy-shield recharge tick for **every** actor (`src/sim/combat.ts`, the recovery step), so a
  dummy wearing a player's `Defence` regenerates and recharges like that player; the ×0.03 results above show it.
- Mana, mana regeneration, flasks, reprieves, charges, buffs, triggers, minions and deployables belong to the world's one
  player: the defender has none of them in a crossfire.
- A `Defence` with `isPlayer: true` on a non-player actor changes only the bleed fraction (`combat.ts:313`); the actor flag,
  not the defence flag, gates everything else. Harmless.

### 4.5 A build is only fightable at its own version

- `SAVE_VERSION` is 19; it changed **17 times between 2026-10-06 and 2026-10-13**, ten of them during the tree redesign.
  `migrate` keeps a save across a few versions by discarding its allocated passives; the rest it rejects.
- The tree's node ids are its layout: `allocated` is a list of them, and a rebake renumbers (CLAUDE.md). A build from before a
  rebake points at other nodes.
- `src/sim` or `src/calc` changed on **every day** of the project's ten. A build's strength is a function of the version, so a
  rating is comparable only within one.
- Difficulty is a run setting (scaling, base, variance; docs/ENEMIES.md 8). A run on an easier setting reaches further with a
  weaker build; `run.difficulty` must be stored with the build and either bracketed or restricted to the default.

---

## 5. Three ways to fight

| Fight                             | How                                                                                                                                                                                                               | What it values                                                                                                              | What it misses                                                                                                                                                                        | Cost to build                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **5.1 Crossfire** (the probe)     | A attacks a dummy wearing B's defence; B attacks one wearing A's; whoever kills first wins. Both directions from a few seeds.                                                                                     | Offence against defences, including regeneration, leech and ES recharge; every skill, minion and deployable of the attacker | The defender does nothing: no flasks, reprieves, charges, stuns or ailments on the attacker; no movement or range; the attacker is never hurt, so its hit-taken conditions never hold | **Nothing in the sim**; the probe is the fight. A duel function, a seed convention, a damage scale.                                                                                                                                                                                                                                                                                                                                                          |
| **5.2 The opponent as a monster** | B becomes a `MonsterStats` (`src/calc/monster.ts`): B's `Defence`, B's main skill's `SkillProfile` as the monster's attack, B's move speed; the monster AI chases and hits A in the dummy arena. Both directions. | Adds damage taken: A's flasks, reprieves, block, evasion, stuns, hit-taken triggers and the fear of dying all count         | B fights with one skill and the monster AI; B's own flasks, minions and strategy are still missing; a ranged B holds at range like an archer, which is some credit for range          | A `MonsterStats` from a build (a stub `MonsterTypeDef` and `MonsterSpec`); skill behaviours the monster action path does not carry (minions, deployables, channelling) fall back to the plain hit. Days.                                                                                                                                                                                                                                                     |
| **5.3 Two players in one world**  | A second player actor with its own `Character`, flasks, buffs, minions and AI.                                                                                                                                    | Everything, both ways, including kiting and telegraph dodging                                                               | –                                                                                                                                                                                     | `World` has about sixty player-scoped fields (`chargeT`, `buffT`, `flasks`, `channel`, `shots`, `deployables`, `minions`, `reprieve`...), `w.player` is read in 153 places across 40 sim files, and `isPlayer` gates the damage paths. Extracting the player's state touches 918 reads in the sim and 1,306 in tests; driven by the compiler, with a codemod for the tests, **3 to 5 days** for the extraction and 10 to 17 for the whole feature (DUEL.md). |
| **5.3' Two worlds in lockstep**   | A's world and B's world step together; the damage A's dummy takes each tick is applied to B's player in B's world after B's mitigation (and the other way), with stuns and ailments mirrored too.                 | Both characters' flasks, reprieves, leech, charges and triggers, since each is the player of its own world                  | Movement and range (each stands in its own arena); area shapes and positioning                                                                                                        | A few hundred lines around `applyDamage`; no change to the sim's own paths. Days.                                                                                                                                                                                                                                                                                                                                                                            |

The bias of 5.1 and 5.2 against range (section 4.3) is structural. Only 5.3 removes it.

---

## 6. Where the fights run and where the ranking lives

Two different things are wanted: a result **on the death screen** ("your build beat 7 of 10 builds that died near map 40"),
and a **global rank**. The first is cheap on the client. The second needs every build fought on the same version by the same
rules, which no player's client does.

| Place                            | Fits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Limits                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The client, on death**         | Sparring against K sampled opponents (section 4.2): 0.2 to 2.5 s. Reads K builds (K × 8 KB), inserts its own build and, if wanted, the K results.                                                                                                                                                                                                                                                                                                                                              | Any result it reports is one client's word. Fine as colour; not a rating. Runs on the player's version, which is the published one, so opponents must be of that version.                                                                                                                                                                                                   |
| **A nightly GitHub Actions job** | The repository is public, so standard runners are free ([GitHub billing](https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions)). Checks out `main`, reads the builds of the current version, runs the tournament in Node (section 4.2), writes a `ladder` table (rank, name, class, level, map, signature, rating; about 150 bytes a row) or a static `ladder.json` beside the game. Its daily reads keep the Supabase project from pausing. | A scheduled workflow is disabled after 60 days without repository activity ([GitHub docs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows); a commit re-enables it). Needs a Supabase key with read and write on the ladder tables as a repository secret (the service key never enters the repo; a dedicated role is better). |
| **A Supabase edge function**     | 500,000 invocations a month; could **verify** one reported duel (3 to 40 ms) and refuse a false one, or rate-limit inserts by IP.                                                                                                                                                                                                                                                                                                                                                              | 2 s of CPU per request on the free plan ([limits](https://supabase.com/docs/guides/functions/limits)): enough for a few duels, not for a tournament. Deno, so the sim must be bundled for it.                                                                                                                                                                               |
| **Elo from client reports**      | No job at all: each death's K results update ratings in the table.                                                                                                                                                                                                                                                                                                                                                                                                                             | Updates to other players' rows need an update policy, which is the one thing the anon key should never have; and every rating rests on unverified reports.                                                                                                                                                                                                                  |

The natural split: **the client spars for the death screen; the nightly job owns the rank.** Then only a build can be faked,
never a result, and the rank is always at one version.

---

## 7. Database and cost

Supabase free plan ([pricing page](https://supabase.com/pricing), read 2026-10-16): 500 MB database, 5 GB egress and 5 GB cached
egress a month, 1 GB file storage, 500,000 edge-function invocations, 50,000 monthly active users, two active projects, no
automatic backups, **projects pause after one week without activity** ([project pausing](https://supabase.com/docs/guides/platform/free-project-pausing):
a few database requests a day keep it awake; 90 days to restore). The Pro plan is $25 a month (8 GB, 250 GB egress).

What the ladder would use, at the project's scale (say 1,000 deaths a month):

| Use                                                | Per event                         | Per month at 1,000 deaths | Free plan allows                 |
| -------------------------------------------------- | --------------------------------- | ------------------------- | -------------------------------- |
| Store a build                                      | about 8 KB (10 to 12 KB as jsonb) | 10 to 12 MB               | 500 MB: 35,000 to 50,000 builds  |
| Read K = 10 opponents for sparring                 | 80 KB                             | 80 MB                     | 5 GB egress: about 60,000 deaths |
| Read the top 100 of the ladder on the title screen | about 15 KB                       | 15 MB at 1,000 views      | 5 GB: about 300,000 views        |
| The nightly job's reads                            | every build of the version, once  | 10 to 50 MB               | negligible                       |

**Nothing here approaches the free plan**, and a Pro plan is never needed for cost; the one reason to pay would be the pausing.

The structural change is a **read path for the public key**, which no table has today. Not a blanket `select` on the builds
table (one request dumps it and spends the egress): a `security definer` function `opponents(version, map, k)` that returns K
random builds of the version in a map bracket, and a `select` policy on the small `ladder` table only. Inserts stay as they are
(`with check` on sizes and ranges, as `runs` has). A trigger can cap inserts per identity per day.

---

## 8. Cheating, cheaply

Three things can be faked: a result, a build, an identity.

1. **Results** are the easy one. The sim is deterministic, so a fight is a pure function of two builds, a seed and a version:
   whoever doubts a result can re-run it. If the nightly job computes the rank (section 6), client results are never trusted and
   nothing needs verifying.
2. **Builds** are the real hole, and the same hole `runs` has today (TELEMETRY.md, Limits): anyone with the public key can
   insert anything. A faked build is at least visible on the ladder (its gear and tree can be shown), and a row can be deleted
   in the table editor. Cheap checks the nightly job (or an edge function on insert) can make, mostly from code that exists:
   - the level is 1 to 100 and `allocated.length` is at most level − 1 plus the bonus points of the maps cleared (DESIGN 5.3);
   - the allocated nodes are connected from the class start (the refund rule already requires it);
   - every item's base exists, its affixes exist, each affix's tier is allowed at the item's level and its value is within the
     tier (`src/data/affixes.ts`; new code); uniques carry their own mods; at most the base's sockets;
   - gems exist and their levels are within what drops (new code); `canEquip` (`src/run/inventory.ts`) holds for every slot.
     This does not stop a hand-made legal build; nothing short of a server-side run does, and that is not worth it at this scale.
3. **Identity.** A ladder row needs an owner so a player can find their own builds and so a cap on inserts has something to
   count. Two cheap ways:
   - a random token in `localStorage`, sent with the row: free, no accounts, cheatable by clearing storage, which is fine here;
   - Supabase **anonymous sign-ins** ([docs](https://supabase.com/docs/guides/auth/auth-anonymous)): a real `auth.uid()` per device, usable in row-level security (`owner = auth.uid()`), rate
     limited at 30 sign-ins an hour per IP; anonymous users accumulate in the auth table and are cleaned up by hand.
     Either changes the promise in TELEMETRY.md ("no id that links one run to a person") for ladder rows: the ladder must be a
     separate opt-in, not part of telemetry.
4. **Names.** A display name is the first text a player types that others would see, and needs moderation. **Generated names**
   (the game already generates item names) with a reroll avoid the problem entirely; free text can come later with a deny-list.

---

## 9. Fights at other points of a run

With the sparring code of section 6 in the client, a "Spar" button at camp costs nothing new: the same opponent read, the same
duels, a result card. Whether a mid-run build may also be **entered** on the ladder is a separate question (a snapshot a level
before death is a stronger build than the one that died).

---

## 10. The forks (for the user)

1. **What is a fight?** _Decided by the user on 2026-10-16: 5.3, the real fight, by replacing the player singleton; the plan is DUEL.md._ The
   alternatives were 5.1 crossfire (nothing to build in the sim; blind to movement, range and the defender's play), 5.2
   opponent-as-monster (days; the attacker is hurt and plays its whole kit) and 5.3' lockstep worlds (days; both play their
   kit, neither moves). The probe's bias against the Strider is the cost of anything but 5.3.
2. **What is ranked, and where does the rank live?** Map reached is already a score; PvP means something only within a map
   bracket (a map-80 build against a map-20 build says nothing). Is PvP _the_ ladder, or the order _within_ the map ladder?
   Client sparring only (colour on the death screen), or a nightly job that owns a global rank? Default difficulty only, or
   brackets by difficulty too?
3. **Versions.** Seasons that reset with each incompatible version (roughly weekly at the current pace), a nightly job that
   re-fights every build at the current version and drops the ones `migrate` rejects, or a stable serialisation of a build
   (nodes by a stable key, items by base and rolled affixes) built first so builds outlive a rebake?
4. **Identity and names.** Storage token or anonymous auth; generated names or typed; and is a separate opt-in that stores the
   whole build and an owner id, beside the anonymous telemetry, acceptable?
5. **The damage scale.** ×1 ranks the first hit; ×0.03 ranks a whole character and makes a fight a minute long. The reference
   game scales PvP damage by a curve; a single multiplier would do here. Burst or sustain?

A recommendation for the rest, if asked: the rank owned by a nightly job on the public repository, seasons by save version, a
storage token and generated names, a scale near ×0.1, and sparring on the client with the same code. But every one of these
is a choice, not a finding.

---

## 11. Sub-investigation: two characters in one world

The user (2026-10-16): the real fight is the right choice, and it should not take weeks. This section sizes it from the code.
Everything below is counted on the working tree on 2026-10-16: the non-test counts are those of commit `8fae98e`; the test
counts come from a working tree in which another session's uncommitted edits to some 115 test files were in progress, so
they will move.

### 11.1 What "one player" means in the sim, in numbers

- `World` (`src/sim/types.ts`) holds two kinds of state in one object: the **arena** (`grid`, `actors`, `projectiles`,
  `effects`, `corpses`, `drops`, `chests`, `events`, `blasts`, the four RNG streams, `t`, `tick`, `status`, `surge`, the
  Holdout and Collapse counters) and **one character's** (`player`, `char`, `build`, `flasks`, `buffT`, `chargeT`, `rage`,
  `trig`, `cooldowns`, `deployables`, `minions`, `fields`, `zones`, `banner`, `channel`, `shots`, `reprieve`, `ai`, `stats`,
  `ledger`, `dmgLog`, and about fifty more: roughly seventy fields).
- The sim reads the character's fields **918 times** across 44 files (`w.player` 185, `w.char` 154, `w.buffT` 54, `w.fields`
  47, `w.minions` 40, ...), heaviest in `skillFx.ts` (142), `combat.ts` (63), `supportFx.ts` (59), `ai.ts` (56), `utility.ts`
  (48), `fields.ts` (45), `actions.ts` (39), `deploy.ts`, `charges.ts` and `blinks.ts` (38 each), `stances.ts` (34). It reads
  the arena's fields 804 times.
- Tests read the character's fields **1,306 times in 78 files** and the arena's 592 times; `scripts/` 45 times.
- `isPlayer` appears 229 times in the sim, **86 of them negated**: `!a.isPlayer` standing for "a monster" or "an enemy".
  There are 33 literal tests of `faction` (0 is the character's side, 1 the monsters').
- Targeting is written for one character: `enemiesOf(w, a)` gives a player every living non-player actor and a monster
  `[w.player, ...w.minions]`; `findTarget` (the player AI) scans `w.actors` for `!isPlayer`; `tickMinions` picks its foes the
  same way; `separate` pushes the living non-player actors apart. Minions live in `w.minions`, not in `w.actors`;
  `actorById` searches both lists.
- The step (`stepWorld`, `world.ts:604`) is one function: the character's ticks (triggers, charges, cooldowns, buffs,
  deployables, minions, zones, flasks), the monsters' flow field toward the character, one loop over `w.actors` (`tickActor`,
  `updateAction`, then `playerAI` or `monsterAI`), more of the character's ticks (shots, channel, fields, banner, warp,
  stance, berserk, offering, supports, skill effects, proliferation), then the arena (projectiles, effects, zones, corpses,
  separation), then exit, level-up, death and abandon checks.
- Outside the sim: **47** reads of `w.player` in `render`, `ui` and `run` (the camera, `style/base.ts:99`; the HUD,
  `Hud.tsx`; skill, boss and encounter effects anchored on the character, `grim/skillFx.ts`, `bossFx.ts`, `encounterFx.ts`;
  minion lookups, `grim/index.ts`). The controller steps one world (`controller.ts:355`) and hands it to the scene once on
  `mapStart`.
- Monsters never attack deployables (no reference to `deployables` in the monster AI or abilities): totems are already
  untargetable, and would stay so for the other character.

### 11.2 Two ways to do it

> **Superseded the same day.** The user chose **A** and rejected B (a second `World` sharing the arena's arrays is a trick, not a
> design). Sized again for [DUEL.md](DUEL.md) section 3: with the compiler listing every read after each group of fields is
> removed from `World`, and one codemod carrying the 1,306 test references, A is **three to five days**, not the two to three
> weeks guessed below, which assumed hand edits. B is kept here for the record.

**A. Extract a `PlayerState`** (what section 5 priced at weeks). Move the seventy fields out of `World` into
`World.players[]` and pass the state explicitly. Every one of the 918 references in the sim and the 1,306 in tests changes,
and every signature on the hit path grows a parameter. Mechanical, but two to three weeks of churn on files that change
every day.

**B. Keep `World` as it is and call it a side.** A `World` already _is_ one character's state plus an arena. Two sides are two
`World` objects whose arena fields are **the same objects**: `grid`, `actors`, `projectiles`, `effects`, `corpses`, `drops`,
`chests`, `events`, `blasts` and the RNG streams are shared by reference, and each side adds a `sides` list and a `team`.
Then:

- the 918 character references are already right, because each runs inside its own side's tick with `w` as that side;
- the 1,306 test references keep working, because a single-player map is a world whose `sides` has one entry;
- the arena fields need no rename, because they are shared by reference (only the scalars among them need care, point 5).

What has to change is bounded and greppable:

1. **Team, not `isPlayer`.** `Actor.faction` becomes a team number: a side's own team is `w.team` (0 for the first side, 1 for
   the second; monsters keep 1, and a later mode with monsters _and_ two characters gives them a team of their own), and
   "enemy" means a different team. The 33 literal tests become `=== w.team` or `!== w.team`. `enemiesOf`, `findTarget`,
   `tickMinions`' foes, `separate`, the hazard dodge (`ai.ts:332` reads `e.faction === 1`) and `actorById` read teams and the
   other sides' `player` and `minions`. Projectiles and ground effects carry their owner's team.
2. **The 86 negated `isPlayer` tests.** Each means one of three things: "has monster stats" (keep, as `a.mon`), "is an enemy
   of the actor acting" (team), or "is not this side's character" (`a !== w.player`). The 30 in `combat.ts`, 13 in
   `skillFx.ts` and 7 in `supportFx.ts` sit on the hit path and are the ones that would otherwise silently exclude the other
   character from on-hit effects (`src.isPlayer && !dst.isPlayer` gates `rollStatuses`, `applyPlayerHexes`,
   `afterPlayerHit`, culling, the ledger). A day's reading, with a test per kind of effect. In the same pass, the 46
   non-null assertions on monster stats (`.mon!`: 13 in `bosses.ts`, 8 in `ai.ts`, 2 in `combat.ts`) are checked for a
   character that could reach them as `src` or `dst`.
   **Collision** is part of this too: `separate` leaves out every `isPlayer` actor, and `separateMinions` pushes a side's
   minions against the monsters and its own character only, so two characters would stand inside each other (melee reach is
   `range + r + r`, so an overlapping pair always hits), and a character inside the other side's minions. Characters must
   separate from each other and from the other side's minions.
3. **The defender's side on the hit path.** A hit is made inside the attacker's side tick, so `w` is the attacker's side;
   everything read _for the defender_ under `dst.isPlayer` must read the defender's side instead: `w.shell`, `w.guard`,
   `w.channel`, `w.flasks`, `w.char.frostSpec`, `w.stats.damageTaken`, `w.dmgLog`, `w.ledger.taken`, `w.trig` (hit-taken
   triggers), `reprieveFires(w)`, `invulnerable(w)`, `lifeCap(w, a)`, `notePools(w, ...)`, `onMonsterHitPlayer(w, ...)`.
   A back-reference `Actor.side` (set on a side's character and minions) gives `const wd = sideOf(w, dst)`. About 40 of the
   81 `isPlayer` sites in `combat.ts` and the helpers they call; the same for ailments and skill DoTs put on a character
   (`afflict.ts`, `skillDots.ts`). The recovery step and DoT ticks in `tickActor` need nothing: they run in the owner's side
   tick (point 4).
4. **The step, with today's order as its spine.** The sub-steps of `stepWorld` keep their order; each is either a side's
   (triggers, charges, cooldowns, buffs, deployables, minions, zones, flasks, shots, channel, fields, banner, stance, skill
   effects, the level-up and death checks: run once per side, in an order that alternates by tick parity) or the arena's
   (the clock, clearing the events, effects, corpses, separation: run once, for the host side). The one loop over
   `w.actors` stays one pass in id order, and dispatches each actor to its owner's side: `tickActor`, `updateAction` and
   `playerAI` run with `w` as the side that owns the actor (`Actor.side`), monsters with the host. `updateProjectiles` keeps
   its slot and runs once per side over **that side's projectiles**, so `w` is the attacker's side in every hit a projectile
   makes. A single-player world then calls exactly the functions it calls today, in the same order, so no event hash changes
   (11.4). A split into "all of A's ticks, then all of B's, then the arena" would move the monster loop and break the hash on
   day one.
5. **Shared scalars.** `t` and `tick` advance in lockstep (each side adds the same `dt`); `nextId` (46 sites of `w.nextId++`)
   must be one counter: an `ids` object shared by reference, or the duel stepper copies it across at each side boundary;
   `events` is cleared once a tick; `status` stays per side (a side is `dead` when its character is) and the duel ends when
   any side is.
6. **The player AI in a duel.** `playerAI` engages as it stands (target by team, kite, dodge the other team's telegraphs,
   choose a skill by the strategy), but its modes assume a labyrinth: `advance` walks waypoints (a duel plan has one), the
   engage range is 9 tiles, and the stall breaker drops a target that takes no damage for a while (an opponent who
   out-regenerates would be "skipped"). A duel option: engage the nearest enemy anywhere, no loot, no exit, and a stall is a
   draw. The monsters' reads of `w.player` (`abilities.ts` 13, `bosses.ts` 8, `factions.ts` 7, `fields.ts` 8, `encounters.ts`
   4, `movement.ts` 3) keep meaning "the host side's character": they are not on the duel's path.
7. **Order and fairness.** The side stepped first each tick lands the first hit in a tie; alternate the order by tick parity
   (deterministic, and symmetric over a fight). The RNG streams are shared, so the order fixes the draws.
8. **Creation and result.** `createWorld(plan, buildA)` as today; `addSide(world, buildB, team, position)` makes the second
   side on the same arena; `runDuel(buildA, buildB, seed, opts) → DuelResult` (the winner, the time, each side's ledger and
   recap) for the ladder job and the probe. The dummy arena's plan serves as the duel's.

What does not change: `calc`, `data`, `gen`, the convergence tests, and every single-player path.

### 11.3 What a watchable fight adds

`MapScene.build(world)` takes one world, which becomes the host side. The scene draws `world.actors` (both characters, since
the list is shared) but reads `minions`, `deployables`, `fields`, `zones` and `flasks` from one side (`grim/index.ts` 3 sites,
`grim/skillFx.ts` about 8): draw them for every side in `world.sides`. The camera follows `world.player` (`base.ts:99`): a
camera target option (the host's character, or the midpoint). Skill and buff effects anchored on `w.player`
(`grim/skillFx.ts`, 8 sites) anchor on the event's actor instead (events carry `src` ids); the boss and encounter effects
are not on the duel's path. The HUD reads one side: render it once per side (the second mirrored) or once for the host. The
controller's `onFrame` steps `this.world`; a duel mode steps the sides and ends in a duel result screen instead of
`endMap`; the run's map flow (`finishMap`, the Crawl, reprieves) is untouched. One to two days.

### 11.4 Keeping the sim exactly as it is: the hash fence

- `runMap` hashes every event of every tick (`eventHash`), and `runMap.test.ts`, `x8.test.ts`, `x9.test.ts` and
  `factions.test.ts` already check determinism with it. Before the refactor, record the event hash of some sixty bot maps
  (six classes, ten maps each, fixed seeds) with a twenty-line script; after every step of the refactor the hashes must be
  identical, because a single-player world must produce the very same events in the same order. This catches what the test
  suite does not: a reordered sub-step, a moved RNG draw, a missed side lookup. Beside it, `npm run check` (2,804 tests) and
  `npm run perf` (a tick must not get slower; sharing by reference adds no indirection to the hot paths).
- **A missed side lookup becomes a compile error, not a silent bug.** On the hit path (`applyHit`, `applyDamage`, `afflict`,
  the status and hex appliers) the world parameter is renamed `ws` (the attacker's side) and `const wd = sideOf(dst)` is
  taken at the top, so no `w` is in scope: any `w.` left behind fails `tsc`. This is the first line of defence; the tests
  below are the second.
- Duel tests with **asymmetric builds** prove the side lookup: only B has a Slag Carapace, so A's hit on B is absorbed by B's
  shell and A's `shell` stays null; B's flask fires when B is hurt, not A's; a kill of B's minion credits A's ledger; A's
  ignite on B ticks against B's resistances; the same build on both sides ends in a draw or a coin flip over seeds, never a
  fixed win for the first side.

### 11.5 Estimate

| Step | Work                                                                                                                                                                            | Days     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| D0   | The hash fence; sides, team, the shared arena, the step split, `runDuel`; two characters with weapons alone hitting each other headlessly                                       | 1 to 2   |
| D1   | The hit path with `ws`/`wd`; the 86 negated tests and the `.mon!` sites; `enemiesOf`, `findTarget`, `tickMinions`, `actorById` by team; character and foreign-minion separation | 1 to 2   |
| D2   | The kits across sides: minions, deployables, fields, zones, projectiles, triggers, reprieves, flasks; the asymmetric tests                                                      | 1 to 2   |
| D3   | The duel AI: engage anywhere, no advance, loot or exit; a stall is a draw; the order alternation; the damage scale as an option                                                 | 0.5 to 1 |
| D4   | Watchable: the scene draws every side, the camera, two HUDs, the controller's duel mode, a result screen                                                                        | 1 to 2   |

**Five to nine working days** for B, most of it one careful reading of the hit path (superseded: the user chose A, and
DUEL.md section 7 is the estimate of record).
The risks: a missed side lookup (A's shell absorbing B's damage), which the `ws`/`wd` renaming turns into a compile error
and the asymmetric tests and the hash fence catch after that; `World` grows `sides`, `team` and a `side` back-reference on
actors, which is a little untidy for a type that was one thing; monsters together with two characters is left for later.
