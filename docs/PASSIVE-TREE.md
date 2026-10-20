# Bob — The passive tree, designed from scratch

Status: **plan, 2026-10-18.** Nothing here is built. This is a new piece of work, not a continuation of
[TREE-REDESIGN.md](TREE-REDESIGN.md) (2026-10-11 to 10-13): that work tuned a generator through eight iterations, each fixing a
measurement, and the tree it left is the right size with no design. Its code, its names and its measurements may be reused
later where they happen to fit; nothing below assumes they will be. Its decisions (D1 to D6) do not carry over.

The user's brief (2026-10-18): the tree must be well balanced for tens of build archetypes and tens of thousands of
specific builds; offer many meaningful decisions; communicate them clearly; look good; have good starting areas, good
late-build decisions, the right amount of highways, the right spread of attributes, and the right numerical and spatial
distribution of node types. The set of node types may change. Other games' trees are references, PoE first, never copied.
Answers given the same day: the design comes first and how to author it comes after; the node count follows from the
constraints; the tree may be any shape; new nodes may use existing stats and new engine stats where a theme clearly needs
one; the user reviews at two stops (the design brief and the finished tree) and reads drafts saved along the way; a
goal-based test player is in scope; look, choices, balance and navigation all have to improve a great deal, none first.

---

## 0. Summary

**Design first, then build.** Three questions are answered in order, each on paper before any code: what must the tree
serve (the builds Bob can make, counted from the data, and the rules of an auto-battler); what do good trees have in common
(measured from the references, as properties and rates, never shapes); and what, therefore, is Bob's tree (the design
brief: a one-page answer to each of the user's requirements, each with the property it will be checked by). The brief is
the first stop for the user's eyes. Only after it is agreed are the authoring method and the node count chosen, because
both follow from it.

**Then build in the open.** The tree is built region by region with a picture and a short note after each, saved where the
user can read them at leisure. Three kinds of check run without the user: a supply audit that asks, for every value of
every axis a build is made of, what it costs to buy from each start (a shortest-path sum, so it needs no player model);
a visual review of each region by an agent given a rubric and a picture, not a conclusion; and simulated players whose
briefs are sampled from the axes, triaged by rule. The bot is only a smoke test for gross breakage. The finished tree is
the second stop.

**What makes this different from last time.** Last time the design was a list of measurements and the tree was whatever
the generator did that passed them. This time the design is a document a person can disagree with, the numbers come
from it, the pictures are the gate, and balance is a property of the tree's supply, not of a bot's results.

---

## 1. Phase A: what the tree must serve

Output: `docs/tree/design/A-constraints.md`. Mostly read-only subagent work, in parallel. No design decisions are made
here; this phase only counts what exists.

### A1. The axes a build is made of

Builds cannot be enumerated: the combinations run into the tens of thousands and no bot plays well enough to tell a good
one from a bad one. What can be written down is the short list of **axes** a build is a point on, and the values each axis
takes. A tree is fair when every value of an axis can buy comparable power per point (section 3, item 11), which is a
property of the tree alone and needs no player to measure. The axes, from the data:

- **Damage source**: attack, spell, minion, damage over time, deployed (totem, trap, mine, brand).
- **Damage type**: physical, fire, cold, lightning, chaos.
- **Delivery**: melee, projectile, area, channelled. (Checked against the engine, 2026-10-19: these four have their own
  stats and the tree already speaks of them; slam, strike, nova, chaining and triggered are tags the sim and the
  drawing code use and no tree node should.)
- **Weapon** (`src/data/bases.ts`): sword, axe, mace, sceptre, dagger, claw, wand, staff, bow; one-hand, two-hand, dual
  wield, shield, unarmed.
- **Defence lean**: life, energy shield, armour, evasion, block, dodge, regeneration and leech, resistances, the reprieves.
- **Resource**: mana, life as the cost, reservation.
- **Mechanics with their own stats**: auras, curses, charges (grit, fervour, insight), flasks, ailments (ignite, bleed,
  poison, chill, freeze, shock), stun, conversion, penetration, critical strikes, attack speed, cast speed.
