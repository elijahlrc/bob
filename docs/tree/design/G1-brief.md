# G1b joined: the whole-map growth brief

Written 2026-10-22 for phase G1b of [G-growth.md](G-growth.md): the six region briefs ([G1/mystic.md](G1/mystic.md),
[G1/zealot.md](G1/zealot.md), [G1/shade.md](G1/shade.md), [G1/strider.md](G1/strider.md),
[G1/vanguard.md](G1/vanguard.md), [G1/reaver.md](G1/reaver.md)) reconciled into one, the borders decided pair by pair,
the centre planned, and the user's review prepared (**user stop 2**). [CONSTRAINTS.md](CONSTRAINTS.md) wins over this
document and over the briefs; the ledger's §0 (the user's answers) wins over the rest of
[G1-ledger.md](G1-ledger.md). Nothing in the network changed: this is a design with a sketch.

**Pictures** (folder [G1/joined/](G1/joined/)). Orange rings are new clusters, cyan lines new roads (small rings are
their nodes), green lines new links, red crosses cut links, yellow discs moved nodes with a line from where each stands
today.

- `today.png`: the whole network as it is (1,009 nodes).
- `whole.png`: the whole network after this brief, cluster ids only so it reads on a phone.
- Close-ups with every pairing written out: `nw-top.png` (the far loop between the Mystic and the Zealot),
  `ne-top.png` (the Mystic's two rim roads and the road to the Rooftops), `stair.png` (the Mystic–Shade border:
  MY-10, the curse crossing, SH-1, SH-15), `zealot-vanguard.png` (ZE-5, Hallowed Hammer, ZE-7), `west-rim.png` (the
  Zealot's outer walk, ZE-8, Grim Oath, the Vanguard's west rim road), `south-west.png` (Second Wind, Thirsting Blade,
  RE-2, Cleaver, the two-hander wheel), `ford.png` (RE-6, RE-1, the Lists), `fosse-corner.png` (the outer road's south
  end, ST-4, ST-10, RE-3, Stormstruck), `east-j1.png` (the Shade's rim road meeting the Strider's outer road),
  `centre.png` (the four new arches).
- `sketch.json` is the joined sketch (full labels; `npm run passives:sketch -- docs/tree/design/G1/joined/sketch.json
out.png [--box x0,y0,x1,y1]`); `sketch-ids.json` is the same with ids only, for `whole.png`.
- The six region sketches (`G1/<region>/sketch.json`) are corrected to match this brief. The pictures in the region
  folders show each brief **before** the join.

Steps quoted here ("8 steps") are nodes bought from a start, measured by a scratch script on today's network with the
joined sketch applied (each new cluster modelled as its notable with one small toward each of its first two ends, the
shortest it can be built). They are lower bounds, good to a step or two, and G2/G3 replace them with the allocator.

---

## 1. Summary

### 1.1 Region by region

| region          | new notables | new smalls | new road nodes | moved or re-lined (existing)                                                                                                                                                                           | removed                                     |    nodes before → after |
| --------------- | -----------: | ---------: | -------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ----------------------: |
| Mystic          |           11 |         36 |              9 | Quickening and Siphon moved; Warded Mind (no ES), Glass Skin (ES with mana), Wand Volley (speed, no crit) re-lined; Steady Stream, Snare Line, Cinder become bridges                                   | none                                        |               184 → 240 |
| Zealot          |           11 |         39 |             12 | Iron Faith re-lined (shield only); Lone Vow's spur re-hung off the new aisle; Shattering Rite re-priced; five pockets become bridges                                                                   | none                                        |               152 → 214 |
| Shade           |           15 |         53 |              9 | Shroud re-lined (ES, avoid stun, recharge); Whetted Will re-priced; Thick Blood gains two life smalls; Sleet and Static Edge moved; five pockets become bridges                                        | none                                        |               146 → 223 |
| Strider         |           10 |         37 |             22 | Round Shield and its four mana smalls re-lined; Weathered, Longbow, Far Flight re-priced; three edge links get a road node; Pitch Arrows becomes a bridge                                              | none (its four cuts are links)              |               147 → 216 |
| Vanguard        |            7 |         26 |              8 | Hallowed Hammer, Cleaver, Second Wind, Thick Skin, Stone Heart, Iron Lungs moved; Unerring's spur turned; Elemental Ward (armour for life) and Warlord's Banner (no armour) re-lined                   | none                                        |               193 → 234 |
| Reaver          |            9 |         24 |       14 (net) | the Muster's lattice re-laid as a grid of roads; Scarred Hide (life, stun threshold) and Guarded (armour, evasion) re-lined; Hot Blood, Spellsword, Executioner, three keystone spurs moved or re-hung | 5 single road nodes, 2 keystone-spur smalls |               151 → 198 |
| Centre          |            4 |          8 |              0 | none                                                                                                                                                                                                   | none                                        |                 36 → 48 |
| **The network** |       **67** |    **223** |         **74** | about 40 existing notables moved or re-lined                                                                                                                                                           | 7 nodes                                     | **1,009 → about 1,373** |

(The Vanguard's 26 smalls count Thick Skin's two new ones and Hallowed Hammer's extra one; its net is +41.)

### 1.2 What the briefs did with the ledger

- **Built:** 63 of the ledger's 66 new clusters, four of them with a changed partner or lead (below).
- **Placed somewhere other than the ledger's spot, for a reason on the map:** most of them. The common reasons were a ledger spot that made a
  one-stop on the map (curses beside Second Curse, the poison dagger beside Barbed Point, the mace in the Quarry beside
  Bracing), or broke the ledger's own twin distance (ZE-8 three steps from Choirmaster, SH-3 within 6 of Flashes of
  Insight).
- **Partner changed:** ZE-5 armour-led (sceptre with armour, three armour smalls); ZE-8 life-led; RE-5 attack-speed-led
  (warcry on the notable); RE-9 dual wield with life, as the other side of RE-7's wheel (not with leech, which would
  have made the Pits a leech one-stop); Scarred Hide life with stun threshold (not life on block, which would have made
  both sides of its wheel shield notables).
- **Not built:** SH-5 (a fourth claw cluster, a step from SH-6), ST-8 (it would merge the Twin Fangs wheel's own
  choice), VA-1 (the only free room was 4 to 6 steps from two starts; Elemental Ward takes armour instead).
- **New beyond the ledger, each for a named constraint:** MY-11 (spell damage with penetration on the Mystic's spine,
  where MY-s1's supply went), ST-9 (life with resistances, the Strider's outer road's life and the Shade's way onto it),
  ST-10 (poison with bow damage, a second poison direction).
