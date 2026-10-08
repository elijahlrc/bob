# Bob — Enemy Variety and Difficulty Plan

Status: **built, 2026-10-08 (E0 to E7).** Written 2026-10-07 from the code as it stood; section 14 says what was built, what
changed on the way and what the bot measured. Decisions the plan makes by default are in section 13; the user can overturn
any of them.

---

## 0. Summary

The game already has six factions and 25 monster types, faction behaviours, counterplay mods and a threat model. The
player still meets mostly skeletons, and cannot tell before a map what else is in it. So the problem is **distribution**
and **legibility** first, **appearance** second, and **new content** last.

1. **Distribution (section 4).** Five of the ten base themes are Ossuary (skeleton) themes available from map 1 with no
   upper bound, and every faction theme is still 30 to 50% Ossuary. A random theme is a skeleton theme about 74% of the time
   at map 15 and 34% at map 40 and after. Every gate boss and the final boss are skeletons. The plan caps and shrinks the
   Ossuary, brings the factions in earlier, gives the offer set rules (three offers, different leaders), and draws a map's
   monsters in **pack templates** by role instead of one independent roll per monster.
2. **Legibility (section 5).** The camp card shows the theme name, bonus, affixes and a verdict, and **not one monster
   type, faction or damage type**. `threat.ts` already computes the damage mix and the element shares; they never reach the
   screen. The plan puts factions, the damage mix, named types and threat tags on the card, and the same facts on the
   inspect card and the death recap.
3. **Appearance (section 6).** 17 of the 25 types are drawn with one of four humanoid bodies and differ by tint, and an
   element tint overrides the faction tint. The plan adds per-type kits (head, shoulder, weapon, accessory shapes),
   a palette that survives the element, and a test that no two types share a silhouette.
4. **Gameplay (section 7).** A table of the questions a build can be asked, which the roster asks today, and the holes
   (mobility, sustain denial, crowd control, reflect and decoys, true ranged kiting). A data-driven **ability** layer
   replaces the per-type `switch` in `sim/factions.ts` so new types are mostly data, and two new factions fill the largest holes.
5. **Difficulty controls (section 8).** Three settings, **scaling** (how fast monsters grow with level), **base** (a flat
   multiplier at every level) and **variance** (a seeded spread between maps and packs), editable from a debug panel,
   stored in the run, available to the bot. The **baseline moves substantially harder**: scaling defaults to a value
   above today's curve (1.5 after measuring, section 14).

Order of work: measure and plumb the difficulty model (E0), debug panel and the harder baseline (E1), distribution (E2),
legibility (E3), appearance (E4), the ability layer (E5), new factions (E6), integration (E7).

---

## 1. Goals and principles

From the user, 2026-10-07:

- More **visual** and more **gameplay** variety in the enemies the player meets.
- Skeletons are not the primary antagonist, and **no single type is**.
- Different enemy categories challenge different builds in different ways: damage types, resistances, attack styles,
  movement styles, the number of enemies, curses and so on.
- On joining a map, the player has an idea of which enemy types are in it, and can use it to choose.
- Difficulty scaling is **substantially harder** at baseline, with debug controls for scaling, base difficulty and variance.

Principles the plan keeps from [EXPANSION.md](EXPANSION.md) 7.1: a threat is **specific** (it punishes one strategy),
**answerable** from at least two systems, **visible before the map**, **readable on screen** and **explainable after a
death**. Two more:

- **Data first.** A new type or faction is a row in `MONSTER_TYPES` and `TYPE_WEIGHTS` plus abilities from a library, and
  the bot, the threat model, the card and the tests pick it up for free. Code per type is the exception.
- **Variety is measured, not asserted.** Section 9 defines the numbers (share of enemies met by faction, deaths by
  faction and type) and the targets. A change that does not move them has not done its job.

---

## 2. Where things stand (read from the code, 2026-10-07)

### 2.1 The roster

6 factions, 25 types:

| Faction     | Types                                           | From map | Question it asks (EXPANSION 7.3)       |
| ----------- | ----------------------------------------------- | -------- | -------------------------------------- |
| Ossuary     | Warrior, Brute, Archer, Mage, Shieldbearer      | 1        | none (the baseline)                    |
| the Rot     | Shambler, Bloater, Spitter, Carrion Hag         | 8        | chaos, poison, corpses                 |
| the Swarm   | Gnawer, Carrion Bat, Bone Beetle, Nest          | 12       | numbers                                |
| the Hollow  | Gloomstalker, Wailer, Mana Wisp, Lantern Wight  | 15       | physical stops working; mana, accuracy |
| the Choir   | Hexer, Censer-bearer, Flagellant, Choirmaster   | 25       | hexes, buffs, heals: kill what first?  |
| Reliquary   | Sentinel, Arbalest, Core Golem, Warden Pylon    | 35       | armour and immunity                    |
| (mixed, 10) | two of the five new factions at 50/50, any pair | 40       | both                                   |

Each type has life, damage, speed, range and an attack kind (melee, projectile, spell), plus a few flags (`flies`,
`stationary`, `noAttack`, `innate`, `elemental`). Rare and magic monsters roll from 30 counterplay mods. Bosses and
champions have scripted behaviour (`tickChampion`).

### 2.2 Why it is skeletons (_measured_ from the tables in `src/data/themes.ts`)

`rollThemes` (`src/run/offers.ts`) picks three different themes uniformly from `themesFor(map)`. The share of enemies that
are skeletons on a randomly chosen theme:

| Maps  | Themes in the pool                           | Skeleton share |
| ----- | -------------------------------------------- | -------------- |
| 1–7   | five Ossuary themes                          | **100%**       |
| 8–11  | + Charnel Pits (Rot 70, Ossuary 30)          | 88%            |
| 12–14 | + Gnawing Warrens (Swarm 70, Ossuary 30)     | 80%            |
| 15–24 | + Hollow Vigil (Hollow 70, Ossuary 30)       | 74%            |
| 25–34 | + Ashen Nave (Choir 60, Ossuary 40)          | 70%            |
| 35–39 | + Reliquary Vault (Reliquary 60, Ossuary 40) | 68%            |
| 40+   | + ten mixed themes (no Ossuary)              | 34%            |

