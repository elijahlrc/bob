# Passive tree parity (3.9)

Goal: a tree with the breadth of the 3.9 tree: far more notables with several lines each (some conditional), keystones that
change how a build plays, and nodes for every system added since the tree was written (minions, totems, traps, mines,
brands, curses, warcries, guards, auras and heralds, ailment damage over time). Layout, names and numbers stay our own
(DESIGN §3, §9.1); the reference only says which kinds of node and which mod lines exist.

## Reference measured (`docs/tree/pob-tree.json`, `npm run tree:extract`)

Main tree of 3.9.x, without ascendancy nodes, jewel sockets and class starts:

| Kind      | Reference | Bob before  |
| --------- | --------- | ----------- |
| Keystones | 28        | 21          |
| Notables  | 369       | 139         |
| Small     | 1,235     | about 1,000 |
| Total     | 1,632     | 1,344       |

The reference notables are 1.2 lines each on average and 330 distinct lines; the small nodes use 181 distinct lines that
Bob's mod vocabulary did not have a phrase for (`npm run tree:lines`).

## Targets (this pass)

| Item         | Target                                                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keystones    | 27 (the 21 we have, plus analogs of Acrobatics, Phase Acrobatics, Minion Instability, Ancestral Bond, Runebinder, Necromantic Aegis; Mortal Conviction and Wicked Ward if cheap). Conduit (parties) is out. |
| Notables     | at least 300, each an analog of a reference notable's defining line (at least 85% of 369), written with our own names                                                                                       |
| Nodes        | about 1,650 to 1,800 (123 points still cover about 7% of the tree)                                                                                                                                          |
| Small themes | cover every family of small-node line the reference has that the engine can express                                                                                                                         |
| Interesting  | at least a third of notables carry a conditional or secondary line                                                                                                                                          |
| Saves        | `SAVE_VERSION` bumped (node ids change)                                                                                                                                                                     |
| Not in scope | jewel sockets and jewels, ascendancies, party effects, knockback, blind, maim, phasing                                                                                                                      |

Every stat the tree grants must be read by the sheet or the sim, or the bot never allocates it and the player gets nothing.

## Plan

1. Engine vocabulary for the line families the tree needs (DoT multipliers and skill keywords on ailment damage,
   weapon-scoped ailment damage, deployable and minion stats, penetration, enemy physical reduction, double damage, leech
   caps, charge stats, and so on), with phrases in `scripts/coverage/modDict.ts` and the line diagnostic.
2. A notable catalog: one decision file per reference notable (our name, our mods, lines dropped and why), as for uniques;
   an emitter writes `src/data/tree/notablesGen.ts`.
3. New small-node themes for the missing families.
4. A bigger layout: more rings and slots per region, clusters of a notable and two to four small nodes.
5. New keystones.
6. Balance: small bot sims; the bot must allocate the new nodes.

## Status

See the end of this file; each step is appended when it lands.
