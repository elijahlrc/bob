# G3 round 1: the Shade (the Knife)

Done 2026-10-22 for phase G3 of [../../G-growth.md](../../G-growth.md), round 1 of about three. Briefs:
[../../G1-brief.md](../../G1-brief.md) (wins), [../../G1/shade.md](../../G1/shade.md), [../../G2/shade.md](../../G2/shade.md),
[../../G2/borders.md](../../G2/borders.md). [../../CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Only
`src/data/passives/knife/` changed (`edge.ts`, `hex.ts`, `venom.ts`, `roofs.ts`, `rim.ts`, `snares.ts`); nothing
registered, baked or committed; no git stash.

**Nodes: 155 → 179** (5 notables, 19 smalls: 17 in the new clusters, 2 on Thick Blood). Notables 28 → 33.

**Pictures** ([shade/](shade/)): `before.png` / `after.png` (whole network), `before-region.png` / `after-region.png`
(the Shade with ids), close-ups with every line: `close-raking.png` (Raking Hand), `close-stair.png` (Wiry Frame and the
moved Stair label), `close-rookery.png` (Hoarded Breath), `close-northeast.png` (Hasty Words, Glint, the moved Rooftops
label), `close-thickblood.png` (Thick Blood's chain).

## 1. Changes to existing notables (approved at stop 2)

| notable       | before                                     | after                                                 | units       | why                                                                                                     |
| ------------- | ------------------------------------------ | ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| Shroud        | 10% ES, 12% evasion, 20% avoid stun        | 10% ES, 20% avoid stun, 15% ES recharge rate          | 4.2 → 4.0   | SH-r1: the evasion-with-ES pairing goes to SH-14; recharge pulls against Shade Leech's slower recharge. |
| Whetted Will  | 20% physical spell damage, 10% duration    | 24% physical spell damage, 12% skill effect duration  | 2.7 → 3.2   | SH-p1 (§8.6).                                                                                           |
| Thick Blood   | chain: wheel `w2` → 1 life small → notable | chain: `w2` → 3 life smalls (`c`, `b`, `a`) → notable | (same)      | SH-s1: the chain reads as a cluster; a second life section. The link `wheel.w2` → `thickBlood.c`.       |
| Veiled Herald | 5% reservation, 13% evasion                | 5% reservation, 14% evasion                           | 2.97 → 3.07 | Not in the brief: the audit listed it under 3 units (§8.6); one point of evasion.                       |

Elemental Ward is the Vanguard's; nothing of the stop-3 exception touches the Shade. Static Edge and Sleet were moved in G2.

**A cost to say out loud (Thick Blood).** The two new life smalls sit on the route from the north road to the Stair foot,
so everything behind Thick Blood is two steps farther from the Shade start: Thick Blood 7 → 9, Second Curse 10 → 12,
Rotting Word and Sapper 11 → 12 (the venom junction's route now ties). The smalls are life, which nearly every Shade
build half-wants, so it is not bare tax, but it is distance. If round 2's walks show the curser paying for it, the fix is
to hang the two smalls as a pocket off Thick Blood's notable instead (open question 1).

## 2. Clusters added (5 of the brief's 15)

| ledger | notable (cluster id)                      | lines (units)                                        | smalls                                                          | hangs on (both ends)                                           | steps from the Shade start | twins (steps)                                                                     |
| ------ | ----------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------: | --------------------------------------------------------------------------------- |
| SH-6   | **Raking Hand** (`knife.edge.rake`)       | 20% claw damage, 10% attack speed with claws (2 + 2) | 2 × 10% claw damage (rung side), 1 × 5% attack speed with claws | `knife.edge.rung.a` → `knife.snares.toBow.a`: a bridge         |                          9 | Talon 8, Carrion Claws 19; 8 from the Strider start                               |
| SH-15  | **Wiry Frame** (`knife.hex.wiry`)         | 12% life, 15% evasion (2.4 + 1.5)                    | 3 × 5% life (climb side), 2 × 10% evasion (lightning side)      | `knife.hex.climb.a` → `knife.hex.static.a`: a bridge           |                         16 | Thick Blood 9, Hard Target (Strider) 20                                           |
| SH-13  | **Hoarded Breath** (`knife.venom.breath`) | 14% ES, 12% mana (2.8 + 1.5)                         | 2 × 5% ES (north junction side), 1 × 8% mana                    | `knife.venom.jN.a` → `knife.venom.j5.a`: a bridge              |                         15 | Shroud 5, Ritual Blade 14, Glass Skin (Mystic) 20; Shade Leech 6, Hollow Vessel 5 |
| SH-11  | **Hasty Words** (`knife.roofs.hasty`)     | 20% spell damage, 6% cast speed (2.5 + 1.5)          | 3 × 8% spell damage                                             | `knife.roofs.cross.c1`: a pocket, straight north (the far tip) |                         24 | Ritual Blade 9, Athame 10, Arcane Focus (Mystic) 18, Quiet Knife 25               |
| SH-3   | **Glint** (`knife.rim.glint`)             | 30% spell crit, 20% insight charge on crit (2 + 2)   | 3 × 15% spell crit                                              | `knife.rim.wall.s1`: a pocket, straight out to the rim         |                         23 | Athame 10, Flashes of Insight (Mystic) 17, Sharp Mind 25                          |

Every notable is 3.9 to 4.3 units; every section is one line; every small belongs to a notable. Names checked:
`npx vitest run src/data/ip.test.ts` passes, and each name greps to nothing in the reference tree.

**Why these five** (the instruction's order):

- **(a) the flattest main wants.** The user's caster example is spell damage and energy shield, and both were flat for every
  Shade caster at 120 (dagger caster spell damage 23 → 23, the curser's ES 32 → 32, traps' ES 26 → 28): Hasty Words
  (spell damage) and Hoarded Breath (ES). Life and evasion were flat for the dodger and thin for the region (Thick Blood
  alone): Wiry Frame. Claws were the flattest weapon (4 → 4 for the poison claw): Raking Hand.
- **(b) bare hang points left by G2.** `knife.edge.rung.a` (Raking Hand), `knife.roofs.cross.c1` (Hasty Words) and the
  seawall road's corner `knife.rim.wall.s1` (Glint; G2 said the first two seawall nodes were filler without SH-3).
- **(c) spread.** South-west by the Strider border (Raking Hand), the Stair (Wiry Frame), the Rookery's middle (Hoarded
  Breath), the far north-east (Hasty Words), the east rim (Glint): one in each part of the region, so the round tests the
  whole layout.

**SH-2 (spell damage against the cursed) was the sixth candidate and was not built**: its two ends (`walk.r9`,
`toRicochet.r1`) leave no clean angle at `walk.r9` (the straight line arrives 36° from the link to the trap wheel; any bend
puts it under 20° from Tumble's pocket at `r1`), and the alternative end (`toRicochet.r2`) would cross Tumble's link. It
needs a layout decision first (round 3, below).

## 3. Changed from the brief, and why

1. **Glint is a dead-end pocket off `wall.s1`, not a bridge across `s1`–`s2`.** As a bridge its two links left both road
   nodes about 45° from the road; straight out from the corner it makes `s1` a clean junction (fan 150°, 54°, −78°). `s2`
   stays a plain step between the corner and Sleet's bridge (one node, §7.3). Pockets that are dead ends are allowed (§3.5);
   the Shade has two new ones (Glint, Hasty Words; the brief already had Hasty Words as the far tip).
2. **Wiry Frame bends at its notable** (about 50°): on the straight line from the climb to `static.a` the link arrived at
   `static.a` 35° from the Spellslip junction's road. Turned, the evasion chain arrives 64° from it and 116° from the
   lightning small, and the climb's fan is −81°, −5°, 45°, 99°. The notable is the corner where its two sections meet.
3. **Hoarded Breath** sits at (2300, −1900), a little west of the brief's (2380, −1980), so its link to the point leaves `j5.a`
   38° from Hollow Vessel's spur (at the brief's spot it was 25°). `j5.a` now has six links (−138°, −100°, −59°, −30°, 56°,
   150°). The mana side's link out to the point is long (about 450 units), on purpose: the room goes on the link, not in the
   cluster (§11.5).
4. **Shade sizes:** the brief's SH-11 had 5 nodes (a fourth spell small); a pocket's smalls are one section, and three
   plus the notable reads tight, so 4.
5. **Labels moved** (all three were over notables, two of them since before G2): the Stair from (1610, −2580) to
   (1760, −2880), off Wiry Frame; the Alleys from (1858, −1025) to (1640, −1230), off Talon and Fine Point; the Rooftops from
   (3080, −2115) to (3150, −2350), off Athame and Long Knives. A scratch check (every label box against every notable,
   keystone, start and label of the whole tree) finds none for the Knife.
6. Veiled Herald's +1 evasion (above).

## 4. Deferred border links

None to lay: `G2/borders.md` §4 lists two with a Shade end, and both land on existing Shade road nodes from another
region's new cluster (MY-10 → `knife.hex.toSpire.a`, ST-9 → `knife.snares.toRicochet.r4`); the Mystic and Strider agents
write them with their clusters. No link across a region line was added, cut or re-aimed.

## 5. Ids

Added (24): `knife.edge.rake.{a,b,n,c}`, `knife.edge.thickBlood.{b,c}`, `knife.hex.wiry.{l3,l2,l1,n,e1,e2}`,
`knife.venom.breath.{e2,e1,n,m}`, `knife.roofs.hasty.{a,b,c,n}`, `knife.rim.glint.{a,b,c,n}`. None changed or removed. To register at the end of the round.

## 6. Checks

- **Geometry** (`geometry.ts --region shade --bends`): crossings 0, drawn over 0; whole tree also 0 and 0. Bends over 20°:
  11, none new (wheel corners, `walk.r9` 24°, `wall.s6` 27°, as in G2); `wall.s1`'s 84° corner is now a junction. The
  notable corners (Wiry Frame, Hoarded Breath) are not counted by the tool; reasons in §3.
- **Problems**: `buildAll` 0 (whole tree). `npx tsc --noEmit -p .` clean. Prettier clean on the Knife's files.
- **Audit** (`passives:audit -- shade`): problems 0; notables 3.0 to 5.0 units, none under 3 (Veiled Herald fixed). Ways in:
  every Knife area has three or more; Raking Hand, Wiry Frame and Hoarded Breath are bridges (two ways in each); Hasty Words
  and Glint are single pockets; the Rookery's north and the Stair's middle became loops.
- **Labels**: none of the Knife's over a notable or another label (the scratch check).

### The allocator (indicative: the other regions are mid-edit; their new notables, such as High Veil, Keen Verse, Composure, Piercing Word, appear in these plans)

Before = this round's start (G2 skeleton), after = now. Units at 120 → 160 points.

| archetype     | main stat     | before 120 → 160 | after 120 → 160 | new Shade notables taken (60 / 120) | gave up at 120 (≥ 2.5)                   |
| ------------- | ------------- | ---------------- | --------------- | ----------------------------------- | ---------------------------------------- |
| dagger-crit   | life          | 28.8 → 38.8      | 32.2 → 37.2     | — / Wiry Frame                      | Long Knives 3.5, Stout Heart 2.6         |
|               | crit          | 21.3 → 25.3      | 20.7 → 27.3     |                                     |                                          |
|               | dagger damage | 6.6 → 6.6        | 4 → 6.6         |                                     |                                          |
|               | evasion       | 26.8 → 31.1      | 29.1 → 32.5     |                                     |                                          |
| claw-poison   | life          | 32.2 → 43.2      | 33.2 → 48.6     | Raking Hand, Wiry Frame / same      | Carrion Claws 3.5, Stout Heart 2.6       |
|               | poison        | 15.3 → 16.7      | 16.3 → 17.7     |                                     |                                          |
|               | claw damage   | 4 → 7.6          | 8 → 11.6        |                                     |                                          |
| trap-mine     | trap and mine | 17.7 → 17.7      | 13.7 → 17.7     | — / Hoarded Breath, Wiry Frame      | High Veil 3.6, Hoarfrost 2.6             |
|               | energy shield | 24 → 27.6        | 31.6 → 41       |                                     |                                          |
|               | evasion       | 24.7 → 25.7      | 27 → 27         |                                     |                                          |
| dagger-caster | spell damage  | 23.3 → 23.3      | 32 → 39.8       | — / Hoarded Breath, Hasty Words     | Keen Verse 3.1, Sharp Mind 2.5 (Glint 2) |
|               | spell crit    | 7.3 → 8.9        | 2 → 15.4        |                                     |                                          |
|               | energy shield | 32.2 → 37.4      | 39 → 43.6       |                                     |                                          |
| curser        | curses        | 11 → 11          | 11 → 11         | Hoarded Breath / Hoarded Breath     | Hasty Words 4                            |
|               | chaos and DoT | 12.3 → 12.3      | 12.3 → 12.3     |                                     |                                          |
|               | energy shield | 32.2 → 32.2      | 40.6 → 48.6     |                                     |                                          |
| dodge-blades  | dodge         | 10.3 → 17        | 12.3 → 17       | — / Raking Hand, Wiry Frame         | Tumble 2.7, Stout Heart 2.6              |
|               | evasion       | 28.9 → 28.9      | 29.1 → 33.5     |                                     |                                          |
|               | life          | 29.8 → 30.8      | 32.2 → 37.2     |                                     |                                          |
|               | blade damage  | 8 → 14.2         | 12 → 12         |                                     |                                          |

Against the targets, these six: typical main-stat growth from 120 to 160 is 15% → 20%; main stats gaining 10% or less
50% → 25%; builds with no wanted notable (2.5+) in what 40 more points add 2 → 0 (typically 1 → 2); builds with one plan
at 120: 3 → 1; tax at 120 typically 39% → 38%.

What moved:

- **Spell damage and ES climb now** for the dagger caster (23 → 23 became 32 → 40; ES 32 → 37 became 39 → 44) and the
  curser's ES (32 → 32 became 41 → 49). Both took a Shade direction (Hoarded Breath; Hasty Words for the dagger caster).
- **Strength by the back door (G-growth §4), watch:** the dagger caster collects about 9 more units of spell damage and 7
  of ES at 120 than before, and the curser 8 more ES. Part of it is the Mystic's new clusters in the same plans (Composure,
  Piercing Word, High Veil); the Shade's share is Hasty Words (about 5.5 units with its smalls, at 24 steps) and Hoarded
  Breath (about 4.8, at 15). Both still climb with 40 more points, so it is choice, not saturation; Hoarded Breath at 15
  steps is the cheaper of the two and the one to watch if round 2's ES (SH-14 at about 8, SH-1) makes the curser's ES easy.
- **Claws** went from 4 to 8 at 120 (Raking Hand at 60) and still climb (Carrion Claws is the gave-up 3.5).
- **Life** is now a direction north: Wiry Frame is taken by four of the six (the claw build already at 60); life still
  climbs for all of them.
- **Still flat:** the curser's curses and chaos (11 → 11, 12 → 12: SH-8 is round 2's first cluster), the dagger attacker's
  dagger damage (4 → 6.6: SH-16 and SH-4 in round 2), trap-mine's evasion (27 → 27: SH-14, SH-15 is taken but its evasion
  is a partner line).
