# Test audit (2026-10-16)

Every test in `src/` and `scripts/` was read against one question: **if this test failed tomorrow, would the likely cause be
a bug, or a deliberate change of design?** Tests of the second kind (pins of tuning values, counts, schedules, text and
looks), tests that can practically never fail (tautologies the types already guarantee, formulas copied from the code, data
read back from a table) and duplicates were removed. Where a test held a real mechanism check beside a pin, the pin was
dropped or loosened to the relation the test is about (`toBe(37)` → `> plain`), and the mechanism was kept.

Kept on purpose: mechanism tests (including Path of Exile 3.9 rules), relational checks, smoke tests over all content,
determinism and invariant sweeps, sim ↔ sheet parity (`sheetVsSim.*`, `rotationVsSim`, `convergence`), regression guards,
generated-file staleness checks, save migration, and the policy tests (`ip.test.ts`, the tree bake check, boss rule 4,
the speed floors).

## Summary

|                                         | before | after |
| --------------------------------------- | -----: | ----: |
| tests run by vitest (loops expanded)    |   2998 |  2804 |
| summed test time, seconds (all workers) |    161 |   100 |
| test files deleted                      |        |     0 |
| snapshot files deleted                  |        |     2 |

About 185 test blocks were removed and about 290 changed. By reason, the removals were roughly: tuning, count and schedule pins
(~70), text and look pins (~35), tautologies and data read-backs (~40), formulas copied from the code (~12), and duplicates
(~15).

**Bug found on the way (not fixed here):** `rollUnique` (`src/gen/loot.ts`) rolls a unique's range with `rng.int`, so a
fractional range such as leech 0.6–0.8 rolls 0.6 or **1.6**. Four uniques are affected (`lastSprint`, `slaughterPendant`,
`drakeHidePlate`, `emberHaloMail`): they sometimes roll about double the leech authored. The test "uniques roll within their
authored ranges" now checks only the Gravehammer; widen it to every unique once the roll is fixed.

**Slowest tests:** `stopsMore` "plays runs that take every stop it can use" (31 s) was removed as a duplicate of the `stops`
bot run, which now stops at the first seed that takes a stop (16 s → about 3 s). The tree snapshot (1.9 s) and the 3.5 s
provisions bot run that asserted only `maps.length > 0` were removed, and the faction-unique drop test runs 4,000 rolls
instead of 20,000 (5.5 s → 1.3 s).

## Removed and changed, by file

R = removed, C = changed (what was dropped or loosened).

### data, core, mods, scripts

- **data/archetypes**
  - R "every archetype is used by some type, and has its words": a tautology plus a design rule.
  - R "the stat bands are occupied: three types in each speed band, two in each reach band": a roster pin.
  - R "a faction fields at least three archetypes": a roster pin.
  - R "every other type is hard to something and soft to something, by a fifth or more": a design rule.
  - R "each kind of damage is hard for two factions and soft for two": a design rule.
  - R "the probes are the eight of the plan": a count pin.
  - R "a profile has words, and a plain one has none": card text.
  - C "the profile reaches the monster…": 1.8 / 60 / −30 / 0.5 / 0.2 became relations against the Warrior.
- **data/biomes**
  - R "every biome has a name, a line of text and a distinct id": a tautology.
- **data/difficulty**
  - C "clamps bad numbers into range": dropped the exact bounds 2.5 and 0.25.
- **data/monsterMarks**
  - R "every monster affix has a mark and a description": guaranteed by the `Record` type.
  - R "has a colour for every rarity": guaranteed by the `Record` type.
- **data/tree/charter**
  - R "gives each region at least three templates…": a layout pin.
  - R "splits each group of related clusters into pods of two to four…": restates POD.
  - R "leaves clusters out on purpose…": a ratio pin.
- **data/tree/edits**
  - C "the saved edits leave a tree every class can walk…": dropped `keystones === 27`.
- **data/tree/tree** (the look is judged by pictures, not numbers)
  - C "has exactly 27 keystones… and about 445 notables": now only that the names match the keystone list.
  - R "is connected": covered by "can be walked".
  - R "a cluster has one way in, or up to four…": layout numbers.
  - C "roads are generic": `roads.length > 100` became `> 0`.
  - R "each class start reaches ≥ 4 keystones within 40 points…": layout numbers.
  - R "each class start has the spoke into the middle, two roads out…": layout numbers.
  - R "the first steps from a start are core… at least 3 notables within 8 steps…": layout numbers.
  - R "basic clusters stand in the empty ground round every start (FILL)…": a layout pin.
  - R "each class start reaches both neighbouring regions… within 20 steps": layout numbers.
  - C "notable names are unique and at most 4 notables share a mod set": dropped the limit of 4.
  - R "is deterministic and pinned (snapshot)": the snapshot pinned the look, and the bake check covers reproducibility. The `.snap` file is deleted.
