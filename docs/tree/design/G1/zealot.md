# G1b. The Zealot (the Cathedral): growth brief

Written 2026-10-22 for phase G1b of [G-growth.md](../G-growth.md), from [CONSTRAINTS.md](../CONSTRAINTS.md) (which wins),
the ledger [G1-ledger.md](../G1-ledger.md) (its §0, the user's answers, wins over the rest of it), the baseline
([G0-baseline.md](../G0-baseline.md), [G0/builds.txt](../G0/builds.txt)) and the area files in
`src/data/passives/cathedral/`. Nothing in the network changed. Pictures are in [zealot/](zealot/):

- `today.png`: the region as it is.
- `sketch.png`: the whole region after this brief. Orange rings are new clusters (ZE-n), blue lines new roads, green
  lines new links and crossings, the red cross a cut, yellow dots moved nodes.
- `sketch-inner.png`: close-up of the inside (the aisle, the Vestry patch).
- `sketch-rim.png`: close-up of the outer walk and the north walk.
- `sketch.json`: the sketch's data (`npm run passives:sketch -- docs/tree/design/G1/zealot/sketch.json out.png`).

Steps below are nodes bought from a start (the start is 0, Zeal is 2). "After" steps were counted on the sketched graph
by a scratch script (each new cluster's smalls as a chain, each road's nodes as drawn); they are estimates, good to a
step or two.

## 0. What the map says first

Three facts drive everything below.

1. **The Zealot's own middle is empty, so its casters live in the Mystic.** From the Zealot start, the region's notables
   come at 2 to 9 steps (Zeal, Hymn, Alms, Iron Faith, Hearthfire, Vigil, Choirmaster, Shepherd, Litany), then nothing
   until 12 to 15 (Gilded Rod and Quarterstaff 12, Homily and Glass Wall 14, Benediction 15), and the Ambulatory's
   notables at 17 to 24. The Mystic's Glass Skin and Quiet Pulse are 11 steps from the Zealot start, Warm Blood and
   Sharp Mind 12. So every Zealot caster in the allocator (fire-burn, staff-block, storm, block-caster, aura-brand)
   walks east by 60 to 100 points and takes Glass Skin, Quiet Pulse, Warm Blood, Warded Mind and Arcane Focus. The
   Zealot's casters are Mystic casters that start further away.
2. **The Zealot's strength builds live in the Vanguard.** The sceptre fire build's 60-point plan is Zeal, Iron Faith,
   Hearthfire, Gilded Rod, then the Rampart (Mortar and Stone, Thick Skin, Stone Heart, Second Wind, Broad Back, Steady
   Hands, Weight of Iron), and at 120 the Reaver's Muster. The Zealot sells 6.7 units of armour in all.
3. **The Nave wheel is not a choice.** Every Zealot plan takes both Iron Faith and Hearthfire by 80 to 100 points,
   because Iron Faith's energy shield and armour are generic defences every build wants (CONSTRAINTS §8.3: sides that
   every build of the theme takes anyway are fake).

And one layout fact: the Ambulatory is a single road (the walk) with nine pockets, seven of them dead ends (Crozier,
Ossuary, Kindled Steel, Brandwright, Thunder Peal, Censer, Battle Hymn; §3.6 says most pockets are bridges). The empty
space is the inside (between the Choir, the Nave and the Ambulatory, 55 cells; the Vestry's inside toward the Wall, 35
cells) and the rim band outside the walk and north of the Undercroft (307 cells, 113 of them far from any node).

## 1. The wants that need competition

The archetypes that start in the Zealot (current numbers from `builds.txt`, units at 120 → 160 points):

