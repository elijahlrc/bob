# G. Growing the network: more wanted nodes than any build can reach

Plan written 2026-10-22, for the user's review before any work starts. It follows phase F of
[PASSIVE-TREE.md](../../PASSIVE-TREE.md); every rule it relies on is in [CONSTRAINTS.md](CONSTRAINTS.md), which wins
wherever the two disagree.

## 0. What the user asked for

Grow the network substantially, probably to about 1,500 to 2,000 nodes (it has 1,009). The growth exists to create
**tension**: a classic caster should not be able to take all the spell damage and all the energy shield it wants, and a
strength sword build should not be able to take all the life, all the armour and all the sword damage. The way to get
there is more desirable nodes than a build can reach, so it has to choose. The user's process points: building a good
tree is hard, so be strategic; break the problem into sections; audit in several rounds; simulate a build's worth of
points for different archetypes; keep CONSTRAINTS.md at hand throughout. Filling empty space may be enough, or the map
may have to grow, in which case new roads and broken links come with it.

Answered before writing (2026-10-22):

- **Budget:** tension is judged at both about 60 points (mid-run) and 120 (a finished build).
- **Power is not a target or a measure** (the user, 2026-10-22). A build's strength has too many moving parts to judge
  from a few stats, and today's power levels are not balanced anyway. The aspiration is that growth adds choice rather
  than strength: new nodes are priced like the old ones (a small is one unit, a notable 3 to 5; CONSTRAINTS §8.1, §8.6),
  and more desirable nodes compete for the same points. Balance is a separate job, not this plan's. What is meaningful
  is power in **one stat at a time, or a pair** (the user, 2026-10-22): how much spell damage, or life and armour
  together, a build's best plan collects. That is reported (below), never totalled into one number for a build.
- **Saves:** the expansion ships with one refund of everyone's passives (a save version bump), so the plan may rewire
  anything.
- **The Strider** is grown and rewired like every other region, with no special deference to the user's hand edit of it.

## Start here (state on 2026-10-22)

Plan approved by the user on 2026-10-22, with the two edits above (no power target; no deference to the Strider) and
single-stat power added. **G0 is done and stop 1 passed (2026-10-22):** the user agreed the measure (tension is what
more points would still buy; the first version's step-count radius was rejected, see §1 and CONSTRAINTS §14) and the
five targets in [G0-baseline.md](G0-baseline.md) ("Stop 1"). **G1a, the specialization ledger, is next**
(`G1-ledger.md`). The tools are
`scripts/passives/archetypes.ts` (27 archetypes), `scripts/passives/builds.ts` (`npm run passives:builds`: the
allocator and report; `--pics`, `--json`) and `scripts/passives/supply.ts` (`npm run passives:supply`: supply map and
empty space); their output is in `G0/`. `builds.ts` ends with a summary against the targets. Tools already
in the repo: `passives:pic` (`--region`, `--box`, `--text`, `--ids`), `passives:list`, `passives:audit`,
`scripts/passives/geometry.ts` (crossings, overlaps, bends), `tighten.ts` (layout first pass), `fold.ts` (editor
patches), `passives:register`, `passives:bake`. Node units come from `lines.ts` (`Line.units`); the built network from
`buildAll({ allowNew: true })` in `src/data/passives`. Layout rules for new nodes: CONSTRAINTS §11 item 5; the layout
process: §15 item 10.

## 1. What "tension" means, so it can be measured

A walk by eye is still the judge (CONSTRAINTS §15.2), but the walks need a common yardstick, so this plan adds one.

- **What a build wants.** An archetype is a set of weights over the stat families of `lines.ts` (a cold caster: spell
  damage, cold, cast speed, spell crit, energy shield, mana; a strength sword build: life, armour, sword and melee
  physical damage, attack speed, accuracy). A node's value to it is the sum of its lines' units times those weights,
  priced as `lines.ts` already prices them. These weights describe a player's wishes; they never decide where a node
  goes (CONSTRAINTS §14: the network is not designed from a list of builds).
- **What it can get.** An allocator buys the most valuable connected set of nodes from the archetype's start for a
  budget of 60 and of 120 points, and searches for alternative plans that score nearly as well.
- **The numbers each walk reports:**
  - **What more points would buy** (replaces "reach", 2026-10-22): the best plan at 60 and at 120 points, grown by 20
    and 40 more points while keeping every node it has, and each main stat's amount at each step. A main stat that 40
    more points barely raise is one the build already has all it wants of: no tension. One that keeps climbing is one
    it had to leave behind. The allocator decides what is worth reaching, because it pays every path's cost. The first
    version counted the value within a fixed number of steps of the start; the user rejected that, since a build may
    stay compact or run long narrow branches to spread stats, and no step count says what it can reach.
  - **Choice:** how many plans that differ in at least a few notables score within about 5% of the best, by the
    archetype's own weights (a comparison of plans for one build, not a measure of its power). One plan far
    ahead of the rest means the network has made the decision for the player; three or more means a real trade-off.
  - **Tax:** the share of points spent on nodes worth nothing to the build (roads it only passes through). Some tax is
    the price of a choice; a lot is filler.
  - **What it gave up:** the wanted notables and keystones that 40 more points would add, at 60 and at 120. This is
    the list the user reads.
  - **Per-stat totals:** for each of the archetype's main stats, and for its main pair (spell damage with energy shield,
    life with armour), the total its best plan collects, in the stat's own terms (120% spell damage, +45% armour), at
    each step above. Compared before and after, and between archetypes that share a stat, one stat or pair at a time.

