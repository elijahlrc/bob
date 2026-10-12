# Patch notes

Player-facing notes, newest first. Add an entry for every change a player would notice. The design reasons and numbers are in
the docs each entry links to.

## 2026-10-11

### The passive tree, redrawn

The whole passive tree has a new layout (docs/TREE-REDESIGN.md). **Your allocated passives are handed back as unspent points**, since
the nodes are in new places; nothing else about your run changes. It has 2,032 nodes (it had 1,727); a notable is still one point and
so is every small node.

**The shape**

- **No longer a flower.** The six regions are not copies of one another. Each has its own landmarks: a honeycomb of closely linked
  clusters, a big ring, a road that forks into arms, a long ladder, an avenue. Each region is made of four or five themed
  districts (the Conflux of fire, cold and lightning; the Bone Court of minions; Snare Row of traps and mines; the Standards of
  totems; and so on) and a few clusters that stand alone beside a road.
- **The middle is an open crossroads.** A ring road joins the six class starts, with a hub cluster between each pair of classes and
  three keystones inside it. **You can walk from any class into any other region through the middle** (a class start is still a
  door you cannot walk through), and the middle's notables are as strong as a region's, with roads that give life, damage,
  resistances and movement speed.
- **Roads first.** The nodes you pass on the way between places are plain stats of the region (life, mana, energy shield, armour,
  evasion, damage, speed), never a weapon or a skill type, and one in three is an attribute node. A cluster of a notable and its
  small nodes is a side trip with a single way in, so passing it never makes you take its nodes.
- **Keystones sit at the end of a peninsula** of four small nodes that fit them (the way to Nimble Gambit is movement speed).
- **Archetypes at home.** Trap, mine, minion block and totem nodes that stood away from their kind moved into their district.
- Walking takes a little more than before: 100 points buy about 23 to 30 notables where they bought 31 to 34 (a notable now costs
  about 3.3 to 4 points to reach, from about 3). A district costs most for its first notable and little for the rest.

**Strength and sense**

- **Every notable is worth at least three small nodes** (two and a half with several lines). About thirty were worth one or two: a
  notable of "5% maximum life" beside small nodes of 4 to 5%. Those now give, for example, 15% maximum life, 25% maximum mana or
  60% critical strike chance.
- **One value per stat.** Small nodes of one stat used to come in several sizes (maximum life was 1.7%, 3%, 4% or 5%); each stat
  has one now. Most small life nodes are 5%.
- **A cluster agrees with itself.** About sixty clusters had small nodes unrelated to their notable (a damage notable with leech
  nodes); they now give what the notable gives. Lines that said the same thing are one line with the total ("3 additional
  Minions" instead of three lines of "1 additional Minion").

**Finding your way**

- **Search the tree.** A box at the top of the passive tree screen finds nodes by words ("minion", "fire", "spell crit"): every
  word has to be in the node's name or lines, in any order, every match is ringed, and Next takes you to one.

**Keystones and cards**

- **Steady Draw** is 35% more damage with 20% less attack speed (it was exactly neutral).
- The cards of **Close Quarters, Prismatic Balance, Cruel Agony, Mana Bastion, Blood Rite, Plated Hide and Volatile Servants** give
  their numbers and say what they cost; Searing Avatar says that what is not converted to fire is not dealt; Fever Pitch, Pain
  Conduit and Searing Avatar no longer say the same thing twice.
- Charge text no longer reads "per 1 charges.grit", and "a Insight Charge" is "an Insight Charge" (this was also on uniques).

**Not here yet** (they need new nodes): life on hit, spreading poison, ignite damage, warcry, stun power, and more curses near the
Mystic. A refund still keeps the road nodes of the notable you give back.

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
