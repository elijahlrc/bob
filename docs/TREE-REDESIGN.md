# Bob — Passive tree redesign plan

Status: **plan, 2026-10-11**. Nothing here is built. Milestones are **T0–T9** (section 9). This follows [TREE.md](TREE.md), which
made the tree big enough (1,727 nodes, 27 keystones, 376 notables) and gave it the right mix of kinds and the right
connectivity _numbers_. This plan is about what those numbers hide: the tree is the right size and has no design.

Source of the feedback: the user, 2026-10-11 (seven points, quoted in section 1). Code read for this plan:
`src/data/tree/{spec,build,notableThemes,keystones,types,tree.test}.ts`, `clustersGen.ts`, `scripts/tree/*`, `docs/tree/pob-tree.json`
and the class list. Every number below was measured on the tree as it stands (`buildTree()`) with throwaway scripts that T0
turns into `npm run tree:audit`.

**The IP boundary stays where TREE.md put it** (DESIGN §3, §9.1). From the reference we take _proportions and rates_: how
strongly it keeps a weapon or a deployable in one corner, how much of its road is attribute nodes, how often a notable's
small nodes agree with it. We do not take positions, shapes, the arrangement of regions, names or text. `pob-tree.json` has no
coordinates anyway, so the macro-shape in section 5 is ours to invent, and it has to be invented, not derived.

---

## 0. Summary

**The tree reads as a flower because it is generated as one.** `buildClusterSpecs` (`spec.ts`) puts six identical 60° wedges
around a hub, fills each with rings at fixed radii (1,050 + 240 × n) and fixed slot spacing, and sorts the clusters of a ring by
a family list. Every cluster is 2–4 small nodes and one notable, a loop or a stalk chosen by a hash of its id. Whether two
neighbours are joined is `pct(id) < RING_LINKED` (a coin flip kept stable by a hash), and whether a cluster has its own way
inward is another (`SPOKE_CHANCE`). Nobody decided any of it, which is what "no designer intent" feels like.

**The root cause of points 3, 4 and 7 is one fact: in Bob the clusters _are_ the roads.** A ring is a chain of clusters
joined side to side, and a loop hands the road its own small nodes as attach points. To get from A to B you walk through
whatever those clusters give. The reference has the opposite structure: of its 536 node groups, 206 are road-only (no notable)
and their small nodes are 55% attribute nodes with most of the rest plain damage, life and defence; notable clusters hang off
that road. Bob has no road-only groups. Its only road nodes are the +10 attribute dots (14% of the tree), and those are too few
to form a road, so the builder connects the clusters to each other.

**The plan, in one paragraph.** Separate the road graph from the clusters. Author each region as data: a few named
**districts** (a fire-and-ice district, a minion district…), each with a sub-theme per cluster group, a landmark notable and its
own approach roads; lay districts out by hand-set position, size and template, not by slot arithmetic; make roads out of generic
region-flavoured small nodes and hang every cluster off a road by one entrance; price every node in a single power table so
notables always beat smalls and no notable is a small node with a longer name; and enforce all of it with tests that print
the measurements.

