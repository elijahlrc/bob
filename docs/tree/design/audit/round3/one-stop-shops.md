# Round 3: one-stop shops

> **Status, after this report:** findings 1 (the poison claw) and 4 (the chaos hexer) were fixed in round 3, as were
> the Black Flock half of finding 7 and the Rotting Word half of finding 8. See `../../E-round3.md`. The numbers
> below describe the tree just before those changes. Round 4 (`../../E-round4.md`) fixed findings 2, 3, 5, 6 and
> Mist Walk / Tumble; Grave Host and the Strider's items wait for the user.

Build walks of 2026-10-20, read-only, on the tree as it stood after round 3 (last source change: `wall/grit.ts`, 13:38).

## The question

A one-stop shop is a small place where a build finds everything build-specific it wants (weapon, element, delivery,
mechanic), so it never has to choose a direction. This audit looked for four things:

- **(a)** wanted build-specific notables 4 or fewer steps apart, with no choice between them;
- **(b)** a build's whole kit on one corridor;
- **(c)** a build done early, with no late destinations;
- **(d)** two notables with the same pairing (§5.1).

Generic defences (life, armour, energy shield, resistances) taken nearby are normal and are not counted. Neither is a
route that passes a notable the build does not want (§5.5). Such a route is marked **FAIR PRICE**, and every one below
was checked for a dearer way round (+0 to +2). It would count as a defect only if it were the only way in, or if it ran
through a keystone spur.

## Method

- The walks are cheapest-path walks from the class start. "+N" means that leg cost N points.
- "N shortest" counts the equally short ways to make that leg. Where it is more than one, a passed notable costs
  nothing.
- "A–B 6" means the two notables are 6 steps apart.
- Short ids: `W.` wall, `Y.` yard, `C.` cathedral, `S.` spire, `K.` knife, `B.` bow.
- The scripts are in the session scratchpad under `r3audit/`:
  - `w.ts`: walk, frontier and attribute totals
  - `ring.ts`: notables near a notable
  - `dups.ts`: shared pairings
  - `spurs.ts`: keystone spurs used as roads
- The scratchpad's `dist.ts --cut/--add` gave the what-if numbers.
- **`inv.txt` is stale for one notable.** Grave Host is now minion life with armour (24% and 20%). The numbers here come
  from the built tree.

## Summary

**Round-3 fixes that worked**

| Change                                        | Result                                                                                                                                                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bracing and Thick Skin traded places          | **Worked.** Bracing is 14 from Weight of Iron and 15 from Mortar and Stone. The shield and the mace are now two directions from the Vanguard start. Bracing–Thunderstep 3 is a real shield-or-two-hander fork.    |
| Kindled Steel moved to the Ambulatory         | **Worked.** Gilded Rod 13, Searing Avatar 24, Kindled Steel 31: three directions, 11 to 13 apart. The late game reaches Censer, the Wall's maces and the Spire's ignite.                                          |
| Thirsting Blade moved to the road to Headsman | **Worked for leech.** It is 15 from Red Harvest, so leech is now a choice between the Pits and the Headsman road. But it sits 5 from Headsman, beside a row of two-hander notables (finding 6).                   |
| Black Flock and Grave Host added              | **Partly.** The summoner's late game exists now: +25 or +30 points for one minion notable, which is a real §9.3 commitment. But neither is the nearest minion door for its own class (finding 7).                 |
| New caster clusters                           | **Worked.** Sleet is 21 to 24 from the Spire's cold, Tomb Dust 25 from Rotting Word, Thunder Peal 24 or more from the Spire's lightning, and Deft Wand 14 from Wand Volley. Each gives a caster a real late trip. |
| Festering moved to the Pits                   | **Did not fix the poison claw.** Festering is now a good late destination (25 away), but the claw's core still sits round one junction (finding 1).                                                               |
| Rotting Word on the Stair wheel               | **Created a new shop.** Rotting Word is 3 from Hexwright and 5 from Second Curse, so a chaos hexer is done at point 17 (finding 4).                                                                               |

**Still one-stop shops**, worst first:

1. the poison claw
2. the two-handed mace in the Barbican
3. the sword and board in the Muster
4. the chaos hexer
5. the Barrows' two-hander row
6. the Strider's projectile rim (yours)

---

## The walks

### V1. Vanguard, mace and shield

Gear: one-handed mace, armour shield. Wants Weight of Iron, Bracing, Crushing Blow and Hallowed Hammer, plus armour.

