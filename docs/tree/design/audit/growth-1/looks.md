# G4 audit round 1: looks

Auditor for CONSTRAINTS §11 (area labels ignored, as the user asked) on the grown network of commit 3b2affe (1,389 live
nodes, 1,685 links; `edits.json` empty). Read only: nothing in `src/`, `scripts/` or the plan docs was touched.

**Pictures** (all in [looks/](looks/)): `whole.png` and one per region (`mystic.png` … `reaver.png`, each with the
centre); `quads/<region>-{nw,ne,sw,se}.png`, every region in four close-ups; and the evidence close-ups with every
node's id: `cu-strider-home-ids.png` (and `cu-strider-home.png` without ids), `cu-vanguard-zealot-seam.png`,
`cu-vanguard-home-south.png`, `cu-vanguard-crushing.png`, `cu-reaver-shieldwall.png`, `cu-strider-rim.png`.

**Measures** (scratch scripts, not in the repo):

- `geometry.ts --bends`, whole tree: **0 crossings, 0 drawn over, 83 bends over 20°** (73 after the layout pass, 83
  after G2–G3). Nearly all of them are corners of regular shapes (45° octagons, 60° hexagons, 72° pentagons, 90°
  squares).
- Junctions (three or more links) where two links leave less than 40° apart: 64. Of these, 16 are under 30°, and the
  rest are mostly the centre ring's even 38° fans.
- Link length: median 108 and quartiles 70 / 242. Within 1,100 units of each start, **the Strider has 9 links over
  350 units**. The other homes have 1 (Mystic, Vanguard), 2 (Zealot), 3 (Reaver) and 5 (Shade, most of them its
  outer roads).
- Density by radius from the centre: every band from the starts to radius 4,250 holds 16 to 37 nodes per million
  square units, so there is no moat round the starts. By region, the Strider's band at radius 3,500 to 3,750 holds 5
  nodes; every other region holds 16 to 25 there.
- Largest empty discs clear of nodes and links, inside 90% of the outline: three of the four largest that are not on
  the rim are in the Strider (r 367 by Field Kit and `j6`, r 344 by `j7`, r 323 by `middleSpoke`). One is on the
  Vanguard–Zealot seam (r 324 at -1505,-25).

---

## 1. Findings, most important first

### 1. Must fix: the Strider's home is long rays and near-miss fans, not clusters on roads

**Where.** The Strider's home is the area between the start, the bow roads and the flight roads (`cu-strider-home-ids.png`,
`quads/strider-nw.png`). It is the region's first 3 to 8 steps, which every Strider build and every neighbour coming
in passes through (§6.1).

**What is wrong.** A small node or road node there throws two or three links of 350 to 620 units, at angles that
nearly coincide:

| node                  | links | the problem                                                                                                                                                                                       |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bow.bows.road.jb4`   | 4     | The Steady Draw spur (`steadyDraw.a`) and Tripwire's chain (`tripwire.a`, 349) leave **17°** apart.                                                                                               |
| `bow.string.road.s2`  | 6     | Quick Hands' chain (`speed.a`, **547**) and Hard Target's (`hardTarget.d`, **596**) leave **20°** apart. Weathered's (`n418`, 366) leaves 36° from them.                                          |
| `bow.home.life.a`     | 4     | This is Long Breath's own life small. Two spokes leave it **26°** apart, `n435` (Light Hand, **569**) and `n437` (Round Shield, 370), and they draw two long near-parallel lines across the home. |
| `bow.home.hubs.n`     | 4     | It links to `bow.bows.road.jb3` with one link of **623**, where every other home lays a hub road of 2 or 3 road nodes.                                                                            |
| `bow.steel.hub.t`     | 5     | Links of **622** (`n409`, beside Wayfarer) and **502** (`n442`, Weathered).                                                                                                                       |
| `bow.home.added.n413` | 3     | This is Vital Aim's crit small. It has a **427** link to Weathered's `n424`, plus a dead-end tip `n414` hung off it at an angle.                                                                  |

Together they make the parallelogram mesh in the picture: Long Breath, Light Hand, Round Shield, Wanderer, Hard Target
and Quick Hands are joined by long thin lines with clusters at their ends. The rules this breaks:

- §11.5 "roads keep their lines … not a near-miss" at `jb4`, `s2` and `life.a`.
- §11.5 "the room goes on the links between clusters", which here are links between smalls.
- §7.2 "most clusters branch off an attribute road": in this area most clusters hang off each other's smalls.

No other home looks like this.

**Fix.** Re-lay it by hand. The first moves:

1. **Rotate the Steady Draw spur about `jb4`** so `steadyDraw.a` leaves at about 50° from both of its neighbours,
   for example `steadyDraw.a` at about (2055,242) and the keystone at about (2040,158). The spur must stay a dead
   end of one small (§9.1).
2. **Rotate Quick Hands about `s2` by about +9°** (`speed.a` at about (1665,1257), `qh` at about (1706,1313)). The
   fan Hard Target / Quick Hands / Weathered then runs 26° / 54° / 83°, an even fan.
3. **Shorten the north hub link without adding steps.** Pull `jb3` and what hangs off it (Elemental Fletching's
   ring, the Shade crossing `toKnife`) inward toward `hubs.n`, so the 623 link shortens with no new node.
   Laying 2 or 3 road nodes on that link instead, as other homes have, would add 2 or 3 steps to every path north
   of `jb3` (Elemental Fletching, Tripwire, Steady Draw, the Shade crossing). That raises tax, which Stop 1 target 5
   forbids, in a region whose road share is already a third (G1 Strider brief). Take that route only if the Builds
   auditor shows the tax stays under a third.
4. **Unpick the `life.a` double spoke.** Either:
   - turn Round Shield's chain (`n437`, `n438`) to enter from `s2`'s north side, or
   - cut `life.a`–`n437`, so Round Shield is reached from Light Hand (`n434`–`n429`) and from Wanderer.

   The cut is a network change: Round Shield moves about two steps farther from the start (G1 Strider brief,
   question 4), so the Network and Starts auditors must agree to it.

5. **Lay `n414` on the line** from Vital Aim through `n413`, or fold it into the chain toward Weathered.
6. **Shorten the `hub.t` spokes (622 to `n409`, 502 to `n442`) without adding steps.** Bring `hub.t` and the
   Footwork pocket beside it north toward Wayfarer and Weathered, or move those two clusters south toward `hub.t`.
   A road node on either link would cost every path through it a step, which is a tax trade for the Builds auditor
   to approve first, as in item 3.

**What a fix must not break:**

- §6.3 to §6.5: nothing within three steps names a weapon, and the first notables stay 3 or 4 points out.
- §4.8: the home keeps offence and defence mixed.
- §3.5: Light Hand, Round Shield, Wanderer, Hard Target and Quick Hands each keep two ways in.
- §15.9: the user's hand edit gets no deference, but the result is shown to them before baking.
- Stop 1 target 5: no new road steps unless the Builds auditor approves the tax (items 3 and 6).

### 2. Must fix: Wanderer's own small is drawn beside Round Shield

**Where.** `bow.flight.added.n433` (allAttr), Strider (`cu-strider-home-ids.png`, "ADDED.N433").

**What is wrong.** Wanderer's attribute small sits 59 from Round Shield's block small `n429` and **232 from Wanderer**,
so a player reads it as the third small of Round Shield. That breaks §11.5: "a cluster reads as one … every small
beside the notable and the rest of the distance on the link out".

**Fix.** Move `n433` to about (2090,834), 70 from Wanderer on the line toward `n429`. The 230 units go on the link
`n433`–`n429`. No link changes.

### 3. Must fix: the Vanguard's north hub fans two chains 21° apart, and Warlord's Banner is strung out across the seam

**Where.** `wall.home.hubs.n`, `wall.home.ringing.*` (Ringing Blows) and `wall.resists.banner.*` (Warlord's Banner),
on the Vanguard–Zealot seam, 2 to 4 steps from the Vanguard start (`cu-vanguard-zealot-seam.png`).

**What is wrong.**

- From `hubs.n`, Ringing Blows' chain (`ringing.a`, 224°) and the banner chain (`banner.a`, 245°) leave **21°**
  apart. `ringing.a` lies 45 from the `hubs.n`–`banner.a` link.
- Ringing Blows also links `banner.a`, so `hubs.n` → `ringing.a` → `ringing.b` → Ringing Blows → `banner.a` →
  `hubs.n` is a thin sliver.
- Warlord's Banner's two reservation smalls are strung along the seam at **175 to 184** apart (`banner.n`–`b` 175,
  `b`–`a` 179, `a`–`hubs.n` 184). They read as a road, not as Banner's cluster.

This breaks the §11.5 bullets on clean junction angles and on a cluster reading as one.

**Fix (positions only):**

1. Compact Banner's smalls beside it, on the line toward `hubs.n`: `banner.b` at about (-1219,-167), `banner.a` at
   about (-1194,-118). The long link becomes `banner.a`–`hubs.n`.
2. Rotate Ringing Blows' chain about `hubs.n` to leave at about 207°: `ringing.a` at about (-1109,200), with
   `ringing.b` and the notable on the same line. The three west links of `hubs.n` (`roadR.a` 170°, Ringing about
   207°, Banner about 243°) then form an even fan about 36° apart.
3. Check that Ringing Blows' links to `roadR.a` and `banner.a` still clear the chains, with `geometry.ts`.

If the sliver still reads badly, cut `ringing.n`–`banner.a`. Banner keeps two ways in (`hubs.n` and the Zealot's
`cathedral.home.hubs.w`), but the network auditor must agree.

**What a fix must not break:**

- §4.8: Ringing Blows is the home's offence at 4.
- §3.7: Banner is a crossing to the Zealot hub; keep that link.
- §6.5: the first notables stay 3 or 4 out.

### 4. Must fix: south of the Vanguard start, a ladder of slivers (Quartermaster, roadS, Thunderstep)

**Where.** `wall.home.hubs.s`, `wall.home.quartermaster.*`, `wall.home.roadS.a/b` and `wall.slams.thunderstep.a/b`,
2 to 6 steps from the Vanguard start (`cu-vanguard-home-south.png`; `quads/vanguard-ne.png` bottom right).

**What is wrong.** Two near-parallel paths run from `hubs.s` to `thunderstep.a`: Quartermaster's chain with its notable,
and the road `roadS.a`–`roadS.b`. A rung (`quartermaster.n`–`roadS.a`) joins them. Every angle in the figure is a
near-miss:

- 28° at `hubs.s`;
- 26° at Quartermaster, where `quartermaster.b` lies 30 from the notable's link to `roadS.a` (the closest
  node-to-link clearance in the tree);
- 25° at `thunderstep.a`.

`thunderstep.b` then fans five links (Bracing at 368, Unhurried at 358, the Yard at 224) across the border. A player
sees a cat's cradle at the start.

**Fix.** Swing the Quartermaster pocket west into the empty sector of `hubs.s`, which has nothing between 131° and
278°:

- notable at about (-1300,880);
- smalls on the line from `hubs.s` toward it (about 55 to 70 from the notable);
- links unchanged.

The chain then leaves `hubs.s` at about 156°, so the hub's gaps become about 53 / 122 / 57 / 128. Quartermaster–
`roadS.a` runs nearly level, and Quartermaster–`thunderstep.a` runs straight down (40° from `roadS.b`). Check the
result against `roadM.a`/`roadM.b`, about 250 to the north-west, with `geometry.ts`.

**What a fix must not break:**

- §6: Quartermaster is the start's flask porch and stays a bridge (§3.6).
- §3.7: Thunderstep's border links to the Yard stay.

### 5. Should fix: two near-parallel links into Crushing Blow's small

**Where.** `wall.maces.crushing.a`, Vanguard west (`cu-vanguard-crushing.png`).

**What is wrong.**

- The Hymn road's `toHymn.r1` and the Stagger road's `toStagger.a` arrive **22°** apart at `crushing.a`, a crit
  small of Crushing Blow that doubles as a four-link junction.
- `toStagger.a` also bends 42° and `toHymn.r1` bends 32°. Both are on `geometry.ts`'s bend list.

**Fix.** Remove the bare road node `toStagger.a` and link `wall.rampart.stagger.a` straight to `toHymn.r1`, which
becomes a junction: the Stagger road then joins the Hymn road before Crushing Blow.

- Stagger to `crushing.a` stays 2 steps.
- Two bends and the 22° near-miss go.
- But Stagger to the Hymn road becomes 2 steps shorter (4 → 2). Network and specializations must check that this
  shortcut does not make a one-stop shop (§5.5).

A positions-only alternative, with no shortcut: move `toHymn.r1` to about (-3444,522) so the road leaves
`crushing.a` at about 240° (gaps 60 / 61 / 79 / 160), at the price of one bend at `r1` on a straight road.

### 6. Should fix: the Strider's outer band is the one deliberately sparse band on the map

**Where.** The Strider's outer road `bow.rim.road.*` from `j2` to `j8`, with its spokes (`cu-strider-rim.png`,
`quads/strider-ne.png`, `quads/strider-se.png`).

**What is wrong.**

- The Strider has 5 nodes between radius 3,500 and 3,750, against 10 to 32 in every other region.
- Its rim road nodes are 250 to 380 apart, against a tree median of 108.
- Three of them have nothing branching off: `m23b`, `m56b` and `j7`.
- Three of the four largest interior holes on the map are here. (The fourth, on the Vanguard–Zealot seam, is
  deliberate and stays; see §2 of this report.)

The G1 Strider brief kept "the band between the old edge and the road in the north-east" open on purpose, as reserve
room. That is the one thing §11.3 rules out: "no deliberately sparse band". It also matches §14's rejected sparse
moat. Empty space itself is welcome (§11.5); a planned empty band is not.

This is the same ground as the G3 round 3 Strider report's open question 3. That report found the far south and the
trap fork taken by none of the four archetypes by 160 points, and asked whether G4 should make the south a loop. A
fixer should settle that question and this finding together, so that two agents do not propose different things
for one band.

**Fix.** Do not fill it with filler: §7.3, §14 and G-growth §4 "tension by tax" all rule that out. Either:

- **(a) Spend the brief's named reserve where it is wanted.** For example, evasion, "the thinnest defence"
  (G1-brief A1), as a cluster off each of the bare `m23b`, `m56b` and `j7`, and only where the Builds audit shows
  a build wanting it.
- **(b) Pull the rim road from `j3` to `j7` about 200 to 250 units inward.** This shortens its links toward about
  250 and closes the band without new nodes.

Either way:

- keep the border links `j8`–Stormstruck and `j1`–`knife.rim.wall.s6`;
- keep Kill Shot and the trap/mine fork as the loop the G3 round 3 report made (§3);
- keep the far tips (Live Wire, Telling Shot, Bright Shafts) as tips.

### 7. Should fix: the Reaver's four-node shapes are a third to a half larger than §11.5's

**Where.** Open Veins (`yard.blood.openVeins.*`, a rhombus with half-diagonals 70 and 85 and sides 110), Red Harvest
(`yard.blood.redHarvest.*`, the same), and Hot Blood (`yard.dual.hotBlood.*`, a square with sides of 100, radius 71).
See `reaver.png` and `quads/reaver-se.png`.

**What is wrong.** §11.5 sets four-node squares and diamonds at "about 55", which I read as centre to node. The
others are there, measured with sides of 78 to 80 (radius about 56): Steady Hands, Heavy Hands, Cinder, High Veil
and Bad Company. These three are at a radius of 70 to 85. They are regular, only loose, and they are the loosest
clusters on the map. No G2 or G3 report records the size as deliberate.

**Fix.** Scale each as a whole about its centre (§11.5, and never node by node, §14), to about 0.7. Their entrance
links (`shield.j1.a`, `j3.a`, `j2.a`, `toHarvest.a`, `east.e1`, `bow.steel.toBlood.b`) just get longer. The Reaver's
hexagons (Full Swing / Paired Steel, Twin Fangs / Weaving, Steel Rim / Scarred Hide) are at radius 100 to 105, inside
the 75 to 105 that §11.5 allows: leave them.

### 8. Should fix: a branch leaves the Vanguard's middle road 20° off the road

**Where.** `wall.home.roadM.b` (a three-link small on the life road from Oathbound, Vanguard), with
`wall.rampart.toThickSkin.a` (`quads/vanguard-ne.png`, left).

**What is wrong.** The branch to Stone Heart (`toThickSkin.a` at 164°) leaves 20° from the road onward (`roadM.c` at
145°), so it reads as a fork in the road rather than a branch off it.

**Fix.** Move `toThickSkin.a` about 70 north, to about (-1665,740), so it leaves at about 185° (40° from the road),
and keep Stone Heart's chain straight from it. No link changes.

### 9. Consider: the other junction near-misses under 30°

None is near a start. Each is a candidate to look at, not a verdict.

| junction               | gap | links involved                                                           |
| ---------------------- | --: | ------------------------------------------------------------------------ |
| `yard.shield.j2.a`     | 25° | Steel Rim / Shieldwall chain                                             |
| `bow.flight.toKnife.a` | 25° | Tripwire / the Shade crossing                                            |
| `bow.string.speed.m`   | 25° | Quick Hands / True Aim                                                   |
| `bow.steel.road.jt3`   | 25° | the `added` spokes                                                       |
| `spire.well.draught.a` | 26° |                                                                          |
| `spire.craft.j1.a`     | 27° | five links                                                               |
| `knife.snares.toBow.b` | 28° |                                                                          |
| `knife.venom.j5.a`     | 29° | six links, with spokes of 250 to 550 to Hollow Vessel, Athame and Breath |

For `knife.venom.j5.a`: the six-way star is the Shade's longest-spoked junction. It reads as a node of the Docks
road, not as a cluster, so leave it unless it is re-laid for another reason.

The fix for each is a nudge of one branch's first node toward the middle of its widest neighbouring gap.

### 10. Consider: two-link road nodes that turn with no junction

| node                          |       turn | what it is                                                                                                                                                       | fix                                                                                                                                                                  |
| ----------------------------- | ---------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bow.steel.road.jt1`          |        55° | A border crossing, Strider `hubs.s` → Reaver `dual.j2.a`, bent in the middle with nothing branching off it.                                                      | Move it onto the straight line, about (680,1120). The link lengths barely change.                                                                                    |
| `cathedral.walk.road.n1`      |       104° | The elbow of the Zealot's outer walk, a bare corner at the far west tip before Kindled Steel. G-growth lists "the Zealot's west edge" among the far unused ends. | Let the corner earn its turn: hang a cluster there that the Builds audit wants, which makes it a junction. Or straighten it by linking `n2` to Kindled Steel's side. |
| `wall.grit.east.e8`           |        28° |                                                                                                                                                                  | The turns are mild. Fix only when the area is touched.                                                                                                               |
| `wall.rampart.toStar.a`       |        25° |                                                                                                                                                                  | (same)                                                                                                                                                               |
| `wall.rampart.toHands.a`      |        23° |                                                                                                                                                                  | (same)                                                                                                                                                               |
| `wall.maces.toShaker.a`       |        22° |                                                                                                                                                                  | (same)                                                                                                                                                               |
| `cathedral.nave.star.s` / `e` | 24° to 25° |                                                                                                                                                                  | (same)                                                                                                                                                               |

