# G4 audit round 2: builds

Auditor for the builds subset: G-growth §1 (the measure), the agreed targets of `G0-baseline.md` ("Stop 1"), and the
parts of CONSTRAINTS the measure reads (§1.1, §4.6, §5.1, §5.3, §7.4, §9.3, §12.3, §12.4, §14, §15.2). The network is
commit b6a493c: 1,398 live nodes, `edits.json` empty, and no file in `src/data/passives/` or `scripts/passives/` has
changed since ed95ecf (fix pass 1). This audit only reads. Nothing in `src/`, `scripts/`, CONSTRAINTS or the plan docs
was changed. Area labels are ignored, as the user asked.

**Runs.**

- `npm run passives:builds -- --json` on the whole tree, 28 archetypes. Its printout is identical to
  `G4/builds-fix1.txt` line for line, so that file is this round's printout.
- Compared with `G0/builds-base2.json` (the G0 tree measured with today's tool; "G0" below) and `G4/builds-start.json`
  (the tree before fix pass 1, same tool; "start" below).
- Read-only probes, all in the session scratchpad, none in the repo:
  - a curve comparer;
  - a flat-stat classifier (supply of each main family, the share each plan holds, the nearest untaken notables that
    carry it);
  - a walk printer;
  - a per-stat table;
  - a notable-frequency count;
  - a weights audit;
  - an in-memory trial harness: a copy of `builds.ts` that applies one change to the built graph or to the weights
    before measuring.
  - Every trial below is a yardstick check of a proposed change, never its reason (CONSTRAINTS §14).

**Pictures** (this folder, `builds/`, from the tool's `--pics`):

- the archetype pictures: `wand-attack.png`, `storm-caster.png`, `two-hand-fire.png`, `curser.png`,
  `staff-block.png`, `fire-burn.png`, `bow-crit.png`, `dagger-crit.png`;
- the colours: yellow is the best 60-point plan, orange what the best 120-point plan adds, and red rings what 40 more
  points would add.

## 0. Against the targets

| target (G0 Stop 1)                                        | G0 (base2)       | start (before fix 1) | **now**                           | verdict                                   |
| --------------------------------------------------------- | ---------------- | -------------------- | --------------------------------- | ----------------------------------------- |
| 1. At 120, typical main stat's gain from 40 more points   | 15%              | 25%                  | **23%** (aim ~30%+)               | fails, went back                          |
| 1. Main stats gaining 10% or less                         | 40%              | 17%                  | **26%** (aim ~10%)                | fails, went back                          |
| 1. Archetypes whose every main stat gains 20%+            | 1                | 3                    | **1** (aim ~2 in 3)               | fails                                     |
| 2. At 60: typical main stat; flat ones                    | 50%; 17%         | 54%; 14%             | **54%; 11%**                      | holds                                     |
| 3. At 120, notables worth 2.5+ that 40 more points add    | typ. 1, 7 none   | typ. 3, 0 none       | **typ. 2, 1 none** (wand)         | holds with one exception                  |
| 4. At 120, choice                                         | 6 at 1, 15 at ≥3 | 0 at 1, 22 at ≥3     | **2 at 1, 22 at ≥3**              | holds with two exceptions                 |
| 5. At 120, tax                                            | 34%, 15 over ⅓   | 30%, 8 over ⅓        | **31%, 10 over ⅓**                | holds with exceptions                     |
| 6. One stat at a time (no target; aim: roughly unchanged) | §3               | §3                   | spell and armour back; evasion up | spell and armour met, evasion missed (F1) |

**Fix pass 1 did what it was for:**

- Spell damage at 120 is back to 112–178% (G0 70–126, start 128–260).
- Armour is back to 218–290% (start 278–378).

**But four of the five targets moved the wrong way against start.** The reason is mostly what the fix was meant to do:

- Once the spell and armour smalls stopped being destinations (§5.3), what is left of those stats is notables
  scattered 7 to 10 steps out, at 2 to 3 units each.
- The allocator now buys life or energy shield with its last 40 points instead.
- So many of the new flats are **trades**, not shortages (§2).

The rest comes from:

- the yardstick: two-hand-fire's single plan and Clean Break in no plan (F3);
- the Hymn door (F2);
- the evasion block (F1).

**The user's two examples:**

- **The classic caster (caster-es)** was round 1's showcase. Now:
  - it holds 44% of the network's spell damage, which climbs +42% past 120;
  - it holds 65% of the network's energy shield, which climbs +13%;
  - cold climbs +11%.

  It gives up spell damage, not shield: still a trade, and it does not take all of both.

- **The strength sword build (sword-str):**
  - life 121%, +54% past 120;
  - armour 230%, +27%;
  - 61% of the sword supply, +16%;
  - attack speed 8.2 units, flat.

  It takes all of none of the three. The attack speed is a trade: the speed near it comes with partners it does not
  weigh (§2).

**Choice at 60.** Four single plans: caster-life, dual-wield, dagger-crit, two-hand-fire (start had seven:
mace-shield, summoner, axe-bleed, dual-wield, claw-poison, dagger-caster, block-caster). At 120: two-hand-fire (F3, the yardstick) and axe-bleed (supply: it holds 95% of bleed).

---

## 1. Findings, most important first

### F1. Evasion is this round's per-stat jump: every dexterity attacker takes the same 19 evasion nodes — should fix

**What.**

- At 120 points all eight dexterity builds (the three bows, dual-wield, dagger-crit, claw-poison, dodge-blades,
  trap-mine) hold the same 19 evasion nodes:
  - Hawk's Eye, Hard Target and `hardTarget.a`, Fleet Foot and `speed.b`;
  - Wayfarer and its four smalls `bow.steel.wayfarer.a`–`d`;
  - Keen Instinct, Soft Step and its two smalls;
  - Footwork;
  - Weaving and `yard.dual.twinFangs.c`, `.d`.
- Together they are 245% evasion, mostly bought by 60 points.
- The far evasion (Field Kit, Tall Grass, Guarded, Buckler, Veiled Herald, Grey Cloak, Wiry Frame) is in 0 to 4 of the
  eight plans.

| evasion at 120 (160) | G0        | start     | now           |
| -------------------- | --------- | --------- | ------------- |
| dagger-crit          | 268 (311) | 340 (388) | **367 (402)** |
| trap-mine            | 247 (270) | 300 (333) | **368 (402)** |
| dodge-blades         | 256 (299) | 340 (388) | **367 (402)** |
| bow-crit             | 256 (299) | 252 (315) | **325 (370)** |
| bow-elemental        | 256 (309) | 265 (359) | 275 (373)     |
| dual-wield           | 271 (271) | 305 (368) | 285 (383)     |

- The network's evasion supply is 55.5 units (G0 about 35). It is all in the Strider (28.3), the Shade (17.4) and the
  Reaver (9.8).
- The three Shade builds hold 66% of it at 120, and 40 more points add 9 to 10% (they are three of this round's
  flats).
- This is round 1's armour and spell jump in another stat: a generic stat that has become one destination (§5.3,
  §13.2). The dexterity builds take all the evasion there is near them, so evasion is no decision.
- Fix pass 1 re-partnered Wanderer, Weaving and Fleet Foot, but Weaving and Fleet Foot still lead with evasion, and
  Hare's Pace (seam 4, `evasion(20), attackSpeed(10)`) added 20% to seven of the eight plans by 120.

**The same convergence at 60** is the trade-offs report's T1 (must, `audit/growth-2/tradeoffs.md`). The builds data
agrees:

- the dexterity group's overlap at 60 is unchanged (Jaccard 0.33; G0 0.35);
- the Shade attackers still spend more of their first 60 points in the Strider than at home: dagger-crit 28 Strider
  against 23 Shade, claw-poison 30 against 24, dodge-blades 31 against 27;
- U4's condition is met: Footwork is in seven of the eight dexterity plans at 60.

**Trials** (the eight dexterity archetypes, in memory):

| change                                                                                                              | evasion at 120, now → trial                                                | evasion gain past 120            | choice at 120                                                              |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| Footwork without evasion only (`accuracy`, `attackSpeed`)                                                           | −25 for each                                                               | unchanged                        | unchanged. Footwork **stays in 7 plans**: it is on the route.              |
| T1 (trade-offs): Footwork `accuracy(20), moveSpeed(6)`; Ford smalls `wayfarer.c`, `.d` → `dex(7)`                   | bow-crit 325 → 270, trap 368 → 323, dodge 367 → 322, dagger 367 → 357      | bows +20 to +48%; Shade 0 to 11% | trap-mine 2 → 1; dagger-crit 2 → 4; dodge 2 → 4                            |
| T1 plus Wayfarer's own smalls `wayfarer.a`, `.b` → its partner, `resAll(4)` (the B1 rule: smalls carry the partner) | bow-crit 250, bow-elemental 225, dual 233, trap 303, dodge 302, dagger 337 | bows +22 to +52%; Shade 0 to 12% | as T1, but claw-poison's choice at 60 goes 2 now → 5 with T1 → 1 with this |

**Proposed fix.**

1. Take T1 as the trade-offs report proposes it. It brings the bows' and dual-wield's evasion back toward G0 and makes
   it a stat they still want past 120.
2. Then re-line Wayfarer's own two smalls (`bow.steel.wayfarer.a`, `.b`) from `evasion(10)` to its partner,
   `resAll(4)`. This is the rule fix pass 1 applied to Composure, Iron Voice and Mended Mail. Wayfarer keeps
   `evasion(20)` on the notable, its section stays uniform (§8.2), and the Strider home keeps Hawk's Eye, Hard Target and
   Fleet Foot as evasion (§4.5). **This step goes beyond T1, and the two reports differ here:** T1 keeps `wayfarer.a`
   and `.b` as evasion (its largest near bundle goes from six units to four); this step takes it to two. The
   coordinator should choose one.
3. **Not fixed by either:** the Shade attackers' evasion stays nearly flat. Their evasion is their own home's (Soft
   Step and its smalls, Keen Instinct, Snakeskin) plus the Strider's. Any change there is a §6 question for the starts
   auditor. I propose none from the builds data alone.
4. Watch trap-mine's choice at 120 (it falls to 1 in both trials).

**A fix must not break:**

- §4.5 and §4.8: the Strider home stays mixed and keeps its class defence;
- §8.2 and §8.6;
- §6.2: the first points still a real choice;
- §14: nothing is added, supply only comes off.

### F2. The Zealot casters' first 60 points go to the Mystic through Hymn: should fix (the builds side of the starts report's F1)

**What.** Fix pass 1 re-lined Hymn (`cathedral.home.hymn.n`, Z-1) into the Zealot caster's first spell notable at 4
steps. Its far small `cathedral.home.hymn.b` is also the Zealot end of the near crossing `spire.well.toCathedral.b`.
That crossing leads to Wandwork and the Mystic's Cloister: Deep Well at 9 steps from the Zealot start, Glass Skin and
Quiet Pulse at 11, Warm Blood at 12. The Zealot's own caster clusters are as far or farther: Quarterstaff and Warding
Staff 12, Lectern 15, Crozier 19.

| Zealot caster, 60-point plan by region | start     | now       |
| -------------------------------------- | --------- | --------- |
| staff-block                            | Ze60      | Ze21 My39 |
| fire-burn                              | Ze43 My17 | Ze22 My38 |
| spell-totem                            | Ze55 My5  | Ze41 My19 |
| block-caster                           | Ze22 My32 | Ze25 My35 |
| storm-caster                           | Ze10 My50 | Ze10 My50 |

- The six Zealot casters' 60-point plans now overlap twice as much as at start (Jaccard 0.21 → 0.39). The notables
  that five or six of them share went from 2 to 6: Zeal, Hymn, Quiet Pulse, Glass Skin, Homily and Living Verse.
- staff-block takes no staff and no block notable by 60 (`staff-block.png`: Zeal, Hymn, then the Cloister).
- Choice at 60 fell for fire-burn (4 → 2) and aura-brand (3 → 2).
- This is the starts report's F1 (must), which proposes moving the crossing from `hymn.b` to `cathedral.home.roadE.b`.
  §6.2 and §13.8 are theirs; the builds side is §4.6 (the Zealot sells its casters what they want in its own voice) and
  §1.1 (no decision in the first 60 points).

**Trials** (the six Zealot archetypes):

| change                                               | 60-point openings                                                                                                                                | at 120                                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the starts report's: crossing moved to `roadE.b`     | staff-block Ze60 (Quarterstaff, Warding Staff, Crozier, Lectern), spell-totem Ze55, fire-burn Ze29 My31, storm Ze27 My33; block-caster unchanged | storm-caster's lightning gain past 120 3% → 21%. Fire-burn's fire 26% → 8% and life 167% → 115%; storm's life gain 16% → 3%. Choice 60/120: spell-totem 6/6 → 5/5, staff-block 4/6 → 3/5, aura-brand 2/4 → 3/4, block-caster 4/3 → 4/5 |
| crossing moved to the transept `cathedral.home.jT.a` | only staff-block comes home                                                                                                                      | does not work                                                                                                                                                                                                                          |
| bare cut                                             | 4 of 6 home                                                                                                                                      | storm-caster's choice at 60 falls 3 → 1, and a §3.7 crossing is lost                                                                                                                                                                   |

**Proposed fix:** the starts report's: re-aim the crossing to `roadE.b`. The builds data supports it. Say to the user
that it trades the casters' 60-point variety for their life at 120: fire-burn's life falls by a third, and it then
climbs +64% past 120, so it becomes a stat it has to choose.

**Storm-caster's lightning, a side effect of Hymn** (supply, consider):

- The network has five lightning spell notables (16.6 units): Hymn, Thunderhead, Live Current, Static Edge and Thunder
  Peal.
- The storm caster holds four at 120 (71% of its lightning family), so 40 more points add 3%.
- The `roadE.b` trial brings that back to 21% without adding a node.
- No sixth cluster is proposed: that would be supply for the number (§14).

### F3. The yardstick hides two of the fix pass's own results: two-hand-fire's single plan and seam 1 — should fix (the yardstick)

1. **two-hand-fire has one plan at both 60 and 120,** the only archetype with that.
   - Its weights carry no `MELEE` bundle, unlike mace-slam, sword-str and dual-wield, so the new melee notables near its
     start are worth almost nothing to it (Weak Spot: `meleePhys`, `critChance:melee`).
   - **Trial:** with mace-slam's `MELEE` lines (`meleeDamage 0.8, meleePhys 1, physAttack 1, critChance:melee 0.3,
meleeRange 0.3`), its choice is **4 / 4** (99%, 98%, 97% plans).
   - So the single plan is the yardstick's, not the tree's. Its want says "two-handed fire melee".
2. **Clean Break (seam 1, `yard.blood.cleanBreak.n`, `physAttack(20), critMulti(18)`) is in no plan below 160.** Only
   bow-poison takes it, at 160.
   - The fix brief chose this pairing as "wanted on both sides: sword-str, axe-bleed, dual-wield, bow-crit". But no
     Reaver archetype weighs the generic `critMulti` or `critChance`. To them the cluster is 2 units for 4 or 5 points
     (sword-str 4 steps from its 120 plan, dual-wield 4, axe-bleed 5).
   - bow-crit weighs it at 3.2, 8 steps from its plan, and buys life and evasion nearer.
   - **Trial:** with `critChance 0.5, critMulti 0.5` on sword-str, dual-wield and axe-bleed, sword-str takes Clean Break
     from 80 points on and dual-wield takes it at 140.
   - dual-wield's own want names crit ("dual wield damage, speed and crit") and weighs only `dualCrit`.

**Proposed fix (`scripts/passives/archetypes.ts`):**

- spread `MELEE` into two-hand-fire;
- give dual-wield `critChance` and `critMulti` at about 0.6, as its want says;
- either give sword-str the same at about 0.4, or record that the strength sword build is not a crit build, and then
  that seam 1's "both sides" holds only for bow-crit. That is a statement for the user at stop 4, not a reason to move
  the seam.

**Consequence to say out loud:** a weights change moves every number of the archetypes it touches (round 1's caveat).
Re-run the whole report after the change and compare stop 4 against it.

**A fix must not break:** §14 (the weights describe a player's wishes; they place nothing).

### F4. The yardstick still prices flasks, movement and mana sustain for attackers at almost zero — should fix (the yardstick)

1. **Flasks and movement are what §4.6 says every region sells, and the measure barely sees them.**
   - Only bow-crit weighs flasks (0.25 each), and only dodge-blades weighs movement (0.4).
   - So Quartermaster, Field Dressing, Quick Sip, Draught, Provisions, Quick March, Unhurried and Procession are worth
     under 1.5 units to every archetype, and seven of them are in no plan at any budget.
   - Fix pass 1 moved several lines onto movement (Fleet Foot `moveSpeed(8)`, Procession `moveSpeed(8)`, Field
     Dressing `moveSpeed(4)`). The measure reads each as a pure loss: Procession went from 4.0 to 2.0 units for
     aura-brand, so aura-brand's auras now read flat (§2).
2. **Unweighed keys** (10, from 35 at round 1):
   - `manaOnHit:attack` (Fighting Breath), `manaOnHit:melee` (Iron Lungs), `manaLeech` (Vampiric Strikes, Thirsty
     Quiver), `manaOnKill` (Spoils);
   - `lifeOnKill`, `manaFlat`, `damageOnLowLife`, `cooldownRecovery`, `knockback`, `stunDamage`.
3. **Two keystones are weighed by nobody,** so they are in no plan:
   - Plated Hide (`bow.steel.platedHide.k`, "evasion converted to armour"): a Reaver or Strider armour-and-evasion
     hybrid;
   - Living Ward (`cathedral.choir.livingWard.k`, "life regeneration applies to energy shield"): an ES caster with
     regeneration.
4. **Five keystones are weighed but in no plan:** Unerring Discipline, Cruel Agony, Strongarm, Fever Pitch and Shade
   Leech, 5 to 7 steps from their builds' 120-point plans. These are trades, not faults.
5. **B9 was not done.** The fix brief (§3 item 6) asked for a spellblade, a curse attacker and a dexterity sword and
   board before this round. The clusters placed for them are still in no plan:
   - Spellsword (4.1 to channeller, 23 steps from its plan);
   - Marked Prey (4.0 to curser, 20 steps);
   - Round Shield and Fencer's Eye.
6. **Leftovers:**
   - `curseArea` is gone from the network but still weighed by the curser and listed in its `curses` family;
   - the `weapon()` bundle still adds `weaponDamage:<w>` keys the network never writes.

   Both are harmless.

**Proposed fix (`archetypes.ts`):**

- a small `FLASK` and movement bundle (about 0.2 each) for every archetype, the way `RES` is shared;
- `manaOnHit:*` and `manaLeech` (about 0.25) for the attackers;
- Plated Hide on dual-wield or a new hybrid, and Living Ward on caster-es or the summoner, at a worth in units;
- the three B9 archetypes;
- drop `curseArea`.

Same consequence as F3: every number moves, so the stop-4 comparison is against a re-run.

### F5. The wand attacker finishes its weapon by 120 and has nothing left it wants: consider (a question for the user)

The worst numbers of the round:

- wand damage 100% of the network's supply held at 120;
- energy shield +7% past 120;
- tax 43% (start 35%);
- the only build with no notable worth 2.5 or more in what it gave up.

The walk is in §4 A. In short:

- **Supply.** The four wand clusters (Deft Wand, Wand Volley, Bright Wand, Pinpoint) are 17.3 units, all in the Mystic,
  6 to 25 steps from the start. Fix pass 1's Needlework (seam 3) made the trip to Pinpoint worth it, so the plan now
  takes all four, which raised the tax.
- **What is left.** Its last 40 points buy the Strider's and the Shade's attack speed and life. The Mystic sells no
  attack speed of its own (round 1's T2).

A fifth wand cluster added to lift the curve would be supply for the number (§14).

**For the user:** like U2 ("a weapon finished by 120 and paid for with life is an accepted trade"), is a wand finished
by 120 and paid for with attack speed and 43% road acceptable? If a late wand direction is wanted anyway:

- it belongs outside the Mystic, with an attack-speed partner, where the attack speed is (§5.3 concentration is chosen
  per specialization);
- the Shade's Rooftops or the Mystic–Shade stair are the candidates.

### F6. Three notables are still everyone's destination: consider

| notable                                   | plans at 120 (of 28) | lines                    | note                                                                                                                                                                                                     |
| ----------------------------------------- | -------------------: | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thick Blood (`knife.edge.thickBlood.n`)   |                   17 | life 10, +20 life, es 5  | Every non-strength build, the Zealot casters included, at 17 steps. It was 20 at G0 and 15 at start. It is the starts report's F2 (should); I add nothing to its fix.                                    |
| Living Verse (`spire.well.livingVerse.n`) |                   13 | spell damage 20, life 8  | M-1 re-lined its smalls to life, so every caster takes the notable and three life smalls. Spell damage per stat is fixed, but the cluster is now every caster's life stop on the Mystic–Zealot crossing. |
| Composure (`spire.well.composure.n`)      |                   13 | es 15, stun avoidance 20 | M-2 re-lined its smalls; the notable is every energy-shield build's (12 at start).                                                                                                                       |

At G0 the top notable was in 20 plans and the next three in 18, 18 and 15. Now the top is 17, then 12, 12 and 11
(concentration fell). If one is changed, the shape of the fix is a re-partnered notable, not a move: Living Verse's
`life(8)` partner is what makes it every caster's. None of this is a must: life and energy shield are wants of nearly
every build, and §5.3 asks for "lines on many notables", which these are.

### F7. The strength builds now hold the least life of any archetype: consider (per-stat report for the user)

| life at 120   |  G0 | start | now |
| ------------- | --: | ----: | --: |
| sword-str     | 194 |   129 | 121 |
| mace-slam     | 233 |   169 | 141 |
| mace-shield   | 209 |   159 | 140 |
| warcry-totem  | 224 |   145 | 118 |
| axe-bleed     | 183 |   131 | 121 |
| two-hand-fire | 211 |   132 | 135 |
| sceptre-fire  | 191 |   112 | 100 |

**Against the other builds:**

- The Zealot casters hold more: spell-totem 189, storm 174, fire-burn 167, aura-brand 162.
- So does the bow-poison build: 155.

**Why:**

- Fix pass 1 took life off the near-start strength notables, as its §6 predicted (−10 to −25%): Stone Heart became
  Weak Spot, and Quickened Steel, Buckler and Field Dressing lost their life.
- The mace builds' life gains only +11% past 120. They have already taken the life within reach (Broad Back, Second
  Wind, Stout Heart and Scarred Hide, all in their plans) and buy armour and mace damage after.
- The Zealot is the region with the least life (10 units, against 15 to 19 elsewhere), so its casters' life comes from
  the Mystic (Quiet Pulse, Living Verse, Warm Blood) and Thick Blood.

**For the user:** this is the trade the user's first example asked for ("not all the life, all the armour and all the
sword damage"), and U2 accepted it for the weapon builds. Whether the strength classes should end below the casters in
life is for stop 4. The F2 trial lowers the Zealot casters' life (fire-burn 167 → 115) as a side effect.

---

## 2. Main stats flat past 120 (40 more points add 10% or less), and why

Columns:

- **held** is the share of the network's supply of the family that the 120-point plan holds.
- **nearest untaken** is the nearest notables carrying the family, as steps from the plan and their worth to the
  build.
- **Supply** means the build holds the family's clusters: missing supply.
- **trade** means wanted supply lies within reach and the build buys something else.
- **geography** means the rest is 12 or more steps away in another class's area.
- **yardstick** means the measure misprices it.

| archetype     | stat (units 120 → 160)         | held | nearest untaken                                                   | verdict                                                              |
| ------------- | ------------------------------ | ---: | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| wand-attack   | wand damage 17.3 → 17.3        | 100% | none                                                              | **supply** (F5)                                                      |
| axe-bleed     | bleed 28 → 28                  |  95% | Festering 4 (1.3, poison)                                         | **supply** (all six bleed clusters held)                             |
| storm-caster  | lightning 24.1 → 24.9          |  71% | Thunder Peal 13 (1.9)                                             | **supply** (4 of 5 lightning spell notables; F2 side effect)         |
| staff-block   | block 15.5 → 15.5              |  72% | Rood Screen 10 (3.4), Stone Ward 24                               | supply nearly, and a trade                                           |
| warcry-totem  | totem 16.7 → 16.7              |  70% | Sentry Post 13 (3.5), Reliquary 13 (3.0)                          | supply at home; the rest is geography                                |
| sceptre-fire  | sceptre 17.1 → 17.1            |  67% | Light Blades 13, Light Hand 17                                    | supply (U2, accepted)                                                |
| aura-brand    | brand damage 26 → 27.3         |  42% | Hymn 3, Crozier 5 (its spell damage)                              | supply of brands (two clusters, both held); a trade for spell damage |
| aura-brand    | auras 23 → 23                  |  60% | Battle Hymn 6 (1.7), Procession 9 (2.0)                           | trade (partners it does not want); **yardstick** (movement, F4)      |
| dagger-crit   | evasion 36.7 → 40.2            |  66% | Wiry Frame 8 (3.9), Tall Grass 10 (2.8)                           | the evasion block (F1)                                               |
| trap-mine     | evasion 36.8 → 40.2            |  66% | Veiled Herald 3 (1.4), Tall Grass 10                              | the evasion block (F1)                                               |
| dodge-blades  | evasion 36.7 → 40.2            |  66% | Wiry Frame 9 (3.9), Tall Grass 10                                 | the evasion block (F1)                                               |
| two-hand-fire | fire attack 23.4 → 23.4        |  47% | Pitch Arrows 11, Elemental Fletching 14, Kindled Steel 14         | geography (U2, accepted)                                             |
| sceptre-fire  | fire attack 20 → 20            |  40% | Bright Wand 13, Elemental Edge 15, Bellows 18                     | geography (U2, accepted)                                             |
| curser        | curses 22.5 → 22.5             |  65% | Bad Company 7 (2.0), Marked Prey 20 (4.0), Grim Oath 24 (3.5)     | geography; it buys energy shield (+56%)                              |
| block-caster  | spell block 14 → 14            |  54% | Buttress 9 (2.2), Stone Ward 21                                   | trade and geography (spell block is 20 of 26 units in the Zealot)    |
| sword-str     | attack speed 8.2 → 8.2         |  20% | Standard Bearer 3 (0.8), Drill Call 3 (1.3), Steady Hands 6 (2.1) | trade: the speed near it comes with partners it does not weigh       |
| wand-attack   | energy shield 43.6 → 46.6      |  68% | Glass Wall 4 (1.0), Shifting Ward 6 (2.4)                         | trade for attack speed (+71%)                                        |
| dual-wield    | dual wield 17 → 17             |  59% | Paired Steel 8 (3.0), Feint and Cut 11                            | trade (it buys evasion +34%)                                         |
| staff-block   | spell damage 30.1 → 32.4       |  45% | Keen Verse 7 (3.1), Long Chant 8 (2.5)                            | trade for life (+63%)                                                |
| block-caster  | spell damage 19.5 → 20.8       |  38% | Keen Verse 7 (3.1), Long Chant 8 (2.5)                            | trade for energy shield (+60%)                                       |
| storm-caster  | spell damage 24.2 → 26.7       |  41% | Keen Verse, Long Chant (their partners unweighed)                 | trade for cast speed (+31%) and life                                 |
| channeller    | channelling, spell 31.3 → 33.3 |  49% | Hymn 5 (3.0), Keen Verse 7 (3.1), Hedge Magic 10 (3.5)            | trade for energy shield (+52%)                                       |
| spell-totem   | life 38.8 → 39.8               |  40% | Elemental Ward 5 (2.0), Wake 8 (3.2)                              | trade (spell +40%, totem +100%)                                      |
| bow-poison    | life 32 → 33                   |  33% | Iron Draw 4 (2.0), Scarred Hide 6 (2.0)                           | trade (poison +87%)                                                  |
| claw-poison   | life 29.4 → 29.4               |  30% | Deep Pull 3 (1.6), Scarred Hide 6 (2.0)                           | trade (poison +43%, claw +45%)                                       |
| sceptre-fire  | armour 24.2 → 24.2             |  59% | Iron Liturgy 5 (1.3), Tempered 12 (2.5)                           | trade for life (+97%)                                                |

**In sum:**

- **Supply:** seven (wand, bleed, lightning, brands, sceptre, the staff caster's block, the totems).
- **Trades:** fourteen. Most are the casters' spell damage, the new tension the user asked for, with energy shield or
  life climbing beside it.
- **Geography:** four.
- **The evasion block:** three (F1).
- **The yardstick:** one, aura-brand's auras (F4).
- **Missing supply that a fix should add:** none. Every supply flat is a specialization the build has finished, and a
  new cluster for it would be placed for the number.

Near-flat (11 to 15%), not in the table:

- caster-es's cold (+11%) and energy shield (+13%);
- mace-slam's and mace-shield's life (+11%, F7);
- curser's chaos (+11%);
- channeller's mana (+11%);
- block-caster's block (+13%);
- fire-burn's life (+13%);
- axe-bleed's axe (+14%).

## 3. One stat at a time, across the builds that share it (120 points; 160 in brackets)

| stat          | G0 (base2)                                                           | start                   | now                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| spell damage  | 70–126 (aura-brand 76, block-caster 70)                              | 128–260                 | **112–178**: dagger-caster 112, spell-totem 116, fire-burn 124, aura-brand 128, caster-life 154, block-caster 156, caster-es 158, storm 164, staff-block 172, channeller 178           |
| energy shield | 90–184 (+15 flat)                                                    | 148–249                 | 109–218: trap 109, block 123, curser 138, channeller 146, dagger-caster 166, caster-es 203, summoner 218, **wand-attack 218 (G0 130)**                                                 |
| armour        | sword 202, mace-slam 218, mace-shield 162, two-hand 234, sceptre 266 | 188, 326, 278, 378, 266 | 230, 242, 218, 290, 266                                                                                                                                                                |
| life          | strength 183–233; others 97–190                                      | strength 112–169        | **strength 100–141** (F7); others 90–189 (summoner 90, spell-totem 189)                                                                                                                |
| evasion       | 247–271                                                              | 252–340                 | **275–368** (F1)                                                                                                                                                                       |
| shield block  | mace-shield 55, block-caster 44                                      | 50, 18                  | 56, 24                                                                                                                                                                                 |
| spell block   | staff-block 4, block-caster 4 + 8 from a shield                      | 20; 6 + 8               | 28; 16 + 12                                                                                                                                                                            |
| attributes    | oversupplied                                                         | as G0                   | only storm-caster is short (strength 4) at 120. The main attribute is still oversupplied: Vanguard 213–290 strength, Strider 257–263 dexterity, Mystic 206–262 intelligence (§7.4, G5) |

## 4. Walks by hand (§15.2): the five whose numbers look worst, at 120 points

Each walk is the allocator's best 120-point plan, read node by node. (sceptre-fire was walked in round 1 and its case is
U2, accepted; staff-block's opening is in F2 and `staff-block.png`.)

### A. wand-attack (Mystic): wand damage finished, energy shield flat, 43% tax, nothing worth 2.5 left (`wand-attack.png`)

**The path:**

1. The Mystic's west road to Deft Wand (6), Warm Blood (6) and Glass Skin (7).
2. The Cloister: Quiet Pulse and Composure (13), Prism Ward (13).
3. The craft wheel: Wand Volley (14), Hale Scribe (18), Kept Vows (20).
4. The fire arm: Bright Wand (20), Hoarfrost (24), Cinder (24).
5. The rim: Pinpoint (25) and Needlework (28, seam 3).
6. Across into the Shade: Thick Blood (22), Quick Wrists (27), Barbed Point (27), Hoarded Breath (28), Keen Instinct
   (29), Shroud (29).
7. The Zealot's Lychway: Tomb Dust (28), High Veil (30), Rood Screen (33).

That is 86 Mystic, 25 Shade and 9 Zealot points, 52 of them worth nothing to the build.

**Chose:** all four wand clusters (100% of the wand supply), Needlework's attack speed and crit, and energy shield 218%
(G0 130%).

**Gave up:**

- Attack speed: 8.4 units, 22% of the network's.
- Forty more points buy the Strider's Hawk's Eye, Quick Hands, Hard Target, Long Breath and Elemental Fletching, the
  Shade's Grey Cloak and Quiet Shot, and the Mystic's Siphon and Thunderhead.
- None is worth 2.5 to it.

**Stretches with no choice, for this build:**

- the Lychway `cathedral.walk.road.n6`–`n3`, four road nodes to Rood Screen (Plainsong and Vespers branch off it, but
  are worth nothing to it);
- `spire.fire.rim.c`–`a`, three road nodes to High Veil.

**Notables nobody would take, taken as tolls:** Flashes of Insight (0), Cinder (0), Barbed Point (0.6).

**Verdict:** a coherent wand build whose late game is all road. F5.

### B. two-hand-fire (Vanguard): one plan at 60 and 120, fire attack flat (`two-hand-fire.png`)

**Chose:**

- **Armour, 290%:** Mortar and Stone (9), Guarded (9, Reaver), Verger (11, Zealot), Mended Mail (19), Ox Hide (20) and
  Tempered (27).
- **The two-handers:** Thunderstep (7), Greatweight (16), Headsman (19), Full Swing (21, Reaver) and Heavy Hands (24).
- **Fire attacks:** Ardour (13), Hallowed Hammer (14), Hearthfire (14), Elemental Edge (16), Hot Iron (23) and Bellows
  (23).
- **The Blood Rite keystone** (28).

That is 73 Vanguard, 27 Reaver and 20 Zealot points.

**Gave up:**

- Life, at 135%, +32% by 160.
- The rest of the fire-attack supply: Pitch Arrows (11 steps from the plan), Elemental Fletching and Kindled Steel (14).
- Forty more points buy Barrow Ward, Greatblade, Grave Host, Iron Voice, Second Wind, Thirsting Blade, Quickened Steel,
  Four Winds and Scarred Hide: life, armour and two-handed damage. Fire attack gains 0%.

**Stretch with no choice:** none. The Vanguard rampart and the Reaver's west road branch at every node.

**Notables nobody would take:** Scar Tissue (1.1), Unbroken (1.2), Quartermaster (1.0) and Ringing Blows (1.2), taken
as tolls on the way.

**Verdict:**

- A sensible two-handed fire striker that lives in three regions; its fire flat is U2's.
- The single plan is the yardstick's (F3: with the melee lines it has four near-equal plans).
- Greatweight and Headsman are both taken: the stun piling the Vanguard fixer flagged (V-4) is visible but small (stun
  duration 15 on each).

### C. curser (Shade): curses flat, 45% tax (start 36%) (`curser.png`)

**The path:**

1. Out of the Shade start to Hedge Magic (6, the Strider's) and Thick Blood (7).
2. The curse junction: Second Curse (10), Rotting Word (11), Shroud (12), Hoarded Breath (13).
3. Into the Mystic's craft: Kept Vows (13), Ready Wit (16), Hexwright (17), Keen Verse (21), Composure (23), Withering
   (25), Hoarfrost (27), Familiars (31), Living Verse (34).
4. Back on the Shade's Rooftops: Salt in the Wound (20), Grey Cloak (21), Ill Wish (29), Long Grudge (28), Thrown Voice
   (36).
5. The Zealot's crypt and Lychway: Glass Wall (34), Tomb Dust (36), Homily (38), Vespers (43).
6. High Veil (42).

That is 62 Shade, 38 Mystic and 18 Zealot points, 54 of them worth nothing to it, 38 of those road nodes.

**Chose:**

- **Every curse cluster within 30 steps:** Second Curse, Hexwright, Salt in the Wound, Ill Wish and Long Grudge.
- **The chaos clusters:** Rotting Word, Withering and Tomb Dust (90% of the chaos supply).
- **Spell damage in three regions:** Hedge Magic, Ready Wit, Salt, Keen Verse, Thrown Voice, Living Verse, Homily and
  Vespers.
- **Energy shield:** 138%.

**Gave up:**

- Bad Company (7 steps from the plan; minions with curses, 2.0).
- Marked Prey (20, the Reaver's Fosse, 4.0) and Grim Oath (24, the Vanguard, 3.5): the far curse twins, by design 20
  steps away.
- Forty more points buy energy shield (+56%): Glass Skin, Quickening, Deep Well, Quiet Pulse and Rood Screen.

**Stretch with no choice:**

- the Rooftops walk `knife.roofs.walk.r8`, `r9`, `r6`–`r3` (six road nodes); Salt, Grey Cloak, Glint and Ill Wish
  branch off it, so it is a road that earns its length (§7.3);
- the Lychway `cathedral.walk.road.n6`–`n4` and `spire.fire.rim.c`–`a` to Vespers and High Veil, whose branches it
  does not want.

**Notables nobody would take:** Quiet Shot (0, a bow notable on the Shade's road), Broad Weave (0), Familiars (1.0) and
Glass Wall (1.0), taken as tolls.

**Verdict:**

- The tax rose because the spell damage it wants is now a notable here and there, not a run of smalls (round 1's B1 fix
  working as intended). The curser walks 43 steps for Vespers.
- Its curses are flat by geography, which is the twin rule (§5.2) doing its job.
- This is G-growth §4's "tension by tax" risk to watch, not a fault to fix: the tax is spent on roads that carry other
  builds' clusters.

### D. storm-caster (Zealot): spell damage and lightning both flat (`storm-caster.png`)

**The path:**

1. Zeal (2), then Hymn (4).
2. Through Hymn's far small into the Mystic: Deep Well (11), Glass Skin and Quiet Pulse (12), Warm Blood (17), Living
   Verse (19).
3. Back into the Zealot's crypt: Familiars (22), Ready Wit (23), Shattering Rite (24), Tomb Dust (25), Homily (27),
   Plainsong (28), Vespers (32).
4. The Mystic's column and storm arm: Broad Weave, Darting Bolts, Prism Ward, Thunderhead (31), Piercing Word (34) and
   Live Current (40).
5. The Shade: Rotting Word (29), Thick Blood (30), Wiry Frame (33), Static Edge (33).

That is 70 Mystic, 35 Zealot and 15 Shade points.

**Chose:** spell damage 164%, four of the network's five lightning spell notables (Hymn, Thunderhead, Static Edge, Live
Current) and life 174%.

**Gave up:**

- Thunder Peal (13 steps from the plan; the Zealot's own lightning with mana and shock, 1.9: its mana partner is
  unweighed).
- Long Chant and Sharp Mind.
- Forty more points buy life and the Zealot's west (Stout Heart, Oathbound, Vigil, Warlord's Banner, Well Rounded) and
  Rood Screen.

**Stretch with no choice:** the Mystic's storm arm to Live Current, 40 steps out, one notable at its end.

**Notables nobody would take:** Flashes of Insight (0), Harsh Weather (0.3), Familiars, Broad Weave, Darting Bolts and
Rotting Word (1.0 each), as tolls.

**Verdict:**

- The Zealot storm caster is a Mystic build (F2): 50 of its first 60 points are the Mystic's, as at start.
- Its lightning is supply-finished because Hymn put one of the five lightning notables at 4 steps.
- The F2 trial brings its lightning back to +21% past 120.

### E. aura-brand (Zealot): auras and brands both flat

**The path:**

1. **The Zealot:**
   - Zeal (2), then Warlord's Banner (3, across the border), Hearthfire (8), Vigil and Choirmaster (11), Litany (14);
   - Lone Vow (17), Lectern (18), Brandwright (21), Benediction (22), Runecarver and Reliquary (28), Sigil Warden (30);
   - Glass Wall and Homily (33).
2. **The Mystic and the Shade:** Familiars (34), Living Verse (35), Quiet Pulse (42), Composure (46), Deep Well and
   Glass Skin (47–48), Ready Wit and Hale Scribe (53), Kept Vows (58), Thick Blood (60), Wiry Frame (63).

That is 62 Zealot, 45 Mystic, 10 Shade and 3 Vanguard points.

**Chose:**

- **Brands:** both brand clusters, Brandwright and Runecarver. They are the network's whole brand supply.
- **Auras:** Banner, Choirmaster, Benediction, Lectern and Kept Vows.
- **Both of its keystones,** Lone Vow and Sigil Warden.

**Gave up:**

- Procession (9 steps from the plan; aura with movement, 2.0: worth 4.0 before fix pass 1 took its life) and Battle Hymn
  (6; warcry with aura, 1.7).
- Forty more points buy energy shield and life: Warm Blood, Hoarded Breath, Shroud, Shelter, First Light and Oathbound.

**Stretch with no choice:** the climb from the crypt through the whole Mystic to Thick Blood, 60 steps from the start,
for energy shield and life.

**Notables nobody would take:** Sexton (minions with life, taken for its life), Reliquary (0.8), Familiars (0.8),
Flashes of Insight (0) and Glass Wall (1.0), as tolls.

**Verdict:**

- Its identity is finished by 120: brands are supply, two clusters by design. The auras left are paired with things it
  does not weigh, which is the partner rule working.
- Its late game is defence bought 40 to 60 steps away.
- Weighing movement (F4) would make Procession a real late pick.

## 5. What is good (keep it)

- **Spell damage and armour are back near G0** (fix pass 1's must). The casters now trade spell damage against energy
  shield and life: the tension the user's first example asked for.
  - caster-es leaves 56% of the network's spell damage untaken.
  - staff-block, block-caster and channeller climb in energy shield or life, not spell damage.
- **Targets 2 to 5 still hold or nearly hold:**
  - A mid-run build keeps its appetite: 54%, 11% flat.
  - Every build but one has at least one notable worth 2.5 left at 120.
  - 22 of 28 have three or more near-equal plans at 120.
  - Tax is 31%.
- **The seams work where both sides weigh them:**
  - Twofold Guard (seam 5) is in mace-shield's plan at 60 and block-caster's at 80.
  - Needlework (seam 3) is in wand-attack's, trap-mine's and dagger-crit's plans.
  - Bright Omen (seam 2) is in caster-life's, channeller's and dagger-caster's.
  - Hare's Pace (seam 4) is in seven, too many (F1).
  - Clean Break (seam 1) is the yardstick's blind spot (F3).
- **U3 worked.** The elemental archer's identity stat climbs +38% past 120 (it was flat at 0%), with Bright Shafts on
  the Quiver's wheel.
- **Notable concentration fell.** The most-taken notable is in 17 plans at 120 (G0 20), and the next three in 12, 12 and
  11 (G0 18, 18, 15).
- **The strength-side armour builds now climb in armour past 120:** mace-slam +32%, mace-shield +23%, two-hand-fire
  +22%.
- **The yardstick is much better.** 10 unweighed keys, from 35. The allocator pays for gear: only storm-caster is short,
  by 4 strength.
- **The G3 and fix-pass refusals to pad** (no third fire-attack cluster, no fifth wand, no sixth lightning) read
  correctly against this data: every supply flat is a finished specialization, not a missing one.

## 6. Round 1 follow-up (this subset)

| round 1 finding                                                | status             | now                                                                                                                                                                                                        |
| -------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1 must: the three spell clusters' smalls (and Composure)      | **fixed**          | Spell damage 112–178% at 120 (start 128–260, G0 70–126). Keen Verse is in 4 plans (was 7), Piercing Word 9, Living Verse and Composure 13: their notables remain common picks (F6).                        |
| B1 consider, taken as should: armour (Iron Voice, Mended Mail) | **fixed**          | Armour 218–290% (start 278–378), and it climbs past 120.                                                                                                                                                   |
| B2 should: the shield caster                                   | **partly**         | Seam 5 (Twofold Guard) is taken by 80. Spell block is 16 + 12 (start 6 + 8). Choice at 60/120 is 4/3 (start 1/2). But its block is 12 units (G0 22), shield block 24% (G0 44%), and +13% past 120.         |
| B3 should: the allocator pays for gear                         | **fixed**          | ba362b5. Only storm-caster is short (strength 4) at 120.                                                                                                                                                   |
| B4 should: weights that misjudge clusters                      | **mostly**         | 35 → 10 unweighed keys; `fn:*` fixed. Left: flasks and movement near zero, mana sustain for attackers, the dead `weaponDamage:<w>` and `curseArea` keys, and two-hand-fire's missing melee lines (F3, F4). |
| B5 should: unweighed keystones                                 | **mostly**         | 13 of 15 now weighed. Plated Hide and Living Ward are not (F4). Five weighed keystones are still in no plan, as trades.                                                                                    |
| B6 consider: weapons finished by 120, paid with life           | the user: U2       | Accepted. sceptre-fire is as in round 1; two-hand-fire's fire is flat, its life +32%.                                                                                                                      |
| B7 consider: the elemental bow                                 | **fixed** (U3)     | Elemental attack +38% past 120 (was 0%).                                                                                                                                                                   |
| B8 consider: per-stat report                                   | reported           | §3, F1, F7.                                                                                                                                                                                                |
| B9 consider: archetypes the set lacks                          | **not done**       | The fix brief §3 item 6 asked for them before this round. Spellsword, Marked Prey, Round Shield and Fencer's Eye are still in no plan (F4).                                                                |
| B10 consider: Footwork in six 60-point plans                   | U4's condition met | Footwork is in 7 of 8 dexterity 60-point plans; the Shade attackers still spend more of their first 60 in the Strider. The trade-offs report's T1 is the fix; the builds trial is in F1.                   |

## 7. Checklist of the CONSTRAINTS items in this subset

- **§1.1, tension as what more points would still buy: holds with exceptions.**
  - Target 1 fails (23%, 26% flat, 1 of 28 builds with every stat +20%) and moved back since start. Most of that is
    trades created by fix pass 1's correct re-lines (§2).
  - The real exceptions:
    - the evasion block (F1);
    - wand-attack, finished by 120 with nothing left it wants (F5);
    - storm-caster's lightning (F2);
    - the U2 builds, accepted.
- **§1.1, "one constraint among all the others": holds.** No finding asks for filler, a road or supply for a number.
  F1 and F2 take supply off or move a link; F3 and F4 are the yardstick.
- **§4.6, every region sells what most builds want: holds with exceptions.**
  - The Zealot's casters buy their first points in the Mystic (F2).
  - The Mystic sells no attack speed (F5).
- **§5.1 and §5.3, partners and generics: holds with exceptions.**
  - The near evasion is one destination (F1).
  - Thick Blood, Living Verse and Composure are common notables (F6, consider).
  - The B1 spell clusters are fixed.
- **§7.4, attributes against gear: holds.** Only storm-caster is short, by 4 strength. The main attribute is still
  oversupplied, as at G0 (G5).
- **§9.3, good late-build decisions: holds with exceptions.**
  - wand-attack, aura-brand and two-hand-fire spend their last 40 points on defence only.
  - Second keystones are now measured: 13 more weighed, two still unweighed (F4).
- **§12.3, balance as supply priced in units: holds.** The per-stat aim is met for spell damage and armour and missed
  for evasion (F1) and for strength-build life (F7, for the user).
- **§12.4, no incremental bot simulations: holds.** Only the static allocator and in-memory copies of it were run.
- **§14, no node placed for a number: holds for this report.**
  - Every proposed change names a player's reason or a cluster's stated partner.
  - The trials check the changes; they are not their reasons.
  - No new cluster is proposed for a flat curve.
- **§15.2, walks: done.** Five archetypes at 120 points (§4), with what each chose, gave up, stretches with no choice
  and tolls.
- **G-growth §0 (no power number) and §1 (one stat or a pair at a time): holds.** No total is given for any build.

## Appendix: every archetype's main stats, in units

G0 (`G0/builds-base2.json`) against now. In each cell: 60 → 100 points (the best 60-point plan grown), then 120 → 160 (the best 120-point plan grown). The header gives choice at 60/120 and tax at 120, G0 → now. Start (before fix pass 1) is in `G4/builds-start.txt`.

| archetype (choice 60/120, tax 120: G0 → now) | main stat                    | G0: 60 → 100 · 120 → 160  | now: 60 → 100 · 120 → 160 |
| -------------------------------------------- | ---------------------------- | ------------------------- | ------------------------- |
| caster-es (3/3, 37% → 2/4, 33%)              | spell damage                 | 15 → 19 · 21 → 21         | 14.8 → 21.3 · 24.8 → 35.3 |
|                                              | cold damage                  | 9.2 → 9.2 · 9.2 → 20.4    | 10.4 → 11.4 · 15 → 16.6   |
|                                              | energy shield                | 16 → 30.4 · 32.4 → 37.4   | 12.6 → 29 · 41.6 → 47.2   |
|                                              | cast speed                   | 4.5 → 7.8 · 11.3 → 13.3   | 9.8 → 11.8 · 8.8 → 12.8   |
| sword-str (2/2, 31% → 2/5, 30%)              | life                         | 21.2 → 32.8 · 38.8 → 52.2 | 11 → 17.6 · 24.2 → 37.2   |
|                                              | armour                       | 5.3 → 10 · 19.8 → 21.2    | 6.7 → 20.2 · 21.2 → 26.8  |
|                                              | sword damage                 | 21.9 → 29.1 · 27.9 → 32.3 | 22.8 → 26.8 · 31.8 → 36.8 |
|                                              | attack speed                 | 8.2 → 18 · 18.6 → 20.6    | 5.6 → 5.6 · 8.2 → 8.2     |
| mace-slam (4/2, 30% → 3/3, 26%)              | life                         | 24.8 → 37.2 · 46.6 → 52.6 | 14.6 → 24.2 · 28.2 → 31.2 |
|                                              | armour                       | 13.2 → 21.2 · 21.2 → 22.5 | 13.8 → 18.8 · 22.2 → 29.2 |
|                                              | two-handed mace damage       | 19 → 19 · 19 → 24.5       | 26 → 26 · 30 → 40.1       |
| mace-shield (2/2, 28% → 4/7, 23%)            | life                         | 23.2 → 37.2 · 41.8 → 54.2 | 15.6 → 21 · 28 → 31.2     |
|                                              | armour                       | 13.2 → 20.5 · 17.2 → 21.8 | 10.5 → 16.2 · 20.2 → 24.8 |
|                                              | block                        | 22.5 → 27.5 · 27.5 → 31.5 | 15.5 → 24 · 28 → 32       |
|                                              | mace damage                  | 3 → 9.7 · 14.2 → 14.2     | 4.7 → 8.7 · 12.1 → 21.1   |
| warcry-totem (1/4, 38% → 2/3, 37%)           | life                         | 23 → 29 · 44.8 → 54.2     | 13.6 → 18.6 · 23.6 → 32.6 |
|                                              | totem damage                 | 0 → 0 · 10.1 → 10.1       | 5.7 → 9.7 · 16.7 → 16.7   |
|                                              | warcries                     | 0 → 6.8 · 0 → 6.8         | 9.8 → 12.8 · 11.8 → 17.8  |
| spell-totem (4/7, 39% → 6/6, 35%)            | totem damage                 | 2 → 4 · 4 → 9             | 4 → 8 · 4 → 8             |
|                                              | spell damage                 | 3.3 → 15.8 · 20.8 → 22.8  | 15.5 → 21 · 22.5 → 31.5   |
|                                              | life                         | 27 → 28 · 26.4 → 34       | 16.6 → 27.4 · 38.8 → 39.8 |
| bow-crit (2/1, 19% → 3/4, 25%)               | life                         | 14 → 22.2 · 27.2 → 34.2   | 12.2 → 18.2 · 23 → 32     |
|                                              | evasion                      | 14.4 → 21.9 · 25.6 → 29.9 | 20.8 → 26.5 · 32.5 → 37   |
|                                              | bow damage                   | 19.2 → 29.8 · 29.8 → 32.4 | 17.4 → 31.6 · 32 → 39.6   |
|                                              | crit                         | 5.5 → 7.5 · 14.5 → 22.3   | 5.5 → 11.4 · 11.5 → 20.4  |
| bow-elemental (2/1, 25% → 2/2, 27%)          | life                         | 10 → 26.2 · 31.2 → 33.2   | 9.6 → 22 · 31 → 36        |
|                                              | evasion                      | 19.1 → 24.3 · 25.6 → 30.9 | 17.5 → 29 · 27.5 → 37.3   |
|                                              | elemental attack damage      | 6 → 6 · 10.4 → 18.4       | 8.4 → 10.4 · 10.4 → 14.4  |
|                                              | bow damage                   | 14.6 → 17.6 · 17.6 → 24.2 | 14.8 → 18.4 · 24 → 30     |
| bow-poison (1/1, 28% → 2/5, 27%)             | life                         | 16.8 → 27.4 · 32.2 → 38.8 | 9.6 → 24 · 32 → 33        |
|                                              | poison                       | 6 → 11 · 11 → 15.3        | 7.3 → 14 · 15 → 28        |
|                                              | bow damage                   | 5.2 → 11 · 15.6 → 21.2    | 6.6 → 7.6 · 13.2 → 17     |
| caster-life (2/5, 36% → 1/5, 30%)            | spell damage                 | 12.8 → 12.8 · 13.8 → 21.8 | 14.8 → 16.8 · 24.3 → 29.3 |
|                                              | elemental damage             | 10.2 → 16.2 · 16.2 → 19.6 | 13.2 → 24.4 · 27 → 32.6   |
|                                              | life                         | 12.4 → 26.4 · 34.4 → 35.4 | 10.8 → 26.2 · 25.4 → 36.8 |
|                                              | spell crit                   | 6.9 → 6.9 · 6.9 → 6.9     | 12.4 → 12.4 · 19.4 → 24.4 |
| summoner (1/1, 39% → 3/3, 40%)               | minions                      | 13 → 21.5 · 21.5 → 21.5   | 21.7 → 21.7 · 26.5 → 31.5 |
|                                              | energy shield                | 21.2 → 32 · 37.8 → 40.4   | 17 → 32.8 · 44.6 → 53.6   |
|                                              | life                         | 4.4 → 14.4 · 20.4 → 33    | 9.4 → 15 · 19 → 28.4      |
| wand-attack (1/2, 33% → 2/3, 43%)            | wand damage                  | 7.7 → 7.7 · 7.7 → 7.7     | 12.7 → 17.3 · 17.3 → 17.3 |
|                                              | energy shield                | 24 → 24 · 26 → 26         | 22.2 → 35 · 43.6 → 46.6   |
|                                              | attack speed                 | 6.4 → 16.2 · 16.2 → 20.8  | 2.4 → 4.4 · 8.4 → 14.4    |
| axe-bleed (3/7, 34% → 2/1, 34%)              | life                         | 17.8 → 29.2 · 36.6 → 47.6 | 13 → 17.6 · 24.2 → 35.8   |
|                                              | bleed                        | 11.5 → 14.8 · 22.3 → 25.3 | 18.5 → 28 · 28 → 28       |
|                                              | axe damage                   | 6.7 → 12.7 · 12.7 → 16    | 10.7 → 10.7 · 14 → 16     |
| dual-wield (1/3, 28% → 1/4, 25%)             | life                         | 25.2 → 29.2 · 33.2 → 46.8 | 15.2 → 19.8 · 29.2 → 34.6 |
|                                              | dual wield                   | 13.5 → 17 · 18 → 18       | 8.5 → 15 · 17 → 17        |
|                                              | evasion                      | 14.7 → 24.9 · 27.1 → 27.1 | 18.1 → 25.8 · 28.5 → 38.3 |
| fire-burn (6/7, 41% → 2/6, 38%)              | fire damage                  | 6 → 12.5 · 16.5 → 24.9    | 12.5 → 22.5 · 30.5 → 38.5 |
|                                              | spell damage                 | 0 → 5 · 14.5 → 15.8       | 13 → 20.5 · 15.5 → 20.5   |
|                                              | life                         | 29.8 → 39.2 · 39 → 41.6   | 19 → 25.4 · 34.4 → 38.8   |
| staff-block (3/10, 41% → 4/6, 31%)           | spell damage                 | 12 → 15.5 · 20.8 → 25.4   | 17.6 → 25.6 · 30.1 → 32.4 |
|                                              | block                        | 2.5 → 3.5 · 3.5 → 3.5     | 4 → 10.5 · 15.5 → 15.5    |
|                                              | life                         | 18.6 → 27 · 38 → 40       | 22.4 → 27.4 · 25 → 40.8   |
| aura-brand (1/3, 36% → 2/4, 32%)             | auras                        | 10.3 → 18.7 · 18.7 → 18.7 | 14.3 → 19.3 · 23 → 23     |
|                                              | brand damage                 | 11.7 → 15.4 · 17.2 → 23.4 | 22.5 → 22.5 · 26 → 27.3   |
|                                              | life                         | 8.4 → 20 · 30 → 33        | 9.6 → 24.6 · 33.4 → 43.4  |
| dagger-crit (1/2, 26% → 1/2, 21%)            | life                         | 13.6 → 20.8 · 25.8 → 30.8 | 12 → 25.4 · 24.4 → 31.4   |
|                                              | crit                         | 13.6 → 22.3 · 23.3 → 30.3 | 9.5 → 17.5 · 25.3 → 32.7  |
|                                              | dagger damage                | 3 → 6.6 · 6.6 → 6.6       | 4 → 4 · 9.6 → 13.2        |
|                                              | evasion                      | 19.9 → 26.8 · 26.8 → 31.1 | 26.5 → 31.4 · 36.7 → 40.2 |
| claw-poison (1/2, 34% → 2/3, 24%)            | life                         | 15.6 → 26.8 · 29.8 → 33.2 | 12.6 → 21 · 29.4 → 29.4   |
|                                              | poison                       | 11 → 15.3 · 16.7 → 16.7   | 7.3 → 14.7 · 17.5 → 25    |
|                                              | claw damage                  | 4 → 4 · 7.6 → 7.6         | 7 → 11.6 · 8 → 11.6       |
| trap-mine (1/2, 38% → 3/2, 33%)              | trap and mine damage         | 10 → 13.7 · 13.7 → 17.7   | 13.7 → 21.7 · 21.7 → 25.7 |
|                                              | energy shield                | 18.2 → 24.6 · 23.8 → 27.6 | 15 → 21.8 · 21.8 → 32     |
|                                              | evasion                      | 11.7 → 13.5 · 24.7 → 27   | 14 → 20.4 · 36.8 → 40.2   |
| dagger-caster (2/3, 43% → 3/7, 35%)          | spell damage                 | 10.5 → 22 · 23.3 → 23.3   | 21 → 28.5 · 31.5 → 43     |
|                                              | spell crit                   | 2 → 2 · 8.9 → 8.9         | 7 → 7 · 12.2 → 18.2       |
|                                              | energy shield                | 23.8 → 28.4 · 31.4 → 35.8 | 18.8 → 29 · 33.2 → 38.2   |
| two-hand-fire (4/4, 32% → 1/1, 30%)          | life                         | 23 → 38.2 · 42.2 → 50.2   | 16 → 23 · 27 → 35.6       |
|                                              | armour                       | 18.2 → 21.2 · 24.5 → 24.5 | 18.2 → 24.8 · 26.2 → 31.8 |
|                                              | fire attack damage           | 3 → 8.4 · 4 → 14.4        | 12 → 18.4 · 23.4 → 23.4   |
|                                              | two-handed damage            | 5.8 → 5.8 · 9.5 → 9.5     | 3.5 → 9.8 · 13.5 → 16.8   |
| block-caster (2/3, 37% → 4/3, 28%)           | block                        | 5 → 10.5 · 22 → 29        | 4 → 11 · 12 → 13.5        |
|                                              | spell block                  | 5 → 5 · 6 → 6             | 6 → 13 · 14 → 14          |
|                                              | spell damage                 | 8.8 → 8.8 · 8.8 → 10.8    | 12 → 18.3 · 19.5 → 20.8   |
|                                              | energy shield                | 17 → 21 · 19 → 20         | 11 → 23.6 · 25.6 → 41     |
| storm-caster (6/8, 42% → 3/4, 35%)           | spell damage                 | 11.8 → 13.1 · 17.8 → 19.1 | 14.2 → 21.7 · 24.2 → 26.7 |
|                                              | lightning damage             | 4.6 → 12.7 · 10 → 17.9    | 13.8 → 19.3 · 24.1 → 24.9 |
|                                              | life                         | 16 → 26 · 38 → 39.6       | 19.4 → 24.4 · 35.8 → 41.4 |
|                                              | cast speed                   | 3.5 → 4.8 · 9.3 → 11.5    | 4.8 → 11.8 · 9.8 → 12.8   |
| channeller (2/4, 32% → 3/4, 29%)             | channelling and spell damage | 8.8 → 12.8 · 16.8 → 18.8  | 12.3 → 24.3 · 31.3 → 33.3 |
|                                              | mana sustain                 | 23.8 → 32.3 · 32.3 → 42.8 | 23 → 31 · 25 → 27.8       |
|                                              | energy shield                | 18.4 → 24.6 · 31.2 → 32.2 | 14 → 22.6 · 30.2 → 46     |
| sceptre-fire (3/3, 32% → 2/3, 34%)           | life                         | 14 → 28.4 · 38.2 → 42.2   | 9 → 17 · 20 → 39.4        |
|                                              | fire attack damage           | 10 → 10 · 10 → 22.4       | 11 → 20 · 20 → 20         |
|                                              | sceptre damage               | 4 → 8.7 · 12.7 → 21.4     | 10.4 → 15.1 · 17.1 → 17.1 |
|                                              | armour                       | 14.5 → 20.5 · 25.8 → 25.8 | 17.5 → 22.2 · 24.2 → 24.2 |
| curser (1/1, 39% → 2/6, 45%)                 | curses                       | 11 → 11 · 11 → 17         | 18.5 → 18.5 · 22.5 → 22.5 |
|                                              | chaos and damage over time   | 7.3 → 12.3 · 12.3 → 12.3  | 6.7 → 12.9 · 14.7 → 16.3  |
|                                              | energy shield                | 17.8 → 29.2 · 32.2 → 32.2 | 12.4 → 26.2 · 28.6 → 44.6 |
| dodge-blades (2/1, 23% → 3/2, 18%)           | dodge                        | 5.7 → 10.3 · 10.3 → 17    | 4 → 17.3 · 19.3 → 26      |
|                                              | evasion                      | 21.9 → 24 · 25.6 → 29.9   | 21.5 → 35.2 · 36.7 → 40.2 |
|                                              | life                         | 13 → 25.8 · 26.8 → 30.8   | 13.6 → 22.4 · 25 → 31.4   |
|                                              | blade damage                 | 6 → 7 · 10.6 → 14.2       | 10 → 10 · 15 → 24.8       |
