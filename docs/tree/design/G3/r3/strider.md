# G3 round 3. The Strider

Done 2026-10-22 for G3 round 3, the last round of new clusters, of [../../G-growth.md](../../G-growth.md). The starting
list was round 2's plan ([../r2/strider.md](../r2/strider.md) §9), changed by the user's decisions after round 2
(CONSTRAINTS §8.3's new principle, §4.8, area labels ignored) and by task item 2 (far supply for the flat
specializations). [../../CONSTRAINTS.md](../../CONSTRAINTS.md) wins over the briefs. Only `src/data/passives/bow/` was
edited (`rim.ts`, `south.ts`). Nothing was registered, baked or committed.

**Pictures** (`strider/`):

- `before.png` / `before-text.png`: the region before the first edit (box 0,−600 → 4600,3800).
- `after.png` / `after-text.png`: the same box after the round.
- `before-north.png`: the north stretch before.
- `north.png`: the trap fork, the crit chain and Kill Shot, with lines (box 3300,−200 → 4700,1400).
- `north-border.png`: the same corner with the Shade's new Sea Legs rung on the seawall node (box 3400,−600 → 4700,900).
- `middle.png`: Telling Shot off the loop's apex, with lines (box 3200,1700 → 4300,2900).
- `south.png`: Live Wire off `m67`, with lines (box 1500,2800 → 2900,4000).
- `builds.txt`: the allocator for bow-crit, bow-elemental, bow-poison and trap-mine after the round.

**Nodes: 201 → 219** (+18: 4 notables, 13 smalls, 1 road node; nothing removed). Counted as round 2 counted.
**Notables: 40 → 44.**

## 1. Changes to existing nodes

No node was re-lined, moved or removed. Only `why` texts changed:

| node                             | before                                            | after                                                      |
| -------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| `bow.rim.killShot` (cluster)     | "the crit chance chain … waits for a later round" | the chain is laid, as a bridge to the trap fork            |
| `bow.rim.killShot.n` (Kill Shot) | 4.5 units, a dead-end pocket                      | unchanged lines; now a corner where two sections meet      |
| `bow.rim.road.m12`               | "the traps-or-mines wheel (ST-6) hangs outward"   | the fork node hangs here; the north stretch becomes a loop |
| `bow.rim.road.m67`               | "ST-4 hangs outward"                              | Live Wire hangs here                                       |
| `bow.rim.road.j7`                | "ST-4 hangs on m67 beside it in a later round"    | the one bare node between two branches                     |
| `bow.rim.roof.x`                 | the loop's apex (a two-link node, 99° bend)       | a three-way junction (139°, 139°, 81°)                     |
| `south.ts` header and area `why` | three directions                                  | adds lightning attacks with shock                          |

## 2. The clusters added

| id                     | notable (cluster id)                             | lines (units)                                                        | smalls                                | hangs                                                               | steps from the Strider start | twins (steps)                                                                                       |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------- | ---------------------------: | --------------------------------------------------------------------------------------------------- |
| ST-6 (traps)           | **Hair Trigger** (`bow.rim.hairTrigger`)         | 24% trap damage, 30% crit chance for traps (2 + 2 = 4.0)             | 2 × 12% trap damage                   | an arm off the fork node `bow.rim.fork.x`, north toward the Shade   |                           20 | Tripwire 14, Trapper 17, Snare Line 23 (other partners: speed and cooldown, area, duration)         |
| ST-6 (mines)           | **Shaped Charge** (`bow.rim.shapedCharge`)       | 24% mine damage, +24% crit multiplier for mines (2 + 2 = 4.0)        | 2 × 12% mine damage                   | the other arm off the fork node, straight out                       |                           20 | Sapper 21, Black Powder 20 (speed and shocked; area)                                                |
| —                      | the fork node `bow.rim.fork.x`                   | +6 dexterity, +6 intelligence                                        |                                       | straight out from `m12`, square to the road (387 units)             |                           17 | —                                                                                                   |
| ST-s5                  | Kill Shot's crit chain (`bow.rim.killShot.k1–3`) | —                                                                    | 3 × 15% crit chance                   | from Kill Shot, at a right angle to its bow chain, to the fork node |                        18–20 | Vital Aim (21 steps away)                                                                           |
| ST-4                   | **Live Wire** (`bow.south.liveWire`)             | 24% lightning damage with attacks, 20% chance to shock (2 + 2 = 4.0) | 3 × 12% lightning damage with attacks | pocket straight out from `bow.rim.road.m67`, square to the road     |                           23 | Stormstruck 8 (attack speed), Bright Shafts 11 (all elements, bow), Pitch Arrows 11 (fire, area)    |
| new (beyond the brief) | **Telling Shot** (`bow.rim.tellingShot`)         | 20% bow damage, 10% chance to deal double damage (2 + 2 = 4.0)       | 3 × 10% bow damage                    | pocket straight out from the loop's apex `bow.rim.roof.x`           |                           25 | Kill Shot 16, Bright Shafts 16, Rapid Fire 20, Fouled Tips 20, Longbow 25 (every other bow partner) |

