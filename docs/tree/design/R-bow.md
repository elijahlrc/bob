# The Bow's rebuild (Strider, dexterity, angle 30)

The third region of the attrition rework, on the approved skeleton (R-skeleton.md §4), after the Knife (R-knife.md) and
the Spire (R-spire.md). Positions are (radius, degrees off the Bow's angle of 30); negative is the Knife's side (north),
positive the Yard's (south). Steps are counted from the Strider's start along the roads.

## 1. Evaluation (the Bow as it stands)

Measured on today's tree (`region-map.ts strider`, `walks.ts`, `offdef.ts strider`; the reference sector by
`ref-sector.mjs 1`).

- **Size.** 221 nodes: 49 notables, 4 keystones, 121 smalls, 48 road nodes. The reference's dex sector holds 67 notables
  and 4 keystones; the Knife 65, the Spire 64.
- **The most cluttered start in the tree** (the skeleton's words): 17 notables within 8 steps behind the north exit and 14
  behind the south. Steady Draw (a keystone) at 7; Longbow, Fleet Blade (swords), Tripwire (traps), Elemental
  Fletching, Hedge Magic (spells), Light Hand (one-handed) and Round Shield (shields) all within 8: weapons and niches
  at the door.
- **Offence, defence and utility:** notables 63/22/15% against the reference's 55/24/21%; smalls 62/31/7% against
  65/25/10%. Offence-heavy in the notables, light on utility.
- **Archetypes and their homes.**
  - Bows: Longbow, Rapid Fire, Kill Shot, Telling Shot, Bright Shafts, Fouled Tips (six). Projectiles: Far Flight,
    Split Volley, Skewer, Ricochet (four), with Close Quarters and Arrow Weave.
  - Evasion: Hard Target, Fleet Foot, Wayfarer, Tall Grass, Field Kit, Hare's Pace (six, plenty).
  - Elemental attacks: Elemental Fletching, Bright Shafts (general), Pitch Arrows (fire), Live Wire (lightning): fire
    and lightning one home each.
  - Bleed: Barbed Arrows, Deep Cuts. Poison: Venom Fletching, Fouled Tips. Physical attacks: Deep Pull.
  - Crit: Vital Aim, Kill Shot, Killing Eye. Fervour: Hot Pursuit (with the Knife's Feint and Cut).
  - Life and resistances: Long Breath, Hardy Stock, Weathered, Wanderer. Leech: Thirsty Quiver. Mana: Clear Head.
    Flasks: Quick Sip, Field Kit. Movement: Fleet Foot, plus movement lines on Rapid Fire and Quick Sip.
  - **Strays:** mines (Shaped Charge; the Knife has four mine homes), totems (Sentry Post; totems are the Wall's and
    the Cathedral's), swords (Fleet Blade; the Yard's), axes (Hatchet Work; the Yard's and the Wall's), shields (Round
    Shield), one-handed (Light Hand), spells (Hedge Magic). The last four are the seams' themes and stay there with a
    partner across the border; mines and totems leave.
- **What the reference sector has that the Bow lacks:** the flask sector of the reference (six flask notables);
  accuracy as a theme; a projectile rule that rewards distance (the counterpart of a close-range keystone); a charge or
  speed buff gained on kill; dual wield and shield attacks with block; and rule-bending notables (none today).

## 2. What the Bow is for

The ranged attacker's region: bows, projectiles, evasion, accuracy and speed, with elemental and poisoned arrows. Its
identity is **the fight at range and on the move** (distance, chaining, a buff that comes from killing), and the
generic flask layer is strongest here, as in the reference. Side roads that pull a Strider somewhere unusual:

- **Close and physical**, south: one-handed weapons and dual wielding at the Yard seam, axes, bleed, leech, Plated Hide.
- **Elemental arrows**: fire and lightning each a direction (south), elemental attacks in general on the axis.
- **Traps** at the Knife seam (the Knife's traps across the border), **spells** with dexterity (Hedge Magic) there too.
- **Evasion as the defence**, with a rule (Elusive gained on crit) instead of a seventh flat evasion notable.

## 3. The frame (the skeleton, as for the Knife and the Spire)

- **Start** at radius 1,450 (today 1,000). Two exits at (1,530, ±6), hubs of +20 dexterity at (1,690, ±5); paths along
  the bow toward each seam; spokes through junctions at (2,050, ±11.7), the mid ring at (2,900, ±13), the rim ring at
  (4,300, ±13); cross roads to the home hub at (2,050, 0).
- **North (Knife) border:** the Knife built it. The north path ends at `knife.home.seams.s`; the mid ring at
  `knife.snares.radS.m`; the rim ring at `knife.rim.ring.s0`. The Knife-built border road (`knife.snares.radS.a/b`)
  takes Bow side rooms. The temporary link in `bow/rim.ts` is replaced.
- **South (Yard) border:** the Bow builds the seam at (1,600, 30), the border road out to the mid ring's vertex at
  (2,900, 30) and the rim ring's vertex at (4,300, 30).
- The seams link toward the centre's ring for now (`centre.ring.road.r9` south; the Knife's `r5` north).

## 4. The start and the home

- **North side:** attack damage with life (`12% attack damage, 5% life`): every Strider attacks; the reference's dex start
  opens on projectile damage. **South side:** evasion with life (`15% evasion, 5% life`), the reference's other opener.
  Path nodes: attack damage north, evasion south.
- **Home (steps 5 to 8), each half a damage and a defence home:**
  - North: Vital Aim (crit) a side room off the north path outward; Clear Head (mana and reservation) toward the centre;
    Long Breath (life and regeneration) off the north spoke junction.
  - South: Wayfarer (evasion and resistances) off the south path outward; Quick Sip (flasks) toward the centre; Quick
    Hands (attack speed) off the south spoke junction.
  - Hawk's Eye at the home hub (attack damage, accuracy, dexterity), Hard Target (evasion, life, stun) a side room on
    out from it along the axis.
- No weapon, element or mechanic within 8 steps; movement lines leave the home (Rapid Fire's and Quick Sip's).

## 5. Where every cluster goes

Step is the notable's, approximate. Areas: the Gate (home), the Hedgerows (north spoke), the Meadow (the axis inside the
mid ring), the High Moor and the Thicket (the axis at the mid ring), the Ford (south spoke), the Far Pasture (north
toward the rim), the Water Meadows (south toward the rim).

| Cluster (notables)                    | Area                               | Road                                           | Step | Why there                                                                                      |
| ------------------------------------- | ---------------------------------- | ---------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| Hawk's Eye                            | Gate                               | the home hub                                   | 5    | The generalist, passed through.                                                                |
| Vital Aim                             | Gate                               | north path, outward                            | 5    | North's damage near home.                                                                      |
| Clear Head                            | Gate                               | north path, toward the centre                  | 5    | Mana and reservation, one mana notable near home.                                              |
| Long Breath                           | Gate                               | north spoke junction                           | 7    | North's defence.                                                                               |
| Wayfarer                              | Gate                               | south path, outward                            | 5    | South's defence.                                                                               |
| Quick Sip                             | Gate                               | south path, toward the centre                  | 5    | The flask layer near home (movement removed).                                                  |
| Quick Hands                           | Gate                               | south spoke junction                           | 7    | South's damage.                                                                                |
| Hard Target                           | Gate                               | on out from Hawk's Eye                         | 7    | Evasion and life on the axis.                                                                  |
| Hedge Magic                           | Hedgerows                          | the Knife's seam, toward the centre            | 6    | Spells with dexterity, shared with the Shade.                                                  |
| Hardy Stock                           | Hedgerows                          | the Knife's border road                        | 8    | Life and resistances.                                                                          |
| Tripwire                              | Hedgerows                          | the Knife's border road                        | 9    | Traps beside the Knife's.                                                                      |
| Longbow / Fleet Blade wheel → Longbow | Hedgerows                          | north spoke, outer                             | 9    | The first bows. Fleet Blade (swords) leaves the wheel for the south seam.                      |
| Elemental Fletching                   | Hedgerows                          | north spoke, outer                             | 9    | Elemental attacks in general, beyond the first ring.                                           |
| new: accuracy                         | Hedgerows                          | north spoke, outer                             | 8    | Accuracy as a theme (the reference's).                                                         |
| Steady Draw (K)                       | Hedgerows                          | north spoke at the mid ring, a spur            | 10   | Today at 7; now past 8.                                                                        |
| Venom Fletching                       | Hedgerows                          | the mid ring's north stretch                   | 10   | Poisoned attacks.                                                                              |
| Ricochet                              | Hedgerows                          | north spoke past the mid ring                  | 10   | Chain.                                                                                         |
| Hair Trigger                          | Far Pasture                        | the rim ring's north stretch                   | 12   | Traps' second home, by the Knife border.                                                       |
| Kill Shot                             | Far Pasture                        | the rim ring at the north spoke                | 13   | Bow crit.                                                                                      |
| Hare's Pace                           | Far Pasture                        | the rim ring's north stretch                   | 12   | Evasion and attack speed.                                                                      |
| new: the long shot                    | Far Pasture                        | out from the rim ring                          | 14   | Projectiles hit harder the farther they fly: the counterpart of Close Quarters (★engine).      |
| Far Flight / Barbed Arrows wheel      | High Moor                          | the mid ring west of the axis                  | 10   | Projectiles or bleeding arrows.                                                                |
| Close Quarters (K)                    | High Moor                          | out from the mid ring                          | 11   | The close-range keystone, apart from the long shot.                                            |
| Split Volley wheel                    | Thicket                            | the mid ring east of the axis                  | 10   | More projectiles.                                                                              |
| Rapid Fire                            | Meadow                             | in from the mid ring at the axis               | 10   | Bow speed (movement removed).                                                                  |
| Skewer                                | Thicket                            | out from the mid ring                          | 11   | Pierce.                                                                                        |
| Arrow Weave (K)                       | Meadow                             | the axis, in from the mid ring                 | 11   | The evasion keystone.                                                                          |
| new: onslaught on kill                | Meadow                             | the axis                                       | 11   | A speed buff from killing (the reference's), a rule.                                           |
| Hot Pursuit                           | Thicket                            | out from the mid ring                          | 12   | Fervour on kill, beside the Knife's fervour.                                                   |
| new: fervour's second home            | Thicket                            | the rim ring at the axis                       | 13   | One more fervour charge.                                                                       |
| Telling Shot                          | Thicket                            | out from the rim ring at the axis              | 14   | Bows with double damage.                                                                       |
| Tall Grass                            | Meadow                             | the rim ring at the axis                       | 13   | Evasion and regeneration.                                                                      |
| new: Elusive on crit                  | Meadow                             | the rim ring                                   | 13   | Evasion's rule bender.                                                                         |
| new: elemental attack payoff          | Thicket                            | out from the rim ring                          | 14   | Penetration with weapons.                                                                      |
| Wanderer                              | Ford                               | the south seam, toward the centre              | 6    | Attributes and life, shared with the Reaver.                                                   |
| Thirsty Quiver                        | Ford                               | the south border road                          | 7-8  | Leech, the attacker's sustain.                                                                 |
| Light Hand                            | Ford                               | the south border road                          | 9    | One-handed, the Yard seam's theme.                                                             |
| Fleet Blade                           | Ford                               | the south border road                          | 10   | Swords beside the Yard's.                                                                      |
| Round Shield                          | Ford                               | where the south border road meets the mid ring | 10   | Shield attacks, shared with the Yard.                                                          |
| new: dual wielding                    | Ford                               | where the south border road meets the mid ring | 11   | Dual wielding's Bow home, beside the Yard's Lists.                                             |
| Hatchet Work                          | Ford                               | south spoke, outer                             | 9    | Axes.                                                                                          |
| Deep Pull / Deep Cuts wheel           | Ford                               | south spoke, outer                             | 9-10 | Physical attacks or bleed.                                                                     |
| Pitch Arrows                          | Ford                               | the mid ring's south stretch                   | 10   | Fire attacks' first home.                                                                      |
| Plated Hide (K)                       | Ford                               | south spoke at the mid ring, a spur            | 10   | The armour keystone.                                                                           |
| new: mana from attacks                | Ford                               | south spoke past the mid ring                  | 11   | Mana leech and mana on hit for attackers.                                                      |
| Bright Shafts                         | Water Meadows                      | south spoke past the mid ring                  | 11   | Elemental arrows.                                                                              |
| new: fire attacks' second home        | Water Meadows                      | the rim ring's south stretch                   | 13   | Ignite with attacks.                                                                           |
| Live Wire                             | Water Meadows                      | the rim ring's south stretch                   | 12   | Lightning attacks' first home.                                                                 |
| new: lightning attacks' second home   | Water Meadows                      | out from the rim ring                          | 14   | Shock with attacks.                                                                            |
| Field Kit                             | Water Meadows                      | the rim ring at the south spoke                | 12   | Evasion and flasks.                                                                            |
| Fouled Tips                           | Water Meadows                      | out from the rim ring                          | 13   | Poisoned bows.                                                                                 |
| Killing Eye                           | Water Meadows                      | out from the rim ring by the border            | 13   | Crit and executing.                                                                            |
| new: life flasks                      | Water Meadows                      | the rim ring                                   | 13   | The flask sector's life side.                                                                  |
| Weathered, Shaped Charge, Sentry Post | cut                                |                                                |      | A flat third resistance notable; mines are the Knife's; totems the Wall's and the Cathedral's. |
| Fleet Foot                            | cut or redone in the notables pass |                                                |      | Movement and evasion: the movement goes.                                                       |

**Bows:** Longbow 9 (north), Rapid Fire 10 (axis), Kill Shot 13 (north rim), Telling Shot 14 (axis rim), Bright Shafts
11 and Fouled Tips 13 (south): a bow build can go north, the axis or south. **Projectiles** on the axis (Far Flight,
Split Volley, Skewer, Ricochet north), the two distance rules apart (Close Quarters at the mid ring, the long shot at
the north rim). **Fire and lightning arrows** south, each two homes; elemental attacks in general north (Elemental
Fletching) and on the axis (the payoff).

## 6. Size

About 65 notables: 46 kept (three cut), about 11 new named above, about 8 second notables in the notables pass. Node
count about level (about 225) by thinning roads and trimming long clusters.

## 7. Keystones

Steady Draw (north spoke, about 10; today 7), Close Quarters (mid ring, about 11), Arrow Weave (the axis, about 11),
Plated Hide (south spoke, about 10). All at 8 or more.

## 8. Sustain (attrition)

The Bow's voice: life leech from attacks (Thirsty Quiver), mana from attacks (new), regeneration (Long Breath, Tall
Grass), and the flask layer at its strongest (Quick Sip near home, Field Kit, a life-flask notable). Numbers wait for the
flask stats.

## 9. Open

- The start's sides (attack damage with life, evasion with life) are a proposal.
- Whether Fleet Foot is cut or kept without its movement line.

## 10. Revision 1 of the table (after the reviewer's plan round 1)

The direction was approved; the table changes as below (the rows above are superseded where they differ).

- **Traps:** one Bow trap home, Tripwire, re-themed for the kiting bow user (traps that chill, tying into the cold arrows
  below), on the Knife's border road past step 8. Hair Trigger is cut (a copy of the Knife's Hair Spring on the same
  border).
- **The north seam's copies:**
  - Hardy Stock moves south, to the Yard seam's border road, away from the Knife's Ward of Smoke; it gets a hook in the
    notables pass.
  - The new accuracy notable moves off the north spoke (it faced the Knife's Steady Eye) to the Meadow on the axis, and
    is a rule, not a flat line (decided in the notables pass).
  - Skewer is cut (a copy of the Knife's Fan of Blades); projectiles keep Far Flight, Split Volley, Ricochet and the long
    shot.
  - Kill Shot stays, with a hook unlike the Knife's Quiet Shot (notables pass).
  - Venom Fletching is cut: poison is the Knife's (five homes); the Bow keeps Fouled Tips, poisoned bows, at its south rim.
- **Hatchet Work is cut** (axes are the Yard's and the Wall's).
- **No new dual-wielding notable** (the Yard's ground is 6 to 11 steps from the Strider).
- **Cold arrows** get two Bow homes: a first rung on the north spoke's outer node (step 9, where the accuracy notable
  was) and a payoff at the north rim (Far Pasture, step 13). Chill suits kiting. Lightning's planned second home is
  dropped (the Yard's lightning attacks are next door); Live Wire stays as the Bow's one lightning home beside them.
- **Hedge Magic is cut** (a niche at step 6; the Knife already serves dexterity spellcasters with Honed Mind and Swift
  Incantation). The Knife's seam has no Bow side room toward the centre.
- **Fleet Foot is cut** (a sixth flat evasion notable without its movement line).
- **Three new non-offence homes** so the count does not lean further to offence: flask charges (Water Meadows, by Field
  Kit), a defence of life, stun and regeneration (the Ford), elemental resistances with avoidance of ailments (the
  Meadow).
- **The start's sides** differ from R-skeleton §4 (5% attack speed / 10% evasion there): attack damage with life, evasion
  with life, as CONSTRAINTS §16 item 8 and the Knife's start.

**Projected count.** 49 today; 9 cut (Weathered, Shaped Charge, Sentry Post, Fleet Foot, Hatchet Work, Hair Trigger,
Venom Fletching, Skewer, Hedge Magic) leaves 40. New clusters: 13 (accuracy rule, long shot, onslaught on kill, fervour,
Elusive on crit, elemental attack payoff, mana from attacks, fire's second, cold's two, life flasks, flask charges, life
and stun, elemental resistances). Second notables: about 12, aimed at utility and defence (flask charges, mana,
reservation, stun), for about 65. Projected notables roughly 55% offence, 24% defence, 21% utility, to be counted on the
build.

## 11. Structure (built 2026-10-31, before the notables pass)

Written by `scripts/passives/rework/bow-gen.ts` into `src/data/passives/bow/`; the render is `R-bow-structure.png`. Lines
are today's except the start, paths and Hawk's Eye; new clusters carry first-draft lines (the notables pass rewrites).

- As §5 and §10, with these choices made while laying out: Longbow hangs out from the mid ring's north stretch (step 10),
  Frost Fletching and Sure Aim off the north spoke's second outer node, Glazed Hide off its first, toward the axis;
  Elemental Fletching and Ricochet off the north spoke past the mid ring; Hunter's Rush and Second Wind off the south
  spoke's first outer node; the Deep Pull cluster off its second; Arrow Weave a spur in from the rim ring at the axis
  (step 12), Close Quarters a spur out from the mid ring at the axis (step 9); Fleet Blade and Round Shield where the south
  border road meets the mid ring; Hardy Stock in from the mid ring's south stretch.
- The Split Volley side of its wheel was joined to the wheel only from outside in the old files: a link inside the wheel
  now joins it (`reach.ts` checks every rebuilt region for unreachable nodes: none).
- Seven links between neighbouring clusters (Tripwire–Frost Fletching, Longbow–Ricochet, Rapid Fire–Hunter's Rush, Light
  Hand–Deep Pull, Pitch Arrows–Bright Shafts, Hot Pursuit–Shadow Step); four others were dropped because they crossed roads.
- Measured: no notable within 4 steps; 13 of the Bow's own notables within 8 (the Knife 11, the Spire 14). By bands
  1-4/5-8/9-12/13-16/17-20: 0/24/48/83/68 notables (bands include neighbours'). No internal crossings.
