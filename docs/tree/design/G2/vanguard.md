# G2. The Vanguard (the Wall): the road skeleton

Laid 2026-10-22 for phase G2 of [G-growth.md](../G-growth.md), from the joined brief [G1-brief.md](../G1-brief.md) and
the region brief [G1/vanguard.md](../G1/vanguard.md) (its "Joined:" note first). [CONSTRAINTS.md](../CONSTRAINTS.md)
wins over all three. Roads, cuts and moves only, with links inside the region: no new cluster, no re-line, no border
link. Files: `src/data/passives/wall/` (rampart, maces, resists, slams, grit; `home.ts` unchanged).

**Nodes: 193 → 203** (start included): 9 new road nodes and 1 new small (Hallowed Hammer's far small). No node removed.

**Pictures** (in [vanguard/](vanguard/)): `before.png` and `after.png` (the region), and before/after close-ups of what
changed most: `rampart-*.png` (the Bulwark, Iron Lungs, Stone Heart, Hallowed Hammer, the Unerring spur),
`westrim-*.png` (Grim Oath, the rim road, Thick Skin), `middle-*.png` (Second Wind, the Barrows' middle road, the
Quarry floor) and `cleaver-*.png` (Cleaver on the Barrows road). The before close-ups are drawn from the committed tree.

## 1. What was laid

### Roads (all `str(7)` unless noted)

| Road                          | Nodes | Ids                            | Where                                                                                                                                                        |
| ----------------------------- | ----: | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The west rim road             |     2 | `wall.maces.rim.a`, `rim.b`    | `oath.n` (Grim Oath) → `rim.a` (−3934, 319) · gap for VA-6 · `rim.b` (−3860, 922) → Thick Skin → its two smalls → `j2.a` (Rooted Stance)                     |
| The Quarry floor              |     2 | `wall.slams.floor.a`, `.b`     | `slams.j1.a` → `floor.a` (−1580, 1458) · gap for VA-5 · `floor.b` (−2113, 1459) → `groundShaker.b`                                                           |
| The Barrows' middle road      |     2 | `wall.grit.middle.a`, `.b`     | Second Wind → `middle.a` (−1730, 2188) → Stone Ward's notable → `middle.b` (−1856, 2571) · gap for VA-3 · `east.e2`                                          |
| Toward Thirsting Blade        |     1 | `wall.slams.toThirst.a`        | Second Wind → `toThirst.a` (−1460, 2140), `str(6), dex(6)` (a crossing node); its link to the Yard is the border pass's                                      |
| Mortar and Stone to the tower |     2 | `wall.rampart.toTower.a`, `.b` | `bulwark.n2` → (−2325, 738) → (−2462, 912) → `maces.j1.a`, a straight line where Iron Lungs' pocket ran (the brief's "Rampart–Barbican loop keeps its link") |

### Moves (each cluster moved whole, notable and smalls together)

