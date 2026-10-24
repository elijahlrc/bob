# G3 borders: the extra crossings, revisited after G3

Done 2026-10-22, after G3's three rounds (1,389 live nodes, the tree of commit 5e8443f; nothing in `src/data/passives/`
changed since). At stop 2 the user asked for 1 to 2 more crossings per border; the G2 border pass found none worth laying
on the bare skeleton ([G2/borders.md](../G2/borders.md) §3); at stop 3 the user chose to revisit after G3, Reaver–Strider
first, because the new clusters might create combinations worth linking. [CONSTRAINTS.md](../CONSTRAINTS.md) wins over
everything here.

**Pictures** ([borders/](borders/)): `before-whole.png` and `whole.png` (identical, since nothing changed), and one
close-up per border with every node's id: `reaver-strider.png`, `vanguard-zealot.png`, `mystic-shade.png`,
`mystic-zealot.png`, `vanguard-reaver.png`, `strider-shade.png`.

## 0. The result: no link laid, and why that is the finding

**No crossing was added on any border.** Every border was searched again with the G3 clusters as ends, every candidate
the G3 reports raised was measured, and the best candidates were run through the allocator with the link in place. Each
one either collapsed a build's choice, put two of one build's wants a step or two apart (§5.5), pulled a neighbour's
notable close to a start, made a keystone spur a through-route (§9.1), or was used by no build before 160 points. One link
was written and measured (Graven Posts to Warding Staff, §2.3) and taken out again on the numbers. One is borderline and
left to the user, not laid: Festering to Pitch Arrows on Reaver–Strider (§2.1), which passes the "notable of a different
kind between" reading of §5.5 but puts two poison clusters 3 steps apart. A link laid for the count would be the "at
random" crossing §3.7 rules out.

That is twice now (G2 and here), so the shortfall is not a matter of looking harder. It is structural, and it is the thing
for the user (§6):

- **Near the homes, every border is already dense.** Crossings sit every 120 to 900 units from the ring outward (§1).
  Any further link there brings a neighbour's home notables 3 to 5 steps nearer a start: every border's candidate list
  is led by home-to-home pairs (for example Stout Heart–Bracing, the Reaver hub–the Vanguard ring road, the Knife's
  south hub–Hedge Magic).
- **Far out, the two regions' edges face each other with things that must not be joined.** The ends there are keystone
  spurs (Living Ward and Mind Bulwark, Crimson Pact, Idle Hands), deliberate far tips (Bad Company, the trap fork, High
  Veil), or twin clusters the G1 brief and the G3 agents kept apart on purpose (Festering and Fouled Tips, Sea Legs and
  Hardy Stock, Cinder and Plainsong). G3 placed its clusters with their twin distances measured against what lay across
  the border, so the seams became "keep apart" zones.
