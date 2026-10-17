# Bob — Duels: asynchronous fights against other players' characters

Status: **F0 to F2 built on 2026-10-16** (the plan was the second draft of 2026-10-16, after the user rejected the two-world
engine of the first); F3 to F7 are not built; see "Built" under section 7 · Owner: the user · Author: Claude

A duel is a real fight, watched in the game, between the player's character and a **rival**: a snapshot of another player's
character (class, level, passive tree, gems, items and Strategy settings) taken when that player's run ended. The rival is
played by the same AI that plays the player's own character, with its own settings, so what the other player built is what
fights. Nobody is online at the same time: the snapshot is fetched, and the fight is simulated and drawn on the player's
machine. [LADDER.md](LADDER.md) is the investigation this plan comes from (its section 11 counts the coupling; its section 10
holds the ranking questions, which this plan leaves open, section 13).

Conventions follow DESIGN.md: every number is a first guess and _tunable_; `core`, `data`, `mods`, `calc`, `gen`, `sim` and
`run` stay headless (§14.2); no `Math.random`, `Date.now` or `performance.now` outside `render` and `ui`; every player-visible
name is ours and passes `src/data/ip.test.ts`; in-game text is concise (CLAUDE.md). Decisions the spec does not cover go in
DESIGN.md Appendix A on approval (section 11).

---

## 1. Summary

| Part                       | What it is                                                                                                                                                                                                             | Milestones |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Sides** (the engine)     | The player singleton goes: `World` is the arena, `World.sides` the characters in it, each with everything of theirs. Functions act for a side; the hit path reads a side from the actor. Every kit works across sides. | F0 to F3   |
| **The rules of a duel**    | How a duel starts and ends, what each side brings, the damage scale, fairness of the step order.                                                                                                                       | F4         |
| **The watchable duel**     | A round arena in a biome's look, both characters and their kits drawn, a HUD per side, the speed controls, a result screen.                                                                                            | F5         |
| **Rivals** (the snapshots) | A character captured at the end of a run (opt-in), named, sent to a small table; fetched by version and depth; bot characters fill the pool while it is small.                                                         | F6         |
| **The screens**            | "Fight a rival" from the run summary: a pick of rivals, the duel, the result, "Again"; a local record of results.                                                                                                      | F7         |

Ten to seventeen working days (section 10), of which the extraction of the singleton is three to five. Ranking, seasons and
identity beyond a storage token are **not** in this plan (section 13).

---

## 2. Premises (the user, 2026-10-16)

1. **The real fight.** Two full characters in one world, not a proxy (the crossfire and the opponent-as-monster of LADDER.md
   section 5 are rejected). Movement, range, kiting, dodging, flasks, minions and every other part of a kit count, on both sides.
2. **Replace the singleton; no second world.** The first draft of this plan kept `World` as "one character plus an arena" and
   made a duel two `World` objects sharing the arena's arrays by reference. Rejected: the sim gets one `World` holding its
   sides, and the code that reads "the player" is changed to read the side it acts for. The result is a cleaner type and a sim
   that can hold any number of characters, at the cost of touching every read of the singleton once (section 3.3).
3. **Watched, not headless.** The duel is drawn by the game's renderer like a map, at the map's speeds.
4. **Asynchronous.** The rival is a snapshot of an older run; the two players are never online together. The fight runs on the
   player's machine.
5. **The rival behaves exactly like the player's own simulated character:** the same AI (`src/sim/ai.ts`), with the rival's own
   Strategy tab settings (roles, order, target priority, spacing, flask thresholds: `src/data/strategy.ts`), tree, gems and items.
6. **Costs stay near zero** (LADDER.md section 7); cheating is tolerated at this scale, cheap protections welcome (section 9).

---

## 3. The engine: sides

### 3.1 The types

`World` (`src/sim/types.ts`) today holds the arena and one character's state in one object. After the extraction:

```ts
/** One character in the world and everything of theirs. Side 0 is always the local player's. */
type Side = {
  id: number; // index in world.sides
  team: number; // sides have their own teams; MONSTERS is theirs
  player: Actor; // the character (Actor.side points back here)
  char: Character;
  build: Build;
  primary: SkillChoice;
  flasks: FlaskState[];
  ai: PlayerAI;
  stats: SideStats; // kills, xpGained, stuck, stalls, kites, wallBlocked, picked, damageTaken, damageDealt
  ledger: Ledger;
  dmgLog: DamageRecord[];
  reprieve: ReprieveState;
  xp: number;
  picked: AnyItem[];
  opts: SideOpts; // start vitals, freeResources, godMode, reprieves, duel
  // Charges, buffs, rage, the triggers, cooldowns and openers: chargeT, buffT, rage, rageT, rageDrain, rageGainT, trophy, trig,
  // secondaryReady, guard, cooldowns, utilityReady, openers, auraBurnT, berserkT, chars.
  // Summons and ground: deployables, deploySeq, minions, fields, zones, banner, offering, warp, wither, caught.
  // The skills' running state: uses, intensity, intensityT, seals, mirage, inspireMana, infusing, shockCd, inShock, critLock,
  // critSeen, elem, elemLast, staticFx, shell, virulence, surgeMana, relicRegen, relicT, trailT, vortex, markers, stormOrb,
  // fuses, spores, charged, inFx, lastTravel, channel, stacks, hitsLanded, shots, lastOutcome.
};

/** The arena: what every side shares. */
type World = {
  plan: MapPlan;
  grid: Grid;
  t: number;
  tick: number;
  nextId: number;
  rngCombat: Rng;
  rngAi: Rng;
  rngLoot: Rng;
  rngTrig: Rng;
  sides: Side[];
  actors: Actor[]; // characters and monsters (minions stay in their side's list, as today)
  projectiles: Projectile[];
  effects: GroundEffect[];
  corpses: Corpse[];
  blasts: Blast[];
  drops: Drop[];
  chests: Chest[];
  events: SimEvent[];
  status: MapStatus; // the map's: 'dead' when side 0's character dies on a map; a duel reads its sides instead
  abandonT: number | null;
  abandonAuto: boolean; // the map's abandon (side 0's choice)
  surge: number;
  collapseFront: number;
  collapseGap: number;
  holdout: HoldoutState;
  exitOpen: boolean;
  endRoom: number;
  hasPylons: boolean;
  opts: WorldOpts; // abandonPolicy, loot, chestLoot, autoAbandonAt, maxTime
};
```

