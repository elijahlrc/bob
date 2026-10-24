# Bob — Duels: asynchronous fights against other players' characters

Status: **F0 to F5 built on 2026-10-16, F6 and F7 on 2026-10-17** (the plan was the second draft of 2026-10-16, after the user rejected the
two-world engine of the first); the plan is complete but for section 13 (the nightly verifier and what else was left out), and
`docs/rivals.sql` is applied to the project; the screens of F7 have not been seen in a browser, see "Built: F7" under section 7 ·
Owner: the user · Author: Claude. The balance of a duel (reprieves, a life curve, the end rules) is re-planned in [DUEL-BALANCE.md](DUEL-BALANCE.md) (2026-10-20)

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
| **The watchable duel**     | A round arena in a biome's look, both characters and their kits drawn, the player's HUD and the rival as a boss bar, the speed controls, a result screen.                                                              | F5         |
| **Rivals** (the snapshots) | A character captured at the end of a run (opt-in), named, sent to a small table; fetched by version and depth; bot characters fill the pool while it is small.                                                         | F6         |
| **The screens**            | "Duel for your damned soul's fate" from the run summary: a pick of rivals, the duel, the result (rated or practice), "Again", "Another rival"; a local record; the high scores.                                        | F7         |

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
once per side (the order of sides alternating from tick to tick, so that with one side nothing changes: `World.order`, set at the
top of `stepWorld` from the tick and the duel's seed, `World.orderSeed`: 4.4); one that belongs to the arena runs once. The single loop
over `w.actors` stays one pass in id order, the characters (the first entries of the list) in the order of the tick, dispatching
each actor by `a.side` (`playerAI(w, a.side)` for a character, `monsterAI` for a monster). `updateProjectiles` runs once and
reads each projectile's owner's side. `nextId`, the clock and `events` are the arena's and need nothing.

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
skipping the target. Its enemies are the other character and that character's minions, and the other character counts as a
boss for the `rares` priority (F4, Appendix A).

Totems, brands, traps and mines are not actors and cannot be attacked by anyone, today as in a duel (monsters never attack
them either); a later plan may give them life.

---

## 4. The rules of a duel

### 4.1 What each side brings

| Brought                                                                                                          | Left behind                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The `Build`: class, level, allocated passives, equipment with sockets and gems, flasks, `primaryGem`, `strategy` | Provisions (per-map buffs, armed at camp and burnt by a map), the run's own Reprieves (each side gets three Bargain Coins instead, DUEL-BALANCE.md 2), the map's affixes, the difficulty settings (monsters only) |
| Full life, mana, energy shield and flask charges; no charges, buffs or rage                                      | Carried-over vitals (`run.vitals`)                                                                                                                                                                                |
| The character at its own level: `areaLevel = build.level`, **no resist penalty** for either side                 | The map tier's penalty (a map-70 character fought at −60% in its own maps; the duel is symmetric instead)                                                                                                         |

### 4.2 The arena

A round arena of the shape `gen/bossArena.ts` gives (the boss fights' room: `BOSS_ARENA_RADIUS` 11, so about 25 tiles across
with its rim), dressed in a biome rolled from the duel's seed (`src/data/biomes.ts`: tiles, light, props) so it is drawn like
any map. The two characters start **10 tiles apart**, facing each other, with the duel option of F4 making them engage at any
distance. F2 and F3 used the dummy arena of `src/sim/dummy.ts` (open floor, 30 × 30) with the characters 8 tiles apart, inside the
stock AI's engage range of 9, so that they fought without the option; F4 keeps that arena, puts them 10 tiles apart (outside the
engage range, so the option is what makes them fight) on the middle row, mirror images about the middle column (9 tiles from the
west and the east wall: a stand at the plan's start was 8.5 from the west wall and 11.5 from the east one, so the west
character reached a wall sooner when it kited); F5 brought the round arena (`duelPlan`, `src/sim/duel.ts`: the boss arena's room on its
own, 25 tiles across with its rim, the characters at 7.5 and 17.5 of 25 on the middle row, the biome and the theme drawn from the seed).

### 4.3 How a duel ends

| End                                                                        | Result                                                                  |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| A character dies with no reprieve left (each side has three Bargain Coins) | The other side wins                                                     |
| Both die in the same tick                                                  | A draw                                                                  |
| **Time cap** 250 s (90 s before 2026-10-20)                                | The side that used fewer reprieves wins; as many on each side is a draw |
| **Stall**: neither character has taken damage for 15 s                     | A draw                                                                  |

`DuelResult`: `{ winner: 0 | 1 | null, how: 'death' | 'time' | 'stall', time, sides: [{ recap, ledger, lifeLeft, reprieves, reprievesHeld }] }`. The
ledger of each side (damage dealt and taken by source, `src/sim/ledger.ts`) is the result screen's material.

### 4.4 Fairness

- **Order.** The side stepped first in a tick lands the first hit in a tie. The sides are reversed on a tick when a
  mix of the tick and the duel's seed is odd (`mix32` of `tick + orderSeed * 0x9e3779b1`; `World.orderSeed`, set by
  `createDuelWorld`; a pseudo-random coin for each tick, the same for the same seed), so that over a fight neither side is first.
  Alternating by the parity of the tick does not do that: two characters of one rhythm act on the same ticks every time, so the
  same one of them is first at every exchange of a fight (and the seed's parity would only make that one a coin flip for each fight).
  F4 measured it with the same build on both sides, 12 builds and 200 seeds each: side 0's wins were 12.9 from half on
  average with no alternation, 14.8 with the tick parity, 3.9 with the seed's parity (fair as a distribution over seeds, not in each
  fight), 5.1 with the mix (a fair coin: 5.7).
  The RNG streams are shared; the order fixes the draws, so a duel is a pure function of the two builds, the seed and the game
  version.
- **Seeds.** A duel's seed is drawn by the client (`Rng` from a run-independent source: the rival's id and a counter kept in
  the local record, section 6.5), so "Again" is a new fight and the same two builds can be fought as many times as wanted.
- **Damage scale.** LADDER.md 4.3 found that at the game's numbers a fight is over in a few seconds and the first hit decides
  it, and that scaling damage down changes who wins. The engine takes `duel.damageScale` (a multiplier on damage taken by
  characters, both sides: a hit, a burst, every tick of damage over time, a character's own degeneration; not a minion's, and
  not what a hit does besides damage: the ailments and the stun are those of the unscaled hit). F4 measured fight lengths among
  bot builds with the real engine (section 7, Built: F4) and **the default is ×0.3** (`DUEL_DAMAGE_SCALE`): the median fight is
  16 s among builds of the legacy difficulty at maps 20 and 40 and 25 s among builds of the default difficulty at maps 5 to 20
  (6 s at ×1), with 3% and 6% of the fights ending on the cap. The medians of the maps differ by a factor of four to five at
  ×0.3 (default pool: 44 s at map 5, 22 s at map 10, 10 s at maps 15 and 20), so no one number fits every level: a scale that
  falls with the level is the open question (Built: F4).
- **Life curve** (DUEL-BALANCE.md 4, 2026-10-20). Each side's maximum life and energy shield are multiplied by `duelLifeMult` of the
  other side's level: 1 at level 1 to 10 at level 100 on a straight line, so the lower-level character has the larger factor. It
  sits on top of the ×0.3 scale; minions are not multiplied. Measured with three Bargain Coins a side and the 180 s cap on the 54
  bot rivals of save version 20 (DUEL-BALANCE.md 8.1): median 57 s (F4's rules: 7.4 s), 34 to 46 s up to level 30 and 91 to 106 s
  at levels 30 to 59, with 19% of the fights on the cap (a third at levels 30 to 59); the owner raised the cap to 250 s.

---

## 5. The watchable duel (F5, built 2026-10-16)

The plan drew a second HUD for the rival (mirrored on the right, a bar on a phone). **The owner simplified it on 2026-10-16: one HUD,
the player's, and the rival is shown the way a boss is.** One fight has one spectator, and the rival's own orbs and flasks are
not what they watch.

- **Scene.** The scene draws every side: a character is drawn as its own side's class (`figureOf`, `heroColor`, `isViewer` in
  `src/render/style/who.ts` read `a.side`), the rival wears a boss's ring so that two characters of one class are told apart, and
  each character has a light. The per-side kits (minions, deployables, fields, zones, vortex, storm orb, markers, fuses, spores, mirage,
  charged, shell, channel, auras, buffs, bonds, siphons: `grim/skillFx.ts`) loop over the sides; the level-up and flask effects anchor on
  the event's `src`; a minion is looked up on every side. A hit on the rival bleeds with no screen shake and its numbers take the colour of
  the damage type (red and the shake are the viewer's own character's); the rival has the marks of an enemy (a life bar, the selection
  bracket) and can be picked. The arena draws no exit. `bossFx.ts` and `encounterFx.ts` still read side 0: a duel has no bosses or
  encounters.
- **Arena and camera.** `duelPlan` (4.2). The camera follows the middle of the characters still alive (all of them when none is),
  kept on the floor; side 0's character on a map as before.
- **HUD.** The player's HUD as on a map, with the chrome that does not apply left out: "Map N · theme" is "Duel", no Kills, Exit open,
  reprieve badges or Abandon; the banner on entering says "Duelling arena" and the top line "Duel", with no biome name (the biome is the arena's look alone, and its text describes a layout the arena has not; the user, 2026-10-17). Every fight starts at 1× and unpaused, and leaving puts back the run's speed (DUEL-BALANCE.md 5.1); the speed controls and pause are as they are. Three pips on the top line and beside the rival's name show the Bargain Coins left. **The rival is the boss bar** (`BossBar`, name,
  life, energy shield; no readout), and clicking it shows its name, class and level. **Leave** (a small button as the showcase's Exit)
  ends the duel with no result.
- **Controller.** A duel mode beside the showcase and the gallery (`launchShowcase` is the precedent for a world outside a run):
  `startDuel(a, b, seed, opts?, from?)` makes the world with `createDuelWorld` on copies of the builds, emits `mapStart`, and sets
  `Controller.duel`. `onFrame` steps as usual and, while a duel is set, reads its end **after every tick** by `duelEnd(w, watch)`
  (`src/sim/duel.ts`; the rules `playDuel` has: a death, a stall, the cap) and breaks out of the step loop on it (`stepWorld` sets
  `'dead'` only for side 0's character, and a frame at 8× steps up to a second). The end is a `DuelOutcome` in `lastDuel` (the result and
  both reports), a `mapEnd`, and the `'duelResult'` screen, never `endMap`, so the run's map flow (`finishMap`, Crawls, reprieves,
  telemetry, the save) is untouched and `Controller.run` is whatever it was. `againDuel()` fights on the next seed; `leaveDuel()` goes
  back to `from`.
