# Build walks: the Zealot (Cathedral) and the Vanguard (Wall)

> Copied into the repo on 2026-10-20 from the session scratchpad. The walk scripts and raw outputs it mentions stayed there. Fixes applied after this audit are listed in `../../E-round2.md`.

Audit of 2026-10-20, read-only. Scripts and raw output are in `audit2/zv/`:

- `zv/walks.ts`: the ordered steps of every walk. Each step is a node. The runner buys the cheapest path to it from what is already bought, and every wheel side or detour a player would pick is named as its own step.
- `zv/run.ts`: the runner. `FR=5 npx tsx run.ts [name]` also prints the frontier, meaning every notable within 5 points of the finished tree.
- `zv/walks-out.txt`: every point of every walk, with lines and attribute snapshots.
- `zv/snaps.txt`: the notables taken between snapshots.
- `zv/paths.ts`: all shortest paths between two nodes.
- `zv/fr.ts`: the frontier from a set of steps.
- `zv/pair.ts`: step distances between notables that share a theme.
- `zv/deg.ts`: dead ends and bridges.
- `zv/cross.ts`: every link that crosses a region border.
- `zv/close.ts`: unlinked nodes that sit close together.

Conventions:

- **Levels.** Point p maps to level L by p = (L−1) + 3·⌊min(L,80)/10⌋, from `run.ts:377` (3 bonus points at maps 10, 20, …, 80). So point 10 ≈ L10, 20 ≈ L18, 40 ≈ L32, 60 ≈ L49, 90 ≈ L70 and 123 = L100.
- **Requirements.** These are the heaviest base of that item class at or below that level, from `ITEM_BASES` (str/dex/int). The heaviest late bases are:
  - sceptre 121/0/131
  - staff 117/0/117
  - one-handed mace 220/0/0
  - two-handed mace 220/0/0
  - two-handed axe 158/86/0
  - bow 0/222/0
  - armour shield 159/0/0
  - armour/ES shield 85/0/85
  - ES shield 0/0/159
  - armour body 191/0/0
  - armour/ES body 109/0/115
  - armour/evasion body 115/116/0
- **Base attributes.** Zealot 23/14/23, Vanguard 32/14/14.
- **Short ids.** `C.` = `cathedral.`, `W.` = `wall.`, `Y.` = `yard.`, `S.` = `spire.`.

---

## 0. What all the walks have in common

1. **Every build reaches every notable it wants with points to spare.** The wish list plus every useful generic defence of the home region took 89 to 113 points. The walks were then filled to 112 to 122 with frontier picks (the late rows of each table). The build-specific core was complete by:
   - point 19: mace and shield
   - point 35: summoner
   - point 37: two-handed mace
   - point 40: caster
   - point 57: fire sceptre

   No walk had to give up a notable its build values. The only real give-ups were keystone choices (Lone Vow against the reservation nodes) and the order in which things were taken. Against §1 ("the tree exists to force trade-offs"), the Wall and the Cathedral are still too generous within reach.

2. **Attributes are far over-supplied.** None of the in-region builds was ever short.

   | Build | At       | Attributes held  | Heaviest requirement      |
   | ----- | -------- | ---------------- | ------------------------- |
   | Z1    | point 60 | str 149, int 139 | 81/85 at L49              |
   | Z1    | point 90 | str 243, int 223 | 121/131                   |
   | V1    | point 60 | str 272          | 220 (the L90 requirement) |
   | V1    | point 90 | str 342          | 220                       |
   | V2    | point 90 | str 310          | 220                       |

   Bare attribute nodes were 23 to 33 of each build's points. Strength only became a cost when a Vanguard left the Wall:
   - The big axe was short 23 dexterity for the weapon (53 for an armour/evasion body) at point 90, after 30 points in the Yard.
   - The strength caster was short 71 intelligence for a sceptre.
   - The bow totem was short 37 to 44 dexterity.

3. **Crossings land on notables.** Cross-region travel therefore buys those notables on the cheapest path. Scar Tissue, Wandwork and Familiars are hard to avoid; the others cost 1 more to avoid.
   - `C.rods.toWall.a ↔ W.resists.scarTissue.n`
   - `C.home.hubs.w ↔ W.resists.banner.n`
   - `C.ambulatory.toWall.d ↔ W.rampart.stagger.n`
   - `C.crypt.toSpire.b ↔ S.fire.familiars.n`
   - `Y.blades.toHeadsman.r3 ↔ W.grit.headsman.n`
   - `S.well.toCathedral.a`, whose only onward link is `S.well.wandwork.n`

   §3.4 prefers a road node between clusters.

---

## Zealot

### Z1: fire sceptre striker (sceptre and armour/ES shield). Gilded Rod, Kindled Steel, Searing Avatar

Gear: sceptre, armour/ES shield, armour/ES body.

| Point (level) | Taken since the last snapshot                                                                                                                                     | str/dex/int | Requirement         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------- |
| 10 (L10)      | Zeal (2), Alms (7), Iron Faith (9)                                                                                                                                | 62/14/62    | sceptre 22/0/22, ok |
| 20 (L18)      | Gilded Rod (15), the life road `C.home.roadM.*`                                                                                                                   | 69/14/69    | 25/0/35, ok         |
| 40 (L32)      | Kindled Steel (25), Tithe (28), Litany (30), **Searing Avatar (36)**, Hearthfire (38), Warlord's Banner (39)                                                      | 90/14/90    | 52/0/62, ok         |
| 60 (L49)      | Benediction (41), Consecrated Plate (45), Hallowed Hammer (57), Vigil (59)                                                                                        | 149/14/139  | 81/0/85, ok         |
| 90 (L70)      | Choirmaster, Hymn, Provisions, Unshakable, Elemental Ward, Lone Vow (81), Shelter                                                                                 | 243/14/223  | 121/0/131, ok       |
| 122 (L99)     | Weight of Iron (96), Iron Lungs, Mortar and Stone, Stone Heart, Second Wind, Broad Back, Rooted Stance (113), Steady Hands, Oathbound, Stagger, Battle Hymn (122) | 343/14/223  | ok                  |

**Decision log**

- **Points 1 to 3.** `C.home.sig.b` or `sig.a`, then Zeal (`sig.n`) at point 2, or a hub. Before the gem, both sides are generic, so this is a fine start.
  - INTERESTING: west for block (Iron Faith at 6) or east for fire (Hearthfire at 7).
  - Warlord's Banner sits one point off `C.home.hubs.w`. It is the Wall's notable, but the Zealot reaches it at 3, before the Vanguard does at 5.
