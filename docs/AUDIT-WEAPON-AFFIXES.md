# Bob — Audit of the weapon affixes against PoE 3.9

Status: **audit done 2026-10-16; the fix pass followed the same day (next section)**. The sections below describe the game as it was at the audit,
except where the fix pass says otherwise. Reference text and numbers live only in this file and under `docs/coverage/` (DESIGN §3); nothing
here goes in `src/`.

## The fix pass (2026-10-16)

**Fixed.**

- Rune daggers roll the spell affixes and warstaves do not (`ItemBase.spellWeapon`, set on the weapon class definition; `itemTags` reads it).
- Str, Dex and Int follow the kind of weapon; claws and daggers roll maximum mana and mana regeneration. Weapon kinds are now affix tags.
- Local accuracy (`accuracyLocal`) is the weapon's accuracy affix; the global `accuracy` family stays for helmets, gloves, rings and quivers.
- Life on hit counts for attacks only (the affix and the claw implicit carry the attack tag, as the uniques already did).
- Added to the weapon pool: resistances (fire, cold, lightning, chaos), physical % with accuracy, accuracy %, physical life and mana leech,
  life and mana on kill, flat chaos, reduced attribute requirements, damage over time multiplier, and on spell weapons spell damage with mana,
  typed damage % (prefix and suffix), spell crit chance, burning damage, typed damage-over-time multipliers, extra chaos from physical, fire,
  cold and lightning, global spell gem levels (all spells, and fire, cold, lightning, chaos, physical), projectile speed (bow, wand), melee and bow socketed gem levels, and an additional arrow on bows (item level 86). Weights were set so a sword's
  and a wand's pool shares land near the 3.9 shares (`FamilyDef.weights` makes a family rarer on weapons only).
- Tiers are shown with 1 as the strongest (`shownTier`; the stored tier is unchanged, so saves are unaffected).
- The item card shows the weapon's damage, speed and crit after its mods (`weaponLine`), and added elemental and chaos damage.
- `lineKey` has its backslashes back, so the comparison marks a changed number as changed.
- Wording: `N% chance to Ignite` (and bleed, poison, shock, freeze), `Spell Damage`, `Gain N Life per Enemy Hit with Attacks`.
- Left as Bob's own wording: "Elemental Damage with Attacks" and "Critical Strike Multiplier" (Bob has no local crit multiplier to tell apart).

**Not added.** Socketed fire, cold, lightning and chaos gem levels for the attack dagger and attack staff (four small 3.9 mods; they need an
attack-weapon tag and `gemLevel` already covers the case on a spell weapon), and the light radius half of the accuracy hybrid (Bob has no light
radius).

The design questions raised by the audit were answered the same day; section 10 records the answers.

**Measured.** 16 bot runs per class to map 25, same seed, before and after: median map reached 20, 20, 19.5, 20, 18.5, 20 after against 20,
17.5, 20, 20, 20, 20 before (vanguard, strider, mystic, reaver, zealot, shade); no sign of a change beyond the run-to-run spread.

## Scope, sources and method

**What counts as a weapon affix.** Everything that can put a line on a weapon: the prefix and suffix families of `src/data/affixes.ts` whose
slots reach a weapon, the base implicits of `src/data/bases.ts`, and the other routes (bench, essences, Rot Seal).

**Bob's side.** `FAMILY_DEFS` (`src/data/affixes.ts`), eligibility by `itemTags` / `eligible` (`src/gen/loot.ts`), tiers as `expandFamily`
builds them, weights as `rollAffix` sums them. Run for each of the 12 weapon classes at item level 84.

**The reference side.** Path of Building v1.4.155 (tag of 2019-12-14, the last release before 3.10): `Data/3_0/ModItem.lua` (3,525 item mods)
and `Data/3_0/ModMaster.lua` (721 bench crafts). Downloaded for this audit and kept outside the repo; the base data is the existing
`docs/coverage/pob-bases.json`. Each mod carries its text, tier, required item level, group and a spawn weight per item tag. A mod counts as
rollable on a weapon when the first of its weight tags that the weapon has gives a weight above zero.

**Limits.**

