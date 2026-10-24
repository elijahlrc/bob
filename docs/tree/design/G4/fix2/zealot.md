# G4 fix pass 2: the Zealot (`cathedral`)

Done 2026-10-23 from `G4/fix-2.md` §2.4, against CONSTRAINTS.md as it stands (no new rules). Files touched:
`src/data/passives/cathedral/rods.ts`, `ambulatory.ts`, `rim.ts`, `home.ts`. No id added or removed, nothing registered or
baked, no commit. Pictures: `G4/fix2/zealot/before.png`, `after.png`, and close-ups `warding.png`, `crozier.png`,
`procession.png`, `hymn.png`.

## Items

### Z-1 (T3) Warding Staff: done

`cathedral.rods.warding`: the notable is `staffDamage(24), staffSpellBlock(4)` (2 + 2 = 4 units), and its smalls `a`, `b`, `c`
are `staffSpellBlock(2)`. The cluster and notable `why`s say what it is now: the staff side of seam 5, two steps north of
Twofold Guard's shield. The `spellBlock` import left `rods.ts`.

The allocator's readings (indicative):

- **mace-shield:** Warding Staff is gone from its gave-up list. It was 1.2 at 60 and is now 0.
- **block-caster:** it still crosses `warding.a` and `warding.n` to reach Twofold Guard, which hangs only off
  `warding.n` on the Zealot side. That is the 6 `staffSpellBlock` in its spell-block row from 80 points. The
  archetype gives those nodes no value (its weights have no `staffSpellBlock`), so the staff notable is now a toll on the
  shield build's way to Twofold Guard, not a stop it buys. That is the "fair price" of §5.5.
- **staff-block:** its block reaches the same 15.5 units at 120 as before (now 18 spell block + 10 staff spell block +
  3 attack block). At 60 it is lower (4, was 10.5): Warding Staff and Crozier are both on its gave-up list at 60
  (4.0 each) and both are in its plan by 100.

### Z-2 (D1) Crozier: done

`cathedral.ambulatory.crozier`: the notable is `staffSpellDamage(20), castSpeed(6)` (2.5 + 1.5 = 4 units), and the smalls
`a`, `b` are `staffSpellDamage(8)`. The cluster `why` is rewritten: the whole cluster is the staff caster's, and the
attack staff's homes are Quarterstaff and Warding Staff. `spellDamage` and `staffDamage` left the imports, because Crozier was
their only user in `ambulatory.ts`.

The allocator's readings: staff-block takes Crozier by 100 points (`staffSpellDamage` 36 from 100). Its spell damage at
120 is 32.6 units (was 30.1) and at 160 is 41.9 (was 31.1), so it keeps its reason to walk there.

### Z-3 (N4) Procession–Grim Oath: done, with a re-lay

The link `cathedral.rim.procession.c` → `wall.maces.oath.n` is cut. Without it, `procession.c` would have been a dead-end small
past the notable, bent about 40° away from the chain for a link that no longer exists. So the pocket is re-laid as a straight run
with the notable at the tip: Censer → `a` → `b` → `c` → `n`. `a` and `b` did not move, `c` moved to P(2638, -1799), and
`n` moved to P(2651, -1868) (cluster `at` too). The spacing is 55 / 55 / 70.

- The links inside the cluster are now `a-b`, `b-c`, `c-n` (was `n-c`).
- The notable is one step farther from Censer, which matters little: Procession was in no plan and still is not.
- The `why`s of the cluster, of `c`, of the `rim.ts` header and the area, and of Censer's cluster in `ambulatory.ts` no
  longer say it bridges to Grim Oath.

Grim Oath keeps `oath.a` (to `toHymn.r4`) and `rim.a`. Procession has one way in (Censer). It is a far tip, which the item intends
and §3.5 allows for a single pocket.

Zealot–Vanguard border, counted from `buildAll`'s links: **8 → 7**. The seven are hammer.c–toWall.a, toHymn.r4–hymn.b
(Battle Hymn), hubs.w–banner.n, resists.j.a–nave.toWall.a, verger.c–resists.j.a, guard.b–posts.n and
scarTissue.n–toWall.a.

### Beyond the list: Hymn's layout after M-1 (`home.ts`)

The Mystic's M-1 moved the crossing off `cathedral.home.hymn.b`. That left `hymn.b` a two-link node that doubled back at
132°: it sat past the notable, away from the road, with a 330-unit link back down to `roadE.a`. This was the one new bend
`geometry --bends` showed in the region.

No link changed. The pocket is re-laid as a right-angled triangle on the east road's first leg:

- `hubs.e` and `roadE.a` are the base corners.
- The notable is at the apex, P(347, 394).
- A small sits halfway along each side: `a` P(298, 337) and `b` P(403, 345).

The smalls are about 75 from the notable, and `hymn.b` now lies straight between the notable and the road. The cluster `why`
no longer says "pointing at the Spire". Step counts are unchanged, and Hymn keeps two ways in (`hubs.e` and `roadE.a`). The crossing at
`roadE.b` is the Mystic's link and was not touched.

## Border links

- Cut: `cathedral.rim.procession.c` – `wall.maces.oath.n` (Z-3).
- Moved by the Mystic (M-1, in `spire/well.ts`): the crossing now lands on `cathedral.home.roadE.b`. Mystic–Zealot is
  still 7.
- No other link across a region line was added, cut or re-aimed.

## Lines `lines.ts` lacks

None. `staffSpellBlock` and `staffSpellDamage` were already there.

## Checks

- `npx tsc --noEmit -p .`: clean.
- `geometry.ts --region zealot --bends`:
  - 0 crossings and 0 drawn over.
  - 18 bends listed. All are the wheels' and stars' ring corners and `walk.road.n1`, which were all there before.
  - No new bends: `hymn.b`'s 132° is gone, and Procession is straight.
- `passives:audit -- zealot`:
  - 0 problems.
  - Every notable is 3.0 to 4.6 units. Warding Staff, Crozier and Procession are 4.0 each.
  - The areas touched (`cathedral.home`, `ambulatory`, `rods`, `rim`) each keep three or more ways in.
- `vitest src/data/ip.test.ts src/data/passives/names.test.ts`: 6/6 passed. No new names.
- `buildAll`: 0 problems.

## Allocator (indicative: four other agents were editing at the same time)

Before was measured before my first edit, and after once my edits were done. Others' changes are mixed into both (M-1, K-1 Thick
Blood and others), so only the rows my items touch are read as mine.

| build        | choice 60 → after | choice 120 → after | main stats at 120 → 160 (after)                                         |
| ------------ | ----------------- | ------------------ | ----------------------------------------------------------------------- |
| staff-block  | 5 → 5             | 5 → 6              | spell 32.6 → 41.9 (was 30.1 → 31.1); block 15.5 → 17.5 (was flat 15.5)  |
| block-caster | 2 → 4             | 3 → 6              | block 12 → 13.5; spell block 13 → 13 (was 14 → 14)                      |
| mace-shield  | 3 → 3             | 7 → 5              | block 29.5 → 29.5; Warding Staff no longer on its gave-up list          |
| fire-burn    | 2 → 2             | 5 → 8              | fire 32.5 → 37.5                                                        |
| storm-caster | 3 → 4             | 6 → 6              | spell 23.9 → 30.4                                                       |
| spell-totem  | 4 → 4             | 8 → 8              | spell 25.8 → 36.4; Crozier left its gave-up lists (see below)           |
| aura-brand   | 3 → 3             | 5 → 6              | auras 23 → 23 (flat, as before); Procession in no plan, before or after |
| warcry-totem | 3 → 3             | 4 → 4              | warcries 12.8 → 12.8; neither Battle Hymn nor Procession in a plan      |

## For the coordinator

1. **spell-totem's weights** (`scripts/passives/archetypes.ts`) carry `staffDamage: 0.6` and `weapon('staff', 0.6)`. Those are
   staff attack lines, which a spell totem cannot use. It has no `staffSpellDamage`, so after Z-2 Crozier is worth nothing to it. If the
   archetype means "a staff caster's totems", it wants `staffSpellDamage` in place of `staffDamage`. I did not edit it.
2. **block-caster's spell-block row** counts the `staffSpellBlock` of Warding Staff, which it only crosses to reach Twofold
   Guard (the shared family `F.spellBlock` includes `staffSpellBlock`). The value it plans by is right (zero), but the report row
   overstates its spell block by 6.
3. **The Hymn re-lay** goes slightly beyond the item list. It is a layout consequence of M-1 in my folder, with no link
   changed. Check it in the whole-tree geometry once the Mystic's `toCathedral.b` has settled.

## CONSTRAINTS sections checked

§3.5 (ways in; Procession a single pocket), §3.7 (border count), §5.1 and §5.5 (the staff-or-shield fork at seam 5;
Crozier's partner is cast speed, Warding's is staff damage, Quarterstaff's is attack block), §8.2 (every section's smalls
uniform), §8.3, §8.6 (units), §10.2 (Crozier is one theme now), §10.3 (both staff lines are live under `wieldingStaff`),
§11.5 (straight chains, a regular triangle for Hymn, no crossings, nothing drawn over), §14 (no new rules).
