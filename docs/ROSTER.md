# Bob — Roster Plan: bodies, attacks and new enemies

Status: **plan, 2026-10-08. Nothing is built.** It follows [ENEMIES.md](ENEMIES.md) (built, E0 to E7), which fixed _who you
meet_ and _what the card says_. This plan is about what is still the same once you are in the map: how the enemies look,
how they attack and how they move. It reopens one decision of ENEMIES.md (6.1, "the body stays the posed skeleton") and says
so in section 3. Defaults are in section 12; the user can overturn any of them.

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
3. **Why the tests let it through (section 2.3).** The "no two types share a silhouette" test compares JSON, so two skeletons
   that differ by one hat pass it.

The plan has five parts, in this order of value for the work:

| Part                   | What                                                                                                                                                               | Section |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **Bodies**             | Three body styles (bone, flesh, spectre), bone only for the Ossuary; one non-humanoid rig for every faction that has none; gaits and death animations by style     | 4       |
| **Attack shapes**      | A field on the type that picks how it attacks: sweep, slam, lob, volley, lance, nova. Each has a telegraph the character's auto-dodge can read                     | 5       |
| **Behaviour**          | Reworks of 13 existing types, and packs that flank and hold a line instead of queueing                                                                             | 6       |
| **New enemies**        | Seven additions to existing factions (each on a rig that is not a person) and two new factions, the Drowned and the Emberborn, with the Briar as an optional third | 7       |
| **Measuring** (first!) | A contact sheet, a silhouette-distance check that means something, and the "before" numbers                                                                        | 8       |

Order of work: tooling and the baseline (V0), body styles (V1), non-humanoid rigs (V2), attack shapes (V3), behaviour
(V4), additions (V5), the Drowned (V6), the Emberborn (V7), integration (V8). V1 is the answer to the complaint as it
stands, and can ship alone.

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

---

## 3. Decisions to reopen

| Decision                                      | Default in this plan                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENEMIES.md 6.1: "BodyKind stays the skeleton" | **Reopened.** Three body styles; bone only for the Ossuary. Recorded in DESIGN.md Appendix A when built.                                           |
| Do existing types move to new rigs?           | Yes where it fits (Spitter, Bloater, Wisp); the Hollow stays on a body style (4.1). Ids and stats do not change.                                   |
| How many new factions?                        | Two committed (the Drowned, the Emberborn), one optional (the Briar). The Veiled of ENEMIES.md 7.4 stays out.                                      |
| New enemies in the old factions               | Seven (section 7.1), each on a rig that is not a person.                                                                                           |
| Champions and chiefs                          | Keep their type's body and gain a signature prop (a kit), not a new body. The Regent stays the crowned skeleton.                                   |
| Do attacks get harder?                        | No change to damage budgets: a type's `dmgMult` is spread over its new shape (a volley's arrows share the base hit). Balance is re-measured in V8. |
| Is a telegraph always required?               | Yes for any shape that is not a strike or a single projectile. A shape the auto-dodge cannot see is marked in the card and costs less.             |
| Where do the per-type rows live?              | In `data/monsters.ts` next to the stats: `style`, `stance`, `attackShape`, `gait`. No new table.                                                   |
| Sim speed                                     | The x9 floor (400 sim-seconds a second) stays green; flanking is computed per pack on the 0.25 s notice tick, not per frame.                       |

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
strikes and bolts**. After V3 and V5 every faction has at least two shapes, and no shape is more than half of what a
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

## 6. Behaviour

### 6.1 Existing types that change

Each row keeps the type's id, stats and role. Cost: S is a parameter change on an existing ability, M a new ability.

