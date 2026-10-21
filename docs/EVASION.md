# Evasion and accuracy against the reference game

Built 2026-10-10. The aim: a player who puts the same amount into evasion or accuracy should deal with enemies about as they
would in the reference game. `npm run evasion` (`scripts/coverage/fit-monster-defence.ts`) prints everything below.

## 1. What was wrong

The character page showed 100% hit chance, and it was right to. Bob's monster evasion was a straight line (`30 + 12 m`); the
reference game's monster evasion is an exponential in the level. The formula for hit chance is the same in both games
(`1.15 · acc / (acc + (eva / 4)^0.8)`, 5% to 100%), so only the monster numbers differed:

| Level | Monster evasion, before | Monster evasion, reference | Monster accuracy, before | Monster accuracy, reference |
| ----- | ----------------------- | -------------------------- | ------------------------ | --------------------------- |
| 10    | 150                     | 259                        | 160                      | 23                          |
| 30    | 390                     | 994                        | 440                      | 59                          |
| 60    | 750                     | 3,556                      | 860                      | 211                         |
| 84    | 1,038                   | 8,120                      | 1,196                    | 538                         |
| 100   | 1,230                   | 13,445                     | 1,420                    | 980                         |

So a character hit 100% of the time at any level, and, the other way round, a monster with four times the reference accuracy
hit a character 100% of the time whatever its evasion. Evasion was worth nothing.

## 2. What changed

- `monsterEvasion(m) = (50 + 16 m) · 1.0212^m`, which equals the reference table at every level from 1 to 100.
- `monsterAccuracy(m) = (12.9 + 0.385 m) · 1.0299^m`, within 2 points of the table (4% at worst, at levels 10 to 20, where
  the numbers are small).
- Both are formulas in `src/data/constants.ts` and `src/calc/formulas.ts`, not tables: the 100-entry tables are reference
  data and stay in `reference/coverage/ref-monster-stats.json` (DESIGN.md 3), and a formula goes on past level 100 for the
  map-level offsets. `formulas.test.ts` holds the fit to the table.
- Monster types keep their own evasion modifiers (the defence profiles of docs/ROSTER.md 6.2 multiply the level's value), so
  an evasive type is still evasive in proportion.
- **The build matrix** (`src/calc/matrix.ts`) used to give its reference player 60% of a monster's accuracy at the level. It
  now has its own curve (`referenceAccuracy`, `12 + 8.4 · level`, which is what 60% of the old curve was), so a type's life
  still pays for its evasion as the evasion really costs a player hits. The durability of an evasive type (the gloomstalker, the gnawer, the cutpurse) rises by a few percent, so its life falls by about as much, and that of an easy-to-hit one (the archer) falls a little (`npm run matrix`).

## 3. The constant factors on the player side

"The same amount of resources" only means something if the player's side is on the same scale, so it was compared first
(`npm run evasion`, plain gear: the best pure-evasion piece in each of the four armour slots and the best flat-accuracy sword
the level allows, no affixes, passives or gems, dexterity equal to level):

| Source                            | Bob                 | Reference           | Factor |
| --------------------------------- | ------------------- | ------------------- | ------ |
| Base evasion                      | `53 + 3 · level`    | the same            | 1.0    |
| Base accuracy, per level          | 2                   | 2                   | 1.0    |
| Accuracy per dexterity            | 2                   | 2                   | 1.0    |
| Evasion per 10 dexterity          | 2% increased        | 2% increased        | 1.0    |
| Weapon accuracy, best sword (L60) | 330                 | 400 to 460          | 0.7    |
| Total accuracy, plain gear (L60)  | 640                 | 640                 | 1.0    |
| Evasion armour, four slots (L60)  | 1,289 with the base | 1,537 with the base | 0.84   |
| Evasion armour, four slots (L100) | 1,409               | 2,075               | 0.68   |
| Evasion armour, four slots (L30)  | 386                 | 722                 | 0.53   |

The accuracy side needs no factor: the weapon is a little weaker, but Bob's total is the same at level 60 (640 and 640) and
within 10% at level 100. The evasion side is lower: Bob's armour bases came in four tiers (levels 1, 20, 40 and 60) and stopped
at 480 for a body, where the reference's grow smoothly past 800 (since 2026-10-18 the bases are the reference's, one for each:
the local reference audit `reference/docs/AUDIT-ITEM-BASES.md`, not in the repository). That cost a plain-geared evasion character up to 15 points
more hit chance taken at levels 10 to 30, between tiers, and 4 to 7 at level 60 and above (table below). It was not corrected: the
effect is small next to the 100% it replaces, and scaling the armour tiers touches armour and energy shield too. If it is
corrected later, the rule that keeps the interaction equal is: where a player's evasion is a factor `k` of the reference's,
monster accuracy scales by `k^0.8`; where a player's accuracy is `k` of the reference's, monster evasion scales by `k^1.25`
(the formula is linear in accuracy and has evasion to the power 0.8, so equal `acc / (eva / 4)^0.8` means equal hit chance).