Seventy-two fields move to `Side` (the ones listed and in the comments); twenty-nine stay on `World`. `Actor` gains
`side: Side | null` (null for a monster) and `team` replaces `faction`; `Projectile` and `GroundEffect` carry `team`.
Monsters keep **1**, today's value, so nothing an event or a hash carries moves; sides take 0 and 2, and a later side 3.
`Minion extends Actor` keeps its side from the summoner. `WorldOpts` is split: what the map decides stays, what a character
brings (`start`, `freeResources`, `godMode`, `reprieves`, and the new `duel`) moves to `SideOpts`.

### 3.2 How a function knows its side

Three patterns, and no fourth:

| Pattern                               | Rule                                                                                                                                                                                                                                                                                                                                                                               | Where                                                                                                                                                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Acts for a side: `(w, s, ...)`**    | A function that ticks or uses a character's own state takes the side right after the world. The step loops over `w.sides` and passes each.                                                                                                                                                                                                                                         | `tickFlasks`, `tickBuffs`, `tickTriggers`, `tickDeployables`, `tickMinions`, `tickFields`, `playerAI`, `chooseSkill`, `fire` for a character, the skill effects, supports, blinks, banners, channel...                         |
| **Acts on actors: `a.side`**          | A function given a source or a target actor reads the side from the actor: `src.side` for what the attacker owns (its `char`, `hitsLanded`, `critLock`, `lastOutcome`, `ledger.dealt`), `dst.side` for what the defender owns (`shell`, `guard`, `channel`, `flasks`, `trig`, reprieves, `ledger.taken`, `dmgLog`, `stats.damageTaken`). `null` means a monster: the monster path. | `applyHit`, `applyDamage`, `afflict`, statuses, hexes, skill DoTs, `lifeCap`, `fireTriggers` on hit taken, the recap, the ledger                                                                                               |
| **Hunts a character: `hunted(w, m)`** | A monster that "chases the player" chases the nearest living side's character (on a map, the only one). The flow field is built per side that monsters hunt (one on a map).                                                                                                                                                                                                        | `monsterAI`, the flow field, abilities, bosses, factions, encounters, the monsters' fields and telegraphs (`w.player` in `abilities.ts` 13, `bosses.ts` 8, `factions.ts` 7, `fields.ts` 8, `encounters.ts` 4, `movement.ts` 3) |

Convention for the viewer: **side 0 is the local player's**. The renderer, the HUD and the controller read `w.sides[0]` where
they read `w.player` today, and a side where they draw one side's kit. The bot and the scripts read `w.sides[0]`.

### 3.3 The extraction, driven by the compiler

The singleton is removed one group of fields at a time. Removing a group from `World` makes `tsc` list every read of it
(918 in the sim, counted in LADDER.md 11.1); each is rewritten by the pattern of 3.2, and a function that gains an `s`
parameter has its callers fixed by the same compiler pass. After each group the hash fence (section 8.1) must be identical:
the single-player sim produces the very same events in the same order. Each group is a commit.

| Group | Fields                                                                                                                                                                                                                                                                                                                                                                  | Reads in the sim | What needs thought                                                                                                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1    | `flasks`, `ai`, `stats`, `picked`, `dmgLog`, `ledger`, `reprieve`, `xp`, the `SideOpts` split                                                                                                                                                                                                                                                                           | about 80         | The ledger and the damage log take the defender's side; `stats.damageDealt` the attacker's.                                                                                                             |
| G2    | `chargeT`, `buffT`, `rage*`, `trophy`, `trig`, `secondaryReady`, `guard`, `cooldowns`, `utilityReady`, `openers`, `auraBurnT`, `berserkT`, `chars`                                                                                                                                                                                                                      | about 140        | Triggers fire on the side of the actor that was hit or that hit; a guard is the defender's.                                                                                                             |
| G3    | `deployables`, `deploySeq`, `minions`, `fields`, `zones`, `banner`, `offering`, `warp`, `wither`, `caught`                                                                                                                                                                                                                                                              | about 160        | A field or a zone hurts enemies of its owner's team; a minion carries its summoner's side; the offering is its side's.                                                                                  |
| G4    | The skills' running state: `uses`, `intensity*`, `seals`, `mirage`, `inspireMana`, `infusing`, `shockCd`, `inShock`, `critLock`, `critSeen`, `elem*`, `staticFx`, `shell`, `virulence`, `surgeMana`, `relic*`, `trailT`, `vortex`, `markers`, `stormOrb`, `fuses`, `spores`, `charged`, `inFx`, `lastTravel`, `channel`, `stacks`, `hitsLanded`, `shots`, `lastOutcome` | about 175        | All the attacker's, read through `src.side` on the hit path and through `s` in the effects' ticks; `shell` is the defender's.                                                                           |
| G5    | `player`, `char`, `build`, `primary`, `team`; `faction` becomes `team`; `hunted`; `enemiesOf`, `findTarget`, `actorById`, `separate`, the hazard dodge by team                                                                                                                                                                                                          | about 365        | The 229 `isPlayer` sites (86 negated: "has monster stats" → `a.mon`, "is an enemy" → team, "is not this character" → `a !== s.player`); the 46 `.mon!` assertions; the monsters' `w.player` → `hunted`. |

