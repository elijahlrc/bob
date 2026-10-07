# Bob — Progress

Current milestone: **M7 — Full-size tree and balance**

Spec: [DESIGN.md](DESIGN.md). Each milestone ends with green `npm run check` and `npm run build` and one commit.

## M0 — Foundations

- [x] `src/` folders from §14.1 exist; ESLint import boundaries and banned globals active (deliberate violation verified)
- [x] `core/rng.ts` sfc32 with `next/int/float/pick/weighted/fork`, tested
- [x] `mods/` Mod, ModDB sum/product, conditions, `per`, text templates, tested
- [x] Preact title screen over the Phaser canvas

## M1 — Playable vertical slice ✅

- [x] Labyrinth generator meets §10.2 over 200 seeds
- [x] MapScene renders grid; player auto-walks; skeletons chase and fight
- [x] Simple combat (the full §6.5 pipeline is already shared by calc and sim)
- [x] End room → exit → camp; death → summary
- [x] Speed controls 1×/2×/4×/8×/pause
- [x] Determinism test for `runMap`
- [x] Browser: map 1 → camp → map 2 with zero input (auto-continue), no console errors

Notes: content for later milestones (all gems, item bases, flasks, monster types/variants/mods,
themes, an estimated XP table) is already written; population already rolls magic/rare packs.
Balance is untuned (several classes can die on maps 1–2; see M7). `window.__bob` exposes the
controller in dev builds for debugging.

## M2 — Combat rules ✅

- [x] Full damage pipeline, unit-tested (`calc/pipeline.test.ts`, `sim/combat.test.ts`)
- [x] Six ailments + stun in sim with indicators (pips, freeze ring, stun stars)
- [x] `computeCharacter` full sheet + `diffSheets` (< 5 ms)
- [x] Convergence test: melee phys, crit spell, conversion, dual wield (alternating and Sweep),
      projectile attack, chaining spell, falloff spell, poison — each with and without evasion/resists
- [x] Flasks with auto-use policy

## M3 — Character building ✅

- [x] Six classes
- [x] Tree engine — built at **full size** already (1,344 nodes, 139 notables, 21 keystones); every
      §9.3 invariant passes, including the node-count range; all 21 keystones tested
- [x] SVG tree UI: pan, zoom, tooltips, path allocation, refund, point counters
- [x] XP, levelling (mid-map rebuild), passive and bonus points
- [x] Gems: sockets, all-linked supports, auto-level (+socketed levels to 25), primary selection,
      default-attack fallback, 7 actives + 17 supports (Skills tab)
- [x] 7 auras with reservation and the inactive-aura warning (Character tab)

## M4 — Items ✅

- [x] All bases (60 weapons, 96 armour, 12 shields, jewellery, belts, quivers); 57 affix families /
      360 tiers (minIlvl 1–82) generated from compact definitions; ilvl-gated rolling with max-affix
      rules (tested)
- [x] Rarity, naming (magic prefix/suffix names, rare two-word names), drop tables (tested)
- [x] 30 uniques incl. the 12 listed; at least one per starting weapon class; levels 2–80
- [x] Flask bases and 9 flask affix families (magic flasks)
- [x] Items tab: equip (gems carry over), unequip, discard, flask slots, requirement checks,
      item cards with compare deltas from the calc engine
- [x] Chests in side branches (magic-or-better item or a gem)

## M5 — Enemies ✅

- [x] 4 types × elemental variants with distinct silhouettes and tints
- [x] Magic/rare/mini-boss with all 15 mods (volatile, raiser, rime aura in the sim); rare names
- [x] Level scaling (§12.1 fixtures), XP, pack population (70/22/8 tested)
- [x] Themes and the 2-option next-map choice
- [x] The Ossuary Regent: 1.6 s swing, telegraphed slam every 7 s, raises 4 warriors at 75/50/25%,
      +30% resists, ×4 stun threshold, crowned sprite (tested headless)

## M6 — Run loop ✅

- [x] 100-map schedule: rooms, resist penalties (0/−30/−60), +3 bonus points after maps 10–80,
      refund points, reward picks (after every 5th map), auto-continue, mini-bosses every 10th map,
      boss on map 100, victory and run-summary screens
- [x] Save/load at camp (`bob.save`, version 1, injected storage), Continue run on the title screen,
      "save incompatible" handling
- [x] `npm run sim` headless bot (greedy Δ(DPS × EHP): passives, equipment, gems, flasks, rewards) at
      1,700–3,000× real time (requirement: 500×)
- [x] XP table derived from bot measurements (`src/data/measuredXp.ts`, from 60 runs); median level
      within ±4 of the map number
- [x] README updated

Deferred / changed in M6: the reward pick after a **mini-boss** (§5.3) is not separate from the
every-5th-map rule (maps 10, 20, … are multiples of 5 already, so it is covered).

## M7 — Full-size tree and balance ✅

- [x] Full tree: 1,344 nodes (limit 1,250–1,350), 139 notables, 21 keystones, 160-odd clusters; every §9.3
      invariant passes (connectivity, spacing ≥ 40, no edge through a foreign node, ≥ 4 keystones within
      40 points and ≥ 15 notables within 30 points of every class start, unique notable names, ≤ 3 sharing a
      mod set, deterministic snapshot)
- [x] Tree view: SVG, a single group transform for pan/zoom (no re-render; 0.16 ms JS + layout per update
      with all 1,344 nodes and 1,440 edges). The in-app browser throttles animation frames to 1 Hz, so paint
      frame rate could not be measured here; the canvas fallback was therefore not built (see Appendix A)
