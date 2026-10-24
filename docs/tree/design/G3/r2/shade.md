# G3 round 2: the Shade (the Knife)

Done 2026-10-22 for phase G3 of [../../G-growth.md](../../G-growth.md), round 2 of about three. Starting list: the
round-1 report's plan ([../r1/shade.md](../r1/shade.md) §7) and the user's decisions after round 1 (hot spots,
CONSTRAINTS §4.8). [../../CONSTRAINTS.md](../../CONSTRAINTS.md) wins over everything. Only `src/data/passives/knife/`
changed (`edge.ts`, `hex.ts`, `roofs.ts`, `snares.ts`); nothing registered, baked or committed; no git stash.

**Nodes: 179 → 200** (5 notables, 16 smalls). Notables 33 → 38.

**Pictures** ([shade/](shade/)): `before.png` / `after.png` (the region), `before-ids.png` / `after-ids.png`,
`before-north.png` / `after-north.png` (the Stair's top and the Rooftops' inside), `before-south.png` /
`after-south.png` (the Alleys and the Docks), and close-ups with every line: `close-thickblood.png`,
`close-stairtop.png` (Shifting Ward), `close-rooftops.png` (Ill Wish, Between Ribs), `close-docks.png` (Smeared Edge,
Grey Cloak).

## 1. Changes to existing clusters

| what                  | before                                                      | after                                                                                     | why                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Thick Blood**       | chain `wheel.w2` → `c` → `b` → `a` → notable → `jH.a`       | `wheel.w2` → `a` → notable → `jH.a`; `b`, `c` a pocket of two life smalls off the notable | The decision after round 1: the route north is as short as before round 1. Thick Blood 9 → 7, the Stair foot 10 → 8, Second Curse 12 → 10, Rotting Word and Sapper 12 → 11, Hoarded Breath and Shade Leech 15 → 13. The pocket sits in the notable's widest free gap (85° from the chain, 85° from the Spire's road). Lines unchanged. |
| **Tumble**            | dead-end pocket off `toRicochet.r1`                         | a bridge: Grey Cloak lands on its notable                                                 | §3.6; the Docks' east becomes a loop.                                                                                                                                                                                                                                                                                                  |
| **Carrion Claws**     | leaf at the end of its pocket                               | a corner of a loop: Between Ribs lands on its notable                                     | §3.6; dagger or claw at the far north-east (§8.3).                                                                                                                                                                                                                                                                                     |
| **The Stair's label** | (1760, −2880), over Shifting Ward and the Spire's Hexwright | (1880, −2790)                                                                             | Moved before the user's note that labels can be ignored this round; left as it is, as asked. No other label was touched or checked after the note.                                                                                                                                                                                     |

## 2. Clusters added (5 of the remaining 10)

