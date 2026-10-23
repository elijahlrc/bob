# The passive network: design philosophy

**The complete list of concepts and constraints is `CONSTRAINTS.md` (2026-10-20); where the two differ, it wins.** This
file keeps the method notes and the state log (§7).

Read this before touching `src/data/passives/`. It is the distilled result of the user's reviews during the 2026-10-19
rebuild (three rejected drafts, one hand edit of theirs, then the pass that stuck). The brief in `C-brief.md` predates
most of it and loses where they disagree. `D-network.md` has the numbers and the per-region detail.

## 1. It is a network, not a tree

The old name misled every draft. A tree radiates: a start, spurs, dead ends. A network has loops: every area can be
reached two ways, and a build mixes areas by paying for the nodes between them. Measure it that way: cycles per
region (now 15 to 30), mean degree (about 2.5), ways in per notable cluster (two, except keystone spurs). A region whose
picture is a few long strands with rooms hanging off them is wrong even if every node is sensible.

## 2. The reference is the reference game's tree, looked at, not inferred

The reference graph is in `reference/tree/ref-tree.json` (local reference material, not in the repository) (lines, groups, links, no coordinates); the live layout is on the
official site (pick a class, press F). Trace the matching class start node by node before writing a region, and look
at the layout in the browser. Looking is allowed; copying names, shapes or lines is not; screenshots stay out of the
repo. What the dexterity class's start taught: the start touches two nodes, each one step from a hub of degree five to seven;
the first notables are about attacks in general, not the weapon; pockets of three dead-end off hubs; the skeleton is a
mesh; pockets are tight orbits a third of the spacing between clusters; roads are straight runs that turn at junctions.

## 2a. The tree exists to force trade-offs (the user, 2026-10-20)

If a physical bow build finds a "bows" section and a "physical attacks" section holding most of what it wants, going
there is not a decision; it is just what the build requires, and the points might as well be handed out. The tree earns
its place only when a build gives something up to get something. So:

- **No section of the map belongs to one build type.** Area names are places ("The Lantern", "The Cloister"), never a
  weapon, element, mechanic or stat ("Bows", "Fire", "Minions", "Block and shields").
- **Each specialization appears in two or three clusters, apart, each with a different partner.** In the reference the
  nearest other cluster of the same weapon is 7 to 14 steps away (bow 9 to 10, wand 12, dagger 10, curse 6 to 15), in
  sectors three times the size of ours; aim for at least five steps here. Fire with crit in one place and fire with the
  burn in another; cold with a shield in one place and cold with freeze in another. Picking the cluster is picking the
  partner, and taking both costs a crossing. Spreading two copies of the same pairing is not a choice.
- **Concentration is chosen per specialization.** Some belong to one class's region (the reference's wands), others are
  shared between two or three regions; there is no universal rule (the user, 2026-10-20). What is flat across all regions is the generic layer (life, crit,
  phys, spell, energy shield, leech), as lines on many notables, never as one destination.
- **Neighbours compete.** Two clusters a single build wants both of should usually not sit a step apart; passing through
  a notable of a different kind to reach the one you want is a fair price, as it is in the reference.

Check it with the scratch spread script (per specialization: its clusters and the steps to the nearest other one) and
with walks: for a build, name what it chose and what it gave up. The Spire was re-lined this way first (2026-10-20):
each element twice, in different arms, with different partners; energy shield, wands, auras, flasks and spell crit split
between the two sides.

## 3. The rules each region follows

1. **The start touches two stat nodes**, the two sides of the signature loop (offence one side, defence the other).
   Point one is a side; point two is the signature, a hub or a road. Nothing within three steps names a weapon.
   The hubs sit one step out, carry the class attribute, join the ring one node to either side, and have one pocket each.
2. **Attribute nodes are the roads most clusters hang from**, one value per class (+20; +15/+15 for a hybrid), as junctions and
   roads. Most clusters branch off an attribute road; a road may be long if clusters keep coming off it, and a long
   stretch with nothing coming off it is filler (the user, 2026-10-20, replacing "no corridor longer than one node").
3. **A small is one stat at the reference's size** (5% life, 10% evasion, 5% attack speed, 15% crit). Within a section
   (a road, a wheel's side, a pocket's smalls, a keystone spur) every small carries the same modifier. Mixes live on
   notables. The exceptions: the two sides of a start loop differ, and a cluster whose point is variety (a resist star
   with one element per spoke) mixes on purpose.
