# Playtest round 2, build 16: Strider, poison-arrow assassin

Brief: bow, chaos damage and poison, crits to spread it, evasion plus a little energy shield. About 100 points.
Build file: `scratchpad/audit2/16.json`. I used about 20 tool calls.

## 1. First impression from the pictures

- The whole tree is a hub-and-spoke "galaxy". Six class starts sit in a ring around a small, busy middle. Six big
  regions fan out from it, and the names are readable only on the region pictures. In the whole picture there are very few
  notable labels (about 30 keystones are visible, while notables are unlabeled), so I could not plan from it. I had to
  use the region pictures and then `find`.
- My own region (dex, lower right) looks like a wide field of small clusters. Labels are legible but it is a wall of about
  100 names. Colour helps: green means evasion, and orange or yellow means attack and crit.
- From the pictures alone I could tell where bows are (middle of the dex region, the "Bows" band around Lone Hawk's Cry
  and Hawk's Zenith) and that there was a poison cluster at the far right of the dex region (Hemlock Draught, Adder's
  Kiss, Venomed Fletching). That looked promising and close to my start.
- The dexint (Shade) region picture has a Poison/chaos block (Widow's Vial, Gloomblight Draught, Rotwhisper Cant, Lingering
  Rue, Slow Nightshade). It is far from the Strider start on the picture, up and right. My guess was 20+ points of walking.
- Looks pointless at first sight: the hub in the middle (Crimson Pact, Pain Conduit are spell and life-leech ideas that a
  bow build never wants), and the very large Trap/Mine/Totem fields, which serve nobody on a bow build.
- The notable names are flavourful but do not tell you what a node does (for example "Tailwind Shaft", "Dewpoint Aim").
  I needed `show` or `find` for every decision.

## 2. Allocation log