| ledger | notable (cluster id)                    | lead + partner, lines (units)                                        | smalls                                                                        | hangs on (both ends)                                            | steps from the Shade start | twins (steps, notable to notable)                                                        |
| ------ | --------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------: | ---------------------------------------------------------------------------------------- |
| SH-4   | **Smeared Edge** (`knife.snares.smear`) | 20% dagger damage, 18% poison damage (2 + 1.5 = 3.5)                 | 1 × 10% dagger damage (dear-road side), 1 × 12% poison damage (Ricochet side) | `knife.snares.toBow.b` → `knife.snares.toRicochet.r2`: a rung   |                         12 | Fine Point 7, Barbed Point 8, Venom Fletching (Strider) 7, Long Knives far               |
| SH-14  | **Grey Cloak** (`knife.snares.cloak`)   | 18% evasion, 10% ES (1.8 + 2 = 3.8)                                  | 1 × 5% ES (road side), 2 × 10% evasion (Tumble side)                          | `knife.roofs.walk.r9` → `knife.snares.tumble.n`: a bridge       |                         16 | Hoarded Breath 8, Shroud, Soft Step, Veiled Herald and Wiry Frame all over 8             |
| SH-1   | **Shifting Ward** (`knife.hex.ward`)    | 12% ES, 6% chance to dodge spells (2.4 + 2 = 4.4)                    | 2 × 5% ES (Stair side), 2 × 3% spell dodge (ridge side)                       | `knife.hex.static.b` → `knife.roofs.ridge.y2`: a bridge         |                         18 | Ritual Blade 6, Spellslip 8, Hoarded Breath and Shroud over 8                            |
| SH-8   | **Ill Wish** (`knife.roofs.wish`)       | 16% curse effect, +12% chaos DoT multiplier (2 + 2 = 4)              | 2 × +6% chaos DoT (crossroad side), 2 × 8% curse effect (rooftop-road side)   | `knife.roofs.cross.c1` → `knife.roofs.walk.r3`: a bridge        |                         21 | Second Curse and Hexwright over 8; Hasty Words 7 (spell damage, the curser's other want) |
| SH-16  | **Between Ribs** (`knife.roofs.ribs`)   | 16% dagger damage, +24% crit multiplier with daggers (1.6 + 2 = 3.6) | 2 × 10% dagger damage (crossroad side), 1 × +12% crit multiplier with daggers | `knife.roofs.cross.c2` → `knife.roofs.carrion.n`: a loop corner |                         23 | Long Knives 8, Fine Point and Smeared Edge far; Carrion Claws 2 (the claw side)          |

Every notable is 3.5 to 4.4 units, every section one line, every small belongs to its notable. Names checked: the ip
test passes, and each name greps to nothing in the reference tree. **SH-8 was first named "Bitter Tongue"**, renamed
because the Spire now has a Sharp Tongue eight steps from it.

**How each was placed against the user's guidance** (main-stat clusters where taking them costs another want):

- **Grey Cloak (SH-14) moved from the brief's spot.** Between the blade road and the dodge junction it was 8 steps out
  on the route every Shade attacker already walks, so no build would have chosen it: the casters (curser, trap-mine,
  dagger caster) would have had a cheap shield and the attackers cheap evasion near home, the exact hot spot the user
  described, and the home's south side (Soft Step, Snakeskin, Nimble Gambit) would have tipped into a corridor of
  defence (§4.8). In the Docks' south-east, 16 steps out, it is a direction of its own: the Shade's other shield is all
  north and in the middle (Shroud, Hoarded Breath, Shifting Ward, Ritual Blade), its other evasion by the start and
  north. A caster walks away from its spells for it; a trapper goes six steps past Trapper. It lands on `walk.r9` in the
  middle of that node's free arc (76° from the road north, 98° from the trap wheel), which also gives `walk.r9` the
  junction it lacked.
- **Ill Wish (SH-8)** bridges the crossroad's first node to the rooftop road instead of the brief's `ridge.y4` →
  `walk.r3`: from `y4` the link would have arrived at `r3` 22° from the road to `r2`. The straight `c1`–`r3` chain leaves
  `c1` as a cross (Hasty Words north, this south) and arrives at `r3` in the middle of its free gap. The curse smalls
  face the rooftop road, so a poison claw coming from Carrion Claws for the chaos multiplier pays two curse smalls.
- **Smeared Edge (SH-4)** has two smalls, not three: the gap between the two Docks roads is 310 units, and a third small
  would have crowded the link ends. It lands on `toRicochet.r2`, a plain node of a straight road (a rung).
- **Between Ribs (SH-16)** turns about 118° at its notable: any bridge from `c2` to Carrion Claws' notable must, since
  the two ends are 266 apart with Carrion Claws' smalls between them. It reads as a loop (`c2`, two dagger smalls,
  Between Ribs, the crit-multiplier small, Carrion Claws, its two smalls), dagger on one side and claw on the other, a
  micro choice of the §8.3 kind.
- **Shifting Ward (SH-1)** is as briefed. Tested: making it a dead end (cutting the link to `y2`) changed nothing in
  the allocator for the dagger caster, the curser, trap-mine or the dodger, so the bridge does not open a shortcut to
  Ritual Blade and Hasty Words; it stays a bridge (§3.6).

## 3. Deferred border links

None laid, none due: `G2/borders.md` §4 lists two with a Shade end (MY-10 → `knife.hex.toSpire.a`, ST-9 →
`knife.snares.toRicochet.r4`), both landing on existing Shade road nodes from another region's cluster; the Mystic
and Strider agents write them (both are in now). No link across a region line was added, cut or re-aimed.

## 4. Ids

Added (21): `knife.hex.ward.{e2,e1,n,s1,s2}`, `knife.roofs.wish.{k2,k1,n,u1,u2}`, `knife.roofs.ribs.{d2,d1,n,m}`,
`knife.snares.smear.{d,n,p}`, `knife.snares.cloak.{e,n,v1,v2}`. To register at the end of the round.
Changed (position and links, same lines): `knife.edge.thickBlood.a` (now the entrance, beside the notable),
`knife.edge.thickBlood.b` and `.c` (now the pocket). None removed.