Twins are all 8 or more steps away (14 or more for every new cluster but Live Wire, 8 from Stormstruck as the brief set) with different partners (§5.1–5.2). The convergence rule is not touched (no spell
damage, energy shield or armour).

### ST-6: a fork, not the brief's wheel (a departure; reason)

The brief drew a closed six-node wheel (traps on one side, mines on the other) as a dead-end tip off `m12`. Round 2's
plan asked that Kill Shot's crit chain land on it, so Kill Shot stops being a dead end. A hexagon whose vertex points at
Kill Shot needs the stem off `m12` 12° or more off square, a 750-unit chain, and the chain landing next to the entrance,
on one side only (searched by a scratch script). Built instead:

- **The fork node `x`** (a road node, +6 dexterity / +6 intelligence, the trapper's attributes), 387 units straight out
  from `m12`, square to the road.
- **Four links leave `x` at an even fan** (about 93°, 93°, 93° and 81°): back to `m12`, the traps arm, the mines arm, and
  the crit chain to Kill Shot. The chain meets Kill Shot at a right angle to Kill Shot's own bow chain. That is the one
  corner, at a notable, where two sections meet.
- **Traps or mines is the fork's real choice** (§8.3's own example: the supports exclude each other). The two arms are
  dead ends, as the Longbow / Fleet Blade fork's are. The route from Kill Shot to the road passes through neither arm, so
  a bow build never pays a trap node.
- **The north stretch is a loop:** `j2` → `m23a` → Kill Shot → crit chain → `x` → `m12` → `j2`. Kill Shot and the fork
  each have two ways in (§3.5).

**Partners.** Traps already pair with speed and cooldown (Tripwire), area (Trapper) and duration (Snare Line). Mines
already pair with speed and shocked enemies (Sapper) and area (Black Powder). Here traps take **crit chance** and mines
take **crit multiplier**, which fits the crit chain that lands on the same node.
`critChance(…, ['trap'])` and `critMulti(…, ['mine'])` are the tagged form `critChance(30, ['brand'])` already uses.
Both are live lines; no dead `skillDuration` on mines.

### Telling Shot: beyond the brief, for the flat bow damage (task item 2)

The constraint it answers is §1.1 and target 1. **At 120 the crit bow had taken every bow notable it could reach**: bow
damage 31.4 → 34.4 units, +10%. The only bow damage left was Bright Shafts' and Fouled Tips' minor lines.

- **Its partner** is double damage, which no bow cluster has (`doubleDamage`, live in `calc/skill.ts`; used once
  before, on a mace notable). It is the other multiplier to Kill Shot's crit. The north sells the crit archer's
  multiplier; the middle sells the multiplier for an archer who does not crit.
- **Where it hangs.** The loop's apex `roof.x` becomes a clean three-way junction, which also takes it off the bend list.
  Reaching it passes through Hot Pursuit (fervour, speed) or Tall Grass (evasion, regeneration), a fair price (§5.5).
- **What it changes.** The middle direction is now bow damage with speed and evasion, against the north's bow crit with
  life and resistances. That is the choice the brief wanted at 120.
- **It is not filler.** All three bows weigh it, and the crit bow takes it by 140.

### The flat specializations (task item 2), one by one

- **The crit bow's bow damage (31.4 → 34.4 at round 2):** Telling Shot. **Now 31.4 → 39.4 (+25%).** The bow-crit
  allocator takes it at 140, with Hot Pursuit and Tall Grass.