| archetype    | flat today                                  | what splits it after this brief                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fire-burn    | spell damage 15.8 → 15.8                    | Spell damage at home in three directions: ZE-1 on the aisle (north-west, 15 steps), Homily (north-east, 14), ZE-9 (the north walk, about 24), against the Mystic's (east, 11 to 16). Its ES and life (ZE-10) sit west, by Censer, where its burning is. |
| staff-block  | block 3.5 → 3.5; spell damage 22.8 → 25.4   | Spell block for a staff: ZE-7 (south-west, 12) and ZE-11 (the north walk, far). The staff's three clusters (Quarterstaff, ZE-7, Crozier) each with a different partner, 8 to 12 apart.                                                                  |
| aura-brand   | auras 18.7 → 18.7                           | ZE-1 (spell with less reservation, beside Lone Vow, which now hangs off the same road) and ZE-8 (life with aura effect, the far south-west, by Battle Hymn), against Choirmaster (north-east) and Benediction (west).                                   |
| block-caster | spell block 6 → 6; spell damage 13.5 → 14.8 | Shields in three directions: Iron Faith (re-lined to a pure shield notable, 6), ZE-4 (cold with a shield, south-west, 12), Glass Wall (north-east, 14). Spell damage north (ZE-1, Homily).                                                              |
| storm-caster | spell damage 17.8 → 19.1                    | As fire-burn: ZE-1, Homily, ZE-9, Shattering Rite, Thunder Peal; lightning stays spread (Thunder Peal west, the Mystic north-east).                                                                                                                     |
| sceptre-fire | armour 25.8 → 25.8 (all from the Vanguard)  | Armour at home: ZE-5 (armour with sceptre, 9 steps, on the Wall border), Consecrated Plate (13 by the aisle, was 18). The sceptre in three places: ZE-5 south-west, Gilded Rod centre, ZE-6 west by Searing Avatar.                                     |

Passing through: the classic caster and the summoner from the Mystic (they take Homily, Glass Wall, Tomb Dust,
Hearthfire, Litany, Shepherd, Choirmaster, Ossuary today; §6), and the Vanguard's two-handed fire and mace builds that
come north for Kindled Steel, Searing Avatar and Hallowed Hammer.

**The ledger, row by row.** I agree with the partners of all eleven rows and with ZE-p1. I disagree with five
placements and two leads, and I fold the five sections as the user asked:

| row   | ledger                                             | this brief                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ZE-1  | spell + less reservation, Choir–Undercroft inside  | **Agree**, on the new aisle at its north-west end, bridging to Brandwright. Lone Vow is re-hung off the aisle (§4), so ZE-1 and the keystone are a real fork from one road: take the reservation or take the keystone that makes it moot. Folds ZE-s3 (its smalls are spell damage). Homily 13 steps away, Choirmaster 7.                                                                                                                                                                                                              |
| ZE-2  | minion + life, by Volatile Servants                | **Moved** to the aisle's south side, bridging to the Vestry junction (14 steps). Why: the summoner's supply then lies in three directions (Shepherd north-east 8, ZE-2 north-west 14, Ossuary west, about 18 once the aisle is in) instead of two in the north; and the aisle carries a summoner's notable and a caster's notable, so each pays for the other's in passing (§5.5). The Volatile Servants pull is lost; the keystone stays a dead end where it is.                                                                      |
| ZE-3  | channelling + elemental, Undercroft north rim      | **Agree**, at the east end of the new north walk, on the Mystic border, as the landing of two crossings (§3). Steady Stream 13 steps away.                                                                                                                                                                                                                                                                                                                                                                                             |
| ZE-4  | cold + shield block, Nave–Vestry                   | **Agree on the area, not beside Iron Faith**: a bridge from the Nave junction to the Vestry's Wall road, 12 steps, 6 from Iron Faith and 6 from Rimed Steel. The shield's three clusters face three ways.                                                                                                                                                                                                                                                                                                                              |
| ZE-5  | sceptre + armour, Narthex–Nave edge                | **Agree on the place (the Wall border), lead flipped to armour**: three armour smalls and a notable with sceptre damage and armour. It folds ZE-s1 (armour), and the armoured builds of both classes walk past it. A bridge between the Nave's crossing node and the Vestry's crossing node, so it sits between two existing crossings to the Vanguard. 9 steps from the start, 10 from Gilded Rod.                                                                                                                                    |
| ZE-6  | sceptre + burning, beside Searing Avatar           | **Agree**, on the new outer walk just north of the Searing Avatar spur, about 23 steps. Censer 8, Kindled Steel 16, Gilded Rod 15.                                                                                                                                                                                                                                                                                                                                                                                                     |
| ZE-7  | staff + spell block, the Vestry's west             | **Agree**, by Idle Hands, a pocket between the Vestry's two Wall-road nodes, with a crossing to the Rampart (V2). 12 steps; Quarterstaff 8, Crozier 12.                                                                                                                                                                                                                                                                                                                                                                                |
| ZE-8  | aura + life, near Living Ward                      | **Moved** to the far south-west, at the outer walk's end beside Battle Hymn, with a crossing to Grim Oath (V3); lead flipped to life (three life smalls, notable life with aura effect), which folds ZE-s4. Why: the ledger's spot is 3 steps from Choirmaster, against its own twin rule (≥ 5), and the Living Ward corner has no room beside the Mystic's Mind Bulwark. The south-west becomes the support corner: auras on life, Battle Hymn's warcries, the Vanguard's curses. It is the row I am least sure of (open question 2). |
| ZE-9  | spell + duration, Ambulatory north rim             | **Agree**, on the north walk's middle, about 24 steps; Homily 15, the shrine 13.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ZE-10 | ES + life, Undercroft–Nave inside                  | **Moved** to the outer walk south of Searing Avatar, about 22 steps, ES-led (three ES smalls), which folds ZE-s2. Why: the inside's two patches are taken by clusters that need to be near (ZE-1, ZE-2, ZE-4, ZE-5, ZE-7), and an ES cluster on the aisle would sit three steps from ZE-1's spell damage, the convergence the ledger forbids. In the west it is the fire caster's defence where the fire caster goes (Censer, Searing Avatar).                                                                                         |
| ZE-11 | ES + spell block (no shield), Undercroft north rim | **Agree**, at the north walk's west end, about 24 steps; Glass Wall 12, Ossuary 14, ZE-7 far.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ZE-p1 | Shattering Rite to at least 3 units                | **Agree.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**The small sections (§3.2), folded:** ZE-s1 armour into ZE-5; ZE-s2 energy shield into ZE-10; ZE-s3 spell damage into
ZE-1; ZE-s4 life into ZE-8. **ZE-s5 (mana, the Choir to the Lantern) is not built**: the Choir is 20 steps from the
Lantern side, so a mana bridge there would be a road of nothing for nearly every build; the Zealot already sells mana at
Hymn, Choirmaster and the Choir's smalls; the casters' mana on the Zealot–Mystic diagonal is CE-4's job (the centre).
No notable-less section remains.

## 2. Where each goes (tree units; y grows downward, so the north is negative y)

| id    | notable at     | hangs from                                                                                  | steps from the Zealot start |
| ----- | -------------- | ------------------------------------------------------------------------------------------- | --------------------------: |
| ZE-5  | (-2240, -600)  | bridge: `nave.toWall.a` (-1891,-551) to `rods.toWall.a` (-2580,-413), along the Wall border |                           9 |
| ZE-4  | (-2540, -870)  | bridge: `nave.jN.a` (-2101,-1040) to `rods.toWall.c` (-2999,-785), across the Vestry patch  |                          12 |
| ZE-7  | (-2770, -250)  | pocket between `rods.toWall.a` and `rods.toWall.b`, by Idle Hands                           |                          12 |
| ZE-2  | (-2450, -1520) | bridge: aisle node A2 to `rods.jR.a` (-2664,-1365)                                          |                          14 |
| ZE-1  | (-2290, -2090) | bridge: aisle node A3 to Brandwright (-2476,-2192)                                          |                          15 |
| ZE-8  | (-4230, -330)  | bridge: Censer (-3738,-618) to the Vanguard's Grim Oath (-3960,80)                          |                          20 |
| ZE-10 | (-3990, -1000) | outer walk node (-4230,-1060)                                                               |                        ≈ 22 |
| ZE-6  | (-4040, -1570) | outer walk node (-4230,-1660)                                                               |                        ≈ 23 |
| ZE-3  | (-1560, -4090) | north walk's east end (-1800,-4050); crossings M1, M2                                       |                        ≈ 21 |
| ZE-9  | (-2330, -3520) | north walk node (-2560,-3760)                                                               |                        ≈ 24 |
| ZE-11 | (-2860, -3240) | north walk node (-2950,-3520)                                                               |                        ≈ 24 |

