# G4 audit round 2: looks

This audit covers CONSTRAINTS §11. Area labels are ignored, as the user asked. It checks the network after G4 fix pass 1 (HEAD
b6a493c; `edits.json` empty): 1,398 live nodes and 1,703 links. Nothing in `src/`, `scripts/`, CONSTRAINTS or the plan docs was
touched.

**Pictures**, all in [looks/](looks/):

- `whole.png`, plus one picture per region with the centre (`mystic.png` … `zealot.png`).
- Close-ups with ids:
  - `cu-strider-home-ids.png` (and `cu-strider-home.png` without ids)
  - `cu-strider-rim.png`
  - `cu-strider-east-ids.png` (seam 4)
  - `cu-strider-steelwheel-ids.png`
  - `cu-vanguard-home-ids.png`
  - `cu-vanguard-host-ids.png`
  - `cu-reaver-seam1.png`
  - `cu-reaver-west.png`
  - `cu-shade-home-ids.png`
  - `cu-shade-middle-ids.png`
  - `cu-zealot-home-ids.png`
  - `cu-seam5-ids.png`
  - `cu-mystic-draught-ids.png`

**Measures.** These come from the scratch scripts of round 1, re-run unchanged.

- **`geometry.ts --bends`, whole tree:** 0 crossings, 0 nodes drawn over each other, 82 bends over 20°.
  - Round 1 had 83 bends. The new entries (`bows.elements.c`, `quiver.brightShafts.a/b`) are re-homed ids of the same
    corners.
  - `toHymn.r1`'s bend is gone.
  - Nearly every bend is a corner of a regular shape.
- **Junction fans, smallest gap between neighbouring links:**
  - Nothing under 25° remains. Round 1 had seven, at 17° to 24°.
  - Eight are left between 25° and 30°. All eight were in round 1's "consider" list, and `bow.string.road.s2` went from
    20° to 28°.
- **Link length:** median 106, quartiles 70 / 237.
- **Long links in the homes.** These are links over 350 units with both ends within 1,100 of a start:
  - Strider: **8**. Round 1 had 9.
  - Shade: 5.
  - Vanguard and Reaver: 3 each.
  - Zealot: 2.
  - Mystic: 1.
- **Density by radius.** In 250-unit bands from radius 1,000 to 4,250, every band holds 16 to 37 nodes per million
  square units.
  - The Strider's band from 3,500 to 3,750 now holds **16** nodes. Round 1 found 5 there.
  - The thinnest band is 750 to 1,000, inside the starts (11.6 per million). It holds only the ring's links up to the
    hubs. That is the centre's shape, not a moat around the starts.
- **Largest interior holes:**
  - r 332 by Field Kit.
  - r 322 on the Vanguard–Zealot seam. It is deliberate (round 1, §2).
  - r 315 and r 308 by the Zealot and Shade hubs, the wedges between homes beside the ring.
  - r 307 by Split Volley.

  The big discs at radius 4,200 or more lie beyond the outline, mostly beyond the Strider's pulled-in rim (finding 8).

---

## 1. Findings, most important first

### 1. Must fix: Hard Target's own evasion small is drawn beside Fleet Foot, 355 units from Hard Target

**Where.** `bow.string.hardTarget.a` (Strider, evasion), at (2300,1320). See `cu-strider-home-ids.png`, right edge, where
it is labelled "HARDTARGET.A" under Fleet Foot.

**What is wrong.** S-6 linked Hard Target (`bow.string.hardTarget.n`, at (2000,1130)) to `hardTarget.a`, which was
already the shared small on the way to `bow.flight.hub.p`. That small sits **72 units from Fleet Foot's evasion small
`speed.b`** and **355 from Hard Target**, and it carries Fleet Foot's stat (evasion). A player reads it as Fleet Foot's
third small, with a long line running from Hard Target to Fleet Foot's chain.

- It is the same fault as round 1's finding 2 (Wanderer's small beside Round Shield), made again by the fix pass.
- It is the only notable–own-small link over 200 units on the map. The next longest are the start-loop signatures, at
  156 to 192 units, and those are loop sides by design.
