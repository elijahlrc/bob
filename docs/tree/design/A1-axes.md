# A1. The axes a build is made of

Counted from the data on 2026-10-19 by a throwaway script that imports `src/data/*` (gems, bases, uniques, classes, the
baked tree, keystones) and scans `src/calc`, `src/sim` and `src/mods` for the stat ids the engine reads. Counting only; no
design decisions.

**Populations.** Droppable gems `ALL_GEMS` = **320**: 174 active (124 damaging, 50 utility), 121 support (Hexing Strikes
included), 25 aura. Four item-granted gems are excluded. Uniques 810 + 18 unique flasks = 828. Item bases 774, of which 308
weapons and 88 shields. The tree "today" is the TREE-REDESIGN tree (2618 nodes: 6 start, 1446 small, 445 notable, 27
keystone, 694 travel); its counts are given only to show what the engine already accepts from a node, since that tree is
being replaced.

**Columns.** _Gems_ = active skills carrying the tag / supports whose rules or mods name it / auras whose mods name it.
_Start_ = how a run first meets the value: **kit** (the class's starting weapon; DESIGN.md 5.2's start-skill column is stale,
`classes.ts` gives no gems), **pick** (the three-of-174 skill pick after maps 1 to 4, `rollSkillRewards`: uniform over every
active gem, no gate), **drops** (`gemWeight`: "special" gems, those tagged totem/trap/mine/brand/minion/curse/warcry/guard/
movement/herald/channelling or with a utility, never drop before map 5 and weigh 1 against 3 for a plain active and 2 for
a support after; the class's main attribute weighs ×4 to area level 20 and ×2 after). _Drop share_ = that value's share of
all gem drop weight at area level 30 with no class. _Uniques_ = uniques with a mod tagged, typed or named for the value
(rough). _Stat_ = what a tree node can say that the engine reads (every tag and damage type is reachable generically through
`Mod.tags` / `Mod.damageTypes` on `damage`, `attackSpeed`, `aoe`...; the column lists the value's own stats). _Tree today_
= nodes of the current tree carrying it.

## Damage source

| Value            | Gems (skills / supports / auras)                                                                      | Start                                               | Drop share | Uniques             | Stat(s)                                                                                                          | Tree today                      | Note                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| attack           | 69 (1 utility) / 23 / 1                                                                               | kit: every class attacks with its weapon from map 1 | 36.0%      | 168                 | `damage[attack]`, `attackSpeed`, `accuracy`, tag `attackSkill` (ailments)                                        | 148 (+202 `attackSkill`)        | 59 of 69 attack gems need a weapon kind: attack and weapon are not independent axes                   |
| spell            | 105 (49 utility) / 14 / 4                                                                             | pick; no weapon needed                              | 31.5%      | 77                  | `damage[spell]`, `castSpeed`; Pain Conduit                                                                       | 69                              | 56 damaging spells, usable by any class; spell weapons add affixes only                               |
| minion           | 17 (13 summons) / 7 / 0                                                                               | pick; drops from map 5                              | 5.0%       | 28 stat + 14 tag    | `minionDamage/Life/Speed/Count/Regen/Block`, `minion.res/maxRes/eleMore`, `minionInstability`; Volatile Servants | 57 stat + 8 tag                 | `minion` is also in the calc's `DEPLOYED_TAGS` (`src/calc/skill.ts`, Idle Hands)                      |
| damage over time | tag 2; `dot` field 11 (6 hitless); 7 supports; ailment-inflicting skills: ignite 7, bleed 3, poison 4 | pick                                                | 2.9% (tag) | 7 (+ailments below) | `dotMulti`, `damage[dot]`, `dot.decay`; per-ailment stats below                                                  | `dotMulti` 51, `damage[dot]` 38 | Ailments are stats on skills (`chance.*`), never tags: no active carries ignite/bleed/poison tags     |
| totem            | 10 native; 56 spells and bow attacks can become one (Standing Cast, Standing Bow) / 3                 | pick; drops from map 5                              | 2.3%       | 6                   | `damage[totem]`, `deployCount[totem]`, `deploySeconds`; Idle Hands, Sigil Warden                                 | 25 tag + 8 `deployCount`        | A support-added type becomes a skill tag (`character.ts` `addedTags`), so tag-filtered nodes reach it |
| trap             | 9 native; 44 trappable (Set Snare) / 7                                                                | same                                                | 3.6%       | 6                   | `damage[trap]`, `deployCount`, `deploySeconds`                                                                   | 26                              | trap and mine supports exclude each other                                                             |
| mine             | 4 native; 44 mineable (Chained Charges, Heavy Charge) / 6                                             | same                                                | 2.3%       | 2                   | `damage[mine]`, `mine.chain`, `mine.double`, `deployCount`                                                       | 24                              |                                                                                                       |
| brand            | 2 native; 0 brandable; 0 supports                                                                     | same                                                | 0.3%       | 0                   | `damage[brand]`, `deployCount[brand]` (Sigil Warden)                                                             | 27 tag                          | An island of two gems                                                                                 |

## Damage type

| Value     | Skills by tag / by any field* / supports / auras          | Start                               | Drop share | Uniques | Stat(s)                                                                                             | Tree today | Note                                                                             |
| --------- | --------------------------------------------------------- | ----------------------------------- | ---------- | ------- | --------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| physical  | 25 / 30 / 7 / 2, plus 26 attacks typed only by the weapon | kit: every start weapon is physical | 13.6%      | 242     | `damage{physical}`, `physReduction`, `enemyPhysReduction`, `convert.physical.*`, `gain.physical.*`  | 132        | spells with physical base damage: 13                                             |
| fire      | 34 / 34 / 9 / 3                                           | pick (18 special)                   | 14.4%      | 122     | `damage{fire}`, `penetration{fire}`, `chance.ignite`, `convert.*.fire`; Searing Avatar, Fever Pitch | 85         | spells 13                                                                        |
| cold      | 24 / 24 / 9 / 2                                           | pick (7 special)                    | 12.8%      | 124     | as fire with chill/freeze; Fever Pitch                                                              | 72         | spells 13                                                                        |
| lightning | 26 / 26 / 8 / 2                                           | pick (11 special)                   | 12.2%      | 117     | as fire with shock; Fever Pitch                                                                     | 75         | spells 12                                                                        |
| chaos     | 16 / 17 / 3 / 0                                           | pick (8 special)                    | 6.7%       | 66      | `damage{chaos}`, `gain.physical.chaos`, `resist.chaos`, `immuneChaos`                               | 22         | only 2 spells have chaos base damage; the rest is conversion (Venom Cut) or dots |

\* any field: tag, `spellDamage`, `dot.type`, mod `damageTypes`, `convertSkill`/`gain`. Conversion: 35 skills convert their own
damage (`convertSkill`), 6 gems `gain`; uniques convert 32 / gain 27; tree today convert 2 / gain 5. Penetration: 4 gems, 18
uniques, 15 tree nodes.

## Delivery

| Value       | Gems (skills / supports / auras)              | Start                                                      | Drop share | Uniques                      | Stat(s)                                                                                 | Tree today       | Note                               |
| ----------- | --------------------------------------------- | ---------------------------------------------------------- | ---------- | ---------------------------- | --------------------------------------------------------------------------------------- | ---------------- | ---------------------------------- |
| melee       | 41 (all attacks) / 11 / 1                     | kit: five of six classes start with a melee weapon         | 16.7%      | 22                           | `damage[melee]`, `meleeRange`, `meleeAilmentMore`, `closeCombat.more`; Close Quarters   | 66               |                                    |
| projectile  | 49 (33 attack, 16 spell) / 15 / 0             | kit: the Strider's bow (a wand attack is not a projectile) | 20.6%      | 18 tag + 34 projectile stats | `damage[projectile]`, `projectiles`, `pierce`, `chains`, `projectileSpeed`; Arrow Weave | 21 tag + 21 stat |                                    |
| area        | 107 (40 attack, 67 spell, 22 utility) / 4 / 1 | pick (51 special)                                          | 35.6%      | 11 tag + 30 `aoe`            | `damage[area]`, `aoe`                                                                   | 2 tag + 60 `aoe` | the commonest tag after `duration` |
| channelling | 13 (4 attack, 9 spell) / 1 / 0                | pick; drops from map 5                                     | 2.1%       | 1                            | `damage[channelling]` only: no stage or channel-speed stat                              | 16               |                                    |

Confirmed internal (tags the sim and the drawing use, no stat of their own): strike 14 skills, slam 8, nova 4, chaining 6
(but `chains` is a stat), triggered 0 at gem level, hit 0. Behaviour kinds: burst 92, projectile 38, melee 26, ground 10, beam
5, chain 3. `duration` is a tag on 103 skills with a stat (`skillDuration`, 35 tree nodes today).

## Weapon

| Value      | Attack gems that accept it / supports | Bases (1h / 2h; spell)                   | Start              | Uniques on the base (mods) | Stat(s)                                                                            | Tree today         | Note                                                   |
| ---------- | ------------------------------------- | ---------------------------------------- | ------------------ | -------------------------- | ---------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------ |
| sword      | 31 / 1                                | 72 (50 / 22; 0)                          | kit: Reaver        | 45 (1)                     | tag `sword`, cond `wieldingSword`                                                  | 30                 | the largest base family (sword, thrust, 2h)            |
| axe        | 29 / 1                                | 47 (25 / 22; 0)                          | no class           | 27 (1)                     | `axe`, `wieldingAxe`                                                               | 29                 |                                                        |
| mace       | 24 / 1                                | 47 (25 / 22; 0)                          | kit: Vanguard (2h) | 25 (0)                     | `mace`, `wieldingMace`                                                             | 35                 |                                                        |
| sceptre    | 9 / 1                                 | 25 (25 / 0; 25)                          | kit: Zealot        | 20 (0)                     | `sceptre`, `wieldingSceptre`                                                       | 32                 | a spell weapon few attacks accept                      |
| dagger     | 19 / 1                                | 25 (25 / 0; 15 rune)                     | kit: Shade (two)   | 16 (0)                     | `dagger`, `wieldingDagger`                                                         | 25                 |                                                        |
| claw       | 19 / 1                                | 25 (25 / 0; 0)                           | no class           | 17 (1)                     | `claw`, `wieldingClaw`                                                             | 24                 |                                                        |
| wand       | 4 / 0                                 | 20 (20 / 0; 20)                          | kit: Mystic        | 20 (0)                     | `wand`, `wieldingWand`                                                             | 21                 | the fewest attacks of any weapon                       |
| staff      | 17 / 1                                | 22 (0 / 22; 13 spell, 9 war)             | no class           | 29 (3)                     | `staff`, `wieldingStaff`                                                           | 37                 |                                                        |
| bow        | 21 / 2                                | 25 (0 / 25; 0) + quivers                 | kit: Strider       | 26 (17)                    | `bow`, `wieldingBow`; Steady Draw                                                  | 42                 | the only weapon with its own gem tag (20) and keystone |
| one-hand   | (any 1h attack)                       | 195                                      | four classes       | 0                          | `oneHand`, `wieldingOneHand`                                                       | 6                  |                                                        |
| two-hand   | 1 gem needs it                        | 113                                      | Vanguard, Strider  | 0                          | `twoHand`, `wieldingTwoHand`                                                       | 32                 |                                                        |
| dual wield | 4 gems need or use both hands         | (two 1h)                                 | Shade              | 6                          | cond `dualWielding`                                                                | 41 nodes (99 mods) |                                                        |
| shield     | 3 gems need one                       | 88 (ar 17, ev 16, es 16, 13 each hybrid) | Reaver, Zealot     | 2 cond + 74 block stats    | `holdingShield`, `blockAttack/Spell/Cap`, `shieldDefences`, `shieldEs`; Shieldwall | 43 cond + 69 block |                                                        |
| unarmed    | 0 gems                                | no base                                  | no class           | 4                          | tag `unarmed` on the default attack only; no stat                                  | 0                  |                                                        |

Ten of 69 attacks need no weapon kind. Spell weapons (sceptre, wand, rune dagger, spell staff) differ only in affixes.

## Defence lean

| Value         | Gems      | Uniques    | Tree today    | Stat(s)                                                                                                                  | Note                                              |
| ------------- | --------- | ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| life          | 3         | 243        | 222           | `life`, `lifeRegen`, `lifeRegenPct`                                                                                      |                                                   |
| energy shield | 1 (aura)  | 196        | 124           | `es`, `esRechargeRate/Delay`, `esRegenPct`; Living Ward, Shade Leech, Nimble Gambit                                      |                                                   |
| armour        | 2         | 126        | 125           | `armour`, `physReduction`; Plated Hide                                                                                   | bases ar 47, ev 46, es 47, hybrids 44 to 46: even |
| evasion       | 1 (aura)  | 133        | 95            | `evasion`, `evadeBonus.projectile/melee`; Rooted Stance, Arrow Weave                                                     |                                                   |
| block         | 0         | 74         | 69            | `blockAttack`, `blockSpell`, `blockCap`, `blockProjectile`, `lifeOnBlock(Pct)`, `manaOnBlock`; Shieldwall, Nimble Gambit |                                                   |
| dodge         | 0         | 18         | 2 (keystones) | `dodgeAttack`, `dodgeSpell` (capped 75% in `defence.ts`); one body affix                                                 | exists, almost no supply                          |
| regeneration  | 5         | 85         | 94            | `lifeRegen(Pct)`, `esRegenPct`, `manaRegen`                                                                              |                                                   |
| leech         | 6         | 99         | 45            | `leech.life/mana/es`, `leechRate`, `instantLeech*`, `lifeOnHit/Kill`; Crimson Pact                                       |                                                   |
| resistances   | 4 (auras) | 238        | 94            | `resist.*`, `maxResist.*`, `avoid.elemental`; Hollow Vessel                                                              |                                                   |
| stun (self)   | 0         | 30         | 21            | `stunThreshold`, `stunAvoid`, `stunDurationOnSelf`, `cannotBeStunned`                                                    |                                                   |
| flasks        | 0         | 18 (belts) | 20            | `flaskEffect`, `flaskCharges`, `flaskRecovery`, `flaskDuration`, `flaskChargesUsed`, `flaskLife/ManaRecovery`            |                                                   |
| reprieves     | 0         | 0          | 0             | **none**: `src/calc` and `src/mods` never mention them; `sim/reprieve.ts` fires from the pouch alone                     | flagged                                           |

## Resource

| Value        | Gems                                                                               | Uniques | Tree today | Stat(s)                                                                                                       | Note                                            |
| ------------ | ---------------------------------------------------------------------------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| mana         | every skill costs it; 3 gems touch it                                              | 135     | 150        | `mana`, `manaRegen(Flat/Pct)`, `cost`, `costFlat`, `leech.mana`, `manaOnKill/Hit`; Mind Bulwark, Mana Bastion | universal, so not a lean on its own             |
| life as cost | 0                                                                                  | 9       | 3          | `skillsCostLife` (Blood Rite), `rule.socketedGemsUseLife`, `lifeIsOne`                                        | flags only; no dial such as "reduced life cost" |
| reservation  | 25 auras (23 by %, 1 flat, 1 free), 2 banners, 1 skitter, 1 Standing Curse support | 20      | 29         | `reducedReservation`, `socketedReducedReservation`, `auraEffect`                                              |                                                 |

## Mechanics with their own stats

| Value            | Gems (skills / supports / auras)              | Uniques | Tree today   | Stat(s)                                                                                             |
| ---------------- | --------------------------------------------- | ------- | ------------ | --------------------------------------------------------------------------------------------------- |
| auras            | 25 auras (2 stances, 3 heralds with triggers) | 20      | 29           | `auraEffect`, `reducedReservation`, `auraBurn`                                                      |
| curses           | 13 curse skills, Hexing Strikes, 1 blasphemy  | 15      | 20           | `curseEffect`, `hexLimit`, `curseEffectOnSelf`                                                      |
| charges          | 11 gems give, 7 skills spend                  | 39      | 31           | `chargeOn.<event>.<kind>`, `maxCharges.<kind>`, `chargeDuration.<kind>` (engine only, no stat text) |
| ignite           | 7 / 5 / 1                                     | 36      | 4            | `chance.ignite`, `duration.ignite`, `ignite.extra/speed/resShift`, `spread.ignite`                  |
| bleed            | 3 / 5 / 1                                     | 22      | 6 (+13 tag)  | `chance.bleed`, `duration.bleed`, `bleed.speed/baseDur`                                             |
| poison           | 4 / 4 / 2                                     | 20      | 17 (+16 tag) | `chance.poison`, `duration.poison`, `poison.speed/baseDur`, `perPoison.*`                           |
| chill            | 7 / 4 / 0                                     | 22      | 8            | `duration.chill`, `effect.chill`                                                                    |
| freeze           | 3 / 3 / 0                                     | 21      | 3            | `chance.freeze`, `duration.freeze`, `freeze.third`, `shatter`                                       |
| shock            | 9 / 4 / 0                                     | 34      | 8            | `chance.shock`, `duration.shock`, `effect.shock`                                                    |
| stun (enemy)     | 5 / 2 / 0                                     | 31      | 5            | `stunDuration`, `enemyStunThreshold`, `stunDamage`, `knockback`                                     |
| conversion       | 33 / 4 / 2                                    | 58      | 10           | `convert.<a>.<b>`, `gain.<a>.<b>`; Searing Avatar                                                   |
| penetration      | 1 / 3 / 0                                     | 18      | 15           | `penetration{type}`                                                                                 |
| critical strikes | 5 / 7 / 2                                     | 98      | 168          | `critChance`, `critMulti`, `critLucky`; Unerring Discipline                                         |
| attack speed     | 16 / 11 / 1                                   | 157     | 222          | `attackSpeed`                                                                                       |
| cast speed       | 0 / 8 / 1                                     | 69      | 74           | `castSpeed`                                                                                         |
| accuracy         | 1 / 1 / 1                                     | 73      | 128          | `accuracy`, `alwaysHit`                                                                             |

## Start

| Class    | Str/Dex/Int | Region today | Kit                                        | Attack gems usable with the kit (of 69) | Gems the drop weight favours (main attribute) |
| -------- | ----------- | ------------ | ------------------------------------------ | --------------------------------------- | --------------------------------------------- |
| Vanguard | 32/14/14    | str          | Oak Maul (2h mace)                         | 34                                      | str: 45 skills, 89 of 320 gems                |
| Strider  | 14/32/14    | dex          | Sapling Bow + Feathered Quiver             | 31                                      | dex: 69 skills, 122 gems                      |
| Mystic   | 14/14/32    | int          | Willow Twig (wand) + 28 ES on the body     | 14                                      | int: 60 skills, 110 gems                      |
| Reaver   | 23/23/14    | strdex       | Notched Shortsword + Plank Shield (armour) | 41                                      | str (ties go to str): 45, 89                  |
| Zealot   | 23/14/23    | strint       | Carved Rod (sceptre) + Bone Ward (ES)      | 19                                      | str: 45, 89                                   |
| Shade    | 14/23/23    | dexint       | Bone Shiv, Bone Shiv                       | 29                                      | dex: 69, 122                                  |

All 56 damaging spells and the 10 weapon-free attacks are usable by every class. No active gem has a dual attribute (only
one aura does), so the ×4 early weighting splits the gem pool three ways: dex 122, int 110, str 89.

## What the game itself makes rare

Skills carrying the value: brand 2 (no support makes one), mine 4 native (44 reachable through two supports), warcry 4,
nova 4, guard 3, chaining 6, slam 8, trap 9 native, totem 10 native, channelling 13, curse 13, minion 17, chaos spells 2
by base damage (17 by any field), skill-own dots 11, attacks for wands 4 and sceptres 9, unarmed 0, dual-wield-only 4,
shield-only 3. Among supports: brand 0, channelling 1, area 4. Every "special" value (deployed, minion, curse, warcry,
guard, movement, herald, channelling) is offered in the maps 1 to 4 pick like any other skill but cannot drop before map 5
and drops at a third of the weight after.

## Values with no tree stat today

- **Reprieves**: no stat anywhere in `calc`, `mods` or the tree; only the sim reads the pouch.
- **Life as cost**: `skillsCostLife` and `rule.socketedGemsUseLife` are flags; nothing scales a life cost.
- **Unarmed**: a tag on the default attack; no gem, base, affix or stat; four uniques.
- **Warcry**: a tag on four utility skills; `maxRage` exists but no gem, unique or node uses it; only `skillDuration` /
  `buffDuration` reach what they do.
- **Channelling**: tag only; no stat for stages or channel speed.
- **Brand**: `deployCount[brand]` and tag-filtered damage only; no attachment or activation stat.
- Near-zero supply though the stat exists: dodge (2 keystone nodes, 1 affix), impale (4 stats, 3 skills, 4 nodes, 0 uniques),
  culling and double damage (2 nodes), cooldown recovery (0 nodes, 0 uniques).

## Axes that look missing, mergeable, or mis-sized (evidence only)

- **Attack and weapon are one axis in practice**: 59 of 69 attacks name a weapon kind, and a class's kit decides 14 to 41 of
  them; spells are weapon-free. The plan's "damage source" and "weapon" overlap for attacks and are empty for spells.
- **Deployed is four values of very unequal size**: totem 56 / trap 44 / mine 44 reachable skills against brand 2, and trap
  and mine are exclusive by support rules. Minion sits in the calc's `DEPLOYED_TAGS` as well.
- **Damage over time is mostly ailments**: 2 dot-tagged skills and 11 skill dots against ignite/bleed/poison carried as
  `chance.*` stats on 14 skills and 14 supports, with `dotMulti` on 51 nodes today.
- **Attack damage type is the weapon's**: 26 attacks carry no type at all; physical by default, conversion decides.
- **Mana is universal, reservation is the real lean**: 25 auras, 2 banners, 1 blasphemy, 1 skitter reserve; "life as cost"
  is a keystone flag. The resource axis may be "regen / leech / reservation / Blood Rite".
- **`duration` is the largest tag of all** (103 skills, `skillDuration` stat) and is on no axis.
- **Utility sub-kinds** with gems but no stats of their own: movement 15, guard 3, warcry 4, heralds 3, stances 2, banners 2,
  marks 0, impale 3.
- **Weapon-held conditions** (`wielding*`, `dualWielding`, `holdingShield`) are what the engine offers for weapon locality,
  and the current tree leans on them (99 dual-wield mods, 94 shield, 24 to 35 per weapon kind).
- The plan's tag counts (spell 118, attack 75, projectile 55, melee 51...) come from a text grep over every `tags:` line in
  the two gem files, nested mod tags included; the gem-level counts are spell 105, attack 69, projectile 49, melee 41, fire
  34, lightning 26, physical 25, cold 24, bow 20, minion 17, chaos 16, curse 14, totem 10, trap 9, mine 4, warcry 4, brand 2.