- **Result screen** (`src/ui/DuelResult.tsx`): who won and how ("Victory", "Defeat", "Victory on time: fewer reprieves used", "Defeat on
  time: more reprieves used", "A draw: time ran out", "A draw: nobody landed a blow for 15 s"), the reprieves each side used, the time, each side's damage dealt by skill and taken by source (`MapReportView`, the numbers are what landed), and
  **Again** (the next seed) and **Back**. A fight against a rival (F7, 6.5) adds a line ("Rated" or "Practice") and **Another rival**.
- **Debug panel** (`src/ui/Debug.tsx`, at camp): a Duel row with a class, a map, a seed, **Mirror** (the character against a copy of
  itself) and **Bot** (a bot build of that class played to that map on the legacy curve; `botBuild`, `src/run/duelBot.ts`).

---

## 6. Rivals (F6, F7)

### 6.1 The snapshot

```ts
type Rival = {
  id: string; // the row id
  name: string; // typed by the player (a player is posted only with one); made up for a bot (6.4)
  classId: string;
  level: number;
  map: number; // the map the run ended on
  outcome: 'died' | 'won';
  difficulty: Difficulty; // a dev setting: kept as a record, never shown on a card, not used in the fight
  saveVersion: number; // SAVE_VERSION at capture: the format of `build`
  gameVersion: string; // the commit, as telemetry sends it
  bot: boolean; // a character the bot built, to fill the pool
  rating: number; // the ladder's, with fights and wins: a card shows them (6.3)
  fights: number;
  wins: number;
  build: Build; // class, level, allocated, equipment with gems, flasks, primaryGem, strategy
};
```

`build` is `run.build` as it is (3 to 9 KB of JSON, LADDER.md 4.1); nothing else of the run is sent. A rival is fightable only
at its `saveVersion`: a rebake renumbers the tree and bumps `SAVE_VERSION` (CLAUDE.md), so the version is the right key. When
a snapshot is loaded, `new Character(build)` and a check that every allocated node, base, affix, gem and unique id exists at
this version decide whether it is offered; one that fails is skipped, not shown.

### 6.2 Capture

When a run ends (`Controller.onRunEnd`, where telemetry hooks in), if the player has opted in **and typed a valid name** (the owner,
2026-10-17: a player is posted only with a typed name), the snapshot is posted to the `rivals` table. **Opt-in, separate from
telemetry:** a checkbox on the title screen beside telemetry's, with the name field ("Add my characters to the rivals and high scores
other players see"; F6), and the same component on the run summary until the character is sent (F7), remembered as a preference.
The character of a run that ended in a death and one that won are both worth fighting. The post is kept (`postRun`, `src/rivals.ts`):
the hook, the summary and the Rivals screen share it, so one run is never posted twice, and it says why when it failed (a name the
table refused, or the rivals out of reach).

### 6.3 The pool

`docs/rivals.sql`, run once like `docs/telemetry.sql` (by the owner; it can be run again without harm):

- table `rivals` (id, created_at, name, class_id, level, map, outcome, difficulty jsonb, save_version, game_version, bot,
  token_hash, `ip_hash`, build jsonb with `pg_column_size(build) < 32768`, length and range checks as `runs` has), **and four
  columns that are the ranking's, never the client's**: `rating int`, `fights int`, `wins int`, `rated_at timestamptz`. A
  `before insert` trigger sets them to the server's values whatever the row sent: `created_at` to now, `ip_hash` to the keyed
  hash of the caller's address, **`rating` to ten times the level** (the owner, 2026-10-17: a level 100 starts at 1000, a level
  50 at 500), no fights and no wins. The public key has no update, so a client can neither post itself with a rating nor
  back-date a row;
- **the address** (the owner, 2026-10-17): every write is stamped with a keyed hash of the address the gateway reports
  (Cloudflare's `cf-connecting-ip`, which a client cannot forge; `x-forwarded-for` is not read, since a client can put anything
  first in it). The key is one random row of `private.keys`, a schema the public key cannot see, made once by the SQL and never
  changed by a second run, so the hash cannot be turned back into an address and is still the same for the same address. The
  first real insert showed the header arrives;
- **the block list**, `blocked (hash, kind 'token' | 'ip', note)`: a writer whose token hash or address hash is in it is
  refused, snapshots and reports alike. Filled by hand from the hashes on a spammer's rows (the nightly job may add to it);
