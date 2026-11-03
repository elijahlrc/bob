# The Wall's rebuild (Vanguard, strength, angle 150)

The fifth region of the attrition rework, on the approved skeleton (R-skeleton.md §6), after the Knife, the Spire, the
Bow and the Yard. Positions are (radius, degrees off the Wall's angle of 150); negative is the Yard's side (south-east),
positive the Cathedral's (north). Steps are counted from the Vanguard's start along the roads.

## 1. Evaluation (the Wall as it stands)

Measured on today's tree (`region-map.ts vanguard`, `walks.ts`, `offdef.ts vanguard`; the reference sector by
`ref-sector.mjs 0`).

- **Size.** 50 notables and 4 keystones (Unerring Discipline, Rooted Stance, Strongarm, Blood Rite). The reference's str
  sector holds 49 notables and 5 keystones.
- **The start.** 9 notables within 8 steps behind the armour exit and 8 behind the melee exit; the skeleton called the
  Wall lopsided (one exit held 25 of its near notables, the other 11). Shield Ram (shields) is at the door.
- **Offence, defence and utility:** notables 45/42/13% against the reference's 53/33/14%: defence heavy.
- **Archetypes and their homes.**
  - Armour: Mortar and Stone, Ox Hide, Locked Shields, Iron Voice, Tempered, plus Guarded-like lines; plenty.
  - Stun: Stagger, Weight of Iron, Headsman, Ringing Blows, Greatweight, Hot Iron, Shield Ram.
  - Maces: Weight of Iron, Crushing Blow, Hallowed Hammer, Sledge and Sinew, Hammer Rhythm (five).
  - Two-handed: Greatweight, Thunderstep, Heavy Hands, Headsman, Greatblade (two-handed swords).
  - Axes: Cleaver (one; the Yard's Hewing and Wide Arc are at the Yard's west rim).
  - Area and slams: Thunderstep, Ground Shaker, Long Reach, Bellows.
  - Totems: Standing Cairns, Long Watch, Graven Posts. Warcries: War Drums, Iron Voice. Grit charges: Unbroken, Scar
    Tissue. Fire attacks: Hot Iron, Bellows.
  - Life and regeneration: Oathbound, Broad Back, Second Wind, Barrow Ward, Elemental Ward; leech: Vampiric Strikes;
    full life: Unbloodied.
  - Shields: Locked Shields, Bracing, Shield Ram. Crit: Weak Spot, Crushing Blow. Accuracy: Steady Hands. Mana: Iron
    Lungs. Flasks: Quartermaster. Auras: Warlord's Banner.
  - **Strays:** minions (Grave Host; the Cathedral's), curses (Grim Oath), spells (Iron Liturgy), dual wielding (Two
    Fists; the Yard's), spell block (Stone Ward), movement (Unhurried).
- **Names:** Strongarm is a reference keystone's name; the Wall's Second Wind now shares its name with the Bow's;
  Quartermaster is also a stop's name.
- **What the Yard put at the shared border (do not copy):** shields and block (Buckler, Steady Guard, Steel Rim, Bulwark
  Mending, Shieldwall), warcries (Drill Call, Rally), axes (Hewing, Wide Arc), the two-handed stun payoff (Crushing Swing,
  Hold the Line's Fortified on stun), Iron Skin's armour against elemental hits, Sword and Board.
- **What the reference sector has that the Wall lacks:** endurance-style charges with a payoff (the Wall has grit with
  no payoff); a totem count rule; armour with a rule; strikes that hit an extra enemy; rule-bending notables.

## 2. What the Wall is for

The armoured strength region: the warrior who does not move and is not moved. Its identity is **standing ground**:
armour and grit that grow while the Vanguard holds, stuns that break the enemy's attack, slams that clear the space,
totems and banners planted beside it. Side roads:

- **The heavy weapon**: two-handed maces and swords with stun, south toward the Yard's two-handed partners (not copying
  their stun payoff: the Wall's stun breaks attacks and builds grit).
- **Totems and the elements**: north, toward the Cathedral (totems, resistances, auras, elemental maces).
- **Warcries and grit**: the Barrows, the warcry region proper (the Yard's Drill Call is its partner).
- **Shields** in the middle (the axis), so the Yard's shield ground at the south-east border is not copied.

## 3. The frame

- **Start** at radius 1,450 (today 1,000), exits at (1,530, ±6), hubs +20 strength at (1,690, ±5), paths toward each seam,
  spokes through (2,050, ±11.7), the mid ring (2,900, ±13), the rim ring (4,300, ±13), cross roads to the home hub.
- **South-east (Yard) border:** the Yard built it. The south path runs through a cluster to `yard.home.seams.s` (as the
  Yard's east path does, so the starts sit about 10 to 12 steps apart); the mid ring ends at `yard.shield.radW.m`; the
  rim ring at `yard.fosse.ring.s0`; side rooms hang from `yard.shield.radW.a/b`. The temporary links in `wall/grit.ts`
  and `wall/slams.ts` are replaced.
- **North (Cathedral) border:** the Wall builds the seam (1,600, 30), the border road to the mid ring vertex, the rim
  vertex. The seam links toward the centre's ring at `centre.ring.road.r17`.

## 4. The start and the home

- **North side:** armour with life (`15% armour, 5% life`), the reference's str opener; for the strength class armour is
  not a niche defence. **South side:** melee physical damage with life (`12% melee physical damage, 5% life`). Path nodes:
  armour and life north, melee damage south.
- **Home (steps 5 to 7):** Oathbound at the home hub (life, melee physical, strength). North: Elemental Ward
  (resistances) on the north path outward, the flask notable toward the centre, Ox Hide (armour, stun threshold) off the
  north spoke junction. South: Ringing Blows (melee damage, stun) on the south path (the path runs through it), Second
  Wind's cluster (renamed) toward the centre, Weak Spot (melee physical, melee crit) off the south spoke junction.
- No weapon, element or mechanic within 8 steps: Shield Ram, Greatblade and Cleaver move out.

## 5. Where every cluster goes

| Cluster (notables)                                                    | Area        | Road                                           | Step | Why there                                                                           |
| --------------------------------------------------------------------- | ----------- | ---------------------------------------------- | ---- | ----------------------------------------------------------------------------------- |
| Oathbound                                                             | Gate        | the home hub                                   | 5    | The generalist.                                                                     |
| Elemental Ward                                                        | Gate        | north path, outward                            | 5    | North's defence.                                                                    |
| Quartermaster (renamed)                                               | Gate        | north path, toward the centre                  | 5    | The flask layer.                                                                    |
| Ox Hide                                                               | Gate        | north spoke junction                           | 7    | Armour with stun threshold.                                                         |
| Ringing Blows                                                         | Gate        | south path, run through                        | 5    | South's damage, on the road to the Yard.                                            |
| Second Wind (renamed)                                                 | Gate        | south path, toward the centre                  | 5    | Life and regeneration.                                                              |
| Weak Spot                                                             | Gate        | south spoke junction                           | 7    | Melee crit.                                                                         |
| Warlord's Banner                                                      | Battlements | the north seam, toward the centre              | 7    | Auras, shared with the Cathedral.                                                   |
| Graven Posts                                                          | Battlements | north border road                              | 9    | Totems with resistances, beside the Cathedral's totems.                             |
| Hallowed Hammer                                                       | Battlements | north border road                              | 10   | Elemental maces, the Cathedral seam's theme.                                        |
| Tempered / Unbroken wheel                                             | Battlements | where the north border road meets the mid ring | 11   | Resistances or grit.                                                                |
| Steady Hands                                                          | Rampart     | north spoke, outer                             | 8    | Accuracy and speed.                                                                 |
| Mortar and Stone                                                      | Rampart     | north spoke, outer                             | 9    | Armour.                                                                             |
| Stagger                                                               | Rampart     | north spoke, outer                             | 9    | Stun.                                                                               |
| Iron Lungs                                                            | Rampart     | the mid ring's north stretch                   | 10   | Mana from melee.                                                                    |
| Unerring Discipline (K)                                               | Rampart     | north spoke at the mid ring, a spur            | 10   | The accuracy keystone.                                                              |
| Weight of Iron                                                        | Barbican    | north spoke past the mid ring                  | 11   | Maces with stun.                                                                    |
| Crushing Blow                                                         | Barbican    | the rim ring's north stretch                   | 13   | Mace crit.                                                                          |
| Rooted Stance (K)                                                     | Barbican    | out from the rim ring, north                   | 14   | The standing keystone.                                                              |
| Hot Iron                                                              | Barbican    | the rim ring's north stretch                   | 13   | Fire attacks with stun.                                                             |
| new: armour rule                                                      | Rampart     | the mid ring's north stretch                   | 11   | Armour that grows while standing still.                                             |
| Locked Shields                                                        | Bulwark     | in from the mid ring at the axis               | 9    | Shields with armour, on the axis (the Yard's shields are at the south-east border). |
| Bracing                                                               | Bulwark     | in from the mid ring at the axis               | 10   | Block recovery and stun threshold.                                                  |
| Shield Ram                                                            | Bulwark     | out from the mid ring at the axis              | 11   | Shield attacks with stun.                                                           |
| Greatweight / Broad Back wheel                                        | Quarry      | the mid ring at the axis                       | 11   | Two-handed or life: a choice.                                                       |
| Thunderstep                                                           | Quarry      | south spoke, outer                             | 9    | Two-handed slams.                                                                   |
| Ground Shaker                                                         | Quarry      | south spoke, outer                             | 9    | Area and knockback.                                                                 |
| Standing Cairns                                                       | Quarry      | the Yard's border road                         | 9    | Totems with area.                                                                   |
| Vampiric Strikes                                                      | Quarry      | the Yard's border road                         | 9    | Leech.                                                                              |
| Strongarm (K, renamed)                                                | Quarry      | south spoke at the mid ring, a spur            | 10   | The strength keystone.                                                              |
| Sledge and Sinew                                                      | Quarry      | the mid ring's south stretch                   | 10   | Maces with life.                                                                    |
| Unbloodied                                                            | Quarry      | south spoke past the mid ring                  | 11   | Full life.                                                                          |
| War Drums                                                             | Barrows     | south spoke past the mid ring                  | 11   | Warcries.                                                                           |
| Iron Voice                                                            | Barrows     | the rim ring at the axis                       | 13   | Warcries with armour.                                                               |
| Scar Tissue                                                           | Barrows     | the rim ring                                   | 13   | Grit when hit.                                                                      |
| Headsman                                                              | Barrows     | out from the rim ring                          | 14   | Two-handed stun.                                                                    |
| Heavy Hands                                                           | Barrows     | the rim ring                                   | 13   | Two-handed speed.                                                                   |
| Greatblade                                                            | Barrows     | out from the rim ring                          | 14   | Two-handed swords.                                                                  |
| Cleaver                                                               | Barrows     | the rim ring's south stretch                   | 13   | Axes beside the Yard's.                                                             |
| Hammer Rhythm                                                         | Barrows     | the rim ring                                   | 13   | Mace speed.                                                                         |
| Long Reach                                                            | Barrows     | out from the rim ring                          | 14   | Reach and area.                                                                     |
| Bellows                                                               | Barrows     | out from the rim ring                          | 14   | Fire with area.                                                                     |
| Long Watch                                                            | Barrows     | the rim ring                                   | 13   | Totem speed and duration.                                                           |
| Barrow Ward                                                           | Barrows     | the rim ring                                   | 13   | Regeneration and reduction.                                                         |
| Blood Rite (K)                                                        | Barrows     | out from the rim ring, south                   | 15   | The farthest keystone.                                                              |
| new: grit payoff                                                      | Barrows     | the rim ring                                   | 13   | Grit paid off (armour or damage per charge).                                        |
| new: totem count                                                      | Battlements | north, the mid ring                            | 11   | One more totem (the deploy count totems already use).                               |
| new: a strike rule                                                    | Quarry      | south, the mid ring                            | 11   | Strikes that hit one more nearby enemy, or slams that stun.                         |
| new: stun that builds grit                                            | Rampart     | north past the mid ring                        | 12   | Stunning an enemy gives grit: the Wall's stun is its own.                           |
| Grave Host, Grim Oath, Iron Liturgy, Two Fists, Stone Ward, Unhurried | cut         |                                                |      | Strays (minions, curses, spells, dual wielding, spell block, movement).             |

## 6. Size

About 50 notables: 44 kept (six cut), 5 new named above, a few hooked second notables in the notables pass. Node count
about level.

## 7. Keystones

Unerring Discipline (north spoke, about 10), Strongarm renamed (south spoke, about 10), Rooted Stance (north rim, about
14), Blood Rite (south rim, about 15). All at 8 or more.

## 8. Sustain (attrition)

The Wall's voice: regeneration (Second Wind, Barrow Ward, Broad Back), leech (Vampiric Strikes), grit's regeneration per
charge (Scar Tissue), life with mace hits (Sledge and Sinew), and the flask notable near home. About as much as before.

## 9. Open

- The start's sides keep armour north (the reference's str opener; armour is the strength class's defence).
- Shields on the axis rather than at either border (the Yard and the Cathedral both carry shields).

## 10. Revision 1 of the plan (after the reviewer's plan round 1)

The identity, frame, start and keystones stand; the table changes as below (rows above are superseded where they
differ). Angles are degrees off the Wall's axis; the Yard border is at -30.

- **The Wall's shield is grit's** (the reference ties shields to its charge): Locked Shields becomes armour with grit
  gained on block (`chargeOn.block.grit`, an event the fight already rolls); Shield Ram becomes shield attacks that knock
  back (the wall that pushes), no stun duration. Bracing is cut (block recovery and stun threshold copied the Yard's
  Steel Rim and Sword and Board). The shields stay on the axis (0 ± 8), far from the Yard's shield road.
- **Axes are left to the Yard:** Cleaver is cut (it sat a few steps from Hewing and Wide Arc at the shared rim).
- **Two-handed moves north and the south rim is spread:**
  - The Greatweight / Broad Back wheel moves to the Barbican, out from the north spoke past the mid ring (+15, step 11).
  - Headsman moves north to the Barbican's rim (+18, step 13) and is re-hooked (its lines copied the Yard's Momentum
    Swing): two-handed with stun that builds grit.
  - Greatblade and Heavy Hands stay south but at the axis rim (-5 and -10, steps 13-14), not at the Yard border.
  - War Drums moves to the axis rim (0, step 13) and is re-hooked in the notables pass (warcry effect plus duration copied
    Drill Call with Rally).
  - Near the Yard border (-20 to -30) only: Standing Cairns (-24, step 9), Vampiric Strikes (-26, step 9), Ringing
    Blows on the south path (-24, step 5), Sledge and Sinew (-21, step 10), Long Watch (-24, step 13), Blood Rite (-25,
    step 15). None copies the Yard's west border (shields, axes, warcries, two-handed stun, armour against elements).
- **Area split:** Thunderstep stays on the south spoke (step 9); Ground Shaker moves to the south rim (-15, step 13) as
  the area home of slams, and the new strike rule (strikes hit one more nearby enemy: `extraTargets` with the strike tag,
  which the calc already reads) sits on the mid ring's south stretch (-21, step 11).
- **Grit, corrected:** grit already pays off by itself (each charge gives 4% physical damage reduction and 4% to all
  elemental resistances). What the Wall lacks is ways to gain it. The grit walk, north: Unbroken (one more charge) on the
  Tempered wheel where the north border road meets the mid ring (+27, step 11); grit on stun (new) past the north spoke's
  mid ring (+15, step 12) and on Headsman; grit on shield block (Locked Shields, axis, step 9); Scar Tissue (grit when
  hit) moves north to the rim (+22, step 13); the second payoff (new) at the north rim (+25, step 14) is offensive
  (damage per grit charge), since grit's own payoff is defensive.
- **Stun:** duration and lower enemy stun threshold stay on three notables (Stagger, Ringing Blows, Weight of Iron); the
  rest of the stun lines become payoffs (grit on stun, Headsman) or other lines (Hot Iron fire, Shield Ram knockback,
  Greatweight two-handed). The boss lock at `combat.ts` ~869 limits a boss's stun of the character, not the character's
  stun of a boss; a boss's high stun threshold makes the Wall's stuns land mostly on packs and minibosses, which is where
  grit on stun pays (to be checked in the notables pass against the stun formula).
- **The north exit is a whole direction:** Weak Spot (melee crit, offence) moves to the north spoke junction (+17,
  step 7); Ox Hide (armour, stun threshold) moves to the south spoke junction. North's second defence is Elemental Ward
  (resistances and life). The north path's second node becomes resistances (not armour). Armour lines within 9 steps
  north: the start node, Mortar and Stone (9), Locked Shields (axis, 9).
- **Eleven own notables within 8:** two side rooms added at steps 7-8, no weapons: Steady Hands (accuracy and speed,
  north spoke outer, +6) and Barrow Ward (regeneration and reduction, south spoke outer, -6). Warlord's Banner moves past
  8 (north border road's second node, +26, step 9).
- **The cut archetypes keep homes elsewhere:** curses (the Knife: Second Curse, Ill Wish, Salt in the Wound, Long
  Grudge; the Spire: Hexwright, Bad Company), spell block (the Cathedral's Undercroft and Lychway), dual wielding (the
  Yard's Lists), spells (the Spire, the Cathedral). **Grave Host is kept** (the owner's ruling of 2026-10-20: it stays every
  summoner's farthest minion notable), at the north rim by the Cathedral border (+28, step 15).
- **Notes for the notables pass:** Unbloodied (full life) is weak under attrition: re-hook or cut; the armour-while-
  standing-still rule depends on how often a melee character stands still under hold or close-in spacing.
- **Projected counts:** 50 today; cut Grim Oath, Iron Liturgy, Two Fists, Stone Ward, Unhurried, Bracing, Cleaver (43);
  new: the armour rule, grit on stun, the grit payoff, the totem count, the strike rule (48), plus a few hooked second
  notables (about 50-52). Own notables within 8: about 11 (Oathbound, Elemental Ward, the flask notable, Weak Spot,
  Ringing Blows, the renamed Second Wind, Ox Hide, Steady Hands, Barrow Ward, Vampiric Strikes or Standing Cairns at the
  border, Iron Lungs). The offence/defence/utility split, the sustain tally (`sustain.ts`) and the per-exit counts within
  8 and 10 come with the structure (they depend on placement); the cuts remove four defence-or-utility notables and
  the additions are two offence, two defence, one utility.

## 11. Structure (built 2026-10-31, before the notables pass)

Written by `scripts/passives/rework/wall-gen.ts` into `src/data/passives/wall/`; the render is `R-wall-structure.png`.
§2's "warcries and grit" for the Barrows now reads: warcries, two-handed swords, slams' area, fire and totems at the
rim; grit lives north and on the axis (§10).

- As §5 and §10, with these choices: the south path runs through Ringing Blows to the Yard's seam; the maces split north
  and south (Weight of Iron off the south spoke past the mid ring, Crushing Blow at the south rim, Sledge and Sinew on the
  mid ring's south stretch; Hallowed Hammer north), and Hot Iron moves to the south rim beside Bellows, so the north does
  not hold everything; the grit payoff (Grit and Gravel) hangs on from Scar Tissue, the grit walk's end.
- Six links between neighbouring clusters. No crossings inside the region; the remaining ones are with the unrebuilt
  Cathedral. No unreachable nodes. Temporary Cathedral links into removed Wall nodes retargeted (`cathedral/nave.ts`,
  `cathedral/rods.ts`); the Yard's temporary link into the old Wall removed.
- Measured: 11 own notables within 8 steps (south 4, north 6, both 1); within 10: south 6, north 12; within 14: south 19,
  north 22, both 3. The Reaver reaches Ringing Blows at step 5 (through the shared seam), Vampiric Strikes at 7,
  Standing Cairns at 8, the renamed Second Wind at 11.
