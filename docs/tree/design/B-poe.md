# Phase B — Path of Exile (3.9 tree), measured

Reference for [PASSIVE-TREE.md](../../PASSIVE-TREE.md) section 2. Numbers are **measured** from `docs/tree/pob-tree.json`
(3.9, Path of Building) unless marked **sourced (url)** or **recalled**. Scratch scripts live in the scratchpad (`b-poe/`).

**IP line, once:** this report takes properties and rates. It quotes reference node text only as evidence; nothing here
proposes a shape, position, arrangement, name or line for Bob.

How the data was read:

- 1,625 nodes in the file (1,228 small, 369 notable, 28 keystone; TREE.md's table says 1,632 from an earlier extraction, and
  its "1.2 lines per notable" does not match this file's 3.3, likely a different count). Links are one-way in the file, so
  they were made symmetric and self-links dropped (as `refmix.ts` does).
- 13 notables have no links: the 3.8/3.9 anoint-only notables (Tribal Fury, the Transfigurations, Vengeant Cascade...).
  The tree proper is **1,612 nodes, 356 notables**, and all rates below use it.
- 23 link targets are not in the file: the Scion start (six centre nodes point at it), three class starts, and 19 jewel
  sockets (a lower bound; the wiki says 21).
- Class starts: in each 9-node start group (Duelist, Templar, Shadow) **one** arm-middle node was observed pointing at the
  start id; the other two arms are inferred by symmetry, so the start links to the middle of each 3-node arm. The 3-node
  starts (Marauder, Ranger, Witch) are a 3-chain, and the start is **assumed** linked to its middle, sensitivity given.
- "Steps" are graph distance. "Depth" is the group's distance from the centre, rescaled so the outermost main-tree group
  is 1.0. The six-node ring round the Scion start is bucketed as "centre", not as a sector. Road-only groups exclude the
  seven start groups.

## 1. Starting areas

> **Correction (2026-10-20):** the table below assumes how most starts link, because the extracted graph lacks their
> links. Its "first notable at 3 steps, 2 ways out" is misleading. The one start the data does hold, the Ranger's, touches
> two +10 dexterity nodes. Each leads straight to an attribute hub with six and four onward exits: highways plus
> small-node paths into clusters. So that start has at least four real ways out within two steps, and its nearest
> notables are four points away. `CONSTRAINTS.md` §2 carries the corrected fact.

| start    | start group      | start links to | exits (edges / destination groups) | nodes within 10 steps | notables within 8 / 12 | 1st notable | 1st keystone               | mix of the nodes within 10 steps                    |
| -------- | ---------------- | -------------- | ---------------------------------- | --------------------- | ---------------------- | ----------- | -------------------------- | --------------------------------------------------- |
| marauder | 3-chain          | 1 (assumed)    | 2 / 2                              | 51                    | 3 / 13                 | 3           | 13 (Elemental Equilibrium) | attribute 13, life 10, mana 7, offence 6            |
| ranger   | 3-chain          | 1 (assumed)    | 2 / 2                              | 60                    | 3 / 15                 | 3           | 9 (Perfect Agony)          | attribute 13, evasion 9, mana 8, speed 7            |
| witch    | 3-chain          | 1 (assumed)    | 2 / 2                              | 59                    | 3 / 17                 | 3           | 9 (Conduit)                | attribute 13, mana 9, life 9, energy shield 8       |
| duelist  | 3 arms × 3       | 3 arm middles  | 5 / 2                              | 98                    | 10 / 35                | 3           | 10 (Perfect Agony)         | attribute 32, life 13, offence 12, evasion 11       |
| templar  | 3 arms × 3       | 3 arm middles  | 5 / 2                              | 113                   | 9 / 34                 | 3           | 6 (Elemental Equilibrium)  | attribute 40, life 21, mana 15, energy shield 8     |
| shadow   | 3 arms × 3       | 3 arm middles  | 5 / 2                              | 126                   | 10 / 48                | 3           | 5 (Necromantic Aegis)      | attribute 36, offence 15, mana 13, energy shield 11 |
| scion    | centre ring of 6 | 6              | 12 / 6                             | 169                   | 6 / 37                 | 5           | 7 (Necromantic Aegis)      | attribute 39, life 24, mana 22, speed 16            |

Sensitivity for the assumed starts: if the start links to all three chain nodes, nodes within 10 steps become 67 / 80 / 79
and the first notable is 2 steps; notables within 8 stay 3.

- **The first notable is always 3 steps out and is a class signature with +20 of the class attribute** (evidence: Witch's
  `16% increased Spell Damage / +20 to maximum Mana / +20 to Intelligence`; the hybrids' are two-stat, Duelist's `24%
increased Evasion Rating and Armour / +10% to all Elemental Resistances`).
- **Ten points buy** the start chain (one class stat), the signature notable, then one of two or three wheels of generic
  small stats (life, mana, evasion or ES by class); attribute dots are already 25–35% of what is in reach.
- **Ways out:** every start group reaches exactly two destination groups (its signature wheel and the centre ring); the
  real branching begins at the signature wheel, 3–5 steps out. **Keystones are 5–13 steps from a start**, and the nearest
  ones (depth 0.21–0.25) are mechanic-changers.

> **Suggestion:** a start that reaches its first notable in 3 steps and offers 2 ways out keeps the first minutes readable
> on a phone; the 3-node vs 9-node asymmetry (51 vs 126 nodes in reach) is a lever to use per class on purpose. A keystone
> 6–10 steps from each start puts a real decision in the first ten minutes of a 25-minute run.

## 2. Highways

| measure                                                                          | value                                                                                                      |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| nodes / edges / mean degree                                                      | 1,612 / 1,858 / 2.31                                                                                       |
| degree 1 / 2 / 3 / 4+                                                            | 211 (13%) / 1,048 (65%) / 198 (12%) / 155 (10%)                                                            |
| dead ends (raw; excluding holders of a socket or start link)                     | 13.0%; 12.2% — 161 notables, 26 keystones, only 11 smalls                                                  |
| road-only groups (no notable or keystone, not a start)                           | 199 groups, **308 nodes = 19.1%**; 139 are one node, 43 a pair, 17 larger ¹                                |
| what road nodes give                                                             | attribute **61%**, offence 16%, life 8%, speed 6%, energy shield 3%, mana 2%, other 4%                     |
| attribute share of road nodes by sector                                          | duelist 67%, marauder 65%, templar 65%, shadow 63%, ranger 56%, witch 50%                                  |
| the second road stat by sector                                                   | marauder life 20%; shadow offence 20%; ranger offence 18%; witch offence 17% + ES 10%; templar offence 16% |
| choice points (degree ≥ 3)                                                       | 353 (22% of nodes); 167 in road groups; **141 are a bare +10 attribute node**; only 26 are notables        |
| degree-2 run between two distinct choice points                                  | 159 runs: median **3**, p90 3, max 5; road-only runs: 57, median 2, max 4                                  |
| spurs (run to a dead end, end excluded) / wheels (run back to the same junction) | 153: median 2, max 4 / 83: median 4, max 11 (the big weapon wheels, not roads)                             |
| road tax in a 120-point greedy build (section 5)                                 | 35–52 points on road-group nodes (29–43%) ², 33–52 on bare attributes                                      |

¹ TREE-REDESIGN's "188 attribute of 350 road nodes (54%)" counted the start groups and centre ring as roads.
² Counted before the start-group exclusion; the start arms add 1–3 points to each figure.

Dead ends are almost all rewards, not road stubs. The longest true stretch with no choice is 4 nodes: a highway here is a
string of 1–3 attribute dots between junctions, and the junction is itself usually an attribute dot (how it is told apart
by eye: section 8).

> **Suggestion:** roads of 1–3 nodes between junctions, about a fifth of all nodes, with the plainest nodes as the junctions,
> is the measured rate; with 123 points and no respec economy, a road tax near the low end (about 30%) leaves 85 points
> for choices.

## 3. Clusters

| measure                                 | value (290 linked groups with a notable)                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| nodes per group                         | mean 4.2, median 4; sizes 1: 34, 3: 88, 4: 58, 5: 49, 6: 28, 7–12: 33                             |
| notables per group                      | 1: 235, 2: 44, 3: 11 → **2.5 smalls per notable** overall; per group median 2 (IQR 2–3)           |
| smalls share a keyword with the notable | **100%** (289/290; the exception is Piercing Shots over projectile smalls); every small does: 95% |
| entrances: edges leaving the group      | 1: **72%**, 2: 10%, 3: 3%, 4+: 15%; one attach node: 79%                                          |
| the notable's position                  | dead end 45%, pass-through (degree 2) 47%, junction 7%                                            |
| keystone groups                         | 27; 26 are a lone keystone; one holds two keystones with three themed smalls                      |

Three clusters in four are a cul-de-sac entered at one node; the pass-through ones are mostly wheels with the notable on
the far side. A single-notable cluster of 3–4 nodes is the mode.

> **Suggestion:** 2–3 smalls per notable, one entrance for three clusters in four, and smalls that always carry the
> notable's keyword is the proven proportion. Where the player never reads a tooltip in combat the 100% keyword agreement
> matters more than the size: a cluster should be guessable from one word.

## 4. Notables and keystones

| measure                                                         | value                                                                                                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lines per node                                                  | small 1.65, notable 3.3 (1: 20, 2: 47, 3: 94, 4: 114, 5: 47), keystone 1.0                                                                                |
| notable vs its own group's smalls, all lines (crude number-sum) | median **3.1×** (IQR 2.2–4.2); tree-wide medians small 12, notable 48, keystone 30                                                                        |
| same, only lines sharing a keyword with the smalls (matched)    | median **4.9×** (IQR 3.2–7.1); 92% ≥ 2×, 3% < 1×                                                                                                          |
| unpriced by the yardstick                                       | 24 notables with a numberless line (`Hits that Stun Enemies have Culling Strike`), "+1 maximum" lines, conditionals                                       |
| steps to the nearest other notable                              | median **5** (IQR 3–6); to one in another group: median 5 (IQR 4–6)                                                                                       |
| detour from the nearest road or junction node to a notable      | median **2** (0: 26, 1: 53, 2: 114, 3: 105, 4: 52, 5–6: 6)                                                                                                |
| keystones                                                       | **28** in 3.9; **49** on today's tree, sourced (https://poedb.tw/us/Keystone)                                                                             |
| keystone depth (0 centre, 1 rim)                                | < 0.33: 4 · 0.33–0.66: 7 · ≥ 0.66: **17**; median 0.81; per sector templar 7, marauder 5, shadow 5, ranger 4, witch 4, duelist 3                          |
| keystone degree and approach                                    | 26 of 28 are dead ends; **26 of 28 hang one step off a junction**; Mortal Conviction 4, Phase Acrobatics 5 (behind Acrobatics); nearest notable 2–7 steps |

All 28 keystones classified from their lines:

| class                                                   | n   | keystones                                                                                                                                                                                                     |
| ------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| penalty for a buff (a `less` / `cannot` / `never` line) | 13  | Elemental Equilibrium, Perfect Agony, Crimson Dance, Elemental Overload, Wicked Ward, Vaal Pact, Unwavering Stance, Resolute Technique, Chaos Inoculation, Acrobatics, Runebinder, Point Blank, Arrow Dancing |
| conversion (`instead`: one resource becomes another)    | 6   | Necromantic Aegis, Iron Reflexes, Eldritch Battery, Blood Magic, Zealot's Oath, Ghost Reaver                                                                                                                  |
| restriction (forbids a way of playing)                  | 3   | Ancestral Bond, Avatar of Fire, Mortal Conviction                                                                                                                                                             |
| conditional buff, no stated cost                        | 3   | Pain Attunement (low life), Mind Over Matter (mana is spent), Minion Instability                                                                                                                              |
| pure buff                                               | 3   | Conduit (party only), Iron Grip, Phase Acrobatics                                                                                                                                                             |

**22 of 28 (79%) carry an explicit cost**, and the pure buffs are narrow enough to be trades in practice. Evidence of the
form: `Your hits can't be Evaded / Never deal Critical Strikes`.

> **Suggestion:** a notable worth 3–5 of its own smalls (matched median 4.9) and 2 steps off the road is the rate; Bob's
> T2 floor of "at least 2 smalls" sits at the crude yardstick's 25th percentile (2.2) and below the matched one's (3.2).
> Keystones at the rim, one step off a junction, dead-ended, four in five with a written cost; with no manual play the cost
> must be one the sheet can show (a stat that goes down), not one the player's hands would feel.

## 5. Decisions

Estimated from structure: a greedy walk from each start that repeatedly takes the nearest unallocated notable or keystone
by shortest path until 120 points. It is a notable collector, not a build (it takes 12–22 keystones because it prices every
keystone alike; a real build takes 1–3, **recalled**). Counts on the allocated subgraph:

| start    | notables | notable clusters | choice points passed | branch points in the build | spur detours (notable at a spur tip) | sectors entered | crossing edges | points on roads |
| -------- | -------- | ---------------- | -------------------- | -------------------------- | ------------------------------------ | --------------- | -------------- | --------------- |
| marauder | 28       | 25               | 55                   | 29                         | 24                                   | 6               | 18             | 50              |
| ranger   | 26       | 24               | 53                   | 28                         | 22                                   | 5               | 16             | 52              |
| witch    | 35       | 28               | 50                   | 24                         | 28                                   | 4               | 12             | 37              |
| duelist  | 32       | 29               | 46                   | 24                         | 28                                   | 4               | 12             | 44              |
| templar  | 34       | 28               | 49                   | 24                         | 23                                   | 4               | 10             | 35              |
| shadow   | 36       | 28               | 54                   | 32                         | 29                                   | 4               | 10             | 35              |

The kinds, per 120 points: **which road at a fork** — 46–55 junctions, one every 2–3 points; **detour for a notable** —
22–29 spurs of 2–3 nodes; **cross a region** — 4–6 sectors touched, 3–5 real crossings (the edge count includes hybrid
borders); **a keystone's trade** — 1–3 taken, the first within 5–13 steps of the start; **a mastery's pick** (since 3.16;
sourced https://poedb.tw/Passive_mastery): one per cluster where a notable is taken, "shared with all clusters on the tree
that have the same theme", each "can only be allocated a single time", 61 masteries of 2–15 options (316 in all) → 24–29
offers per build, of which a player takes about 8–12 (**recalled**). Overall a decision about every 2 points, with a third
of the points spent on the road between them.

> **Suggestion:** about 50 forks, 25 detours, 4 crossings and 2 keystones per full build is the reference density; for a
> 25-minute run on a phone the fork count can drop (fewer, clearer junctions) while detours and keystones, the readable
> decisions, stay.

## 6. Locality

Share of nodes (any kind) whose lines mention the keyword, in the busiest sector and the busiest two:

| keyword                                                                           | nodes              | top sector       | top share  | top two          | sectors with any |
| --------------------------------------------------------------------------------- | ------------------ | ---------------- | ---------- | ---------------- | ---------------- |
| wand                                                                              | 27                 | witch            | **100%**   | 100%             | 1                |
| trap/mine                                                                         | 53                 | shadow           | 79%        | 91%              | 4                |
| staff                                                                             | 37                 | templar          | 78%        | 100%             | 2                |
| bow                                                                               | 36                 | ranger           | 75%        | 89%              | 3                |
| dagger / claw                                                                     | 24 / 24            | shadow           | 67%        | 100%             | 2                |
| evasion                                                                           | 68                 | ranger           | 63%        | 84%              | 3                |
| chaos                                                                             | 36                 | shadow           | 61%        | 83%              | 4                |
| melee                                                                             | 80                 | marauder         | 59%        | 89%              | 5                |
| poison / bleed                                                                    | 25 / 21            | ranger / duelist | 56% / 52%  | 88% / 95%        | 3                |
| two-handed / dual wield                                                           | 27 / 42            | duelist          | 56% / 45%  | 100% / 74%       | 2 / 4            |
| axe / mace / sceptre                                                              | 28 / 34 / 34       | marauder         | 50%        | 100% / 76% / 76% | 2 / 3 / 3        |
| energy shield                                                                     | 83                 | witch            | 51%        | 84%              | 4                |
| minion                                                                            | 68                 | templar          | 49%        | **94%**          | 3                |
| sword / spell / lightning / cold                                                  | 28 / 146 / 29 / 35 | ranger / witch   | 45–46%     | 71–75%           | 3–6              |
| fire, elemental, aura, curse, totem, shield                                       | 24–135             | varies           | 32–34%     | 53–66%           | 5–6              |
| life, mana, attack, crit, block, resist, accuracy, leech, charges, area, duration | 51–462             | —                | **23–35%** | 43–59%           | **6**            |

Two populations: **weapons and delivery mechanics** (wand, bow, staff, dagger, claw, trap, two-handed, minion) have a home
sector at 45–100% and a top-two at 74–100%; **generic stats** (life, mana, crit, block, resist, accuracy, leech, charges,
area, duration) sit at 23–35% in their top sector and appear in all six. Elements sit between (34–45%, five sectors).
Melee is the one archetype with a strong home (89% in two sectors) that still touches five.

> **Suggestion:** archetype = a home with about three quarters of its nodes and a neighbour with the rest; generic = flat
> across all regions. With six classes and no ascendancies the home sector carries the whole class identity, so the 75/25
> split (not 100) is what lets a class borrow a neighbour's weapon.

## 7. Attributes

| measure                                                                  | value                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bare attribute nodes (only `+N to <attribute>` lines)                    | **220 = 13.6%** of nodes; any attribute line: 277 (17%)                                                                                                                   |
| sizes                                                                    | +10 × 202, +15 × 6, +30 × 12                                                                                                                                              |
| per sector (bare attribute share; which attributes)                      | marauder 16% (32 str of 36), ranger 13% (34 dex of 38), witch 11% (29 int of 32), duelist 13% (14 str, 16 dex), templar 16% (19 str, 20 int), shadow 12% (13 dex, 20 int) |
| where they sit                                                           | 188 of 220 in road groups; mean degree **3.85** vs 2.04 for every other node; 141 of the 353 junctions are a bare attribute node                                          |
| steps from a start to the first node of each attribute (str / dex / int) | marauder 3 / 8 / 11 · ranger 11 / 3 / 8 · witch 8 / 11 / 3 · duelist 3 / 4 / 9 · templar 3 / 9 / 4 · shadow 9 / 4 / 3                                                     |
| steps to the third such node                                             | pure classes 10–12 for either off attribute; hybrids 5–11                                                                                                                 |

What attributes do, per point: Dexterity 2 accuracy and 1% evasion per 5 points, sourced via the wiki
(https://www.poewiki.net/wiki/Dex); Strength 0.5 life and 1% melee physical damage per 5, Intelligence 0.5 mana and 1%
energy shield per 5, **recalled** (the wiki was unreachable); gear and gems carry attribute requirements, the main reason to
buy an off attribute, **recalled**. Off-attribute cost from a pure start: **8–11 points to the first off-attribute dot,
10–12 to the third**, so +30 costs a route, not a node; from a hybrid start 4–9 and 5–11. The attribute dots are the
skeleton (roads and junctions), and a build spends 28–43% of its points on them (section 5).

> **Suggestion:** attribute nodes at 12–16% of each region, placed as the junctions, make the road legible and give travel a
> small reward; about 10 points to an off attribute is the price that keeps a class in its corner. Bob has no gear
> requirements, so an attribute's job must be a direct stat, or the dots are only tax.

## 8. Communication

Sourced from https://poedb.tw/us/Passive_skill (the in-game help text) and https://www.pathofexile.com/passive-skill-tree;
the rest recalled.

| device                         | what it does                                                                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| three colour sectors (sourced) | "north (blue, magic), southwest (red, melee), southeast (green, ranged)"; nodes near a border are hybrid; each class starts "at a different spot on the inner wheel"          |
| node frames (sourced)          | notables have "slightly larger icons, specific names and larger effects"; keystones larger again with a distinct frame (recalled); masteries sit "at the centres of clusters" |
| icons (recalled)               | every node has an icon of its stat family; a cluster reads as a patch of one icon; a road as a row of the three attribute icons                                               |
| search (sourced)               | a word highlights every node whose name or effect contains it "with a pulsing glow", visible when zoomed out                                                                  |
| class art (recalled)           | a painting of each class behind its start; ascendancy sub-trees drawn as small separate circles outside the ring beside their class                                           |
| not used                       | no drawn group names, no labels at any zoom level, no region borders beyond the three tints; the only "where is X" tool is search                                             |

> **Suggestion:** the reference answers "where does a theme live" with icon patches, three tints, class art and a search box,
> nothing else; on a phone the tint and the icon patch work at full zoom-out, and a tap-to-highlight by keyword is the
> cheapest equivalent of search.

## 9. Aesthetics

| depth band (0 centre → 1 rim) | nodes   | notables | keystones | groups | nodes per unit area | notables per 100 nodes |
| ----------------------------- | ------- | -------- | --------- | ------ | ------------------- | ---------------------- |
| 0.0–0.2                       | 93      | 18       | 0         | 24     | 740                 | 19                     |
| 0.2–0.4                       | 94      | 14       | 4         | 44     | 249                 | 15                     |
| 0.4–0.6                       | 459     | 98       | 4         | 170    | 731                 | 21                     |
| 0.6–0.8                       | **629** | 158      | 5         | 206    | 715                 | 25                     |
| 0.8–1.0                       | 350     | 81       | 15        | 92     | 309                 | 23                     |

Per sector: nodes 221 (marauder) to 303 (shadow), groups 80–104, notables 49–72, keystones 3–7, reach 0.86 (witch) to
1.00 (ranger).

Density is **not** a gradient: a dense core (starts and signature wheels), a sparse ring at 0.2–0.4 (the roads out of the
starts), the bulk at 0.4–0.8 (67% of nodes), and a thinner rim where the keystones sit (15 of 28 in the outer fifth).
Sectors differ by ±15% in size and reach, so the silhouette is a ring with an uneven edge and the ascendancy circles as
spokes outside it (recalled). Dark space (recalled; no coordinates in the data): the 0.2–0.4 ring reads as a moat around
the starts, the gaps between the big rim wheels are where the eye rests, and at full zoom-out it lands on the wheels and
the class art, not on any node.

> **Rejected (the user, 2026-10-20):** the moat described above was recalled, not measured, and the network should be dense all the
> way out. What stands of this suggestion:
>
> **Suggestion:** regions unequal in size and reach (±15%) are what make a silhouette remembered; keystones in
> the thin outer fifth are landmarks because they sit where the density falls off.

## 10. Node types

| type            | count (3.9 data; later)                                                                                                        | what it adds                                      | cost to build                                | suits a game with no manual play?                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| small           | 1,228 (the site blurb says "1325 skills" for the whole tree, version unstated, https://www.pathofexile.com/passive-skill-tree) | a 1–2 line stat; roads and filler                 | low                                          | yes                                                                              |
| notable         | 356 (+13 anoint-only); 1–5 lines                                                                                               | the cluster's reason; 3–5 smalls' worth           | medium: name, icon, lines, balance           | yes                                                                              |
| keystone        | 28; 49 today (sourced poedb)                                                                                                   | a rule change, 79% with a written cost            | high: engine work each; the bot must read it | if the cost is a sheet stat; not if it needs hands (dodge timing, low-life play) |
| jewel socket    | ≥ 19 seen; 21 sourced (https://poedb.tw/us/Passive_skill; 21 since The Awakening, https://pathofexile.com/theawakening/jewels) | a gear slot, "grant nothing by themselves"        | high: an item system                         | not without an item economy                                                      |
| mastery (3.16+) | 61 types, 2–15 options, 316 in all (sourced poedb)                                                                             | a pick per cluster entered, one point, no repeats | medium-high: 316 lines and a picker          | yes: a pick with no execution cost                                               |
| ascendancy      | 19 classes, 8 points, a sub-tree each (sourced via https://www.poewiki.net/wiki/Ascendancy)                                    | the build's identity, earned mid-game             | high: 19 trees and a gate                    | out of scope; the mid-run identity role falls to keystones                       |
| class start     | 6 + Scion; a 3-chain or 3 × 3 arms, 2 exits                                                                                    | the first 3–9 points, one stat                    | low                                          | yes                                                                              |

> **Suggestion:** small, notable and keystone are enough for an auto-battler as long as a keystone's cost is a stat; a
> mastery-like pick (one choice per cluster, no execution) is the cheapest way to add decisions without nodes, if ever
> wanted; jewel sockets and ascendancies are item and progression systems, not tree features, and stay out.