- **the duel log**, `duels` (a_id, b_id, seed, winner 0 | 1 | null, how, seconds, game_version, token_hash, ip_hash,
  verified): one row per rated fight, posted by the browser that played it, with `a_id` its own snapshot. The `before insert`
  trigger forces the server's values (time, address, `verified` null, **the seed from the pair**: `duel_seed(a, b)`, which the
  game computes the same, so a reporter cannot shop for a seed it won and a replay fights the very same duel), and refuses a
  report whose `token_hash` is not the snapshot `a_id`'s (**the token hash is the proof of ownership**: no function returns it,
  so nobody knows another's), whose `a_id` is a bot's (a bot's token comes from a script anyone can read), whose rival does not
  exist or is of another save version, and a second report of the same ordered pair (`unique (a_id, b_id)`: "Again" is
  unrated). An `after insert` trigger applies **Elo to both snapshots at once**: expected score 1 / (1 + 10^((rb − ra) / 400)),
  a win 1, a draw 0.5, a loss 0, each side by its own K from `elo_k(fights)`, **128 for a snapshot's first fight falling in a
  straight line to 32 by its tenth** (the owner, 2026-10-17), ratings rounded to whole numbers and never below 0 (a level 2 starts at 20 and a loss at K 128 can cost 31; the floor was added after the first live fight, 2026-10-17). The log is the source of truth;
  the nightly job (section 13) replays each unverified duel at its game version, sets `verified`, recomputes every rating from
  the verified rows alone (from ten times the level, the same K schedule) and writes them back, so a false report moves the
  ladder for a day at most and its reporter's hashes can be blocked;
- the public key may **insert** into `rivals` and `duels`, with the checks, and may **not select** either: it reads through two
  functions, each `security definer` and returning a declared row type **without** `token_hash` or `ip_hash` (a
  `setof rivals` would hand every caller the tokens that prove ownership):
  - `rivals_for(save_version int, map int, k int, exclude_token_hash text)` returns up to K (at most 20) rows of that version
    within ±10 maps of `map` (widening to ±25 if fewer than K are found), not the caller's own, players before bots, newest
    first with a random tiebreak: `id, name, class_id, level, map, outcome, difficulty, save_version, game_version, bot, build,
rating, fights, wins`;
  - `high_scores(k int)` returns the **top rated rival snapshots, one row per snapshot, not per player**: those with
    `fights > 0` that are not a bot, by `rating desc, wins desc, created_at asc`, at most 100:
    `id, name, class_id, level, map, outcome, rating, fights, wins, game_version, posted_on` (the day it was posted). Empty
    until fights are reported. F7 draws the screen. Since 2026-10-20 it is `high_scores(k, save_version, outdated)`: the game
    asks for its own save version's snapshots (the ones it can fight), so a new save version starts an empty list, and with
    `outdated` for the older versions'; without a version it lists all of them, as builds before then ask;
- names (6.4): the table checks the character set and a length cap, and a trigger refuses a name that contains a word of
  `blocked_words`, a table the SQL creates **empty** and the owner fills in the Supabase table editor;
- the caps: 20 snapshots in 24 hours per token hash, 60 per address hash (several people can share an address), 300 an hour
  from everyone together; for reports 50, 150 and 1,000. The table-wide cap bounds a flood from many addresses to what the
  owner would notice and delete;
- every trigger function is `security definer` with a fixed `search_path`: a trigger runs with the privileges of the inserting
  role, `anon` may read none of the tables they consult, and without it the deny-list would fail every insert with "permission
  denied" and the caps would count nothing;
- rows of a save version older than the three most recent, or older than 90 days, are deleted by hand (a commented statement
  in the file; no `pg_cron`); a snapshot's duels go with it.

The file was applied to the project on 2026-10-17 as the migration `rivals_duels_and_high_scores`, after a dry run of the
whole file in a rolled-back transaction (every entry, a reported duel and its Elo, both functions) and a second one that
posted a real map-100 build and fought the loaded copy against the original on ten seeds with identical results and event
hashes. The first real insert through the client path carried an address hash; the pool was then seeded with bot characters.

`src/run/rivals.ts` (headless; `fetch` injected like `postRecords` in `telemetry.ts`): `rivalRecord`, `postRival`,
`fetchRivals`, `fetchHighScores`, `validateRival` (6.1), `validName`, `generateName` (6.4) and `hashToken`; the browser side is
`src/rivals.ts` (the preferences, the token and the `onRunEnd` hook beside telemetry's). The token is a random id made in the
browser and kept in `localStorage` (`bob.rival.token`), hashed (SHA-256) before sending, used to exclude the player's own
rivals, to count inserts, and as the proof that a reported fight is the reporter's own snapshot's; the raw token never leaves
the browser. (A client can send any hash it likes, so the token is no identity: the caps it carries stop accidents, not a
person who means it, which is what the address hash, the table-wide caps and the block list are for.) **Bots fill the pool:** `npm run sim -- --rivals` posts
the bot's character at the end of each run as `bot: true`, so the pool has rivals at every version from day one; the function
offers them only after the players.

Cost at 1,000 deaths a month: 10 MB of rows and 40 KB of reads per duel screen; nothing near the free plan (LADDER.md
section 7). The reads keep the project from pausing.

### 6.4 Names

A player's name is **typed, and needed** (the owner, 2026-10-17; F6 had the typed name with a made-up fallback, and the plan generated
names only). The title screen's field and the summary's take 3 to 16 ASCII letters, digits, spaces and hyphens, starting and ending
with a letter or digit (`validName`), remembered in the browser and stamped on every snapshot posted; with none, nothing is posted
and nobody duels ("A name is needed to duel"). The made-up names (`generateName(seed)`) are **the bot's alone**: two word lists in
`src/data/rivalNames.ts` (an epithet and a place or a trait, "The Ashen Sentinel of the Low Road"), drawn with the seeded RNG from the
run's seed, at most 46 characters; every word is ours and passes `src/data/ip.test.ts`. No accounts and no uniqueness: two players may
both be "Bob", and the hashed token tells them apart. The rules are the database's: the character set, a cap of 48, and the deny-list
table `blocked_words` that the owner fills in the table editor (no list of words in the repository). A name the table refuses loses
its row; the summary shows the field again with "That name is not allowed" (`nameRefused`: a check violation whose message names the
name, told from a cap or a block, which read "Could not reach the rivals").

### 6.5 The screens (F7)

The feature is called **"Duel for your damned soul's fate"** (the owner, 2026-10-17): the summary's button and the heading of the
rivals screen say exactly that. Elsewhere a duel is "a duel", an opponent "a rival" and the list "High scores". **A player duels only
with the opt-in on and a typed name** (6.4); fighting one's own saved runs offline, which this section had as the fallback for an
empty or unreachable pool, is dropped (an empty pool is a line and Back). Difficulty is a dev setting: a card never shows it.

- **Summary** (`src/ui/Summary.tsx`, `RivalsBlock`): under the recap, the opt-in (`RivalsOptIn`, the title screen's component)
  until the character is sent, and the button always, at the top of the screen and styled as the one thing to press; pressed
  with the box off or no valid name, it turns the box on, asks for the name and goes nowhere (the user, 2026-10-17; the box is on
  by default and the screens no longer mention the hashed address). The run stays loaded until Quit, so
  `run.build` and `run.map` are there. The character is posted by the hook at the end of the run when the box was on with a valid
  name; otherwise here: ticking the box with a valid name already typed posts the run that has just ended, and pressing the button
  posts it first when it is not in (a name typed letter by letter is never posted half typed), then goes to the Rivals screen. Both
  go through the keeper (6.2), so a run is never posted twice. A refused name shows the field again with "That name is not allowed"
  and the button waits for another; an unreachable sink shows "Could not reach the rivals" and "Try again". After a set, one line:
  "You beat 3 of 5 rivals · Your rating 318" (the tally of this run's snapshot, and its rating from `my_snapshots`: the one place a
  player sees their own standing when they are not in the top 100).
- **Rivals** (`src/ui/Rivals.tsx`; its state, `Controller.rivals`, lives beside the duel because a duel comes and goes): on entry
  it waits for the post in hand, finds the player's own snapshot (`my_snapshots(token_hash)`, newest first: the newest row of this
  save version, which must be the run's class, level and map; none, or another run's, means the character was not sent, and the
  screen says so with Back and, only when the post failed, one retry through the keeper), asks `rivals_for` for twenty near
  `run.map` (none of the player's own) and draws five with the seeded RNG (the run's seed and a counter). "Show others" draws five of
  the twenty that are not on the cards. A card is a button that starts the duel: name, class, level, "map N, died" or "map N, won",
  "rating 540 · 7 of 12 won", the build (`buildSignature`: the main skill, up to three keystones and four uniques, by name), a bot
  mark, and "you: 2 of 3" from the record; never the difficulty. A rival whose snapshot will not start is dropped from the cards with
  no message. None near, or offline: one line and Back. "Looking for rivals…" while the fetches run.
- **Duel**: `startRivalDuel(rival, myId, myName)` → the map screen in duel mode (section 5; the rival's name is on the boss bar).
  The first fight of a **pair** (the player's snapshot and the rival) is **rated**: its seed is the pair's, `duelSeedFor(myId, rivalId)`
  = ((myId × 1000003) + (rivalId × 7919)) mod 2147483647 (the database's `duel_seed`; ids 1 and 2 give 1015841), and
  when it ends the game posts the result to `duels` (`postDuel`: the two ids, the winner, how, the seconds, the game version, the
  token hash); the server checks the ownership and moves both ratings at once. "Again" and every later fight against that rival are
  **practice**, on the next seed. A duel is refused while a map of a run is being played.
- **Result** (section 5): one line says what the fight counted for: "Rated · 240 → 318" (the player's rating before and after, read
  again from `my_snapshots` once the report is in), "Rated" (the server had it already, or the rating could not be read), "Practice",
  "Unrated: offline" or "Unrated: <the server's reason>" for a refused report. Buttons: **Again** (practice, next seed), **Another
  rival** (the same five cards, their records updated; the rivals' own ratings on them are as they were fetched) and **Back** (the
  run's summary). Leave, mid-fight, goes back to the cards and counts for nothing.
- **Record**: `localStorage` `bob.rivals.record` (`src/run/rivalRecord.ts`), per **pair**: the fights, wins, last seed and whether the
  rated fight is done. A pair and not a rival alone, because the rated fight is the pair's and every run posts a new snapshot: the
  rival a character rated is a rated fight again for the next one. A pair rated before fights on practice, on the seed after its
  last; a rated fight that was not reported (offline, refused) is rated again next time. The summary's tally is the pairs of this
  run's snapshot. 300 pairs are kept.
- **High scores** (`src/ui/HighScores.tsx`): a button on the title screen beside Codex and Patch notes. `high_scores(100)`: rank,
  name, class, level, rating, fights, wins and the day posted; the player's own rows (the ids from `my_snapshots`) highlighted; "No
  duels yet." when empty, one line when offline, Back. On a phone only the rank, name, class and rating stay. The list is this
  save version's; a box, "Show high scores from older versions", adds the older versions' list below it under "Older versions
  (outdated)" and a line saying those characters can no longer be fought (2026-10-20, when the new passive tree made every
  earlier snapshot unfightable).
- **Camp** (later, out of this plan): the same screens from a "Spar" button, with the character as it stands.

In-game text: a card says who the rival is and what they reached; the result says what the fight counted for, who won, how, and the
two ledgers. Nothing explains the obvious.

---

## 7. Milestones

| Id     | Milestone          | Work                                                                                                                                                                                                                                                                                                                                                                           | Done when                                                                                                                                                                                                                                                                                                       | Days     |
| ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **F0** | The fence          | `scripts/hash-fence.ts` (8.1), recorded before any change; `Side` as `{ id, team }` only (it grows a group at a time), `Actor.side`, `World.sides` with one side built by `createWorld`; no field moved yet.                                                                                                                                                                   | The fence records and matches itself; `npm run check` green.                                                                                                                                                                                                                                                    | 0.5      |
| **F1** | The extraction     | Groups G1 to G5 of 3.3, one commit each, the test and script codemod after each group, `render`, `ui` and `run` by `w.sides[0]`, `hunted`, `team` for `faction`, `enemiesOf`, `findTarget`, `tickMinions`, `actorById`, `separate` and the hazard dodge by team; no field of a side left on `World`.                                                                           | The fence is identical after every group; `npm run check` and `npm run perf` unchanged; in `src/sim`, `sides[0]` appears only in `runMap.ts`, `vitals.ts`, `recap.ts` and `createWorld` (3.3).                                                                                                                  | 3 to 5   |
| **F2** | Two characters     | `createWorld` takes any number of characters (`CreateWorldInput.sides: { build, x, y, opts }[]`; a map passes one at the plan's start); `runDuel(a, b, seed, opts) → DuelResult` in `src/sim/duel.ts`; two class starters with weapons alone fight headlessly on the dummy arena, 8 tiles apart; characters collide with each other and with foreign minions.                  | `runDuel` of two starters ends with **one dead** (a draw by the cap means they never engaged, and fails); `src/sim/duel.test.ts`: only B has a Slag Carapace and A's hit is absorbed by B's shell while A's stays null; B's flask fires when B is hurt, not A's; A's ignite on B ticks against B's resistances. | 1 to 2   |
| **F3** | Kits across sides  | Minions (target, are targeted, separate), deployables, fields and zones, projectiles and shots, triggers, charges, buffs, channel, blinks, banners, offerings, supports' counters; `scripts/duel.ts` (two builds from saves, bot builds or the probe's snapshots: the result and both ledgers); the bot-versus-bot matrix of `scripts/ladder-probe.ts` re-run with real duels. | A test per kit (a minion of B attacks A; A's totem shoots B; B's field burns A; A's trigger fires on B's hit); every active gem duels without an exception (a smoke test like `gemSmoke.test.ts`); the fence still matches.                                                                                     | 1 to 2   |
| **F4** | The rules          | `SideOpts.duel`: engage anywhere, no advance, loot or exit; the ends of 4.3; order alternation; `damageScale`; the measurement of fight lengths and the default (4.4); the symmetry test.                                                                                                                                                                                      | The same build on both sides wins about half over 100 seeds; fight lengths measured and the default recorded in Appendix A; `docs/PLAYER-AI.md` gains a section on duels; the fence still matches.                                                                                                              | 0.5 to 1 |
| **F5** | The watchable duel | The round arena in a biome's look; the scene draws every side; effects by actor; the figure rig by side; the camera; the rival as the boss bar (no second HUD); `startDuel` and the controller's duel mode; `DuelResult.tsx`; "Again"; a Debug panel entry that starts a duel against a bot build.                                                                             | A duel between the current character and a bot build can be watched from the Debug panel at every speed, on a phone layout too; no console errors; the boss bar follows the rival.                                                                                                                              | 2 to 3   |
| **F6** | Rivals             | `Rival`, `src/run/rivals.ts` (post, fetch, validate, token, names), `docs/rivals.sql` run on the project, the opt-in preference and checkboxes, capture in `onRunEnd`, `npm run sim -- --rivals`, TELEMETRY.md's new section.                                                                                                                                                  | A death with the opt-in posts a row the table accepts; `rivals_for` returns K rows of the version near the map, none of the caller's; a row with an unknown gem id is skipped by the client; the bot has seeded the pool at the current version.                                                                | 1 to 2   |
| **F7** | The screens        | "Duel for your damned soul's fate" on the summary, `Rivals.tsx`, the rated fight and its report, the record, the high scores.                                                                                                                                                                                                                                                  | From a death: opt in with a name, pick a rival, watch the duel, see the result (rated or practice), fight again, fight another; the record persists across reloads; the high scores; `npm run check` and `npm run build` green.                                                                                 | 1 to 2   |

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
- **Collision**: `separateSides` (the characters of different sides give way half each; Slipstream Run passes through) and
  `separateMinions` also pushes a minion and a foreign character apart (half each). A side's own minions still yield to its
  character, as ever.
- **Tests** (`duel.test.ts`): a duel of starters; determinism (the same builds and seed give the same result and event hash);
  B's Slag Carapace absorbs A's hits and A has none; B's life flask fires for B's damage and A's does not (and the other way); A's
  ignite sets `ignites` (by A) on B, burns it less when B resists fire, and is in A's `ledger.dealt` and `damageDealt` and none
  of B's; every on-hit effect of a skill on a character; a kill by A's damage over time and by an owned hit is A's; bodies. One
  side of a map: `side.test.ts`. The deep fence (maps 1 to 30, three seeds) was recorded on the base and holds too.
- **For F3 and F4:**
  - _Not credited yet._ Only a reflect and an impale name their owner. The other twenty-odd `rawHit` callers (Slag Carapace's burst,
    mines, fields, auras, minions, triggers) deal damage to a character that it takes and nobody deals, and `applyFlatDot`,
    `applySkillDot` (from fields, deployables, `skillFx`) and `applyStatus` (banners, stances, utility, minions, triggers) now apply
    to a character but carry no `by`. The Sour Herald's Virulence is still gated `!dst.isPlayer`.
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

**Built: F3 (2026-10-16).** Every kit works across sides: what a side deals is credited to it whoever or whatever it hits, and what a
kit takes for an enemy is the other side's character **and its minions**. On a map nothing moved: the default fence and the deep
fence (maps 1 to 30, three seeds) are identical after each of the two commits that changed the sim, and **no fix found a bug on a
map** (a minion's `enemiesOf` that returned nothing, a flow field built from the wrong tile: neither happened, so nothing was
re-recorded). As planned, with these differences and findings:

- **One list of enemies, in `side.ts`.** Minions are not in `w.actors`, so every list of "the enemies of a team" built from it saw
  the other character and never its minions, and `enemiesOf` for a monster (or a minion) saw minions and never a monster.
  `livingEnemiesOf(w, team)` is the actors of other teams in `w.actors`' order and then the minions of the other sides, side by side;
  `enemiesWithin(w, team, x, y, r, pad)` is the ones within a radius (what an area, an aura or a count of enemies near reaches);
  `eachEnemy(w, team, fn)` visits them **live**; `foeMinions(w, team)` is the minions alone, without allocating, for the projectiles.
  **A loop that strikes must read the lists live** (`eachEnemy`): `for (e of w.actors) if (alive) hit(...)` skips what an earlier hit
  of the same loop killed and reaches what it summoned (a Splitting monster's children), and a list built first does neither: it is
  how a map's events could have moved. The loops that only count, afflict (a status, a debuff, a hex) or choose use the lists.
  The minions of a side whose character has fallen are left out (as `enemiesOf` for a monster always did), the projectiles' list
  (`foeMinions`) does not look at that (nor did the old one).
- **`tickMinions`' `foes`** are the awake monsters and the other side's characters and minions: a character's `state` stays
  `'idle'` (never set: it is a monster's sleep), so the filter is `e.isPlayer || e.state !== 'idle'`. `bodyOnWay` (the dodge and the kite) and
  `creepToward` take the team and skip it, not every character; a creeping patch drifts toward the nearest monster, character or
  minion of another team; the kite steps away from the other side's minions too. **Nobody calls `enemiesOf` with a minion**:
  minions strike with `rawHit`, a zone's owner is the character, and a deployable fires through `standIn` (which keeps `isPlayer`),
  so the monsters' branch and the minions' were never one the map used.
- **The flow field** is one search from every living character (`Grid.buildFlow(points)`; with one the very algorithm it was: the
  test compares it with the old search tile for tile, and with two each tile is the path distance to the nearer). `hunted` measures
  a straight line and the field a path, so across a wall a monster can head for the farther character; fine for F3 (monsters and
  two characters is out of scope, section 10).
- **`rawHit(w, dst, amount, type, owner, label, by, via)`** takes its owner (a `Side` or `null`) right after the type, so that the
  compiler listed every caller. Owned: Slag Carapace's burst, the Relic's nova, mines (`mineAuraHit`), the Storm Herald's bolts,
  the corpse bursts of Pyre Burst and of the corpse blinks, Shadow Swap, the burning aura, the queued explosions of triggers, a
  minion's blows and its Volatile burst. `null` on purpose: Searing Mantle and a minion's own burn (self-damage: on a map ownerless
  damage onto a character earns no `dealt` row, and an owner would grow the side's own), the share a Thorned monster throws back, the
  Collapse, Tithe, the Counter-stance, the zones of the monsters, and **every blast of `world.ts`** (`tickEffects`): no side pushes
  a ground effect, they are all monsters', and they land on characters and minions, never on monsters. A debuff of damage over time
  (a skill's, Slow Rot's, the Cinder Herald's and Burning Pack's burns, a venom burst) carries `by`. **Statuses carry no owner**:
  they deal no damage, and the damage they raise is credited by whoever deals it.
- **The ledger.** A side's hit on another side's minion earns a row (`applyHit`'s `how` gate is now "a character, a monster, or a
  side's hit on another team"; `rawHit` on a minion already did). A minion's blows are `minion` rows wherever they land (they were
  `effect` rows on a character). `noteHit` stays gated on a character as `dst` (a `hits` count for the monsters' sake would move
  the report of every map). The Sour Herald's Virulence is fed by a side's poison on an enemy of its team (a monster, the
  other character or its minion); a monster's poison keeps today's rule.
- **A kill of a minion** by the other side's damage gives that side what a kill gives that needs no loot or experience: the charges
  (`kill`, `killFrozen`), the gains (`kill`, `killShocked`), a banner stage, "killed recently", the stances' refresh and the kill
  triggers; no kill counted, no experience, no flask charges, no life or mana on kill, nothing dropped (Appendix A, 2026-10-16: F4
  prices the rest). A minion that falls of its own side's damage or of nobody's gives nothing. A character's fall still counts for
  nothing (F2). The kill effects read `causes` (the side that last struck it), which a monster's damage on a minion never sets.
- **One bug of the same kind found.** The burning aura's off switch (Searing Mantle goes off below 40% life and on from 75%) was a
  `WeakSet<World>`: two characters with an aura would have shared one switch. It is a `WeakSet<Side>` now. (The other module-level
  state keyed by world is the monsters': locks of bosses, thefts, packs, telegraphs.)
- **Per kit, what changed** (everything in it that picked "the enemy" by `isPlayer`, `w.actors` or `hunted`):
  - _Minions_: what they seek (above), their blows and splash, Volatile Servants' burst, the Sour Herald's crawler, the Relic,
    the Skitterbots' auras, Burning Pack's burn; a foreign minion in the way of a projectile is hit.
  - _Deployables_ (totems, brands, traps, mines, ballistas, Twin Shadow's archer, the stand-ins): their foes include the other side's
    minions; a mine's aura hit and the beams' debuffs are the side's.
  - _Fields and zones_ (consecrated, chilling, caustic, pods, crystals, storms, walls, orbs, ghosts, geysers, trails, smoke, rain):
    `enemiesIn` and `tickSkillZones` through the lists, debuffs carry `by`; a creeping patch drifts toward the other side.
  - _Projectiles and shots_: a projectile of A hits B's character and B's minions (stops, pierces, forks, chains), never A's own;
    the bursts of mortars, creeping skulls and the nova, the chain of lightning of a strike, a cone and the blades from behind the
    struck one choose among the same list; Spirit Saw's homing, Tempest Mote's bolts, the drifting orb, Orbiting Blades, Skyfall's
    markers and Fuse Arrow's fuses (the target may be a minion: `actorById`) too.
  - _Triggers_: the counter-trigger of A fires when B hits A (it already did: `fireTriggers(dst.side)`); the target it picks is the
    nearest enemy including minions; kill explosions and the overkill burn are the side's.
  - _Charges_: a hit on a minion feeds them (`applyHit`); a kill of one does (above). _Buffs that count enemies near_ (stances,
    banners' fight size, the channel's crowd stage, Rime Step's cooldown, the AI's packs, escapes and flasks, curses under
    Standing Curse) count the minions too. _Banners_: the enemy status lands on the other character and minions in reach. _Blinks_:
    the corpse and Shadow Swap bursts, Rotting Stride's wither, the safest spot, the pack a blink lands in. _Supports_: Triple Cadence's
    repeats, Echoing Blow, Twin Shadow's archer, the shockwave. _Offerings, hexes and the exposure_: nothing was wrong (own minions
    only; a hex or a status goes onto any actor).
- **Monster-only by meaning, left as it was:** `fieldKill`, `chargedDeath` and `hexKill` ask `hunted` who killed (they run for a
  monster's death, and a character's or a minion's never reaches them); with monsters and two characters in one world they would
  misattribute (out of scope). A character's `findTarget` never picks a minion (it chooses by distance among `w.actors`: a rival's
  character, however many minions stand about it; the swing, the burst and the projectile hit what is in their way): an AI question
  for F4. `raiseWall` does not keep the tiles of minions clear of its wall (it did not on a map).
- **Tests** (`src/sim/duelKits.test.ts`, 201): asymmetric, a kit to one side and the effect and the credit looked for on the right
  ledger. A minion of B attacks A's character and the blows are B's, both sides' minions fight each other, `enemiesOf` lists the
  other side's character and minions and none of one's own, a hit on a minion earns a row and a charge, a kill of one gives the
  charges and no kill (and a fall of nobody's or one's own gives nothing); A's totem and A's mines; B's caustic ground burns A and is
  B's (and spares B), A's creeping ground drifts toward B, B's banner's status lands on A in reach and not beyond; A's counter-attack
  answers B's blows; A's Slag Carapace goes off on B; a projectile of A hits B's minion and B and never A's own minion, and stops at
  B's minion in its way; a monster between two sides walks to the nearer by the flow field (west and east); the flow field itself
  against the old search; the helpers. 11 of the 19 kit tests fail on F2's code. **The duel gem smoke test**: every active and
  item-granted gem (178) on side A against a class starter on side B for ten simulated seconds: no exception, life finite, and a
  damage gem hurts B. **Both characters cannot die** (`godMode`, `freeResources` on A as `gemSmoke.test.ts` has them): 176 of the 178
  fights ended before the ten seconds were up when B could die (most within two), and the point is ten seconds of the kit at work. It adds about 2.5
  seconds to the suite (all of the file, 4 s); no gem needed a skip. The suite is 3,117 tests.
- **Tools.** `npm run duel -- --a vanguard:1:20 --b strider:1:20 [--seeds 1,2,3] [--both] [--legacy]` fights two builds and prints
  the result of each seed and both ledgers (dealt and taken by source, the pools); a build is `class:seed:map` (the bot played to
  that map and snapshotted, as `ladder-probe.ts` does), a number with `--load snaps.json` (the probe's `--save`), or a file: a save
  as `localStorage.getItem('bob.save.1')` (a `{ version, run }`), a run's JSON or a build's (`scripts/duel-lib.ts`). `--both` fights
  each seed in both orders. `ladder-probe.ts --real [--fight-seeds 1,2]` fights the matrix with `runDuel`, each pair in both orders.
- **The matrix** (bot builds snapshotted at map 20 and 40, `--classes all --seeds 1,2 --legacy`; the default difficulty kills the bot
  on maps 10 to 20, so with it only two builds reach map 20 and one reaches 40; one fight per cell, seed 1):

  | map | builds | fights | by a death | both dead at once | by the cap | median | shortest | longest | west won | east won |
  | --- | ------ | ------ | ---------- | ----------------- | ---------- | ------ | -------- | ------- | -------- | -------- |
  | 20  | 12     | 132    | 130        | 2                 | 0          | 4.4 s  | 1.9 s    | 40.3 s  | 68       | 62       |
  | 40  | 10     | 90     | 90         | 0                 | 0          | 5.6 s  | 2.5 s    | 19.8 s  | 51       | 39       |

  The two orders of a pair agree on the winner (the same build wins both) in 62 of 66 at map 20 (3 disagree: the west side won
  both, or the east side did; 1 had a draw in one order) and in 39 of 45 at map 40 (6 disagree). The west side wins a little more
  (52% and 57%), as it strikes first. A fight takes about 10 milliseconds of wall time. The fights include totems (Mortar Bow),
  traps, mines, creeping ground, Orbiting Blades and a Sour Herald crawler with no error. **F4's damage scale starts here:** the
  median fight is 4 to 6 seconds, well short of the 15 to 40 s that 4.4 asks for, and none reached the cap.

- **For F4 and F5:**
  - _The AI does not target minions_ (above): a character with a screen of minions in front is struck through it by area and
    projectile skills only; whether `findTarget` should choose them is a decision for the rules.
  - _What a kill of a minion gives_ is as in Appendix A; flasks, life and mana on kill, and experience are F4's.
  - _The flow field and `hunted`_ can disagree across a wall (path against straight line); with monsters in a duel, one of them
    should lead the other.
  - _Rows._ A minion's blows are `minion` rows in both ledgers, a side's skill effects on a character are `effect` rows (Molten
    Shell's burst on a character, Mine, Herald), on a monster or a minion `skill` rows: the result screen groups by `kind`.
  - _Speed._ The fence's wall time was 22.1 s on the base and 22.4 s after F3 (12 bot runs); the owner plumbing and the
    multi-source field cost nothing measurable.

**Built: F4 (2026-10-16).** The rules of a duel: a character engages at any distance and never loots or leaves, a fight ends by a
death, the cap or a stall, the sides act in alternating order, what a character takes is scaled (**×0.3**), and a character goes for
the other side's minions. On a map nothing moved: the default fence is identical (12 runs, 22.1 s wall against 22.0 s recorded on
the base). Fighting the same build on both sides found two things the plan did not expect: the tick parity alone does not alternate
who is first, and a summon's first minion stood behind the character that stood east (a bug in the sim). As planned, with these
differences and findings:

- **The duel option** (`SideOpts.duel`, `src/sim/ai.ts`): `findTarget` has no engage range and `playerAI` no drop at `ENGAGE_RANGE + 3`;
  the stall breaker is off (so a target is never given up on, the other character included); with no target (the other cannot be
  targeted, or the character is itself running in Slipstream Run) it walks toward the other character in mode `engage`, and never reaches
  the loot, the exit or the waypoints. A side with the option starts in mode `engage` (a side starts in `advance`), so no state of
  a duel is `loot`, `exit` or `advance`. **`WorldOpts.noExit` is not made redundant:** the option keeps the characters from walking to
  the exit, but with no monsters `checkExit` opens it at the first tick (the flag and an `exitOpen` event that F5's scene would
  draw); `noExit` keeps it shut. `createDuelWorld` puts the characters `DUEL_GAP` 10 tiles apart on the arena's middle row,
  mirror images about its middle column (x 10 and 20 of 30, y 15).
- **The ends** (`playDuel`, not `stepWorld`: the map must not know): `DuelResult.how` is `'death' | 'time' | 'stall'`; the cap is
  `DUEL_MAX_TIME` 90 s and the stall `DUEL_STALL_TIME` 15 s without either character's `stats.damageTaken` rising (what the side
  already counts, after a shell has taken its share; damage to a minion does not count, so two summoners whose minions fight each
  other for 15 s with no blow on either character is a stall). `duelResult(w, end)` takes how a fight with both alive ended; both dead
  in one tick is still a draw by death. **The stall rule fired in 1 of the 3,084 fights of each scale of the sweep (the same one
  at every scale, in the default pool), the cap in all the other draws.** It was a Mystic and a Zealot of the bot's seed 5 at map 15, both
  with Twin Cut and summoned minions: both characters at full life, their minions fighting each other, 2.5 tiles apart.
- **The order** (`World.order`, `sidesInOrder` in `world.ts`): `stepWorld`'s 31 per-side loops iterate `w.order`, which is `w.sides` or the
  sides reversed (one cached array), by the low bit of `mix32(tick + orderSeed * 0x9e3779b1)`; the actor loop takes the characters
  (the first entries of `w.actors`) through it and the monsters as before; a one-side world's `order` is always `w.sides` (a test).
  `updateProjectiles` runs once in creation order, so **a same-tick tie between two projectiles still favours the earlier one**; the
  loops that only read, `separate` and the minions' separation (moves that give way half each) are as they were. **The order is
  drawn tick by tick from the tick and the duel's seed (`World.orderSeed`, set by `createDuelWorld`; 0 on a map), a deviation from the
  plan's tick parity.** Measured with the same build on both sides, 12 builds of the legacy pool at map 20 and 200 seeds each at ×1,
  the mean distance of side 0's wins from half was 12.9 with no alternation, **14.8 with the tick parity** (it moved the
  67/33 of one mirror to 33/67: the two characters of a mirror act on the same ticks, so the same one is first at every exchange of the
  fight), 3.9 with the parity of tick plus seed (fair over seeds, but one seed has one side first at every tie of its fight, and
  "Again" would depend on the seed's parity), and **5.1 with the mix** (a fair coin: 5.7); the mix makes each fight fair in itself.
  Nothing else of a duel reads `orderSeed`, and no stream of the world's RNG is drawn for it (the mix is of two integers).
- **A minion ring bug the symmetry test found** (`summonMinions`): the ring of a summon started due east of the character, so in a
  mirror duel the one standing east had its first minion behind it, where its own body held it (a minion's straight walk is
  stopped by the character's separation): a mirror of the Reaver at map 20 went 100 to 0 for the west side, its minion never
  attacking. With several sides the ring starts where the character faces; a map keeps the east start (the fence).
- **The damage scale** (`DuelOpts.damageScale`, default `DUEL_DAMAGE_SCALE`, carried as `Side.damageScale`, 1 on a map): in `applyHit`
  after the ailments and the stun were worked out (**the ailments read the hit before it is mitigated, so they need no code: an
  ignite of 40 is 40 at any scale, and so is a stun**) and before the map report, the recap, the damage log and the leech read it
  (**the leech of the hit is of the scaled damage**); in `rawHit` and in the damage-over-time tick, one more factor beside
  `damageTakenMult`, for a character only; and on Surge of Blood's own cost (life and energy shield). **Not scaled: a minion's damage taken,**
  which is a balance question (a minion dies 3.3 times sooner relatively); the sheet's DPS and EHP know nothing of the scale. The ledgers,
  `damageDealt`, `damageTaken`, the recap and `DuelSide.lifeLeft` are of what landed (scaled). The share of a hit a character reflects
  (`reflectPhysPct`) is of the unscaled hit (`reflectBack` divides by the scale: `res.dmg[0] > 0` says it is not 0), so the reflection
  is scaled once, when it lands. A Slag Carapace's burst is kept to one scale in the same way: the shell's pool is measured against the
  damage the character takes, scaled like its life, and what it took is stored divided by the scale (`shellTakes`), so the burst, of
  the unscaled damage, is scaled once when it lands (a test). Sacrifice and a skill's life cost are costs, not damage, and are not
  scaled.
- **A character goes for the other side's minions** (`findTarget`): its enemies are `livingEnemiesOf` (on a map the one side's list
  is `w.actors`, as before), the strategy's priority picks among them, and the other character counts as a boss for `rares` (4
  tiles nearer). It is not a boss elsewhere: the Strategy tab's conditions (rares, bosses) and the mods "against rare or unique
  enemies" still read its rarity, which is normal; whether they should count it is a question for the owner. **A kill of a minion by the
  other side** now also gives the flasks' charges and life and mana on kill (`killGains`, shared with a monster's kill; no mark
  on a minion gives anything: `hexKill` asks `hunted` whose it is); still no experience, loot or kill counted, and a character's
  fall is worth nothing. There is no energy shield on kill in the game. Two findings **left as they are** (Appendix A): a bleed on a
  character is worked out at `MONSTER_BLEED_DPS_FRAC` and a character's ailment threshold is life plus energy shield. **The
  measurement could not test the bleed:** no build of the legacy pool deals more than 1% of its damage as a bleed (at ×0.35; a burn
  5% at most, a poison 11% at most).
- **The matrix, the legacy pool at ×1** (12 and 10 builds at maps 20 and 40, `--legacy`, both orders, seed 1; the west side won / the east
  side won, median fight):

  | state                                      | map 20  | map 40  | all     | median       |
  | ------------------------------------------ | ------- | ------- | ------- | ------------ |
  | F3 (8 tiles, stock AI, no alternation)     | 68 / 62 | 51 / 39 | 119/101 | 4.4 s, 5.6 s |
  | items 1 and 2 (option, 10 tiles, mirrored) | 69 / 63 | 49 / 41 | 118/104 | 5.0 s        |
  | and the order alternating by tick parity   | 70 / 62 | 50 / 40 | 120/102 | 5.0 s        |
  | and the seed's parity and the minion ring  | 66 / 66 | 46 / 44 | 112/110 | 5.2 s        |
  | and items 4 and 5 (targeting, kills), ×1   | 68 / 64 | 46 / 44 | 114/108 | 6.2 s        |
  | and the order drawn from the tick and seed | 66 / 66 | 46 / 44 | 112/110 | 6.2 s        |

  The two orders of a pair agree on the winner in 66 of 66 and 44 of 45 pairs after the seed's parity and the ring (62 of 66 and 39 of 45
  in F3, 64 of 66 and 42 of 45 after items 4 and 5, and with the final order). **What targeting the minions did to the ×1 matrix:** the
  fights are longer (median 5.2 to 6.2 s, third quartile 7.8 to 9.5 s, longest 28.1 to 32.4 s) and the west share is unchanged; a
  summoner's screen now holds a melee character for a while instead of being walked past. The symmetric starters at ×0.3, with the final
  order: side 0 won 36, 30, 30, 25, 27 and 20 of 60 for the Vanguard, Strider, Mystic, Reaver, Zealot and Shade starters (the Zealot pair
  drew 4, the others none; the Shade pair 188 of 400 over more seeds) and 15 of 30 for two Bonewalker summoners, all inside the 3
  standard deviations; the test keeps the first three and the summoners, for its cost.
  **One build of the 12 mirrors is not fair, and it is not the order:** the Strider of seed 2 at map 20 (Mortar Bow, a Blight Colossus
  and totems) goes to the west side 62% of 800 fights at ×1 (498 against 298; 122 of 200 in the 12-build measure). It follows the
  west and not the side: with the two sides' places swapped the side now standing west wins 235 of 400, against 257 of 400 before; with
  the two stood north and south the edge is gone (204 and 205 of 400), without the golem it is gone (143 of 300), and with the characters
  aiming only at the other character (not at its minions) it is gone (209 of 400). So something in how a character and its minions fight along the east-west
  line favours the west when the characters aim at minions; the cause is not found, and the symmetric tests do not cover it.

- **The sweep** (`npx tsx scripts/ladder-probe.ts --real --scale 1,0.5,0.4,0.35,0.3,0.25,0.2,0.15 --duel 20,40 --load legacy.json`
  and `--duel 5,10,15,20 --load default.json`; the snapshots are the probe's `--save` of 12 bot runs of the legacy difficulty to map 40 and
  36 of the default difficulty, each pair in both orders, fight seed 1). **Legacy pool**, 22 builds at maps 20 and 40 (a bot of the default
  difficulty dies at maps 10 to 20, so the legacy one reaches what a long run would); **default pool**, 103 builds at maps 5 (34), 10 (34), 15 (22) and 20 (13):

  | scale    | pool    | fights | death | both dead | stall | cap  | q1     | median     | q3     | longest | west won | east won |
  | -------- | ------- | ------ | ----- | --------- | ----- | ---- | ------ | ---------- | ------ | ------- | -------- | -------- |
  | ×1       | legacy  | 222    | 222   | 0         | 0     | 0    | 3.9 s  | 6.2 s      | 9.4 s  | 32.4 s  | 112      | 110      |
  | ×0.5     | legacy  | 222    | 222   | 0         | 0     | 0    | 5.5 s  | 9.5 s      | 17.7 s | 57.1 s  | 115      | 107      |
  | ×0.4     | legacy  | 222    | 222   | 0         | 0     | 0    | 6.4 s  | 11.0 s     | 26.8 s | 84.6 s  | 114      | 108      |
  | ×0.35    | legacy  | 222    | 219   | 0         | 0     | 3    | 7.0 s  | 12.2 s     | 32.9 s | 90.0 s  | 110      | 109      |
  | **×0.3** | legacy  | 222    | 216   | 0         | 0     | 6    | 8.2 s  | **15.7 s** | 39.1 s | 90.0 s  | 108      | 108      |
  | ×0.25    | legacy  | 222    | 207   | 0         | 0     | 15   | 9.6 s  | 21.6 s     | 47.6 s | 90.0 s  | 105      | 102      |
  | ×0.2     | legacy  | 222    | 190   | 0         | 0     | 32   | 12.3 s | 29.1 s     | 59.6 s | 90.0 s  | 93       | 97       |
  | ×0.15    | legacy  | 222    | 173   | 0         | 0     | 49   | 19.8 s | 40.6 s     | 83.6 s | 90.0 s  | 87       | 86       |
  | ×1       | default | 2862   | 2861  | 0         | 1     | 0    | 4.0 s  | 5.5 s      | 7.1 s  | 39.0 s  | 1434     | 1427     |
  | ×0.5     | default | 2862   | 2829  | 0         | 1     | 32   | 6.3 s  | 10.2 s     | 20.1 s | 90.0 s  | 1418     | 1411     |
  | ×0.4     | default | 2862   | 2788  | 0         | 1     | 73   | 7.5 s  | 14.1 s     | 34.6 s | 90.0 s  | 1399     | 1389     |
  | ×0.35    | default | 2862   | 2753  | 1         | 1     | 107  | 8.4 s  | 17.9 s     | 43.6 s | 90.0 s  | 1381     | 1372     |
  | **×0.3** | default | 2862   | 2687  | 2         | 1     | 172  | 9.6 s  | **25.0 s** | 51.7 s | 90.0 s  | 1346     | 1341     |
  | ×0.25    | default | 2862   | 2529  | 0         | 1     | 332  | 11.5 s | 36.2 s     | 65.0 s | 90.0 s  | 1262     | 1267     |
  | ×0.2     | default | 2862   | 2220  | 0         | 1     | 641  | 16.1 s | 51.9 s     | 83.9 s | 90.0 s  | 1116     | 1104     |
  | ×0.15    | default | 2862   | 1754  | 0         | 1     | 1107 | 29.1 s | 75.7 s     | 90.0 s | 90.0 s  | 876      | 878      |

  The median by map (the fights that ended on the cap, of all of them), the default pool:

  | scale    | map 5                | map 10               | map 15             | map 20             |
  | -------- | -------------------- | -------------------- | ------------------ | ------------------ |
  | ×0.5     | 14.8 s (17 of 1122)  | 10.4 s (14 of 1122)  | 7.2 s (0 of 462)   | 6.1 s (1 of 156)   |
  | ×0.35    | 37.2 s (81 of 1122)  | 17.2 s (21 of 1122)  | 9.4 s (1 of 462)   | 8.1 s (4 of 156)   |
  | **×0.3** | 44.0 s (121 of 1122) | 21.5 s (39 of 1122)  | 10.6 s (7 of 462)  | 9.6 s (5 of 156)   |
  | ×0.25    | 54.3 s (212 of 1122) | 36.3 s (94 of 1122)  | 13.9 s (18 of 462) | 11.2 s (8 of 156)  |
  | ×0.2     | 68.9 s (387 of 1122) | 50.5 s (205 of 1122) | 20.4 s (30 of 462) | 14.7 s (19 of 156) |

  **The choice: ×0.3** (`DUEL_DAMAGE_SCALE`), the only scale at which the median is 15 to 40 s in both pools (15.7 s and 25.0 s; ×0.25 is
  also, with more than twice the draws: 6.8% and 11.6% of the fights on the cap against 2.7% and 6.0%, and ×0.35 is 12.2 s in
  the legacy pool). It does not fit every level: the default pool is two thirds builds of maps 5 and 10, whose fights at ×0.3 take
  44.0 s and 21.5 s (10.8% and 3.5% on the cap), while the builds of maps 15 and 20 fight for 10 s (a factor of four to five between
  map 5 and map 20 at ×0.3 to ×0.2, and 1.1 at ×1: the regeneration, the leech and the flasks are not scaled, so a build that deals
  little is held off by them first, probably). **No constant fits all levels**; a scale that falls with the level (a fight of builds
  at level 10 and at level 25 each 15 to 40 s) is the open question for the owner, a function of the levels of the two characters in
  `createDuelWorld`. The west side wins 50% in every row.

- **Tests** (`src/sim/duelRules.test.ts`, 30 tests; the older duel files changed in three places that read the plan's start, the 8
  tiles or the default scale): the option (10 tiles and a death, the option the only reason they engage, never loot or a chest or the
  exit, walking to a target that cannot be targeted, off on a map), the ends (death, both dead, the stall at 15 s and the option, the
  cap), the order (a policy trace of 1,000 ticks of one fight: the order changes within it and neither side is first more often than a
  fair coin allows, the same seed the same order, the two cached arrays, `use` events of two mirror characters over 12 seeds, one side),
  the scale (hit and what is recorded of it, a burst, a Slag Carapace's burst, a tick, both sides, a minion, an ignite), what a character goes for (the nearest, the
  `rares` priority, a screen of four minions then the character with no stall, a minion's kill gives flasks and life, not experience),
  a summon's ring, and the symmetry. **The symmetry test** fights the same build on both sides over 60 seeds for the Vanguard, Strider and
  Mystic starters and 30 for two summoners, and asserts side 0's wins stand within 3 standard deviations of a fair coin of the fights
  that were decided (1.5 √n of n/2: 18 to 42 for 60 seeds); it takes 6.9 s at ×0.3 (the file 9.0 s; the suite is 3,147 tests and `npm run check` 72 s).
- **For F5 and F7:**
  - _The controller watches the ends itself_ (the map's `stepWorld` knows nothing of them): the cap, the stall (a side's
    `stats.damageTaken` unchanged for 15 s) and the deaths of both sides, as `playDuel` does; `duelResult(w, end)` reads the result.
    Factor a `DuelWatch` out of `playDuel` when the controller needs it.
  - _The order of the sides_ is drawn from the tick and the seed: each fight is fair in itself, and any seed will do for "Again" and
    "Another rival".
  - _A side's damage numbers are what landed:_ the ledger, the recap, the damage log and `lifeLeft` carry the scaled damage, and a hit
    on a character that the sheet calls 100 reads 30 in them. The result screen can say "damage ×0.3" once.
  - _The exit_ is kept shut by `noExit`; the scene should not draw one in a duel arena.
  - _Unscaled things:_ a minion's damage taken, stun, the magnitudes of ailments, regeneration, the rate leech is recovered at (the
    leech itself is of the scaled hit), flasks. The long fights favour builds that sustain, and a minion build whose minions die 3.3 times sooner,
    relatively; none of it was measured apart.
  - _A stall of minions:_ two summoners can fight each other's minions to a stall (a draw); the result should say "stalled".

**Built: F5 (2026-10-16).** A duel between the current character and a copy of itself or a bot build can be watched from the Debug panel
at camp (a Duel row), at every speed, on the round arena. Built headlessly and checked by `npm run build` and the tests only: **no browser was
opened** (the dev server's port was in use), so what the scene and the HUD look like is for the owner to see (the list under "Unverified"
below). As planned, with these differences and findings:

- **One HUD, not two** (the owner, 2026-10-16; section 5, decision 12, Appendix A): the rival is the boss bar, which lists a character of
  another side by its name with its life and energy shield (no readout) and has no distance cap. `Side` has no name: the bar reads the actor's
  (`createDuelWorld` names it by class; `DuelOpts.names` overrides, which changes nothing in the fight).
- **The round arena** (`duelPlan(seed, areaLevel)`, `src/sim/duel.ts`): the circle is `carveArena` in `gen/bossArena.ts`, which `attachArena`
  calls (same inequality, same bounds: **the default fence held after this commit alone**, 12 runs identical, 21.6 s wall against 21.7 s).
  25 by 25 tiles, `DUEL_ARENA_SIZE`; the floor is symmetric about the middle of the middle tile (12.5, 12.5), so the characters stand at
  **7.5 and 17.5**, not at 7 and 17 (the symmetry test of F4 is still a fair test). The biome is `biomeFor(seed, 100, 0, 'plain')`
  (every biome, none tied to a map number; the Debug panel's forced biome wins) and the theme is drawn from the seed (the theme tints
  the floor and the walls); the exit is on the north rim and `noExit` keeps it shut, and the scene draws no portal when `noExit` is on.
  `createDummyWorld` keeps `arenaPlan`. **The F2 to F4 duel tests passed on the round arena unchanged** (251 tests in the three files).
- **The median fight on the round arena** (the F4 sweep's legacy pool at ×0.3, 12 bot builds to maps 20 and 40, both orders, seed 1, 222
  fights): **15.5 s against the square's 15.7 s** (q1 8.2 s, q3 39.1 s; map 20: 13.6 s of 132 fights, all deaths; map 40: 16.4 s of 90, 87
  deaths and 3 on the cap; no stall, no both-dead), the west side won 111 and the east side 108. `DUEL_DAMAGE_SCALE` is not touched.
- **The events** (`levelUp`, `flaskUsed`, `stuck`, `playerDied`) carry the character's actor id as `src`. This moved the hash fence (it
  hashes every numeric field) and nothing else: in a commit of its own, the sequence of event kinds and every `MapResult` without its
  `eventHash` were identical over the fence's 12 runs (a scratch script that hashed the kinds), and **`scripts/hash-fence.json` was
  re-recorded right after that commit**; the final default fence holds against that record (12 runs identical, 21.2 s). The `buff` event
  names no actor either: the scene pulses for every side that has the skill and the buff running (`buffT[id] > 0`), so a mirror's two
  pulse together.
- **The scene** reads each side: `src/render/style/who.ts` (no Phaser, so a test reads it: `isViewer`, `figureOf`, `heroColor`), the
  per-side loops of `skillFx.ts`, a light per character, the camera on the middle of the living characters, the rival's boss ring, marks
  (a life bar and the selection bracket, in red) and picking. The siphon beam, the curse sigil and the minion lookup read the other side's
  too. `bossFx.ts` and `encounterFx.ts` still read side 0 (a duel has no bosses or encounters). `crashlog.ts`, `dev.ts`, `skillStatus.ts` (the
  skill bar) and the HUD's orbs, flasks and charges are side 0's.
- **The end rules** are `duelEnd(w, watch)` and `duelWatch(opts)` (`src/sim/duel.ts`): after a tick, a death of either (both in one tick is a
  draw), then the stall, then the cap. `playDuel` and the controller call them after every `stepWorld`, so they stop at the same tick: a
  test plays the controller at 1×, 4× and 8× with different frame sizes and gets `runDuel`'s winner, time and life to the bit.
- **The controller** is as section 5 says. `startDuel(a, b, seed, opts?, from?)`: the builds are copied (and each fight plays copies),
  `from` is where Leave and Back go (by default the screen it was started from when that is camp, a summary or a victory with a run, else the
  title); `Controller.duel` is a `DuelMode` (the builds, `opts`, the seed and its base, the names, `from`, the watch), `lastDuel` a
  `DuelOutcome` (`result`, `reports`, `names`, `seed`). `againDuel()` is `base + n`; `leaveDuel()` serves both Leave and Back. A map,
  the showcase, the gallery or `quit` clears `duel`.
- **The result screen** shows `MapReportView` for each side (it gained a `who` for the headings: "Damage Reaver dealt"). The reports are
  made before the world is torn down (`DuelResult.sides[i].ledger` is the live ledger, not a report).
- **The Debug panel** plays the bot to the map on the legacy curve with a label while it does (the run is synchronous: it waits 30 ms so
  that the label paints). `botBuild` (`src/run/duelBot.ts`, where `snapshotBuild`, `botSeed` and `LEGACY_PLAY` moved from
  `scripts/duel-lib.ts`, which re-exports them) returns the build the bot fell with when it dies before the map.
- **Tests:** 3,167 in 182 files (20 new). `src/run/duelMode.test.ts` (9), `duel.test.ts` (the arena, the events), `figure.test.ts`, `skillFx.test.ts`.
- **Unverified in a browser** (read twice, not seen): the arena's look in each biome (the room has the boss arena's rim and its
  corner brazier), both characters' figures and rings, a hit on the rival (blood, no shake, the number's colour), the camera on the midpoint
  and the zoom, each side's minions and zones, the boss bar and the Leave button on a phone and under 700 px (the bar is 34 px from the top and
  up to 560 px wide, the Leave button is in the showcase's place, top right; `mobile.css` has no boss-bar rule), the rival's marks, picking the
  rival, the result screen's two reports side by side (`report.css`, `.duel-result`), and the label of the Bot button while it plays.
- **For F6 and F7:**
  - _Entry points._ `Controller.startDuel(a, b, seed, { names: [you, rival] }, from)` fights a build against a build; F7 starts it from the
    summary (`from` defaults to the summary there) with the rival's `Rival.build`. The seed is the caller's (`againDuel` adds one for each
    fight); "Another rival" is `startDuel` with another `Rival`, and `leaveDuel()` is Back.
  - _What the result screen needs from a rival:_ a name (`opts.names[1]`, shown on the boss bar, the inspect card and the result), a class (from
    `build.classId`) and a complete `Build`. Nothing else is read; the record of results (F7) is the caller's, from `lastDuel.result`
    (`winner`, `how`, `time`).
  - _Side 0 is "you"_ everywhere on screen. A duel from a rival's point of view would swap the builds.
  - _Not done:_ rival names, snapshots and the fetch (F6), "Fight a rival", the Rivals screen and the record (F7), a level-dependent
    damage scale (the open question of F4), monsters in a duel.

**Built: F6 (2026-10-17).** The snapshot, the pool, the opt-in, the names and the high score function, built headlessly and tested with an
injected `fetch` only: **nothing was posted to the project, `docs/rivals.sql` has not been run** (no database here, and the owner reviews and runs
it); the title screen was looked at in a desktop browser only (the checkbox, the name field, the line for an invalid name), not on a phone. As planned, with the owner's two changes of 2026-10-17 (names are typed with a generated
fallback; the high scores are the duel ratings of snapshots, written by a later ranking job) and these differences and findings:

- **The SQL** (`docs/rivals.sql`, 12 numbered entries, each commented): the table `rivals` (with `rating`, `fights`, `wins`, `rated_at`); two
  indexes; `blocked_words` (empty; the table refuses a word that is not lowercase); `rivals_defaults` (resets `created_at` and the four ranking
  columns on insert; **`created_at` is an addition of mine**: without it a client could post a past time and dodge the daily cap, or a future one
  and sit first in "newest first"); `rivals_check_name` and `rivals_rate_cap` (both `security definer`, `set search_path = public`, for the reason
  in the file); row-level security and the grants; the two row types `rival_row` and `high_score_row`; `rivals_for` and `high_scores`; the cleanup
  statement, commented; and a `notify pgrst` to reload the API's schema. The three triggers fire in the order of their names (`rivals_1_defaults`,
  `rivals_2_check_name`, `rivals_3_rate_cap`). The functions are `language sql`, with the parameters of `rivals_for` written `rivals_for.map` and so
  on where a column has the same name (the brief's parameter names are kept; the row types are declared with `create type`, so a re-run drops the
  functions, then the types, then makes them again). The partial index a big `high_scores` would want is not made.