- **Points 4 to 7.** The Alms loop (`C.home.alms.a/n`, +2 over the direct `roadW.a → roadW.b`). INTERESTING and cheap: flasks or 2 points saved.
- **Point 9.** Iron Faith (`C.nave.wheel.n3`), the shield side of the nave wheel. INTERESTING: the striker takes block, the caster takes Hearthfire.
- **Points 10 to 15.** `n7, n4, jN.a, rods.r1, r2`, then Gilded Rod (`C.rods.wheel.r3`). INTERESTING: the sceptre side or the staff side (`r5`).
- **Points 20 to 36.** JANK, a one-stop line. From Gilded Rod onward, the striker's whole kit is a single corridor: `r3 → r7 → r4 → jR → pyre.f1 → f2 → f3` (Kindled Steel) `→ f7 → f4 → jF → searingAvatar.a/b/k`, with Tithe 3 off `f1`. Gilded Rod and Kindled Steel are 6 steps apart, and Searing Avatar is 5 past Kindled Steel. CONSTRAINTS §16 says "the fire sceptre … still sits on one line"; the re-lay has not changed that. The new Ambulatory added bypasses _around_ the line (the back road `C.ambulatory.nave.a/b`, Tithe), but nothing _off_ it.
- **Point 36.** Searing Avatar. FORCED/TRAP for a physical sceptre: it converts 50% and deals no non-fire damage, so a sceptre that is mostly physical loses half its hit. No tree node supplies more conversion, so it works only with gear or a conversion gem. This is a keystone-design question, not a placement one.
- **Points 46 to 57.** To Hallowed Hammer: `tithe.b/c, ambulatory.toWall.a/b, hymn.a/b, W.maces.toHymn.r4/r3/r2, hammer.a/b/n`.
  - BORING/FORCED: 12 points for one notable.
  - The two warcry smalls `C.ambulatory.hymn.a/b` are forced, because the road goes _through_ the Battle Hymn pocket (`hymn.b ↔ W.maces.toHymn.r4`) rather than past it.
- **Crushing Blow is not for sceptres.** It was first in this walk and taken out. Crushing Blow is "with Maces" only, so a sceptre gets nothing from it. Weight of Iron and Hallowed Hammer name sceptres, Crushing Blow does not. JANK: the mace crit has no sceptre twin, and a sceptre crit exists only on Gilded Rod.
- **Points 60 to 113 (late).** Choirmaster, Lone Vow, Hymn, Provisions, Shelter, then the whole Wall rampart: Weight of Iron through the Cleaver axe smalls (`W.maces.cleaver.a/c/b`, forced), Iron Lungs, Mortar and Stone, Stone Heart, Second Wind, Broad Back and Rooted Stance.
  - The late game is generic defence and the Vanguard's armour. It is coherent, but nothing in it is about fire or sceptres after point 57.
  - Rooted Stance costs nothing on an armour character with 14 dexterity.

**Late verdict.** Mostly unsatisfying. After Hallowed Hammer there is no fire-attack or sceptre content anywhere in reach. The nearest fire attack is Elemental Edge, 33 steps from Kindled Steel. Points 60 to 123 buy defence and keystones.

### Z2: elemental spell caster (staff). Hearthfire, Homily, Crozier, Brandwright

Gear: staff, armour/ES body.

| Point (level) | Taken                                                                                                          | str/dex/int | Requirement       |
| ------------- | -------------------------------------------------------------------------------------------------------------- | ----------- | ----------------- |
| 10            | Zeal, Hymn (5), Hearthfire (10)                                                                                | 69/14/69    | staff 20/0/20, ok |
| 20            | Litany (12), Quarterstaff (16)                                                                                 | 90/14/90    | 35/0/35, ok       |
| 40            | Crozier (26), Brandwright (31), Runecarver (35), Homily (40)                                                   | 146/14/146  | 51/0/51, ok       |
| 60            | Vigil, Choirmaster, Sigil Warden (56), Benediction (59)                                                        | 153/14/153  | 85/0/85, ok       |
| 90            | Consecrated Plate, Wandwork (65, forced), Deep Well, Quiet Pulse, Shelter, Glass Skin, Quickening, First Light | 181/14/301  | 117/0/117, ok     |
| 115 (L92)     | Sharp Mind, Searing Avatar (97), Warlord's Banner, Still Mind, Arcane Focus (107), Warded Mind, Mana Tap, Alms | 210/14/370  | ok                |

**Decision log**

- **Points 3 to 6.** Hymn loop (`C.home.hymn.a/n/b → roadE.a`): +2 for a mana notable. INTERESTING.
- **Point 10.** Hearthfire (`C.nave.wheel.n5`) via `jT → n6`. Good: a spell notable at 10.
- **Points 11 to 16.** To reach the Ambulatory the caster must cross the Vestry wheel. It takes Quarterstaff (`C.rods.wheel.r5`, staff _attack_ damage, +3% block, area) or Gilded Rod, or detours through the Wall's Scar Tissue (§Z5).
  - FORCED, acceptable: by §5.5, passing a notable of another kind is a fair price.
  - The staff caster also takes staff smalls `r6/r8`, which are attack-only lines. They are dead weight for a spell build.
- **Points 19 to 26.** `jR → C.ambulatory.nave.a/b → walk.w2/w3 → crozier.a/b/n`. BORING: 4 attribute nodes, then a dead-end pocket.
- **Points 27 to 35.** `walk.w4/w5 → brand.*` (Brandwright), then `w6/w7 → crypt.shrine.e/s` (Runecarver). Brandwright and Runecarver are 6 steps apart, with Sigil Warden off `shrine.e`.
  - JANK, a one-stop shop for brands: three brand things within 7 points.
  - Their partners differ (elemental damage and cast speed against duration and area), so they meet §5.1, but they sit too close for "neighbours compete" (§5.5).
- **Points 36 to 40.** Homily from behind (`shrine.w → jV → m4 → m7 → m3`).
- **Points 62 to 66.** FORCED/TRAP. Entering the Spire through the Hymn crossing (`C.home.hymn.b ↔ S.well.toCathedral.b → toCathedral.a`) lands on **Wandwork** (`S.well.wandwork.n`, wand-only spell damage). `toCathedral.a` has no other onward link, so every non-wand Zealot who takes this crossing pays a dead notable.
- **Points 66 to 100 (late).** Spire energy shield and mana (Deep Well, Glass Skin, Quickening, First Light, Sharp Mind), then Searing Avatar, which suits a fire caster.

**Late verdict.** Satisfying. The late game moves into the Spire's caster supply, which is what §9.3 asks for. The only flaw is the forced Wandwork at the door.

### Z3: summoner (sceptre and ES shield). Shepherd, Ossuary, Volatile Servants

Gear: sceptre, ES shield, armour/ES body.