- **Start**: the six classes (DESIGN.md 5.2), each with its attributes, weapon and first skill.

Gem counts by tag (`src/data/gems.ts`, `gemsGen.ts`, about 377 gems: spell 118, attack 75, projectile 55, melee 51, fire
35, lightning 26, physical 25, cold 24, bow 20, minion 17, chaos 16, curse 15, totem 10, trap 10, mine 5, warcry 4,
brand 2) say how much weight each value carries, so that the tree's supply can follow the game's supply of skills. The
output is one page: the axes, their values, and which values the game itself makes rare.

Two sources of player judgment stand in for the player model this plan does not have: the user, who reads the brief's
intended costs for a dozen named combinations and disagrees with them (section 3, item 11); and the telemetry after
release (`docs/TELEMETRY.md`, the deaths chart), which is the ground truth the reference game itself balances from.

### A2. The engine's vocabulary

What a node can say (`src/mods/types.ts`: stats, kinds, tags, damage types, conditions). What the sheet reads and the
sim obeys. A list of stat ideas the references use that Bob cannot express, each marked "cheap to add", "dear" or
"meaningless in an auto-battler". That last category is the important one: the character is driven by the sim, so a
node about the player's own timing or positioning (while moving, after dodging, on manual flask use) is dead text, as the
playtests found with Wound Dance. Nodes may still care about the _character's_ state (low life, recently killed, charges,
flask active, nearby enemies) because the sim produces it.

### A3. The rules of this game that shape a tree

- 123 points over 100 maps at a known pace (one per level, three after every tenth map): when a player has 10, 30, 60,
  123 points, measured in maps, from the bot's level curve.
- Refunds: one per cleared map; a refund must keep the tree connected.
- Every run starts a new character; the tree is read fresh many times, so it has to be learnable and legible on a phone.
- The tree screen (`src/ui/TreeView.tsx`, `treeStyle.ts`): colours by what a node gives, emblems on notables and
  keystones, a search box, pinch zoom. What the screen can draw bounds what the design may rely on; what the design needs
  that the screen cannot draw is listed for Phase D.

---

## 2. Phase B: what good trees have in common

Output: `docs/tree/design/B-references.md`. Subagents, one per game, in parallel, writing to a shared template so the
result is one table.

Games: **Path of Exile** (the main reference: `docs/tree/pob-tree.json` holds its 3.9 tree with node text, group, sector
and depth, so rates are measured, not recalled; the wiki for masteries, ascendancies and the later changes), **Last
Epoch** (per-class trees with ranked nodes and specialisation trees per skill), **Diablo 2 and 4** (skill trees and the
Paragon board: small, clear, with glyphs and legendary nodes), **Grim Dawn** (devotion constellations: shapes that are
named, affinities that gate), and a glance at **Wolcen**, **Torchlight** and **Borderlands** for how they place
keystone-like nodes.

For each game, the same questions, answered with numbers where there are any:

1. **Starting areas.** What the first ten points can buy; how many ways out; how soon the first notable.
2. **Highways.** What share of all nodes are travel nodes; what they give (attributes only, or small stats); how long a
   stretch runs between choices; how a highway is told apart from a cluster by eye.
3. **Clusters.** Size (small nodes per notable); whether a cluster's small nodes agree with its notable; whether a
   cluster has one way in or can be passed through.
4. **Notables and keystones.** How much stronger a notable is than its small nodes; how far apart notables are; where
   keystones sit (rim, border between two regions, centre) and how long the approach is; what makes a keystone a real
   trade-off rather than a buff.
5. **Decisions.** The kinds of decision the tree presents (which of two roads; whether to detour for a notable; whether
   to cross to another region; a keystone's trade; a mastery's choice) and roughly how many of each a full build meets.
6. **Locality.** How strongly an archetype keeps to one place; which stats are everywhere.
7. **Attributes.** How they are spread; what they are for (gear requirements, small bonuses); whether a build has to
   go out of its way for an off-attribute.
8. **Communication.** How the tree tells the player where a theme lives without reading every node: colour, icon, named
   groups, shapes, the background, labels at zoom levels.
