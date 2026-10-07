# Coverage data and tools

Reference data for [COVERAGE.md](../COVERAGE.md). Nothing here is loaded by the game, and nothing here may be copied
into `src/` (DESIGN §3): names and text from the reference game live only in `docs/` and `scripts/`.

## Files

| File                    | What it is                                                                                                  | Made by                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `reference-3.9.0.json`  | Every gem and unique in scope: name, class, tags, release version, wiki page, current wiki mod text         | `npm run coverage:fetch`        |
| `pob-skills.json`       | 3.9-era numbers for every gem: skill types, stats, level 1 and level 20 values, mana cost, effectiveness    | `npm run coverage:pob -- <dir>` |
| `pob-uniques.json`      | 3.9-era unique item lines, with their `{variant:N}` markers                                                 | `npm run coverage:pob -- <dir>` |
| `map.json`              | Bob id → reference name, status and a note. Hand-maintained: every droppable Bob gem and unique has a line  | by hand                         |
| `bucket-overrides.json` | Optional `{"Reference name": "bucket"}` fixes to the keyword bucket tagging (`scripts/coverage/buckets.ts`) | by hand                         |

`reference-*.json` and `pob-*.json` are in `.prettierignore`: they are generated, not formatted.

## Commands

- `npm run coverage` prints coverage by category, bucket and milestone (`-- --list` also lists what is uncovered).
  `scripts/coverage/coverage.test.ts` checks that `map.json` is sound: every Bob id is mapped and every mapping points
  at a real reference name.
- `npm run coverage:fetch` re-fetches the reference list from the wiki's Cargo API.
- `npm run coverage:pob -- <dir>` re-extracts the numbers from an unzipped Path of Building `Data` folder.
- `npm run coverage:draft -- gem|unique "Name" ...` writes a draft entry to `scripts/coverage/staging/` (git-ignored).

## Map statuses

- `covered`: a Bob entry reproduces the reference entry's defining mechanic. Counts.
- `partial`: it reproduces some lines but not the defining mechanic (COVERAGE 1.2 question 1). Does not count.
- `planned`: scheduled for a milestone. Does not count.
- `excluded`: the Bob entry is not an analog of anything (the `ref` is empty). The note says why.

Several Bob entries may map to one reference entry (a leveling version and its endgame version); it counts once.
A support gem is referred to by its full wiki name, with the "Support" suffix: the active gem "Barrage" and the support
gem "Barrage Support" are different entries.

## Provenance

### Reference list (`reference-3.9.0.json`)

From the PoE wiki Cargo tables `items` and `skill_gems` (https://www.poewiki.net/w/api.php). Filters:

- **Gems.** Class Skill Gem or Support Gem; `release_version` at most 3.9.x (blank means original content); not
  removed before 3.9.0; no Vaal gems, Awakened gems or Portal. Result: 219 active and 130 support, as in COVERAGE C-5.
  Versions are compared as numbers (`"3.10.0"` sorts before `"3.9.0"` as a string).
- **Uniques.** Rarity unique; same version rules; classes excluded: Jewel, Abyss Jewel, Map, Watchstone, Fishing Rod,
  Item Piece, Contract, Idol, Relic, Sentinel, Tincture; not a replica; `is_in_game` true; one entry per name (44
  duplicate-name entries are variants and are folded in). Result: **782**, of which 26 are flasks.
  The first fetch counted 797. The 15 difference is the wiki's "not in game" entries (Ashes of the Sun, Band of the
  Victor, Blood of Summer, Chains of Time, Fragment of Eternity, Qotra's Hypothesis, Relic of the Cycle, Remnant of
  Empires, Rust of Winter, Scar of Fate, Slivers of Providence, Splinter of the Moon, Tear of Entropy, Thunder of the
  Dawn, Vestige of Divinity).
- **76 uniques have `drop_enabled` false** (the Demigod's set and other boss, prophecy, vendor and league items). They
  count: they are items that existed in 3.9.0. They are the likeliest to be skipped as "hard", and each skip is noted
  in `map.json`.
- **Names are current wiki names.** Some gems have been renamed since 3.9 (the wiki's "Multiple Projectiles" is
  "Lesser Multiple Projectiles" in the 3.9 data, and its "Chance to Poison" is "Poison"). The IP test denies the
  3.9-era names from `pob-*.json` as well.
- **Mod text is current**, not 3.9's. Use `pob-uniques.json` for the 3.9 lines.

### Path of Building data (`pob-*.json`)

- Repo `PathOfBuildingCommunity/PathOfBuilding`, tag **v1.4.155**, commit **e3719726d7**, released 2019-12-14: the day
  after 3.9.0 launched and the last release before 3.10 (2020-03-13).
- Raw files stay outside the repo (download
  https://github.com/PathOfBuildingCommunity/PathOfBuilding/archive/refs/tags/v1.4.155.zip, about 26 MB, and point
  `coverage:pob` at the `Data` folder). Only data is read; no PoB code is used (DESIGN §3).
- `pob-skills.json` has 418 gems with their numbers (419 existed at 3.9). 21 reference gems are not found by name,
  mostly because the two sources name them differently: Chance to Poison, Creeping Frost, Critical Strike Affliction,
  Crushing Fist, Dark Bargain, Glacial Shield Swipe, Hallow, Hextouch, Holy Sweep, Infernal Cry, Kinetic Blast of
  Clustering, Manabond, Momentum, More Duration, Multiple Projectiles, Predator, Rolling Magma, Siphoning Trap of
  Pain, Sniper's Mark, Spectral Helix, Swordstorm. Match them by hand when drafting.
- `pob-uniques.json` has 749 non-jewel uniques with variants. 45 reference uniques are not found by name, mostly
  Demigod's items, items from the last leagues, and renames (Angler's Plait, Astral Projector, Badge of the
  Brotherhood, Breathstealer, Cold Iron Point, the three Cowls, Crown of the Inward Eye, Eye of Malice, Fury Valve,
  Hands of the High Templar, Icefang Orbit, Leash of Oblation, Machina Mitts, Manastorm, Mistwall, Mother's Embrace,
  Painseeker, Paradoxica, Precursor's Emblem, Rotting Legion, Siegebreaker, Sporeguard, Talisman of the Victor, The
  Black Cane, The Ivory Tower, The Jinxed Juju, The Queen's Hunger, The Saviour, The Stampede, Torchoak Step, Triad
  Grip, Venopuncture, Warrior's Legacy, Willowgift, and the Demigod's set). For these, draft from the wiki text.
- **Gem numbers are not Bob numbers.** A 3.9 spell's min and max are _ratios_ of a per-level base damage scaled by its
  damage effectiveness. Rescale against Bob's own tables (open question 5 keeps level 1 and 20 as anchors).
