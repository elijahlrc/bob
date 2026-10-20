# C. The design brief: what Bob's passive tree is

**First draft, kept for the record (2026-10-19). The live brief is `C-brief.md`.**

Phase C of [PASSIVE-TREE.md](../../PASSIVE-TREE.md), 2026-10-19. **This is the first stop for the user's eyes.** Everything
below is derived from the constraints (`A1-axes.md`, `A2-vocabulary.md`, `A3-rules.md`) and the references
(`B-comparison.md` and the five game studies); where I hold a view it is written so that it can be disagreed with, and each
item ends with **the check**: the property the finished tree will be held to. The picture is `C-sketch.png`, drawn by
`scripts/tree/sketch.ts` from `C-sketch.json`, which is the brief's own data: the places, not the nodes.

Vocabulary, as a PoE player would use it: a **region** is a class's part of the tree; an **area** is a named group of
clusters inside a region about one thing (the bow area, the minion area); a **cluster** is a notable with its small nodes;
a **wheel** is a big cluster with two or three notables; a **road** or **highway** is the string of plain nodes between
places; the **home** is the first dozen nodes out of a class start; a **spur** is the short dead-end road to a keystone.

---

## 1. What the tree is for in Bob

A player opens the tree between maps, up to a hundred times a run, holding one to four points, usually on a phone, and
closes it in seconds. The tree's first job is to make **the next node obvious** on every one of those visits, and its
second job is to make **the next destination worth wanting** so that the obvious node is also a step toward something.
Nothing else in Bob carries a build's identity: no ascendancy, no masteries, no skill trees. The tree is where a run becomes
"a poison Shade" or "a totem Vanguard", and it must do that for a run that may end on map 4 as much as for one that
reaches map 100.

Three facts shape everything: the first four points are spent before the build has a skill (gems arrive after maps 1 to
4), so they can only be about the class's weapon, defence and attribute; nobody controls the character in a fight, so a
node is real only if the sheet can show it and the sim produces it; and a phone has no hover, so the picture itself has to
name the places.

**The check:** on any visit, with any build, there is one node a step away that is right to take, and a named place in
view that it leads toward.

---

## 2. The regions: six places, each a shape

Six regions, one a class, in the positions the game already uses (Mystic top, then clockwise Shade, Strider, Reaver,
Vanguard, Zealot). What changes is that each region is a **place with a shape that follows from what lives in it**, and the
six shapes differ. The outline is no longer a circle. The names below are proposed in-game labels, drawn on the map at full
zoom-out; the prose uses plain words.

**The Spire (Mystic, intelligence).** Spells, mana, energy shield. Tall and narrow: a base of mana and shield, a column of
spellcraft (spell damage, cast speed, spell crit), and at the top a fork into **three elemental arms**: cold straight up,
fire leaning toward the Zealot, lightning leaning toward the Shade. The farthest reach of the six. _Why:_ a caster's build is
one element taken deep; three arms make that a visible commitment, and the dark space between them is where you cannot be
two things at once. The Zealot borrows the fire arm's root and the Shade the lightning arm's. Minions and curses are not
here: they sit on the borders (the Cathedral's minion tower, the Knife's curse barb) where two classes can reach them.

**The Knife (Shade, dexterity and intelligence).** Chaos, poison, daggers and claws, critical strikes, traps and mines,
curses. Long and thin: a blade out from the start, daggers and claws on the edge nearest the start, poison and chaos along
the blade, the point far out; two **barbs**: traps and mines hooking off toward the rim, curses hooking up toward the
Spire. _Why:_ the Shade's build is a single sharp line (crit, poison), narrow and deep; the barbs are the narrow things a
Shade may add, and they cost a turn off the blade.

**The Bow (Strider, dexterity).** Bows, projectiles, evasion, attack speed, accuracy, bleed on attacks, physical attacks.
A **wide arc**: the stave runs from the Shade border (bows, accuracy) round to the Reaver border (physical attacks, bleed),
with the string, a straight inner road of evasion and speed, between the start and the arc. The widest region in angle,
moderate in reach. _Why:_ a projectile build is a spread of options, not one line; the arc lets a Strider lean toward chaos
at the Shade end or toward physical and bleed at the Reaver end, and the string is the cheap generic way across.