| Point     | Taken                                                                                                                                     | str/dex/int | Requirement           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------- |
| 10        | Zeal, Shepherd (9)                                                                                                                        | 69/14/69    | ok                    |
| 20        | Glass Wall (15), Familiars (18, Spire)                                                                                                    | 104/14/104  | ok                    |
| 40        | **Volatile Servants (23)**, Hymn, Reliquary (27, forced), **Ossuary (35)**                                                                | 132/14/132  | ok                    |
| 60        | Choirmaster, Consecrated Plate, Banner, Hearthfire, Vigil, Litany, Draught                                                                | 168/14/188  | ES shield 0/0/118, ok |
| 90        | Lone Vow, Shelter, Quiet Pulse, Glass Skin, Spirit Ward, Iron Faith, Alms, Unshakable, Mind Bulwark                                       | 196/14/286  | ok                    |
| 113 (L90) | First Light, Deep Well, Quickening, Still Mind, Provisions, Warm Blood, Elemental Ward, Second Wind, Stone Heart (none of it for minions) | 257/14/347  | ok                    |

**Decision log**

- **Points 7 to 9.** Shepherd via `C.choir.wheel.c1 → c6 → c5`. INTERESTING: the minion side or the aura side of the choir wheel.
- **Points 13 to 15.** Glass Wall (`C.crypt.wheel.m5`, spell block behind a shield) or Homily. INTERESTING for a shield summoner.
- **Points 16 to 18.** Familiars, two attribute nodes over the border (`C.crypt.toSpire.a/b`). It is a crossing that lands on the notable.
- **Points 19 to 23.** `stair.a → jV.a → volatile.a/b/k`. The keystone comes at point 23.
- **Points 26 to 35.** To Ossuary from the crypt: `shrine.w → shrine.n` or `shrine.s` → `shrine.e → walk.w7 … w4 → ossuary.a/b/n`.
  - FORCED: the shrine diamond makes the summoner take Reliquary (totems) or Runecarver (brands).
  - BORING: four bare walk nodes.
  - From the other side, Ossuary is 22 points from the start through Scar Tissue and the back road.
- **Points 36 onward.** There is nothing left for minions anywhere. The whole tree has three minion notables (Shepherd, Familiars, Ossuary) and one minion keystone (`zv/grepn.ts minion`). All four are taken by point 35. The remaining 88 points are generic defence, mana and Spire energy shield.

**Late verdict.** Unsatisfying. The minion specialization is the shallowest seen: done by point 35, with nothing in the late game.

### Z4: aura/armour shield Zealot. Choirmaster, Iron Faith, Consecrated Plate, Benediction

Gear: sceptre, armour shield, armour/ES body.

| Point     | Taken                                                                                               | str/dex/int | Requirement          |
| --------- | --------------------------------------------------------------------------------------------------- | ----------- | -------------------- |
| 10        | Zeal, **Warlord's Banner (4)**, Iron Faith (8)                                                      | 62/14/62    | ok                   |
| 20        | Choirmaster (14)                                                                                    | 76/14/76    | armour shield 46, ok |
| 40        | Litany, Gilded Rod (25, forced), Benediction (31), Consecrated Plate (35)                           | 104/14/104  | ok                   |
| 60        | Lone Vow (41), Unshakable, Elemental Ward, Second Wind, Stone Heart, Mortar and Stone (57)          | 121/14/111  | 114, ok              |
| 89        | Bracing (61), Vigil, Hymn, Provisions, Shelter, Kindled Steel, Tithe, Steady Hands, Oathbound, Alms | 248/14/188  | 159, ok              |
| 112 (L89) | Iron Lungs, Weight of Iron, Glass Wall, Quartermaster, Thick Skin, Broad Back, Stagger              | 318/14/188  | ok                   |

**Decision log**

- **Point 4.** Warlord's Banner at point 4, from a Wall cluster. It is meant as the neighbour's door (`why` on `C.home.hubs.w ↔ W.resists.banner.n`), but it means the Zealot's first reservation is cheaper for the Zealot than for the Vanguard.
- **Points 9 to 14.** The nave wheel is a loop: `n1 → n6 → jT → c1 → c2 → c3` (Choirmaster). Fine.
- **Points 23 to 31.** FORCED: Benediction (`C.pyre.wheel.f5`) is behind the Vestry wheel.
  - The weapon-neutral aura build passes Gilded Rod or Quarterstaff (16 from the start), or takes the Wall detour through Scar Tissue (13).
  - INTERESTING if intended. Note that the _out-of-region_ route is the cheaper one (finding F1).
- **Points 32 to 35.** Consecrated Plate (`C.ambulatory.plate.n`) via the back road `jR → nave.a → nave.b → plate.b`. Good: it is a bridge.
- **Points 36 to 41.** Lone Vow (`C.choir.loneVow.k`). INTERESTING and a real trade: it makes Banner, Choirmaster and the 3%-reserved smalls (`C.choir.wheel.c2/c7`, `W.resists.banner.a/b`) pointless. My walk took both to show the conflict; a real player picks one.
- **Points 42 to 61.** JANK, a one-stop shop next door. The Zealot's armour shield walks into the Wall's rampart and takes Unshakable, Elemental Ward, Second Wind, Stone Heart, Mortar and Stone and Bracing within 20 points.
  - **Iron Faith and Bracing are the same notable:** +5% shield block and 20% block recovery each, plus +60 armour on one and 8% stun threshold on the other. They are 13 steps apart. §5.1 says two copies of the same pairing are not a choice.

**Late verdict.** Thin. Auras have three notables (Choirmaster, Benediction, Banner) plus Lone Vow. After point 41, the aura build is an armour build borrowing the Vanguard's rampart.

### Z5 (cross): Zealot two-handed mace with warcries into the Wall. Battle Hymn, Hallowed Hammer

Gear: two-handed mace, armour body.

| Point | Taken                                                                                                                                          | str/dex/int | Requirement |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------- |
| 10    | Zeal, **Scar Tissue (10)**                                                                                                                     | 79/14/69    | ok          |
| 20    | Tithe (15), Battle Hymn (20)                                                                                                                   | 114/14/104  | 62, ok      |
| 40    | Hallowed Hammer (26), Crushing Blow (29), Greatweight (33), Kindled Steel (36)                                                                 | 148/14/118  | 107, ok     |
| 60    | Elemental Ward, Rooted Stance (46), Stagger (49), Broad Back, Weight of Iron, Ground Shaker                                                    | 215/14/125  | 155, ok     |
| 90    | Searing Avatar, Banner, Unshakable, Stone Heart, Iron Lungs, Mortar and Stone, Vampiric Strikes, Steady Hands, Hearthfire, Litany, Benediction | 276/14/146  | 220, ok     |

**Decision log**

