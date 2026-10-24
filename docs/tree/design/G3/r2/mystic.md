# G3 round 2: the Mystic (the Spire)

Done 2026-10-22 for phase G3 of [G-growth.md](../../G-growth.md), round 2 of about three, from the round-1 report's plan
([r1/mystic.md](../r1/mystic.md) §8) and the user's decisions after round 1. [CONSTRAINTS.md](../../CONSTRAINTS.md)
wins over all of it. Edits only in `src/data/passives/spire/`; nothing registered, baked or committed; no link across a
region line added, cut or re-aimed except the two deferred links of `G2/borders.md` §4. Five other region agents worked
in the same tree at the same time, so every allocator reading below is indicative.

**Pictures** ([mystic/](mystic/)): `before.png` and `after.png` (the region), `piercing-word.png` (its new place
between the east join and Harsh Weather, with lines), `top-west.png` (High Veil as the rim road's tip, Steady Stream a
pocket again), `living-verse.png`, `hale-scribe.png`, `sharp-tongue.png` (the three new clusters, with lines).

**Node count: 215 → 228** (+3 notables, +10 smalls). No road node added or removed.

---

## 1. The hot spots, and what was done

### High Veil (MY-4) was too cheap

Round 1 joined it to Steady Stream, and the classic caster took it in its 60-point plan through Steady Stream and
finished energy shield by 120 points (43 units, flat to 160). **Done: the link `spire.frost.stream.n – highVeil.a` is
cut** (the round-1 report's option b). High Veil is reached only from the north-west rim road: through the Lantern and
Cinder from the Mystic (**23 → 27 steps**; from the Lantern junction it now costs Cinder's burn smalls and the three road
nodes), or along the far loop from the Zealot (24, unchanged).

What it costs, said out loud: Steady Stream is a dead-end pocket again (as before G3), and the north-west rim road is a
spur from its corner over Cinder (`rim.c`, which has two ways in: Cinder and the Zealot's north walk) to a far tip, High
Veil. That is CONSTRAINTS §13.5's "commitment of a far tip", two road nodes long, not a long path to nothing; MY-7 (round 3) hangs off it too.

### The west climb read as one destination

Hoarfrost (cold, shield), Piercing Word (spell damage), Shatter (cold) and High Veil (shield) lay 4 to 10 steps apart on
one line. With High Veil gone from the climb, **Piercing Word moved** off it, to a straight chain **from the east join
(`spire.frost.jStorm.a`) up to Harsh Weather's notable**, in the open ground between Siphon, Harsh Weather and the
Gallery. A caster at the top of the column now goes west for cold with a shield (Hoarfrost), north for the big cold hit
(Shatter), or north-east for spell damage (Piercing Word): Piercing Word is 10 steps from Hoarfrost and 7 from Shatter
(was about 4 from each). Harsh Weather, a dead-end chain since 2026-10-20, is a bridge again. Its ids are unchanged
(`spire.frost.piercing.*`, still in `frost.ts`), so its numbers keep their meaning; its four-node ring became a chain of
three smalls and the notable (two smalls on the join's side, one on Harsh Weather's). It is 19 steps from the start, as
before.

**Why there, measured.** I tried four placements on the same snapshot of the shared tree (a scratch script that changes
the links in memory and runs the allocator; same moment, so they compare with each other even though the other regions
were mid-edit). Main stats in units at 120 → 160 points:

| Piercing Word placed                                  | caster-es spell | caster-es ES    | caster-life spell | channeller ES   | typical main stat +40 points |
| ----------------------------------------------------- | --------------- | --------------- | ----------------- | --------------- | ---------------------------: |
| round 1's place, High Veil still on Steady Stream     | 33.5 → 42       | 46.2 → 50 (+8%) | 35.3 → 42.8       | 36.4 → 48.4     |                          25% |
| round 1's place, High Veil rim-only                   | 33.5 → 42       | 40.2 → 54       | 35.3 → 42.8       | 31.4 → 40.4     |                          23% |
| the north-west rim road, beside High Veil (first try) | 34.5 → 42       | 47.4 → 52.8     | 34.3 → 36.3       | 35.2 → 53       |                          14% |
| **the east join to Harsh Weather (chosen)**           | **33.5 → 42**   | **40.2 → 52.8** | **31.3 → 41.8**   | **24.4 → 40.4** |                      **23%** |

The rim road (my first try, also "away from the climb") was the worst: with the Undercroft bridge (below) it made the
west a loop of spell damage and shield (Living Verse, the Zealot's Homily and Glass Wall, the far loop, Piercing Word,
High Veil) that the classic caster bought at 60 points. The chosen place left the casters hungriest for both main stats
at 120 without raising their tax (33%), and it does not put the fire and lightning caster in a one-stop: its spell damage
at 120 went down (35.3 → 31.3) and grows 34% to 160. The east join now has Thunderhead, Siphon, Flashpoint, Piercing Word and (through it) Harsh Weather within a few steps, so I also measured the lightning caster that would want that set (`storm-caster`, a Zealot start): its spell damage climbs 28.7 → 40.2 from 120 to 160 (+40%; with Piercing Word on the climb it was 32.7 → 40.2), and it gives up Overcharge at 60 and Hasty Words, Homily and Hedge Magic at 120. The east join is not a one-stop for it.

### Labels

The Scriptorium's name moved off Frugal ((960,−2240) → (1170,−2240)) and the Spire gate's off the start ((−40,−890) →
(−40,−860)) before the user's instruction to leave labels alone arrived; they are left as they are. Nothing else about
labels was checked or changed this round (Piercing Word's notable now lies under the Gallery's name; the user's
instruction says to ignore that).

### The areas nearest the start (CONSTRAINTS §4.8)

Offence, defence and sustain in units within 14 steps of the Mystic start, by area (scratch script; sustain is mana,
cost, flasks, reservation and attributes):

| area            | offence   | defence    | sustain     | notables within 14 steps                                                                                       |
| --------------- | --------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| the Spire gate  | 13.7      | 7.4        | 14.5        | First Light (mixed), Sharp Mind, Deft Wand (offence); Still Mind (mana); Warm Blood (life)                     |
| the Cloister    | 5.8 → 7.8 | 23.5       | 18.4 → 15.9 | Glass Skin, Spirit Ward, Quiet Pulse, Composure (defence); Draught (flasks); Wandwork; Deep Well (now offence) |
| the Scriptorium | 18.4      | 6.6 → 13.0 | 17.6 → 18.8 | Arcane Focus, Flashes of Insight, Wand Volley (offence); Frugal; Warded Mind, Devotion, Hale Scribe (defence)  |
| the Column      | 14.5      | 9.0        | 3.5         | Broad Weave, Darting Bolts (offence); Prism Ward (defence)                                                     |

- **The home mixes** (shield one side, crit the other, life on the bridge, wands and mana off the hubs). No change.
- **The Cloister was the corridor of one kind** the user described: shield, life, spell block, flasks and mana, with the
  wand caster's Wandwork its only offence. **Re-line: Deep Well** from mana and mana regeneration (4.5 units) to **mana
  and cast speed** (`mana(16), castSpeed(8)`, 4.0 units). The west wheel's sides are now speed or shield, as the east
  wheel's are spell damage or chaos resistance; a caster heading for the west junction takes one side on the way and
  pays a detour of two nodes for the other. The regeneration a caster loses here is at home (Still Mind) and in Frugal,
  Draught and Warded Mind. This is the smallest change that gives the first west points an offensive pick; it does not
  make the Cloister offensive (open question 1).
- **The Scriptorium** was offence and cost with Warded Mind its one defence notable; Hale Scribe (life, this round)
  mixes it.

## 2. The clusters added

| ledger | notable          | lines (units)                                            | smalls                                                  | file / ids                                       | hangs on                                                                                                       | steps (Mystic / neighbour) |
| ------ | ---------------- | -------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------: |
| MY-2   | **Living Verse** | spellDamage(20), life(8): 2.5 + 1.6 = **4.1**            | 2 × spellDamage(8) Mystic side, 1 × life(5) Zealot side | `well.ts`, `spire.well.livingVerse.{a,b,n,c}`    | a straight bridge from `spire.well.toCrypt.r2` to `cathedral.crypt.toSpire.b` (the deferred link)              |             20 / Zealot 18 |
| MY-9   | **Hale Scribe**  | life(12), mana(10): 2.4 + 1.25 = **3.65**                | 4 × life(5), two each side                              | `craft.ts`, `spire.craft.haleScribe.{a,b,n,c,d}` | a bridge from `spire.craft.roadN.a` (the scriptorium stair) to `spire.craft.wandVolley.a`, bend at the notable |                         12 |
| MY-10  | **Sharp Tongue** | daggerSpellDamage(20), castSpeed(6): 2.5 + 1.5 = **4.0** | 2 × daggerSpellDamage(8) Mystic side, 1 Shade side      | `craft.ts`, `spire.craft.sharpTongue.{a,b,n,c}`  | a V from `spire.craft.mistWalk.n` to `knife.hex.toSpire.a` (the deferred link), bend at the notable            |              18 / Shade 16 |

Lines only from `lines.ts`, unedited. Every small in a section carries one line (§8.2); Living Verse's and Sharp
Tongue's two sides are two sections, each uniform, as the brief planned for bridges between two starts (each start's
caster pays in its own coin). Every small belongs to its notable (§8.7). Names: `npx vitest run src/data/ip.test.ts`
passes; `grep -i` of `reference/tree/ref-tree.json` and `ref-phrases.json` finds none of Living Verse, Hale Scribe, Sharp
Tongue (nor Verse, Scribe, Tongue, Hale); "Sound Body", my first name for MY-9, is taken by a centre notable.

**Layout.** Living Verse lies straight on the line between its two road nodes, smalls 70 and 55 apart beside the
notable, the rest of the distance on the links out. Hale Scribe bends 25° at its notable so its last link meets Wand
Volley's entrance 65° from Frugal's link instead of 51° (a near-miss), and leaves the stair's straight run at 97° and 83°.
Sharp Tongue's Shade leg arrives at the Shade's road node from due west, square to that road (the straight line from
Mist Walk would have met it 38° from the road's own link); its Mystic leg runs straight to Mist Walk, which becomes a
three-way notable. Piercing Word's chain leaves the east join at 84° and 95° from its neighbours (Siphon, Flashpoint)
and meets Harsh Weather 80° from its chain.

**Twins and partners** (steps between notables on the network, scratch BFS):

| new                   | twin (same want)                                  | steps | partner here / there                                         |
| --------------------- | ------------------------------------------------- | ----: | ------------------------------------------------------------ |
| Living Verse          | Quiet Pulse (life)                                |     7 | spell damage / regeneration                                  |
|                       | Piercing Word, Keen Verse, Arcane Focus           |   18+ | (spell damage, the far side)                                 |
|                       | Familiars (has an 8% spell line)                  |     3 | minion-led; not a spell cluster                              |
| Hale Scribe           | Warm Blood (life)                                 |    10 | mana / shield                                                |
|                       | Quiet Pulse                                       |    11 | mana / regeneration                                          |
|                       | Living Verse                                      |    18 | mana / spell damage                                          |
| Sharp Tongue          | Keen Verse (spell damage)                         |     9 | dagger and cast speed / crit                                 |
|                       | Athame, Ritual Blade (the Shade's dagger casters) |    11 | cast speed / theirs                                          |
|                       | Quiet Knife (dagger)                              |    15 |                                                              |
| Piercing Word (moved) | Arcane Focus                                      |    13 | penetration / cast speed                                     |
|                       | Keen Verse                                        |    12 | penetration / crit                                           |
|                       | Flashpoint, Thunderhead, Siphon                   |     5 | (fire crit, lightning speed, shield on hit: different kinds) |

All twins at 7 or more. **Convergence rule**: no new cluster pairs spell damage with energy shield; Living Verse pairs
spell damage with life, the life caster's own pair, at 20 steps from the Mystic and 18 from the Zealot ("rare and far").
Piercing Word is 5 from Siphon (shield on hit, recovery): separate clusters, as in round 1 (4 then).

## 3. Deferred border links laid

Exactly as listed in `G2/borders.md` §4, both ends, in my area files:

- **MY-2 ↔ `cathedral.crypt.toSpire.b`** (the Undercroft bridge): `spire.well.livingVerse.c – cathedral.crypt.toSpire.b`,
  in `well.ts`. It meets the Zealot's road node 93° and 79° from its neighbours.
- **MY-10 ↔ `knife.hex.toSpire.a`** (the dagger caster's bridge): `spire.craft.sharpTongue.c – knife.hex.toSpire.a`, in
  `craft.ts`.

No other link across a region line was written, cut or re-aimed.

## 4. Ids and links

- **New ids (13):** `spire.well.livingVerse.{a,b,n,c}`, `spire.craft.haleScribe.{a,b,n,c,d}`,
  `spire.craft.sharpTongue.{a,b,n,c}`.
- **Changed or removed: none.** Piercing Word's four ids moved with it (`spire.frost.piercing.c` is now the chain's
  second small rather than the ring's south side).
- **Links cut:** `spire.frost.stream.n – highVeil.a`, `spire.frost.toShatter.r1 – piercing.a`, `piercing.b – jArm.a`, and
  Piercing Word's ring links (a–n, n–b, b–c, c–a).
- **Links added:** `spire.frost.jStorm.a – piercing.a`, `piercing.a – c – n – b`, `piercing.b – harshWeather.n`;
  `spire.well.toCrypt.r2 – livingVerse.a` and the cluster's chain; `spire.craft.roadN.a – haleScribe.a`,
  `haleScribe.d – wandVolley.a` and the chain; `spire.craft.mistWalk.n – sharpTongue.a` and the chain; the two deferred
  links (§3).
- **Re-line:** Deep Well `mana(20), manaRegen(20)` → `mana(16), castSpeed(8)` (4.5 → 4.0 units).
- **Reasons updated to match:** the headers of `frost.ts`, `craft.ts`, `well.ts`; High Veil and its south-east small,
  Steady Stream, Harsh Weather and its notable, the Deep Well wheel and notable, the north-west rim road and its nodes
  `rim.a`, `rim.b` (in `fire.ts`).

## 5. Changes from the brief, and why

- **Piercing Word** is no longer on the spine (MY-11's brief: "a caster walking up to Shatter passes it"). The user's
  round-1 decision reverses that reason; the place was chosen by measuring four (§1).
- **High Veil** is a dead-end tip instead of the bridge round 1 made of it (the user's choice of option b).
- **Hale Scribe** bends at its notable instead of the straight line (§2, layout), and sits at (420,−2560), 30 units
  from the brief's point.
- **Sharp Tongue** is a V for the junction angle, 18 steps from the Mystic start (the brief guessed 21).
- **Deep Well's re-line** is new, for CONSTRAINTS §4.8 (the user's guidance on homes), not from the brief.
- Not done this round, by the user's later instruction: any label check.

## 6. Checks

- **Geometry** (`geometry.ts --region mystic --bends`): **crossings 0, drawn over 0**. Bends over 20°: 15 (15 at the end
  of round 1). New: `highVeil.a` 89°, a corner of High Veil's ring, now a two-link node since Steady Stream's link went
  (as the ring's other inner corner `highVeil.c` is). Gone: `piercing.c` (the ring is a chain now). No new road bend.
- **Audit** (`passives:audit -- mystic`): problems 0; 228 nodes (119 smalls, 45 notables, 58 road, 5 keystones).
  Notables 3.0 to 5.0 units, **none outside** (lowest Frugal 3.0, highest Quickening and Cinder 5.0; new: Living Verse
  4.1, Hale Scribe 3.65, Sharp Tongue 4.0, Deep Well now 4.0).
- **Ways in** (§3.5): Living Verse 2 (the Undercroft road, the Zealot's crossing road), Hale Scribe 2 (the stair, Wand
  Volley), Sharp Tongue 2 (Mist Walk, the Shade's crossing road), Piercing Word 2 (the east join, Harsh Weather), Harsh
  Weather 3. Every area keeps several links in and out (audit list). Single ways in, on purpose: High Veil (the rim
  road's tip), Steady Stream (a pocket off the climb), both §13.5's far tip and pocket.
- `npx tsc --noEmit -p .`: clean. `buildAll` problems with a `spire.` id: 0.

### The allocator

`passives:builds -- --only caster-es,caster-life,summoner,wand-attack,channeller,dagger-caster`, run before my first
edit and after the last, on the shared tree (other regions' new clusters such as Shifting Ward, Hoarded Breath, Shroud,
Rood Screen appear in the lists; indicative only). Main stats in units at 120 → 140 → 160 points; the dagger caster was
not run before.

| archetype     | main stat             | before (this round's start) | after                     |
| ------------- | --------------------- | --------------------------- | ------------------------- |
| caster-es     | spell damage          | 26 32 37.5 (+44%)           | 33.5 42 42 (+25%)         |
|               | energy shield         | **43 43 43 (0%)**           | **40.2 40.2 52.8 (+31%)** |
|               | cold                  | 9.2 9.2 12.8                | 9.2 9.2 9.2               |
|               | cast speed            | 7.8 12.3 13.8               | 11.3 14.8 14.8            |
| caster-life   | spell damage          | **33.3 34.5 34.5 (+4%)**    | **31.3 39.8 41.8 (+34%)** |
|               | life                  | 23.8 30.8 37.8              | 32.2 34.8 42.8 (+33%)     |
|               | spell crit            | 13.4 flat                   | 8.4 flat                  |
| summoner      | minions               | 17.9 21.5 21.5              | 26.5 flat                 |
|               | energy shield         | 42.2 49 53.6                | 50.8 55.2 59.6            |
| wand-attack   | wand damage           | 12.7 flat                   | 12.7 flat                 |
|               | energy shield         | 39 41 47.6                  | 45.6 45.6 52              |
| channeller    | channelling and spell | 28.8 30.8 30.8              | 33.3 33.3 40.8 (+23%)     |
|               | energy shield         | 43 44 44 (+2%)              | 31 40.4 40.4 (+30%)       |
|               | mana sustain          | 25 30 44                    | 26.8 30.8 30.8            |
| dagger-caster | spell damage          | (not run)                   | 46.5 48.5 49.8            |

- **The two hot spots are gone.** The classic caster's shield at 120 fell 43 → 40.2 and now climbs 31% to 160 (it was
  flat); its 120-point plan gives up High Veil, Keen Verse and Hedge Magic, and its 60-point plan gives up High Veil,
  Shatter and Keen Verse: wanted notables of 3 to 3.6 units each. The channeller's shield, flat before, climbs 30%.
- **The life caster's spell damage is no longer flat** (+4% → +34%): at 120 it gives up Living Verse and Homily (the
  west) for the east's.
- **Strength by the back door (G-growth §4):** the life caster's life at 120 rose 23.8 → 32.2: Hale Scribe sits one
  step off its stair, 12 from the start (question 2). It still climbs 33% to 160, and its spell damage at 120 fell 2
  units, so it is a trade inside the build, not a gain everywhere. The classic caster's spell damage at 120 rose 26 →
  33.5, mostly Living Verse and the Zealot's Homily and Glass Wall through the new Undercroft bridge (question 3). The
  summoner's and wand attacker's shield rose by 6 to 9 units at 120; neither took a cluster of this round for it (their
  plans take the other regions' new Shroud, Hoarded Breath and Rood Screen), so that is the shared tree, not this round.
- **Channeller sustain** at 160 fell 44 → 30.8 between the two runs, mostly the shared tree: the channeller's 160-point
  plan changed. Isolated on one snapshot (Deep Well's old lines put back in memory), Deep Well's re-line costs it 2.5
  sustain units (29.3 → 26.8 at 120, 33.3 → 30.8 at 160) and gives the classic caster 2 units of cast speed at every
  point count; nothing else in either plan changed. Flagged with question 1.
- **Joint targets** for these six: typical main stat +19% from 120 to 160 (the five were 22% at the start; the classic
  caster and the channeller improved most, the summoner and the wand attacker are flat on minions and wands, which round
  3's MY-6 and MY-7 address); stats gaining 10% or less 30% (was 41% for the five); gave-up notables worth 2.5+
  typically 4 (was 2); choice three or more for all six at 120; tax typically 37% (36%), caster-es 33%, caster-life 33%.
- **Choice at 60:** the summoner and the channeller have one plan at 60 (the channeller had three at this round's
  start). The channeller's 60-point plan runs west to Living Verse, Homily and Glass Wall (question 3).

## 7. Walks (by hand on the map; the numbers are points spent in the walk's order, not the BFS steps of §2)

**1. The classic caster, 20 points (main build).** Start → shield side (1) → First Light (2) → the west hub and the
west road (3–6) → the wheel's entrance (7) → **Glass Skin** (8, shield with mana). Then the choice the re-line made: on
round the wheel to **Deep Well** (9–10, mana and cast speed) for the west junction, or up Spirit Ward's two smalls to the
column junction (9–11). Taking both: Deep Well (10), then back past Glass Skin to Spirit Ward's smalls and the junction
(11–13) → Broad Weave's entrance (14) → **Composure** (15–16, shield and avoid stun) or **Broad Weave** (15, spell area) →
the star's cold spoke and **Prism Ward** (17–18) → 2 left: Warm Blood's small, or Arcane Focus's first small. _Chose:_
shield (Glass Skin, Composure), speed (Deep Well), area or resistances. _Gave up:_ Arcane Focus (8 steps, the east),
Warm Blood, Still Mind, Sharp Mind. _No-choice stretch:_ the west road's three nodes, Spirit Ward's shield smalls on the
climb. _Nobody takes:_ Spirit Ward without a shield.

**2. The life caster, 20 points (off-build).** Start → crit side (1) → east hub (2) → **Sharp Mind** (3–5, spell crit)
→ the east road (6–7) → **Warm Blood** (8–9, life) → the east road's top (10) → the wheel (11–12) → **Arcane Focus**
(13) → the scriptorium stair (14–15) → **Hale Scribe** (16–18, life and mana) → First Light (19) → 1 left. _Chose:_
crit, life twice, spell damage. _Gave up:_ the west wheel (Glass Skin, Deep Well's speed), Deft Wand, Frugal. _No-choice
stretch:_ the stair (two road nodes, worth it for both Hale Scribe and the column). _The point:_ the east now sells a
defence on the way, so the life caster's first 20 points are not all offence (§4.8).

**3. The Shade's dagger caster coming in, 20 points (neighbour).** Shade start → Quiet Knife (7) → the Stair's junction
→ the crossing road (`knife.hex.toSpire.a`, 15) → **Sharp Tongue** (16–17, dagger spells and cast speed) → its two
smalls → **Mist Walk** (19–20, spell dodge). _Chose:_ the dagger near home, then the Mystic's dagger cluster and a
defence beside it. _Gave up:_ Athame and Ritual Blade, the Shade's own dagger casters (11 from Sharp Tongue each), and
Keen Verse (9 more). (A Zealot life caster comes in the same way on the west: Hymn (4) → Glass Wall (14) → the crossing
road → **Living Verse** (18), giving up the Zealot's north walk.)

**4. The classic caster, 120 points (the allocator's best plan, read on the map).** Home (First Light), both wheels
(Glass Skin, Deep Well, Arcane Focus, Warded Mind), Wandwork; the Column (Broad Weave); **Composure**, Quiet Pulse,
Quickening, **Living Verse**; over the Undercroft bridge to Homily and Glass Wall; up the column to Thunderhead,
Withering, Hoarfrost, Shatter and **Piercing Word**; the Shade side for Devotion, Thick Blood, Quiet Knife, Rotting
Word, Shroud, Hoarded Breath, Shifting Ward, Hollow Vessel, Hasty Words. _Chose:_ spell damage in four directions (east
wheel, Living Verse west, Piercing Word north-east, the Shade), shield west and in the Shade. _Gave up (what 40 more
points add):_ **High Veil** (3.6), Hedge Magic (3.5), **Keen Verse** (3.1), Rood Screen (2.6), Tomb Dust: the far shield
at the top left and the crit spell damage east, both wanted. _Stretch with no choice:_ the climb from the fork to the
west join (roads). _Notables nobody of the six takes:_ Spirit Ward, Lingering, Draught, Harsh Weather (now a bridge,
it may change), Mind Bulwark; Steady Stream only the channeller.

## 8. Plan for round 3

- **MY-3** (spell damage with mana regeneration, three cast speed smalls) on the Eaves between r1 and r2, outward:
  Piercing Word is about 8 from it (through Harsh Weather and the Eaves' first node), at the ledger's minimum or more;
  check it when laid.
- **MY-6** (the crit wand) between `spire.storm.overcharge.c` and the Eaves' r4: the wand attacker is flat on wand damage
  and attack speed at every point count, the round's main remaining gap.
- **MY-7** (minion damage with curse effect) on the north-west rim road between b and c, outward: the summoner's minions
  are flat 120 → 160 (26.5). The rim road is a spur to High Veil now, so MY-7 sits on the way to the far shield.
- **Room this round freed:** the triangle on the west climb where Piercing Word was (between the Lantern's west join, the
  arm's junction and Steady Stream). Not to be filled with spell damage or shield again.

## 9. Open questions

1. **Deep Well's re-line** (mana and regeneration → mana and cast speed) is the one change near home. It mixes the
   Cloister's first notables (§4.8) but the Cloister within 14 steps is still mostly defence (7.8 offence units against
   23.5 defence), and it costs the channeller 2.5 sustain units. **And a tension to see plainly (§8.3):** the classic
   caster wants both sides of the west wheel (speed and shield), and the allocator takes both Deep Well and Glass Skin in
   every plan; the wheel was already a take-both for it before (mana and shield). I read it as §8.3's second kind (a
   route to the west junction takes one side, the other is a two-node detour), but it is close to the user's own example
   of a fake choice. Keep it, or mix the Cloister another way (Composure's avoid stun to cast speed, keeping its
   shield), leaving Deep Well as it was?
2. **Hale Scribe** gives the life caster 8 more life units at 120 (it sits one step off the stair the life caster walks).
   Keep its four life smalls (the brief's, MY-s6 folded in), or trim to three?
3. **The Undercroft bridge** (Living Verse, laid as deferred) puts the Zealot's Homily and Glass Wall in the classic
   caster's and the channeller's 60-point plans. That is the cross-region trade the bridge was laid for, but it is also
   where their spell damage at 120 rose. Watch after round 3, when the Zealot's far shields are in.
4. **High Veil as the rim road's tip**: the road no longer joins the climb. If the user wants the top left a loop again,
   the cheapest second way in is a link from MY-7's pocket (round 3) to somewhere other than the climb.

Nothing here felt like it was losing intent. The first try for Piercing Word (the far rim) did, on measuring: it would
have made a new destination of the west, which is the thing this round was fixing, so it was undone before the end.

## 10. CONSTRAINTS checklist

- **§1 What the tree is for.** Two hot spots fixed (High Veil, the climb); measured: the classic caster's shield and the
  life caster's spell damage stopped being flat. Not at the others' expense: no road added, the starts untouched,
  defences still varied; one back door named (question 2).
- **§2 The reference.** Not consulted beyond the briefs' facts (twins 5+, 3 to 5 units). New names plain, checked by the
  ip test and by grep. The reference game is not named here.
- **§3 A network.** Three new bridges with two ways in each; Harsh Weather a bridge again; High Veil and Steady Stream
  one way in each, on purpose (a far tip, a pocket; §13.5); the two deferred links laid, nothing else across a border.
- **§4 Regions and areas.** §4.8 applied to the home (§1 table): the Cloister got an offensive pick, the Scriptorium a
  defence. Defences in the Mystic: shield, life (Warm Blood, Quiet Pulse, Hale Scribe, Living Verse), resistances,
  spell block, dodge, avoid stun, chaos resistance.
- **§5 Specializations.** Spell damage now in five directions with five partners (cast speed, crit, life, penetration,
  and the Eaves' regeneration in round 3); twins 7+ apart; the dagger cluster on the int-int border by the Shade's
  dexterity (§5.4).
- **§6 Starts.** The home untouched; the nearest new notable is Hale Scribe at 12; nothing near home names a weapon.
- **§7 Roads and attributes.** No road node added; the stair, the Undercroft road and the east join gained branches.
- **§8 Clusters and smalls.** One line per section, every small with its notable, notables 3.65 to 4.1; Deep Well
  4.0.
- **§9 Keystones.** None touched; all dead ends.
- **§10 Vocabulary.** Lines from `lines.ts` only; new to the Mystic: `daggerSpellDamage`; `castSpeed` on the west wheel.
- **§11 Looks.** 0 crossings, 0 drawn over; straight chains with bends only at notables or junctions, junction angles
  checked (§2 layout). Labels: ignored by the user's instruction (two had been moved before it).
- **§12 Size.** +13 nodes, the brief's clusters. The allocator is static; no bot simulation.
- **§13 Tensions.** Bridges against dead ends (High Veil's tip); connections against trade-offs (the Undercroft bridge,
  question 3); a generic start against early direction (Deep Well's speed).
- **§14 Rejected ideas.** No generated layout (positions computed by hand from the neighbours, then looked at), no
  filler road, no step-count reach; the allocator measured placements, it did not invent them.
- **§15 How the work is done.** CONSTRAINTS and every brief read first; pictures before and after with explicit paths;
  geometry and tsc after each batch; edits only in `spire/`; no register, bake, commit or stash.
- **§16 Open.** Border counts unchanged except the two deferred links.
