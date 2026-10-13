> Research made before the work in docs/SUPPORTS-PLAN.md (2026-10-12), kept as the evidence behind it. Numbers and file references describe the code as it was then.

# Support gem audit: what each support does, and where it does nothing

Read-only audit, 2026-10-12. Nothing under `src/` was changed. Every number below was produced by a throwaway script that imports the
project's own data and applicability functions (`ACTIVE_GEMS`, `SUPPORT_GEMS`, `resolveActive`, `typesAllow`), plus 24 short sim runs
(section 3.6) that confirm the claims that matter. File references are `file:line` at the time of writing.

## 0. Summary

- **121 support gems**: 120 in `SUPPORT_GEMS` (19 hand-written in `src/data/gems.ts`, 101 generated into `src/data/gemsGen.ts`) plus Hexing Strikes (`src/data/gems.ts:1231`, `supports: []`, no mods, a `hexOnHit` flag; it is counted with neither the matrix nor the catalogue tables). No other file defines supports.
  **174 active skills** (+4 item-granted) of which **124 deal damage** and 50 are utility skills (curses, buffs, minions, blinks, banners).
- Acceptance is decided only by skill types (`typesAllow`, `src/data/skillTypes.ts:54`). **Nothing checks that the support's effect can
  happen on the skill's behaviour.** Counting every (support, damaging skill) pair that `typesAllow` accepts gives **8,125 pairs**.
- Twenty-five supports have a main effect that depends on the skill's behaviour kind (projectile count, fork, pierce, chain, area,
  extra targets, shockwave, duration, cascade, repeat). They are accepted in **1,092** pairs. In **268 pairs (25%) the main effect is
  silently ignored ("dead")** and in **12 more it is half ignored ("partly dead")**: **280 pairs, 19 supports, 78 of the 124 damaging skills.**
  The support still costs mana (cost multiplier) and its damage penalty still applies.
- **101 of those pairs are strictly worse than no support** (the upside is dead and a damage or speed penalty is still paid); 33 more are
  "free lunch" (the penalty is dead and the bonus is live, e.g. Lingering Shots on a ground skill).
- The user's bug is the visible tip. The projectile-count family (Volley Split, Twin Salvo, Wide Salvo, Triple Shot, Rolling Volleys, Arrow
  Tempest) is dead on **14 skills** (Arrow Shower, Ember Downpour, Storm Arrow, Rime Splinter, Bolt Cleave, Slag Blow, Prime Splash, Pyre
  Burst, Slag Lob, Hoarfrost Mote, Drifting Storm, Rime Drift, Whirl Shot, Mirror Quiver): 74 dead pairs out of 263.
- Worst offenders by skill: Storm Arrow (13 dead supports), Ember Downpour / Rime Splinter / Bolt Cleave / Slag Blow / Arrow Shower /
  Prime Splash (12 each), Pyre Burst and Slag Lob (10).
- Worst offenders by support: Ricochet (dead on 28 of 49 skills), Split Shot (30 of 48), Piercing Shot (18 of 48), Echoing Blow (20 of 38),
  Brief Burst / Lingering Effect (18 of 56 each), Wide Crush (13 of 41).
- Separate classes found on the way (sections 3.4 to 3.6): utility skills accept 98 of the 120 supports (2,797 pairs, about 2,200 of them
  damage supports with nothing to act on); the calc sheet and the sim disagree for ground-zone duration, Spell Cascade and Echoing Cast
  on deployables; Spell Cascade on a self-centred nova fires three overlapping novas at the caster.
- Cleanest fix for the user's case: let a ground skill that has the projectile tag turn extra projectiles into extra **landing spots on
  one zone** (section 5). It touches one calc line, one sim branch, one tick function, one renderer function, five zone literals, and
  needs no new event type. The rest of the dead pairs are best closed by one **inert-pairing audit test** built from the table in
  section 2 plus data exclusions (section 7).

### Method and assumptions

1. Skills: `ACTIVE_GEMS` resolved at level 20 with `resolveActive` (types = tags + declared types). Item-granted skills (`GRANTED_GEMS`,
   4) are left out. Utility skills (those with a `utility` field) are counted separately because a damage support cannot act on them
   whatever the behaviour.
2. Acceptance: `typesAllow(support, skill.types)` for each pair (supports that add types, e.g. the totem/trap/mine supports, were checked
   pairwise; the fixpoint of `resolveSupports` only matters when several supports are socketed together).
3. Liveness: a hand-built predicate per behaviour-dependent effect (table in section 2), derived from reading the code paths cited there.
   `gougeShot` is treated as a bow skill (a projectile). With another weapon it is a melee thrust (`meleeUnless`, `src/data/gems.ts:76`,
   `src/calc/character.ts:762-768`), so its `fan` rows for Echoing Blow, Shattering Blows and Wide Crush flip to live.
4. Tag gates: a support mod with `tags` is inert when the skill lacks a static tag it needs (ailment/weapon tags are treated as dynamic).
5. Damage-type gates (Frostbreaker on a fire spell, Blunt Intent on a pure fire spell) depend on the build (gear can add or convert), so
   they are reported separately in 3.5 and not in the headline counts.
6. Net-effect numbers (section 4) assume the character already has +200% increased damage and +100% increased speed, which only matters
   for `inc` mods; `more` mods are exact.

## 1. Catalogue of the 120 supports

A support is `{ supports, needs, excludes, adds, costMult, mods, + optional levelBonus / trigger / global / extraTriggers / blasphemy /
limitWeapon / hexOnHit }` (`SupportGemDef`, `src/data/gems.ts:674-704`). `supports` is "any of", `needs` is "all of", `excludes` is
"none of", `adds` types are added to the skill (and can change what other supports accept: `resolveSupports`,
`src/data/skillTypes.ts:77-94`). The mods are `{stat, kind, value}` with `value` a level-1..level-20 pair. A support's mods are
added to the skill's own mod database, so every stat below is read through the skill's profile.

Rough shape of the roster (each support in one primary category below): about 60 are **numbers only** (damage multipliers, flat
added damage, ailment chance, crit/penetration/leech, speed, duration); about 50 **change what the skill does** (projectile count and
shape, area/cascade, repeats, trap/mine/totem sets, triggers, melee gimmicks, charges); 7 are minion-only, 1 is curse-only.
Cost multipliers range from 0.3 (Chained Charges, Heavy Charge) through 1.0 (Firm Hold, Steel Resolve, Standing Curse) to 2.0
(Standing Cast).

Categories: projectile count (6), projectile behaviour (8), damage multiplier (15), flat added damage and conversion (11), ailment
(13), status and control (4), offence stats (11), speed (2), area (5), trap/mine/totem (14), minion (7), curse (1), repeat (5),
trigger (4), melee gimmick (5), charge and resource (3), duration (2), other (4) = 120.

Notation in the tables: `damage more -35..-26 (tag projectile)` means a `more` damage mod worth -35% at gem level 1 and -26% at level
20, applying only to skills with the projectile tag; `(fire)` after a mod means it applies to that damage type; `if X` is a condition.

#### projectile count (6)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| volleySplit | Volley Split | any of [projectile] | 1.5 | projectiles base 4; damage more -35..-26 (tag projectile) |
| twinSalvo | Twin Salvo | any of [projectile]; excl [channelling] | 1.4 | projectiles base 2; projectilesParallel flag 1; damage more -12..-3 |
| wideSalvo | Wide Salvo | any of [projectile]; excl [channelling] | 1.65 | projectiles base 4; projectilesParallel flag 1; damage more -30..-21 (tag projectile) |
| tripleShot | Triple Shot | any of [projectile]; excl [channelling] | 1.5 | projectiles base 2; attackSpeed more 10; castSpeed more 10; damage more -18 |
| rollingVolleys | Rolling Volleys | any of [projectile]; needs [attack]; excl [channelling] | 1.4 | projectiles base 3; damage more -68..-62; attackSpeed more -13; projectilesSequential flag 1 |
| arrowTempest | Arrow Tempest | any of [projectile, bow]; excl [channelling] | 1.4 | projectiles base 4; arrowNova flag 1; damage more -40..-26 |

#### projectile behaviour (8)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| splitShot | Split Shot | any of [projectile] | 1.3 | projectilesFork flag 1; damage more -10..9 |
| piercingShot | Piercing Shot | any of [projectile] | 1.2 | pierce base 2..5; damage more 0..10 (tag projectile) |
| ricochet | Ricochet | any of [projectile, chaining]; excl [channelling] | 1.5 | chains base 2; damage more -30..-11 |
| swiftFlight | Swift Flight | any of [projectile] | 1.1 | projectileSpeed inc 50..69; damage inc 20..29 (tag projectile) |
| lingeringShots | Lingering Shots | any of [projectile] | 1.4 | projectileSpeed inc -49..-30; damage more 20..29 |
| closeQuarters | Close Quarters | any of [projectile]; needs [attack] | 1.2 | closeQuarters flag 1; damage inc 0..38 (tag projectile) |
| firmHold | Firm Hold | any of [projectile, attack]; needs [attack] | 1 | ironGrip flag 1; damage inc 0..38 (tag projectile) |
| twinShadow | Twin Shadow | any of [projectile]; needs [attack]; excl [totem, trap, mine, triggered]; weapon [bow] | 1.4 | mirage.seconds base 4; mirage.less base 40..31; mirage.slow base 60 |

#### damage multiplier (typed or tagged more/inc) (15)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| bruteForce | Brute Force | any of [melee] | 1.4 | damage more 30..49 (tag melee physical); meleeAilmentMore base 30..49 |
| elementalEdge | Elemental Edge | any of [attack] | 1.4 | damage more 35..54 (fire/cold/lightning) |
| bluntIntent | Blunt Intent | any skill | 1.3 | damage more 40..59 (physical); noElementalDamage flag 1; noChaosDamage flag 1 |
| fannedFlame | Fanned Flame | any skill | 1.2 | damage more 35..54 (tag ignite) |
| freshVigour | Fresh Vigour | any of [attack] | 1.3 | damage more 30..49 if onFullLife |
| lingeringCruelty | Lingering Cruelty | any skill | 1.3 | damage more 45..64 (tag dot); damage more -10 (tag hit) |
| patientPower | Patient Power | any skill | 1.3 | damage more 10..20 (tag spell); damage more 15..24 (tag dot) |
| deepWinter | Deep Winter | any skill | 1.2 | damage more 20..39 if targetChilled; damage more 20..39 (tag dot cold); effect.chill inc 20 |
| refineGem | Refine Gem | any skill | 1.15 | damage inc 0..20 |
| steelResolve | Steel Resolve | any of [spell] | 1 | ironWill flag 1; damage inc 0..38 (tag spell) |
| voidTwist | Void Twist | any skill | 1.2 | damage more 20..39 (chaos); damage inc -25 (fire/cold/lightning) |
| channelledElements | Channelled Elements | any skill | 1.3 | damage more 30..49 (fire/cold/lightning); cannotInflictEle flag 1 |
| focusedRuin | Focused Ruin | any of [spell] | 1.3 | damage more 30..49 (tag spell); critChance inc -100 |
| cruelFlight | Cruel Flight | any of [projectile]; needs [attack] | 1.2 | damage more 40..59 (physical); damage more 40..59 (tag dot); attackSpeed more -10 |
| wardSiphon | Ward Siphon | any skill | 1.3 | leech.es base 1.5..1.9; damage more 12..24 if esFull; damage more 20..39 if leechingEs |

