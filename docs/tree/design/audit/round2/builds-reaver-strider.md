# Reaver and Strider: simulated build walks (audit 2, 2026-10-20)

> Copied into the repo on 2026-10-20 from the session scratchpad. The walk scripts and raw outputs it mentions stayed there. Fixes applied after this audit are listed in `../../E-round2.md`.

Read-only audit of the built network (`buildAll({ allowNew: true })`, edits.json applied) for the Reaver (Yard) and the
Strider (Bow). Strider items are the user's own region: everything marked **[user]** is a proposal for the user to
weigh, not a fix to apply.

Files (all in this directory):

- `builds-reaver-strider.md`: this report.
- `builds-reaver-strider-walks.txt`: every walk, point by point, with snapshots. Each line reads
  `point GOAL|PASS|. bN id «notable» lines`. `GOAL` is a node the plan targeted. `PASS` is a notable bought only because
  the path ran through it. `.` is a small or travel node on the way. `bN` is how many other unbought neighbours the node
  had when it was bought (the side branches on offer).
- `rs/`: the scripts. `walker.ts` is the walk engine, `reaver.ts` and `strider.ts` are the plans, `lib.ts` holds the
  graph helpers, and `close.ts` lists notables two steps or less apart, dead ends and crossroads notables. Run them with
  `npx tsx <path>` from E:/Proj/Auto. (Another agent was writing into `audit2/` at the same time, so my scripts live in
  `rs/`.)

## Method

- **Plans are hand-ordered.** Each plan is the order a decent player would buy targets in. Points 1 to 3 are generic,
  because no gem has arrived yet. Then life, mana and resistances come at the time a player wants them, then the build's
  notables, then late picks. The engine buys the cheapest path to each target from everything already bought, so the
  route is the solver's but the order is the player's. When the cheapest path ran through something odd, I logged it
  below.
- **Points 60 to 123.** Late targets are listed in the plan. When those run out, a `FILL` step takes the cheapest
  remaining notable that is not on the build's skip list (spells, minions, totems, traps, other weapons and so on). FILL
  shows what is actually within reach for the build's last points.
- **Levels.** Point p sits at level L where p = (L − 1) + 3 × floor(min(L, 80) / 10), the +3 bonus every tenth map up to
  map 80 (`run.ts:377`). So p10 is about L10, p20 about L18, p40 about L32, p60 about L49, p90 about L70 and p123 is L100.
- **Attributes.** Each total is the class base (Reaver 23/23/14, Strider 14/32/14) plus the tree. Gear is not counted.
- **What gear asks.** For each item class, the highest single-attribute ask among bases within 6 levels of the best base
  available at that level. Bases are filtered by build profile: hybrid `sword:strdex`, pure-dexterity `sword:dex`,
  armour `shield:str`, evasion `shield:dex`, and so on. A gem at full level asks 98 of one attribute, and its level
  requirement is shown too.

## Summary

