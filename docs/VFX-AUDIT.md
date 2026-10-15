# Bob — Audit of the readability of the ability effects

Status: **pass 1 done 2026-10-12** (areas and projectiles, renderer-first; one small set of new sim events). Pass 2 is the list at the end:
each item changes how a skill _behaves_ or needs the user's eye, so none of them was done silently.

## Why

The user asked for three things: every area (the player's too) shown by **clean lines** that say what ground was hit; **clearer
projectiles** (they get lost in the particles, are sometimes not there at all, or do not fly the way the description says); and an
audit of that readability across all the effects, the player's and the monsters'.

## Method

1. **Inventory by running everything.** `scripts/vfx/inventory.ts` puts each of the 203 gallery skills in the training arena for eight seconds and
   records what the sim hands the renderer: area events and their radii, beams, chains, swings, thrusts, every projectile's
   spawn point, speed, life, straightness and distance flown, zones and deployables
   (`npx tsx scripts/vfx/inventory.ts --json out.json`).
2. **Looking.** The same skills in the dev build (`window.__bob.startGallery()`, `window.__zoom = 4` closes in; `window.__dev.step(n)` advances frames
   even in a hidden tab), one representative of every delivery before and after.
3. **Reading the draw code** of every effect: `skillFx.ts` (the player's skills and every `explode`), `projectileFx.ts` (new), the telegraphs and
   slams in `index.ts`, `encounterFx.ts` (shaped monster blasts), `bossFx.ts`.

## What was wrong (pass 1 findings)

| #   | Finding                                                                                                                                                                                                                          | Effect on the reader                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | An `explode` (about 30 sim sites, the player's and the monsters') drew a ring that **grew from 0.2 r to r while its alpha went to zero**: it was at the true radius only when it was invisible.                                  | You could not tell what a blast covered.        |
| 2   | A strip's pulse (a wall, a stream) was drawn as a **circle** at the strip's middle, though the ground it hurts is a band.                                                                                                        | The outline lied about the shape.               |
| 3   | A beam was a one-pixel line: the event had no width, so the band it hurts was never drawn. A melee sweep drew a crescent in the air, nothing on the ground.                                                                      | Reach and width unreadable.                     |
| 4   | **Warcries and other shouts sent no event at all**; the area they affect (a radius of 5 to 8 tiles) was never shown.                                                                                                             | A rally with no visible reach.                  |
| 5   | The monsters had three styles of warning: the telegraphs (damage-coloured), the shaped pattern blasts (the best: dark wash, dark outline, coloured line) and the old slam rings (always red, thin).                              | Three lines for the same idea.                  |
| 6   | Projectiles were an image **at ground level** over an additive glow, with 25 particles a second (fire: two flames and smoke every 25 ms): a bright blob that flew along the floor. A physical arrow had a 25% glow and no light. | Lost in the particles; "no projectile visible". |
| 7   | Rain skills (Arrow Shower, Ember Hail, Rain of Steel, Ember Downpour, Venom Shower) drew a ring and **nothing falling**.                                                                                                         | The skill's missiles were never seen.           |
| 8   | A mortar shell or a nova arrow ("goes up and comes down") flew flat along the ground.                                                                                                                                            | The trajectory did not match the description.   |
| 9   | A monster's projectile looked like the character's own.                                                                                                                                                                          | A threat did not stand out.                     |

## What pass 1 did

One convention for an area (`areaFx.ts`, documented in [VISUAL_LANGUAGE.md](VISUAL_LANGUAGE.md)): the exact ground, a **dark line under a colour line**
(it reads on a pale floor and a dark one), held at full strength for half a second, a wash that fades inside it, and a bright front that runs
out to the edge. A circle is the ground ellipse; a wedge and a lane are drawn corner by corner. It is used for:

- every `explode` of a size worth reading (a spark under 0.6 of a tile only rings), a strip's pulse as its band;
- melee sweeps (the wedge on the ground, under the crescent) and beams (the lane, to their true width);
- warcries and shouts (a new `cry` event carries the radius), the lasting zones and strips on the ground, the monsters' telegraphs and slam warnings (now in the
  colour of their damage, with the dark line).

Projectiles (`projectileFx.ts`): an attack flies as an **arrow** (shaft, head, fletching, dark rim), a spell as an **orb** (coloured core, white heart,
halo that breathes), a larger slow orb has jumping arcs, and the odd flights are themselves (a hexagonal shield, a turning tornado, a skull, a mirrored pair).
Every one rides a hand's height over the floor with a **shadow where it truly is**, a **tapered trail** in place of the particle spray (the particles that remain are
one in ten), and a lob (mortar shell, nova arrow) **rises and falls**. A monster's projectiles wear a red rim.
Rain skills draw their missiles falling and splashing (a `fall` field on the area event, from `FALLING_SKILLS` in `skillLook.ts`).