#### flat added damage and conversion (11)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| kindle | Kindle | any skill | 1.2 | damage.min base 42..205 (fire) if targetIgnited; damage.max base 63..308 (fire) if targetIgnited |
| cindering | Cindering | any skill | 1.3 | damage.min base 42..205 (fire) if targetIgnited; damage.max base 63..308 (fire) if targetIgnited |
| venomSeed | Venom Seed | any skill | 1.3 | damage.min base 2..137 (chaos); damage.max base 4..205 (chaos) |
| rimeSeed | Rime Seed | any skill | 1.3 | damage.min base 2..150 (cold); damage.max base 4..225 (cold) |
| sparkSeed | Spark Seed | any skill | 1.3 | damage.min base 1..20 (lightning); damage.max base 8..400 (lightning) |
| frostFang | Frost Fang | any skill; excl [totem, trap, mine] | 1.3 | chance.freeze base 15; damage.min base 8..69 (cold); damage.max base 12..103 (cold); damage.min base 2..15 (cold) per charges.fervour; damage.max base 3..23 (cold) per charges.fervour; chargeOn.killFrozen.fervour base 50..69 |
| livewire | Livewire | any skill; excl [trap, mine, totem] | 1.3 | damage.min base 2..40 (lightning); damage.max base 12..520 (lightning); chance.shock base 20; buffOn.killShocked.innervation base 100 |
| emberInfusion | Ember Infusion | any of [attack] | 1.2 | gain.physical.fire base 25..34 |
| galvanise | Galvanise | any skill | 1.1 | convertSkill.physical.lightning base 50; gain.physical.lightning base 10..29 |
| kindledFrost | Kindled Frost | any skill | 1.1 | convertSkill.cold.fire base 50; gain.cold.fire base 10..29 |
| witherMark | Wither Mark | any of [attack]; excl [minion] | 1.4 | gain.physical.chaos base 10..29; status.withered.chance base 25 |

#### ailment (13)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| rendingEdge | Rending Edge | any of [attack] | 1.2 | chance.bleed base 25; damage more 30..49 (tag bleed) |
| toxinCoat | Toxin Coat | any skill | 1.2 | chance.poison base 40; damage more 20..39 (tag poison) |
| rendingThirst | Rending Thirst | any of [melee] | 1.25 | damage more 40..59 (tag melee physical) if targetBleeding; chance.bleed base -1000 |
| deepChill | Deep Chill | any of [cold] | 1.2 | effect.chill inc 25..44; damage more 15..30 (cold) if targetChilled |
| tinderbox | Tinderbox | any skill | 1.2 | chance.ignite base 30..49; damage more 10..29 (fire); ignite.resShift base 10..19 |
| wildfireSpread | Wildfire Spread | any skill | 1.1 | chance.freeze base 20; chance.shock base 20; chance.ignite base 20; duration.ignite inc 0..19; duration.shock inc 0..19; duration.chill inc 0..19; duration.freeze inc 0..19; spread.ele base 1.6..2 |
| wildfireSeed | Wildfire Seed | any skill | 1.3 | damage more 20..39 (tag ignite); spread.ignite base 1.9..2.7 |
| slowRot | Slow Rot | any skill | 1.3 | dot.decay base 120..843 |
| hastenedRot | Hastened Rot | any skill | 1.25 | damage more 25..44 (tag dot); duration.poison inc -15; duration.ignite inc -15; duration.bleed inc -15 |
| freedRot | Freed Rot | any skill | 1.1 | damage more 25..34 (tag dot); duration.poison inc 35..54; duration.ignite inc 35..54; duration.bleed inc 35..54; duration.shock inc 35..54; duration.chill inc 35..54; duration.freeze inc 35..54; effect.shock inc 25..34; effect.chill inc 25..34 |
| foulBrew | Foul Brew | any skill | 1.2 | damage more 30..49 (tag poison); perPoison.more base 5; perPoison.max base 6..9 |
| skewer | Skewer | any of [attack] | 1.3 | chance.impale base 40; damage more 5..15 (physical) |
| hamstring | Hamstring | any of [attack] | 1.15 | damage more 15..30 (physical); status.maim.chance base 30; status.maim.x base 10..14 |

#### status and control (4)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| dazzle | Dazzle | any skill | 1.1 | status.blind.chance base 10; statusDuration inc 0..38 |
| guardBreaker | Guard Breaker | any skill | 1.1 | enemyBlockReduction base 10..20; status.overpowered.chance base 100 |
| rout | Rout | any skill | 1.1 | status.flee.chance base 25..44 |
| staggeringForce | Staggering Force | any of [attack] | 1.15 | stunDuration inc 30..49; enemyStunThreshold base 20 |

#### offence stat (crit, penetration, leech, accuracy, on-hit) (11)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| precisionStrikes | Precision Strikes | any skill | 1.2 | critChance inc 30..49; critMulti base 15..34 |
| crueltyEdge | Cruelty Edge | any skill | 1.3 | critMulti base 75..103 |
| keenEye | Keen Eye | any of [attack] | 1.1 | accuracy base 20..300 |
| frostbreaker | Frostbreaker | any skill | 1.4 | penetration base 18..37 (cold) |
| ashbreaker | Ashbreaker | any skill | 1.4 | penetration base 18..37 (fire) |
| stormbreaker | Stormbreaker | any skill | 1.4 | penetration base 18..37 (lightning) |
| bloodthirst | Bloodthirst | any skill | 1.3 | leech.life base 2 |
| siphonDraught | Siphon Draught | any of [attack] | 1.2 | leech.mana base 2..3.9 |
| bloodRefund | Blood Refund | any of [attack] | 1.5 | lifeOnHit base 3..22 |
| mercyStroke | Mercy Stroke | any skill | 1.1 | cullingStrike flag 1; damage inc 0..38 |
| veilCut | Veil Cut | any of [attack]; weapon [dagger, claw] | 1.4 | buffOn.crit.elusive base 100; critChance base 0.7..1 if elusive; critMulti base 80..99 if elusive |

#### speed (2)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| swiftAssault | Swift Assault | any of [attack] | 1.15 | attackSpeed inc 25..44 |
| quickCast | Quick Cast | any of [spell] | 1.2 | castSpeed inc 20..39 |

#### area (5)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| wideBlast | Wide Blast | any of [area] | 1.4 | aoe inc 30..49 |
| denseBlast | Dense Blast | any of [area] | 1.4 | damage more 35..54 (tag area); aoe more -30 |
| wideCrush | Wide Crush | any of [melee] | 1.4 | damage more 40..59 (tag area); aoe inc 25..34; attackSpeed more -15 |
| swellingBlast | Swelling Blast | any of [area]; needs [spell]; excl [totem, trap, mine, channelling, triggered] | 1.4 | aoe inc 35..54; intensify.more base 10..16; intensify.area base 12; intensify.max base 4 |
| flankingCast | Flanking Cast | any of [cascadable]; excl [totem, trap, mine] | 1.4 | cascade flag 1; damage more -40..-21; aoe inc -25..-16 |

#### trap, mine and totem (14)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| standingCast | Standing Cast | any of [totemable]; needs [spell]; excl [triggered]; adds [totem] | 2 | damage more -35..-26; castSpeed more -30 |
| standingBow | Standing Bow | any of [totemable]; needs [attack]; excl [triggered, melee]; adds [totem] | 1.2 | damage more -50..-41; attackSpeed more -50; deployCount base 2 |
| setSnare | Set Snare | any of [trappable]; excl [triggered, mine]; adds [trap] | 1.1 | damage inc 0..38; attackSpeed inc 0..19; castSpeed inc 0..19 |
| chainedCharges | Chained Charges | any of [mineable]; excl [triggered, trap]; adds [mine] | 0.3 | damage more -35..-25; mine.chain base 5; deploySeconds base 5 |
| heavyCharge | Heavy Charge | any of [mineable]; excl [triggered, trap]; adds [mine] | 0.3 | damage more -30..-20; mine.double base 2; deploySeconds base 5 |
| snareCluster | Snare Cluster | any of [trap] | 1.5 | deployCount base 2; damage more -55..-36 |
| fieldOfCharges | Field of Charges | any of [mine] | 1.2 | deployCount base 4; castSpeed more -65..-60; attackSpeed more -65..-60 |
| tripleSnare | Triple Snare | any of [trap] | 1.4 | deployCount base 2; damage more -50..-31 |
| totemChoir | Totem Choir | any of [totem] | 1.5 | deployCount base 2; damage more -40..-21 |
| wiredHarm | Wired Harm | any of [trap, mine] | 1.3 | damage more 30..49; castSpeed inc -10; attackSpeed inc -10 |
| swiftSnares | Swift Snares | any of [trap] | 1.2 | castSpeed inc 15..34; attackSpeed inc 15..34; cooldownRecovery inc 50..107; skillDuration inc 10..29 |
| doubleSet | Double Set | any of [trap, mine] | 1.2 | deployCount base 1; damage more -15 |
| livewireSnares | Livewire Snares | any of [trap] | 1.3 | chargeOn.hit.insight base 20..30; chargeOn.hit.fervour base 20..30; critMulti base 15 per charges.insight |
| livewireCharges | Livewire Charges | any of [mine] | 1.3 | chargeOn.hit.insight base 20..30; chargeOn.hit.fervour base 20..30; critChance inc 25 per charges.insight |

#### minion (7)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| packFury | Pack Fury | any of [minion] | 1.3 | minionDamage more 25..49 |
| hardyPack | Hardy Pack | any of [minion] | 1.3 | minionLife more 30..49 |
| packHaste | Pack Haste | any of [minion] | 1.2 | minionSpeed inc 25..44 |
| wardingPack | Warding Pack | any of [minion] | 1.3 | minionTaken more -15..-24; minion.defensive flag 1; minion.nearMore base 20..30; minionSpeed inc 10..29 |
| elementalPack | Elemental Pack | any of [minion] | 1.3 | minion.res base 19..29; minion.maxRes base 0..2; minion.eleMore base 20..29; minion.exposure base 10 |
| frenziedPack | Frenzied Pack | any of [minion] | 1.3 | minionDamage more 5..14; minionSpeed inc 15 |
| burningPack | Burning Pack | any of [minion] | 1.3 | minion.burn base 15.6..1316; minion.selfBurn base 40 |

#### curse (1)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| standingCurse | Standing Curse | any of [curse] | 1 | aoe inc 0..76; blasphemy reserve 35% |