| Build                            | First build notable    | Core done by          | Notables wanted by p40 | Primary attribute vs gear ask at p60 / p90                         | Late points (60–123)                                                                                 |
| -------------------------------- | ---------------------- | --------------------- | ---------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| R1 dual swords                   | Twin Fangs p9          | p44 (Fencer's Eye)    | 14                     | dex 155 vs 158 (sabre) or 83/81 hybrid; dex 283 vs 212 at p90      | Crimson Pact, then the Strider (Vital Aim, Light Hand, Fleet Blade), Nimble Gambit; filler after p95 |
| R2 bleed axe + shield            | Hewing p12             | p37 (Wound Dance)     | 12                     | str 162 vs 114/112; 219 vs 167                                     | Barrows (Barrow Ward, Headsman), the Strider (Deep Cuts, Hatchet Work), then the Wall                |
| R3 two-handed axe                | Hewing p12             | p41 (Heavy Hands)     | 10                     | str 157 vs 122; 306 vs 158                                         | Almost all in the Wall: 84 of 123 points are Vanguard nodes                                          |
| R4 sword and shield              | Buckler p5             | p39 (Shield Bash)     | 13, plus the keystone  | str 146 vs 114; 259 vs 159                                         | Bracing, Wall defences, Rooted Stance, then filler                                                   |
| R5 leech sword + shield          | Red Harvest p20        | p29 (Thirsting Blade) | 10                     | str 121 vs 114 (the one tight case); 167 vs 159                    | Thirsty Quiver (through Sentry Post), Vampiric Strikes, then filler                                  |
| R6 two-handed sword crit (extra) | Keen Edge p9           | p26                   | 12                     | str 196, dex 126 vs 91/77; 289/169 vs 119/131                      | The Wall's two-hander nodes: 59 of 121 points                                                        |
| S1 crit bow                      | Longbow p11            | p62 (Quiet Shot)      | 11                     | dex 270 vs 152; 342 vs 212                                         | The Knife crit (Quiet Shot, Mercy Stroke, Cruel Agony), then evasion; filler from about p90          |
| S2 bleed bow                     | Deep Cuts p18          | p26 (Barbed Arrows)   | 9                      | dex 237 vs 152; 331 vs 212                                         | Yard bleed (Open Veins, Executioner, Wound Dance), a satisfying cross                                |
| S3 bow totem                     | Sentry Post p20        | p20                   | 10                     | dex 253 vs 152; 320 vs 212                                         | Standing Cairns (p65, past Iron Draw and Light Blades), then generic bow; no totem late game         |
| S4 dex sword + evasion shield    | Fleet Blade p11        | p57                   | 13                     | dex 193 vs 158; 273 vs 212                                         | The Yard's swords and shields; 64 of 123 points are Reaver nodes                                     |
| S5 projectile bow                | Split Volley p15       | p41 (Ricochet)        | 13                     | dex 222 vs 152; 313 vs 212                                         | Quiet Shot and Veiled Herald, then Spire and Yard filler                                             |
| S6 elemental bow (extra)         | Elemental Fletching p7 | p88 (Elemental Edge)  | 12                     | dex 277 vs 152; 393 vs 212                                         | A long walk to the second elemental cluster (Elemental Edge) through Keen Edge and Hewing            |
| X1 Reaver bow                    | Iron Draw p12          | Vital Aim p23         | 11                     | dex 293 vs 152; 379 vs 212                                         | Lives in the Strider (77 of 123 points)                                                              |
| X2 Strider dual wield            | Twin Fangs p9          | p24 (Crossed Blades)  | 12                     | dex 237 vs 158; 308 vs 212 (hybrid swords need str 119; it has 66) | Yard swords, crit, Nimble Gambit                                                                     |

---

## Reaver walks

The start is good. Point 1 is a side (melee damage or attack speed), point 2 is Quickened Steel (generic) or a hub
(+15/+15), and Stout Heart, Buckler and Fighting Breath are all 4 to 5 out. Nothing names a weapon within three
steps. Life comes cheap from the middle road (`yard.home.roadS` a to c). No complaints here.

### R1 Dual swords (Twin Fangs, Crossed Blades, Keen Edge, Light Blades)

Snapshots (the full walk is in the walks file):

- **p10 (L10):** sig.b, Quickened Steel, hubs.e, road east, Fighting Breath, Buckler, Twin Fangs. Str 62, dex 62
  against a sword asking 18/26.
- **p20 (L18):** + life road, Weaving, the shield hub, Light Blades, Keen Edge. 69/69 against 30/30.
- **p40 (L32):** + Four Winds, Sidestep, Hot Blood, Crossed Blades, Red Harvest, Stout Heart, Killing Pace. 122/112
  against 57/57 hybrid or 101 dex.
- **p60 (L49):** + Fencer's Eye, Guarded, Standard Bearer, Well Rounded, three Crimson Pact smalls. 165/155 against
  83/81, or a 158-dex sabre.
- **p90 (L70):** + Crimson Pact, Field Dressing, Elemental Edge, Thirsting Blade, Vital Aim (across the gate), Nimble
  Gambit. 179/283 against 119/122, or a 212-dex sabre.
- **p121:** + Light Hand, Wanderer, Fleet Blade, Quick March, Spellsword, then FILL: Soft Step, Hawk's Eye, Long Breath,
  Executioner, Snakeskin, Thick Skin, Open Veins, Fleet Foot, Hard Target, Elemental Fletching.

Decision log:

- **JANK (p7).** The cheapest way from the east hub to Twin Fangs runs through **Buckler** (`yard.home.block.n`, a
  shield notable): `roadE.a → block.n → twinFangs.b → twinFangs.n1`. The link `yard.dual.twinFangs.b ↔ yard.home.block.n`
  makes the shield pocket the door to dual wield. Either player pays the other's notable or walks round.
- **BORING-ish / weak fork (p12–13).** **Weaving** (`twinFangs.n2`) is one step from the wheel's entrance
  (`twinFangs.a ↔ twinFangs.n2`). Twin Fangs and Weaving together cost 4 points (a, b, n1, n2). A dual Reaver wants
  evasion too, so it takes both. The fork exists only as "which exit you leave by" (n1 to the gate `j2`, d to `j1`), and
  leaving by the other costs 1 to 2 points. It is a weak §8.3 choice.
- **ONE-STOP (p17–20).** **Light Blades → Keen Edge** is 3 points (`lightBlades.a ↔ keenEdge.c`). A sword build takes
  both with no trade. The why calls them "one neighbourhood" on purpose, which is what §5.5 warns against.
- **INTERESTING (p21–44).** Four Winds sits on the way, and its spokes are real doors. From the shield hub the player
  chooses between going east to Sidestep, Hot Blood and Crossed Blades and going south-west to Fencer's Eye. Crossed
  Blades sits 3 points from Red Harvest, by the `yard.dual.toCrossed`/`yard.blood.toCrossed` road. This is the best
  stretch of the walk: the east and south choices compete for the same points.
- **FORCED (p45–48).** Guarded is a dead-end pocket reached through `keenEdge.b`, so it costs one sword small extra.
  That is fine for a sword build.
- **JANK (p65–66).** Reaching Elemental Edge from Fencer's Eye buys `shieldwall.b` and `shieldwall.c`, two block smalls
  the dual wielder cannot use. The Shieldwall keystone spur is a road (see finding 3).
- **BORING (p71–90).** Everything wanted in the Yard is gone by about p70. The rest is the Strider's generic crit
  (Vital Aim, 3 steps past the gate: good), then **eight +10 dexterity nodes** (`centre.ring.road.r10`–`r7`,
  `bow.home.hubs.n`, `bow.bows.road.jb3`, `toKnife.a`, ...) to reach Nimble Gambit. Then Light Hand and Fleet Blade for
  one-handed and sword lines.
- **Late verdict.** Points 60 to 90 are satisfying: Crimson Pact against regeneration, and Nimble Gambit against armour,
  are real trades. After about p95 every pick is generic evasion, life or resistance in the Strider and the Knife.
- **Attributes.** A hybrid sword is over-met from p10 onward. A pure-dexterity sabre is briefly 3 short at p60 (dex 155
  against 158). The 212 to 220 sabre is met at p90 only because the late game walked dexterity roads.

### R2 Bleed axe, one-handed with a shield (Hewing, Open Veins, Executioner, Wound Dance)

- **p10:** sig.a, Quickened Steel, hubs.w, Stout Heart, west road, **2 sword smalls** (`keenEdge.a`, `keenEdge.c`),
  `lightBlades.a`, `blades.j1`. Str 79 against axe 21 and shield 20.
- **p20:** + Hewing, Light Blades, Elemental Edge (passed), `shieldwall.c` (block small), Executioner. 79/69.
- **p40:** + Four Winds, Fighting Breath, Standard Bearer, Open Veins, Wound Dance (keystone at p37), Fencer's Eye.
  103/83 against axe 80/33 and shield 76.
- **p60:** + Steel Rim, Killing Pace, Shield Bash, **the Barrows road e8–e5**, Barrow Ward, Headsman. 162/132 against
  112/60 and 114.
- **p90:** + Red Harvest, Guarded, Field Dressing, Shield Catch, Thick Skin, Well Rounded, Spellsword, then the dear
  road into the Strider through **Sentry Post** and Thirsty Quiver to Deep Cuts. 219/189 against 167/86 and 159.
- **p123:** + Hatchet Work (Strider), Cleaver (Wall, passing Vampiric Strikes and Ground Shaker), Unbloodied, then FILL
  in the Wall: Quartermaster, Iron Lungs, Unhurried, Mortar and Stone, Stone Heart.

Decision log:

- **FORCED (p7–8).** The axe player buys 2 sword smalls (`keenEdge.a`, `keenEdge.c`) to reach `blades.j1`, the only
  door to Hewing (`j1 → hewing.a`). Taking `lightBlades.a` instead of Keen Edge is a small real choice.
- **FORCED (p14–17).** Hewing's only exits are `hewing.a` (j1) and `hewing.b` (Elemental Edge). Going on to Executioner
  passes `elementalEdge.a`, **Elemental Edge** and `shieldwall.c`. §5.5 calls a different notable on the way a fair
  price, but here it is the only way on, and the block small is a keystone-spur node used as a road.
- **INTERESTING (p19–37).** Executioner, Open Veins and Wound Dance sit 3 to 4 apart round `yard.blood.j3` and
  `toWall`, and Hewing is 7 or more away. The bleed set is concentrated at j3, but the axe side is not, so the build
  pays for travel. Taking Wound Dance early (p37) against Open Veins' damage is a real decision.
- **PASS (p28–29).** **Standard Bearer** is a crossroads (`toStandard`, `standard.a`, `toWall`). Every route from j3 to
  Executioner passes it. For a bleed build with an aura it is not wasted.
- **BORING (p48–53).** `wall.grit.east.e8 → e7 → e6 → e5` is four attribute nodes with nothing branching off, then
  Barrow Ward. This is the longest no-choice stretch in the Reaver walks (finding 7).
- **JANK.** Hewing pays 12% two-handed damage and 12% two-handed DoT (about 1 unit of its 4.2) that a one-handed axe
  cannot use. The same goes for Headsman (p58), which is half two-handed.
- **FORCED (p84–87).** The cheapest way from the Pits into the Strider's interior is the dear road
  (`bow.steel.toBlood.e/d/c`), then the totem chain: **Sentry Post** (passed), then Thirsty Quiver (passed), then Deep
  Cuts.
- **Late verdict.** Barrow Ward and Headsman (p54–58) are decent late picks. Deep Cuts and Hatchet Work (p89–95) are a
  real bleed twin across the region border, and that part is satisfying. From p96 the build walks the Wall's slams
  (passing Vampiric Strikes and Ground Shaker) to reach Cleaver, the one-handed axe at the far west. After that it is
  Wall armour filler.

### R3 Two-handed axe crossing to the Wall (Hewing, Headsman)

- **p10:** the same opening as R2, with 2 sword smalls on the way to j1.
- **p20:** + Hewing (p12), **Elemental Edge (passed, p15)**, `toHeadsman.r1–r3`, Headsman (p19). Str 103, dex 83
  against 44/25.
- **p40:** + Field Dressing, Thick Skin, Thunderstep (Wall), Four Winds, Headsman's smalls, **Barrows e3–e5**, Barrow
  Ward, e2–e1. 150/90 against 64/37.
- **p60:** + Heavy Hands, Fencer's Eye (through `shieldwall.c` and `shieldwall.b`, block smalls), Executioner, Unbroken,
  Tempered, Blood Rite, Killing Pace, Guarded. 157/97 against 122/57.
- **p90:** + `southWest.d–a`, **Iron Liturgy (passed, a spell notable)**, `west.c–a`, Greatweight, Broad Back, Well
  Rounded, Cleaver, Rooted Stance, Ground Shaker. 306/126 against 158/86.
- **p123:** all Wall: Unbloodied, Vampiric Strikes, Iron Lungs, Quartermaster, Unhurried, Standard Bearer, Mortar and
  Stone, Stone Heart, Steady Hands, War Drums, Long Reach, Second Wind.

Decision log:

- **INTERESTING (p12–19).** Hewing, then 3 road nodes, then Headsman: the new road does what it was built for. A big axe
  has its second axe notable 7 points after the first.
- **FORCED (p13–15).** Elemental Edge again. A physical two-handed axe buys an elemental notable to leave Hewing.
- **TWINS WITH THE SAME PARTNER.** Hewing (axe, bleed, two-hander) and Headsman (axe, two-hander, stun) both pair axe
  with two-handed. §5.1 says picking the cluster should be picking the partner. Here the partner differs only in bleed
  against stun-threshold reduction, so a two-handed axe takes both and gives nothing up.
- **JANK.** The Yard has no two-handed content after Hewing. From p20 the build is a Vanguard: Thunderstep, Heavy Hands,
  Greatweight, Broad Back, Cleaver, Ground Shaker, Rooted Stance. **84 of 123 points are Wall nodes.** §5.4 assigns
  two-handed axes and swords to the Yard.
- **BORING (p30–36, p62–70).** The Barrows road e3–e5, then the barrow stair `southWest.d–a` (4 bare strength nodes),
  through Iron Liturgy, then `west.c–a` (3 more). Fourteen points carry two notables. This is mostly Wall-side, but the
  Yard build is the one paying for it.
- **FORCED (p66).** **Iron Liturgy** (spell damage and armour) is the cheapest door from the Barrows to Greatweight.
- **Attributes.** Strength reaches 306 at L70 against an ask of 158.

### R4 Sword and shield (Steel Rim, Shield Catch, Shieldwall)

- **p10:** sig.b, Quickened Steel, hubs.e, Buckler (p5), Fighting Breath, life road ×3. 62/62.
- **p20:** + the hub, Steel Rim (p14), Light Blades (p16), Keen Edge (p19). 69/69 against sword 30/30 and armour shield 46.
- **p40:** + Four Winds (p21), **Shield Catch (p22, one point)**, Shieldwall (p28), Stout Heart, Fencer's Eye (p33),
  Standard Bearer, Shield Bash (p39). 118/98 against 57/57 and 76.
- **p60:** + Guarded, Killing Pace, Red Harvest (through two spell-block smalls it already wanted), Field Dressing, Thick
  Skin, Weaving, Twin Fangs (unused). 146/126 against 83/81 and 114.
- **p90:** + Well Rounded, the Strider's shield smalls (`bow.home.added.n437`/`n438`, +4% block each), Round Shield
  (passing Hawk's Eye), Barrow Ward, Oathbound, Bracing. 259/239 against 119/122 and 159.
- **p123:** Unbloodied, Vampiric Strikes, Broad Back, Rooted Stance, then FILL.

Decision log:

- **ONE-STOP SHOP (p5–39), the worst in these walks.** In 40 points the build has 13 notables and the keystone, every
  one wanted, and passes no notable it does not want. Within about 8 steps of `yard.shield.hub.a` sit the sword (Keen
  Edge), the one-hander (Light Blades), both shield notables (Steel Rim, Shield Catch), the block keystone (Shieldwall,
  6 steps from the wheel), the sword crit (Fencer's Eye, **one step from the Shieldwall spur** by
  `fencer.n ↔ shieldwall.b`), the shield attack (Shield Bash) and the reservation (Standard Bearer). §1.1 says this
  should not happen.
- **FAKE CHOICE (p22).** Steel Rim (`steelRim.n1`: block and shield defences) and Shield Catch (`steelRim.n2`: spell block
  and life on block) are both shield notables on one wheel. Shield Catch is one point from the entrance
  (`steelRim.a ↔ steelRim.n2`), so a shield build takes both. The 10-19 audit flagged this, and it is still present.
- **INTERESTING (p62–72).** Going for the Strider's shield chain (`n437`, `n438`, Round Shield) is a real cross: +8%
  block for 3 points plus 2 for Round Shield, past Hawk's Eye. Round Shield's own lines (mana regeneration, area and
  shield defences) read as a grab bag **[user]**.
- **JANK.** `yard.shield.shieldBash.b` is a dead end hanging past the notable: `toWall.a → a → n → b`, with b linked to
  nothing else. Its why says "The exit, to the keystone spur", and no such link exists. The render shows it as a stray
  dot below Shield Bash.
- **Late verdict.** Bracing (the Wall's shield) and Rooted Stance are fine late picks. Everything core is done by p40,
  so there are 80 points of "more defence", which is the cost of a one-stop shop.

### R5 Leech melee, sword and shield (Red Harvest, Crimson Pact)

- **p10:** sig.a, Quickened Steel, life road, Fighting Breath (through both mana smalls), the hub. **40/40**: this route
  skips both hubs.
- **p20:** + Light Blades, Four Winds, **`yard.shield.j2` → `steelRim.d` → `steelRim.c` → `yard.shield.j1` (2 spell-block
  smalls)**, Red Harvest. 54/54 against shield 46.
- **p40:** + Crimson Pact (p26), Thirsting Blade (p29), Keen Edge, Stout Heart, Steel Rim, the dear road
  `toBlood.e/d/c`. 114/104 against shield 76.
- **p60:** + **Sentry Post (passed)**, Thirsty Quiver, Spellsword, Fencer's Eye, Killing Pace, Guarded, Standard
  Bearer, Shield Catch. **Str 121 against an armour shield at 114 and a gem at 70.** This is the only tight snapshot in
  the 14 walks.
- **p90:** + Vampiric Strikes (Wall), Well Rounded, Weaving. 167/276 against 159.
- **p121:** FILL: Bloodletter (Knife), Light Hand, Wanderer, Quartermaster, Unbloodied, ...

Decision log:

- **ONE-STOP (p19–29).** Red Harvest, Crimson Pact and Thirsting Blade all hang off `yard.blood.j2.a`: Red Harvest by
  `redHarvest.b`, the keystone spur, and the mana-leech chain. All the Yard's leech costs 10 points in one place. The
  twins are far, which is good: Vampiric Strikes (Wall, p65) and Thirsty Quiver (Strider, p43). But the Yard's own
  leech is one destination.
- **FORCED (p15–18).** From the hub, the Pits are reached only through the shield wheel. The options are two
  spell-block smalls (`steelRim.d`, `c`), Steel Rim, or Shield Catch. A leech build with a shield does not mind. A
  two-hander or dual wielder does (see R6, X1 and S2).
- **FORCED (p40–42).** Thirsty Quiver from the Pits means the dear road plus **Sentry Post**, the totem notable. The
  totem chain is the shortcut from `toBlood.c` into the Strider's physical row.
- **Late verdict.** Thin. Vampiric Strikes and Bloodletter are leech twins, but from about p70 it is generic
  defences.

### R6 (extra) Two-handed sword crit (Keen Edge, Fencer's Eye, two-hander lines)

- **p10:** sig.a, Quickened Steel, hubs.w, Stout Heart, Keen Edge (p9), j1. **p20:** + Hewing (for its two-hander
  lines; the axe half is wasted), the star's cold spoke, Four Winds, Fencer's Eye (p20).
- **p40:** + Field Dressing, Thunderstep (Wall), Guarded, Fighting Breath, Killing Pace, Elemental Edge.
- **p60:** + Headsman (half wasted again), Barrows e3–e1, Heavy Hands, Unbloodied, Standard Bearer. Str 196, dex 126
  against 91/77.
- **p90:** + Barrow Ward, Well Rounded, Weaving, Sidestep, Red Harvest (through spell-block smalls), Vampiric Strikes,
  Iron Liturgy (passed), Greatweight. 289/169 against 119/131.

Decision log:

- **MISSING.** There is no notable that pairs swords with two-handers. The two-handed sword collects Keen Edge (any
  sword), Fencer's Eye (sword crit) and then the axe-and-two-hander notables (Hewing, Headsman), half of whose lines it
  cannot use, plus the Wall's two-hander nodes. 59 of 121 points are Wall nodes.
- **INTERESTING (p9–29).** Guarded (armour) and Fencer's Eye (crit) both pull at the sword player. But Guarded is 3
  points from Keen Edge and Fencer's Eye 8, so a sword build takes both. The trade the Guarded why describes ("armour by
  the swords or crit by the elements") no longer exists: Fencer's Eye sits by the Shieldwall spur, not by the elements.
- **BORING (p44–48, p80–88).** The Barrows road and the north and west strength roads again.

---

## Strider walks [user region]

The start is good, and the user's edits make it so. Point 1 is a side. Point 2 is Hawk's Eye. Long Breath costs 2 more
(`sig.a ↔ life.b`) and Clear Head 2 more (`sig.b ↔ n404`). Vital Aim and Wayfarer are 5 out. Every build has life, mana
and a first defence by p20 without choosing a weapon. No complaints here.

### S1 Crit bow (Longbow, Vital Aim, Killing Eye, Quiet Shot)

- **p10:** sig.a, Hawk's Eye, Long Breath, hubs.n, jb3, the bows hub, wheel e, a1, a2. Dex 92 against bow 38.
- **p20:** + Longbow (p11), Vital Aim (p16), Clear Head, Wayfarer smalls. 112 against 65.
- **p40:** + Wayfarer, Quick Hands, True Aim, Far Flight, Split Volley, Rapid Fire, Quick Sip smalls. **212 against 107.**
- **p60:** + **Quick Sip (passed)**, Killing Eye (p42), Weathered, Steady Draw, Skewer, the Knife road, **Trapper
  (passed, p58)**. 270 against 152.
- **p90:** + Quiet Shot (p62), Mercy Stroke, Cruel Agony, Hard Target, Fleet Foot, Wanderer, Quick March, Arrow Weave,
  Snakeskin, Soft Step, Keen Instinct. 342 against 212.
- **p122:** FILL (the cheapest reachable notables, not recommendations): Elemental Fletching, Second Curse, Thick Blood, Flashes of Insight (Spire), Ricochet, Heavy Draw,
  Spoils, Frugal, Weaving, Sidestep, Hot Blood.

Decision log:

- **ONE-STOP (p11–42).** 11 wanted notables in 40 points, with nothing passed but flask smalls. Projectile, speed,
  accuracy and crit are all on the region's own rim. The 10-19 audit's §1.1 finding is **still present**.
- **COPY.** **Vital Aim** (`bow.home.crit.n`) and **Killing Eye** (`bow.quiver.added.n440`) carry identical lines (+30%
  multiplier, 20% crit). The crit bow takes both and chooses nothing. §5.1 says spreading two copies of one pairing is
  not a choice. **Killing Eye ↔ Quick Sip** are directly linked, so a notable sits a step from a notable.
- **PAIR.** **Quick Hands and True Aim** are 2 apart with the same pairing (speed, accuracy, +20 dex). Still present.
- **FORCED (p52–58), fair.** Quiet Shot is reached from the Strider only through the Knife's trap/claw wheel, past
  Trapper or Carrion Claws (`knife.snares.wheel.t3`/`t5`), or round by `knife.venom.j5`. It is about 12 points from
  `bow.flight.road.jp1`. A different notable on the way is §5.5's fair price, and the reward (Quiet Shot, Mercy Stroke
  and Cruel Agony within 7 points) makes the Knife the crit bow's real late game.
- **Late verdict.** Satisfying from p50 to p90: crossing into the Knife for multiplier and a crit keystone is the kind
  of trade the tree is for. After p90 it is filler in three regions.
- **Attributes.** Dexterity is at twice the bow's ask by p40.

### S2 Bleed bow (Barbed Arrows, Deep Cuts)

- **p10:** sig.a, Hawk's Eye, Long Breath, hubs.s, Wayfarer, jt1. **p20:** + `yard.dual.j2` (a Yard node is the way
  south), `hub.t`, jt3, Thirsty Quiver, Deep Cuts (p18).
- **p40:** + jq3, hub.p, jp3, `steel.wheel.e`, Barbed Arrows (p26), Clear Head, Rapid Fire, Longbow. 189 against 107.
- **p60:** + Heavy Draw, Weathered, Twin Fangs' evasion smalls, Iron Draw (Yard), **Steel Rim (passed)**, Open Veins.
- **p90:** + **Standard Bearer (passed)**, Executioner, Wound Dance, Quick Hands, True Aim, Vital Aim, Hard Target,
  Split Volley, Far Flight, Red Harvest, Quick Sip. 331 against 212.

Decision log:

- **INTERESTING.** Deep Cuts (p18) and Barbed Arrows (p26) are 8 points apart with different partners (physical, and
  bleed chance with faster bleeding). The bow's bleed is a real pair of twins now.
- **JANK [user].** Barbed Arrows (`bow.quiver.wheel.n1`) and Heavy Draw (`bow.steel.wheel.n2`) both hang off
  `bow.steel.wheel.e`. A bleed bow wants both, and they share one door. The wheel's why ("closed ring of eight") is
  stale, as the 10-19 audit said.
- **INTERESTING (p44–67).** Crossing into the Yard's Pits for Open Veins, Executioner and Wound Dance is the best
  cross-region late game in these walks. The bow gives up its own projectile notables (Split Volley and Far Flight wait
  until p82–84) to get bleed stacking.
- **FORCED (p52–54).** From Iron Draw, the Pits are reached through **Steel Rim**, a shield notable. The other way in,
  the dear road `bow.steel.toBlood`, costs 5 bare attribute nodes.
- **PASS (p61).** Standard Bearer again, on the way to Executioner.

### S3 Bow totem (Sentry Post)

- Sentry Post at p20 (through Thirsty Quiver, which is wanted anyway). Then generic bow: Longbow, Rapid Fire, Heavy
  Draw, Far Flight, Split Volley, Deep Cuts, Steady Draw.
- **p60–65:** the second totem notable, **Standing Cairns** (Wall), costs 15 points from `yard.dual.j2`, passing **Iron
  Draw** and **Light Blades**.
- Decision log: **thin identity.** The Strider has one totem notable. The next is 15 or more steps away through two
  weapon notables of other kinds, and Idle Hands is 27 steps from the start. After p20 the bow totem plays like any bow.
  Medium-low: totems are optional, but the build has nothing to decide.

### S4 Dexterity sword with an evasion shield (Fleet Blade)

- **p10–11:** sig.a, Hawk's Eye, Long Breath, hubs.n, the bows road, wheel e, 2 sword smalls, Fleet Blade (p11).
- **p20:** + `life.a`, the one-hand smalls `n435`/`n434`, Light Hand, the mana smalls, Round Shield, Wanderer. Dex 112
  against sabre 62 and evasion shield 44.
- **p40:** + Clear Head, Wayfarer, Quick Hands, Vital Aim, `yard.dual.j2`, **Twin Fangs (passed, p35)**, Buckler,
  Weaving. 179 against 101/74.
- **p60:** + Sidestep, Hard Target, Fleet Foot, Weathered, **Iron Draw (passed, p52)**, Light Blades, Keen Edge. 193
  against 158/112.
- **p90 (L70):** + Steel Rim, Four Winds, Fencer's Eye, ... 273 against sabre 212 and shield 159. This is the tightest
  Strider case, and it is still fine.

Decision log:

- **INTERESTING (p11–19).** Fleet Blade (`bow.bows.wheel.n2`) against Longbow is a real weapon fork, and the user's
  one-hand chain (`n435`, `n434`, Light Hand) plus the shield chain (`n437`, `n438`, Round Shield) give a sword-and-board
  Strider a home. Fleet Blade is a dead-end tip 7 steps from Light Hand, so the sword player walks the bows road to
  reach it.
- **JANK (p35).** The cheapest way from the gate to Buckler passes **Twin Fangs** (`j2 → twinFangs.n1 → twinFangs.b →
block.n`). This is the mirror of R1: a shield player pays the dual notable.
- **FORCED (p51–55).** The Strider's way into the Yard's west (swords, Muster) is **Iron Draw**: all four bow nodes and
  the notable (`ironDraw.a → n → b → c → shield.hub`).
- **Late verdict.** 64 of 123 points are Reaver nodes. That is a legitimate cross-build, but the Strider's sword is one
  notable (Fleet Blade) plus Light Hand. The rest of its sword is the Yard's.

### S5 Projectile bow (Split Volley, Far Flight, Skewer, Ricochet)

- **p10:** Hawk's Eye, Long Breath, the string, Quick Hands, True Aim. **p20:** + Split Volley (p15), Far Flight (p17),
  Clear Head.
- **p40:** + Wayfarer, Skewer (p27), Rapid Fire (p29), Quick Sip (p31), Weathered, Heavy Draw (p39). **p41:**
  Ricochet.
- **p60–90:** Longbow, Arrow Weave, Vital Aim, Killing Eye, Hard Target, Fleet Foot, Steady Draw, Wanderer, Veiled
  Herald (Knife), **Carrion Claws (passed)**, Quiet Shot.

Decision log:

- **ONE-STOP (p15–41).** Split Volley and Far Flight sit on one ring (4 points for both). Skewer is 3 points from Split
  Volley, Rapid Fire 2 from Skewer, Quick Sip between them, and Ricochet 2 from Heavy Draw. Every projectile notable in
  the game is done by p41 with nothing given up. The 10-19 headline is **still present**, and Ricochet
  (`bow.flight.ricochet.n`, added 2026-10-19) adds to the same rim.
- **JANK.** The Knife's road `knife.snares.toRicochet.r1–r4` lands on the **Ricochet notable** itself, so the notable is
  a road end, a crossroads of 3. **Veiled Herald** (`knife.snares.herald.n`) is a dead-end pocket off `toRicochet.r3`,
  2 steps from Ricochet: a fine late pick for a herald bow (p68), but the stretch r4, r3, herald.a, herald.b has no
  branch.

### S6 (extra) Elemental bow (Elemental Fletching, Longbow, Elemental Edge)

- Elemental Fletching at p7. The route is `sig.a → life.b → Long Breath → elements.a → b → n`: the life notable is the
  door to the elemental pocket (`life.n ↔ elements.a` **[user]**).
- The rest of the region is generic bow by p50.
- The second elemental-attack cluster, Elemental Edge (Yard), arrives at p88 after about 25 points, passing **Keen
  Edge** and **Hewing**. Static Edge (Knife lightning) is reached past **Festering** (poison).
- Decision log: twin distance is fine, but there is **no cold, fire or lightning bow cluster** anywhere. The elemental
  bow has one notable at home and nothing to decide afterward. Dexterity reaches 445 at p123 against a 222 ask.

---

## Cross-region walks

### X1 Reaver bow (Iron Draw) heading into the Strider

- **p10–12:** sig.b, Quickened Steel, hubs.e, road east, Fighting Breath, then **Weaving** (the wheel's j1 side), j1,
  Iron Draw (p12).
- **p20:** + Sidestep, the star, Four Winds, `twinFangs.c`, `j2`. **p23:** Vital Aim, 3 steps past the gate by the
  `n414`/`n413` crit smalls.
- **p40:** + Hawk's Eye, Long Breath, Wayfarer, Thirsty Quiver. Dex 173 against bow 107.
- **p60:** + Rapid Fire, Weathered, Quick Hands, True Aim, Far Flight, Split Volley. Dex **293** against 152.
- **p90:** + Heavy Draw, Longbow, Killing Eye, Steady Draw, Stout Heart, **Steel Rim (passed)**, Red Harvest.

Decision log:

- **INTERESTING.** The Reaver bow works and crosses early. Iron Draw at p12 and Vital Aim at p23 make a cheap, natural
  cross. Dexterity is never short: the Strider's +20 nodes cover the 212 to 222 bow by about p50.
- **Concern.** From p23 the Reaver bow is a Strider with a Reaver start (77 of 123 points are Strider nodes). The Yard
  gives Iron Draw and evasion. That is acceptable for a cross-build, but it shows how cheap the gate is (finding 4).

### X2 Strider dual wielder heading into the Yard (Hot Blood, Twin Fangs)

- **p9:** **Twin Fangs**, by sig.b, Hawk's Eye, hubs.s, Wayfarer, jt1, `yard.dual.j2`, Twin Fangs. The Strider reaches
  the Reaver's dual notable faster than the Reaver does (Strider start → Twin Fangs is 5 steps; Reaver start → Twin
  Fangs is 6).
- **p20:** + Long Breath, Weaving, Sidestep, Hot Blood. **p24:** Crossed Blades. The whole dual kit is done 7 points
  sooner than in R1 (p31).
- **p40:** + Clear Head, Vital Aim, Light Hand, Fleet Blade. **p60:** + Wanderer, Quick Hands, Weathered, Red Harvest,
  **Iron Draw (passed)**, Light Blades. Dex 237 against sabre 158. **Hybrid swords are out of reach**: at L70 it has
  str 66 against an ask of 119.
- The Hot Blood bridge (`yard.dual.hotBlood.b ↔ bow.steel.toBlood.b`) was not needed: through `j2` it costs the same
  (7 from `bow.home.hubs.s` either way), so it adds a loop but no decision.

Decision log:

- **JANK / IDENTITY.** The Lists is the Strider's porch. `yard.dual.j2.a` has six links, and four of them are Strider
  chains (`bow.home.added.n414`, `bow.steel.road.jt1`, `bow.steel.hub.t`, `bow.steel.added.n409`). Strider start → j2 is
  4 steps, against 7 from the Reaver start. Twin Fangs is directly on j2 (`twinFangs.n1 ↔ j2.a`).

---

## Findings, ranked by severity

**How far the fixes go.** Link cuts are checked for connectivity: each one leaves its nodes reachable another way.
Added roads are not checked against §11.2 (no crossings, no unlinked nodes within 100 units). Two of them would break
it as stated:

- A straight `yard.dual.j1.a (640,2080) → yard.shield.hub.a (-80,2000)` road runs within about 100 units of all four
  Iron Draw nodes.
- `hewing.b → toHeadsman.r1` passes about 90 units from `elementalEdge.a`.

So the road fixes say what the decision should be, not where the node goes. §16 already says the Yard needs re-laying
rather than patching.

1. **High: one-stop shops (§1.1).**
   - **Sword and board (R4):** 13 wanted notables and the keystone in 40 points, nothing unwanted passed. Fixes:
     - Re-line or move **Shield Catch** (`yard.shield.steelRim.n2`) so the wheel is shield against something else.
       For example, n2 becomes one-handed damage with armour, and spell block with life on block moves next to the
       Wall's Bracing or onto the Shield Bash chain.
     - Cut `yard.blades.keenEdge.c ↔ yard.blades.lightBlades.a`, so Keen Edge and Light Blades are 5 or more apart
       through `blades.j1`.
     - Cut `yard.shield.fencer.n ↔ yard.shield.shieldwall.b`, so the sword crit is not a step from the block
       keystone's spur.
   - **Leech (R5):** Red Harvest, Crimson Pact and Thirsting Blade all hang off `yard.blood.j2.a`. Fix: move Thirsting
     Blade (`yard.blood.thirst`) to the north-east, for example off `yard.dual.toSidestep.a` or by Fighting Breath,
     whose mana line it shares. Then the leech player chooses between life leech by the keystone and mana leech by the
     Lists. Two cautions:
     - Thirsting Blade's why records a move on 2026-10-20 to stop Crimson Pact being a through-route. Do not undo that.
     - Placing it next to Fighting Breath could make a second mana one-stop there.
   - **[user] Bow and projectile (S1, S5):** Split Volley, Far Flight, Skewer, Rapid Fire and Ricochet on one rim; Vital
     Aim = Killing Eye; Quick Hands and True Aim. The 10-19 proposals in `audit/audit-tradeoffs.md` still apply.
     Additionally:
     - Give Killing Eye (`bow.quiver.added.n440`) a partner other than generic crit, for example crit with bleed (it
       sits by the bleed wheel) or crit with flasks.
     - Cut `bow.quiver.quickSip.n ↔ bow.quiver.added.n440` and `bow.string.hardTarget.n ↔ bow.string.speed.ff` (both
       are notable-to-notable links).

2. **High: the Yard's main routes run through clusters that only one kind of build wants.** CONSTRAINTS §16 already
   says the Yard needs re-laying, and these walks show what that costs:
   - **Iron Draw is the east–west road.** `yard.dual.ironDraw` a, n, b, c is the cheap link between `yard.dual.j1.a`
     and `yard.shield.hub.a`. Every Strider melee and totem build passed it: S4 p51–54, X2 p53–56, S3 p54–57. Fix: a
     +7/+7 road node `j1 → road → hub`, with Iron Draw a pocket off it. Keep `toIronDraw` to Steel Rim as Iron Draw's
     second door.
   - **The Steel Rim wheel is the north–south road.** From the hub to the Pits a build takes `steelRim.d`/`c` (spell
     block), Steel Rim or Shield Catch: R5 p16–17, S2 p52–54, X1 p82–84, R6 p73–74. Fix: a road node between
     `yard.shield.j2.a` and `yard.shield.j1.a` under the wheel, so the wheel becomes optional.
   - **The Shieldwall spur is a road.** `yard.shield.shieldwall.a/b/c` (block smalls) link Elemental Edge
     (`shieldwall.c`), Executioner (`shieldwall.c`) and Fencer's Eye (`shieldwall.b`). The keystone spur is a 4-way
     crossroads (against §9.1). The two-handed axe bought both block smalls at p42–43, and the dual wielder at p65–66.
     Fix: cut those three links and join `elementalEdge.n → executioner.a` and Fencer's Eye to the chain by a
     strength/dexterity road node.
   - **Hewing's only way on is Elemental Edge** (R2 p14–16, R3 p13–15). Fix: a road node from `hewing.b` or `blades.j1`
     to `toHeadsman.r1`, so Elemental Edge is a pocket beside the axe road.

3. **Medium: attributes are oversupplied in every walk**, and nothing in these two classes is gated by them.

   Two caveats cut against this:
   - The network is about 1,040 nodes and is meant to grow toward 1,500. More clusters means fewer late points spent
     on attribute roads, so part of this surplus shrinks on its own. §16 says to check supply at final size.
   - Dexterity is not dead weight: it feeds evasion and accuracy.

   The numbers are still worth having:

   | Build                       | Snapshot | Has           | Gear asks     |
   | --------------------------- | -------- | ------------- | ------------- |
   | Pure Strider bows           | p40      | 172–212 dex   | 107           |
   | Pure Strider bows           | p60      | 222–277 dex   | 152           |
   | Pure Strider bows           | p90      | 313–393 dex   | 212           |
   | Pure Strider bows           | p123     | up to 445 dex | 222           |
   | Reaver two-handers (R3, R6) | p90      | 289–306 str   | 158           |
   | Sword and board (R4)        | p90      | 259/239       | 159 / 119–122 |

   The only near-limit case is R5 at p60 (str 121 against an armour shield's 114), because its route skipped both hubs.
   The Strider is the main source:
   - +20 Dex on Hawk's Eye, Quick Hands, True Aim and Far Flight (4 notables every bow takes).
   - Two +20 hubs.
   - `bow.steel.added.n442`, a +20 Dex small.

   The part that will not shrink with growth is the +20 Dex on notables every bow takes. Fix [user]: drop the +20 Dex
   from True Aim, Quick Hands and Far Flight, and make n442 a +10 road node. That is about
   −70 dex, which still meets 222 by p75. On the Yard side, Quickened Steel's +10/+10 and the +15/+15 hubs are fine; the
   surplus is the +7/+7 everywhere. This is CONSTRAINTS §16's open item, and these walks say "too much".

4. **Medium: the Lists is the Strider's porch (identity).** The gate's why says the user moved it and placed their
   four Strider chains around it, so this is intended. This finding is about the consequence. It costs 4 steps from the Strider to `yard.dual.j2.a`
   against 7 from the Reaver. Twin Fangs is 5 against 6 and Sidestep 7 against 9. The X2 Strider had the full dual kit
   at p24, against the Reaver's p31.

   Fix:
   - Cut `yard.dual.twinFangs.n1 ↔ yard.dual.j2.a`, so the gate enters the wheel at `twinFangs.c`.
   - [user] Drop one or two of the redundant Strider links into j2 (`bow.home.added.n414 ↔ j2` and
     `bow.steel.added.n409 ↔ j2`). Both duplicate `jt1` and `hub.t`. Vital Aim and Wayfarer would still be bridges,
     landing on `jt1` instead.

5. **Medium: Buckler and Twin Fangs are each other's door.** The link `yard.home.block.n ↔ yard.dual.twinFangs.b` makes
   the cheapest hub → Twin Fangs route pass Buckler (R1 p7), and the cheapest gate → Buckler route pass Twin Fangs (S4
   p35). Fix: cut it (Buckler keeps `roadE.a`; Twin Fangs keeps `twinFangs.a` and `j2`). Then the shield-or-dual choice
   is made by which pocket you walk to.

   Also the Twin Fangs/Weaving wheel: Weaving is one step from `twinFangs.a`, so both cost 4 points. Fix: move Weaving
   to sit between `twinFangs.d` and a new evasion small, so each side is 2 smalls and a notable. Both then cost 6 and the
   exit decides.

6. **Medium: there is no two-handed home in the Yard after Hewing.** R3 spent 84 of 123 points in the Wall and R6 59
   of 121. Hewing and Headsman are twins with the same pairing (axe with two-hander), and neither suits a two-handed
   sword or a one-handed axe. Fix:
   - Make Hewing the one-handed and two-handed **axe with bleed** (drop the two-handed lines R2 wastes).
   - Make Headsman **two-handed with stun** (drop the axe lines), so the two-handed sword can use it.
   - Consider bringing Heavy Hands (two-handed speed, a dexterity line) into the Yard, as the 10-19 audit proposed.

7. **Medium: the Barrows road is the longest filler the Reaver walks meet.**
   - `wall.grit.east.e6–e8` and `e1–e2` have nothing branching: R2 p48–53, R3 p30–36, R4 p73–78, R6 p44–48.
   - `yard.blades.toHeadsman.r3` lands on the **Headsman notable** (`wall.grit.headsman.n`), which makes a notable a
     road end.

   Fix: land r3 on `headsman.b` or `east.e3`, and hang a pocket off `east.e7`. The pocket is a Wall-side change, so
   check it against the Vanguard audit. That pocket would be the Yard's half of
   the Barrows, for example a two-handed sword or armour-and-evasion pocket.

8. **Medium: Shield Bash is a dead end with a tail.** `yard.shield.shieldBash.b` has one link (to the notable). Its why
   says it exits to the keystone spur, and no such link exists. Fix: remove `b`, so the pocket is `toWall.a → a → n`, or
   link `b` to `yard.blood.j3.a` so the chain is a bridge as its why intended. Then rewrite the why.

9. **Medium-low: the dear road's shortcut into the Strider is the totem chain.** From `bow.steel.toBlood.c`, the
   cheapest way to Thirsty Quiver and Deep Cuts passes **Sentry Post** (R2 p84–87, R5 p40–42). Cutting the Plated Hide
   loop would not help. Fix [user]: let Sentry Post hang as a pocket off `toBlood.c` (drop `sentryPost.a ↔
thirstyQuiver.n`), or accept it as §5.5's fair price, which is defensible since it is one notable.

10. **Medium-low: Standard Bearer and Executioner.** Standard Bearer (`yard.shield.standard.n`) is a 3-way crossroads,
    and every route from the Pits' west junction to Executioner passes it (S2 p61). The two are 2 apart. It is fine for
    an aura bleed build, but it adds to the Muster/Pits density.

11. **Low [user]: the user's added nodes in the Strider.**
    - Round Shield (`bow.flight.added.n432`) is mana regeneration, area and shield defences: three unrelated lines.
    - Long Breath is the door to the elemental pocket (`bow.home.life.n ↔ bow.bows.elements.a`).
    - Weathered (`bow.steel.added.n416`) is a 5-way crossroads notable.
    - Hatchet Work (`bow.steel.added.n407`) is an axe notable in a dexterity region. Axes ask 163 to 167 strength, so
      only a Reaver crossing used it (R2 p95).
    - Barbed Arrows and Heavy Draw share `bow.steel.wheel.e`, and the wheel whys are stale.

    These are all still present from the 10-19 audit except Hatchet Work's attribute point, which is new.

12. **Low: the render.**
    - Field Dressing (`yard.home.fieldDressing.n`, −670,1380) and Guarded (`yard.blades.guarded.n`, −743,1452) are about
      102 units apart, and their labels collide in D-reaver.
    - Standard Bearer, Fencer's Eye, Executioner and Open Veins pile up in D-reaver and D-all-nodes.
    - Plated Hide (1220,2570) and Sentry Post (1380,2560) labels overlap in D-strider.
    - Thirsty Quiver, Deep Cuts and Hatchet Work crowd each other.
    - Longbow and Fleet Blade labels touch.
    - In D-all-nodes, Keen Edge's label sits on the Wall's Standing Cairns, and Field Dressing's on Guarded.

**Verified as working since 10-19:**

- The Headsman road gives the axe its second notable at 7 points (R3).
- The Steel Rim triangle cut leaves Crossed Blades → Red Harvest a 3-point road with a choice.
- The Barbed Arrows/Deep Cuts separation makes real bleed twins.
- Fleet Blade against Longbow is a real weapon fork.
- The Knife roads make the crit bow's late game satisfying (Quiet Shot, Mercy Stroke, Cruel Agony).
- The Hot Blood bridge works but changed no walk: it is cost-neutral with the j2 route.
- The Hedge Magic bridge was not exercised: no spell build was walked.
