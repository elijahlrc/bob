# A3. The rules of this game that shape a tree

Phase A of [PASSIVE-TREE.md](../../PASSIVE-TREE.md), step A3, 2026-10-19. Facts only, with file:line pointers; no design
decisions. Numbers from the bot are one run per class on seed 3 (`npm run sim -- --runs 1 --class all --seed 3 [--legacy]`,
dumps in the session scratchpad), so they are a sample, not a measurement; the larger older measurements are quoted from
`docs/PROGRESS.md` where they exist.

## 1. Points over time

**The rules.** One passive point per character level (`passivePoints`, `src/run/run.ts:510-511`: `level - 1 + bonusPoints -
allocated`), +3 bonus on clearing each of maps 10, 20, ..., 80 (`run.ts:377`), +1 refund point on every cleared map
(`run.ts:374`). 99 + 24 = 123 (DESIGN.md 5.3, lines 170-174). Level 100 is the cap (`MAX_LEVEL`, `src/data/xpTable.ts:14`).
Points after clearing map n = (level - 1) + 3 x min(8, floor(n / 10)); for a death on map n the bonus is floor((n - 1) / 10)
because the bonus is paid on the clear.

**The level curve.** `xpToNext(L)` is the mean XP the bot earns clearing a map at area level L (`src/data/measuredXp.ts`,
written by `npm run sim -- --write-xp`; `xpTable.ts:34-37`), times 1.0 below level 90 rising to 1.3 at 99 (`kFactor`,
`xpTable.ts:29-32`), so level ~ map by construction (DESIGN.md 5.4, target +-4). What the bot produces today:

| Map cleared | Level, default difficulty (seed 3, n) | Level, legacy difficulty (seed 3, n) | Level, PROGRESS.md:152 (60 runs, old curve) | Points held (from the legacy column) | Refund points |
| ----------- | ------------------------------------- | ------------------------------------ | ------------------------------------------- | ------------------------------------ | ------------- |
| 1           | 1 (6)                                 | 1 (6)                                | 1                                           | 0                                    | 1             |
| 5           | 5 (6)                                 | 5 (6)                                | -                                           | 4                                    | 5             |
| 10          | 11 (6)                                | 11 (6)                               | 11                                          | 13                                   | 10            |
| 15          | 15 (6)                                | 15 (6)                               | -                                           | 17                                   | 15            |
| 20          | 20 (3)                                | 20 (6)                               | -                                           | 25                                   | 20            |
| 25          | 27 (3)                                | 27 (6)                               | 25                                          | 32                                   | 25            |
| 30          | 33 (2)                                | 33 (5)                               | -                                           | 41                                   | 30            |
| 40          | -                                     | 44 (4)                               | -                                           | 55                                   | 40            |
| 50          | -                                     | 55 (4)                               | 51                                          | 69                                   | 50            |
| 60          | -                                     | 67 (4)                               | -                                           | 84                                   | 60            |
| 70          | -                                     | 79 (4)                               | -                                           | 99                                   | 70            |
| 75          | -                                     | 84 (4)                               | 75                                          | 104                                  | 75            |
| 80          | -                                     | 89 (4)                               | -                                           | 112                                  | 80            |
| 90          | -                                     | 99 (4)                               | 90                                          | 122                                  | 90            |
| 100         | -                                     | 100 (2)                              | 99                                          | 123                                  | 100           |

- Default difficulty (what players get: scaling 1.75, base 1.8, variance 0.3, `src/data/difficulty.ts`) killed every bot
  between maps 20 and 40 this run (TELEMETRY.md:205-207 says the same: the bot dies by map 20 on the default curve), so
  the default column stops there. The legacy column is the only full curve; the XP rule does not depend on difficulty.
- The bot now runs ahead of the curve: +2 at map 25, +3 at 30, +5 at 50, +9 at 75, level 99 at map 90. PROGRESS.md:610 and
  :638 saw 27 / 53 / 79-81 at 25 / 50 / 75 after the map-choice work. The last point (123) needs level 100, which this run
  reached on maps 90-92; a run that ends at level 99 has 122. A player at the DESIGN.md pace (level = map after the clear) would
  hold 10 points at map 10 (9 + 3), 30 at map 25, 60 at map 49, 90 at map 70 (69 + 21), 123 at map 100.

