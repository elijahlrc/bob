# Bob — Encounters: what monsters do besides walk up and hit

Status: **built, 2026-10-09** (section 16 says what was built and how it differs). It replaces `SIDEARMS.md` (2026-10-09), which is part A here. Written from
the code as it stands. Decisions that need the user are in section 15; the plan takes the stated defaults until they are
answered.

---

## 1. The problem

From the user, 2026-10-09: most enemies run at the character and hit it in melee. The interesting encounters involve slow
projectiles, ground AOEs, debuffs on the character, invulnerability windows, patterned AOE attacks, and monsters that change
mode when they are hurt. Add these to the **existing** types rather than adding types.

What the code says (read from `MONSTER_TYPES` and `TYPE_WEIGHTS`, 48 types):

- **32 of the 48 types are melee**, among them most of the heaviest weights: Warrior 50, Gnawer 50, Hound 45, Shambler 40,
  Leech 40, Cinderling 40, Golem 35, Guard 35, Gloomstalker 35.
- **A melee type has one skill** (`monsterSkill` in `calc/monster.ts`), and `monsterAI` (`sim/ai.ts`) either walks to the
  character or strikes it. The abilities (leap, charge, blink, slam) are nearly all ways of closing in.
- **Shapes are wasted on melee types.** ROSTER.md V3 built `swing`, `salvo`, `orb`, `lob`, `nova`, `slam` and `lance`
  (`data/shapes.ts`), with warnings (`sim/telegraph.ts`) that the character's dodge reads. A type has one skill, so a melee
  type that took a ranged shape would lose its strike.
- **Monsters have no state beyond their life.** Phases (`data/phases.ts`) do one thing once at a share of life: enrage,
  flee or split. Nothing reacts to how a monster is being hit (fast or slow, burst or steady, which element). Nothing has a
  defensive window, except the Beetle's curl and the Pylon's protection.
- **Ground attacks are single circles.** A telegraphed blast (`GroundEffect` of kind `slam`) is a circle. Lanes and wedges
  exist only as the warning of a monster's own action. There is no sequence, no pattern and no safe spot to find.
- **Debuffs on the character are thin and rare:**
  - the Hobbling mod and the `hobbles` trait (a 30% slow);
  - the Hexer's hexes;
  - the Wisp's mana drain;
  - poison and chill from `chance.*` mods;
  - the Cutpurse's flask theft;
  - the Tidecaller's pull.

### 1.1 The constraint: the character plays itself

[PLAYER-AI.md](PLAYER-AI.md) §1 to §3: the character never retreats or kites. It dodges any warning it can see, and it
attacks the nearest target, with nests and pylons first. The player's choices are the build, the gear and the map. So a
mechanic is interesting only if it is:

1. **Readable.** It has a warning on the ground or a tell on the body that the player can see coming.
2. **Answered by the character.** Its existing reflexes (dodge, target choice) handle it, or it gets one small new reflex,
   named in section 9. A mechanic the character cannot react to is just a damage tax.
3. **A question to the build.** Some builds do well against it and others badly (section 10). That is what makes a map
   offer worth reading at camp.

Every idea below names its tell, the character's answer and the build question.

---

## 2. The families

| Family                   | One-line idea                                                              | Engine work                      |
| ------------------------ | -------------------------------------------------------------------------- | -------------------------------- |
| **A. Sidearms**          | a melee type also throws, lobs or lashes on its way in                     | a second skill per type          |
| **B. Patterns**          | a sequence of telegraphed blasts in a shape: march, cross, waves, closing  | shaped blasts and a scheduler    |
| **C. Defensive windows** | the monster cannot be hurt, or punishes being hit, for a telegraphed spell | modes (section 6) and one reflex |
| **D. Mode shifts**       | the monster changes how it fights when it is hurt in a certain way         | modes (section 6)                |
| **E. Debuffs**           | the monster leaves something on the character: blind, latch, tether, mark  | statuses on the player           |
| **F. Pack plays**        | a pack acts together on a cue: a volley call, an encirclement              | packs (`sim/packs.ts`)           |

A, B and E are about where the character stands and what it carries. C and D are about **when and how** to deal damage,
which is where builds differ most. F is the most expensive and the most optional.

---

## 3. A. Sidearms (from SIDEARMS.md)

A type may have a **sidearm**: a second attack with its own shape, range window, timer and damage. It is used **while the
character is out of melee reach**. The melee strike stays the type's main attack, and the sidearm is what it does on the
way in instead of only walking.