9. **Aesthetics.** The silhouette; whether regions differ in shape; how dense; what dark space does; what the eye
   lands on at full zoom-out.
10. **Node types** beyond small, notable, keystone: masteries, jewel sockets, ascendancy, ranked nodes, glyphs.
    What each adds, what it costs to build, whether it suits an auto-battler.

The output table: property, range per game, **what Bob wants and why**. Where PoE and Bob differ in a way that matters
(Bob has no manual play, no respec economy, a 25-minute run, six classes and no ascendancies), the "why" says so.

**The IP line, once:** from the references come properties and rates (how long a highway, how much stronger a notable,
how strongly a weapon keeps to a corner). From them never come shapes, positions, arrangements, names or text. The
existing `src/data/ip.test.ts` keeps watching names and text.

---

## 3. Phase C: the design brief — **user stop 1**

Output: `docs/tree/design/C-brief.md`, about ten pages, with pictures (sketches of the macro shape and of one region at
three zoom levels; drawn by a script from the brief's own data, so that they are true to it). The user reads it and
answers; the build phase does not start until then.

The brief answers each item of the user's list in a paragraph or two, each **derived from A and B** and each ending with
**the property it will be checked by** (a number the audit prints, a question a reviewer is asked, or a thing the test
player measures). Where I hold a strong view it is written as a hypothesis the brief will test, not a decision.

1. **The purpose of the tree in Bob**, in one paragraph: what a player is doing when they open it between maps, how
   long they spend, what they must be able to see at once on a phone.
2. **Regions.** How many, what each is for, what class starts where, and what makes each one recognisable (a theme, a
   shape, a landmark). Any shape is allowed; the circle of six equal slices is not assumed. Each region gets a one-line
   identity and the axis values (from A1) that live there (fire and cold spells here, bows and evasion there), with the
   rule for which values are local and which are everywhere.
3. **Starting areas.** What the first ten points buy for each class, how many ways out, how soon the first choice that
   matters, and how a class reaches the basics (life or energy shield, its attribute, its weapon) without being handed
   them. The check: a table of each class's first fifteen steps.
4. **Highways.** What a highway is made of, how long a stretch may run without a choice, how one is told from a cluster by
   eye, how many join two regions and where. The check: share of travel nodes, longest bare stretch, crossings per pair
   of neighbouring regions.
5. **Clusters and notables.** Cluster sizes, whether a cluster can be passed through, how a notable's small nodes relate
   to it, and the price of a notable against a small node (a single strength table, with the stats it cannot price listed
   and hand-valued). The check: the table, and the audit's weakest-notable list.
6. **Keystones and late-build decisions.** Where keystones sit and how far the walk is; which are trades rather than
   buffs; what a build with 90 to 123 points is deciding between (a second keystone, a crossing to another region, a
   deeper cluster of its own theme). The check: for a dozen named combinations, what the last 30 points can reach from
   where the first 90 would stand, on paper.
7. **Attributes.** What they do in Bob (gear requirements, small bonuses, the class start), how they are spread, how far
   an off-attribute build must walk. The check: attribute nodes by region and the cost of +60 of an off attribute from
   each start.
8. **Node types.** Which to keep, add or remove, each with a reason from B10 and A2. Masteries (a node where the player
   picks one of several effects) and jewel sockets are considered here and given a verdict with the cost of each; the
   user did not pick them on 2026-10-18, so the default is no, and the brief argues only if B shows a strong reason.
   New engine stats a theme clearly needs are listed with their cost.
9. **Numbers.** The node count, the counts of each node type, and the share of the tree a 123-point build takes, **derived
   from 2 to 8** (how many regions × how many clusters a region needs to supply its axis values × cluster size, plus the
   highways) and shown with the arithmetic. Not chosen first.
10. **Communication and look.** How the player finds a theme (colour, emblem, named landmarks, region labels at
    zoom-out, the search), what the silhouette is, where the eye lands when zoomed out, and what the tree screen must
    gain to draw it (handed to Phase D as a list).
11. **Balance.** Fairness is a property of supply, not of outcomes. The strength table prices every node in small nodes.
    The **supply rule**: for each axis in A1, every value can buy comparable power per point from the starts that would
    want it (fire, cold and lightning each offer about the same % damage for 20 points from a Mystic; sword, axe and mace
    the same from a Reaver; armour, evasion and energy shield the same from their own starts), within a stated margin,
    with the exceptions the design intends named (a build the tree means to make dear says so). And an **intended-cost
    table** of a dozen combinations across the axes (bow physical evasion from a Strider; minion life from a Zealot; fire
    spells from a Vanguard, against the grain...): the points each must spend to reach its basics and its first keystone.
    The user reads that table and disagrees with it; that is the player judgment this plan has before release.

The brief ends with **the open questions for the user**, each with the answer I would take by default.

---

## 4. Phase D: the method and the build

Begins after stop 1. What is decided now is only what will be decided between, and by what criterion.

### D1. The authoring method

Chosen from what the brief demands, not before. The candidates:

- **Authored map, code tidies.** A person (me, with subagents) writes the region shapes, the highways, the junctions and
  where each cluster and keystone goes, as data; code spaces nodes evenly, draws the links and checks the rules.
- **Node by node in the editor** (`npm run tree:edit`): full control, slowest.
- **A mix**: the macro map authored; clusters placed by hand in the editor where the picture needs it.

The criterion: the method that lets a reviewer's picture comment ("this road is too long", "move this cluster to the
border") be acted on in minutes. Whichever is chosen, **node ids must be stable** across edits (the current bake renumbers
them on every change and the picture tools do not see hand edits; both are fixed first), and the game keeps doing no
layout at run time.

