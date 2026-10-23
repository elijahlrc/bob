# G3 round 3: the Zealot (the Cathedral)

Done 2026-10-22 for G3 round 3, the last round of new clusters ([G-growth.md](../../G-growth.md)), from the round-2
report [../r2/zealot.md](../r2/zealot.md) (its plan for round 3), round 1's [../r1/zealot.md](../r1/zealot.md), the
user's decisions after round 2 (CONSTRAINTS §8.3, §4.8; labels ignored), the joined brief
[G1-brief.md](../../G1-brief.md), [G1/zealot.md](../../G1/zealot.md), [G2/zealot.md](../../G2/zealot.md) and
[G2/borders.md](../../G2/borders.md), under [CONSTRAINTS.md](../../CONSTRAINTS.md). Only `src/data/passives/cathedral/`
was edited (`rim.ts`, `walk.ts`; one `why` each in `crypt.ts` and `ambulatory.ts`). Nothing registered, baked or
committed; no label checked or moved.

**The region: 194 → 214 nodes** (the audit's count with the start; 5 notables and 15 smalls added, nothing removed,
no id changed). 35 → 40 notables.

Pictures in [zealot/](zealot/): `before.png`, `before-text.png` (before the first edit), `after.png`, `after-text.png`,
and close-ups with every line: `churchyard.png` (the outer walk with Brazier, Buttress, Wake, Procession), `procession.png` (Censer, Battle Hymn, Procession,
Grim Oath), `lychway.png` (the north walk with Vespers, Plainsong, Rood Screen).

## 1. The clusters added

| ledger           | notable (id)                                  | lines (units)                                                                | smalls                                              | hangs                                                                                                                            | steps from the Zealot start | twins (steps)                                                                                                                                       |
| ---------------- | --------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ZE-8             | **Procession** (`cathedral.rim.procession.n`) | aura effect 12%, life 10% (2 + 2 = 4)                                        | 3 × 6% aura effect (lead: auras)                    | a bridge from Censer to the Vanguard's Grim Oath (the deferred border link), turning at the notable                              |                          20 | auras: Battle Hymn 7 (warcries), Benediction 11 (shield, regeneration), Choirmaster 18 (reservation, mana), Lone Vow 18                             |
| ZE-6             | **Brazier** (`cathedral.rim.brazier.n`)       | sceptre damage 20%, chance to ignite 10%, burning damage 12% (2 + 1 + 1 = 4) | 3 × 12% burning damage (lead: burning)              | a pocket inward off the Churchyard's far corner `rim.walk.o4`, on its bisector, between Thunder Peal and the Searing Avatar spur |                          25 | burning: Censer 8 (area, long ignites), Cinder 25; sceptre: Gilded Rod 15 (crit), Hallowed Hammer 17 (elemental strikes), Verger 20 (armour)        |
| ZE-9             | **Vespers** (`cathedral.walk.vespers.n`)      | spell damage 16%, skill effect duration 20% (2 + 2 = 4)                      | 3 × 8% spell damage (lead: spell damage)            | a pocket inward off the north walk's `road.n4`, on the walk's bisector                                                           |                          25 | spell damage: Reliquary 14 (totems), Homily 15 (elements, cast speed), Crozier 17 (staff), Lectern 18 (reservation)                                 |
| ZE-3             | **Plainsong** (`cathedral.walk.plainsong.n`)  | damage with channelling 20%, elemental damage 20% (2 + 2 = 4)                | 3 × 10% damage with channelling (lead: channelling) | a bridge from Shattering Rite (straight on from its chain) to the north walk's east end `road.n6`, turning at the notable        |        21 (Mystic start 25) | channelling: Steady Stream 15 (cheaper mana), Ceaseless Blades 49 (attacks)                                                                         |
| beyond the brief | **Buttress** (`cathedral.rim.buttress.n`)     | spell block 4%, all resistances 10% (2 + 2.5 = 4.5)                          | 3 × 2% spell block (lead: spell block)              | a pocket outward off the Churchyard's middle node `rim.walk.o3`, square to the walk, out on the rim                              |                          24 | spell block: Wake 9 (not a twin: ES and life), Warding Staff 16 (staff), Glass Wall 22 (shield), Rood Screen 24 (ES), Stone Ward 34 (life on block) |

