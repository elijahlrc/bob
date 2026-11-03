# Monster speed: a fast half

Plan, 2026-11-03. Built the same day as a first pass, to be judged by play.

## Why

Too many monsters are held up by minions or killed before they reach the character, so a fight rarely comes to the
character at all. Half the monster types become much faster, so that some of every map arrives before the minions or the
damage can stop it, while the other half keeps its pace.

## Decided (the owner, 2026-11-03)

- **Half the types, not half the monsters.** About half of the monster types become fast for good: a fast type is always
  fast, so the player learns which ones rush them. No roll per monster or per pack.
- **Chosen by the fiction.** Which types are fast follows what each one is, not an even spread: a faction of hunting
  animals may be mostly fast, a faction of machines mostly slow.
- **About twice as fast.** A newly fast type moves at about twice its present speed.
- **Types that are already fast** become about a third faster and count toward the half.
- **Every type that moves** is a candidate, ranged and casters included. Stationary types (nest, pylon, bell, arbalest)
  stay put.
- **Bosses** become about a third faster too: some are slow enough that they struggle to reach the character.
- **Movement styles that set their own pace** (momentum, lurch, hop and the like in `src/data/movement.ts`) are multiples
  of the type's speed, so they speed up with it: the Rend-boar still starts slow and builds up, from twice as high.
- **The Gorger stays fast and still eats:** while hungry it looks for a body in reach every tick, so it does not run past
  one.
- **No cost.** A fast type keeps its life and damage, so maps get harder.
- **Nothing new is shown to the player.** They learn which types are fast by meeting them.
- The other half keeps about its present speed.

## Where things stand

- A type's speed is `speed` in `MONSTER_TYPES` (`src/data/monsters.ts`), in tiles a second, turned into the monster's
  `moveSpeed` in `src/calc/monster.ts`. Map affixes and monster mods add to it as they do now.
- 44 pack types move. Their speeds run from 1.2 to 5.5, median 2.4; ten are at 3.5 or more. The character's base speed is
  4.0. So at about twice its speed, a median type outruns a character with no movement speed.
- The moving bosses run from 1.8 (the Bulwark Engine) to 6 (the Courser); eight of the eleven are at 3 or less.

## The fast half

22 of the 44 moving pack types, chosen by what they are. Speeds now; the ten already fast get a small increase, the
twelve newly fast about double.

| Faction     | Already fast                      | Newly fast                                                           | Stays as it is                                    |
| ----------- | --------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| Ossuary     | Bone Crawler 4.4                  | Skeleton Warrior 3: the rank and file that charges                   | Brute, Shieldbearer, Archer, Mage, Charnel Heap   |
| Kennel      | Kennel Hound 3.6, Stalker Cat 3.8 | Rend-boar 2: a charging boar; Handler 2.8: runs with the pack        | (none)                                            |
| Swarm       | Carrion Bat 4.4, Gnawer 4.6       | Silkspinner 2.6: a spider; Bone Beetle 2.2: scuttles                 | (Nest stationary)                                 |
| Ashen Choir | (none)                            | Flagellant 3.2: a frenzied zealot                                    | Censer-bearer, Choirmaster, Hexer                 |
| Drowned     | Brine Leech 3.8                   | Drowner 3.2: lunges from the water                                   | Wrack, Tidecaller                                 |
| Emberborn   | Cinderling 5.2                    | Slagworm 3: darts through the slag                                   | Slag Brute, Pyre Priest                           |
| Gilded      | Cutpurse 4.5                      | Lurking Coffer 3.2: a snapping chest; Gilt Slinger 3: a street tough | Gilded Guard, Bursar                              |
| Hollow      | Gloomstalker 3.5, Mana Wisp 5.5   | Wailer 2.4: a screaming ghost that rushes                            | Hollow Watcher, Lantern Wight                     |
| Rot         | (none)                            | Gorger 2: ravenous                                                   | Shambler, Bloater, Spitter, Carrion Hag           |
| Reliquary   | (none)                            | (none): slow machines                                                | Core Golem, Sentinel (Arbalest, Pylon stationary) |

The list is a first pass, to be changed by play.

## The change

1. Set the speeds: about twice for the twelve newly fast types, about a third faster for the ten already fast and for
   every moving boss.
2. Play early and middle maps with a minion build and without one, and adjust the list or the numbers by feel.

No save changes: speed lives on the type, not on anything saved.