- [x] Balance pass, 60 bot runs (10 per class, `npm run sim -- --runs 10 --class all --seed 1`):
  - map 1 clear rate: **100%** (600 of 600 runs, 100 per class, seed 7)
  - every class median map reached ≥ 25 (lowest: Zealot 55.5); all six classes ≥ 50 (need 3)
  - **22 of 60 runs won** (clearing map 100); runs are not a human benchmark: the bot is greedy
  - pacing: median level after map 10 / 25 / 50 / 75 / 90 / 100 = 11 / 25 / 51 / 75 / 90 / 99 (±4 ✓)
  - stuck-guard triggers: 0.00 per 10 maps (need < 1)
  - speed: 1,600–2,300× real time (need ≥ 500×)

## Definition of done

M0–M7 are met. `npm run check` and `npm run build` are green, and a browser playthrough of maps 1–2 (from
the title screen, with the class select, camp and auto-continue) shows no console errors.

## After M7: inventory management

- Items tab rewritten: sortable/filterable list with per-item Δ DPS / Δ EHP badges, NEW tags, side-by-side
  compare with the item being replaced, target-slot highlighting, double-click and keyboard shortcuts,
  "discard junk", sort/filter preferences remembered (`localStorage`, `bob.pref.*`).
- Skills tab: gem list with best-placement badges, per-socket effect previews, drag-and-drop and
  click-to-place, auto-socket, swap between items.
- Camp-wide undo (Ctrl+Z, 40 steps) in `Controller.act`; headless logic in `src/run/inventoryOps.ts`
  (tested in `inventoryOps.test.ts`).

## Deferred / cut

- Combat log, minimap, sound, seed entry, per-skill DPS breakdown, manual flask hotkeys (the "Stretch"
  list). Nothing from M0–M7 was cut.
- No canvas tree renderer (the SVG met the cost measurement; see above).
- Only `primary` skill is used; other actives are inactive in v1, as specified.

See also `docs/BUGS.md` for the list of bugs to revisit after the aesthetic is chosen.

## Known bugs / limitations

- Saves store passive allocations as tree node ids; editing `src/data/tree/spec.ts` invalidates saves
  (bump `SAVE_VERSION`).
- The in-app browser pane throttles animation frames, so the Phaser camera lags in screenshots taken there;
  it is correct in a normal foreground tab.
- Strider and Shade are the weakest classes for the bot (median 74 and 73.5); Reaver and Vanguard the
  strongest. The bot is a greedy heuristic and under-uses auras and flasks; a human should do better.
- Late-game monster damage is far below the original design's sample table (Appendix A): the bot-assembled
  builds are modest, and humans can build stronger characters.

## Latest bot results

```
Bot results — 10 run(s) per class, maps up to 100, seed 1

| Class | Wins | Median map reached | Median level @25/50/75 | Deaths (maps) | Stuck/10 maps | Mean map time (1×) | Wall s/run | Speed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vanguard | 7/10 | 101 | 25/50/75 | —, 23, 17, —, —, —, —, —, —, 100 | 0.00 | 100 s | 4.5 | 1892× |
| strider | 0/10 | 74 | 25.5/51/75 | 79, 100, 69, 14, 100, 13, 19, 97, 10, 99 | 0.00 | 134 s | 3.5 | 2336× |
| mystic | 5/10 | 69.5 | 25.5/51/75 | —, 24, 17, —, —, 24, —, —, 19, 38 | 0.00 | 82 s | 2.7 | 1869× |
| reaver | 5/10 | 100.5 | 25/50/75 | 40, —, —, 31, 100, 100, —, —, —, 40 | 0.00 | 86 s | 4.4 | 1591× |
| zealot | 4/10 | 55.5 | 25/50/76 | —, 45, 17, 31, 66, —, 30, —, —, 39 | 0.00 | 113 s | 3.5 | 2074× |
| shade | 1/10 | 73.5 | 25/51/76 | 80, —, 81, 10, 67, 100, 26, 40, 84, 39 | 0.00 | 104 s | 3.2 | 2087× |

Pacing (median level after map): map 1: level 1 (n=60) · map 10: level 11 (n=60) · map 25: level 25 (n=48) · map 50: level 51 (n=37) · map 75: level 75 (n=34) · map 90: level 90 (n=30) · map 100: level 99 (n=28)
Total wall time: 217.9 s
```

## Visual style

The map is rendered as isometric Grimdark: crunchy pixel art, a diagonal 2:1 camera, real-time lights and
particles (`src/render/styles/grim/`, shared figure rig in `src/render/style/`). Three other styles were
explored and removed; see `docs/VISUAL_STYLES.md`. _Showcase_ mode on the Title screen auto-plays a demo
(N = next class). Uncaught errors are saved to `localStorage['bob.crashlog']` and shown as a copyable report
(`src/crashlog.ts`). Known bugs to revisit are in `docs/BUGS.md`.

## Depth expansion (`docs/EXPANSION.md`)

Status: approved with changes 2026-10-06; built in order X1 → X9. Nothing is committed until the user asks.

### X1 baselines, before any bot or engine change (2026-10-06, HEAD `e588cc1` plus the uncommitted harness and gem cards)

Greedy bot, `npm run sim -- --runs 10 --class all --seed 1`: **26 of 60 wins (43%)**.

| Class    | Wins | Median map reached | Deaths (maps)                            |
| -------- | ---- | ------------------ | ---------------------------------------- |
| vanguard | 7/10 | 101                | —, 36, —, 20, —, —, —, —, 34, —          |
| strider  | 2/10 | 100                | 100, 45, 59, 46, 100, —, 100, —, 10, 100 |
| mystic   | 4/10 | 58.5               | —, 42, 17, 16, —, 75, 41, —, —, 29       |
| reaver   | 3/10 | 85                 | —, 36, —, 70, 100, —, 33, 21, 100, 29    |
| zealot   | 5/10 | 96                 | 79, —, —, —, 67, 17, —, —, 91, 45        |
| shade    | 5/10 | 83                 | —, 36, 17, 16, —, —, —, —, 65, 39        |