Inside first: five of the eleven fill the two inside patches (9 to 15 steps, the band that is empty today). The other
six go to the rim, because the inside has no more room without crowding (§11.3: compact, do not cram), and each rim
cluster sits where a build already goes (Searing Avatar, Censer, Kindled Steel, Tomb Dust) or where a crossing lands.
Nothing goes beyond today's circle (largest radius 4,725); the north walk runs at a radius of about 4,450 to 4,610.

## 3. The skeleton changes

**New roads** (strength-and-intelligence attribute nodes, +6/+6, CONSTRAINTS §7.4; names wait for G3):

1. **The aisle**, 3 nodes: from `nave.toChoir.a` (-1797,-1378) through (-2030,-1540), (-2270,-1670), (-2510,-1800) to
   Consecrated Plate (-2778,-1927). It joins the Nave to the Ambulatory's middle through the empty inside. Off it: ZE-2
   (south), Lone Vow's spur and ZE-1 (north). Consecrated Plate goes from 18 steps to 13; Brandwright from 23 to 18.
   Every node of it has something coming off it (§7.3).
2. **The outer walk**, 4 nodes: from Censer (-3738,-618) out round the Searing Avatar spur, (-4020,-790),
   (-4230,-1060), (-4300,-1360), (-4230,-1660), to Thunder Peal (-3821,-1713). Off it: ZE-10, ZE-6; ZE-8 off Censer.
   Censer and Thunder Peal become bridges, and the Bell Tower gets a loop round its back.
