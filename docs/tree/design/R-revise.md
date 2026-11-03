# Revising the reworked tree from the owner's first feedback (2026-10-31)

The owner reviewed the unbaked rework on the phone viewer and gave four points (`R-feedback.md`). This plan revises the
whole tree for them. It holds only what was decided; what is open is listed as open.

## 1. What the owner decided

1. **Second notables get a real place.** The 40 notables hung one step past a cluster's notable stay, each in a new
   cluster or in an existing cluster grown to make room for it. Folding, moving or cutting them was rejected.
   Measured: the Spire 10, the Knife 8, the Yard 8, the Cathedral 7, the Bow 6, the Wall 1.
2. **The V in front of every start goes.** A node nearly everyone wants must lead somewhere. Measured: First Light,
   Keen Instinct, Hawk's Eye, Honed Steel, Oathbound and Zeal sit five steps out at the bottom of a V between the start's
   two exits, with no way onward.
3. **Regions differ in their small-scale structure**, at least somewhat. Measured: every region repeats the same start
   and V, two-node seam paths through a home cluster, side rooms off a road by one entrance, and the seconds.
4. **Clusters connect to clusters.** More clusters grow off related clusters, and more links join existing clusters,
   so routes through clusters stand beside the roads: slower, with more nodes, but richer. Measured: loops within 15
   steps of a start 29-44 (the reference 90-111); mean links per node 2.19 (2.31); 4 to 6 links across each border.

