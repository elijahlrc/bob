# G3 round 1: the Zealot (the Cathedral)

Done 2026-10-22 for G3 round 1 of [G-growth.md](../../G-growth.md), from the joined brief
[G1-brief.md](../../G1-brief.md) (which wins), [G1/zealot.md](../../G1/zealot.md), [G2/zealot.md](../../G2/zealot.md) and
[G2/borders.md](../../G2/borders.md), under [CONSTRAINTS.md](../../CONSTRAINTS.md). Only `src/data/passives/cathedral/`
was edited. Nothing registered, baked or committed.

**The region: 165 → 182 nodes** (4 notables, 13 smalls; nothing removed; no id changed). 28 → 32 notables.

Pictures in [zealot/](zealot/): `before.png` and `before-text.png` (before the first edit), `after.png`, and close-ups with
every line: `verger-warding.png` (the Wall border: Verger and Warding Staff), `lectern.png` (the aisle, Lectern, Lone Vow,
Brandwright), `rood-screen.png` (the north walk).

## 1. The re-lines (approved at stop 2, and one the walks called for)

| notable                                  | before                                    | after                                                                     | units     | why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Iron Faith (`nave.wheel.n3`)             | block with a shield 4%, 8% ES, +40 armour | block with a shield 4%, 15% shield defences, 20% avoid stun with a shield | 4.3 → 4.0 | G1/zealot.md §4 (ZE-r1): a shield-only notable, so the Nave wheel is a shield or the fire spell. `shieldStunAvoid` was unused anywhere; it widens the vocabulary. Bracing (Wall) is block with recovery and stun threshold, so no copy.                                                                                                                                                                                                                                                                                                                                                                                                            |
| Shattering Rite (`crypt.rite.n`)         | 16% physical spells, 16% elemental        | 20% physical spells, 16% elemental                                        | 2.9 → 3.3 | Ledger ZE-p1 (at least 3 units).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Consecrated Plate (`ambulatory.plate.n`) | 24% armour, 10% ES                        | 24% armour, 30% reduced stun duration on you                              | 4.0 → 4.0 | G1-brief.md §4.3 left this to G3's walks: "drop Consecrated Plate's ES if the walks show the caster taking both". With Lectern in, the allocator's best plans for **all five** Zealot casters took Lectern, Consecrated Plate and Brandwright together (spell damage and energy shield in one stop, four steps apart). After the re-line, fire-burn, aura-brand, block-caster and storm-caster drop Plate; staff-block still takes it, because it is the crossroads on its way to Crozier. Partner chosen against copies: Thick Skin is armour with stun threshold, Mortar and Stone armour with physical reduction; `stunRecovery` was used once. |