- **`src/run/rivals.ts`**: as the brief says. `rivalRecord`'s `res` is not read (it is the hook's shape). `validateRival` checks, beyond the
  brief's list: the name's rule, the class, the level and map ranges, that the build's class and level are the row's, that an equipment slot is a
  slot, flask affixes (against `FLASK_AFFIXES`), the polished families, a unique's mods and triggers (a `castGranted` skill must exist), that a
  mod has a stat, a kind and a number, and the Strategy's enums. **A unique's affix has the family `unique`**, which is not in `FAMILIES`
  (`rollUnique` writes it and a unique flask has it too): it is accepted on an item that has a `uniqueId` only, and a test fights every unique
  item and every unique flask through the check. A gem id goes through `gemDef`, so a saved `cindering` still passes as it does in `Character`.
  It says nothing of legality (points, tiers, requirements).
- **`validName` is the table's regex exactly** (starting and ending with a letter or digit), a little stricter than "no leading or trailing
  space"; `NAME_PATTERN` is exported and a test reads the SQL file to hold the two the same. The record uses the typed name only if it is valid
  at the moment of posting.
- **Bots: one token for each run, from its class and seed** (`bot:<class>:<seed>`, hashed), not from the seed alone: the sim plays each seed for
  every class, and one token would spend a seed's 20 daily rows on six classes. `RivalLog` (`scripts/rivallog.ts`) posts **one row to a request**,
  so a row the deny-list stops costs only itself. `--rivals` and `--log` work together.