The sim's rules are untouched: `explode` gained an optional `strip` and `fall`, `beam` an optional `width`, and there is a new `cry` event. Nothing that decides a hit changed.

## What is left (pass 2: each needs a decision)

Ranked by how much it matters to the reader.

1. **Lobs are too quick to read.** Every projectile flies at 12 tiles a second; a mortar shell lands 1 to 5 tiles away in 0.1 to 0.4 s, so
   the rise and fall are there but over before the eye takes them. Slowing mortar and nova shells to about two thirds would make the arc visible, and
   delays the damage by up to a tenth of a second. _Sim change; the numbers shift slightly._
2. **Frost Lance changes form at 48 tiles a second** and crosses the whole room in half a second (its life), a streak that is hard to follow. Its
   fast form could keep the trail only. _Render or a speed cap._
3. **Some skills show no body at all:** the chains (Arc, Storm Arrow, Tempest Sigil) are bolts that jump between enemies at once (readable, but not a projectile), and
   the **strikes that carry bolts** (Bolt Cleave, Prime Splash, Rime Splinter: a strike, then projectiles) draw the bolts but nothing says they came from the blow.
4. **A sweep reaches farther than it is drawn.** The sim hits anything within the radius plus the enemy's body plus 0.4 of a tile; the wedge shows the radius.
   The honest fix is to draw the reach, or to cut the slack. _Sim or render, and a balance question._
5. **The monsters' own flights could not be looked at in the gallery** (it has no monsters' skills). They use the same bodies now; a pass in a real map
   (an archer, a spitter, a boulder-thrower) is the next thing to look at.
6. **Auras and heralds draw a ring at the feet that is not their area.** Auras have no area, so that ring is only a sign; heralds do strike what is near.
7. **Particle bursts** at a hit and a death are still large next to the new lines (a fire hit throws 6 flames). They no longer cover an area's edge, but a pass over their size
   is due.

## Tools

- `npx tsx scripts/vfx/inventory.ts` as above.
- Dev builds: `window.__zoom` (set it, then resize) closes the camera in on an effect; `window.__bob` is the controller; `window.__dev.step(n)` advances frames.
- Tests: `src/sim/vfxEvents.test.ts` (the sim says what an area is), `src/render/styles/grim/areaFx.test.ts` (shapes, bodies, lobs), and `skillFx.test.ts`
  (every shape of area is outlined, drawn and gone again).

## Pass 3: what an area is made of (2026-10-14)

Finding: after pass 1 every area was the same outline, and the only thing that told one from another was its colour. Lightning-dtype areas
also threw the same violet bolt sparks, and every beam, whatever it was made of, was drawn as a jagged bolt of lightning in its colour. So a plague, a
slam and a frost burst were the same ring, and a stream of fire was a recoloured lightning bolt.

Fix: each area's `explode` carries the skill that made it (`skill`; `pulse` on a later pulse of a zone) and each skill has a **motif** that plays inside
the outline (`src/calc/areaLook.ts` names them and says in words what each looks like; `src/render/styles/grim/areaMotifs.ts` draws them; the
table and the list of motifs are in [VISUAL_LANGUAGE.md](VISUAL_LANGUAGE.md)). 33 motifs, among them: quake, spikes (bone, stone, ice), frost bloom, ice
nova, ice waves, flames, geyser, fireball, lava fissures, molten splat, lightning strike and storm and pillar and crackle, plague cloud, holy column,
shrapnel, jaws, steel blades, a sweep of the caster. A skill with no motif of its own takes one by its delivery and element. Beams
and streams are drawn as what they are (fire, rot, force, rock); lightning alone keeps the bolt. The coverage tests are `src/calc/areaLook.test.ts`
(every skill that lands an area has its own motif; lightning motifs only for lightning skills, frost for cold, and so on) and
`areaMotifs.test.ts` (every motif draws at every moment of its life, as a circle, a strip and a light pulse).