Elemental Ward (the Vanguard's) is untouched, as stop 3 decided. Lone Vow's re-hang and the five pockets made bridges were
done in G2.

## 2. The clusters added (4 of 11)

| ledger | notable (id)                                   | lines (units)                                        | smalls                                   | hangs                                                                                                     | steps from the Zealot start | twins (steps, BFS)                                                                                             |
| ------ | ---------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------: | -------------------------------------------------------------------------------------------------------------- |
| ZE-5   | **Verger** (`cathedral.nave.verger.n`)         | 24% armour, 20% sceptre damage (2 + 2 = 4)           | 3 × 12% armour (lead: armour)            | a pocket loop from the Nave's crossing node `nave.toWall.a` to the Wall's `wall.resists.j.a`              |                           9 | sceptre: Hallowed Hammer 7, Gilded Rod 11; armour: Consecrated Plate 13. Iron Faith 5 (not a twin).            |
| ZE-7   | **Warding Staff** (`cathedral.rods.warding.n`) | 24% staff damage, +4% spell block (2 + 2 = 4)        | 3 × +2% spell block (lead: spell block)  | a pocket loop between the Vestry's dear road nodes `rods.toWall.a` and `rods.toWall.b`, toward Idle Hands |                          12 | staff: Quarterstaff 9, Crozier 13; spell block: Glass Wall 19, Rood Screen 23, Stone Ward 26                   |
| ZE-1   | **Lectern** (`cathedral.nave.lectern.n`)       | 16% spell damage, 6% reduced reservation (2 + 2 = 4) | 4 × 8% spell damage (lead: spell damage) | a straight bridge from the aisle's last node `nave.aisle.a3` north to Brandwright                         |                          15 | spell damage: Crozier 10, Homily 13; reservation: Choirmaster 7, Lone Vow (the fork) 7                         |
| ZE-11  | **Rood Screen** (`cathedral.crypt.rood.n`)     | 10% ES, +4% spell block (2 + 2 = 4)                  | 3 × 5% ES (lead: energy shield)          | a pocket inward off the north walk's third node `crypt.north.n3`, square to the walk                      |                          26 | ES: Tomb Dust 8, Consecrated Plate (no longer ES) 14, Ossuary 15; spell block: Glass Wall 12, Warding Staff 23 |

All twins of one specialization are 7 or more steps apart, each with a different partner. Every small in each cluster
carries the same line; every new small belongs to its notable. The convergence rule holds: Verger has no life, Lectern
no energy shield, Rood Screen no spell damage (ZE-9's spell damage will hang one node along, 26 steps out: the brief's
far destination).

**Why these four (the order the instructions give):**

1. **(a) The flattest wants.** From the G2-state allocator (`builds-before.txt` in the scratchpad): staff-block's
   block was **3.5 → 3.5** (it never grew), block-caster's spell block **6 → 6**, fire-burn's spell damage **15.8 →
   15.8**, aura-brand's auras **18.7 → 18.7**, sceptre-fire's armour **25.8 → 25.8**. Warding Staff and Rood Screen are
   spell block in two directions with two partners (a staff; energy shield); Lectern is spell damage and reservation;
   Verger is armour. Rood Screen is also the user's caster example's energy shield in a third direction.
2. **(b) Bare roads and deferred links.** Verger lays the deferred armoured-sceptre crossing. Rood Screen is the first
   thing off the north walk, the barest road G2 left (six nodes, nothing off them) and the brief's own test of the rim
   ("if nobody walks the north walk, bring it in"). Lectern closes the aisle's last hang point and makes Brandwright a
   bridge.
3. **(c) Spread.** The Wall border (Verger), the Vestry's outside (Warding Staff), the inside north-west (Lectern), the
   north rim (Rood Screen). Verger and Warding Staff are 7 steps apart, different specializations.

**Judgment calls:**

- **Warding Staff's smalls are spell block, not staff damage.** The ledger names it "staff damage + spell block"; I led
  with the flat want. Staff damage already has Quarterstaff (with attack block) and Crozier (with spell damage), 9 and
  13 steps away; block had no second place to climb.
- **Verger and Warding Staff are loops beside a link**, not bridges between far places: Verger's two ends are already
  joined directly (the Nave road crossing, which this round may not cut), and the brief put Warding Staff between two
  adjacent road nodes. Each is a pocket with two ways in; Verger is also a border crossing of its own.
- **Lectern is a straight seven-node line** (aisle node, two smalls, notable, two smalls, Brandwright), parallel to Lone
  Vow's spur one node back, so the fork reads at a glance. Brandwright turns about 90° where its old chain meets
  Lectern's (a notable corner, not flagged by the tool).
- **Rood Screen is a dead-end pocket** (§3.6, §13.5): the walk it hangs from has three ways in.

## 3. Deferred border links laid

- `cathedral.nave.verger.c` ↔ `wall.resists.j.a` (the armoured sceptre; G2/borders.md §4), written in `nave.ts`. The
  Battlements junction now has four links: toward `toWall.a` at −64°, Verger at −121°, Scar Tissue at 152°, the star at
  90° (gaps 57°, 87°, 62°, 154°).

ZE-8 ↔ Grim Oath waits for ZE-8 (round 3). MY-2 ↔ `cathedral.crypt.toSpire.b` is the Mystic's to lay. No other link
across a region line was added, cut or re-aimed.

## 4. Ids

New (17): `cathedral.nave.verger.{a,b,n,c}`, `cathedral.nave.lectern.{a,b,n,c,d}`, `cathedral.rods.warding.{a,n,b,c}`,
`cathedral.crypt.rood.{a,b,c,n}`. None changed, none removed.

**Other edits:** three area labels moved because they lay over notables (G2 flagged them for G3): The Nave
(−1846,−1214) → (−1966,−1374), off Vigil and Litany; The Bell Tower (−3321,−1139) → (−3301,−1359), off Rimed Steel and
Benediction; The Choir (−1592,−1670) → (−1662,−1830), off Shepherd. The scratch check now finds no Zealot label over a
notable, keystone, start or another label. Forward-looking `why` texts that named ZE-1/ZE-11 now name Lectern and Rood
Screen; the Nave wheel's and the file header's "block and armour" now say "a shield".

**No new area file.** Rood Screen lives in `crypt.ts` (the Undercroft), because no area name covers the north walk;
G2 already flagged that the walk wants its own area. With ZE-9 and ZE-3 coming in round 3, I recommend a new area file
and label for the north walk between rounds (index.ts is shared, so not done here). The other three clusters sit under
their areas' names.

## 5. Changed from the brief

- Consecrated Plate's energy shield dropped (the brief's conditional; §1).
- Warding Staff led by spell block, not staff (§2).
- Nothing else: every placement is at the brief's hang point, within about 60 units of the sketch.