3. **The north walk**, 5 nodes: from Kindled Steel (-3303,-2739) up round the Undercroft, (-3300,-3200),
   (-2950,-3520), (-2560,-3760), (-2150,-3930), (-1800,-4050), with Tomb Dust (-1736,-3464) linked to its east end.
   Off it: ZE-11, ZE-9, ZE-3. Kindled Steel and Tomb Dust become bridges. Its ways in: Kindled Steel (the walk), Tomb
   Dust (the Undercroft's Spire road), and the two Mystic crossings (§3.5: never one way in). Kindled Steel goes from
   24 steps to about 20.

**Links to cut:** one. `choir.jC.a`–`choir.loneVow.a`: Lone Vow's spur is re-hung off the aisle's middle node (§4). The
spur stays a dead end; the choir junction keeps three links (the wheel, Living Ward, the Undercroft wheel). Nothing is
left with one way in.

**Crossings** (each lands on a node of the neighbour; the joining agent reconciles). Today the Zealot–Mystic border has
4 links (Hymn to the Spire's Cathedral road, the Choir to Draught, the Undercroft wheel to the Spire's Crypt road, the
Spire road to Familiars) and the Zealot–Vanguard border 5 (the west hub to Warlord's Banner, the Nave's crossing node to
the Wall's resist junction, the Vestry's Wall road to Scar Tissue, the Rampart road to Stagger, Battle Hymn to the
Wall's Hymn road), plus the ring.

| id   | Zealot side        | lands on (neighbour)                                                            | kind | the combination it serves                                                                                                                                                                        |
| ---- | ------------------ | ------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1   | ZE-3 (-1560,-4090) | the Lantern: Cinder's far small `spire.fire.cinder.b` (-1178,-3898)             | dear | Channelling from both sides (ZE-3, Steady Stream); the elemental wand (MY-5) and the Zealot's elemental strikes (Kindled Steel) along the north walk; burning (Cinder, ZE-6 by way of the walk). |
| M2   | ZE-3               | the west end of the Mystic's new north rim road (about (-1250,-4420); MY brief) | dear | The casters' far loop of the ledger: MY-3 and MY-4 (spell with mana, ES with resistances) to ZE-9 and ZE-11 (spell with duration, ES with spell block).                                          |
| V1   | Alms (-1690,-352)  | VA-1 (armour with resistances; the Vanguard brief places it, about (-1600,0))   | near | The armoured hybrid: VA-1 for the Zealot's armour builds, three steps past its first flask notable; ZE-5 and Alms for the Vanguard.                                                              |
| V2   | ZE-7 (-2770,-250)  | the Rampart's junction `wall.rampart.j1.a` (-2509,279), or VA-2 if nearer       | near | The war staff and the shield wall: staff with spell block on one side, armour with block (VA-2) and Stone Heart on the other.                                                                    |
| V3   | ZE-8 (-4230,-330)  | Grim Oath `wall.maces.oath.n` (-3960,80), which becomes a bridge                | near | The support build: auras on life and Battle Hymn's warcries on this side, curses with armour on that one.                                                                                        |
| ring | (centre brief)     | CE-4 on the north-west diagonal                                                 | ring | The casters' mana (it also takes ZE-s5's place).                                                                                                                                                 |

That takes the Zealot–Mystic border from 4 to 6 links plus the ring, and the Zealot–Vanguard border from 5 to 8, short
of the reference's 10 to 13. I stopped there on purpose (§7, tension 5): the inner Zealot–Mystic border is already
dense (four links within about 1,500 units), and its casters crossing east is today's problem, not a missing link.
Candidates the joining agent may add if the neighbours want them: Shattering Rite's tip to the Lantern's Spire road
(physical and elemental spells with Cinder's ignites); ZE-5's west small to Hallowed Hammer's new place, only if that
place is at least 5 steps from ZE-5 (§5.2, the ledger's own condition on VA-m2).

**Three ledger crossing rows do not fit the Zealot's geography**, so the joining agent should not look for them:

- "MY-5's side to the Bell Tower": the Bell Tower is the Zealot's far west, nowhere near the Mystic. The elemental wand
  meets the Zealot's elemental strikes through M1 and the north walk instead.
- "Nave to Quarry": the Nave does not touch the Quarry, which is deep in the Vanguard behind the Rampart. The shield
  combination it named goes through V2 (ZE-7 or ZE-4's side of the Vestry to the Rampart).
- "Ambulatory rim to the Barbican's south" for VA-6 with Kindled Steel: Kindled Steel is on the Zealot's north rim, not
  near the Barbican. The fire combination it named runs through V3 and the outer walk (ZE-8, Censer, ZE-6, Searing
  Avatar); VA-6 is reachable that way if the Vanguard puts it at the Barbican's north.

## 4. Existing clusters

- **Iron Faith, re-lined** (ZE-r1, new): block with a shield and defences from the shield; drop its energy shield and
  armour lines (keep about 4 units). Why: the Nave wheel's sides must be a real choice (§8.3), and today every Zealot
  build takes both sides because Iron Faith is generic defence. After it, the wheel is a shield or the fire spell.
- **Lone Vow's spur, re-hung** off the aisle's middle node (A2), its two smalls moved onto a straight line north of it,
  (-2268,-1745) and (-2265,-1805); the keystone stays at (-2261,-1883). Why: ZE-1's reservation and the keystone that
  makes reservation moot then share one road, a fork a player sees and reaches from one place (the ledger's §4.7
  intent). Lone Vow stays 14 steps from the start.
- **Pockets made bridges** (§3.6): Censer, Thunder Peal, Kindled Steel, Tomb Dust and Brandwright gain a second way in
  from the new roads; Consecrated Plate gains a third. Crozier, Ossuary, Battle Hymn and Shattering Rite stay dead ends
  (some far tips stay, §13.5).
- **Shattering Rite** to at least 3 units (ZE-p1).
- **Kept as they are:** the home (§6 of the constraints: the start stays generic; nothing new within 8 steps), Hymn,
  Alms, Vigil, Litany, the Choir wheel, the Undercroft wheel, the shrine, the Bell Tower wheel, the Vestry wheel and the
  keystones. Moving any of them bought nothing the new clusters need.
- **Considered and not done:** re-lining the Undercroft wheel's shared ends (two ES smalls on the way to Homily's spell
  damage, a mild spell-and-ES convergence at 14 steps; small, and the wheel's sides are still a choice); removing
  Battle Hymn (far, but it is the warcry build's only Zealot notable and now ZE-8's neighbour).

## 5. The size it reaches

| what                                                   |    nodes |
| ------------------------------------------------------ | -------: |
| 11 new notables                                        |       11 |
| their smalls (39)                                      |       39 |
| road nodes (3 + 4 + 5)                                 |       12 |
| crossing nodes (about one each for M1, M2, V1, V2, V3) |        5 |
| **new in all**                                         | **≈ 67** |

The region goes from 151 nodes and 28 notables to about 218 nodes and 39 notables, against the ledger's 220. It fits
inside today's circle: the inside patches take five clusters and the aisle, the rim band the rest.

## 6. The two examples

**The classic caster (Mystic start; spell damage and energy shield).** Today at 120 points it takes from the Zealot
Homily, Glass Wall, Tomb Dust, Hearthfire, Litany and Hymn, and 40 more points would add Crozier, Consecrated Plate,
Ossuary, Vigil and Iron Faith, worth 1.5 to 3 units each to it. After this brief, its west offers two roads with
different mixes:

- **Through the Narthex and the aisle** (about 20 to 21 steps): ZE-1 (spell damage, about 4.5 units for it with its
  smalls), Consecrated Plate (armour with a little ES), Lone Vow if it runs auras.
- **Through the Choir to the Undercroft** (about 20): the Homily–Glass Wall wheel, one side or the other (spell damage
  or ES with a shield), Vigil on the way, Tomb Dust beyond.

At 120 points the caster cannot take both and still take its own north and east (the Mystic's new spell and ES
clusters). The likely plans: (a) home and east, with the Zealot's Homily side only; (b) home and west through the
aisle, giving up the Mystic's east crit side; (c) the far north loop by the Lantern (M1), where ZE-9 and ZE-11 sit
seven to nine steps apart, a destination worth a long walk and nothing nearer. What 40 more points would buy is the
road not taken: ZE-1 or Homily, worth 4 to 5 units. Iron Faith, which it took for ES, is now a shield notable and
drops off its list.

**The strength sword build (Reaver start; life, armour, sword damage)** does not reach the Zealot: the nearest Zealot
notable is 20 or more steps away across the Vanguard. What this brief does for it is negative space: the new armour
next to the Vanguard border (ZE-5) carries no life, and the new life in the south-west (ZE-8) is at the far rim, so
the Zealot's Wall border does not become a cheap life-and-armour stop for a Vanguard or Reaver build passing through.

**The Zealot's own builds, by hand (the allocator cannot run on a sketch; G3 runs it):**

- **Fire-burn caster:** west (Hearthfire, Censer, ZE-10's ES and life, Searing Avatar) or north (ZE-1, Homily, Cinder
  through the Undercroft). At 120 it gets one of them and part of the other; its spell damage is no longer one flat
  list of Mystic notables.
- **Staff blocker:** ZE-7 (spell block, south-west, 12) or ZE-1 (spell, north-west, 15) first; Quarterstaff (12) and
  Crozier (19) are in different directions again. Block now has somewhere to climb.
- **Sceptre fire:** ZE-5 (armour, 9) and Gilded Rod (12) early, then a choice between the Rampart's armour and life
  (the Vanguard) and the fire west (Censer, Searing Avatar, ZE-6, Kindled Steel). It no longer needs the Vanguard for
  its first armour, but its life still comes from there.
- **Aura and brands:** Choirmaster (8), then the aisle (Lone Vow or ZE-1, 14 to 15) or the brands (the shrine and
  Brandwright, 18 to 19, Brandwright now reached through ZE-1); ZE-8 at the far south-west is the life-aura choice.
- **Shield caster:** Iron Faith (6) south-west then ZE-4 (12), or Glass Wall (14) north-east with Homily; ZE-11 far.

## 7. Tensions said out loud (§13)

1. **Tension against strength by the back door.** Five new clusters at 9 to 15 steps make the Zealot's home richer.
   Guards: nothing new within 8 steps of the start (§6.2, §13.8); none of the near ones pairs life with armour or spell
   damage with ES; the near armour (ZE-5) has no life. The Zealot's casters should end with about the same spell damage
   as today, now from home in three directions instead of from the Mystic in one (G-growth §0, the per-stat report).
2. **Connections against trade-offs (§13.1).** The aisle and the five new bridges shorten paths: Consecrated Plate 18 to
   13, Brandwright 23 to 18, Kindled Steel 24 to 20, Crozier 21 to 19. That lowers tax (target 5) and makes far clusters
   count, but it also makes the far west cheaper to collect. I weighed it by giving each shortcut a different kind of
   notable on the way (the aisle passes ZE-2 for a summoner and ZE-1 for a caster), and by not joining the outer walk to
   the Ambulatory's walk anywhere except at its two ends.
3. **Far clusters against filler at a distance.** Six clusters are 20 to 24 steps out. A cluster nobody reaches is
   filler however good its lines. Each sits where a build already goes (Searing Avatar 20, Censer 17, Kindled Steel 20,
   Tomb Dust 18) or where a crossing lands, so it is "what 40 more points buy" for a build that went that way, not a
   destination of its own. If G3's allocator shows nobody taking ZE-9 or ZE-11, they are the first to bring inward.
4. **The convergence rule far out.** ZE-9 (spell) and ZE-11 (ES) are seven to nine steps apart on the north walk, with
   Tomb Dust's ES line nearby. The ledger allows the pair far out as a destination; at 24 steps from the Zealot and 30
   from the Mystic, it is one. ZE-1 is four steps from Consecrated Plate's 10% ES, a small line I left.
5. **Crossings against the reference's count.** Five new links where the plan asked about five per border. The inner
   Zealot–Mystic border is already the busiest in the network; more links there would make the Mystic's notables
   cheaper for Zealot casters, the opposite of what fact 1 in §0 asks for. The outer border (the north walk) gets both
   new Mystic links. The joiner may add the two candidates in §3.
6. **Identity against spread (§13.2).** The Zealot's casters gain home supply, which lessens how much they mix with the
   Mystic. That is intended: the Mystic becomes a direction they choose, not the place every one of them must go.
7. **Ledger placements against the twin rule.** ZE-8 at the ledger's spot breaks the ledger's own Choirmaster ≥ 5;
   ZE-10 on the aisle would sit next to ZE-1's spell damage. I moved both outward and said so; the cost is reach (20
   and 22 steps).
8. **Keystone distances (§16).** Searing Avatar stays at 20 and Sigil Warden goes from 23 to 22, both beyond the working
   8 to 18. Left open: moving a keystone inward to meet a working number is not a player's reason.

## 8. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Each flat want of the Zealot's builds (spell damage, block and spell block, auras,
  armour) gets supply in at least two directions with different partners, so taking it costs something; tension is
  weighed against the start, the looks and the vocabulary (§7 above).
- **§2 The reference.** Not copied; measured facts used (twins at least 5 apart, pockets as bridges, roads that turn at
  junctions). No names given; G3 names, with plain words.
- **§3 A network.** The aisle and both walks add loops; every new road has two or more ways in (the north walk four); one
  cut, leaving nothing with a single way in; five crossings, each named for a combination.
- **§4 Regions and areas.** No build-named area; the defences stay varied (life ZE-2, ZE-8, ZE-10; ES ZE-10, ZE-11;
  armour ZE-5; block ZE-4, ZE-7, ZE-11; resistances Litany); the region still sells mana, flasks, leech and auras.
- **§5 Specializations.** Every new cluster's twins checked in steps on the sketched graph: all at least 5 (the closest:
  ZE-5 to Iron Faith 5, ZE-4 to Iron Faith and Rimed Steel 6, ZE-2 to Quarterstaff 6). Sceptre and staff, the Zealot's
  weapons, sit in its region; three directions each.
- **§6 Starts.** Unchanged; nothing new within 8 steps; first notables still 2 to 6 steps out.
- **§7 Roads and attributes.** New roads are +6/+6 attribute nodes with clusters off every stretch; the 12 road nodes and 5 crossing nodes add
  about 100 strength and 100 intelligence to the region's supply, for G5's check.
- **§8 Clusters and smalls.** One stat per small, uniform within each cluster (the leads were chosen so the folded
  sections stay uniform); notables to be priced at 3 to 5 units; Iron Faith's re-line makes the Nave wheel a real
  choice. Every new small belongs to a notable.
- **§9 Keystones.** All six stay dead-end spurs; Lone Vow re-hung, still a spur; distances in §7.8.
- **§10 Vocabulary.** New pairs used in the Zealot: channelling, cold with a shield, staff with spell block, sceptre with
  burning, spell damage with duration, minions with life. Lines exist in `lines.ts` (shield block, spell block, staff,
  sceptre, burning, duration, channelling, reservation); G3 checks each is live.
- **§11 Looks.** Clusters sketched in empty space, none within 160 units of an existing node; no new link crosses an
  existing one (scratch check); the walks follow the rim in straight runs that turn at junctions. Labels: "The Vestry"
  sits under ZE-4 and "The Aisle"'s label under Lone Vow in the sketch; G3 moves area names.
- **§12 Size.** About 67 new nodes, an outcome; all inside today's circle.
- **§13 Tensions.** Eight said out loud above.
- **§14 Rejected ideas.** No generation, no build list as the basis, no filler roads, no step-count reach radius (steps
  here are costs to read a walk, not a reach test), no restrictive new rule.
- **§15 How the work is done.** Pictures before and after; the user's words kept in front; walks by hand where the
  allocator cannot run yet.
- **§16 Open.** Size, crossings and keystone distances noted; attribute supply for G5.

## 9. Open questions for the user

1. **The Nave wheel.** Iron Faith becomes a shield-only notable, so builds without a shield stop taking it. Agreed?
2. **ZE-8 (life with auras) at the far south-west**, 20 steps out by Battle Hymn and Grim Oath, or nearer (the Vestry
   patch, 12 steps) at the cost of sitting four steps from ZE-5's armour (a life-and-armour stop for the sceptre
   build)?
3. **The north walk**, a rim road from Kindled Steel round the Undercroft to the Lantern, holds three clusters 21 to 24
   steps out. Worth it as the casters' far loop the ledger asked for, or should those clusters come inward and the
   walk wait for a later round?

Nothing in this work felt like it was losing intent. The one thing to watch in G3 is the rim: if the allocator shows
the six rim clusters untouched by every build, the rim is filler at a distance and should be pulled in.