## 5. Checks

- **Geometry** (`geometry.ts --region shade --bends`): crossings 0, drawn over 0. Bends over 20°: 10, none new (wheel
  corners and `wall.s6`); `walk.r9`'s old 24° bend is gone (it is a junction now). Notable corners, which the tool skips:
  Between Ribs about 118° (the loop's corner, §2), Tumble 76° and Carrion Claws 107° between their old chain and the new
  link (both bridges now).
- **Problems**: `buildAll` 0 with a `knife.` id. `npx tsc --noEmit -p .` clean. Prettier clean on the Knife's files.
- **Audit** (`passives:audit -- shade`): problems 0; every Shade notable 3.0 to 5.0 units (lowest Bloodletter 3.0,
  highest Second Curse 5.0). Ways in: every Knife area has three or more; the five new clusters are all bridges (two
  ways in each); Tumble and Carrion Claws went from one way in to two. Dead-end pockets in the region: Hasty Words,
  Glint, Quiet Knife, Static Edge, Second Curse, Bloodletter, Veiled Herald, Thick Blood's life pocket, and the five
  keystone spurs.

### The allocator (indicative: other regions are mid-edit; Mystic notables such as Sharp Tongue, Keen Verse, Living Verse are in these plans)

Units at 120 → 160 points: G0 baseline | round 1 | now.

| archetype     | main stat     | G0          | round 1     | now         | new Shade notables taken (60 / 120) | gave up at 120 (≥ 2.5)                              |
| ------------- | ------------- | ----------- | ----------- | ----------- | ----------------------------------- | --------------------------------------------------- |
| dagger-crit   | life          | 27.8 → 30.8 | 32.2 → 43.2 | 32.2 → 32.2 | — / Smeared Edge                    | Long Knives 3.5, Between Ribs 2.8                   |
|               | crit          | 25.3 → 30.3 | 20.7 → 27.3 | 18.6 → 31.3 |                                     |                                                     |
|               | dagger damage | 6.6 → 6.6   | 4 → 6.6     | 7 → 13.2    |                                     |                                                     |
|               | evasion       | 26.8 → 31.1 | 29.1 → 32.5 | 31.6 → 36.6 |                                     |                                                     |
| claw-poison   | life          | 32.2 → 38.8 | 36.6 → 43.2 | 32.2 → 39.2 | — / —                               | Carrion Claws 3.5, Hardy Stock 2.8, Stout Heart 2.6 |
|               | poison        | 15.3 → 16.7 | 16.3 → 21.8 | 16.3 → 20.2 |                                     |                                                     |
|               | claw damage   | 4 → 7.6     | 8 → 11.6    | 8 → 11.6    |                                     |                                                     |
| trap-mine     | trap and mine | 13.7 → 17.7 | 13.7 → 17.7 | 13.7 → 13.7 | Grey Cloak, Shifting Ward / same    | High Veil 3.6, Hoarded Breath 2.8                   |
|               | energy shield | 25.6 → 27.6 | 31.6 → 41   | 31 → 47.4   |                                     |                                                     |
|               | evasion       | 24.7 → 25.7 | 27 → 27     | 33.3 → 33.3 |                                     |                                                     |
| dagger-caster | spell damage  | 23.3 → 23.3 | 32 → 39.8   | 41 → 44.3   | Shifting Ward / same                | Hedge Magic 3.5, Sharp Mind 2.5                     |
|               | spell crit    | 8.9 → 8.9   | 2 → 15.4    | 8.5 → 15.4  |                                     |                                                     |
|               | energy shield | 33 → 36.6   | 39 → 43.6   | 36.4 → 43.4 |                                     |                                                     |
| curser        | curses        | 11 → 17     | 11 → 11     | 15 → 15     | Shifting Ward, Ill Wish / same      | Hedge Magic 3.5                                     |
|               | chaos and DoT | 12.3 → 12.3 | 12.3 → 12.3 | 14.7 → 16.3 |                                     |                                                     |
|               | energy shield | 32.2 → 32.2 | 40.6 → 48.6 | 43.4 → 53   |                                     |                                                     |
| dodge-blades  | dodge         | 10.3 → 17   | 12.3 → 17   | 12.3 → 17   | — / Smeared Edge, Grey Cloak        | Mist Walk 3.1, Stout Heart 2.6                      |
|               | evasion       | 28.9 → 28.9 | 31.2 → 32.5 | 35.5 → 38.8 |                                     |                                                     |
|               | life          | 29.8 → 30.8 | 29 → 45.6   | 26 → 40.2   |                                     |                                                     |
|               | blade damage  | 8 → 14.2    | 12 → 12     | 15 → 15     |                                     |                                                     |

(Round-1 numbers here are from the whole-tree measure `../r1/builds.txt`, which differ slightly from the round-1 Shade
report's table.) Against the targets, these six: typical main-stat growth from 120 to 160 is 22%; main stats gaining
10% or less 35%; builds with no wanted notable (2.5+) in what 40 more points add: 0; one plan at 120: 1 (the curser);
tax at 120 typically 36%.

What moved:

- **The Shade's builds stay home at 60 points.** Trap-mine's 60-point plan is all Shade now (Sapper, Trapper, Shroud,
  Hoarded Breath, Grey Cloak, Wiry Frame, Static Edge, Shifting Ward, Black Powder) where it was half Strider; it gave
  up Tripwire (4), Glass Skin, Quickening, Composure and Hard Target to do it. The dagger caster's 60 is mostly Shade too
  (Shroud, Hoarded Breath, Static Edge, Athame, Shifting Ward, Ritual Blade, Hasty Words). That is the brief's aim (§1.1
  of G1/shade.md: the Shade's casters lived in the Mystic).
- **Dagger damage climbs now** for the dagger crit build: 4 → 6.6 became 7 → 13.2, with Long Knives and Between Ribs
  its gave-up notables. Life went flat for it at 120 (32 → 32): it now spends its last points on daggers and crit.
- **Strength by the back door, the honest reading.** The dagger caster's spell damage at 120 rose again (32 → 41) and
  is nearly flat to 160 (+8%). Split by region, its Shade spell damage at 120 is 17 units, the same four notables as
  round 1 (Quiet Knife, Athame, Ritual Blade, Hasty Words); the rise is the Mystic's and Zealot's new clusters (Sharp
  Tongue, Keen Verse, Living Verse, Homily). This round added no Shade spell damage. Its ES at 120 did not rise (39 →
  36.4; Shade 19.8 units of it). The curser's ES rose a little (40.6 → 43.4, Shifting Ward's 4.4 units) and still
  climbs (+22%). Trap-mine's ES and evasion rose at 60 (7 → 21.8 ES, from Grey Cloak and Shifting Ward) but not at
  120 (31.6 → 31 ES, 27 → 33 evasion): it bought its defence at home instead of in the Strider.
- **The curser's curses are flat from 60 (15 → 15).** It takes every curse cluster it can reach by point 60 (Second
  Curse, Hexwright, Ill Wish); the flatness is missing supply, not reach. It has one plan at 120. Round 3's SH-2
  (spell damage against the cursed) is the next curse supply, and it should go in a different direction (south or east).