- The tag sets are mine, read off the weight keys (`sword`, `one_hand_weapon`, `ranged`, `attack_dagger`, `attack_staff`, `rapier`). The
  files do not say which bases carry `attack_dagger`, `attack_staff` or `rapier`, so the rune dagger, warstaff and thrusting sword rows are the least
  certain. The other nine classes are plain.
- Left out of the 3.9 side: influence mods (Shaper, Elder and the four Conqueror/Hunter tags), and mods that have weight zero on a plain weapon
  (essence-only, Delve, veiled). Corrupted implicits are covered in section 7.
- The audit counts what the roll rules produce, not what a player crafts. It ignores mod groups blocking each other.
- Numbers are not expected to match: our numbers are ours (the spirit rule of AUDIT-GEMS.md). A number is reported when it changes what a mod
  is for or how often it appears.
- 3.9 values are PoB's, not re-checked against the wiki, whose current text is post-3.9.

## Headline

1. **Bob's weapon pool is much narrower.** A sword rolls 6 prefixes and 16 suffixes in Bob, 12 and 20 in 3.9; a wand 11 and 18 against 32 and 27. Of the 72 distinct weapon mod texts in 3.9, about 30 have a Bob counterpart.
2. **It is also less specific.** In 3.9 the weapon type decides much of what rolls (Str/Dex/Int, ailment chances, stun threshold, spell
   mods). In Bob every melee weapon rolls the same 22 families (23 for two-handers), and every caster weapon the same 29 (30 for the staff).
3. **Rune daggers and warstaves are the wrong way round.** `itemTags` keys on `itemClass`, so a warstaff (class `staff`) rolls spell mods and
   a rune dagger (class `dagger`, with a spell damage implicit) rolls none. In 3.9 the attack variants are barred from the caster mods and
   the spell dagger rolls them.
4. **High tiers are much more common.** Bob's tier weight falls from 1000 to about 475 across a family. 3.9's falls off a cliff: local physical %
   goes 1000, 1000, 1000, 400, 200, 100, 50, 25. At item level 84 the top three tiers are 28% of Bob's physical % rolls and 4.6% of 3.9's.
5. **Flat added damage is a third as important to a Bob weapon.** The elemental flats top out at about 55-60% of a 3.9 one-hand roll, on a base
   that does about twice the damage. Percent mods keep their 3.9 values, so Bob weapons lean on percent damage.
6. **The item card shows the base weapon, not the weapon.** A sword with +179% physical damage and a flat fire roll prints the same damage
   line as its white base. 3.9 shows the damage after the mods.
7. **Weapon accuracy is global in Bob, local in 3.9; life on hit also fires on spell hits; the bench has nothing for a weapon.**
8. A bug found on the way, in the code that compares items (section 8).

## 1. The pools

Distinct weapon-rollable mod texts at item level 84 (a hybrid is one; fire, cold and lightning count separately), positive weight only.

| Class (Bob)    | 3.9 prefix / suffix | Bob prefix / suffix |
| -------------- | ------------------: | ------------------: |
| 1h sword       |             12 / 20 |              6 / 16 |
| 2h sword       |             12 / 20 |              7 / 16 |
| 2h mace        |             12 / 18 |              6 / 16 |
| 2h axe         |             12 / 19 |              7 / 16 |
| Bow            |             12 / 19 |              7 / 16 |
| Claw           |             13 / 19 |              6 / 16 |
| Dagger         |             22 / 19 |              6 / 16 |
| Wand           |             32 / 27 |             11 / 18 |
| Sceptre        |             30 / 28 |             11 / 18 |
| Staff          |             33 / 28 |             12 / 18 |
| Rune dagger \* |             29 / 20 |              6 / 16 |
| Warstaff \*    |             23 / 26 |             12 / 18 |

\* tag set assumed. Bob's extra prefix on the 2h rows and the bow is the gem level family; the same family is not on one-handers.

**Share of the pool.** A roll's chance of being each kind, as a share of all prefix (or suffix) weight at item level 84.

