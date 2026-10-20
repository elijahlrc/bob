# Network audit: §3, §6, §7, §9.1–2, §11, §13 (1, 4, 5, 7, 8)

> Copied into the repo on 2026-10-20 from the session scratchpad. The renders (`all.png`, `<region>.png`, `net-box-*.png`), listings and scripts (`../net/*.ts`, `*.ts`) it refers to stayed in the scratchpad and are not in the repo. The network has changed since: see `../E-audit-pass.md`.

Audited 2026-10-20 against `docs/tree/design/CONSTRAINTS.md`, on the network as built by `buildAll({ allowNew: true })`
(732 nodes, 924 links; `edits.json` is empty, so nothing is pending). Read-only: nothing under `src/` or `docs/` was
changed.

**What I looked at.** Fresh renders in this folder: `all.png` (whole map), `mystic.png`, `vanguard.png`, `reaver.png`,
`shade.png`, `zealot.png`, `strider.png`, and two close-ups with ids, `net-box-yard.png` (the Yard centre) and
`net-box-wall.png` (the Wall's west towers). The scripts behind every number are in `../net/` (`attr.ts`, `skel.ts`,
`roads.ts`, `starts.ts`, `keys.ts`, `cross.ts`, `seam.ts`, `loops.ts`, `supply.ts`, `labels.ts`, `geom.ts`,
`pockets.ts`, `density.ts`, `bend.ts`, `home.ts`). Run them with `npx tsx <abs path>` from `E:/Proj/Auto`.

**Two caveats.**

- The Strider (`src/data/passives/bow/`) is the user's edit (§15.9). Findings there are kept in their own subsection
  (§S) and rated low or medium. The Strider is also the one region with a real attribute skeleton, so it is the
  evidence for the §7.4 question below.
- §6.5 against §6.3 and the §7.4 arithmetic are **questions for the user**, not verdicts. Both block a fix.

Severity: **H** (breaks a constraint or blocks other work), **M** (clearly against a constraint, local fix), **L**
(polish or borderline).

---

## Top findings (the summary returned to the caller)

