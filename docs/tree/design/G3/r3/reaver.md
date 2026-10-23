# G3 round 3: the Reaver (the Yard)

Done 2026-10-22 for G3 round 3, the last round of new clusters, of [G-growth.md](../../G-growth.md). Sources: the
round-2 report ([r2/reaver.md](../r2/reaver.md), its plan for round 3), round 1's ([r1/reaver.md](../r1/reaver.md)),
the whole-tree measure after round 2 ([r2/builds.txt](../r2/builds.txt)), the user's decisions after round 2 (CONSTRAINTS
§8.3's new item: not every choice must be interesting for every build; §4.8; area labels ignored), the Reaver brief
([G1/reaver.md](../../G1/reaver.md)), the joined brief and the border pass ([G2/borders.md](../../G2/borders.md)).
[CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Only `src/data/passives/yard/` was edited (`blood.ts`,
`fosse.ts`); nothing was registered, baked or committed. Five other agents worked in the same tree, so the allocator
readings mix their changes with these.

**Nodes: 192 → 196** (Yard nodes without the start; the audit's 193 → 197 counts it). +4: one cluster. No node removed,
no id changed, one cluster moved (Festering, three nodes, same ids), two links re-aimed inside the Yard.

Pictures (this folder): `before.png`, `before-text.png` (before the first edit), `after.png`, `after-text.png`, and
close-ups with every node's lines: `close-lasting.png` (Lasting Wounds between the spine and the Fosse, Wound Dance
and the leg's wheel above it), `close-festering.png` (the east rim junction, Festering re-hung on the Fosse's first
node, Bloodied Edge). `builds.txt` is the last allocator reading for the three Reaver archetypes.

## 1. The cluster added

| ledger id | notable            | lines (units)                                         | smalls                | where it hangs                                                                                     | file                                |
| --------- | ------------------ | ----------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| RE-8      | **Lasting Wounds** | `bleedDamage(24)` 2 + `bleedDuration(30)` 2 = **4.0** | 3 × `bleedDamage(12)` | a bridge from the spine's last node (`yard.blood.spine.s2`) to the Fosse's fifth (`fosse.road.f5`) | `blood.ts` (`yard.blood.lasting.*`) |

This is the last cluster of the Reaver brief (RE-1 to RE-9 are all in). It sits where the brief and G2's hang table
put it, below Wound Dance, whose eight stacks are worth more the longer each bleed lasts: that is the partner's reason.
`bleedDuration` is new to the network (first use) but not to `lines.ts`; it is read by the sheet and the sim
(`duration.bleed` in `src/calc/skill.ts`'s bleed spec).

**Layout.** Two smalls run straight from `s2` west-south-west to the notable at (−470, 3980), 70 and 127 units out on
the line toward `s2`; the third small drops straight down to `f5` (70 below the notable, 80 above `f5`). An L with the
turn at the notable, as Footwork in round 2: the straight line from `s2` would have met `f5` 29° from the Fosse's road
east to `f4`, a near-miss of a fan (§11.5). Now `f5` is a fan of four at 71°, 74°, 102° and 112° gaps (the road west,
the bleed from above, the road east, Marked Prey below), and `s2` a fan of three (the spine up, the spine down to `f4`,
the bleed 54° from it). The spine, the Fosse and the chain make a loop (`s2`–`f4`–`f5`).

**Steps.** From the Reaver start 18 (the brief's 19); from the Vanguard start 25. To its twins and neighbours (scratch
BFS):

| pair                                           | steps | note                                            |
| ---------------------------------------------- | ----: | ----------------------------------------------- |
| Lasting Wounds – Open Veins (bleed, chance)    |     9 | the twin; different partner (duration / chance) |
| Lasting Wounds – Wound Dance (the keystone)    |    10 | its pull, by the spine or the leg               |
| Lasting Wounds – Executioner / Hewing          | 11/14 | against the bleeding / axes with bleed chance   |
| Lasting Wounds – Festering (poison with bleed) |     9 |                                                 |
| Lasting Wounds – Deep Cuts / Barbed Arrows     | 16/20 | the Strider's bow bleeds                        |
| Lasting Wounds – Marked Prey / Full Swing      |   5/6 | not twins (curses; two-handed)                  |

The convergence rule is untouched (no life, armour, spell damage or energy shield on it). **Name:** Lasting Wounds,
our own plain words; it greps to nothing in `reference/tree/ref-tree.json`, is used nowhere else in the network, and
`npx vitest run src/data/ip.test.ts` passes.

## 2. Changes to existing clusters

| change                                         | before → after                                                                                                                                                                                                          | why                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Festering re-hung** (`yard.blood.festering`) | entered from the east rim junction (`j2.a`), chain a (775,3347), b (823,3380), n (880,3420) → entered from the Fosse's first node (`fosse.road.f1`), a straight chain due east: a (755,3420), b (810,3420), n unchanged | G2 §4.9 left `j2.a` at seven links, "the joined pass or G3 may take one", and named this option ("Festering off f1"). After the border pass it had six, and its Crimson Pact spur and Festering's link left it **17° apart**. Now `j2.a` is a fan of five (smallest gap 35°, the rim road and Red Harvest, unchanged) and `f1`, which had three links, is a clean cross: the junction north, the Fosse south, Spellsword west, Festering east. |
| **Bloodied Edge's exit** (`fosse.ts` link)     | `bloodied.c` – `festering.b` → `bloodied.c` – `festering.a`                                                                                                                                                             | `festering.a` lies on Bloodied Edge's own straight line from `f2` (a bend of 8° at `c`); landing on `b` would have arrived 34° from the chain into `b`. Festering keeps its tip and two ways in.                                                                                                                                                                                                                                               |

Lines unchanged; no re-line this round. Festering is one step further from the Reaver start (15 → 16) and from the
Strider start (14 → 15); Bloodied Edge to Festering is 4 (was 3).

Stale `why` texts updated: the Pits' header and area text, the spine and `s2` (which announced RE-8), the east rim
junction, Festering and its link, the Fosse road and `f5`, the Fosse's link from `j2`, and Bloodied Edge's ("three
directions" → four, since round 2's Sword and Board).

## 3. Far supply for the flat specializations (round-3 item 2)

The round's list for this region: bleed for the axe bleeder (24 → 24 at 120 → 160), dual wield (17 → 18), the sword
(46 → 48). For each, whether one more cluster is wanted, from the map first and the allocator second.

### Bleed: RE-8 is the added supply; no second bleed cluster

- **What RE-8 did.** axe-bleed takes Lasting Wounds already at **60 points** (beside its walk: Wound Dance, the leg,
  Barrow Ward and Cleaver are all in its 60-point plan, and `f5` is one node from the leg's landing). Bleed at
  60 → 100 went from **flat (13.8 → 13.8) to climbing (15.5 → 18.8, +21%)**, because the 60-point plan now trades:
  it holds Lasting Wounds and gives up Executioner and Paired Steel, which 20 more points buy back. At 120 the build
  holds 29.3 units of bleed (24.3 before) and **gives up axe for it** (10.7 at 120, was 14; it climbs to 16 at 140):
  the new supply is paid for by another main stat, not added on top (strength by the back door: no, see §6).
- **Bleed is still flat at 120 → 160 (29.3 → 29.3).** The axe build's home is the Yard's whole south-west, so a
  finished build owns every bleed node in the Yard; at 120 it also walks east to the Strider's two bow bleeds (Deep
  Cuts, Barbed Arrows), which are the far bleed supply. What it gives up at 120 is the Rampart (Mortar and Stone,
  Oathbound, Stone Heart, Verger, Elemental Ward), so its trade at 120 is bleed against armour and life.
- **Why not a second Yard bleed cluster.** Bleed would then have Open Veins, Lasting Wounds, a third, plus Hewing's and
  Festering's bleed lines, Executioner and Wound Dance: a fourth bleed direction in one region, which would only add
  supply to a build that already owns the south (§12.1: quality over count; "a cluster nobody would weigh is filler").
  I did not move RE-8 away from Wound Dance to chase the number: its partner exists for the keystone, and the spot is
  the one the user approved at stop 2.

### Dual wield: no new cluster

- Dual wield has four clusters in four directions with four partners: Twin Fangs (speed and block, the Lists), Crossed
  Blades (crit, the east road), Paired Steel (leech, the leg's wheel), the Wall's Two Fists (armour). dual-wield's
  plan lives in the Lists and the Strider's Meadow; it takes the first two and never the second two, **even at 160
  points**: the third direction exists (Paired Steel is 14 steps from the start), and the build chooses the Strider's
  evasion and life over the walk west. That is a trade the build makes, not a missing supply.
- A nearer dual cluster would be taken at 60 to 100 points (more dual wield at 120, no more tension: strength by the
  back door), and a farther one would be judged as Paired Steel is. The reserve cell named in round 2 (east of the
  Steel Rim wheel) is 40 units under Iron Draw's U and inside the dual build's walk to Red Harvest; the free cell
  between Spellsword, the spine and the Fosse (about (170, 3760)) is one node from the Fosse's second node, which the
  dual build already passes for Bloodied Edge. Neither makes it weigh anything.
- dual wield at 60 → 100 climbs (11.5 → 17, +48%); evasion and life climb at 120 → 160 (+21%, +32%).

### The sword: no new cluster, and Darting Steel not moved

- sword-str takes all six sword clusters by 120 (Keen Edge, Darting Steel, Bloodied Edge at 60; Sword and Board at
  100; the Strider's Fleet Blade and the Wall's Greatblade at 120). Six directions, six partners (accuracy, sword
  speed, leech, block, two-handed with crit multiplier, evasion with speed). A seventh would be supply for its own
  sake: the south-west rim reserve is inside sword-str's 120-point footprint (Barrow Ward, Greatblade, Second Wind,
  Iron Voice), so a cluster there would be absorbed.
- The sword build's trade is the user's headline one, made by choice: at 120 it has all the sword and gives up life
  (20.8 → 37.8 from 120 to 160, +82%) and armour (16.7 → 26.2, +57%): not all three. Sword climbs at 60 → 100
  (21.8 → 29.8, +37%).
- **Round 2's idea of moving Darting Steel 2 or 3 steps out along the Strider's road cannot be done as written:** its
  far end (`darting.c`–`bow.steel.toBlood.c`) is a deferred border link, fixed this round. The in-scope variants
  (hang it from `e3`, or reverse the chain) buy one step at most, for an L that would look worse. Left for the border
  revisit after G3, if the user wants it.

## 4. Deferred border links laid

**None this round.** `G2/borders.md` lists three for the Reaver (RE-1 → `bow.steel.toBlood.c`, RE-2 →
`wall.grit.east.e6`, RE-6 → `bow.steel.hub.t`), all laid in rounds 1 and 2; none lands on RE-8. No link across a
region line was added, cut or re-aimed.

## 5. Ids

- **New (4):** `yard.blood.lasting.a`, `.b`, `.n`, `.c`.
- **Links:** new `spine.s2`–`lasting.a`, `lasting.c`–`yard.fosse.road.f5`, and the cluster's own three. Re-aimed:
  `yard.blood.j2.a`–`festering.a` is now `yard.fosse.road.f1`–`festering.a`; `yard.fosse.bloodied.c`–`festering.b` is
  now `bloodied.c`–`festering.a`.
- **Moved:** `yard.blood.festering.a` (775,3347) → (755,3420), `.b` (823,3380) → (810,3420); the notable did not move.
- **Removed:** none.

## 6. Checks

- **`geometry.ts --region reaver --bends`:** crossings 0, drawn over 0. Eight bends over 20°, the same eight as before
  this round (the old shape corners: Light Blades, Hot Blood, Keen Edge twice, Twin Fangs, Steel Rim, the leg wheel's
  two hexagon corners). Lasting Wounds' turn is at its notable (the tool skips notables), for the reason in §1.
- **`passives:audit -- reaver`:** problems 0. Notables in units: all 41 between 3.0 (Weaving, Standard Bearer) and
  5.0 (Executioner); Lasting Wounds 4.0. Ways in (§3.5): Lasting Wounds 2 (the spine, the Fosse); Festering 2 (the
  Fosse's first node, Bloodied Edge); every Yard area keeps four or more links in and out.
- **`npx tsc --noEmit -p .`:** clean for the Yard (the one error seen, an unused import in `bow/rim.ts`, is another
  region's file mid-edit). **`buildAll`:** 0 problems with a `yard.` id. **Names:** the ip test passes; the name
  greps clean.

## 7. The allocator (`passives:builds -- --only sword-str,axe-bleed,dual-wield`, indicative)

Units at 60 → 100 points · 120 → 160 points. G0 is the baseline ([G0/builds.txt](../../G0/builds.txt)); "r2 end" is
this round's first reading (the tree as round 2 left it, with the other agents' first edits); "after" is the last.
60/80/100 and 120/140/160 are two families of plans (the 120 plan is a fresh search, not the 100 plan grown).

| archetype  | stat                     | G0                | r2 end            | after                     |
| ---------- | ------------------------ | ----------------- | ----------------- | ------------------------- |
| sword-str  | life                     | 24 → 37 · 43 → 53 | 19 → 23 · 21 → 38 | 19 → 23 · 21 → 38         |
|            | armour                   | 18 → 21 · 20 → 21 | 9 → 23 · 17 → 26  | 9 → 23 · 17 → 26          |
|            | sword damage             | 14 → 16 · 29 → 32 | 22 → 30 · 46 → 48 | 22 → 30 · 46 → 48         |
|            | attack speed             | 5 → 6 · 19 → 21   | 6 → 6 · 17 → 22   | 6 → 6 · 17 → 22           |
|            | choice 60 / 120, tax 120 | 2 / 2, 32%        | 3 / 3, 33%        | 3 / 3, 33%                |
| axe-bleed  | life                     | 23 → 36 · 38 → 49 | 14 → 25 · 26 → 37 | 14 → 26 · 26 → 37         |
|            | bleed                    | 12 → 12 · 22 → 25 | 14 → 14 · 24 → 24 | **16 → 19** · **29 → 29** |
|            | axe damage               | 7 → 13 · 12 → 16  | 11 → 13 · 14 → 16 | 11 → 13 · **11 → 16**     |
|            | choice 60 / 120, tax 120 | 3 / 5, 34%        | 1 / 2, 33%        | 1 / 2, **35%**            |
| dual-wield | life                     | 23 → 28 · 33 → 47 | 20 → 27 · 29 → 39 | 20 → 27 · 29 → 39         |
|            | dual wield               | 14 → 17 · 18 → 18 | 12 → 17 · 17 → 18 | 12 → 17 · 17 → 18         |
|            | evasion                  | 15 → 25 · 27 → 27 | 17 → 22 · 31 → 37 | 17 → 22 · 31 → 37         |
|            | choice 60 / 120, tax 120 | 1 / 2, 25%        | 2 / 3, 28%        | 2 / 3, 28%                |

Reading it:

- **axe-bleed** is the only archetype this round touches. Bleed now climbs at 60 → 100 (+21%; flat before) and the
  60-point plan trades Executioner and Paired Steel for Lasting Wounds. At 120 it holds more bleed and less axe, and
  axe now climbs from 120 to 160 (+50%): the two main stats trade against each other. Bleed stays flat at 120 → 160
  (§3). Tax at 120 rose to 35% (two more road points; one build above a third among the three). Gave up at 120:
  Mortar and Stone (4.5), Oathbound (2.6), Stone Heart (2.4), Verger, Elemental Ward (2), Hawk's Eye (1.9), Hatchet
  Work (1.7). Gave up at 60: Second Wind (2.6), Oathbound (2.6), Stone Heart (2.4), Thirsting Blade (2.3), Paired
  Steel (1).
- **sword-str and dual-wield** are unchanged in every main stat. Their way from the east rim junction to Bloodied Edge is
  as long as before but passes the Fosse's first node instead of one of Festering's poison smalls, so one point of
  their tax is now a road node (+6 strength and dexterity); tax unchanged.
- **The poison builds that take Festering** (the moved cluster, one step further from the Strider start):
  bow-poison holds 13.5 units of poison at 120 (13.5 in the round-2 measure) and climbs to 22.3 at 160; claw-poison
  holds 14.5 (16.3), climbs to 21.8, and lists Festering on its 120-point gave-up list (2.3). Both regions were being
  edited by their agents at the same time, so the small moves are not all this one's.
- **Strength by the back door:** none. Strength at 120 is 187 (sword), 202 (axe), 133 (dual), against G0's 230 to 280. The only main stat collected more at 120 is axe-bleed's bleed (+5 units, one 4-unit notable and its smalls),
  paid for with axe (−3.3 units).
- **Against the targets, the three together:** target 1 (at 120) 32% → 34%, stats gaining 10% or less 30% (bleed,
  dual wield, sword); target 2 (at 60) 35%, gaining 10% or less 20% → 10%; target 3 typically 2 notables of 2.5+,
  none with none; target 4 none with one plan, two with three or more; target 5 tax typically 33%, one above a third.

## 8. Walks (by hand, with the scratch walk script on the live tree)

**1. The Reaver's main build, a sword and armour, 20 points.** Quickened Steel (2), Drill Call (6), Keen Edge (12),
Light Blades (16), Mended Mail (20). Unchanged by this round. Chose: a shout and a little speed at the gate, sword with
accuracy, one-handed damage, armour with regeneration. Gave up: Stout Heart, Guarded, Scarred Hide. No stretch
without a choice.

**2. An off-build: the axe and bleed Reaver, 20 points.** Quickened Steel (2), Scarred Hide (8, down the middle
road), Open Veins (13), Wound Dance (18): bleed early and the keystone by 18. The other way, Hewing (10) then
Executioner (15) and Open Veins (19): the axe and the finisher first, the keystone at 22. Chose: which half of the
bleed kit comes first. Gave up: life (Stout Heart), armour (Guarded, Mended Mail). **Lasting Wounds** is the
seventh point after Wound Dance (25 by the first route), by the spine or by the leg: the next decision of this build is
Lasting Wounds (bleed) or the leg's Full Swing and Cleaver (two-handed, the axe), which are 6 and 8 steps from it in
different directions. No notable here is one nobody would take.

**3. A neighbour coming in.** A **Strider poison bow** reaches Festering at 15 (one more than before, by the Fosse's
first node), Bloodied Edge at 17 and Crimson Pact at 20: the poison with bleed is a Strider's reach into the Yard, and
the leech keystone is three steps on. A Strider with a sword reaches Darting Steel at 11 and Festering at 18. A
**Vanguard two-hander** comes in from the Barrows: Barrow Ward (24), Cleaver (27), Lasting Wounds (31), Full Swing (34);
Lasting Wounds is the far end of the Wall's axe walk, a Reaver bleed a Vanguard pays for.

**4. A 120-point axe-bleed Reaver (bleed, axe, leech, life).** Quickened Steel (2), Stout Heart (5), Scarred Hide (11),
Four Winds (13), Hewing (19), Mended Mail (24), Open Veins (29), Red Harvest (31), Executioner (36), Standard Bearer
(38), Wound Dance (43), Lasting Wounds (50), Full Swing (55), Paired Steel (56), Cleaver (62), Barrow Ward (63),
Guarded (67), Elemental Edge (68), Headsman (72), Thirsting Blade (75), Second Wind (77), the Wall's Oathbound (85) and
Stone Heart (91), Festering (97), Mortar and Stone (106); 14 points left for life and resistances. Chose: every Yard
bleed notable, the leg's wheel, the Wall's axes and two-hander, its leech and some of its armour. Gave up: the
Strider's bow bleeds (Deep Cuts, Barbed Arrows: about 12 more points each way), Elemental Ward and Verger, the
Strider's speed (Hawk's Eye, Hatchet Work), Bloodied Edge. **The finding:** the axe build's 120 points cover the
Yard's south-west and the Wall's south-east; its far choices are the Strider's bleeds (east) or the Rampart's armour
(north-west), not both. Spellsword, Marked Prey, Ceaseless Blades and Stormstruck remain the notables the home
archetypes never take (kept for the builds they serve: the Reaver with a spell, the curse-on-hit attacker, the
channeller, the lightning striker).

## 9. What is left after G3 (for the audit rounds)

- **Flat at 120 → 160 in the Reaver's builds:** bleed (29 → 29), dual wield (17 → 18), the sword (46 → 48), each for
  the reason in §3. The audit should judge them from walks, not by adding supply.
- **axe-bleed's tax at 120 is 35%** (one road-heavy plan; it was 33%).
- **The east rim junction (`j2.a`) still has five links**, with the rim road and Red Harvest 35° apart (G2's).
  `j3.a` has two pairs 32° and 34° apart (Open Veins' exit and the rim road; Wound Dance's spur and Shield Bash's
  road), and `w4` three links 39° apart. Candidates for the looks audit (§11.5), all from G2.
- **Darting Steel** inside the sword build's 60-point plan (§3): only movable with its border link.

## 10. Open questions

1. **Bleed, dual wield and the sword stay flat at 120 → 160** (§3). My judgement is that each is a trade the build
   makes (bleed against the Rampart's armour, dual wield against the Strider's evasion, the sword against life and
   armour), and that another cluster for any of them would be supply for the number's sake. Agree, or should one of
   them get a far cluster anyway?
2. **Carried from round 2, not mine to settle:** Footwork beside the Strider's Ford (moving it re-aims a border link);
   the north-west defence strip (Stout Heart, Field Dressing, the Wall's Bracing, Guarded: pockets off offensive
   roads); Greatblade's sword lines on the Vanguard–Reaver border. Round 2's other item, axe-bleed taking both sides
   of the leg's wheel, is now covered by §8.3's new item (other builds choose: mace-slam and two-hand-fire take only
   Full Swing), so no action.

Nothing here felt like it was losing intent.

## 11. Checklist against CONSTRAINTS.md

- **§1 Purpose.** The one new cluster makes axe-bleed trade at 60 (Executioner and Paired Steel for Lasting Wounds) and
  at 120 (axe for bleed); the flat specializations are reported with their trades, not padded (§3). Tension is one
  constraint among the rest: RE-8 sits where its partner has a reason.
- **§2 Reference.** No reference names; Lasting Wounds greps clean and the ip test passes. Notable 4.0 units, three
  smalls of its lead.
- **§3 Network.** Lasting Wounds is a bridge with two ways in and closes a loop with the spine and the Fosse;
  Festering keeps two ways in. No cross-region link touched (§3.7 revisited after G3, by the user's decision).
- **§4 Regions.** The Pits' south now holds bleed, curses, channelling, two-handed and dual wield, leech and spells:
  offence and defence mixed far from the home; the home is untouched (§4.8). Varied defences unchanged (§4.5).
- **§5 Specializations.** Bleed in two Yard clusters with different partners (chance, duration) 9 steps apart, plus
  bleed lines on Hewing and Festering, Executioner against the bleeding, and the Strider's two bow bleeds (§5.1,
  §5.2). Bleed is a Reaver identity concentrated in the Yard (§5.3, §13.2), its clusters apart. Neighbours compete:
  Lasting Wounds against the leg's wheel and the Wall's axe (§5.5).
- **§6 Starts.** The start untouched; nothing new within 17 steps of it.
- **§7 Roads.** No road node added; the new cluster hangs between two road nodes; `f1`, which had three links, now has
  a cluster on each side (§7.3).
- **§8 Clusters.** One line per small, uniform (§8.2); every new small belongs to the notable (§8.7); 4.0 units (§8.6).
  No wheel added (§8.3).
- **§9 Keystones.** Untouched (Shieldwall, Wound Dance, Crimson Pact), all dead ends; Lasting Wounds is a reason to walk
  past Wound Dance, not a link into it.
- **§10 Vocabulary.** Existing lines only (`bleedDamage`, `bleedDuration`); `bleedDuration` is new to the network and
  live in the sheet and the sim (§10.3). `lines.ts` unchanged; no line missing.
- **§11 Looks.** 0 crossings, 0 drawn over, no new bend; the notable's smalls 70 and 57 apart on a straight line, the
  turn at the notable for a clean fan at `f5`; two near-miss fans fixed (`j2.a` 17°, `festering.b` 34°); labels
  ignored per the user.
- **§12 Size.** 192 → 196, an outcome; no bot simulation (the allocator is static).
- **§13 Tensions.** Bridges against dead ends (Lasting Wounds a bridge, the keystone spurs dead ends); identity against
  spread (bleed concentrated in the Yard, its clusters apart); highways against filler (no road added).
- **§14 Rejected ideas.** Nothing generated; the L and the Festering line laid by hand and looked at; no spacing rule;
  steps used as costs and twin distances, not reach; no cluster added for a number.
- **§15 Process.** CONSTRAINTS, the briefs and both earlier reports read first; before/after pictures and close-ups;
  geometry, audit, names and allocator run; walks written; only the Yard folder edited; no register, bake, commit or
  stash.
- **§16 Open items touched.** Region size; the Yard's road knots (`j2.a`); one-stop shops (bleed checked).
