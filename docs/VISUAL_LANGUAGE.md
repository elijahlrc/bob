# Visual language of skills

One colour says what a skill does to the enemy; one shape says how it gets there. Everything is defined in
`src/calc/skillLook.ts` (pure data, shared by the map renderer, the skill bar and the Codex) and drawn by
`src/render/styles/grim/skillFx.ts`. The Codex has a "Skill looks" tab with the same legend, and the title screen has a
**Skill gallery**: one skill at a time in front of three training dummies (N, P and a list to move around, 0.25× to slow it).

## Colour: damage type

| Type      | Colour   |
| --------- | -------- |
| Physical  | bone     |
| Lightning | violet   |
| Cold      | ice blue |
| Fire      | orange   |
| Chaos     | green    |

The colour comes from the damage the skill deals at that moment (supports that add or convert damage change it). Hit
sparks, projectile trails, rings, zones and numbers all use it. It is the type with the most damage in total (an element
wins a tie with physical, so half converted is the element); a skill that never hits (Searing Lance) is the type of its
damage over time, whatever its gear adds (`profileElement`, `src/calc/skillLook.ts`). `npm run fxaudit` plays every gem
and lists the ones whose pictures, damage and description disagree (`--added lightning` puts a little added damage on the
gear).

## Shape: delivery

- **Attacks are sharp.** A sweep is a crescent through the arc it covers, with the covered ground tinted. A single-target
  melee blow is a streak from the attacker to the enemy. A ranged attack is a thin streak with a flash at the weapon.
- **Spells are round.** Every spell opens a rune circle at the caster as it winds up, then sends an orb, forked arcs, a
  jagged beam, or a ring (nova), or drops a ring and flash where it lands (blast).
- **Areas are rings that grow** from where they go off (every blast, slam and explosion); physical ones crack the floor.
- **Lasting zones stay.** A ring of ticks shows where a zone will land, then a patch stays on the ground with marks that
  show the element (embers rise, crystals glint, lightning crackles, chaos swirls, dust ticks). A strip is a band with marks
  flowing along it.
- **Deployables** keep their shape (totem pillar with a glowing top, brand sigil, trap plate set with teeth, mine) and glow in their element.
  Putting one down is shown, not cast: while the skill winds up the thing is held up in the hand, glowing brighter, with a ring closing on the target where it will go; then a trap or a mine is thrown from the hand in an arc, with a trail and a glow, and lands in a puff of
  dust; a totem or a brand comes down from above. A ring closes on a trap or a mine while it arms, and a ready one marks the ground that sets
  it off (a ring of ticks). A mine that has been set off flickers with a white ring closing on it until it goes. When a trap springs or a
  mine goes, its casing bursts into spikes and a line runs to the enemy it fires at. A shot from a deployable never draws the cast rune
  round the character (the `use` event carries `via: 'deployed'`).
- **Lasting fields** (what a skill leaves standing: `w.fields` in the sim, drawn by `fieldMarks` in `skillFx.ts`) each have a shape that
  says what they are: ground (consecrated gold, chilling ice, caustic green) is a patch with its marks; a spore pod is a green bulb; a
  frost crystal is a standing shard that flickers before it bursts; a storm is a ring of crackling ticks about the character; a frost orb
  hangs over the character and sheds motes; a zap is a bead of lightning; a trail is a band with motes drifting up it; an illusion is a pale
  figure in a ring; a bladestorm is a ring with two blades going round it; a geyser is a pit throwing embers; smoke is a grey cloud.
- **A wall of ice** is a block of ice on each tile it holds shut (the exact ground it blocks, drawn tile by tile): it rises out of the ground
  when raised, glints while it stands and sinks as it melts. The band it stands on flashes when it goes up.

## Areas: one clean outline

Every area, the player's and the monsters', is drawn the same way (`areaFx.ts`; the audit is [VFX-AUDIT.md](VFX-AUDIT.md)): the
**exact ground it covers**, outlined by a dark line under a colour line (so it reads on a pale floor and a dark one), held at full strength for
about half a second, and a bright front that runs out to the edge. The line is fine (40% of its old width) and there is **no fill**: the skill's motif, below, is what is seen inside it. The colour is the damage type. A circle is the ground
ellipse of the view; a wedge (a melee sweep) and a lane (a beam, a strip, a wall) are drawn corner by corner.

- The player's `explode` events (blasts, slams, novas, a zone's pulse) draw a circle, or the band of a strip (`strip` on the event).
  An event under 0.6 of a tile is a spark and only rings.
