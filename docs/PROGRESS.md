# Bob — Progress

Current milestone: **M0 — Foundations**

Spec: [DESIGN.md](DESIGN.md). Each milestone ends with green `npm run check` and `npm run build` and one commit.

## M0 — Foundations

- [x] `src/` folders from §14.1 exist; ESLint import boundaries and banned globals active (deliberate violation verified)
- [x] `core/rng.ts` sfc32 with `next/int/float/pick/weighted/fork`, tested
- [x] `mods/` Mod, ModDB sum/product, conditions, `per`, text templates, tested
- [x] Preact title screen over the Phaser canvas

## M1 — Playable vertical slice

- [ ] Labyrinth generator meets §10.2 over 200 seeds
- [ ] MapScene renders grid; player auto-walks; warriors chase and fight
- [ ] Simple combat
- [ ] End room → exit → stub camp; death → summary
- [ ] Speed controls 1×/2×/4×/8×/pause
- [ ] Determinism test for `runMap`
- [ ] Browser: map 1 → camp → map 2 with zero input, no console errors

## M2 — Combat rules

- [ ] Full damage pipeline, unit-tested
- [ ] Six ailments + stun in sim with indicators
- [ ] `computeCharacter` full sheet
- [ ] Convergence test (melee phys, crit spell, conversion, dual wield, poison)
- [ ] Flasks with auto-use policy

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
