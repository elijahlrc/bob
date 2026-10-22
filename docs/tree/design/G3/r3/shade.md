# G3 round 3: the Shade (the Knife)

Done 2026-10-22 for phase G3 of [../../G-growth.md](../../G-growth.md), round 3 of three (the last round of new
clusters). Starting list: the round-2 report's plan ([../r2/shade.md](../r2/shade.md) §7) and the user's decisions after
round 2 (Grey Cloak stays at 16 steps; CONSTRAINTS §8.3's new item; §4.8; area labels ignored).
[../../CONSTRAINTS.md](../../CONSTRAINTS.md) wins over everything. Only `src/data/passives/knife/` changed (`rim.ts`,
`roofs.ts`, `snares.ts`); nothing registered, baked or committed; no git stash; no label touched.

**Nodes: 200 → 227** (6 notables, 21 smalls). Notables 38 → 44.

**Pictures** ([shade/](shade/)): `before.png` / `after.png` (the region), `before-ids.png` / `after-ids.png`,
`before-se.png` / `after-se.png` (the Docks, the seawall and the Strider border, with ids), and close-ups with every
line: `close-docks-east.png` (Feint and Cut, Cold Steel, Sea Legs, Rat Bite), `close-salt.png` (Salt in the Wound),
`close-grudge.png` (Long Grudge).

## 1. Changes to existing clusters

No existing node moved, no line changed, nothing removed. Four existing nodes gained a cluster:

| node                                                                   | before                                  | after                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Veiled Herald** (`snares.herald.n`)                                  | a dead-end pocket off the Ricochet road | a bridge: Sea Legs leaves its notable for the seawall                                                                                                                                           |
| **Tumble** (`snares.tumble.n`)                                         | a bridge (Grey Cloak, round 2)          | a junction of three: Cold Steel leaves east for the seawall                                                                                                                                     |
| `knife.rim.wall.s2`                                                    | a plain step with nothing off it (G2)   | Long Grudge's pocket leaves it (§7.3)                                                                                                                                                           |
| `knife.rim.wall.s5`, `.s6`, `walk.r6`, `walk.r8`, `snares.quietShot.a` | road nodes / a small                    | junctions: s5 a cross (Cold Steel, Rat Bite), s6 (Sea Legs; its 27° bend is gone), r6 a cross (Sleet, Salt in the Wound), r8 four links (Feint and Cut), the Quiet Shot small four links (Salt) |

Only `why` texts of those nodes and clusters were updated to say what now leaves them.

## 2. Clusters added

| ledger                            | notable (cluster id)                       | lead + partner, lines (units)                                   | smalls                                                                          | hangs on (both ends)                                               | steps from the Shade start | twins (steps, notable to notable)                                                                     |
| --------------------------------- | ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------: | ----------------------------------------------------------------------------------------------------- |
| SH-9                              | **Feint and Cut** (`knife.rim.feint`)      | 20% damage while dual wielding, 6% attack dodge (2 + 2 = 4)     | 2 × 10% dual wield (rooftop side), 2 × 3% attack dodge (seawall side)           | `roofs.walk.r8` → `rim.wall.s4`: the top rung of the Docks' east   |                         18 | Tumble 9, Sea Legs 8 (dodge); Fine Point 13 (dual crit), Long Knives 8; the Yard's Twin Fangs 24      |
| SH-12 (+ SH-s7)                   | **Cold Steel** (`knife.snares.frost`)      | 24% cold damage with attacks, 30% crit chance (2 + 2 = 4)       | 2 × 15% crit (Tumble side), 2 × 12% cold with attacks (seawall side)            | `snares.tumble.n` → `rim.wall.s5`: the middle rung                 |                         18 | Sleet 6 (cold spells), Mercy Stroke 14, Fine Point 13; the Cathedral's Rimed Steel 42                 |
| SH-10                             | **Sea Legs** (`knife.snares.legs`)         | 12% life, 6% attack dodge (2.4 + 2 = 4.4)                       | 2 × 3% attack dodge (Veiled Herald side), 2 × 5% life (seawall side)            | `snares.herald.n` → `rim.wall.s6`: the bottom rung                 |                         20 | Tumble 10, Feint and Cut 8 (dodge); Thick Blood 14, Wiry Frame 18 (life); the Strider's Hardy Stock 7 |
| SH-7                              | **Rat Bite** (`knife.rim.rot`)             | 20% poison damage, 10% attack speed (1.7 + 2 = 3.7)             | 3 × poisons 10% faster                                                          | `rim.wall.s5`: a dead-end pocket straight out to the rim           |                         25 | Barbed Point 16, Smeared Edge 16, Carrion Claws 14, Venom Fletching 15                                |
| SH-2 (+ SH-s5)                    | **Salt in the Wound** (`knife.roofs.salt`) | 16% spell damage, 16% damage against cursed enemies (2 + 2 = 4) | 2 × 8% against the cursed (Quiet Shot side), 2 × 8% spell damage (rooftop side) | `snares.quietShot.a` → `roofs.walk.r6`: a bridge below Cruel Agony |                         18 | Second Curse 12, Ill Wish 9, Long Grudge 9 (curses); Hasty Words 13, Quiet Knife 18 (spell); Athame 7 |
| none (beyond the brief, §3 below) | **Long Grudge** (`knife.rim.grudge`)       | 16% curse effect, 6% reduced mana reservation (2 + 2 = 4)       | 2 × 8% curse effect                                                             | `rim.wall.s2`: a dead-end pocket straight out to the rim           |                         23 | Ill Wish 10, Salt in the Wound 9, Hexwright 14, Second Curse 18                                       |

Every notable is 3.7 to 4.4 units, every section one line, every small belongs to its notable. Names checked: the ip
test passes, each name greps to nothing in the reference tree, and each is the only node of that name in the network.

**Where the smalls face** (the Ill Wish rule of round 2: the build that comes in from a side pays for the smalls it
does not want): Salt in the Wound's cursed smalls face the point, where the dagger caster comes in (it pays for the curse
it does not cast); Sea Legs' dodge smalls face Veiled Herald, where the Strider's bow builds arrive from Ricochet and
Hardy Stock (a first version had life on that side, and the allocator showed the Strider's bows taking Sea Legs for
cheap life at 80 points; flipped, they take it at 120 to 140); Cold Steel's crit faces the Docks and its cold the
seawall, so the Shade crit attacker and the Strider's cold archer each find their half first and pay for the other's to
reach the notable.

