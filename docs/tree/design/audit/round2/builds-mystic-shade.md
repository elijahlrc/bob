# Build walks: the Mystic (Spire) and the Shade (Knife)

> Copied into the repo on 2026-10-20 from the session scratchpad. The walk scripts and raw outputs it mentions stayed there. Fixes applied after this audit are listed in `../../E-round2.md`.

Audit of 2026-10-20, read-only. Tree as built by `buildAll({ allowNew: true })` (edits.json applied), 918 nodes; Spire 174
nodes / 34 notables / 5 keystones, Knife 114 / 22 / 5. Renders looked at: D-mystic(.png, -text), D-shade(.png, -text),
D-all-nodes.

Files in this folder:

- `builds.ts`: the 13 walks as ordered step lists (a step is reached by the cheapest path from what is already bought, so
  intermediate steps pin the route a player would choose).
- `sim.ts`: runs them (`npx tsx sim.ts x [M1]` from E:/Proj/Auto); `walks.txt`: the full point-by-point output with
  running attributes.
- `frontier.ts` (notables within K steps of a bought set), `through.ts`, `midbridge.ts` (notables that sit mid-route),
  `dump.ts` / `dump.txt` (every node, text, coordinates, distance from both starts).

## Method and the gear yardstick

Points to level: 1 point per level plus 3 at maps 10, 20 … 80 (`run.ts:377`), level about map. So **@10 ≈ L9, @20 ≈ L17,
@40 ≈ L31, @60 ≈ L48, @90 ≈ L69, @123 = L99.** Requirements at those levels (from `ITEM_BASES`):

| Snapshot  | Wand (int)           | Dagger (dex/int)            | Claw (dex/int)            | Body armour, any one attribute |
| --------- | -------------------- | --------------------------- | ------------------------- | ------------------------------ |
| @20 (L17) | 65 (Prism Wand L18)  | 30/30 (L15), 31/45 (L20)    | 39/27 (L17)               | ~50                            |
| @40 (L31) | 119 (Ember Reed L30) | 64/44 (L30), 36/78 (L32)    | 61/61 (L34)               | ~85-104                        |
| @60 (L48) | 146-158 (L45-49)     | 83/99 (L51), 51/110 (L47)   | 80/80 (L46), 69/100 (L49) | ~130-160                       |
| @90 (L69) | 237-245 (L68-70)     | 121/121 (L70), 76/149 (L68) | 113/113 (L70)             | ~194                           |

Gems ask at most 98 of one attribute (59/59 hybrid) at gem level 20 (`calc/gems.ts`).

Class bases: Mystic s14 d14 i32; Shade s14 d23 i23. An attribute point is worth little beyond requirements: 1 int =
0.5 mana and 0.2% ES (`constants.ts`), so a +10 int node is about two-fifths of a 5%-ES small.

"Player order" rules used: before a gem (points 1-3) generic stats; then the build's first notable by the route a player
would see; good things on the way; no notable bought just to pad unless noted. Walks that end short of 123 say so; their
last 5-10 points were padding toward the nearest unclaimed notable and are not counted as choices.

### All snapshots (attributes including class base)

Walks that stop short of 123 are shown at their last point.

| Build                                      | @10        | @20        | @40           | @60           | @90           | @123             |
| ------------------------------------------ | ---------- | ---------- | ------------- | ------------- | ------------- | ---------------- |
| M1 ES cold                                 | i102       | i142       | i202          | i252          | s42 i320      | s56 d70 i470     |
| M2 crit lightning                          | i102       | i142       | i172          | d42 i210      | s28 d105 i317 | s28 d225 i437    |
| M3 wand attack                             | i102       | i112       | d60 i188      | d161 i209     | d202 i270     | d350 i308        |
| M4 curse/aura                              | i102       | i122       | d28 i166      | d28 i196      | s35 d63 i282  | s35 d108 i347    |
| M5 Mystic→Knife                            | i102       | d21 i129   | d28 i196      | d70 i248      | d84 i312      | d105 i383 (@120) |
| M6 fire DoT                                | i102       | i122       | i182          | i252          | s28 i286      | s73 i401 (@122)  |
| S1 crit dagger                             | d69 i69    | d83 i83    | s21 d195 i118 | s28 d230 i146 | s35 d306 i215 | s35 d333 i242    |
| S2 poison claw                             | d69 i69    | d90 i90    | d142 i132     | d178 i178     | s28 d299 i225 | s28 d343 i239    |
| S3 trap/mine                               | d69 i69    | d97 i97    | d170 i160     | d201 i211     | d208 i308     | d297 i337 (@121) |
| S4 dagger caster                           | d62 i62    | d98 i118   | d119 i149     | d140 i220     | d171 i281     | d218 i298 (@121) |
| S5 dodge                                   | d69 i69    | d83 i83    | d142 i132     | d201 i181     | s35 d309 i208 | s35 d373 i232    |
| S6 Shade→Spire                             | d69 i69    | d69 i89    | d104 i144     | **d104** i214 | **d104** i244 | d147 i347        |
| S7 ES leech                                | d69 i69    | d90 i90    | d132 i202     | d153 i253     | s21 d265 i288 | s35 d321 i310    |
| **Need** (wand int / dagger, claw dex·int) | 47 / 18·26 | 65 / 30·30 | 119 / 64·44   | 158 / 83·99   | 245 / 121·121 | 245 / 121·121    |

Mystic omitted values are s14 d14; Shade omitted values are s14.

Int reaches 245 at points 58 (M1), 59 (M6), 60 (M5), 74 (M4), 79 (M2) and 85 (M3). Every Shade walk except S6 passes
121/121 by @90, most by @60.

---

## M1. ES cold caster (Hoarfrost, Shatter, Glass Skin, Fever Pitch)

Notables by point: 2 First Light, 7 Warm Blood, 10 Glass Skin, 12 Spirit Ward, 21 Hoarfrost, 27 Shatter, 30 Quickening,
34 Sharp Mind, 36 Prism Ward, 39 Fever Pitch, 40 Siphon, 44 Arcane Focus, 46 Warded Mind, 51 Harsh Weather, 57 Quiet
Pulse, 61 Mana Tap, 66 Flashpoint, 68 Deep Well, 69 Still Mind, 71 Frugal, 73 Wandwork, 81 Hearthfire, 83 Litany, 85
Vigil, 89 Mist Walk, 97 Static Edge, 100 Spellslip, 104 Devotion, 105 Darting Bolts, 113 Homily, 117 Shelter.