- **1–8.** Oathbound, then Bracing (+6, by `W.home.roadS.a/b → W.slams.bracing.a`). INTERESTING: Bracing and
  Thunderstep are 3 apart on the slam road. Shield or two-hander is the fork §8.5 asks for.
- **9–16.** Weight of Iron (+8, back across the home by the life road `W.home.roadM.a/b/c → W.maces.toHome.b/a`).
  INTERESTING: the shield and the mace pull in two directions.
- **17–24.** Mortar and Stone (+5, through the Iron Lungs smalls `W.maces.j1.a → W.rampart.ironLungs.b/a`), then Stone
  Heart (+3). These are generic armour and life. Iron Lungs is a leaf one step off, as intended.
- **25–30.** Crushing Blow (+6). It passes Cleaver, a FAIR PRICE: there are 3 shortest ways, and the two-hander smalls
  are the other.
- **31–35.** Hallowed Hammer (+5, by `W.maces.toHymn.r1/r2`). The mace trio is Weight 8 Crushing 6 Hammer (Weight–Hammer
  12), with three partners: stun, crit and elemental.
- **36–54.** Stagger, Unshakable, Elemental Ward, Iron Faith (+5 into the Nave; the second block notable, 16 from
  Bracing) and Battle Hymn.
- **55–97 (late).** Two real directions, each 15 to 25 points:
  - **The Cathedral:** Kindled Steel (+17; passes Scar Tissue, a FAIR PRICE with 3 shortest), Rimed Steel, Consecrated
    Plate.
  - **The Yard's block:** Steel Rim (+12; passes Stout Heart and Killing Pace, a FAIR PRICE), Shieldwall (+7), Buckler
    (+7).

**Late verdict.** Satisfying. The build's own core is done at 35, and the late game is a choice between Cathedral
elemental strikes and Yard block.

**Shop.** None; fixed by round 3. One note (low): the Bulwark wheel's two sides (`W.rampart.bulwark.n1/n2`, 3 apart) are
both generic defence that an armour build takes. That is a §8.3 micro-choice issue, not a shop.

### V2. Vanguard, two-handed mace

Gear: two-handed mace. Wants Weight of Iron, Greatweight, Crushing Blow, Stagger, Ground Shaker, Thunderstep, Heavy
Hands and Headsman.

- **1–10.** Oathbound, then Weight of Iron (+8).
- **11–16.** Greatweight (+6, by `weight.c → j1 → roadG → greatweight.a/b`). JANK (d): Weight of Iron and Greatweight both
  sell physical damage with stun duration, 6 apart.
- **17–22.** Rooted Stance (+6). Broad Back is on one of 2 equally short ways, so it costs nothing.
- **23–24.** Crushing Blow (+2). JANK (a): `W.maces.crushing.b` links `W.maces.greatweight.d`, so the mace crit is 4 from
  Greatweight. The notable is also the bridge from the two-hander wheel to the Stagger road (`crushing.b → n → a`).
- **25–31.** Stagger (+4; Crushing–Stagger 4), then Ground Shaker (+3).
- **Point 31.** Six wanted notables, keystone included, in the 21 points after Weight of Iron, each 4 to 8 apart. Nothing
  given up.
- **32–38.** Thunderstep (+7, back through the home; 8 shortest).
- **39–50.** Heavy Hands (+12). BORING: `W.grit.north.a/b/c` and two warcry smalls. Vampiric Strikes is passed and wanted.
- **51–56.** Headsman (+6, `W.grit.east.e1/e2/e3 → headsman.a/b`). JANK (d): Headsman (two-handed damage, stun duration,
  enemy stun threshold) repeats Greatweight's pairing, 19 apart.
- **57–65.** Hallowed Hammer (+5), then Thirsting Blade (+4, the first node outside the Wall).

**Late verdict.** Coherent but region-locked. Ten of eleven build notables are inside the Wall by point 61.

**Shop.** The Barbican (`wall.maces`):

| Pair                      | Steps            |
| ------------------------- | ---------------- |
| Weight–Greatweight        | 6 (same pairing) |
| Greatweight–Crushing Blow | 4                |
| Crushing Blow–Stagger     | 4                |
| Weight–Ground Shaker      | 5                |

See finding 2.

### Z1. Zealot, fire sceptre