- **Points 6 to 13.** `C.nave.wheel.n2 → C.nave.toWall.a → W.resists.j.a → scarTissue.a/n → C.rods.toWall.a/b/c`.
  - FORCED: this is the **cheapest route from the Zealot start to the whole western Cathedral** (13 points to `C.pyre.wheel.f1`, against 16 through the Vestry wheel; `zv/paths.ts zealot cathedral.pyre.wheel.f1`).
  - Every west-bound Zealot passes two Wall nodes and Scar Tissue, a grit notable.
- **Points 14 to 20.** Tithe, then `C.ambulatory.toWall.a/b → hymn.a/b/n`. Battle Hymn is a good partner here.
  - JANK: **Battle Hymn and War Drums are the same pairing.** Battle Hymn gives 20% warcry effect and 20% warcry duration; War Drums gives 25% and 20%. They are 22 steps apart, so the distance is fine but the partner is identical (§5.1).
  - The Battle Hymn `why` says "War Drums … sells the charges", but War Drums has no charge line. The `why` is stale.
- **Points 21 to 26.** `W.maces.toHymn.r4/r3/r2 → hammer.a/b/n`. Hallowed Hammer is a dead-end pocket off a 4-node road. Fine.
- **Points 27 to 33.** `toHymn.r1 → crushing.a → crushing.n → crushing.b → greatweight.d/c/n1`. INTERESTING for a mace build: crit (Crushing Blow) on the way to the two-hander wheel.
- **Point 49.** Stagger via `C.ambulatory.toWall.c/d`. The Rampart road lands on the Stagger notable (`W.rampart.stagger.n ↔ C.ambulatory.toWall.d`), so a Vanguard coming the other way pays Stagger too.

**Late verdict.** Satisfying as a cross build. The Wall's maces and armour are 3 to 10 points away at every stage. The danger is that the Zealot mace gets everything the Vanguard mace gets, plus Kindled Steel, Tithe and Searing Avatar. Nothing on the Zealot side costs it anything.

### Z6 (extra, 28 points): totem Zealot. Idle Hands, Reliquary

| Point | Taken                  |
| ----- | ---------------------- |
| 10    | Zeal, Scar Tissue (10) |
| 20    | Idle Hands (15)        |
| 28    | Reliquary (28)         |

**Decision log**

- **Point 15.** Idle Hands, off the dear road (`C.rods.toWall.b`) behind Scar Tissue.
- **Points 16 to 26.** BORING: **11 bare attribute nodes in a row** (`C.rods.toWall.c, pyre.wheel.f1` [an elemental damage small], `rods.jR.a, ambulatory.nave.a/b, walk.w2…w7`) to reach Reliquary at `C.crypt.shrine.n`.
- **Totem twins.** Standing Cairns is 34 steps from Reliquary and 26 from Idle Hands. The totem specialization is spread so thin that nobody gets more than one totem notable plus the keystone without 20+ points of road.

---

## Vanguard

### V1: two-handed mace stun. Greatweight, Weight of Iron, Stagger, Rooted Stance

Gear: two-handed mace, armour body.

| Point     | Taken                                                                                                                                                      | str | Requirement                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------- |
| 10        | Oathbound (2), Weight of Iron (10)                                                                                                                         | 72  | 35, ok                                              |
| 20        | Greatweight (16)                                                                                                                                           | 132 | 62, ok                                              |
| 40        | Thunderstep (22), **Rooted Stance (28)**, Crushing Blow (30), Stagger (34), Ground Shaker (37)                                                             | 192 | 107, ok                                             |
| 60        | Unshakable, Bracing (dead), Mortar and Stone, Iron Lungs, Vampiric Strikes, Heavy Hands (59)                                                               | 272 | 155 (the L90 requirement of 220 is met at point 51) |
| 90        | Headsman (65), Unbroken, Tempered, Stone Heart, Elemental Ward, Long Reach, Thick Skin, Second Wind, Unbloodied, War Drums                                 | 342 | 220, ok                                             |
| 120 (L97) | Scar Tissue, Provisions, Barrow Ward, Broad Back, Quartermaster, Unhurried (dead end), Steady Hands, Banner, Stout Heart, Field Dressing, Blood Rite (120) | 399 |                                                     |

**Decision log**

- **Points 1 to 2.** `W.home.sig.b` (melee physical), then Oathbound. Good.
- **Points 3 to 10.** `W.home.roadM.a/b/c` (life ×3) → `W.maces.toHome.b/a` → Weight of Iron.
  - The roadM `why` says "Melee physical damage three times", but the nodes are life. The `why` is stale.
- **Points 11 to 16.** `weight.c → j1 → roadG → greatweight.a/b/n1`.
  - JANK, neighbours that do not compete: Weight of Iron and Greatweight are **5 steps apart** and both sell physical damage plus 20% stun duration. A two-handed mace takes both.
- **Points 17 to 22.** Thunderstep (`W.slams.thunderstep.n`), 6 points back through the south hub. INTERESTING: it is the slam partner rather than the stun one.
- **Points 23 to 28.** Rooted Stance at point 28.
  - INTERESTING: Broad Back and Greatweight are two sides on the route to the keystone.
  - TRAP: the keystone's cost ("cannot evade") is invisible on any armour character, so it is a free keystone at point 28 for both the Vanguard and the Zealot.
- **Points 29 to 34.** Stagger from the two-hander wheel passes **Crushing Blow** (`crushing.b → n → a → toStagger.a → stagger.a/n`), because `crushing.b` links only `n` and `greatweight.d`. The alternative is 2 points longer, through the Cleaver axe smalls. FORCED, but the build half-wants it.
- **Points 35 to 37.** Ground Shaker via `W.maces.toShaker.a`. The Ground Shaker `why` still says it is entered "from Greatweight"; it is entered from the tower junction.
- **Points 41 to 46.** `W.rampart.toBracing.a → bracing.n` is a dead notable for a two-hander (shield block), but it is the cheapest bridge to Mortar and Stone (`bracing.a → bulwark.d → n2`). FORCED; the alternative is through Iron Lungs.
- **Points 48 to 59.** `W.slams.vampiric.n → W.grit.north.a/b/c → drums.c/b → j1 → roadH → heavyHands.b/n`. BORING: 6 strength nodes and 2 warcry smalls to reach two-handed speed.
- **Points 60 to 101 (late).** All inside the Wall: Headsman (2H), grit and resists, the Barrows road, Long Reach (`W.grit.southWest.b/c/d` are bare strength), Barrow Ward (`W.grit.east.e4/e5`).

**Late verdict.** Coherent but region-locked. The Wall alone fed a 101-point two-handed mace. The build never had a reason to cross, which §9.3 expects from about point 80.

### V2: mace and shield armour. Bracing, Mortar and Stone, Stone Heart, Weight of Iron

Gear: one-handed mace, armour shield, armour body.

