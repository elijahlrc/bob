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