Gear: sceptre. Wants Gilded Rod, Searing Avatar, Kindled Steel and Censer. Hallowed Hammer and Weight of Iron count,
because `maceDamage` is mace and sceptre damage.

- **1–7.** Zeal, then Iron Faith (+5). INTERESTING: block, or Hearthfire on the nave wheel.
- **8–13.** Gilded Rod (+6, `C.nave.wheel.n7/n4 → jN → C.rods.wheel.r1/r2`). INTERESTING: sceptre or staff.
- **14–24.** Searing Avatar (+11) by the back road: `rods.wheel.r7/r4 → jR → C.ambulatory.nave.a/b → walk.w2/w1 →
C.pyre.jF`. INTERESTING: this road avoids both Bell Tower notables.
- **25–31.** Kindled Steel (+7, `walk.w3…w6 → kindled.a/b`). INTERESTING: the Ambulatory runs both ways from `w2`, with
  Searing Avatar at one end and Kindled Steel at the other, 12 apart. The road passes the Crozier, Ossuary, Plate and
  Brandwright pockets, each one step off.
- **32–39.** Tithe (+3), then Censer (+5). Censer is the burn follow-up: 10 from Gilded Rod and 17 from Kindled Steel.
- **40–58.** Litany and Consecrated Plate, then Battle Hymn (+4). After that, Hallowed Hammer (+6 into the Wall) and
  Weight of Iron (+9; passes Cleaver, a FAIR PRICE).
- **59–101 (late).** Two late directions:
  - **The Wall's armour:** Mortar and Stone, Stone Heart, Stagger.
  - **The Spire's ignite:** Cinder (+13; passes Reliquary and Familiars, a FAIR PRICE with 2 shortest) and Flashpoint
    (+9, for fire penetration).

  Then Elemental Ward and Vigil.

**Late verdict.** Satisfying, with two real late directions.

**Shop.** None; fixed by round 3.

**Side effect (low).** The cold sceptre now has the shape the fire sceptre had. Gilded Rod and Rimed Steel are 6 apart
on one line (`r3 → r7 → r4 → jR → f1 → f2 → f3`). That passes §5.2, but cold attacks have only this one cluster, and fire
attacks only Kindled Steel. See finding 9.

### Z2. Zealot summoner

Gear: sceptre and energy-shield shield. Wants Shepherd, Familiars, Volatile Servants, Ossuary, Black Flock and Grave
Host.

- **1–10.** Zeal, then Shepherd (+8). INTERESTING: the minion side or the aura side of the choir wheel.
- **11–16.** Glass Wall (+6). INTERESTING: shield summoner or Homily.
- **17–24.** Familiars (+3, over `C.crypt.toSpire.a/b`), then Volatile Servants (+5).
- **25–34.** Ossuary (+10). It passes Reliquary, a FAIR PRICE: there are 2 shortest, and the Ambulatory reaches it from the other end.
- **The core is done at 34.** Shepherd 9 Familiars 7 Volatile; Familiars 14 Ossuary. That is spread properly.
- **35–64 or 35–59.** Grave Host costs +30, through the Vanguard's home loop, Vampiric Strikes and the Barrows. Black Flock
  costs +25, through the Spire's Lantern, Column and Gallery, the Stair and the Rooftops. Both roads pass real content.
  A summoner affords one, not both.

**Late verdict.** Better than round 2. The late game now has two big minion commitments (25 to 30 points for one
notable each). That is a §9.3 decision.

**Shop.** None.

**But (finding 7):** each second minion home is farther from its own class than Shepherd is (steps from the start):

| Class start | Its own cluster | Shepherd |
| ----------- | --------------- | -------- |
| Vanguard    | Grave Host 23   | 15       |
| Shade       | Black Flock 21  | 18       |

### M1. Mystic, cold caster

Gear: wand or staff with an energy-shield body. Wants Hoarfrost, Shatter, Harsh Weather, Fever Pitch, Darting Bolts and
Sleet.

- **1–12.** First Light, Sharp Mind, then Glass Skin.
- **13–22.** Darting Bolts (+5), then Hoarfrost (+5 by `S.column.fork → roadW → hoarfrost.a`).
- **23–28.** Shatter (+6). INTERESTING: chill at Hoarfrost and freeze at Shatter, 7 apart.
- **29–36.** Harsh Weather (+5), then Fever Pitch (+3). This freeze corner sits at the threshold: Shatter–Harsh 5 and
  Shatter–Fever Pitch 5.
