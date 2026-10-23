# G3 round 1. The Strider

Done 2026-10-22 for G3 round 1 of [../../G-growth.md](../../G-growth.md), from the joined brief
([../../G1-brief.md](../../G1-brief.md), which wins), the region brief ([../../G1/strider.md](../../G1/strider.md)), the
skeleton report ([../../G2/strider.md](../../G2/strider.md)) and the border pass ([../../G2/borders.md](../../G2/borders.md)).
[../../CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Only `src/data/passives/bow/` was edited; nothing was
registered, baked or committed.

**Pictures** (`strider/`): `before.png` / `after.png` (the region), `before-text.png` / `after-text.png` (every node's
lines), `north.png` (Hardy Stock and Kill Shot, box 2800,−400 → 4400,1500, with lines) and `south.png` (Field Kit and
Fouled Tips, box 900,2300 → 2500,3700, with lines). `builds.txt` is the allocator's reading for the three Strider
archetypes after the round.

**Nodes: 168 → 188** (+20: 4 notables, 16 smalls; no road node, no removal, no id changed). Notables 33 → 37.

## 1. The re-lines (approved at stop 2)

| node                                            | before                                               | after                                                    | units     |
| ----------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | --------- |
| **Round Shield** (`bow.flight.added.n432`)      | 15% mana regeneration, 10% area, 20% shield defences | +5% block with a shield, 30% avoid stun with a shield    | 4.1 → 4.0 |
| `bow.flight.added.n429` (its north small)       | 12% mana regeneration                                | +2% block with a shield                                  | 1.2 → 1.0 |
| `bow.flight.added.n433` (Wanderer's side)       | 12% mana regeneration                                | +4 all attributes                                        | 1.2 → 1.0 |
| `bow.flight.added.n430` (Wanderer → Fleet Foot) | 12% mana regeneration                                | 4% movement speed                                        | 1.2 → 1.0 |
| `bow.string.added.n431` (same chain)            | 10% shield defences                                  | 4% movement speed                                        | 0.7 → 1.0 |
| **Weathered** (`bow.steel.added.n416`)          | +10% all resistances                                 | +12% all resistances                                     | 2.5 → 3.0 |
| **Longbow** (`bow.bows.wheel.n1`)               | 16% bow damage, 13% bow attack speed, 10% accuracy   | 16% bow damage, **12%** bow attack speed, 10% accuracy   | 5.2 → 5.0 |
| **Far Flight** (`bow.flight.wheel.n1`)          | 20% projectile damage, 20% projectile speed, +20 dex | 20% projectile damage, 20% projectile speed, **+15** dex | 5.3 → 5.0 |

Elemental Ward is the Vanguard's and not touched here (stop 3's exception concerns it only). One correction to the brief:
it called `n431` one of Round Shield's "four mana smalls"; it was shield defences. It belongs to the same Wanderer–Fleet
Foot chain as `n430`, so both became movement speed (one uniform section, §8.2).

## 2. The clusters added

Chosen for round 1 (G3 item 2's order of priority):

- **ST-9 Hardy Stock** (north end): life, the want both bow builds leave behind (a); it closes `j1`, which G2 left as a
  41° two-link bend, and it is the one deferred border link on the list (b).
- **ST-1 Kill Shot** (north-middle): the flattest main want of the region's own build, bow damage for bow-crit (a); it
  hangs on the bare run between the north and middle spokes (b).
- **ST-7 Field Kit** (south-middle): evasion (a); a bridge that gives the bare south half of the road (`j5`…`j8`) its
  first way in from the Ford (b).
- **ST-10 Fouled Tips** (south): the poison bow had one plan (a); Pitch Arrows stops being a dead end and the road's
  south end gets a second way in (b).

North, north-middle, south-middle and south: the round tests the whole arc (c). ST-3 was not built alone because its
second way in is the road node to ST-5, which only exists with ST-5 (round 2).

| id    | notable (cluster id)                     | lines (units)                                                                   | smalls                                                               | hangs                                                   | steps from the start | twins and steps                                                                                |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- | -------------------: | ---------------------------------------------------------------------------------------------- |
| ST-9  | **Hardy Stock** (`bow.rim.hardyStock`)   | 10% life, +8% all resistances (2 + 2 = 4.0)                                     | 5 × 5% life (two on the Shade side, three on the road's)             | bridge `knife.snares.toRicochet.r4` ↔ `bow.rim.road.j1` |                   15 | Thick Blood 12, Long Breath 14, Hard Target 14, Weathered 17, Wayfarer 18 (all other partners) |
| ST-1  | **Kill Shot** (`bow.rim.killShot`)       | 16% bow damage, 25% crit chance with bows, +15% crit multiplier with bows (4.5) | 3 × 10% bow damage                                                   | pocket straight out from `bow.rim.road.m23a`            |                   20 | Killing Eye 15, Rapid Fire 16, Quiet Shot 17, Steady Draw 17, Longbow 20, Vital Aim 22         |
| ST-7  | **Field Kit** (`bow.steel.fieldKit`)     | 20% evasion, 10% flask effect (2 + 2 = 4.0)                                     | 3 × 10% evasion (Sentry Post side), 2 × 5% flask effect (road side)  | bridge `bow.steel.sentryPost.n` ↔ `bow.rim.road.j6`     |                   15 | Plated Hide 9 (the loose pull), Quick Sip 11, Wayfarer 12, Fleet Foot 15, Hard Target 16       |
| ST-10 | **Fouled Tips** (`bow.steel.fouledTips`) | 15% chance to poison with attacks, 20% poison damage, 12% bow damage (4.4)      | 3 × 12% poison damage (one on Pitch Arrows' side, two on the road's) | bridge `bow.steel.pitch.n` ↔ `bow.rim.road.m78`         |                   14 | Festering 11 (Reaver), Rapid Fire 14, Venom Fletching 16, Kill Shot 18                         |

Every twin is 9 or more steps away, each with a different partner (§5.1–5.2). The convergence rule is not touched (no
spell damage, energy shield or armour; Hardy Stock is life with resistances, 15 steps out).

**Layout** (CONSTRAINTS §11.5; positions computed by a scratch script, then looked at in `north.png` / `south.png`):

- **Hardy Stock** lies on the straight line between its two landings; the Shade's road `r3 → r4` runs straight on into
  it (180°), and `j1` is now a clean three-way junction (links at 94°, 181°, 315°: gaps 87°, 134°, 139°). The brief
  drew its centre about 250 units south of that line; a bridge with a bend at its notable has no reason to bend.
- **Kill Shot** leaves `m23a` square to the road (16°, against the road's 109° and 283°: 93° either side). The brief's
  shape (a bridge from `j2` round to `j3` with a crit chance chain) cannot be laid cleanly: any straight chain from a
  cluster here to `j3` meets it 18 to 25° off its road to `m23b`, and the only clean bridge between two nodes of this
  convex road would put the notable 1,200 units out. So it is a pocket for now (a single pocket may be a dead end,
  §3.5), on `m23a` rather than `j2`, which spreads the hang points (`j2` keeps its spoke; the run `j2`→`j3` now has one
  bare node, `m23b`) and leaves room at `m12` for the ST-6 wheel. **The crit chance chain (ST-s5) is not laid**; see §6.
- **Field Kit** leaves `j6` straight inward (234°, gaps 88° and 89° to the road); the notable turns the chain 45° toward
  Sentry Post, whose own links then fan at 9°, 173°, 287°. Evasion smalls beside the notable on the Ford side, flask
  smalls on the road side, the rest of each distance on the links.
- **Fouled Tips** lands on **`m78`, not the brief's `j7`**: from `m78` the line to Pitch Arrows is square to the road
  (238°, gaps 79° and 97°) and runs straight on through Pitch Arrows' own chain (a 5° turn at Pitch Arrows); from `j7`
  it would have left the road 58° off. `j7` is the one bare node between `m67` (ST-4, round 3) and `m78`. The `why`s of
  `j6`, `j7`, `m78`, `j1`, `m23a` and Pitch Arrows say so.

**Area files and labels.** Hardy Stock and Kill Shot are in `rim.ts` (the Far Pasture). Field Kit and Fouled Tips hang
from the Ford's Sentry Post and Pitch Arrows, and **no area label covers the south band** (the Far Pasture's name is at
(3600,1300), the Ford's at (1250,1887)), so they are in `steel.ts`, the Ford's file. A south area (and label) for the
band from Field Kit to the Fosse, about (1700,3000), wants adding between rounds (index.ts is shared). No label lies
over a notable: the Far Pasture's name spans about y 1225–1375 and Kill Shot's frame ends at y 1176.

## 3. Deferred border links laid

Exactly as `G2/borders.md` §4 lists, both written in `rim.ts`:

- `bow.rim.hardyStock.a` ↔ `knife.snares.toRicochet.r4` (life for the Shade's south)
- `bow.rim.hardyStock.e` ↔ `bow.rim.road.j1` (`j1` a three-way junction)

Strider–Shade: 7 → 8 links. No other link across a region line was added, cut or re-aimed. (The Reaver's agent has laid
its RE-1 link onto `bow.steel.toBlood.c` from its own file; it shows in the audit as `yard.dual.darting.c ↔ toBlood.c`.)

## 4. Ids

New only (20): `bow.rim.hardyStock.{a,b,n,c,d,e}`, `bow.rim.killShot.{c,b,a,n}`, `bow.steel.fieldKit.{a,b,c,n,f1,f2}`,
`bow.steel.fouledTips.{p,n,q1,q2}`. None changed or removed.

## 5. Checks

- **Geometry** (`geometry.ts --region strider --bends`): crossings **0**, drawn over **0**, bends over 20° **12, the same
  twelve as before G2** (wheel corners in the Hedgerows, the High Moor and the Thicket, `jt1`'s turn). No new node bends;
  the two notable corners (Field Kit 45°, Pitch Arrows 5°) are where two sections meet. Whole tree: 0 and 0 at the time
  of writing.
- **`tsc --noEmit`**: clean. `prettier --write` on the bow folder.
- **Audit** (`passives:audit -- strider`): problems 0; **every Strider notable is 3.0 to 5.0 units** (Weathered 3.0 the
  lowest, Longbow, Far Flight, Tripwire, Barbed Arrows 5.0 the highest; none outside). Keystones unchanged: Steady
  Draw 7, Close Quarters 9, Plated Hide 10, Arrow Weave 11. Ways in: Hardy Stock 2, Field Kit 2, Fouled Tips 2 (and
  Pitch Arrows now 2), Kill Shot 1 (a single pocket, §3.5). The outer road now has eight ways in (three spokes, the
  Seawall, Hardy Stock, Field Kit, Fouled Tips, the Fosse).
- **Names**: `npx vitest run src/data/ip.test.ts` passes; `grep -ci` of each new name in `reference/tree/ref-tree.json`
  finds 0 (Hardy Stock, Kill Shot, Field Kit, Fouled Tips).

### The allocator (indicative: other regions are mid-edit), against `G0/builds.txt`

Main stats in units at 120 → 160 points (G0 in brackets):

| build         | life                      | evasion                   | bow damage                | crit / poison / elemental attacks | choice 120 |   tax 120 |
| ------------- | ------------------------- | ------------------------- | ------------------------- | --------------------------------- | ---------: | --------: |
| bow-crit      | 35.2 → 47.6 (29.2 → 34.2) | 24.5 → 32.5 (25.6 → 29.9) | 29.8 → 34.4 (29.8 → 32.4) | crit 10.5 → 12.5 (14.5 → 25.3)    |      2 (1) | 23% (22%) |
| bow-elemental | 37.2 → 46.6 (31.2 → 34.2) | 29.0 → 33.5 (26.6 → 30.9) | 18.6 → 26.2 (17.6 → 25.2) | ele attacks 6 → 6 (10.4 → 14.4)   |      2 (1) | 23% (27%) |
| bow-poison    | 42.6 → 47.6 (33.2 → 41.8) | —                         | 8.2 → 17.8 (13.8 → 21.2)  | poison 11 → 18.2 (11 → 15.3)      |      4 (1) | 28% (28%) |

- **Growth from 120 to 160:** life now climbs 12 to 35% (was 3 to 26%), evasion 15 to 33%, bow-poison's poison +65%
  (Fouled Tips is what 40 more points buy). Bow damage for bow-crit still barely moves before 160; at 160 it is Kill Shot
  that adds it (+46% bow damage). Choice at 120 rose for all three (1 → 2, 2, 4); tax at or under 28%.
- **Gave up at 120:** bow-poison: Fouled Tips (3.9), Stout Heart, Snakeskin, Field Kit (2.0), Rapid Fire. bow-crit:
  Wiry Frame (3.9), Stout Heart (2.6), Field Dressing, Bloodletter; Kill Shot enters at 160. bow-elemental: Wiry Frame,
  Stout Heart, Snakeskin, Light Hand, Weathered.
- **Hardy Stock is the only round-1 cluster any of the three builds takes before 160, and bow-crit takes it already at 60.**
- **A main stat collected much more at 120 (G-growth §4, strength by the back door): life.** bow-crit 29.2 → 35.2
  units, bow-elemental 31.2 → 37.2, bow-poison 33.2 → 42.6. The main source is Hardy Stock (7 units of life in six
  nodes, four points past Ricochet, which every projectile bow takes): bow-crit takes it already at 60. It is not a pure
  back door (life keeps climbing 12 to 35% past 120, and choice rose), but it is the round's one item to watch; trimming
  Hardy Stock to four smalls is the lever (§6).
- **Crit reads low because the archetype cannot see Kill Shot's lines**: `bow-crit` in `scripts/passives/archetypes.ts`
  weighs `critChance` and `critMulti` but not `weaponCrit:bow` or `weaponCritMulti:bow`, so Kill Shot counts as 1.6 + 3
  units of bow damage only. The crit row's drop at 120 (14.5 → 10.5) is the plan going elsewhere, not supply lost.
  Kill Shot was built as the ledger says, not re-lined to suit the tool.
- **Elemental attacks are flat for bow-elemental (6 units from 60 to 160)**; G0 had them climbing to 14.4 by 160. No
  round-1 change touched an elemental attack line, so this is the supply elsewhere (other regions mid-edit) or the plan
  moving; ST-2 (bow with elemental attacks) is the first cluster of round 2 for this reason.

## 6. Walks (CONSTRAINTS §15.2)

Round 1's clusters are all 14 to 20 steps out, so the 20-point walks meet only the re-lines; the 120-point walk is where
the round shows.

**1. The class's main build: the crit archer, 20 points.** Hawk's Eye (2), Long Breath (4), the north hub and the bows
road to the bow hub, the bow side of the fork to **Longbow** (11), the fourth junction and **Steady Draw** (14), back
through the loop's south side to the south hub and **Vital Aim** (19), one crit small (20). Chose: bow speed and the
big bow keystone, crit, a little life. Gave up: Wayfarer (evasion and resistances, three points off the south hub),
Elemental Fletching, Hard Target, Light Hand and Wanderer. No stretch without a choice (every junction from the hub on
offers a pocket); no notable nobody takes. Unchanged by this round, as intended (§6.2, §13.8: nothing new near the
start).

**2. An off-build: the dexterity sword and board, 20 points.** Long Breath (3), its small, the two shield smalls and
**Round Shield** (7: now block and stun avoidance with a shield, where it was mana regeneration, area and shield
defences), its north small (+2% block), the one-handed small and **Light Hand** (10), the first junction of the road from
the bows and back along the bows road to the fork's sword side, **Fleet Blade** (17), Hawk's Eye, then **Wanderer** by
its new all-attributes small (20). Chose: shield block (about 15% with a shield) and stun avoidance, one-handed and sword
damage, attributes. Gave up: Vital Aim, Hard Target, Fleet Foot, every bow notable. The re-line made this a coherent
direction (one theme per notable, §10.2). The one thing that reads strong is the price of the two shield smalls
`n437`/`n438` (§7, question 2).

**3. A neighbour coming in: the Shade's dodger, 20 points from the Shade start.** Its south road, Snakeskin (7) on the
way, the trap wheel's life small to the road toward Ricochet (12). There it picks: **Tumble** (15: dodge and stun
avoidance) and on to **Veiled Herald** (20: evasion and reservation), or the straight road on into **Hardy Stock**
(18: life and resistances, the Shade's south's first real life) and two more life smalls (20). Dodge against life, a
real choice at the same junction, which the brief wanted ST-9 to make (§3.7: the Shade onto the outer road).

**4. A late build: the crit archer, 120 points** (the allocator's best plan, read by hand). It takes every bow and
projectile notable of the inside (Longbow, Steady Draw, Rapid Fire, Far Flight, Split Volley, Ricochet, Skewer, Barbed
Arrows, Heavy Draw), the attack-speed string (True Aim, Quick Hands, Fleet Foot), Vital Aim, Wayfarer, Hard Target,
Wanderer, Light Hand, **Hardy Stock**, and across the borders Soft Step, Thick Blood and Veiled Herald (the Shade),
Weaving, Iron Draw, Keen Instinct, Quickened Steel, Scarred Hide and Four Winds (the Reaver). It gave up: **Kill Shot**
(20 steps; from Heavy Draw the north spoke, `j2`, `m23a` and three bow damage smalls, eight points for the far bow
notable), Field Kit, Fouled Tips, Close Quarters, Arrow Weave. A player who counts Kill Shot's crit (the allocator
cannot) faces a real choice at 120: the Reaver's life and speed (Scarred Hide, Four Winds) or the far bow notable and its
crit. Stretches with no choice: the north spoke (two road nodes) and `j2`→`m23a` are road the archer pays for, but `j2`
offers the road north to Hardy Stock's end and `m23a` Kill Shot, so each junction branches. Notables nobody of the three
takes by 160: none of the new ones (Kill Shot bow-crit at 160; Fouled Tips and Field Kit bow-poison at 160; Hardy Stock
all three).

## 7. Plan for rounds 2 and 3

- **Round 2:** **ST-2** (bow with elemental attacks, on `m56a`) first, because elemental attacks are flat for
  bow-elemental; **ST-3 and ST-5 together** (evasion with regeneration on `j4`, fervour with attack speed on `m34`) with
  the road node that joins their tips (the brief's (3640,2260)), so each has two ways in. ST-3's five evasion smalls
  stand as the brief has them unless the life/evasion readings above say otherwise.
- **Round 3:** **ST-6** (the traps-or-mines wheel on `m12`, outward, between Hardy Stock's end and Kill Shot) and
  **ST-4** (lightning attacks with shock on `m67`, 6 or more steps from Stormstruck), and **Kill Shot's crit chance
  chain** (ST-s5) laid as a bridge outward to the next cluster rather than back to `j3`: to ST-6's wheel (north) or,
  if that wheel's sides read better without it, as a road node to ST-5 (south). A south area and label (§2) before then.
- Carry forward from this round: watch life at 120 for the bows (Hardy Stock), and re-read the crit row once the
  archetype counts bow crit.

## 8. Open questions

1. **The allocator's bow-crit archetype has no weight for crit with bows** (`weaponCrit:bow`, `weaponCritMulti:bow`).
   Add them at about 0.8, as for `critChance`? (Not a file this round may edit.)
2. **Round Shield's two south smalls `n437`/`n438`** carry two lines each (+4% block with a shield and 10% shield
   defences: 2.7 units a small, §8.1 says one stat at the small's size). Not in the approved changes, so untouched;
   proposed: +2% block with a shield each.
3. **Hardy Stock's life** (above): keep five smalls as the brief has them, or trim to four if the next reading still shows
   the bows' life at 120 well above G0?
4. **Fouled Tips on `m78`** instead of `j7`, and **Kill Shot a pocket** on `m23a` with its crit chain deferred: both
   departures from the brief for clean angles (§2). Fine?
5. **A south area** for the band from Field Kit to the Fosse (new area file and label between rounds).
6. Not this round's: the existing name Weathered matches the start of a reference notable's name in a plain grep of
   `ref-tree.json` (the ip test passes, since it compares whole names).

Nothing in this round felt like it was losing intent. The one temptation resisted was re-lining Kill Shot to plain crit
so the allocator would value it.

## 9. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Each new cluster adds a far direction with a new partner (life with resistances, the crit
  bow, evasion with flasks, poison with the bow); the bows' choice at 120 rose to 2–4; tension weighed against the rest
  (life at 120 watched, §5).
- **§2 The reference.** Twins 9+ steps (the reference's 7 to 14); names our own, checked by the ip test and a grep; the
  reference game not named.
- **§3 A network.** Three of four new clusters are bridges (Kill Shot a single pocket); Pitch Arrows stops being a dead
  end; the outer road gains three ways in; the one deferred crossing laid as listed, nothing else across a border.
- **§4 Regions and areas.** No build-named area; varied defences along the outer band now include life, resistances,
  evasion and flasks; the south band's missing label is reported (§2).
- **§5 Specializations.** Partners and twin steps in §2's table; Kill Shot is bows' fourth direction with the crit
  partner; poison gets its second Strider direction; neighbours compete (Fouled Tips and Festering 11 apart, Field Kit
  and Quick Sip 11).
- **§6 Starts.** Nothing within 14 steps of the start changed except the approved re-lines (Round Shield at 7 is
  shield-only, no new main stat moved closer).
- **§7 Roads and attributes.** No new road; bare road nodes left: `m23b`, `m34`–`j4` and `m56a`–`m56b` (ST-5, ST-3
  and ST-2 hang there in round 2), `j7`; no run of more than two. Dexterity at 120 unchanged or lower (248 to 283).
- **§8 Clusters and smalls.** Each notable 4.0 to 4.5 units with its own smalls; every section uniform (Hardy Stock's
  five life, Kill Shot's three bow damage, Field Kit's three evasion and two flask, Fouled Tips' three poison); the
  re-lined mana smalls each belong to a notable now (§8.7).
- **§9 Keystones.** Untouched, each one link; distances unchanged (7, 9, 10, 11).
- **§10 Vocabulary.** Only lines in `lines.ts` (new to the region: crit with bows, shield stun avoidance, poison chance
  on a bow notable); one theme per cluster; `lines.ts` untouched.
- **§11 Looks.** 0 crossings, 0 drawn over, no new bend; chains straight from notable to landing; every junction touched
  checked for clean angles (§2); smalls 70 then 55 apart; no label over a notable; pictures before and after.
- **§12 Size.** +20 nodes; no simulation (the allocator is a static tool).
- **§13 Tensions.** Looks against the brief's shapes (Kill Shot's chain, Fouled Tips' landing, Hardy Stock's line): the
  looks won, said in §2; bridges against dead ends: Kill Shot left a pocket for now.
- **§14 Rejected ideas.** Positions computed by a script, every cluster looked at; nothing generated; no step-count
  reach (steps are costs and twin distances); no new rule.
- **§15 How the work is done.** CONSTRAINTS and every brief read first; pictures before the first edit and after; geometry
  after each batch; only the bow folder edited; no register, bake, commit or stash.
- **§16 Open.** Keystone distances unchanged (7 to 11); Strider–Shade border 7 → 8 links (the deferred one), no other
  border change; size +20 (168 → 188); attribute supply unchanged or lower at 120, still over the gear (G5's check).