- It breaks §11.5: "a cluster reads as one … every small beside the notable and the rest of the distance on the link
  out", and "smalls between two notables … the stat says whose a small is".

**Fix.** Move one small and re-aim one link:

1. Move `hardTarget.a` to about **(2065,1157)**. That is 70 units from Hard Target on the line from Hard Target toward
   `speed.b`. Hard Target's chain then runs straight through the notable: `hardTarget.d` → `c` → Hard Target → `a`, a
   turn of about 4°.
2. Keep the link `hardTarget.a`–`bow.string.speed.b`. It becomes the 230-unit link between the two clusters.
3. **Re-aim** `hardTarget.a`–`bow.flight.hub.p` as `speed.b`–`hub.p` (202 units).

The result at the two nodes that change:

- **`speed.b`:** three links (Fleet Foot, `hardTarget.a`, `hub.p`) at about 202°, 262° and 48°, so gaps of 60°, 146° and
  154°.
- **`hub.p`:** the new link at about 228° sits 96° from `quiver.road.jq3` and 51° from `flight.road.jp3`.

The change to the network is small, and the network auditor must agree to it:

- Hard Target still bridges `s2` and the flight hub, and still has two ways in.
- Hard Target to `hub.p` goes from 2 steps to 3.
- Fleet Foot to `hub.p` goes from 3 steps to 2.
- Fleet Foot still has two ways in (`f2` to Wanderer, `speed.b` to `hub.p`).

Run `geometry.ts --region strider` after the move. The new `hardTarget.a`–`speed.b` line passes about 65 units from Fleet
Foot.

**What a fix must not break:**

- §3.5: Hard Target, Fleet Foot and Quick Hands each keep two ways in.
- §5.5: the S-6 cut between Fleet Foot and Hard Target stays cut. No notable-to-notable link comes back.
- Stop 1 target 5: no road node is added.

### 2. Should fix: the Wandwork knot (Mystic): three overlapping triangles and a 27° fan at `draught.a`

**Where.** The nodes are `spire.well.draught.a`, Wandwork (`spire.well.wandwork.n`), `spire.well.toCathedral.a` and
`spire.well.j1.a`, in the Mystic's south-west, on the road to the Zealot (`cu-mystic-draught-ids.png`).

**What is wrong.**

- `draught.a` (a flask small with four links) sends links to Wandwork (39°) and to `toCathedral.a` (66°) only **27°**
  apart.
- Wandwork itself is a four-link junction, joined to `draught.a`, `toCathedral.a` and `j1.a`.
- So `draught.a`, Wandwork, `toCathedral.a` and `j1.a` draw three thin triangles over one another, a cat's cradle about
  seven steps from the Mystic start.
- Draught's own pair of smalls is 247 apart, with `draught.a` acting as a road junction, not as Draught's small.

This breaks §11.5 ("where several links leave one node, they leave at clean angles … not a near-miss"). Round 1 listed it
as a "consider" (L9), and the fix brief left it "only if touched".

**Fix.** Cut **`draught.a`–`toCathedral.a`**. Nothing else moves.

- The 27° near-miss and the thinnest triangle go.
- `toCathedral.a` becomes a plain two-link road node (`toCathedral.b`, Wandwork).
- `draught.a` is left with three links, at gaps of about 159°, 120° and 81°.
- The Mystic–Zealot crossing (`toCathedral.b`–`cathedral.home.hymn.b`) is untouched, and Draught keeps its own crossing
  (`draught.b`–`cathedral.choir.toSpire.a`).
- The cost: a player who comes from the Zealot along `toCathedral` and wants Draught's road goes through Wandwork, one
  step more. The network auditor must agree to it.

A fix by positions only does not work here: any spot for `draught.a` that opens the 27° gap closes another one on the
`j1.a` side.

**What a fix must not break:** §3.5 (Wandwork, Draught and `j1.a` each keep two or more ways in) and §3.7 (the border
links stay).

### 3. Should fix: the Strider home still has its 622-unit link, and it can go without moving anything