### The Docks' east as a ladder

The ground between the rooftop road's south end and the seawall (x 3400 to 4250) was the largest empty patch inside
the Knife. It is now three rungs from the Knife's side to the seawall, each a cluster, plus a pocket to the rim:
Feint and Cut on top (offence and dodge), Cold Steel in the middle (offence), Sea Legs at the bottom (defence), Rat Bite
outward (offence). With Grey Cloak, Tumble and Veiled Herald (defence) on the west side, the corner mixes offence and
defence (§4.8): three defence notables and four offence. The seawall had three ways in (the rooftop road, Sleet, Whetted
Will) and the Strider's road; it now has six. The rungs are 270 to 360 units apart, each straight from its west end to
its notable; Feint and Cut and Sea Legs turn at the notable (47° and 26°) so their seawall side arrives in the middle of
the road node's free gap (s4: 57°, 52°, 58°, 103°; s6: 63° and 90° either side). The fifth node is a cross.

## 3. Changed from the brief, and why

1. **SH-2 (Salt in the Wound) went to the ground below Cruel Agony, after a first try in the Docks' east.** Built first
   as the middle rung from Tumble to the seawall (south-east, as round 2 proposed), it was on **no** caster's plan even at
   160 points: the curser and the dagger caster never walk the Docks (their 120 plans are the Stair, the Rookery, the
   Mystic and the Zealot). A cluster nobody would weigh is filler. Off the Quiet Shot small, which the dagger caster
   takes by point 60, it is a real choice: the curser takes it at 60, the dagger caster lists it as gave-up at 120.
   It is still away from the north-east spell and curse clusters (Hasty Words 13, Ill Wish 9) and from the Stair. The
   middle rung went to Cold Steel.
2. **SH-9 (Feint and Cut) moved from the brief's spot** (`quietShot.a` → `walk.r7`) to the top rung of the Docks' east:
   its ground went to Salt in the Wound, and the brief's end at `walk.r7` would have run the bridge along the existing
   `quietShot.a`–`walk.r8` link. It stays far from Fine Point (13) and Nimble Gambit (16), the one-stop the brief moved it
   away from.