- **The crit bow's crit (13.4 → 14.4):** Kill Shot's crit chain (ST-s5, the ledger's), three crit chance smalls past
  Kill Shot. No new crit notable was added: crit already lives on Vital Aim (home), Kill Shot (north) and the Shade's
  Mercy Stroke and Quiet Shot. A fourth crit cluster beside Kill Shot would make the north a crit one-stop.
  **Now 11.4 → 14.4 (+26%);** the chain is taken at 160.
  - Crit at 120 fell from 13.4 to 11.4 because the plan went elsewhere: it took the Shade's new Sea Legs and Veiled
    Herald and moved off part of the crit it took before. No crit supply was removed.
- **The elemental bow's bow damage (22.2 → 23.8):** Telling Shot as well (bow damage weighs 0.8 for it). **Now 22.2 →
  27.2 (+23%).** Telling Shot, Tall Grass and Hot Pursuit are in its gave-up list at 120.

## 3. Deferred border links laid

**None.** `G2/borders.md` §4 lists no deferred link that lands on a cluster added this round. Both of the Strider's own
links (ST-9 ↔ `knife.snares.toRicochet.r4` and ST-9 ↔ `bow.rim.road.j1`) were laid in round 1. RE-6 and RE-1 are the
Reaver's to write, and both show in the audit as laid. No link across a region line was added, cut or re-aimed.

## 4. Ids

- **New (18):**
  - `bow.rim.fork.x`
  - `bow.rim.hairTrigger.{s1,s2,n}`
  - `bow.rim.shapedCharge.{s1,s2,n}`
  - `bow.rim.killShot.{k1,k2,k3}`
  - `bow.rim.tellingShot.{s1,s2,s3,n}`
  - `bow.south.liveWire.{s1,s2,s3,n}`
- **Changed or removed:** none.

## 5. Settled from round 2's open list

- **Kill Shot's crit chain:** laid, north to the fork, as a bridge.
- **ST-s1's two reserve evasion smalls:** not built. Evasion still climbs for the bows from 120 to 160 (bow-crit 28.6 →
  35.7, bow-elemental 27.3 → 39). Supply is not short.
- **Bright Shafts two steps in (round 2's question 2):** tried and **left where it is.** Hung from `j5` (one step nearer,
  not two: `j5` is the next node), the allocator's elemental bow plans did not change at any budget. The experiment was
  reverted. The reason elemental attacks stay flat is in §8.
- **Round 2's notes on the tool are stale.** `archetypes.ts` now weighs bow crit (0.6, via `weapon('bow')`) and fervour
  (0.3 in the attack bundle). Round 1's "crit not seen" and round 2's "no fervour weight" no longer hold.

## 6. Checks