The step (`stepWorld`, `world.ts:604`) keeps today's order of sub-steps as its spine. A sub-step that acts for a side runs
once per side (the order of sides alternating by tick parity, so that with one side nothing changes); one that belongs to
the arena runs once. The single loop over `w.actors` stays one pass in id order, dispatching each actor by `a.side`
(`playerAI(w, a.side)` for a character, `monsterAI` for a monster). `updateProjectiles` runs once and reads each projectile's
owner's side. `nextId`, the clock and `events` are the arena's and need nothing.

**Tests** read the moved fields 1,306 times in 78 files, always as `w.<field>` or `world.<field>` (584 `w.player`, 140
`world.player`, 112 `w.char`, 69 `w.buffT`...). A codemod rewrites them to `w.sides[0].<field>`, **run after each group for
that group's fields** (so that every group leaves the suite green; `w.player` moves with G5); the two `as World` casts
(`grim/skillFx.test.ts`, `areaSpots.test.ts`) are fixed by hand. No test's meaning changes. `scripts/` has 45 such reads and
gets the same passes. In `src/sim` itself `sides[0]` is **not** a spelling of the singleton: it may appear only where the
map's own result is built (`runMap.ts`, `vitals.ts`, `recap.ts`, `createWorld`); everywhere else a function takes `s`,
reads `a.side` or calls `hunted`. `render`, `ui` and `run` read the moved fields 101 times (the camera, the HUD, the skill effects
anchored on the character, the controller, the gallery, the bot): `w.sides[0]` by the convention above, and a side parameter
where a component draws one side's kit.

What does not change: `calc`, `data`, `gen`, the convergence tests, the event hashes, and every number.

### 3.4 Two characters, one AI

Each side runs `playerAI(w, s, dt)`: its own `Strategy` (roles, order, `target`, `spacing`, `lifeFlask`, `utilityFlask`), its
own flask policy, kiting, telegraph dodging, openers and escapes. Nothing in the AI knows which side is the player's. A duel
option on the side (`s.opts.duel`) changes only what a labyrinth assumed: the character engages the nearest enemy at any
distance (no `advance` along waypoints), never loots, never seeks an exit, and a stall (section 4.3) ends the duel instead of
skipping the target.

Totems, brands, traps and mines are not actors and cannot be attacked by anyone, today as in a duel (monsters never attack
them either); a later plan may give them life.

---

## 4. The rules of a duel

### 4.1 What each side brings

| Brought                                                                                                          | Left behind                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The `Build`: class, level, allocated passives, equipment with sockets and gems, flasks, `primaryGem`, `strategy` | Provisions (per-map buffs, armed at camp and burnt by a map), Reprieves (consumables of the run), the map's affixes, the difficulty settings (monsters only) |
| Full life, mana, energy shield and flask charges; no charges, buffs or rage                                      | Carried-over vitals (`run.vitals`)                                                                                                                           |
| The character at its own level: `areaLevel = build.level`, **no resist penalty** for either side                 | The map tier's penalty (a map-70 character fought at −60% in its own maps; the duel is symmetric instead)                                                    |

### 4.2 The arena

A round arena of the shape `gen/bossArena.ts` gives (the boss fights' room: `BOSS_ARENA_RADIUS` 11, so about 25 tiles across
with its rim), dressed in a biome rolled from the duel's seed (`src/data/biomes.ts`: tiles, light, props) so it is drawn like
any map. The two characters start **10 tiles apart**, facing each other, once the duel option of F4 makes them engage at any
distance. F2 and F3 use the dummy arena of `src/sim/dummy.ts` (open floor, 30 × 30) with the characters **8 tiles apart**,
inside the stock AI's engage range of 9, so that they fight without the option; F5 brings the round arena.

### 4.3 How a duel ends

| End                                                                 | Result              |
| ------------------------------------------------------------------- | ------------------- |
| A character dies (reprieves are not brought, so a death is a death) | The other side wins |
| Both die in the same tick                                           | A draw              |
| **Time cap** 90 s                                                   | A draw              |
| **Stall**: neither character has taken damage for 15 s              | A draw              |

`DuelResult`: `{ winner: 0 | 1 | null, how: 'death' | 'time' | 'stall', time, sides: [{ recap, ledger, lifeLeft }] }`. The
ledger of each side (damage dealt and taken by source, `src/sim/ledger.ts`) is the result screen's material.

### 4.4 Fairness

- **Order.** The side stepped first in a tick lands the first hit in a tie. The order alternates by tick parity, so over a
  fight neither side is first. The RNG streams are shared; the order fixes the draws, so a duel is a pure function of the two
  builds, the seed and the game version.
- **Seeds.** A duel's seed is drawn by the client (`Rng` from a run-independent source: the rival's id and a counter kept in
  the local record, section 6.5), so "Again" is a new fight and the same two builds can be fought as many times as wanted.
