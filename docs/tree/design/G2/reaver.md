# G2. The Reaver (the Yard): the road skeleton

Laid 2026-10-22 for phase G2 of [G-growth.md](../G-growth.md), from the joined brief ([G1-brief.md](../G1-brief.md),
which wins) and the Reaver brief ([G1/reaver.md](../G1/reaver.md) §3). Roads, cuts and moves inside the Reaver only: no
new cluster, no re-line, no link across a region line. [CONSTRAINTS.md](../CONSTRAINTS.md) wins over all of it.

Pictures (this folder): `reaver/before.png` (the region before the first edit), `reaver/after.png`, and the close-ups
`reaver/close-west.png` (the west road, the crossroad's west half, Keen Edge, Guarded, Hewing, Killing Pace),
`reaver/close-south-west.png` (the west road's south end, the Shieldwall spur, Executioner, the leg, Shield Bash),
`reaver/close-east.png` (the crossroad's east half, the east road, Iron Draw, Hot Blood, Crossed Blades) and
`reaver/close-south.png` (the rim road, the spine, Spellsword, the keystone spurs, the Fosse). The close-ups show other
regions' nodes as they stood while their agents worked (the Wall's Cleaver and Second Wind, the Strider's road into the
Pits were moving at the same time).

**Nodes: 150 → 161** (+18 road nodes, −5 single road nodes, −2 keystone-spur smalls).

## 1. What was laid

The brief's grid of roads round the Muster, as straight runs of `str(6), dex(6)` attribute nodes that turn at junctions
(the leg's last node is `str(7)`, as the Fosse's nodes on the Wall's side are).

| road                     | route                                                                                                                   | new nodes                                                                      | what comes off it                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| the west road            | `home.roadW.b` → **w1** → `blades.j1` → **w2** → **w3** → `toHeadsman.r1` → **w4** → `blood.toWall`                     | 4: `yard.blades.west.w1`–`w4`                                                  | Guarded (w1), Hewing (w2), Elemental Edge and the road to Headsman (r1), the block run, the Shieldwall spur and Executioner (w4) |
| the crossroad, west half | `blades.j1` → **c1** → **c2** → `shield.hub`                                                                            | 2: `yard.blades.crossroad.c1`, `c2`                                            | Keen Edge (c1), Killing Pace and Light Blades (c2)                                                                               |
| the crossroad, east half | `shield.hub` → **c3** → **c4** → `dual.j1`                                                                              | 2: `yard.dual.crossroad.c3`, `c4`                                              | Iron Draw, hung between c3 and c4                                                                                                |
| the east road            | `dual.j1` → **e1** → **e2** → **e3** → `blood.j2`                                                                       | 3: `yard.dual.east.e1`–`e3`                                                    | Hot Blood (e1), Crossed Blades (e2 to e3), RE-1 later (e2)                                                                       |
| the spine                | `roadS` → `shield.hub` → Steel Rim wheel → `shield.j1` → `blood.toHarvest` → **p2** → **s1** → **s2** → `fosse.road.f4` | 3: `yard.blood.rim.p2` (shared with the rim road), `yard.blood.spine.s1`, `s2` | Four Winds, the Steel Rim wheel (on it), Open Veins and Red Harvest (beside `toHarvest`), Spellsword (s1), RE-8 later (s2)       |
| the Pits rim road        | `blood.j3` → **p1** → **p2** → **p3** → `blood.j2`                                                                      | 2 more: `yard.blood.rim.p1`, `p3`                                              | Open Veins and Red Harvest above, the spine across its middle                                                                    |
| the leg to the Fosse     | `blood.toWall` → **l1** → **l2** → `fosse.road.f6`                                                                      | 2: `yard.blood.leg.l1`, `l2`                                                   | Shield Bash (l1), the RE-7/RE-9 wheel later (l1 to l2)                                                                           |

18 new road nodes against the brief's 19: the spine's node between the hub and the Steel Rim wheel was not laid (§4).

**Single road nodes removed (5):** `yard.blades.toStandard.a`, `yard.shield.toIronDraw.a`, `yard.dual.toSidestep.a`,
`yard.dual.toCrossed.a`, `yard.blood.toCrossed.a`. **Spur smalls removed (2):** `yard.blood.woundDance.c`,
`yard.blood.crimsonPact.c`. No existing id changed: every moved node stayed in its own area file. **New ids (18):**
`yard.blades.west.w1`, `w2`, `w3`, `w4`; `yard.blades.crossroad.c1`, `c2`; `yard.dual.crossroad.c3`, `c4`;
`yard.dual.east.e1`, `e2`, `e3`; `yard.blood.rim.p1`, `p2`, `p3`; `yard.blood.spine.s1`, `s2`; `yard.blood.leg.l1`,
`l2`. Nothing was registered or baked.

## 2. Cuts and re-hangs (all links with both ends in the Yard)

| change                                                                                   | why                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cut `elementalEdge.n`–`shieldwall.c`, `shieldwall.c`–`executioner.a`, `shieldwall.c`–`d` | the keystone spur stops being a through-route (§9.1). Shieldwall is now `w4` → `d` → keystone, a dead end; the a–b–c run is a uniform block bridge from `shield.j2` to `w4` |
| removed `toStandard` (and its two links)                                                 | lattice. Executioner now runs `w4` → a → n → `shield.standard.a` (§4)                                                                                                       |
| removed `toIronDraw`; cut `hub`–`ironDraw.c`, `dual.j1`–`ironDraw.a`                     | lattice. Iron Draw hangs below the crossroad, `c3` → c … a → `c4`                                                                                                           |
| removed `dual.toCrossed`, `blood.toCrossed`                                              | the east road replaces them: Crossed Blades is a pocket from `e2` to `e3`                                                                                                   |
| removed `toSidestep`                                                                     | lattice. Sidestep keeps Twin Fangs' east small and `dual.j1`                                                                                                                |
| cut `j3`–`spellsword.a`, `spellsword.b`–`j2`                                             | the rim road replaces the chain; Spellsword moved under it, `spine.s1` → Spellsword → `fosse.road.f1`                                                                       |
| cut `hub`–`killingPace.n`, `hub`–`lightBlades.b`                                         | the hub keeps roads; both land on `crossroad.c2`                                                                                                                            |
| `dual.j1`–`hotBlood.a` re-aimed to `east.e1`                                             | the brief's six-link `dual.j1`; it is now a cross of four (Twin Fangs, Sidestep, `c4`, `e1`)                                                                                |
| `j1`–`hewing.a` re-aimed to `west.w2`; `keenEdge.n`–`j1` re-aimed to `crossroad.c1`      | `blades.j1` would have had six links, two of them 20° apart (§4)                                                                                                            |
| cut `keenEdge.b`–`guarded.a`; Guarded entered from `west.w1`                             | the west road runs between them (§4)                                                                                                                                        |
| `toWall`–`shieldBash.a` re-aimed to `leg.l1`                                             | `toWall` would have had seven links (§4)                                                                                                                                    |
| `roadW.b`–`killingPace.a` re-aimed to `home.roadW.a`                                     | room for Keen Edge beside the west road (§4)                                                                                                                                |
| `roadS.b`–`fightingBreath.a` re-aimed to `roadS.c`                                       | the brief's: RE-5's bridge from `roadS.a` would otherwise cross it                                                                                                          |
| `leg.l1`–`leg.l2`, a plain link for now                                                  | without it the Fosse would not get the leg as a way in this round; the wheel replaces it in G3                                                                              |

**Moves (positions only, same ids):** Keen Edge 100 east; Guarded straightened on the line up from `w1`; Hewing re-laid
straight from `w2` toward Elemental Edge; Killing Pace re-laid straight from `roadW.a` to `c2`; Light Blades' `b` onto
the line to `c2`; Executioner to the wedge east of `w4`; Shieldwall `d` to (−1010,2970) and the keystone to (−1095,3000);
Shield Bash re-laid straight from `l1` to `toPits`; Hot Blood 100 east; Crossed Blades re-laid as a V pocket between `e2`
and `e3` (it was ring-placed); Iron Draw re-laid as a U below the crossroad; Spellsword to (181,3470) on the straight
line from `s1` to `f1`; Wound Dance's keystone to (−450,3632) and Crimson Pact's to (925,3262) after their third smalls
went. Area labels: the Pits and the Fosse moved below the new roads, the Muster off Fencer's Eye (it covered it before
this pass), the Practice Ground off Light Blades and the Wall's moved Second Wind, the Yard Gate 9 units up off Buckler's
frame (it touched it before this pass). A scratch check finds no Yard label over a notable, keystone, start or another
area's name.

## 3. Where the G3 clusters hang

| cluster                               | hangs from                         | other end                                                                   |
| ------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| RE-1 (sword, sword speed)             | **`yard.dual.east.e2`** (new)      | `bow.steel.toBlood.c` (border pass)                                         |
| RE-2 (sword, shield block)            | `yard.blades.toHeadsman.r2`        | `wall.grit.east.e6` (border pass)                                           |
| RE-3 (sword, leech)                   | `yard.fosse.road.f2`               | `yard.blood.festering.b`                                                    |
| RE-4 (armour, regeneration)           | `yard.blades.lightBlades.c`        | `yard.blades.elementalEdge.b`                                               |
| RE-5 (attack speed, warcry)           | `yard.home.roadS.a`                | `yard.home.roadE.a` (`roadS.a` freed by the Fighting Breath re-hang)        |
| RE-6 (evasion, accuracy)              | `yard.dual.j2.a` (the east gate)   | `bow.steel.hub.t` (border pass)                                             |
| RE-7 / RE-9 wheel (two-handed / dual) | **`yard.blood.leg.l1`** (new), top | **`yard.blood.leg.l2`** (new), bottom; cut `l1`–`l2` when the wheel goes in |
| RE-8 (bleed, bleed duration)          | **`yard.blood.spine.s2`** (new)    | `yard.fosse.road.f5`                                                        |

## 4. What differs from the brief, and why

1. **No road node between the hub and the Steel Rim wheel** (the brief's (−40,2240)). Nothing would come off it (§7.3),
   and it put Scarred Hide, which all three home archetypes take at 60 points, a step further out (8 → 9). The spine
   enters the wheel straight from the hub; the hub still has five links (the middle road, the crossroad both ways, the
   wheel, the star's fire spoke), the brief's "four roads and the star's spoke".
2. **Keen Edge bridges the home road and the crossroad** (`roadW.b` → diamond → `c1`), moved 100 east, instead of exiting
   to `blades.j1`. The straight west road from `roadW.b` to `j1` ran through the diamond (the brief's note); with Keen
   Edge beside it, its exit to `j1` would have run parallel to the road, and `j1` would have had six links. Guarded,
   whose link to Keen Edge the road now separates, hangs off `w1` instead (9 → 8 steps).
3. **Killing Pace is entered from the home road's first node** (`roadW.a`), not its second, laid straight down to `c2`.
   From `roadW.b` the cell between the west road and the crossroad could not hold both Keen Edge and Killing Pace without
   their nodes 40 to 50 units from each other's links. It also keeps Light Blades at 8 steps (through Killing Pace);
   through the hub alone it would have gone to 9. Killing Pace comes in a step (6 → 5).
4. **Hewing is entered from `w2`**, not `j1` (the brief: Hewing hangs off the west road), and re-laid straight.
5. **Executioner bridges `w4` and Standard Bearer's small**, not `w4` and `toWall`. `toWall` already takes the west road,
   the leg, the Wall's `e8`, Standard Bearer and `j3`; Executioner and Shield Bash on it would have made seven links,
   four of them in a 70° arc on its west side. South-west of the road, Executioner could reach only `toWall` (anything
   else crosses the Wall's `e8` link). So it sits in the wedge east of `w4` and joins the reservation chain: a way from the
   west road up to the crit pocket, and two ways in for each. Shield Bash moved to the leg's first node (the brief puts it
   "beside" the leg; `toPits` stays its second way in).
6. **Iron Draw hangs between the crossroad's two east nodes** (the brief: "the east junction and the crossroad"), so
   `dual.j1` is a clean cross of four.
7. **The leg's two nodes are joined by a plain link** until the wheel goes in (the brief has the wheel between them).
8. Coordinates differ from the sketch where the layout asked: the crossroad's west nodes at (−570,1993) and
   (−320,1997); `w1` at (−740,1770), west of the moved Keen Edge; `w4` at (−925,2940) so the road below it has room for
   the Shieldwall spur on one side and Executioner on the other; the spine's nodes on the straight line from the rim road
   to `f4`; Wound Dance's keystone 85 from its small (the sketch's spot was drawn over).
9. **Left as the brief has it, flagged:** `yard.blood.j2.a` (the east rim junction) has **seven links**: the east road,
   the rim road, Red Harvest, Festering, the Crimson Pact spur, the Fosse and the Strider's road (`bow.steel.toBlood.e`,
   the border's). The brief ends both the east road and the rim road there. Other ways to spread it (the rim road onto
   `f1`, Festering off `f1`) are not in any brief; the joined pass or G3 may take one. `w4` and `toWall` have five, the
   hub five, `j3` five.
10. **The Practice Ground's name** sits along the crossroad's west half at full zoom-out (it is 1,650 units wide; there is
    no clear band in the area that does not cover a notable or the Wall's Second Wind). Links and road nodes under an
    area name are allowed (§11.2); it fades before the nodes matter.

## 5. Border links left for the border pass

Not added, cut or re-aimed here (both ends as the joined brief gives them, §2.4 and §2.5):

- **Vanguard–Reaver:** Second Wind (moved to the Barrows) through one road node ↔ `yard.blades.thirst.n` (Thirsting
  Blade); Cleaver ↔ `yard.fosse.road.f7`; `wall.grit.east.e6` ↔ RE-2 (G3; it hangs from `yard.blades.toHeadsman.r2`);
  the ring arch CE-3. All six of today's links are untouched (`slams.j2.a`–`blades.j1.a`, `grit.east.e8`–`blood.toWall.a`,
  `slams.bracing.b`–`home.fieldDressing.b`, `slams.toYard.a`–`blades.guarded.b`, `grit.headsman.b`–`blades.toHeadsman.r3`,
  Barrow Ward–`fosse.road.f7`).
- **Reaver–Strider:** RE-6 ↔ `bow.steel.hub.t` (re-aimed from the east gate; RE-6 is G3, on `yard.dual.j2.a`); RE-1 ↔
  `bow.steel.toBlood.c` (or `toBlood.d`; RE-1 hangs from `yard.dual.east.e2`); Stormstruck (`yard.fosse.storm.n`) ↔ the
  Strider's outer road's south end (J8); the cuts `yard.dual.j2.a`–`bow.steel.hub.t` and `yard.dual.j2.a`–
  `bow.home.added.n414` (the east gate still has all four Strider links); the ring arch CE-2. The Strider's road into the
  Pits (`toBlood.*`) was being moved while this pass ran; the RE-1 landing and Hot Blood's link to `toBlood.b` should be
  looked at together there.
- The user's 1 to 2 more crossings per border (stop 2) are the border pass's.

## 6. Checks

- **Geometry** (`geometry.ts --region reaver --bends`): crossings 0, drawn over 0. Eight bends over 20°, all at shape
  corners that were there before (Light Blades' and Elemental Edge's triangles, Keen Edge's and Hot Blood's squares, the
  Twin Fangs and Steel Rim wheels) or the Wall's (`fosse.road.f7` toward Barrow Ward, 20°). The first pass had three new
  ones (Crossed Blades, Iron Draw, Light Blades' exit), re-laid. Every new road node with two links runs straight
  (`w3` 10°, the leg's `l2` 4°, the rim road 14° at `p1` and `p3`).
- **Problems:** `buildAll` reports none with a `yard.` id; `passives:audit -- reaver` reports 0 problems.
- **Ways in** (§3.5), from `passives:audit` and by eye: Keen Edge 2 (`roadW.b`, `c1`); Guarded 2 (`w1`, the Wall's
  `toYard`); Hewing and Elemental Edge, one run, 2 (`w2`, `r1`); Killing Pace 2; Light Blades 2 (`c2`, the star); Iron
  Draw 2 (`c3`, `c4`); Hot Blood 2 (`e1`, the Strider's road); Crossed Blades 2 (`e2`, `e3`); Sidestep 2; Executioner 2
  (`w4`, Standard Bearer); Fencer's Eye and Standard Bearer, one run, 3 (`shield.j2`, `toWall`, Executioner); the
  Shieldwall block run 2 (`shield.j2`, `w4`); Shield Bash 2 (`l1`, `toPits`); Spellsword 2 (`s1`, `f1`); Open Veins and
  Red Harvest 3 each; the Steel Rim wheel 4. **The Fosse: from 2 ways in to 5** (`j2` and Spellsword at `f1`, the spine
  at `f4`, the leg at `f6`, Barrow Ward at `f7`). Dead ends: the three keystone spurs, Festering (RE-3 makes it a bridge
  in G3), Stormstruck, Marked Prey, Ceaseless Blades and Thirsting Blade (the border pass makes it a bridge), all as
  before.
- **Home check** (steps from the Reaver start, scratch BFS before the first edit and after the last). The notables the
  three home archetypes took at 60 points in `G0/builds.txt`, Yard side: Quickened Steel 2 → 2, Stout Heart 4 → 4,
  Buckler 4 → 4, Fighting Breath 5 → 5, Killing Pace 6 → **5**, Weaving 6 → 6, Twin Fangs 7 → 7, Keen Edge 7 → 7, Light
  Blades 8 → 8, Scarred Hide 8 → 8, Four Winds 8 → 8, Guarded 9 → **8**, Hewing 10 → **9**, Open Veins 13 → 13, Wound
  Dance 19 → **15**. **None grew.** (The Wall side of those lists moved by the Wall's own G2 moves running at the same
  time: Second Wind 14 → 17, Stone Heart 15 → 16, Thick Skin 16 → 26, Elemental Ward 16 → 14; the Yard's links to the
  Wall are unchanged and the Yard's way to them only got shorter, e.g. `blades.j1` 8 → 6.)
- **Every Yard notable and keystone, before → after:** Elemental Edge 13 → 10, Hot Blood 10 → 11, Shieldwall 15 → 12,
  Crimson Pact 19 → 15, Executioner 15 → 12, Standard Bearer 15 → 12, Crossed Blades 13 → 12, Shield Bash 18 → 14,
  Spellsword 17 → 15, Iron Draw 9 → 10, Thirsting Blade 19 → 14, Festering 18 → 15, Stormstruck 20 → 17, Marked Prey 23 →
  18, Ceaseless Blades 21 → 18; the rest unchanged. Keystones: Shieldwall 12, Wound Dance 15, Crimson Pact 15 (the
  joined brief's estimates were 12, 16, 15), all inside the working 8 to 18. Only Hot Blood and Iron Draw are a step
  further, both off the home builds' lists at 60, both because a junction link became a road node.
- **The allocator** (`passives:builds --only sword-str,axe-bleed,dual-wield`), for the record only: the Wall and the
  Strider agents were moving their nodes in the same tree, so the numbers mix their changes with these. At 60 points tax
  went 27 → 33% (sword), 32 → 30% (axe), 22 → 25% (dual); choice at 120 went 2 → 2, 5 → 8, 2 → 2. Roads without their
  clusters raise tax, as expected; G3 re-measures.

## 7. Checklist against CONSTRAINTS.md

- **§1 Purpose.** The skeleton spreads the Yard's south into reach (the Pits rim and the Fosse 3 to 5 steps nearer), the
  brief's own lever for making the south compete with the west and the east; no new cluster, so tension is G3's to
  measure. Nothing was placed from a build list.
- **§2 Reference.** Roads are straight runs that turn at junctions; keystones one small off a junction as dead ends.
  No names of the reference game anywhere; the new cluster names are plain words (the west road, the crossroad, the east
  road, the rim road, the spine, the leg to the Fosse).
- **§3 Network.** No touched area, wheel or run is left with one way in (§6 above); the Fosse goes from 2 to 5; most
  re-hung pockets are bridges between two road nodes. No cross-region link added, cut or re-aimed.
- **§4 Regions.** No area is named for a build; the labels stay place names, moved where the roads ran under them.
- **§5 Specializations.** Unchanged in substance; no cluster moved closer to its twin (Hewing–Cleaver and the leech
  pair are the border pass's).
- **§6 Starts.** The home's nodes and links are unchanged except Fighting Breath's entrance (one node down the middle
  road); no first notable moved out; Killing Pace a step nearer (5).
- **§7 Roads.** 18 road nodes, every one `str(6), dex(6)` except the leg's last (`str(7)`); every node has a cluster
  off it except `w3`, the brief's one bare stretch beside Hewing, and `c3`/`c4`, which carry Iron Draw between them. The
  spine node with nothing off it was not laid.
- **§8 Clusters.** No small added; two spur smalls removed; the Shieldwall run is a uniform block bridge with no notable
  (the brief's named exception). No line changed.
- **§9 Keystones.** Three dead-end spurs of one or two smalls off a junction; 12, 15 and 15 steps.
- **§10 Vocabulary.** Not touched (G3).
- **§11 Looks.** Crossings 0, drawn over 0, no new unexplained bend; chains re-laid straight (Hewing, Killing Pace,
  Guarded, Shield Bash, Spellsword, Iron Draw's arms, Crossed Blades' arms); junctions at even angles where the
  junction count allowed (`blades.j1` four, `dual.j1` a cross, `c1` a T); labels clear of notables and of each other.
- **§12 Size.** 150 → 161, an outcome; no simulation.
- **§13 Tensions.** Connections against trade-offs: the grid lets a build cross the Yard without paying another
  build's notable, which the brief chose deliberately (§7.1 there); Keen Edge and Crossed Blades are now pockets beside
  their roads, so walking past them is free. Highways against filler: `w3` is the one bare node.
- **§14 Rejected ideas.** Nothing generated: every node was placed by hand from the brief and looked at; no spacing rule
  invented; no step-count reach measure (steps here are costs).
- **§15 Process.** Before picture first; geometry after each batch; close-ups of every changed stretch; only the Yard's
  folder edited; no register, bake, commit or stash.
- **§16 Open items touched.** The Yard's lattice (re-laid as the grid); keystone distances (Wound Dance and Crimson
  Pact 19 → 15, Shieldwall 15 → 12); roads between regions (untouched, the border pass's); attribute supply (+18 road
  nodes of +6/+6, for G5's check against the gear).

Node count note: 150 → 161 counts Yard nodes without the start (the brief's 151 included it). The leg's `l2` is
`str(7)`, not `str(6), dex(6)`, following the Fosse's own nodes on the Wall's side (`f6`, `f7`, `toWall`).

Nothing here felt like it was losing intent. The one judgement the user may want to see is §4.5 (Executioner joined to
Standard Bearer rather than to the Pits junction).