## 6. Checks

- **Geometry** (`geometry.ts --region zealot --bends`): **0 crossings, 0 drawn over.** 20 bends over 20°, all
  pre-existing (five wheels' corners, Litany's two spokes, the G2 road corners `north.n1`, `rim.walk.o2`, `o4`). No new
  bend: every new chain is straight. `north.n6`'s 107° left the list (it is a junction now).
- **Audit** (`passives:audit -- zealot`): problems 0. **Notables in units: all 32 between 3 and 5** (Tithe 3.0, the
  lowest; Shattering Rite 3.3; the four new ones 4.0). Ways in: every area has two or more; Verger and Warding Staff are
  loops with two ways in; Lectern a bridge; Rood Screen a pocket on a road with three ways in.
- **Names:** `npx vitest run src/data/ip.test.ts` passes; Verger, Lectern, Warding Staff, Rood Screen each 0 hits in
  `reference/tree/ref-tree.json`.
- `npx tsc --noEmit -p .` clean; `buildAll` problems 0 (none with `cathedral.`).

### The allocator (indicative: the other five regions were mid-edit in the same tree)

Units at 120 → 160 points (before: the G2 state at the start of this round; after: this round's end).

| archetype    | main stat     | before 120 → 160 | after 120 → 160 | note                                                                                                          |
| ------------ | ------------- | ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| fire-burn    | spell damage  | 15.8 → 15.8      | 27 → 32.5       | no longer flat; Lectern is in its 60-point gave-up list                                                       |
|              | fire damage   | 24.9 → 30.5      | 25.9 → 25.9     | flat now (it spends on spell damage instead)                                                                  |
|              | life          | 26.4 → 36.4      | 25.8 → 41.8     |                                                                                                               |
| staff-block  | block         | 3.5 → 3.5        | 6.5 → 8.5       | grew (Warding Staff at 60 and 120) but still nearly flat past 120: Rood Screen is 23 steps from Warding Staff |
|              | spell damage  | 22.8 → 25.4      | 33.5 → 41.8     |                                                                                                               |
| aura-brand   | auras         | 18.7 → 18.7      | 18 → 22         | no longer flat; Benediction (4) in its 120 gave-up list                                                       |
|              | brand damage  | 21.4 → 23.4      | 22.2 → 27.4     |                                                                                                               |
| block-caster | spell block   | 6 → 6            | 8 → 8           | Rood Screen taken at 120; still flat past it                                                                  |
|              | block         | 10.5 → 20.5      | 5 → 13          |                                                                                                               |
|              | spell damage  | 14.8 → 14.8      | 27.8 → 29.8     |                                                                                                               |
|              | energy shield | 22.6 → 28.6      | 33.6 → 35.2     |                                                                                                               |
| storm-caster | spell damage  | 17.8 → 19.1      | 36.2 → 41.7     |                                                                                                               |
| sceptre-fire | armour        | 25.8 → 25.8      | 39.7 → 45.8     | no longer flat; Verger taken at 60                                                                            |
|              | life          | 36.6 → 40.6      | 23.4 → 34.2     | traded life for armour: a choice the network now makes it face                                                |

Targets for the six Zealot archetypes: typical main stat gain at 120 **11% → 24%** (target 30%+); main stats gaining
10% or less **48% → 19%**; notables worth 2.5+ in the 120 gave-up list typically **1 → 3**, builds with none **3 → 0**;
builds with a single plan at 120 **1 → 0**, with three or more **4 → 6**; typical tax at 120 **40% → 35%**.

**Strength by the back door (G-growth §4), said out loud.** Spell damage at 120 roughly doubled for the Zealot casters
(fire-burn 15.8 → 27, storm 17.8 → 36.2, block-caster 14.8 → 27.8). Lectern is 6 of those units; the rest comes from
the Mystic's new clusters in the same tree (Keen Verse, Piercing Word and others appear in the took and gave-up lists).
Spell damage still climbs past 120 for every caster, so it is now a want they leave behind rather than one they finish,
but the level is higher than the G-growth §0 aspiration (main stats end roughly where they are). This is a whole-map
question for the round's join, not one cluster's. Sceptre-fire's armour rose (25.8 → 39.7) while its life fell (36.6 →
23.4): a trade, not a free gain. Likewise block-caster's attack block at 120 fell (10.5 → 5) and staff-block's block
reads 8.5 at 60 but 6.5 at 120: the allocator's 120-point plans now spend on spell damage and Rood Screen instead of
the Nave's and the Muster's block smalls. The supply did not shrink; the plans traded.