The numbers are evidence the revision should move, not targets. The four decisions are recorded in CONSTRAINTS §16
(items 14 to 17; the owner's other answers are items 18 to 20).

Each is tested by the owner's reason, not by its outward form:

- **Item 1:** a second placed in a grown cluster but again one step past the first, with nothing beyond, is the same
  pattern. Measured: notables whose only way in runs through another notable (40 now).
- **Item 2:** "leads somewhere" means the node is a way onward, not the end of a path. Measured: dead-end notables
  within 8 steps of each start.
- **Item 4:** a route through clusters is slower than the road between the same two points. A cluster link that comes
  out shorter than the road is a shortcut: it breaks the trade and the start distances. Measured: a sample of cluster
  routes against their roads.

Two forms the rework set itself are dropped as targets, so the first pass does not rebuild them out of habit:

- the generalist notable at step 5 for every class;
- the two-node seam path through a home cluster (from the joins pass, not the skeleton).

What stands is the skeleton's "about 12 between neighbouring starts". The 12 was reached by cutting smalls off the
seam paths, so seam paths that vary will move it: it is held and measured.

## 2. What this changes in the skeleton

It amends two places in `R-skeleton.md` §1, by the owner's feedback of 2026-10-31:

- **"Side rooms"** (most clusters past the home are a stub off a road junction, entered and left the same way) gives
  way to item 4.
- **"No notable within 4 steps"** keeps its rule, but its last part, the home's notables "off a cross-link that joins
  the two spokes", gives way to item 2.
- The same "Side rooms" paragraph ends "the roads keep the loops: two spokes per region, a cross-link between them".
  The V is that cross-link. Where a region keeps a cross-link between its spokes, it is a route onward, not a dead-end
  notable; where the region's new form does without one, it goes.

The rest of §1 stands:

- starts at radius 1,450 (their shape may differ: §8);
- no notable within 4 steps;
- neighbouring starts about 12 apart;
- the mid and rim rings, the seams and the border radials;
- thin roads;
- the centre as built.

## 3. Scope

All six regions and the centre. The Knife is included although the owner approved it earlier: the feedback names its
pattern (Keen Instinct's V, 8 seconds).

Out of scope:

- line numbers (the flask-stats pass);
- names (the naming pass);
- the bake, the save bump and the tests;
- the report's question 2, border roads near the starts.

## 4. Method

- **Hand edits to the area files** (`src/data/passives/<region>/*.ts`), every new node and link with a `why`
  (D-method). New ids are registered with `npm run passives:register`.
- **The generators are retired.** The `<region>-gen.ts` tables and the `before/` snapshots are history: rerunning one
  would wipe the revision. `knife/home.ts`, already edited by hand after its generator, is the precedent.
- **Per region, a short note** in `R-revise.md` §7 says what was done for each of the four items. For item 3 it names the
  forms the region uses: no catalogue of forms is set in advance, and the review checks the regions do not repeat each
  other.
- **The plan does not place the 40 seconds or the six generalists.** The first pass decides each, cluster by cluster.
- **Commits** at the end of each building stage, local and unbaked (CLAUDE.md: milestone ends). Sustain on new smalls
  waits for the flask-stats pass (CONSTRAINTS §16 item 2) and is counted as a check only.
- **Clusters may move** in the first pass to make room for new links without crossings. The skeleton's roads stay where
  they are, except where the owner's budget thins a road a cluster route now serves.

## 5. Stages (the owner's order)

1. This plan, reviewed by a reviewer agent on the `R-reviewer.md` brief (one agent, continued across stages).
2. **First pass:** the whole tree.
3. **Review** of the first pass.
4. **Finalization:** the review's findings.
5. **Final review.**

Each review gets:

- renders of each region without area names;
- `walks.ts`, `branching.ts`, `geometry.ts` and `reach.ts`;
- the phone viewer, republished at its link (https://claude.ai/artifact/EDhDTGfLH74ML53gpi1nEo).

## 6. Checks at the end of each building stage

- 0 crossings, 0 nodes drawn over, 0 unreachable nodes.
- `ref-names.ts` finds no reference names; `ip.test.ts` green; the typecheck clean outside the stale tests.
- Re-measured:
  - the four numbers of §1;
  - steps from each start to its first own notable;
  - steps between neighbouring starts;
  - steps to the first thing worth having on each road out of a start (so "the start takes too long" can be judged
    from numbers);
  - the node and notable counts, and the sustain line count (`sustain.ts`, a check only).

  Item 2 changes the ground near every start, so none of these is assumed to hold.

## 7. Region notes

(Written in the first pass.)

### The Knife (first pass, 2026-10-31)

**The forms** (item 3). The Knife is the opportunist's ground, so its shapes are about slipping through and picking
your moment. The regions after it should not use these three:

- **The blade.** One cluster route straight out along the class radial, between the two spokes: the start's two roads
  meet at the generalist (the hilt) and the route runs on from it through the home's notables to the mid ring at the
  axis. It is the region's middle way out, two steps slower than either spoke and richer. Used once, at the start
  (Keen Instinct → Quick Wrists → a damage-on-kill small → Second Curse's small → the mid ring), with the dagger
  spells (Quiet Knife) joining it from the north spoke.
- **Two doors.** A small where the way parts into two notables of different kinds, and both lead on into the same
  room beyond (a seam cluster), so a build picks one door and keeps walking, and neither notable is the end of a path.
  Used at both seam rooms near the start: north, Smuggler's Flasks (by a mana small) or Deep Reserves, both into
  Hoarded Breath and the Spire seam; south, Deft Guard (by the evasion run) or Ward of Smoke, both into Grey Cloak and
  the Bow seam.
- **Alleys.** A run of smalls of one stat threading from one cluster's tail into a neighbouring cluster's, not off a
  road, with notables opening off it or standing on it between two clusters. Used for: the Gutter (three poison
  smalls from Ill Wish's curse run past Smeared Edge to Rust and Ruin and on into Carrion Claws); the crit alley (Steady
  Eye on by two crit smalls to the mid ring by Cold Read); Low Tide's mana run (Spoils → Low Tide → the north border
  road, Thick Blood joining at Low Tide); Fan of Blades on by a projectile small into Cutpurse's Luck; Tumble on by a
  dual-wield small through Twin Shadows into Veiled Herald's run; and the two border alleys below.

Not used, and still free for the others: wheels and resist stars were already everyone's; the Knife added none.

**Item 1, the hung notables (8 to 0).** Each is now reached by smalls from a road as well as through its old neighbour:

| Notable       | Was behind                                      | Now                                                                                       |
| ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Quick Wrists  | Keen Instinct (a wheel entered only through it) | on the blade, reached from the mid ring end too                                           |
| Low Tide      | Spoils                                          | the crossroads of the mana alley: Spoils, the north border road, Thick Blood              |
| Deep Reserves | Hoarded Breath                                  | the north's mana door, off the small before Smuggler's Flasks                             |
| Ward of Smoke | Grey Cloak                                      | the south's resistance door, off the small before Deft Guard                              |
| Fan of Blades | Quiet Shot                                      | a sibling of Quiet Shot off the bow small (Quiet Shot moved aside), on to Cutpurse's Luck |
| Twin Shadows  | Tumble                                          | on the Tumble alley, a dual-wield small after Tumble, on into Veiled Herald's run         |
| Smeared Edge  | the Trapper wheel's notables                    | on the Gutter; and the wheel has a second entrance from Frost Snare's trap small          |
| Rust and Ruin | Carrion Claws                                   | the Gutter's end, leading on into Carrion Claws                                           |

No notable changed cluster, so no id changed; every existing notable keeps its lines. Low Tide, Deep Reserves, Ward of
Smoke, Quiet Shot, Twin Shadows and Second Curse moved a little to make room.

**Item 2, the start.** The start keeps its two exits and its six directions by the third point (the strong first
smalls unchanged), and the two roads in from the hubs still meet at Keen Instinct, but Keen Instinct is now the hilt
of the blade: the three points to reach it are the first three of a way on out along the axis. The dead-end notables
within 8 steps went from 5 to 1: Low Tide, Smuggler's Flasks and Deft Guard are ways onward (the mana alley and the two
doors), Steady Eye starts the crit alley. Left: **Swift Incantation** (step 8, off Quiet Knife's first small): every
way on from it crosses the north spoke's road, and it is a caster's pick, not a generalist; its room's other notable,
Quiet Knife, now leads on to the blade.

**Item 4, clusters to clusters.** New cluster routes, each slower than the road between its ends (the check finds no
new shortcut, and three old ones in the Knife went: 62 to 59 tree-wide):

- inside the region: the blade; the two doors; the mana alley; the crit alley; Quiet Knife onto the blade; the Gutter
  (the Rookery wheel to the rim by Ill Wish, Smeared Edge, Rust and Ruin, Carrion Claws); Frost Snare into the Trapper
  wheel (the wheel is now a way through from the axis to the south spoke past the mid ring); Fan of Blades into
  Cutpurse's Luck; Tumble through Twin Shadows into Veiled Herald.
- across the borders, outside the mid ring where the border radials end and no road runs (inside it any such link
  would cross the radial): Wiry Frame's evasion run on by two smalls into the Spire's **Sharp Tongue** (dagger spells),
  and Veiled Herald's evasion run on by three smalls into the Bow's **Hare's Pace** (evasion and attack speed). Both
  links are written in the Knife's files; the neighbours' files are untouched. Two of Veiled Herald's three smalls and
  one of Wiry Frame's two sit just across the angle of the border.

**Counts.** The Knife: 244 nodes, 65 notables, 4 keystones, mean links 2.22 before; 259 nodes, 65 notables, 4 keystones,
mean links 2.32 after (15 new smalls, no new notable). Tree: 1,383 to 1,398 nodes. Links across the Knife's borders:
mystic 6 to 7 (1 cluster to cluster), strider 4 to 5 (1). Starts still 12 from both neighbours.

**Left open.** No road was thinned: no road's work moved onto a cluster route in the Knife (the new routes run beside
roads, never instead of them). Swift Incantation stays a tip. The new smalls' values are the existing vocabulary's
small sizes and wait for the flask-stats pass like the rest. Not registered or baked.

### The Spire (first pass, 2026-10-31)

**The forms** (item 3). The Spire is a tower: the spokes are its stairs and the rings its landings, and mana is what
everything grows from. Its shapes run across the tower and up it, never along the class radial (the Knife's blade):

- **The crossing.** At the start the two roads in from the hubs no longer meet at First Light: they cross there and
  each runs on straight to the far side, so the generalist is a crossroads of four ways. The west road goes on by spell
  crit through Sharp Mind to Deft Wand's smalls on the east spoke; the east road goes on by mana through Still Mind to
  Wandwork's smalls on the west spoke (and Wandwork on into Fire and Frost). Each arm, hub to the far spoke's second
  landing, is a step slower than the roads round (the mid ring: 11 against 10) and richer. Used once, at the start.
- **Floors.** A cluster route straight across a cell of the tower, from a stair to a stair or to the border road,
  beside a ring and slower than it, its rooms joined end to end, each hung second standing on it. Used three times:
  the recharge floor across the west cell (the west spoke's first landing → Ward Renewed → Quickening → the Cathedral's
  border road); the crit floor across the east cell (the east spoke's first landing → Surging Tide → Siphon →
  Hexwright → the Knife's border road); and the mid floor across the middle band from stair to stair (Composure → Iron
  Litany → Slow Burn's small, a crossroads with Slow Burn and Hoarfrost → Hail of Sparks → Wand Volley). A floor is
  not an alley: an alley (the Knife's) runs one stat from a cluster's tail to another's, off no road; a floor runs road
  to road across a whole cell with its notables as the junctions, even where its smalls share a stat (the recharge
  floor's five).
- **Ladders.** An element's (or a kind's) rooms joined in climbing order, rung to rung, crossing a ring only at a ring
  node, so a build climbs its own element beside the spoke, slower and richer. Fire: Kindling → the mid ring, where
  Flashpoint hangs; past the rim, Kiln Heart → Warm Hearth → Cinder. Lightning: Thunderhead → the mid ring → Keen
  Verse → Live Current → Conductor → Needlework → the rim, where Thunder's Reach hangs. And the west border's climb,
  where no road runs past the mid ring: Familiars → Bound Host → a mana small → Moonward → High Veil's ring (its
  smalls, not its notable) → the rim → Bad Company → Hexed Pack → Overflow, mana feeding the minions at the foot and
  turning into shield at the top.

Between two rooms these forms put a notable, one small, or (the crossing's arms) two; there is no diamond of two doors.
Not used, and still free: nothing new of the wheel or star kind.

**Item 1, the hung notables (10 to 0).** Each has a way in through smalls only and leads on. None changed cluster, so
no id changed and every notable keeps its lines (each cluster grew to hold the new smalls):

| Notable        | Was behind   | Now                                                                                                               |
| -------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Ward Renewed   | Quickening   | the recharge floor, three recharge smalls from the west spoke (step 7), on to Quickening                          |
| Surging Tide   | Siphon       | the crit floor, spell crit from the east spoke (step 7), on by a shield-on-hit small into Siphon                  |
| Iron Litany    | Composure    | the mid floor, off Composure's last small, by a shield small to Slow Burn's crossroads                            |
| Hail of Sparks | Wand Volley  | the mid floor, a wand small from Slow Burn's crossroads, on through Wand Volley to the east spoke                 |
| Rime           | Hoarfrost    | off Hoarfrost's far small, on into Broad Weave (cold to area, slower than the mid ring)                           |
| Conductor      | Live Current | lightning's ladder, off the ring's small, on into Needlework                                                      |
| Warm Hearth    | Cinder       | fire's ladder, off Cinder's far small, by a burning small into Kiln Heart                                         |
| Bound Host     | Familiars    | the border climb, minion smalls from the mid ring (Familiars' smalls made a triangle so the climb can pass it by) |
| Moonward       | High Veil    | the climb's crossroads: off High Veil's small, down by mana to Bound Host, across the border                      |
| Hexed Pack     | Bad Company  | the climb past the rim, off the ring's small, by a mana small into Overflow                                       |

Moved a little to make room: Moonward, Hexed Pack, Warm Hearth, Conductor, Rime, Iron Litany, Slow Burn, Quickening's
far small, Wandwork (its chain gained a small, where Still Mind's arm comes in), Deft Wand. Still Mind and Sharp Mind
moved onto the crossing's arms (same clusters).

**Item 2, the start.** Two exits as before, the strong first smalls unchanged (energy shield and life west, damage and
life east), six directions by the third point, the first own notable at 5, nothing notable within 4. The V is gone:
First Light is the crossing. The dead-end notables within 8 steps went from 4 to 0: First Light is a crossroads; Still
Mind and Sharp Mind (step 8) stand on its arms, each with a way in of its own from its far spoke; Wandwork leads on into
Fire and Frost. Their old places off the spokes' first landings now hold the floors' ends (Ward Renewed and Surging Tide
at step 7), so each spoke still offers a notable a step or two past its first landing.

**Item 4, clusters to clusters.** Inside the region: the crossing's two arms, the three floors, the three ladders, Rime
between Hoarfrost and Broad Weave, Wandwork into Fire and Frost. Across the border, outside the mid ring where no road
runs: from Moonward by a spell-block small into the Cathedral's **Twofold Guard** (block and spell block with a shield:
the warded caster who carries one), written in the Spire's file (`spire/fire.ts`); the small sits just across the angle
of the border. The Knife's link from Wiry Frame into Sharp Tongue is untouched (Sharp Tongue's ids unchanged). No new
shortcut: the check's list is unchanged (59 tree-wide, the Spire's lines the same as before). The crossing's arms are
a step dearer than the roads round (each hub to the far spoke's second landing 11 against 10).

**Counts.** The Spire: 247 nodes, 64 notables, 5 keystones, mean links 2.22 before; 265 nodes, 64 notables, 5
keystones, mean links 2.32 after (18 new smalls, no new notable). Tree: 1,398 to 1,416 nodes. Links across the Spire's
borders: zealot 5 to 6 (1 cluster to cluster), shade 7 (1, the Knife's). Starts still 12 from both neighbours. Hung
tree-wide 34 to 24 (the Spire's 10).

**Left open.** No road was thinned: the floors and ladders run beside roads, never instead of one. Slow Burn's small
is now a junction of five links (the mid ring, Slow Burn, Hoarfrost, the floor west to Iron Litany and east to Hail of
Sparks): a small doing a crossroads' work, kept because the floor needs a notable-free way past Slow Burn. Wandwork and
Fire and Frost sit close, notable to notable. Prism Ward's chaos small still hangs toward First Light between the two
arms. The link into the Cathedral's Twofold Guard (`cathedral.walk.guard.b`) is the Cathedral builder's to fix if
Twofold Guard changes cluster. The new smalls' values wait for the flask-stats pass. Not
registered or baked.

### The Bow (first pass, 2026-10-31)

**The forms** (item 3). The Bow is the ground of moving against standing still, so its shapes are about that choice,
and its start is about going any way:

- **The three-way start.** The Strider is the one class with three exits (the owner's leave of §8). North, attack
  damage with life, forks at step 2 into the north hub and the path to the Knife's seam, as before; south, evasion with
  life, the same toward the Yard; and a middle exit straight out, attack speed with life, to a third hub of dexterity
  (step 2) where it splits into two arms that never meet: life smalls to Hawk's Eye, resistance smalls to Hard Target
  (both step 5). Six directions at step 3, nothing notable within 4, the strong first smalls of the sides unchanged.
  Why differ: the V's two roads met in the region's own middle ground, the Meadow of evasion and speed, so the generalists
  there were a shared dead end for both side exits; giving that ground its own exit makes the start's three ways the
  region's three bands (bows and traps north, speed and the buffs on the axis, close and physical south). Not the
  Knife's blade (no route runs on along the radial: each arm turns aside into a spoke's first rooms) and not the Spire's
  crossing (the arms do not cross or meet).
- **The parting.** A small where the way parts into the archer who stands and the one who moves, and the two do not
  rejoin: the stander's notable is a **post**, the end of the line (the archer stops there), the mover's notable leads
  on to other ground. Unlike the Knife's two doors, which lead into the same room beyond. Used twice, both out from the
  north spoke's mid ring landings:
  - the north parting, out from the mid ring by the Knife's border: Steadfast Aim (crit while stationary) is the post;
    Wind Rider (attack speed while moving) runs on by evasion smalls to Hare's Pace on the rim, where the Knife's evasion
    run also arrives. Steadfast Aim moved here from the south rim, so the two notables written as each other's
    counterparts now stand at one fork.
  - the spoke parting, at Steady Draw's small off the spoke junction: Steady Draw (the slow heavy draw, a keystone and so
    a tip anyway) is the post; Skirmisher's Leap (Quickened on a blink) goes on by buff-duration smalls round Close
    Quarters' tip to Pursuit's End, where the speed it gives is spent.

Nothing else is named as a form: the rest of the links below are ordinary room-to-room joins. Some are akin in shape to
the earlier regions' forms, and are said so: Hardy Stock's and Hunter's Fervour's rooms are two-door rooms one cell wide
(road, notable, small, notable, road), the size of one of the Spire's floor rooms rather than a route across a cell of
several; Wind Rider's evasion smalls into Hare's Pace arrive beside the Knife's evasion alley, but they are the north
parting's mover branch, not a run of their own. The trap room's second small also forks two notables (Tripwire on to
Frost Fletching, Kiting Snares on to the mid ring); it is not a parting, since neither is a post: both lead on. No new
wheel; no blade, crossing or doors.

**Item 1, the hung notables (7 to 0).** No notable changed cluster, so no id changed and every notable keeps its lines.

| Notable          | Was behind                                  | Now                                                                                                                                                                                     |
| ---------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hard Target      | Hawk's Eye (a room entered only through it) | the end of the middle exit's south arm (step 5), on by two life smalls into Hunter's Rush                                                                                               |
| Kiting Snares    | Tripwire                                    | on a trap run from the trap room's second small to the mid ring (`ring.a`); Tripwire goes the other way, on to Frost Fletching                                                          |
| Hunter's Fervour | Hot Pursuit                                 | its own room of crit smalls from the rim node `q6` (Steadfast Aim's old place), on by a fervour-duration small into Hot Pursuit: fervour earned on crit in one room, spent in the other |
| Braced Guard     | Round Shield                                | between Round Shield's first small and Fleet Blade's room: sword and board, a way across from the shield room to the sword room                                                         |
| Second Wind      | Hardy Stock                                 | a life small past Hardy Stock, and its own door on the south border road: the room is a way across from the mid ring to the border road                                                 |
| Supply Line      | Field Kit                                   | a flask small past Field Kit and on by another to the rim node `q7`: a loop out past the rim between two ring nodes                                                                     |
| Grim Tally       | Killing Eye                                 | on a run of cost smalls down from Bright Shafts' room, joined to Killing Eye by its finishing small                                                                                     |

Moved to make room: the Longbow room (a little toward the spoke), Pursuit's End (out past Close Quarters' tip), Skirmisher's
Leap and Steady Draw (their small is the parting), Wind Rider (out past the mid ring), Hard Target, Hawk's Eye, the four
arm smalls, Field Kit's room, Killing Eye's room, Hardy Stock's room, Round Shield's room, Long Breath's far small.
Removed: `bow.home.hardTarget.a` (its old way in from Hawk's Eye) and `bow.string.elusive.s2` (Steadfast Aim's post takes
one small). Added: 20 smalls and the middle exit's small and hub.

**Item 2, the start.** The V is gone (above). Hawk's Eye leads on by an accuracy small into Sure Aim (step 7), whose room
runs on to the north spoke past its first landings; Hard Target leads on into Hunter's Rush (step 8). Dead-end notables
within 8 steps went from 3 to 1: Vital Aim leads on through Long Breath's spare small to the north spoke junction;
Wayfarer leads on by an evasion small into Thirsty Quiver, which Quick Hands' far small also joins, so the south half's
home rooms are joined through the leech room. Left: **Wanderer** (step 8), the seam's side room toward the centre: the
seam road it hangs from runs straight into the centre, so any way on would be a loop beside that same road. First own
notable 5 on all three exits; first notable from the side hubs is now 6 (they no longer lead to Hawk's Eye). The middle
exit holds few notables of its own (`branching.ts`: 34 / 35 / 2 within 14 behind the three exits): it is the generalists'
exit, and its arms lead into the side exits' ground.

**Item 4, clusters to clusters.** Inside the region: Hawk's Eye to Sure Aim; Hard Target to Hunter's Rush; Vital Aim to
Long Breath; Wayfarer and Quick Hands to Thirsty Quiver; the trap run (the trap room to the mid ring through Kiting
Snares); Wind Rider to Hare's Pace; Skirmisher's Leap to Pursuit's End; Hunter's Fervour to Hot Pursuit; Braced Guard
between Round Shield and Fleet Blade; Bright Shafts to Grim Tally and Killing Eye; Second Wind's and Supply Line's road
doors. Across the Yard border, outside the mid ring where no road runs: Killing Eye on by two crit smalls into the Yard's
**Crossed Blades** (`yard.dual.crossedBlades.a`), the archer's finishing crit into the duellist's crit, a Strider's way
toward dual wielding; written in `bow/south.ts`, the Yard's file untouched; one small sits just across the angle of the
border. The Knife's link from Veiled Herald into Hare's Pace (`bow.rim.haresPace.s`) is untouched; Hare's Pace's ids are
unchanged. No new shortcut: the check's list is unchanged (59 tree-wide; the Bow's eleven lines are the baseline ones
every start has).

**Counts.** The Bow: 215 nodes, 57 notables, 4 keystones, mean links 2.13 before; 235 nodes, 57 notables, 4 keystones,
mean links 2.22 after (no new notable). Tree: 1,416 to 1,436 nodes. Links across the Bow's borders: reaver 5 to 6 (0 to
1 cluster to cluster), shade 5 (1, the Knife's). Starts still 12 from both neighbours. Hung tree-wide 24 to 17.

**Left open.** No road was thinned: the new routes run beside roads. Wanderer stays a tip. Hunter's Rush is now a
junction of three ways (its own door, Hard Target, Rapid Fire); the way from the middle exit through Hard Target, Hunter's
Rush and Rapid Fire to the mid ring at the axis runs over the pre-existing Rush to Rapid Fire link, three steps slower
than either spoke (12 against 9) and bending through the south arm, not a route built along the radial. In the
region render the Steady Draw label crowds Far Flight's (moved once off Skirmisher's Leap's); like the older label
collisions in the Ford (Second Wind and Hardy Stock, Braced Guard and Lingering Momentum) it is for the label pass. The link into the Yard's Crossed Blades is
the Yard builder's to fix if Crossed Blades changes cluster. The new smalls' values wait for the flask-stats pass. Not
registered or baked.

### The Yard (first pass, 2026-10-31)

**The forms** (item 3). The Yard is the duel up close, and a duel is an exchange that comes round again: set up,
open, punish, set up. So its shape is the circuit, not the line:

- **The round.** A closed circuit of rooms whose order follows a fighting loop, each room with a way in of its own
  from a road, so a build can enter at either side and walk the loop as far as it wants. Not a wheel (one cluster's
  ring of smalls), not the Knife's alley or blade (lines), not the Spire's floors and ladders (lines from road to road
  or rung to rung), not the Bow's parting (a fork that never rejoins). Used twice:
  - **The court**, in front of the start between the spokes (the practice yard itself): Honed Steel → Fighting Breath
    (mana on hit) → Sidestep (dodge) → Four Winds (resistances, on the mid ring) → Answering Steel (damage after a
    block) → Clean Break (physical crit) → the west road's last small → Honed Steel. The striker's half on the east,
    the guard's half on the west, meeting at Four Winds. Its rooms are entered from the east spoke (Fighting Breath,
    Sidestep), the mid ring (Four Winds, Answering Steel) and the two roads in from the hubs.
  - **The opening round**, on the axis between the mid ring and the rim, in the band that was empty: Full Swing's
    wheel (two-handed or paired blades) → by the wheel's two-handed small to Momentum Swing (lowers the stun
    threshold) → Measured Cut (crit against the stunned) → Fencer's Eye's entrance small → Fencer's Eye (crit
    against the bleeding) → back up by crit and bleed smalls to the wheel's paired-blade small (Paired Steel bleeds).
    The two-handed half sets up the stun and punishes it; the paired half bleeds and punishes the bleeding; they meet
    at the rim entrance. Entered from the mid ring (the wheel), the rim (Fencer's Eye's small) and Shield Bash (stun,
    by a stun-duration small into Measured Cut).
- **Runs** between the mid ring and the rim (not named as a form; ordinary room-to-room joins, said so because they
  are akin to the Spire's floors): the fervour run (Hot Blood, where blocks earn fervour → Duellist's Fervour → dual
  smalls → Crossed Blades), the blood run (Red Harvest → Crimson Reaping → a mana-leech small → Banner Guard → the
  standard's entrance), and Open Veins → Bloodied Pursuit → Red Thirst. Each is slower than the spoke and the rim
  ring beside it.
- Two joins have an earlier region's shape, and are said so. The east path's second small parts to Killing Pace (on to
  the Bow seam) and Field Dressing (on to the centre's inner road one step past the seam): the Knife's two doors in
  shape. The Bow left its mirror room, Wanderer, a tip for this reason; the Yard makes the other call because Field
  Dressing is the flask room and flasks are the generic layer, so it is the Reaver's door onto the centre's generic
  ground rather than a loop beside its own seam road, and it is not shorter than the seam road. And the standard's
  entrance small parts to Standard Bearer (a tip) and up to Banner Guard (on up the blood run): the Bow's parting in
  shape, but a side room beside a run's entrance, not a choice between two ways of fighting (Standard Bearer cannot
  lead on east: the spoke lies between it and Red Thirst).

No new wheel, star, blade, door, crossing, floor, ladder or parting as a form of the region.

**Item 1, the hung notables (8 to 0).** No notable changed cluster, so no id changed and every notable keeps its
lines; each is reached by smalls from a road and leads on.

| Notable            | Was behind      | Now                                                                                                                        |
| ------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Momentum Swing     | Full Swing      | the opening round, off the wheel's two-handed small (not Full Swing), on by a stun small to Measured Cut                   |
| Measured Cut       | Fencer's Eye    | a crossroads of the opening round: Momentum Swing above, Fencer's Eye's entrance small, Shield Bash beside                 |
| Crimson Reaping    | Red Harvest     | off Red Harvest's far small, on by a mana-leech small to Banner Guard (the blood run)                                      |
| Banner Guard       | Standard Bearer | the blood run: up from the standard's entrance small (Standard Bearer is its sibling there), on to Crimson Reaping         |
| Duellist's Fervour | Hot Blood       | the fervour run, out of Hot Blood by a fervour small and on by two dual smalls into Crossed Blades                         |
| Bloodied Pursuit   | Open Veins      | off Open Veins' entrance small, on by a leech small into Red Thirst                                                        |
| Wide Arc           | Hewing          | outside the rim, Hewing → an axe small → Wide Arc → a two-handed small into Crushing Swing's room                          |
| Rally              | Drill Call      | off Drill Call's entrance small, on by an armour small to Hold the Line; it replaces the old Hold the Line–Drill Call link |

Crossed Blades gained a link between its two smalls (its entrance reaches the run's small without the notable); its
id and its entrance `yard.dual.crossedBlades.a`, where the Bow's Killing Eye link lands, are unchanged.

**Item 2, the start.** Two exits, each forking at its hub (step 2), as before: four nodes at step 2, six directions at
step 3, the strong first smalls unchanged, the first own notable at 5 on both exits. Why not three: the Yard is a
class between two neighbours with a plain east and west (the attacker's speed and blood toward the Bow, the guard's
steel and shields toward the Wall), and its middle is where those two halves meet, not a third kind of ground; the
Bow's middle exit had a ground of its own (the Meadow) to lead into. So the Yard's middle is a place both exits reach,
the court, rather than an exit. Honed Steel stays where the two roads in from the hubs meet (the cross-link between
the spokes that R-revise §2 allows when it leads on) and is now the court's gate, a crossroads of three; the west road
also parts at its last small, to Honed Steel or straight to Clean Break, which closes the court through the road.
Clean Break moved inside the west spoke for this, and lost its old way in from the west spoke junction (with it the
court was a way from spoke to spoke shorter than the roads). Dead-end notables within 8 went from 6 to 1: Honed
Steel, Fighting Breath and Sidestep are on the court; Stout Heart leads on by a regeneration small into Mended Mail
(a way from the seam path to the west spoke); Field Dressing leads on by a flask small to the centre's inner road
(`centre.ring.road.i2`, a step slower than the seam road beside it). Left: **Wanderer**, the Bow's (its note says
why).

**The Fosse rim** (the final report's crowding). The rim keeps its road and its 16 notables' lines, but it no longer
reads as a row of teeth: Measured Cut, Banner Guard and Rally moved inward off the rim into the middle band; Fencer's
Eye, Standard Bearer, Red Thirst and Shield Bash are now ends of routes from the mid ring, not rooms hung by one
entrance; outside the rim Hewing, Wide Arc and Crushing Swing are one room-to-room way, and Run Through joins
Bloodied Edge by a sword small. Left as rooms hung by one entrance: Elemental Edge and
Finishing Cut.

**Item 4, clusters to clusters.** Inside the region: the court; the opening round; the three runs; Measured Cut to
Shield Bash; Stout Heart to Mended Mail; Hewing–Wide Arc–Crushing Swing; Drill Call–Rally–Hold the Line; Run Through
to Bloodied Edge. Across the Wall border, outside the mid ring where no road runs: Scarred Hide on by a life small into
the Wall's **Sledge and Sinew** (`wall.slams.sledge.c`, a small), the shieldless brawler's way toward the mace, written
in `yard/shield.ts`; the small sits just across the angle of the border. Into the centre: Field Dressing to `i2`. No new
shortcut: the check's list is unchanged (59 tree-wide; the Yard's lines are the baseline ones every start has). A first
draft gave Clean Break its own spoke entrance and the check found two new shortcuts (hub to the far spoke through the
court, 8 against 10); the entrance was cut.

**Counts.** The Yard: 201 nodes, 52 notables, 3 keystones, mean links 2.19 before; 224 nodes, 52 notables, 3
keystones, mean links 2.32 after (24 new smalls, `yard.home.cleanBreak.a` removed, no new notable). Tree: 1,436 to
1,459 nodes. Links across the Yard's borders: vanguard 6 to 7 (0 to 1 cluster to cluster), strider 6 (1, the Bow's),
centre 1 to 2. Starts still 12 from both neighbours. Hung tree-wide 17 to 9.

**Left open.** No road was thinned: the runs and rounds go beside the spokes and the rim, never instead of one. The V's
outline is still drawn (the two roads in from the hubs still meet at Honed Steel); it is a route onward now, not an end,
and the reviewer may want it judged by eye. Four Winds' cold and lightning smalls now carry the court (each joins a
court room). The court puts six home notables between steps 5 and 8: dense, by design, but worth a walk. Standard
Bearer is a tip beside the run's entrance small. The link into Sledge and Sinew is the Wall builder's to fix if that
cluster moves. The new smalls' values wait for the flask-stats pass. Not registered or baked.

