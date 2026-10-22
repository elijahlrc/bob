# G1b. The Vanguard (the Wall): growth brief

Written 2026-10-22 for phase G1b of [G-growth.md](../G-growth.md), from the ledger
([G1-ledger.md](../G1-ledger.md), with the user's answers of its §0) and the map as it is. It places nothing in the area
files. [CONSTRAINTS.md](../CONSTRAINTS.md) wins wherever this brief disagrees with it.

**Pictures** (in [vanguard/](vanguard/)):

- `today.png` is the region as committed, and `today-text.png` is the same with every node's lines (`--text`).
- `sketch.png` is the whole region with this brief drawn over it. Orange rings are new clusters, cyan lines new roads
  (small rings are their attribute nodes), green lines new links and crossings, red crosses cut links. Yellow discs are
  moved notables and keystones, with a line from where each stands today.
- `sketch-north.png` is a close-up of the Zealot border (the Battlements, the Rampart and the Barbican's west rim).
  `sketch-south.png` is a close-up of the Quarry and the Barrows (the Reaver border).
- `sketch.json` is the sketch's source, in the format of `scripts/passives/sketch.ts`. The pictures were drawn by a
  scratch copy of that tool that also prints the `label` of a move. The repo tool reads the same file and ignores the
  label.

Steps below count the nodes bought from a start ("V 9" means the ninth node from the Vanguard start). R is the Reaver
start and Z the Zealot start. Today's steps were measured on the network; steps to new nodes are estimates from the
links sketched.

## 1. The region today, as the map shows it

The Vanguard has 192 nodes in six areas.

- **The Gate (home).** The Oathbound loop, two strength hubs, the Unshakable pocket (stun, V 4) and the Quartermaster
  pocket (flasks, V 4). Three roads leave it: the rampart highway (strength), the tower road (three life smalls) and
  the slam highway (strength).
- **The Battlements (north, on the Zealot border).** The Elemental Ward resist star (V 9, Z 9), Scar Tissue, and
  Warlord's Banner (V 5, Z 3).
- **The Rampart (north-west).**
  - **The Bulwark wheel.** Its life side is Stone Heart (life and stun threshold) with three life smalls, and its
    armour side is Mortar and Stone with three armour smalls. They sit at V 8 and V 9.
  - **Pockets beside it.** Second Wind (regeneration and life, V 7), Iron Lungs (mana on hit), Steady Hands and the
    Unerring Discipline spur.
  - **Thick Skin** (armour and stun threshold, V 8). It belongs to the Rampart's area file, but it hangs off the
    tower road, west of the Gate.
  - Four defensive notables therefore sit at V 7 to 9.
- **The Barbican (west).** Weight of Iron (V 10), the five-way junction, Cleaver (axes, V 13), Crushing Blow, the
  Greatweight wheel (Greatweight and Broad Back), the Rooted Stance spur, and the road north to the Zealot's Battle Hymn
  with Hallowed Hammer (V 20) and Grim Oath (V 22) as pockets off it.
- **The Quarry (south-east, on the Reaver border).** Thunderstep (V 7), Bracing (V 6), Unhurried, Standing Cairns,
  Unbloodied, Vampiric Strikes, Ground Shaker and the Strongarm spur.
- **The Barrows (south-west, the largest area).** War Drums, the Unbroken wheel (Unbroken and Tempered), Heavy Hands,
  Blood Rite, Iron Liturgy, Two Fists, Long Reach, Stone Ward, and the east road to the Pits with Headsman, Barrow Ward,
  Greatblade and Grave Host off it.
  - The east end of that road faces the Reaver more than the Vanguard: Headsman is R 18 against V 22, Barrow Ward R 23
    against V 27, and Greatblade R 21 against V 28.

**Armour is already the Vanguard's voice as a partner.** Warlord's Banner, Broad Back, Iron Liturgy, Grave Host, Grim
Oath and Two Fists each carry 16 to 20% armour beside their own theme. What is missing is armour-led clusters away
from the Rampart, so a build that wants all the armour has somewhere else to go.

**Empty space inside** (from `G0/empty.png` and the close-ups):

| Space                                                                                  | Where (tree units)               |
| -------------------------------------------------------------------------------------- | -------------------------------- |
| A. The Quarry floor, between Weight of Iron, Thunderstep, Unbloodied and Ground Shaker | x −2200 to −1400, y 1200 to 1650 |
| B. Between the Gate's rampart highway and its tower road                               | x −1700 to −1350, y 400 to 720   |
| C. The Battlements' east                                                               | x −1800 to −1300, y −130 to 200  |
| D. The Barrows' middle, between Unbloodied, Stone Ward, Headsman and the east road     | x −1800 to −1450, y 1850 to 3100 |
| E. West of Iron Liturgy, between Two Fists and Long Reach                              | x −3150 to −2850, y 1900 to 2250 |
| F. The west rim, from Grim Oath to Rooted Stance                                       | x −4050 to −3750, y 100 to 1300  |
| G. The south rim below the east road                                                   | x −2100 to −1450, y 3250 to 3750 |

**Two looks faults** that a brief touching this area should fix:

- **Unerring Discipline sits 130 units from the Zealot's Idle Hands.** The two keystones nearly touch at the border.
- **The Battlements' label lies over Scar Tissue's name.**

## 2. The wants that need competition

From [G0/builds.txt](../G0/builds.txt), the four Vanguard archetypes and the sword build that comes west. The pairs are
units at 120 → 160 points.

| Archetype                   | Flat at 120 → 160 (units)                                                         | Why it is flat, on the map                                                                                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mace-shield                 | armour 17 → 22 (it holds 20.5 at 100 points); block 31.5 → 31.5; mace 14.2 → 14.2 | Its mace damage is all Weight of Iron (66% mace = the notable and three smalls). Crushing Blow is crit and Hallowed Hammer is elemental, so there is no second plain mace cluster. Block is Bracing plus the Reaver's Muster.    |
| mace-slam                   | armour 21.2 → 22.5; mace and two-handed 22.5 → 27                                 | The Bulwark, Thick Skin and Broad Back give all of its armour by 100 points. At 120 it walks to the Strider for attack speed (Hawk's Eye, Quick Hands, True Aim), since the Vanguard sells almost none.                          |
| two-hand-fire               | armour 21.2 → 24.8; two-handed 5.8 → 9.5; fire attacks 10 → 14                    | No fire-attack cluster on the strength side of the map. Its fire comes from the Reaver (Elemental Edge) and the Zealot.                                                                                                          |
| warcry-totem                | totems 9 → 9; warcries 0 → 7                                                      | One totem cluster (Standing Cairns) and one warcry cluster (War Drums).                                                                                                                                                          |
| sword-str (from the Reaver) | armour 19.8 → 21.2                                                                | It comes west through the Gate and takes Stone Heart (R 15), Mortar and Stone (R 16), Second Wind (R 14), Thick Skin (R 16) and Elemental Ward (R 16). That is all the Vanguard's armour within reach, in one north-west corner. |

The diagnosis for the Vanguard is the ledger's, made concrete. It has three causes:

- **The strength defence is one corner.** Four defensive notables sit at V 7 to 9 on one side of the Gate.
- **The Bulwark's two sides are life and armour,** which every strength build wants both of. That is a fake choice
  (CONSTRAINTS §8.3, §14), and life and armour converge on a home's main road (ledger §1 item 6).
- **The offence has one cluster per want:** one plain mace cluster, one totem cluster, one warcry cluster and no fire
  attacks.

### Verdicts on the ledger's rows for the Vanguard

| Ledger row                                                                 | Verdict                                         | Why, for players                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **VA-1** armour + all resistances, the Battlements                         | **Not built as a new cluster;** re-line instead | **Placement.** The Battlements' only free room (space C) lies 4 to 6 steps from both the Vanguard and the Zealot starts. An armour notable there is cheap armour for two starts by 60 points, which is the "strength by the back door" risk (G-growth §4). The rest of the Battlements is within 3 to 4 steps of Elemental Ward, the resistance twin it must keep 5 from. The north-west border is full of two keystone spurs. **Instead:** Elemental Ward's life line becomes armour, giving armour with resistances at V 9 and Z 9 for no new node, and Warlord's Banner loses its armour (below). The north keeps an armour reason to cross without a new cheap source.           |
| **VA-2** armour + shield block, deep west                                  | **Agree,** in Cleaver's place                   | Cleaver's slot (−2990, 864) is exactly "between the Rampart and the Barbican". Its links (Steady Hands, the Barbican junction, Crushing Blow) give VA-2 three ways in. V 13, R 21. VA-s1 is folded in as a fourth armour small. A staff cannot hold a shield, so VA-2 is for one-handers: the mace-and-board and sword-and-board build's far armour.                                                                                                                                                                                                                                                                                                                                 |
| **VA-3** armour + warcry effect, the Barrows                               | **Agree,** in the Barrows' middle               | At (−1900, 2830), on a new link from Stone Ward down to the east road. It is 7 from War Drums and 7 from Barrow Ward, at V about 18 and R about 22. That is the third armour direction (south-west) and far from the Reaver, so it does not hand the sword build cheap armour. VA-s2 is folded in as a fourth armour small.                                                                                                                                                                                                                                                                                                                                                          |
| **VA-4** mace + mace attack speed, the Quarry                              | **Agree on the cluster, not the place**         | In the Quarry it would sit in the same south-east quarter as Bracing (V 6) and VA-5, a mace-and-board one-stop. It goes to the Barrows' north road instead (−2450, 2320), between War Drums' junction and Long Reach's road: V about 16, the far fast mace, south-west, away from Weight of Iron (west) and VA-5 (south). The ledger's "Quarry to Muster" crossing for it is dropped (§4).                                                                                                                                                                                                                                                                                           |
| **VA-5** mace + life, between the Gate and the Rampart                     | **Agree on the cluster, not the place**         | Between the Gate and the Rampart is the tower road's direction: the same west-north-west line as Weight of Iron (V 10), so the mace would come from one direction twice. It goes to the Quarry floor (space A, −1830, 1420) on a new road from the slam junction to Ground Shaker. V about 10 by the slam road (south), 8 steps from Weight of Iron. Weapon with a defence is the good kind of pair (ledger §1 item 6). It sits off the home's roads, not on them.                                                                                                                                                                                                                   |
| **VA-6** fire attacks + stun duration, the Barbican's south                | **Agree,** on the west rim                      | At Hallowed Hammer's old place (−3900, 620), on the new west rim road that crosses to the Zealot's Censer. That is the ledger's own "Ambulatory rim to the Barbican" fire crossing: two-handed fire with the Ambulatory's burning. V about 19, Z about 21.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **VA-7** totem speed + duration                                            | **Agree,** west of Iron Liturgy                 | Between the Rampart and the Barrows, the only places free are 3 to 4 steps from War Drums, which would make the warcry-totem build's two wants one stop. It goes to space E (−2935, 2017), a bridge between the west road and Long Reach's road, beside Iron Liturgy (the totem caster's spells). That is V about 18 and 8 from War Drums, and the far totem against Standing Cairns' near one (V 10).                                                                                                                                                                                                                                                                               |
| **VA-8** shield attack + stun duration, between the Quarry and the Rampart | **Agree,** in space B                           | A diamond between the rampart highway and the tower road (−1560, 560), V about 6. A shield is not a weapon (§6.3 holds), and shield attacks are an optional porch. Bracing (block) is south-east of the start and VA-8 north-west, so the two shield clusters leave the start in different directions. Shield Bash, its twin, is far in the Reaver.                                                                                                                                                                                                                                                                                                                                  |
| **VA-s1** armour section, Barbican to VA-2                                 | **Folded into VA-2**                            | User's answer (§0): smalls belong to notables.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **VA-s2** armour section, Quarry to VA-4                                   | **Folded into VA-3**                            | VA-4 moved, and armour beside a fast mace in the Quarry would be armour near home again.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **VA-s3** life section, Battlements to VA-1                                | **Dropped**                                     | VA-1 is not built. Life is the stat that already climbs for every Vanguard build (the Vanguard has 32 units, the most of any region; ledger §2). The supply goes where tension is missing instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **VA-m1** Cleaver to the Quarry's south-east                               | **Agree on moving it, not on the spot**         | In the Quarry's south-east, Cleaver would be V 9 and R 9 to 11. That makes axes cheap for the Reaver's axe build, whose axe damage is one of the stats that still climbs (12 → 16), and flattens it. It goes instead to the Barrows' east road, whose road nodes are strength and dexterity (§5.4 holds). It is a bridge from e6 to the Reaver's Fosse rim road at f7: V about 28, R about 22, the same as today for the Reaver. **Steps to Hewing: 15.** Cleaver → its two smalls → e6 → e5 → e4 → e3 → Headsman a → Headsman b → `yard.blades.toHeadsman` r3 → r2 → r1 → Elemental Edge → its small a → Hewing b → Hewing (measured from e6: 12). Hewing is R 10 and Cleaver R 22. |
| **VA-m2** Hallowed Hammer to the Battlements                               | **Agree,** on the Battlements' west             | At the Narthex it would be 5 steps from both starts and beside ZE-5 (sceptre and armour). It goes instead to (−2540, −20): a pocket bridge from the Rampart junction to the Zealot's Vestry road (`cathedral.rods.toWall.a`), at V 12 and Z 12. It is 8 from Gilded Rod (Z: toWall.a → b → c → f1 → jR → r4 → r7 → Gilded Rod) and 10 from VA-6. Its old place takes VA-6.                                                                                                                                                                                                                                                                                                           |
| **VA-m3** Second Wind out of the Rampart                                   | **Agree,** and the Bulwark is fixed with it     | Second Wind goes to space D (−1650, 2070), a bridge from Unbloodied's tip to Stone Ward, with a crossing to the Reaver's Thirsting Blade (§3). That makes it the fork "regeneration or leech" with Vampiric Strikes and Thirsting Blade. V 13, R about 17, far from Barrow Ward (7 or more). The Bulwark's fake choice is fixed in §4.                                                                                                                                                                                                                                                                                                                                               |

**Crossings the ledger names on the Vanguard's borders** (its §7):

- **Narthex to Battlements** (ZE-5, Hallowed Hammer, VA-1). Hallowed Hammer goes to the Vestry side and VA-1 is not
  built. If the Zealot brings ZE-5 or its armour section (ZE-s1) to this border, land it on the Battlements junction
  (`wall.resists.j.a`), which already takes the Nave road. It should not land on the Banner chain, 3 to 5 steps from
  both starts.
- **Vestry to Barbican** (ZE-7, staff and spell block, with VA-2, armour and shield block). **Rejected:** a staff is
  two-handed, so "the war staff and the shield caster" is not one build. The Vestry and the Barbican are also not
  adjacent; the Rampart lies between them. The Vestry crossing is Hallowed Hammer's instead: maces and sceptres.
- **Ambulatory rim to the Barbican's south** (VA-6 with Kindled Steel and ZE-6). **Kept** as the west rim road to
  Censer.
- **Nave to Quarry** (ZE-4 with Bracing and VA-8). **Rejected:** the Gate lies between the Nave and the Quarry. A
  Zealot shield caster reaches Bracing and VA-8 through the Banner chain or the ring.
- **Quarry to Practice Ground** (Cleaver, RE-4). Cleaver moves elsewhere (VA-m1). For RE-4, the Quarry's landing is
  `wall.slams.toYard.a` (strength and dexterity), so the Reaver's west armour and the Vanguard's slams meet there.
- **Barrows to the Pits** (RE-7 with Heavy Hands and Headsman). **Rejected as named:** Heavy Hands, Headsman and
  Greatblade all sit on the east road, so RE-7 (two-handed and life) landing there would be a two-hander one-stop
  (§5.5; ledger twins of 6 or more). RE-7 belongs on the Pits' own west side. The Barrows–Fosse crossing is Cleaver's
  instead.
- **Quarry to Muster** (VA-4 with shields). **Rejected:** the two are not adjacent, and mace and board already meet at
  Bracing to Field Dressing.

## 3. Where each goes, and the skeleton

### New and moved clusters, with coordinates

| Cluster                                               | At (tree units)                                                               | Links (ways in)                                                                        | Steps V / R / Z |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------- |
| VA-2 armour + shield block (5)                        | −2990, 864 (Cleaver's square)                                                 | the Barbican's toCleaver, Steady Hands b, Crushing Blow a                              | 13 / 21 / 19    |
| VA-3 armour + warcry (5)                              | −1900, 2830                                                                   | Stone Ward (by a road node at −1830, 2580), east road e2                               | 18 / 22 / 26    |
| VA-4 mace + mace speed (4)                            | −2450, 2320                                                                   | north road `north.a`, south-west road `southWest.b`                                    | 16 / 20 / 24    |
| VA-5 mace + life (4)                                  | −1830, 1420                                                                   | Quarry floor road: slam junction, Ground Shaker                                        | 10 / 14 / 18    |
| VA-6 fire attacks + stun (4)                          | −3900, 620                                                                    | toHymn r2, west rim road both ways                                                     | 19 / 27 / 21    |
| VA-7 totem speed + duration (4)                       | −2935, 2017                                                                   | west road `west.c`, Long Reach's `reach.a`                                             | 18 / 23 / 24    |
| VA-8 shield attack + stun (4)                         | −1560, 560 (diamond, radius 55)                                               | `roadR.b`, `roadM.b`                                                                   | 6 / 13 / 10     |
| Hallowed Hammer (moved, +1 small)                     | −2540, −20                                                                    | Rampart junction j1 (chain of two smalls north), `cathedral.rods.toWall.a` (one small) | 12 / 19 / 12    |
| Thick Skin (moved, notable and two armour smalls new) | −3830, 1150                                                                   | on the west rim road, next to the Rooted Stance junction `j2`                          | 17 / 25 / 23    |
| Stone Heart (moved)                                   | −1931, 880 (Thick Skin's pocket)                                              | tower road `roadM.b` by `toThickSkin`; its two smalls become life                      | 8 / 16 / 14     |
| Iron Lungs (moved)                                    | −2179, 380 (Stone Heart's place on the Bulwark)                               | the wheel; its smalls b and f become mana on hit                                       | 8 / 15 / 12     |
| Second Wind (moved)                                   | smalls −1600, 1860 and −1620, 1960; notable −1650, 2070                       | Unbloodied's tip, Stone Ward (one road node), Thirsting Blade (one road node)          | 13 / 17 / 21    |
| Cleaver (moved)                                       | smalls at −1180, 3290 and −1171, 3350; notable −1160, 3420; small −1149, 3490 | east road e6, Fosse f7                                                                 | 28 / 22 / 32    |
| Unerring Discipline spur (re-aimed)                   | −2680, 230; −2760, 205; keystone −2860, 175                                   | Rampart junction j1, as today                                                          | 12 / 19 / 15    |

Every new cluster has two or more ways in (§3.5). Layout follows §11.5:

- Chains run straight on the line between their two ends.
- VA-2 keeps Cleaver's square; VA-8 is a diamond of radius 55.
- The others are a notable with smalls clumped about 70 out, then 50 to 60 apart.

The sketch's positions are the clusters' centres. G3 lays the nodes out and runs `geometry.ts`.

### Roads and links

- **The west rim road** (three strength nodes, plus one strength-and-intelligence node to the Zealot). It runs from
  Grim Oath's tip south along the rim through VA-6 and Thick Skin to the Rooted Stance junction `j2`. A spur north goes
  from Grim Oath to the Zealot's Censer (`cathedral.ambulatory.censer.n`).
  - Grim Oath, VA-6 and `j2` stop being dead ends. The Barbican's west tip becomes a loop with the toHymn road.
  - Something branches off it at every node or two (Grim Oath, VA-6, Thick Skin, the Rooted spur), so it is not filler
    (§7.3).
- **The Quarry floor** (two strength nodes). It runs from the slam junction `wall.slams.j1.a` through VA-5 to Ground
  Shaker. It is a third way between the Quarry and the Barbican, and it fills space A.
- **The Barrows' middle** (two road nodes). Second Wind → road node → Stone Ward → road node at (−1830, 2580) → VA-3 →
  e2. This is a north–south line through space D.
  - Stone Ward becomes a bridge, and Unbloodied gains a third way in.
  - The Barrows get a middle loop. Today the only routes between the Quarry and the east road go round by War Drums or
    the Pits.
- **Re-landings** where moves leave a hole:
  - The resist star's chaos spoke and the Bulwark's north small (b) land on `wall.rampart.toWind.a`, which kept Second
    Wind joined to the rampart highway.
  - Iron Lungs' old two smalls stay as two strength road nodes, from Mortar and Stone to the Barbican junction, so the
    Rampart–Barbican loop keeps its link.
- **Cuts:** only the three links Second Wind leaves (`secondWind.n–star.c`, `secondWind.b–toWind.a`,
  `bulwark.b–secondWind.a`), each replaced as above. No cut leaves an area, wheel or run of clusters with a single way
  in.
  - The region's problem is not too many links. Every pocket that was a bridge stays one.
  - The new bridges (Grim Oath, Hallowed Hammer, Stone Ward, Thirsting Blade, Cleaver) add loops at the
    edges and through the middle, not shortcuts from the home.

### Crossings

Today the Zealot border has 5 links: Banner to `hubs.w`, Battlements junction to `nave.toWall.a`, Scar Tissue to
`rods.toWall.a`, Stagger to `ambulatory.toWall.d`, and `toHymn.r4` to `hymn.b`. There is one more through the ring.

The Reaver border has 6: `toYard.a` to `guarded.b`, Bracing b to `fieldDressing.b`, slam `j2` to `blades.j1`,
Headsman b to `toHeadsman.r3`, e8 to `blood.toWall.a`, and Barrow Ward to `fosse.f7`. There is one more through the
ring.

| Border | My node                               | Their node                      | Kind | The combination it serves                                                                                                                                                                                   |
| ------ | ------------------------------------- | ------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zealot | Hallowed Hammer's outer small         | `cathedral.rods.toWall.a`       | near | **Maces and sceptres.** The Zealot's sceptre fighter reaches Hallowed Hammer's elemental attacks; the Vanguard's mace reaches the Vestry's strength-and-intelligence road and Gilded Rod.                   |
| Zealot | west rim road node north of Grim Oath | `cathedral.ambulatory.censer.n` | dear | **Two-handed fire.** VA-6 with Censer's burning, and on to Searing Avatar and Kindled Steel. Censer stops being a dead end.                                                                                 |
| Zealot | `wall.resists.j.a` (offered)          | the Zealot's ZE-5 / ZE-s1       | near | **The armoured sceptre.** It meets Elemental Ward's armour and resistances; the Zealot brief places it.                                                                                                     |
| Reaver | Cleaver's outer small                 | `yard.fosse.road.f7`            | near | **Axes by the Fosse.** The Reaver's axe and bleed build reaches Cleaver (axe speed) by its rim road, and a Vanguard reaches the Fosse's lightning and curses.                                               |
| Reaver | road node east of Second Wind         | `yard.blades.thirst.n`          | near | **Regeneration or leech.** The Reaver's attacker reaches Second Wind; the Vanguard's warcry and totem build reaches Thirsting Blade. One of the two is enough for most builds, so it is a fork, not a pair. |
| Reaver | `wall.slams.toYard.a` (offered)       | the Reaver's RE-4               | near | **The Reaver's west armour,** next to the Vanguard's slams. The Reaver brief places it.                                                                                                                     |

That brings the Zealot border from 5 to 7 (8 with ZE-5), and the Reaver border from 6 to 8 (9 with RE-4), plus the
ring's two (and the centre's CE-3). The reference's pairs have 10 to 13 links each. The rest should come from the
neighbours' briefs, landing on the nodes offered here. The joining agent may also put a near bridge in space C
(the Battlements' east) if the Zealot needs one. I left it empty on purpose: anything there is 4 to 6 steps from two
starts.

## 4. Existing clusters: moved, re-lined, re-partnered

- **The Bulwark's sides become a real choice** (§8.3; ledger §1 item 6).
  - Iron Lungs (mana on hit, mana leech, mana) moves into Stone Heart's place on the wheel. The wheel's own north smalls (b, f) are re-lined to mana on hit, and
    its entrance (a) becomes a strength road node. Iron Lungs' old two smalls stay where they are as strength road
    nodes (§3, "Re-landings").
  - The route through the wheel, from the rampart highway to the Rampart junction, now takes the sustain side. Mortar
    and Stone's armour side is the detour: three armour smalls and the notable, four more points.
  - Stone Heart (life and stun threshold) moves to Thick Skin's pocket off the tower road. The tower road's life
    smalls lead to a life notable: west is the life direction, north-west the armour direction.
  - Life and armour no longer share a cluster near the home or on its main road. Oathbound (life, melee and strength
    at step 2) stays the signature exception, as First Light does in the Mystic. Broad Back (life and armour, V 13,
    R 21) stays as the far hybrid "worth a detour".
- **Thick Skin** (armour and stun threshold) moves from V 8 to the west rim (V about 17), next to the Rooted Stance
  junction. Rooted Stance makes stun threshold moot, so the notable beside it is a fork (ledger §4.7).
- **Second Wind, Hallowed Hammer, Cleaver:** see the verdicts in §2.
- **Warlord's Banner: drop its armour line.** It has three themes today (reservation, armour, mana; §10.2) and is 3
  steps from the Zealot start and 5 from the Vanguard's. It becomes reservation, aura effect and mana: the one theme
  its name says.
- **Elemental Ward: its life line becomes armour.** It stays the resist star whose four spokes land in four places, and
  it is now the north's armour with resistances (VA-1's intent), at V 9 and Z 9, worth about 1.3 units of armour.
- **Unerring Discipline's spur** turns west so its keystone stands about 320 units from Idle Hands instead of 130
  (§11.2). Its links are the same.
- **New mace clusters** (VA-4, VA-5) use `weaponDamage('mace')`, not `maceDamage` (which also names sceptres), so each
  weapon's twins count right (ledger §10).
- Nothing else moves. The Gate is left as it is (§6): its first notables are at 2 to 4 steps, and nothing within three
  names a weapon.

## 5. Size

| What                              | Nodes                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Seven new clusters (VA-2 to VA-8) | 30: 7 notables and 23 smalls (two folded section smalls included)                                               |
| Roads and crossing nodes          | 9 (west rim 3, to Censer 1, Quarry floor 2, Barrows middle 2, to Thirsting Blade 1)                             |
| Moves, net                        | +3 (Thick Skin's new notable and two smalls; one extra small on Hallowed Hammer; minus Iron Lungs' old notable) |
| **Total**                         | **about 42: 192 → about 234 nodes, 7 more notables**                                                            |

That is under the ledger's 49, by VA-1 (4 nodes) and VA-s3 (3), for the reasons in §2. It fits inside: spaces A, B, D,
E and F take everything, and only the west rim road runs along the rim, inside the circle. Spaces C and G stay empty
and are the region's reserve for a second round. Nothing was placed to reach a count.

**Armour supply, against the ledger.** The ledger counted about 22 armour units of new supply in the Vanguard (VA-1,
VA-2 and VA-3 at about 5.5 each, plus the two armour sections). This brief gives about 13: VA-2 and VA-3 at about 6.5
each with their folded smalls. Thick Skin's move is net zero (its two old armour smalls become Stone Heart's life
smalls, and it brings two new ones), and Elemental Ward's +1.3 offsets Warlord's Banner's −1.3. That is **about 9
units under**. If the allocator still shows the strength builds flat on armour after G3's first round, the joining
agent can place the difference far out: in space G (the south rim below the east road) or with the Reaver and the
Zealot, not near the two strength starts.

## 6. The user's two examples, and a Vanguard walk

**The strength sword build (Reaver start), at 120 points.**

- **Today** it goes west through the Gate and takes the whole north-west corner: Stone Heart (R 15), Mortar and Stone
  (R 16), Second Wind (R 14), Thick Skin (R 16) and Elemental Ward (R 16). It ends with 202% armour, which 40 more
  points raise by 16%.
- **After this brief,** the Vanguard's armour lies in four places from the Reaver:
  - **Through the Gate.** Oathbound (R 10, life and melee), Stone Heart (R 16, life, west) and Mortar and Stone (R 16,
    armour, north-west behind the sustain side). These are now two branches, not one wheel.
  - **Deep west.** VA-2 (R 21, armour and shield block, for sword and board), Broad Back (R 21) and Thick Skin (R 25).
  - **South-west.** VA-3 (R 22, armour and warcries) and Second Wind (R 17, regeneration).
  - **At home.** The Reaver's own RE-4 on its west side (the Reaver brief).
- With three sword directions of its own (RE-1 east, RE-2 and RE-3 south and south-west), it cannot take all of these.
  - **(a) Gate and home:** Mortar and Stone, Stone Heart and RE-4, with the east speed. It gives up VA-2, Broad Back
    and Thick Skin.
  - **(b) Deep west:** the Gate's two plus VA-2 and Broad Back. It gives up the east (RE-1 and the Strider's speed).
  - **(c) South:** Second Wind, Thirsting Blade and RE-3's leech. It gives up most of the armour.
- What 40 more points buy is then VA-2 (about 4.5 units to a sword-and-board build), Broad Back (3.7) and Thick Skin
  (about 3.7): notables it wanted (target 3).

**The classic caster** does not touch the Vanguard. Iron Liturgy and Stone Ward are the Vanguard's caster nodes, and
they serve the Zealot's block caster, not the Mystic.

**Mace and shield (Vanguard start), at 120 points.**

| Want   | Where it lies after this brief                                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maces  | Five directions: Weight of Iron (west, V 10), VA-5 (south, 10), Hallowed Hammer (north-west, 12), VA-4 (south-west, 16), Crushing Blow (far west, 16, crit) |
| Block  | Bracing (south-east, 6), VA-2 (west, 13) and the Reaver's Muster                                                                                            |
| Armour | Mortar and Stone (north-west, 9), VA-2 (13), Broad Back (13), Thick Skin (17) and VA-3 (18)                                                                 |

- **At 60 points** it holds the home, Bracing, Mortar and Stone, Stone Heart, Weight of Iron and one of VA-5 or VA-8.
- **At 120** it adds the west (VA-2, Broad Back) and one more mace direction. It gives up two of Hallowed Hammer,
  VA-4, Thick Skin and VA-3.
- The mace's own supply goes from one cluster (14 units) to four plain ones (about 25 units). The build takes two or
  three, so mace stops being flat at 14.

## 7. Tensions said out loud (§13)

1. **Tension against a good start** (§6, §13.8). Moving Thick Skin from V 8 to 17 thins the Vanguard's early armour to
   the start's armour small, Mortar and Stone (9) and Elemental Ward's armour line.
   - VA-8 (6) and Stone Heart (8) sit near home but are a porch and life, not armour.
   - **I leaned toward tension:** the Vanguard's own builds still have armour at 9, life everywhere, and a choice of
     directions in the first ten points.
   - If the walks in G3 show the Vanguard's first 20 points thin on defence, Thick Skin's move is the one to revisit.
2. **Connections against trade-offs** (§13.1). The two Reaver crossings join Second Wind with Thirsting Blade, and
   Cleaver with the Fosse.
   - Each pair is a fork of things a build rarely takes both of: regeneration or leech, and an axe far from the
     Reaver's other axe.
   - Neither brings the Reaver's main wants nearer. Cleaver is R 22 as today.
   - I refused a Quarry spot for Cleaver that would have been better for "axes from either start" but put it at R 9.
3. **Identity against spread** (§13.2). Maces are concentrated in the Vanguard (the ledger's choice). They come in five
   directions with five partners (stun, life, elemental, speed, crit), 6 or more apart. Armour is the partner on six
   existing notables and the lead in five, in four directions.
4. **Bridges against dead ends** (§13.5).
   - Grim Oath, VA-6, Stone Ward, Thirsting Blade, Cleaver and Hallowed Hammer become bridges; Unbloodied gains a
     third way in.
   - Dead ends stay: the four keystone spurs, Stone Heart's pocket, Unhurried, Long Reach, Two Fists, Grave Host and
     Greatblade.
5. **Highways against filler** (§13.4). The west rim road is 3 strength nodes plus one crossing node, and every one
   has a cluster or keystone spur off it. The other new road nodes are single joints between clusters (§3.4).
6. **Three spurs side by side off the east road** (§11.5). Cleaver's chain (x about −1160) would run between
   Barrow Ward's (−1340) and Greatblade's (−1010), 140 to 190 units apart, with its tip link to the Fosse passing about
   120 from Greatblade. At zoom-out that may read as a picket fence. It is a G3 layout judgement: fan the three spurs,
   or move Barrow Ward's chain west into space G.
7. **Rim against footprint** (§11.3, §13.7). Only the west rim road follows the rim, and it stays inside today's
   circle. Both borders keep their line.
8. **Convergence against the user's examples.** VA-5 (mace with life) is a weapon with a defence, which the ledger
   treats as a good pair. It is at V 10 off the slam junction, not on a home road. VA-2 (armour with block) is two
   defences of a shield build, and it is placed far (V 13, R 21).
9. **Size against padding** (§12.1). The region comes in at about 42 new nodes against the ledger's 49. VA-1 is not
   built and its life section is dropped, rather than placing nodes near two starts where they would lower tension.

## 8. For the joining agent

- **Partner and region changes I ask for** (the ledger's call):
  - VA-1 is not built. Elemental Ward is re-lined to armour with resistances, and Warlord's Banner loses its armour.
  - VA-s2's armour goes to VA-3. VA-s3 is dropped.
  - Cleaver goes to the Barrows' east road and the Fosse, not the Quarry.
- **Crossings rejected:** Vestry to Barbican (staff with shield), Nave to Quarry, Quarry to Muster, and RE-7 on the
  Barrows' two-hander road.
- **Landings I offer:**
  - `wall.resists.j.a` for ZE-5 or ZE-s1.
  - `wall.slams.toYard.a` for RE-4.
  - The Zealot's `cathedral.rods.toWall.a` takes Hallowed Hammer, and `cathedral.ambulatory.censer.n` takes the rim
    spur.
  - The Reaver's `yard.blades.thirst.n` takes Second Wind's crossing, and `yard.fosse.road.f7` takes Cleaver's.
- **The Battlements' label** lies over Scar Tissue today, and Hallowed Hammer comes under it. Move it in G3.
- **Blood Rite is V 24.** §16's working range is 8 to 18. This brief does not change it; the Barrows' middle road does
  not bring it nearer.

## 9. Open questions for the user

1. **VA-1.** Instead of a new armour cluster at the Zealot border (cheap for two starts), Elemental Ward gets an armour
   line and Warlord's Banner loses its armour. Is that the north armour you want, or should VA-1 exist somewhere
   farther out?
2. **The Bulwark.** Iron Lungs (mana sustain) goes on the route through the wheel, with Mortar and Stone's armour as
   the detour, and Stone Heart moves to the tower road. Is mana on the route right, or would you rather the wheel's
   other side be something else?
3. **Cleaver.** Far from both starts (Vanguard 28, Reaver 22) on the str/dex road by the Fosse, rather than 9 from both
   in the Quarry. The Vanguard's own axe build would then use Hewing (14). All right?

Nothing here felt like it was losing intent. The one place I was least sure is item 1 of §7: the Vanguard's early
armour after Thick Skin leaves.

## 10. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Every flat Vanguard want gets a second or third direction with a different partner:
  - armour in four directions;
  - mace in five;
  - totems, warcries and fire attacks each a second home.

  Tension is weighed against the start (§7 item 1), not placed above it.

- **§2 The reference.** No names given; G3 names new clusters in plain words (§2.4). Twin distances follow the
  ledger's scaled 5 or more.
- **§3 A network.** Every new cluster has two or more ways in. Seven pockets become bridges. Crossings go from 5 and 6
  to 7 and 8, plus the offered landings (§3.7). Each is named for a combination, and of three kinds: near, dear and
  ring.
- **§4 Regions and areas.** No build-named area. The defences stay varied: life, armour, resistances, stun, block,
  spell block, regeneration and leech. Attack speed is now sold in the Vanguard's voice (maces, totems, two-handers).
- **§5 Specializations.** Twins 5 or more apart with different partners (§5.1–2). Concentration per the ledger (maces
  concentrated, armour home and neighbours). Weapons sit by their attributes: Cleaver on a strength-and-dexterity
  road, Hallowed Hammer on the strength-and-intelligence Vestry road (§5.4). Neighbours compete (§5.5): VA-4 and VA-7
  were moved for it.
- **§6 Starts and homes.** The Gate is unchanged. The first notables are 2 to 4 steps out, and nothing within three
  names a weapon. VA-8 at 6 is an optional porch.
- **§7 Roads and attributes.** The new roads are attribute nodes, with clusters off every node or two. Crossing nodes
  carry both regions' attributes. Attribute supply rises a little, which G5 re-checks.
- **§8 Clusters and smalls.** Every small has a notable. The only new runs without one are road and crossing nodes,
  and the two folded sections went into clusters. The Bulwark's fake sides are fixed (§8.3). New notables are priced
  at 3 to 5 units in G3.
- **§9 Keystones.** All four stay dead-end spurs. Unerring's is re-aimed. Rooted Stance gains a fork beside it (Thick
  Skin). Blood Rite at 24 is outside the working range (§8 above).
- **§10 Vocabulary.** New: fire attacks with stun, shield attacks with stun, mace attack speed, totem duration and
  speed. Each cluster has one theme. `weaponDamage('mace')` is used for the new mace-only clusters. Warlord's Banner
  goes back to one theme.
- **§11 Looks.** Clusters are tight, chains straight and shapes regular (§11.5), and none crosses another in the sketch.
  The two keystones that nearly touch are separated. A label must move.
- **§12 Size.** About 42 new nodes, an outcome under the ledger's figure, with the reasons given. No simulation was run.
- **§13 Tensions.** Nine are said out loud in §7.
- **§14 Rejected ideas** steered round:
  - no filler road;
  - no section or area named for a stat;
  - no step-count reach radius (steps here are costs, not a test);
  - no build list as the basis: the walks only check;
  - no fake wheel sides;
  - no generation: every position was chosen by looking.
- **§15 How the work is done.** I read CONSTRAINTS in full, looked at the region, its borders and the empty space
  before writing, and drew the pictures (today, text, sketch and two close-ups). The walks are in §6.
- **§16 Open.** The borders move toward 10 to 13. The single-mace one-stop is fixed. Cleaver's attribute problem is
  fixed. Blood Rite's distance is noted.
