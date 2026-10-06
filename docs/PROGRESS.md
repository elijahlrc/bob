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

## M7 — Full-size tree and balance

- [ ] Full tree (1,250–1,350 nodes); all §9.3 invariants
- [ ] Tree view rendering requirement
- [ ] Balance pass (60 bot runs) — results below

## Deferred

_(none yet)_

## Known bugs

_(none yet)_

## Latest bot results

_(not yet run)_
