# The Spire's rebuild (Mystic, intelligence, angle -90)

The second region of the attrition rework, on the approved skeleton (R-skeleton.md §3), after the Knife (R-knife.md). The
owner's brief for the rest of the tree (R-state.md): evaluate, plan, structure, notables, build, each reviewed by the
reviewer (R-reviewer.md). Positions are (radius, degrees off the Spire's angle of -90); negative is the Cathedral's
side (west), positive the Knife's (east). Steps are counted from the Mystic's start along the roads.

## 1. Evaluation (the Spire as it stands)

Measured on today's tree (`region-map.ts mystic`, `walks.ts`, `offdef.ts mystic`; the reference's sector by `ref-sector.mjs 2`).

- **Size.** 246 nodes: 50 notables, 5 keystones, 133 smalls, 58 road nodes. The reference's int sector holds 67
  notables and 4 keystones; the rebuilt Knife holds 65 and 4.
- **The start is piled.** First Light is a notable at step 2; Still Mind and Sharp Mind at 4; Warm Blood and Deft Wand
  (wand attacks, a weapon at step 6) at 6. Eight notables within 8 steps of the west exit, seven of the east; the rework
  wants none within 4 and few within 8 (CONSTRAINTS §16).
- **Offence, defence and utility** match the reference sector already: notables 55/21/24% against 55/23/22%, smalls
  57/26/17% against 68/22/11% (a little light on offence in the smalls).
- **Archetypes and their homes.**
  - Spells in general: Ready Wit, First Light, Keen Verse, Long Chant, Living Verse, Piercing Word (plenty).
  - Spell crit: Sharp Mind, Keen Verse, Cold Light, Flashpoint (four).
  - Cold: Hoarfrost, Shatter, Cold Light (three). Lightning: Thunderhead, Live Current (two). Fire: Cinder,
    Flashpoint (two, and Cinder is ignite only). Elements in general: Piercing Word, Harsh Weather, Prismatic Balance,
    Fever Pitch.
  - Damage over time: Withering, Lingering (two, both on the axis).
  - Area and projectiles: Broad Weave, Darting Bolts (one each).
  - Energy shield: Glass Skin, Composure, Quickening, High Veil, Siphon, Kept Vows, Warm Blood, Mind Bulwark.
  - Mana: Still Mind, Deep Well, Frugal, Warded Mind, Mana Tap, Draught, Mana Bastion.
  - Wand attacks: Deft Wand, Wand Volley, Bright Wand, Pinpoint, Needlework (five). Wand spells: Wandwork (one).
  - Minions: Familiars (west), Bad Company (east rim, with curses): two, far apart.
  - Curses: Hexwright, Bad Company. Insight: Flashes of Insight. Dagger spells: Sharp Tongue.
  - Strays (one home): channelling (Steady Stream), traps (Snare Line: the Knife's and the Bow's ground), shields with
    spells (Spirit Ward), wand spells (Wandwork).
  - Life: Warm Blood, Quiet Pulse, Living Verse, Hale Scribe. Dodge: Mist Walk. Stun: Composure.
- **What the reference sector has that the Spire lacks:** an element's ladder from a plain node at mid depth to a payoff
  with a rule (penetration and leech as energy shield) deeper; staff casting with block; a mana-scaled spell notable;
  totems and brands with crit; charge play; more minion homes; spell block from a shield or dual wield. Bob keeps totems,
  brands and staves in the Cathedral and minions mainly in the Cathedral; those stay there.
- **No notable bends a rule today;** only the keystones do.

## 2. What the Spire is for