- **scripts/coverage**
  - R "has the gem denominator of COVERAGE C-5": a count pin.
  - R "has the unique denominator of COVERAGE C-6": a count pin.
- **scripts/spirit**
  - R "counts add up": restates `summarise`.

### gen

- **gemDrops**
  - C "through the first twenty area levels the class's own attribute is favoured more strongly": dropped the exact weight ratios 4 and 2.
- **loot**
  - R "has every base that can drop": count pins.
  - C "has about 50 affix families and 350 tiers…": now only that every tier range runs from low to high.
  - R "every base has sane requirements": arbitrary bounds.
  - C "has at least 30 uniques with valid bases, levels spread 1–80": now only a valid base and a fitting level.
  - C "names magic items from their affixes…": the name now comes from `itemBase`.
  - C "uniques roll within their authored ranges": now within the def's range, not `toBe(40)` (see the bug above).
  - C "drop rates match the per-rarity chances": the 0.08 and 0.25 rates became magic > normal; dropped the mini-boss loop.
  - C "about 15% of drops are flasks; uniques only when their level allows": dropped the flask share.
- **packs**
  - R "every type has a role, and a faction that forms a phalanx has a front line": a type tautology plus a design rule.
  - C "a firing line has shooters behind the front…": the counts became an order.
  - R "a pack of the Ossuary is made of skeletons only": pins theme data.
  - C "the faction of a pack follows the shares of the theme": the band is now computed from the theme's weights.
- **wave1**
  - C "holds the 18 items and 5 flasks…": dropped the counts; id uniqueness is kept.
  - R "every item has a valid base, a level that fits it, and authoring notes": a duplicate and tautologies.
  - C "every flask has a unique-only base at its level, and notes": dropped the notes.
  - R "the new uniques cover their slots, and levels are spread": a design pin.
  - R "the unique weight is 1.5, three times what it was": a pure pin.
  - C "a faction's own uniques drop four times as often…": dropped `=== 4`; 20,000 → 4,000 rolls.
  - R "other reward picks are not all uniques": weak.
  - R "flask conditions exist for the flask rules": a tautology.

### calc

- **areaLook**
  - C "every motif is described, and every skill named in the tables is a gem": dropped the type-guaranteed half.
  - R "every skill that lands an area has a motif of its own": a completeness pin over a hand-kept list.
  - R "a skill with no motif of its own falls back…": a table pin.
  - R "the band of a beam is what it is made of…": a table pin.
- **formulas**
  - R "§12.1 monster scaling fixtures", levels 1 / 10 / 25 / 50 / 75 / 100 (6 tests): Bob's own constants.
  - R "has the tables for levels 1 to 100": static JSON length.
  - R "the reference player of the build matrix is about as accurate as a plain-geared character": a band around a tuned formula.
  - C "level penalty": 0.76 became `< 1`; dropped the 0.05 floor. The 3.9 safe zone is kept.
- **gems**
  - R "has the first 7 actives, 19 supports and 7 auras…": a milestone count.
  - C "auto-levels by character level and attributes": dropped the attribute-requirement pins.
  - R "projectile counts and chains grow every 5 levels": gem tuning.
  - C "supports apply only to matching actives…": the cost multiplier 1.2 became `> 1`.
  - R "turns a spread and an effectiveness into a damage range": copies the formula.
- **keystones**
  - C Arrow Weave: melee −0.3 became `< 0`.
  - C Shieldwall: 0.85 and 0.7 became relations; the 3.9 cap of 0.75 is kept.
  - C Steady Draw: 1.35 and 1/0.8 became relations.
- **keystones2**
  - R "all 27 keystones are in the tree": a count pin and a duplicate.
- **manaModel**
  - R "Lone Prism gives its mana only for hits by attacks": a data read-back.
  - C "counts less a skill it cannot pay for…": 0.2 (the fallback constant) became `> 0`.
- **reach**
  - R "the reason names the skill": text.
  - R "every refusal gives a reason": non-empty text.
  - R "most pairs are still offered": an arbitrary 0.8.
- **skillLook**
  - R "every aura gem looks like an aura or a herald": true by construction.
  - R "every delivery is taken by some gem": a content pin.
  - R "every element is dealt by some gem": a content pin.
- **verbs**
  - R "new conditions exist, are distinct, and fit the 32-bit mask": milestone scaffolding.
  - R "flags for instant crit leech are read": a field pass-through.
- **x8**
  - C "per-charge mods read the count": 0.8 became `> 0`; dropped the `+1` pin.
  - R "there are four hexes with the effects of the plan…": pins.
  - C "hex gems… apply on hit only with Hexing Strikes": `>= 20` became `> 0`.
  - C "Open Wounds… Brittle Doom… Feeble Grip…": the thresholds became relations.
  - R "Brittle Doom shifts the dummy-independent target…": trivially true, and the title did not match the assertions.
  - R "wave 3 uniques: there are five, each with a card text": a count and text.
  - C "Lullaby Silks…": dropped the level-11 pin.
  - C "Fervent Stride and Band of Endless Grit…": `+1` became `>`.
  - R "the tree after X8 has twelve new notables…": milestone scaffolding.