- **Damage scale.** LADDER.md 4.3 found that at the game's numbers a fight is over in a few seconds and the first hit decides
  it, and that scaling damage down changes who wins. The engine takes `duel.damageScale` (a multiplier on damage taken by
  characters, both sides). **F4 measures** fight lengths among bot builds with the real engine and proposes a default that
  gives a median fight of 15 to 40 s; until then the default is ×1. The number is recorded in Appendix A when chosen.

---

## 5. The watchable duel (F5)

- **Scene.** `MapScene.build(world)` draws `world.actors` (both characters) and every side's `minions`, `deployables`,
  `fields` and `zones` (`grim/index.ts` 3 sites, `grim/skillFx.ts` about 8 read one side today). Skill and buff effects
  anchored on the character anchor on the event's actor instead (events carry `src` ids). The figure rig reads a character's
  class from its side's `build`, so the rival is drawn as its own class.
- **Camera.** `style/base.ts:99` follows the character; a camera target option: the midpoint of the two characters, clamped to
  the arena.
- **HUD.** `Hud({ c })` becomes `Hud({ c, side })`: side 0 on the left as today, the rival's mirrored on the right, each with
  its orbs, flasks and statuses. On a phone (docs/MOBILE.md) the rival's HUD is a single bar across the top: name, life,
  energy shield. The speed controls (1× to 8×, pause) are shared.
- **Controller.** A duel mode beside the showcase and the gallery (`controller.ts`, `launchShowcase` is the precedent for a
  world outside a run): `startDuel(build, rival, seed)` builds the arena plan, `createWorld` with two sides, emits `mapStart`;
  `onFrame` steps as usual and, while `this.duel` is set, reads the duel's end from the sides **before** the map's status
  check (`stepWorld` sets `'dead'` only for side 0's character); the end goes to the duel result screen, never to `endMap`,
  so the run's map flow (`finishMap`, Crawls, reprieves, telemetry) is untouched.
- **Result screen** (`src/ui/DuelResult.tsx`): who won and how, the time, each side's damage dealt by skill and taken by source
  (the ledger), and "Again" (a new seed), "Another rival", "Back".

---

## 6. Rivals (F6, F7)

### 6.1 The snapshot

```ts
type Rival = {
  id: string; // the row id
  name: string; // generated (6.4), never typed
  classId: string;
  level: number;
  map: number; // the map the run ended on
  outcome: 'died' | 'won';
  difficulty: Difficulty; // shown on the card; not used in the fight
  saveVersion: number; // SAVE_VERSION at capture: the format of `build`
  gameVersion: string; // the commit, as telemetry sends it
  bot: boolean; // a character the bot built, to fill the pool
  build: Build; // class, level, allocated, equipment with gems, flasks, primaryGem, strategy
};
```

`build` is `run.build` as it is (3 to 9 KB of JSON, LADDER.md 4.1); nothing else of the run is sent. A rival is fightable only
at its `saveVersion`: a rebake renumbers the tree and bumps `SAVE_VERSION` (CLAUDE.md), so the version is the right key. When
a snapshot is loaded, `new Character(build)` and a check that every allocated node, base, affix, gem and unique id exists at
this version decide whether it is offered; one that fails is skipped, not shown.

### 6.2 Capture

When a run ends (`Controller.onRunEnd`, where telemetry hooks in), if the player has opted in, the snapshot is posted to the
`rivals` table. **Opt-in, separate from telemetry:** the first time the summary screen offers a duel, one line and a checkbox
("Add this character to the rivals other players fight"), remembered as a preference; a second checkbox on the title screen
beside telemetry's. The character of a run that ended in a death and one that won are both worth fighting.

### 6.3 The pool

`docs/rivals.sql`, run once like `docs/telemetry.sql`:

- table `rivals` (id, created_at, name, class_id, level, map, outcome, difficulty jsonb, save_version, game_version, bot,
  token_hash, build jsonb with `pg_column_size(build) < 16384`, length and range checks as `runs` has);
- the public key may **insert**, with the checks, and may **not select** the table: it reads through one function,
  `rivals_for(save_version int, map int, k int, exclude_token_hash text)`, `security definer`, which returns K rows of
  that version within ±10 maps of `map` (widening to ±25 if fewer than K), not the caller's own, newest first with a random
  tiebreak, players before bots. It returns a declared row type **without** `token_hash` and `created_at` (a `setof rivals`
  would hand every caller the tokens that exclude rows and count inserts);
- a trigger caps inserts at 20 a day per `token_hash`;
- rows of a save version older than the three most recent, or older than 90 days, are deleted by hand or by `pg_cron`.

`src/run/rivals.ts` (headless; `fetch` injected like `postRecords` in `telemetry.ts`): `postRival`, `fetchRivals`, the
validation of 6.1, and the token: a random id in `localStorage` (`bob.rival.token`), hashed before sending, used only to
exclude the player's own rivals and to count inserts. **Bots fill the pool:** `npm run sim -- --rivals` posts the bot's
character at the end of each run as `bot: true`, so the pool has rivals at every version from day one; the function offers
them only when fewer than K players are there.

Cost at 1,000 deaths a month: 10 MB of rows and 40 KB of reads per duel screen; nothing near the free plan (LADDER.md
section 7). The reads keep the project from pausing.

### 6.4 Names

A rival's name is **generated**, never typed: two word lists in `src/data/rivalNames.ts` (an epithet and a place or a trait,
"the Ashen Sentinel of the Low Road"), chosen from the snapshot's seed; the player may reroll before sending. Every word passes
`src/data/ip.test.ts`. No free text means no moderation.

### 6.5 The screens (F7)