- **Still flat:** trap and mine damage (13.7 at 80 to 160: no new trap supply this round), claw damage until 160,
  blade damage for the dodger.
- **Glint is now taken** by the dagger caster at 120 (round-1 question 2): it stays where it is.

### Walks (CONSTRAINTS §15.2), by hand on the map

**1. The main build: a dagger crit Shade, 20 points.** Crit side (1), Keen Instinct (2), the blade road's three attack
speed (5), the wheel's crit entrance (6), the dagger small (7), **Fine Point** (8). Then the fork at the dodge junction
(9): **Snakeskin** (11) and on down the star's chaos spoke and the dear road to **Smeared Edge** (16, its dagger small
on the way in), then the **Nimble Gambit** spur (19), one point left; or north for life instead (Thick Blood is 7 from
the start, the other side of the wheel). _Chose:_ dagger and crit near home, one defence, the second dagger cluster
south. _Gave up:_ life (Thick Blood, Wiry Frame), Soft Step, Mercy Stroke one road over. _No-choice stretch:_ the blade
road's three smalls, all wanted. _Nobody would take:_ none; Raking Hand is on the junction's other arm (claws), passed by.

**2. An off-build: the curser, 20 points.** Evasion side (1), the north hub (2), the north road (4), the wheel's claw
small (5, tax), life (6), **Thick Blood** (7), the Stair foot (8), the curse small (9), **Second Curse** (10), the
north junction (11), shield twice (13), **Hoarded Breath** (14), the barb road's shield small and the wheel's south node
to **Rotting Word** (17), Keen Instinct (18), Thick Blood's life pocket (20). _Chose:_ curses, chaos and the Shade's
shield, two points cheaper than in round 1. _Gave up:_ Ill Wish and Shifting Ward (both 21 or more), Quiet Knife,
the Spire's Hexwright. _No-choice stretch:_ the claw small at the wheel (one node, was four in round 1). _Nobody would
take:_ none.