**What does not change.** The set of reference-derived notables and their names (357 generated clusters, 12 hand-made notables,
the hub's notables), the keystones (27), the node count (1,600–1,850), the engine vocabulary, class starts and the bot's way
of allocating. Size is chosen so that 123 passive points still mean something: a build finishes about one district and a half
and walks the roads between (section 5.4).

---

## 1. The seven points, checked against the tree

The measurements, with the user's wording on the left. Where the data disagrees with the intuition, it says so.

| #   | The feedback                                                                         | What the tree shows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Uniform radial flower; symmetry makes it harder to navigate; no landmarks.           | Confirmed in the code (section 0): six equal sectors, fixed ring radii, one cluster size band, keystones always on the outer rings at a region's middle slot. Adjacent class starts are 12, 16, 12, 12, 18 and 12 steps apart. Nodes per region run 199–265 only because of how many reference analogs each sector had. **Mean degree is 2.28–2.40 and dead ends 12–21% in every region**: flat on average, random locally.                                                                                                                                                                |
| 2   | Some notables are worse than common nodes (a 5% life notable beside 5% life smalls). | Confirmed. Bloodwell gives +5% maximum life; 69 of the 80 small life nodes give 4–5%. Thin Veil (+5% energy shield) and Marrow Reservoir (+8% life) are the same kind. By a crude yardstick (value in units of the median small node of the same stat) **30 of 376 notables are worth under two small nodes and 41 under 2.5**. The yardstick cannot price the "+1 maximum charge" notables, so the true number is somewhat different; T2 builds the proper table. Smalls are not regular either: small life nodes come in four sizes (1.7, 3, 4, 5).                                      |
| 3   | Sometimes dense, sometimes sparse, without intent.                                   | Confirmed, and it is a hash: `RING_LINKED` (50% of ring neighbours joined) and `SPOKE_CHANCE` (12%) decide where the roads are. The links across region boundaries (every third ring) are the only designed crossings.                                                                                                                                                                                                                                                                                                                                                                     |
| 4   | Too many nodes on the main paths are niche buffs (a wand buff just to pass through). | **True, but not mainly for the reason it feels.** On the shortest routes from a class start to every notable and keystone, about 25% of the nodes are attribute dots and **about 67% are small nodes of clusters**. Of the busiest ones (on at least 5% of routes), 8–15 per region are weapon-specific and 1–3 are skill-type specific. The larger part is the **hub**: every start is wired to one hub cluster whose theme is Life, Damage, Ailment Effect, Flask Charges, Cast and Attack Speed or Mana Regeneration, so a Vanguard's first four nodes out of the start are cast speed. |
| 5   | Skill types should be localised.                                                     | **Partly already so; the offenders are different from the example.** See the table in section 6. Traps are 88% in the shadow-side region and minions 90% on the int side, which is close to the reference. The families that spread are totems (43% in the top region), auras (33%), curses (50%), and weapon-specific smalls overall (28% of all small nodes name a weapon). `melee` clusters appear in five of six regions.                                                                                                                                                              |
| 6   | Regions should be coherent: clusters of fire, ice, mana, cast speed, a nexus.        | Bob has 40 _families_ but they are only sorted within a ring (`FAMILY_ORDER`); a region has no sub-structure. And inside a cluster: **66 of 357 clusters (18%) have small nodes that share no stat with their notable** (Brimming Inkwell, a damage notable with leech smalls; Fervid Thicket, +1 fervour charge with +10 dexterity smalls; Buttress Stance, 30% armour with damage smalls). The reference scores 238 of 256 (93%) on a looser test (a shared keyword), so read this as direction, not as a gap of 12 points.                                                              |
| 7   | Main pathways should be simple stat nodes of their region.                           | Not so: see the root cause in section 0. There is no pathway made of anything; the +10 dots are decoration between clusters.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

What the reference does that Bob can learn from (measured from `pob-tree.json`, never traced):

- **Localisation is strong for archetypes and absent for generic stats.** A wand keyword is in one sector only (6 of 6
  notables); traps and mines 79% in one sector; staves 75%; bows 67%; energy shield 60%, evasion 59%; minions 56% in one and
  the rest in the neighbour. Life, mana, critical strike and block are spread evenly (top sector 22–29%). That is the rule to copy:
  **archetype = home region; generic = everywhere.**
- **Roads are generic.** Road-only groups: 188 attribute nodes, 95 offence, 22 life, 14 other, 11 mana, 11 energy shield, 6
  defence, 3 resistance (the "offence" bucket is a keyword test and includes some weapon lines, so it overstates the generic part).
- **A notable's cluster agrees with it** (93% by a shared-keyword test).

---

## 2. Principles

1. **A path is a promise.** Every node you must walk to reach a destination is useful to anyone who is going there. The nodes
   on roads give attributes and the generic stats of the district they lead to; niche stats live in side clusters you can skip.
2. **Landmarks before symmetry.** Every region has a recognisable shape, and the six regions differ from each other in size,
   reach and silhouette. A player can say "the fire district up the left arm", and be understood.
3. **Density is a decision.** Where the tree is dense (many choices, many links) and where it is sparse (a long road) is
   authored, and each place has a reason: a core is dense, a frontier is sparse, a crossing is one road with a named junction.
4. **Every district is a theme with a shape**: a few families, a nexus node that pays for combining two of them, one or two
   approach roads, and (often) a keystone at its tip.
5. **Strength is priced.** One table says what a unit of each stat is worth. A small node is one unit, a notable three to six,
   and the test suite reads the table.
6. **Archetypes live at home, generic stats everywhere** (the reference's own rule, section 1).
7. **Headless and deterministic.** The spec is data in `src/data/tree/`; the layout is a pure function; nothing is random but the
   seeded hash that names a choice, as today. A tree is still the same on every machine (the snapshot test stays).

---

## 3. Structure: roads, clusters, districts

### 3.1 The road graph (answers 3, 4 and 7)

A **road** is a path of generic small nodes through a district, authored as a polyline in the district's template (section 5)
and filled by the builder:

- **Junction nodes** are attribute nodes (`+10` of the region's attributes; the value may rise to +15 on the long arterials
  between districts to make them worth their length). They stay where the roads fork.
- **Road nodes** between junctions draw from a **road pool**: per region (the stats its class would want anywhere: for the int
  region energy shield, mana and spell damage in small values; for strength life, armour and melee damage) and, inside a
  district, the pool's district variant (a Conflux road adds elemental damage and resistance). Pools are data, one line per stat
  with a weight; all road nodes are one unit.
- **The reference shares are the target:** about half of a region's road nodes are attribute nodes, the rest pool stats. The
  hub's roads follow the same rule (section 3.4).
- **No random coin flips.** `RING_LINKED` and `SPOKE_CHANCE` go. Every link in the tree is in the spec.

**Clusters attach to roads by one entrance** (a stalk, or a loop entered at one node). A cluster's nodes are not on any shortest
route between two other places, with a few deliberate exceptions called **shortcuts**: a loop with two entrances, authored in
the district, that saves a few steps and is allowed only if its smalls are generic (road pool) or the district's own theme.
Section 8 gives the test.

### 3.2 Clusters

Keep the notable-plus-smalls cluster (the generator and the names are the work of TREE.md) with these changes:

- **Coherence**: a cluster's small nodes give the notable's own stat families (rule in section 4.3), so the cluster reads as one
  idea. Where a notable gives something no small node can, such as a maximum charge, the small node is the nearest relative
  (charge duration, charge gain chance).
- **More shapes**: the loop and the stalk stay; add the **row** (a notable at each end of a short road, smalls between),
  the **twin** (two notables sharing two smalls: used for a pair of elements), and the **great wheel** (7–9 nodes, 3–4
  notables of one theme, one per district at most). Shapes are chosen by the district template, not by a hash.
- **Count**: smalls per cluster stay 1–4 for ordinary clusters, 4–6 for a great wheel.

### 3.3 Districts (answers 1 and 6)

A **district** is 8–16 clusters, 45–70 nodes, one theme sentence, and:

- a **core** (the first cluster you reach, always generic enough to be taken on the way: a mana cluster, a life cluster),
- **two to four groups** of clusters, each of one family (a fire group, a cold group, a lightning group; a cast speed group),
- a **nexus**: one notable placed between two groups that pays for having both (the example of fire and cold; section 4.4),
- a **tip**: the far end, where the district's keystone or its strongest notable sits (a peninsula, section 5.3).

Districts are the unit of design, of layout, of the review pictures and of the labels the player sees (T7).

### 3.4 The hub

The hub keeps its seven clusters and three keystones, but its smalls become generic: Life, Damage, Mana or Energy Shield by the
region the hub cluster faces, plus all-attribute nodes. Ailment Effect, Flask Charges and Cast and Attack Speed move into district
groups that want them (a poison district keeps ailment effect; the mana district takes flask charges). This is T2, because it is
the cheapest change that fixes the most noticeable symptom of point 4.

---

## 4. Balance: a power table

### 4.1 The table

New `src/data/tree/power.ts` (headless data, with a test):

- `UNIT`: for each stat key (stat, kind, tag or damage type, condition) the **value of one small node**. T2 seeds it from the
  present medians, then fixes it by hand where the medians are wrong (the four life sizes become one, 4%).
- `power(node)` is the sum over its lines of `value / UNIT`, times a **scope factor** (1.0 for a global stat; 1.25 for a stat tied
  to a weapon or a skill type, which is worth more per number when it applies and nothing when it does not; 0.8 for a condition
  that is usually true, 1.1 for one that needs effort).
- A **flat generic** class (life, energy shield, armour, evasion, damage, attack and cast speed) has a **cap**, since three
  units of life is a lot more than three units of a niche stat: a notable of a flat generic stat alone cannot exceed 3 units.

### 4.2 The rules (checked by tests, section 8)

| Kind      | Rule                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Small     | 0.8–1.2 units. Smalls of one stat have one value across the tree.                                                                                                                                           |
| Road node | exactly 1 unit, generic.                                                                                                                                                                                    |
| Notable   | **at least 2.5 units, and either two or more lines or one line of at least 3 units.** Median 4–5, none above 8 (the cap is ours; the present median is 5 with a tail to 20, and T2 reads the tail by hand). |
| Nexus     | 5–8 units, two groups' worth (section 4.4).                                                                                                                                                                 |
| Keystone  | outside the table (they change how a build plays), but each keystone has a line in the plan saying which build wants it and which stat it costs.                                                            |

### 4.3 Repair order for a notable that fails

Done once, in the emitter, and recorded in `docs/tree/overrides.json` (new; the emitter already reads a file of that name when
it exists), so it is reproducible and reviewable:

1. If its stat is flat generic and it is a single line under 2.5 units, **raise the value** to the floor (Bloodwell +5% → +12% life;
   Thin Veil +5% → +12% energy shield).
2. Otherwise **add a second line** from its cluster theme (a charge notable gets the charge's effect).
3. If neither fits, **merge** it with the nearest cluster of its group or **drop** it; the node count has slack (1,600–1,850).

Small nodes are regenerated from the repaired notable: the small gives the notable's first stat family at one unit, and where that
cannot be done (a charge) the nearest relative. Target: **at least 95% of clusters share a stat family between small and
notable** (the test counts the same thing for the tree as it is built, not the looser keyword test of the reference).

### 4.4 Nexus notables and conjunctions

A nexus is hand-written (about 12–18 in all, 2–4 per region) and pays for two or three groups of its district. Examples of the
shape, not final text: a fire-and-cold conjunction that adds damage for each element the character has dealt in the last 4 s;
a minion-and-curse nexus that applies the character's curses to a minion's targets. A nexus is only written if the engine
already expresses it (the same rule as TREE.md: every stat must be read by the sheet or sim). Gaps are listed at the end of T6 and
decided by the user, not built in this plan (section 10).

---

## 5. Layout and landmarks (answers 1 and 3)

### 5.1 Region shapes

The six regions keep their class, attributes, direction and neighbours (`REGIONS`), but lose their equal wedges.

- **Unequal sector widths**: width follows the number of districts (3–5). The regions are not a regular hexagon around the
  hub. Class starts stay on the inner ring (`START_RADIUS` 800).
- **Unequal reach**: each region's outermost tip sits at its own radius; two of six regions have a long arm (a peninsula
  of 6–10 nodes of generic road to a far district), two are compact and deep, two are broad and shallow. Which is decided in T1
  from the districts, by hand.
- **Ring radii are no longer global**: a district is placed by centre (angle, radius), footprint (width, depth, rotation) and
  template. Two districts of the same region may sit at different distances.
- **The dark space** stays (TREE.md found it helps legibility), but the gaps now separate districts, so the eye finds the
  groups, not an evenly dotted ring.

### 5.2 District templates

Each district uses one of five internal layouts, drawn by the builder from the spec. No two districts of a region share one.

| Template   | Shape                                                                                              | Reads as                           |
| ---------- | -------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Avenue** | a straight or bending road with clusters on both sides, a nexus at the middle, a gate at each end  | a street; the nexus is a square    |
| **Ring**   | a loop road with clusters outside and one inside, two gates, a nexus at the centre                 | a circus; the centre is a landmark |
| **Fork**   | a stem that splits into two or three arms, each a group, with the nexus where the arms nearly meet | a river delta                      |
| **Knot**   | a dense lattice of 8–12 clusters with many links and one gate                                      | a core: dense on purpose           |
| **Ladder** | two parallel roads with rungs; sparse; two gates                                                   | a corridor between regions         |

Density is stated: a Knot has a loop per three clusters, an Avenue one per six, a Ladder only the rungs; the mean degree of a
district is part of its spec and is checked.

### 5.3 Landmarks and keystone peninsulas

- **Great wheels**: one per region, 7–9 nodes with three or four notables of the district's theme, at its centre, the thing a
  player names a place by.
- **Keystone peninsulas**: every keystone sits at the end of its own approach, 4–8 nodes long, made of nodes that suit it
  (the spur is themed to the keystone, not to the region's `keystoneTheme`), and at a tip no two keystones share: not all on
  the outer ring. A keystone has exactly one link.
- **Bridges**: three named cross-region links (not six), each between two districts that make sense together (a trap district and
  an evasion district, say), each a Ladder whose junction carries a notable of its own. The boundary links every third ring
  (end of `spec.ts`) go.
- **Distance as design**: a class start reaches its own first district's core in at most four steps; its second district in
  eight to twelve; a neighbouring region's near district in 14–20; a far region's, 28 or more. The test pins these. Today the
  first notable is three steps from every start, and the keystones are 5–29 steps away at random.

### 5.4 Sizing against 123 points

TREE.md puts 123 points at about 7% of the tree. With 24 districts of about 60 nodes plus the hub, a build fills one district and
a half and walks the roads between: enough to commit, not enough to take a second district without giving something up. T8 checks
the bot's end builds against this and adjusts the district sizes (the knobs are `smallCount` and the number of groups).

---

## 6. Locality (answers 5)

The rule: **each archetype family has one or two home regions and appears nowhere else, except that each of its neighbours may
hold one cluster of it** (the reference does the same, with its minions: 56% in one sector and the next); **generic families have
no rule**. The classes' own weapons fix the weapon homes.

| Family                                  | Home (district it lives in)                                                       | Currently                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Wand, spell, minion, energy shield      | int (Mystic), minions also strint                                                 | minion 90% there already; `spell` 5 of 6 clusters in int                    |
| Dagger, claw, trap, mine, chaos, poison | dexint (Shade)                                                                    | trap 88%, mine 60%; damage over time in all six regions (7 of 23 in dexint) |
| Bow, projectile, evasion, ranged        | dex (Strider)                                                                     | `ranged` 6 of 9 in dex, 2 in strdex, 1 in int                               |
| Sword, dual wield, bleed, attack speed  | strdex (Reaver)                                                                   | `melee` clusters in five of six regions                                     |
| Mace, two-hand, stun, life, fire DoT    | str (Vanguard)                                                                    | `melee` 13 in str, 11 in strdex                                             |
| Sceptre, auras, curses, elemental       | strint (Zealot)                                                                   | aura 33% top region; curse 50%                                              |
| Totem, brand, warcry, channelling       | one district each: totem strdex, brand int–dexint border, warcry str, channel int | totem 43% top region                                                        |
| Life, mana, crit, block, speed, charges | everywhere                                                                        | unchanged; the reference spreads them too (22–29% top sector)               |

The home column is a draft for the user to veto in T1 (D2). Weapon-specific smalls are capped at **15% of all smalls** (28% today)
and never sit on roads.

A build is never forced into a home region's weapon: a Strider can take a sword district, and the cost is the walk (section 5.3),
which is the point of locality.

---

## 7. A draft charter (what T1 settles)

Four districts a region, the tip of each in brackets where a keystone lives. Families are the names the generator already uses
(`FAMILY_ORDER`), and the supply of each is in the audit, so every district has analogs to fill it. These are working titles; the
names the player sees are written in T1.

| Region              | Districts (families; the nexus idea)                                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **int** (Mystic)    | **Wellspring**: mana, mana regen, energy shield, flask charges (core). **Conflux**: fire, cold, lightning, penetration; nexus: fire+cold, cold+lightning (a Fork). **Bone Court**: minions (tip: Volatile Servants). **Spellforge**: spell, cast speed, spell critical. |
| **dexint** (Shade)  | **Snare Row**: traps, mines, throwing speed. **Venom Quarter**: poison, chaos, damage over time, ailments. **Knife Alley**: dagger and claw, critical strike, attack speed. **Veil**: evasion with energy shield, curses, hexes.                                        |
| **dex** (Strider)   | **Longbow Reach**: bow, projectile, accuracy, penetration. **Windwalk**: evasion, movement, attack speed. **Hunt**: critical strike, ailments from attacks, frenzy-type charges. **Frostwood**: cold, ranged elemental.                                                 |
| **strdex** (Reaver) | **Bladework**: sword, axe, dual wield, bleed. **Bulwark**: armour and evasion together, block, shield. **Bloodrun**: leech, life on hit, fervour charges. **Standards**: totems, warcries, auras for the group.                                                         |
| **str** (Vanguard)  | **Ironhold**: life, armour, resistances, regeneration (core). **Hammerfall**: mace and two-hand, stun, physical damage. **Embers**: fire, ignite, burning damage. **Cairn**: grit charges, warcries, endurance.                                                         |
| **strint** (Zealot) | **Sanctum**: auras, aura effect, curses, hybrid defences. **Reliquary**: minions, sceptre, life on kill. **Pyre and Storm**: fire, lightning, critical. **Tithe**: mana to life, block, hybrid cost nodes.                                                              |

The hub keeps seven clusters. Districts per region become 3–5 once T1 counts the supply (the table assumes four so that the
arithmetic of section 5.4 works).

---

## 8. Tests and measures

**`npm run tree:audit`** (T0; replaces `tree:mix` and absorbs `tree:refmix`) prints every number in this plan so a milestone can
be checked by diffing it: family by region, locality (top-region share per family), notable power in units, coherence,
share of route nodes by kind and by genericness, road-only groups, district purity, steps from each start to each district
and keystone.

New or changed tests in `src/data/tree/tree.test.ts` (each with its reference number; none is loosened, they are replaced by
a measurement of the new design):

| Test                                                                                                                                    | Reference or reason                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| every small is 0.8–1.2 units; every notable ≥ 2.5                                                                                       | section 4.2                                                                                                                        |
| ≥ 95% of clusters share a stat family                                                                                                   | reference 93% on the looser test                                                                                                   |
| road-only nodes ≥ 18% of non-keystone nodes                                                                                             | reference: 340 of 1,625 nodes (21%) are in road-only groups; Bob's attribute dots alone are 14%                                    |
| no weapon-specific small on a road; ≤ 15% overall                                                                                       | measured 28% now                                                                                                                   |
| no cluster node on the only route between places                                                                                        | except the spec's declared shortcuts                                                                                               |
| steps from each start (section 5.3)                                                                                                     | the numbers of 5.3                                                                                                                 |
| locality per family (section 6)                                                                                                         | the reference's 56–100% for archetypes                                                                                             |
| the share of travel (attribute) nodes 8–16%                                                                                             | stays: about half of road nodes are still attribute dots (section 3.1), so the share holds; the _road_ share is the new test above |
| mean degree 2.1–2.45, loops 150–320, dead ends 8–16%                                                                                    | stay as they are (reference); the new tests add the per-district density                                                           |
| reach test (4 keystones in 40 steps, 15 notables in 30), connectivity, no overlap, symmetric links, IP name check, determinism snapshot | stay, snapshot re-recorded                                                                                                         |

Also kept: the bot must be able to allocate the new nodes (every stat the tree grants is read by the sheet or the sim, per
TREE.md), and `npm run check` and `npm run build` are green before each commit.

---

## 9. Milestones

Each milestone ends green (`npm run check`, `npm run build`), with a commit, and from T3 on with a picture of the tree from
`tree:svg` at three zooms in `docs/screenshots/tree/`. T2 can ship on its own.

| #      | Name                           | Scope                                                                                                                                                                                                                                                                                                                  | Done when                                                                                                                                                   |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T0** | Audit and review tools         | `scripts/tree/audit.ts` (the measures of section 8; the scratch scripts of this plan promoted), `scripts/tree/svg.ts` (a static SVG of the tree, coloured by district and family, with district names), baseline numbers pasted into this file, CLAUDE.md pointer.                                                     | `npm run tree:audit` reproduces the table of section 1; `tree:svg` draws the present tree.                                                                  |
| **T1** | Charter                        | `docs/tree/charter.json`: districts (region, theme, template, families, nexus idea, tip), the locality homes, road pools, per-region reach; a supply check (every district has enough analogs, with sector as a hint only); the player-visible district names. The user reads section 7 and 6 and marks changes.       | The supply check passes; every one of the 357 clusters has a district; the user has seen the table (D1, D2).                                                |
| **T2** | Power and coherence            | `src/data/tree/power.ts`, `tree:power` report, repair rules in `emit.ts` plus `docs/tree/overrides.json`, regenerated `clustersGen.ts`, generic hub themes (3.4). **No layout change; node ids unchanged.**                                                                                                            | Section 4.2 holds for every node; coherence ≥ 95%; `bot` sim run (T8-style, small) shows no class collapsing. A save from before still loads.               |
| **T3** | Skeleton and roads             | The district spec types (`DistrictSpec`, `Road`, `Template`) and the road builder: junction and road nodes from pools, one-entrance attach, no hash links (`RING_LINKED`, `SPOKE_CHANCE`, the odd-ring boundary links removed). One region (int) first, the others on the old layout, so the pictures can be compared. | The int region has no cluster node on any route between two places; its road nodes are generic; `tree.test.ts` passes for it.                               |
| **T4** | Districts and templates        | Templates (Avenue, Ring, Fork, Knot, Ladder), cluster shapes (row, twin, great wheel), the placement function, the five other regions, unequal sectors and reach; `SAVE_VERSION` bumped and `migrate` hands passives back as before.                                                                                   | All six regions on the new layout; section 5.3's step counts hold; the picture shows six different silhouettes.                                             |
| **T5** | Peninsulas, bridges, landmarks | Keystone approaches, the three bridges, the great wheels, nexus placement (nodes still carry placeholder text from the generator).                                                                                                                                                                                     | Each keystone is a dead end 4–8 nodes long at a distinct tip; bridges exist and are named; every district has a nexus slot.                                 |
| **T6** | Nexus notables and locality    | The 12–18 hand-written nexus nodes (4.4); locality enforced by the emitter (section 6); the list of engine gaps (a conjunction the sheet cannot express).                                                                                                                                                              | The locality test passes; weapon-specific smalls ≤ 15% and none on roads; the gap list is written for D5.                                                   |
| **T7** | The tree screen                | `TreeView.tsx`: district backdrops replace the wedges, district names at far zoom, nexus and great wheels labelled, a search or highlight of a stat family (cheap now that families exist), the cyan route preview unchanged; `treeStyle.ts` colours by district accent; phone check at 375×812.                       | At 1280×720 and 375×812 the districts can be read and named from the whole-tree view; no change to taps or the pinch zoom.                                  |
| **T8** | Balance and the bot            | `scripts/simpar.sh` on all classes (12 a class, two seeds) before and after; the bot's tree choices (does it take the nexus, does it cross a bridge); the 123-point sizing of 5.4; adjust unit and cap values. Findings go in `docs/PROGRESS.md`; **no tuning of anything but the power table and district sizes.**    | Median map reached per class is not lower than before by more than the noise of two seeds, or the cause is written down; no class never reaches a district. |
| **T9** | Wrap-up                        | DESIGN.md §9 and Appendix A (the decisions of section 11), TREE.md status line, PROGRESS entry, patch notes (the tree has changed; refund of passives), CLAUDE.md line, dead code removed (`RING_START`, `RING_STEP`, `FAMILY_ORDER` ring sorting, wedge drawing), real-device pass noted for MOBILE.md §9.            | The documents agree with the code; `grep` finds no use of the removed constants.                                                                            |

**Order.** T0 → T1 first (T1 needs the user's eyes). T2 is independent of the layout and ships alone: it fixes points 2 and the
hub half of 4 at once. T3 → T4 → T5 are the layout, in order, one region first so that a mistake is cheap. T6 needs T5's
slots. T7 can start after T4 (it needs district data, not final layout). T8 needs everything.

---

## 10. Not in this plan

- **New keystone mechanics.** The 27 stay; only their placement and approach change.
- **Engine work for nexus nodes the engine cannot express**: listed at the end of T6 for the user to choose (D5).
- **Masteries, jewels, ascendancies, a bigger point budget**, and any respec or refund rule beyond the one the save migration
  already has.
- **Node art**: the 18 emblems and the colour language stay (TREE.md); T7 only adds district accents.
- **A different tree screen** (a grid, a list, a three-tree layout): the camera, pinch zoom and taps stay as MOBILE.md built them.

---

## 11. Decisions for the user

Each has a default; say "agreed" and they stand. I will not pause for an answer: T0 and T2 do not depend on any of them.

| #      | Question                                                                                                                                                                  | Default                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **D1** | Are the districts of section 7 the right ones? (Strike, rename or add; a region may have three or five.)                                                                  | **As drafted**, adjusted by the supply check in T1.                                         |
| **D2** | Locality: archetypes at home with one cluster allowed in each neighbour, or strict (home only)?                                                                           | **One cluster in each neighbour.** Strict makes off-class builds feel punished.             |
| **D3** | Regions unequal on purpose (some larger, some with a long arm), or equal in size but different in shape?                                                                  | **Unequal.** Equal sizes are part of why the tree reads as a flower.                        |
| **D4** | Notables get stronger relative to smalls (a median of 4–5 units against the present 5 with many at 1–2): accept a build-power change, to be re-balanced by the bot in T8? | **Yes.** The power table is the only knob.                                                  |
| **D5** | Nexus notables the engine cannot express: build the engine support, write a weaker version, or leave the slot as a plain notable?                                         | **Weaker version where it is close, plain notable otherwise.** No engine work in this plan. |
| **D6** | Save compatibility: bump the version in T4 and hand all passives back (as TREE.md did), once.                                                                             | **Yes, once, in T4.** T2 changes values but not ids.                                        |

Decisions to record in DESIGN.md Appendix A when made: the road/cluster separation (3.1), the power table and its caps (4), the
district as the unit of design (3.3), locality rule and homes (6), distances from a start (5.3), and the removal of hash-chosen
links.

---

## 12. Risks

| Risk                                                                                                                 | Mitigation                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hand layout is more work than slot arithmetic, and a template that collides with another breaks the no-overlap test. | One region first (T3); the existing clearance tests run on every change; `tree:svg` makes a bad layout visible in seconds.                                                 |
| Buffing notables makes builds stronger and breaks the difficulty tuning.                                             | D4: one table, and T8 measures before and after on the same seeds. The cap on flat generic stats limits the worst case.                                                    |
| A power table can be gamed by the stats it cannot price (charges, conditionals).                                     | The first table is a seed; T2 lists everything it could not price, and those notables get a hand-set unit value with a comment.                                            |
| Districts built on the reference's sectors inherit its imbalances (a sector with five analogs of one family).        | The supply check in T1 counts per district; where supply is short the translator makes a new analog (it has the machinery), never a copy.                                  |
| The bot's `tree` scoring ignores the nexus or avoids bridges, so the sim says the new tree is worse.                 | T8 reads what it takes; the bot chooses by build score, so a better node is taken; any engine stat unread by the sheet is found by the existing "every stat is read" test. |
| Players lose their allocated passives on the save bump.                                                              | Same migration as TREE.md's: points handed back as unspent, once (D6), noted in the patch notes.                                                                           |
| Other agents change `build.ts`, `spec.ts` or `TreeView.tsx` at the same time.                                        | T3 starts by announcing the files; new code goes in new files (`districts.ts`, `roads.ts`, `power.ts`), and the old layout code is removed only in T9.                     |

---

## 13. The audit, for reference

Measured on `buildTree()` on 2026-10-11 (1,727 nodes). `tree:audit` (T0) reproduces these.

- **Cluster families by region** (357 generated clusters): int 65, dexint 68, dex 66, strdex 55, str 47, strint 56; trap 7 of 8
  in dexint, minion 9 of 10 in int or strint, melee in five regions, damage over time (23 clusters) in all six, crit and mana in
  all six.
- **Notables**: line counts 1 → 60, 2 → 80, 3 → 95, 4 → 83, 5+ → 39. Single-line notables whose stat also appears in their cluster's
  small nodes are worth a median of 3 small nodes (1.4–4).
- **Small nodes**: 1,071; 137 distinct names; 304 (28%) weapon-specific; 73 (7%) skill-type specific; "Maximum Life" ×56,
  "Maximum Mana" ×46 are the most common names. Life smalls: 1.7% ×2, 3% ×9, 4% ×32, 5% ×37.
- **Routes from a start to every notable and keystone** (shortest, by node count): about 30 intermediate nodes on average;
  25% attribute dots, 67% small nodes of clusters. First notable 3 steps from every start; nearest keystone 5–16 steps.
- **Reference** (`pob-tree.json`): 536 groups, 303 with a notable, 206 without; smalls in road-only groups: 188 attribute, 95
  offence, 22 life, 14 other, 11 mana, 11 energy shield, 6 defence, 3 resistance; smalls in notable clusters: 546 offence, 85
  other, 76 life, 57 mana, 40 defence, 33 energy shield, 20 attribute, 17 resistance.