| Sword prefixes                 |   3.9 |   Bob | Sword suffixes                          |   3.9 |   Bob |
| ------------------------------ | ----: | ----: | --------------------------------------- | ----: | ----: |
| Physical %                     |  7.3% | 21.4% | Str / Dex (3.9) · Str / Dex / Int (Bob) | 20.6% | 30.0% |
| Physical % + accuracy (hybrid) |  7.3% |     — | Attack speed                            |  9.2% |  8.8% |
| Flat physical                  | 13.4% | 16.5% | Crit chance                             |  6.9% |  7.6% |
| Flat fire / cold / lightning   | 57.0% | 49.5% | Crit multiplier                         |  6.9% |  7.6% |
| Elemental % with attacks       |  2.9% | 12.6% | Accuracy                                |  5.7% | 10.0% |
| Gem levels (all kinds)         |  5.7% |     — | Fire / cold / lightning / chaos res     | 14.7% |     — |
| Life and mana leech            |  5.3% |     — | Life on hit, life and mana on kill      | 11.4% |  6.4% |
| Flat chaos                     |  1.2% |     — | Ailment chances                         |  8.0% | 18.5% |
|                                |       |       | Stun threshold, stun duration           | 11.4% |  7.6% |
|                                |       |       | Area of effect                          |     — |  3.8% |

| Wand prefixes                                              |   3.9 |   Bob |
| ---------------------------------------------------------- | ----: | ----: |
| Max mana                                                   | 12.6% |  9.3% |
| Attack side: physical %, flat physical                     | 17.0% | 21.4% |
| Attack side: flat fire / cold / lightning                  | 14.4% | 27.9% |
| Attack side: elemental % with attacks                      |  1.8% |  7.1% |
| Spell side: flat fire / cold / lightning                   | 25.2% | 24.6% |
| Spell side: spell damage (plain, hybrid, typed)            | 18.5% |  9.3% |
| Gem levels, leech, chaos conversion, DoT multi, flat chaos | 10.5% |     — |

A Bob wand's prefixes are 56% attack damage and 34% spell damage. A 3.9 wand's are 33% and 44%. Bob wands roll attack-damage prefixes
about twice as often as 3.9 wands do.

## 2. Missing from Bob's weapon pools

Mods that roll on weapons in 3.9 and have no Bob family on any weapon.

| 3.9 mod                                         | Rolls on                           | Tiers · item levels · top roll                                                 | Note                                                                                    |
| ----------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Physical % + accuracy (hybrid prefix)           | every weapon                       | 8 · 1-83 · (75-79)% and +(175-200)                                             |                                                                                         |
| Fire, cold, lightning, chaos resistance         | every weapon                       | 8 (chaos 6) · 1-84 (16-81) · +46-48% (+31-35%)                                 | Bob never puts resistances on a weapon                                                  |
| Local life leech                                | every weapon                       | 3 · 50-70 · (1-1.2)% of physical attack damage (bow and wand: first tier only) | Bob's `lifeLeech` is on gloves, rings, amulets and quivers, and takes every damage type |
| Local mana leech                                | every weapon                       | 1 · 50 · (0.2-0.4)%                                                            | Bob has no mana leech affix                                                             |
| Life and mana gained on kill                    | every weapon                       | 3 · 1-40 · +(11-14) life, +(4-6) mana                                          | Bob has the stats, no affix                                                             |
| Flat chaos damage                               | every weapon                       | 1-2 · 83 · (70-108) to (147-185) at 2h                                         | Bob has chaos damage only as `addChaosAttacks` (jewellery, gloves, quiver)              |
| Critical strike chance for spells               | casters, rune dagger               | 6 · 11-76 · (100-109)%                                                         | Bob's `critGlobal` is general, not spell-only                                           |
| Spell damage + max mana (hybrid)                | casters, rune dagger               | 14 · 2-80 · (51-55)% and +(60-64)                                              |                                                                                         |
| Fire, cold, lightning % (prefix)                | wand, sceptre, staff               | 8 · 2-84 · (100-109)%, 2h (150-164)%                                           | Bob has the one generic spell damage prefix                                             |
| Fire, cold, lightning % (suffix)                | wand, sceptre, staff, attack staff | 6 · 8-76 · (27-30)%                                                            |                                                                                         |
| Burning damage                                  | wand, sceptre, staff, attack staff | 3-6 · 20-60 · (41-50)%                                                         |                                                                                         |
| Projectile speed                                | bow, wand                          | 5 · 14-82 · (42-46)%                                                           |                                                                                         |
| Damage over time multiplier (suffix)            | every weapon                       | 3-6 · 44-82 · +(16-18)% 1h, +(31-35)% 2h                                       |                                                                                         |
| Typed DoT multiplier (chaos, fire, cold prefix) | dagger, wand, sceptre, staff       | 5-10 · 4-78 · up to +(34-38)%, 2h +66-75%                                      |                                                                                         |
| Gain X% of damage as extra chaos (4 prefixes)   | dagger, wand, sceptre, staff       | 3-6 · 66-80 · (11-13)% 1h, up to 26% 2h                                        |                                                                                         |
| Reduced attribute requirements                  | every weapon                       | 2 · 36-60 · 18%, 32%                                                           |                                                                                         |
| Global accuracy + light radius (hybrid)         | every weapon                       | 3 · 8-30 · (16-20)% and 15%                                                    | Bob has no light radius stat                                                            |
| Additional arrow                                | bow                                | 1 · 86                                                                         | Above the 84 used here; Bob has no equivalent                                           |
| Minion damage                                   | bases tagged to roll minion mods   | 8 tiers · up to (75-79)%                                                       | Item levels not read; which bases carry the tag is not in the files                     |