- **character**
  - C "diffSheets reports deltas": 20 became `> 0`.

### calc: sheet vs sim, rotation

- **sheetVsSim.afterhit**
  - C Bolt Cleave, Slag Blow 50%, Slag Lob (bursts twice), Whirl Shot, Whirl Shot extra projectiles: dropped the exact `volleyHits` and projectile pins; the sim/sheet ratios are kept.
  - C "Slag Lob: a smaller burst does not reach…": became fewer hits than without the area loss.
  - C "what a strike sends out has to hit too": the 0.75 bolt share now comes from `volleyHits`.
  - C "Gouge Shot…": dropped the upper bound.
- **sheetVsSim.channel**
  - C Blight Hail: dropped the 15–30 band.
  - C Judgement Tempest: dropped the formula pin.
  - C Thunder Spiral: dropped the formula pin.
- **sheetVsSim.deploy**
  - C "the sheet counts every arrow that bursts on the target": dropped the 6-arrow pins; the ratio is kept.
  - C "a target further off is reached by fewer of the arrows": dropped the 6-arrow pin.
- **sheetVsSim.melee**
  - R "a spin sweeps its hits; an echo or a trigger…; the storm is left once": copies the formula; parity covers it.
- **sheetVsSim.minions**
  - R "a spectre is one minion, and a second from the thirteenth level": gem design.
  - C "extra minions from the gear are counted": 1.5 became `> 1`.
- **sheetVsSim.patterns**
  - C "a target right at the aim is covered by pods": dropped two formula copies.
  - R "the first two volleys of Rain of Steel…": a tuning band.
  - C "a shotgun fan of 45 degrees…": became more hits close up.
  - R "a clone shoots as it appears…": copies `cloneDamage`.
  - C "an orb at a target far past the end of its path": `>= 2` became `> 0`.
  - R "only the cold strike of an element skill hits the one struck again, one use in three": gem design.

### render

- **dropLabel**
  - R "names items, gems, flasks and currency stacks": display names.
- **style/creatures**
  - R "the Ossuary warrior is the bare skeleton".
  - R "every faction has a palette of its own…".
  - R "bone is the Ossuary alone".
  - R "the Hollow are spectres, with no legs…".
  - R "a flesh body falls and stays; a spectre unravels".
  - R "a type may throw: the arm goes back and up, then over".
  - R "only a body that leaves a body behind can be raised".
  - R "silhouettes differ: no two types of different factions are near twins…".
  - These eight pin looks or type data.
- **style/figure**
  - C "walk cycles loop, attacks have anticipation…": kept only the walk loop.
  - R "ranged figures draw a bow; casters glow while charging": a look pin.
  - R "picks hero figures by weapon class": a look pin.
- **style/silhouette**
  - R "a mask has cells, and a figure overlaps itself completely".
  - R "a big body and a small one overlap little".
  - R "scores every pair of types, most alike first…".
  - R "hero rigs and the boss" (snapshot).
  - R "the five Ossuary types and the bare bodies they are drawn on" (snapshot).
  - The `.snap` file is deleted.
  - C "the contact sheet draws every type": dropped the colour pin.
- **grim/areaFx**
  - R "an attack flies as an arrow and a spell as an orb": a mapping pin.
- **grim/areaMotifs**
  - R "every motif the tables name is drawn": guaranteed by the `Record` type.
  - C "draws at every moment": dropped the effect-count and duration bands; the crash guard is kept.
- **grim/buffFx**
  - R "every buff has a look": guaranteed by the type.
  - R "buffs of one kind are told apart by colour": a colour-distance pin.
- **grim/skillFx**
  - R "areas that go off ring out in their element": weak, and a duplicate.
  - C "a trap that springs bursts…": `>= 3` became `> 0`.
  - R "a set of traps shows a ring for each…": did not test its title.

### ui

- **device**
  - R "has a desktop default when there is no window".
- **gemCards**
  - R "skills that do something of their own say so on their cards": 24 wording regexes.
  - R "utility, summon and deploying gems say what they do": wording.
- **gemText**
  - R "describes every gem at levels 1 and 20 without blanks": a duplicate of the gemCards smoke test.
  - R "says what a guard does with the charges it spends": exact text.
  - C "a support says which skills it will not take": dropped the Livewire text.
- **gemStatus** (6 tests)
  - C exact sentences became keyword checks (`/mana/i`, `/spell/`, `/channel/i`, `/hit/i`, a partner name).
- **skillStatus** (6 tests)
  - C dropped the tooltip wording lines; the state, role and timing checks are kept.
