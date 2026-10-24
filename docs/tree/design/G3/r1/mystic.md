# G3 round 1: the Mystic (the Spire)

Done 2026-10-22 for phase G3 of [G-growth.md](../../G-growth.md), round 1 of about three, from
[G1/mystic.md](../../G1/mystic.md) as joined in [G1-brief.md](../../G1-brief.md) and laid on the skeleton of
[G2/mystic.md](../../G2/mystic.md). [CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Edits only in
`src/data/passives/spire/`; nothing registered, baked or committed; no link across a region line added, cut or re-aimed.
Five other region agents worked in the same tree at the same time, so the allocator readings below are indicative.

**Pictures** ([mystic/](mystic/)): `before.png` and `after.png` (the region), `top-west.png` (High Veil, Piercing
Word, Bright Wand, Siphon's new small, with every node's lines), `east.png` (Keen Verse), `cloister.png` (Composure).

**Node count: 193 → 215** (+5 notables, +17 smalls: 16 in the new clusters and Siphon's second small). No road node
added, none removed.

---

## 1. What this round took, and why

Five of the brief's eleven new clusters (a little over a third), in the order of the instructions' priorities:

| id    | cluster       | (a) the flattest wants                                                                                          | (b) closes a G2 end                                                                                   | (c) where                 |
| ----- | ------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------- |
| MY-8  | Composure     | energy shield, the caster's second main want, in a second direction from the home                               | `spire.well.toPulse.a` (one link)                                                                     | the Cloister, west-centre |
| MY-11 | Piercing Word | spell damage, flat for every caster (caster-es 21 → 23, caster-life 19.8 → 19.8 at 120 → 160 before this round) | gives the west climb to Shatter something off it                                                      | the spine (the Belfry)    |
| MY-1  | Keen Verse    | spell damage, east direction                                                                                    | gives the road to Wand Volley a branch                                                                | the Scriptorium, east     |
| MY-4  | High Veil     | energy shield, the far direction                                                                                | `spire.frost.stream.n` (dead end) and `spire.fire.rim.a` (the north-west rim road's head, one way in) | the top left              |
| MY-5  | Bright Wand   | wand damage: the wand attacker was flat at **every** point count (7.7 units from 60 to 160)                     | (none)                                                                                                | the Lantern, north-west   |

MY-5 is the one past a strict third. It is in because Wand Volley's approved re-line (crit to speed, MY-r3) takes
supply from the wand attacker in this same round, and wands are a build the user named (CONSTRAINTS §5.7, §1.1); without
it the round would have left the flattest build flatter.

**Deferred border links laid: none.** Only MY-2 and MY-10 carry deferred links (`G2/borders.md` §4), and neither is in
this round. No link across a region line was written, cut or re-aimed.

## 2. The re-lines (approved at stop 2)

| notable / node           | before                                                     | after                                                       | units         |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- | ------------- |
| Warded Mind (MY-r1)      | es(12), resOne(chaos, 15), mana(8)                         | resOne(chaos, 16), mana(8), manaRegen(10)                   | 5.3 → 4.0     |
| `spire.craft.focus.d`    | es(5)                                                      | resOne(chaos, 8)                                            | 1 → 1         |
| Glass Skin (MY-r2)       | es(16), esRecharge(20)                                     | es(16), mana(10)                                            | 4.5 → 4.45    |
| Wand Volley (MY-r3)      | wandAttack(24), weaponSpeed(wand, 8), weaponCrit(wand, 15) | wandAttack(24), weaponSpeed(wand, 12)                       | 4.6 → 4.4     |
| Quickening (MY-m1 price) | esRechargeDelay(30), esRecharge(20), es(5)                 | esRechargeDelay(30), esRecharge(15), es(5)                  | 5.3 → 5.0     |
| Siphon (MY-m2)           | one esOnHit(4) small                                       | a second esOnHit(4) small, `siphon.b`, on the junction side | (notable 4.5) |

Every Mystic notable is now 3.0 to 5.0 units (`passives:audit`): none outside the range. The east wheel is now spell
damage (Arcane Focus) or chaos resistance (Warded Mind), so a caster's near energy shield is west (Glass Skin, now ES with
mana) and in the home. Elemental Ward (the stop-3 exception) is the Vanguard's and was not touched here.

Stale reasons updated to match: Arcane Focus's wheel, Warded Mind, Glass Skin, Wand Volley, Deft Wand (it named Wand
Volley's crit), Siphon, Steady Stream, Broad Weave, `toPulse.a` and its link, the north-west rim road and its head node,
and the headers of `craft.ts`, `well.ts` and `fire.ts`.

## 3. The clusters added

| ledger | notable       | lines (units)                                            | smalls             | file / ids                                    | hangs on                                                                                              | steps from the Mystic start |
| ------ | ------------- | -------------------------------------------------------- | ------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------: |
| MY-8   | Composure     | es(15), stunAvoid(20): 3 + 1 = **4.0**                   | 3 × es(5)          | `well.ts`, `spire.well.composure.a/b/n/c`     | bridge `spire.well.toPulse.a` → `spire.column.broadWeave.a`, straight                                 |                          13 |
| MY-11  | Piercing Word | spellDamage(20), elePenetration(3): 2.5 + 2 = **4.5**    | 3 × spellDamage(8) | `frost.ts`, `spire.frost.piercing.a/n/b/c`    | four-node ring bridging `spire.frost.toShatter.r1` → `spire.frost.jArm.a` (arrives from due west)     |                          19 |
| MY-1   | Keen Verse    | spellDamage(20), spellCritMulti(18): 2.5 + 1.5 = **4.0** | 4 × spellDamage(8) | `craft.ts`, `spire.craft.keenVerse.a/b/n/c/d` | a V bridging `spire.craft.toVolley.r2` → `spire.craft.toDev2.a`, the notable at the tip               |                          17 |
| MY-4   | High Veil     | es(15), resAll(6): 3 + 1.5 = **4.5**                     | 3 × es(5)          | `frost.ts`, `spire.frost.highVeil.a/n/b/c`    | four-node ring: Steady Stream's chain runs on into it; the north-west rim road lands on its small `b` |                          23 |
| MY-5   | Bright Wand   | wandAttack(24), eleAttack(20): 2 + 2 = **4.0**           | 3 × wandAttack(12) | `fire.ts`, `spire.fire.brightWand.a/n/b/c`    | four-node ring bridging `spire.fire.jArm.a` → `spire.frost.jFire.a` (arrives from due west)           |                          18 |

Every small in each section carries the same line (§8.2); every small belongs to its notable (§8.7). The three
four-node rings match the Belfry's and the Lantern's own (Thunderhead, Shatter, Hoarfrost, Cinder, at radius 56); a road
through a ring takes the notable side or the small side. On High Veil the road walks the three shield smalls and the
notable is the outer side, a step off the road, as the brief asked (rim roads land on smalls, never notables).

**Twins and partners** (steps between notables, measured on the network, scratch BFS):

| new           | twin (same want)              | steps | partner here / there                         |
| ------------- | ----------------------------- | ----: | -------------------------------------------- |
| Composure     | Glass Skin (ES)               |     6 | stun / mana                                  |
|               | Quickening (ES)               |     7 | stun / recharge                              |
|               | Siphon (ES)                   |     9 | stun / on hit                                |
| High Veil     | Siphon                        |    10 | resistances / on hit                         |
|               | Hoarfrost (cold with ES)      |    10 | resistances / cold                           |
|               | Glass Skin                    |    16 |                                              |
| Piercing Word | Arcane Focus (spell)          |    13 | penetration / cast speed                     |
| Keen Verse    | Arcane Focus                  |    10 | crit multiplier / cast speed                 |
|               | Piercing Word                 |    14 | crit multiplier / penetration                |
|               | Flashpoint (spell crit, fire) |     7 | (crit for spells; different element)         |
| Bright Wand   | Wand Volley (wand)            |    10 | elements / speed (ledger asked 12, brief ~9) |
|               | Deft Wand (wand)              |    18 | elements / accuracy                          |

All at 6 or more. **Convergence rule** (spell damage with ES): no new cluster pairs them. The nearest new spell-ES
pairings are separate clusters well out from the home: Piercing Word → Siphon 4 steps (Siphon is ES on hit and leech,
recovery; both 18 to 19 out), Piercing Word → High Veil 8, Keen Verse → Composure 10, Keen Verse → High Veil 18. See open question 1.

**Steps from the neighbours' starts** (no new notable comes near another start): Zealot start → Composure 15, Bright
Wand 20, Keen Verse 21, Piercing Word 23, High Veil 24; Shade start → Keen Verse 17, Composure 18, Bright Wand 22,
Piercing Word 23, High Veil 27.

## 4. Ids, moves, links, labels

- **New ids (22):** `spire.well.composure.{a,b,n,c}`, `spire.frost.piercing.{a,n,b,c}`, `spire.craft.keenVerse.{a,b,n,c,d}`,
  `spire.frost.highVeil.{a,n,b,c}`, `spire.fire.brightWand.{a,n,b,c}`, `spire.frost.siphon.b`. **None changed or removed.**
- **Moved:** `spire.fire.rim.a` (the north-west rim road's head) from (−850,−4500) to (−932,−4446), on the same straight
  line, to the middle of the run between `rim.b` and High Veil, so it does not crowd the ring's inner small.
- **Links:** `spire.frost.siphon.n – jArm.a` became `siphon.n – siphon.b – jArm.a`. New: `toPulse.a – composure.a`,
  `composure.c – broadWeave.a`, `toShatter.r1 – piercing.a`, `piercing.b – jArm.a`, `toVolley.r2 – keenVerse.a`,
  `keenVerse.d – toDev2.a`, `stream.n – highVeil.a`, `highVeil.b – spire.fire.rim.a`, `fire.jArm.a – brightWand.a`,
  `brightWand.b – spire.frost.jFire.a`. All inside the Mystic.
- **Area labels** (scratch check: each name's box, 150 units tall, 0.58 × 150 per glyph, padded 10, against every
  notable, keystone and start and every other name):
  - The Lantern (−950,−3630) → (−950,−3530): it lay on Bright Wand.
  - The Belfry (−120,−3920) → (−120,−3980): it lay on Piercing Word.
  - The Gallery (880,−3719) → (820,−3740): it touched Pain Conduit's frame (before this round; cheap to fix beside the
    others).
  - Left as they were, flagged: the Scriptorium's name lies on Frugal and the Spire gate's on the start (both before
    this round; the Scriptorium has no free spot that clears Arcane Focus, Wand Volley and Mana Bastion: question 3);
    **the Shade's Stair label lies on Hexwright** (the Shade's file, not mine).
- No new band without a label: every new cluster is inside an existing area.

## 5. Changes from the brief, and why

- **Composure** is laid straight on the line from `toPulse.a` to `broadWeave.a` (notable at (−442,−2714)), not at the
  brief's (−540,−2500), which is off that line; 13 steps (brief ~14).
- **Piercing Word** is a four-node ring, not a chain: `toShatter.r1` and `jArm.a` are 256 units apart, too short for a
  notable and three smalls in a straight line without drawing nodes over each other. A ring keeps three smalls, arrives
  at the junction from due west (G2's note: a clean cross) and matches the Belfry's other clusters. Its notable is north
  of the ring, under where the Belfry's name was.
- **Keen Verse**'s notable at (1000,−2930), 30 units south of the brief's point, so its east leg meets `toDev2.a` 63°
  from Mist Walk's link rather than 48°.
- **High Veil** is a ring whose south-east side continues Steady Stream's chain and whose west side sits on the straight
  line of the north-west rim road; the ring takes the turn between the two (a ring corner), so neither `stream.n`'s chain
  nor the road bends at a two-link node.
- **Bright Wand** at (−639,−3647) instead of (−650,−3760): it arrives at the west join from due west, between
  Hoarfrost's link (25° away at the brief's height) and the Prismatic spur.
- **MY-5 brought into round 1** (§1).

## 6. Checks

- **Geometry** (`geometry.ts --region mystic --bends`): **crossings 0, drawn over 0**. Bends over 20°: 15 (12 before).
  The three new ones are ring corners of the new rings (`highVeil.c` 91°, `brightWand.c` 90°, `piercing.c` 90°: the
  inner small of each four-node ring, as Cinder's and Overcharge's are). No new road bend.
- **Audit** (`passives:audit -- mystic`): problems 0; 215 nodes; notables 3.0 to 5.0 units, none outside. Ways in:
  Composure 2 (Quiet Pulse's road, Broad Weave), Piercing Word 2 (the west climb, the Belfry junction), Keen Verse 2 (the
  Wand Volley road, the Mist Walk road), High Veil 2 (Steady Stream, the rim road), Bright Wand 2 (the Lantern junction,
  the west join). The north-west rim road now has three ways in (High Veil, Cinder, the far loop), Steady Stream is a
  bridge, `toPulse.a` has two links. Every area keeps two or more (audit's link lists).
- **Names**: `npx vitest run src/data/ip.test.ts` passes; `grep -i` of `reference/tree/ref-tree.json` and
  `ref-phrases.json` finds none of Composure, Piercing Word, Keen Verse, High Veil, Bright Wand.
- `npx tsc --noEmit -p .`: clean.

### The allocator (`passives:builds -- --only caster-es,caster-life,summoner,wand-attack,channeller`)

Run before my first edit and after the last, on the shared tree (other regions' new clusters, such as Hasty Words, Rood
Screen, Hoarded Breath and Wiry Frame, appear in the lists): indicative only. Main stats in units at 60 → 80 → 100 ·
120 → 140 → 160 points.

| archetype   | main stat             | before                          | after                           |
| ----------- | --------------------- | ------------------------------- | ------------------------------- |
| caster-es   | spell damage          | 15 15 21 · 21 21 23             | 19.5 27 27 · 26 32 37.5         |
|             | energy shield         | 16.8 26.4 30 · 32.2 35.8 37.8   | 22.6 25.4 33.2 · **43 43 43**   |
|             | cold                  | 9.2 9.2 9.2 · 11.2 12.8 16.4    | 6.8 9.2 9.2 · 9.2 9.2 12.8      |
| caster-life | spell damage          | 15.8 15.8 15.8 · 19.8 19.8 19.8 | 23.8 29.3 33.3 · 33.3 34.5 34.5 |
|             | spell crit            | 6.9 flat                        | 8.4 8.4 8.4 · 13.4 13.4 13.4    |
| summoner    | minions               | 14.7 21.5 21.5 · 21.5 flat      | 13 16.7 16.7 · 17.9 21.5 21.5   |
|             | energy shield         | 23 27 35.2 · 38.8 38.8 40.4     | 26.6 34.6 37.2 · 42.2 49 53.6   |
| wand-attack | wand damage           | 7.7 flat everywhere             | 7.7 12.7 12.7 · 12.7 flat       |
|             | energy shield         | 24 24 24 · 26 26 26             | 30.4 31.4 41 · **39 41 47.6**   |
| channeller  | channelling and spell | 12.8 12.8 12.8 · 18.8 18.8 18.8 | 14.3 18.3 24.8 · 28.8 30.8 30.8 |
|             | energy shield         | 17 21 24.6 · 30.6 30.6 34.2     | 20 28.6 34.4 · 43 44 44         |

- **Growth 120 → 160 got better where it was worst:** caster-es spell damage +44% (was +10%), the wand attacker's
  wand damage now has a step at 80 (Bright Wand), the summoner's minions climb 18 → 21.5. The joint targets for these
  five: typical main stat +22% from 120 to 160 (was 12%); stats gaining 10% or less 41% (was 47%); gave-up notables
  worth 2.5+ typically 2 (was 1); choice three or more for all five (was 3 of 5); tax typically 36% (35%), caster-es 29%
  (was 36%).
- **Still flat:** caster-life's spell damage 120 → 160 is 33.3 → 34.5 (+4%), the wand attacker's wand damage
  12.7 → 12.7 and attack speed 17 → 17. Round 2's MY-2 (spell damage with life) and round 3's MY-3 (far spell damage)
  and MY-6 (the crit wand) are their answers.
- **Strength by the back door (G-growth §4): yes, in energy shield and in spell damage at 120.** Caster-es holds 43
  ES units at 120 (was 32) and 40 more points add **none**: it now takes every ES cluster in reach, Composure and High
  Veil included, and the far ES of the other regions (SH-1, SH-13, ZE-10, ZE-11) is not built yet. The wand attacker's
  ES at 120 rose 26 → 39, the channeller's 30.6 → 43. Caster-life's spell damage at 120 rose 19.8 → 33.3 and caster-es's
  21 → 26. Choice and gave-up lists improved at the same time, so it is not strength alone, but the ES column is the
  clearest sign that this round's two ES clusters are cheap to reach together. See open question 1.
- **Attributes** fell, not rose (no road added): caster-es at 120 int 254 → 196, dex 67 → 36, str 43 → 12; the wand
  attacker's dex 200 → 155. Builds stay home more.
- The **caster-es 60-point plan** now runs up the west climb and takes Hoarfrost, Piercing Word, Shatter, Steady Stream
  and High Veil together: the brief's plan (a) "shield-first", reached by 60 points.

## 7. Walks (by hand on the map; steps from the scratch BFS)

**1. The classic caster, 20 points (main build).** First Light (2) → the west hub and the well road (6) → Glass Skin (8;
ES with mana now) → Spirit Ward's two smalls to the Column junction (10–11) → Broad Weave's entrance (12) → **Composure**
(14; ES, avoid stun) → back through the junction up the scriptorium stair to **Arcane Focus** (18) and its mana small
(19–20). _Chose:_ shield west and near, then spell damage east. _Gave up:_ Warm Blood, Deep Well, Still Mind, Sharp
Mind; the spine (Prism Ward, Broad Weave) for now. The east wheel no longer hands it shield on its far side: Warded Mind
is now a chaos-resistance detour it skips. _No-choice stretch:_ the three road nodes of the west highway, and Spirit
Ward's two shield smalls on the climb (worthless without a shield, a known tax). _Nobody takes:_ Spirit Ward here.

**2. The wand attacker, 20 points (off-build).** Point 1 east or west; Deft Wand (6) off the west road → Warm Blood
across the gate (10) → the east road → Arcane Focus's wheel (15, passed through) → Frugal → **Wand Volley** (20; now the
fast wand: damage and speed). _Chose:_ the near wand and the fast wand. _Gave up:_ Glass Skin's shield (west); **Bright
Wand** (18 from the start, by the Column and Withering) is the other direction: the elemental wand costs the fast one at
20 points. _No-choice:_ Arcane Focus's spell small and notable are tax for a wand attacker (it may route by the wheel's
south side instead, now chaos resistance, which it can use).

