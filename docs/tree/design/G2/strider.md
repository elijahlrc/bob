# G2. The Strider: the skeleton

Written 2026-10-22 for phase G2 of [../G-growth.md](../G-growth.md), from the joined brief
([../G1-brief.md](../G1-brief.md), which wins) and the region brief ([../G1/strider.md](../G1/strider.md)).
[../CONSTRAINTS.md](../CONSTRAINTS.md) wins over both. Roads, spokes and cuts only: no new cluster, no re-line, no link
across a region line.

Pictures (this folder's `strider/`): `before.png` and `after.png` (the region), `after-east.png` (the outer road's north
and middle, with the three spokes; box 2300,−200 → 4300,3800) and `after-south.png` (the road's south half by the Ford
and the Fosse; box 600,2000 → 3200,4100).

## 1. What was laid

**147 → 169 nodes** (+22, all attribute nodes; road share of the region 16% → 27%, which the G3 clusters bring down).

| what                                                 | nodes | where                                                                                                         |
| ---------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------- |
| **The outer road** (`bow.rim.road.*`)                |    16 | an arc at radius about 3,800 from (3800,150) to (1180,3600), nodes 250 to 380 apart, turning 4° to 6° at each |
| **The north spoke** (`bow.rim.northSpoke.x`, `.s`)   |     2 | `x` between Ricochet's exit and Heavy Draw, `s` halfway out; lands on `road.j2`                               |
| **The middle spoke** (`bow.rim.middleSpoke.x`, `.s`) |     2 | `x` between Barbed Arrows and Skewer, `s` halfway out; lands on `road.j3`                                     |
| **The south spoke** (`bow.rim.southSpoke.x`, `.s`)   |     2 | `x` between Skewer and Quick Sip, `s` halfway out; lands on `road.j5`                                         |

All in `src/data/passives/bow/rim.ts`, the area **The Far Pasture** (`bow.rim`), its label moved to (3600,1300), in the
band between the old edge and the road, clear of every notable and of the High Moor's name. Lines: `dex(6), int(6)` on
`j1` and `m12` (nearest the Shade), `str(6), dex(6)` on `m78` and `j8` (nearest the Fosse), `dex(7)` on the rest and on
the spokes (CONSTRAINTS §7.4, as the brief asked).