- **treeStyle**
  - R "tells mana, spells and energy shield apart…": a colour-legend pin.
  - C "keeps a floor on the size of a node": 2.99 now comes from `MIN_SCREEN_R`.

### run

- **affixes**
  - C "every affix has text, a reward, and an effect": dropped the text-length tautologies.
  - C "none before map 5, then 0–1, 1–2…": dropped the count schedule; the no-repeat, no-conflict and determinism sweep is kept.
  - C "the plan carries the affixes…": ×1.4 and +40 became `>`.
  - C "monster affixes: bloodless, no evade, extra chaos, more damage": ×1.25 became `>`.
  - C "player affixes change the character": −20 became `<`.
  - R "affixes add to the loot: quantity and rarity multipliers": a pin.
  - C "tougher monsters cut your DPS…": the ratios became `<`.
  - C "the camp offers three maps…": dropped the count of 3 and distinct themes.
- **affixes2**
  - R "is half on levels 5 to 29, three quarters on 30 to 59…": a schedule.
  - C "a monster has the scaled mods, and the text, reward and effect agree": now that life grows with level and the card states the measured gain.
  - C swift, unyielding, keen-eyed, afflicting, teeming, the player affixes, and experience rewards: multipliers became relations; dropped the reward strings, and piercing lines that re-read data.
- **botScore**
  - C "kills recently" ×1.05 and "follows the config" ×1.3 became `>`.
  - C "damage mixes sum to 1…": dropped the bonePits theme pin.
- **craft**
  - C "the first three sockets are free; the 4th, 5th and 6th cost 1, 2 and 3": dropped the price table.
  - C "the price is one ember plus one for each pinned affix": dropped the table; the cost now comes from `reforgeCost`.
  - C "draws three alternatives…": 3 became `> 1`.
  - R "the die gives magic 60%, rare 30% and a unique 10%": a probability pin; craftPlan checks the odds against the stated odds.
  - R "the seal: 25% each…": a probability pin.
  - C "salvages carried items by rarity and item level": dropped the formula copy.
  - C "recipes unlock by map, one bench affix per item…": dropped the unlock, cost and tier pins.
  - R "removes a chosen affix for 25 Dust, and sockets cost 40, 120 and 300": prices.
  - C "a complete set is exchanged for the unique": 4 now comes from `tabletsNeeded`.
  - C "chalk offers three affixes…": dropped the 3 and the exact costs.
  - R "saves from before the currency fields are rejected": a duplicate of a found.test check.
- **craftPlan**
  - C "costs what the craft costs, and says what is short in words": dropped the wording.
  - C "gives the rule before the shortage": the sentence became `/sealed/i`.
  - C "refuses what the rules refuse": the wording became `ok === false`.
  - C "states the odds of the Die as the Die draws them": now parses the plan's own odds and compares them with the draws.
  - R "lists the ways to pay for an affix…": data.
  - R "names the affix gained, lost or changed…": wording only.
- **found**
  - C "follow the kinds and rarities chosen": dropped the default pin.
  - C "lists what it will salvage…": dropped the exact strings.
  - C "is a no-op with nothing old, and says so": dropped the exact strings.
- **inventoryOps**
  - C "equips flasks into an empty slot…": no longer pins the starting flask layout.
  - C "sorts by slot, rarity, item level and recency": dropped the name sort of random names.
  - C "placementsFor covers every socket…": now one placement per equipped socket, each naming the gem it replaces.
  - C "gives a ring both ring slots": dropped the labels.
  - C "lets a one-hander go in either hand…": dropped the reason text.
  - C "lists the names of an item's affixes…": passes `max` explicitly.
- **mapTypes**
  - R "each type from its map, never on a mini-boss or boss map": a list and schedule pin.
  - C "a set has at most one typed offer before map 40…": dropped the rate band.
  - C "no offer is typed before map 10 or on a gate level…": dropped maps 1, 5 and 9.
  - R "Crescendo has no step in the grace, then one every 15 s up to 16": constants.
  - C "the world follows the clock": derived from the constants.
  - C "monsters deal more and take less as the steps rise": the formula copy became a relation.
  - R "Quarry has three champions, one in each room…": a design pin.
  - C "opens the exit only when every champion is dead": 3 became `> 0`.
  - C "Throng: a crowd more than twice the size…": became more monsters, each weaker.
  - R "Throng pays quantity and experience": a pin.
  - C "monsters two levels up hit and last noticeably more": the 1.1 and 0.9 bands became 1.
- **offers**
  - C "the anchor is at the map number…": the literal 2 now comes from `OFFSETS`.
  - C "about two in three sets carry an off-level offer…": dropped the rate band.
  - C "a clear rolls the next level's offers…": the literal 2 now comes from `OFFSETS`.