- **Summary** (`src/ui/Summary.tsx`): under the recap, a button "Fight a rival" (and the opt-in line the first time). The run
  stays loaded until Quit, so `run.build` and `run.map` are there.
- **Rivals** (`src/ui/Rivals.tsx`): K = 5 cards from `rivals_for`: name, class, level, map reached and outcome, the build
  signature (`buildSignature`: main gem, keystones, uniques), a bot mark; pick one. While the pool is empty or offline, a
  line says so and offers the player's own saved runs (`listSlots`: their characters as they stand at camp, no network and
  no wait; a bot build would cost 5 to 45 s to play out and is kept for the Debug panel).
- **Duel**: the map screen in duel mode (section 5), then **Duel result** (5), then back to Rivals or the summary.
- **Record**: `localStorage` `bob.rivals.record`: per rival id the fights, wins and the last seed; the Rivals screen shows
  "won 2 of 3" on a card, and the summary's line "You beat 3 of 5 rivals" after a set. No upload of results in this plan
  (section 13).
- **Camp** (later, out of this plan): the same screens from a "Spar" button, with the character as it stands.

In-game text: a card says who the rival is and what they reached; the result says who won, how, and the two ledgers. Nothing
explains the obvious.

---

## 7. Milestones

| Id     | Milestone          | Work                                                                                                                                                                                                                                                                                                                                                                           | Done when                                                                                                                                                                                                                                                                                                      | Days     |
| ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **F0** | The fence          | `scripts/hash-fence.ts` (8.1), recorded before any change; `Side` as `{ id, team }` only (it grows a group at a time), `Actor.side`, `World.sides` with one side built by `createWorld`; no field moved yet.                                                                                                                                                                   | The fence records and matches itself; `npm run check` green.                                                                                                                                                                                                                                                   | 0.5      |
| **F1** | The extraction     | Groups G1 to G5 of 3.3, one commit each, the test and script codemod after each group, `render`, `ui` and `run` by `w.sides[0]`, `hunted`, `team` for `faction`, `enemiesOf`, `findTarget`, `tickMinions`, `actorById`, `separate` and the hazard dodge by team; no field of a side left on `World`.                                                                           | The fence is identical after every group; `npm run check` and `npm run perf` unchanged; in `src/sim`, `sides[0]` appears only in `runMap.ts`, `vitals.ts`, `recap.ts` and `createWorld` (3.3).                                                                                                                 | 3 to 5   |
| **F2** | Two characters     | `createWorld` takes any number of characters (`CreateWorldInput.sides: { build, x, y, opts }[]`; a map passes one at the plan's start); `runDuel(a, b, seed, opts) → DuelResult` in `src/sim/duel.ts`; two class starters with weapons alone fight headlessly on the dummy arena, 8 tiles apart; characters collide with each other and with foreign minions.                  | `runDuel` of two starters ends with **one dead** (a draw by the cap means they never engaged, and fails); `src/sim/duel.test.ts`: only B has a Molten Shell and A's hit is absorbed by B's shell while A's stays null; B's flask fires when B is hurt, not A's; A's ignite on B ticks against B's resistances. | 1 to 2   |
| **F3** | Kits across sides  | Minions (target, are targeted, separate), deployables, fields and zones, projectiles and shots, triggers, charges, buffs, channel, blinks, banners, offerings, supports' counters; `scripts/duel.ts` (two builds from saves, bot builds or the probe's snapshots: the result and both ledgers); the bot-versus-bot matrix of `scripts/ladder-probe.ts` re-run with real duels. | A test per kit (a minion of B attacks A; A's totem shoots B; B's field burns A; A's trigger fires on B's hit); every active gem duels without an exception (a smoke test like `gemSmoke.test.ts`); the fence still matches.                                                                                    | 1 to 2   |
| **F4** | The rules          | `SideOpts.duel`: engage anywhere, no advance, loot or exit; the ends of 4.3; order alternation; `damageScale`; the measurement of fight lengths and the default (4.4); the symmetry test.                                                                                                                                                                                      | The same build on both sides wins about half over 100 seeds; fight lengths measured and the default recorded in Appendix A; `docs/PLAYER-AI.md` gains a section on duels; the fence still matches.                                                                                                             | 0.5 to 1 |
| **F5** | The watchable duel | The round arena in a biome's look; the scene draws every side; effects by actor; the figure rig by side; the camera; `Hud({ c, side })` and the phone bar; `startDuel` and the controller's duel mode; `DuelResult.tsx`; "Again"; a Debug panel entry that starts a duel against a bot build.                                                                                  | A duel between the current character and a bot build can be watched from the Debug panel at every speed, on a phone layout too; no console errors; the HUDs follow both sides.                                                                                                                                 | 2 to 3   |
| **F6** | Rivals             | `Rival`, `src/run/rivals.ts` (post, fetch, validate, token, names), `docs/rivals.sql` run on the project, the opt-in preference and checkboxes, capture in `onRunEnd`, `npm run sim -- --rivals`, TELEMETRY.md's new section.                                                                                                                                                  | A death with the opt-in posts a row the table accepts; `rivals_for` returns K rows of the version near the map, none of the caller's; a row with an unknown gem id is skipped by the client; the bot has seeded the pool at the current version.                                                               | 1 to 2   |
| **F7** | The screens        | "Fight a rival" on the summary, `Rivals.tsx`, the local record, the summary line, the offline fallback; patch notes.                                                                                                                                                                                                                                                           | From a death: pick a rival, watch the duel, see the result, fight again, fight another; the record persists across reloads; works offline against one of the player's own saved runs; `npm run check` and `npm run build` green; the patch notes entry filed.                                                  | 1 to 2   |