#### repeat (spell repeat, multistrike, extra targets, ruthless) (5)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| echoingCast | Echoing Cast | any of [spell] | 1.4 | repeats base 1; castSpeed more -20; damage more -10 |
| doubleRelease | Double Release | any of [repeatable]; needs [spell]; excl [totem, trap, mine, triggered, channelling] | 1.4 | unleash.every base 0.9..0.71; unleash.less base 35..26 |
| tripleCadence | Triple Cadence | any of [melee]; needs [attack]; excl [channelling] | 1.6 | repeats base 2; attackSpeed more 35..44; damage more -20..-10 (tag attack); repeatsRandom flag 1; repeatRamp base 22 |
| echoingBlow | Echoing Blow | any of [melee]; needs [attack]; excl [triggered, channelling] | 1.4 | extraTargets base 2; damage more -19..0 |
| mercilessCadence | Merciless Cadence | any of [melee]; needs [attack]; excl [channelling] | 1.1 | ruthless.more base 75..132; ruthless.bleed base 75..132; ruthless.stun base 0.8 |

#### trigger (4)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| criticalRelay | Critical Relay | any of [spell] | 1.3 | damage more 20..39; trigger on crit (castSocketed) |
| woundedRetort | Wounded Retort | any of [spell] | 1.3 | trigger on hitTaken (castSocketed) |
| slayersEcho | Slayer's Echo | any of [spell]; excl [totem, trap, mine] | 1.4 | trigger on kill (castSocketed) |
| reelingCast | Reeling Cast | any of [triggerable]; needs [spell]; excl [totem, trap, mine] | 1.3 | trigger on stunned (castSocketed) |

#### melee gimmick (5)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| knifeRange | Knife Range | any of [melee]; weapon [sword, axe] | 1.4 | closeCombat.more base 40..59; buffOn.hit.combatRush base 100 |
| shatteringBlows | Shattering Blows | any of [melee]; excl [triggered, totem, channelling]; weapon [mace, sceptre, staff] | 1.4 | shockwave.mult base 160..209.6; shockwave.cooldown base 1 |
| bulwarkStrikes | Bulwark Strikes | any of [melee] | 1.3 | damage more 20..34 (tag melee); buffOn.meleeHit.fortify base 100 |
| staggerResolve | Stagger Resolve | any of [melee] | 1.1 | enemyStunThreshold base 0..19; chargeOn.stun.grit base 100; damage more 4 per charges.grit |
| fury | Fury Well | any of [melee] | 1.3 | rageOn.meleeHit base 1; damage.min base 1..3 (physical) per rage; damage.max base 2..6 (physical) per rage |

#### charge and resource (3)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| glimpseOfCrit | Insightful Crit | any skill | 1.1 | chargeOn.crit.insight base 35..54; damage more 4 per charges.insight |
| lightheart | Lightheart | any skill | 0.7 | chargeOn.use.insight base 100; critChance inc 6..8 per charges.insight; damage more 5..7 (fire/cold/lightning) per charges.insight; inspire.threshold base 122..800 |
| tideGathering | Tide Gathering | any of [spell]; excl [totem, trap, mine, triggered] | 1.3 | surge.threshold base 400..15; buffOn.surge.arcaneSurge base 100; damage more 10..19 (tag spell) if arcaneSurge |

#### duration (2)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| briefBurst | Brief Burst | any of [duration] | 1.2 | skillDuration more -49..-40; damage more 10..19 |
| lingeringEffect | Lingering Effect | any of [duration] | 1.4 | skillDuration inc 45..64 |

#### other (4)

| id | name | accepts | cost x | effects (value at gem level 1..20) |
|---|---|---|---|---|
| exaltedFocus | Exalted Focus | any skill | 1.25 | levelBonus 0..9 |
| deepInsight | Deep Insight | any skill | 0.75 | (none: cost only) |
| scavenger | Scavenger | any skill | 1.1 | global: itemRarity inc 40..59 |
| chargedBreath | Charged Breath | any of [channelling] | 1.4 | damage more 20..39; infuse.after base 1.6..1; infuse.barrier base 8; damage more 10 if infusion |

## 2. Where each stat or flag is consumed, and which behaviour kinds honour it

Behaviour kinds are the `SkillBehaviour` union (`src/data/gems.ts:62-121`): `melee`, `projectile`, `chain`, `burst`, `beam`,
`ground`. Of the 124 damaging skills: 26 melee, 38 projectile, 3 chain, 42 burst, 5 beam, 10 ground.

The profile is built in `src/calc/skill.ts` (`buildProfile`, :372-816). The sim reads it in `src/sim/actions.ts` (`fireEffect`,
:313-592), `src/sim/shots.ts` (`fireProjectiles`, :128-281), `src/sim/supportFx.ts`, `src/sim/deploy.ts`.

| stat / flag (supports that set it) | profile field | consumed at | honoured by | silently ignored by |
|---|---|---|---|---|
| `projectiles` (Volley Split, Twin/Wide Salvo, Triple Shot, Rolling Volleys, Arrow Tempest) | `projectiles` | `skill.ts:800-803` forces **1** unless `behaviour.kind === 'projectile'`; read by `shots.ts:132`, `fields.ts:131` (pods), `shots.ts:186` (shield shards), `character.ts:2027-2044` (sheet) | projectile kind on the normal fan, sequential, nova, mortar, shield (as extra shards), pods paths | ground, burst, melee (incl. strike-then-projectiles `afterHit`), chain, beam; and inside projectile kind the early returns in `shots.ts`: `pulse` (:165), `mirror` (:154), `creep` (:142), `tornado` (:218, fixed three secondaries) |
| `projectilesParallel` (Twin/Wide Salvo) | `projMode.parallel` | `shots.ts:259` only | projectile fan path | everything else; also pods, mortar, shield, nova, pulse, mirror, creep, tornado |
| `projectilesSequential` (Rolling Volleys) | `projMode.sequential` | `shots.ts:233`, sheet `character.ts:2027` | projectile fan path | same list as parallel |
| `arrowNova` (Arrow Tempest) | `projMode.nova` | `shots.ts:190` (checked **before** mortar and tornado, so it overrides them) | any projectile skill except pulse, mirror, creep, shield, pods | all non-projectile kinds |
| `projectilesFork` (Split Shot) | `projMode.fork` | `shots.ts:138`: only when `p.pierce <= 0`; fork resolved in `afterProjectileHit` :375 | non-piercing, non-exploding fan projectiles | every non-projectile kind; projectiles that explode on first contact (`actions.ts:726-731` ends them before the fork); skills with intrinsic pierce (Glacier Dart, Spirit Saw, Phantom Toss, Toxin Circle, Pyre Totem, Blight Hail, Lance Bow); fuse arrows |
| `pierce` (Piercing Shot) | `pierce` | `skill.ts:804`; `shots.ts:102` (`pierceLeft`), `shots.ts:440`; `actions.ts:748` | projectile kind (not mirror/creep/shield/pods/fuse); `afterHit` bolts and blades (via `launch`) | ground, burst, chain, beam, melee thrusts; exploding projectiles (the explosion ends the shot first) |
| `chains` (Ricochet) | `chains` | chain kind loop `actions.ts:474`; projectile kind only if `p.pierce <= 0` (`shots.ts:139`) and the shot does not explode | chain kind; plain fan projectiles | ground, burst, melee, beam; exploding or piercing projectiles; `afterHit` element chains and `bounces` use their own counts |
| `projectileSpeed` (Swift Flight, Lingering Shots) | `projSpeedMult` | `shots.ts:87` (`launch`), `blinks.ts:156` | anything that launches a projectile | ground, burst, chain, melee, beam, pods |
| `closeQuarters` flag (Close Quarters) | `closeQuarters` | `skill.ts:848-851` (`distanceMult`, projectile kind and attack only) | projectile-kind attacks | everything else (its `damage inc projectile` half still applies wherever the tag is present) |
| `aoe` (Wide/Dense Blast, Wide Crush, Swelling Blast, Flanking Cast, Standing Curse) | `radiusMult` | burst `actions.ts:528`, ground :580, beam :551, melee arc :423, `explodeRadius`, and the radius of most `SkillFx` (`skillFx.ts:120,200,252,371,438,482,512,561,864,903,958`), dot `splash`/`carried` | burst, ground, beam, melee arc, exploding projectiles, skills with an area effect | melee thrusts (single target), chain (`chainRange` is never scaled), plain projectiles, cone (`coneBurst` uses fixed `length`) |
| `extraTargets` (Echoing Blow) | `extraTargets` | `supportFx.ts:236-255`, called from the **non-arc melee branch only** (`actions.ts:464`) | melee thrusts | melee arcs (they already hit everything), burst slams, every other kind |
| `shockwave.*` (Shattering Blows) | `shockwave` | `supportFx.ts:212`: `behaviour.kind === 'melee'` | melee kind (arc or thrust) | burst-kind melee slams, everything else |
| `cascade` (Flanking Cast) | `cascade` | `supportFx.ts:258-270`, refires `fireEffect` at two offset aims | burst and ground (type `cascadable`) | not dead, but on `origin: 'self'` bursts (Blizzard Ring) the offset aim is unused: three novas at the caster (3.6) |
| `repeats` (Echoing Cast, Triple Cadence), `repeatsRandom`, `repeatRamp` | `repeats`, `multistrike` | echo loop `actions.ts:170-190`; ramp `supportFx.ts:94-97` | every kind when the player uses the skill directly | deployables: a totem/trap/mine skill repeats its **placement**, not each shot (`deploy.ts:235-266` calls `fire` once). Not dead; semantically different (3.6) |
| `unleash.*` (Double Release) | `unleash` | `supportFx.ts:98-109`, `tickSupports` :133 | all kinds (support excludes totem/trap/mine/triggered/channelling) | n/a |
| `deployCount` (Standing Bow, Snare Cluster, Triple Snare, Totem Choir, Field of Charges, Double Set) | `deployCount` | `deploy.ts:96,177,229`, sheet `character.ts:1495` | totem/brand/trap/mine skills (rules require the type) | n/a (gated by `supports`/`adds`) |
| `mine.chain`, `mine.double`, `deploySeconds` | `mineChain`, `mineDouble`, `deploySeconds` | `deploy.ts:106-111,182,302-329` | mines | n/a |
| `skillDuration` (Brief Burst, Lingering Effect, Swift Snares) | `skillDuration` | leaves/fields/orbs/markers/vortex/bladestorm/geyser/crystal/wall (`fields.ts:114,148,175,688`, `skillFx.ts:238,323,420,535`), `skillDot.seconds` (`skill.ts:555`), minions, totem/brand lifetime (`deploy.ts:111`), buffs (`utility.ts:314`), `bleed/poison.baseDur` (`skill.ts:630,641`) | skills with one of those | ground-zone pulses in the **sim** (`actions.ts:584` ignores it, the sheet `skill.ts:591-594` does not); trap and mine lifetimes (`deploy.ts:111`); plain duration-tagged bursts, beams, volleys, wander projectiles |
| `intensify.*` (Swelling Blast), `ruthless.*` (Merciless Cadence) | `intensify`, `ruthless` | `supportFx.ts:67-93` (`startUse`: **player-direct uses only**) | direct casts | deployed shots, triggered casts |
| `mirage.*` (Twin Shadow) | `mirage` | `supportFx.ts:201`, `shootFrom` | any attack that hits (bow only by `limitWeapon`) | n/a |
| `gain.*`, `convertSkill.*`, `penetration`, `damage ... damageTypes` | `chunks`, `pen` | `skill.ts:318-360`, `:499` | skills that deal the source/target type | skills without the source type (build-dependent, 3.5) |
| everything else (`damage`, `critChance`, `critMulti`, `attackSpeed`, `castSpeed`, ailment chance/duration/effect, leech, `lifeOnHit`, `accuracy`, `status.*`, `enemyBlockReduction`, `cullingStrike`, charges, rage, `minion*`) | various | the generic hit pipeline (`combat.ts` `hit`) and `Character` | all kinds (minion stats need a minion) | n/a |