Not changed: the monsters' own areas (they keep the pass-1 telegraphs and the old landing), the heralds (no skill on their explosions) and the
upkeep skills.

## Pass 4: many at once (2026-10-15)

Why: a build casts one skill over and over (multicast, echo, a belt of traps, a pack of mines), so what matters is how an effect looks
when six of them overlap, not one. The user's first report was Spire Trap: large parts of the screen went white when it was multicast.

### Method

`scripts/vfx/stack-probe.js` (paste it into the console of a dev build, or `await import('/scripts/vfx/stack-probe.js')`, then
`await stackProbe({ skill: 'spireTrap', dtype: 1 })`): in the gallery it fires N synthetic `explode` events a few tiles from the character, steps frame by
frame, reads the canvas back and reports the peak share of the screen that is **visibly brighter than before** (`lit`) and the share that is **near white**
(`white`). Median of three runs, with the noise of an empty run (torch flicker, about 0.3%) taken off. It can also strip the `flash()` lights from the run
(`noLights: true`) to see what they add. Every skill's `explode` goes through the motif of its kind, so one skill per motif stands for all that share it.

### Spire Trap (done)

It was a flat-topped rectangle of near-white 120 px tall, with a big flash, ten bolt sparks and seven arcs. It is now a thin spire that tapers to a point and fades
out upward (three nested layers, each shorter than the last), with a smaller flash, fewer sparks and fainter arcs.

| Spire Trap, at once | before: lit / white | after: lit / white |
| ------------------- | ------------------- | ------------------ |
| 1                   | about 1.1 / 0.07    | 0.5 / 0.02         |
| 6                   | about 9.9 / 0.75    | 4.3 / 0.28         |

About 55 to 60% less, as asked. The trap's own spring (`sprung`: a flash, sparks, eight spike lines) is drawn on top of this and is not touched; it is a shared
item below.

### What stacks badly (6 at once, share of the screen lit at peak; one alone in brackets)

