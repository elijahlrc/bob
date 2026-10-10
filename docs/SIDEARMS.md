# Bob — Sidearms: ranged and ground attacks for the melee monsters

Status: **plan, 2026-10-09. Nothing is built.** Written from the code as it stands. Decisions that need the user are in
section 8; the plan takes the stated defaults until they are answered.

---

## 1. The problem

From the user, 2026-10-09: most enemies run at the character and hit it in melee. The interesting encounters are the ones
with slow projectiles, ground AOEs and debuffs on the character. Add behaviours to the **existing** types, rather than new
types, so that they use them.

What the code says (read from `MONSTER_TYPES` and `TYPE_WEIGHTS`, 48 types):

- 32 types are melee (`attack: 'melee'`). Most of the heaviest weights are among them: Warrior 50, Gnawer 50, Hound 45,
  Shambler 40, Leech 40, Cinderling 40, Golem 35, Guard 35, Gloomstalker 35.
- A melee type has **one** skill, built once in `calc/monster.ts` (`monsterSkill`), and `monsterAI` (`sim/ai.ts`) does one
  of two things with it: walk to the character, or strike it. Only the abilities (leap, charge, blink, slam) add anything,
  and they are all closing moves.
- The machinery for the interesting attacks already exists, but it is attached to **one skill per type, and that skill is
  the type's only one**. ROSTER.md V3 built `swing`, `salvo`, `orb`, `lob`, `nova`, `slam` and `lance` (`data/shapes.ts`),
  with telegraphs (`sim/telegraph.ts`) that the character's auto-dodge reads, and lasting ground zones (`openZone`,
  `GroundEffect`). The ranged types use them; a melee type cannot, because using a shape would replace its melee strike.
- Debuffs on the character exist but are thin: the Hobbling mod and `hobbles` trait (30% slow for 2 s, `combat.ts`
  `onMonsterHitPlayer`), the Hexer's hexes (`hexPlayer`), the Wisp's mana drain, chill and poison through damage and
  `chance.*` mods, the Cutpurse's flask steal, and the Tidecaller's pull. Almost none of them is on a common type.

So the gap is not the engine. It is that a type has no way to have **both** a melee attack and a ranged one.

---

## 2. The idea: a sidearm

A type may have a **sidearm**: a second attack, with its own shape, range window, timer and damage, used **while the
character is out of melee reach**. The melee strike stays the type's main attack. A sidearm is what the monster does on the
way in, instead of only walking:

- a Warrior stops and hurls a bone spear that flies slowly;
- a Shambler retches a pool of caustic bile onto the character's feet;
- a Cutpurse scatters burrs that slow what stands in them;
- a Golem throws a boulder.

Once the character is within reach, or the sidearm is on its timer, the monster closes and strikes as before. It is a
**tempo and positioning** change: a pack arrives staggered by its own throws, and the character has things to step around
while it fights the front.

```ts
type SidearmSpec = {
  shape: ShapeSpec; // orb, salvo, lob, lance, nova or slam: the library of data/shapes.ts, unchanged
  every: number; // seconds between uses (the first after a random part of it, so a pack does not throw together)
  from: number; // tiles: not used closer than this (it is a melee type: it closes instead)
  to: number; // tiles: not used farther than this
  time?: number; // the wind-up, seconds (default the type's attack time)
  convert?: Element; // the damage type of the sidearm, when it is not the type's
  effect?: SidearmEffect; // what it does to the character besides damage
  minLevel?: number; // not used on maps below this level
};
type SidearmEffect = 'hobble' | 'hex' | 'drain' | 'chill' | 'shock' | 'poison';
```