- **phase2Types**
  - R "Collapse starts at the set time and moves at the set speed": a formula copy.
  - R "Holdout is one arena with eight waves…": a design pin.
  - C "Crawl: three short maps…": dropped the path-length pins.
  - C "the game chains the three maps… and pays one pick with a unique in it": dropped the unique.
- **provisions**
  - C "holds three provisions in all…": now uses `POUCH_LIMIT` and `PROVISIONS_PER_MAP`.
  - C "carries a reprieve in the same pouch…": dropped the 4th-add line.
  - C "puts the burning provisions on the map…": 0.3 became `>`.
  - C Whetted Powder, Glass Draught, Greedy Lantern and Ward-oil, Hunter's Bell: the bands became relations.
  - C "a reprieve is a provision of a third kind": dropped the content list.
  - C "count the armed provisions": dropped the margin.
  - C "is sometimes something…": the forage band became `> 0`.
  - R "the bot with provisions plays a run in which it arms staples": 3.5 s, and it asserted only `maps.length > 0`.
- **report**
  - R "counts killers by faction, type and mod": exact report text.
  - R "reports uniques found and worn at the snapshot maps": exact report text.
  - R "counts distinct build signatures among the winners": exact report text.
  - R "a new run has a skill in its signature and no uniques": exact report text.
- **reprieves**
  - C "taken into the pouch… and the pouch holds three": dropped the text and the 3.
  - C "a Bargain Coin leaves its curse": `until: 13` became `> 8`.
  - R "a boss level's pick often holds a reprieve…": rate bands.
  - R "a fifth map's pick holds a reprieve less often…": rate bands.
  - C "holds nothing for the pouch when it is full, nor on a pick of uniques": dropped the unique-pick schedule.
  - R "shows up on the very first pick (level 5) for some runs": a schedule pin.
- **respite**
  - C "never offered… on the first four maps…": now uses `OFFSETS_FROM_MAP`.
  - C "is always offered below 40% life, in the last slot": `offers[2]` became `.at(-1)`.
  - C "is sometimes offered to a character that is merely worn down": the band became "sometimes".
  - C "pauses for a low life, a low flask, or a typed first map": dropped the reason text.
  - R "the verdict on an offer is comfortable, close or dangerous…": a formula copy.
- **run**
  - R "map schedule: rooms, resist penalty and end rooms": schedule pins.
  - R "+3 bonus passive points after maps 10–80, a refund point per map, rewards every 5th map…": tuning.
  - C "skill gem offers skip gems already held…": no longer depends on the reward count.
  - R "no class starts with a gem; the weapons, flasks and an empty two-socket body remain": the starting kit.
  - C "a first map is clearable on the default attack…": 3 became `> 0`.
- **sale**
  - R "holds eight wares of the planned kinds, priced the way salvage is".
  - R "holds a reprieve from the first stop on".
  - R "is a rare at the item level of an offer two levels up…".
  - All three pin the stock mix, prices or tuning.
- **showcase**
  - C "the boss showcase is a level 100 character on map 100": now only that it starts a boss map.
- **stops**
  - C "puts two stops in each window of five levels…": dropped the count pins; the placement rules and the agreement with `stopAt` are kept.
  - R "never repeats the kind of the window before…": a design rule.
  - C "the Awlsmith charges Bone Dust…": the price now comes from `awlsmithCost`.
  - C "the Gem Hoard lays out the same eight gems… four kinds": dropped the counts.
  - C "gives the three gems taken": now uses `HOARD_TAKE`.
  - C "plays through runs that take every stop they are offered": stops at the first seed that took a stop (16 s → 3 s).
- **stopsMore**
  - C "the Shrine offers three blessings…": dropped the 3.
  - R "the Quartermaster sells eight wares, a reprieve among them": a stock pin.
  - C "takes a reprieve into the pouch…": dropped the text; uses `POUCH_LIMIT`.
  - C "the Ferryman gives the reprieve chosen… and a curse for five levels": `until: 25` became `> 21`.
  - C "needs room in the pouch": dropped the text.
  - R "plays runs that take every stop it can use": 31 s, and a duplicate of the stops bot run.
- **themeInfo**
  - R "every type has a blurb, and every tag has text": a tautology.
  - C "tags are in the fixed order, and say what the theme asks": dropped the content lines.
  - C "names the leading factions…": dropped the content lines.
- **themeRules**
  - R "every faction has more than one theme…": content counts.
  - C "skeleton themes thin out, and only they": dropped the exact weights.
  - R "a skeleton map is still possible late in the run, and rare": a tuning band.
  - C "faction themes are mostly their faction…": dropped the share pin.
- **tree**
  - C "allocation spends passive points…": `passivePoints === 5` became spending lowers them.
- **variety**
  - R "shares by faction add up, and a long stretch of one faction is reported": report text.
  - R "says so when there is nothing to report": report text.
  - C "changes at camp apply to the run, are clamped…": 2.5 became a bound.

### sim

- **abandon**
  - C "is not available on the first four maps, on every tenth map, or once the exit is open": now only that it is not available once the exit is open.