**When a run holds 10, 30, 60, 90, 123 points** (first cleared map at or past the threshold, per bot run, legacy): 10 at map
10 (all six classes); 30 at map 23 (all); 60 at map 42-45; 90 at map 64; 123 at map 91-92. Default difficulty: the same to
map 23, then dead.

**When players actually die.** `deaths.local.html` at the repo root (rendered by `scripts/deaths.ts` from the `runs` table:
95 deaths, 2026-10-08 to 10-13, several game versions, median level 3, deepest level 64 on map 60; 43 of 95 are Striders).
From its dots (level and map of each death):

| Quantile | Map at death | Level at death | Passive points ever held (level - 1 + bonus) |
| -------- | ------------ | -------------- | -------------------------------------------- |
| p10      | 2            | 1              | 0                                            |
| p25      | 2            | 2              | 1                                            |
| p50      | 4            | 3              | 2                                            |
| p75      | 10           | 10             | 9 (no bonus: the death is on map 10)         |
| p90      | 16           | 20             | 22                                           |
| max      | 60           | 64             | 78                                           |

Deaths by map band: 1-2: 27, 3-5: 30, 6-10: 25, 11-20: 7, 21-30: 2, 31-50: 3, 51+: 1. Only 25 of 95 died at level 10 or
above and 5 at level 30 or above. The level and map quantiles are taken separately, so the points column is approximate.
The exact count of allocated passives at the end of every run is in `details.passives` (`src/run/telemetry.ts:72`), but reading
the table needs the secret key (`scripts/deaths.ts:6-11`); the local snapshot holds only class, level, map and version.

## 2. Refunds and allocation (`src/run/tree.ts`)

| Rule                       | Where                         | Exactly                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Path to a node             | `pathTo`, tree.ts:5-37        | Breadth-first search from the allocated set plus the own class start, through unallocated nodes only; never through any start node (line 28); a start is never a target (line 16). Returns the shortest path of unallocated nodes, so a click on a far node buys the whole road.                                                                                   |
| Allocate                   | `allocate`, tree.ts:61-66     | Takes the whole path or nothing: refused when the path is longer than the points held (line 63). One point per node. No partial walk.                                                                                                                                                                                                                              |
| Refund                     | `refund`, tree.ts:69-74       | One node per call, costs one refund point (line 71), refused when `canRemove` is false.                                                                                                                                                                                                                                                                            |
| Connectivity               | `canRemove`, tree.ts:40-58    | After removing the node, every other allocated node must still be reachable from the own start through allocated nodes (a BFS over `rest`; line 57). So only a leaf of the allocated set, or a node on a cycle, can be refunded.                                                                                                                                   |
| **A notable's road stays** | consequence of `canRemove`    | Refunding a notable at the end of a stub leaves its road nodes allocated; they come back one at a time, tip first, one refund point each. No bulk refund, no "refund the stub". Three simulated players raised it (`docs/tree/playtest/triage-round1.md:17`, `triage-round2.md:19`; TREE-REDESIGN.md:548), verdict "Later": a rule of the game, not of the layout. |
| Refund points              | run.ts:374                    | +1 per cleared map, never capped, never spent on anything else; a 100-map run earns 100.                                                                                                                                                                                                                                                                           |
| Screen text                | TreeView.tsx:617-627, 639-645 | "Click to refund (1 refund point)" / "No refund points" / "Other passives depend on this one"; "N points - not enough points".                                                                                                                                                                                                                                     |

The bot never refunds (`src/run/bot.ts:46` imports only `allocate` and `pathTo`). The random player does: a random walk
outward from the start, and a `refund` move that gives back a random removable node (`src/run/randomBot.ts:136-147`).

## 3. Run structure