### 11. Consider: notable names that collide when read

Pairs of notables about level with each other and 120 to 150 apart, whose names run into each other at the zoom where
names show:

- Longbow and Fleet Blade (`bow.bows.wheel`);
- Deep Cuts and Killing Eye (`bow.quiver`);
- Athame and Long Knives (`knife.roofs.athame`, 148 apart on one row);
- Executioner and Standard Bearer (`yard.blades` / `yard.shield`).

The first two were already an open question to the user after the layout pass ("wider rings for the Longbow and Deep
Cuts wheels so their names clear"); it still stands. If the user wants it, scale each ring as a whole by about 1.2,
and turn the Athame hexagon 30° so its two notables sit at different heights.

### 12. Consider: notables drawn close to a link they are not on, and sharp V tips

**Close to a link.** These notables sit with 15 to 22 units of clearance from a link they are not on:

- Flashpoint, 45 from `jArm.a`–`flashpoint.b`;
- Harsh Weather, 46;
- Headsman, 52 from its own small's link to `toHeadsman.r3`;
- Hymn, 52.

They are drawn clear, but they read as touching. Nudge each notable 20 to 30 units away from the link.

**Sharp V tips.** Several notables are the tip of a V of their two chains that doubles back more than 125°: Ardour
138°, Verger 136°, Bellows 134°, Iron Draw 129°, Buckler 126°. Each reads as a pocket, and each chain is straight
toward where it leads, so they are within §11.5. Leave them unless one turns out to be a through-route that should
read as one.

---

## 2. What is good (keep it)

- **0 crossings and 0 nodes drawn over each other across 1,685 links,** after 380 new nodes and the border pass.
- **Shapes are regular.** Every new wheel, square, pentagon and hexagon added in G3 is regular:
  - Elemental Fletching's five-ring at a regular 72°;
  - High Veil and Bad Company (new in G3) as squares with sides of 80, like the older Steady Hands, Heavy Hands
    and Cinder;
  - the octagons of the Cathedral, the Knife and the Spire at even 45° corners.

  Nearly all of the 83 bends are those corners.

- **Chains are tight.** The quartile link length is 70, and new clusters in every region hang 70 then 55 to 60
  beside their notables (Lasting Wounds, Kill Shot, Live Wire, Telling Shot, Graven Posts, Vespers, Sea Legs, Cold
  Steel, Glint, Long Grudge).
- **Keystones read as keystones:** each is a dead-end spur of one or two smalls with the larger frame.
- **No moat round the starts.** The bands from radius 500 out run 16 to 37 nodes per million square units with no
  empty ring.
- **The Vanguard–Zealot seam hole is a reason, not an oversight.** The r 324 hole at (-1505,-25) is the space
  "4 to 6 steps from two starts" that both G1 briefs left empty for a player's reason (anything there would be cheap
  for two starts). Leave it; empty space is welcome (§11.5).