Every small in each cluster carries the same line; every new small belongs to its notable. Names are our own plain
words: `ip.test` passes, and Procession, Brazier, Vespers, Plainsong and Buttress have no hit in
`reference/tree/ref-tree.json` or `reference/coverage/ref-phrases.json`.

**Leads, argued (the round's rule: lead with the flat want):**

- **Procession is aura-led, not life-led as the brief had it** (G1-brief §1.2 listed "ZE-8 life-led"). The aura build's
  auras were 22 → 22 units from 120 to 160 points, with every aura notable near home taken by 120; its life climbs
  (35 → 45) and life is spread over every region. Life sits on the notable. This undoes the brief's fold of ZE-s4 (a
  life section) into ZE-8: say so to the join.
- **Brazier is burn-led, sceptre on the notable only.** The fire caster's fire was 22.5 → 22.5; burning serves the
  caster (weight 1) and the striker (0.6), sceptre smalls the striker alone, and a sceptre-led cluster beside Searing
  Avatar and Kindled Steel, which the sceptre build already takes, would be the striker's back door (advisor's warning).
  A fire caster takes its three smalls and half its notable; picking it is picking the partner it does not hold.
- **Vespers is spell-led**: the brief's far spell cluster for the casters, the Zealot's one new spell supply.
- **Plainsong is channelling-led**, as Steady Stream and Ceaseless Blades are (both have channelling smalls); the
  elements are its partner on the notable.

## 2. The flat specializations (what was done, and why)

| flat (r2 120 → 160)                | done                                                                                    | allocator after (120 → 160)                                                                                   | reading                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aura-brand's auras (22 → 22)       | Procession aura-led (5 units of aura effect at the far south-west). No further cluster. | 22 → 22; Procession in no plan and not in the gave-up list                                                    | The aura build's plan never goes south-west (about 11 points from Benediction for 7 units). Procession is supply in a new direction, weighed by the sceptre build (life, a road to the Vanguard) at 160, not by the aura build. I looked for a second aura spot nearer: the shrine would make brands and auras one stop (Runecarver, Sigil Warden); the aisle and Choir are the home hot spot; the north walk's bare `n1`–`n2` is as far as Procession. Adding one there would be padding by the user's own test. Left flat, said out loud. |
| staff-block's block (8.5 → 8.5)    | **Buttress, added beyond the brief** (spell block with resistances, west on the rim).   | 13.5 → 13.5 (taken at 120); spell damage at 120 34.6 → 32.6, Benediction joins its gave-up list, choice 5 → 4 | Tried, measured, kept. It is taken: the staff blocker already walks west (Thunder Peal, Wake), and pays for Buttress with 2 units of spell damage and Benediction. A real trade, but block is still finished at 120: the level rose, the tension did not (G-growth §4, strength by the back door, said here). Kept because the staff blocker had 17% block in all and nowhere to climb, and the west is a third direction with a partner no block notable has. **The user's call** (question 2): keep, or pull it.                          |
| block-caster's block (10.5 → 10.5) | nothing                                                                                 | 10.5 → 10.5; spell block 7 → 7; one plan at 120 (as before)                                                   | Its plan goes north and east (Glass Wall, Rood Screen, now Vespers and Plainsong) and never west, so Buttress does not reach it. Its block is shield block, all near home (Iron Faith, Frozen Font) plus the Wall's and the Yard's. A shield-block cluster on the north walk would sit a step from Rood Screen, which it already takes: two wants a step apart (§5.5). Also: the archetype weighs plain spell block at 0.6 (`SHIELD` in `archetypes.ts`), a weights note, not a supply fact.                                                |
| fire-burn's fire (22.5 → 22.5)     | Brazier burn-led; no further cluster.                                                   | 20.5 → 24.9 (+21%); no west notable (Censer, Brazier, Wake, Searing Avatar) in any plan or gave-up list       | The west's fire is untaken supply: the fire caster's best plans go east into the Mystic for spell damage, and the west (Censer 17 steps, Brazier 25) is too dear to appear even in the 40-point probe. Another fire cluster there would be padding. The real question is reach (question 1).                                                                                                                                                                                                                                                |

