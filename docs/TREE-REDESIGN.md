# Bob — Passive tree redesign plan

Status: **plan, 2026-10-11, with the user's answers of the same day folded in** (section 11). Nothing here is built. Milestones are **T0–T9** (section 9), with an audit by simulated players (T6.1) and a response to it (T6.2) between the layout and the balance pass. This follows [TREE.md](TREE.md), which
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
and their small nodes are 54% attribute nodes with most of the rest plain damage, life and defence; notable clusters hang off
that road. Bob has no road-only groups. Its only road nodes are the +10 attribute dots (14% of the tree), and those are too few
to form a road, so the builder connects the clusters to each other.

**The plan, in one paragraph.** Separate the road graph from the clusters. Author each region as data: a few named
**districts** (a fire-and-ice district, a minion district…), each with a sub-theme per cluster group, a landmark notable and its
own approach roads; lay districts out by hand-set position, size and template, not by slot arithmetic; make roads out of generic
region-flavoured small nodes and hang every cluster off a road by one entrance; price every node in a single power table so
notables always beat smalls and no notable is a small node with a longer name. Whether the result is right is a matter of look
and feel, so it is judged by looking: pictures at each milestone, a printed audit that is information and not a gate, and
twelve simulated players who build with the tree and report where it frustrated them (T6.1).

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
  with a weight; all road nodes are one unit. **Representation:** a pool node is `kind: 'small'` with no `cluster` (junctions
  stay `kind: 'travel'`), so "road node" in the tests means a small node without a cluster, and the existing bands (travel
  8–16%, small at least 58%) keep their meaning.
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
- a **nexus**: an existing notable placed between two groups whose lines touch both (the example of fire and cold; section 4.4). If no existing notable fits, the district has none: no new nodes are written,
- a **tip**: the far end, where the district's keystone or its strongest notable sits (a peninsula, section 5.3).

Districts are the unit of design, of layout and of the review pictures. The player still sees the six wedges and nothing new behind the nodes (D1).

**Not every cluster belongs to a district (user, 2026-10-11).** Roughly two thirds to three quarters do. The rest are
**wayside clusters**: a single notable on a stalk off a road, a pair of generic clusters between two districts, a lone cluster out
on a spur. They have no theme to keep, only the node rules of section 4, and they are what makes the tree look found, not
planned: in the reference many notables stand alone beside a road. The charter marks a cluster's district as empty on purpose.

### 3.4 The hub

Today the hub is a spoke: each class start has one hub cluster straight inward from it, and the six join at a centre wheel. The
centre therefore reads as six little copies of the region outside, each leaning on its own attributes. The centre becomes the
**open middle** of the tree:

- **Mixed, not aligned.** Hub clusters stand _between_ the class directions (at the region boundaries), not in line with them,
  and each is generic or a hybrid of the two regions it sits between (life and mana; armour and evasion; damage and speed;
  resistances; flasks and charges). No hub cluster belongs to one attribute. The hub's attribute nodes give all three.
- **A way round.** An inner road joins the six hub clusters in a ring, so a class can walk across to a neighbour's inner edge
  without leaving the middle; the starts hang off the ring by short roads, and the three hub keystones sit on the inner side of
  the ring, between regions.
- **Interesting means varied**: the middle has more distinct shapes than a region has (a great wheel at the very centre, a
  twin, a row), and several notables that no one class owns. It is where the reference puts its generic strength, and the place
  a player passes through on the way to another class's corner.
