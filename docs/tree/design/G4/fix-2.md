# G4 fix brief, round 2 (the last before stop 4)

Written 2026-10-23 from the six reports of G4 audit round 2, the final audit (`audit/growth-2/`), for the region agents
who carry out the fixes and for the coordinator. [CONSTRAINTS.md](../CONSTRAINTS.md) wins over everything here; read it
in full before any edit. No new rules: the user adopted none of round 1's proposals (CONSTRAINTS §14), so every item
below stands on a finding against the rules as they are.

**How to read an item.** Each names the finding it answers (N network, T trade-offs, D discipline, S starts, L looks,
B builds, with the report's number), the nodes, the change, and what it must not break. Read the cited passage of the
report before doing the item: it has the evidence, the trials and the exclusions.

## 0. Done before this pass (the coordinator, c0771d1)

- **The yardstick's gaps** (N1, N5, B3, B4; fix-1 §3 item 6): four archetypes added, `spellblade`, `curse-attacker`,
  `sword-board` and `storm-blade` (32 now); every archetype counts movement, flasks and mana a little; the Reaver
  builds weigh crit; two-hand-fire weighs the melee lines. Re-measured as `G4/builds-r2start.txt` (the baseline for
  this pass). What that settled:
  - **Clean Break** (seam 1) is in sword-str's and dual-wield's plans at 120: N5 closed.
  - **Spellsword, Marked Prey, Round Shield and Fencer's Eye** are each in a plan; **Stormstruck and Live Wire** are both
    in storm-blade's plan at 120. The south band (N1) was mostly the yardstick: no move or re-line there.
  - **Still in no plan:** Ceaseless Blades (no channelled-attack archetype; left), Battle Hymn and Procession (the west
    corner, N4 below).
- **Lines** (D1, D2, T3): `staffSpellDamage` and `staffSpellBlock` exist in `lines.ts` (the `wieldingStaff` condition,
  like the dagger's); `UNIT.resOne` is 10; the chaos smalls of Sound Body's hand and Warded Mind's wheel are
  `resOne('chaos', 10)` and those two notables 20%; the Prismatic Balance and Fever Pitch spur smalls are
  `eleDamageAll(10)` (D3). `passives:audit` lists no notable outside 3 to 5 units.

## 1. Conflicts between auditors, resolved

1. **The dexterity middle (T1, S3, S4, B1).** Take T1's Wayfarer change (the Ford smalls become road) and S4's Footwork
   partner (accuracy with stun avoidance), not T1's accuracy with movement: the starts auditor trialled movement and
   Footwork fell out of every plan. Do not also re-line Wayfarer's own smalls to resistances (B1 step 2): it drops
   claw-poison's choice at 60 to one plan. U4's condition ("if it is still every dexterity build's first stop,
   re-partner it then") is met: Footwork is in 7 of 8 dexterity plans at 60.
2. **The Zealot casters' door into the Mystic (S1, T2, B2, L2, T6).** First the starts auditor's move, trialled by two
   auditors: the crossing leaves Hymn's small for the Zealot's east road (`roadE.b`). With it, the looks auditor's cut of
   the Wandwork knot. T2's re-lay of Draught as a bridge is the second step, only if the re-measure still shows the
   casters' first 60 points in the Cloister. Never link the crossing to `roadE.a` (T6).
3. **Sidestep and Footwork** both wanted stun avoidance (T5, S4). Footwork takes it; Sidestep takes another partner.
4. **The west corner (N4).** With the full yardstick it is still in no plan: cut Procession–Grim Oath (option 1).
   Zealot–Vanguard goes from 8 links to 7; Battle Hymn stays the corner's crossing.

## 2. The work list by region

### 2.0 For every region agent

- Read CONSTRAINTS.md in full, G-growth §3, this brief, and the report passages your items cite. Area labels are ignored.
- Work only in your region's folder; never `index.ts`, `ids.json`, `baked.ts`, `edits.json`, `lines.ts`, `build.ts`,
  another region's folder, CONSTRAINTS or the plan docs. No register, bake, commit or git stash. No new ids are needed
  this round (removals leave retired holes).
- Every re-lined node gets a `why` that says what it is now. Keep every file compiling after each edit.
- Checks: `npx tsx scripts/passives/geometry.ts --region <r> --bends` (0 crossings, 0 drawn over), `npm run
passives:audit -- <r>` (0 problems, notables 3 to 5 units), `npm run passives:builds -- --only <ids>` for the builds
  your items name (indicative while others edit), pictures before and after in `docs/tree/design/G4/fix2/<region>/`.

### 2.1 Strider (`bow`)

| #   | finding | change                                                                                                                                                                                                                                                                                                             | must not break                                                     |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| S-1 | T1.2    | Wayfarer's Ford smalls `bow.steel.wayfarer.c`, `.d` (the border road to `yard.dual.j2.a`) become attribute road nodes `dex(7)`. Wayfarer keeps `a`, `b` as `evasion(10)`.                                                                                                                                          | §8.2 (Wayfarer's section stays uniform), §3.7 (the crossing stays) |
| S-2 | L3      | Cut `bow.steel.hub.t`–`bow.steel.wayfarer.d`, the home's 622-unit link. Wayfarer keeps two ways in, `hub.t` four.                                                                                                                                                                                                  | §3.5                                                               |
| S-3 | S3.1    | Hawk's Eye (`bow.home.sig.n`): drop `evasion(10)` (about 4.7 to 3.7 units). It stays the bow attacker's first notable.                                                                                                                                                                                             | §4.5 (the start's evasion side `sig.b` keeps evasion), §8.6        |
| S-4 | L1      | Hard Target's own small `bow.string.hardTarget.a` is drawn beside Fleet Foot: move it to about (2065, 1157) on the line from Hard Target toward `speed.b`, keep its link to `speed.b`, and re-aim its link to `bow.flight.hub.p` so that link leaves from `speed.b`. Check the step counts the looks report gives. | §11.5, §3.5                                                        |
| S-5 | S3.2    | **Conditional.** Cut `bow.home.hubs.n`–`bow.bows.hedgeMagic.a` (one pocket per hub; Hedge Magic stays a bridge between `toKnife.a` and the Shade's `toHedge.r1`). Re-measure bow-crit and bow-elemental after this cut **alone**: if either's choice at 60 falls, undo it and say so.                              | §3.5, §11.5 (re-lay Hedge Magic's smalls straight if needed)       |

### 2.2 Shade (`knife`)

| #   | finding | change                                                                                                                                                                                                                                                                                                                    | must not break                                        |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| K-1 | S2, B6  | Thick Blood (`knife.edge.thickBlood.n`, in 17 of 32 plans at 120): drop `lifeFlat(20)`. Optionally swap `es(5)` for a line the Shade's own builds weigh and passing casters do not: not evasion (Wiry Frame), not energy shield (Hoarded Breath, Shroud), not dodge (Soft Step, Quick Wrists, Nimble Gambit).             | §4.5 (the Shade keeps a life notable near home), §8.6 |
| K-2 | T4      | Wasp Sting (`knife.snares.mercy.n`): keep `critMulti(25)`, replace `poisonDamage(16)` with crit chance with daggers and claws (`weaponCrit` for each, about 15). Its smalls are already crit multiplier. Check Fine Point (dagger damage lead) and Raking Hand stay different. A new name is the agent's, checked (§2.4). | §5.1, §5.5, §8.6                                      |

### 2.3 Mystic (`spire`)

| #   | finding          | change                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | must not break                                                                              |
| --- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| M-1 | S1, T2, B2       | Move the Zealot crossing: the link written in `spire/well.ts` from `toCathedral.b` to `cathedral.home.hymn.b` goes to `cathedral.home.roadE.b` instead. `toCathedral.b` keeps two links and lies straight between them (move it a little toward `roadE.b` if needed). The Mystic–Zealot border keeps its count. Then measure the Zealot casters (`fire-burn, storm-caster, staff-block, block-caster, spell-totem, aura-brand`): how many of their first 60 nodes are Mystic. | §3.7, §3.5 (Hymn keeps two ways in: `hymn.a` and `roadE.a`), §11.5; never to `roadE.a` (T6) |
| M-2 | L2               | The Wandwork knot: cut `spire.well.draught.a`–`spire.well.toCathedral.a`. Wandwork keeps `j1.a`, `draught.a` and `toCathedral.a`.                                                                                                                                                                                                                                                                                                                                             | §3.5, §11.5                                                                                 |
| M-3 | T2 (second step) | **Only if M-1's measure still shows four or more Zealot casters with more Mystic than Zealot nodes at 60:** re-lay Draught's pocket as a bridge on the crossing road, as T2 proposes (`toCathedral.a` → `draught.b` → Draught → `draught.a` → `j1.a`). Say which way it went.                                                                                                                                                                                                 | as T2 lists                                                                                 |
| M-4 | N3               | Link Steady Stream (`spire.frost.stream.n`) to `spire.frost.highVeil.a` (328 units, checked clean): the High Veil cul-de-sac becomes a loop.                                                                                                                                                                                                                                                                                                                                  | §11.5 (the High Veil triangle keeps its shape)                                              |
| M-5 | D8               | Reasons: Familiars' cluster `why` (its notable is minion damage, minion life and spell damage) and Cinder's (now the Mystic end of seam 2, Bright Omen).                                                                                                                                                                                                                                                                                                                      |                                                                                             |

### 2.4 Zealot (`cathedral`)

| #   | finding | change                                                                                                                                                                                                                                       | must not break                                                                |
| --- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Z-1 | T3      | Warding Staff (`cathedral.rods.warding`): its notable's `spellBlock(4)` and its three smalls' `spellBlock(2)` become `staffSpellBlock`, so the staff side of seam 5 is a staff's and the shield builds stop taking it with Twofold Guard.    | §8.3, §5.5; staff-block's block supply (measure staff-block and block-caster) |
| Z-2 | D1      | Crozier (`cathedral.ambulatory.crozier`): notable `staffSpellDamage(20), castSpeed(6)`, smalls `a`, `b` `staffSpellDamage(8)`; rewrite the cluster `why`. Quarterstaff and Warding Staff stay the staff attacker's.                          | §5.1, §4.6, §8.6                                                              |
| Z-3 | N4      | Cut Procession–Grim Oath: the link `cathedral.rim.procession.c` → `wall.maces.oath.n` written in `cathedral/rim.ts`. Procession becomes Censer's far tip; Grim Oath keeps `oath.a` and `rim.a`. Say the border count in the report (8 to 7). | §3.5 (each keeps a way in)                                                    |

### 2.5 Reaver (`yard`)

| #   | finding | change                                                                                                                                                                                                 | must not break                                                                     |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| R-1 | T1, S4  | Footwork (`yard.dual.footwork.n`): `accuracy(20), stunAvoid(20)` (2 + 1 units), its smalls stay accuracy. Not movement (trialled: nobody takes it).                                                    | §5.5 (Twin Fangs, Sidestep, Weaving, Crossed Blades keep different partners), §4.5 |
| R-2 | T5      | Sidestep (`yard.dual.sidestep.n`): keep dodge, replace `dualBlock(4)` with a partner that is none of stun avoidance (Footwork), accuracy, evasion, dual-wield damage, speed or crit; keep it 3+ units. | §5.1 (no copy of Feint and Cut's dual wield with dodge), §5.5                      |
| R-3 | N2      | The Pits lattice: remove `yard.blood.rim.p1` and `rim.p3` and their links (ids retired). `rim.p2` stays between `toHarvest.a` and `spine.s1`, a straight run.                                          | §3.5 (Open Veins and Red Harvest keep their entrances), §11.5                      |

### 2.6 Vanguard and centre

No agent. The coordinator rewrites the two stale Vanguard reasons (D8: Graven Posts names seam 5; Steady Hands says
3.6 units).

## 3. Not done this pass, with reasons

- **Considers left as they are:** T6 (Hymn, after M-1), T7, T9 to T12, L4 to L9, N6, N8 to N10, S5 to S8, D5 to D7, D9,
  B6's Living Verse and Composure (generic wants on many notables, §5.3). Ceaseless Blades has no build in the yardstick.
- **G5 (pricing and the ship pass):** attribute supply against gear (N7), keystone distances including Steady Draw (S6).
- **For the user at stop 4:**
  - **The wand attacker (B5)** finishes its wand by 120 and buys attack speed and roads after (tax 43%). Like U2 (a
    weapon finished by 120 and paid for with life), this reads as an accepted trade; a fifth wand cluster would be supply
    for a number (§14). Shown at stop 4, not changed.
  - **Strength builds' life (B7):** they now hold the least life of any archetype (100 to 141% at 120, against the
    Zealot casters' 162 to 189%), the trade the user's sword example asked for. Shown with the per-stat tables.

## 4. After the agents (the coordinator)

Register nothing new; bake; whole-tree checks (0 crossings, 0 problems, vitest, build); the full measure against
`G4/builds-r2start.txt` and `G0/builds-base2.txt`; then stop 4: before-and-after pictures of the whole network and each
region, every archetype's numbers against the pre-growth tree, and the gave-up lists.