```ts
type SidearmSpec = {
  shape: ShapeSpec; // orb, salvo, lob, lance, nova or slam: data/shapes.ts, unchanged
  every: number; // seconds between uses (the first after a random part of it)
  from: number; // tiles: not used closer than this (it closes instead)
  to: number; // tiles: not used farther than this
  time?: number; // the wind-up, seconds (default the type's attack time)
  convert?: Element; // its damage type, when not the type's
  effect?: StatusId; // what it leaves on the character (section 7)
  minLevel?: number; // not used below this map level
};
```

How it is built:

- **The profile.** `MonsterStats.sidearm` is a second profile built in `buildMonster` with its **own ModDB**. Today
  `shapeMods` writes into the type's one DB, so a salvo's `repeats` would also repeat the melee blow.
- **The AI.** One step in the melee branch of `monsterAI`: if the timer is ready, the monster is not acting, the character
  is within `from` to `to` tiles and in sight, it starts the sidearm. A new `sideT` field on `Actor` is the timer, and the
  distance and sight tests run only when it is ready.
- **The warning, the dodge, the zones and the hits are unchanged.** `telegraph.ts` reads the action's behaviour.
- **The pose.** The sidearm's skill id (`monster_<type>_side`) picks a throw or cast pose in the renderer.

| Type (faction)     | Sidearm                            | Shape and numbers (start)                                     | Asks of the build                   |
| ------------------ | ---------------------------------- | ------------------------------------------------------------- | ----------------------------------- |
| Warrior (Ossuary)  | Hurls a bone spear                 | `orb` speed 0.55, mult 0.9; 4–9 tiles; every 8 s; from map 4  | stepping aside; projectile defences |
| Brute (Ossuary)    | Stamps a ring of shock             | `slam` r2 at the feet, mult 1.3; 3–6; every 10 s; from map 10 | stepping out of a ring              |
| Shambler (Rot)     | Retches caustic bile onto the feet | `lob` caustic r1.3, 3 s, dps 0.2, mult 0.4; 3–8; every 9 s    | leaving ground; chaos resistance    |
| Gorger (Rot)       | Spits a gobbet that poisons        | `orb` mult 0.7, effect `poison`; 3–8; every 8 s               | poison; chaos resistance            |
| Gloomstalker       | Throws a shade that blinds         | `orb` mult 0.5, effect `blind`; 4–10; every 10 s              | accuracy; killing it first          |
| Censer-bearer      | Flings burning coals               | `lob` burning r1.4, 3 s; 3–7; every 8 s                       | leaving ground; fire resistance     |
| Flagellant (Choir) | Cracks a lash                      | `lance` length 5, width 0.8, mult 0.8; 2.2–5; every 5 s       | stepping out of a line              |
| Golem (Reliquary)  | Throws a boulder (its element)     | `orb` speed 0.45, mult 1.2; 3–10; every 9 s                   | seeing it coming; its element       |
| Cutpurse (Gilded)  | Scatters burrs that slow           | `lob` chilling "scattered burrs" r1.5, 4 s; 3–8; every 8 s    | speed; leaving ground               |
| Guard (Gilded)     | Heaves a weighted chain            | `orb` mult 0.6, effect `hobble`; 3–7; every 9 s               | speed                               |
| Wrack (Drowned)    | Flings a clot of brine             | `orb` mult 0.7, effect `hobble`; 3–7; every 8 s               | speed                               |
| Slag Brute (Ember) | Hurls molten slag                  | `lob` burning r1.6, 4 s; 3–8; every 9 s                       | leaving ground; fire resistance     |

The existing ranged types:

- **Slinger:** its stones hobble.
- **Handler:** throws a net, a `lob` of slowing ground, then kites. (Its whistle also marks the character, section 7.)
- **Hexer:** its hex becomes a sigil on the ground, a zone that hexes whoever stands in it (section 7).

The swarm fodder (Gnawer, Bat, Leech, Crawler, Cinderling, Hound, Wisp) stays plain: a pack needs plain members.

Budget:

- A sidearm deals about 4 to 15% of the melee rate while the character is in its window.
- A throw costs the monster about a second of closing, and the first throw is randomised per monster.
- A pack member does not lob a zone where its pack has an open one within 3 tiles of the aim, so a room is not carpeted.

---

## 4. B. Patterned AOE

A **pattern** is a short script of telegraphed blasts that a monster casts as one action. Each blast has its own shape,
place and delay. The character survives a pattern by **reading where the next blast lands**, not by leaving one circle.
That needs two engine pieces:

1. **Shaped blasts.** A telegraphed `GroundEffect` gains a `shape`:
   - `circle` (as today);
   - `lane` (a strip between two points);
   - `wedge` (an arc from a point);
   - `donut` (dangerous outside a radius and safe inside it).

   It also gains a `delay` before its warning starts to fill. `hazardAt` becomes shape-aware. ROSTER.md 5.3 asked for this
   and it was never built, because the lanes and wedges went through the action's warning instead.