## 4. The result

A character in plain gear, hit chance each way (the first number of each pair is Bob before, the second Bob now, the third the
reference game):

| Level | You hit a monster (before / now / ref) | A monster hits you (before / now / ref) |
| ----- | -------------------------------------- | --------------------------------------- |
| 10    | 91% / 82% / 86%                        | 100% / 65% / 50%                        |
| 30    | 100% / 92% / 91%                       | 100% / 69% / 55%                        |
| 60    | 100% / 85% / 85%                       | 100% / 78% / 74%                        |
| 84    | 100% / 72% / 74%                       | 100% / 96% / 90%                        |
| 100   | 100% / 63% / 65%                       | 100% / 100% / 100%                      |

Your hit chance now follows the reference game's to within 4 points at every level shown but 20, where it is 10 higher (the
reference game's swords of that level have a percent accuracy implicit, which this comparison leaves out). Hit chance against
you is within 7 points from level 60 on; the gap is up to 15 points at levels 10 to 30, where Bob's armour tiers lag (above).

**What it did to the bot** (`scripts/simpar.sh`, 8 runs a class, seeds 7 and 11, difficulty as shipped; the same code
otherwise, in clean checkouts): mean map reached 27.2 before and 28.8 after over the 96 runs (24.2 and 28.0 on seed 7, 30.2
and 29.7 on seed 11), which is inside the noise of a sample this size. The median character level after map _n_ is still
within 3 of _n_ at maps 25 and 50 (DESIGN.md 5.4's acceptance is 4; at map 75 the samples are two runs, 76 and 80, and was 79
before), so `measuredXp.ts` was not regenerated. By class, the median map reached was higher on both seeds for the reaver and
the zealot and lower on both for the strider (14.5 to 13, 36 to 29) and the shade (29.5 to 29, 33 to 25); the vanguard and the
mystic went both ways. Those are the two Dexterity classes, which is what a harder-to-hit monster would hit, but eight runs a
class cannot tell that from noise. Nothing was retuned.

## 5. Left alone

- **Evasion entropy.** The reference game rolls evasion for players with an entropy counter; Bob rolls plain chances for
  everyone (DESIGN.md 2.1). The long-run hit rate is the same.
- **Armour.** `monsterArmour` (`20 + 10 m`, a straight line) was not compared with the reference game's table. Out of scope
  here.
  players meet. Bob follows them level for level because its levels go to 100.
- **Percent mods and flat affixes.** Increased evasion and accuracy on the tree and on gear, and the flat accuracy and evasion
  affixes, were not compared with the reference game's (its affix data was not reachable). Percent mods multiply a base, so
  the base's scale does not affect them; Bob's top tier of increased evasion is about +100%.
- **The sword.** One flat-accuracy implicit of the reference game was compared (`sword`, 330 against 460); the weapon types
  with a percent implicit were not.
