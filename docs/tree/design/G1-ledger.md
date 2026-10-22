# G1a. The specialization ledger

Written 2026-10-22 for phase G1a of [G-growth.md](G-growth.md), from the G0 supply map ([G0/supply.md](G0/supply.md)),
the baseline ([G0-baseline.md](G0-baseline.md)) and the builds report ([G0/builds.txt](G0/builds.txt)). It decides, for
the whole map at once, how many clusters each specialization and each generic want gets, in which region, with which
partner, how far from its twins, and which existing clusters move, change lines or change partner. The G1b region
briefs place what this ledger assigns them. They may move a cluster a few steps or swap two of the same region when the
picture demands it, but a cluster's **partner** and its **region** are this ledger's to change. A brief that wants a
different partner or region says so to the joining agent.

[CONSTRAINTS.md](CONSTRAINTS.md) wins over this document wherever they disagree. No node is placed here. The numbers
below say where to look, and every cluster has a player's reason.

## 0. The user's guidance this ledger answers

**The user's answers to §9 (2026-10-22), which override the ledger where they differ:**

- **Size:** start at about 1,480, and add more only where the measures show a build still takes everything. Every
  agent may also add nodes wherever another constraint needs them (CONSTRAINTS §12.1).
- **Small sections:** "almost all small nodes should have associated notables, but it's not a hard rule" (CONSTRAINTS
  §8.7). The 30 sections of §3.2 are therefore not to be built as notable-less pockets by default. Each region brief
  folds a section's supply into a notable cluster (a new one, or more smalls on one of the ledger's) and keeps a
  notable-less run only where another constraint needs it, saying which.
- **Unit sizes:** a small node is 5% attack speed, 15% crit, 10% evasion (CONSTRAINTS §8.1). Every such line in the
  network was re-priced to keep its worth in units, so the ledger's unit counts still hold.
- **Changes to the user's nodes** (§9 item 4): already covered by "feel free to move, remove, or otherwise modify
  existing clusters". First Light stays as the Mystic start's signature; the ring's inside holds only the four arches.

- The ask (2026-10-22): grow the network to about 1,500 to 2,000 nodes, so that a build cannot reach every node it
  wants. "All the spell damage and energy shield for a classic caster build, all hp, armor, and sword damage for a
  strength sword build." The way there is more desirable nodes, not more distance.
- **Tension is one constraint among many** (the user, 2026-10-22): "this is not at the expense of all the other goals in
  the constraints doc. This is one more of many, many constraints that all must be fulfilled." Every decision below still
  answers to starts that do not commit a build, varied defences in every region, a wide vocabulary, regions with a vibe
  and no theme, roads that carry clusters, crossings with intent, and the looks. Where tension would cost one of those,
  §8 says so and says which way the ledger leaned.
- **Existing clusters are not fixed** (the user, 2026-10-22): "feel free to move, remove, or otherwise modify existing
  clusters as you balance the added clusters." Every move, re-line and change of partner is a row of its own (§3.3) and
  is counted in the tally (§6).
- No deference to the Strider (CONSTRAINTS §15.9). The archetypes are a yardstick and never the design basis (§14). Power
  is measured one stat or one pair at a time, never as one number (G-growth §0).

## 1. The principles applied

Each is a CONSTRAINTS item applied to the whole map. None is new.

1. **A build must give something up to get something** (§1.1). For each main want of a build, the network supplies
   several times what one build can afford, in several directions from its start. Wanting it all is then a real
   plan-against-plan choice, not a walk to the one place that has it.
2. **Two or three clusters per specialization, apart, each with a different partner** (§5.1). Picking the cluster is
   picking the partner. Two copies of one pairing that a build would see as the same thing are not a choice. For
   **generic** stats (life, energy shield, armour, evasion, spell damage, attack speed, crit, resistances, mana, leech),
   §5.3 applies: they are spread as lines on many notables and as small sections in every region they belong to, never
   one destination. For generics, the same partner may recur in a far region that serves a different start; the
   different-partner rule applies to clusters one build can reach.
3. **Twins at least about five steps apart** (§5.2). Every new cluster's row names its nearest twin and the distance
   the brief must keep.
