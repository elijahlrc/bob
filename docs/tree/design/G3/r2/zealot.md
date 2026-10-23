# G3 round 2: the Zealot (the Cathedral)

Done 2026-10-22 for G3 round 2 of [G-growth.md](../../G-growth.md), from the round-1 report
[../r1/zealot.md](../r1/zealot.md) (its plan for rounds 2 and 3), the user's decisions after round 1 (CONSTRAINTS §4.8),
the joined brief [G1-brief.md](../../G1-brief.md), [G1/zealot.md](../../G1/zealot.md), [G2/zealot.md](../../G2/zealot.md)
and [G2/borders.md](../../G2/borders.md), under [CONSTRAINTS.md](../../CONSTRAINTS.md). Only `src/data/passives/cathedral/`
was edited. Nothing registered, baked or committed; no label was checked or moved after the user's note of the same day
("don't worry about region labels").

**The region: 182 → 194 nodes** (the audit's count with the start; 3 notables and 9 smalls added, nothing removed).
32 → 35 notables. Fourteen nodes changed id (the Lychway move, two of Lectern's smalls, Alms; §4).

Pictures in [zealot/](zealot/): `before.png` and `before-text.png` (before the first edit), `after.png`, and close-ups with
every line: `aisle-sexton-brandwright.png` (the aisle: Sexton, Lone Vow, Lectern, Brandwright), `frozen-font.png` (the
Vestry's inside), `wake.png` (the Churchyard corner), `home-ardour.png` (the start and the west of the home).

## 1. Hot spots and the home (the user's decisions after round 1)

### 1.1 Brandwright, re-lined to brands (the user's decision)

| notable                                      | before                                                | after                                               | units     |
| -------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- | --------- |
| Brandwright (`cathedral.ambulatory.brand.n`) | brand damage 20%, elemental damage 10%, cast speed 4% | brand damage 24%, crit chance with brand skills 30% | 3.7 → 4.0 |

Brand crit is a partner neither brand twin has (Runecarver is brands with duration and area). It is live: a tagged
`critChance` reaches every use carrying the tag (A2-vocabulary: "every tag of the mod must be on the use"), and both brand
gems carry `brand`; the game's card says "with Brand Skills". Two notes for others: the `critChance` line's label in
`lines.ts` does not print its tags, so `--text` pictures and listings show "30% crit chance" (the same is true of the
melee crit smalls); and `aura-brand` has no weight for brand crit, so the allocator prices Brandwright at its brand damage
only. Neither is a reason to choose differently.

### 1.2 Lectern's spell damage (the spell-damage hot spot at home)

At 120 points Lectern was the largest single Zealot source of spell damage for the casters (6 units in one stop, with
Brandwright's elements and cast speed one step on). The two smalls between Lectern and Brandwright were spell damage and
counted as Lectern's; by the stat, and now that Brandwright is the brand cluster, they belong to Brandwright (§11.5:
whose a small between two notables is, the stat says). They carry brand damage now, and the bridge reads spell, Lectern,
brand, Brandwright, brand. Lectern is 4 units of spell damage with its reservation. Ids: `cathedral.nave.lectern.c` →
`cathedral.ambulatory.brand.d`, `cathedral.nave.lectern.d` → `cathedral.ambulatory.brand.c`; positions unchanged.

Result in the allocator: no Zealot caster takes Lectern or Brandwright any more (fire-burn, staff-block, block-caster,
storm-caster all dropped both); aura-brand takes both, as it should. The casters' spell damage at 120 now comes almost
wholly from the Mystic (Arcane Focus, Keen Verse, Living Verse, Piercing Word) and the Undercroft (Homily, Shattering
Rite). See question 1.

This round's three clusters carry no spell damage, so "place this round's spell clusters where they cost another want"
applies to round 3 (ZE-9). Where this round adds a caster's want, it is placed to cost one: Frozen Font's block and Wake's
two pools are both away from the casters' spell damage (south-west and far west, against the Undercroft and the Mystic
north and east).

### 1.3 The home (CONSTRAINTS §4.8, and the coordinator's note on the first six steps)

The first nine steps from the Zealot start, before this round (scratch BFS, every node by kind):

- **East:** elemental damage (point 1), the signature Zeal (elements, global defences, life), Hymn (mana, 4), the east
  road to the transept, the Nave wheel's fire side (Hearthfire, 7), the Choir (auras or minions, 8).
- **Middle:** Zeal, then life ×3, then the wheel's life end.
- **West:** armour (point 1), the west hub (the Wall's Banner one step across: auras), Alms (flask effect, flask
  duration, regeneration; 5), the west road, the wheel's block side (Iron Faith, 6), the crossing node, Verger (armour ×3,
  then armour with sceptre damage; 9). Plus, on the ring, Provisions (flasks) and Waste Not (mana cost) at 6.

**The west read as one kind**: armour, flasks, block, armour, with no offence notable within six steps on that side; the
first offence notable anywhere was Hearthfire at 7, and the strength side of a strength-and-intelligence class offered a
striker nothing until Gilded Rod at 12. That is the user's own picture: "only health and armor and maybe a bit of es or
flask recharge near one of the starts". The east was mixed (elements, mana, auras); the middle is life, which every
build takes.

**Done: Alms became Ardour** (`cathedral.home.alms.*` → `cathedral.home.ardour.*`, same places): the pocket off the west
road is now elemental damage with attacks (the small, 10%) and the notable with elemental damage with attacks 20%,
attack speed 5% and accuracy 10% (2 + 1 + 1 = 4 units, as Alms was). Five steps from the start, a loop beside the west
road. No weapon is named (§6.3), so a sceptre, a mace or a staff striker takes it, and the caster's offence stays east
(Zeal, Hearthfire). The first points now hold a real offence choice on both sides: west the attack, east the elements
and the fire spell; the west road also still reaches block and armour.

Weighed and said out loud:

- **The flask pocket is gone from the region.** The home's flasks are the centre's Provisions, six steps from the start
  by the west hub's ring road, on the Zealot's side of the ring; the Spire's Draught is nine. §4.6 asks every region to
  sell flasks in its own voice; the Zealot now sells none of its own (question 2).
- **Strength by the back door:** Ardour is 4 units of offence where 4 units of utility were. sceptre-fire takes it at 60
  and 120; its fire attack damage at 120 rose 16.4 → 22.4 (Ardour 3 units, Kindled Steel 4), and that family grows only
  9% past 120 now. Ardour is 9 steps from the Vanguard start (by the Banner; Verger is 11), not under
  G2's 9-step watch line.
- **Verger kept its armour lead.** I considered re-leading its smalls to sceptre damage to mix the west. With Ardour in,
  the west is mixed without it, and a sceptre-led Verger would have made 9 units of sceptre within 12 steps (Verger and
  Gilded Rod), a new hot spot, while taking away the armour round 1 placed there for a flat want. Left as it is.
- **Hymn kept its mana.** The east side already opens on elemental damage.

## 2. The clusters added (3 of the 7 left)

| ledger | notable (id)                              | lines (units)                                                              | smalls                                    | hangs                                                                                                                         | steps from the start | twins (steps)                                                                                               |
| ------ | ----------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------: | ----------------------------------------------------------------------------------------------------------- |
| ZE-2   | **Sexton** (`cathedral.nave.sexton.n`)    | minion damage 24%, life 10% (2 + 2 = 4)                                    | 3 × 12% minion damage (lead: minions)     | a straight bridge south from the aisle's middle node `aisle.a2` to the Vestry junction `rods.jR.a`                            |                   14 | minions: Shepherd 10 (minions that last), Ossuary 10 (minions with ES), Familiars 15 (Spire)                |
| ZE-4   | **Frozen Font** (`cathedral.rods.font.n`) | cold damage 20%, block with a shield +2%, chill effect 10% (2 + 1 + 1 = 4) | 3 × +2% block with a shield (lead: block) | a straight bridge across the Vestry's inside, from the nave junction `nave.jN.a` to the dear road's last node `rods.toWall.c` |                   12 | shield block: Iron Faith 6; cold: Rimed Steel 5 (cold attacks); spell block (another kind): Warding Staff 6 |
| ZE-10  | **Wake** (`cathedral.rim.wake.n`)         | energy shield 10%, life 10% (2 + 2 = 4)                                    | 3 × 5% energy shield (lead: ES)           | a pocket inward off the Churchyard's outer corner `rim.walk.o2`, on the corner's bisector                                     |                   23 | ES: Rood Screen 25, Tomb Dust 25, Vigil 21; ES with life: Warm Blood (Spire) 33                             |

Every small in each cluster carries the same line; every new small belongs to its notable. Names are our own plain
words; `ip.test` passes and each name has no hit in the reference tree (Ardour, Sexton, Frozen Font, Wake, Lychway).

**Leads, argued:**

- **Sexton leads with minion damage, life only on the notable.** Life smalls on the aisle at 14 steps, two nodes from
  Lectern, would be the near-home pile of a main stat the user asked us to stop building. Even so, three non-summoners
  take Sexton at 120 (staff-block, aura-brand, sceptre-fire) for its 2 units of life and because it is the aisle's road to
  the Vestry junction; that is 4 nodes for 2 units of life, a fair price, and the summoner's minion smalls are their tax.
- **Frozen Font leads with block**, as round 1's Warding Staff led with spell block: the shield caster's block stood at
  5 units from 60 to 120 points with nowhere to climb, and cold has one taker in the Zealot. It is the shield's third
  direction (Iron Faith south of the Nave wheel, Glass Wall in the Undercroft), with cold as its partner; going there costs
  the shield caster the north, where its spell damage is (Homily, Lectern).
- **Wake leads with energy shield**, as the brief says (it folds ZE-s2), with life on the notable; no spell damage near it
  (the convergence rule). It sits where the fire caster goes for its burning (Censer, 6 steps), so taking it costs the
  Mystic's east.

**Layout.** Sexton is one straight line from the aisle node to the junction, and it continues the tower wheel's link
through the junction, so `rods.jR.a` is a clean cross. Frozen Font is one straight line from `jN.a` to `toWall.c`; it
leaves `jN.a` between the road east and the empty south (46° from the road east, 134° from the road west), which is
written as the link's reason: a corner instead (straight south, then a turn at the notable) would put the notable a short
step from Verger and bend it by 60°. Wake leaves the outer corner on the bisector of its two road links and points into
the empty ground between Censer and the Searing Avatar spur (about 195 units from the keystone, which keeps its one
link). Smalls are 55 to 70 apart and about 70 from their notables; the rest of each distance is on the links out.

## 3. Deferred border links laid

None. The deferred list ([G2/borders.md](../../G2/borders.md) §4) has two Zealot links: ZE-5 ↔ `wall.resists.j.a` (laid in
round 1) and ZE-8 ↔ Grim Oath (round 3). No deferred link lands on Sexton, Frozen Font or Wake. MY-2 ↔
`cathedral.crypt.toSpire.b` is the Mystic's to write; it has been written in the Mystic's file this round
(`spire.well.livingVerse.c`, seen in the audit). No link across a region line was added, cut or re-aimed by this round.
The far loop's Zealot end changed id with the walk move (`cathedral.crypt.north.n6` → `cathedral.walk.road.n6`); the link
is the same link between the same two nodes, written in the Zealot's file as before.

## 4. Ids

**Changed (14):**

| before                                  | after                                  | why                                                |
| --------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| `cathedral.crypt.north.n1` … `n6`       | `cathedral.walk.road.n1` … `n6`        | the north walk moved to its own area (the Lychway) |
| `cathedral.crypt.rood.a`, `b`, `c`, `n` | `cathedral.walk.rood.a`, `b`, `c`, `n` | Rood Screen moved with the walk it hangs from      |
| `cathedral.nave.lectern.c`              | `cathedral.ambulatory.brand.d`         | Brandwright's small now (brand damage)             |
| `cathedral.nave.lectern.d`              | `cathedral.ambulatory.brand.c`         | Brandwright's small now (brand damage)             |
| `cathedral.home.alms.a`, `alms.n`       | `cathedral.home.ardour.a`, `ardour.n`  | Alms re-lined to Ardour                            |

That is 14 old ids retired by the registry at the next registration and 14 new ones. Positions did not change for any of
them.

**New (12):** `cathedral.nave.sexton.{a,b,n,c}`, `cathedral.rods.font.{a,b,n,c}`, `cathedral.rim.wake.{a,b,c,n}`.

**The Lychway.** The north walk and Rood Screen now live in `walk.ts` (area `cathedral.walk`, "The Lychway", name kept).
I moved them because the walk is a place of its own: three ways in, the far loop's road, and in round 3 two more clusters
(ZE-9, ZE-3); the Undercroft's file is the Undercroft again. The coordinator's later note made the move optional; it was
already done and is kept. Every `why` that said Rood Screen lived in the Undercroft for want of an area was rewritten.

## 5. Changed from the brief, and why

1. **Ardour replaces Alms** (not in the brief): the user's guidance on homes (§4.8) and the coordinator's note on the
   first six steps (§1.3).
2. **Lectern's two far smalls became Brandwright's**, part of the Brandwright re-line the user decided (§1.2).
3. **Frozen Font is block-led**, not cold-led; the brief named the pairing, not the lead (§2).
4. **The walk move** was offered by the instructions and done (§4).

Placements are at the brief's hang points (G2/zealot.md §2): Sexton aisle `a2` ↔ `jR.a`, Frozen Font `jN.a` ↔
`toWall.c`, Wake off `o2`.

## 6. Checks

- **Geometry** (`geometry.ts --region zealot --bends`): **0 crossings, 0 drawn over.** 19 bends over 20°, all
  pre-existing: fifteen wheel corners, Litany's two spokes, `walk.road.n1` (104°, the walk's corner; was `crypt.north.n1`)
  and `rim.walk.o4` (94°, the Churchyard's corner). `rim.walk.o2` left the list (Wake makes it a junction). No new bend:
  every new chain is straight. Not flagged by the tool: Brandwright now has a chain on each side (unchanged positions; the
  Lectern side meets it at about 90°, as in round 1).
- **Audit** (`passives:audit -- zealot`): problems 0. **Notables in units: all 35 between 3.0 and 4.6** (Tithe 3.0,
  Battle Hymn 3.2, Shattering Rite 3.3 the lowest; the new ones and the two re-lines 4.0). Ways in: every area has two or
  more (the Lychway three: Kindled Steel, Tomb Dust, the far loop; the Churchyard two). Sexton and Frozen Font are
  bridges; Wake is a dead-end pocket on a road with two ways in (§3.6, §13.5).
- `buildAll`: 0 problems in the whole tree at the end (none with `cathedral.`). `npx tsc --noEmit -p .` clean.
- **Names:** `npx vitest run src/data/ip.test.ts` passes; Ardour, Sexton, Frozen Font, Wake, Lychway 0 hits in
  `reference/tree/ref-tree.json`.

### Steps from the Zealot start (before → after this round)

Zeal 2, Hymn 4, Alms 5 → **Ardour 5**, Iron Faith 6, Hearthfire 7, Vigil 8, Choirmaster 8, Verger 9, **Frozen Font 12**,
Gilded Rod 12, Quarterstaff 12, Warding Staff 12, Consecrated Plate 13, Homily 14, **Sexton 14**, Lectern 15,
Censer 17, Brandwright 18, **Wake 23**, Rood Screen 26. Nothing that was there moved nearer or farther. From the Mystic
start: Sexton 20, Frozen Font 19, Wake 31. From the Vanguard start: Ardour 9, Verger 11, Frozen Font 15.

### The allocator (indicative: the other regions were mid-edit in the same tree)

Units at 120 → 160 points; before is this round's start (round 1 committed plus the others' work so far), after is the end.

