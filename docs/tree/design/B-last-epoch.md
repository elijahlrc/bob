# B — Last Epoch: per-class trees, ranked nodes, threshold gating

Phase B reference note for [PASSIVE-TREE.md](../../PASSIVE-TREE.md) section 2. Web research only (2026-10-19). Version basis:
the official support articles (node data exported about Feb 2026), the lastepochtools planner (game version 1.5.2), maxroll
and icy-veins system guides, the 1.2 patch notes, and the fandom wiki (whose node tables are pre-1.0 and are used only
for the _pattern_ of point gates, never for values). Each number is marked **sourced (url)** or **recalled**. IP line:
node names appear only as evidence in tables; nothing here is a shape, a position or node text to copy.

## The contrast with PoE, first

Last Epoch (LE) has five base classes, each with a base passive tree and three mastery trees (15 masteries). A character
sees one base tree and three mastery trees and nothing else; there is no shared graph of character power. What that buys
and what it costs:

The PoE column is recalled; the PoE note measures these from `ref-tree.json` and its values replace them.

|                            | PoE (one shared tree)                                      | Last Epoch (per-class trees)                                                         |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Nodes a max build touches  | ~120 distinct nodes, one point each (recalled)             | ~20–30 distinct nodes, 1–10 ranks each (my estimate from the counts below)           |
| What a point decides       | _which_ node next (position)                               | _how many more ranks here_ (depth)                                                   |
| Travel                     | roughly 40–60 of ~120 points on the walk (recalled)        | ~0 walk; filler ranks to hit thresholds instead (see Q2)                             |
| Locality                   | by distance on the map                                     | by construction: only your class's trees exist                                       |
| Borrowing another identity | walk there                                                 | the halves of the two unchosen mastery trees; otherwise skills, idols, gear          |
| Keystones                  | dead-end nodes far from start, bought with a long approach | 1-point trade-off nodes gated by points spent; the mastery bonus is free on choosing |
| Legibility                 | needs zoom, search, regions                                | one screen per tree; every node is a named box with a rank counter                   |
| Supply per class           | the whole tree (~1,300 nodes, recalled)                    | base 78 ranks + 3 × ~200 ranks ≈ 680 ranks (Sentinel; sourced below)                 |

