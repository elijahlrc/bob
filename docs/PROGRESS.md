# Bob — Progress

Current milestone: **M3 — Character building**

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

## M3 — Character building

- [ ] Six classes
- [ ] Tree engine (≥ 450 nodes, 21 keystones working and tested)
- [ ] SVG tree UI
- [ ] XP, levelling, passive and bonus points
- [ ] Gems: sockets, supports, auto-level, primary, default attack, 7 actives + 17 supports
- [ ] 7 auras with reservation and inactive warning

## M4 — Items

- [ ] All bases, ~50 affix families / ~350 tiers, ilvl-gated rolling
- [ ] Rarity, naming, drop tables
- [ ] ≥ 30 uniques incl. the 12 listed
- [ ] Flask bases and affixes
- [ ] Equipment/inventory UI with compare deltas
- [ ] Chests in side branches

## M5 — Enemies

- [ ] 4 types × elemental variants
- [ ] Magic/rare/mini-boss with 15 mods; rare names
- [ ] Level scaling, XP, pack population
- [ ] Themes and next-map choice
- [ ] The Ossuary Regent

## M6 — Run loop

- [ ] 100-map schedule (penalties, bonus points, refunds, rewards, auto-continue, mini-bosses, victory/summary)
- [ ] Save/load at camp, continue run
- [ ] `npm run sim` bot at ≥ 500× real time
- [ ] XP table from bot measurements
- [ ] README updated

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