**The Yard (Reaver, strength and dexterity).** Swords and axes, dual wield, attack speed, block, bleed, leech, fervour
charges. **Compact and dense**: short loops, many links, the shortest reach of the six, the next notable always two or
three steps away. _Why:_ a melee weapon build is a mix of small things (a weapon, a hand style, a defence, a recovery); the
Yard is where decisions are frequent and cheap, and where the two neighbours (the Bow's physical end, the Wall's stun end)
come to shop.

**The Wall (Vanguard, strength).** Life, armour, resistances, maces and two-handers, stun and slams, grit charges and
warcries. **Broad and short**: a rampart of basics running wide along the inner side, with towers rising from it: the mace
tower out to the west, the grit tower down toward the rim. _Why:_ the Vanguard's build is a wide base with one or two tall
commitments; broad means the basics are cheap and many, and the towers are where a Vanguard decides what kind of
Vanguard it is.

**The Cathedral (Zealot, strength and intelligence).** Block and shields, energy shield with armour, resistances, auras,
minions, sceptres and staves, fire and elemental attacks. **Two towers and a nave**: the nave (block and shields, then
sceptres and staves) is the home's continuation; the aura-and-minion tower rises toward the Spire; the fire-and-
elemental-attack tower runs out toward the Wall past the sceptres. _Why:_ the Zealot is the class with two different
futures, a summoner who buffs and an elemental striker, and the towers make that the first real decision a Zealot meets.
Staves have no class of their own (no kit starts with one, A1) and live here, where the Spire can reach them.

**The centre.** A plain ring road inside the six starts, with nothing inside it. **A start is never on the ring**: the ring
runs beside the starts and each class joins it at the attribute junction two steps out of its home (a path never passes
through a start, `pathTo`; the round-1 playtest found what happens when a tree forgets that). Its nodes are generic (life,
resistances, movement speed) and it is the cheap crossing between neighbours (five to seven nodes from junction to
junction). No clusters, no keystones in the middle: both playtest rounds found a middle that gave nothing, and an honest
answer is a road, drawn dark, that _is_ the moat the first ten points cross outward from.

**The check:** a reviewer given the whole-tree picture with the names covered can say which region is which and describe
each in a phrase; the six regions' reach differs by at least ±25% and no two have the same silhouette.

---

## 3. Starting areas: the home

Every class has a **home** of about fourteen nodes, and the first four points cannot be wrong:

1. From the start, a **chain of two**: the class's defence (life for the Vanguard, energy shield for the Mystic...), then
   a +10 node of the class attribute, which is also the junction to the centre ring.
2. At step three, the **signature notable**: the class in one node, its weapon's basic included (the Vanguard's: life,
   melee physical damage and strength; the Strider's: projectile damage, evasion and dexterity; the Mystic's: spell
   damage, mana and intelligence). PoE puts its first notable at exactly three steps from every start; so does this.
3. From the signature, **two ways out, to different things**, each through a small "porch" cluster that announces the area
   beyond: for the Vanguard, one porch toward life and armour (the rampart), one toward the maces. The porches are the
   first real choice, at point five or six, and the choice is between named places, never between two roads of the same
   stuff.
4. The first keystone is 10 to 14 steps from the start, at the near end of the region's first area.

Everything in the home is generic for the class: no damage type, no skill type, no condition. The hybrid classes' homes
are the same size as the pure ones' (PoE's 3-node vs 9-node asymmetry is a lever kept for later if a class needs it).

**The check:** a table of each class's first fifteen steps, printed by the audit: the chain, the signature, the two porches
and where they lead, and the steps to the first keystone.

---

## 4. Highways

A road is a string of plain nodes between places. Its rules:

- **Junctions are +10 attribute nodes** of the region's attribute (its hybrids' at the borders). They are the plainest
  nodes in the tree and they sit where the roads fork, as PoE's do (its 220 attribute nodes have a mean degree of 3.85).