**3. A neighbour coming in: a poison bow Strider, 20 points.** Its own start and Hawk's Eye, then the crit poison
crossing: **Venom Fletching** and **Mercy Stroke** (both 9 from the Strider start), then **Smeared Edge** (11; it pays
the dagger small to reach the poison) or **Raking Hand** (8, no use to a bow). At 20 it has Venom Fletching, Mercy
Stroke and one of Smeared Edge or its own Longbow wheel. _Chose:_ poison and crit multiplier where the two regions
meet. _Gave up:_ its own bow wheel or the Shade's poison. _No-choice stretch:_ none. _Nobody would take:_ none.

**4. Late: the dagger caster, 120 points** (the allocator's best plan agrees). Home and the north road (Keen Instinct,
Quiet Knife 7, Thick Blood 7); the blade to Shroud and Hoarded Breath; the Stair's top (Static Edge, **Shifting Ward**
18, the Spire's Sharp Tongue on the dear road); the far north-east (Athame 17, Ritual Blade 23, Hasty Words 24); the
east rim (Glint 23, Quiet Shot); then the Mystic (Arcane Focus, Glass Skin, Darting Bolts, Keen Verse, Composure,
Thunderhead, Hoarfrost). _Gave up:_ Hedge Magic (3.5), Sharp Mind (2.5), Grey Cloak (2): the south-east shield is the
direction it does not go. _No-choice stretch:_ the rooftop road's attribute nodes on the way to Glint. _Nobody would
take:_ none of the Shade's; Ill Wish and Between Ribs are other builds' (the curser takes Ill Wish at 60; Between Ribs is
the dagger crit build's gave-up at 120).

## 6. The home: offence and defence (§4.8)

Within about 8 steps of the Shade start: the start loop mixes evasion (north side) and crit (south side) with Keen
Instinct (crit, evasion, shield). North: Spoils (mana), Quiet Knife (spell and dagger), Talon (claws with recovery),
Thick Blood (life). Middle: the blade road (attack speed) into the wheel (claws, daggers, crit; Fine Point). South:
Soft Step (evasion), Snakeskin (resistances, evasion), Nimble Gambit (dodge), Raking Hand (claws), the wheel's dagger
side. **No area near the start is all defence or all offence**; the south leans to defence (three of its five notables)
and was the reason Grey Cloak did not go there (§2). Thick Blood's change keeps its life on the north side, beside
Talon and Quiet Knife.

## 7. Plan for round 3

**SH-10** (life + dodge, `wall.s6` / Veiled Herald), **SH-12** (cold attacks + crit, `toRicochet.r4` / Veiled
Herald), **SH-7** (poison + attack speed, `wall.s4` / `wall.s5`), **SH-9** (dual wield + dodge, `quietShot.a` /
`walk.r7`), and **SH-2** (spell damage + against the cursed). Notes for it:

- **SH-2 needs a new spot.** Its brief ends (`walk.r9`, `toRicochet.r1`) are taken: Grey Cloak now leaves `walk.r9`
  south in its only clean gap. Wanted: a direction away from the north-east spell cluster (Hasty Words, Ritual Blade,
  Athame) and from Ill Wish, since the dagger caster's spell damage and the curser's curses are both saturated there.
  Candidates: the empty ground between Quiet Shot, the point and the Cruel Agony spur (shared with SH-9; one of the two
  moves), or the Docks' east toward the rim.
- **The Docks' south-east gathers defence:** Tumble, Grey Cloak, Veiled Herald, and SH-10 (life and dodge) is planned
  there. SH-12 (cold attacks with crit) is the offence that should sit beside them, so the corner is not a defence
  corridor (§4.8).
- Trap and mine damage is flat for trap-mine; no trap cluster is in the brief. If round 3's measure still shows it, a
  trap or mine cluster from the reserve (G1/shade.md §5) is the lever.

## 8. Open questions

1. **Grey Cloak moved off the brief's near-home spot** (16 steps in the south-east, not 8 between the blade road and
   the dodge junction), for the user's hot-spot guidance of 2026-10-22 (§2). **This reverses a decision the user made
   at stop 2** (G1-brief.md question B: keep SH-14 near the Shade start). The old spot is still empty, so going back is
   one cluster move. Agreed, or back to the near spot?