2. **The scheduler.** `PatternSpec` is data, a list of steps:

   ```ts
   type PatternStep = {
     at: number; // seconds after the cast
     shape: 'circle' | 'lane' | 'wedge' | 'donut';
     anchor: 'self' | 'target' | 'aim'; // the monster, the character now, or where it aimed at the cast
     dist?: number; // offset from the anchor, tiles
     angle?: number; // offset angle, degrees, relative to the aim (so a cross can turn)
     radius?: number;
     length?: number;
     width?: number;
     warn?: number; // seconds of warning (default 0.8)
     mult?: number; // share of the type's hit
     zone?: ZoneKindId; // leaves ground behind
   };
   type PatternSpec = {
     id: string;
     name: string;
     steps: PatternStep[];
     every: number;
     range: number;
   };
   ```

   Casting a pattern is a monster action (a wind-up, then all its steps are pushed as shaped blasts with their delays). The
   steps then run on their own, so the monster may move or die while they land.

Patterns built from it:

| Pattern          | What the player sees                                                                 | Steps                                | Asks of the build                               |
| ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------ | ----------------------------------------------- |
| **March**        | five circles land one after another along the line from the monster to the character | 5 circles, 0.25 s apart, `aim`       | stepping sideways, not back                     |
| **Mortar**       | four circles fall round the character at once, one gap left                          | 4 circles at `target` ± offsets      | finding the gap; melee reach                    |
| **Cross**        | a plus of four lanes from the monster, then the same turned 45°                      | 4 lanes, then 4 at +45°, 0.8 s apart | standing between the arms; not hugging it       |
| **Toll waves**   | three rings outward from the monster, each with the one before as its safe band      | donut/circle alternating, 0.6 s      | timing; being near is safe at the right beat    |
| **Closing ring** | a ring of fire round the character that shrinks to a safe spot by the caster         | donuts of falling radius             | walking in; ranged builds pay                   |
| **Keening**      | everything beyond 3 tiles of the monster is hit; only near it is safe                | one donut, `self`, radius 3          | melee and minion builds safe; ranged must close |
| **Spiral**       | a ring of slow orbs from the monster, one gap, turning                               | radial `orb`s, not blasts            | reading a gap; projectile defences              |

The **Keening** and the **Closing ring** reward the character for coming **closer**, which is the one thing the character
already does well. They are the most natural fit for an auto-battler, and the only counters in the roster to "kill it from
range".

---

## 5. C. Defensive windows

A monster that **cannot be hurt for a moment**, or that **punishes being hit** for a moment. Each window is telegraphed on
the body (a glow, a raised shield, a stone skin) and lasts 1.5 to 3 s, with a cooldown of 8 to 12 s. The character's answer
is a new reflex: it **does not spend its attacks on a target in a window** (section 9). Damage over time already applied
keeps ticking, which is a deliberate edge for DoT and ailment builds.

| Window             | Type (faction)         | What happens                                                                                                         | Tell                         | Favours                                                  | Punishes                        |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------- | ------------------------------- |
| **Brace**          | Shieldbearer (Ossuary) | raises its shield 2 s: no damage from the front 120°; then a heavy bash                                              | shield up, a gold rim        | minions, chains, pierce (other angles); DoT              | a lone melee build at the front |
| **Aegis**          | Sentinel (Reliquary)   | a shell that stops the next 4 hits whole, however big; it regrows after 5 s unhit                                    | four plates round it         | fast hits, many projectiles, DoT                         | slow big hits, crits            |
| **Fade**           | Gloomstalker (Hollow)  | takes over a quarter of its life in one second: it fades (untargetable) for 1.5 s and reappears behind the character | it smears and vanishes       | steady damage                                            | one big hit, crit nukes         |
| **Sanctuary**      | Choirmaster (Choir)    | channels 3 s: allies within 4 tiles take no damage; a stun ends it                                                   | a ring of light on the floor | stun, reaching the Choirmaster                           | area builds that ignore it      |
| **Petrify**        | Charnel Heap (Ossuary) | at 40% life the mound fuses to stone for 3 s: untouchable, heals 15%, then shatters in a ring                        | grey skin, cracks spreading  | burst that skips the threshold; stepping out of the ring | slow steady damage              |
| **Counter-stance** | Gilded Guard (Gilded)  | 1.5 s: each melee hit on it is answered by a heavy blow                                                              | blade raised, a bright edge  | ranged, spells, minions                                  | melee                           |
| **Carapace shed**  | Bone Beetle (Swarm)    | its curl becomes a window: curled 2 s, physical hits do 90% less; a hit with fire or a stun uncurls it               | curled, the shell closed     | fire, stun                                               | plain physical                  |