| Point     | Taken                                                                                                                                                                        | str | Requirement |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------- |
| 10        | Oathbound, **Bracing (6)**, **Mortar and Stone (10)**                                                                                                                        | 62  | mace 41, ok |
| 20        | **Weight of Iron (14)**, Iron Lungs (15), **Stone Heart (19)**                                                                                                               | 82  | 56, ok      |
| 40        | Unshakable, Elemental Ward, Second Wind (28), Crushing Blow (35)                                                                                                             | 172 | 107, ok     |
| 60        | Thick Skin, Iron Faith, Banner, Ground Shaker, Vampiric Strikes, Stout Heart (Yard)                                                                                          | 226 | 152, ok     |
| 90        | Killing Pace (on the cheapest path), Steel Rim, Tempered, Stagger, Steady Hands, Unerring Discipline, Hallowed Hammer                                                        | 310 | 220, ok     |
| 122 (L99) | Four Winds, Rooted Stance, War Drums, Shield Catch, Unbroken, Quartermaster, Field Dressing, Broad Back, Provisions, Unbloodied, Hearthfire, Litany, Vigil, Shieldwall (122) | 347 | ok          |

**Decision log**

- **Points 1 to 19.** JANK, the worst one-stop shop in either region. Bracing (6), Mortar and Stone (10), Weight of Iron (14), Iron Lungs (15) and Stone Heart (19) are all one cluster apart:
  - `bracing.n → b → a → W.rampart.bulwark.d → n2` takes 4 steps.
  - `n2 → ironLungs.a → b → W.maces.weight.c → weight.n` takes 4 steps.
  - The Bulwark wheel's two notables, life (Stone Heart) and armour (Mortar and Stone), are both wanted by this build, so the wheel's sides are not a choice for it.

  The build made no decision before point 20 except the order.

- **Points 29 to 35.** Crushing Blow from the mace junction runs through the axe smalls (`W.maces.toCleaver.a → cleaver.a → c → b → crushing.a`) or the two-hander smalls (`roadG → greatweight.a → n2/b … d → crushing.b`). Either way it is 3 dead smalls. FORCED, mild.
- **Points 42 to 46.** Iron Faith (`C.nave.wheel.n3`) is 4 points over the border and duplicates Bracing (see Z4).
- **Points 56 to 67.** Into the Yard by `W.slams.thickSkin.b ↔ Y.home.fieldDressing.b` for Stout Heart and Steel Rim, passing **Killing Pace** (`Y.blades.killingPace.n`) on the cheapest way to `Y.shield.hub.a`. Avoiding it costs 1 more and passes the Reaver's Quickened Steel instead.
- **Points 83 to 85.** Unerring Discipline costs nothing on a non-crit mace, and Steady Hands' accuracy becomes waste. The keystone sits beside Steady Hands, so it is free.

**Late verdict.** Defensive and spread over three regions, which is fine. But the build was "done" at point 19.

### V3a and V3b: totems and Strongarm (short walks)

**V3a** (slam totem with a two-handed mace, walked to 103):

| Point | Taken                                                                                        | str | Requirement (two-handed mace)              |
| ----- | -------------------------------------------------------------------------------------------- | --- | ------------------------------------------ |
| 10    | Oathbound, Quartermaster (5)                                                                 | 102 | 35, ok                                     |
| 20    | Standing Cairns (11), Thunderstep (12), Second Wind (19)                                     | 152 | 62, ok                                     |
| 40    | Elemental Ward, Scar Tissue (24), **Idle Hands (29)**                                        | 236 | 107, ok (already over the L90 requirement) |
| 60    | **Reliquary (42)**, Vampiric Strikes, Ground Shaker, Greatweight, Weight of Iron, Broad Back | 276 | 155, ok                                    |
| 90    | Rooted Stance, Mortar and Stone, Stone Heart, Unshakable, Thick Skin, Tempered, Heavy Hands  | 376 | 220, ok                                    |
| 103   | Long Reach, Provisions, Barrow Ward                                                          | 443 |                                            |

- Standing Cairns is close (`W.slams.j1.a → toCairns.a → cairns.a/n`, 11). INTERESTING: Cairns or the slam (Thunderstep) first.
- Idle Hands (26 steps from Cairns) comes through Second Wind, Elemental Ward and Scar Tissue, all of which the build wants. Fine.
- BORING: Reliquary, the second totem notable, needs **12 bare nodes** after Idle Hands (points 30 to 41: `C.rods.toWall.c, C.pyre.wheel.f1, C.rods.jR.a, C.ambulatory.nave.a/b, walk.w2…w7, C.crypt.shrine.e`).
- After point 42 there are no totem nodes left in reach. The rest is two-hander and armour, so the "totem build" is three notables and a keystone.
- Strength reached 443 against 220.

**V3b** (bow totem with Strongarm, 24 points): Standing Cairns (11), Strongarm (16), then `Y.blades.j1.a` and Iron Draw (24).

- Dexterity was 14, then 21, then 28 against the bow's 38 at L10 and 65 at L18 (short 24, 44, 37).
- Strongarm exists for "the bow-totem Vanguard and the thrower", but a bow needs 222 dexterity late and Bob has no thrown weapon. The Vanguard's nearest dexterity is the Yard's +7/+7 nodes. The keystone's intended build is gear-gated from the first map.

### V4: big axe toward the Yard. Cleaver, Headsman, Hewing

Gear: two-handed axe; armour/evasion body as a check.

| Point | Taken                                                                                                                 | str/dex | Requirement (two-handed axe)   |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------ |
| 10    | Oathbound, Thunderstep (8)                                                                                            | 99/21   | 31/9, ok                       |
| 20    | Guarded (11), **Keen Edge (14, forced)**, Hewing (17), **Elemental Edge (20, forced)**                                | 106/28  | 44/25, ok                      |
| 40    | Headsman (24), Heavy Hands (31)                                                                                       | 200/42  | 64/37, ok (body short 6)       |
| 60    | Greatweight (43), Cleaver (46), Rooted Stance, Fencer's Eye                                                           | 234/56  | 122/57, **short 1** (body 12)  |
| 90    | Open Veins, Blood Rite, Unbroken, Unshakable, Thick Skin, Tempered, Barrow Ward, Executioner, Stout Heart, Four Winds | 291/63  | 158/86, **short 23** (body 53) |

**Decision log**

- **Points 9 to 14.** `W.slams.toYard.a → Y.blades.guarded.b → guarded.n/a → keenEdge.b → keenEdge.n → Y.blades.j1.a`.
  - FORCED-ish: on the cheapest path (14) Hewing is behind **Keen Edge** (swords), because `keenEdge.n` is the only way from Guarded to the junction.
  - The alternative is 15, through the Standing Cairns _smalls_ (`cairns.a → c → b → W.slams.j2.a ↔ Y.blades.j1.a`) without the notable. So the price of skipping the sword notable is 1 point of totem smalls.
