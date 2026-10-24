# G4 fix pass 1: the Reaver (`yard`)

Done 2026-10-22 from `G4/fix-1.md` §2.6 and seam 1 (§1.1), with the user's answers to the brief (U1 a non-issue, U2
accepted, U4 Footwork stays). Only `src/data/passives/yard/` was edited. Nothing registered, nothing baked.

## Items

| id  | what was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| R-1 | Seam 1 laid: **Clean Break** (`yard.blood.cleanBreak`), Festering – `a` – `n` – `b` – Pitch Arrows, a straight bridge on the line between the two notables (notable at (1014,3232), smalls 70 out on the line). Notable `physAttack(20), critMulti(18)` (3.5 units); smalls `critMulti(12)`. The border link is `cleanBreak.b`–`bow.steel.pitch.n`. Crimson Pact's whole spur (`a`, `b`, `k`) moved 100 back along its own line toward `j2.a` (the keystone alone would have landed on `b`); still a dead end, 150 from the seam line. Festering is now a bridge. Name checked: absent from `ref-tree.json`; `ip.test.ts` passes; `names.test.ts` reads the baked tree, so it covers Clean Break after the bake. | done   |
| R-2 | Ceaseless Blades hung as a V between `f3` (entrance `a`) and `f2` (`b`), notable at the tip south-east of the road; Marked Prey as a V between `f5` (`a`) and `f4` (`b`), notable at the tip south. Each small on the straight line from its notable to its road node, one small per leg (both legs the notable's own stat). Both are bridges now; each is one step nearer than before (16 and 18 from the Reaver start).                                                                                                                                                                                                                                                                                        | done   |
| R-3 | Weaving → `evasion(20), avoidAilments(20)` (4 units, was 3.0).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | done   |
| R-4 | Sidestep → `dodgeAttack(5), dualBlock(4)` (3.7 units). Its small stays `dodgeAttack(3)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | done   |
| R-5 | Field Dressing → `flaskRecovery(15), flaskDuration(10), moveSpeed(4)` (3.5). Stale reasons rewritten: it is a bridge from Stout Heart to the Wall's Bracing with the notable at the tip, no exit to Fencer's Eye.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | done   |
| R-6 | Mended Mail's three smalls → `lifeRegen(0.4)`; notable unchanged (`armour(24), lifeRegen(0.8)`). Reasons on the area and its links updated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | done   |
| R-7 | Open Veins, Red Harvest and Hot Blood scaled as wholes to 0.7 about their centres (radius about 50 to 60; notable to small 70 to 77). Entrance links just got longer; `toHarvest.a` stays on the straight line between the two diamonds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | done   |
| R-8 | Quickened Steel loses its 6% life (4.9 → 3.7 units); Buckler loses its 5% life (4.8 → 3.8).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | done   |
| R-9 | `yard.home.sig.b` → `attackSpeed(5)`; `yard.home.block.a/b`, `yard.shield.steelRim.a/b`, `yard.shield.shieldwall.a–d` → `shieldBlock(2)`; `yard.blades.executioner.a` → `damageVsBleeding(8)` (one unit). Killing Pace's reason now says one small.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | done   |

Skipped by the user's answers: nothing in the Reaver list rested on U1 alone. Darting Steel (T13) and Footwork (U4) not
touched.

## Ids

- **Added (unregistered, for the coordinator's one registration):** `yard.blood.cleanBreak.a`, `yard.blood.cleanBreak.n`,
  `yard.blood.cleanBreak.b`.
- **Removed:** none.
- **Moved:** `yard.blood.crimsonPact.a/b/k`, `yard.blood.openVeins.*`, `yard.blood.redHarvest.*`, `yard.dual.hotBlood.*`,
  `yard.fosse.flurry.*`, `yard.fosse.marked.*`.
- **Links changed:** inside Ceaseless Blades and Marked Prey (`a–b, b–n` → `a–n, n–b`); new `flurry.b`–`road.f2`,
  `marked.b`–`road.f4`, `festering.n`–`cleanBreak.a`.
- **Re-lined:** Weaving, Sidestep, Field Dressing, Quickened Steel, Buckler, Mended Mail's three smalls, and the small
  re-sizes of R-9.

## Border links laid

One: `yard.blood.cleanBreak.b`–`bow.steel.pitch.n` (seam 1). Pitch Arrows' links then leave at 58°, 125° and 233° (gaps
67° and more). No other border link was added, cut or re-aimed. Reaver–Strider goes from 7 to 8 links if nothing else
on that border changed.

## Lines `lines.ts` lacks

None; every line the brief named exists.

## Checks

- `geometry.ts --region reaver --bends`: 0 crossings, 0 drawn over. Eight bends, all corners of rings that were there
  before (Light Blades, Keen Edge, Twin Fangs, Full Swing / Paired Steel, Steel Rim, and Hot Blood's `c`, still a
  square's corner after the scale). No new bend: the seam's chain and both arcs' legs are straight; Festering turns 55°
  at the notable, where its chain meets the seam (a notable, not a two-link small).
- Fans at the touched road nodes: `f2` 47° smallest gap (unchanged), `f3`, `f4`, `f5` 50°, `j2.a` 43°.
- `passives:audit -- reaver`: 0 problems; every notable 3.0 to 5.0 units (Clean Break 3.5, Weaving 4.0). Clean Break,
  Festering, Ceaseless Blades, Marked Prey, Field Dressing and Sidestep each have two ways in; Crimson Pact's spur stays
  a dead end.
- `tsc --noEmit`: clean. `vitest ip.test.ts names.test.ts`: pass.
- Steps from Clean Break: Crossed Blades **9** (the brief guessed about 5), Deep Cuts 11, Vital Aim 14, Killing Eye 14,
  Fencer's Eye 15, Bright Shafts 16, Deep Pull 17, Mercy Stroke 18. Festering to Fouled Tips **6**. From the starts:
  Strider 14, Reaver 18 (Pitch Arrows stays 12 from the Strider, Festering 16 from the Reaver).
- Pictures: `before.png`, `after.png` (the region), `before-pits.png` / `after-pits.png` (the seam and Crimson Pact),
  `after-fosse.png` (the two arcs), `after-diamonds.png` (Open Veins, Red Harvest, Hot Blood). There is no Fosse "before"
  close-up; `before.png` shows it.

## Allocator (indicative: five other agents were editing at the same time)

`npm run passives:builds -- --only sword-str,axe-bleed,dual-wield`, main stats in units at 120 → 160.

| build      | stat          | before      | after       |
| ---------- | ------------- | ----------- | ----------- |
| sword-str  | life          | 25.8 → 36.8 | 24.2 → 36.6 |
|            | armour        | 17.7 → 30.2 | 21.2 → 26.8 |
|            | sword damage  | 40.9 → 46.9 | 31.8 → 36.3 |
|            | attack speed  | 18.2 → 20.2 | 8.2 → 13.4  |
|            | choice 60/120 | 2 / 2       | 3 / 5       |
|            | tax 60/120    | 28% / 30%   | 33% / 30%   |
| axe-bleed  | life          | 26.2 → 37.2 | 25 → 36.6   |
|            | bleed         | 29.3 → 29.3 | 29 → 29     |
|            | axe damage    | 10.7 → 16   | 14 → 16     |
|            | choice 60/120 | 1 / 3       | 2 / 1       |
|            | tax 60/120    | 32% / 33%   | 32% / 33%   |
| dual-wield | life          | 29.2 → 38.6 | 30 → 35.4   |
|            | dual wield    | 17 → 18     | 18 → 18     |
|            | evasion       | 30.5 → 36.8 | 27 → 36.8   |
|            | choice 60/120 | 1 / 3       | 1 / 3       |
|            | tax 60/120    | 23% / 28%   | 23% / 25%   |

Reading: sword-str's 120 plan is a different plan now (it opens through the Strider at 60, then takes the Vanguard's
Mortar and Stone, Oathbound and Ringing Blows at 120); its attack speed fell with Quickened Steel and `sig.b` smaller and
its sword damage now climbs 14% past 120 (was 15%). axe-bleed's 120 plan reaches into the Strider's bleed bow (Barbed
Arrows, Deep Cuts, Hatchet Work), and its choice at 120 fell from 3 to 1; that is most likely the Strider's edits of the
same hour, not the Reaver's, but round 2 should look. dual-wield is near unchanged. Life climbs past 120 for all three,
as U2 accepts.

## For the coordinator and the user

- **Clean Break is in no plan** of sword-str, axe-bleed, dual-wield or bow-crit at any budget up to 160. The brief's
  "wanted on both sides" holds only in part: the Reaver archetypes weigh physical attack damage (the notable's lead) but
  not generic crit multiplier (only weapon crit multiplier), so for them the cluster is 2 units over 3 points at the end
  of a 16-step walk; bow-crit weighs both but does not walk there by 160. I kept the brief's lines (crit multiplier on
  the smalls is the notable's partner). If round 2 still finds it unwanted, the options are a crit Reaver archetype
  (B9 already asks for the set's blind spots) or the lead on the smalls (`physAttack(10)`), not a move.
- The re-lines take life off the Reaver home (Quickened Steel 6%, Buckler 5%, Field Dressing 5%) and armour off Mended
  Mail (36%); the home still opens on life through the middle road and Stout Heart.
- No item was forced or skipped for the map; nothing in the Reaver list needed a line `lines.ts` lacks.

## Sections checked

CONSTRAINTS §3.5–3.7 (the arcs and the seam are bridges; one border link), §4.5–4.8 (the Reaver keeps life, armour,
evasion, block, flasks; the home is less of a life band), §5.1–5.2 (Weaving, Sidestep and Field Dressing off copied
pairings; Clean Break's twins 9+ steps), §6.2 (the signature and Buckler still worth the first points), §8.1–8.2, §8.6
(every small one unit, every section uniform, notables 3 to 5), §9.1 (Crimson Pact's spur a dead end), §10.3 (every new
line is live in the fight), §11.2 and §11.5 (no crossings, straight legs, the three four-node shapes scaled as wholes),
§14 (no shape moved node by node; no node placed for a number).