- **additions**
  - C Charnel Heap 3 crawlers became `> 0`.
  - C Lurking Coffer ×1.6 became `>`.
  - C Heap first level now comes from `minLevel`.
  - C Tolling Bell, Silkspinner and Hollow Watcher: dropped the data pins.
- **areaSpots**
  - C "Artillery Ballista": 6 arrows became `> 1`.
- **attackShapes**
  - R "a shape sets the behaviour a type attacks with": pins which shape each type has.
  - R "a salvo fires again, and an orb flies slowly": data pins.
  - R "an arrow of a salvo hits for less than a plain arrow": copies 0.8 × 0.5.
  - C "a lob opens a zone…": dropped the radius pin.
  - C "a nova round a monster…": dropped the radius pin.
  - R "every shape has a card string…": text and design.
- **bosses**
  - C "every tenth map ends on its boss": dropped the map-25 pin.
  - C Tollkeeper tolls: the formula copy became a relation.
  - R "its flail is cut, but the toll's own damage is not": getters.
  - C "Magistrate raises four Witnesses": now uses `WITNESSES`.
  - C "is immune to curses and the Rotwife takes them in full": loosened the 20.1.
  - C "Prism Warden attunes in turn": the element order became relative.
  - R "Rotwife: her blows carry the ailments in turn": checked a counter, not ailments.
  - C "Rotwife is not immune to poison": dropped `res === 25`.
  - C Unmaker steals, seals and hardens: the pins became relations, or now use `THEFT_AT`.
  - C Siege Marshal: the regiment size and formula pins became relations.
  - C Veiled Duellist: the cycle and damage pins became relations.
  - C Bulwark Engine plates, rule 3 and damage over time: the formula copies became relations; the rule-3 bound is kept.
  - R "Sundered Twins are two bosses with a life each, and different defences": setup and data.
  - C "when one dies the other grieves": the formula became `> 1`.
  - R "the map is not over until both have fallen": a duplicate of the real-map test.
  - C "the Marshal's regiments take their places", "the Twins stand together": the maps now come from `BOSSES`.
  - C "is the one offer of its level", "a boss map takes twice as long": loosened.
  - Rule 4 is untouched.
- **counterplay**
  - R "there are fifteen, each with a mark and a plain description".
  - C Deflecting/Spellwarded, Bulwarked, Keen-eyed/Sundering, Shrouded, Siphoning, Splitting: the values became relations against a plain monster.
  - R "none roll before map 15".
  - R "the warded mods wait for map 30 and Thorned for map 40".
  - R "magic monsters roll only the mods that allow it".
- **deploy**
  - C "a totem skill is worth its totems on the sheet": the band became a relation.
  - R "a trap lies until an enemy steps close": a duplicate of convergence.
  - R "a mine goes off after it is armed": a duplicate of convergence.
- **drowned**
  - R "is a faction with four types…": data.
  - C Tidewarden: 3 became `> 0`.
- **emberborn**
  - R "is a faction with four types of fire…": data.
  - C Slag Brute, Slagworm, Cinder Tyrant: dropped the radius, shape and count pins.
  - R "fire does not hurt them and cold does": the resistance profile.
- **encounterDebuffs**
  - C "a Handler's mark makes its pack hit harder": the formula became `>`.
- **encounterModes**
  - C Aegis, stun guard, Charnel Heap, Core Golem, Slag Brute quench, Adaptive: the exact values became relations or are read from the monster.
- **encounters**
  - C "a sidearm is a second profile": dropped the look and speed pins.
  - R "a sidearm waits for its map": a level gate.
- **factions**
  - R "every type belongs to a faction and has a body": membership pins.
  - C "the new themes arrive on their maps…": dropped the map and share pins.
  - R "Hollow monsters take half the physical damage…": read-back only.
  - C Shambler, Bloater, Mana Wisp, Lantern Wight, Carrion Hag, Carrion Mother: the counts and values became relations.
  - C "a spectre unravels": now every Hollow type, not a hard list.
  - C "champions lead the mini-boss of their own theme": now read from `themeDef`.
- **freezeGrace**
  - R "keeps the character moving for most of the time…": a duplicate plus a ratio pin.
- **gemEffects**
  - R "can be observed at all: Blinking Cut blinks and hits": a duplicate of the ledger sweep.
- **hitlessGains**
  - C "there are some to check": `> 3` became `> 0` (it keeps the loop below from being empty).
- **kennelGilded**
  - R "each has four types, all innate…".
  - C "they have themes, essences and tablets…": now only the tablet → unique check.
  - R "their themes make their own monsters…".
  - R "a boar rushes in a line…": weak.
  - R "a monster being wound up… does not walk or strike": a duplicate.
  - C Huntsmaster, guard thorns, Treasurer: the counts became relations.
  - R "every type in the new factions lists an ability…": a hard list.