### The Wall (first pass, 2026-10-31)

**The forms** (item 3). The Wall is standing ground: the Vanguard holds a place, and grit is what holding earns and
what it pays out. Two forms, one at the start and one at the heart of the region:

- **The two towers** (the start). The skeleton called the Wall "a broad base, two towers", and the start now says it.
  Each hub's third way (it ran in to Oathbound, the V) runs straight out beside the axis to a generalist of its own
  side, and the two never meet: from the melee hub, life smalls to **Oathbound** (life and steel, step 5), which leads on
  by a regeneration small into Barrow Ward and through Sweeping Blow to the melee spoke; from the armour hub, resistance
  smalls to **Ox Hide** (armour and stun threshold, step 5), which leads on by its armour smalls into Mortar and Stone's
  armour and through Mortar and Stone to Locked Shields and the mid ring. The striker's tower and the defender's tower;
  the axis between them is open ground until the mid ring and the clusters at it. Why: the Vanguard's two sides
  (armour with life, melee damage with life) are each a whole way to begin, and the V walked every Vanguard to one shared
  node in the middle; now each side's generalist deepens that side, a Vanguard who wants both pays for the second, and
  each exit holds half of the near ground (the region was 25 against 11 before the rework; 29 / 27 notables within 14
  now). Two exits, not three: the axis is not a third kind of ground (the Bow's Meadow was), it is where the two halves
  meet further out, at the keep. Not the Knife's blade (nothing runs on along the radial from a meeting point), not the
  Spire's crossing (the ways do not cross), not the Bow's three exits, not the Yard's court (no circuit, and the V's
  outline is gone in shape: the two ways run side by side, not together).
- **The keep** (the grit loop). A wheel used as the hub of a band of rooms, with no road door of its own: it is entered
  only through the rooms round it. The Unbroken and Tempered wheel ("one more grit charge or resistances, the two sides
  of one wheel") moved from the border road's mid ring junction into the empty middle of the axis cell between the mid
  ring and the rim. On its west pair of smalls the rooms that **earn** grit come in from the rim (Hammer Rhythm's mace
  hits, by two grit-duration smalls; Iron Voice's warcries, by one); on its east pair the rooms that **spend** it go out
  (Shield Ram's block per charge, straight on from its far small; Heavy Hands' two-handed speed per charge, by one
  grit-duration small). Going from an earning room to a spending room crosses the wheel by one of its notables: Unbroken
  (hold more grit, longer) or Tempered (hold against the elements); going between two earning rooms or two spending rooms
  takes neither. So the grit loop is drawn as the player walks it: earn, hold, spend. Not the Yard's round (no circuit of
  rooms in a fighting order: the rooms join the keep, not each other), not the Knife's two doors (the choice is at the
  wheel, which notable a build crosses by, not at a fork small), and a wheel only in its middle.

The other new joins are ordinary room-to-room links, not forms. One has an earlier region's shape, said so: Old Wounds
opens on the centre's inner road (`centre.ring.road.i3`), the mirror of the Yard's Field Dressing (`i2`), for the
Yard's reason: regeneration is generic sustain and the centre is the generic ground; the way is no shorter than the
seam road beside it. The stun run and the Grit and Gravel run below are runs between a spoke or the mid ring and a ring
farther out, akin to the Spire's floors and ladders in that only, and not named as forms.

**Item 1, the hung notables (2 to 0).** No notable changed cluster, so no id changed and every notable keeps its lines.

| Notable         | Was behind                                     | Now                                                                                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grit and Gravel | Scar Tissue (a room entered only through it)   | its own door by a small on the border road's mid ring junction (`wall.resists.radW.m`, where the keep's wheel stood), on by its smalls to Scar Tissue and the rim (q8): a run from the mid ring to the rim along the Cathedral border, spend then earn, slower than the roads round. Step 16 to 11. |
| Aftershock      | Thunderstep (one step past it, nothing beyond) | the crossroads of the stun run: in from Stagger by a stun small or from Thunderstep's area small (b), out to the mid ring (`wall.slams.ring.a`). Its link to Thunderstep's notable went.                                                                                                            |

**Item 2, the start.** The V is gone in shape (the two towers, above). Two exits, the strong first smalls unchanged
(melee physical damage with life; armour with life), four nodes at step 2, six directions at step 3, nothing notable
within 4, the first own notable at 5 on both exits and from every step-2 node. Dead-end notables within 8 went from 6
to 0:

- Oathbound and Ox Hide head the towers and lead on (above).
- Barrow Ward is on the striker's tower, Oathbound to Sweeping Blow.
- Stagger heads the stun run into Aftershock.
- Old Wounds opens on the centre's inner road.
- Weak Spot leads on by a mana-on-hit small into Iron Lungs and the border road: the striker who finds the gap and
  lives off his hits, one step dearer than the road from the spoke to the border road.

Ox Hide left its old place off the melee spoke's junction; Steady Hands was drawn in toward the armour spoke to make
room for Ox Hide's way out. Starts still 12 from both neighbours (the seam paths are untouched).

**Item 4, clusters to clusters.** Inside the region:

- the two towers: Oathbound, Barrow Ward, Sweeping Blow; Ox Hide, Mortar and Stone, Locked Shields;
- the keep and its four rooms;
- the stun run: Stagger, Aftershock, the mid ring;
- the Grit and Gravel run: the mid ring, Grit and Gravel, Scar Tissue, the rim;
- Weak Spot into Iron Lungs;
- Warlord's Banner into Hallowed Hammer's far small, the holy warrior's kit at the Cathedral border (an aura carried,
  an elemental mace swung);
- Sledge and Sinew on by a strength small into Brute Force, so the brawler who comes in from the Yard's Scarred Hide
  walks on from the mace to the strength rule;
- Greatblade on by an area small into Long Reach, outside the rim.

Across the Cathedral border, outside the rim where no road runs: Grave Host on by a minion-life small into the smalls of
the Cathedral's minion keystone (`cathedral.rim.volatile.a`), so the summoner's far corner is a way through; written in
`wall/maces.ts`, the Cathedral's file untouched; the small sits just across the angle of the border. Into the centre:
Old Wounds to `i3`. The Yard's link from Scarred Hide into `wall.slams.sledge.c` is untouched (the id is unchanged). No
new shortcut: the check's list is unchanged (59 tree-wide; the Wall's lines are the baseline ones every start has). A
link between Plunder of Iron and Ground Shaker was tried and cut: it crossed the melee spoke's road.

The mace-and-shield one-stop (CONSTRAINTS §17) was checked: Hammer Rhythm and Shield Ram are nine steps apart through
the keep, Sledge and Sinew and Weight of Iron eight through Brute Force.

**Counts.** The Wall: 215 nodes, 49 notables, 4 keystones, mean links 2.22 before; 226 nodes, 49 notables, 4 keystones,
mean links 2.32 after (11 new smalls, no new notable, no node removed). Tree: 1,459 to 1,470 nodes. Links across the
Wall's borders: zealot 6 to 7 (0 to 1 cluster to cluster), reaver 7 (1, the Yard's), centre 1 to 2. Hung tree-wide 9 to
7 (the Wall's 2). From `branching.ts`: loops within 10 / 15 steps of the Vanguard start 8 / 37 to 14 / 49; dead ends
within 15 steps 61 to 49; mean links within 15 steps 2.34 to 2.38; notables within 14 steps 77 to 78. Unbroken moved
from step 11 to 13 and Tempered from 12 to 14 (the keep is farther out than the border junction was); Grit and Gravel
came in from 16 to 11.

Moved (ids unchanged): the two towers' smalls and Oathbound (straightened beside the axis); Ox Hide's room (from off
the melee spoke's junction to the armour tower); Steady Hands (drawn in toward the armour spoke); the Unbroken and
Tempered wheel (to the axis cell); Shield Ram's room (turned so its far small faces the keep); Heavy Hands' room (drawn
in toward the keep); Grit and Gravel's room (in toward the mid ring). Links removed: the armour hub's smalls into
Oathbound, Ox Hide's old door on the melee spoke, the wheel's old door on the border road, Thunderstep to Aftershock.

**Left open.**

- The keep's wheel is still written in `wall/resists.ts` (the Battlements, the north border) though it now stands in
  the axis cell, so the area files' grouping no longer matches the map there (ids were kept).
- Rooms still hung by one entrance:
  - inside the mid ring: Broken Guard, Bulwark Spirit, Vampiric Strikes, Standing Cairns;
  - between the mid ring and the rim: Standing Iron, Weight of Iron, Graven Posts, Greatweight, Unerring Discipline;
  - at the rim: Crushing Blow, Hot Iron, Bellows, Headsman, Skull Crack, Plunder of Iron, Ground Shaker, Long Watch,
    Twin Cairns, plus the keystone tips.

  Most rooms at the rim are still a row of teeth. I left them because a join there would only make a loop beside the
  rim road, with no build reason behind it.

- No road was thinned: the new routes run beside roads.
- The link into Volatile Servants' smalls is the Cathedral builder's to fix if that spur moves.
- Steady Hands and Ox Hide sit close; their labels clear each other at the region render's scale.
- The new smalls' values wait for the flask-stats pass.
- Not registered or baked.

### The Cathedral (first pass, 2026-10-31)

**The forms** (item 3). The Cathedral is consecrated ground: the Zealot is the hybrid of arms and word, and its
building is a cross with a nave. Two forms, one at the start and one in the nave:

- **The cross** (the start). The start is the crossing of three pairs of ways and nothing stands in front of it. Each
  side's first small forks out (the hub and its spoke) and across (the seam path); the seam path's first small forks
  again, on across to the seam (Vigil, Bright Omen) or **back toward the centre** (Litany, Lectern), and those two lead
  on to the centre's inner roads (`i4`, `i5`). Out, across, back: six ways at step 3, the strong first smalls
  unchanged, the first own notable at 5 on both exits (Vigil, Litany; Bright Omen, Lectern). The hubs no longer send
  roads in to the axis, so the ground between the spokes is open until the nave's rooms, reached from the spokes'
  junctions. Why: the Zealot's two halves (the faithful at arms toward the Wall, spells and servants toward the Spire)
  each hold a whole way to begin, and the start sits on the inner edge of the region with the centre's generic ground a
  step behind it; the Zealot's defensive generalist (Litany) and the lasting-spell room (Lectern) were already side
  rooms facing inward, so making them the start's backward ways gives the first points a third direction no earlier
  start has, without a meeting point. The shapes rejected, and why:
  - keeping the two roads in to Zeal with Zeal leading on (the Knife's hilt, the Spire's crossing, the Yard's gate:
    the V's outline stays drawn, the owner's worry);
  - a middle way from each hub out beside the axis, not meeting (the Wall's towers, whichever side of the spoke it
    runs);
  - a rung between the two spokes' first junctions or their first rooms (the V redrawn at a larger scale: the same
    closed loop through the start, bottoming at the generalist);
  - Zeal inward between Litany and Lectern (the V turned round, a loop through the start bottoming at Zeal);
  - a third exit (the Bow's).

  Not the Bow's three exits (two exits; the third direction is a fork of the across way), not the Wall's towers
  (nothing runs out from the hubs), not a cross-link of any kind near the start.

- **The aisles** (the nave). Between the spokes inside the mid ring, two block aisles run side by side out from the
  home to the mid ring, the staff's on the Wall side and the shield's on the Spire side, since a staff and a shield are
  never held together:
  - the staff aisle: Zeal → Buttress → Buttress's spell-block smalls run straight on past the notable → two staff
    spell-block smalls → Whirling Ward → Warding Staff → the mid ring (`nave.ring.a`);
  - the shield aisle: Shattering Rite (from the north-east spoke) and Frozen Font's door small → the font's three
    shield-block smalls run straight on past Frozen Font → Steadfast Faith → the Iron Faith wheel's shield small →
    the wheel's door on the mid ring (`nave.ring.b`).

  They are divided by **the arcade**, the Iron Faith wheel (shields or fire, its two sides): the shield aisle comes in
  at its shield side, the staff aisle's second small opens into its fire side (Hearthfire, the fire spell a staff
  caster takes), so which side of the wheel a build crosses by is the aisle it came from. Not the Spire's floors (road
  to road across a cell) or ladders (one chain climbing beside a spoke): two parallel chains along the radial joined
  only through a wheel whose sides they own. Not the Knife's blade (no meeting point, two ways not one), not the
  Wall's keep (the wheel keeps its own road door).

The other new joins are ordinary room-to-room links, not forms. Some have an earlier region's shape, said so:
Litany onto the centre's inner road is the Yard's Field Dressing and the Wall's Old Wounds again, for their reason
(a resistance star and hybrid defence are generic ground; seven steps from the start, the same as by the seam road).
Lectern onto `i5` is not that case: it is a specialist room (lasting spells), and its door is the Bow's rejected case
(Wanderer left a tip because any way on is a loop beside the seam road at the same length). It is made for the start's
sake: the cross needs a backward way on both sides, and Lectern is the only inward room on the north-east side. The
reviewer may judge whether that is reason enough (left open below). Ember Litany's and Staff of
Judgement's rooms are ways between two ring nodes beside the ring, like the Bow's Second Wind and Supply Line; the
shrine's door small running straight through past Reliquary is the Yard's Crossed Blades bypass.

**Item 1, the hung notables (7 to 0).** No notable changed cluster, so no id changed and every notable keeps its lines.
Four of the seven lead on in the plain sense (a neighbour farther from the start: Steadfast Faith, Whirling Ward, Choir
of Wrath, Hymn of War). Three stand on a way between two places, entered from either end, with no neighbour farther
out: Hallowed Ground (between the shrine and Hymn), Ember Litany (between the rim node and Kindled Steel), Staff of
Judgement (between Crozier and Faith Unleashed). The owner's reason holds for them (taking the room's notable forces no
point into them, and each is a way through), but they are valleys, not ways out.

| Notable            | Was behind    | Now                                                                                                                                                                                                                                     |
| ------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steadfast Faith    | Iron Faith    | the shield aisle: Frozen Font's shield-block smalls (a bypass link past the font) into it, on into the wheel's shield small `n7`; its link to Iron Faith went                                                                           |
| Whirling Ward      | Warding Staff | the staff aisle: Buttress's smalls (a bypass past Buttress) and two new staff spell-block smalls into it, on into Warding Staff and the mid ring                                                                                        |
| Hallowed Ground    | Reliquary     | the shrine's door small runs through to its far small (a bypass past Reliquary), a totem small to Hallowed Ground, on into Hymn (lightning's first home): the caster who plants a totem and calls lightning; its link to Reliquary went |
| Choir of Wrath     | Benediction   | off Procession's second aura small (its own way in from the rim, `q3`), on into Benediction and the Rimed Steel wheel                                                                                                                   |
| Ember Litany       | Kindled Steel | two new fire-attack smalls in from the rim node `n1`, on into Kindled Steel and the spoke junction: the fire striker's way between the spoke and the rim's fire (Brazier, Censer)                                                       |
| Hymn of War        | Battle Hymn   | off Battle Hymn's entrance small (not the notable), on by two warcry smalls across the Wall border into the Grit and Gravel run (below); its link to Battle Hymn went                                                                   |
| Staff of Judgement | Crozier       | a new staff small off Crozier's second small, on by a lightning small into Faith Unleashed; its link to Crozier stays (both ends now have other ways in), so Crozier leads on too                                                       |

Moved to make room (ids unchanged): Zeal (off the Wall spoke's first junction), Buttress's room, Shattering Rite's room
(it ran back toward the start; it now runs out beside the spoke), Frozen Font (off the line of its smalls), Steadfast
Faith, Hallowed Ground, Staff of Judgement.

**Item 2, the start.** The V is gone in shape (the cross, above): `home.cross` (the four smalls of the roads in to
Zeal) is removed. Zeal (step 5 to 6) stands off the south-west spoke's first junction on the nave side, by a small of
its own stat, and leads on into Buttress and the staff aisle: the faithful-at-arms side's damage generalist, as Bright
Omen is the other side's. Dead-end notables within 8 went from 4 to 0:

- Zeal leads on into Buttress.
- Lectern is the north-east side's backward way, on by a spell small to `i5`.
- Shattering Rite leads on into the shield aisle's last small (into the last small, so the rite is a way on and not a
  meeting point of two ways).
- Ardour leads on by an elemental-attack small into the Choirmaster wheel's door small: the striker who carries auras.

Litany, a resistance star hung off the seam path, is now the south-west side's backward way (a resistance small in
from the seam path's first small, out by its chaos spoke to `i4`). First notable per exit 5/5; from the hubs 6 (they
no longer lead to Zeal). Starts still 12 from both neighbours (the seam paths are untouched).

**Item 4, clusters to clusters.** Inside the region: the two aisles and the arcade; Zeal into Buttress; Shattering
Rite into the shield aisle; Ardour into the Choirmaster wheel; Procession into Choir of Wrath; the shrine through
Hallowed Ground into Hymn; Ember Litany's run from the rim; Staff of Judgement into Faith Unleashed. Into the centre:
Litany to `i4`, Lectern to `i5`. Across the borders, outside the mid ring where no road runs, both written in the
Cathedral's files:

- the Wall: Hymn of War on by two warcry smalls into `wall.maces.gritPay.s1`, between Grit and Gravel and Scar Tissue:
  the two counterparts meet (the Cathedral's warcries give insight, the Wall's give grit), the shouting holy warrior's
  way into grit. The second small sits just across the angle of the border. No shorter than the rim road round (five
  steps either way from `q1`);