### D2. The build, region by region

Each region is built, pictured and written up before the next (`docs/tree/design/D-<region>.md` with the picture and a
note on what was decided and why). After every region the whole-tree picture is saved too, so the user can look at the
drafts at any time without being asked to. The order: the macro map first (every region's outline and the highways between,
with every keystone's spot marked, as one picture), then one region to the finish as the model, then the other five.

**Review and update is a loop, not a report.** A region is finished only when it has passed one rubric review (E2) with
no confirmed finding. A confirmed finding is fixed and the region reviewed again; at most two review-and-fix rounds, after
which it goes to the drafts folder flagged with what is still open, so the user sees the disagreement rather than a
region polished past its reviewers.

### D3. New nodes and new stats

Notables and keystones written for the brief's regions. Existing notable text may be reused where it fits the region it
lands in; nothing is kept for being there already. New engine stats from the brief's list are added with sheet and sim
support and a test each, before the nodes that use them.

### D4. The tree screen

What the brief asked of the screen (region labels at zoom-out, a redrawn background for the new silhouette, landmarks,
whatever B9 and C10 found): built here, after the tree exists, so it is drawn for the real thing.

---

## 5. Phase E: verification, without the user

Runs on every region as it is finished and on the whole tree at the end. Nothing here needs the user; everything it
finds is fixed or written down with a reason.

### E1. The supply audit, and the bot as a smoke test

**The supply audit** is the balance instrument, and it is arithmetic on the tree, not a player. For every value of every
axis in A1 and every start: the cheapest N points' worth of that value's stats (a shortest-path sum over the strength
table), at N = 10, 20, 40. It prints the supply rule of the brief (item 11) as a table, value against value, start against
start, and the intended-cost table beside what the tree actually charges. Comparable values that differ by more than the
brief's margin are findings; the fix is in the tree, never in the margin.

**The bot** stays a smoke test for gross breakage, never a balance measurement. The current bot (`botAllocate`,
`src/run/bot.ts`) spends greedily within six steps and cannot value a walk to a keystone. It gets a **shopper**: given a
bundle of stats to aim for (a few axis values and a keystone), it paths to them under the point budget and lets the greedy
bot fill the rest. A sweep runs a sample of bundles across the axes on the same seeds and reports a class that cannot
survive map 30, a stat nobody can reach, a keystone nobody takes. `scripts/random-play.ts` (a player who plans nothing)
stays the floor. **Run sparingly**: one sweep per finished region and one at the end, not after every edit (the memory of
2026-10 on balance sims).

### E2. Visual review by rubric

For every finished region, a reviewer agent is given the region's picture at two zooms and the whole-tree picture, and a
**rubric lifted from the user's list** (can you name this region's theme from the picture; can you find the keystones;
is there a stretch with no decision; does it look like its neighbours; where does the eye go), and asked to answer it,
not to agree with a conclusion. Reviews are saved beside the region's draft. Disagreement between two reviewers is a
flag, not a vote.