- **Small sections:** all 30 folded into notable clusters (the user's answer), except four dropped as cheap supply near
  a home (ZE-s5, SH-s6, VA-s3, RE-s2). The only notable-less run left is the Reaver's Shieldwall a–b–c, which becomes
  a block bridge once the keystone spur is unhooked (§9.1 makes it so).

### 1.3 Size

**About 1,373 nodes**, 364 new: 67 notables, about 223 smalls, 74 road nodes. That is about 110 under the 1,480 the
user set as the start. The difference is not a shortfall of design: the ledger's 90 section smalls became about 45
cluster smalls under the user's own answer, three clusters were struck for cause, and the rim roads came out shorter
than the ledger's (two short Mystic roads of 3 and 5 instead of one of 18). Every brief names reserve room for a
second round; question A1 asks the user which way to lean.

---

## 2. The borders

Link counts are direct links between the two regions; the centre ring and its arches come on top. "Near" is a bridge of
one or two nodes close to the homes, "dear" a road of several nodes between far areas, "ring" the centre.

**Before → after:** Mystic–Shade 4 → 7, Mystic–Zealot 4 → 6, Zealot–Vanguard 5 → 8, Vanguard–Reaver 6 → 9,
Reaver–Strider 6 → 7 (from 3 places to 6), Strider–Shade 4 → 8. In all 29 → 45, against the reference's 10 to 13 per
pair. Each border's section ends with what was declined and why, so the shortfall is a decision, not an omission (§3.7:
"never at random"; §13.1: connections against trade-offs). Question A2 asks the user.

### 2.1 Mystic–Shade: 4 → 7

| crossing                             | Mystic end                                | Shade end                                   | kind | the combination                                                                                                      |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------- |
| today: Spoils road                   | `spire.craft.toKnife.b`                   | `knife.home.spoils.b`                       | near | (kept)                                                                                                               |
| today: Thick Blood                   | `spire.craft.toAlleys.r2`                 | Thick Blood                                 | near | (kept)                                                                                                               |
| today: Devotion                      | `spire.craft.devotion.b`                  | `knife.hex.wheel.n`                         | near | (kept)                                                                                                               |
| today: the storm road                | `spire.storm.roadS.a`                     | `knife.hex.toSpire.b`                       | near | (kept)                                                                                                               |
| **the dagger caster's bridge** (new) | MY-10 (dagger spell, cast speed)          | `knife.hex.toSpire.a`                       | near | The Shade's dagger caster reaches MY-10, Mist Walk and MY-1; the Mystic caster reaches the Stair (SH-1, Spellslip).  |
| **the curse crossing** (new)         | Hexwright, through a node at (1470,−2760) | `knife.hex.j4.a`                            | near | The curser from either start: Hexwright with the Shade's curse home (Second Curse 9 steps, SH-8 9).                  |
| **the Rooftops road** (new)          | the Mystic's north-east rim road          | `knife.roofs.ridge.y1`, beside Black Powder | dear | Traps and mines (Snare Line, Black Powder), cold (Shatter, Sleet, SH-12), the crit wand (MY-6) for an int-dex Shade. |
| ring                                 | CE-1 on the ring's north-east diagonal    |                                             | ring | Stun protection for both homes' casters (§3).                                                                        |

**Conflicts resolved:**

- **Two hexer crossings.** The Mystic proposed Hexwright → a road node → `j4.a`; the Shade proposed `hex.climb.a` →
  `spire.craft.toDevotion.a`. Both serve the same combination 250 units apart. **The Mystic's is kept**: it lands in a
  new place, while the Shade's would be a second link into the Devotion corner 300 units from today's
  `devotion.b`–`wheel.n`. The Stair's west still becomes a loop (j4 → Hexwright → Devotion → the wheel → the climb).
- **The Shade's M4** (Black Powder through a new node to "the Mystic's north rim road near Snare Line") ran almost on
  top of the Mystic's north-east rim road, which already lands on `ridge.y1`, one step from Black Powder. **It is folded
  into the Mystic's road**; the Shade loses one node.
- **The Mystic's "north rim road" was not rejected outright**: the Mystic replaced the ledger's single 18-node road
  over the Belfry with two short rim roads (north-west, 3 nodes after the join; north-east, 5) joined across the top by
  today's road through Shatter. Both crossings that assumed the ledger's road now land on what the Mystic proposes: M4
  on its north-east road (above), M2 on its north-west road (§2.2).
- **SH-13 gets no link toward the Mystic home** (the Mystic's condition): confirmed. The Shade moved SH-13 to the
  Rookery's north (between Shade Leech and Hollow Vessel), with both ends inside the Shade.

**Declined:** the ledger's Spire gate–Knife Gate rung (both briefs: it brings Sharp Mind from 10 to 6 steps for the
Shade start and Spoils from 10 to 6 for the Mystic, strength by the back door); Quiet Knife to the Mystic's Knife road
(three steps cheaper for the Mystic caster, nothing for a Shade build); the ledger's Scriptorium–Stair through SH-3
(SH-3 moved to the east rim to keep 15 steps from Flashes of Insight; the curse crossing takes this stretch of border).
**Seven is enough here**: the inner border already has four links within 1,500 units, and the Shade brief found that
the Shade's casters living in the Mystic is today's problem, not a missing link.

### 2.2 Mystic–Zealot: 4 → 6

| crossing                  | Mystic end                                        | Zealot end                                     | kind | the combination                                                                                                                                        |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| today: Familiars          | Familiars                                         | `cathedral.crypt.toSpire.b`                    | near | (kept)                                                                                                                                                 |
| today: Hymn               | `spire.well.toCathedral.b`                        | `cathedral.home.hymn.b`                        | near | (kept; it is the ledger's "Cloister to Narthex")                                                                                                       |
| today: the crypt road     | `spire.well.toCrypt.r4`                           | `cathedral.crypt.wheel.m6`                     | near | (kept)                                                                                                                                                 |
| today: Draught            | `spire.well.draught.b`                            | `cathedral.choir.toSpire.a`                    | near | (kept)                                                                                                                                                 |
| **the Undercroft bridge** | MY-2 (spell damage with life)                     | `cathedral.crypt.toSpire.b`                    | near | Spell damage with life for the Zealot's life casters; Glass Wall, Homily and Tomb Dust for the Mystic's.                                               |
| **the far loop**          | the north-west rim road's last node (−1380,−4150) | the Zealot north walk's east end (−1800,−4050) | dear | The casters' far loop: MY-4, MY-7, Cinder and Steady Stream with ZE-3, Tomb Dust, ZE-9 and ZE-11. The ledger's "north rim road to the Undercroft rim". |
| ring                      | CE-4 on the north-west diagonal                   |                                                | ring | The casters' mana cost (§3).                                                                                                                           |

**Conflicts resolved:**

- **ZE-3 and the two rim roads met in one spot.** The Zealot put ZE-3 at (−1560,−4090) as the landing of M1 (to
  Cinder) and M2 (to "the west end of the Mystic's north rim road", about (−1250,−4420)). The Mystic's north-west rim
  road ran its last leg (−1380,−4150) → (−1470,−3870) → Shattering Rite, past the same spot. Joined: **one road**,
  Kindled Steel → the Zealot's north walk → (−1800,−4050) → the Mystic's (−1380,−4150) → (−1120,−4390) → MY-4. The
  Mystic drops its last road node and the Shattering Rite landing (−1 node). **ZE-3 stays the Zealot's**, moved to
  (−1650,−3800) as a bridge from Shattering Rite to the north walk's end, so only the far-loop link crosses (two
  crossings on one node would count as one place). Cinder links the Mystic's road node as the Mystic drew it, so ZE-3
  reaches Cinder in 5 steps and Steady Stream in 9 (the ledger asks at least 8).