Two further structural facts:

- `fireEffect` returns early for many `SkillFx` (`actions.ts:329-393`: pattern, wave, castOn, volleys, vortex, markers, stormOrb,
  crystal, wall, pods, geyser, chargedSlam, channel, stacks) before the behaviour switch is reached. So the behaviour kind is not the
  whole story: a projectile-kind skill with `pods` (Venom Shower) ignores parallel/sequential/nova/fork/pierce/chain even though it
  honours the count (`fields.ts:128-159`).
- The sheet and the sim read the same profile, but several support effects exist only in the sim (cascade, extra targets,
  shockwave, mirage, unleash seals, multistrike ramp): `grep` finds none of them in `src/calc/character.ts`.


## 3. Compatibility matrix

### 3.1 Counts

| measure | value |
|---|---|
| damaging skills / supports | 124 / 120 |
| pairs accepted by `typesAllow` (damaging skills) | 8,125 |
| pairs for the 25 supports whose main effect depends on behaviour (modelled below) | 1,092 |
| of those: primary effect **dead** | 268 |
| of those: **partly dead** (some effects ignored, e.g. parallel lanes on pods/mortar/shield) | 12 |
| distinct supports with at least one dead or partly dead pairing | 19 |
| distinct skills with at least one | 78 |
| dead pairs by skill behaviour | melee 70, burst 62, projectile 46 (fan) + 7 pulse + 8 creep + 7 shield + 8 tornado + 9 pods + 5 mortar + 9 mirror, ground 34, chain 13, beam 2 |
| pairs with **no live upside at all** (behaviour or tag), penalty still paid | 135 pairs, 101 of them with a live penalty (strictly worse than no support) |
| "free lunch" pairs (the penalty mod is the dead one, the bonus is live) | 33 (Lingering Shots 11, Brief Burst 18, Dense Blast 4) |
| utility skills (50) x supports accepted | 2,797 pairs, 98 distinct supports (section 3.4) |

"Dead" means every effect the support was authored for is ignored on that skill. "Partly dead" means at least one is ignored. Three
supports are *not* counted as dead anywhere although they have a behaviour dependence: Echoing Cast and Triple Cadence on deployables
(see 3.6, they act on the placement), and Flanking Cast on `origin: 'self'` nova (acts, but wrongly).

Reading guide: for Swift Flight, Lingering Shots and Close Quarters a "dead" pair still keeps its damage mod (`damage inc projectile`,
`damage more`), so those are "main effect dead, side effect live". For Piercing Shot the `damage more 0..10` stays live.

### 3.2 By support

Skill names are followed by the path the skill takes: `[ground]`, `[burst]`, `[melee]`, `[chain]` are the behaviour kind; for
projectile kind the path is `fan` (normal), `pulse`, `creep`, `mirror`, `tornado`, `shield`, `pods`, `mortar` (the early returns in
`shots.ts`/`actions.ts`). A star on a skill (by-skill table) marks a "partly dead" pair.

| support | accepted on | live | partly | dead | dead on (skill, path) |
|---|---|---|---|---|---|
| Split Shot (splitShot) | 48 | 18 | 0 | 30 | Flame Bolt [fan], Drifting Storm [pulse], Ember Downpour [ground], Acid Arrow [fan], Pyre Burst [burst], Rime Splinter [melee], Fuse Arrow [fan], Glacier Dart [fan], Frost Quill [fan], Scatter Bolt [fan], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Splinter Volley [fan], Phantom Toss [fan], Rime Drift [creep], Slag Lob [burst], Blight Hail [fan], Spirit Saw [fan], Ghost Shard [shield], Whirl Shot [tornado], Venom Shower [pods], Toxin Circle [fan], Prime Splash [melee], Hoarfrost Mote [burst], Pyre Totem [fan], Mortar Bow [mortar], Lance Bow [fan], Mirror Quiver [mirror] |
| Ricochet (ricochet) | 49 | 21 | 0 | 28 | Flame Bolt [fan], Drifting Storm [pulse], Ember Downpour [ground], Acid Arrow [fan], Pyre Burst [burst], Rime Splinter [melee], Fuse Arrow [fan], Glacier Dart [fan], Frost Quill [fan], Scatter Bolt [fan], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Splinter Volley [fan], Phantom Toss [fan], Charged Blow [melee], Rime Drift [creep], Slag Lob [burst], Spirit Saw [fan], Ghost Shard [shield], Whirl Shot [tornado], Venom Shower [pods], Toxin Circle [fan], Prime Splash [melee], Pyre Totem [fan], Mortar Bow [mortar], Lance Bow [fan], Mirror Quiver [mirror] |
| Echoing Blow (echoingBlow) | 38 | 18 | 0 | 20 | Reaping Arc [melee], Whirlwind Cleave [burst], Faultline [burst], Quake Blow [burst], Frost Sunder [burst], Twin Slash [melee], Spear Burst [burst], Gouge Shot [fan], Sweeping Cut [melee], Rupture Line [burst], Anvil Drop [burst], Halo Sweep [burst], Blade Wind [melee], Magma Crack [burst], Skyfall Leap [burst], Bulwark Rush [melee], Spinning Dash [melee], Blessed Trail [burst], Snag Lash [melee], Slamming Cairn [burst] |
| Piercing Shot (piercingShot) | 48 | 30 | 0 | 18 | Flame Bolt [fan], Ember Downpour [ground], Acid Arrow [fan], Pyre Burst [burst], Fuse Arrow [fan], Frost Quill [fan], Scatter Bolt [fan], Storm Arrow [chain], Slag Blow [melee], Arrow Shower [ground], Splinter Volley [fan], Rime Drift [creep], Slag Lob [burst], Ghost Shard [shield], Venom Shower [pods], Prime Splash [melee], Hoarfrost Mote [burst], Mirror Quiver [mirror] |
| Brief Burst (briefBurst) | 56 | 38 | 0 | 18 | Rain of Steel [burst], Ember Hail [ground], Faultline [burst], Venom Strike [melee], Skitter Flash [fan], Toxin Circle [fan], Tide of Judgement [beam], Jaws Trap [burst], Blaze Trap [ground], Frost Trap [burst], Shrapnel Trap [burst], Fire Breath Trap [ground], Spire Trap [ground], Bolt Trap [fan], Rumble Trap [ground], Icicle Charge [fan], Mortar Charge [burst], Storm Charge [burst] |
| Lingering Effect (lingeringEffect) | 56 | 38 | 0 | 18 | Rain of Steel [burst], Ember Hail [ground], Faultline [burst], Venom Strike [melee], Skitter Flash [fan], Toxin Circle [fan], Tide of Judgement [beam], Jaws Trap [burst], Blaze Trap [ground], Frost Trap [burst], Shrapnel Trap [burst], Fire Breath Trap [ground], Spire Trap [ground], Bolt Trap [fan], Rumble Trap [ground], Icicle Charge [fan], Mortar Charge [burst], Storm Charge [burst] |
| Wide Salvo (wideSalvo) | 46 | 30 | 3 | 13 | Drifting Storm [pulse], Ember Downpour [ground], Pyre Burst [burst], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Rime Drift [creep], Slag Lob [burst], Whirl Shot [tornado], Prime Splash [melee], Mirror Quiver [mirror] ; partly: Ghost Shard [shield] (parallel lanes ignored), Venom Shower [pods] (parallel lanes ignored), Mortar Bow [mortar] (parallel lanes ignored) |
| Twin Salvo (twinSalvo) | 46 | 30 | 3 | 13 | Drifting Storm [pulse], Ember Downpour [ground], Pyre Burst [burst], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Rime Drift [creep], Slag Lob [burst], Whirl Shot [tornado], Prime Splash [melee], Mirror Quiver [mirror] ; partly: Ghost Shard [shield] (parallel lanes ignored), Venom Shower [pods] (parallel lanes ignored), Mortar Bow [mortar] (parallel lanes ignored) |
| Arrow Tempest (arrowTempest) | 46 | 31 | 3 | 12 | Drifting Storm [pulse], Ember Downpour [ground], Pyre Burst [burst], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Rime Drift [creep], Slag Lob [burst], Prime Splash [melee], Mirror Quiver [mirror] ; partly: Ghost Shard [shield] (arrow nova ring ignored), Whirl Shot [tornado] (+4 projectiles ignored), Venom Shower [pods] (arrow nova ring ignored) |
| Volley Split (volleySplit) | 48 | 34 | 0 | 14 | Drifting Storm [pulse], Ember Downpour [ground], Pyre Burst [burst], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Rime Drift [creep], Slag Lob [burst], Whirl Shot [tornado], Prime Splash [melee], Hoarfrost Mote [burst], Mirror Quiver [mirror] |
| Wide Crush (wideCrush) | 41 | 28 | 0 | 13 | Crushing Blow [melee], Venom Cut [melee], Twin Cut [melee], Twin Blades [melee], Rime Splinter [melee], Rime Mallet [melee], Bolt Cleave [melee], Venom Strike [melee], Gouge Shot [fan], Rime Rebuke [melee], Guarded Strike [melee], Blinking Cut [melee], Guardian Cairn [melee] |
| Triple Shot (tripleShot) | 46 | 33 | 0 | 13 | Drifting Storm [pulse], Ember Downpour [ground], Pyre Burst [burst], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Rime Drift [creep], Slag Lob [burst], Whirl Shot [tornado], Prime Splash [melee], Mirror Quiver [mirror] |
| Shattering Blows (shatteringBlows) | 36 | 24 | 0 | 12 | Whirlwind Cleave [burst], Faultline [burst], Quake Blow [burst], Frost Sunder [burst], Spear Burst [burst], Gouge Shot [fan], Rupture Line [burst], Anvil Drop [burst], Halo Sweep [burst], Magma Crack [burst], Skyfall Leap [burst], Blessed Trail [burst] |
| Rolling Volleys (rollingVolleys) | 31 | 19 | 3 | 9 | Ember Downpour [ground], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Whirl Shot [tornado], Prime Splash [melee], Mirror Quiver [mirror] ; partly: Ghost Shard [shield] (sequential firing ignored), Venom Shower [pods] (sequential firing ignored), Mortar Bow [mortar] (sequential firing ignored) |
| Swift Flight (swiftFlight) | 48 | 37 | 0 | 11 | Ember Downpour [ground], Pyre Burst [burst], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Slag Lob [burst], Venom Shower [pods], Prime Splash [melee], Hoarfrost Mote [burst] |
| Lingering Shots (lingeringShots) | 48 | 37 | 0 | 11 | Ember Downpour [ground], Pyre Burst [burst], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Slag Lob [burst], Venom Shower [pods], Prime Splash [melee], Hoarfrost Mote [burst] |
| Close Quarters (closeQuarters) | 32 | 25 | 0 | 7 | Ember Downpour [ground], Rime Splinter [melee], Storm Arrow [chain], Bolt Cleave [melee], Slag Blow [melee], Arrow Shower [ground], Prime Splash [melee] |
| Dense Blast (denseBlast) | 85 | 81 | 0 | 4 | Storm Quill [fan], Storm Arrow [chain], Venom Strike [melee], Snare Shot [fan] |
| Wide Blast (wideBlast) | 85 | 81 | 0 | 4 | Storm Quill [fan], Storm Arrow [chain], Venom Strike [melee], Snare Shot [fan] |
| Triple Cadence (tripleCadence) | 38 | 38 | 0 | 0 | - |
| Echoing Cast (echoingCast) | 56 | 56 | 0 | 0 | - |
| Swelling Blast (swellingBlast) | 26 | 26 | 0 | 0 | - |
| Double Release (doubleRelease) | 30 | 30 | 0 | 0 | - |
| Flanking Cast (flankingCast) | 9 | 9 | 0 | 0 | - |

