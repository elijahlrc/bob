# G2. The Mystic's skeleton (the Spire)

Laid 2026-10-22 for phase G2 of [G-growth.md](../G-growth.md), from [G1/mystic.md](../G1/mystic.md) as joined in
[G1-brief.md](../G1-brief.md) (§2.1, §2.2). [CONSTRAINTS.md](../CONSTRAINTS.md) wins over both. Roads, cuts and moves
inside the Mystic only: no new cluster, no re-line, no re-price, no link across a region line. Nothing is registered or
baked (the border pass and registration come after).

**Pictures** (folder [mystic/](mystic/)): `before.png` / `after.png` (the region), `before-top.png` / `after-top.png`
(the top of the Spire: both rim roads and Siphon, box −1900,−4900 → 2300,−3300), `after-cloister.png` (Quickening's new
place; the region's `before.png` shows the old one), `after-curse.png` (the curse crossing's node).

**Node count: 184 → 193** (+9 road nodes; 37 notables and 5 keystones as before).

---

## 1. What was laid

### Roads

| road                                                                  | file                    | nodes | from → to                                                                                                                                           | what comes off it                                                                              |
| --------------------------------------------------------------------- | ----------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **The Eaves** (the north-east rim road), a new area in `spire/rim.ts` | `rim.ts`                |     5 | `spire.frost.toHarsh.a` → r1 (519,−4234) → r2 (850,−4470) → r3 (1233,−4454) → r4 (1592,−4177) → r5 (1950,−3900), stub toward `knife.roofs.ridge.y1` | MY-3 (r1–r2, G3), Snare Line (r3, linked now), MY-6 (r4, G3), the Rooftops (r5, border pass)   |
| **The north-west rim road**                                           | `fire.ts` (the Lantern) |     3 | a (−850,−4500) → b (−1115,−4325) → c (−1380,−4150), c linked from `spire.fire.cinder.b`; stub toward the Zealot's (−1800,−4050)                     | MY-4 (a, G3), MY-7 (b–c, G3), Cinder (c, linked now), the Zealot's north walk (c, border pass) |
| **The curse crossing**                                                | `craft.ts`              |     1 | `spire.craft.hexwright.n` → toStair.a (1465,−2755), stub toward `knife.hex.j4.a`                                                                    | (a crossing; the link onward is the border pass's)                                             |

Values: `int(7)` on every road node, `dex(6), int(6)` on the last node before the Shade (r5, toStair.a) and
`str(6), int(6)` on the last before the Zealot (rim.c), as the brief and CONSTRAINTS §7.4 say.

Layout: the Eaves is three straight runs that turn only at r2 and r3 (each a junction once G3 lands MY-3 at r2; r3 has
three links now). r1 sits on the straight line from `toHarsh.a` to r2 rather than at the brief's (520,−4330), so the first
run is straight; MY-3 hangs outward of r1–r2 as the brief's pocket. r3 sits on the extension of Snare Line's chain
(`toOvercharge.r1` → a → b → n → r3 all at −40°), so the chain is straight onto the road. r4 is the midpoint of r3–r5.
The north-west road is one straight run (the brief's middle point (−1120,−4390) moved to the line, (−1115,−4325)), turning
only at c, which is a junction (Cinder now, the Zealot and MY-7 later).

### Cuts (all four with both ends in the Mystic; all in `well.ts`)

- `spire.well.deepWell.d – spire.well.recharge.a`
- `spire.well.recharge.b – spire.well.siphon.a`
- `spire.column.broadWeave.a – spire.well.siphon.n`
- `spire.well.siphon.a – spire.well.toPulse.a`

### Moves

- **Quickening (MY-m1)**, kept in `well.ts` (its new place is still the Cloister): a (−886,−2669), n (−950,−2640), b
  (−1011,−2674), a pocket bridging `spire.well.toTap.a` (the Quiet Pulse road) and `spire.well.toCrypt.r2` (the
  Undercroft road). Each small lies on the straight line from the notable to the road node it leads to, so the bend is at
  the notable, the pocket's tip, facing away from both roads (I tried the straight line between the two road nodes: it
  ran 100 units from `toCrypt.r1` and met `r2` 30° from the road, a sliver; the V reads as a pocket). **Not trimmed to 5
  units** (a re-price: G3).
- **Siphon (MY-m2)** moved to `frost.ts` (its new place is under the Belfry's label): a (226,−3676), n (165,−3710), a
  bridge `spire.frost.jStorm.a` → a → n → `spire.frost.jArm.a`, laid on the straight line between the two junctions with
  the notable in the middle, so the small G3 adds (the brief's extra ES-on-hit small) mirrors `a` on the junction side.
  Lines unchanged.

### Changed and removed ids

| old id                | new id                 |
| --------------------- | ---------------------- |
| `spire.well.siphon.a` | `spire.frost.siphon.a` |
| `spire.well.siphon.n` | `spire.frost.siphon.n` |

New ids: `spire.rim.road.r1`–`r5`, `spire.fire.rim.a`, `spire.fire.rim.b`, `spire.fire.rim.c`, `spire.craft.toStair.a`.
Moved, same ids: `spire.well.recharge.a`, `.n`, `.b`. No other id changed; nothing removed beyond the two Siphon ids.

Reasons updated to match (no line changed): Cinder (a bridge now), Snare Line (a bridge now), Quiet Pulse,
`spire.well.toPulse.a`, `deepWell.d`, Broad Weave and its small `a` (none of them names Siphon any more), and the file
headers of `well.ts` and `rim.ts`.

### The rim file

`spire/rim.ts` is used for the north-east road and renamed **The Eaves** (the eaves under the Shade's Rooftops, which it
runs down to); the export keeps the name `parapet` that `index.ts` imports, the area id stays `spire.rim`. Its label moved
from (0,−4550), where it lay on Fever Pitch, to (1720,−4430): outside the road in the empty north-east corner, over the
r3–r4 link and no node. The north-west road went to the Lantern (`fire.ts`) instead, because it hangs off Cinder at the
Lantern's end and is 2,000 units from the Eaves (Fever Pitch and the Belfry between); one area for both would have had
one label for two places. If the user would rather the two rim roads be one place, the north-west road's three nodes can
move to `rim.ts` (their ids change) and the label go above Fever Pitch, around (0,−4800).

---

## 2. Where G3's clusters hang

| cluster (G1/mystic.md)                     | hangs on                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| MY-1 spell damage + spell crit multiplier  | `spire.craft.toVolley.r2` and `spire.craft.toDev2.a`                                       |
| MY-2 spell damage + life                   | `spire.well.toCrypt.r2` (and, by the border pass, `cathedral.crypt.toSpire.b`)             |
| MY-3 spell damage + mana regeneration      | `spire.rim.road.r1` and `spire.rim.road.r2`, outward (a pocket bridging the two)           |
| MY-4 ES + all resistances                  | `spire.frost.stream.n` and `spire.fire.rim.a` (the road's head; it lands on MY-4's smalls) |
| MY-5 wand attack + elemental attack damage | `spire.fire.jArm.a` and `spire.frost.jFire.a`                                              |
| MY-6 crit wand                             | `spire.storm.overcharge.c` and `spire.rim.road.r4`                                         |
| MY-7 minion damage + curse effect          | `spire.fire.rim.b` and `spire.fire.rim.c`, outward (a pocket bridging the two)             |
| MY-8 ES + avoid stun                       | `spire.well.toPulse.a` and `spire.column.broadWeave.a`                                     |
| MY-9 life + mana                           | `spire.craft.roadN.a` and `spire.craft.wandVolley.a`                                       |
| MY-10 dagger spell + cast speed            | `spire.craft.mistWalk.n` (and, by the border pass, `knife.hex.toSpire.a`)                  |
| MY-11 spell damage + elemental penetration | `spire.frost.toShatter.r1` and `spire.frost.jArm.a`                                        |
| Siphon's extra ES-on-hit small (MY-m2)     | between `spire.frost.siphon.n` and `spire.frost.jArm.a`                                    |

Layout notes for G3: `toCrypt.r2` will carry four links (r1, r3, Quickening, MY-2); the brief's alternative (Quickening on
`r1`) was not taken because `r1` is 250 units from `toTap.a`, too short for a three-node chain. `jArm.a` (the Belfry) will
have Thunderhead south, Shatter north, Siphon east-south-east and MY-11 west: a clean cross, so MY-11 should arrive from
due west. The Belfry label (−120,−3920) sits where MY-11 goes (brief §8), and the Lantern's (−950,−3630) where MY-5 goes.

## 3. Border links left for the border pass

Not written, not cut, not re-aimed (both ends as the joined brief gives them):

| crossing                   | Mystic end                           | other end                                      |
| -------------------------- | ------------------------------------ | ---------------------------------------------- |
| the Rooftops road (dear)   | `spire.rim.road.r5` (1950,−3900)     | `knife.roofs.ridge.y1` (2020,−3540)            |
| the far loop (dear)        | `spire.fire.rim.c` (−1380,−4150)     | the Zealot north walk's east end (−1800,−4050) |
| the curse crossing (near)  | `spire.craft.toStair.a` (1465,−2755) | `knife.hex.j4.a` (1600,−2720)                  |
| the dagger caster's bridge | MY-10 (G3)                           | `knife.hex.toSpire.a`                          |
| the Undercroft bridge      | MY-2 (G3)                            | `cathedral.crypt.toSpire.b`                    |
| ring arches CE-1, CE-4     | (the centre's)                       |                                                |

The three stubs are laid for the coordinates the joined brief gives (`ridge.y1` and `j4.a` were where the brief has them
when this was written; the Zealot's (−1800,−4050) node did not exist yet). The border pass should re-check the far ends
once the Shade and Zealot agents are done, and re-aim a stub's last leg if its target moved.

Every existing border link of the Mystic is untouched (audit's link lists: Familiars–`cathedral.crypt.toSpire.b`,
`devotion.b`–`knife.hex.wheel.n`, `storm.roadS.a`–`knife.hex.toSpire.b`, `toKnife`, `toAlleys`, `toCathedral`, Draught,
`toCrypt.r4`, the ring).

## 4. Changes from the brief, and why

- **Road nodes on straight lines** (r1, rim.b): the brief's points were sketch corners; moved onto the line so the runs are
  straight and turn only at junctions (CONSTRAINTS §11.5). Each is under 100 units from the brief's point.
- **Quickening's place** follows the brief's (−950,−2640) exactly, laid as a V pocket (above).
- **Siphon** at (165,−3710) instead of (190,−3770): on the line between its two junctions, 65 units from the brief's spot.
- **The north-west road is in the Lantern**, not the empty rim file (above).
- Nothing else; no new road beyond the brief's nine nodes.

## 5. Transitional states (fine for G2, closed by G3 or the border pass)

- `spire.well.toPulse.a` has one link (Quiet Pulse) until MY-8 lands.
- The north-west road has one way in (Cinder) until MY-4 (G3) and the far loop (border pass) give it two more.
- `spire.rim.road.r5` and `spire.craft.toStair.a` are dead ends until the border pass.
- `spire.frost.stream.n` stays a dead end until MY-4.

## 6. Checks

**Geometry** (`geometry.ts --region mystic --bends`): crossings 0, drawn over 0. Bends over 20° at two-link nodes: 12.
Two are mine: `spire.fire.rim.c` 95° (the corner over Cinder, which becomes a four-way junction with the far loop and
MY-7) and `spire.rim.road.r2` 38° (the corner where the road meets the rim, a junction once MY-3 lands). `deepWell.d`
(60°) is listed now because its third link (to Quickening) was cut: it is a corner of the Deep Well hexagon, the ring's
own shape. The other nine are ring and loop corners that were listed before (Flashes of Insight, Cinder, Overcharge, Deep
Well, Warded Mind, the start loops).

**Audit** (`passives:audit -- mystic`): 0 problems with a `spire.` id (the last run showed one in `yard.shield`, the
Reaver agent's work in progress); 193 nodes. Notables over 5 units: Warded Mind and Quickening, as
before (both are G3's re-lines).

**Ways in (§3.5)**, everything touched: Quickening 2 (Quiet Pulse road, Undercroft road); Quiet Pulse 2 (the junction,
`toTap.a`); the Deep Well wheel 4 (as before less the recharge room); Broad Weave 4 (the junction, the star, the fork,
Withering); Siphon 2 (east join, Belfry junction); Snare Line 2 (Harsh Weather's climb, the Eaves); Cinder 2 (the
Lantern junction, the rim road); the Eaves 2 from inside (`toHarsh.a`, Snare Line), a third at the Rooftops after the
border pass; the Belfry junction `jArm.a` 3 (Thunderhead, Shatter, Siphon). The north-west road has one (above).

**The home check** (steps from the Mystic start to every notable each Mystic archetype took at 60 points in G0, scratch
script over `buildAll`): only two grew, both moved by the brief to break the Cloister one-stop (G1/mystic.md MY-m1,
MY-m2):

| notable    | taken at 60 by                               | before | after |
| ---------- | -------------------------------------------- | -----: | ----: |
| Quickening | caster-es, summoner, wand-attack, channeller |     10 |    16 |
| Siphon     | caster-es                                    |     12 |    18 |

Every other notable of the five lists (First Light 2 … Volatile Servants 25) is unchanged.

`passives:builds -- --only caster-es,caster-life,summoner,wand-attack,channeller` on the shared tree (other regions
mid-edit, so a reading, not a comparison): choice at 60 / 120 is 3/5, 2/4, 3/4, 1/2, 2/3; tax at 120 37%, 34%, 41%, 33%,
32%. Roads without their clusters raise tax, as expected; the wand attacker's single plan at 60 is G0's too.

## 7. CONSTRAINTS checklist

- **§1 What the tree is for.** The moves break the Cloister's shield one-stop (Glass Skin, Quickening, Siphon three steps
  apart); the roads are where new wanted clusters hang. Tension was not bought with tax: no road without a branch.
- **§2 The reference.** Not consulted for this step beyond the brief's facts; no names; nothing copied. New names (The
  Eaves, the curse crossing, the north-west rim road) are plain words.
- **§3 A network.** Snare Line and Cinder stop being dead ends; Quickening and Siphon are bridges; no cut left anything
  with one way in except the transitional stubs listed in §5. No border link touched.
- **§4 Regions and areas.** One new area, a place name (The Eaves); no build-named place. Varied defences unchanged.
- **§5 Specializations.** Siphon (ES on hit) is 18 steps out, away from Glass Skin (7) and Quickening (16); Quickening is
  16 steps from the start against Glass Skin's 7, on the far side of life, as the brief asked.
- **§6 Starts.** The home is untouched; no notable within 9 steps moved.
- **§7 Roads.** Nine attribute nodes; every stretch has a branch within two nodes (the Eaves: MY-3, Snare Line, MY-6,
  the Rooftops; the north-west road: MY-4, MY-7, Cinder, the Zealot). The Undercroft road gains its first branch.
- **§8 Clusters.** No cluster added; Quickening's and Siphon's sections stay uniform (recharge smalls; one ES-on-hit small).
- **§9 Keystones.** All five untouched, dead ends.
- **§10 Vocabulary.** No line changed.
- **§11 Looks.** 0 crossings, 0 drawn over; straight runs that turn at junctions; Quickening a pocket facing away from its
  roads; Siphon straight between its junctions; the rim file's label moved off Fever Pitch and over no node.
- **§12 Size.** +9 nodes, the brief's road count.
- **§13 Tensions.** Highways against filler: the Eaves' long first run (two links of about 370) carries MY-3 in G3; until
  then it reads as a road to the rim, which it is. Bridges against dead ends: three tips became bridges, the keystone
  spurs stayed.
- **§14 Rejected ideas.** No generated layout, no spacing rule, no filler.
- **§15 How the work is done.** Pictures before and after with explicit paths; geometry after every batch; edits only in
  `spire/`.
- **§16 Open.** The Belfry's long spur links (Prismatic Balance, Fever Pitch) were left as they are; Fever Pitch is still
  23 steps out.

Nothing here felt like it was losing intent: every change is the brief's, laid straight.
