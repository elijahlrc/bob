# The Yard's rebuild (Reaver, strength and dexterity, angle 90)

The fourth region of the attrition rework, on the approved skeleton (R-skeleton.md §5), after the Knife, the Spire and
the Bow (R-knife.md, R-spire.md, R-bow.md). Positions are (radius, degrees off the Yard's angle of 90); negative is the
Bow's side (east), positive the Wall's (west). Steps are counted from the Reaver's start along the roads.

## 1. Evaluation (the Yard as it stands)

Measured on today's tree (`region-map.ts reaver`, `walks.ts`, `offdef.ts reaver`; the reference sector by
`ref-sector.mjs 3`).

- **Size.** About 45 notables and 3 keystones (Shieldwall, Wound Dance, Crimson Pact). The reference's str/dex sector
  holds 57 notables and 3 keystones; the rebuilt Bow 57, the Knife 65, the Spire 64.
- **The start.** 11 notables within 8 steps behind the physical exit and 10 behind the speed exit, among them weapon and
  mechanic picks: Keen Edge (swords), Light Blades (one-handed), Buckler (shields), Drill Call (warcries), Twin Fangs
  (dual wielding), Footwork. The skeleton named the start lopsided (one exit held 18 of its near notables).
- **Offence, defence and utility:** notables 56/31/13% against the reference's 56/27/17%: defence a little heavy, utility
  light.
