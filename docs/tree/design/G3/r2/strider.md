# G3 round 2. The Strider

Done 2026-10-22 for G3 round 2 of [../../G-growth.md](../../G-growth.md), from the round-1 report
([../r1/strider.md](../r1/strider.md), whose "plan for rounds 2 and 3" was the starting list), the user's decisions after
round 1 (CONSTRAINTS §4.8 and the hot-spot fixes), the joined brief ([../../G1-brief.md](../../G1-brief.md)), the region
brief ([../../G1/strider.md](../../G1/strider.md)) and the border pass ([../../G2/borders.md](../../G2/borders.md)).
[../../CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Only `src/data/passives/bow/` was edited; nothing was
registered, baked or committed.

**Pictures** (`strider/`): `before.png` (before the first edit) and `after.png` (the region, box 0,−600 → 4600,3800),
`after-text.png` (the same with every node's lines), `middle.png` (Hot Pursuit, Tall Grass and their road node, with
lines; box 2700,1600 → 3900,2700), `south.png` (the Water Meadows: Field Kit, Fouled Tips, Bright Shafts and the label;
box 900,2300 → 3300,3800), `north.png` (Hardy Stock re-lined; box 2700,−400 → 4100,1000), `home-text.png` (the start and
its first areas, for the §4.8 check). `builds.txt` is the allocator's reading for the three Strider archetypes after the
round.

**Nodes: 188 → 201** (+13: 3 notables, 9 smalls, 1 road node; −1 small, Hardy Stock's `d`). Notables 37 → 40.

## 1. The changes to existing nodes

| node                                       | before                                       | after                                         | units     |
| ------------------------------------------ | -------------------------------------------- | --------------------------------------------- | --------- |
| `bow.home.added.n437` (Round Shield chain) | +4% block with a shield, 10% shield defences | +2% block with a shield                       | 2.7 → 1.0 |
| `bow.home.added.n438` (same chain)         | +4% block with a shield, 10% shield defences | +2% block with a shield                       | 2.7 → 1.0 |
| `bow.rim.hardyStock.a` (Shade side's door) | 5% life                                      | +4% all resistances                           | 1.0 → 1.0 |
| `bow.rim.hardyStock.b`                     | 5% life                                      | +4% all resistances                           | 1.0 → 1.0 |
| `bow.rim.hardyStock.d`                     | 5% life                                      | **removed** (id retired at registration)      |           |
| `bow.rim.hardyStock.e` (road side's door)  | at P(2140,−1645)                             | moved in to d's spot, P(2092,−1618), beside c | 1.0       |

- **Round Shield's chain** is now one section: its three smalls (`n429`, `n437`, `n438`) are each +2% block with a
  shield, and the notable is block and stun avoidance with a shield.
- **Hardy Stock** (the user's hot spot): bow-crit took it at 60 points, four past Ricochet, for seven units of life in
  six nodes. Trimming a road-side small alone would not have touched that, since bow-crit comes in from the Shade side
  (Ricochet → `toRicochet.r4` → `a` → `b` → the notable). So it is four smalls in two sections, as Field Kit's:
  resistances on the Shade side, life on the road side. The cheap approach from Ricochet now pays the notable's
  partner before its life (two units of life for four points, was four); the whole cluster is 4 units of life
  (was 7) and 4 of resistances (was 2). The notable is unchanged (10% life, +8% all resistances, 4 units). The chain
  stays straight; the gap left by `d` went on the link to `j1`.

**Re-measured:** bow-crit no longer takes Hardy Stock at 60 (it is now in the gave-up list at 60 for bow-crit and
bow-poison), and takes it at 120. Life at 60 for bow-crit is 16 → 13 units; at 120, 35.2 → 32.2 (G0 29.2). §3 has the
whole reading.

**Labels.** The user said mid-round (2026-10-22) to ignore area labels for now: they are not gameplay and can be settled
later. The moves below were made before that instruction arrived. They are left as they are, as the coordinator asked,
and no more label work was done. A scratch check of every area label's box against every notable, keystone and start
(and against every other label), whole tree, found three of the Strider's touching, all from before this round, and visible
in `before.png`: the Hedgerows' name over Hedge Magic and Steady Draw, the Thicket's over Arrow Weave. Nudged: the
Hedgerows (1620,140) → (1570,180), the Thicket (2181,1800) → (2130,1800). The check now finds nothing anywhere in the tree.

## 2. The south band: the Water Meadows

`south.ts` (area `bow.south`, the Water Meadows) now holds the band's clusters, so the Ford's file is the Ford again.
This was done before the user's instruction about labels. It is kept because it groups the band's nodes by place,
whatever the label does:

- **Moved from `steel.ts`** with their four links (Sentry Post → Field Kit, Field Kit → `j6`, Pitch Arrows → Fouled
  Tips, Fouled Tips → `m78`), positions unchanged. **Ids changed (10):** `bow.steel.fieldKit.{a,b,c,n,f1,f2}` →
  `bow.south.fieldKit.*`, `bow.steel.fouledTips.{p,n,q1,q2}` → `bow.south.fouledTips.*`. Nothing outside the bow
  folder named them.
- **New:** Bright Shafts (ST-2), below.
- **The road nodes stay in `rim.ts`** (their ids are `bow.rim.road.*`, and `j8` is named from the Reaver's `fosse.ts`).
- **The name stays "The Water Meadows"; the label moved** from (2050,3150) to **(2400,3120)**: over the outer road
  between Field Kit and Bright Shafts. At (2050,3150) its box reached Fouled Tips' frame. No notable, keystone or other
  label under it (the check above; `south.png`).

## 3. The clusters added

Round 2 is about half of the region's remaining clusters (ST-2, ST-3, ST-5 of ST-2 to ST-6), in the order the round-1
report set: ST-2 first, because elemental attacks were flat for bow-elemental, then ST-3 and ST-5 together with the road
node that joins them, so each has two ways in.

| id   | notable (cluster id)                         | lines (units)                                                       | smalls                                                            | hangs                                                                      | steps from the start | twins and steps                                                                                                                                |
| ---- | -------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-2 | **Bright Shafts** (`bow.south.brightShafts`) | 24% elemental damage with attacks, 16% bow damage (2.4 + 1.6 = 4.0) | 3 × 10% elemental damage with attacks                             | pocket straight out from `bow.rim.road.m56a`, square to the road           |                   23 | Fouled Tips 12 (bow), Pitch Arrows 14 (fire attacks), Kill Shot 14 (bow), Rapid Fire 18, Elemental Fletching 23, Longbow 23, Elemental Edge 24 |
| ST-5 | **Hot Pursuit** (`bow.rim.hotPursuit`)       | 20% fervour charge on kill, 10% attack speed (2 + 2 = 4.0)          | 3 × 5% attack speed                                               | straight out from `bow.rim.road.m34`; its tip joins the road node `roof.x` |                   20 | True Aim 13, Stormstruck 14, Fleet Foot 14, Quick Hands 15, Light Hand 15, Hot Blood 19 (fervour)                                              |
| ST-3 | **Tall Grass** (`bow.rim.tallGrass`)         | 20% evasion, 0.8% life regenerated (2 + 2 = 4.0)                    | 2 × 10% evasion (road side), 2 × 0.4% life regenerated (far side) | straight out from `bow.rim.road.j4`; its far side joins `roof.x`           |                   20 | Field Kit 10, Fleet Foot 14, Hard Target 15, Wayfarer 18, Long Breath 19 (regeneration), Weaving 20                                            |
| —    | the road node `bow.rim.roof.x`               | +7 dexterity                                                        |                                                                   | between Hot Pursuit's notable and Tall Grass's far small                   |                    — | —                                                                                                                                              |

Every twin is 10 or more steps away, each with a different partner (§5.1–5.2). Hot Pursuit and Tall Grass are 4 apart,
but they share no specialization (fervour with speed; evasion with regeneration). The convergence rule is not touched
(no spell damage, energy shield or armour).

**The pairings, for players.**

- **Bright Shafts** is the elemental bow's own notable. Elemental Fletching (by home) pairs elemental attacks with
  penetration, and Pitch Arrows is fire alone with area. Its smalls are elemental attack damage, so the elemental archer
  collects its want here, and the crit archer, who wants only the bow damage, finds just the notable worth the walk.
  It sits on the road's south-middle, as the brief placed it, not with Pitch Arrows and Stormstruck in the south
  corner. It is a dead-end pocket, one of the far tips the brief kept (ST-2, ST-4, the ST-6 wheel).
- **Hot Pursuit** is fervour's second home. Hot Blood (the Reaver's Lists, 19 steps) sells the charges themselves: more
  of them, on kill, longer. Hot Pursuit makes its own charges on kill (a charge needs a source, `hasChargeSource`, so a
  notable with only maximum charges would do nothing alone) and pairs them with plain attack speed. Its three
  attack-speed smalls are the ledger's attack speed section, folded in. It is far out on the road's middle, so it adds
  a direction rather than more speed by home.
- **Tall Grass** is the evasive archer's recovery, far from Long Breath (life with regeneration, by home) and Hard
  Target (evasion with life).

**Changed from the brief: Tall Grass has two evasion smalls and two regeneration smalls, not five evasion smalls.** The
brief gave it five, folding the ledger's evasion section ST-s1. With the user's hot-spot guidance of 2026-10-22, that
would be seven units of evasion in one place, two road nodes past the middle spoke that every bow build already pays
for: the same shape as Hardy Stock's life. Built as two sections instead, as Field Kit's: the cheap approach from `j4`
buys the notable and four units of evasion, and the regeneration is the far side's, toward the road node. ST-s1's other
two evasion smalls are not built. They are reserve for round 3 if the evasion reading asks for them. It does not now:
evasion still climbs 25 → 39 units from 120 to 160 for bow-crit.

**Layout** (CONSTRAINTS §11.5; positions computed by a scratch script from the road's own lines, then looked at in
`middle.png` and `south.png`):

- **Bright Shafts** leaves `m56a` square to the road (45°, against the road's run from `j5` to `m56b`). The entrance is
  150 out, the smalls 55 apart, the notable 70 past the last small: the same shape as Kill Shot's.
- **Hot Pursuit and Tall Grass are one loop off the road, a "house":** two walls square to the road from `m34` and `j4`
  (250 apart), the notables at the eaves, and the roof meeting at the road node `x`, outward of the midpoint between the
  notables. Its angles are 90° at `m34` and `j4` (a clean T on the road), 131° at each notable (each turns its chain
  43° toward the apex, where two sections meet), and 81° at the apex. Tall Grass's regeneration smalls lie on its roof
  edge; Hot Pursuit's roof edge is a bare link of 211. `geometry.ts` lists the apex `roof.x` as a 99° bend: it is the
  loop's corner, not a fault (§11.5: "round a ring"). Square walls were chosen over a pentagon or a V, which would
  have left `m34` and `j4` 18° or more off a right angle.

## 4. Deferred border links laid

**None this round.** Of the links `G2/borders.md` §4 defers to G3, the Strider's are ST-9 ↔ `knife.snares.toRicochet.r4`
and ST-9 ↔ `bow.rim.road.j1`, both laid in round 1. RE-6 ↔ `bow.steel.hub.t` and RE-1 ↔ `bow.steel.toBlood.c` hang from
the Reaver's clusters and are the Reaver agent's to write. The audit shows RE-6 has landed: `yard.dual.footwork.c ↔ hub.t`.
No link across a region line was added, cut or re-aimed here.

## 5. Ids

- **New (14):** `bow.south.brightShafts.{s1,s2,s3,n}`, `bow.rim.hotPursuit.{a1,a2,a3,n}`,
  `bow.rim.tallGrass.{e1,e2,n,r1,r2}`, `bow.rim.roof.x`.
- **Changed (10, the move to `south.ts`):** `bow.steel.fieldKit.{a,b,c,n,f1,f2}` → `bow.south.fieldKit.*`;
  `bow.steel.fouledTips.{p,n,q1,q2}` → `bow.south.fouledTips.*`. The old numbers retire at registration.
- **Removed (1):** `bow.rim.hardyStock.d`.

## 6. Checks

- **Geometry** (`geometry.ts --region strider --bends`): crossings **0**, drawn over **0**. Bends over 20°: **13**,
  which is round 1's twelve plus the loop's apex `roof.x` (99°, a ring corner, above). No new chain bends.
- **`tsc --noEmit`**: clean. `prettier --write` on the bow folder.
- **Audit** (`passives:audit -- strider`): problems 0. **Every Strider notable is 3.0 to 5.0 units** (Weathered 3.0
  the lowest; Longbow, Tripwire, Far Flight and Barbed Arrows 5.0 the highest; the three new ones 4.0 each).
  Keystones unchanged: Steady Draw 7, Close Quarters 9, Plated Hide 10, Arrow Weave 11.
  - **Ways in:** Hot Pursuit 2 (`m34`, the road node), Tall Grass 2 (`j4`, the road node). Bright Shafts 1, a single
    pocket (§3.5, as the brief planned). The Water Meadows area has five links in and out. The outer road keeps its
    eight ways in plus the loop.
- **Names:** `npx vitest run src/data/ip.test.ts` passes, and `grep -ci` in `reference/tree/ref-tree.json` finds 0 for
  Bright Shafts, Hot Pursuit and Tall Grass. Racing Pulse was considered for ST-5 and dropped: the old generated tree
  (`src/data/tree/`) uses it.
- **Labels:** the scratch check above finds no label over a notable, keystone or start, and no two labels overlapping,
  in the whole tree.

### The allocator (indicative: other regions are mid-edit), against G0 and round 1

Main stats in units, 120 → 160 points (round 1 in brackets, G0 after it):

| build         | life                                   | evasion                              | bow damage                | crit / elemental attacks / poison         | choice 120 |   tax 120 |
| ------------- | -------------------------------------- | ------------------------------------ | ------------------------- | ----------------------------------------- | ---------: | --------: |
| bow-crit      | 32.2 → 38.6 (35.2 → 46.6; 29.2 → 34.2) | 25.2 → 39 (24.5 → 32.5; 25.6 → 29.9) | 31.4 → 34.4 (31.4 → 34.4) | crit 13.4 → 14.4 (13.4 → 14.4)            |      3 (2) | 22% (23%) |
| bow-elemental | 34.2 → 43.6 (33.2 → 54.6; 31.2 → 34.2) | 27.3 → 35.6 (29 → 32.5; 26.6 → 30.9) | 22.2 → 23.8 (23.2 → 23.2) | ele attacks 6 → 11.4 (6 → 6; 10.4 → 14.4) |      3 (3) | 25% (24%) |
| bow-poison    | 39.6 → 44.6 (42.6 → 47.6; 33.2 → 41.8) | —                                    | 8.2 → 10.4 (8.2 → 17.8)   | poison 12 → 22.5 (11 → 18.2; 11 → 15.3)   |      6 (4) | 28% (28%) |

- **Life at 120 came down for all three** (bow-crit 35.2 → 32.2, bow-elemental 33.2 → 34.2 at about the same, bow-poison
  42.6 → 39.6). bow-crit's life is now 3 units over G0, where it was 6.
  - **Strength by the back door (G-growth §4):** no main stat is collected much more at 120 than in round 1. The
    largest rise is bow-crit's evasion at 60 (10.4 → 17.5), the plan spending the points Hardy Stock no longer takes
    on Wayfarer and the Reaver's evasion. At 120 it is 25.2, level with G0.
- **Growth from 120 to 160** is where this round shows:
  - **Evasion** climbs 55% for bow-crit and 30% for bow-elemental (Tall Grass waits there).
  - **Elemental attacks** for bow-elemental climb for the first time, 6 → 11.4 (Bright Shafts at 160).
  - **Poison** climbs 88% (Fouled Tips).
  - **Choice** at 120 rose for bow-crit (2 → 3) and bow-poison (4 → 6).
- **Gave up at 120:**
  - **bow-crit:** Wiry Frame (3.9), Skewer (2.8), **Tall Grass (2.8)**, Bloodletter, **Hot Pursuit (1.6)**. Its 120-point
    plan goes north (Hardy Stock, Kill Shot); the middle loop is what 40 more points buy. One far direction is taken and
    the other left behind, which is the brief's intent.
  - **bow-elemental:** Wiry Frame (3.9), **Bright Shafts (3.7)**, **Tall Grass (2.8)**, Stout Heart, Hot Pursuit, Light
    Hand.
  - **bow-poison:** Fouled Tips (3.9), Stout Heart, Festering, Snakeskin, Field Kit, Weathered.
- **Elemental attacks are still flat to 140 for bow-elemental (6 units).** Its 120-point plan goes north for Hardy Stock
  and Kill Shot (bow crit, which the archetype weighs at 0.6) rather than south for Bright Shafts, 23 steps out. Its own
  notable is the direction it gives up. That is tension, but the elemental bow's main want is thin before 140 (open
  question 2).
- **Hot Pursuit reads low (1.6 units) because no archetype weighs fervour.** `archetypes.ts` has no `fervour` weight, so
  the allocator sees only its attack speed, as round 1's Kill Shot was seen without its bow crit. It was built as the
  ledger says, not re-lined to suit the tool.

## 7. The home (CONSTRAINTS §4.8)

The areas nearest the Strider start (`home-text.png`) mix offence and defence; none reads as a corridor of one kind.

- **Within three steps:** attack speed (the loop's north side), evasion (its south side), Hawk's Eye (attack damage,
  speed, evasion), Long Breath's life, Clear Head's mana, Vital Aim's crit, Hedge Magic's cast speed.
- **Most defensive patch:** the south-west of the start, between the south hub and the physical road: Wayfarer (evasion
  and resistances) with its evasion smalls on to the Reaver's east gate, and Weathered's resist star (eight
  single-resistance smalls) between the string and the physical row.
  - Both are side pockets and bridges between offensive roads, never a road a build must walk. The south hub's other
    exits are Vital Aim (crit) and the physical road. Every spoke of the star lands on an offensive route: Vital Aim,
    the physical row's junction, the string, the Quick Hands loop.
  - A resist star's variety is its point (§8.2). Re-lining a spoke would break that, and adding offence there would put
    more supply by home (§6.2, §13.8).
- **No change made.** The round's defensive fixes are all far out (Hardy Stock at 15 steps, Tall Grass at 20).

## 8. Walks (CONSTRAINTS §15.2)

The round's clusters are 20 to 23 steps out, so the 20-point walks meet only the re-lines. The 120-point walk is where
the round shows.

**1. The class's main build: the crit archer, 20 points.** Unchanged from round 1, as intended (§6.2, §13.8: nothing new
near the start):

- **Path:** Hawk's Eye (2), Long Breath (4), the north hub and the bows road to the bow hub, the bow side of the fork to
  **Longbow** (11), the fourth junction and **Steady Draw** (14), back through the loop's south side to the south hub
  and **Vital Aim** (19), one crit small (20).
- **Chose:** bow speed, the big bow keystone, crit, a little life.
- **Gave up:** Wayfarer, Elemental Fletching, Hard Target, Light Hand, Wanderer.
- No stretch without a choice; no notable nobody takes.

**2. An off-build: the dexterity sword and board, 20 points.**

- **Path:** Long Breath (3), its small, the two shield smalls (now +2% block each) and **Round Shield** (7), its north
  small, the one-handed small and **Light Hand** (10), back along the bows road to the fork's sword side, **Fleet Blade**
  (17), Hawk's Eye, then **Wanderer** by its all-attributes small (20).
- **Chose:** shield block (5 + 2 + 2 + 2 = 11% with a shield, where round 1's smalls made it about 15%, with shield
  defences on the side) and stun avoidance with a shield, one-handed and sword damage, attributes.
- **Gave up:** Vital Aim, Hard Target, Fleet Foot, every bow notable.
- The shield chain is now one stat at a small's size, so the porch no longer reads as the strongest thing by home.

**3. A neighbour coming in: the Shade's dodger, 20 points from the Shade start.**

- **Path:** its south road, Snakeskin (7) on the way, the trap wheel's life small, to the road toward Ricochet (12).
- **The pick there:** **Tumble** (15: dodge and stun avoidance) and on to **Veiled Herald** (20), or straight on through
  Hardy Stock's two resistance smalls to **Hardy Stock** (18) and its two life smalls (20).
- **The Hardy Stock side now gives** 20% life and 16% all resistances, where round 1 gave 30% life and 8%. The Shade's
  south still finds its life here, but pays resistances first: dodge against life and resistances is still a real choice
  at the same junction.

**4. A late build: the crit archer, 120 points** (the allocator's best plan, read by hand).

- **Takes inside the region:** every bow and projectile notable of the inside (Longbow, Steady Draw, Far Flight, Split
  Volley, Ricochet, Heavy Draw, Rapid Fire), the attack-speed string (True Aim, Quick Hands, Fleet Foot), Hard Target,
  Wanderer, Light Hand, Wayfarer, Vital Aim, Long Breath.
- **Then the north direction:** **Hardy Stock** and **Kill Shot**.
- **Across the borders:** Soft Step, Keen Instinct, Thick Blood (the Shade); Footwork, Weaving, Quickened Steel, Iron
  Draw, Scarred Hide, Four Winds (the Reaver).
- **Gave up:**
  - **The middle direction:** **Tall Grass** and **Hot Pursuit**, eight points down the middle spoke and the road
    (evasion with regeneration, attack speed). They come at 160.
  - Skewer and Barbed Arrows, Wiry Frame, Bloodletter.
  - **The south direction:** Bright Shafts, Field Kit, Fouled Tips, never wanted enough.
- **The choice at 120 is between directions of the outer road:** north (life with resistances, the crit bow) or the
  middle (evasion with regeneration, speed with fervour). That is what the brief asked the far band to do.
- **Stretches with no choice:** the middle spoke's `x` → `s` → `j3` → `m34`. But `x` is a junction (Barbed Arrows,
  Skewer), `j3` the middle spoke's landing, and `m34` and `j4` each a cluster, so every node there offers a branch.
- **Notables nobody of the three takes by 160:** none of the new ones. Tall Grass and Hot Pursuit are taken at 160 by
  bow-crit and bow-elemental, Bright Shafts by bow-elemental, Fouled Tips and Field Kit by bow-poison.

## 9. Plan for round 3

- **ST-6**, the traps-or-mines wheel on `m12`, outward, between Hardy Stock's end and Kill Shot.
- **ST-4**, lightning attacks with shock, on `m67`, 6 or more steps from Stormstruck. It gives the south road its last
  branch.
- **Kill Shot's crit chance chain (ST-s5)**, laid as a bridge outward to the next cluster, not back to `j3`. Candidates:
  ST-6's wheel (north), or a road node from Kill Shot down to Hot Pursuit's roof (south), which now exists to land on.
  Whichever reads straight at both ends.
- **Reserve, only if the readings ask:** ST-s1's two evasion smalls (not built on Tall Grass, §3).
- **Carry forward:**
  - bow-elemental's elemental attacks before 140 (question 2).
  - Life at 120 for the bows, now 32 to 40 units against G0's 29 to 33.

## 10. Open questions

1. **Tall Grass with two evasion and two regeneration smalls** instead of the brief's five evasion smalls (§3), for the
   user's "in one place" hot-spot guidance. Fine, or build the other two (ST-s1) in round 3?
2. **Bright Shafts is 23 steps out**, and the elemental bow's 120-point plan goes north instead. Its main want, elemental
   attacks, stays at 6 units until 140. Leave it as a far direction the build gives up? Or move ST-2 two steps in
   (hung from `j5`, beside the south spoke), so the elemental bow reaches its own notable by 120?
3. **No archetype weighs fervour** (`scripts/passives/archetypes.ts`), so Hot Pursuit counts as attack speed only.
   Should a dexterity attacker archetype weigh `fervourOnKill` and `maxFervour` at about 0.5? That is not a file this
   round may edit.
4. **Hardy Stock's Shade crossing** ("life for the Shade's south") now gives the Shade's 20-point walker 20% life and 16%
   resistances, where it gave 30% and 8%. Acceptable for the bow hot-spot fix, or should the life be on the Shade side
   and the resistances on the road side, which would undo the fix for bow-crit?
5. **Labels:** none. The three label moves (the Water Meadows, the Hedgerows, the Thicket; §1–2) were made before the
   user's instruction to ignore labels, and are left as they are for the later pass.

Nothing in this round felt like it was losing intent. The one place I weighed the brief against the user's newer
guidance was Tall Grass's evasion (§3), and I said so rather than building five smalls by default.

## 11. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.**
  - Each new cluster is a far direction with its own partner: the elemental bow, fervour with speed, evasion with
    regeneration.
  - The hot spot is fixed by making the cheap approach pay the partner, not by distance (no tax added).
  - Choice at 120 rose for bow-crit and bow-poison.
- **§2 The reference.** Twins 10+ steps; names our own (ip test, grep); the reference game is not named.
- **§3 A network.** Hot Pursuit and Tall Grass are one loop, each with two ways in; Bright Shafts is a single pocket, one
  of the brief's far tips. No link across a region line changed, and no deferred link was due.
- **§4 Regions and areas.**
  - The Water Meadows is a place name and holds its band's clusters.
  - Varied defences on the outer road now: life, resistances, evasion, regeneration, flasks.
  - The home check (§7): mixed, no corridor of one kind.
- **§5 Specializations.** Partners and twin steps in §3's table. Elemental attacks get a third Strider direction (with
  bow damage). Fervour gets its second home. Neighbours compete: Hot Pursuit and Tall Grass are different wants.
- **§6 Starts.** Nothing within 14 steps changed except the approved shield smalls, which are lowered, not raised.
- **§7 Roads and attributes.** One road node, `roof.x` (+7 dexterity), between two clusters (§3.4). Bare road nodes left:
  `m23b`, `m56b`, `j7`. No run of more than two without a branch.
- **§8 Clusters and smalls.**
  - Each notable 4.0 units, with its own smalls.
  - Every section uniform: Bright Shafts' three elemental, Hot Pursuit's three attack speed, Tall Grass's two evasion
    and two regeneration, Hardy Stock's two resistances and two life, Round Shield's three shield block.
  - Every new small belongs to a notable (§8.7).
- **§9 Keystones.** Untouched, each one link; distances unchanged.
- **§10 Vocabulary.**
  - Only lines in `lines.ts` (new to the region: fervour on kill, life regeneration on smalls). `lines.ts` untouched.
  - One theme per cluster; every line is live (Hot Pursuit carries its own charge source).
- **§11 Looks.**
  - 0 crossings, 0 drawn over; the one new bend is the loop's apex.
  - Chains straight, square to the road. The loop is a regular house shape with clean angles at the road.
  - Smalls 70 then 55 apart.
  - Labels: no label over a notable or another label in the whole tree. Pictures before and after.
- **§12 Size.** +13 nodes (188 → 201); one small removed where it improved the tree. No simulation: the allocator is a
  static tool.
- **§13 Tensions.**
  - Tension against the brief's supply (Tall Grass's evasion), said in §3.
  - Bridges against dead ends: Bright Shafts left a far tip.
  - Shapes against the brief's sketch: the loop's square walls over the sketch's diagonal ones.
- **§14 Rejected ideas.**
  - Positions computed by a script from the road's lines; every cluster looked at; nothing generated.
  - No step-count reach (steps here are costs and twin distances); no new rule.
- **§15 How the work is done.**
  - CONSTRAINTS and every brief read first; the advisor consulted before editing.
  - Pictures before the first edit and after; geometry after each batch.
  - Only the bow folder edited; no register, bake, commit or stash; no full vitest.
- **§16 Open.** Keystone distances unchanged; no border change; size +13; dexterity supply at 120 about the same (282 to
  283 for the bows), still over the gear (G5's check).
