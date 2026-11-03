# The centre's rebuild (no class start)

The ground inside the six starts (inside radius about 1,200), redrawn last on the approved skeleton (R-skeleton.md §1,
§8), between the six moved starts. Positions are (radius, absolute degrees); the starts sit at radius 1,450 at the class
angles (Mystic -90, Shade -30, Strider 30, Reaver 90, Vanguard 150, Zealot 210), the borders at -60, 0, 60, 120, 180 and
240, and each pair of neighbours shares a seam at (1,600, border angle), which both regions now link to.

## 1. Evaluation (the centre as it stands)

Measured on today's tree (`walks.ts`).

- **Two areas:** the old ring road (24 attribute nodes at radius 750, built when the starts sat at 1,000) and eight generic
  notables hung off its inner side as small arches: Shelter (resistances, life), Firm Footing (stun), Waste Not (mana
  cost, mana on kill), Quick March (movement, cooldown), Hard Living (life on hit and kill), Well Rounded (attributes,
  life), Sound Body (chaos resistance, ailments), Provisions (flasks, mana regeneration).
- **The seams link into the ring at seven ring nodes** (r3, r5, r9, r13, r17, r21, r23), left by each region's pass as the
  nearest node. The ring's own crossing between neighbours (four steps junction to junction) is now redundant: every pair
  of neighbours shares a seam at 1,600.
- **Steps from the starts are lopsided:** each centre notable sits 7 steps from one or two starts and 13 to 18 from the
  others. Shelter, Firm Footing and Waste Not are 7 from the Mystic; Well Rounded and Sound Body 7 from the Reaver; Hard
  Living and Quick March 7 from the Strider; Provisions 7 from the Vanguard. The Shade and the Zealot reach none within 9.
- **Content:** generic sustain and utility only, priced 3 to 4 units, no keystones (C-brief, the owner's decision 7 of
  2026-10-19: the centre holds generic nodes for things everyone or many classes may want).

## 2. What the centre is for

The reference's middle without its class: generic ground between all six starts, **about as far from every start**, so no
class gets the generic layer cheaper than another. It is the second layer of the near crossings: a character that
walks in from its seam finds one generic notable for its pair of neighbours, and the two shared by all at the middle.
Generic stats only (resistances, stun, movement, attributes, flasks, chaos resistance and ailments, mana cost, life on
hit and kill). Nothing a region sells as its identity.

## 3. The frame

- **Six inner roads**, one along each border: from the seam (1,600) inward through one attribute node (about 1,250) to a
  junction at radius 950. They continue the border radials the regions built outward from the seams.
- **An inner ring** joins the six junctions (a hexagon, each side about 950 long, one attribute node between junctions:
  "roads may take large jumps"; these are thin).
- **Three inner spokes** run from alternate junctions (borders 0, 120 and 240) to the middle (one attribute node each),
  so the middle is reached from every start through the junction on one of its borders.
- **The old ring road is removed** (24 nodes) with the arches' smalls that landed on it. The seams' links into it are
  retargeted to the new inner roads' first node.