- **37–40.** Arcane Focus (+4).
- **41–58.** Sleet (+18): `S.craft.focus.c → j1 → hexwright.a/b → K.hex.wheel.n → climb → j4 → static.a/b →
K.roofs.walk.r1…r6 → sleet.a/b`.
  - INTERESTING: a real late decision, 18 points for one notable.
  - BORING in part: six bare road nodes, with Black Flock branching at `r3`. The Static Edge smalls on the way are
    lightning, of half use.
- **59–76.** Quickening, Prism Ward, Broad Weave, Warded Mind, Deep Well, Thunderhead, Siphon, Still Mind and Mana
  Bastion, at 1 to 3 points each. This is generic Spire supply.

**Late verdict.** Enough: one far cold destination, then dense generic supply.

**Shop.** None. Not re-walked: Overcharge–Harsh Weather is 4, so a lightning shock caster finds both side by side.

### M2. Mystic, wand attacker

Gear: wand. Wants Deft Wand and Wand Volley, then projectile attack notables.

- **1–7.** First Light, then Deft Wand (+5, `S.home.hubs.w → roadW.a → deftWand.a/b`). INTERESTING: a wand-attack porch
  at point 7. Round 2's only wand cluster was 13 out.
- **8–18.** Glass Skin, then Warded Mind (+7, the defence side of the Arcane Focus wheel).
- **19–27.** Wand Volley (+6), Flashes of Insight (+2), then Frugal (+1).
- **28–62.** Into the Strider over the ring:
  - Elemental Fletching (+13). BORING: seven ring nodes, but that is the crossing.
  - Ricochet (+8)
  - Vital Aim (+6)
  - Far Flight (+6)
  - Split Volley (+2)

**Late verdict.** Satisfying. The wand's own notables end by about 27, and the late game is a real trip to the Strider's
projectile notables.

**Shop.** None. Deft Wand–Wand Volley 14.

### S1. Shade, poison claw

Gear: claw. Wants Talon, Carrion Claws, Barbed Point, Cruel Agony, Venom Fletching and Festering.

- **1–7.** Keen Instinct, then Talon (+5, `K.home.hubs.n → roadN.a/b → K.edge.wheel.w2`). INTERESTING: claw or dagger
  (Fine Point).
- **8–13.** Barbed Point (+6, `K.edge.wheel.w7/w4 → K.venom.j2.a → K.venom.wheel.v1/v2`).
- **14–17.** Carrion Claws (+4, `K.snares.jT.a → wheel.t1/t6`).
- **18–23.** Cruel Agony (+6, `K.venom.wheel.v7/v4 → j5 → cruelAgony.a/b`).
- **24–25.** Shroud (+2). The Rookery wheel's other side costs only 2 once you have walked through, so it is a weak §8.3
  choice.
- **JANK, one-stop shop.** Talon, Barbed Point and Carrion Claws hang 3, 3 and 4 points off the single junction
  `knife.venom.j2.a`, and Cruel Agony is 6 past Barbed Point. Every build-specific notable is bought by point 23, 16
  points after the first. The build gives up only the dagger, trap and defence sides it never wanted.
- **26–32.** Venom Fletching (+7, by the Docks road `K.snares.toBow.c/b/a → B.flight.toKnife.a`).
- **33–58.** Mercy Stroke, Bloodletter, Snakeskin, Soft Step, Tumble, then Veiled Herald.
- **59–85.** Into the Yard by the Strider: Twin Fangs (+11), Crossed Blades (+7), Festering (+7), Red Harvest (+2).

**Late verdict.** Satisfying: dual-wield claws and Festering, 26 points for four Yard notables. The problem is the early
game.

**Shop.** The Rookery junction:

| Pair                       | Steps |
| -------------------------- | ----- |
| Talon–Barbed Point         | 6     |
| Talon–Carrion Claws        | 7     |
| Barbed Point–Carrion Claws | 7     |
| Barbed Point–Cruel Agony   | 6     |
| Carrion Claws–Cruel Agony  | 8     |

The pairs pass §5.2, but all three notables are 3 to 4 off one node. See finding 1.

### S2. Shade, chaos caster (hexer)

Gear: dagger or wand. Wants Rotting Word, Tomb Dust, Withering, Lingering, and the curse notables Hexwright and Second
Curse. Chaos curses exist in the gem data.

- **1–12.** Keen Instinct, then Rotting Word (+10). It passes Thick Blood, a FAIR PRICE: generic life, and the way round
  by Talon costs the same.