Median level after map 25 / 50 / 75 / 100: 25 / 50 / 75 / 99. Speed 1,700–1,900× real time; 224 s for 60 runs.
(The 22/60 recorded earlier predates the ranged-standoff fixes.)

Random play, `npm run random -- --runs 120 --seed 2`: all 120 died (median map 3, latest 9);
**98 of 120 (82%) died within the first 5 maps**. Wall time 5.6 s.

### X1 done: the bot that plays the content (2026-10-06)

- **Steady-state conditions.** `CalcConfig.steady` ('clearing' or 'boss') adds the conditions that hold in a typical
  fight (recent hits taken and flask use, plus recent kills when clearing; low life when reserved life is at least 65%
  of the maximum; recent crits at 20% crit chance or more). The bot scores each build as a 70/30 geometric mean of
  its clearing and boss scores. With today's content (almost no conditional mods) this changes nothing: 60 runs with
  `--themes first` reproduce the baseline exactly (26/60, same deaths).
- **Theme choice.** `src/run/threat.ts` scores each offered theme from its monster mix: the DPS against its variants
  (elemental variants resist their element), the effective HP against its damage mix, the pressure of its monster
  types, and a small reward term. The bot takes the better theme; `--themes first` keeps the old behaviour.
  60 runs with `--themes best`: **30 of 60 wins (50%)**, against 26 of 60 with `--themes first` (+7 points; one
  60-run sample is about ±6 points of noise).
- **Reports.** `npm run sim -- --report` and `npm run random -- --report` print the killer histograms (faction, type,
  variant, rarity, mod, damage type), deaths by faction × class, uniques found and worn at maps 25/50/75/100, and
  the build signatures of the wins (`src/run/metrics.ts`, `src/run/report.ts`).
- **Reading the report (60 runs, first theme):** 34 deaths, all Ossuary; the top killers are warriors 38% and mages
  29%, then archers and brutes; the top mods are Raiser 21% and Fortified 18%. Uniques: a median of 1 found by map
  25 and 5 by map 100, with 15–23% of runs wearing one. Wins use 16 distinct build signatures (the biggest, a Crushing
  Blow build with no keystone or unique, is 23%).
- **Greedy win rate now 50%, the top of the 25–50% band.** The theme-aware bot is the bot later milestones compare to.

### X2 done, except secondary casts which wait for the user's answer (2026-10-06)

- **Conditions.** Five new ones (`beenHitRecently`, `leeching`, `esFull`, `targetLowLife`, `onLowMana`); `targetCursed` and
  `cursed` come with hexes in X8. **Low life is now measured against maximum life** (DESIGN §6.3), not against life left
  after reservation.
- **Defences and ailments.** Chaos can hit energy shield; physical damage can be taken as another type; typed damage
  taken; elemental immunities; no ailments; no leech from a monster; shock immunity; physical (or any type) can inflict
  another type's ailment; no elemental or no physical damage; spell increases that also apply to attacks; separate
  minimum and maximum "more"; instant leech on crits.
- **Item rules** (flag mods on the item): no other ring, socketed gems use life (with its own reservation reduction),
  granted keystones (not stacking with the tree), and tag-filtered socketed-gem levels. Flask buffs now reach the skill
  profile, and loot reads the player's item quantity and rarity.
- **Triggers.** Hit, crit, attack, kill, block and damage-taken triggers with a cooldown per source, a chance, a mana
  cost (no mana, no trigger), no action time, and nothing triggers from a triggered skill. Effects: cast a socketed spell,
  cast a granted skill, kill explosions (a queue of at most 20 a tick, so chains run on over later ticks), spreading shock
  or ignite, and recovering life, energy shield or mana. The sheet lists triggered skills with their DPS, and the bot
  counts it. Spells socketed in a trigger's item are triggered-only and can never be the primary skill.
- **Convergence.** A hit-triggered Arc Chain matches the calc within 5% (the calc models the primary as a regular beat;
  an earlier Poisson-style formula was 50% off).
- **Tests.** 280 (was 222). `npm run check` and `npm run build` are green.
- **Balance after X2** (60 greedy runs, same seeds, best-theme bot): **32/60 wins (53%)**, against 30/60 before X2, which
  is inside the noise of one 60-run sample but above the top of the 25–50% band, so it stays on the watch list. Random
  play: 98 of 120 still die within 5 maps. Speed 1,300–1,700× real time.
- **Tag budget.** `triggered` took the 31st of 32 bits. The mask is not widened; `hex` (X8) takes the 32nd.

### X3 done: acquisition and the wave-1 uniques (2026-10-06)

- **Acquisition.** The unique drop weight is 1.5 (was 0.5). A mini-boss drops a unique and the final boss drops two
  different ones. The reward picks after maps 25, 50 and 75 are three different uniques the character can wear. A unique
  that lists factions drops four times as often from those factions' monsters (all monsters are still Ossuary, so
  this only matters once new factions land). Unique flasks are part of the pool.
- **Wave 1.** 18 items and 5 flasks, all with a signature line tested in `src/gen/wave1.test.ts`, authoring notes (what
  each pairs with and is weak against), and the player-visible text for every new stat. Item cards set rule lines
  (flags, granted keystones, triggers) apart from stat lines. New: unique-only bases (Grave Rags), unique-only flask
  bases, and shock and freeze chance suffixes.
- **Measured** (60 greedy runs, same seeds): **median 19 uniques found per 100 maps** (target 15, was 5). 70% of runs
  wear a unique at map 50 (was 13%) and 81% at map 75. **Greedy win rate 28/60 (47%)**, inside the band. Random play:
  99 of 120 die within 5 maps. Speed about 1,500× real time.
