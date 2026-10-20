# B: Grim Dawn (Devotion map, and the mastery bar) as a reference for Bob's tree

Phase B of [PASSIVE-TREE.md](../../PASSIVE-TREE.md) section 2, written 2026-10-19 from web sources only. Each number is
marked **S** (sourced, with the page), **D** (computed by me from a fan-extracted dataset of the live game's devotion
records, v1.3.1.1, https://github.com/tednaleid/grimdawn-devotions `data/devotions.json`; the scripts are not kept) or
**R** (recalled). The dataset was cross-checked against the wiki's constellation table
(https://grimdawn.fandom.com/wiki/Constellation) where both have a number.

**Version baseline.** Devotion shipped with 50 points; Ashes of Malmouth raised the cap to 55 and added 14
constellations (S, https://forums.crateentertainment.com/t/grim-misadventure-122-devoted-arkovia/39583), Forgotten Gods
added 9 (S, Steam listing), so about 80 were there at launch (derived); the latest expansion adds none (S, planner thread).
Today's map: **104 named constellations plus the Crossroads (five single stars), 559 stars in all**, 55 points (D; the wiki
says "105 constellations, 3 to 8 stars", counting the Crossroads as one). The plan's "~90" is stale.

**IP line.** Properties and rates only. Constellations are named here because the sources name them; nothing in a
_suggestion_ line uses a name, a picture, a position or a star's text.

Sources: official guide (https://www.grimdawn.com/guide/character/devotion,
https://www.grimdawn.com/guide/character/character-basics/), wiki Devotion / Constellation / Soldier / Arcanist pages
(https://grimdawn.fandom.com/wiki/Devotion, .../Constellation, .../Soldier, .../Arcanist), the planner's rules document
(https://github.com/tednaleid/grimdawn-devotions/blob/main/docs/devotion-system.md), the forum compendium
(https://forums.crateentertainment.com/t/new-player-knowledge-compendium/40322), two build guides with devotion routes
(https://forums.crateentertainment.com/t/1-0-2-1-the-night-king-pet-vitality-hybrid-cabalist-5s-mq-3-5m-glad-necro-devotion-guides/42498,
https://forums.crateentertainment.com/t/1-2-1-6-hc-2hmelee-herald-of-oleron-beginner-hc-ssf-super-tanky-physical-warder-guide-great-for-first-char-lazy-and-fast-endgame-farming/147141),
and Steam threads on the devotion window, read through search summaries (the affinity-hover line and the request for a
search box; e.g. https://steamcommunity.com/app/219990/discussions/0/3044978964806102011).

---

## The system in one paragraph

Devotion is a second tree beside the class skills. A character earns up to **55 devotion points** by restoring shrines
in the world (S, guide) and spends them one per **star** on a star map of **constellations**: named line-drawings of
3 to 8 stars, each star a small stat bundle, the brightest star of most constellations a **celestial power** (a proc
bound to one of the character's skills). Constellations are **islands**: there is no edge between them. What joins them
is **affinity**, five colours (Ascendant purple, Chaos red, Eldritch green, Order yellow, Primordial blue; S, compendium).
A constellation _requires_ some affinity to place its first star and _grants_ some when all its stars are taken; the
**Crossroads** at the centre are five single stars with no requirement that grant +1 of one colour each (D). Affinity is
never spent, only held (S, guide). Tier 1 constellations require 1 and grant 3 to 6; tier 2 require 8 to 15 and grant
1 to 6; tier 3 require 22 to 30 and grant nothing (D). Powers triggered by taking damage or blocking bind only to buff
skills; those triggered by hitting, critting or killing only to attack skills; a pet skill lets the pet trigger it (S,
guide).

---

## 1. Starting areas

| Fact                    | Value                                                                                                                   | Status               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Crossroads              | 5 single stars, no requirement, +1 affinity each; stats +18 OA, +18 OA, +18 DA, +5% life, +5% life                      | D                    |
| First 5 points, typical | 1 Crossroads of the colour you need, then a 3-to-5-star tier-1 constellation in that colour, complete                   | S (both guides)      |
| First tier-1 complete   | at 4 points (a 3-star constellation plus the Crossroads held while building it)                                         | D, S (planner rules) |
| First proc              | at 6 points: one Crossroads plus a 5-star tier-1 with a power (the Warder guide's "after your first 6 devotion points") | S (Warder guide)     |
| Ways out                | 5 (one Crossroads per colour); 45 tier-1 constellations, 8 to 10 per colour, each reachable for 1 point of its colour   | D                    |
| Bootstrap rule          | every tier-1 grants at least what it requires, so once complete it holds itself up and the Crossroads point is refunded | D (45 of 45)         |

The start is a _purchase of direction_: the first point says which colour, and the first constellation pays that point
back with interest (requires 1, grants 3 to 6), which is what lets a build climb without ever holding more than one
Crossroads per colour.

> **Suggestion.** Bob's first five points should likewise buy a direction and pay it back: a class start whose first
> cluster, once complete, opens two or three ways the start alone did not, so the opening choice is "which way" and not
> "which stat".

---

## 2. Highways: there are none; what affinity does instead

| Fact                                                | Value                                                                                        | Status                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| Travel nodes in the map                             | 0: every star gives stats (2.2 bonuses per star on average, 150 distinct stats)              | D                              |
| Affinity cost to open a tier-2                      | 7 to 13 points of lower constellations (median 9)                                            | D, lower bound*                |
| Affinity cost to open a tier-3                      | 19 to 24 points of tier-1 constellations (median 21) plus 1 refundable Crossroads per colour | D, lower bound*                |
| Share of a full build in tier-1 islands             | 35 to 45% (the Cabalist guide: 24 of 55 points in six tier-1s)                               | S (guide), D                   |
| Points kept _only_ for affinity in a finished build | about 0: scaffolding (the Crossroads, a 4-star tier-1) is taken, used and refunded           | S (both guides; planner rules) |
| Points refunded along the way                       | 5 to 9 per build (the Cabalist guide cycles 4 Crossroads and one 4-star constellation)       | S (guide)                      |
| Tier-1 star vs tier-3 star, same stat               | % physical damage 19.5 vs 97.5; flat life 71 vs 331; armour 28 vs 104; OA 16 vs 32           | D                              |

\* The DP that gives these counts chooses the cheapest set of lower constellations whose grants cover the requirement; it
ignores build order, so a real route can cost a few points more.

So the "highway tax" is paid in **stat quality**, not in dead nodes: a build spends two fifths of its points on
tier-1 islands that are each a fifth to a third as strong per star as the tier-3 it is climbing to, but each of those
islands is a real pick (14 of 45 tier-1s carry a proc; nearly all carry resistances, life or OA/DA that endgame builds need
anyway). In PoE a highway is a _path_ you must walk; here it is a _ladder_ you build from parts that are worth having,
and the parts can be swapped (any five tier-1s of the right colours will do), so two builds reaching the same tier-3
walk different roads.

> **Suggestion.** If Bob keeps highways, give the travel nodes stats a build would buy anyway (life, resistances, the
> region's attribute) at about a fifth of a cluster node's worth, and let two or three different roads reach the same
> landmark so the road is a choice, not a toll.

---

## 3. Clusters: the constellations

| Fact                          | Value                                                                                                                                                  | Status         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| Size distribution (104 named) | 3 stars: 8; 4: 19; 5: 27; 6: 32; 7: 17; 8: 1                                                                                                           | D              |
| Size by tier                  | T1 3 to 5 (median 4); T2 5 to 7 (median 6); T3 6 to 8 (median 6)                                                                                       | D              |
| Order inside                  | a fixed graph from exactly one entry star (109 of 109); 46 are pure chains, 58 branch; no star needs two predecessors                                  | D              |
| The power star                | needs 2 to 6 earlier stars; it is the last star in 22 of 63 cases; in 41 you may skip 1 to 3 stars and still get the power, but then no affinity bonus | D              |
| Partial take in practice      | "5 nodes for proc only" of a 7-star constellation (Cabalist guide); 4 of 6 stars of a tier-3 for a while, finished later (Warder guide)                | S              |
| Theme agreement               | the constellation's commonest stat is on 43% of its stars (quartiles 33 to 50%); the rest is life, OA/DA, a resistance, an attribute                   | D              |
| Dual-use stars                | 27 constellations (14 T1, 8 T2, 5 T3) carry "bonus to all pets" on some stars, so one star serves the player and the minion build                      | S (wiki table) |
| Weapon-gated                  | 7 tier-2 constellations (40 stars) usable only with an axe, a sword, a mace, a ranged weapon, a shield, a two-hander or a caster off-hand              | D              |

A constellation is a _picture of a thing_ (an animal, a tool, a figure) whose stars are the stats the thing suggests:
the armoured animals give armour and DA, the predators give % damage and OA, the healers give life and regeneration.
The theme is on under half the stars; the rest is the glue every build needs. Stars are taken along the drawing's
lines, so "which stars first" is answered by the picture.

> **Suggestion.** Size Bob's clusters at 4 to 6 nodes with a fixed order inside, the notable 3 to 5 steps in, and
> make it _legal and sometimes right_ to leave a cluster unfinished (the notable reachable without the last one or two
> nodes, with a completion bonus for finishing). Theme on about half the nodes, the basics on the rest.

---

## 4. Notables and keystones: the celestial powers

| Fact                   | Value                                                                                                                                                                     | Status          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Powers                 | 63 across 104 constellations (T1 14, T2 27, T3 22; one T3 has two)                                                                                                        | D               |
| Triggers               | on attack 35; on crit 9; when hit 13; when hit by melee 1; on block 3; at low life 2                                                                                      | D               |
| Chance and cooldown    | 15 to 100% (median 25 to 30); 0.1 to 30 s (median 1 to 2.5 s); "100% on crit" and "100% at 45% life" are the sure ones                                                    | D               |
| Strength by tier       | weapon-damage % of attack procs: median 28 (T1), 33 (T2), 54 (T3); max rank 25/20/15 by tier (the official 20/15/10 plus five from the expansion)                         | D, S (guide)    |
| Per build              | 5 to 8 bound (the Cabalist guide binds 7; the Warder guide names 2 and leaves the rest to its planner)                                                                    | S               |
| Cost of a tier-3 power | its own 6 to 8 stars + 19 to 24 points of affinity ladder + the 2 to 6 stars of its constellation before the power                                                        | D               |
| Growth                 | a power gains experience only while bound to a skill in use; rank raises its numbers                                                                                      | S (guide, wiki) |
| Binding rules          | one power per skill, any number of skills; damage-taken/block procs on buff skills only; hit/crit/kill procs on attack skills only; a pet skill makes the pet the trigger | S (guide)       |

A tier-3 power is a keystone by cost (a third of the budget to reach it, half with its own stars) but a buff by
nature: no downsides (one tier-3 power costs life per second while active; S, wiki table). The trade is elsewhere: the colours a
tier-3 demands fix which tier-1 and tier-2 islands you can afford, so taking one tier-3 rules out most others (21
tier-3s, 2 to 3 a build), and the skill you bind to decides how often it fires: a listed chance is per use of the
skill, capped by the proc's own cooldown, and a patch made the chance scale with the bound skill's cooldown so that a
long-cooldown skill fires its power at up to 100% (S, patch note via search summary; page not opened). So the binding is
a real decision: a spammed attack for a cheap proc with a short cooldown, a slow skill for a sure one.

> **Suggestion.** Bob's keystones can be procs bound to the skill the sim is already choosing: "on hit with your main
> attack, X% chance, cooldown Y". The trade is then real without a downside: which skill carries it, and which other
> keystones the same budget forgoes. Keep one or two true downside keystones for the players who want them.

---

## 5. Decisions and the point budget

| Decision kind                                                  | Count in a full 55-point build                    | Status                                   |
| -------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Which tier-3 (of 21)                                           | 2 to 3                                            | S (guides), D                            |
| Which tier-2 (of 38; 7 weapon-gated)                           | 3 to 5                                            | S, D                                     |
| Which tier-1 islands as the ladder (of 45, 8 to 10 per colour) | 4 to 6, chosen for colour _and_ stats             | S, D                                     |
| Order of construction (what scaffolds what, when to refund)    | 20 to 25 single moves, 5 to 9 of them refunds     | S (planner doc: "a 25-move walk"; guide) |
| Complete or partial                                            | 1 to 2 constellations left unfinished for a proc  | S                                        |
| Which power on which skill                                     | 5 to 8 bindings, re-bindable at any time for free | S                                        |
| Constellations in a build                                      | 10 to 12                                          | S (guides)                               |
| Share of all stars taken                                       | 55 of 559 = 9.8%                                  | D                                        |

Budget: 55 points, one per shrine, fixed by the world, not by level (S). Skill points, which the mastery bars share:
3 per level to 50, 2 to 90, 1 after, 244 at level 100 with quest points (S, guide; compendium). Refund: a Spirit Guide fee that rises with each
change plus a crystal; an Undo button before the window is closed; a rare tonic resets all; a star cannot be refunded if
a dependent constellation would fall below its requirement (S, guide; planner doc). Re-binding powers is free (S).

> **Suggestion.** Bob's 123 points over 25 minutes cannot afford a 25-move scaffold-and-refund dance (one refund per
> map, and the tree must stay connected). Keep the decision _kinds_ (which landmark, which road, finish or leave, which
> skill carries the proc) and drop the construction puzzle: no prerequisite a build must later undo.

---

## 6. Locality: the five colours as regions

| Fact            | Value                                                                                                                                                                                                                                                                            | Status      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Macro layout    | five wedges round the Crossroads, one per colour; tiers as rings (tier-1 median radius 900, tier-2 1,790, tier-3 2,510 units on a ~5,000-unit map)                                                                                                                               | D           |
| Tier-1          | 45 islands, each in its own colour's wedge, each requiring exactly one colour                                                                                                                                                                                                    | D           |
| Tier-2 and 3    | 32 of 38 tier-2 and all 21 tier-3 need two or three colours, and sit between the wedges of their colours                                                                                                                                                                         | D           |
| Colour supply   | ascendant, eldritch, primordial: ~88 points granted by ~30 islands each; chaos and order: 45 by 21; the highest requirement in a colour is 20/20/20 and 8/10                                                                                                                     | D           |
| A build's mix   | two colours carried to the cap, two more carried to 5 or 6 as by-products of the islands chosen for them, one not at all; the Cabalist example ends at primordial 18, chaos 8, eldritch 6, ascendant 5 (its affinities recomputed from the 1.0.2.1-era list with today's grants) | S, D        |
| Theme by colour | the wiki's one-line creeds (ascension, entropy, wild magic, order, creation) are the only statement of what a colour "is"; the stats follow loosely (chaos: fire/chaos/vitality; order: armour, DA, retaliation; primordial: cold/lightning, life)                               | S (wiki), R |

Locality is enforced by cost, not by distance: a fire build wants the fire tier-3, which demands two colours, which
makes the islands of those two wedges cheap and the other three dear. The map reads as "my two fifths" and "the rest".

> **Suggestion.** Bob's regions could be themed by _axis value_ (section A1) rather than by class, with the dear
> landmarks sitting on the border of the two regions whose themes they combine, so a build is "two regions and a
> border" and the cost of a third region is the cost of a third road.

---

## 7. Attributes

| Fact                   | Value                                                                                                                                                                                                                  | Status            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| The three              | Physique (life 2.5, regen, DA 0.4 per point; armour and melee requirements), Cunning (physical/pierce/bleed %, OA 0.4; swords and guns), Spirit (magic %, energy; caster gear and jewellery)                           | S (guide)         |
| Level-up points        | 1 per level, each worth +8 attribute; 105 by level 100                                                                                                                                                                 | S (guide)         |
| Mastery bar, per point | Soldier +5 / +3.5 / +1.5 (phys/cun/spi), +28 life, +10 energy; Arcanist +2 / +3 / +5, +18 life, +20 energy                                                                                                             | S (wiki)          |
| Mastery bar, total     | 50 points fill one bar: a Soldier bar is +250 Physique and +1,400 life; two full bars are 100 of ~244 skill points                                                                                                     | S, D              |
| Devotion's share       | 35 stars give +15 to +40 Physique, 25 Spirit, 21 Cunning (the engine's legacy keys strength/intelligence/dexterity; the wiki table confirms the mapping); eight lines on about six stars cut a gear requirement by 10% | D, S (wiki table) |
| Off-attribute          | bought on the mastery bar of the second class, or from devotion stars in another wedge; never required for a constellation                                                                                             | S, D              |

> **Suggestion.** Gear requirements are the attribute's job in Grim Dawn and the mastery bar hands them out in bulk by
> class; the tree only tops them up. If Bob's attributes mostly gate gear, the class start should hand out the bulk and
> the tree should sell the off-attribute by the region, not by the node.

---

## 8. Communication

| Fact                       | Value                                                                                                                                                 | Status                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| What names a constellation | its picture (every constellation has its own background drawing in the data), its name, its colour, its ring (distance from the centre = tier = cost) | D                                |
| What the panel shows       | the five affinities held; hovering one highlights every constellation that needs it                                                                   | S (Steam thread)                 |
| Tooltips                   | each star's stats; a power's star shows its trigger, chance, cooldown and which skills are valid                                                      | S (guide)                        |
| Search                     | **none in-game**; players have asked since 2018; fan planners add a filter by stat and highlight the stars that give it                               | S (Steam thread; planner README) |
| Cost signalling            | a constellation's requirement in coloured numbers; nothing shows how far the affinity is from being met except arithmetic                             | R                                |
| How a new player learns it | by colour first (one Crossroads, one tier-1 of that colour, see it pay back), then by the ring, then by guides with routes                            | S (guides, compendium)           |

The pictures do most of the work. A player who has read a constellation once finds it again by shape and name without
reading a star, which is what a 559-node map with no search needs.

> **Suggestion.** Give every Bob cluster a name and an emblem that _is_ its theme, and a region colour; draw the cost of
> a landmark as its distance from the start; keep the search box (Grim Dawn's lack of one is the complaint).

---

## 9. Aesthetics

| Fact              | Value                                                                                                                                                                       | Status             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Look              | dark sky, stars, faint line drawings, coloured affinity glyphs; nothing drawn between constellations                                                                        | R                  |
| Density           | constellation footprint median 300 units (130 to 666); nearest-neighbour distance between constellations median 330; linked stars 130 apart                                 | D                  |
| At full zoom-out  | the map is ~5,000 units wide, so a constellation is ~1/17 of the screen: a shape with a name, not readable stars; the five wedges and three rings are what the eye lands on | D                  |
| On a small screen | the official window is desktop-only; the fan planner supports touch but calls mobile support limited                                                                        | S (planner README) |
| Dark space        | is the structure: it is what says "island"                                                                                                                                  | R                  |

> **Suggestion.** Bob's tree on a phone wants the same two-level read: at full zoom-out, named shapes in coloured
> regions with the landmarks visible; zoomed in, one cluster filling the screen with its order readable. Dark space
> between clusters is cheaper than drawn links and says more.

---

## 10. Node types

| Type                        | What it adds                                                                                                 | Cost to build                                                                          | Suits Bob on a phone?                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Crossroads star             | a 1-point, refundable direction; +1 colour and a small stat                                                  | trivial                                                                                | yes, as the class start's "which way" nodes                                                                                                                        |
| Ordinary star               | 2.2 stats, scaled by tier (×2 to ×5 from T1 to T3)                                                           | the node table                                                                         | yes; this is the small node                                                                                                                                        |
| Celestial power             | a proc with trigger, chance, cooldown, rank growth, bound to a skill                                         | engine: a proc system keyed on hit/crit/hit-taken/block/low-life; UI: a binding screen | **yes, closely**: the sim already chooses the skill, so "bound to your main attack" needs no player timing; the triggers are character state the sim produces (A2) |
| Completion bonus (affinity) | a reason to finish a cluster rather than cherry-pick                                                         | cheap: a flag on the cluster                                                           | yes, as "finish this cluster: +X" without the gating                                                                                                               |
| Affinity gate               | cost-to-reach by theme instead of by path                                                                    | a currency and a requirement check; a refund rule that keeps dependents valid          | partly: the gate yes, the scaffold-and-refund no (one refund per map)                                                                                              |
| Weapon-gated cluster        | locality by equipped weapon, not by position                                                                 | a condition on the node                                                                | yes, cheaply: Bob already has weapon stats                                                                                                                         |
| Mastery bar                 | a per-class ramp that unlocks skill tiers at 1/5/10/15/20/25/32/40/50 and pays attributes and life per point | a second system                                                                        | no: Bob's skills come from gems; the ramp's job (bulk attributes) belongs to the class start                                                                       |

The mastery bar in one line: two classes, each a 50-point bar; every point in a bar adds the class's attribute mix and
life; checkpoints on the bar unlock the next row of skills (S, wiki; checkpoints also quoted by a Steam guide); the
second class opens at level 10 and the choice is permanent (S, guide). Typical splits are 50/32 or 50/25 (S, Steam
thread). It is a skill tree's unlock ladder, not a passive tree.

---

## What this adds up to: islands, names, and a gate that is not a road

Grim Dawn's map is navigable with 559 nodes and no search because **every unit is a named picture with a cost on its
face**: you remember "the armoured animal in the yellow wedge, second ring", not a node. Islands are unequal on purpose:
3-star cheap ones that pay back their gate, 6-star mid ones that half pay, 6-to-8-star capstones that pay nothing and
cost a third of the budget to reach. The inequality is the map's legibility: size and ring tell you cost before you
read a star.

Affinity does what PoE's highways do, by a different mechanism. A highway makes a far notable dear by _steps_; affinity
makes a capstone dear by _colour_, and the colour is bought from islands that are themselves worth having. The
consequences: no dead nodes; two builds reach the same capstone by different islands; "travel" is a set of picks, not
a path; and the decision "finish this island or take its proc and leave" exists, which a connected graph cannot offer.
The price is the construction puzzle (scaffold, refund, order), which Grim Dawn can afford with free re-binding and a
paid respec available at any time (a rising fee plus a crystal), and Bob, with one refund per map and a 25-minute run,
cannot.

> **Suggestion for Bob, in four lines.** Keep a connected tree (the refund rule needs it) but make its clusters _read
> as islands_: named, themed, unequal in size, with dark space between and the landmark's cost visible as distance and
> ring. Let the cost of a far landmark be paid in clusters a build would want anyway, by two or three roads, not one.
> Let a cluster's notable be reachable before its last node, with a small bonus for finishing. And let the keystone-class
> nodes be procs bound to the skill the sim already fires, which is the one Grim Dawn idea that fits an auto-battler
> better than it fits Grim Dawn.