- **Shroud's evasion is gone until SH-14 lands**: the region's evasion supply is 1.2 units lower for one round.

### Walks (CONSTRAINTS §15.2), by hand on the map

**1. The main build: a dagger crit Shade, 20 points.** Crit (point 1), Keen Instinct (2), the blade road's three attack
speed (5), the wheel's west crit small (6), the dagger small (7), **Fine Point** (8). Then a real fork at the wheel:
Snakeskin through the fire spoke (10) and on to the dodge junction (12) for **Nimble Gambit** (15) or **Soft Step** by the
south road (15), or north round the wheel's claw small onto Thick Blood's life chain (life ×3, **Thick Blood** at 11). At 20 it has Fine Point, Snakeskin, one of Nimble Gambit / Soft Step, and either the other or part of Thick Blood.
_Chose:_ crit and dagger near home, one defence. _Gave up:_ life (Thick Blood or the far Wiry Frame, 16 from the start),
the keystone or the evasion pocket. _No-choice stretch:_ the blade road's three smalls, all wanted. _Nobody would take:_
none on this walk; Raking Hand is beside the dodge junction and this build walks past it (claws), as intended.

**2. An off-build: the curser, 20 points.** Evasion side (1), the north hub (2), the north road (4), the wheel's claw small
(5, tax), life ×3 (8), **Thick Blood** (9), the Stair foot (10), the curse small (11), **Second Curse** (12), the north
junction (13), ES ×2 (15), **Hoarded Breath** (16), then the barb road and the wheel's south node to **Rotting Word**
(19), Keen Instinct (20). _Chose:_ curses and the Shade's own ES. _Gave up:_ Quiet Knife (3 points off the north road),
Spoils, and the Mystic's Arcane Focus through the Spoils road (11). _No-choice stretch:_ the claw small and the three life
smalls before the Stair foot (two more than before this round, §1). _Nobody would take:_ none.