Windows sit on the **non-fodder** types, so a room has at most two or three of them, and they are staggered by a random
first cooldown. A pack whose whole front braces at once would stall the character, so a pack shares a "window budget": at
most half its members in a window at a time.

---

## 6. D. Mode shifts

Today a phase fires once at a share of life. A **mode** is a state a monster enters on a **trigger**, stays in for a time or
for good, and that changes how it fights. Windows (section 5) are modes too; they share the engine.

```ts
type ModeTrigger =
  | { on: 'life'; below: number } // what phases do today
  | { on: 'burst'; share: number; seconds: number } // took this share of its life within this time
  | { on: 'hits'; count: number; seconds: number } // was hit this many times within this time
  | { on: 'element'; type: DamageType; share: number } // took this share of its life from one damage type
  | { on: 'allyDied'; within: number } // fervour today
  | { on: 'timer'; every: number } // a window on a clock
  | { on: 'stunned' }; // broken by a stun
type ModeSpec = {
  id: ModeId;
  when: ModeTrigger;
  seconds?: number; // how long it lasts (for good when absent)
  cooldown?: number;
  warn?: number; // the tell before it takes effect
};
```

The monster keeps two cheap counters, updated in `hit()`: damage taken with a one-second decay, and hits taken with a
two-second decay. It also keeps the share of its life lost to each damage type. Modes are checked on the existing 0.25 s
notice tick, except windows, which check every tick.

Modes that change how it fights:

| Mode             | Type (faction)         | Trigger                          | What changes                                                                                 | Asks of the build                           |
| ---------------- | ---------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Core vent**    | Core Golem (Reliquary) | 30% of its life lost in 2 s      | its core opens: it takes 50% more damage for 4 s, but casts the **Cross** pattern twice      | burst to exploit the opening; dodging       |
| **Quench**       | Slag Brute (Emberborn) | a fifth of its life lost to cold | it hardens and cracks: half speed, no trail, 30% more physical damage taken                  | cold, then physical: a two-element build    |
| **Gorged**       | Gorger (Rot)           | after it devours a body          | swollen: 30% slower, 30% more life, and it bursts in a caustic cloud when it dies            | breaking corpses; not standing on its death |
| **Last rites**   | Carrion Hag (Rot)      | below 30% life (replaces flee)   | stops raising and channels 3 s: every corpse within 8 tiles bursts; a stun or a kill ends it | burst; stun; not fighting on corpses        |
| **Grieving**     | Wailer (Hollow)        | an ally dies within 6 tiles      | casts **Keening** at once (Keening replaces its nova)                                        | closing in; kill order                      |
| **Riled**        | Rend-boar (Kennel)     | hit 6 times within 2 s           | charges at once, with no warning beyond its stamp (replaces its enrage at 40%)               | fewer, larger hits                          |
| **Molten**       | Cinderling (Emberborn) | hit by fire                      | it grows instead of taking damage (fire 75% already): a fire build feeds it                  | not fire; area that kills before it grows   |
| **Broken guard** | Shieldbearer, Sentinel | stunned                          | it drops its guard: 50% more damage taken for 3 s, no Brace or Aegis                         | stun builds                                 |

**Adaptive** (a rare mod, not a type): after taking a quarter of its life from one element, it gains 50% resistance to that
element for 6 s, shown as a tint. This is the only answer in the game to a single-element build, and it is an affix the
player sees on the camp card and can avoid.

---

## 7. E. Debuffs on the character

A **status** on the player: one record, a timer, a HUD icon, and one place in the code that applies its effect.

| Status     | What it does                                                                            | Source (type, how)                                   | The character's answer                             |
| ---------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| **Hobble** | 30% slower for 2 s (exists as the Hobbling mod)                                         | Guard, Wrack, Slinger, Handler sidearms              | speed, `cannotBeChilled` (as today)                |
| **Blind**  | a lower chance to hit for 3 s (the size to be checked against the 3.9 rule)             | Gloomstalker sidearm; Hollow Watcher lance           | accuracy; spells ignore it                         |
| **Hexed**  | a hex (exists): from the Hexer's **sigil**, a ground zone that hexes while stood in     | Hexer                                                | the dodge leaves the sigil; curse immunity         |
| **Tithe**  | a beam from a Bursar drains life while the character is within 8 tiles and in its sight | Bursar (Gilded)                                      | a new priority: a tethering monster counts as near |
| **Marked** | takes 20% more damage from the marker's pack for 4 s; the mark shows                    | Kennel Handler: its whistle marks as well as rallies | killing the Handler; defences                      |
| **Poison** | (exists) from a sidearm's chance                                                        | Gorger                                               | chaos resistance; flasks                           |

Most of these are cheap: `hobble`, `poison` and `hex` exist and only need a source. **Blind** needs one line in the hit
chance. **Tithe** is the one new mechanic. (Latched, a leech riding the character, was dropped on 2026-10-09.)