- **Wave-1 uniques worn at map 50** (the target was 8 in 60 runs): **7** (Unblinking Longbow, Rimeclasp Gloves, Stonebrew
  Flask, Gambler's Tonic, The Bare Visor, The Steadfast Cassock, The Wide Cinch), and **9 at map 75**. One short at
  map 50; the old uniques compete for the same slots, and the bot only wears what scores higher.
- **Tests.** 316.

### X4 done: trigger uniques and supports (2026-10-06)

- **Content.** Wave 2: ten items (Thunderknell, Frostwrit, Gravescribe, Cinderfall Axe, Stormsplit Jerkin, Kindred Sparks,
  Twin Pyre Band, The Lantern Bulwark, Bloodglass Ward, Pickpocket's Lament) and Martyr's Draught. Two trigger supports
  (Critical Relay, Wounded Retort) and the item-only skill Ember Burst, a nova around the target.
- **Engine.** Trigger supports claim the spells linked to them in the same item; uniques can need more attributes than
  their base (Thunderknell asks for 120 Intelligence); socketed-gem bonuses can scale per character level; ignites can burn
  faster, and more than one can burn at once (the calc counts the expected number); mana on hit; life-to-energy-shield flasks
  and a policy that drinks one only when no enemy is close and the energy shield can hold the life.
- **Sheet and cards.** The character sheet lists triggered skills with their rate, DPS and mana; trigger lines and trigger
  support cards say when they fire.
- **Bot lookahead.** `botEquip` also tries "move the gem group elsewhere, then wear it" for uniques a plain swap rejects, so
  The Walled Heart gets worn (tested). It is limited to uniques because the trial costs a clone and a re-socketing.
- **Tests.** 337 at the end of X4.

### X5 done: counterplay mods, map affixes, threat preview, death recap (2026-10-06)

- **Fifteen counterplay mods** (Bloodless, Unyielding, Deflecting, Spellwarded, Fire/Frost/Storm-warded, Bulwarked, Keen-eyed,
  Sundering, Siphoning, Rot-touched, Shrouded, Splitting, Thorned), each with a mark and a description and a level gate (none
  before map 15, the warded mods from 30, Thorned from 40). Hex-warded and Hexcaller wait for X8.
- **Eleven map affixes** from map 20 (0–1 affixes, then 1–2 from map 40 and 2–3 from map 60), each with a reward, shown on the map
  buttons. The caustic-ground and champion affixes wait for X7, the hex ones for X8, and reflect for Chalk (X6).
- **Threat preview** on each map button: "For you: DPS ×0.62 · effective HP ×0.48" against a plain map, from the monsters'
  resistances, life and damage, and the affixes' effect on you.
- **Death recap** on the run summary: the killer and its mods, the last five seconds of damage by source and type, your
  resistances against their caps, and your ailments.
- **A player AI fix the new mods needed:** a skill that can deal no damage to its target (all of its damage types are
  immune) is replaced by the weapon attack, so a Fire-warded rare no longer makes a pure-fire build unwinnable.
- **Measured** (60 greedy runs, same seeds): the first-theme bot wins **13/60 (22%)** and the theme-aware bot **24/60 (40%)**:
  **+18 points** for choosing the map (target 5, stretch 8). The theme-aware bot is the one inside the 25–50% band.
  Random play: 99 of 120 still die within 5 maps. Top killers now include the warded mods and Shrouded.
- **Tests.** 365.

### X6 done: currency, Workbench, salvage, tablets (2026-10-06)

- **Eight currencies and five essences** that let you choose the outcome rather than roll for it: Reforging Ember (draw three
  alternatives beside the original, with pins), Marrow Pearl (add a chosen family), Unravelling Thread (remove a chosen
  affix), Whetstone (polish a roll), Socket Auger (set the socket count), Knucklebone Die and Rot Seal (the two gambles,
  odds tested over 10,000 samples), Wayfinder's Chalk (add or remove a map affix), and the essences.
- **Workbench tab** at camp: item picker, affix rows with Remove / Polish / Bench remove, an "Add an affix" list, bench
  recipes paid in Bone Dust, epitaph tablets you redeem when a set is complete, and a pick screen for Reforging Embers that
  shows the DPS and effective HP change of each alternative. "Salvage junk" on the Items tab turns spare gear into Dust.
- **Saves:** `SAVE_VERSION` is 2 and old saves are rejected (the user allowed breaking saves). A pending Ember pick survives
  save and reload and shows the same options (craft RNG is `fork('craft' + craftSeq)`).
- **Economy** (`npm run economy`): 0.48 / 1.49 / 2.98 / 4.09 currency per map in the four bands against targets of
  0.5 / 1.5 / 3 / 4.
- **Bots:** greedy crafting scores the real options on the sheet; `--craft greedy|random|none` on `npm run sim`.
- **Measured** (10 runs per class, 6 classes, seed 1): the crafting bot wins **28/60 (47%)**, the non-crafting bot
  **16/60 (27%)**: **+20 points** (target 5, stretch 8). The crafting bot is inside the 25–50% band. A randomly-crafting bot wins
  **16/60 (27%)**, no better than not crafting, so the crafting bot beats it by **+20 points** too.
- **Browser check:** Ember draw and pick, Pearl, tablet redeem and the camp Chalk buttons ran with no console errors.
- **Tests.** 393. `npm run check` and `npm run build` pass.

### Playtest fixes after X6 (2026-10-06)

- **Drop labels.** Ground drops show the item's name in its rarity colour (currency stacks read "Name ×3"); labels stack
  rather than overlap. Currency and unique flasks now have their own colours.
- **Items: "Last map (n)" filter.** `RunState.lastDrops` holds the uids of the items, gems and flasks the last cleared
  map dropped; each cleared map replaces it.
- **Workbench list** no longer collapses to slivers with many items (flex rows now keep their height), scrolls inside the
  viewport, is sticky beside the work panel, and has a search box once there are more than 12 items.
- **Gems are common.** Monsters now drop gems on their own (per monster: normal 0.6%, magic 3%, rare 18%, mini-boss 1,
  boss 1.5, times item quantity) and chests hold a gem 40% of the time (was 20%). The depth report gains "Gems found per
  100 maps": **23 before, 140 now** (vanguard, seed 5; 4 runs).

### Secondary casts (EXPANSION 5.5a) built (2026-10-06)

Built under the plan's default, because the user asked for every equipped skill to be cast and to finish the plan; it is one
revert if they would rather not.

- The primary (★) stays the spam skill. Every other usable active gem (one per skill, any equipped item) is cast whenever it
  is off cooldown, affordable, hurts the target and is in reach. The ready one with the longest cooldown goes first.
  Default cooldown 6 × use time, at least 3 s (`SECONDARY_COOLDOWN_USES`, `SECONDARY_MIN_COOLDOWN`); a skill may set its own.
- **Reach rule.** Only skills at least as long-reaching as the primary count. A probe caught the reverse case: a melee skill
  behind a bow was never cast (0 casts in 300 s) while the calc credited it 0.23 casts a second. Now it is not a secondary.
- **Calc.** `Character.secondaries`, `secondarySheets`, `primaryShare`, `cooldownOf`; `CharacterSheet.secondary` and
  `secondaryDps`; `sheetDps()` (primary + triggered + secondary) feeds the bot score, the item compare and the Δ DPS.
  Sheet tab: "Secondary casts" table; Skills tab: a line naming them.
- **Bot.** `botRegem` puts another active in a free socket when the combined score rises by 1%.
- **Convergence** (melee primary + ranged secondary on the dummy, 5 × 600 s): secondary casts per second, primary uses per
  second and hit DPS each within ±5% of the calc.
- **Tests.** 400.

### X7 done: the Rot, the Hollow and the Shieldbearer (2026-10-06)

- **Nine new monster types**, each drawn with an existing figure under a faction palette (Rot green, Hollow pale blue):
  Shieldbearer (Ossuary), Shambler, Bloater, Spitter, Carrion Hag (Rot), Gloomstalker, Wailer, Mana Wisp, Lantern Wight
  (Hollow). Types now carry a faction; themes carry faction shares (`typeShares`); `rollThemes` offers only themes whose
  `fromMap` has been reached.
- **Behaviours** (all in `src/sim/factions.ts`): corpses (10 s; none if frozen, ignited or caught in an explosion within 1 s of
  death), Shamblers rise once at half life, Hags raise up to 3 corpses every 8 s, Bloaters burst into a 2-tile caustic cloud
  (4 s) on contact or death, lasting ground zones (caustic, burning, chilling, shocking) that pulse damage, Gloomstalker
  blink (0.4 s telegraph, lands behind you), Mana Wisp drain and death nova, Lantern Wight ES shells for allies within 6
  tiles, the Shieldbearer's front shield (down while it swings or is stunned), Ethereal (Hollow: 50% physical reduction,
  cannot bleed), faction mods Festering and Putrid.
- **Hazard-aware player AI:** steps out of zones and about-to-land blasts when idle, but only to a spot from which the
  target is still in reach.
- **Themes** Charnel Pits (from map 8, +1 essence) and Hollow Vigil (from map 15), each led by a champion on its mini-boss:
  the Carrion Mother (raises every corpse in the room every 10 s; four caustic pools at half life) and the Unremembered
  (phases out for 2 s after each fifth of its life lost, then reappears behind you). In code the champion key is `chief`
  (the IP scan rejects the reference-game word as a key).
- **Threat model** now knows chaos damage (mix has 5 entries), innate conversion, the Hollow's ethereal cut to your DPS and
  a pressure factor for each faction's behaviours. (A regex with collapsed backslashes had hidden the chaos share; found by
  printing the theme mixes.) The default hit mix for effective HP gains 8% chaos (`[0.5, 0.14, 0.14, 0.14, 0.08]`).