**Gem levels.** 3.9 has several kinds: +1 to socketed gems (every weapon except wand, sceptre and staff, item level 50), +1/+2 to
socketed melee gems (8 and 63), +1/+2 to socketed bow gems (9 and 64), +1/+2 to socketed fire, cold, lightning or chaos gems (dagger and
attack staff), +1 to all spell skill gems (casters, 55), and +1 to +3 to all fire, cold, lightning, chaos or physical spell skill gems
(casters, 2-77). Bob has `gemLevel`: socketed gems only, on two-handers, helmets and body armour, rare only, +1 at item level 60 and **+2 at 75**.
The +2 is above anything of its shape in 3.9, where plain +2 to socketed gems is a corruption outcome. The global spell skill gem
levels (the reason to wear a 3.9 staff) have no counterpart on a Bob weapon.

## 3. Broader in Bob than in 3.9

| Bob family                                    | Bob                                                        | 3.9                                                                                                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `areaEffect`                                  | Weapon, gloves, amulet and belt suffix, 5% to 22%, 5 tiers | Not rollable on a weapon (corrupted implicit only)                                                                                                                                  |
| `str`, `dex`, `int`                           | Every weapon rolls all three                               | Str: sword, axe, mace, sceptre, staff. Dex: bow, sword, axe, claw, dagger. Int: wand, dagger, claw, staff, sceptre. A wand never rolls Str or Dex, a bow only Dex, a mace never Dex |
| `igniteChance`, `shockChance`, `freezeChance` | Every weapon; 4 tiers, 5% to 25%, item levels 6-72         | Wand and sceptre (6-8%), staff (12-15%) only; one tier each, item level 15                                                                                                          |
| `bleedChance`                                 | Every weapon; flat chance, 5% to 25%                       | Sword, axe, mace, bow only; a hybrid with "increased damage with Bleeding"; 3 tiers, 20% to 30% chance and (21-50)% damage, item levels 20-60                                       |
| `poisonChance`                                | Every weapon; flat chance                                  | Claw, dagger, sword, bow only; same hybrid shape                                                                                                                                    |
| `enemyStunThreshold`                          | Every weapon                                               | Sword, axe, mace, sceptre, staff only                                                                                                                                               |
| `gemLevel`                                    | Reaches +2, rare 2h                                        | +1 only                                                                                                                                                                             |

Five ailment families are 18.5% of a sword's suffix weight in Bob and the two class-gated hybrids 8.0% in 3.9. They are most of why Bob's
melee weapons look alike. `mana` and `manaRegen` go the other way: 3.9 also rolls them on claws and daggers, Bob only on wand, sceptre and staff.

## 4. Eligibility by weapon class

