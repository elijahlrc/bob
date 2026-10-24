# G4 fix pass 2: the Mystic (`spire`)

Agent report, 2026-10-23. Work list: `G4/fix-2.md` §2.3 (M-1 to M-5). Files touched: `src/data/passives/spire/well.ts`,
`frost.ts`, `fire.ts`. No ids added or retired; nothing registered, baked or committed.

## Items

| #   | done?                            | what                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M-1 | done                             | The crossing `spire.well.toCathedral.b`–`cathedral.home.hymn.b` became `toCathedral.b`–`cathedral.home.roadE.b`. Hymn keeps `hymn.a` and `roadE.a`. The Mystic–Zealot border keeps its count. Both `toCathedral` road nodes were moved onto one straight line, first from Wandwork to `roadE.b` (a right angle at `roadE.b`); M-3 then moved them again (below).                                                   |
| M-2 | done                             | Cut `spire.well.draught.a`–`spire.well.toCathedral.a`. The 27° fan and the thin triangles are gone.                                                                                                                                                                                                                                                                                                                |
| M-3 | **done (its condition was met)** | After M-1 and M-2, measured on the same snapshot of the tree: four Zealot casters still had more Mystic than Zealot nodes at 60 (fire-burn My42/Ze19, staff-block My41/Ze20, block-caster My35/Ze26, storm-caster My40/Ze21). So Draught was re-laid as a bridge on the crossing road, as T2 proposes. Details below.                                                                                              |
| M-4 | done                             | Linked `spire.frost.stream.n` (Steady Stream) to `spire.frost.highVeil.a`: 328 units, at the triangle's lower-right corner. The High Veil ring is unchanged. Steady Stream is now a bridge, and the ten-node cul-de-sac is a loop. High Veil is 23 steps from the Mystic start (was 27) and 24 from the Zealot's.                                                                                                  |
| M-5 | done                             | Familiars' cluster `why` now says minion damage, minion life and spell damage. Cinder's cluster `why` names it as the Mystic end of seam 2 (Bright Omen lands on its notable). I also rewrote every reason the moves made stale: Steady Stream (cluster, notable), High Veil (cluster, `a`), the north-west rim road, the junction `j1`, the `toCathedral` cluster and its nodes, Draught, and the crossing links. |

### M-3 as laid (Draught the bridge)

- **Links.** The crossing road runs `cathedral.home.roadE.b` → `toCathedral.b` → `toCathedral.a` → `draught.b`. Cut:
  `toCathedral.a`–`wandwork.n` and `draught.a`–`draught.b`. Added: `toCathedral.a`–`draught.b` and `draught.n`–`draught.a`.
  Draught's links are `draught.b`–`n`–`draught.a`, so the tent has its tip at the notable and one small on each leg.
- **What each node keeps.**
  - `draught.b` is the junction where both Cathedral crossings land: this road, and the choir's `cathedral.choir.toSpire.a`, which is unchanged.
  - `draught.a` goes on to `j1.a` and to Wandwork, so the `draught.a`–`wandwork.n` link stays.
  - Wandwork keeps three ways in: `wandwork.a` (from Deep Well), `draught.a` and `j1.a`. Draught has two.
- **Positions.**
  - The whole road is one straight line from `roadE.b` (-1290,-1106) to `draught.b` (-1180,-1940). `toCathedral.b` is at (-1253,-1384) and `toCathedral.a` at (-1217,-1662).
  - The Draught tent is `n` (-1215,-2001), `a` (-1146,-2014) and `b` (-1180,-1940). It moved about 85 units east of where it was, so `a` sits on the line from the notable to `j1.a`.
