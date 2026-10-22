# G2. The Shade (the Knife): the skeleton

Written 2026-10-22 for phase G2 of [../G-growth.md](../G-growth.md), from the joined brief
([../G1-brief.md](../G1-brief.md)) and the region brief ([../G1/shade.md](../G1/shade.md)). [../CONSTRAINTS.md](../CONSTRAINTS.md)
wins over both. Only `src/data/passives/knife/` changed; nothing registered, baked or committed.

**Pictures** (this folder's `shade/`): `before.png` and `after.png` (the region), and close-ups of what changed:
`close-seawall.png` (the rim road with Sleet and Whetted Will as bridges), `close-crossroad.png` (the north crossroad
onto Carrion Claws), `close-rung.png` (the claw rung off the dodge junction), `close-static.png` (Static Edge moved).

**Nodes: 146 → 155** (+6 rim road, +2 crossroad, +1 rung; all `attribute`, `dex(6), int(6)`). No node removed, no
id changed, no cut.

## 1. What was laid

| what                                       | where                                                              |                           nodes | links added (both ends in the Shade)                                                           |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------: | ---------------------------------------------------------------------------------------------- |
| **The seawall road** (G1/shade.md §3.1)    | `rim.ts`, a new area **The Seawall** (`knife.rim`), cluster `wall` |     6: `knife.rim.wall.s1`…`s6` | `roofs.walk.r5`–`s1`, `s1`–`s2`–`s3`–`s4`–`s5`–`s6`, `roofs.sleet.n`–`s3`, `roofs.whet.n`–`s4` |
| **The north crossroad** (§3.2)             | `roofs.ts`, cluster `cross`                                        | 2: `knife.roofs.cross.c1`, `c2` | `roofs.ridge.y3`–`c1`–`c2`–`roofs.carrion.a`                                                   |
| **The claw rung** (§3.3, SH-6's rung node) | `edge.ts`, cluster `rung`                                          |          1: `knife.edge.rung.a` | `edge.j1.a`–`rung.a`                                                                           |

Moves (positions only; ids, lines and links unchanged):

- **Static Edge** (`knife.hex.static.n`) from (2044,−2721) to (2090,−2585), below the static road (brief §3.6: about (2110,−2560); pulled to 88 units from its small so the pocket reads tight, §11.5), so SH-1's
  link to `static.b` clears it in G3. The Stair's label moved from (1700,−2560) to (1610,−2580) so it does not cover the
  notable.
- **Sleet** (`knife.roofs.sleet.a/b/n`) in from (4073..4200, −1721..−1740) to (3740,−1594), (3793,−1582), (3862,−1566):
  the rim road passes outside it (brief §3.1), and the chain lies on the straight line from `walk.r6` to `wall.s3`.
- **Whetted Will** (`knife.roofs.whet.a/b/n`) from (3853..3980, −1260..−1274) to (3836,−1202), (3887,−1183),
  (3953,−1159): not in the brief's move list; a layout move (§11.5, §15.10): as a bridge to `wall.s4` the old spot bent
  31° at the notable, now it lies on the straight line from `walk.r7` to `wall.s4`.
- **The Seawall's label** (`at`) from (3950,−1300), where it sat on Whetted Will, to (3950,−1850), over the road's first
  legs, clear of every notable and every other label.

Pockets that became bridges: **Sleet** (`walk.r6` ↔ `wall.s3`), **Whetted Will** (`walk.r7` ↔ `wall.s4`). **Carrion
Claws**' first small is now on a way through (`walk.r3` ↔ `cross.c2`); the notable becomes a bridge when SH-16 lands on
it (G3).

Not laid, as the joined brief decided: **M4's crossing node** (folded into the Mystic's north-east rim road, which lands
on `ridge.y1`); **M2** (the Mystic's curse crossing replaces it). No cuts (brief §3.5).

## 2. Changed from the brief, and why

1. **The seawall road's first two nodes.** The brief has (3600,−2250) and (3950,−1950): the road climbs north from
   `walk.r5` and folds back south at the first node, a ~100° hairpin, and leaves `walk.r5` at 66° from the rooftop road.
   Laid instead: `s1` (3760,−2148), straight out from `walk.r5` along its radius (380 units), and `s2` (3990,−1830) on the
   arc down to the brief's `s3`. `walk.r5`'s three links now leave at 96°, 101° and 164° (a clean T), `s1` is a right-angle
   corner (84°) where SH-3 will hang, and `s2` bends 10°. Nodes 3 to 6 are the brief's points. The road stays inside the
   map circle (radius 4100 to 4420).
2. **Sleet's and Whetted Will's positions:** on straight lines between their two road nodes (above), not the brief's
   Sleet coordinates (they would bend 40° at the notable).
3. **The claw rung** at (1921,−312) (`P(820, 690)`, straight across the blade from the dodge junction) instead of
   (1990,−370). The dodge junction has five links; at the brief's spot the rung left 26° from the Nimble Gambit spur. Now
   the fan is −96° (wheel), −25° (star), 15° (Nimble Gambit), 60° (rung), 135° (south road). It is 200 units above the
   Longbow wheel; the Strider's stub from `bow.bows.toKnife.a` (1668,−30) to it runs over empty ground.
4. **Notation.** The instruction asks for `P(out, side)`; `roofs.ts` writes raw tree units throughout and the brief's
   points are raw, so `rim.ts` and `roofs.ts` use raw units and `edge.ts` uses `P()`, each file in its own notation.
5. **The Seawall** keeps the name the empty file had: a place name (§4.2), the sea-facing east rim of a region whose
   south is the Docks.

## 3. Where the G3 clusters hang (cluster → node)

| cluster                           | hangs on                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| SH-3 (spell crit + insight)       | **`knife.rim.wall.s1`** and **`knife.rim.wall.s2`**                                                             |
| SH-7 (poison + attack speed)      | **`knife.rim.wall.s4`** and **`knife.rim.wall.s5`**                                                             |
| SH-10 (life + dodge)              | **`knife.rim.wall.s6`**, `knife.snares.herald.n`                                                                |
| SH-11 (spell damage + cast speed) | **`knife.roofs.cross.c1`** (the far tip, one end)                                                               |
| SH-16 (dagger + crit multiplier)  | **`knife.roofs.cross.c2`**, `knife.roofs.carrion.n`                                                             |
| SH-6 (claw + claw attack speed)   | **`knife.edge.rung.a`**, `knife.snares.toBow.a`                                                                 |
| SH-1 (ES + spell dodge)           | `knife.hex.static.b`, `knife.roofs.ridge.y2`                                                                    |
| SH-2 (spell damage + vs cursed)   | `knife.roofs.walk.r9`, `knife.snares.toRicochet.r1`                                                             |
| SH-4 (dagger + poison)            | `knife.snares.toBow.b`, `knife.snares.toRicochet.r2`                                                            |
| SH-8 (curse effect + chaos DoT)   | `knife.roofs.ridge.y4`, `knife.roofs.walk.r3`                                                                   |
| SH-9 (dual wield + dodge)         | `knife.snares.quietShot.a`, `knife.roofs.walk.r7`                                                               |
| SH-12 (cold attacks + crit)       | `knife.snares.toRicochet.r4`, `knife.snares.herald.n`                                                           |
| SH-13 (ES + mana)                 | `knife.venom.jN.a`, `knife.venom.j5.a`                                                                          |
| SH-14 (evasion + ES)              | `knife.home.roadB.c`, `knife.edge.j1.a` (its sixth link; the gap between the wheel and the south road takes it) |
| SH-15 (life + evasion)            | `knife.hex.climb.a`, `knife.hex.static.a`                                                                       |

## 4. Border links left for the border pass

None was added, cut or re-aimed here. From the joined brief §2.1 and §2.6:

| border  | Shade end                    | far end                                                             | combination                                              |
| ------- | ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| Mystic  | `knife.hex.toSpire.a`        | MY-10 (dagger spell + cast speed, G3)                               | the dagger caster's bridge                               |
| Mystic  | `knife.hex.j4.a`             | the Mystic's new node at (1470,−2760) off `spire.craft.hexwright.n` | the curse crossing                                       |
| Mystic  | `knife.roofs.ridge.y1`       | the Mystic's north-east rim road's last node (about 1950,−3900)     | the Rooftops road (traps and mines, cold, the crit wand) |
| Strider | **`knife.edge.rung.a`**      | `bow.bows.toKnife.a`                                                | fast claws                                               |
| Strider | `knife.snares.mercy.n`       | `bow.flight.venom.a`                                                | crit poison                                              |
| Strider | `knife.snares.toRicochet.r4` | ST-9 (life + resistances, G3)                                       | life for the Shade's south                               |
| Strider | **`knife.rim.wall.s6`**      | the Strider's outer road's J1 (3800,150)                            | the east rim highway                                     |
| centre  | (ring)                       | CE-1 on the north-east diagonal                                     | stun protection for both homes' casters                  |

Plus the user's 1 to 2 more per border (stop 2), each for a named combination. **Until the border pass lands,
`knife.edge.rung.a` and `knife.rim.wall.s6` are one-link stubs** (G2's state between passes, not a design): if either
crossing is dropped, its node must go or get another link (§3.3, §14 "long paths that connect to nothing").

## 5. Checks

- **Geometry** (`geometry.ts --region shade --bends`): crossings 0, drawn over 0. Bends over 20°: 11, of which one is
  new: `knife.rim.wall.s1` 84°, the seawall road's corner, a junction once SH-3 hangs on it (G3). The other ten are as
  before: wheel and loop corners (Athame, Trapper, Barbed Point, Fine Point) and `walk.r9` (24°, unchanged).
- **Problems**: `buildAll` reports none with a `knife.` id; `passives:pic` reports 0 problems.
- **Labels** (scratch check, label box against notables, keystones, starts and other labels): no label over another;
  the Stair no longer covers Static Edge. Two older ones remain, untouched here: the Alleys over Talon and Fine Point,
  the Rooftops over Athame and Long Knives. They belong to the label pass after G3's clusters fill the Rooftops' north.
- **Ways in** (`passives:audit -- shade`): no cut, so no area lost one. The Seawall has three (`walk.r5`, Sleet,
  Whetted Will; six with SH-7, SH-10 and the Strider's road). Sleet and Whetted Will went from one way in to two;
  Carrion Claws' pocket from one to two.
- **The home check**: steps from the Shade start to every notable the six Shade archetypes took at 60 points in G0
  (scratch script), before and after: **identical** (for example Fine Point 7, Barbed Point 12, Athame 17, Second Curse
  10, Shroud 12). With nothing cut, no step could grow. `passives:builds --only dagger-crit,claw-poison,trap-mine,
dagger-caster,curser,dodge-blades`: every line at 60 and 120 points equals G0's (no plan buys a new road node yet).
- `npx tsc --noEmit -p .`: clean.

## 6. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** No new supply yet; the roads only make room for the clusters that create the tension.
  The home steps did not change, so no archetype got anything cheaper.
- **§2 The reference.** Roads are straight runs that turn at junctions (§2.5); nothing copied; no reference name in an
  id, a name or a `why`.
- **§3 Network.** Two pockets became bridges and a third pocket's small is on a way through; the rim road has three ways
  in; no cut. No border link written (left in §4 for the border pass). Two one-link stubs wait for it (§4).
- **§4 Regions.** The new area is a place name (The Seawall); the road keeps the region inside the map circle and its
  borders where they are.
- **§5 Specializations.** Untouched (G3). The claw rung sits on the Strider side of the Shade, where SH-6's dexterity
  comes from (§5.4).
- **§6 Starts.** Unchanged; the nearest new node is the rung, 6 steps from the start (one past the dodge junction); it names no weapon.
- **§7 Roads.** Nine attribute nodes at +6/+6 (§7.4). Every road node has a cluster to come off it (§3 table) or a
  crossing; the seawall road's first two nodes have only SH-3, so they are filler if SH-3 is not built (§7.3).
- **§8 Clusters.** No cluster added or re-lined; the moved chains keep their smalls beside the notable (70 and 125 out)
  and the length on the link out (§11.5).
- **§9 Keystones.** All five Shade keystone spurs unchanged, one link each.
- **§10 Vocabulary.** No line changed.
- **§11 Looks.** 0 crossings, 0 drawn over; the one new bend is a corner with a reason; the dodge junction's fan evened;
  chains straight; labels clear of every notable they did not already cover.
- **§12 Size.** 146 → 155; no simulation run.
- **§13 Tensions.** Highways against filler: the seawall road's every node has a G3 cluster or a crossing named for it.
  The brief's shape against clean angles: the first leg was re-laid (§2 item 1).
- **§14 Rejected ideas.** No generation; no filler beyond what G3 fills; no new restrictive rule.
- **§15 How the work is done.** CONSTRAINTS read first; before/after pictures and close-ups; geometry after each batch;
  only the Knife's folder edited; no register, bake, commit or stash.
- **§16 Open.** Roads between regions: the eight Shade crossings wait for the border pass. Labels: the Alleys' and the
  Rooftops' names over notables, for the label pass after G3.

**Intent.** Nothing here felt like it was losing intent. The one thing to watch is the seawall road's north end: its
first two nodes are worth their place only if SH-3 is built there in G3.