- **Points 18 to 24.** Headsman from the Yard: `hewing.b → elementalEdge.a → elementalEdge.n → toHeadsman.r1/r2/r3 → W.grit.headsman.n`.
  - FORCED: **Elemental Edge** is a pass-through.
  - The Wall-side approach is 25 points, through Vampiric Strikes, the drums and Heavy Hands. Headsman is effectively a Yard notable; the Barrows road is its back door.
- **Points 25 to 31.** `headsman.b/a → W.grit.east.e3/e2/e1 → heavyHands.b/n`. INTERESTING: two-handed speed, 6 from Headsman.
  - Headsman, Hewing and Heavy Hands sit within 6 steps of each other: a near one-stop for two-handed axes.
- **Points 32 to 46.** Cleaver is 15 points away, in the west tower, past the roadM life, the Weight of Iron smalls and Greatweight. Cleaver is 20 to 22 steps from both other axe notables.
  - TRAP for this build: §16 already notes Cleaver sits on the side farthest from the Yard. A big-axe player skips it, and a one-handed axe player gets strength there but no dexterity.
- **Dexterity.** After 30 points in the Yard the build holds 63, against 86 for the heaviest two-handed axe at L70. The Yard nodes this route crosses are mostly smalls and notables. Its attribute nodes are `Y.blades.j1.a` and `toHeadsman.r1/r2` (+7/+7) and `r3`, which is +10 _strength_. Meanwhile the build holds 291 strength against 158.

**Late verdict.** Acceptable. The late game spreads over the Yard's bleed and crit and the Wall's grit. The two-handed axe never reaches its weapon's dexterity from the tree.

### V5: strength caster (sceptre and armour shield). Iron Liturgy

Gear: sceptre, armour shield, armour body.

| Point | Taken                                                                                                           | str/dex/int | Requirement (sceptre)     |
| ----- | --------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------- |
| 10    | Oathbound                                                                                                       | 102/14/14   | 22/0/22, **short 8 int**  |
| 20    | Vampiric Strikes (13, forced), Iron Liturgy (18)                                                                | 142/14/14   | 25/0/35, **short 21 int** |
| 40    | Banner (22), Hearthfire (29), Zeal, Vigil, Choirmaster                                                          | 188/14/60   | 52/0/62, short 2          |
| 60    | Homily (41), Spellsword (59, Yard, 18 points of road)                                                           | 303/49/60   | 81/0/85, **short 25**     |
| 82    | Litany, Iron Faith, Mortar and Stone, Glass Wall, Unshakable, Thick Skin, Tempered, Second Wind, Elemental Ward | 343/49/60   | 113/0/131, **short 71**   |

**Decision log**

- **Points 7 to 18.** Iron Liturgy (`W.grit.liturgy.n`) is reachable only past a melee notable:
  - `W.slams.unbloodied.a/b → vampiric.a → vampiric.n` (melee leech), then `W.grit.north.c/b → liturgy.a/b/n`;
  - or `W.maces.greatweight.a/b` (two-hander smalls) and `W.grit.west.a/b/c`.

  FORCED.

- **Placement.** Iron Liturgy is the Wall's only spell notable, and it sits in the south-west, the side farthest from the Cathedral's intelligence. The Wall has no spell weapon that needs only strength. Every spell weapon (sceptre 131 int, staff 117 int) asks for intelligence, so the strength caster is gear-gated until it crosses the Banner to the Zealot (`W.resists.banner.n → C.home.hubs.w`).
  - Iron Liturgy to Hearthfire is 24 steps; Iron Liturgy to Homily is 33.
- **Points 41 to 59.** The `W.grit.east.e1…e8` Barrows road plus `Y.blood.toWall.a/j3.a` lead to Spellsword: 13 attribute nodes with two branches. BORING, and in hindsight this was my wrong choice (Spellsword is 22 from the start). It does show the e6 to e8 stretch is bare.

**Late verdict.** Weak. Spell supply near the Wall is one notable. The caster lives in the Cathedral after point 20 and stays intelligence-short.

### V6 (cross): Vanguard fire two-hander into the Cathedral. Kindled Steel, Searing Avatar, Hallowed Hammer

Gear: two-handed mace, armour body.

| Point | Taken                                                                                                                  | str/int | Requirement |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | ------- | ----------- |
| 10    | Oathbound, Weight of Iron                                                                                              | 72/14   | ok          |
| 20    | Greatweight (16)                                                                                                       | 132/14  | ok          |
| 40    | Second Wind (23), Elemental Ward (25), Scar Tissue (28), Kindled Steel (34), Tithe (36)                                | 177/49  | ok          |
| 60    | Searing Avatar (42), Hallowed Hammer (52), Benediction, Hearthfire                                                     | 232/84  | ok          |
| 90    | Litany, Broad Back, Rooted Stance, Thunderstep, Iron Lungs, Mortar and Stone, Stone Heart, Crushing Blow, Iron Liturgy | 342/84  | ok          |

**Decision log**

- **Points 17 to 28.** `W.home.hubs.n → roadR.a/b → W.rampart.toWind.a → secondWind.b/n → W.resists.star.c/n/w → scarTissue.a/n`. INTERESTING: three defence notables that a two-hander wants anyway on the way to the dear road.
- **Points 29 to 34.** `C.rods.toWall.a/b/c → C.pyre.wheel.f1/f2/f3` gives Kindled Steel at 34. Good: the dear crossing works as designed.
- **Points 35 to 42.** Tithe, then `tithe.b/c → jF → searingAvatar.*`.
- **Points 43 to 52.** `C.ambulatory.toWall.a/b → hymn.a/b (forced warcry smalls) → W.maces.toHymn.r4/r3/r2 → hammer.*`. The road loops back into the Wall's Barbican.
  - JANK: from Kindled Steel the cheapest way to Hallowed Hammer goes out into the Cathedral and back.
  - Hallowed Hammer is 5 steps from Crushing Blow, which the build passes anyway.

**Late verdict.** Satisfying. This is the best-working cross build in the audit.

---

## Findings, ranked by severity

### F1 (high): The Wall's Battlements are the Zealot's cheapest highway to its own western half

From the Zealot start, `C.pyre.wheel.f1` is 13 points via `C.nave.wheel.n2 → C.nave.toWall.a → W.resists.j.a → scarTissue.a → scarTissue.n → C.rods.toWall.a/b/c`, and 16 points through the Vestry wheel. Everything west goes through Scar Tissue on the cheapest path: Benediction (15), Searing Avatar (20), Consecrated Plate (18), Crozier (21), Ossuary (22), Brandwright (23), Battle Hymn (18), Idle Hands (14) and Tithe.