- **What the area is made of plays inside the outline.** Each `explode` of a skill's own carries the skill (`skill`, and `pulse` on a later pulse of a
  zone), and the skill has a **motif** (`src/calc/areaLook.ts`, drawn by `areaMotifs.ts`): a slam cracks the floor, runs a ring of dust out and
  throws rubble (Quake Blow adds waves of broken ground; Faultline, Anvil Drop); spears, rock or ice burst up from the ground, in a rolling line down a strip (Spear Burst,
  Rumble Trap, Rime Spires); a frost burst spreads a frosted disc, grows crystals and lifts mist (Sudden Frost; Frost Trap freezes the air with a front
  of frost; Frost Sunder runs three rings of shards; Frost Ring a ring of shards that frosts the ground behind it; Blizzard Ring turns arms of white wind); fire
  stands up in tongues round the edge and a column in the middle (Blaze Trap, Ember Burst), a bolt of fire is a ball that swells and bursts (Flame Bolt),
  a nova of fire is a ring of tongues (Furnace Roar), a splitting slam is rivers of molten rock in dark cracks (Magma Crack), molten metal is flung out as blobs
  (Slag Lob, Slag Blow), a corpse bursts into a column (Pyre Burst); **lightning is only for lightning skills**: a bolt comes down from the sky onto the
  spot (Skyfall), several bolts (Stormcharge), a thin spire (Spire Trap), arcs run along the ground (Static Ring and the other rings); rot rises as a green
  cloud (Creeping Plague; Ruin Ritual lights a rune circle under it); consecrated ground is a column of golden light with rays; shrapnel flies out in
  trailing fragments; a Jaws Trap closes two rows of iron teeth; Rain of Steel's blades come down and stand in the ground; a spin or sweep draws a
  crescent right round the caster. Falling missiles (Arrow Shower, Ember Hail, Ember Downpour, Venom Shower) are the motif: arrows with a puff of dust,
  burning rocks that leave a small flame. A beam or a stream is drawn as what it is made of (flame tongues, a drifting green breath, a front of force,
  rock rolling down the band); only lightning keeps the jagged bolt. A skill with no motif of its own gets one by its delivery and element, and a test
  checks that every skill that lands an area has its own. A later pulse of a zone draws a few accents of the motif, not the whole.
- Melee sweeps draw their wedge on the ground, under the crescent; beams their lane, to the width the beam hurts (`width` on the event).
- Warcries and shouts draw their radius (the `cry` event).
- Lasting zones and strips keep the same dark-and-colour edge while they last.
- Effects are drawn to be stacked: a build casts one skill many times at once. The flash lights that blasts add are dimmed by how many are alive and
  stop at four (`flash` in `index.ts`), and a motif is thin and faint rather than large and white (Spire Trap).
- Monsters' warnings (telegraphs, the old slam rings, shaped pattern blasts) fill from the start of the blow, with the same dark line, in the colour of
  the damage they will do.

## Projectiles: a body you can name

Every projectile is drawn by `projectileFx.ts`: an **attack flies as an arrow** (shaft, bright head, fletching, dark rim), a **spell as an orb**
(coloured core, white heart, a halo that breathes); a larger slow orb throws arcs; and the odd flights are themselves: a hexagonal **shield**, a turning
**tornado**, a **skull**, a mirrored pair of arrows. Each rides a hand's height over the floor with a **shadow where it truly is** and leaves a tapered
**trail** (not a spray of particles). A flight the description calls a lob (a mortar shell, the arrow of a nova) **rises and falls**; only the picture
lifts, the sim's flight is flat. What a monster sends wears a **red rim**. Things that fall (a rain of arrows, a hail of embers: `FALLING_SKILLS` in
`skillLook.ts`) are drawn coming down and splashing where they land.

## Upkeep skills (no damage, no element)

| Skill  | Look                                                                      |
| ------ | ------------------------------------------------------------------------- |
| Buff   | gold ring and rising motes; a gold mote circles you while it lasts        |
| Warcry | wide orange ring and a shake                                              |
| Guard  | steel hexagonal shield                                                    |
| Curse  | violet rune under the target; a violet sigil over its head while it lasts |
| Blink  | blue-white streak from start to landing                                   |
| Summon | teal circle; each minion in a teal ring, with a life bar when hurt        |
| Aura   | slow gold ring at your feet; a herald's ring is spiked, in its element    |

## On the enemy: what has been done to it

What a skill leaves on an enemy is drawn on the enemy, in the marks module (`render/style/marks.ts`, `statusMarks.ts`), from state, so it lasts as long as the
thing does. Curses are the violet sigils over the head; ailments tint the body and shed their particles; the rest is a **row of tiny pips over the life bar**
(smaller than an affix stone, no gold setting, an ink rim, blinking in the last half second):

- **Statuses**, one pip each: slowed or held (hinder and maim a blue and a red down-arrow, immobilised a stone block, shackled a fading ring, ensnared a cross), blinded
  (an eye), unnerved (a bang), exposed (a cracked ring in the element), overpowered (a hollow plate), withered (a sprig), scarred (a slash), frostbitten (a frost star),
  venomed (a drop), doomed (a skull). Stacks are dots under the glyph.
- **A skill's damage over time** (a rot, a burn, Decay), one pip for each damage type in its element's colour (a slash, a bolt, a shard, a flame, a drop), the layers as dots, with a
  thin spray of that element's particles on the body.
- **Impales** (Skewer): a short spear stuck in the body for each one held (five at most); a spear driven in stabs, and a payout flings bone-pale spikes from the body.

Short effects from events: `impale` (`stuck` or `paid`), `shatter` (a frozen body bursts into ice shards and leaves no bones), `spread` (an arc in the element's colour from the
enemy that carried an ailment or a debuff to the one that caught it), `kindle` (a kill set the enemies about it burning: the ground it reaches, outlined, flames standing
up inside). Minions of a burning pack carry flames and a thin ring at the reach of their burn.

## Keeping it complete

`skillLook.test.ts` checks that every gem lands on a delivery and a colour, that every delivery and every element is used,
and `skillFx.test.ts` checks that every gem queues an effect when it is used or when its blow lands. A new behaviour kind
fails to compile until `deliveryOf` handles it.

## Sim events the effects use

`use` (a skill starts), `swing` and `thrust` (a melee blow lands), `explode` (a circle, or a strip; maybe with things falling), `beam` (with its
width), `cry` (a shout's radius), `chain`, `buff`, `hex`, `summon`, `blink`, `deploy` (put down, or ended), `sprung` (a trap or a mine goes off), `impale`, `shatter`, `spread`, `kindle` (above); zones, lasting fields, deployables, minions, auras, buffs and curses are drawn from world state every frame.