| archetype    | main stat          | before 120 → 160 | after 120 → 160 | note                                                                                          |
| ------------ | ------------------ | ---------------- | --------------- | --------------------------------------------------------------------------------------------- |
| fire-burn    | spell damage       | 27 → 32.5        | 29 → 31         | Lectern and Brandwright left its plan; the rest is the Mystic's (Living Verse is new there)   |
|              | fire damage        | 25.9 → 25.9      | 22.5 → 22.5     | flat both times (its fire is all taken by 120)                                                |
|              | life               | 25.8 → 41.8      | 30.4 → 42.8     |                                                                                               |
| staff-block  | spell damage       | 33.5 → 41.8      | 33.1 → 38.6     |                                                                                               |
|              | block              | 6.5 → 8.5        | 8.5 → 8.5       | flat: Warding Staff and Quarterstaff taken by 60; Wake (3.4) is in its 120 gave-up list       |
| aura-brand   | auras              | 18 → 22          | 22 → 22         | Benediction now taken at 120                                                                  |
|              | brand damage       | 22.2 → 27.4      | 27 → 33.3       | Brandwright (6 units with its four smalls) and Lectern taken at 120; still climbing           |
| block-caster | block              | 5 → 13           | 10.5 → 10.5     | Frozen Font taken at 120 (block 5 → 10.5); flat past it, and **one plan at 120** (question 3) |
|              | spell block        | 8 → 8            | 7 → 8           |                                                                                               |
|              | spell damage       | 27.8 → 29.8      | 26.3 → 35.8     | now climbing (it left Lectern for the Mystic's)                                               |
|              | energy shield      | 33.6 → 35.2      | 33.6 → 44.8     | climbing                                                                                      |
| storm-caster | spell damage       | 36.2 → 41.7      | 27.2 → 34.7     | Lectern and Brandwright left; down 9 units at 120                                             |
|              | lightning          | 13.8 → 16.5      | 15.5 → 15.5     |                                                                                               |
| sceptre-fire | fire attack damage | 16.4 → 21.4      | 22.4 → 24.4     | Ardour (3) taken at 60 and 120: the back door, said in §1.3                                   |
|              | sceptre damage     | 16.9 → 19.7      | 16.9 → 19.7     | unchanged                                                                                     |
|              | armour             | 39.2 → 44.8      | 30.8 → 33.8     | the Vanguard's armour moved in the same tree (Verger and Consecrated Plate still taken)       |
|              | life               | 23.4 → 34.2      | 18 → 35.6       | takes Sexton for its life at 120                                                              |

Against the targets, for these six: typical main-stat gain at 120 **22% → 17%** (target 30%+); main stats gaining 10% or
less **24% → 38%**; notables worth 2.5+ in the 120 gave-up list typically **3 → 3**, builds with none **0 → 0**; builds
with one plan at 120 **0 → 1** (block-caster), with three or more **6 → 5**; typical tax at 120 **34% → 35%**;
sceptre-fire's single 60-point plan became three.

What moved, read honestly: the casters' spell damage at 120 went down (storm −9, the others about level) because Lectern
stopped being a caster stop, which is what the user's Brandwright decision and the hot-spot fix asked for; it is still
climbing past 120 for all of them. The flat stats at 120 are mostly a build that has taken everything of one stat near
it: fire-burn's fire (flat before too), staff-block's block (Warding Staff and Quarterstaff), block-caster's block (Iron
Faith, Frozen Font, Quarterstaff), storm's lightning. None of my remaining round-3 clusters adds block or lightning; see
question 3. These numbers move with every other region's edits, so they are a direction, not a verdict.

