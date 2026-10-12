# Playtest round 2, build 18: Mystic, lightning crit caster with a wand

## 1. First impression from the pictures

- The whole tree is a big radial map with six wedges and the class starts in a small ring in the middle. I could tell the
  keystones apart by their size and label. Most notables have no label on the whole-tree picture, so it is impossible to
  plan from that picture alone. `region-int.png` is readable and does name nearly every notable.
- Mystic is at the bottom of its own wedge. Everything the picture shows for "int" is a long way UP (y -3000 to -5000), while
  the start is at about y -1800. The picture makes the int wedge look like a thin road with islands on it. My first guess
  was that lightning, crit and wands would all be up there, because the picture shows yellow clusters at the upper left
  (Stormlamp Cant, Thunderhead Gloss, Stormglass Etching) and a "Wand" cluster (Quillflick, Thunderquill, Lodestar Quill)
  at the far upper left. It also shows crit names at the upper right (Comet's Edge, Needle-Star Glint). That is the
  opposite side of the wedge from the lightning cluster.
- Stands out: the four int keystones (Mana Bastion, Mind Bulwark, Fever Pitch, Volatile Servants). None of them is for me.
  Fever Pitch ("Critical Strike Multiplier is 100%") sits right next to the wand cluster and looks like a trap for a crit build.
- Looks pointless: the big grey hexagon honeycomb areas around the centre. At picture level they read as filler.
  I never went there.

## 2. Allocation log

1. `new mystic --budget 100`, `legend`, `reach 6`. Within 6 steps of the start the only notable is Twin Lanterns
   (dual wield and block, not for me). I could not learn much about the neighbourhood from `reach`.
2. `region int` plus `find lightning`, `find shock`, `find cast speed`, `find wand`, and `find` for spell crit with two wordings
   ("critical strike chance for spells" gave 0, then "Spell" filtered by crit worked). What I found:
   - Lightning plus shock cluster: Stormlamp Cant, Stormglass Etching, Forkglass Lance, Thunderhead Gloss, all in the int wedge at cost 24 to 25.
   - Spell crit chance: Comet's Edge and Needle-Star Glint (int, cost 25 to 26, upper right), but also a cluster in the Zealot wedge
     (strint): Oracle's Knell, Keen Orison, Ashen Invocation at cost 23 to 24.
   - Wands: Willow Quillwork, Quillflick, Thunderquill, Spectrum Reed, Lodestar Quill, cost 30 to 32, upper left. Most are attack speed or
     accuracy with wands, so wand attack nodes and not wand caster nodes.
   - So the two things I wanted most (lightning and spell crit) are about 50 points apart in the int wedge, but the left
     (strint) wedge has crit and a lightning conversion notable together.
3. DECISION: go to strint for crit. `alloc 1938` (Oracle's Knell): 23 points, through 6 hub nodes and 17 strint
   nodes. The walk gave: elemental resistances, ES, +50 Strength, mana, a little damage, armour, life. Nothing I
   specifically wanted except mana. About 60% of the walk was Strength, armour and life.
4. In strint: Keen Orison (3 more, 45% spell crit chance), Ashen Invocation (2, spell damage, cast speed, crit chance),
   Stormglass Hymn (3, physical as extra lightning and converted with spells), Rimefrost Psalm (3 via two lightning smalls), Ashen
   Triptych (3, +5% shock chance and elemental damage). 37 points in total. This cluster is very compact and a real find: spell crit, lightning, a
   bit of shock, all within a few steps.
5. Back to the middle: Sparkwick Trance (dexint, cost 14, lightning, cast speed, crit multiplier, shock effect). Good value, and
   I passed through generic damage and crit chance smalls to get there (+20% crit chance, 2x 7% damage). 51 points.
   Also took 716 (+10% lightning), 682 (+20% crit chance) via 681.
6. Pilgrim's Stride (cost 4, 5% cast speed). The road to it was Armour, Accuracy, ES: wasted points. Meager Offering (2, 22% mana
   and less mana cost). 60 points.
7. Stormglass Etching in int: cost 21 from my build (24 from the start). The road was a theme road: 4 cast speed nodes, 3
   spell damage, mana, ES and Int, then 2 lightning damage. That road was a delight. 81 points.
8. Stormlamp Cant (3), Thunderhead Gloss (4, with 2 crit-vs-shocked smalls), Forkglass Lance (3). 91 points. Then
   crit vs shocked small, a lightning small, Quickening Tide (4, 2 more cast speed smalls). 97. Cloistered Ink (3, mana). 100.
9. I did not take: wand notables (far and attack flavoured), Comet's Edge and the other int crit notables (cost 26 from the start,
   would have been ~25 more points), any keystone.

