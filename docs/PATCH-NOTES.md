# Patch notes

Player-facing notes, newest first. Add an entry for every change a player would notice. The design reasons and numbers are in
the docs each entry links to.

## 2026-10-11

- Bosses: a boss now ends every tenth map (ten in all), each with its own mechanic. See docs/BOSSES.md.
- The passive tree has a new layout. Your allocated passives are refunded as unspent points. See docs/TREE-REDESIGN.md.
- Every region of the tree has its own shape and themed districts, and you can reach any region through the middle.
- Notables are stronger relative to small nodes, and clusters make more sense.
- Search box on the passive tree screen.
- Neighbouring regions of the tree now connect half way out and near the edge, not only through the middle; long roads have
  side entrances; the paths around the class starts are tidier. Your passives are refunded again.
- New tree colours and icons for spells, energy shield and generic damage (previously shown as mana and attack).
- Every class start now has two roads out into its region, each leading to a different group of passives, and quick ways across to
  the neighbouring regions.
- The passives near a start are now the basics of the class: life or energy shield, armour or evasion, attack or cast speed.
  A few core options come next, and the narrow, unusual ideas are further out.
- More crossings between regions (some long), a looser, less regular middle, and new shapes: clusters can be arcs or wings, two
  notables can share a ring, and some notables sit in a line.
- The ground around every start is fuller: basic clusters and notables (life regeneration, resistances, speeds, armour, evasion,
  mana and the like) stand beside the roads, and near a start each stretch of road is a line of one stat, with a different stat on
  each branch, some ending in a notable.
- The roads between clusters are now mostly attribute nodes, with the odd stretch of life, energy shield, armour, evasion or the
  like. There are no plain "increased damage" nodes any more: damage nodes now ask for something (a skill type, a damage type, a
  condition).
- Groups of related clusters (life, fire, minions and so on) are broken into smaller groups spread through each region, so they
  are less big and less isolated.
- Many clusters are now linked to a neighbouring cluster, so there are far more ways through the tree. A link joins clusters that
  work together (life with armour, energy shield with mana, spells with critical strikes, and so on), and it always costs more
  passives than the plain attribute road beside it, so it is worth taking only for the clusters on it.
- Each class start now leads straight into its two basic clusters, which in turn link to the clusters around them, so the area
  around a start is well connected.
- Your passives are refunded once more.
- The special enemy at the end of an ordinary map (a theme's champion) now turns up only now and then, about one map in four, and the
  level select no longer warns of it. Boss maps still show their boss.
- Steady Draw is no longer neutral (35% more damage), and several keystone cards now show their numbers.

## 2026-10-10

### Save slots

- Every run now has its own save. Starting a new run no longer replaces the one you had.
- The title screen lists your saved runs, most recently played first, as "Continue — class, level, map". Each has
  **Copy** (puts the save on the clipboard for a bug report) and **Delete** (asks first).
- A run that ends in death or victory, or that you abandon, deletes its own save and no other. "Save and quit" keeps it.
- A save from before this patch is picked up automatically and shows in the list.
- A save from an older, incompatible version shows as its own row that you can discard.
- If the browser has no room left to save, the camp says so; delete an old save on the title screen to make room.
- There is no limit on the number of saves, but browsers keep about 5 MB for the whole game, so a long list of deep runs can
  fill it.

### Evasion and accuracy now matter

Hit chance used the same formula as before, but monsters' evasion and accuracy now grow with level the way they do in Path of
Exile (docs/EVASION.md). Until now monster evasion grew in a straight line, far too slowly, so characters hit nearly always and
monsters hit characters nearly always, whatever either had invested.

- **Your hit chance** falls as you go deeper unless you build accuracy. A character in plain gear used to hit 100% of the time at
  every level; it now hits about 92% at level 30, 85% at level 60, 72% at level 84 and 63% at level 100. The Hit chance on the
  Character page shows it against a plain monster of the map's level.
- **Accuracy is a real stat**: accuracy on weapons, gloves, helmets, rings and quivers, and Dexterity, buy hits back.
- **Evasion works**: monsters used to hit even a well-evaded character almost every time. Now the same evasion rating turns
  away as many hits as it would there: a plain-geared level 60 character is hit about 78% of the time, and one with more
  evasion than that, less.
- **Monster life is adjusted for it**: evasive monsters (gloomstalkers, gnawers, cutpurses) have a few percent less life, since
  they are now harder to hit.

What did not change: how far a character gets. Across 96 bot runs (six classes, two seeds) the average map reached was
28.8, against 27.2 before, and levels after each map are the same. The Strider and the Shade, the two Dexterity classes, had a
lower median map reached on both seeds, which is within what that many runs can show; they will be looked at first in the next
balance pass.

Known gaps: item base values for armour grow in four steps (levels 1, 20, 40 and 60), so an evasion character at levels 10 to
30 is hit 10 to 15 points more often than the same character would be in Path of Exile. Armour (the monster stat) was not compared and was not touched.

### For developers

- `npm run evasion` compares Bob's monster curves with the reference tables and prints what a plain-geared character hits
  and is hit for, before and now.
- The reference tables are in `docs/coverage/pob-monster-stats.json`; the game has only the fitted formulas
  (`monsterEvasion`, `monsterAccuracy` in `src/calc/formulas.ts`).
- The build matrix's reference player has its own accuracy curve (`referenceAccuracy`).
- Save code: slot layer in `src/run/save.ts`, current slot kept by the controller (DESIGN.md 5.5).
