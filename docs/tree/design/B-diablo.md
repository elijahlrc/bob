# B: Diablo (2, 3, 4) as a reference for Bob's tree

Phase B of [PASSIVE-TREE.md](../../PASSIVE-TREE.md) section 2, written 2026-10-19 from web sources only. Each number is
**sourced** (page named in the row), **recalled**, or **derived** (arithmetic on sourced numbers).

**Version baseline.** Diablo 4 changed these systems at every expansion: launch (June 2023), Vessel of Hatred / 2.0
(October 2024, Season 6), Season 7 (2025), Season 11 / 2.5.0 (December 2025), Lord of Hatred (2026). The baseline is
the **launch system**, which most guides describe and which the task's own numbers belong to; later values sit in a
second column where they differ. The board's _shape_ (four node ranks, glyph radius, edge gates, rotation, one
legendary per board) has not changed; only counts and caps have.

**IP line.** Properties and rates only. One rare and one legendary node are described by their structure, never by
name or text. Nothing here is a layout.

---

## D2 and D3 in a paragraph each

**Diablo 2** has no passive tree: three tabs of ten _skills_ per class, thirty in all, unlocked by character level in
tiers at 1/6/12/18/24/30, with prerequisite arrows, up to 20 hard points per skill, one point per level plus quest
points (sourced, classic.battle.net skill basics); 98 level points + 12 quest points = 110 (derived). Patch 1.10
added **synergies**: hard points in skill A add a flat % to skill B (+14% per point one way, +16% the other in the
fire-bolt/fireball pair; sourced, Fextralife D2 Fire Ball). That is the only tree-like decision D2 has, and it is why
D2 builds are "20/20/20" specialisations.

**Diablo 3** removed the tree: six skills with runes, four passives, and after level 70 **Paragon points**, one per
paragon level, rotating through four tabs (Core, Offense, Defense, Utility) of four stats each, every stat capped at 50
except the primary stat and Vitality (sourced, diablowiki Paragon). No positions, no paths, no decisions beyond order:
the counter-example that shows what a tree is _for_.

---

## 1. Starting areas

| Fact                      | Value                                                                                                                                                     | Status                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Skill tree: first cluster | Basic, 0 points; Core opens at 2 points spent; class clusters at 6, 11, 16                                                                                | sourced (Prima skill-tree explainer)  |
| Skill tree: ways out      | one tree per class; the branches are _which_ skill, not which direction                                                                                   | recalled                              |
| Paragon starter board     | 56 stat nodes (34 normal, 18 magic, 4 rare) plus start, gate and glyph socket; same census for every class, rares and magics placed differently per class | sourced (Wowhead class paragon guide) |
| Starter board: ways out   | **one** gate, at the top; at least two rare nodes lie on the way                                                                                          | sourced (Wowhead)                     |
| First ~10 points buy      | normals at +5 attribute, a magic node or two, the first rare                                                                                              | derived                               |

The starter board is a tutorial: no legendary, one exit, four rares to teach the threshold pattern, one socket to teach
radius. Branching begins at the first gate.

> **Suggestion.** A start region of ~50 nodes with one or two exits and three or four notables reads on a phone because
> it is small and has one job. Bob's six class starts could each be that size, with the class's basics (attribute,
> weapon, defence) as its notable-grade nodes.

## 2. Highways

D4's Paragon has no separate highway: the whole board is travel with ornaments.

| Fact                            | Value                                                                                                                | Status                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Normal node                     | +5 to one attribute, nothing else                                                                                    | sourced (Maxroll boards; Blizzard Dec 2021 update)              |
| Share of normals, starter board | 34 of 56 = 61%                                                                                                       | derived                                                         |
| Magic node                      | +7 attribute (Wowhead 2023) or one small stat, e.g. +7% core skill damage (Maxroll)                                  | sourced                                                         |
| Magic around a rare             | "always 5 magic nodes surrounding any rare node"                                                                     | sourced (Maxroll)                                               |
| Gate                            | +5 all attributes; one at the centre of each edge of a class board (4), one on the starter                           | sourced (Maxroll, Wowhead)                                      |
| Gate to legendary               | legendary at the centre, gate at the edge centre: half a board side; board width recalled at ~21 tiles, so ~10 steps | recalled                                                        |
| Rare to rare                    | 4 to 6 rares on a class board of ~60 to 80 usable nodes: about 5 to 10 steps apart                                   | derived (Fextralife per-board rare lists) / recalled board size |
| Points to buy a whole board     | starter 56; class board ~60 to 80                                                                                    | sourced / recalled                                              |