**3. A Zealot energy-shield caster coming in, 20 points (neighbour).** Hymn → the Cathedral crossing (two nodes) →
Wandwork's notable (9) → the Cloister junction → **Glass Skin** (11) → Spirit Ward's smalls → the Column junction →
**Composure** (15) or Broad Weave. _Chose:_ the Mystic's two west shield notables. _Gave up:_ the Zealot's own Undercroft
ES and spell damage (Homily, Glass Wall), and Deep Well's mana. Keen Verse (21) and Piercing Word (23) are too far for
it at 20: the Mystic's new spell damage is not a Zealot's convenience.

**4. The classic caster, 120 points (the allocator's best plan, read on the map).** Home (First Light, Still Mind, Warm
Blood), both wheels (Glass Skin, Deep Well, Arcane Focus, Warded Mind), Wandwork, Frugal; the Column (Broad Weave,
Darting Bolts, Prism Ward); **Composure**, Quiet Pulse, Quickening; Withering, Hoarfrost, Thunderhead, **Piercing Word**,
Shatter, Steady Stream, **High Veil**; **Keen Verse** on the east; Homily and Glass Wall over the Undercroft crossing;
Devotion, Rotting Word, Thick Blood, Shroud, Hollow Vessel on the Shade side. _Chose:_ every shield in reach and the
spell damage of the spine, east and west. _Gave up (what 40 more points add):_ Hasty Words, Hedge Magic and Quiet Knife,
all spell damage or cast speed in the Shade (3 to 4 units each). _Stretch with no choice:_ the climb from the Column to
the Belfry's west join (roads). _Notable nobody takes:_ Spirit Ward, Lingering, Draught. _The problem it shows:_ it
gives up spell damage, never shield; ES is complete at 120 (question 1).