- **One looks cost.** The road leaves `roadE.b` at 63° and 116° from the east road's two directions, not at the right angle M-1 alone had. A straight road that left at a right angle would run into Wandwork, and Draught lies about 25° west of that line. The two ways to keep the right angle were worse: a bend at a two-link road node, or moving Draught into Wandwork's corner, which would rebuild the knot M-2 removed. Geometry reports no crossings and nothing drawn over.
- **Steps from the Zealot start.** Draught 8, Wandwork 10, Deep Well 12, Glass Skin 13, Quiet Pulse 13, Hymn 4. For comparison, T2 predicted Wandwork 10, Deep Well 12, and Glass Skin and Quiet Pulse 13.
- **Steps from the Mystic start.** Draught 12 (was 13), Wandwork 10, Deep Well 8, Glass Skin 7. The Mystic's first notables are unchanged.

## Border links

- **Moved:** `spire.well.toCathedral.b`–`cathedral.home.hymn.b` is now `spire.well.toCathedral.b`–`cathedral.home.roadE.b`. It is still written in `spire/well.ts`.
- **Unchanged:** every other Mystic link across a region line, including the choir crossing onto `draught.b`.
- **Border count:** the Mystic–Zealot border keeps the same number of links.

## Lines

None were needed. No line or value changed.

## Checks

- `npx tsc --noEmit -p .`: clean.
- `geometry.ts --region mystic --bends`: 0 crossings, 0 drawn over. The 13 bends listed are all corners of ring or square clusters or home pockets, and none of them is new. `--region zealot`: 0 crossings, 0 drawn over.
- `passives:audit -- mystic`: 0 problems. Draught stays at 4.0 units and Steady Stream at 3.5, and every Mystic notable is within 3 to 5. Each touched cluster has two or more ways in: Draught 2, Wandwork 3, Steady Stream 2, High Veil 2. Hymn (2) is the Zealot's.
- `vitest src/data/ip.test.ts src/data/passives/names.test.ts`: 6 passed. No names were added.
- Pictures in `docs/tree/design/G4/fix2/mystic/`:
  - `before.png` and `after.png`: the whole region.
  - `cu-crossing-before.png` and `cu-crossing-after.png`: the Draught and Wandwork crossing, with ids.
  - `cu-highveil-after.png`: the new Steady Stream–High Veil link.

## Allocator readings

**How they were measured.** Other agents were editing at the same time, and runs a few minutes apart gave different
results; staff-block swung while the Zealot's rods file changed mid-run. So the "before" column is a trial on the same
snapshot of the tree as the "after" run. It is a copy of `builds.ts` in my scratch folder that puts my four links back
(Hymn crossing, both `toCathedral.a` links, `draught.a`–`b`) and takes out Steady Stream–High Veil, run in parallel with
the real `builds.ts`. Both are indicative only.

Choice is given as "at 60 / at 120". Each stat is given as units at 120 → units at 160.