- **Geometry** (`geometry.ts --region strider --bends`):
  - Crossings **0**, drawn over **0**.
  - Bends over 20°: **12**, the same twelve as before G2 (wheel corners in the Hedgerows, the High Moor and the
    Thicket, and `jt1`'s turn). Round 2's apex `roof.x` left the list: it is a junction now.
  - No new two-link bend. The new corners are at notables or junctions: Kill Shot 90° where two sections meet, `x` an
    even four-way fan, `roof.x` 139°/139°/81°, `m67` and `m12` square T's (92°/92°).
- **Whole tree** (`geometry.ts`, no region): crossings 0, drawn over 0 at the time of writing. The band at
  (4100–4300, −200–400) was checked by eye (`north-border.png`). The Shade's Sea Legs rung lands on `knife.rim.wall.s6`
  from the west; Hair Trigger is about 420 units south-east of `s6`. Nothing overlaps.
- **`tsc --noEmit`**: clean. `prettier` on both edited files. `buildAll` problems with `bow.` ids: none.
- **Audit** (`passives:audit -- strider`): problems 0.
  - **Every Strider notable is 3.0 to 5.0 units**: Weathered 3.0 the lowest, Longbow, Tripwire, Far Flight and Barbed
    Arrows 5.0 the highest. The four new ones are 4.0 each. None is outside the range.
  - **Ways in:**
    - The trap fork and Kill Shot: 2 each (the loop).
    - Live Wire and Telling Shot: 1 each. They are single pockets, far tips (§3.5, §13.5). With Bright Shafts, the
      region keeps three far dead-end tips; the brief's three were ST-2, ST-4 and the ST-6 wheel.
    - The Far Pasture and the Water Meadows have many links in and out.
- **Names:**
  - `npx vitest run src/data/ip.test.ts` passes.
  - A case-insensitive grep of `reference/tree/ref-tree.json` finds 0 for Hair Trigger, Shaped Charge, Live Wire and
    Telling Shot.
  - None of the four is used anywhere else in `src/data`.

### The allocator (indicative: other regions were mid-edit; two runs minutes apart differed for bow-elemental)

Main stats in units, 120 → 160 points. Round 2 is in brackets, G0 after it.

| build         | life                                 | evasion                              | bow damage                                 | crit / elemental attacks / poison              | choice 120 |   tax 120 |
| ------------- | ------------------------------------ | ------------------------------------ | ------------------------------------------ | ---------------------------------------------- | ---------: | --------: |
| bow-crit      | 34.6 → 42 (32.2 → 38.6; 29.2 → 34.2) | 28.6 → 35.7 (25.2 → 39; 25.6 → 29.9) | **31.4 → 39.4** (31.4 → 34.4; 29.8 → 32.4) | crit **11.4 → 14.4** (13.4 → 14.4)             |      3 (3) | 23% (22%) |
| bow-elemental | 34.2 → 44 (34.2 → 43.6; 31.2 → 34.2) | 27.3 → 39 (27.3 → 35.6; 26.6 → 30.9) | **22.2 → 27.2** (22.2 → 23.8; 17.6 → 25.2) | ele attacks 6 → 6 (6 → 11.4; 10.4 → 14.4)      |      4 (3) | 25% (25%) |
| bow-poison    | 40.6 → 49 (39.6 → 44.6; 33.2 → 41.8) | —                                    | 7.2 → 9.4 (8.2 → 10.4)                     | poison 13.5 → 22.3 (12 → 22.5)                 |      3 (5) | 28% (28%) |
| trap-mine     | —                                    | 33.3 → 33.3                          | —                                          | trap and mine damage 13.7 → 13.7 (13.7 → 13.7) |      2 (2) | 37% (37%) |

**What 40 more points buy.** Bow damage now climbs for both bows: +25% for the crit bow, was +10%; +23% for the elemental
bow, was +7%. So does the crit bow's crit: +26%, was +7%. For the four builds together, the share of main stats gaining
10% or less is **21%** (round 2 for the same four: 36%).

**The gave-up lists at 120:**

- **bow-crit:** Wiry Frame, **Tall Grass, Hot Pursuit, Telling Shot** (the middle direction), Skewer, Four Winds. At 140
  it takes the middle; at 160, the crit chain.
- **bow-elemental:** Wiry Frame, **Tall Grass, Hot Pursuit, Telling Shot**, Sea Legs, Light Hand.
- **bow-poison:** Fouled Tips, the Shade's Rat Bite, Stout Heart, Field Kit. Its choice at 120 fell from 5 to 3 since round 2; no Strider node of this round is in any of its plans, so that is other regions' new nodes (the Shade's Rat Bite and Sea Legs enter its lists).

**Strength by the back door (G-growth §4).** No main stat is collected much more at 120 because of this round. Nothing
new is nearer than 17 steps to the start.

- bow-crit's life at 120 rose 32.2 → 34.6 and its evasion 25.2 → 28.6. The new nodes in its 120-point plan are the
  Shade's (Sea Legs, Veiled Herald), not the Strider's.
- No new Strider cluster is in any of the four plans at 120.

**Not answered by this round:**

- **The elemental bow's elemental attacks stay at 6 units to 160.** Bright Shafts is 10 points past its 120-point plan,
  Live Wire 13. A Strider elemental archer has Elemental Fletching by home and then nothing until 23 steps out.
- **The trap-mine archetype's trap and mine damage stays at 13.7.** The fork is 21 steps from the Shade start and
  13 points past its 120-point plan, so the allocator never reaches it.

Both are far tips by the brief's design. Whether they are too far is in §10.

## 7. The home (CONSTRAINTS §4.8)

Unchanged by this round: nothing new lies nearer than 17 steps to the start (the fork node is the nearest, at 17). Round 2's reading stands (mixed offence and
defence within three steps; the most defensive patch is Wayfarer and the resist star, both side pockets).

Along the outer road, offence and defence alternate:

- **North:** life with resistances (Hardy Stock), trap and mine crit, bow crit.
- **Middle:** speed with fervour, evasion with regeneration, bow damage with double damage.
- **South:** elemental bow, evasion with flasks, lightning with shock, poison.

## 8. Walks (CONSTRAINTS §15.2)

The round's clusters are 17 to 25 steps out, so the 20-point walks meet nothing new; they are re-checked against today's
network (step counts by a scratch BFS).

**1. The class's main build: the crit archer, 20 points.** Unchanged from round 2.

- **Path:** Hawk's Eye, Long Breath, the north hub and bows road, **Longbow** (8 steps), **Steady Draw** (7), back
  through the loop to **Vital Aim** (5) and a crit small.
- **Chose:** bow speed, the bow keystone, crit, a little life.
- **Gave up:** Wayfarer, Elemental Fletching, Hard Target, Light Hand, Wanderer.
- No stretch without a choice. No notable nobody takes.

**2. An off-build: the dexterity sword and board, 20 points.** Unchanged.

- **Path:** Long Breath, the shield chain to **Round Shield** (7), **Light Hand** (7), **Fleet Blade** (8), Hawk's Eye,
  **Wanderer** (7).
- **Chose:** block and stun avoidance with a shield, one-handed and sword damage, attributes.
- **Gave up:** Vital Aim, Hard Target, Fleet Foot, every bow notable.

**3. A neighbour coming in: the Shade's dodger, 20 points from the Shade start.**

- **Path:** its south road, Snakeskin (7), the road toward Ricochet.
- **At the fork by `toRicochet.r4`:** straight on through Hardy Stock's two resistance smalls to **Hardy Stock** (18: life
  and resistances, the Strider's), or up past Tumble to **Veiled Herald** (17) and the Shade's new **Sea Legs** (20: life
  and dodge).
- The border's two life notables now have different partners and lie on two different roads. A dodger who wants life
  picks one, and the two are a dear pair, not a cheap one: from Sea Legs to Hardy Stock is the seawall node, `j1` and
  Hardy Stock's road-side smalls. This round changed nothing on this walk.

**4. A late build: the crit archer, 120 points** (the allocator's best plan, read by hand).

- **Takes inside the region:**
  - every bow and projectile notable of the inside but Skewer and Barbed Arrows;
  - the attack-speed string;
  - Hard Target, Wanderer, Light Hand, Wayfarer, Vital Aim, Long Breath;
  - the north direction: **Hardy Stock** at 100 and **Kill Shot** at 120.
- **Across the borders:** the Shade's Keen Instinct, Soft Step, Thick Blood, Veiled Herald and Sea Legs; the Reaver's
  Footwork, Weaving, Quickened Steel, Iron Draw and Scarred Hide.
- **Gave up:**
  - **the middle direction:** Hot Pursuit, Tall Grass, and now Telling Shot (bow damage it wants, behind either of the
    other two);
  - Kill Shot's crit chain (three crit smalls, three points past Kill Shot);
  - Skewer, Wiry Frame, Four Winds;
  - the south (Bright Shafts, Live Wire, Field Kit, Fouled Tips), never wanted enough.
- **The choice at 120** is north (life, resistances, bow crit) against middle (speed, evasion, bow damage with double
  damage).
  - Round 2's middle was speed and evasion. It now carries the crit bow's flat main stat, bow damage, so giving it up
    costs bow damage.
  - Taking it means leaving the north's crit and life. At 140 the plan takes the middle; at 160, the crit chain.
- **Stretches with no choice:**
  - The middle spoke and the run `m23a`–`m23b`–`j3` are road the archer pays for, but every node offers a branch:
    Kill Shot at `m23a`, the middle spoke at `j3`.
  - The new link from `m12` to the fork node is one road node; it is the fork.
- **Notables nobody of the four takes by 160:**
  - Hair Trigger and Shaped Charge (the trap-mine archetype stops 13 points short).
  - Live Wire and Bright Shafts (the elemental bow goes to the middle and the Shade instead).
  - Both pairs are far tips. They are named in §10 rather than called fine.

## 9. What is left after G3 (for the audit rounds)

- **The elemental bow's own direction.** Elemental attacks are thin between home and the far south. Bright Shafts and
  Live Wire are 23 steps out, and the allocator's elemental archer prefers the Shade's new nodes and the middle. Options
  for G4:
  - a second way into the south band (a bridge from Bright Shafts or Live Wire), so the south is a loop and cheaper;
  - elemental attack smalls on an existing mid-distance pocket;
  - or accept it as the far direction this build gives up.
- **The trap fork's distance from the Shade.** It is 21 steps from the Shade start, reached by the seawall or Hardy
  Stock. The trap-mine archetype has 37% tax and never gets there. Its use as the Shade trapper's late direction depends
  on the extra Strider–Shade crossings the user is revisiting after G3.
- **The run `m56a`–`m56b`** (two bare road nodes between Bright Shafts and `j6`) and `m23b` and `j7` stay bare. No run
  is longer than two.
- **The crit at 120 of bow-crit** fell 2 units because the plan moved to the Shade's new life notables. That is the
  plan's choice, not lost supply, but the audit should look at it next to life (34.6 at 120, against G0's 29.2).

## 10. Open questions

1. **ST-6 as a fork with a road node** (traps north, mines east, Kill Shot's crit chain landing on the same node)
   instead of the brief's closed wheel (§2). Fine?
2. **Telling Shot** (bow damage with double damage) is a cluster beyond the brief, added for the flat bow damage of
   both bows (§1.1, target 1). Keep it?
3. **The far south and the trap fork** are taken by none of the four archetypes by 160 (§9). Leave them as far tips the
   builds give up, or should G4 make the south a loop and the fork closer to the Shade?
4. **Bright Shafts two steps in** (round 2's question 2): tried at `j5` and reverted, because it changed no plan. Close
   the question?

Nothing in this round felt like it was losing intent. The one place I weighed a brief against the picture was ST-6's
shape. I said so (§2) and did not force a hexagon whose chain would have landed beside its entrance.

## 11. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.**
  - Each new cluster is a far direction with its own partner.
  - Bow damage and crit for the crit bow, and bow damage for the elemental bow, now climb 23 to 26% from 120 to 160
    (were 7 to 10%).
  - Choice at 120 is 3 to 4 for the bows.
  - Tax unchanged (23 to 28%). Nothing was added near home.
- **§2 The reference.** Twins 8+ steps apart (Live Wire to Stormstruck 8; the rest 11 or more); names our own (ip test, grep); the reference game is not named.
- **§3 A network.**
  - The north stretch is now a loop, so Kill Shot and the fork each have two ways in.
  - Live Wire and Telling Shot are single pockets, far tips.
  - No link across a region line changed. No deferred link was due.
- **§4 Regions and areas.**
  - Offence and defence alternate along the outer road (§7).
  - Labels were ignored, as the user asked.
- **§5 Specializations.**
  - Traps get a fourth home and mines a third, each with a partner (crit chance, crit multiplier) no twin has.
  - Lightning attacks get their second home (with shock), 8 from Stormstruck (with speed).
  - Bow damage gets a sixth partner (double damage), 16 or more steps from every other bow notable.
  - Neighbours compete: Telling Shot sits behind Hot Pursuit or Tall Grass.
- **§6 Starts.** Nothing nearer than 17 steps changed.
- **§7 Roads and attributes.**
  - One road node, the fork (+6/+6, a junction of four).
  - `roof.x` is now a junction.
  - No run of more than two bare road nodes.
- **§8 Clusters and smalls.**
  - Every notable is 4.0 units with its own smalls.
  - Every section is uniform: two trap, two mine, three crit, three lightning attack, three bow.
  - Every new small belongs to a notable; the crit chain belongs to Kill Shot (§8.7).
  - Traps or mines is a fork that a build rarely takes both sides of (§8.3).
- **§9 Keystones.** Untouched; each has one link; distances unchanged.
- **§10 Vocabulary.**
  - Only lines in `lines.ts`. New to the region: crit for traps, crit multiplier for mines, double damage, lightning
    attacks, chance to shock. `lines.ts` untouched.
  - One theme per arm and per pocket. Every line is read by the sheet.
- **§11 Looks.**
  - 0 crossings, 0 drawn over, no new two-link bend.
  - The fork is an even four-way fan; the pockets are square to the road.
  - Smalls 70 then 55 apart.
  - Pictures before and after, and close-ups.
- **§12 Size.** +18 nodes (201 → 219). One cluster beyond the brief, tied to §1.1. No simulation (the allocator is a
  static tool).
- **§13 Tensions.**
  - Looks against the brief's shape: a fork, not a wheel (§2).
  - Bridges against dead ends: Kill Shot became a bridge, Live Wire and Telling Shot stay tips.
  - Tension against filler: Telling Shot added only after the flat reading, priced like the rest.
- **§14 Rejected ideas.**
  - Positions came from a scratch script that solves the road's own lines and angles; every cluster was looked at.
  - Nothing was generated. No step-count reach; no new rule.
- **§15 How the work is done.**
  - CONSTRAINTS and every brief read first; the advisor consulted before editing.
  - Pictures before the first edit and after; geometry after the batch; whole-tree geometry at the end.
  - Only the bow folder edited. No register, bake, commit or stash; no full vitest (only the ip test).
- **§16 Open.** Size +18. No border change. Dexterity supply at 120 is about the same (267 to 289 for the bows), still
  over the gear (G5's check).