**3. A neighbour coming in: a Strider who picks up claws, 20 points.** The Strider start to `bow.bows.toKnife.a` and onto
the claw rung: **Raking Hand** at 8, **Soft Step** at 6 (the same Strider node), **Snakeskin** and **Longbow / Fleet Blade**
(its own wheel) at 8, **Talon** at 10 through the dodge junction. At 20 it takes Raking Hand, Talon and Soft Step, or swaps
Talon for Nimble Gambit (9) and Mercy Stroke (9, the crit poison crossing). _Chose:_ the Shade's two claw clusters for
the dexterity next door (§5.4). _Gave up:_ its own Longbow wheel and Hedge Magic. _No-choice stretch:_ none; the rung is
one attribute node. _Nobody would take:_ none.

**4. Late: the dagger caster, 120 points** (the allocator's best plan agrees with this outline). The home and the north
road: Keen Instinct, Quiet Knife (7), Thick Blood (9). Three directions for spell damage and ES, which it cannot all have:
(a) the Spoils road into the Mystic's centre (Arcane Focus 11, Glass Skin 15, Darting Bolts, Thunderhead, Quickening,
Hoarfrost); (b) the Shade's middle and north-east: Hoarded Breath (15), Shroud (12), Athame (17), Ritual Blade (23),
**Hasty Words** (24), about 14 points of road and smalls for the last three; (c) the east: **Glint** (23) and Sleet. The
best plan takes (a) and (b) and spends its last points in the Zealot (Homily, Glass Wall). _Gave up:_ Glint, Sharp Mind,
Keen Verse; the Stair's top (Static Edge, Spellslip). _No-choice stretch:_ the rooftop road from `walk.r2` to `r3` and
the crossroad (three attribute nodes) on the way to Hasty Words. _Nobody would take:_ **Glint** is on no plan; it is
the dagger caster's gave-up at 2 units (spell crit is a low weight for it), a dead end 23 steps out. It is insight's
second home by the ledger's design; if round 2's numbers still show nobody taking it, it should come in toward the
Rooftops (open question 2).