| Snapshot | Attributes       | Need    | Taken since last                                                                                    |
| -------- | ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| @10      | s14 d14 **i102** | wand 47 | First Light, Warm Blood, Glass Skin                                                                 |
| @20      | i142             | 65      | Spirit Ward (forced), 4 int roads, 2 AoE smalls                                                     |
| @40      | i202             | 119     | Hoarfrost, Shatter, Quickening, Sharp Mind, Prism Ward, Fever Pitch, Siphon                         |
| @60      | i252             | 158     | Arcane Focus, Warded Mind, Harsh Weather, 3 elemental smalls, Quiet Pulse                           |
| @90      | s42 i320         | 245     | Mana Tap, Flashpoint, Deep Well, Still Mind, Frugal, Wandwork, Hearthfire, Litany, Vigil, Mist Walk |
| @123     | s56 d70 **i470** | 245     | Static Edge, Spellslip, Devotion, Darting Bolts, Homily, Shelter                                    |

Decision log:

- **1-10 INTERESTING (mild).** W or E out of the mirrored home: Glass Skin (`spire.well.deepWell.n2`, 7 out) or Warded
  Mind (`spire.craft.focus.n2`, 7 out) for ES. Same pairing either side (see finding 9), so the choice is mostly "which
  side do I go north from".
- **11-13 FORCED.** The short way north from Glass Skin is `spiritWard.a → Spirit Ward → spiritWard.b → column.j1.a`: a
  shield notable on the road. The detour without it is 6 nodes via Warm Blood and `craft.roadN`. Took Spirit Ward with
  no shield.
- **14-20 INTERESTING / BORING.** To Hoarfrost from `column.j1.a`: road (`broadWeave.a`, `broadWeave.c`, `fork.a`,
  `column.roadW.a/b`, 4 int + 2 AoE smalls) or the notable path (`Broad Weave`, `Withering`, same 7 points). Equal
  price, real choice, but the road option is 6 nodes the build does not want. **The first cold node is point 20**
  (`fire.hoarfrost.a`, dM 16); the reference's nearest notables are 4 out and its off-attribute nodes 8-11 out.
- **22-27 BORING.** `hoarfrost.c → frost.jFire.a → toShatter.r1 → r2 → shatter.b → Shatter`: 3 int roads with nothing
  branching except the Prismatic spur.
- **37-39 TRAP for others, fine here.** Fever Pitch (`frost.feverPitch.k`) hangs off the Shatter notable, not a
  junction. For this build Shatter is wanted. Sharp Mind's +15% spell multiplier is wasted under Fever Pitch (multiplier
  fixed at 100%): a real trade, correctly placed.
- **28-30, 40 JANK (no trade-off).** Quickening (`well.recharge.n`) is 3 steps from Glass Skin and Siphon 3 more; every ES
  build takes Glass Skin + Quickening + Siphon + Warded Mind. Four ES notables inside a 10-node radius.
- **52-54.** Three `frost.prismatic` elemental smalls on a keystone spur, stopping short of Prismatic Balance: good
  value, legal.
- **61-73 BORING (sustain filler).** Mana Tap, Deep Well, Still Mind, Frugal, Wandwork: five mana/cost notables, because
  nothing cold or ES remains within 8 steps.
- **74-85 FORCED.** To Litany/Vigil the Spire route is `well.toCathedral.a/b → hymn.b → roadE.a/b → jT.a → nave.wheel.n6 →
Hearthfire (cathedral.nave.wheel.n5) → star.w / vigil.a`: a fire notable stands between the Spire and both
  defensive notables. The other route (choir) passes Shepherd (minions).
- **90-97 FORCED/JANK.** Static Edge for crit chance: `storm.jArm.a → painConduit.a → painConduit.b →
knife.hex.toSpire.b → toSpire.a → j4.a → static`: the two Pain Conduit spur smalls ("6% damage on low life") are the
  road. See finding 1.
- **106-113 BORING.** Homily (`cathedral.crypt.wheel.m3`) costs 4 bare `well.toCrypt` roads + 3 crypt smalls (spell
  block, ES, spell): 8 points for one 16%-spell notable.

Late points (60-123): Mana sustain (5 notables), Cathedral defence behind a fire notable (3), dodge (Mist Walk,
Spellslip), Static Edge, Homily, Shelter. 26 of the 63 are attribute nodes worth ~2% ES each. **No cold node exists past
point 27.** Not satisfying: the late game is defence and roads, with no decision that changes how the build kills.

## M2. Crit lightning (Thunderhead, Overcharge, Flashpoint, Sharp Mind, Pain Conduit)

Notables: 2 First Light, 5 Sharp Mind, 8 Warm Blood, 12 Arcane Focus, 17 Darting Bolts, 21 Thunderhead, 24 Flashpoint,
28 Overcharge, 29 Warded Mind, 31 Spirit Ward, 33 Glass Skin, 36 Pain Conduit, 40 Harsh Weather, 42 Prism Ward, 44
Frugal, 46 Mist Walk, 52 Static Edge, 56 Bloodletter, 59 Quickening, 61 Siphon, 67 Shepherd, 73 Homily, 76 Spellslip, 78
Festering, 82 Thick Blood, 92 Hedge Magic, 100 Vital Aim, 102 Shelter, then mana and Knife leftovers.

| Snapshot | Attributes    | Need |
| -------- | ------------- | ---- |
| @10      | i102          | 47   |
| @20      | i142          | 65   |
| @40      | i172          | 119  |
| @60      | d42 i210      | 158  |
| @90      | s28 d105 i317 | 245  |
| @123     | s28 d225 i437 | 245  |

- **1-5 INTERESTING.** E side: `sig.b` crit, First Light, hub, `roadE.a`, Sharp Mind at 5. A crit caster is committed at
  point 5 (before the first lightning node at 19). That is fine for a generic crit notable.