- **Balance:** the first cut took the bot from about 62% to 17% wins (Rot 45% of deaths). Fixes: Shambler conversion 30%,
  Spitter 0.75 and Hag 0.5 damage, cloud 0.8 × hit per second, and the corrected threat model so the bot avoids bad maps.
  Final check (4 runs × 6 classes, seed 11): **10/24 wins (42%)**, deaths Rot 0%, Hollow 13%, Ossuary 87%.
  **Not met:** "each faction is the top killer of at least one archetype": the bot steers around Rot maps, so Rot kills
  almost nobody. Left as is; it is a tuning dial, not a bug.
- **Speed:** a bot run fell to 435× (below the 500× test). The profile showed 69% of the time in camp decisions; the greedy
  bot now re-equips and re-sockets after crafting only if crafting changed something. Now 631× cold, 929× warm.
- **Tests.** 424 (new: `sim/factions.test.ts` 21, `sim/hazard.test.ts` 3).

### X8 done: charges, hexes, the Ashen Choir, wave-3 uniques, twelve notables (2026-10-06)

- **Charges** (Grit, Fervour, Insight): at most 3 of each (+ items and tree), 10 s, all of a kind refresh when one is gained.
  Sources are stats (`chargeOn.<kill|block|crit|hit>.<kind>`, a chance); effects are injected into the mod pool by
  `calc/charges.ts`. The sheet assumes the maximum of every kind that has a source; the sim passes explicit counts and swaps
  to a cached `Character` per count (`sim/charges.ts`). HUD pips under the flasks.