- **Road nodes between junctions** are small nodes from the region's generic pool: life, energy shield, armour, evasion,
  mana, resistances, regeneration, movement speed. Never a weapon, a skill type, a damage type or a condition.
- **Runs are short**: one to three nodes between two junctions, never more than four.
- **Every fork is between two named areas.** No fork offers two roads of the same stuff; the brief's sketch lists every
  fork, and a fork the sketch does not name is a bug.
- **Share**: about a fifth of all nodes are road nodes (PoE: 19%), and a full build spends about 30% of its points on them
  (PoE: 29 to 43%; the low end, because travel is the cost players resent in every game studied).
- **Crossings**: the centre ring between neighbouring starts (cheap), and **one bridge per neighbouring pair** half way out,
  between the two areas that make sense together (the Spire's lightning arm and the Knife's curses; the Bow's physical end
  and the Yard; the Wall's resistances and the Cathedral's fire tower...). None at the rim: the keystones there are meant
  to be dear from another region.

**The check:** road share, longest bare run, the list of forks with the two areas each one offers, crossings per
neighbouring pair, and the road tax of the intended-cost builds (section 11).

---

## 5. Clusters and notables

- **A cluster is one idea.** Every small node in a cluster carries its notable's keyword (PoE: 100%); a cluster is
  guessable from one word at phone zoom.
- **Sizes say cost.** Near the home, clusters of three or four (one notable, two or three smalls); in an area, four or
  five; **one wheel per area** of six to eight nodes with two or three notables, the landmark the area is named by; a
  **spur** of three small nodes and a keystone. Unequal on purpose: a player learns that a big ring is a big commitment.