- Attribute nodes take the attributes of the two regions either side (the border's pair): the union of both classes'
  attributes, two at most, +6 each (+7 when only one). A hexagon side node carries the attributes of the class whose
  start it sits under.

## 4. Steps (the target)

Start to seam is 5 (each region's path runs through a cluster), seam to junction 2, junction to its side room 1 or 2:
**each junction's notable about 8 to 9 steps from its two neighbouring starts**; the middle about 11 from every start.
The far junctions are 13 or more, which is right: they are the other pairs' ground.

## 5. Where the eight go

Each junction's notable suits the pair of classes either side and is not what either home sells at that seam (checked in
the structure pass against real positions).

| Notable                                 | Place                                         | Why there                                                     |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Firm Footing (stun)                     | the Mystic and Shade junction (border -60)    | The two casters least able to take a stun.                    |
| Shelter (resistances, life)             | the Shade and Strider junction (border 0)     | The evasive pair, light on resistances.                       |
| Sound Body (chaos resistance, ailments) | the Strider and Reaver junction (border 60)   | The pair that meets poison and bleed most.                    |
| Quick March (movement, cooldown)        | the Reaver and Vanguard junction (border 120) | The melee pair, slow on their feet.                           |
| Waste Not (mana cost, mana on kill)     | the Vanguard and Zealot junction (border 180) | The strength pair, short of mana.                             |
| Hard Living (life on hit and kill)      | the Zealot and Mystic junction (border 240)   | The caster pair, short of life recovery.                      |
| Well Rounded (attributes, life)         | the middle                                    | Attributes every build needs for its gear: equal for all.     |
| Provisions (flasks, mana regeneration)  | the middle                                    | Flasks, the attrition lever (CONSTRAINTS §16): equal for all. |

## 6. Size

Eight notables (the skeleton keeps today's eight). The centre gains room; whether it should hold more is the owner's
open question (R-skeleton.md §9) and is not decided here.

## 7. Open

- More than eight notables (the owner).
- The flask layer: Provisions is the only flask notable in the centre; the flask stats pass (CONSTRAINTS §16 item 2) may
  want more here, equally far from every start.

## 8. Revision 1 and the structure (after the reviewer's round 1)

Built by `scripts/passives/rework/centre-gen.ts` into `src/data/passives/centre/ring.ts` and `clusters.ts`; the whole
tree's render is `R-centre-structure.png`. Corrections to §1 and §4: six seams link into the centre, not seven (the
Cathedral built none); with one node on each hexagon side the next junction is 2 steps on.

- **Must 1, start to seam evened out (in the regions):** the six bare paths now run through a home cluster (CONSTRAINTS
  §16.9), each made a two-node run-through by its toward-the-centre side room: the Spire's Draught (west path, to the
  Cathedral seam) and Hale Scribe (east path, to the Knife's seam), the Bow's Clear Head (north) and Quick Sip (south),
  the Yard's Guarded (west), the Wall's Camp Stores (north). One small each was trimmed (two for Guarded). Every start is
  now 6 or 7 steps from both its seams (7 where the other region's run-through has three nodes: the Knife's two, Bright
  Omen, Ringing Blows). The regions were regenerated from their tables; the only other change is that the generator now
  writes the why of the new clusters it had dropped.
- **Must 2, placements against the real neighbours** (the notables within four steps of each seam):

| Junction                 | Notable                                 | What the homes sell by that seam                                                    |
| ------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------- |
| -60, Mystic and Shade    | Firm Footing (stun)                     | Hale Scribe, Spoils, Hoarded Breath, Low Tide: life, mana, energy shield            |
| 0, Shade and Strider     | Hard Living (life on hit and kill)      | Clear Head, Soft Step, Grey Cloak, Ward of Smoke: mana, evasion, resistances        |
| 60, Strider and Reaver   | Waste Not (mana cost, mana on kill)     | Quick Sip, Killing Pace, Wanderer, Thirsty Quiver: flasks, speed, attributes, leech |
| 120, Reaver and Vanguard | Sound Body (chaos resistance, ailments) | Ringing Blows, Guarded, Vampiric Strikes: melee damage, armour, evasion, leech      |
| 180, Vanguard and Zealot | Quick March (movement, cooldown)        | Camp Stores, Vigil, Alms, Iron Lungs: flasks, regeneration, leech, mana             |
| 240, Zealot and Mystic   | Shelter (resistances, life)             | Draught, Bright Omen, Kept Vows, Quickening: flasks, damage, auras, recharge        |

Sound Body's false reason is gone. **For the joins pass:** Well Rounded (the middle) against the Bow's Wanderer (+10
all attributes, 8% life, two steps from the 60 seam).

- **Must 3, the inner roads from real positions:** the first node of five inner roads bends 3 to 6 degrees off the
  border, away from Ward of Smoke and Grey Cloak, the breath smalls, Wanderer and Kept Vows' smalls. Every centre link
  keeps 90 units or more from every other node (a scratch check); crossings 0, drawn over 0; no unreachable node.
- **The frame as built:** inner road node at 1,250 and junction at 950 on each border; a hexagon side node under each
  class's start carrying that class's attributes; spokes at 0, 120 and 240 to the middle (+5 all attributes); each
  junction's notable a side room toward the middle (junction, small, notable); the middle's two the same off the middle
  node. The old ring road and its arch smalls are gone (their ids stay retired).
- **Must 5, the acceptance table** (steps from each start, `walks.ts`):

| Class    | Its two junctions | The two next | The two far | The middle's two |
| -------- | ----------------- | ------------ | ----------- | ---------------- |
| Mystic   | 10, 10            | 12, 12       | 14, 14      | 12, 12           |
| Shade    | 11, 11            | 13, 13       | 15, 15      | 13, 13           |
| Strider  | 10, 10            | 12, 12       | 14, 14      | 12, 12           |
| Reaver   | 10, 10            | 12, 12       | 14, 14      | 12, 12           |
| Vanguard | 10, 11            | 12, 13       | 14, 15      | 13, 13           |
| Zealot   | 10, 11            | 12, 13       | 13, 15      | 13, 13           |

Every class within one step of every other, notable by notable (the Shade one step further throughout: the Knife's two
run-throughs have three nodes).