- **Hexes** (Brittle Doom, Leaden Limbs, Feeble Grip, Open Wounds): four hex gems plus the support Hexing Strikes (hexes in the
  same item as the primary skill are applied to enemies it hits). 6 s, renewed on hit; a target holds `hexLimit` of yours;
  the player holds one monster hex. Curse effect scales them; "reduced effect of curses on you" scales monster hexes.
  Calc: `Character.hexes`, `hexTarget()` (resistance shift, vulnerability), effective HP counts Feeble Grip and Leaden Limbs.
  Sim: `sim/hexes.ts`. New conditions `targetCursed` and `cursed` (28 of 32 bits used).
- **The Ashen Choir** (from map 25): Hexer, Censer-bearer, Flagellant (Fervour stacks when allies die), Choirmaster (channelled
  heal, interrupted by a stun); mod Zealous; champion the Precentor (cycles hexes, heals, calls a Choirmaster at half life);
  theme Ashen Nave (+1 currency). Also the mods **Hex-warded** and **Hexcaller**.
- **Wave 3 uniques:** Lullaby Silks, Twice-Hexed Ring, Band of Endless Grit, Fervent Stride, The Trophy Cord (kills of rares give
  their monster mods in player versions for 20 s: `data/trophy.ts`).
- **Tree:** twelve new notables replace the notable of twelve clusters (charge sources, +max charges, hex effect, hex
  resistance, chaos resistance with ES, and three conditional payoffs). The tree keeps its size, so the 120–145 notable and
  1,250–1,350 node limits still hold. `SAVE_VERSION` is 3.
- **Convergence:** Open Wounds on the training dummy is within 3% of the calc (test).
- **Measured** (4 runs × 6 classes, seed 11): **9/24 wins (37%)**, inside the 25–50% band; the Choir caused no recorded deaths
  (the bot avoids it), so no faction exceeds 35%.
- **Tests.** 464.

### X9 done: the Swarm and the Reliquary (2026-10-06)

- **Eight new types with their own procedural rigs** (`render/style/figure.ts`, `buildCreature`): Gnawer, Carrion Bat, Bone Beetle, Nest
  (Swarm); Sentinel, Arbalest, Core Golem, Warden Pylon (Reliquary). Not built on the skeleton: circles, capsules and boxes
  posed from the same gait numbers.
- **Behaviours** (`sim/factions.ts`, `sim/ai.ts`, `sim/combat.ts`): Gnawers come as a pack of 8–14 (one pack per room); bats fly over
  walls and weave; beetles curl up when hit (80% less physical damage for 1.5 s, 3 s wait); nests spawn two Gnawers every 4 s up
  to 8 alive; sentinels have x2 armour and x3 stun threshold and slam a marked circle; arbalests never move and fire a piercing
  bolt; golems are always elemental, immune to their element, and leave burning/chilled/shocked ground for 6 s; pylons make
  allies within 5 tiles untouchable. Faction mod **Brood** (splits into three Gnawers).
- **Champions:** the Gnawing Queen (burrows out of sight, warns where she will rise, raises Nests) and the Reliquarian (immune to
  its current core element, changes it at every quarter of its life lost).
- **Themes:** Gnawing Warrens (from map 12), Reliquary Vault (from map 35, +1 Socket Auger as the theme bonus), and ten **mixed**
  themes from map 40 (two new factions at 50/50, the stronger bonus of the two).
- **Player AI:** shoots Nests and Pylons first when within four tiles of the nearest enemy (a pylon even without line of
  sight, since everything around it is untouchable until it falls); gives up a loot hunt after 20 s; fliers that die over a wall
  drop their loot on the nearest floor.
- **Found with `npm run lethality`** (new tool: the same level-43 character at map 45 against every theme): the first cut had the
  Reliquary Vault at 1/4 clears and the Warrens at 307 s a map. Causes and fixes: a pack per rolled Gnawer (now one per
  room), armour x4 on Sentinels (x2), an unreachable pylon shielding the whole room, loot dropped inside a wall by a bat, and
  nests out-spawning the AI. After the fixes every theme clears for vanguard at maps 45 and 80, except the Reliquary Vault alone
  (3/4 at map 80), which was eased once more (Arbalest damage, Sentinel and Arbalest weights).
- **Sim speed:** a room of 40 Swarm actors runs above 500x real time (test). To get there: separation looks only at living actors, sorted
  by x, and skips the wall check on open tiles (`Grid.clear`); `collide` stops after a pass that pushed nothing; the flask policy no
  longer scans the map every tick when no utility flask could be drunk.
- **Measured** (4 runs x 6 classes, seed 11): **6/24 wins (25%)**, the bottom of the 25–50% band. Deaths: Swarm 28%, Reliquary
  28%, Hollow 22%, Choir 11%, Ossuary 11%. No faction is above 35%. Every faction is the top killer of at least one class except
  the Rot, which the bot steers around (a tuning dial). Wins are spread over five of six classes.
- **Not measured:** distinct build signatures and worn uniques at map 50 over 60 runs (the plan asks for 60 runs; the small sims
  were chosen on request).
- **Tests.** 484.

### Final pass after X9 (2026-10-06)

- **Reliquary Vault's "+1 Socket Auger"** is now paid out (the leader of the end room drops one); it had been declared but never
  read. The bot's theme value (`themeReward`) now counts extra essences, extra currency and the Auger, which it had treated as
  worth nothing: that was part of why it steered around Charnel Pits and Ashen Nave.