4. **Most pockets are bridges.** A chain of two or three nodes between two places gives a notable cluster two ways in
   and the region its loops. Some dead ends are fine (a pocket's tip, a keystone spur), just not many: a region where
   most clusters hang off one node is a tree again. Keystones stay dead ends, one or two smalls off a junction, 8 to
   18 steps out.
5. **Varied defences in every region.** Life, resistances, the class's own defence, and some of the others (block,
   dodge, stun threshold, recovery, maximum resistances) should all be buyable without leaving the region, because
   every build needs them by map 20. Resistances are part of that; a resist star (a notable with one spoke per
   element, each landing somewhere different) is one good way to place them, not a requirement.
6. **A region supports many builds, not one theme.** A region has a vibe and the attributes it leans on, nothing more
   exclusive than that. Mana is not off-theme for a dexterity class: every start has mana, every build casts something
   or reserves something. So each region sells, in its own voice, the things most builds want: mana and reservation,
   leech in life and mana, crit, attack and cast speed, movement, flasks, cost, duration, and the weapon lines of the
   weapons its skills can hold. A region with only its signature stats reads as one note and plays linear. The
   vocabulary in `lines.ts` has 181 lines, all stats the engine already reads; use it.
7. **Wheels are open or closed, and their sides are a real choice** (CONSTRAINTS §8 item 3): two variants of one theme a
   build rarely takes both of, or two unrelated things when the route through the wheel takes one side. Two
   near-identical smalls either side of a notable is a fake choice.
8. **Crossings between regions are many and placed for a build**: the ring between homes, near bridges of one node,
   dear bridges of several attribute nodes, and the user's own extras. A region's edge facing a neighbour is designed
   around the links that land on it.
9. **Geometry serves reading.** Pockets as tight orbits facing their junction; roads as straight runs with corners;
   no crossing edges (the crossing check must print zero); no two nodes drawn over each other; area labels off
   the nodes. How to draw it is CONSTRAINTS.md §11 item 5.
10. **Placing a node is a decision that weighs all of the above at once**: what build wants it here, what it bridges,
    whether its section stays uniform, whether the region's defences and families stay varied, whether the geometry
    still reads. The area files carry reasons for the decisions worth explaining (an area, a cluster, a link that is not
    obvious); they are not a log of every node, and nobody needs one. The process matters, not the paperwork.

## 3a. How the network is drawn (the user, 2026-10-21)

Clusters are drawn tight, chains run straight, shapes are regular and shrink as a whole, and empty space is welcome:
the rules are CONSTRAINTS.md §11 item 5, and the process (a script for the first pass, then an agent's eyes on every
cluster of every region) is §15 item 10. The record of that pass, with every agent's pictures, is in
`docs/tree/design/tighten/`.

## 4. How to judge it

No metric says the tree is good. Think like a player: for each region write walks and look for a stretch with no
choice, a forced node, or a notable nobody would take. At least three short walks of 20 points (the class's main
build, an off-build, a neighbour coming in) and at least one late build of 120 points, which is where crossings,
second keystones and the far wheels either pay off or show up as filler. Fix the tree, not the prose. The numbers
(cycles, degree, attribute share, stat families, steps to keystones) catch regressions; they do not grade a region.

## 5. The method of work

- One region at a time, home first, then the skeleton of junctions and roads rendered alone, then pockets, then
  crossings. Render after every change (`npm run passives:pic -- out.png --region <class> --text`); the picture is the
  review, the listing (`passives:list`) is the detail, the audit (`passives:audit`) is the regression check.
- The user edits in the tree editor (`npm run passives:edit`, `tree-editor.html?tree=next`); Save writes
  `src/data/passives/edits.json`. Fold a patch into the files with `scripts/passives/fold.ts <region>` before anyone
  registers new nodes: editor numbers for added nodes collide with the next registered ids. Keep the user's placeholder
  names and odd line choices as theirs; list them, do not fix them.
- Ids are stable strings (`area.cluster.node`) with numbers in `ids.json`, append-only; `passives:register` after adding
  nodes. Never renumber.
- Shell gotcha: the Bash tool strips backslashes inside heredocs, so an escaped apostrophe in a TypeScript string
  becomes a syntax error. Write patch scripts with the Write tool and run them; use the Edit tool for strings with
  apostrophes.

## 6. What went wrong before, so it is not repeated

- Reading "never copy the layout" as "never look at it". Three drafts were written without seeing the reference.
- Making one cluster shape the only shape. Small four-node clusters of the same shape are fine, and the reference is
  full of them, as long as they are placed with care and are not the only kind of cluster in the region.
- Chains of two attribute nodes into a signature that fixed the build before the first gem.
- Treating the audit's unit counts as proof of quality.
- Rules invented to be restrictive (one entrance per cluster, keystones at 10 to 14 steps, roads at a tenth, no two
  nodes within 100 units) and followed as checklists instead of from the player's seat.