3. **SH-12 (Cold Steel) is not on the Ricochet road beside Veiled Herald.** Hardy Stock (ST-9) now leaves `toRicochet.r4`
   east, and Veiled Herald would have had three arrivals (its own chain, SH-12, SH-10), two of them at a near-miss angle.
   On Tumble's notable it sits among the south-east's defences, which round 2 asked of it.
4. **SH-7 (Rat Bite) is a pocket outward off `wall.s5`, not a bridge between `s4` and `s5`.** As a bridge its two links
   would leave both road nodes about 45° from the road (Glint's case in round 1); outward, `s5` becomes a clean cross. It
   is a far tip on purpose (25 steps), a dead end like Glint and Hasty Words.
5. **SH-10 (Sea Legs)** is as briefed (`wall.s6` → Veiled Herald), the notable turned to clear `s6`'s fan.
6. **Long Grudge is new, beyond the brief** (the user's allowance to add for a constraint: CONSTRAINTS §1.1). See §4.
   It also gives `wall.s2` a branch (§7.3, the G2 report's note).

## 4. The flat specializations (the instruction's list)

| specialization (build)       | after round 2 (120 → 160) | now (120 → 160)    | what was done, and why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| curses (curser)              | 15 → 15                   | 19 → 23 (+21%)     | **Salt in the Wound and one more cluster, Long Grudge.** With Salt in, the curser took all its curse supply by point 60 again (19 → 19). Long Grudge is far supply: the east rim, 23 steps, the one direction the curser's curses did not go, with a partner it does not want (reservation, the curse-aura builder's), so it pays half a notable for it. The curser takes it at 80 and 100, gives it up at 120 for the Mystic's shield and spells, and takes it again at 160. Not skill duration as the partner: hexes last a fixed time in the sim, so a duration line on a curse cluster may be dead (§10.3). |
| spell damage (dagger caster) | 46.5 → 49.8 (+7%)         | 46.5 → 52.5 (+13%) | Salt in the Wound: the Shade's spell damage off the north-east. Gave-up at 120 (with High Veil, Hedge Magic, Cold Light, Glint). Most of this build's spell damage is the Mystic's and the Zealot's; the Shade's own share is unchanged at 120.                                                                                                                                                                                                                                                                                                                                                                 |
| traps and mines (trap-mine)  | 13.7 → 13.7               | 13.7 → 13.7        | **No Shade cluster.** The Strider's round 3 lays ST-6, the traps-or-mines wheel, on `bow.rim.road.m12`, three steps past `wall.s6` and `j1` (not yet in the tree when this was measured). A Shade trap or mine cluster in the south-east would be a step from it (one destination); in the north it would sit with Sapper and Black Powder. The Spire's Snare Line also stays untaken: the trap build's flatness is reach as much as supply. Re-measure after ST-6.                                                                                                                                             |
| blade damage (dodge-blades)  | 15 → 15                   | 15 → 15            | **No cluster.** The dodger weighs daggers and claws at 0.8 and passes Long Knives, Between Ribs, Carrion Claws and Smeared Edge, all untaken even at 160: its last points go to dodge (14.3 → 20.3, +42%) and life (28 → 41, +44%), which Feint and Cut and Sea Legs now supply. That is the build choosing, not missing supply.                                                                                                                                                                                                                                                                                |
| evasion (dodge-blades)       | 35.5 → 38.8 (+9%)         | 34.3 → 38.8 (+13%) | **No cluster.** Evasion is the Strider's (16 units) and the Shade's (Keen Instinct, Soft Step, Snakeskin, Wiry Frame, Grey Cloak, Veiled Herald); a further evasion cluster beside the Shade's dodge in the south-east would make that corner the dodger's one stop. Its two other mains now climb.                                                                                                                                                                                                                                                                                                             |

## 5. Deferred border links

None due: `G2/borders.md` §4 lists two with a Shade end, MY-10 → `knife.hex.toSpire.a` (the Mystic's, laid: Sharp Tongue)
and ST-9 → `knife.snares.toRicochet.r4` (the Strider's, laid: Hardy Stock). Neither lands on a cluster added here. No
link across a region line was added, cut or re-aimed.

## 6. Ids

Added (27): `knife.rim.feint.{w2,w1,n,g1,g2}`, `knife.rim.rot.{a,b,c,n}`, `knife.rim.grudge.{a,b,n}`,
`knife.snares.frost.{k2,k1,n,c1,c2}`, `knife.snares.legs.{d2,d1,n,l1,l2}`, `knife.roofs.salt.{c2,c1,n,p1,p2}`. To
register at the end of the round. None changed or removed.

## 7. Checks

- **Geometry** (`geometry.ts --region shade --bends`): crossings 0, drawn over 0. Bends over 20°: 9, all wheel corners
  (was 10: `wall.s6`'s 27° bend is gone, it is a junction now). Notable corners the tool skips: Feint and Cut 47° and
  Sea Legs 26° (§2), Veiled Herald 8° (its chain on into Sea Legs).
- **Problems**: `buildAll` 0 (whole tree, at the time of the check). `npx tsc --noEmit -p .` clean. Prettier on the
  Knife's files.
- **Audit** (`passives:audit -- shade`): problems 0; 227 nodes; every Shade notable 3.0 to 5.0 units (lowest Bloodletter
  3.0, highest Second Curse 5.0; the new ones 3.7 to 4.4). Ways in: every Knife area has three or more (the Seawall now
  seven). Veiled Herald stopped being a dead end. New dead ends: Rat Bite and Long Grudge (far tips off the seawall, like
  Glint). Dead-end pockets in the region now: Hasty Words, Glint, Long Grudge, Rat Bite, Quiet Knife, Static Edge, Second
  Curse, Bloodletter, Thick Blood's life pocket, and the five keystone spurs.
- **Names**: `npx vitest run src/data/ip.test.ts` passes (it scans every string of the source modules under `src/data`, the area files included, against the reference deny list and gem and unique names, so the new names were tested unbaked); each name greps to nothing in `reference/tree/ref-tree.json`.

### The allocator (indicative: other regions are mid-edit; the Strider's ST-6 was not in yet)

Units at 120 → 160 points: G0 | round 2 | now.

| archetype     | main stat     | G0          | round 2     | now         | new Shade notables taken (60 / 120)     | gave up at 120 (≥ 2.5)                                      |
| ------------- | ------------- | ----------- | ----------- | ----------- | --------------------------------------- | ----------------------------------------------------------- |
| dagger-crit   | life          | 27.8 → 30.8 | 32.2 → 32.2 | 24.4 → 42.6 | — / Cold Steel, Feint and Cut, Sea Legs | Wiry Frame 3.9, Between Ribs 2.8                            |
|               | crit          | 25.3 → 30.3 | 18.6 → 31.3 | 26.3 → 27.3 |                                         |                                                             |
|               | dagger damage | 6.6 → 6.6   | 7 → 13.2    | 9.6 → 13.2  |                                         |                                                             |
|               | evasion       | 26.8 → 31.1 | 31.6 → 36.6 | 33.2 → 38.8 |                                         |                                                             |
| claw-poison   | life          | 32.2 → 38.8 | 32.2 → 39.2 | 29.2 → 40.6 | — / Sea Legs, Rat Bite                  | Wiry Frame 3.9, Carrion Claws 3.5                           |
|               | poison        | 15.3 → 16.7 | 16.3 → 20.2 | 15.2 → 21.8 |                                         |                                                             |
|               | claw damage   | 4 → 7.6     | 8 → 11.6    | 8 → 11.6    |                                         |                                                             |
| trap-mine     | trap and mine | 13.7 → 17.7 | 13.7 → 13.7 | 13.7 → 13.7 | — / —                                   | High Veil 3.6, Hoarded Breath 2.8                           |
|               | energy shield | 25.6 → 27.6 | 31 → 47.4   | 31 → 49.4   |                                         |                                                             |
|               | evasion       | 24.7 → 25.7 | 33.3 → 33.3 | 33.3 → 33.3 |                                         |                                                             |
| dagger-caster | spell damage  | 23.3 → 23.3 | 41 → 44.3   | 46.5 → 52.5 | — / — (Salt in the Wound at 140)        | High Veil 3.6, Hedge Magic 3.5, Cold Light 3.3              |
|               | spell crit    | 8.9 → 8.9   | 8.5 → 15.4  | 5.2 → 15.2  |                                         |                                                             |
|               | energy shield | 33 → 36.6   | 36.4 → 43.4 | 35.4 → 43.4 |                                         |                                                             |
| curser        | curses        | 11 → 17     | 15 → 15     | 19 → 23     | Salt in the Wound / Salt in the Wound   | High Veil 3.6, Vespers 3, Piercing Word 2.5 (Long Grudge 2) |
|               | chaos and DoT | 12.3 → 12.3 | 14.7 → 16.3 | 14.7 → 16.3 |                                         |                                                             |
|               | energy shield | 32.2 → 32.2 | 43.4 → 53   | 39 → 50     |                                         |                                                             |
| dodge-blades  | dodge         | 10.3 → 17   | 12.3 → 17   | 14.3 → 20.3 | — / Cold Steel, Sea Legs                | Wiry Frame 3.9, Feint and Cut 3.2, Spellslip 3              |
|               | evasion       | 28.9 → 28.9 | 35.5 → 38.8 | 34.3 → 38.8 |                                         |                                                             |
|               | life          | 29.8 → 30.8 | 26 → 40.2   | 28.2 → 40.6 |                                         |                                                             |
|               | blade damage  | 8 → 14.2    | 15 → 15     | 15 → 15     |                                         |                                                             |

The whole-tree run (27 archetypes, others mid-edit): typical main-stat growth from 120 to 160 is 23% (round 2: 19%);
main stats gaining 10% or less 20% (round 2: 32%); builds with no wanted notable in their gave-up list 0; one plan at
120: 3; tax typically 31%. For the six Shade builds alone: 28%, 20%, 0, 0 and 36%.

What moved:

- **Curses, poison, dodge and the dagger caster's spell damage climb now.** The curser's curses 15 → 15 became 19 → 23;
  the claw build's poison 20 at 160 became 21.8 (Rat Bite at 120); the dodger's dodge 12 → 17 became 14 → 20.
- **Life became a choice of direction for the attackers.** Sea Legs (south-east) is taken by the dagger, claw and dodge
  builds at 100 to 120, and Wiry Frame (the Stair, north) is now every one of their gave-up lists: north life or
  south-east life, not both. Their life at 120 fell a little (they spend on offence) and climbs strongly to 160.
- **Strength by the back door: checked.** No Shade main stat collects much more at 120 than in round 2. The new notables
  enter plans at 100 points or later, except Salt in the Wound for the curser (at 60, its fourth curse direction). The
  Strider's bows take Sea Legs at 120 to 140; their life at 120 against round 2: crit bow 32.2 → 32.2, poison bow 39.6 → 40.6, elemental bow 34.2 → 35: small.
  Strength from gear: attribute totals unchanged (no road node added).
- **Still flat:** trap and mine damage (waits for ST-6); the dodger's blade damage (by its own weights, §4); the dagger
  crit build's crit went from climbing (18.6 → 31.3) to flat (26.3 → 27.3): it now takes Cold Steel's crit at 120, and
  its 160 points go to life. Its crit-multiplier notable Between Ribs is gave-up but not counted in its "crit" family
  (`weaponCritMulti:dagger` is outside `critChance`, `critMulti`, `weaponCrit:dagger`), so the measure understates it.
- **Choice**: no Shade build has one plan at 120 (round 2: the curser had one).

### Walks (CONSTRAINTS §15.2), by hand on the map

**1. The main build: a dagger crit Shade, 20 points.** As in round 2, nothing of this round is within 17 steps, so the
first 20 points are unchanged: crit side (1), Keen Instinct (2), the blade road's three attack speed (5), the wheel's
crit entrance (6), the dagger small (7), **Fine Point** (8); the fork at the dodge junction (9): **Snakeskin** (11),
the chaos spoke and the dear road to **Smeared Edge** (16), the **Nimble Gambit** spur (19). _Chose:_ dagger and crit
near home, one defence, the poison dagger south. _Gave up:_ life (Thick Blood north, or the south-east's Sea Legs at 20),
Mercy Stroke. _No-choice stretch:_ the blade road's three smalls, all wanted. _Nobody would take:_ none. Its next 20
points are the round's question: Cold Steel's crit and Feint and Cut's dual wield east (18 each, on the same Docks road
as Tumble and Sea Legs), or Long Knives north-east (17), or life north (Wiry Frame 16).

**2. An off-build: the curser, 20 points.** Evasion side (1), the north hub (2), the north road (4), the wheel's claw
small (5), life (6), **Thick Blood** (7), the Stair foot (8), the curse small (9), **Second Curse** (10), the north
junction (11), shield twice (13), **Hoarded Breath** (14), its mana small (15), the point (16), then either the wheel
south to **Rotting Word** by the barb road (round 2's walk), or east: Quiet Shot's notable (17, a bow notable it does
not want), its small (18), the two cursed smalls (20); **Salt in the Wound** is point 21. _Chose:_ curses and the
Shade's shield, then chaos spells (Rotting Word) or the fourth curse (Salt). _Gave up:_ one of those two, Ill Wish and
Shifting Ward (21 and 18), the Spire's Hexwright. _No-choice stretch:_ the claw small; on the Salt road, Quiet Shot's
notable and small (two points of tax). _Nobody would take:_ none.

**3. A neighbour coming in: a poison bow Strider, 20 points.** Its start, Hawk's Eye, then the crit poison crossing:
**Venom Fletching** and **Mercy Stroke** (9 each), **Smeared Edge** (11, through the dagger small). East from there:
the Ricochet road to Hardy Stock (15, life with resistances) and on through Veiled Herald and Sea Legs' two dodge smalls
to **Sea Legs** (19); or north through Tumble toward the seawall and **Rat Bite** (23). At 20 it has Venom Fletching,
Mercy Stroke, Smeared Edge and either Hardy Stock or its own bow wheel. _Chose:_ poison and crit multiplier where the
regions meet. _Gave up:_ its own bow wheel, or the life of the border. _No-choice stretch:_ the Ricochet road's three
attribute nodes. _Nobody would take:_ none. Its later points pick between Sea Legs (life, through dodge smalls it does not
use) and Rat Bite (poison, the far tip): the allocator's poison bow takes both by 120.

**4. Late: the claw poison Shade, 120 points** (the allocator's best plan agrees). Home: Keen Instinct, Soft Step,
**Talon** (6), Thick Blood (7), Snakeskin, **Raking Hand** (9); the Strider for attack speed and life (Hawk's Eye, Long
Breath, Wayfarer, Quick Hands, Hard Target, Fleet Foot, Footwork, Weaving, Sidestep, True Aim); the Rookery's **Barbed
Point** (12); the south: **Smeared Edge**, **Venom Fletching**, Ricochet, Hardy Stock; the south-east: Tumble, Grey
Cloak, Veiled Herald, **Sea Legs**, and the seawall to **Rat Bite** (25). _Gave up:_ **Carrion Claws** (3.5, the far
north-east claw) and **Wiry Frame** (3.9, north life): the poison claw picks the south-east poison tip over the north-east
claw tip, as G1/shade.md meant ("not both"). _No-choice stretch:_ the seawall's fourth and fifth nodes on the way to
Rat Bite (two attribute points). _Nobody would take:_ none of the new ones: Feint and Cut is the dual dagger's and the
dodger's, Cold Steel the crit attackers' and the cold bow's, Salt in the Wound the curser's, Long Grudge the curser's at
80 to 100 and at 160.

## 8. The home: offence and defence (§4.8)

Nothing within 17 steps of the Shade start changed; round 2's check stands (the start loop and the three roads out mix
both; the south leans to defence). The south-east corner, 15 to 25 steps out, is now three defence notables (Grey
Cloak, Tumble, Veiled Herald) and Sea Legs beside four offence notables (Feint and Cut, Cold Steel, Rat Bite, and
Whetted Will on the seawall).

## 9. What is left after G3 (for the audit rounds)

- **Traps and mines**: re-measure once the Strider's ST-6 is in; if still flat, a Shade mine cluster is the lever, not
  in the south-east beside ST-6.
- **The dagger crit build's crit** went flat at 120 (§7). Between Ribs is its unbought crit multiplier; whether the
  measure should count `weaponCritMulti` in its crit family is a tooling question.
- **`walk.r4`** on the rooftop road is a bare road node with nothing off it (its ground is the empty north-east rim band,
  x 3300 to 3800, y −2900 to −2400). Room for a cluster if an audit wants one there.
- **Dead ends**: nine pockets plus five spurs; the two new ones are far tips on purpose.
- **Sea Legs and Hardy Stock** (life at the Strider border) are 7 steps apart; watched as the joined brief asked. The
  bows take Sea Legs at 120 to 140, not as a cheap near pair.
- **Glint** is still on no plan at 120 (the dagger caster's gave-up at 2); unchanged by this round.

## 10. Open questions

1. **Long Grudge is a cluster beyond the brief** (curse effect with reduced reservation, a far tip off the seawall),
   added because the curser's curses were flat even with Salt in the Wound. Keep, or drop it and accept curses as a
   finished specialization?
2. **Salt in the Wound moved from the south-east to the ground below Cruel Agony** after the allocator showed nobody
   taking it in the Docks (§3 item 1). Its new spot is closer to the casters' road (the point, Quiet Shot): agreed?
3. **The Docks' east is a ladder of three rungs to the seawall.** It reads as a grid; the alternative was fewer, longer
   bridges with more empty ground. Is that density right for a far corner?

**Intent.** One point felt close to losing it, and was corrected rather than kept: Salt in the Wound's first spot obeyed
the brief's "away from the north-east" to the letter and became a notable no caster would walk to. Moving it onto the
casters' own road (with the cursed smalls as the toll) keeps its direction a choice instead of a dead weight. The rest
followed the brief with layout reasons said out loud.

## 11. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Each new cluster is a direction with a partner (dual wield with dodge, cold with crit,
  life with dodge, poison with speed, spell with curses, curse with reservation); the allocator shows curses, poison,
  dodge and spell damage climbing past 120, life split into two directions, and the remaining flat stats explained (§4).
- **§2 The reference.** Twins 6 or more apart (Sleet 6, a different specialization; dodge twins 8 to 10); notables 3.7 to
  4.4 units; names our own, checked; the reference game is not named.
- **§3 A network.** Four new bridges (three rungs, Salt in the Wound); Veiled Herald stops being a dead end; the seawall
  gains three ways in; two far-tip pockets added on purpose. No border link changed.
- **§4 Regions.** The south-east mixes offence and defence (§8). Defences in the region: evasion, ES (four directions),
  life (three: Thick Blood, Wiry Frame, Sea Legs), dodge (four), spell dodge, resistances, stun avoidance, recharge.
- **§5 Specializations.** Dodge: Soft Step, Nimble Gambit, Tumble, Feint and Cut, Sea Legs, Shifting Ward, Spellslip,
  each a different partner, the new ones 8 to 10 apart. Curses: Second Curse, Hexwright, Ill Wish, Salt in the Wound,
  Long Grudge, 9 to 18 apart. Poison: Barbed Point, Smeared Edge, Rat Bite, Carrion Claws (vs poisoned). Cold attacks:
  a second home. Dual wield: the Shade's first cluster. Convergence rule: no new cluster pairs spell damage with ES or
  life with armour; Salt in the Wound is five steps from Hoarded Breath (ES), 18 steps out.
- **§6 Starts.** Unchanged; the nearest new notable is 18 steps out.
- **§7 Roads.** No road node added; `wall.s2` gained its first branch; every seawall node now has one; `walk.r4` is
  the region's one bare road node (§9).
- **§8 Clusters.** Every small belongs to a notable; every section uniform; notables 3.7 to 4.4; §8.3: Cold Steel's and
  Sea Legs' sides are two partners a build weighs, not near-identical smalls.
- **§9 Keystones.** All five spurs unchanged, one link each; Cruel Agony's spur is left alone (Salt in the Wound passes
  350 units below it).
- **§10 Vocabulary.** Lines from `lines.ts` only (`dualDamage`, `dodgeAttack`, `eleAttackOne`, `critChance`, `life`,
  `poisonDamage`, `poisonFaster`, `attackSpeed`, `spellDamage`, `damageVsCursed`, `curseEffect`, `reducedReservation`);
  `lines.ts` untouched; a duration partner for curses rejected as possibly dead (§4); one theme per cluster.
- **§11 Looks.** 0 crossings, 0 drawn over; smalls 70 and about 55 apart; chains straight; two notable corners with
  reasons; junction fans even (§2). Labels ignored, as asked.
- **§12 Size.** 200 → 227; one cluster beyond the brief, for §1.1; no bot simulation.
- **§13 Tensions.** The brief's spot against a notable nobody takes (Salt in the Wound); bridges against dead ends (two far
  tips); density against empty space (the ladder); tension against strength by the back door (checked, §7).
- **§14 Rejected ideas.** No generation (positions computed from hand-chosen ends and §11.5 spacings, then looked at);
  the allocator read as a yardstick (Salt in the Wound moved for a player's reason it exposed: casters never walk the
  Docks); no filler; no step-count reach; no new rule.
- **§15 How the work is done.** CONSTRAINTS and the briefs read first; before/after pictures and close-ups; geometry
  after each batch; only the Knife's folder; no register, bake, commit or stash; only the ip test.
- **§16 Open.** The Knife has 44 notables; trap supply waits on ST-6.
