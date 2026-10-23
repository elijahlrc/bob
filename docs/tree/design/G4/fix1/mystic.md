# G4 fix pass 1: the Mystic (`spire`)

Done 2026-10-22 from [fix-1.md](../fix-1.md) §2.3 and seam 3 (§1.1), with the user's answers of the same day (U1 a
non-issue; the C1–C15 rules not adopted, so none is cited). Only `src/data/passives/spire/` was edited: `craft.ts`,
`well.ts`, `frost.ts`, `rim.ts`. Nothing registered, nothing baked, nothing committed.

Pictures (this folder): `before.png` / `after.png` (the region), `before-ids.png`, `before-west.png` /
`after-west.png` (the Cloister and the west climb, ids), `before-seam.png` / `after-seam.png` (Pinpoint to Black
Powder, ids), `after-climb.png` (Quickening's new place and the shortened Prismatic spur, ids).

## Items

| item                     | what was done                                                                                                                                                                                                                                                                                                                                                                                        | result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M-1** (B1 must)        | Keen Verse's four smalls `spellDamage(8)` → `spellCritMulti(12)`; Piercing Word's three → `eleDamageAll(10)`; Living Verse's `a`, `b` → `life(5)` (all three life now). Notables unchanged. The three cluster `why`s rewritten: they had described the smalls as spell damage or as "each start pays in its own coin".                                                                               | **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **M-2** (§1.2 item 9)    | Composure's `a`, `b`, `c` `es(5)` → `stunAvoid(20)` (one unit each). `why` rewritten.                                                                                                                                                                                                                                                                                                                | **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **M-3** (T6 should)      | Quickening moved out of the Cloister to the Belfry's west climb: a V arc hung between `spire.frost.toShatter.r1` and `r2` (the two nodes from the west join up to Shatter), notable at the tip in the open ground between the climb and the Prismatic spur, a small on the straight line to each road node. Same lines. Re-partnering was not needed: it is 7 steps from Siphon by the shortest way. | **Done.** Zealot start → Quickening 14 → **23**; Mystic start 16 → **19**; Siphon 7, Hoarfrost 6, Composure 10, Glass Skin 12, High Veil 14. The shield caster's shield notables now lie in three directions with three partners: mana (Glass Skin, at the wheel), stun (Composure, the Cloister), recharge and hit recovery (Quickening and Siphon, up the spine, 7 apart). The Cloister keeps Glass Skin, Deep Well and Composure; its road to the Undercroft keeps Living Verse at `toCrypt.r2`. |
| **M-4** (D6 should)      | `spire.craft.focus.c` `mana(8)` → `castSpeed(4)`. Ready Wit's two smalls are spell damage and cast speed; Warded Mind's mana and chaos resistance. The wheel's `why` rewritten (it said "mana at both ends").                                                                                                                                                                                        | **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **M-5** (D2 must)        | Hexwright `curseEffect(12), curseArea(15), skillDuration(10)` → `curseEffect(20), manaRegen(15)` (2.5 + 1.5 = 4 units). `curseArea` and `skillDuration` imports dropped from `craft.ts`.                                                                                                                                                                                                             | **Done** with the mana partner, as §1.2 item 11 says until the coordinator settles whether skill duration reaches a cast curse.                                                                                                                                                                                                                                                                                                                                                                     |
| **M-6** (S5/S8 consider) | Prismatic Balance's spur: `spire.frost.prismatic.c` removed (a retired hole), `b`–`k` linked, the keystone pulled in along the spur's own line to 85 from `b` ((-856,-4053)). `why` rewritten (it said three nodes, two ways in, "where the ignite room arrives", all stale).                                                                                                                        | **Done.** Keystone 20 → 19 from the Mystic start; still a dead end.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **M-7** (seam 3)         | New cluster `spire.rim.needlework` (`rim.ts`): Pinpoint – `a` – `b` – **Needlework** – `c` – Black Powder, on the straight line between the two notables. Notable `attackSpeed(10), critChance(22)` (3.5 units); smalls `critChance(15)`. Notable at (1597,-3776), smalls at 70 / 125 towards Pinpoint and 70 towards Black Powder.                                                                  | **Done.** See the seam section below.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **M-8** (D4)             | `spire.frost.shatter.a/b/c` `freezeChance(5)` → `freezeChance(8)`; `spire.well.wandwork.a` `wandSpellDamage(10)` → `wandSpellDamage(8)`.                                                                                                                                                                                                                                                             | **Done.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Not touched, as the brief says (only if the spot is touched): the junction smalls `spire.column.broadWeave.a`,
`spire.craft.mistWalk.a` (N10), the near-misses at `spire.well.draught.a`, `spire.craft.j1.a` (L9). High Veil / Cold
Light stay the named cul-de-sac (N7).

Left on purpose: Prismatic Balance's and Fever Pitch's spur smalls are `eleDamageAll(8)` (0.8 of a unit). D4 did not
list them (they are off by exactly a fifth); left for the coordinator's off-unit list (§3 item 2).

## The seam (M-7)

- **Border link laid:** `spire.rim.needlework.c` – `knife.hex.powder.n`. Plus the Mystic-side link
  `spire.rim.pinpoint.n` – `spire.rim.needlework.a`. No other border link was added, cut or re-aimed. Black Powder's
  file (`knife/hex.ts`) was not edited.
- **Steps:** Mystic start 22 (through the Gallery stair and Black Powder), Shade start 20. Pinpoint 3, Black Powder 2.
- **Twins:** no other notable in the network pairs attack speed with crit chance (checked over the built tree). Other
  notables near it: Snare Line 7, Bad Company 7, Mist Walk 7, Live Current 8, Sharp Tongue 8, Shifting Ward 7,
  Ritual Blade 7; Wand Volley 14, Bright Wand 17, Deft Wand 25; Cold Steel (`knife.snares.frost.n`) 18, Crossed
  Blades 33.
- **Angles:** at Pinpoint the three links are about 80°, 138° and 142° apart; at Black Powder about 80°, 110° and
  170°. The chain is straight; Pain Conduit's keystone is about 280 units below the line, Bad Company east of it.
- **Name:** Needlework (fast, precise work). Not in `ref-tree.json`; no other Bob node uses it (Darting, Quick, Sharp
  and Hand names were avoided: L11).

## Ids for the coordinator

- **New (to register):** `spire.frost.quickening.a`, `.n`, `.b`; `spire.rim.needlework.a`, `.b`, `.n`, `.c`.
- **Retired holes:** `spire.well.recharge.a`, `.n`, `.b`; `spire.frost.prismatic.c`.
- **Changed lines:** `spire.craft.keenVerse.a–d`, `spire.craft.focus.c`, `spire.craft.hexwright.n`,
  `spire.well.livingVerse.a/b`, `spire.well.composure.a/b/c`, `spire.well.wandwork.a`, `spire.frost.piercing.a/b/c`,
  `spire.frost.shatter.a/b/c`.
- **Moved:** `spire.frost.prismatic.k`.
- Docs that still cite `spire.well.recharge` (G-growth, G1/G2/G3 reports) were not edited.

Lines needed that `lines.ts` lacks: none. The open engine question is the coordinator's §3 item 4 (does
`skillDuration` reach a cast curse); Hexwright took `manaRegen(15)` meanwhile.

