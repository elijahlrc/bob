# Bob — Roster Plan: bodies, attacks and new enemies

Status: **plan, 2026-10-08. Nothing is built.** It follows [ENEMIES.md](ENEMIES.md) (built, E0 to E7), which fixed _who you
meet_ and _what the card says_. This plan is about what is still the same once you are in the map: how the enemies look,
how they attack, how they move and what they are made of. It reopens one decision of ENEMIES.md (6.1, "the body stays the posed skeleton") and says
so in section 3. Defaults are in section 13; the user can overturn any of them.

---

## 0. Summary

ENEMIES.md gave every faction a palette and a kit (a hood, a lantern, a swollen belly) on the four humanoid bodies. That
was not enough, and the reason is plain once the roster is drawn on one sheet
([before-sheet.svg](screenshots/roster/before-sheet.svg)):

1. **Looks (section 2.1).** `buildFigure` has two humanoid bodies: the hero (cloth torso, skin head) and everything else,
   which is a skull with eye sockets, three rib boxes and bone limbs. All **22** humanoid types, the 5 Ossuary types and **17
   that are not Ossuary**, are drawn on that skeleton. A Bursar is a skeleton in spectacles, a Shambler is a skeleton in
   rags, a Mana Wisp is a small skeleton with a glow. The palette changes the colour of the bone; it does not change what
   the shape is. Maps 1 to 5 are nothing but skeletons, and every faction except the Swarm, the Reliquary and the Kennel is
   skeletons throughout.
2. **Fighting (section 2.2).** Every attacking type has one of three attacks: one melee hit (19 types), one projectile (5)
   or one projectile spell (7). An Archer, a Spitter and a Slinger fire the same bolt; a Mage, a Hag, a Wailer, a Hexer and
   a Bursar cast the same bolt. 9 types have no ability at all and 11 more have only a passive rule. Every monster walks at
   the character by the same path code, so a pack arrives as a queue.
3. **Stats (section 2.4).** A type sets only life, damage, speed, attack time, reach and size. Armour, evasion, resistances,
   senses and movement are one function of the level for every monster, so a fire build and a chaos build meet the same
   monster, no type reaches between 1.5 and 6 tiles, and every monster walks the same way. Only about seven types differ
   in defence at all.
4. **Why the tests let it through (section 2.3).** The "no two types share a silhouette" test compares JSON, so two skeletons
   that differ by one hat pass it.

The plan has seven parts:

| Part                       | What                                                                                                                                                               | Section |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **Bodies**                 | Three body styles (bone, flesh, spectre), bone only for the Ossuary; one non-humanoid rig for every faction that has none; gaits and death animations by style     | 4       |
| **Attack shapes**          | A field on the type that picks how it attacks: sweep, slam, lob, volley, lance, nova. Each has a telegraph the character's auto-dodge can read                     | 5       |
| **Archetypes**             | Sixteen bundles of stats, defence, movement and engagement; every type is one plus its deviations, and a faction fields a spread                                   | 6.1     |
| **Defences**               | Resistances, immunities, energy shields and carapaces by type and faction, kept honest by a build matrix; each defence is paid for in life                         | 6.2     |
| **Movement and senses**    | Seventeen movement styles (momentum, skitter, cover, burrow, tether and more); different notice ranges, leashes and targets, including minion hunters              | 6.3–6.4 |
| **Tempo, state and packs** | Attack rhythms, life-threshold phases, and packs that flank, leapfrog, hold a line and rally                                                                       | 6.5–6.7 |
| **New enemies**            | Seven additions to existing factions (each on a rig that is not a person) and two new factions, the Drowned and the Emberborn, with the Briar as an optional third | 7       |
| **Measuring** (first!)     | A contact sheet, a silhouette-distance check that means something, and the "before" numbers                                                                        | 8       |

Order of work: tooling and the baseline (V0), body styles (V1), non-humanoid rigs (V2), attack shapes (V3), archetypes and
defences (V4), movement and senses (V5), tempo, state and packs (V6), additions (V7), the Drowned (V8), the Emberborn
(V9), integration (V10). V1 is the answer to the complaint as it stands, and can ship alone; V4 to V6 are the answer to
"more varied stats and movement".

---

## 1. Goals and principles

From the user, 2026-10-08:

- Much more diversity in combat experience **and** in visual presentation of the enemy pool.
- Many enemies "basically look like skeletons", even outside the Ossuary army.
- This probably means new enemies, new looks for some existing ones, and new combat behaviour for some existing ones.

Principles, in addition to those of ENEMIES.md 1:

- **Identity is the silhouette, then the motion, then the colour.** The map is drawn at a pixel zoom of 2, 1.5 or 1 (phones),
  with a figure about 48 units tall before its scale. A type has to be named from its outline and how it moves, with the
  colour switched off. The contact sheet is rendered at zoom 1 as well as larger, for that reason.
- **Bone is the Ossuary's.** Skulls, rib cages and bone limbs mean "Ossuary" and nothing else, so the player can learn it.
  Other factions are made of other things: flesh, cloth, plate, stone, shadow, fur, chitin, wood, flame.
- **A threat has a tell.** Every new attack shape and every new movement ability ships with its telegraph, drawn on the
  ground or on the body (ENEMIES.md 6.3: "or they do not ship").
- **The character's auto-dodge must be able to answer it.** The character is controlled by the sim; `avoidHazard` steps out of
  ground effects it can see. A new ground attack is either something `hazardAt` understands, or it is meant to be taken.
- **Data first, still.** A new type is rows in `MONSTER_TYPES`, `TYPE_ABILITIES`, a rig or a kit, and a theme. Shapes and
  abilities come from libraries and describe themselves on the card (ENEMIES.md 7.3, 5.1).
- **Ids are stable.** Types and themes are added, never renamed (offers stored in a save name them).

---

## 2. Where things stand (read from the code, 2026-10-08)

### 2.1 What the roster looks like

33 types. 22 are drawn on the skeleton, in four builds; 11 have rigs of their own.

| Body on the skeleton | Types                                                                             |
| -------------------- | --------------------------------------------------------------------------------- |
| `warrior` (7)        | Warrior, Shieldbearer, Shambler, Gloomstalker, Mana Wisp, Censer-bearer, Cutpurse |
| `brute` (4)          | Brute, Bloater, Flagellant, Gilded Guard                                          |
| `archer` (4)         | Archer, Spitter, Kennel Handler, Gilt Slinger                                     |
| `mage` (7)           | Mage, Carrion Hag, Wailer, Lantern Wight, Hexer, Choirmaster, Bursar              |

| Faction    | Rigs today                                      | Not on the skeleton |
| ---------- | ----------------------------------------------- | ------------------- |
| Ossuary    | skeleton × 5                                    | none (correctly)    |
| the Rot    | skeleton × 4                                    | **none**            |
| the Hollow | skeleton × 4 (drawn at 80% opacity)             | **none**            |
| the Choir  | skeleton × 4                                    | **none**            |
| the Gilded | skeleton × 4                                    | **none**            |
| the Kennel | hound, boar, cat, and the Handler on a skeleton | 3 of 4              |
| the Swarm  | gnawer, bat, beetle, nest                       | all                 |
| Reliquary  | sentinel, arbalest, golem, pylon                | all                 |

What differs between, say, a Bursar and a Hexer is a hood, a book and a colour. Why the kits did not carry it:

- **The torso and head never change.** `buildFigure` draws the pelvis, the spine, three rib boxes, a collar bone and a skull
  with two dark sockets for every body that is not a hero. Kits add on top of that and cannot remove it. The Rot's Shambler
  is _ribs plus rags_.
- **The palette repaints the bone** (`FACTION_PALETTE`, role `bone`), so a Rot monster is a green skeleton and a Choir
  monster a brown one.
- **Hollow types are skeletons that are slightly transparent.** The Hollow is the faction that most wants no legs.
- **Pose follows the rig.** `isRanged` and `isCaster` key on the figure kind (`archer`, `mage`), so a Spitter draws a bow
  because its body is `archer`, and a Bursar gets the caster's staff-raise because its body is `mage`. A new body cannot
  have its own attack pose until the pose is keyed on something else.
- **Death is the same too.** `poseFor` 'death' scatters bones. Nothing but a skeleton should do that.
- **A champion is its type's body with a coloured ring and a light.** Only `rarity === 'boss'` (the Regent) gets the crowned
  skeleton (`monsterFigure`).

### 2.2 What they do

`monsterSkill` (`calc/monster.ts`) gives a type one of three attacks. In `monsterAI`, a melee type walks at the character
and strikes when in reach; a ranged type stops at its range, backs off for half a second when crowded, and fires. Every
ranged type fires one projectile (`count: 1, spread: 0`); lightning variants chain, and nothing else differs.

| Attack                   | Types                                                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Melee strike (19)        | Warrior, Brute, Shieldbearer, Shambler, Bloater, Gloomstalker, Wisp, Censer, Flagellant, Gnawer, Bat, Beetle, Sentinel, Golem, Hound, Boar, Cat, Cutpurse, Guard |
| One projectile (5)       | Archer, Spitter, Arbalest, Handler, Slinger                                                                                                                      |
| One projectile spell (7) | Mage, Hag, Wailer, Hexer, Choirmaster, Bursar, Wight                                                                                                             |
| None (2)                 | Nest, Pylon                                                                                                                                                      |

Abilities (ENEMIES.md 7.3) add a trick on top, and they are unevenly spread:

| Ability coverage             | Types                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| **None (9)**                 | Warrior, Brute, Archer, Mage, Spitter, Wailer, Gnawer, Bat, Arbalest                                    |
| **A passive rule only (11)** | Shieldbearer, Shambler, Bloater, Wisp, Flagellant, Beetle, Golem, Pylon, Cutpurse, Guard, Slinger       |
| **An active ability (13)**   | Hag, Gloomstalker, Wight, Hexer, Censer, Choirmaster, Nest, Sentinel, Hound, Boar, Handler, Cat, Bursar |