So until map 40 skeletons are about 70 to 100% of what a player meets, and the first seven maps contain nothing else.
Gnawer packs (8 to 14 extra per room) make the Swarm higher by head count than these theme shares say.

Other causes:

- **No bound on the Ossuary themes.** They never leave the pool (`fromMap` only says when a theme starts).
- **Rooms are a random mix.** In `populate` every monster rolls its own type (`rollType`), so a room is the faction's
  average, never "four brutes, two archers and a priest". Rooms in different factions differ in tint more than in play.
- **Gate fights.** `endKindForMap` makes every tenth map a mini-boss (the faction's champion on a faction theme, a random
  type otherwise), and map 100 is the Ossuary Regent, a Skeleton Warrior (`BOSS_NAME`, `type: 'warrior'`).
- **The Ossuary has no question.** Every other faction has a stated question; the Ossuary is the filler.

### 2.3 What the player is told

`src/ui/Camp.tsx` (the offer card): theme name, level and offset, map type, `bonusText`, affixes with rewards, "For you:
DPS × and effective HP ×", and a verdict chip. EXPANSION 7.4 and 9 promised "factions, element, notable drops, the threat
preview"; only the last arrived, as two ratios. `src/run/threat.ts` computes, per theme, the share of damage by type
(`mix`), the share of monsters by element (`variants`) and a `pressure` number. None of it is shown.

### 2.4 What the player sees

`src/render/style/figure.ts` has 12 body kinds. Eight belong to the Swarm and the Reliquary (their own rigs); **17 types
share four humanoid bodies** (warrior, brute, archer, mage). In `src/render/styles/grim/index.ts` a monster with an
element is tinted by the element and only a plain monster gets the faction tint, so an element Ossuary monster takes its
element colour and a Rot monster is its faction's green. Faction identity on the humanoid rigs is therefore one multiply
tint, and where an element applies it replaces the faction's colour.

### 2.5 How behaviours are written

Faction behaviour is a `switch (type)` in `tickFactionBehaviour` (`src/sim/factions.ts`: hag, gloomstalker, nest,
sentinel, censer, hexer, choirmaster, wight), with the Bloater in `monsterAI`, the Gnawer pack in `populate`, the
Shieldbearer in `shieldBlocks` and champions in `tickChampion`. Every new behaviour is code in three or four files. That is
the real cap on variety, and section 7.3 addresses it.

### 2.6 How difficulty is set

Constants, not settings (`src/data/constants.ts`): `monsterLife(m) = 20 · 1.055^m + 12m`, `monsterHit(m) = 2 + 0.085 · m^1.5`,
accuracy, evasion and armour linear in `m`, and an early ease (`EASE_LEVEL` 20: life ×0.5 and damage ×0.6 at map 1,
full by map 20). `buildMonster` (`src/calc/monster.ts`) calls these with the monster's area level; the same functions are
used by `threat.ts` (`levelHardness`), `Character.ehp` (the reference hit) and the minion bodies (`calc/minion.ts`). There
is no setting, no per-run difficulty, and no randomness between maps beyond the offer offsets of ±2 levels.

---

## 3. Decisions to reopen

The plan takes the defaults in section 13 unless the user says otherwise. The ones that change the most:

| Decision                                 | Default in this plan                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Retire the Ossuary themes?               | No: down-weight them and cap them at one per offer set (section 4.2).              |
| Bosses                                   | Every gate mini-boss is a champion of its theme's faction; the Regent stays.       |
| Do harder settings pay more?             | No. Rewards follow the area level only.                                            |
| Who sees the debug panel?                | Dev builds and any build opened with `?debug`.                                     |
| Old saves                                | Keep the old curve (scaling 1, base 1, variance 0). New runs get the new baseline. |
| How many new factions in the first pass? | Two (section 7.4).                                                                 |

---

## 4. Distribution: who you meet

### 4.1 Target shares

Share of **enemies met** (by head count over a run), measured by the bot (section 9), not shares of themes:

| Maps  | Ossuary at most | Any one other faction at most | Note                                                           |
| ----- | --------------- | ----------------------------- | -------------------------------------------------------------- |
| 1–3   | 100%            | 0%                            | The first three maps stay readable (the tutorial).             |
| 4–9   | 60%             | 30%                           |                                                                |
| 10–24 | 40%             | 30%                           |                                                                |
| 25+   | 25%             | 25%                           | No faction is the new "primary antagonist" over a long window. |

A window is any ten consecutive maps. The two limits together are the answer to "there ought not be a single primary
antagonist type".

### 4.2 Rules

1. **Ossuary themes get a weight, not a place in the pool.** `ThemeDef` gains `weight` (default 1) and `rollThemes`
   picks without replacement by weight. Ossuary-only themes weigh 1 until map 3, then fall to 0.5 by map 10 and 0.25
   from map 25. A weight, not a `toMap`, so an Ossuary map is still possible at map 60, but a rare and notable one.
2. **Factions come in earlier** (to be set by the bot, section 9; starting points): the Rot at 4 (from 8), the Swarm at 6
   (from 12), the Hollow at 9 (from 15), the Choir at 15 (from 25), the Reliquary at 25 (from 35), mixed themes at 30
   (from 40). Each lead faction's own difficulty (`FACTION_PRESSURE` in `threat.ts` is 1.2 to 1.3) means this makes the
   game harder; section 8 and the milestones account for it.
3. **Less Ossuary inside faction themes**: 70/30 and 60/40 become 85/15 (the Ossuary supplies fodder and a few archers,
   not a third of the enemies). The mixed themes stay pure faction pairs.