## 8. Plan for rounds 2 and 3

- **Round 2:** MY-2 (spell damage with life, on the Undercroft road; lays the deferred MY-2 ↔
  `cathedral.crypt.toSpire.b`), MY-10 (dagger spell damage with cast speed, off Mist Walk; lays the deferred MY-10 ↔
  `knife.hex.toSpire.a`), MY-9 (life with mana, between the scriptorium stair and Wand Volley). Why: the two that carry
  border crossings and the life caster's flat spell damage and thin life; spread west, east and centre.
- **Round 3:** MY-3 (spell damage with mana regeneration, the Eaves r1–r2), MY-6 (the crit wand, Overcharge–r4), MY-7
  (minions with curse effect, the north-west rim road b–c). Why: they fill the two rim roads, which are already bridged.
- **Before round 2, re-measure ES** with the other regions' round-1 clusters in. If the Mystic casters still finish ES
  at 120, the lever is on this side (question 1), not more road.

## 9. Open questions

1. **Energy shield is now complete at 120 for the Mystic casters** (caster-es 43 units, flat to 160; wand attacker and
   channeller up 10+ units). Options: (a) wait for the far ES of the other regions' later rounds (SH-1, SH-13, ZE-10,
   ZE-11) and re-measure; (b) make one of this round's shields dearer: Composure down to two smalls, or High Veil reached
   only from the rim road (cutting Steady Stream's link, which also undoes Steady Stream as a bridge); (c) move a lead:
   High Veil to resistances with a little ES. **The fact that decides between them: High Veil is in caster-es's
   60-point plan.** The brief placed it as "the top", costing "the walk across the top", and priced its entrance from
   inside as "Steady Stream's three nodes"; the allocator pays that at 60 without hesitation, so that entrance is cheaper
   than the brief believed. That argues for (b), the rim-only entrance, over simply waiting. I lean to (a) for one round
   (the far ES elsewhere may change the picture), then (b) if ES is still flat.
2. **The west climb holds a caster's three wants within a few steps** (Hoarfrost cold+ES, Piercing Word spell, Shatter
   cold, High Veil ES, 4 to 10 apart): the brief's "shield-first" plan, now reached by 60 points. Different partners
   each, but it reads close to a destination. Keep, or move Piercing Word one step along the spine (it would need a new
   road node)?