Order: F0 to F4 are the engine and are measured headlessly; F5 is independent of F6; F7 needs both. Commits at the end of
each milestone and of each group of F1; the fence runs before every one of them.

**Built: F0 and F1 (2026-10-16).** As planned, with these differences and findings:

- **The fence** (`npm run fence`) hashes each map's whole `MapResult` and the run's whole `BotRunResult` as well as every tick's
  events, and has `--deep` (maps 1 to 30, seeds 1 to 3) and `--events`; `BotRunOpts.onMap` was added so that it can read each map's
  result. The default fence takes 20 seconds, not two minutes. Main's own hashes were re-recorded before every merge of main.
- **`Actor` was one field from V8's cliff**: a literal of 128 or more properties makes the sim about 15% slower, so `Actor.side`
  was first assigned after `newActor`'s literal. The compound fields were then grouped into sub-objects (`since`, `leech`, `chase`,
  `dash`, `hex`, ... : 88 properties, a test holds it under 100) and `side` is in the literal again (PERFORMANCE.md section 5).
- **`WorldOpts` is split in two, but callers still hand `createWorld` one bag**, `MapOpts = WorldOpts & SideOpts`, which it splits;
  one bag per side is F2's `CreateWorldInput.sides`.
- **Damage, and kills, with no attacker named** (a damage-over-time tick, `rawHit`, `killActor`) are credited to the side the
  monster hunts (`hunted`): `applyDamage`'s source is a label (`DmgSrc`), not an actor, and a damage-over-time tick does not record
  whose it is. F3's "a kill of B's minion credits A's ledger" needs the attacker's side carried by `DmgSrc` and by the debuffs.
- **A monster has no side**, and the per-use scratch fields of a character (the crit roll its strikes share, the outcome of a blow,
  how far a leap carried it) are only written for an actor that has one; a monster never set them.
- **`hunted(w, m)` takes any position** (a projectile, a blast, a corpse) and, with one side, returns the character with no search
  (a search on every call cost 5% of the sim). It is the one place in `src/sim`, beside `runMap.ts`, `vitals.ts`, `recap.ts`,
  `createWorld` and the two test helpers `gemKit.ts` and `dummy.ts`, that reads `sides[0]`.
- **`isPlayer` stays and means "a character".** Its negated sites were each read: the ones that meant "an enemy of this character"
  are team tests (about eighty scans, the hit path, the helpers `enemiesNear`, `enemiesAt`, `enemiesIn` and `hazardAt`, which take
  the team); the ones that meant "a monster" stay or became `x.mon` / `x.enc`. What was **not** done, and is F3's: the guards that
  keep a skill's damage-over-time debuffs, statuses and knockback off a character (`applySkillDot`, `applyStatus`, `rollStatuses`,
  `knockBack`), which need the attacker in their signatures, and the separation of two characters from each other. The 46 `.mon!`
  are all in monster-only code.
- **The step** loops `for (const s of w.sides)` in order at each side sub-step; the alternation by tick parity (3.3, section 11
  decision 4) is not built, since with one side it changes nothing (F2 or F4). The map's `status` becomes `'dead'` only for side 0's
  character (`s.id === 0`).
- G5 is two commits (the fields and `team`, then the classification of `isPlayer`); a merge of main is a commit of its own after
  each group.
- **Speed: about 3% slower, not "unchanged".** The fence's wall time (12 bot runs, alternating with main on the same machine) went
  from 21.2 to 21.7 s to 21.4 to 23.0 s. The profile spreads it over `stepWorld` (its thirty per-side loops and what they inline),
  `runMap`, `tickBuffs`, `buildFlow` and the like; no one function is to blame, and the first 5% (a search in `hunted`) was
  removed by its one-side fast path. A real two-character sim will cost more than this, per side.

**Built: F2 (2026-10-16).** Two characters fight headlessly in one world: `runDuel(a, b, seed)` of two class starters ends with one
dead after about 18 to 25 simulated seconds (two Vanguards, seed 1: 24.1 s, A winning with 8% of its life; 80 to 120 ms of wall
time). As planned, with these differences and findings:

- **`createWorld`** takes `CreateWorldInput { plan, sides: SideInput[], opts? }`, a `SideInput` being `{ build, x, y, xp?, opts?, areaLevel?, name? }`.
  A map still calls it with one build and one bag of options (`MapWorldInput`; `createWorld` takes either, so no caller changed),
  which becomes one side at the plan's start, and `World.opts` is that bag as before. Side `i` is the actor with id `i + 1` and
  team 0, 2, 3, ... (`teamOfSide`), and faces the next. **`Side.areaLevel`** is new (a map's, or a duel's own, DUEL.md 4.1): the
  rebuilds in `charges.ts` and `bosses.ts` read it where they read the plan's.