- **One way in** for three clusters in four; wheels can be passed through (the road enters one side and leaves the other,
  taking the wheel's own nodes, which is the price of the shortcut).
- **A notable is worth three to five small nodes** of its own stat (PoE's matched median is 4.9×), two steps off the road,
  four to six steps from the next notable. One **strength table** prices every node: a unit is the median small node of
  that stat; a notable is at least three units, a wheel notable four to six; lines no small node gives (a maximum charge,
  a mechanic) are hand-valued in the table with a comment. The table is data and the tests read it.
- **Small nodes of one stat give one value** across the tree (no four sizes of life node).

**The check:** the strength table, the audit's weakest-notable list, cluster size distribution by distance from the home,
and the share of clusters with one entrance.

---

## 6. Keystones and the late build

**Placement.** Twenty-seven keystones, each at the end of a spur at the far edge of the area it belongs to (PoE: 17 of 28
in the outer third, 26 of 28 dead ends one step off a junction): four to six a region, the nearest 10 to 14 steps from the
start, the farthest 30 or more. Two sit on borders where both neighbours can reach them (Searing Avatar at the Cathedral's
fire tower tip, near the Spire's fire arm; Idle Hands on the Wall–Cathedral crossing). The sketch places all 27.

**Trades, written on the node.** Four in five keystones carry a cost the sheet can show: a stat that goes down, a thing you
can no longer do. The 22 that already are trades stay. The five buffs: Pain Conduit and Mind Bulwark are conditional and
keep their shape (PoE keeps three pure buffs of 28 too); **Strongarm and Spellslip get a cost** (proposed: Strongarm,
strength's melee bonus also applies to projectile attacks, _dexterity gives no evasion_; Spellslip, 30% chance to dodge
spell hits, _30% less energy shield_); Volatile Servants stays a conditional buff. The two half-dead halves: **Wound Dance**
loses "no extra damage against moving targets" (nobody can act on it) for a sheet-visible cost (_bleeds deal 50% less
damage_, the reference's own figure; eight stacks at half damage is still a trade the table can price); **Close Quarters** keeps its distance rule because the Strategy tab's spacing (hold, close in, kite) _is_ the
player's hand on it, and its card says so.

**The late build.** With 90 to 123 points a build is choosing between a second keystone (its own region's far one, or a
neighbour's at a bridge), a crossing into a neighbour's area for a stat its own region does not sell, and finishing the
wheel it started. The tree makes all three real: the far keystones are 30+ steps and worth it; every bridge leads to an
area the neighbour needs (section 11's grid says which); and a wheel's third notable is its best.

**A hypothesis, asked rather than decided:** Grim Dawn's one idea that fits an auto-battler better than Grim Dawn is a
keystone that is a **proc bound to the main skill** ("every fourth hit with your main skill also casts X"; "on a critical
strike, 20% chance to ..."): the sim already chooses the skill, so the binding needs no player timing. It is engine work (a
proc system on hit, crit, kill and hit-taken events; `buffOn.*` and `recover.*` are the nearest things that exist), not a
stat, so it is outside what was agreed on 2026-10-19 and is an open question (section 12).

**The check:** keystone steps from each start (nearest, median, farthest); the share with a written cost; the last 30
points of each intended-cost build, on paper.

---

## 7. Attributes

In Bob an attribute does two things: a small direct bonus (strength +0.5 life and 0.2% melee physical per point; dexterity
+2 accuracy and 0.2% evasion; intelligence +0.5 mana and 0.2% energy shield) and **gating gear and gem levels**, with
PoE's requirement numbers against a start of 32 in the main attribute and 14 in the others (A3 §6): a level-60 bow wants
212 dexterity, a level-20 gem 98 of its attribute. Attributes do not grow with level; the tree and gear are the only sources.

- **Supply**: attribute nodes are 12 to 15% of the tree (PoE: 13.6%), all at junctions, +10 each. A build that stays in
  its own region passes about one junction in five nodes, so by 60 points it has about +120 of its attribute on its natural
  path without walking for it.
- **Off attribute**: from a pure start the first +30 of an off attribute costs 8 to 10 steps (PoE: 8 to 11), which is the
  price that keeps a class in its corner; a hybrid pays 4 to 6 for its third attribute.
- **A few notables pay at a threshold** (hypothesis, cheap in the engine: `per` with a cap): "+X; and +Y while you have
  150 strength", so that attribute travel is sometimes a choice rather than a toll (Diablo 4's lesson).
- The gear requirement scale is a knob (`REQUIREMENT_SCALE`, 1.0 today) and a question for the user (section 12): the tree
  should not be made of attribute nodes to pay for it.

**The check:** attribute node share by region; steps from each start to +30 of each off attribute; the attribute total on
the intended-cost builds at 30, 60 and 123 points.

---

## 8. Node types

**Keep:** small, notable, keystone, attribute (travel) and start. Five kinds, one shape each, one colour rule (colour says
what a node gives; shape says its rank), is the vocabulary discipline Diablo 4 gets its legibility from.

**Add, cheap:** nothing new in kind. New notables and keystones for the gaps the playtests found, written from the stats
the engine already has and the tree never used (A2 §4, bucket A: life on hit, projectiles and pierce, stun, area, deploy
and minion counts, skill duration, "recently" conditions, charge gains, ailment speed and duration). Threshold notables
(section 7) if the user agrees.

**Considered and declined for now, with the reason:**

| Type                                    | Why not now                                                                                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Masteries (a pick per cluster)          | A picker and ~300 lines of content; the decisions it adds can wait until the tree's own decisions are right.                                                                                 |
| Jewel sockets                           | An item system, not a tree feature; the plan's default.                                                                                                                                      |
| Ranked nodes (one node, several points) | Fewer taps on a phone, but it changes what the tree is (depth instead of position) and it is what Last Epoch does; Bob's tree is a map. Revisit if the phone pass finds tapping the problem. |
| Points-in-region gates for keystones    | Distance already does the job in a map; a counter would be a second rule for the same thing.                                                                                                 |
| Proc keystones                          | Engine work; asked in section 12.                                                                                                                                                            |

**New engine stats a theme clearly needs** (A2 §4, bucket B, each about a day): warcry duration and buff effect (for the
Wall's grit-and-warcries area), trap trigger area and mine detonation speed (the Knife's barb), minion accuracy and speed
split (the Cathedral's minion tower), a cap on `per` (threshold notables). Nothing from bucket C (poison spread, explode on
kill, blind and maim) is needed for this tree.

**The check:** the kinds of node in the tree are exactly five; every new node's stats are read by the sheet and obeyed by
the sim (`treeStats.test.ts` extended).

---

## 9. Numbers: the size falls out

Counted from what the regions above must supply, not chosen first.

| Part                         | Arithmetic                                                                                                                                                                                            | Nodes           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Homes                        | 6 classes × 14                                                                                                                                                                                        | 84              |
| Archetype clusters           | ~32 axis values with a home (9 weapons, 5 damage types, 4 sources, 4 deliveries, 6 ailments, auras, curses, conversion, penetration...) × 4 clusters each (3 at home, 1 with a neighbour) × 4.4 nodes | 563             |
| Generic clusters             | ~11 generic values (crit, attack speed, cast speed, accuracy, area, leech, block, charges, flasks, duration, stun) × 3 regions × 4 nodes                                                              | 132             |
| Keystone spurs               | 27 × 4                                                                                                                                                                                                | 108             |
| Non-road total               |                                                                                                                                                                                                       | 887             |
| Roads at a fifth of the tree | 887 ÷ 0.8 − 887                                                                                                                                                                                       | 222             |
| **Total**                    |                                                                                                                                                                                                       | **about 1,100** |

Sensitivity: one cluster more or less per archetype value moves the total by about 175, so the honest range is **950 to
1,300**; the current tree has 2,618. A 123-point build takes about 11% of it (PoE: 7.4%; Grim Dawn: 10%). Notables: about
210 (161 clusters, a second or third notable on each of 21 wheels, six signatures and twelve porches: one per 5 or 6 nodes;
PoE one per 4.5, Diablo 4 one per 11); keystones 27 (2.5%).

Why smaller is right here, not only cheaper: a phone shows fewer nodes legibly; a shorter tree has shorter roads (section 4's
30% road tax needs it); and the supply rule (section 11) is about _comparable_ supply per axis value, which a tree of this
size can give without padding.

**The check:** the counts, printed; a build's share of the tree.

---

## 10. Communication and look

What a player must be able to do on a phone without hover: tell the regions apart at full zoom-out; find the area they
want by name; see what a keystone does before buying it; see the cost of a far node; find a stat by word.

- **The silhouette is the first map**: six shapes, six tints, the names of the regions drawn large at full zoom-out
  (theme names, not attribute words).
- **Area names drawn faintly behind their clusters** at middle zoom, as Grim Dawn's constellation names are: the second
  map. They are the only labels at that zoom; small nodes are never labelled.
- **Colour says what a node gives** (the 21 tones stay), **shape says its rank** (the five kinds), an **emblem on every
  notable and keystone** (exists).
- **The keystone's card on tap**, the **path preview with its cost** and the **search** exist and stay.
- **Dark space is structure**: the moat inside the centre ring, the gaps between the Spire's arms, the space between a
  region's areas. Nothing is drawn there.
- What the tree screen must gain (handed to Phase D): a background per region in its own shape (the six equal wedges go),
  region names as themes, area labels at middle zoom, a legend on phones.

**The check:** the reviewer rubric (E2), run on each region: name the theme from the picture; find the keystones; point
to a stretch with no decision; say where the eye lands.

---

## 11. Balance: supply, not outcomes

**The strength table** (section 5) prices every node in small nodes.

**The supply rule.** For each axis a build is made of (A1), every value a start is meant to reach can buy comparable power
per point from that start. The grid below is the locality decision made explicit: **home** = the first cluster of it within
12 points of the start, **near** = within 13 to 22, **far** = 23 or more (a walk), **—** = not sold to that start on purpose.
Comparable means: among the values marked the same for a start, the cheapest 20 points' worth of each is within 20% of
the others'.

Every cell was walked on the sketch: "near" means the map as drawn gets there in 13 to 22 steps, not that it ought to.

| Value                                            | Mystic                   | Shade                          | Strider                  | Reaver                   | Vanguard               | Zealot                   |
| ------------------------------------------------ | ------------------------ | ------------------------------ | ------------------------ | ------------------------ | ---------------------- | ------------------------ |
| physical                                         | far                      | near                           | home                     | home                     | home                   | near                     |
| fire                                             | home (arm)               | far                            | near (elemental attacks) | near (elemental attacks) | near (Cathedral tower) | home                     |
| cold                                             | home (arm)               | far                            | near (elemental attacks) | near (elemental attacks) | far                    | far                      |
| lightning                                        | home (arm)               | near (arm root, by the bridge) | near (elemental attacks) | near (elemental attacks) | far                    | near (elemental attacks) |
| chaos                                            | far                      | home                           | near                     | far                      | far                    | far                      |
| attacks                                          | far                      | home                           | home                     | home                     | home                   | home                     |
| spells                                           | home                     | near                           | far                      | far                      | far                    | home                     |
| minions                                          | near (border)            | far                            | far                      | far                      | far                    | home                     |
| totems                                           | far                      | far                            | far                      | far                      | home                   | home                     |
| traps and mines                                  | far                      | home                           | near                     | far                      | far                    | far                      |
| melee                                            | far                      | home                           | far                      | home                     | home                   | home                     |
| projectiles                                      | near (spell projectiles) | near                           | home                     | far                      | far                    | far                      |
| area                                             | home                     | far                            | far                      | far                      | home (slams)           | home                     |
| bleed                                            | far                      | far                            | home                     | home                     | near                   | far                      |
| poison                                           | far                      | home                           | near                     | far                      | far                    | far                      |
| ignite                                           | near                     | far                            | far                      | far                      | far                    | home                     |
| life                                             | far                      | far                            | home                     | home                     | home                   | near                     |
| energy shield                                    | home                     | home                           | far                      | far                      | far                    | home                     |
| armour                                           | far                      | far                            | far                      | near                     | home                   | home                     |
| evasion                                          | far                      | home                           | home                     | near                     | far                    | far                      |
| block                                            | far                      | far                            | far                      | home                     | near                   | home                     |
| auras                                            | near                     | far                            | far                      | far                      | far                    | home                     |
| curses                                           | near (border)            | home                           | far                      | far                      | far                    | far                      |
| crit                                             | home                     | home                           | near                     | near                     | far                    | near                     |
| **weapons** (attack and weapon are one axis, A1) |                          |                                |                          |                          |                        |                          |
| sword                                            | far                      | far                            | near                     | home                     | near                   | far                      |
| axe                                              | far                      | far                            | far                      | home                     | home (with the maces)  | far                      |
| mace                                             | far                      | far                            | far                      | near                     | home                   | near                     |
| sceptre                                          | near                     | far                            | far                      | far                      | far                    | home                     |
| dagger                                           | far                      | home                           | near                     | far                      | far                    | far                      |
| claw                                             | far                      | home                           | near                     | far                      | far                    | far                      |
| wand                                             | home (spellcraft)        | near                           | far                      | far                      | far                    | far                      |
| staff                                            | near                     | far                            | far                      | far                      | far                    | home                     |
| bow                                              | far                      | near                           | home                     | far                      | far                    | far                      |
| two-hand                                         | far                      | far                            | near (bows)              | near                     | home                   | far                      |
| dual wield                                       | far                      | home (two daggers)             | near                     | home                     | far                    | far                      |
| shield                                           | far                      | far                            | far                      | home                     | near                   | home                     |

Elements for attackers: the Bow and the Yard each hold one "elemental damage with attacks" cluster so that a fire bow is
_near_, not _far_; the Spire's arms are for casters. Three weapons have no class kit (axe, claw, staff): their homes are
the Wall's mace tower, the Knife's edge and the Cathedral's nave.

**The intended-cost table.** Twelve builds across the axes, four against the grain. The numbers are targets the built tree
is held to; the user reads them and disagrees with them.

| #   | Build                                               | Points to its basics (defence, weapon or source, attribute) | First keystone (steps)                    | First must-have outside home (steps)                   |
| --- | --------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| 1   | Vanguard, two-hand mace, physical, life and armour  | 8                                                           | Rooted Stance 12                          | maces 10                                               |
| 2   | Strider, bow, physical and bleed, evasion           | 8                                                           | Steady Draw 12                            | bows 9                                                 |
| 3   | Mystic, cold spells, energy shield                  | 8                                                           | Fever Pitch 24 (the tip); Mind Bulwark 11 | cold arm 20                                            |
| 4   | Reaver, dual swords, bleed, block                   | 8                                                           | Shieldwall 13                             | swords 9                                               |
| 5   | Zealot, minions and auras, block                    | 9                                                           | Lone Vow 14                               | minions 15                                             |
| 6   | Shade, daggers, poison, crit                        | 8                                                           | Cruel Agony 28; Nimble Gambit 10          | poison 13                                              |
| 7   | Shade, lightning traps                              | 8                                                           | Spellslip 22                              | traps 16                                               |
| 8   | Zealot, sceptre fire melee                          | 9                                                           | Searing Avatar 26                         | fire attacks 14                                        |
| 9   | Strider, fire bow (against the grain)               | 8                                                           | Steady Draw 12                            | elemental attacks 15; fire (Spire via Knife bridge) 30 |
| 10  | Vanguard, fire spells (against the grain)           | 8                                                           | Searing Avatar 24                         | spell damage (Cathedral fire tower) 20                 |
| 11  | Mystic, minions (against the grain)                 | 8                                                           | Volatile Servants 20                      | minions (Cathedral border) 14                          |
| 12  | Reaver, evasion and projectiles (against the grain) | 8                                                           | Plated Hide 16                            | the Bow's physical end 12                              |

**The check:** the supply audit (E1) prints the grid with the real steps and the cheapest-20-points figures beside the
targets; a comparable pair that differs by more than 20% is a finding, and the fix is in the tree.

---

## 12. Open questions for the user

Each with the answer I would take by default.

1. **The six shapes and names** (section 2, the picture). Default: as drawn. The thing most worth disagreeing with: is the
   Spire's three-arm fork the Mystic's identity, or should the elements be spread (fire at the Cathedral, cold at the Knife)?
2. **The centre**: a bare ring road and nothing inside. Default: yes. The alternative is PoE's small centre with a few
   generic clusters.
3. **Gear requirements** (section 7): keep `REQUIREMENT_SCALE` at 1.0 and let the tree supply ~+120 own attribute by 60
   points, or lower the scale (0.6 to 0.7) so that attributes are mostly a bonus and the tree needs fewer junctions?
   Default: keep 1.0 for now and revisit with the first supply audit.
4. **Threshold notables** ("and +Y while you have 150 strength"): a day of engine work for a cap on `per`. Default: yes,
   on four to six notables.
5. **Proc keystones bound to the main skill** (section 6): engine work beyond a stat. Default: **no** for this tree; noted
   as the next idea.
6. **Strongarm's and Spellslip's new costs, Wound Dance's rewrite** (section 6). Default: as written.
7. **Size about 1,100** (950 to 1,300), under half of today's. Default: yes.
8. **The four cheap engine stats** (section 8). Default: yes.
9. **Crossings** (section 4): the centre ring plus one bridge per neighbouring pair half way out, and none at the rim.
   On 2026-10-11 you asked for more crossings with some of them dear; this brief has fewer and makes the rim dear by
   having no crossing there at all. Default: as written; the alternative is a third, long crossing per pair near the rim.

---

## 13. The four problems, and what checks each

The user's four problems, none ranked above another, each mapped to the properties that will say whether it improved:

| Problem            | Checked by                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How it looks       | The silhouette test (section 2), the E2 rubric on each region, the whole-tree picture beside today's.                                                         |
| Meaningful choices | The fork list (every fork between two named areas), decisions per 123 points (forks, detours, crossings, keystones), the last 30 points of the twelve builds. |
| Balance            | The strength table, the supply grid with real steps, the intended-cost table against the real costs, the bot's smoke test.                                    |
| Finding your way   | Region and area names on the picture, the first-fifteen-steps table, steps to each area from each start, search.                                              |