- **`ipViolations` moved to `src/data/ipScan.ts`** so that the tests can use it without importing `ip.test.ts`; `ip.test.ts` imports it. The IP
  test's glob already covers `rivalNames.ts` (the lists are exported strings). Both lists are 64 and 63 entries (about 4,000 names).
- **`src/telemetry.ts`'s hook now chains the one already on the controller** (it replaced it before), and so does `installRivals`, which runs the
  earlier hook first and still sends if it throws; a test installs both in each order against the real `installTelemetry`. `main.ts` installs
  telemetry, then rivals. The rivals hook does **not** split the dev server from the published game as telemetry does (the table has no
  such split): a developer who ticks the box posts real rows. A dead run's `build` is copied before the (async) hash is awaited.
- **Measured:** twelve real bot characters (every class, seeds 1 and 2, legacy difficulty, played to the end of the run; 6 to 395 s each) all
  pass `validateRival` and are 5.9 KB of JSON at map 10, 6.4 to 8.9 KB at maps 20 to 95 and **9.8 KB at map 100** (a win with 5 uniques and 123
  passives). The table's check is 16,384 bytes **as jsonb**, which was not measured (no Postgres here): at the 1.45 times that TELEMETRY.md found
  for `details` the limit would be about 11 KB of JSON, so the largest late builds are the ones to watch. If a seeded win is refused with a
  check violation on `build`, raise the number in `docs/rivals.sql`.