- **13-18 INTERESTING.** North via `craft.roadN` then `column.j1.a`: Darting Bolts (`column.dartingBolts.n`) sits on a
  3-node route to `fork.a`, as cheap as the `broadWeave` smalls. A projectile-spell player takes it; others take AoE.
- **19-28 JANK (one-stop).** Thunderhead (21), Flashpoint (24, on the route `jStorm → flashpoint.c → n → b →
storm.jArm`), Overcharge (28), then Pain Conduit (36) one spur off the same junction `storm.jArm.a`. The whole
  elemental-crit-lightning kit, keystone included, costs 15 points from Thunderhead. The only price is two fire smalls.
- **29-33 FORCED.** Glass Skin from the Column again goes through Spirit Ward.
- **34-36.** Pain Conduit: legal spur; the keystone has no cost on the sheet (already open in CONSTRAINTS §16).
- **INTERESTING (skipped).** Fever Pitch versus crit multiplier. The walk chose multiplier (Sharp Mind, Bloodletter,
  Mercy Stroke, Vital Aim). Had it chosen Fever Pitch it must buy Shatter: `frost.jArm.a → shatter.a → Shatter →
feverPitch.a/b/k`, a cold notable on the only road (finding 4).
- **47-56 FORCED.** Static Edge and Bloodletter via the Pain Conduit spur smalls (finding 1).
- **62-73 FORCED.** Homily by the choir: `well.draught.a/b` (flask smalls) → `choir.toSpire.a` → **Shepherd** (minions) →
  `choir.c8`, `c4` → `jC.a` → `crypt.m1`, `m2` → Homily. 12 points for one spell notable plus a minion notable.
- **76-82 FORCED.** Spellslip → Thick Blood from the north arm passes Festering (`knife.hex.wheel.n1`): a poison
  notable.
- **83-100 BORING.** Hedge Magic and Vital Aim by the centre ring: 9 ring/hub roads for 2 notables.

Late points: crit multiplier is spread over the Knife (Bloodletter, Mercy Stroke) and the Strider (Vital Aim), which is
the right shape. But reaching each costs 7-10 points of road, and the walk ate Shepherd and Festering on the way. Three
lightning notables exist in the whole tree (Thunderhead, Overcharge, Static Edge), all taken by point 52.

## M3. Wand attacker (Wand Volley; Wandwork is spell damage and does not apply)

Notables: 2 First Light, 5 Sharp Mind, 8 Warm Blood, 11 Warded Mind, 13 Arcane Focus, 15 Frugal, **18 Wand Volley**, 21
Flashes of Insight, 29 Keen Instinct, 37 Snakeskin, 42 Glass Skin, 48 Mercy Stroke, 55 Hawk's Eye, 60 Vital Aim, 66
Bloodletter, 72 Quiet Pulse, 75 Elemental Fletching, 79 Light Hand, 80 Wanderer, 84 Ricochet, 89 Prism Ward, 91
Quickening, 94 Fleet Foot, 95 Hard Target, 101 Far Flight, 103 Split Volley, 107 Quick Hands, 109 True Aim, 113 Rapid
Fire, 116 Thick Blood, 121 Shroud, 123 Long Breath (127 walked).

| Snapshot | Attributes | Need |
| -------- | ---------- | ---- |
| @20      | i112       | 65   |
| @40      | d60 i188   | 119  |
| @60      | d161 i209  | 158  |
| @90      | d202 i270  | 245  |

- **1-17 FORCED/TRAP.** The Mystic starts attacking with a wand (`classes.ts` startMods) but nothing within 12 steps helps
  an attack except `sig.b` (20% crit). Sharp Mind, Arcane Focus and First Light are spell lines. Wand Volley
  (`craft.wandVolley.n`) is at dM 13 and is the only wand-attack notable in the tree.
- **14-18 INTERESTING.** Into Wand Volley through Frugal (`frugal.a → n → b → wandVolley.a`) or `craft.j1.a →
frugal.b`: same price.
- **19-36 FORCED (leaves the region).** For attack speed and crit the build walks `craft.insight → toKnife → Knife hub
→ Keen Instinct → roadB` (3 attack-speed smalls). Of points 21-60, 31 are outside the Spire.
- **20-21 FORCED.** `craft.toKnife.a` hangs off `insight.c` (insight-duration small); the walk paid Flashes of Insight
  - `hexwright.a` en route.
- **49-60 BORING.** Hawk's Eye and Vital Aim through `bows.toKnife.a → jb3 → bow.home.hubs.n/s`: 4 bare dex roads.
- **96-113.** The Strider's projectile wheel (Far Flight, Split Volley), Quick Hands, True Aim: real late value for
  wand projectiles, all in another class's region 20+ steps out.

Late points: satisfying in content (projectiles, attack speed, elemental attacks), but every one is in the Strider or the
Knife. The Spire offers this build one notable. CONSTRAINTS §16 lists "single home for wand attacks" as open; this walk
measures the cost: 13 spell or defence notables before the first wand node, and 0 attack nodes in the Spire after it.

## M4. Curse/aura caster (Hexwright, Devotion, Mana Bastion)

Notables: 2 First Light, 8 Warm Blood, 11 Warded Mind, 13 Arcane Focus, 18 Hexwright, 22 Devotion, 27 Glass Skin, 30
Mana Bastion, 32 Frugal, 33 Flashes of Insight, 36 Thick Blood, 38 Second Curse, 41 Quickening, 44 Siphon, 47 Prism Ward,
52 Thunderhead, 56 Flashpoint, 60 Overcharge, 62 Mist Walk, 68 Spellslip, 72 Shroud, 78 Shepherd, 82 Choirmaster, 84
Vigil, 87 Litany, 88 Wandwork, 92 Hymn, 101 Veiled Herald, 104 Static Edge, 108 Harsh Weather, 111 Pain Conduit, then
mana leftovers.

Attributes: @20 i122, @40 d28 i166, @60 i196, @90 s35 d63 i282, @123 s35 d108 i347 (wand needs 65/119/158/245).