The nine with none are the most common: the Ossuary's four, the Swarm's two fodder types and three ranged units. The
engine can already do much more than the monsters ask of it: the player's skills run through `actions.ts`, which resolves
melee arcs (`arc`), circles at a target or around the caster (`burst`), lines (`beam`), delayed ground zones (`ground`),
fans of projectiles (`count`, `spread`), chains and travelling skills (`travel`). Monsters use two of those.

Other things that are the same for everyone:

- **Movement.** `chaseStep` is a straight walk with A\* round walls. A pack shares no plan, so melee monsters join the same
  line at the character. Only the kiters, leapers, chargers and blinkers do anything else, and the `line` template only
  arranges where a pack _starts_.
- **No state.** Nothing enrages, flees, shells up or changes mode as it is hurt. Only champions are scripted by life.
- **Ground attacks are few.** The Sentinel's slam, caustic and golem zones. `hazardAt` reads `w.effects` (circles of kind
  slam, explosion, caustic and so on); lanes, arcs and `SkillZone`s are not hazards to it.

### 2.3 Why the tests passed

`creatures.test.ts` "no two types share a silhouette" compares `JSON.stringify(buildFigure(...))`. Any difference in any
primitive passes, so a Hexer and a Choirmaster, both a skeleton under a robe, are "different". The test is right to fail on
exact duplicates and says nothing about what a player sees. Section 8 replaces it with a distance.

### 2.4 What a type can set, and what it cannot

A type sets six numbers: life×, damage×, speed, attack time, reach and radius. Across the 33 types (measured from
`MONSTER_TYPES`):

| Stat        | Range                                            | Median | Distinct values |
| ----------- | ------------------------------------------------ | ------ | --------------- |
| life×       | 0.3 to 3.0                                       | 0.8    | 14              |
| damage×     | 0.1 to 1.9                                       | 0.75   | 15              |
| speed       | 0 (stationary) to 4.5 tiles a second             | 2.8    | 13              |
| attack time | 1.0 to 2.0 s                                     | 1.5    | 11              |
| reach       | melee 1.0 to 1.5; **all 12 ranged types 6 to 8** | 1.3    | 9               |
| radius      | 0.3 to 0.7                                       | 0.4    | 9               |

Fifteen types are at 2.6 or slower (three of them stationary) and seven at 3.4 or faster, so the numbers cluster. **No type has a reach between 1.5
and 6 tiles, or above 8.** Everything else is one function of the area level for every monster, so a build meets the same
defences, senses and movement on all of them:

| Not set by a type                 | Today                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Armour, evasion, accuracy         | one curve of the level; five types deviate by a mod (Sentinel, Pylon and Guard armour; Gloomstalker and Cutpurse evasion)                                                             |
| Resistances and immunities        | one type resists anything (the Wailer, cold 40%); the Hollow take 50% less physical; a Core Golem is immune to its own element. **No type has a fire, lightning or chaos resistance** |
| Energy shield, regeneration, crit | none (a rare may roll Shrouded or Regenerating)                                                                                                                                       |
| Damage type                       | physical, except the Shambler (30% chaos), Spitter and Hag (chaos), Wailer and Wight (cold); fire and lightning only by the random element variant                                    |
| Stun threshold                    | one deviation (the Sentinel)                                                                                                                                                          |
| Senses                            | notice at 10 tiles, alert the pack at 6, leash after 6 s, wake an ambush at 4.5: the same for every type                                                                              |
| Movement                          | a straight walk with A\* round walls; no acceleration, turning, pausing or choice of path                                                                                             |
| Whom it goes for                  | the character; a minion only when it blocks the way or is the only thing in range                                                                                                     |

The consequence: **two types differ in how long a build takes to kill them only by their life×**, whatever the build is
(seven types aside), and a physical, a fire and a chaos build meet the same monster. That is the stat-side reason a map
plays the same whoever is in it. Section 6 builds the answer.

---

## 3. Decisions to reopen

| Decision                                      | Default in this plan                                                                                                                                |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENEMIES.md 6.1: "BodyKind stays the skeleton" | **Reopened.** Three body styles; bone only for the Ossuary. Recorded in DESIGN.md Appendix A when built.                                            |
| Do existing types move to new rigs?           | Yes where it fits (Spitter, Bloater, Wisp); the Hollow stays on a body style (4.1). Ids and stats do not change.                                    |
| How many new factions?                        | Two committed (the Drowned, the Emberborn), one optional (the Briar). The Veiled of ENEMIES.md 7.4 stays out.                                       |
| New enemies in the old factions               | Seven (section 7.1), each on a rig that is not a person.                                                                                            |
| Champions and chiefs                          | Keep their type's body and gain a signature prop (a kit), not a new body. The Regent stays the crowned skeleton.                                    |
| Do attacks get harder?                        | No change to damage budgets: a type's `dmgMult` is spread over its new shape (a volley's arrows share the base hit). Balance is re-measured in V10. |
| Do defences make the game harder?             | No: a defence is paid for in life (6.2), and the build matrix holds each type's mean time to kill within 15% of its `lifeMult`.                     |
| Do types get a defence profile each?          | Every type but the Warrior (the control). Factions have a lean (6.2); types deviate by archetype.                                                   |
| Do monsters target minions?                   | Some: Hunters first, a Guard's taunt by pulling. The rest keep today's rule. Each is a visible, named behaviour.                                    |
| Is a stat band a rule?                        | Yes, a data test (6.1): three types in each speed band, two in each reach band, four archetypes in a faction.                                       |
| Is a telegraph always required?               | Yes for any shape that is not a strike or a single projectile. A shape the auto-dodge cannot see is marked in the card and costs less.              |
| Where do the per-type rows live?              | In `data/monsters.ts` next to the stats: `style`, `stance`, `attackShape`, `gait`. No new table.                                                    |
| Sim speed                                     | The x9 floor (400 sim-seconds a second) stays green; flanking is computed per pack on the 0.25 s notice tick, not per frame.                        |

---

## 4. Bodies

### 4.1 Three body styles on the humanoid rig

The `hero` boolean in `buildFigure` becomes a **body style**, taken from the type's faction (and overridable by type):

| Style     | Torso and head                                                     | Limbs                              | Used by                                             |
| --------- | ------------------------------------------------------------------ | ---------------------------------- | --------------------------------------------------- |
| `bone`    | today's: skull, ribs, bone limbs                                   | bone                               | the Ossuary only                                    |
| `flesh`   | a solid torso in a garment, a head with a face, hood, helm or mask | limbs in sleeves, wraps or greaves | the Rot, the Choir, the Gilded, the Handler, heroes |
| `spectre` | a torso that tapers to a trailing tail, a hood or a bare face glow | no legs below the hip; long arms   | the Hollow                                          |

