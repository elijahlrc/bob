# Playtest 09: Zealot, aura-and-curse build

Build file: `.../scratchpad/audit/09.json`. 98 of 100 points spent. Brief: a Zealot (str/int) running several auras, curses on enemies, strong curse and aura effect, energy shield plus life, mana to pay for it all.

## 1. First impression from the pictures

- The whole tree is a big six-armed star. Each class start sits on a ring around a small centre. Each region is a wedge whose edge is a faint grey line.
- Inside a wedge the nodes cluster into islands joined by long grey road lines.
- Labelled keystones stick out at the ends of thin dotted spokes (Searing Avatar, Living Ward, Lone Vow, Shade Leech). They are easy to spot and look like long "pay to reach" dares.
- My region (strint, upper left) is a big sprawl. The north part is a column of weapon-specific notables (Staves, Maces, Sceptres, Wands: Vesper Rod, Cantor's Cudgel and so on). The west holds life, armour and resistances. The middle holds mana and aura nodes. The far north-east has minion clusters (green).
- I assumed I could walk into the neighbouring wedges, as in the reference game. The pictures show faint divider lines but also many nodes sitting right on the border. I expected the Intelligence region directly above to be open to me, because it holds the energy shield nodes, Mana Bastion and the aura and hex clusters I wanted.
- Looks pointless at a glance: the northern staff and mace column for a caster aura build, and the "Intelligence/Strength/Dexterity" road dots that are the only way through many places.
- A name-only legend would help. The picture labels are only the big nodes, so I had to rely on the tool's `find`.

## 2. Allocation log

1. **Plan.** I ran `find` for aura, hex, curse, reserv, effect of and mana cost to see what exists.
   - Aura and curse nodes are scattered one or two per region: Haloed Margin (int), Wreathing Smoke (dexint), Hushed Weathervane (dex), Marching Drumbeat (strdex), Whisper Network and Hexbinder's Tithe (dexint), Spiteful Footnote "+1 hex" (int), Lone Vow (strdex), Blood Rite (str).
   - Only three of them are in my region: Thurible Hush, Marrow Hymn and Tolling Malison.
2. **Detour that failed.** I tried to `alloc` Haloed Margin, Twin Wells, Mana Bastion, Cairnlight Well (str), Hexbinder's Tithe, Wreathing Smoke, Hushed Weathervane, Marching Drumbeat, Blood Rite and Marrow Reservoir.
   - All gave "cannot be reached". Other classes' start nodes cannot be walked through. The hub, the Zealot's wedge and nothing else are open to me.
   - Even str nodes next to Silent Cloister (Cairnlight Well at -1421,-40, 400 units from my build) cannot be taken.
   - I spent about 8 tool calls on this. The picture gives no hint of it.
3. **Thurible Hush (8 points).** The route was Max Mana, Strength road, Strength road, Armour small, Intelligence road, then two Mana Reserved smalls, then the notable. It passes 4 nodes I did not want (2 roads, an Armour small, a Strength road). Fine. I then took the two other "Mana Reserved" smalls (+2).
4. **Silent Cloister (3).** The path crossed two ES+mana smalls, which is nice.
5. **Marrow Hymn (4).** It crossed Max Mana, a Strength road and a Life small, so there was little waste. Aura effect is only 3% on this node.
6. **Tolling Malison (4+1) with the two Hex smalls.** Total hex effect is 25%, and nothing else for hexes exists in my wedge.
7. **Meager Offering and mana smalls (3).** Chalice Deep (4), Deep Well Chant (5), Slow Incense (4).
   - Three plain 25%-mana notables plus regen: mana is solved at 260% increased.
8. **Hub, Hollow Heart (9, plus 2 more ES smalls).** The path ran Strength road, Damage small, Dexterity road, Strength road, Max Mana small, Strength road, 2 ES smalls, then the notable. A long walk for 12% ES. It gave 4 wasted-ish nodes (Strength, Damage, Dexterity roads and a Strength road).
9. **Sacristan's Pact (2).** 10% mana plus minion nodes I do not use. It was cheap, so I took it.
10. **West life/armour column (about 36 points).** Cinder Vestments cost 14 on its own, through a chain of Strength and Armour roads and smalls. Then Sackcloth Vigor (3), Cloistered Plate (5), Humble Tithe (5), Tallow Heart (3), Vesper Draught (5) and Plaguewarded Flesh (3).
    - These are life, armour, ES and regen, which is what I wanted. The 14-point walk was the biggest single expense.
11. **Leftovers (9).** Slow Vigil (4, 50% skill effect duration in total, for curse duration), Mailed Cassock (2, armour) and Smoldering Heresy (3, penetration and ailment effect). I stopped with 2 spare because nothing else useful was within reach.

I did not refund anything. I never needed to unalloc.

## 3. The build I ended with

98/100 points: 20 notables, 0 keystones, 57 small, 21 roads/attributes. Regions: strint 87, hub 11.

Notables:

- Aura and curse: Thurible Hush, Marrow Hymn, Tolling Malison.
- Mana: Chalice Deep, Deep Well Chant, Meager Offering, Slow Incense, Sacristan's Pact.
- ES and survivability: Silent Cloister, Hollow Heart, Cinder Vestments, Cloistered Plate, Sackcloth Vigor, Mailed Cassock, Humble Tithe, Tallow Heart, Vesper Draught, Plaguewarded Flesh.
- Utility: Slow Vigil, Smoldering Heresy.

Totals from `summary`:

- +260% max mana
- 22% reduced mana reserved
- 13% increased effect of auras on you
- 25% increased effect of your hexes
- 24% reduced mana cost of skills
- 72% max ES, +104% max life (+30)
- 196% armour
- 90% mana regen, 4.6% life regen per second
- 50% skill effect duration
- +8% all elemental resistances, +20% chaos resistance

**Score: 5 out of 10.**

- The defence and mana half of the brief is fully served (260% mana, 22% reduced reservation, ES plus life plus armour).
- The aura-and-curse half is weak. Aura effect is 13% total, there is no curse-specific scaling (no curse AoE, no extra curse), and hex effect is 25%. The real aura and curse payoffs (Haloed Margin 30% aura AoE, Wreathing Smoke 14% aura effect, +1 hex, Whisper Network) are out of reach.
- A Zealot is the class this build should fit, yet the tree gives it three on-theme notables out of about 70.

## 4. Frictions

| #   | kind      | where                                                                                                                                                                        | sev | what happened                                                                                                                                                                                                                     | what I would change                                                                                                                                                                                 | sure   |
| --- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | missing   | Whole build: every aura or curse notable outside strint, e.g. #492 Haloed Margin, #716 Wreathing Smoke, #276 Spiteful Footnote, #713 Whisper Network, #856 Hexbinder's Tithe | 3   | `alloc` said "cannot be reached" for every node outside strint and hub. Other class starts are impassable and the wedges only meet at the hub. My build's aura and curse scaling is capped at 13% aura effect and 25% hex effect. | Either let wedges connect on the outside, or put an aura or curse notable and an extra-hex node in every class wedge. At least say in the tool or on the picture that the border cannot be crossed. | high   |
| 2   | confusing | Region pictures versus the tool: Twin Wells (#182), Cairnlight Well (#1832) sit next to my nodes                                                                             | 2   | They look adjacent and have no visible wall. The tool says "cost -" first and only "cannot be reached" when I try them.                                                                                                           | Draw the wall, or grey out unreachable nodes in the pictures and give the tool a `reachable` filter.                                                                                                | high   |
| 3   | lost      | `find curse` and `region int`                                                                                                                                                | 2   | The best nodes for the build are in a wedge I cannot use, but `find` lists them next to usable nodes with only "cost -" to hint. I wasted about 8 calls discovering that.                                                         | Mark unreachable nodes distinctly, for example "cost: blocked".                                                                                                                                     | high   |
| 4   | missing   | Curse support in strint                                                                                                                                                      | 3   | There is one hex notable and 2 hex smalls. No "+1 curse", no curse AoE and no curse duration. A "curses on enemies" build gets 25% hex effect and nothing else.                                                                   | Add at least one curse limit or curse effect notable per wedge that has hex nodes.                                                                                                                  | high   |
| 5   | weak      | #2124 Slow Vigil, #1966 Smoldering Heresy, #2059 Mailed Cassock (my last points)                                                                                             | 1   | I took them because nothing on theme was left within 5 points. Slow Vigil's 30% duration only helps if my curses and auras have a duration.                                                                                       | Give the filler slots curse or aura text, or leave them to physical builds.                                                                                                                         | medium |
| 6   | wasted    | #78 Hollow Heart route (hub)                                                                                                                                                 | 2   | 9 points: Strength, Damage, Dexterity, Strength roads and a Max Mana small before the 12% ES notable. About 5 of the 9 are attribute roads.                                                                                       | Put ES smalls on the hub route, or make the first notable closer.                                                                                                                                   | medium |
| 7   | wasted    | #2052 Cinder Vestments route                                                                                                                                                 | 2   | 14 points, of which about 11 are Strength and Armour roads and smalls (armour, strength). For a caster with ES, armour smalls on the way are mostly dead weight.                                                                  | Give the long west road more mixed nodes, such as life or ES, so the walk is not an armour tax.                                                                                                     | medium |
| 8   | good      | Mana cluster around #1895 Chalice Deep, #1892 Deep Well Chant, #1896 Meager Offering, #1888 Slow Incense                                                                     | 1   | Every path to these notables crossed 8%-mana smalls and mana-cost smalls. I never felt I wasted anything. Three 22-25% mana notables are good value.                                                                              | Keep this pattern.                                                                                                                                                                                  | high   |
| 9   | good      | #1875 Thurible Hush with #1876-1879 "Mana Reserved" smalls                                                                                                                   | 1   | A real aura hub: a notable, plus four reservation smalls on the way. It reads clearly and fits the theme.                                                                                                                         | Make more clusters like this, with curse hubs in each wedge.                                                                                                                                        | high   |
| 10  | good      | `reach` command                                                                                                                                                              | 1   | Gave a clear list of what is near and its cost.                                                                                                                                                                                   | None.                                                                                                                                                                                               | high   |
| 11  | dead      | Northern strint (Staves, Maces, Sceptres: Vesper Rod, Cantor's Cudgel, Crozier's Verdict...)                                                                                 | 1   | A large part of my wedge is weapon-specific notables that do nothing for a spell, aura and curse caster.                                                                                                                          | Fine for other builds, but it shows my wedge is mostly not about its class theme.                                                                                                                   | low    |
| 12  | confusing | #2121 Living Ward (Max Life becomes 1)                                                                                                                                       | 1   | I wanted ES plus life, so I skipped it. The keystone is a clear trade-off, but it sat 5 points from my build and I had no ES-only build target.                                                                                   | None.                                                                                                                                                                                               | low    |
| 13  | missing   | Aura and curse notables with no mana cost                                                                                                                                    | 1   | Nothing says how many auras I can run. No node gives an extra aura slot or an aura reservation bonus beyond Thurible Hush.                                                                                                        | Some node to scale the number of auras.                                                                                                                                                             | low    |

## 5. Overall

I would not enjoy planning an aura-and-curse build on this tree. I enjoy the mana and defence part, but the theme the brief asked for is mostly unreachable from the Zealot start.

Biggest problems:

1. The wedges cannot be crossed. Every aura and curse payoff lives somewhere else and "cannot be reached" arrives without warning.
2. The Zealot's own wedge has almost no curse or aura content: one hex notable, two aura notables and nothing for curse count.

Best things:

1. The mana and reservation clusters are well made: notables with useful smalls on the way.
2. `reach` and `find` make planning fast, and the costs shown are honest.