- **The Shade's Docks "ladder"** (r3 open question 3) reads cleanly as three level rungs with clusters on them. As a
  look it is fine.
- **The Mystic, the Zealot and the Shade read best.** Roads have corners at junctions, and pockets hang square to
  their roads. Fixes in other regions should take their pattern.

## 3. Missing rules (proposed wording, §15.4)

1. **§11.5, "Roads keep their lines", add:** "This holds wherever two or more links leave one node, including a
   small that doubles as a junction: two links leaving a node less than about 30° apart are a near-miss, whatever
   the node is." All four must-fix findings are this at a small or a hub, which the current wording ("where several
   links leave one node") covers only by a careful reading.
2. **Tooling, not a rule** (§15.10). `geometry.ts --bends` lists only two-link bends, and every near-miss above was
   invisible to the checks every agent ran. Add a `--fans` listing (junctions whose smallest gap is under 30°, as
   candidates for the eye, never a gate). The spec: for every live node with three or more links, sort the link
   bearings, and list the node with its links when the smallest gap between neighbouring bearings is under 30°.
3. **§11.3, add one sentence:** "Reserve room kept for later growth is still room inside the network: keep it as
   holes among clusters, not as a band between the old edge and a new outer road." Finding 6 exists because a brief
   read "empty space is welcome" as permission for a band.

