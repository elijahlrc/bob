# C. The design brief: what Bob's passive tree is

Phase C of [PASSIVE-TREE.md](../../PASSIVE-TREE.md), 2026-10-19, **revised the same day after the user's review** (the
decisions are in section 12; the first draft is `C-brief-draft1.md`). Everything below is derived from the constraints
(`A1-axes.md`, `A2-vocabulary.md`, `A3-rules.md`) and the references (`B-comparison.md` and the five game studies); where I
hold a view it is written so that it can be disagreed with, and each item ends with **the check**: the property the
finished tree will be held to. The picture is `C-sketch.png`, drawn by `scripts/tree/sketch.ts` from `C-sketch.json`,
which is the brief's own data: the places, not the nodes.

**The one rule above the others** (the user, on the first draft): the region shapes and names are a frame, not the point.
A good tree is thousands of small decisions made with care: which exact line a node carries, why this link exists and not
that one, what a player holding two points on map 9 sees. Every rule below is a servant of those decisions; where a rule
would make a node or a link worse, the rule loses. The brief therefore has fewer rules than its first draft, and Phase D's
method (hand-written areas, every node and link a written decision) follows from this.

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
fire leaning toward the Zealot, lightning leaning toward the Shade. The farthest reach of the six. _Why:_ the element is a
caster's first real decision and the arms make it visible. But a second element is a cost, never a wall (the first draft
said "you cannot be two things at once"; the user struck it, rightly: PoE's multi-element casters are common and good):
neighbouring arms are joined by a short link a few steps above the fork (cold to fire, cold to lightning), so a two-element
caster pays four to six points for the second arm's first cluster instead of walking back through the fork. The Zealot
borrows the fire arm's root and the Shade the lightning arm's. Minions and curses are not
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

**The centre.** A ring road inside the six starts, with **a few generic clusters hanging off its inner side**: the things
every class may want and no region sells well: the three resistances, movement speed, flask charges and effect, all
attributes, life and mana regeneration. Three or four clusters of three or four nodes, none stronger than a region's, no
keystones. (The first draft had nothing inside the ring; the user asked for the generic nodes, which is also what PoE's
small centre is.) **A start is never on the ring**: the ring runs beside the starts and each class joins it at the
attribute junction two steps out of its home (a path never passes through a start, `pathTo`; the round-1 playtest found
what happens when a tree forgets that). The ring's own nodes are attribute nodes (section 7) and it is the cheap crossing
between neighbours (five to seven nodes from junction to junction). The rest of the middle stays dark: the moat the first
ten points cross outward from.

**The check:** a reviewer given the whole-tree picture with the names covered can say which region is which and describe
each in a phrase; the six regions' reach differs by at least ±25% and no two have the same silhouette.

---

## 3. Starting areas: the home

Every class has a **home** of about a dozen nodes out of its start:

1. From the start, a **chain of two** safe nodes: the class's defence (life for the Vanguard, energy shield for the
   Mystic...), then a node of the class attribute (+20; a hybrid's +10/+10), which is also the junction to the centre ring.
   The first two or three points are spent before the build has a skill, so these cannot be wrong for any build of the
   class; nothing else in the home has to be generic.
2. At step three, the **signature notable**: the class in one node, its weapon's basic included (the Vanguard's: life,
   melee physical damage and strength; the Strider's: projectile damage, evasion and dexterity; the Mystic's: spell
   damage, mana and intelligence). PoE puts its first notable at exactly three steps from every start; so does this.
3. From the signature, **two or three ways out, to different things**, each through a small "porch" cluster that
   announces the area beyond: for the Vanguard, one porch toward life and armour (the rampart), one toward the maces. A
   porch may be specific (a cold porch on the Mystic's) as long as it is optional and another porch serves the class's
   other builds (a fire-and-lightning porch beside it). What a home must not have is one way out, or two ways out to the
   same stuff.
4. The first keystone is 10 to 14 steps from the start, at the near end of the region's first area.

The six homes need not be the same size; a hybrid's may run a node or two longer if its two attributes need it (PoE's
3-node vs 9-node asymmetry).

