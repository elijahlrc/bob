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