- **minions**
  - C "a minion has life and defences from its kind…", "sturdier minions are worth more": dropped the design comparisons.
- **monsters**
  - C "types and rarities scale life", "elemental variants…", "monster mods change stats": the multipliers became relations.
  - R "bosses and mini-bosses have higher stun thresholds; the boss swings every 1.6 s": pins.
  - C "magic monsters only roll magic-allowed mods": dropped the counts.
  - C "fills rooms with packs": dropped the pack-mix pins.
  - R "every tenth map ends on its boss, and the Unmaker on map 100": a schedule.
  - C "themes bias elements and types": dropped a tautology.
  - C Raisers, Rime Aura: dropped the pins.
- **movement**
  - R "a phasing monster passes through walls": never walked through a wall.
  - R "every style has words…": text.
  - C "the senses a type sets are read": dropped the aggro pins.
  - R "the senses have words": text.
- **packBehaviours**
  - C "a faction that forms them makes them": dropped the template-weight pins.
- **packs**
  - C rhythm beats: dropped the mean and text pins; the damage now comes from the beat pattern.
  - C enrage, leader falls, Warding Pulse, Mirrored: the values became relations.
  - R "phases have words": text.
- **rain**
  - C "starts with six arrows…": now base + 2 and base + 4 (the 3.9 rule).
  - R "Twin Salvo is in effect on a rain of arrows": a duplicate of the gemSmoke sweep.
  - R "Wide Crush needs a skill with an area": a duplicate of the gemSmoke sweep.
  - C "Snare Cluster throws five traps… Triple Snare three": the counts became `> 1`.
- **reprieve**
  - R "every reprieve has its own data".
  - C Revive, Retreat, Bargain Coin: the shares are now read from `reprieveDef` and `CURSE_LEVELS`; the stun time became `> 0`.
- **runSkills**
  - C "Whirlwind Cleave… five hits in a use": the count is now read from the profile.
- **secondary**
  - C "lists every other active skill as a secondary": dropped the formula copies.
  - C "Echoing Cast: each cast lands twice": dropped the support tuning.
- **spiritS1**
  - R "Cast on Melee Kill links the spells beside it": restates the definition.
- **spiritS2**
  - R "Flicker Strike has a cooldown of two seconds…": the definition.
  - C Flicker Strike sheet rate, Vigilant Strike, Discharge, Immortal Call: dropped the gem-data pins.
- **spiritS3**
  - R "last as long as their gem says": data.
  - R "Vulnerability raises physical damage…": a data pass-through.
  - C Enfeeble/Temporal Chains, Mark of Plenty, Ensnaring Arrow, Bear Trap, Wave of Conviction: dropped the data pins; the mechanisms are kept.
- **spiritS4**
  - C "the sheet counts every projectile as a hit", Barrage Support: dropped the field pins.
- **spiritS5**
  - R "Flameblast: the sheet spreads the blast over the uses that built it": a formula copy.
  - R "Cyclone is a channel with a weak first hit and a stun-proof spin": field checks only.
- **spiritS6**
  - C Frost Bomb timing, banner stages (×2): the pins became relations.
  - R "Winter Orb fires faster with stages…": a duplicate; fire rate was never measured.
- **spiritS8**
  - R "Flame Dash holds three uses, and shares its cooldown…": a field pin and an assertion that could not fail.
  - C Withering Step, Venom Gyre, Point Blank: dropped the pins.
- **spiritS9**
  - C "its cooldown starts when it ends": now read from the gem.
  - C "costs life each second…": the band became `< maxLife`.
- **spiritS10**
  - R "mines made by the supports last five seconds": data.
  - R "Bear Trap stores three uses of a four-second cooldown…": data.
  - C ballista, Chained Charges, Pyroclast: dropped the pins; the orderings are kept.
- **spiritS11**
  - C "Raise Spectre…": `>= 31` became `> 10`.
- **spiritS12**
  - R "Carrion Colossus gives the other minions added physical damage": data only.
  - C Bone Offering, Elemental Army, Infernal Legion: dropped the pins.
- **spiritS13a**
  - R "Static Strike beams hit harder while the character moves": data.
  - R "Perforate: six spikes in Blood Stance, one thrust in Sand Stance": data.
  - R "Ice Nova can expand from Glacier Darts in flight": field checks.
  - R "Spectral Throw pierces": a field check.
  - C 19 tests (Discipline, Dual Strike, Lightning Trap, Puncture, Elemental Hit, Glacial Hammer, shards, Soulrend, Arctic Armour, Herald of Agony, burning aura, Arc, Viper Strike, Whirling Blades, Cast when Stunned, Cobra Lash, Mirror Arrow, Bladefall, Creeping Frost, Melee Physical Damage): dropped the gem-data pins and exact margins; the mechanisms are kept.