| Class              | 3.9                                                                                                         | Bob                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Wand               | Int only; projectile speed; attack speed capped at (17-19)% (item level 37)                                 | Str, Dex, Int; attack speed to 27%                 |
| Bow                | Dex only; projectile speed, additional arrow, bow gems; attack speed capped at (17-19)%                     | Str, Dex, Int; no bow-specific mod                 |
| Claw, dagger       | Dex and Int; mana, mana regen; poison hybrid; typed socketed gems on the attack dagger                      | Str too; no mana; ailments of all five kinds; area |
| Sceptre            | Str and Int; ignite, freeze, shock, burning damage, typed %                                                 | Dex too                                            |
| Sword, axe, mace   | Bleed (sword, axe, mace), stun threshold; Str/Dex/Int by type                                               | The same 22 families as every other melee weapon   |
| Rune dagger \*     | All spell mods: spell damage, added spell damage, spell crit, DoT multiplier, extra chaos, typed gem levels | None (class `dagger`)                              |
| Warstaff \*        | No spell damage, spell flats, cast speed or spell crit; still ailment chance, burning, typed % suffixes     | The whole caster pool (class `staff`)              |
| Thrusting sword \* | Flat elemental at weight 2000, a normal sword 1200                                                          | Treated as a sword                                 |

`itemTags` (`loot.ts:32`) keys on `itemClass` and hands. Rune dagger and warstaff are families **inside** a class (COVERAGE C2), so they
inherit the class's slots. That was a documented decision; this is what it costs.

## 5. Calculated differently

A Bob mod is local only if its template says `local: true`; `weaponStats` (`src/calc/items.ts:27`) folds the local ones into the hand.

| Mod                        | Bob                                                                                                                                                 | 3.9                                                                                                                          | Why it matters                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Accuracy suffix            | **Global** (`g('accuracy')`), +10 to +450, one family shared with helmet, gloves, ring, quiver                                                      | **Local**, +80-130 to +625-780 at item level 85                                                                              | Bob's counts for both hands (dual wielding exists); the top roll is ~60% of 3.9's                                                             |
| Life on hit                | Global stat `lifeOnHit`, added in `sim/combat.ts:528` for every hit that resolves there, spells included                                            | Local, "for each enemy hit by Attacks", +2 to +5                                                                             | A wand with it heals on spell hits                                                                                                            |
| Attack speed               | Local; wand and bow reach 27%                                                                                                                       | Local; wand and bow cap at (17-19)%                                                                                          | Bob gives ranged weapons the melee ceiling                                                                                                    |
| Flat added damage          | One scale for every weapon. Top tier: physical (22-28) to (40-46), fire (50-63) to (95-109), cold (45-56) to (85-98), lightning (8-10) to (170-195) | Three scales (1h, 2h, bow), 9-10 tiers. 1h fire (82-112) to (167-194); 2h (132-179) to (267-311); bow (103-140) to (209-243) | Bob's elemental top averages 55-60% of the 3.9 one-hand average and 36% of the two-hand. Physical is ~100% of 1h, ~62% of 2h                  |
| Base weapon damage         | Tier-5 averages: sword 136, 2h sword 157, bow 153, wand 65                                                                                          | Best 3.9 bases: 1h sword ~77, 2h sword 75-85, bow 63, wand 47                                                                | About twice 3.9's, so a flat roll is roughly a third as large a part of a weapon's damage. One-handers carry a ×1.6 bonus (`ONE_HAND_DAMAGE`) |
| Physical %                 | (150-179)%, weight ×1.3, 8 tiers                                                                                                                    | (170-179)%, 8 tiers                                                                                                          | Same ceiling                                                                                                                                  |
| Tier odds                  | Weight ∝ (n − 0.6 i) / n: top of 8 tiers is 47% of the lowest                                                                                       | Per mod. Physical %: 1000 ×3, 400, 200, 100, 50, 25. Flat fire: 1200 ×7, 960, 420, 108. Accuracy, stun threshold: flat 1000  | Top-tier physical % is 8% of Bob rolls, 0.7% of 3.9's                                                                                         |
| Spell damage, cast speed   | One ladder for every caster: 8% to 89%, 5% to 29%                                                                                                   | Wand and sceptre (100-109)% and 23-25%; staff (150-164)% and 35-38%                                                          | Staves get no premium for two hands                                                                                                           |
| Ailment chance             | Global additive base chance (`calc/skill.ts`), 5% to 25%                                                                                            | Wand 6-8% at one item level                                                                                                  | See section 3                                                                                                                                 |
| Crit chance and multiplier | Crit chance local; multiplier global                                                                                                                | Same                                                                                                                         | Same; the text differs (section 8)                                                                                                            |