| Motif (skill measured)                                                    | Six at once     | One   | Near white (6) |
| ------------------------------------------------------------------------- | --------------- | ----- | -------------- |
| geyser (Pyre Burst)                                                       | 9.3             | (1.1) | 0.1            |
| fire nova (Furnace Roar)                                                  | 9.2             | (1.1) | 0.1            |
| storm (Stormcharge)                                                       | 9.0             | (1.4) | 0.6            |
| strike (Skyfall)                                                          | 8.9             | (1.2) | 0.6            |
| flames (Blaze Trap)                                                       | 7.6             | (0.9) | 0.1            |
| shrapnel (Shrapnel Trap)                                                  | 7.4             | (1.0) | 0.2            |
| frost bloom (Sudden Frost)                                                | 7.3             | (1.0) | 0.5            |
| freeze (Frost Trap)                                                       | 7.3             | (1.0) | 0.5            |
| fireball (Flame Bolt)                                                     | 6.5             | (1.0) | 0.1            |
| holy (Cleansing Blaze)                                                    | 6.1             | (0.8) | 0.2            |
| ice shatter (Hoarfrost Mote)                                              | 5.9             | (0.9) | 0.4            |
| lava (Magma Crack)                                                        | 5.9             | (0.7) | 0.1            |
| splat (Slag Lob)                                                          | 5.2             | (0.8) | 0.1            |
| Spire Trap (after)                                                        | 4.3             | (0.8) | 0.3            |
| a mine going off                                                          | 5.0             | (0.8) | 0.3            |
| an area with no skill, fire / cold / lightning (monsters' landings, etc.) | 8.0 / 7.3 / 7.2 | (0.9) | up to 0.5      |
| a trap going off                                                          | 2.8             | (0.6) | 0.2            |
| a chain, six at once                                                      | 2.6             | (0.4) | 0.1            |
| a beam, six at once                                                       | 2.3             | (0.5) | 0.1            |

Quiet (1.2 or less with six at once, close to the noise): quake, quake wave, bone, stone and ice spikes, ice waves, ice nova, whirling frost, flame
line, plague cloud, ruin ritual, jaws, drain, steel blades, sweep, whirling blades, falling missiles, the lightning crackles (nova and line), and the
hit sparks and melee sweeps measured (0.4 to 1.3).

### Findings

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                           | Effect on the reader                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | **The loud ones are loud because of `flash()`**, the point light every flashy motif adds (about 100 to 190 px across, intensity 1.6, fading in 0.2 to 0.6 s). Lights add and nothing caps them. Taking just those lights out of six stacked blasts takes the lit share from 9.0 to 0.8 (geyser), 8.9 to 1.5 (strike), 6.9 to 0.9 (frost bloom), 7.1 to 0.9 (shrapnel). One alone is fine; six wash the floor out. | Multicast turns the floor into a pale sheet: the effects themselves cannot be seen. |
| 2   | Every motif without a flash stays at 1.2 or less however many there are (rows above). The skill-less landings (`index.ts`, an `explode` with no skill) have their own flash, 1.8 to 2.2 wide, and behave like the loud motifs.                                                                                                                                                                                    | The damage is in one shared call, not in the drawing of each motif.                 |
| 3   | Lightning is the whitest: Skyfall and Stormcharge also fill a white ground ellipse at 0.6 alpha under every bolt, and every `glow()` has a 0.95 white core. Near-white is 0.6% of the screen with six, against 0.1% for fire.                                                                                                                                                                                     | White blocks hide the enemies standing in them.                                     |
| 4   | A mine (spring burst: 8 spikes, 8 sparks, a 1.4 flash) is nearly as loud as the loud motifs, and a trap's own flash and spikes in `sprung()` add to whatever its area draws.                                                                                                                                                                                                                                      | Traps and mines are the likeliest things to be stacked in play, and they go on top. |
| 5   | Particle counts, shakes and the monsters' own areas (`encounterFx.ts`, `bossFx.ts`) were not measured. The shake keeps the largest of several, so it does not add up.                                                                                                                                                                                                                                             | Open.                                                                               |

### The light cap (done)

`flash()` in `index.ts` now dims each new flash light by the ones still alive (`1 / (1 + 0.5 n)` on intensity, its square root on radius) and gives no light
at all once four are alive (the pop particle still shows). One cast is exactly as before. Six at once, measured in the same view with the cap on and off
(`FLASH_LIGHTS`, `FLASH_CROWDING`):

| Six at once       | Before | After |
| ----------------- | ------ | ----- |
| Pyre Burst        | 10.5   | 2.9   |
| Furnace Roar      | 10.5   | 2.9   |
| Stormcharge       | 11.4   | 5.1   |
| Skyfall           | 11.3   | 4.0   |
| Blaze Trap        | 8.8    | 2.6   |
| Shrapnel Trap     | 9.1    | 2.7   |
| Sudden Frost      | 9.0    | 2.6   |
| Flame Bolt        | 7.6    | 2.4   |
| Cleansing Blaze   | 7.4    | 2.2   |
| Magma Crack       | 6.1    | 1.8   |
| Spire Trap        | 5.7    | 2.2   |
| Frost Ring (calm) | 1.1    | 1.1   |

The floor and the figures on it stay readable and each effect's own drawing shows. Still bright with six at once: Stormcharge and Skyfall (the white ellipse and
the white-cored bolts themselves) and a mine's spike burst (below).

### What is left (each needs a decision)

1. **A crowding rule for the motifs.** `MotifArea.light` already means "draw the weaker version". When more than about four areas of one skill are
   alive within half a second, draw the extras as `light`. It cuts particles and arcs as well, which the cap above leaves alone. Needs a count kept in
   `SkillFx`.
2. **Strike and storm: lose the white ellipse** under each bolt, or cut it to a quarter. A visible change to those two.
3. **Mines and traps:** shrink the spring burst of a mine (flash 1.4 to about 1, sparks 8 to 4) so it matches a trap. A visible change.
4. **Measure the rest:** the monsters' own areas and the bosses stacked (a pack of casters), particle counts, and the minion and totem hits.

Nothing here changes the sim.