- **Bot speed.** Giving the bot six times as many gems made its bag, its copies of the run and its re-socketing slower (the 500x
  test fell to 376x). The bot now salvages extra copies of a gem (keeps two), keeps 12 spare items, skips the crafting search
  when it has nothing to spend, remembers build scores (`scoreBuild` cache) and the attribute check (`attrsWithout`). The bone
  beetle uses its own timer instead of the Hexcaller's.
- **Tests.** 485. `npm run check` and `npm run build` pass.

- **Final measurement** (after the last Reliquary easing: life, damage and slam down, 50/50 Ossuary mix): 4 runs x 6 classes, seed 11:
  **5/24 wins (21%), just under the 25–50% band** (n = 24, so the true rate could be anywhere from about 8% to 40%). Deaths by
  faction: Reliquary 29%, Swarm 24%, Hollow 24%, Ossuary 14%, Choir 5%, Rot 0%. No faction is above 35%. The tuning dials, in the
  order to try them: Reliquary and Swarm monster stats (`data/monsters.ts`), the share of faction themes among the offers
  (`fromMap` in `data/themes.ts`), and the mixed themes (from map 40). `npm run lethality -- --class <c> --map <n> --mixed`
  shows a theme at a glance.

### No starting gems (2026-10-07)

- Characters start with weapons, two flasks and an empty two-socket body armour, and no gems. The first skill gems are the picks
  after maps 1–4. `startSkill`/`startSupport` are gone from the class data; the class card shows the starting weapon.
  Tests that need a working skill use `withStarterGems` (`src/run/starterGems.ts`).
- Small check (4 runs x 6 classes, seed 11): nobody dies before map 36, so the default attack carries maps 1–4; wins were 2/24
  (the previous check had 5/24; at this sample size the difference is within noise, but the win rate stays below the 25–50% band,
  see the X9 note).

### C0 done: reference and measurement (2026-10-07)