The near crossing (`C.nave.toWall.a`), the Wall junction and the dear crossing (`C.rods.toWall.*`) make a triangle that undercuts the region's own spine. Every west-bound Zealot pays a Wall grit notable. The Vestry wheel's sceptre/staff fork stops being a toll, because the player simply leaves the region.

**Fix, one of:**

- Land the dear road on `W.resists.scarTissue.a` or a new road node instead of the notable. This alone shortens the shortcut by 1, so pair it with the next option.
- Give the nave a plain attribute road to the tower that costs about 13 without a notable, for example `C.nave.jN.a → 2 attribute nodes → C.rods.jR.a` along the north edge of the Vestry wheel. Then the Scar Tissue route is a choice (a Wall notable for the same price) rather than the only cheap road.
- Lengthen `C.nave.toWall.a ↔ W.resists.j.a` to two nodes.

### F2 (high): One-stop shops for the class's main builds

- **Mace and shield Vanguard.** Bracing, Mortar and Stone, Weight of Iron, Iron Lungs and Stone Heart are 4 steps apart in a chain (`W.rampart.bracing.n … W.rampart.bulwark.n2 … W.rampart.ironLungs.* … W.maces.weight.n`). The core is done at point 19.
- **Two-handed mace Vanguard.** Weight of Iron and Greatweight are 5 apart, both with 20% stun duration. Rooted Stance is 4 beyond, Crushing Blow and Stagger 6 beyond. The core is done at point 37.
- **Fire sceptre Zealot.** Gilded Rod, Kindled Steel, Tithe and Searing Avatar sit on one 11-node line, `C.rods.wheel.r3 → r7 → r4 → jR → C.pyre.wheel.f1 → f2 → f3 → f7 → f4 → jF → searingAvatar`. The §16 open item is unresolved.
- **Brands.** Brandwright (`C.ambulatory.brand.n`), Runecarver (`C.crypt.shrine.s`) and Sigil Warden are within 7.

**Fix:**