| Type          | Today                       | Proposed                                                                                       | Question it asks                 | Cost |
| ------------- | --------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- | ---- |
| Bat           | stays adjacent and bites    | **swoops**: a pass, a bite, then a retreat of three tiles and another pass                     | being hit while it cannot be hit | M    |
| Gnawer        | walks in                    | **skitters**: a zig-zag run, and each takes a different side of the character                  | area damage that aims            | M    |
| Wisp          | walks in                    | drifts in a curve and **pops** (a small nova of mana drain) when killed                        | killing it at range              | S    |
| Gloomstalker  | blinks every 6 s            | adds **veil**: translucent until it blinks or is within two tiles                              | seeing it at all                 | M    |
| Shambler      | slow melee, rises           | leaves a short **rot trail** as it walks (a thin caustic strip)                                | not fighting where it came from  | M    |
| Bloater       | bursts on contact           | swells as it nears; the burst radius is the telegraph, and it bursts early if shot at range    | range, ground                    | S    |
| Cutpurse      | takes a flask charge, flees | flees to a **chosen exit**, not just away, and a second thief takes the other flask            | kill order                       | S    |
| Guard         | reflects 15% melee          | adds **taunt**: minions in reach attack it instead of the character                            | minion builds                    | M    |
| Censer-bearer | aura                        | the censer **tolls** when allies near it die (a short nova that heals)                         | killing the bearer first         | S    |
| Choirmaster   | channel heal                | **sings** while channelling: its allies move at a steady pace in step (a faction-wide haste)   | interrupting it                  | M    |
| Hound         | leaps from 7 tiles          | leaps then **circles**: a hound that has missed a leap strafes for two seconds before the next | burst, area                      | M    |
| Handler       | whistle, kites              | adds **mark**: the hounds all attack what the handler marked for six seconds                   | killing the handler              | M    |
| Warden Pylon  | protect                     | the pylon **links**: a visible line to each protected ally, which breaks when the ally dies    | readability of the protection    | S    |

### 6.2 Packs that fight as packs

A pack today shares nothing but an alert (`alertPack`). Three small behaviours, in `sim/packs.ts`, computed on the existing
0.25 s notice tick:

- **Flank.** Each melee member of a pack chooses a **slot** on a 120° arc round the character when it starts to chase, and
  paths to its slot's point instead of the character. The pack arrives from several sides and so differs from the queue,
  without a change to damage. Weight by faction: the Kennel and the Swarm flank, the Reliquary and the Ossuary do not.
- **Hold the line.** A ranged member keeps a distance behind the nearest front-role member of its pack, not behind the
  character, so a `line` template does what its name says. A `kite` type ignores this.
- **Rally.** When the leader of an `escort` dies, the followers react by faction: the Kennel's hounds frenzy, the Choir's
  falter (a short stun), the Swarm's scatter. One line of data per faction.

Cost M for the three; the risk is sim speed and a stuck pack, so the packs tests (`packBehaviours.test.ts`) get a flank case
and the x9 floor is rerun before and after.

---

## 7. New enemies

Names are ours and are checked against `src/data/ipDenyList.ts` (none of the names below is on it; `ip.test.ts` is the
gate). Each type gets a rig or a body style from section 4, a shape from section 5 and a one-line question.

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

ENEMIES.md 7.4 has the design and 14.4 says `pull` is declared and not coded (V6 codes it). Visually: a wet palette, a sheen
on every surface, drips as particles; not a skeleton anywhere.

| Type (role)              | Rig / style      | What it does                                                                                         |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Tidecaller** (support) | `spectre`        | a hooked chain; every 8 s drags the character three tiles toward it (`pull`, with a visible chain)   |
| **Wrack** (front)        | `flesh`, bloated | a heavy `sweep`; its hits slow the character (the hobbling hit of the Hobbling mod)                  |
| **Brine Leech** (swarm)  | `toad` (slug)    | crawls onto the character, sticks, drains life; shaking it off takes a hit that kills it             |
| **Drowner** (special)    | `worm`           | submerges into a puddle (untargetable), moves under the character and rises with a `slam` (`burrow`) |

The Tidecaller is the first enemy that moves the character, so V6 includes the auto-dodge's answer: a pulled character
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
Emberborn show the pipeline is cheap (V8 decides).

### 7.5 Monster mods

ENEMIES.md 7.2 listed six and built three (14.1); **Mirrored** and **Warding Pulse** remain, and V4 builds them because
they apply to every faction: a mirrored rare makes a second body that must be killed with it (a test for single-target
DPS), and Warding Pulse knocks the character back every 8 s (a test for channelled and melee builds).

---

## 8. Measuring

