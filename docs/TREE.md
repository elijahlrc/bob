# Passive tree parity (3.9)

Goal: a tree with the breadth of the 3.9 tree: far more notables with several lines each (some conditional), keystones that
change how a build plays, and nodes for every system added since the tree was written (minions, totems, traps, mines,
brands, curses, warcries, guards, auras and heralds, ailment damage over time). Layout, names and numbers stay our own
(DESIGN §3, §9.1); the reference only says which kinds of node and which mod lines exist.

## Reference measured (`docs/tree/pob-tree.json`, `npm run tree:extract`)

Main tree of 3.9.x, without ascendancy nodes, jewel sockets and class starts:

| Kind      | Reference | Bob before  |
| --------- | --------- | ----------- |
| Keystones | 28        | 21          |
| Notables  | 369       | 139         |
| Small     | 1,235     | about 1,000 |
| Total     | 1,632     | 1,344       |

The reference notables are 1.2 lines each on average and 330 distinct lines; the small nodes use 181 distinct lines that
Bob's mod vocabulary did not have a phrase for (`npm run tree:lines`).

## Targets (this pass)

| Item         | Target                                                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keystones    | 27 (the 21 we have, plus analogs of Acrobatics, Phase Acrobatics, Minion Instability, Ancestral Bond, Runebinder, Necromantic Aegis; Mortal Conviction and Wicked Ward if cheap). Conduit (parties) is out. |
| Notables     | at least 300, each an analog of a reference notable's defining line (at least 85% of 369), written with our own names                                                                                       |
| Nodes        | about 1,650 to 1,800 (123 points still cover about 7% of the tree)                                                                                                                                          |
| Small themes | cover every family of small-node line the reference has that the engine can express                                                                                                                         |
| Interesting  | at least a third of notables carry a conditional or secondary line                                                                                                                                          |
| Saves        | `SAVE_VERSION` bumped (node ids change)                                                                                                                                                                     |
| Not in scope | jewel sockets and jewels, ascendancies, party effects, knockback, blind, maim, phasing                                                                                                                      |

Every stat the tree grants must be read by the sheet or the sim, or the bot never allocates it and the player gets nothing.

## Plan

1. Engine vocabulary for the line families the tree needs (DoT multipliers and skill keywords on ailment damage,
   weapon-scoped ailment damage, deployable and minion stats, penetration, enemy physical reduction, double damage, leech
   caps, charge stats, and so on), with phrases in `scripts/coverage/modDict.ts` and the line diagnostic.
2. A notable catalog: one decision file per reference notable (our name, our mods, lines dropped and why), as for uniques;
   an emitter writes `src/data/tree/notablesGen.ts`.
3. New small-node themes for the missing families.
4. A bigger layout: more rings and slots per region, clusters of a notable and two to four small nodes.
5. New keystones.
6. Balance: small bot sims; the bot must allocate the new nodes.

## Status

See the end of this file; each step is appended when it lands.

### Step 1 and 2 done (2026-10-07): vocabulary, reference, generated clusters

- **Reference** (`npm run tree:extract`): 369 notables, 28 keystones, 1,228 small nodes, with their lines, cluster (group) and
  rough depth; no coordinates. `npm run tree:lines` measures what Bob can say: of 369 notables, 296 have every line mapped or
  deliberately ignored (it was 99 before this pass); the rest lose their unmappable lines (listed by the diagnostic).
- **Engine stats added**: attack skills as an ailment keyword (`attackSkill`), the damage over time multiplier (`dotMulti`),
  bleed and poison speed, enemy physical reduction, double damage, shield defences, minion physical reduction and block, charge
  duration, duration of deployables and timed minions (`skillDuration`), weapon-held conditions for two and one handed.
  Ailment damage still ignores the hit-scaling tags and the weapon held (3.9): "damage with ailments while wielding a sword"
  is a condition, not a tag.
- **Generated clusters** (`npm run tree:emit`): one cluster per reference notable with an analog (357), made of its translated
  lines and small nodes that repeat the cluster's own small-node theme, named by us (`docs/tree/names/<region>.json`, written
  one region at a time and checked against every reference name). Hand-made extras remain: the twelve notables of the depth
  expansion and the hub.
- **Layout**: regions fill rings out from the middle by the depth the reference cluster had, sorted by family inside a ring;
  ring count follows the number of clusters. 1,753 nodes, 376 notables (94 with a condition or a scaling, 316 with two or more
  lines), 27 keystones.
- **Keystones** added: Nimble Gambit, Spellslip, Volatile Servants (minions burst at low life), Idle Hands (no damage of your own
  but one more totem), Sigil Warden, Lone Vow (one aura, no reservation).
- `SAVE_VERSION` is 4; the invariants in `tree.test.ts` and DESIGN §9 carry the new sizes (and at most four notables share a mod set).

### Look and density (2026-10-08)

The tree was a uniform web: filler was a third of the nodes, every notable was a dead-end stub and the three node sizes were
barely told apart. A first pass over-corrected (every ring one continuous road: twice the loops of the reference). This pass
follows the reference in what it is made of, how connected it is and how it reads, not in its layout (positions, shapes and
the arrangement of the regions stay our own, DESIGN §9.1). `npm run tree:mix` prints Bob's numbers and `npm run tree:refmix`
the reference's (its links are one-directional in `pob-tree.json`; the script makes them symmetric).