- the Spire: Runecarver on by two duration smalls into the Spire's **Bound Host** (`spire.well.familiars.n2`, the
  border climb): the planted brand and the bound spell servant both last a duration. Both smalls stay just inside the
  Cathedral.

The incoming links still land: the Spire's Moonward into `cathedral.walk.guard.b`, the Wall's Grave Host into
`cathedral.rim.volatile.a` (both ids unchanged). No new shortcut: the check's list is unchanged (59 tree-wide; the
Cathedral's eight lines are the baseline ones every start has).

**Counts.** The Cathedral: 222 nodes, 54 notables, 5 keystones, mean links 2.12 before; 233 nodes, 54 notables, 5
keystones, mean links 2.24 after (15 new smalls, the 4 smalls of `home.cross` removed, no new notable). Tree: 1,470 to
1,481 nodes. Links across the Cathedral's borders: vanguard 7 to 8 (1 to 2 cluster to cluster), mystic 6 to 7 (1 to
2), centre 0 to 2. Hung tree-wide 7 to 0. From `branching.ts` for the Zealot: loops within 10 / 15 / 20 steps 7 / 43
/ 120 to 13 / 59 / 136; dead ends within 15 steps 58 to 45; mean links within 15 steps 2.34 to 2.40; notables within
14 behind each exit 33 / 36 to 35 / 37.

**Left open.**

- Frozen Font's three smalls stay `shieldBlock(2)` under a cold notable (a leftover the file flagged); they are the
  shield aisle's head now, so they were kept, not re-lined. The naming or numbers pass may want a cold line beside them.
- The hubs are plain road nodes now (two links each); the side's forks are at the first small and the seam path's
  first small. From each hub the next two steps are bare attribute nodes (`spN.a`, `spN.x`; `spS.a`, `spS.x`) before
  any small: the roads in to Zeal used to give the hubs a stat path too. Each first small still has its stat paths (the
  seam path and the backward way), and the spokes were left as the skeleton laid them; CONSTRAINTS §16 item 9
  ("attribute nodes only as junctions") is the lens to judge it by. The first notable from a hub is now 6.
- Lectern's door onto `i5` (above): kept for the cross's sake, a question for the reviewer.
- Rooms still hung by one entrance: Wake, Pilgrim's Mantle, Alms (whose attribute node `ambulatory.tithe.c` is still a
  one-link tail, as before), Rood Screen, Many Sigils, Chorus, Brandwright, Verger, Sexton, Procession's notable,
  Thunder Peal, Plainsong and Tomb Dust (joined to each other), Vespers, Censer, Brazier, Faith Aflame, the Gilded Rod
  and Homily wheels, and the keystone spurs. A join between the two brand rooms (Many Sigils, Brandwright) or the two
  lightning homes (Hymn, Thunder Peal) was left out on purpose: it would make a one-stop of a specialization the
  region spreads.
- Labels crowd in the region render: Steadfast Faith over Iron Faith, Ember Litany over Kindled Steel (older), Hallowed
  Ground beside Reliquary. For the label pass.
- No road was thinned: the new routes run beside roads.
- The new smalls' values wait for the flask-stats pass. Not registered or baked.

### The centre (first pass, 2026-10-31)

The centre has no start and no hung notables, so items 1 and 2 do not apply as such. What the revision asks of it is
item 4 (its eight notables were rooms hung off a road by one entrance) and item 3 (a small-scale form of its own). The
test that rules everything else is the centre's own reason (R-centre §2): **the generic layer costs every class the
same**. Every change was measured against it with a scratch table of steps from each start to every centre node, and of
the cost of every pair of centre notables (start to A to B, the better order).

That test rules out the obvious form. The three road spokes (from the junctions at 0, 120 and 240 degrees) cut the
hexagon into three cells, and each cell holds one junction room from each kind of junction. Any link between two
neighbouring junction rooms stays inside one cell, so at most three of the six pairs can be joined: the Mystic, the
Strider and the Vanguard would get a cheap way between their two junction notables and the other three would not. A
ring of six rooms beside the hexagon would be fair but would be the Yard's round again, a loop beside a road with no
build reason. Both were rejected.

**The forms** (item 3). The centre is the ground every class walks _into_, so its form makes every room a way inward:

- **The yoke.** The three junctions with no spoke (Mystic–Shade, Strider–Reaver, Vanguard–Zealot) each had a room hung
  off a dead corner of the hexagon. Each room is now a yoke: its door outside on its junction, and from the notable one
  small of the room's own stat to _each_ of the two spokes beside it (Firm Footing to s1 and s5, Waste Not to s1 and s3,
  Quick March to s3 and s5). So every class has two ways to the middle: the road from the junction on one border, and
  the yoke through the notable at its other border. From the junction to either spoke the yoke is 4 steps against the
  road's 3.
- **The inner door.** The three rooms at the spoked junctions (Shelter, Hard Living, Sound Body) open from their notable
  onto their own spoke and no further. From the junction to the spoke that is 3 steps against the road's 1. Through the
  spoke each one reaches both yokes beside it. Opening each only onto its own spoke is what keeps the pairs fair: a
  link from Shelter into Firm Footing's arm would have made the Mystic's pair of junction notables cheaper than the
  Shade's (the cell argument above, at a smaller scale).

Not the Knife's blade (nothing runs along a class radial), not its doors (one notable with three doors, not a fork
into two notables), not the Spire's floors or ladders (the arms cross a cell to roads that meet at the middle, not road
to road beside a ring), not the Bow's parting, not the Yard's round (no circuit of rooms: the rooms never join each
other, only the spokes), not the Wall's keep (each room keeps its road door), not the Cathedral's aisles (no wheel
between). The two middle notables stay rooms off the middle node: the walk inward ends there.

**Item 4, clusters to clusters.** Six yoke arms (six new smalls) and three inner doors (links only). Every junction
room now has two or three ways in. The new links touch only centre nodes; the links in from the regions are unchanged
(every id they land on was kept). No new shortcut: the check's count is unchanged (59 tree-wide). Every new route is
slower than the road beside it: yoke from junction to spoke 4 against 3, spoke to spoke through a yoke 4 against 2 by
the middle, inner door 3 against 1. No road was thinned. The three spokes are the only road to the middle, and taking
one away would price the middle's two differently by class.

**The fairness, measured** (steps from each start; before → after):

|                          | Mystic  | Shade   | Strider | Reaver  | Vanguard | Zealot  |
| ------------------------ | ------- | ------- | ------- | ------- | -------- | ------- |
| Shelter                  | 10      | 12      | 14 → 12 | 14 → 12 | 12       | 10      |
| Firm Footing             | 10      | 10      | 12 → 11 | 14 → 13 | 14 → 13  | 12 → 11 |
| Hard Living              | 12      | 10      | 10      | 12      | 14 → 12  | 14 → 12 |
| Waste Not                | 14 → 13 | 12 → 11 | 10      | 10      | 12 → 11  | 14 → 13 |
| Sound Body               | 14 → 12 | 14 → 12 | 12      | 10      | 10       | 12      |
| Quick March              | 12 → 11 | 14 → 13 | 14 → 13 | 12 → 11 | 10       | 10      |
| Well Rounded, Provisions | 12      | 12      | 12      | 12      | 12       | 12      |

Every class now sees the same set of junction distances: its own two at 10, then 11, 12, 12 and 13 (before: 10, 10,
12, 12, 14, 14). The middle's two stay 12 for everyone. The centre came a step closer to "about as far from every
start". Each class's own two junction notables together cost 13 for every class (16 before), and the spread between
classes on any pair of centre notables is at most 2 (4 before). The far junction notables are now one step nearer (11)
to the classes beside them, because a yoke can be entered from its spoke. That is a second door into a room, not a way
under a road.

**The doors from the regions** (the caller's question). Measured by cutting each door link and comparing:

- **Old Wounds** (Vanguard, step 6) reaches `i3` at 7.
- **Litany** (Zealot, 5) reaches `i4` at 7 by the star's chaos small.
- **Lectern** (Zealot, 5) reaches `i5` at 7 by its spell small.
- **Field Dressing** (Reaver, 6) reaches `i2` at 8 by its flask small.

The seam roads reach each of those inner road nodes at 7, for both classes of the pair. So none of the doors is a
shortcut. None makes the centre cheaper for one partner of a pair than the other: each inner road node is 7 from both,
with or without the door. But only Field Dressing is _slower_, as item 4 defines the trade. Old Wounds, Litany and
Lectern are a second seam path of equal length through a different notable of the class's own. The centre's shape
cannot fix that: lengthening an inner road would tax the seam road by the same step. The fix is on the region side: one
more small before the door. Retargeting a door into a junction room does not fit the geometry: the rooms sit inside
the hexagon and the doors come from outside it, so such a link would cross the hexagon or an inner road. It is left to
the reviewer with the regions' structure. Lectern was already flagged by the Cathedral as a question of reason. Old Wounds
and Litany are the same case by count.

**Counts.** The centre: 38 nodes (22 road, 16 in rooms), 8 notables, no keystones, before; 44 nodes, 8 notables after
(6 new smalls, no node removed, no notable added). Mean links per centre node 2.11 to 2.50 inside the centre (2.37 to
2.73 counting the ten links in from the regions). Tree: 1,481 to 1,487 nodes, mean links 2.29 to 2.30. Starts still 12
from both neighbours; crossings 0, drawn over 0, nothing unreachable, no road dead end; no reference names. The file
headers no longer say the generator writes them (it is retired, R-revise §4). Render: `R2-centre.png`.

**Left open.**

- Well Rounded and Provisions are still rooms off the middle node by one entrance. Joining either one to a yoke arm
  beside it would make the middle cheaper for the two classes whose yoke it is (the cell under the Mystic and the Shade
  holds no middle notable). The middle has an empty third side (toward the Mystic–Shade junction): a third middle
  notable there would restore the threefold symmetry and let all three join their yokes. It is the owner's open
  question (R-centre §7, "more than eight"), so it is not built.
- The three doors of equal length (above), for the reviewer.
- The six hexagon side nodes and the inner roads' nodes are still bare two-link attribute nodes. They are the frame,
  left as built.
- The new smalls carry each room's own small line (stun avoidance, cheaper skills, movement). Their values wait for the
  flask-stats pass. Not registered or baked.

### The Yard (finalization, 2026-10-31)

**Nodes:** 224 before, 216 after (eight road nodes cut, no node added); 52 notables and 3 keystones unchanged. Tree
when measured: 1,475 (the Knife and the Cathedral were working at the same time).

**Thinning the roads.** Eight road nodes went. A node stayed on every corner and every junction. Where a road node
held a room's entrance, the room moved to the next road node, so nothing lost its way in.

- **The two inner spokes:** `yard.home.spN.a` and `spS.a` held nothing. Each hub now runs straight to its
  cross-road junction. The mid ring is at step 6 instead of 7.
- **The mid ring between the spokes:** three nodes became one. `yard.blood.ring.a` and `ring.c` went. Red Harvest now
  hangs from the east spoke's junction (`yard.dual.spN.m`), and Answering Steel from the axis node (`ring.b`).
- **The rim ring:** eleven nodes became seven. `q2`, `q3`, `q6` and `q7` went, all on straight runs.
  - `q4` and `q5` moved to ±322 on the straight between the spokes, so the gaps stay even.
  - Bloodied Edge now enters at `q1`, beside Run Through. The two rooms are linked, so they form a loop off the corner.
  - Standard Bearer enters at `q4`, beside Fencer's Eye.
  - Shield Bash enters at `q5`, beside Elemental Edge.
  - Hold the Line enters at `q8`, beside Drill Call.
  - Crushing Swing enters at `s1`, where the west spoke meets the rim.
- **Not thinned:**
  - The border road `yard.shield.radW.a`: the Wall's `wall.slams.vampiric.a` links into it.
  - `s0`: two Wall links land on it.
  - The paths and cross roads near the start: they hold the start distances of 12 and the first notable at step 5.
  - The spoke nodes past the junctions: each holds an entrance.
- **Checks:** the starts are still 12 from both neighbours. 0 crossings, 0 drawn over, 0 unreachable, no road dead
  ends, 0 hung.
- **Keystones:** Hundred Cuts and Blood Bargain are now 9 steps from the start, and Shieldwall 10. The floor is 8
  (CONSTRAINTS §9.0).
- **The shortcut list:** the Yard now has 18 lines (11 before). None comes from a new link. The tool's `--list` prints
  only the first 60 lines tree-wide, so the full list was printed from a copy without that limit.
  - **Kept, renamed:** the old lines on `spN.a` and `spS.a` now name `spN.x` and `spS.x`: bow seam to `spN.x`,
    `spN.x` to centre `i2`, seam to `spS.x`, `spS.x` to centre `i3`. The lines on the Wall seam, the Bow seam,
    `radS.a` and the two hub-to-seam lines are unchanged, though some road counts fell by one.
  - **New, and the Yard's alone:**
    - hub to hub (road 10, through clusters 6);
    - each hub to the other spoke's junction (road 9, 7);
    - each hub to its centre inner-road node (road 10, 7);
    - each spoke junction to the next centre road node, `j2` or `j3` (road 10, 9).

    No other start has these yet, because only the Yard has thinned its spokes and mid ring.

  - **Why they appear:** thinning brought the road loop between the hubs (out one spoke, across the mid ring, back
    the other) from 12 down to 10, inside the check's window. The shorter way on each new line runs through the
    home's own smalls: the two roads in to Honed Steel (the court's V, which §8 accepts) or the path to Field
    Dressing. No first-pass or finalization join is on any of them.
  - **The real way:** from hub to hub through the start is 4 steps. The check leaves it out because it does not route
    through a start.

**A build reason for every join.** Every join from the first pass now names its build in its `why`. None was cut;
each had one. The two older ways across (Off-Hand Parry to Twin Fangs, Hot Blood to Open Veins) got reasons too.

| Join                                       | Build                                                  |
| ------------------------------------------ | ------------------------------------------------------ |
| Honed Steel → Fighting Breath              | fast attacker who runs on mana from hits               |
| west cross road → Clean Break              | heavy hitter who wants physical crit without the speed |
| Field Dressing → centre                    | Reaver who lives on flasks                             |
| Stout Heart → Mended Mail                  | armoured regenerator                                   |
| Fighting Breath → Sidestep                 | striker who trades blows, then slips the answer        |
| Sidestep → Four Winds                      | dodger who also wants resistances                      |
| Clean Break → Answering Steel              | blocker who answers hard                               |
| Answering Steel → Four Winds               | blocker who stands and takes it                        |
| Momentum Swing → Measured Cut              | two-handed stunner who crits                           |
| Fencer's Eye → the wheel's bleed small     | paired-blade bleeder who crits                         |
| Measured Cut → Shield Bash                 | shield basher who crits the stunned                    |
| Red Harvest → Banner Guard                 | leeching aura bearer                                   |
| Hot Blood → Crossed Blades                 | dual wielder who blocks for fervour                    |
| Bloodied Pursuit → Red Thirst              | bleeder who leeches                                    |
| Rally → Hold the Line                      | warcrying front-liner who stuns                        |
| Wide Arc → Crushing Swing                  | two-handed axe                                         |
| Run Through → Bloodied Edge                | sword that skewers and drinks                          |
| Scarred Hide → the Wall's Sledge and Sinew | shieldless brawler with a mace                         |

**Rooms that hang by one entrance.** Three new joins, no new node:

