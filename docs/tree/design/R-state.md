# The attrition rework of the tree: where it stands (2026-10-31)

The handoff for the session that rebuilds the remaining five regions. Read with `CONSTRAINTS.md` (§16 holds this
rework's decisions), `R-reviewer.md` (the reviewer agent's brief), `R-skeleton.md` (the approved skeleton) and
`R-knife.md` (the first region's plan).

## Done

- **The skeleton** is approved (`R-skeleton.md`, its sketch `R-skeleton.json` / `.png`; the review page below).
- **The Knife is done** (the owner, 2026-10-31): `src/data/passives/knife/*.ts` rewritten on the skeleton.
  - Start at radius 1,450 (`frame.ts` `START_AT`, `home.ts` `START`). Two strong two-stat exits (damage and life, crit and
    life), hubs at step 2, stat paths through Spoils and Soft Step to the seams, Keen Instinct at step 5 between the hubs.
  - 65 notables and 4 keystones (Hollow Vessel removed); offence, defence and utility in the reference sector's
    proportions (notables 62/22/17%).
  - Ten links between neighbouring clusters; seven rule-bender lines added to `lines.ts` (`damageOnKill`,
    `critVsFullLife`, `critWhileEsFull`, `speedWhileLeeching`, `damageVsRare`, `castSpeedOnLowMana`, `trapLimit`,
    `mineLimit`) and `allDamage`.
  - Other regions' links into removed Knife nodes were retargeted to the Knife's new border nodes (`bow/rim.ts`,
    `spire/craft.ts`, `spire/rim.ts`); they are temporary and are redone in those regions' passes.
- **The reviewer's brief** (`R-reviewer.md`): the reviewer is invoked dialectically for each region; its approval finishes
  a region.

## Not done

- **The other five regions** (Spire, Bow, Yard, Wall, Cathedral) and **the centre**, on the skeleton: each builder pass
  moves its start to radius 1,450 (its `frame.ts`), builds its roads and seams, places its clusters, then redesigns its
  notables against the reference sector, reviewed by the reviewer at each step (`R-reviewer.md` §6).
- **The seams**: the Knife built both of its seams and border radials; each neighbour links to them. The Spire's east
  seam is `knife.home.seams.n`, the Bow's north seam `knife.home.seams.s`.
- **The centre** keeps today's eight generic notables at the old positions; the seams link to `centre.ring.road.r3` and
  `r5` for now. It is redrawn last, between the moved starts.
- **Not baked.** The game still loads the old tree (`baked.ts`); `npm run passives:bake` runs once the whole tree is done
  (the bake test fails until then). Don't bake a half-moved tree: the owner plays in this worktree.
- **When baked:** a save-version bump with a passive refund (`migrate` in `src/run/save.ts`, using `resetTree`, which also
  clears the tree relics' records so their uses come back); the rivals pool empties for the new version.
- **Numbers** for regeneration, leech and flask lines wait for the flask stats (CONSTRAINTS §16 item 2). Names wait for the
  naming pass at the end (names clashing with stops and relics: Quartermaster, Bloodletter, Provisions, Tithe, Draught,
  Siphon).
- **Label collisions** in the Knife's render where clusters sit close (a tidy pass, not structural).
- **Nothing committed** since `624ce92`: the Knife, `lines.ts`, these docs and the rework scripts are uncommitted.
  `npm run check` is red on stale tests written for the old Respite and stop rules, by the owner's choice.

## The owner's brief for the rest (2026-10-31, run unattended)

- Order: the five regions one at a time (Spire, Bow, Yard, Wall, Cathedral), then the centre (no class start in it), then a
  review-only pass on the joins (borders, archetypes shared across regions, connections), then one final review of the
  whole tree that produces a report for the owner, not changes.
- Per region, each step reviewed by a reviewer agent (`R-reviewer.md`) before the next: (1) evaluate the current region,
  (2) a high-level plan, (3) roads and structure, (4) the notable list (the most important review), (5) build, (6) final
  review. The region is done when the final review passes.
- Commit locally after each region's final review (never push). Leave the tree unbaked at the end. New engine support for
  a good notable may be added freely (list each addition in the report). The report is an Artifact page plus a markdown
  copy in `docs/tree/design/`.

## Progress of the unattended run (keep current)

- The Knife committed as `e8b4939`. Reference sectors by class: vanguard 0, strider 1, mystic 2, reaver 3, zealot 4, shade 5.
- **Tools since:** `snapshot.ts` (each region's old files in `before/<region>.json`, taken for all five and the centre
  before any change), `region-gen-lib.ts` (the Knife's generator made general; each region's table is `<region>-gen.ts`),
  `ref-sector.mjs` (a reference sector's notables, written to the scratchpad), `offdef.ts <region>` and
  `region-map.ts <region>` take the region.
- **Border convention:** a region builds the seam and border radial on a border whose neighbour is not yet rebuilt, and links
  into the existing nodes where it is (positions of those nodes go in the table's `external`). The Spire's east path,
  mid ring and rim ring end at `knife.home.seams.n`, `knife.hex.radN.m`, `knife.rim.ring.n0`; it built the west seam
  `spire.home.seams.w`, the radial `spire.well.radW.*` and the rim vertex `spire.rim.ring.w0` for the Cathedral.
  Temporary Cathedral links into the Spire were retargeted (`cathedral/crypt.ts`, `cathedral/walk.ts`).
- **The Spire: done** (`3835be3`): R-spire.md, R-spire-notables.md, built in `src/data/passives/spire/` by
  `spire-gen.ts`. One reviewer agent per region, continued across stages with SendMessage.
- New line kinds with string arguments need an entry in `vocab.ts` SPECIAL (and CHOICES), or the tools print undefined;
  new stats need player text in `src/data/statText.ts` (another session also edits that file: commit only our hunks,
  `scratchpad/stage-stattext.mjs` shows how).
- More tools: `reach.ts <region>` (unreachable nodes, road dead ends), `ref-names.ts` (every tree name against the
  reference's notable and keystone names; the repo's `ip.test.ts` covers gems and uniques only: run both before a
  region's commit), `chart.ts <folder> <region> <out.md>` (the notables chart for review: step, before, now, units, why).
- **The Bow: done** (`ed542d7`): R-bow.md, R-bow-chart.md, built by `bow-gen.ts`.
- **The Yard: done** (`b52303a`): R-yard.md, R-yard-chart.md, built by `yard-gen.ts`. `sustain.ts <folder> <region>`
  tallies sustain lines before and after.
- **The Wall: done** (`70ae190`): R-wall.md, R-wall-chart.md, built by `wall-gen.ts`. More tools: `exits.mjs`
  (own notables per exit within 8/10/14), `steps.ts` (steps between named notables), `scale.ts` (scale a notable's lines
  to a target price, printing `over` entries).
- **The Cathedral: done** (`d803ae3`): R-cathedral.md, R-cathedral-chart.md, built by `cathedral-gen.ts`.
- **The centre: done** (`35da117`): R-centre.md, built by `centre-gen.ts`; the six bare paths to a seam run through home clusters.
- **The joins pass: done** (`e0738f0`). **The final report: done**: R-final.md and https://claude.ai/artifact/L8VGCfd6NDWz5oJBEuEU8a. The unattended run is finished; what remains before baking is in R-final.md.
- (Old note) **The Wall:** Musts from the Yard rounds: place around the Yard's finished nodes (Shieldwall, Iron Skin, Sword
  and Board sit where Strongarm, Greatblade, Cleaver are now); no weapon picks within 8 of the Reaver or the Vanguard;
  rename Strongarm (a reference keystone name) and the Wall's Second Wind (the Bow has one). Then the Cathedral, then the Cathedral, the centre, the joins, the
  final report. Lessons the reviewers enforce (R-report.md has the rounds): one mana notable near home; ~11 own
  notables within 8; no copies across borders (check the neighbour's notables at the shared seam); no flat second
  notables; ~4-6 units per notable; utility ~20%; names checked with `ref-names.ts` and `ip.test.ts`; every new stat has
  player text and string-argument lines a `vocab.ts` entry; `reach.ts` for cut-off wheel halves.
- The report is written as it goes in `R-report.md`.

## How the Knife was built (the pattern for the rest)

`scripts/passives/rework/` holds the tools (one-off, absolute paths, run with `npx tsx`):

- `region-map.ts`: a region's clusters, nodes, lines and links in compact form, positions in the region's frame.
- `knife-gen.ts`: the generator that wrote the Knife. A hand-made table: the roads node by node (polar positions off the
  region's angle), each moved cluster's area, place, entrance and road node, the redesigned lines (`OVER`), trims
  (`TRIM`), new clusters (`NEWC`) and second notables (`SECOND`), cluster-to-cluster links (`PAIRS`). It reads the region's
  old area files, so it runs from a copy of them (`knife-before/*.ts.txt` is the Knife's, renamed so the typecheck skips
  them; restore as `.ts` into `src/data/passives/knife/` to rerun). Placement nudges a new cluster clear of existing
  nodes; everything else is the table's choice.
- `walks.ts` (notables and keystones by step from each start, per exit), `branching.ts` (nodes and notables per band of
  steps, loops, dead ends, each exit's share, against the reference), `rails.ts` (gates near starts, niche notables
  near starts), `offdef.ts` (offence, defence, utility against the reference sector), `ref-pic.ts` and `ref-starts.mjs`
  (the reference's layout and first steps, local data, study only), `skeleton-sketch.ts` (the skeleton's sketch).
- The repo's own: `npm run passives:register` (new ids), `npx tsx scripts/passives/geometry.ts --region <class>`
  (crossings, overlaps), `npx tsx scripts/passives/pic.ts out.png --region <class> --no-areas [--text]`,
  `npm run passives:list -- <class> out.md`, `scripts/passives/sketch.ts` (new: `--bare`, a node on every corner,
  `ends` on a road).

## Review page and charts

- The skeleton and Knife review page: https://claude.ai/artifact/VgVncWxytRPAEwCwq25icm
- The Knife's notable chart (now against proposed): https://claude.ai/artifact/TgVoXViYbS7eRCPk8AhhMJ

## Shell notes for this worktree

- The Bash tool runs in a guard that refuses commands with shell variables, `for` loops over computed values, heredocs
  and long `&&` chains touching git or files outside the worktree. Write scripts with the Write tool and run them with
  plain, literal commands; Node is at `/c/Program Files/nodejs`.
- The session transcript is very large; extract the owner's messages by streaming it line by line.
