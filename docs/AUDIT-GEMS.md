# Bob — Spirit audit of the gems against PoE 3.9.0

Status: **done 2026-10-08; corrected the same day (see the erratum); repaired by the plan in [SPIRIT.md](SPIRIT.md) and audited again at its end (second section)**. Read-only: no gem, engine or balance value was changed. It follows [COVERAGE.md](COVERAGE.md) and
[AUDIT-3.9.md](AUDIT-3.9.md) (which audited mechanics, not gems).

## Why

The coverage plan marked 325 of 326 mapped gems `covered` because each one "reproduced the defining mechanic", judged coarsely. The
user found that this had dumbed down some of the most interesting skills, and set the bar: **the numbers need not match, but
the spirit of the ability must be carried over.** The test case was Flicker Strike (`blinkingCut`). In PoE 3.9 it is a
teleport-strike with a 2 s cooldown that you can skip by spending a Frenzy Charge, plus a movement-speed buff: a skill for
**converting charges into burst and mobility**. Bob's port has the real numbers (damage 142 to 168%, mana 10, 15% charge chance, 10%
attack speed per charge) and the teleport, but it only _generates_ charges and attacks faster. The cooldown, the spend and the
buff are gone. **Numbers faithful, spirit gone**, and the coverage status never noticed.

## Method

1. A script joined, for each of the 326 mapped gems, the 3.9-era data (Path of Building v1.4.155: description, skill types, stat
   ids, level 1 and 20 values) with Bob's definition and the port note. 16 gems have no match in that data (renamed or later
   gems); the reviewers checked them against poedb, which shows current values, so those rows say so.
2. Seven reviewers (in parallel, read-only) each took a batch of 28 to 70 gems with one rubric: _why does a PoE player pick this gem, and
   what loop does it give them?_ Each gave one verdict, the PoE loop, what Bob's version does **in the engine** (a stat in a
   gem's mods only counts if `calc` or `sim` reads it), the missing engine primitives, a smallest repair and a confidence.
3. Verdicts: **faithful** (the same reason to use it; numbers and cosmetics differ), **drifted** (the niche partly survives; something
   that mattered is missing), **gutted** (what made it distinct is gone). Bob is an autobattler, so auto-use policies in place of
   manual timing and aiming are allowed if the loop survives.
4. I merged the seven files (326 rows, all ids unique, all verdicts valid) and grouped the missing primitives into the engine gaps
   below. I checked against the code the engine claims that carry the most weight (marked **checked** in the engine facts); the
   rest are the reviewers' readings.

**Read the verdicts as an informed first pass, not a finding of record.** They are model judgements: 113 high, 192 medium and 21 low confidence. No behaviour was run. A reviewer can be too hard
(it reads the PoE loop from memory) or too easy; the low and medium rows are where to look first if a verdict looks wrong.

## Result

|                                 | Faithful | Drifted | Gutted |   Total |
| ------------------------------- | -------: | ------: | -----: | ------: |
| Active skills, auras and curses |       82 |      95 |     27 |     204 |
| Support gems                    |       73 |      38 |     11 |     122 |
| **All**                         |  **155** | **133** | **38** | **326** |

So about **48% hold up**, 41% are blunted and 12% have lost what made them distinct. The user's worry was right, and the damage is
concentrated: most of it traces to a dozen missing pieces of engine (next section), not to 171 separate mistakes.

## Erratum (2026-10-08): the projectile rule

The first version of this audit said the shared projectile hit list (a target is hit once per use) was an engine gap that made
every shotgun and projectile-count support weak against bosses. **That was wrong for the reference game.** Asked to verify, I read
the 3.9 wiki through `npm run coverage:wiki`: the Split Arrow page says a single enemy cannot be hit by more than one projectile
of a bow attack fired together, the Ethereal Knives page says the same of its knives, and the Freezing Pulse history records the
2.0.0 change that removed shotgunning. The 3.9 data flags only two skills as able to shotgun (Shrapnel Ballista and Shattering
Steel), and Barrage and Barrage Support fire sequentially, so their projectiles can all hit one target. The rule Bob uses is right;
what it lacks is those exceptions. Nine rows were corrected (their text says so); Greater Multiple Projectiles became faithful.

**Lesson for the rest of the audit:** the accounts the reviewers gave of the reference game were partly from memory, and this one
was confidently wrong. The plan therefore reads the 3.9 wiki text for every gem before it is changed ([SPIRIT.md](SPIRIT.md) 4.2).

## Engine gaps, by how many gems each would repair

A gem is counted once per gap, and may appear under several. The grouping is by the reviewers' primitive names, matched by keyword,
so a count is approximate (give or take two). "Gutted" counts the gutted gems among the non-faithful ones.

| Gap                                                                            | Gems | Gutted |
| ------------------------------------------------------------------------------ | ---: | -----: |
| An enemy status layer: slow, maim, blind, hinder, exposure, vulnerability      |   28 |      7 |
| Ground effects and lingering objects                                           |   22 |      3 |
| Skill damage over time, and ailment spread                                     |   18 |      2 |
| Projectile rules: sequential volleys, shotgun skills, parallel, split and nova |   17 |      6 |
| Channelling: ramp, stages and a release                                        |   16 |      4 |
| Exerted attacks, retaliation windows, self-buffs on use                        |   16 |      6 |
| Skill cooldowns, and spending charges                                          |   15 |      6 |
| Blink and travel effects                                                       |    9 |      2 |
| Self-cast curses, and the hex slot                                             |    9 |      1 |
| Stances, absorb pools, rage                                                    |    9 |      4 |
| Minion buffs and commands                                                      |    9 |      2 |
| Deployables that can be hit or that interact                                   |    9 |      1 |
| Corpses                                                                        |    8 |      3 |

### An enemy status layer: slow, maim, blind, hinder, exposure, vulnerability

The engine has no maim and no blind, and no general "enemy takes more damage" or slow debuff that a skill can apply on hit. Bear Trap, Ensnaring Arrow, Wither, Hamstring, the Standards and a dozen curses lean on these.

**Gems (28):** Withering Breath (Blight); Cinder Blow (Infernal Blow) ✗; Rime Core (Frost Bomb); Searing Lance (Scorching Ray); Snare Shot (Ensnaring Arrow) ✗; Venom Shower (Toxic Rain); Tide of Judgement (Wave of Conviction); Rot Touch (Wither) ✗; Void Curse (Despair); Plenty Sigil (Poacher's Mark); Warlord Sigil (Warlord's Mark); Kindled Bellow (Infernal Cry) ✗; Standard of Valour (War Banner); Standard of Dread (Dread Banner); Rotting Stride (Withering Step); Jaws Trap (Bear Trap) ✗; Mortar Charge (Pyroclast Mine); Smoke Charge (Smoke Mine) ✗; Stone Stance (Flesh and Stone) ✗; Leaden Limbs (Temporal Chains); Open Wounds (Vulnerability); Deep Chill (Bonechill); Wither Mark (Withering Touch); Charged Breath (Infused Channelling Support); Dazzle (Blind Support); Rout (Chance to Flee Support); Hamstring (Maim Support); Elemental Pack (Elemental Army Support). _✗ = gutted._

### Ground effects and lingering objects

Burning, chilled or consecrated ground, walls, placed Standards, orbs that sit and pulse: skills whose point is the thing left behind have only the hit left. (Monsters already have ground hazards, `hazardAt`; the player side has none.)

**Gems (22):** Orbiting Blades (Blade Vortex); Whirlwind Cleave (Bladestorm) ✗; Torch Arrow (Burning Arrow); Acid Arrow (Caustic Arrow); Sudden Frost (Cold Snap) ✗; Pyre Burst (Cremation); Faultline (Earthquake); Rime Core (Frost Bomb); Searing Lance (Scorching Ray); Glacier Wall (Frost Wall); Cleansing Blaze (Purifying Flame); Magma Crack (Tectonic Slam); Venom Shower (Toxic Rain); Hoarfrost Mote (Winter Orb) ✗; Standard of Valour (War Banner); Standard of Dread (Dread Banner); Cinder Step (Flame Dash); Rime Step (Frostblink); Blessed Trail (Consecrated Path); Fervent Halo (Zealotry); Rimeplate (Arctic Armour); Twin Shadow (Mirage Archer Support). _✗ = gutted._

### Skill damage over time, and ailment spread

Only ignite, bleed and poison exist as damage over time. Contagion, Blight, Caustic Arrow and Essence Drain are fast hits or poison; leech never reaches DoT ticks; Elemental Proliferation and Wildfire-style spread are missing.

**Gems (18):** Orbiting Blades (Blade Vortex); Withering Breath (Blight); Torch Arrow (Burning Arrow); Acid Arrow (Caustic Arrow); Creeping Plague (Contagion); Primal Strike (Elemental Hit); Fuse Arrow (Explosive Arrow); Sap Bolt (Essence Drain); Venom Strike (Pestilent Strike); Searing Lance (Scorching Ray); Void Curse (Despair); Ruin Ritual (Bane) ✗; Cinder Bond (Searing Bond); Open Wounds (Vulnerability); Slow Rot (Decay); Wildfire Spread (Elemental Proliferation) ✗; Foul Brew (Vile Toxins); Wildfire Seed (Ignite Proliferation Support). _✗ = gutted._

### Projectile rules: sequential volleys, shotgun skills, parallel, split and nova

The once-per-target rule for simultaneous projectiles is the reference game's (the 3.9 wiki says a single enemy cannot be hit by more than one projectile of a bow attack fired together; shotgunning was removed in 2.0.0). What is missing is its exceptions and the shapes around it: Barrage and Barrage Support fire sequentially, so their projectiles can all hit one target; Shrapnel Ballista and Shattering Steel are flagged to shotgun; Volley fires in parallel lanes; Arrow Nova lands and bursts in a ring; Tornado Shot splits at the end of its flight; Fork splits on the first hit. `chains` is read only by skills with chain behaviour, so Chain Support does nothing on a projectile skill. Hybrid strike-then-projectiles skills are pure projectile fans.

**Gems (17):** Quiver Rush (Barrage) ✗; Rime Splinter (Frost Blades); Bolt Cleave (Lightning Strike); Slag Blow (Molten Strike); Tempest Mote (Orb of Storms); Splinter Volley (Shattering Steel); Ghost Shard (Spectral Shield Throw); Whirl Shot (Tornado Shot); Prime Splash (Wild Strike) ✗; Hoarfrost Mote (Winter Orb) ✗; Scatter Bow (Shrapnel Ballista); Ricochet (Chain) ✗; Split Shot (Fork); Wide Salvo (Greater Volley); Arrow Tempest (Arrow Nova) ✗; Twin Salvo (Volley); Rolling Volleys (Barrage Support) ✗. _✗ = gutted._

### Channelling: ramp, stages and a release

`channelling` is a tag that nothing reads except the ailment keyword mask (`src/calc/skill.ts`). Every channelled or ramping skill is a flat repeated hit: no commitment, no build-up, no release.

**Gems (16):** Flurry of Edges (Blade Flurry) ✗; Withering Breath (Blight); Judgement Tempest (Divine Ire) ✗; Furnace Roar (Flameblast) ✗; Blaze Stream (Incinerate); Sweeping Cut (Reave); Searing Lance (Scorching Ray); Blight Hail (Scourge Arrow); Thunder Spiral (Storm Burst); Hoarfrost Mote (Winter Orb) ✗; Standard of Valour (War Banner); Standard of Dread (Dread Banner); Twister Blade (Cyclone); Storm Rush (Charged Dash); Triple Cadence (Multistrike); Double Release (Unleash Support). _✗ = gutted._

### Exerted attacks, retaliation windows, self-buffs on use

There is no "next N attacks are empowered" state, no "usable only after a block" gate, and no short self-buff granted by using a skill. Warcries, the retaliation skills and several Heralds are flattened without them.

**Gems (16):** Creeping Plague (Contagion); Tempest Mote (Orb of Storms); Venom Strike (Pestilent Strike); Charged Blow (Static Strike) ✗; Anvil Drop (Crushing Fist) ✗; Rime Rebuke (Glacial Shield Swipe) ✗; Blade Wind (Swordstorm) ✗; Penance (Punishment); Kindled Bellow (Infernal Cry) ✗; Surge of Blood (Blood Rage); Blinking Cut (Flicker Strike) ✗; Thunder Rebuke (Smite); Fervent Halo (Zealotry); Cinder Herald (Herald of Ash); Storm Herald (Herald of Thunder); Charged Breath (Infused Channelling Support). _✗ = gutted._

### Skill cooldowns, and spending charges

No gem can have a cooldown (`ActiveGemDef` has no field and `resolveActive` never sets one; only utility skills carry one), and charges can only be gained (`src/sim/charges.ts` has `gainCharge` and `tickCharges`, nothing that spends). That removes the "convert charges into burst or mobility" niche from every skill that had it (Flicker Strike, Cold Snap, Vigilant Strike, Discharge, Immortal Call, Phase Run).

**Gems (15):** Sudden Frost (Cold Snap) ✗; Anvil Drop (Crushing Fist) ✗; Rime Rebuke (Glacial Shield Swipe) ✗; Blade Wind (Swordstorm) ✗; Magma Crack (Tectonic Slam); Guarded Strike (Vigilant Strike); Deathless Call (Immortal Call); Cinder Step (Flame Dash); Rime Step (Frostblink); Slipstream Run (Phase Run); Blinking Cut (Flicker Strike) ✗; Charge Release (Discharge); Dune Stance (Blood and Sand) ✗; Sour Herald (Herald of Agony); Swift Snares (Advanced Traps Support). _✗ = gutted._

### Blink and travel effects

Every blink is the same gap-closing jump (`applyUtility`, `src/sim/utility.ts`): no damage on arrival, no ground left behind, no corpse, no swap, no delay.

**Gems (9):** Cinder Step (Flame Dash); Rime Step (Frostblink); Bolt Step (Lightning Warp); Shadow Swap (Bodyswap) ✗; Slipstream Run (Phase Run); Rotting Stride (Withering Step); Smoke Charge (Smoke Mine) ✗; Shadow Quiver (Blink Arrow); Veil Cut (Nightblade Support). _✗ = gutted._

### Self-cast curses, and the hex slot

Four hex gems (Brittle Doom, Leaden Limbs, Feeble Grip, Open Wounds) are never cast: only Hexing Strikes on the primary skill uses them. The hex-on-hit supports share `BASE_HEX_LIMIT` (1) with real curses.

**Gems (9):** Ruin Ritual (Bane) ✗; Brittle Doom (Elemental Weakness); Leaden Limbs (Temporal Chains); Feeble Grip (Enfeeble); Open Wounds (Vulnerability); Dazzle (Blind Support); Rout (Chance to Flee Support); Hamstring (Maim Support); Standing Curse (Blasphemy Support). _✗ = gutted._

### Stances, absorb pools, rage

No toggle or stance state, no absorb-then-release pool (Molten Shell), rage exists but nothing needs or spends it, and guards do not share cooldowns.

**Gems (9):** Whirlwind Cleave (Bladestorm) ✗; Tempest Mote (Orb of Storms); Spear Burst (Perforate); Slag Carapace (Molten Shell) ✗; Deathless Call (Immortal Call); Rampage Call (Berserk); Dune Stance (Blood and Sand) ✗; Stone Stance (Flesh and Stone) ✗; Warding Pack (Meat Shield Support). _✗ = gutted._

### Minion buffs and commands

Offerings and golem buffs apply to the character (always on, alive or not), minions ignore flat added damage, and there are no minion commands or gear.

**Gems (9):** Carrion Colossus (Summon Carrion Golem); Wake Sentinel (Animate Guardian) ✗; Bone Ward Rite (Bone Offering); Flesh Surge Rite (Flesh Offering); Spirit Ward Rite (Spirit Offering); Sour Herald (Herald of Agony); Warding Pack (Meat Shield Support); Elemental Pack (Elemental Army Support); Burning Pack (Infernal Legion Support) ✗. _✗ = gutted._

### Deployables that can be hit or that interact

Totems, traps and mines are plain structs, not actors, so monsters cannot target them: decoys, taunts and killable totems are impossible. Mines all auto-detonate at 3.5 tiles.

**Gems (9):** Cinder Bond (Searing Bond); Guardian Cairn (Ancestral Protector); Slamming Cairn (Ancestral Warchief); Lure Totem (Decoy Totem) ✗; Mortar Charge (Pyroclast Mine); Whirring Motes (Summon Skitterbots); Chained Charges (Blastchain Mine Support); Heavy Charge (High-Impact Mine Support); Swift Snares (Advanced Traps Support). _✗ = gutted._

### Corpses

Corpses are not objects in the sim, so the corpse skills and Offerings are reduced to stat buffs or generic summons. (The coverage plan left corpse skills out on purpose, but several gems stand in for them anyway.)

**Gems (8):** Pyre Burst (Cremation); Shadow Swap (Bodyswap) ✗; Bind Shade (Raise Spectre) ✗; Wake Blades (Animate Weapon); Wake Sentinel (Animate Guardian) ✗; Bone Ward Rite (Bone Offering); Flesh Surge Rite (Flesh Offering); Spirit Ward Rite (Spirit Offering). _✗ = gutted._

### Gem-specific gaps

46 further non-faithful gems need something particular to themselves (a conditional bonus, a weapon rule, a per-stack scaling, a stat the engine lacks); see each gem's "Missing" line below.

## Engine facts the reviewers found

These came up while checking what the gems actually do. Items marked **checked** I confirmed in the code; the rest are a reviewer's reading and should be confirmed before relying on them.

**Gems that do nothing or less than their text says (cheap to fix, and worth fixing first):**

- **Cast on Melee Kill (`slayersEcho`) never casts.** It supports melee skills, and a trigger only links _spells_, so its list is empty; it only multiplies the melee skill's cost by 1.4. _(reviewer's reading)_
- **Multistrike (`tripleCadence`) loses its second echo.** An echo lands at `(HIT_AT + ECHO_GAP·(n+1))` of the use time: 0.85 for the first, 1.1 for the second, after the action ends. **Checked** in `src/sim/actions.ts`; the sim lands 2 hits where the calc sheet counts 3.
- **Four curses are uncastable** (Brittle Doom, Leaden Limbs, Feeble Grip, Open Wounds): the old `hex` kind, usable only through Hexing Strikes. **Checked** (the only readers are `character.ts:992` and the loot code).
- **Chain Support (`ricochet`) is inert** except on the few chain-native skills. **Checked**: `chains` is only consumed inside the chain behaviour.
- **Dual Strike (`twinBlades`)** hits with one weapon per use in the sim, so about half the sheet's damage. _(reviewer)_
- **Port notes that claim more than the code does:** Shield Charge "hits harder the farther it ran" (a flat 50% more), Wild Strike "fires projectiles from the target" (plain melee), Gouge Shot's 8 s bleed (base 5 s), Spirit Saw returns energy shield (no stat does), Ghost Shard scales with shield defences (flat added damage), Ensnaring Arrow chills (nothing chills), and Slow Rot, Vile Toxins and Frost Fang, which the notes say scale per stack or charge but do not. _(reviewers)_
- **Barrage (`quiverRush`)**: the join file showed Barrage _Support_ next to Bob's active gem, so that row was judged from memory. _(see its row)_

**Engine behaviour that shapes many gems:**