- **So a crossing worth having needs something on the seam to be designed for it:** a cluster whose partner is the
  crossing's combination, placed where both regions' builds want it and neither home's notables come close. That is new
  growth (a G4 or G5 item, out of this pass's scope), not a link.

## 1. Counts

Links whose two ends are in different regions (a start counts as its region). The ring is the centre's: two links into
each home, unchanged (12).

| border          | before |  after | places | largest gap between neighbouring crossings      |
| --------------- | -----: | -----: | -----: | ----------------------------------------------- |
| Mystic–Shade    |      7 |      7 |      7 | 893 units (the Rooftops road to the storm road) |
| Mystic–Zealot   |      6 |      6 |      6 | 918 (the crypt road to the far loop)            |
| Zealot–Vanguard |      8 |      8 |      7 | 796 (Scar Tissue to Stagger)                    |
| Vanguard–Reaver |      9 |      9 |      9 | 629                                             |
| Reaver–Strider  |      7 |      7 |      6 | 1,008 (the Pits' east to Stormstruck)           |
| Strider–Shade   |      8 |      8 |      7 | 876 (the Hardy Stock rung to the rim highway)   |
| **all**         | **45** | **45** |        |                                                 |

Places: two links on one node count once (the Reaver–Strider east gate, `wall.resists.j.a` on Zealot–Vanguard,
`bow.bows.toKnife.a` on Strider–Shade). Against the reference: 45 border links of 1,685 (2.7%), 57 with the ring (3.4%),
where the reference has 81 of 1,858 (4.4%) and 10 to 13 per neighbouring pair. Each section below says what its largest
gap holds.

## 2. Border by border

How each border was searched (scratch scripts, outside the repository):

1. Every clean node pair across the border within 650 to 1,000 units (no crossing, at least 28 units from every other
   node), with the notables each would bring nearer to every start.
2. The pairs of notables some archetype values at 2 units or more that sit close on the map but 8 or more steps apart by
   the network (where a build is made to walk round).
3. The candidates the G3 reports named, and the best of 1 and 2, run through the allocator with the link added
   (`passives:builds` with a trial link; the same deterministic search as the tool), before against after.

### 2.1 Reaver–Strider (first, as the user asked): 7 → 7

**Today:** the east gate (`yard.dual.j2.a` to `jt1` and `n409`), Footwork to the Ford hub `bow.steel.hub.t`, Hot Blood to
`toBlood.b`, Darting Steel to `toBlood.c`, `toBlood.d` to the Pits' `east.e3`, and Stormstruck to the outer road's `j8`.
From the ring to `e3` a crossing sits every 120 to 600 units. All three Reaver archetypes and all three Strider
archetypes already cross it (axe-bleed, dual-wield and sword-str by 120; the three bow builds by 60). The Ford question
of G2 §0 was answered at stop 3 (the inner link `n409`–`hub.t`).

**The one gap** (1,008 units, `e3` to Stormstruck) holds Crimson Pact's keystone spur, Festering (a dead-end tip since
round 3 hung it from the Fosse's first node) and, across, Pitch Arrows and Fouled Tips.

| candidate                                                                        | measured                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | verdict                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Festering – Fouled Tips (432 units)                                              | Festering to Fouled Tips 12 → 1 step. bow-poison takes both at every budget: poison 6.0 → 12.5 units at 60 (choice 2 → 3), 12.7 → 18.2 at 120; claw-poison's poison 15.2 → 22.5 at 120 (choice 4 → 3).                                                                                                                                                                                                                                                                                                                                                                                                                                | Rejected: two poison clusters a step apart, the one-stop the brief declined.                                                                                                                                                                          |
| Festering – `j8` (350 units; the brief's declined "poison bow and poison sword") | Festering to Fouled Tips 12 → 5, Festering to Stormstruck 7 → 2. Used by bow-poison and claw-poison only at 160; no build uses it at 60 or 120. Would make Festering a bridge again.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Rejected: no build wants it; the outer ring is already closed by Stormstruck–`j8`.                                                                                                                                                                    |
| Sidestep – `toBlood.a` (140 units; G2's runner-up, option (c))                   | Gains one notable 2 steps for one start (Plated Hide 15 → 13 from the Reaver). Used only by dodge-blades at 120, whose choice falls 2 → 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Rejected: one node from Footwork's crossing, same evasion and dodge combination.                                                                                                                                                                      |
| **Festering – Pitch Arrows** (462 units, clean, 125° and 67°)                    | Festering to Fouled Tips 12 → 3 with a fire notable between; Festering a bridge again. bow-poison unchanged at 60 and 120 (uses it from 140). claw-poison uses it at 120: its plan leaves the east rim (Smeared Edge, Ricochet, Tumble, Grey Cloak, Veiled Herald, Hardy Stock, Sea Legs, Rat Bite) for the south (Pitch Arrows, Festering, Fouled Tips, Red Harvest, Wiry Frame, Rotting Word, Scarred Hide, Four Winds): poison 15.2 → 21.5 units, life 29.2 → 32.2, choice 4 → 4, tax 26% → 28%; it gives up the east rim's evasion and dodge. No other build uses it (axe-bleed, bow-elemental, bow-crit, dual-wield, sword-str). | **Not laid; for the user** (§6). For: §5.5's fair price (a notable of another kind between), and the poison claw gets a real second direction. Against: the two poison clusters 3 apart where §5.2 asks about 5 and G1 declined a poison corner at 5. |
| Crimson Pact's small – Pitch Arrows                                              | A keystone spur as a through-route.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Rejected (§9.1).                                                                                                                                                                                                                                      |
| Wayfarer / Vital Aim – Buckler / Quickened Steel                                 | The detour pairs the measure found (10 steps, 424 to 924 units), but every one is a home notable of each side: a link brings Buckler 9 → 4 to 6 steps from the Strider start and the Strider's home 3 steps nearer the Reaver's.                                                                                                                                                                                                                                                                                                                                                                                                      | Rejected (§5.5, §6).                                                                                                                                                                                                                                  |

**Footwork** (the G3 Reaver report's carried question) is not a link question: moving the cluster is out of scope. For the
user, the numbers: Footwork is 7 steps from the Strider start and 12 from the Reaver's. At 60 points it is in the plan of
all three bow builds and of dagger-crit and claw-poison, and four of those five have one plan at 60 (choice 1; bow-poison
2). It is the Reaver's evasion-and-accuracy notable sitting on the Strider's own way to its Ford.

### 2.2 Strider–Shade: 8 → 8

**Today:** Soft Step and the claw rung on `bow.bows.toKnife.a`, Hedge Magic, the Snares (Tripwire to Trapper), Mercy
Stroke to Venom Fletching, Ricochet, the Hardy Stock rung, and the east rim highway (`knife.rim.wall.s6`–`bow.rim.road.j1`).
The largest gap (876 units) lies between the Hardy Stock rung and the rim highway: the Shade's Sea Legs and Cold Steel
against the Strider's Hardy Stock road.

**The trap fork** (`bow.rim.fork.x`, Hair Trigger, Shaped Charge; the G3 Strider report's question): the fork is 21 steps
from the Shade start and its two notables 24. Every Shade node within 900 units of it is 18 or more steps from the Shade
start. The best single clean link anywhere buys 4 steps (21 → 17) and needs 840 to 890 units of new road
(`knife.snares.toBow.b`–Ricochet, or `toRicochet.r4`–`bow.rim.road.m12`, which runs beside the Hardy Stock road for its whole
length). Measured, `toRicochet.r4`–`m12` is used by no trap-mine plan at any budget (bow-crit uses it at 120 as a shortcut
inside its own region). Hair Trigger to the Shade's rim wall (`s5`, 863 units) saves the Shade 2 steps to Hair Trigger and
nothing to the fork. **The distance is geography:** the fork is the Strider's far north-east tip and the Shade's trap home
is the Docks. If the Shade's trapper should own a late trap direction, that wants the fork moved or a Shade trap cluster
on its east rim (G4), not a crossing.

| candidate                                                                                                 | measured                                                                                                                                     | verdict                                                                          |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `knife.edge.rung.a` – Tripwire (630 units)                                                                | Tripwire 12 → 7 from the Shade start. trap-mine takes it into its 60-point plan (choice 3 → 2); claw-poison's choice at 120 falls 4 → 3.     | Rejected: a neighbour's trap notable 7 steps from the trap build's start (§5.5). |
| Raking Hand or the claw rung – the Longbow and Fleet Blade wheel (160 to 250 units), or the bow hub (585) | Longbow and Fleet Blade 12 → 7 to 10 from the Shade start; by the hub, Raking Hand 8 → 5 from the Strider's. G2 found the same.              | Rejected (§5.5).                                                                 |
| Veiled Herald's or Sea Legs' chain – Hardy Stock (337 to 650 units)                                       | Life twins: Sea Legs (life, dodge) and Hardy Stock (life, resistances) are 7 apart on two roads, kept so by the G3 Strider and Shade agents. | Rejected.                                                                        |
| the Knife's south hub – Hedge Magic (411 to 457 units)                                                    | Hedge Magic 6 → 3 from the Shade start, or (by its small) up to 39 Strider notables 2 or more steps nearer it.                               | Rejected (§6).                                                                   |

### 2.3 Zealot–Vanguard: 8 → 8

**Today:** the Nave road and Verger (both on `wall.resists.j.a`), the Banner, Scar Tissue and Hallowed Hammer (both on
`cathedral.rods.toWall.a`), Stagger, Battle Hymn and Procession–Grim Oath. Short border, between two keystone spurs.

**Graven Posts and Idle Hands** (the G3 Vanguard report's question). Idle Hands' spur cannot take a link (§9.1). Its
junction `cathedral.rods.toWall.b` is 692 units from Graven Posts, but the line runs 19 units from Warding Staff's far
small, 6° off its link: not clean. The clean version is Graven Posts to Warding Staff, straight north (392 units, a T at
both ends). **It was written** (a strength-and-intelligence crossing node halfway, in `cathedral/rods.ts`), checked
(0 crossings, 0 drawn over, no new bend) and measured, then **taken out**:

- Steps: Graven Posts from the Zealot start 16 → 14; Graven Posts to Idle Hands 10 → 8. The Vanguard gains nothing (it
  reaches Graven Posts at 13 and Idle Hands at 15 already, by Hallowed Hammer's crossing).
- No listed archetype used it (warcry-totem, sceptre-fire, staff-block, two-hand-fire, mace-slam, aura-brand,
  block-caster; staff-block took it only at 80 and 100 in a trial without the node, for the resistances).
- The build it is for, a Zealot spell totem caster with a staff, is not in the archetype set, so a scratch probe was run
  (totem damage and speed, spell damage, staff, spell block, life, Idle Hands worth 4; not added to `archetypes.ts`).
  **Without the link** it already takes Graven Posts from 80 points, by the hammer route. **With it**, Graven Posts moves
  into the 60-point plan and the whole totem kit is held at 60 (totem damage 8 units, flat to 160), spell damage at 60
  drops 17.5 → 14.5, and the choice at 120 falls 6 → 4.

So it hands the totem build its totems 20 points earlier and narrows its choices (§13.1): rejected.

| other candidate                                                                                 | measured                                                                                                                                                                                             | verdict                                                                              |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Ardour / the Zealot's west road – Elemental Ward, the Rampart, Ringing Blows (311 to 760 units) | The Battlements' east (G1's space C): 3 to 5 steps nearer for 10 to 26 Vanguard notables from the Zealot start, and the Zealot's home notables from the Vanguard's.                                  | Rejected, as G1 and G2 decided (two strength-and-intelligence starts, cheap armour). |
| the Churchyard / Censer – Grim Oath (G2's runner-up)                                            | A second link onto Grim Oath beside Procession's, for the same far-west corner; Grim Oath 21 → 18 from the Zealot.                                                                                   | Rejected.                                                                            |
| **the far west** (Wake, Brazier, Buttress, Thunder Peal)                                        | The Zealot's outer walk faces empty map; its south end is already tied to the Wall twice (Procession–Grim Oath, Battle Hymn–`toHymn.r4`). Making the walk part of a loop is an internal Zealot link. | Out of scope; for G4.                                                                |

### 2.4 Vanguard–Reaver: 9 → 9

**Today:** the most connected border (largest gap 629 units). From the north: Bracing, Guarded, the slams junction,
Thirsting Blade, Headsman, Sword and Board, the Pits' west, Cleaver and Barrow Ward (both on `yard.fosse.road.f7`).

| candidate                                                                                                 | measured                                                                                                                                                                                                                            | verdict              |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| home to home (Stout Heart–Bracing, the Reaver hub or ring road to the Wall's ring road, 370 to 870 units) | Bracing 8 → 5 from the Reaver start; up to 108 notables 2 or more steps nearer one start or the other.                                                                                                                              | Rejected (§5.5, §6). |
| Thirsting Blade or its chain – Strongarm's small, the slams junction, Second Wind (245 to 380 units)      | Thirsting Blade 14 → 9 and Second Wind 16 → 11 from the Reaver: G2's "regeneration or leech" fork (the two are 2 apart) brought 5 steps nearer the Reaver start, a far fork made a mid-run one.                                     | Rejected (§5.5).     |
| the leg or `toWall.a` – Greatblade (280 to 590 units)                                                     | Greatblade 16 → 12 or 13 from the Reaver: the two-hander twins G1 kept apart (Full Swing, Greatblade).                                                                                                                              | Rejected.            |
| Standing Cairns – `yard.blades.j1.a` (216 units); Unhurried – `west.w1` (269)                             | A Wall totem notable 7 steps from the Reaver start; Unhurried 10 → 6.                                                                                                                                                               | Rejected (§5.5).     |
| Stone Ward – Thirsting Blade's chain (333 units)                                                          | Stone Ward (spell block, life on block; a dead end) 19 → 13 from the Reaver, which has no spell-block build; the far detour pair Stone Ward–Sword and Board (12 steps) cannot be linked without crossing the Thirsting Blade chain. | Rejected.            |

**Greatblade and Sword and Board** (the G3 Reaver report's observation): 6 steps apart, no link between them proposed or
wanted. Different partners (two-handed damage with crit multiplier; block with a shield), which no one build stacks.

### 2.5 Mystic–Shade: 7 → 7

**Today:** the Spoils road, Thick Blood, Devotion with the hex wheel, the curse crossing, the dagger caster's bridge
(Sharp Tongue), the storm road and the Rooftops road (`spire.rim.road.r5`–`knife.roofs.ridge.y1`). The largest gap (893
units) is between the storm road and the Rooftops road: Pain Conduit's spur, Pinpoint, Bad Company and Black Powder.

**Bad Company** (the G3 Mystic report's question 2). Its ring hangs inside the corner `r5`–`ridge.y1`–Black Powder, so
every clean link out of it lands on that corner (Bad Company to Black Powder is 5 steps today).

- `badCompany.b`–`ridge.y1` (243 units): Bad Company 2 steps nearer every start; a triangle on the existing crossing,
  not a second direction. Used by no build except the summoner at 160, as a re-route.
- Bad Company–Black Powder, notable to notable (151 units, no room for a node): Bad Company 25 → 21 from the Mystic and
  23 → 19 from the Shade, by the storm road and Black Powder. Used by no plan of summoner, curser, trap-mine,
  dagger-caster, caster-es or wand-attack at any budget.

Rejected: it stays a far tip (§13.5), as the round-3 agent built it. Minions with curses is a real pairing, but no build
reaches for it across this corner.

| other candidate                                                                | measured                                                                                                                                                           | verdict                                         |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Pinpoint – Black Powder's small (486 units)                                    | wand-attack takes it at 120 to reach its own Pinpoint through a Shade chain; its choice falls 5 → 3 and its tax rises 36% → 40%. No Shade build uses it.           | Rejected: a Mystic shortcut, not a combination. |
| Overcharge – Black Powder's small (733 units; G2's runner-up, lightning mines) | Nothing for the Mystic; three far Mystic notables 2 steps nearer the Shade start. Sapper (mines against the shocked) is in the hex wheel, not here.                | Rejected, as in G2.                             |
| Arcane Focus – Quiet Knife (12 steps, 872 units)                               | The detour most casters show (caster-es, caster-life, fire-burn, staff-block, dagger-caster, channeller, curser): a spell pair three steps cheaper near two homes. | Rejected, as G1 did.                            |
| the two homes (Sharp Mind, the ring roads)                                     | About 20 to 50 notables 2 or more steps nearer one start or the other.                                                                                             | Rejected (§6).                                  |

### 2.6 Mystic–Zealot: 6 → 6

**Today:** Hymn, Draught, the crypt road, Familiars and Living Verse (both on `cathedral.crypt.toSpire.b`) and the far
loop (`spire.fire.rim.c`–`cathedral.walk.road.n6`). Its middle is held by two keystone spurs (Living Ward, Mind Bulwark).
The allocator shows the Zealot's casters already living in the Mystic: fire-burn takes 14 Mystic notables at 120,
staff-block 12, block-caster 16, storm-caster 16. The briefs' reason to keep this border short still holds.

| candidate                                                                    | measured                                                                                                                                                                                       | verdict                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Cinder – Plainsong's small (355 units; channelled fire, round 3's Plainsong) | Cinder to Plainsong 5 → 2, Cinder to Shattering Rite 8 → 3. fire-burn uses it from 100: fire 20.5 → 28.5 units at 120 for life 36.8 → 30.8, choice 7 → 9; channeller and caster-life from 120. | Rejected: it pulls three wanted notables into one corner by the far loop (§5.5), 400 units from the far loop's crossing. |
| Homily – Living Verse (8 steps, 873 units)                                   | The detour eight caster archetypes show, Zealot and Mystic alike.                                                                                                                              | Rejected: a cheap spell pair across the busiest border.                                                                  |
| the homes (Still Mind, the ring roads)                                       | About 20 to 50 notables 2 or more steps nearer one start or the other.                                                                                                                         | Rejected (§6).                                                                                                           |
| High Veil / Cold Light toward the Zealot's north walk                        | Nothing on the Zealot side within reach that is not the far loop's road; High Veil keeps one way in by the round-3 decision.                                                                   | None to measure.                                                                                                         |

## 3. The candidates the G3 reports raised, one line each

| raised by                 | candidate                                        | verdict                                                                                      |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Vanguard r3 §10.3         | Graven Posts facing Idle Hands                   | Written, measured, taken out (§2.3): the totem kit 20 points sooner, choice at 120 6 → 4.    |
| Mystic r3 §10.2           | Bad Company as a bridge                          | No (§2.5): every link lands on its own corner; no build uses one.                            |
| Strider r3 §9             | the trap fork for the Shade's trapper            | Geography (§2.2): best link 21 → 17 at 890 units, unused by trap-mine. A G4 item.            |
| Reaver r2 §10.1, r3 §10.2 | Footwork, 7 from the Strider start               | Not a link (§2.1); numbers for the user (§6).                                                |
| Reaver r2 §10.4, r3 §10.2 | Greatblade 6 from Sword and Board                | No link; different partners (§2.4).                                                          |
| the brief                 | the Strider's south road, the Zealot's west edge | The south: Festering–`j8` unused before 160 (§2.1). The west: internal, out of scope (§2.3). |

## 4. Checks

- **Source:** no file in `src/` or `scripts/` changed (the one trial link in `cathedral/rods.ts` was reverted;
  `git status` is clean there). `ids.json`, `baked.ts`, `edits.json`, `index.ts`, `lines.ts` untouched; no register, bake,
  commit or stash.
- **Geometry** (`geometry.ts --bends`, whole tree): crossings 0, drawn over 0, bends over 20° 83 (as before).
- `npx tsc --noEmit`: clean. `buildAll` problems: 0.
- **Allocator:** the full baseline (all 27 archetypes) before the search; the trials above against subsets of it, each
  run with the same deterministic search. No simulation was run.

## 5. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** No link added for a count. Each rejection is a trade-off the link would have removed
  (choice collapsing, a cheap pair) or a link no build would take.
- **§2 The reference.** Compared with its 10 to 13 per pair and 4.4% of links: we are at 6 to 9 and 2.7% (3.4% with the
  ring). Nothing copied, nothing named.
- **§3 A network.** §3.7 decided every candidate: each was weighed for its combination; the ones with no combination or
  no taker were not laid. §3.5 and §3.6: Bad Company and Festering stay dead ends (a far tip, and a pocket on a road with
  several ways in).
- **§4 Regions.** Untouched.
- **§5 Specializations.** §5.5 decided Festering–Fouled Tips, Cinder–Plainsong, rung–Tripwire and the home pairs; §5.1
  and §5.2 the poison and two-hander twins.
- **§6 Starts.** Every home-to-home candidate rejected for bringing a neighbour's notables 3 to 5 steps nearer a start.
- **§7 Roads and attributes.** The one crossing node written (strength and intelligence, both regions' attributes) was
  removed with its link.
- **§8, §10 Clusters and vocabulary.** No node or line changed.
- **§9 Keystones.** No spur became a through-route (Idle Hands, Crimson Pact, Living Ward, Mind Bulwark checked).
- **§11 Looks.** No change; the trial link was clean (0 crossings, a T at both ends, a straight node).
- **§12 Size.** No node added. No simulation.
- **§13 Tensions.** §13.1 (connections against trade-offs) decided every case; the allocator's choice and the per-stat
  numbers are given for each.
- **§14 Rejected ideas.** The scripts listed and measured options; every judgement was by hand from what a build would
  do. No step-count reach (steps here are path costs). No spacing rule.
- **§15 How the work is done.** Read first: CONSTRAINTS, G-growth §0 to §3, G2/borders, G1-brief §2, the G3 reports'
  border notes, G3/r3/builds.txt, PHILOSOPHY. Pictures with explicit paths in `G3/borders/`. **Intent:** nothing here
  felt like losing intent. The one thing said out loud is that a second empty-handed search means the shortfall is in
  the regions' growth, not in the search (§0, §6).

## 6. For the user

1. **No extra crossing was laid on any border** (§0). Every candidate, including the five the G3 reports raised, was
   measured; all but one failed on a constraint, with numbers above, and the one borderline link is below. Laying one for the count would be a link at random.
2. **The meta-level issue (§15.4):** the regions grew inward and outward, and their seams were left as "keep apart" zones.
   To reach the reference's 10 to 13, crossings have to be designed with the growth: a cluster on the seam whose partner
   is the crossing's combination. The places where that could go, by the largest gaps (§1):
   - **Reaver–Strider, the Pits' east to Stormstruck** (1,008 units): a cluster between Festering and Pitch Arrows whose
     partner is neither poison nor fire, so it bridges the two without making the poison corner.
   - **Mystic–Zealot, the crypt road to the far loop** (918 units), above the two keystone spurs.
   - **Mystic–Shade, the storm road to the Rooftops** (893 units): around Pinpoint and Black Powder.
   - **Strider–Shade, the Hardy Stock rung to the rim highway** (876 units): with the trap fork question (a Shade trap
     cluster on its east rim, or the fork moved), so the Shade's trapper has a late direction.
   - **Zealot–Vanguard, Scar Tissue to Stagger** (796 units): Idle Hands and Graven Posts are already a totem corner
     reachable from both; a totem archetype in the set would let the measure judge it.

   Should G4 brief these as seam clusters, or is the current 6 to 9 per border the answer?

   **The one borderline link, for your call:** Festering to Pitch Arrows (§2.1). It would be Reaver–Strider's eighth link
   at a seventh place and make Festering a bridge. The poison claw's 120-point plan turns south for it (poison +41%,
   trading the east rim's evasion and dodge); nobody else takes it before 140 points. Lay it if a poison corner three
   steps wide with a fire notable in the middle reads as a fair price to you; leave it if the poison clusters should stay
   about five apart.

3. **Footwork** (§2.1): 7 steps from the Strider start, in the 60-point plans of all three bow builds, dagger-crit and
   claw-poison, four of them with a single plan at 60. Keep it as the Reaver cluster the Strider buys into, or move it
   off the Ford corridor (G4)?
4. **The archetype set has no totem build outside the Vanguard.** Idle Hands' own reason names "the totem Vanguard and
   the summoner Zealot"; the probe here suggests a Zealot spell totem build reaches its whole totem kit by 80 points
   today. Worth an archetype?