4. **The offer set has rules.** `rollThemes` returns three themes with **different leading factions as far as the pool
   allows, then no repeated theme**, and at most one Ossuary-led theme from map 4 when the pool has another to give. It
   draws from the seeded stream in order and skips a theme that breaks the rule, so a reload gives the same set. The choice
   is then between different questions, which is the choice the player is asked to make.
   **The pool must be wide enough for this.** Each non-Ossuary faction has exactly one theme today, so with the rule alone
   maps 9 to 14 would offer nearly the same three themes every level (one Ossuary theme, Charnel Pits, Gnawing Warrens, and
   Hollow Vigil, taken two at a time), and maps 4 and 5 have only the Rot to set against the Ossuary. E2 therefore adds
   **one or two extra themes per faction**, differing as the five Ossuary themes do (element leaning, type weighting,
   bonus, floor and wall colours): for example a Rot theme leaning to Spitters and Hags (chaos from range) and one to
   Bloaters and Shamblers (a melee crush), a Hollow theme leaning cold and one leaning to Wisps (mana pressure). Until a
   second theme exists the Rot may appear twice in an early set, and §4.1's target for maps 4 to 9 is read with that.
5. **Pack templates.** `populate` stops rolling each monster alone. A faction defines **roles** for its types (`front`,
   `ranged`, `support`, `special`, `swarm`) and a handful of **templates** (a room is a pack, and a pack is a template):

   | Template    | Shape                                               | Example (Rot)                        |
   | ----------- | --------------------------------------------------- | ------------------------------------ |
   | Escort      | one `support` or `special` with `front` guards      | a Hag with four Shamblers            |
   | Firing line | `ranged` at the back, `front` between               | two Spitters behind three Shamblers  |
   | Swarm       | many `swarm`, nothing else                          | ten Gnawers; today's Gnawer pack     |
   | Ambush      | dormant until the character is in the room's centre | Bloaters round a doorway             |
   | Mixed arms  | roughly one of each role                            | today's behaviour, now the exception |
   | Patrol      | a pack that walks a loop between two rooms          | a Choir procession                   |

   Templates use `TYPE_WEIGHTS` inside a role, so the type weights still tune a type's frequency. A room that is a Firing
   line behaves differently from one that is an Escort, in the same faction and the same level, which is variety no new
   type provides. Ambush and Patrol need a small AI addition (a dormant state; a waypoint loop) and are in E5. The map types keep their own rules: a **Throng** (all normal monsters) uses templates but no
   `special` roles or rares, a **Quarry** puts its champion in each room and draws the trash around it from a template,
   and a **Holdout** wave is one template per wave.

6. **Gates.** Every gate mini-boss is the champion of its theme's faction. Ossuary themes get their own champion (the
   Bone Warden, a Skeleton Warrior champion; our name, checked by `ip.test.ts`) with a mechanic of its own: it raises a ring of Warriors at
   each third of its life. Map 100 stays the Regent (the final boss is deliberately the baseline), and the Regent's
   escort is drawn from the **last theme's** faction instead of nothing.
7. **Companions (optional, off by default).** A faction theme may take a seeded companion faction per map (the lead at
   60%, a companion at 25%, the Ossuary at 15%), shown on the card. Off by default because it makes the card's
   promise less exact; E7 may switch it on if the bot shows maps are too uniform.

### 4.3 The Ossuary's question

The Ossuary gets a question so that it stops being the default: **stuns, blocks and projectile lines**. The Shieldbearer
already blocks projectiles from its front arc, and Brutes carry `stunDamage`; the Archers fire in a line. The plan adds
nothing new here beyond the Bone Warden, and names the question on the card ("Asks: stun, block and arrows") so that an
Ossuary map is read like any other.

---

## 5. Legibility: what the card, the inspect card and the recap say

All of it is `run` and `ui`; `threat.ts` stays headless and gains one function. The facts are derived from data, so
a new type shows up on its own.

### 5.1 The offer card

Added between the map type and the affixes (see `src/ui/Camp.tsx`):

1. **Faction row.** A chip per faction with its share: `Rot 85% · Ossuary 15%`, each chip coloured as the monsters are
   (section 6.2) and shaped from a small set of glyphs so it does not depend on colour. A Respite shows none.
2. **Asks line.** One line per lead faction, from a one-line `asks` field on the faction: _chaos, poison, corpses_.
3. **Damage bar.** A thin stacked bar of `themeThreat(theme).mix` (physical, lightning, cold, fire, chaos) in the colours
   of `docs/VISUAL_LANGUAGE.md`, with the affix `gain` added on top (a map that adds extra chaos shows more chaos).
4. **Types.** The three or four types with the largest share, as named chips with a tooltip carrying the one-clause
   behaviour ("Bloater: bursts into a caustic cloud on contact").