- Trusting a layout algorithm with shapes it does not understand: tightening node by node broke every wheel and loop
  it touched (2026-10-21). A script places the simple cases; a person or an agent looks at every cluster.

## 7. State and open work (2026-10-19)

Written: Strider (the user's edit, folded), Yard, Wall, Spire, the centre ring. The vocabulary pass of the same
evening (D-network.md, "The vocabulary pass") put the wider vocabulary on smalls and pockets, turned the Spire's
arms into a lattice, moved every label clear of the nodes, and named the Strider's placeholders; 45 of 180 lines
are still unused, most of them the Knife's and the Cathedral's. Unwritten: the Knife (Shade), the Cathedral
(Zealot), the centre's generic clusters; the stubs toward them are named in each region. Known from the 120-point
walks: a region is exhausted at 80 to 100 points, so the late game lives in the crossings, and the Mystic's and
Strider's late points have nowhere to go until their neighbours exist. Not yet done: rewriting `C-brief.md` to these
rules; the attribute value per node if the audit's supply is off; more crossings once the Knife and the Cathedral are
written. The game still loads the old tree until Phase F swaps the new one in.

**Later the same night (2026-10-19, unreviewed, the session ran out):** a second diversity round on the four regions
(Spire: Spirit Ward, Wand Volley, Familiars, low-life smalls on the Pain Conduit spur; Wall: Ground Shaker, Unbloodied;
Yard: Killing Pace, Spellsword, Shield Bash; Strider, new clusters only: Hedge Magic, Ricochet, Sentry Post) and then
the Knife (`src/data/passives/knife/`, five areas, five keystones), the Cathedral (`cathedral/`, six areas, six
keystones) and the centre's four inner arches (`centre/clusters.ts`). All 27 keystones placed; 732 nodes; audit
problems 0; edge crossings 0; names test passes; ids registered; 8 of 180 lines unused. Not done: the area labels
of the new and changed areas still sit on nodes (run the scratch label search and apply); the review agents the user
asked for (network and geometry, node discipline, build coverage, crossings against brief §4) have not run; no walks
for the Shade or the Zealot; `D-knife.md`, `D-cathedral.md` and the D-network table are unwritten; the region renders
in `docs/tree/design/` are stale except `D-all.png`. Nothing committed.

**2026-10-20, the trade-off pass (§2a):** the user rejected the map's build-named sections ("There should not be a
'bows' section of the map"). Every region was re-lined in place, positions and links unchanged, so crossings stay at
zero:

- **Area names are places now:** The Cloister, The Lantern, The Barbican, The Quarry, The Practice Ground, The Alleys,
  The Nave, The Hedgerows and so on.
- **The Spire's arms are not elements:** each element appears twice, in different arms, with different partners.
- **Each two-notable wheel now has two kinds:** the Wall's two-hander wheel is damage or life, and the Cathedral's
  wheels are block or fire spell, fire attack or aura, aura or minion, minion or spell block. The Knife's wheels are
  poisoned dagger or shield, and traps or chaos claw.
- **Weapons are spread:** two-handers sit in three places, maces in two, daggers and claws in two each. Bows sit in two
  Strider clusters plus one in the Yard and one in the Knife.

Renamed clusters got new ids (the old numbers are retired, 123 in all). Checks: audit 0 problems, 0 edge crossings,
names test passing, 2 labels touching one edge each. Still open:

- The Knife is thin, with 14 notables against 25 to 30 elsewhere, and needs new clusters, not re-lining.
- The Strider's own clusters outside Rapid Fire were left as the user drew them.
- `D-*.md` per-region docs still describe the old sections.
- No review agents or 120-point walks for the Shade and the Zealot yet.

**2026-10-20, the constraints audit and the pass after it:** three agents audited the network against CONSTRAINTS.md
(reports in `audit/`), and the pass that followed is written up in `E-audit-pass.md`. In short: wheels whose shared
ends belonged to one side were fixed, copies of one pairing were given different partners, every home's two hub roads
became attribute highways, the Spire's long spokes became roads, the Mystic got near crossings to both neighbours,
four keystone spurs stopped being through-routes, and five clusters were added (Warm Blood, Static Edge, Quiet Knife and
two crossings). Open items moved to CONSTRAINTS §16.

**2026-10-20, second round (`E-round2.md`):** the user asked for more roads between and within regions, about 1,500
nodes in the end (high-value nodes were too dense), no long paths with few ways in, and iterative growth. The Cathedral
got the Ambulatory, the Wall spread outward with the Barrows road, every border gained crossings, wheels were widened so
notables sit four steps apart, and three agents walked 40 builds (`audit/round2/`). 764 to 922 nodes; road attributes
are +7 and +6/+6.

**2026-10-20, third round (`E-round3.md`):** the user asked to fix the one-stop shops the second round's walks found
and to give casters and summoners a late game. Bracing and Thick Skin traded places; Kindled Steel and Rimed Steel
traded places; Festering went to the Yard (poison with bleeding) and the Stair wheel became chaos spells (Rotting Word,
the new `chaosSpell` line); Thirsting Blade went west as leech with attack speed. New: the Rooftops (an outer road
round the Knife's north-east, with Carrion Claws and Sleet; Black Flock took Carrion Claws' old side of the Docks
wheel), Hexwright and Devotion traded places, Tomb Dust, Thunder Peal, Censer, Grave Host and Deft Wand.
922 to 955 nodes. Then two agents audited specializations and one-stop shops (`audit/round3/`).

**2026-10-20, fourth round (`E-round4.md`):** the user approved most of the round-3 audit and asked for a centre for
the dagger-wielding caster; they also said scripts for placing and checking nodes are fine, compact clusters with
identical smalls clumped read well, and new highways or a bigger map are welcome. New: the Fosse (an outer road round
the Yard's south rim to the Barrows, with Stormstruck and Marked Prey), the Athame wheel in the Knife's centre (Athame
and Long Knives), Whetted Will, Shattering Rite, Grim Oath, Snare Line, Stone Ward and Two Fists; four new lines
(`physSpell`, `damageVsCursed`, `daggerSpellDamage`, `daggerSpellCrit`). The open one-stop shops were fixed
with cuts, re-lines and moves. Then, on the user's answers: channelling (`channelDamage`; Steady Stream, Ceaseless
Blades), a third dagger-caster cluster on a new ridge road (Ritual Blade), and in the Strider the projectile rim spread
(Split Volley and Barbed Arrows traded places), three same pairings re-partnered and Pitch Arrows. Grave Host stays far.
955 to 1009 nodes. Last, the label pass: area names are placed so none overlaps another, drawn in tree
units behind the nodes, and fade as the view closes in (the user's idea), in the game's tree screen and the editor.

**2026-10-20, phase F (the hookup):** the game loads the hand-written tree (`src/data/passives/baked.ts` via
`npm run passives:bake`); save version 20 hands passives back; the editor edits this tree by default (`?tree=old` for
the old one). Still owed: the supply audit beside the brief and the brief-against-built note.

**2026-10-21, the layout pass (§3a, CONSTRAINTS §11.5 and §15.10):** the user asked for tight clusters and no arbitrary angles. `tighten.ts` moved
364 smalls onto straight chains beside their notables; seven agents (six regions and the centre) then audited every
cluster by hand: wheels and loops restored to regular shapes and shrunk as a whole (most to about half their radius),
chains between two notables split by stat, roads straightened, the first pass's mistakes undone (a road's smalls taken
for a pocket, the Oathbound diamond, kinks out of the starts). Positions only: no node, link or line changed. Whole tree:
0 crossings, 0 overlaps; 73 bends over 20°, nearly all ring corners. Open questions put to the user: wider rings for the
Longbow and Deep Cuts wheels so their names clear, the 30° turn of Deep Well and Arcane Focus, where Still Mind and Sharp
Mind sit on their loops, and the Quickened Steel start loop (a diamond before). A few long links came out of it (three in
the Strider, round Devotion), and some `why` texts name links that no longer match (they were wrong before the pass).

**2026-10-22/23, the growth (phase G, `G-growth.md`):** the user asked for 1,500 to 2,000 nodes so builds cannot take
everything they want. Measured by an allocator over archetypes (`npm run passives:builds`: best plans at 60 and 120
points, grown by 40; what more points still buy), never by one power number. A ledger and region briefs (G1), a skeleton
of roads (G2), three rounds of clusters by region agents (G3), two audit rounds of six auditors and two fix passes (G4),
five seam clusters where regions meet. 1,009 to 1,396 live nodes; the user's stop 4 left four questions for playtesting
(`G4/stop4.md`). Lessons: the yardstick needs a build for every cluster before "nobody takes it" means anything (four
archetypes were added in the last round and settled half the findings); audits report findings, never new rules (the user
adopted none of fifteen); a re-partner can overshoot into a notable nobody takes, so measure the new partner before
keeping it.

Judging tools: `scripts/passives/geometry.ts` (crossings, nodes drawn over each other, bends; `--region`, `--bends`). In
the session scratchpad (recreate if gone, they are twenty lines each): a label-over-nodes check; a line-usage count per
region; a walk script that buys the cheapest tree from a start to a list of notables and prints every node bought.
