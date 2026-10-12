# Playtest 05: Mystic, fire-and-cold spellcaster

Build file: `scratchpad/audit/05.json`. 99 of 100 points spent. About 25 tool calls used. I read the whole-tree picture and the Mystic region picture. I did not open the other five region pictures, because my build never left the int region.

## 1. First impression from the pictures

- **Whole tree.** A big radial map with six wedges. The class starts sit in a tight ring in the middle, and everything else is far out. Keystones are labelled in the margins, so they are easy to spot. Most of the area is anonymous dots with tiny rings, and at whole-tree scale I cannot tell a notable from a small node.
- **Mystic region.** The top wedge has two clearly different zones.
  - Near the start there is a dense honeycomb of hexagonal cells with notable clusters in them. The labels there are cheap-looking mana, energy shield (ES) and regen names, with ids in the 150s-190s.
  - A long way out (y about -3000 to -5000) is a fan of fire, cold and lightning "cant" notables, the spell-crit notables and the wand/staff notables.
- **Roads.** Thin blue-dot roads run from the honeycomb out to the far notables, including Mind Bulwark and Mana Bastion. These are the long walks.
- **Finding my way.** Region int has clear names ("Dusk and Rime", "Rimewick Cant", "Emberwick Cant", "Searing Gloss") that told me at once where fire and cold live. That worked well.
- **Pointless-looking.**
  - Ids 1800-2160 (Choir, Pilgrim, Crozier and similar). They are in the Mystic picture, to the left, but they are not cheaply reachable from the int start, and I never worked out which class they belong to.
  - Wand and staff weapon-lock notables, for a caster who is not necessarily using them.
- **Label problems.** Labels overlap in places. Fever Pitch, Orrery Crook and Three-Lamp Rite sit on top of each other. Spite-Proof Skin, Mana Bastion and Stormlamp Cant are crowded.

## 2. Allocation log

1. **Looked at the int region listing and `reach`.**
   - Wanted: a fire+cold notable and mana/ES.
   - Found: the cheap-looking ES and mana notables (Quiet Reservoir, Thin Veil, Cloistered Ink) show as cost 2 from the start. The elemental notables are far away.
2. **`alloc 244` Dusk and Rime.** I wanted it because it is both fire and cold damage plus crit chance and both resistances. It cost 25 points: a 24-node road, then the notable.
   - It passed through 12+ Intelligence road nodes, 2 Cast Speed, 2 Mana, Spell Damage, ES and Fire Damage nodes.
   - The road was not a waste, because spell damage and cast speed were on it. But it is a long road for a single notable.
   - After this, 7 more cost-7 notables (the cants) became reachable, which was a nice payoff.
3. **`alloc 248` Prism Ledger.** 2 points for +6% to all elemental resistances and 20% increased Elemental Damage. A bargain.
4. **`alloc 222` Rimewick Cant** (7), then **`211` Emberwick Cant** (5). Each is 25% damage of its element, 5% cast speed with that element, and +15% resistance. Good.
5. **`alloc 212` Searing Gloss** (3) and **`387` Rimeglyph** (3). 25% damage plus 6% penetration.
6. **`alloc 226` Frostbound Vellum** (5) and **`217` Smoldering Colophon** (5). Freeze and ignite. The damage-over-time multiplier on them is mostly irrelevant to a hit caster, but 20% elemental damage is still fine.
7. **`alloc 190` Quickening Tide** (3). 8% cast speed plus ES recharge and mana regeneration. The 3-point path was all Cast Speed nodes.
8. **`alloc 152` Vellum Ward** (3). ES.
9. **`alloc 435` Fever Pitch** (5). I wanted 40% more elemental damage, and it was cheap.
   - Later I noticed "Critical Strike Multiplier is 100%". That cancels the crit multiplier I took afterwards (see friction 1).
10. **`alloc 306` Archivist's Trance** (11), **`307` Starlit Cantrip** (2) and **`324` Comet Script** (2). Spell damage, cast speed and Intelligence.
    - Archivist's Trance cost 11 because the path ran a long way across the north, through spell-damage and Intelligence roads.
    - Starlit Cantrip and Comet Script were then close.
11. **`alloc 303` Glyphwright's Draught** (5), **`337` Comet's Edge** (3) and **`310` Lampwick Reservoir** (4). Spell damage and mana. Comet's Edge is another crit multiplier that Fever Pitch nullifies.
12. **`alloc 149` Quiet Reservoir** (2), **`185` Cloistered Ink** (2) and **`169` Thin Veil** (2). These are the cheap ES and mana notables near the start. I could have taken them first.
    - The honeycomb notables were reachable at cost 2-3 because my first road went right past them.
    - I only needed 6 points for three ES/mana notables, so that is a good ratio.
13. **One point left over.** There was no useful 1-cost node. The 5-point Mana Bastion keystone did not fit.

## 3. The build I ended with

- **Points:** 99 of 100.
- **Taken:** 19 notables, 1 keystone (Fever Pitch), 51 small nodes and 28 road/attribute nodes.
- **Notables:** Dusk and Rime, Prism Ledger, Rimewick Cant, Emberwick Cant, Searing Gloss, Rimeglyph, Frostbound Vellum, Smoldering Colophon, Quickening Tide, Vellum Ward, Archivist's Trance, Starlit Cantrip, Comet Script, Glyphwright's Draught, Comet's Edge, Quiet Reservoir, Cloistered Ink, Thin Veil, Lampwick Reservoir.
- **Totals (from `summary`):**

