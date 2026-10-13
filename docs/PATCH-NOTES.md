# Patch notes

Player-facing notes, newest first, shown on the Patch notes screen of the main menu. Add an entry for every change a player
would notice. Plain text: no markdown emphasis or code, no first person, no file names or internal terms, nothing that did not
change, and our own names only. Dash bullets under plain headings.

## 2026-10-13

- Every map now has a biome: Crypt, Cavern, Ruins, Marsh, Forge, Hollow, Shrine or Warren. It sets the layout and look of the map and is shown when you enter. It is separate from the theme, so any theme can turn up in any biome.
- New layouts: Caverns and Marshes are winding caves, the Hollow is wide open ground with pillars, Ruins have more than one way round, and the Warren is a tangle of small chambers and narrow passages.
- Each biome has its own floors, walls, lighting and decorations, such as pools, moss, glowing fungus, lava cracks, candles, roots and rubble.
- Maps now grow steadily with depth, some a little bigger or smaller than others at the same level, and packs follow the size of their room, so deeper maps hold somewhat more monsters.
- From map 3 a map can be Sparse, Packed, Clustered or Scattered, shown on its offer. Sparse has fewer monsters but more magic and rare ones, Packed half as many again, Clustered a few large packs, and Scattered small groups everywhere.
- Quarry is always set in a Cavern, Holdout in a Hollow, Collapse in Ruins and Crawl in a Warren.
- The new biomes are still being balance-tested. For now Caverns and Marshes are harder than the others and the Hollow and the Warren a little easier, so runs are somewhat harder overall.

## 2026-10-12

- The Workbench tab is closed for now. It is greyed out, and the Craft button on items is unavailable. It is not needed to do well, and it is less finished than the rest of the game. Embers and everything you already have are kept.
- Twister Blade now keeps its full spin for as long as you keep fighting, and carries you toward the enemies at your walking pace as it spins. Before, it dropped back to nothing every fifth hit, losing its wide sweep and starting again with a half-strength hit, and it stood still.
- Blaze Stream is held at its full strength for as long as there is something to burn. Its final wave now comes when you stop, instead of every second or so.
- A support that cannot support a skill it otherwise fits now says why. Shattering Blows on Twister Blade reads "Twister Blade is a channelling skill, and Shattering Blows cannot support those" instead of claiming you have no melee skill.
- After a freeze on the character ends it cannot be frozen again for a second, and a freeze is no longer lengthened while it lasts, so a pack of cold monsters can no longer keep the character frozen until it dies. Bosses already had a longer guard.
- The gem tooltip in the Skills tab follows the mouse again on desktop instead of sitting in the top-left corner.
- A skill set to the Escape role on the Strategy tab has two boxes, Low health and Surrounded, so a blink can go only when life is low, only when enemies crowd in, or both. Before, it always went when three enemies were close, even at full life. The life threshold now goes from 10% to 80%.
- The main menu has a Patch notes screen.
- A support that can do nothing for a skill is no longer offered for it. One already socketed stays, greyed out with the reason, and no longer adds mana cost or lowers damage.
- Arrow Shower and Ember Downpour now come down as six arrows and take extra arrows. Rime Splinter, Bolt Cleave, Slag Blow and Whirl Shot send more projectiles when a support adds them.
- Triple Cadence now has about 55% less attack speed and deals about one and a half times the plain skill's damage, down from nearly five times. Snare Cluster throws five traps over a wide area, at a larger damage penalty.
- Echoing Cast no longer works on totems or brands, Wide Crush needs a skill with an area, and Kindle and Cindering, which were the same gem, are now one (a Cindering you own becomes a Kindle).
- New support: Flanking Volley, the attack version of Flanking Cast, for Arrow Shower and Ember Downpour.
- Bosses can no longer be out-healed: map regeneration no longer reaches them, and a boss's own healing pauses after it is hit. The Courser has about 40% more life, hits about 80% harder and gallops further.
- The Weakest target priority now picks the enemy with the least life left, so a boss's escort usually falls before the boss.
- The passive tree has many more ways through: clusters link to related neighbours, roads are mostly attribute nodes, starts join straight onto their two starter clusters, and plain increased damage is gone. Passives are refunded again.
- Areas now show the exact ground they cover, outlined in the colour of their damage. Attacks fly as arrows and spells as orbs, with a shadow and a trail, and monsters' projectiles have a red rim.
- Every skill with a cooldown shows it once on its card. Standards did not show theirs, and blinks and Jaws Trap showed it two or three times.
- A theme's champion now ends an ordinary map only about one time in four, and the map offers no longer announce it.

## 2026-10-11