Everything in `shape` is existing: `mult` (a share of the type's hit), `radius`, `zone`, `seconds`, `dps`, `speed`, `lock`.
A sidearm adds no new combat code for the shapes; the new code is choosing when to use one and carrying an effect.

### 2.1 Why not give them `attack: 'projectile'`

A ranged type stops at its range and shoots. That makes the type a different type (it kites, it holds back in a `line`
template, the AI takes another branch). The user's complaint is that **melee types do nothing at range**, not that melee
types should be archers. A sidearm keeps the melee identity and the pack shape, and it is data on the type.

---

## 3. How it is built

### 3.1 Data (`src/data/monsters.ts`, `shapes.ts`)

`sidearm?: SidearmSpec` on `MonsterTypeDef`. `SidearmEffect` and its card text live next to `SHAPE_INFO`.

### 3.2 The profile (`src/calc/monster.ts`)

`MonsterStats` gains `sidearm?: { profile: (conds) => SkillProfile; spec: SidearmSpec }`. It is built in `buildMonster` the
same way as the main profile, with three differences, all contained in one new function:

1. The base skill is a projectile **spell or attack** (the type's attack kind is melee, so the base is chosen by the shape:
   `orb`/`salvo`/`lance` an attack, `lob`/`nova`/`slam` also an attack, since a melee type's hit is physical).
2. It uses its **own `ModDB`**: the type's mods plus the sidearm's (`shapeMods` for an orb's slow flight or a salvo's
   repeat, a `convert` and the ailment chance for its effect). Today `shapeMods(t)` writes into the type's one shared DB, and
   a salvo's `repeats` would repeat the melee blow too, so the sidearm cannot reuse that DB. The extra DB is built only for
   types that have a sidearm.
3. The damage is `monsterHit × dmgMult × shape.mult` as for any shape; `time` sets the wind-up.

The cache key does not change (the sidearm is a property of the type).

### 3.3 The AI (`src/sim/ai.ts`)

One new step in the melee branch of `monsterAI`, before the walk and after the "in reach: strike" test:

```
if sidearm and timer ready and not acting and from <= d <= to and line of sight:
    startAction(w, m, 'monster', sidearm.profile(conds), target); reset the timer
```

- A new field `sideT` on `Actor` (`sim/types.ts`, `sim/actor.ts`) is the timer. It is counted down every tick (cheap) and the
  distance and line-of-sight tests run only when it is ready.
- While the action runs the monster is acting and does not walk (as every wind-up today), which is the telegraph window.
- A monster that is stunned, frozen, held in `m.windT`, dashing or in `ambush` is already excluded by `monsterAI`'s early
  returns.
- A sidearm is never used by a monster that is withdrawing, fleeing or leashing.
- The target is the character (or its minion by the existing `targetOf` rule).

### 3.4 What comes free

- **Telegraphs and the auto-dodge.** `telegraph.ts` reads `act.profile.skill.behaviour`, so a `lob`, `nova`, `slam` or `lance`
  sidearm draws its warning and `hazardAt` steps out of it. An `orb` or `salvo` is a projectile the character sees.
- **Zones.** A `lob` opens a ground zone with `openZone`, already a hazard, already drawn.
- **Hits.** `hit()` and the projectile code are unchanged.

### 3.5 What is new beyond the choice of attack

- **Effects.** `onMonsterHitPlayer(w, src)` is called from `hit()` for any monster hit, and has no profile. It gains the
  profile (or a flag on the skill, `SkillDef.debuff`), and handles the effects: `hobble` as today's, `hex` through
  `hexPlayer`, `drain` mana as the Wisp does. `chill`, `shock` and `poison` are chance mods in the sidearm's DB, handled by
  the ordinary ailment code, so they need no new rule.
- **Pose.** The renderer chooses a pose from the type's `stance`. A sidearm needs a throw or cast pose on a melee body.
  The `use` event carries the skill id, so the sidearm's id (`monster_<type>_side`) lets `paint.ts` pick `throw`/`cast` for it
  and the type's own for the main attack. To confirm in S1: the exact hook in `render/styles/grim/paint.ts`.
- **Cards.** The inspect card (`Hud.tsx`) lists `shapeText(shape)`; it gains a sidearm line, and `themeInfo.ts` counts a
  sidearm's shape toward the camp card's threat tags (`Ground attacks`, `Salvos`, `Lanes`) and a new `Debuffs` tag.

---

## 4. Who gets what

The principle: each melee type gets **at most one** sidearm, chosen for its fiction and its faction's question, so that
the common types differ from each other. The fodder that exists to be numbers (Gnawer, Bat, Leech, Crawler, Cinderling,
Hound, Wisp) stays plain: a pack needs plain members, and a swarm that throws would be a barrage.

| Type (faction)     | Sidearm                            | Shape and numbers (start)                                  | Asks of the build                   |
| ------------------ | ---------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| Warrior (Ossuary)  | Hurls a bone spear                 | `orb` speed 0.55, mult 0.9; 4–9 tiles; every 8 s           | stepping aside; projectile defences |
| Shambler (Rot)     | Retches caustic bile onto the feet | `lob` caustic r1.3, 3 s, dps 0.2, mult 0.4; 3–8; every 9   | leaving ground; chaos resistance    |
| Gorger (Rot)       | Spits a gobbet that poisons        | `orb` mult 0.7, effect `poison`; 3–8; every 8 s            | poison; chaos resistance            |
| Censer-bearer      | Flings burning coals               | `lob` burning r1.4, 3 s; 3–7; every 8 s                    | leaving ground; fire resistance     |
| Flagellant (Choir) | Cracks a lash                      | `lance` length 5, width 0.8, mult 0.8; 2.2–5; every 5 s    | stepping out of a line              |
| Golem (Reliquary)  | Throws a boulder (its element)     | `orb` speed 0.45, mult 1.2; 3–10; every 9 s                | seeing it coming; its element       |
| Cutpurse (Gilded)  | Scatters burrs that slow           | `lob` chilling "scattered burrs" r1.5, 4 s; 3–8; every 8 s | speed; leaving ground               |
| Guard (Gilded)     | Heaves a weighted chain: hobbles   | `orb` mult 0.6, effect `hobble`; 3–7; every 9 s            | speed                               |
| Wrack (Drowned)    | Flings a clot of brine that slows  | `orb` mult 0.7, effect `hobble`; 3–7; every 8 s            | speed                               |
| Slag Brute (Ember) | Hurls molten slag                  | `lob` burning r1.6, 4 s; 3–8; every 9 s                    | leaving ground; fire resistance     |
| Gloomstalker       | Throws a shade that curses         | `orb` mult 0.5, effect `hex`; 4–10; every 10 s             | curse immunity; killing it first    |
| Brute (Ossuary)    | Stamps a ring of shock             | `slam` r2 at the feet, mult 1.3; 3–6; every 10 s           | stepping out of a ring              |

Numbers are starting values (section 5 and S6). That is 12 types with sidearms. The Sentinel, Rend-boar, Hound and Cat keep
the tricks they have (slam and nova, charge, leap). By weight this reaches the most common non-swarm melee types (Warrior, Shambler, Golem, Guard, Gloomstalker, Flagellant, Censer,
Wrack). It does **not** reach the swarm fodder, which is the point.

### 4.1 The existing ranged types

The ranged types already shoot, but four of them shoot a plain bolt and have the notes in ROSTER.md "not built":

| Type    | Change                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Slinger | Its stones hobble (the `hobble` effect on its salvo; ROSTER.md 5.2 asked for it)                                                                                     |
| Hexer   | Its hex becomes a **sigil**: a ground zone that hexes whoever stands in it (needs the zone to apply a hex; the one genuinely new mechanic in the plan, milestone S4) |
| Handler | A thrown net: `lob` of slowing ground on the character, then it kites                                                                                                |
| Spinner | (already lobs webs)                                                                                                                                                  |

### 4.2 Rare and magic monsters

A rare may roll a sidearm it does not have (a mod `Throwing`: a plain-hurl orb at a 10 s timer). Optional, milestone S5.

---

## 5. Budget and safety

- **Damage.** A sidearm's expected damage is `hit × mult / every` per second while the character is in its window, which is
  about 4 to 15% of the melee rate (`hit / attackTime`) at the numbers above. It replaces the walk rather than the strike, so
  it adds pressure on the approach and costs the monster about a second of closing per use. The step-aside and ground rules
  mean most of it can be avoided. This adds up for a big pack, so the table's `every` values are deliberately long, and the
  first throw is randomised per monster.
- **Zones stack.** Several Shamblers lobbing bile in a room could carpet the floor. Rule: a pack member does not start a
  `lob` sidearm if another zone of the same kind from its pack is open within 3 tiles of the aim. (A check on `w.effects`,
  made only when the timer is ready.)
- **Speed.** The check is a cooldown decrement per melee monster with a sidearm, and the distance and line-of-sight tests only
  when it is ready. The x9 floor (`x9.test.ts`) must stay green; the plan runs it before and after S1.
- **First maps.** The early Ossuary (Warrior from map 1) throws from the start. To keep the first three maps readable, the
  Warrior's sidearm waits for map 4 and the Brute's for map 10 (a `minLevel` on the `SidearmSpec`, read where the sidearm
  profile is built), the same idea as the type-level `minLevel` of the Crawler and the Heap.
- **No `Math.random`.** Timers use `w.rngAi`, as the leap and the whistle do.
- **Sims.** None while building (the user's standing preference). One 24-run bot sample at the end, to see whether anything
  moved radically, and only if its result would change the next step.

---

## 6. Milestones

Each ends with `npm run check` and the x9 floor, and a commit of my own files only (the tree is shared).

| #   | Milestone                    | What                                                                                                                                                                                                                          |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | The mechanism, with one type | `SidearmSpec`; the sidearm profile and its DB in `calc/monster.ts`; `sideT` and the AI step; the pose hook; the Warrior's spear. Tests: profile built, spear fires in its window and never in melee, telegraphed shapes tell. |
| S2  | Ground sidearms              | `lob` and `slam` sidearms (Shambler, Censer, Slag Brute, Cutpurse, Brute); the zone-stacking rule; `hazardAt` covers them. Tests: the character's dodge leaves the zone; two packmates do not stack.                          |
| S3  | Effects                      | The `effect` on a sidearm and `onMonsterHitPlayer` taking the profile: `hobble`, `hex`, `poison` (Gorger, Guard, Wrack, Gloomstalker, Slinger's stones). Tests per effect, including immunity (`cannotBeChilled`).            |
| S4  | The Hexer's sigil            | A zone that applies a hex while the character stands in it; the Handler's net. Tests.                                                                                                                                         |
| S5  | Cards, tags and the rest     | Inspect-card line, camp-card tags (`Debuffs`, sidearm shapes counted in `themeInfo.ts`), `threat.ts` counting a sidearm in `pressure`, the optional `Throwing` mod, docs (ROSTER.md 14, ENEMIES.md 7, PROGRESS.md).           |
| S6  | One sample                   | One bot sample of 24 runs; the deaths by type, to see that no sidearm is the top killer. Tuning is in the table.                                                                                                              |

S1 is the one that decides whether the idea works. If you want to see only a first slice, **S1 plus the Shambler's bile
from S2** is the smallest thing that shows a projectile and a ground effect on common types.

---

## 7. Risks

| Risk                                                                            | Answer                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Too much damage from range on top of the melee                                  | Long timers, a small `mult`, a random first throw, a window that excludes melee range; S6 measures it. |
| Zones carpet a room                                                             | The stacking rule in section 5.                                                                        |
| A pack that throws stops advancing, so melee and ranged build skills swap sides | A throw costs about a second per monster per 8 to 9 s; the pack still arrives.                         |
| The renderer draws a throw as a strike                                          | The sidearm's skill id selects the pose (section 3.5); a render test pins it.                          |
| The extra DB per monster costs memory                                           | Built only for the 12 types; the monster cache is about 5,300 builds after a whole run (ENEMIES 14.3). |
| Seeds shift                                                                     | Timers use the AI stream; maps and packs are generated as before. Saved runs are unaffected.           |
| The early game gets harder                                                      | The Warrior's sidearm starts at map 4; the first three maps are unchanged.                             |

---

## 8. Open questions (defaults in effect until answered)

1. **Is a sidearm per type right, or should the melee types share a small set** (a `throw`, a `gout`, a `snare`) by
   archetype? Default: per type, as the table; it keeps types distinct.
2. **Should the fodder (Gnawer, Hound, Cinderling) stay plain?** Default: yes.
3. **Should a Brute and a Warrior throw at all in the Ossuary?** The Ossuary is the baseline and the first maps. Default: the
   Warrior from map 4 and the Brute from map 10.
4. **Do harder maps pay more?** Default: no change to rewards.
5. **How much of this in one go?** Default: S1, S2 and S3 together (the mechanism, the ground attacks and the effects), then
   look; S4 to S6 afterwards.