5. **Threat tags**, derived from type flags and abilities, at most four, in a fixed order: `Ranged` (attack kind not
   melee, over 25% of enemies), `Swarm` (average pack over 8), `Hexes`, `Summoners`, `Spawners`, `Fliers`, `Blinkers`,
   `Healers`, `Ailments`, `Immunities`, `Drains`. A tag has a tooltip naming the answer ("Ranged: armour matters less
   than evasion and block").
6. **Resistance and defence flags**, only the ones that apply: `Ethereal: 50% less physical`, `Immune: fire` (a Core Golem
   map says which element it is). The existing affixes already say the same for affixes.
7. **Gate line** on a gate level: the champion's name and its one-line mechanic.

The "For you" line stays. It is extended with **where it comes from**: `Your chaos resistance −20% against 35% chaos
damage`, the one weakest axis from the character's defence profile and the map's `mix`. That uses data `ehp` already
works from.

Phones ([MOBILE.md](MOBILE.md)): the card is already the tallest element on the camp screen. The faction row, the damage
bar and the tags stay on the card; the type chips and the gate line go behind a "Details" disclosure at narrow widths.

### 5.2 In the map

- The **inspect card** (click an enemy) gains a type line: `Bloater (the Rot): bursts into a caustic cloud`, the
  abilities in words, and the faction rules (Ethereal and the others in EXPANSION 9).
- The **map HUD** shows the lead faction's name next to the level, so the player is never wondering.

### 5.3 The death recap

`DeathRecap` gets the killer's type, faction and ability name next to its mods, and the damage mix of the last five seconds
beside the map's predicted mix. A death that followed the card's warning says so.

---

## 6. Appearance

### 6.1 Silhouettes: kits on the humanoid rig

`BodyKind` stays the posed skeleton of limbs (it carries the gait and the attack poses). A type adds a **kit**: a list of
extra primitives attached to named body anchors (`head`, `shoulderL/R`, `back`, `handR/L`, `waist`) from the shapes the rig
already draws (circles, capsules, boxes, triangles).

| Type          | Kit                                                   |
| ------------- | ----------------------------------------------------- |
| Shambler      | hunched pose (a lower head anchor), trailing rags     |
| Bloater       | a swollen torso (a larger circle on the waist anchor) |
| Spitter       | a gaping jaw, a gland sack on the back                |
| Carrion Hag   | hood, crooked staff                                   |
| Gloomstalker  | long arms, no legs below the knee (it hovers), a veil |
| Wailer        | a trailing lower body, an open mouth                  |
| Lantern Wight | a lantern on the hand anchor, which also is its light |
| Hexer         | a pointed hood, a book on the hand anchor             |
| Censer-bearer | a chained censer that swings, with smoke              |
| Flagellant    | bare chest, a scourge                                 |
| Choirmaster   | a tall mitre, a raised hand                           |

The table covers the faction types on the humanoid rig. Still to design in E4: the Mana Wisp (a drifting flame or a
wisp of cloth), and the five Ossuary types, which are the baseline and need the most care since they are seen most: the
Warrior and the Shieldbearer are the same `warrior` body today, so the Shieldbearer's tower shield is not optional, and
the Brute, Archer and Mage each need a prop (cleaver, bow with a quiver, skull staff) that the faction types do not
copy. With the eight existing rigs of the Swarm and the Reliquary, that is a distinct shape for each of the 25 types,
not a distinct tint.

### 6.2 Palette that survives the element

Replace the multiply tint with: **faction palette for the body** (a palette swap of the body roles, not a tint), and the
**element as an accent** (eyes, weapon glow, ground aura, a particle trail), so a Burning Shambler is still read as the
Rot and as fire. The faction colours are the same as the chip colours of section 5.1.

### 6.3 Movement and tells

Variety in how things move is part of looking different. Per type: a `gait` (walk, lurch, skitter, hover, glide, stomp)
that sets the pose timing and the dust, the **telegraph** of its special (already present for the slam and the blink),
and a size scale in the sprite. Fliers and ethereal types are drawn slightly translucent with a bob. New abilities arrive
with their tell, or they do not ship (principle: readable on screen).

### 6.4 Test

Extend `src/render/style/creatures.test.ts`: every `MonsterTypeId` builds in every pose with finite shapes, **no two types
have the same idle signature**, and every faction has a palette. The test fails when a type is added without a kit.

---

## 7. Gameplay variety

### 7.1 What a build can be asked, and who asks it

| Question to the build                    | Asked today by                             | Hole                                                        |
| ---------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| Physical damage / armour                 | Ossuary, Reliquary (high armour)           | none                                                        |
| Elemental damage / resistances           | Element variants (random), Golems, Wailers | no faction is _about_ fire or lightning                     |
| Chaos / poison                           | the Rot                                    | none                                                        |
| Evasion, accuracy                        | Gloomstalker (evasion), Keen-eyed (mod)    | few enemies that are hard to hit but not blinkers           |
| Numbers (area damage, clear speed)       | the Swarm                                  | none                                                        |
| Single big targets                       | champions, Sentinels                       | none                                                        |
| Curses and hexes                         | the Choir                                  | no hexes outside the Choir, except mods                     |
| Mana                                     | Mana Wisp, Siphoning                       | none                                                        |
| Sustain (leech, regen, flasks)           | Bloodless, Vampiric (mods)                 | **no enemy attacks flasks or recovery by type**             |
| **Mobility**: being caught, being kited  | Gloomstalker blink, bats, fast Wisps       | **no leaper, charger or true kiter; archers retreat 0.8 s** |
| **Crowd control**: slows, roots, pulls   | none (only chill from Wailers and Hollow)  | **nothing that moves the character or holds it**            |
| Ground control                           | caustic and golem zones, slams             | few; zones are death-only or one-off                        |
| Reflect, decoys, deception               | Thorned (mod)                              | **no decoys, no dodge-or-reflect shells**                   |
| Positioning (turrets, spawners, shields) | Arbalest, Nest, Pylon                      | only the Reliquary and the Swarm do it                      |
| Healing and buffs (kill priority)        | Choirmaster, Censer, Wight, Pylon          | the Choir and the Reliquary only                            |
| Ambush and stealth                       | the Queen (champion)                       | **no ordinary enemy waits or hides**                        |

The bold rows are the holes. The pack templates (4.2) fill part of "positioning" and "ambush" with no new type.

### 7.2 New monster mods (data, mostly existing code paths)

Rare and magic mods are the cheapest variety, because they apply to every faction and the sim already reads them. Candidates,
each with the answer it invites:

| Mod (ours)     | Effect                                                            | Punishes                | Cost |
| -------------- | ----------------------------------------------------------------- | ----------------------- | ---- |
| Charging       | closes a gap with a fast rush after a telegraph                   | kiting, ranged builds   | H    |
| Leeching Flask | its hits remove a flask charge                                    | flask-dependent builds  | F    |
| Mirrored       | a second body appears at a distance; killing it removes the other | single-target, slow DPS | H    |
| Warding Pulse  | every 8 s a ring that knocks the character back                   | melee, channelling      | H    |
| Anchoring      | its hits slow the character by 30% for 2 s                        | evasion, speed          | F    |
| Twin           | the pack is two of the same rare                                  | burst                   | D    |

They are not all needed; E6 picks three. Names pass `ip.test.ts`.

### 7.3 The ability layer: why this makes variety cheap

Replace the `switch` in `tickFactionBehaviour` with a library of **abilities** a `MonsterTypeDef` lists:

```ts
type AbilityId =
  | 'blink'
  | 'leap'
  | 'charge'
  | 'burstOnContact'
  | 'raiseCorpses'
  | 'healChannel'
  | 'aura'
  | 'spawn'
  | 'slam'
  | 'dropZone'
  | 'drainMana'
  | 'drainFlask'
  | 'pull'
  | 'shell'
  | 'burrow'
  | 'kite'
  | 'hex'
  | 'decoy'
  | 'reflect'
  | 'curlUp'
  | 'summonOnHit';

type AbilityDef = {
  id: AbilityId;
  interval: number;
  telegraph?: number;
  params: Record<string, number>;
};
// MonsterTypeDef: abilities: AbilityDef[]   (the existing hard-coded ones become entries)
```

- Each ability is one function in `src/sim/abilities.ts` with a tell event for the renderer and a `describe()` string for
  the card and the inspect card (so 5.1 stays correct without writing text per type).
- The existing behaviours move over **one at a time**, each keeping its current constants (they are already named
  `*_INTERVAL` and so on in `factions.ts`). The existing tests (`factions.test.ts`, `wave2.test.ts`, `x8.test.ts`,
  `x9.test.ts`) are the characterisation: they must pass unchanged after each move.
- A champion is a type plus a mod plus a short script of abilities by life threshold; the two lists merge.
- `threat.ts` derives its tags and `FACTION_PRESSURE` from abilities, not a table by faction.

Cost: M (a few days of work), risk: regressions in the sim. Value: every later faction is a few rows.

### 7.4 Candidate factions

Names are ours and must pass `src/data/ip.test.ts`. Each is designed from a question the roster does not ask. Types
are listed by role.

| Faction (ours) | Question                                           | Types (role: behaviour)                                                                                                                                                                                                | Movement               |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| the Kennel     | being caught: mobility, burst, low stun resistance | Hound (swarm: leaps from range after a telegraph), Rend-boar (front: charges in a line, stuns), Handler (support: whistle gives hounds +speed; flees), Stalker Cat (special: pounces from a dormant ambush)            | leaps, charges, ambush |
| the Gilded     | sustain denial: flasks, leech, regeneration        | Cutpurse (special: takes a flask charge on hit and runs; kill it to get it back), Gilded Guard (front: heavy, reflects a share of melee), Bursar (support: aura that stops regeneration), Sling-archer (ranged: kites) | flees, kites           |
| the Drowned    | being held: slows, pulls, shock                    | Tidecaller (support: pulls the character 3 tiles), Wrack (front: slows on hit), Leech-swarm (swarm: sticks, drains life), Siren (ranged: shock bolts, wet makes shock hit harder)                                      | slow, pulling          |
| the Emberborn  | fire: ignite, burning ground, fire immunity        | Cinderling (swarm: bursts into fire on death), Kiln Brute (front: leaves a burning trail), Pyre Priest (support: lights ground under the character), Ash Archer (ranged: ignite)                                       | trails, bursts         |
| the Veiled     | deception: decoys, reflects, hidden attackers      | Mimic (special: appears as a copy of another type; when hit it reveals), Glass Knight (front: reflects a share of spell damage), Seer (support: creates two decoys), Cut-throat (ambush)                               | decoys, ambush         |

**First pass: the Kennel and the Gilded** (E6). They answer the two largest holes (mobility, sustain denial) and have the
most unlike movement. The Drowned follows for crowd control. The Emberborn is the cheapest and fills "no faction is about
fire", but fire is already covered by the element variants; it comes last. The Veiled is the hardest to read on screen.

A faction is also given: a theme with a bonus, a champion, its `asks` line, `FACTION_MODS`, a palette, 3 or 4 kits, a place
in the mixed themes and an essence drop. EXPANSION 7.3 is the template.

---

## 8. Difficulty controls

### 8.1 The model

Three settings, stored in `RunState.difficulty` and edited from the debug panel (8.3):

```ts
type Difficulty = {
  /** Monster strength grows this many "stat levels" per area level. 1 is the old curve. */
  scaling: number; // default 1.5 (measured, section 14)
  /** A flat multiplier on the hardness of every monster at every level. 1 is the old curve. */
  base: number; // default 1
  /** Seeded spread of hardness between maps and between packs, 0 to 0.6. */
  variance: number; // default 0.1
};
```

and one pure function of them, in `src/data/difficulty.ts`:

```
statLevel(area, d)  = 1 + d.scaling · (area − 1)                    // the level the existing curves are read at
hardness(d, noise)  = d.base · (1 + d.variance · noise)              // noise in [−1, 1]
life   = monsterLife(statLevel) · easeLife(area) · √hardness · ...   // as buildMonster today
damage = monsterHit(statLevel)  · easeDamage(area) · √hardness · ...
```

- **Scaling** is the slope: at 1.5, a level-40 monster has the life and damage of a level-59 one; at map 100 it has those
  of a level-149 one. It is applied to **life and damage only** by default. Accuracy, evasion and armour (the other
  `monster*` curves) stay on the area level: the player's accuracy and evasion are tuned against those, so scaling them too
  would add a second difficulty axis that falls on attack builds (they would lose hit chance and face more life) and not
  on spell builds. Whether to scale them is an open question (section 13, item 12).
- **Base** is the intercept: a multiplier that does not depend on the level. Life and damage get the square root each, so
  the combined hardness (life × damage) moves by `base`. The debug panel shows it as "×1.5 harder".
- **Variance**: `noise` is `0.6 · map + 0.4 · pack`, both uniform in [−1, 1] from the run's seeded stream
  (`fork('diff.' + offer.id)` for the map, then one draw per pack). At variance 0.3 the combined hardness of packs
  ranges about ±30% around the map's, and maps ±18% around the setting. Seeded, so a reload gives the same map. The
  per-map part is shown on the offer card as a chip (`Fierce`, `Even`, `Gentle`) whenever variance is above zero, so
  that variance is information and not noise (it is part of the choice).
- The **ease** (`EASE_LEVEL`) is read at the area level, not the stat level: the first maps stay approachable at any
  setting (a base of 3 still makes them hard).

What it does not touch: experience and loot (read at the area level), the `minLevel` gates on monster mods, affix
strengths, and the bodies of the player's minions (`calc/minion.ts` shares the formulas and must keep reading the area
level; a test pins it).