| Fact                     | Value                                                                                                                                                                                                                               | Where                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| A run                    | A fresh character every time: Title -> Class -> [Camp -> Map] x 100 -> Victory; death ends the run (no XP penalty: the run is over).                                                                                                | DESIGN.md 5.1 (lines 126-138), 5.4:202                 |
| Length                   | Target 90-120 s a map at 1x; about 3 h at 1x, about 25 min at 8x. The bot's mean map time today is 76-139 s at 1x by class (default difficulty).                                                                                    | DESIGN.md:167; sim output, seed 3                      |
| Where the tree is opened | In camp, between maps. The Next button walks Items -> Skills -> Passive tree -> Next map; the tree is a step **only while points are unspent** (`nextStep`, `points > 0`); a new run starts inside map 1, not in camp.              | STREAMLINE.md:48-55, :118-119; `src/ui/Camp.tsx:49-61` |
| How often                | Level ~ map, so nearly every cleared map leaves a point and the walk stops at the tree: up to about 100 forced visits a run, each with 1 to 4 points to spend (1 per level, 4 on the maps that pay the bonus).                      | derived from section 1                                 |
| How long per visit       | **Unknown.** Telemetry records one row per ended run: `seconds` is map time summed over the history, `passives` the count allocated; no camp time, no tab, no tree-open count (`src/run/telemetry.ts:64-75`; `docs/telemetry.sql`). | TELEMETRY.md:9-21                                      |
| The tab's badge          | "Passive tree (N)" shows the unspent points.                                                                                                                                                                                        | Camp.tsx:427-428                                       |
| First gems               | No gems at the start; the first skill gems are picks after maps 1-4 (`SKILL_REWARD_MAPS = 4`), so the first 4 points are spent before the build's skill is known.                                                                   | DESIGN.md:142-144; run.ts:421                          |

## 4. The tree screen (`src/ui/TreeView.tsx`, `treeStyle.ts`, `treeHit.ts`, `tree.css`, `treeSearch.ts`)

The tree today: 2,618 nodes (6 starts, 694 travel, 1,446 small, 445 notable, 27 keystone; `getTree()` over
`src/data/tree/treeBaked.ts` plus `treeEdits.json`, which is empty). Six regions of 60 degrees centred at -90, -30, 30, 90,
150, 210 degrees (`src/data/tree/spec.ts:50-90`), hub ring at radius 520, start ring at 800 (`spec.ts:112-113`).

**What it draws**

| Thing                        | How                                                                                                                                                                                                                                                                                                                   | Where                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Backdrop                     | One 60-degree wedge per region (`reg.angle +- 30`), filled with a radial gradient in the mix of the region's attribute colours (0 opacity at the centre to 0.26 at the rim); a faint divider line per wedge; two rings (hub 520, start 800); a gold rim at maxR+120 and a thin one at +170.                           | TreeView.tsx:59-107; tree.css:19-40                                          |
| Region names at zoom-out     | Yes, but they are the **attribute words** ("Strength", "Dexterity · Intelligence"), one per wedge at radius maxR+420, 150 tree units tall, gold at 0.55 opacity. They scale with the tree (150 x k px: 33 px at k 0.22, 7.5 px at the 0.05 floor).                                                                    | TreeView.tsx:108-123; tree.css:41-44                                         |
| Node colour                  | `--t` per node from `toneOf`: the tone of its first line that is not a plain attribute, else the attribute's, else `utility`; 21 tones with fixed hex colours (`TONE_COLOR`). The ring stroke and the pip fill take the tone.                                                                                         | treeStyle.ts:9-54, 107-163; tree.css:83-90                                   |
| Node shapes                  | Keystone: octagon rim (r 47) + octagon ring (37) + glyph x1.5. Notable: circle rim (30) + ring (23) + glyph x0.95. Start: rim 42 + ring 34, filled with the class colour for the own start. Small / travel / hub: a ring of radius 10 / 8 / 10 and a dot of 4.4 / 3.4.                                                | TreeView.tsx:267-305; treeStyle.ts:166-173                                   |
| Emblems                      | One path per tone (`TONE_GLYPH`, our own shapes), on notables and keystones only; the three attributes and `all` share one diamond. Small nodes get a dot, never an emblem.                                                                                                                                           | treeStyle.ts:57-80; TreeView.tsx:274, 282                                    |
| Minimum size when zoomed out | A kind is never drawn below a screen radius (start 12, keystone 11.5, notable 7.5, small 3, travel 2.6 px) at k >= 0.22, falling to 35% of that with the whole tree in view; `shapeScale` grows the shape to keep it.                                                                                                 | treeStyle.ts:176-192; TreeView.tsx:171-189                                   |
| Labels                       | Names only for notables, keystones and starts (`.lb`). Keystone and start names from k >= 0.14 (`LABEL_K_KEYSTONE`), notable names from k >= 0.4 (`LABEL_K_NOTABLE`); small, travel and hub nodes are never labelled. Label text is a constant 13 / 11 / 15 screen px whatever the zoom (`--fs`, `--fs-s`, `--fs-b`). | TreeView.tsx:183-188, 321-333; treeStyle.ts:195-196; tree.css:177-210        |
| Edges                        | An arc about the shared `orbit` centre (a cluster loop), an arc about the tree centre for a ring road (`isRingRoad`), else a straight line. Allocated edges get `edge on` plus a `glow` copy; allocated nodes a gold `halo`; nodes one step from the build get `can` (brighter ring, gold rim).                       | treeStyle.ts:212-229; TreeView.tsx:250-265, 306-319; tree.css:51-66, 127-152 |
| The allocated path preview   | Hover (mouse) or first tap (touch) draws the shortest path to the node (`pathTo`) as `edge path` lines and `path-ring` circles, and says its cost.                                                                                                                                                                    | TreeView.tsx:346-349, 579-602; tree.css:170-175                              |
| Hover card / tap dock        | Mouse: a tooltip by the cursor (name, the mod lines from `modsText`, a cost or refund hint). Touch: a dock at the bottom with the same text and an Allocate / Refund button; the second tap on the same node also commits.                                                                                            | TreeView.tsx:472-486, 605-672                                                |
| Search                       | A box in the bar; every word must appear in the node's name or mod text, in any order, as part of a word (`searchMatches`); the matches are ringed in cyan (`.sr`) and "Next" recentres on each at k >= 0.4. Built after round 2 of the playtests.                                                                    | TreeView.tsx:147-157, 363-373, 496-520; treeSearch.ts; tree.css:276-280      |
| Legend                       | A `<details>` of the 20 tone labels with their glyphs plus "Notable" and "Keystone" lines; **desktop only** (`!small`).                                                                                                                                                                                               | TreeView.tsx:540-560; treeStyle.ts:83-104                                    |
| Camera                       | Zoom 0.05 to 1.5 (`K_MIN`, `K_MAX`). Desktop opens at k 0.22 centred on the class start; a small screen fits the start plus the allocated nodes with a 450-unit margin, never below k 0.15 (`FIT_MIN_K`). Wheel zoom at the cursor; the view keeps its centre on resize or rotation.                                  | treeHit.ts:10-13, 50-68; TreeView.tsx:36-37, 195-238, 375-385                |