I do not propose a rule on link length: §14 rejects spacing rules, and long links between far clusters are right.
Finding 1 is about long links inside a home, where §6.1 and §11.5 already decide it.

## 4. Checklist (my subset)

- **§11.1 Aesthetically appealing: holds with exceptions.** The Strider home (1), the Vanguard home's two sides (3, 4) and the Strider's outer band (6).
- **§11.2 No overlapping lines, no node over another: holds.** 0 crossings and 0 drawn over. Area names were not
  checked, by the user's instruction.
- **§11.3 Geometry: holds with exceptions.**
  - Pockets are tight orbits facing their junction.
  - Clusters are compact, except the Reaver's three four-node shapes (7), Wanderer's small (2) and Banner's chain (3).
  - Roads are straight with corners, except `jt1` and `walk.n1` (10).
  - Dense all the way out, except the Strider's outer band (6).
- **§11.4 Readable on a phone: holds, not verified on a device.**
  - In the game, colour says what a node gives (`TONE_COLOR` in `src/ui/treeStyle.ts`; the review renders colour by
    region instead), and shape and size say rank.
  - Regions are told apart at zoom-out by the attribute roads' str/dex/int colours and by the area names' region
    colours. The area names are ignored for now, so this cue rests on the roads until the label pass.
  - Notable names collide in four ring pairs (11).
- **§11.5 Clusters tight, angles with reasons: holds with exceptions.**
  - A cluster reads as one: fails for Wanderer (2) and Warlord's Banner (3); the Reaver's shapes are loose (7).
  - A chain is straight: holds, with `n414` (1) and the mild road bends (10) as the exceptions.
  - Shapes are regular: holds.
  - Smalls between notables: holds, except Wanderer (2).
  - Roads keep their lines: fails at `jb4` 17°, `s2` 20°, `roadM.b` 20°, `hubs.n` 21°, `crushing.a` 22° and
    `life.a` 26°, plus the Quartermaster ladder (1, 3, 4, 5, 8, 9).
  - Empty space is welcome: holds.
  - The user's hand edits are not a fixture: the Strider home (1) is where they need reshaping.
- **Other sections a fix must respect** (weighed above, not audited): §3.5 and §3.6 (ways in, bridges), §3.7 (border
  links kept), §4.8 (mixed homes), §5.5 (no shortcut making a one-stop shop: finding 5), §6 (starts: findings 1, 3
  and 4 are all within six steps of a start), §7.3 and §14 (no filler: finding 6), §9.1 (keystone spurs stay dead
  ends: finding 1).