### 8.2 Plumbing

| Where                                      | Change                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `src/data/difficulty.ts` (new)             | `Difficulty`, `LEGACY`, `DEFAULT`, `statLevel`, `hardness`. Headless, pure.                                  |
| `MonsterSpec` (`calc/monster.ts`)          | gains `statLevel` and `power` (the hardness sample), both defaulted so old specs read as legacy.             |
| `monsterKey`                               | includes `statLevel` (rounded to a quarter) and `power` (rounded to a hundredth) so the cache stays correct. |
| `populate` (`gen/population.ts`)           | `PopulateOpts.difficulty`; sets the two fields on each spec, one `power` draw per pack from the map's rng.   |
| `Character.config` and `ehp`               | read the monster hit at `statLevel`, so the "For you" numbers stay honest; the bot's `levelHardness` too.    |
| `threat.ts`                                | `levelHardness`, `scoreTheme` take the difficulty.                                                           |
| `RunState`                                 | `difficulty`; the save loader gives old saves `LEGACY` (decision in section 3).                              |
| `scripts/simulate.ts`, `scripts/lethality` | flags `--scaling`, `--base`, `--variance`; the report prints them.                                           |
| Controller                                 | `setDifficulty` (camp only; applies from the next map; never mid-map).                                       |

No `Math.random`; the architecture rules in CLAUDE.md hold.