The pure caster's region: spells, the three elements, energy shield and mana. Its identity is **spells that bend a rule
of the fight** (crit, an element's ailment, mana as a resource, a full energy shield) more than plain spell damage; the
notables pass has to deliver it. The side roads that pull a Mystic somewhere unusual:

- **Wand casters and wand attackers**, on both sides past step 8.
- **Life casters** (no energy shield): Warm Blood and Hale Scribe near home, Quiet Pulse and Living Verse further out.
- **Damage over time, chaos and curses**, at the east seam where the Knife's chaos spells and curses meet them.
- **Spell minions**, at the west seam where the Cathedral's minions meet them; minions with curses at the west rim.
- **Low life** (Pain Conduit with reservation) and **mana as the defence** (Mind Bulwark against Mana Bastion, on
  opposite spokes so the pair costs a crossing).

## 3. The frame (the skeleton, mirrored from the Knife)

- **Start** at radius 1,450 (today 1,000). Two exits at (1,530, ±6), hubs of +20 intelligence at (1,690, ±5).
- **Paths** from each side along the bow toward its seam, two stat nodes each, as the Knife's.
- **Spokes** from each hub out through a junction at (2,050, ±11.7), the mid ring at (2,900, ±13) and the rim ring at
  (4,300, ±13). **Cross roads** from each hub in to the home hub at (2,050, 0), two stat nodes each.
- **East (Knife) border:** the Knife built it. The east path ends at `knife.home.seams.n`; the mid ring ends at
  `knife.hex.radN.m`; the rim ring at `knife.rim.ring.n0`. The temporary links into the Knife (`spire/craft.ts`,
  `spire/rim.ts`) are replaced.
- **West (Cathedral) border:** the Spire builds the seam at (1,600, -30), the border radial from the seam out to the mid
  ring's vertex at (2,900, -30), and the rim ring's vertex at (4,300, -30). The Cathedral links to them in its pass.
- The seams link toward the centre's ring for now (`centre.ring.road.r23` west, the Knife's `r3` east); the centre is
  redrawn last.

Road steps (approximate): sides 1, hubs 2, spoke junctions 4, First Light 5, the west seam 5, the spokes' outer nodes 5
and 6, the mid ring at the spokes 7, the ring stretches and the spokes beyond the mid ring 8, the rim ring 9 to 12. A
side room's notable sits two or three steps past its road node.

## 4. The start and the home

- **West side:** energy shield with life (`+8 ES, 5% life`): both defences, so a life caster and an energy shield caster
  both take it. **East side:** damage with life (`12% damage, 5% life`): every Mystic, the caster and the wand attacker,
  uses both; the reference's int start opens on spell damage, the Knife's on damage with life. The west path's stat
  nodes are energy shield with life, the east path's damage.
- **Home (steps 4 to 8), each half with a damage and a defence home:**
  - West: Ready Wit and Warded Mind (spell damage, chaos resistance) on the west path, which runs through them to the
    Cathedral seam; Still Mind (mana) off the west spoke junction; Draught (flasks) a side room toward the centre.
  - East: Warm Blood (life and energy shield) on the east path, which runs through it to the Knife seam; Sharp Mind
    (spell crit) off the east spoke junction; Hale Scribe (life) a side room toward the centre.
  - First Light at the home hub, passed through from either cross road.
- **Mana near home is kept to Still Mind and Draught's flask lines.** First Light, Warded Mind and Hale Scribe lose
  their mana lines in the notables pass; the east side has no mana line. The Knife's seam mana (Hoarded Breath, Low Tide,
  Deep Reserves) is three or more steps past the east seam.

## 5. Where every cluster goes

Step is the notable's, approximate. Area names: the Gate (home), the Cloister (west), the Scriptorium (east), the Column
(the axis at the mid ring), the Lantern (west toward the rim), the Gallery (east toward the rim), the Belfry (the axis
toward the rim), the Parapet (the rim ring).

