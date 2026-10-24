# G4 fix pass 2: the Reaver (`yard`)

2026-10-23. Work list: `G4/fix-2.md` §2.5 (R-1 to R-3). Files touched: `src/data/passives/yard/dual.ts`,
`src/data/passives/yard/blood.ts`. Nothing outside the folder; no register, bake or commit.

## Items

| #   | finding     | verdict | what was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ----------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | T1, S4 (F4) | done    | Footwork (`yard.dual.footwork.n`): `evasion(25), accuracy(15)` → `accuracy(20), stunAvoid(20)` (2 + 1 = 3.0 units). Smalls stay `accuracy(10)`. Cluster `why`, notable `why` and the crossing link's `why` (`footwork.c`–`bow.steel.hub.t`) rewritten. Partners checked: Twin Fangs (dual damage, speed, block), Sidestep (dodge, life on hit), Weaving (evasion, avoid ailments), Crossed Blades (dual crit, dual accuracy, crit multi) all differ. The Reaver keeps evasion on Weaving and the Muster (§4.5).                                                                                                                   |
| R-2 | T5          | done    | Sidestep (`yard.dual.sidestep.n`): `dodgeAttack(5), dualBlock(4)` → `dodgeAttack(5), lifeOnHit(6, ['attack'])` (1.7 + 1.5 = 3.2 units): the riposte. Outside every exclusion (not stun avoid, accuracy, evasion, dual damage, speed or crit). No other dodge notable sells life on hit (dodge notables: Soft Step, Quick Wrists, Feint and Cut, the Shade's snares pair, Spire's craft pair), so §5.1 holds; the second blade's block stays on Twin Fangs. Tagged `lifeOnHit` has precedent (bow/steel, cathedral/ambulatory, knife/edge) and the sim reads it (`src/sim/combat.ts`), so §10.3 holds.                             |
| R-3 | N2          | done    | `yard.blood.rim.p1` and `rim.p3` removed with their links (`j3.a`–`rim.p1`, `rim.p1`–`rim.p2`, `rim.p2`–`rim.p3`, `rim.p3`–`j2.a`); ids retired (holes in `ids.json`, untouched). `rim.p2` stays, moved 24 units west to (-24, 3220) so `toHarvest.a`–`p2`–`spine.s1` is one straight run. Its cluster is renamed "A spine node" (it would otherwise share the name of `spine`) and its `why` rewritten; the stale "rim road" mentions in the file header and in the `why`s of `j3`, `j2`, Spellsword, `toWall` and `spine` are corrected. Open Veins and Red Harvest keep three ways in each; `j3.a` and `j2.a` keep four links. |

## Ids changed or removed

- Removed (retired): `yard.blood.rim.p1`, `yard.blood.rim.p3`.
- Moved: `yard.blood.rim.p2` (0, 3220) → (-24, 3220).
- Re-lined: `yard.dual.footwork.n`, `yard.dual.sidestep.n`.
- No new ids.

## Border links

None moved or cut. Footwork's crossing to `bow.steel.hub.t` keeps its place (only its reason was rewritten).

## Lines

None missing: `stunAvoid` and `lifeOnHit` exist in `lines.ts`.

## Checks