Heroes stay on `flesh` and **must not change**: `figure.test.ts` pins hero poses, and `creatures.test.ts` pins
"the Ossuary warrior is the bare skeleton". The refactor must keep both byte-identical (the first thing V1 does is a test
that records today's primitives for every hero kind and every Ossuary type and compares them after the change).

Each faction then reads differently on the same pose set, through what its `flesh` or `spectre` is made of:

| Faction    | Style   | Garb and build                                                                                                                      |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| the Rot    | flesh   | rotting corpses: slumped shoulders, torn flesh showing wet muscle, one arm longer, a trailing gut, flies; no ribs                   |
| the Choir  | flesh   | living zealots in robes: a cowl and a face (a veil, a mask, a blindfold), hands in sleeves, heavy censers and books                 |
| the Gilded | flesh   | hired professionals: leather, plate and coin; a cutpurse is lean, a guard is square in plate, a bursar is stooped in a clerk's coat |
| the Kennel | flesh   | handlers in heavy coats and hats                                                                                                    |
| the Hollow | spectre | shades: no feet, a shroud that streams, glowing eyes in a dark hood, translucent                                                    |
| Ossuary    | bone    | as today                                                                                                                            |

Palette roles: `bone`, `boneShade` stay for `bone`. `flesh` uses `skin`, `cloth` and `metal`, which every faction palette
already defines (some need a better value; V1 checks them on the sheet). `spectre` uses `cloth` and `glow`.

### 4.2 A rig that is not a person, for every faction

The biggest lever. Rot, Choir, Gilded and Hollow have none, and the Ossuary should keep one honest exception (below).
Rigs are built from the same primitives (`circ`, `cap`, `box`, `tri`) as the Swarm's and the Reliquary's, and read the same
`Pose` numbers. The rigs of this plan, with who is on them:

| Rig       | Looks like                                                          | Existing types that move to it | New types (section 7)                            |
| --------- | ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| `bloat`   | a huge round body on stub legs, a small head, a stretched belly     | Bloater                        | Gorger                                           |
| `toad`    | a low, wide amphibian with a throat sac that swells before it spits | Spitter                        | Brine Leech (slug variant)                       |
| `orb`     | a floating core with three trailing tails and no limbs              | Mana Wisp                      | Hollow Watcher (an eye), Cinderling (small, red) |
| `crawler` | a torso on two arms, no legs, low and fast                          | none                           | Bone Crawler                                     |
| `heap`    | a mound of fused bone with limbs and skulls                         | none                           | Charnel Heap                                     |
| `bell`    | a bell hung in the air, a clapper that swings                       | none                           | Tolling Bell                                     |
| `spider`  | eight legs, a bloated abdomen, a spinneret                          | none                           | Silkspinner                                      |
| `chest`   | a treasure chest with legs and teeth                                | none                           | Lurking Coffer                                   |
| `worm`    | a segmented body that rises out of the floor                        | none                           | Drowner, Slagworm                                |
| `sapling` | a walking tree: a trunk, root legs, branch arms (the Briar, 7.4)    | none                           | Heartwood, Thornling                             |

The Hollow's Gloomstalker, Wailer and Wight are on the `spectre` style, not on a new rig: they are the faction's people and
should be recognisable as one. Everything else that is on the skeleton today is on `flesh`.

Rigs are not all built at once. Section 10 puts the five that are needed by the existing types or by the Drowned and the
Emberborn first (`bloat`, `toad`, `orb`, `worm`, `crawler`) and the rest as their enemies arrive.

### 4.3 Pose keyed on the stance, not the rig

`isRanged(kind)` and `isCaster(kind)` read the figure kind. Replace them with a **stance** on the type (`strike`, `bow`,
`cast`, `throw`, `lash`, `none`) that `poseFor` takes. A Spitter on the `toad` rig has the `throw` stance (a lunge with the
throat sac swelling), a Bursar on `flesh` has `cast`, an Archer on `bone` keeps `bow`. Heroes keep their own kinds. The stance
defaults to what the body implies today, so nothing changes until a type opts in, and the existing pose tests stay green.

### 4.4 Gaits and deaths by style

ENEMIES.md 6.3 asked for gaits and did not build them (14.2). A **gait** is a different set of pose numbers for `walk` and
`idle`; a **death** is a different set for `death`. By style:

| Style / rig | Gait                                                         | Death                                                 |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `bone`      | today's march                                                | today's: the bones scatter                            |
| `flesh`     | a heavier step; hunched types drag a foot; robed types sway  | falls and stays as a body (the corpse the Hag raises) |
| `spectre`   | glide: no leg swing, a slow vertical bob, a sway; stops flat | unravels into wisps and fades, leaving no body        |
| `bloat`     | waddle, side to side                                         | bursts (already a mechanic; now it looks like one)    |
| `toad`      | hops, a low crouch between                                   | flattens                                              |
| `orb`       | drifts on a curve, never walks straight                      | pops with a flash                                     |
| `crawler`   | skitters, arms alternate                                     | bones scatter (it is Ossuary)                         |
| `worm`      | rises and sinks, coils                                       | collapses into the ground                             |
| `bell`      | swings, rings (a ring on the ground at each toll)            | cracks and falls                                      |

`poseFor` takes the style and the gait next to the kind. A death that leaves a body, or none, touches the Hag's Raise the dead
(`raiseCorpses`) and the Shambler's Rise, which both need a corpse: V1 reads what they require and decides which styles
leave one (flesh does; a spectre, a worm and an orb do not).

### 4.5 Test and tooling

- **A contact sheet** (`scripts/sheet.ts`, built in V0) draws every type in idle, walk and attack at 1×, 2× and a phone's
  1× with the palette applied, as an SVG in `docs/screenshots/roster/`. It is the review tool of every change here. It
  replaces looking at the game with the dev server for this purpose and runs in the test suite as a smoke test (it must not
  throw). `docs/screenshots/roster/before-sheet.svg` is its output today.
- **A silhouette distance** replaces the JSON test (section 8).
- **A bone budget** test: no type outside the Ossuary may draw a `bone`-style primitive (a skull or a rib box), and no
  Ossuary type may be drawn on `flesh` or `spectre`.

---

## 5. Attack shapes

### 5.1 The field

_As built (V3): the code calls the shapes `swing` and `salvo`, for the reason in section 14._

`MonsterTypeDef` gains `attackShape` (default `strike`, which is today's). `monsterSkill` builds the skill from it. Most
shapes are the player's own behaviours, resolved by `actions.ts` today (section 2.2), so the work is the monster side
(choosing when to use it, the telegraph, a card string), not new combat code. One exception: `lob` does **not** use the
player's `ground` behaviour, which makes a `SkillZone` that `hazardAt` cannot see. It lands a delayed `GroundEffect`, the
kind the caustic, burning and golem zones already are, so that the character can step out of it:

| Shape    | What it does                                                             | Built on                   | Telegraph                              |
| -------- | ------------------------------------------------------------------------ | -------------------------- | -------------------------------------- |
| `strike` | one melee hit, or one projectile (today)                                 | `melee`, `projectile`      | the wind-up pose                       |
| `sweep`  | a wide arc in front of it, longer wind-up, hits what stands in the wedge | `melee` with `arc`         | a wedge on the ground                  |
| `slam`   | a circle at the character's feet after a wind-up                         | `burst` (origin target)    | a ring that fills (as the Sentinel's)  |
| `lob`    | a projectile that lands and leaves a zone (caustic, fire, frost)         | a delayed `GroundEffect`   | a ring at the landing point            |
| `volley` | three to five projectiles in a fan, each with a share of the hit         | `projectile` count, spread | a fan of faint lines, or the draw pose |
| `lance`  | a line that hits everything along it, after the lane is shown            | `beam`                     | a lane that brightens                  |
| `nova`   | a ring around itself that pushes or damages                              | `burst` (origin self)      | the ring, drawn as it expands          |
| `orb`    | one large projectile at half speed (a slow, visible bolt)                | `projectile` with a speed  | the projectile itself                  |
| `chain`  | already exists for lightning; some types use it by nature                | `chain`                    | the arcs                               |

A damage budget stays the type's `dmgMult`: a `volley` of 3 arrows is 3 projectiles that together do about 1.3 times the
single bolt's damage when all land, and fewer land on a character that moves; a `slam` does 1.6 times a strike's damage
and takes twice as long. These are starting values, set in V3 from the bot.

### 5.2 Who gets which

| Type            | Today                 | Shape                                                                             | The question it asks                                  |
| --------------- | --------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Skeleton Brute  | strike                | `sweep` (a heavy overhead arc, wide) and a stun on it                             | stun resistance, standing still in melee              |
| Skeleton Archer | one arrow             | `volley` of three every third shot                                                | evasion; a wall of arrows is blocked by Shieldbearers |
| Skeleton Mage   | one bolt              | `orb`: a large projectile at half speed, easy to see                              | dodging, projectile skills that destroy projectiles   |
| Spitter         | one bolt              | `lob`: caustic ground at the character's feet, poison on it                       | moving out of ground; chaos resistance                |
| Wailer          | one bolt              | `nova`: a ring of cold that expands, chills and interrupts casting                | being in melee range of a Wailer; cast speed          |
| Hexer           | a bolt, and a hex     | a hex `lob`: the hex is a **sigil** on the ground; standing in it applies the hex | leaving the sigil; curse immunity                     |
| Arbalest        | one bolt              | `lance`: the lane shows for a second, then a bolt pierces the line                | sidestepping; evasion is useless, movement is not     |
| Hag             | one bolt, raises dead | `lob`: a rot orb that bursts in a cloud                                           | ground avoidance; corpses nearby                      |
| Slinger         | one bolt              | `volley` of two stones, one slows (a hobbling hit)                                | speed; flasks                                         |
| Boar            | strike and a charge   | `sweep` (a short upward gore) after a charge                                      | kiting                                                |
| Flagellant      | strike                | `sweep` as a lash of three quick arcs; each hit it takes speeds it                | burst before the lashes build                         |
| Sentinel        | strike and slam       | `slam` and `nova` alternately                                                     | staying out of both                                   |

Every type not named keeps its attack: the fodder and specials whose trick is elsewhere (Warrior, Shieldbearer, Gnawer, Bat,
Beetle, Shambler, Bloater, Wisp, Gloomstalker, Cutpurse, Guard, Censer-bearer, Hound, Cat, Golem) and the supports whose
job is not to hit hard (Choirmaster, Wight, Bursar, Handler). A pack needs plain members. The rule: **no faction is only
strikes and bolts**. After V3 and V7 every faction has at least two shapes, and no shape is more than half of what a
faction fields.

### 5.3 Telegraphs and the auto-dodge

Every non-strike shape draws its telegraph for 0.4 to 1.0 s at 1× speed (the Sentinel's is the model). For the character to
answer them:

- Build `lob`, and every lasting zone a monster makes, on `GroundEffect` and never on `SkillZone`. Extend `GroundEffect`
  with a `shape` (`circle` as today, `lane`, `wedge`), and make `hazardAt` shape-aware, so
  `avoidHazard` steps out of a lane or a wedge as it steps out of a ring. A lane and a wedge are cheap to test (a
  segment-distance and an angle test, both in `actions.ts` already).
- The monster's resolution runs when the telegraph ends, against where things are _then_.
- A shape is **unavoidable** only if `hazardAt` cannot represent it (a volley's fan is the case; each arrow can be walked
  out of in principle, but the character is not asked to). The card marks the type "area" or "cannot be dodged" so the "For you"
  line stays honest.

### 5.4 The card

Each shape has a `describe()` string next to `ABILITY_INFO`, and a threat tag derived from the shapes a theme fields
(`Ground`, `Volleys`, `Lanes`, `Rings`), so the camp card, the inspect card and the recap say what a pack does without a
sentence per type.

---

## 6. Behaviour: archetypes, defences, movement and packs

Section 5 changes how a monster attacks. This section changes what a monster **is**: its numbers, its defences, how it
moves, what it notices and whom it goes for. Section 2.4 shows that these are nearly the same for every type today.

The idea is one data layer: an **archetype** is a bundle of stats, a defence lean, a movement style, senses and an
engagement rule. A type is an archetype plus its deviations, and a faction's variety is the **spread of archetypes** it
fields. A new type is a pick from a list of sixteen and a few overrides, which keeps the roster varied as it grows.

### 6.1 Sixteen archetypes

Numbers are starting envelopes (life and damage as multiples of the type multipliers of `MONSTER_TYPES`, speed in tiles per
second, reach in tiles); V4 sets each type's own from the build matrix (6.2) and the bot.

| Archetype      | Life× / damage× / speed / reach                       | Defence lean                | Movement (6.3)           | Engagement                                                  | The question it asks                          |
| -------------- | ----------------------------------------------------- | --------------------------- | ------------------------ | ----------------------------------------------------------- | --------------------------------------------- |
| **Brawler**    | 1.0 / 1.0 / 3.0 / 1.2                                 | none                        | walk                     | closes and trades blows; the reference monster              | the baseline, the control for everything else |
| **Bruiser**    | 2–3 / 1.8–2.5 / 1.8–2.4 / 1.5–2                       | armour, high stun threshold | momentum                 | walks in, winds up a slow heavy blow                        | crowd control; not standing in melee          |
| **Skirmisher** | 0.25–0.6 / 0.3–0.7 / 4.2–5.5 / 1.0                    | evasion                     | skitter, swoop or orbit  | darts in and out, never stays adjacent                      | area damage; damage that cannot miss          |
| **Assassin**   | 0.5–0.8 / 1.5–2.2 / 3.5, bursts of 6 / 1.2            | evasion, hard to see        | cover, then dash         | waits behind cover, strikes, withdraws                      | seeing it; a life buffer; burst               |
| **Gunner**     | 0.6–0.8 / 0.7–0.9 / 3.0 / 6–7                         | light                       | kite-keep, strafe        | fires in volleys and backs off when closed on               | evasion and block; closing speed              |
| **Sniper**     | 0.4–0.6 / 2–3 / 1.5–2 / 10–11                         | evasion                     | cover (peek and fire)    | holds the longest range, shows a lane, fires once and moves | breaking line of sight; a ranged answer       |
| **Artillery**  | 0.6–0.9 / 1.2–1.8 / 1.5–2 / 9–12                      | energy shield               | hold and retreat         | lobs ground effects; has a minimum range of 3               | ground avoidance; reach                       |
| **Bulwark**    | 1.5–2.5 / 0.5–0.9 / 1.8–2.4 / 1.2                     | armour, resists, immunities | tether to its pack       | holds a place, blocks lines, shields the others             | area, piercing, damage that ignores armour    |
| **Controller** | 0.8–1.2 / 0.4–0.7 / 2.4 / 5–8                         | warded                      | kite-keep                | slows, pulls, roots or curses                               | speed; immunity to being held                 |
| **Support**    | 0.8–1.5 / 0.3–0.6 / 2.4–2.8 / 6                       | energy shield, low life     | follow the leader        | stays behind the front; heals, buffs or shields             | target priority; burst                        |
| **Summoner**   | 0.8–1.2 / 0.3–0.5 / 2.0–2.6 / 7                       | energy shield               | flee when approached     | spawns or raises, keeps its distance                        | reach; clearing what it makes                 |
| **Bomber**     | 0.3–1.2 / 0.2–0.4, 3–6× on bursting / 3.5–5           | fire-weak or fragile        | kamikaze                 | runs straight in and bursts on contact or death             | killing it at range; keeping distance         |
| **Ambusher**   | 1.0 / 2.0 on the first blow / any / 1.2               | ordinary                    | dormant, burrow or cover | waits for the character to come close                       | awareness; an opening burst                   |
| **Berserker**  | 0.8–1.2 / 1.0 rising to 1.6 / 3.0 rising to 4.2 / 1.3 | no armour, bleed-immune     | walk, then enrage        | grows with damage taken and with allies' deaths             | burst before it grows; finishing it           |
| **Thief**      | 0.5–0.8 / 0.4 / 4–5 / 1.0                             | evasion                     | flee and return          | takes something and runs                                    | reach; dependence on flasks                   |
| **Hunter**     | 0.7–1.0 / 1.0 / 3.6 / 1.2                             | ordinary                    | tracks, never gives up   | goes for the character's minions first (6.4)                | minion builds                                 |

**The spread rules**, checked by a data test:

- **Speed bands.** Crawling (under 2), steady (2 to 3.2), quick (3.3 to 4.4), fast (4.5 and over, or in bursts). Each band
  holds at least three types; today the fastest is 4.5 (one type) and fifteen types are at 2.6 or slower.
- **Reach bands.** Touch (1 to 1.5), **short (2 to 5: a whip, a spear, a chain; empty today)**, mid (6 to 8), long (9 and
  over; empty today). Each holds at least two types. The Flagellant's scourge (3) and the Censer-bearer's chain (2.5) are
  the first short reaches.
- **Spread in a faction.** At least four archetypes among a faction's types; two types of one archetype only if one is a
  swarm. No archetype is more than a third of what a theme fields.

### 6.2 Defence profiles, and the build matrix

A type today cannot say what it is hard or soft to (2.4). It gains a **defence profile**, written as the same mods the
monster build already reads (`mod('armour', 'inc', …)` and so on), so most of it is data and the player's defence model
resolves it with no new combat code:

| Field           | What it is                                                                                      | New code?                          |
| --------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------- |
| `armour`        | a multiple of the level curve (low, normal, high)                                               | none                               |
| `evasion`       | likewise                                                                                        | none                               |
| `es`            | an energy shield worth a share of life (rares already roll Shrouded)                            | none                               |
| `res`           | resistance to each element and chaos, −60 to +75                                                | none                               |
| `physReduction` | less physical damage taken (the Hollow have 50% today)                                          | none                               |
| `immune`        | ailments and effects it cannot suffer: stun, freeze, ignite, shock, bleed, poison, chill        | the flags mostly exist (the Golem) |
| `regen`         | life regenerated per second (rares already roll Regenerating)                                   | none                               |
| `hitCap`        | the most of its life a single hit can remove (a **carapace**): burst is slow, many hits are not | one clamp in `hit()`               |

Resistances, immunities and a carapace each have a **tell** on the inspect card ("Resists fire", "Cannot be stunned",
"Carapace: no hit takes more than a fifth of its life"), and the camp card's defence line (ENEMIES.md 5.1, item 6) reads
the faction and type profiles, so a map says "cold-resistant, weak to lightning" before it is chosen.

**The build matrix** is how a profile is kept honest. A report and a test (`scripts/matrix.ts`) take eight reference
damage profiles at the same damage per second: a physical hit, a fire hit, a cold hit, a lightning hit, a chaos hit, a
spell against an attack (accuracy applies to one), many small hits against few large ones, and damage over time. For each
type at levels 10, 30 and 60 it computes the **time to kill** from the same calc functions combat uses
(`calc/combat.ts`, `defenceFromDb`), so it cannot drift from the game.

- **Today:** the time to kill differs between two types only by `lifeMult`, except for the seven types of 2.4. Across the
  eight profiles the spread within a type is about nothing.
- **Targets:** every type except the baseline Warrior has a **hard** profile (at least 25% slower than its mean) and a
  **soft** one (at least 25% faster), and every profile is soft for some faction and hard for another.
- **Toughness-neutral.** A type's mean time to kill over the eight profiles stays within 15% of what its `lifeMult` says. A
  defence is **paid for in life**: a type that gains armour loses life×, so variety does not creep up the difficulty.
  `npm run matrix -- --fix` prints the life× that satisfies it.

A starting signature per faction, so that a map reads as a question about the build (the strong and soft columns are the
leans; each type deviates by archetype):

| Faction     | Hard to                                       | Soft to                       | Immune or cannot                 |
| ----------- | --------------------------------------------- | ----------------------------- | -------------------------------- |
| Ossuary     | physical (armoured types)                     | nothing in particular         | none: the baseline stays neutral |
| the Rot     | chaos and poison (60%)                        | fire (−30%): rot burns        | poison                           |
| the Hollow  | physical (half taken, as today), cold (+50%)  | fire and lightning (−30%)     | bleed (as today)                 |
| the Choir   | spells (energy shield)                        | chaos (−30%), physical bursts | curses of its own                |
| the Swarm   | single hits (evasion, numbers)                | area damage, fire (−20%)      | none                             |
| Reliquary   | physical, elements (+25%)                     | chaos (−40%), armour-ignoring | stun, bleed, poison              |
| the Kennel  | accuracy-based attacks (evasion)              | chill and slows, lightning    | none                             |
| the Gilded  | physical (plate), then a mix of armour and ES | lightning (−30%)              | none                             |
| the Drowned | fire (+40%), cold                             | lightning (−40%)              | freeze                           |
| Emberborn   | fire (+75%)                                   | cold (−40%)                   | ignite                           |

Each element is soft for at least two factions and hard for at least two: the single "right answer" never exists, which is
the point of a choice among three maps.

### 6.3 A movement library

Today every monster walks at the character by the same code (`chaseStep`). A movement style is a small function from the
world to a point to steer to, a speed multiple and a facing, plus a little per-monster state (`m.mv`), in
`sim/movement.ts`. `step` and the pathing stay as they are. Randomness comes from a hash of the actor's id and a counter,
never `Math.random`.

| Style         | Rule                                                                                                                                     | Used by (6.6)                             | What it asks                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------- |
| `walk`        | today's: straight, with A\* round walls                                                                                                  | Brawlers                                  | the baseline                          |
| `lurch`       | stop-start: about a second at 1.6× speed, then a pause of 0.8 s; the net pace is the same or slower                                      | Shambler, Wrack                           | kiting by timing; damage windows      |
| `momentum`    | speed ramps from 50% to 150% over 2.5 s of straight motion; turns are slow, a stun or a slow resets it                                   | Brute, Boar, Slag Brute, Golem            | crowd control; being out of its path  |
| `skitter`     | a zig-zag of ±35° every 0.4 s at high speed; each member of a pack takes a different side                                                | Gnawer, Bone Crawler                      | area damage; slow projectiles miss it |
| `swoop`       | approach, strike, withdraw three tiles, approach again                                                                                   | Bat, Hound after a missed leap            | sustained damage; retaliation         |
| `orbit`       | circles at its preferred distance, drifting closer; shoots or bites on the arc                                                           | Wisp, Handler, Slinger                    | aiming; projectile speed              |
| `hop`         | moves in arcs of 0.8 s; a small landing blow; cannot be struck in the air                                                                | Brine Leech (slug), new toad types        | timing; sustained damage              |
| `phase`       | passes through walls at 60% speed; arrives by the wrong door                                                                             | Hollow types                              | a chokepoint is no answer             |
| `burrow`      | submerges (untargetable), moves at 1.5× to under the character, rises with a ring                                                        | Drowner, Slagworm                         | awareness; the ring                   |
| `cover`       | keeps a wall between itself and the character; steps into line only to attack (a peek), then steps back; everything it does is on screen | Stalker Cat, Hollow Watcher, Sniper types | line of sight; reach                  |
| `tether`      | stays within a radius of an anchor (a pylon, a nest, a leader); fights only inside it; walks home when the character leaves              | Guard, Censer, Shieldbearer, Sentinel     | reach; skipping it                    |
| `follow`      | stays within three tiles of its leader; scatters when the leader dies (rally, 6.7)                                                       | Support types                             | killing the leader                    |
| `kamikaze`    | a straight run at 1.4× speed with no pause to attack; bursts at contact                                                                  | Bloater, Cinderling                       | range; area                           |
| `kite-keep`   | holds an exact distance as the character moves, backing off or closing in; fights when cornered                                          | Gunner, Controller                        | closing speed; corners                |
| `retreat`     | holds the longest range; steps back when closed on; will not advance beyond its range                                                    | Mage, Spitter, Sniper                     | reach; a gap closer                   |
| `flee-return` | takes something, runs to a chosen exit, comes back when the character is far                                                             | Cutpurse                                  | kill order                            |
| `enrage`      | a speed that rises with damage taken (6.5)                                                                                               | Flagellant                                | burst                                 |

**On being seen.** There is no fog of war in this game: the map is an isometric view and every living monster on screen is
drawn (a dormant one at 40% opacity, a Hollow one at 80%, a Phased-out one at 12%). "Sight" exists only in the sim, as
`grid.los`: it decides when a monster notices the character and which enemy the character picks (it needs line of sight and
9 tiles). So a style cannot be defined as "moves while unseen", because the player sees everything the camera shows and
would only see a monster that freezes. `cover` is the legible version: the monster uses the walls, which the player can
see it doing (it waits at a corner, leans out to fire, steps back). True concealment is a separate, explicit rule,
`veil` (6.4), with a tell.

`kite-keep` and `retreat` are the old `kite` flag turned into knobs (a retreat distance, speed and cooldown), so the
Slinger, the Handler and the Mage differ by numbers and not by whether they have the flag. Every style has a visible tell (`lurch` has the pause pose,
`momentum` leans further forward as it ramps, `cover` shows it at the wall's edge, `burrow` leaves a mound), and the gait of 4.4 is
chosen to match.

### 6.4 Senses and targeting

All types notice at 10 tiles, alert their pack at 6, give up the chase after 6 seconds without sight and wake an ambush at
4.5. A type gains these knobs (data on the archetype):

| Knob     | Today            | Range of values                                                                                    | Example                                                                             |
| -------- | ---------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `aggro`  | 10 for all       | 5 to 14                                                                                            | short-sighted Brutes notice at 6; a Sniper at 14                                    |
| `alert`  | 6 for all        | 0 to 12                                                                                            | the Swarm's whole nest at 12; a solitary Bruiser at 0                               |
| `leash`  | 6 s for all      | 2 s to never                                                                                       | a Hound tracks the character's trail and never gives up; a Bulwark at 2 s           |
| `wake`   | 4.5, by distance | distance, or noise: a skill cast within 8 tiles, or a death within 6                               | the Lurking Coffer wakes on noise                                                   |
| `target` | the character    | `character`, `nearest`, `minions`, `weakest`                                                       | the Hunter goes for minions first; a Berserker for whatever hit it last             |
| `veil`   | seen by everyone | revealed within 2 to 3 tiles, for 1.5 s after it attacks or blinks, and when an area skill hits it | the Gloomstalker: drawn as a faint shimmer, ignored by the character until revealed |

`veil` is the one real hidden-information rule, and it needs three things that exist nowhere today: a single predicate
`revealed(w, m)` that the renderer and `findTarget` both read (so the shimmer drawn is the visibility fought), a tell
the player can learn (a shimmer, and ripples where it steps), and a line on the card ("Veiled: not seen until within 3
tiles"). It is for one type to begin with. The Unremembered's phase-out (immune, "unseen", drawn at 12%) is the precedent.

`target` is the one with the largest effect on builds: a minion build is a different question when a pack's Hunters ignore
the character, and the Guard's `taunt` (6.6) pulls a pack's attention onto itself. It replaces the fixed `p` in
`monsterAI` with `pickTarget(w, m)` on the 0.25 s notice tick. The sim already routes a blocked monster to a minion in its
way; that rule stays as the fallback.

### 6.5 Tempo and state

- **Tempo.** `attackTime` is a single number. A type may have a **pattern**: a list of beats with a wind-up and a recovery
  each, and a share of the damage per beat. The Flagellant lashes in three quick beats and then rests; a Brute is one beat
  at 2.4 s; an Archer's volley is a draw and a release. `startAction` cycles the pattern (a small change), and the pose
  follows the beat. A pattern is a rhythm the player learns, and a different one for each archetype is variety that costs
  no new art.
- **State.** Champions have a life-threshold script (`tickChampion`). The same mechanism is opened to any type as a list of
  **phases**: `at: 0.5, do: 'enrage'` (speed +30%, damage +25%, attack time −20%, a visible tint), `flee` (below a quarter
  of its life, to regroup with its leader, back at 60%), `split` (into smaller bodies), `shell` (curl up, as the Beetle does,
  for a while). `phases` are the engine of the Berserker, the Charnel Heap and a few Bruisers. A phase has a tell, always.
- **Lifetimes.** What a type makes may **expire**: summoned things after N seconds, a fuse on a Bomber (so a pack of
  Bloaters is a clock, not a crowd).

### 6.6 What each existing type becomes

Ids, roles and factions do not change. The first number of each is a starting value that V4 sets from the build matrix.
Reworks that added a single ability (the bat's swoop and so on) are in the movement column now.

| Type           | Archetype  | Stats and defence                                                                 | Movement and senses                              | Other                                        |
| -------------- | ---------- | --------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| **Ossuary**    |            |                                                                                   |                                                  |                                              |
| Warrior        | Brawler    | unchanged: the control                                                            | `walk`                                           | none                                         |
| Brute          | Bruiser    | life 2.4, dmg 2.2, speed 1.9; armour +80%, stun threshold +100%                   | `momentum` (to 3.8); aggro 6                     | the `sweep` of 5.2                           |
| Archer         | Gunner     | life 0.6; evasion −20%                                                            | `kite-keep` at 7; aggro 12                       | `volley`                                     |
| Mage           | Artillery  | life 0.5, speed 1.6, range 10; energy shield 40%; chaos −30%                      | `retreat`; minimum range 3                       | `orb`                                        |
| Shieldbearer   | Bulwark    | life 1.8, speed 2.0; armour +120%                                                 | `tether` to the nearest Archer or Mage           | blocks lines (as today)                      |
| **the Rot**    |            |                                                                                   |                                                  |                                              |
| Shambler       | Brawler    | chaos 50%, immune to poison; fire −25%                                            | `lurch`                                          | rises (as today); rot trail                  |
| Bloater        | Bomber     | life 1.2; fire −50% (the gas ignites: it bursts early)                            | `kamikaze` at 1.6, so it is slow and avoidable   | burst radius is the tell                     |
| Spitter        | Artillery  | life 0.6, range 9, speed 2; chaos 60%                                             | `retreat`; `hop` back when closed on             | `lob`                                        |
| Hag            | Summoner   | energy shield 30%; fire −25%                                                      | flees when approached; `tether` to a corpse pile | raises the dead (as today)                   |
| **the Hollow** |            |                                                                                   |                                                  |                                              |
| Gloomstalker   | Assassin   | life 0.5, evasion +150%; fire −30%                                                | `phase`, `veil`; leash never; bursts of 5        | blink (as today); veil                       |
| Wailer         | Controller | life 0.7; cold +60%, fire −30%                                                    | `phase`, `kite-keep` at 8; leash 3 s             | `nova`                                       |
| Mana Wisp      | Bomber     | life 0.2, speed 5.5                                                               | `orbit`, then `kamikaze`                         | pops on death                                |
| Lantern Wight  | Support    | life 1.0; fire −30%                                                               | `phase`, `follow`                                | shell (as today)                             |
| **the Choir**  |            |                                                                                   |                                                  |                                              |
| Hexer          | Controller | energy shield 50%; chaos −30%                                                     | `retreat` at 8                                   | sigil `lob`                                  |
| Censer-bearer  | Bulwark    | life 1.4, speed 2.0; armour +60%; reach 2.5 (a swung chain)                       | `tether` to the Choirmaster                      | aura; tolls                                  |
| Flagellant     | Berserker  | life 0.8; no armour; bleed-immune; reach 3                                        | `enrage`; speed 3.2 rising to 4.5                | pattern: three quick beats, then a rest      |
| Choirmaster    | Support    | energy shield 60%; chaos −30%                                                     | `follow` the front line                          | channel heal; sings                          |
| **the Swarm**  |            |                                                                                   |                                                  |                                              |
| Gnawer         | Skirmisher | life 0.25, evasion +100%; fire −20%                                               | `skitter` at 5; alert 12 (the whole nest comes)  | none                                         |
| Carrion Bat    | Skirmisher | life 0.3; flies                                                                   | `swoop`                                          | none                                         |
| Bone Beetle    | Bulwark    | armour +150%; lightning −30%                                                      | `tether` to a Nest; rolls at 2× when curled      | curl up (as today)                           |
| Nest           | Summoner   | fire −40%; stationary                                                             | none; alert 12                                   | spawns (as today)                            |
| **Reliquary**  |            |                                                                                   |                                                  |                                              |
| Sentinel       | Bruiser    | armour +100%, stun threshold +200%, all resists 25%; chaos −40%; **carapace 20%** | `momentum`, speed 1.8                            | `slam` and `nova`                            |
| Arbalest       | Sniper     | range 11; stationary                                                              | aggro 14                                         | `lance`                                      |
| Core Golem     | Bruiser    | immune to its element, −50% to the opposite; stun-immune                          | `momentum`, speed 1.4                            | burning or frozen ground on death (as today) |
| Warden Pylon   | Bulwark    | armour +200%; immune to every ailment                                             | stationary                                       | protect, with visible links                  |
| **the Kennel** |            |                                                                                   |                                                  |                                              |
| Kennel Hound   | Skirmisher | life 0.4, speed 5; chill effect doubled                                           | `swoop` after a leap; leash never                | leap (as today)                              |
| Rend-boar      | Bruiser    | life 2.0; stun-immune while charging                                              | `momentum`; charge resets it                     | charge (as today)                            |
| Handler        | Summoner   | life 0.8                                                                          | `orbit`; flees when approached                   | whistle; **mark**                            |
| Stalker Cat    | Assassin   | life 0.6, dmg 2.0                                                                 | `cover`, dormant; wakes on noise                 | leap (as today)                              |
| **the Gilded** |            |                                                                                   |                                                  |                                              |
| Cutpurse       | Thief      | evasion +150%                                                                     | `flee-return` to a chosen exit                   | steal (as today)                             |
| Gilded Guard   | Bulwark    | armour +100%; lightning −30%                                                      | `tether` to the Bursar                           | reflect; **taunt**                           |
| Bursar         | Support    | energy shield; chaos −30%                                                         | `follow`, behind the front                       | suppress (as today)                          |
| Gilt Slinger   | Gunner     | evasion +50%                                                                      | `kite-keep` at 7                                 | `volley` of two                              |

The rows read as variety on three axes at once (stats, defence, movement), but each type changes at most two or three
things, so a type is still describable in a sentence on the inspect card.

### 6.7 Packs that fight as packs

A pack today shares nothing but an alert (`alertPack`). Five behaviours, in `sim/packs.ts`, computed on the existing 0.25 s
notice tick:

- **Flank.** Each melee member of a pack chooses a **slot** on a 120° arc round the character when it starts to chase, and
  paths to its slot's point instead of the character. The pack arrives from several sides, not as a queue, with no change to
  damage. Weight by faction: the Kennel and the Swarm flank, the Reliquary and the Ossuary do not.
- **Hold the line.** A ranged member keeps a distance behind the nearest front-role member of its pack, not behind the
  character, so a `line` template does what its name says. A kiting type ignores this.
- **Leapfrog.** Two ranged members alternate: one advances while the other fires, so a Gunner pair closes the distance under
  its own cover.
- **Guard bubble.** A `tether` type and its anchor form a bubble: the character can leave it and be left alone, or stay and
  be fought on the pack's terms. The bubble is drawn faintly on the ground when the character is near.
- **Rally.** When the leader of an `escort` dies, the followers react by faction: the Kennel's hounds frenzy, the Choir's
  falter (a short stun), the Swarm's scatter, the Gilded's guards take the leader's place. One line of data per faction.

Cost M for the five; the risk is sim speed and a stuck pack, so `packBehaviours.test.ts` gets a flank and a leapfrog case
and the x9 floor is rerun before and after.

---

## 7. New enemies

Names are ours and are checked against `src/data/ipDenyList.ts` (none of the names below is on it; `ip.test.ts` is the
gate). Each type gets a rig or a body style from section 4, a shape from section 5, an archetype from 6.1 and a one-line question.

### 7.1 Into the factions that exist

Each on a body that is not a person, so a faction's map has two silhouettes at the least.

| Faction    | New type (role)                | Rig       | What it does                                                                                                 | Question                             |
| ---------- | ------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Ossuary    | **Bone Crawler** (swarm)       | `crawler` | a torso on two arms, fast and low; skitters; grabs at the legs (a slow on hit)                               | speed, area                          |
| Ossuary    | **Charnel Heap** (front, rare) | `heap`    | a mound of fused bone, slow; a `slam`; splits into three Crawlers when it dies                               | burst, then area                     |
| the Rot    | **Gorger** (front)             | `bloat`   | eats a corpse in reach to heal a quarter of its life and swell; a `sweep` of the arms                        | killing in a way that leaves no body |
| the Hollow | **Hollow Watcher** (ranged)    | `orb`     | a floating eye; `lance` a beam that curses on hit; hides behind walls (stays out of line until it fires)     | line of sight, curse immunity        |
| the Choir  | **Tolling Bell** (support)     | `bell`    | hangs in the air; every 8 s a toll: a `nova` that staggers the character and gives the Choir a short haste   | reach, stagger resistance            |
| the Swarm  | **Silkspinner** (ranged)       | `spider`  | spits a `lob` of web: a zone that slows; keeps behind the swarm                                              | slow immunity, ranged answers        |
| the Gilded | **Lurking Coffer** (special)   | `chest`   | lies still as a chest until within four tiles, then springs open and bites; drops one extra item when killed | ambush; pays for being found         |

### 7.2 The Drowned (the question: being held)

ENEMIES.md 7.4 has the design and 14.4 says `pull` is declared and not coded (V8 codes it). Visually: a wet palette, a sheen
on every surface, drips as particles; not a skeleton anywhere.

| Type (role)              | Rig / style      | What it does                                                                                         |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Tidecaller** (support) | `spectre`        | a hooked chain; every 8 s drags the character three tiles toward it (`pull`, with a visible chain)   |
| **Wrack** (front)        | `flesh`, bloated | a heavy `sweep`; its hits slow the character (the hobbling hit of the Hobbling mod)                  |
| **Brine Leech** (swarm)  | `toad` (slug)    | crawls onto the character, sticks, drains life; shaking it off takes a hit that kills it             |
| **Drowner** (special)    | `worm`           | submerges into a puddle (untargetable), moves under the character and rises with a `slam` (`burrow`) |

The Tidecaller is the first enemy that moves the character, so V8 includes the auto-dodge's answer: a pulled character
does not walk back into the pack the instant it lands (a short engage delay), which is a change to `playerAI` and has a test.

### 7.3 The Emberborn (the question: fire and ground)

Fire is the element no faction is about (ENEMIES.md 7.1). Visually: embers as particles, a heat shimmer, black stone and
molten orange; no flesh to speak of.

| Type (role)               | Rig / style      | What it does                                                                            |
| ------------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| **Cinderling** (swarm)    | `orb` (small)    | bursts into burning ground on death (the `deathZone` rule exists); ignites on hit       |
| **Slag Brute** (front)    | `golem` (molten) | leaves a trail of burning ground; a `slam` that leaves fire at the edges                |
| **Pyre Priest** (support) | `flesh`, robed   | marks the ground under the character; fire falls there after a second (`lob`, repeated) |
| **Slagworm** (special)    | `worm`           | burrows, erupts in a ring of fire (`burrow` and `nova`)                                 |

### 7.4 The Briar (optional)

A walking-plants faction, the one that is most unlike a person: roots and spores. Its questions are being **rooted** and
**blinded** (an accuracy debuff), not another damage-over-time (the Rot already has poison). Types: **Heartwood** (front,
`sapling`: roots the character when it stays in reach), **Thornling** (swarm, small `sapling`), **Blight Bulb** (stationary
special, `pod`: releases a blinding cloud), **Dust Moth** (flier, ranged, `nova` of dust). Only built if the Drowned and the
Emberborn show the pipeline is cheap (V10 decides).

### 7.5 Monster mods

ENEMIES.md 7.2 listed six and built three (14.1); **Mirrored** and **Warding Pulse** remain, and V6 builds them because
they apply to every faction: a mirrored rare makes a second body that must be killed with it (a test for single-target
DPS), and Warding Pulse knocks the character back every 8 s (a test for channelled and melee builds).

---

## 8. Measuring

"Variety is measured, not asserted" (ENEMIES.md 1). V0 records the **before** column; each milestone records its own.

| Measure                                              | How                                                                                                                | Today (V0 records exactly)                                                                                                                                                                                        | Target                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Body style share**, by band of ten maps            | head count of what the bot met (`npm run sim` variety table, new column)                                           | bone is every type on maps 1–5; most of the rest                                                                                                                                                                  | bone ≤ the Ossuary's share (25% from map 25)                                                                                             |
| **Silhouette distance**, pairwise                    | rasterise the idle and mid-walk figure to a 40×56 mask, compare with overlap (intersection over union), no palette | V0, 2026-10-08: 19 of 476 pairs of different factions above 0.75 (archer/spitter 0.93, mage/wailer 0.89, hexer/bursar 0.90); 2 of 52 pairs in a faction above 0.85 (wailer/wight 0.92, warrior/shieldbearer 0.88) | different faction: under 0.75; same faction: under 0.85                                                                                  |
| **Types not on a person's body**, by faction         | `MONSTER_TYPES` rig and style                                                                                      | Rot 0, Hollow 0, Choir 0, Gilded 0                                                                                                                                                                                | at least one in every faction                                                                                                            |
| **Attack shapes met**, by band                       | sim report: share of attacks by shape                                                                              | strike 100%                                                                                                                                                                                                       | no shape over half of a faction's attacks                                                                                                |
| **Behaviour coverage**                               | a data test: every type has an active ability or a non-strike shape                                                | 9 have neither, 11 passive only                                                                                                                                                                                   | none without                                                                                                                             |
| **Distinct silhouette classes met**, per ten maps    | silhouettes clustered by distance                                                                                  | to measure                                                                                                                                                                                                        | at least 8 from map 20                                                                                                                   |
| **Build matrix spread**, per type                    | `scripts/matrix.ts`: time to kill under eight reference damage profiles at levels 10, 30 and 60 (6.2)              | about none except seven types                                                                                                                                                                                     | every type but the Warrior has a hard and a soft profile; each element soft for 2 factions and hard for 2; mean within 15% of `lifeMult` |
| **Stat bands occupied**                              | speed (4 bands) and reach (4 bands) from `MONSTER_TYPES`; a data test                                              | reach: two bands empty; speed: one band has one type                                                                                                                                                              | three types per speed band, two per reach band                                                                                           |
| **Archetypes and movement styles met**, per ten maps | sim report: distinct archetypes and styles among the monsters met                                                  | styles: 1 (walk) plus the blinkers, leapers and chargers                                                                                                                                                          | at least 8 archetypes and 6 styles from map 20                                                                                           |
| **Targets**                                          | share of monsters that go for minions first; share of types with a non-default sense                               | 0%                                                                                                                                                                                                                | the Hunters and the taunt exist on at least 3 factions' maps                                                                             |
| Deaths by faction, win rate, speed                   | as in ENEMIES.md 9                                                                                                 | 22% (greedy bot), one faction at most 35% of deaths                                                                                                                                                               | win rate 10 to 25%, no faction over 35%, x9 green                                                                                        |

The silhouette check is a test and a report. The test compares types in the same faction and in different ones against the
limits above once V1 lands; before that it only reports, so V0 can merge. The mask rasteriser is in
`src/render/style/silhouette.ts` (a 48×60 grid of 2-unit cells, a point test per primitive), and `npm run sheet -- out.svg
--report` draws the sheet and prints the most alike pairs. The pairs above are the "before".

A human check is part of every visual milestone: the sheet at zoom 1 with the colours turned off, and a screenshot of a map
in each theme at 360 px (MOBILE.md), to answer one question: **could I tell what this is?**

---

## 9. Order and dependencies

```
V0 tooling ─┬─ V1 body styles ── V2 rigs ──────────────────────────────┐
            │                                                           │
            └─ V3 attack shapes ── V4 archetypes, defences              ├─ V7 additions ─┬─ V8 the Drowned ───┐
                                    └─ V5 movement, senses              │                └─ V9 the Emberborn ─┴─ V10 integration
                                        └─ V6 tempo, state, packs ──────┘
```

V1 and V3 are independent and may run in either order. V1 is first because it is the visible complaint and carries the
least risk to balance; V3 changes combat and needs the bot for tuning. V4 follows V3 because it retunes every type's numbers
once, with the shapes in place; V5 and V6 need V4's archetypes (a movement style is an archetype's). V7 onward add types, and
each new type is an archetype pick, so the later the better.

---

## 10. Milestones

Each ends with `npm run check`, `npm run build`, the contact sheet, a bot sample for sim changes (section 8), a note in
`docs/PROGRESS.md` and, for a decision, DESIGN.md Appendix A. Sizes: S under a day, M a few days, L about a week.

| #   | Milestone                | What                                                                                                                                                                                                                                                                                                                                                                                    | Size |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| V0  | Tooling and the baseline | `scripts/sheet.ts` and its smoke test; the silhouette-distance function and a report-only test; "before" numbers in this document; `stance` on the type, with `poseFor` reading it (nothing changes); a test that records hero and Ossuary primitives byte for byte                                                                                                                     | M    |
| V1  | Body styles              | `bone`, `flesh`, `spectre` out of the `hero` boolean; the 17 types move; faction garb; palette values for `skin`, `cloth` and `metal` per faction; gaits and deaths for the three styles; the bone-budget and silhouette tests turned on                                                                                                                                                | L    |
| V2  | Non-humanoid rigs        | `bloat`, `toad`, `orb`, `crawler` and `worm` rigs with gaits and deaths; Bloater, Spitter and Wisp move to them                                                                                                                                                                                                                                                                         | L    |
| V3  | Attack shapes            | `attackShape`, `monsterSkill` from it, telegraphs for wedge, lane and ring, `hazardAt` shape-aware, the card strings and tags; shapes for the types in 5.2; starting damage budgets from the bot                                                                                                                                                                                        | L    |
| V4  | Archetypes and defences  | `archetype` and the defence fields on `MonsterTypeDef`; the sixteen archetypes in `data/archetypes.ts`; the profiles of 6.2 and 6.6 as mods; the `hitCap` clamp; `scripts/matrix.ts` and its test; the card and inspect strings; every existing type retuned once, with 5.2's shapes in place; the stat-band and spread tests                                                           | L    |
| V5  | Movement and senses      | `sim/movement.ts` and per-monster `mv` state; the styles of 6.3 in the order walk, momentum, skitter, swoop, lurch, orbit, tether, follow, kamikaze, then cover, phase, hop and flee-return (and the `veil` rule of 6.4) (burrow waits for V8; `kite-keep` and `retreat` are reworked from the old `kite` flag); the senses and `pickTarget` of 6.4; tells for each; the x9 floor rerun | L    |
| V6  | Tempo, state and packs   | attack patterns in `startAction`; `phases` for any type (enrage, flee, split, shell) and expiries; flank, hold the line, leapfrog, guard bubble and rally in `sim/packs.ts`; Mirrored and Warding Pulse                                                                                                                                                                                 | L    |
| V7  | Additions                | the seven types of 7.1 with their rigs (`heap`, `bell`, `spider`, `chest` as needed), archetypes, abilities, theme weights, kits for the chiefs                                                                                                                                                                                                                                         | M    |
| V8  | The Drowned              | the faction of 7.2: `pull` and `burrow` coded, the pulled-character rule, four types, themes, a chief, an essence, a palette                                                                                                                                                                                                                                                            | L    |
| V9  | The Emberborn            | the faction of 7.3: `trail`, `rain`, four types, themes, a chief, an essence, a palette                                                                                                                                                                                                                                                                                                 | L    |
| V10 | Integration              | re-measure (8), rebalance, decide the Briar, update ENEMIES.md (a note at 6.1 and 14.4), DESIGN.md, a phone look at zoom 1 in every theme                                                                                                                                                                                                                                               | M    |

---

## 11. Risks

| Risk                                                              | Answer                                                                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Art cost: 22 types move bodies and ten rigs are new               | Styles are parameters on one rig, not 22 drawings; a rig is 30 to 60 primitives; the sheet makes review fast; a first cut may ship with a type tinted.             |
| `flesh` looks like a slightly different skeleton                  | The silhouette distance catches it, and the garb in 4.1 changes the outline (robes to the ground, plate, a hunch), not the interior.                               |
| Spectres read as "the skeleton, fading"                           | No legs and a trailing tail change the outline in the first row of pixels; the sheet is checked at zoom 1 with the colour off.                                     |
| Attack shapes change the balance                                  | The damage budget is the type's `dmgMult`, spread over the shape; V3, V4 and V10 re-measure with the bot and the lethality script; a shape can ship as `strike`.   |
| The bot cannot dodge, so telegraphs read as extra damage          | `hazardAt` learns lanes and wedges; the shapes the auto-dodge cannot represent are marked and cost less (5.3).                                                     |
| Flanking breaks pathing or slows the sim                          | Slots are chosen on the 0.25 s tick, fall back to the character when a path is blocked, and the x9 floor is rerun before and after.                                |
| A pulled character is stuck in a pull loop                        | A short engage delay after a pull, and a cooldown that the Tidecaller shares across its pack; a test with five Tidecallers.                                        |
| More types make the card and the threat model wrong               | Tags and strings derive from data (ENEMIES.md 5.1, 7.3); a data test asserts every shape and ability has a string.                                                 |
| Seeds shift: a faction roster change alters the maps it generates | Offers are stored, so a run in progress is unaffected (ENEMIES.md 11); ids are never renamed.                                                                      |
| Defences and archetypes raise the difficulty                      | Paid for in life, held by the build matrix (6.2); the bot and the lethality script re-measure at V4 and V10.                                                       |
| Movement styles slow the sim or strand monsters                   | State is per monster and updated on the notice tick except the momentum ramp; randomness is a hash, not a stream; the x9 floor and a stuck-monster test run at V5. |
| Targeting minions makes minion builds miserable                   | Only Hunters and the taunt do it, they are named on the card, and the bot's minion class is part of the V5 sample.                                                 |
| Too many knobs: the roster becomes a spreadsheet                  | A type is an archetype plus at most three deviations (6.6); a type that needs more is a champion, not a type.                                                      |
| A movement style is invisible, so it reads as lag                 | Each style ships with its tell (6.3); a style without one does not ship.                                                                                           |
| Hero figures change by accident when `hero` is factored out       | V0 records the hero and Ossuary primitives; V1 must match them.                                                                                                    |

---

## 12. Edits on approval

- `docs/ENEMIES.md`: a note at 6.1 ("reopened by ROSTER.md") and at 14.4, and a line in section 7.4 for the factions built.
- `docs/DESIGN.md`: Appendix A, the body styles, the bone rule, attack shapes and the telegraph rule; section 12 (monsters)
  for the `style`, `stance`, `attackShape`, `gait`, `archetype`, defence, movement, sense, `pattern` and `phases` fields.
- `CLAUDE.md`: a pointer to this plan beside ENEMIES.md, and, when V0 lands, one line for `scripts/sheet.ts`.

## 13. Open questions (defaults in effect until answered)

1. **Is bone the Ossuary's alone?** Default: yes. The alternative is to let the Rot keep exposed bone in places, which
   weakens the rule.
2. **Do the Hollow lose their legs?** Default: yes (`spectre`). It is the strongest single change to a faction's outline.
3. **How many new factions?** Default: two, a third (the Briar) if the pipeline is cheap. The Veiled is the hardest to read.
4. **Do harder attacks pay?** Default: no; rewards follow the area level.
5. **Should the Codex show the roster?** A "Bestiary" tab drawing each type with the same primitives would let the player learn
   the silhouettes before a map, and costs little once the sheet exists. Default: not in this plan; a one-line addition to V10.
6. **Do chiefs get their own bodies?** Default: no, a signature prop each (4.2 and section 3).
7. **How much of 5.2 ships first?** Default: the `volley`, `sweep`, `slam` and `orb` shapes in V3; `lob`, `lance` and `nova`
   follow once `hazardAt` handles delayed ground, lanes and rings, since those are the three that ask the auto-dodge for
   something new.
8. **Do defences make types differ enough, or too much?** Default: paid for in life, with every type but the Warrior hard
   to one profile and soft to another. A stronger answer is to widen the 25% to 40%; the matrix makes it a number.
9. **Should monsters ever go for minions on purpose?** Default: yes, for the Hunter and the taunt only. The alternative is to
   leave targeting as it is and give minion builds nothing new to answer.
10. **How far should movement go?** Default: the seventeen styles of 6.3, V5 shipping the nine cheapest first. `burrow` and
    `veil` are the two that most change how a map plays, and need the most tells.
11. **Is sixteen archetypes too many?** Default: sixteen, as a menu; a faction needs only four of them. Merging Gunner and
    Skirmisher, or Assassin and Ambusher, loses little.

---

## 14. Progress

Built in the order of section 10, one commit a milestone, each with the full test suite and `npm run build`. The numbers are
read from `npm run sheet -- --report`.

| #      | State                 | What was built                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V0** | done                  | `npm run sheet` (`scripts/sheet.ts`, `src/render/style/sheet.ts`): an SVG of every type from the game's own primitives, with scale, flat colour, poses and columns as options; `src/render/style/silhouette.ts` (a 48×60 mask, intersection over union, `pairScores`); `stance` on the type and `poseFor` taking it; a snapshot that pins every hero and Ossuary primitive; the "before" numbers in section 8. `__dev.monsters(ids, { fight })` puts types in front of a frozen character in the real renderer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **V1** | done                  | `BodyStyle` (`bone`, `flesh`, `spectre`) in `data/monsters.ts` with `bodyStyleOf`; `buildLiving` in `figure.ts` for the two new styles; `src/render/style/bodies.ts` (garb by faction and type: Rot, Choir, Gilded, Kennel and Hollow, what a type holds); gaits and deaths by style (a flesh body falls and stays, a spectre glides and unravels); the `throw` stance (Spitter, Slinger); kits cleaned for spectres; spectres leave no body (`leavesBody`: nothing for a Hag to raise). The Ossuary and the heroes are byte for byte as they were. Pairs of different factions above 0.75 fell from 19 to 2 of 476; pairs in a faction above 0.85 from 2 to 1 (the Warrior and the Shieldbearer, which the pin keeps as they are until V4).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **V2** | done, except two rigs | Three rigs that are not a person: `bloat` (Bloater: a swollen body on stub legs that waddles and deflates), `toad` (Spitter: hops, rears, a throat sac that swells as it winds up) and `orb` (Mana Wisp: a flame with three tails that drifts and pops, `noBody`); gaits and deaths in `rigPose` (`figure.ts`); the kit entries these types had on the skeleton are gone. Between factions no pair of types is above 0.75 any more (0 of 476). **Not built yet:** the `crawler` and `worm` rigs, which wait for the types that use them (V7 and V8), so that no rig stands unused.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **V3** | done, with changes    | Attack shapes: `src/data/shapes.ts` (the library, with a card string and a threat tag each), `shape` on the type, `withShape` and `shapeMods` in `calc/monster.ts` (the shapes are the player's own behaviours: a melee arc, a burst, a beam, a projectile), `lockAim` so that a wedge, a ring or a lane stops following the character a way into the wind-up, and `src/sim/telegraph.ts` (the warning read off the monster's action, once a tick) which both the renderer draws (a wedge, a ring or a lane that fills, in the colour of the damage) and `hazardAt` reads, so the character's auto-dodge steps out of it. A lob opens a lasting zone through `openZone`, so it is a ground effect the dodge already knew. Types: Brute and Rend-boar and Flagellant swing, Archer and Slinger loose a salvo, Mage casts an orb, Spitter and Hag lob, Wailer and Sentinel nova, Arbalest lances. The inspect card names the shape and the camp card has three new tags (Ground attacks, Salvos, Lanes). **Changes from the plan:** the code says `swing` and `salvo` (the reference game has gems called Sweep and Volley, and `ip.test.ts` stops them); a salvo is two shots, not three (an action repeats once); a melee type stays a melee type whatever its shape (the AI reads the type's `attack`, so a Sentinel walks up to its nova); the Wailer's reach fell to 3 and the Arbalest's rose to 10. **Not built:** the Hexer's sigil (needs a zone that applies a hex), the Slinger's hobbling stone, and a type that uses `slam` (the Sentinel keeps its ability slam).                                                                                                                                                                                                                                                                                                                                             |
| **V4** | done, with changes    | Archetypes and defences: `src/data/archetypes.ts` (sixteen, each with an envelope of toughness, damage, speed and reach that a data test holds every type to), `archetype` and `defence` on every type, `src/data/defence.ts` (a profile of armour, evasion, energy shield, resistances, physical reduction, immunities, regeneration, a carapace and stun threshold; `FACTION_DEFENCE`, the signature of each faction; `defenceMods`, which turns a profile into the mods a monster's build already reads; `defenceTexts` for the cards), `src/calc/matrix.ts` and `npm run matrix` (the eight probes, from combat's own formulas), and a carapace (`hitCap`) in `hit()`. **A defence is paid for in life by construction:** a type's `lifeMult` is its toughness, and `buildMonster` divides it by the profile's mean durability, so no table of life values has to be kept by hand (`lifeMult` is still what `threat.ts` reads). The camp card says what a map is hard and soft to (`themeLeans`), and the inspect card names the archetype and the defences. **Changes from the plan:** the archetypes are called `rager` and `cutthroat` (the reference game has ascendancies named Berserker and Assassin); the Kennel Hound is the Hunter; the numbers of 6.6 were starting values, and the early Ossuary (Brute, Archer, Mage, Shieldbearer) are kept close to what they were, because a pass over 24 seeds showed the first map is no place for a stronger Brute (7 of 24 Mystic runs died on it, against 3 before); the Mage's reach is 9 and the Arbalest's 9, since the character engages from 9 tiles and nothing should outrange that; the Hollow's ethereal rule moved from `FACTION_MODS` into the faction profile (and is paid for in life). Defence for the new factions waits for them.                                                                                                                |
| **V5** | done, with changes    | Movement and senses: `src/data/movement.ts` (the styles and the senses a type can have, with the text of each for the inspect card), `src/sim/movement.ts` (a style says where to steer, how fast, or whether to stand still; the pathing and the stepping stay in `ai.ts`; randomness is a hash of the actor and a counter), the state on the actor (`mv`, `phases`, `revealT`). **Styles built:** `lurch` (Shambler), `momentum` (Brute, Rend-boar, Sentinel, Core Golem: it gathers speed and a stun or a slow resets it), `skitter` (Gnawer), `swoop` (Carrion Bat, Kennel Hound), `orbit` then `kamikaze` (Mana Wisp), `tether` (Shieldbearer to its archers and mages, Censer-bearer to the Choirmaster, Bone Beetle to a Nest, Gilded Guard to a Bursar), `follow` (Choirmaster, Bursar, Lantern Wight), `kamikaze` (Bloater), `phase` (the Hollow pass through walls), `cover` (Stalker Cat: it steps out of sight after a blow), `hop` (defined, used from V8). **Senses built:** `aggro` (Brute 7, Arbalest 14), `alert` (Gnawer and Nest 12), `leash` (Wailer 3, Gloomstalker and Hound never), `target: minions` (Hound), `veil` (Gloomstalker: drawn at 15% and ignored by the character until within 2.5 tiles or just after it strikes, blinks or is hit). A blow or a stun is the cue a style takes, looked at before the monster decides to strike again. **Changes from the plan:** a tether holds for three seconds and then lets the monster out for six (a Shieldbearer that only held its ground stalled a bow character for good: its shield blocks arrows from the front); `momentum` is called "Gathering speed" on the cards (the reference game has a gem called Momentum). **Not built:** `burrow` (V8), `kite-keep` and `retreat` as knobs of the old `kite` flag, `flee-return` as a style (the Cutpurse keeps its steal), noise as a way to wake, and the `nearest` and `weakest` targets. |
| **V6** | done, with changes    | Tempo, state and packs: `pattern` (a rhythm of blows: each beat is a multiple of the attack time and the damage follows it, so the pace is kept; Flagellant quick-quick-heavy, Archer and Slinger two quick and a pause, Hound), `phases` (`src/data/phases.ts`, `src/sim/phases.ts`: `enrage` for the Rend-boar at 40% and the Flagellant at 50%, `flee` for the Hag and the Handler at 30%, `split` ready for the Charnel Heap), `src/sim/packs.ts` (flanking for the Kennel's and the Swarm's melee members: a slot on a 120 degree arc round the character; a ranged member keeps behind its front; **rally**: when a pack's support or special type falls the Kennel frenzies, the Choir falters, the Swarm scatters), and the two mods of 7.5: **Warding Pulse** (every 8 s a ring that throws the character back three tiles, drawn and dodged like a slam) and **Mirrored** (a twin; kill one and the other is made whole unless the second falls within three seconds). Enraged monsters are tinted red. **Changes from the plan:** the packs are rebuilt four times a second into the same objects (a room of forty asked forty times a tick, and the speed floor showed it); the Swarm's skitterers and tethered monsters keep their own steering rather than flanking; `MonsterStats.kind` holds the type definition for the hot paths. **Not built:** leapfrog, the guard bubble drawn on the ground, expiries on summoned monsters, and the `shell` phase.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **V7** | done                  | Seven types in the factions that exist, each on a body that is not a person: **Bone Crawler** (Ossuary swarm, `crawler` rig: a skeleton's top half on its hands; skitters, its grip slows the character), **Charnel Heap** (Ossuary front, `heap` rig: a mound of skulls; slams, gathers speed, falls apart into three Crawlers), **Gorger** (Rot front, the `bloat` rig with a maw: swings its arms, and eats a body within reach to heal a quarter of its life: the new `devour` ability), **Hollow Watcher** (Hollow ranged, a great eye on the `orb` rig: lances a lane, curses, steps behind cover), **Tolling Bell** (Choir support, `bell` rig: hangs in the air, tolls in a ring that staggers, drives its allies on), **Silkspinner** (Swarm ranged, `spider` rig: lobs webs, a slowing ground effect, and keeps behind the pack) and **Lurking Coffer** (Gilded special, `chest` rig: lies still until you are within four tiles, then bites; it drops two and a half times the usual). New: `minLevel` on a type (the Heap is not met below map 18, the Crawler waits for map 4: `ThemeMix` carries the level through the pack and population code), `hobbles` and `bonusLoot` as traits of a type, a death-split phase, and five rigs with gaits. Between factions no pair of silhouettes is above 0.75. The Swarm and the Reliquary still field three archetypes; the Swarm now has four with the Silkspinner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