3. **Labels before this round:** the Scriptorium's name over Frugal and the Spire gate's over the start; the Shade's
   Stair name over Hexwright. The Scriptorium is crowded; a fix may mean a two-line or shorter placement. Leave to the
   label pass?

Nothing here felt like it was losing intent; question 1 is the one place the round's own numbers pull against its aim.

## 10. CONSTRAINTS checklist

- **§1 What the tree is for.** Spell damage gains two directions with new partners (crit east, penetration on the
  spine), ES two (stun west-centre, resistances at the top), wands one; the east wheel's spell-and-shield give-both is
  undone. Measured: caster-es spell damage climbs 120 → 160 (+44%); ES does not (question 1). Never at the cost of the
  others: no road added, no start touched, defences stay varied.
- **§2 The reference.** Not consulted beyond the measured facts in the briefs (twins at 5+, 3 to 5 units). New names are
  plain words, checked by the ip test and by grep. The reference game is not named here.
- **§3 A network.** Every new cluster is a bridge with two ways in; Steady Stream, `toPulse.a` and the rim road's head
  stopped being ends; no link across a region line touched; keystone spurs untouched.
- **§4 Regions and areas.** No new area or build-named place; the Mystic's defences now: ES (Glass Skin, Composure,
  Quickening, Siphon, High Veil, Hoarfrost), life, resistances (Prism Ward, High Veil, Warded Mind's chaos), spell block,
  dodge, avoid stun (Composure).
- **§5 Specializations.** Twins 6 to 18 steps apart with different partners (table, §3); wands in four directions with
  four partners (two built now); weapons by their attribute (wands in the int region).
- **§6 Starts.** Home untouched; the nearest new notable is Composure at 13 steps; nothing near home names a weapon.
- **§7 Roads and attributes.** No road node added; three road stretches gained branches (the west climb, the Wand
  Volley road, Quiet Pulse's road node). Attributes per build fell.
- **§8 Clusters and smalls.** One stat per section, every small with its notable, notables 4.0 to 4.5; re-prices bring
  Warded Mind and Quickening into 3 to 5.
- **§9 Keystones.** None moved; all dead ends.
- **§10 Vocabulary.** Lines from `lines.ts` only, unedited; new to the Mystic: `stunAvoid`, `elePenetration`,
  `eleAttack`, `resAll` on a notable, `spellCritMulti` beyond the home. Every line is one the sheet reads.
- **§11 Looks.** 0 crossings, 0 drawn over; smalls 55 to 79 from their notables; straight chains (Composure), a V with
  the bend at the notable (Keen Verse), regular four-node rings at radius 56 like their neighbours'; junctions met at
  clean angles (the Belfry junction is a cross; the west join and `toDev2.a` checked); three labels moved.
- **§12 Size.** +22 nodes, the brief's count for these clusters plus Siphon's small. The allocator is static; no bot
  simulation.
- **§13 Tensions.** Connections against trade-offs (question 2), identity against spread (wands concentrated, apart),
  bridges against dead ends (three ends closed, keystones kept).
- **§14 Rejected ideas.** No generated layout (coordinates computed by hand from the neighbours, then looked at), no
  spacing rule, no filler road, no step-count reach (steps are costs and twin distances).
- **§15 How the work is done.** CONSTRAINTS and every brief read first; pictures before and after with explicit paths;
  geometry and tsc after the batch; edits only in `spire/`; no register, bake, commit or stash.
- **§16 Open.** Border counts unchanged this round; labels (question 3).
