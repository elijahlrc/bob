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

| Notable | Was behind | Now |
| --- | --- | --- |
| Quick Wrists | Keen Instinct (a wheel entered only through it) | on the blade, reached from the mid ring end too |
| Low Tide | Spoils | the crossroads of the mana alley: Spoils, the north border road, Thick Blood |
| Deep Reserves | Hoarded Breath | the north's mana door, off the small before Smuggler's Flasks |
| Ward of Smoke | Grey Cloak | the south's resistance door, off the small before Deft Guard |
| Fan of Blades | Quiet Shot | a sibling of Quiet Shot off the bow small (Quiet Shot moved aside), on to Cutpurse's Luck |
| Twin Shadows | Tumble | on the Tumble alley, a dual-wield small after Tumble, on into Veiled Herald's run |
| Smeared Edge | the Trapper wheel's notables | on the Gutter; and the wheel has a second entrance from Frost Snare's trap small |
| Rust and Ruin | Carrion Claws | the Gutter's end, leading on into Carrion Claws |

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

| Notable | Was behind | Now |
| --- | --- | --- |
| Ward Renewed | Quickening | the recharge floor, three recharge smalls from the west spoke (step 7), on to Quickening |
| Surging Tide | Siphon | the crit floor, spell crit from the east spoke (step 7), on by a shield-on-hit small into Siphon |
| Iron Litany | Composure | the mid floor, off Composure's last small, by a shield small to Slow Burn's crossroads |
| Hail of Sparks | Wand Volley | the mid floor, a wand small from Slow Burn's crossroads, on through Wand Volley to the east spoke |
| Rime | Hoarfrost | off Hoarfrost's far small, on into Broad Weave (cold to area, slower than the mid ring) |
| Conductor | Live Current | lightning's ladder, off the ring's small, on into Needlework |
| Warm Hearth | Cinder | fire's ladder, off Cinder's far small, by a burning small into Kiln Heart |
| Bound Host | Familiars | the border climb, minion smalls from the mid ring (Familiars' smalls made a triangle so the climb can pass it by) |
| Moonward | High Veil | the climb's crossroads: off High Veil's small, down by mana to Bound Host, across the border |
| Hexed Pack | Bad Company | the climb past the rim, off the ring's small, by a mana small into Overflow |

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

| Notable | Was behind | Now |
| --- | --- | --- |
| Hard Target | Hawk's Eye (a room entered only through it) | the end of the middle exit's south arm (step 5), on by two life smalls into Hunter's Rush |
| Kiting Snares | Tripwire | on a trap run from the trap room's second small to the mid ring (`ring.a`); Tripwire goes the other way, on to Frost Fletching |
| Hunter's Fervour | Hot Pursuit | its own room of crit smalls from the rim node `q6` (Steadfast Aim's old place), on by a fervour-duration small into Hot Pursuit: fervour earned on crit in one room, spent in the other |
| Braced Guard | Round Shield | between Round Shield's first small and Fleet Blade's room: sword and board, a way across from the shield room to the sword room |
| Second Wind | Hardy Stock | a life small past Hardy Stock, and its own door on the south border road: the room is a way across from the mid ring to the border road |
| Supply Line | Field Kit | a flask small past Field Kit and on by another to the rim node `q7`: a loop out past the rim between two ring nodes |
| Grim Tally | Killing Eye | on a run of cost smalls down from Bright Shafts' room, joined to Killing Eye by its finishing small |

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

| Notable | Was behind | Now |
| --- | --- | --- |
| Momentum Swing | Full Swing | the opening round, off the wheel's two-handed small (not Full Swing), on by a stun small to Measured Cut |
| Measured Cut | Fencer's Eye | a crossroads of the opening round: Momentum Swing above, Fencer's Eye's entrance small, Shield Bash beside |
| Crimson Reaping | Red Harvest | off Red Harvest's far small, on by a mana-leech small to Banner Guard (the blood run) |
| Banner Guard | Standard Bearer | the blood run: up from the standard's entrance small (Standard Bearer is its sibling there), on to Crimson Reaping |
| Duellist's Fervour | Hot Blood | the fervour run, out of Hot Blood by a fervour small and on by two dual smalls into Crossed Blades |
| Bloodied Pursuit | Open Veins | off Open Veins' entrance small, on by a leech small into Red Thirst |
| Wide Arc | Hewing | outside the rim, Hewing → an axe small → Wide Arc → a two-handed small into Crushing Swing's room |
| Rally | Drill Call | off Drill Call's entrance small, on by an armour small to Hold the Line; it replaces the old Hold the Line–Drill Call link |

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