4. **Concentration is chosen per specialization** (§5.3), and each entry in §4 says which: **concentrated** (one
   region's identity, twins still apart), **home and a neighbour**, **split** between two regions, or **wide**.
5. **Weapons sit where their attributes are supplied** (§5.4). Each new weapon cluster sits in a region that supplies
   at least one of its attributes, usually beside the border with the other one.
6. **Neighbours compete** (§5.5). **The convergence rule** follows from it and from the user's two examples. A notable
   that gives a build two of the main wants the user named at once hands over both for one path. The pairs are spell
   damage with energy shield, and life with armour, where sword damage with either counts too. So these pairs do not
   share a cluster near a home or along a home's main road. Such hybrids stay rare and far out, where they are a
   destination worth a detour, not a convenience. The rule covers only these pairs. A weapon or an element paired with
   a defence ("staff damage and block", cold with a shield, sceptre with armour) is the good kind of pair §10.2 names,
   and it is placed as a partner, not forbidden. The second and third clusters of a want go in a **different
   direction** from the start than the first, with a different partner.
7. **Tension from wanted nodes, not distance** (agreed target 5; G-growth §4). A far cluster counts only if a
   120-point build could reach it with about 40 more points. Every new road carries clusters along its length (§7.3),
   and the cheapest new supply is uniform small sections (item 10), not new road.
8. **Crossings with intent** (§3.7). Each border goes from 4 to 6 links today toward the reference's 10 to 13. Every
   new crossing in §7 is named for the cross-region combination it serves.
9. **No build-named areas, varied defences, every region sells what most builds want in its own voice** (§4.2, §4.5,
   §4.6). New roads get place names in G3. Every region's tally (§6) is checked for life, resistances, its own defence
   and two or more of the others.
10. **Uniform smalls, notables of 3 to 5 units** (§8.1, §8.2, §8.6). Every new notable is priced at 3 to 5 units, and
    every small in a section carries the same line. Generic supply grows partly through **small sections**: pockets of
    three identical smalls of one main stat, hung as bridges between two clusters or two roads (§3.6, most pockets are
    bridges). They are wanted nodes at one unit a point. They are what 40 more points buy, and they add little to a
    best plan, which prefers notables.
11. **A wide vocabulary, one theme per cluster, only live lines** (§10.1 to §10.3). Every pairing below belongs together
    in a build and uses only lines in `lines.ts` today, so no engine work is needed. Where a pairing reads like two
    themes, its row says why a build wants both.
12. **Size is an outcome** (§12.1). The total in §6 is what these decisions add up to. It is not a target, and §9 asks
    the user whether it is enough.

## 2. Diagnosis: which main stats are flat, and why

From the baseline at 120 points. "+40" is what 40 more points add to the stat. A stat is flat when +40 adds 10% or
less of what the build has.

| main stat                          | builds where it is flat (units at 120 → 160)                                                                                                                                    | supply in the whole network                                                                       | why                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| spell damage (plain)               | caster-es 21 → 23, dagger-caster 23 → 23, caster-life 20 → 22, channeller 17 → 19, storm 18 → 19, block-caster 14 → 15, fire-burn 16 → 16, staff-block 23 → 25 (9%)             | about 25 units: **7 small nodes of spell damage in the whole network, one of them in the Mystic** | Small supply. Every caster lands on the same dozen notables. The Mystic's spell damage is mostly element lines.                            |
| energy shield                      | summoner 39 → 40, wand 26 → 26, curser 32 → 32, dagger-caster 33 → 37, channeller 31 → 34, trap 26 → 28                                                                         | 57 units, 31 in the Mystic; 13 ES smalls                                                          | One home. The Cloister's three ES notables are 3 steps apart, a one-stop.                                                                  |
| armour                             | sword 20 → 21, mace-slam 21 → 22, sceptre-fire 26 → 26, two-hand-fire 21 → 25                                                                                                   | 35 units, 23 in the Vanguard; 11 armour smalls                                                    | The Rampart holds Mortar and Stone, Thick Skin and five armour smalls beside Stone Heart and Second Wind: strength's defence in one place. |
| evasion                            | dual-wield 27 → 27, trap 25 → 26, dodge 29 → 29, dagger-crit 28 → 31                                                                                                            | 35 units (Strider 16, Shade 11, Reaver 7.5)                                                       | Small supply. Six builds take 298 to 350%, nearly all of it.                                                                               |
| a weapon's own lines               | wand 8 → 8, dagger 7 → 7, mace 14 → 14, claw 4 → 8, sword 29 → 32, two-handed 6 → 10                                                                                            | each weapon 21 units or fewer; sword-specific 15                                                  | Two or three clusters per weapon and few smalls. A build that wants the weapon takes all of it by 100 points.                              |
| specializations a build can finish | minions 22 → 22, dual wield 18 → 18, auras 19 → 19, block (staff) 4 → 4, spell block 6 → 6, spell crit 7 → 7 and 9 → 9, chaos and dot 12 → 12, totems 9 → 9, cast speed 12 → 14 | 7 to 26 units each                                                                                | Single homes or close twins: sceptre, staff, brands, claws, mines, fervour, insight, area. Channelling's two notables are 45 steps apart.  |

What already climbs, and so already makes builds choose: **life** (97 units, spread over every region), the elements
spread across the map (cold for the classic caster, fire for burn and sceptre builds, lightning for the storm caster),
crit for the bow, axes, curses, dodge and block for the block caster. The ledger leaves these alone, or grows them only
in step with the rest.

The pattern is one diagnosis. **A generic main stat has too few small nodes and too few notables, and they sit together
near a home.** A 60-point build reaches most of them and a 120-point build has all of them. The fix is more of each,
with different partners, in different directions, plus the moves that break today's one-stops. A longer walk to the
same few nodes is not a fix.

**A note on units.** The tools price by `UNIT` in `lines.ts` (3% attack speed, 20% crit, 12% evasion); §8.1 says 5%,
15% and 10%. CONSTRAINTS §16 already leaves this to the user. This ledger uses the tools' units, so "a unit" of attack
speed here is 3%.

## 3. The master list

Every new cluster, small section, move and re-line has one row and one id. The specialization entries in §4 refer to
these ids, so nothing is counted twice. **Lead** is the cluster's main family: its smalls carry it, and the notable
carries most of it. **Partner** is what the notable pairs it with. "Twin ≥ n" is the least number of steps the brief must
keep from that cluster.

A standard cluster is a notable of about 4 units (3 to 5) and three smalls of the lead (3 units): about 4 nodes and
7 units, of which about 5.5 are the lead's. The **where** column names an area or an empty patch of
[G0/empty.png](G0/empty.png). The brief chooses the exact spot.

### 3.1 New notable clusters

#### Mystic (the Spire): 10

The Mystic is the densest region (179 empty cells inside, 77 at the rim). Its new clusters fill the Column's west
patch, a new west road toward the Zealot, the Gallery's side toward the Shade, and a **new north rim road** over the
Belfry, which enlarges the map at the top (§11.3 allows it; §8 item 3).

| id    | lead + partner                              | where                                                                            | twins (least steps)                              | for players                                                                                                                                                             |
| ----- | ------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MY-1  | spell damage + spell crit multiplier        | the Gallery road (north-east), beside the Fever Pitch spur                       | Sharp Mind ≥ 8, Flashpoint ≥ 5, Arcane Focus ≥ 6 | The crit caster's spell damage. Next to Fever Pitch, whose crit multiplier is fixed at 100%, it is a fork: the multiplier or the keystone.                              |
| MY-2  | spell damage + life                         | a new west road from the Cloister toward the Lantern and the Zealot's Undercroft | Arcane Focus ≥ 8, MY-1 ≥ 10                      | Spell damage for the caster on life, reachable from the Zealot's life casters too. It sits west, away from the east's crit.                                             |
| MY-3  | spell damage + mana regeneration            | the new north rim road, at the end of a cast speed section (MY-s5)               | Broad Weave ≥ 5, MY-1 ≥ 6                        | The far spell cluster for sustained casters (the channeller too). It costs a road, but the road is cast speed.                                                          |
| MY-4  | energy shield + all elemental resistances   | the north rim road, its other end                                                | Siphon (moved) ≥ 5, Glass Skin ≥ 10, MY-3 ≥ 6    | The far ES cluster. Paired with resistances, not with offence, so going north for both MY-3 and MY-4 costs a whole road.                                                |
| MY-5  | wand attack + elemental damage with attacks | the Lantern side (north-west), toward the Zealot's elemental attackers           | Deft Wand ≥ 6, Wand Volley ≥ 12                  | Wand attacks are a build the user named (§5.7); today all three wand-attack clusters are taken by 60 points. This one is the elemental wand.                            |
| MY-6  | wand attack + crit multiplier with wands    | the Gallery side (north-east)                                                    | Wand Volley ≥ 5, MY-5 ≥ 12                       | The crit wand, in the same direction as the crit caster: east is the crit side of the Mystic.                                                                           |
| MY-7  | minion damage + curse effect                | between the Lantern and the Belfry                                               | Familiars ≥ 5, Hexwright ≥ 8                     | The hexing summoner. Summoner minions are flat at 22 units today.                                                                                                       |
| MY-8  | energy shield + avoid stun                  | the empty patch inside the Column's west side                                    | Glass Skin ≥ 5, Quickening (moved) ≥ 5           | ES for casters who get stunned out of their casts. It replaces the Cloister one-stop with a second ES place.                                                            |
| MY-9  | life + mana                                 | between the Scriptorium and the Gallery                                          | Warm Blood ≥ 6, Quiet Pulse ≥ 8                  | The Mystic's life is thin (9.9 units); this is the life caster's bigger pool. It sits on the east side, so that west and east each offer life with a different partner. |
| MY-10 | spell damage with a dagger + cast speed     | the Gallery–Stair border, a near bridge to the Shade                             | Ritual Blade ≥ 6, Athame ≥ 6, Quiet Knife ≥ 6    | The dagger caster's third spell cluster, and the Mystic's reason for a Shade crossing. A wand caster walks past it.                                                     |

#### Zealot (the Cathedral): 11

The Zealot has 234 empty cells inside, mostly between the Undercroft and the Choir, the Vestry, and the Ambulatory's
west. Everything fits inside, plus one rim stretch for ZE-9 and ZE-11.

| id    | lead + partner                                           | where                                                                       | twins (least steps)                           | for players                                                                                                                         |
| ----- | -------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ZE-1  | spell damage + reduced mana reservation                  | the empty inside between the Choir and the Undercroft                       | Homily ≥ 5, Choirmaster ≥ 5                   | The aura caster's spell damage. The Lone Vow spur in the Choir makes reservation moot, so near it this is a fork.                   |
| ZE-2  | minion damage + life                                     | the Undercroft's west empty, near Volatile Servants                         | Shepherd ≥ 5, Ossuary ≥ 6                     | The summoner on life (Ossuary is the summoner on ES).                                                                               |
| ZE-3  | damage with channelling + elemental damage               | the Undercroft's north rim, facing the Mystic's Lantern (a crossing)        | Steady Stream ≥ 8, Ceaseless Blades far       | Closes the 45-step gap between channelling's two notables (§16). Channelled spells are mostly elemental.                            |
| ZE-4  | cold damage + block with a shield (chill on the notable) | the Nave–Vestry side, among the shield casters                              | Hoarfrost ≥ 12, Rimed Steel ≥ 5               | §5.1's own example: "cold with a shield here and cold with freeze there". It is cold's first home outside the Mystic and the Shade. |
| ZE-5  | sceptre damage + armour                                  | the Narthex–Nave edge toward the Vanguard's Battlements, ≥ 4 from the start | Gilded Rod ≥ 5, Hallowed Hammer (moved) ≥ 5   | The armoured sceptre fighter. Sceptre has a single home today (§16).                                                                |
| ZE-6  | sceptre damage + burning (ignite chance, burn damage)    | Bell Tower to Ambulatory, beside Searing Avatar                             | Gilded Rod ≥ 5, Kindled Steel ≥ 5, Censer ≥ 5 | The fire sceptre's burn, near the keystone that makes everything fire.                                                              |
| ZE-7  | staff damage + spell block                               | the Vestry's west, toward the Vanguard                                      | Quarterstaff ≥ 5, Crozier ≥ 6                 | "Staff damage and block" is §10.2's own example of a good pair. The staff blocker's block is 4 units today, flat.                   |
| ZE-8  | aura effect + life                                       | Bell Tower to Choir, near Living Ward                                       | Benediction ≥ 5, Choirmaster ≥ 5              | Auras for the life-based support build. Living Ward (maximum life 1) beside it is a fork.                                           |
| ZE-9  | spell damage + skill effect duration                     | the Ambulatory's north rim (outer road)                                     | Homily ≥ 6, ZE-1 ≥ 6, Crozier ≥ 5             | The Zealot's far spell cluster, for duration spells, brands and totems that cast.                                                   |
| ZE-10 | energy shield + life                                     | the Undercroft–Nave empty inside                                            | Vigil ≥ 5, Warm Blood far                     | The hybrid caster's defence (the fire-burn caster wants both). It is ES-led; Warm Blood in the Mystic is life-led.                  |
| ZE-11 | energy shield + spell block (no shield needed)           | the Ambulatory's north / Undercroft rim                                     | Glass Wall ≥ 5, ZE-7 ≥ 5                      | The block caster's ES (Glass Wall needs a shield). A Mystic caster's west-and-far direction.                                        |

#### Shade (the Knife): 16

The Shade has the most room inside (304 empty cells: the Rooftops–Rookery band, the Stair–Rookery gap, Alleys–Docks)
and was the thinnest region (28 notables). Most of its specializations are its own identity: daggers, claws, poison,
dodge and the curser. Everything fits inside.

| id    | lead + partner                                       | where                                                                | twins (least steps)                                 | for players                                                                                                           |
| ----- | ---------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| SH-1  | energy shield + chance to dodge spells               | the Stair, beside the Spellslip spur                                 | Shroud ≥ 6, Mist Walk ≥ 8                           | Spellslip costs 30% ES, so ES beside it is a fork: ES or the keystone.                                                |
| SH-2  | spell damage + damage against cursed enemies         | the Rookery's inner empty                                            | Rotting Word ≥ 5, Second Curse ≥ 5, Quiet Knife ≥ 6 | The curser's spell damage (the curser is flat on chaos and dot today).                                                |
| SH-3  | spell crit + insight charges                         | the Stair's north, toward the Scriptorium (a crossing)               | Athame ≥ 6, Flashes of Insight ≥ 8                  | Insight's second home (§16) and a fourth spell crit cluster. Insight comes on crit, so the pair belongs.              |
| SH-4  | dagger damage + poison                               | the Alleys–Rookery gap                                               | Fine Point ≥ 5, Long Knives ≥ 6, Barbed Point ≥ 5   | The poison dagger. The dagger attacker is flat at 7 units today.                                                      |
| SH-5  | claw damage + crit chance with claws                 | the Docks                                                            | Talon ≥ 5, Carrion Claws ≥ 8                        | The crit claw. Claws have 7.6 units today.                                                                            |
| SH-6  | claw damage + attack speed with claws                | the Shade–Strider border, Docks south / Hedgerows north (a crossing) | Talon ≥ 5, SH-5 ≥ 5                                 | The fast claw, where dexterity from the Strider meets intelligence from the Shade (§5.4).                             |
| SH-7  | poison + attack speed (poisons faster on the smalls) | the Rooftops' outer road                                             | Barbed Point ≥ 6, SH-4 ≥ 5, Festering far           | The poison specialist's pure cluster, far from the poison dagger.                                                     |
| SH-8  | curse effect + chaos damage over time multiplier     | the Rookery–Stair empty                                              | Second Curse ≥ 5, Hexwright ≥ 8, Withering ≥ 8      | The curser's home curse cluster. Curses and chaos over time belong together.                                          |
| SH-9  | dual wield + chance to dodge attacks                 | the Alleys, near Nimble Gambit                                       | Fine Point ≥ 5, Twin Fangs far, Two Fists far       | The Shade starts with two knives; dual wield had no Shade cluster. Nimble Gambit (dodge) beside it is a natural pull. |
| SH-10 | chance to dodge attacks + life                       | the Docks                                                            | Tumble ≥ 5, Soft Step ≥ 5, Sidestep far             | The dodger's life (the dodge build's life is flat at 30 → 31).                                                        |
| SH-11 | spell damage + cast speed                            | the Rooftops–Stair north                                             | Rotting Word ≥ 5, SH-2 ≥ 6, Arcane Focus ≥ 10       | The Shade's quick caster. Arcane Focus has this pairing in the Mystic, far away, for a different start.               |
| SH-12 | cold damage with attacks + crit chance               | the Rooftops' east                                                   | Sleet ≥ 5, Rimed Steel far                          | Cold attacks have one cluster today. This one is for daggers, claws and bows.                                         |
| SH-13 | energy shield + mana                                 | Knife Gate to Stair, ≥ 4 from the start                              | Shroud ≥ 5, SH-1 ≥ 5, Glass Skin far                | The Shade's int side sells ES in its own voice.                                                                       |
| SH-14 | evasion + energy shield                              | the Rookery–Docks                                                    | Keen Instinct ≥ 5, Veiled Herald ≥ 5                | Hybrid gear's defence. It takes this pairing over from Shroud (re-lined, SH-r1).                                      |
| SH-15 | life + evasion                                       | Alleys to Docks south, toward the Strider                            | Thick Blood ≥ 5, Hard Target far                    | The Shade's life is the thinnest of any region (6 units). §4.5: varied defences.                                      |
| SH-16 | dagger damage + crit multiplier with daggers         | the Rooftops' north ridge                                            | Fine Point ≥ 5, Long Knives ≥ 5, SH-4 ≥ 5           | The crit dagger. It is a third dagger-attack cluster with a different partner.                                        |

