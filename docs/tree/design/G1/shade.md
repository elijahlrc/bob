# G1b. The Shade (the Knife): growth brief

Written 2026-10-22 for phase G1b of [../G-growth.md](../G-growth.md), from the ledger
([../G1-ledger.md](../G1-ledger.md), §0 first), the baseline ([../G0-baseline.md](../G0-baseline.md),
[../G0/builds.txt](../G0/builds.txt)) and the area files in `src/data/passives/knife/`. [../CONSTRAINTS.md](../CONSTRAINTS.md)
wins wherever this brief disagrees with it. Nothing in the network changed; this is a design for user stop 2.

**Pictures** (all in [shade/](shade/)):

- `today.png`: the Shade as it is.
- `sketch.png`: the whole region with the plan drawn over it. Orange rings are new clusters, cyan lines new roads
  (open circles are new road nodes), green lines new links (border crossings are labelled), yellow dots moved nodes.
- `sketch-north.png` and `sketch-south.png`: close-ups of the two busiest parts (the Stair and the Rooftops' inside; the
  Alleys, the Docks and the east rim).
- `sketch.json`: the sketch itself, for the joining agent.

Steps quoted below are counted on today's network with the sketch applied (a scratch script that adds each new cluster
as a chain with its notable in the middle). They are estimates for G2 and G3 to confirm with `passives:builds`, not
measurements of the built network.

## 0. In one paragraph

