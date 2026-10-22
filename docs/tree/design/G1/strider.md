# G1b. The Strider: growth brief

Written 2026-10-22 for phase G1b of [../G-growth.md](../G-growth.md), from the ledger ([../G1-ledger.md](../G1-ledger.md);
its §0, the user's answers, wins over its rows), the baseline ([../G0-baseline.md](../G0-baseline.md),
[../G0/builds.txt](../G0/builds.txt), [../G0/supply.md](../G0/supply.md)) and the region's area files
(`src/data/passives/bow/`). [../CONSTRAINTS.md](../CONSTRAINTS.md) wins over this brief wherever they disagree. No node is
written here: this is a plan for user stop 2, with a sketch.

Pictures (all in `strider/`):

- `today.png`, `today-text.png` (every node's lines), `today-east.png` (the east rim today, close up).
- `sketch.png`: the whole region with the plan drawn over it. Orange rings are new clusters (the label gives the id and
  the pairing), cyan lines are new road with their nodes spread evenly along them (the junctions sit at the corners),
  green lines are new links, red crosses are cut links, green text alone marks a re-line.
- `sketch-north.png` and `sketch-south.png`: the two busiest spots, close up.
- `sketch.json`: the sketch's source (`npm run passives:sketch -- strider/sketch.json out.png`).

The Strider is grown like any other region (CONSTRAINTS §15.9). Where this brief changes nodes the user placed in the
editor, it says so.

## 0. The region today, in one paragraph

147 nodes, 33 notables, 4 keystones, 23 road nodes. It is a ring of road (the arc: the bows road, the top road down to
the projectiles hub, the bleed road and the physical row) round a filled middle (the string, the Quick Hands loop, Hard
Target, the resist star Weathered), with pockets on both sides of the arc. Every notable is 2 to 16 steps from the start,
most 7 to 12. Its outer edge is a wall of pockets at radius 3,000 to 3,400 (Ricochet, Heavy Draw, Split Volley, Barbed
Arrows, Skewer, Quick Sip, Pitch Arrows); beyond it, from the Shade's Docks round to the Reaver's Fosse, the map is empty
out to radius 4,700, while every neighbour reaches 4,500 or more (the empty-space map, `G0/empty.png`). Borders: the ring
on each side, 4 direct links to the Shade, 6 to the Reaver, 4 of which land on one Reaver node (`yard.dual.j2.a`).

## 1. The wants that need competition

The three archetypes that start here, and the two that come through, from `G0/builds.txt` ("120 → 160" is what 40 more
points add to the best 120-point plan):

| build         | flat or nearly flat at 120                                                        | choice at 120 | what that says                                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------- | ------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bow-crit      | bow damage 29.8 → 32.4 (+9%); evasion 25.6 → 29.9 (+17%); life 29.2 → 34.2 (+17%) |             1 | The 60-point plan already holds Longbow, Steady Draw, Rapid Fire, Heavy Draw, Split Volley, Far Flight, Ricochet: nearly every bow and projectile notable of the region (Barbed Arrows and Skewer follow by 120). After that only crit climbs, and only because the Shade's Mercy Stroke and Quiet Shot lie past the border. |
| bow-elemental | evasion 26.6 → 30.9 (+16%); life 31.2 → 34.2 (+10%)                               |             1 | Elemental attacks still climb (10.4 → 14.4) because Pitch Arrows and the Reaver's lines are far. One plan, no rival.                                                                                                                                                                                                         |
| bow-poison    | poison 11 → 15.3 climbs, bow damage climbs, life climbs                           |             1 | It climbs only because its poison is in three regions; it has one plan, and Venom Fletching is the Strider's only poison.                                                                                                                                                                                                    |
| sword-str     | attack speed 18.6 → 20.6 (+11%)                                                   |             2 | It walks east for Hawk's Eye (9 steps from the Reaver start), Quick Hands (13), True Aim (15) and Fleet Blade (15) and has all the attack speed it wants by 120.                                                                                                                                                             |
| dual-wield    | evasion 27.1 → 27.1 (0%); dual wield 18 → 18 (0%)                                 |             2 | Its evasion is the Lists' and the Strider's south-west, all of it within reach.                                                                                                                                                                                                                                              |

The diagnosis is the ledger's, seen on the map: **the Strider's main stats (bow damage, evasion, life, crit) are all in
the one ring, 7 to 15 steps from the start, so a bow build takes the region by about 80 points and then has nowhere of
its own to go.** The fix is a second band of wanted clusters beyond today's edge, in different directions with
different partners, so that at 120 points a bow build picks a direction (north-east, middle, south) and leaves the other
two, with the crossings as a fourth choice. Nothing new goes within nine steps of the start (§6.2, §13.8).

Which new cluster splits which want:

- **Bow damage** (bow-crit flat): today Longbow (north, with bow speed), Rapid Fire (south-east, with projectiles and
  movement) and the Steady Draw keystone. After: **ST-1** (bow with bow crit, far north-east) and **ST-2** (bow with
  elemental attacks, far south). Four directions, four partners.
- **Evasion** (flat for dual-wield, +16 to 17% for the bows): **ST-3** (evasion with life regeneration, far middle) and
  **ST-7** (evasion with flask effect, south, out of Sentry Post), with the ledger's evasion sections folded into their
  smalls (below).
- **Life** (the bows +10 to 17%): **ST-9** (life with resistances, north-east corner, new), and life regeneration on ST-3.
- **Crit**: ST-1 and its crit chance chain.
- **Elemental attacks**: ST-2 and **ST-4** (lightning attacks with shock), apart from Elemental Fletching (home) and Pitch
  Arrows.
- **Poison** (bow-poison has one plan): **ST-10** (poison with bow damage over time, south, new).
- **Attack speed** for the dexterity attacker who wants charges: **ST-5** (fervour with attack speed), far out, so it adds
  a direction rather than more speed by home.
- **Traps and mines**: **ST-6**, the traps-or-mines wheel.

### The ledger's rows, judged on the map

| row   | ledger                                                        | verdict                                               | why, for players                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ST-1  | bow + bow crit, outer road                                    | **agree**                                             | The crit bow lost its own notable when the bow wheel's crit side became Fleet Blade; today its crit is Vital Aim (generic) and the Shade's. Placed on the north-east stretch, where the Shade's crit multiplier (Mercy Stroke) is a crossing away: the crit archer's direction.                                                                                                                                                                                                                                                                                                                  |
| ST-2  | bow + elemental attacks, "the outer road, its other end"      | **agree, placed south-middle rather than at the end** | At the very south end it would sit beside ST-4 (lightning), Pitch Arrows (fire) and Stormstruck (lightning, Reaver): every elemental bow notable in one corner, a one-stop. At the road's south-middle it is 9 steps from ST-4 and 10 from Pitch Arrows, so the elemental bow still chooses between the general cluster and its element's.                                                                                                                                                                                                                                                       |
| ST-3  | evasion + life regeneration, road middle                      | **agree**                                             | The evasive archer's recovery, far from Long Breath (life with regeneration, home) and Hard Target (evasion with life). Carries the ledger's evasion section ST-s1 as two more evasion smalls.                                                                                                                                                                                                                                                                                                                                                                                                   |
| ST-4  | lightning attacks + shock, where the road meets the Fosse     | **agree, moved up the road**                          | At the junction it would be 3 or 4 steps from Stormstruck, the same specialization; up the road it is 8. The Fosse crossing still joins them, so a lightning archer reaches both, with attack speed on one and shock on the other.                                                                                                                                                                                                                                                                                                                                                               |
| ST-5  | fervour + attack speed, the High Moor / Meadow inside         | **disagree on the place; agree on the pairing**       | Inside there is no room (90 empty cells, all slivers between links), and attack speed beside home is already the cheapest want the sword build takes from the Strider. Far out it is fervour's second home (Hot Blood is in the Lists, 15+ steps away) and a reason to walk the middle of the outer road. It carries the attack speed section ST-s4 as its smalls.                                                                                                                                                                                                                               |
| ST-6  | traps-or-mines wheel, the Hedgerows' north                    | **disagree on the place**                             | The Hedgerows' north is already the trap corridor: Tripwire sits on the near crossing (`bow.flight.toKnife.a` ↔ `knife.snares.toBow.a`) that leads in about six steps to the Shade's snare wheel and Trapper. A third trap cluster there would make one trap destination. Placed in the far north-east corner instead, by the dear crossing to the Shade's Rooftops: about 12 steps from Tripwire and 9 or more from Trapper, reachable by Shade trappers over the crossing. The Hedgerows ↔ Docks crossing the ledger wanted already exists (Tripwire to Trapper); no new link is needed there. |
| ST-7  | evasion + flask effect, Thicket to Ford near Plated Hide      | **agree**                                             | Placed as a bridge from Sentry Post out to the outer road: evasion smalls on the Sentry Post side (the ledger's ST-s2 evasion, which has no room inside), flask smalls on the road side. Plated Hide is 9 steps away, a loose pull (evasion it would turn into armour). Quick Sip, the other flask notable, is 8 away by road.                                                                                                                                                                                                                                                                   |
| ST-8  | dual wield + evasion, the Ford toward the Lists               | **reject**                                            | The Ford is where the Reaver's Twin Fangs wheel sits, and that wheel's two sides are exactly dual wield (Twin Fangs) and evasion (Weaving and the evasion smalls), 3 to 4 steps from any Ford spot. A notable that gives both would merge that wheel's choice next door (§8.3, §5.1). There is also no room: Sidestep, Hot Blood, Twin Fangs and the Plated Hide road fill the Ford. Dual wield keeps three homes and gains SH-9 (dodge) and RE-9 (leech); the dexterity duellist has Light Hand and Fleet Blade here.                                                                           |
| ST-s1 | evasion section between ST-1 and ST-3                         | folded                                                | Two more evasion smalls on ST-3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ST-s2 | evasion section, Meadow to High Moor                          | folded, moved                                         | No room inside, and more evasion beside home would lower tension. Its three smalls are ST-7's evasion side.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ST-s3 | life section, the Ford to ST-8                                | folded into ST-9                                      | ST-8 is rejected; the life goes to ST-9's smalls (five).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ST-s4 | attack speed section on the outer road                        | folded into ST-5                                      | ST-5's three smalls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ST-s5 | crit section, the Thicket to ST-1                             | folded into ST-1                                      | A chain of three crit chance smalls from ST-1 back to the road, making ST-1 a bridge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ST-r1 | re-line Round Shield: shield block + avoid stun with a shield | **agree**, plus its smalls                            | Its three themes (mana regeneration, area, shield) become one. The mana regeneration smalls round it then belong to no notable (§8.7), so they change too (§4 below).                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ST-p1 | Weathered to 3 units                                          | **agree**                                             | 12% all elemental resistances.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ST-p2 | Longbow and Far Flight to 5 units                             | **agree**                                             | Pricing (§8.6).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Two clusters beyond the ledger, and the constraint each answers

- **ST-9, life + all elemental resistances**, a bridge between the Shade's road into Ricochet
  (`knife.snares.toRicochet.r4`) and the outer road's north end. For players: the crit archer who walks out for ST-1 is
  the glass cannon of the region, and life is what both bow builds leave behind (+10 to 17%). Its partner is not Wayfarer's
  (evasion with resistances) nor Hard Target's (evasion with life). It is also the Shade's way onto the outer road, and
  the Shade's life is the thinnest of any region (6 units). Constraints: §4.5 (varied defences along the new road: without
  it the north stretch sells no life), §3.5 (a second way into the north end) and §3.7 (a crossing for a combination: the
  Shade's dodgers and trappers reach life and the outer road).
- **ST-10, poison + bow damage** (the bow damage line carries damage over time with a bow, which poison uses), a bridge
  from Pitch Arrows to the outer road. For players: bow-poison has one plan, and Venom Fletching is the only poison here,
  paired with chaos. Its twins: Venom Fletching (far north-east), Festering (10 steps, Reaver), SH-7 and SH-4 (Shade). It
  turns Pitch Arrows from a dead end into a pocket with two ways in, and gives the road's junction at J7 a branch.
  Constraints: §1.1 (a second poison direction with a different partner), §3.6 (Pitch Arrows becomes a bridge) and §7.3 (no
  stretch of road without a branch).

## 2. Where each goes

The room is the empty band beyond today's edge: radius 3,300 to 4,600, from angle 0° (the Shade border, east of the
centre) to about 75° (the Fosse). The inside has only slivers. So the region grows outward with a new road, not by
cramming, and keeps its borders with its neighbours where they are (§11.3, §11.5, §13.7).

**The outer road** (the ledger's "rim highway"): eight junctions at radius about 3,800, straight runs between them with
one road node in each (15 nodes), from the north-east corner to the Fosse. It joins the Shade's outer road (the
Rooftops) at its north end and the Reaver's (the Fosse) at its south end, so the east of the map gets one outer ring.
Junctions (tree units; the sketch draws the run, the brief fixes the corners):

| junction | at           | what leaves it                                            |
| -------- | ------------ | --------------------------------------------------------- |
| J1       | (3800, 150)  | the dear crossing north to the Rooftops; ST-9's road side |
| mid 1–2  | (3750, 485)  | ST-6 (outward)                                            |
| J2       | (3700, 820)  | the north spoke; ST-1 (outward)                           |
| J3       | (3480, 1480) | the middle spoke; ST-1's crit chain                       |
| mid 3–4  | (3315, 1790) | ST-5 (outward)                                            |
| J4       | (3150, 2100) | ST-3 (outward)                                            |
| J5       | (2720, 2640) | the south spoke; ST-2 (outward)                           |
| J6       | (2220, 3060) | ST-7 (inward, a bridge to Sentry Post)                    |
| mid 6–7  | (1950, 3225) | ST-4 (outward)                                            |
| J7       | (1680, 3390) | ST-10 (inward, a bridge to Pitch Arrows)                  |
| J8       | (1180, 3600) | the Fosse crossing to Stormstruck                         |

**The clusters** (rough centres; each is a notable with its smalls drawn tight round it, §11.5):

| id    | lead + partner                                    | centre       | hangs from                               | nodes | steps from the Strider start (estimate) | twins (steps)                                              |
| ----- | ------------------------------------------------- | ------------ | ---------------------------------------- | ----: | --------------------------------------: | ---------------------------------------------------------- |
| ST-9  | life + all elemental resistances                  | (3420, 400)  | bridge: Shade `toRicochet.r4` ↔ J1       |     6 |                                      16 | Long Breath far, Hard Target far, Wayfarer (res) far       |
| ST-6  | wheel: traps on one side, mines on the other      | (4150, 470)  | mid 1–2, entrance facing the road        |     6 |                                   17–20 | Tripwire ~12, Trapper ≥9, Sapper and Black Powder far      |
| ST-1  | bow damage + crit chance and multiplier with bows | (4060, 1020) | bridge: J2 ↔ (crit chain) ↔ J3           |     7 |                                      19 | Longbow ≥12, Rapid Fire ≥10, Vital Aim ≥12, Quiet Shot ≥10 |
| ST-5  | fervour charges + attack speed                    | (3720, 1960) | mid 3–4; joined to ST-3 by one road node |     4 |                                      20 | Hot Blood ≥15                                              |
| ST-3  | evasion + life regeneration                       | (3450, 2450) | J4; joined to ST-5                       |     6 |                                      21 | Hard Target ≥12, Wayfarer far, ST-7 ≥9                     |
| ST-2  | bow damage + elemental damage with attacks        | (3010, 2960) | J5                                       |     4 |                                      21 | Elemental Fletching far, ST-1 ≥10, ST-4 9, Pitch Arrows 10 |
| ST-7  | evasion + flask effect                            | (1850, 2830) | bridge: Sentry Post ↔ J6                 |     6 |                                      14 | Quick Sip 8, ST-3 ≥9                                       |
| ST-10 | poison + bow damage                               | (1560, 3080) | bridge: Pitch Arrows ↔ J7                |     4 |                                      14 | Festering 10, Venom Fletching far                          |
| ST-4  | lightning damage with attacks + shock             | (2110, 3520) | mid 6–7                                  |     4 |                                      21 | Stormstruck 8, ST-2 9                                      |

Six of the nine are bridges or joined (ST-9, ST-1, ST-7, ST-10, and ST-5 with ST-3); ST-2, ST-4 and the ST-6 wheel are
dead ends, which keeps a few far tips worth committing to (§3.6, §13.5).

**Is the ledger's outer road right?** Yes, with two changes. It should be a ring of its own with spokes back into the
region, not a path from the Docks to the Fosse with nothing joining it to the Strider between its ends: a 5,300-unit
road reachable only at its ends would be the "long path with few connections" of §3.5. And its north end should meet
the Shade's own outer road (the Rooftops), which already runs down the Shade's east rim, rather than end at the Docks.

## 3. The skeleton changes

### New road (all attribute nodes, §7.1)

- **The outer road**: 15 nodes (above). +7 dexterity in the middle, +6 dexterity / +6 intelligence on the two nodes
  nearest the Shade, +6 strength / +6 dexterity on the two nearest the Fosse (§7.4: the hybrid ends serve both
  neighbours' gear).
- **Three spokes**, each made by putting one road node into a link between two of today's edge pockets (§3.4: "a
  single road node between them is often better") and running one more node out to the road:
  - **X1** at (2972, 585), between Ricochet's small and Heavy Draw (cuts `bow.flight.ricochet.b` ↔
    `bow.steel.wheel.n2`), then the north spoke through (3330, 700) to J2. 2 nodes.
  - **X2** at (2790, 1610), between Barbed Arrows and Skewer's chain (cuts `bow.flight.wheel.n2` ↔
    `bow.quiver.skewer.a`), then the middle spoke through (3135, 1545) to J3. 2 nodes.
  - **X3** at (2670, 2045), between Skewer and Quick Sip (cuts `bow.quiver.skewer.n` ↔ `bow.quiver.quickSip.a`), then
    the south spoke through (2695, 2340) to J5. 2 nodes.