## 3. The build I ended with

100/100 points: 15 notables, 0 keystones, 70 small, 15 road/attribute. By region: hub 15, strint 38, dexint 8, int 39.

Notables: Oracle's Knell, Keen Orison, Ashen Invocation, Stormglass Hymn, Rimefrost Psalm, Ashen Triptych, Sparkwick Trance,
Pilgrim's Stride, Meager Offering, Stormglass Etching, Stormlamp Cant, Thunderhead Gloss, Forkglass Lance, Quickening Tide,
Cloistered Ink.

Totals from `summary` that matter: 110% increased spell crit chance (plus 40% generic crit chance and 85% crit chance vs
shocked), +45% spell crit multiplier (+15% generic), 231% increased lightning damage, 45% cast speed, 117% increased maximum
mana, +15% chance to shock, 55% effect of shock, 40% shock duration, 6% lightning penetration, 35% of physical converted to
lightning with spells, 36% damage with spells.

Wasted in the totals: +70 Strength, +30 Dexterity, 48% armour, 25% cold damage, 44% physical damage, 5% attack speed,
20% accuracy, life and resistances (resistances and life are fine).

Match to brief: 7/10. Lightning, cast speed, mana and spell crit chance are strongly met. Shock chance is low (15%), spell crit
multiplier is thin (+45 and +15), and I have no wand nodes at all because the wand cluster is too far and is attack
oriented. About 25 of my 100 points went to Strength, armour, accuracy and dex roads.

## 4. Frictions