#### Strider (the Bow): 8 (one of them a wheel with two notables)

The Strider is compact (90 empty cells inside) with its room on the south-east rim (553 cells). It gets a **new outer
road** along the south-east rim, from the Docks' south to the Fosse. That road is a rim highway joining the Shade and
the Reaver, with ST-1 to ST-4 and two small sections hanging from it.

| id   | lead + partner                                 | where                                                           | twins (least steps)                                        | for players                                                                                                |
| ---- | ---------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| ST-1 | bow damage + crit chance with bows             | the new outer road                                              | Longbow ≥ 8, Rapid Fire ≥ 6, Vital Aim ≥ 6, Quiet Shot far | The crit bow's bow damage. The physical bow is flat at 30 → 32 units today.                                |
| ST-2 | bow damage + elemental damage with attacks     | the outer road, its other end                                   | ST-1 ≥ 6, Elemental Fletching ≥ 6, Iron Draw ≥ 8           | The elemental bow. Going one way along the road is a choice of partner.                                    |
| ST-3 | evasion + life regeneration                    | the outer road, middle                                          | Hard Target ≥ 5, Wayfarer ≥ 5                              | Recovery for the evasive archer.                                                                           |
| ST-4 | lightning damage with attacks + shock          | where the outer road meets the Fosse (a crossing to the Reaver) | Stormstruck ≥ 6                                            | Lightning attacks have one cluster today. This one carries shock; Stormstruck carries attack speed.        |
| ST-5 | fervour charges + attack speed                 | the High Moor / Meadow inside                                   | Hot Blood ≥ 8                                              | Fervour's second home (§16). Dexterity builds want the speed.                                              |
| ST-6 | a wheel: traps on one side, mines on the other | the Hedgerows' north, toward the Shade                          | Tripwire ≥ 5, Trapper ≥ 6, Sapper ≥ 6, Black Powder ≥ 6    | §8.3's own example of a real fork: trap and mine supports exclude each other. It gives mines a third home. |
| ST-7 | evasion + flask effect                         | Thicket to Ford, near Plated Hide                               | Quick Sip ≥ 5, ST-3 ≥ 5                                    | Evasion for a dex build, which Plated Hide turns into armour: the Ford becomes a dex route to armour.      |
| ST-8 | dual wield + evasion                           | the Ford, toward the Reaver's Lists (border)                    | Crossed Blades ≥ 5, Twin Fangs ≥ 6, SH-9 far               | Dual one-handers on dexterity (half the one-handed swords; §5.4).                                          |

#### Vanguard (the Wall): 8

The Vanguard is already the largest region (192 nodes) and has the most room left (312 empty cells), so it also holds
the spare room for a second round (§6). Everything fits inside.

| id   | lead + partner                               | where                                                 | twins (least steps)                                 | for players                                                                                          |
| ---- | -------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| VA-1 | armour + all elemental resistances           | the Battlements, toward the Zealot                    | Mortar and Stone ≥ 6, Elemental Ward ≥ 5            | Armour in a second direction (north). It is also a reason for the Zealot's armoured builds to cross. |
| VA-2 | armour + block with a shield                 | the empty between the Rampart and the Barbican (west) | Bracing ≥ 6, Mortar and Stone ≥ 5                   | The shield wall's armour, deep west.                                                                 |
| VA-3 | armour + warcry effect                       | the Barrows                                           | War Drums ≥ 5, Barrow Ward ≥ 5                      | A third armour direction (south-west), for the warcry and totem build.                               |
| VA-4 | mace damage + attack speed with maces        | the Quarry                                            | Weight of Iron ≥ 6, Crushing Blow ≥ 6               | Mace and shield is flat at 14 mace units. This is the fast mace, away from the Barbican's three.     |
| VA-5 | mace damage + life                           | between the Gate and the Rampart, ≥ 4 from the start  | Weight of Iron ≥ 6, VA-4 ≥ 6                        | The slammer's first mace cluster, kept out of the start's first three steps (§6.3).                  |
| VA-6 | fire damage with attacks + stun duration     | the Barbican's south                                  | Hallowed Hammer (moved) ≥ 6, Kindled Steel far      | The two-handed fire build is flat at 6 → 10 two-handed units. A heavy burning blow staggers.         |
| VA-7 | totem attack and cast speed + totem duration | between the Rampart and the Barrows                   | Standing Cairns ≥ 6, Sentry Post far, Reliquary far | Totem damage is flat at 9 units for the warcry and totem build.                                      |
| VA-8 | attack damage with a shield + stun duration  | between the Quarry and the Rampart                    | Shield Bash far                                     | Shield attacks' second home (§10.1 lists "shield lines").                                            |

#### Reaver (the Yard): 9

The Reaver has 147 empty cells inside, around the Practice Ground, the Lists and the Pits, and the Fosse's rim to the
south. Most new clusters fit inside. RE-3 and RE-8 use the Fosse's rim.

| id   | lead + partner                          | where                                                           | twins (least steps)                           | for players                                                                                                      |
| ---- | --------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| RE-1 | sword damage + attack speed with swords | the Lists (east), toward the Strider                            | Keen Edge ≥ 6, Fleet Blade ≥ 5                | The fast sword, east, where the Strider's attack speed is.                                                       |
| RE-2 | sword damage + block with a shield      | the seam between the Practice Ground and the Muster             | Keen Edge ≥ 5, Steel Rim ≥ 5                  | Sword and board.                                                                                                 |
| RE-3 | sword damage + life leech               | the Pits to the Fosse (south), near Crimson Pact                | RE-2 ≥ 5, Red Harvest ≥ 5                     | The bloody sword, south. Crimson Pact (instant leech) is beside it.                                              |
| RE-4 | armour + life regeneration              | the Practice Ground's west, toward the Vanguard's Quarry        | Guarded ≥ 5, Barrow Ward far                  | Armour on the west, the direction of the Vanguard's armour, so that west is the armour side.                     |
| RE-5 | warcry effect + attack speed            | between the Muster and the Yard Gate's east, ≥ 4 from the start | War Drums far, Battle Hymn far                | Warcries' third home, for the strength attacker.                                                                 |
| RE-6 | evasion + accuracy                      | the Lists' outer side                                           | Weaving ≥ 5, Sidestep ≥ 5                     | The east's defence is evasion, not armour.                                                                       |
| RE-7 | two-handed damage + life                | the Pits' west, toward the Barrows                              | Heavy Hands ≥ 6, Headsman ≥ 6, Greatblade ≥ 6 | Two-handed swords and axes are strength and dexterity (§5.4). Every two-handed cluster is in the Vanguard today. |
| RE-8 | bleed damage + bleed duration           | the Fosse rim, near Wound Dance                                 | Open Veins ≥ 5, Executioner ≥ 6               | The bleed specialist's far cluster (axe and bleed is 22 → 25 today).                                             |
| RE-9 | dual wield + life leech                 | the Pits' east                                                  | Twin Fangs ≥ 6, Crossed Blades ≥ 6            | Dual wield is flat at 18. This one is south, while the Lists' two are east.                                      |

#### The centre: 4

The ring's inside stays open. Four small arches go on the four diagonals that have none: the ring has arches at the top,
east, bottom and west today. Each is a notable of 3 units and two smalls. Each is **generic sustain or utility, never a
main stat**, because anything three or four steps from two starts is cheap for everyone and would lower tension
(§4.7, §13.8).

| id   | lead + partner                              | where                            | for players                                                                                    |
| ---- | ------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| CE-1 | avoid elemental ailments + chaos resistance | north-east (Mystic and Shade)    | Chaos resistance is the scarcest resistance (7 smalls and Warded Mind).                        |
| CE-2 | life regeneration + life on kill            | south-east (Strider and Reaver)  | The attackers' generic sustain.                                                                |
| CE-3 | avoid stun + reduced stun duration on you   | south-west (Reaver and Vanguard) | Stun protection for anyone; not armour, which would hand both strength starts their main want. |
| CE-4 | mana + reduced mana cost                    | north-west (Zealot and Mystic)   | The casters' generic resource.                                                                 |

### 3.2 New small sections

A small section is three identical smalls of one main stat with no notable, hung as a bridge between two clusters or
two roads. Each is 3 nodes and 3 units. These are the cheapest supply that is still a wanted node, and they keep the
best plan honest: a plan takes them only once the notables nearer home are gone.

