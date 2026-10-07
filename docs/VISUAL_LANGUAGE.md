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

`use` (a skill starts), `swing` and `thrust` (a melee blow lands), `explode`, `beam`, `chain`, `buff`, `hex`, `summon`,
`blink`, `deploy`; zones, deployables, minions, auras, buffs and curses are drawn from world state every frame.