**Who walks the rim:** Rood Screen is taken by block-caster at 120, by the Mystic's summoner from 80 and by the Mystic's
classic caster at 100, and sits in caster-es's 60-point gave-up list. The north walk is used.

**Still one-stop-ish:** every Zealot caster that takes Lectern also takes Brandwright, one step past its chain, for
Brandwright's elemental damage and cast speed (generic caster lines on a brand notable). See question 1.

## 7. Walks (by hand on the map, with the cheapest path)

**W1, the Zealot's main build: the staff blocker, 20 points.** Zeal (2); the middle road's life to Hearthfire (8); the
fire spoke through the wheel's east exit and the nave junction to Quarterstaff (14); then the choice. Warding Staff is
8 more through Scar Tissue and the dear road (22): spell block on every node. Or Lectern from Hearthfire by Litany and
the aisle (Litany at 10, Lectern at 18): spell damage. At 20 points it gets one: the block or the spell damage. What it
gave up is the other, 4 to 6 units. No stretch without a choice: the Nave wheel is the first fork (shield or fire
spell); a staff caster now takes the fire side, since Iron Faith is shield-only. Notable nobody here takes: Iron Faith
(right: it is the shield caster's).

**W2, an off-build: the armoured sceptre, 20 points.** Zeal (2); the west road with Alms (6); Verger by the Nave's
crossing node (11: two armour smalls and the notable, or by the Battlements junction, same cost); Iron Faith one step
away is a shield notable, which a one-handed sceptre with a shield may take (12); Gilded Rod across the wheel (18). It
chose armour and sceptre at home; it gave up Hearthfire's fire and the Wall's Elemental Ward (2 steps from Verger by the
junction). No stretch without a choice. Notable nobody takes: none on this path.

**W3, a neighbour coming in: the Vanguard's mace player, 16 points.** Elemental Ward (7); Verger by the Battlements
junction and Verger's far armour node (11); Hallowed Hammer by Scar Tissue and the Vestry's dear road (16). The Vanguard
now reaches a Zealot armour-and-sceptre cluster four steps past its own resist notable, and the Zealot's sceptre reaches
Hallowed Hammer. It chose armour and maces along the border; it gave up the Rampart's Mortar and Stone in the other
direction. (A Mystic caster coming west reaches Homily at 20 and Lectern 7 later: the Zealot's spell damage is now a
direction the Mystic chooses, not one it finishes.)

**W120, the shield caster, 120 points.** Zeal 2, Hymn 6, Iron Faith 11, Hearthfire 14, Litany 16, Vigil 18,
Choirmaster 20; Glass Wall 26 and Homily 28 (the Undercroft wheel, both sides); Tomb Dust 32; the north walk to Rood
Screen 40; Shattering Rite 44; east into the Mystic for Glass Skin 52, Quiet Pulse 55, Spirit Ward 57, Arcane Focus 63,
Warm Blood 68; Living Ward 71; back to the aisle for Lectern 78; Deep Well 79, Quickening 82; the Wall's Bracing and
Unshakable through the Banner 95. That leaves about 25 points for the smalls of what it holds. What it gave up: Brandwright
(one step past Lectern, 81), the Vanguard's Stone Ward and the Reaver's Shieldwall (20 more points), Warding Staff (a
staff, so not this build). Real choices it made: the north walk's energy shield (8 points for Rood Screen) against the
aisle's spell damage (7 for Lectern) came 38 points apart; the Mystic's east against the Wall's block. Stretches with no
choice: the four road nodes of the north walk between Tomb Dust and Rood Screen (the walk's middle carries nothing until
ZE-9 lands on `n4`). Notables nobody here takes: Living Ward is a keystone it may skip; Verger and Warding Staff are other
builds'.

## 8. Rounds 2 and 3

- **Round 2 (inside first, then one rim corner):** ZE-2 (minions with life) south off `aisle.a2` to the Vestry junction,
  completing the aisle's cross; ZE-4 (cold with a shield) across the Vestry patch from `nave.jN.a` to `rods.toWall.c`,
  the shield's third direction; ZE-10 (energy shield with life) off the Churchyard's `o2`, the fire caster's defence and
  the Churchyard's first cluster. Also: the north walk's own area file and label (between rounds), and question 1 below.
- **Round 3 (the rest of the rim):** ZE-6 (sceptre with burning) off `o4`; ZE-8 (life with auras) bridging Censer to
  Grim Oath, with its deferred border link; ZE-9 (spell damage with duration) off `north.n4`; ZE-3 (channelling)
  bridging Shattering Rite to `north.n6`. Round 1's walks say the north walk is used (Rood Screen taken by three
  archetypes), so ZE-9 and ZE-3 stay where the brief put them.