## 3. Deferred border links laid

- `cathedral.rim.procession.c` ↔ `wall.maces.oath.n` (two-handed fire; G2/borders.md §4), written in `rim.ts`, exactly as
  listed (ZE-8's other end is Censer). Zealot–Vanguard is now 8 links, as G2 counted.

No other link across a region line was added, cut or re-aimed. Plainsong lands on `road.n6`, whose far-loop link to
`spire.fire.rim.c` is unchanged.

## 4. Ids

**Re-lines: none.** No existing notable or small changed its lines this round (before → after: nothing).

**New (20):** `cathedral.rim.procession.{a,b,n,c}`, `cathedral.rim.brazier.{a,b,c,n}`, `cathedral.rim.buttress.{a,b,c,n}`,
`cathedral.walk.vespers.{a,b,c,n}`, `cathedral.walk.plainsong.{a,b,n,c}`. **None changed, none removed.**

Other edits: `why` texts of the walk nodes they hang from (`o3`, `o4`, `n4`, `n6`), the two files' headers and area
reasons, Shattering Rite (now a bridge) and Censer (now a junction of three).

## 5. Changed from the brief, and why

1. **Procession aura-led** (brief: life-led), §1.
2. **Buttress added** beyond the brief, for CONSTRAINTS §1.1 (what more points would still buy) and the round's
   instruction on far supply; §2.
3. **Procession turns at its notable** instead of running straight from Censer to Grim Oath: the straight line passes
   about 45 units from Battle Hymn's notable (it would run through its name). The turn is about 58° at the notable;
   Censer's three links fan at about 13°, 131°, 216°; Grim Oath's at −21°, 84°, 253°.
4. **Plainsong** runs straight on from Shattering Rite's chain and turns about 48° at its notable, so it lands on `n6` at
   about 35°, between the far loop (−13°) and Tomb Dust (84°), instead of the straight line's 60° (24° off Tomb Dust),
   the near-miss the join flagged.

Placements are at the brief's hang points (G2/zealot.md §2): ZE-8 Censer ↔ Grim Oath, ZE-6 off `o4`, ZE-9 off `n4`,
ZE-3 Shattering Rite ↔ `n6`.

## 6. Checks

- **Geometry** (`geometry.ts --region zealot --bends`): **0 crossings, 0 drawn over.** 18 bends over 20° at two-link
  nodes, all pre-existing: the five wheels' corners, Litany's two spokes, `walk.road.n1` (104°, the walk's corner).
  `rim.walk.o4` (94°) left the list (Brazier makes it a junction), and `o3` is a junction now. No new bend: every new
  chain is straight; the two turns are at notables (§5).
- **Audit** (`passives:audit -- zealot`): problems 0. **Notables in units: all 40 between 3.0 and 4.6** (the five new
  ones 4.0 to 4.5; lowest Tithe 3.0, Battle Hymn 3.2, Shattering Rite 3.3). **Ways in:** every area has two or more (the
  Churchyard now three: Censer, Thunder Peal, and Grim Oath through Procession; the Lychway four with
  Shattering Rite through Plainsong). Procession and Plainsong are bridges; Brazier, Buttress and Vespers are dead-end
  pockets on roads with two or more ways in (§3.6, §13.5). Shattering Rite stopped being a dead end.
- `buildAll` (via audit and pictures): 0 problems. `npx tsc --noEmit -p .` clean.
- **Names:** `npx vitest run src/data/ip.test.ts` passes (5 tests); no reference hits (§1).

### The allocator (indicative: the other regions were mid-edit; sceptre-fire moved between runs with the Vanguard's work)

Units at 120 → 160 points; before is this round's start (identical to the r2 file), after is the end.

| archetype    | main stat          | before 120 → 160 | after 120 → 160 | note                                                                                                                                                           |
| ------------ | ------------------ | ---------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fire-burn    | fire damage        | 22.5 → 22.5      | 20.5 → 24.9     | climbs now, from the east; no west cluster in any plan                                                                                                         |
|              | spell damage       | 29 → 31          | 31 → 36.5       |                                                                                                                                                                |
|              | life               | 30.4 → 42.8      | 36.8 → 42.8     |                                                                                                                                                                |
| staff-block  | block              | 8.5 → 8.5        | 13.5 → 13.5     | Buttress taken at 120 (§2)                                                                                                                                     |
|              | spell damage       | 34.6 → 43.9      | 32.6 → 43.9     |                                                                                                                                                                |
| aura-brand   | auras              | 22 → 22          | 22 → 22         | unchanged; Procession unreached                                                                                                                                |
|              | brand damage       | 27 → 33.3        | 27 → 33.3       |                                                                                                                                                                |
| block-caster | block              | 10.5 → 10.5      | 10.5 → 10.5     | one plan at 120, as before                                                                                                                                     |
|              | spell block        | 7 → 8            | 7 → 7           |                                                                                                                                                                |
|              | spell damage       | 25 → 31.8        | 30 → 36.8       | Vespers and Plainsong taken at 120 (the far north)                                                                                                             |
|              | energy shield      | 31.8 → 44.6      | 30.6 → 43       |                                                                                                                                                                |
| storm-caster | spell damage       | 28.7 → 40.2      | 30.2 → 42.7     |                                                                                                                                                                |
|              | lightning          | 14.5 → 15.5      | 14.5 → 16.3     |                                                                                                                                                                |
| sceptre-fire | fire attack damage | 21.4 → 24.4      | 20 → 20         | its plan now takes Brazier and Searing Avatar at 120, Procession and Censer at 160; the Vanguard's armour and life moved in the same tree (armour 30.8 → 24.2) |
|              | sceptre damage     | 16.9 → 19.7      | 16.7 → 16.7     | Brazier's 2 units are in the 120 figure                                                                                                                        |

Against the targets, these six: typical main-stat gain at 120 **23% → 23%**; main stats gaining 10% or less
**33% → 19%**; notables worth 2.5+ in the 120 gave-up list typically **3 → 3**, builds with none **1 → 0**; one plan at
120 **1 → 2** (block-caster, and sceptre-fire in the last run); tax typically **33% → 33%**.

Others that use the new clusters: the channeller (Mystic) takes Plainsong at 60 and Plainsong, Vespers and Rood Screen at
120 (channelling and spell damage 33.3 → 38.3 at 120 in the r2 measure, still climbing); the classic caster takes
Vespers and Rood Screen at 120 and lists Plainsong; the summoner and storm caster none. The north walk is a real far
loop for the Mystic casters and the shield caster.

**Strength by the back door, said out loud:** staff-block's block (Buttress, §2); block-caster's spell damage at 120 +5
(Vespers, Plainsong, at 25 and 21 steps, so bought, not gifted). Nothing new within 19 steps of any start.

## 7. Walks (by hand on the map, cheapest paths)

**W1, the Zealot's main build: the staff blocker, 20 points.** Zeal (2), the middle road and Hearthfire (7), the wheel
and the nave junction to Quarterstaff (12), Litany one spoke back (16). Warding Staff is 9 more from Quarterstaff (about
21, through Frozen Font's bridge and the dear road), or 12 from the start by the Wall's side: at 20 points it gets the
staff with attack block or the spell block, not both. Nothing new reaches it by 20: the far west (Buttress 24, Wake 23)
is its 60-to-120 choice against the Mystic's east (Arcane Focus, Warm Blood). It chose the staff or the block; it gave up
Iron Faith (a shield) and the north (Lectern 15, Homily 14). No stretch without a choice. Notable nobody here takes: Iron Faith (the
shield caster's), Ardour (an attacker's).

**W2, an off-build: the fire sceptre striker, 20 points (then its rim).** Ardour (5), Hearthfire (7), Verger (9),
Gilded Rod (12), then Rimed Steel or Tithe toward the tower (15 to 17), Searing Avatar at 20. Past 20: Brazier is five
more beyond Thunder Peal (25), Censer and Procession the other way round the Churchyard. It chose a sceptre at home and
the keystone; it gives up the Vanguard's armour in depth (the allocator's 120 plan trades it). Stretch with no choice:
the Churchyard's legs (`o1`, `o2`, `o3`, `o4`) are road, but each now has a cluster off it (Wake, Buttress, Brazier,
Thunder Peal; Procession off Censer), so no node of the walk is bare. Notable nobody here takes: Buttress (a caster's).

**W3, a neighbour coming in: the Mystic's channeller and classic caster, 20 points from the far loop.** From the Mystic
start Cinder is 21, Plainsong 25, Vespers 30: this is a late road, not a 20-point one. Taken from 60 points on: the
channeller reaches Plainsong from Cinder in five steps across the far loop, then Vespers and Rood Screen four and nine
more along the walk. It chose channelling and spell damage on the Zealot's rim; it gives up the Mystic's own north-east
(High Veil, Keen Verse). The Vanguard coming north-west: Grim Oath 21, Procession 21 (one step across), Censer 18,
Brazier 26, Battle Hymn 19: the support corner (curses, auras with life, warcries) is now one road across the border.

**W120, the staff blocker on life and energy shield, 120 points (the allocator's best plan, read on the map).** Zeal,
Hearthfire, Vigil, Choirmaster, Litany (about 12); Quarterstaff and Warding Staff (about 20); Sexton as the aisle's road
(about 26); the Mystic's east: Deep Well, Quiet Pulse, Glass Skin, Composure, Arcane Focus, Living Verse, Hale Scribe,
Darting Bolts, Keen Verse, Piercing Word, Thunderhead (about 70); Homily and Glass Wall, Familiars, Shattering Rite (about
85); the west by the Ambulatory: Crozier (staff with spell damage), Thunder Peal, Wake, Buttress (about 120). What it gave
up: Thick Blood, Warm Blood, Quiet Knife, Lectern, Benediction (the gave-up list); Brazier and Procession are other
builds'. Real choices: east (spell damage) against west (staff, block, the two pools) came at about 60 points and it
took both partly; Buttress against Benediction at 120. Stretch with no choice: the Ambulatory's walk `w1`–`w3` between
Crozier and Thunder Peal (road, with clusters off every second node). Notables nobody here takes: Brazier, Procession,
Vespers (others').

## 8. What is left after G3 (for the audit rounds)

- **The fire caster's west is never weighed.** Censer, Brazier, Wake and Searing Avatar appear in no fire-burn plan or
  gave-up list; its fire comes from the Mystic. Either the west is the fire striker's (sceptre-fire takes Brazier and
  Searing Avatar) and that is fine, or the burning caster needs a cheaper road west (question 1).
- **The aura build's auras are finished near home** (22 → 22); Procession is not reached. The aura supply near home
  (Choirmaster, Lone Vow, Lectern, Benediction, the Banner) is the reason: a reach question, not supply.
- **block-caster: one plan at 120** and flat block; the shield block it lacks is in the Wall and the Yard.
- **Dead ends:** the region now has more dead-end pockets (Wake, Brazier, Buttress, Rood Screen, Vespers, Crozier,
  Ossuary); all on roads with two or more ways in, but the audit should weigh §3.6 across the region.
- **The Churchyard extends the region's rim by about 20 units** (Buttress at radius about 4,745).
- Round 2's watch items: Sexton taken as a life stop by non-summoners (staff-block, aura-brand, sceptre-fire still do);
  the home's flasks (question 3).

## 9. Open questions

1. **The burning caster's west.** Make the fire caster's road west cheaper (for example a link that shortens Censer from
   17 steps), or accept that the west is the striker's and the caster's fire is the Mystic's?
2. **Buttress.** It is taken (block 8.5 → 13.5 at 120) but block is still finished by 120: more level, not more tension.
   Keep it as the staff blocker's third block direction, or pull it (four nodes)?
3. **The home's flasks** (round 2's question 2, still open): the Zealot sells no flask line of its own; I did not add one
   to Procession (it would make three themes, §10.2).
4. **Procession's lead.** The brief made ZE-8 life-led; it is aura-led here for the flat auras, which takes life smalls
   out of the far south-west. Agreed?

Nothing here felt like it was losing intent: each cluster is at the brief's hang point with a player's reason, the one
addition beyond the brief was tried against the allocator before it stayed, and the flat stats that remain are said out
loud with the reason (reach, not supply) instead of padded.

## 10. CONSTRAINTS checklist

- **§1 What the tree is for.** Each cluster is a want in a direction that costs another: the far north (Vespers,
  Plainsong) against the Mystic's east; the far west (Brazier, Buttress) against the east too; the south-west support
  corner (Procession) against the north's brands. Weighed against the rest: nothing new near a start, no filler, the
  pictures clean; Buttress's back-door gain reported (§2).
- **§2 The reference.** Nothing copied; names plain, absent from the reference tree and phrase list; the game not named.
- **§3 A network.** Two new bridges (Procession, a border crossing; Plainsong, making Shattering Rite a bridge), three
  dead-end pockets on roads with two or more ways in. One deferred border link laid exactly; nothing else across a border.
- **§4 Regions and areas.** No build-named area; labels ignored (the user). Defences stay varied (life and auras,
  spell block and resistances, ES with Rood Screen). §4.8: the new clusters are at the rim, mixed offence (burning,
  spell, channelling) and defence (spell block, resistances, life).
- **§5 Specializations.** Twins measured (§1 table), all 7 or more steps except Procession–Battle Hymn's shared aura line
  (7, different partners) and Buttress–Wake (9, not twins). Every new cluster has a partner its twins lack. §5.5:
  Procession sits two steps from Grim Oath (curses, armour) across the border, the brief's "far hybrid" kept.
- **§6 Starts.** Untouched; nothing new within 19 steps of any start.
- **§7 Roads and attributes.** No road node added; the Churchyard's and the north walk's bare nodes (`o3`, `o4`, `n4`)
  now have clusters off them; `n1`, `n2`, `n5` remain bare.
- **§8 Clusters and smalls.** Every notable 4.0 to 4.5 units; every section uniform; every small belongs to a notable;
  §8.3's new principle used for reading (one build taking both is no fault).
- **§9 Keystones.** All six keep one link; Brazier and Buttress clear the Searing Avatar spur (270 to 300 units).
- **§10 Vocabulary.** Only lines from `lines.ts`, unedited. New in the region: channelling smalls, skill duration on a
  notable, plain spell block with resistances, aura effect with life, sceptre with ignite.
- **§11 Looks.** 0 crossings, 0 drawn over, no new bend; straight chains; smalls 55 to 70 apart; the two turns at
  notables have reasons (§5); no near-miss under 35° at any new junction (`n6` 48°, 49°, 73°; the three-link fans at Censer and
  Grim Oath are 85° to 169°, the most the turn at Procession's notable allows).
- **§12 Size.** +20 nodes, an outcome. No bot simulation; the allocator is static.
- **§13 Tensions.** Connections against trade-offs (Procession makes the support corner one road across the border);
  bridges against dead ends (§8); strength by the back door (§2, §6); the convergence rule far out (Vespers one road
  node from Rood Screen, 25 steps out, as the ledger allows).
- **§14 Rejected ideas.** No generation (positions computed by hand from hang points, looked at, one moved by eye); no
  build list as the basis (the allocator read after placing; one trial cluster kept on a player's reason, with the
  user asked); no step-count reach; no spacing rule; no filler.
- **§15 How the work is done.** CONSTRAINTS and the briefs read first; before and after pictures; checks after each batch;
  walks by hand; only this region's folder edited; no register, bake, commit or stash.