"Variety is measured, not asserted" (ENEMIES.md 1). V0 records the **before** column; each milestone records its own.

| Measure                                           | How                                                                                                                | Today (V0 records exactly)                          | Target                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------- |
| **Body style share**, by band of ten maps         | head count of what the bot met (`npm run sim` variety table, new column)                                           | bone is every type on maps 1–5; most of the rest    | bone ≤ the Ossuary's share (25% from map 25)            |
| **Silhouette distance**, pairwise                 | rasterise the idle and mid-walk figure to a 40×56 mask, compare with overlap (intersection over union), no palette | to measure; many pairs expected above 0.9           | different faction: under 0.75; same faction: under 0.85 |
| **Types not on a person's body**, by faction      | `MONSTER_TYPES` rig and style                                                                                      | Rot 0, Hollow 0, Choir 0, Gilded 0                  | at least one in every faction                           |
| **Attack shapes met**, by band                    | sim report: share of attacks by shape                                                                              | strike 100%                                         | no shape over half of a faction's attacks               |
| **Behaviour coverage**                            | a data test: every type has an active ability or a non-strike shape                                                | 9 have neither, 11 passive only                     | none without                                            |
| **Distinct silhouette classes met**, per ten maps | silhouettes clustered by distance                                                                                  | to measure                                          | at least 8 from map 20                                  |
| Deaths by faction, win rate, speed                | as in ENEMIES.md 9                                                                                                 | 22% (greedy bot), one faction at most 35% of deaths | win rate 10 to 25%, no faction over 35%, x9 green       |

The silhouette check is a test and a report. The test compares types in the same faction and in different ones against the
limits above once V1 lands; before that it only reports, so V0 can merge. The mask rasteriser is a few dozen lines (a point
test for each primitive) and lives with the test.

A human check is part of every visual milestone: the sheet at zoom 1 with the colours turned off, and a screenshot of a map
in each theme at 360 px (MOBILE.md), to answer one question: **could I tell what this is?**

---

## 9. Order and dependencies

```
V0 tooling, baseline, stance ─┬─ V1 body styles ── V2 rigs ──┬─ V5 additions
                              │                               ├─ V6 the Drowned ─┐
                              └─ V3 attack shapes ── V4 behaviour ┘   V7 the Emberborn ─ V8 integration
```

V1 and V3 are independent and may run in either order. V1 is first because it is the visible complaint and carries the
least risk to balance; V3 changes combat and needs the bot for tuning.

---

## 10. Milestones

Each ends with `npm run check`, `npm run build`, the contact sheet, a bot sample for sim changes (section 8), a note in
`docs/PROGRESS.md` and, for a decision, DESIGN.md Appendix A. Sizes: S under a day, M a few days, L about a week.

| #   | Milestone                | What                                                                                                                                                                                                                                                                | Size |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| V0  | Tooling and the baseline | `scripts/sheet.ts` and its smoke test; the silhouette-distance function and a report-only test; "before" numbers in this document; `stance` on the type, with `poseFor` reading it (nothing changes); a test that records hero and Ossuary primitives byte for byte | M    |
| V1  | Body styles              | `bone`, `flesh`, `spectre` out of the `hero` boolean; the 17 types move; faction garb; palette values for `skin`, `cloth` and `metal` per faction; gaits and deaths for the three styles; the bone-budget and silhouette tests turned on                            | L    |
| V2  | Non-humanoid rigs        | `bloat`, `toad`, `orb`, `crawler` and `worm` rigs with gaits and deaths; Bloater, Spitter and Wisp move to them                                                                                                                                                     | L    |
| V3  | Attack shapes            | `attackShape`, `monsterSkill` from it, telegraphs for wedge, lane and ring, `hazardAt` shape-aware, the card strings and tags; shapes for the types in 5.2; starting damage budgets from the bot                                                                    | L    |
| V4  | Behaviour                | the reworks in 6.1; flank, hold the line and rally in `sim/packs.ts`; Mirrored and Warding Pulse                                                                                                                                                                    | L    |
| V5  | Additions                | the seven types of 7.1 with their rigs (`heap`, `bell`, `spider`, `chest` as needed), abilities, themes weights, kits for the chiefs                                                                                                                                | M    |
| V6  | The Drowned              | the faction of 7.2: `pull` coded, `burrow`, the pulled-character rule, four types, themes, a chief, an essence, a palette                                                                                                                                           | L    |
| V7  | The Emberborn            | the faction of 7.3: `trail`, `rain`, four types, themes, a chief, an essence, a palette                                                                                                                                                                             | L    |
| V8  | Integration              | re-measure (8), rebalance, decide the Briar, update ENEMIES.md (a note at 6.1 and 14.4), DESIGN.md, a phone look at zoom 1 in every theme                                                                                                                           | M    |