- Watch in rounds 2 and 3: the Zealot casters' spell damage level (§6), and staff-block's block, which grew but is still
  nearly flat past 120.

## 9. Open questions

1. **Brandwright as a caster stop.** With Lectern's chain landing on it, every Zealot caster takes Brandwright for its
   elemental damage and cast speed, not its brands. Re-line Brandwright to brand-only lines (brand damage with duration
   or area), or land Lectern on Brandwright's first small instead? I would re-line it in round 2 if the user agrees.
2. **The casters' spell damage level** at 120 has roughly doubled across the Zealot archetypes, mostly from the
   Mystic's new clusters plus Lectern. Accept for now and judge at the round's join, or price spell-damage notables
   lower?
3. **The north walk's area.** A new area file and label for it before round 3 (where ZE-9 and ZE-3 land)?

Nothing in this round felt like it was losing intent: each cluster is at the brief's place for a player's reason, and
the one change from the brief (Consecrated Plate) is the brief's own conditional, met by the walks.

## 10. CONSTRAINTS checklist

- **§1 What the tree is for.** Each new cluster splits a want the allocator showed flat (block, spell block, spell
  damage, auras, armour); after it, the Zealot builds' gave-up lists hold 3 notables worth 2.5+ typically (was 1) and
  every build has two or more near-equal plans. Weighed against the rest (§13 below): the start untouched, no filler.
- **§2 The reference.** Nothing copied; names are plain words with no hit in the reference tree; the reference game is
  not named.
- **§3 A network.** Three new loops (Verger, Warding Staff, Lectern through Brandwright to the walk); Brandwright stops
  being a dead end; one dead-end pocket (Rood Screen) on a road with three ways in; one new border crossing, laid as
  listed; nothing else across a border.
- **§4 Regions and areas.** No build-named area; the defences stay varied (armour Verger, spell block twice, ES Rood
  Screen; Iron Faith is block; Consecrated Plate armour and stun recovery).
- **§5 Specializations.** Twins 7 to 26 steps apart, each with a different partner; sceptre and staff, the Zealot's
  weapons, on the strength-and-intelligence roads; neighbours compete (the Brandwright note, question 1).
- **§6 Starts.** Unchanged; nothing new within 8 steps (Verger at 9, the nearest).
- **§7 Roads and attributes.** No road added; Rood Screen is the north walk's first branch; no attribute value changed.
- **§8 Clusters and smalls.** Every notable 3 to 5 units (all 32 in the region); every new small one line, uniform in its
  cluster; every new small belongs to a notable; Iron Faith's re-line makes the Nave wheel a real choice.
- **§9 Keystones.** All six keep one link; none moved.
- **§10 Vocabulary.** Only lines from `lines.ts`, unedited; two lines used for the first time in the region or the tree
  (`shieldStunAvoid`, `stunRecovery` on a second notable); one theme per cluster (armour with the sceptre, staff with its
  block, spell with reservation, ES with spell block).
- **§11 Looks.** 0 crossings, 0 drawn over, no new bend; smalls about 70 out and 50 to 60 apart on straight chains;
  three labels moved off notables; close-ups rendered.
- **§12 Size.** +17 nodes, an outcome. No bot simulation; the allocator is a static tool.
- **§13 Tensions.** Connections against trade-offs: Lectern makes Brandwright cheaper (question 1). Strength by the
  back door: spell damage's level reported (question 2). Bridges against dead ends: Rood Screen kept a tip.
- **§14 Rejected ideas.** No generation (positions computed by hand from the hang points, then looked at); no build list
  as the basis (the allocator read after placing); no step-count reach; no spacing rule.
- **§15 How the work is done.** CONSTRAINTS and every brief read first; before and after pictures; checks after each
  batch; walks by hand; only this region's folder edited; no register, bake, commit or stash.
- **§16 Open.** The north walk's area; the casters' spell damage level; Brandwright.