| Room                                                     | Nearest related cluster (about 3 steps)                                                                                | Joined?                                                                                                                                                                                                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keen Edge (damage after a block)                         | Buckler (block, speed)                                                                                                 | **Yes**, `keenEdge.n` → `block.b` (Buckler's block small, so the join runs through a small like every other join in the region). The sword-and-buckler duellist. Keen Edge had become a dead end within 8 steps once the spoke was thinned. |
| Light Blades (one-handed)                                | Sword and Board                                                                                                        | **Yes**, `lightBlades.b` → `board.c`. The one-handed sword with a shield.                                                                                                                                                                   |
| Iron Skin (armour)                                       | Hold the Line (armour smalls, fortify)                                                                                 | **Yes**, `armour.n` → `fortify.s2`. The armoured stunner.                                                                                                                                                                                   |
| Steady Guard (mana on block)                             | Bulwark Mending (life on block)                                                                                        | No. The join was tried, but the mid ring's road runs between the two rooms and the link crossed it. Its other kin, Buckler, already shares its road node.                                                                                   |
| Bulwark Mending                                          | Steady Guard                                                                                                           | No (as above).                                                                                                                                                                                                                              |
| Lasting Wounds (bleed duration)                          | Finishing Cut (against the bleeding), 3 road steps                                                                     | No. They are already three steps apart by road, and a link would cross the spoke.                                                                                                                                                           |
| Finishing Cut                                            | Lasting Wounds; Hewing (bleed chance), 3 steps                                                                         | No (as above).                                                                                                                                                                                                                              |
| Elemental Edge (fire on melee)                           | none (Measured Cut and Shield Bash beside it are stun)                                                                 | No.                                                                                                                                                                                                                                         |
| Spitting Blade (impale)                                  | none near: impale's other rooms (Light Blades, Run Through) are far; Off-Hand Parry at the same road node is unrelated | No.                                                                                                                                                                                                                                         |
| Footwork (accuracy, reach)                               | Twin Fangs is near but not related (accuracy and reach are generic melee)                                              | No.                                                                                                                                                                                                                                         |
| Hundred Cuts, Blood Bargain, Shieldwall (keystone spurs) | Open Veins, the leech rooms, the shields                                                                               | No. A keystone stays a spur at the end of its choice.                                                                                                                                                                                       |

Every other room has two ways in or more.

**The forms in plain words.**

- **The court:** in front of the start, the home's rooms make a loop around Honed Steel. You can walk it from either
  road in, the striker's rooms on one side and the guard's on the other.
- **The opening round:** beyond the mid ring, a loop of rooms that plays out a fight. The two-handed half stuns and
  crits the stunned; the paired-blade half bleeds and crits the bleeding. The halves meet at the rim.
- The runs (fervour, blood, bleed-to-leech) are chains of rooms beside a road. They are not claimed as a form.

**Left open:**

- Wanderer is still the one dead-end notable within 8 steps. It is the Bow's.
- Steady Guard and Bulwark Mending stay apart (the road runs between them).
- Not registered or baked.

### The Knife (finalization, 2026-10-31)

**Counts.** The Knife: 259 nodes, 65 notables, 4 keystones, mean links 2.32 after the first pass; 253 nodes, 65
notables, 4 keystones, mean links 2.34 now (244 before the revision). The tree read 1,468 at the end, with the Yard and
the Cathedral thinning at the same time.

**Thinning (6 nodes).** Four road nodes and two first-pass smalls:

- **The two spokes' first nodes** (`home.spN.a`, `home.spS.a`): bare attribute nodes between a hub and the spoke's first
  room, with nothing off them (CONSTRAINTS §16 item 9: attribute nodes only as junctions). Each spoke now reaches its
  first room a step sooner. Only one node per spoke went: a second would bring the dagger, claw and bow notables inside
  step 8.
- **The mid ring's first node past the north spoke** (`venom.ring.a`): its one room, the Rookery wheel, now opens off
  the junction of the spoke and the ring.
- **The rim's fourth node between the spoke corners** (`rim.ring.q6`): the skeleton allows 1 to 3 nodes between
  junctions. Its one room, Between Ribs, opens off the south corner.
- **A small off the Gutter** (three poison smalls, now two) and **one off Veiled Herald's run to Hare's Pace** (three
  evasion smalls, now two).

Kept: every corner and junction, the rim's border nodes (corners, and the Spire's and the Bow's files link into them),
the border radials (every node carries rooms), and `hex.radN.a` (Low Tide's way in). Starts are still 12 from both
neighbours, the first own notable is still at step 5, and nothing is hung.

What moved closer:

| Notables                                                  | Steps before | Steps now |
| --------------------------------------------------------- | ------------ | --------- |
| Thick Blood, Snakeskin                                    | 6            | 5         |
| Steady Eye                                                | 7            | 6         |
| Swift Incantation                                         | 8            | 7         |
| Talon, Fine Point, Quiet Knife, Quiet Shot, Fan of Blades | 9            | 8         |
| Shade Leech, Cruel Agony                                  | 11           | 10        |
| Cold Read (through the new join from Quiet Shot, below)   | 10           | 9         |

The blade is now four steps slower than either spoke to the mid ring (two before). Its `why` says so.

**Shortcuts.** No cluster route got faster than a road. Comparing every road pair that touches the Knife before and
after, ten pairs entered the check's list:

- Six moved inside its 10-road-step window because the spokes got shorter: the hubs with the other spoke's first nodes
  and the centre's first road nodes (`hubs.n` with `spS.x`, `edge.spS.a` and `centre.ring.road.i0`; `hubs.s` with
  `spN.x`, `venom.spN.a` and `i1`).
- Four involve `spN.x` (with `seams.n`, `spS.x`, `i0`, `j0`). It now sits one step from its hub and inherits the hub's
  old pairs: `hubs.n – seams.n` was already 10 against 6.

Each runs through the start's own stat paths (the two roads in to Keen Instinct, and the paths by Spoils and Soft Step
to the seams). These are smalls by §16 item 9, and the skeleton built them that way. Five pairs left the list with the
removed nodes. The two new joins below changed no pair.

**A build reason for every join.** Each join the first pass added now names who walks it in its `why`:

| Join                                        | Who walks it                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Thick Blood into Low Tide                   | the regenerating Shade (life regeneration, then mana regeneration)                            |
| The mana run to the north border road       | the caster coming along that road (Shifting Ward, Spellslip) who runs low on mana             |
| Quick Wrists' blade to Second Curse's small | the curser who attacks or casts fast                                                          |
| The mana door (Deep Reserves)               | the caster of costly spells who wants a mana pool more than flasks                            |
| The flask door into Hoarded Breath          | the flask user with energy shield, Shade or Mystic                                            |
| The resistance door (Ward of Smoke)         | the build short of resistances                                                                |
| Deft Guard into Grey Cloak                  | the evasion build                                                                             |
| The Gutter, both ends                       | the poison curser at the Ill Wish end; the poison and chaos attacker at the Rust and Ruin end |
| Steady Eye's crit run                       | the precise crit attacker                                                                     |
| Fan of Blades into Cutpurse's Luck          | thrown blades and arrows, which want crit multiplier                                          |
| Frost Snare into the Trapper wheel          | the cold trapper                                                                              |
| Tumble, Twin Shadows, Veiled Herald         | the dual-wielding evader                                                                      |
| Veiled Herald to Hare's Pace                | the evasive attacker, Shade or Strider                                                        |
| Quiet Knife onto the blade                  | the dagger caster                                                                             |
| Wiry Frame to Sharp Tongue                  | the evasive dagger caster                                                                     |

None was cut: each has a build.

**Rooms hanging by one entrance.** There were 22. Two joins were added where the relation is real and the two rooms
hang off different road nodes:

- **Quiet Shot into Cold Read:** the crit archer wants Quiet Shot's crit multiplier and Cold Read's crit chance. Quiet
  Shot moved beside its small so the link lies clear, and it is no longer a dead end (thinning had brought it to step
  8).
- **Glint into Sleet,** outside the rim: the cold spell crit caster.

Both are dearer than the road between the rooms' ways in. The 19 left, each with its nearest related room within three
steps:

| Room                                               | Nearest related room        | Why it stays apart                                                                                  |
| -------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Shade Leech, Cruel Agony, Spellslip, Nimble Gambit | (keystones)                 | they stay spurs; Cruel Agony's neighbour Second Curse is off the same node                          |
| Black Powder, Shock Charge (mines)                 | each other                  | both off rim q1, so a link saves nothing                                                            |
| Storm and Frost                                    | Shock Charge (shock)        | Long Grudge stands between them                                                                     |
| Ritual Blade (dagger spells)                       | Athame's dagger spell small | more than three steps away, across Salt and Whetted Will                                            |
| Salt in the Wound, Whetted Will (spells)           | each other                  | both off q3                                                                                         |
| Split Light (elemental)                            | Sleet (cold)                | the rim ring runs between them                                                                      |
| Hair Spring (trap crit)                            | none within three           | Feint and Cut beside it is dual wielding                                                            |
| Withering Word, Mercy Stroke                       | each other                  | both off q8, and the lines do not relate                                                            |
| Honed Mind (physical spells, spell crit)           | none within three           | Whetted Will and Glint are at the rim                                                               |
| Venom Snare (traps)                                | Tripwire (the Bow's traps)  | both off `radS.b`                                                                                   |
| Quick Blade (one-handed)                           | Raking Hand                 | both off `spS.c`                                                                                    |
| Vampiric Verse, Lingering Malice                   | each other, Bloodletter     | all off `hex.ring.a`; Malice's damage over time and the Rookery's poison are across the north spoke |

**The forms in plain words:**

- **The blade:** from the start, a way straight out through Keen Instinct and Quick Wrists to the second curse. It is
  the middle way out, slower than the two roads beside it.
- **Two doors:** near each seam the way forks into two notables of different kinds (flasks or mana to the north,
  evasion or resistances to the south). Either one walks on into the same room at the seam.
- **Lanes** ("alleys" in the first pass): a lane of one stat walks you from one room into the next without going back
  to the road. Examples: poison from Ill Wish past Smeared Edge to Rust and Ruin; Tumble through Twin Shadows to Veiled
  Herald; Fan of Blades into Cutpurse's Luck. Two lanes of evasion cross the borders outside the mid ring: Wiry Frame
  into the Spire's Sharp Tongue, and Veiled Herald into the Bow's Hare's Pace.

Steady Eye's crit run and the mana run past Low Tide sit beside roads, so they are not claimed as part of the form.

**Left open.** Swift Incantation is still a dead end, now at step 7 (§7, first pass): every way on crosses the north
spoke or the mid ring. Some older cluster `why` texts in `rim.ts` and `roofs.ts` describe lines the notables no longer
have (Withering Word, Hair Spring, Split Light). They were left for the naming pass. Not registered or baked.

### The Cathedral (finalization, 2026-10-31)

**The hubs' bare spokes** (CONSTRAINTS §16 item 9). Each side ran start, its first small, the hub, then two bare road
nodes (`spN.a`, `spN.x`; `spS.a`, `spS.x`) before any small. Now each side runs start, its first small, **a small of a
useful stat** (`home.spN.w`, elemental damage, the stat of Zeal and the sceptre wheel; `home.spS.w`, spell damage, into
Shattering Rite and Frozen Font), then the **hub** at step 3, standing where the spoke parts into its first rooms (it
took `spN.x`'s and `spS.x`'s place; the four bare nodes are gone, ids `hubs.n` and `hubs.s` kept). The attribute node
is now the junction (Zeal, Wake, the spoke on; Ardour, the spoke on). No road meets at Zeal: Zeal still hangs off the
south-west hub alone. Six directions at step 3 as before (the two hubs, the two seam paths' second smalls, Lectern's
and Litany's first smalls). The cost: the spokes are a step shorter, so Zeal and Ardour are at 5 (6 and 6 before), the
mid ring at 6 and the rim at 8 (7 and 9 before, and 7 and 9 in the regions I looked at), and the hubs lost 6/6 of the
spoke nodes' attributes each. I took it because the two bare nodes were exactly the road nodes that earned nothing; a
fairness reading of the mid ring at 6 is for the reviewer.

**Litany's door** (`i4`). A resistance small (`home.star.d`) now stands between the star's chaos small and the inner
road: the start to `i4` through Litany is 8, the seam road 7.

**Lectern's door** (`i5`). Cut: there was no build behind it. Lectern instead leads on into Bright Omen's small
(`home.omen.a`): the brand or totem caster who wants Lectern and Bright Omen takes both in one walk to the Spire's seam,
a point fewer than going back, two steps slower than the seam path. `lectern.c` is gone. Lectern is a valley (both
its neighbours are at 4), so `revise-check` counts it as the Zealot's one dead-end notable within 8. It is a specialist
room, not a generalist, like the Knife's Swift Incantation and the Bow's Wanderer. Links from the Cathedral into the
centre: 2 to 1.

**Thinning** (233 nodes to 227):

| Removed                                                | Why it could go                                                                                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home.spN.a`, `home.spN.x`, `home.spS.a`, `home.spS.x` | bare spoke nodes (above). Two new smalls replace them, so net -2                                                                                                |
| `walk.ring.q6`                                         | the rim's one bare node, between q5 and the north-east spoke. q5 moved to halve the stretch                                                                     |
| `ambulatory.tithe.c`                                   | Alms's one-link attribute tail                                                                                                                                  |
| `home.lectern.c`                                       | Lectern's centre door (above)                                                                                                                                   |
| `ambulatory.kindled.e1`                                | Ember Litany's run from the rim had two smalls where one is enough. Still six steps against the spoke's one                                                     |
| `nave.warding.w1`                                      | the staff aisle had two smalls between Buttress and Whirling Ward where one is enough (`w2` keeps the arcade link). Still eight steps against the spoke's three |

Added: `home.star.d`. No incoming link from another region landed on a removed node. The two incoming links that had to
keep landing still do: the Spire's `highVeil.x` into `walk.guard.b`, and the Wall's Grave Host into `rim.volatile.a`.
Every road node left in the Cathedral is a junction or a corner. No more road could go without moving a cluster's door
onto a crowded junction or shortening a spoke again.

**A build reason for every join.** Every first-pass join's `why` now names the build that walks it: Zeal into
Buttress (the staff caster), the staff aisle and the arcade (the staff caster who casts fire), the shield aisle and
Shattering Rite into it (the priest behind a shield), Ardour into the Choirmaster wheel (the elemental striker who
carries auras), Procession into Choir of Wrath (the aura-stacker), Hallowed Ground into Hymn (the totem planter who
calls lightning), Runecarver into Bound Host (the caster of brands and spell servants), Ember Litany's run (the fire
striker), Staff of Judgement into Faith Unleashed (the staff priest), Hymn of War into the grit run (the shouting holy
warrior), Litany's door (the resistance capper). None was cut for lack of a reason.

**Rooms hanging by one entrance**, with each room's nearest related cluster:

| Room                                                      | Nearest related cluster                                                   | Joined?                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Wake                                                      | Pilgrim's Mantle (life and defence, one tail apart)                       | **joined**: `wake.c` → `plate.b`, the life-and-pools defender's way to the Wall's border road; 8 steps against the road's 6 |
| Pilgrim's Mantle                                          | Wake                                                                      | **joined** (above)                                                                                                          |
| Faith Aflame                                              | Searing Avatar (its own text calls it "the road to" fire's keystone)      | **joined**: Faith Aflame → `searingAvatar.a`; 5 steps between q3 and q4 against the rim's 1                                 |
| Frozen Font (a valley at step 8 once the spoke shortened) | Hearthfire (fire spells), two steps on through the Iron Faith wheel       | **joined**: Frozen Font → `nave.wheel.n1`, the caster of cold and fire; spoke to mid ring 5 against 3                       |
| Alms                                                      | Verger (on-hit sustain), 5+ steps along the Wall's road                   | no: too far                                                                                                                 |
| Rood Screen                                               | Buttress and Glass Wall (spell block), far; Ardour is close but unrelated | no                                                                                                                          |
| Many Sigils, Brandwright                                  | each other (brands), about 3 steps                                        | no: brands are spread on purpose, so no one-stop                                                                            |
| Chorus                                                    | Lone Vow (auras), 3 steps by the spoke                                    | no: the link crosses the spoke road                                                                                         |
| Verger                                                    | Gilded Rod (sceptres), 7+ steps; Hymn of War is near but unrelated        | no                                                                                                                          |
| Sexton                                                    | Ossuary (minions), 5 steps by the rim                                     | no: too far                                                                                                                 |
| Thunder Peal                                              | Hymn (lightning), already 2 steps by the same junction                    | no: lightning would become a one-stop                                                                                       |
| Vespers                                                   | Plainsong (channellers want mana), already 2 steps by the same rim node   | no: nothing to gain                                                                                                         |
| Censer, Brazier                                           | each other (burning), on neighbouring rim nodes                           | no: a join saves no point and only loops beside the rim                                                                     |
| Procession (the notable)                                  | Choir of Wrath, off the room's second small                               | already a way through                                                                                                       |
| Gilded Rod wheel                                          | Warding Staff (staves), Homily (the sceptre caster)                       | no: either link crosses the spoke or the mid ring road                                                                      |
| Homily wheel                                              | Twofold Guard (shield spell block), far                                   | no                                                                                                                          |
| Idle Hands, Lone Vow, Sigil Warden                        | Warding Staff, Chorus, Runecarver                                         | no: keystone tips; the first two links would cross the spoke                                                                |
| Searing Avatar, Volatile Servants                         | Faith Aflame; the Wall's Grave Host                                       | both now have two ways in                                                                                                   |

**The forms, in plain words.**

- **The cross** (the start): each side's first point opens three ways. You can go out to the hub where the spoke's
  rooms begin, or across to the neighbour's seam. On the south-west you can also go back toward the centre through
  Litany's resistances. On the north-east, Lectern sits beside the across way. No road from the two sides meets in
  front of the start.
- **The aisles** (the nave): two lanes run side by side out through the nave to the mid ring, a staff lane and a
  shield lane, and they meet only at the Iron Faith wheel. Staff casters come into the wheel at its fire side,
  shield-bearers at its shield side.

The other joins are rooms linked to rooms beside roads. They are not claimed as forms.

**Counts.** The Cathedral: 233 nodes, 54 notables, 5 keystones, mean links 2.24 before; 227 nodes, 54 notables, 5
keystones, mean links 2.27 after. Links across borders: vanguard 8 (2 cluster to cluster), mystic 7 (2), centre 2 to 1.
Checks: geometry for the whole tree 0 crossings, 0 drawn over; reach 0 unreachable, no road dead ends; hung 0; starts
12 12 from both neighbours; `ref-names` no matches. The Cathedral's lines in the shortcut list went from 8 to 1, and the
one left is the baseline seam-path pattern every start has (`spire.home.seams.w – cathedral.home.hubs.s`, road 8,
clusters 7; it was 10 against 6). From `branching.ts` for the Zealot: loops within 10 / 15 / 20 steps 26 / 84 / 156;
dead ends within 15 steps 42; mean links within 15 steps 2.43; notables within 14 behind each exit 38 / 49. Those
counts include the neighbours' concurrent edits. Render: `R2-cathedral.png`.

**Left open.**

- The mid ring at 6 and the rim at 8 from the Zealot's start (the shortened spokes), against 7 and 9 elsewhere unless
  the other regions thinned theirs too.
- Lectern is a valley at step 5 (above).
- Labels still crowd in the render (Steadfast Faith over Iron Faith, Ember Litany over Kindled Steel, Hallowed Ground
  beside Reliquary). They are for the label pass.
- The new smalls' values wait for the flask-stats pass. Not registered or baked.

### The Bow (finalization, 2026-10-31)

**Counts.** The Bow: 236 nodes, 57 notables, 4 keystones at the start of the finalization; **218 nodes**, 57 notables, 4
keystones now (18 fewer; 215 before the revision). No node added. The tree read 1,435 at the end, with the Spire and the
Wall working at the same time.

**The middle exit, walked as a player.** As the first pass left it, a Strider who took the middle exit got Hawk's Eye or
Hard Target at step 5 and was then led into rooms that hang off the two spokes (Sure Aim off the north spoke, Hunter's
Rush off the south): `branching.ts` counted 2 notables behind it. It was a shortcut into the side exits' ground, not a
direction. Now two doors moved, and no node was added:

- **Sure Aim's door** went from the north spoke (`bows.spN.b`) to the mid ring at the axis (`flight.ring.a`). The north
  arm runs Hawk's Eye, Sure Aim, the mid ring.
- **Hunter's Rush's door** went from the south spoke (`steel.spS.a`) to the south arm's second small (`cross.s2`). The
  south arm forks there: Hard Target one way, Hunter's Rush the other, the two joined by one life small (it was two). The
  arm runs on through Hunter's Rush and Rapid Fire to the mid ring at the axis, where Pursuit's End spends the Quickened
  that Hunter's Rush earns.

Walking it: point 1 attack speed and life, 2 the hub, 3 and 4 life or resistances, 5 Hawk's Eye or Hard Target, 7
Sure Aim or Hunter's Rush, 8 Rapid Fire (the first bow notable, not inside 8), then the mid ring at 10 or 11, slower than
either spoke (7). Behind the middle exit (notables that lose 3 steps or more without it): **5** (Hawk's Eye, Sure Aim,
Hard Target, Hunter's Rush, Rapid Fire), against 42 and 46 behind the side exits (of 117 within 14). It is the
generalist's way out into the Meadow, the speed and accuracy ground on the axis: a small direction, but its own.

**Supply Line and Second Wind.**

- **Supply Line's door went.** Its rim node holds the fire and lightning rooms, and no flask build walks in from there.
  The Field Kit room is now a fork: two evasion smalls in (three before), then the way parts, Field Kit on one side, a
  flask small to Supply Line on the other. Neither forces the other. `fieldKit.b` and `fieldKit.f` are gone.
- **Second Wind's door stays, with a build:** the close-fighting Strider who takes hits walks the border road for Light
  Hand or the Yard's Twin Fangs. It takes Second Wind's regeneration from that road, then Hardy Stock's life on the way to
  the mid ring's sword and shield rooms. One resistance small of the room went (`hardyStock.b`).

**Thinning (18 nodes).**

| Removed                                                                                                                | Why it could go                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `home.spN.a`, `home.spS.a`                                                                                             | bare attribute nodes between a hub and its spoke's junction (CONSTRAINTS §16 item 9), as the Knife and the Yard did. Only one per spoke: a second would bring Steady Draw and Plated Hide inside 8 and the mid ring to 5 |
| `rim.ring.q6`, `rim.ring.q8`                                                                                           | straight runs of the rim. q3 to q5 and q7 were spaced evenly again. Hot Pursuit's door moved to q4, Hunter's Fervour's to q5, Fouled Tips' to q7; no room has both doors on one node                                     |
| `fieldKit.b`, `fieldKit.f`                                                                                             | the fork above                                                                                                                                                                                                           |
| `hardyStock.b`, `hardTarget.d`                                                                                         | a room's second small of one stat                                                                                                                                                                                        |
| `crit.a`                                                                                                               | Vital Aim's second crit small. With the spoke shorter, Vital Aim had become a valley (dead end) at 6 between the path and the spoke; it is now at 5 and leads on to Long Breath                                          |
| `killShot.b`, `leap.d2`, `tripwire.k2`, `crystal.w1`, `killingEye.g1`, `killingEye.x1`, `hotPursuit.f1`, `deepPull.c1` | the third small of a run, or the second where one does the work. Every route shortened is still slower than the road between its two ends                                                                                |
| `roundShield.c`                                                                                                        | the second small of a tail after Round Shield                                                                                                                                                                            |

Kept: every corner and junction; the south border road (`radS.a`, `b`, `m`), `seams.s` and `rim.ring.q1`/`s0`, which
the Yard's and the Knife's files link into; Hare's Pace's `s`, where the Knife's Veiled Herald arrives. `bows.spN.a` and
`steel.spS.a` are bare now and stay, because of the keystone floor. What moved closer: Long Breath and Quick Hands 6 to 5,
Vital Aim 6 to 5, Thirsty Quiver 8 to 7, Hunter's Rush 8 to 7, Rapid Fire 9 to 8, Frost Fletching 9 to 8. Also a step
closer: the spokes' rooms, the mid ring at 7 (it was 8), and the rim. Steady Draw and Plated Hide are now at 8, the
floor.

**A build reason for every join.** Each first-pass join and each older "way across" now names its build in its `why`:

| Join                                                    | Who walks it                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Hawk's Eye into Sure Aim, on to the mid ring            | the accuracy archer                                                                |
| Hard Target into Hunter's Rush                          | the Strider who wades into packs                                                   |
| Vital Aim into Long Breath                              | the crit archer who lives on recovery (life on crit, life on kill)                 |
| Wayfarer into Thirsty Quiver                            | the kiter who wants evasion while moving and leech                                 |
| Quick Hands into Thirsty Quiver                         | the fast attacker who leeches                                                      |
| The north parting (Steadfast Aim, Wind Rider)           | the archer who plants its feet stops at the post; the kiter goes on                |
| Wind Rider into Hare's Pace                             | the kiting archer who shoots on the move                                           |
| The spoke parting, Skirmisher's Leap into Pursuit's End | the blink skirmisher, Quickened by every blink                                     |
| The trap run's ring door (Kiting Snares)                | the trapper who kites                                                              |
| Tripwire and Frost Fletching                            | the cold trapper                                                                   |
| Longbow and Ricochet                                    | the bow user who clears packs                                                      |
| Rapid Fire and Hunter's Rush                            | the fast bow user; now also the middle exit's way to the mid ring                  |
| Light Hand and Deep Pull                                | the one-handed physical striker                                                    |
| Second Wind's border road door                          | the close-fighting Strider who takes hits (above)                                  |
| Braced Guard into Fleet Blade                           | the sword-and-board Strider                                                        |
| Pitch Arrows and Bright Shafts                          | the fire archer                                                                    |
| Bright Shafts to Grim Tally and Killing Eye             | the elemental archer short of mana                                                 |
| Hunter's Fervour's door and Hot Pursuit                 | the crit archer who wants fervour                                                  |
| Killing Eye into the Yard's Crossed Blades              | the crit Strider who dual wields, or the Reaver duellist who wants crit multiplier |

Supply Line's door was the one with no build; it went (above).

**Rooms that hang by one entrance** (a tool counted every Bow cluster holding a notable with one link out). One join was
added, where the relation is real: **Hunter's Satchel into Hunter's Rush**, the hunter who kills fast and drinks often.
Satchel is on the mid ring, Hunter's Rush is two steps away on the middle arm, and the way between them is slower than
the ring.

| Room                                                 | Nearest related cluster (about 3 steps)                                                                                          | Joined?                                      |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Hunter's Satchel (flask charges)                     | Hunter's Rush (kills)                                                                                                            | **yes** (above)                              |
| Arrow Weave, Close Quarters, Plated Hide (keystones) | Tall Grass; Far Flight; Archer's Breath                                                                                          | no: keystone spurs stay spurs                |
| Steadfast Aim                                        | Wind Rider                                                                                                                       | no: the post of the north parting, by design |
| Far Flight and Barbed Arrows (wheel)                 | none related within 3 (Steady Draw, Skirmisher's Leap and Sure Aim are near but unrelated); Deep Cuts (bleed) is across the axis | no                                           |
| Split Volley and Deep Cuts (wheel)                   | Close Quarters (a keystone); Barbed Arrows is far                                                                                | no                                           |
| Elemental Fletching                                  | Storm-Feathered (elemental attacks), far beyond the rim; Ricochet near but unrelated                                             | no                                           |
| Kill Shot (bow crit)                                 | none within 3                                                                                                                    | no                                           |
| Field Kit and Supply Line                            | Spare Stock and Field Poultice (flasks), both far                                                                                | no                                           |
| Live Wire, Pitch and Flame, Fouled Tips              | each other (elemental arrows, poison)                                                                                            | no: all off q7, so a link saves nothing      |
| Field Poultice (life flasks)                         | Killing Eye near but unrelated; the flask rooms are far                                                                          | no                                           |
| Tall Grass (evasion)                                 | Arrow Weave (a keystone)                                                                                                         | no                                           |
| Telling Shot (the archer who stands)                 | Arrow Weave (keystone); Steadfast Aim far                                                                                        | no                                           |
| Storm-Feathered                                      | Elemental Fletching, far                                                                                                         | no                                           |
| Rime Shafts (cold)                                   | Frost Fletching, far; Hare's Pace near but unrelated                                                                             | no                                           |
| Far Reach (projectiles)                              | Hare's Pace near but unrelated; Ricochet far                                                                                     | no                                           |
| Spare Stock (flasks)                                 | Hunter's Satchel, about seven steps away                                                                                         | no: too far                                  |
| Lingering Momentum (buff duration)                   | Skirmisher's Leap and Pursuit's End, far; Hardy Stock near but unrelated                                                         | no                                           |
| Archer's Breath (mana on crit)                       | Grim Tally, far; Plated Hide (a keystone)                                                                                        | no                                           |
| Wanderer                                             | Quick Sip and the Yard's Killing Pace on the same seam node                                                                      | no: a link saves nothing                     |

**The forms in plain words.**

- **The three-way start:** the Strider leaves its start three ways: north for bows and traps, south for close fighting
  and the Yard, or straight out into the Meadow of speed and accuracy, whose two arms reach the mid ring on their own.
- **The parting:** twice, a small where the way parts into the archer who stands and the one who moves. The stander's
  notable is the end of the line. The mover's goes on to other ground: Wind Rider to Hare's Pace on the rim, Skirmisher's
  Leap to Pursuit's End.

The rest (the trap run, the mana run to Grim Tally, the rooms joined across beside roads, the Field Kit fork) are rooms
linked to rooms. They are not claimed as forms.

**Checks.** Geometry for the whole tree: 0 crossings, 0 drawn over. Reach: 0 unreachable, no road dead ends. Hung 0
tree-wide. Starts 12 and 12 from both neighbours. First own notable 5 on all three exits and from every step-2 node.
`ref-names`: no matches.

- **Dead-end notables within 8:** 3, all but Wanderer keystones. Steady Draw and Plated Hide are keystone spurs that the
  spoke cut brought to 8.
- **Shortcuts:** seven Bow lines are new against the first pass, all on `home.spN.x` or `home.spS.x` now sitting one step
  from their hubs: the Knife's seam, the Bow's seam, `centre i1/j1/i2/j2`, `yard.home.spN.x`. Each short way runs through
  the start's own stat paths, the pattern the Knife and the Yard reported. No first-pass or finalization join is on any
  of them, and the moved doors and the new join made no line.
- **`branching.ts` for the Strider:** loops within 10 / 15 / 20 steps 23 / 77 / 148; dead ends within 15 steps 50; mean
  links within 15 steps 2.42; notables behind each exit 42 / 46 / 5 of 117 (34 / 37 / 2 of 98 before). Render:
  `R2-bow.png`.

**Left open.** Wanderer is still a tip. The labels still crowd (Steady Draw over Far Flight; Second Wind, Hardy Stock,
Braced Guard and Lingering Momentum in the Ford): for the label pass. Telling Shot's door on q4 is now a long link
across the rim's outside. Not registered or baked.

### The Spire (finalization, 2026-10-31)

**Counts.** The Spire: 265 nodes, 64 notables, 5 keystones, mean links 2.33 after the first pass; 251 nodes, 64
notables, 5 keystones, mean links 2.35 now (247 before the revision). Fourteen nodes went and none was added. The tree
read 1,413 at the last reading, with the Bow and the Wall thinning at the same time.

**Wandwork into Fire and Frost.** Cut. It joined notable to notable, and no build wants the pair more than the west
spoke already gives it. Wandwork is a tip again, at step 9, so it is not a dead end within 8. Fire and Frost was left
with one entrance, and it has a real second one now (below): it leads on to the mid ring node where Hoarfrost hangs.

**Thinning (14 nodes).**

| Removed                                | Why it could go                                                                                                                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `well.radW.b`                          | the west border road's middle node, on a straight run, with only Pain Conduit off it. Pain Conduit now opens off `radW.a` (its spur turned to lie clear of the road). No other region links into it            |
| `rim.ring.q2`                          | the rim's straight run from the Cathedral border to the west spoke had two nodes; one is enough. `q1` moved to the middle of the run. Kiln Heart now opens off `q1`, Bright Wand off `w1` (the spoke's corner) |
| `rim.ring.q5`                          | four nodes between the spoke corners, where the skeleton allows 1 to 3. Now three, evenly spaced (`q3`, `q4` on the axis, `q6`). Piercing Word and Blast moved to `q4`                                         |
| `rim.ring.q7`                          | the straight run from the east spoke to the Knife's border node. Needlework and Thunder's Reach moved to `q8`, side by side, so lightning's ladder still tops out at Thunder's Reach                           |
| `column.ring.b`                        | the mid ring had three nodes between the spokes; now two (`a` and `c`, moved to ±217). Hoarfrost opens off `a`, Prism Ward off `c`                                                                             |
| `home.stillMind.d`, `home.sharpMind.d` | each crossing arm had a second small only to stay slower than the road round. The road round lost `column.ring.b`, so one small is enough: hub to the far spoke's second landing is 10 against 9               |
| `quickening.r3`                        | the recharge floor had five recharge smalls. Now four. Border road to spoke is 7 against the road's 6                                                                                                          |
| `composure.b`, `composure.x`           | the mid floor: one of Composure's three stun smalls, and the shield small between Iron Litany and Slow Burn's crossroads. Iron Litany now meets the crossroads itself                                          |
| `wandVolley.z`                         | the mid floor's wand small: Hail of Sparks meets the crossroads itself. Spoke to spoke over the floor is 9 against the mid ring's 5                                                                            |
| `familiars.h1`                         | the climb's second minion small between Familiars' room and Bound Host                                                                                                                                         |
| `badCompany.o`                         | the mana small between Hexed Pack and Overflow. Hexed Pack meets Overflow's mana small itself                                                                                                                  |
| `column.star.f`                        | Prism Ward's chaos small, which hung toward First Light with nothing beyond it (left open in the first pass). The room is now one small per element                                                            |

**Tried and put back.** The bare spoke nodes between the hubs and the first landings (`home.spW.a`, `home.spE.a`), as
the Knife and the Cathedral did. On the Spire, each spoke a step shorter made four notables within 8 dead ends or
valleys: Wandwork and Deft Wand became tips at 8, and Kindling, Thunderhead, Quickening and Surging Tide became valleys
between their spoke and the next road. Ending the arms on Wandwork and Deft Wand, to keep those two from being tips,
left Still Mind and Sharp Mind hung behind notables. The two nodes stay, and so does `siphon.t3`. The spokes and the
mid ring are where they were: the mid ring at 7, the rim at 9.

Kept: every corner and junction, `well.radW.a` and `radW.m` (the Cathedral links into both), `rim.ring.w0` (the
Cathedral's rim) and `q8` (the link to the Knife's rim), `craft.sharpTongue.c` (the Knife's Wiry Frame lane) and
`well.familiars.n2` (the Cathedral's Runecarver run). The starts are still 12 from both neighbours. The first own
notable is at 5. Pain Conduit is now 10 steps from the start (11 before), and Mind Bulwark and Mana Bastion are at 10.

**A build reason for every join.** Each join from the first pass names who walks it in its `why`. The older "a way
across" links got one too.

| Join                                                               | Who walks it                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| First Light onto the east arm (Still Mind) into Wandwork's smalls  | the wand caster: the generalist, mana to cast with, then wand spells                                                      |
| First Light onto the west arm (Sharp Mind) into Deft Wand's smalls | the crit caster, and the wand attacker who wants crit before Deft Wand                                                    |
| The recharge floor (spoke, Ward Renewed, Quickening, border road)  | the energy shield caster who lives on recharge                                                                            |
| The crit floor (spoke, Surging Tide, Siphon, Hexwright)            | the crit caster on energy shield, cursing on the way to the Knife's road                                                  |
| The mid floor: Iron Litany into Slow Burn's crossroads             | the caster who stands in the press and burns or chills what crowds in; the wand attacker who wants to stand through stuns |
| The mid floor: Hail of Sparks into the crossroads                  | the wand attacker who wants chain before speed                                                                            |
| Kindling to the mid ring (Flashpoint)                              | the fire caster who wants spell crit                                                                                      |
| Thunderhead to the mid ring (Keen Verse, Live Current)             | the lightning caster who crits                                                                                            |
| Conductor into Needlework                                          | the wand attacker who turns his damage to lightning and shocks                                                            |
| Rime into Broad Weave                                              | the cold area caster who chills whole packs                                                                               |
| Warm Hearth into Kiln Heart                                        | the igniter: ignites, recovery from the burning dead, penetration                                                         |
| The climb: Bound Host up by mana to Moonward                       | the spell-minion caster who stacks mana and wears energy shield                                                           |
| The climb past the rim: Hexed Pack into Overflow                   | the cursing summoner whose mana becomes shield                                                                            |
| Moonward across into the Cathedral's Twofold Guard                 | the warded caster who carries a shield, Mystic or Zealot                                                                  |
| Deep Well's shield small into Quiet Pulse                          | the life and energy shield caster                                                                                         |
| Composure into Steady Stream                                       | the channeller, who must not be stunned out of the channel                                                                |
| Living Verse into Mana Tap                                         | the caster who pays in life and mana and leeches the mana back                                                            |
| Siphon into Hexwright; Withering into Hexwright                    | the curser on energy shield; the hexer                                                                                    |
| Keen Verse into Live Current                                       | the lightning caster who crits                                                                                            |
| Needlework into Mist Walk                                          | the wand attacker who crits and dodges, Mystic or Shade                                                                   |
| Slow Burn's small into Hoarfrost                                   | the cold caster who lets the cold linger                                                                                  |

None of these was cut for lack of a reason. The one join cut is Wandwork into Fire and Frost (above).

**Rooms that hang by one entrance.** There were 24 after thinning (five of them keystone spurs). One join was added,
and it replaces the join that was cut:

- **Fire and Frost → the mid ring node `column.ring.a`, where Hoarfrost hangs.** The caster of fire and cold comes up
  the west spoke from Kindling's fire, takes Fire and Frost, and goes on to cold's first rung. From the spoke to that
  node it is 4 steps against the ring's 1. It joins a ring node, as Kindling's ladder does, because the line straight
  into Hoarfrost's smalls would cross the ring.

The 23 left, each with its nearest related room within about three steps:

| Room                                                                     | Nearest related room                                                   | Why it stays apart                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Mind Bulwark, Mana Bastion, Pain Conduit, Prismatic Balance, Fever Pitch | (keystones)                                                            | spurs at the end of their choice                         |
| Ready Wit / Warded Mind                                                  | Draught (off the same path node)                                       | already together                                         |
| Warm Blood                                                               | Hale Scribe (life, off the same path node)                             | already together                                         |
| Kept Vows (reservation)                                                  | none within three; the Cathedral's Bright Omen is near but not related | no                                                       |
| Flashpoint (fire, spell crit)                                            | Kindling (fire's ladder ends at the same ring node)                    | already together                                         |
| Darting Bolts (spell projectiles)                                        | none related within three (Spray of Bolts is across the rim)           | no                                                       |
| Prism Ward (resistances)                                                 | none related                                                           | no                                                       |
| Drone (channelling)                                                      | Steady Stream (channelling), across the middle band                    | too far, and the mid floor runs between them             |
| Shatter, Cold Light (freeze, cold crit)                                  | each other                                                             | both off `q4`: a link saves nothing                      |
| Piercing Word, Blast                                                     | Shatter, Cold Light                                                    | all four off `q4`                                        |
| Harsh Weather (ailments)                                                 | Shatter (freeze), two rim steps away                                   | the link would cross Piercing Word's and Blast's ways in |
| Recital, Pinpoint                                                        | each other                                                             | both off `e1`, and unrelated                             |
| Thunder's Reach, Spray of Bolts                                          | Needlework (lightning's ladder), Mist Walk                             | all off `q8`                                             |
| Bright Wand (elemental wand)                                             | Cinder                                                                 | both off `w1`, and only half related                     |

**The forms in plain words.**

- **The crossing:** at First Light the two roads in from the hubs don't stop. Each goes straight on to the far side: the
  mana way through Still Mind to the west spoke's wand spells, the crit way through Sharp Mind to the east spoke's wand
  attacks.
- **Floors:** from a spoke's first landing, a string of rooms runs sideways across the tower to the border road, where
  no road runs that way. The shield caster's floor is recharge; the crit caster's floor is crit, shield on hit and
  curses.
- **The climb:** up the west border, where no road runs past the mid ring, the minion rooms lead from one to the next:
  Familiars, Bound Host, Moonward, then past the rim Bad Company, Hexed Pack and Overflow. Mana feeds the minions at the
  foot and becomes shield at the top.

Not claimed as forms: the mid floor (spoke to spoke beside the mid ring) and fire's and lightning's ladders (rooms
climbing beside a spoke). They are chains of rooms beside a road.

**Checks.** Geometry for the whole tree: 0 crossings, 0 drawn over. Reach: 0 unreachable, no road dead ends. Hung 0.
The Mystic has no dead-end notable within 8. Starts are 12 and 12 from both neighbours. `ref-names`: no matches. The
shortcut check against the first-pass roads names 22 pairs tree-wide, none of them the Spire's. Links across borders:
zealot 7 (2 cluster to cluster), shade 7 (1), centre 1. Render: `R2-spire.png`.

**Left open.** The rim's east stretch is now one long link from `e1` to `q8`. `q8` is the border node, and it was not
moved because the Knife's rim continues from it. `q8` carries four rooms. Slow Burn's small is still a crossroads of
five links. Labels crowd (Hail of Sparks against Slow Burn, Glass Skin against Deep Well): for the label pass. Not
registered or baked.

### The Wall (finalization, 2026-10-31)

**Counts.** The Wall: 226 nodes, 49 notables, 4 keystones after the first pass; 205 nodes, 49 notables, 4 keystones now
(22 removed, 1 added; 215 before the revision). The tree read 1,414 at the end, with the Spire and the Bow working at the
same time.

**Thinning (22 nodes).** Six road nodes, four tails, twelve smalls from rooms with more than their idea needs:

| Removed                                                     | Why it could go                                                                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home.spS.a`                                                | a bare attribute node between the armour hub and the spoke's first junction (CONSTRAINTS §16 item 9)                                                                                  |
| `maces.ring.a`                                              | the mid ring's one bare node, between the south spoke's junction and the shields' door; the spoke now runs straight to `ring.b`                                                       |
| `grit.ring.q4`, `q6`                                        | the rim had four nodes between the spoke corners (the skeleton allows 1 to 3); `q3` and `q5` moved to the thirds of the stretch, Greatblade now enters at `q3`, Hammer Rhythm at `q5` |
| `grit.ring.q7`                                              | between the north spoke's corner and the border; `q8` moved halfway, Headsman now enters there beside Scar Tissue and Rooted Stance                                                   |
| `crushing.b`, `groundShaker.b`, `bulwark.e`                 | smalls beyond a notable that led nowhere                                                                                                                                              |
| `bulwark.a`                                                 | Mortar and Stone's bare attribute door; its armour small `c` is the door now                                                                                                          |
| `ironVoice.c`, `heavyHands.c`, `weight.c`, `bellows.c`      | four-node rings where the notable was two smalls from the door: now a chain of two smalls, the notable's price unchanged                                                              |
| `rhythm.b`, `ram.c`, `cairns.b`, `watch.b`, `thunderstep.c` | rings whose notable stood next to the door: now a triangle, price unchanged                                                                                                           |
| `locked.c`                                                  | Locked Shields' ring of four smalls is a ring of three                                                                                                                                |
| `gritPay.s2`                                                | Grit and Gravel's run to Scar Tissue had two smalls where one is enough (the Cathedral's Hymn run still lands on `s1`)                                                                |
| `unbroken.g3`                                               | the keep's approach from Hammer Rhythm had two smalls, now one                                                                                                                        |

Tried and undone: `home.spN.a` went too, but with the north spoke a step shorter Thunderstep, Barrow Ward, Sweeping Blow
and Aftershock all became dead ends within 8 steps. It stays as a small of the spoke's stat (melee area, what the slams
and the two-handers out along it want) instead of a bare attribute node, so the north spoke keeps its length. Steady
Hands' ring was trimmed and restored for the same reason. Kept: every corner and junction, the border road `radW` (the
Cathedral links into all three nodes), the seam paths (they hold the starts at 12), and `rim.q2` (two rooms). Weapon
notables are all at step 9 or later; the keystones at 9 (Unerring Discipline), 10, 12 and 14.