- **Tests:** `src/run/rivals.test.ts` (24), `src/rivals.test.ts` (7), `scripts/rivallog.test.ts` (3). `npm run check` and `npm run build` are green.
- **What the owner runs, in this order:** (1) read and run `docs/rivals.sql` in the SQL editor; (2) fill `blocked_words` in the table editor;
  (3) one insert by the client's path, `npm run sim -- --runs 1 --class vanguard --seed 1 --rivals` (the bot dies on map 20 in about 4 s; expect
  `rivals: sent 1 of 1 bot characters`), then the three `curl` checks of TELEMETRY.md "Rivals and high scores" ("Checking it works"); (4) seed:
  `npm run sim -- --runs 10 --class all --seed 1 --rivals` (about 60 bot characters; more seeds, and `--legacy`, for more and deeper ones). A game
  version that has this code posts characters when a player ticks the box, so deploy it after step 1.
- **For F7:**
  - _The rows._ `fetchRivals(fetchFn, SINK, { saveVersion: SAVE_VERSION, map, k, excludeTokenHash })` gives validated `Rival`s (6.1);
    `excludeTokenHash` is `await hashToken(rivalToken())` (`src/rivals.ts`). `fetchHighScores(fetchFn, SINK, k)` gives
    `{ id, name, classId, level, map, outcome, rating, fights, wins, gameVersion, postedOn }` and **no build**: a "fight this one" from the
    list needs a function that returns one snapshot by id, which is not built. Both return `[]` offline, with no table, or with no ratings yet.
  - _The same rivals every time._ `rivals_for` is newest first, so one call returns the same K until new rows arrive: ask for `k = 20` and draw
    5 with the seeded RNG on the client (the random tiebreak only separates rows made in one instant).
  - _The preferences._ `rivalsOn()`, `setRivals(on)`, `rivalName()`, `setRivalName(s)`, `sendName()` (the typed name if valid, else null),
    `rivalToken()`, `rivalsConfigured()`, all in `src/rivals.ts`; the title screen's `RivalsNotice` is the model for the summary's line.
  - _The summary's first-time line_ ("Add this character to the rivals other players fight"): when the player ticks it, the run that just
    ended has **already** passed through the hook with the preference off, so the line must also post that character then
    (`rivalRecord(run, res, { name: sendName(), tokenHash: await hashToken(rivalToken()), version, seed: run.seed })` and `postRival`, with the
    `res` of `Controller.lastResult`, `run.phase` being `'dead'` or `'victory'`).
  - _A rival from the wire is checked against `Character`, not against the whole sim._ `startDuel` on a snapshot should be inside a `try`, and a
    rival that throws is dropped from the list.
  - _The map to look near_ is `run.map`; the rivals the player fights are compared by `Rival.map`, `level`, `outcome`, and `buildSignature(build)`.

