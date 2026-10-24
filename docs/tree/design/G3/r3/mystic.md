# G3 round 3: the Mystic (the Spire)

Done 2026-10-22 for phase G3 of [G-growth.md](../../G-growth.md), round 3 of three: the last new clusters. The starting
list was round 2's plan ([r2/mystic.md](../r2/mystic.md) §8) and the user's decisions after round 2. [CONSTRAINTS.md](../../CONSTRAINTS.md)
wins over everything here.

- Edits are only in `src/data/passives/spire/` (`rim.ts`, `fire.ts`).
- Nothing was registered, baked or committed.
- No link across a region line was added, cut or re-aimed.
- Five other region agents worked in the same tree at the same time. They started editing between my first allocator
  run and my later ones, so every allocator reading here is indicative.

**Pictures** ([mystic/](mystic/)):

- `before.png` and `after.png`: the region.
- `before-top.png` and `after-top.png`: the top of the Spire, with lines.
- `long-chant.png`, `pinpoint-bad-company.png`, `cold-light.png`: close-ups of the new clusters, with lines.

**Node count: 228 → 244** (+4 notables, +12 smalls). No road node was added or removed, and no existing node was
re-lined or moved.

---

## 1. What this round did, in short

| ledger | notable         | lead + partner                                        | where                                                                                          |
| ------ | --------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| MY-3   | **Long Chant**  | cast speed smalls; spell damage + mana regeneration   | the Eaves, a V pocket outward of r1–r2                                                         |
| MY-6   | **Pinpoint**    | wand attack; crit chance + crit multiplier with wands | a V bridge from Overcharge's east small to the Eaves' r4                                       |
| MY-7   | **Bad Company** | minion damage + curse effect                          | **moved from the brief's spot**: a ring pocket off the Eaves' r5, the corner over the Rooftops |
| (new)  | **Cold Light**  | spell crit + cold damage                              | the north-west rim road, a V pocket outward of b–c (the brief's spot for MY-7)                 |

The three brief clusters close the plan. Cold Light is new beyond the brief, added for the life caster's spell crit,
the one main stat that was flat at every point count. Bad Company and Cold Light traded places after measuring, for
the reasons in §3.

## 2. The clusters added

| ledger | notable         | lines (units)                                                                              | smalls                                                | file / ids                                  | hangs on                                                                                                    | steps (Mystic / others)  |
| ------ | --------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------ |
| MY-3   | **Long Chant**  | spellDamage(20), manaRegen(15): 2.5 + 1.5 = **4.0**                                        | 3 × castSpeed(4): 2 on r1's leg, 1 on r2's            | `rim.ts`, `spire.rim.longChant.{a,b,n,c}`   | a V pocket from `spire.rim.road.r1` to `r2`, outward, with the notable at the tip (475,−4645) under the rim | 24 / Shade 25, Zealot 28 |
| MY-6   | **Pinpoint**    | wandAttack(20), weaponCrit(wand, 20), weaponCritMulti(wand, 12): 1.67 + 1.33 + 1 = **4.0** | 3 × wandAttack(12): 2 on Overcharge's side, 1 on r4's | `rim.ts`, `spire.rim.pinpoint.{a,b,n,c}`    | a V bridge from `spire.storm.overcharge.c` to `spire.rim.road.r4`, bending at the notable (1359,−3944)      | 23 / Shade 22            |
| MY-7   | **Bad Company** | minionDamage(24), curseEffect(16): 2 + 2 = **4.0**                                         | 3 × minionDamage(12)                                  | `rim.ts`, `spire.rim.badCompany.{a,b,n,c}`  | a four-node ring pocket (radius 56) off `spire.rim.road.r5`, inward, its entrance facing the corner         | 25 / Shade 23            |
| new    | **Cold Light**  | spellCrit(30), eleDamage(cold, 16): 2 + 1.6 = **3.6**                                      | 3 × spellCrit(15): 2 on the corner's side, 1 on b's   | `fire.ts`, `spire.fire.coldLight.{a,b,n,c}` | a V pocket from `spire.fire.rim.c` to `rim.b`, outward, with the notable at the tip (−1402,−4471)           | 26 / Zealot 23           |

- **Lines.** Every line comes from `lines.ts`, which was not edited. Every small in a section carries the same line
  (§8.2), and every small belongs to its notable (§8.7). The notables are worth 3.6 to 4.0 units.
- **Names.** `npx vitest run src/data/ip.test.ts` passes. `grep -i` of `reference/tree/ref-tree.json` and
  `ref-phrases.json` finds none of Long Chant, Pinpoint, Bad Company, Cold Light or Chant. Two first choices were
  dropped: "Tireless" is in the reference tree, and "Ill Company" echoed the Shade's curse notable Ill Wish, ten steps
  away.

**Layout (CONSTRAINTS §11.5).**

- **Long Chant.**
  - The legs are straight. The bend is at the notable, which is the tip of the V.
  - The smalls sit 70 and 125 from the notable, with the rest of the length on the links out.
  - The V's legs meet the road 60° from the run on both sides. r1 was a straight-through node and is now a T. r2 was
    the 38° corner and is now a junction, so its turn is legitimate.
  - A V square to the road at both ends is impossible here: at r2 the road turns toward the pocket.
- **Pinpoint.**
  - Its r4 leg leaves the road at 135°, between r3's link (83°) and r5's (105°).
  - The straight line from Overcharge would have met r4 31° off the even fan. A V bending 38° at the notable takes
    that turn instead.
  - At Overcharge's east small the new link leaves the ring's outer side (gaps of 90°, 128° and 142°).
- **Bad Company.**
  - It is a four-node ring like the Lantern's and Belfry's.
  - Its entrance link bisects r5's free inner side, 55° from each road link. That also removes r5's old 70° bend from
    the bends list, since r5 is now a junction.
  - It is 175 units from Black Powder's notable and 156 from the r4–r5 road.
- **Cold Light.**
  - It has Long Chant's shape on the north-west road: the legs meet the road 60° from the run.
  - The corner `rim.c` becomes a four-way: Cinder, the Zealot's road, the road and the pocket, with gaps of 85°, 115°,
    99° and 61°.

**Twins and partners** (steps between notables on the network, scratch BFS):

| new         | twin (same want)                                                  |      steps | partner here / there                                                     |
| ----------- | ----------------------------------------------------------------- | ---------: | ------------------------------------------------------------------------ |
| Long Chant  | Piercing Word (spell)                                             |          9 | mana regeneration, cast speed / penetration                              |
|             | Arcane Focus, Keen Verse, Living Verse (spell)                    |         18 | cast speed / crit / life                                                 |
|             | Thunderhead (cast speed)                                          |          8 | spell damage / lightning                                                 |
|             | Deep Well (cast speed)                                            |         20 | spell damage / mana                                                      |
|             | Steady Stream (the channeller's other notable)                    |         11 | not a one-stop for the channeller (the brief's reason for the top right) |
| Pinpoint    | Wand Volley (speed), Bright Wand (elements), Deft Wand (accuracy) | 13, 14, 23 | crit / theirs                                                            |
|             | Overcharge, Snare Line (different kinds, neighbours)              |       5, 4 | (shock and traps; no wand build wants them)                              |
| Bad Company | Familiars (minions)                                               |         19 | curse effect / minion life                                               |
|             | Black Flock (minions, the Shade)                                  |         17 | curse effect / speed                                                     |
|             | Shepherd, Sexton, Ossuary (the Zealot's minions)                  |      28–34 |                                                                          |
|             | Hexwright, Ill Wish (curses)                                      |     12, 10 | minions / curse area, chaos damage over time                             |
| Cold Light  | Sharp Mind, Flashpoint, Keen Verse (spell crit)                   | 24, 16, 21 | cold / multiplier, fire, spell damage                                    |
|             | Glint (spell crit, the Shade's far rim)                           |         34 | cold / insight                                                           |
|             | Hoarfrost, Shatter (cold)                                         |      9, 14 | crit / shield, freeze and penetration                                    |
|             | High Veil (neighbour, a different kind)                           |          5 | (see open question 1)                                                    |

- Every twin is 8 or more steps apart.
- **Convergence rule.** No new cluster pairs spell damage with energy shield, or life with armour.
- **Long Chant's cast speed and Deep Well's.** Both sell cast speed, with different partners, 20 steps apart. Deep
  Well's cast speed (the user kept it) is the near one, and Long Chant's is the far one.

## 3. The far supply for the flat specializations, decided one by one

The rule I used: one more cluster is wanted only if (a) the specialization's clusters, this round's included, are all in
the 120-point plan, and (b) there is a spot where taking it costs the build another want. The readings are units at
120 → 160 points.

- **The summoner's minions (26.5 → 26.5 at the round's start).**
  - **Measured first:** I laid MY-7 at the brief's spot on the north-west rim road and ran the allocator.
    - The summoner's 120-point plan took the whole north-west: Familiars, the new cluster, High Veil's shield,
      Volatile Servants and Tomb Dust.
    - Minions grew only 27.9 → 31.5 (+13%), because the cluster sat in the same direction as every other minion
      cluster a Mystic summoner reaches (Familiars, the Zealot's Shepherd, Sexton and Ossuary) and 5 steps from its
      other main want.
  - **So it moved** to the opposite corner of the top, by the Shade's door, a few steps above the Shade's curses. The
    hexing summoner is where the summon class meets the curse class.
  - **After the move:** minions 26.5 → 30.5 (+15%). Bad Company is in the summoner's gave-up list at 120 (2.6): a want
    that more points buy, in a direction the summoner must leave the west for.
  - **No fifth minion cluster.** Bad Company is not in the 120 plan, so another one would be padding.
- **The wand attacker's wand damage (12.7 at every count).**
  - Pinpoint is the fourth wand cluster. It is in the gave-up list at 120 (3.3), so wand damage climbs 12.7 → 16.3
    (+28%) from 120 to 160.
  - **No fifth wand cluster.** The wand attacker's attack speed (17 → 17) comes from the Strider's attack-speed
    notables, not from the Mystic, so it is not this region's to fix here.
- **The classic caster's cold (9.2 → 9.2).**
  - With variant A (§3a) this was "outranked, not undersupplied": cold stayed 10.8 → 10.8, and the 160 extension
    bought spell damage and shield instead of Sleet or the Zealot's cold.
  - Cold Light then gave cold a third Mystic cluster (with crit, far north-west). It is partnered for the crit caster,
    not added for cold.
  - Cold now climbs 8.4 → 14.4 (+71%) at 120 → 160. **No cluster was added for cold alone.**
- **The life caster's spell crit (8.4 at every count, from 60 to 160).**
  - This stat was flat even at 60. All of spell crit was near home and on the east side (Sharp Mind at 4 steps,
    Flashpoint, Keen Verse), and the far one (the Shade's Glint) is 27 steps out on the Shade's rim.
  - **Cold Light is the answer:** spell crit's fourth Mystic cluster, far (26) and in the other direction (north-west).
    Its partner is cold, which the fire and lightning caster does not use, so it must weigh the cluster.
  - **This changes the ledger's "east is the crit side" decision** (G1-ledger §4.2) for one cluster. The constraints
    it serves are §1.1 (target 1: no flat main stat) and §5.1 (crit with another partner, in another direction).
  - **Result:** the life caster takes Cold Light in its 120-point plan, giving up Hedge Magic, Long Chant and Long
    Breath (2.8 to 3.5 each). Spell crit at 120 goes 8.4 → 13.4, but it is still flat to 160.
  - **No further crit cluster.** The flatness past 120 is now the whole network's small spell crit supply. A further
    cluster in reach would only move the flat line up. That is left for the audit rounds (§8).

### 3a. Measured: why Bad Company and Cold Light are where they are

These were two runs back to back on one snapshot (the other regions mid-edit), with only the two clusters' lines
swapped between the two spots. Units at 120 → 160:

| variant                                                           | summoner minions       | caster-es cold        | caster-es ES           | caster-es spell      | caster-life spell crit | dagger-caster spell crit |
| ----------------------------------------------------------------- | ---------------------- | --------------------- | ---------------------- | -------------------- | ---------------------- | ------------------------ |
| A: minions north-west (the brief), crit and cold by the Rooftops  | 27.9 → 31.5 (+13%)     | 10.8 → 12.4 (+15%)    | 40.2 → 41.4 (+3%)      | 30.5 → 44.5 (+46%)   | 8.4 → 8.4              | 5.2 → 15.2               |
| **B: minions by the Rooftops, crit and cold north-west (chosen)** | **26.5 → 30.5 (+15%)** | **8.4 → 14.4 (+71%)** | **43.4 → 52.8 (+22%)** | **32.5 → 42 (+29%)** | **13.4 → 13.4**        | 5.2 → 15.2               |

- **B is chosen** for the player's reasons first:
  - B puts the minion cluster in a direction away from the other minion clusters.
  - B puts the crit away from the other crit, and the cold in a third direction for cold.
  - B has a partner each build must weigh.
- **The numbers agree.** In A, the classic caster's shield went flat (+3%) and the life caster never took the crit.
  In B every classic caster main stat climbs 22% or more.

## 4. Deferred border links laid

**None.** In `G2/borders.md` §4 only MY-2 and MY-10 carry deferred links, and both were laid in round 2. No link across
a region line was written, cut or re-aimed this round. Bad Company's corner `r5` keeps its one border link (to
`knife.roofs.ridge.y1`). That is why Bad Company is a dead-end pocket rather than a bridge (§7, question 2).

## 5. Ids and links

- **New ids (16):**
  - `spire.rim.longChant.{a,b,n,c}`
  - `spire.rim.pinpoint.{a,b,n,c}`
  - `spire.rim.badCompany.{a,b,n,c}`
  - `spire.fire.coldLight.{a,b,n,c}`
- **Changed or removed: none.** The first placement's ids (`spire.fire.illCompany.*`, and a draft `spire.rim.coldLight.*`)
  never reached `ids.json` (nothing was registered), so they leave no holes.
- **Links added:**
  - `road.r1 – longChant.a` and `longChant.c – road.r2`, with the chain a–b–n–c.
  - `spire.storm.overcharge.c – pinpoint.a` and `pinpoint.c – road.r4`, with the chain.
  - `road.r5 – badCompany.a`, with the ring a–b–n–c–a.
  - `spire.fire.rim.c – coldLight.a` and `coldLight.c – rim.b`, with the chain.
- **Links cut: none. Re-lines: none.**
- **Reasons updated to match:**
  - `rim.ts`: the header, the road's cluster reason, and r1, r2, r4 and r5.
  - `fire.ts`: the header, the north-west rim road's reason, and `rim.b` and `rim.c`.

## 6. Changes from the brief, and why

- **MY-7 (Bad Company) left the north-west rim road** for the Eaves' Rooftops corner (§3). Its lead and partner are
  unchanged.
  - It now sits 12 steps from Hexwright. The ledger asked for 8 or more.
  - It is a dead-end ring rather than a bridge.
- **Cold Light is new beyond the brief.** It serves CONSTRAINTS §1.1 (the life caster's flat spell crit; target 1) and
  §5.1 (a fourth spell crit partner, in a fourth direction). It takes the spot the brief gave MY-7.
- **MY-3 (Long Chant) is a V** with its tip at (475,−4645), about 190 units from the brief's (660,−4570), so that its
  legs meet the road at 60° rather than 32°.
- **MY-6 (Pinpoint) is a V** with its notable at (1359,−3944), 100 units from the brief's (1330,−4040), so that it
  meets r4 near the even fan.

## 7. Checks

- **Geometry** (`geometry.ts --region mystic --bends`): **crossings 0, drawn over 0**.
  - There are 14 bends over 20°, against 15 at the end of round 2.
  - New: Bad Company's ring corners `b` and `c` (90°, as the other four-node rings' corners).
  - Gone: `r2` (38°) and `r5` (70°), both junctions now.
  - No new bend at a two-link road node or chain small.
- **Audit** (`passives:audit -- mystic`): 0 problems.
  - 244 nodes: 131 smalls, 49 notables, 58 road, 5 keystones.
  - Notables run from 3.0 to 5.0 units, **none outside**. The new ones are Cold Light 3.6, and Long Chant, Pinpoint
    and Bad Company 4.0.
- **Ways in (§3.5):**
  - Long Chant 2 (r1, r2).
  - Pinpoint 2 (Overcharge, r4).
  - Cold Light 2 (the north-west road's c and b).
  - **Bad Company 1**, a single pocket on purpose: a far tip (§13.5) at a corner whose other side is the border.
  - The Eaves now has 4 ways from inside the Mystic: Harsh Weather's road node, Snare Line, Pinpoint and Long Chant's
    two ends. It has a fifth from the Rooftops.
  - The north-west rim road keeps 3: Cinder, the Zealot, and High Veil's tip.
  - Every area keeps two or more links in and out (the audit's lists).
- `npx tsc --noEmit -p .`: clean.
- `buildAll` problems with a `spire.` id: 0.

### The allocator

`passives:builds -- --only …` was run before my first edit, and again after the last.

- **Before:** the six Mystic-related archetypes, on a tree that only round 2 had touched.
- **After:** nine archetypes, adding storm-caster, trap-mine and curser. By then the other regions' round-3 clusters
  (Plainsong, Vespers, Salt in the Wound and others) were already in the tree and in the plans, so the after readings
  are indicative.
- Main stats are in units at 120 → 140 → 160 points. The G0 column is the baseline before any growth
  ([G0/builds.txt](../../G0/builds.txt), 120 → 160).

| archetype     | main stat           | G0 (120 → 160)     | before (round 3's start) | after                         |
| ------------- | ------------------- | ------------------ | ------------------------ | ----------------------------- |
| caster-es     | spell damage        | 21 → 23 (+10%)     | 33.5 42 42 (+25%)        | 32.5 38 42 (+29%)             |
|               | cold                | 9.2 → 17.8 (+93%)  | 9.2 flat (0%)            | **8.4 11.2 14.4 (+71%)**      |
|               | energy shield       | 32.4 → 40.6 (+25%) | 40.2 40.2 52.8 (+31%)    | 43.4 48.4 52.8 (+22%)         |
|               | cast speed          | 12.3 → 14.3 (+16%) | 11.3 14.8 14.8 (+31%)    | 7.8 12.8 13.8 (+77%)          |
| caster-life   | spell damage        | 19.8 → 21.8 (+10%) | 31.3 39.8 41.8 (+34%)    | 36.3 38.8 40.8 (+12%)         |
|               | elemental           | 17.2 → 24.2 (+41%) | 19.8 23.2 23.2 (+17%)    | 21.6 23.2 23.2 (+7%)          |
|               | life                | 35.4 → 39.4 (+11%) | 32.2 34.8 42.8 (+33%)    | 23.4 24.4 32.4 (+38%)         |
|               | spell crit          | 6.9 flat           | 8.4 flat                 | **13.4 flat** (8.4 at 60–100) |
| summoner      | minions             | 21.5 flat          | 26.5 flat (0%)           | **26.5 26.5 30.5 (+15%)**     |
|               | energy shield       | 38.8 → 40.4 (+4%)  | 50.8 55.2 59.6 (+17%)    | 50.8 55.2 59.6 (+17%)         |
|               | life                | 20.4 → 34 (+67%)   | 14.4 21 31.8             | 14.4 21 26.4                  |
| wand-attack   | wand damage         | 7.7 flat           | 12.7 flat (0%)           | **12.7 12.7 16.3 (+28%)**     |
|               | energy shield       | 26 flat            | 45.6 45.6 52 (+14%)      | 35.8 43.4 50 (+40%)           |
|               | attack speed        | 19.2 → 20.8 (+8%)  | 16 17 17                 | 17 flat (the Strider's)       |
| dagger-caster | spell damage        | 23.3 flat          | 46.5 48.5 49.8           | 46.5 52.5 52.5                |
|               | spell crit          | 8.9 flat           | 5.2 10.2 15.4            | 5.2 10.2 15.2                 |
| channeller    | channelling + spell | 16.8 → 18.8 (+12%) | 33.3 33.3 40.8 (+23%)    | 38.3 42.8 42.8 (+12%)         |
|               | mana sustain        | 35.8 → 42.8 (+20%) | 26.8 30.8 30.8 (+15%)    | 22.8 31.8 33.3 (+46%)         |
|               | energy shield       | 30.6 → 34.2 (+12%) | 31 40.4 40.4 (+30%)      | 32.2 34.2 47 (+46%)           |

- **The six together:**
  - The typical main stat now gains about 25% from 120 to 160 points (19% at round 3's start; in G0 about 11%, with 10 of 20 gaining 10% or less).
  - Against G0: the wand attacker's wand damage (7.7 flat → 12.7 → 16.3), the summoner's minions (21.5 flat → 26.5
    → 30.5) and the classic caster's spell damage (21 → 23, then 32.5 → 42) now climb. The life caster's spell crit
    is flat at every count in G0 and still flat past 120, at about twice the amount (6.9 → 13.4).
  - Main stats gaining 10% or less: 3 of 20 (it was 6 of 20). The three are the life caster's elemental damage and
    spell crit, and the wand attacker's attack speed.
- **The nine (the tool's summary):**
  - Typical gain: 24%.
  - Gaining 10% or less: 17%.
  - Choice: three or more plans at 120 for eight of nine.
  - Gave-up notables worth 2.5+: typically 3.
  - Tax: typically 36%. The classic caster's rose 33 → 36% (its 120-point plan now walks to the north-west tip; see
    question 1). The summoner stays at 42%, and the wand attacker's fell 42 → 36%.
- **Gave-up lists now name this round's clusters as wants that more points buy:**
  - Bad Company (summoner).
  - Pinpoint (wand attacker).
  - Long Chant (classic caster, life caster).
  - Cold Light (dagger caster).
- **Strength by the back door (G-growth §4):**
  - The life caster's spell crit at 120 rose 8.4 → 13.4. That is Cold Light, 26 steps out, bought by giving up three
    wanted notables, so it is a trade.
  - The classic caster's shield at 120 rose 40.2 → 43.4. It now walks to the north-west tip for Cold Light and High
    Veil together (question 1).
  - The channeller's spell damage at 120 rose 33.3 → 38.3 (Long Chant).
  - No main stat at 120 jumped without a gave-up list to match.
- **What got worse, said plainly:**
  - The life caster's spell damage (+34% → +12%) and its elemental damage (+17% → +7%) flattened. Its 120-point plan
    now holds more spell damage (31.3 → 36.3), partly from the Zealot's new Plainsong and Vespers (another region's
    round 3), and its 160 extension buys life.
  - The channeller's spell damage growth fell (+23% → +12%) while its sustain and shield rose.

## 8. Walks (by hand on the map; numbers are points spent in the walk's order)

Round 3 changed nothing within 20 points of any start. The nearest new notable is Pinpoint, 22 from the Shade start
and 23 from the Mystic's. So the short walks below show the home as it stands, with this round's clusters as what the
next points buy.

**1. The classic caster, 20 points (main build).**

- **Route:** start → the shield side (1) → **First Light** (2) → the west hub and road (3–6) → the wheel's mana small
  (7) → **Glass Skin** (8) → mana small (9) → **Deep Well** (10, mana and cast speed) → Spirit Ward's two smalls (11–12)
  → the column junction (13) → Broad Weave's small (14) → Composure's shield small (15) → **Composure** (16) → the
  resist star's fire spoke (17) → **Prism Ward** (18). Two points are left.
- _Chose:_ shield (Glass Skin, Composure), speed (Deep Well), resistances.
- _Gave up:_ Arcane Focus (the east), Warm Blood, Still Mind.
- _No-choice stretch:_ the west road's three nodes, and Spirit Ward's two shield-defence smalls on the climb, which are
  tax without a shield.
- _Nobody takes:_ Spirit Ward, for a caster without a shield.
- _Unchanged from round 2._ The far shield (High Veil, 27) and the far crit (Cold Light, 26) are a whole run's walk
  away.

**2. The summoner, 20 points (off-build).**

- **Route:** start → the shield side (1) → the west hub (2) → the west road (3–4) → Warm Blood's life small (5) →
  **Warm Blood** (6) → the road (7) → mana small (8) → **Glass Skin** (9) → the wheel's two shield smalls (10–11) → the
  Cloister junction (12) → Draught's two flask smalls (13–14) → **Draught** (15) → the Zealot's crossing node (16) →
  **Shepherd** (17, the Zealot's minion life and speed). Three points are left, for Shepherd's ring or Choirmaster.
- _Chose:_ life and shield at home, then the shortest way to minions, which is the Zealot's.
- _Gave up:_ First Light, Deep Well, Composure.
- _No-choice stretch:_ Draught's flask smalls, the toll to the Zealot, which a summoner barely wants.
- _The point of this round:_ the Spire's two minion clusters now lie in opposite directions:
  - Familiars (18), north-west, toward the Zealot's minions.
  - Bad Company (25), in the north-east corner by the Shade.
  - A summoner that wants both pays for the whole top between them.

**3. An intelligence-and-dexterity Shade coming in, 20 points (neighbour).**

- **Route:** Shade start → the shield side (1) → the hub (2) → the north road (3–4) → a claw small (5) → Thick Blood's
  small (6) → **Thick Blood** (7, life) → the Stair's roads and hex wheel (8–13) → the crossing road
  (`knife.hex.toSpire`, 14–15) → Black Powder's two mine smalls (16–17) → **Black Powder** (18) → the ridge (19) → the
  Eaves' corner r5 (20).
- **The next three points are a fork:**
  - **Bad Company** (21–23): minions with curses, for a hexing summoner.
  - The Eaves up to **Pinpoint** (22–23): the crit wand, for an int-dex wand attacker.
- _Chose:_ life, then mines, then a Mystic cluster.
- _Gave up:_ the Shade's own curse notables (Ill Wish, 10 steps from Bad Company; Hexwright, 12), and Black Flock, the
  Shade's minions (12 from its start, the other way).
- _No-choice stretch:_ the Stair's six hybrid road nodes.
- _Nobody takes:_ Black Powder for a summoner. It is a toll on this road.
- _A Zealot comes in the same way on the west:_ Choirmaster (8), Glass Wall (14), Tomb Dust (18), the far loop (19–21),
  **Cold Light** (23).

**4. The summoner, 120 points.** This is the allocator's best plan, read on the map.

- **The plan:**
  - Home: Warm Blood. It does not take First Light.
  - The west wheel and the Cloister: Glass Skin, Quiet Pulse, Composure, Quickening.
  - The east wheel's Warded Mind and Flashes of Insight.
  - The Zealot's choir and nave: Shepherd, Choirmaster, Vigil, Litany, Consecrated Plate, Benediction, Sexton, and
    Ossuary far west.
  - The north-west: Familiars, Glass Wall, Tomb Dust, Volatile Servants, **High Veil**.
  - The Shade side: Thick Blood, Devotion, Shroud, Hoarded Breath, Grey Cloak, and Black Flock far south-east.
  - Rood Screen.
- _Chose:_ every minion cluster west and its keystone, with shield west and in the Shade.
- _Gave up (what 40 more points add):_
  - **Bad Company** (2.6). The north-east minion cluster costs the walk across the top.
  - Shifting Ward (2.4), Wiry Frame, Snakeskin.
- _Stretch with no choice:_ the Zealot crossing's flask smalls and the choir's roads.
- _Notables nobody of the nine takes, in the Mystic:_
  - Spirit Ward, Draught, Mind Bulwark, Mana Bastion and Snare Line. The trapper prefers the Shade's Tripwire
    and Trapper.
  - Lingering is only on the curser's gave-up list.

## 9. What is left after G3 (for the audit rounds)

- **The life caster's spell crit** is flat past 120 (13.4). The network's whole spell crit supply is five clusters
  (Sharp Mind, Flashpoint, Keen Verse, Cold Light, Glint), and the life caster takes four by 120.
- **The life caster's spell and elemental damage** flattened this round, partly from other regions' new clusters in its
  plan. Re-measure on the finished tree.
- **The wand attacker's attack speed** (17 flat) comes from the Strider's attack-speed clusters. An audit of attack
  speed for the int attackers belongs to the whole tree.
- **The north-west tip** (Cold Light and High Veil, 5 steps apart, 26–27 out) is now a classic caster destination at
  120 (question 1).
- **Bad Company** is the region's second single-entry pocket at the top, after High Veil (question 2).
- **Labels** are ignored by the user's instruction. Long Chant's notable lies under Fever Pitch's keystone text in the
  `--text` render only, and the Eaves' name is unchecked.

### 9a. Round 2's open questions, settled

- **Deep Well's re-line** (question 1 of round 2): the user's decision, kept. Closed.
- **Hale Scribe keeps its four life smalls** (question 2). The back door has closed: the life caster's life at 120 is
  23.4 units now (32.2 at round 2's end) and climbs 38% to 160. Hale Scribe sits in its 60-point plan as before, as a
  trade for spell damage, not a gain everywhere.
- **The Undercroft bridge** (question 3), a reading only, no change. The classic caster's 60-point plan still takes
  Living Verse, Homily and Glass Wall over it, and so does the channeller's. Both still climb in spell damage and shield
  past 120, so the bridge is a cross-region trade, not a finish line.
- **High Veil stays the north-west road's far tip** (question 4). Cold Light's pocket bridges the road's b and c, not the
  tip, and a second way into High Veil would be the climb again (round 2's hot spot) or a crossing. It keeps one way
  in, on purpose (§13.5).

## 10. Open questions

1. **Cold Light beside High Veil.** The classic caster's 120-point plan now walks to the north-west tip and takes both
   (cold crit and shield, 5 steps apart). All four of its main stats still climb 22% or more to 160, but its tax rose to
   36%. That is not the convergence rule's pair (spell damage with shield), but it is close to "neighbours compete":
   - Keep them, as different kinds 5 apart, 26 out and "rare and far".
   - Or move Cold Light one road node toward the Zealot (it cannot without a border link), or onto the Eaves (no free
     spot left there).
2. **Bad Company as a dead end.** Its corner (`r5`) has one border link and no second way in that is not a crossing.
   Should it become a bridge when the user revisits the extra crossings per border (a link from its ring to the Shade's
   ridge road would be the Mystic–Shade border's eighth)?
3. **The ledger's "east is the crit side"** gives way for one cluster (Cold Light, north-west). Agreed?

Nothing here felt like it was losing intent. The one moment it could have was MY-7 at the brief's spot: on the map and
in the measure it made the north-west a summoner's one-stop, which is what this growth exists to undo, so it moved.

## 11. CONSTRAINTS checklist

- **§1 What the tree is for.**
  - Each new cluster is a want that more points buy for the build it serves (the gave-up lists, §7). Wands and
    minions stopped being flat, and the classic caster's cold climbs.
  - It was not at the others' expense: no road was added, the starts were untouched, and nothing within 20 points of a
    start changed. The regressions are said in §7.
- **§2 The reference.**
  - It was not consulted beyond the briefs' facts.
  - Names are plain and checked by the ip test and grep. The reference game is not named.
- **§3 A network.**
  - Three new bridges and one single pocket (Bad Company, a far tip, question 2).
  - r2, r5 and `rim.c` became junctions.
  - No deferred link this round, and no border link touched.
- **§4 Regions and areas.**
  - No new area. The Eaves now carries offence (Long Chant, Pinpoint), a summoner's cluster and traps.
  - The north-west road carries shield, resistances and crit.
  - §4.8 is unaffected: everything is 22 or more steps from any start.
- **§5 Specializations.**
  - Twins are 8 or more steps apart with different partners (§2).
  - Spell crit now has four Mystic partners in two directions.
  - Cold now has three Mystic clusters (shield, freeze, crit).
  - Wands have four directions and four partners.
  - Minions have two Mystic directions.
  - Wands sit in the int region (§5.4).
- **§6 Starts.** Untouched. The nearest new notable is 22 steps from a start.
- **§7 Roads and attributes.** No road node was added. Every Eaves node now has a branch.
- **§8 Clusters and smalls.**
  - One line per section, and every small has its notable.
  - Notables are 3.6 to 4.0 units.
  - The V legs each carry the cluster's one small line.
- **§9 Keystones.** None touched. Fever Pitch and Pain Conduit are still dead ends, and no new link lands on a spur.
- **§10 Vocabulary.**
  - Lines come only from `lines.ts`.
  - New to the Mystic: `weaponCritMulti` (wand), `weaponCrit` (wand) on a new notable, `curseEffect` on a minion
    notable, `spellCrit` smalls away from home, `manaRegen` with spell damage.
- **§11 Looks.**
  - 0 crossings, 0 drawn over.
  - Straight legs that bend only at notables (the V tips) or ring corners.
  - Junction angles are checked (§2).
  - Labels are ignored.
- **§12 Size.** +16 nodes: the brief's three clusters plus one more for a named constraint.
- **§13 Tensions.**
  - Bridges against dead ends: Bad Company is a tip.
  - Identity against spread: crit leaves the east once.
  - Connections against trade-offs: no new crossing, and two far corners each worth a walk.
- **§14 Rejected ideas.**
  - No generated layout: positions were computed by hand from the neighbours, then looked at.
  - No filler road and no step-count reach.
  - The allocator compared two placements that each had a player's reason. It did not place a node.
- **§15 How the work is done.**
  - CONSTRAINTS and the briefs were read first.
  - Pictures were taken before and after, with explicit paths.
  - Geometry and tsc were run after each batch.
  - Edits were only in `spire/`, with no register, bake, commit or stash.
  - Walks are in §8.
- **§16 Open.**
  - Border counts are unchanged.
  - Bad Company's possible crossing (question 2) is for the post-G3 border revisit.