The Shade takes 15 of the ledger's 16 clusters. **SH-5, the crit claw, is dropped**: it would have been the fourth claw
cluster and the second in the Docks. Ten of the 15 are placed somewhere other than the ledger's spot, because the
ledger's spots made one-stops on the map (curses beside Second Curse, ES beside Spoils, the poison dagger beside Barbed
Point) or broke a twin distance (insight within 6 of Flashes of Insight). The seven small sections are folded into
clusters, except the attack speed one, which is dropped. **The Shade does not fit inside its outline.** The ledger's
304 empty cells are mostly the rim band east of the Rooftops; the inside holds four pockets of 15 to 36 cells. So the
brief adds an **east rim road** (six attribute nodes from the Rooftops' fifth node round the outside of Sleet and
Whetted Will to the Strider's outer road) and a short **north crossroad** inside the Rooftops. Both lie inside today's
map circle. Border links go from 4 to 7 with the Mystic and from 4 to 8 with the Strider. The Shade goes from 146 nodes
to about 224, and from 28 notables to 43.

## 1. The wants that need competition

### 1.1 What the baseline says about the builds that start here or pass through

From [../G0/builds.txt](../G0/builds.txt) (units at 120 → 160 points), and from the plan pictures in `../G0/builds/`:

| archetype     | flat at 120 (40 more points add little)                     | where its plan goes today                                                                                                                         |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| dagger-caster | spell damage 23 → 23, spell crit 9 → 9, ES 33 → 37          | Out of the Shade: the Mystic's Scriptorium and Column (Arcane Focus, Warded Mind, Glass Skin, Darting Bolts). The Shade sells it almost no spell. |
| curser        | chaos and DoT 12 → 12, ES 32 → 32, curses 11 → 11 until 160 | Second Curse and Rotting Word, then the Mystic for ES and spell damage.                                                                           |
| dagger-crit   | dagger 6.6 → 6.6, evasion 27 → 31, life 28 → 31             | Fine Point, then south into the Strider and the Reaver for attack speed, life and evasion. Long Knives only at 120.                               |
| dodge-blades  | evasion 29 → 29, life 30 → 31                               | Nimble Gambit and Soft Step, then the Strider and the Reaver.                                                                                     |
| claw-poison   | poison 15 → 17                                              | Talon, Barbed Point, Snakeskin; Carrion Claws is the one thing it still wants.                                                                    |
| trap-mine     | ES 26 → 28, evasion 25 → 26                                 | Trapper and Sapper, then the Mystic's ES (Glass Skin, Warded Mind).                                                                               |
| bow-poison    | (passes through) poison 11 → 15, bow 14 → 21                | Barbed Point and Quiet Shot from the Strider's dear road.                                                                                         |
| caster-es     | (passes by) spell damage 21 → 23                            | Its gave-up list holds Quiet Knife; the Stair is otherwise untouched.                                                                             |

The pattern for the Shade: **its casters live in the Mystic and its attackers in the Strider**, because the Shade
sells almost no plain spell damage (Quiet Knife alone), little ES (Shroud, Ritual Blade, smalls), little life (Thick
Blood, 6 units) and little evasion (11 units). Its own north-east (the Rooftops) is barely used before 120 points. The
fix is to give each main want two or three Shade directions with different partners, so that a Shade build can stay at
home and still has to choose, rather than finding the same few Mystic and Strider notables every time.

### 1.2 The ledger's rows, judged against the map

| id    | ledger                                          | verdict                          | why, for players                                                                                                                                                                                                                                                                                                                  |
| ----- | ----------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SH-1  | ES + spell dodge, beside Spellslip              | **agree**                        | ES or the keystone that costs 30% ES: a real fork at the top of the Stair.                                                                                                                                                                                                                                                        |
| SH-2  | spell damage + vs cursed, Rookery inside        | **agree, moved south-east**      | In the Rookery it sat 3 to 4 steps from Second Curse (10) and Rotting Word (11): a hexer's one-stop. In the Docks' east it is 10 from Second Curse and 11 from Rotting Word, a fourth direction for the curser.                                                                                                                   |
| SH-3  | spell crit + insight, Stair north (crossing)    | **agree, moved to the rim**      | The Stair's north is 5 to 6 steps from Flashes of Insight through the Devotion crossing; the row asks for 8. On the east rim road it is 15 from Flashes and 8 from Athame. The Scriptorium crossing it was meant to carry is made with a plain link instead (M2, §3.4).                                                           |
| SH-4  | dagger + poison, Alleys–Rookery gap             | **agree, moved south**           | The gap between Fine Point (7) and Barbed Point (12) is about five steps wide, so the row's "≥5 from both" cannot hold there, and a poison dagger beside Barbed Point (poison with crit) hands the poison dagger both for one path (§5.5). Between the two Docks roads it is 7 from Fine Point and 8 from Barbed Point.           |
| SH-5  | claw + claw crit, the Docks                     | **reject**                       | It would be the fourth claw cluster and the second in the Docks, a step from SH-6. Three claw homes (Talon near, SH-6 on the Strider border, Carrion Claws far north-east), three partners, three directions, are §5.1's "two or three". It is the first round-2 lever if the claw build is still flat after G3.                  |
| SH-6  | claw + claw attack speed, Strider border        | **agree**                        | Claws where the Strider's dexterity meets the Shade's intelligence (§5.4).                                                                                                                                                                                                                                                        |
| SH-7  | poison + attack speed, Rooftops' outer road     | **agree**                        | On the new east rim road, 13 from Barbed Point and 16 from SH-4.                                                                                                                                                                                                                                                                  |
| SH-8  | curse effect + chaos DoT, Rookery–Stair         | **agree, moved north-east**      | Same one-stop as SH-2 (Second Curse, Rotting Word, Hexwright through Devotion, all within 6). In the Rooftops' inside it is 14 from Second Curse and 12 from Hexwright.                                                                                                                                                           |
| SH-9  | dual wield + dodge, Alleys by Nimble Gambit     | **agree, moved east**            | By Nimble Gambit it is two steps from Fine Point, whose crit while dual wielding would then sit beside it: the dual-dagger build's one-stop. Between Quiet Shot and the Rooftops it is 12 from Fine Point and 6 from Long Knives. It loses the pull of Nimble Gambit; the dodge build still meets both.                           |
| SH-10 | dodge + life, the Docks                         | **agree, moved to the rim**      | No spot in the Docks keeps 5 from Tumble (it hangs off the same road). On the rim road's south end it is 11 from Tumble.                                                                                                                                                                                                          |
| SH-11 | spell damage + cast speed, Rooftops–Stair north | **agree, placed far north-east** | The Stair's top already holds SH-1, Static Edge and Spellslip; the quick caster there would be a caster's one-stop. In the Rooftops' inside, off the new crossroad, it is 13 from Rotting Word and 8 from Ritual Blade.                                                                                                           |
| SH-12 | cold attacks + crit, Rooftops' east             | **agree, moved south-east**      | The Rooftops' east is where the rim road and SH-7 go. Between the Ricochet road and Veiled Herald it serves daggers, claws and the Strider's bows next door, 13 from Sleet.                                                                                                                                                       |
| SH-13 | ES + mana, Knife Gate to Stair                  | **agree, moved to the Rookery**  | Between the Knife Gate and the Stair it lands beside Spoils (mana) and Quiet Knife (spell): a caster's ES, mana and spell within 7 steps of the start. Between Shade Leech and Hollow Vessel it is the shield Shade's corner, beside the two keystones that reward ES (a pull), and a bridge between the Rookery's two junctions. |
| SH-14 | evasion + ES, Rookery–Docks                     | **agree, moved near home**       | Rookery–Docks is beside Shroud on the same wheel. The Alleys' hole by the blade road (8 steps) is the Shade's own two defences near home, as Keen Instinct is. This is the one placement that trades tension for density and varied defences; §7 item 3 says so, and §8 asks.                                                     |
| SH-15 | life + evasion, Alleys to the Strider border    | **agree, moved north**           | On the border it would be 6 to 8 steps from the Shade start beside the Strider's ST-9 (life and resistances) and Long Breath: every Shade attacker's cheap life. In the Stair's middle, past Thick Blood, life becomes a direction: the attacker who wants it walks north, away from its offence.                                 |
| SH-16 | dagger + dagger crit multi, Rooftops' ridge     | **agree, moved**                 | On the ridge it would sit beside Ritual Blade (the dagger caster), repeating the Athame wheel's caster-or-attacker pair. Off the north crossroad it is 7 from Long Knives and 18 from Fine Point.                                                                                                                                 |
| SH-r1 | re-line Shroud: ES, avoid stun, ES recharge     | **agree**                        | SH-14 takes the evasion with ES; recharge beside Shade Leech (slower recharge) is a fork.                                                                                                                                                                                                                                         |
| SH-p1 | Whetted Will to at least 3 units                | **agree**                        | §8.6.                                                                                                                                                                                                                                                                                                                             |

### 1.3 The small sections, folded (ledger §0)

| section            | goes to                                                            | why                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SH-s1 life         | Thick Blood: two more life smalls, so its chain reads as a cluster | The life a Shade finds on the way north.                                                                                                                            |
| SH-s2 life         | SH-15's life side (three life smalls)                              | SH-13 moved; the north's life is SH-15.                                                                                                                             |
| SH-s3 ES           | SH-14 (one ES small more) and SH-13                                |                                                                                                                                                                     |
| SH-s4 evasion      | SH-15's evasion side (two evasion smalls toward the static road)   | A bridge cluster carries two uniform sections, one each side of its notable (§8.2).                                                                                 |
| SH-s5 spell damage | one more spell small each on SH-2 and SH-11                        |                                                                                                                                                                     |
| SH-s6 attack speed | **dropped**                                                        | The blade road is already three attack speed smalls at steps 3 to 5. Another near section would hand attack speed to every Shade attacker before it chooses (§1.1). |
| SH-s7 crit         | SH-12's crit side                                                  |                                                                                                                                                                     |

No notable-less run is kept. The roads are attribute nodes (§7).

## 2. Where each goes

Coordinates are tree units (the Shade start is at 866,-500; the map circle has radius 4725). "Steps" is from the Shade
start to the notable. "Links" are the cluster's two ends.

| id    | lead + partner                 | where                                                                | at         | links (its two ends)                               | steps | nearest twins (steps)                                               |
| ----- | ------------------------------ | -------------------------------------------------------------------- | ---------- | -------------------------------------------------- | ----: | ------------------------------------------------------------------- |
| SH-14 | evasion + ES (5 nodes)         | the Alleys' hole between the blade road and the dodge junction       | 1480,-790  | `home.roadB.c`, `edge.j1.a`                        |     8 | Keen Instinct 6, Soft Step 6, Fine Point 5, Shroud 11               |
| SH-6  | claw + claw attack speed (4)   | the Strider border, east of the Longbow wheel                        | 2230,-170  | a new rung node from `edge.j1.a`; `snares.toBow.a` |     8 | Talon 7, Carrion Claws 19                                           |
| SH-4  | dagger + poison (4)            | between the dear road to the Bow and the road to Ricochet            | 2650,-280  | `snares.toBow.b`, `snares.toRicochet.r2`           |    11 | Fine Point 7, Barbed Point 8, Long Knives 13                        |
| SH-13 | ES + mana (4)                  | the Rookery's north, between the Shade Leech and Hollow Vessel spurs | 2380,-1980 | `venom.jN.a`, `venom.j5.a`                         |    12 | Shroud 6, Shade Leech 5, Hollow Vessel 6, SH-1 13                   |
| SH-2  | spell damage + vs cursed (5)   | the Docks' east, below the rooftop road's south end                  | 3000,-650  | `roofs.walk.r9`, `snares.toRicochet.r1`            |    15 | Second Curse 10, Rotting Word 11, Quiet Knife 15, SH-8 12           |
| SH-15 | life + evasion (6)             | the Stair's middle, between the climb and the static road            | 1780,-2420 | `hex.climb.a`, `hex.static.a`                      |    15 | Thick Blood 8, Rotting Word 5, Static Edge 5, SH-1 6                |
| SH-12 | cold attacks + crit (4)        | the Docks' south-east, between the Ricochet road and Veiled Herald   | 3150,80    | `snares.toRicochet.r4`, `snares.herald.n`          |    16 | Sleet 13, Mercy Stroke 7, SH-10 6                                   |
| SH-1  | ES + spell dodge (4)           | the Stair's top, east of the Spellslip spur                          | 2120,-3000 | `hex.static.b`, `roofs.ridge.y2`                   |    17 | Spellslip 7, Mist Walk 8, Shroud 13                                 |
| SH-9  | dual wield + dodge (4)         | between Quiet Shot and the Rooftops                                  | 3250,-1450 | `snares.quietShot.a`, `roofs.walk.r7`              |    17 | Fine Point 12, Long Knives 6                                        |
| SH-8  | curse effect + chaos DoT (4)   | the Rooftops' inside, south of the north crossroad                   | 2800,-2720 | `roofs.ridge.y4`, `roofs.walk.r3`                  |    20 | Second Curse 14, Hexwright 12, Withering 20, SH-11 7                |
| SH-10 | life + dodge (5)               | off the east rim road's south end, toward Veiled Herald              | 3750,-380  | rim road node 6, `snares.herald.n`                 |    20 | Tumble 11, Soft Step 18, SH-15 far                                  |
| SH-3  | spell crit + insight (4)       | off the east rim road's north end                                    | 3900,-2350 | rim road nodes 1 and 2                             |    21 | Athame 8, Flashes of Insight 15, Sleet 5                            |
| SH-16 | dagger + dagger crit multi (4) | the Rooftops' inside, north of the crossroad, beside Carrion Claws   | 3150,-3330 | crossroad node 2, `roofs.carrion.n`                |    22 | Long Knives 7, Fine Point 18, SH-4 18                               |
| SH-7  | poison + attack speed (4)      | inside the east rim road, between Whetted Will and SH-10             | 3950,-850  | rim road nodes 4 and 5                             |    22 | Barbed Point 13, SH-4 16, Festering far                             |
| SH-11 | spell damage + cast speed (5)  | the Rooftops' inside, north of the crossroad                         | 2780,-3300 | crossroad node 1 (a dead-end pocket: the far tip)  |    23 | Ritual Blade 8, Athame 9, Rotting Word 13, SH-2 15, Arcane Focus 17 |

Every twin the ledger names is at least 5 apart, most of them 7 or more. No new cluster is within 7 steps of a start
(the nearest is 8), and the two at 8 name no weapon at all (SH-14) or one past four steps (SH-6, §6.3).

**Directions, after the brief.** Read from the start, the Shade now offers:

- **North-near** (the north road): Spoils, Quiet Knife, Thick Blood. Nothing new; the caster's near spell stays alone.
- **The Stair** (north, 11 to 18): Rotting Word, Sapper, SH-15 (life), SH-1 (ES), Static Edge, Spellslip, Black Powder,
  and the Mystic crossings. Life and ES, not spell damage.
- **The blade** (straight out, 6 to 18): Talon, Fine Point, SH-14, Barbed Point, Shroud, SH-13 (ES), Second Curse, the
  keystones.
- **The south** (8 to 16): SH-6 (claws), SH-4 (poison dagger), Mercy Stroke, the Docks wheel, SH-2 (spell), SH-12
  (cold attacks), and the Strider.
- **The far north-east** (17 to 23): Athame, Long Knives, SH-8 (curses), SH-11 (spell), SH-16 (dagger crit), Ritual
  Blade, Carrion Claws.
- **The east rim** (19 to 22): Sleet, Whetted Will, SH-3 (spell crit), SH-7 (poison), SH-10 (life), and the Strider's
  outer road.

## 3. The skeleton

### 3.1 The east rim road (new, six attribute nodes plus a shared end)

From `knife.roofs.walk.r5` (3430,-1960), which has nothing off it today, out and down the east:
(3600,-2250) → (3950,-1950) → (4150,-1500) → (4250,-1050) → (4250,-600) → (4100,-150) → **(3800,150)**, the north end
of the Strider's outer road in the Strider sketch (`G1/strider/sketch.json`), which is shared. Radius 4100 to 4400, so
the road stays inside today's map circle (4725): the Shade grows into its own rim band, not past the map.

- **Why it is needed.** The inside holds four pockets of 15 to 36 cells (room for 8 to 10 clusters), not 15 clusters.
  CONSTRAINTS §11.3: lay a new road or enlarge rather than cram.
- **What comes off it** (§7.3): SH-3 (nodes 1 and 2), the Sleet pocket (node 3), Whetted Will and SH-7 (node 4), SH-7
  (node 5), SH-10 (node 6), the Strider's outer road (the end). No stretch is longer than one node without a branch.
- **Bridges.** Sleet and Whetted Will become pockets between two roads (§3.6): `sleet.n` links node 3, `whet.n` links
  node 4. Sleet's three nodes move about 350 units in toward the Rooftops (3700..3840, -1665..-1690) so the rim road
  passes outside them.
- **Ways in** (§3.5): `walk.r5`, Sleet, Whetted Will, SH-7, SH-10 (through Veiled Herald), and the Strider's road. Six.

### 3.2 The north crossroad (new, two attribute nodes)

`knife.roofs.ridge.y3` (2470,-3020) → (2780,-3020) → (3080,-3010) → `knife.roofs.carrion.a` (3265,-2989). It crosses the
Rooftops' empty inside, makes Carrion Claws a bridge rather than a dead-end pocket, and hangs SH-11 (north), SH-16
(north-east) and, from the ridge, SH-8 (south). Ways in: the ridge from Black Powder, `walk.r2` through the ridge,
`walk.r3` through Carrion Claws or SH-8.

### 3.3 Rungs and bridges inside the region

- **SH-13** is a second road through the Rookery's north, `jN` to `j5`: today `jN` reaches `j5` only round the Barbed
  Point wheel.
- **SH-14** is a rung between the blade road and the dodge junction.
- **SH-15** is a rung between the climb and the static road, so the Stair's middle is a loop.
- **SH-1** is a rung between the static road and the ridge: the Stair's top gets a second way to the Rooftops besides
  `walk.r1`.
- **SH-6** hangs from a new attribute node (1990,-370) off the dodge junction and reaches the dear road at `toBow.a`.
- **SH-2, SH-4, SH-9, SH-12** each bridge two existing roads.
- **Veiled Herald** stops being a dead end (SH-10 and SH-12 land on its notable). **Mercy Stroke** becomes a crossing
  (S2 below).

### 3.4 Crossings (each proposed for my side; the joining agent reconciles)

**Mystic–Shade.** Today four: `home.spoils.b`↔`spire.craft.toKnife.b`, `edge.thickBlood.n`↔`spire.craft.toAlleys.r2`,
`hex.wheel.n`↔`spire.craft.devotion.b`, `hex.toSpire.b`↔`spire.storm.roadS.a` (plus the ring). New:

| id  | kind | Shade side                                                   | lands on (Mystic side)                                                                                      | for                                                                                                                                                                                                  |
| --- | ---- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2  | near | `hex.climb.a` (1560,-2450)                                   | `spire.craft.toDevotion.a` (1280,-2535)                                                                     | The hexer's crossing: Hexwright for the Shade, Rotting Word and Second Curse for the Mystic. A second Scriptorium–Stair link, so the Stair's west is a loop. It replaces the ledger's SH-3 crossing. |
| M3  | near | `hex.toSpire.a` (1480,-3000)                                 | MY-10 (dagger spell + cast speed), wherever the Mystic agent puts it on the Gallery side (about 1250,-3050) | The dagger caster's third spell cluster; the Mystic caster's way to SH-1.                                                                                                                            |
| M4  | dear | `hex.powder.n`, through a new attribute node at (1700,-4000) | the Mystic's new north rim road, near Snare Line (about 1400,-4150)                                         | Traps and mines from either side (Black Powder and Snare Line), the far ES (MY-4) for Shade casters, cold (Shatter) toward Sleet.                                                                    |

That is 7 border links, plus the ring (and CE-1, the centre's). Two more were considered and dropped, both as
strength by the back door rather than choice:

- **The ledger's Spire gate–Knife Gate crossing** (`home.spoils.a` through a node at about 650,-1150 to
  `spire.home.roadE.a`). Measured on the sketch, the bare rung brings Warded Mind from 12 to 9 steps and Arcane Focus
  from 11 to 10 for the Shade start, Sharp Mind from 10 to 6, and Spoils from 10 to 6 for the Mystic start. The ledger
  had SH-13 sitting on it as the toll, but SH-13 moved (§1.2). If the joining agent wants an eighth link, it should
  land nearer the ring than the Spire's east road, or carry a cluster.
- **Quiet Knife's notable to `spire.craft.toKnife.a`.** It made Quiet Knife three steps cheaper for the Mystic's
  caster (10 from 13) and no shorter for any Shade build.

**For the joining agent:** today's `spoils.b`↔`toKnife.b` crossing puts Warded Mind 12 and Arcane Focus 11 steps from
the Shade start (the baseline audit), and the Shade's casters take them; that is part of why they live in the Mystic
today. This brief leaves that crossing alone. The Mystic's own moves (MY-m1, MY-m2) change what lies behind it. If the
Shade caster still takes the Scriptorium first after G3, re-landing it is the lever. A shorter crossing to the Spire
gate is not.

**Strider–Shade.** Today four: `home.softStep.b`↔`bow.bows.toKnife.a`, `home.toHedge.r1`↔`bow.bows.hedgeMagic.a`,
`snares.toBow.a`↔`bow.flight.toKnife.a`, `snares.toRicochet.r4`↔`bow.flight.ricochet.n`. New:

| id  | kind | Shade side                        | lands on (Strider side)                                       | for                                                                                                                                                                 |
| --- | ---- | --------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | near | SH-6's rung node (1990,-370)      | `bow.bows.toKnife.a` (1668,-30), as the Strider sketch offers | Fast claws with the Strider's dexterity next door (§5.4). It lands on the rung node, not on SH-6, because a link from SH-6 itself would run over the Longbow wheel. |
| S2  | near | `snares.mercy.n` (2714,114)       | `bow.flight.venom.a` (2588,350)                               | Mercy Stroke (crit multiplier) with Venom Fletching: the crit poison bow and the crit Shade with a bow. Mercy Stroke's pocket becomes a bridge.                     |
| S3  | near | `snares.toRicochet.r4` (2932,135) | ST-9, life and resistances (Strider sketch, 3420,400)         | Accepted from the Strider sketch: life for the Shade's south-east.                                                                                                  |
| S4  | dear | the east rim road's end           | the Strider's outer road's north end (3800,150)               | One rim highway from the Rooftops to the Fosse: the bow builds reach Quiet Shot, SH-12 and the rim poison; the Shade reaches ST-1, ST-6 and ST-9.                   |

Again 8, plus the ring. **Declined from the Strider sketch:**

- Its spoke from (3800,150) through (3720,-300) and (3580,-680) to `walk.r8`. It runs over SH-10's spot, 400 units
  inside the rim road, and does the same job.
- SH-15 landing on `bow.bows.road.jb3`. SH-15 moved north (§1.2), and ST-9 already brings life to the south-east border.

### 3.5 Cuts

None. The Shade grows into empty space, and none of its one-stops needs a link cut. Every new cluster adds a way in;
no area, wheel or run of clusters loses one (§3.5). The only cut to consider is the Mystic crossing above, which is
the joining agent's call.

### 3.6 Moves for layout

- `knife.hex.static.n` (Static Edge) moves from 2044,-2721 to about 2110,-2560, below the static road, so SH-1's link to
  `static.b` clears it. The notable stays a leaf.
- Sleet's pocket moves in, as in §3.1.

## 4. Existing clusters

- **Shroud** is re-lined (SH-r1): ES, avoid stun and ES recharge, without evasion.
- **Whetted Will** is raised to at least 3 units (SH-p1).
- **Thick Blood** gets two more life smalls (SH-s1).
- **Sleet, Whetted Will, Carrion Claws, Veiled Herald and Mercy Stroke** turn from dead-end pockets into bridges
  (§3.1 to §3.4). Their lines do not change.
- **Static Edge and Sleet move** (§3.6).
- **Kept as they are, after a look:**
  - Fine Point: its crit while dual wielding stays, since SH-9 is now 12 steps away.
  - Talon, Barbed Point, Trapper and Black Flock, Quiet Shot, Rotting Word and Sapper, Athame and Long Knives.
  - The five keystones and their spurs.
- **No removals.** Every Shade notable is on some archetype's plan or gave-up list today, except Whetted Will, which
  the re-price addresses.

## 5. Size

| what                                                                            |  nodes |
| ------------------------------------------------------------------------------- | -----: |
| 15 new clusters: ten of 4 nodes, four of 5 and SH-15 of 6 (the folded sections) |     66 |
| Thick Blood's two life smalls                                                   |      2 |
| east rim road (6; its end is the Strider's node)                                |      6 |
| north crossroad                                                                 |      2 |
| SH-6's rung node                                                                |      1 |
| M4's crossing node, the Shade's half                                            |      1 |
| **total new**                                                                   | **78** |

The Shade goes from 146 nodes to about **224** and from 28 notables to 43. The ledger had 97 new and 242 in all. The
difference is SH-5 (4), the section smalls folded into clusters (21 smalls became 8 extra cluster smalls) and the
dropped attack speed section. Roughly, the new supply is ES +13 units, life +12, spell damage +11, poison +9, dagger
+11, claws +5, evasion +6, dodge +4, curses and chaos +6, spell crit +4, cold attacks +5.

**It does not fit inside.** The inside takes eight clusters: SH-14, SH-4, SH-13, SH-2, SH-15, SH-1, SH-9 and SH-8. SH-6
and SH-12 go on the border band. SH-11 and SH-16 go in the Rooftops' inside, reached by the new crossroad. SH-3, SH-7
and SH-10 go on the new rim road.

**Room left for a second round:** the rim band north-east of the rim road (around 3600..4300, -2900..-2400), the
Docks' east toward the rim (3400..3900, -700..0), and the Mystic border pocket at about 650,-1100. That
is about three or four clusters.

## 6. The examples and the Shade's builds at 120 points

Steps are from the sketch model. G3's allocator replaces these with real plans.

**The classic caster (Mystic) coming east.** The Stair and the Rookery's north now hold ES rather than spell damage:

- Quiet Knife (13).
- SH-13, ES with mana (18), and SH-1, ES with spell dodge (19).
- MY-10 on the Gallery border.
- Rotting Word (14), which it does not want.

So the Stair is a fourth ES direction for the Mystic caster, about 8 to 10 points of road from its own Scriptorium. It
competes with the Cloister west, and it gives up the Mystic's east crit side to get there. Taking it adds no spell
damage beyond Quiet Knife's. **The strength sword build** never reaches the Shade.

**The Shade's own builds.** Each has three or more directions and cannot afford them all at 120 points:

- **Dagger caster.**
  - Choices:
    - (a) the Mystic's centre through Spoils (Arcane Focus 11, Warded Mind 12).
    - (b) the Stair's top: SH-1 (17), Static Edge, MY-10.
    - (c) the blade and the far north-east: SH-13 (12), Shroud, Athame (17), SH-11 (23), Ritual Blade (23).
    - (d) the east rim: SH-3 (21).
  - It gives up (b) and (d), or the far north-east. The far north-east alone is about 14 points of road and nodes for
    three spell notables.
- **Dagger crit.**
  - Choices:
    - Fine Point and the blade road near home.
    - The far north-east: Long Knives (17), SH-16 (22).
    - The south-east's crit: Mercy Stroke (11), SH-12 (16).
    - The north's life: Thick Blood (7), SH-15 (15).
    - The Strider's attack speed.
  - Life now lies north, away from its daggers, so it gives up either the north's life or the far daggers.
- **Claw poison.**
  - Talon (6), SH-6 (8) and Barbed Point (12) near.
  - Then the east rim's SH-7 (22) and Carrion Claws (21), 8 apart round the Rooftops, or the Strider's and the Reaver's
    poison through S2 and the dear road. Not both.
- **Curser.**
  - Four curse and chaos directions: Second Curse (10), Rotting Word (11), Hexwright through M2 (15), SH-2 south-east
    (15), SH-8 far north-east (20).
  - ES: SH-14 (8), SH-13 (12), SH-1 (17).
  - It cannot take all the curse clusters and the ES.
- **Dodge blades.** Dodge lies in four directions:
  - Nimble Gambit (8) and Soft Step, near.
  - Tumble (15), in the Docks.
  - SH-9 (17), east.
  - SH-10 (20), on the rim.
  - SH-1 and Spellslip, north.
- **Traps and mines.**
  - Trapper (12), Sapper (11), Black Powder (18), then Snare Line through M4, or Tripwire and ST-6 through the
    Strider.
  - ES at SH-14 (8), SH-13 (12) or SH-1 (17); evasion at SH-14 or SH-15.

## 7. Tensions said out loud (§13)

1. **Rim growth against the ledger's "fits inside" and the region's footprint** (§11.3 against §11.5). The inside
   cannot hold 15 clusters without cramming, so the Shade adds a rim road. It stays inside today's map circle and keeps
   every border where it is. The ledger's §8 item 5 said only the Mystic and the Strider grow outward. The Shade's
   room was always rim room, and this brief says so.
2. **Identity against "the blades region"** (§13.2, ledger §8 item 3). The weapon-named notables go from 8 of 28 to 11 of 43. Nine of the 15 new clusters name no weapon. SH-5 is dropped. Daggers keep four attack homes and three caster
   homes, apart, with different partners. Claws have three.
3. **Density near home against tension** (§11.3 "dense all the way out" against §1.1). The Alleys' hole is the one
   empty patch near the start. SH-14 fills it with the Shade's two defences at 8 steps, which every Shade build will
   take early. That lowers ES and evasion tension a little for the ES Shades (trap-mine, curser, dagger caster).
   I weighed varied defences near home (§4.5) and the no-moat rule above it, because the far ES sits in three other
   directions (SH-13, SH-1, Ritual Blade). §8 asks the user.
4. **Connections against trade-offs** (§13.1). Seven new border links, each named for a combination. None joins two
   clusters one build wants at one step.
5. **Bridges against dead ends** (§13.5). Five pockets become bridges. SH-11 stays a dead end on purpose, the far tip
   of the north-east. The keystone spurs are unchanged.
6. **Highways against filler** (§13.4). Every rim road node has a branch, and so does every crossroad node.
7. **Tension against strength by the back door.** Shade casters gain spell damage and ES at home where they used to
   cross into the Mystic. Their totals may rise a little. The point is that they now choose between Shade directions
   too.
8. **Life to the north.** Moving SH-15 north makes life a direction for attackers. It also makes the Stair richer for
   life casters. Life is generic (§5.3), so I accepted that.

## 8. Open questions (for the user, through the joining agent)

1. **SH-14 near home** (8 steps, evasion with ES): keep it there, or move it out? The alternative is the Rookery–Docks
   gap after moving Shroud, at about 12 steps.
2. **SH-5 dropped**: three claw clusters instead of four. Agreed?
3. **The east rim road**: the ledger expected the Shade to fit inside, and it does not. Is a rim road inside today's map
   circle acceptable?
4. **The Shade caster's Mystic crossing**: whether to cut it is for the joining agent and the Mystic agent (§3.4).

**Intent.** Nothing in this work felt like it was losing intent. One thing to watch in G3: the far north-east gathers
Athame, Long Knives, SH-8, SH-11, SH-16, Ritual Blade and Carrion Claws within about 8 steps of each other. It is a rich
far district at 17 to 23 steps, a fine late-game destination, but walks should check it does not become the Shade's
one endgame plan.

## 9. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Each Shade main want gets two or three Shade directions with different partners. Tension
  is weighed against density, defences and looks in §7, never over them.
- **§2 The reference.** Twin distances of 5 or more were measured for every ledger twin. No names are given; G3 names.
  The game is never named.
- **§3 Network.** Two new roads and five pockets turned into bridges add loops (§3.5, §3.6). Seven border links with the
  Mystic and eight with the Strider, each named (§3.7); below the reference's 10 to 13, and §3.4 says why the eighth
  Mystic link was dropped. The kinds used are near, dear and the ring (§3.8).
- **§4 Regions.**
  - No build-named areas (§4.2).
  - Defences after the brief: evasion, ES, life (three new directions), dodge, resistances (Snakeskin), stun
    avoidance (Shroud, Tumble), leech and mana (§4.5).
  - The Shade sells spell damage, crit, attack speed, mana and cold attacks in its own voice (§4.6).
- **§5 Specializations.**
  - Partners differ for every cluster, and twins are 5 or more apart (§5.1, §5.2).
  - Daggers and claws are concentrated with twins apart; curses, poison and dodge have their home here (§5.3).
  - Claws sit on the Strider border (SH-6) and daggers in a dexterity and intelligence region (§5.4).
  - The one-stops the ledger's spots made are broken (§5.5).
- **§6 Starts.** No new cluster within 7 steps of a start. The first points are unchanged.
- **§7 Roads.** The new roads are attribute nodes with clusters along their length. Attribute supply rises by ten
  road nodes (rim 6, crossroad 2, rung 1, M4 1), which G5 rechecks.
- **§8 Clusters.**
  - One stat per small, and every section uniform. Bridge clusters (SH-15, SH-12) carry one section each side (§8.2).
  - Notables at 3 to 5 units; Whetted Will is raised (§8.6).
  - Sections are folded (§8.7).
- **§9 Keystones.**
  - All five Shade keystones stay as dead-end spurs, 8 to 18 steps out.
  - SH-1 forks with Spellslip, SH-13 pulls toward Hollow Vessel and Shade Leech, and Shroud's recharge forks with Shade
    Leech.
- **§10 Vocabulary.**
  - Every line used exists in `lines.ts`: `weaponSpeed`, `weaponCritMulti`, `dualDamage`, `dodgeAttack`, `dodgeSpell`,
    `eleAttackOne`, `insightOnCrit`, `poisonFaster`, `esRecharge`, `curseEffect`, `chaosDot`, `damageVsCursed`.
  - One theme per cluster.
- **§11 Looks.**
  - The sketch has no crossing of an existing link (scratch check) and no cluster within 150 units of a node.
  - Shapes, tight clusters and angles are G3's, by §11.5.
  - Labels will need moving: the Stair's name sits under SH-15.
- **§12 Size.** About 224, an outcome. Room for three or four more clusters is named for round 2. No bot simulation.
- **§13 Tensions.** Eight said out loud in §7.
- **§14 Rejected ideas.**
  - No generation, and no build list as the basis.
  - No filler: s6 is dropped, and every road node has a branch.
  - No step-count reach measure: steps here are costs.
  - No new restrictive rule.
- **§15 Work.**
  - CONSTRAINTS read in full first.
  - The pictures are before and after.
  - No files were changed outside this folder; no commit and no git stash.
- **§16 Open.**
  - Border links go from 4 to 7 (Mystic) and 4 to 8 (Strider).
  - The Knife is no longer thin: 43 notables.
  - Insight's second home is SH-3.
  - The size is about 224 for the Shade.