- **Archetypes and their homes.**
  - Swords: Keen Edge, Darting Steel, Bloodied Edge, Sword and Board (four). Axes: Hewing (one; the Wall has axes).
  - One-handed: Light Blades. Dual wielding: Twin Fangs, Paired Steel, Crossed Blades. Two-handed: Full Swing.
  - Shields and block: Buckler, Steel Rim, Shield Bash, Sword and Board, Shieldwall.
  - Bleed: Open Veins, Lasting Wounds, Finishing Cut, Hewing, Festering, Wound Dance.
  - Leech: Red Harvest, Thirsting Blade, Bloodied Edge, Paired Steel, Crimson Pact.
  - Evasion and armour: Weaving, Guarded, Mended Mail, Scarred Hide. Life: Stout Heart. Resistances: Four Winds.
  - Crit: Crossed Blades, Fencer's Eye, Clean Break. Fervour: Hot Blood. Speed: Quickened Steel, Killing Pace.
  - Mana: Fighting Breath. Flasks: Field Dressing. Auras: Standard Bearer.
  - **Strays:** bows (Iron Draw; the Bow's), spells (Spellsword), channelling (Ceaseless Blades), curses (Marked Prey),
    warcries (Drill Call; the Wall's Barrows carry warcries), lightning attacks (Stormstruck; the Bow's Live Wire sits
    across the border), poison with bleed (Festering; the Knife carries poison).
- **What the Bow already put at the shared border:** Wanderer (attributes, life), Thirsty Quiver (leech), Light Hand
  (one-handed), Fleet Blade (swords), Round Shield and Braced Guard (shields), Hardy Stock and Second Wind (life). The
  Yard's east border must not copy these.
- **What the reference sector has that the Yard lacks:** impale; fortify with a payoff; endurance-style charges with a
  payoff; a dual-wield rule beyond flat damage; and rule-bending notables (none today).

## 2. What the Yard is for

The melee duellist's region: one weapon in each hand or a weapon and a shield, speed and blood. Its identity is **the
duel up close**: blood that flows (bleed, leech), the parry (block), the measured strike (crit, impale). Side roads:

- **Dual wielding and evasion**, east, toward the Bow (unlike the Bow's one-handed and shield ground at the same border).
- **Shields, block and armour**, west, toward the Wall.
- **The two-handed swing or the paired blades**, a choice wheel on the axis.
- **Blood**: bleed east, leech west and on the axis, with Wound Dance and Crimson Pact.
- **Lightning blades** at the east rim beside the Bow's lightning arrows.

## 3. The frame

- **Start** at radius 1,450 (today 1,000), exits at (1,530, ±6), hubs +15 strength and +15 dexterity at (1,690, ±5),
  paths toward each seam, spokes through (2,050, ±11.7), the mid ring (2,900, ±13), the rim ring (4,300, ±13), cross
  roads to the home hub (2,050, 0).
- **East (Bow) border:** the Bow built it. The east path ends at `bow.home.seams.s`; the mid ring at `bow.steel.radS.m`;
  the rim ring at `bow.rim.ring.s0`; Yard side rooms hang from `bow.steel.radS.a/b`. The temporary links in `yard/dual.ts`
  and `yard/fosse.ts` are replaced.
- **West (Wall) border:** the Yard builds the seam (1,600, 30), the border road to the mid ring vertex (2,900, 30), the rim
  vertex (4,300, 30). The seam links toward the centre's ring at `centre.ring.road.r13`.

## 4. The start and the home

- **East side:** physical attack damage with life (`12% physical attack damage, 5% life`); **west side:** armour with life
  (`15% armour, 5% life`): the reference's str/dex start opens on physical attack damage with life, and the skeleton
  asked for the west side to defend. Path nodes: attack speed east, armour west.
- **Home (steps 5 to 7), a damage and a defence home each half:**
  - East: Killing Pace (attack speed on kill, life on kill; its movement goes) off the east path outward; Field Dressing
    (flasks) toward the centre; Fighting Breath (mana on hit, the one mana notable near home) off the east spoke junction.
  - West: Stout Heart (life, regeneration) off the west path outward; Guarded (armour and evasion) toward the centre;
    Clean Break (physical attack damage, crit multiplier) off the west spoke junction.
  - Quickened Steel at the home hub (attack speed, melee physical, both attributes).
- No weapon, element or mechanic within 8 steps: Keen Edge, Light Blades, Buckler, Drill Call, Twin Fangs and Footwork
  move out.

## 5. Where every cluster goes

| Cluster (notables) | Area | Road | Step | Why there |
| --- | --- | --- | --- | --- |
| Quickened Steel | Gate | the home hub | 5 | The generalist. |
| Killing Pace | Gate | east path, outward | 5 | East's damage near home. |
| Field Dressing | Gate | east path, toward the centre | 5 | The flask layer. |
| Fighting Breath | Gate | east spoke junction | 7 | Mana near home (one). |
| Stout Heart | Gate | west path, outward | 5 | West's defence. |
| Guarded | Gate | west path, toward the centre | 5 | Armour and evasion. |
| Clean Break | Gate | west spoke junction | 7 | West's damage. |
| Footwork | Lists | the Bow's border road | 8 | Accuracy and reach for the duellist. |
| Twin Fangs / Weaving wheel | Lists | the Bow's border road | 9-10 | Dual wielding or evasion. |
| Hot Blood | Lists | where the Bow's border road meets the mid ring | 10 | Fervour, beside the Bow's Hot Pursuit across. |
| Sidestep | Lists | east spoke, outer | 9 | Dodge with life on hit. |
| Crossed Blades | Lists | east spoke, outer | 9 | Dual-wield crit. |
| Darting Steel | Lists | east spoke, outer | 9 | Swords with speed, east. |
| Red Harvest | Pits | the mid ring's east stretch | 10 | Leech. |
| Wound Dance (K) | Pits | east spoke at the mid ring, a spur | 10 | The bleed keystone. |
| Open Veins | Pits | east spoke past the mid ring | 11 | Bleed. |
| Lasting Wounds | Pits | east spoke past the mid ring | 11 | Bleed duration. |
| Festering | Pits | the mid ring's east stretch | 11 | Poison with bleed, beside the Knife's poison. |
| Stormstruck | Fosse | the rim ring's east stretch | 13 | Lightning blades, beside the Bow's Live Wire. |
| Bloodied Edge | Fosse | out from the rim ring | 14 | Sword leech. |
| new: impale's first home | Lists | east spoke, outer or the mid ring | 10 | Impale (the reference's), a new archetype for the Yard. |
| new: impale's payoff | Fosse | out from the rim ring | 14 | Impale with a rule. |
| new: a dual-wield rule | Lists | east, the mid ring | 11 | Beyond flat damage (alternating hands or block while dual wielding). |
| Paired Steel / Full Swing wheel | Pits | the mid ring at the axis | 10 | Paired blades or the two-handed swing: a choice. |
| Four Winds | Muster | in from the mid ring at the axis | 9 | Resistances. |
| Fencer's Eye | Pits | out from the mid ring at the axis | 11 | Crit with swords and axes. |
| Elemental Edge | Fosse | the rim ring at the axis | 12 | Elemental attacks. |
| Standard Bearer | Muster | the rim ring at the axis | 13 | Auras and speed. |
| Ceaseless Blades | Fosse | out from the rim ring | 14 | Channelling attacks (a second home or cut, notables pass). |
| Marked Prey | Fosse | out from the rim ring | 14 | Curses on a duellist (a second home or cut, notables pass). |
| Buckler | Muster | the west border road | 8 | Shields, the Wall seam's theme. |
| Steel Rim / Scarred Hide wheel | Muster | the west border road | 9-10 | Shield defence or stun. |
| Shieldwall (K) | Muster | where the west border road meets the mid ring, a spur | 11 | The shield keystone. |
| Shield Bash | Muster | where the west border road meets the mid ring | 11 | Shield attacks. |
| Light Blades | Practice Ground | west spoke, outer | 8 | One-handed, west (the Bow's Light Hand is east). |
| Keen Edge | Practice Ground | west spoke, outer | 9 | Swords, west. |
| Hewing | Practice Ground | west spoke, outer | 9 | Axes with bleed, beside the Wall's axes. |
| Sword and Board | Practice Ground | the mid ring's west stretch | 10 | Swords with a shield. |
| Mended Mail | Practice Ground | the mid ring's west stretch | 10 | Armour and regeneration. |
| Crimson Pact (K) | Pits | west spoke at the mid ring, a spur | 10 | The leech keystone. |
| Finishing Cut | Pits | west spoke past the mid ring | 11 | Against the bleeding, culling. |
| Thirsting Blade | Pits | west spoke past the mid ring | 11 | Leech and speed (re-lined or merged in the notables pass). |
| Drill Call | Muster | the rim ring's west stretch | 13 | Warcries, beside the Wall's warcries. |
| new: fortify | Muster | west, the rim ring | 13 | Fortify gained and paid off (a rule; the Fortify buff exists). |
| new: armour rule | Practice Ground | west, the mid ring | 11 | Armour that does something (a rule). |
| Iron Draw, Spellsword | cut | | | Bows are the Bow's; spells are the Spire's and the Cathedral's. |

## 6. Size

About 57 notables (the reference's 57): 43 kept (two cut), about 6 new named above, about 8 second notables with hooks in
the notables pass. Node count about level.

## 7. Keystones

Wound Dance (east spoke, about 10), Crimson Pact (west spoke, about 10), Shieldwall (west border road, about 11). All at
8 or more. The Wall's Strongarm keystone matches a reference name (renamed in the Wall pass).

## 8. Sustain (attrition)

The Yard's voice: leech (Red Harvest, Bloodied Edge, Crimson Pact), life on kill (Killing Pace), life on hit (Sidestep),
life on block (Shield Bash), regeneration (Stout Heart, Mended Mail), and the flask layer near home (Field Dressing).

## 9. Open

- The start's sides (physical attack damage with life, armour with life) are a proposal.
- Ceaseless Blades and Marked Prey: second homes or cuts, decided in the notables pass.

## 10. Revision 1 of the plan (after the reviewer's plan round 1)

The direction, the frame, the home and the keystones stand; the table changes as below (rows above are superseded where
they differ).

- **The Bow border, swept against real positions** (the reviewer placed every Bow and Yard notable in one frame):
  - Darting Steel (sword speed, a copy of the Bow's Fleet Blade nearby) becomes **impale's first home**: the swordsman
    who skewers, on the east spoke past step 8.
  - Red Harvest (attack leech, two steps from the Bow's Thirsty Quiver) moves to the axis, in from the mid ring.
  - Stormstruck is cut (it sat beside the Bow's Live Wire on purpose). Elemental Edge stays only with a melee hook the
    Bow cannot have (decided in the notables pass; cut otherwise).
  - Sidestep loses its life on hit (the Bow's Thirsty Quiver has it); Weaving must not be another flat evasion notable
    (both re-hooked in the notables pass).
- **Hot Blood** is the third fervour home (one more maximum charge) for the dual-wielding Reaver: out from the mid
  ring's east stretch (`yard.dual.ring.a`), not from the Bow's crowded border junction.
- **Festering is cut** (a lone poison node; the Knife does not border the Yard).
- **One-stop shops split:**
  - Bleed: Wound Dance (the east spoke's mid ring spur, 10) and Open Veins (east spoke past the mid ring, 11) east;
    Lasting Wounds with Finishing Cut and Hewing (axes with bleed) on the west spoke past the mid ring (11-12).
  - Shields: Buckler (west border road, 9), the Steel Rim wheel (west border road, 10), Shieldwall (spur where it meets
    the mid ring, 11); Sword and Board moves to the west spoke past the mid ring (11) and Shield Bash to the rim ring at
    the axis (13).
- **Two-handed:** the Paired Steel / Full Swing wheel stays on the axis (the choice) and two-handed gets a second home
  with a different partner, a stun payoff (damage against stunned enemies, which the fight tracks), at the west rim.
- **Ceaseless Blades and Marked Prey are cut** (channelling attacks and curses with one home each; prefer a cut to
  padding).
- **The count:** today 42 notables. Cut: Iron Draw, Spellsword, Stormstruck, Festering, Ceaseless Blades, Marked Prey
  (36 left). New hooked homes, as ideas:
  1. impale's payoff at the rim (impale with a rule);
  2. fortify: gained in melee, paid off while fortified (west rim);
  3. an armour rule (west, the mid ring);
  4. the two-handed stun payoff (west rim);
  5. a riposte: damage after a block (`blockedRecently`), for shield and dual-wield blockers (west, the mid ring);
  6. mana on block (utility, by the shields);
  7. the dual-wield rule in plain words: a block while dual wielding gives Quickened (speed), so the off hand defends
     and quickens the next blows (east, the mid ring);
  8. damage while leeching, beside Red Harvest and Crimson Pact (the axis).
  With about 12 second notables, each with a hook, about 56 notables.
- **Utility rows** (aim 17-20%): Footwork (reach), Drill Call (warcries), Standard Bearer (auras), Fighting Breath
  (mana), Field Dressing (flasks), mana on block (new), and utility lines on the second notables (durations, cost,
  reservation, flask charges).
- **The west start node** becomes defences every Reaver uses: `10% global defences, 5% life` (armour, evasion and energy
  shield alike); the west path nodes stay armour. (The skeleton gave this side armour; logged for the owner.)
- **Steps:** Buckler and Light Blades hang so their notables sit at step 9.
- **Names:** the two keystones borrow a word each from reference keystones of the same mechanic: renamed at the build
  (Wound Dance → Hundred Cuts, Crimson Pact → Blood Bargain); Quickened Steel → Honed Steel (it gives no Quickened).
- Shield Bash's life on block repeats the Bow's Braced Guard: re-hooked in the notables pass.

## 11. Structure (built 2026-10-31, before the notables pass)

Written by `scripts/passives/rework/yard-gen.ts` into `src/data/passives/yard/`; the render is `R-yard-structure.png`.

- As §5 and §10, with these choices while laying out: the east path runs through Killing Pace to the Bow's seam (the
  Bow's path runs straight to it, so the two starts were 8 steps apart; now 10); Crossed Blades in from the mid ring's
  east stretch (step 10) and the dual-wield rule (Off-Hand Parry) off the east spoke; Thirsting Blade is folded into a new
  leech home (Red Thirst) at the east rim beside Bloodied Edge, far from Red Harvest on the axis; Shieldwall a spur in
  from the mid ring's west stretch; mana on block (Steady Guard) off the west border road's first node.
- The Shieldwall cluster's keystone spur was cut off from it in the old files: a link now joins it (`reach.ts`: no
  unreachable nodes). Temporary Wall links into removed Yard nodes were retargeted (`wall/grit.ts`, `wall/slams.ts`).
- Keystones renamed (they borrowed words from reference keystones of the same mechanic): Wound Dance → Hundred Cuts,
  Crimson Pact → Blood Bargain (in `src/data/tree/keystones.ts` as well, where the mechanics bind by name).
- Measured: 10 of the Yard's own notables within 8 steps; within 14, 18 behind the east exit and 21 behind the west. Six
  links between neighbouring clusters (three others dropped for crossing roads). No internal crossings.
