# G1b. The Reaver (the Yard): growth brief

**Joined (2026-10-22, [G1-brief.md](../G1-brief.md)):** Four crossings are dropped: Thirsting Blade–`wall.slams.j2.a` (the Vanguard's Second Wind link is kept), the west road's leg–`wall.grit.east.e7` (one node from the existing `e8` link; RE-7's wheel stays 8 steps from Greatblade), Festering–J8 (ST-10 and Festering stay 11 apart) and Sidestep–`toBlood.a` (it doubled RE-6's crossing). RE-6–`hub.t` and RE-1–`toBlood.c` are the landings. `sketch.json` here is corrected to match; the pictures in this folder show the brief before the join, and the joined pictures are in [joined/](joined/).

Written 2026-10-22 for phase G1b of [G-growth.md](../G-growth.md), from the ledger
([G1-ledger.md](../G1-ledger.md), §0 first), the baseline ([G0-baseline.md](../G0-baseline.md),
[G0/builds.txt](../G0/builds.txt)), the area files in `src/data/passives/yard/` and the pictures below.
[CONSTRAINTS.md](../CONSTRAINTS.md) wins over this brief wherever they differ. No node is written here.

Pictures (all in `reaver/`):

- `today.png`, `today-text.png` (every node's lines), `today-context.png` (the Yard with its two neighbours).
- `sketch.png`: the whole region with the plan drawn over today's network. Orange rings are new clusters, cyan lines
  and rings are new roads and their nodes, green lines are new links (crossings are labelled "X:"), red crosses are cut
  links, yellow discs are moved nodes.
- `sketch-muster.png`: close-up of the centre (the Muster, the Lists, the Practice Ground).
- `sketch-south.png`: close-up of the Pits and the Fosse.
- `sketch.json`: the sketch's data (`npm run passives:sketch -- docs/tree/design/G1/reaver/sketch.json out.png`).

Coordinates are tree units (the Reaver start is at (0, 1000); y grows southward). "Steps" are nodes bought from the
start, counted on today's network with a breadth-first walk; new clusters' steps are estimates.

---

## 0. What the map shows today

The Reaver is 151 nodes: 32 notables, 81 smalls, 34 road nodes, 3 keystones. Six areas: the Yard Gate (home), the
Practice Ground (west, on the Wall border), the Lists (east, on the Bow border), the Muster (centre), the Pits (south)
and the Fosse (the outer road on the south rim, round 4).

What the three Reaver archetypes do with it at 120 points (pictures in the G0 report, `G0/builds/`):

- **The sword build buys its armour in the Wall and its attack speed in the Bow.** Its best plan goes west round the
  ring to the Rampart (Oathbound 10 steps, Stone Heart 15, Mortar and Stone and Thick Skin 16) and east into the
  Meadow (Hawk's Eye 9, Quick Hands 13, True Aim 15, Fleet Blade 15). Inside the Yard it takes only the near clusters:
  Keen Edge, Light Blades, Guarded, Four Winds, Scarred Hide, then Red Harvest. The Yard holds 5.3 units of armour
  (Guarded, Scarred Hide) and no cluster led by attack speed (it appears only as a partner line on Quickened Steel, Light Blades, Thirsting Blade, Standard Bearer and Stormstruck): the "fast melee" class sells
  its speed through its neighbour.
- **The axe-bleed build** goes the same way west for armour and east for speed, and south only for Open Veins and
  Wound Dance. Bleed and axe still climb a little (22 → 25, 12 → 16 units).
- **The dual-wield build** lives in the Lists and the Strider: Twin Fangs, Weaving, Crossed Blades, then the Meadow and
  the Knife. Dual wield is flat at 18 → 18 and evasion at 27 → 27.
- **The south half of the Yard is used by almost nobody.** The Pits' east, the Fosse and its three pockets
  (Stormstruck, Ceaseless Blades, Marked Prey), Festering and Spellsword are 17 to 20 steps out with nothing a Reaver
  build wants on the way.

The skeleton (CONSTRAINTS §16 asks for its re-lay):

- **The Muster is a lattice.** Seven single road nodes join cluster to cluster: `toIronDraw`, `dual.toCrossed`,
  `blood.toCrossed`, `toHarvest`, `toSidestep`, `toStandard`, `toPits`. The Muster hub (-80, 2000) carries six links,
  four of them into notables' chains (Killing Pace, Light Blades, Iron Draw, Steel Rim). A build crossing the Yard
  passes through other builds' clusters, and the roads that should carry the clusters do not exist below the hubs.
- **The Shieldwall spur is still a through-route.** `shieldwall.c` has four links (b, d, Elemental Edge, Executioner):
  the road from the elements to the Executioner runs through the keystone's spur (§9.1; E-round2 flagged it).
- **Two keystones are over the working range:** Wound Dance and Crimson Pact are 19 steps out (§16 says 8 to 18), each
  behind a spur of three smalls where §9.1 says one or two.
- **The Fosse is under-hung.** Of its seven road nodes, f1, f4, f6 and f7 have nothing coming off them (§7.3), and it has
  two ways in (the Pits' east junction and Barrow Ward).
- **The Strider border is weaker than its count.** Six links, but four land on one node (the east gate,
  `yard.dual.j2.a`), so for a player it is three places, not six. The Vanguard border has six links at six places.
- **Thirsting Blade** is a dead-end pocket at the far west (19 steps) on a 380-unit link north from the road to
  Headsman.

Room ([G0/empty.png](../G0/empty.png)): the north of the Yard is full apart from small holes either side of the middle
road (4 to 6 steps out); the Practice Ground has an open cell between Hewing, Light Blades, Four Winds and Elemental
Edge; the Lists have almost none (the Strider's road into the Pits runs down the border at x ≈ 900 to 1000); **the big
room is the band between the Pits and the Fosse** (x -780 to 170, y 3220 to 3890) and the rim round the Fosse (south-west
(-1170..-670, 4100..4440), south (-390..0, 4220..4500), south-east (330..720, 4000..4330)).

## 1. The wants that need competition

For the archetypes that start in or pass through the Reaver (sword-str, axe-bleed, dual-wield start here; mace-shield,
dodge-blades, two-hand-fire, bow-poison and the bow builds pass through for Four Winds, Scarred Hide, Elemental Edge,
Fencer's Eye, Red Harvest, Iron Draw and Festering):

| want         | today (120 → 160 points)     | why it is too easy                                                                           | what splits it                                                                                              |
| ------------ | ---------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| sword damage | 29 → 32 units (flat)         | Keen Edge, Light Blades and Fencer's Eye are within 12 steps; that is all the sword there is | three new sword clusters with three partners in three directions (RE-1 east, RE-2 south-west, RE-3 south)   |
| armour       | 20 → 21 (flat)               | it all comes from the Rampart in one walk                                                    | RE-4 and a re-lined Guarded in the Yard's west; the Wall's own new armour (VA-1, VA-2, VA-3) further out    |
| attack speed | 19 → 21 (flat)               | bought in the Meadow, one destination                                                        | RE-5 near home (with warcries), RE-1 east (with swords), Thirsting Blade west (with leech), plus the Meadow |
| dual wield   | 18 → 18 (flat)               | Twin Fangs and Crossed Blades, both in the Lists, and nothing else                           | RE-9 south-west (with life, as one side of a wheel); the Strider's ST-8 and the Knife's SH-9 further out    |
| evasion      | 27 → 27 (flat)               | Weaving, Sidestep, Guarded and the Strider's, all taken                                      | RE-6 (evasion-led, with accuracy) on the Lists' outer side                                                  |
| bleed        | 22 → 25                      | Open Veins and the Wound Dance spur, with Hewing and Executioner                             | RE-8 (bleed with duration) far south by the keystone                                                        |
| life         | 33 to 43 → 47 to 53 (climbs) | already spread; it is the one want that still climbs                                         | nothing life-led is added; life comes as partners (RE-7, RE-9, Scarred Hide)                                |

### The ledger's rows for the Reaver, checked on the map

| row                                                     | verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RE-1 sword + attack speed with swords, east             | **Agree.** The fast sword where the speed is. Placed on the Lists' new east road, beside the Strider's road into the Pits, about 12 steps out (§2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| RE-2 sword + shield block, Practice Ground–Muster seam  | **Agree with the cluster, not the place.** The seam is three or four steps from Keen Edge and two from Steel Rim and Guarded: a sword-and-board player would find sword, block, armour and shield defences in one walk, the one-stop round 2 broke up. Block is already the Yard's biggest family (26 units). It goes to the south-west instead, off the road to Headsman, near the Shieldwall keystone (a pull: the block cap), 7 or more steps from Keen Edge and from Steel Rim.                                                                                                                                        |
| RE-3 sword + life leech, south near Crimson Pact        | **Agree.** Off the Fosse's second node, its far end on Festering's chain, beside Crimson Pact. Red Harvest is 6 to 7 steps away (≥ 5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| RE-4 armour + life regeneration, west                   | **Agree with the cluster; the ledger overstates the west.** The Wall's Quarry next door has no armour (Thunderstep, Unhurried, Standing Cairns, Bracing, Strongarm), so "RE-4 with the Quarry's armour" has nothing to meet. West is the armour side only as far as RE-4 and Guarded (about 9 units); more armour means the walk to the Rampart (16) or the Wall's new VA-1/VA-2. That walk is the price, and it is a fair one. Placed in the Practice Ground's open cell, between Light Blades and Elemental Edge, about 11 steps. Regeneration is recovery, not maximum life, so it does not break the convergence rule. |
| RE-5 warcry effect + attack speed                       | **Agree, with the lead flipped**: attack-speed-led (three attack speed smalls), warcry effect and a little speed on the notable. That folds RE-s4 into it. Warcries get their third home as a notable's line, not a cluster lead. Placed in the hole east of the middle road, about 6 steps out.                                                                                                                                                                                                                                                                                                                           |
| RE-6 evasion + accuracy, the Lists' outer side          | **Agree,** evasion-led (folds RE-s3). Placed between the east gate and the Strider's Ford hub, replacing today's long direct link between them: 5 or more steps from Weaving.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| RE-7 two-handed + life, Pits' west toward the Barrows   | **Agree,** as one side of a wheel with RE-9 (below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| RE-8 bleed + bleed duration, Fosse rim near Wound Dance | **Agree.** Between the new spine's south end and the Fosse's fifth node, beside the (shortened) Wound Dance spur.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| RE-9 dual wield + life leech, Pits' east                | **Disagree with the partner and the place.** With Red Harvest and RE-3 the Pits' east would hold three leech notables within a few steps: a leech one-stop for a dual-wielding sword build (§5.5). Instead: **dual wield + life**, as the other side of RE-7's wheel. Two-handed or two weapons is §8.3's own kind of real fork (variants of one theme a build rarely takes both of): the wheel is "the fighter without a shield", and the route through it takes one side.                                                                                                                                                |
| RE-s1 armour section                                    | **Folded** into RE-4's three armour smalls and a third armour small on Guarded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| RE-s2 life section                                      | **Dropped.** Life is the one Reaver want that already climbs (§2 of the ledger); the wheel and Scarred Hide carry life as partners. No constraint needs a notable-less life run here.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| RE-s3 evasion section                                   | **Folded** into RE-6's smalls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| RE-s4 attack speed section                              | **Folded** into RE-5's smalls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| RE-r1 Scarred Hide → life + life gained on block        | **Disagree with the partner.** Scarred Hide is the second side of the Steel Rim wheel, put there in round 2 as "what a fighter without a shield wears" to end the sword-and-board one-stop. Life on block would make both sides of the wheel shield notables, the fake choice §8.3 and §14 reject. Keep the ledger's reason (drop the armour: life with armour at 8 steps is the convergence the user named) and pair the life with **stun threshold** instead: life(10) + stun threshold(16), 4 units. Not physical damage reduction, which the allocator counts as armour.                                               |

## 2. Where each goes

Each with rough coordinates, how it is reached, its partner and its nearest twin.

| id    | cluster                                                                                                                         | at (tree units) | hangs from / bridges                                                                                        | steps (est.) | nearest twins                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------- |
| RE-5  | attack speed (3 smalls) + notable: attack speed, warcry effect                                                                  | (140, 1470)     | the middle road's first node ↔ the second-hand road's first node                                            | 6            | War Drums, Battle Hymn far                                    |
| RE-6  | evasion (3 smalls) + notable: evasion, accuracy                                                                                 | (880, 1640)     | the east gate ↔ the Strider's Ford hub (`bow.steel.hub.t`); a crossing                                      | 10           | Weaving 5, Sidestep 6+                                        |
| RE-4  | armour (3 smalls) + notable: armour, life regeneration                                                                          | (-640, 2420)    | Light Blades' south small ↔ Elemental Edge                                                                  | 11           | Guarded 6+, Barrow Ward far                                   |
| RE-1  | sword (3 smalls) + notable: sword damage, attack speed with swords                                                              | (790, 2580)     | the east road's second node ↔ the Strider's road (`bow.steel.toBlood.c`); a crossing                        | 12 to 13     | Keen Edge 12+, Fleet Blade far                                |
| RE-2  | sword (3 smalls) + notable: sword damage, block with a shield                                                                   | (-1270, 2990)   | the road to Headsman (`toHeadsman.r2`) ↔ the Wall's east road (`wall.grit.east.e6`); a crossing             | 13           | Keen Edge 7+, Steel Rim 8+                                    |
| RE-3  | sword (3 smalls) + notable: sword damage, life leech                                                                            | (610, 3620)     | the Fosse's second node ↔ Festering's chain                                                                 | 16           | Red Harvest 6, RE-1 8+                                        |
| wheel | RE-7: two-handed (2 smalls) + notable: two-handed damage, life · RE-9: dual wield (2 smalls) + notable: dual wield damage, life | (-760, 3610)    | on the west road's new leg from the Pits' west junction to the Fosse's sixth node: the route takes one side | 15           | Greatblade 7, Headsman far; Twin Fangs and Crossed Blades far |
| RE-8  | bleed (3 smalls) + notable: bleed damage, bleed duration                                                                        | (-270, 3800)    | the spine's last node ↔ the Fosse's fifth node                                                              | 19           | Open Veins 7+, Executioner 8+                                 |

All of it fills empty space inside the region. Nothing extends the rim: the band between the Pits and the Fosse holds the
south's new clusters, and the rim round the Fosse stays as the reserve for a second round (§5).

Every new cluster is two or more steps off its road and is a bridge between two places (§3.6), except RE-5 and RE-6,
whose bridges are their two road links.

## 3. The skeleton

### 3.1 Re-laying the Yard's centre: a grid of roads round the Muster

The Yard is a training ground, and its roads can read as one: **three north–south roads and two cross-roads**, each a
straight run of +6/+6 attribute nodes that turns at junctions, with the clusters hung in the cells between them. It
replaces the lattice of single road nodes and gives the Fosse two more ways in. All coordinates are rough; G2 lays the
nodes by §11.5.

| road                        | route                                                                                                                                                                                                | new road nodes                                | clusters hung off it                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **the west road**           | `home.roadW.b` (-510, 1580) → (-720, 1800) → `blades.j1` (-880, 1990) → (-950, 2230) → (-960, 2460) → `toHeadsman.r1` (-935, 2655) → (-900, 2890) → `blood.toWall` (-660, 3140)                      | 4                                             | Keen Edge, Guarded, Hewing, Elemental Edge, the Shieldwall spur, Executioner, RE-2 (off r2)    |
| **its leg to the Fosse**    | `blood.toWall` → (-760, 3400) → the wheel → (-780, 3860) → `fosse.road.f6`                                                                                                                           | 2                                             | the RE-7/RE-9 wheel (on it), Shield Bash (beside it)                                           |
| **the spine** (middle road) | the life road → `shield.hub` (-80, 2000) → (-40, 2240) → through the Steel Rim wheel → `shield.j1` (0, 2720) → `blood.toHarvest` (0, 2980) → (0, 3220) → (-20, 3520) → (-60, 3800) → `fosse.road.f4` | 4 (one at (0, 3220) shared with the rim road) | Four Winds, Steel Rim/Scarred Hide (on it), Open Veins, Red Harvest, Spellsword (moved), RE-8  |
| **the east road**           | `dual.j1` (640, 2080) → (640, 2330) → (620, 2580) → (540, 2850) → `blood.j2` (420, 3100)                                                                                                             | 3                                             | Hot Blood (moved east of it), RE-1, Crossed Blades, Red Harvest                                |
| **the crossroad**           | `blades.j1` (-880, 1990) → (-620, 2010) → (-350, 2010) → `shield.hub` → (180, 2030) → (420, 2060) → `dual.j1` (640, 2080)                                                                            | 4                                             | Killing Pace and Light Blades (above and below its west half), Iron Draw (below its east half) |
| **the Pits rim road**       | `blood.j3` (-420, 3100) → (-200, 3190) → (0, 3220) → (210, 3190) → `blood.j2` (420, 3100)                                                                                                            | 2 (plus the spine's shared node)              | Open Veins and Red Harvest above, Spellsword below                                             |

That is **19 new road nodes**, and **5 of today's single road nodes go** (`toIronDraw`, `dual.toCrossed`,
`blood.toCrossed`, `toSidestep`, `toStandard`): net +14. `toHarvest` becomes a spine node; `toPits` stays as Shield
Bash's second way in.

Notes for G2, which lays the nodes: the west road's first new node (-720, 1800) runs 30 to 40 units from Keen Edge's diamond, so Keen Edge shifts about 80 east or the node about 60 west (§11.5); and the east junction `dual.j1` would reach six links (Twin Fangs, Sidestep, Hot Blood, Iron Draw, the crossroad, the east road), the pattern the hub's cuts remove, so Sidestep or Iron Draw moves its link to the nearest road node.

Why a grid and not one more ring: every cell of it holds three or four clusters, so no stretch of road runs more than
two nodes without something coming off it (§7.3), the home's two hub roads simply continue as the west and east roads
(§7.2), and the spine is the middle road the user already made the Yard's spine (life smalls, then road). The Steel Rim
wheel stays _on_ the spine: the route down the middle takes one side, shield or hide, which is the wheel's choice
(§8.3, second kind).

### 3.2 Links to cut, and what each cut leaves

| cut                                                                                                 | why                                                                                                                        | ways in afterwards (§3.5)                                                                                                                                 |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `elementalEdge.n` – `shieldwall.c`, `shieldwall.c` – `executioner.a`                                | the keystone spur stops being a through-route (§9.1)                                                                       | Elemental Edge: Hewing, the road to Headsman, RE-4. Executioner: re-hung between the west road's (-900, 2890) node and `toWall`.                          |
| `shieldwall.c` – `shieldwall.d`                                                                     | the spur hangs one small off a junction (§9.1): the west road's (-900, 2890) node → d → keystone, both moved west          | Shieldwall's a–b–c become a block bridge from the Muster's west junction to the west road                                                                 |
| `executioner.n` – `toStandard`, `toStandard` – `standard.n` (node removed)                          | lattice                                                                                                                    | Standard Bearer: Fencer's Eye and `toWall`                                                                                                                |
| `steelRim.b` – `toIronDraw`, `toIronDraw` – `ironDraw.c` (node removed)                             | lattice                                                                                                                    | Iron Draw: the east junction and the crossroad. Steel Rim: the spine, the star's lightning spoke                                                          |
| `hotBlood.c` – `dual.toCrossed`, `dual.toCrossed` – `crossedBlades.a` (node removed)                | lattice; the east road replaces it                                                                                         | Crossed Blades: two east road nodes                                                                                                                       |
| `redHarvest.a` – `blood.toCrossed`, `blood.toCrossed` – `crossedBlades.b` (node removed)            | lattice                                                                                                                    | Red Harvest: the Muster's south junction, the east rim junction                                                                                           |
| `hotBlood.a` – `toSidestep`, `toSidestep` – `sidestep.n` (node removed)                             | lattice                                                                                                                    | Sidestep: Twin Fangs' east small, the east junction, and the new crossing to the Ford. Hot Blood: the east road, the Strider's road (today's near bridge) |
| `blood.j3` – `spellsword.a`, `spellsword.b` – `blood.j2`                                            | the rim road replaces the chain; Spellsword moves under it                                                                 | Spellsword: the spine's (-20, 3520) node and the Fosse's first node                                                                                       |
| `shield.hub` – `steelRim.a`, `hub` – `lightBlades.b`, `hub` – `killingPace.n`, `hub` – `ironDraw.c` | the hub keeps four roads and the star's fire spoke instead of six cluster links                                            | each of the four lands on the nearest crossroad or spine node instead                                                                                     |
| `home.roadS.b` – `fightingBreath.a` (re-made from `roadS.c`)                                        | RE-5's bridge from `roadS.a` would otherwise cross it                                                                      | Fighting Breath keeps two ways in                                                                                                                         |
| `dual.j2` – `bow.steel.hub.t`, `dual.j2` – `bow.home.added.n414`                                    | the east gate carries four of the six Strider links; these two are re-aimed (the Strider brief proposes the same two cuts) | the east gate keeps `jt1`, `n409`, Twin Fangs and RE-6                                                                                                    |

No area, wheel or run of clusters is left with one way in. The Fosse goes from two ways in to four (the Pits' east
junction, the spine, the west road's leg, Barrow Ward).

**Keystones and the south.** Wound Dance and Crimson Pact lose one small each (spurs of two, §9.1). With the new roads they come from 19 steps to about 15 (Wound Dance by the west road: hub, two road nodes, `j1`, three more, `toWall`, `j3`, two spur smalls; Crimson Pact by the east road to `j2`), and Shieldwall from 15 to about 12 (one small off the west road). All stay inside 8 to 18. The roads bring the whole Pits rim three or four steps closer, which is part of why the south now competes with the west and the east.

### 3.3 Crossings

Each named for the combination it serves. "Land on" is the node on the other side I propose; the joining agent
reconciles with the neighbour's brief.

**Vanguard (the Wall).** Today 6 links at 6 places. Proposed 9 or 10, plus the centre's arch CE-3 on the ring:

| Yard side                                                         | lands on                                                                                                                                               | serves                                                                                                                                       | kind |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| keep the six of today                                             | Wall slams junction, Bracing, the Wall's road to Guarded, Headsman, the Wall's east road, Barrow Ward                                                  | as today                                                                                                                                     |      |
| Thirsting Blade's notable (today a dead end)                      | `wall.slams.j2.a` (-1080, 2040), or a moved Cleaver if the Wall brief puts it in that patch                                                            | leech and attack speed for the Wall's slammers; the slams and totems for a two-handed Reaver; Thirsting Blade stops being a 19-step dead end | near |
| Cleaver's crossing (VA-m1, the ledger's "axes from either start") | the moved Cleaver, wherever the Wall brief places it in the Quarry's south-east; the Yard side is the west road's (-950, 2230) node or Thirsting Blade | axes from either start. **Condition:** Cleaver must stay 6 or more steps from Hewing, so it must not land on a node beside Hewing            | near |
| RE-2's far small                                                  | `wall.grit.east.e6` (-1200, 3160)                                                                                                                      | sword and board from either side: the Wall's shield builds reach a sword cluster, the Reaver's reach the Wall's shields (VA-2, Stone Ward)   | near |
| the west road's leg (-760, 3400)                                  | `wall.grit.east.e7` (-1010, 3190)                                                                                                                      | two-handers from either start: the RE-7/RE-9 wheel with Greatblade, Headsman and Heavy Hands (Greatblade stays 7 steps from RE-7)            | near |

**Strider (the Bow).** Today 6 links at 3 places. Proposed 9 links at 8 places, plus the centre's arch CE-2:

| Yard side                                                                                                                               | lands on                                                    | serves                                                                                                                                                                                                                                                         | kind |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| keep: the east gate ↔ `bow.steel.road.jt1` and ↔ `bow.steel.added.n409`; Hot Blood ↔ `toBlood.b`; the Pits' east junction ↔ `toBlood.e` | as today                                                    | as today: the near crossings from the Lists into the Bow's start-side clusters (Wayfarer, Weathered); the other two of the gate's four are re-aimed                                                                                                            |      |
| RE-6's far small                                                                                                                        | `bow.steel.hub.t` (1070, 1760), re-aimed from the east gate | evasion and accuracy either way (the ledger's "RE-6 to the Meadow"). The Strider brief proposes re-aiming the same link to `toSidestep`, which this brief removes; if the joining agent prefers Sidestep, it should land on `sidestep.n` and the next row goes | near |
| Sidestep's notable                                                                                                                      | `bow.steel.toBlood.a` (1040, 2020)                          | dodge for the evasive archer, the Ford's evasion for the kiting Reaver; and the landing for ST-8 (dual with evasion) if the Strider places it on the Ford's west, which keeps it 6+ from Crossed Blades                                                        | near |
| RE-1's far small                                                                                                                        | `bow.steel.toBlood.c` (890, 2700)                           | the fast sword and the Ford's speed (Thirsty Quiver, Hatchet Work, Sentry Post)                                                                                                                                                                                | near |
| Stormstruck's notable (today a dead end)                                                                                                | the end of the Strider's new outer road, about (1180, 3600) | lightning strikes either way (ST-4 with Stormstruck; ST-4 must stay 6+ from Stormstruck)                                                                                                                                                                       | dear |
| Festering's notable (today a dead end)                                                                                                  | the same end of the outer road                              | the poison bow and the poison sword                                                                                                                                                                                                                            | dear |

Both lists agree with the Strider brief's own draft on the outer road's two landings and the two east-gate cuts.

## 4. Existing clusters: moved, re-lined, re-hung

| change                                                                                                                                                                                                                        | reason                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scarred Hide re-lined**: life(10) + stun threshold(16), 4 units; armour and physical damage reduction dropped                                                                                                               | the convergence rule (life with armour, 8 steps from the start), keeping the wheel's no-shield side (§1, against RE-r1)                                           |
| **Guarded re-lined**: armour(20) + evasion(20), 3.7 units; life(5) dropped; a third armour small                                                                                                                              | the same rule (it is 9 steps out and paired life with armour); it becomes the Reaver's two-defence notable, armour and evasion, which only a str/dex region sells |
| **Hot Blood moved** about 150 east, between the east road and the Strider's road                                                                                                                                              | the east road runs where it sits; it keeps its near bridge to the Strider                                                                                         |
| **Spellsword moved** about 200 south-east, under the Pits rim road, bridging the spine and the Fosse's first node                                                                                                             | the spine runs where it sits; it hangs from f1, which had nothing                                                                                                 |
| **Shieldwall's spur** re-hung one small off the west road (keystone moved about 100 west)                                                                                                                                     | §9.1; the a–b–c block run becomes a bridge, uniform (§8.2)                                                                                                        |
| **Executioner** re-hung between the west road and `toWall`                                                                                                                                                                    | it lost its link through the keystone spur                                                                                                                        |
| **Killing Pace, Light Blades, Iron Draw** re-hung on the crossroad instead of the hub                                                                                                                                         | the lattice re-lay                                                                                                                                                |
| **Fighting Breath** entered from the middle road's third small instead of its second                                                                                                                                          | RE-5's bridge                                                                                                                                                     |
| **Wound Dance and Crimson Pact**: one spur small each removed                                                                                                                                                                 | §9.1 and the keystone distance (§16)                                                                                                                              |
| **Thirsting Blade** becomes a bridge (crossing to the Wall)                                                                                                                                                                   | a 19-step dead end on a long link                                                                                                                                 |
| **Not moved:** Keen Edge, Hewing, Light Blades' shape, the Twin Fangs wheel, the east gate, the home                                                                                                                          | the start and its first notables are good (§6); the east gate keeps two Strider links, its near crossings into the Bow's start side                               |
| **No removals.** Spellsword, Marked Prey and Ceaseless Blades are taken by few archetypes, but each serves a build the archetypes do not cover (the Reaver with a spell, the curse-on-hit attacker, the channelling attacker) | the ledger's §3.3 proposes none either                                                                                                                            |

## 5. The size it reaches

| kind           | count                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| new notables   | 9 (RE-1 to RE-9)                                                                                         |
| new smalls     | 25 (3 each on RE-1 to RE-6 and RE-8; 4 on the wheel) + 1 on Guarded − 2 from the keystone spurs = **24** |
| new road nodes | 19 − 5 removed = **14**                                                                                  |
| crossing nodes | 0: every proposed crossing is a direct link between nodes that exist or are proposed above               |
| **total**      | **about 47: the Reaver goes from 151 to about 198**                                                      |

The ledger had 58 (to 208). The difference is the user's rule on small sections (12 section smalls became 3 cluster
smalls in RE-4, Guarded's third, and the leads of RE-5 and RE-6; the life section is dropped), the two spur smalls, and
four more road nodes than the ledger counted for the re-lay. **It fits inside** the region without moving its borders.

Room left for a second round, if G3's numbers show a Reaver want still flat: the rim south-west of the Fosse
(-1170..-670, 4100..4440), south (-390..0, 4220..4500) and south-east (330..720, 4000..4330), and the cell east of the
Steel Rim wheel (170..390, 2330..2440). The first candidates there: a third axe cluster (axe is 12 → 16 today), more
evasion (the thinnest generic, ledger §6).

## 6. The two examples in the Reaver: what a 120-point sword build must choose between

The strength sword build (life, armour, sword damage, attack speed), after this brief. Steps are from the Reaver start.

- **West, the armour side.** Keen Edge (sword with accuracy, 7), Light Blades (one-handed, 8), Guarded (armour and
  evasion, 9), RE-4 (armour with regeneration, about 11). That is about 9 units of armour in the Yard. **More armour
  means the Rampart**: Stone Heart (15), Mortar and Stone and Thick Skin (16), about 12 more points for about 12 units,
  or the Wall's new VA-1/VA-2 further.
- **East, the speed side.** RE-5 (attack speed with warcries, about 6), RE-6 (evasion with accuracy, about 10), RE-1
  (sword with sword speed, about 12), then the Meadow: Hawk's Eye (9), Quick Hands (13), True Aim and Fleet Blade (15).
  Sword and speed, with evasion instead of armour.
- **South and south-west, the blood and the board.** Scarred Hide (life, 8), Four Winds (8), Fencer's Eye (sword crit,
  12), Red Harvest (14), RE-2 (sword with block, about 13, only if it holds a shield), RE-3 (sword with leech, about 16)
  and Crimson Pact (about 15).

Taking every wanted notable in all three costs, by rough count, about 85 points of wanted nodes plus 40 to 45 of road,
about 130: more than a run gives, before resistances and life. So at 120 points the plans are:

- **(a) West and the Rampart, plus the south's near half:** most of the armour, Keen Edge, Light Blades, Scarred Hide,
  Red Harvest. Gives up RE-1, RE-3 and most of the Meadow's speed.
- **(b) East and the Meadow, plus the south:** all the speed, three sword clusters (Keen Edge, RE-1, RE-3), leech.
  Armour only from Guarded and RE-4 if it detours west for them.
- **(c) West and east, skipping the south and the Rampart:** sword and speed with in-region armour, no leech and no
  RE-3.

What 40 more points buy at 120 is then the other side's sword cluster (3 sword smalls and a 4-unit notable), the
Rampart's armour or the Meadow's speed, which is target 3 (two notables of 2.5 units or more). At 60 points the build has
the home, Keen Edge or RE-5, and one direction. These are estimates on a network that does not exist yet; the allocator
checks them in G2 (the skeleton alone) and G3.

The classic caster does not pass through the Reaver.

## 7. Tensions said out loud (§13)

1. **Connections against trade-offs (§13.1).** The grid adds loops and lets a build cross the Yard without paying a
   notable of another kind. That lowers some tax (target 5) but removes some of the "fair price" of passing through
   (§5.5). I weighed it toward the roads, because §16 names the lattice as a defect and the price today falls on the
   wrong builds (a sword build pays Iron Draw to go east). The grid's cells still hold the choices; every road node has
   a cluster beside it.
2. **Highways against filler (§13.4) and tension by tax.** 19 road nodes. Each stretch has a cluster within one or two
   nodes; the longest bare run is the west road's two nodes between `j1` and `r1`, beside Hewing. If the allocator shows
   the Reaver builds' tax rising in G2, the first cut is the crossroad's west half (Light Blades and Killing Pace can
   stay the way across).
3. **Strength by the back door.** RE-5 puts attack speed 6 steps from the start, and the sword build's speed is a main
   want. It is priced like any cluster (3 smalls, a 4-unit notable whose warcry line the sword build barely values), and
   the Meadow's speed stays the larger supply. I accepted it because a "fast melee" class with no attack speed of its
   own breaks §4.6 (every region sells attack speed in its own voice).
4. **The ledger's convergence rule against the wheel's choice.** Settled for Scarred Hide by keeping the no-shield side
   and dropping only the armour (§1). The ledger's version would have traded one rule for another.
5. **Neighbours compete (§5.5) against a small east.** The Lists have little room: RE-1 sits two steps from Crossed
   Blades, which a dual-wielding sword build also wants. Different partners (sword speed, dual crit), and the dual-axe
   build does not want RE-1. Accepted, flagged for G3's walks.
6. **Region identity against many builds (§13.6).** The Yard gains three sword clusters (five sword notables in all,
   with Fencer's Eye and Light Blades). The guard is that each has a different partner and they sit in three directions
   7 to 12 steps apart, as the reference keeps its own class weapons.
7. **Keystones at the rim against footprint.** Shieldwall stays inside the region, on the Wall border, not at the rim.
   Moving it to the rim would put it 20+ steps out; I left it.
8. **Folding sections against supply.** Folding and dropping sections gives fewer smalls than the ledger; armour and
   evasion supply in the Yard still roughly doubles. If G3 shows evasion still flat, the rim reserve is the lever.

## 8. Checklist against CONSTRAINTS.md

- **§1 Purpose.** Every flat Reaver want gets supply in a second or third direction with a new partner; tension is
  weighed against the others in §7 (§1.1). No build list placed anything (§1.2).
- **§2 Reference.** `reference/tree/ref-tree.json` exists locally; I used the measured facts in §2.5 (roads of 1 to 3
  nodes, keystones one step off a junction, twins apart) rather than re-tracing the str/dex start, since this brief
  does not touch the start. No names given; naming waits for G3 (§2.4).
- **§3 Network.** The Fosse goes from two ways in to four; Thirsting Blade, Stormstruck and Festering stop being dead
  ends; every cut is checked for ways in (§3.5); new clusters are bridges (§3.6). Crossings: Vanguard 6 → 9 or 10 at as
  many places, Strider 6 at 3 places → 9 at 8, each named (§3.7, §3.8).
- **§4 Regions.** No build-named area; the band between the Pits and the Fosse will need a place name in G3 (§4.2).
  Defences in the Yard after: life, armour (RE-4, Guarded), evasion (RE-6, Weaving, Guarded), block, dodge, leech,
  resistances, stun threshold (Scarred Hide) (§4.5). It sells attack speed in its own voice now (§4.6).
- **§5 Specializations.** Sword in three new places with three partners, 7+ apart (§5.1, §5.2); the dual and two-handed
  sides of one wheel are a real fork; leech kept from becoming a south one-stop (RE-9 re-partnered). Weapons sit in the
  str/dex region (§5.4). Cleaver's crossing carries the twin condition.
- **§6 Starts.** The home is untouched; RE-5 is the nearest new cluster at 6 steps and names no weapon (§6.3, §6.5).
- **§7 Roads.** The lattice becomes six attribute roads with clusters along them (§7.1 to §7.3). Attribute supply rises
  with 14 more road nodes; G5 re-checks it (§7.4).
- **§8 Clusters.** One stat per small, uniform sections (the Shieldwall run becomes a uniform block bridge with no notable, which §9.1 needs: unhooking the spur leaves the run between the Muster and the west road, and §3.6 makes it a bridge) (§8.1, §8.2);
  the new wheel is two variants of one theme (§8.3); notables priced 3 to 5 units (§8.6); every new small belongs to a
  notable, and no notable-less run is added (§8.7).
- **§9 Keystones.** Spurs of one or two smalls, dead ends (§9.1); Wound Dance and Crimson Pact from 19 to about 15 steps, Shieldwall about 12; the
  120-point walk is in §6 (§9.3).
- **§10 Vocabulary.** Lines all exist in `lines.ts` (weaponSpeed, shieldBlock, leechLife, armour, lifeRegen, warcryEffect,
  evasion, accuracy, twoHandDamage, dualDamage, life, bleedDamage, bleedDuration, stunThreshold); one theme per cluster
  (§10.2).
- **§11 Looks.** Roads straight between junctions, the wheel regular, clusters to be laid tight in G2/G3 (§11.5).
  Labels to move: the Lists' and the Pits' names sit under the new east road and rim road (§11.2). Not checked:
  crossings in the sketch, which draws planned lines over today's network; `geometry.ts` runs in G2.
- **§12 Size.** About 47 new nodes, an outcome (§12.1); existing clusters moved and re-lined where they had to be
  (§12.2); no simulation run (§12.4; only the static allocator, on today's network).
- **§13 Tensions.** Eight in §7.
- **§14 Rejected ideas.** No generated layout, no build list, no filler roads (every road node has a cluster beside it),
  no step-count reach measure (steps here are costs), no fake fork, no new restrictive rule.
- **§15 Process.** Pictures before and after (§15.5); this brief is one of six, reconciled by the joining agent.
- **§16 Open items touched.** The Yard's lattice (re-laid); roads between regions (more crossings); keystone distances.

## 9. Open questions

1. **The grid.** Is a grid of roads the right picture for the Yard, or too regular? It reads as a parade ground to me
   and it fixes the lattice, but it is a structural idea, and the user should judge it from `sketch.png` before G2 lays
   it.
2. **Scarred Hide.** Life with stun threshold (this brief) or life with life on block (the ledger)? The second makes the
   Steel Rim wheel two shield notables again.
3. **RE-9's partner.** Dual wield with life, as the other side of the two-hander's wheel (this brief), or with leech in
   the Pits' east (the ledger)?
4. **Cleaver.** Where the Wall brief puts it decides the Yard's landing node; the condition is 6 or more steps from
   Hewing.
5. **The east gate.** Two of its four Strider links are re-aimed (RE-6 to the Ford hub, Sidestep to the Ford road). The
   other two are the user's and stay.

Nothing here felt like it was losing intent. The one place to watch is the Lists: RE-1 and RE-6 are pressed into a
narrow east, and G3 should look at them by eye before writing them.