- `npx tsc --noEmit -p .`: clean (after waiting out another region's half-written `bow/home.ts` once).
- `geometry.ts --region reaver --bends`: 0 crossings, 0 drawn over. Eight bends over 20°, all pre-existing corners of
  regular shapes this pass did not touch (Light Blades, Hot Blood's square, Keen Edge, Twin Fangs' and Full Swing's and
  Steel Rim's hexagons). None is new.
- `passives:audit -- reaver`: 0 problems. Footwork 3.0 units, Sidestep 3.2; every Reaver notable 3.0 to 5.0.
- `vitest ip.test.ts names.test.ts`: 6 passed. No new node names.
- Pictures: `before.png` / `after.png` (region), `before-lists.png` / `after-lists.png`, `before-pits.png` /
  `after-pits.png` (with ids), all in this folder.

## Allocator readings (indicative: the Strider, Shade, Mystic and Zealot agents were editing at the same time)

Baseline `G4/builds-r2start.json`, after = this pass plus whatever the others had saved at the time. Main stats at
120 → 160; choice at 60 / 120.

| build          | choice 60 | choice 120 | main stats at 120 → 160, before / after                                                                          |
| -------------- | --------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| dual-wield     | 1 → 1     | 3 → 5      | life 23.2→34.6 / 23.2→33.6; dual wield 16.0→17.0 / same; evasion 30.5→38.3 / 27.0→34.8                           |
| sword-str      | 1 → 1     | 5 → 5      | unchanged (life 23.2→29.6, armour 20.2→26.8, sword 33.8→35.0, attack speed 7.2→9.8)                              |
| axe-bleed      | 2 → 2     | 3 → 3      | unchanged                                                                                                        |
| bow-crit       | 3 → 2     | 4 → 4      | life 23.0→32.0 / 25.6→35.0; evasion 32.5→36.0 / 26.0→33.5; bow 32.0→41.2 / 34.6→39.6; crit 11.5→19.4 / 16.4→17.4 |
| bow-elemental  | 4 → 2     | 2 → 2      | evasion 34.0→41.0 / 30.5→35.5; elemental attack 10.4→15.4 / 10.4→19.4                                            |
| dagger-crit    | 1 → 2     | 2 → 1      | crit 25.3→32.7 / 27.3→33.7; evasion 36.7→40.2 / 33.2→36.7                                                        |
| dodge-blades   | 3 → 3     | 2 → 4      | dodge unchanged 19.3→26.0; evasion 36.7→40.2 / 33.2→36.7                                                         |
| curse-attacker | 4 → 4     | 2 → 2      | life 30.6→35.2 / 30.6→40.2; axe 14.7→18.0 / 14.7→14.7                                                            |
| storm-blade    | 1 → 1     | 4 → 6      | lightning attack 23.8→23.8 / 14.8→18.4; life 28.8→39.2 / 34.2→47.6                                               |

The bow-crit, bow-elemental and dagger-crit drops in choice at 60 or 120 sit in homes the Strider and Shade agents were
re-lining at the same time (Hawk's Eye, Wayfarer's smalls, Thick Blood, Wasp Sting); they cannot be laid on this pass
alone.

## For the coordinator

1. **Footwork is now in almost no plan.** Before: in all seven dexterity attackers' 60-point plans. After: only
   storm-blade takes it, at 120; dual-wield and sword-str (who weigh accuracy 0.4 and avoid stun 0.25) do not. That is
   the shape F4 used to reject the movement trial ("a notable nobody takes"). The run is noisy for exactly this notable
   (the Strider agent's S-1/S-2 rework the Ford hub `hub.t` Footwork lands on, and Hawk's Eye lost its evasion), so I
   kept the brief's line and did not trial partners. Decide at the re-measure. For reference, what the Reaver's
   archetypes weigh 0.5 or more outside F4's and T1's exclusions (evasion, dual speed, dodge, dual crit, movement):
   life and flat life (1), one-handed melee (dual-wield 1, sword-str 0.9), melee physical and physical attack (1),
   melee damage, attack damage and attack speed (0.8), sword or axe damage (dual-wield 0.7, sword-str 1), block while
   dual wielding (0.6), attack speed on kill (0.6), dual accuracy, crit multiplier and attack leech (0.5).
2. **T1's destination may have moved rather than gone.** With Footwork's evasion out, the Shade attackers' 60-point
   plans now take Sidestep (dodge) and, for dodge-blades, Twin Fangs and Weaving: dagger-crit took Sidestep only at 120
   before. The dodge was always the pull; the new partner adds a little (every attacker weighs `lifeOnHit:*` 0.3, where
   `dualBlock` was worth nothing to them). The node split at 60 (start excluded):
   - dual-wield: Strider 32 / Reaver 28 → **Strider 35 / Reaver 25**;
   - dagger-crit: Strider 31 / Shade 22 / Reaver 7 → Strider 32 / Shade 22 / Reaver 6;
   - dodge-blades: Strider 31 / Shade 27 / Reaver 2 → Strider 26 / Shade 27 / Reaver 7.

   dual-wield still opens in the Strider, which is T1's own trigger for its held lever (re-aim
   `bow.steel.road.jt1`–`yard.dual.j2.a` one node farther out). That link is not in this pass's table, so it is
   untouched; re-measure once every agent is done before deciding.

3. Nothing else for the user beyond the readings above.

## CONSTRAINTS sections checked

§1.1 (tension, one constraint among many), §3.5 (every touched cluster keeps two or more ways in), §3.7 (no border
link changed), §4.5 and §4.8 (the Reaver keeps varied defences; the Lists still mix offence and defence), §5.1 and §5.5
(new partners are no copies; neighbours differ), §7.1 to §7.3 (the spine stays a straight road; the bare parallel road
removed), §8.2 and §8.6 (sections uniform, notables 3 to 5 units), §10.3 (both new lines are read by the sim), §11.2 and
§11.5 (0 crossings, 0 drawn over, straight run, no new bends), §14 (no new rules; nothing generated).
