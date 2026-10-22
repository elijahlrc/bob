# G2. The border pass

Done 2026-10-22 for phase G2 of [G-growth.md](../G-growth.md), after the six region skeletons (commit 9e5e341). It
writes, cuts and re-aims every link that crosses a region line, as [G1-brief.md](../G1-brief.md) §2 decides, updated by
the six G2 reports' lists ([mystic](mystic.md), [zealot](zealot.md), [shade](shade.md), [strider](strider.md),
[vanguard](vanguard.md), [reaver](reaver.md)). [CONSTRAINTS.md](../CONSTRAINTS.md) wins over all of them. Nothing was
registered, baked or committed; `ids.json`, `baked.ts`, `edits.json`, `index.ts` and `lines.ts` are untouched.

**Pictures** ([borders/](borders/)): `before-whole.png` (the network before this pass), `whole.png` (after), and one
close-up per border with every node's id: `mystic-shade.png`, `mystic-zealot.png`, `zealot-vanguard.png`,
`vanguard-reaver.png`, `reaver-strider.png`, `strider-shade.png`.

## 0. Read this first: the Strider's Ford got four steps further from its own start

The joined brief cut `yard.dual.j2.a`–`bow.steel.hub.t` (and `–bow.home.added.n414`): four Strider links on one Reaver
node counted as four crossings and were one place. Done as decided. **The cost is larger than the brief measured.** The
Strider's own road from its home to the Ford hub `bow.steel.hub.t` ran through that Reaver node (start → `jt1` →
`yard.dual.j2.a` → `hub.t`): `hub.t` was 5 steps from the Strider start and is now 9 (by Weathered and `n442`). Every
notable hung from the Ford moved four steps out from the Strider start:

| notable (Strider start)                              | before → after |
| ---------------------------------------------------- | -------------: |
| Plated Hide (keystone), Thirsty Quiver, Hatchet Work |         9 → 13 |
| Sentry Post                                          |        10 → 14 |
| Rapid Fire                                           |        11 → 13 |
| Pitch Arrows, Deep Cuts, Killing Eye                 |        11 → 15 |
| Quick Sip                                            |        12 → 16 |

The brief expected Plated Hide 9 → 11. **Rapid Fire is in bow-crit's and bow-elemental's took lists at 60 (11 → 13)**,
and both builds now list it among what 40 more points would add. RE-6 (G3, between the gate and `hub.t`) gives back at
most one step (`hub.t` 9 → 8), because a cluster between the two is longer than the direct link was. The Ford's
distance is tax on the Strider's own core, not a choice, so this is for the user at stop 3, not settled here. The
options, measured:

| option                                                                                                  | Ford notables from the Strider start                         | note                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (a) accept                                                                                              | as above (+4)                                                | RE-6 makes it +3.                                                                                                                                                                      |
| (b) put `yard.dual.j2.a`–`hub.t` back, and hang RE-6 elsewhere                                          | all back to before (Rapid Fire 11, Plated Hide 9)            | The east gate keeps three Strider links on one Reaver node (the brief's reason for the cut).                                                                                           |
| (c) the brief's declined Sidestep–`toBlood.a`                                                           | Plated Hide 11, Sentry Post 12, Pitch Arrows 13; the rest +4 | Declined in G1-brief.md §2.5 for doubling RE-6 one node from `hub.t`; that objection still stands, and it fixes only the road to the Pits.                                             |
| (d) a Strider-side link from the south hub's road to `hub.t` (measured: `bow.steel.added.n409`–`hub.t`) | +1 (Rapid Fire 12, Plated Hide 10)                           | An internal Strider link, out of this pass's scope; G3 or the user. It restores the Strider's own way to its Ford without the Reaver's node, and leaves the gate's count at two links. |

## 1. Counts

Links whose two ends are in different regions (the start counts as its region). The ring is the centre's: each home has
two ring links, unchanged (12 in all). The four new arches CE-1 to CE-4 are inside the centre and are not border links.

| border          | before | after this pass | after G3's deferred links | places after G3 |
| --------------- | -----: | --------------: | ------------------------: | --------------: |
| Mystic–Shade    |      4 |               6 |                 7 (MY-10) |               7 |
| Mystic–Zealot   |      4 |               5 |                  6 (MY-2) |               6 |
| Zealot–Vanguard |      5 |               6 |            8 (ZE-5, ZE-8) |               8 |
| Vanguard–Reaver |      6 |               8 |                  9 (RE-2) |               9 |
| Reaver–Strider  |      6 |               5 |            7 (RE-6, RE-1) |       6 (was 3) |
| Strider–Shade   |      4 |               7 |                  8 (ST-9) |               7 |
| **all**         | **29** |          **37** |                    **45** |                 |

The third column is the joined brief's 7-6-8-9-7-8. Reaver–Strider loses one link now (two cut, one new) and gains two
in G3; its two east-gate links (`jt1`, `n409`) are one place, and the Strider–Shade border's `bow.bows.toKnife.a` now
carries two crossings (Soft Step and the claw rung).

## 2. Border by border

Kinds: near (one or two nodes, close to the homes), dear (a road between far areas), ring.

### 2.1 Mystic–Shade: 4 → 6 (→ 7)

| link                                             | kind | status                              | combination                                                                                      |
| ------------------------------------------------ | ---- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `spire.craft.toKnife.b` – `knife.home.spoils.b`  | near | kept                                | the Spoils road                                                                                  |
| `spire.craft.toAlleys.r2` – Thick Blood          | near | kept                                | life for the Mystic, the Shade's way to Flashes of Insight                                       |
| `spire.craft.devotion.b` – `knife.hex.wheel.n`   | near | kept                                | Devotion with the hex wheel                                                                      |
| `spire.storm.roadS.a` – `knife.hex.toSpire.b`    | near | kept                                | the storm road (Mist Walk, Black Powder, Spellslip)                                              |
| **`spire.craft.toStair.a` – `knife.hex.j4.a`**   | near | **new** (written in `craft.ts`)     | the curse crossing: Hexwright with Second Curse and the Shade's curses, from either start        |
| **`spire.rim.road.r5` – `knife.roofs.ridge.y1`** | dear | **new** (written in `spire/rim.ts`) | the Rooftops road: traps and mines, cold, the crit wand (G3) for an intelligence-dexterity Shade |
| MY-10 – `knife.hex.toSpire.a`                    | near | deferred to G3                      | the dagger caster's bridge                                                                       |
| CE-1                                             | ring | deferred to G3 (centre)             | stun protection                                                                                  |

`spire.rim.road.r5` was nudged from (1950,−3900) to (2080,−3900): the run from `r4` stays nearly straight (8°) and the
ridge node takes the road as a clean T (75° and 120° from its two road links). On the straight line from `r4` it would
have met the ridge 31° from Black Powder's link. The 70° turn is at `r5`, the corner where the eaves road drops onto the
ridge road.

### 2.2 Mystic–Zealot: 4 → 5 (→ 6)

| link                                                 | kind | status                          | combination                                                                                                                                                        |
| ---------------------------------------------------- | ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spire.well.toCathedral.b` – `cathedral.home.hymn.b` | near | kept                            | Hymn                                                                                                                                                               |
| `spire.well.draught.b` – `cathedral.choir.toSpire.a` | near | kept                            | Draught                                                                                                                                                            |
| `spire.well.toCrypt.r4` – `cathedral.crypt.wheel.m6` | near | kept                            | the crypt road                                                                                                                                                     |
| `cathedral.crypt.toSpire.b` – Familiars              | near | kept                            | Familiars                                                                                                                                                          |
| **`cathedral.crypt.north.n6` – `spire.fire.rim.c`**  | dear | **new** (written in `crypt.ts`) | the far loop: the two rim roads become one over the top (Tomb Dust, Shattering Rite and ZE-3/9/11 with Cinder, Steady Stream, MY-4/7); a turn of about 10° at `n6` |
| MY-2 – `cathedral.crypt.toSpire.b`                   | near | deferred to G3                  | the Undercroft bridge (spell damage with life)                                                                                                                     |
| CE-4                                                 | ring | deferred to G3 (centre)         | mana cost                                                                                                                                                          |

### 2.3 Zealot–Vanguard: 5 → 6 (→ 8)

| link                                                    | kind       | status                            | combination                                                             |
| ------------------------------------------------------- | ---------- | --------------------------------- | ----------------------------------------------------------------------- |
| `wall.resists.j.a` – `cathedral.nave.toWall.a`          | near       | kept                              | the Nave road                                                           |
| `cathedral.home.hubs.w` – Warlord's Banner              | near       | kept                              | the Banner                                                              |
| Scar Tissue – `cathedral.rods.toWall.a`                 | near       | kept                              | Scar Tissue                                                             |
| `cathedral.ambulatory.toWall.d` – Stagger               | near       | kept                              | Stagger                                                                 |
| `wall.maces.toHymn.r4` – `cathedral.ambulatory.hymn.b`  | near       | kept                              | Battle Hymn                                                             |
| **`wall.resists.hammer.c` – `cathedral.rods.toWall.a`** | near       | **new** (written in `resists.ts`) | maces and sceptres: Hallowed Hammer with the Vestry road and Gilded Rod |
| ZE-5 – `wall.resists.j.a`                               | near       | deferred to G3                    | the armoured sceptre                                                    |
| ZE-8 – Grim Oath (`wall.maces.oath.n`)                  | near (rim) | deferred to G3                    | two-handed fire                                                         |

### 2.4 Vanguard–Reaver: 6 → 8 (→ 9)

| link                                                 | kind | status                          | combination                                                                               |
| ---------------------------------------------------- | ---- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| `wall.slams.j2.a` – `yard.blades.j1.a`               | near | kept                            | the slams junction                                                                        |
| `wall.grit.east.e8` – `yard.blood.toWall.a`          | near | kept                            | the Pits' west                                                                            |
| `wall.slams.bracing.b` – `yard.home.fieldDressing.b` | near | kept                            | Bracing                                                                                   |
| `wall.slams.toYard.a` – `yard.blades.guarded.b`      | near | kept                            | Guarded                                                                                   |
| `wall.grit.headsman.b` – `yard.blades.toHeadsman.r3` | near | kept                            | Headsman                                                                                  |
| Barrow Ward – `yard.fosse.road.f7`                   | near | kept                            | Barrow Ward                                                                               |
| **`wall.slams.toThirst.a` – Thirsting Blade**        | near | **new** (written in `slams.ts`) | regeneration or leech: Second Wind and Thirsting Blade a fork apart, in one straight line |
| **`wall.grit.cleaver.c` – `yard.fosse.road.f7`**     | near | **new** (written in `grit.ts`)  | axes by the Fosse: Cleaver a bridge between the Barrows road and the Fosse                |
| `wall.grit.east.e6` – RE-2                           | near | deferred to G3                  | sword and board                                                                           |
| CE-3                                                 | ring | deferred to G3 (centre)         | chaos resistance and ailment avoidance                                                    |

### 2.5 Reaver–Strider: 6 → 5 (→ 7)

| link                                            | kind | status                                                       | combination                                                               |
| ----------------------------------------------- | ---- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `bow.steel.road.jt1` – `yard.dual.j2.a`         | near | kept                                                         | the east gate                                                             |
| `bow.steel.added.n409` – `yard.dual.j2.a`       | near | kept                                                         | the east gate (Wayfarer's chain)                                          |
| `yard.dual.hotBlood.b` – `bow.steel.toBlood.b`  | near | kept                                                         | Hot Blood                                                                 |
| ~~`bow.steel.hub.t` – `yard.dual.j2.a`~~        |      | **cut** (`steel.ts`)                                         | re-aimed through RE-6 in G3 (see §0)                                      |
| ~~`bow.home.added.n414` – `yard.dual.j2.a`~~    |      | **cut** (`bow/home.ts`)                                      | `n414` stays as the tip of Vital Aim's pocket                             |
| **`bow.steel.toBlood.d` – `yard.dual.east.e3`** | near | **re-aimed** from `toBlood.e`–`yard.blood.j2.a` (`steel.ts`) | the Pits' east: the Strider's road into the Pits                          |
| **Stormstruck – `bow.rim.road.j8`**             | dear | **new** (written in `fosse.ts`)                              | lightning strikes: Stormstruck with ST-4 (G3); the east outer ring closes |
| RE-6 – `bow.steel.hub.t`                        | near | deferred to G3                                               | evasion and accuracy                                                      |
| RE-1 – `bow.steel.toBlood.c`                    | near | deferred to G3                                               | the fast sword                                                            |
| CE-2                                            | ring | deferred to G3 (centre)                                      | life on hit and on kill                                                   |

**The Pits' east junction (`yard.blood.j2.a`, seven links).** Its one border link was the Strider's road, arriving at 36°
from the Reaver's own east road, both ending on that node. The road now lands one node up, on the east road's last node
`yard.dual.east.e3`; its fifth node `bow.steel.toBlood.e` is removed (its number stays retired at registration) and
`toBlood.d` moved from (790,2839) to (715,2775), on the straight line from `toBlood.c` to `e3` (`P(1007, 2046)` in the
bow frame), so the road runs straight from `c` to the landing. `j2.a` has six links; Crimson Pact's and Festering's
spurs still leave it 17° apart (the Reaver's own, for its G3 layout). The Pits are no further for the Strider: it
reaches `e3` in 10 and `j2.a` in 11, as before. `e3`'s fan: Crossed Blades' small −111°, `e2` −74°, the Strider −23°,
`j2.a` 116°.

**Hot Blood and RE-1 together.** Hot Blood bridges `e1`–`toBlood.b`; RE-1 hangs from `e2` toward `toBlood.c`: two rungs
of one ladder, a step apart on each side, for different combinations (fervour; sword speed). The line `e2`–`toBlood.c`
passes clear of Hot Blood's square and of the moved `toBlood.d` (about 150 units). RE-1 stays on `toBlood.c` (its fifth
link): `toBlood.d` is now only 217 units from `e2`, too close for a cluster between them.

### 2.6 Strider–Shade: 4 → 7 (→ 8)

| link                                              | kind | status                              | combination                                                                            |
| ------------------------------------------------- | ---- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| `bow.bows.toKnife.a` – `knife.home.softStep.b`    | near | kept                                | Soft Step                                                                              |
| `knife.home.toHedge.r1` – `bow.bows.hedgeMagic.a` | near | kept                                | Hedge Magic                                                                            |
| `bow.flight.toKnife.a` – `knife.snares.toBow.a`   | near | kept                                | the Snares (Tripwire to Trapper)                                                       |
| `knife.snares.toRicochet.r4` – Ricochet           | near | kept                                | Ricochet                                                                               |
| **`knife.edge.rung.a` – `bow.bows.toKnife.a`**    | near | **new** (written in `edge.ts`)      | fast claws: claws where the Strider's dexterity meets the Shade's intelligence         |
| **Mercy Stroke – `bow.flight.venom.a`**           | near | **new** (written in `snares.ts`)    | crit poison: Mercy Stroke's crit multiplier beside Venom Fletching (three steps apart) |
| **`knife.rim.wall.s6` – `bow.rim.road.j1`**       | dear | **new** (written in `knife/rim.ts`) | the east rim highway, the Rooftops to the Fosse                                        |
| ST-9 – `knife.snares.toRicochet.r4`               | near | deferred to G3                      | life for the Shade's south                                                             |
| Quick March (ring)                                | ring | unchanged                           |                                                                                        |

## 3. The user's extra crossings (stop 2): none added; the search, and a menu

The user asked for 1 to 2 more per border, each for a named combination (CONSTRAINTS §3.7), against §13.1 (connections
against trade-offs), §5.5 (neighbours compete) and the convergence rule. **None was added.** That is not the brief's
"enough" restated: every border was searched two ways, and each candidate either served a combination an existing
crossing already serves a few steps away, reopened a link the joined brief declined for a reason that still holds, or
brought a neighbour's notables toward a home. Adding one anyway would be a link placed for a count, which §3.7 and §14
rule out. The search (scratch script, every pair checked for crossings and nodes drawn over, and what it brings nearer):

1. Every clean node pair across each border within 480 units (49, 35, 30, 81, 34, 36 pairs).
2. Every clean pair within 1,000 units at a **new place**, 350 units or more from every end of an existing crossing
   (15, 21, 2, 6, 11, 6 pairs).

The best runner-up of each border, and what stopped it, for the user to overrule at stop 3:

| border          | best runner-up                                                          | combination                                                               | why not                                                                                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mystic–Shade    | Overcharge's small – Black Powder's small, one int-dex node (733 units) | lightning mines (Overcharge's shock, Sapper's damage against the shocked) | The Rooftops road is one step from Black Powder, and MY-6 (G3) bridges Overcharge to `r4`: about five steps either way already. Every stretch of this border from the ring to the rim has a crossing every 300 to 700 units.               |
| Mystic–Zealot   | Cinder – Shattering Rite (413)                                          | burning with the Zealot's far spells                                      | Doubles the far loop plus ZE-3 (G3) 400 units away; no notable gets 2 or more steps nearer. The other candidates open the Mind Bulwark and Living Ward spurs (§9.1) or join the two homes (Hymn 5 from the Mystic start).                  |
| Zealot–Vanguard | the Churchyard's `o1` – Grim Oath (927)                                 | the far west's curses and auras                                           | Doubles ZE-8 (Censer–Grim Oath, G3). Alms–Elemental Ward would put armour with resistances 6 steps from the Zealot start (§5.5, the convergence rule); the Battlements' east stays empty, as the brief chose.                              |
| Vanguard–Reaver | the Barrows' `e5` – the west road's `toHeadsman.r1`, one node (679)     | the Barrows with Elemental Edge and Executioner                           | The south-west corner already holds four crossings within 600 units (Headsman, the Pits' west, Cleaver, RE-2); Greatblade–the leg reopens the declined two-hander twins; Unhurried–`w1` is a fourth crossing in 300 units by the homes.    |
| Reaver–Strider  | Sidestep – `toBlood.a` (140), option (c) of §0                          | dodge and evasion into the Ford                                           | Declined in the brief for doubling RE-6; it gives the Strider back two steps to the Pits road only. **This border is the one to revisit with §0**: if the user picks (b) or (d), its count and its Ford question are answered together.    |
| Strider–Shade   | the north spoke's `s` – Veiled Herald (846)                             | auras for the bow builds                                                  | The brief declined a third link on Veiled Herald (SH-10 and SH-12 make it a bridge in G3). Longbow and Fleet Blade to the rung or Nimble Gambit's spur bring the Strider's own wheel notables 4 to 5 steps nearer, not a crossing's worth. |

## 4. Deferred to G3 (the G3 agents lay these; do not re-invent them)

- G3 lays: MY-10 ↔ `knife.hex.toSpire.a` (the dagger caster's bridge).
- G3 lays: MY-2 ↔ `cathedral.crypt.toSpire.b` (the Undercroft bridge).
- G3 lays: ZE-5 ↔ `wall.resists.j.a` (the armoured sceptre).
- G3 lays: ZE-8 ↔ `wall.maces.oath.n` (two-handed fire; ZE-8's other end is Censer).
- G3 lays: RE-2 ↔ `wall.grit.east.e6` (sword and board; RE-2 hangs from `yard.blades.toHeadsman.r2`).
- G3 lays: RE-6 ↔ `bow.steel.hub.t` (evasion and accuracy; RE-6's other end is `yard.dual.j2.a`). Read §0 first.
- G3 lays: RE-1 ↔ `bow.steel.toBlood.c` (the fast sword; RE-1 hangs from `yard.dual.east.e2`).
- G3 lays: ST-9 ↔ `knife.snares.toRicochet.r4` and ST-9 ↔ `bow.rim.road.j1` (life for the Shade's south; `j1` becomes a
  three-way junction).
- Centre (inside the centre, not border links): CE-1 on ring nodes r1–r3, CE-2 on r9–r11, CE-3 on r13–r15, CE-4 on
  r21–r23 (G1-brief.md §3).

## 5. Stubs

Every dangling end named in the region reports got its crossing: `spire.craft.toStair.a`, `spire.rim.road.r5`,
`spire.fire.rim.c` / `cathedral.crypt.north.n6`, `wall.resists.hammer.c`, `wall.slams.toThirst.a`,
`wall.grit.cleaver.c`, `knife.edge.rung.a`, `knife.rim.wall.s6`, `bow.rim.road.j1` and `bow.rim.road.j8`. No crossing
was dropped, so no stub had to go. **Removed:** `bow.steel.toBlood.e` (the Pits' east re-aim). `bow.home.added.n414` is
now the dead-end tip of Vital Aim's pocket, as the Strider brief said. The one-link nodes still waiting are internal and
G3's (`wall.maces.rim.a`, `rim.b`, `wall.slams.floor.a`, `floor.b`, `wall.grit.middle.b`, `wall.maces.toCleaver.a`,
`spire.well.toPulse.a`, `spire.frost.stream.n`).

**Moved** (crossing nodes only): `spire.rim.road.r5` (1950,−3900) → (2080,−3900); `bow.steel.toBlood.d` (790,2839) →
(715,2775). No id changed; no new id.

## 6. Checks

- **Geometry** (`geometry.ts --bends`, whole tree): **crossings 0, drawn over 0**. Bends over 20°: 83. Four are new, all
  at two-link nodes that become junctions or are road corners:
  - `knife.edge.rung.a` 72°: the rung turns toward the Strider; SH-6 lands on it in G3. Straightening it would put the
    link 32° from the dodge junction's south road, which the Shade agent had evened.
  - `spire.rim.road.r5` 70°: the corner where the eaves road drops onto the ridge road (§2.1).
  - `bow.rim.road.j1` 41° and `knife.rim.wall.s6` 27°: the rim highway's two ends; ST-9 and SH-10 hang on them in G3.
  - Not flagged (the tool skips notables), named for G3's layout: Stormstruck bends about 59° where its chain meets the
    link to `j8`, Mercy Stroke about 50° where its chain meets `venom.a`.
- **Problems** (`buildAll`): 0. `npx tsc --noEmit`: clean. `npm run passives:audit`: problems 0.
- **Ways in** (§3.5, the audit's links in and out): every area has two or more. The least: the Churchyard 2, the Eaves 3. Areas that gained: Hallowed Hammer, Thirsting Blade, Cleaver, Stormstruck and Mercy Stroke stop being dead ends.
- **The home check** (steps from each archetype's start to every notable it took at 60 in G0, before → after this pass):
  2 grew, 2 shrank.
  - bow-crit, bow-elemental: Rapid Fire 11 → 13, **grew**: the east-gate cut (§0). The brief gives the cause, not this
    size.
  - sword-str, axe-bleed: Second Wind 17 → 16.
- **What came much nearer a neighbour's start** (2 steps or more, any notable): Mercy Stroke from the Strider 12 → 9
  (crit multiplier 2.1 units with damage against the low-life). It is now the Strider's second-nearest crit-multiplier
  notable after its own Vital Aim (5), and four steps nearer than the Strider's own Killing Eye (11 → 15 by §0): a §5.5
  watch item for G3. The allocator's bow-crit takes it at neither 60 nor 120 today. Also: Hallowed Hammer from the
  Zealot 15 → 12 (the brief's sceptre meeting), Thirsting Blade from the Vanguard 19 → 15 (the brief's fork), Cleaver
  from the Strider 22 → 20, Hexwright from the Strider 22 → 19, Snare Line from the Strider 29 → 27. None comes nearer than 9 steps to a neighbour's start.
- **The allocator** (`passives:builds`, all 27, after this pass; the region G2s are in the same tree, so it reads the
  whole skeleton, not this pass alone): choice at 120 has 5 builds with one plan, 13 with three or more; typical tax at
  120 35% (roads without their G3 clusters, as expected). bow-crit's 60-point plan drops Rapid Fire for Quick Hands and
  Light Hand (§0).

**Layout watch items for G3** (not faults, angles to look at when the clusters land): `wall.grit.cleaver.c` arrives at
`yard.fosse.road.f7` 39° from Barrow Ward's link; `wall.resists.hammer.c` arrives at `cathedral.rods.toWall.a` 48° from
Scar Tissue's (ZE-7 lands there too); `yard.blood.j2.a`'s Crimson Pact and Festering spurs 17° apart.

Other files in the working tree (`.claude/launch.json`, `src/render/styles/grim/index.ts`, `src/ui/skins.css`) were
changed by someone else during this pass; this pass did not touch them.

## 7. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Every link serves a combination the brief named. No link was added for a count; the one
  change that made a build's own core further away (§0) is reported with numbers and options rather than hidden or
  undone on my own.
- **§2 The reference.** Border counts are compared with its 10 to 13 per pair (§1 here: 6 to 9 after G3). Nothing copied;
  no reference names.
- **§3 A network.** 37 border links now, 45 after G3; five dead-end notables became bridges; every area keeps two or
  more ways in; every stub resolved. §3.7: each new link is placed for a named combination; the extras' search and its
  runners-up are in §3, with why each was not laid.
- **§4 Regions.** No area or label changed; the Strider's Pits road still sells strength and dexterity on the way.
- **§5 Specializations.** The twins the brief measured stand (Hallowed Hammer is 6 from ZE-5 by the brief's landing);
  §5.5 checked for every new link (§6: what came nearer a neighbour's start); Mercy Stroke is the one to watch.
- **§6 Starts.** No start or home link changed. No notable came within 9 of a neighbour's start.
- **§7 Roads and attributes.** Crossing nodes keep their hybrid values (`r5` dex-int, `toStair.a` dex-int, `toThirst.a`
  str-dex, `toBlood.d` str-dex); one road node removed where it ended on a crowded junction.
- **§8 Clusters and smalls.** No small added or re-lined; Venom Fletching's first small and Hallowed Hammer's and
  Cleaver's far smalls carry crossings, as the briefs placed them.
- **§9 Keystones.** All 27 unchanged dead ends. Plated Hide 9 → 13 from the Strider start (§0; the brief expected 11).
- **§10 Vocabulary.** No line changed.
- **§11 Looks.** 0 crossings, 0 drawn over; four new bends, each a road corner or a G3 junction (§6); two crossing nodes
  nudged for clean angles; close-ups of every border.
- **§12 Size.** −1 node (`toBlood.e`). No simulation; the allocator is a static tool.
- **§13 Tensions.** §13.1 decided every extra (§3); bridges against dead ends: five pockets became bridges, keystone
  spurs untouched.
- **§14 Rejected ideas.** The candidate script lists options and checks geometry; every link was chosen by hand from the
  brief. No step-count reach (steps are costs here), no spacing rule, no filler.
- **§15 How the work is done.** CONSTRAINTS and every brief and report read first; pictures before and after with
  explicit paths; geometry and problems after the batch; no register, bake, commit or stash. **Intent:** nothing here felt
  like it was losing intent, with one thing said out loud: the east-gate cut, as decided, costs the Strider's Ford four
  steps, and that wants the user's choice at stop 3 (§0).