---

## 11. Risks

| Risk                                                              | Answer                                                                                                                                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Art cost: 22 types move bodies and ten rigs are new               | Styles are parameters on one rig, not 22 drawings; a rig is 30 to 60 primitives; the sheet makes review fast; a first cut may ship with a type tinted.      |
| `flesh` looks like a slightly different skeleton                  | The silhouette distance catches it, and the garb in 4.1 changes the outline (robes to the ground, plate, a hunch), not the interior.                        |
| Spectres read as "the skeleton, fading"                           | No legs and a trailing tail change the outline in the first row of pixels; the sheet is checked at zoom 1 with the colour off.                              |
| Attack shapes change the balance                                  | The damage budget is the type's `dmgMult`, spread over the shape; V3 and V8 re-measure with the bot and the lethality script; a shape can ship as `strike`. |
| The bot cannot dodge, so telegraphs read as extra damage          | `hazardAt` learns lanes and wedges; the shapes the auto-dodge cannot represent are marked and cost less (5.3).                                              |
| Flanking breaks pathing or slows the sim                          | Slots are chosen on the 0.25 s tick, fall back to the character when a path is blocked, and the x9 floor is rerun before and after.                         |
| A pulled character is stuck in a pull loop                        | A short engage delay after a pull, and a cooldown that the Tidecaller shares across its pack; a test with five Tidecallers.                                 |
| More types make the card and the threat model wrong               | Tags and strings derive from data (ENEMIES.md 5.1, 7.3); a data test asserts every shape and ability has a string.                                          |
| Seeds shift: a faction roster change alters the maps it generates | Offers are stored, so a run in progress is unaffected (ENEMIES.md 11); ids are never renamed.                                                               |
| Hero figures change by accident when `hero` is factored out       | V0 records the hero and Ossuary primitives; V1 must match them.                                                                                             |

---

## 12. Edits on approval

- `docs/ENEMIES.md`: a note at 6.1 ("reopened by ROSTER.md") and at 14.4, and a line in section 7.4 for the factions built.
- `docs/DESIGN.md`: Appendix A, the body styles, the bone rule, attack shapes and the telegraph rule; section 12 (monsters)
  for the `style`, `stance`, `attackShape` and `gait` fields.
- `CLAUDE.md`: a pointer to this plan beside ENEMIES.md, and, when V0 lands, one line for `scripts/sheet.ts`.

## 13. Open questions (defaults in effect until answered)

1. **Is bone the Ossuary's alone?** Default: yes. The alternative is to let the Rot keep exposed bone in places, which
   weakens the rule.
2. **Do the Hollow lose their legs?** Default: yes (`spectre`). It is the strongest single change to a faction's outline.
3. **How many new factions?** Default: two, a third (the Briar) if the pipeline is cheap. The Veiled is the hardest to read.
4. **Do harder attacks pay?** Default: no; rewards follow the area level.
5. **Should the Codex show the roster?** A "Bestiary" tab drawing each type with the same primitives would let the player learn
   the silhouettes before a map, and costs little once the sheet exists. Default: not in this plan; a one-line addition to V8.
6. **Do chiefs get their own bodies?** Default: no, a signature prop each (4.2 and section 3).
7. **How much of 5.2 ships first?** Default: the `volley`, `sweep`, `slam` and `orb` shapes in V3; `lob`, `lance` and `nova`
   follow once `hazardAt` handles delayed ground, lanes and rings, since those are the three that ask the auto-dodge for
   something new.