| Measure                         | Reference   | Before (2,257 nodes) | Now         |
| ------------------------------- | ----------- | -------------------- | ----------- |
| Nodes                           | 1,625       | 2,257                | 1,727       |
| Notables                        | 22.7%       | 16.7%                | 21.8%       |
| Keystones                       | 1.7%        | 1.2%                 | 1.6%        |
| Attribute nodes (travel)        | 12.8%       | 34.4%                | 14.3%       |
| Edges per node (mean degree)    | 1.14 (2.29) | 1.09 (2.17)          | 1.14 (2.29) |
| Loops (edges − nodes + 1)       | 234         | 196                  | 248         |
| Dead ends (one link)            | 13.0%       | 20%                  | 13.0%       |
| Notables with two or more links | 53%         | 0%                   | 59%         |
| Keystones with two links        | 7%          | 0%                   | 0%          |
| Routes the builder dropped      | —           | 83                   | 3           |

(The reference's 22% of nodes with three or more links counts the mastery and hub nodes with six and more; Bob's 32% is every
loop's entry node.)

What the real tree looks like (screenshots of the 3.x tree, read for structure and never traced):

- **Sparse roads.** A few long edges, straight or bending round a ring, meet at junction nodes that are attribute nodes; between two
  junctions there are many cluster-widths of nothing.
- **Clusters are small loops.** A notable, usually with a decorative ring round it, and two to six small nodes on an orbit,
  joined to a road at one or two nodes. Many notables are not on a road at all but at the end of a short stalk.
- **Little else is connected.** Most nodes have two links; the loops are few and big.
- PoE 2's tree (a plain graph render of it) is far more meshed, but curved edges and repeated shapes keep it legible; Last Epoch's
  is a tidy grid of three tall trees with spend-points gates, which is a different design and was not taken.

What was built:

- **Clusters** (`build.ts`): a loop of the smalls and the notable (the notable faces outward, roads join at the two sides), or a
  short line of smalls with the notable on a stalk (half of the two- and three-small clusters, by a hash of the id). The hub's
  clusters stay stretches of road. Nodes on a loop know its centre (`orbit`) so that the lines between them are drawn as arcs.
- **Roads** (`spec.ts`): ring neighbours are joined in stretches (`RING_LINKED` 50% of pairs, so an arc of road runs through a few
  clusters and stops), a stretch has one way inward and a spoke more now and then (`SPOKE_CHANCE` 12%), and three rings of the
  boundary between regions are crossed. Rings are 240 apart (the first at 1,050) and a slot is 340, so there is dark space
  between clusters; a link longer than 255 (`TRAVEL_SPACING` 170) gets an attribute node, placed on the arc where the link is a
  stretch of ring.
- **Look** (`TreeView.tsx`, `treeStyle.ts`, `tree.css`; the tree rules left `styles.css`):
  - a node's colour says what it gives (life red, defence steel, evasion green, mana and energy shield blue, the three elements
    and chaos by their own, minions teal, curses violet, attributes by attribute), from its first line;
  - kinds differ by size and frame (radius 10, 24, 38 for small, notable, keystone): small is a ringed dot, a notable has a gold
    outer ring and an emblem of its colour, a keystone is an octagon with a violet frame and a larger emblem; allocated nodes
    go gold with a halo and the roads between them glow; the path a click would buy is cyan;
  - sizes keep a floor on screen (3 px for a small, 7.5 px for a notable, 11.5 px for a keystone, a third of that with the whole tree
    in view) and lines keep their width in pixels; names of keystones and class starts show from far out, of notables from
    zoom 0.4; a "Colours" key sits in the corner;
  - behind the nodes, each region is a wedge tinted by its attributes, with ring guides, the rim and the region's name.
  - One group per node, one path per line and no filters (a phone's GPU memory was a problem before, PROGRESS 2026-10-08).
- **Saves.** `SAVE_VERSION` is 10. Node ids changed, so loading an older run keeps it but hands the allocated passives back as
  unspent points (`migrate` in `save.ts`).
- **Names.** Small passives lose the "Lesser" of their names ("Armour", "Attack Speed").
- **Tests** (`tree.test.ts`): the mix of kinds, and the connectivity of the reference as ranges (mean degree 2.1 to 2.45, 150 to
  320 loops, 8% to 16% dead ends, 40% to 70% of the notables with two links, every keystone a dead end). The first version of
  these asked for 60% of notables on a road and at most 12% dead ends, which forced the over-connection; they were corrected
  with the measured numbers, not loosened.
- **Balance** (bot, seed 2, six runs per class, scaling 1.5): see PROGRESS 2026-10-08.
- **Not done.** What each node grants is as before: the small nodes of a cluster are still copies of one another (the reference
  has 445 distinct small names, Bob 137), attribute nodes are still +10, notables and keystones are unchanged. No node icons
  beyond the 18 emblems; no search or highlight of a stat; the real-device pass of the mobile plan has not seen the new look.