---

## 8. F. Pack plays (optional)

On top of `sim/packs.ts` (flanking, holding the line, rallying):

- **Volley call** (Ossuary and Gilded firing lines). When three or more archers of a pack can see the character, one calls,
  shown as a raised arm and a line of light. All of them loose together 0.8 s later, each down a **lane** that is
  telegraphed. The character steps between lanes. It asks the build the same as one archer, but at once.
- **Encircle** (Kennel). Hounds hold a ring 5 tiles round the character for 2 s, then all leap at once, each with its
  landing circle shown. Area builds wipe the ring; single-target builds are caught.
- **Converge** (Swarm). A Nest's whistle sends every Gnawer straight in at once from all sides. Today they trickle in.

These are left to last because they need pack-level state and are the most likely to stall the sim.

---

## 9. What the character must learn (deferred)

**Decision (user, 2026-10-09): no changes to the character's decisions for now.** The monster mechanics are built first,
against the character as it is. Read against the code (`findTarget`, `avoidHazard`, `bodyOnWay`, `hazardAt` and the stall
breaker in `sim/ai.ts`), nothing below breaks its behaviour if two rules hold:

1. **A window turns hits aside, as a block does.** The gate is in `applyHit` (where the attacker is known, so a Brace can
   guard its front), not in `applyDamage`: damage over time keeps ticking. A **Fade** uses `phaseT`, which `findTarget`
   already skips. Windows last 1.5 to 3 s, far under the 20 s stall breaker. The **Aegis** regrows only when the Sentinel
   has not been **attacked** for 5 s (not merely not damaged), so a slow hitter still gets through.
2. **A shaped blast tells `hazardAt` its shape.** This is part of building the shapes, not a new reflex: it says where the
   danger is, and the dodge decides as it does today. A lane read as a circle would send the character the wrong way. _As
   built:_ a later step of a pattern is a hazard only once its warning shows (it is drawn as a faint outline before that,
   for the player), so the dodge reacts to what is on the ground now, as it always has.

**Decision (user, 2026-10-09): Latched is dropped.** Counter-stance, Keening and Closing ring are built without the reflexes:
a melee character keeps striking into a Counter-stance, and the dodge (1.5 to 3.5 tiles, outward) often stays in a Keening.
They are a tax on one kind of build until the reflexes come.

The reflexes, for when they are wanted. Each is small and lives in `sim/ai.ts` (`playerAI`, `avoidHazard`, the target choice). [PLAYER-AI.md](PLAYER-AI.md) is the
player-facing account of these rules and needs a line for each. It is untracked work in the shared tree, so coordinate with
whoever is writing it before editing.

| Reflex                                | For                                                        | Rule                                                                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hold off a warded target**          | C (Brace, Aegis, Sanctuary, Counter-stance, Petrify, Fade) | a target in a window counts as 6 tiles farther in the target choice, so the character turns to another enemy if there is one; if there is none, it keeps attacking, except into Counter-stance with a melee skill, where it waits |
| **Read a donut**                      | B (Keening, Closing ring)                                  | `hazardAt` knows "safe inside", and the dodge search looks inward (it searches outward today, at 1.5 to 3.5 tiles)                                                                                                                |
| **Look ahead**                        | B (all patterns)                                           | a blast whose warning starts within 0.6 s counts as a hazard **for the place the character would step to**, so it does not dodge into the next circle; blasts further off are ignored                                             |
| **Priority for channels and tethers** | C (Sanctuary), D (Last rites), E (Tithe)                   | a monster channelling or tethering counts as 4 tiles closer, as nests and pylons do today                                                                                                                                         |
| **The stall breaker** stays           | all                                                        | the 20-second "no damage" rule must not fire on a monster whose windows took the time: the count pauses while the target is in a window                                                                                           |

---

## 10. The build questions

The aim is that every build has encounters that are good and bad for it, so the camp card's faction and type lines mean
something. `+` means the mechanic is easier for that build, `−` harder.

| Mechanic             | Fast hits | Big hits / crit | DoT, ailments | Area | Single target | Melee | Ranged / spell | Minions | Stun |
| -------------------- | :-------: | :-------------: | :-----------: | :--: | :-----------: | :---: | :------------: | :-----: | :--: |
| Aegis                |     +     |        −        |       +       |  +   |       −       |       |                |    +    |      |
| Fade                 |     +     |        −        |       +       |      |       −       |       |                |         |      |
| Brace                |           |                 |       +       |  +   |       −       |   −   |       +        |    +    |  +   |
| Counter-stance       |           |                 |       +       |      |               |   −   |       +        |    +    |      |
| Sanctuary            |           |                 |               |  −   |       +       |       |       +        |         |  +   |
| Petrify, Core vent   |     −     |        +        |               |      |       +       |       |                |         |      |
| Quench               |           |                 |               |      |               |       |                |         |      |
| Riled                |     −     |        +        |               |      |               |       |                |         |      |
| Keening              |           |                 |               |      |               |   +   |       −        |    +    |      |
| Closing ring         |           |                 |               |      |               |   +   |       −        |         |      |
| March, Mortar, Cross |           |                 |               |      |               |   −   |       +        |         |      |
| Molten               |           |                 |               |  +   |               |       |                |         |      |
| Blind                |           |                 |               |      |               |   −   |   + (spells)   |         |      |

