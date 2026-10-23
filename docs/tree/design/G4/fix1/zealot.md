# G4 fix pass 1: the Zealot (`cathedral`)

Done 2026-10-22 from [fix-1.md](../fix-1.md) §2.4 (items Z-1 to Z-10, seams 2 and 5), with the user's answers to the brief
(U1 a non-issue, U2 accepted, U4 no move; C1–C15 not adopted). Only files in `src/data/passives/cathedral/` were edited.
Nothing was registered, baked or committed. Pictures: `zealot/before.png`, `zealot/after.png` (the region, same box and
width), close-ups `zealot/cu-southwest.png` (Battle Hymn, the Churchyard arcs, seam 5), `zealot/cu-north.png` (the Lychway
arc, seam 2), `zealot/cu-nave.png` (Vigil and Litany off Hearthfire); the close-ups are after only, with ids.

## Items

| id   | result                  | what was done, and why where it differs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Z-1  | done                    | Hymn `cathedral.home.hymn.n` = `spellDamage(16), eleDamage('lightning', 16)` (3.6 units); `hymn.a`, `.b` = `eleDamage('lightning', 10)`. 4 steps from the start. Reasons, the area's and the header's text updated (the east hub's pocket is a spell pocket now).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Z-2  | done differently (half) | Vigil: `vigil.a` re-hung from Hearthfire onto the transept `cathedral.home.jT.a` and moved onto the straight line Vigil→transept (P(978, 293)); Vigil is now a bridge transept → Choirmaster's `c2`, 7 steps. Litany: the link Hearthfire–`star.w` is **cut, not re-aimed**. The junction the audit names for it (the attribute node south-west of Litany, `cathedral.nave.jN.a`) already takes the star's fire spoke; a second spoke onto it would close a triangle of the star on one node and leave `jN` with two links about 22° apart. So `star.w` (cold resistance) is the star's one point that lands nowhere, and Litany keeps three ways in (`f`→`jN`, `e`→the road to the Vestry, `s`→the road to Choirmaster), now 11 steps (was 9). Hearthfire has only its wheel's two links. |
| Z-3  | done                    | The Homily wheel's ends `cathedral.crypt.wheel.m1`, `m4` from `es(5)` to `spellBlock(2)`. The wheel reads spell damage one way, spell block with Glass Wall's flat energy shield the other.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Z-4  | done                    | Procession `cathedral.rim.procession.n` = `auraEffect(12), moveSpeed(8)` (4 units; life out). The Zealot's flasks: the centre's Provisions (6 steps), said in its reason.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Z-5  | done                    | Each pocket re-laid as a whole as a tent arc between its two road nodes, notable at the chord's middle pushed 160 off the leg, smalls on the straight lines from the notable to the two ends (70, 125 out on one side, 70 on the other): **Wake** between `rim.walk.o2` and `o1` (inward; new link `wake.c`–`o1`), **Buttress** between `o3` and `o2` (outward; new link `buttress.c`–`o2`), **Rood Screen** between `walk.road.n3` and `n2` (inward, 192 from the Sigil Warden keystone; new link `rood.c`–`n2`). Brazier and Vespers stay the far tips. Fans at the road nodes: the narrowest gap is 38° (`o2`, `o3`), none under 30°. The Lychway elbow `walk.road.n1` still has nothing off it (only Kindled Steel's link and `n2`); left, as the brief allowed (L10).                 |
| Z-6  | done                    | `cathedral.ambulatory.toWall.c`, `.d` removed (retired ids), with their link to the Wall's Stagger. Battle Hymn re-hung as a bridge on **one straight line** from the Rampart road's junction `toWall.a` to the Wall's `wall.maces.toHymn.r4`: `toWall.a` → `toWall.b` (moved onto that line) → `hymn.a` → Battle Hymn → `hymn.b` → `toHymn.r4`. The border link `toHymn.r4`–`hymn.b` lives in `wall/maces.ts` and was not touched; `hymn.b` only moved. Moving `toWall.b` took away the 102° bend a corner there would have made. Stagger now hangs off `stagger.a` alone (one way in), as N6 and the brief accepted.                                                                                                                                                                     |
| Z-7  | done                    | The Bell Tower wheel's entrances: `cathedral.pyre.wheel.f1` = `eleAttackOne('cold', 12)`, `f4` = `auraEffect(6)`, as written. Each entrance touches both sides, so a walk through the wheel now pays one small of the side it does not take; said in the reasons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Z-8  | done (seam 2)           | New cluster `cathedral.crypt.omen` (**Bright Omen**): Shattering Rite → `omen.a` `manaRegen(10)` → `omen.n` `spellCrit(30), manaRegen(15)` (3.5 units) → `omen.b` `manaRegen(10)` → the Mystic's Cinder; a straight chain at the chord's middle, (-1361, -3696). 21 steps from the Zealot start, 23 from the Mystic's. Twins from the new notable: Cold Light (spell crit with cold) 7, Flashpoint 13, Keen Verse 18, Sharp Mind 21; mana regeneration's others 16+ (Draught, Long Chant, Hexwright, Thunder Peal). No shop: it is in none of the seven plans below.                                                                                                                                                                                                                       |
| Z-9  | done (seam 5)           | New cluster `cathedral.rods.guard` (**Twofold Guard**): Warding Staff → `guard.a` `shieldBlock(2)` → `guard.n` `shieldBlock(4), shieldSpellBlock(4)` (4 units) → `guard.b` `shieldBlock(2)` → the Vanguard's Graven Posts; straight north–south, notable at (-2747, -112), smalls 70 out. 14 steps from the Zealot, 15 from the Vanguard; Graven Posts stays 16 from the Zealot. Twins: Warding Staff 2 (staff or shield, the §8.3 variant), Locked Shields 7, Frozen Font 8, Iron Faith 10. Idle Hands' spur untouched. Graven Posts' fan: the new link leaves straight up, its two others east and west.                                                                                                                                                                                 |
| Z-10 | done                    | `cathedral.nave.wheel.n2`, `n7`: `shieldBlock(3)` → `shieldBlock(2)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

Not done, as the brief says: Zeal (T12, a named exception), Crozier (D10, waits for a staff-spell line). No item in the
Zealot list stood only on the sheet not counting a line (U1), so none was skipped for it.

## Ids

- **Added (unregistered; the coordinator registers):** `cathedral.crypt.omen.a`, `.n`, `.b`; `cathedral.rods.guard.a`,
  `.n`, `.b`.
- **Removed (retired holes):** `cathedral.ambulatory.toWall.c`, `cathedral.ambulatory.toWall.d`.
- **Re-lined:** `cathedral.home.hymn.a`, `.n`, `.b`; `cathedral.crypt.wheel.m1`, `m4`; `cathedral.rim.procession.n`;
  `cathedral.pyre.wheel.f1`, `f4`; `cathedral.nave.wheel.n2`, `n7`.
- **Moved:** `cathedral.nave.vigil.a`; Wake (`cathedral.rim.wake.*`), Buttress (`cathedral.rim.buttress.*`), Rood Screen
  (`cathedral.walk.rood.*`), each as a whole; Battle Hymn (`cathedral.ambulatory.hymn.*`) and
  `cathedral.ambulatory.toWall.b`.
- **Links changed inside the region:** `nave.wheel.n5`–`vigil.a` → `home.jT.a`–`vigil.a`; `nave.wheel.n5`–`star.w` cut;
  `ambulatory.hymn` internal `a–b, b–n` → `a–n, n–b`; new `rim.wake.c`–`rim.walk.o1`, `rim.buttress.c`–`rim.walk.o2`,
  `walk.rood.c`–`walk.road.n2`, `crypt.rite.n`–`crypt.omen.a`, `rods.warding.n`–`rods.guard.a`.

## Border links

- **Laid (two, both seam links):** `cathedral.crypt.omen.b`–`spire.fire.cinder.n` (seam 2; Cinder becomes a junction of
  three, its links north, east and south-west), `cathedral.rods.guard.b`–`wall.resists.posts.n` (seam 5).
- **Cut (one, the brief's §1.2 item 4):** `cathedral.ambulatory.toWall.d`–`wall.rampart.stagger.n`.
- Mystic–Zealot goes up by one, Zealot–Vanguard is unchanged in count (one laid, one cut).

## Lines

Every line the brief asked for exists in `lines.ts`; nothing was substituted.

## Checks

- `npx tsc --noEmit -p .`: clean. Prettier: clean on the folder.
- `geometry.ts --region zealot --bends`: **0 crossings, 0 drawn over.** 18 bends: the sixteen wheel nodes (regular
  octagons) and Litany's two spokes, all as before, and `walk.road.n1` (the Lychway's elbow, 104°, the road's corner where
  Kindled Steel's line meets the rim; unchanged). No new bend.
- `passives:audit -- zealot`: **0 problems**; every notable 3.0 to 4.6 units (Bright Omen 3.5, Twofold Guard 4.0, Hymn 3.6,
  Procession 4.0, Battle Hymn 3.2). Two or more ways in for every cluster touched: Hymn (the hub, the east road, the
  Mystic's crossing), Vigil (the transept, Choirmaster), Litany (three spokes), Wake, Buttress, Rood Screen and Battle Hymn
  (both ends of their arcs), Bright Omen and Twofold Guard (both ends). Stagger, the Wall's, is down to one, as accepted.
- `ip.test.ts`, `names.test.ts`: pass (names.test reads the baked tree, which does not have the two new names yet);
  `Bright Omen` and `Twofold Guard` are not in `reference/tree/ref-tree.json` and not used elsewhere in the tree.
- `buildAll`: 0 problems on `cathedral.` ids.

## The allocator (indicative: five other regions were editing at the same time)

`passives:builds --only` the seven Zealot archetypes, before my first edit and after my last. Main stats in units at
120 → 160, and choice at 60 / 120. Several changes are other regions' (M-1's spell smalls, M-2's Composure, M-3's
Quickening, the Vanguard's items), so a difference is not all mine.

| build        | before, 120 → 160                                                           | after, 120 → 160                                                            | choice 60/120, before → after |
| ------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| spell-totem  | totem 8 → 8, spell 25.5 → 36, life 34.4 → 45.8                              | totem 4 → 8, spell 22.5 → 31.5, life 38.8 → 39.8                            | 5/6 → 6/6                     |
| fire-burn    | fire 23.5 → 26.5, spell 30 → 36, life 28 → 34.4                             | fire 30.5 → 38.5, spell 15.5 → 20.5, life 34.4 → 38.8                       | 4/9 → 2/6                     |
| staff-block  | spell 31.6 → 42.6, block 11.5 → 13.5, life 22 → 35.8                        | spell 30.1 → 32.4, block 15.5 → 15.5, life 25 → 40.8                        | 3/5 → 4/6                     |
| aura-brand   | auras 22 → 22, brand 26 → 32, life 35 → 44.8                                | auras 23 → 23, brand 26 → 27.3, life 33.4 → 43.4                            | 3/4 → 2/4                     |
| block-caster | block 10.5 → 16, spell block 7 → 7, spell 27.5 → 35.3, ES 30.6 → 33.6       | block 12 → 13.5, spell block 14 → 14, spell 19.5 → 20.8, ES 25.6 → 41       | 1/2 → 4/3                     |
| storm-caster | spell 27.2 → 40.2, lightning 11.7 → 15.5, life 32.4 → 32.4, cast 9.8 → 10.8 | spell 24.2 → 26.7, lightning 24.1 → 24.9, life 35.8 → 41.4, cast 9.8 → 12.8 | 2/9 → 3/4                     |
| sceptre-fire | life 22.4 → 39.2, fire attack 20 → 20, sceptre 16.7, armour 24.2 (flat)     | life 20 → 39.4, fire attack 20 → 20, sceptre 17.1, armour 24.2 (flat)       | 3/2 → 2/3                     |

Readings:

- **The openings differ now (S1's check).** Before, every Zealot caster's 60-point plan held Zeal, Hearthfire, Vigil and
  Choirmaster. After: Vigil and Choirmaster are only in aura-brand's; Hearthfire is in the fire, totem, block and aura
  plans but not the storm or staff casters'. Storm: Zeal, Hymn, then the Cloister and Thunderhead; fire: Zeal, Hymn,
  Hearthfire, the Cloister, Homily, Cinder.
- **Hymn is now in six of the seven plans at 60** (all but the sceptre striker). It is the only spell damage within 6
  steps, so every caster takes it; its lightning half is what differs (the storm caster's lightning at 120 doubled,
  11.7 → 24.1). A shared first spell stop is what S1 asked for, but it is a new common pick near the start: worth a look
  at audit round 2 (§6.2). Not changed here.
- **Block-caster** (B2): spell block at 120 doubled (7 → 14) and its choice at 60 went from 1 to 4; Twofold Guard is in its
  120 plan. Its shield block still only climbs 12 → 13.5 past 120: seam 5 is taken by 120 rather than after it.
- **Bright Omen** is in no plan of these seven (spell crit is lightly weighed by them); no shop formed.
- Wake, Buttress and Rood Screen (now bridges) appear in the staff, fire and block plans at 120; Battle Hymn in none.

## For the coordinator and the user

- **Stale reasons on the other side (not edited):** `wall/resists.ts` Graven Posts (`posts`) does not mention seam 5 yet;
  `wall/rampart.ts` Stagger keeps one way in (its text does not claim two). The Mystic's Cinder text (`spire/fire.ts`)
  could say it is a bridge to Bright Omen.
- **Hymn's spread** (above) for audit round 2. In the same run fire-burn's 60-point choice fell from 4 to 2 and
  aura-brand's from 3 to 2 (confounded by the other regions' edits, but the number to read beside "Hymn in six of seven
  plans").
- **Litany's cold spoke** lands nowhere now; if the user wants every star point to lead somewhere, a clean road node for it
  would have to be added (none exists within reach that is not already a spoke's landing).

## Sections checked

CONSTRAINTS §1.1 (tension never at the expense of the rest: no road nodes added, two removed), §3.5–3.7 (ways in; two
dead ends made bridges, three rim pockets made arcs; each seam one border link for a two-sided combination), §4.5–4.8
(the Zealot keeps life, resistances, block and spell block, energy shield on Glass Wall's side and Wake; the home's east
pocket is offence beside the Banner's reservation and Ardour), §5.1–5.2 (twins from each new notable at 5+ steps but
Warding Staff, the staff-or-shield variant), §5.5, §6.2–6.5 (the first notable still at 2, a spell porch at 4), §8.1–8.2,
§8.6–8.7 (one unit per small, uniform sections, notables 3 to 5), §9.1 (Idle Hands', Searing Avatar's and Sigil Warden's
spurs untouched), §10.2–10.3 (live lines only), §11.2, §11.5 (straight chains, tent arcs regular and facing their road,
clean fans, 0 crossings), §12.1 (removal), §15.11.