The local chain itself matches: flat added before local physical %, local attack speed and crit multiplicative, local accuracy added to the
base. Nothing in `weaponStats` differs from 3.9's order.

## 6. Implicits

Bob: `WEAPON_CLASS_DEFS` (`bases.ts`), a five-tier ladder per type. 3.9: `docs/coverage/pob-bases.json`, 20-26 bases per type.

| Type            | Bob (tier 1 to 5)                           | 3.9                                                                                |
| --------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1h sword        | +20 to +330 accuracy (local)                | 40% global accuracy on most; flat accuracy early; 4-6% dodge at the top            |
| 2h sword        | +40 to +500 accuracy (local)                | 30-40% global accuracy; flat accuracy; +40/+60% crit multiplier at the top         |
| Thrusting sword | +30 to +400 accuracy (local)                | +25% to +35% crit multiplier; bleed chance at the top                              |
| 1h axe, 2h axe  | none                                        | none (8-12% global physical on three 1h; +50% crit chance on three 2h)             |
| 1h mace         | 15% reduced enemy stun threshold            | 10-15% (+4-6% attack speed on two)                                                 |
| 2h mace         | 25% reduced enemy stun threshold            | **30-45% stun duration**; 4-6% area on two                                         |
| Sceptre         | 10% to 22% elemental damage                 | 10% to 40%; penetration on two                                                     |
| Dagger          | 20% to 40% crit chance                      | 30-50% global crit chance; 4-6% block on three                                     |
| Rune dagger     | 18% to 38% spell damage                     | not in the base data                                                               |
| Claw            | +2 to +40 life on hit                       | +3 to +50 life per hit; mana on hit on some; 1.6-2% physical leech on the top ones |
| Wand            | 10% to 30% spell damage                     | (8-12)% to (36-40)% spell damage; 10-14% cast speed on two; one rolls minion mods  |
| Staff           | +12% to +18% block, 15% to 40% spell damage | +18-20% block; 80-100% global crit chance on three. No spell damage                |
| Warstaff        | +12% to +18% block, 12% to 30% melee damage | not in the base data                                                               |
| Bow             | none                                        | none; crit multiplier, elemental %, crit chance or movement speed on some          |

