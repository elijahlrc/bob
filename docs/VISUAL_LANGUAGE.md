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
sparks, projectile trails, rings, zones and numbers all use it.

## Shape: delivery

- **Attacks are sharp.** A sweep is a crescent through the arc it covers, with the covered ground tinted. A single-target
  melee blow is a streak from the attacker to the enemy. A ranged attack is a thin streak with a flash at the weapon.
- **Spells are round.** Every spell opens a rune circle at the caster as it winds up, then sends an orb, forked arcs, a
  jagged beam, or a ring (nova), or drops a ring and flash where it lands (blast).
- **Areas are rings that grow** from where they go off (every blast, slam and explosion); physical ones crack the floor.
- **Lasting zones stay.** A ring of ticks shows where a zone will land, then a patch stays on the ground with marks that
  show the element (embers rise, crystals glint, lightning crackles, chaos swirls, dust ticks). A strip is a band with marks
  flowing along it.
- **Deployables** keep their shape (totem pillar with a glowing top, brand sigil, trap plate, mine) and glow in their element.

## Areas: one clean outline

Every area, the player's and the monsters', is drawn the same way (`areaFx.ts`; the audit is [VFX-AUDIT.md](VFX-AUDIT.md)): the
**exact ground it covers**, outlined by a dark line under a colour line (so it reads on a pale floor and a dark one), held at full strength for
about half a second, a wash that fades inside it and a bright front that runs out to the edge. The colour is the damage type. A circle is the ground
ellipse of the view; a wedge (a melee sweep) and a lane (a beam, a strip, a wall) are drawn corner by corner.

- The player's `explode` events (blasts, slams, novas, a zone's pulse) draw a circle, or the band of a strip (`strip` on the event).
  An event under 0.6 of a tile is a spark and only rings.
- Melee sweeps draw their wedge on the ground, under the crescent; beams their lane, to the width the beam hurts (`width` on the event).
- Warcries and shouts draw their radius (the `cry` event).
- Lasting zones and strips keep the same dark-and-colour edge while they last.
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

## Keeping it complete

`skillLook.test.ts` checks that every gem lands on a delivery and a colour, that every delivery and every element is used,
and `skillFx.test.ts` checks that every gem queues an effect when it is used or when its blow lands. A new behaviour kind
fails to compile until `deliveryOf` handles it.

## Sim events the effects use

`use` (a skill starts), `swing` and `thrust` (a melee blow lands), `explode` (a circle, or a strip; maybe with things falling), `beam` (with its
width), `cry` (a shout's radius), `chain`, `buff`, `hex`, `summon`, `blink`, `deploy`; zones, deployables, minions, auras, buffs and curses are drawn from world state every frame.