- **The ledger's "Lantern to Undercroft through ZE-3"** is that far loop. **"The west road to the Choir"** is MY-2's
  bridge, which lands on the Undercroft's crossing road rather than the Choir (the Mystic found the room there held by
  the Mind Bulwark and Living Ward spurs).
- **The Mystic's wedge note** (MY-2 could move if ZE-3 wanted the wedge): moot, ZE-3 is on the rim.

**Declined:** MY-5's side to the Bell Tower (both briefs: the Bell Tower is the Zealot's far west); Shattering Rite's tip
to the Lantern (moot, Shattering Rite is now ZE-3's bridge end); anything through the Cloister–Undercroft stretch,
where two keystone spurs (Mind Bulwark, Living Ward) would become through-routes (§9.1). **Six is short on purpose**:
the inner border is the busiest in the network (four links within about 1,500 units), and the Zealot's casters walking
east into the Mystic is the diagnosis both briefs worked against (the Zealot's §0 fact 1).

### 2.3 Zealot–Vanguard: 5 → 8

| crossing                       | Zealot end                      | Vanguard end                                                              | kind              | the combination                                                                                                                                        |
| ------------------------------ | ------------------------------- | ------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| today: the Nave road           | `cathedral.nave.toWall.a`       | `wall.resists.j.a`                                                        | near              | (kept)                                                                                                                                                 |
| today: the Banner              | `cathedral.home.hubs.w`         | Warlord's Banner                                                          | near              | (kept)                                                                                                                                                 |
| today: Scar Tissue             | `cathedral.rods.toWall.a`       | Scar Tissue                                                               | near              | (kept)                                                                                                                                                 |
| today: Stagger                 | `cathedral.ambulatory.toWall.d` | Stagger                                                                   | near              | (kept)                                                                                                                                                 |
| today: Battle Hymn             | `cathedral.ambulatory.hymn.b`   | `wall.maces.toHymn.r4`                                                    | near              | (kept)                                                                                                                                                 |
| **the armoured sceptre** (new) | ZE-5 (armour with sceptre)      | `wall.resists.j.a` (the Battlements junction)                             | near              | The sceptre fighter and the mace player share the border's armour; ZE-5 for the Vanguard, Elemental Ward (now armour with resistances) for the Zealot. |
| **maces and sceptres** (new)   | `cathedral.rods.toWall.a`       | Hallowed Hammer, moved to (−2540,−20), a pocket from the Rampart junction | near              | The sceptre fighter reaches Hallowed Hammer's elemental attacks; the mace player reaches the Vestry road and Gilded Rod.                               |
| **two-handed fire** (new)      | ZE-8 (life with aura effect)    | Grim Oath, the head of the Vanguard's west rim road                       | near (at the rim) | VA-6 (fire attacks with stun) with Censer's burning, Searing Avatar and ZE-6: the ledger's "Ambulatory rim to the Barbican".                           |

**Conflicts resolved:**

- **Hallowed Hammer and ZE-5 three steps apart.** The Vanguard put Hammer on `rods.toWall.a`, and so did the Zealot's
  ZE-5 bridge. Measured, ZE-5 → Hammer was 3 steps (the ledger's VA-m2 and the Zealot both ask at least 5). **ZE-5's
  west end moves to `wall.resists.j.a`**, the landing the Vanguard offered for it: ZE-5 → Hammer is now 6, ZE-5 →
  Gilded Rod 10, and ZE-5 becomes a crossing of its own (+1 link). ZE-5 stays 8 steps from the Zealot start and is 11
  from the Vanguard's.
- **The Zealot's V2** (ZE-7 → the Rampart junction) **is dropped**. It would have been a second bridge between the same
  two nodes as Hallowed Hammer, 230 units away, and the Vanguard's objection holds: "the war staff and the shield wall"
  is not one build (a staff is two-handed; ZE-7's spell block needs no shield, VA-2's block does). ZE-7 stays a pocket
  between the Vestry road's first two nodes.
- **The Zealot's V1** (Alms → VA-1) **is dropped**: VA-1 is not built (§1.2; question C).
- **Two bridges between Grim Oath and Censer.** The Zealot's ZE-8 bridges Censer to Grim Oath; the Vanguard drew a road
  node from Grim Oath to Censer 240 units away. **ZE-8 is the bridge**; the Vanguard's node goes (−1). The result is
  one west rim road from the Zealot's outer walk (Thunder Peal, Censer) through ZE-8 and Grim Oath to VA-6, Thick Skin
  and the Rooted Stance junction.
- **Hallowed Hammer ≥ 5 from ZE-5** (the Zealot's condition, offered as V1's alternative): met at 6 after the re-landing.

**Declined:** Vestry to Barbican and Nave to Quarry (both briefs: not adjacent; the Rampart and the Gate lie between);
the Battlements' east (space C), which both briefs left empty because anything there is 4 to 6 steps from two starts.
**Eight is enough here**: the border is short (the ring to the rim between two keystone spurs, Unerring Discipline and
Idle Hands), and its middle is where two strength-and-intelligence starts would get cheap armour.

### 2.4 Vanguard–Reaver: 6 → 9

| crossing                        | Vanguard end                                      | Reaver end                     | kind | the combination                                                                                                                                |
| ------------------------------- | ------------------------------------------------- | ------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| today: the slams junction       | `wall.slams.j2.a`                                 | `yard.blades.j1.a`             | near | (kept)                                                                                                                                         |
| today: the Pits' west           | `wall.grit.east.e8`                               | `yard.blood.toWall.a`          | near | (kept)                                                                                                                                         |
| today: Bracing                  | `wall.slams.bracing.b`                            | `yard.home.fieldDressing.b`    | near | (kept)                                                                                                                                         |
| today: Guarded                  | `wall.slams.toYard.a`                             | `yard.blades.guarded.b`        | near | (kept)                                                                                                                                         |
| today: Headsman                 | `wall.grit.headsman.b`                            | `yard.blades.toHeadsman.r3`    | near | (kept)                                                                                                                                         |
| today: Barrow Ward              | Barrow Ward                                       | `yard.fosse.road.f7`           | near | (kept)                                                                                                                                         |
| **regeneration or leech** (new) | Second Wind (moved to the Barrows), one road node | Thirsting Blade                | near | One of the two is enough for most builds: a fork. Thirsting Blade stops being a 19-step dead end.                                              |
| **axes by the Fosse** (new)     | Cleaver (moved to the Barrows' east road)         | `yard.fosse.road.f7`           | near | The Reaver's axe and bleed build reaches Cleaver by the rim; the Vanguard reaches the Fosse's lightning and curses. Cleaver → Hewing 10 steps. |
| **sword and board** (new)       | `wall.grit.east.e6`                               | RE-2 (sword with shield block) | near | The Wall's shield builds reach a sword cluster; the Reaver's reach Stone Ward and the Barrows.                                                 |
| ring                            | CE-3 on the south-west diagonal                   |                                | ring | Chaos resistance and ailment avoidance, which neither strength home sells (§3).                                                                |

**Conflicts resolved:**

- **Thirsting Blade had two new crossings** (the Vanguard's from Second Wind, the Reaver's to `wall.slams.j2.a`).
  **The Vanguard's is kept.** `j2.a` already carries the slams–Yard link 300 units away, so the Reaver's adds no new
  place; and with both, the route from the slams to the Barrows would pass through Thirsting Blade and Second Wind,
  taking both sides of the fork the Vanguard built.
- **The Reaver's two-hander link** (the west road's leg to `wall.grit.east.e7`) **is dropped**. `e7` is one node from
  `e8`, which already joins the Yard at `toWall.a`, one node from the leg, so the link adds no new place; and it would
  shorten RE-7 → Greatblade, the two-hander twins the Vanguard objected to putting together. RE-7's wheel → Greatblade
  stays 8 steps, Headsman 9.
- **Cleaver's landing** (the Reaver's condition: at least 6 from Hewing): the Vanguard put Cleaver on the Fosse at
  `f7`, 10 steps from Hewing by the joined graph (the Vanguard counted 15).
- **RE-4's landing** offered by the Vanguard (`wall.slams.toYard.a`) is not taken: the Reaver placed RE-4 inside the
  Practice Ground. Today's Guarded link already lands there.

**Declined:** Quarry to Muster (the Vanguard: not adjacent; mace and board already meet at Bracing–Field Dressing);
Barrows to the Pits as the ledger named it (above). **Nine** is the closest any border comes to the reference, and the
south-west corner (`e6` to `f7`) now holds four crossings within 600 units; more there would be a mesh (§13.1).

### 2.5 Reaver–Strider: 6 → 7 (3 places → 6)

| crossing                            | Reaver end                      | Strider end                                  | kind | the combination                                                                                               |
| ----------------------------------- | ------------------------------- | -------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| today: the east gate, two links     | `yard.dual.j2.a`                | `bow.steel.road.jt1`, `bow.steel.added.n409` | near | (kept: the user's near crossings into Wayfarer and Weathered)                                                 |
| today: Hot Blood                    | `yard.dual.hotBlood.b`          | `bow.steel.toBlood.b`                        | near | (kept)                                                                                                        |
| today: the Pits' east               | `yard.blood.j2.a`               | `bow.steel.toBlood.e`                        | near | (kept)                                                                                                        |
| **evasion and accuracy** (re-aimed) | RE-6 (evasion with accuracy)    | `bow.steel.hub.t`                            | near | Evasion and dodge either way; the ledger's "RE-6 to the Meadow". It replaces the east gate's link to `hub.t`. |
| **the fast sword** (new)            | RE-1 (sword with sword speed)   | `bow.steel.toBlood.c`                        | near | RE-1 with the Ford's speed (Thirsty Quiver, Hatchet Work, Sentry Post).                                       |
| **lightning strikes** (new)         | Stormstruck                     | the outer road's south end J8 (1180,3600)    | dear | ST-4 (shock) with Stormstruck (attack speed), 6 steps apart; the east of the map's outer ring closes.         |
| cut                                 | `yard.dual.j2.a`                | `bow.home.added.n414`, `bow.steel.hub.t`     |      | Both briefs: four links on one node were one place.                                                           |
| ring                                | CE-2 on the south-east diagonal |                                              | ring | Life on hit and on kill for both attackers (§3).                                                              |

**Conflicts resolved:**

- **`bow.steel.hub.t`.** The Strider landed RE-1 there; the Reaver placed RE-1 in the Lists' south (790,2580), 800
  units away, and landed RE-6 on `hub.t`. **The Reaver's placement holds**: RE-6 → `hub.t`, RE-1 →
  `bow.steel.toBlood.c`. (`toBlood.c` takes its fifth link; G2 may move RE-1's end to `toBlood.d` if it reads crowded.)
- **Sidestep's Ford crossing** (`yard.dual.sidestep.n` → `bow.steel.toBlood.a`, proposed by both) **is dropped**.
  `toBlood.a` is one node from `hub.t`, so it doubled RE-6's crossing for the same combination, and it put RE-6 four
  steps from Sidestep (the ledger asks 5; now 5). The Reaver offered exactly this choice ("if the joining agent
  prefers Sidestep, … the next row goes").
- **Festering to J8** (the Reaver's "poison bow and poison sword") **is dropped**: it brought ST-10 (poison with bow
  damage) to about 5 steps from Festering (poison with bleed), a poison corner; without it they are 11 apart.
  Festering stops being a dead end anyway, through RE-3.

**Declined:** ST-8's landing (ST-8 not built); the Strider's "RE-1 lands here". **Seven links at six places** is a real
gain on today's three places, and the south-east corner (§4.6) is the busiest spot on the map.

### 2.6 Strider–Shade: 4 → 8

| crossing                             | Strider end                               | Shade end                                         | kind | the combination                                                                                                    |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------ |
| today: Soft Step                     | `bow.bows.toKnife.a`                      | `knife.home.softStep.b`                           | near | (kept)                                                                                                             |
| today: Hedge Magic                   | `bow.bows.hedgeMagic.a`                   | `knife.home.toHedge.r1`                           | near | (kept)                                                                                                             |
| today: the Snares                    | `bow.flight.toKnife.a`                    | `knife.snares.toBow.a`                            | near | (kept; Tripwire to Trapper, the ledger's "Hedgerows to Docks")                                                     |
| today: Ricochet                      | Ricochet                                  | `knife.snares.toRicochet.r4`                      | near | (kept)                                                                                                             |
| **fast claws** (new)                 | `bow.bows.toKnife.a`                      | SH-6's rung node (1990,−370)                      | near | Claws with the Strider's dexterity next door (§5.4).                                                               |
| **crit poison** (new)                | `bow.flight.venom.a`                      | Mercy Stroke                                      | near | Mercy Stroke's crit multiplier with Venom Fletching: the crit poison bow, and a Shade with a bow.                  |
| **life for the Shade's south** (new) | ST-9 (life with resistances)              | `knife.snares.toRicochet.r4`                      | near | Life for the Shade's dodgers; the Shade onto the outer road.                                                       |
| **the east rim highway** (new)       | J1 (3800,150), the outer road's north end | the Shade's east rim road's last node (4100,−150) | dear | One rim road from the Rooftops to the Fosse: bows to Quiet Shot, SH-12 and SH-7; the Shade to ST-1, ST-6 and ST-9. |
| ring                                 | Quick March (today's east arch)           |                                                   | ring | (unchanged)                                                                                                        |

**Conflicts resolved:**

- **The north dear crossing.** The Strider ran J1 north through two Shade nodes to `knife.roofs.walk.r8`; the Shade
  declined it (it runs over SH-10's spot) and ended its own six-node east rim road at J1. **One road, the Shade's**:
  the Strider's spoke is gone, J1 belongs to the Strider (its road's first junction), every node of the Shade's rim
  road to the Shade. The Strider's optional Veiled Herald–J1 link is not added: SH-10 and SH-12 already make Veiled
  Herald a bridge on the same stretch, and a third link would be padding.
- **SH-15.** The Strider declined landing SH-15 on `bow.bows.road.jb3`; the Shade moved SH-15 north into the Stair
  anyway (life becomes a direction for the Shade's attackers). **The Shade's placement holds**; the Strider's
  "SH-15 lands here" is gone. ST-9's crossing brings life to that border instead (SH-15 → ST-9: 16 steps apart).
- **SH-6** lands on `bow.bows.toKnife.a` through the Shade's rung node, as the Strider offered.

**Declined:** the ledger's ST-6 through the Hedgerows (the Strider moved ST-6 to the far north-east so the Hedgerows
are not one trap destination; the Tripwire–Trapper crossing already serves the combination). **Eight** here.

### 2.7 The ring

Today the ring carries two links into each home and four arches (Shelter at the Mystic's axis, Quick March between the
Shade and the Strider, Well Rounded at the Reaver's axis, Provisions between the Vanguard and the Zealot). The four new
arches (§3) sit on the four diagonals that have none, so every neighbouring pair of homes now shares an arch (Quick
March and Provisions already sat between two homes; Shelter and Well Rounded stay on the Mystic's and the Reaver's
axes). No ring link changes.

---

## 3. The centre

The ledger's four arches (CE-1 to CE-4), checked against the map and the briefs. Each is laid out exactly like today's
four: the notable 612 units out on the diagonal, touching the even ring node between two homes' ring links; two smalls
650 out, 5.4° either side, touching the odd ring nodes. Under the user's small-node answer each arch is a notable (3
units) with its two smalls (one unit each, the arch's lead). They are 5 or 6 steps from each of their two starts.

| arch | at          | ring nodes    | ledger                                      | the map near it                                                                                                                                                                                       | joined                                                                    |
| ---- | ----------- | ------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| CE-1 | (306,−530)  | r1, r2, r3    | avoid elemental ailments + chaos resistance | Warded Mind, re-lined by the Mystic to lead with chaos resistance, is 9 steps away in the same direction; neither home sells stun protection within 10 steps (Shroud 12, MY-8 13).                    | **avoid stun + reduced stun duration on you** (the ledger's CE-3 lines)   |
| CE-2 | (306,530)   | r9, r10, r11  | life regeneration + life on kill            | Long Breath (life and regeneration) is 3 steps from the Strider start; Stout Heart (life and regeneration) at the Reaver home. Regeneration is sold at both homes.                                    | **life on hit + life on kill**                                            |
| CE-3 | (−306,530)  | r13, r14, r15 | avoid stun + reduced stun duration on you   | Unshakable (stun threshold, reduced stun duration on you) is 4 steps from the Vanguard start and 6 from this arch; Scarred Hide becomes life with stun threshold at 9 from the Reaver.                | **chaos resistance + avoid elemental ailments** (the ledger's CE-1 theme) |
| CE-4 | (−306,−530) | r21, r22, r23 | mana + reduced mana cost                    | Hymn (maximum mana, regeneration) is 4 steps from the Zealot start and 6 from this arch; Deep Well (mana, regeneration) 9; Glass Skin becomes ES with maximum mana. Frugal is cost with regeneration. | **reduced mana cost + mana on kill**                                      |

So CE-1 and CE-3 trade themes, and CE-2 and CE-4 change partner: each arch now sells what its two homes do not already
sell within a few steps, which keeps the vocabulary wide (§10.1) and avoids near-copies two steps from a start. All
lines are in `lines.ts` (`stunAvoid`, `stunRecovery`, `lifeOnHit`, `lifeOnKill`, `resOne` for chaos, `avoidAilments`,
`costReduction`, `manaOnKill`). None is a main stat of any of the 27 archetypes except mana sustain for the channeller,
which CE-4 touches lightly (cost, not maximum mana). The ring's inside otherwise stays empty (ledger §0).

---

## 4. Whole-map checks

### 4.1 Geometry

On the joined sketch (moved notables carrying their own smalls), **no new or moved link crosses another**, and no new
notable or road node is drawn over an existing node. What the check lists is inside regions and already flagged by
their briefs, for G2's layout pass:

- The Reaver's west road's first node (−720,1800) runs 20 to 30 units from Keen Edge's diamond (the Reaver: shift Keen
  Edge about 80 east or the node about 60 west).
- The Reaver's link from `toWall.a` to the west road's (−900,2890) node passes 24 units from Executioner's small, which
  the Reaver re-hangs.
- The Vanguard's Cleaver chain runs between Barrow Ward's and Greatblade's, 140 to 190 units apart (the Vanguard: fan
  the three spurs or move Barrow Ward's chain into space G).
- Junctions that reach five links: `rods.toWall.a` was five before ZE-5's re-landing (now four); `bow.steel.toBlood.c`
  with RE-1 (five); the Mystic's (−1380,−4150) has four. The far loop's west end (−1800,−4050) takes Tomb Dust and ZE-3
  at close angles; G3 lays ZE-3 a little east.

### 4.2 Twins across borders

Every new cluster was measured against the same-family notables on both sides of its borders (over 100 pairs). All are
at least 5 steps apart, most 8 or more. The close ones, and the pairings that now appear in two regions:

| pairing                                    | where                                                                 | steps apart | verdict                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- | ----------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **energy shield with mana**                | Glass Skin (Mystic, re-lined), SH-13 (Shade), Hymn (Zealot, mana-led) |       8, 19 | Generic (§5.3); three starts. A Mystic caster reaches Glass Skin at 7 and SH-13 at 18: the far one is what more points buy. Kept.        |
| **energy shield with avoid stun**          | MY-8 (Mystic), Shroud (Shade, re-lined)                               |          19 | Both ledger rows; different starts; Shroud adds recharge. Kept.                                                                          |
| spell damage with cast speed               | Arcane Focus (Mystic), SH-11 (Shade); MY-10 is dagger spells          |  16; 10, 12 | Kept (the ledger's own call: different starts).                                                                                          |
| life with evasion                          | Hard Target (Strider), SH-15 (Shade)                                  |          18 | Kept.                                                                                                                                    |
| life near life at the Strider–Shade border | ST-9 (life, resistances), SH-10 (life, dodge)                         |           5 | Different partners; life is generic. Kept, watched in G3.                                                                                |
| sword next to dual wield                   | RE-1 (sword speed), Crossed Blades (dual crit)                        |           4 | The Reaver flagged it: different partners, the dual-axe build does not want RE-1. Not a twin (different specializations); watched in G3. |
| sceptre                                    | ZE-5, Hallowed Hammer, Gilded Rod, ZE-6                               |   6, 10, 13 | Fixed by ZE-5's re-landing (was 3).                                                                                                      |
| channelling                                | ZE-3, Steady Stream                                                   |           9 | Meets the ledger's 8.                                                                                                                    |
| lightning attacks                          | ST-4, Stormstruck                                                     |           6 | Meets the Reaver's 6.                                                                                                                    |
| poison                                     | ST-10, Festering; SH-7, SH-4                                          |  11; 18, 20 | Kept apart by dropping Festering–J8.                                                                                                     |
| two-handed                                 | RE-7's wheel, Greatblade, Headsman                                    |        8, 9 | Kept apart by dropping the leg–`e7` link.                                                                                                |
| evasion and dodge                          | RE-6, Weaving, Sidestep                                               |        5, 5 | Fixed by dropping Sidestep's Ford link (was 4).                                                                                          |
| armour near the Zealot–Vanguard border     | ZE-5 (armour-led), Elemental Ward (resistances with an armour line)   |           4 | Different leads; Elemental Ward's armour is 1.3 units. The north armour the ledger wanted from VA-1, now from both sides. Kept, watched. |
| cold with a shield, cold attacks           | ZE-4, Rimed Steel                                                     |           5 | Different partners (shield block, attacks). Kept.                                                                                        |
| life next to armour, far west              | ZE-8 (life, auras), Grim Oath (curses, armour)                        |           2 | Life with armour across a border, but 20 or more steps from every start: the ledger's "rare and far out". Kept.                          |
| regeneration or leech                      | Second Wind, Thirsting Blade                                          |           1 | A fork by design (one is enough), not twins.                                                                                             |

**No new one-stop shop at a border.** The places where several of one build's wants meet were checked by hand: the
Stair (MY-10, SH-1, Mist Walk, Spellslip: dagger spell, ES, spell dodge and the keystone, 5 to 9 apart and each a
different kind); the south-west corner (Cleaver, RE-7's wheel, Greatblade, Headsman: a two-handed axe build finds Cleaver
and the wheel within about 5 steps, at 15 to 22 from the Reaver start, a far destination); the Fosse corner (§4.6).

### 4.3 The convergence rule

Spell damage with energy shield, life with armour, and sword with either do not share a cluster near a home or along a
home's main road:

- No new cluster pairs them. First Light (the Mystic's signature) and Oathbound (the Vanguard's) stay the named
  exceptions at step 2.
- Fixed by the briefs: the Mystic's east wheel (Warded Mind loses ES), Scarred Hide and Guarded (lose armour or life),
  the Bulwark (life and armour become two branches), Warlord's Banner (loses armour).
- **Near-miss left standing:** ZE-1 (spell damage, reservation) is 3 steps from Consecrated Plate (armour with 10% ES)
  at 13 to 15 steps from the Zealot start. The ES is a minor line; the Zealot named it and left it. G3 may drop
  Consecrated Plate's ES if the walks show the caster taking both.
- Far hybrids kept as destinations: Broad Back (life, armour; the Vanguard's far west), ZE-8 next to Grim Oath (§4.2),
  ZE-10 (ES with life, 22 from the Zealot start).

### 4.4 Varied defences (§4.5), unchanged by the join

- **Mystic:** ES, life (Warm Blood, Quiet Pulse, MY-9, MY-2), resistances (Prism Ward, MY-4, Warded Mind's chaos),
  spell block, dodge (Mist Walk), stun (MY-8).
- **Zealot:** ES, life, armour (ZE-5, Consecrated Plate), block, spell block (ZE-7, ZE-11), resistances.
- **Shade:** evasion, ES, life (three new directions), dodge, resistances, stun avoidance.
- **Strider:** evasion, life (ST-9), resistances, block, stun avoidance, armour through Plated Hide.
- **Vanguard:** armour in four directions, life, stun, block, spell block, resistances, regeneration and leech.
- **Reaver:** life, armour (RE-4, Guarded), evasion (RE-6), block, dodge, leech, stun threshold.

### 4.5 Keystones (§9)

All 27 stay dead-end spurs. **Only one ends farther from a start than today**, by two steps; the Reaver's re-lay brings several in
(Blood Rite 24 → 22, Wound Dance 19 → 16, Shieldwall 15 → 12, Strongarm 12 → 10). The one that moves out is Plated
Hide, 9 → 11 from the Strider start (its shortest path today ran through the east gate's link to `hub.t`, which is
re-aimed); it stays well inside the working range. Still beyond §16's working 8 to 18: Fever Pitch 23, Blood Rite 22, Sigil Warden 22, Prismatic
Balance 20, Pain Conduit 20, Searing Avatar 20, Volatile Servants 20, as today; no brief moved a keystone to meet a
working number.

### 4.6 The south-east corner (63° to 72°)

The Strider's outer road ends at J8 (1180,3600), with J7 (1680,3390) and the node between them; ST-10 bridges Pitch
Arrows to J7; ST-4 hangs off the node between J6 and J7; Stormstruck crosses to J8; the Reaver's RE-3 bridges the
Fosse's second node to Festering's chain; Crimson Pact's spur is shortened toward (925,3262). Drawn together
(`fosse-corner.png`), **nothing crosses and nothing is drawn over**. Festering's link to J8 was dropped (§2.5). The
Vanguard's Cleaver bridge is at the other end of the Fosse (`f7`, the south-west corner, `south-west.png`).

### 4.7 Small nodes without a notable

None added, apart from the Reaver's Shieldwall run (named in its brief: unhooking the keystone spur under §9.1 leaves it
as a block bridge) and road nodes. The Strider's four mana smalls round Round Shield are re-lined to the notables they
sit beside (shield block, attributes, movement into Fleet Foot).

---

## 5. Do the user's two examples now face real choices?

### The classic caster (Mystic start: spell damage, energy shield, cold, cast speed)

Measured on the joined graph:

- **Home, taken by every plan (about 20 points):** First Light 2, Warm Blood 6, Glass Skin 7 (ES with mana), Arcane
  Focus 8. Warded Mind (7) is now chaos resistance and mana, so the near ES is west only.
- **West, the shield side:** MY-8 (ES, avoid stun) 13, Quickening (ES recharge) 15, Hoarfrost (cold, ES) 17, MY-2
  (spell damage, life) 18.
- **North, up the spine:** Thunderhead (cast speed) 16, Siphon (ES on hit) 17, MY-11 (spell damage, penetration) 19,
  Shatter 20, then MY-4 (ES, resistances) and MY-3 (spell damage, mana regeneration) at 23, joined across the top.
- **East, the offence side:** MY-9 (life, mana) 11, MY-1 (spell damage, crit multiplier) 16, Flashpoint 18.
- **The Stair (the Shade):** Quiet Knife 13, SH-13 (ES, mana) 18, SH-1 (ES, spell dodge) 19, SH-11 24.
- **The Zealot side:** Homily, Glass Wall and ZE-1 at 20.

**One change from the Mystic brief's walk:** its plan (b), "ES-wide through the Undercroft (ZE-10, ZE-11)", no longer
exists, because the Zealot moved ZE-10 and ZE-11 to its outer and north walks, 29 steps from the Mystic start. The
caster still has three plans it could defend at 120 points without them:

- **(a) Shield-first:** home, west and the spine's ES (MY-8, Quickening, Hoarfrost, Siphon, MY-4), with spell damage
  from MY-11 and Thunderhead. It gives up MY-1, Flashpoint and MY-3.
- **(b) Offence-first:** home, east and the spine's spell damage (MY-1, Flashpoint, MY-11, Shatter, MY-3). ES from the
  home and Glass Skin only.
- **(c) The Stair:** home, the Shade's ES (SH-13, SH-1) with Quiet Knife and MY-10's crossing, giving up the top of the
  map.

What 40 more points would buy in each is the other plans' notables, 3.5 to 5 units each: the gave-up list target 3
asks for. Today the same 40 points buy 16% spell damage.

### The strength sword build (Reaver start: life, armour, sword damage, attack speed)

- **West, the armour side:** Keen Edge (sword, accuracy) 7, Guarded (armour, evasion) 9, Light Blades 9, RE-4 (armour,
  regeneration) 12, RE-2 (sword, shield block) 12; past the border Elemental Ward (resistances, armour) 14, Mortar and
  Stone 16, Stone Heart (life) 16, VA-3 17, VA-2 20, Broad Back 21.
- **East, the speed side:** RE-5 (attack speed, warcry) 5, Hawk's Eye 9, RE-6 (evasion, accuracy) 11, RE-1 (sword,
  sword speed) 12, Quick Hands 13, True Aim and Fleet Blade 15, Round Shield 15.
- **South, the blood side:** Scarred Hide (life, stun threshold) 9, Fencer's Eye 12, Red Harvest 14, Thirsting Blade 14,
  Second Wind 15, RE-3 (sword, leech) 16.

Armour, which today it takes all of by 60 points in one walk to the Rampart, now starts at 9 steps as a partner line and
lies mostly 12 to 21 steps west, past the Reaver's own RE-4. The sword is six clusters in three directions. The
joined steps agree with the Reaver brief's hand count (about 130 points to take every wanted notable in all three
directions, roads included): at 120 points the build chooses two of west, east and south (the Reaver brief's plans (a)
to (c)), and what 40 more points buy is the third direction's sword cluster and either the far armour or the speed.
The allocator checks this in G2 and G3.

**The one weakness:** RE-5 puts attack speed, one of this build's main wants, 5 steps from the start. Question B.

---

## 6. Questions for the user (stop 2)

The briefs asked 22 questions between them. The joining resolved the ones that were between briefs (listed at the end);
the rest are grouped here, with the recommendation of the brief that raised each.

**A. Size and borders**

1. **Size.** All six briefs together come to about **1,373 nodes**, about 110 under the 1,480 you set as the start.
   Mostly because the ledger's small sections were folded into clusters as you asked, and three clusters were struck
   for cause. _Recommendation:_ build the roads and the first round of clusters at this size, and let G3's measures
   choose where a second round adds, from the room each brief kept: armour far from the strength starts (the Vanguard
   is about 9 units under the ledger), evasion (the thinnest defence), a crit claw cluster, a third axe cluster. Or tell
   us 1,480 is a floor and we add those now.
2. **Links between regions.** Each border goes from 4–6 links to 6–9; the reference has 10 to 13. Each candidate we
   did not add is named in §2 with its reason (mostly: it would make something cheap for two starts, or it would land
   one step from a link that already exists). _Recommendation:_ accept this for now, and in G2, when the borders are
   laid together, look for one or two more per border in the middle distance (10 to 16 steps from both starts), each
   for a named combination.

**B. New clusters near a start.** Four new clusters sit close to a start: **RE-5** (attack speed with warcries, 5
steps from the Reaver start; attack speed is a main want of your sword example), **VA-8** (shield attacks with stun, 6
from the Vanguard's), **SH-14** (evasion with energy shield, 7 from the Shade's), **MY-9** (life with mana, 11 from the
Mystic's). _Recommendation:_ keep all four (each region needs its own voice for what most builds want, and none names a
weapon within three steps), and watch RE-5: if the sword build's attack speed stops climbing in G3, flip RE-5 back to
warcry-led.

**C. Changes to existing notables.** All as the briefs propose? _Recommendation:_ yes.

- Mystic: Warded Mind loses its energy shield (chaos resistance and mana); Glass Skin trades recharge for mana; Wand
  Volley trades its crit for more speed.
- Zealot: Iron Faith becomes a shield-only notable.
- Vanguard: the Bulwark wheel is rearranged (Iron Lungs on the way through, Mortar and Stone's armour as the detour,
  Stone Heart moved to the tower road, Thick Skin to the west rim beside Rooted Stance); Elemental Ward trades its life
  for armour; Warlord's Banner loses its armour; no new armour cluster on the Zealot border (VA-1).
- Reaver: Scarred Hide becomes life with stun threshold (not life on block); Guarded drops its life (armour and evasion).
- Strider, your editor nodes: Round Shield becomes shield-only, its four mana smalls follow; Weathered rises to 3 units.

**D. The map's shape**

1. **Rim roads.** The growth adds roads along the rim: two short Mystic roads joined to a new Zealot road round the
   Undercroft; the Zealot's outer road round the Bell Tower; the Vanguard's west rim road, joined to it through ZE-8;
   and one road down the whole east from the Shade's Rooftops to the Reaver's Fosse. All stay inside today's circle; the
   map does not get bigger. _Recommendation:_ yes.
2. **The Reaver's grid of roads** (the Reaver's own question): its middle is re-laid as three north–south roads and two
   cross roads. _Recommendation:_ yes, judged from `G1/reaver/sketch.png` and `whole.png`.

**E. Smaller placements the briefs decided, unless you object:** ZE-8 at the far south-west; RE-9 as dual wield with
life (the other side of the two-hander's wheel); Cleaver far from both starts (28 Vanguard, 22 Reaver) by the Fosse; no
fourth claw cluster (SH-5) and no dual wield with evasion at the Ford (ST-8); Close Quarters' spur stays a road; the
Strider's keystones stay where they are; Wanderer keeps its life; the Strider's north-east band stays open for later.

**F. The centre.** The four new arches sell stun protection, life on hit and on kill, chaos resistance with ailment
avoidance, and mana cost with mana on kill: each what its two homes do not already sell nearby (§3; the ledger had
regeneration, stun and maximum mana, which the homes already have). _Recommendation:_ yes.

**Resolved in the join, not asked:** the Mystic's rim roads against the Zealot's and the Shade's landings; the two hexer
crossings; Hallowed Hammer and ZE-5; ZE-7's and Alms' crossings; the Grim Oath–Censer bridge; `hub.t`, RE-1 and
RE-6; Sidestep's Ford link; Festering at the Fosse corner; the Strider's north spoke and SH-15's landing; Thirsting
Blade's two crossings; the two-hander leg; SH-13 kept away from the Mystic home; the Shade's Mystic crossing left as it
is (the Shade's question 4: both briefs agree a shorter rung there is the wrong lever).

**Intent.** Nothing in the join felt like it was losing intent: every change above is a player's reason on the map,
none was made to hit a count. Three things to watch: the total sits under the start you gave (A1); several far rim
clusters (ZE-9, ZE-11, the Shade's far north-east) are only worth building if G3's allocator shows builds taking them,
otherwise they are filler at a distance and come inward; and RE-5 (B).

---

## 7. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Each main want of the two examples and of each region's builds gets supply in several
  directions with different partners (§5 here, the briefs' §1); tension was weighed against starts, defences,
  vocabulary and looks at every conflict (ZE-5, Sidestep, Festering, the two-hander leg, the centre), never alone.
- **§2 The reference.** Its measured facts used: twins at least 5 apart, 10 to 13 border links as the direction,
  keystones as dead-end spurs. Nothing copied; no names given; the reference game is not named.
- **§3 A network.** Every new cluster has two ways in except the far tips the briefs kept on purpose; the rim roads add
  loops at the edge; 45 border links, each named for a combination, of every kind (near, dear, ring); the shortfall
  is argued border by border (§2).
- **§4 Regions.** No build-named areas; every region keeps varied defences (§4.4); the centre holds generic sustain and
  utility only (§3).
- **§5 Specializations.** Twins measured across borders (§4.2), all at 5 or more; three fixed by the join (ZE-5,
  Sidestep, Festering). Weapons by their attributes (Cleaver on a strength-and-dexterity road; Hallowed Hammer on the
  strength-and-intelligence Vestry road; claws on the Strider border). Neighbours compete (§4.2, §4.3).
- **§6 Starts.** No start changed. New clusters near a start are named and asked (B); none within three steps names a
  weapon. The first notables stay 2 to 4 steps out.
- **§7 Roads and attributes.** 74 new road nodes, each stretch with something off it (the briefs' §3); more attributes
  per walk, for G5 to re-check against the gear.
- **§8 Clusters and smalls.** One stat per small; sections folded into clusters (the user's answer); notables to be
  priced at 3 to 5 units in G3; the only notable-less run is the Shieldwall bridge, named.
- **§9 Keystones.** All 27 kept as dead ends; only Plated Hide ends farther from a start (9 → 11), several come nearer (§4.5).
- **§10 Vocabulary.** Every line named is in `lines.ts`; one theme per cluster; the centre widened rather than repeating
  the homes' lines.
- **§11 Looks.** No crossing links and nothing drawn over in the joined sketch (§4.1); layout points listed for G2;
  regular shapes, tight clusters and labels are G2/G3's.
- **§12 Size.** About 1,373, an outcome, with the reserve named (A1). No bot simulation; the step counts are a static
  script.
- **§13 Tensions.** Said out loud where they were decided: connections against trade-offs (every dropped crossing),
  identity against spread (sceptre, two-handers), bridges against dead ends (Festering), a generic start against early
  direction (B).
- **§14 Rejected ideas.** No generation (the merge script copies the briefs' placements and applies named decisions);
  no build list as the basis (the examples only check); no filler (Veiled Herald's third link declined); no step-count
  reach (steps here are costs and twin distances); no new restrictive rule.
- **§15 How the work is done.** CONSTRAINTS read in full first; whole-map and close-up pictures before and after;
  questions in plain words; the region folders untouched apart from their corrected sketches and a "Joined:" note.
- **§16 Open.** Borders (4–6 → 6–9), size (about 1,373), keystone distances (one 2 steps longer, four shorter), attribute values (G5).