Weapon-dependent rows: Gouge Shot (bow assumed). Swift Flight / Lingering Shots / Close Quarters rows keep their damage mod (see 3.1).
Brief Burst and Lingering Effect rows for the five **ground** skills (Ember Hail, Blaze Trap, Fire Breath Trap, Spire Trap, Rumble Trap)
are dead in the sim only: the sheet counts their pulses (3.6).

### 3.3 By skill (78 skills, worst first)

| skill | behaviour (path) | supports accepted but ignored | count |
|---|---|---|---|
| Storm Arrow (stormArrow) | chain (chain) | Volley Split, Piercing Shot, Dense Blast, Wide Blast, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Close Quarters, Lingering Shots, Twin Salvo, Triple Shot, Rolling Volleys | 13 |
| Ember Downpour (emberDownpour) | ground (ground) | Volley Split, Piercing Shot, Ricochet, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Close Quarters, Lingering Shots, Twin Salvo, Triple Shot, Rolling Volleys | 12 |
| Rime Splinter (rimeSplinter) | melee (melee) | Volley Split, Ricochet, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Close Quarters, Wide Crush, Lingering Shots, Twin Salvo, Triple Shot, Rolling Volleys | 12 |
| Bolt Cleave (boltCleave) | melee (melee) | Volley Split, Ricochet, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Close Quarters, Wide Crush, Lingering Shots, Twin Salvo, Triple Shot, Rolling Volleys | 12 |
| Slag Blow (slagBlow) | melee (melee) | Volley Split, Piercing Shot, Ricochet, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Close Quarters, Lingering Shots, Twin Salvo, Triple Shot, Rolling Volleys | 12 |
| Arrow Shower (arrowShower) | ground (ground) | Volley Split, Piercing Shot, Ricochet, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Close Quarters, Lingering Shots, Twin Salvo, Triple Shot, Rolling Volleys | 12 |
| Prime Splash (primeSplash) | melee (melee) | Volley Split, Piercing Shot, Ricochet, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Close Quarters, Lingering Shots, Twin Salvo, Triple Shot, Rolling Volleys | 12 |
| Pyre Burst (pyreBurst) | burst (burst) | Volley Split, Piercing Shot, Ricochet, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Lingering Shots, Twin Salvo, Triple Shot | 10 |
| Slag Lob (slagLob) | burst (burst) | Volley Split, Piercing Shot, Ricochet, Swift Flight, Split Shot, Wide Salvo, Arrow Tempest, Lingering Shots, Twin Salvo, Triple Shot | 10 |
| Venom Shower (venomShower) | projectile (pods) | Piercing Shot, Ricochet, Swift Flight, Split Shot, Wide Salvo*, Arrow Tempest*, Lingering Shots, Twin Salvo*, Rolling Volleys* | 9 |
| Mirror Quiver (mirrorQuiver) | projectile (mirror) | Volley Split, Piercing Shot, Ricochet, Split Shot, Wide Salvo, Arrow Tempest, Twin Salvo, Triple Shot, Rolling Volleys | 9 |
| Rime Drift (rimeDrift) | projectile (creep) | Volley Split, Piercing Shot, Ricochet, Split Shot, Wide Salvo, Arrow Tempest, Twin Salvo, Triple Shot | 8 |
| Whirl Shot (whirlShot) | projectile (tornado) | Volley Split, Ricochet, Split Shot, Wide Salvo, Arrow Tempest*, Twin Salvo, Triple Shot, Rolling Volleys | 8 |
| Drifting Storm (driftingStorm) | projectile (pulse) | Volley Split, Ricochet, Split Shot, Wide Salvo, Arrow Tempest, Twin Salvo, Triple Shot | 7 |
| Ghost Shard (ghostShard) | projectile (shield) | Piercing Shot, Ricochet, Split Shot, Wide Salvo*, Arrow Tempest*, Twin Salvo*, Rolling Volleys* | 7 |
| Venom Strike (venomStrike) | melee (melee) | Dense Blast, Wide Blast, Wide Crush, Brief Burst, Lingering Effect | 5 |
| Hoarfrost Mote (hoarfrostMote) | burst (burst) | Volley Split, Piercing Shot, Swift Flight, Split Shot, Lingering Shots | 5 |
| Mortar Bow (mortarBow) | projectile (mortar) | Ricochet, Split Shot, Wide Salvo*, Twin Salvo*, Rolling Volleys* | 5 |
| Faultline (faultline) | burst (burst) | Echoing Blow, Brief Burst, Lingering Effect, Shattering Blows | 4 |
| Toxin Circle (toxinCircle) | projectile (fan) | Ricochet, Split Shot, Brief Burst, Lingering Effect | 4 |
| Flame Bolt (flameBolt) | projectile (fan) | Piercing Shot, Ricochet, Split Shot | 3 |
| Acid Arrow (acidArrow) | projectile (fan) | Piercing Shot, Ricochet, Split Shot | 3 |
| Fuse Arrow (fuseArrow) | projectile (fan) | Piercing Shot, Ricochet, Split Shot | 3 |
| Frost Quill (frostQuill) | projectile (fan) | Piercing Shot, Ricochet, Split Shot | 3 |
| Scatter Bolt (scatterBolt) | projectile (fan) | Piercing Shot, Ricochet, Split Shot | 3 |
| Gouge Shot (gougeShot) | projectile (fan) | Wide Crush, Echoing Blow, Shattering Blows | 3 |
| Splinter Volley (splinterVolley) | projectile (fan) | Piercing Shot, Ricochet, Split Shot | 3 |
| Rain of Steel (rainOfSteel) | burst (burst) | Brief Burst, Lingering Effect | 2 |
| Whirlwind Cleave (whirlwindCleave) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Ember Hail (emberHail) | ground (ground) | Brief Burst, Lingering Effect | 2 |
| Glacier Dart (glacierDart) | projectile (fan) | Ricochet, Split Shot | 2 |
| Storm Quill (stormQuill) | projectile (fan) | Dense Blast, Wide Blast | 2 |
| Quake Blow (quakeBlow) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Frost Sunder (frostSunder) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Spear Burst (spearBurst) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Skitter Flash (skitterFlash) | projectile (fan) | Brief Burst, Lingering Effect | 2 |
| Phantom Toss (phantomToss) | projectile (fan) | Ricochet, Split Shot | 2 |
| Rupture Line (ruptureLine) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Anvil Drop (anvilDrop) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Snare Shot (snareShot) | projectile (fan) | Dense Blast, Wide Blast | 2 |
| Halo Sweep (haloSweep) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Spirit Saw (spiritSaw) | projectile (fan) | Ricochet, Split Shot | 2 |
| Magma Crack (magmaCrack) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Tide of Judgement (tideOfJudgement) | beam (beam) | Brief Burst, Lingering Effect | 2 |
| Skyfall Leap (skyfallLeap) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Blessed Trail (blessedTrail) | burst (burst) | Echoing Blow, Shattering Blows | 2 |
| Pyre Totem (pyreTotem) | projectile (fan) | Ricochet, Split Shot | 2 |
| Lance Bow (lanceBow) | projectile (fan) | Ricochet, Split Shot | 2 |
| Jaws Trap (jawsTrap) | burst (burst) | Brief Burst, Lingering Effect | 2 |
| Blaze Trap (blazeTrap) | ground (ground) | Brief Burst, Lingering Effect | 2 |
| Frost Trap (frostTrap) | burst (burst) | Brief Burst, Lingering Effect | 2 |
| Shrapnel Trap (shrapnelTrap) | burst (burst) | Brief Burst, Lingering Effect | 2 |
| Fire Breath Trap (fireBreathTrap) | ground (ground) | Brief Burst, Lingering Effect | 2 |
| Spire Trap (spireTrap) | ground (ground) | Brief Burst, Lingering Effect | 2 |
| Bolt Trap (boltTrap) | projectile (fan) | Brief Burst, Lingering Effect | 2 |
| Rumble Trap (rumbleTrap) | ground (ground) | Brief Burst, Lingering Effect | 2 |
| Icicle Charge (icicleCharge) | projectile (fan) | Brief Burst, Lingering Effect | 2 |
| Mortar Charge (mortarCharge) | burst (burst) | Brief Burst, Lingering Effect | 2 |
| Storm Charge (stormCharge) | burst (burst) | Brief Burst, Lingering Effect | 2 |
| Crushing Blow (crushingBlow) | melee (melee) | Wide Crush | 1 |
| Reaping Arc (reapingArc) | melee (melee) | Echoing Blow | 1 |
| Venom Cut (venomCut) | melee (melee) | Wide Crush | 1 |
| Twin Cut (twinCut) | melee (melee) | Wide Crush | 1 |
| Twin Blades (twinBlades) | melee (melee) | Wide Crush | 1 |
| Rime Mallet (rimeMallet) | melee (melee) | Wide Crush | 1 |
| Twin Slash (twinSlash) | melee (melee) | Echoing Blow | 1 |
| Sweeping Cut (sweepingCut) | melee (melee) | Echoing Blow | 1 |
| Charged Blow (chargedBlow) | melee (melee) | Ricochet | 1 |
| Rime Rebuke (rimeRebuke) | melee (melee) | Wide Crush | 1 |
| Blight Hail (blightHail) | projectile (fan) | Split Shot | 1 |
| Blade Wind (bladeWind) | melee (melee) | Echoing Blow | 1 |
| Guarded Strike (guardedStrike) | melee (melee) | Wide Crush | 1 |
| Bulwark Rush (bulwarkRush) | melee (melee) | Echoing Blow | 1 |
| Spinning Dash (spinningDash) | melee (melee) | Echoing Blow | 1 |
| Blinking Cut (blinkingCut) | melee (melee) | Wide Crush | 1 |
| Snag Lash (snagLash) | melee (melee) | Echoing Blow | 1 |
| Guardian Cairn (fatherTotem) | melee (melee) | Wide Crush | 1 |
| Slamming Cairn (warchiefTotem) | burst (burst) | Echoing Blow | 1 |