- A boss now ends every tenth map (ten in all), each with its own mechanic.
- A theme's champion now ends ordinary maps in place of the end-of-map rare.
- The passive tree has a new layout. Your allocated passives are refunded as unspent points.
- Every region of the tree has its own shape and themed districts, and you can reach any region through the middle and through crossings between regions.
- Every class start has two roads out into its region, and the passives near a start are the basics of the class: life or energy shield, armour or evasion, attack or cast speed.
- Notables are stronger relative to small nodes, clusters of a theme sit in that theme's district, and the passive tree screen has a search box.
- New tree colours and icons for spells, energy shield and generic damage.
- Steady Draw now gives bow attacks 35% more damage (was 25%), still with 20% less attack speed, and several keystone cards now show their numbers.

## 2026-10-10

### Save slots

- Every run now has its own save. Starting a new run no longer replaces the one you had.
- The title screen lists your saved runs, most recently played first, as "Continue — class, level, map". Each has
  Copy (puts the save on the clipboard for a bug report) and Delete (asks first).
- A run that ends in death or victory, or that you abandon, deletes its own save and no other. "Save and quit" keeps it.
- A save from before this patch is picked up automatically and shows in the list.
- A save from an older, incompatible version shows as its own row that you can discard.
- If the browser has no room left to save, the camp says so; delete an old save on the title screen to make room.
- There is no limit on the number of saves, but browsers keep about 5 MB for the whole game, so a long list of deep runs can
  fill it.

### Evasion and accuracy now matter

Monsters' evasion and accuracy now grow with level much faster than before. Until now monster evasion grew in a straight line,
far too slowly, so characters hit nearly always and monsters hit characters nearly always, whatever either had invested.

- Your hit chance falls as you go deeper unless you build accuracy. A character in plain gear used to hit 100% of the time at
  every level; it now hits about 92% at level 30, 85% at level 60, 72% at level 84 and 63% at level 100. The Hit chance on the
  Character page shows it against a plain monster of the map's level.
- Accuracy is a real stat: accuracy on weapons, gloves, helmets, rings and quivers, and Dexterity, buy hits back.
- Evasion works: monsters used to hit even a well-evaded character almost every time. Now evasion turns away a
  fair share of hits: a plain-geared level 60 character is hit about 78% of the time, and one with more
  evasion than that, less.
- Monster life is adjusted for it: evasive monsters (gloomstalkers, gnawers, cutpurses) have a few percent less life, since
  they are now harder to hit.

Known issues: an evasion character at levels 10 to 30 is hit 10 to 15 points more often than intended, because armour bases
grow in steps.

### Monsters and combat

- Many monsters now have a second attack. Ranged and ground attacks are used while the character is out of melee reach, or on a
  timer: thrown bone spears, lobs of bile, boulders, slowing chains, rings of spores. The Slinger's stones slow the character.
- New telegraphed blast patterns: March, Mortar, Cross, Toll waves, Closing ring, Keening and Twin hooks. Each blast shows its
  warning shape before it lands, and a later step in a pattern is drawn faintly until its warning begins. The death recap names
  the pattern.
- Defensive windows: several monsters now turn aside or soften hits for a short time, and each shows a tell. The Shieldbearer's
  Brace turns aside hits from its front. The Gilded Guard's Counter-stance answers melee blows. The Choirmaster's Sanctuary
  shelters allies while it sings, and a stun silences it. The Sentinel's Aegis turns aside four hits and regrows when left alone.
  The Gloomstalker fades out of reach when burst down. The Charnel Heap turns to stone, mends, then shatters in a ring. The Bone
  Beetle curls up and takes far less damage until fire or a stun opens it. Damage over time still works through all of these.
- Mode shifts: some monsters change behaviour mid-fight (Golem: Core vent. Slag Brute: Quench. Gorger: Gorged. Hag: Last
  rites. Wailer: Grieving. Rend-boar: Riled. Cinderling: Molten. A stun breaks the guard of the Shieldbearer and the Sentinel).
  There is a new Adaptive rare modifier.
- New debuffs, shown on the HUD as Blinded, Marked and Tithed. The Bursar's Tithe drains the character's life through a beam.
  The Handler's whistle marks the character, and its pack hits 20% harder for 4 seconds. The Hexer's hex is now a sigil on the
  ground.
- New pack plays: archers and slingers hold, then loose together down lanes shown first. Three or more hounds close a ring around
  the character, then all leap. A Nest drives its brood in faster and harder. A hound waits for its pack's ring instead of
  leaping alone.
- Map cards show two new tags, Patterns and Guards, and the threat estimate counts second attacks.

### Skills and items