Targets are set from the baseline once it is measured (G0) and the measure is agreed with the user. The allocator is a static tool over the network and the units, not the bot simulation, so
it does not count against "no incremental balance simulations" (CONSTRAINTS §12.4); the one bot sim stays at the very
end.

## 2. The phases

Each phase ends with something the user can look at. Stops for the user's review are marked.

### G0. Baseline and tools (no change to the network)

1. **The allocator** (`scripts/passives/builds.ts`): archetype definitions in one file, best plan and near-alternatives
   at 60 and 120 points, the numbers above, and a picture of each plan on the network (`pic.ts` with the plan
   highlighted).
2. **The archetype set:** about 20, chosen to cover the axes of A1-axes.md rather than to enumerate builds. It starts
   with the user's two examples, the classic caster (spell damage and energy shield) and the strength sword build
   (life, armour and sword damage); then each class's two or three natural builds, a hybrid between each pair of neighbouring classes, and a few that cross the map (a
   summoner from the Mystic side, a dagger caster, a poison bow, a two-handed fire build, a block caster). The user
   adds or strikes some.
3. **The supply map:** for each stat family, units per region and area; for each specialization, its clusters, their
   partners and the steps between twins (CONSTRAINTS §5.1–2); a density map of the empty space the network could grow
   into without moving anything.
4. **The baseline report** (`G0-baseline.md`): every archetype's numbers today, which ones already take nearly
   everything they want (where tension is missing first), and where the empty space is.

**User stop 1:** the baseline, the archetype set and the targets.

### G1. The growth brief (design, no nodes yet)

**G1a. The specialization ledger, for the whole map first.** The decisions that make tension are global: how many
clusters each specialization and each generic want (energy shield, life, spell damage, a weapon) gets, in which regions,
with which partner each, and how far apart (CONSTRAINTS §5.1–3; concentration is chosen per specialization, not per
region). One agent writes this ledger from the G0 supply map before any region is briefed, so six region agents do not
each invent "a second energy shield cluster". The per-region briefs then place what the ledger assigns them.

**G1b. The region briefs,** one agent per region, then joined and checked by one more, all with CONSTRAINTS.md read in
full first. For each region:

- **The wants that need competition.** For the archetypes that start there or pass through, which of their wants are
  too easy to collect, and what new clusters would split them: a second energy shield cluster in the opposite direction
  from the spell damage, sword damage paired with attack speed in one place and with life in another, so that each
  direction is worth taking and no build gets both cheaply. Each new cluster names its partner and its twins
  (CONSTRAINTS §5.1: two or three clusters per specialization, apart, each with a different partner).
- **Where it goes:** fill the empty space first; extend the rim only where the region runs out of room. A region that
  grows outward gets a new outer road and new crossings with its neighbours, not just clusters bolted on.
- **The skeleton changes:** new roads and highways, links to cut, crossings to add (every border toward the reference's
  10 to 13 links per neighbouring pair, from 4 to 6 today; CONSTRAINTS §3.7), each crossing named for the combination it
  enables.
- **The size it reaches,** which falls out of the above (CONSTRAINTS §12.1). A first estimate is 80 to 130 new nodes per
  region, about 40 for the centre's generic clusters and 60 to 100 of new road and crossing nodes: about 1,600 to 1,850
  in all. The number is an outcome, not a target.
- **A checklist pass** against every section of CONSTRAINTS.md, with any tension between two constraints said out loud
  (§13).

**User stop 2:** the brief, region by region, with a sketch of each region's new skeleton.

### G2. The skeleton

Roads, highways, crossings and cut links across the whole network, before any new cluster: the frame the clusters will
hang from. Done region by region, each agent in its own folder, then one pass over every border together (border links
belong to two regions). Rendered and checked with `geometry.ts` after every batch; area labels moved where regions grew.
The allocator runs on the new skeleton to see that no archetype's road to its own home got longer for no reason. A cut
link must never leave an area, a wheel or a run of clusters with a single way in (CONSTRAINTS §3.5).