**What it cannot draw today** (each would be new code)

- Theme, district or cluster names: nothing but the attribute words is written on the backdrop. Every baked node carries a
  `district` field (treeBaked.ts) that the view never reads (no `district` in TreeView.tsx or tree.css). Round 2 asked for
  cluster labels and was declined under the old D1 (`triage-round2.md:10`).
- Any silhouette but six equal wedges: the wedges, dividers and name positions are computed from `REGIONS[].angle +- 30`
  and the two fixed ring radii; a region of another shape, an uneven sector, an island or an arbitrary background shape has
  no drawing code. Edges are arcs only where the generator wrote `orbit` or the pair is a ring road; a hand-placed node gets
  straight lines.
- Labels on small or travel nodes, group labels, a label at any zoom for a notable below k 0.4, emblems on small nodes,
  a differently shaped small node (all small kinds are the same circle and dot).
- Images or art of any kind (every mark is an SVG path or circle), a minimap, region highlighting on hover, a drawn outline
  round a cluster, a legend on phones.

**Phone constraints** (docs/MOBILE.md and the code)

| Constraint   | Value                                                                                                                                                                   | Where                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Tap target   | 44 px floor for buttons and rows on a coarse pointer (`--tap: 44px`); 16 px inputs (iOS zoom); 14 / 12 px text floor.                                                   | MOBILE.md:108-112, 156                                    |
| Node hit     | The nearest node within 22 screen px (`FINGER_PX`), whatever is drawn: a small node is about 5 px across at k 0.22.                                                     | TreeView.tsx:35, 456; treeHit.ts:15-34; MOBILE.md:111-112 |
| Commit       | First tap previews (dock), the second tap on the same node or the dock button commits; a pan of more than 10 px (4 px with a mouse) is never a tap.                     | TreeView.tsx:436, 447-465; MOBILE.md:195-197              |
| Zoom         | Two-finger pinch (`pinchView`: the tree point under the fingers' midpoint stays under it) plus + / - (x1.4) and Centre buttons shown on small screens; the wheel stays. | treeHit.ts:36-47; TreeView.tsx:351-361, 521-533           |
| Layout floor | The Interface size picker never lays a phone out under 270 px; every screen was checked at 277 px (a 360 px phone at 130%).                                             | MOBILE.md:452-456                                         |
| Real device  | Not yet done: the real-device pass (P7) is the open item.                                                                                                               | MOBILE.md:459                                             |

## 5. The bot and the sims

| Tool                      | Command                                                                                                           | What it does with the tree                                                                                                                                                                                                                                                                                                                                                                                                                                  | What it measures                                                                                                                                                    | Time (measured 2026-10-19 unless noted)                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `botAllocate`             | inside every bot camp (`src/run/bot.ts:220-254`, called at :600)                                                  | Greedy: every camp, while points remain, candidates are the unallocated nodes within 6 links (`maxDepth`) and within the points held; travel nodes count only when adjacent (line 243); value = (score with the path - score) / score / path length (line 247); the best is bought whole; a zero-value node is still taken (line 251). Score = weighted geometric mean of the clearing and boss sheet scores (`scoreBuild`, bot.ts:117-136). Never refunds. | -                                                                                                                                                                   | part of a bot run                                                                                                                                                                  |
| `scripts/simulate.ts`     | `npm run sim -- --runs N --class all [--seed S] [--legacy] [--maps 1-20] [--dump f] [--log b]`                    | The bot plays whole runs: camp (gear, gems, tree, offers, wayside) and the headless map sim.                                                                                                                                                                                                                                                                                                                                                                | Map reached, deaths by map, median level at 25/50/75, map time, attrition, enemies met; `--write-xp` regenerates the level curve; `--log` sends rows to `sim_runs`. | Default difficulty: 2.7-12 s wall a run (dies by map 20-40; 310-640x real time). Legacy: 6-87 s a run (57-70 s for a 90-100 map run; 83-360x). 6 runs: 41 s default, 5 min legacy. |
| `scripts/simpar.sh`       | `scripts/simpar.sh <dir> <runs per class> <chunk> [sim flags]`                                                    | The same, one process per class and chunk, merged with `--merge`.                                                                                                                                                                                                                                                                                                                                                                                           | Same report over more runs.                                                                                                                                         | PROGRESS.md:141-153: 60 runs in 218 s on the old curve                                                                                                                             |
| `scripts/random-play.ts`  | `npm run random -- [--runs 10] [--maps 30] [--moves 8]`                                                           | A player who plans nothing: random camp moves, among them a random tree step outward and a random refund (`src/run/randomBot.ts:136-147`).                                                                                                                                                                                                                                                                                                                  | How early a planless run ends: 6 of 6 died on maps 2-4 this run (median 2.5).                                                                                       | 1.1 s for 6 runs                                                                                                                                                                   |
| `scripts/duel.ts`         | `npm run duel -- --a vanguard:3:10 --b strider:3:10 [--seeds 1,2] [--both]`                                       | Plays the bot to the named map for each side (so its tree is the bot's), then fights the two builds.                                                                                                                                                                                                                                                                                                                                                        | Winner, how and when, damage dealt and taken per source.                                                                                                            | 4 s (2.7 s to build two map-10 characters, 63 ms a fight)                                                                                                                          |
| `scripts/ladder-probe.ts` | `npx tsx scripts/ladder-probe.ts [--legacy] [--duel 20,40,60]`                                                    | Snapshots the bot's builds at maps 5-100 and fights them in a matrix.                                                                                                                                                                                                                                                                                                                                                                                       | Build size, duel speed, whether duels tell builds apart.                                                                                                            | not timed                                                                                                                                                                          |
| `npm run tree:explore`    | `-- new <class> --build b.json`, `show`, `near`, `reach`, `region`, `find`, `path`, `alloc`, `unalloc`, `summary` | The terminal interface of the simulated players: a build is a JSON of class and node ids; costs are path lengths from the build.                                                                                                                                                                                                                                                                                                                            | What a node gives and costs from a build.                                                                                                                           | instant                                                                                                                                                                            |
| `npm run tree:audit`      | -                                                                                                                 | Prints the tree's measurements (counts, steps, shares); nothing passes or fails.                                                                                                                                                                                                                                                                                                                                                                            | -                                                                                                                                                                   | seconds                                                                                                                                                                            |

## 6. Attributes in Bob

**What a point gives** (`src/data/constants.ts:33-38`; applied in `src/calc/character.ts:729-750`; DESIGN.md 6.2):

| Attribute    | Per point                                        | Per +10 node | Notes                                                                                                                                                        |
| ------------ | ------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Strength     | +0.5 life; +0.2% increased melee physical damage | +5 life, +2% | The melee bonus also reaches projectile attacks under the `strongarm` flag (character.ts:740-747) and spells with Steel Resolve-style supports (:1452-1462). |
| Dexterity    | +2 accuracy; +0.2% increased evasion             | +20, +2%     | No evasion bonus under `evasionToArmour` (Plated Hide; character.ts:748-749).                                                                                |
| Intelligence | +0.5 mana; +0.2% increased energy shield         | +5 mana, +2% |                                                                                                                                                              |

Attributes do not grow with level: `attrs` is the sum of base `str`/`dex`/`int` mods plus `allAttr`, times any multiplier
(character.ts:698-701), so the class start, the tree and gear are the only sources.

**Class starts** (`src/data/classes.ts`; DESIGN.md 5.2): Vanguard 32/14/14 (2H mace), Strider 14/32/14 (bow), Mystic 14/14/32
(wand), Reaver 23/23/14 (sword and shield), Zealot 23/14/23 (sceptre and shield), Shade 14/23/23 (two daggers). A class's
main attribute is 32, the others 14; a hybrid has 23/23/14.

**What attributes gate.**

- Gear: `canEquip` refuses an item whose base requirement (a unique's own if higher; `reqReduction` cuts it) exceeds the
  character's attributes without the item being replaced (`src/run/inventory.ts:64-75`; `src/calc/items.ts:105-112`).
  Requirements are the reference numbers times `REQUIREMENT_SCALE = 1` (`src/data/bases.ts:15`, 57-61), from
  `src/data/baseTables.ts` (str/dex/int at the nearest base at or below each level; the top base of the family last):

| Family          | L1      | ~L20    | ~L40     | ~L60      | ~L70          |
| --------------- | ------- | ------- | -------- | --------- | ------------- |
| body (armour)   | 12/0/0  | 53/0/0  | 104/0/0  | 160/0/0   | 191/0/0 (L68) |
| body (evasion)  | 0/14/0  | 0/53/0  | 0/104/0  | 0/160/0   | 0/183/0       |
| body (ES)       | 0/0/17  | 0/0/55  | 0/0/104  | 0/0/160   | 0/0/194       |
| body (ar/es)    | 10/0/10 | 28/0/28 | 59/0/59  | 84/0/84   | 99/0/115      |
| helmet (armour) | 9/0/0   | 42/0/0  | 85/0/0   | 138/0/0   | 138/0/0       |
| shield (armour) | 10/0/0  | 46/0/0  | 96/0/0   | 139/0/0   | 159/0/0       |
| bow             | 0/14/0  | 0/65/0  | 0/125/0  | 0/212/0   | 0/222/0 (L71) |
| 2H mace         | 20/0/0  | 62/0/0  | 131/0/0  | 188/0/0   | 220/0/0       |
| 1H sword        | 8/8/0   | 41/35/0 | 55/79/0  | 113/113/0 | 119/119/0     |
| staff           | 12/0/12 | 35/0/35 | 65/0/65  | 99/0/99   | 117/0/117     |
| wand            | 0/0/14  | 0/0/65  | 0/0/131  | 0/0/188   | 0/0/242 (L72) |
| dagger          | 0/9/6   | 0/30/30 | 0/55/77  | 0/113/113 | 0/121/121     |
| sceptre         | 8/0/8   | 38/0/38 | 67/0/67  | 95/0/131  | 121/0/113     |
| 2H axe          | 17/8/0  | 44/25/0 | 100/29/0 | 149/76/0  | 156/84/0      |

- Gems: a gem's natural level is the highest L <= 20 whose level requirement the character meets **and** whose attribute
  requirement it meets; the requirement runs from 10 at L1 to 98 at L20 in the gem's attribute (59 each for a hybrid)
  (`gemAttrReq`, `src/calc/gems.ts:40-57`; DESIGN.md:775-781). So even a class's own-attribute gem needs +66 over the 32
  start to reach level 20; `+N to socketed gems` ignores requirements. Gem offers favour the character's own attribute
  twice as often (four times through area level 20; PROGRESS.md:540). Two uniques carry their own requirement (Thunderknell
  120 int, Frostwrit 160 int; `uniqueReq`).

**Where attributes come from.**

| Source                      | Amount                                                                                                                                                                                                    | Where                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Tree                        | 803 of 2,618 nodes carry an attribute line; 755 are attribute-only (mostly travel nodes; the lines are +10 str on 303, +10 dex on 248, +10 int on 199; +20/+30/+40 on 50 nodes, +4 all attributes on 13). | `getTree()` counted 2026-10-19                           |
| Weapon suffix               | +8-12 to +51-55 of one attribute, by weapon class (str on sword/axe/mace/sceptre/staff; dex on sword/axe/claw/dagger/bow; int on wand/dagger/claw/staff/sceptre).                                         | `src/data/affixes.ts:415-438`                            |
| Armour and jewellery suffix | +8-12 (ilvl 1) to +51-55 (ilvl 82) of one attribute, in eight tiers, by slot family (e.g. `strGearRingAmulet` on armour, ring, amulet).                                                                   | `src/data/armourAffixes.ts:2000-2022` and the rows after |
| Ring / amulet               | +1-4 to +13-16 to all attributes (ring, weight 0.4); the amulet version alongside.                                                                                                                        | `armourAffixes.ts:2589-2605, 2692-2710`                  |

**Worked gaps** (arithmetic only): a Strider (dex 32) wanting the L60 bow (212) is 180 short, 18 travel nodes of +10 with no
gear help; a Mystic (str 14) in L59 plate (160) is 146 short; a Reaver (23/23) in the L60 sword (113/113) is 90 short in each;
a Vanguard (int 14) casting a level-20 int gem (98) is 84 short. A requirement is the same number for every class; what
differs is the start, so an off-attribute item costs a pure class 32 - 14 = 18 more attribute (two +10 nodes) than its own
attribute's, and a hybrid 23 - 14 = 9 more for its third attribute.

## 7. The save

| Fact                      | Value                                                                                                                                                                                                                                                                              | Where                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `SAVE_VERSION`            | 19                                                                                                                                                                                                                                                                                 | `src/run/run.ts:48`                     |
| Rule                      | No migrations as a rule; bumped whenever `RunState` or the tree changes; an unknown version shows "save incompatible".                                                                                                                                                             | DESIGN.md 5.5:214-215                   |
| Passives on a tree change | `migrate` sets `run.build.allocated = []` and the version; the points come back by themselves because `passivePoints` is derived from level, bonus and the allocated count. `refundPoints` is untouched. Done for versions 8-9 (TREE.md) and 10-17 (each TREE-REDESIGN iteration). | `src/run/save.ts:45-67`; run.ts:510-511 |
| What else                 | Version 18 is carried over whole (Wayside state is filled in on read); 6 and 7 are older carry-overs.                                                                                                                                                                              | save.ts:47-51, 68-88                    |
| Rivals                    | A posted rival carries its `save_version` and its tree's node ids; `rivals_for` serves only the caller's version and `validateRival` drops a build naming a node that no longer exists, so a tree change empties the rival pool until it is reseeded (`npm run sim -- --rivals`).  | TELEMETRY.md:128, 179-181, 202-207      |
| Plan                      | PASSIVE-TREE.md 6 (Phase F): the version is bumped once and passives are handed back as unspent points.                                                                                                                                                                            | PASSIVE-TREE.md:285-286, 317            |

## Unknowns

- How long a player spends on the tree screen, and how many of the forced visits are more than a click on Next: not recorded.
- The number of points the median run actually spends: `details.passives` exists but the local snapshot does not carry it;
  the median death (level 3, map 4) had at most 2 to spend.
- The level curve on the default difficulty past map 40: no bot survives it; the player telemetry has four deaths past map 30.
- The one-run-per-class bot numbers above are a sample on one seed; the 60-run measurement in PROGRESS.md predates the
  difficulty settings and the map-choice work.