- **Generic smalls.** Its small nodes are Life, Damage, Mana, Energy Shield, resistances and all-attribute. Ailment Effect,
  Flask Charges and Cast and Attack Speed (the themes that make a Vanguard's first nodes cast speed) move out into the district
  groups that want them. The theme swap is T2, because it is the cheapest change that fixes the most noticeable symptom of point
  4; the new shape is T4.

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

### 4.2 The rules (the small and notable rows are tested, section 8)

| Kind      | Rule                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Small     | 0.8–1.2 units. Smalls of one stat have one value across the tree.                                                                                                                                           |
| Road node | exactly 1 unit, generic.                                                                                                                                                                                    |
| Notable   | **at least 2.5 units, and either two or more lines or one line of at least 3 units.** Median 4–5, none above 8 (the cap is ours; the present median is 5 with a tail to 20, and T2 reads the tail by hand). |
| Nexus     | An existing notable that touches two groups of its district; it follows the notable rule, no more (section 4.4).                                                                                            |
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

### 4.4 Nexus slots

**No new nodes are written in this plan (D5).** A district's nexus is a slot between two of its groups, filled by an existing
notable whose lines touch both (a notable with a fire line and a cold line, or a minion line and a curse line). The generator
has 357 to choose from and the T1 supply check lists, per district, which notables could fill the slot. A district with no
fit has a plain junction there. The fire-and-ice "unique node" of the feedback is therefore a layout idea now (the notable that
already pairs two elements sits where the two groups meet), and a hand-written conjunction is a later plan, together with the
engine work it would need.

---

## 5. Layout and landmarks (answers 1 and 3)

### 5.1 Region shapes

The six regions keep their class, attributes, direction and neighbours (`REGIONS`), but stop being copies of one another.

- **The wedges stay (D1).** Six equal 60° wedges are still drawn behind the tree, and a district lives inside its region's wedge.
  Unequal means the _contents_: the number of districts (3–5), how far each region reaches, how dense it is and what shape it
  makes. Class starts stay on the inner ring (`START_RADIUS` 800).
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
district is part of its spec and is printed by the audit.

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
  eight to twelve; a neighbouring region's near district in 14–20; a far region's, 28 or more. These are targets the audit reports, not tests. Today the
  first notable is three steps from every start, and the keystones are 5–29 steps away at random.

### 5.4 Sizing against 123 points

TREE.md puts 123 points at about 7% of the tree. With 24 districts of about 60 nodes plus the hub, a build fills one district and
a half and walks the roads between: enough to commit, not enough to take a second district without giving something up. T8 checks
the bot's end builds against this and adjusts the district sizes (the knobs are `smallCount` and the number of groups).

---

## 6. Locality (answers 5)

The rule is a tendency, not a quota (D2): **an archetype family has one or two home regions and most of its clusters are there;
the more broadly useful the archetype, the further it spreads** (a mana or critical strike cluster anywhere; a wand cluster
nowhere but home). The reference does the same, with its minions at 56% in one sector and most of the rest in the next.
**Generic families have no rule.** The classes' own weapons fix the weapon homes. No count is tested; the audit prints each
family's spread and the simulated players say whether it felt right.

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

The home column is a draft, judged by eye. The one firm rule: a weapon-specific small node never sits on a road (section 3.1), and
the audit watches their share of all small nodes (28% today).

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

## 8. Checking the design

Whether a tree is well designed is a matter of taste, and no band of numbers says it is. So the checks are, in order of weight:

1. **Looking.** From T3 on, every milestone ends with pictures of the tree from `tree:pic` at three zooms
   (`docs/screenshots/tree/`), and the user looks.
2. **Simulated players** (T6.1): twelve agents build with the tree and report friction; I triage the reports (T6.2).
3. **`npm run tree:audit`** (T0; replaces `tree:mix` and absorbs `tree:refmix`) prints the measurements of this plan for
   information: family by region and each family's spread, notable power in units, how well a cluster's small nodes agree with
   its notable, the share of route nodes by kind and by genericness, road-only nodes, steps from each start to each district
   and keystone, density by region. Nothing is pass or fail; a milestone's report is read as a diff against the one before.
4. **Tests**, only for what is a fact and not a taste:

| Test                                                                                                | Why                                                                     |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| connected from every class start; links symmetric; no overlap; no edge through a node               | the tree has to work (kept)                                             |
| every keystone has one link; 27 keystones; notable names unique; at most 4 notables share a mod set | content invariants (kept)                                               |
| the reach test: each start reaches 4 keystones within 40 steps and 15 notables within 30            | a build must have somewhere to go (kept)                                |
| no node named like one of the reference tree's notables or keystones                                | the IP rule (kept)                                                      |
| determinism snapshot                                                                                | re-recorded when the layout lands                                       |
| every small node 0.8–1.2 units and every notable at least 2.5 (section 4.2)                         | point 2 is a balance bug, not a taste: a notable must beat a small node |
| no weapon-specific small node on a road                                                             | point 4, written as a rule because a road is a promise (section 2)      |

**Tests retired.** The band tests in `tree.test.ts` that pin the _old_ design go when the layout that replaces it lands (T4): the
node-count and notable-count bands, the mix of kinds, mean degree, loops, dead ends, junction share and the share of notables
on a road. They measured the reference's connectivity and made the flower; the audit prints the same numbers for the new tree.
This is a change of design at the user's direction, recorded in DESIGN.md Appendix A, not a test loosened to pass.

Also kept: the bot must be able to allocate the new nodes (every stat the tree grants is read by the sheet or the sim, per
TREE.md), and `npm run check` and `npm run build` are green before each commit.

---

## 9. Milestones

Each milestone ends green (`npm run check`, `npm run build`), with a commit, and from T3 on with a picture of the tree from
`tree:pic` at three zooms in `docs/screenshots/tree/`. T2 can ship on its own.

| #        | Name                           | Scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Done when                                                                                                                                                   |
| -------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T0**   | Audit and review tools         | `scripts/tree/audit.ts` (the measures of section 8, as information; the scratch scripts of this plan promoted), `scripts/tree/pic.ts` (a PNG of the tree, coloured by district and family, region by region), `scripts/tree/explore.ts` (the text interface the T6.1 players use: show a node, nodes near it, the path and cost between two, allocate, deallocate, search by stat, summary of the build), baseline numbers pasted into this file, CLAUDE.md pointer. | `npm run tree:audit` reproduces the table of section 1; `tree:pic` draws the present tree; a build of 100 points can be made and summarised with `explore`. |
| **T1**   | Charter                        | `docs/tree/charter.json`: districts (region, theme, template, families, nexus slot, tip), the locality homes, road pools, per-region reach; a supply check (every district has enough analogs, with sector as a hint only; which existing notables could fill each nexus slot); the player-visible district names. **The user reads sections 6 and 7 before T3 starts.**                                                                                             | The supply check passes; every one of the 357 clusters has a district or is marked wayside on purpose; the table is in this file.                           |
| **T2**   | Power and coherence            | `src/data/tree/power.ts`, `tree:power` report, repair rules in `emit.ts` plus `docs/tree/overrides.json`, regenerated `clustersGen.ts`, generic hub themes (3.4). **No layout change; node ids unchanged.**                                                                                                                                                                                                                                                          | Section 4.2 holds for every node; coherence ≥ 95%; `bot` sim run (T8-style, small) shows no class collapsing. A save from before still loads.               |
| **T3**   | Skeleton and roads             | The district spec types (`DistrictSpec`, `Road`, `Template`) and the road builder: junction and road nodes from pools, one-entrance attach, no hash links (`RING_LINKED`, `SPOKE_CHANCE`, the odd-ring boundary links removed). One region (int) first, the others on the old layout, so the pictures can be compared.                                                                                                                                               | The int region has no cluster node on any route between two places; its road nodes are generic; `tree.test.ts` passes for it.                               |
| **T4**   | Districts and templates        | Templates (Avenue, Ring, Fork, Knot, Ladder), cluster shapes (row, twin, great wheel), the placement function, the five other regions, unequal sectors and reach; `SAVE_VERSION` bumped and `migrate` hands passives back as before.                                                                                                                                                                                                                                 | All six regions on the new layout; section 5.3's step counts hold; the picture shows six different silhouettes.                                             |
| **T5**   | Peninsulas, bridges, landmarks | Keystone approaches, the three bridges, the great wheels, nexus slots filled with existing notables (4.4).                                                                                                                                                                                                                                                                                                                                                           | Each keystone is a dead end 4–8 nodes long at a distinct tip; bridges exist and are named; a nexus slot holds a notable or a plain junction.                |
| **T6**   | Locality                       | Locality applied by the emitter (section 6): clusters of an archetype family move to a district at home, spread by how broadly the archetype is used; weapon-specific smalls leave the roads. **No new nodes and no engine work.**                                                                                                                                                                                                                                   | The audit shows archetypes mostly at home; no weapon-specific small on a road.                                                                              |
| **T6.1** | Audit by simulated players     | Twelve agents, each given a short brief of a build to make (section 9.1) and `explore` plus the region pictures; each allocates about 100 points and keeps a log. Raw reports go to `docs/tree/playtest/`.                                                                                                                                                                                                                                                           | Twelve reports exist, in the format of 9.1; nothing in the tree has changed yet.                                                                            |
| **T6.2** | Response to the audit          | I triage every complaint (confirmed, plausible or artifact; 9.1), check the confirmed and plausible ones against the tree data, and make small changes within the spec only (9.2). The triage table, with what was done and what was declined and why, goes in `docs/tree/playtest/triage.md`.                                                                                                                                                                       | Every complaint has a verdict; every change is small and listed; pictures before and after; anything larger is on a "later" list, not done.                 |
| **T7**   | Tree screen                    | Only what the audit shows is missing, if anything: the wedges, colours and camera stay as they are (D1). Likely at most the wedge fitting the new layout. Phone check at 375×812.                                                                                                                                                                                                                                                                                    | The tree screen still reads at 1280×720 and 375×812; no change to taps or the pinch zoom.                                                                   |
| **T8**   | Balance and the bot            | `scripts/simpar.sh` on all classes (12 a class, two seeds) before and after; the bot's tree choices (does it take the nexus, does it cross a bridge); the 123-point sizing of 5.4; adjust unit and cap values. Findings go in `docs/PROGRESS.md`; **no tuning of anything but the power table and district sizes.**                                                                                                                                                  | Median map reached per class is not lower than before by more than the noise of two seeds, or the cause is written down; no class never reaches a district. |
| **T9**   | Wrap-up                        | DESIGN.md §9 and Appendix A (the decisions of section 11), TREE.md status line, PROGRESS entry, patch notes (the tree has changed; refund of passives), CLAUDE.md line, dead code removed (`RING_START`, `RING_STEP`, `FAMILY_ORDER` ring sorting), real-device pass noted for MOBILE.md §9.                                                                                                                                                                         | The documents agree with the code; `grep` finds no use of the removed constants.                                                                            |

**Order.** T0 → T1 first (T1 needs the user's eyes). T2 is independent of the layout and ships alone: it fixes points 2 and the
hub half of 4 at once. T3 → T4 → T5 are the layout, in order, one region first so that a mistake is cheap. T6 needs T5's
slots. T6.1 needs a finished layout and locality, and comes before the bot pass so that T8 balances the tree the players saw after
T6.2. T7 only if the audit asks for it. T8 needs everything.

### 9.1 T6.1: the simulated players

Twelve agents (the Agent tool, run in parallel), two per class start, each a player who knows action RPGs and has never seen
the plan. Each gets one brief and the tools: the `explore` interface, the pictures of the region they start in and the
neighbouring ones, and the one-line rule "you have about 100 passive points; build the character the brief describes; do not
simulate the game". Nobody is told what the designers intended. The briefs mix home and off-class builds, so that the cost of
crossing the tree is also tried: for example a Vanguard two-hand slammer, a Vanguard who wants minions, a Strider bow and
a Strider who wants traps, a Mystic caster of fire and cold, a Mystic who wants armour, a Reaver sword and bleed, a Reaver
totem build, a Zealot aura and curse build, a Zealot who wants a bow, a Shade trapper, a Shade poison dagger, and a Shade
who wants a life-based melee build.

Each agent writes, in this order: (1) a first impression from the picture, before using the tool (what they expect, where they
would go); (2) a log of the allocation, with the decision points; (3) a table of **frictions**, each with node ids, a kind
(_lost_: could not tell where to go; _wasted_: points spent on nodes they did not want; _missing_: an option they expected;
_dead_: a region or cluster that looked pointless; _confusing_: a node or road that did not read; _weak_: a node not worth its
point; _good_: something that worked), a severity from 1 to 3 and what they would change; (4) the build they ended with and how
far it matches the brief.

**Simulated players are not always right.** They get tool interfaces wrong, misread a stat, ask for what the game lacks, and
complain about a cost that is intended (a long walk to an off-class archetype). The triage of T6.2 does not count votes. A
complaint is **confirmed** if two or more agents independently report it or it can be shown in the tree data; **plausible** if
one agent reports it and it fits the principles of section 2; **artifact** if it comes from the interface, a misreading, a request
out of scope (a node type that does not exist) or the intended cost of crossing. Only the first two are acted on, and each is
checked against the data first.

### 9.2 T6.2: what counts as a small change

Allowed: moving a cluster to another slot or district, adding or removing a link, lengthening or shortening a spur, changing
a road pool's weights, a value in the power table, regrouping a cluster's families, swapping which existing notable fills a nexus
slot. Not allowed: a new template, new nodes, a new stat, anything in the engine, a change of the wedges. A fix that needs more
goes on a "later" list in the triage file, with the complaint that asked for it.

---

## 10. Not in this plan

- **New keystone mechanics.** The 27 stay; only their placement and approach change.
- **New nodes of any kind**, including hand-written conjunction nodes for a nexus, and the engine work they would need (D5).
- **Masteries, jewels, ascendancies, a bigger point budget**, and any respec or refund rule beyond the one the save migration
  already has.
- **Node art**: the 18 emblems and the colour language stay (TREE.md); nothing in this plan changes them.
- **A different tree screen** (a grid, a list, a three-tree layout): the camera, pinch zoom and taps stay as MOBILE.md built them.

---

## 11. Decisions

The answers of 2026-10-11. Appendix A of DESIGN.md records them in T9.

| #      | Question                                                      | Answer                                                                                                                                                     |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | New backgrounds for districts?                                | **No.** The wedges are fine as they are. Districts live inside the wedges and are not drawn. (The charter in section 7 still needs the user's eyes at T1.) |
| **D2** | Locality: home with one cluster in each neighbour, or strict? | **Neither as a rule.** It is subjective and depends on how broadly used the archetype is; mostly they spread a bit. Section 6 is a tendency, not a quota.  |
| **D3** | Regions unequal on purpose?                                   | **Yes.** Unequal contents (districts, reach, density, shape); the wedges stay equal (D1).                                                                  |
| **D4** | Notables stronger relative to smalls, re-balanced by the bot? | **Yes.** The power table is the knob.                                                                                                                      |
| **D5** | Nexus notables the engine cannot express?                     | **No new nodes for now.** A nexus is a slot filled by an existing notable, or nothing. No engine work.                                                     |
| **D6** | Save compatibility: bump once and refund passives?            | **Yes,** once, in T4. T2 changes values but not ids.                                                                                                       |

Decisions to record in DESIGN.md Appendix A: the road/cluster separation (3.1), the power table and its caps (4), the district as
the unit of design (3.3), locality as a tendency (6), distances from a start (5.3), the removal of hash-chosen links, and the
retirement of the old band tests (section 8).

---

## 12. Risks

| Risk                                                                                                                                      | Mitigation                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hand layout is more work than slot arithmetic, and a template that collides with another breaks the no-overlap test.                      | One region first (T3); the existing clearance tests run on every change; `tree:pic` makes a bad layout visible in seconds.                                                 |
| Buffing notables makes builds stronger and breaks the difficulty tuning.                                                                  | D4: one table, and T8 measures before and after on the same seeds. The cap on flat generic stats limits the worst case.                                                    |
| A power table can be gamed by the stats it cannot price (charges, conditionals).                                                          | The first table is a seed; T2 lists everything it could not price, and those notables get a hand-set unit value with a comment.                                            |
| Districts built on the reference's sectors inherit its imbalances (a sector with five analogs of one family).                             | The supply check in T1 counts per district; where supply is short the translator makes a new analog (it has the machinery), never a copy.                                  |
| The bot's `tree` scoring ignores the nexus or avoids bridges, so the sim says the new tree is worse.                                      | T8 reads what it takes; the bot chooses by build score, so a better node is taken; any engine stat unread by the sheet is found by the existing "every stat is read" test. |
| The simulated players mislead (they complain about intended costs, misuse the tool, or agree with each other because they share a model). | The triage rule of 9.1: no vote counting, confirm against the tree data, prefer data to opinion; the user looks at the pictures too.                                       |
| Players lose their allocated passives on the save bump.                                                                                   | Same migration as TREE.md's: points handed back as unspent, once (D6), noted in the patch notes.                                                                           |
| Other agents change `build.ts`, `spec.ts` or `TreeView.tsx` at the same time.                                                             | T3 starts by announcing the files; new code goes in new files (`districts.ts`, `roads.ts`, `power.ts`), and the old layout code is removed only in T9.                     |

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

---

## 14. Progress

### T0, tools (2026-10-11)

`npm run tree:audit` (the measurements of section 13, for information; `docs/tree/audit-t0.txt` is the baseline), `npm run tree:pic`
(a PNG of the tree or a region, no dependency: `scripts/tree/png.ts` is a small rasteriser with a bitmap font; `docs/screenshots/tree/t0-baseline.png`),
`npm run tree:explore` (build with the tree from a terminal: `new`, `show`, `near`, `reach`, `region`, `find`, `alloc`, `unalloc`,
`summary`, `legend`; the interface the T6.1 players use). The plan's user answers of the same day are folded into sections 3.3, 3.4,
4.4, 5.1, 6, 8 and 11: no new backgrounds, no new nodes, locality as a tendency, wayside clusters, an open and mixed centre.

### T1, charter (2026-10-11)

`src/data/tree/charter.ts` (typed data, not `docs/tree/charter.json` as the plan said: the layout reads it at build time). 27 districts,
four or five a region, each with groups, a template, a nexus (an existing cluster that pairs two groups, or none) and the keystones
at its tip; 262 of the 357 clusters are in districts and 95 (27%) are wayside on purpose. `npm run tree:charter` prints the supply; `charter.test.ts` checks it (every
id exists once, in its own region, districts of a region have different templates, every region keystone is placed once, wayside
is between 15% and 50% of a region). The list was written by hand from the generated clusters, with the user's leave to choose
the districts. Names are working titles and are not drawn.

### T2, power and coherence (2026-10-11)

`src/data/tree/power.ts` (units are the median of the small nodes of the same line; stats no small node gives have hand-set fallbacks;
counted stats such as a maximum charge are priced per +1) and `scripts/tree/balance.ts`, run by `npm run tree:emit` after the
translation (`--report` lists every change):

- 196 small-node values were made one value per line (maximum life 1.7/3/4/5 became 5; energy shield 5; armour and evasion 12);
- 63 clusters whose small nodes shared no stat with their notable were given small nodes that match it (3 could not be: they stay);
- 30 notables under the floor were raised to it (no line was added; values only, so Bloodwell 5% life became 15%);
- the hub's themes are generic (`hubLife`, `hubDamage`, `hubRes`, `hubMana`, `hubEs`, `hubDefence`); the three hand-made notables
  below the floor (priced as "more" damage) were fixed by the fallback and their small nodes brought to the units.

Node ids and the layout are unchanged, so saves load as before. New tests in `tree.test.ts`: every notable at least the floor (units
measured from the tree's own small nodes), one value per line across the generated clusters, no tag or condition in the hub's small
nodes. Bot sample (8 runs a class, seed 5, scaling 1.5, before and after; `scripts/simpar.sh`): median map reached 10 → 12.5
(vanguard), 10 → 10, 4.5 → 5, 10 → 10, 6.5 → 6.5, 15 → 14.5 (shade); no class collapsed, and eight runs cannot tell more.

### T3 and T4, the layout (2026-10-11)

Built together (a committed state with new node ids needs the save bump). `builder.ts` (nodes, links, clearance, `travel`, now with a
pool of generic road stats and a no-crossing check), `shapes.ts` (loop, stalk and dead-end spur, each with one entrance),
`layout.ts` (five district templates as tables of junctions, roads and slots; a collision-safe `hang`; roads that bend round a
blocked cell; the open middle; keystones; wayside clusters), `plan.ts` (placement and roads by hand, from `scripts/tree/pack.ts`),
`roads.ts` (the pools). Choices made while building, none in the plan: the knot is a honeycomb (a square grid looked artificial);
templates vary between regions (the first pass gave every region one knot, one ring and one fork, which was the old
sameness again, so int has one of each, the others a different mix and only three regions have a knot); the middle has three
spokes, not six, and finer roads (`HUB_STEP` 100) so that crossing it costs what a class's own corner does; roads are
`ROAD_STEP` 185 apart (115 gave 2,760 nodes). The wedges and the camera are unchanged (D1). The old ring builder, `build.ts`,
`tree:mix` and the band tests are gone; `SAVE_VERSION` is 11 and a version 10 save keeps its run and gets its passives back.

### T5, peninsulas (2026-10-11); what is not built

Keystones sit on a peninsula of four small nodes themed to the keystone (`SPUR` in `layout.ts`; the minion, totem, brand and
aura keystones borrow the small node of a generated cluster of that subject), at the district's junction farthest from the middle,
pointing out. **Not built**, the plan's cheapest items to drop: the great wheels and the row and twin cluster shapes (the ring and
honeycomb districts carry the landmarks), the three named bridges between regions (no new nodes: a bridge would be a road
between two outer gates with an existing notable at its middle). Whether they are missed is for the audit to say.

### T6.1 and T6.2, the audit by simulated players (2026-10-11)

Two rounds of twelve agents each (24 builds of about 100 points, home and against the grain of the start; raw reports in
`docs/tree/playtest/round1` and `round2`, the triage with every verdict, and what was declined and why, in `triage-round1.md` and
`triage-round2.md`). The agents had pictures (`tree:pic`) and `tree:explore` and no access to the docs or the source.

**Round 1** found that nine of twelve could not leave their own region: a class start cannot be walked through, and a region's only
door was its own start (1,667 to 1,759 of 2,165 nodes out of reach; the old connectivity test let paths run through starts). Fixed
with two roads from the ring of the middle into every region (then `HUB_LINKS`; since iteration 3, forks) and a test that walks the tree as a player does. Also:
roads were half +10 attribute nodes (now one in three, junctions are small nodes of the region's stats, roads 215 apart, no accuracy
filler on dex roads), Steady Draw was exactly neutral (35% more damage now), keystone cards lacked their numbers, "per 1
charges.grit" leaked into text. Declined: "make starts passable" (the roads are the fix), "a notable beside every start".

**Round 2** (scores 7 to 8 of 10): eight could not tell from the picture where a theme lives. Fixed with a search box on the tree
screen (every word, any order; matches ringed; Next jumps), `explore find` by all words and a `path` command. The middle was worth
nothing (its notables were three small nodes' worth against five; its roads gave mana and energy shield): now as strong as a region's
median and generic-only roads. Five archetype clusters moved to their district (`docs/tree/overrides.json`); repeated lines on a
card are one line with the sum. **Later** (new nodes, D5): life on hit, spreading poison, ignite damage, warcry, stun power, curses near
a Mystic, minion block near the minions; and a game rule, three players' complaint: a refund keeps the road nodes of a notable.

What the audit changed in the plan: the plan expected the layout to be judged on its look; the players judged it on whether they
could get where they meant to go, and the biggest defect was one the tests did not know to look for. The tests now say it.

### Iteration 3, crossings and forks (2026-10-11)

The user's review of the built tree, three points, to be met by small changes rather than a new layout:

1. **The regions met only in the middle**, which shut out builds across two regions. Now `bridges` (`layout.ts`) joins each pair of
   neighbouring regions with a road half way out (1,700 to 3,000 from the centre) and one near the rim (beyond 3,300), between the
   nearest road nodes of the two sides that have room (a road node on at most two roads and with at most three links, so no node
   becomes a star), straight or with one bend. Eleven of the twelve are built (dex and strdex have no room half way out; they meet at
   the fork, below).
2. **The paths around the starts were ugly.** The ring sent two roads from each junction between two classes, one into each
   region, to the nearest gate: they ran as long diagonals beside the starts, three nearly parallel lines meeting past every start.
   Now `gateways` sends one road from each of those junctions straight out along the line between the two regions to a fork (1,000
   to 1,400 from the centre), and from the fork one short road into each region. `HUB_LINKS` is gone.
3. **Long roads could be entered only at their ends; honeycombs were so connected no path was a choice.** A district wider than
   1,100 with fewer than three ways in gets a side door from its junction farthest from them, and once the tree is laid
   (`chainDoors`, after the crossings) every road of nine nodes or more each on two roads gets one from its middle, to the nearest
   road within 900 that is at least nine steps away by road. A honeycomb (`knot`) keeps a tree through its corners and about a
   third of its other sides, by a hash, and drops corners left as empty dead ends.

Measured, before and after: roads between regions outside the middle 0 and 11 (plus the six forks); roads of nine nodes or
more with nothing along them 3 and 0 (longest 13 and 7); loops of roads inside int 16 and 8, strdex 14 and 8, str 14 and 7; from an
outer notable (beyond 2,500) to the nearest outer notable of the next region, median steps 31 to 41 and 16 to 22; from a start to
the nearest district of another region 12 to 16 and 7 to 13 steps. 2,052 nodes (was 2,032). `SAVE_VERSION` 12 hands passives
back again. The three crossing edges inside overlapping clusters were there before and still are.

The tree screen also reads better at a glance: three more colours, each with its own emblem in the legend: **spells** (violet,
a star; spell damage and cast speed, which were mana's), **energy shield** (pale blue, a ring; was mana's) and **damage of every
kind** (warm white, a burst; untyped damage, which was coloured as an attack). Damage-over-time multipliers are chaos's (poison) or
their element's, and mine damage is the minions' and deployables', as trap and totem damage were.

### Iteration 4, the first steps from a start (2026-10-11)

The user: some classes need more basic stuff at the start of their tree (noticed on the Mystic); two major paths out of the start,
each with side options, and quick skips to nearby regions, is a good baseline for every class; "two outward facing paths and the
inward one". Measured, a start had one road into its region (and the spoke to the middle): within 8 steps the Mystic had 6 notables
and the Vanguard 2 (the others 14 to 18).

- **A second road out of every start** (`layout.ts`, in `layoutRegion` after the plan's roads): to the nearest junction of a
  district (within 350 to 1,600) that lies at least 40 degrees away from the first road, so that the two go different ways and each
  has the branches of its district. Every start now has three links: the spoke and two roads out (a test says so).
- **A quick skip from each road** (`startSkips`, after the crossings): from about the third node of each road out of the start, a
  road to the nearest road of another region within 900 that is not near by road. Without the middle, every start now reaches both
  neighbouring regions within 6 to 18 steps (it reached none before iteration 3); a test says within 20.
- Notables within 8 steps of a start, before and after: Mystic 6 and 13, Vanguard 2 and 7, Zealot 14 and 18, Shade 15 and 19, Strider
  18 and 19, Reaver 17 and 17. 2,061 nodes (was 2,052). `SAVE_VERSION` 13 hands passives back again.

### Iteration 5, tiers, starter kits, the middle, crossings and shapes (2026-10-11)

The user: the starts still lack basic stuff near them; all classes should reach some life or energy shield (not too much: a balance
lever) and the basics of the class early; "the first 10 or so should be very core, the next 40 a few pretty core archetype options,
the outer stuff the narrow weird ideas"; the middle too uniform, too connected, too dense; 50 to 80% more crossings between
regions, some dear; not every notable in a little ring. An independent agent critiqued the result (picture and numbers) and its
points were weighed (below).

- **Tiers.** The districts of a region are listed in the charter nearest the start first: the very core basics (Wellspring, Veil,
  Windwalk, Bulwark, Ironhold, Cassock), a few core archetypes, the narrow ones last. `pack.ts` packs in that order, each no nearer
  the middle than the one before (less 100), the first at least 1,150 from the start (`APRON`). The curses left the Veil (it is the
  Shade's core) for the Venom Quarter. Narrow wayside clusters (a weapon, a skill type, charges, hexes, minions) hang only from 2,700
  out (`isNiche`); no wayside hangs within 10 steps of a start.
- **The apron.** Within about 6 steps of a start only the class's kit: the small nodes of each of the two roads out are set from
  `START_KIT` (`roads.ts`; e.g. Mystic: ES, cast speed, mana, spell damage on one road, crit, spell damage, cast speed, mana on the
  other), and one hand-made basic notable hangs on each road (`STARTERS`: 12 in all, e.g. Lamplit Well, Iron Constitution, Light
  Tread; their small nodes are another stat of the road so that life and ES do not pile up). Life and ES on the way out are 5 to
  10% a road, with the notables 10 to 15%. The second road goes to the next district.
- **Crossings.** `bridges`: one road per neighbouring pair in each of three radius bands (inner, middle, rim) and a long one,
  that costs many nodes, between pairs that lack them; a node takes a crossing if it has at most two roads and four links. 19
  crossings (was 12, +58%), every pair 2 to 4. New roads keep at least 22 degrees from the roads of the node they join (`spreadOk`);
  the plan's own roads and a district's template are as authored.
- **The middle.** The ring wobbles in radius (15%) and angle (4 degrees) by a mixed hash, three of its twelve arcs are left out
  (never two side by side, never cutting a part off), the nodes are 140 apart (was 100), two spokes (was three), six hub clusters of
  six different shapes. The three keystones of the middle moved from the ring beside the starts of the Shade, Reaver and Zealot (a
  keystone of no use to the class five steps away: the critique) to the central wheel, about as far from every class. 97 hub
  nodes (was 122).
- **Shapes** (`shapes.ts`): a cluster is a loop, a stalk, a crescent (open arc, notable at the apex) or a wing (V, notable at the
  apex), by a hash of its id and its small nodes; related clusters of a group (never two of the same stat) are sometimes fused: a
  **twin** (one ring, two notables) or a **string** (a line of two or three, each notable after its own small nodes: a dead end).
  A fused cluster has the id of the first, one entrance, and falls back to its parts when there is no room. 31 clusters hold more
  than one notable.
- **Speed.** The bend search of `connect` made the build 6.6 s; exact clearance shortcuts (boxes, squared distances, a rollback that
  touches what it changed), a cheaper bend search where many pairs are tried and a cap on the long ones: 0.74 s (it was 0.8 s before
  iteration 3).
- **The critique, and what was done.** Done: the keystones; the kit (the two Mystic roads were the same, too much mana, Vanguard
  regen, Strider without life); the Shade's core district holding curses; the starters of identical text; fusing two clusters of the
  same stat; the middle's wobble (the hash ramped, the ring only shifted: the critique saw 465 to 474); crossings between nodes at
  a near angle; the weakened start test (now 3 notables within 8 steps, 15 within 14, no keystone within 8). Not done: the rim
  crossings being long (the user wants some dear), ruler-straight roads (the user wants side doors, not shorter roads), junctions of
  the district templates with fans under 20 degrees (30, as before iteration 3, the worst junction degree 6, was 8).
  `SAVE_VERSION` 14 hands passives back.

### Iteration 6, threads and basic clusters round the starts (2026-10-11)

The user, three times: still sparse around the starts; add about 50 basic and notable nodes in the sparse sections, looking at the
reference tree for inspiration; "don't measure, look at it": long costly stretches with no nodes right outside the starts; and "a
fork between various simple basic lines does not add any decision, it is brainless; the reference does this much better". Looked at
by eye (the six starts, `tree:pic`), the cause was iteration 5's own: the first district pushed 1,150 from the start left long,
ruler-straight roads of plain nodes with forks between them and big empty pockets beside them. (The reference data has depth and
sector, no places; the kinds near its starts are life, mana, damage, attributes, accuracy, the speeds, energy shield, resistances.)

- **Threads** (`threadStarts`, `roads.ts THREADS`): within 2,300 of a start, outside the kit's first 6 steps, every stretch of road
  between two forks is one stat from the class's palette (generic: life, ES, armour, evasion, the speeds, crit, accuracy, mana,
  resistances), and the stretches that leave a fork get different stats; so a fork is a choice between lines about something.
- **Notables on the path** (`PATH_NOTABLES`): the node beside the far fork of a few of the nearest threads is a basic notable of the
  thread's stat (Hushed Reserve for an ES line, Ox-Hearted for life, Plate and Padding for armour; ours; 13 are placed).
- **Basic clusters in the voids** (`fillSparse`, `FILL`): six a class (a notable and three small nodes, themed to the basics: life
  regeneration, resistances, stun threshold, physical melee, projectile speed, mana, reservation and the like), each hung where the
  ground beside a road within 3,100 of the start is emptiest (the farthest from any cluster node), the first for every class
  before any class has two. About 120 nodes in all (2,133 to 2,260 with the 13 on-path notables, which change nodes). Asked for
  about 50: at that number the voids did not change on the picture; trim by deleting entries of `FILL`.
- Tried and left: pulling the first district in again (`pack.ts` with APRON 650): the wedge is full, the districts stand where they
  stood; and counting bare runs of road (forks cut them short) or steps to the nearest cluster (a 3-node stretch is a wide void
  at this scale): the emptiness of the ground, by eye, was the right measure.
  `SAVE_VERSION` 15 hands passives back.

### Iteration 7, attribute highways, no plain damage, pods (2026-10-12)

The user, three subtle points: (1) too many nodes with content on the highways; they should be almost only attribute nodes, with a few
special sections of life or energy shield or other super simple stats; (2) base "increased damage" nodes should not exist at all
(universally good, no trade-off); (3) the groups of related clusters (five life clusters together) are good but a bit too big and
isolated: two or three, perhaps two by two and a one by one, instead of one.

- **Highways** (`builder.ts travel`, `layout.ts junctionNode`): a road is attribute nodes; one road in six (and one junction in six)
  is a section of one simple stat from the region's pool, which is now only life, energy shield, armour, evasion, mana, regeneration,
  movement speed and resistances (no damage, crit, speeds). Roads were a third attribute nodes, now 77% (`ROAD_POOLS`). The threads of
  iteration 6 are sections too: one chain in four near a start, and the kit of the first steps stays.
- **No plain increased damage** anywhere (the emitter drops it; no test pins it): out of the road pools, kits, threads, starters, fills and the hub (the
  hub's damage notable is attack and cast speed); the five generated clusters that had it lose it in the emitter (`balance.ts`: a
  small node of it becomes the notable's own stat, a notable keeps its other lines); two hand-made themes (against cursed enemies,
  while leeching) have conditional damage and a curse effect instead. Damage that needs something (a tag, a type, a condition) stays.
- **Pods** (`charter.ts splitIntoPods`): each group of related clusters is split into pods of four (two by two) and what is left (a
  two or three; a lone one is a wayside cluster by the road, as are the nexus clusters): 27 authored districts become 74 pods, in the
  same tiers and order, each a small district (knot, avenue or ladder: a ring is 400 across before it holds a cluster). Keystones go
  to the biggest pods in turn. `pack.ts` (now REACH 380, GAP 100, APRON 700 by default) places them; the layout tries the nearest other
  junctions of two pods when a planned gate is shut, before it gives a road up. The tree is wider (about 11,000 across) and has 2,500
  nodes (was 2,260: the roads between 74 pods); routes are 65 to 71% attribute nodes, the first notable is 5 steps away, the nearest
  keystone 9 to 12, the median keystone 23 to 27 (as before); 22 crossings between regions.
- Found on the way: the fill clusters' nodes had no region (a line lost in a rewrite; a test says every node has one now).
  `SAVE_VERSION` 16 hands passives back.

### Iteration 8, clusters joined to a second place (2026-10-12)

The user: many more potential paths, by joining clusters to two different sections (a picture: a short link between two clusters); the
class starts joined straight into clusters of core stats, which are in turn joined to the clusters near them, so the starting area is
knit together; and two rules: a build must have some chance of wanting both clusters of a link, and following a link must generally
cost more nodes than the highway, so that it is worth it only for the clusters.

- **`linkClusters`** (`layout.ts`, after every road is laid): a short link (the road code: attribute nodes, 150 apart; none when the
  nodes are near) joins a node of one cluster to a node of another within 700 units; so a cluster can be passed through, and passing
  takes its nodes. About half of the other clusters get one (by a hash), none more than two, the starters three. Keystone clusters and
  the middle's are left as they are.
- **Rule 1, a build wants both** (`affinity.ts`): a cluster is a set of categories read off its notable (life, armour, evasion, energy
  shield, resistances, mana, spells, attacks, crit, elemental, chaos, physical, minions, traps and the like, curses and auras,
  charges, flasks), and two categories either go in one build or do not (the defences all go together; life with physical and charges;
  spells with crit, elements, energy shield and curses; attacks with crit, physical, elements and the defences; and so on). A link
  needs one pair that goes.
- **Rule 2, dearer than the highway**: the steps through the two clusters (in at one, along its ring, the link, along the other's ring,
  out) must exceed the steps along the roads between the nodes they hang from (the table and the counts are measured when the link is
  made; a link that would be a shortcut is taken back). In a sample the way through was 3 to 10 steps against 0 to 5 by road.
- **The starts**: each start is joined straight into its two starter clusters (the hand-made basic notables), those are joined into
  the related clusters near them, up to three links each; a start then has the spoke, two roads and two clusters. _Straight_ means
  one edge: the starter clusters stand beside the start (113 to 262 units, hung from the start itself, after every road exists so
  that they cannot shut one out) with no road node between. (The first version hung them down the lead-in road and joined the start
  to them by a link that had to cost more than the highway, which made it no shortcut at all: a mistake, the user's correction.)
  2,617 nodes (the link nodes; was 2,500); about half the clusters have a second entrance (210 have two, 26 three).
- **Baked at build time** (the user: a slow layout is fine if it is done once, at build time): the layout takes about 1.5 s and the
  game used to do it in the browser (and every test file that touched the tree did it again). `npm run tree:bake`
  (`scripts/tree/bake.ts`) now lays the tree out and writes the finished nodes to `src/data/tree/treeBaked.ts` (604 KB of JSON in one
  string literal, parsed once); `getTree()` returns it, and `layout.ts` no longer runs in the game. Run it after anything that
  changes the tree (the charter, the plan, roads, shapes, the clusters, `roads.ts`); a test compares the file with a fresh layout and
  fails until you do. The suite went from 112 s to 27 s (the speed test that failed under load stopped failing), and the bundle grew by
  about 0.45 MB (73 KB gzipped). The tools still lay out afresh (`TREE=new`).
  Two small-node labels that read exactly as reference gems ("Life Leech", "Elemental Damage with Attacks") say it another way now
  (the IP scan sees the baked tree).
- Found on the way: `rollback` left a link between two old nodes in their lists when it was undone (some pairs were joined six
  times); it takes back exactly the edges it added now. The test of one entrance per cluster is now one to four; a start test allows
  its links. The test of plain damage was removed at the user's word (the emitter drops it).
  `SAVE_VERSION` 17 hands passives back.