- Charges can only be gained; gems have no cooldown. **Checked.**
- The shared projectile hit list (`useHits`) matches the reference game for simultaneous projectiles (see the erratum above); calc DPS ignores projectile count, which is right for the once-per-target rule and wrong for sequential volleys and the two shotgun skills. **Checked.**
- No maim, no blind, no skill damage over time. **Checked** (`maim` and `blind` do not appear in `src/sim` or `src/calc`).
- Channelling is a tag only. **Checked.**
- Totems, traps and mines are not actors. _(reviewer)_
- Target conditions (`targetIgnited`, `targetChilled`) are read for the primary target and applied to every enemy an area hits; a deployed shot reads them against the player. _(reviewer)_
- Duration is mostly inert in the sim (ground zones; curses at a fixed 6 s). _(reviewer)_
- Kill triggers fire on any monster death, not only the player's kills. _(reviewer)_
- Self-burn (the Righteous Fire analog) drains `life` directly, bypassing fire resistance and energy shield, which were the whole defensive axis. _(reviewer)_
- A mark's bonuses apply whenever the target has any hex. _(reviewer)_
- Utility cooldowns are per skill; guards, warcries and blinks do not share them. _(reviewer)_

## Suggested order of repair

Advice, not a plan: it needs the user's say on scope.

1. **The cheap bugs above** (Cast on Melee Kill, the Multistrike echo, castable curses, Chain, Dual Strike's off hand, the overclaiming notes). Mostly data or a line of code; no new systems.
2. **Cooldowns plus a spend-charges effect.** One primitive repairs Flicker Strike, Cold Snap, Vigilant Strike, Discharge, Immortal Call and Phase Run, and it matches the user's example directly. Then a **self-buff granted by using a skill** (Flicker's movement speed).
3. **Projectile shapes and exceptions** (Barrage's sequential volleys, the two shotgun skills, Volley's parallel lanes, Arrow Nova, Tornado Shot, Fork and Chain). The once-per-target rule itself stays.
4. **Channelling as ramp and release** (Cyclone, Flameblast, Blade Flurry, Winter Orb and the rest), the largest block of gutted skills.
5. **An enemy status layer** (slow, maim, blind, exposure, vulnerability): unlocks the trap, curse, Standard and arrow skills together.
6. **Ground effects on the player side**, then corpses, then minion commands. Each is a larger system with fewer gems.

Each gem's "Repair" line says the smallest change its reviewer saw. Any repair that changes damage or defence moves the balance the bot sample measured, so each batch would need the usual end-of-batch check.

## Gutted gems (38)

**Quiver Rush** (Barrage) · active · confidence medium

- PoE: Barrage (the active gem) makes a short preparation, then fires its projectiles one after another (40% of base damage each, small random spread of about 20 degrees); because they are sequential, they can all strike the same target, which is the skill (big single-target damage up close). (Row corrected after checking the 3.9 wiki; see the erratum.)
- Bob: A tight fan of 5 arrows fired together at 60-72% each. A use hits each target once, so it plays as a second Split Volley.
- Missing: `sequential_volleys`, `attack_time_per_projectile`
- Repair: Fire the volleys in sequence, each with its own hit list, at the gem's per-volley damage.

**Flurry of Edges** (Blade Flurry) · active · confidence medium

- PoE: Channelled dagger/claw/sword flurry that stacks up damage while you hold it, then releases extra hits per stage when you stop; the build-up and release is the loop.
- Bob: A plain melee area arc (120 degrees, radius 1.8) at an averaged 90-126% per hit, with the channelling tag inert in the engine. Both the stack-up and the release hits are gone, so what is left is a wide fast arc without the ramp-and-release trade; no weapon restriction either.
- Missing: `channel_ramp`, `channel_release`
- Repair: Give an area melee skill a stage counter that grows damage per consecutive use and pays out extra hits on a reset (stand-in for channel then release).

**Whirlwind Cleave** (Bladestorm) · active · confidence medium