**Cuts** (both ends inside the Strider; each pair stays joined through its spoke's `x`):

| cut link                                        | written in  | replaced by                                  |
| ----------------------------------------------- | ----------- | -------------------------------------------- |
| `bow.flight.ricochet.b` ↔ `bow.steel.wheel.n2`  | `flight.ts` | `ricochet.b` – `northSpoke.x` – Heavy Draw   |
| `bow.flight.wheel.n2` ↔ `bow.quiver.skewer.a`   | `quiver.ts` | Barbed Arrows – `middleSpoke.x` – `skewer.a` |
| `bow.quiver.skewer.n` ↔ `bow.quiver.quickSip.a` | `quiver.ts` | `skewer.n` – `southSpoke.x` – `quickSip.a`   |

The `why` texts of Ricochet, `ricochet.b`, Skewer, `skewer.a`, `skewer.n` and `quickSip.a` were updated to name the
spokes. **Moves: none. Ids changed or removed: none.** New ids only (22, listed in §1's table: `bow.rim.road.j1`, `m12`,
`j2`, `m23a`, `m23b`, `j3`, `m34`, `j4`, `j5`, `m56a`, `m56b`, `j6`, `m67`, `j7`, `m78`, `j8`, and the three spokes' `x`
and `s`). The bake will register them; nothing else in the folder's registry changes.

## 2. Where the G3 clusters hang

| cluster (brief)                 | hangs on                                                                     | note                                                                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-9 (life, resistances)        | `bow.rim.road.j1`, and `knife.snares.toRicochet.r4` (the border pass's link) | a bridge from the Shade's road into Ricochet to the road's north end                                                                          |
| ST-6 (traps or mines wheel)     | `bow.rim.road.m12`                                                           | outward, polar 6°, the brief's spot                                                                                                           |
| ST-1 (bow, bow crit)            | `bow.rim.road.j2`, crit chain to `bow.rim.road.j3`                           | `j3` reads best if the crit chain leaves on the middle spoke's line, so the spoke and the chain cross the road as one straight line           |
| ST-5 (fervour, attack speed)    | `bow.rim.road.m34`                                                           | outward                                                                                                                                       |
| ST-3 (evasion, regeneration)    | `bow.rim.road.j4`                                                            | outward, the brief's spot                                                                                                                     |
| the ST-5–ST-3 road node         | not laid                                                                     | it joins two clusters that do not exist yet; laid now it would be an unlinked node. G3 lays it with ST-5 and ST-3 (brief: about (3640,2260)). |
| ST-2 (bow, elemental attacks)   | `bow.rim.road.m56a` (changed from the brief's J5, below)                     | polar 44°, straight in from the brief's ST-2 spot (3010,2960)                                                                                 |
| ST-7 (evasion, flasks)          | `bow.rim.road.j6` and `bow.steel.sentryPost.n`                               | a bridge                                                                                                                                      |
| ST-4 (lightning attacks, shock) | `bow.rim.road.m67`                                                           | outward                                                                                                                                       |
| ST-10 (poison, bow damage)      | `bow.rim.road.j7` and `bow.steel.pitch.n`                                    | a bridge; Pitch Arrows stops being a dead end                                                                                                 |
| the Fosse crossing              | `bow.rim.road.j8`                                                            | border pass                                                                                                                                   |

Bare road nodes today: `m23a`, `m23b` (between the north and middle spokes; ST-1 lies outward of them and the north-east
reserve band inward), `m56b`, `m78`. No stretch has more than two bare nodes in a row once the clusters above hang.

## 3. Border links left for the border pass

None of these was touched. Both ends as the joined brief gives them (§2.5, §2.6), with today's ids:

- **The east rim highway:** `bow.rim.road.j1` (3800,150) ↔ `knife.rim.wall.s6` (4100,−150), the Seawall's last node
  (the Shade has laid it). It arrives at `j1` about 140° from the road's own line, so `j1` reads well only as a three-way junction with ST-9 (or ST-9's link) landing too; it should not be left a two-link bend.
- **ST-9's crossing:** ST-9 ↔ `knife.snares.toRicochet.r4` (needs ST-9, G3).
- **Fast claws:** `bow.bows.toKnife.a` ↔ SH-6's rung node (about (1990,−370)).
- **Crit poison:** `bow.flight.venom.a` ↔ `knife.snares.mercy.n` (Mercy Stroke).
- **Lightning strikes:** `bow.rim.road.j8` (1180,3600) ↔ `yard.fosse.storm.n` (Stormstruck).
- **Evasion and accuracy (re-aimed):** RE-6 ↔ `bow.steel.hub.t`, replacing `bow.steel.hub.t` ↔ `yard.dual.j2.a`.
- **The fast sword:** RE-1 ↔ `bow.steel.toBlood.c` (its fifth link; the brief allows `toBlood.d` if it reads crowded).
- **Cut:** `bow.home.added.n414` ↔ `yard.dual.j2.a` (with the re-aim above, `j2.a` keeps two Strider links:
  `steel.road.jt1` and `steel.added.n409`). `n414` stays as Vital Aim's pocket tip.
- Kept as they are: `ricochet.n` ↔ `toRicochet.r4`, Soft Step, Hedge Magic, the Snares, Hot Blood, the Pits' east,
  `jt1` and `n409` to `j2.a`, the ring.

## 4. What changed from the brief, and why

1. **The corners moved to make the junctions read** (CONSTRAINTS §11.5: links leave a node at clean angles, not a
   near-miss of one). With the brief's coordinates every spoke met both its pocket link and the road 12° to 41° off a
   right angle (at the pocket links X1 76°/104°, X2 78°/102°, X3 65°/115°; at the road J3 about 34° and J5 about 41° off a square T), because the old edge does
   not face the way the arc does. Each spoke now leaves the exact midpoint of its pocket link, and its heading is the
   one that splits the error evenly between its two ends: **north 3° and 4° off, middle 13° and 13°, south 10° and 10°**.
   Square at the pocket link would leave the middle and south spokes 24° and 20° off at the road. So `j2` is at
   (3738,685) (brief (3700,820)), `j3` at (3370,1756) (brief (3480,1480)), and the south spoke lands at polar 39°, not
   the brief's J5 at 44°.
2. **Sixteen road nodes, not fifteen.** With the spokes landing where they must, the run between the north and the
   middle spoke is about 1,100 units and the one from the south spoke to `j6` about 1,000; one node in each would leave
   links of 500 to 560 beside links of 250. Two nodes in each, and none between `j4` and `j5` (250 apart), keeps the
   road evenly spaced (250 to 380), for +1 node in all. The extras face the reserve band (`m23a`, `m23b`) and ST-2's
   spot (`m56a`), so they are where later clusters hang, not filler by design; if G3 leaves `m23a`/`m23b` bare, one of
   them can go.
3. **ST-2 hangs on `m56a`**, not on J5: the south spoke's landing moved north to polar 39°, and `m56a` is straight in
   from the brief's ST-2 spot. The brief's reason for ST-2's place (9 steps from ST-4, 10 from Pitch Arrows, not in the
   south corner) is unchanged.
4. **Not laid: the ST-5–ST-3 road node** (§2), and every link across a region line (§3).

## 5. Checks

- **Geometry** (`geometry.ts --region strider --bends`): crossings **0**, drawn over **0**, bends over 20° **12, all
  from before G2** (the same list as before the work: wheel corners in the Hedgerows, the High Moor and the Thicket, and
  `steel.road.jt1`'s turn onto the Yard). No new node bends more than 6°. The whole-tree run shows one crossing, inside
  the Reaver (`yard.shield.shieldwall` against `yard.blades`), another agent's work in progress.
- **Audit:** 0 problems; every `bow.` link resolves; the rim's links in and out are the six spoke links.
- **Ways in** (CONSTRAINTS §3.5): the outer road has three (the spokes) and gains the Seawall, ST-9, ST-7, ST-10 and the
  Fosse later. Every pocket on a cut link keeps two: Ricochet (Venom Fletching's node, the north spoke; plus the Shade's
  road), Heavy Draw (its chain, the north spoke), Barbed Arrows (its wheel, the middle spoke), Skewer (the middle and
  south spokes), Quick Sip (the south spoke, Killing Eye). The road's two ends, `j1`–`m12` and `j5`…`j8`, are tails
  until the border pass and G3 hang their links: by plan, not dead ends.
- **The home check** (steps from the Strider start to every notable bow-crit, bow-elemental and bow-poison took at 60
  points, on the same lists before and after): **no change for any of them.** Skewer goes 15 → 16 (through the middle
  spoke's node), the brief's own reason (§4 of the region brief: the walk from one edge pocket to the next is no longer
  free). Keystones unchanged (Steady Draw 7, Close Quarters 9, Plated Hide 9, Arrow Weave 11). `passives:builds` for
  the three (other regions mid-work, so for the record only): bow-elemental unchanged; bow-crit's tax at 120 23% (was
  22%), Killing Eye and Quick Sip now among what 40 more points buy; bow-poison's choice at 120 is 2 (was 1), tax 30%
  (was 28%). Roads without their clusters raise tax, as expected.

## 6. CONSTRAINTS checklist

- **§1 What the tree is for.** The road is the frame for the second band the brief places to split bow damage,
  evasion, life and crit into directions; nothing near the start moved closer.
- **§2 The reference.** Roads as straight runs turning at junctions; nothing copied, no names (Far Pasture, outer road,
  spokes).
- **§3 A network.** Three spokes into the old edge, each through a road node between two pockets; every cut keeps its
  pair joined; no area or pocket drops to one way in; border links untouched and listed (§3 above).
- **§4 Regions and areas.** The new area is a place name; the label sits over its own area, on no notable and no
  other name.
- **§5 Specializations.** Untouched (no cluster added or moved); ST-2's hang point keeps the brief's twin distances.
- **§6 Starts.** The start and the Bow Gate are untouched; home steps unchanged.
- **§7 Roads and attributes.** Every new node is an attribute node with the brief's values; every junction has a named
  cluster or crossing, and no run of more than two bare nodes; the extra node is argued (§4.2). Dexterity supply rises
  with the road (the brief's §7.9; G5's check).
- **§8 Clusters and smalls.** No small added; sections unchanged.
- **§9 Keystones.** All four unchanged dead-end spurs at 7 to 11 steps.
- **§10 Vocabulary.** Attribute lines only; no re-line (G3's).
- **§11 Looks.** 0 crossings, 0 drawn over, no new bend; junction angles as square as straight spokes allow (§4.1);
  the road an even arc. Pictures before and after.
- **§12 Size.** +22 nodes, one more road node than the brief, for spacing (§4.2).
- **§13 Tensions.** Highways against filler (§13.4): the extra spacing node against even spacing, said in §4.2; looks
  against the brief's corners (§13.7): the corners moved.
- **§14 Rejected ideas.** Placed by hand with a scratch script that computes headings and positions; nothing
  generated; no filler stretch beyond two nodes.
- **§15 How the work is done.** CONSTRAINTS read first; before/after pictures; geometry after each batch; only the
  `bow/` folder edited; no register, bake, commit or stash.

**Intent.** Nothing here felt like it was losing intent. One thing to watch in G3: the road is long, and its south half
(`j5` to `j8`) carries nothing until ST-2, ST-7, ST-4, ST-10 and the Fosse crossing hang on it; if any of them is
dropped, that stretch should be pulled in rather than left as a long empty arc (the region brief's own warning).
