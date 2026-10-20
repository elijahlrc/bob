# Second round: roads, density, access, and a build-walk audit (2026-10-20)

What you asked for:

- The start pattern is a pattern, not a requirement.
- More attribute roads, both between regions and within them.
- More nodes, heading for about 1,500, because high-value nodes were packed too densely.
- No long paths with few ways in, especially on the left side.
- Grow iteratively, by adding nodes into clusters and roads.
- Then a second audit that walks builds.

The audit reports are in `audit/round2/`.

Checks: audit 0 problems, 0 edge crossings, names test passing, `tsc` clean, ids registered. Nothing is committed.

Maps (the whole-map ones have no area names, so the node names can be read):

- `D-all-nodes.png` (the whole map)
- `D-all-nodes-text-north.png` and `D-all-nodes-text-south.png` (every node's stats)
- `D-<class>.png` and `D-<class>-text.png`

Area labels collide in 55 places; their placement waits until the end, as you said.

---

## Decisions to check

1. **Attribute nodes on roads are now +7, and +6/+6 for hybrids.** The six home hubs keep +20 and +15/+15.
   - The heaviest gear asks for about 245 of one attribute late in a run.
   - At +20, roads would have given 400 or more. At +10, every build walk still finished with 300 to 470 of its main attribute by 123 points.
   - Reversing this is a search and replace.
   - It should be checked again near 1,500 nodes: more road nodes on every walk means more supply.
2. **The Wall's three outer areas were spread outward from the Vanguard start** to make room: the Rampart, the Barbican and the Barrows. Each cluster moved whole and kept its shape. The home and the two border areas (the Battlements and the Quarry) did not move.
3. **A new area, the Ambulatory,** runs round the back of the Cathedral.
4. **Some links were dropped:**
   - Greatweight to Ground Shaker
   - Benediction to the tower junction
   - Cleaver to Broad Back
   - Field Dressing to Guarded
   - Steel Rim's triangle with Crossed Blades and Red Harvest
   - Wound Dance to Shield Bash
   - Twin Fangs to the Lists gate
   - Buckler to Twin Fangs
   - Keen Edge to Light Blades
   - Fencer's Eye to Shieldwall
   - Cairns to Unhurried
   - Vampiric Strikes to Unbloodied
   - The Barrows' second link north
   - Pain Conduit's spur to the Knife road (re-landed on the Gallery stair)

   Each was a notable joined to a notable, a keystone spur used as a road, or a link that crossed once things moved.

5. **Starts were not redesigned.** CONSTRAINTS §6 now says the requirement is "interesting and not too prescriptive", with the signature loop as one pattern.

---

## What changed

### The left side: the Cathedral and the Wall

**The Cathedral** grew from 91 to 140 nodes and from 17 to 24 notables.

- **The Ambulatory** (`cathedral/ambulatory.ts`) is a road of seven attribute nodes from the Bell Tower's junction to the Undercroft's shrine. Before, both arms hung off a single node; now they are joined at their far ends.
- **A back road** runs from the Vestry's junction to the Ambulatory, so Searing Avatar can be reached without either notable of the tower wheel.
- **New clusters:**
  - Crozier: staff with spells, the second staff home.
  - Consecrated Plate: armour with energy shield; the Zealot's armour was thin.
  - Brandwright: the second brand home.
  - Rimed Steel: cold attacks, the first cold home outside the Spire.
  - Ossuary: minions with energy shield, the third minion home.
  - Tithe: attack leech for the melee Zealot.
  - Battle Hymn: warcries with auras.
- **The crypt stair** gives the Undercroft a second way in from the Spire crossing.
- **The five wheels** are widened to eight nodes. Each now has a small between each notable and the exit, so the two notables are four steps apart, not two.
- **Road nodes** now sit between the Litany star and the staff side, the star and Choirmaster, and Shepherd and the Spire.

**The Wall** grew from 125 to 181 nodes and from 29 to 35 notables.

- **Space:** its outer areas were spread outward (decision 2).
- **Road nodes on 11 long direct links,** which turns most of the west towers' cluster-to-cluster joins into roads.
- **New roads:**
  - The Barrows road runs east from Heavy Hands to the Yard's Pits; the Barrows had one way in.
  - The tower road runs from Greatweight to Iron Liturgy.
  - The barrow stair runs from Iron Liturgy to the grit wheel.
  - A road joins Ground Shaker to the tower junction.
- **New clusters:**
  - Headsman: the two-hander with stun, on the Wall–Yard border.
  - Greatblade: a two-handed sword.
  - Iron Liturgy: spells with armour. The Wall had no spells.
  - Long Reach: melee reach.
  - Barrow Ward: regeneration with less physical damage taken.
  - Hallowed Hammer: maces with elemental damage, the third mace home.
- **The grit and Bulwark wheels** got a small each, so their notables are three steps apart.

### The Spire, the Knife and the Yard

**The Spire:**

- Two climbs give Shatter and Fever Pitch three ways in; before, Thunderhead was the only one.
- Harsh Weather is a bridge again, four steps from Overcharge rather than one.
- Mist Walk and Devotion joined Flashpoint and Wand Volley; that run had no branch for seven nodes.
- Road nodes went on four direct links.
- Three crossings now land on a cluster's small rather than its notable: Wand Volley to Frugal, the Shepherd crossing to Draught, and the Hexwright crossing to the Knife.
- After the build audit:
  - Fever Pitch hangs off a road node rather than off Shatter.
  - The Knife road lands on the Gallery stair, so Pain Conduit's spur is a dead end.
  - Spirit Ward hangs beside the road rather than across it.
  - Warded Mind is energy shield with chaos resistance, no longer a copy of Glass Skin.

**The Knife** grew from 89 to 115 nodes and from 17 to 22 notables.

- Its three wheels were widened like the Cathedral's.
- **New clusters:**
  - Black Powder: the second mine home.
  - Bloodletter: leech with crit. The Knife had no recovery notable.
  - Tumble: attack and spell dodge.
  - Mercy Stroke: crit multiplier with the finishing blow.
- After the build audit:
  - The Stair runs straight through its wheel, so poison and mines are a step off the road rather than a toll on it.
  - Second Curse hangs as a leaf.
  - The start's defence side is evasion, no longer the Spire's energy shield.

**The Yard:**

- Road nodes on six direct links.
- The Steel Rim triangle cut to one road.
- After the build audit:
  - The shield wheel's second side is Scarred Hide (life, armour, less physical damage taken). The sword-and-shield build found both shield notables on one wheel, so this ends that one-stop shop.
  - Hewing is axe and bleed again, and Headsman took the two-hander.
  - Shield Bash's dead-end small has a road to the Pits.

### Roads between regions

| Border          | Links before    | Links now | New roads                                                                                                             |
| --------------- | --------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| Wall–Cathedral  | 3               | 5         | the Rampart road (Tithe to Stagger, with Battle Hymn); Crushing Blow to Battle Hymn (with Hallowed Hammer)            |
| Wall–Yard       | 3               | 5         | the Barrows road; Elemental Edge to Headsman                                                                          |
| Yard–Strider    | 5 (at 2 places) | 6         | Hot Blood to the Strider's road into the Yard                                                                         |
| Knife–Strider   | 2               | 4         | the Docks' claw side to Ricochet (with Veiled Herald, the Strider's first reservation); the Knife Gate to Hedge Magic |
| Spire–Knife     | 3               | 4         | Flashes of Insight to Thick Blood                                                                                     |
| Spire–Cathedral | 3               | 4         | Mana Tap to the Undercroft wheel                                                                                      |