- **spiritS13c**
  - C Close Combat, Multistrike, Intensify, Kindle, Combustion, Infused Channelling: the pins became relations.
  - R "Meat Shield: the minions stay near the character…": a field read only.
- **steps**
  - C "a few basic types have one…": dropped the count and text.
  - C "a Wisp that is ready…": `> 5` became `> 0`.
  - C "not used from inside its range, nor on the first maps": dropped the level gate.
- **strategy**
  - C "a main skill for packs and one for few enemies": dropped the 70/30 weighting pin.
  - C "with both off it never goes…": dropped the UI option-list pin.
- **verbs**
  - C "quantity raises the number of drops": ×2 became `>`.
- **wave2**
  - R "holds 10 items and, with the flask, 11 uniques".
  - R "each has a valid base, notes, and a rule…".
  - R "Kindred Sparks spreads shock and ignite on kills": a read-back.
  - R "The Lantern Bulwark recovers energy shield…": a read-back.
  - C Critical Relay, Wounded Retort, Ember Burst, Thunderknell, Frostwrit, Gravescribe, Stormsplit Jerkin, Twin Pyre Band, expected ignites, Pickpocket's Lament, the flask: dropped the data read-backs; the pins became relations.
- **whirlingBlades**
  - R "keeps spinning on the spot…: a use is six hits": a band pin.
  - R "counts its six hits in the character sheet": a data read-back.
  - C "out-damages the plain weapon attack": dropped the ×1.25.
- **x8**
  - R "has five types, is offered from map 15, and its mini-boss is the Precentor".
  - R "every Ossuary theme ends on it, and it is a warrior".
  - C Grit, monster hex, Flagellant, Choirmaster, Hexer/Zealous, Precentor, hex mods, rare-kill mods, Bone Warden rings: the pins became relations, with the formula copy removed.
- **x9**
  - R "there are eight new types, each with its own body kind".
  - R "Gnawers come in packs of six or more".
  - R "the champions lead the mini-boss of their own themes".
  - C mixed themes, Nest, Bone Beetle, Reliquary Vault, Sentinel, Arbalest, Core Golem, Brood: dropped the schedule, count and data pins; the behaviours are kept.

## Files left unchanged

`core/rng`, `data/ip`, `data/skillTypes`, `data/statText`, `mods/modDb`, `gen/champions`, `gen/density`, `gen/labyrinth`,
`gen/layouts`, `gen/uniqueSmoke`, `calc/audit39`, `calc/pipeline`, `calc/rotation`, `calc/treeStats`, `calc/verbsC3`,
`calc/sheetVsSim.dot`, `calc/rotationVsSim`, `ui/confirm`, `ui/treeHit`, `ui/treeSearch`, `run/codex`, `run/gallery`,
`run/gemSafety`, `run/inventory`, `run/itemRules`, `run/ledger`, `run/lookahead`, `run/rewards`, `run/saveMigrate`,
`run/sheetCache`, `run/strategy`, `run/telemetry`, `run/vitals`, `sim/areaPace`, `sim/areaTags`, `sim/auditFixes`,
`sim/buffs`, `sim/combat`, `sim/condCtx`, `sim/convergence`, `sim/gemGains`, `sim/gemSmoke`, `sim/hazard`, `sim/hazardDodge`,
`sim/packPlays`, `sim/recap`, `sim/runMap`, `sim/shapes`, `sim/spiritS7`, `sim/stall`, `sim/strand`, `sim/totems`,
`sim/triggers`, `sim/vfxEvents`.

## Kept, but worth a second look

- `stops`: the "never on a fifth level" and "no two stops in a row" rules are still asserted; they are schedule design.
- `wave1`: the signature-line values of the wave-1 uniques (+280 life, +4 arrows, …) are still exact.
- `bosses`: the two pure-arithmetic checks inside rule 4 were left with the protected block.
- `calc/character` "computes in under 5 ms": a calc speed floor, kept like the sim floors.

Titles that named numbers the tests no longer assert were reworded: Carrion Hag, Carrion Mother, Huntsmaster, Treasurer,
Ember Downpour's arrows, Snare Cluster, Infused Channelling, Discharge and Point Blank.

## Removed on judgment, easy to restore

These removals were close calls. Restore any of them from the commit before the audit if the rule is one to keep.

- `run/sale`: "holds a reprieve from the first stop on", and the gear test (a rare from two levels up).
- `run/stops`: "never repeats the kind of the window before while there is another to draw".
- `sim/abandon`: the lists of maps where Abandon is not offered (the first four, and every tenth).
- `sim/attackShapes`: "every shape has a card string, and the shapes that ask something of the character carry a tag".
- `data/tree/tree`: "a cluster has one way in, or up to four…". The file's own comment still states the rule that every
  cluster hangs from one road; this test allowed up to four.
- `run/craft`: the Die and Seal odds (60/30/10 and 25% each). The odds are still checked against the plan's stated odds.