| build        | choice (before → after) | main stats before                                                                     | main stats after                                                                        |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| caster-es    | 2/4 → 2/6               | spell damage 24.8→35.3; cold 15.4→17.4; energy shield 40.6→46.2; cast speed 8.8→12.8  | spell damage 19.8→32.8; cold 16.4→17.4; energy shield 39.6→46.2; cast speed 10.8→13.8   |
| caster-life  | 2/4 → 2/5               | spell damage 24.3→29.3; elemental 27.4→33.0; life 25.4→35.8; spell crit 19.4→24.4     | spell damage 24.3→28.3; elemental 24.4→33.0; life 25.4→35.8; spell crit 19.4→23.4       |
| wand-attack  | 2/4 → 2/3               | wand 17.3→17.3; energy shield 42.6→51.6; attack speed 8.4→8.4                         | wand 17.3→17.3; energy shield 39.0→45.0; attack speed 8.4→14.4                          |
| channeller   | 3/3 → 4/4               | channelling and spell 30.8→35.8; mana sustain 24.5→37.3; energy shield 30.2→30.2      | channelling and spell 31.3→35.8; mana sustain 25.0→37.3; energy shield 30.2→31.8        |
| summoner     | 2/2 → 2/4               | minions 26.5→30.5; energy shield 45.6→51.0; life 16.0→31.8                            | minions 26.5→26.5; energy shield 45.6→52.0; life 16.0→33.8                              |
| fire-burn    | 2/6 → 2/8               | fire 27.5→37.5; spell damage 21.8→24.3; life 25.4→27.4                                | fire 32.5→37.5; spell damage 13.5→28.3; life 27.4→29.4                                  |
| storm-caster | 3/3 → 4/4               | spell damage 27.9→30.4; lightning 22.5→26.1; life 24.4→34.8; cast speed 11.8→12.8     | spell damage 30.7→31.9; lightning 21.5→26.1; life 24.4→28.4; cast speed 11.8→11.8       |
| staff-block  | 5/3 → 5/6               | spell damage 32.6→43.9; block 15.5→17.5; life 25.0→29.4                               | spell damage 32.6→41.9; block 15.5→17.5; life 25.0→29.4                                 |
| block-caster | 2/3 → 4/6               | block 9.5→13.5; spell block 8.0→14.0; spell damage 19.5→23.3; energy shield 26.6→34.0 | block 12.0→13.5; spell block 13.0→13.0; spell damage 20.8→23.3; energy shield 23.6→34.0 |
| spell-totem  | 4/4 → 3/5               | totem 8.0→8.0; spell damage 25.8→34.8; life 28.4→31.4                                 | totem 8.0→8.0; spell damage 25.8→35.8; life 27.4→29.4                                   |
| aura-brand   | 3/6 → 2/5               | auras 23.0→23.0; brand 26.3→32.3; life 31.8→40.4                                      | auras 23.0→23.0; brand 26.3→32.3; life 31.8→40.4                                        |

**60-point plans by region.** "Old" is with all my links put back. "M-1+M-2" adds the moved crossing and the cut. "Final" also has M-3 and M-4.

| build        | old       | M-1+M-2   | final     |
| ------------ | --------- | --------- | --------- |
| staff-block  | My39 Ze22 | My41 Ze20 | Ze56 My5  |
| block-caster | My40 Ze21 | My35 Ze26 | Ze35 My26 |
| fire-burn    | My38 Ze23 | My42 Ze19 | My34 Ze27 |
| storm-caster | My50 Ze11 | My40 Ze21 | My40 Ze21 |
| spell-totem  | Ze42 My19 | Ze38 My23 | Ze35 My26 |
| aura-brand   | Ze53      | Ze53      | Ze53      |

- **Staff-block** now opens with Quarterstaff, Warding Staff and Crozier.
- **The three Mystic builds:** caster-es, caster-life and wand-attack keep their 60-point plans. Wand-attack's 60-point plan is now all Mystic.
- **The cost of M-3 alone** (compared with M-1+M-2 on the same snapshot):
  - spell-totem's choice 4/8 → 3/5
  - aura-brand 3/6 → 2/5
  - storm-caster at 120: 6 → 4
- **What M-3 gained:** caster-life 4 → 5 and summoner 3 → 4 at 120, plus staff-block and block-caster coming home.
- **M-4 alone, on the same snapshot:** caster-es 120 4 → 6, channeller 60 3 → 4, wand-attack 120 4 → 3. Caster-es's 60-point choice stayed 2, where the auditor had predicted it would fall to 1.

## For the coordinator or the user

- **Fire-burn and storm-caster still spend more of their first 60 points in the Mystic** (My34/Ze27, My40/Ze21). Their plans now start Zeal, Hymn, Hearthfire, then go to the Cloister for Deep Well, Glass Skin, Quiet Pulse and Warm Blood. T2's second lever is to re-line Vigil (`cathedral.nave.vigil.n`) toward life with ES recharge. That is a Zealot file; I did not touch it.
- **The crossing's angle at `roadE.b`** is 63°/116°. The reason is above. If the Zealot ever moves `roadE.b` or Draught moves, a right angle is easy to get back.
- **My allocator numbers were taken while other agents were editing.** The coordinator's full measure after the bake is the one to quote.

CONSTRAINTS sections checked: §3.5, §3.6, §3.7, §4.8, §5.5, §6, §8.6, §10.3, §11.2 and §11.5, §13.1, §14 (no new rules).