- **One road node** joining ST-5's tip to ST-3's tip, about (3640, 2260).

So the outer road has seven ways in: the dear crossing, ST-9 from the Shade, the three spokes, ST-7 from Sentry Post,
ST-10 from Pitch Arrows, and the Fosse crossing. No cut leaves anything with a single way in (§3.5): each cut link is
replaced by the same two pockets joined through the new road node, so every pocket keeps the ways in it had and gains one.

### Links to cut

| link                                            | why                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bow.flight.ricochet.b` ↔ `bow.steel.wheel.n2`  | X1 goes in between (the pair stays joined through it).                                                                                                                                                                                                                                                                |
| `bow.flight.wheel.n2` ↔ `bow.quiver.skewer.a`   | X2 goes in between.                                                                                                                                                                                                                                                                                                   |
| `bow.quiver.skewer.n` ↔ `bow.quiver.quickSip.a` | X3 goes in between.                                                                                                                                                                                                                                                                                                   |
| `bow.home.added.n414` ↔ `yard.dual.j2.a`        | Four Strider links land on that one Reaver node (the south hub's road `jt1`, the physical corner `hub.t`, Wayfarer's chain `n409` and Vital Aim's chain `n414`). They count as four crossings and are one. Vital Aim's crit chain still bridges to the resist star; `n414` stays as the pocket's tip (or is retired). |

### Crossings (§3.7; the border link counts are direct links, with the ring on top)

**Strider–Shade: 4 today → 8, plus the ring.**

| crossing                         | my side                          | lands on (Shade)                                                                                              | for                                                                                                                                                            | kind |
| -------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| the outer highway (new)          | J1 (3800, 150)                   | `knife.roofs.walk.r8` (3420, −1010), through two Shade-side road nodes at about (3720, −300) and (3580, −680) | bows to Quiet Shot; the cold archer to SH-12; the poison archer to SH-7; Shade trappers to ST-6. It passes 330 units east of Tumble and Veiled Herald.         | dear |
| ST-9 (new)                       | ST-9's life smalls               | `knife.snares.toRicochet.r4` (2932, 135)                                                                      | life for the Shade's dodgers; the Shade onto the outer road                                                                                                    | near |
| SH-6, the fast claw (ledger)     | `bow.bows.toKnife.a` (1668, −30) | SH-6, wherever the Shade places it                                                                            | claws on dexterity from the Strider (§5.4)                                                                                                                     | near |
| SH-15, life + evasion (ledger)   | `bow.bows.road.jb3` (1630, 240)  | SH-15                                                                                                         | the ledger's landing, Hard Target, is nine nodes inside the region and cannot be reached without crossing links; jb3 is the nearest junction on the Shade side | near |
| optional: Veiled Herald a bridge | J1                               | `knife.snares.herald.n` (3374, −211)                                                                          | evasion with reservation for the aura archer; the Shade agent decides                                                                                          | near |
| the four existing                | kept                             |                                                                                                               |                                                                                                                                                                |      |

**Strider–Reaver: 6 today (4 on one node) → 8, plus the ring.**

| crossing                          | my side                            | lands on (Reaver)                                                             | for                                                                                                                  | kind |
| --------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---- |
| the Fosse (new)                   | J8 (1180, 3600)                    | `yard.fosse.storm.n`, Stormstruck, which becomes a bridge from the Fosse road | lightning attacks either way: ST-4 with shock, Stormstruck with attack speed; the outer ring closes                  | dear |
| RE-1, the fast sword (ledger)     | `bow.steel.hub.t` (1070, 1760)     | RE-1                                                                          | the sword build's attack speed side: RE-1, then the Strider's string                                                 | near |
| the Ford: evasion and dodge (new) | `bow.steel.toBlood.a` (1040, 2020) | `yard.dual.sidestep.n` (900, 2020), or RE-6 if the Reaver places it here      | evasion and dodge either way; this is where the ledger's "RE-6 to the Meadow" can land (the Meadow itself is inside) | near |
| n414 ↔ j2.a                       | cut                                |                                                                               | (above)                                                                                                              |      |
| the other five existing           | kept                               |                                                                               |                                                                                                                      |      |

**The ring.** CE-2 (life regeneration and life on kill) on the south-east diagonal between `r7` and `r11` is the centre
agent's; nothing here touches the ring.

Each border lands at 8 direct links plus the ring, against 10 to 13 in the reference; the joining agent adds the
neighbours' own proposals (RE-6, RE-9, SH-6, SH-15 are theirs to place).

**For the joining agent: the Fosse corner is shared.** J7, J8 and ST-10 sit at 63° to 72° from the centre, the angles
where the Reaver's south-east rim begins (its nodes run from 65°). The Strider already lives there (Pitch Arrows at 69°,
Plated Hide and the dear road to the Yard's blood at 64° to 78°), so this is the existing border zone, not new ground
taken. But the ledger puts RE-3 (Pits to the Fosse, near Crimson Pact) and RE-8 (the Fosse rim, near Wound Dance) in
the same corner: place them with the outer road's south end and ST-10 together. Likewise the north end's dear crossing
runs through the Shade's south-east rim, beside Tumble and Veiled Herald, where the Shade may be building.

## 4. Existing clusters

| change                                                                | what                                                                                                                                                    | why                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Round Shield** (ST-r1; the user's editor node)                      | block with a shield + avoid stun with a shield; drop mana regeneration and area                                                                         | One theme (§10.2). It becomes the dexterity side's sword-and-board pull, 7 steps from the Strider start and about 14 from the Reaver's.                                                                                                                       |
| **The mana smalls round it** (the user's)                             | `n429` → shield block (Round Shield's side); `n433` → +all attributes (Wanderer's side); `n430` and `n431` → movement speed (the chain into Fleet Foot) | They belong to no notable once Round Shield loses its mana (§8.7), and supply.md flags Light Hand, Wanderer and Round Shield as close mana twins only because of them. Movement and attributes rather than evasion, so nothing beside home gets more evasion. |
| **Weathered** (ST-p1; the user's)                                     | 12% all elemental resistances (3 units)                                                                                                                 | §8.6.                                                                                                                                                                                                                                                         |
| **Longbow, Far Flight** (ST-p2)                                       | trim to 5 units                                                                                                                                         | §8.6.                                                                                                                                                                                                                                                         |
| **Pitch Arrows**                                                      | becomes a bridge through ST-10 to the outer road                                                                                                        | §3.6; it was a dead end at the region's far south.                                                                                                                                                                                                            |
| **Ricochet / Heavy Draw, Barbed Arrows / Skewer, Skewer / Quick Sip** | each pair stays joined, through a road node (X1, X2, X3)                                                                                                | Today these pockets join each other directly, so the outer edge is a wall of notables with no road to branch from. With a road node between them, the spokes leave from a road (§7.2), and walking from one to the other is no longer free of a choice.       |
| `n414` (the user's)                                                   | stays as the Vital Aim pocket's tip, or retired                                                                                                         | its link to the Reaver is cut (§3).                                                                                                                                                                                                                           |

**The one-stop shops in CONSTRAINTS §16.** The projectile notables along one rim were spread 7 to 11 apart in round 4,
and the Far Flight / Split Volley fork is gone (Far Flight now shares its wheel with Barbed Arrows). The outer band adds
no projectile notable, so they stay fixed. Close Quarters' spur is still a road (`closeQuarters.a` links Venom
Fletching), by the user's choice; with Venom Fletching reachable from the Shade's crossing and the Tripwire road, the
link could be cut to make the spur a dead end again. Left to the user (question 2).

**Not changed, after a look:** the Longbow / Fleet Blade wheel (bow or sword, a real fork); Hedge Magic (the hybrids'
spell entry); Clear Head (mana at home); the resist star; the bleed wheel; Hatchet Work and Thirsty Quiver; the start.
Wanderer and Hard Target both give life and evasion 7 steps from the start; that is the dexterity version of the pairs the
user named, but Wanderer's life is a minor line, so it is noted, not changed (question 4).

**Keystones.** All four stay where they are (Steady Draw 7 steps, Close Quarters 9, Plated Hide 9, Arrow Weave 11). The
outer road puts Close Quarters and Arrow Weave inside the region rather than on its rim (§2.5 measures keystones at the
rim), but moving one out to the new road would push it to 18 or more steps, beyond §16's working range, and every spur
stays a dead end off a junction. Question 1 asks whether one should move.

## 5. The size it reaches

| what                                                                          |  nodes |
| ----------------------------------------------------------------------------- | -----: |
| ST-1 (notable, 3 bow crit smalls, 3 crit chance smalls)                       |      7 |
| ST-2, ST-4, ST-5, ST-10 (notable and 3 smalls each)                           |     16 |
| ST-3 (notable and 5 evasion smalls), ST-7 (3 evasion, 2 flask), ST-9 (5 life) |     18 |
| ST-6 wheel (two notables, four smalls)                                        |      6 |
| **cluster nodes** (10 notables)                                               | **47** |
| outer road                                                                    |     15 |
| spokes (X1, X2, X3 and one node each)                                         |      6 |
| ST-5 to ST-3                                                                  |      1 |
| **road nodes**                                                                | **22** |
| **total new**                                                                 | **69** |

The Strider goes from 147 to about **216** nodes (the ledger: 213), 33 to 43 notables. The two Shade-side nodes of the
dear crossing are the Shade's. It fits: everything new lies between radius 3,000 and 4,250 in the Strider's own angle
(0° to 75°), in a band that is empty today, with every new cluster at least 300 units from any existing node. The band
between the old edge and the road in the north-east (radius 3,300 to 3,700, angles 5° to 20°) stays fairly open; that is
room for the ledger's second-round lever (more sections or third homes) if G3's measures ask for it, not filler to add
now.

Road share: 22 of 69 new nodes are road, a third, against about a fifth in the reference (§2.5). The outer road is long
because it closes the east of the map's outer ring; every junction on it has a branch, and no stretch runs more than
two road nodes without one (§7.3, §13.4).

## 6. The two examples

**The strength sword build comes east for attack speed.** Today it takes Hawk's Eye (9 steps from the Reaver start),
Quick Hands (13), True Aim (15) and Fleet Blade (15). This brief leaves those where they are, so the change it meets is
on the border and in its own region: RE-1 (the ledger's fast sword, in the Lists, landing on the Strider's physical
corner) is a sword-and-speed cluster about 9 steps from home. At 120 points its east side then holds, in different
directions from the Bow Gate:

- the string (Quick Hands, True Aim, Fleet Foot): about 7 points past Hawk's Eye for attack speed with movement and
  evasion;
- Fleet Blade, up the bows road on the bow wheel's sword side: about 6 points past the north hub, sword with evasion;
- Round Shield, now block and stun with a shield: about 5 points, for sword and board.

With the west (armour: RE-4, the Rampart) and the south (leech: RE-3, Red Harvest) also asking for its points, it can
take one or two of these, not all three. Nothing new here hands it armour (ledger §5: east is speed and
evasion, not armour).

**The classic caster** touches the Strider only at Hedge Magic (spell damage and cast speed, 4 steps from the Strider
start, reached from the Mystic through the Shade's road to it). No spell damage and no energy shield are added here, so
the caster's choices are unchanged by this brief.

**The bow builds at 120 points, after.** The inside of the region still costs about 60 points. With the other 60 a bow
build picks among: the north-east (the north spoke, ST-1, ST-9, ST-6: bow crit and life, about 16 points); the middle
(the middle spoke, ST-5, ST-3: speed and evasion with regeneration, about 15); the south (Sentry Post's bridge, ST-7,
ST-10, ST-4, ST-2: evasion with flasks, poison, lightning, the elemental bow, 20 or more); and the crossings (Mercy Stroke
and Quiet Shot in the Shade, Festering and Stormstruck in the Reaver, Scarred Hide and the Reaver's life). Two of those
fit, not four, and what 40 more points would buy is then a third direction's notables of 3.5 to 5 units: the gave-up
list target 3 asks for.

## 7. Tensions said out loud (§13)

1. **Tension against filler and tax (§13.4, target 5).** The outer road is 15 nodes long. Shortening it would leave the
   far clusters on spurs with one way in (§3.5). I weighed it toward the road, with a branch at every junction, joined
   at both ends to the neighbours' outer roads so it is a highway, not a cul-de-sac. A bow build's tax rises a little
   when it goes far out; that is the price of the late game, which is where §9.3 puts it.
2. **Connections against trade-offs (§13.1).** Seven ways onto the outer road. Each spoke goes through a new road node
   and a road, never straight from one wanted notable to another, and the spokes are 4 to 6 road steps apart along the
   road, so having one spoke does not hand over the next direction.
3. **Bridges against dead ends (§13.5).** Six bridges, three dead-end tips (ST-2, ST-4, the ST-6 wheel), and the four
   keystone spurs stay dead ends.
4. **Identity against spread (§13.2).** Bows stay concentrated in the Strider (home and two neighbours, as the ledger
   decided), but in four directions with four partners. Elemental attacks were kept out of one corner (ST-2 moved off
   the south end).
5. **Keystones at the rim against their step counts (§2.5, §9.1, §16).** Kept inside, at today's distances (question 1).
6. **A generic start against early direction (§13.8).** Nothing new within nine steps of the start; the re-lines inside
   move no main stat closer to it (the mana smalls become movement, attributes and shield, not evasion).
7. **Density against open space (§11.3, §11.5).** The far band is filled along the road and left open behind it in the
   north-east. I leaned to fewer, placed clusters over filling the band to the neighbours' density, since the size is to
   start near the ledger's (the user's answer) and room for a second round is worth keeping.
8. **The user's hand edits (§11.5, §15.9).** Round Shield, its mana smalls, Weathered and `n414` are the user's editor
   nodes; each change is for §10.2, §8.6, §8.7 or §3.7, and listed in §4.
9. **More road, more dexterity (§7.4).** 22 new attribute nodes at +7 push dexterity further over the gear (today 266
   to 299 at 120 points against 140 to 180 asked). That is G5's re-check, flagged here.

## 8. Open questions for the user

1. **Keystones and the new rim.** Close Quarters and Arrow Weave end up inside the region once the outer road exists.
   Leave them (today's 9 and 11 steps), or move one out to the new rim (about 18 steps)?
2. **Close Quarters' spur.** It is still a road through to Venom Fletching, by your choice in round 4. With the new
   roads, Venom Fletching has other ways in, so the spur could become a dead end again. Keep it as it is?
3. **The north-east band.** Between today's edge and the outer road in the north-east there is room left open. Leave it
   for a second round if the measures ask, or fill it now?
4. **Wanderer and Hard Target** both give life and evasion seven steps from the start. Leave them, or take the life off
   Wanderer (it would keep its attributes and evasion, with a little movement)?

Nothing in this work felt like it was losing intent. The one place to watch at G2 is the outer road's length: if, once
laid, it reads as a long empty arc in the picture, the fix is to pull it in toward today's edge and drop the middle
road nodes, not to add clusters to fill it.

## 9. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Each flat want of the Strider's builds gets supply in a new direction with a new partner
  (§1 above); tension is weighed against every other item, never alone (§7 above).
- **§2 The reference.** Used: twins at least 5 apart, roads straight with corners, keystones as dead-end spurs, 10 to 13
  border links as the direction. Nothing copied; no names given (G3 names; §2.4).
- **§3 A network.** The outer road is a ring with seven ways in (§3.5); six of nine new clusters are bridges (§3.6); every
  crossing is named for a combination, of all three non-ring kinds (§3.7, §3.8); the four links on one Reaver node are
  thinned.
- **§4 Regions and areas.** No area is named for a build; the new area names in G3 will be places (§4.2). Defences along
  the new band: life (ST-9), resistances (ST-9), evasion (ST-3, ST-7), regeneration (ST-3), flasks (ST-7), block and stun
  (Round Shield, inside) (§4.5). The region keeps selling the generics in its own voice: attack speed, crit, flasks,
  movement (§4.6).
- **§5 Specializations.** Every new cluster names its twins and partner, 8 or more steps from the nearest twin except
  where noted (§5.1, §5.2). Bows concentrated by design with four partners (§5.3). Weapon clusters here are bows, on
  dexterity (§5.4). Neighbours compete: no new cluster sits one step from another a build would want both of (§5.5).
- **§6 Starts.** The start and the Bow Gate are untouched; nothing new within nine steps (§6.2 to §6.5).
- **§7 Roads and attributes.** New road is attribute nodes (§7.1); every new cluster hangs off a road or bridges two
  (§7.2); no stretch of more than two road nodes without a branch (§7.3); hybrid values at the ends (§7.4); supply
  flagged for G5.
- **§8 Clusters and smalls.** One stat per small (§8.1); every section uniform, including the re-lined mana smalls
  (§8.2); the ST-6 wheel's sides are traps or mines, a build rarely takes both (§8.3); notables to be priced at 3 to 5
  units (§8.6); every new small belongs to a notable, the ledger's sections folded in (§8.7).
- **§9 Keystones.** All four kept as dead-end spurs at 7 to 11 steps; none moved (question 1). The late game is the outer
  road and its crossings (§9.3).
- **§10 Vocabulary.** New lines used: bow crit, fervour, flask effect, shock, lightning attacks, poison, traps, mines,
  resistances, regeneration; all in `lines.ts` today, so no engine work (§10.1, §10.3). One theme per cluster (§10.2).
- **§11 Looks.** Clusters to be drawn tight, chains straight, the road straight between junctions with corners at the
  junctions, the ST-6 wheel a regular hexagon facing the road (§11.5). The sketch has no crossing lines; G2 checks with
  `geometry.ts`. Area labels for the new band in G3 (§11.2, §11.4).
- **§12 Size.** 69 new nodes, region 216; size as an outcome, with two clusters beyond the ledger each tied to a
  constraint (§12.1, §12.2). The allocator is the yardstick, no bot sims (§12.4).
- **§13 Tensions.** Nine, said out loud in §7.
- **§14 Rejected ideas.** No generation; no build list as the basis (the archetypes only diagnose); no filler road (a
  branch at every junction); no delivery-category sections; no step-count reach (steps here are costs and twin
  distances); no restrictive new rule (the dexterity life-and-evasion pair is noted, not made a rule).
- **§15 How the work is done.** CONSTRAINTS read first; the region and its neighbours looked at in pictures
  (`today.png`, `today-east.png`) before placing; the sketch rendered and looked at; changes to the user's nodes listed.
- **§16 Open.** Size, border counts and the Strider's one-stop shops are addressed above; attribute values and keystone
  distances are left open as §16 has them.