## Checks

- `npx tsc --noEmit -p .`: clean.
- `geometry.ts --region mystic --bends`: 0 crossings, 0 drawn over; 14 bends, all inside rings, squares and the home
  pockets as before; no new bend (the two new chains are straight; the Quickening V bends at its notable).
- `npm run passives:audit -- mystic`: 0 problems; Needlework 3.5 units, Hexwright 4.0, Quickening 5.0; every
  touched cluster has two ways in except the keystone spur (a dead end, as it should be).
- `npx vitest run src/data/ip.test.ts src/data/passives/names.test.ts`: pass (names.test reads the bake, so the new
  name was also grepped in `ref-tree.json`: absent).

## Allocator readings (indicative: other regions were being edited at the same time)

`npm run passives:builds -- --only caster-es,caster-life,summoner,wand-attack,channeller`, before my first edit and
after my last. Main stats at 120 → 160 points, and choice (plans within 5%) at 60 / 120:

| build       | stat                          | before 120 → 160 | after 120 → 160 | choice 60 / 120 before → after |
| ----------- | ----------------------------- | ---------------- | --------------- | ------------------------------ |
| caster-es   | spell damage                  | 222 → 262        | 178 → 242       | 5 / 2 → 2 / 2                  |
|             | energy shield                 | 174 → 259        | 193 → 241       |                                |
|             | cold (units)                  | 10 → 14.4        | 12 → 16.6       |                                |
| caster-life | spell damage                  | 202 → 298        | 130 → 226       | 2 / 6 → 1 / 5                  |
|             | elemental (units)             | 20.8 → 23.2      | 23.8 → 25.4     |                                |
|             | life                          | 169 → 169        | 179 → 179       |                                |
|             | spell crit (units)            | 3.2 → 13.4       | 7.2 → 17.4      |                                |
| summoner    | minions (units)               | 26.5 → 30.5      | 26.5 → 31.5     | 1 / 4 → 2 / 3                  |
|             | energy shield                 | 249 → 285        | 223 → 268       |                                |
|             | life                          | 67 → 127         | 90 → 137        |                                |
| wand-attack | wand damage (units)           | 12.7 → 16.3      | 17.3 → 17.3     | 2 / 3 → 2 / 3                  |
|             | energy shield                 | 179 → 250        | 137 → 208       |                                |
|             | attack speed (units)          | 16.2 → 16.2      | 18.2 → 18.2     |                                |
| channeller  | channelling and spell (units) | 31.8 → 42.8      | 31.3 → 33.8     | 2 / 7 → 3 / 5                  |
|             | mana sustain (units)          | 23.8 → 29.3      | 22.5 → 26.8     |                                |
|             | energy shield (units)         | 34.2 → 48.6      | 32.2 → 48       |                                |