- Move Bracing's pocket off the Bulwark wheel, for example onto the Thunderstep/Thick Skin side, so shield and armour are 10+ apart.
- Move the Iron Lungs bridge so the armour notable does not lead straight to the mace notable.
- Put Kindled Steel on a side branch of the Ambulatory (for example where Rimed Steel is, off `walk.w6`, with the tower wheel's attack side becoming cold strikes), so the sceptre player chooses between the tower's fire attack and the Vestry's sceptre.
- Move Brandwright to the Choir/Spire side.

### F3 (high): Duplicate pairings (§5.1)

| Notables                                                                         | Shared pairing                          | Steps apart |
| -------------------------------------------------------------------------------- | --------------------------------------- | ----------- |
| Iron Faith (`C.nave.wheel.n3`) and Bracing (`W.rampart.bracing.n`)               | +5% shield block and 20% block recovery | 13          |
| Battle Hymn (`C.ambulatory.hymn.n`) and War Drums (`W.grit.drums.n`)             | warcry effect and warcry duration       | 22          |
| Second Wind (`W.rampart.secondWind.n`) and Broad Back (`W.maces.greatweight.n2`) | life and regeneration                   | 13          |
| Weight of Iron and Greatweight                                                   | weapon damage and 20% stun duration     | 5           |

The Battle Hymn `why` also claims War Drums "sells the charges", which it does not.

**Fix:**

- Iron Faith → block with energy shield or spell block (the Zealot's two pools). Bracing keeps block with stun.
- War Drums → warcries with endurance or grit charges, or with warcry cooldown. Battle Hymn → warcries with elemental damage with attacks.
- Broad Back → life with two-handed stun threshold or life with armour.
- Drop the stun line from Greatweight; stun stays on Weight of Iron, Stagger and Headsman.

### F4 (high): The minion specialization runs out at point 35

The whole network has Shepherd, Familiars and Ossuary, plus Volatile Servants. The Zealot summoner had them all by point 35 and spent 88 points on generic nodes.

Totems are also thin: Standing Cairns, Reliquary and Sentry Post, 26 to 34 steps apart, plus Idle Hands. There are no minion smalls on any road.

**Fix:** add 2 or 3 minion clusters with distinct partners:

- minions with auras, in the Choir;
- minions with block or armour, at the Wall border near Battle Hymn;
- minion speed with flasks or mana, near Draught.

Make Shepherd and Familiars differ more: today both are minion damage with minion life.

### F5 (medium-high): Attribute over-supply in both regions

At point 90:

| Build                    | Held              | Heaviest late requirement |
| ------------------------ | ----------------- | ------------------------- |
| Vanguard two-handed mace | 342 str           | 220                       |
| Vanguard mace and shield | 310 str           | 220                       |
| Zealot (Z1)              | 243 str / 223 int | 121/131                   |

The Vanguard meets its L90 requirement at point 51 (two-handed mace walk) or point 60 (mace and shield walk). The spread added roughly 25 bare +10 strength nodes:

- `W.grit.west.a/b/c`, `W.grit.southWest.a–d`, `W.grit.north.a–c`, `W.grit.east.e1–e4`
- `W.maces.toHymn.r1/r2`, `W.maces.toShaker.a`, `toStagger.a`, `toCleaver.a`

The cross builds are the ones that come up short: the axe (dexterity, short 23 at point 90), the caster (intelligence, short 71) and Strongarm (dexterity, short 37 to 44).

**Fix:**

- Turn the Wall's south and west roads that face other regions into hybrids: str/dex toward the Yard on `W.grit.east.e1–e4` and `W.slams.toCairns.a`, and str/int on `W.grit.north.*` and `W.grit.west.*` toward the strength caster.
- Or drop interior Wall road nodes to +7.
- Re-check against §7.4 once the sizes settle.

### F6 (medium): Crossings and routes that force a notable nobody on that route wants

| Route                                                                                     | Forced notable                                                                |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| The Hymn crossing into the Spire (`C.home.hymn.b → S.well.toCathedral.b → toCathedral.a`) | Wandwork (`S.well.wandwork.n`), because `toCathedral.a` has no other exit     |
| Vanguard to Hewing                                                                        | Keen Edge (`Y.blades.keenEdge.n`); +1 to avoid it through the totem smalls    |
| Hewing to Headsman                                                                        | Elemental Edge (`Y.blades.elementalEdge.n`)                                   |
| Vanguard to Steel Rim                                                                     | Killing Pace (`Y.blades.killingPace.n`); +1 to avoid it                       |
| The Rampart road                                                                          | Stagger (`W.rampart.stagger.n ↔ C.ambulatory.toWall.d`)                       |
| Vanguard to the Zealot home                                                               | Warlord's Banner (`W.resists.banner.n ↔ C.home.hubs.w`); the ring route is +1 |

**Fix:**

- Link `S.well.toCathedral.a` to `S.well.draught.a` or `S.well.j1.a`.
- Add `Y.blades.guarded.a ↔ Y.blades.j1.a`, or a road node.
- Let `Y.blades.toHeadsman.r1` attach to `Y.blades.hewing.b` or a junction rather than to Elemental Edge.
- Land `C.ambulatory.toWall.d` on `W.rampart.stagger.a`.

### F7 (medium): Free keystones for armour builds

Rooted Stance (`W.maces.rooted.k`, "cannot evade") costs nothing on a Vanguard or Zealot with 14 dexterity and no evasion gear. It was taken by points 28 to 52 in five walks.

Unerring Discipline (`W.rampart.unerring.k`) is free for any non-crit Vanguard, and it sits beside the accuracy cluster it makes redundant.

**Fix:** give Rooted Stance a sheet-visible cost an armour build feels, for example less movement speed or less attack speed, or "armour from your shield does not apply". Unerring Discipline is defensible as a PoE-style trade, but consider moving it away from Steady Hands.

### F8 (medium): Iron Liturgy is misplaced for its build

The strength caster's only Wall spell notable is in the far south-west (`W.grit.liturgy.n`). It is reachable only past Vampiric Strikes or the two-hander smalls, and it is 24 to 33 steps from the Cathedral's spell notables and intelligence. Every spell weapon needs intelligence, and the Wall has none.

**Fix:** move Iron Liturgy north onto the Battlements (near `W.resists.j.a` / `C.nave.toWall.a`), where the str/int crossing is, or put a str/int road beside it.

### F9 (medium): Stale `why` strings and missing links

| Node or cluster        | Its `why` says                        | Actual links                                                                                             |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `W.slams.unhurried.n`  | a chain "to the totems"               | links only `unhurried.a`, a dead end 108 units from `W.slams.cairns.a`, so it looks linked in D-vanguard |
| Standing Cairns        | reached "from the pace chain"         | not linked to it                                                                                         |
| `W.slams.unbloodied.c` | "the exit, to the warcries"           | links only `n` and `a`                                                                                   |
| `W.grit.drums.a`       | "entrance from the stun diamond"      | not linked to it                                                                                         |
| Weight of Iron         | "on to the slams through the notable" | not linked to the slams                                                                                  |
| Thunderstep            | "the maces arrive at its far side"    | no mace link                                                                                             |
| Ground Shaker          | entered "from Greatweight"            | entered from `W.maces.toShaker.a`                                                                        |
| `W.home.roadM` cluster | "melee physical damage three times"   | the nodes are life                                                                                       |
| Battle Hymn            | War Drums "sells the charges"         | War Drums has no charge line                                                                             |

**Fix:** either add the links the text promises (`W.slams.unhurried.n ↔ W.slams.cairns.a` is the obvious one, and `W.slams.unbloodied.c ↔ W.grit.drums.a`), or rewrite the text.

### F10 (medium): Filler road stretches

- `W.grit.east.e6 → e7 → e8 → Y.blood.toWall.a`: 4 nodes with nothing branching.
- `W.grit.east.e1/e2` and `e4`: no branches.
- `W.grit.west.a/b/c`: 3 bare nodes.
- `W.grit.southWest.a/c/d`: bare apart from Long Reach off `b`.
- `C.ambulatory.walk.w1…w7` plus `C.ambulatory.nave.a/b`: 11 attribute nodes end to end for anyone crossing from the tower to the crypt (Z6). Each walk node has a pocket, but 5 of the Ambulatory's 7 clusters are dead-end pockets (Crozier, Brandwright, Rimed Steel, Ossuary, Battle Hymn).
- The Wall's new pockets are also dead ends: Hallowed Hammer, Barrow Ward, Long Reach.

§3.6 asks that most pockets be bridges.

**Fix:**

- Bridge Crozier to Searing Avatar's spur junction or to `C.pyre.jF.a` side nodes.
- Bridge Ossuary to `C.ambulatory.crozier.b` or `rime.a`.
- Bridge Brandwright to `C.crypt.shrine.n`.
- Bridge Long Reach to `W.grit.west.c`.
- Put a pocket on `W.grit.east.e7`.

### F11 (low-medium): Placement jank in the renders

- `W.rampart.unerring.k` and `C.rods.idleHands.k` are two keystones 100 units apart, unlinked, across a region border. Their labels collide in D-all-nodes ("IDLE HANDS / UNERRING DISCIPLINE"). Move the Idle Hands spur toward `C.ambulatory.toWall.b`, or swing Unerring's spur south-west.
- OATHBOUND overlaps VANGUARD START (D-vanguard).
- The ELEMENTAL WARD / SECOND WIND / STONE HEART labels crowd each other; `W.rampart.secondWind.n` is 144 units from `W.resists.star.n`.
- The CONSECRATED PLATE label overlaps Lone Vow's keystone text (D-zealot-text).
- Unlinked pairs that read as linked: `W.slams.unhurried.n`–`W.slams.cairns.a` (108), `C.nave.toChoir.a`–`C.choir.wheel.c7` (103), `W.rampart.bracing.a`–`bracing.n` (113).
- The Cathedral's five areas are all the same eight-node, two-notable wheel (`nave`, `rods`, `pyre`, `choir`, `crypt`). The Ambulatory's pockets help, but in D-zealot the region still reads as five identical octagons.

### F12 (low): Cleaver is on no axe player's path

`W.maces.cleaver.n` is 20 to 22 steps from Hewing and Headsman. The big axe took it at point 46 as a 15-point detour. Already noted in §16. If the one-handed axe is meant to live with strength alone, say so; otherwise move it toward `W.slams.toYard.a`.

### F13 (low): Searing Avatar on the fire sceptre line

`C.pyre.searingAvatar.k` sits at the end of the fire-attack line, but on a physical sceptre it halves the hit unless gear converts the rest. The fire caster and the elemental-hit builds are fine. It is a keystone-design note: worth checking that a "fire striker" can actually reach 100% conversion.

---

## What works

- **The starts.** Both starts fan out well:
  - Zealot: Zeal at 2, Banner at 3, Hymn at 4, Alms at 5, Iron Faith at 6, Hearthfire at 7, and Choirmaster or Shepherd at 8.
  - Vanguard: Oathbound at 2, Unshakable and Quartermaster at 4, Bracing and Thick Skin at 6, Thunderstep and Second Wind at 7.
- **The Cathedral's wheels are real forks** with the route through taking one side:
  - nave: block or the fire spell;
  - Vestry: sceptre or staff;
  - tower: fire attack or aura;
  - Choir: aura or minion;
  - crypt: spell or spell block.
- **Lone Vow** against the reservation notables is a genuine late trade.
- **The dear crossing** from Scar Tissue to the tower makes a coherent Vanguard fire two-hander (V6), and the Zealot two-handed mace into the Wall (Z5) reaches its mace kit 3 to 10 points out at every stage.