### E3. Simulated players

The method of `docs/tree/playtest` (a brief, pictures, `tree:explore`, a written report; triage by rule: confirm against
the data, prefer data to opinion, never count votes), with the briefs **sampled from the axes** (each value of each axis
appears in at least one brief, a third of the briefs against the grain of their start) plus any build the user names. One
round on the finished tree, a second after its fixes.

### E4. The audit and the tests

An audit script prints every property the brief named as a check, in the brief's order, so that the brief and the tree
can be read side by side. Tests pin what the brief calls invariants (connected, reachable from every start, no overlaps,
keystones are dead ends, notables beat small nodes by the table, no weapon or skill node on a highway) and nothing that
is a matter of look.

---

## 6. Phase F: the finished tree — **user stop 2**

The whole-tree picture, the six region pictures, the audit beside the brief (the supply tables and the intended costs
against the real ones), the bot's smoke test, and the simulated players' triage, with a short note on what the brief said and what was built differently and why. The
save version is bumped once, and passives are handed back as unspent points. Patch notes are the `/patch-notes` skill's.

**Status, 2026-10-20:** the user asked to hook the tree in. The game loads it (`getTree()` reads the bake of
`src/data/passives`), save version 20 hands passives back, the tree editor edits it by default, and a smoke test of one
bot per class to map 15 played without errors (five reached map 15; the Strider's one run died on map 3 at level 2).
Still owed from this phase: the supply audit beside the brief (supply tables, intended against real costs) and the
note on what the brief said and what was built differently.

---

## 7. Who does what

| Phase | Done by                                                                                  | Output read by              |
| ----- | ---------------------------------------------------------------------------------------- | --------------------------- |
| A     | Subagents in parallel (axes, vocabulary, rules), read-only; I assemble                   | B, C, E                     |
| B     | One subagent per game, shared template; I write the comparison and the "what Bob wants"  | C                           |
| C     | Me; sketches by script; the advisor reviews before it goes to the user                   | **The user**                |
| D     | Me for the macro map and the model region; subagents for regions under the model's rules | E, the user's drafts folder |
| E     | Subagents (supply audit and shopper code, reviewers, simulated players); I triage        | D (fixes), F                |
| F     | Me                                                                                       | **The user**                |

Every phase leaves its output in `docs/tree/design/` as it finishes, so the user can read along at any time without
being asked; only C and F wait for an answer.

---

## 8. Risks

| Risk                                                                                                              | What is done about it                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| The brief becomes a list of numbers again and the tree built to it has no more design than the last one           | Every item in C has a sketch or a worked example beside its property; the user's stop is on the brief, not on a spreadsheet       |
| Supply parity makes every axis value equally cheap and the tree bland (no build is dear, so none is a commitment) | The brief names the exceptions it intends, and locality (item 2) makes a combination dear by distance, not by starving a stat     |
| References are recalled rather than measured, and the rates are wrong                                             | PoE is measured from `pob-tree.json`; the other games' numbers are marked recalled or sourced, and only PoE's drive a Bob number  |
| New engine stats grow into engine work that stalls the tree                                                       | A2 prices each; the brief takes only the cheap ones and lists the rest as later                                                   |
| No player model: the bot is weak and the simulated players share one mind, so outcomes cannot be trusted          | Balance is judged on supply (arithmetic), the user reads the intended-cost table, and telemetry after release is the ground truth |
| A hand-authored tree is slow to change when a review asks for a move                                              | D1's criterion is exactly that; stable ids and edit-aware pictures come before any region                                         |
| The user's two stops are far apart and the build drifts from what they meant                                      | Drafts after every region, with pictures, in the folder; a region that departs from the brief says so in its note                 |
| Players lose their allocated passives                                                                             | Handed back as unspent once, at F                                                                                                 |