| Stat             | Total                                                   |
| ---------------- | ------------------------------------------------------- |
| Fire damage      | 175% increased                                          |
| Cold damage      | 185% increased                                          |
| Spell damage     | 118% increased                                          |
| Cast speed       | 55% increased                                           |
| Max mana         | 94% increased (+80 flat)                                |
| Max ES           | 54% increased (+29 flat)                                |
| Crit chance      | 110% increased (+80% with spells)                       |
| Elemental damage | 30% increased, plus 40% more after a crit (Fever Pitch) |
| Resistances      | +25% fire, +25% cold, +10% all                          |
| Penetration      | 6% fire, 6% cold                                        |
| Intelligence     | +370                                                    |

- **Score: 7/10.**
  - It is strong on the brief: balanced fire and cold, plenty of cast speed and a lot of mana.
  - Defence is weak: ES is only about 54% increased with +29 flat. I took no life, no Mana Bastion and no block (only Cloistered Ink's spell block).
  - The biggest regret is Fever Pitch (see friction 1).
  - The cost of getting to the elemental cluster was about 25 points before the first notable.

## 4. Frictions

| #   | kind      | where                                                                                            | sev | what happened                                                                                                                                                                                                                           | change                                                                                        | sure   |
| --- | --------- | ------------------------------------------------------------------------------------------------ | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| 1   | confusing | #435 Fever Pitch next to #324 Comet Script, #337 Comet's Edge                                    | 2   | I took +27% spell crit multiplier and +20% fire multiplier, then the keystone said "Critical Strike Multiplier is 100%". Those nodes are dead and I only noticed at the end. The crit-chance road to Fever Pitch is also where it sits. | Warn in the node text, or do not put multiplier notables near the keystone that cancels them. | high   |
| 2   | confusing | #435 Fever Pitch                                                                                 | 1   | The text has two "40% more Elemental Damage" lines (8 s after a crit; after a recent crit). I can't tell whether they stack.                                                                                                            | Merge into one line.                                                                          | medium |
| 3   | wasted    | the 24-node road to #244 Dusk and Rime                                                           | 2   | 25 points for the first elemental notable. 17 of those were road nodes, though they carried spell damage and cast speed. It is a heavy entry tax.                                                                                       | Put a small fire/cold node on the way, or shorten the walk.                                   | medium |
| 4   | good      | honeycomb ES and mana notables (#149, #169, #185, #175, #181)                                    | 1   | They were 2-3 points away from the road I was already taking. Good ratio.                                                                                                                                                               | None.                                                                                         | high   |
| 5   | weak      | #249 chain, #410s small nodes                                                                    | 1   | A single "Intelligence" small node (+10ish) is not worth a point on its own; there were 12 in a row on my first road.                                                                                                                   | Make the roads give a mix.                                                                    | medium |
| 6   | missing   | whole int region                                                                                 | 2   | I found no big ES-focused defensive notable ("40% ES" level). The ES notables are 14-18%. With only 54% ES the build is thin.                                                                                                           | Add one big ES notable, or a "spell dodge" style defence.                                     | medium |
| 7   | missing   | for the Mystic region as a whole                                                                 | 1   | No cheap max life. Twin Wells (8% life) costs 3.                                                                                                                                                                                        | Fine. A caster should feel the choice.                                                        | low    |
| 8   | confusing | #430 Mana Bastion text                                                                           | 1   | "Energy Shield protects Mana instead of Life" does not say what I lose or gain.                                                                                                                                                         | Say it plainly.                                                                               | medium |
| 9   | weak      | #462 Open Lexicon, #483 Three-Lamp Rite and the charge notables                                  | 1   | Charges (Insight, Fervour, Grit) are never explained in the tree tool. I skipped them.                                                                                                                                                  | Show what the charge does.                                                                    | medium |
| 10  | dead      | weapon notables (#362 Willow Quillwork, #373 Quillflick, #374 Thunderquill, #361 Lodestar Quill) | 1   | Wand-only notables at cost 40+ for a spell caster. They look pointless from here.                                                                                                                                                       | Fine as a branch for wand attackers.                                                          | low    |
| 11  | confusing | ids 1800-2160 in the int picture                                                                 | 1   | A whole group of notables (Choir, Pilgrim, Crozier, Sentinel and so on) is on the left of the Mystic picture. I could not tell their class or whether I can reach them.                                                                 | Mark them or colour them by class.                                                            | low    |
| 12  | lost      | the picture labels                                                                               | 1   | Fever Pitch, Orrery Crook and Three-Lamp Rite overlap, so I could not read them without the tool.                                                                                                                                       | Offset the labels.                                                                            | high   |
| 13  | good      | #212/#387/#211/#222 elemental cants                                                              | 1   | Four elemental notables each cost 3-7 once Dusk and Rime was taken. Clear names and numbers.                                                                                                                                            | None.                                                                                         | high   |
| 14  | good      | `reach` command                                                                                  | 1   | It made planning much easier. The cost shown is the cost from my build, which changes as I allocate.                                                                                                                                    | None.                                                                                         | high   |

## 5. Overall

I would enjoy planning on this tree. The names are clear and the elemental cluster pays off once you reach it, and cost-from-build is a clean way to plan.

The two biggest problems:

1. Fever Pitch cancels the crit multiplier nodes that sit near it. This is a trap.
2. A very long, low-value road before the first elemental notable, and thin ES/defence options for a caster.

The two best things:

1. The cheap mana/ES honeycomb right next to the start.
2. Clear naming, and the cants forming an obvious fire/cold/lightning fan.