Quench asks for two elements, and Molten punishes fire, so neither fits a column. The rows show a balance: fast hitters and
big hitters each have their bad encounters, and so do melee and ranged. A test will hold the table to the data (each
mechanic that a type lists has a row) so that it does not drift.

---

## 11. Who gets what, by faction

**No type gains more than two things from this plan.** Where a new thing does the job of an old one, it replaces it:

- the Wailer's Keening replaces its nova;
- the Rend-boar's Riled replaces its enrage;
- the Hag's Last rites replaces its flee;
- the Hexer's sigil replaces its hex.

A faction spreads its families over its types, so that each faction gains at least two families on top of what it has, and
its own question stays at the front.

| Faction (question)            | Sidearms                      | Patterns                      | Windows                                    | Modes                                    | Debuffs                   |
| ----------------------------- | ----------------------------- | ----------------------------- | ------------------------------------------ | ---------------------------------------- | ------------------------- |
| Ossuary (stun, block, arrows) | Warrior spear, Brute ring     | Mage: **March**               | Shieldbearer: **Brace**; Heap: **Petrify** | Shieldbearer: Broken guard               | (Volley call, F)          |
| Rot (chaos, corpses)          | Shambler bile, Gorger gobbet  | Spitter: **Mortar** of bile   | none                                       | Gorger: Gorged; Hag: Last rites          | poison                    |
| Hollow (physical fails, mana) | Gloomstalker shade            | Wailer: **Keening**           | Gloomstalker: **Fade**                     | Wailer: Grieving                         | Blind                     |
| Choir (hexes, heals)          | Censer coals, Flagellant lash | Tolling Bell: **Toll waves**  | Choirmaster: **Sanctuary**                 | none                                     | Hexer sigil               |
| Swarm (numbers)               | none (fodder)                 | Nest: **Spiral** of spores    | Beetle: **Carapace shed**                  | none                                     | (Converge, F)             |
| Reliquary (armour, immunity)  | Golem boulder                 | Arbalest: **Cross**           | Sentinel: **Aegis**                        | Golem: Core vent; Sentinel: Broken guard | none                      |
| Kennel (being caught)         | Handler net                   | (Encircle, F)                 | none                                       | Rend-boar: Riled                         | Handler's whistle: Marked |
| Gilded (sustain denial)       | Cutpurse burrs, Guard chain   | none                          | Guard: **Counter-stance**                  | none                                     | Tithe                     |
| Drowned (being held)          | Wrack brine                   | Tidecaller: **Twin hooks**    | none                                       | none                                     | none                      |
| Emberborn (fire, ground)      | Slag Brute slag               | Pyre Priest: **Closing ring** | none                                       | Slag Brute: Quench; Cinderling: Molten   | none                      |

At the limit of two are:

- the Golem (boulder, Core vent);
- the Gloomstalker (shade, Fade);
- the Gilded Guard (chain, Counter-stance);
- the Slag Brute (slag, Quench).

The Shieldbearer's and the Sentinel's Broken guard is the counter to their window, not a third thing. Champions keep their
scripts. They may later borrow patterns, since a chief is the natural
place for a long pattern.

---

## 12. Engine summary

| Piece              | Where                                                                                             | New state                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Sidearm profile    | `calc/monster.ts` (`MonsterStats.sidearm`), `data/monsters.ts`                                    | `Actor.sideT`                                               |
| Shaped blasts      | `sim/types.ts` (`GroundEffect.shape`, `delay`), `ai.ts` (`hazardAt`), the renderer's ground layer | none                                                        |
| Patterns           | `data/patterns.ts` (the library), `sim/patterns.ts` (cast and schedule)                           | `Actor.patT`                                                |
| Modes and windows  | `data/modes.ts`, `sim/modes.ts`; `hit()` reads the window and feeds the counters                  | `Actor.mode`, `modeT`, `burst`, `hitsRecent`, `elemLost[5]` |
| Statuses           | `sim/statuses.ts`; `Player.status` record; the HUD row                                            | per status timer                                            |
| Character reflexes | `sim/ai.ts`                                                                                       | none (reads the above)                                      |
| Cards              | `data/monsterInfo.ts`, `ui/Hud.tsx`, `run/themeInfo.ts` (tags `Patterns`, `Windows`, `Debuffs`)   | none                                                        |
| Threat model       | `run/threat.ts` counts sidearms and patterns in `pressure`                                        | none                                                        |