2. **The dagger caster's spell damage is nearly flat at 120 (41 → 44)**, mostly from other regions' new clusters; the
   Shade added none this round. SH-2 in round 3, placed away from the north-east, is the Shade's lever; is that enough,
   or should a Shade spell cluster move outward (Hasty Words is a dead end at 24, Ritual Blade at 23)?
3. **The curser takes all its curse supply by point 60** and has one plan at 120. More curse supply (SH-2, and
   elsewhere outside the Shade) is the only fix; say if a curse cluster should be added beyond the brief.

**Intent.** Nothing here felt like it was losing intent. The one placement changed from the brief (Grey Cloak) was
changed for the user's own new guidance, and the other four followed the brief with layout fixes said out loud.

## 9. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Each new cluster is a direction with a partner a build may not want (dagger with poison,
  shield with spell dodge, evasion with shield in the south-east, curses with chaos rot far out, dagger with crit
  multiplier against the claw). The allocator shows the dagger crit build's daggers climbing and two of its wanted
  notables in gave-up; the flat stats (curses, spell damage, traps) are named with their causes.
- **§2 The reference.** Twins 6 or more apart (Ritual Blade 6 is the nearest, a partner line); notables 3.5 to 4.4
  units; names our own, checked; the reference game is not named.
- **§3 A network.** Five new bridges; Tumble and Carrion Claws stop being dead ends; the Docks' east and the far
  north-east get loops; Thick Blood gains a dead-end pocket (by decision). No border link changed.
- **§4 Regions.** Defences after the round: evasion, ES (four directions), life (two), dodge, spell dodge, resistances,
  stun avoidance, recharge. The home mixes offence and defence (§6 above); Grey Cloak kept out of the home's south.
- **§5 Specializations.** Daggers: Fine Point (crit), Smeared Edge (poison), Long Knives (speed), Between Ribs (crit
  multiplier), 7 to 8 apart and in four directions. Curses: Second Curse, Hexwright (Spire), Ill Wish, far apart.
  ES: Shroud, Hoarded Breath, Shifting Ward, Grey Cloak, Ritual Blade, each a different partner and place. Convergence
  rule: no new cluster pairs spell damage with ES or life with armour.
- **§6 Starts.** Unchanged; the nearest new notable is Smeared Edge at 12 steps (11 from the Strider start); none
  within three steps of a start names a weapon. Thick Blood back to 7.
- **§7 Roads.** No road node added; `walk.r9`, `cross.c1`, `cross.c2`, `toRicochet.r2`, `toBow.b`, `ridge.y2` and
  `static.b` each gained a cluster.
- **§8 Clusters.** Every small belongs to a notable; every section uniform; notables 3.5 to 4.4 units.
- **§9 Keystones.** All five spurs unchanged, one link each. Shifting Ward forks with Spellslip.
- **§10 Vocabulary.** Lines from `lines.ts` only (`daggerDamage`, `poisonDamage`, `evasion`, `es`, `dodgeSpell`,
  `curseEffect`, `chaosDot`, `weaponCritMulti`); `lines.ts` untouched; one theme per cluster.
- **§11 Looks.** 0 crossings, 0 drawn over; smalls 70 and about 55 apart beside their notables; chains straight; the
  one sharp notable corner (Between Ribs) is a loop's corner, said in §2. Labels: one moved before the user's note,
  then left alone.
- **§12 Size.** 179 → 200; no bot simulation.
- **§13 Tensions.** Density against tension (Grey Cloak out of the home), bridges against dead ends (Thick Blood's
  pocket), the brief against clean angles (Ill Wish's end, Smeared Edge's two smalls).
- **§14 Rejected ideas.** No generation (positions computed from hand-chosen ends and the §11.5 spacings, then looked
  at); no filler; no step-count reach; no new rule.
- **§15 How the work is done.** CONSTRAINTS and the briefs read first; before/after pictures and close-ups; geometry
  after the batch; only the Knife's folder; no register, bake, commit or stash; only the ip test.
- **§16 Open.** The Knife has 38 notables; SH-2's spot and the curse and spell supply are round 3's.