- PoE: A spin attack that leaves a bladestorm on the ground; in Blood Stance the storm stays and gives you attack speed while you fight inside it, in Sand Stance it drifts forward and speeds you up. The storm and stance are the skill.
- Bob: A self-centred burst (radius 2.2) at 105-120%: a basic spin attack. The storm, the stance and the buffs are all gone (the port note says so).
- Missing: `ground_effect`, `self_buff_in_zone`, `stance_toggle`
- Repair: Spawn a ground zone (the engine's ground behaviour already pulses) at the character on use, and give the character an attack-speed buff while inside it; stances can be one mode.

**Sudden Frost** (Cold Snap) · active · confidence high

- PoE: A cold burst plus chilling ground with a 3 s cooldown that you skip by spending a Frenzy Charge, and enemies dying in the ground may grant Frenzy Charges. The charge loop (kill, gain, spend to recast) is the niche.
- Bob: A plain cold burst at the target (radius 2.2, 140% effectiveness) with more chill. No cooldown (the gem def has no cooldown field; SkillDef.cooldown is never set from gems, only the generic secondary rule applies), no charge spending, no charge gain on kills in the area, and no cold ground DoT. Bob does have a Fervour charge kind and chargeOn.kill hooks that could carry this.
- Missing: `skill_cooldown`, `cooldown_bypass`, `spend_charges_for_effect`, `charge_on_kill_in_area`, `ground_effect`
- Repair: Add a data cooldown to gems plus a spend-a-charge bypass in the cooldown check, and a kill-in-zone charge gain tied to the zone the skill leaves.

**Judgement Tempest** (Divine Ire) · active · confidence medium

- PoE: Channel to build stages, zapping nearby enemies as you do, then release a powerful lightning beam; ramp and release is the loop.
- Bob: A self-centred burst (radius 3) every 0.25 s at 45% effectiveness, half physical converted to lightning, with the channelling tag inert. The stage build-up and the release beam are both absent, so it is a fast lightning nova.
- Missing: `channel_ramp`, `channel_release`
- Repair: Add a stage counter that grows with hits and, after a lull or at a cap, fires one large beam at the target (stand-in for release).

**Furnace Roar** (Flameblast) · active · confidence medium

- PoE: Channel up to 10 stages to build one huge, wide fire explosion released when you stop; commitment (standing and charging) for a big boom is the whole identity.
- Bob: A self-centred fire burst (radius 3.2) every 0.5 s at 110% effectiveness with 15% ignite. There is no charge-up, no growing radius or damage, no release; it is a fast fire nova.
- Missing: `channel_ramp`, `channel_release`, `area_grows_with_stage`
- Repair: Add a charge-up where consecutive uses on the same position stack stages (radius and damage) and a single big burst fires after N stages or on a lull.

**Cinder Blow** (Infernal Blow) · active · confidence high

- PoE: A fire strike that stacks a charged debuff on the target (6 stacks or expiry or death detonates it for AoE damage), and every debuffed enemy explodes on death; you pick it to turn single-target hits into delayed area bursts.
- Bob: A plain melee strike, 50% fire conversion plus a flat 20% more damage; nothing is stacked or detonated (the 'area' tag has no area behind it, behaviour is single-target melee).
- Missing: `debuff_stack_detonate`, `explode_on_death`, `aoe_from_single_target_hit`
- Repair: Add a per-target hit-stack debuff that detonates as an area burst at N stacks, on expiry and on death (the sim already has kill triggers and per-target ailment lists to hang it on), and drop the flat +20% more.

**Charged Blow** (Static Strike) · active · confidence high

- PoE: Hit an enemy to gain a 4 s buff, stackable to three, during which beams automatically zap several nearby enemies every ~0.4 s (stronger while you move); you pick it for the persistent AoE aura after a strike.
- Bob: A plain melee strike with 60% lightning conversion and a flat +30% more damage; no buff, no zaps, no area (single-target melee behaviour).
- Missing: `self_buff_on_use`, `periodic_aoe_pulse_while_buffed`, `buff_stacks_increase_rate`
- Repair: On hit, grant a timed stacking self buff that makes the character fire a lightning pulse at nearby enemies on an interval (rate per stack), and remove the flat more-damage.

**Anvil Drop** (Crushing Fist) · active · confidence high

- PoE: (From poedb, current version; no PoB data.) A retaliation skill: it can only be used for 2 s after you block a hit, then slams a giant fist for enormous area damage on a 4 s cooldown.
- Bob: A free-use mace/axe/staff slam at 150-190% with a stun duration bonus (not part of the original); the block-gated retaliation and its huge payoff are gone, so it is a generic slam spammed at will.
- Missing: `retaliation_after_block_window`, `skill_cooldown`, `usable_only_when_condition`
- Repair: Gate the skill on a 2 s window opened by a successful block (the sim has block events and triggers) with a cooldown, and give it the big retaliation multiplier.

**Snare Shot** (Ensnaring Arrow) · active · confidence high

- PoE: An arrow that tethers the enemy to the ground behind it: the enemy is slowed, takes increased projectile and attack damage, and must stay within the area or the snare breaks.
- Bob: A plain bow projectile with +15% more damage only when the target is already chilled. The arrow is physical and nothing in the gem chills, so the condition is almost never true (the port note's 'slows by chilling' is not implemented).
- Missing: `apply_slow_debuff_on_hit`, `target_damage_taken_debuff`, `tether`
- Repair: Apply a movement slow and a damage-taken increase to the hit target for a few seconds (the chill slow mechanism can be set directly) and drop the chilled-target condition.

**Rime Rebuke** (Glacial Shield Swipe) · active · confidence high

- PoE: (From poedb, current version; no PoB data.) A shield retaliation: usable for 2 s after a block, sweeps a cone of ice, 100% cold, and always freezes, with off-hand damage scaled by the shield's defences; 3.5 s cooldown.
- Bob: A free-use shield swipe with only 50% cold conversion and a 20% freeze chance; the block-gated retaliation, guaranteed freeze and shield scaling are all gone.
- Missing: `retaliation_after_block_window`, `always_freeze`, `damage_from_shield_defences`, `skill_cooldown`
- Repair: Gate on a post-block window with a 3.5 s cooldown, convert 100% to cold with guaranteed freeze, and scale damage with shield defences.

**Blade Wind** (Swordstorm) · active · confidence high

- PoE: (From poedb, current version; no PoB data.) A dual-wield retaliation: usable for 2 s after a block, it rains blades in front eight times, each with both weapons' damage combined, on a 3 s cooldown.
- Bob: A free-use self-centred burst that echoes once (repeats:1), usable with one weapon of sword, axe or mace; no block gate, no dual-wield requirement (the engine supports needsDualWield) and no eight-hit barrage.
- Missing: `retaliation_after_block_window`, `skill_cooldown`, `dual_wield_requirement`, `multi_hit_sequence`
- Repair: Gate on a post-block window with a 3 s cooldown, require dual wielding, and land several hits with both weapons.

**Prime Splash** (Wild Strike) · active · confidence medium

- PoE: Melee strike converting all physical to a random element per use; depending on the element it also releases a fire explosion, an arcing lightning bolt, or an icy wave.
- Bob: Melee single-target hit with 'noPhysicalDamage' (calc/skill.ts filters out phys chunks, so the weapon's damage is discarded) and flat added fire damage, plus 15% each ignite/freeze/shock chance. No random element, no conversion of weapon damage, and the 'projectile' tag adds nothing: no explosion, arc or wave is fired (behaviour is plain melee).
- Missing: `random_element_per_use`, `convert_all_phys_to_element`, `secondary_effect_on_hit`, `projectile_split`
- Repair: Roll an element per use (hit-level conversion of 100% phys to it) and fire a follow-up area / chain / cone for that element from the target.

**Hoarfrost Mote** (Winter Orb) · active · confidence medium

- PoE: Channelled orb above you that pelts the ground with cold projectiles; channelling builds stages (more duration/fire rate) that decay when you stop - commit-to-ramp skill.
- Bob: A plain 'burst' nova around the caster at 45% effectiveness, 0.3 s cast, chill. 'channelling' is only a tag in calc/skill.ts (no ramp state); nothing builds up, no orb, no projectiles.
- Missing: `channel_ramp`, `persistent_summoned_orb`, `projectile_from_origin`
- Repair: Add a channel_ramp primitive (stages that rise per use and decay after a gap) that scales hit rate/damage, and use it here.

**Rot Touch** (Wither) · active · confidence high

- PoE: A channelled debuff cloud that deals no damage: slows enemies and stacks Withered (up to 15, each +chaos damage taken), amplifying your other chaos skills.
- Bob: A damaging chaos spell burst around the caster (30% effectiveness) with +20 chaos penetration on its own hits only. No enemy debuff, no stacking, no benefit to any other skill; it is a primary chaos nova, the opposite of Wither's support role.
- Missing: `stacking_debuff_on_enemy`, `damage_taken_increase_debuff`, `utility_cast_no_damage`, `slow_debuff`
- Repair: Make it a utility skill (policy upkeep) that applies a stacking 'withered' status on enemies in range (+chaos damage taken per stack, max 15) via the hex/status layer.

**Ruin Ritual** (Bane) · active · confidence high

- PoE: A chaos damage-over-time debuff that also applies your linked curses to enemies in the area, growing stronger and longer for each curse applied (curse spreader/DoT).
- Bob: rotBane hex: -12..-21% chaos res and increased damage taken. No DoT, no linking of other curses, no scaling per curse; it is a generic curse.
- Missing: `damage_over_time_stacking`, `apply_linked_curses`, `scale_per_curse_applied`
- Repair: Give it an actual chaos DoT on enemies in radius and let it re-apply the character's other cast hexes (scaling DoT per hex applied).

**Kindled Bellow** (Infernal Cry) · active · confidence medium

- PoE: No PoB data; memory plus poedb (current values, 3.9 similar): warcry that exerts your next attacks (Combust: fire area hit on the first hit of each exerted attack), converts phys to fire scaling with enemy power, and makes enemies explode on death.
- Bob: Plain timed buff (8 s, cd 8): 25..40% more attack damage and 20% ignite chance. No exert counter, no Combust, no death explosion, no fire conversion.
- Missing: `exert_next_attacks`, `extra_hit_on_exerted_attack`, `death_explosion_debuff`
- Repair: Add an exert_next_attacks primitive (counter of N attacks that get more damage plus an extra fire area hit) and use it for the warcry family.

**Slag Carapace** (Molten Shell) · active · confidence high

- PoE: Guard that adds armour and absorbs damage, then explodes dealing fire damage to nearby enemies based on the damage it absorbed; the reflect is the point.
- Bob: Same as Iron Hide: hitTaken more -25..-40 for 4 s, cd 6 (buff moltenGuard). No armour, no absorb pool, no reflected/exploding damage; the 'fire' flavour does nothing.
- Missing: `absorb_pool`, `damage_burst_from_absorbed`, `armour_buff`
- Repair: Track damage absorbed by the guard in a pool and, at expiry or depletion, deal a fire burst around the player scaled by it.

**Shadow Swap** (Bodyswap) · active · confidence high

- PoE: Swap places with a targeted enemy or corpse, damaging at both ends; if a corpse, it explodes (corpse-driven mobility/damage).
- Bob: Same blink as Dash (distance 8, cd 3). No swap with the target, no corpse, no damage; the port note admits both are dropped.
- Missing: `consume_corpse`, `swap_positions`, `damage_on_blink`
- Repair: Needs a corpse consumable: swap the player with a corpse or enemy and deal area damage at both points, exploding the corpse.

**Blinking Cut** (Flicker Strike) · active · confidence high

- PoE: Teleport-strike with a 2 s cooldown that can be bypassed by spending a Frenzy Charge, plus a movement-speed buff; charges become burst and mobility.
- Bob: Attack with travel 8, 142..168% damage, 15% chance on hit to gain Fervour and +10% more attack speed per Fervour charge (both real via chargeOn.hit and 'per' charges.fervour). No cooldown, no charge-spend, no move buff; charges only accumulate and are never consumed (sim/charges.ts has no spend).
- Missing: `spend_charges_for_effect`, `attack_cooldown`, `cooldown_bypass`, `self_buff_on_use`
- Repair: Give the attack a 2 s cooldown that a Fervour charge can bypass (spend one), and add a short move-speed buff on use.

**Lure Totem** (Decoy Totem) · active · confidence medium

- PoE: A sturdy totem that taunts nearby monsters so they attack it instead of you, soaking hits and giving a zone of safety.
- Bob: Only a guard buff of 15-25% less damage taken for 8 s when life is low; there is no totem, no taunt and no redirect. Deployables are not actors, enemies cannot target them (src/sim/deploy.ts), so nothing absorbs hits.
- Missing: `taunt_decoy`, `deployable_life`, `enemy_target_redirect`
- Repair: Make deployables targetable actors with life and let enemy AI pick a taunting totem within radius before the player.

**Jaws Trap** (Bear Trap) · active · confidence high

- PoE: A trap that damages one enemy and immobilises it, then slows it and makes it take more damage from your traps and mines; it is a trap/mine setup and control tool.
- Bob: A trap with a big physical burst (200% effectiveness) and a 30% lower enemy stun threshold; nothing holds or slows the enemy and there is no trap/mine vulnerability, so the port note 'holds it for a few seconds' is false. The enemyStunThreshold stat only affects stun chance (src/calc/combat.ts).
- Missing: `immobilise_enemy`, `enemy_slow_debuff`, `damage_taken_from_traps_mines`
- Repair: Add an enemy root/slow status (a timed move-speed multiplier) and a debuff giving more damage taken from trap and mine hits.

**Smoke Charge** (Smoke Mine) · active · confidence medium

- PoE: A mine you detonate to teleport to it, leaving smoke that blinds enemies at both ends and granting a movement speed buff; an escape and mobility tool on a shared blink cooldown.
- Bob: A rally-policy buff cast when a pack is near: 5 s of 10-29% move speed and +40% evasion. No mine, no teleport and no blind; the engine has no blind, and its blink utility only closes distance to a target.
- Missing: `teleport_to_target`, `blind_enemies`, `escape_policy`
- Repair: Use the blink utility kind with an escape mode (teleport back toward a safe spot when hurt) plus the buff, and add a blind status on enemies near the departure point.

**Bind Shade** (Raise Spectre) · active · confidence medium

- PoE: Raises a spectre of a defeated monster, so the choice of which monster to copy and its skills define the build.
- Bob: One or two generic chaos bolt shades (the 'spectre' minion), not tied to any monster or corpse.
- Missing: `raise_from_corpse_type`, `consume_corpse`
- Repair: Let it pick a monster type from the roster (e.g. the most recent or chosen kill) and copy its attack into the minion.

**Wake Sentinel** (Animate Guardian) · active · confidence medium

- PoE: Animates a guardian that wears the weapons and armour you give it and gains their stats; dressing the guardian is the whole point.
- Bob: One generic melee sentinel minion; no item is animated or worn.
- Missing: `animate_item`, `minion_gear_stats`
- Repair: Let the guardian take stats from a selected spare item.

**Dune Stance** (Blood and Sand) · active · confidence high

- PoE: Stance toggled by recasting (2 s cooldown): Blood gives melee 10-15% more area damage and 5% less AoE, Sand gives 10-15% more AoE and 5% less area damage, so you pick damage or reach and swap as the fight changes.
- Bob: Free always-on buff of more melee-area damage with no cost, no AoE side and no toggle. Port note says the stances are averaged. The mod needs both melee and area tags on the skill.
- Missing: `stance_toggle`, `aoe_damage_tradeoff`, `cooldown_bypass`
- Repair: Model two stances (damage-vs-AoE) with an auto-swap policy (for example Blood vs bosses and tight packs, Sand vs wide packs) and give each its trade-off.

**Stone Stance** (Flesh and Stone) · active · confidence medium

- PoE: Stance toggled by recasting: Flesh Stance maims nearby enemies and makes them take more physical damage from hits (offence); Sand Stance blinds nearby enemies and cuts damage taken from attacks by non-blind enemies (defence). 25% reserved in 3.9.
- Bob: Free always-on buff of less damage taken from hits (hitTaken more -9 to -11). No offensive stance, no maim or blind, no toggle, no reservation.
- Missing: `stance_toggle`, `maim`, `blind`, `aura_enemy_debuff`
- Repair: Two stances swapped by policy: Flesh applies a phys-vuln debuff and slow to nearby enemies, Sand gives the damage reduction.

**Ricochet** (Chain) · support · confidence high

- PoE: Projectiles (and chain skills) chain to further enemies after hitting, at a damage penalty; how projectiles clear packs.
- Bob: Adds chains +2 and a damage penalty, but only skills with chain behaviour read 'chains' (sim actions.ts chain branch). On a normal projectile skill (bow, bolt) the chains stat does nothing, so the support is a pure damage penalty. Works only on the ~5 chain-native skills.
- Missing: `projectile_chain`
- Repair: Let projectile skills chain on hit: redirect the projectile to the nearest unhit enemy up to the chain count.

**Wildfire Spread** (Elemental Proliferation) · support · confidence high

- PoE: Elemental ailments inflicted spread to nearby enemies (the defining effect); also 20% freeze/shock/ignite chance (poedb).
- Bob: Only the 20% freeze, shock and ignite chance remains. The engine already has a kill-trigger 'spread' effect for ignite and shock (src/sim/triggers.ts), but the support does not use it.
- Missing: `ailment_spread`
- Repair: Give the support an extraTrigger of the spread kind on kill (add freeze/chill), or spread on inflict.

**Arrow Tempest** (Arrow Nova) · support · confidence high

- PoE: The bow shot flies up and lands at the target, then arrows burst out in a ring from there. (Row corrected after checking the 3.9 wiki; see the erratum.)
- Bob: Just +4 projectiles in a forward fan with less damage; no landing point, no ring.
- Missing: `projectile_nova_from_target`
- Repair: Fire a payload that lands at the aim point and spawns a ring of projectiles from it.

**Echoing Blow** (Ancestral Call Support) · support · confidence medium

- PoE: A melee strike also strikes two extra nearby targets at once (not the same enemy); it extends a strike skill's reach across a pack and adds nothing against a single target.
- Bob: repeats +2 at slightly less damage. Echoes re-fire at the same targetId a moment later, and a non-arc melee strike only hits that one target, so against a single enemy it is a triple hit (like Multistrike) and never reaches other enemies. The sheet counts 1+repeats lands. The use case is inverted.
- Missing: `extra_target_strikes`, `melee_multistrike_separation`
- Repair: Implement a hit-spreading effect: on a strike, also hit up to two other enemies near the target (excluding the target), instead of repeats.

**Rolling Volleys** (Barrage Support) · support · confidence medium

- PoE: Barrage Support: supported bow or wand attacks fire their extra projectiles sequentially, so they can all hit the same target, at a damage penalty and an attack-time cost per projectile. (Row corrected after checking the 3.9 wiki; see the erratum.)
- Bob: Projectiles +4 at 20-30% less damage, fired together in a fan; a use hits each target once. It is Multiple Projectiles with bigger numbers.
- Missing: `sequential_volleys`, `attack_time_per_projectile`
- Repair: Sequential firing with a hit list per volley, and the attack-time cost per extra projectile.

**Guard Breaker** (Block Chance Reduction Support) · support · confidence medium

- PoE: Reduces enemy block, spell block and dodge chances, and applies Overpowered to enemies that blocked; the counter to blocking enemies.
- Bob: Only a flat accuracy bonus for the skill. Enemy block exists in the engine (blockChance in calc/combat.ts, a monster with blockSpell 40, shield-bearers) but the accuracy mod does not touch it; it is Additional Accuracy under the old name.
- Missing: `enemy_block_reduction`, `overpower_on_block`
- Repair: Add a profile stat that lowers the target's block chances (and an Overpowered stack when a blocked hit occurs); hook is in blockChance().

**Refine Gem** (Enhance Support) · support · confidence medium

- PoE: Raises the quality of the supported gem, amplifying its quality bonus; a tuning/utility support rather than a damage gem.
- Bob: A small inc damage. There is no quality system (DESIGN 2.1: gem quality not modelled), so the gem has no real object; it is a stat gem with the old name.
- Missing: `gem_quality`
- Repair: Reinterpret as a small levelBonus on the supported skill (the Empower hook), or introduce quality.

**Shattering Blows** (Shockwave Support) · support · confidence medium

- PoE: Mace/staff hits trigger a shockwave: an area hit around the target, turning single-target strikes into area damage; weapon-restricted.
- Bob: Only +25% increased area of effect and +25% more melee damage. radiusMult only affects arcs, bursts, beams and zones; on a thrust strike it does nothing, so it is plain more melee damage. No shockwave and no mace/staff restriction.
- Missing: `hit_splash_aoe`, `weapon_restriction_on_support`
- Repair: On hit, trigger a burst (castGranted) of the hit's damage around the target; restrict to maces and staves.

**Flanking Cast** (Spell Cascade Support) · support · confidence medium

- PoE: The area spell also lands beside the target on both sides, widening the covered ground; no extra damage to a single target.
- Bob: repeats +2 on the same target spot at less damage and a smaller area. The echoes land at the same place a moment later, so it is a three-times repeat (like Spell Echo) rather than a spatial spread; lateral coverage is gone and single-target damage rises.
- Missing: `offset_cast_positions`
- Repair: Replace repeats with two extra instances of the area offset to either side of the target.

**Slayer's Echo** (Cast on Melee Kill Support) · support · confidence high

- PoE: Linked spells are cast when the supported melee attack kills an enemy; a melee build gets automatic spells.
- Bob: Declared as supports ['melee'] with a kill trigger. Character.buildTriggers links a spell only if supportApplies(support, spell) passes, i.e. the spell must itself have the melee type; no spell does, so skills is empty and castSocketed returns false: it never casts, and only taxes the melee skill's cost by 1.4. (Also the 'melee' tag filter is ignored for kill events.) Static reading, not run.
- Missing: `trigger_link_to_non_supported_skill`, `kill_trigger_tag_filter`
- Repair: In buildTriggers, link the spells in the same item by their own applicability (spell + triggerable), not by the support's melee requirement; also check the killer's skill tags for kill events.

**Burning Pack** (Infernal Legion Support) · support · confidence high

- PoE: Minions are wreathed in fire: a burning aura around each deals fire damage based on its life to nearby enemies, and the minions take fire damage themselves; an area-damage minion build.
- Bob: Only 18% more minion damage. Minions attack with rawHit and have no aura or ground burn; tickAuraBurn is player-only; no self-damage. The port note says as much.
- Missing: `minion_burning_aura`, `minion_self_damage`
- Repair: Give timed pulses of fire damage to enemies near each minion (scaled by minion life) and a small self-damage drain on the minion.

## Drifted gems (133)

**Frost Lance** (Ice Spear) · active · confidence medium

- PoE: Two spears that change into a much faster piercing second form with a huge critical-strike chance and multiplier boost; the crit-based second form is why crit casters use it.
- Bob: A single piercing cold projectile (pierce 99, one projectile) whose damage falls to 50% with distance (behaviour.falloff 0.5, applied in distanceMult), the opposite of Ice Spear's gain in the second form. No form change, no crit boost, no second spear.
- Missing: `projectile_form_change`, `distance_scaled_crit`, `extra_projectile`
- Repair: Add a behaviour field for a second form (after N tiles the projectile gains crit chance/multiplier and speed) instead of the falloff, and a second spear.

**Orbiting Blades** (Blade Vortex) · active · confidence medium

- PoE: Each cast adds a blade (max 10) to a persistent orbit around you that hits everything nearby every 0.6 s, with hit rate, crit and damage rising per blade; the loop is stacking blades, then fighting from the middle of them.
- Bob: A self-centred nova (radius 2.4) fired every cast (0.6 s). No persistent blades, no stacking per cast, no per-blade scaling; the hit rate does match a full orbit roughly.
- Missing: `stack_on_recast`, `persistent_self_aoe`, `per_stack_scaling`
- Repair: Make the cast add a stack to a timed self-centred zone that pulses on its own, with per-stack hit rate, crit and damage.

**Withering Breath** (Blight) · active · confidence medium

- PoE: Channelled chaos debuff on enemies in front: each tick adds a stacking damage-over-time layer (up to 20, each with its own timer) and enemies not yet debuffed are hindered; mana-cheap clear and control.
- Bob: A chaos beam (4.5 long) hitting every 0.3 s at 40% effectiveness as direct hits; the sustained cone form survives. No stacking DoT, no hinder, no ramp; the engine has no skill DoT, only hits and the three ailments, so spell-DoT scaling is missing.
- Missing: `damage_over_time_stacking`, `skill_damage_over_time`, `hinder`, `channel_ramp`
- Repair: Add a stacking debuff that deals chaos per second (own timer per stack) applied by the beam, plus a movement-slow debuff on first application.

**Torch Arrow** (Burning Arrow) · active · confidence medium

- PoE: A fire arrow with a high ignite chance and ignite damage bonus; ignited enemies also get an extra stacking burning debuff (up to five) based on the ignite, and burning ground, so the ignite becomes the damage.
- Bob: A bow attack, 100% physical to fire, 50% ignite chance and 50-88% more ignite damage (the tagged mod does reach ignite damage). No stacking burning debuff and no burning ground, so the extra ignite scaling is absent.
- Missing: `damage_over_time_stacking`, `ground_effect`
- Repair: On ignite, apply a separate stacking burn (up to 5, a share of the ignite's damage) and optionally a short burning patch.

**Acid Arrow** (Caustic Arrow) · active · confidence medium

- PoE: A chaos arrow that bursts and leaves caustic ground that damages enemies standing in it over time; area damage over time that scales with DoT and projectile modifiers.
- Bob: A bow arrow that explodes in radius 1.5 with 60% chaos conversion and a 100% poison chance. The lasting ground is replaced by poison on everyone hit by the burst, which follows the enemy and scales with poison mods instead of ground DoT.
- Missing: `ground_effect`, `skill_damage_over_time`
- Repair: Leave a ground zone at the burst whose damage is a per-second chaos effect on enemies in it (the ground behaviour exists) rather than relying on poison.

**Creeping Plague** (Contagion) · active · confidence medium

- PoE: Applies a chaos damage-over-time debuff to enemies in an area; when an affected enemy dies the debuff spreads to nearby enemies, so it snowballs through packs.
- Bob: A ground cloud at the target (radius 2.5, 5 s, hits every 0.5 s) as direct chaos hits on whoever stands in it. No debuff that stays on the enemy, no spread on death (trigger effects exist only for shock/ignite on item triggers), no spell DoT scaling.
- Missing: `skill_damage_over_time`, `spread_on_death`, `trigger_on_event`
- Repair: Make the cast apply a timed chaos DoT to enemies in the area, and on death of an affected enemy re-apply it to enemies nearby (extend the kill 'spread' trigger effect to this debuff).

**Pyre Burst** (Cremation) · active · confidence medium

- PoE: Consumes a targeted corpse: it explodes for a share of the corpse's life, then becomes a geyser that fires projectiles around it for 8 s. Needs a corpse, so it is a use-what-you-killed skill.
- Bob: A ground zone at the target (radius 2.5, 2.4 s, pulses every 0.8 s) with fire hits. No corpse needed or consumed (the engine has no corpses), no corpse-life explosion, shorter duration.
- Missing: `consume_corpse`, `corpse_life_scaled_explosion`, `ground_effect`
- Repair: Add a corpse record on enemy death and let the skill consume the nearest one, scaling an opening explosion by its life, then leave the existing ground zone for the geyser.

**Twin Blades** (Dual Strike) · active · confidence high

- PoE: Dual-wield only: strikes with both weapons in one hit, extra crit chance, and big crit and damage bonuses against full-life enemies as an opener.
- Bob: Marked bothWeapons and needsDualWield with +50-107% crit chance. In the sim only the arc melee branch hits with all hands: a single-target melee use goes through hit(..., act.hand) once, so each use strikes with one alternating weapon while the calc sheet counts both hands. No full-life bonuses.
- Missing: `both_hands_single_target_hit`, `conditional_bonus_vs_full_life`
- Repair: In fire() make the non-arc melee branch hit with every hand when p.bothHands, and add a target-full-life condition for the bonuses.

**Rime Splinter** (Frost Blades) · active · confidence medium

- PoE: A melee-range strike (extended range) that releases icy blades from the first enemy hit towards other enemies; a melee skill with a projectile shower from the target.
- Bob: A projectile fan of 5 cold blades (range 7, 60 degree spread) fired from the character; there is no melee hit and no origin at the enemy, and the player will stand off at range. Cold conversion 60% and added cold are read.
- Missing: `projectile_from_hit_target`, `melee_strike_then_projectiles`
- Repair: Make the use a melee hit on the target and on contact spawn the fan from the target's position at the other enemies.

**Primal Strike** (Elemental Hit) · active · confidence medium

- PoE: Each attack randomly picks fire, cold or lightning (never twice in a row) and deals only that element, with an area burst that is larger if the target has the matching ailment, and extra damage per elemental ailment on the target.
- Bob: A melee strike with no physical or chaos damage, and added fire and cold damage together every hit (no lightning), plus 10-16% ignite/freeze/shock chances. Nothing picks an element, no area burst, no ailment-count damage bonus.
- Missing: `random_element_per_use`, `damage_per_target_ailment`, `aoe_on_hit_scaled_by_ailment`
- Repair: Pick one of three elements per use (not repeating) that sets the added damage and the ailment, add a small area burst on hit and a more-damage per distinct elemental ailment on the target.

**Fuse Arrow** (Explosive Arrow) · active · confidence medium

- PoE: Arrows stick into the target and explode after a fuse; several stuck arrows are consumed by the first explosion, adding their damage and radius, so you shoot a stack and watch it go off. Ignite bonus per stack.
- Bob: A bow arrow that explodes in radius 1.8 at once with fire conversion and added fire. The sticking, the fuse timer, the stack consumption and the per-stack bonuses are gone, so it is a fire arrow with an explosion.
- Missing: `stick_and_fuse`, `detonate_stacked`, `per_stack_scaling`
- Repair: Let the arrow attach to its target and explode after a timer, with the first explosion absorbing the other stuck arrows' damage and radius.

**Faultline** (Earthquake) · active · confidence medium

- PoE: A slam that damages an area and then erupts again as a large aftershock after a short delay.
- Bob: A slam burst (radius 2.4) at 85-120% with a flat +70% more damage; the aftershock is folded into the one hit rather than a second eruption, even though a ground zone with a delay is supported (Ember Downpour uses it). Total damage is about two thirds of the PoE sum and enemies are hit once.
- Missing: `delayed_aftershock`
- Repair: Add a second burst on the same spot after a short delay (a ground behaviour with delay and two pulses) instead of the flat more-damage mod.

**Sap Bolt** (Essence Drain) · active · confidence medium

- PoE: A projectile that applies a chaos damage-over-time debuff and heals you for a share of the debuff's damage; the debuff is spread by Contagion.
- Bob: A chaos projectile that bursts (radius 1.2) with 100% poison chance and leech.life 0.5. The leech applies only to the hit damage (leech is computed in applyHit), not to the poison ticks, so the sap heal is close to nothing; the DoT is poison, which does not use spell-damage scaling.
- Missing: `skill_damage_over_time`, `leech_from_dot`
- Repair: Make the debuff a skill DoT with a life-leech share of its tick damage, instead of poison plus hit leech.

**Storm Quill** (Galvanic Arrow) · active · confidence medium

- PoE: Arrows plus a lightning burst that damages every enemy in a cone, with the arrows degrading in flight; a close-range cone shotgun. (Row corrected after checking the 3.9 wiki; see the erratum.)
- Bob: A fan of 3 bow arrows (range 7) with half lightning conversion and added lightning. There is no cone area damage (no explodeRadius or beam on the behaviour).
- Missing: `cone_area_on_projectile`
- Repair: Give the projectile an explode shape of a cone from the impact (or a beam hit at fire time) so the lightning burst exists.

**Rime Mallet** (Glacial Hammer) · active · confidence high

- PoE: A heavy cold-converted mace/staff hit with a freeze chance; frozen enemies on low life shatter, the third strike in a row freezes more easily, and it adds cold damage to chilled enemies. The freeze to shatter combo is the niche.
- Bob: Heavy melee at 155-200% with 60% cold conversion, 25% freeze chance and increased chill effect (all read). The shatter, the third-hit combo and the damage vs chilled enemies are gone (the port note admits the shatter is dropped).
- Missing: `shatter_frozen_execute`, `combo_counter`, `conditional_added_damage`
- Repair: Add an execute on frozen enemies below a third of life (the engine has a culling check that could take a frozen condition) and a consecutive-hit counter for extra freeze.

**Blaze Stream** (Incinerate) · active · confidence medium

- PoE: Channelled flamethrower whose cone widens and lengthens as you hold it, with damage that grows per stage, and a final wave that applies a strong ignite when you stop.
- Bob: A fire beam (4.5 by 2.4) every 0.2 s at 45% effectiveness. The sustained stream form survives, but the widening with stages, the stage damage and the release ignite are gone and the channelling tag is inert.
- Missing: `channel_ramp`, `channel_release`
- Repair: Stage counter that grows the beam's length and width and damage while the skill keeps firing, plus a final strong ignite on stop.

**Rime Core** (Frost Bomb) · active · confidence medium

- PoE: Place a crystal that pulses a debuff (cold exposure, slowed regen) and then explodes for heavy cold damage when its duration ends; you pick it as a set-and-detonate exposure applier.
- Bob: A 2 s ground zone pulsing full spell hits every 0.5 s with 25% cold penetration standing in for exposure (penetration is read by the engine); there is no end-of-life explosion and no regen debuff.
- Missing: `detonate_at_end_of_duration`, `debuff_regen_reduction`
- Repair: Let a ground zone carry an 'on expiry' burst (a heavier hit at the zone's end) and make the pulses debuff-only or weak.

**Bolt Cleave** (Lightning Strike) · active · confidence medium

- PoE: A melee strike (half converted to lightning) that also throws projectiles from the struck enemy to hit farther-away targets; a melee skill with ranged reach.
- Bob: Behaviour is a pure projectile fan (5 bolts, 70 degrees, range 7) from the caster at -25% each; there is no melee hit, and all bolts share a per-use hit list so one target takes a single bolt. It plays as a short-range shotgun-free fan, not a strike with spawned bolts.
- Missing: `melee_hit_plus_spawned_projectiles`, `projectile_from_target`
- Repair: Add a hybrid behaviour: a melee hit on the target followed by projectiles launched from the target's position at other enemies.

**Slag Blow** (Molten Strike) · active · confidence medium

- PoE: A melee strike (physical and fire) that launches molten balls from the struck enemy that explode on landing for area damage; a melee skill with its own AoE.
- Bob: Pure projectile behaviour: four balls fanned 90 degrees from the caster, range 6, each exploding in radius 1 at -50%. There is no melee hit; the explosions do shotgun a close target (explode() ignores the hit list).
- Missing: `melee_hit_plus_spawned_projectiles`, `projectile_from_target`
- Repair: Same hybrid behaviour as Bolt Cleave: melee hit, then balls launched from the target that explode where they land.

**Tempest Mote** (Orb of Storms) · active · confidence medium

- PoE: A stationary orb that fires splitting lightning bolts at nearby enemies for 6 s; using a lightning skill inside its cloud makes it fire extra bolts, and recasting replaces it.
- Bob: A 6 s ground zone (radius 2) that pulses full spell hits every 1.2 s on whatever stands in it; no target-seeking bolts, no splitting, no interaction with casting other lightning skills, no replace-on-recast.
- Missing: `orb_auto_target_bolts`, `empower_on_cast_inside_area`, `projectile_split`, `replace_previous_instance`
- Repair: Give ground zones an optional 'bolt' mode that strikes the nearest enemy within a larger radius each interval, and an extra-bolt trigger when the owner casts a lightning skill while inside.

**Spear Burst** (Perforate) · active · confidence low

- PoE: Slam the ground to raise a sequence of six spikes (Blood Stance) that can each hit an enemy, or thrust them outward (Sand Stance); a multi-hit ground slam.
- Bob: A single burst (radius 2.4) at 140-196% with a flat 25% bleed chance; the sequence of hits (and the per-hit scaling that offsets it) is collapsed into one hit, and stance is dropped.
- Missing: `multi_hit_sequence`, `stance_toggle`
- Repair: Use the repeats primitive (or a multi-pulse burst) to land several reduced hits so on-hit effects like bleed and impale roll per spike.

**Venom Strike** (Pestilent Strike) · active · confidence high

- PoE: A chaos/poison strike that marks the enemy; when a marked enemy dies poisoned it spreads a chaos damage-over-time debuff, based on its poisons, to enemies around it.
- Bob: Half-chaos melee strike with 60% poison chance and +30% poison duration (both real); the on-death poison spread is not implemented. It is a straightforward poison applicator.
- Missing: `trigger_on_event`, `spread_poison_on_death`, `consume_status_for_aoe_dot`
- Repair: Add a kill-trigger effect for this skill that deals an area chaos DoT scaled by the dead enemy's poison stack (the kill-trigger plumbing already exists).

**Gouge Shot** (Puncture) · active · confidence medium

- PoE: Always bleeds the target; the bleed lasts 8 s (skill duration, so duration mods scale it) with a 30-49% more bleed damage bonus; a long-bleed applicator for bows, daggers, claws and swords.
- Bob: 100% bleed chance and bleed-tagged more damage are real, but there is no duration modifier, so the bleed uses the base 5 s (BLEED_DURATION) - the port note's 'eight seconds' is not implemented. It is always a range-9 projectile, even with a dagger or claw.
- Missing: `ailment_duration_override`, `skill_duration_scales_ailment`, `melee_when_melee_weapon`
- Repair: Add a duration.bleed increase (about +60%) to the gem and let skill-duration mods feed bleed duration; make the stab a melee hit when a melee weapon is held.

**Sweeping Cut** (Reave) · active · confidence low

- PoE: A small frontal sweep whose area grows by 50% more per stage; each hit adds a stage, stages fade if you stop hitting. You pick it for the ramping area on repeated attacks.
- Bob: A fixed self-centred 360-degree burst (radius 2.4) with a constant +50% area; the stage ramp, its decay and the frontal shape are replaced by a flat bonus from the first swing (the engine's accepted averaging of ramping skills).
- Missing: `stack_ramp_on_hit`, `stack_decay`
- Repair: Track a per-skill stage count that rises on hit and decays after a pause, scaling the burst radius.

**Searing Lance** (Scorching Ray) · active · confidence medium

- PoE: A channelled fire beam that deals damage over time, intensifying with each stage you hold it on a target (up to 8), applies fire exposure at max stages, and leaves a burn on enemies that leave the beam.
- Bob: A short instant-line beam (length 4) fired repeatedly as spell hits with constant 25% fire penetration standing in for exposure; the stages, the damage-over-time nature and the lingering burn are not modelled (the port note claims averaged stacks, but no stack stat exists).
- Missing: `channel_ramp`, `damage_over_time_stacking`, `exposure_at_max_stages`, `lingering_burn`
- Repair: Give beam skills a per-target stage count that adds damage per tick and applies exposure at max, plus a burn that outlasts the beam.

**Splinter Volley** (Shattering Steel) · active · confidence medium

- PoE: Throw projectiles that shatter into pieces that all hit in a cone, so the damage is huge point-blank and falls off with distance; the skill is a shotgun. (Row corrected after checking the 3.9 wiki; see the erratum.)
- Bob: Three-projectile spread with +60% more damage when the target is within about 2 tiles (real condition), and a 40% impale chance. But all projectiles of one use share a hit list, so a close target is hit once instead of by every fragment; the shotgun stacking that is the skill's point is missing.
- Missing: `projectile_shotgun`
- Repair: A per-skill shotgun flag (3.9 flags only Shrapnel Ballista and Shattering Steel), giving each projectile its own hit list.

**Skyfall** (Storm Call) · active · confidence low

- PoE: Place a marker that is struck by lightning after a short delay for area damage; when it goes off, every other marker you have placed also goes off.
- Bob: A ground zone at the target: 0.4 s delay then a pulse every 0.5 s for 1.5 s (three pulses, each a full hit), with shock effect. It is a short lingering storm instead of a single delayed strike, and markers neither coexist nor trigger one another.
- Missing: `delayed_detonation_marker`, `chain_detonate_markers`
- Repair: Make it a single delayed strike that records markers and detonates all live markers together.

**Rupture Line** (Sunder) · active · confidence medium

- PoE: A slam sending a wave of broken ground forward; each enemy it hits releases a circular shockwave that damages enemies around it, so one hit spreads through a pack.
- Bob: One burst of radius 2.2 centred on the target with a flat +15% more damage standing in for the secondary wave; no line wave and no per-enemy secondary shockwave.
- Missing: `line_wave`, `secondary_aoe_on_each_enemy_hit`
- Repair: Add a forward line hit followed by a smaller, reduced-damage burst around each enemy hit, once per enemy.

**Glacier Wall** (Frost Wall) · active · confidence medium

- PoE: Creates a wall of ice that blocks enemy movement and damages and pushes back those under it; used for crowd control and kiting.
- Bob: A 5-tile line ground zone lasting 3 s, pulsing cold damage with a 15% freeze chance. It damages but does not block or push, so only the freeze chance stands in for control.
- Missing: `ground_barrier_blocks_movement`, `knockback`
- Repair: Let a ground line act as terrain monsters path around (or are held by), plus an outward push on pulse.

**Halo Sweep** (Holy Sweep) · active · confidence medium

- PoE: (From poedb, current version; no PoB data.) A two-handed mace/staff circular swing with 50% lightning conversion that also calls down holy hammers on up to three struck enemies.
- Bob: A 360-degree self burst with 50% lightning conversion usable with swords, maces, axes and staves (no two-hand limit); the hammers that land on struck enemies are missing.
- Missing: `bonus_hits_on_random_struck_enemies`, `two_handed_requirement`
- Repair: After the sweep, add reduced-damage area hits on up to three enemies it struck.

**Cluster Bolt** (Kinetic Blast of Clustering) · active · confidence medium

- PoE: (From poedb, current version; no PoB data.) A wand shot that makes several explosions; it adds physical damage equal to a share of your maximum mana and takes spell-damage scaling at 150% on the attack (arcane might), so it is a mana-scaling caster wand attack.
- Bob: A wand projectile with one wide burst (area increase 10-40%) at 110-140%; nothing scales with maximum mana and no spell-damage conversion (the engine has a spellIncAppliesToAttacks flag that is unused here), and there is a single explosion rather than a cluster.
- Missing: `added_damage_from_max_mana`, `spell_inc_applies_to_attack`, `multiple_explosions`
- Repair: Add base physical damage as a percent of maximum mana (and use the existing spell-increase-on-attacks flag at partial strength); optionally several offset explosions.

**Cleansing Blaze** (Purifying Flame) · active · confidence medium

- PoE: A holy fire wave that hits in a line, leaves Consecrated Ground (sustain for you) and then sends a larger shockwave that hits enemies standing on it; the fire and consecrated ground combo is the draw.
- Bob: A burst (radius 2.4) of fire and physical spell damage at the target; the line wave, consecrated ground and follow-up shockwave are dropped, as the port note admits.
- Missing: `ground_effect`, `consecrated_ground_regen`, `secondary_expanding_shockwave`
- Repair: Leave a timed ground zone under the target that regenerates the owner's life while standing in it and carries a delayed second burst.

**Slag Lob** (Rolling Magma) · active · confidence medium

- PoE: (From poedb, current version; no PoB data.) Lob a fiery orb that explodes in an area where it hits the ground, then bounces forward 2-3 times, exploding at each bounce; area damage along a line.
- Bob: Chain behaviour (3 chains, range 4): the bolt jumps from enemy to enemy like a lightning arc and each link is a single-target hit; no explosion at each landing, and it needs enemies to chain.
- Missing: `aoe_at_each_chain_or_bounce`, `ground_bounce_forward`
- Repair: Make each chain link an area burst (explodeRadius) and let the orb bounce forward regardless of enemies.

**Blight Hail** (Scourge Arrow) · active · confidence medium

- PoE: Hold to gain stages, release to fire an arrow that leaves spore pods that bloom into thorn arrows; more stages mean more pods and damage. A commitment-for-power chaos/poison bow skill.
- Bob: A steady three-arrow chaos fan with 60% poison chance (both real) and a cheap per-use cost; there is no stage build-up and no spore pods blooming later, so it is an averaged volley without the ramp or the lingering pods.
- Missing: `channel_ramp`, `spawn_delayed_projectiles_along_path`
- Repair: Add a stage count that rises while the skill is used on a target and scales the arrow count/damage, and leave pods along the path that fire thorn arrows.

**Spirit Saw** (Soulrend) · active · confidence medium

- PoE: A homing, piercing projectile that leeches energy shield and keeps applying a short strong chaos damage-over-time debuff to everything near it as it travels.
- Bob: A slow piercing chaos projectile with 100% poison chance. It does not home, and nothing returns energy shield (the port note claims it does; the gem has no leech or ES stat).
- Missing: `projectile_homing`, `energy_shield_leech_from_hit`, `area_dot_while_travelling`
- Repair: Add ES leech from the hit (the leech machinery exists) and homing toward enemies in front.

**Ghost Coil** (Spectral Helix) · active · confidence low

- PoE: (From poedb, current version; no PoB data.) Throws a spectral weapon that spirals outward through about 4 rotations and bounces off walls up to three times (extra projectiles become bounces).
- Bob: The same returning projectile as Phantom Toss (out and back, hits both legs); no spiral, no wall bounces.
- Missing: `projectile_spiral_path`, `projectile_wall_bounce`
- Repair: Give the projectile a spiral path and wall bounces in place of the plain return, with extra projectiles adding bounces.

**Ghost Shard** (Spectral Shield Throw) · active · confidence medium

- PoE: Throws a spectral copy of your shield whose damage scales with the shield's armour and evasion, shattering on impact into shards that fly in all directions; the build-around for shield defences.
- Bob: Needs a shield, then fires a nine-shard physical fan over 120 degrees with flat added damage by gem level. Nothing reads the shield's defences (the port note says it scales with them; the gem has no such mod), and the shatter is a forward fan, not a burst from the impact point.
- Missing: `damage_from_shield_defences`, `projectile_split`, `radial_shatter_on_impact`
- Repair: Add added physical damage per N of shield armour and evasion (the shield stats are already computed in character.ts) and make the shards fan out from the first impact.

**Thunder Spiral** (Storm Burst) · active · confidence low

- PoE: Channel to release lightning orbs that repeatedly jump toward a target spot; when you stop channelling, all remaining orbs explode for higher damage in a larger area, so you choose when to cash out.
- Bob: A rapid burst (0.25 s cast time) on the target with half the physical converted to lightning; averaged into repeated hits with no release explosion.
- Missing: `channel_ramp`, `channel_release_burst`
- Repair: Accumulate orbs while the skill is used on a target and detonate them as a larger burst when the target dies or the skill stops.

**Magma Crack** (Tectonic Slam) · active · confidence medium

- PoE: A fire slam that sends fissures forward; with an Endurance Charge it can spend the charge for a Charged Slam with more damage, bigger area and more fissures.
- Bob: A burst slam with 50% fire conversion and a 20% ignite chance (the ignite is not in the original); it never consumes charges, so the grit (Endurance analog) interaction is missing.
- Missing: `spend_charges_for_effect`, `slam_fissures`
- Repair: Let the slam spend one Grit charge for more damage and area (charges and their spending hooks exist in sim/charges.ts).

**Whirl Shot** (Tornado Shot) · active · confidence medium

- PoE: A piercing arrow flies to the target spot and then fires secondary projectiles out in all directions from that point; the arrow splits at its end.
- Bob: A five-arrow bow fan (45 degrees) from the caster; no split at the end of the flight and no radial secondaries, and one arrow per target. It plays as a second Split Volley.
- Missing: `projectile_split`, `radial_burst_at_projectile_end`
- Repair: After the main arrow travels to its end point, spawn secondary projectiles radially from that point.

**Venom Shower** (Toxic Rain) · active · confidence medium

- PoE: Rain arrows into an area that leave spore pods which deal chaos damage over time, slow enemies' movement, and burst at the end of their life for area damage.
- Bob: A 1.5 s ground zone (radius 2.6) with 60% chaos conversion and poison on every pulse. Poison cloud is there; the movement slow and the final pod burst are not.
- Missing: `apply_slow_debuff_on_hit`, `detonate_at_end_of_duration`
- Repair: Slow enemies standing in the zone and add a final burst when the zone expires.

**Toxin Circle** (Venom Gyre) · active · confidence low

- PoE: A returning chaos projectile that can be caught; caught projectiles are released into a spiral when you use Whirling Blades, so it is a poison skill combined with a movement skill.
- Bob: A returning poison blade with 50% chaos and 100% poison chance (the engine reads both); no catching and no release by a movement skill, so it is a spinning poison boomerang.
- Missing: `catch_returning_projectile`, `release_stored_projectiles_on_movement_skill`
- Repair: Store projectiles that come back to the owner and release them as a spiral when the character uses a blink or movement skill.

**Guarded Strike** (Vigilant Strike) · active · confidence medium

- PoE: A strong strike that gives Fortify; it has a 4 s cooldown which you can bypass by spending an Endurance Charge. Used to keep Fortify up between other attacks.
- Bob: A melee strike that gives Fortify on melee hit (buffOn.meleeHit.fortify, which the engine reads: 20% less damage taken for 4 s). It has no cooldown, so it is simply a spammable fortifying strike, and no charge is spent; the damage is also far below the original's 222-260%.
- Missing: `attack_cooldown`, `cooldown_bypass`, `spend_charges_for_effect`
- Repair: Give it an explicit cooldown and let a Grit charge be spent to skip it, with a heavier hit to pay for the cooldown.

**Tide of Judgement** (Wave of Conviction) · active · confidence high

- PoE: Cone wave of phys/fire/lightning damage whose defining effect is applying Exposure (-resist) matching the element the target took most damage from; only one wave at a time.
- Bob: A 'beam' spell (length 5, width 3) dealing fire + physical with 50% phys to lightning. No exposure/resist-shift debuff exists anywhere in src (grep 'exposure' finds nothing); the port note's 'shifts which element is weakest' is not implemented.
- Missing: `exposure_debuff`, `resist_shift_on_hit`
- Repair: Add an enemy 'exposure' status (timed -X% resist to the element of the highest damage dealt in the hit) applied by hit, and give the gem a mod that triggers it.

**Void Curse** (Despair) · active · confidence medium

- PoE: Curse: -chaos resistance, increased damage over time taken, and flat extra chaos damage taken on each hit; the pick for chaos DoT builds.
- Bob: chaosSap hex: only -20..-29% chaos resistance. Increased DoT taken and added chaos damage per hit are not modelled (port note says folded into resistance).
- Missing: `dot_taken_increase_debuff`, `added_damage_taken_on_hit`
- Repair: Add 'increased damage over time taken' (and a small flat chaos-per-hit) as hex effects on this hex.

**Penance** (Punishment) · active · confidence medium

- PoE: Curse that makes the cursed enemy grant the attacker a melee buff when hit by melee: more melee damage and increased attack speed. A melee-only curse.
- Bob: hardTimes hex: target takes 10..19% increased damage of every type (vulnAll). No attack speed, not melee-restricted (spell and bow builds benefit equally), no buff-on-hit step.
- Missing: `melee_only_damage_bonus_vs_cursed`, `attack_speed_vs_cursed`, `buff_granted_on_hit`
- Repair: Make it a mark-style hex with selfMods (more melee damage and attack speed against the target) instead of vulnAll.

**Ruin Sigil** (Assassin's Mark) · active · confidence medium

- PoE: Mark: enemy is far easier to crit (and for more), and killing it grants life, mana and a chance for a power charge.
- Bob: critMark hex: +40..85% inc crit chance and +15..40 crit multi for the character vs the target (character.ts selfMods under 'targetCursed', real), plus a small 6..15% damage-taken. Kill rewards (life, mana, Insight charge) dropped. Quirk: selfMods apply whenever the target holds any hex, not specifically this mark.
- Missing: `recover_on_kill_of_marked`, `charge_on_kill_of_marked`
- Repair: Add recover.kill.life/mana and chargeOn.kill.insight to the hex selfMods conditioned on the target having this mark.

**Plenty Sigil** (Poacher's Mark) · active · confidence medium

- PoE: Mark: enemy is less evasive; hits on it return life and mana, kills fill flask charges and may give a frenzy charge.
- Bob: flaskMark hex: 6..15% increased damage taken, and the character gets chargeOn.kill.fervour 20..35 vs the marked. Evasion reduction, life/mana on hit and flask charges dropped.
- Missing: `recover_on_hit_vs_marked`, `flask_charge_on_kill`, `evasion_reduction_debuff`
- Repair: Add recover.hit life/mana and flask-charge-on-kill selfMods to the hex.

**Warlord Sigil** (Warlord's Mark) · active · confidence medium

- PoE: Mark: enemy is more easily stunned; hitting it leeches life and mana, killing it can give an endurance charge.
- Bob: stunMark hex: stunDuration inc 40..90 and melee life leech 0.4..1.2 for the character vs the marked, plus damage taken. No mana leech, no Grit charge on kill, no stun-chance/threshold effect (only duration).
- Missing: `charge_on_kill_of_marked`, `mana_leech_vs_marked`, `stun_vulnerability_debuff`
- Repair: Add chargeOn.kill.grit and mana leech to the selfMods, and an enemy stun-threshold reduction on the hex.

**Standard of Valour** (War Banner) · active · confidence medium

- PoE: Banner: reserves mana while carried, is placed to become a stationary aura that grows by stages from kills; gives allies accuracy and makes enemies take increased physical damage, plus adrenaline.
- Bob: Timed buff on the character (8 s, cd 6): inc accuracy and +10% attack, cast and move speed (invented numbers; real mods). No enemy phys-damage debuff, no stages/kill scaling, no carry/place or reservation.
- Missing: `placed_aura_object`, `stages_from_kills`, `enemy_damage_taken_debuff`
- Repair: Make the banner a placed aura (stationary object) with kill-fed stages and an enemy 'physical damage taken' debuff in radius.

**Standard of Dread** (Dread Banner) · active · confidence medium

- PoE: Banner: allies impale with attacks, enemies' accuracy is lowered, fortify; grows by stages from impales; carried then placed.
- Bob: Timed buff (8 s, cd 6): chance.impale 20, hitTaken more -12 (fortify stand-in), impaleEffect inc. Impale/fortify work in skill.ts; enemy accuracy debuff, stages, carry/place missing.
- Missing: `placed_aura_object`, `stages_from_kills`, `enemy_accuracy_debuff`
- Repair: Same placed-banner primitive as War Banner, with stages fed by impales.

**Deathless Call** (Immortal Call) · active · confidence high

- PoE: Guard: less physical and elemental damage; consumes up to 5 endurance charges to extend the buff and reduce physical taken further (charges -> safety).
- Bob: Guard utility (life<60%, 4 s, cd 8): hitTaken more -25..-35. Grit charges are never consumed (no charge-spend primitive exists in sim/charges.ts) and bring no extra benefit.
- Missing: `spend_charges_for_effect`, `guard_cooldown_sharing`
- Repair: Add spend_charges_for_effect: on cast, remove held Grit charges to lengthen the buff and deepen the reduction.

**Surge of Blood** (Blood Rage) · active · confidence high

- PoE: Buff: attack speed and life leech at the price of life degeneration; kills refresh the duration and may give a frenzy charge.
- Bob: Upkeep buff (9 s, cd 9): attackSpeed inc 5..15, leech.life 1.2 on attacks. Degen drawback, kill-refresh and charge-on-kill are all dropped.
- Missing: `buff_self_drawback`, `refresh_on_kill`, `charge_on_kill_while_buffed`
- Repair: Add a buff-linked life drain mod, kill refresh of the buff timer, and chargeOn.kill.fervour inside the buff.

**Rampage Call** (Berserk) · active · confidence high

- PoE: Consumes Rage at an accelerating rate for a big buff (more damage, attack and move speed, less damage taken); needs minimum rage; length depends on stored rage.
- Bob: Rally buff (8 s, cd 12): more attack damage 15..20, more attack speed, move speed, less hit taken. Bob has rage (rageOn.*, w.rage), but Berserk neither requires nor consumes it - a cooldown buff with free uptime.
- Missing: `consume_rage`, `resource_threshold_to_cast`, `buff_length_from_resource`
- Repair: Require min rage to cast, drain rage while active at an accelerating rate, and end the buff when rage runs out.

**Cinder Step** (Flame Dash) · active · confidence high

- PoE: Blink that damages enemies on the way and leaves burning ground; shares cooldown with other blinks.
- Bob: Identical to Quick Step: blink distance 8, cd 3. applyUtility blink code has no damage and no ground effect; fire tags and cast time 0.7 are cosmetic.
- Missing: `damage_on_blink`, `ground_effect`, `blink_cooldown_sharing`
- Repair: Let blink skills deal a spell hit at start/end point and drop a burning ground zone using the existing 'ground' zones.

**Rime Step** (Frostblink) · active · confidence high

- PoE: Blink dealing cold damage with chilled ground at the origin; cooldown recovers faster per nearby enemy (a pack-fighting blink).
- Bob: Plain blink (distance 9, cd 3.5, longer than PoE's 3). No damage, chill ground, or cooldown recovery from nearby enemies.
- Missing: `damage_on_blink`, `ground_effect`, `cooldown_recovery_from_nearby_enemies`
- Repair: Add blink damage/chill zone plus a cooldown reduction per nearby enemy to the blink utility.

**Bolt Step** (Lightning Warp) · active · confidence high

- PoE: Delayed teleport that deals lightning damage at both origin and destination; warps can be queued.
- Bob: Plain blink (distance 9, cd 3, cast 0.8). No delay mechanic, no area damage at either end, no queueing.
- Missing: `damage_on_blink`, `delayed_teleport`, `queued_casts`
- Repair: Blink with a lightning area hit at both endpoints (the delay already roughly exists as cast time).

**Slipstream Run** (Phase Run) · active · confidence medium

- PoE: Move-speed and phasing buff; on using any skill it is replaced by a melee physical damage buff; Frenzy charges are consumed to extend duration.
- Bob: Upkeep buff (2 s, cd 4): moveSpeed inc 30..39 and more melee physical damage 20..30, both at once. No phasing, no aggro reduction, no skill-use swap, no charge consumption.
- Missing: `spend_charges_for_effect`, `buff_replaced_on_skill_use`, `phasing`
- Repair: Make the damage portion arm on first attack after the move buff and let Fervour charges extend duration.

**Rotting Stride** (Withering Step) · active · confidence medium

- PoE: Grants Elusive (strong defence) and Phasing; enemies that come near are Withered; ends when you use a skill; blink cooldown.
- Bob: Upkeep buff (4 s, cd 5): moveSpeed inc 20 and chaos penetration 10..24 as a Wither stand-in. No Elusive, no wither stacks on enemies, no phasing, no end-on-skill.
- Missing: `elusive_defensive_buff`, `stacking_debuff_on_enemy`, `phasing`, `buff_ends_on_skill_use`
- Repair: Add an Elusive-style evade/damage-reduction buff and a proximity wither (stacking chaos damage taken) aura.

**Bulwark Rush** (Shield Charge) · active · confidence high

- PoE: Charge with the off-hand shield: damage and stun chance grow the further you travel, repeated hits along the path, damage derived from shield stats.
- Bob: Attack needing a shield with travel 8, melee range 1.5, flat 'more damage' 50 and enemy stun threshold. The port note's 'hits harder the farther it ran' is not implemented (travel is not tied to damage); no shield-derived damage.
- Missing: `distance_scaling_damage`, `shield_stat_damage`, `hits_along_path`
- Repair: Scale the charge's damage and stun with the actual travel distance and add damage from the shield's armour/evasion.

**Twister Blade** (Cyclone) · active · confidence medium

- PoE: Channel to spin and move, constantly hitting enemies around you, building stages that raise range; extra first-hit damage; cannot be stunned.
- Bob: Self-centred burst r2.4 (90..110%) with +1 repeat and a little travel. Retains the sweep-around-self shape, but there are no stages/range ramp and no stun immunity (channelling is only a tag).
- Missing: `channel_ramp`, `stun_immunity_while_active`
- Repair: Add channel_ramp: stages from consecutive uses raising radius and hit rate, decaying after a gap.

**Storm Rush** (Charged Dash) · active · confidence medium

- PoE: Channel an illusion you steer, waves of lightning damage pulse along its path, then you teleport to it for a final wave.
- Bob: Attack with travel 8, half lightning conversion and a burst r2.2 with a flat +120% more damage standing in for stages. A dash plus lightning burst; no channel, no waves along the path.
- Missing: `channel_ramp`, `damage_waves_along_path`
- Repair: Fire several lightning pulses along the travel line and one at arrival, scaling with distance.

**Blessed Trail** (Consecrated Path) · active · confidence medium

- PoE: Teleport to a nearby enemy, slam, and leave consecrated ground (life regeneration) in an area.
- Bob: Attack with travel 7 and a half-fire burst r2 150..184%; ground dropped, so the teleport-slam survives but without a lasting effect.
- Missing: `ground_effect`
- Repair: Leave a 'ground' zone granting life regeneration to the player standing in it.

**Snag Lash** (Chain Hook) · active · confidence medium

- PoE: Chain pulls you to a distant enemy or hits directly when close, with a cone behind; gains rage per hit, and the cone grows with rage.
- Bob: Melee arc 90 range 3.4, rageOn.meleeHit 1 (rage is real in sim/buffs.ts). No pull, and no area growth per rage - the rage feeds only the generic rage bonuses.
- Missing: `pull_to_target`, `area_scales_with_resource`
- Repair: Add area scaling per rage held and a short pull (travel) to a distant target.

**Thunder Rebuke** (Smite) · active · confidence medium

- PoE: Melee strike plus a lightning strike at a nearby location, and on hit a buff aura giving you and allies added lightning damage; picked for the buff.
- Bob: Melee arc 90 strike with half lightning, shock chance and -25% more damage. The follow-up lightning area and the aura buff are dropped.
- Missing: `self_buff_on_use`, `secondary_area_strike`, `buff_granted_on_hit`
- Repair: On hit, grant a timed buff giving added lightning damage, and add a second area hit.

**Cinder Bond** (Searing Bond) · active · confidence medium

- PoE: Totem that beams burning damage at you and every other totem, damaging enemies in between and at the ends; allows one more totem.
- Bob: A pair of totems (deployCount +1) each pulsing a fire burst r3.4 around itself as hits, with no DoT, no link beams between totems or to the player.
- Missing: `linked_beam_between_deployables`, `damage_over_time_stacking`
- Repair: Add a line hit between totems and the player and make it burning damage over time.

**Guardian Cairn** (Ancestral Protector) · active · confidence medium

- PoE: An ancestor totem melee-strikes nearby enemies and, while you stand near it, gives you more attack speed; you pick it to fight beside a totem and turn positioning into a damage bonus.
- Bob: Placing it puts an invulnerable totem 1.5 tiles toward the target that strikes with your weapon (src/sim/deploy.ts shoot); the owner attack-speed bonus is dropped (mods is empty), so it is just a free extra melee hitter while the character also fights.
- Missing: `owner_buff_near_deployable`
- Repair: Add a 'near own totem' condition (a standing deployable of this skill within ~7 tiles) and give the owner the more-attack-speed mod on it.

**Slamming Cairn** (Ancestral Warchief) · active · confidence medium

- PoE: An ancestor totem slams enemies in an area and, while you are near it, grants you more melee damage; the pitch is a totem plus a damage buff for staying beside it.
- Bob: An invulnerable totem slams the ground beside itself with your weapon; the owner 'more melee damage' bonus (8-18%) is absent from mods, so only the extra slam damage remains.
- Missing: `owner_buff_near_deployable`
- Repair: Same 'near own totem' condition as Guardian Cairn, granting more melee damage to the owner.

**Mortar Bow** (Artillery Ballista) · active · confidence medium

- PoE: A ballista totem lobs fire arrows that land in a line and each explode in an area, so it is an AoE ground-pounder from a bow totem.
- Bob: Up to three ballistas fire a 6-arrow fan of plain fire-converted projectiles (no explodeRadius, no area tag) that hit only what they touch; the ground-impact explosion that defines it is gone.
- Missing: `projectile_land_explode`
- Repair: Give the behaviour explodeRadius (the projectile engine already supports it) and the area tag so arrows burst where they land or hit.

**Scatter Bow** (Shrapnel Ballista) · active · confidence high

- PoE: A ballista totem fires a few arrows that can all hit the same enemy (shotgunning), turning close range into a burst with added physical damage. (Row corrected after checking the 3.9 wiki; see the erratum.)
- Bob: Fires a 3-arrow fan with added physical damage, but all projectiles of one use share a single hit list (src/sim/actions.ts useHits), so an enemy is hit once per use and there is no shotgun.
- Missing: `projectile_shotgun`
- Repair: A per-skill shotgun flag (3.9 flags only Shrapnel Ballista and Shattering Steel), giving each projectile its own hit list.

**Bolt Trap** (Lightning Trap) · active · confidence medium

- PoE: A trap that fires a ring of lightning projectiles with shock chance and extra critical chance against shocked enemies, so shock feeds crits.
- Bob: A 9-projectile 360 degree ring with 20% shock chance and scaling shock effect; the crit-chance-versus-shocked-enemies stat (80-118%) that is in the reference data is not on the definition.
- Missing: `crit_vs_shocked`
- Repair: Add critChance inc 80-118 with condition targetShocked (the engine already supports it, as Spire Trap shows).

**Drain Trap** (Siphoning Trap) · active · confidence medium

- PoE: A trap whose beams chill and deal cold damage over time to up to ten enemies and give you large life and mana regeneration for each enemy affected, a sustain trap.
- Bob: A cold ground zone that chills and hits for 3 s with a flat 1% life leech; the per-enemy life and mana regeneration (hundreds a second at high level) is reduced to leech on weak damage, so the sustain is negligible.
- Missing: `regen_per_affected_enemy`
- Repair: Add a timed owner life/mana regen that scales with the number of enemies inside the zone, in place of the 1% leech.

**Mortar Charge** (Pyroclast Mine) · active · confidence medium

- PoE: A mine that blasts an area and then rains fiery projectiles around it, while an aura makes nearby enemies take added fire damage.
- Bob: A mine with a single fire burst (radius 2.4, 80%); the follow-up projectile rain and the fire-damage-taken aura are absent.
- Missing: `secondary_projectile_rain`, `mine_aura_debuff`
- Repair: Add a secondary ring of small explosions or projectiles after the first burst and a fire-damage-taken debuff on enemies near the mine.

**Charge Release** (Discharge) · active · confidence high

- PoE: A nova that consumes all your charges and deals fire, cold and lightning damage per endurance, frenzy and power charge removed; the trade is spending your charge buffs for a burst.
- Bob: A nova with fire per Grit, cold per Fervour and lightning per Insight, but the charges are never consumed (no charge-spend path exists in src/sim/charges.ts), so it is a free charge-scaled nova that keeps the buffs.
- Missing: `spend_charges_for_effect`
- Repair: Add a consume-charges flag on cast that zeroes the held charges after the damage is computed.

**Rot Drain Trap** (Siphoning Trap of Pain) · active · confidence low

- PoE: No 3.9 data (the poedb page lists it as a later transfigured gem). It is a chaos variant of Siphoning Trap: a trap whose beams damage and drain enemies while feeding you. From memory, not verified.
- Bob: A chaos ground zone (radius 2.2, 3 s) with 50% poison chance and a 1% life leech; as with Drain Trap, the per-enemy feeding is just a small leech.
- Missing: `regen_per_affected_enemy`
- Repair: Same as Drain Trap: owner regen scaling with enemies in the zone.

**Carrion Colossus** (Summon Carrion Golem) · active · confidence high

- PoE: A support-minion golem: it gives your non-golem minions added physical damage and hits harder for each minion near it, so it is a minion-build amplifier.
- Bob: Adds flat physical damage to the character's own hits through ownerMods; minion damage comes only from the minionDamage multiplier (src/sim/minions.ts), so the added damage never reaches minions and the per-minion bonus is absent.
- Missing: `minion_added_damage`, `damage_per_nearby_minion`
- Repair: Add a minion added-damage stat that tickMinions reads, and a per-nearby-minion more-damage on the golem.

**Whirring Motes** (Summon Skitterbots) · active · confidence medium

- PoE: Two skitterbots that trigger your traps and detonate your mines (re-arming them), grant more trap and mine damage, and add chill and shock auras; a trap/mine enabler.
- Bob: Two damageless follower motes (dmg 0, inert in tickMinions) and flat shock/chill effect and 10% shock chance on the owner; the trap/mine damage bonus and mine re-arm are absent.
- Missing: `trap_mine_damage_more`, `mine_rearm`
- Repair: Add a more-damage mod for trap and mine skills gated on the motes being summoned and let mines re-arm while the motes stand.

**Wake Blades** (Animate Weapon) · active · confidence medium

- PoE: Animates weapons you found into timed minions that use the item's stats; you feed it good drops.
- Bob: Summons 2-5 generic blades for 37 s with minion damage from the gem level; the animated item and its stats are not involved.
- Missing: `animate_item`
- Repair: Source the blades' damage from a chosen or equipped weapon item.

**Shadow Quiver** (Blink Arrow) · active · confidence medium

- PoE: Fire an arrow, teleport to where it lands and leave a clone at your old spot for a few seconds; mobility plus a decoy/damage clone on a 3 s cooldown.
- Bob: Summons a stationary shadow archer clone for 3 s beside you; the player never teleports (no travel or blink in the definition), though the clone is kept.
- Missing: `teleport_to_target`
- Repair: Add the blink utility alongside the summon so the player moves to the target while the clone stays behind.

**Bone Ward Rite** (Bone Offering) · active · confidence low

- PoE: Consumes a corpse (and more corpses for longer duration) to give your minions attack and spell block with life recovery on block.
- Bob: A rally-policy buff on the character: 25-35% attack and spell block for 8 s; no corpse, no minion buff (minions get block only from minionBlock gear), so the minion-protection role is lost.
- Missing: `minion_buff`, `consume_corpse`, `duration_per_corpse`
- Repair: Apply the block (and life on block) to live minions and let nearby corpses extend its duration. I am unsure whether the 3.9 effect also covers the player.

**Flesh Surge Rite** (Flesh Offering) · active · confidence low

- PoE: Consumes a corpse to give your minions attack, cast and movement speed, with more corpses extending it.
- Bob: A rally-policy buff on the character: 20-30% attack/cast speed and 20-29% move speed for 8 s; the corpse is unused and minions do not receive it.
- Missing: `minion_buff`, `consume_corpse`, `duration_per_corpse`
- Repair: Apply the speed buff to minions and add corpse-based extension. Unsure whether the real effect also covers the player.

**Spirit Ward Rite** (Spirit Offering) · active · confidence low

- PoE: Consumes a corpse to give your minions energy shield, chaos damage and elemental resistances, scaling with corpses consumed.
- Bob: A rally-policy buff on the character: gain physical as chaos and all-elemental resistance for 8 s; no energy shield, no corpse and no minion benefit.
- Missing: `minion_buff`, `consume_corpse`, `energy_shield_per_corpse`
- Repair: Apply the resistances, chaos gain and an energy shield bonus to minions, scaling with corpses consumed.

**Storm Halo** (Wrath) · active · confidence medium

- PoE: Aura (50% reserved) that adds lightning damage to attacks and gives spells a more-lightning-damage multiplier (15-21%); the multiplier is why lightning casters take it.
- Bob: Reserves 50% mana and adds flat lightning min/max as base damage (engine reads damage.min/max base in addedFlats; spells get it scaled by effectiveness). No spell-damage multiplier.
- Missing: `aura_more_damage_multiplier`
- Repair: Add a damage more mod (lightning, spell tag) to the aura's mods alongside the added flat damage.

**Frost Halo** (Hatred) · active · confidence medium

- PoE: Aura (50% reserved) giving 16-25% of physical damage as extra cold plus 14-18% more cold damage; the more-cold multiplier makes it good for non-physical cold builds too.
- Bob: Reserves 50% mana and adds gain.physical.cold (read by convertChunks, so it works). No more-cold-damage multiplier.
- Missing: `aura_more_damage_multiplier`
- Repair: Add a more cold damage mod (damageTypes cold) to the aura.

**Arcane Ward** (Discipline) · active · confidence high

- PoE: Reserve mana for flat energy shield plus 30% increased ES recharge rate, so ES builds recover faster.
- Bob: Reserves 35% mana for flat ES only. The engine does have an esRechargeRate stat (defence.ts) that this aura never sets, so the recharge half is missing.
- Missing: `aura_secondary_stat`
- Repair: Add an esRechargeRate inc mod (about 30) to the aura's mods.

**Fervent Halo** (Zealotry) · active · confidence medium

- PoE: Aura giving more spell damage and increased spell crit chance, plus a 10% chance on hit vs rare/unique to create Consecrated Ground (8 s) that regenerates life for standing allies and weakens curses on them.
- Bob: Reserves 50% mana for more spell damage and inc spell crit chance (tags subset check works). The consecrated ground (a defensive ground effect and an offensive-aura rider) is dropped; the engine has no ground-effect conditions.
- Missing: `ground_effect`, `trigger_on_event`
- Repair: Add a small on-hit chance vs rare/unique that grants a timed life-regen buff (self_buff_on_use style), standing in for the consecrated ground.

**Rimeplate** (Arctic Armour) · active · confidence high

- PoE: Reserved buff that cuts physical and fire hit damage only while stationary, chills (30% slow) any attacker that hits you, and lays chilled ground when you move. A stand-and-tank defence that punishes melee attackers.
- Bob: Reserves 25% mana for a flat all-type hitTaken reduction at all times. The engine has a stationary condition (sim combat.ts) and nothing to chill attackers on being hit; neither is used.
- Missing: `condition_stationary_use`, `chill_attackers_on_hit`, `ground_effect`, `damage_type_scoped_reduction`
- Repair: Gate the reduction on the stationary condition for physical and fire only, and add a hit-taken trigger that chills the attacker.

**Searing Mantle** (Righteous Fire) · active · confidence high

- PoE: No-reservation toggle: you burn yourself for a large share of life per second (fire damage mitigated by your fire resistance, offset by regen) while enemies near you take fire damage that scales with your damage modifiers, and spells deal more damage. Defines a commit-to-regen-and-fire-res build.
- Bob: auraBurn and selfBurn are real (sim/utility.ts tickAuraBurn): a fixed share of max life per second to enemies within 2.8 tiles (their resists apply) and a flat self drain that cannot kill. Self damage ignores fire resistance and ES; the enemy damage is not scaled by any damage modifier; the spell more mod works.
- Missing: `self_damage_through_resists`, `aura_burn_scaled_by_damage_mods`
- Repair: Run the self burn through the player's fire resistance and damage-taken mods, and scale the enemy burn with fire/DoT modifiers.

**Cinder Herald** (Herald of Ash) · active · confidence high

- PoE: 25% reserved herald: physical gained as fire, more spell fire damage, and when you kill any enemy, overkill damage burns the enemies near it. Rewards big hits and dense packs, needs no ignite.
- Bob: Gain-as-fire and spell fire more are real. The kill effect only spreads an existing ignite from a dead burning enemy (sim/triggers.ts spread); it needs an ignited victim, so non-ignite builds get nothing, and there is no overkill scaling.
- Missing: `overkill_damage_on_kill`, `trigger_on_event`
- Repair: On any kill, ignite nearby enemies for a share of the dead enemy's overkill damage (needs the overkill amount passed to the kill event).

**Storm Herald** (Herald of Thunder) · active · confidence medium

- PoE: 25% reserved herald: added lightning damage; killing a shocked enemy makes lightning bolts strike enemies around you for 6 s. The reward is a lasting barrage after each shocked kill.
- Bob: Added lightning damage works. Killing a shocked enemy fires one lightning explosion (7% of its max life, radius 3) at its corpse and nothing more; no lasting bolts around the player.
- Missing: `timed_burst_on_kill`
- Repair: On shocked kill, start a 6 s timer that strikes random nearby enemies every fraction of a second.

**Sour Herald** (Herald of Agony) · active · confidence high

- PoE: 25% reserved herald: 20% chance to poison and 10% more poison damage; poisoning builds Virulence (cap 40, decays faster the more you hold), which buffs an Agony Crawler minion (attack speed, physical damage, added physical) that dies when Virulence runs out.
- Bob: Only the buff half: chance.poison 20 and a more poison damage mod (the engine reads both). No Virulence resource and no crawler minion, though the engine has summon utilities and minions.
- Missing: `stacking_resource_decay`, `minion_command`, `spend_charges_for_effect`
- Repair: Add a Virulence stack gained on poison and decaying, plus an owner-linked crawler minion whose damage scales with the stack.

**Brittle Doom** (Elemental Weakness) · active · confidence medium

- PoE: Cast curse that lowers all elemental resistances of enemies in an area for the duration.
- Bob: A hex-kind gem that only works when Hexing Strikes sits in the same item as the primary skill; it is not castable (other curses like Tinder Curse are utility casts). The resistance reduction is real (hexTotals res, applied to enemies hit).
- Missing: `cast_curse`, `curse_area_application`
- Repair: Convert it to an active spell with utility.kind curse like the other curses, keeping Hexing Strikes as an alternative route.

**Leaden Limbs** (Temporal Chains) · active · confidence medium

- PoE: Cast curse that slows enemies' actions and also makes buffs and ailments on them expire more slowly (40% slower, so their debuffs and effects on them last longer), a utility curse for control and DoT builds.
- Bob: Hex-kind gem usable only via Hexing Strikes on hit. The slow is real (speedMult drives action timing and movement in the sim). The slower expiry of effects on enemies (Bob's own ailments and hexes) is absent.
- Missing: `cast_curse`, `effect_expiry_slow`
- Repair: Make it castable and scale tick-down of ailments and hexes on cursed targets by the curse's slow factor.

**Feeble Grip** (Enfeeble) · active · confidence medium

- PoE: Cast curse that reduces enemy damage dealt, accuracy and critical strike chance and multiplier, a defensive curse against hard hitters.
- Bob: Hex-kind gem usable only via Hexing Strikes on hit. Only the less damage dealt effect is real (damageMult in applyHit); accuracy, crit chance and crit multiplier reduction are missing.
- Missing: `cast_curse`, `enemy_accuracy_crit_reduction`
- Repair: Make it castable and add accuracy and crit penalties on cursed monsters.

**Open Wounds** (Vulnerability) · active · confidence medium

- PoE: Cast curse: enemies take increased physical damage and increased physical damage over time, and your attacks against them can bleed and maim.
- Bob: Hex-kind gem usable only via Hexing Strikes on hit; physical vulnerability is real (hexVuln in rawHit and hits). No physical DoT vulnerability, no bleed-and-maim on attack, and the engine has no maim at all.
- Missing: `cast_curse`, `maim`, `bleed_on_hit_vs_cursed`, `damage_over_time_taken_increase`
- Repair: Make it castable, add a physical DoT taken mod, and a self mod giving bleed chance against cursed targets (maim needs a new slow primitive).

**Kindle** (Immolate) · support · confidence medium

- PoE: Added fire damage against burning (ignited) enemies: rewards stacking ignite from another source.
- Bob: Gives its own 30% ignite chance and more ignite damage; no added flat fire and no dependence on an already-ignited target. The engine has the targetIgnited condition, but the gem does not use it.
- Missing: `conditional_added_damage`
- Repair: Add flat fire damage under the targetIgnited condition and drop the self-ignite chance.

**Deep Chill** (Bonechill) · support · confidence medium

- PoE: Larger chill effect, and chilled enemies take increased cold damage scaled by the chill (the main reason to use it).
- Bob: Only the chill effect increase is present (read in skill.ts). Chills do not make the target take more cold damage.
- Missing: `ailment_grants_damage_taken`
- Repair: When the supported skill chills, apply an increased-cold-damage-taken effect to the target tied to the chill.

**Tinderbox** (Combustion) · support · confidence medium

- PoE: Chance to ignite, more fire damage, and ignited enemies have reduced fire resistance (the resistance shred).
- Bob: Chance to ignite and more fire damage; the fire resistance reduction on ignited enemies is missing. Target resistance shifts exist (curses) but are not applied.
- Missing: `ailment_applies_res_shift`
- Repair: Apply a fire-resistance shift to enemies the skill has ignited.

**Knife Range** (Close Combat) · support · confidence medium

- PoE: More melee damage to close enemies, scaling with distance; usable only with axes or swords; hits give a short speed buff for travel skills (poedb).
- Bob: Flat more damage to enemies within 2 tiles plus radius; no weapon restriction, no hit buff, no distance gradient. The damage trade works, but it loses its restriction-for-power.
- Missing: `weapon_restriction`, `self_buff_on_hit`
- Repair: Restrict to axe and sword attacks (needs a support-side weapon filter).

**Slow Rot** (Decay) · support · confidence medium

- PoE: Hit inflicts a flat chaos damage over time for 10 s regardless of hit damage or type; works for any hitting skill.
- Bob: Modelled as 100% poison with +400% duration. Poison needs physical or chaos hit damage (elemental-only skills deal nothing) and scales with hit damage and poison stacks, unlike a flat DoT.
- Missing: `flat_dot_on_hit`
- Repair: Add a flat, level-based chaos DoT that ignores hit damage.

**Stagger Resolve** (Endurance Charge on Melee Stun) · support · confidence medium

- PoE: Melee stun grants an endurance charge, and supported skills deal more damage per endurance charge.
- Bob: Stun grants a Grit charge (rolled on stun events); no more damage per charge.
- Missing: `per_charge_damage`
- Repair: Add a more-damage multiplier per Grit charge on the supported skill.

**Split Shot** (Fork) · support · confidence medium

- PoE: Projectiles fork into two on first hit if they do not pierce, covering enemies beside or behind.
- Bob: Just +1 projectile in the starting fan with a small damage change; nothing happens on hit. The shared hit-list means it only adds coverage (DESIGN.md decision 2026-10-06; src/sim/actions.ts fire(): all projectiles of one use share one hit list).
- Missing: `projectile_split`
- Repair: On first hit, spawn two projectiles at an angle from the impact point.

**Wide Salvo** (Greater Volley) · support · confidence high

- PoE: Four extra projectiles fired in parallel lanes. They cannot hit the same target. (Row corrected after checking the 3.9 wiki; see the erratum.)
- Bob: +4 projectiles in a fan at less damage; the once-per-target rule is right, the parallel lanes are not modelled.
- Missing: `parallel_projectiles`
- Repair: A parallel placement option for projectile supports.

**Frost Fang** (Ice Bite) · support · confidence high

- PoE: 15% freeze, added cold damage that grows with frenzy charges, and charge gain when killing a frozen enemy.
- Bob: 15% freeze, flat added cold, and a chance to gain Fervour on any kill. The cold does not grow with charges (despite the port note) and the kill need not be of a frozen enemy.
- Missing: `per_charge_added_damage`, `kill_condition_on_charge_gain`
- Repair: Add cold damage per Fervour charge and restrict the charge to kills of frozen enemies.

**Firm Hold** (Iron Grip) · support · confidence high

- PoE: Strength's melee damage bonus also applies to projectile attacks.
- Bob: Only some inc projectile damage. The engine has a 'strongarm' flag that does exactly this (character.ts), but the gem does not grant it.
- Missing: `attribute_bonus_extension`
- Repair: Give the support the strongarm flag as a global mod.

**Steel Resolve** (Iron Will) · support · confidence high

- PoE: Strength's melee damage bonus also applies to spell damage.
- Bob: Only some inc spell damage; no attribute bonus extension (and no flag in the engine for spells).
- Missing: `attribute_bonus_extension`
- Repair: Add a strength-to-spell-damage flag in character.ts and have the support grant it.

**Triple Cadence** (Multistrike) · support · confidence medium

- PoE: Melee attack repeats twice, each repeat on a random enemy, with damage ramping up and a speed bonus.
- Bob: Sets repeats 2 with speed and damage boosts. The sim lands echoes at 0.6+0.25n of the use time, so the second echo (1.1 of the use) comes after the action ends and appears never to fire (calc counts 3 lands; read from code, not run). Damage 'more' is positive (+12..25), not a penalty; no ramp; same target.
- Missing: `repeat_ramp`, `repeat_random_target`
- Repair: Fix echo timing for more than one repeat, make damage ramp per repeat, pick a new target.

**Close Quarters** (Point Blank) · support · confidence medium

- PoE: Projectiles deal more damage close up and less far away.
- Bob: More projectile damage against nearby enemies only; no far-range penalty, so no trade. The engine has a closeQuarters flag and distanceMult (1.5 down to 0.5), unused by the gem.
- Missing: `distance_scaled_damage`
- Repair: Grant the closeQuarters flag so the distance curve applies.

**Freed Rot** (Unbound Ailments) · support · confidence medium

- PoE: Longer ailment duration, more ailment damage, stronger shock/chill and non-damaging ailments.
- Bob: Duration and damage for ignite, bleed, poison only; non-damaging ailment effect and shock/chill duration are not included (the engine has the stats).
- Missing: `non_damaging_ailment_effect`
- Repair: Add effect.shock/effect.chill/duration.shock stats.

**Foul Brew** (Vile Toxins) · support · confidence high

- PoE: More poison damage, and hits deal more per poison stack on the target, up to a cap.
- Bob: More poison damage plus a flat 12% under targetPoisoned; no per-stack scaling, contrary to the port note.
- Missing: `damage_per_stack`
- Repair: Make the hit bonus scale with the target's poison count up to a cap.

**Twin Salvo** (Volley) · support · confidence high

- PoE: Two extra projectiles fired in parallel lanes (a wider frontage than a fan), minor penalty. They cannot hit the same target. (Row corrected after checking the 3.9 wiki; see the erratum.)
- Bob: +2 projectiles in a fan at less damage; the once-per-target rule is right, the parallel lanes are not modelled.
- Missing: `parallel_projectiles`
- Repair: A parallel placement option for projectile supports.

**Wither Mark** (Withering Touch) · support · confidence medium

- PoE: Hits apply stacking wither (chaos damage taken increases per stack) plus physical as extra chaos.
- Bob: Physical as chaos plus a flat 10% chaos penetration instead of the stacking debuff.
- Missing: `stacking_debuff_on_hit`
- Repair: Add a per-hit stacking chaos-vulnerability debuff to enemies.

**Merciless Cadence** (Ruthless Support) · support · confidence medium

- PoE: Every third use of the melee attack is a big hit: much more damage, a longer stun, and extra bleed damage; a rhythm/burst support with a counter.
- Bob: Averaged into a permanent more melee damage and more bleed damage (value is exactly one third of the PoE big-hit bonus). No counter, no big hit, no stun component.
- Missing: `every_nth_use_bonus`, `big_hit_stun_override`
- Repair: Count melee uses of the supported skill in the sim and apply the big-hit mods (damage, bleed, stun duration) on every third; keep the sheet on the average.

**Charged Breath** (Infused Channelling Support) · support · confidence medium

- PoE: Channelling support that shields you from damage while you channel and grants more damage for a few seconds after channelling stops.
- Bob: Only a flat more damage for channelling skills. The barrier (less damage taken while using the skill) and the post-channel timing window are gone; the port note admits the barrier is dropped.
- Missing: `damage_taken_while_using_skill`, `buff_after_channel_ends`
- Repair: Give the supported skill a 'while using it' defence condition (less damage taken during its action) and a short damage buff after a channelled burst ends.

**Chained Charges** (Blastchain Mine Support) · support · confidence medium

- PoE: Mines that detonate in a chain: each mine sets off the next a moment later, and every detonation in the cascade adds more damage; the identity is the sequential detonation bonus.
- Bob: Just adds the mine type and a flat damage penalty. Mines auto-detonate on their own when an enemy is within 3.5 tiles (arm 0.6 s); there is no cascade, no neighbour triggering, no per-detonation bonus. Description ('set one another off') is not implemented.
- Missing: `mine_detonation_cascade`
- Repair: When one mine goes off, detonate the other mines of the set in order a fraction of a second apart, each adding a per-detonation more-damage step.

**Heavy Charge** (High-Impact Mine Support) · support · confidence low

- PoE: Mine support with less base damage but a damage bonus (double-damage chance) against enemies near mines; reconstructed from stat ids, exact wording unsure.
- Bob: Adds mine, less damage, and 40% more damage under the targetNearby condition. But deployed shots build their profile with playerConds(w, target), and targetNearby is tested between the target and the player (2 tiles + radius), not between the target and the mine, so for a ranged build the bonus is almost never on and the gem is a plain mine with a damage penalty.
- Missing: `deployable_relative_conditions`, `nearby_deployable_aura`
- Repair: Evaluate target-proximity conditions from the deployable's position in shoot(), or count other mines near the target as the bonus.

**Swift Snares** (Advanced Traps Support) · support · confidence low

- PoE: Three-in-one trap support: faster throwing, faster trap cooldown recovery, and longer trap/effect duration.
- Bob: Only the throw speed (as cast/attack speed inc). The duration component is dropped even though deployable lifetime does scale with skillDuration (deploy.ts), and Bob has no trap cooldown at all.
- Missing: `trap_cooldown`, `skill_duration_bonus`
- Repair: Add skillDuration to the mods so traps last longer; a trap cooldown system would be needed for the third stat.

**Dazzle** (Blind Support) · support · confidence low

- PoE: Hits can blind enemies so they miss you more; a defensive status that does not use your curse slot.
- Bob: A global hexOnHit.feebleGrip: every hit by any of the character's skills applies a 'less damage dealt' hex. It is an acceptable proxy for the defensive value but shares the single hex slot (BASE_HEX_LIMIT 1, sorted by effect in deriveHexes) with real curses and gets boss/hexWarded reductions, and applies to all the character's skills, not just the supported one.
- Missing: `non_hex_debuff_slot`, `enemy_accuracy_debuff`
- Repair: Add a separate status layer on enemies for blind/maim/flee that does not count against hex limit, scoped to the supported skill; blind could reduce monster accuracy.

**Rout** (Chance to Flee Support) · support · confidence medium

- PoE: Hits can make enemies flee: they run away from you and stop attacking for a few seconds.
- Bob: Global hexOnHit.leadenLimbs: hit enemies are slowed (reduced action and movement speed), always, using the one hex slot. Slowing cuts incoming damage, but fleeing (leave melee, break aggro) is gone, and it competes with curses for the hex slot.
- Missing: `monster_flee_ai`, `non_hex_debuff_slot`
- Repair: Give monsters a flee state (fleeT already exists for thieves) triggered by a chance on hit from this support.

**Ward Siphon** (Energy Leech Support) · support · confidence low

- PoE: Hits leech energy shield as a share of damage dealt, with more damage while on full ES and while leeching ES; ES sustain that scales with damage.
- Bob: Flat esOnHit per hit (does not scale with damage) plus more damage while ES is full. No ES leech exists in the engine (leechLife/leechMana only), and the 'while leeching' bonus is gone.
- Missing: `leech_es_from_damage`, `damage_while_leeching`
- Repair: Add an ES leech channel that works like life leech, and a more-damage-while-leeching-ES condition.

**Cindering** (Immolate Support) · support · confidence high

- PoE: Adds fire damage only against burning (ignited) enemies; a payoff for ignite builds, usable on any skill that hits.
- Bob: Adds fire damage unconditionally to attacks only, plus 20% ignite chance (which creates its own burning enemy). The condition on the target being ignited is gone although the targetIgnited condition exists in the engine, and the gem is restricted to attacks.
- Missing: `conditional_added_damage_vs_ignited`, `support_for_spells`
- Repair: Add condition targetIgnited to the damage.min/max mods and drop the attack restriction (data-only).

**Wildfire Seed** (Ignite Proliferation Support) · support · confidence medium

- PoE: Ignites you inflict spread to enemies within a radius while they burn; one ignited enemy lights a pack, plus more ignite damage.
- Bob: More ignite damage and an extra trigger that spreads the strongest ignite only when an ignited enemy is killed (triggers.ts spread). Nothing spreads while the enemy lives, so it does nothing against a boss or a pack until a kill happens. Trigger radius 3 tiles.
- Missing: `ailment_proliferation_on_apply`
- Repair: Spread the ignite to enemies in radius at the moment it is applied (or periodically while it burns), not only on death.

**Lightheart** (Inspiration Support) · support · confidence medium

- PoE: Cheaper skill; casting builds Inspiration charges that raise elemental damage and crit chance until a mana-spent threshold clears them. Self-generating.
- Bob: Real 30% cost reduction, but the charge loop is folded into the shared Insight charge and the gem generates none; the per-charge crit and damage bonus only works if another item grants Insight. On its own it is just a cheaper skill.
- Missing: `charges_on_mana_spent`, `own_charge_type_with_reset`
- Repair: Give the gem a chargeOn.cast-style source (or its own charge that gains with mana spent and resets on a threshold).

**Swelling Blast** (Intensify Support) · support · confidence medium

- PoE: Intensity stacks build while you stand and cast, adding area damage; moving loses stacks. A commitment/ramp trade.
- Bob: Flat increased area of effect and more area damage. The stand-still ramp-up and loss on movement are averaged away although a stationary condition exists in the engine.
- Missing: `stack_while_stationary`
- Repair: Make the area damage bonus conditional on the stationary condition or build stacks while not moving.

**Brief Burst** (Less Duration Support) · support · confidence medium

- PoE: Shortens a duration skill's effect for more damage: trade lasting effect for burst (zones, buffs, minions and traps vanish sooner).
- Bob: skillDuration more (negative) and damage more. skillDuration is read for deployable lifetime, timed minions and the calc sheet's ground pulse count, but the sim's ground zones use b.duration / b.interval without the multiplier, and curses/buffs/ailments use other stats, so the downside barely exists in play while the damage bonus does.
- Missing: `skill_duration_scaling_in_sim`
- Repair: Apply profile.skillDuration to zone pulses in the sim and to buff/hex duration, so the shorter-lasting cost is real.

**Lingering Effect** (Increased Duration Support) · support · confidence medium

- PoE: Longer-lasting skill effects (zones, minions, trap and curse durations) with only a mana multiplier cost (poedb 3.27: no damage penalty).
- Bob: skillDuration more plus an invented 15% less damage. Because the sim ignores skillDuration for ground zones, curses and buffs, the benefit works only on deployables and timed minions while the damage penalty always applies; the sheet and the sim disagree for zone skills.
- Missing: `skill_duration_scaling_in_sim`
- Repair: Wire skillDuration into zone pulses and hex/buff duration in the sim; do not add an invented drawback.

**Hamstring** (Maim Support) · support · confidence medium

- PoE: Hits maim enemies: they are slowed and take more physical damage, and the skill deals more physical damage against maimed enemies.
- Bob: More physical damage plus a global hexOnHit.openWounds. The openWounds hex is physical-vulnerability only (hexes.ts fx), so the slow in the description is not implemented. It also shares the single hex slot with curses and with Dazzle/Rout.
- Missing: `maim_movement_slow`, `non_hex_debuff_slot`
- Repair: Apply a maim debuff with both a movement/action slow and phys vulnerability, outside the hex limit, scoped to the supported skill.

**Twin Shadow** (Mirage Archer Support) · support · confidence medium

- PoE: Bow attack summons a mirage archer for a few seconds that fires the same skill at 60% less attack speed and reduced damage; bow-only, an independent extra attacker.
- Bob: repeats +1 at -40 to -31% damage: one echo shot per use from the same spot a moment after the first (a separate fire(), so it can hit the same target again). The mirage's slow independent rate (-60% attack speed), its persistence, its position and the bow-only restriction are lost, making it stronger than PoE's.
- Missing: `persistent_independent_attacker`, `weapon_restriction_on_support`
- Repair: Spawn a timed clone that fires at a fraction of the character's rate from its own position, restricted to bows.

**Veil Cut** (Nightblade Support) · support · confidence medium

- PoE: Critical strikes grant Elusive (evasion/avoidance and speed); while elusive the skill has extra crit chance and multiplier; dagger and claw only. A crit-defence loop.
- Bob: Unconditional crit chance inc and crit multiplier bonus. No Elusive buff (no BuffId for it), no crit-to-elusive-to-crit loop, no dagger/claw restriction. Port note acknowledges Elusive is only 'modelled' as the bonus.
- Missing: `elusive_buff`, `weapon_restriction_on_support`
- Repair: Add an elusive buff (evasion and move speed) granted by buffOn.crit and make the crit bonuses conditional on it; restrict to dagger/claw.

**Double Release** (Unleash Support) · support · confidence medium

- PoE: Seals accumulate over time while you are not casting and are spent to repeat the spell; best on slow, long-delay spells, no benefit if you cast quickly.
- Bob: One repeat on every use at less damage. The seal accumulation (repeats limited by idle time) is replaced by a constant, so fast spells repeat as much as slow ones.
- Missing: `seal_accumulation_while_idle`
- Repair: Make the repeat count depend on time since the last cast (seals per 0.9 s, capped), applied in the sim.

**Standing Curse** (Blasphemy Support) · support · confidence medium

- PoE: Curse becomes a reserved-mana aura that applies to all enemies in an area around you, with no casting.
- Bob: Reserves 35% of mana and the curse is applied as a hex to every enemy the character hits (deriveHexes/applyPlayerHexes). It is an on-hit curse not an aura around the player: enemies not hit are never cursed, there is no radius, and it counts against the one-hex limit.
- Missing: `enemy_aura`
- Repair: Apply the curse to all enemies within a radius of the player while the aura stands (like the existing burning-aura tick).

**Warding Pack** (Meat Shield Support) · support · confidence medium

- PoE: Minions switch to a defensive stance: they take less damage, taunt enemies on hit and stay close to you, damaging enemies near you more; they tank for you.
- Bob: Minion life more, minion damage taken less, minion speed. No taunt on hit (monsters do not target minions except hunters and when held up), no near-you damage bonus, no stance. Minions already follow at 3.5 tiles and body-block, so only the toughness half exists.
- Missing: `taunt_on_hit`, `minion_defensive_stance`
- Repair: Add a taunt effect on minion hits that makes monsters target that minion, and a damage bonus while the target is near the player.

**Elemental Pack** (Elemental Army Support) · support · confidence medium

- PoE: Minions gain elemental resistances and max resistance, deal more elemental damage, and apply exposure to enemies on hit.
- Bob: Only minionDamage more (all damage types, not just elemental). minionBody has fixed resistances per kind and no support modifies them; no exposure on minion hits. The port note's 'shrug off elements' is not implemented.
- Missing: `minion_resistances`, `exposure_on_minion_hit`
- Repair: Pass minion resistance mods into minionBody and apply a resistance-lowering hex on minion hits.

## Faithful gems (155)

The reviewers judged these to keep the reason to use them. Low-confidence ones are marked.

- **Crushing Blow** (Heavy Strike) · active: Melee single-target hit at 150-190% with +25% stun duration and +25% stun damage, both read by the engine (stunDuration and stunDamage in buildProfile). No double-damage chance (the engine has a doubleDamage stat, unused here) and no knockback anywhere in the engine.
- **Reaping Arc** (Cleave) · active: Arc melee (120 degrees, radius 2.2) that hits every enemy in the cone; with two weapons it hits with both hands (the arc branch in fire() loops over all hands, so this one really works). No axe/sword restriction and no dual-wield damage penalty.
- **Split Volley** (Split Arrow) · active: Projectile fan of 3 arrows (+1 per 5 levels) over 30 degrees at 90-120% each, bow only. Because all arrows of one use share a hit list (DESIGN decision 2026-10-06), a single target is hit once per use, so the fan helps only against several targets.
- **Venom Cut** (Viper Strike) · active: Melee strike for claw/dagger/sword with 40% poison chance and 25% more damage to poison (the poison-tagged mod does reach poison damage through ailTags in buildProfile). The 50% physical-to-chaos conversion and dual-wield double strike are absent, but poison is scaled by chaos mods regardless of hit type, so the loop is intact.
- **Flame Bolt** (Fireball) · active: Projectile with explodeRadius 1.2: on first contact it explodes and hits every enemy in the radius (explode() in actions.ts), 25% ignite chance, 240% effectiveness.
- **Arc Chain** (Arc) · active: Chain behaviour: hits the target, then jumps to the nearest unhit enemy in chainRange (4) with line of sight, 2 chains +1 per 5 levels, 10% shock. Every chain deals the same damage, and there is no secondary fork.
- **Drifting Storm** (Ball Lightning) · active: A ground zone placed at the target (radius 2.2, 2 s, pulses every 0.4 s) hitting everything inside with low-effectiveness lightning, 10% shock. It does not move and does not follow the aim line, and the projectile-count supports are inert on it (skill.ts reads projectile count only for projectile behaviours).
- **Rain of Steel** (Bladefall) · active: Ground zone at the target (radius 2.5, 1.5 s, pulses every 0.3 s = 5 volleys) with +100% crit chance. The per-volley widening and damage fall-off are not modelled, so all five hit the same circle at equal strength.
- **Ember Downpour** (Blast Rain) · active: Ground zone at the target with a 0.6 s delay and one pulse at 150-180% (the stacked small explosions folded into one), 100% physical to fire and 15-25% fire penetration, both read by the engine.
- **Viper Lash** (Cobra Lash) · active: Chain attack from dagger/claw, 50% physical to chaos, 30% poison chance, 3 chains +1 per 10 levels, jumping to the nearest unhit enemy in sight. Chaining is instant rather than a travelling projectile.
- **Twin Cut** (Double Strike) · active: Melee strike with repeats 1 (the second blow lands a moment later without wind-up, per updateAction echoes) and 25% bleed chance (bleed is read for attacks). The extra damage against bleeding enemies is absent.
- **Quickening Shot** (Frenzy) · active: Bow/wand attack with chargeOn.hit.fervour 100 (read through the skill's gain mods) and 5% more damage and 5% more attack speed per Fervour charge held (per-stat scaling uses the character's held charges). Charges are Bob's Fervour kind, 10 s, max 3.
- **Ghost Blades** (Ethereal Knives) · active: Spell projectile fan of 10 over 80 degrees at 120% effectiveness. The shared per-use hit list means a lone target takes one knife, so the point-blank shotgun is absent, but the wide fan itself is intact.
- **Ember Hail** (Firestorm) · active: Ground zone at the target (radius 2.6, 2 s, pulses every 0.25 s = 8 hits) with fire spells at low effectiveness and a wide damage spread.
- **Scorch Wave** (Flame Surge) · active: A beam in front (4.5 by 2) with 50-88% more damage when the target is ignited (targetIgnited is a real target condition in the profile mask) and cannotInflictEle so it never ignites. The condition is evaluated for the main target only.
- **Chilling Shard** (Freezing Pulse) · active: Piercing cold projectile with range 5 at 150% effectiveness and a 20% freeze chance. The fade is only the short range; there is no damage or freeze falloff (the falloff field exists in the behaviour but is not set).
- **Glacier Dart** (Frostbolt) · active: Piercing cold projectile (pierce 99, range 9, 160% effectiveness). The projectile moves at the common projectile speed, so it is not slow, and there is no Ice Nova interaction.
- **Rime Spires** (Glacial Cascade) · active: Ground zone as a strip (line 6, radius 1.6) pulsing 5 times at 0.2 s with 60% cold conversion. All five pulses hit the whole strip at once rather than travelling outward.
- **Quake Blow** (Ground Slam) · active: Slam burst (radius 2.6) with a 25% enemy stun threshold reduction (read) and 40-49% more damage to nearby targets (targetNearby condition, within 2 tiles of the caster). Centred on the target rather than a wave in front.
- **Frost Sunder** (Ice Crash) · active: A single slam burst (radius 2.4) at 190-240% with 50% cold conversion and a 10% less-damage malus standing in for the stages. Only one hit lands instead of three, so total damage is lower and the stage radii are absent.
- **Frost Ring** (Ice Nova) · active: Self-centred burst (radius 3.2) with added cold damage conditional on targetChilled (the condition is real). The Frostbolt combo is absent.
- **Frost Quill** (Ice Shot) · active: Bow arrow that explodes in radius 1.4 at impact with 60% cold conversion and +100-195% chill effect (read). The cone behind the target becomes a circular area at the impact.
- **Twin Slash** (Lacerate) · active: Melee arc (150 degrees) that echoes once via repeats:1 (verified in updateAction), with 25% bleed chance and bleed-tagged more damage (verified: ailment chunks take bleed-tagged mods). Always the default Blood Stance.
- **Hurled Steel** (Lancing Steel) · active: Five-projectile fan with 100% impale chance; the engine gives all projectiles of one use a shared hit list, so each enemy is hit once, matching the 'one projectile per enemy' rule. Impale is a real mechanic here (recordImpale/payImpales).
- **Scatter Bolt** (Kinetic Blast) · active: Wand projectile that explodes on impact in a 2.2-tile radius with area scaling; the four clusters are one burst (explosion hits everything in radius, verified in explode()).
- **Storm Arrow** (Lightning Arrow) · active: Chain behaviour with 3 chains over 4 tiles, 50% lightning conversion and shock effect increase; all read by the engine (chain loop in fire(), convertSkill, effect.shock).
- **Crackle Ring** (Lightning Tendrils) · active: Repeated self-centred lightning bursts at 0.25 s cast time with the larger-pulse bonus averaged in as +12% more damage. This is the engine's accepted channel averaging and the average matches (3 normal + 1 at +50%).
- **Mind Drain** (Power Siphon) · active: Five-bolt wand fan with culling strike (real), 20% chance on hit to gain an Insight (power-charge analog) charge (real, rollCharges), and +20% crit chance increase per Insight charge (per: charges.insight is read by the engine). Missing the crit-multiplier per charge, and the gain is not limited to rare/unique targets (chargeOn ignores conditions).
- **Arrow Shower** (Rain of Arrows) · active: A delayed (0.5 s) ground burst of radius 3 at the target for one pulse at 180-220%; the sequence of many arrow hits is folded into one pulse.
- **Static Ring** (Shock Nova) · active: Self-centred burst (radius 3.2) with 20% shock chance and shock effect increase, both read by the engine; the two rings are one burst.
- **Skitter Flash** (Spark) · active · _low confidence_: A five-projectile fan over 140 degrees (range 7) with projectile speed scaling; the erratic wandering and repeated hits are replaced by wide coverage and one hit per target per use.
- **Phantom Toss** (Spectral Throw) · active: A returning projectile (behaviour returns:true: it reverses at max range, resets its hit list and hits again on the way back, verified in updateProjectiles).
- **Rime Drift** (Creeping Frost) · active · _low confidence_: A 3 s cold ground zone at the target pulsing every 0.5 s, with increased chill effect (real: effect.chill is consumed, cold hits can chill). It is stationary and has no projectile or creeping, but the lasting chilling-field loop is there.
- **Blizzard Ring** (Vortex) · active: Primary spell: a 'ground' zone (r2.6, 3 s, pulses every 0.5 s) placed on the target within 6 tiles, with +chill effect; real zone pulses in actions.ts/zones. No cooldown, not centred on the caster, no initial nova, no Frostbolt interaction.
- **Tinder Curse** (Flammability) · active: Utility curse cast by policy: fireSap hex -25..-44% fire res on target and enemies within r3.5 (hexes.ts, real in damage code). The 'chance to be ignited' half is absent; minor.
- **Rime Curse** (Frostbite) · active: coldSap hex: -25..-44% cold resistance in r3.5, working. Freeze-chance-taken half absent.
- **Static Curse** (Conductivity) · active: shockSap hex: -25..-44% lightning resistance in r3.5, working. Shock-chance-taken half absent.
- **Hunt Sigil** (Sniper's Mark) · active · _low confidence_: huntMark hex: character deals 12..25% more projectile damage and +accuracy to the marked, plus 6..15% damage taken. Core projectile-damage-vs-marked loop works.
- **Steadfast Bellow** (Enduring Cry) · active: Utility buff (policy rally, cd 4): cast triggers chargeOn.cast.grit 100 (real: utility cast calls rollCharges 'cast') and lifeRegen 8..60 for 8 s. Charges are one per cast, not scaled by enemy count; no taunt or shared warcry cooldown (utilityReady is per skill).
- **Rallying Roar** (Rallying Cry) · active: Utility buff (rally, cd 4, 8 s): inc damage 24..40 and manaRegenFlat 1.8..14.8, real buff mods behind a condition. Per-enemy scaling averaged; allies/taunt irrelevant.
- **Iron Hide** (Steelskin) · active: Guard utility (policy guard, life<60%, 3 s, cd 8): hitTaken more -35..-50 (real, defence.ts hitTakenMult). Absorb pool becomes a flat reduction; no shared guard cooldown.
- **Quick Step** (Dash) · active: Utility blink (distance 7, cd 2): when the target is out of reach, the player jumps toward it (utility.ts). Gap-closer only; no free aiming, which is the legitimate autobattler adaptation.
- **Skyfall Leap** (Leap Slam) · active: Attack with travel 7 (actions.ts moves the player toward the target) and a slam burst r2 140..170% damage, stun duration inc. 'Stuns full-life enemies' is not implemented and there is no knockback; both are minor.
- **Spinning Dash** (Whirling Blades) · active: Melee attack with travel 7 and a 200-degree arc, weapon restricted. Hits once at the destination rather than along the path, a minor loss.
- **Pyre Totem** (Holy Flame Totem) · active: Totem type: deploy.ts places a totem that shoots 3 projectiles half-converted to fire at enemies in reach, for the totem duration. Consecrated ground and channel are dropped.
- **Quake Totem** (Shockwave Totem) · active: Totem that fires a self-centred burst r3 of physical spell damage on its own. No knockback, which is minor.
- **Lance Bow** (Siege Ballista) · active: Three ballistas (deployCount 2 extra) each fire a single arrow with pierce 9 at range 11 using your bow; totems shoot on their own while the character fights.
- **Mending Totem** (Rejuvenation Totem) · active: A guard-policy buff: cast when life is under 60% and not already up, it gives 6-160 life regen a second for 8 s (cooldown 10 s); it is not a physical totem and minions are not healed, but the regen window matches.
- **Blaze Trap** (Fire Trap) · active: A trap that opens a fire ground zone (radius 2, 1.75 s, hit every 0.25 s) with ignite chance; the burning-ground persistence is kept, only the extra added fire damage versus burning enemies is omitted.
- **Frost Trap** (Ice Trap) · active: A trap that goes off when an enemy steps within range and bursts for 150% effectiveness cold damage in a radius of 2.4.
- **Shrapnel Trap** (Explosive Trap) · active · _low confidence_: A fire/physical blast that also carries a 'repeats' of 3-6. In the sim a repeat re-fires the placement, so one cast lays 1+repeats traps in the same spot that all go off together (src/sim/actions.ts echoes, deploy.ts placeDeployable); the burst count is kept but arrives simultaneously and with no smaller-radius ring.
- **Fire Breath Trap** (Flamethrower Trap) · active: A ground line of fire from the trap toward the triggering enemy that hits every 0.35 s for 3.5 s with +25% damage versus ignited targets; the four-way rotation is reduced to one line and the ignite condition is read once at trigger time.
- **Spire Trap** (Lightning Spire Trap) · active: A ground zone (radius 2.6, 3.5 s, pulse every 0.45 s) of lightning hits with +100-138% crit chance against shocked enemies via the targetShocked condition, which the sim does evaluate.
- **Rumble Trap** (Seismic Trap) · active: A line ground zone (6 long, radius 1.8) that erupts every 0.9 s for 4.5 s, about five waves.
- **Icicle Charge** (Icicle Mine) · active: A mine that goes off when enemies are near and fires five icicles in a 100 degree fan at range 7; the nearby-enemy crit aura and mine-sequence projectiles are omitted.
- **Storm Charge** (Stormblast Mine) · active: A mine that bursts (radius 2.8, 110%) with 20% shock chance and scaled shock effect; the small lightning-taken aura is omitted.
- **Doom Sigil** (Armageddon Brand) · active: A brand put down at the target that pulses a fire burst (radius 2) every 0.75 s at the nearest enemy in reach for 12 s, with ignite chance and more ignite damage; it does not attach to or follow an enemy but the pulse loop is intact.
- **Tempest Sigil** (Storm Brand) · active: A brand that every 0.6 s chains lightning (3 chains) from the nearest enemy in reach with a flat more-damage bonus; attachment is not modelled and the bonus applies to all targets rather than the attached one.
- **Raise Husk** (Raise Zombie) · active: Summons 3-7 zombies with large life, melee reach and splash, followed by a respawn when recast; no corpse is needed (accepted engine divergence).
- **Call Bonewalkers** (Summon Skeletons) · active: Summons 3-8 skeletons for 20 s that run at and strike enemies, resummoned by the utility policy when depleted.
- **Call Furies** (Summon Raging Spirit) · active: Summons 3-8 fast fire spirits for 5 s that rush at enemies with a high attack rate.
- **Stone Colossus** (Summon Stone Golem) · active: One stone golem with big life and splash melee; the owner's life regen (33-105/s) is always on in the sheet whether or not the golem stands, and there is no taunt.
- **Blight Colossus** (Summon Chaos Golem) · active: One chaos golem with splash melee; the owner gets +3-4% physical damage reduction (always on).
- **Ember Colossus** (Summon Flame Golem) · active: One ranged fire golem; the owner gains 15-20% increased damage (always on).
- **Rime Colossus** (Summon Ice Golem) · active: One cold golem; the owner gets 20-30% increased crit chance and accuracy (always on).
- **Storm Colossus** (Summon Lightning Golem) · active: One ranged lightning golem; the owner gets 6-9% increased attack and cast speed (always on); the golem's added-damage aura for minions is omitted.
- **Hallowed Relic** (Summon Holy Relic) · active: A ranged relic minion that shoots enemies while the owner gets 3.5-100 life regen (always on); the on-hit nova trigger and the stronger minion regen are not modelled.
- **Mirror Quiver** (Mirror Arrow) · active: Summons a bow clone for 3 s that shoots enemies; it appears next to the player instead of at the arrow's landing point.
- **Kindling Halo** (Anger) · aura: A 50% mana reserve aura that adds flat fire damage by level to the character's hits; minions are not covered, but the added-damage aura role is intact.
- **Veil of Grace** (Grace) · active: Reserves 50% mana for base evasion, which defence.ts reads. Allies are irrelevant in Bob.
- **Iron Bastion** (Determination) · active: Reserves 50% mana for a more armour mod, which defence.ts reads through db.calc.
- **Clear Mind** (Clarity) · active: Reserves a flat mana amount by level (reserveFlat) and adds manaRegenFlat, which defence.ts reads (scaled by increased mana regen).
- **Quickening Halo** (Haste) · active: Reserves 25% mana and applies attackSpeed, castSpeed and moveSpeed inc mods, all read by the engine.
- **Keen Halo** (Precision) · active: Reserves 35% mana for base accuracy and inc critChance, both read by the profile code.
- **Crushing Halo** (Pride) · active: Reserves 50% mana for a more physical damage mod on the character (starting value, no ramp). The enemy-debuff form is folded into a self buff; for the character's own damage it plays the same.
- **Elemental Warden** (Purity of Elements) · active: Reserves 35% mana for resist.allEle, which defence.ts adds to each element.
- **Ember Ward** (Purity of Fire) · active: Reserves 35% mana for resist.fire and maxResist.fire, both read by defence.ts.
- **Frost Ward** (Purity of Ice) · active: Reserves 35% mana for resist.cold and maxResist.cold, both read by defence.ts.
- **Storm Ward** (Purity of Lightning) · active: Reserves 35% mana for resist.lightning and maxResist.lightning, both read by defence.ts.
- **Vital Halo** (Vitality) · active: Reserves 35% mana for lifeRegenPct, read in defence.ts and applied by the sim regen tick.
- **Malice Halo** (Malevolence) · active: Reserves 50% mana for a more damage mod on the dot tag (ailment contexts carry dot) and increased poison/ignite/bleed durations. Ground/buff durations (skillDuration stat) are not raised, a small gap.
- **Rime Herald** (Herald of Ice) · active: Added cold base damage works. A kill trigger on a frozen enemy (targetHas freeze) explodes for 8% of its max life as cold in radius 2.5, drained through the explosion queue so chains work. Damage is life-based rather than flat, which is a number change.
- **Brute Force** (Melee Physical Damage) · support: More melee physical damage (melee tag, physical type). Melee-tagged mods never reach ailment damage (DESIGN 6.6), so the bleed/poison half of the PoE gem is absent.
- **Swift Assault** (Faster Attacks) · support: Increased attack speed, read by the engine.
- **Quick Cast** (Faster Casting) · support: Increased cast speed, read by the engine.
- **Ember Infusion** (Added Fire Damage) · support: Gain physical as fire, handled by the conversion/gain pipeline (supports attacks only).
- **Channelled Elements** (Elemental Focus) · support: More elemental damage plus the cannotInflictEle flag; calc/combat.ts blocks ignite, shock, chill and freeze. Bleed and poison unaffected.
- **Focused Ruin** (Controlled Destruction) · support: More spell damage and -100% inc crit chance, which the crit multiplier turns into zero crit chance unless other increases stack.
- **Echoing Cast** (Spell Echo) · support: repeats +1 is read by the sim (updateAction fires the spell again 0.25 of the use time later, no extra cost); castSpeed -20% and damage -10% pay for it. Net DPS gain is similar to PoE. Triggered spells do not repeat. No totem/trap exclusion.
- **Volley Split** (Greater Multiple Projectiles) · support: Two extra projectiles in a fan at a damage penalty; a use hits each target once, as in the reference game.
- **Piercing Shot** (Pierce) · support: The pierce stat is read (pierceLeft in updateProjectiles); projectiles pass through and continue.
- **Dense Blast** (Concentrated Effect) · support: aoe -30% (radius is the square root) and more area damage; both read.
- **Wide Blast** (Increased Area of Effect) · support: aoe inc, read as a radius multiplier.
- **Precision Strikes** (Increased Critical Strikes) · support: Increased crit chance plus some crit multiplier (a Bob extra); numbers differ only.
- **Rending Edge** (Chance to Bleed) · support: 25% bleed chance and more bleed damage (bleed tag reaches the ailment calc). No added flat physical.
- **Toxin Coat** (Chance to Poison) · support · _low confidence_: 40% poison chance and more poison damage; no added chaos. Poison is a working ailment in the engine.
- **Bloodthirst** (Life Leech) · support: leech.life 2% for attacks (spells are excluded; PoE allows any hit).
- **Staggering Force** (Stun) · support: Reduces enemy stun threshold and lengthens stun; both read in the stun code.
- **Critical Relay** (Cast On Critical Strike) · support: Trigger on crit with the attack tag, cooldown 0.15, castSocketed: spells in the same item become triggered-only and fire on the player's attack crits. Adds a damage bonus PoE lacks.
- **Wounded Retort** (Cast when Damage Taken) · support: Trigger hitTaken after 30% of max life taken, 0.25 s cooldown (a documented divergence).
- **Venom Seed** (Added Chaos Damage) · support: Added chaos min/max, applied via addedFlats with the attack multiplier or spell effectiveness.
- **Rime Seed** (Added Cold Damage) · support: As Venom Seed, cold.
- **Spark Seed** (Added Lightning Damage) · support: As Venom Seed, lightning with a wide range.
- **Keen Eye** (Additional Accuracy) · support: Flat accuracy, read by hit chance.
- **Rending Thirst** (Bloodlust) · support: Same: chance.bleed -1000 removes the skill's bleeding; more damage under the targetBleeding condition, evaluated live in the sim.
- **Blunt Intent** (Brutality) · support: Same flags (noElementalDamage/noChaosDamage) consumed in buildProfile; more physical.
- **Fanned Flame** (Burning Damage) · support: More ignite-tagged damage, which reaches ignite damage.
- **Frostbreaker** (Cold Penetration) · support: Penetration cold, read by the damage calculation.
- **Mercy Stroke** (Culling Strike) · support: culling flag read in sim/combat.ts at CULLING_SHARE 0.1; plus some damage.
- **Fresh Vigour** (Damage on Full Life) · support: More damage under onFullLife.
- **Lingering Cruelty** (Deadly Ailments) · support: More dot-tagged damage and less hit-tagged damage; both applied separately.
- **Patient Power** (Efficacy) · support: More spell damage and more DoT; duration is not included.
- **Elemental Edge** (Elemental Damage with Attacks) · support: Same more multiplier for elemental types.
- **Swift Flight** (Faster Projectiles) · support: projectileSpeed inc read; projectile damage inc.
- **Ashbreaker** (Fire Penetration) · support: Penetration fire.
- **Bulwark Strikes** (Fortify) · support: buffOn.meleeHit.fortify at 100% (the sim rolls it on melee hits; the buff gives 20% less damage taken for 4 s) plus more melee damage.
- **Tide Gathering** (Arcane Surge) · support: Casting the spell grants the Arcane Tide buff (10% more spell damage, 10% cast speed, regen). No mana-spent threshold and no level scaling, but the buff loop works.
- **Exalted Focus** (Empower) · support: levelBonus is read in character.ts and applied to the skill's level.
- **Kindled Frost** (Cold to Fire) · support: convertSkill and gain handled in convertChunks with ancestry.
- **Deep Winter** (Hypothermia) · support: More damage under targetChilled, cold DoT more, chill effect up; the extra freeze chance is dropped (minor).
- **Skewer** (Impale) · support: chance.impale is read; the impale model exists (impales on the target, hit counter) plus more physical. The impale-effect bonus is not in the mods list.
- **Cruelty Edge** (Increased Critical Damage) · support: critMulti base added.
- **Livewire** (Innervate) · support: Added lightning plus 20% shock chance; the buff after killing a shocked enemy is dropped (secondary).
- **Stormbreaker** (Lightning Penetration) · support: Penetration lightning.
- **Siphon Draught** (Mana Leech) · support: leech.mana is read.
- **Galvanise** (Physical to Lightning) · support: convertSkill/gain physical to lightning.
- **Insightful Crit** (Power Charge On Critical) · support: chargeOn.crit.insight with per-charge more damage reading held charges.
- **Wide Crush** (Pulverise) · support: Same three mods.
- **Lingering Shots** (Slower Projectiles) · support: projectileSpeed down, damage up.
- **Hastened Rot** (Swift Affliction) · support: More dot damage, duration.* -15%.
- **Cruel Flight** (Vicious Projectiles) · support: Same, with the dot bonus applying to all DoT.
- **Void Twist** (Void Manipulation) · support: Same.
- **Triple Shot** (Multiple Projectiles Support) · support: projectiles +2, attack/cast speed +10% more, damage -18% more. The extra arrows fan out and each use hits a given enemy at most once (shared useHits list in sim/actions.ts), so it widens coverage but does not stack on one target; the calc sheet ignores projectile count entirely.
- **Blood Refund** (Life Gain on Hit Support) · support: lifeOnHit base [3,22] on the skill's profile; combat.ts applyHit adds it per enemy hit (capped at life cap). Works as intended.
- **Festering Crit** (Critical Strike Affliction Support) · support: More damage tagged dot, gated on the critRecently condition, plus an extra crit chance bonus. The DoT tag reaches the ailment chunks and critRecently is read from the player's tCrit, so ailments applied soon after a crit hit harder. Approximates 'applied by a crit' with 'recently crit'.
- **Standing Cast** (Spell Totem Support) · support: adds the totem type: the spell is placed 1.5 tiles toward the target and shoots from there every use time for 10 s with the character's numbers (sim/deploy.ts); mana is paid once at placement. While the totem stands the AI uses another skill. Totems are invulnerable and not targeted by monsters (accepted engine simplification).
- **Standing Bow** (Ballista Totem Support) · support: adds totem, deployCount +2 (three standing), damage and attack speed less. Needs an attack the gem marks totemable, excludes melee; the totem fires with the character's profile. Same engine totem model as Spell Totem.
- **Set Snare** (Trap Support) · support: adds trap: placeDeployable lays traps; each goes off once when an enemy is within 1.6 tiles (deploy.ts), lasting 8 s, up to three sets down. Throw speed and trap damage scale with level. Core loop intact.
- **Snare Cluster** (Cluster Traps Support) · support: deployCount +2 with less damage. Every multi-trap throw lands in a ring of radius 1.2 around the target, so the cluster-vs-line geometry difference with Multiple Traps is not modelled, but the number-of-traps-for-damage trade works.
- **Field of Charges** (Minefield Support) · support: deployCount +4 and much slower cast/attack speed; no damage penalty, as in PoE. Mines are laid in a ring and auto-detonate near enemies.
- **Triple Snare** (Multiple Traps Support) · support: deployCount +2 and less damage; identical in effect to Snare Cluster. Line placement is not modelled (ring placement for every cluster), which only matters spatially.
- **Totem Choir** (Multiple Totems Support) · support: deployCount +2 (three totems stand and each shoots every use time) with less damage. Placement is one per cast rather than three at once, minor.
- **Wired Harm** (Trap and Mine Damage Support) · support: damage more [30,49] and -10% cast/attack speed on trap and mine skills; plain stat support and engine reads all stats.
- **Double Set** (Swift Assembly Support) · support: Guaranteed +1 deployCount with 15% less damage, replacing the chance-for-extra roll; the port note says as much. Expected deployments are similar at higher levels; the penalty is an invented drawback.
- **Livewire Snares** (Charged Traps Support) · support: chargeOn.hit.insight and chargeOn.hit.fervour are rolled by the skill's gains each time a trap hit lands (the deployed shot keeps isPlayer, so rollCharges runs); each Insight charge adds crit multiplier via per charges.insight. The frenzy charge's throw-speed bonus is replaced by Fervour's generic speed.
- **Livewire Charges** (Charged Mines Support) · support: Same mechanism as Livewire Snares with critChance per Insight charge. Charges roll on each hit by a mine; works through p.gains.
- **Deep Insight** (Enlighten Support) · support: costMult 0.75 multiplies into the skill's cost along with other supports; the cost is read for the active skill. Auras are never supported by gems in Bob and support multipliers do not raise reservation (DESIGN 2.1), so the aura use of Enlighten is moot by design.
- **Scavenger** (Item Rarity Support) · support: A global itemRarity inc, read at drop time in run/run.ts (db.mult('itemRarity')), active while the support is socketed on a usable skill. Fine.
- **Fury Well** (Rage Support) · support: rageOn.meleeHit 1 per melee hit feeds the engine's rage count (cap 50, decays after 4 s, +1% attack damage, +0.5% attack speed, +0.2% move speed per point). Loop is recognisable. Lost: the 0.4 s per-gain cooldown (an arc hitting five enemies gives five rage) and the skill-specific added-damage-per-rage.
- **Reeling Cast** (Cast when Stunned Support) · support: Trigger on hitTaken: fires after 20% of max life has been taken since the last firing, 0.5 s cooldown, castSocketed for the linked spells (made triggered so they are never the primary). Uses damage taken as a stand-in for stun; the reaction to being hurt is intact.
- **Pack Fury** (Minion Damage Support) · support: minionDamage more; summonMinions stores prof.minionDamage on each minion and attack damage multiplies by it. Works.
- **Hardy Pack** (Minion Life Support) · support: minionLife more is used in minionBody, which sets minion max life; works.
- **Pack Haste** (Minion Speed Support) · support: minionSpeed inc multiplies the minion's movement speed and its attack rate (m.speed in tickMinions). Works.
- **Frenzied Pack** (Feeding Frenzy Support) · support · _low confidence_: Averaged into permanent minion damage and a flat minion speed. The buff's uptime from minion hits is not modelled, but in PoE uptime is high when minions fight, so the net is similar. The aggro radius bonus is irrelevant because minions seek enemies 14 tiles away anyway.
- **Hexing Strikes** (Hextouch Support) · support · _low confidence_: hexOnHit: the hex gems in the same item as the primary skill are applied to enemies hit (deriveHexes). Scoped to the primary skill's item only for choosing the hexes, but they are applied by all of the character's hits, and share the one-hex limit.

---

## Second audit (S14, 2026-10-08)

After the repair plan ([SPIRIT.md](SPIRIT.md)) was built, the gems were audited again by the same process, with reviewers who were **not shown the old verdicts**
or the plan: seven reviewers each took 40 to 51 gems (`tsx scripts/spirit/dump-batches.ts` writes the batches: the 3.9 data, Bob's definition and the
port note), judged each against the code as it stood, and read the 3.9 wiki where it let them (it served a Cloudflare challenge for part of the run, and several
reviewers fell back on the Path of Building numbers; their findings were checked again afterwards).

|                            | Faithful | Drifted | Gutted |   Total |
| -------------------------- | -------: | ------: | -----: | ------: |
| First audit                |      155 |     133 |     38 |     326 |
| Second audit, as reviewed  |  **288** |  **37** |  **1** | **326** |
| After the repairs it found |      316 |      10 |      0 |     326 |

What the reviewers found was mostly small and real: a support whose cooldown recovery never reached its skill (Advanced Traps), two returning projectiles that did
not pierce and so never returned, Arc without its second arc, the trigger of Cast when Stunned, Heavy Strike without its knockback and double damage, Viper
Strike without its chaos conversion, Lacerate without its stance trade, Raise Zombie without its corpse, Greater Multiple Projectiles with half its
projectiles, and a few more. They are repaired (the list, with what was done, is the `disposition` field of
[`docs/coverage/audit2.json`](coverage/audit2.json), which holds all 326 findings). Two of the reviewers' findings were wrong and are recorded as such (they judged
from the later gem of the same name).

Ten gems remain `drifted` in the ledger, each with an `accepted` line that says why: Enhance (no gem quality), four gems that are not 3.9 gems (Cluster Bolt, Ghost Coil,
Siphoning Trap of Pain, Critical Strike Affliction), and five that wait for the user's say, because the repair is large or a choice: Raise Spectre (a spectre keeps only its monster's
damage, rate and range, not its abilities), Mirror Arrow (a clone that uses the character's own bow and gear), Melee Physical Damage (more bleed and poison from
melee hits), Bladefall (volleys that widen and weaken) and Creeping Frost (a projectile that leaves a creeping chilled area).