| Cluster (notables)                  | Area        | Road                                     | Step  | Why there                                                                            |
| ----------------------------------- | ----------- | ---------------------------------------- | ----- | ------------------------------------------------------------------------------------ |
| First Light                         | Gate        | the home hub                             | 5     | The generalist, passed through.                                                      |
| Ready Wit / Warded Mind             | Gate        | west path, run through                   | 4-5   | West's damage and defence near home.                                                 |
| Still Mind                          | Gate        | west spoke junction                      | 6     | The one mana notable near home.                                                      |
| Draught                             | Gate        | west path, toward the centre             | 5     | The flask layer near home.                                                           |
| Warm Blood                          | Gate        | east path, run through                   | 4-5   | East's defence near home (the life caster).                                          |
| Sharp Mind                          | Gate        | east spoke junction                      | 6     | Spell crit, east's damage near home.                                                 |
| Hale Scribe                         | Gate        | east path, toward the centre             | 5     | Life near home, a side room.                                                         |
| Kept Vows                           | Cloister    | the west seam, toward the centre         | 7     | Reservation and energy shield shared with the Cathedral.                             |
| Quickening                          | Cloister    | west border road                         | 8     | Energy shield recharge, the seam's theme.                                            |
| Pain Conduit (K)                    | Cloister    | west border road, a spur                 | 10    | Low life beside reservation and energy shield; its spur's smalls feed low life.      |
| Familiars                           | Cloister    | where the border road meets the mid ring | 10    | Spell minions, the Cathedral's minions' near end.                                    |
| Deep Well / Glass Skin              | Cloister    | west spoke, outer                        | 7-8   | Mana and energy shield.                                                              |
| Wandwork                            | Cloister    | west spoke, outer                        | 9     | Wand spells, the first wand home on the west.                                        |
| new: fire's first rung              | Cloister    | west spoke, outer                        | 9     | Fire with cast speed and fire resistance: West's damage before the rim.              |
| Mind Bulwark (K)                    | Cloister    | west spoke at the mid ring               | 9     | Mana as the defence.                                                                 |
| Quiet Pulse                         | Cloister    | the mid ring's west stretch              | 10    | Life and regeneration.                                                               |
| Spirit Ward                         | Cloister    | the mid ring's west stretch              | 10    | Spell block with a shield (kept or sent to the Cathedral in the notables pass).      |
| Flashpoint                          | Cloister    | the mid ring's west stretch              | 11    | Fire's second rung, with spell crit: moves west to join fire.                        |
| Composure                           | Cloister    | west spoke past the mid ring             | 10    | Energy shield and casting through stuns.                                             |
| Living Verse                        | Cloister    | west spoke past the mid ring             | 10    | Spells with life.                                                                    |
| Mana Tap                            | Lantern     | the rim ring's west stretch              | 12    | Mana leech.                                                                          |
| Bright Wand                         | Lantern     | the rim ring's west stretch              | 12    | Elemental wand attacks and wand spells: the wands' west home, beside fire.           |
| Cinder                              | Lantern     | the rim ring at the west spoke           | 13    | Fire's ignite payoff.                                                                |
| new: fire's payoff                  | Lantern     | out from the rim ring                    | 14    | Fire penetration with a rule.                                                        |
| Bad Company                         | Lantern     | out from the rim ring by the border      | 13    | Minions with curses, the second minion home.                                         |
| High Veil                           | Lantern     | the rim ring's west vertex               | 13    | Energy shield and resistances.                                                       |
| Siphon                              | Scriptorium | east spoke, outer                        | 7-8   | Energy shield leech and on hit: the region's sustain, near home on the offence side. |
| Deft Wand                           | Scriptorium | east spoke, outer                        | 8     | Wand attacks, the first wand on the east, past step 8.                               |
| Thunderhead                         | Scriptorium | east spoke, outer                        | 9     | Lightning's first rung.                                                              |
| Frugal                              | Scriptorium | east spoke, outer                        | 9     | Mana cost.                                                                           |
| Withering / Hexwright               | Scriptorium | the Knife's border road, side rooms      | 9     | Chaos over time and curses, beside the Knife's chaos spells and curses.              |
| Sharp Tongue                        | Scriptorium | the Knife's border road                  | 10    | Dagger spells beside the Knife's.                                                    |
| Flashes of Insight                  | Scriptorium | the Knife's border road                  | 10    | Insight, with the Knife's Cold Read and Glint across the border.                     |
| Mana Bastion (K)                    | Scriptorium | east spoke at the mid ring               | 9     | Mana as the defence, opposite Mind Bulwark.                                          |
| Live Current                        | Scriptorium | the mid ring's east stretch              | 10    | Lightning's second rung (shock).                                                     |
| Keen Verse                          | Scriptorium | the mid ring's east stretch              | 11    | Spell crit multiplier.                                                               |
| new: channelling's second home      | Scriptorium | the mid ring's east stretch              | 11    | With Steady Stream on the axis.                                                      |
| Wand Volley                         | Gallery     | east spoke past the mid ring             | 10    | Wand attack speed.                                                                   |
| Mist Walk                           | Gallery     | the rim ring's east stretch              | 12    | Dodge, beside the Knife's dodge.                                                     |
| new: lightning's payoff             | Gallery     | out from the rim ring                    | 14    | Lightning penetration with a rule.                                                   |
| Pinpoint / Needlework               | Gallery     | out from the rim ring                    | 13-14 | Wand crit.                                                                           |
| new: projectiles' second home       | Gallery     | out from the rim ring                    | 13    | With Darting Bolts.                                                                  |
| Prism Ward                          | Column      | the mid ring at the axis                 | 9     | Resistances.                                                                         |
| Hoarfrost                           | Column      | the mid ring at the axis                 | 10    | Cold's first rung.                                                                   |
| new: fire and cold                  | Column      | the mid ring's west half                 | 10    | The two-element path between fire's road and the axis.                               |
| Broad Weave / Darting Bolts         | Column      | the mid ring, both sides of the axis     | 10    | Area and projectiles.                                                                |
| Lingering                           | Column      | out from the mid ring                    | 11    | Duration and damage over time.                                                       |
| Shatter                             | Belfry      | the rim ring at the axis                 | 12    | Cold's second rung (freeze).                                                         |
| Piercing Word / Harsh Weather       | Belfry      | the rim ring at the axis                 | 12-13 | Any element: penetration, ailments.                                                  |
| Steady Stream                       | Belfry      | the rim ring                             | 13    | Channelling.                                                                         |
| Long Chant                          | Belfry      | the rim ring                             | 13    | Spells with mana regeneration.                                                       |
| Cold Light                          | Belfry      | out from the rim ring                    | 14    | Cold's payoff, with spell crit.                                                      |
| new: area's second home             | Belfry      | out from the rim ring                    | 13    | With Broad Weave.                                                                    |
| Prismatic Balance, Fever Pitch (K)  | Belfry      | tips past the rim ring                   | 15    | The element keystones, the farthest.                                                 |
| Snare Line                          | cut         |                                          |       | Traps are the Knife's and the Bow's.                                                 |
| Deft Wand's old spot, the old roads | cut         |                                          |       | Replaced by the skeleton's roads.                                                    |