**What LE gets by giving up the shared tree:** every node can be written for one class and one playstyle (8% void damage
per rank, echo chance, Time Rot), so nodes are _themed_ rather than generic; the tree fits on one phone-sized screen per
class; balance is per class (changing a Void Knight node cannot break a Mage); a new player cannot get lost; and the big
decisions are moved to systems that read well on their own (mastery choice, five skill trees, idols). **What it loses:**
no spatial discovery and no "I found a shorter road"; no cross-class combination made dear by distance (either it is in
your trees or it does not exist); less variety per class (two Void Knights differ mostly in rank counts and skills); and
a much thinner sense of a "build on the map" — the character sheet, not the tree, is where an LE build lives. When LE
wanted a PoE-shaped shared graph it put one on the _content_, not the character: the 1.2 Weaver tree (~70 nodes, 50
points, radial, class-agnostic) modifies the Monolith endgame, not your stats (sourced, https://forum.lastepoch.com/t/last-epoch-tombs-of-the-erased-patch-notes/75247/2).

## 1. Starting areas

| Property                  | LE                                                                                                                                                                       | Source                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Trees per class           | 1 base + 3 mastery                                                                                                                                                       | sourced (https://maxroll.gg/last-epoch/resources/passives-and-skills)                          |
| Base tree size (Sentinel) | 14 nodes listed, 78 ranks; max ranks 1×1, 4×1, 5×9, 8×1, 10×2. The export may be incomplete: a Strength/armour node used by 1.2 builds is absent from it (uncertainty 4) | sourced (https://support.lastepoch.com/hc/en-us/articles/46363384093595-Sentinel-Passive-Tree) |
| Gate into mastery trees   | 20 points spent in the base tree + the campaign mastery quest (chapter 4, End of Time)                                                                                   | sourced (https://support.lastepoch.com/hc/en-us/articles/46363282865435)                       |
| Base-tree node gates      | tiers at 0/5/10/15 points spent in the tree                                                                                                                              | sourced pattern, pre-1.0 values (https://lastepoch.fandom.com/wiki/Sentinel)                   |
| Points at level 10        | ~8 (one per level from level 3)                                                                                                                                          | sourced (maxroll, above)                                                                       |

The first ~10 points go into the 0-tier and 5-tier base nodes: attribute-plus-defence nodes (1 Vitality + 5% regen per
rank, 8 ranks, sourced; 1 Strength + 4% armour per rank, 8 ranks, from the old wiki and 1.2 build guides), generic damage
(5% increased damage per rank, 10 ranks) and weapon-type damage (12% per rank with a mace, 10 ranks). The base tree is a short, wide ladder, not a line: a player can
spend the first 20 points in 3–5 nodes with little chance of being wrong, which is the point. The first real choice is the
mastery, reached at ~20 points / level 20-ish, and it is a _named_ choice with a quest, not a fork on a map. Before that,
the only choice of note is which weapon-type node to rank (sword/axe speed vs mace damage vs block).

> **Suggestion (for Bob):** LE's answer to "what do the first ten points buy" is _attributes + the class's defence + one
> weapon line, in a place you cannot miss_. Bob's starts could copy the rate (the first 10 points cannot be wrong, the
> first real fork at ~15–20) without copying the ladder: a start cluster where each node is safe and the first notable is a
> weapon or delivery choice.

## 2. Highways

LE has no travel nodes. What replaces them is **threshold gating**: a node is available when N points have been spent in
that tree (and, for a minority, when a named prerequisite node has points). The visible lines between nodes exist, but
whether allocation also needs an adjacent allocated node I could not source; both readings appear in community posts (a
forum user describes the tree as "pools with threshold requirements", the old wiki lists a `Required Passive` for about one
node in eight). **Recalled:** adjacency is required in the UI, thresholds are the real constraint.

| Property                           | LE                                                                                                                                                     | Source                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Share of points on pure travel     | 0% of nodes are travel                                                                                                                                 | sourced (node lists above: every node has a stat)                                       |
| "Filler" ranks to meet a threshold | 2–5 of 113 in published builds (e.g. "2 points into Juggernaut: used to get 20 points into the tree")                                                  | sourced (https://www.icy-veins.com/last-epoch/forge-guard-smelters-wrath-endgame-build) |
| Threshold steps                    | every 5 points: 0/5/10/15/20 in base; mastery tiers continue, with the lock chain for unchosen masteries "at the halfway mark" (wiki: the 25+ segment) | sourced pattern (support, fandom Void_Knight page); tiers above 25 recalled             |
| Longest stretch without a choice   | none: every rank is a choice of where to put the next rank                                                                                             | observation                                                                             |

So LE converts the highway's _cost_ (points spent to reach power) into a _threshold_ (points spent anywhere in the tree)
and lets those points be spent on stats. The price of depth is still paid, but in ranks of something useful rather than in
+10 Strength nodes. My estimate: a 113-point build "wastes" 3–8 points on ranks it would not otherwise take, against
PoE's 40–60 travel points (recalled; the PoE note's measured figure governs).

> **Suggestion:** Bob cannot drop highways (it has a shared tree and wants locality by distance), but LE shows the rate a
> player will tolerate when every point buys something: ~5% filler. Bob's highways should give small real stats, not only
> attributes, and the longest bare stretch should be short enough that a phone player never scrolls through three nodes of
> nothing.

## 3. Clusters

A "cluster" in LE is one node with ranks. Neighbours are related by _tier_ (same points-spent threshold) and by theme in
the mastery trees (the Void Knight tree groups echo nodes, Time Rot nodes, void-damage nodes, leech nodes), but each node
is self-contained: there are no small nodes feeding a notable.

| Property                     | Void Knight mastery tree                                                                                                                                  | Source                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Nodes                        | 30                                                                                                                                                        | sourced (https://support.lastepoch.com/hc/en-us/articles/46363371591067) |
| Total ranks                  | 200                                                                                                                                                       | sourced (same, summed)                                                   |
| Ranks per node               | 1×2, 5×10, 6×4, 8×8, 10×6; mean 6.7                                                                                                                       | sourced (same)                                                           |
| Per-rank value, damage       | 7–8% increased (typed: void, spell, melee); 5% (generic, base tree); 12% (one weapon type)                                                                | sourced (both support pages)                                             |
| Per-rank value, defence      | +6 to +8 health; +4% resistance to one type; +1 attribute                                                                                                 | sourced                                                                  |
| Flat part not scaled by rank | about half the nodes carry one (e.g. "more armour 5%", "-50% slow effect on you"); whether it lands at the first or last rank is not stated in the source | sourced (same)                                                           |
| Explicit prerequisites       | 3 of the 25 nodes in the old tables name a required node (~1 in 8)                                                                                        | sourced pattern (fandom Sentinel / Void_Knight tables)                   |

The trade between ranks and nodes is visible in the numbers: 200 ranks in one mastery tree for a budget of ~93 points
after the base gate. A build takes roughly a third of its tree's ranks and must leave two thirds. Deep nodes (10 ranks)
are where a theme is committed to; 5-rank nodes are the mechanics; 1-rank nodes are the switches.

> **Suggestion:** Bob's clusters can borrow the _rate_: about a third of a theme's supply is affordable to one build, and a
> theme has three tiers of node (committing / mechanic / switch). Ranked nodes themselves are a Q10 question.

## 4. Notables and keystones

LE has three things in the notable/keystone slot:

| Kind                             | Example (name as evidence only)                                                                                                                                                                       | Strength vs an ordinary rank                                               | Where it sits                          | Trade-off?                                     | Source                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Mastery bonus (free on choosing) | VK: 1% more melee void damage per 3 Vitality + 10% echo; Sorcerer: +50 mana, 1% more spell damage per 2 mana cost up to 50%; Necromancer: +1 skeleton, +1 skeleton mage, minions 50% increased damage | a keystone's worth (a "more" multiplier or a new mechanic), costs 0 points | the top of the mastery tree            | no — pure identity                             | sourced (support search listing, https://support.lastepoch.com/hc/en-us/search?query=Sentinel+Passive+Tree) |
| 1-rank switches                  | Gladiator (dual wield: +20% speed, +8% damage taken); Avatar of Regret (+10% echo, +10% armour, -10% attack speed, +10% mana cost); Void Well                                                         | a build-defining rule for 1 point                                          | base tier 0–10; mastery mid/deep tiers | yes, both examples pay a cost                  | sourced (support pages above)                                                                               |
| Mechanic nodes with a flat bonus | Finality (melee kill threshold 2%/rank), Void Corruption (crit multi per point in the tree)                                                                                                           | 1.5–2× an ordinary rank per point, plus the mechanic                       | deep tiers of the chosen mastery       | some (Singular Purpose doubles if block < 30%) | sourced                                                                                                     |

Strength is therefore not "notable = 3× small"; it is "a switch costs 1 point and changes the rules, and the tree's biggest
power is handed out for free at the mastery choice". The approach to a keystone is measured in points spent, not steps
walked: a deep switch needs ~25–40 points in that tree (tier values above 25 recalled).

> **Suggestion:** The property Bob can take is that a keystone's _approach_ is a commitment to a theme, not a walk across
> nothing, and that the real trade-offs are cheap once you are there. In Bob that is a keystone at the far end of a
> themed region whose road is made of that theme's clusters, with the gate being "you have spent 20+ points in this
> region" by geometry rather than by a counter.

## 5. Decisions

| Decision                                              | How many per build                                                                                         | Budget                                                                                                                        | Source                                                                                                                                               |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mastery                                               | 1 of 3, at ~20 points; changeable since 1.2 for gold (100g → 1,000,000g at level 100, resets all passives) | —                                                                                                                             | sourced (https://forum.lastepoch.com/t/last-epoch-tombs-of-the-erased-patch-notes/75247/9)                                                           |
| Which nodes to rank, and how deep                     | ~20–30 nodes chosen from ~60 reachable (base 14 + own mastery 30 + two half-trees)                         | 113 passive points at level 100: one per level from 3, plus 15 from quests (one quest list counts 24; I report maxroll's 113) | sourced (https://maxroll.gg/last-epoch/resources/passives-and-skills); conflict: https://casualgamer.com/last-epoch-quests-that-give-passive-points/ |
| Which 5 skills to specialise, of ~12 base + 8 mastery | 5 slots at character levels 4, 8, 20, 35, 50                                                               | 20 points per skill tree (skill level 20), trees designed to be uncompletable                                                 | sourced (https://support.lastepoch.com/hc/en-us/articles/46363203944859; https://forum.lastepoch.com/t/skills-to-pay-the-bills/1333)                 |
| Which branch within each skill tree                   | 2–4 branches per skill; mutually exclusive peaks                                                           | within the 20                                                                                                                 | sourced (devblog)                                                                                                                                    |
| Which idols                                           | up to 20 grid slots, 1 prefix + 1 suffix each                                                              | —                                                                                                                             | sourced (https://support.lastepoch.com/hc/en-us/articles/46361996303387)                                                                             |
| Weaver tree (endgame content, not stats)              | ~70 nodes, 50 points                                                                                       | —                                                                                                                             | sourced (1.2 notes)                                                                                                                                  |

A full LE build therefore meets perhaps 1 big decision (mastery), 5 medium ones (skills), ~15 branch decisions inside
skill trees, and ~25 "how deep" decisions in the passive trees. The passive tree is the _least_ decision-dense of the
systems; the devblog is explicit that constraint (5 skills, uncompletable trees) is the source of the interesting choices.

> **Suggestion:** Bob has no skill trees and no mastery; its tree must carry all of these decisions. The LE count says a
> build should meet one identity-level decision early, a handful of medium ones (weapon, delivery, defence) by mid-run,
> and tens of small "deeper or wider" ones late. That is the distribution to design the regions around.

## 6. Locality

Everything is local by construction. The ways a build borrows:

| Mechanism              | What it gives                                              | Limit                 | Source                                   |
| ---------------------- | ---------------------------------------------------------- | --------------------- | ---------------------------------------- |
| Unchosen mastery trees | the first half of each (tiers up to the lock chain)        | cannot pass the chain | sourced (support article 46363282865435) |
| Base-class skills      | all 12 base skills stay available to every mastery         | —                     | sourced (devblog)                        |
| Skill trees            | a skill can be bent toward another damage type or delivery | 20 points             | sourced (devblog examples)               |
| Idols and gear         | class-specific affixes; conversion-type uniques            | 20 slots              | sourced (support idols page)             |

What LE _cannot_ do is a Mage who takes a Sentinel's block. The design accepts that and makes the class choice the first
and largest commitment. Stats that are "everywhere": health, resistances, attributes, generic increased damage, all at the
same per-rank rates (5% generic damage, +6–8 health per rank in the two Sentinel-family trees checked; other classes
recalled as matching).

> **Suggestion:** Bob wants cross-class builds to be _possible but dear_. LE's half-tree rule is the clean version of that:
> a neighbouring identity is reachable to about half its depth, never its capstone. In a shared tree that is "the next
> region's clusters are reachable, its keystone sits on the far side".

## 7. Attributes

| Attribute     | Per point                                                                                          | Source                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Strength      | 4% increased armour; scales strength skills                                                        | sourced (https://support.lastepoch.com/hc/en-us/articles/46361892354843)   |
| Dexterity     | 4 dodge rating; scales dexterity skills                                                            | sourced                                                                    |
| Intelligence  | 2% ward retention; scales intelligence skills                                                      | sourced                                                                    |
| Attunement    | 2 mana; scales attunement skills                                                                   | sourced                                                                    |
| Vitality      | 6 health, 1% poison and necrotic resistance                                                        | sourced                                                                    |
| Skill scaling | e.g. a Sentinel melee skill: 4% increased damage per point of Strength; some skills scale with two | sourced (https://lastepoch.fandom.com/wiki/Rive; support attributes page)  |
| Supply        | +1 per rank on 8–10-rank nodes (base and mastery), gear, idols, blessings; starting stats ~3 total | sourced (node pages; planner shows 13 attributes at level 100 before gear) |

Attributes are small defensive stats plus a _per-skill damage multiplier_; there are no gear requirements. The tree
supplies them one at a time on the same nodes as the class's defence, so a build never "goes out of its way": the
attribute it wants is on the node it wanted anyway. The per-skill scaling (which attribute, how much) is a property of
each skill, not of the tree.

> **Suggestion:** Attribute-as-skill-multiplier would need per-gem scaling tags in Bob's engine (A2: dear), so it is not a
> tree property Bob can take. What Bob can take is the _placement_: attributes ride on defence nodes a class wants anyway,
> at +1 per point, so no highway has to be made of them.

## 8. Communication

**Recalled** (no screenshot of the passive UI was obtainable; the planner's canvas is not readable by tools): one screen
per class; the base tree and the three mastery trees are separate panels with the base tree first; each node is a square
icon with a rank counter (`3/8`), lines join nodes, and a golden progress bar along the tree shows points spent against the
next threshold; locked tiers are dimmed and a chain marks the halfway lock on unchosen masteries. **Sourced:** the
progress bar ("a golden Progression Bar shows how many points must be spent in a tree to unlock a node or skill",
maxroll); skills themselves unlock at point thresholds in a tree, so the bar is also the skill-unlock meter; the tooltip
lists each stat as "X per point" and the flat part separately (support export format). A new player learns the tree by
reading it top to bottom once; there is nothing to find.

> **Suggestion:** The rank counter on the node and a progress bar for "points in this region" are the two LE UI devices
> that would read on a phone. The second is usable in Bob without ranked nodes: a per-region count shown at zoom-out
> tells the player how committed they are and what a keystone's gate wants.

## 9. Aesthetics

**Recalled:** each tree is a compact grid of boxes, roughly 4–6 rows deep and 6–8 columns wide, with the mastery emblem
at the top; node art is a painted icon per node; density is high and uniform (no dark space, no silhouette); the three
mastery panels sit side by side so the screen reads as "one base, three futures". It is a character sheet, not a map. The
Weaver tree (seen, planner screenshot 2026-10-19) is the opposite: a radial graph with a central start, ~70 nodes, three
or four emblem landmarks on the rim, dark space between spokes, PoE-like at a glance.

> **Suggestion:** LE confirms by contrast what a shared tree is for: silhouette, dark space and landmarks only earn their
> cost if the player travels. Bob's tree travels, so it keeps the map; but each _region_ could aim for LE's density and
> legibility when zoomed in — a grid-like local reading where every node is a box with a clear icon.

## 10. Node types

| Type                                                           | What it adds                                                                     | Cost to build                                                                                                       | Suits an auto-battler on a phone?                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Ranked nodes (1–10 ranks, 1 point each)                        | depth as a decision; fewer nodes on screen; per-rank values that add up smoothly | low in data (a `maxRanks` and a per-rank stat); medium in UI (counter, +/- control, refund per rank)                | **yes**: tap a node again instead of hunting the next node; refund-one-per-map maps cleanly to "remove one rank" |
| Threshold gating (points spent in tree/region)                 | replaces travel with commitment; a progress bar the player can read              | low (a counter per region); interacts with refunds (a refund must not drop a tier below what is allocated above it) | **yes, as a region counter**; as the sole structure, no (Bob wants distance)                                     |
| Mastery choice + free bonus                                    | one big named decision; a keystone's worth of identity for 0 points              | medium (a UI moment, 3 bonuses per class)                                                                           | partly: Bob has six classes and no ascendancies by brief; a free bonus at a point threshold is the cheap form    |
| 1-rank switch nodes with a cost                                | real trade-offs for 1 point                                                      | low                                                                                                                 | yes; they are Bob's keystones already                                                                            |
| Skill specialisation trees (5 × 20 points)                     | most of LE's build variety                                                       | high (a tree per gem)                                                                                               | no for the tree work; noted for later                                                                            |
| Idols (grid of 1×1 … 4×1, 2×2; 1 prefix + 1 suffix; ≤20 slots) | class-specific passives as loot; a tetris sub-game                               | high (item system)                                                                                                  | no for the tree; the "passive as a drop" idea is a jewel-socket cousin the brief already defaults to no          |
| Weaver tree (50 points, ~70 nodes, content-modifying)          | a second, shared graph that changes what you fight, not what you are             | n/a                                                                                                                 | out of scope; shows a shared graph can carry a different kind of decision                                        |

Sources: support articles cited above; https://maxroll.gg/last-epoch/resources/passives-and-skills; the 1.2 patch notes.

> **Suggestion:** Two LE types pay for themselves in an auto-battler on a phone: **ranked nodes** for the small-node
> layer (fewer taps, fewer nodes to draw, depth as a choice) and a **points-in-region counter** with a bar (a gate for
> keystones that the player can see without reading the map). Both are cheap in data; ranks need UI work (counter,
> per-rank refund). The mastery bonus and skill trees are the systems LE relies on for identity and variety, and Bob has
> neither; the tree must supply what they supply, which argues for more themed, typed per-node values (LE's 8% void vs
> 5% generic) rather than more nodes.

## Open uncertainties

1. Whether LE allocation needs an adjacent allocated node or only the threshold (Q2/Q3): recalled, both readings stated.
2. Threshold tiers above 25 points in a mastery tree: pattern sourced to 25, deeper tiers recalled.
3. Passive point total: 113 (maxroll: 98 from levels + 15 quests) against a quest list that sums to 24; the difference does
   not change any rate above.
4. The Sentinel base-tree export (14 nodes) may be incomplete or post-date a rework: the Strength/armour node that 1.2
   build guides spend 8 points in is absent, and a support search finds it only as skill-tree nodes. The 78-rank figure
   is therefore a floor.
5. The planner at 1.5.2 shows 53 Weaver points against 50 in the 1.2 notes; the cap has grown by a season or two.

## Sources

- https://support.lastepoch.com/hc/en-us/articles/46361892354843 (attributes)
- https://support.lastepoch.com/hc/en-us/articles/46363282865435 (mastery trees, 20-point gate, halfway chain)
- https://support.lastepoch.com/hc/en-us/articles/46363203944859 (skill specialisation)
- https://support.lastepoch.com/hc/en-us/articles/46363384093595-Sentinel-Passive-Tree (base tree nodes and ranks)
- https://support.lastepoch.com/hc/en-us/articles/46363371591067 (Void Knight nodes, ranks, mastery bonus)
- https://support.lastepoch.com/hc/en-us/articles/46361996303387 (idols)
- https://maxroll.gg/last-epoch/resources/passives-and-skills (113 points, slots at 4/8/20/35/50, progress bar)
- https://forum.lastepoch.com/t/skills-to-pay-the-bills/1333 (developer: 20-point uncompletable skill trees, 12 + 8 skills)
- https://forum.lastepoch.com/t/last-epoch-tombs-of-the-erased-patch-notes/75247 (1.2: mastery respec costs, Weaver tree 50 points / ~70 nodes)
- https://lastepoch.fandom.com/wiki/Sentinel and /wiki/Void_Knight (pre-1.0 tables: gate tiers, prerequisite column)
- https://lastepoch.fandom.com/wiki/Rive (4% damage per Strength)
- https://www.icy-veins.com/last-epoch/forge-guard-smelters-wrath-endgame-build (filler ranks to reach 20)
- https://casualgamer.com/last-epoch-quests-that-give-passive-points/ (quest point list, 24)
- https://www.lastepochtools.com/planner/ (version 1.5.2; Weaver tree seen)