Travel is never dead because every +5 feeds the class's damage stat, the rare thresholds and the glyph's per-5
scaling. Gates are the highways _between_ boards: one tile, one decision, and the next board rotates so its legendary
or socket faces the gate.

> **Suggestion.** Travel nodes are cheap to read (one number, one colour) and worth taking only because _other_ nodes
> read them. A Bob highway of +attribute nodes needs something that counts attributes: gear requirements and a few
> threshold notables would do it.

## 3. Clusters

| Fact            | Value                                                                                                                                               | Status                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Rares per board | starter 4; Barbarian class boards 3, 4, 4, 5, 5, 5, 6, 6, 6                                                                                         | sourced (Wowhead; Fextralife Paragon Boards)                |
| Magic per rare  | 5 around each rare; starter 18 / 4 = 4.5                                                                                                            | sourced (Maxroll) / derived                                 |
| Glyph radius    | launch 3 (2 in two older guides: afkgaming, Mobalytics), 4 at glyph level 15; VoH 4 to 5 on going legendary; Lord of Hatred 3/4/5 at levels 1/25/51 | sourced (Maxroll glyphs, both versions; Fextralife Paragon) |
| Glyph footprint | radius 3 assumed Chebyshev (a 7x7 square, as the launch UI drew it)                                                                                 | recalled                                                    |
| Glyph bonus     | "+X% per 5 attribute allocated in range", plus an extra bonus at an in-range threshold (25 in Maxroll's example)                                    | sourced (Maxroll)                                           |

Two kinds of cluster: the authored flower (a yellow rare with five blue petals) and the player-defined glyph square,
in which the player chooses which normals to light because each lit node of the right attribute feeds the glyph.

> **Suggestion.** The flower (notable plus a ring of agreeing smalls, ~5 per notable) is the readable unit. The glyph
> radius needs a grid; the free-form equivalent is a notable that scales with the smalls allocated adjacent to it.

## 4. Notables and keystones

| Fact                     | Value                                                                                                                                                                                             | Status                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Rare node pattern        | two stats at a base value (e.g. +10% of a damage kind and +10 attribute, or +4% life and +20 armour); one doubles when a named attribute total meets a threshold                                  | sourced (Fextralife)             |
| Rare thresholds          | 160 to 360 of an attribute; rises with each gate between the node and the starter                                                                                                                 | sourced (Fextralife)             |
| Rare vs normal           | about 4 to 6 normals' worth (guides path 3 to 5 nodes out of the way for one)                                                                                                                     | derived / recalled               |
| Legendary node           | one per class board, at the centre, none on the starter                                                                                                                                           | sourced (Blizzard 2021; Maxroll) |
| Legendary pattern        | a conditional multiplier or mechanic: "30% increased damage for 5 s after spending 75 resource" (Maxroll's example); "every N s the next skill overpowers"; resource spent converted to a defence | sourced (Maxroll; Fextralife)    |
| Legendary vs rare        | multiplicative where rares are additive: several rares' worth; the ~10-step walk is the price                                                                                                     | sourced (Maxroll) / recalled     |
| Key passive (skill tree) | last cluster at 33 points; one active at a time; a build-defining conditional                                                                                                                     | sourced (Prima) / recalled       |
| D2 "keystones"           | none as nodes; the level-30 skills and synergy chains play the role                                                                                                                               | sourced (battle.net; Fextralife) |

The legendary is a trade by _position_, not by text: it sits at the centre, the socket elsewhere, and with ~45 to 60
points per board a build cannot have the legendary, the socket and every rare ("legendary nodes and glyph sockets are
usually far apart, so you often choose one"; sourced, arzyelbuilds). D4 legendaries are buffs; the trade is opportunity
cost.

> **Suggestion.** A keystone as a pure buff works if the walk is long enough to be a decision (~10 steps from a
> region's entry) and something else in the region competes for the points. D4 shows the positional trade is enough for
> legibility; the cost is no node the player fears.

## 5. Decisions

| Decision                                                                                     | Per full build                                                                                              | Status                                                                                                                                        |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill tree: cluster gates at 2, 6, 11, 16, 23, 33 points spent                               | 6                                                                                                           | sourced (Prima; Maxroll launch guide). Season 11 cut the first gates to 1 and 2; Lord of Hatred uses level gates 1/3/4/8/13/19 (Maxroll 2026) |
| Skill tree: which skill, which of two upgrade forks per skill                                | ~6 x 2                                                                                                      | sourced (Maxroll)                                                                                                                             |
| Skill tree: one ultimate, one key passive                                                    | 2                                                                                                           | sourced / recalled                                                                                                                            |
| Paragon: which board next                                                                    | 8 class boards at launch (9 after VoH); Season 6 caps a character at 5 boards incl. the starter, so 4 picks | sourced (Wowhead; Maxroll; Fextralife)                                                                                                        |
| Paragon: rotation (90 degree steps; no attaching if the exit leads back into a placed board) | 4                                                                                                           | sourced (Maxroll)                                                                                                                             |
| Paragon: which of 3 exits to leave by                                                        | 4                                                                                                           | sourced (Maxroll)                                                                                                                             |
| Paragon: which glyph in which socket; which smalls to light in its radius                    | up to 5                                                                                                     | sourced (Maxroll)                                                                                                                             |
| Paragon: detour for a rare or the legendary                                                  | 4 to 6 + 1 per board                                                                                        | sourced                                                                                                                                       |

| Budget         | Launch                                    | VoH (2.0)                           | Lord of Hatred                        | Status                                        |
| -------------- | ----------------------------------------- | ----------------------------------- | ------------------------------------- | --------------------------------------------- |
| Skill points   | 48 levels + 10 renown = 58                | 59 + 12 = 71                        | 68 + 12 = 80 (Fextralife: "up to 83") | sourced (wepc/siliconera; game8; Maxroll)     |
| Paragon points | 4/level from 50 to 100 = 200, + 20 renown | 300 cap; 328 with renown and altars | up to 342                             | sourced (Wowhead 2023; arzyelbuilds; Maxroll) |

A full launch build meets about 20 skill-tree decisions and about 40 to 50 on the board: **~60 to 70 decisions over
~280 points**, the board choices and rotations large, the rare detours small.

> **Suggestion.** Bob's 123 points are a starter board plus one class board (56 + ~70). D4 would give that budget ~15
> decisions. Bob wants more decisions per point, which argues for smaller clusters and shorter stretches than D4's.

## 6. Locality

| Fact              | Value                                                                                                                                            | Status               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| Boards per class  | starter + 8 at launch; + 1 in VoH (Fextralife lists Barbarian at 10 incl. starter)                                                               | sourced              |
| Board themes      | Sorcerer: 2 fire, 2 frost, 2 lightning, 2 mixed (Wowhead 2023); Barbarian: bleed, berserk, overpower, fortify, weapon swap, crit... (Fextralife) | sourced              |
| How a theme shows | the legendary states it; the 4 to 6 rares repeat it; the magics are generic (resist, armour, attribute)                                          | sourced (Fextralife) |
| Mixing            | boards are per class; a build mixes only by which 4 boards it attaches and in what order                                                         | sourced              |
| Stats everywhere  | the four attributes (every normal), resistances and armour (magics on every board), +4% life and +20 armour rares on most boards                 | sourced (Fextralife) |

> **Suggestion.** Per-class boards do not transfer to one shared tree, but the rule does: a region is one theme, its
> notables all say it, its smalls are the shared stats (life, armour, resistances, attributes) that D4 puts everywhere.

## 7. Attributes

| Attribute    | Universal effect per point                                            | Status                                   |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------- |
| Strength     | +1 armour                                                             | sourced (gamerguides, ggrecon agree)     |
| Intelligence | +0.05% all resistances (ggrecon, most sources) vs +0.5% (gamerguides) | conflicting; 0.05% is the repeated value |
| Willpower    | +0.1% healing received, +0.25% overpower damage                       | sourced (both)                           |
| Dexterity    | +0.025% dodge (ggrecon) vs +0.01% (gamerguides)                       | conflicting                              |

Class effects: the class's **main** attribute gives +0.1% skill damage (Barbarian Str, Rogue Dex, Sorcerer and
Necromancer Int, Druid Will); a second gives +0.02% crit chance; a third gives resource generation (+0.03% gamerguides
vs +0.1% ggrecon); the fourth nothing class-specific (sourced, gamerguides table).

On the board every normal is +5 of one attribute and every gate +5 of all four, so a 200-point build picks up ~120
normals x 5 = **~600 attribute points** (derived), which is why rare thresholds of 160 to 360 and glyph thresholds of
25-in-radius are reachable but not free. Thresholds are the _purpose_ of attributes on the board: a Barbarian lights
Willpower not for Willpower but because the rare two steps on doubles at 230 Willpower. Attributes are the currency
that converts travel into notable power.

> **Suggestion.** The cleanest answer Phase B has to "what are attributes for": one small universal effect each, plus
> thresholds on notables and gear. Bob has gear requirements; "a second effect at N of attribute" on a few notables
> would make attribute travel a choice rather than a toll.

## 8. Communication

| Device                   | What it tells the player                                                                                                                                             | Status                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Colour by rarity         | magic blue, rare yellow, legendary orange (sourced, arzyelbuilds; Maxroll "the orange nodes"); normal grey (recalled); socket and gate have their own shapes         | sourced / recalled                   |
| Board name               | the board _is_ the theme; the selection screen lists boards by name                                                                                                  | sourced (Maxroll)                    |
| Legendary preview        | reaching a gate opens a selection screen showing each board and its legendary before attaching; the board rotates in preview                                         | sourced (Wowhead; PC Invasion/Prima) |
| Rare tooltip             | both stats, the threshold, the current total                                                                                                                         | recalled                             |
| Glyph tooltip and radius | rate, threshold, met or not; the radius drawn on the board                                                                                                           | sourced (Maxroll) / recalled         |
| Controller               | one node per stick step; confirm on a gate opens selection; a VoH path-fill walks to a legendary or socket in one press "instead of clicking through 10 or 20 nodes" | sourced (PC Invasion; Mobalytics)    |
| Small screen             | one board fits a screen because the grid is regular and the vocabulary is four colours; five boards need a zoom-out                                                  | recalled                             |

No region labels, no stat icons, no theme art: the grid is the map and four colours plus one name per board do the work.

> **Suggestion.** Borrow the two cheapest devices: a strict colour by node _rank_ separate from colour by _stat_, and a
> preview of a region's keystone before committing. The path-fill button is the most phone-friendly control D4 has.

## 9. Aesthetics

| Fact              | Value                                                                                                                          | Status                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| Grid              | square tiles, orthogonal links; square boards, gate at each edge centre; 90 degree rotation                                    | sourced (Maxroll)          |
| Density           | starter 56 usable nodes; class board ~60 to 80 on a ~21-tile grid, so most tiles are empty and the empty tiles shape the paths | sourced / recalled         |
| Reads at a glance | the orange centre, the yellow flowers, the socket, the four gate marks, lit vs unlit                                           | sourced colours / recalled |
| Silhouette        | none: identical squares edge to edge; a character's Paragon is a cross or L of five                                            | recalled                   |

Everything D4 gains in legibility it gives up in silhouette: the Paragon screen is a tool, not a place.

> **Suggestion.** Reading on a phone does not need looking good, D4 proves; but the density lesson holds: 56 nodes with
> 5 landmarks is a screenful that reads, about one landmark per 10 to 12 nodes, whatever the region's shape.

## 10. Node types

| Type           | System     | What it adds                                                               | Suits an auto-battler on a phone?                                                                             |
| -------------- | ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Normal         | Paragon    | +5 attribute; travel; glyph fuel                                           | yes: one number, instant read                                                                                 |
| Magic          | Paragon    | +7 attribute or one small stat; the ring round a rare                      | yes: Bob's small node                                                                                         |
| Rare           | Paragon    | two stats, one doubling at an attribute threshold                          | yes: a notable with a threshold is a clear goal                                                               |
| Legendary      | Paragon    | a conditional multiplier or mechanic, one per board, at the centre         | yes if the condition is one the sim produces (resource spent, kills, low life); not if it needs player timing |
| Glyph socket   | Paragon    | a socketed item whose radius reads the smalls around it                    | partly: a jewel system (plan default: no), needs a grid and a radius rule                                     |
| Gate           | Paragon    | +5 all; the attachment and rotation point                                  | the idea (choose and orient a region at a junction) transfers; prebuilt boards do not                         |
| Active skill   | Skill tree | a skill with ranks (5 at launch, 15 in Lord of Hatred) and forked upgrades | no: Bob's skills are gems                                                                                     |
| Passive        | Skill tree | 1 to 3 ranks of a small stat                                               | yes: ranks make one node a three-step decision cheaply                                                        |
| Ultimate       | Skill tree | one big cooldown, one allowed                                              | no (a skill)                                                                                                  |
| Key passive    | Skill tree | one build-defining conditional, one allowed, at 33 points                  | yes: a keystone with an exclusivity rule                                                                      |
| D2 synergy     | D2         | hard points in one skill scale a related one                               | the rate idea (a node that counts points in its neighbours) suits an auto-battler                             |
| D3 paragon tab | D3         | a counter capped at 50                                                     | no: the counter-example                                                                                       |

---

## The most valuable thing: clarity from a small vocabulary, and what it costs

D4's Paragon is legible because it has **four node ranks and two threshold rules and nothing else**. Every normal says
one thing. Every rare has one shape (two stats, one doubles at a threshold). Every legendary is one sentence. Every
glyph scales the same way (per 5 attribute in a radius, extra at a threshold). Every board has one legendary at the
centre and gates at the edge centres. A player who has read one board has read them all; the colour code does the
rest, and a controller walks it one tile at a time. The thresholds are the glue: they make the dull nodes matter
without making them complicated, and they are the only reason a +5 is ever a choice.

The cost is variety. Boards are prebuilt, so a build is choose-4-of-8 boards x 4 rotations x 5 glyphs; the design
space is order and orientation, and guides reduce it to a list. Travel nodes are identical, so the texture of a PoE
path (a small node that is a tiny decision) is gone. Blizzard capped a character at five boards (Season 6) and said it
aims for 30 to 40% of the skill tree filled by endgame (sourced, Den of Geek on the 2020 quarterly update): a system
tuned for a clear read of a few big choices, not for tens of thousands of distinct builds. Legendaries are buffs placed
far away, not trades, so no node is feared. A theme is a board, so locality is total and mixing is coarse.

For Bob, which must serve tens of archetypes and tens of thousands of builds on a phone: take the _vocabulary
discipline_ (few ranks, one shape per rank, a colour per rank, thresholds as the device that makes travel matter) and
refuse the _prebuilt-board coarseness_ (one shared tree, clusters smaller than a board, keystones with trades as well
as buffs, more decisions per point than D4's one every four or five).

## Property table (for the cross-game comparison)

| Property                                         | D4 Paragon (launch unless noted)                                                                               | Status                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Start region: size / exits / notables / keystone | 56 / 1 / 4 / none                                                                                              | sourced                |
| Travel share                                     | 61% (starter board)                                                                                            | derived                |
| Travel node content                              | +5 of one attribute                                                                                            | sourced                |
| Smalls per notable                               | ~5                                                                                                             | sourced                |
| Notables per region                              | 3 to 6                                                                                                         | sourced                |
| Keystones per region; approach                   | 1 at the centre; ~10 steps                                                                                     | sourced / recalled     |
| Notable vs small                                 | ~4 to 6x, doubling at 160 to 360 attribute                                                                     | derived / sourced      |
| Keystone vs notable                              | multiplicative vs additive; no drawback                                                                        | sourced                |
| Decisions per build                              | ~60 to 70 over ~280 points; ~15 at Bob's 123                                                                   | derived                |
| Regions per class / per build                    | 8 (9 VoH) / 4 + starter (Season 6 cap)                                                                         | sourced                |
| Attribute per point                              | +1 armour; +0.05% res; +0.1% heal, +0.25% overpower; +0.025% dodge; +0.1% skill damage from the main attribute | sourced, two conflicts |
| Communication                                    | 4 rarity colours, board name, legendary preview with rotation, drawn glyph radius, path-fill                   | sourced                |
| Glyph radius                                     | 3 (4 at level 15); later 3/4/5                                                                                 | sourced                |
| Point budget                                     | 58 + 220 launch; 71 + 328 VoH; 80 + 342 Lord of Hatred                                                         | sourced                |

Sources: Maxroll boards and glyphs (maxroll.gg/d4/resources/paragon-boards, /paragon-glyphs), Maxroll skill trees
(maxroll.gg/d4/getting-started/skill-trees), Blizzard Dec 2021 quarterly update (news.blizzard.com/en-us/diablo4/23746639),
Wowhead class paragon guides (wowhead.com/diablo-4/guide/classes/barbarian/paragon-boards), Fextralife Paragon and
Paragon Boards (diablo4.wiki.fextralife.com/Paragon, /Paragon+Boards), Prima skill-tree explainer
(primagames.com/tips/everything-we-know-about-diablo-4s-skill-tree), classic.battle.net/diablo2exp/skills/basics.shtml,
diablo2.wiki.fextralife.com/Fire+Ball, diablowiki.net/Paragon, gamerguides.com and ggrecon.com D4 stats pages,
arzyelbuilds.com/diablo-4-paragon-board, PC Invasion/Prima on board switching, Mobalytics on path-fill.