- **13–15.** Hexwright (+3, `K.hex.wheel.n → S.craft.hexwright.b`). JANK (a), new in round 3.
- **16–17.** Second Curse (+2, `K.venom.secondCurse.a` off `K.hex.jH.a`).
- **Point 17.** The chaos-spell notable and both curse notables are bought: Rotting Word–Hexwright 3, Rotting Word–Second
  Curse 5.
- **18–21.** Arcane Focus (+4).
- **22–35.** Lingering (+8; passes Wand Volley, a FAIR PRICE: the Arcane Focus side is as short). Then Withering (+6;
  passes Darting Bolts, a FAIR PRICE with 2 shortest).
- **36–46.** Tomb Dust (+11; passes Hoarfrost and Familiars, a FAIR PRICE). It is the second chaos-spell cluster, 25 from
  Rotting Word.

**Late verdict.** Satisfying: damage over time in the Column and Tomb Dust in the crypt.

**Shop.** The Stair's top: Rotting Word, Hexwright and Second Curse at 3, 5 and 7. See finding 4. Also (d): Rotting Word is
Lingering's pairing (duration with damage over time) plus a chaos line, 10 apart.

### R1. Reaver, leech two-hander

Gear: two-handed axe. Wants Hewing, Thirsting Blade, Headsman, Heavy Hands, Greatblade (its two-hander half), Red
Harvest and Crimson Pact.