### 3.4 Pairs with no upside, and free lunches

Pairs where no mod of the support can take effect (behaviour or tag gate) while the cost multiplier is still paid. "Penalty still paid"
counts those where a damage/speed penalty also applies, i.e. the support is strictly worse than leaving the socket empty:

| support | pairs with no live upside | penalty still paid | skills |
|---|---|---|---|
| Wide Crush | 12 | 12 | Crushing Blow, Venom Cut, Twin Cut, Twin Blades, Rime Splinter, Rime Mallet, Bolt Cleave, Gouge Shot, Rime Rebuke, Guarded Strike, Blinking Cut, Guardian Cairn |
| Ricochet | 28 | 28 | Flame Bolt, Drifting Storm, Ember Downpour, Acid Arrow, Pyre Burst, Rime Splinter, Fuse Arrow, Glacier Dart, Frost Quill, Scatter Bolt, Bolt Cleave, Slag Blow, Arrow Shower, Splinter Volley, Phantom Toss, Charged Blow, Rime Drift, Slag Lob, Spirit Saw, Ghost Shard, Whirl Shot, Venom Shower, Toxin Circle, Prime Splash, Pyre Totem, Mortar Bow, Lance Bow, Mirror Quiver |
| Volley Split | 14 | 14 | Drifting Storm, Ember Downpour, Pyre Burst, Rime Splinter, Storm Arrow, Bolt Cleave, Slag Blow, Arrow Shower, Rime Drift, Slag Lob, Whirl Shot, Prime Splash, Hoarfrost Mote, Mirror Quiver |
| Wide Salvo | 13 | 13 | Drifting Storm, Ember Downpour, Pyre Burst, Rime Splinter, Storm Arrow, Bolt Cleave, Slag Blow, Arrow Shower, Rime Drift, Slag Lob, Whirl Shot, Prime Splash, Mirror Quiver |
| Arrow Tempest | 12 | 12 | Drifting Storm, Ember Downpour, Pyre Burst, Rime Splinter, Storm Arrow, Bolt Cleave, Slag Blow, Arrow Shower, Rime Drift, Slag Lob, Prime Splash, Mirror Quiver |
| Twin Salvo | 13 | 13 | Drifting Storm, Ember Downpour, Pyre Burst, Rime Splinter, Storm Arrow, Bolt Cleave, Slag Blow, Arrow Shower, Rime Drift, Slag Lob, Whirl Shot, Prime Splash, Mirror Quiver |
| Lingering Effect | 18 | 0 | Rain of Steel, Ember Hail, Faultline, Venom Strike, Skitter Flash, Toxin Circle, Tide of Judgement, Jaws Trap, Blaze Trap, Frost Trap, Shrapnel Trap, Fire Breath Trap, Spire Trap, Bolt Trap, Rumble Trap, Icicle Charge, Mortar Charge, Storm Charge |
| Shattering Blows | 12 | 0 | Whirlwind Cleave, Faultline, Quake Blow, Frost Sunder, Spear Burst, Gouge Shot, Rupture Line, Anvil Drop, Halo Sweep, Magma Crack, Skyfall Leap, Blessed Trail |
| Rolling Volleys | 9 | 9 | Ember Downpour, Rime Splinter, Storm Arrow, Bolt Cleave, Slag Blow, Arrow Shower, Whirl Shot, Prime Splash, Mirror Quiver |
| Wide Blast | 4 | 0 | Storm Quill, Storm Arrow, Venom Strike, Snare Shot |

Notes: Echoing Blow also has no upside on its 20 dead skills, but its penalty is `-19..0`, so at gem level 20 it is cost only. Wide
Crush is the cleanest example of a tag gate: its damage mod needs the `area` tag and its `aoe` is ignored by thrusts, so on the twelve
melee skills without an area effect only the `-15%` attack speed survives.

Free lunch (the penalty is the inert part, the bonus is live): the support is a pure bonus there at a cost multiplier:

| support | pairs | skills (penalty mod inert, bonus live) |
|---|---|---|
| Void Twist | 9 | Venom Cut, Acid Arrow, Viper Lash, Sap Bolt, Venom Strike, Blight Hail, Spirit Saw, Venom Shower, Toxin Circle |
| Brief Burst | 18 | Rain of Steel, Ember Hail, Faultline, Venom Strike, Skitter Flash, Toxin Circle, Tide of Judgement, Jaws Trap, Blaze Trap, Frost Trap, Shrapnel Trap, Fire Breath Trap, Spire Trap, Bolt Trap, Rumble Trap, Icicle Charge, Mortar Charge, Storm Charge |
| Lingering Shots | 11 | Ember Downpour, Pyre Burst, Rime Splinter, Storm Arrow, Bolt Cleave, Slag Blow, Arrow Shower, Slag Lob, Venom Shower, Prime Splash, Hoarfrost Mote |
| Dense Blast | 4 | Storm Quill, Storm Arrow, Venom Strike, Snare Shot |

