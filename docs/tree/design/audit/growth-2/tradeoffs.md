# G4 audit round 2: specializations and trade-offs

Auditor: specializations and trade-offs (CONSTRAINTS §1.1, §5, §8.3, §13). Read-only: nothing in `src/`, `scripts/` or
the plan docs changed. Measured 2026-10-22/23 on the live network: the tree of ed95ecf (fix pass 1, baked), unchanged
since then in `src/data/passives` and `scripts/passives`. 1,398 live nodes. Tools: `npm run passives:supply`,
`npm run passives:builds` (28 archetypes; identical to `G4/builds-fix1.txt`) and scratch scripts outside the repository
(steps from every start and between every pair of notables, notables in each plan, wheel sides taken, plan nodes by
region and area). Steps are nodes bought. "In N plans" means N archetypes' best plans at that budget.

Pictures (`audit/growth-2/tradeoffs/`):

- `dex-middle.png`: the ground between the Shade, Strider and Reaver starts (finding T1).
- `plans/dagger-crit.png`, `plans/dual-wield.png`: a Shade and a Reaver attacker's plans (yellow 60, orange 120, red 40
  more). Both spend their first 60 points around the Strider start.
- `zealot-mystic-door.png`, `plans/storm-caster.png`, `plans/fire-burn.png`: the Zealot casters' road into the Cloister (T2).
- `seam5-shield.png`: Warding Staff, Twofold Guard and Graven Posts (T3).
- `poison-border.png`: Wasp Sting and Venom Fletching (T4).

**Counts:** 2 must fix, 3 should fix, 7 consider.

---

## 1. Findings, most important first

### T1. The dexterity middle is still one destination for seven builds from three starts. **Must fix.**

**Where:** the Strider home and the two porches beside it, the Reaver's Lists and the Shade's Knife Gate
(`dex-middle.png`).

**The evidence:**

- At 60 points, all seven dexterity attackers (bow-crit, bow-elemental, bow-poison from the Strider; dual-wield from
  the Reaver; dagger-crit, claw-poison, dodge-blades from the Shade) take the same six notables: Hawk's Eye
  (`bow.home.sig.n`), Wayfarer (`bow.steel.wayfarer.n`), Hard Target (`bow.string.hardTarget.n`), Footwork
  (`yard.dual.footwork.n`), Fleet Foot (`bow.string.speed.ff`) and Long Breath (`bow.home.life.n`). Six of them also
  take Quick Hands, five take Weaving.
- The non-Strider attackers still spend half or more of their first 60 points in the Strider: dagger-crit 28 Strider
  nodes against 23 Shade, claw-poison 30 against 24, dodge-blades 31 against 27; the Reaver's dual-wield 32 Strider
  against 28 Reaver (`plans/dual-wield.png`). Round 1 measured 28/25, 31/24, 26/29: almost unchanged.
- Evasion is close to finished for them at 120: 40 more points add +10% (dagger-crit, dodge-blades), +9% (trap-mine),
  +14% (bow-crit). It is the stat the region pours out, not one they choose.