1. **Wanted** bow damage, crit and a way to the poison. `reach 6` showed no bow notable within 6 steps. `find bow` listed
   the bow notables in my region (Ridge Archer's Pace 823, Trailwarden's Draw 824, Shaftpiercer Hunt 831, Lone Hawk's Cry
   832, Rapid Nockfall 837, Hawk's Zenith 842), plus Slow Nightshade in dexint. **Took** 823, 832, 842: 16 points. Passed
   through: Attack Speed, Dexterity, Movement Speed small nodes and Damage with Bows smalls, which is a decent walk, since
   nearly everything on the road was bow damage, evasion or movement speed. Result at 16 points: 96% bow damage, 162%
   bow crit chance, 54% bow crit multiplier. This felt good.
2. **Wanted** poison. `find poison` showed Hemlock Draught 927, Nightshade Talon, Adder's Kiss, Venomed Fletching, all
   in my own dex region, east of the bow band. **Took** 959 (Featherblade Omen, crit chance 45% and +12% multi) which cost
   6 and led toward 927 (4 more) and then 937 (4 more). The walk gave crit smalls, life and attack speed. At 30 points I
   had 8+8% poison multiplier and +25% chance to poison.
3. **Took** 934 (a poison multiplier small), 1031 Falcon's Descent (+40% crit multi, 3 points) and 938 Adder's Kiss (4
   points; half of it is a dagger crit bonus, only "20% increased Damage with Poison" is useful). 37 points.
4. **Took** 824, 831, 837 (more bow damage, attack speed and accuracy): 8 points. 45 points.
5. **Wanted** evasion. Took Wildwood Skirmisher 883 (8 points, a long road of Dex, Life, Move Speed, Attack Speed) and
   Eagle's Windmark 1112 (5 points). Together about 156% increased evasion in the total. 58 points.
6. **Wanted** more chaos/poison scaling and a little energy shield. The dex region has no further poison. The "reach 12"
   list showed hub ES smalls (cost 4 to 6) but no notable of use in the hub, and every other ES notable was in the
   int region or the dexint region (28+ points for Fogbound Ward). So I went to dexint for poison: **Slow Nightshade 533
   cost 23 points** (a road of 22 nodes: Life, Attack Speed, Strength, Damage, Crit chance, Dexterity, Evasion, Intelligence, ES,
   Damage with Bows). It passes through the hub and the bottom of the Shade region and gave me a lot of mixed small
   nodes, a few of them useful (Damage, Crit Chance, ES, evasion), several not (Strength, Intelligence).
   That is the single biggest spend and I only got one notable at the end of it. 81 points.
7. Once there, the dexint poison block was cheap: Widow's Vial 3, Gloomblight Draught 4, Rotwhisper Cant 4, Lingering
   Rue 4, Slow Fester 2, Alleyrunner's Blight 3. All gave DoT multiplier or chaos damage. 100 points.
8. Considered and skipped: Steady Draw keystone (35% more bow damage, 20% less attack speed). For a poison build,
   attack speed is how stacks are applied, so the trade looked neutral to bad; I could not tell from the text alone.
   Also skipped Close Quarters (range-dependent), Nimble Gambit (30% less max ES, that is the "little ES" I wanted,
   and 50% less armour).

## 3. The build I ended with

- **100/100 points**: 20 notables, 0 keystones, 66 small nodes, 14 road/attribute nodes. By region: dex 60, hub 1, dexint 39.
- Notables: Ridge Archer's Pace, Lone Hawk's Cry, Hawk's Zenith, Featherblade Omen, Hemlock Draught, Venomed Fletching,
  Falcon's Descent, Adder's Kiss, Trailwarden's Draw, Shaftpiercer Hunt, Rapid Nockfall, Wildwood Skirmisher, Eagle's
  Windmark, Slow Nightshade, Widow's Vial, Gloomblight Draught, Rotwhisper Cant, Lingering Rue, Slow Fester, Alleyrunner's
  Blight.
- Totals (from `summary`): 236% bow damage, 236% bow DoT, 162% bow crit chance plus 145% general crit chance, +54% bow
  crit multi plus +64% general, 36% poison multiplier (and 34% + 10% general DoT multiplier), +25% and +50% chance to
  poison, 141% damage with poison, 92% increased chaos damage, 71% general DoT, 156% increased evasion and +210
  evasion, 35% attack speed, 40% movement speed, 30% max life. Only **10% increased max energy shield**.
- **Score: 7/10.** Bow, poison, crit and evasion are all well served and the stats stack up the way the fantasy says.
  The "little energy shield" part essentially failed (10% increased ES and nothing else): ES is in the int and
  dexint regions' far parts, or on a keystone that would cut my ES. Poison "spread" has no support at all (I found no
  node that mentions spreading poison). The dexint expedition cost 22 filler points before the first notable.

## 4. Frictions

