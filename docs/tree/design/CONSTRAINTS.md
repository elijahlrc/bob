# Passive network: every concept and constraint in one place

First pass written 2026-10-20 from the whole conversation of 2026-10-18 to 2026-10-20 (every user message, the two
question dialogs, the plan, the brief and its review, the reference study, the method notes). The user adds what is
missing. **This is the one list.** Where another document (PHILOSOPHY.md, C-brief.md, the D-files) disagrees, this one
wins. When a new constraint is learned, it is added here, not only to the document of the moment.

Each item says where it came from:

- **[user]**: the user said it, with the date.
- **[ref]**: measured on the reference tree (the reference game's study and `ref-tree.json`, local reference material in `reference/`, not in the repository).
- **[derived]**: read from the user's own edit of the Strider.
- **[adopted]**: proposed by Claude and accepted or left standing by the user. Weaker than the others, and open to change.

The constraints compete. None of them is a checklist. Placing a node means weighing all of them at once, from the
player's seat. §13 lists the main tensions, and §14 lists ideas that were tried and rejected.

Each item states the rule or the workflow, not how it was learned. History lives only in §14.

---

## 1. What the tree is for

1. **The tree exists to force trade-offs between specializations.** [user, 10-20] A physical bow build that finds a
   "bow" area and a "physical attack" area holding most of what it wants makes no decision by going there. That is just
   what the build requires, and then there is no reason to have a tree. The tree is worth having only when a build has
   to give something up to get something.
2. **It must serve tens of archetypes and tens of thousands of specific builds.** [user, 10-18] Builds cannot be
   enumerated: the combinatorics make that impossible, and there is no bot that plays like a decent player. [user, 10-19]
   So the design is about what the tree supplies and the choices it offers, never about a list of builds it supports.
3. **The requirements, none ranked above another.** [user, 10-18/19] The tree must:
   - be well balanced
   - offer many meaningful decisions
   - communicate those decisions clearly
   - be aesthetically appealing
   - have good starting zones and good late-build decisions
   - have the right amount of highways, the right distribution of attributes, and the right numerical and spatial
     distribution of node types

   "All of these need to be massively improved. There is no point in ranking them." [user, 10-19]

4. **Bob's facts that shape it:**
   - **It is the only build identity.** [adopted] There are no subclasses or masteries. The tree is where a run becomes
     "a poison Shade".
   - **Points.** [ref: A3] There are 123 in all: 99 from levels and 24 bonus points from maps 10 to 80. Level roughly
     equals map.
   - **Visits.** [ref: A3] The tree is opened in camp between maps, up to about 100 times a run, with 1 to 4 points each
     time, usually on a phone.
   - **The first points come before any skill.** [ref: A3] The first gems arrive after maps 1 to 4, so the first points
     are spent before the build has one.
   - **Refunds.** [ref: A3] A refund costs one refund point, and you earn one per cleared map. Only leaves can be
     refunded, so a stub's road comes back one node at a time.
   - **The player does not control the fight.** [adopted] Bob is an autobattler, so a node may only give an effect the
     game applies by itself: a number the character sheet shows and the fight simulation uses. An effect that depends
     on how the player moves or times things does nothing here; "no extra damage against moving targets" is an example.
     The Strategy tab is the player's one lever (hold, close in, kite), so a rule tied to it, such as Close Quarters'
     distance rule, is fine.
   - **On a phone, a node's text appears only when it is tapped.** [adopted] The first tap shows the
     node and its path cost in a dock, and the second tap allocates it. The player reads one node at a time, so finding
     where things are cannot depend on tapping around. Colour, emblems, notable names, area labels and search have to
     show where things are at a glance.

## 2. The reference

1. **The reference game is the most important reference.** [user, 10-18] Last Epoch, Diablo, Grim Dawn and the others are
   secondary.
2. **Never copy** another game's tree, layout, names, cluster shapes or line sets. [user, 10-18]
3. **When referencing the tree, look at its layout, not only its statistics.** [user, 10-19] Open the live site (pick a
   class, press F) and study how the matching part of the tree is laid out: what sits next to what, how roads run, where
   clusters and keystones sit. Trace the matching class's start node by node in `reference/tree/ref-tree.json`. Looking is
   allowed; copying is not; screenshots never go in the repo.
4. **Names use plain vocabulary a player of the reference game would use,** never a reference notable, gem or unique name. Check with
   `npx vitest run src/data/ip.test.ts` and a grep of `ref-tree.json`.
5. **Measured facts worth keeping** [ref]:
   - **Starts.** A start touches two nodes, but each one branches at once, so a start has at least four real ways out
     within two steps: highways and small-node paths into clusters. The dexterity class's start, traced in the graph, touches two +10
     dexterity nodes. Each leads straight to an attribute hub, with six and four onward exits: attribute highways, plus
     small-node paths into bow, attack speed, crit and evasion clusters. Its nearest notables are four points out.
   - **Pockets.** Pockets are tight orbits beside their junction, about a third of the spacing between clusters.
   - **Roads.** Roads are straight runs of 1 to 3 nodes that turn at junctions, and they are about a fifth of all nodes.
   - **Attribute nodes.** Bare attribute nodes are 13.6% of nodes, mostly junctions, at +10. They have mean degree 3.85
     against 2.04 for everything else.
   - **Clusters.** A notable has 2 to 3 smalls, and every small carries the notable's keyword. A notable is worth 3 to 5
     of its own smalls (median 4.9).
   - **Keystones.** Keystones sit at the rim, one step off a junction, as dead ends. Four in five carry a cost.
   - **Where specializations live varies.** It is chosen for each one, not set by a rule.
     - **Concentrated.** Wands sit entirely in one class's sector.
     - **Mostly home, with one neighbour.** Staves and bows sit 75 to 78% in one sector.
     - **Split.** Daggers and claws are split between two sectors.
     - **Wide.** Melee reaches five sectors.

     Generic stats such as life, crit, leech and block are spread across all six sectors.

   - **Spread.** The nearest other cluster of the same weapon is 7 to 14 steps away: bow 9 to 10, wand 12, dagger 10 to
     14, curse 6 to 15.
   - **Decisions.** A full build passes about 50 forks, 25 detours, 4 crossings and 2 keystones.
   - **Off attribute.** From a pure start, the first off-attribute node is 8 to 11 steps away.

## 3. It is a network, not a tree

1. **"This is a network, not a tree."** [user, 10-20] A network has loops, and every area can be reached more than one
   way.
2. **Connect generously, inside each region and between regions.** [user, 10-20]
3. **Players mix and match regions to a significant extent by paying for some highway nodes.** [user, 10-19] Long paths
   that connect to nothing are a massive wasted opportunity.
4. **Clusters may connect directly,** but that should not be the only way things connect. [user, 10-19] Where two
   clusters are joined directly, a single road node between them is often better. [user, 10-20]
5. **Every part of the network above a small scale has several ways in.** [user, 10-20] A long path with few connections
   to anywhere is basically always bad: an area, a wheel or a run of clusters should be reachable from at least a few
   directions. Only keystone spurs and single pockets are cul-de-sacs. Look at the reference for how. [user, 10-20]
6. **Most pockets are bridges** between two places. Some dead ends are fine, just not too many. [user, 10-20] Keystone
   spurs stay dead ends. [ref]
7. **Crossings: many more, each placed with intent for a plausibly desired cross-region combination,** never at random or
   by algorithm. [user, 10-19] More crossings make the tree more interesting because they enable more builds. But it must
   not be so connected that it looks messy or loses its trade-offs. Too few connections also remove trade-offs, because
   once you commit to a path you are stuck on it for many levels. There are not enough attribute roads between
   regions. [user, 10-20] The reference has 10 to 13 links between each pair of neighbouring classes (81 of 1,858
   links cross a sector border). [ref]
8. **Kinds of crossing in use.** [adopted]
   - **The centre ring** between neighbouring homes.
   - **Near bridges** of one or two nodes between areas close to the homes.
   - **Dear bridges** of several attribute nodes between far areas.
   - **The user's own extras.**

   A region's edge facing a neighbour is designed around the links that land on it.

## 4. Regions and areas

1. **Regions have a vibe and the attributes they lean on, not a theme.** [user, 10-20] They support many builds. Mana is
   not "off-theme" for a dexterity class, because every start has access to mana.
2. **No section of the map belongs to one build type.** [user, 10-20] There is no "Bows" area, and no
   area named for a weapon, element, mechanic or stat. Area labels are place names.
3. **Region shapes and names are a frame, not the point.** [user, 10-19] "Neat," and a great tree can be built within
   most of them. But "the bow region is shaped like a bow" must never come at the cost of a good tree. The tree's outline
   may be any shape. [user, 10-19]
4. **A second element is a cost, not a wall.** [user, 10-19] Multi-element builds are easy in the reference game. There should be some
   cost, but blocking a whole range of builds is not interesting.
5. **Every region has varied defences.** [user, 10-20] That includes life, resistances, the class's own defence and some
   of the others (block, dodge, stun, recovery, maximum resistances). A resist star is one way to place resistances, not a
   requirement.
6. **Every region sells, in its own voice, what most builds want.** [adopted, following the user's vocabulary note] That
   means mana and reservation, leech, crit, attack and cast speed, movement, flasks, cost, duration, and the weapon lines
   of the weapons its skills can hold.
7. **The centre holds generic nodes** for things everyone or many classes may want. [user, 10-19]

## 5. Specializations and trade-offs

The core of section 1, made concrete.

1. **Each specialization appears in two or three notable clusters, apart, each with a different partner.**
   [user, 10-20; ref] For example, fire with crit in one place and fire with the burn in another, or cold with a shield
   here and cold with freeze there. Picking the cluster is picking the partner. Spreading two copies of the same pairing
   is not a choice.
2. **Distance between twins: at least about five steps here.** [adopted, scaled from the reference's 7 to 14 in sectors
   about three times larger]
3. **How concentrated a specialization is depends on the design intent for it.** [user, 10-20] There is no universal
   rule. Some belong to one class's region (wands in the reference), and some are shared between two or three regions.
   Either way, its clusters still sit apart with different partners (item 1). In the reference, wands are all in one
   sector, yet their clusters are 12 steps apart. Generic stats are spread across all regions, as lines on many
   notables, never as one destination. [ref]
4. **Weapon clusters sit where their attribute requirements are supplied.** [user, 10-20] A weapon's clusters belong in or
   beside the regions that give the attributes its gear asks for, so the player who walks there for the weapon also
   picks up the attributes to wield it. A weapon placed far from its attributes taxes its builds twice. From Bob's item
   bases:

   | Weapon                                                           | Asks for                                                                                    | Region that supplies it |
   | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
   | Mace, two-handed mace                                            | strength                                                                                    | Wall (Vanguard)         |
   | Bow                                                              | dexterity                                                                                   | Bow (Strider)           |
   | Wand                                                             | intelligence                                                                                | Spire (Mystic)          |
   | Axe, two-handed axe, two-handed sword, half of one-handed swords | strength and dexterity                                                                      | Yard (Reaver)           |
   | The other half of one-handed swords                              | dexterity                                                                                   | Bow, Yard               |
   | Dagger, claw                                                     | dexterity and intelligence                                                                  | Knife (Shade)           |
   | Sceptre, staff                                                   | strength and intelligence                                                                   | Cathedral (Zealot)      |
   | Shields                                                          | by defence: armour (strength), evasion (dexterity), energy shield (intelligence), or a pair | the matching region     |

   A weapon cluster in a region that supplies only one of its two attributes is fine, usually beside the border with the
   other attribute's region. The other attribute then has to come from a crossing, a hybrid junction or gear.

5. **Neighbours compete.** [adopted] Two clusters that one build wants both of should usually not sit a step apart.
   Passing through a notable of a different kind to reach the one you want is a fair price.
6. **A specific path is fine if it is optional.** [user, 10-19] A path with only cold damage is fine as long as another
   optional path covers fire and lightning.
7. **Builds the user named as missing must exist,** such as minions, spirit shield and wand attacks in the Spire.
   [user, 10-20] Each region needs enough diversity to support the full range of builds.

## 6. Starts and homes

1. **The start is the most important part of the network.** [user, 10-19]
2. **The first points offer a real choice, carry coherent stats, and do not commit the player to a build.** [user, 10-19]
3. **The requirement is that starts are interesting and not too prescriptive.** [user, 10-20] The rest of this item is
   a pattern from the user's Strider edit, not a rule: a start may follow it or not. [derived]
   - The start touches two stat nodes: the two sides of a signature loop, offence one side and defence the other. They
     are not attributes. A signature notable is one good way to open a start, not a requirement. [user, 10-20]
   - The hubs sit one step out and carry the class attribute. They join the ring one node to either side, and each has a
     pocket.
   - Nothing within about three steps names a weapon.
4. **The home does not have to be generic.** [user, 10-19] Specific porches are fine as long as they are optional and
   another path serves the class's other builds.
5. **The first notables are three or four points out,** and the start fans out into several directions before then:
   highways and small-node paths, not a single chain. [ref; user, 10-20]

## 7. Roads, highways and attributes

1. **Highways must exist and be easy to read.** [user, 10-19] A highway is plain: attribute nodes, not connectors whose
   properties are loosely related to the nearby notables and hard to reason about.
2. **Most clusters branch off an attribute road.** [user, 10-20] The attribute roads are the network's skeleton, and most
   clusters, but not all, hang off them. Some clusters connect directly to each other. [user, 10-19]
3. **A road should not go a long way without clusters coming off it.** [user, 10-20] A long road dense with clusters
   branching from it is good. A long stretch with nothing coming off it is filler. The test for any stretch of road is
   what the player can branch to along it. [user, 10-19, softened 10-20]
   The share of attribute nodes follows from the roads; the reference has 13.6% bare attribute nodes. [ref]
4. **Attribute values.** [adopted]
   - **Node sizes.** +7 for a pure class and +6/+6 for a hybrid on roads; the six homes' hubs keep +20 and +15/+15.
     [adopted, 10-20: +10 and +7/+7 first; the build walks of the same day still found 300 to 470 of the main
     attribute at 123 points, so they went down again] Fewer, bigger nodes were the user's suggestion when roads were short [user, 10-19]; with the
     roads the user then asked for, +20 nodes supplied 6 to 10 per point and a late build would carry 400 or more of its
     attribute, against gear that asks at most about 245.
   - **Supply.** It follows from the roads, and is checked against the gear: a late build should meet the heaviest
     requirement of its weapon without crossings, and a hybrid gets both attributes along every natural path. [adopted]
   - **Off attribute.** It costs about 8 to 10 steps from a pure start.
5. **Gear requirements stay as they are.** [user, 10-19] If attribute supply is off, find what diverges. Bigger
   attribute nodes are allowed.

## 8. Clusters, notables and small nodes

1. **A small node is one stat at the reference's size:** 5% life, 10% evasion, 5% attack speed, 15% crit. [derived]
2. **Within a section, every small carries the same modifier.** [user, 10-20, "sections of small nodes are mixing
   different modifiers when they should be the same"] A section is a road, a wheel's side, a pocket's smalls or a keystone
   spur. Mixes live on notables. The exceptions are the two sides of a start loop and clusters whose point is variety,
   such as a resist star. [derived]
3. **Micro choices must be real.** [user, 10-19/20] A wheel's two sides must be a real choice, in one of two ways:
   - **Two variants of one theme** that a build would rarely take both of: shield or two-hander in a melee wheel, traps
     or mines, dagger or claw.
   - **Two unrelated things, but only if the route through the wheel takes one side.** The player passing through
     picks a side, and taking the other one costs a detour.

   Either way, picking a side is a decision and taking both is a commitment. Sides that are near-identical, or that
   every build of the theme wants anyway, are fake. Examples of fake choices:
   - 12% evasion against 8% evasion with 2% movement speed.
   - 3% attack speed against 2% attack speed with 5% accuracy.
   - Two bow notables on opposite sides of one circle. "If I'm playing a bow character I obviously want both."

4. **Cluster shapes are flexible.** [user, 10-19] Small four-node clusters of the same shape are fine, as long as they
   are not the only kind of cluster and are placed with care. [user, 10-20]
5. **Forks inside an area are good.** [user, 10-19] They let an area hold two variants of one idea, such as shield or
   two-hander in a melee area. Forks between nodes that belong to no named area are fine too.
6. **A notable is worth 3 to 5 units,** where a unit is the reference small node of that stat. [ref; adopted]

## 9. Keystones and the late game

1. **There are 27 keystones,** matching the names in `src/data/tree/keystones.ts`. Each sits at the end of a spur of one
   or two smalls off a junction, as a dead end. [ref; adopted]
2. **A keystone is a trade the character sheet can show:** a stat goes down, or something can no longer be done.
   [adopted; user agreed, 10-19]
3. **Good late-build decisions are a requirement.** [user, 10-18] Walk at least one 120-point build. [user, 10-20] A region
   alone runs out at 80 to 100 points, so the late game lives in the crossings, in second keystones and in neighbours'
   areas.
4. **Postponed:** threshold notables and keystones that trigger on the main skill. They are "not bad ideas, but not the
   core thing we are trying to get right". [user, 10-19]

## 10. Node vocabulary

1. **Use a wide vocabulary, across clusters.** [user, 10-20] A small palette makes the network feel one-note and linear.
   Examples:
   - weapon-specific lines
   - shield and dual-wield lines
   - mana leech and mana on hit
   - crit with a weapon type
   - reduced reservation
   - poison damage

   Most of the reference game's stats can appear here with no engine changes. Exact parity is not needed, and some mechanics should not
   be copied at all.

2. **Within a cluster, every node shares one theme.** [user, 10-20] The broad vocabulary belongs between clusters, not
   inside them. A cluster or a notable may pair two things that belong together in a build, such as "axes and bleed" or
   "staff damage and block". It may not pair two that do not, such as "poison damage and staff damage". The one
   exception is a wheel's two sides (§8 item 3).
3. **Every line a node carries must be read by the sheet and obeyed by the simulation.** [adopted] Dead lines are never
   written: `skillDuration` tagged mine, `aoe` tagged minion, `cooldownRecovery` tagged warcry. [adopted, from the
   engine-stat investigation the user delegated]
4. **Node kinds.** [adopted] The kinds are small, notable, keystone, attribute and start. New nodes may use existing
   stats, and new engine stats are added where a theme clearly needs one. [user, 10-19] Masteries, jewel sockets, ranked
   nodes and points-in-region gates are declined for now. [adopted]
5. **The editor sets node properties.** [user, 10-20] The user edits the network in the tree editor, including which
   lines a node carries.

## 11. Looks and communication

1. **It must be aesthetically appealing.** [user, 10-18]
2. **No overlapping lines.** [user, 10-20] No edge crossings, no two unlinked nodes closer than 100 units, and no area name
   over another. An area name may lie over small nodes and links: some overlap is inevitable, and the names fade as
   the view closes in (item 4). [user, 10-20, the label pass]
3. **Geometry.** [ref; adopted]
   - Pockets are tight orbits facing their junction.
   - Clusters are compact: identical small nodes clumped together read well. When a cluster needs room, compact
     the smalls, lay a new road or enlarge the map rather than cram. [user, 10-20, round 4]
   - Roads are straight runs with corners.
   - The network is dense all the way out, from the starts to the rim. There is no empty moat around the starts and
     no deliberately sparse band. [user, 10-20]
4. **Readable on a phone.** [adopted]
   - Regions can be told apart at full zoom-out.
   - Area names show when zoomed out and fade as the view closes in, gone before the notables' names appear: names
     of places hand over to names of nodes. [user, 10-20] They are drawn behind the nodes in tree units, like place
     names on a map (`AREA_LABEL` and `areaLabelAlpha` in `src/ui/treeStyle.ts`, used by the game's tree screen, the
     editor and the renders).
   - Colour says what a node gives, and shape says its rank.
   - The keystone card shows on tap, along with the path cost and search.

## 12. Size and balance

1. **Size falls out of the constraints.** [user, 10-19] Quality always beats count. If removing nodes improves the tree,
   remove them. If adding nodes improves it, add them. For balance, the network will probably end up around 1,500
   nodes. [user, 10-20]
   - A network too small for that has too few kinds of node, or high-value nodes packed too densely with too few
     trade-offs between them; the user leans to the second. [user, 10-20]
   - The reference's nearest other notable is a median 5 steps away (IQR 3 to 6). [ref]
   - Grow it iteratively, region by region, adding nodes into clusters and roads where they are needed, not in one
     big pass. [user, 10-20]
2. **The node count is not final.** [user, 10-20] New nodes will keep being added, so a specialization that needs another
   home can get a new cluster rather than re-lining an old one.
3. **Balance is a property of what the tree supplies, not of bot results.** [adopted, after the user's note that no bot
   plays like a decent player] Each axis value a start is meant to reach should buy comparable power per point. Price
   every node in units.
4. **Run no incremental balance simulations while building.** [user, earlier sessions] Run at most one at the end.

## 13. Constraints that pull against each other

These are the places where judgment does the work. Neither side may simply win.

1. **Connections against trade-offs.** More crossings enable more builds. But a mesh where everything is next to
   everything has no trade-offs, and too few links lock a build in for many levels. [user, 10-19]
2. **Identity against spread.** A specialization that gives a class its identity may be kept in that class's region.
   Its clusters must still sit apart with different partners, so concentration never becomes one destination.
3. **Uniform sections against variety.** Smalls within a section must match. The variety goes into notables and into the
   mix of clusters along a road, never into a section's smalls.
4. **Highways against filler.** Roads must exist, read as roads and carry most clusters. A road earns its length by what
   branches off it, and a stretch with nothing branching off is filler.
5. **Bridges against dead ends.** Most pockets connect two places, but a network made only of bridges loses the
   commitment of a far tip. Some dead ends, and every keystone spur, stay.
6. **Region identity against many builds.** A region has a vibe and attributes, and it must still support many builds.
   The identity comes from proportions and attributes, not from exclusion.
7. **Shapes and names against the tree.** Keep them where a good tree fits inside them. They lose wherever they make a
   node or a link worse.
8. **A generic start against early direction.** The first points must not commit a build. Optional specific porches near
   home are still fine.

## 14. Rejected ideas: do not bring these back

Each was tried or proposed and struck by the user. The date is when it was struck.

- **Generating the tree programmatically** and tuning the generator to pass measurements. [10-18] Scripts that place,
  move or check nodes are fine; the thought goes into what each node is and why it is there. [user, 10-20]
- **Enumerating the supported builds** as the basis of the design. [10-19]
- **"A caster's build is one element taken deep"**, with arms that wall elements off. [10-19]
- **"Everything in the home is generic for the class."** [10-19]
- **Filler road nodes:** stretches of low-value nodes with nothing coming off them. [10-19] Long roads are fine when
  clusters keep branching from them.
- **"No attribute corridor longer than one node"** and "clusters should mostly connect directly". [10-20] These
  overcorrected the filler rule and cut the roads the clusters should hang from.
- **"Every fork is between two named areas".** [10-19] More broadly: do not invent restrictive constraints without a good
  reason, because there are already many to balance.
- **Starts with no choice, random stats and an early lock-in.** [10-19]
- **Connector nodes with muddled properties** "somewhat related to their nearby notables" instead of plain highways.
  [10-19]
- **Fake micro-choices** between near-identical smalls, and two notables one build wants both of placed as the two sides
  of a circle. [10-19]
- **Long paths that connect to nothing.** [10-19]
- **Writing a region without looking at the reference game's layout.** [10-19]
- **A one-note palette** of a few generic stats. [10-20]
- **"One resist star per region"** as a rule. [10-20]
- **"Every pocket is a bridge"** as an absolute. [10-20]
- **Calling a region's stats "off-theme".** [10-20]
- **"Every node and link has a written reason".** [10-20] The process must weigh every parameter, but it does not need
  node-by-node paperwork.
- **Only short walks.** [10-20] Walk late 120-point builds too.
- **A sparse moat around the starts,** or any deliberately empty band. [10-20] The network is dense all the way out. The
  moat came from a recalled impression of the reference, not a measurement.
- **Treating "forty identical diamonds" as the worst sin.** [10-20] Same-shape clusters are fine when they are not the
  only kind and are placed with care.
- **Build-named sections and area labels** ("Bows", "Physical attacks", "Fire", "Minions"), and one wheel per theme.
  [10-20]
- **Section ideas that confused the user, earlier** [10-19]:
  - Delivery categories that are not meaningful to a player (melee, projectile, area, chaining, channelled, triggered,
    slam, strike, nova).
  - Speed and crit left unsplit into attack and cast.

## 15. How the work is done

1. **Intentionality is thousands of small, careful decisions, not a dial labelled "design".** [user, 10-19] Every change
   is judged by a player progressing through a build at a micro level.
2. **There is no test for "is the tree good".** [user, 10-19] Use judgment and think like a player. Write walks: short
   20-point walks (the class's main build, an off-build, a neighbour coming in) and at least one 120-point late build.
   [user, 10-20] In a walk, name what the build chose, what it gave up, any stretch with no choice, and any notable nobody
   would take.
3. **Weigh every constraint at once when placing a node.** [user, 10-20] The process is what matters, not documenting
   each node.
4. **When fixing a specific problem, also fix the meta-level problem that caused it.** [user, 10-19]
5. **Look at the reference before writing.** [user, 10-19] Render after every change, and render a text view the user can
   open and read. [user, 10-19/20]
6. **Have review agents each check a subset of the constraints** after a first pass. [user, 10-20]
7. **Pause and ask when intentionality slips.** [user, 10-19] Before a large rework, restate the user's principle back to
   them in your own words. [user, 10-20]
8. **Ask questions plainly,** without jargon you invented, using the question dialog. [user, 10-19] The user is often on
   a phone, so send files there.
9. **The Strider region is the user's edit.** [user] Changes there are allowed but are not the priority. [user, 10-20]
   Fold the user's editor patches before registering new ids.
10. **Repository rules.** [user, earlier sessions] Commit locally only, and push only when asked. Never use `git stash`.
    Screenshots of the reference never go in the repo.

## 16. Open, not yet decided

- **Exact numbers.** Attribute node size, twin distance, and keystone distances from the starts (8 to 18 steps today;
  the reference's nearest is 6 to 10) are working values, not decisions.
- **The size of the finished network.** It is about 1,009 nodes now, heading for about 1,500 (§12 item 1).
- **Attribute values (§7.4).** Roads are +7 and +6/+6 since 2026-10-20, hubs +20 and +15/+15; to be checked against
  the gear by walks again once the network is near its final size, since more roads per walk means more supply.
- **The Knife and the Cathedral were thin.** After the fourth round the Knife has 28 notables and the Cathedral 28,
  against 29 to 40 elsewhere. The Knife gained an outer road (the Rooftops) in round 3 and a centre wheel (Athame) in
  round 4, and a ridge road along its north rim (Ritual Blade).
- **The road skeleton.** Every home's two hub roads are highways; the Spire, the Cathedral (the Ambulatory), the Wall
  (the Barrows road, the tower road, the barrow stair) and the Knife have real roads. The Yard's centre is still a
  lattice, joined cluster to cluster with single road nodes; it needs re-laying like the Cathedral's. The Strider is the
  user's and is untouched.
- **Roads between regions.** Every border now has 4 to 6 links, against the reference's 10 to 13 per neighbouring
  pair; more are needed as the regions grow toward their borders.
- **One-stop shops after round 3.** Fixed in round 3: the mace-and-shield Vanguard (Bracing and Thick Skin traded
  places; Bracing is 14 steps from Weight of Iron), the fire sceptre (Kindled Steel went to the Ambulatory; Gilded Rod,
  Kindled Steel and Searing Avatar are 11 to 13 apart), the Reaver's leech (Thirsting Blade went west, 15 from Red
  Harvest), the summoner (two more minion clusters, 23 and 31 steps from the Zealot), and the poison claw (Festering
  went to the Yard and Carrion Claws to the Knife's Rooftops; Hexwright and Devotion traded places so the new chaos
  spells are not a curse one-stop). Round 4 (`E-round4.md`) fixed the rest of the round-3 list: the two-handed
  mace in the Barbican (Greatweight re-lined off stun, one link cut), sword and board in the Muster (one link cut), the
  Shieldwall spur (a dead-end small before the keystone), the Barrows' two-hander row (Greatblade moved down the road),
  and Mist Walk / Tumble (Tumble re-lined). Grave Host stays every summoner's farthest minion notable (user, 10-20).
- **Keystone costs.** Pain Conduit and Volatile Servants have none, and Mind Bulwark has none the sheet shows. Their
  effects live in `src/data/tree/keystones.ts`, which has other uncommitted work.
- **The unit table.** `UNIT` in `lines.ts` sets the reference small at 3% attack speed, 20% crit and 12% evasion; §8.1
  says 5%, 15% and 10%. Both trace to the user's Strider. Which one stands is the user's call.
- **The Strider's one-stop shops** (the user's region): the projectile notables along one rim, and the Far Flight /
  Split Volley fork. The audit's proposals are in `audit/audit-tradeoffs.md`. Round 3 added: Close Quarters' spur is a
  road, the same pairings True Aim / Quick Hands, Vital Aim / Killing Eye and Hatchet Work / Hewing, and a fire-attack
  bow cluster (`audit/round3/`). Round 4, with the user's approval: Split Volley and Barbed Arrows traded places and
  Rapid Fire's link to the flask pocket was cut (the four rim projectile notables are 7 to 11 apart, were 2 to 4);
  Quick Hands, Killing Eye and Hatchet Work were re-partnered; Pitch Arrows (fire bows) was added. Close Quarters' spur
  is still a road, by the user's choice.
- **In the game.** Since 2026-10-20 the game loads this tree (phase F): change an area file, `lines.ts`, the registry or
  the editor's patch, then run `npm run passives:bake`. Retired ids stay as holes so saved ids keep their meaning.
- **Labels.** Done in round 4 (`E-round4.md`, "The label pass"): every area name sits over its own area, no two
  overlap, none covers a notable, keystone or start. Move one when an area grows under another's name.
- **Weapon placement against attributes (§5 item 4).** Every weapon cluster sits in a region that supplies at least one
  of its attributes. One sits poorly: the Wall's axe cluster (Cleaver) is in the west tower, the side farthest from the
  Yard, so an axe build there gets strength but no dexterity nearby; Headsman (2026-10-20) is the axe on the Wall-Yard
  border. Second homes were added for staves (Crozier), mines (Black Powder), brands (Brandwright), warcries (Battle
  Hymn), daggers (Quiet Knife), minions (Ossuary, a third), maces (Hallowed Hammer, a third) and cold outside the Spire
  (Rimed Steel, on the Bell Tower wheel since round 3). Round 3 added a second wand-attack home (Deft Wand, six steps
  from the Mystic start). Single homes remain for fervour and insight.
- **Late-game supply.** Round 3 gave each element a late cluster far from its first ones (Sleet, Thunder Peal,
  Censer), added the first chaos-spell notables (Rotting Word, Tomb Dust; the `chaosSpell` line is new) and two late
  minion clusters (Black Flock on the Docks wheel, Grave Host in the Barrows). Round 4 filled the specialization audit's list (`audit/round3/specializations.md`): two more
  curse clusters (Grim Oath on the Wall, Marked Prey on the Yard's new Fosse road), physical spells (Whetted Will,
  Shattering Rite; the `physSpell` line is new), lightning attacks (Stormstruck), a third trap cluster (Snare Line),
  spell block outside a shield (Stone Ward), dual wield on the strength side (Two Fists), and the dagger's centre wheel
  in the Knife (Athame for the dagger caster, Long Knives for the dagger attacker; the user asked for the caster's
  centre), a third dagger-caster cluster (Ritual Blade), and channelling as a line on two notables (Steady Stream for
  spells, Ceaseless Blades for attacks; the user approved it, 10-20, as a line rather than a section).