| id    | stat          | where (a bridge between)                                    |
| ----- | ------------- | ----------------------------------------------------------- |
| MY-s1 | spell damage  | Broad Weave and the north rim road                          |
| MY-s2 | spell damage  | Arcane Focus and MY-1 (the east, crit side)                 |
| MY-s3 | energy shield | the Cloister and MY-8                                       |
| MY-s4 | energy shield | MY-4 and the Belfry                                         |
| MY-s5 | cast speed    | the north rim road's leg into MY-3                          |
| MY-s6 | life          | the Spire gate's west pocket and the ring toward the Zealot |
| ZE-s1 | armour        | the Narthex and the Battlements (toward the Vanguard)       |
| ZE-s2 | energy shield | the Nave and ZE-10                                          |
| ZE-s3 | spell damage  | Homily and ZE-1                                             |
| ZE-s4 | life          | the Vestry and ZE-7                                         |
| ZE-s5 | mana          | the Choir and the Mystic's Lantern side                     |
| SH-s1 | life          | the Knife Gate's pocket and the Alleys                      |
| SH-s2 | life          | the Stair and SH-13                                         |
| SH-s3 | energy shield | the Rookery and SH-14                                       |
| SH-s4 | evasion       | the Docks and SH-15                                         |
| SH-s5 | spell damage  | the Stair and SH-11                                         |
| SH-s6 | attack speed  | the Alleys and SH-9                                         |
| SH-s7 | crit chance   | the Rooftops and SH-16                                      |
| ST-s1 | evasion       | the outer road, between ST-1 and ST-3                       |
| ST-s2 | evasion       | the Meadow and the High Moor                                |
| ST-s3 | life          | the Ford and ST-8                                           |
| ST-s4 | attack speed  | the outer road, between ST-3 and ST-2                       |
| ST-s5 | crit chance   | the Thicket and ST-1                                        |
| VA-s1 | armour        | the Barbican and VA-2                                       |
| VA-s2 | armour        | the Quarry and VA-4                                         |
| VA-s3 | life          | the Battlements and VA-1                                    |
| RE-s1 | armour        | the Practice Ground and RE-4                                |
| RE-s2 | life          | the Lists and RE-6                                          |
| RE-s3 | evasion       | the Lists and RE-1                                          |
| RE-s4 | attack speed  | the Yard Gate's east and RE-5                               |

That is 30 sections, 90 smalls: life 7, energy shield 4, armour 4, evasion 4, spell damage 4, attack speed 3, crit 2,
cast speed 1, mana 1. None sits within three steps of a start (§6.3; the sections near homes carry generic stats only).

### 3.3 Moves, re-lines and re-pricing of existing clusters

The user asked for these to be marked one by one. Moves keep the notable's lines unless the row says otherwise. A
moved or re-lined notable gets a new id only if its cluster's id changes, which is G3's call. Saves are refunded once at
ship (G-growth §0), so none of these costs a player anything.