**Elements:** fire west (first rung 9, Flashpoint 11, Cinder 13, payoff 14), cold on the axis (Hoarfrost 10, Shatter 12,
Cold Light 14), lightning east (Thunderhead 9, Live Current 10, payoff 14); each spread along one road, so an elemental
caster picks a direction. The fire-and-cold notable on the mid ring's west half, Piercing Word, Harsh Weather and the
two keystones serve a caster who mixes elements.

**Wands:** wand spells west (Wandwork 9, Bright Wand 12), wand attacks east (Deft Wand 8, Wand Volley 10, Pinpoint and
Needlework 13-14); Bright Wand serves both. **Strays resolved:** channelling (Steady Stream plus a new east home),
area and projectiles (each a second home at the rim), wand spells (Wandwork and Bright Wand), insight (Flashes of
Insight beside the Knife's two insight notables), low life (Pain Conduit's spur), traps (cut).

## 6. Size

About 64 notables: 49 kept (Snare Line cut), about 7 new named above, and about 8 more in the notables pass (rule
benders and second notables in existing clusters, as the Knife's). Node count kept about level (about 250) by thinning
roads and trimming long clusters, as in the Knife.

## 7. Keystones

Mind Bulwark (west, mid ring, about 9), Mana Bastion (east, mid ring, about 9), Pain Conduit (west border road, about
10), Prismatic Balance and Fever Pitch (the axis past the rim, about 15). All at 8 or more.

## 8. Sustain (attrition)

The Spire's own voice for sustain: energy shield leech and energy shield on hit (Siphon, near home east), mana leech
(Mana Tap), life on spell hit, mana on kill, flasks as the generic layer near home (Draught). About as much as today in
total; the numbers wait for the flask stats.

## 9. Open

- Spirit Ward (spell block with a shield): kept in the Spire or sent to the Cathedral's shields; the notables pass decides.
- Minions stay in the Spire at the west only (two homes), facing the Cathedral's.
- Insight is kept to one Spire home plus the Knife's two across the border; it grows toward charge play only if the
  notables pass finds a reason.

## 10. Structure (built 2026-10-31, before the notables pass)

Written by `scripts/passives/rework/spire-gen.ts` into `src/data/passives/spire/`; the render is `R-spire-structure.png`
(no area names). Clusters keep today's lines except the start's two sides, the paths and First Light; the new clusters
carry first-draft lines. The notables pass rewrites lines.

- Changed from §5 while laying out: Wandwork and Deft Wand hang from the spokes' second outer node (steps 8 and 9, past
  the first ring); Frugal takes Deft Wand's place off the east spoke's first outer node; Draught hangs from the west path's
  second node so its notable sits at step 5; Lingering hangs on from Hoarfrost along the axis; Withering on from
  Hexwright; the channelling home (Drone) sits off the mid ring's east stretch.
- Measured: no notable within 4 steps. Within 8 steps, 8 behind the west exit and 6 behind the east (the Knife: 7 and 6).
  By bands of steps 1-4, 5-8, 9-12, 13-16, 17-20 the Spire reaches 0, 13, 42, 48, 69 notables (the Knife 0, 11, 46, 51,
  53). Keystones at 10 (Mind Bulwark, Mana Bastion), 12 (Pain Conduit), 13 and later.
- No internal crossings; the remaining crossings are against the Cathedral, which has not moved yet.
