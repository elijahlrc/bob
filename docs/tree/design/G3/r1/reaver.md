# G3 round 1: the Reaver (the Yard)

Done 2026-10-22 for G3 round 1 of [G-growth.md](../../G-growth.md), from the joined brief ([G1-brief.md](../../G1-brief.md),
which wins, with stops 2 and 3 at its top), the Reaver brief ([G1/reaver.md](../../G1/reaver.md)), the skeleton report
([G2/reaver.md](../../G2/reaver.md)) and the border pass ([G2/borders.md](../../G2/borders.md)).
[CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Only `src/data/passives/yard/` was edited; nothing was
registered, baked or committed. Five other region agents worked in the same tree at the same time, so the allocator
readings below mix their changes with these.

**Nodes: 161 → 174** (Yard nodes without the start; the audit's 162 → 175 counts the start). +12 in three clusters,
+1 armour small on Guarded. No node removed, no id changed.

Pictures (this folder): `before.png` (before the first edit), `before-text.png`, `after.png`, and close-ups with every
node's lines: `close-mail.png` (the Practice Ground: Guarded, Mended Mail), `close-darting.png` (the Lists' east road and
the Strider's road into the Pits), `close-bloodied.png` (the Pits' east and the Fosse).

## 1. Re-lines (the approved changes to existing notables)

| notable                                  | before                                   | after                                                                        | units     | why                                                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scarred Hide (`yard.shield.steelRim.n2`) | `life(10), armour(12), physReduction(1)` | `life(10), stunThreshold(16)`                                                | 4.0 → 4.0 | The convergence rule: life with armour 8 steps from the start. Stun threshold, not life on block, keeps the wheel's no-shield side (G1 Reaver brief §1, approved at stop 2). |
| Guarded (`yard.blades.guarded.n`)        | `armour(16), evasion(13), life(5)`       | `armour(20), evasion(20)`                                                    | 3.6 → 3.7 | The same rule (life with armour, now 9 steps). The two-defence notable only a str/dex region sells.                                                                          |
| Guarded's chain                          | two armour smalls                        | **three** (`guarded.c` new, `armour(12)`, on the straight line up from `w1`) |           | The brief's third armour small (RE-s1 folded in). `w1`–`guarded.a` re-aimed to `w1`–`guarded.c`.                                                                             |

No existing Reaver notable was outside 3 to 5 units (the audit: Weaving and Standard Bearer 3.0 the lowest, Executioner
5.0 the highest), so no re-pricing was needed. **Elemental Ward is the Vanguard's** and was not touched (stop 3: it keeps
its resistances and life). No re-partnering was asked of the Reaver beyond the two above; the moves the brief listed
(Hot Blood, Spellsword, Executioner, the keystone spurs, Thirsting Blade's bridge) were done in G2 and the border pass.

## 2. The clusters added this round, and why these three

The test I used, from the round's priorities: which three let the user's headline example (the strength sword build:
life, armour, sword damage) be measured this round?

- **(a) the flattest main wants of that example:** armour (20 → 21 units at 120 → 160 in G0) and sword damage (29 → 32).
  One armour cluster in the west and two sword clusters in two other directions, so the sword sits in three directions
  with three partners (Keen Edge's accuracy in the west already).
- **(b) G2's hang points:** all three hang exactly where G2's table put them (`lightBlades.c`/`elementalEdge.b`,
  `east.e2`/`bow.steel.toBlood.c`, `fosse.road.f2`/`festering.b`); Festering stops being a dead end; one deferred border
  link is laid.
- **(c) spread:** west (the Practice Ground), east (the Lists), south (between the Pits and the Fosse): the round tests
  the whole layout.

| ledger id | notable           | lines (units)                                                   | smalls                | where it hangs                                                                                                                                                                                     | file                                 |
| --------- | ----------------- | --------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| RE-4      | **Mended Mail**   | `armour(24)` 2 + `lifeRegen(0.8)` 2 = **4.0**                   | 3 × `armour(12)`      | a straight chain from Light Blades' south small (`lightBlades.c`) to Elemental Edge's small (`elementalEdge.b`) across the open cell: a bridge, a new loop between the crossroad and the west road | `blades.ts` (`yard.blades.mail.*`)   |
| RE-1      | **Darting Steel** | `swordDamage(24)` 2.4 + `weaponSpeed('sword', 8)` 1.6 = **4.0** | 3 × `swordDamage(10)` | a straight chain from the east road's second node (`east.e2`) to the Strider's road (`bow.steel.toBlood.c`): a near crossing                                                                       | `dual.ts` (`yard.dual.darting.*`)    |
| RE-3      | **Bloodied Edge** | `swordDamage(20)` 2 + `leechLife(0.8, ['attack'])` 2 = **4.0**  | 3 × `swordDamage(10)` | a straight chain from the fosse road's second node (`f2`) north-east to Festering's second small (`festering.b`)                                                                                   | `fosse.ts` (`yard.fosse.bloodied.*`) |

Each is notable + three smalls of its lead, two smalls on one side and one on the other, the notable's smalls about 56
to 60 apart on the straight line between its two ends and the rest of the distance on the links out (§11.5). RE-3 sits
in the band between the Pits and the Fosse, which has no label of its own; it is in `fosse.ts` because it hangs from the
fosse road. No new line was needed; nothing in `lines.ts` changed.

**Names** (our own plain words, §2.4): Mended Mail (mail patched between fights), Darting Steel, Bloodied Edge. Each
greps to nothing in `reference/tree/ref-tree.json`; `npx vitest run src/data/ip.test.ts` passes. ("Quick Cuts" was
dropped as an echo of the Strider's Quick Hands and the centre's Quick March.)

**Twins and partners** (steps between notables, scratch BFS on the live tree):

| pair                                            | steps |                                                                           |
| ----------------------------------------------- | ----: | ------------------------------------------------------------------------- |
| Darting Steel – Keen Edge (sword)               |    11 | accuracy / sword speed                                                    |
| Darting Steel – Bloodied Edge (sword)           |     9 | sword speed / leech                                                       |
| Bloodied Edge – Keen Edge (sword)               |    14 |                                                                           |
| Bloodied Edge – Red Harvest (leech)             |     6 | the brief's 6; leech with leech rate / with sword                         |
| Bloodied Edge – Crimson Pact (leech keystone)   |     7 |                                                                           |
| Bloodied Edge – Thirsting Blade (leech)         |    16 |                                                                           |
| Mended Mail – Guarded (armour)                  |    12 | regeneration / evasion (brief: 6+)                                        |
| Mended Mail – Scarred Hide                      |     8 |                                                                           |
| Darting Steel – Crossed Blades                  |     5 | not twins (sword speed / dual crit); the brief's watch item, now 5, not 2 |
| Darting Steel – Hatchet Work (the Ford's speed) |     9 | the crossing's purpose                                                    |

The convergence rule: none pairs life with armour, spell damage with energy shield, or sword with either. Mended Mail
pairs armour with regeneration (recovery, not maximum life, as the brief argued).

**Steps from the Reaver start:** Mended Mail 12, Darting Steel 13, Bloodied Edge 16 (the brief's estimates 11, 12 to 13,
16). Guarded 8 → 9 (its third small), Festering stays 15. Every other Yard notable unchanged.

## 3. Deferred border links laid

- **RE-1 ↔ `bow.steel.toBlood.c`** (the fast sword, `G2/borders.md` §4): `yard.dual.darting.c` – `bow.steel.toBlood.c`,
  written in `dual.ts`. `toBlood.c` takes its fifth link, as the border pass accepted; it leaves 47° from `toBlood.d`.

Not this round: RE-2 ↔ `wall.grit.east.e6` and RE-6 ↔ `bow.steel.hub.t` (their clusters are round 2). No other
cross-region link was added, cut or re-aimed.

## 4. Ids

- **New (13):** `yard.blades.guarded.c`; `yard.blades.mail.a`, `.b`, `.n`, `.c`; `yard.dual.darting.a`, `.b`, `.n`, `.c`;
  `yard.fosse.bloodied.a`, `.b`, `.n`, `.c`.
- **Changed links:** `yard.blades.west.w1`–`guarded.a` is now `w1`–`guarded.c` (and `guarded.c`–`guarded.a` inside the
  cluster). New: `lightBlades.c`–`mail.a`, `mail.c`–`elementalEdge.b`, `east.e2`–`darting.a`, `darting.c`–
  `bow.steel.toBlood.c`, `fosse.road.f2`–`bloodied.a`, `bloodied.c`–`yard.blood.festering.b`.
- **Removed:** none. Stale `why` texts updated where they named a G3 cluster to come (the east road, `e2`, `f2`,
  Festering, the area whys, the Steel Rim wheel).

## 5. What differs from the brief

- **Nothing in placement or partner.** The three clusters sit where G2's hang table put them, with the brief's partners.
- **Smalls' arrangement:** each cluster is a straight bridge (notable in the middle of its smalls) rather than a pocket,
  because each joins two places the brief named; RE-1's two ends are only 295 units apart, so its four nodes fill the
  link at 58 to 60 apart.
- **RE-3 lands on Festering's second small** (G2's table), not its notable: Festering's chain keeps its tip, and a build
  from the Fosse reaches Festering in 3 steps from Bloodied Edge without passing through it.

## 6. Checks

- **`geometry.ts --region reaver --bends`:** crossings 0, drawn over 0. Six bends over 20°, all old shape corners
  (Light Blades', Keen Edge's and Hot Blood's squares, the Twin Fangs and Steel Rim wheels); none new.
- **`passives:audit -- reaver`:** problems 0. Notables in units: all 35 between 3.0 (Weaving, Standard Bearer) and 5.0
  (Executioner); the three new ones 4.0 each, Guarded 3.7, Scarred Hide 4.0. **Ways in (§3.5):** Mended Mail 2
  (`lightBlades.c`, `elementalEdge.b`), Darting Steel 2 (`e2`, the Strider's road), Bloodied Edge 2 (`f2`, Festering);
  Festering goes from 1 way in to 2. The Practice Ground, the Lists, the Pits and the Fosse keep 4 or more links in and
  out each (the audit's area list).
- **`npx tsc --noEmit -p .`:** clean. **`buildAll`:** 0 problems with a `yard.` id. **Names:** the ip test passes.
- **Labels:** by eye on `after.png`: no Yard area name lies over a new notable (Mended Mail sits above the Muster's name,
  Darting Steel east of the Lists' name, Bloodied Edge south-east of the Pits' name). No label moved.

## 7. Walks (by hand, with the scratch walk script on the live tree)

**1. The Reaver's main build, a sword and armour, 20 points.** Quickened Steel (2), Stout Heart (5), Keen Edge (9),
Killing Pace (11), Light Blades (14), then on through Light Blades' south small onto Mended Mail (18). Chose: the west,
sword with accuracy, one-handed damage, armour with regeneration. Gave up: the east's speed (Twin Fangs' entrance,
Fighting Breath) and Scarred Hide (8 steps, life). Before this round the west's armour was only Guarded, off the far side
of the west road; now the sword player who went down Light Blades meets armour on the way, and Guarded (9) is a detour
the other way. No stretch without a choice: every road node from the home onward has a cluster off it.

**2. An off-build: the axe and bleed Reaver, 20 points.** Quickened Steel (2), Stout Heart (5), Guarded (11, three armour
smalls first), Hewing (15), Elemental Edge (18), Mended Mail (21, entered from the elements' side). Chose: armour twice,
the axes, the elements. Gave up: Killing Pace and the bleed diamond (13 steps). Mended Mail is now the axe player's
second armour in one walk with Guarded; that is the west's armour reaching 4 units of armour notables plus 6 smalls by 21
points, which is a concentration to watch (§9). Nobody's notable here is untaken.

**3. A neighbour coming in: a Strider with a sword, from the Strider start.** Darting Steel at 11 (evasion, the Strider's
roads, the Pits road, one sword small), then Hot Blood at 13. Bloodied Edge alone costs 15 (through the Pits road, the
east junction and Festering's poison smalls). Chose: the fast sword next to the Ford. Gave up: the Strider's own Ford
notables beyond `toBlood.c` (Sentry Post, Pitch Arrows) for this walk. A Vanguard coming in for armour reaches Guarded at
9 and Mended Mail at 20 (through Elemental Edge): Mended Mail is a Reaver's armour, not a Vanguard's convenience.

**4. A 120-point strength sword build (life, armour, sword damage, attack speed).** Home and the west: Quickened Steel,
Stout Heart, Keen Edge, Killing Pace, Light Blades, Mended Mail (18), Scarred Hide (21), Four Winds (23), Guarded (28),
Fencer's Eye (32); the south: Red Harvest (36), Bloodied Edge (42); the east: Darting Steel (47), the Ford's Hatchet Work
and Thirsty Quiver (59), Field Dressing (62); the Wall: Oathbound (70), Stone Heart (76), Mortar and Stone (85), Broad
Back and Thick Skin (96). The last 24 points go to resistances and life (Elemental Ward, Weaving, the Ford's life).
Chose: every sword cluster and every armour cluster. **Gave up almost nothing it names.** The bare cost of the sword and
armour notables alone is 36 points for the Yard's (all three swords, both armours, Light Blades) and 70 with the
Rampart's. This is the finding of the round: three directions with three partners spread the sword, but the Yard's
roads are short enough that a finished build still takes all of it (see §8, the allocator agrees: sword damage at 120 is
flat). No notable in the Yard was one nobody would take; Spellsword, Marked Prey and Ceaseless Blades stay the ones the
three home archetypes never take (G1 Reaver brief §4 kept them for builds the archetypes do not cover).

## 8. The allocator (`passives:builds -- --only sword-str,axe-bleed,dual-wield`, indicative)

Other agents were mid-edit, so these mix their changes with mine. Units at 60 → 100 points · 120 → 160 points; "G2" is
the reading just before this round's first edit, "G0" the baseline.

| archetype  | stat                     | G0                | G2 (before)       | after round 1         |
| ---------- | ------------------------ | ----------------- | ----------------- | --------------------- |
| sword-str  | life                     | 24 → 37 · 43 → 53 | 19 → 36 · 44 → 52 | 19 → 27 · 36 → 43     |
|            | armour                   | 18 → 21 · 20 → 21 | 5 → 6 · 20 → 21   | 9 → 28 · **11 → 35**  |
|            | sword damage             | 14 → 16 · 29 → 32 | 22 → 29 · 28 → 32 | 22 → 25 · **40 → 40** |
|            | attack speed             | 5 → 6 · 19 → 21   | 11 → 18 · 17 → 21 | 6 → 6 · 21 → 22       |
|            | choice 60 / 120, tax 120 | 2 / 2, 33%        | 2 / 2, 36%        | **3 / 6, 30%**        |
| axe-bleed  | life                     | 23 → 36 · 38 → 49 | 15 → 29 · 37 → 47 | 12 → 23 · 26 → 37     |
|            | bleed                    | 12 → 12 · 22 → 25 | 14 → 14 · 21 → 24 | 14 → 14 · 24 → 24     |
|            | axe damage               | 7 → 13 · 12 → 16  | 11 → 13 · 12 → 16 | 11 → 13 · 14 → 16     |
|            | choice 60 / 120, tax 120 | 3 / 5, 34%        | 2 / 4, 38%        | 3 / 4, 32%            |
| dual-wield | life                     | 23 → 28 · 33 → 47 | 21 → 27 · 31 → 43 | 21 → 27 · 33 → 49     |
|            | dual wield               | 14 → 17 · 18 → 18 | 12 → 17 · 18 → 18 | 12 → 17 · 18 → 18     |
|            | evasion                  | 15 → 25 · 27 → 27 | 15 → 24 · 26 → 27 | 15 → 19 · 26 → 29     |
|            | choice 60 / 120, tax 120 | 1 / 2, 25%        | 1 / 2, 25%        | 1 / **1**, 26%        |

Reading it:

- **sword-str now trades armour for sword.** Its best 120-point plan takes all the sword (40 units, up from 28) and
  leaves the armour behind (11 units, down from 20), which 40 more points then buy (+24). Choice at 120 went from 2 to
  6 near-equal plans and tax from 36% to 30%. That is the tension the user asked for on one of the pair; on the other,
  **sword damage is flat at 120 (40 → 40)**: a finished build has every sword node there is. The sum of its four main
  stats at 120 is about where it was (109 units in G2, 107 now), so this is choice, not strength by the back door
  (G-growth §4). Strength collected at 120 fell (289 → 184; dexterity 223 → 226).
- **What 40 more points add at 120 (gave-up):** Mortar and Stone (4.5), Broad Back (3.7), Locked Shields (2.5), Steady
  Hands, Thick Skin, Verger, Elemental Ward: three notables of 2.5 units or more (target 3 met; G2 had none above 2.2).
- **axe-bleed:** more bleed and axe at 120 (24, 14), less life; tax 38 → 32%. Its gave-up list is the Wall's armour and
  life. Not much changed by this round, as expected (no axe or bleed cluster was added).
- **dual-wield:** dual wield still flat at 18; choice at 120 fell to one plan. Darting Steel and Bloodied Edge appear on
  its 60-point gave-up list (a two-sword build wants them), so they are pulling, but the build's own want is untouched
  until the RE-7/RE-9 wheel. This is round 2's first job.
- **Against the targets, the three together:** target 2 (at 60, what 40 more points add to the typical main stat)
  **fell from 48% to 30%**, a regression. The cause is sword-str's 60-point plan: it already holds 128% sword damage
  (two of the three sword clusters and two smalls of the third), so from 60 to 100 points it buys armour (9 → 28 units) while sword
  damage (+3 units) and attack speed (6 → 6) stop. The sword is near home enough that a mid-run build has most of it.
  Target 1 (at 120) moved 18% → 14% (sword flat, dual wield flat); target 3 improved (typically 2 notables of 2.5+
  units in the gave-up list, none with none); target 4 mixed (sword-str 6 plans, dual-wield 1); target 5 improved
  (tax 36% → 30%, none above a third).

## 9. Plan for rounds 2 and 3

**Round 2** (the remaining hang points with placeholders or deferred border links, and the dual-wield build):

1. **The RE-7 / RE-9 wheel** (two-handed with life / dual wield with life) on the leg, replacing the placeholder link
   `leg.l1`–`leg.l2`. First, because dual wield is flat (18 → 18) and dual-wield's choice fell to one plan.
2. **RE-2** (sword with shield block) off `toHeadsman.r2`, with the deferred link to `wall.grit.east.e6`. A fourth sword
   direction, for the shield builds only.
3. **RE-6** (evasion with accuracy) between the east gate and `bow.steel.hub.t`, with its deferred link. Evasion is the
   dual-wield build's other flat want.

**Round 3:**

- **RE-8** (bleed with bleed duration) off the spine's bare `s2` to `f5`.
- **RE-5** (attack speed with warcry effect) between the middle road and the second-hand road, 6 steps out: last, so
  the measures say whether the sword build's attack speed still needs it near home (stop 2, question B).
- **From the reserve, if the measures still call for it:** the 120-point walk above takes every sword and armour
  notable for about 70 points, and two of the three sword clusters are already in the 60-point plan (§8). Round 2's
  RE-2 helps only a shield build. If sword damage stays flat after round 2, a further sword cluster on the south-west
  rim reserve (−1170..−670, 4100..4440) with a partner not yet used (sword with life on kill, or sword crit
  multiplier), and the Vanguard's far armour (VA-2, VA-3), are the levers; a third axe cluster for axe-bleed (axe
  14 → 16) is the other reserve candidate.

## 10. Open questions

1. **The sword is still finishable at 120.** With three Yard sword clusters 9 to 14 steps apart, the sword build's best
   plan takes all of them and gives up armour instead, and at 60 points it already has two of the three (target 2 fell
   48% → 30% for the three home archetypes, §8). Is that the trade the user wants (sword or armour), or should the
   sword itself also run out (a fourth and fifth sword cluster farther out, or Keen Edge and Darting Steel a little
   further from home)? I lean to judging after round 2, since the Wall's new armour and RE-2 change the picture.
2. **The west's armour.** Guarded and Mended Mail are 12 steps apart but both a few steps off the west road: an axe
   build collects both by 21 points (walk 2). They have different partners (evasion, regeneration) and sit on opposite
   sides of the west road, so I kept the brief's placement; if the user reads it as one place, Mended Mail could move a
   step or two south toward the Muster in round 2.

Nothing here felt like it was losing intent.

## 11. Checklist against CONSTRAINTS.md

- **§1 Purpose.** The three clusters split the user's example (armour west, sword east and south, each with its own
  partner); the allocator shows sword-str now choosing between sword and armour (choice 2 → 6), the stat sum unchanged.
  The sword still finishing at 120 is reported, not hidden (§10.1). Placed from the brief and the map, never a build
  list.
- **§2 Reference.** No reference names; the three new names grep clean and the ip test passes. Notables 3 to 5 units,
  three smalls each, every small carrying the notable's keyword (§2.5).
- **§3 Network.** Every new cluster is a bridge with two ways in; Festering stops being a dead end; one border link laid
  exactly as deferred, none other touched (§3.7 left for after G3, by the user's decision).
- **§4 Regions.** No area added or renamed; the Yard keeps varied defences (life, armour in two places with two partners,
  evasion, block, dodge, leech, resistances, and stun threshold now on Scarred Hide).
- **§5 Specializations.** Sword in three clusters with three partners, 9 to 14 apart; leech twins 6 and 16 apart; armour
  twins 12 apart; the convergence rule kept (two re-lines remove life with armour near the home). Swords sit in the
  str/dex region (§5.4). Darting Steel and Crossed Blades are 5 apart with different specializations (§5.5 watched).
- **§6 Starts.** Home untouched; the nearest new notable is 12 steps out; Guarded 8 → 9.
- **§7 Roads.** No road node added; every new cluster hangs from a road node or a cluster's small G2 named for it.
- **§8 Clusters.** One stat per small, uniform within each cluster (§8.2); every new small belongs to a notable (§8.7);
  notables 4.0, Guarded 3.7, Scarred Hide 4.0 (§8.6).
- **§9 Keystones.** Untouched (Shieldwall 12, Wound Dance 15, Crimson Pact 15), all dead ends.
- **§10 Vocabulary.** Only existing lines (`armour`, `lifeRegen`, `swordDamage`, `weaponSpeed`, `leechLife`,
  `stunThreshold`), all read by the sheet and the fight; one theme per cluster.
- **§11 Looks.** 0 crossings, 0 drawn over, no new bend; straight chains at 56 to 60 apart; no label over a new notable;
  close-ups rendered.
- **§12 Size.** 161 → 174, an outcome; no bot simulation (the allocator is static).
- **§13 Tensions.** Connections against trade-offs: Darting Steel is a crossing a Strider reaches in 11 (walk 3), priced
  by the Strider's own road; identity against spread: five sword notables in the Yard now, each with a different
  partner, three directions.
- **§14 Rejected ideas.** Nothing generated; positions computed by hand on the line between the two ends and looked at;
  no spacing rule, no step-count reach (steps here are costs and twin distances), no filler.
- **§15 Process.** CONSTRAINTS and every brief read first; before/after pictures and close-ups; geometry, audit, names
  and allocator run; walks written; only the Yard folder edited; no register, bake, commit or stash.
- **§16 Open items touched.** Region size; the Yard's armour supply (two clusters in the Yard now); sword spread.