**Where.** `bow.steel.hub.t`–`bow.steel.wayfarer.d` (Strider; `cu-strider-home-ids.png`, bottom left).

**What is wrong.** The home is much better than in round 1 (see §3 below), but this is the longest link in any home and
the second longest on the map. It runs from Wayfarer's end small to `hub.t` across the Strider's south-west.

- The fixer left it because `hub.t` is pinned by the Reaver's Footwork chain, and moving Wayfarer south gains under 80
  units. That is right for a fix by positions.
- But the link carries little: Wayfarer's end small already crosses to `yard.dual.j2.a` (232 units).
- `hub.t` has four other links: `jt3`, `toBlood.a`, `footwork.c` and `weathered.r`.

**Fix.** Cut `wayfarer.d`–`hub.t`.

- Wayfarer keeps two ways in (`hubs.s`, and `yard.dual.j2.a`).
- `hub.t` keeps four.
- The home's links over 350 units drop from 8 to 7, and the long diagonal across the south-west goes.
- This is a network change for the network auditor. It removes one Strider–Reaver path near `j2.a`, but the border link
  itself (`wayfarer.d`–`j2.a`) stays.

**What a fix must not break:**

- §3.5 and §3.7 (border links are counted per pair; this cut is inside the Strider).
- §6.5 (Wayfarer is still 3 to 4 points out).

### 4. Consider: the Strider home's two remaining long spokes off `s2`

`bow.string.road.s2` still throws a 547-unit link to Quick Hands' small (`speed.a`) and a 596-unit link to Hard Target's
small (`hardTarget.d`).

- The fan at `s2` is now even: 26°, 55° and 83°, so gaps of 29° and 28°.
- Both chains follow §11.5's rule (smalls beside the notable, the distance on the link out).
- So this is legal, and round 1's near-miss is gone.

It is still why the Strider home reads as long rays, and the Strider home has 8 links over 350 units against 1 to 5 in
the other homes.

Shortening the spokes would mean pulling Quick Hands and Hard Target in toward `s2`. That collides with Weathered and
Round Shield, or adds road steps, which Stop 1 target 5 forbids. Leave it unless finding 1 or 3 moves these clusters
anyway. Shown to the user at stop 4 as it is.

### 5. Consider: notable and keystone names that collide at zoom-out, four of them new

These pairs are level with each other and 120 to 250 units apart, so their names run together where names show:

| pair                       | units apart | where                                      | new in this pass? |
| -------------------------- | ----------- | ------------------------------------------ | ----------------- |
| Deep Cuts / Bright Shafts  | 118         | the S-9 swap put them on one wheel         | new               |
| Crimson Pact / Clean Break | 184         | seam 1, a keystone name across a notable's | new               |
| Bad Company / Needlework   | 246         | seam 3                                     | new               |
| Rotting Word / Sapper      | 200         | the Shade's hex corner                     | new               |
| Longbow / Fleet Blade      |             | round 1                                    | from round 1      |
| Athame / Long Knives       | 148         | round 1                                    | from round 1      |

All of them read cleanly at the close-up zoom (`cu-reaver-seam1.png`). The fix brief (§2.8, L11) parked notable names as
a display question. That is still right, but the list has grown by four. If the user wants it: turn the Deep Cuts wheel
about 30° so its two notables sit at different heights, and nudge Clean Break's chain about 40 units up its own line so
its name clears Crimson Pact.

### 6. Consider: Hymn sits 52 units from its own end small's link

**Where.** Zealot, about 4 steps from the start (`cu-zealot-home-ids.png`, top right).

Hymn's chain runs `hubs.e` → `hymn.a` → Hymn → `hymn.b`, and `hymn.b` also links back down to `roadE.a` (332 units).
That makes a thin five-sided wedge, with the notable 52 units from the `hymn.b`–`roadE.a` line. The fans are clean (48°
at `hymn.b`), so this is a reading issue, not a rule failure.