- **14-18.** Hexwright (`craft.hexwright.n`) at 18. Hexwright and Devotion are one road apart (`craft.toDevotion.a`):
  curse versus reservation, so not twins. But **`toDevotion.a` hangs off the Hexwright notable**: an aura build without
  curses reaches Devotion through Hexwright, or through Wand Volley (`toVolley.r1/r2` off `wandVolley.b`), or through
  Mist Walk's small. FORCED either way.
- **28-30.** Mana Bastion: spur off `craft.j1.a`. Legal and well placed.
- **33-38 FORCED, mixed.** Second Curse from Hexwright is 6 points either way: `insight.n` (Flashes of Insight is a
  junction notable) → `toAlleys.r1/r2` → **Thick Blood** → `jH.a` → Second Curse; or `hexwright.b → knife.hex.wheel.n →`
  **Festering** → `wheel.s → road.a → jH.a`. A real choice, but between two notables neither of which is the goal (one
  useful, one useless).
- **62-72.** Spellslip and Shroud, cheap from the north arm. Fine.
- **73-82 FORCED.** Choirmaster from the Spire: `well.draught.a/b → choir.toSpire.a →` **Shepherd** → minion and mana
  smalls → Choirmaster. 10 points, one minion notable.
- **93-101 FORCED small.** Veiled Herald: `snares.jT.a → wheel.t1 → t6` (claw small) `→ toRicochet.r1-r3 → herald`.
  9 points.