- **`src/sim/duel.ts`**: `createDuelWorld`, `playDuel` (the result, the hash of every tick's events, the world), `runDuel`, `duelHash`
  and `duelResult`. `DuelSide.lifeLeft` is a share of the life cap. Both dead in one tick is a draw by `how: 'death'`. The cap is
  `DUEL_MAX_TIME` 120 s (the 90 s of 4.3 and the stall are F4's); the two characters start `DUEL_GAP` 8 tiles apart.
- **The arena** is `arenaPlan(seed, size, areaLevel)`, factored out of `createDummyWorld` (`dummy.ts`). **The map's own end** had to
  be shut off: `checkExit` opens the exit as soon as no monster stands in the end room, which with no monsters is tick 0, after which
  a character with no target walks to it. `WorldOpts.noExit` keeps it shut (F4's duel option subsumes it); the duel also passes
  `autoAbandonAt: Infinity` and a world `maxTime` one second past its own.
- **The hit path.** The guards that kept a damage over time, a status or a knockback off a character are team tests now:
  `applyStatus`, `rollStatuses`, `applySkillDot`, `applyFlatDot`, `applyDecay` and `applyBurning` no longer test `isPlayer` (their
  callers pass the enemies of a team, and on a map none can reach the character), `knockBack` tests `dst.team === src.team`, and
  `frostBite` the attacker's team. Hexes, impales, culling and the ailments needed nothing: monsters already put them on characters.
  `revealed(w, m)` is true for a character (it reads `m.mon`, which a character has not). What a monster does to a character
  did not change (the fence).
- **Credit.** The side whose damage it is travels with it: `DmgSrc.side`, `Dot.by`, `SkillDot.by`, `rawHit`'s `owner` (a reflect and
  an impale pass one) and the cause of a kill (`causes`). The ledger's dealt rows, `stats.damageDealt` (`noteDealt`), the mend of a
  debuff and the kill go to that side; the fallback to `hunted` is now only for what no side owns on a monster (the ground, a
  drain). A tick of damage over time is shared by owner (`dotShares`) only when the world has several sides: with one, the code is
  the old code (the fence). What F1's note feared, B's on-kill effects firing on an ignite kill of B, does not happen: `killActor`
  returns for a character before any of them, for either side. A kill of a character counts for nothing yet (F4 decides).
- **Collision**: `separateSides` (the characters of different sides give way half each; Phase Run passes through) and
  `separateMinions` also pushes a minion and a foreign character apart (half each). A side's own minions still yield to its
  character, as ever.
- **Tests** (`duel.test.ts`): a duel of starters; determinism (the same builds and seed give the same result and event hash);
  B's Molten Shell absorbs A's hits and A has none; B's life flask fires for B's damage and A's does not (and the other way); A's
  ignite sets `ignites` (by A) on B, burns it less when B resists fire, and is in A's `ledger.dealt` and `damageDealt` and none
  of B's; every on-hit effect of a skill on a character; a kill by A's damage over time and by an owned hit is A's; bodies. One
  side of a map: `side.test.ts`. The deep fence (maps 1 to 30, three seeds) was recorded on the base and holds too.
- **For F3 and F4:**
  - _Not credited yet._ Only a reflect and an impale name their owner. The other twenty-odd `rawHit` callers (Molten Shell's burst,
    mines, fields, auras, minions, triggers) deal damage to a character that it takes and nobody deals, and `applyFlatDot`,
    `applySkillDot` (from fields, deployables, `skillFx`) and `applyStatus` (banners, stances, utility, minions, triggers) now apply
    to a character but carry no `by`. The Herald of Agony's Virulence is still gated `!dst.isPlayer`.
  - _Targeting leftovers._ `bodyOnWay` (the dodge and the kite) and `creepToward` skip characters; `enemiesOf` for a minion lists
    the other sides' characters and minions, never monsters; `stepWorld` builds the flow field for every side's character but the
    grid keeps one (the last), which nothing reads without monsters.
  - _Order._ The actors step in id order, so A swings first in every tick: F4's alternation. The sides' sub-steps loop in order too.
  - _Numbers._ A bleed on a character is worked out at the monsters' rate (`MONSTER_BLEED_DPS_FRAC` 0.1 of the hit, against 0.7 on a
    monster) because `Defence.isPlayer` picks it, and a character's ailment threshold is life plus energy shield: F4's damage-scale
    work should look at both.
  - _Stall._ With one target and `noExit`, a pair that deals no damage for `STALL_TIME` (20 s) has the character drop its target
    for 30 s and stand at the waypoint; starters never reach it, a tanky pair would: the stall rule of 4.3 is F4's.
  - _Events carry no side._ `playerDied`, `levelUp`, `flaskUsed` and `stuck` name no actor; F5 must say whose they are.
  - A side's actor is named `You` (side 0) or `Rival` unless the input names it; `createDuelWorld` names them by class.

---

## 8. Verification

### 8.1 The hash fence

`runMap` hashes every event of every tick (`eventHash`, `src/sim/runMap.ts`). `scripts/hash-fence.ts` plays the bot for six
classes from two seeds to map 10 (about 120 maps, two minutes) and prints one hash per run; `--write` stores them in
`scripts/hash-fence.json` (gitignored: it is a tool of the refactor, valid at one version), and a plain run compares. Through
F0 to F4 the hashes must be identical: the single-player sim must produce the very same events in the same order. This
catches what the suite does not: a reordered sub-step, a moved RNG draw, a read of the wrong side. Beside it: `npm run check`
(2,804 tests), `npm run perf` (a tick must not get slower; a side lookup is one property read), and the calc-sim convergence
tests, which must not move.

### 8.2 Duel tests

`src/sim/duel.test.ts`, asymmetric by design: every kit is given to one side only and the effect is asserted on the right
side (7, F2 and F3). The symmetry test (F4): the same build on both sides over many seeds wins about half. The smoke test:
every active gem duels without throwing. A determinism test: the same builds and seed give the same `DuelResult` and event
hash twice.

### 8.3 Measurement

`scripts/duel.ts` for one fight with both ledgers; `scripts/ladder-probe.ts` re-run with real duels for the bot-versus-bot
matrix (LADDER.md 4.3 was the crossfire); the fight-length measurement of F4.

---

## 9. Cheating and privacy

- **A faked snapshot** only makes a rival nobody enjoys fighting; it is visible on its card and can be deleted in the table
  editor. The legality checks of LADDER.md section 8.2 (points for the level, a connected tree, affixes within their tiers,
  gem levels) are a later milestone if ever needed.
- **Results are never uploaded** in this plan, so there is nothing to fake about them.
- **Privacy.** A rival row holds a character and a hashed random token, no name a player typed, no run history, no id that
  links to a person; it is a separate opt-in. TELEMETRY.md gets a section that says exactly what is sent. A player who turns
  the opt-in off stops new rows; rows already sent stay until the retention rule removes them (the summary says so in one line).

---

## 10. Estimate and risks

Ten to seventeen working days (section 7). Risks, each with its fence:

| Risk                                                                                                        | Fence                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A read of the wrong side on the hit path: A's shell absorbs B's damage, A's flask drinks for B              | The three patterns of 3.2 and nothing else; the asymmetric tests; on a map the fence (one side, so a wrong side is the right side: the tests carry this one) |
| The extraction changes single-player behaviour (a reordered sub-step, a moved draw)                         | Today's order is the spine; the fence after every group                                                                                                      |
| The extraction takes longer than three to five days                                                         | The groups are independent commits; the fence keeps `main` shippable between them; the first group measures the rate                                         |
| Fights are over in two seconds and dull to watch                                                            | The damage scale, measured in F4; the arena distance                                                                                                         |
| A kit that quietly ignores the other side (a minion that never attacks a character, a field that spares it) | A test per kit in F3; the gem smoke test                                                                                                                     |
| A stored build that no longer loads after a version bump                                                    | Rows keyed by `saveVersion`; validation on load; the bot seeds every version                                                                                 |
| Monsters together with two characters                                                                       | `hunted` already picks the nearest side; untested and out of scope                                                                                           |

---

## 11. Edits to DESIGN.md on approval

- §8.2 Simulation: "Entities: player, monsters..." becomes "sides (a character and its kit: one on a map, two in a duel),
  monsters, ..."; the deterministic step runs each side's sub-steps per side, alternating by tick parity.
- §13.1 Player AI: a paragraph on duel mode (3.4). §13.2 Monsters: "chase the nearest side's character".
- §5.1 Flow: `Death → Run summary → (Fight a rival → Rivals → Duel → Result)* → Title`.
- §14.1 Module map: `sim/side.ts`, `sim/duel.ts`, `run/rivals.ts`, `ui/Rivals.tsx`, `ui/DuelResult.tsx`, `data/rivalNames.ts`.
- Appendix A, dated on approval: (1) the player singleton is replaced by `World.sides`, side 0 the local player's; functions
  act for a side, the hit path reads sides from actors, monsters hunt the nearest side; (2) `team` replaces `faction`, sides
  have their own and monsters one of theirs; (3) a duel brings the build and full vitals only: no provisions, reprieves, map
  mods or resist penalty; (4) the order of sides alternates by tick parity; (5) the damage scale default, when measured; (6)
  rivals are a separate opt-in with a hashed storage token and generated names, beside the anonymous telemetry.

---

## 12. Decisions proposed (defaults in effect unless the user says otherwise)

| #   | Decision                  | Default                                                                              | Alternatives                                                         |
| --- | ------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | Where the side comes from | The three patterns of 3.2: a parameter, the actor, `hunted`                          | A side on the world's "current context" (a hidden singleton again)   |
| 2   | Tests                     | A codemod to `w.sides[0].<field>`; no compatibility getters on `World`               | Getters that keep `w.player` working (and keep the singleton alive)  |
| 3   | What ends a duel          | A death; a 90 s cap or a 15 s stall is a draw                                        | Decide a cap by life left; let the stall skip as in maps             |
| 4   | Reprieves and provisions  | Neither side brings any                                                              | Bring the reprieves the run still held                               |
| 5   | Resist penalty and level  | None; each character at its own level                                                | Each at its own map tier's penalty                                   |
| 6   | Damage scale              | ×1 until F4 measures; then the value that gives 15 to 40 s fights                    | ×1 always (the first hit decides); a curve like the reference game's |
| 7   | Arena and distance        | The boss arena's round room, a biome look, 10 tiles apart                            | The dummy's open floor; a labyrinth room                             |
| 8   | Who is offered            | K = 5 of the same save version within ±10 maps, players before bots, never one's own | Same class only; any depth                                           |
| 9   | Names                     | Generated, rerollable                                                                | Typed with a deny-list (moderation)                                  |
| 10  | Identity                  | A random storage token, hashed                                                       | Supabase anonymous sign-in (LADDER.md 8.3)                           |
| 11  | What is uploaded          | The snapshot only; results stay local                                                | Results too (the ladder, section 13)                                 |
| 12  | The second HUD on a phone | A bar: name, life, energy shield                                                     | Two full HUDs stacked                                                |

---

## 13. Out of scope (later plans)

- **Ranking**: a global rank, seasons, the nightly job, Elo (LADDER.md sections 6 and 10, forks 2 to 5).
- **Sparring from camp** with the character as it stands, and entering mid-run snapshots (a pool of characters captured at
  every tenth map cleared, not only at the end of a run).
- **Legality checks** on snapshots.
- **Totems and other deployables with life**, and **monsters together with two characters** (co-operative or three-way).
- **Replays**: a duel is deterministic from two builds and a seed, so a replay is a seed; a share link is a later screen.