| Notable | Was behind | Now |
| --- | --- | --- |
| Grit and Gravel | Scar Tissue (a room entered only through it) | its own door by a small on the border road's mid ring junction (`wall.resists.radW.m`, where the keep's wheel stood), on by its smalls to Scar Tissue and the rim (q8): a run from the mid ring to the rim along the Cathedral border, spend then earn, slower than the roads round. Step 16 to 11. |
| Aftershock | Thunderstep (one step past it, nothing beyond) | the crossroads of the stun run: in from Stagger by a stun small or from Thunderstep's area small (b), out to the mid ring (`wall.slams.ring.a`). Its link to Thunderstep's notable went. |

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

| Notable | Was behind | Now |
| --- | --- | --- |
| Steadfast Faith | Iron Faith | the shield aisle: Frozen Font's shield-block smalls (a bypass link past the font) into it, on into the wheel's shield small `n7`; its link to Iron Faith went |
| Whirling Ward | Warding Staff | the staff aisle: Buttress's smalls (a bypass past Buttress) and two new staff spell-block smalls into it, on into Warding Staff and the mid ring |
| Hallowed Ground | Reliquary | the shrine's door small runs through to its far small (a bypass past Reliquary), a totem small to Hallowed Ground, on into Hymn (lightning's first home): the caster who plants a totem and calls lightning; its link to Reliquary went |
| Choir of Wrath | Benediction | off Procession's second aura small (its own way in from the rim, `q3`), on into Benediction and the Rimed Steel wheel |
| Ember Litany | Kindled Steel | two new fire-attack smalls in from the rim node `n1`, on into Kindled Steel and the spoke junction: the fire striker's way between the spoke and the rim's fire (Brazier, Censer) |
| Hymn of War | Battle Hymn | off Battle Hymn's entrance small (not the notable), on by two warcry smalls across the Wall border into the Grit and Gravel run (below); its link to Battle Hymn went |
| Staff of Judgement | Crozier | a new staff small off Crozier's second small, on by a lightning small into Faith Unleashed; its link to Crozier stays (both ends now have other ways in), so Crozier leads on too |

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

**The forms** (item 3). The centre is the ground every class walks *into*, so its form makes every room a way inward:

- **The yoke.** The three junctions with no spoke (Mystic–Shade, Strider–Reaver, Vanguard–Zealot) each had a room hung
  off a dead corner of the hexagon. Each room is now a yoke: its door outside on its junction, and from the notable one
  small of the room's own stat to *each* of the two spokes beside it (Firm Footing to s1 and s5, Waste Not to s1 and s3,
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

| | Mystic | Shade | Strider | Reaver | Vanguard | Zealot |
| --- | --- | --- | --- | --- | --- | --- |
| Shelter | 10 | 12 | 14 → 12 | 14 → 12 | 12 | 10 |
| Firm Footing | 10 | 10 | 12 → 11 | 14 → 13 | 14 → 13 | 12 → 11 |
| Hard Living | 12 | 10 | 10 | 12 | 14 → 12 | 14 → 12 |
| Waste Not | 14 → 13 | 12 → 11 | 10 | 10 | 12 → 11 | 14 → 13 |
| Sound Body | 14 → 12 | 14 → 12 | 12 | 10 | 10 | 12 |
| Quick March | 12 → 11 | 14 → 13 | 14 → 13 | 12 → 11 | 10 | 10 |
| Well Rounded, Provisions | 12 | 12 | 12 | 12 | 12 | 12 |

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
with or without the door. But only Field Dressing is *slower*, as item 4 defines the trade. Old Wounds, Litany and
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

## 8. Settled by the owner (2026-10-31)

- **The node budget:** the count may rise; roads are thinned a little where a cluster route now does a road's work.
- **The notable count:** may grow a little, where a new cluster is better with its own notable.
- **Starts may differ in shape** (for example three exits, or a fork at another step), keeping about six directions by
  the third point and the strong first small (CONSTRAINTS §16 items 8 and 9). This amends §1's "two exits, each forking
  at step 2" from a rule for every start to the default.
- **Cluster links cross borders too:** clusters near a border may link to the neighbour's clusters.

## 9. Open, for the owner

Nothing yet.