### 8.3 The debug panel

- `src/ui/Debug.tsx`, opened from a small "Debug" button on the Title screen and on the camp screen. It is shown only when
  `import.meta.env.DEV` or the URL has `?debug` (or the pref `bob.pref.debug` is set), so a published build does not show it.
- Three sliders with number boxes (scaling 0.5 to 2.5 step 0.05, base 0.25 to 4 step 0.05 on a log scale, variance 0 to 0.6),
  a **Reset to default** and **Legacy curve** button.
- A live table, so a setting is understood before it is used: stat level and relative hardness (vs the legacy curve) at maps
  10, 25, 50 and 100, a sample of a normal monster's life and hit at the current map, and the effect on "For you" for the
  current offers (they update at once, since they are previews).
- A run with non-default settings is marked in the summary ("Difficulty: scaling 1.5, base 1.0, variance 0.2") so a result
  is never read without its setting.
- At the Title screen the setting is a pref used by `newRun`; at the camp it is the run's.

### 8.4 The new baseline

"Substantially harder at baseline" means **the default, not just the slider**: a new run starts at scaling 1.5 (the plan started from 1.25; section 14 says why it moved).

- A scaling of 1.25 gives, for a normal monster, a combined hardness (life × damage; the early ease is the same at both
  settings and drops out of the ratio) of about ×1.45 at map 10, ×1.6 at map 20, ×2.0 at map 50 and ×4.4 at map 100 against
  the old curve (computed from the formulas in 2.6; the panel's table recomputes it). **1.5** gives ×2.0 at map 10, ×2.5 at
  map 20, ×3.9 at map 50 and ×20 at map 100, and is the default: 2.0 was too much (the bot won none of 24 runs).
- _Acceptance:_ with the same bot (`greedy`, six classes) the win rate falls to about **half** of today's (E0 records
  today's), the median map of death moves earlier by a fifth, and no class is below one clear at map 50. If the bot
  cannot win, the baseline is eased, not the acceptance. The final number is chosen in E7, after the roster
  changes of E2 and E6, which also raise difficulty (faction pressure 1.2 to 1.3 in `threat.ts`).
- **Rewards do not follow difficulty** (section 3). A harder baseline is a tighter game, not a richer one. Raising
  `base` in the panel is not a way to farm. If the user wants it to pay, the lever is an `xpMult` and `quantity` on the
  difficulty (a one-line addition) and the plan will write it.
- Old saves keep the legacy curve; a "Raise to the new curve" button in the panel is not offered (one way: start a run).

---

## 9. Measuring

`npm run sim` and `npm run lethality` already exist. E0 extends the report with:

- **Enemy share by faction and by type**, per ten-map band, as met (head count), for each run and in total. This is
  section 4.1's table, and E0 records the "before".
- **Deaths by killing faction and type**, and the clear rate and median clear time by faction (per band).
- **Variety index** per run: the number of distinct types met per ten maps, and the longest run of maps in which one
  faction supplies over 60% of the enemies.
- **The difficulty line**: the three settings, and win rate / median death map / clears at maps 50 and 80 by class.
- `lethality` gains `--scaling` and prints the level-43 character against every theme as now, at the chosen setting.

Targets (all from the bot, small samples are noise; E0 fixes the sample size, no fewer than 24 runs):

| Measure                                            | Target                                             |
| -------------------------------------------------- | -------------------------------------------------- |
| Enemy share by faction                             | section 4.1                                        |
| Share of deaths by one faction                     | at most 35% (as at X9)                             |
| Every faction the top killer of at least one class | yes                                                |
| Win rate, greedy bot, new baseline                 | 10 to 25% (E7 sets it from E0's)                   |
| Sim speed                                          | the x9 test (400 sim-seconds a second) stays green |

---

## 10. Milestones

Each ends with `npm run check`, `npm run build`, a bot sample (section 9), a note in `docs/PROGRESS.md` and any decision
in DESIGN.md Appendix A. Sizes: S under a day, M a few days, L about a week.

| #   | Milestone                           | What                                                                                                                                                                                                                                              | Size |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| E0  | Measure and plumb difficulty        | Section 9's report; `difficulty.ts`; `statLevel`/`power` on the spec; sim flags; legacy equivalence test (defaults = LEGACY give identical stats); baseline numbers.                                                                              | M    |
| E1  | Debug panel and the harder baseline | `Debug.tsx`, `Controller.setDifficulty`, save field, summary line, offer previews; set scaling as the default (1.5); measure; tune.                                                                                                               | M    |
| E2  | Distribution                        | Theme weights, earlier `fromMap`, 85/15 faction themes, one or two extra themes per faction so the offer-set rules have a pool to choose from (4.2), offer-set rules, gate champions for the Ossuary, pack templates (without Ambush and Patrol). | M    |
| E3  | Legibility                          | The card (5.1), the inspect type line, the HUD faction name, the recap.                                                                                                                                                                           | M    |
| E4  | Appearance                          | Kits for the 17 humanoid-rig types, the palette and accent, gaits, the test.                                                                                                                                                                      | L    |
| E5  | The ability layer                   | `abilities.ts`; move the existing behaviours over one at a time; Ambush and Patrol; threat tags from abilities.                                                                                                                                   | L    |
| E6  | New factions and mods               | The Kennel and the Gilded (types, kits, champions, themes, drops), three new mods from 7.2; the Drowned if time allows.                                                                                                                           | L    |
| E7  | Integration                         | Re-measure, set the final default scaling, switch Companions on or off, update the docs, a real-device look at the card on phones.                                                                                                                | M    |

E1 follows E0 immediately so that the later balance work is done on the harder baseline the user wants. E2 and E3 are
the answer to the complaint as it stands today and can ship before E4 to E6.

---

## 11. Risks

| Risk                                                                 | Answer                                                                                                                  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| More faction means a harder game; X9 won 21 to 25%, the band's floor | The harder baseline and the roster changes are tuned together in E7; the acceptance in 8.4 is a range, not a point.     |
| The ability refactor regresses a behaviour                           | One behaviour per commit; the existing faction tests unchanged; the Swarm speed test stays green.                       |
| The card becomes a wall of text, worse on phones                     | A fixed order, at most four tags and four chips, a disclosure on narrow screens; the layout is checked in the pane.     |
| Variance makes outcomes feel arbitrary                               | It is shown as a chip on the card, it is seeded, and it is zero in the tests and in the bot's default.                  |
| Packs by template feel scripted                                      | Weights inside roles; Mixed arms stays a template; templates are chosen per room by the seeded stream.                  |
| Art cost of E4 and E6                                                | Kits are small primitives on an existing rig; a faction's first cut can ship with two of four kits and the rest tinted. |
| Seeds shift: every existing map changes with the new `rollThemes`    | Offers are stored in the save, so a run in progress is unaffected; new runs are new.                                    |
| Difficulty cache key bloats the monster cache                        | `statLevel` is rounded to a quarter and `power` to a hundredth; a test caps the cache for a 100-map bot run.            |

---

## 12. DESIGN.md edits on approval

- §12 (monsters): the difficulty model replaces the single formula in 12.1; `statLevel` and `power` are named.
- §10.3 (population): pack templates and the role of each type.
- Appendix A: the decisions of section 13, each with the date.
- `docs/EXPANSION.md` 7.3 and 7.4: the earlier `fromMap` values, the 85/15 shares and the new factions.
- `CLAUDE.md`: a bullet for this plan and, when E1 lands, one line on the debug panel.

---

## 13. Open questions (defaults in effect until answered)

1. **Retire or down-weight the Ossuary themes?** Default: down-weight, cap one per set from map 4. A stronger answer
   is to remove two of the five from map 20; the weights make this a one-line change.
2. **One final boss or one per faction?** Default: gates are faction champions, map 100 stays the Regent, with a
   faction escort.
3. **Should a harder setting pay more?** Default: no.
4. **What does "substantially harder" mean as a number?** Default: half the current greedy-bot win rate and a median death
   a fifth earlier (8.4). The user may prefer a different target; the slider and the bot make it a quick change.
5. **Is variance shown to the player?** Default: the per-map part is a chip on the card; the per-pack part is not.
6. **Should the debug panel be visible in a shipped build?** Default: no, only `?debug` or a dev build.
7. **Old saves**: default: they keep the old curve.
8. **First new factions**: default the Kennel and the Gilded, in that order. The user may prefer the Emberborn (fire) or
   the Drowned (crowd control).
9. **Earlier faction introduction** (4.2, rule 2): defaults are starting values; E2's bot results decide.
10. **Companions on?** Default off.
11. **Should the early ease also follow the setting?** Default no: maps 1 to 4 stay approachable at the default, but a
    high `base` still makes them hard.
12. **Should scaling also raise monsters' accuracy, evasion and armour?** Default: no, life and damage only (8.1), until
    E7 measures hit chance by class at the new baseline.

---

## 14. As built (2026-10-08)

Everything in sections 4 to 8 is built, in the order of section 10, and committed milestone by milestone. This section
records what is different from the plan above and what the bot measured. The numbers are small samples (24 to 48 runs of
the bot, 6 classes) and are read as a direction, not a result.

### 14.1 What is where

| Plan section     | Built as                                                                                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 8 The model      | `src/data/difficulty.ts` (`Difficulty`, `LEGACY`, `DEFAULT`, `statLevel`, `packPower`, `mapTier`); `MonsterSpec.statLevel` and `power`; `RunState.difficulty` (SAVE_VERSION 8, older saves get the legacy curve); `Character.config.difficulty` for the effective HP; `MapPlan.difficulty` |
| 8.3 Debug panel  | `src/ui/Debug.tsx` on the title screen and at camp; shown in dev builds or with `?debug`; `Controller.setDifficulty` and `setStartDifficulty`                                                                                                                                              |
| 9 Measuring      | `npm run sim`: `--scaling --base --variance --legacy`, a variety table by band of ten maps, `--dump`, `--merge` and `--from`, and `scripts/simpar.sh` to run it on all cores; `npm run lethality` takes the same flags                                                                     |
| 4.2 Distribution | `themeWeight`, `leaderOf` and the rules in `rollThemes` (`src/run/offers.ts`); six extra themes for the first five factions and four for the new ones; `src/gen/packs.ts` (templates) and `populate`                                                                                       |
| 5 Legibility     | `src/run/themeInfo.ts`, `src/data/monsterInfo.ts`, `src/ui/OfferInfo.tsx` (the card), the inspect card, the map HUD and the recap                                                                                                                                                          |
| 6 Appearance     | `src/render/style/kits.ts` (kits), faction palettes and the element accent in `styles/grim/paint.ts`, three new beast rigs                                                                                                                                                                 |
| 7.3 Abilities    | `src/data/abilities.ts` (the library and each type's list), `src/sim/abilities.ts` (the code)                                                                                                                                                                                              |
| 7.4 Factions     | the Kennel and the Gilded: 8 types, 4 themes, 2 champions, 2 essences, tablets, rigs and kits                                                                                                                                                                                              |
| 7.2 Mods         | Charging, Flask-taker and Hobbling                                                                                                                                                                                                                                                         |

### 14.2 What changed on the way

- **Default scaling is 1.5, not 1.25.** The new roster and the offer rules made the bot's choice matter: at 1.25 the greedy bot
  won 14 of 24 runs (before this plan, at 1.25 on the old roster, it won 2 of 24, and 2 of 24 on the old game). At 1.5 it won 6
  of 24, and then 8 of 36; at 2.0, none of 24. The median map reached fell from about 55 to about 41 at 1.5. A random-picking
  bot won none of 24 and died mostly to the gate mini-bosses; its deaths before map 25 are about the same at 1.0 and at 1.5 (7
  and 8 of 48), so the early game is not made a wall.
- **Faction introduction maps** (4.2, rule 2): the Rot 4, the Swarm 6, the Hollow 11 (not 9: two Hollow themes beat a
  physical character outright), the Choir 15, the Reliquary 25, the Kennel 11, the Gilded 18, and mixed themes from 30.
- **The Gnawer pack** is three to six extra Gnawers per room (it was seven to thirteen), and a Swarm room keeps 60% of the
  monsters a room of its size would have. By head count the Gnawers were over 40% of everything the bot met from map 10.
- **The Bone Warden is a Skeleton Warrior champion** (the plan said Brute): a brute with the champion multipliers and a ring of
  Warriors was a wall at map 10 (8 of 24 random-bot deaths on that one map).
- **Gilded tuning:** the first cut caused half of the bot's deaths. The Guard has 1.5 times the life and 0.95 times the
  damage, the Slinger 0.7 times the damage, and the Bursar's reach is 5 tiles. It now causes about a third.
- **The test runner uses eight workers** (`vite.config.ts`): with one worker per core, the sim speed floors failed in every
  full run on a 32-core machine.
- **Quarry trash** is still drawn by the old per-monster roll (the champion rooms are not templates). The Holdout waves, the
  Regent's escort (three monsters of the theme) and every room of a plain map use the templates.
- **Hollow monsters are drawn at 80% opacity**, and every faction has its own palette. Per-type gaits (6.3) are not built
  beyond the hunch, the scale and the telegraph on the ground.
- **Companions** (4.2, rule 7) stay off, as planned: the maps already differ enough.

### 14.3 What the bot measured

Greedy bot (picks by the build's score), default settings, 36 runs:

- wins 8 of 36 (22%); the plan's target was 10 to 25%;
- deaths by faction: the Gilded 32%, the Reliquary 21%, the Kennel 18%, the Ossuary 14%, the Choir and the Hollow 7% each, so no
  faction is over the 35% limit;
- the Rot, the Swarm and the Hollow are the factions the bot steers around, and so kill little.

Random bot (picks any offer), default settings. Share of the monsters placed, by band of ten maps:

| Maps  | Ossuary                    | The largest other faction |
| ----- | -------------------------- | ------------------------- |
| 1–10  | 58% (limit 60% from map 4) | the Rot 28% (limit 30%)   |
| 11–20 | 36% (limit 40%)            | the Hollow 21% (30%)      |
| 21–30 | 15% (limit 25%)            | the Rot 22% (25%)         |
| 31–40 | 14%                        | the Choir 18%             |
| 41–50 | 6%                         | the Rot 25%               |
| 51–90 | 3 to 11%                   | the Gilded 14 to 27%      |

Types met per ten maps: 13 on maps 1 to 10, 27 on 11 to 20, 32 from 21 on (33 exist). The longest stretch of maps in which one
faction supplied over 60% of the monsters is 4 (the Ossuary on the first maps), median 3 to 4.

### 14.4 Left for later

- The Drowned, the Emberborn and the Veiled of section 7.4 are not built. The ability layer needs only `pull` (declared in
  `data/abilities.ts`, not coded) for the first.
- Per-type gaits, and two of the new mods of 7.2 (Mirrored, Warding Pulse).
- Variance is 0.1 by default; its effect was too small to see in the bot's results. A larger default would make Gentle and
  Fierce maps more of a choice.
- The Mystic dies early more often than the other classes at the new baseline (the bot spends a caster's points poorly in the
  first twenty maps); it did before this plan too, on map 1.