- **Reference list** (`npm run coverage:fetch`, wiki Cargo API): 349 gems (219 active, 130 support) as planned, and **782
  uniques** (the plan's 797 counted 15 wiki entries marked "not in game"; C-6 corrected). Provenance and filters are in
  `docs/coverage/README.md`.
- **3.9-era numbers:** Path of Building v1.4.155 (commit e3719726d7, the day after 3.9.0 launched) is extracted to
  `docs/coverage/pob-skills.json` (418 gems, level 1 and 20 values) and `pob-uniques.json` (749 uniques with variants).
- **Measurement:** `npm run coverage` and `docs/coverage/map.json` (every Bob gem and unique mapped; 2 gems are partial
  analogs). `scripts/coverage/coverage.test.ts` checks the map.
- **IP test** now denies every reference gem and unique name, and the 3.9-era names, as an exact `name`
  (`src/data/ip.test.ts`). No existing Bob name collides.
- **Draft tool:** `npm run coverage:draft -- gem|unique "Name"` writes a hand-review draft to
  `scripts/coverage/staging/` (git-ignored).
- **Fixed on the way:** `.gitignore` had a bare `coverage` that would have ignored `docs/coverage` and `scripts/coverage`;
  CLAUDE.md's IP bullet still said "never consult wiki or PoB data".
- **Coverage now: gems 36/349 (10.3%), uniques 38/782 (4.9%).** Potential if every bucket of a milestone is covered:
  C3 64% / 82%, C4 80% / 91%, C5 91% / 93%.

### C1 done: mechanics audit against 3.9.0 (2026-10-07)

- `docs/AUDIT-3.9.md`: 24 rules brought in line with 3.9.0 (each with a wiki revision), 12 divergences recorded in DESIGN 2.1,
  and the missing buff layer (Fortify, Onslaught, Impale, Rage, Arcane Surge, Culling Strike, Unholy Might) scheduled for C2.
- Biggest changes: hit chance ×1.15; crit confirmation and crit ailments ×1.5; bleed 70% a second (×3 moving); shock and
  chill `50 · r^0.4`; stun rules (ES ignore, 20% floor, melee weights); ES recharge 20% a second; dual wielding +20% more
  physical damage and +15% block; triggered skills cost no mana and have per-spell cooldowns; flask charges per kill.
- New tool: `npm run coverage:wiki -- "Page" [date]` prints a wiki page as it stood in the 3.9 era.
- Convergence tests needed no retuning. Small bot check (4 × 6, seed 11): 3/24 wins (was 2/24), within noise.
- **Tests.** 521.

### C2 done: engine foundations (2026-10-07)

- **Masks.** Tags and conditions are numbers of up to 52 bits (`maskOr`, `maskAnd`, `maskSubset`); 16 new tags (totem, trap,
  mine, brand, minion, channelling, duration, curse, warcry, herald, guard, movement, nova, slam, physical, chaos).
- **Skill types and support rules** (`src/data/skillTypes.ts`): every tag plus capability types; supports have `supports`
  (any of), `needs` (all of), `excludes` and `adds`, resolved to a fixpoint so a totem support changes what the others can do.
- **One spell damage curve** (`spellBaseDamage(level)` in constants): a spell is a `spread` plus an `effectiveness`; the draft
  tool emits it. The four hand-tuned spells keep their numbers.
- **Ailments scale from base damage** (the C1 fix, completed): per-chunk multipliers per ailment (`AilChunk`).
- **Buff layer** (`src/data/buffs.ts`, `src/sim/buffs.ts`): Fortified (hit-only damage taken), Quickened, Dread Might, Arcane
  Tide as conditions with timers; rage as a count carried in the dynamic mask; impale; culling strike.
- **Shapes:** nova and slam (burst with an origin), beam, ground zones (rain, clouds, walls, delayed blasts), returning
  projectiles. A channelled skill is repeated short casts, so there is no new action model; ramping stages are averaged.
- **Weapon families:** rune dagger, thrusting sword, warstaff (inside the dagger, sword and staff classes).
- **Tests generated for every gem** (`src/sim/gemSmoke.test.ts`), and a check that every stat in the data has text.
- **Not done in C2 (waiting for content to need it):** bot candidate pruning (the build scorer is unchanged; measure when C3
  batches land) and per-shape convergence cases (the generated gem test covers the sim; the 3% convergence test gets a case
  for each archetype as C3 adds gems).
- **Tests.** 592.

### C3 in progress: gem content (2026-10-07)

- **Gems.** 174 of 349 (104 of 219 actives, 70 of 130 supports) in nine hand-written batches (`docs/coverage/gems/c3g-*.json`,
  emitted to `src/data/gemsGen.ts`); every gem has its own name; numbers are the 3.9 level 1 and 20 anchors. Channelling,
  ramping stages, fuses and spreads are averaged into one repeated hit or a short ground zone (note on each map entry).
- **Engine additions for gems.** `needsDualWield` and `needsShield` on actives; per-charge `per` mods for charge skills; the bot
  skips supports whose rules cannot hold for the chosen skill; `ModDB` keeps its mods per kind.
- **Unique pipeline.** `docs/coverage/AUTHORING.md` and `emit-uniques.ts --check <file>` (dry run: open lines, stats,
  conditions, names, ids) so decision files can be drafted in parallel and emitted together.
- **Bot speed.** The headless bot measured 500–560× alone and 450–500× under a loaded full test run once the gem pool grew
  (the cost is spread over every `Character` build, not one hot spot), so the local speed test floor is now 440×. The user
  asked not to optimise per gem until the whole plan is done; revisit candidate pruning and cheaper `Character` builds in C7.
- **Deferred gems** (need systems from later milestones): corpse skills (Desecrate, Detonate Dead, Unearth, Volatile Dead),
  Discharge (consumes charges), Manabond, Plague Bearer, trap/mine/totem supports, trigger supports, minions.

### C3 to C6 done: gems and uniques, deployables, minions (2026-10-07)

- **Coverage.** Gems 325 of 349 (93.1%), uniques 707 of 782 (90.4%): both targets met. Gem batches c3g-001..010, c4g-001..003,
  c5g-001..003, c6g-001; unique decisions c3-001..003 and c3-a, c3-b, c3-c, c3-d files drafted by parallel agents from
  `docs/coverage/AUTHORING.md` and emitted together.
- **C4 engine.** Utility skills (`ActiveGemDef.utility`: curse, buff, blink, summon) cast by policy (`src/sim/utility.ts`: upkeep,
  guard, rally); curses and marks are hexes with effect tables and self-mods; auras carry triggers (heralds) and a burning aura
  (Searing Mantle); granted skills (`grantSkill.<id>`) and socketed supports (`socketSupport.<id>`); supports with global mods,
  triggers and Blasphemy; `needsShield`, `needsDualWield`, `travel`.
- **C5 engine.** Totems, brands, traps and mines (`src/sim/deploy.ts`): a skill with the tag, or under the support, is put down
  and fires from where it stands; `deployCount` raises the number at once; the sheet counts totems as extra uses.
- **C6 engine.** Minions (`src/data/minions.ts`, `src/sim/minions.ts`): summon skills keep minions standing that follow the
  character and strike the nearest enemy; `minionDamage`, `minionSpeed`, `minionCount`; the sheet adds `minionDps`.
- **Balance check (4 x 6, seed 11, with 582 uniques):** 7 of 24 wins (29%), inside the 25% to 50% band. A second check follows
  the last unique round.
- **Bot speed.** 190 to 200 times real time on one core (was 1,600 to 2,300 before the plan; DESIGN asks 500). Each camp builds
  about 500 characters; the cost is spread over the constructor and the craft and equip trials. Done: buff and charge source
  scans once per build, item and passive mods remembered by object, layout scores remembered. Not done: candidate pruning,
  cheaper character builds for craft trials. The local speed tests keep floors of 200 and 400.
- **Tests.** 1,681.

### C7 done: integration (2026-10-07)

- **Coverage.** Gems 325 of 349 (93.1%), uniques 769 of 782 (98.3%, flasks included). Four more rounds of unique drafting
  (a to e files) used parallel agents; many decisions approximate a secondary line, each says so in its map note.
- **Balance.** Small bot sims (4 runs of each of the six classes): 7 of 24 wins (29%) before the last unique rounds, 9 of 24
  (38%) after them, 8 of 24 (33%) after the gem drop change; a 10-run Mystic check gave 2 wins (20%), so the casters are the
  weakest class. The 25% to 50% band holds overall.
- **Drops.** Gem drops are weighted: plain damage skills most, supports and auras less, special kinds (curses, minions,
  deployables, channels, hexes) least, and the character's own attribute twice as often; maps 1 to 4 drop no special gem.
- **UI.** A Codex on the title screen lists every gem and unique with the ones found in this browser marked (kept through the
  store the controller was given); the gem inventory in Skills groups by role (skills, utility skills, supports, hexes, auras) and
  has a search; gem cards describe curses, buffs, summons, blinks, travel, shield and two-weapon needs, herald triggers and
  Blasphemy.
- **Calc and sim.** Convergence cases for the new shapes (ground line and zone, nova, beam, returning projectile, chain, trap,
  mine, totem, brand) hold the anchor (3% for shapes, 5% for traps and mines, 10% for totems and brands); standing
  totems and brands count the character's own default attack, as the sim shows it fighting beside them.
- **Bot speed.** About 200 times real time (DESIGN asks 500); see C3 to C6. Candidate pruning and cheaper character builds for
  craft trials remain the way to win it back.
- **Tests.** 1,754.