- Density: 20 notables within 7 steps of the Strider start (12 its own, 4 the Reaver's Lists, 1 the Shade's, 3 the
  centre's), against 10 to 13 for every other start. The Lists sit nearer the Strider than their own start: Footwork 7
  from the Strider and 12 from the Reaver, Sidestep 7 and 9, Twin Fangs 6 and 7, through the two road nodes
  `bow.steel.road.jt1`–`yard.dual.j2.a` off the Strider's south hub.
- **U4's condition is met.** The fix brief left Footwork for this round: "if it is still every dexterity build's first
  stop, re-partner it then". It is in all seven attackers' 60-point plans (and trap-mine's at 120).

**What round 1 changed and why it was not enough:** Wanderer, Weaving and Fleet Foot were re-partnered, so the near
evasion notables no longer repeat one pairing (Hard Target is now the only evasion-with-life near the start). But the
builds take them anyway, because each of them carries a stat every dexterity attacker weighs (evasion, life, attack
speed, movement). The pairings are different; the destination is the same.

**The player's view:** a Shade who wants to stab, a Reaver who wants two blades and a Strider archer all open the
same way: walk to the Strider start's surroundings and buy its six generic notables. The first map's points do not
say which of the three classes you picked.

**Rules broken:** §5.3 and §13.2 (generic stats never as one destination), §1.1 (no decision in the first 60 points),
§6.2 for the Shade and Reaver attackers (the start commits them to the neighbour's home); §12.1's "high-value nodes
packed too densely" is the cause.

**Proposed fix (take supply out, add none):**

1. **Footwork** (`yard.dual.footwork.n`, the U4 decision): drop the evasion. `accuracy(20), moveSpeed(6)` (2 + 1.5
   units; the duellist's footwork), smalls stay `accuracy(10)`. The dual wielder and the sword builds that weigh accuracy
   still want it; the archers and the Shade's attackers no longer need to. Must not break §4.5: the Reaver keeps
   evasion in Weaving, Guarded and Buckler.
2. **Wayfarer's Ford smalls** (`bow.steel.wayfarer.c`, `.d`): they are the border road to `yard.dual.j2.a`, so make
   them what a road is, attribute nodes `dex(7)` (§7.1, §7.2). Wayfarer keeps its own two smalls (`a`, `b`), so its
   section stays uniform (§8.2), and the largest evasion bundle at any start (six units at step 5) becomes four.
3. **The Shade–Strider near bridges stay** (`knife.home.toHedge.r1`–`bow.bows.hedgeMagic.a`, `bow.bows.toKnife.a`–
   `knife.home.softStep.b`): the two starts are 1,000 units apart and the centre ring joins their hubs anyway, so
   cutting the hedge link adds about one step and costs a §3.7 crossing.
4. **The Strider–Reaver link `bow.steel.road.jt1`–`yard.dual.j2.a` is a real lever, held in reserve.** Measured on a
   copy of the graph with that one link removed: Footwork 7 → 10 from the Strider start, Twin Fangs 6 → 10, Weaving and
   Sidestep 7 → 11, Crossed Blades 11 → 15 (from the Reaver start, unchanged). The Lists stay reachable through
   Wayfarer's chain and `bow.steel.hub.t`. Do 1 and 2 first; if dual-wield still opens in the Strider (32 of 60 nodes
   today), re-aim this link one node farther out rather than cut it (Reaver–Strider stays at 8 links, §3.7).
5. Re-measure after 1 and 2: the Shade attackers' share of Shade nodes at 60, and evasion's gain past 120. Not a new
   cluster near any start.

**Must not break:** §4.5 and §4.8 (the Strider home keeps Hawk's Eye, Long Breath, Wayfarer, Hard Target; still mixed),
§6.5 (the first notables stay 2 to 4 out), §5.4 (the Lists' weapons stay where strength and dexterity are).

### T2. The Zealot casters' first 60 points are the Mystic's Cloister, through Hymn's door. **Must fix.**

**Where:** the crossing `cathedral.home.hymn.b`–`spire.well.toCathedral.b` and the road `spire.well.toCathedral.a`,
which lands on Wandwork (`spire.well.wandwork.n`) and on Draught's small (`spire.well.draught.a`) at the Cloister's
door (`zealot-mystic-door.png`).

**The evidence:**

- At 60 points, five of the six Zealot casters spend more nodes in the Mystic than at home: storm-caster 50 Mystic
  against 10 Zealot, fire-burn 38/22, staff-block 39/21, block-caster 35/25; spell-totem 19/41. The Cloister
  (`spire.well`) is the single largest area in each of those plans (18 to 25 nodes of 60).
- Every one of them takes Zeal, Hymn, then Deep Well (9 from the Zealot), Glass Skin (11) and Quiet Pulse (11). Glass
  Skin is 7 from the Mystic start; Quiet Pulse is nearer the Zealot (11) than the Mystic (13).
- The path: Zealot start → `sig.b` → `hubs.e` → `roadE.a` → `hymn.b` → `toCathedral.b` → `toCathedral.a` → Wandwork /
  `draught.a` → `j1.a` → the Cloister. Z-1 made Hymn a spell notable one step off this road, so every Zealot caster
  now buys Hymn on the way (Hymn in 5 of the 6 casters' 60-point plans) and walks on.
- Round 1's fixes (Quickening moved, Composure's smalls to avoid stun, the Homily wheel's ends to spell block) took
  energy shield off the Cloister, but not the Cloister off the Zealot's road: the plans above are the round-1 picture.

**The player's view:** a Zealot who will cast spends the first map's points in the Mystic's garden, the same garden
for the fire, lightning, staff and shield casters. Hearthfire, Vigil and Iron Faith, the Zealot's own caster and
defence notables at 6 to 7 steps, lose to a neighbour's at 9 to 11.

**Rules broken:** §5.3 and §13.2 (one destination), §6.2 (the first points commit four builds to the same walk), §4.6
for the Zealot (its casters' life and energy shield in its own voice). Round 1 F6, not fixed.

**Proposed fix (move where the crossing lands; the border count stays 7):**

1. Cut `spire.well.toCathedral.a`–`spire.well.wandwork.n` and `spire.well.toCathedral.a`–`spire.well.draught.a`.
2. Re-lay Draught's pocket (`spire.well.draught.b`, `.n`, today a dead end off `draught.a`) as a bridge, the way fix 1
   hung Wake, Buttress and Ceaseless Blades: `toCathedral.a` → `draught.b` → Draught → `draught.a` → `j1.a`, the notable
   at the tent's tip, one small on each leg (cut `draught.a`–`draught.b`, link `toCathedral.a`–`draught.b` and
   `draught.n`–`draught.a`). Draught's links keep `draught.a`–`wandwork.n`, so Wandwork keeps three ways in; the second
   Zealot crossing (`cathedral.choir.toSpire.a`) still lands on `draught.b`. Do not lay a bare link from `toCathedral.a`
   to `draught.n`: it would run nearly parallel to Draught's chain, about 30 units from `draught.b`.
3. Steps from the Zealot start, measured on a copy of the graph with these changes: Wandwork 7 → 10, Deep Well 9 → 12,
   Glass Skin and Quiet Pulse 11 → 13, Draught 9 → 8. From the Mystic start, unchanged but Draught 13 → 12. The Zealot
   pays a flask notable on the way (§5.5's fair price).
4. **The second lever, if the re-measure still shows the Cloister:** two steps may not move the plans alone, because
   the Zealot home has no percent-life notable within 9 steps but Zeal's 5% (Vigil is regeneration and recharge), and
   Quiet Pulse's life is what the casters walk for. Re-line Vigil (`cathedral.nave.vigil.n`) toward `life(10),
   esRecharge(15)`: the Zealot caster's life and shield at home, a re-line, not new supply.

**Must not break:** §3.5 (Wandwork keeps `j1.a`, `draught.a` and its small; Draught gains a second way in; the Cloister
keeps its links north and the choir crossing), §11.5 (a regular tent, checked with `geometry.ts --region mystic`), §3.7 (no border link removed: the Hymn crossing stays, it
lands one node farther), §6 (the Mystic's first notables unchanged), §4.8 (the Zealot home unchanged). The network
auditor owns N4 (the Mystic–Zealot border); this changes only where its nearest crossing lands.

### T3. Warding Staff's spell block needs no staff, so the staff-or-shield fork at seam 5 is not a fork. **Should fix.**

**Where:** Warding Staff (`cathedral.rods.warding.n`: `staffDamage(24), spellBlock(4)`; smalls `a`, `b`, `c`
`spellBlock(2)`), two steps from Twofold Guard (`cathedral.rods.guard.n`, seam 5), which is two from Graven Posts
(`seam5-shield.png`).

**The evidence:** the fix brief kept Warding Staff two steps from Twofold Guard as "a §8.3 variant, staff or shield, no
build takes both since a staff is two-handed". But `spellBlock` is unconditional (`lines.ts`), so a shield build buys
Warding Staff's cluster for 5 units of spell block and ignores the staff half. mace-shield (a Vanguard mace build) takes
Warding Staff, Twofold Guard and Graven Posts at 60; block-caster takes Warding Staff, Twofold Guard, Iron Faith, Glass
Wall and Frozen Font at 120.

**Rules broken:** §8.3 (the two sides are taken together by the shield builds), §5.5 (neighbours a shield build wants
both of, two steps apart).

**Proposed fix:** make the staff side a staff's. Either (a) a spell block line under the `wieldingStaff` condition
(the way `blockAttack` takes a condition) on Warding Staff and its three smalls, checked live in the sheet and the fight
(§10.3); or, with no new line, (b) re-line the three smalls to `staffDamage(12)` and keep `spellBlock(4)` on the
notable only. Option (a) is the stronger fork and keeps staff-block's block supply (its block is flat at 120 today).

### T4. Wasp Sting and Venom Fletching: two poison notables three steps apart across the border. **Should fix.**

**Where:** Wasp Sting (`knife.snares.mercy.n`: `critMulti(25), poisonDamage(16)`; Strider 9, Shade 13) and Venom
Fletching (`bow.flight.venom.n`: chaos attacks, poison chance, `poisonDamage(12)`; Strider 9), joined by the border link
the brief kept (`poison-border.png`).

**The evidence:** K-2 gave Wasp Sting poison to end its same pairing with Killing Eye. bow-poison and claw-poison take
both at 60 and 120. Killing Eye has since moved to the far south (S-9): it is 17 steps from Wasp Sting now, so the
reason for a poison partner is gone, and the poison country of the Shade–Strider seam is now four notables within 11
steps (Venom Fletching, Wasp Sting 3, Smeared Edge 5 from Wasp Sting, Barbed Point 9).

**Rules broken:** §5.5 (neighbours one build wants both of), §5.1 (poison's clusters are its partners; here two of them
are a short walk apart for the same build).

**Proposed fix:** Wasp Sting keeps `critMulti(25)` and takes a Shade blade partner instead of poison: crit chance with
claws and daggers (`weaponCrit` for dagger and claw, about 15), the Shade striker's crit. It is 8 steps from Fine Point
and 5 from Raking Hand, so check Fine Point's dagger crit is a different lead (it leads with dagger damage). A name to
match (the fixer's). Venom Fletching unchanged.

### T5. Sidestep and Feint and Cut: fix pass 1 made a new same pairing. **Should fix.**

Graded above T7 (an older pairing of the same kind) because fix pass 1 created it while closing round 1's F5.

**Where:** Sidestep (`yard.dual.sidestep.n`, R-4: `dodgeAttack(5), dualBlock(4)`) and Feint and Cut
(`knife.rim` Seawall: `dualDamage(20), dodgeAttack(6)`), 25 steps apart.

**The evidence:** both are dual wield with dodge (the supply map's same-pairing flag). dagger-crit and dodge-blades take
both at 120. Far apart, but §5.1 says two copies of one pairing are not a choice.

**Proposed fix:** Sidestep keeps dodge and takes the stagger-proof duellist's partner, `dodgeAttack(5), stunAvoid(20)`
(about 2.7 units; raise the dodge to 6 to keep 3+). Avoid stun leads nowhere near it (Firm Footing, centre; Composure,
Mystic). Not accuracy (Footwork's lead after T1), not evasion (Weaving three steps away).

### T6. Hymn is taken by every Zealot caster, and its pocket is the Mystic crossing's doorway. **Consider, after T2.**

Hymn (`cathedral.home.hymn.n`, 4 steps) is in five of the six Zealot casters' 60-point plans: it is the only spell damage
within 6 steps and it sits beside the road out. S1 asked for this (a caster's first spell notable at home), so a shared
first pick is not a fault by itself. After T2, if the storm and fire casters' openings still match after Zeal and Hymn,
cut `cathedral.home.roadE.a`–`cathedral.home.hymn.b` alone, keeping the crossing on `hymn.b`: the road to the Mystic
then runs through Hymn's notable and is one step longer (`toCathedral.b` 5 → 6). Never relink the crossing to
`roadE.a`: that shortens the walk T2 lengthens.

### T7. Glass Skin and Hoarded Breath: energy shield with mana, twice. **Consider.**

Glass Skin (`spire.well.deepWell.n2`, Mystic 7) and Hoarded Breath (Shade, the Rookery: `es(14), mana(12)`) are the
same pairing, 20 steps apart. caster-es, summoner, wand-attack and dagger-caster take both at 120. Proposed: Hoarded
Breath keeps energy shield and takes a Shade defence instead of mana, energy shield with chaos resistance (`resOne`
chaos, about 1.5 units): the poison country's caster. Not spell dodge (Shifting Ward), not evasion (Grey Cloak).

### T8. Clean Break (seam 1) and Live Wire are in no plan. **Consider.**

Clean Break (`yard.blood.cleanBreak.n`, `physAttack(20), critMulti(18)`) is in no plan up to 120 and only bow-poison's
at 160; Live Wire (`bow.south.liveWire.n`) is in none at any budget. The archetype set has no physical-crit Reaver and
weighs generic crit multiplier lightly, so this is partly the yardstick's blind spot (B9). No change proposed: moving or
re-lining either only to enter a plan would be a node placed for a number (§14). Note at stop 4.

### T9. Keen Instinct and Quick Wrists: the Shade's signature and its attack speed, two steps apart. **Consider.**

Both are in 8 plans at 120, including the three bows, wand-attack and dual-wield, who walk into the Shade home for
Quick Wrists' attack speed. At home this is the start's intended opening (§6.5), but it is the other half of T1's
middle. No change now (the smalls stay attack speed, §8.2); re-measure after T1, and only if the bows still walk in
for it, swap Quick Wrists' lead to dodge (`dodgeAttack(5), attackSpeed(6)`) so it reads as the Shade's.

### T10. Two-handers take both sides of the Greatweight wheel; stun gathers. **Consider.**

Greatweight (two-handed damage, stun duration) and Broad Back (life, stun recovery) are both taken by mace-slam and
two-hand-fire; mace-shield, warcry-totem and sceptre-fire take Broad Back alone. By §8.3's own note (others choose), not
a fault. V-4 added stun to Greatweight while Headsman (two-handed with stun) is in the same two-hander plans; two-hand-
fire has one plan at 60 and 120. The builds auditor owns the choice count; from this subset, no change.

### T11. Pairs two steps apart that a build takes both of. **Consider.**

Vigil and Choirmaster (2; summoner, aura-brand), Bright Omen and Shattering Rite (2, the seam chain; caster-life,
channeller). Different kinds in both pairs, so §5.5's "a notable of a different kind is a fair price" covers them.

### T12. Far same pairings left. **Consider.**

Consecrated Plate and Ox Hide (armour with stun threshold, 20 apart; one plan takes both), Hard Target and Wiry Frame
(evasion with life, 20 apart; bow-poison, claw-poison, trap-mine take both), Hawk's Eye and Hare's Pace (evasion with
attack speed, 20 apart; Hare's Pace is the far twin by design and all seven dexterity attackers take it at 120). Leave
for the vocabulary pass; Hare's Pace becomes a real late direction once T1 thins the near evasion.

---

## 2. What is good in this subset (keep it)

- **The Meadow is no longer a knot.** True Aim is gone; Quick Hands and Fleet Foot are 8 apart and different in kind;
  Hard Target and Fleet Foot are 3 apart, not linked. The one remaining issue is T1's, not a fake wheel.
- **Flat-because-unreachable is gone for the elemental archer and traps:** elemental attacks climb +38% past 120
  (was 0), trap and mine damage +18% (was 0). Bright Shafts on the Quiver and the seam bridge at Hair Trigger did it.
- **The sword build trades:** sword damage climbs +16% past 120 (was +4%) now that Greatblade's smalls are two-handed;
  life +54%, armour +27%. The user's example holds.
- **Twin distances:** outside the wheels built as variants (Athame / Long Knives, Reliquary / Runecarver, Broad Weave /
  Darting Bolts, Deep Well / Glass Skin, Homily / Glass Wall) and T3, no two notables of one specialization are under 5
  steps apart. Weapons: bow 13 to 16, wand 10 to 13, mace 8 to 10, dagger 7 to 11, claw 8 and 17, axe 12, two-handed 7
  to 14, sword 9 to 18.
- **Wheels that work** (by the allocator, both sides rarely taken by one build): Longbow / Fleet Blade, Far Flight /
  Barbed Arrows, Split Volley / Deep Cuts, Ready Wit / Warded Mind, Talon / Fine Point, Barbed Point / Shroud, Trapper /
  Black Flock, Rotting Word / Sapper, Iron Faith / Hearthfire (only block-caster both), Gilded Rod / Quarterstaff, Rimed
  Steel / Benediction, Steel Rim / Scarred Hide (only mace-shield both), Choirmaster / Shepherd (only the summoner),
  Full Swing / Paired Steel, Twin Fangs / Weaving (dual wielders both, five others Weaving only).
- **Re-partners that held:** Thrown Voice (spell with spell dodge), Weak Spot (melee crit near the Vanguard home, a
  life-or-damage choice for three builds), Field Dressing, Weaving, Wanderer, Quiet Knife (the dagger caster's door),
  the Homily wheel's spell block ends, Composure.
- **The convergence rule holds:** within reach of a home, only First Light, Oathbound and Zeal (the named signatures)
  pair spell damage with energy shield or life with armour; Glass Wall (14), Tomb Dust (18), Ritual Blade (23) and
  Tempered (20) are far. No cluster pairs a sword with life or armour.
- **Weapons where their attributes are (§5.4):** holds everywhere; the moved and new clusters (Bright Shafts on the
  Quiver, Greatblade, Quiet Knife, Twofold Guard) all sit on their weapon's attributes.
- **Seams that answer a want on both sides:** Twofold Guard (mace-shield and block-caster), Needlework (wand-attack,
  trap-mine, and dagger-crit at 160), Hare's Pace (every dexterity attacker at 120), Bright Omen (casters from both
  sides at 120 to 160).

## 3. Round 1 follow-up

| round 1                                       | grade        | now                                                                                                               |
| --------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| F1 the Meadow (must)                          | fixed        | True Aim removed, Fleet Foot re-lined and 3 from Hard Target, not linked; what remains is T1                      |
| F2 evasion around the Strider (must)          | partly       | pairings now differ; the seven attackers still open on the same six notables (T1)                                |
| F3 out of reach (should)                      | fixed        | elemental attacks +38%, traps +18% past 120; Live Wire still in no plan (T8)                                      |
| F4 Greatblade (should)                        | fixed        | smalls two-handed; sword +16% past 120                                                                            |
| F5 Killing Eye = Mercy Stroke, Sidestep (should) | partly    | both ended; the fixes made Wasp Sting + Venom Fletching (T4) and Sidestep = Feint and Cut (T5)                    |
| F6 the Cloister (should)                      | not          | energy shield thinned, but five Zealot casters' 60 points are still the Cloister (T2)                             |
| F7 the Nave knot (should)                     | fixed        | Hearthfire has only its wheel's links; the openings differ; Vigil–Choirmaster 2 is left (T11)                     |
| F8 spell with cast speed ×3 (should)          | fixed        | Thrown Voice is spell with spell dodge                                                                            |
| F9 Scarred Hide = Stone Heart (consider)      | fixed        | Stone Heart is Weak Spot                                                                                          |
| F10 Field Dressing (consider)                 | fixed        | life out, movement in                                                                                             |
| F11 Homily ends (consider)                    | fixed        | spell block                                                                                                       |
| F12 Zeal (consider)                           | closed       | named a convergence exception                                                                                     |
| F13 Darting Steel (consider)                  | not (deferred) | unchanged; sword-str takes it at 60, dual-wield gives it up                                                     |
| F14 accuracy as a partner (consider)          | not (deferred) | T1's Footwork fix makes accuracy a lead there                                                                   |
| U4 Footwork (left for this round)             | condition met | in all seven dexterity attackers' 60-point plans: re-partner (T1)                                               |

## 4. Checklist of this subset

| item                                                    | verdict                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| §1.1 the tree forces trade-offs                         | holds with exceptions: the dexterity attackers' first 60 points (T1); the Zealot casters' first 60 (T2)                                        |
| §5.1 two or three clusters, each a different partner    | holds with exceptions: Sidestep = Feint and Cut (T5), Glass Skin = Hoarded Breath (T7), the far pairs of T12                                    |
| §5.2 twins about 5+ steps apart                         | holds with exceptions: Warding Staff / Twofold Guard 2 (T3); wheel variants by design                                                           |
| §5.3 concentration by intent; generics never one place | fails for the dexterity middle (T1) and the Cloister for the Zealot (T2); holds for weapons, elements, minions, curses                          |
| §5.4 weapons where their attributes are                 | holds                                                                                                                                           |
| §5.5 neighbours compete                                 | holds with exceptions: Wasp Sting / Venom Fletching (T4), Warding Staff / Twofold Guard (T3)                                                    |
| §5.6 specific paths optional                            | holds                                                                                                                                           |
| §5.7 named builds exist                                 | holds (minions in four regions, Spirit Ward, five wand clusters)                                                                                |
| §8.3 micro choices are real                             | holds with an exception: Warding Staff / Twofold Guard (T3); Greatweight / Broad Back and Deep Well / Glass Skin pass by the user's note        |
| §13.1 connections against trade-offs                    | holds; the fixes proposed keep every crossing (T1 re-lines, T2 moves a landing)                                                                 |
| §13.2 identity against spread                           | fails at T1 and T2                                                                                                                              |
| convergence (spell + ES, life + armour, sword + either, near a home) | holds; the named exceptions are First Light, Oathbound, Zeal                                                                       |

Area labels were not checked. No new rule is proposed (§14). The reference game is not named in this report.