| #   | kind      | where                                                                                                | sev | symptom                                                                                                                                                                                                                                                                                           | what I wanted                                                                                  | suggested fix                                                                           | sure                                               |
| --- | --------- | ---------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | good      | dex region: Hemlock Draught 927, Venomed Fletching 937, Featherblade Omen 959, Falcon's Descent 1031 | 1   | Poison and crit for an archer is right next to the bow band in my own region; the walk between them gives crit, life and speed smalls                                                                                                                                                             | n/a                                                                                            | none                                                                                    | high                                               |
| 2   | good      | bow band: 823, 832, 842, `reach` costs                                                               | 1   | Plain answer to "what does a bow build take first": three notables, 16 points, big bow crit and damage, and the road is all bow-relevant                                                                                                                                                          | n/a                                                                                            | none                                                                                    | high                                               |
| 3   | wasted    | road to Slow Nightshade 533 (#1052..#531)                                                            | 3   | 23 points for one notable: the road went through Strength, Intelligence, hub-side nodes and crit and Damage smalls spread out over ~20 nodes. Some value, but the real payload of that walk was poor. I could not tell beforehand which nodes the road would take                                 | A cheaper or more purposeful way into the Shade poison block, or a road I could see in advance | show the path before allocating (`alloc` only tells me after), or give the road a theme | high                                               |
| 4   | confusing | `alloc` / `reach` costs                                                                              | 2   | The cost shown for a node is "from your build", so after paying 23 once, every other dexint notable dropped to 2 to 4 points. Before I paid, the whole poison block looked like a 23 to 28 point price each. That is fine mechanically but I nearly dropped the trip because of the quoted prices | A hint that the first notable pays for the road for the others                                 | show "first one costs the road" in `reach`                                              | medium                                             |
| 5   | missing   | energy shield on an evasion hybrid (searched: "energy shield", "ES", "evasion", region hub)          | 2   | Only five hub small ES nodes (5% each) are near. All ES notables are in int/dexint (cost 20 to 30) and Nimble Gambit cuts max ES by 30%. A "little ES" build cannot get ES without a big detour                                                                                                   | A modest evasion+ES notable in dex or at the bottom of dexint                                  | an evasion-and-ES notable on the dex side                                               | medium                                             |
| 6   | missing   | poison spread / poison on crit (searched: "spread", "stack", "poisoned", "poison")                   | 1   | No node mentions spreading or stacking poison, so "critical strikes to spread it" is only crit chance and multiplier; Cruel Agony (crit ailments use crit multiplier) is in dexint at 28 points, which I did not take because it also cuts hit damage by 30%                                      | A link between crit and ailments that is not a 28-point keystone with a drawback               | maybe a notable                                                                         | low (I may be misreading what the engine supports) |
| 7   | weak      | Adder's Kiss 938                                                                                     | 1   | Half of it (+30% crit multi with daggers) is dead for a bow; the road to it is Damage with Daggers smalls (which do give poison chance on hit, a small plus). I took it for 20% poison damage                                                                                                     | a bow-flavoured alternative                                                                    | none                                                                                    | high                                               |
| 8   | weak      | Alleyrunner's Blight 549, Wildwood Skirmisher 883 road                                               | 1   | The notable gives 20% increased physical damage, which does nothing for a chaos build; the 8-point road to Wildwood was mostly Dexterity, Life and Movement Speed smalls, which are fine but not what I came for                                                                                  | n/a                                                                                            | none                                                                                    | medium                                             |
| 9   | confusing | Steady Draw 1065 keystone                                                                            | 2   | "35% more bow damage, 20% less attack speed": for a poison build I cannot tell whether that is good (more per-hit poison) or bad (fewer applications). No help in the text                                                                                                                        | A one-line note of how it plays                                                                | none                                                                                    | medium                                             |
| 10  | dead      | trap/mine/totem fields in dexint and dex (Thornsnare Warren, Warren of Snares etc.)                  | 1   | Dozens of notables with no use to a bow build; the road to the poison block runs through them                                                                                                                                                                                                     | n/a                                                                                            | none                                                                                    | medium                                             |
| 11  | dead      | hub notables for my build (Crimson Pact, Pain Conduit, Crossroads Bones)                             | 1   | The middle gave me one hub point (a passing small) and nothing I wanted; Compass of Marrow (16% damage, 4% attack speed for 6) is the only plain pick                                                                                                                                             | something for the walk between regions                                                         | none                                                                                    | medium                                             |
| 12  | lost      | whole picture                                                                                        | 2   | Labels in the whole picture are mostly keystones; I could not plan from it, and `find` was my real map                                                                                                                                                                                            | A way to see the poison cluster's position at a glance                                         | label each region's main theme on the whole picture                                     | medium                                             |
| 13  | good      | dexint poison block (Widow's Vial, Gloomblight, Rotwhisper, Lingering Rue, Slow Fester)              | 1   | Once there it is dense and every notable is on theme, all within 2 to 4 points of each other                                                                                                                                                                                                      | n/a                                                                                            | none                                                                                    | high                                               |

## 5. Overall

Yes, I would enjoy planning on this tree: the bow and poison identity of the Strider's own region is clear and the first
30 points feel great. The two biggest problems: the road from the Strider region into the Shade region costs 23 points
for one notable with filler on the way (the cost is hidden until you pay it), and energy shield or "spread" payoffs
for an evasion-hybrid are essentially absent. The two best things: the bow band and poison block near the start, with
roads that mostly carry something useful; and the dense, on-theme poison cluster in dexint once you arrive.