| id    | change                                                                                                                          | why                                                                                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MY-m1 | **Move Quickening** out of the Cloister to the new west road (MY-2's road), ≥ 5 from Glass Skin. Trim it from 5.3 to 5 units.   | It breaks the Cloister one-stop (Glass Skin, Quickening and Siphon are 3 steps apart; supply.md flags it). ES with a fast recharge start now lies west-north-west.                                                                                      |
| MY-m2 | **Move Siphon** from the Cloister to the Belfry (north), beside the lightning and cold clusters.                                | ES on hit belongs where the casters who hit often go. The Cloister keeps Glass Skin as its one ES notable, with Deep Well's mana: "ES with mana" beside Mind Bulwark.                                                                                   |
| MY-p1 | Trim **Warded Mind** from 5.3 to 5 units.                                                                                       | §8.6 (G5 does the pricing; listed here so it is not lost).                                                                                                                                                                                              |
| ZE-p1 | Raise **Shattering Rite** from 2.9 to at least 3 units.                                                                         | §8.6.                                                                                                                                                                                                                                                   |
| SH-r1 | **Re-line Shroud**: energy shield + avoid stun + ES recharge rate; drop its evasion line.                                       | SH-14 takes the evasion with ES pairing. Shroud sits beside Shade Leech, whose cost is a slower recharge, so recharge there is a fork.                                                                                                                  |
| SH-p1 | Raise **Whetted Will** from 2.7 to at least 3 units.                                                                            | §8.6.                                                                                                                                                                                                                                                   |
| ST-r1 | **Re-line Round Shield** to one theme: block with a shield + avoid stun with a shield. Drop the mana regeneration and the area. | It carries three themes today (mana regeneration, area, shield defences; §10.2). The name still fits. The dex shield's one Strider notable stays.                                                                                                       |
| ST-p1 | Raise **Weathered** from 2.5 to at least 3 units (more resistance, or a little life).                                           | §8.6.                                                                                                                                                                                                                                                   |
| ST-p2 | Trim **Longbow** and **Far Flight** from 5.3 to 5 units.                                                                        | §8.6.                                                                                                                                                                                                                                                   |
| VA-m1 | **Move Cleaver** from the Barbican's west tower to the Quarry's south-east, toward the Practice Ground, ≥ 6 from Hewing.        | §16 names it as the one weapon cluster that sits poorly: an axe build there gets strength but no dexterity. Beside the Yard it gets both.                                                                                                               |
| VA-m2 | **Move Hallowed Hammer** from the Barbican to the Battlements (north), beside the Zealot border.                                | The Barbican's three maces are 6 to 8 steps apart in one area, a mace one-stop. Hallowed Hammer is mace and sceptre with elemental attacks; beside the Zealot it serves the sceptre too (§5.4), ≥ 5 from ZE-5.                                          |
| VA-m3 | **Move Second Wind** (life + regeneration) out of the Rampart to the Barrows / Quarry side, ≥ 5 from Barrow Ward.               | The Rampart holds Mortar and Stone, Thick Skin, Stone Heart, Second Wind and five armour smalls: strength's life and armour in one place, 14 to 16 steps from both strength starts. Without Second Wind it is armour and stun, with Stone Heart's life. |
| RE-r1 | **Re-line Scarred Hide**: life + life gained on block; drop its armour and physical damage reduction.                           | It is 8 steps from the Reaver start on the main road south and gives life and armour together: the convergence the user's sword example names. Broad Back (Barbican, 21 steps) stays as the far life and armour hybrid.                                 |

**Close twins in supply.md that stay as they are**, judged by partner rather than distance:

- **Athame and Long Knives (2 steps).** They are a wheel's two sides, the dagger caster and the dagger attacker, a real
  §8.3 choice.
- **Broad Weave and Darting Bolts (4).** Spell area or spell projectiles: a spell is one or the other.
- **Stone Heart and Second Wind (4).** Fixed by VA-m3.
- **Keen Instinct and Soft Step (4).** Crit or movement and dodge, at the Shade's home.
- **The Meadow's True Aim, Quick Hands and Hawk's Eye (2 to 4).** Attack speed is generic, the pairs were re-partnered
  in round 4 with the user, and each now leads somewhere different.
- **Reliquary and Runecarver (2).** Totems or brands, a wheel's sides.
- **The High Moor's mana flags.** These came from Round Shield's mana line, which ST-r1 removes.

**No removals.** Every problem found is solved by a move or a re-line. A region brief may still propose removing a
notable nobody would take.

## 4. The ledger by specialization

For each: today's clusters (region, partner) and what the baseline says; the decision on concentration and why for
players; what is added and changed (ids from §3); rough supply after, in units. "Units" are summed over clusters
whose lead or partner is the family. Rough supply today is from supply.md.

### 4.1 Defences

| want                    | today                                                                                                                          | decision                                                                                                                                              | added and changed                                                                                                                                 | supply today → after |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **life**                | 15 notables in every region; 35 smalls. It already climbs for most builds; the Shade (6 units) and the Mystic (9.9) are thin.  | **Wide** (§5.3). It grows with the network, mostly as lines and sections, and most where it is thin.                                                  | SH-15, MY-9; partner on MY-2, ZE-2, ZE-8, ZE-10, SH-10, VA-5, RE-7, CE-2; sections MY-s6, ZE-s4, SH-s1, SH-s2, ST-s3, VA-s3, RE-s2; VA-m3, RE-r1. | 97 → about 140       |
| **energy shield**       | 9 notables: Mystic 31 units (Cloister one-stop), Zealot 16, Shade 11. Flat for six builds.                                     | **Home and two neighbours** (int regions). Mystic, Zealot and Shade each get a second and third ES direction with new partners.                       | MY-4, MY-8, SH-1, SH-13, ZE-10, ZE-11; partner on SH-14; sections MY-s3, MY-s4, ZE-s2, SH-s3; MY-m1, MY-m2, SH-r1.                                | 57 → about 105       |
| **armour**              | 6 armour-led notables, 23 of 35 units in the Vanguard; the Rampart is a one-stop 14 to 16 steps from both strength starts.     | **Home and two neighbours** (Vanguard; Reaver and Zealot). Three directions in the Vanguard (north, west, south-west); the Reaver's on its west side. | VA-1, VA-2, VA-3, RE-4; partner on ZE-5; sections VA-s1, VA-s2, RE-s1, ZE-s1; VA-m3, RE-r1.                                                       | 35 → about 70        |
| **evasion**             | 7 notables: Strider 16, Shade 11, Reaver 7.5. Six builds take 298 to 350%.                                                     | **Home and two neighbours** (Strider; Shade and Reaver).                                                                                              | ST-3, ST-7, SH-14, RE-6; partner on SH-15, ST-8; sections ST-s1, ST-s2, SH-s4, RE-s3; SH-r1 (Shroud loses its evasion).                           | 35 → about 70        |
| **block (attack)**      | 9 notables; the Muster holds most (Reaver 26 units); the staff blocker's block is 4 units.                                     | **Split** across the strength regions with a second home in each: Muster (Reaver), Quarry and the west (Vanguard), Nave (Zealot).                     | Partner on VA-2, RE-2, ZE-4; ST-r1 (Round Shield one theme); RE-r1 (Scarred Hide becomes life on block).                                          | 63 → about 70        |
| **spell block**         | Spirit Ward (Mystic, shield), Glass Wall (Zealot, shield), Stone Ward (Vanguard); 4 smalls. Flat at 6 for the block caster.    | **Home and a neighbour** (Zealot; Mystic and Vanguard keep theirs). Two new without a shield, so a staff can use them.                                | ZE-7 (staff + spell block), ZE-11 (ES + spell block).                                                                                             | about 12 → 18        |
| **dodge**               | Sidestep (Reaver), Mist Walk (Mystic), Tumble and Soft Step (Shade); 9 smalls. It climbs for the dodge build (10 → 17).        | **Concentrated** in the Shade with its neighbours' two.                                                                                               | SH-10; partner on SH-9, SH-1.                                                                                                                     | 17 → about 26        |
| **resistances**         | Every region has a resistance notable; 7 smalls of each single resistance; chaos is scarce.                                    | **Wide**, as lines.                                                                                                                                   | Partner on MY-4, VA-1; CE-1 (chaos resistance); ST-p1 (Weathered).                                                                                | 68 → about 75        |
| **stun (on you)**       | Vanguard 13 units (Unshakable, Thick Skin, Stone Heart); a little elsewhere.                                                   | **Home** with lines elsewhere.                                                                                                                        | Partner on MY-8, SH-r1; CE-3; ST-r1.                                                                                                              | 17 → about 23        |
| **leech and recovery**  | Reaver 15 units (Red Harvest, Thirsting Blade), plus Strider, Shade, Vanguard, Zealot; Siphon (ES) and Mana Tap in the Mystic. | **Wide**, heaviest in the Reaver.                                                                                                                     | Partner on RE-3, RE-9; CE-2 (life on kill); MY-m2 (Siphon north).                                                                                 | 38 → about 42        |
| **mana and sustain**    | 76 units, 32 in the Mystic. It climbs for the channeller.                                                                      | **Wide** (§4.1: every start has mana).                                                                                                                | Partner on MY-3, MY-9, SH-13; CE-4; section ZE-s5; ST-r1 removes Round Shield's mana.                                                             | 76 → about 85        |
| **flasks and movement** | 29 and 17 units, spread.                                                                                                       | **Wide**, unchanged.                                                                                                                                  | Partner on ST-7.                                                                                                                                  | about the same       |

### 4.2 Generic offence

| want                          | today                                                                                                                                                                                     | decision                                                                                                                                                                                                                                             | added and changed                                                                                      | supply today → after |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------- |
| **spell damage**              | About 25 units of plain spell damage: First Light, Arcane Focus, Homily, Hedge Magic, Spellsword, Quiet Knife, Iron Liturgy, Crozier, plus minor lines; 7 smalls. Flat for eight casters. | **Wide among the int regions** (Mystic most, then Zealot and Shade), with the off-attribute ones (Hedge Magic, Spellsword, Iron Liturgy) kept as the hybrids' entries. Every new cluster has a different partner, and none of them is energy shield. | MY-1, MY-2, MY-3, ZE-1, ZE-9, SH-2, SH-11; MY-10 (with a dagger); sections MY-s1, MY-s2, ZE-s3, SH-s5. | 25 → about 75        |
| **cast speed**                | As lines on Arcane Focus, Thunderhead, Darting Bolts, Hearthfire, Homily, Hedge Magic, Spellsword, Quick Hands; 4 smalls. The classic caster is flat at 12 → 14.                          | **Wide**, as lines, plus one section.                                                                                                                                                                                                                | Partner on SH-11, MY-10; section MY-s5.                                                                | about 30 → 38        |
| **spell crit**                | Sharp Mind (home), Flashpoint (fire), Athame (dagger); 2 smalls. Flat at 7 and 9.                                                                                                         | **Home and a neighbour** (Mystic; Shade). East of the Mystic is its crit side.                                                                                                                                                                       | MY-1 (spell damage with crit multiplier), SH-3 (spell crit + insight).                                 | about 12 → 20        |
| **attack speed and accuracy** | Strider 24 units of attacks, Reaver 16, Vanguard 10 (Steady Hands). The sword build goes into the Strider for it; flat at 19 → 21.                                                        | **Wide among attackers**, mostly as the partner of a weapon or mechanic, so it comes in a different direction for each.                                                                                                                              | Partner on RE-1, RE-5, ST-5, SH-6, SH-7, VA-4, VA-7, RE-6 (accuracy); sections ST-s4, SH-s6, RE-s4.    | 55 → about 75        |
| **crit (attacks)**            | Strider 12 units, Shade 17; little elsewhere. It climbs for the bow and dagger builds.                                                                                                    | **Home and a neighbour** (Shade, Strider), as weapon partners.                                                                                                                                                                                       | Partner on SH-5, SH-12, SH-16, ST-1, MY-6; sections SH-s7, ST-s5.                                      | 34 → about 50        |
| **physical attacks**          | Heavy Draw, Deep Cuts, Iron Draw and weapon lines.                                                                                                                                        | **Wide**, as weapon lines. Nothing new.                                                                                                                                                                                                              | none                                                                                                   | unchanged            |
| **area, projectiles**         | Ground Shaker alone for area; Strider 27 units of projectiles.                                                                                                                            | Delivery categories are not sections (§14). They stay as lines on notables. The Strider keeps projectiles concentrated (round 4 spread them 7 to 11 apart).                                                                                          | none                                                                                                   | unchanged            |

### 4.3 Elements

| want                   | today                                                                                               | decision                                                                         | added and changed                                                  | supply today → after |
| ---------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------- |
| **fire (spells)**      | Cinder, Flashpoint (Mystic); Hearthfire, Censer (Zealot). Climbs for the burning caster.            | **Split** (Mystic and Zealot). Enough; unchanged.                                | none                                                               | 35 → 35              |
| **cold (spells)**      | Hoarfrost, Shatter (Mystic), Sleet (Shade). The classic caster's cold climbs only past 140 points.  | **Home and a neighbour**, plus the Zealot's shield caster.                       | ZE-4 (cold + shield block).                                        | 23 → about 29        |
| **lightning (spells)** | Overcharge, Thunderhead (Mystic), Static Edge (Shade), Thunder Peal (Zealot).                       | **Wide among the int regions.** Enough.                                          | none                                                               | unchanged            |
| **chaos (spells)**     | Rotting Word (Shade), Tomb Dust (Zealot); Withering (Mystic, damage over time).                     | **Split** (Shade and Zealot). The curser's new chaos is damage over time (SH-8). | Partner on SH-8.                                                   | 7 → about 9          |
| **physical (spells)**  | Whetted Will (Shade), Shattering Rite (Zealot).                                                     | **Split.** Both re-priced to 3 units or more.                                    | SH-p1, ZE-p1.                                                      | small                |
| **elemental attacks**  | Elemental Edge (Reaver), Elemental Fletching (Strider), Hallowed Hammer (Vanguard), Zeal (generic). | **Wide among attackers.**                                                        | Partner on MY-5 (wand), ST-2 (bow); VA-m2 (Hallowed Hammer north). | 29 → about 32        |
| **fire attacks**       | Kindled Steel (Zealot), Pitch Arrows (Strider).                                                     | **Split**, plus the Vanguard's two-handed fire.                                  | VA-6 (fire attacks + stun).                                        | about 9 → 15         |
| **cold attacks**       | Rimed Steel (Zealot).                                                                               | **Split**: a second home in the Shade.                                           | SH-12 (cold attacks + crit).                                       | about 4 → 10         |
| **lightning attacks**  | Stormstruck (Reaver, Fosse).                                                                        | **Split**: a second home on the Strider's outer road, a crossing from the Fosse. | ST-4 (lightning attacks + shock).                                  | about 4 → 10         |
| **chaos attacks**      | Venom Fletching (Strider), Carrion Claws (Shade).                                                   | **Split.** Enough.                                                               | none                                                               | unchanged            |

### 4.4 Ailments and damage over time

| want                                  | today                                                                                                                          | decision                                             | added and changed                                                | supply today → after |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------- | -------------------- |
| **ignite and burning**                | Cinder (Mystic), Kindled Steel, Censer (Zealot); 5 fire-over-time smalls.                                                      | **Home and a neighbour** (Zealot; Mystic).           | Partner on ZE-6 (sceptre + burning).                             | about 15 → 17        |
| **chill and freeze**                  | Hoarfrost, Shatter, Harsh Weather (Mystic); Rimed Steel (Zealot).                                                              | **Home and a neighbour.**                            | Partner on ZE-4 (chill on the notable).                          | small growth         |
| **shock**                             | Overcharge, Thunderhead, Harsh Weather, Static Edge, Thunder Peal, Sapper (against shocked).                                   | **Wide among the int regions.**                      | Partner on ST-4.                                                 | small growth         |
| **bleed**                             | Strider 13 units (Barbed Arrows, Deep Cuts), Reaver 16 (Open Veins, Executioner, Hewing, Festering). Axe and bleed is 22 → 25. | **Split** (Reaver and Strider).                      | RE-8 (bleed + bleed duration, near Wound Dance).                 | 29 → about 34        |
| **poison**                            | Venom Fletching (Strider), Barbed Point (Shade), Festering (Reaver). Flat for the poison claw at 15 → 17.                      | **Home and two neighbours**, with the Shade as home. | SH-7 (poison + attack speed); partner on SH-4 (dagger + poison). | 12 → about 19        |
| **damage over time (generic, chaos)** | Withering, Lingering (Mystic, 8 apart); 1 Shade unit. Flat for the curser at 12 → 12.                                          | **Split** (Mystic; Shade for chaos over time).       | Partner on SH-8 (curse + chaos over time).                       | 9.6 → about 12       |

### 4.5 Weapons

Each weapon cluster sits where its attributes are supplied (§5.4); the "attributes" column says how.

| weapon               | today                                                                                                                                                            | decision                                                                                                           | added and changed                                                                     | attributes                                         | supply today → after |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------- |
| **sword**            | Keen Edge (Reaver, accuracy), Fleet Blade (Strider, evasion), Greatblade (Vanguard, two-handed); Fencer's Eye's sword crit. Flat at 29 → 32 for the sword build. | **Home and two neighbours** (Reaver; Strider and Vanguard), the Reaver's three in three directions from its start. | RE-1 (attack speed, east), RE-2 (shield block, south-west), RE-3 (life leech, south). | strength and dexterity, the Reaver                 | 15 → about 32        |
| **axe**              | Cleaver (Vanguard west tower), Hewing (Reaver), Hatchet Work (Strider). It climbs.                                                                               | **Split** (Reaver and its two neighbours).                                                                         | VA-m1: Cleaver to the Quarry's south-east, by the Yard.                               | strength and dexterity; Cleaver now near both      | 14 → 14              |
| **mace**             | Weight of Iron, Crushing Blow, Hallowed Hammer, all in the Barbican. Flat at 14 for mace and shield.                                                             | **Concentrated** in the Vanguard, three directions instead of one area.                                            | VA-4 (attack speed, Quarry), VA-5 (life, Gate side); VA-m2 (Hallowed Hammer north).   | strength, the Vanguard                             | 11 → about 22        |
| **sceptre**          | Gilded Rod alone (§16), plus the mace lines that also name sceptres.                                                                                             | **Home and a neighbour** (Zealot; Hallowed Hammer on the Vanguard's Zealot border).                                | ZE-5 (armour), ZE-6 (burning); VA-m2.                                                 | strength and intelligence, the Zealot              | 5 → about 16         |
| **staff**            | Quarterstaff (Vestry), Crozier (Ambulatory).                                                                                                                     | **Concentrated** in the Zealot, a third cluster with block.                                                        | ZE-7 (spell block).                                                                   | strength and intelligence, the Zealot              | 7.3 → about 13       |
| **dagger (attacks)** | Fine Point, Long Knives, Quiet Knife (Shade). Flat at 7.                                                                                                         | **Concentrated** in the Shade, as wands are in the reference's one class, with twins apart.                        | SH-4 (poison), SH-16 (crit multiplier).                                               | dexterity and intelligence, the Shade              | 21 → about 32        |
| **dagger (spells)**  | Athame, Ritual Blade, Quiet Knife (Shade). Flat at 23 → 23 spell damage for the dagger caster.                                                                   | **Home and a neighbour** (Shade; Mystic border).                                                                   | MY-10 (cast speed, Gallery–Stair).                                                    | intelligence on both sides of that border          | about 12 → 17        |
| **claw**             | Talon (Alleys), Carrion Claws (Rooftops), 17 apart. 4 → 8.                                                                                                       | **Concentrated** in the Shade, one cluster on the Strider border.                                                  | SH-5 (crit), SH-6 (attack speed, border).                                             | dexterity and intelligence; SH-6 has dex next door | 7.6 → about 19       |
| **wand (attacks)**   | Deft Wand (home), Wand Volley (Scriptorium). Flat at 8 → 8. A build the user named (§5.7).                                                                       | **Concentrated** in the Mystic, west and east.                                                                     | MY-5 (elemental attacks, west), MY-6 (crit multiplier, east).                         | intelligence, the Mystic                           | about 11 → 22        |
| **wand (spells)**    | Wandwork (Cloister) and smalls.                                                                                                                                  | **Concentrated.** Enough: the wand caster's spell damage comes from the generic spell clusters.                    | none                                                                                  | intelligence                                       | unchanged            |
| **bow**              | Longbow, Rapid Fire (Strider), Iron Draw (Reaver), Quiet Shot (Shade). The physical bow is flat at 30 → 32.                                                      | **Home and two neighbours** (the reference's 75 to 78% in one sector).                                             | ST-1 (crit), ST-2 (elemental attacks), both on the outer road; ST-p2.                 | dexterity, the Strider                             | 19 → about 30        |
| **two-handed**       | Greatweight, Heavy Hands, Headsman, Thunderstep, Greatblade, all in the Vanguard.                                                                                | **Home and a neighbour** (Vanguard; Reaver for two-handed swords and axes).                                        | RE-7 (life, Pits west).                                                               | strength (and dexterity at the Reaver)             | 18 → about 24        |
| **dual wield**       | Twin Fangs, Crossed Blades (Lists), Two Fists (Barrows). Flat at 18.                                                                                             | **Wide among dex and str-dex regions**, each with a different partner.                                             | SH-9 (dodge), ST-8 (evasion), RE-9 (life leech).                                      | dexterity                                          | 16 → about 32        |
| **shield attacks**   | Shield Bash (Muster).                                                                                                                                            | **Split** (Reaver and Vanguard).                                                                                   | VA-8 (stun).                                                                          | strength (armour shields)                          | about 5 → 10         |

### 4.6 Mechanics

| mechanic                  | today                                                                                                                                      | decision                                                                                                 | added and changed                                               | supply today → after |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------- |
| **minions**               | Familiars (Mystic), Black Flock (Shade), Shepherd, Ossuary (Zealot), Grave Host (Vanguard). The summoner is flat at 22 → 22.               | **Split** (Zealot and Mystic), with far third and fourth homes kept (the user kept Grave Host far, §16). | MY-7 (curse effect), ZE-2 (life).                               | 26 → about 37        |
| **totems**                | Standing Cairns (Vanguard), Sentry Post (Strider), Reliquary (Zealot). Flat at 9.                                                          | **Wide among strength and mixed regions.** A second Vanguard cluster, apart.                             | VA-7 (totem speed and duration).                                | 16 → about 21        |
| **traps and mines**       | Tripwire (Strider), Trapper (Shade), Snare Line (Mystic); Sapper, Black Powder (Shade, 8 apart).                                           | **Home and a neighbour** (Shade; Strider), as a fork where they meet.                                    | ST-6 (the traps-or-mines wheel).                                | 23 → about 29        |
| **brands**                | Runecarver, Brandwright (Zealot, 7 apart). Two gems in the game (A1).                                                                      | **Concentrated.** Enough for an island of two gems.                                                      | none                                                            | unchanged            |
| **curses**                | Hexwright (Mystic), Second Curse (Shade), Grim Oath (Vanguard), Marked Prey (Reaver). The curser is flat at 11 → 11, climbing only at 160. | **Wide**, with the curser's home (the Shade) now holding two curse clusters.                             | SH-8 (chaos over time); partner on MY-7, SH-2 (against cursed). | 21 → about 30        |
| **auras and reservation** | Warlord's Banner, Standard Bearer, Benediction, Choirmaster, Devotion, Veiled Herald. Flat at 19 for the aura build.                       | **Wide**, with the Zealot as home.                                                                       | ZE-8 (life); partner on ZE-1.                                   | 25 → about 32        |
| **warcries**              | War Drums (Vanguard), Battle Hymn (Zealot).                                                                                                | **Split** across the strength regions.                                                                   | RE-5 (attack speed); partner on VA-3.                           | 10 → about 17        |
| **charges**               | Grit (Unbroken, Scar Tissue), fervour (Hot Blood, single home), insight (Flashes of Insight, single home).                                 | **One region each, with a second home in a neighbour.**                                                  | ST-5 (fervour), SH-3 (insight).                                 | 21 → about 29        |
| **channelling**           | Steady Stream (Mystic Belfry), Ceaseless Blades (Reaver Fosse), 45 apart.                                                                  | **Split**, with a spell cluster on the Zealot–Mystic border.                                             | ZE-3 (elemental damage).                                        | 9.3 → about 15       |
| **stun (enemy)**          | Stagger, Headsman, Weight of Iron (Vanguard).                                                                                              | **Concentrated** in the Vanguard.                                                                        | Partner on VA-6, VA-8.                                          | 12 → about 15        |

### 4.7 Keystone neighbourhoods

The 27 keystones stay (§9.1). The ledger uses them as partners: a new cluster beside a keystone that undoes it is a
fork, and one beside a keystone that rewards it is a pull. Each keystone spur stays a dead end, one or two smalls off a
junction.

- **Forks:** MY-1 beside Fever Pitch (crit multiplier fixed at 100%), SH-1 beside Spellslip (less ES), ZE-1 beside Lone
  Vow (no reservation needed), ZE-8 beside Living Ward (maximum life 1), SH-r1 (recharge) beside Shade Leech (slower
  recharge).
- **Pulls:** SH-9 by Nimble Gambit, RE-3 by Crimson Pact, RE-8 by Wound Dance, ZE-6 by Searing Avatar, ZE-2 by Volatile
  Servants, ST-7 by Plated Hide (its evasion becomes armour).
- **Distances:** where a region grows outward, keystones near the old rim may end up inside it. The briefs keep each
  keystone 8 to 18 steps from a start (§16) and at the rim where it can be.

## 5. How the ledger breaks the user's two examples

Steps are measured on today's network from the start to the notable ("7" means the notable is the seventh node bought
on the shortest path). New clusters' steps are estimates from where the ledger puts them. A standard cluster costs
about 4 points from its road for about 7 units.

### The classic caster (Mystic start; spell damage and energy shield)

**Today.** At 120 points it holds 126% spell damage and 157% ES. It took Glass Skin (7 steps), Warded Mind (7), Arcane
Focus (8), Quickening (10), Wandwork (10), Broad Weave (12) and Siphon (12), then Hoarfrost and Shatter. After 100
points there is no more spell damage worth the walk: 40 more points add 16%.

**After.** The Mystic and its two borders offer four directions, each with a different mix:

- **West, the ES side** (the Cloister and the new west road toward the Zealot). Glass Skin (7), Deep Well (8), the ES
  section MY-s3 into MY-8 (about 10), Quickening on its new road (about 12), MY-2 (spell damage with life, about 13),
  and past the border Hymn (10) and ZE-10 (about 15). It is about 30 units of ES and one spell cluster whose partner is
  life.
- **East, the crit side** (the Scriptorium and the Gallery). Warded Mind (7) is the one ES notable here. Arcane Focus
  (8), the spell section MY-s2, MY-1 (spell damage with crit multiplier, about 13, beside Fever Pitch), Flashpoint
  (18), and MY-9 (life with mana). It is about 20 units of spell damage and spell crit, and little ES.
- **North, the far road** (the Column, the Belfry and the north rim road). Broad Weave and Darting Bolts (12), the
  spell section MY-s1, Siphon (moved, about 15), the cast speed section MY-s5 into MY-3 (spell damage with mana, about
  17), MY-4 (ES with resistances, about 19), MY-s4, and Shatter (20). It holds both spell damage and ES, but only at
  the end of about 20 points of road and sections.
- **Into the Shade's Stair.** SH-13 (ES with mana, about 15 by the Knife Gate), SH-1 (ES with spell dodge, about 18,
  beside Spellslip), SH-11 (spell damage with cast speed, about 20), Rotting Word (14).

Within about 20 steps of the start, the caster now finds about 45 units of plain spell damage and about 55 of ES. That
is against about 21 and 32 at its 120-point plan today. Taking all of both would cost about 75 points of wanted nodes
plus 35 to 40 of road, which leaves nothing for cold, cast speed, mana and resistances. So **at 120 points it must
choose:**

- **(a) ES-heavy, west and north.** About 40 units of ES and about 22 of spell damage. It gives up the crit side and
  most of the Shade.
- **(b) Offence-heavy, east and the Stair.** About 30 units of spell damage with crit, and ES from home and Warded Mind
  only, about 25 units.
- **(c) The north road.** Some of both, paid for with a long road that carries cast speed and its own clusters.

Each is a plan a player could defend. "What 40 more points would buy" then holds the other side's clusters: MY-1 and
Flashpoint for (a); Glass Skin's neighbours, MY-8 and ZE-10 for (b). Those are notables of 3.5 to 5 units the build
wanted (target 3). **At 60 points** it has the home (First Light, Sharp Mind, Warm Blood) and one side. The other side
is what 40 more points buy, so the mid-run build keeps its appetite (target 2). The convergence rule matters here: no
new cluster pairs spell damage with ES. First Light, the start's signature, stays the one place that gives both, and
it gives a little of each.

### The strength sword build (Reaver start; life, armour, sword damage)

**Today.** At 120 points: 214% life, 202% armour, 29 units of sword damage. It goes west to the Rampart for armour
(Mortar and Stone and Thick Skin at 16 steps, Stone Heart 15, Second Wind 14), takes Keen Edge (7) and Scarred Hide (8,
life with armour), and goes east into the Strider for attack speed (Hawk's Eye 9, Quick Hands 13, True Aim 15, Fleet
Blade 15). Past 120 points, 40 more add 16% armour and 3 sword units. Only life climbs.

**After.** Three directions from the Reaver start, each with a different mix:

- **West, the armour side** (the Practice Ground, the Gate and the Rampart). Keen Edge (sword with accuracy, 7), the
  armour section RE-s1 into RE-4 (armour with regeneration, about 11), Guarded (9), RE-2 (sword with shield block,
  about 10), Oathbound (10), and the Rampart's armour and stun (16). Deeper are VA-2 (armour with block) and Broad Back
  (21, the far life and armour hybrid), with VA-1 to the north (armour with resistances, about 18 by the Gate). Armour
  without Second Wind's regeneration, which moved to the Barrows (VA-m3).
- **East, the speed side** (the Lists and the Strider). RE-1 (sword with attack speed, about 9), RE-6 (evasion with
  accuracy), the attack speed section RE-s4, Hawk's Eye (9), Quick Hands and True Aim (13 to 15) and Fleet Blade
  (sword with evasion, 15). Sword and attack speed, with evasion instead of armour.
- **South, the blood side** (the Muster, the Pits and the Fosse). Scarred Hide (8, now life with life on block),
  Fencer's Eye (12), Red Harvest (13), RE-3 (sword with leech, about 14), RE-7 (two-handed with life), the life
  section RE-s2. Sword, leech and life.

The sword's own supply is now six clusters in three directions: Keen Edge and RE-2 west, RE-1 and Fleet Blade east, RE-3
south, and Greatblade far west for two-handers. That is about 32 sword-specific units against 15 today. Armour is about
40 units reachable, mostly west and far west. **At 120 points the build cannot take all three directions:**

- **(a) West and south.** Most of the armour, two or three sword clusters, life and leech. It gives up attack speed
  (RE-1, the Strider).
- **(b) East and south.** All the attack speed, three sword clusters and life. Its armour comes from the Rampart only if
  it pays the long walk; otherwise it takes evasion.
- **(c) West and east.** Armour and speed, but not RE-3 or the leech.

What 40 more points buy is then the third direction's sword cluster and either the far armour (VA-1, VA-2, Broad Back)
or the speed. Scarred Hide no longer hands over life and armour together at 8 steps (RE-r1). The nearest armour to the
Reaver start is now RE-4 on the west side, so armour is a direction. **At 60 points** the build has the home, Keen
Edge, and one of west or east.

**What could go wrong** (§8): both builds may end up stronger at 120 points, because more of what they want lies near
the start. The per-stat report (G-growth §1) is the check: the aim is that spell damage, ES, armour and sword end near
today's amounts while being a smaller share of what each build wanted.

## 6. Per-region tally and size

Node counts: a standard cluster is 4 nodes (ST-6, the wheel, is 6), a section 3, a centre arch 3. Roads are the new
attribute roads each region needs to hang its clusters from. Crossings are new border links that need one or two nodes.

| region    | new clusters                  | sections | moves and re-lines  | cluster nodes | section nodes | new road | total new | today |      after | room                                                                                                     |
| --------- | ----------------------------- | -------: | ------------------- | ------------: | ------------: | -------: | --------: | ----: | ---------: | -------------------------------------------------------------------------------------------------------- |
| Mystic    | MY-1 to MY-10 (10)            |        6 | MY-m1, MY-m2, MY-p1 |            40 |            18 |       18 |        76 |   183 |        259 | Tight: 179 cells inside. The north rim road needs the rim and a little beyond today's circle at the top. |
| Zealot    | ZE-1 to ZE-11 (11)            |        5 | ZE-p1               |            44 |            15 |       10 |        69 |   151 |        220 | Fits inside (234 cells); ZE-9 and ZE-11 on the north-west rim.                                           |
| Shade     | SH-1 to SH-16 (16)            |        7 | SH-r1, SH-p1        |            64 |            21 |       12 |        97 |   145 |        242 | Fits inside (304 cells).                                                                                 |
| Strider   | ST-1 to ST-8 (8, one wheel)   |        5 | ST-r1, ST-p1, ST-p2 |            34 |            15 |       18 |        67 |   146 |        213 | Needs the south-east rim for the outer road (553 rim cells; 90 inside).                                  |
| Vanguard  | VA-1 to VA-8 (8)              |        3 | VA-m1, VA-m2, VA-m3 |            32 |             9 |        8 |        49 |   192 |        241 | Fits inside with room to spare (312 cells): the reserve for a second round.                              |
| Reaver    | RE-1 to RE-9 (9)              |        4 | RE-r1               |            36 |            12 |       10 |        58 |   150 |        208 | Inside (147 cells) plus the Fosse rim for RE-3 and RE-8.                                                 |
| Centre    | CE-1 to CE-4 (4)              |        0 | none                |            12 |             0 |        0 |        12 |    36 |         48 | Inside the ring, on the diagonals.                                                                       |
| Crossings | (§7)                          |          |                     |               |               |          |       ~40 |       |        ~40 | At the borders.                                                                                          |
| **Total** | **66 clusters (67 notables)** |   **30** | **13 rows**         |       **262** |        **90** |   **76** |  **~468** | 1,009 | **~1,480** |                                                                                                          |

**Every region has varied defences after** (§4.5):

- **Mystic:** ES, life (MY-9, MY-s6), resistances (Prism Ward, MY-4), spell block (Spirit Ward), dodge (Mist Walk),
  avoid stun (MY-8).
- **Zealot:** ES, life, armour (ZE-5, ZE-s1), block, spell block, resistances (Litany).
- **Shade:** evasion, ES, life (SH-15, SH-10, two sections), dodge, resistances (Snakeskin), avoid stun (Shroud).
- **Strider:** evasion, life, resistances, block (Round Shield), avoid stun, armour through Plated Hide.
- **Vanguard:** armour, life, stun, block, spell block, resistances.
- **Reaver:** life, armour, evasion, block, dodge (Sidestep), leech.

**Size.** The ledger adds about 470 nodes, for **about 1,480 in all**. That is the low end of the user's 1,500 to
2,000. It is an outcome (§12.1): these are the clusters the diagnosis calls for, and padding the rest with roads would
fail target 5. **The lever for a second round** is in place if G3's first round shows a target still missed:

- more small sections, the cheapest wanted supply;
- third homes for the specializations that have two;
- the Vanguard's spare room (about 250 empty cells after this ledger), the Zealot's and the Shade's.

That would take it to about 1,600 to 1,700. §9 asks the user.

**Supply check.** For a generic main stat, a 120-point build should be able to afford about half of what lies in its
natural reach, and its reach covers about half the network's supply. So the network should hold about three to four
times what one build takes:

| stat         | one build takes at 120 points | after (multiple) |
| ------------ | ----------------------------: | ---------------: |
| spell damage |                      about 21 |       75 (3.6 ×) |
| ES           |                      about 32 |      105 (3.3 ×) |
| armour       |                   about 20–26 |         70 (3 ×) |
| evasion      |                   about 27–29 |       70 (2.5 ×) |
| life         |                      about 45 |        140 (3 ×) |

Evasion is the thinnest of these. If the allocator shows the dex builds still flat on evasion after round one,
evasion sections are the first second-round lever.

## 7. Implied crossings

New links each border needs, named for the combination each serves (§3.7, §3.8). Today each border has 4 to 6 links;
these bring each to about 9 to 12. "Near" is a bridge of one or two nodes; "dear" is several attribute nodes between
far areas; "ring" is the centre.

| border              | crossing                                                                                                                            | kind |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---- |
| **Mystic–Shade**    | Gallery to Stair through MY-10: the dagger caster reaches the Mystic's crit side; the Mystic caster reaches SH-11 and Rotting Word. | near |
|                     | Scriptorium to Stair through SH-3: spell crit and insight, either way.                                                              | near |
|                     | The Spire gate's east to the Knife Gate: SH-13 (ES with mana) for Mystic casters, the Cloister for Shade casters.                   | near |
|                     | The north rim road onward to the Rooftops: cold (Shatter, Sleet, SH-12), the far ES (MY-4) for Shade casters.                       | dear |
|                     | CE-1 on the ring.                                                                                                                   | ring |
| **Mystic–Zealot**   | Lantern to Undercroft through ZE-3: channelling from both sides (Steady Stream, ZE-3).                                              | near |
|                     | The west road (MY-2, Quickening) to the Choir: spell damage with life for the Zealot's life casters; ZE-1 for Mystic casters.       | near |
|                     | Cloister to Narthex: Hymn and Glass Skin, ES with mana from either home.                                                            | near |
|                     | The north rim road to the Undercroft rim: MY-3 and MY-4 to ZE-9 and ZE-11, the casters' far loop.                                   | dear |
|                     | MY-5's side to the Bell Tower: the elemental wand and the elemental sceptre share elemental attacks.                                | near |
|                     | CE-4 on the ring.                                                                                                                   | ring |
| **Zealot–Vanguard** | Narthex to Battlements: ZE-5 (sceptre with armour), Hallowed Hammer (moved), VA-1 (armour with resistances).                        | near |
|                     | Vestry to Barbican: ZE-7 (staff with spell block) and VA-2 (armour with block), the war staff and the shield caster.                | near |
|                     | Ambulatory rim to the Barbican's south: VA-6 (fire attacks) with Kindled Steel and ZE-6, the two-handed and sceptre fire.           | dear |
|                     | Nave to Quarry: ZE-4 (cold with a shield) with Bracing and VA-8, for shield builds of either side.                                  | near |
| **Vanguard–Reaver** | Quarry to Practice Ground: Cleaver (moved) with Hewing, axes from either start; RE-4 with the Quarry's armour.                      | near |
|                     | Barrows to the Pits: RE-7 (two-handed with life) with Heavy Hands and Headsman.                                                     | near |
|                     | Quarry to Muster: VA-4 (fast mace) with the Muster's shields, mace and board.                                                       | near |
|                     | CE-3 on the ring.                                                                                                                   | ring |
| **Reaver–Strider**  | Lists to Ford: RE-1 (fast sword) with Fleet Blade and True Aim; ST-8 (dual with evasion) with Twin Fangs and Crossed Blades.        | near |
|                     | The Fosse to the Strider's outer road: ST-4 (lightning attacks) with Stormstruck. The outer road becomes a rim highway.             | dear |
|                     | RE-6 to the Meadow: evasion and accuracy, either way.                                                                               | near |
|                     | CE-2 on the ring.                                                                                                                   | ring |
| **Strider–Shade**   | SH-6 (fast claw) on the border itself.                                                                                              | near |
|                     | Hedgerows to Docks through ST-6 (traps or mines) with Trapper and Sapper.                                                           | near |
|                     | SH-15 (life with evasion) to Hard Target.                                                                                           | near |
|                     | The outer road's north end to the Docks: Quiet Shot for bows, Barbed Point for the poison bow.                                      | dear |

That is about 27 new links: four to six per border, five of them dear bridges (four along the two new rim roads), and
four on the ring. With today's 4 to 6, each border lands at about 9 to 12. A region's edge facing a neighbour is designed
around these (§3.8). Crossing nodes are attribute nodes of the two regions' attributes (§7.1).

## 8. Tensions said out loud (§13)

1. **Tension against strength by the back door.** More wanted nodes near a start let a 120-point build collect more
   of what it wants even while the share falls, and target 5 (less tax) pushes the same way. Power is not a target, so
   the ledger does not cut supply to hold it. The guards are pricing (every new notable 3 to 5 units, smalls one unit),
   the convergence rule, and the per-stat report before and after. The ledger leaned toward tension and accepts that
   some builds will end a little stronger. If the per-stat report shows a jump, G4 trims prices; it does not remove
   choice.
2. **Tension against starts that do not commit** (§6.2, §6.3, §13.8). New clusters near homes would make the first
   points richer and more pointed. No new cluster sits within three steps of a start, and none of the near-home ones
   names a weapon. The sections nearest homes (MY-s6, SH-s1) carry life only.
3. **Identity against spread** (§13.2). The Shade gets the most (16 clusters), because daggers, claws, poison, dodge
   and the curser are its identity and it was the thinnest region. The risk is a Shade that reads as "the blades
   region". The guards are its spread of generic and caster clusters (SH-1, SH-2, SH-3, SH-11, SH-13, SH-14, SH-15)
   and its weapons' twins kept 5 or more apart with different partners.
4. **Connections against trade-offs** (§13.1). About 27 new links. Each is named for a combination, and none joins
   two clusters one build would want both of at one step (§5.5). The two new rim roads add loops at the edge of the
   map, not shortcuts across it.
5. **Rim growth against keeping a region's footprint** (§11.5 against §11.3 and §4.3). The Mystic and the Strider
   cannot hold their share inside. The ledger lets them grow outward (the north rim road, the south-east outer road)
   and keeps every border with a neighbour where it is. Enlarging is allowed and cramming is not. A region's shape
   loses wherever it makes a node worse (§13.7).
6. **Highways against filler** (§13.4), and **tension by tax**. The two rim roads are about 30 nodes of road. Each
   carries three or four clusters and two sections along it, so no stretch runs more than a few nodes without a branch.
   Every far cluster sits within about 40 points of a 120-point plan that wants it.
7. **Uniform sections against variety** (§13.3). The 30 small sections are uniform by definition. The variety is in
   the 67 notables' partners. Small sections are not the filler §14 rejects: every small is a main stat a build wants,
   and each section is a bridge between two places.
8. **Moving existing clusters against the user's hand edits** (§11.5, last item; §15.9). Second Wind, Scarred Hide,
   Cleaver, Hallowed Hammer, Quickening and Siphon move or change. The Strider's Meadow pairs stay as round 4 left them
   with the user. Round Shield and Weathered, in the user's region, are re-lined only to meet §10.2 and §8.6.
9. **A generic centre against tension** (§4.7). The four new arches carry sustain and utility, not main stats, so the
   centre does not become everyone's cheap life and armour.
10. **Fewer nodes than the user's guess against padding.** The ledger lands at about 1,480 and says so, rather than
    inventing clusters to reach a number (§12.1).

## 9. Open questions for the user

1. **Size.** The ledger adds about 470 nodes, for about 1,480 in all, the low end of your 1,500 to 2,000. Start there
   and add a second round only where the measures show a build still takes everything? Or aim higher from the start
   (about 1,650) with third homes and more small sections?
2. **Small sections without a notable.** About 30 pockets of three identical small nodes (life, energy shield, armour,
   evasion, spell damage) as cheap bridges between clusters. The reference has many of these and the network has very
   few. Are they welcome?
3. **The centre.** Four small arches on the ring's four empty diagonals, with sustain and utility only (chaos
   resistance, regeneration, stun, mana). Should the ring's inside stay otherwise empty, or hold more?
