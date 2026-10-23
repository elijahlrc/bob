# G4 fix pass 1: the Shade (`knife`)

Carried out 2026-10-22 from `G4/fix-1.md` §2.2 (items K-1 to K-7) with the user's answers of the same day (U1 a
non-issue, U2 accepted, U4 Footwork stays; C1–C15 not adopted, so nothing below cites them). Only files in
`src/data/passives/knife/` were edited. No register, no bake, no commit. The Shade owns no seam cluster: seam 3 lands
on `knife.hex.powder.n` (the Mystic's work) and seam 4 on `knife.rim.wall.s6` (the Strider's work). Neither node was
moved, and no border link was laid, cut or re-aimed.

## Items

| id  | result        | what was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K-1 | done          | `knife.home.roadB.b` is now the notable **Quick Wrists**: `attackSpeed(10), dodgeAttack(3)`, 3.0 units, 4 steps from the start on the signature's road. `roadB.a` and `.c` are `attackSpeed(5)`, one unit each (D4). The road is re-spaced as a tight cluster on its straight line: `a` P(290,0), notable P(360,0), `c` P(430,0). Twins: Soft Step is 6 steps away (evasion, movement, dodge: it leads with evasion), Raking Hand 8 (claw speed), Rat Bite 24 (poison with speed). Net supply: three 1.6-unit smalls (4.8) become 1 + 3 + 1 (5.0), about +0.2 units as the brief said. The home stays mixed (§4.8): Soft Step is defence, Spoils sustain, Quick Wrists offence. |
| K-2 | done, renamed | `knife.snares.mercy.n` keeps `critMulti(25)` and takes `poisonDamage(16)` in place of the low-life damage: 3.4 units, the same price as before (§8.6). Its two smalls stay crit multiplier. **Renamed Wasp Sting**: "Mercy Stroke" names the finishing blow on the low-life target, which the node no longer gives, and it is also a gem name in `src/data/gemsGen.ts`. Twins: Barbed Point (poison, crit chance) 9 steps, Smeared Edge (poison, a dagger) 5, Rat Bite (poison, attack speed) 16, Killing Eye 12 and now a different pairing. The border link to Venom Fletching stays (see "For the coordinator").                                                             |
| K-3 | done, renamed | `knife.roofs.hasty.n` is `spellDamage(20), dodgeSpell(5)`, 4.2 units; its three spell damage smalls are unchanged. **Renamed Thrown Voice**: "Hasty Words" promised the cast speed it no longer has. Shifting Ward (energy shield with spell dodge) is 9 steps away and leads with the shield; Spellslip is 14.                                                                                                                                                                                                                                                                                                                                                                 |
| K-4 | done          | `knife.home.quietKnife.n` is `daggerSpellDamage(20), manaRegen(15)`, 4.0 units; `.a` and `.b` are `daggerSpellDamage(8)`. It is the dagger caster's alone now (§10.2). Its partner, mana, differs from the other dagger-caster clusters: Sharp Tongue (cast speed) 15 steps away, Athame (spell crit) 16, Ritual Blade (energy shield) 22. Spoils (mana regeneration with mana on kill and flasks) is 6 steps away and leads with mana; Quiet Knife leads with the dagger spells. Still 7 steps from the start.                                                                                                                                                                 |
| K-5 | done          | **Glint** is an arc between the seawall corner `wall.s1` and the rooftop road's `walk.r4`. Its notable is at the top of the arc, about (3540,-2460). Two spell crit smalls continue the seawall road's line north-west from `s1`, and one spell crit small runs on toward `r4`. That makes a loop r4–Glint–s1–r5, `r4` gets its first branch, and `s1` becomes a clean T (the road through, `r5` at 84°). **Long Grudge** is an arc east between `s2` and `s3`, notable at about (4268,-1761), one curse small on each side (50° off the road at both ends). Rat Bite stays the far tip. Ill Wish is 9 steps from Long Grudge (§5.5 holds).                                     |
| K-6 | done          | `knife.hex.road.a`: the lone energy shield small is now an attribute node `dex(6), int(6)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| K-7 | done in K-1   | The Shade's only D4 re-sizes are the blade road's smalls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Done differently from the brief (K-5, Glint).** The brief proposed a bare link from Glint's notable, still at the rim
tip, to `r4`. That is a 602-unit link, with all three smalls on the `s1` side and a 90° turn at the end of a straight
pocket. I re-shaped the cluster as an arc instead, the way the network audit's other rim arcs are hung (Long Chant,
Pinpoint). The links are the same (`s1` in, `r4` out); the shape is tighter and has a small on each side. Glint moved
about 280 units in from the rim.

## Ids

- **Added:** none. **Removed:** none. No id changed, so there is nothing to register.
- **Kind changed:** `knife.home.roadB.b` (small → notable), `knife.hex.road.a` (small → attribute).
- **Re-lined:** `knife.home.roadB.a/b/c`, `knife.home.quietKnife.a/b/n`, `knife.snares.mercy.n`,
  `knife.roofs.hasty.n`, `knife.hex.road.a`.
- **Renamed (name only):** `knife.snares.mercy.n` Mercy Stroke → Wasp Sting; `knife.roofs.hasty.n` Hasty Words → Thrown
  Voice. New notable: `knife.home.roadB.b` Quick Wrists. All three names are absent from `ref-tree.json`, and
  `ip.test.ts` and `names.test.ts` pass (names.test reads the baked tree, so it checks them only after the bake).
- **Moved:** `knife.home.roadB.*` (re-spaced on their line); `knife.rim.glint.*`, `knife.rim.grudge.*` (now arcs).
- **Links inside clusters:** Glint `a–b, b–n, n–c` (was `a–b, b–c, c–n`); Long Grudge `a–n, n–b` (was `a–b, b–n`).
- **New links, all inside the Shade:** `knife.rim.glint.c – knife.roofs.walk.r4`, `knife.rim.grudge.b – knife.rim.wall.s3`.
- **Border links laid:** none (the Shade owns no seam). None touched.
- **Whys rewritten:** every changed node and cluster; stale mentions of the old names and pairings in `roofs.ts`
  (crossroad, Ill Wish, Salt in the Wound, Athame, Ritual Blade), `snares.ts` (Smeared Edge, the Venom Fletching link,
  the road onto Wasp Sting), `edge.ts` (the claw bridge) and the seawall road's nodes; `walk.r4` got a why. Whys in
  other regions' files that name "Mercy Stroke" or "Hasty Words" were not touched. A grep at the time found none
  outside the knife folder (`gemsGen.ts` has the unrelated gem).

## Lines `lines.ts` lacks

None. Every line used exists: `attackSpeed`, `dodgeAttack`, `dodgeSpell`, `poisonDamage`, `daggerSpellDamage`,
`manaRegen`, `dex`, `int`.

## Checks (at the end)

- `geometry.ts --region shade --bends`: 0 crossings, 0 drawn over. 9 bends, all on wheels and the Athame hexagon, and
  all there before this pass. No new bend: the Glint and Long Grudge smalls sit on straight lines, and their arcs turn
  only at the notables.
- `passives:audit -- shade`: 0 problems. Notables in units: Quick Wrists 3.0, Wasp Sting 3.4, Quiet Knife 4.0, Glint 4.0,
  Long Grudge 4.0, Thrown Voice 4.2.
- **Ways in:** Glint and Long Grudge now have two each. Quick Wrists is on a through road (the signature and the wheel).
  Wasp Sting is unchanged (`toBow.b` and Venom Fletching). Quiet Knife and Thrown Voice are single pockets as they
  were, a near-home pocket and a deliberate far tip (§3.5 allows both).
- `npx vitest run src/data/ip.test.ts src/data/passives/names.test.ts`: passes. `npx tsc --noEmit -p .`: clean for the
  knife folder. Two unused-import errors at the end were in `bow/flight.ts` and `cathedral/rim.ts`, other agents'
  files mid-edit.
- **Pictures** (`docs/tree/design/G4/fix1/shade/`): `before.png` and `after.png` (the region),
  `before-home-ids.png` and `after-home-ids.png`, `before-seawall-ids.png` and `after-seawall-ids.png` (the rim arcs),
  `after-blade-road.png` (close-up of Quick Wrists).

## Allocator readings (indicative: the other five regions were being edited at the same time)

`passives:builds --only dagger-crit,claw-poison,trap-mine,dagger-caster,curser,dodge-blades`, before my first edit
against after my last. Main stats at 120 → 160, then choice at 120:

| build         | before                                                                                   | after                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| dagger-crit   | crit 22.2 → 24.2 u, dagger 6.6 → 10.2 u, evasion 34 → 38.8 u, life 27 → 42.6 u; choice 2 | crit 17.5 → 27.2, dagger 4 → 13.2, evasion 36.7 → 41.7, life 30.4 → 31.4; choice 3 (60: 3 → 6) |
| claw-poison   | poison 15.2 → 21.8, claw 8 → 11.6, life 29.2 → 40.6; choice 3 (60: 1)                    | poison 16.5 → 24, claw 8 → 11.6, life 29.4 → 29.4; choice 3 (60: 1)                            |
| trap-mine     | trap/mine 9.7 → 13.7, ES 37.8 → 47.4, evasion 30 → 33.3; choice 5                        | 10 → 13.7, ES 32.8 → 38.4, evasion 33.3 flat; choice 6                                         |
| dagger-caster | spell 45.5 → 48.5, spell crit 5.2 → 10.2, ES 30.4 → 48.6; choice 9 (60: 1)               | spell 31.5 → 41, spell crit 12.2 → 17.2, ES 33.2 → 43.8; choice 9 (60: 3)                      |
| curser        | curses 19 → 23, chaos/DoT 14.7 → 16.3, ES 39 → 50; choice 5                              | curses 10.5 → 22.5, chaos/DoT 12.3 → 16.3, ES 39.6 → 46.6; choice 6                            |
| dodge-blades  | dodge 18.3 → 25, evasion 34 → 38.8, life 25 → 38.6, blades 13 → 15; choice 4             | dodge 19.3 → 26, evasion 33.2 → 36.7, life 24 → 30.4, blades 15 → 17.6; choice 2 (60: 3 → 5)   |

What my changes did, as far as the plans show:

- **Quick Wrists** is in all three attackers' plans at 60 and 120 (dagger-crit, claw-poison, dodge-blades). The
  attackers' 60-point plans by region, after (before, from the brief): dagger-crit Shade 28 / Strider 27 (25 / 28),
  claw-poison 25 / 29 (24 / 31), dodge-blades 32 / 27 (29 / 26). The attackers lean back toward home, and the
  Strider's own re-lines (Wanderer, Fleet Foot, True Aim) were not in yet when this was measured.
- **Wasp Sting** is in claw-poison's plans at 60 and 120 and in dodge-blades' at 120. dagger-crit dropped Mercy Stroke
  from its gave-up list; Wasp Sting shows there at 2.1 units. Killing Eye now appears on dagger-crit's 120 gave-up list
  as the crit multiplier the bow sells.
- **Quiet Knife** is in the dagger caster's plans at 60 and 120, and at 60 that plan now goes north-east: Quiet Knife,
  Athame, Ritual Blade, Glint and Thrown Voice. Its 60-point choice went from 1 to 3, its spell crit at 60 from 2 to 7
  units, and its tax from 42% to 38%. Its plain spell damage falls (Quiet Knife no longer sells it), and daggered spell
  damage rises.
- **Thrown Voice** is taken by the dagger caster (60, 120) and the curser (60). It sits on the curser's 120 gave-up list
  at 2.5 units.

## For the coordinator and the user

1. **Two renames** (Mercy Stroke → Wasp Sting, Hasty Words → Thrown Voice) were not in the brief. Both old names
   described lines the nodes no longer carry, and Mercy Stroke was also a gem's name. Easy to revert if unwanted. Docs
   outside `src/` (G3 reports, the audits, the fix brief) still use the old names.
2. **Wasp Sting and Venom Fletching are 3 steps apart, and both now carry poison.** Venom Fletching leads with chaos
   attacks and Wasp Sting with crit multiplier, and the brief keeps their border link. Still, a crit poison bow coming
   in by that link now finds poison twice for one small. If audit round 2 shows a poison bow or claw taking both every
   time, the remedy is on the Strider's side (Venom Fletching's `poisonDamage(12)`) or a different Wasp Sting partner.
   claw-poison takes both today.
3. **Glint is 6 steps from Athame now (was 10).** That is still at the §5.2 minimum or above, and they have different
   partners (insight against a dagger). The r4 bridge brings Glint into the dagger caster's 60-point plan. I read it as
   the Shade caster finding its spell crit at home rather than in the Spire, but audit round 2 should look at whether
   the north-east has become the dagger caster's one stop (Athame, Ritual Blade, Glint and Thrown Voice are 6 to 10
   apart, so none sits within 5 of two others).
4. Seams 3 and 4 were not in when I finished (`s6` had only its old links), so their twin checks from the Shade side
   (Rat Bite about 7 from seam 4's notable, Quick Wrists against seam 3's attack speed) are for the whole-tree check.

## CONSTRAINTS sections checked

§3.5–3.6 (two ways in; the rim arcs; pockets as bridges, far tips kept), §4.5–4.8 (the home stays mixed; the Shade
sells attack speed in its own voice), §5.1–5.2 and §5.5 (twins from each changed notable, measured above), §6.2 and §6.5
(a notable at 4 steps; smaller first smalls), §7.1 (the barb's road node is an attribute), §8.1–8.2 and §8.6–8.7 (one
unit per small, uniform sections, 3 to 5 units, the road's smalls now belong to a notable), §9.1 (no keystone spur
touched), §10.2–10.3 (Quiet Knife no longer splits two builds; every line is live in the fight), §11.5 (tight clusters,
straight chains, arcs turning only at their notables, 0 crossings), §2.4 (names checked), §12.4 (no bot sim).