## 7. Walks (by hand on the map, cheapest paths)

**W1, the Zealot's main build: the shield caster, 20 points.** Point 1 armour, the west hub and road (4), the wheel's
block side and Iron Faith (6); on through the wheel's north smalls to the nave junction (9), then Frozen Font's two block
smalls and the notable (12) and its far small (13). That is 9 units of block with a shield at 13 points, in one direction.
Then Hearthfire back across the wheel (15) and Litany (17), or Zeal (point 2 instead of the hub road) and the Choir. It
chose block and the cold notable; **it gave up the north**: Homily is 14 and Lectern 15 the other way, so at 20 points it
has no spell damage cluster yet. Stretch with no choice: none (the wheel, the junction and the Vestry each fork). Notable
nobody here takes: Ardour (an attacker's), Verger (armour).

**W2, an off-build: the elemental striker (a sceptre or a staff swung), 20 points.** Point 1 armour, the west hub, the
road, Ardour's small and Ardour (5): elemental attack damage, attack speed and accuracy, four points before any skill
gem is likely, and no weapon named. Then the road on, the wheel's block side (7) and Hearthfire's fire through the
wheel (9) or Verger by the crossing node (11). Then Gilded Rod (sceptre, 14) or Quarterstaff (staff, 14) on the Vestry
wheel, one side each, and Rimed Steel's cold strikes past the junction (17 to 18). It chose attack offence at home and a
weapon at 14; it gave up Zeal's elements and Iron Faith's block. Before this round its first five points were armour,
attributes and flasks.

**W3, a neighbour coming in: the Mystic's summoner, 20 points from the Choir side.** From the Mystic start the Zealot's
minions are Shepherd at 14 (the Choir wheel's south), then down the road under Choirmaster to the aisle and Sexton at 20.
Sexton gives it minion damage and its own life, two nodes past Lone Vow's spur, which it may take for its single aura.
It chose minion supply in the Zealot instead of the Spire's Familiars (18, by the Undercroft); it gives up Familiars'
spells and the Undercroft's ES. Ossuary (24, far west) is the summoner's late destination.

**W120, the fire caster on life and energy shield, 120 points (fire-burn's own direction, by hand; running point
counts, good to a point or two).** Zeal 2, Hearthfire 7, Vigil 9, Litany 11, Choirmaster 13; west by the Vestry: the wheel's elemental ends, the junction, the back road to the
tower (18 to 22), Tithe or the tower junction, the Rampart road to Censer (burning, 26); the Churchyard to Wake (energy
shield and life, 31); Searing Avatar from the tower junction (36, the keystone that makes everything fire). That is the
west plan: burning, Wake's two pools, the keystone, with about 85 points left for the Undercroft's Homily and Glass Wall
(by the Choir, about 14 more), Cinder across the Mystic border by the far loop or the Spire road, and the Mystic's
spell damage. What it gave up: the Mystic's east spell damage in depth (Keen Verse, Arcane Focus, Piercing Word: the
allocator's plan takes those instead of the west), Lectern, Thunder Peal. The allocator's best plan for it goes east,
not west, and Wake is not in its gave-up list; staff-block lists Wake (3.4) among what 40 more points would add, so the
corner is a want for the defensive caster first. Real choices: the west (burning, Wake, the keystone) against the east
(spell damage) came at about 20 points. Stretch with no choice: the Churchyard's first leg (Censer to `o1` to `o2`, two
road nodes) before Wake. Notables nobody here takes: Sexton, Frozen Font, Ardour (other builds').

## 8. Round 3 (the rest of the plan)

- **ZE-9** (spell damage with duration) off the Lychway's `road.n4`: the casters' far spell cluster; with this round's
  Lectern change it is the Zealot's one new spell supply, so it should be placed to cost the casters their east.
- **ZE-3** (channelling with the elements) bridging Shattering Rite to `road.n6`.
- **ZE-6** (sceptre with burning) off the Churchyard's `o4`, between Thunder Peal and Searing Avatar.
- **ZE-8** (life with aura effect) bridging Censer to the Vanguard's Grim Oath, laying the deferred border link
  ZE-8 ↔ `wall.maces.oath.n`.
- Watch: block for the shield caster (flat at 10.5 after Frozen Font), the casters' spell damage at home (low now,
  §1.2), Sexton taken as a life stop by non-summoners, and the home's flasks (question 2).

## 9. Open questions

1. **The Zealot casters' spell damage at home.** With Lectern down to 4 units and Brandwright brand-only, no Zealot caster
   takes Lectern; their spell damage is the Mystic's and the Undercroft's. Is that the intended outcome of the hot-spot
   fix, or should Lectern carry a little more (it is 4 units for 3 nodes off the aisle) so the aisle stays a caster's
   choice? I would leave it until ZE-9 lands in round 3.
2. **The home's flasks.** Ardour took Alms' place, so the Zealot sells no flask line of its own; the centre's
   Provisions is six steps from the start on the Zealot's side of the ring. I re-lined an existing pocket rather than
   adding a new offence notable (the coordinator's third option) because the home is already dense within six steps
   and Alms was the one notable there that served no build's main want. Keep it so, or put a flask line back on a later
   Zealot cluster (ZE-8's life and auras is a candidate: a support build's flask)?
3. **The shield caster's block.** After Frozen Font, block-caster's block is 10.5 units at 120 and flat to 160, and its
   120-point plan has one best plan. The rest of the block supply is in the Wall and the Muster. Should round 3 or the
   Vanguard's farther clusters give block another direction, or is a shield caster who has found its block near home
   fine as long as spell block and energy shield still climb?

Nothing here felt like it was losing intent. Every change has a player's reason: Brandwright and Lectern by the user's
decision and the stat whose a small is; Ardour by the user's guidance on homes; each new cluster at its brief's hang
point, led by the flat want, with no near-home pile of a main stat.

## 10. CONSTRAINTS checklist

- **§1 What the tree is for.** Each new cluster is a want in a direction that costs another (block south-west against
  the casters' spell damage north; ES and life far west against the Mystic's east; minions with life on the aisle against
  Lectern). The Brandwright and Lectern changes remove a one-stop the casters walked through. Weighed against the rest:
  the start got an offence choice, not more power in one stat; the allocator's movement is reported with its causes.
- **§2 The reference.** Nothing copied; names plain and absent from the reference tree; the reference game not named.
- **§3 A network.** Two new bridges (Sexton joins the aisle to the Vestry junction; Frozen Font joins the nave junction
  to the dear road), one dead-end pocket on a road with two ways in (Wake). No border link added, cut or re-aimed; none
  deferred landed on this round's clusters.
- **§4 Regions and areas.** No build-named area. §4.8: the home's west was one kind and is now mixed (Ardour); the
  defences stay varied (block Frozen Font, ES and life Wake, life on Sexton). §4.6: the flask line left the region
  (question 2).
- **§5 Specializations.** Twins measured: Sexton 10 from Shepherd and Ossuary; Frozen Font 6 from Iron Faith and 5 from
  Rimed Steel; Wake 21 or more from every ES twin; Ardour 9 from Hallowed Hammer, 12 from Rimed Steel; Brandwright 7 from
  Runecarver. Each with a different partner.
- **§6 Starts.** The first points now offer offence on both sides (Ardour west at 5, the elements east); nothing within
  three steps names a weapon; nothing new within 8 steps except the re-lined pocket.
- **§7 Roads and attributes.** No road node added or changed.
- **§8 Clusters and smalls.** Every new notable 4.0 units; every section uniform (Brandwright's two sides both brand
  damage); every new small belongs to a notable.
- **§9 Keystones.** All six keep one link; Wake keeps clear of Searing Avatar's spur.
- **§10 Vocabulary.** Only lines from `lines.ts`, unedited; new in the region: brand crit (`critChance` tagged brand),
  elemental attacks (`eleAttack`), accuracy; minion damage with life, cold with a shield, ES with life as pairings. The
  `critChance` label not printing its tags is reported, not fixed (lines.ts is out of scope).
- **§11 Looks.** 0 crossings, 0 drawn over, no new bend; straight chains; clean cross at the Vestry junction; the one
  uneven fan (`jN.a`) has its reason written. Labels not checked or moved, per the user's note of 2026-10-22.
- **§12 Size.** +12 nodes, an outcome. No bot simulation; the allocator is a static tool.
- **§13 Tensions.** Connections against trade-offs: two new bridges make the Vestry reachable from the aisle and the nave
  junction; Sexton is used as a road by non-summoners (reported). Strength by the back door: Ardour's offence near home
  (reported, §1.3).
- **§14 Rejected ideas.** No generation (positions computed by hand on straight lines between hang points, then looked
  at); no build list as the basis; no step-count reach; no spacing rule; no filler.
- **§15 How the work is done.** CONSTRAINTS and every brief read first; before and after pictures; checks after each
  batch; walks by hand; only this region's folder edited; no register, bake, commit or stash.