**Built: F7 (2026-10-17).** Every screen between a death and a fight: the opt-in and the duel button on the run summary, the Rivals
screen, the rated fight with its report and the rating's move on the result screen, the record, and the high scores. Built headlessly
and tested with an injected `fetch` and, for the screens, a small text renderer (Preact's function components called with the hooks
stood in for, `src/ui/rivalScreens.test.ts`: it is how the text of each screen was read); **no browser was opened and nothing was
posted to the project**, so what the screens look like and how they feel is for the owner (the list under "Unverified"). As planned,
with the owner's decisions of 2026-10-17 (6.5; Appendix A: a typed name is needed to duel, the feature's name, the fallback dropped,
difficulty never shown, the rated fight and its report, `my_snapshots`, the high scores' button) and these differences and findings:

- **The post is an act, and kept** (`src/rivals.ts`: `postRun`, `postStatus`, `pendingPost`, `watchPost`). One keeper serves the hook at
  the end of a run, the summary and the Rivals screen; it holds the run's post as `sending`, `posted` or `failed` (a name the table refused,
  or the rivals out of reach: `nameRefused` reads the check violation's message, so that a cap and a block are "Could not reach the
  rivals"), posts a run once, and lets a run that failed be posted again. It remembers the last run it posted in `bob.pref.rivalPosted`,
  keyed by **class, seed and maps played** rather than the seed alone (a seed played twice is two runs). The hook posts only with the box
  on and a valid typed name. The summary posts when the box is ticked with a valid name already typed, or when the duel button is pressed
  (it awaits the post and goes on only when the character is in); **it never posts on the keystrokes of a name**, which the brief's
  "ticking it with a valid name" would have done at the third letter. For the same reason the opt-in stays on the summary until the
  character is sent (the brief's "when the box is off or the name is not valid" would have unmounted the field at the third letter).
- **`postRival` returns `{ ok, status?, code?, message? }`** and `postDuel` `{ outcome: 'rated' | 'already' | 'refused' | 'failed',
message? }` (the brief had the bare outcome; the result screen needs the server's reason). Both read the PostgREST body only when the
  fetch has one, so a plain `{ ok }` double still works; `scripts/rivallog.ts` counts `.ok`. `Rival` gains `rating`, `fights` and `wins`
  (the card shows them), read leniently. `fetchRivalsOrNull`, `fetchHighScoresOrNull` and `fetchMySnapshots` return null when the sink
  could not be asked, to tell "offline" from "none" (the plain `fetchRivals` and `fetchHighScores` still give `[]`).
- **The record is per pair, not per rival** (`src/run/rivalRecord.ts`, 300 pairs kept): the database allows one rated report for each
  ordered pair (the player's snapshot, the rival), and every run posts a new snapshot, so a record keyed by the rival alone would call a
  new character's first fight against a rival "practice" and never report it. A pair rated before fights on the seed after its last; a
  rated fight that was not reported (offline, refused) is rated again. The summary's tally is the pairs of this run's snapshot.
- **The controller** (`src/run/controller.ts`): `startDuel` returns a boolean and is transactional (the world is made first, so a build
  that will not make one throws with nothing changed) and refuses while a map of a run is being played; `startRivalDuel(rival, myId,
myName)` runs it in a `try` and drops a rival that throws; `leaveDuel(to?)` (Back is the summary, Another rival and Leave the cards);
  `DuelMode.rival` is `{ rivalId, myId, rated, home }`; the end of a fight against a rival updates the record and calls `onDuelEnd`
  (`reportDuel` in `src/rivals.ts` posts the report of the rated one: one report, once, before the screen says "Rated"). The cards and
  the draw's counter live on `Controller.rivals`, a sibling of `duel` because `leaveDuel` clears `duel`, and go with the run (a quit, a
  new run, a continue). "Show others" draws five of the twenty that are not on the cards (a pool of five or fewer has no such button).
- **Fights counted, and not**: Leave, mid-fight, counts for nothing (a player who watches a fight and leaves it when it goes badly
  reports nothing; cheating by omission is tolerated at this scale, section 9). The rivals' own ratings on the cards are as they were
  fetched; only the player's rating is read again.
- **`buildSignature`** (`src/run/rivals.ts`) is the card's: the main skill, up to three keystones and four uniques, by name. It is not
  `metrics.buildSignature`, the telemetry's line of ids, which keeps its name.
- **Tests:** 3,290 in 190 files (89 new). `src/run/rivalScreens.test.ts` (22: `duelSeedFor` against the SQL's own constants,
  `postRival`'s reasons, `postDuel`'s request and four outcomes, `fetchMySnapshots`, `buildSignature` on a real bot build, the draw),
  `rivalRecord.test.ts` (8), `rivalDuel.test.ts` (15: the controller), `src/rivals.test.ts` (16: the hook posts nothing without a name,
  a run is never posted twice, a refused name is reported), `src/rivalsScreens.test.ts` (17: the Rivals screen's fetches in order, the
  report and the rating's move, the high scores) and `src/ui/rivalScreens.test.ts` (18: each screen's text and buttons).
- **Unverified in a browser** (read twice, not seen; in the order of the flow): the title screen's hint "A name is needed to duel" and the
  new High scores button beside Codex and Patch notes; the summary's block under the recap (the opt-in with the field, then the button
  "Duel for your damned soul's fate", "That name is not allowed", "Could not reach the rivals" with "Try again", and the line "You beat
  3 of 5 rivals · Your rating 318") on a phone too; the Rivals screen: the five cards (`rivals.css`: how a card's lines fit, the bot
  mark, the build line wrapping, a card as a button on touch), "Show others", the "Looking for rivals…" wait, the lines for none near,
  offline and a character that was not sent; a card pressed from the summary starting the duel (the map screen coming up from a summary
  screen, the rival's name on the boss bar, Leave going back to the cards); the result screen's line ("Rated · 240 → 318", "Rated",
  "Practice", "Unrated: offline") and its three buttons; Another rival coming back to the same five with "you: 2 of 3"; the high scores
  table (the highlighted rows, the phone layout that keeps rank, name, class and rating). And the whole flow against the live project,
  which nothing here has done: a death, the opt-in, the row in `rivals`, `my_snapshots` finding it, a rated fight, the row in `duels`,
  both ratings moving, the list.
- **What the nightly verifier will need from the client** (section 13): a `duels` row has `a_id`, `b_id`, `winner` (0 is `a`, the player's
  snapshot; 1 is `b`; null a draw), `how`, `seconds` (the fight's time rounded to hundredths, so compare with a tolerance of 0.01),
  the server's `seed` (`duel_seed(a, b)`) and `game_version` (the commit; `local` for a dev server, which cannot be replayed). The fight
  is `runDuel(a.build, b.build, seed)` of **the two snapshots' `build` columns as posted** with the default options (the client passes
  only the names, which change nothing in a fight): the duel's damage scale, end rules and arena are the defaults of that game version,
  so the job must run the code of `game_version`. The client plays copies of both builds (a snapshot is `run.build` as the run ended,
  `rivalRecord`), at each character's own level.

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
- **A rated fight is reported by the browser that played it** (6.3, 6.5), and the report can lie: the database forces the seed (the
  pair's), refuses a report whose token hash is not the snapshot's and a bot's, and allows one rated fight per pair, so a liar can
  only claim a result for a fight that has that seed, against a rival that exists; the nightly job (13) replays each report and
  recomputes the ratings, so a false one moves the ladder for a day at most. "Again" is practice and is never uploaded.
- **Privacy.** A rival row holds a character, a hashed random token and the name the player typed (a made-up one only for a bot), no
  run history, no id that links to a person; it is a separate opt-in, with its own checkbox and its own
  preference, so TELEMETRY.md's promise of no identity stays true of `runs`. TELEMETRY.md has a section ("Rivals and high scores")
  that says exactly what is sent. A player who turns the opt-in off stops new rows; rows already sent stay until the retention
  rule removes them.

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
  monsters, ..."; the deterministic step runs each side's sub-steps per side, alternating from tick to tick (a mix of the tick and the seed).
- §13.1 Player AI: a paragraph on duel mode (3.4). §13.2 Monsters: "chase the nearest side's character".
- §5.1 Flow: `Death → Run summary → (Fight a rival → Rivals → Duel → Result)* → Title`.
- §14.1 Module map: `sim/side.ts`, `sim/duel.ts`, `run/rivals.ts`, `ui/Rivals.tsx`, `ui/DuelResult.tsx`, `data/rivalNames.ts`.
- Appendix A, dated on approval: (1) the player singleton is replaced by `World.sides`, side 0 the local player's; functions
  act for a side, the hit path reads sides from actors, monsters hunt the nearest side; (2) `team` replaces `faction`, sides
  have their own and monsters one of theirs; (3) a duel brings the build and full vitals only: no provisions, reprieves, map
  mods or resist penalty; (4) the order of sides alternates from tick to tick, drawn from the tick and the seed; (5) the damage scale default, when measured; (6)
  rivals are a separate opt-in with a hashed storage token and a typed or made-up name, beside the anonymous telemetry.

---

## 12. Decisions proposed (defaults in effect unless the user says otherwise)

| #   | Decision                  | Default                                                                                                      | Alternatives                                                                                |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | Where the side comes from | The three patterns of 3.2: a parameter, the actor, `hunted`                                                  | A side on the world's "current context" (a hidden singleton again)                          |
| 2   | Tests                     | A codemod to `w.sides[0].<field>`; no compatibility getters on `World`                                       | Getters that keep `w.player` working (and keep the singleton alive)                         |
| 3   | What ends a duel          | A death; the 250 s cap goes to fewer reprieves used, else a draw; a 15 s stall is a draw (DUEL-BALANCE.md)   | Decide a cap by life left (rejected: it punishes low-life builds); let the stall skip       |
| 4   | Reprieves and provisions  | Three Bargain Coins a side, no provisions (DUEL-BALANCE.md 2)                                                | Bring the reprieves the run still held; none (F4)                                           |
| 5   | Resist penalty and level  | None; each character at its own level                                                                        | Each at its own map tier's penalty                                                          |
| 6   | Damage scale              | ×0.3 (F4 measured: median fights of 16 s and 25 s, 3% and 6% on the cap)                                     | ×1 always (the first hit decides); a scale that falls with the level                        |
| 7   | Arena and distance        | The boss arena's round room, a biome look, 10 tiles apart                                                    | The dummy's open floor; a labyrinth room                                                    |
| 8   | Who is offered            | Five drawn from twenty of the same save version within ±10 maps, players before bots, never one's own (F7)   | Same class only; any depth                                                                  |
| 9   | Names                     | Typed (3 to 16 characters) and needed to duel, under the database's rules and deny-list; made up for bots    | Generated only, rerollable (the plan); made up when blank (F6)                              |
| 10  | Identity                  | A random storage token, hashed                                                                               | Supabase anonymous sign-in (LADDER.md 8.3)                                                  |
| 11  | What is uploaded          | The snapshot, and the report of each rated fight (the first of a pair); practice stays local                 | The snapshot only; results stay local (the plan)                                            |
| 12  | The rival's HUD           | None: the player's HUD, and the rival as a boss bar (name, life, energy shield), on a phone too (owner, F5)  | A second HUD on the right, a bar on a phone (the plan); two full HUDs stacked               |
| 13  | Who a character goes for  | The other character and its minions, by the strategy's priority; the other counts as a boss for `rares` (F4) | The other character only (a summoner draws every fight against melee)                       |
| 14  | Who acts first            | Reversed or not on each tick by a mix of the tick and the seed: each fight is fair in itself (F4)            | The tick parity (does not alternate who is first); the seed's parity (fair over seeds only) |

---

## 13. Out of scope (later plans)

- **The nightly verifier** (the owner, 2026-10-17: the high score list is the duel ratings of rival snapshots, moved live by
  the fights players report, 6.3): a job with the service role (GitHub Actions, the key a repository secret) that replays every
  unverified row of `duels` at its game version with `runDuel` and the pair's seed, sets `verified`, recomputes every rating
  from the verified rows alone (from ten times the level, the same K schedule as the trigger) and writes `rating`, `fights`,
  `wins` and `rated_at` back; a report that does not replay is unrated, and a reporter with several such goes on the block
  list by the owner's hand. Open there: whether a fight played in one browser engine replays bit for bit in Node (a
  transcendental function may differ in the last bit; measure with the determinism hash across Chrome, Firefox and Node before
  trusting a mismatch), and the legality checks on snapshots (LADDER.md section 8.2), which the job is the place for. Seasons
  and the other forks (LADDER.md section 10, forks 3 to 5) stay out of scope.
- **Sparring from camp** with the character as it stands, and entering mid-run snapshots (a pool of characters captured at
  every tenth map cleared, not only at the end of a run).
- **Legality checks** on snapshots.
- **Fighting one's own saved runs** offline, which section 6.5 had as the fallback for an empty or unreachable pool: dropped by the
  owner on 2026-10-17 (an empty pool is a line and Back).
- **Totems and other deployables with life**, and **monsters together with two characters** (co-operative or three-way).
- **Replays**: a duel is deterministic from two builds and a seed, so a replay is a seed; a share link is a later screen.