Z-1 made Hymn the casting Zealot's first spell notable, so it is now a common pick near the start, and that makes it worth
a look. **Fix (positions only):** shift the three Hymn nodes about 50 units east, so the chain runs on the straight line
`hubs.e` → `spire.well.toCathedral.b` and away from the `roadE.a` link.

### 7. Consider: the junction near-misses left from round 1 (25° to 29°)

These are unchanged and none is near a start:

- `yard.shield.j2.a` 25°
- `bow.flight.toKnife.a` 25°
- `bow.steel.road.jt3` 25°
- `spire.craft.j1.a` 27°
- `knife.snares.toBow.b` 28°
- `knife.venom.j5.a` 29°

`spire.well.draught.a` is finding 2, and `s2` is finding 4. The fix for each is the same as in round 1: nudge one
branch's first node toward its widest neighbouring gap, when the area is touched for another reason.

The Shade's six-spoke `knife.venom.j5.a` (spokes of 450 to 550 to Hollow Vessel, Hoarded Breath, Cruel Agony, Athame and
Quiet Shot) is still the sparsest-looking middle on the map (`cu-shade-middle-ids.png`). It is legal, and round 1 said to
leave it.

### 8. Consider: the Strider's pulled-in rim leaves a notch in the outline

L6 (b) pulled the rim road from `j3` to `j7` inward by up to 225 units. That fixed the band: 16 nodes at radius 3,500 to
3,750, the road's links now 237 to 379, and `m56a`, `m56b` and `j7` each have a branch (`cu-strider-rim.png`).

The cost is footprint. The Strider now ends at radius about 4,250, while the other regions reach 4,500 to 4,700, so
`whole.png` shows a concave bite in the outline between Stormstruck and Telling Shot.

- §4.3 says the outline may be any shape, so this is not a fault.
- §11.5 does say "keep a region's footprint".
- No fix is proposed: filling the bite would be supply placed for a shape (§14, G-growth §4).
- If the Strider grows again, this is where its new clusters go.

### 9. Consider: notables drawn close to a link they are not on (unchanged from round 1)

Flashpoint (45), Harsh Weather (46), Headsman (52) and Venom Fletching (55) sit 15 to 25 units of clearance from a link
they are not on. Nudge each 20 to 30 units away when touched. There are two new near-touches:

- `wall.home.quartermaster.b` is 39 from Quartermaster's rung to `roadS.a`. It is left over from V-3, and the rung leaves
  33° from the chain.
- `wall.grit.host.a` is 35 from the `host.b`–`bellows.c` link.

Neither reads as touching at game zoom.

---

## 2. What is good (keep it)

- **0 crossings and 0 nodes drawn over each other** across 1,703 links, after the fix pass touched every region and added
  five seam clusters.
- **No junction under 25° anywhere.** Every one of round 1's must and should near-misses is fixed: `jb4`, `life.a`,
  `wall.home.hubs.n`, `roadM.b`, `crushing.a`, Quartermaster and `thunderstep.a`.
- **The five seam clusters are laid cleanly.** Each is a straight bridge chain, with its smalls 70 units from the
  notable and the distance on the links out:
  - Clean Break (`cu-reaver-seam1.png`)
  - Twofold Guard (`cu-seam5-ids.png`), a single straight line from Warding Staff to Graven Posts
  - Needlework
  - Hare's Pace (`cu-strider-east-ids.png`)
  - Bright Omen
- **The new and moved arcs are regular and face their roads:** Killing Eye, Live Wire, Quickening, Glint, Long Grudge,
  Wake, Buttress and Rood Screen.
- **The Reaver's three four-node shapes** (Open Veins, Red Harvest, Hot Blood) are now at about radius 55, like the
  map's other squares.
- **The Vanguard home reads well** (`cu-vanguard-home-ids.png`):
  - Banner is compact.
  - Ringing Blows is a straight chain on a 36° fan.
  - Quartermaster fills the hub's empty sector.
  - Weak Spot leaves the middle road 40° off its line.
- **The Strider's rim now has clusters along it,** not a bare road (finding 8).
- **The Mystic, the Zealot and the Shade home still read best:** roads with corners at junctions, pockets square to their
  roads, regular wheels. Fixes elsewhere should keep taking their pattern.