| Cluster                                                 | From                                       | To                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Iron Lungs (notable, two mana-on-hit smalls)            | a pocket off Mortar and Stone (−2342, 874) | the Bulwark's north-west side, Stone Heart's old place (−2179, 380); the way from the road to the junction   |
| Stone Heart (notable, the Bulwark's two life smalls)    | the Bulwark's life side                    | the tower road's pocket (−1931, 880), Thick Skin's old place                                                 |
| Thick Skin (notable, its two armour smalls)             | the tower road's pocket                    | the west rim (−3830, 1150), a fork beside Rooted Stance, on the rim road                                     |
| Second Wind (notable, two regeneration smalls)          | the Rampart (−1859, 101)                   | below Unbloodied (−1650, 2070), the brief's space D                                                          |
| Cleaver (notable, three axe smalls)                     | its square in the Barbican (−2990, 864)    | a chain off `east.e6` toward the Fosse (−1160, 3420), on the straight line from `e6` to `yard.fosse.road.f7` |
| Hallowed Hammer (notable, two mace smalls, **one new**) | a pocket off `toHymn.r2` (−3866, 513)      | a chain north off the rampart's junction (−2540, −20), facing `cathedral.rods.toWall.a`                      |
| Unerring Discipline spur                                | keystone at (−2946, −20)                   | turned west, keystone at (−2860, 175): 321 units from Idle Hands (was 130)                                   |

The Rampart's area label moved from (−2312, 409) to (−2312, 720): it lay over Stone Heart before and would have lain
over Iron Lungs.

### Cuts (both ends inside the Vanguard; checked by prefix)

`secondWind.n–resists.star.c`, `secondWind.b–rampart.toWind.a`, `bulwark.b–secondWind.a`; the Bulwark's ring links
`f–n1`, `n1–b` and `n1–rampart.j1.a`; `bulwark.n2–ironLungs.a`, `ironLungs.b–maces.j1.a`, `ironLungs.a–ironLungs.b`;
`maces.toCleaver.a–cleaver.a`, `cleaver.b–maces.crushing.a`, `rampart.steadyHands.b–cleaver.c` and Cleaver's ring;
`maces.toHymn.r2–hammer.a`; `rampart.toThickSkin.a–thickSkin.a` (re-aimed to Stone Heart).

### New links inside the region

`star.c–toWind.a` (the chaos spoke, straight on from the star), `ironLungs.a–toWind.a` (the brief's "Bulwark's north
small" landing), `bulwark.a–ironLungs.a`, `ironLungs.b–bulwark.e`, `ironLungs.n–rampart.j1.a`,
`bulwark.n2–toTower.a–toTower.b–maces.j1.a`, `toThickSkin.a–stoneHeart.a`, `rampart.j1.a–hammer.a`,
`j2.a–thickSkin.a`, `thickSkin.n–rim.b`, `oath.n–rim.a`, `unbloodied.n–secondWind.a`, `secondWind.n–middle.a`,
`middle.a–ward.n`, `ward.n–middle.b`, `secondWind.n–toThirst.a`, `slams.j1.a–floor.a`, `groundShaker.b–floor.b`,
`east.e6–cleaver.a`. Every one has a `why`.

## 2. Ids that changed

Saves get one refund on release, so these are listed, not avoided.

| Old id                                   | New id                                  | What                             |
| ---------------------------------------- | --------------------------------------- | -------------------------------- |
| `wall.rampart.bulwark.n1`                | `wall.rampart.stoneHeart.n`             | Stone Heart                      |
| `wall.rampart.bulwark.b`                 | `wall.rampart.stoneHeart.a`             | life small                       |
| `wall.rampart.bulwark.f`                 | `wall.rampart.stoneHeart.b`             | life small                       |
| `wall.rampart.thickSkin.n`, `.a`, `.b`   | `wall.maces.thickSkin.n`, `.a`, `.b`    | Thick Skin and its armour smalls |
| `wall.rampart.secondWind.n`, `.a`, `.b`  | `wall.slams.secondWind.n`, `.a`, `.b`   | Second Wind                      |
| `wall.maces.cleaver.n`, `.a`, `.b`, `.c` | `wall.grit.cleaver.n`, `.a`, `.b`, `.c` | Cleaver                          |
| `wall.maces.hammer.n`, `.a`, `.b`        | `wall.resists.hammer.n`, `.a`, `.b`     | Hallowed Hammer                  |

All the old ids are gone from the area files (they stay as retired numbers in `ids.json`). **New ids:**
`wall.resists.hammer.c`, `wall.rampart.toTower.a`, `.b`, `wall.maces.rim.a`, `.b`, `wall.slams.floor.a`, `.b`,
`wall.slams.toThirst.a`, `wall.grit.middle.a`, `.b`. **Kept ids, moved:** `wall.rampart.ironLungs.a/.b/.n`,
`wall.rampart.unerring.a/.b/.k`. **Kept id, new purpose:** `wall.rampart.toThickSkin.a` now leads to Stone Heart (its
cluster id is kept to spare a renumber; its `why` says so). No other region's file referenced any changed id (grepped).

## 3. Where the G3 clusters hang

| Cluster (brief)               | Hangs on                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| VA-2 armour + shield block    | `wall.maces.toCleaver.a` (a one-link stub now), `wall.rampart.steadyHands.b`, `wall.maces.crushing.a`: Cleaver's square |
| VA-3 armour + warcry effect   | `wall.grit.middle.b` (stub) and `wall.grit.east.e2`, about (−1900, 2830)                                                |
| VA-4 mace + mace attack speed | `wall.grit.north.a` and `wall.grit.southWest.b` (existing)                                                              |
| VA-5 mace + life              | `wall.slams.floor.a` and `wall.slams.floor.b` (stubs), anchor about (−1780, 1330)                                       |
| VA-6 fire attacks + stun      | `wall.maces.rim.a`, `wall.maces.rim.b` (stubs) and `wall.maces.toHymn.r2`, about (−3900, 620)                           |
| VA-7 totem speed + duration   | `wall.grit.west.c` and `wall.grit.reach.a` (existing)                                                                   |
| VA-8 shield attacks + stun    | `wall.home.roadR.b` and `wall.home.roadM.b` (existing), the diamond about (−1560, 560)                                  |

## 4. Border links left for the border pass

None of these was added, cut or re-aimed here.

| Crossing (joined brief §2.3, §2.4) | Vanguard end                                                       | Other end                  |
| ---------------------------------- | ------------------------------------------------------------------ | -------------------------- |
| maces and sceptres                 | `wall.resists.hammer.c` (Hallowed Hammer's far small, laid for it) | `cathedral.rods.toWall.a`  |
| the armoured sceptre               | `wall.resists.j.a`                                                 | ZE-5 (a Zealot G3 cluster) |
| two-handed fire                    | `wall.maces.oath.n` (Grim Oath)                                    | ZE-8 (a Zealot G3 cluster) |
| regeneration or leech              | `wall.slams.toThirst.a`                                            | `yard.blades.thirst.n`     |
| axes by the Fosse                  | `wall.grit.cleaver.c` (Cleaver's far small)                        | `yard.fosse.road.f7`       |
| sword and board                    | `wall.grit.east.e6`                                                | RE-2 (a Reaver G3 cluster) |
| ring arch                          | (the centre's CE-3, south-west diagonal)                           | `centre.ring`              |

`wall.slams.toYard.a` was offered for RE-4 and the join did not take it. The 11 existing crossings (Zealot 5, Reaver 6)
are untouched. Stop 2 asked the border pass for 1 to 2 more per border; nothing here pre-empts that.

## 5. Changed from the brief, and why

1. **Smalls travel with their notables, so G2 re-lines nothing.** The brief re-lined smalls in place (the Bulwark's
   life smalls to mana on hit, Thick Skin's armour smalls to life, Iron Lungs' smalls to strength) and gave Thick Skin
   two new armour smalls. Here each cluster moves whole: Iron Lungs brings its mana smalls onto the wheel, Stone Heart
   takes the Bulwark's two life smalls to the pocket, Thick Skin keeps its own two armour smalls, and two new strength
   road nodes take Iron Lungs' old line. The end state is the brief's, node for node, with no re-line (out of scope) and
   every section uniform meanwhile (§8.2). **Left for G3:** the Bulwark's entrance `bulwark.a` is still a life small;
   the brief makes it a strength road node.
2. **The west rim road has 2 nodes, not 3.** The sketch spread 3 evenly over its polyline; with VA-6 and Thick Skin
   on the road, 2 put the links at about 230 units, like the other roads, and a third would carry nothing (§7.3).
3. **VA-5's anchor moves a little north** (about (−1780, 1330) for the brief's (−1830, 1420)), so the slam junction's
   four links fan at 58° and 74° either side of the new one, not 44° (§11.5).
4. **Hallowed Hammer's extra small is laid now** (the brief counts it in the move), so the crossing lands on its final
   node and no one has to re-aim a border link in G3.
5. **Second Wind sits in the Quarry's file** (`slams.ts`): its door is Unbloodied and the Quarry's label is the nearer.
6. **The Rampart label** moved off the Bulwark (§11.2, §16 Labels).

## 6. Checks

- **Geometry** (`geometry.ts --region vanguard --bends`): crossings 0, drawn over 0, before and after. Bends over 20°:
  18 before, 18 after. The two new names on the list are ring corners: `steadyHands.b` (its square's corner, now that
  Cleaver's link left; VA-2 joins it in G3) and `ironLungs.b` (the Bulwark's ring, where `bulwark.f` stood). The other
  16 are the same ring corners and road turns as before. Every new road node is straight between its two ends or a stub.
- **Problems:** `buildAll` reports none with a `wall.` id; `npx tsc --noEmit -p .` is clean.
- **Ways in** (`passives:audit -- vanguard`, and by eye): every area keeps several links in and out. The Bulwark has
  four doors (`toHome`, `toWind`, the junction, the tower road). Stone Ward and Second Wind become bridges; Grim Oath is
  joined south. Steady Hands keeps two (the junction, Stagger) and Crushing Blow two (the Battle Hymn road, Stagger).
  **Temporary single ways in, until the border pass or G3:** Hallowed Hammer and Cleaver (pockets until their crossings),
  Thick Skin and Grim Oath (until VA-6 joins `rim.a` to `rim.b`). The stubs `toCleaver.a`, `rim.a`, `rim.b`, `floor.a`,
  `floor.b`, `middle.b` and `toThirst.a` end where a cluster or a crossing will attach, as G2 asks.
- **Labels** (a scratch check of each area label's box against notables, keystones and starts): the Rampart's and the
  Barbican's labels no longer cover a notable (they covered Stone Heart and Cleaver). Still covering, as before and left
  for G3 as the brief says: the Battlements over Elemental Ward and Scar Tissue, the Quarry over Unhurried, the Barrows
  over Tempered. No label overlaps another.
- **Home steps** (Vanguard start, nodes bought, committed tree → now; the notables the four Vanguard archetypes took at 60
  points in `G0/builds.json`):

  | Notable          | before → after | Note                                                                                 |
  | ---------------- | -------------: | ------------------------------------------------------------------------------------ |
  | Oathbound        |          2 → 2 |                                                                                      |
  | Quartermaster    |          4 → 4 |                                                                                      |
  | Warlord's Banner |          5 → 5 |                                                                                      |
  | Bracing          |          6 → 6 |                                                                                      |
  | Thunderstep      |          7 → 7 |                                                                                      |
  | Second Wind      |     **7 → 13** | the brief's VA-m3: out of the Rampart to the Barrows' middle (brief: 13)             |
  | Stone Heart      |          8 → 8 | same pocket distance                                                                 |
  | Thick Skin       |     **8 → 18** | the brief's §4 and §7 item 1: to the west rim beside Rooted Stance (brief: about 17) |
  | Mortar and Stone |          9 → 9 |                                                                                      |
  | Elemental Ward   |      **9 → 7** | shorter: see below                                                                   |
  | Weight of Iron   |        10 → 10 |                                                                                      |
  | Broad Back       |        13 → 13 |                                                                                      |
  | Greatweight      |        14 → 14 |                                                                                      |
  | Iron Liturgy     |        16 → 16 |                                                                                      |

  The neighbours' notables in those lists (Guarded, Field Dressing, Stout Heart, Quickened Steel, Scarred Hide, Zeal,
  Hearthfire, Litany, Vigil, Buckler, Light Blades, Steel Rim, Shieldwall) are 4 to 17 from the Vanguard start and none
  grew. Elsewhere: Iron Lungs 12 → 7, Hallowed Hammer 20 → 11, Cleaver 13 → 22 (the brief's VA-m1), Unerring Discipline
  12 → 11, Steady Hands 12 → 11, Stone Ward 17 → 15.

- **The allocator** (`passives:builds --only mace-slam,mace-shield,warcry-totem,two-hand-fire`, run once, with the other
  regions mid-edit, so it is indicative): tax at 60 points 28%, 28%, 33%, 28% (G0: 30%, 27%, 30%, 28%); choice at 60
  points 2, 1, 2, 2 plans (G0: 2, 2, 1, 1); choice at 120 points 3, 4, 4, 4 (G0: 1, 3, 3, 2). The mace slam now takes Thick Skin and Rooted Stance at 60 (the west rim
  fork) instead of Second Wind and Mortar and Stone; the warcry-totem build takes War Drums at 60.

## 7. For the user and for G3

- **Elemental Ward comes two steps nearer the Vanguard start (9 → 7), and Iron Lungs five (12 → 7).** Both follow from
  the brief's re-landing of the chaos spoke and the Bulwark's north small on `toWind.a` (the rampart road's node): Second
  Wind used to sit between that node and the star. The brief's own text expects Elemental Ward at V 9 and gives it an
  armour line in G3, so at V 7 it would be armour with all resistances seven points from the start. The alternative is to
  land the chaos spoke on Iron Lungs' north small and drop `toWind.a` (Elemental Ward back to 9, one node fewer), but the
  spoke would then bend about 60° and point the same way as the fire spoke. I kept the brief's version: no allocator
  plan at 60 takes Elemental Ward now. **G3 should weigh this before re-lining Elemental Ward with armour.**
- The Barrows road's three spurs side by side (Barrow Ward, Cleaver, Greatblade, 140 to 190 units apart) are the
  brief's §7 item 6, a G3 layout call.
- `bulwark.a`'s re-line to a strength road node, Elemental Ward and Warlord's Banner's re-lines, and the Battlements
  label are G3's.

Nothing here felt like it was losing intent: every road ends where the brief puts a cluster or a crossing, and every
move is one the brief decided.

## 8. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** The skeleton spreads the strength defence out of one corner (Stone Heart west, Mortar
  and Stone north-west, Thick Skin on the far rim, Second Wind south), which is what the brief's tension rests on; no
  road was laid to lengthen a path for its own sake.
- **§2 The reference.** Roads are straight runs that turn at junctions; the keystone spur stays a dead end off a
  junction. No names given; no reference name anywhere.
- **§3 A network.** Stone Ward, Second Wind and Grim Oath gain second ways in; the Barrows get a middle line; the
  Rampart and the Barbican stay joined twice. The temporary single ways in (§6) close when the border pass and G3 land.
  No border link touched.
- **§4 Regions and areas.** No area renamed or named for a build; the defences stay varied and are now in four
  directions.
- **§5 Specializations.** Cleaver moves onto the strength-and-dexterity road (§5.4); Hallowed Hammer to the
  sceptre border; maces are 3 directions now (Weight of Iron, Crushing Blow, Hallowed Hammer), five after G3.
- **§6 Starts.** The Gate is untouched; the first notables are still 2 to 4 steps out and nothing within three names a
  weapon.
- **§7 Roads and attributes.** Nine road nodes, all attributes at +7 (the crossing node +6/+6), each ending at a
  cluster, a junction or a crossing (§7.3); no stretch with nothing off it.
- **§8 Clusters and smalls.** Every cluster moved whole, so every section stays uniform; no re-line, no re-price.
- **§9 Keystones.** All four keep one link. Unerring Discipline turned away from Idle Hands (11 from the start, was 12).
- **§10 Vocabulary.** Unchanged (G3's).
- **§11 Looks.** 0 crossings, 0 drawn over; chains straight from their notable toward their far end (Cleaver lies on
  the line from `e6` to `f7`, Hallowed Hammer on the line from the junction to the Cathedral's road); the junctions'
  fans checked; two labels moved off notables.
- **§12 Size.** 193 → 203, an outcome; no bot simulation run (the allocator is a static tool).
- **§13 Tensions.** Connections against trade-offs (the Elemental Ward step, §7); a generic start against early direction
  (the Gate untouched; Thick Skin's move thins early armour, as the brief chose).
- **§14 Rejected ideas.** No generation (every position chosen by hand and looked at); no filler road (the rim road
  went from 3 nodes to 2 for it); no new restrictive rule.
- **§15 How the work is done.** CONSTRAINTS, the briefs and the method read first; pictures before and after with
  close-ups; geometry after each batch; the region's own folder only; no register, bake, commit or stash.
- **§16 Open.** Labels: two fixed, four left (§6). Keystone distances: Unerring 12 → 11.