The five builds' targets: typical gain past 120 29% → 20%, main stats gaining 10% or less 18% → 35%; choice at 120
still no single-plan build; tax 31% → 34%.

What the readings say, for the coordinator and audit round 2:

- **Spell damage came down as intended** (caster-es 222 → 178, caster-life 202 → 130 at 120) and the partners rose
  where wanted (caster-life spell crit 3.2 → 7.2 units at 120, elemental 20.8 → 23.8; caster-es cold 10 → 12).
- **But two builds now read flatter, not hungrier.** The channeller's spell damage climbs only 178 → 198 past 120 (it
  was 182 → 270): the spell damage smalls that were still on the table are gone, and it does not weigh the partners
  (crit multiplier, elemental damage, life). The wand attacker now takes Pinpoint and Needlework by 120 (both were out
  of reach or not worth the trip before), so its wand damage and attack speed are finished and it pays in energy shield
  (179 → 137 at 120); that is the U2 kind of trade (the weapon, not all the shield). Whether the network now holds too
  little plain spell damage far out for a caster who wants only that is a question for audit round 2 with all regions
  done, not something to answer by putting spell damage back on smalls.
- caster-life has one plan only at 60 (it had two); caster-es's 60-point choice fell 5 → 2. Both read at
  60 with other regions mid-edit; re-measure.
- The channeller's 60-point plan reports "short of gear: int 10".

## Sections of CONSTRAINTS checked

§1.1 (tension one constraint among many: every change is a re-line, a move, a cut of one small or the seam; no road
added), §2.4 (the new name), §3.5–3.6 (Quickening and Needlework are bridges with two ways in; the spur stays a dead
end), §3.7 (one border link, the seam's), §4.5 (the Mystic keeps energy shield at home in Glass Skin and Deep Well,
and life, stun, block, dodge), §4.6 (spell damage is still sold on Ready Wit, First Light,
Long Chant and the notables of the three re-lined clusters), §4.8 (the Cloister keeps offence in Wandwork, Deep Well's
cast speed and Living Verse; the Ready Wit wheel's offence side gains cast speed), §5.1–5.2 and §5.5 (partners on the
smalls; Needlework 3 from Pinpoint, no other attack-speed-with-crit notable; Quickening 7 from Siphon), §6 (the first
notables unchanged; Quickening and the seam far from every start), §8.1–8.2 and §8.6 (every touched small one unit,
sections uniform, notables 3.5 to 5 units), §9.1 (the Prismatic spur shorter, still a dead end), §10.3 (Hexwright's
dead curse area gone), §11.5 (straight chains, smalls about 70 from their notable, a V for the arc, no crossing, no
node drawn over another), §12.2 (an existing cluster moved where a constraint needed it), §14 (nothing placed for a
number).