## 3. Round 1 follow-up

| round 1 finding                                  | status | note                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Must: the Strider home's rays and near-misses | partly | Fixed: `jb4` 17° → 52°, `s2` 20° → an even 29°/28° fan, the `life.a` double spoke, `n414` folded into the chain, `hubs.n`–`jb3` 623 → 472, and `n442` became a road node. Not fixed: `hub.t`–`wayfarer.d` 622 (finding 3) and the long `s2` spokes (finding 4). New fault: Hard Target's small (finding 1). |
| 2. Must: Wanderer's small beside Round Shield    | fixed  | `wanderer.a` is 70 units from Wanderer.                                                                                                                                                                                                                                                                     |
| 3. Must: Vanguard north hub and Banner           | fixed  | The fan is 170° / 207° / 243°, and the Banner smalls are compact. The 32° gap at `banner.a` is a plain triangle.                                                                                                                                                                                            |
| 4. Must: the Quartermaster ladder                | fixed  | Gaps at `hubs.s` are 53° / 122° / 57° / 128°, 33° at Quartermaster and 40° at `thunderstep.a`. A minor near-touch is left (finding 9).                                                                                                                                                                      |
| 5. Should: Crushing Blow's near-parallel links   | fixed  | Positions only. The road leaves `crushing.a` at about 240° and runs straight.                                                                                                                                                                                                                               |
| 6. Should: the Strider's sparse outer band       | fixed  | The band holds 16 nodes and the rim links are 237 to 379. The outline notch is finding 8.                                                                                                                                                                                                                   |
| 7. Should: the Reaver's loose four-node shapes   | fixed  | Scaled as wholes to 0.7.                                                                                                                                                                                                                                                                                    |
| 8. Should: `roadM.b` branch 20° off the road     | fixed  | The branch is now 40° off the road, and Weak Spot's chain is straight.                                                                                                                                                                                                                                      |

## 4. Checklist (my subset)

- **§11.1 Aesthetically appealing: holds with exceptions.**
  - The Strider home (findings 1, 3 and 4).
  - The Wandwork knot (finding 2).
- **§11.2 No overlapping lines, no node over another: holds.**
  - 0 crossings and 0 drawn over.
  - Area names were not checked, by the user's instruction.
- **§11.3 Geometry: holds with exceptions.**
  - Pockets are tight orbits facing their junction: holds.
  - Clusters are compact: holds, except Hard Target (finding 1).
  - Roads are straight with corners: holds. `jt1`'s bend has a reason (it goes round Wayfarer's pocket), and
    `walk.road.n1` is still a bare elbow (round 1, L10).
  - Dense all the way out: holds. No band inside the outline is sparse, and the Strider's outline notch is finding 8.
- **§11.4 Readable on a phone: holds, not verified on a device.**
  - Regions can be told apart by colour.
  - In the game, colour says what a node gives and shape says its rank.
  - Notable names collide in six pairs at zoom-out, four of them new (finding 5).
- **§11.5 Clusters tight, angles with reasons: holds with exceptions.**
  - A cluster reads as one: fails for Hard Target (finding 1).
  - A chain is straight: holds.
  - Shapes are regular: holds.
  - Smalls between notables: fails for Hard Target's shared small (finding 1).
  - Roads keep their lines: holds, except `draught.a` (finding 2). The 25° to 29° fans of finding 7 are left from round 1.
  - Empty space is welcome: holds.
  - The user's hand edits are not a fixture: the Strider home was reshaped.
- **Other sections a fix must respect** (weighed above, not audited):
  - §3.5 and §3.7: findings 1 to 3 each keep two or more ways in, and no border link is lost.
  - §5.5: finding 1 restores no Fleet Foot–Hard Target link.
  - §6: findings 1, 3 and 6 are within six steps of a start.
  - §7.3 and §14: no filler, and nothing placed to satisfy a number (finding 8).
  - Stop 1 target 5: no road node is added by any proposal.