- **1–11.** Quickened Steel, then Hewing (+9; passes Keen Edge, a FAIR PRICE with 2 shortest).
- **12–14.** Elemental Edge (+3). The Yard's road to Headsman starts at this notable (`elementalEdge.n ↔
toHeadsman.r1`). For a physical build that is a FAIR PRICE, because Headsman is also reachable from the Barrows.
- **15–22.** Thirsting Blade (+6, `toHeadsman.r1/r2/r3 → thirst.a/b`), then Headsman (+2). They are 5 apart and both hang
  off `toHeadsman.r3`. That is at the threshold; noted, not flagged.
- **23–31.** Red Harvest (+9). JANK (§9.1): the cheapest way runs through the Shieldwall spur
  (`Y.shield.shieldwall.c → b → a → j2`), then the Steel Rim wheel's smalls. The dearer way costs 2 more.
- **32–37.** Crimson Pact (+6).
- **38–46.** Greatblade (+6, `W.grit.headsman.a → east.e3/e2 → greatblade.a/b`), then Heavy Hands (+3, `east.e1 →
heavyHands.b`). JANK (b): Headsman, Greatblade and Heavy Hands hang off three consecutive Barrows road nodes (`e3`,
  `e2`, `e1`). Once a two-hander is at Headsman, the other two cost 9.
- **47–84.** Fencer's Eye, Executioner, Open Veins, Yard defences, Unbroken, Tempered and Barrow Ward. Then Greatweight
  (+11; passes Iron Liturgy, a FAIR PRICE) and Vampiric Strikes.

**Late verdict.** Satisfying. Leech is a real choice now: Thirsting Blade by Headsman, or Red Harvest with Crimson Pact
in the Pits, 15 apart.

**Shop.** The Barrows' two-hander row:

| Pair                     | Steps |
| ------------------------ | ----- |
| Headsman–Greatblade      | 7     |
| Headsman–Heavy Hands     | 7     |
| Greatblade–Heavy Hands   | 6     |
| Thirsting Blade–Headsman | 5     |

See finding 6.

### R2. Reaver, sword and board

Gear: one-handed sword and shield. Wants Keen Edge, Light Blades, Steel Rim, Fencer's Eye, Shieldwall, Shield Bash, then
Bracing and Fleet Blade.

- **1–6.** Quickened Steel, then Buckler (+4).
- **7–12.** Keen Edge (+6).
- **13–15.** Light Blades (+3, `Y.blades.j1.a → lightBlades.a`). JANK (a): they are 3 apart. Round 2 cut
  `keenEdge.c ↔ lightBlades.a`, but `keenEdge.n` and `lightBlades.a` both link `Y.blades.j1.a`, so the distance stayed 3.
- **16–20.** Steel Rim (+5, `lightBlades.b → Y.shield.hub.a → steelRim.a/b`).
- **21–25.** Fencer's Eye (+5). Scarred Hide is passed, and it is generic and wanted.
- **26–35.** Shieldwall (+4), then Shield Bash (+6; passes Standard Bearer, a FAIR PRICE).
- **36–40.** Bracing (+5; passes Stout Heart, which is generic). The Wall's shield notable is 12 from Steel Rim, a cheap
  late addition.
- **41–53.** Fleet Blade (+13 over the ring).

**Late verdict.** Thin but present: Bracing, Iron Faith through the Wall, and Fleet Blade.

**Shop.** The Muster. Keen Edge 3 Light Blades 5 Steel Rim 5 Fencer's Eye 6 Shieldwall: six build notables between
points 12 and 35, round `yard.shield.hub.a`. See finding 3.

### St1. Strider, projectile bow (your region; proposals only)

- **Bought, in order:** Quick Hands (6), True Aim (8), Far Flight (13), Split Volley (15), Skewer (18), Rapid Fire (20),
  Killing Eye (23; passes Quick Sip, which links the notable directly) and Vital Aim (28).
- **28 points buy eight build notables.** On the rim:

  | Pair                    | Steps |
  | ----------------------- | ----- |
  | Far Flight–Split Volley | 4     |
  | Split Volley–Skewer     | 3     |
  | Rapid Fire–Skewer       | 2     |
  | Rapid Fire–Killing Eye  | 4     |
  | Skewer–Killing Eye      | 4     |
  | True Aim–Quick Hands    | 2     |

- **Later.** Longbow (+7), Elemental Fletching (+3), Ricochet (+7; passes Venom Fletching through the Close Quarters
  spur small), then Quiet Shot (+10; passes Carrion Claws, a FAIR PRICE).

**Late verdict.** Done at 28. The proposals in `audit/audit-tradeoffs.md` and round 2 still apply. See finding 12.

---

## Findings, ranked

### 1. High: the poison claw is still a one-stop shop

Talon (`knife.edge.wheel.w3`), Barbed Point (`knife.venom.wheel.v3`) and Carrion Claws (`knife.snares.wheel.t5`) each
hang 3 to 4 points off `knife.venom.j2.a`. Cruel Agony is 6 past Barbed Point. The whole kit costs 23 points. Moving
Festering out did not change this, because the shop is the three wheels round one junction.

**Fix.** Swap Carrion Claws and Black Flock (`knife.roofs.flock`), notables and smalls together: claw damage smalls go
out to the Rooftops, and minion damage smalls come to the Docks.

|                                                                | Before                            | After                                               |
| -------------------------------------------------------------- | --------------------------------- | --------------------------------------------------- |
| Carrion Claws                                                  | 7 from Talon, 7 from Barbed Point | 17 from Talon, 14 from Barbed Point and Cruel Agony |
| Black Flock, steps from the Shade start                        | 21 (Shepherd 18)                  | 12                                                  |
| Black Flock, steps from Familiars (the Zealot summoner's trip) | 25                                | 27                                                  |

- **The poison claw.** The core is Talon, Barbed Point and Cruel Agony by point 19. Then it chooses:
  - Venom Fletching (+8, into the Strider)
  - Carrion Claws (+11 up the Rooftops; passes Quiet Shot, a FAIR PRICE)
  - Festering (far, in the Yard)
- **The Docks wheel becomes traps or minions.** It is still a fair §8.3 choice:
  - A walker bound for Quiet Shot takes one side: `t1→t2→t3→t7→t4` or `t1→t6→t5→t8→t4`.
  - The Ricochet road leaves at `t6`, before either notable.
- **Black Flock's description becomes true.** Its why says it is "the Knife's first minion cluster"; today Shepherd is
  nearer the Shade.
- **The Strider's road to Quiet Shot** passes Black Flock instead of Carrion Claws. That is a fair price.

### 2. High: the two-handed mace is done in the Barbican

- **The distances:** Weight of Iron–Greatweight 6, Greatweight–Crushing Blow 4, Crushing Blow–Stagger 4, Weight of
  Iron–Ground Shaker 5. That is six wanted notables in the 21 points after Weight of Iron.
- **Weight of Iron and Greatweight** both sell physical damage with stun duration. CONSTRAINTS §16 lists this as open.
- **Greatweight and Headsman** (`wall.grit.headsman.n`) are the same pairing: two-handed damage with stun duration.

**Fixes:**

- **Re-partner Greatweight (`wall.maces.greatweight.n1`) off stun.** It keeps two-handed damage and takes a heavy partner
  nobody near it sells, such as strength. Avoid:
  - armour, which Broad Back on the same wheel has (§8.3);
  - area, which Thunderstep has;
  - crit, which Crushing Blow has.

  Stun with a mace then lives at Weight of Iron, and stun with a two-hander at Headsman. That ends both same-pairing
  problems.

- **Cut `wall.maces.greatweight.d ↔ wall.maces.crushing.b`.** `crushing.b` stays as the pocket's second small. After the
  cut:
  - Greatweight–Crushing Blow goes from 4 to 10.
  - Greatweight–Stagger goes from 8 to 12.
  - Start distances do not change: Vanguard to Greatweight 14, Crushing Blow 16, Stagger 15; Zealot to Greatweight 20.
  - Nothing is stranded. `greatweight.d` still links `c`, `n2` and `wall.maces.j2.a`, so Rooted Stance's spur stays
    reachable. The wheel keeps two other exits: `roadG` to the mace junction, and `greatweight.b` to the west road.
  - The two-handed mace then chooses between the Greatweight wheel with Rooted Stance and the crit-and-stun branch.
- **Do not re-link `crushing.b` to `crushing.a`.** The probe shows that link would run past the notable.

### 3. High: the sword and board in the Muster

Keen Edge (`yard.blades.keenEdge.n`) and Light Blades (`yard.blades.lightBlades.n`) are 3 apart. Round 2's cut missed,
because both link `yard.blades.j1.a`. Around `yard.shield.hub.a`, Steel Rim, Fencer's Eye, Shieldwall and Shield Bash
are each 5 to 7 apart.

**Fix.** Cut `yard.blades.lightBlades.a ↔ yard.blades.j1.a`.

- **Distances:** Keen Edge–Light Blades goes from 3 to 8, and Hewing–Light Blades from 4 to 11.
- **Start distances do not change:** nothing changes from the Reaver, Strider or Vanguard start to Elemental Edge,
  Headsman, Hewing or Keen Edge.
- **The pocket stays a bridge,** between the shield hub and the Four Winds star.
- **Light Blades stays 5 from Steel Rim.** That is a one-hander with a shield, at the threshold.

The rest of the Muster waits for the Yard re-lay that §16 already plans.

### 4. Medium-high: the chaos hexer at the Stair's top (new in round 3)

Rotting Word (`knife.hex.wheel.n1`) is 3 from Hexwright (`spire.craft.hexwright.n`) and 5 from Second Curse. A chaos
hexer is done at point 17. Hexwright and Second Curse, the two curse clusters, are only 7 apart.

**Fix.** Swap Hexwright and Devotion (`spire.craft.devotion`), notables and smalls together.

- **Hexwright** goes to 7 from Rotting Word and 11 from Second Curse, so the curse twins go from 7 to 11 apart.
- **Devotion** (reservation, generic) sits 3 from Rotting Word.
- **Unchanged:** Hexwright–Devotion stays 4, so the Mystic curse-aura build is unaffected. The Spire→Knife crossing
  (`hexwright.b ↔ knife.hex.wheel.n`) still lands on a small.
- **Start distances** to Hexwright go from 11 to 15 for the Shade and from 13 to 17 for the Mystic.

### 5. Medium: the Shieldwall spur is a road (§9.1)

`spurs.ts` checked all 27 keystones. Two spurs have a small with a through-link: Shieldwall, and Close Quarters, which
is yours (finding 12). `yard.shield.shieldwall.c` links Elemental Edge's notable and Executioner's small. The leech
two-hander's cheapest way from Headsman to Red Harvest runs through it.

**Fix.** Add one road node from `yard.shield.j2.a`, or `star.s`, to Elemental Edge and Executioner, and leave the spur a
dead end. It costs Headsman→Red Harvest 2 steps (14 to 16). Geometry is not checked.

### 6. Medium: the Barrows' two-hander row

Headsman, Greatblade and Heavy Hands hang off `wall.grit.east.e3`, `e2` and `e1`, with Thirsting Blade 5 from Headsman.
Their spacings (6 to 7) meet the letter of §5.2, but the road nodes are adjacent.

**Fix.** Move the Greatblade pocket from `wall.grit.east.e2` to `e7`.

- **Distances:** Headsman–Greatblade goes from 7 to 10, Heavy Hands–Greatblade from 6 to 11, and Red Harvest–Greatblade
  from 17 to 12.
- **Start distances:** the Reaver start goes from 23 to 21, nearer the Yard's dexterity (§5.4). The Vanguard start goes
  from 24 to 28.
- **The road gains a branch:** `e6–e8` is bare today.
- **Geometry is not checked;** the pocket needs placing.

### 7. Medium: the second minion homes do not serve their own classes

| Class start | Its own minion cluster (steps) | Shepherd, in the Cathedral (steps) |
| ----------- | ------------------------------ | ---------------------------------- |
| Vanguard    | Grave Host 23                  | 15                                 |
| Shade       | Black Flock 21                 | 18                                 |

- **Black Flock:** finding 1's swap fixes it.
- **Grave Host has two roles that conflict.** This is a question for you:
  - **The strength summoner's door.** It would have to be nearer than Shepherd. Scar Tissue's slot
    (`wall.resists.scarTissue`) would put it 12 from the Vanguard start, 10 from Shepherd and 13 from Ossuary. Scar
    Tissue, a grit notable, would fit the Barrows (`wall.grit`).
  - **Every summoner's farthest notable.** Leave it where it is, as its why says. Moving it to the Scar Tissue slot puts
    it 9 from the Zealot start, so the Zealot summoner would have it by about point 45 and lose its late trip.

### 8. Low: same pairings (d)

From `dups.ts`, keyed by stat, damage type, tag and condition.

| Pair                                                                  | Steps | What they share                                                                                        | Fix                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mist Walk (`spire.craft.mistWalk`) and Tumble (`knife.snares.tumble`) | 17    | Identical lines: spell dodge, attack dodge, movement speed. Distance does not rescue a copied pairing. | Re-partner Tumble, for example with evasion.                                                                                                                                                                                                                                         |
| Soft Step (`knife.home.softStep`) and Sidestep (`yard.dual.sidestep`) | 13    | Evasion, movement speed, attack dodge                                                                  | Defence, so low.                                                                                                                                                                                                                                                                     |
| Lingering and Rotting Word                                            | 10    | Duration with damage over time                                                                         | Re-partner Lingering, the generic one (no element), for example duration with area. Withering and Rotting Word then hold the damage-over-time lines. Re-partnering Rotting Word instead would collide with Tomb Dust (chaos spells with area) or the Cathedral's cast-speed casters. |
| Familiars and Shepherd                                                | 9     | Minion damage with minion life                                                                         | Different emphasis; low.                                                                                                                                                                                                                                                             |
| Tripwire (yours) and Trapper                                          | 8     | Trap damage with trap speed                                                                            |                                                                                                                                                                                                                                                                                      |
| Hewing and Hatchet Work (yours)                                       | 19    | Axe with bleed                                                                                         |                                                                                                                                                                                                                                                                                      |

### 9. Low: elemental strikes have one cluster per element

- **Cold.** Rimed Steel is the only cold-attack cluster. It sits 6 from Gilded Rod on one line, the shape round 2 flagged
  for fire.
- **Fire.** Kindled Steel is the only fire-attack cluster.
- **Lightning.** There is no lightning-attack cluster.

It passes §5.2, but a second home for each, with a different partner and away from the Cathedral (for example in the Wall
or the Yard), would give elemental strikers a late choice.

### 10. Low: wheels whose two generic sides are both taken

The Bulwark wheel (Mortar and Stone with Stone Heart, 3 apart) and Steel Rim with Scarred Hide (3 apart) are both
generic defence. An armour-shield build takes both sides. That is a §8.3 micro-choice issue, not a shop.

### 11. Low: at the threshold, noted only

- Thirsting Blade–Headsman 5.
- Shatter–Harsh Weather 5, Shatter–Fever Pitch 5.
- Light Blades–Steel Rim 5.
- Overcharge–Harsh Weather 4. Not re-walked; round 2 set it.

### 12. Your Strider (proposals)

- **The projectile rim** is the tightest shop in the tree: eight build notables in 28 points, with pairs 2 to 4 apart
  (St1).
- **Close Quarters' spur small** (`bow.flight.closeQuarters.a`) links `bow.flight.road.jp2` and Venom Fletching, so the spur
  is a road.
- **Same pairings:**
  - True Aim and Quick Hands (2 apart)
  - Vital Aim and Killing Eye (10 apart)
  - Tripwire and Trapper
  - Hatchet Work and Hewing
- **The round-2 proposals** in `audit/audit-tradeoffs.md` still apply.