(Void Twist's row is the damage-type kind: its `-25% increased elemental damage` is inert where the skill deals no elemental damage.)

### 3.5 Two further classes of inert pairing (not behaviour kinds, but the same symptom)

**Utility skills accept damage supports.** The 50 utility skills (curses, warcries, guards, buffs, minions, blinks, banners, sigils) are
`spell`/`area`/`duration` tagged, so `typesAllow` lets 98 of the 120 supports onto them: 2,797 pairs. Roughly 560 are meaningful
(trigger supports cast the curse, minion supports on summoners, Blasphemy-style Standing Curse, Exalted Focus, Deep Insight, Scavenger,
Quick Cast, Lingering Effect); about 2,200 are damage, crit, ailment or area supports with nothing to act on. (A few "utility" skills have
a damaging part: Cinder Step, Rime Step, Bolt Step, Shadow Swap, Ruin Ritual, Cinder Bond; so say "up to".) `gemStatus`
(`src/ui/Skills.tsx:57`) reports "Supporting: Despair-like skill" for these as if it worked.

**Damage-type gates (build dependent).** Mods that need a damage type the skill does not deal. Counted over the 124 skills with the
skill's own base types, its conversions and its tag elements:

| support | pairs with an inert typed mod | accepted on |
|---|---|---|
| Void Twist (chaos more, elemental inc -25) | 124 (the -25 half: 62 of them are pure penalty) | 124 |
| Frostbreaker (cold pen) / Ashbreaker (fire) / Stormbreaker (lightning) | 104 / 98 / 101 | 124 each |
| Kindled Frost (cold->fire) / Deep Winter (cold) / Tinderbox (fire more) | 104 / 104 / 98 | 124 |
| Channelled Elements (elemental more + cannot inflict) | 62 | 124 |
| Lightheart (elemental more per charge) | 62 | 124 |
| Elemental Edge | 48 | 68 |
| Blunt Intent (physical more, no elemental, no chaos) | 43, and **46 pairs where it removes all of the skill's own damage** (every pure fire/cold/lightning/chaos spell, and attacks converted 100% to an element: Torch Arrow, Fuse Arrow, Mortar Bow, Prime Splash, ...) | 124 |
| Galvanise (phys->lightning) | 43 | 124 |

Build-granted physical or elemental damage (gear, tree, flat-added seeds) can rescue some of these, so they are not in the headline.
Blunt Intent on a pure fire spell is the exception worth fixing: it zeroes the skill (`skill.ts:428-430` drops the chunks).

### 3.6 Where the sheet and the sim disagree (found while checking the above)

Probes were run with `createDummyWorld` (bow_3 for Strider, wand_3 for Mystic, a ten-second fight at 3 tiles, free resources).
`projectiles` and `pulses` are the profile's values; `hits` are hit events on the dummy.

| probe | profile | sim result |
|---|---|---|
| Arrow Shower | projectiles 1, cost 8 | 14 uses, 13 hits, 0 projectiles spawned, 1 zone |
| Arrow Shower + Twin Salvo / Wide Salvo | **projectiles 1**, cost 11 / 13 | identical: 14 uses, 13 hits, 0 projectiles, 1 zone. Cost +38% / +63%, damage penalty applied, nothing gained |
| Ember Downpour + Volley Split | projectiles 1, cost 6 -> 9 | identical to Ember Downpour alone |
| Storm Arrow + Twin Salvo | projectiles 1 | no projectiles, no zone, chain loop unchanged |
| Snare Shot (fan) + Twin Salvo | projectiles 3 | 42 projectiles spawned over 14 uses (the working case) |
| Ember Hail | pulses 8 | 14 uses, 97 hits |
| Ember Hail + Lingering Effect | **pulses 11** (+38%) | still 97 hits: the sim ignores `skillDuration` for zone pulses (`actions.ts:584` vs `skill.ts:591-594`) |
| Ember Hail + Brief Burst | **pulses 4** (-50%) | still 97 hits |
| Blizzard Ring + Flanking Cast (target at 1.2 tiles) | 1 pulse | explode events 10 -> 20 and target hits 47 -> 57, consistent with (but not proof of, since correctly placed flanks could also reach a target this close) the code reading: the two cascade casts re-hit the caster's own position (burst `origin: 'self'` uses `a.x`, `actions.ts:526`) so a nova is cast three times for ~0.7x each |
| Sudden Frost + Flanking Cast | 1 pulse | explode events 6 -> 12, target hits unchanged (the flanks land beside it): the intended behaviour |
| Blaze Trap + Echoing Cast | repeats 1 | 8 echo events, hits 62 -> 96, uses 20 -> 23: the repeat re-runs `placeDeployable` (another set of traps), the traps themselves never repeat (`deploy.ts:235-266`), but the sheet multiplies every shot by `1 + repeats` (`character.ts:1536,1545`) |

Further sheet/sim gaps, by reading: `cascade`, `extraTargets`, `shockwave`, `mirage`, `unleash` and the Multistrike ramp are not in
`character.ts` (the sheet under-reports them; the sheet counts `lands = 1 + repeats` for Multistrike while the sim hits 1.22x and 1.44x on
the repeats); `SkillZone`'s own comment says "duration over interval, rounded down (the calc counts the same)" (`src/sim/types.ts:372`),
which stopped being true when Brief Burst and Lingering Effect were given `skillDuration` (docs/SPIRIT.md S13c says they are "read by the
sim"; they are read by the sheet and by leaves/fields/orbs, not by ground zones, trap lifetimes (`deploy.ts:111`) or plain bursts).

Item mods reach the same dead path: 12 uniques grant `projectiles` (`grep "'projectiles'" src/data/uniques*.ts`), and
`skill.ts:800` forces 1 for them on a ground or chain skill too.

## 4. Boring versus behaviour-changing, and balance outliers

### 4.1 Rough net effect

`dps x` = (damage more) x (speed more) x inc factor, ignoring behaviour and repeats; `mana/s x` = cost multiplier x speed factor (more
speed means more casts a second, each paying the multiplied cost); both at gem level 20, assuming +200% inc damage and +100% inc speed
already. Supports whose upside is a placement, a count or a trigger are blank in the damage columns and are not comparable by it.
Projectile count is worth nothing against a single target in the sheet (`volleyHits` is 1, docs/AUDIT-GEMS.md "right for simultaneous
projectiles"), so the whole count family is a net loss in the sheet and lives on pack coverage only.

| support | dps x | mana/s x | note |
|---|---|---|---|
| Cruel Flight | 2.28 | 1.08 | inflated: its second `more` is damage over time only; as a hit multiplier ~1.4 x 0.90 speed |
| Blunt Intent | 1.59 | 1.30 | any skill; zero on pure elemental/chaos spells |
| Elemental Edge | 1.54 | 1.40 | attacks; elemental only |
| Fanned Flame | 1.54 | 1.20 | only if the ignite-tag damage is the damage that matters |
| Dense Blast | 1.54 | 1.40 | `-30%` area `more` is the cost; free lunch where area is ignored |
| Brute Force / Channelled Elements / Focused Ruin / Patient Power / Lingering Cruelty | 1.48 to 1.49 | 1.3 to 1.4 | |
| Wide Crush | 1.35 (with area tag) | 1.19 | pure penalty without the area tag |
| Swift Assault / Quick Cast | 1.22 / 1.20 | 1.40 / 1.43 | speed supports cost more mana a second than they give damage |
| Void Twist | 1.27 | 1.20 | `-25%` elemental inc |
| Lingering Shots | 1.29 | 1.40 | slower projectiles is its cost |
| Twin Salvo / Triple Shot | 0.97 / 0.99 | 1.40 / 1.82 | single-target losses |
| Wide Salvo / Volley Split / Arrow Tempest | 0.79 / 0.74 / 0.74 | 1.65 / 1.5 / 1.4 | |
| Ricochet | 0.89 | 1.50 | |
| Rolling Volleys | 0.33 | 1.22 | one target gets all hits in the sheet (sequential), which restores it |
| Standing Bow / Standing Cast | 0.30 / 0.52 | 0.60 / 1.40 | gain deployed sets |
| Echoing Cast (x2 lands) | 1.44 (0.72 x2) | 1.12 | after repeats |
| **Triple Cadence** (x3.66 lands in the sim, x3 in the sheet) | **about 4.7 in the sim, 3.9 in the sheet** | 2.30 | melee only; per-mana damage far above any other support. Worth a balance look. |

### 4.2 Strictly dominated or oddly priced

- **Snare Cluster is strictly dominated by Triple Snare**: same `supports: [trap]`, same `deployCount +2`, damage `-55..-36` vs
  `-50..-31`, cost 1.5 vs 1.4 (`gemsGen.ts:7827`, `:7874`). There is no case where Snare Cluster is the better pick.
- **Refine Gem** (any skill, `damage inc 0..20`, 1.15) is dominated by Steel Resolve (spells, `0..38`, 1.0) and Firm Hold (projectile
  attacks, `0..38`, 1.0) wherever those apply; it is the only choice on melee and everything else.
- **Blunt Intent beats Brute Force** on any pure-physical melee skill (40..59 vs 30..49 more, cost 1.3 vs 1.4); Brute Force's only edge is
  the melee bleed/poison bonus. Blunt Intent is also strictly harmful on elemental skills (3.5).
- Chained Charges and Heavy Charge are the only supports costing 0.3x (the next lowest are Lightheart 0.7 and Deep Insight 0.75); both
  halve or cut damage (-35..-25, -30..-20) and add nothing for single mines. Intended or not, they are outliers.
- Swift Snares' `skillDuration inc` is ignored for trap lifetimes (`deploy.ts:111` skips traps and mines), so its duration half is
  inert on traps; its `cooldownRecovery` half is live.
- Fresh Vigour, Deep Winter, Kindle, Cindering depend on conditions (on full life, target chilled, ignited) and are pure bonus when
  the condition holds, nothing otherwise: normal.

### 4.3 Net-negative by design, but not on the skill's own terms

Echoing Blow (`damage more -19..0`), Wide Crush (-15% attack speed), Ricochet (-30..-11), the five count supports and Flanking Cast
(-40..-21 plus -25..-16 area) are all cost-for-capability supports. Their problem is only that the capability is missing on the pairs
listed in 3.2: 135 pairs where nothing but the cost remains.


## 5. Making "more instances" real, kind by kind

What "instance" means per behaviour, and the code that would change. Semantics for stacking on one enemy must be checked against the
3.9 wiki / Path of Building data before building (project rule: verify PoE claims first). Today's decided rule (docs/SPIRIT.md 2.3 and
S4, D1): projectiles of one use share a hit list, so one enemy is hit once per use unless the skill fires sequentially or is flagged
to shotgun.

### 5.1 `ground` (Arrow Shower, Ember Downpour; the others have no projectile tag)

Today: `fireEffect` pushes **one** `SkillZone` (`actions.ts:568-587`); `tickSkillZones` (`actions.ts:239-273`) emits one `explode`
event per pulse and hits every enemy within `radius + e.r` of the zone centre, once per pulse. Arrow Shower: radius 3, one pulse after a
0.5 s delay. `SkillZone` is `src/sim/types.ts:355-375`.

Recommended design: **one zone, several landing spots, one hit per enemy per pulse** (keeps the once-per-target rule; extra arrows
widen coverage, which is what helps against packs; the sheet needs no new overlap model).

1. Data: give the `ground` behaviour an optional `count` (default 1) in `SkillBehaviour` (`src/data/gems.ts:113-121`) and set it on
   the two skills through the decision files in `docs/coverage/gems/` (never edit `gemsGen.ts`; `npm run coverage:emit-gems`).
2. Calc: `skill.ts:800-803` becomes "projectile kind, or ground kind with the projectile tag": `(count ?? 1) + db.sum('projectiles')`.
   Leave other kinds at 1. `pulses` (`skill.ts:591`) is unchanged.
3. Sim, creation: in the ground branch of `fireEffect`, when `p.projectiles > 1` build `spots`: the first at the aim point, the rest on a
   disc around it using `w.rngTrig`, `spread = radius * sqrt(n / count)`-style so more arrows spread rather than pile up, each snapped with
   `w.grid.collide(x, y, 0.3)`. This is exactly `placePods` (`fields.ts:128-159`, uniform disc, `Math.sqrt(n / 5)` widening) and the
   `balls` branch of `afterStrike` (`shots.ts:538-559`, random spots, small random delays). Reuse the same helper for all three.
4. Sim, tick: add `spots?: {x: number; y: number}[]` to `SkillZone`; in `tickSkillZones` loop spots when present: one `explode` event per
   spot, and hit each enemy at most once per pulse (`break` after the first spot that covers it). For the "stacking" variant (each spot
   hits independently) just drop the `break`, and use the `volleyHits` pods formula (`character.ts:2038-2046`: `n * min(1, (burstRadius /
   spread)^2)`) in the sheet for the expected hits on a stationary target.
5. Delay and sequence: for Rolling Volleys-style sequential semantics give each spot its own `delay` (the `fireVolleys` pattern,
   `skillFx.ts:922-935`: one zone per volley with `delayT = spec.delay * k`). That is the "N independent zones" alternative: simpler in the
   tick (no change) but N zone records and N `enemiesOf` allocations per pulse.
6. Zone literal sites that must keep identical shape if `spots` is added (hidden-class stability; project memory: Actor literal fields
   cost 2x sim speed, same principle): `actions.ts:290` (aftershock), `actions.ts:571` (ground), `shots.ts:543` (balls),
   `skillFx.ts:503`, `skillFx.ts:922`. Put `spots: undefined` in the other four.
7. Duration: fix `actions.ts:584` to `Math.floor((b.duration * p.skillDuration) / b.interval)` so Brief Burst / Lingering Effect work on
   ground zones and the sheet matches (verified mismatch, 3.6). Also update the `SkillZone` comment.
8. Rendering, no new event type: `zones()` in `src/render/styles/grim/skillFx.ts:446-` draws a disc, ring and ticks per zone
   (`z.x, z.y, z.radius`); loop `z.spots ?? [z]`. Strip zones (`x2/y2`) are unaffected. The per-pulse `explode` event (handled at
   `skillFx.ts:195` and `render/styles/grim/index.ts:1291`) is already per spot. Nothing draws falling arrows today; a small particle
   burst in the `explode` handler would sell "arrows" without any new state.
9. UI: `behaviourLines` (`src/ui/gemText.ts:208-247`) has a `ground` case that prints radius, duration and interval; add "Lands N
   arrows" when `count > 1`. The support cards print stat text from `STAT_TEXT.projectiles` (`src/data/statText.ts:86`): add a note that it
   does nothing on a skill with no arrows (or gate acceptance, section 7). `gemStatus` (`src/ui/Skills.tsx:57`) is the natural place for
   "no effect on Arrow Shower".
10. Tests: `src/sim/shapes.test.ts:132-181` pins one zone per cast, pulses by interval and `profileOf(rain).pulses === 4`; keep, then
    add: count 3 gives three spots and three `explode` events per pulse; an enemy under two spots is hit once; Twin Salvo changes
    `profile.projectiles` on Arrow Shower; Brief Burst changes the sim's pulse count. There is **no `src/sim/shots.test.ts`**; projectile
    shapes are tested in `src/sim/spiritS4.test.ts:58-172` (Barrage, once-per-target, fork/chain/nova/tornado, afterHit). The ground
    count would be a new describe in `shapes.test.ts`.

Performance: `x9.test.ts:326-343` (forty Swarm actors, `crushingBlow`, must stay above 250x) never casts a ground skill, so it is
unaffected by zone work, but a new test with a ground skill in the arena is advisable. The costs that matter: `enemiesOf` builds a fresh
filtered array per zone per pulse (`actions.ts:198-203`), so N independent zones cost N arrays per tick; a single zone with spots costs
one array and `enemies x spots` distance checks per pulse (a handful of arrows: negligible). Events per use rise by (spots - 1) per pulse.
Do not add fields to `Actor`.

### 5.2 `chain` (Storm Arrow, tag projectile; Arc Chain and Tempest Sigil have no projectile tag)

The chain loop (`actions.ts:469-522`) walks one sequence from the target. Extra projectiles can mean extra **branches**: repeat the loop
for the `n - 1` nearest other enemies as extra first targets sharing `hitIds` (so no enemy is hit twice). Cost O(n x chains x enemies) per
use. The alternative is to exclude chain-kind skills from the count supports (data), which is cheaper and defensible: Lightning Arrow
fires one arrow.

### 5.3 `burst` (Pyre Burst, Slag Lob, Hoarfrost Mote carry the projectile tag; the projectiles are inside the skill)

Their projectile content is an `SkillFx`: `geyser` (fires projectiles, `fields.ts:370`), `bounces`, `orb`. A support's `projectiles` could
add to `geyser.max` or `bounces.chains`, but this is semantic invention; recommended is to stop the tag from admitting count supports
(data exclusion, section 7).

### 5.4 `melee` (Rime Splinter, Bolt Cleave, Slag Blow, Prime Splash: `afterHit` projectiles after a strike)

`afterStrike` (`shots.ts:449-561`) loops `spec.count` bolts, blades, balls or a wave of three. Adding the extra projectiles is one line
(`spec.count + extra`) plus the calc change (`skill.ts:800` currently says 1 for melee, so the extra must be read separately). The
once-per-target list is already shared there (`hitIds`). This is the best home for "more projectiles" on strike-then-projectiles skills.

### 5.5 `beam`

No beam skill has the projectile tag, so no count support reaches it. `aoe` supports already scale `length`/`width`
(`actions.ts:551-563`). Nothing to build.

### 5.6 Projectile-kind special paths that ignore the count

`shots.ts`: `pulse` (Drifting Storm: one orb), `mirror` (Mirror Quiver: one arrow), `creep` (Rime Drift: one skull), `tornado` (Whirl
Shot: fixed `TORNADO_SECONDARIES = 3`, `shots.ts:42`). Whirl Shot could take `3 + extra` the way the shield takes `shards + extra`
(`shots.ts:186`); Drifting Storm could launch `n` orbs; the other two have no sensible meaning for it.

### 5.7 What the sim already has that can be reused

`placePods` (`fields.ts:128`): N spots on a disc from one cast, with a sheet overlap model. `afterStrike` balls (`shots.ts:538`). `fireVolleys`
(`skillFx.ts:906-935`): staggered zones. `placeDeployable` ring placement (`deploy.ts:229-232`): n objects on a circle of 1.2 tiles.
`scaleProfile` (`shots.ts:57`) caches per-factor profile copies, the cheap way to give each instance its own damage.


## 6. Existing design rules and notes

- **Skill types** (docs/COVERAGE.md 5.2 :201-205, docs/PROGRESS.md :480): "3.9 decides what a support can support with skill types ...
  add `allowed` and `excluded` type sets to supports, and generate the compatibility table from them. `gemStatus` already explains a
  mismatch." Supports have `supports` (any of), `needs` (all), `excludes`, `adds`, resolved to a fixpoint. The type names are Bob's own;
  the reference names live only in `scripts/coverage`. `defaultTypes` (`src/calc/gems.ts:257-263`) gives spells without declared types
  `totemable, trappable, mineable, triggerable, repeatable` and attacks `repeatable`; skills with their own `types` list use it instead.
- **Types a support actually uses** (computed over resolved skill types):

| extra type | skills declaring it | supports using it |
|---|---|---|
| totemable | 56 | Standing Cast, Standing Bow |
| trappable | 44 | Set Snare |
| mineable | 44 | Chained Charges, Heavy Charge |
| triggerable | 92 | Reeling Cast only (the other trigger supports use `spell`) |
| repeatable | 77 | Double Release only (Echoing Cast and Triple Cadence use `spell`/`melee`+`attack`) |
| cascadable | 9 (Rain of Steel, Sudden Frost, Pyre Burst, Ember Hail, Rime Core, Skyfall, Glacier Wall, Cleansing Blaze, Blizzard Ring) | Flanking Cast |
| **volleyable** | **21** (19 projectile-kind, Storm Arrow, Arrow Shower) | **none** |
| orb | 5 | none |
| damageOverTime | 12 | none |
| brandable, rapidFire, instant, buff, reserving, createsMinion, golem, offering, stance, blink, travel, retaliation, mark, hex, banner, critical | 0 | none (declared in `EXTRA_SKILL_TYPES`, `skillTypes.ts:9-37`, neither on a skill nor in a support) |

  `volleyable` is the type most likely intended to gate the count family, but no support references it. Every count support says
  `supports: ['projectile']` (the tag), which admits 48 skills; `volleyable` marks 21, and 28 projectile-tag skills lack it (including
  16 where the count works: Split Volley, Flame Bolt, Frost Lance, Hurled Steel, Splinter Volley, Phantom Toss, Spirit Saw, Ghost Shard,
  Venom Shower, Toxin Circle, Pyre Totem, Mortar Bow, Lance Bow, Scatter Bow, Bolt Trap, Icicle Charge) while Arrow Shower and Storm Arrow
  *have* it though the count is dead on them. So it is not a ready-made gate; it would have to be re-authored.
- **Projectile rules** (docs/SPIRIT.md 2.3, S4, Q1; docs/AUDIT-GEMS.md :97-104): projectiles of one use share a hit list (verified against the
  3.9 wiki; the user kept it, 2026-10-08), with sequential volleys (Barrage, Rolling Volleys), a shotgun flag (two skills), parallel lanes,
  nova, tornado, fork and chain as the exceptions and shapes built in S4. The sheet ignores projectile count except for those exceptions.
  The audit's Twin/Wide Salvo entries (:1186, :1242) are about parallel lanes, not about which skills accept the support.
- **Ground skills** are described in docs/AUDIT-GEMS.md :1415-1435: Ember Downpour and Arrow Shower have their "stacked small explosions folded
  into one pulse". The audit never considered what extra projectiles do to the folded pulse; this is the gap the user hit.
- **Supports built in S13c** (docs/SPIRIT.md :508-511): "Spell Cascade and Echo's lateral and offset casts, Ancestral Call's extra targets,
  ... Brief Burst and Lingering Effect (duration that the sim reads), Merciless Cadence, Swell, Echoing Blow ... Twin Shadow, Veil Cut,
  Shattering Blows". Nothing in S13c records which skills each applies to.
- `chains` was "read only by skills with chain behaviour" (AUDIT-GEMS :99, SPIRIT 2.3); S4 fixed it for fan projectiles (`shots.ts:139`), not
  for ground, burst or melee.
- No document states a rule that a support must have an effect on every skill it is accepted on. The nearest is COVERAGE.md :308 ("its support
  compatibility matches its skill types"), which is what `typesAllow` does.
- Generated data: gems are emitted from decision files (`docs/coverage/gems/*.json`, `docs/coverage/AUTHORING.md`), so a type or support
  change belongs there followed by `npm run coverage:emit-gems`; every droppable gem also needs a `docs/coverage/map.json` line.

## 7. Design space and recommendation

| option | closes | cost | risk |
|---|---|---|---|
| A. Make ground (and melee `afterHit`) skills honour the count (section 5) | the user's case; Arrow Shower, Ember Downpour; Rime Splinter, Bolt Cleave, Slag Blow, Prime Splash | one calc line, one branch, `spots` on `SkillZone`, one renderer loop, tests | needs a stacking decision; sheet must stay honest |
| B. Gate acceptance by data (new or re-authored types, `excludes`) | any pair, no sim change | decision-file edits per skill and per support; cannot express "pierce is dead on exploding projectiles" without a type per effect | many one-use types; drifts as skills change |
| C. Derive "inert" from the skill and the support in code, one table (section 2) | everything in 3.2 at once | a `supportInert(support, skill)` function used by (1) `gemStatus` ("no effect on this skill"), (2) optionally `supportApplies` (`character.ts:362`) to refuse, (3) a vitest that enumerates all pairs and fails on new inert pairings except an allowlist | the table is hand-written and must follow the sim; mitigated by the enumerating test |
| D. Do nothing but warn (UI only) | honesty | tiny | the pair still costs mana |

Recommendation: **A for Arrow Shower / Ember Downpour** (one zone with landing spots, one hit per enemy per pulse, the once-per-target rule kept)
**plus C**, with the test as the guard that makes the class stop growing. Use B only for the cases where the behaviour is intentionally
absent (Storm Arrow, Rime Drift, Mirror Quiver, Drifting Storm, Pyre Burst, Slag Lob, Hoarfrost Mote for count; Echoing Blow / Shattering
Blows on slams). Fix the three cheap sheet/sim mismatches at the same time: ground pulses ignoring `skillDuration` (`actions.ts:584`),
Spell Cascade on self-centred novas (`actions.ts:526`), Echoing Cast on deployables (decide: repeat each shot or refuse). Optional
cleanups: stop utility skills accepting damage supports (an implicit `utility` type that supports must opt into), drop Snare Cluster, and
review Triple Cadence.

## Appendix: how the numbers were made

Scripts (kept in the session scratchpad, not in the repo) import `ACTIVE_GEMS`, `SUPPORT_GEMS` (`src/data/gems.ts`), `resolveActive`
(`src/calc/gems.ts:272`) and `typesAllow` (`src/data/skillTypes.ts:54`), resolve every skill at level 20, and for each accepted pair evaluate the
liveness predicates below against features read from the skill's data (`behaviour.kind`, the early-return `SkillFx` keys, `explodeRadius`,
intrinsic `pierce`, `arc`, tags, `dot.splash/carried`, `bleed/poison.baseDur`).

| effect | live when |
|---|---|
| projectile count | projectile kind and not pulse / mirror / creep / tornado |
| parallel / sequential | projectile fan path only (not pods, mortar, shield, nova, pulse, mirror, creep, tornado) |
| arrow nova | projectile kind except pulse / mirror / creep / shield / pods |
| fork | fan path, no explosion, no fuse, no intrinsic pierce |
| pierce | projectile kind, no explosion, no fuse, not mirror / creep / shield / pods; or `afterHit` bolts / blades |
| chains | chain kind, or fan path with no explosion, no fuse, no intrinsic pierce |
| projectile speed | projectile kind except pods |
| close quarters | projectile kind attacks |
| extra targets | melee thrust (no arc) |
| shockwave | melee kind |
| area | burst, ground, beam, melee arc, exploding projectile, or a skill with an area `SkillFx` / dot splash / carried |
| cascade | burst or ground |
| duration | a skill with leaves, dot, crystal, wall, markers, orb, vortex, bladestorm, geyser, pods, mirror, hitBuff, fuse, charge, beams, bond, ancestral, channel, minion, totem/brand, or a bleed/poison base duration; ground zones count only in the sheet |

Counts were then confirmed on 24 sim runs (3.6). Results: 280 behaviour-dead pairs, 135 no-upside pairs, 33 free-lunch pairs,
46 Blunt Intent zero-damage pairs, 2,797 utility pairs.

### Footnotes to 3.2

- Whirl Shot + Arrow Tempest and Mortar Bow + Arrow Tempest: `mode.nova` is tested before `mode.tornado` and `mortar` (`shots.ts:190` vs `:202`, `:218`), so the +4 **is** consumed, but the shot is hijacked: Whirl Shot's tornado scatter and Mortar Bow's landing line are replaced by an Arrow Nova ring. The "+4 projectiles ignored" note on Whirl Shot in the table is wrong in that sense: read it as "tornado scatter lost", and add Mortar Bow to the hijacked rows (nova ring replaces the mortar burst).
- Blizzard Ring + Flanking Cast: the claim rests on the code (`actions.ts:526`); a discriminating probe would put an enemy behind the caster.