## 7. Plan for rounds 2 and 3

**Round 2** (in this order): **SH-8** (curse effect + chaos DoT, the Rooftops' inside off `ridge.y4` / `walk.r3`): the
curser is flat on everything it names. **SH-16** (dagger + dagger crit multi, `cross.c2` / Carrion Claws) and **SH-4**
(dagger + poison, `toBow.b` / `toRicochet.r2`): dagger damage is flat for the dagger attacker; one far, one south.
**SH-14** (evasion + ES, `home.roadB.c` / `edge.j1.a`): gives back the evasion Shroud lost; watch the curser's ES with it.
**SH-1** (ES + spell dodge, `static.b` / `ridge.y2`, beside Spellslip; the Stair label sits 15 units clear of its brief
spot and may need a nudge).

**Round 3:** **SH-10** (life + dodge, `wall.s6` / Veiled Herald), **SH-12** (cold attacks + crit, `toRicochet.r4` /
Veiled Herald), **SH-7** (poison + attack speed, `wall.s4` / `wall.s5`), **SH-9** (dual wield + dodge, `quietShot.a` /
`walk.r7`), and **SH-2** (spell damage + against the cursed), which first needs a layout decision: re-angle Tumble's pocket
off `toRicochet.r1` (it leaves due east, where SH-2 wants to arrive) or move `walk.r9`, so both ends get clean angles. Then
the Docks' south-east and east rim are filled in one pass, and the seawall road's `s2` can be reconsidered.

## 8. Open questions

1. **Thick Blood's two new smalls lengthen the Stair foot by two steps** (§1). Keep (life on the way), or hang them as a
   pocket off Thick Blood so the route stays as short?
2. **Glint** (23 steps, a dead end at the east rim) is on no plan. Keep it for round 2's numbers, or bring insight inward?
3. **The dagger caster's spell damage and ES both rose** at 120 (§6): with other regions' clusters in the same plans this
   round cannot say how much is the Shade's. Read again after round 2.

**Intent.** Nothing in this round felt like it was losing intent. Each cluster has a player's reason and a direction of its
own, and the two places where the brief's geometry would have meant ugly angles (Glint as a bridge, SH-2) were changed or
deferred rather than forced.

## 9. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** The five clusters split the flattest wants (spell damage, ES, life, claws) into new
  directions; the allocator shows them taken and still climbing. Tension was weighed against starts, defences and looks
  (Thick Blood's distance said out loud; SH-2 deferred for its angles).
- **§2 The reference.** Twins 5 or more apart; notables 3 to 5 units; names our own, checked by the ip test and a grep;
  the reference game is not named.
- **§3 A network.** Three new bridges (two new loops: the Rookery's north, the Stair's middle; Raking Hand joins the Alleys
  to the Docks' south); two single pockets. No border link changed; none deferred to the Shade.
- **§4 Regions.** Defences now: evasion, ES (three directions), life (two), dodge, resistances, stun avoidance, ES recharge.
  No build-named area; labels are place names.
- **§5 Specializations.** Claws: Talon (recovery), Raking Hand (speed), Carrion Claws (chaos), 8 and 19 apart, on the
  Strider side where dexterity is (§5.4). Spell damage: Quiet Knife (dagger, speed), Hasty Words (speed), far apart (25)
  and in different directions. ES: Shroud (stun, recharge), Hoarded Breath (mana), Ritual Blade (dagger spells). Life:
  Thick Blood, Wiry Frame (evasion). Convergence rule: no new cluster pairs spell damage with ES, or life with armour.
- **§6 Starts.** Unchanged; the nearest new notable is Raking Hand at 9 steps (8 from the Strider start); none within
  three steps names a weapon.
- **§7 Roads.** No road node added; the rung, the crossroad's first node and the seawall's corner each have a cluster off
  them now.
- **§8 Clusters.** Every small belongs to a notable; every section uniform; notables 3.9 to 4.3 units; Whetted Will and
  Veiled Herald raised to 3+.
- **§9 Keystones.** All five spurs unchanged, one link each. Hoarded Breath sits between Shade Leech (6) and Hollow
  Vessel (5) as a pull; Shroud's recharge forks with Shade Leech.
- **§10 Vocabulary.** Lines from `lines.ts` only (`weaponSpeed`, `esRecharge`, `mana`, `insightOnCrit`, `spellCrit`,
  `castSpeed`, `spellDamage`, `life`, `evasion`); `lines.ts` untouched; one theme per cluster.
- **§11 Looks.** 0 crossings, 0 drawn over; smalls 70 and 50–60 apart beside their notables; chains straight; junction
  fans clean (§3); three labels moved off notables.
- **§12 Size.** 155 → 179; no bot simulation (the allocator is a static tool).
- **§13 Tensions.** Density against tension (Hoarded Breath at 15 steps), bridges against dead ends (two pockets), shapes
  against the brief (Glint, Wiry Frame), all said in §3 and §6.
- **§14 Rejected ideas.** No generation (positions computed by a scratch script from hand-chosen ends and the §11.5
  spacings, then looked at); no filler; no step-count reach (steps are costs and twin distances); no spacing rule.
- **§15 How the work is done.** CONSTRAINTS and every brief read first; before/after pictures and close-ups; geometry after
  the batch; only the Knife's folder; no register, bake, commit or stash; ip test only.
- **§16 Open.** The Knife now has 33 notables; labels re-checked; attribute supply unchanged this round (no road nodes).