4. **Changes to nodes you placed or approved:**
   - Second Wind leaves the Rampart.
   - Scarred Hide loses its armour and becomes life with life on block.
   - Round Shield becomes a shield-only notable.
   - Weathered is raised to at least 3 units.
   - Hallowed Hammer moves to the Zealot border, and Cleaver to the Yard border.

   All right?

5. **The start's signature notables.** First Light gives the Mystic spell damage and ES at step 2. It stays, as the
   one place that gives both, small amounts of each. Agreed?
6. **The unit table** (CONSTRAINTS §16): the tools price attack speed, crit and evasion per small at 3%, 20% and 12%;
   the constraints say 5%, 15% and 10%. The ledger uses the tools' values. If you pick the constraints' values, the
   attack speed and evasion supply in §6 changes by about a third.

Nothing in this work felt like it was losing intent. One thing to watch in G1b is that the master list does not get
treated as a quota to fill. Each brief should be free to say a cluster is wrong where it looks wrong on the map.

## 10. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Every main want gets supply in several directions with different partners, so a build
  gives something up (§1.1). The design is by supply along axes, not by builds (§1.2). Starts, roads and looks stay
  constraints (§1.3, and the user's note that tension is one of many).
- **§2 The reference.** Its measured facts are used: twins 7 to 14 apart scaled to at least 5, concentration chosen per
  specialization, 10 to 13 links per border, notables 3 to 5 units. Nothing is copied, and no names are given (G3
  names; §2.4).
- **§3 A network.** New sections are bridges (§3.6). The two rim roads add loops and several ways in (§3.5). About 27
  crossings are each named for a combination (§3.7), of all four kinds (§3.8).
- **§4 Regions and areas.** No build-named areas; new roads get place names (§4.2). Varied defences are checked per
  region in §6 (§4.5). Every region sells generics in its own voice, as lines and sections (§4.6). The centre stays
  generic (§4.7).
- **§5 Specializations.** Two or three clusters with different partners (§5.1). Twins ≥ 5 in every row (§5.2).
  Concentration is stated per entry (§5.3). Weapons sit by their attributes, and Cleaver is fixed (§5.4). The
  convergence rule applies "neighbours compete" (§5.5). Wand attacks, minions and spirit shield (spell block) get new
  homes (§5.7).
- **§6 Starts.** No new cluster within three steps of a start, and no weapon there (§6.3). First Light is kept as the
  signature (§6.3; question 5). The first notables stay 3 or 4 points out (§6.5).
- **§7 Roads and attributes.** New clusters hang off roads; the two new rim roads carry clusters along their length
  (§7.2, §7.3). Attribute supply rises with more roads, which G5 must re-check (§7.4).
- **§8 Clusters and smalls.** One stat per small (§8.1); every section is uniform (§8.2). The traps-or-mines wheel is
  §8.3's own example. Notables are 3 to 5 units, with seven existing ones re-priced (§8.6).
- **§9 Keystones.** All 27 stay, used as forks and pulls (§4.7). Spurs stay dead ends. Distances of 8 to 18 are
  re-checked where regions grow (§9.1, §9.3). The late game lives in the rim roads and the crossings (§9.3).
- **§10 Vocabulary.** Wide: elemental attacks of each element, claws, sceptres, shield attacks, channelling, insight,
  fervour (§10.1). One theme per cluster, with pairs that belong (§10.2). Only lines live in `lines.ts` today (§10.3).
  New mace-only clusters use `weaponDamage('mace')` rather than `maceDamage`, which also names sceptres, so each
  weapon's twins count right (§10.3).
- **§11 Looks.** Placement is the briefs' job. The Mystic and the Strider grow outward rather than cram (§11.3). Borders
  are kept (§11.5). New clusters will need labels moved (§11.2).
- **§12 Size and balance.** Size is an outcome, about 1,480 (§12.1). New clusters rather than re-lining old ones for new
  needs (§12.2). Balance is supply priced in units (§12.3). No bot simulation; the allocator is a static tool (§12.4).
- **§13 Tensions.** Ten said out loud in §8.
- **§14 Rejected ideas.**
  - No generation.
  - No build list as the basis: the archetypes only diagnose.
  - No filler: sections are wanted nodes, and roads carry clusters.
  - No delivery-category sections: area and projectiles stay lines.
  - No step-count reach radius: the walkthrough's steps are costs, not a reach test.
  - No one-wheel-per-theme, and no restrictive new rule.
- **§15 How the work is done.** One ledger before the region briefs (G-growth G1a). G1b agents read CONSTRAINTS in full
  and place by eye, with walks (§15.2) and pictures (§15.5). Review by subsets follows in G4 (§15.6). Questions are
  plain (§15.8). The Strider gets no deference (§15.9).
- **§16 Open.**
  - Network size: about 1,480.
  - Borders: 4 to 6 links go to 9 to 12.
  - Single homes for fervour, insight, sceptre and staff are closed. Channelling's 45-step gap is closed. Cleaver is
    moved.
  - The unit table is asked (question 6).
  - Attribute values are to be re-checked in G5.
