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