What moved closer: Steady Hands and Weak Spot 7 to 6; Mortar and Stone 9 to 8; Locked Shields 12 to 10; Shield Ram,
Broken Guard, Hallowed Hammer, Graven Posts, Standing Iron and Grit and Gravel 11 to 10; the keep (Unbroken 13 to 12,
Tempered 14 to 13); Iron Voice and Long Reach 14 to 12; Rooted Stance 14 to 12; Grave Host 15 to 13.

**Greatblade into Long Reach.** Kept, with a build: the two-handed sword cleaver wants Greatblade's sword damage and crit
multiplier and Long Reach's range and wider swing for the same heavy sweep. With the rim thinned the doors are `q3` and
`q5`: 7 steps through the rooms against the rim's 1.

**The keep's wheel** now lives in `wall/maces.ts`, the Bulwark's file (the axis at the mid ring), beside Shield Ram, its
spending room. Its ids changed from `wall.resists.unbroken.*` to `wall.maces.unbroken.*`. Every link into it was in the
Wall's own files: the four gate links moved with it. No other region links into it.

**Old Wounds' door.** A regeneration small (`home.secondWind.c`) now stands between Old Wounds and `centre.ring.road.i3`:
from the start, `i3` is 8 steps through Old Wounds against 7 by the seam road.

**A build reason for every join.** Every first-pass join's `why` now names who walks it:

| Join                                        | Who walks it                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| melee hub's life smalls → Oathbound         | every melee Vanguard who wants life with his steel                                                  |
| armour hub's resistances → Ox Hide          | the Vanguard who stands and takes the hit                                                           |
| Oathbound → Barrow Ward → Sweeping Blow     | the striker who mends between blows and wants an extra target                                       |
| Ox Hide → Mortar and Stone → Locked Shields | the armour stacker, then the armoured shield bearer                                                 |
| Weak Spot → Iron Lungs                      | the melee crit striker who runs on the mana his hits give back                                      |
| Old Wounds → centre                         | the Vanguard who lives on regeneration                                                              |
| Stagger → Aftershock → mid ring             | the slammer who stuns                                                                               |
| the keep's four gates                       | the warcrier and the mace fighter who build grit; the shield bearer and the two-hander who spend it |
| Grit and Gravel's door                      | the grit fighter who wants damage per charge without going out to Scar Tissue first                 |
| Warlord's Banner → Hallowed Hammer          | the aura bearer with an elemental mace, Vanguard or Zealot                                          |
| Sledge and Sinew → Brute Force              | the mace brawler who stacks strength                                                                |
| Greatblade → Long Reach                     | the two-handed sword cleaver                                                                        |
| Grave Host → Volatile Servants              | the summoner who wants both minion rooms of the corner                                              |

None was cut: each has a build.

**Rooms that hang by one entrance.** The mace, stun and fire rooms were swept first. Five new joins, no new node:

| Join                                                                                      | Who walks it                                                  | Through the rooms / road |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------ |
| Hot Iron → Bellows (Hot Iron's old tail small moved out past Crushing Blow as the bridge) | the fire attacker who ignites and swings wide                 | 6 / 2                    |
| Greatweight → Skull Crack                                                                 | the two-handed mace stunner who cracks the stunned            | 7 / 1                    |
| Weight of Iron → Heavy Hands                                                              | the two-handed mace slammer who swings faster for his grit    | 5 / 2                    |
| Plunder of Iron → Heavy Hands                                                             | the two-hander who earns grit on kills and spends it as speed | 5 / 1                    |
| Long Watch → Twin Cairns (its text always said it was in by Long Watch)                   | the totem planter                                             | 6 / 1                    |

The 16 left, each with its nearest related room within about three steps:

| Room                                                        | Nearest related room                                         | Why it stays apart                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Crushing Blow (mace crit)                                   | Weight of Iron                                               | already two road steps apart (`n1`, `spN.c`)                               |
| Broken Guard (stun gives grit)                              | Locked Shields (grit on block)                               | one road step apart (`ring.c`, `ring.b`)                                   |
| Headsman (axe, grit on stun)                                | Scar Tissue                                                  | off the same node (`q8`); Greatweight is across the rim                    |
| Steady Hands (accuracy, speed)                              | Weak Spot (melee crit)                                       | one spoke step apart                                                       |
| Standing Iron (armour while still)                          | Mortar and Stone, Rooted Stance                              | more than three steps                                                      |
| Graven Posts (totems)                                       | none within three: Long Watch and Twin Cairns are at the rim |                                                                            |
| Standing Cairns (totems)                                    | none within three                                            |                                                                            |
| Bulwark Spirit (regeneration per grit)                      | Grit and Gravel                                              | off the same node (`radW.m`)                                               |
| Vampiric Strikes (leech)                                    | none within three on the Wall's side                         |                                                                            |
| Ground Shaker (area, knockback)                             | Long Reach, Thunderstep                                      | far; the link to Plunder crossed the spoke in the first pass               |
| Elemental Ward (resistances)                                | Ox Hide                                                      | a room on the seam path near home; a join would only loop beside the start |
| Unerring Discipline, Unbowed Arm, Rooted Stance, Blood Rite | (keystones)                                                  | a keystone stays a spur                                                    |

Every other room has two ways in or more.

**The forms in plain words.**

- **The two towers** (the start): each side of the start has its own way out beside the middle. The striker's way runs
  through life smalls to Oathbound, the defender's through resistances to Ox Hide. They never meet, and each leads on to
  the rooms beyond.
- **The keep**: a wheel in the open middle between the mid ring and the rim, with no road to it. You walk in from a room
  that builds grit (warcries, mace hits) and out to a room that spends it (shield block, two-handed speed), crossing by
  Unbroken (more grit) or Tempered (resistances).

The stun run, the Grit and Gravel run and the room-to-room joins are chains of rooms beside roads. They are not claimed
as forms.

**Checks.** Geometry for the whole tree 0 crossings, 0 drawn over; reach 0 unreachable, no road dead ends; hung 0;
the Vanguard's dead-end notables within 8: 0; starts 12 12 from both neighbours; `ref-names` no matches. Against the
first-pass roads, the Wall has three new lines in the shortcut list, all from the shorter south spoke: `seams.s – spS.x`
(road 8, through clusters 7), `spS.x – i4` (9, 8) and `spS.x – j4` (10, 9). Each runs through the start's own paths
(Camp Stores on the seam path), the pattern the Knife and the Yard reported; no join is on any of them. Links across the
Wall's borders unchanged: zealot 8 (2 cluster to cluster), reaver 7 (1), centre 2. Render: `R2-wall.png`.

**Left open.**

- Some older room texts describe lines their notables no longer have (Bellows' "Hot Iron's partner is stun", Mortar and
  Stone's "the road to the tower leaves from it"). Left for the naming pass.
- The new smalls' values (`home.spN.a`, `secondWind.c`) wait for the flask-stats pass. Not registered or baked.

### The Cathedral (second thinning, 2026-10-31)

**227 nodes to 203** (24 removed, none added; 222 before the revision). 54 notables and 5 keystones, all kept.

| Removed                                                                                                                                | Why it could go                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `walk.ring.q3`                                                                                                                         | the rim between the two spokes (`n1`, `s1`) had three nodes; `q4` and `q5` moved to the thirds of the stretch. The procession and Faith Aflame now enter at `q4` (beside Rimed Steel's wheel), Searing Avatar at `q5` (beside Sexton) |
| `ambulatory.tithe.b`, `verger.c`, `brand.c`, `brand.d`, `crypt.rood.c`, `pyre.sexton.c`, `choir.hymn.b`, `nave.warding.b`, `warding.c` | smalls beyond a notable that led nowhere (Hymn still leads on to Hallowed Ground, Warding Staff to Whirling Ward)                                                                                                                     |
| `home.star.w`, `home.star.e`                                                                                                           | Litany's cold and lightning smalls, tails beyond the notable; its fire and chaos smalls stay because the ways in and on run through them                                                                                              |
| `walk.vespers.c`, `rim.brazier.c`, `pyre.procession.c`                                                                                 | the third small of a run where two do the work (Procession's second small still opens to Choir of Wrath)                                                                                                                              |
| `walk.peal.b`, `walk.tomb.b`, `walk.plainsong.b`, `rim.censer.b`, `rim.ossuary.b`, `ambulatory.kindled.b`, `choir.minionSustain.s2`    | the second small of a room at or past the mid ring, where one does the work                                                                                                                                                           |
| `walk.lightRule.s2`, `pyre.fireRule.s2`                                                                                                | the two rules' second smalls                                                                                                                                                                                                          |

Weighed and left, by count (no cut was undone): Hymn of War's first warcry small (`rim.hymn.w1`). Without it the way
into the Wall's grit run would be 4 steps against the rim road's 5, a shortcut. Not touched: the keystone spurs, the
wheels, the aisles (Buttress, Frozen Font, `warding.w2`), the seam paths and Lectern's two smalls, which keep the first
notables at 5. Also kept: every spoke and ring node (each is a junction), `walk.guard.b` (the Spire's `highVeil.x`
lands there) and `rim.volatile.a` (the Wall's Grave Host lands there). No other region's file changed.

What moved closer: most rooms past the mid ring by one step. Weapon notables: Gilded Rod and Quarterstaff 8 (unchanged), Warding Staff 9, Brazier 11 (it was 12), Verger 11. Keystones:
Idle Hands and Lone Vow 9, Sigil Warden 10, Searing Avatar 12, Volatile Servants 13.

Checks: geometry for the whole tree 0 crossings, 0 drawn over; reach 0 unreachable, no road dead ends; hung 0; the
Zealot's dead-end notables within 8: 1 (Lectern, as before); starts 12 12 from both neighbours; no Cathedral line in
the shortcut list, with or without the first-pass base; `ref-names` no matches. Links across borders unchanged
(vanguard 8, 2 cluster to cluster; mystic 7, 2; centre 1). `branching.ts` for the Zealot: loops within 10 / 15 / 20
steps 28 / 95 / 183; dead ends within 15 steps 40; mean links within 15 steps 2.48; notables behind each exit 39 / 54
of 128. The tree read 1,377 at the end, with the Knife, the Yard and the centre working at the same time. Render:
`R2-cathedral.png`. Not registered or baked.

### The Yard (second thinning, 2026-10-31)

**Counts.** 216 nodes (the start included) before, **197** after: 19 smalls cut, no node added, no road node cut. 52
notables and 3 keystones unchanged. 201 before the revision.

**Cut (19).**

| Kind                                                                       | Removed                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tails beyond a notable that led nowhere                                    | `dual.footwork.c`, `fosse.hewing.b`, `fosse.drill.c`, `blades.lasting.c`                                                                                                                                                                                                                                                   |
| A room's ring or wheel one small shorter, the notable's price unchanged    | `dual.twinFangs.d` (Off-Hand Parry still lands on `c`), `dual.hotBlood.c` (now a triangle), `dual.openVeins.b` (now a triangle; Hot Blood still lands on `c`), `blood.swing.c` (Full Swing to Paired Steel by one small), `blades.keenEdge.c` (a chain; Keen Edge stays at 8), `blades.lightBlades.c`, `shield.steelRim.d` |
| A room's second small of one stat, where the notable is at step 11 or more | `fosse.impalePay.s2`, `fosse.thirst.s2`, `fosse.fortify.s2` (Iron Skin's join now lands on `s1`), `fosse.stunPay.s2` (Wide Arc's join now lands on `s1`), `shield.blockMana.s2`, `shield.mending.s2`, `fosse.drill.b`, `fosse.bloodied.b`                                                                                  |

**Tried and undone.** `blades.mail.c` and `dual.impale.c` (tails) and `blood.redHarvest.c` (ring to triangle): each made
its notable (Mended Mail 7, Spitting Blade 8, Red Harvest 8) a dead end within 8 steps. All three are back.

**Left alone.** The home rooms and Answering Steel's approach (shortening the court or the seam paths is where a new
cluster line would appear); anything that brings Keen Edge, Spitting Blade or Off-Hand Parry inside 8; the keystone
spurs (9, 9, 10 against a floor of 8); the fervour run (`hotBlood.f2`, `f3`), which keeps the Bow's Killing Eye way in
slower than the rim; Four Winds' four smalls; the rooms at step 10 that keep two smalls (Sword and Board, Iron Skin,
Footwork, Lasting Wounds). No road node is left to take: every one is a corner, a junction, an entrance or a Wall
landing (`radW.*`, `s0`, `seams.s`). Every incoming link from other regions still lands.

**What moved closer.** Red Thirst, Crushing Swing, Steady Guard and Bulwark Mending 11 to 10;
Drill Call, Run Through, Bloodied Edge and Hold the Line 12 to 11. Nothing reached step 8.

**Checks.** Geometry for the whole tree 0 crossings, 0 drawn over; reach 0 unreachable, no road dead ends; hung 0; the
Reaver's dead-end notables within 8: 1 (Wanderer, the Bow's, as before); starts 12 12 from both neighbours; the
shortcut list against the first-pass base has no new Yard line (its two new lines are the Knife's); `ref-names` no
matches. The tree read 1,365 at the end, with the Knife, the Cathedral and the centre working at the same time. Render:
`R2-yard.png`. Not registered or baked.

### The centre (finalization, 2026-10-31)

**Undone after the final review:** the six hexagon side nodes were put back. Cutting them brought starts two apart and
opposite from 18 and 20 steps to 17 and 18 (the reference 22 and 26), the spacing the owner asked to follow the
reference on. With them back the spacing is 18 and 20 again; the centre's distances are those of its first-pass note.
The thinning below is kept as the record of what was tried.

**Thinning.** The six hexagon side nodes (`centre.ring.road.h0`–`h5`) are gone; each side of the inner ring is now one
long link from junction to junction. Each side node was a bare two-link attribute node sitting on the straight chord
between its two junctions (no corner, no junction), and no build walked a hexagon side for its attributes. No other
region linked into them. The supply lost: one class's attributes (+6/+6 or +7) under each start. Nothing else was cut:

- **The six inner road nodes `i` stay.** `i2`, `i3` and `i4` carry the region doors (Field Dressing, Old Wounds, Litany),
  so they are junctions. Cutting only `i0`, `i1` and `i5` would shorten the Mystic's, the Shade's, the Strider's and
  the Zealot's borders and not the Reaver's or the Vanguard's.
- **The spokes `s1`, `s3`, `s5` and the middle `m` stay.** They are junctions of four to five links.
- **The yoke arms stay.** Without them a yoke notable would sit one link from each spoke beside it, and spoke to spoke
  through it would be 2, as fast as the road by the middle. With them it is 4 against 2. Measured and reverted.
- **The rooms' door smalls stay.** A notable straight on a junction is no longer a room.

The centre: **44 nodes before, 38 after** (16 road, 22 in rooms). 8 notables before and after, no keystones.

**A build reason in every join.** Each first-pass join's `why` now names the build that walks it. Every step count was
redone for the thinner ring:

| Join                       | The build that walks it                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Firm Footing's arm to `s1` | the melee who lives on life on hit (Hard Living) stands in the press, where a stun costs most                 |
| Firm Footing's arm to `s5` | the caster who caps resistances at Shelter and still loses casts to stuns                                     |
| Waste Not's arm to `s1`    | the pack clearer who lives on kills: Hard Living's life on kill, Waste Not's mana on kill                     |
| Waste Not's arm to `s3`    | the skill spammer short of mana, on to Provisions' mana regeneration at the middle                            |
| Quick March's arm to `s3`  | the build that walks through poison and bleed (Sound Body) wants the legs to leave the ground                 |
| Quick March's arm to `s5`  | the kiting caster capping resistances at Shelter                                                              |
| Hard Living's door to `s1` | the attacker who lives on hits and kills, on to stun protection, mana on kill or the middle                   |
| Sound Body's door to `s3`  | the ailment-proof build, on to movement or the middle's life and flasks                                       |
| Shelter's door to `s5`     | the resistance capper (the Zealot in from Litany among them), on to life, chaos resistance or stun protection |

**Rooms with one entrance.** Only the middle's two:

- **Provisions** (flasks, mana regeneration). Its nearest related rooms within three steps are Waste Not (mana on kill,
  cheaper skills) and Hard Living (life on kill).
- **Well Rounded** (attributes, life). Its nearest related rooms are Quick March and Sound Body, and Shelter (life with
  resistances).

Neither is joined. Each join was measured with a virtual small in a scratch run. Each one makes its pair 2 cheaper for
exactly the two classes whose cell holds that room, and 1 cheaper for the classes beside them. Examples: Quick March and
Well Rounded drop from 14 to 12 for the Vanguard and the Zealot; Provisions and Waste Not from 14 to 12 for the Strider
and the Reaver. Each join would also be a way to the middle as fast as the spoke (notable, small, the middle's room,
the middle: 3, the same as the arm and the spoke). There are two middle notables and three cells, so no set of joins is
fair. A third middle notable (R-centre §7) would allow one join per cell; it stays the owner's question. All the other
junction rooms have two or three ways in.

**The forms, in plain words.**

- _The yoke:_ at a junction without a spoke, the notable room is a back door to the middle. You come in from your
  junction, take the notable, and leave by a short arm to either spoke beside it. It is two steps slower than the road
  round, but you get a notable on the way.
- _The inner door:_ at a junction with a spoke, the notable room opens onto that spoke and nothing else. It is a slower
  way to the middle that pays a notable.
- _The bare hexagon:_ the ring joining the six junctions is one long link per side, so a pair's junction is one step
  from the next pair's.

**The fairness, measured** (steps from each start; before → after; `--pairs` in a scratch script):

|                          | Mystic  | Shade   | Strider | Reaver  | Vanguard | Zealot  |
| ------------------------ | ------- | ------- | ------- | ------- | -------- | ------- |
| Shelter                  | 10      | 12 → 11 | 12      | 12      | 12 → 11  | 10      |
| Firm Footing             | 10      | 10      | 11      | 13 → 12 | 13 → 12  | 11      |
| Hard Living              | 12 → 11 | 10      | 10      | 12 → 11 | 12       | 12      |
| Waste Not                | 13 → 12 | 11      | 10      | 10      | 11       | 13 → 12 |
| Sound Body               | 12      | 12      | 12 → 11 | 10      | 10       | 12 → 11 |
| Quick March              | 11      | 13 → 12 | 13 → 12 | 11      | 10       | 10      |
| Well Rounded, Provisions | 12      | 12      | 12      | 12      | 12       | 12      |

Every class now sees the same set of junction distances: its own two at 10, then 11, 11, 12, 12 (before: 10, 10, 11,
12, 12, 13). The farthest centre notable is 12 for everyone, the middle's two included. Per notable, the spread between
classes is 2 at most (3 before for Firm Footing, Waste Not and Quick March). On any pair of centre notables it is 2 at
most, as before. Each class's own two junction notables still cost the same together for every class. Neighbouring
starts are 12 apart, all six pairs.

**Routes against roads.** From a junction to a spoke, a yoke takes 4 steps against the road's 2. An inner door takes 3
against 1. Spoke to spoke through a yoke takes 4 against 2 by the middle. The region doors are unchanged: Old Wounds,
Litany and Field Dressing each land on their `i` at 8 against the seam road's 7. In the shortcut list against the
first-pass base, every line that names a centre node starts in a region. Two are new, both from
`knife.edge.spS.a` (to `j0` and `j2`). Their cut is the Knife's own: from `spS` to its south seam through Soft Step and
the star, 6 against the road's 7. The centre only brought the two junctions inside the list's ten-step window, because
the ring got shorter for the road and the cluster route alike.

**Checks.** Geometry for the whole tree: 0 crossings, 0 drawn over. `reach.ts centre`: 0 unreachable, no road dead ends.
Hung behind a notable: 0. `ref-names`: no matches. The tree read 1,365 nodes when last checked, with the other builders
working at the same time. Render: `R2-centre.png` (`--box -1600,-1600,1600,1600 --no-areas`). Not registered or baked.

### The Knife (second thinning, 2026-10-31)

**Counts.** 253 nodes before, **235 now** (18 removed, none added; 244 before the revision). Notables 65 and keystones 4,
unchanged. No road node went.

**Cut (18 smalls):**

| Removed                                                                            | Why it could go                                                                                                                    |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `rim.glint.c`, `roofs.feint.w1`, `snares.rake.c`, `roofs.wish.k1`, `roofs.salt.c1` | tails: one small past a notable, leading nowhere                                                                                   |
| `snares.tumble.a`                                                                  | Tumble had two ways in of the same length from the mid ring. It now enters through Cutpurse's Luck's first small                   |
| `edge.wheel.w7`, `venom.wheel.v7`, `snares.wheel.t7`                               | one small from each wheel (Fine Point, Rookery, Trapper). Talon, Barbed Point and Trapper now meet the far junction small directly |
| `roofs.athame.e1`                                                                  | the dagger wheel: Long Knives now stands next to the door (`t`), and Athame is one small past it                                   |
| `home.breath.e1`, `home.cloak.v1`                                                  | the second small of each seam run behind the two doors                                                                             |
| `edge.steadyEye.x1`                                                                | the crit run's second small. Spoke to mid ring through Steady Eye is 4 steps against the spoke's 3                                 |
| `hex.wiry.l1`, `hex.ward.e1`, `edge.frost.k1`, `roofs.ribs.d1`, `roofs.hasty.b`    | a room's second (or, for Split Light, third) small of one stat                                                                     |

What moved closer: Frost Snare and Shifting Ward 10 to 9, Wiry Frame and Between Ribs 11 to 10, Split Light 14 to 13.
Weapon notables are all still at step 8 or later.

**Tried and undone:** `home.quick.c`, the blade's second attack speed small. Without it Quiet Knife became a dead end
at step 8, because the blade's tip reached it as soon as its own small did. Kept, and the blade stays four steps slower
than the spokes.

**Considered and left:** the spokes and the blade's first nodes, because a weapon notable would land inside 8. The
Thick Blood, Low Tide and `radN.a` lane is level with the road, and one cut there would be a shortcut. The rim ring:
`q1` and `q2` carry Long Grudge's loop, `q7` and `q8` together would leave four rooms on one node, and the stretch
between the corners is already at the skeleton's 3. Snakeskin's star (one resistance per element) and the keystone
approaches stay as they are.

**The centre builder's shortcut** (`edge.spS.a` to `centre.ring.road.j0` and `j2`). It was real: spoke to the Bow seam
through Snakeskin's star, its link to Soft Step, and Soft Step, 6 steps against the road's 7. The first finalization
caused it when it removed `home.spS.a`. That link (`star.s` to `softStep.n`) had no build reason, so it went
(`star.s` is a tail of the star now). The spoke reaches the seam through the start's own south path in 7, level with
the road, and both pairs left the list. Against the first-pass base, the Knife pairs still listed are the hub, spoke
and seam pairs the finalization note already covers: the start's own stat paths.

**Checks.** Geometry for the whole tree: 0 crossings, 0 drawn over. `reach.ts shade`: 0 unreachable, no road dead ends.
Hung 0. Starts 12 from both neighbours. First own notable 5. Dead ends within 8: Swift Incantation only (as before).
No new shortcut against this round's own starting point. `ref-names`: no matches. Re-rendered `R2-knife.png`. Not
registered or baked.

## 8. Settled by the owner (2026-10-31)

- **The node budget:** the count may rise; roads are thinned a little where a cluster route now does a road's work.
- **The notable count:** may grow a little, where a new cluster is better with its own notable.
- **Starts may differ in shape** (for example three exits, or a fork at another step), keeping about six directions by
  the third point and the strong first small (CONSTRAINTS §16 items 8 and 9). This amends §1's "two exits, each forking
  at step 2" from a rule for every start to the default.
- **Cluster links cross borders too:** clusters near a border may link to the neighbour's clusters.
- **A V whose notable leads on is acceptable** (after the first pass): the Knife's blade, the Spire's crossing and the
  Yard's court may keep the V's outline.
- **The first pass grew too much** (1,383 to 1,487 nodes, no road thinned): finalization thins roads to bring the count
  noticeably back down. The owner gave no number.

- **After the final review:** starts two apart and opposite stay at 18 and 20; the centre gets a third middle notable
  (built: Common Ward, defences and mana, under the Mystic and the Shade; each middle notable now joins its cell's yoke by
  one small, 4 steps from the middle against 3 by the spoke; every class reaches all three middle notables in 12, and
  the junction notables at 10, 10, 11, 12, 12, 13); about 1,350 nodes is right, leaving room to add clusters later
  (1,358 after the third notable).

## 9. Open, for the owner

Nothing yet.

## 10. Finalization: the first-pass review's findings

The reviewer's review of the first pass (a9334ac), with the owner's two answers (§8). Items 1 and most of 4 were approved;
these are what finalization does.

**Every region:**

- **Thin the roads** so the node count comes noticeably back down (§8). A road node goes where a cluster route now runs
  beside the road and does its work, and on long straight runs where a node earns nothing. Keep a node on every corner
  and every junction, keep the starts about 12 apart, and keep every cluster route slower than the road beside it.
- **A build reason for every join.** Each new link's `why` says which build walks it. A join described only by its
  shape gets a reason or goes.
- **Rooms that hang by one entrance:** list each with its nearest related cluster within about three steps, and join
  only where the relation is real (no link just to raise a count). The list goes in the region's finalization note.
- **Forms in plain words:** the region's note says each form as a player would see it, in a line. A chain of rooms
  beside a road is not claimed as a distinct form.

**By region:**

- **The Bow:** walk the middle exit as a player and confirm it is a real direction (2 notables behind it). Supply Line
  and Second Wind's joins need a build reason.
- **The Spire:** the Wandwork to Fire and Frost join needs a build reason.
- **The Wall:** Greatblade into Long Reach needs a build reason. The keep's wheel is defined in `resists.ts` but stands
  in the axis cell: move it to the area file of its place (its id changes with its area: fix every link), or say why
  not. Old Wounds' door to the centre is as fast as the seam road: one small before it. Sweep the mace, stun and fire
  rooms first.
- **The Cathedral:** each hub runs through two bare attribute nodes before any small (CONSTRAINTS §16 item 9): give
  those spokes useful smalls or link a hub into the nave, without rebuilding a road that meets at Zeal. Litany's door to
  the centre is as fast as the seam road: one small before it. Lectern's door exists for the shape's sake: give it a
  build reason or cut it.
- **The Yard, the Knife, the centre:** the every-region items only.