Phases (`data/phases.ts`) become the `life` trigger of modes, and the enrage, flee and split actions become modes. The
existing tests are the characterisation, as in ENEMIES.md 7.3: they pass unchanged after the move.

---

## 13. Milestones

Each ends with `npm run check`, the x9 speed floor and a commit of my own files only (the tree is shared). No bot sims while
building (the user's standing preference); one at the end.

| #   | Milestone             | What                                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | **First slice**       | One idea from each of A, B, C on the early Ossuary and Rot, so it is felt from map 4: the sidearm engine with the Warrior's spear and the Shambler's bile; shaped blasts and the Mage's **March**; modes with the Shieldbearer's **Brace** (no hold-off reflex: the character hits the shield, as it hits a pylon-shielded monster today). Then the user plays it. |
| N2  | Sidearms              | The rest of section 3's table, the Slinger's and Handler's changes, the zone-stacking rule.                                                                                                                                                                                                                                                                        |
| N3  | Patterns              | The scheduler's remaining patterns (Mortar, Cross, Toll waves, Closing ring, Keening, Spiral), the donut and look-ahead reflexes.                                                                                                                                                                                                                                  |
| N4  | Windows and modes     | Aegis, Fade, Sanctuary, Petrify, Counter-stance, Carapace shed; Core vent, Quench, Gorged, Last rites, Grieving, Riled, Molten, Broken guard; the Adaptive mod; phases moved onto modes.                                                                                                                                                                           |
| N5  | Debuffs               | Statuses and the HUD row: Blind, Tithe, Marked, the Hexer's sigil, the sidearm effects.                                                                                                                                                                                                                                                                            |
| N6  | Cards, tags, threat   | The inspect card lists every trick; the camp tags; `threat.ts`; the build-question test; docs (ROSTER.md, ENEMIES.md, PROGRESS.md; PLAYER-AI.md with its author).                                                                                                                                                                                                  |
| N7  | Pack plays (optional) | Volley call, Encircle, Converge.                                                                                                                                                                                                                                                                                                                                   |
| N8  | One sample            | One 24-run bot sample: deaths by type and by mechanic, to see that no single mechanic is the top killer. Tuning is in the data.                                                                                                                                                                                                                                    |

N1 is a vertical slice. It proves each engine piece on a type met early, and it is the point to stop and see whether the
encounters feel better before building out the rest.

---

## 14. Risks

| Risk                                                            | Answer                                                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| The character cannot answer a mechanic, so it is a damage tax   | Every mechanic names its reflex (section 9); a test per reflex shows the character stepping out, turning away or waiting.                        |
| Windows stall fights, and the stall breaker gives up on targets | Windows are short with long cooldowns; a pack's window budget; the stall count pauses in a window.                                               |
| Too much on the floor at once                                   | Patterns are on support and ranged types with long timers; the zone-stacking rule; at most two tricks a type.                                    |
| Rooms become unreadable                                         | Every mechanic has its tell on the floor or the body. Colours follow `VISUAL_LANGUAGE.md`. New tells are checked in the pane.                    |
| The game gets much harder                                       | Each mechanic replaces time the monster would spend hitting (a window is time it does not attack; a pattern is its attack). N8 measures.         |
| Sim speed                                                       | Counters in `hit()` are two multiplies; modes on the 0.25 s tick; patterns are a few effects each. The x9 floor before and after each milestone. |
| Names clash with the reference game                             | Every new name passes `ip.test.ts` (no exact gem or unique names: "Riposte" is a gem, so the Guard's window is Counter-stance).                  |
| Phases moving onto modes breaks a test                          | The phase tests are the characterisation; they pass unchanged.                                                                                   |
| PLAYER-AI.md is someone else's work in progress                 | Coordinate before editing; the code's rules are documented in it only when it is committed.                                                      |

---

## 15. Open questions (defaults in effect until answered)

1. **Is the first slice (N1) the right place to stop and play?** Default: yes. Spear, bile, March and Brace, with no change to
   the character, then look.
2. **Should DoTs keep ticking through an invulnerability window?** Default: yes. It is a deliberate edge for ailment builds.
3. **Should windows exist on normal monsters, or only on magic, rare and above?** Default: on normal monsters of the
   non-fodder types, with the pack budget.
4. **Should the swarm fodder stay plain?** Default: yes. The Cinderling's Molten is the one exception, because it is about
   which element to bring, not about dodging.
5. **The Adaptive mod**: in, or too much like a punishment for specialising? Default: in, as a rare mod from map 30. It is
   visible on the camp card and on the monster.
6. **Pack plays (N7)**: worth their cost? Default: after N6, if the user wants them.
7. **Should a gate champion borrow patterns** (a long one per chief)? Default: not in this plan. A follow-up, once patterns
   exist.

---

## 16. As built (2026-10-09)

Built in three commits after the plan, then debuffs, pack plays and the cards. The user's decisions on 2026-10-09: build
everything but **Latched**, and leave the **character's decisions unchanged** (section 9).

| Where                                   | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/data/encounters.ts`                | The data: `TYPE_SIDEARMS` (19 types), `PATTERNS` (March, Mortar, Cross, Toll waves, Closing ring, Keening, Twin hooks, the archers' lanes), `TYPE_WINDOWS` (Brace, Counter-stance, Sanctuary), `TYPE_MODES`, texts, tags                                                                                                                                                                                                                                                       |
| `src/calc/monster.ts`                   | `MonsterStats.sidearm`: a second profile with its own ModDB (`sidearmSkill`, `sidearmMods`)                                                                                                                                                                                                                                                                                                                                                                                    |
| `src/sim/blasts.ts`                     | `inBlast` (circle, lane, wedge, donut) and `castPattern`; `GroundEffect` has `shape`, `delay`, `label`, `owner`, `pull`, `leaves`                                                                                                                                                                                                                                                                                                                                              |
| `src/sim/encounters.ts`                 | `Actor.enc` (one object, only for the types that need it); the sidearm step, windows, every mode, the hit gate (`turnsAside`), `modeTaken`, `noteTaken`, the Counter-stance answer, the mark                                                                                                                                                                                                                                                                                   |
| `src/sim/packPlays.ts`                  | Loosing call, Encircle, Converge                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/sim/abilities.ts`                  | `tithe`, `sigil` (the Hexer's hex is now a sigil), the whistle marks, `startCharge` (Riled)                                                                                                                                                                                                                                                                                                                                                                                    |
| `src/render/styles/grim/encounterFx.ts` | Every tell: shaped warnings with a dark wash and rim runes, a faint outline for a pattern's later steps, the landings, the shield arc, the raised blade, the ring of light, the plates, the stone silhouette, the open core, chant threads, the Tithe beam, the mark over the character, the sigil star, the Encircle ring, and a floater as a mode fires; projectile sprites (spear, boulder, gobbet, shade, chain, clot, spore) and a throw, cast or lash pose for a sidearm |
| Cards                                   | The inspect card lists the sidearm, the window and each mode; the camp card counts them toward the tags, with two new ones (Patterns, Guards); `threat.ts` counts a sidearm in a type's pressure; the HUD shows Blinded, Marked and Tithed beside the hexes                                                                                                                                                                                                                    |
| `__dev.stage(types, opts)`              | Puts types at a distance with their sidearms (and windows) ready, steps until a condition and pauses, to look at an encounter in the real renderer                                                                                                                                                                                                                                                                                                                             |

**Different from the plan:**

- A pattern is a sidearm that casts a pattern, not a second mechanism: one timer, one range window, one pose.
- A later step of a pattern is a hazard to the dodge only once its warning shows; before that it is drawn as a faint outline
  for the player.
- Windows and modes are one state object (`EncState`) and one file, not a general trigger engine: each mode reads its numbers
  from `TYPE_MODES`. The phases (`data/phases.ts`) were not moved onto modes (no gain the player sees).
- **Petrify** went to the Charnel Heap and not the Core Golem (two tricks at most a type); the Golem has Core vent.
- The Beetle's **Carapace** is its curl, changed: 90% less physical damage for 2 s, and fire or a stun opens it.
- **Riled** replaces the Rend-boar's enrage; **Last rites** replaces the Hag's flight; the Hexer's **sigil** replaces its hex.
- The **Tithe** draws its owner's hit a second (a share of 0.3 was lost under regeneration); its beam is broken by distance
  or by a wall.
- The **Loosing call** needs two archers or slingers, not three (a Firing line has two or three).
- A Counter-stance answers with a raw physical blow of 1.5 times the Guard's hit, at most one every 0.35 s.
- **Not built:** the pack's "window budget" (at most half a pack in a window at once). Windows are staggered by a random first
  timer instead; to be added if a braced front line is seen to stall the character.
- Every test of the old behaviours passes; four were changed because the rule they pinned changed on purpose (the Beetle's
  curl, a Sentinel's carapace test that now has to remove its Aegis first, the enrage and flight tests, which moved to the
  Flagellant and the Handler).

No bot sample has been run (the user's standing preference); damage numbers are the plan's starting values.