**User stop 3:** the executed skeleton, whole-network and per-region pictures before and after, before any new cluster
hangs on it. Rewiring is the hard part of growing, and a bad road is cheapest to fix here.

### G3. The clusters, in rounds

Clusters are added in rounds, not in one pass (CONSTRAINTS §12.1: grow iteratively). Each round:

1. Before ids are registered, any editor patch of the user's (`src/data/passives/edits.json`) is folded into the area
   files (`scripts/passives/fold.ts`), since the editor's numbers for added nodes collide with the next registered ids
   (CONSTRAINTS §10.5, PHILOSOPHY §5). The user may edit the network in the editor between rounds.
2. One agent per region adds that round's clusters from the brief: lines from `lines.ts` (a new line only where a theme
   needs one, checked against the engine first; CONSTRAINTS §10.3), ids registered, laid out by CONSTRAINTS §11.5 (tight
   clusters, straight chains, regular shapes), every section's smalls uniform.
3. `passives:audit`, `geometry.ts`, the names check (`npx vitest run src/data/ip.test.ts` and a grep of the reference
   tree for every new name; CONSTRAINTS §2.4) and the allocator on the whole network.
4. Walks: each region agent writes three 20-point walks and one 120-point walk through its region and names what each
   build chose and gave up (CONSTRAINTS §15.2).

About three rounds of roughly a third of the brief each, so a problem found in round one changes rounds two and three
instead of being repeated.

### G4. Audit rounds

At least two full audit rounds after the clusters are in, each by several agents with one subset of CONSTRAINTS.md
each (CONSTRAINTS §15.6), every one with the whole document at hand:

- **Network:** loops, ways in, dead ends, crossings, roads against filler (§3, §7).
- **Specializations and trade-offs:** twins, partners, one-stop shops, neighbours that should compete (§5, §8.3).
- **Node discipline:** uniform sections, wide vocabulary, live lines, notable values in units (§8, §10).
- **Starts and the late game:** the first points, keystone distances, what 120 points buys (§6, §9).
- **Looks:** tight clusters, angles, labels, readability on a phone (§11).
- **Builds:** the allocator at 60 and 120 points for every archetype, plus walks by hand for the five whose numbers
  look worst, with the gave-up lists.

Findings are fixed between rounds; a finding that shows a missing rule goes into CONSTRAINTS.md (CONSTRAINTS §15.4: fix
the meta-level problem too). Reports go in `audit/growth-1/`, `audit/growth-2/`.

**User stop 4:** the grown network: whole-network and per-region pictures before and after, every archetype's numbers
against the baseline, and the gave-up lists.

### G5. Balance and shipping

- **Node prices** checked in units across the new clusters (CONSTRAINTS §8.6), and attribute supply against gear
  (CONSTRAINTS §7.4–5), since more roads per walk means more attributes.
- **Keystone distances,** labels, the phone view of the tree screen.
- **The save version bump** with one refund of everyone's passives, as when the hand-written tree went in.
- `passives:bake`, `npm run check` and `npm run build`, then the one bot simulation for the whole change.
- The docs: CONSTRAINTS.md §12 and §16 brought up to date, PHILOSOPHY.md's state log, DESIGN.md Appendix A. Patch notes
  only through `/patch-notes`.

## 3. How the work keeps its intent

- **CONSTRAINTS.md in every prompt.** Every agent reads it in full before starting and gets the user's words of
  2026-10-22 verbatim; every report ends with the sections it checked.
- **One region per agent, one folder per agent,** as in the layout pass; border work is done together afterwards.
- **Pictures after every batch,** and before/after pairs at every user stop.
- **Pause and ask** when the work starts to feel like it is losing intent (CLAUDE.md, CONSTRAINTS §15.7), and restate the
  user's principle before any large rework.
- **No node is placed to satisfy a number.** The numbers say where to look; the reason a node is where it is stays a
  player's reason.

## 4. Risks

- **Tension by tax.** The easy way to lower reach is long roads of nothing; that is filler, not choice. The tax number
  and the choice number together catch it: more desirable nodes, not more distance.
- **Strength by the back door.** More good nodes near a start can make a build stronger without making it choose. Power
  is not measured, so the guard is the pricing of each new node in units and the choice number: a build that gains
  strength without losing reach or choice is a sign of it.
- **The allocator becomes the designer.** It is a yardstick for walks, never the source of a placement; CONSTRAINTS §14
  rejects designing from a list of builds or tuning to measurements.
- **Sameness at scale.** 600 new nodes can drift into copies of the existing clusters. The vocabulary and partner
  checks in each round, and the specialization ledger, guard against it.
- **Border conflicts** between agents moving neighbouring nodes at once: borders are done in their own pass.
- **Size of the review.** The user cannot read 600 nodes; the stops show pictures, numbers and gave-up lists, and the
  text renders exist for spot checks.