The reference has 10 to 13 links between each pair of neighbouring classes, so this is about half the way.

---

## Measured before and after this round

|                                                    | Before                               | After                                                        |
| -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| Nodes                                              | 764                                  | 922                                                          |
| Notables                                           | 161                                  | 179                                                          |
| Notables with another notable 1 step away          | 12                                   | 4 (all in the Strider)                                       |
| Notables with another notable 2 steps away         | 67                                   | 35                                                           |
| Median steps to the nearest notable (reference: 5) | 3                                    | 3 overall; 4 in the Knife and the Cathedral                  |
| Direct cluster-to-cluster links                    | 120                                  | 88                                                           |
| Places where one node strands more than a pocket   | 15                                   | 6 (keystone spurs, the Strider's Longbow fork, Crimson Pact) |
| Runs of 6 or more nodes with no branch             | 2 (7 in the Spire, 6 in the Strider) | 0                                                            |
| Edge crossings                                     | 0                                    | 0                                                            |

Per region, after:

|          | Mystic | Vanguard | Reaver | Shade | Zealot | Strider |
| -------- | ------ | -------- | ------ | ----- | ------ | ------- |
| Nodes    | 175    | 181      | 131    | 115   | 140    | 144     |
| Notables | 34     | 35       | 28     | 22    | 24     | 32      |

---

## What the build walks found

Three agents walked 40 builds point by point to 123, as a player would level them. The full logs are in `audit/round2/`.

**Fixed after the walks:**

- The Pain Conduit spur as a road.
- The poison/mine toll on the Stair.
- Fever Pitch behind Shatter.
- Second Curse and Spirit Ward as road nodes.
- Warded Mind copying Glass Skin.
- The sword-and-shield one-stop shop.
- The two-hander placement.
- Shield Bash's dead end.
- The duplicate pairings: Iron Faith and Bracing, Battle Hymn and War Drums, Broad Back and Second Wind.
- The trap at the end of the Narthex crossing (now on to Draught).
- Attribute oversupply (decision 1).
- Stale descriptions in the Wall.

**Still open, in order:**

1. **One-stop shops:**
   - The Vanguard's mace and shield: Bracing, Mortar and Stone, Weight of Iron, Iron Lungs and Stone Heart sit in a chain four steps apart.
   - The Zealot's fire sceptre line: Gilded Rod, Kindled Steel, Searing Avatar.
   - The poison claw: five notables within six steps of the Rookery junction.
   - The Reaver's leech: three notables off one junction.
   - Minions and totems: a summoner has every minion notable by point 35.
2. **The Shieldwall keystone spur is still a crossroads,** so builds bound elsewhere walk through it. Keystone spurs
   are dead ends (§9.1). It needs the Yard's centre re-laid.

   The walks also flagged routes whose cheapest path passes a notable the build doesn't want: Scar Tissue on the
   Zealot's way west, Iron Draw and the Steel Rim wheel in the Yard, and Spire crossings that leave from a themed node.
   These are not defects: passing a notable of another kind is a fair price (§5.5), and each has a dearer way round. Such
   a route is a problem only when it is the only way in, or when the notable is a keystone spur. Both cases found (the
   Stair's wheel, the Pain Conduit spur) were fixed.

3. **Elements and minions run out:** casters and summoners have nothing build-specific after points 30 to 50. Each element needs a far late cluster with a different partner, and there is no chaos-spell notable anywhere.
4. **Wand attacks have one cluster,** 13 steps from a class that starts with a wand attack.
5. **Two free keystones:**
   - Rooted Stance costs nothing on a strength character with no dexterity.
   - Unerring Discipline costs nothing for a non-crit Vanguard, and sits beside the accuracy it makes redundant.

   With Pain Conduit, Volatile Servants and Mind Bulwark from the first audit, five keystones now need costs, all in `src/data/tree/keystones.ts`.

6. **Iron Liturgy is in the wrong place:** far from intelligence and the Cathedral's spells.
7. **Filler:**
   - Parts of the Barrows road and the tower road.
   - Many of the new clusters are dead-end pockets. The reference has many too, but these are long ones.
8. **Your Strider:**
   - Vital Aim and Killing Eye have identical lines.
   - Killing Eye touches Quick Sip, and Hard Target touches Fleet Foot.
   - The projectile rim is done by point 41 with nothing given up.
   - Round Shield mixes three things.
   - Hatchet Work needs strength the Strider can't reach.
   - The +20 dexterity on True Aim, Quick Hands and Far Flight adds to the oversupply.

   These are proposals for you.

---

## Next

The two biggest jobs left are re-laying the Yard's centre and the Cathedral's Vestry on real roads, as the Ambulatory did for the Cathedral's back, and the late-game element and minion clusters. Together with more crossings on every border, they are also where most of the next 600 nodes belong.