| #   | Sev   | Section      | Finding                                                                                                                                                                                                                                                                                                                                                        |
| --- | ----- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | H     | §7.2, §16    | Outside the Strider, the network has no attribute roads. 38 of 46 attribute nodes in the four regions without roads (Mystic, Vanguard, Reaver, Zealot) stand alone, and the only attribute highway leaving any home is the centre ring.                                                                                                                        |
| 2   | H / Q | §7.4         | +20 nodes, a 13.6% share and about +3 per point cannot all hold once real roads exist. The Strider, the one region with roads, supplies about 10 dexterity per point. At 20 points the greedy build gives the Strider +120 dexterity against +40 for the Mystic and Vanguard.                                                                                  |
| 3   | H     | §3.2, §3.7   | The Mystic has no near crossing. Without the ring, start to start is 26 steps to the Shade and 22 to the Zealot. All four of its crossings sit at far tips.                                                                                                                                                                                                    |
| 4   | H     | §11.2–3      | A 1,490-unit link, `wall.grit.j1.a`–`yard.blood.toWall.b`, cuts diagonally across the south-west of the map and through "The Practice Ground" label.                                                                                                                                                                                                           |
| 5   | M     | §11.4        | Ten area labels sit away from their own areas: seven over other areas ("The Lists", "The Muster", "The Gate", "The Battlements", "The Bow Gate", "The Hedgerows", "The Column") and three in empty space ("The Practice Ground", "The Bell Tower", "The Pits"). "The ring" and "The inner ring" overlap at (0,0), and "The Battlements" overlaps "The Vestry". |
| 6   | M     | §11.3        | There are sparse bands and voids: the 1,500–2,000 band in the Mystic and Zealot sectors is about half the density of their neighbours, there is a Bell Tower void at (−2639,−1668), two voids flank the Fever Pitch spine, and four voids sit in the Wall.                                                                                                     |
| 7   | M     | §9.1         | 8 keystones sit on a through-route, not at the end of a spur. 3 hang off a cluster node instead of a junction. 5 fall outside 8–18 steps, and all four Strider keystones are 7–11 steps away.                                                                                                                                                                  |
| 8   | M     | §11.3        | Long spokes: `column.fork` (607 ×2), `column.j1`–`craft.focus.b` 571, `fire.jArm`–`well.manaTap.n` 594, `maces.weight.b`–`slams.thunderstep.c` 583, and nine hub–ring links of 528–537 (the Strider's are 261–336).                                                                                                                                            |
| 9   | M     | §3.5, §13.5  | Dead ends have nearly disappeared. In the Mystic, Shade, Reaver and Zealot, no notable cluster is entered at one node, against 79% in the reference.                                                                                                                                                                                                           |
| 10  | M     | §6.2, §13.8  | The Mystic's first points are all spell stats, and the Vanguard's are all melee physical stats.                                                                                                                                                                                                                                                                |
| 11  | M     | §7.4         | Off-attribute is 4–5 steps from a pure start (the target is 8–10). The ring's hybrid nodes sit two ring steps from each pure hub.                                                                                                                                                                                                                              |
| 12  | M     | §13.1        | The Yard centre is a lattice: 12 direct links between areas, and every notable can be entered two or more ways. The Wall–Yard border has three near crossings within about three nodes of each other.                                                                                                                                                          |
| 13  | Q     | §6.3 vs §6.5 | In all six starts the signature notable is 2 points out. §6.3 (from the user's Strider) implies this, but §6.5 asks for first notables three or four points out.                                                                                                                                                                                               |
| 14  | L–M   | §11.2        | Nodes that look as if they sit on a link: `wall.home.unshakable.b` (6 units), `bow.steel.wayfarer.a` (9). Notable names overlap in 15 pairs, and area labels sit over names in 8 places.                                                                                                                                                                       |
| 15  | L–M   | §7.3, §13.4  | Stretches with nothing branching off: `spire.craft.mistWalk`→`devotion` (6 nodes), the Stair spine (9 nodes, 2 branches), and the three-node home roads in the Spire, Cathedral and Knife.                                                                                                                                                                     |

---

## §3 It is a network, not a tree

### 3.1 Loops per region — informational

| region    | nodes | internal links | independent loops | loops per 100 nodes | mean degree | non-keystone leaves                                                        |
| --------- | ----- | -------------- | ----------------- | ------------------- | ----------- | -------------------------------------------------------------------------- |
| Mystic    | 139   | 174            | 36                | 25.9                | 2.56        | 0                                                                          |
| Shade     | 80    | 93             | 14                | 17.5                | 2.42        | 0                                                                          |
| Strider   | 143   | 164            | 22                | 15.4                | 2.37        | 6 (Longbow, Sure Shot, Far Flight, Barbed Arrows, Deep Cuts, Hatchet Work) |
| Reaver    | 119   | 153            | 35                | 29.4                | 2.68        | 0                                                                          |
| Vanguard  | 121   | 152            | 32                | 26.4                | 2.60        | 1 (Stagger)                                                                |
| Zealot    | 88    | 102            | 15                | 17.0                | 2.42        | 0                                                                          |
| whole map | 732   | 924            | 193               | 26.4                | 2.52        | —                                                                          |

The reference (B-poe §2) has 1,612 nodes and 1,858 links, which is 15 loops per 100 nodes and a mean degree of 2.31. Bob
has 1.7 times as many loops per node, so §3.1 holds everywhere. **The loops are spent locally, inside regions,** as
wheels and lattices, not on crossings: the whole map has 18 links between regions (§3.4). See §13.1.

### 3.2 Notable clusters with one way in, and dead ends — M (§3.5, §13.5)

There are 5 single-entry notable clusters, where removing one outside node cuts the cluster off from every start:
`wall.grit.unbroken` and `wall.grit.heavyHands` (both behind `wall.grit.j1.a`), `bow.bows.wheel` (behind
`bow.bows.hub.b`), `yard.blood.thirst` (behind `yard.blood.j2.a`) and `cathedral.crypt.shrine` (behind
`cathedral.crypt.jV.a`).

Notable clusters entered at exactly one node (from `pockets.ts`):

| region   | notable clusters | entered at one node | entered at 3+ nodes |
| -------- | ---------------- | ------------------- | ------------------- |
| Mystic   | 31               | 0                   | 14                  |
| Shade    | 11               | 0                   | 4                   |
| Strider  | 25               | 1                   | 9                   |
| Reaver   | 26               | 0                   | 11                  |
| Vanguard | 26               | 1                   | 13                  |
| Zealot   | 11               | 0                   | 7                   |

In the reference, 79% of clusters attach at one node (72% have a single leaving link), and its notable is a dead end 45% of the time. The user wants most
pockets to be bridges, with "some dead ends fine". Bob has gone almost to "every pocket is a bridge", which §14 rejects
as an absolute. In the Mystic, Shade, Reaver and Zealot, not one notable is a far tip a player commits to.

**Fix.** In each region, turn 3–5 clusters at the rim back into dead-end pockets: drop their second link, or move it to
the road. Good candidates are clusters whose second link is a direct link to another cluster:

- `spire.craft.devotion` (drop `devotion`~`hexwright`)
- `spire.frost.harshWeather` (drop the link to `storm.overcharge.n`)
- `yard.dual.crossedBlades` (drop one of its three links)
- `wall.slams.groundShaker` (drop `groundShaker.a`~`maces.greatweight.n1`)
- `cathedral.nave.vigil`

### 3.3 Dead-end count — L

There are 27 keystone leaves and 7 notable leaves. That is low against the reference's 13% dead ends. It is the same
problem as §3.2.

### 3.4 Crossings between regions — H for the Mystic, M otherwise

There are 18 links between regions, at about 13 distinct places (`cross.ts`). The `why` behind each one:

| pair            | links | where, and the build it serves                                                                                                                                                                                                                                                                   |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mystic–Shade    | 2     | `spire.craft.hexwright.n`–`knife.hex.wheel.n`: near, for the curse caster and the crit-spell Shade. `knife.hex.toSpire.b`–`spire.storm.painConduit.b`: a dear road to the lightning arm, for the lightning Shade and the low-life Mystic.                                                        |
| Mystic–Zealot   | 2     | `cathedral.choir.wheel.c5`–`spire.well.draught.n`: notable to notable, for the summoner and the Mystic's flasks. `cathedral.crypt.toSpire.b`–`spire.fire.familiars.n`: a dear road, for the minion Mystic and the fire-caster Zealot.                                                            |
| Shade–Strider   | 2     | `bow.bows.toKnife.a`–`knife.home.softStep.b`: near, for the dagger Strider and the evasion Shade with a bow. `bow.flight.toKnife.a`–`knife.snares.toBow.a`: dear, for chaos and poison bows.                                                                                                     |
| Strider–Reaver  | 5     | Four links land on the single node `yard.dual.j2.a` (degree 6), all "Added in the editor". The fifth is `bow.steel.toBlood.e`–`yard.blood.j2.a`, a dear road for bleed and leech Striders.                                                                                                       |
| Reaver–Vanguard | 4     | `yard.home.fieldDressing.b`–`wall.slams.thickSkin.b` (armour and flasks), `yard.blades.j1.a`–`wall.slams.j2.a` (the axe Vanguard and the two-hand Reaver), `yard.blades.guarded.b`–`wall.slams.thunderstep.b`, and `yard.blood.toWall.b`–`wall.grit.j1.a` (a dear road, for Blood Rite Reavers). |
| Vanguard–Zealot | 3     | `cathedral.home.hubs.w`–`wall.resists.banner.n` (the aura class's first reservation), `wall.resists.j.a`–`cathedral.nave.toWall.a` (shields and block), and `wall.resists.scarTissue.n`–`cathedral.rods.toWall.a` (a dear road, for the fire two-hander).                                        |

14 of the 18 links have a written build intent. The other four are the Strider→Reaver links onto `yard.dual.j2.a`,
whose `why` says only "Added in the editor"; they are the user's own (§15.9). The problems are where they sit and how
they are spread:

- **H: the Mystic is cut off from both neighbours near home.** From `seam.ts`, start to start is 8 steps through the
  ring for every neighbour pair. Without the ring it is 26 steps Mystic–Shade and 22 Mystic–Zealot, against 8–14 for
  every other pair. All four Mystic crossings sit at the Spire's far tips (Hexwright, Pain Conduit, Draught, Familiars).
  The seams beside the Spire's home are empty. `gaps.ts` finds a hole at (742,−1551) between `spire.craft.insight` and
  `knife.home.spoils` (343 apart), and one at (−1050,−1520) between `spire.well.wandwork` and `cathedral.home.hymn`.
  - **Fix:** add a near bridge of one or two nodes at each seam: Scriptorium to Knife Gate (`craft.insight`↔
    `knife.home.spoils` or `knife.edge.thickBlood`), and Cloister to Cathedral Gate (`well.wandwork`↔`cathedral.home.hymn`
    or `choir.wheel.c1`). Give each the intent the brief names for that pair. Put them in `spire/craft.ts` and
    `spire/well.ts`, or in the neighbour's file.
- **M: the Reaver–Vanguard near crossings are bunched.** Three of the four sit within about three nodes of each other on
  the border: `fieldDressing.b`–`thickSkin.b` is 110 units, `guarded.b`–`thunderstep.b` and `blades.j1`–`slams.j2` are
  next to it. The Reaver's armour pocket and the Wall's slams nearly merge, and there is no other near place on that
  border.
  - **Fix:** keep the junction-to-junction link `blades.j1.a`–`slams.j2.a`. Drop either `fieldDressing.b`–`thickSkin.b`
    or `guarded.b`–`thunderstep.b`, and spend the link further out on the border.
- **M: Warlord's Banner sits closer to the Zealot than to the Vanguard.** `wall.resists.banner.n` is 3 steps from the
  Zealot start and 5 from the Vanguard start (`starts.ts`), so the Vanguard's aura notable is in practice part of the
  Zealot's home. That may be intended ("the aura class buys its first reservation from the neighbour"), but the
  Vanguard then has no reservation pocket of its own near home.
  - **Fix:** either accept it and write it into the brief, or move the `hubs.w` link to Banner's far small (`banner.a`).
- **L: non-neighbour pairs connect only through the ring.** Without the ring, Mystic–Reaver is 20 steps, Shade–Vanguard
  22 and Zealot–Strider 27. §3.7's dear bridges are between far _areas_, not far regions, so this is not a breach. It
  does mean that every late build leaving its neighbour pair goes back through the centre.
- **L, stale `why`s:** `bow/bows.ts` cluster `toKnife` and `bow/flight.ts` cluster `toKnife` still say "the Knife is
  not written yet".

### 3.5 Clusters connected directly — M (§3.4, §7.2)

Direct links between clusters of **different areas** (`skel.ts`): Mystic 8, Vanguard 11, Reaver 12, Strider 8, Zealot 4,
Shade 0. Direct links between clusters within one area: Mystic 21, Vanguard 16, Reaver 12, Strider 16, Zealot 3, Shade 4.
§3.4 allows direct links, but here they are the main way areas join (see §7). Each direct link between areas marks a
place where a road should run instead. They are listed per region in §7.1.

---

## §6 Starts and homes

`starts.ts` and `home.ts`. Every start touches two stat nodes. From each one, the hub (+20 or +15/+15) and the signature
notable are reached at step 2. The hubs join the ring at the nodes either side of the axis, and each hub has a pocket.
So the §6.3 pattern holds in all six.

| class    | ways out of the 2-step ball                 | first notables beyond the signature           | weapon or shield within 3                                  | first off attribute                    |
| -------- | ------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| Mystic   | 6 (2 to the ring, 2 pockets, 2 small roads) | Still Mind, Sharp Mind @4                     | none                                                       | ring `r2`/`r22` (+10/+10) @4           |
| Shade    | 7                                           | Spoils, Soft Step @4                          | none (claw @5, `knife.edge.wheel.w2`)                      | str @8 (ring `r10`, `r22`)             |
| Strider  | 10                                          | Long Breath, Clear Head @3                    | none (bow @5, Twin Fangs @5)                               | ring `r10` and `yard.dual.j2.a` @4     |
| Reaver   | 7                                           | Stout Heart, Buckler @4                       | `yard.home.block.a` +3% block with a shield @3; Buckler @4 | int via Well Rounded @4–5; ring int @9 |
| Vanguard | 8                                           | Unshakable, Quartermaster @4                  | none                                                       | ring `r13`/`r19` @5                    |
| Zealot   | 7                                           | Warlord's Banner (a Wall notable) @3, Hymn @4 | `cathedral.home.roadW.a` +3% block with a shield @3        | dex @8                                 |

### 6.1 Ways out — pass

Every start has at least 6 exits from its 2-step ball (§2.5 asks for at least 4).

### 6.2 The signature notable at 2 points — question for the user (§6.3 against §6.5)

All six signature notables sit 2 points out: First Light, Keen Instinct, Hawk's Eye, Quickened Steel, Oathbound, Zeal.
That is inherent in the §6.3 pattern, which is derived from the user's own Strider: the start touches the two sides of a
loop whose notable closes it. §6.5 asks for first notables three or four points out. **Ask which reading stands.** If
§6.5 wins, the signature loop would need a third small (start→a→b→notable). If §6.3 wins, add a note to §6.5 that the
signature notable is exempt. Outside the signature, the first notables are at 4 everywhere except the Strider (3) and
the Zealot's borrowed Warlord's Banner (3).

### 6.3 The first points commit the Mystic and the Vanguard to one family of build — M (§6.2, §13.8)

- **Mystic** (`spire/home.ts`): `sig.b` gives spell damage 8; First Light gives spell damage 10, mana, int and ES. The
  pockets are Sharp Mind (spell crit 30 and spell crit multi) and Still Mind (mana regen). The roads are `roadE` (cast
  speed ×3) and `roadW` (ES ×3). §5.7 names wand attacks and minions as Spire builds the user wants. Within 5 points,
  those builds find only the mana and ES nodes useful.
- **Vanguard** (`wall/home.ts`): `sig.b` gives melee physical 10, Oathbound melee physical 10, `roadM` melee physical
  ×3 and `roadS` melee area ×2. There is no route for the totem, caster or Strongarm thrower Vanguard that does not
  start with melee nodes.
- The other four homes are generic enough: crit, evasion and ES (Shade), attack (Strider), elemental damage, armour and
  life (Zealot). The Reaver leans melee, which suits it.
- **Fix:** swap one home road or signature side to a delivery-neutral stat. Mystic: make `sig.b` mana or ES, or make
  `roadE` "damage" or "cast and attack speed". Vanguard: make `roadM` life or armour, and keep melee on the `roadS` porch.
  Optional specific porches stay (§6.4).

### 6.4 Shields within three steps — L

`yard.home.block.a` (Reaver, d3) and `cathedral.home.roadW.a` (Zealot, d3) are "+3% block with a shield". A shield is
not a weapon, but taking it is still a gear commitment. This is borderline under §6.3. If the user reads shields as
weapons, move each shield road one step further out.

---

## §7 Roads, highways and attributes

### 7.1 The road skeleton, per region (the known §16 item, quantified) — H

**How notable clusters are classified** (`skel.ts`):

- **ROAD:** touches an attribute node that is part of a run of at least two in its region, or a crossing road.
- **JUNCTION:** touches only lone attribute nodes.
- **HUB:** touches only a home hub.
- **SMALL ROAD:** touches only a non-attribute road (the home roads).
- **DIRECT:** touches only other clusters.

| region   | attribute nodes | standing alone | links between two attribute nodes | ROAD  | JUNCTION | HUB | SMALL ROAD | DIRECT |
| -------- | --------------- | -------------- | --------------------------------- | ----- | -------- | --- | ---------- | ------ |
| Mystic   | 11              | **11**         | 0                                 | **1** | 19       | 3   | 0          | 8      |
| Vanguard | 9               | **9**          | 0                                 | **2** | 13       | 3   | 3          | 5      |
| Reaver   | 12              | 9              | 1                                 | 4     | 13       | 3   | 1          | 5      |
| Zealot   | 14              | 9              | 0                                 | 2     | 5        | 2   | 1          | 1      |
| Shade    | 14              | 5              | 4                                 | 7     | 1        | 2   | 1          | 0      |
| Strider  | 23              | 0              | 13                                | 20    | 0        | 0   | 1          | 4      |

**Outside the Strider, the only attribute highway leaving any home is the centre ring.** For the Mystic, Vanguard and
Zealot, the ring's attribute component contains only their two hubs. Each region is described below.

**Mystic** (`src/data/passives/spire/*.ts`; render `mystic.png`)

- **Attribute nodes**, all standing alone:
  - `home.hubs.w`/`e`
  - `well.j1.a` (degree 5)
  - `craft.j1.a` (4)
  - `column.j1.a` (5)
  - `column.fork.a` (6)
  - `fire.jArm.a` (4)
  - `frost.jFire.a` (3)
  - `frost.jStorm.a` (2)
  - `frost.jArm.a` (2)
  - `storm.jArm.a` (4)
- **What hangs off what:** 19 clusters hang off one of these lone junctions. 8 connect only directly: Quickening,
  Siphon, Withering, Lingering, Harsh Weather, Wand Volley, Frugal, Devotion. Familiars is the only cluster on a road,
  and that road is the Zealot's `crypt.toSpire`.
- **No skeleton:**
  - From home to the Cloister and the Scriptorium, the roads are small-node roads: `home.roadW` (ES ×3) and
    `home.roadE` (cast speed ×3). They cross the hollow "Spire gate" band and branch only once each, at `roadW.a` and
    `roadE.a`.
  - From `well.j1`/`craft.j1` to `column.j1` there is no road. The way runs through the smalls `well.spiritWard.b` and
    `craft.focus.b`.
  - From `column.fork` to the three arms the links are long (607-unit links to `fire.hoarfrost.a` and
    `storm.flashpoint.a`).
  - Along the rim, the arms are linked only through cluster smalls (`fire.hoarfrost.c`→`frost.jFire`,
    `frost.thunderhead`, `frost.jStorm`→`storm.flashpoint.c`).
- **Long stretches with nothing off them:**
  - `craft.mistWalk.n`–`b`–`a`–`devotion.n`–`b`–`a`: 6 nodes, all degree 2.
  - The shortest path to Wand Volley crosses 10 nodes with no intelligence.
- **Fix:** make `roadW` and `roadE` intelligence roads (hub → 2 int → `well.j1` / `craft.j1`), with the Still Mind,
  Sharp Mind, Deep Well and Arcane Focus pockets hanging off them. Then:
  - add an inner cross road `well.j1`–(int)–`column.j1`–(int)–`craft.j1`;
  - replace the `column.fork` spokes with int roads of 1–2 nodes to `fire.jArm`, `frost.jArm` and `storm.jArm`;
  - re-hang the 8 direct-only clusters off these roads.

**Vanguard** (`src/data/passives/wall/*.ts`; `vanguard.png`, `net-box-wall.png`)

- **Attribute nodes**, all standing alone:
  - `home.hubs.n`/`s`
  - `rampart.j1.a`
  - `resists.j.a`
  - `maces.j1.a`
  - `maces.j2.a` (degree 2; it only leads to Rooted Stance)
  - `slams.j1.a`
  - `slams.j2.a`
  - `grit.j1.a`
- **Small-node home roads:** `roadR` (armour ×2), `roadM` (melee physical ×3), `roadS` (melee area ×2).
- **What hangs off what:** 5 clusters connect only directly: Crushing Blow, Unhurried, Vampiric Strikes, Ground Shaker,
  Stagger. There are 11 direct links between areas, among them `maces.weight.b`–`slams.thunderstep.c` (583 units) and
  `maces.greatweight.n1`–`slams.groundShaker.a`.
- **No skeleton:**
  - Nothing joins the west towers: `rampart.j1`, `maces.j1` and `maces.j2` are not linked to one another.
  - Nothing joins the south: `slams.j1`, `slams.j2` and `grit.j1` are not linked either.
- **Fix:** a west strength road `hubs.n`→`rampart.j1`→`maces.j1`→`maces.j2`, and a south road
  `hubs.s`→`slams.j1`→`slams.j2`→`grit.j1`, each 1–3 nodes between junctions. Hang the clusters from them, and drop the
  583-unit Weight of Iron–Thunderstep link.

**Reaver** (`src/data/passives/yard/*.ts`; `reaver.png`, `net-box-yard.png`)

- **Attribute nodes:**
  - `home.hubs.w`/`e`
  - `blades.j1.a`
  - `dual.j1.a`
  - `dual.j2.a` (degree 6; the Strider's landing)
  - `shield.hub.a` (degree 6)
  - `shield.j1.a`
  - `shield.j2.a`
  - `blood.j2.a`
  - `blood.j3.a`
  - `blood.toWall.a`/`b`
  - Only `blood.toWall.a`–`blood.j3.a` is a link between two of them.
- **Small-node home roads:** `roadW` (crit ×2), `roadE` (attack speed ×2), `roadS` (life ×3, the only way from the
  start south to `shield.hub.a`).
- **What hangs off what:** 5 clusters connect only directly: Elemental Edge, Executioner, Crossed Blades, Field
  Dressing, Guarded. There are 12 direct links between areas. Among them are three that join notable clusters to each
  other: `shield.steelRim.n1`–`dual.crossedBlades.b`, `shield.steelRim.n1`–`blood.redHarvest.a` and
  `blood.redHarvest.a`–`dual.crossedBlades.b`.
- **No skeleton:** there is no spine from `shield.hub` to `shield.j1` to `blood.j3`/`blood.j2`. The Yard centre reads as
  a lattice of irregular polygons, not as roads with pockets.
- **Fix:**
  - a north–south str/dex road `hub.a`→`j1`→`j2`(blood) with Steel Rim, Four Winds, Open Veins and Red Harvest as
    pockets off it;
  - west and east roads `hubs.w`→`blades.j1` and `hubs.e`→`dual.j1`;
  - cut the Steel Rim / Crossed Blades / Red Harvest triangle to one link.

**Zealot** (`src/data/passives/cathedral/*.ts`; `zealot.png`)

- **Attribute nodes:**
  - `home.hubs.w`/`e`
  - `home.jT.a`
  - `nave.jN.a`
  - `nave.toWall.a`
  - `rods.jR.a`
  - `rods.toWall.a`/`b`/`c`
  - `pyre.jF.a`
  - `choir.jC.a`
  - `crypt.jV.a`
  - `crypt.toSpire.a`/`b`
  - The only runs are the two dear crossing roads.
- **Small-node home roads:** `roadM` (life ×3, all degree 2), `roadW` (block ×2), `roadE` (ES ×2).
- **No skeleton:** the way west runs `nave.jN` → through the Rods wheel → `rods.jR` → `pyre.wheel`, so the road passes
  through wheels. The way north runs `home.jT` → Choir wheel → `choir.jC` → Crypt wheel.
- **Fix:** a west str/int road `jN`→`jR`→`jF` beside the wheels rather than through them, and a north road
  `jT`→`jC`→`jV`. Fill the Bell Tower void (§11.3) with clusters off the west road.

**Shade** (`src/data/passives/knife/*.ts`; `shade.png`). This is the best skeleton after the Strider.

- The roads are `snares.toBow.a`/`b`/`c`→`snares.jT`→`venom.j2`→`hex.jH`, linked into the Strider's highway.
- 7 of 11 notable clusters hang off this road, and none connects only directly.
- The weakness is size, already known (§16), and the Stair spine (§11.5).

**Strider:** see §S.

### 7.2 Attribute share — M

| region    | share of bare attribute nodes   |
| --------- | ------------------------------- |
| Mystic    | 7.9%                            |
| Shade     | 17.5%                           |
| Strider   | 16.1%                           |
| Reaver    | 10.1%                           |
| Vanguard  | 7.4%                            |
| Zealot    | 15.9%                           |
| centre    | 66.7% (24 of 36)                |
| whole map | 14.7%; 12.0% without the centre |

The reference is 13.6% overall and 11–16% per sector. The two pure non-Strider regions are at half the reference. 22% of
all attribute nodes are in the ring. Attribute-node degree: Mystic 3.91, Shade 3.14, Strider 3.52, Reaver 4.17, Vanguard
3.56, Zealot 2.79, against a reference of 3.85. In the Zealot, 6 of 14 attribute nodes are degree-2 links in the
crossing roads.

### 7.3 Attribute values — L

- **Pure regions are on spec.** Every Mystic node is +20 int and every Vanguard node +20 str. The Strider has 20 nodes
  of +20 dex and 3 of +10 str/+10 dex.
- **Hybrid regions are on spec, with one exception.** The Shade's 14 nodes and the Zealot's 14 are all +15/+15. The
  Reaver has 10 nodes of +15/+15, plus `blood.toWall.a`/`b` at +20 str, which is intended: "strength is what the Wall
  will ask for".
- **Off spec:**
  - The ring's 12 hybrid nodes (`centre/ring.ts`, r2–r5, r10–r13, r19–r22) are +10/+10, against +15/+15 in §7.4.
  - The Strider's `bow.steel.toBlood.c`/`d`/`e` are +10/+10.
  - `bow.steel.added.n442` is kind `small` but carries +20 dex, so it should be kind `attribute` (§S).
- **Attributes on notables:** First Light +20 int, Oathbound +20 str, Hawk's Eye, True Aim, Quick Hands and Far Flight
  +20 dex each, Quickened Steel, Keen Instinct and Zeal +10/+10, and Stout Heart, Hedge Magic, Broad Weave, Heavy Draw
  and Wanderer (+10 all).
- **Fix:** decide the ring's hybrid value together with question 7.4. If +15/+15 stands, the ring's hybrid nodes rise to
  match.

### 7.4 Supply per point — H / question for the user

Shortest paths from each start to each of its own notables and keystones (`supply.ts`):

| class            | median per point (paths ≤8 / >8) | longest stretch with none of the class's attributes               |
| ---------------- | -------------------------------- | ----------------------------------------------------------------- |
| Mystic int       | 2.86 / 4.00                      | 10 (Wand Volley); home pockets 2.5–2.9                            |
| Vanguard str     | 3.33 / 4.00                      | 9 (Scar Tissue); Iron Lungs 2.2 per point                         |
| Reaver str / dex | 3.13 / 2.78 · 3.00 / 2.67        | 7; far paths 2.2–2.5 (Wound Dance, Crimson Pact, Thirsting Blade) |
| Shade dex / int  | 3.75 / 2.81 each                 | 5                                                                 |
| Zealot str / int | 3.75 / 3.46 each                 | 6                                                                 |
| **Strider dex**  | **7.50 / 11.67**                 | 7 (Round Shield)                                                  |

The audit's greedy builds (`scripts/passives/audit.ts`) at 20 points: Strider +120 dex, Mystic +40 int, Vanguard +40
str, Reaver +50 str / +40 dex, Shade +40/+40, Zealot +40/+40.

**The arithmetic.** At +20 a node, +3 per point means about one point in seven is an attribute node. The reference's
road tax is 29–43% of points, and §7.2 wants those roads to be attribute nodes. Real roads at +20 a node therefore
supply about 6–9 per point. The Strider, the only region with real roads, shows exactly this: about 10 per point. The
reference reaches about 3–4 per point only because its nodes are +10. Building the §16 skeleton at +20 will roughly
triple supply in the other five regions.

**Ask the user to choose one of:**

- (a) attribute nodes of +10 (or +10/+10 hybrids) with roads of attribute nodes;
- (b) +20 attribute nodes only at junctions, with roads of single-stat smalls between them, which §7.1 frowns on;
- (c) a higher target per point.

The Strider is then retuned to match. This blocks the road fix in 7.1.

### 7.5 Off-attribute distance — M

From a pure start, the first off-attribute node is 4 steps for the Mystic (`centre.ring.road.r2`/`r22`), 4 for the
Strider (`r10`, `yard.dual.j2.a`, and Hedge Magic's +10 int) and 5 for the Vanguard (`r13`/`r19`). §7.4 asks for 8–10
(the reference has 8–11). The cause is `centre/ring.ts`: each pure home's hubs sit at ring positions ±1, and the very
next ring node is a hybrid. Neighbouring homes' hubs are only two ring steps apart (r1→r2→r3).

**Fix:** make the two ring nodes next to each pure hub pure (Mystic: r22, r2 → int; Vanguard: r14, r18 → str; Strider:
r6, r10 → dex), and keep the hybrids at the seams. That puts the first off-attribute node at 5–6. Reaching 8 needs a
larger ring, or hubs that meet the ring further from the seams.

---

## §9 Keystones (items 1–2)

`keys.ts`. All 27 names in `src/data/tree/keystones.ts` are placed, and each is a dead end (degree 1).

| keystone            | region   | steps from own start | spur                                                                        | junction                                       | radius as a share of the region's reach |
| ------------------- | -------- | -------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------- |
| Unerring Discipline | Vanguard | 11                   | 2 smalls                                                                    | `wall.rampart.j1.a` (attr)                     | 64%                                     |
| Rooted Stance       | Vanguard | 15                   | 2                                                                           | `wall.maces.j2.a` (attr)                       | 94%                                     |
| Strongarm           | Vanguard | 14 (Reaver 12)       | 2                                                                           | `wall.slams.j2.a` (attr)                       | 69%                                     |
| Blood Rite          | Vanguard | **19**               | 2                                                                           | **`wall.grit.heavyHands.c` (cluster small)**   | 100%                                    |
| Shieldwall          | Reaver   | 14                   | **0: the small it sits on, `yard.shield.shieldwall.c`, has degree 4**       | through-route (Elemental Edge, Executioner)    | 80%                                     |
| Wound Dance         | Reaver   | 18                   | **0: `woundDance.c` also links `shield.shieldBash.b`**                      | through-route                                  | 100%                                    |
| Crimson Pact        | Reaver   | 17                   | **0: `crimsonPact.c` also links `blood.thirst.n`**                          | through-route                                  | 92%                                     |
| Arrow Weave         | Strider  | 11                   | 1                                                                           | `bow.flight.hub.p` (attr)                      | 93%                                     |
| Steady Draw         | Strider  | **7**                | 1                                                                           | `bow.bows.road.jb4` (attr)                     | 64%                                     |
| Close Quarters      | Strider  | 9                    | **0: `closeQuarters.a` is a three-way small**                               | through-route                                  | 84%                                     |
| Plated Hide         | Strider  | 9                    | 1                                                                           | `bow.steel.toBlood.b` (attr)                   | 82%                                     |
| Mind Bulwark        | Mystic   | 13                   | 2                                                                           | `spire.well.j1.a` (attr)                       | 58%                                     |
| Mana Bastion        | Mystic   | 13                   | **0: `manaBastion.a`/`b` also link Frugal and Hexwright**                   | through-route                                  | 58%                                     |
| Prismatic Balance   | Mystic   | 18                   | **0: `prismatic.c` also links `fire.cinder.c`**                             | through-route                                  | 91%                                     |
| Fever Pitch         | Mystic   | **21**               | 2                                                                           | **`spire.frost.shatter.n` (notable)**          | 100%                                    |
| Pain Conduit        | Mystic   | 17                   | **0: `painConduit.b` also takes `storm.overcharge.c` and the Knife's road** | through-route                                  | 84%                                     |
| Nimble Gambit       | Shade    | 8                    | **1, but `nimble.a` also links `edge.star.w`**                              | through-route                                  | 63%                                     |
| Shade Leech         | Shade    | 14                   | 2                                                                           | `knife.venom.jN.a` (attr)                      | 82%                                     |
| Cruel Agony         | Shade    | 16                   | 2                                                                           | `knife.venom.j5.a` (attr)                      | 97%                                     |
| Hollow Vessel       | Shade    | 16                   | 2                                                                           | `knife.venom.j5.a` (attr)                      | 91%                                     |
| Spellslip           | Shade    | 17                   | 2                                                                           | `knife.hex.j4.a` (attr)                        | 100%                                    |
| Idle Hands          | Zealot   | 14                   | 2                                                                           | `cathedral.rods.toWall.b` (attr, mid-crossing) | 70%                                     |
| Searing Avatar      | Zealot   | **19**               | 2                                                                           | `cathedral.pyre.jF.a` (attr)                   | 97%                                     |
| Lone Vow            | Zealot   | 13                   | 2                                                                           | `cathedral.choir.jC.a` (attr)                  | 68%                                     |
| Living Ward         | Zealot   | 13                   | 2                                                                           | `cathedral.choir.jC.a` (attr)                  | 66%                                     |
| Volatile Servants   | Zealot   | 18                   | 2                                                                           | `cathedral.crypt.jV.a` (attr)                  | 89%                                     |
| Sigil Warden        | Zealot   | **21**               | 2                                                                           | **`cathedral.crypt.shrine.e` (cluster small)** | 100%                                    |

- **M: 8 keystones sit on a through-route** (Shieldwall, Wound Dance, Crimson Pact, Close Quarters, Mana Bastion,
  Prismatic Balance, Pain Conduit, Nimble Gambit). The keystone's themed smalls double as the road between two clusters.
  A player walking past gets the keystone for one point, and the "spur" is not a section of its own (§8.2). **Fix:** move
  each keystone and its 1–2 smalls to a fresh spur off the nearest junction, and give the through-route its own node.
  Examples:
  - Shieldwall off `yard.shield.j2.a`, with `shieldwall.c` re-linked as a plain step between Elemental Edge and
    Executioner.
  - Pain Conduit off `spire.storm.jArm.a`, with the Knife road landing on `storm.jArm.a` instead of `painConduit.b`.
- **M: 3 keystones hang off a cluster node, not a junction:** Fever Pitch off `shatter.n`, Blood Rite off
  `heavyHands.c`, Sigil Warden off `shrine.e`. **Fix:** give each a junction (an attribute node) between the cluster and
  the spur.
- **M: distances.**
  - Outside the 8–18 working value: Steady Draw 7, Blood Rite 19, Searing Avatar 19, Fever Pitch 21, Sigil Warden 21.
  - The Strider reaches all four of its keystones within 11 steps (7, 9, 9, 11). The Zealot's nearest is 13 and the
    Mystic's 13. The reference's nearest is 6–10.
  - **Fix:** pull Fever Pitch and Sigil Warden in by 3, or accept them as far rim tips and record the range. Push Steady
    Draw out by 1–2 (Strider, low priority).
- **L: two keystones share one junction** in two places: Lone Vow and Living Ward (`choir.jC.a`), Cruel Agony and Hollow
  Vessel (`venom.j5.a`). This is a fork between two keystones, which may be intended. It also packs 4 of the Shade's 5
  keystones within 3 steps of `venom.j2`.
- **L: five keystones sit mid-region** (58–64% of the region's reach): Unerring Discipline, Steady Draw, Mind Bulwark,
  Mana Bastion, Nimble Gambit. In the reference 17 of 28 sit in the outer third, so this is within its variation.
- **§9 item 2 (costs) — L.** 25 of 27 keystones show a cost on the sheet (`src/data/tree/keystones.ts`). The two with
  none:
  - **Pain Conduit:** "30% more spell damage while on low life" is a conditional buff.
  - **Volatile Servants:** minions burst, a pure buff.

  Mind Bulwark and Mana Bastion are conversions (mana or ES takes the hit) and count as costs. That is 25/27 = 93%,
  against the reference's 79%: a pass.

---

## §11 Looks and communication

### 11.1 Link crossings and cramped nodes — mostly pass

- `crossings.ts` finds **0 link crossings**.
- **Cramped nodes:** the nearest unlinked node is median 220 units, p10 134, minimum 100 (`yard.shield.shieldwall.k` /
  `yard.blades.executioner.a`). Pairs under 130 are listed in `geom.ts`.
  - Yard: `shieldwall.k`/`executioner.a` 100, `blood.openVeins.n`/`shield.fencer.b` 102.
  - Strider: `string.aim.a`/`hardTarget.a` 101, `bows.steadyDraw.a`/`tripwire.a` 102.
  - Spire: `column.dartingBolts.n`/`column.star.e` 103.
- **L/M: nodes that read as lying on a link** (`geom.ts`):
  - `wall.home.unshakable.b` is 6 units from the link `unshakable.n`–`roadR.a`.
  - `bow.steel.wayfarer.a` is 9 units from the link `bow.home.hubs.s`–`bow.steel.road.jt1`.
  - Looser: `wall.maces.greatweight.c` is 29 units from `greatweight.d`–`maces.j2.a`, and `wall.slams.thickSkin.a` 39
    units from `thunderstep.b`–`thickSkin.b`.

  These pass a crossing count but look like false links. **Fix:** move each node at least 60 units off the line.

### 11.2 Labels — M

Area-label boxes as `crossings.ts` sizes them; checks in `labels.ts`.

- **Area labels overlapping each other:**
  - **"The ring" and "The inner ring", both at (0,0)** (`centre/ring.ts`, `centre/clusters.ts`), render as garbage in
    the middle of the map (see `all.png`). **Fix:** drop one, or move "The inner ring".
  - **"The Battlements"** (`wall.resists`, at −2400,−800) **overlaps "The Vestry"** (`cathedral.rods`, at −2650,−800).
- **Area labels away from their own areas** (own nodes within 700 units of the label):

  | label                                 | own nodes within 700 | nearest own node | where it actually sits                        |
  | ------------------------------------- | -------------------- | ---------------- | --------------------------------------------- |
  | "The Lists" (`yard.dual`)             | **0** of 12          | 841              | among Strider nodes                           |
  | "The Muster" (`yard.shield`)          | **2** of 38          | 568              | on the Yard Gate; 94 from `yard.home.roadW.a` |
  | "The Gate" (`wall.home`)              | 4 of 20              | 580              | **inside the centre ring**                    |
  | "The Battlements" (`wall.resists`)    | 3 of 26              | 281              | inside the Cathedral                          |
  | "The Bow Gate" (`bow.home`)           | 4 of 27              | 453              | over the Knife's Soft Step                    |
  | "The Hedgerows" (`bow.bows`)          | 3 of 17              | 478              | —                                             |
  | "The Column" (`spire.column`)         | 6 of 29              | 381              | among Scriptorium nodes                       |
  | "The Practice Ground" (`yard.blades`) | 8 of 18              | 468              | its nearest node is the Wall's Strongarm      |
  | "The Bell Tower" (`cathedral.pyre`)   | —                    | 488              | in empty space                                |
  | "The Pits" (`yard.blood`)             | —                    | 512              | past the rim                                  |

  On a phone the label is how an area is found (§1.4, §11.4), so a label over another area misleads. **Fix:** move each
  `at` to the centroid of its own nodes. The centroids are printed by `../net/areas.ts`. For example, `yard.shield`
  (−357,2680), `yard.dual` (570,2114), `wall.home` (−1213,598), `wall.resists` (−1840,−155), `spire.column` (6,−2903),
  `bow.home` (1121,836).

- **Area labels over notable names (8):**
  - "The Rampart" / Elemental Ward
  - "The Bow Gate" / Soft Step
  - "The Meadow" / True Aim
  - "The Thicket" / Quick Sip
  - "The Ford" / Thirsty Quiver
  - "The Alleys" / Keen Instinct
  - "The inner ring" / Quick March and Provisions
- **Notable names overlapping each other (15 pairs):**
  - Vanguard start / Oathbound
  - Cleaver / Crushing Blow
  - Mortar and Stone / Steady Hands
  - Standing Cairns / Keen Edge
  - Open Veins / Standard Bearer
  - Executioner / Standard Bearer
  - Field Dressing / Guarded (103 apart)
  - Darting Bolts / Prism Ward
  - Overcharge / Harsh Weather
  - six in the Strider (§S)

  Some of these are render-only, but Field Dressing/Guarded, Darting Bolts/Prism Ward and Cleaver/Crushing Blow are
  also cramped nodes.

- **Already known:** "The Practice Ground" lies over the link `wall.grit.j1.a`–`yard.blood.toWall.b`, and "The Muster"
  over `yard.home.roadW.a`–`roadW.b`. Both are confirmed. Both go away when the label moves and the 1,490-unit link is
  rerouted (11.4).

### 11.3 Density all the way out — M

Nodes per 10⁶ square units, by 60° sector and radial band (`density.ts`):

| sector   | 1000–1500 | 1500–2000 | 2000–2500 | 2500–3000 | 3000–3500 | 3500–4000 | 4000+ |
| -------- | --------- | --------- | --------- | --------- | --------- | --------- | ----- |
| Mystic   | 20        | **11**    | 22        | 20        | 14        | 13        | 4     |
| Shade    | 20        | 15        | 19        | 16        | **6**     | **1**     | 0     |
| Strider  | 28        | 25        | 27        | 22        | 11        | 0         | 0     |
| Reaver   | 26        | 25        | 29        | 22        | 15        | 3         | 0     |
| Vanguard | 23        | 28        | 20        | 16        | 8         | 3         | 0     |
| Zealot   | 18        | **12**    | 22        | **13**    | 9         | 6         | 1     |

- **The Mystic and Zealot have a sparse band just outside home** (1,500–2,000), at about half the density of the Yard,
  Wall and Bow. That is the rejected "moat" (§14).
  - In the Spire it is the hollow Spire gate: `gaps.ts` finds holes at (0,−1580) and (0,−1995), with only the two
    3-node small roads crossing it.
  - In the Cathedral it is the hole between Hymn and the Choir, where "The Cathedral Gate" label sits.
- **Voids inside regions** (`gaps.ts`; points at least 260 from any node and 160 from any link; area is in 50×50-unit
  cells):
  - Zealot (−2639,−1668), **66**: the Bell Tower void between `choir.loneVow`, `rods.jR` and `pyre`.
  - Zealot (−2466,−2237) 43, (−3486,−864) 32, (−2449,−3211) 28.
  - Mystic (−471,−4344) **59** and (424,−4466) **41**, either side of the Fever Pitch spine.
  - Shade (2078,−2679) 43, (1248,−1516) 31, (2975,−2127) 26.
  - Vanguard (−1484,2290) 39, (−3267,851) 34, (−2541,1902) 32, (−2149,1361) 32.
  - Strider (1802,2570) 30.
  - The Reaver has none: it is dense throughout.
- **Fix:** these voids are where the new clusters already called for should go: the Knife's (§16), the Zealot's (only 11
  notable clusters), and the pockets off the new roads in §7.1. Put them in the voids rather than on the rim.

### 11.4 Long links and spiders — M (H for the first)

The median link is 156–192 units per region (`geom.ts`).

- **H: `wall.grit.j1.a`–`yard.blood.toWall.b`, 1,490 units.** It is about nine ordinary links long and cuts across the
  south-west of the map, through "The Practice Ground". It is the far end of the Yard–Wall dear crossing (`yard/blood.ts`
  cluster `toWall`). **Fix:** route it as 3–4 attribute nodes along the border.
- **M: spider junctions in the Spire.**
  - `column.fork.a` has degree 6, with 607-unit spokes to `fire.hoarfrost.a` and `storm.flashpoint.a`.
  - `column.j1.a`–`craft.focus.b` is 571.
  - `fire.jArm.a`–`well.manaTap.n` is 594.
  - `storm.jArm.a`–`craft.mistWalk.n` is 449.

  In `mystic.png` the centre of the Spire reads as a web of spokes, not as roads. The fix is the road skeleton in §7.1.

- **M: `wall.maces.weight.b`–`wall.slams.thunderstep.c`, 583 units**, crosses a blank diagonal (`net-box-wall.png`).
- **M: hub-to-ring links.** Nine are 528–537 units (Mystic, Shade, Reaver, Zealot, and the Vanguard's `hubs.s`), against
  261–336 for the Strider's and 291 for the Vanguard's `hubs.n`. They draw as long diagonal spokes back inward past the
  start (`mystic.png`, `shade.png`). **Fix:** move the hubs or the ring nodes so these links are about 300, or put one
  attribute node in each.

### 11.5 Geometry: pockets, roads, messy areas — M

- **Pockets are not tight orbits facing their junction.** Median cluster span is 210–300 units, with 2–3 attach nodes
  per cluster. The clusters are wheels and polygons entered from several sides.
  - The Yard centre (`net-box-yard.png`) is a lattice: Four Winds, Shield Catch, Steel Rim, Iron Draw, Crossed Blades,
    Red Harvest, Open Veins, Fencer's Eye, Standard Bearer and Executioner all share links. Shieldwall sits in the middle
    of the Executioner / Elemental Edge / Fencer's Eye knot.
  - The Wall's west towers (`net-box-wall.png`) are the same: the Steady Hands / Cleaver / Crushing Blow / Stagger
    diamonds.

  Both areas look busy at middle zoom.

- **Roads wander: L.** Bends at road nodes of degree 2 are mostly 150–180°. The softest are `cathedral.rods.jR.a` 110°,
  `cathedral.home.roadM.c` and `spire.frost.jStorm.a` 121°, and the curved home roads `spire.home.roadW`/`roadE`
  (126–138°).
- **Long single spines.**
  - **The Stair** (`knife/hex.ts`) runs `hex.jH`→`road.a`→wheel→`climb.a`→`j4`→`toSpire.a`→`toSpire.b`→`painConduit.b`.
    It is a 9-node chain whose only branches are Spellslip and Hexwright, with a 43-cell void beside it.
  - **The Fever Pitch spine** (`spire/frost.ts`) runs `column.fork`→Thunderhead→`frost.jArm`→Shatter→2 smalls→Fever
    Pitch, straight up, with voids of 59 and 41 cells either side. It looks shape-driven (§13.7).
- **Chains of six degree-2 nodes:**
  - `spire.craft.mistWalk.n`…`devotion.a` (Mystic).
  - `bow.flight.ricochet.a`…`bow.steel.wheel.c1` (Strider).
  - The reference's longest stretch with no choice is 4 to 5 nodes.

---

## §13 Tensions

1. **Connections against trade-offs (M).** Bob has plenty of loops, but they are local. Most notable clusters are
   entered from 2–3 sides, and the Yard centre and the Wall's west towers are lattices (§11.5). Between regions there are
   only 18 links, and the Mystic has none near home (§3.4). Inside a region, nothing locks a build in. Across regions,
   the ring is the only cheap door. **Direction:** move loops out of the lattices (§3.2 fixes) and into near bridges at
   the seams (§3.4 fixes).
2. **Highways against filler (H).** Five regions have no highways to read (§7.1). The stretches with nothing branching
   off are the home small-node roads, the 6-node degree-2 chains and the long spokes. The Strider shows the opposite
   failure: its highways read well, but at +20 they supply about 10 attributes per point (§7.4).
3. **Bridges against dead ends (M).** The network has tipped to bridges. In four regions no notable is a far tip
   (§3.2), and 8 keystone spurs are through-routes (§9). Restore 3–5 dead-end pockets per region, and pure spurs.
4. **Shapes and names against the tree (M).** Several problems look shape-driven. The Spire's vertical Fever Pitch spine
   makes the Mystic reach radius 4,620 against 3,455–3,908 elsewhere, with two voids beside it. The Stair is a long thin
   climb. The Bell Tower area (`cathedral.pyre`, 10 nodes) is a label in empty space with a long spur. The labels that
   sit off their areas (§11.2) are the same problem in names. Where a region's shape forces a spine or a void, drop the
   shape.
5. **A generic start against early direction (M).** The Mystic home is all spell and the Vanguard home all melee
   physical (§6.3). The other four homes are acceptable.

---

## §S The Strider (the user's edit; low priority under §15.9)

- **The skeleton is right, the supply is not (M).**
  - 23 attribute nodes, none standing alone, 13 links between attribute nodes.
  - A full dex highway: `hubs.n`→`bows.road.jb3`→`bows.hub.b`→`jb4`→`flight.road.jp1`–`jp3`→`flight.hub.p`→
    `quiver.road.jq3`→`quiver.hub.q`→`steel.road.jt3`→`steel.hub.t`→`jt1`→`hubs.s`.
  - 20 of 25 notable clusters hang off it.
  - Supply is about 7.5–11.7 dex per point (§7.4). This region is the evidence for the §7.4 question, not something to
    fix on its own.
- **One node takes four links (L/M).** `yard.dual.j2.a` (Reaver, degree 6) receives four editor links:
  `bow.home.added.n414`, `bow.steel.road.jt1`, `bow.steel.hub.t` and `bow.steel.added.n409`. It reads as a knot on the
  border.
- **Clusters spread across the region (L).** `bow.quiver.wheel` spans 1,744 units: Barbed Arrows sits in the High Moor
  and Deep Cuts in the Ford. The editor bins `bow.home.added` (span 999) and `bow.steel.added` (span 1,074) group
  unrelated nodes.
- **Kind mismatch (L).** `bow.steel.added.n442` is kind `small` with +20 dex.
- **Direct-only clusters (L):** Ricochet, Killing Eye, Skewer, Quick Sip.
- **Label and name overlaps (L):**
  - "The Bow Gate"/Soft Step, "The Meadow"/True Aim, "The Thicket"/Quick Sip, "The Ford"/Thirsty Quiver.
  - Names: Plated Hide/Sentry Post (160 apart), Vital Aim/Wayfarer, Longbow/Sure Shot, Deep Cuts/Thirsty Quiver,
    Hatchet Work/Thirsty Quiver, Long Breath/Elemental Fletching.
- **A node on a line (L).** `bow.steel.wayfarer.a` sits 9 units from the `hubs.s`–`jt1` link.
- **Keystone distances (L).** Steady Draw is 7 steps from the start; all four keystones are within 11.
- **Stale `why`s (L).** The Knife crossings still say "the Knife is not written yet".