**The check:** a table of each class's first fifteen steps, printed by the audit: the chain, the signature, the porches
and where they lead, and the steps to the first keystone.

---

## 4. Highways

A road node is a node whose only job is to get somewhere. The rules, cut down from the first draft by the user's review
("don't add filler nodes for no reason"; "don't add random constraints"):

- **A road node is an attribute node, or it does not exist.** Junctions and the few nodes between them are attribute nodes
  of the region's attribute (+20; +10/+10 in a hybrid region; section 7). There is no "generic small" road pool: a node
  that gives life or resistances belongs in a cluster about life or resistances, where taking it is a decision, not in a
  corridor where it is filler.
- **Clusters connect directly** wherever they can: a cluster's edge node links to the next cluster's edge node and the
  player walks from idea to idea. A run of road nodes between two clusters exists only as an intentional cost that the
  area's file writes down ("this area is three points farther from that one because..."). Runs are 0 to 2 nodes; 3 only
  with a written reason.
- **Forks wherever a fork is useful**: inside an area (two variants of one idea: shield or two-hander in a melee area,
  traps or mines, cold or fire), between areas, or between two clusters that belong to no area. The first draft required
  every fork to be between two named areas; the user struck that, and they are right that forks inside an area are the good
  ones.
- **Share**: road nodes about a tenth of the tree (PoE: 19% in runs of 1 to 3; fewer here because clusters touch), and a
  full build spends 15 to 25% of its points on them, almost all of it attribute it needs anyway.
- **Crossings: many, each placed by hand for a cross-region build that is plausibly wanted**, never by rule or at random.
  The centre ring between neighbouring homes (cheap), and **two bridges per neighbouring pair**: one _near_, between the two
  areas closest to the homes, and one _dear_, far out, between the areas a committed build reaches for. A dear bridge is
  deliberately long (the crossing is a trade-off only if staying home is cheaper), but it exists: the first draft had one
  bridge per pair and none at the rim, and the user asked for many more, with intent. The sketch draws all twelve:

| Pair            | Near bridge (areas)                                                                                                                                                    | Serves                                         | Dear bridge (areas)                      | Serves                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Spire–Knife     | spellcraft ↔ curses                                                                                                                                                    | curse casters; crit-spell Shades               | lightning arm ↔ the curse barb's tip     | lightning Shades, lightning traps (through the barb) |
| Knife–Bow       | daggers and claws ↔ bows                                                                                                                                               | dagger Striders; the evasion-and-shield hybrid | poison and chaos ↔ projectiles           | poison and chaos bows                                |
| Bow–Yard        | the physical end's porch junction ↔ dual wield and speed (the Bow's corner nearest the Yard; a bridge from the string itself would cross the road to the physical end) | dual-wield evasion builds; sword Striders      | physical attacks ↔ bleed and leech       | bleed Striders; sword Striders; leech                |
| Yard–Wall       | swords and axes ↔ stun and slams                                                                                                                                       | axe Vanguards; two-hand Reavers                | bleed and leech ↔ grit and warcries      | Blood Rite Reavers; bleed Vanguards                  |
| Wall–Cathedral  | resistances ↔ block and shields (the Wall's resistances sit north of its rampart, on the Cathedral border)                                                             | shield Vanguards; life Zealots                 | resistances ↔ fire and elemental attacks | fire two-handers; Vanguard fire spells               |
| Cathedral–Spire | auras ↔ mana and shield                                                                                                                                                | aura Mystics; shield Zealots; sceptre casters  | minions ↔ the fire arm                   | minion Mystics; fire-caster Zealots                  |

Within the Spire, the inter-arm links (section 2) are crossings of the same kind, for the two-element caster.

**The check:** road share, longest run and its written reason, crossings per pair with their real step costs from both
homes, and the road tax of the intended-cost builds (section 11).

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

Keystones that are **procs bound to the main skill** (Grim Dawn's idea, which fits an auto-battler) are postponed by the
user's decision (section 12): not the core thing to get right now. Noted as the next idea after the tree.

**The check:** keystone steps from each start (nearest, median, farthest); the share with a written cost; the last 30
points of each intended-cost build, on paper.

---

## 7. Attributes

In Bob an attribute does two things: a small direct bonus (strength +0.5 life and 0.2% melee physical per point; dexterity
+2 accuracy and 0.2% evasion; intelligence +0.5 mana and 0.2% energy shield) and **gating gear and gem levels**, with
PoE's requirement numbers against a start of 32 in the main attribute and 14 in the others (A3 §6): a level-60 bow wants
212 dexterity, a level-20 gem 98 of its attribute. Attributes do not grow with level; the tree and gear are the only sources.

**What the old tree supplied, measured** (2026-10-19: the player builds in the rivals table, not the bot's, on the
current tree; the class start of 32/14/14 is not included):

| Build             | Points | From the tree               | Attribute-only nodes |
| ----------------- | ------ | --------------------------- | -------------------- |
| Strider, level 53 | 62     | +300 dex                    | 32%                  |
| Reaver, level 50  | 61     | +110 str, +40 dex           | 20%                  |
| Mystic, level 23  | 24     | +100 int                    | 33%                  |
| Shade, level 23   | 23     | +50 dex, +20 int            | 30%                  |
| Mystic, level 100 | 123    | +290 int, +150 str, +80 dex | 37%                  |
| Zealot, level 100 | 123    | +270 int, +180 str          | 35%                  |

On the shortest routes from each start, the first 20 route nodes carry +55 to +100 of the class attribute. So the old
tree's fault was not too little attribute: a pure class got about +5 of its attribute per point, well over what its gear
asks (the level-60 bow at about map 60, 63 points, asks 212: +180 over the start, under 3 a point), and paid with a third of
its nodes being bare +10 dots. The first draft of this brief planned +120 by 60 points from 12 to 15% of nodes at +10:
fewer dull nodes _and_ too little attribute, which is the divergence the user noticed. What the old tree did get wrong is
the **hybrids**: a hybrid weapon asks both attributes at the full number (a level-60 sword 113/113, a dagger 113/113), so a
Reaver needs about +90 of each by map 60, and the measured Reaver had +110 strength and +40 dexterity at 61 points: its
routes paid one attribute, not two.

The rules, then:

- **Supply about +3 of the class's attributes per point on a natural path**: a pure class +3 of one, a hybrid +1.5 of
  each. A build then meets its own level-60 gear at about 60 points and a level-20 gem of its own attribute (98) by about
  25, without walking for either.
- **Fewer, bigger attribute nodes** (the user's suggestion): junctions and the few road nodes are **+20** of the region's
  attribute, or **+10/+10** in a hybrid region, at 12 to 15% of nodes (PoE: 13.6% at +10; doubling the node is what lets the
  road be short). The signature notable carries +20; a handful of notables carry an attribute line beside their stat, as
  PoE's do (17% of its nodes carry one). The centre's all-attributes cluster is the cheap partial answer for everyone.
- **A hybrid region supplies both of its attributes along every natural path**; the audit checks supply per attribute,
  never summed.
- **Off attribute**: from a pure start the first +40 of an off attribute (two nodes) costs 8 to 10 steps (PoE: 8 to 11
  for +30), the price that keeps a class in its corner; a hybrid pays 4 to 6 for its third attribute.
- The gear requirement scale stays at 1.0 (the user, 2026-10-19). Threshold notables are postponed (section 12).

**The check:** attribute supply _per attribute_ at 20, 40 and 60 points on each start's natural paths, printed by the
audit beside the level-20, 40 and 60 requirements of the class's own weapon and gems; attribute node share by region;
steps from each start to +40 of each off attribute.

---

## 8. Node types

**Keep:** small, notable, keystone, attribute (travel) and start. Five kinds, one shape each, one colour rule (colour says
what a node gives; shape says its rank), is the vocabulary discipline Diablo 4 gets its legibility from.

**Add, cheap:** nothing new in kind. New notables and keystones for the gaps the playtests found, written from the stats
the engine already has and the tree never used (A2 §4, bucket A: life on hit, projectiles and pierce, stun, area, deploy
and minion counts, skill duration, "recently" conditions, charge gains, ailment speed and duration).

**Considered and declined for now, with the reason:**

| Type                                                  | Why not now                                                                                                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Masteries (a pick per cluster)                        | A picker and ~300 lines of content; the decisions it adds can wait until the tree's own decisions are right.                                                                                 |
| Jewel sockets                                         | An item system, not a tree feature; the plan's default.                                                                                                                                      |
| Ranked nodes (one node, several points)               | Fewer taps on a phone, but it changes what the tree is (depth instead of position) and it is what Last Epoch does; Bob's tree is a map. Revisit if the phone pass finds tapping the problem. |
| Points-in-region gates for keystones                  | Distance already does the job in a map; a counter would be a second rule for the same thing.                                                                                                 |
| Threshold notables ("+Y while you have 150 strength") | Postponed by the user (2026-10-19): a good idea, not the core thing to get right now.                                                                                                        |
| Proc keystones bound to the main skill                | Postponed likewise.                                                                                                                                                                          |

**New engine stats** (A2 §4, bucket B): three were proposed for three themed areas (warcry duration and buff effect for
the Wall's grit-and-warcries area; trap trigger area and mine detonation speed for the Knife's barb; minion accuracy and a
split of minion speed for the Cathedral's minion tower). The user left the decision to an investigation of each one's
trade-offs, `D-engine-stats.md` (2026-10-19, read against the engine; the two decisive claims spot-checked). Its findings,
taken as the decision:

- **Warcries: add one stat, `warcryEffect`** (the `auraEffect` pattern; added 2026-10-19 in `calc/character.ts` and
  `sim/utility.ts`, tested in `calc/warcryEffect.test.ts`), so the grit-and-warcries area can sell "warcry buffs are stronger". No duration stat: `skillDuration` tagged `warcry` already lengthens a warcry in the fight,
  and the sheet needs three lines to show it (done with the stat).
- **Traps and mines: nothing new.** A trap lands inside its own trigger radius, so trigger area is invisible; detonation
  speed moves a quarter second of a 0.85 s cycle. The barb has eight sim-real stats to sell already (trap and mine damage,
  area, crit, throwing speed, deploy count, penetration, cost, reservation, chaining and double mines).
- **Minions: nothing new.** Minions never miss (raw hits, no accuracy roll), so accuracy would be new fight behaviour and a
  baseline nerf; the movement half of a speed split has no sheet reader. Fifteen sim-real minion stats exist; the old tree
  used seven.
- **Three dead lines the old tree sold, never to be written again**: `skillDuration` tagged `mine` (a mine's life ignores
  it; one line in `calc/deploy.ts` would make it real, and will be changed if the barb wants the line), `aoe` tagged
  `minion` (splash is a fixed field), `cooldownRecovery` tagged `warcry` (utility cooldowns are never scaled). A2 §4's
  "warcry cooldown recovery: yes/yes" was wrong.

Nothing from bucket C (poison spread, explode on kill, blind and maim) is needed for this tree.

**The check:** the kinds of node in the tree are exactly five; every new node's stats are read by the sheet and obeyed by
the sim (`treeStats.test.ts` extended).

---

## 9. Numbers: the size falls out

Counted from what the regions above must supply, not chosen first. **An estimate, not a target**: the user's rule is that
quality beats count, so a node that makes the tree better is added and one that does not is cut, wherever the total lands.

| Part                         | Arithmetic                                                                                                                                                                                            | Nodes           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Homes                        | 6 classes × 12                                                                                                                                                                                        | 72              |
| Archetype clusters           | ~32 axis values with a home (9 weapons, 5 damage types, 4 sources, 4 deliveries, 6 ailments, auras, curses, conversion, penetration...) × 4 clusters each (3 at home, 1 with a neighbour) × 4.4 nodes | 563             |
| Generic clusters             | ~11 generic values (crit, attack speed, cast speed, accuracy, area, leech, block, charges, flasks, duration, stun) × 3 regions × 4 nodes                                                              | 132             |
| Centre clusters              | 4 × 4                                                                                                                                                                                                 | 16              |
| Keystone spurs               | 27 × 4                                                                                                                                                                                                | 108             |
| Non-road total               |                                                                                                                                                                                                       | 891             |
| Roads at a tenth of the tree | 891 ÷ 0.9 − 891                                                                                                                                                                                       | 99              |
| **Total**                    |                                                                                                                                                                                                       | **about 1,000** |

Sensitivity: one cluster more or less per archetype value moves the total by about 175, so the honest range is **850 to
1,200**; the current tree has 2,618. A 123-point build takes about 12% of it (PoE: 7.4%; Grim Dawn: 10%). Notables: about
210 (161 clusters, a second or third notable on each of 21 wheels, six signatures and twelve porches: one per 5 nodes; PoE
one per 4.5, Diablo 4 one per 11); keystones 27.

Why smaller is right here, not only cheaper: a phone shows fewer nodes legibly; a tree whose clusters touch has few road
nodes; and the supply rule (section 11) is about _comparable_ supply per axis value, which a tree of this size can give
without padding.

**The check:** the counts, printed, for information.

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
_near_, not _far_; the Spire's arms are for casters, and a caster's second element is _near_ too (four to six points past
the first arm's first cluster, by the inter-arm link). Three weapons have no class kit (axe, claw, staff): their homes are
the Wall's mace tower, the Knife's edge and the Cathedral's nave. The near bridges of section 4 are what makes the "near"
cells of a neighbour's stat true; the audit measures them rather than trusting the table.

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

## 12. Decisions from the user's review (2026-10-19)

The first draft asked nine questions; the answers, and what they changed:

1. **Shapes and names**: as drawn. (With the standing rule that they are a frame: a good tree can be built within most of
   them, and they lose where they make a node or a link worse.)
2. **The centre**: generic clusters inside the ring for what everyone may want (section 2), not a bare road.
3. **Gear requirements**: unchanged. The divergence was in the brief's arithmetic, not the old tree's supply; measured and
   fixed in section 7 (fewer, bigger attribute nodes; hybrids get both attributes).
4. **Threshold notables**: postponed.
5. **Proc keystones**: postponed.
6. **Strongarm's and Spellslip's costs, Wound Dance's rewrite**: as written.
7. **Size**: about 1,000 as the arithmetic falls; quality over count, in either direction.
8. **The cheap engine stats**: left to the investigation (`D-engine-stats.md`), one decision per stat.
9. **Crossings**: many more, each placed with intent for a plausible cross-region build (section 4's table), none by rule
   or at random.

And the three corrections to the text: a second element is a cost, not a wall (section 2); a home may have specific
porches as long as they are optional (section 3); no filler road nodes and no rule against forks inside an area (section 4).

---

## 13. The four problems, and what checks each

The user's four problems, none ranked above another, each mapped to the properties that will say whether it improved:

| Problem            | Checked by                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| How it looks       | The silhouette test (section 2), the E2 rubric on each region, the whole-tree picture beside today's.                                                                                                  |
| Meaningful choices | Decisions per 20 points along each start's natural paths (forks between different things, detours for a notable, crossings, keystones), printed by the audit; the last 30 points of the twelve builds. |
| Balance            | The strength table, the supply grid with real steps, the intended-cost table against the real costs, the bot's smoke test.                                                                             |
| Finding your way   | Region and area names on the picture, the first-fifteen-steps table, steps to each area from each start, search.                                                                                       |