What changes behaviour: the 2h mace (threshold makes everything stun more, duration only lengthens stuns), the staff (Bob adds spell damage
that 3.9's staff does not have) and the thrusting sword (accuracy against crit multiplier). The rest is the same idea at other numbers.

## 7. Other routes to a weapon line

| Route      | 3.9                                                                                                                                                                                                                                                                                                                                                         | Bob                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bench      | About 100 distinct weapon crafts (364 entries counting tiers and types): added damage in every element and to spells, % damage, attack and cast speed, crit, accuracy, leech, minion, trap and mine mods, many hybrids (physical % with impale, bleed, blind or poison; fire % with ignite), "cannot roll attack/caster modifiers", prefix and suffix locks | 11 recipes, none weapon-specific. On a sword **no add recipe is eligible** (life, resistances and global attack speed all exclude weapons); on a wand only cast speed. Removal and sockets still work                                                                                                                                  |
| Essence    | Mod-specific, tiered                                                                                                                                                                                                                                                                                                                                        | 9 currencies, each a themed list. Those that reach a weapon offer `physLocal`, `aspdLocal`, `accuracy`, `lifeOnHit`, `areaEffect`, `poisonChance`, `igniteChance`, `mana`, `manaRegen`. **No essence adds flat damage, a spell mod or crit** to a weapon; `addFireAttacks` and `addChaosAttacks` are jewellery, gloves and quiver only |
| Corruption | About 40 weapon implicit kinds (extra arrow, extra projectile, charge gain, socketed support gems, flat added damage at 3 tiers, crit, speed)                                                                                                                                                                                                               | Rot Seal: +1 socketed gems or +2% maximum fire, cold, lightning or chaos resistance, one of four 25% outcomes. The four resistance lines cannot occur on a weapon in 3.9                                                                                                                                                               |
| Quality    | Weapons have quality (physical damage), and a bench hybrid                                                                                                                                                                                                                                                                                                  | None in the game                                                                                                                                                                                                                                                                                                                       |

## 8. Presentation

The card is `ItemCard.tsx`; the Workbench is `Workbench.tsx` and `craftPlan.ts`.

- **The weapon line shows the base, not the item.** `ItemCard.tsx:147-151` prints `min–max physical · aps APS · crit% crit` from `b.weapon`.
  `weaponStats(item)`, which does the local maths, is not called from any file in `src/ui`. A sword with +179% physical, a flat fire roll, 25%
  attack speed and 38% crit shows what its white base shows. 3.9 prints Physical Damage, Elemental Damage, Critical Strike Chance and
  Attacks per Second after the mods. The only measure of a weapon's worth in Bob is the DPS change in the comparison.
- **Tier is not on the card**; it is in the Workbench (`tier 3/8` and where the roll sits; ITEMS.md W6). The numbering is **opposite** to
  3.9's: Bob tier 1 is the weakest, 3.9 tier 1 is the best.
- **Wording differs from 3.9** for these weapon mods:

  | Bob                                                                                  | 3.9                                                |
  | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
  | `+5% to chance to Ignite`                                                            | `5% chance to Ignite`                              |
  | `+5% to chance to cause Bleeding`                                                    | `Attacks have 20% chance to cause Bleeding`        |
  | `+5% to chance to Poison on Hit`                                                     | `20% chance to Poison on Hit`                      |
  | `N% increased Damage with Spells`                                                    | `N% increased Spell Damage`                        |
  | `N% increased Elemental Damage with Attacks`                                         | `N% increased Elemental Damage with Attack Skills` |
  | `+N% to Critical Strike Multiplier`                                                  | `+N% to Global Critical Strike Multiplier`         |
  | `Gain N Life per Enemy Hit`                                                          | `+N Life gained for each Enemy hit by Attacks`     |
  | attack speed, crit chance, accuracy, mana, cast speed, stun, area, flat added damage | same                                               |

  The chance lines come from the generic `pct` rendering of a `base` stat (`modText`, `src/mods/text.ts`); giving the five `chance.*` stats
  a `base: '{v}% chance to Ignite'` template in `statText.ts` fixes them together. "+5% to chance" reads as an addition to a chance the item
  does not otherwise have, which is the only wording here that misleads.

- **Bug: `lineKey`, `ItemCard.tsx:45`.** The regex is `/d+(.d+)?/g`, without backslashes, so it matches the letter d rather than digits.
  `lineMarks` never finds "the same stat with another number" and never marks `diff`. A craft that raises attack speed from 20% to 24%
  shows one lost line and one gained line in the Workbench result panel (`WbResult.tsx`) and in the Items comparison (`ItemDetail.tsx`)
  instead of one changed line. The fix is `/\d+(\.\d+)?/g`. Not applied: this audit changes no code.

## 9. What I would do first

Ranked by how much each changes the feel of a weapon:

1. **Show the weapon.** Print the resolved damage, elemental damage, crit chance and attacks per second from `weaponStats` on the card.
   No engine change.
2. **Fix the rune dagger and warstaff tags.** An attack/caster flag on the weapon class definition instead of inferring from `itemClass`.
3. **Gate by class where 3.9 does and the design agrees:** the attributes (a wand that rolls Str makes no sense) and the ailment chances
   (most of the sameness).
4. **Add the missing families that change a build**, in this order: local life leech, resistances, the physical % + accuracy hybrid, typed
   spell % and the two DoT multipliers. Each is a new `FamilyDef`; the calc already reads `leech.life`, `resist.*`, `dotMulti` and typed
   `damage` inc.
5. **Decide the tier-odds curve.** Bob's gentle falloff means a late weapon is nearly always high tier; 3.9's cliff is what makes a good
   roll rare. A design call, not a defect.
6. Make weapon accuracy local and gate life on hit to attacks, once the rest is settled.

## Reproducing the numbers

The parse of `ModItem.lua` and `ModMaster.lua` and the per-class tables came from throwaway scripts in the session's scratchpad, not the repo.
A `coverage:mods` extractor writing `docs/coverage/pob-mods.json`, in the pattern of `coverage:bases` and `pob-bases.json`, would make this
audit repeatable; the raw Lua would stay outside the repo.

## 10. Decisions (2026-10-16) and what is still open

The author answered the open questions the same day. Done:

1. **Ailment chances and stun threshold** follow the 3.9 kinds. Ignite, freeze, shock: `igniteChanceWeapon` (wand, sceptre) and `igniteChanceWeapon2h`
   (staff), one tier at item level 15, and likewise for shock and freeze. Bleed (`bleedWeapon`: sword, axe, mace, bow) and poison
   (`poisonWeapon`: claw, dagger, sword, bow) are the 3.9 hybrids of chance and increased damage with the ailment, three tiers. `enemyStunThreshold`
   is for sword, axe, mace, sceptre, staff with the 3.9 ladder. The old plain families stay on gloves (`FamilyDef.not` and the slot lists
   keep weapons out).
2. **Area of effect** is off weapons (gloves, amulets and belts keep it).
3. **Socketed gem level** matches 3.9: `weaponGemLevel`, +1 at item level 50 on every attack weapon (the tag `attackWeapon`); the +1/+2 family
   `gemLevel` is now helmets and body armour only. Correction (2026-10-16, docs/AUDIT-ARMOUR-AFFIXES.md section 4): the weapon part matches
   3.9, but plain 3.9 helmets and body armour roll no socketed gem level mod, so `gemLevel` there is a Bob extra, not a match.
4. **Tier odds:** the top tier of a family is 25% as likely as the lowest (`TOP_TIER_WEIGHT`), where it was 47%. The author's call: a solo
   run finds far fewer items than the reference game's economy, so good rolls are kept within reach. This is the one deliberate departure.
5. (Base weapon damage was brought to the reference numbers on 2026-10-18, every reference base with it: [AUDIT-ITEM-BASES.md](AUDIT-ITEM-BASES.md); the lever named below is now `WEAPON_DAMAGE_SCALE`.) **Flat added damage** has the 3.9 tables for one hand, two hands and the bow (`src/data/weaponTables.ts`): `addPhysLocal`/`2h`,
   `addFireLocal`/`2h`/`Bow` (and cold, lightning), `addChaosLocal`/`2h`, and the spell flats `addFireSpells`/`2h` (and cold, lightning).
   Base weapon damage was left alone, so flat damage now weighs about as much against a base as the table values say; the bot to map 25 shows
   no change (it dies at the gate bosses either way), so the real effect on late power is unmeasured. If late weapons turn out too strong,
   bringing the base damage of the five tiers down is the lever.
6. **Attack speed** on bows and wands has its own five-tier ladder to 17-19% (`aspdLocalRanged`).
7. **Spell damage and cast speed** on weapons have a one-hand and a two-hand ladder (`spellDamageWeapon`/`2h`, `castSpeedWeapon`/`2h`);
   the amulet and ring families keep Bob's own numbers.
8. **Base implicits** follow the 3.9 base nearest each of Bob's five levels (`WEAPON_CLASS_DEFS`): accuracy on swords, stun duration on the
   2h mace, block only on the staff, crit multiplier on the thrusting sword, 30% crit on daggers, life per hit on claws, and so on. Rolled
   ranges are taken at their middle. The rune dagger and warstaff keep Bob's own implicits (the 3.9 base data has no such bases).
9. **Minion damage on weapons** was removed: in 3.9 only the Convoking Wand base (a level 72 wand that says "Can roll Minion Modifiers") can
   roll it, and Bob has no such base.
10. Bench, essence, Rot Seal and quality questions: dropped (Bob has no crafting-only affixes to match). The essences were pointed at the new
    weapon families where a family of theirs had been split.

Not done, by decision: socketed fire, cold, lightning and chaos gem levels for the attack dagger and attack staff, and light radius.

**Still single-scale.** Other 3.9 families also differ between one hand and two hands (maximum mana, typed damage % prefixes, damage over time
multipliers, extra chaos damage, elemental damage with attacks, burning damage, the spell damage and mana hybrid). They keep one scale each.

**Dual wielding.** In 3.9 life leech, life on hit and accuracy are the weapon's own. Accuracy is now local. Leech and life on hit are still
the character's: with two weapons the leech affixes of both apply to every hit. Making them per hand is moderate work (about a day): the
weapon's local mods would give each hand its own leech and life-on-hit (`weaponStats`, `HandProfile`), the hit code (`hit` in
`sim/combat.ts`) already knows the hand, and the sheet would need the same sums. It matters only to dual-wield builds.