| #   | kind      | where                                                                                                            | sev | symptom                                                                                                                                                                                                                                                          | what I wanted                                                                       | suggested fix                                                                | sure   |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| 1   | confusing | int wedge: Stormlamp/Stormglass Etching cluster (y -3100) versus Comet's Edge/Needle-Star Glint (y -4300, right) | 2   | Lightning is on the left of the int wedge and spell crit on the right, about 50 points apart. I could not take both in the int wedge, so I left it for strint.                                                                                                   | Lightning and spell crit in reach of each other for the Mystic's most obvious build | Move one of them, or put a spell-crit notable in the lightning cluster       | high   |
| 2   | good      | strint: Oracle's Knell, Keen Orison, Ashen Invocation, Stormglass Hymn, Ashen Triptych (cost 23 to 27)           | -   | A compact cluster with spell crit, lightning conversion and shock chance. This is the best part of my build and I found it only through `find`, because the Mystic picture did not show it.                                                                      | -                                                                                   | -                                                                            | high   |
| 3   | lost      | whole.png and region-int.png                                                                                     | 2   | Most notables are unlabelled on the whole-tree picture. In the int picture crit names are in the top right and the strint crit cluster is not visible at all, so a picture-only player would assume spell crit is only in the int wedge.                         | A hint that the neighbouring wedge has what the class wants                         | -                                                                            | medium |
| 4   | good      | road to Stormglass Etching (#387 to #368)                                                                        | -   | A road that carries the theme: 4 cast speed, 3 spell damage, mana, ES, int, then lightning. It made the walk worth it.                                                                                                                                           | -                                                                                   | -                                                                            | high   |
| 5   | wasted    | road to Oracle's Knell (hub and strint nodes #43 to #1821)                                                       | 2   | 23 points of which most are Strength, armour, life, elemental resistance. Only mana and a little damage were useful. +70 Strength total in my build.                                                                                                             | The walk toward a spell-crit notable to give something spell or int related         | Make roads toward a cluster carry that cluster's theme, as the int road does | high   |
| 6   | wasted    | road to Pilgrim's Stride (#1940, #1939, #1985)                                                                   | 1   | Four points for ES, armour, accuracy, then a notable with 5% cast speed, 5% attack speed, accuracy, +20 dex.                                                                                                                                                     | A cheap cast speed notable                                                          | -                                                                            | medium |
| 7   | missing   | wand nodes (searched `wand`, `wands`, `wield`)                                                                   | 2   | The only wand notables are far (cost 29 to 32), and almost all are attack speed or accuracy with wands. Thunderquill (physical as extra lightning with wands) does nothing for a spell. I cannot tell if Lodestar Quill's "crit chance with wands" helps spells. | A wand caster node: spell damage while wielding a wand                              | Say "with Attacks" and "with Spells" explicitly on wand nodes                | medium |
| 8   | missing   | spell crit multiplier (searched `multiplier`, `Critical Strike Multiplier`, spell filter)                        | 2   | The best I could find near me was Oracle's Knell (+30%). Knife-Edge Gloss (+40%) and Comet nodes are 25 or more points away at the top. A crit caster ends up with a weak multiplier.                                                                            | A crit multiplier near the crit chance                                              | -                                                                            | medium |
| 9   | weak      | shock: chance to shock overall (searched `shock`, `chance to shock`)                                             | 1   | Only 15% chance to shock for a shock build. The shock chance nodes in dexint (Jolted Mark, #551, #552) are mixed with "lightning damage with attacks", which a caster cannot use.                                                                                | Shock chance for spells                                                             | -                                                                            | medium |
| 10  | weak      | Rimefrost Psalm, Ashen Triptych, Stormglass Hymn                                                                 | 1   | Cold damage, physical damage and freeze and ignite chance on lightning notables. I paid for them as part of the notable.                                                                                                                                         | Lightning without the extra lines                                                   | -                                                                            | medium |
| 11  | good      | Sparkwick Trance (dexint, cost 14) and the hub road to it                                                        | -   | A notable that reads as exactly my build (lightning, cast speed, crit multiplier, shock) close to the centre. The middle of the tree gave me crit chance and damage smalls on the way.                                                                           | -                                                                                   | -                                                                            | high   |
| 12  | dead      | keystones in the int wedge (Mana Bastion, Mind Bulwark, Fever Pitch, Volatile Servants)                          | 1   | None of them is for a crit caster. Fever Pitch (crit multiplier is 100%) is the opposite of what a crit build wants and sits next to the wand cluster.                                                                                                           | A keystone for spell crit or shock                                                  | -                                                                            | medium |
| 13  | confusing | names: Stormglass Hymn / Stormglass Etching / Stormlamp Cant / Rimewick Cant / Emberwick Cant                    | 1   | Similar names across elements and regions made `find` results hard to tell apart.                                                                                                                                                                                | -                                                                                   | -                                                                            | low    |
| 14  | confusing | `reach` output                                                                                                   | 1   | `reach 6` from the start showed one notable, so I could not tell what was nearby; the useful options only showed up with `find`.                                                                                                                                 | -                                                                                   | -                                                                            | low    |

## 5. Overall

I would enjoy planning on this tree, mostly through the strint cluster and the themed roads. The two biggest problems:
roads toward a cluster often carry unrelated stats (Strength, armour, accuracy), and the Mystic's lightning and spell
crit are on opposite ends of the int wedge, with wand caster nodes missing. The two best things: the cast speed and
lightning theme road into the int lightning cluster, and the compact spell crit and lightning cluster in the
strint wedge. The middle of the tree gave me a good notable (Sparkwick Trance) and generic damage on the way.
