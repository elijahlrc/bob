# G3 round 2: the Reaver (the Yard)

Done 2026-10-22 for G3 round 2 of [G-growth.md](../../G-growth.md), from the round-1 report ([r1/reaver.md](../r1/reaver.md),
its plan for rounds 2 and 3), the user's decisions after round 1 (CONSTRAINTS §4.8: no large stretch of only defence or
only offence, above all near a start; fix the hot spots; place this round's main-stat clusters where taking them costs
another want), the Reaver brief ([G1/reaver.md](../../G1/reaver.md)), the joined brief and the border pass
([G2/borders.md](../../G2/borders.md)). [CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Only
`src/data/passives/yard/` was edited; nothing was registered, baked or committed. Five other agents worked in the same
tree, so the allocator readings below mix their changes with these (the Wall re-lined Greatblade with sword lines while
this ran, for one).

**Nodes: 174 → 192** (Yard nodes without the start; the audit's 175 → 193 counts it). +18 in four clusters (one of
them a two-notable wheel). No node removed, no id changed, one internal link cut.

Pictures (this folder): `before.png`, `before-text.png` (before the first edit), `after.png`, `after-text.png`, and
close-ups with every node's lines: `close-home.png` (Drill Call), `close-footwork.png` (the gate to the Ford),
`close-board.png` (Sword and Board by the Shieldwall keystone), `close-wheel.png` (the leg's wheel, with the Wall's
Greatblade to its west).

## 1. The clusters added

| ledger id | notable             | lines (units)                                             | smalls                  | where it hangs                                                                                                                            | file                                |
| --------- | ------------------- | --------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| RE-7      | **Full Swing**      | `twoHandDamage(24)` 2 + `life(10)` 2 = **4.0**            | 2 × `twoHandDamage(12)` | the west side of a hexagon wheel on the leg (`leg.l1` above, `leg.l2` below), replacing the placeholder link `l1`–`l2`                    | `blood.ts` (`yard.blood.swing.*`)   |
| RE-9      | **Paired Steel**    | `dualDamage(20)` 2 + `leechLife(0.8, attack)` 2 = **4.0** | 2 × `dualDamage(10)`    | the east side of the same wheel                                                                                                           | `blood.ts`                          |
| RE-2      | **Sword and Board** | `swordDamage(20)` 2 + `shieldBlock(4)` 2 = **4.0**        | 3 × `swordDamage(10)`   | a straight bridge south from `toHeadsman.r2` to the Wall's `wall.grit.east.e6` (a near crossing)                                          | `blades.ts` (`yard.blades.board.*`) |
| RE-6      | **Footwork**        | `evasion(25)` 2.5 + `accuracy(15)` 1.5 = **4.0**          | 3 × `accuracy(10)`      | from the east gate (`yard.dual.j2.a`) to the Strider's Ford hub (`bow.steel.hub.t`), a near crossing; an L with the notable at the corner | `dual.ts` (`yard.dual.footwork.*`)  |
| RE-5      | **Drill Call**      | `warcryEffect(20)` 2 + `attackSpeed(8)` 1.6 = **3.6**     | 3 × `warcryEffect(10)`  | a straight bridge from the middle road's first node (`home.roadS.a`) to the second-hand road's first (`home.roadE.a`)                     | `home.ts` (`yard.home.drill.*`)     |

**The wheel** is the Steel Rim's pattern: a regular hexagon (radius 100, pointy top), its top vertex a two-handed small
the leg enters, its bottom vertex a dual small the leg leaves from, so a route down the leg takes one side and pays one
small of the other. Full Swing sits low on the west side (toward the Wall's two-handers), Paired Steel high on the east.
`l1` and `l2` did not move: the wheel fits between them (`l1`–top 90 units, bottom–`l2` 111). The band at the leg has no
area name over it; the nodes are in the Pits' file, the leg's own.

**Steps from the Reaver start:** Drill Call 5, Footwork 12, Sword and Board 13, Paired Steel 14, Full Swing 15 (the
brief's 6, 10, 13, 15, 15). **From the Strider start:** Footwork 7, Drill Call 10. **From the Vanguard start:** Sword and
Board 19, Paired Steel 20, Full Swing 21.

**Twins and neighbours** (steps between notables, scratch BFS):

| pair                                                         |        steps | note                                                                        |
| ------------------------------------------------------------ | -----------: | --------------------------------------------------------------------------- |
| Sword and Board – Keen Edge / Bloodied Edge / Darting Steel  |  9 / 14 / 15 | the sword in four directions, four partners (accuracy, leech, speed, block) |
| Sword and Board – Greatblade (the Wall's, now with sword)    |            6 | different partners (shield block; two-handed and crit multiplier)           |
| Sword and Board – Steel Rim / Buckler / Fencer's Eye         |  12 / 17 / 9 | not a sword-and-board one-stop                                              |
| Sword and Board – Shieldwall (the block-cap keystone)        |            7 | its pull, as the brief wanted                                               |
| Full Swing – Greatblade / Headsman / Heavy Hands             |  9 / 10 / 14 | the two-handed twins (ledger: 6 or more)                                    |
| Paired Steel – Crossed Blades / Twin Fangs / Two Fists       | 11 / 15 / 25 | the dual twins (ledger: 6 or more)                                          |
| Paired Steel – Thirsting Blade / Red Harvest / Bloodied Edge | 10 / 10 / 11 | leech twins; no leech one-stop                                              |
| Footwork – Weaving / Sidestep / Twin Fangs                   |    6 / 6 / 5 | evasion twins (ledger: 5 or more)                                           |
| Drill Call – War Drums / Battle Hymn                         |      24 / 29 | warcries' third home; the Wall's new armoured warcry is the fourth          |

The convergence rule: no new notable pairs life with armour, spell damage with energy shield, or sword with either.

**Names** (our own plain words): Full Swing, Paired Steel, Sword and Board, Footwork, Drill Call. Each greps to nothing
in `reference/tree/ref-tree.json`, none is used elsewhere in the network, and `npx vitest run src/data/ip.test.ts`
passes.

## 2. What differs from the brief, and why

1. **Paired Steel is dual wield with leech, not with life.** With life on both sides of the wheel, the allocator's
   mace-slam, two-hand-fire and axe-bleed builds took both notables at 120 points for their life alone: the fake choice
   §8.3 and §14 reject. With leech on the dual side, mace-slam and two-hand-fire take only Full Swing. (axe-bleed still
   picks Paired Steel up at 60: the wheel is on its road to Cleaver and Barrow Ward, and the notable is one point off it
   for one unit of leech; a wheel's other notable is always a step or two from a route through it, as on Steel Rim.)
   The ledger had RE-9 with leech; the brief moved it to life to avoid a leech one-stop in the Pits' east, which this
   placement no longer risks (the nearest leech notables are 10 to 11 steps away).
2. **Footwork leads with accuracy, not evasion.** The gate is 4 steps from the Strider start (the border pass's §0;
   the user's inner link `n409`–`hub.t` makes the gate–Ford corridor the Strider's own), so three evasion smalls there
   would be the cheap main stat near a start that the user asked to break up. The r1 measure agreed: bow-elemental's
   evasion was near flat at 120 (+12%) and dodge-blades' flat; the Reaver's dual-wield evasion already climbed
   (26 → 38). The evasion is on the notable. The bow builds still take Footwork at 60 (2.5 units of evasion 7 steps
   out); evasion-led it would have been 5.5.
3. **Footwork is an L, not a straight bridge.** The straight line from the gate would reach the Ford hub 18° from the
   Strider's `n409` link into it. The chain runs straight from the gate to the notable, and the last small turns east
   so the link lands in the hub's open angle (49° from `n409`, 88° from the road down to the Pits).
4. **Drill Call (RE-5) is in this round, and warcry-led.** Round 1's plan left it for round 3. The user's home guidance
   (§4.8) moved it: the start's middle ran signature → three life smalls → the hub → the shield wheel, a corridor of one
   kind straight down from the start, and RE-5 is the planned mix beside it. It is warcry-led because stop 2 (question
   B) said to flip it back to warcry-led if the sword build's attack speed stopped climbing, and at 120 points it was
   near flat (20.6 → 22.2 units before this round). Attack speed is the notable's partner (1.6 units), so the Reaver's
   speed stays a direction (the Meadow, Darting Steel), not a pocket five steps from the start. That makes five of the
   six remaining notables this round, by the constraint named.
5. **Mended Mail did not move** (the user's condition: "if they read as one place"). They do not: 12 steps apart, on
   opposite sides of the west road (Guarded north toward the Wall, Mended Mail in the cell above the elements),
   about 1,000 units apart, with different partners (evasion, regeneration). The axe walk collects both because both
   lie near its road, but armour is not one of axe-bleed's main stats; for sword-str, whose main wants include armour,
   armour at 60 points is 8.7 units and still climbs to 23 at 100 (and 17.7 → 25.2 at 120 → 160): not a stat the
   Practice Ground hands over too much of. Moving the notable one position along its chain would only trade a step
   from one end for a step from the other. Round 3 can revisit it if the whole-tree measure says otherwise.
6. **The Yard Gate's area name** was moved down (from (−80,1347) to (−30,1575)) before the user's word that labels are
   to be ignored this round arrived; it is left where it is. Nothing else about labels was checked.

## 3. The home areas against the user's guidance (§4.8)

- **The Yard Gate.** The start's two sides are offence (melee damage, attack speed), the signature both. One step out,
  both hub pockets are defence (Stout Heart life, Buckler block), and **the middle road was a corridor of one kind**:
  three life smalls from the signature to the hub, then the shield wheel (block, or life and stun) and the resist star.
  Fixed by Drill Call (warcries and attack speed) off the road's first node: a player coming down the middle now meets a
  shout before the life. The west and east roads already mix: Killing Pace (5) and Keen Edge (7) on the west beside
  Stout Heart and Field Dressing; Twin Fangs (7) beside Weaving and Buckler on the east; Fighting Breath (mana) between.
- **The north-west strip along the Wall border** (Stout Heart → Field Dressing → the Wall's Bracing, with Guarded below)
  is all defence for three or four notables. It is a strip of pockets, not a corridor: every one is a step off a road
  that sells offence (Killing Pace and Keen Edge on the west road). Left as it is; named for the user.
- **The Practice Ground** (7 to 12 steps) mixes: Keen Edge, Light Blades, Killing Pace, Hewing, Elemental Edge
  (offence) with Guarded and Mended Mail (armour). **The Lists** mix Twin Fangs, Crossed Blades, Darting Steel, Hot
  Blood (offence) with Weaving, Sidestep and now Footwork (defence with accuracy). **The Muster** is the Yard's
  defensive middle (the star, the shield wheel, the block run, Shieldwall) with Fencer's Eye and Standard Bearer in it.

## 4. Deferred border links laid

Both exactly as `G2/borders.md` §4 lists them, written in the Yard's files:

- **RE-2 ↔ `wall.grit.east.e6`** (sword and board): `yard.blades.board.c` – `wall.grit.east.e6`. `e6` becomes a cross
  of four (the Wall's road both ways, Cleaver south, Sword and Board north).
- **RE-6 ↔ `bow.steel.hub.t`** (evasion and accuracy): `yard.dual.footwork.c` – `bow.steel.hub.t`, the other end
  `yard.dual.j2.a` as listed. `hub.t` takes a fifth link.

No other link across a region line was added, cut or re-aimed.

## 5. Ids

- **New (18):** `yard.blood.swing.a`, `.b`, `.n1`, `.c`, `.d`, `.n2`; `yard.blades.board.a`, `.b`, `.n`, `.c`;
  `yard.dual.footwork.a`, `.b`, `.n`, `.c`; `yard.home.drill.a`, `.b`, `.n`, `.c`.
- **Links:** cut `yard.blood.leg.l1`–`leg.l2`. New: `leg.l1`–`swing.a`, `swing.c`–`leg.l2`, `toHeadsman.r2`–`board.a`,
  `board.c`–`wall.grit.east.e6`, `dual.j2.a`–`footwork.a`, `footwork.c`–`bow.steel.hub.t`, `home.roadS.a`–`drill.a`,
  `drill.c`–`home.roadE.a`, and each cluster's own.
- **Removed:** none. **Moved:** no node. Stale `why` texts updated (the leg, `l1`, `l2`, `r2`, the Lists', the Pits'
  and the Practice Ground's area texts, the Fighting Breath link that named RE-5).

## 6. Checks

- **`geometry.ts --region reaver --bends`:** crossings 0, drawn over 0. Eight bends over 20°: the six old shape corners
  (Light Blades, Hot Blood, Keen Edge twice, Twin Fangs, Steel Rim) and two new ones, both the wheel's hexagon corners
  (`swing.b`, `swing.d`, 60°). Footwork's turn is at its notable (the tool skips notables), for the reason in §2.3.
- **`passives:audit -- reaver`:** problems 0. Notables in units: all 40 between 3.0 (Weaving, Standard Bearer) and 5.0
  (Executioner); the new ones 3.6 (Drill Call) and 4.0. **Ways in (§3.5):** the wheel 2 (the leg above and below);
  Sword and Board 2 (`r2`, the Wall's `e6`); Footwork 2 (the gate, the Ford hub); Drill Call 2 (the middle road, the
  second-hand road). Every Yard area keeps four or more links in and out (the audit's area list).
- **`npx tsc --noEmit -p .`:** clean for the Yard (errors seen during the run were other regions' files mid-edit).
  **`buildAll`:** 0 problems with a `yard.` id. **Names:** the ip test passes.

## 7. The allocator (`passives:builds -- --only sword-str,axe-bleed,dual-wield`, indicative)

Units at 60 → 100 points · 120 → 160 points. "Before" is this round's first reading (the tree as round 1 left it, with
the other agents' first edits); "after" is the last.

| archetype  | stat                     | G0                | before                | after                     |
| ---------- | ------------------------ | ----------------- | --------------------- | ------------------------- |
| sword-str  | life                     | 24 → 37 · 43 → 53 | 19 → 27 · 36 → 43     | 19 → 23 · 26 → 39         |
|            | armour                   | 18 → 21 · 20 → 21 | 9 → 28 · 11 → 34      | 9 → 23 · 18 → 25          |
|            | sword damage             | 14 → 16 · 29 → 32 | 22 → 25 · **40 → 40** | 22 → **30** · 42 → **48** |
|            | attack speed             | 5 → 6 · 19 → 21   | 6 → 6 · 21 → 22       | 6 → 6 · 18 → 22           |
|            | choice 60 / 120, tax 120 | 2 / 2, 32%        | 3 / 5, 30%            | 3 / 3, 33%                |
| axe-bleed  | life                     | 23 → 36 · 38 → 49 | 12 → 23 · 24 → 35     | 14 → 25 · 26 → 37         |
|            | bleed                    | 12 → 12 · 22 → 25 | 14 → 14 · 24 → 24     | 14 → 14 · 24 → 24         |
|            | axe damage               | 7 → 13 · 12 → 16  | 11 → 13 · 14 → 16     | 11 → 13 · 14 → 16         |
|            | choice 60 / 120, tax 120 | 3 / 5, 34%        | 3 / 2, 33%            | 1 / 2, 33%                |
| dual-wield | life                     | 23 → 28 · 33 → 47 | 21 → 27 · 37 → 46     | 20 → 27 · 29 → 39         |
|            | dual wield               | 14 → 17 · 18 → 18 | 12 → 17 · 17 → 18     | 12 → 17 · **17 → 18**     |
|            | evasion                  | 15 → 25 · 27 → 27 | 15 → 19 · 26 → 38     | 17 → 22 · 31 → 37         |
|            | choice 60 / 120, tax 120 | 1 / 2, 28%        | 1 / 4, 28%            | 2 / 3, 28%                |

Reading it:

- **The sword no longer runs out at 120.** Sword damage at 120 → 160 went 40 → 40 to 42 → 48 (+14%), and at 60 → 100
  from 22 → 25 to 22 → 30 (+37%): Sword and Board is on the 60-point gave-up list, and at 120 the plan takes it and
  40 more points still buy the Strider's Fleet Blade. **But the Yard's own sword is still all inside the 120-point plan**
  (all four Yard sword clusters, plus the Wall's re-lined Greatblade). What the build now gives up for it is life and
  armour: at 120 it holds 26 units of life (36 before) and 18 of armour, and 40 more points buy +13 life and +8 armour,
  with Mortar and Stone (4.5), Fleet Blade (3), Stone Heart (2.8) and Oathbound (2.6) on the gave-up list. That is the
  user's headline trade (sword, life, armour: not all three), made by choice, not by distance (tax 30 → 33%).
- **Strength by the back door:** none. Strength at 120 is 181 (sword), 188 (axe), 127 (dual), against G0's 230 to 280;
  no main stat is collected much more at 120 than before (sword +2.6 units at 120, life and armour down).
- **axe-bleed** is unchanged in its main stats (bleed flat at 24, axe 14 → 16); it walks the leg to Cleaver and Barrow
  Ward and picks up Full Swing and Paired Steel on the way (§2.1). Its choice at 60 fell to one plan; at 120 it has two (three in an earlier reading the same hour; the search is sensitive to the other agents' edits).
- **dual-wield: dual wield is still flat (17 → 18).** Paired Steel is 8 points beyond the dual build's 120-point plan
  (which lives in the Lists, the Strider's Meadow and the Pits' east), so 40 more points do not reach it. The wheel
  makes the third dual direction a real detour, which is the user's ask, but it does not give this archetype an
  appetite. Its evasion climbs (31 → 37). Its gave-up list at 120: Wiry Frame (3.9), Snakeskin (2), small ones.
- **Neighbours:** bow-crit, bow-elemental (Strider) and dodge-blades take Footwork at 60 (2.5 units of evasion); mace-
  slam and two-hand-fire take Full Swing at 120 (the two-handed side only, since the re-line); warcry-totem takes Drill
  Call at 120. Footwork is the one new cluster nearer another start (7) than its own (12): see §10.
- **Against the targets, the three together:** target 1 (at 120, typical main stat) 18% → 22%, stats gaining 10% or
  less 40% → 20%; target 2 (at 60) 30% → 35%; target 3 typically 2 notables of 2.5+ units, none with none; target 4
  two of three with three or more plans, none with one; target 5 tax 30% → 33%, none above a third.

## 8. Walks (by hand, with the scratch walk script on the live tree)

**1. The Reaver's main build, a sword and armour, 20 points.** Quickened Steel (2), Drill Call (6, through one life
small and the warcry chain), Keen Edge (12), Light Blades (16), Mended Mail (20). Chose: a shout and a little speed at
the gate, sword with accuracy, one-handed damage, armour with regeneration. Gave up: Stout Heart (the first life),
Guarded (25), Scarred Hide. The other way, Stout Heart (5), Keen Edge (9), Light Blades (13), Scarred Hide (16) buys
life instead of the shout and the armour. No stretch without a choice: every road node from the start has a cluster
off it, and the middle road now offers warcries as well as life.

**2. An off-build: a two-handed axe Reaver, 20 points.** Quickened Steel (2), Stout Heart (5), Hewing (11), Elemental
Edge (14), Full Swing (20, down the west road to the leg). Chose: the axe, the elements, two-handed damage with life.
Gave up: Guarded and Mended Mail (armour), Executioner and the bleed. The wheel is a commitment: its other side (Paired
Steel) is one step from the top, worth nothing to a two-hander but its leech. **A dual-wield Reaver with warcries:**
Quickened Steel (2), Drill Call (6), Twin Fangs (12), Weaving (13), Footwork (18), Sidestep (20): the east's speed,
dual wield and three kinds of avoidance. Gave up: Keen Edge, Light Blades, the life pocket.

**3. A neighbour coming in.** A **Strider** reaches Footwork at 7 (the gate at 4), Twin Fangs at 9 and Drill Call at
15: Footwork is the Strider's accuracy, and its evasion on the way to its own Ford. A **Vanguard shield build** reaches
Sword and Board at 19 (by the Barrows and the Wall's east road) and Shieldwall at 22: a far destination, as the
crossing intends (the Wall's own shields are nearer to it).

**4. A 120-point sword-and-board Reaver (life, armour, sword, block).** Quickened Steel (2), Stout Heart (5), Buckler
(9), Keen Edge (13), Light Blades (17), Scarred Hide (20), Steel Rim (22), Four Winds (24), Guarded (29), Mended Mail
(33), Sword and Board (41), Shieldwall (44), Fencer's Eye (48), Executioner (50), Shield Bash (54), Red Harvest (58),
Bloodied Edge (64), Darting Steel (69), Drill Call (71); the Wall: Oathbound (79), Stone Heart (85), Mortar and Stone
(94), Locked Shields (101), Elemental Ward (104); 16 points left for life and resistances. Chose: every Yard sword,
shield and armour notable, then the Rampart. Gave up: the speed (Twin Fangs, Killing Pace, the Meadow, Fleet Blade),
Broad Back and Thick Skin (the Wall's far life and armour), Thirsting Blade, Headsman. The Yard alone is about 71
points of this build; with the Rampart it is 104. **The finding:** a build that skips speed can still take every Yard
sword and shield notable by 120; what it cannot also take is the speed and the far life. Spellsword, Marked Prey,
Ceaseless Blades and Stormstruck remain the notables the home archetypes never take (kept for builds they do not cover).

## 9. Plan for round 3

- **RE-8** (bleed with bleed duration) off the spine's bare `s2` to the Fosse's `f5`, as planned: axe-bleed's bleed is
  flat at 24 at 120.
- **The sword:** the sword now climbs at 120 and at 60, so no more sword supply. If the whole-tree measure still shows
  three of the four Yard sword clusters inside the 60-point plan (Keen Edge, Darting Steel and Bloodied Edge are there
  today), move **Darting Steel** two or three steps out along the Strider's road (it is the one a mid-run sword build
  reaches through the east road for free) rather than add a farther sword cluster, which would only add supply.
- **Dual wield** (flat at 17 → 18 for the third round running): the leg's Paired Steel is out of the dual build's reach
  by design. If round 3's measure still shows it flat, the reserve cell east of the Steel Rim wheel (170..390,
  2330..2440) could hold a dual cluster with a partner not yet used for dual (dual with attack speed on kill, or with
  movement), about 6 steps from Crossed Blades and 9 from Twin Fangs.

## 10. Open questions

1. **Footwork and the Strider.** The deferred link fixes Footwork between the east gate and the Ford hub, and the
   user's stop-3 link (`n409`–`hub.t`) made that corridor the Strider's own: Footwork is 7 steps from the Strider start
   and 12 from the Reaver's, and the bow builds take it at 60. Accuracy-led keeps its evasion to the notable's 2.5
   units. Keep it there (a Reaver cluster the Strider buys into, a real crossing), or hang RE-6 elsewhere and leave
   the gate's corridor to the Strider?
2. **The north-west defence strip** (Stout Heart, Field Dressing, the Wall's Bracing, Guarded): pockets off offensive
   roads, so I left it. Does it read to the user as the "region of only health and armour near a start"?
3. **Dual wield stays flat** (§9): accept the wheel's dual side as a far detour, or add a nearer dual cluster in round 3?
4. **An observation across the border, not mine to fix:** the Wall re-lined Greatblade with sword lines while this round
   ran. It is now 6 steps from Sword and Board and about 190 units (9 steps) west of Full Swing: different partners, so
   no twin rule is broken, but the Vanguard–Reaver border now holds two sword-adjacent clusters, for the border
   revisit after G3.

Nothing here felt like it was losing intent.

## 11. Checklist against CONSTRAINTS.md

- **§1 Purpose.** The sword now climbs at 60 and at 120, and the sword build gives up life and armour for it (§7); the
  dual-wield flatness is reported, not hidden. Placed from the map and the brief, never a build list; the allocator
  only checked (and caused the Paired Steel re-line, §2.1, where it exposed a fake choice).
- **§2 Reference.** No reference names; five new names grep clean and the ip test passes. Notables 3.6 to 4.0 units;
  two or three smalls each, every small carrying its notable's lead.
- **§3 Network.** Every new cluster has two ways in; the leg's placeholder link is gone; two border links laid exactly as
  deferred, no other crossing touched (§3.7 revisited after G3 by the user's decision).
- **§4 Regions.** §4.8 applied to the home (§3 here): the middle corridor mixed by Drill Call; the Yard keeps varied
  defences (life, armour twice, evasion three ways, block, dodge, leech, stun threshold, resistances). Every region sells
  what most builds want: the Yard now sells warcries and accuracy in its own voice.
- **§5 Specializations.** Sword in four Yard directions with four partners (9 to 15 apart); two-handed and dual each a
  new direction, 9+ and 11+ from their twins; evasion twins 5 to 6 apart; warcries' third home 24+ from the others;
  the convergence rule kept. Weapons in the str/dex region (§5.4). Neighbours compete: Footwork beside the Strider's
  Ford is named (§10.1).
- **§6 Starts.** The start untouched; the nearest new notable is Drill Call at 5 (no weapon within three steps).
- **§7 Roads.** No road node added; every new cluster hangs from a road node.
- **§8 Clusters.** One line per small, uniform within each cluster; every new small belongs to a notable; the wheel's
  sides are two variants of one theme a build rarely takes both of (§8.3), with different partners since the re-line.
- **§9 Keystones.** Untouched (Shieldwall 12, Wound Dance 15, Crimson Pact 15), all dead ends.
- **§10 Vocabulary.** Only existing lines (`twoHandDamage`, `dualDamage`, `leechLife`, `life`, `swordDamage`,
  `shieldBlock`, `accuracy`, `evasion`, `warcryEffect`, `attackSpeed`), all read by the sheet and the fight; nothing in
  `lines.ts` changed, no line missing.
- **§11 Looks.** 0 crossings, 0 drawn over; the wheel a regular hexagon (radius 100); chains straight at 56 to 57 apart;
  Footwork's one turn at its notable for a clean angle at the Ford hub. Labels ignored per the user (§2.6).
- **§12 Size.** 174 → 192, an outcome; one cluster pulled forward for §4.8. No bot simulation (the allocator is static).
- **§13 Tensions.** Connections against trade-offs (Footwork's crossing, §10.1); identity against spread (four Yard
  sword notables, four partners, four directions); a generic start against early direction (Drill Call mixes the
  middle without naming a weapon).
- **§14 Rejected ideas.** Nothing generated; coordinates computed by hand on the lines between ends and looked at; no
  spacing rule; steps here are costs and twin distances, not reach.
- **§15 Process.** CONSTRAINTS and every brief read first; before/after pictures and close-ups; geometry, audit, names
  and allocator run; walks written; only the Yard folder edited; no register, bake, commit or stash.
- **§16 Open items touched.** Region size; sword spread; the Yard's evasion and accuracy; crossings (two laid).