Late points: auras are spread across four regions (Devotion, Choirmaster, Veiled Herald, the Yard's Standard Bearer),
which is the intended shape. But each one is reached through another theme's notable. Only two curse notables exist in
the tree (Hexwright, Second Curse), both taken by 38.

## M5. Cross-region: Mystic into the Knife (curses, then chaos/DoT spells)

Notables: 12 Arcane Focus, 17 Hexwright, 18 Flashes of Insight, 21 Thick Blood, **23 Second Curse**, 28 Glass Skin, 29
Warded Mind, 34 Broad Weave, 37 Withering, 39 Darting Bolts, 42 Lingering, 46 Shroud, 52 Spellslip, 55 Static Edge, 59
Devotion, 62 Snakeskin, 68 Hollow Vessel, then ES, mana and Knife leftovers (120 points; the last 15 are padding).

Attributes: @20 d21 i129, @40 d28 i196, @60 d70 i248, @90 d84 i312.

- **12-23 INTERESTING, cheap.** Second Curse at 23: the Spire↔Knife crossing works and is short (6 from Hexwright).
  The price is Flashes of Insight (`spire.craft.insight.n`) on the road, because `craft.toAlleys.r1` hangs off it.
- **43-55.** The Knife's north arm (Shroud, Spellslip, Static Edge) is easier to reach from the Spire (`hexwright.b ↔
knife.hex.wheel.n`) than from the Shade's own start, which must pass Festering or Sapper.
- **Gap.** A chaos/poison _spell_ build finds nothing in the Knife: every poison line there is "with Attacks"
  (Festering, Barbed Point, Carrion Claws), and no notable anywhere gives chaos spell damage. Withering (`column.withering.n`,
  DoT and chaos-DoT multiplier) is the only chaos node for spells, and the gems include several chaos spells
  (`gemsGen.ts` lines 269, 468, 1124).

## M6. Extra: fire DoT / ignite caster (Cinder, Withering, Lingering)

Notables: 10 Glass Skin, 12 Deep Well, 14 Wandwork, 18 Quiet Pulse, 22 Mana Tap, **27 Cinder**, 29 Hoarfrost, 31
Withering, 35 Darting Bolts, 38 Lingering, 41 Flashpoint, 43 Familiars, then ES, Prism Ward, Broad Weave, Arcane Focus,
Mind Bulwark, Draught, Shepherd, Hearthfire, Vigil, Litany, Pain Conduit, Overcharge, Harsh Weather, then leftovers
(122 points).

Attributes: @20 i122, @40 i182, @60 i252, @90 s28 i286.

- **11-22 FORCED.** The west route to the fire arm runs `well.j1.a → quietPulse.a/b →` **Quiet Pulse** `→ toTap.a →
manaTap.a/b →` **Mana Tap** `→ fire.roadS.b`: two notables in the middle of the road (both useful, so cheap), then 3
  bare roads to `fire.jArm.a`.
- **27-31 JANK.** Cinder → Hoarfrost → Withering: `fire.jArm.a` links Cinder, Hoarfrost's small and Familiars' small;
  `hoarfrost.a` links `withering.n`. Withering and Hoarfrost are 2 steps apart, Cinder 3.
- **Cinder is the only ignite notable for spells.** Kindled Steel is the attack one. Fire DoT is Cinder + Withering +
  Lingering, all within 10 points of each other; the twin rule (§5.1, 2-3 clusters apart with different partners) is not
  met for ignite.
- **42-43 JANK.** The Cathedral crypt crossing (`cathedral.crypt.toSpire.b`) lands on Familiars (`fire.familiars.n`, a
  minion notable).

## S1. Crit dagger, dual wield (Fine Point, Mercy Stroke; Cruel Agony does not fit)

Notables: 2 Keen Instinct, 6 Soft Step, **10 Fine Point**, 17 Snakeskin, 23 Mercy Stroke, 26 Thick Blood, 29 Shroud, 39
Twin Fangs, 42 Festering, 47 Bloodletter, 51 Static Edge, 53 Barbed Point, 54 Quick March, 57 Vital Aim, 65 Crossed
Blades, 72 Tumble, 76 Light Hand, 77 Wanderer, 80 Fleet Foot, 81 Hard Target, 87 Shelter. After that, padding: Quiet
Knife, Spoils, Talon, Hawk's Eye, Long Breath, Nimble Gambit, then ES notables in the Spire (123 points).

| Snapshot | Attributes    | Need    |
| -------- | ------------- | ------- |
| @10      | d69 i69       | ~18/26  |
| @20      | d83 i83       | 30/30   |
| @40      | s21 d195 i118 | 64/44   |
| @60      | s28 d230 i146 | 83/99   |
| @90      | s35 d306 i215 | 121/121 |

- **1-10 INTERESTING.** The south side of the start: Soft Step pocket, `roadS` to `edge.j1.a`, then the edge wheel's
  dagger side (`w6 → Fine Point w5`) against the claw side (`w2 → Talon w3`). A real variant choice (§8.3).
- **11-15.** The rest of the wheel (`w8`, `w4` crit, `w1` crit) and the `home.roadB` attack-speed road back to Keen
  Instinct: good, and it closes a loop.
- **16-23 FORCED (useful).** Mercy Stroke's road is `edge.star.w → Snakeskin → star.s → snares.toBow.c → toBow.b →
mercy`: the resist star's notable is a through-node. Useful, so cheap.
- **30-39 BORING.** Twin Fangs (`yard.dual.twinFangs.n1`): `toRingS → ring r5-r9 → bow.home.hubs.s → bow.steel.road.jt1 →
yard.dual.j2.a`. 9 dex roads for one notable; a dear bridge by design.
- **40-47 FORCED/TRAP.** Bloodletter (`knife.hex.bloodletter.n`): from the Knife the only way north is the diamond
  `hex.wheel.s → {Festering | Sapper} → hex.wheel.n`. **A crit dagger build has to buy a poison or a mine notable.**
- **48-51.** Static Edge (lightning + 20% crit): crit chance is useful.
- **55-65 INTERESTING.** Late crit sources are spread over three regions: Vital Aim (Strider home), Crossed Blades (Yard
  dual), Mercy Stroke and Bloodletter (Knife). The right shape for a generic stat.

Late points: decent. The crit late game has real destinations in three regions, each costing 6-10 roads. Daggers
themselves end at point 10: Fine Point and Quiet Knife are the only dagger notables in the tree, 7 steps apart, both in
the Knife home. **Cruel Agony** (`knife.venom.cruelAgony.k`: crits deal 30% less hit damage) is a crit-ailment keystone
for poison, not for a crit hit build. The walk skipped it.

## S2. Poison claw (Carrion Claws, Barbed Point, Festering, Cruel Agony)

Notables: 2 Keen Instinct, **7 Talon, 13 Barbed Point, 17 Carrion Claws**, 19 Thick Blood, **23 Festering**, 25 Shroud,
**31 Cruel Agony**, 33 Snakeskin, 40 Venom Fletching, 44 Soft Step, 49 Bloodletter, 52 Mercy Stroke, 56 Tumble, 70
Withering (via Arcane Focus, Broad Weave), 71 Second Curse, 72 Hexwright, 82 Twin Fangs, 89 Crossed Blades, 97 Hollow
Vessel, then leftovers (124 points).

Attributes: @10 d69 i69, @20 d90 i90, @40 d142 i132, @60 d178 i178, @90 d299 i225 (claw needs 39/27, 61/61, 80/80,
113/113).

- **1-31 JANK (one-stop shop).** The whole poison-claw kit (two claw notables, two poison notables, the crit-ailment
  keystone) costs 31 points inside a 6-step radius of `knife.venom.j2.a`. The twins exist (Talon/Carrion Claws 7 apart;
  Barbed Point/Festering 7 apart) but they are all in the same small region. The decisions inside are real wheel
  sides: claw versus dagger on the edge wheel, claw versus trap on the snares wheel, poison versus ES on the venom wheel.
  But the build takes every claw/poison side, so it never gives anything up.
- **34-40 INTERESTING.** Venom Fletching (`bow.flight.venom.n`, chaos attacks + poison) across `snares.toBow` into the
  Strider: a good crossing, 7 points.
- **61-72 FORCED.** Withering, the only other chaos-DoT notable, sits in the Spire Column behind Arcane Focus and Broad
  Weave (two spell notables) from the `hexwright.b` crossing.
- **73-81 BORING.** Twin Fangs from Venom Fletching went down the Strider's flight/quiver roads: 8 bare dex nodes.

Late points (40-123): Bloodletter, Mercy Stroke, Withering, dual-wield nodes. Nothing poison-specific remains after 40.
Too easy early, thin late.

## S3. Trap/mine (Trapper, Sapper, Black Powder; Tripwire in the Strider)

Notables: 2 Keen Instinct, 6 Soft Step, 10 Snakeskin, **15 Trapper**, 18 Thick Blood, **21 Sapper**, **26 Tripwire**, 29
Shroud, **37 Black Powder**, 40 Static Edge, 44 Quick March, 47 Mercy Stroke, 50 Hedge Magic, 55 Arcane Focus, 60
Overcharge, then the Spire's elemental notables and leftovers (121 points; 90-121 padding).

Attributes: @20 d97 i97, @40 d170 i160, @60 d201 i211.

- **7-15 FORCED (useful).** `edge.j1.a → star.w → Snakeskin → star.e → snares.jT.a`: the resist star again a
  through-node.
- **16-21 INTERESTING.** Sapper is one side of the Festering/Sapper diamond: here the forced fork is the build's goal.
- **22-26 INTERESTING.** Tripwire across `snares.toBow` (3 hybrid roads) into the Strider. Trap twins 8 apart, different
  partners (AoE versus cooldown). Good.
- **30-37 BORING.** Black Powder: `hex.wheel.n → climb.a → j4.a → toSpire.a → toSpire.b → powder.a/b → n`. 4 roads
  then a 3-node dead end at the rim. Mine twins 8 apart.
- **56-58 FORCED.** Into the Spire for elemental damage through the Pain Conduit smalls (finding 1).

Late points: the trap/mine kit is complete at 37. Everything after is generic elemental or crit, mostly in the Spire.
Acceptable for a delivery mechanic, but there is no late trap/mine decision at all.

## S4. Dagger caster (Quiet Knife, Static Edge, Spellslip)

Notables: 2 Keen Instinct, **8 Quiet Knife**, 10 Spoils, **16 Hedge Magic (Strider)**, 21 Flashes of Insight, 25 Arcane
Focus, 28 Hexwright, **34 Static Edge, 37 Spellslip**, 40 Thick Blood, 43 Fine Point, 45 Warded Mind, 50 Sharp Mind, 52
Warm Blood, 57 Glass Skin, 62 Shroud, 64 Snakeskin, 67 Bloodletter, 74 Overcharge, 76 Flashpoint, 80 Thunderhead, then
Spire leftovers incl. Shatter + Fever Pitch (121 points).

Attributes: @10 d62 i62, @20 d98 i118, @40 d119 i149, @60 d140 i220, @90 d171 i281 (dagger 30/30, 64/44 or 36/78,
83/99, 121/121 or 76/149).

- **1-8.** Quiet Knife (`knife.home.quietKnife.n`): a pocket off `roadN.b`, 7 out. Good.
- **11-16 JANK (placement).** Hedge Magic (`bow.bows.hedgeMagic.n`, 16% spell damage, cast speed, +10 int) is 6 from
  the Shade start, closer than Quiet Knife. The Shade's best second spell notable is in the Strider's home.
- **17-28 FORCED.** Into the Spire: `spoils.b → craft.toKnife.b/a → insight.c → insight.n/a → craft.j1.a`. Then for
  Static Edge: `hexwright.a → hexwright.b → knife.hex.wheel.n`: two curse smalls are the road back into the Knife's own
  north arm.
- **68-80 FORCED.** Into the storm junction by the Pain Conduit smalls.

Late points: lightning and generic spell. Fine content, but this Knife build spends 60% of its late points in the
Spire, and the Spire supplies no dex (see S6).

## S5. Evasion/dodge (Tumble, Nimble Gambit, Shroud)

Notables: 2 Keen Instinct, 6 Soft Step, 10 Fine Point, **13 Nimble Gambit**, 15 Snakeskin, **23 Tumble**, 27 Shroud, 29
Thick Blood, 34 Mercy Stroke, 39 Veiled Herald, 43 Quick March, 46 Festering, 51 Bloodletter, 55 Spellslip, 58 Static
Edge, 65 Mist Walk, 69 Wanderer, 72 Fleet Foot, 73 Hard Target, 80 Wayfarer, 83 Twin Fangs, 91 Crossed Blades, then
Hawk's Eye, Long Breath, Arrow Weave, Spire leftovers (124).

Attributes: @20 d83 i83, @40 d142 i132, @60 d201 i181, @90 s35 d309 i208, @123 d373 i232.

- **11-13 INTERESTING (maybe too early).** Nimble Gambit (`knife.edge.nimble.k`) is a spur off `edge.j1.a`, 8 out. 36%
  attack dodge at point 13 (map ~12), paid for with 30% less ES. Inside the reference's 6-10, but the cheapest keystone
  of both regions.
- **16-23 FORCED small.** Tumble: `snares.jT.a → wheel.t1 → wheel.t6 (claw small) → toRicochet.r1 → tumble`. Veiled
  Herald is behind the same claw small.
- **44-51 FORCED/TRAP.** Bloodletter or Spellslip from the Knife: Festering again.
- **59-63 FORCED.** Mist Walk through the Pain Conduit smalls.
- **66-80.** The Strider's evasion notables (Fleet Foot, Hard Target, Wayfarer) through `snares.toBow.a` and the ring:
  good destinations, long roads.

Late points: dodge and evasion are spread over the Knife, the Spire (Mist Walk) and the Strider. A reasonable late game,
paid in long dex roads.

## S6. Cross-region: Shade into the Spire (lightning dagger caster)

Notables: 2 Keen Instinct, 8 Quiet Knife, 13 Flashes of Insight, 17 Arcane Focus, 20 Hexwright, 26 Static Edge, 33
Overcharge, 35 Flashpoint, 39 Thunderhead, 40 Pain Conduit, 46 Sharp Mind, 47 Warded Mind, 52 Spirit Ward, 54 Glass
Skin, 57 Spellslip, 61 Harsh Weather, 63 Prism Ward, 65 Darting Bolts, 69 Shatter, 72 Fever Pitch, 74 Mist Walk, 78
Devotion, then Knife leftovers (131 walked).

| Snapshot | Attributes    | Need (dagger)          |
| -------- | ------------- | ---------------------- |
| @20      | d69 i89       | 30/30                  |
| @40      | d104 i144     | 64/44                  |
| @60      | **d104** i214 | 83/99 (113/113 at L60) |
| @90      | **d104** i244 | **121**/121 (L70)      |

- **9-17 INTERESTING.** The near crossing `knife.home.spoils.b ↔ spire.craft.toKnife.b` works: Arcane Focus at 17.
- **27-31 FORCED/JANK.** `knife.hex.toSpire.b → painConduit.b → painConduit.a → storm.jArm.a`. The crossing's last
  two nodes are a keystone spur (finding 1).
- **Dex stalls at 104 from point 28 to past 90**: the Spire has no dex anywhere. At L69-70 the 121-dex daggers are out
  of reach without gear dex. This is a fair price for going off-region, and the knife-side roads are +7/+7, but §7.4
  says "a hybrid gets both attributes along every natural path". The Spire is a natural path for a dex/int caster and
  gives only int.
- **66-72 TRAP.** Fever Pitch for a lightning build buys Shatter (cold).

## S7. Extra: ES-leech attacker (Shade Leech)

Notables: 2 Keen Instinct, 7 Talon, 9 Thick Blood, **11 Second Curse**, **16 Shade Leech**, 20 Shroud, 23 Festering, 28
Bloodletter, 31 Fine Point, 44 Glass Skin, 50 Warded Mind, 53 Quickening, 56 Siphon, then crit and Knife leftovers
(123).

- **10-13 JANK.** `hex.jH.a → Second Curse → secondCurse.a → venom.jN.a` is the cheapest road from the edge to Shade
  Leech (the alternative is `j2.a → v1 → v2 → jN.a`, one longer). Second Curse, one of the tree's two curse notables,
  is a free road node.
- **21-28 FORCED.** Festering for Bloodletter.
- **32-44 BORING.** Glass Skin from the Knife: `toRingN → ring r3-r23 → spire.home.toRingW → hubs.w → roadW.a-c →
deepWell.a`. 12 roads. The cheapest Knife→Well path runs round the ring.

---

## Findings, ranked

Severity: **high** = every build of a kind pays it, or a constraint is broken outright. **Medium** = a named build pays
it, or the trade-off principle (§1.1, §5) is weakened. **Low** = looks or polish.

### High

1. **The Pain Conduit spur is a through-route.** `knife.hex.toSpire.b` links `spire.storm.painConduit.b`, so the
   Knife↔Spire storm crossing runs `toSpire.b → painConduit.b → painConduit.a → storm.jArm.a`. M1, M2, S3, S4, S5 and S6
   all bought the two "6% damage while on low life" smalls as road, and the keystone sits one step off a highway. This
   breaks §9.1 (keystone spurs are dead ends).
   _Fix:_ unlink `knife.hex.toSpire.b ↔ spire.storm.painConduit.b`; link `knife.hex.toSpire.b ↔ spire.storm.roadS.a`
   (1400,-3300 → 1070,-3410, 348 units, checked with `cross.ts`: no crossings, no node within 60).
2. **The Knife's north arm is gated by Festering/Sapper.** `knife.hex.wheel.s` reaches `knife.hex.wheel.n` only through
   `wheel.n1` (Festering) or `wheel.n2` (Sapper), so every Shade route to Bloodletter, Static Edge, Spellslip, Black
   Powder or the north Spire crossing buys a poison or a mine notable. S1, S5, S7 and M2 paid it. Meanwhile a Mystic
   enters the same arm freely through `spire.craft.hexwright.b ↔ knife.hex.wheel.n`. This is forced, not a choice.
   _Fix:_ link `knife.hex.wheel.s ↔ knife.hex.wheel.n` directly (300 units, no crossings, no node within 60), or put one
   travel node there, so Festering and Sapper become a side fork off a junction.
3. **Attribute oversupply makes the late Mystic's roads dead points.** Int reaches the heaviest wand (245) at points
   58-85 in every Mystic walk (M1 58, M6 59, M5 60, M4 74, M2 79, M3 85), which is L46-66, at or before the L68 wand
   drops. It then reaches 280-320 at @90 and 350-470 at @123. The Spire has 49 attribute nodes, 42 of them pure +10 int.
   In M1, 26 of the 63 late points were roads worth about 2% ES each. The Shade meets 121/121 by @60 in every
   Knife-centred walk (S1 @40 already d195). This is the open item in CONSTRAINTS §16, now measured.
   _Fix (user's call):_ Spire road nodes +10 → +7 int. The walks bought 14-20 pure +10 roads by @90, so they would then
   have about 240-275 int at @90, matching Augur/Unholy Wand at L68-70. Or turn the Spire roads that face the Knife (`craft.toKnife.a`, `toAlleys.r1`, `toVolley.r1/r2`,
   `toFlashpoint.r1`) and the Cathedral (`well.toCrypt.r1/r2`, `well.toCathedral.a`) into hybrids, so the surplus buys
   an off-attribute instead.

### Medium

4. **Fever Pitch only through Shatter, at the end of a straight spine.** `frost.feverPitch.a` links only `shatter.n`;
   the line `column.fork.a → Thunderhead → frost.jArm.a → Shatter → Fever Pitch` is a vertical highway through two
   notables (see D-mystic.png). A lightning or fire crit build that wants Fever Pitch buys a cold notable (S4, S6).
   _Fix:_ unlink `shatter.n ↔ feverPitch.a` and link `feverPitch.a ↔ frost.toHarsh.a` (382 units, no crossings per
   `cross.ts`). Shatter becomes a pocket and the keystone a spur off a road node. Optionally move the spur off the
   centre line.
5. **Leaving the Spire costs a themed node, because its crossings hang off theme nodes rather than junctions:**
   - `craft.toAlleys.r1` hangs off `craft.insight.n` (Flashes of Insight).
   - `craft.toKnife.a` hangs off `insight.c`.
   - `well.toCathedral.a` hangs off Wandwork (`well.wandwork.n`).
   - `well.toCrypt.r1` hangs off a mana-leech small (`manaTap.a`).
   - `spire.well.draught.b ↔ cathedral.choir.toSpire.a` lands on Shepherd.
   - `cathedral.crypt.toSpire.b` lands on Familiars.
   - `craft.hexwright.b ↔ knife.hex.wheel.n` is a curse small.

   The Cathedral defence notables (Litany, Vigil) are behind Hearthfire (`cathedral.nave.wheel.n5`) or Shepherd from the
   Spire side. 12 of the 13 walks (all but S3) bought at least one notable they did not want on such a route (Flashes of
   Insight, Shepherd, Hearthfire, Festering, Spirit Ward, Shatter, or Arcane Focus and Broad Weave on S2's way to
   Withering).
   _Fix:_ re-hang the crossing roads on `craft.j1.a`, `well.j1.a` and `storm.jArm.a` (or new travel junctions beside
   them), with the themed pocket beside the road, not on it.

6. **Notables in the middle of roads.** `midbridge.ts` counts 37 of 56 Spire/Knife notables with a detour of 4 or more
   around them. About 12 are intended wheel sides. The rest are bridges whose middle node is the notable:
   - Spirit Ward (`well.spiritWard.n`) is the short link between Glass Skin and `column.j1.a`; bought by M1, M2, M6, S3,
     S5 and S6 with no shield.
   - Others: Siphon, Quiet Pulse, Mana Tap, Thunderhead, Hexwright (on the road to Devotion), Wand Volley (on the road
     to Devotion via `toVolley`), Familiars, Thick Blood (the busiest through-node of the two regions), Second Curse
     (finding 7).

   It also makes notables "a step apart" in the renders.
   _Fix:_ in a bridge pocket, run the bridge through the smalls and hang the notable off one of them. For Spirit Ward:
   link `spiritWard.a ↔ spiritWard.b` and move `spiritWard.n` off that line. The notable is 21 units from the new
   segment today.

7. **Second Curse and Thick Blood as road nodes.** `knife.hex.jH.a → secondCurse.n → secondCurse.a → venom.jN.a` is the
   cheapest edge→venom road (S7 took Second Curse at point 11 on the way to Shade Leech). Thick Blood
   (`knife.edge.thickBlood.n`) is the junction of the `toAlleys` crossing, the edge wheel and `jH.a`.
   _Fix:_ unlink `knife.hex.jH.a ↔ knife.venom.secondCurse.n`, link `jH.a ↔ secondCurse.a` (319 units, no crossings),
   and move `secondCurse.n` west so it hangs as a leaf off `secondCurse.a`. Give `toAlleys.r2` its own
   landing at `thickBlood.a` or `jH.a`.
8. **The wand attack has one notable in the whole tree, 13 steps from the class whose starting weapon is a wand
   attack.** M3 bought 13 spell or defence notables before Wand Volley (point 18), then left the Spire for every attack
   stat (31 of points 21-60 outside). The Spire has no attack speed, accuracy, attack crit or projectile-attack node.
   _Fix:_ a second wand-attack cluster with a different partner (wand + attack speed/accuracy, against Wand Volley's
   crit), about 5-6 out on the west road (e.g. off `spire.home.roadW.b` or `well.j1.a`).
9. **The Mystic home is a mirror, and its ES notables are twins.**
   - The W/E halves match node for node: sig, hub, pocket (Still/Sharp Mind), 3-node road, ring (Well/Craft), keystone
     off the ring's junction (Mind Bulwark/Mana Bastion, both mana-buffer keystones at 13).
   - Glass Skin (`well.deepWell.n2`) and Warded Mind (`craft.focus.n2`) are the same pairing (ES + recharge + mana) 7
     out on each side.
   - Quickening (`well.recharge.n`), a third ES-recharge notable, is 3 steps from Glass Skin.

   Every ES walk took all three plus Siphon: no trade-off (§5.1, §5.5).
   _Fix:_ give Warded Mind a different partner (ES + spell block, or ES + cast speed), move Quickening at least 5 steps
   from Glass Skin, and make the two keystones differ in kind (one of them is not a mana buffer).

10. **Element and DoT supply is thin, so caster late games have no destination.**
    - Cold spells: Hoarfrost and Shatter only.
    - Lightning: Thunderhead, Overcharge, Static Edge.
    - Ignite: Cinder only.
    - Chaos spells: none (Withering is DoT).

    M1 ran out of cold at point 27, M2 out of lightning at 52, M6 out of fire DoT at 41. Their 60-123 points went to
    sustain, defence and roads (M1: five mana notables, 26 roads). The crit-lightning kit is also compact: Thunderhead →
    Flashpoint → Overcharge → Pain Conduit in 15 points around `storm.jArm.a`.
    _Fix:_ add a late cluster per element in a far place with a different partner, e.g.:
    - cold + spell block in the Cathedral crypt;
    - lightning + dodge on the Knife's north arm (beside Static Edge);
    - a chaos-spell cluster in the Knife's venom area;
    - a second ignite cluster outside the Spire.

11. **The poison claw is a one-stop shop.** Talon, Barbed Point, Carrion Claws, Festering and Cruel Agony all lie within
    31 points in a 6-step radius of `knife.venom.j2.a`; the build gives nothing up and has nothing poison-specific after
    point 40 except Venom Fletching. _Fix:_ move one poison cluster (Festering, once finding 2 is fixed) to a far
    partner, e.g. near the Yard's bleed or the Strider's Venom Fletching side, and keep Barbed Point as the Knife's.

### Low

12. **Identical start loops.** `spire.home.sig.a` and `knife.home.sig.a` are both "5% maximum ES"; `sig.b` is "20% crit
    chance" in both; both signature notables are crit + ES. _Fix:_ Mystic `sig.b` → spell damage or mana, or Shade
    `sig.a` → evasion.
13. **Tumble and Veiled Herald are behind a claw small.** `knife.snares.toRicochet.r1` hangs off `snares.wheel.t6`.
    _Fix:_ link `toRicochet.r1 ↔ snares.wheel.t1` (354 units, no crossings; the `jT.a` option crosses the wheel).
14. **Hedge Magic (`bow.bows.hedgeMagic.n`) is 6 from the Shade start,** closer than any Knife spell notable, via
    `knife.home.toHedge.r1`. Acceptable as a crossing, but the Shade's caster opening lives in the Strider.
15. **A Shade in the Spire gets no dex** (S6: d104 from point 28 to 90, against 121 at L70). Fair as a cost, but
    `knife.hex.toSpire.a/b`, `spire.craft.toKnife.b` and `toAlleys.r2` are the only hybrids. One or two hybrid nodes
    deeper on the Spire's east roads (`craft.toVolley.r1`, `toFlashpoint.r1`) would let the Shade caster wield a late
    dagger without gear dex.
16. **Nimble Gambit is the cheapest keystone of both regions (8 out).** 36% attack dodge at map ~12. Within the reference
    range; worth a balance look, not a move.
17. **Label and position collisions in the renders:**
    - Prism Ward / Darting Bolts (`column.star.n` / `dartingBolts.n`, 210 apart, labels overlap in D-mystic).
    - Broad Weave / Siphon (126).
    - Quiet Pulse / Quickening (171), and the four collinear nodes `quietPulse.b`–`quietPulse.n`–`toPulse.a`–`siphon.a`
      read as one line in D-mystic-text.
    - Mind Bulwark / Living Ward (two regions' keystones 232 apart).
    - Harsh Weather / Overcharge, Pain Conduit / Black Powder, Festering / Sapper, Second Curse / Barbed Point (all in
      D-all-nodes).
    - Mercy Stroke's and Tumble's text over `toRicochet` labels (D-shade-text).
18. **Long sticks.**
    - The Knife's north arm (`hex.climb.a → j4.a → toSpire.a → toSpire.b → Black Powder`) reads as a bare pole in
      D-shade.png with two keystone/notable spurs.
    - `well.toCrypt.r1-r4` is a 4-node road with nothing branching, the main way to Homily.
    - Twin Fangs from the Knife is 9 ring/dex roads.

    Dear bridges by design, but each is the only cheap way to its target.

### What worked (decisions that were real)

These are recorded so the fixes above keep them.

- The edge wheel's dagger side against its claw side.
- The snares wheel's trap side against its claw side.
- The venom wheel's poison side against its ES/evasion side.
- The Well and Craft rings: which side first.
- Road against Broad Weave/Withering on the way to Hoarfrost, at equal price.
- Fever Pitch against crit multiplier for crit casters.
- The Knife start's north fork (Spoils, Quiet Knife, claw) against its south fork (Soft Step, dagger, Nimble Gambit).
- Generic crit multiplier spread over the Knife, the Strider and the Yard as late destinations.