- Lone Prism gave mana on every hit, including spells. It now gives mana only for hits by attacks, as intended. Hail Bow and
  Anchorfall Blade had the same problem and are fixed.
- Chained Charges and Heavy Charge cost far less mana (30% of the skill's cost instead of 150%), so mine setups are no longer
  the most expensive way to run a spell.
- Skills tab and gear comparisons: a blink, guard or buff skill in the loadout no longer makes the main skill's damage and mana
  sustain look far worse than they are. Frostblink, Flame Dash and Blood Rage all had this problem.

### Strategy

- New Strategy tab in camp. Each skill gets a role (main, periodic, keep-up, opener, emergency, automatic, off) and a condition
  (any, packs, few enemies, rares, bosses), and the character uses them in that order.
- The same tab sets the target priority (including sticking to the current target), spacing and flask thresholds.
- It also shows the rotation's damage against a pack and a boss, and the Character sheet shows both when they differ.
  Comparisons weigh pack damage 70% and boss damage 30%.
- A periodic skill no longer needs the main skill's reach. It fires when its own target is in reach and waits out its pause after
  a use. It also no longer stands in for a main skill that is waiting for mana, so the weapon attacks while mana comes back.
- The skill bar lists every main and damage skill.
- New Escape role for blinks and run buffs (Dash, Flame Dash, Frostblink, Lightning Warp, Withering Step, Bodyswap, Smoke Mine,
  Blink Arrow, Phase Run). An escape skill is used when life is below its threshold (70% by default, 30% to 70%) with an enemy
  within 5 tiles, or when 3 or more enemies are within 4 tiles. A blink with this role goes to the safest spot in its reach,
  away from the enemies.

### Interface

- Reward offers were showing as plain grey browser buttons, which made the cyan gem names hard to read. They look right again.

## 2026-10-09

### Skill balance

- Spirit Saw was far too strong: against a single enemy it did about three times the damage of any other spell. Its direct hit is
  now small, and its chaos debuff has been scaled down to sit near the middle of the spells. It still pierces, homes in on
  enemies and hits everything it passes, so it remains best in a crowd, but it no longer wins on a lone target.
- Other damage-over-time skills had the same problem and have been rebalanced the same way: Sap Bolt, Acid Arrow, Creeping
  Plague, Searing Lance, Venom Shower, Ruin Ritual, Cinder Bond and Drain Trap. Sap Bolt, Ruin Ritual, Cinder Bond and Searing
  Lance get weaker, and Creeping Plague gets stronger. Venom Shower and Acid Arrow change little.
- Storm Rush was doing about five times the damage of a normal melee attack. The waves of lightning along the illusion's path
  now hit for one normal attack each, or two and a half times that once the illusion has stopped. Only the final wave, where you
  join the illusion, grows with the number of stages you built. Storm Rush is still one of the stronger melee skills, but no
  longer by a wide margin.

### Items and crafting

- The Items screen has been rebuilt. It shows three columns on a desktop (gear, the selected item, your bag), two on a tablet and
  a single sheet on a phone. You can search, combine two rows of filters, tidy your bag from a menu, see how full it is, and drag
  items to equip or remove them.
- Selecting an item now shows a comparison for every slot it could go into, with what would change before and after.
- Confirmations (Items, Clean up, Abandon) now use one in-game panel instead of the browser's pop-up.
- The Workbench now shows every craft before you pay for it, grouped by what you are trying to achieve. Each option shows its
  cost, its odds and what it would change on your character. Crafts that roll show a typical result and the range, never the
  actual roll. Options you can't use show the reason beside them, and the result panel shows before and after.

### Combat and maps

- Ranged monsters now keep walking toward your character and only shoot a minion after they have been held up for 1.5 seconds.
  Before, they stopped and shot the first minion they saw.
- Cinder Bond's beams are now drawn on screen.
- Totems are placed with some randomness where their beams cross enemies, and a full set of totems only counts those near your
  character.

### Interface

- The passive tree tooltip now appears next to the cursor and stays on screen.
- The title screen no longer has demo buttons. The checkbox for anonymous results now uses the game's accent colour.

### Known issues

- Searing Mantle, Blood Rage, and the running behaviour of Rotting Stride and Slipstream Run are new and still being
  balance-tested. They may feel too strong or too weak.
- Withering Breath and Flame Dash's burning trail are due for a balance pass.

### Skills rework

Nearly every skill has been reworked so that it behaves the way its description says. If a skill felt off to you before, try
it again.

- Curses are now cast by your character, last their full duration, and your curse limit applies.
- Warcries, banners, guard skills and stances follow their own rules, and each card explains them.
- Channelled skills build up stages while you hold them and release them at the end.
- Traps, mines and totems are placed and triggered the way their cards describe.
- Projectile skills spread, pierce, chain and fork the way their originals do.
- Corpses matter: some skills raise, explode or use up the bodies of dead monsters.
- Ailments and damage over time are now debuffs of their own.
- Every special skill's card now says what the skill actually does.
- Viper Lash is now a poison projectile that flies from enemy to enemy. It was an instant lightning-style chain before.
- Mirror Quiver's clone now fires with your own bow.
- Rain of Steel fires several volleys, each wider and weaker than the one before.
- Rime Drift is now a skull that bursts into chilling ground, which creeps toward enemies.
- Brute Force: melee hits now carry the extra poison and bleed damage from your gear.
- Standards (banners): the stages you build up now make the buff you receive stronger too, not only the penalty on enemies.

### Removed

- These gems have been removed: Ghost Coil, Rot Drain Trap, Cluster Bolt and Festering Crit.
- Wake Blades, Wake Sentinel and the other skills that animated weapons have been removed as well, along with the uniques that depended on them: Marshal's Hauberk, Bladewake Hammer, Whirlwind Falchion and Twinwhirl Falchion.

### How your character fights

- Rotting Stride and Slipstream Run now behave like running skills. When your character lands among a pack (Rotting Stride), or
  when a crowd closes in or you are hurt (Slipstream Run), it runs on past the enemies without attacking until the effect is
  over. It does not run when it only uses Rotting Stride to reach one enemy.
- Searing Mantle and Orbiting Blades: a character that wears the Mantle or has blades circling it now walks in among enemies, so
  the fire and the blades actually reach them.
- Searing Mantle goes out when your life falls below 40 percent and lights again at 75 percent.

### Maps and play

- Offer cards now show one table with the same rows on every card: item quantity, item rarity, experience, monster counts and
  bonus loot.
- Your character no longer dodges a monster's attack by running through the monster. That used to send it back and forth instead
  of fighting.
- A map that has run 500 seconds now starts the escape timer by itself, so a stuck character no longer sits until the timeout
  kills it. You keep the loot and experience, but get no clear reward.
- Fixed a crash while building certain maps.

## 2026-10-08

- New factions: the Drowned and the Emberborn (four types each, two themes each, and a boss each), plus the Kennel and the
  Gilded (eight types).
- New enemies: the Bone Warden, Mirrored mini-bosses, and seven non-human types (Bone Crawler, Charnel Heap, Gorger and four
  others).
- Enemy behaviour: ground-telegraphed attack shapes that the auto-dodge reads, ten movement styles, senses, phases, and packs
  that flank, hold and rally.
- Difficulty: scaling, base and variance can be adjusted, and the default scaling is raised from 1.5 to 1.75.
- Maps: offer sets now have distinct leading factions, and the camp card says who is on the map.
- Defence: monster types have defence profiles and archetypes, and a defence is paid for in life.
- Visuals: body styles (bone, flesh, spectre), faction garb and palettes, and new rigs for the Bloater, Spitter and Mana Wisp.
- Fixes: skill gems are no longer lost with discarded items, and floor textures are freed between maps, which stops phones
  losing walls and the hero.
- UI: the passive tree is rebuilt and reads better, and the HUD has a level-time counter.
- Performance: maps run noticeably smoother. The game does about 30% less work per tick and about half as many draw calls per frame.

## 2026-10-07

- Minions now have health, take damage from enemy area attacks, and are attacked by enemies that are blocked from reaching you.
  They no longer regenerate life on their own; regeneration is now a gear stat.
- The map HUD has a skill bar showing each equipped skill's use and cooldown.
- Every skill now has a visible effect, with colour showing damage type and shape showing how it is delivered, plus a skill
  gallery and a "Skill looks" tab in the Codex. Characters no longer draw behind walls.
- The passive tree is rebuilt with 357 generated clusters and 27 keystones, including 6 new keystones, and the new nodes cover
  the new mechanics.
- Each level now offers three maps (level offsets of ±2, map affixes) instead of two. Life, mana, energy shield and flasks
  carry over between maps, and you can abandon a map.
- New Respite, Holdout, Collapse and Crawl map types. The Respite level skips the map.
- The game now works in phone and tablet browsers. The camp has a "Next map" tab and a bottom bar, and the passive tree has pinch
  zoom and a preview-then-allocate dock. Gems are socketed by tapping. Tooltips become tap popovers, and the reward pick shows a
  preview first. The map HUD is compact on phones.
- Inventory tools: every pickup stays marked NEW until you look at it, and favourites are starred items that Clean up never
  touches. "Clean up…" salvages items found more than n levels ago, after a preview of what goes.
- Saves from the previous version carry over; older saves are still rejected.
