# Bob — Bosses: ten fights that each ask the build one question

Status: **built, 2026-10-10** (section 18 says what was built and how it differs). Four more were added on **2026-10-11**
on maps 20, 40, 60 and 80 (section 19), so a boss now ends every tenth map. Decisions that need the user are in
section 17; the defaults are in effect.

---

## 1. The problem

From the user, 2026-10-10: bosses do not feel distinct from other enemies, least of all from rares. Add five bosses, met on
maps **10, 30, 50, 70 and 90**, and a more special final boss on map **100**. Each should feel unique and test a different
element of a build: not only elemental resistance, but physical damage, spells against attacks, stun, curses and the
rest. Thinking about the next boss's damage and defences should be part of how a player plans the run.

And the constraint the user set on this plan: **a boss must never make a whole category of build unviable.** A boss
may be easy for one build and hard for another; that is the point. It may not be a wall that some kind of build cannot
climb with gear it can reach by that map.

### 1.1 Where things stand (read from the code)

- **Every tenth map is a gate** (`endKindForMap` in `gen/mapPlan.ts`). Maps 10 to 90 end in a **mini-boss**: the theme's
  champion (`ThemeDef.chief`, nine of them, for example the Ossuary's Bone Warden or the Gilded Treasurer), a
  `miniboss`-rarity monster with four mods (30× life, 1.5× damage). The offer card names it (`OfferInfo`, the `gate`
  line). Abandon is not offered on a gate.
- **Map 100 ends in the only boss**, the Ossuary Regent (`BOSS_NAME`, `population.ts`): a Warrior with 200× life and 2×
  damage, a 1.6 s swing, a 3-tile slam on the character every 7 s, and four Warriors of a random element summoned at
  75%, 50% and 25% (`world.ts` 540–566). Three of the map's monsters guard it. Its death wins the run
  (`Summary.tsx`).
- **What makes a boss a boss today:**
  - +30% to every elemental resistance (`calc/monster.ts` 297);
  - 4× the stun threshold (2× for a mini-boss);
  - 0.67 of curse effects (`BOSS_CURSE_EFFECT`), and half again for the slowing hexes on rares and up;
  - no knockback and no shatter;
  - every blow shakes the ground.

  The character's Strategy conditions treat it as a "boss" target, and it is drawn in the boss colour. Nothing else
  separates it from a big Warrior.

- **The parts a boss can be built from already exist**:
  - defence profiles (`data/defence.ts`): armour, evasion, energy shield, resistances by element, physical reduction,
    immunities, regeneration, a hit cap and the stun threshold;
  - the durability matrix (`calc/matrix.ts`), which says how much longer each of eight reference damage profiles takes to
    kill a profile;
  - the encounter engine (ENCOUNTERS.md): shaped and patterned blasts, windows, modes, debuffs on the character, and
    `EncounterFx` for their tells;
  - the character's hexes (`hexPlayer`), blind, hobble and mark;
  - the camp card's `weakestAxis` line ("Your chaos resistance is −20% against 35% chaos damage").

### 1.2 The constraint: the character plays itself

As in ENCOUNTERS.md 1.1 and PLAYER-AI.md: the character never kites (unless set to), dodges every warning it can see,
targets the nearest enemy (nests and pylons first), and drinks flasks on its own rules. The player's decisions are the
build, the gear, the Strategy tab and the route. A boss is therefore a **question to the build**, and the fight has to
make the question visible: on the camp card before the map, and on the body and the floor during the fight.

---

## 2. The rules every boss keeps

These are the guard against a boss that shuts out a kind of build. Each is checked by a test or by the measurement in
section 13.

1. **One main test, mild extras.** Each boss owns one question (section 3). Its other traits are small, and no two
   bosses own the same question.
2. **Every test has at least two answers, and one of them is open to every build.** The general answers are more damage,
   more life or energy shield, capped resistances and flasks. The specific answer is the reward for building for it (cold
   against the Courser, stun against the Tollkeeper). Missing the specific answer makes the fight longer or more
   dangerous. It never makes it impossible.
3. **No hard counters to a way of dealing damage.** A boss is never immune to a damage type for the whole fight, never
   immune to damage over time, minions, totems or traps, never reflects damage, and never seals the character's main
   skill. Immunities are windows, and every window has an opposite (a weakness, an exposure) that follows it.
4. **Kill-side ceiling.** Averaged over a whole fight (each phase weighted by its expected time), no reference damage
   profile of `calc/matrix.ts` may take more than **2×** as long to kill the boss as the boss's mean over the profiles.
   The Courser and the Unmaker are allowed 2.5× for melee and mono-type profiles respectively, because those are their
   stated tests. A unit test reads each boss's profile and its windows and holds it to this.
5. **Survive-side ceiling.** No single unavoidable hit may exceed **70%** of the life and energy shield of a reference
   character on the curve for that map (one built by the bot, section 13) at full life, with no investment in the defence
   the boss tests. A blast that the character can step out of may hit harder; then the rule is that a safe spot always
   exists within the dodge's 3.5 tiles.
6. **No lock-out.** A boss cannot keep the character stunned, frozen or blinded: after a boss freezes or stuns the
   character, it cannot do so again for 4 s. Monsters do not have such a guard today; bosses get it.
7. **Readable.** Each mechanic has a tell on the floor or the body before it lands, drawn in the boss's colour, and its
   state shows on the boss's health bar (toll count, Sentence weight, attunement, stolen pieces).
8. **Answered by the character.** It is handled by the existing reflexes (dodge, target choice, flasks) or by a small
   new one that the plan names (section 11). The character's stall breaker never gives up on a boss.
9. **The answer is in reach.** The specific answer to a test is something the run can offer before that map: a gem, a
   flask, an item mod or a passive. The camp shows the boss's card from five maps ahead (section 10), so there is time
   to get it.

---

## 3. The six, at a glance

| Map | Boss             | Main test                                                            | Deals                                    | Resists                      | Weak to                         |
| --- | ---------------- | -------------------------------------------------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------- |
| 10  | The Tollkeeper   | single-target damage (with stun and chill as answers)                | lightning spells, light physical         | physical (armour), lightning | cold                            |
| 30  | The Courser      | mobility and reach                                                   | fire attacks, burning ground             | fire, attacks (evasion)      | cold (chill and freeze)         |
| 50  | The Magistrate   | surviving one huge hit, and choosing targets                         | physical                                 | curses, a share of spells    | lightning                       |
| 70  | The Prism Warden | all three elemental resistances, and damage of more than one element | fire, cold and lightning spells, in turn | the element it is attuned to | the element it just left; chaos |
| 90  | The Rotwife      | ailments and chaos resistance                                        | chaos, physical, every ailment           | chaos                        | fire; curses at full effect     |
| 100 | The Unmaker      | build depth                                                          | what it has stolen                       | the type dealt to it most    | breaking its shards             |

**What each boss asks of the kill side and the survive side,** so that the questions do not repeat:

| Axis                                                                   | Owner        |
| ---------------------------------------------------------------------- | ------------ |
| Armour against physical hits                                           | Tollkeeper   |
| Stun as a way to win                                                   | Tollkeeper   |
| Accuracy against evasion                                               | Courser      |
| Curse immunity, spell block (monster)                                  | Magistrate   |
| Energy shield, which chaos goes past                                   | Prism Warden |
| Regeneration; curses at full effect                                    | Rotwife      |
| Adapting to the damage type                                            | Unmaker      |
| **The character's side**                                               |              |
| Lightning resistance                                                   | Tollkeeper   |
| Fire resistance; evasion or block                                      | Courser      |
| A huge physical hit; stun avoidance; curses on the character           | Magistrate   |
| Spell block and spell dodge; elemental ailments; all three resistances | Prism Warden |
| Chaos resistance; every ailment; cleansing                             | Rotwife      |
| Overcapped resistances; redundancy                                     | Unmaker      |

---

## 4. The Tollkeeper — map 10

**The question:** is your damage keeping up? It is the first boss, so its test is the simplest and has the most answers.

**Its body.** A hunched bronze warden that carries a great bell on a yoke. Every toll leaves a crack of light across the
floor, and the toll count burns on the bell.

**The fight.**

- **Tolls.** Every **10 s** the bell swings back (a 2 s tell: the bell rises, a ring of runes fills on the floor), then
  tolls: **Toll waves**, the existing pattern, as expanding lightning rings with gaps, cast as a spell. Each toll also
  **shocks** whatever it hits.
- **Each toll adds a stack, for good:** +10% damage, +6% attack speed, and one more ring in the next toll's waves. The
  first few tolls are easy to step through; by the sixth the rings are close together and the swings come fast.
- **Between tolls** it swings a heavy flail: light physical melee.
- **Three answers to the clock:**
  - **Damage:** kill it before the stacks matter. The median build at the curve should need four or five tolls (40 to
    50 s).
  - **Stun:** a stun during the 2 s tell **cancels that toll** and restarts the 10 s clock. A stunned bell rings flat
    (a dull grey ring, no stack). For this to be a real answer, its stun threshold is 1.5× a normal monster's, not the
    4× that bosses get today.
  - **Chill and freeze:** the toll clock runs at the boss's action speed, so chill slows it and freeze stops it.

**Its card.**

| To kill it                                                | To survive it                                         |
| --------------------------------------------------------- | ----------------------------------------------------- |
| Heavy armour: physical hits do less, small ones much less | Lightning spells that shock, in rings to step through |
| Lightning resistance +30%                                 | Light physical melee                                  |
| Cold −30%; chill and freeze slow its clock                | It speeds up every 10 s                               |
| Can be stunned; a stun in the tell cancels the toll       |                                                       |

**Against each kind of build.**

| Build                                              | How it goes                                                                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Melee physical, big hits                           | Armour costs some damage, but big hits stun: toll cancels make up for it.                                                                                |
| Physical flurry (bow, dual wield, many small hits) | The worst case: armour bites small hits hardest and they rarely stun. Guard: armour is set so the physical flurry probe is at most 1.6× the boss's mean. |
| Lightning spells                                   | Resisted (1.4×). The shock it deals is the bigger worry, at a map where resistances are seldom capped.                                                   |
| Cold anything                                      | Its best answer: weak, and chill slows the clock.                                                                                                        |
| Fire, chaos, damage over time                      | Neutral. DoT ignores armour, which helps.                                                                                                                |
| Minions, totems                                    | Neutral. Toll waves hit minions too, but minions are cheap to resummon.                                                                                  |

**Veto check.** No build is shut out: the clock is soft (stacks, not a death timer), so a slow build fights a harder boss
but not an impossible one. At the sixth toll the boss deals 1.6× damage at 1.36× speed, which a map-10 character on the
curve survives for a while with flasks. The 2× ceiling holds, with the physical flurry at 1.6× its worst.

---

## 5. The Courser — map 30

**The question:** can you reach it? The user, 2026-10-10: it should never fully stop, so that slow melee is punished
hard. "Hard" is the aim; "impossible" is the line.

**Its body.** A rider fused with a burning horse: long legs, a mane of fire, and hooves that leave flame. Dust and embers
trail it; its gallop lanes are drawn before it runs them.

**The fight.** It is always moving, in two gaits:

- **Canter (about 60% of the time).** It circles the character at **2 tiles** (inside melee reach) at a canter of about
  the character's base speed, and strikes as it passes: a fire attack every ~0.9 s. It never stands, but in this gait a
  melee character that stands still has it in reach for most of each lap. Melee strikes against a moving target land if
  it is in reach at the hit (60% of the use time), so slow attacks miss more passes than fast ones.
- **Gallop (every ~6 s, for ~3 s).** It breaks away across the arena along a lane shown on the floor first, leaving a
  **burning lane** (a fire zone, 6 s). Then it turns and **charges back** along a second shown lane into the canter. The
  charge is a dodgeable hit.
- **Never fully still**, as the user asked. It has no stand and no rest. Chill and freeze are the only ways to hold it.
- **Its gallop is not stopped by the character's body**, but minions block it, as they block every monster. A minion
  in its lane breaks the gallop early: a minion build's answer. Totems, traps and mines have no body, so they do not
  block it, but traps and mines are tripped as it passes.

**Its card.**

| To kill it                                                        | To survive it                                   |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| Very evasive: attacks need accuracy; spells always hit            | Fire attacks in passing: evasion and block work |
| Fire resistance +40%                                              | Burning lanes across the floor                  |
| Cold −25%; chill slows it twice as much as usual, freeze stops it | A charge back along a shown lane                |
| Cannot be stunned at a gallop                                     |                                                 |

**Against each kind of build.**

| Build                      | How it goes                                                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Slow melee, no movement    | The worst case, deliberately. In reach during the canter only, and misses passes with slow swings. Guard: canter at least 55% of the time, orbit inside reach 1.5, and the melee probe at most 2.5×. |
| Fast melee, movement skill | Much better: fast swings catch passes, and a gap-closer blink (the existing reflex) follows the gallop.                                                                                              |
| Bow and wand               | Good, if accurate: it is in range all the time. Projectiles can trail a galloping target and miss.                                                                                                   |
| Spells                     | The best: spells always hit. Fire spells are resisted.                                                                                                                                               |
| Cold anything              | The key answer: chill holds it in the canter, and freeze holds it still.                                                                                                                             |
| Damage over time           | Good: a DoT keeps ticking while it runs, and the skill-DoT spells (a withering beam, a creeping plague) skip evasion entirely. Ignite is resisted.                                                   |
| Minions                    | Good: they block its lanes.                                                                                                                                                                          |
| Totems, traps, mines       | Good: a totem keeps shooting whatever it does, and traps and mines are tripped by its passing.                                                                                                       |

**Veto check.** Slow melee is the target and stays viable: it has the canter (55% or more of the fight in reach), and three
answers it can buy by map 30 (attack speed, a movement skill or the haste flask, and any cold damage, which chills).
The ceiling for it is 2.5× the mean; everything else stays under 2×.

---

## 6. The Magistrate — map 50

**The question:** can you take the big one, and will you clear the room to make it smaller? The user, 2026-10-10: more
than _just_ the burst; probably minions.

**Its body.** A tall, robed judge with a headsman's axe for a gavel. Four **Witnesses** stand on plinths round the room,
each tied to the Magistrate by a chain of light.

**The fight.**

- **The Sentence.** Every **15 s** the Magistrate points the axe at the character. An hourglass appears over it and a ring
  closes on the floor for **3 s**, then a physical blow lands. It **cannot be evaded or blocked**, only endured: armour,
  physical damage reduction, endurance charges, guards, life and energy shield all count. A Sentence that lands **stuns**
  unless the character avoids the stun, and the Magistrate's next swing comes straight after.
- **Witnesses weigh the Sentence.** Each living Witness adds **+15%** to the Sentence's damage. Its chain glows brighter
  as the countdown runs, and the hourglass shows the weight.
  - The base Sentence is about 35% of a reference character's pool, so with all four Witnesses it is about 56%, and
    under rule 5's 70%.
  - The Witnesses are frail. Killing them before the Sentence shrinks it.
  - They rise again on their plinths after each Sentence.
- **Witnesses curse.** The character can carry only one monster hex at a time (`BASE_HEX_LIMIT`). So while any
  Witness lives, the character carries one of the four monster hexes:
  - each Witness has its own, and when the hex lapses the next living Witness lays its own;
  - each further living Witness adds 10% to the hex's effect.

  Reduced curse effect on the character answers it (the tree has −25%, and uniques reach immunity). So does killing
  them.

- **Between Sentences** the Magistrate fights in melee with ordinary physical swings.

**Its card.**

| To kill it                                     | To survive it                                              |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Immune to curses ("the court admits no magic") | The Sentence: one huge physical blow; no evasion, no block |
| Blocks 25% of spells                           | The Sentence stuns: stun avoidance matters                 |
| Lightning −25%                                 | Witnesses curse you and make the Sentence heavier          |
| Its Witnesses are frail: kill them first       | Ordinary physical melee between Sentences                  |

**Against each kind of build.**

| Build                      | How it goes                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Armour, life, endurance    | The best: the Sentence is what they are built for.                                                                                                                                                                       |
| Evasion, block             | Harder: those defences do nothing against the Sentence. Their answers are the pool, killing Witnesses, and a life flask before the blow (the new reflex, section 11). Guard: rule 5's 70% with all four Witnesses alive. |
| Low-life energy shield     | Neutral: energy shield counts in full; the Sentence is physical, not chaos.                                                                                                                                              |
| Attacks                    | Unaffected by its defences.                                                                                                                                                                                              |
| Spells                     | 25% are blocked (1.33×). Lightning spells are the answer (−25%).                                                                                                                                                         |
| Curse-reliant builds       | Lose their curse on the Magistrate (not on the Witnesses).                                                                                                                                                               |
| Area damage, chain, pierce | Good: Witnesses die in passing.                                                                                                                                                                                          |
| Single target              | Must turn to the Witnesses (the targeting rule, section 11).                                                                                                                                                             |
| Minions                    | Good: minions kill Witnesses, and the Sentence aims only at the character.                                                                                                                                               |

**Veto check.** The worst case is an evasion build with a small pool that ignores the Witnesses. Rule 5 caps the full
Sentence at 70% of a curve pool, so at full life it survives. Then the flask reflex, Witness targeting and the 15 s gap
make the fight a matter of attrition, not a coin toss. The spell block plus the curse immunity puts a curse-reliant
spell build at about 1.6×, under the ceiling.

---

## 7. The Prism Warden — map 70

**The question:** are all three resistances capped, and does the build hit with more than one element?

**Its body.** A knight of faceted crystal, hollow inside, with a core that burns in the colour of its attunement. The
floor runes and its shield of light take the same colour.

**The fight.**

- **Attunement.** It attunes to fire, cold and lightning in turn, **8 s** each, with a **1.5 s** shift between (the core
  flickers through colours, a tell everyone can read).
  - While attuned it deals **only that element**, and inflicts that element's ailment hard (ignite, freeze or shock).
  - It is **immune to that element**: a skill that deals only that element is skipped by the existing rule (PLAYER-AI 4.1).
  - It is **Fractured** to the element it just left: −40% to that resistance for the first 3 s of the next attunement,
    shown as cracks of the old colour.
- **Patterns, one per element:**
  - fire: a **Closing ring**;
  - cold: a **March** of lanes;
  - lightning: a **Cross**.
    All are spells, so spell block and spell dodge work against them.
- **The crystal shield.** An energy shield worth half its life, which recharges if it takes no damage for 2 s. Chaos
  damage goes past it, as the defence profile already does.

**Its card.**

| To kill it                                               | To survive it                                                |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Immune to the element it is attuned to                   | Spells of one element at a time: spell block and spell dodge |
| Fractured (−40%) to the element it just left             | That element's ailment, hard: ignite, freeze, shock          |
| A crystal shield worth half its life; chaos goes past it | All three resistances, in turn                               |
| Physical and chaos are never resisted                    | A pattern per element: ring, lanes, cross                    |

**Against each kind of build.** Over a 28.5 s cycle, a build of one element is idle 8 s and Fractured-boosted 3 s:

| Build                                 | How it goes                                                                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One element (fire, cold or lightning) | About 1.4× (immune a third of the time, boosted after). The character uses its other skills or its weapon meanwhile, which a periodic skill of another element makes good. |
| Two elements, or conversion           | About 1.1×.                                                                                                                                                                |
| Physical                              | Unaffected (1×), but the shield makes the start slow.                                                                                                                      |
| Chaos                                 | The best: it goes past the shield.                                                                                                                                         |
| Damage over time                      | Like a hit of its element: immunity stops it too. A burn applied during cold attunement stops when fire attunement begins.                                                 |
| Uncapped resistance                   | Punished once per cycle, for 8 s, in that element.                                                                                                                         |
| Evasion, attack block                 | No help: it casts spells.                                                                                                                                                  |
| Spell block, spell dodge              | The best defence.                                                                                                                                                          |
| Freeze-prone                          | Rule 6: one freeze per 4 s at most, so cold attunement cannot lock the character.                                                                                          |

**Veto check.** A mono-element build is 1.4×, well under the ceiling. It is not a wall, because the character already
falls back to its other skills, and the card tells the player five maps ahead that a second element pays. An evasion
build without spell defence relies on resistances, which every build has.

---

## 8. The Rotwife — map 90

**The question:** can you live with ailments? The user, 2026-10-10: this will force the polish of ailment play on the
character's side, and that is welcome (section 11.2).

**Its body.** A bloated crone in rags, trailing a train of rot. Her blows leave visible marks on the character: bleeding
cuts, green veins of poison, embers, frost and sparks, each a tint and an icon.

**The fight.**

- **The rotation.** Her blows carry one ailment each, in a fixed order she shows on her hands: **bleed, poison, ignite,
  chill-then-freeze, shock**. Each blow adds a stack, and the stacks grow until a flask clears them or an immunity
  stops them.
- **The rot.** Where she walks she leaves patches of rot: chaos damage over time. They stay 8 s, and the dodge reads
  them.
- **She regrows.** She regenerates **0.6% of her life a second**, but not while any damage-over-time effect is on her
  (burning, poison or bleeding). She is drawn knitting closed while she regrows.
- **Curses at full strength.** Bosses take 0.67 of curse effects. She takes all of it.

The first draft had her immune to poison. That would shut out poison builds (chaos and poison together), which is the
kind of wall rule 3 forbids. So she resists chaos but can be poisoned, and poison is one of the effects that stop her
regrowth.

**Its card.**

| To kill it                                                   | To survive it                                               |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| Chaos resistance +25% (never immune)                         | Every ailment, in a rotation, stacking                      |
| Regrows, but not while she suffers a damage-over-time effect | Chaos: at most half of her damage; rot patches on the floor |
| Fire −25%                                                    | Cleansing flasks and ailment immunities are the answer      |
| Curses at full effect                                        |                                                             |

**Against each kind of build.**

| Build                                           | How it goes                                                                                                                              |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Ailment immunities, cleansing flasks            | The best: her offence is mostly the stacks.                                                                                              |
| Chaos resistance, chaos immunity                | Good: the rot and her chaos share do little.                                                                                             |
| Low-life energy shield without chaos resistance | The worst case on the survive side: chaos goes past energy shield. Guard: chaos is at most half of her damage, and the rot is avoidable. |
| Damage over time (ignite, poison, bleed)        | The best on the kill side: any DoT stops her regrowth.                                                                                   |
| Hits with no ailment                            | Must out-damage 0.6% a second: about 1.4× at the curve's damage. Hits that ignite often (fire) avoid it.                                 |
| Fast hits                                       | Good: many hits bleed, poison or ignite often, which keeps her regrowth stopped.                                                         |
| Chaos damage                                    | Resisted (+25%, 1.33×). Poison stops the regrowth.                                                                                       |
| Curse builds                                    | The best: full effect.                                                                                                                   |

**Veto check.** Every survive-side test has a general answer (life and flasks) and a specific one (immunities, chaos
resistance). Every kill-side penalty is moderate and has its own counter. The worst kill-side case is a chaos build that
hits without any ailment: it takes both penalties, 1.33× for the resistance and about 1.4× for the regrowth, so about
1.87×. That is under the 2× ceiling, and it is why her chaos resistance is +25% and not the +40% of the first draft.

---

## 9. The Unmaker — map 100

**The question:** what is left of your build when its best part is taken? The user, 2026-10-10: not a replay of the
other bosses, but its own gameplay.

**Its body.** A tall figure of absence: a silhouette cut out of the world, whose edges show the room behind it. What it
steals hangs round it as glowing shards, and it **wears** what it has taken.

**The fight.**

- **Theft.** At **80%, 60%, 40% and 20%** of its life it reaches into the character, and one piece of the build
  comes out as a **shard** that orbits it. In order:
  1. **The highest resistance:** −50 to it. A resistance overcapped by 50 or more loses nothing, so overcapping is the
     defence.
  2. **The best defence:** the largest of armour, evasion, energy shield and block is halved.
  3. **The main skill's supports:** its two strongest support gems stop working.
  4. **The flasks:** none can be drunk.
- **What it takes, it wears.**
  - With your resistance, it **hits in that element**.
  - With your defence, it gains that defence.
  - With your supports, its blows copy their shape: more projectiles, a chain or an area.
  - With your flasks, it **drinks them**: it heals.
    Each is drawn on its body: the shard's colour, a shield, extra arms of light.
- **Shards.** Each shard is a separate frail enemy (4% of the Unmaker's life). Breaking one returns the piece at once,
  **staggers** the Unmaker (a 2 s stun, which it is otherwise immune to), and **exposes** it: +20% damage taken for 4 s.
  A piece once returned cannot be stolen again. The character treats shards as it treats pylons (section 11).
- **Adapting.** It hardens against the damage type dealt to it most in the last 8 s, up to −40% for that type. It shows
  the type as a sheen on its body. The existing Adaptive mechanic (`ADAPT_*`) answers a share of life lost with a flat
  +50 for 6 s, and covers the four non-physical types only. The Unmaker's version is graded and **includes physical**,
  so a physical build is asked the same question as an elemental one.
- **No shortcut.** No single hit takes more than 10% of its life, which only touches the most extreme one-shot builds.
  It cannot be stunned, except by breaking a shard.

**Its card.**

| To kill it                                        | To survive it                                                |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Hardens against the damage type you deal it most  | It steals your best resistance, defence, supports and flasks |
| No hit takes more than 10% of its life            | It hits in the element it stole, with your supports' shape   |
| Breaking a shard returns the piece and exposes it | It drinks your stolen flasks                                 |
| Cannot be stunned, except by breaking a shard     |                                                              |

**Against each kind of build.**

| Build                                                 | How it goes                                                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Balanced, overcapped                                  | The best: each theft costs it little.                                                                                                                                           |
| One great pillar (a single defence, a single element) | The worst: the theft takes the pillar, and the adaptation takes the element. Guard: thefts last only while their shard lives, and shards are frail and come first in targeting. |
| Area damage, chain                                    | Good: shards die in passing.                                                                                                                                                    |
| Mono-type damage                                      | Up to −40% while it adapts, about 1.5× over the fight; allowed up to 2.5× (rule 4).                                                                                             |
| Flask-reliant                                         | Hurt by the fourth theft, so it comes last, at 20%.                                                                                                                             |
| Minions, totems                                       | Supports stolen from the summon gem weaken the minions; shards die to minions quickly.                                                                                          |

**Veto check.** Every theft is undone by breaking its shard. The character goes for shards first, and a shard is frail,
so a theft lasts a few seconds for most builds. No theft removes the main skill, only its supports. Overcapping and a
second element are answers any build can reach by map 100.

---

## 10. Preparation: the card at camp

The user, 2026-10-10: considering the next boss's damage and defences should be part of the strategy as the boss draws
near.

- **The boss strip.** From **five maps before** a boss map, the camp screen shows a strip: the boss's name, its portrait,
  "in N maps", and its card (the two halves of the tables above). On the boss map itself, every offer card replaces the
  gate line with the boss's card.
- **Readiness lines.** Under the card, a few lines read from the character, like `weakestAxis` does today, each marked
  ok, warn or bad. For example:
  - "Your lightning resistance is 22% (it deals lightning)."
  - "Your hit chance against it is 71% (it is evasive)."
  - "The Sentence, with four Witnesses, is 61% of your life and energy shield."
  - "No cleansing flask (it inflicts every ailment)."
  - "Your main skill deals only fire (it is immune to each element in turn)."

  A function `bossReadiness(character, boss)` computes them from the same numbers as the sheet. A test pins one line per
  test.

- **The inspect card** in the fight lists the card too, and the boss's health bar shows its state (toll count, Sentence
  weight, attunement, stolen pieces).
- Nothing here changes the offers. Whether the offers before a boss should lean toward its answers is open question 6.

---

## 11. What the character needs

### 11.1 Reflexes (sim/ai.ts, flaskPolicy.ts)

1. **Priority targets.** Witnesses and shards count as **4 tiles nearer** for targeting, as nests and pylons do today.
   Shards are targeted even through a wall, like pylons, since the theft lasts as long as they live.
2. **The stall breaker never drops a boss.** A boss window (the Prism Warden's immunity) is time without damage; the
   breaker must not count it, and must never ignore a boss.
3. **A flask before a known blow.** When a telegraphed hit that cannot be dodged (the Sentence) will land within 0.5 s and
   the character's life is below the hit's expected size plus a margin, the life flask is drunk, even above its
   threshold. Small, and general: any future unavoidable blow uses it.
4. **Follow a galloping target.** No new reflex: the gap-closer blink and walking cover it. The Courser's orbit is
   inside melee reach, so a melee character standing still has it in reach for most of a canter lap.

### 11.2 Ailments on the character (for the Rotwife; useful everywhere)

The Rotwife needs ailment play on the character's side to be legible and answerable. What the code has (section 14.1)
leaves real gaps:

- **Cleansing flasks:** only burning, bleeding and freezing (with chill) can be removed. There is **no removal for poison
  or shock**. Add the missing flask suffixes, after checking the 3.9 data for what they are and do.
- **Avoidance:** `avoid.*` is rolled for every ailment, but its only sources are uniques: nothing in the tree or the
  affixes. Add the 3.9 sources the build can reach before map 90 (passives, item mods, auras), again from the 3.9 data,
  not from memory.
- **Holes in immunity:**
  - the shocking ground zone sets shock without checking immunity or avoidance;
  - hobble checks only "cannot be chilled", not chill avoidance.
- **Legibility:** every ailment the character suffers shows on its body (a tint) and in the HUD's status row with its
  stacks and time left.
- **The flask policy** drinks a cleansing flask when its ailment is on the character, as it does for burning, bleeding
  and freezing today.
- **Rule 6's lock-out guard** for freeze and stun from bosses.

Ailment play is polished for every map, not only hers; the user welcomed that. It happens at the start of milestone B5.

### 11.3 The monster side

- **The card is the whole truth.** The six bosses do not get today's flat boss bonuses: +30% elemental resistance, 4×
  stun threshold and 0.67 curse effect. Their cards set each of these themselves. Otherwise the Tollkeeper's +30%
  lightning would be +60%, and its stun answer would be out of reach.
- **Spell block on a monster** (the Magistrate): the `spellwarded` mod already gives 40%. Its chance becomes a
  `DefenceProfile.spellBlock` number, the mod keeps its 40%, and the Magistrate has 25%. The matrix reads it for its
  spell probes.
- **Curse effect on a monster:** `DefenceProfile.curseEffect` replaces the flat `BOSS_CURSE_EFFECT`. The Magistrate uses
  the existing `hexWarded`; the Rotwife's effect is 1.
- **The rest exists, or is a few lines:**
  - the hit cap (it does not cap DoT, which is right);
  - regeneration, plus the new rule that it stops while a DoT is on her;
  - adaptation, graded and with physical;
  - monster ES recharge.
- **Culling strike** has no rarity check today. In 3.9 it works on bosses, so it stays.

---

## 12. Engine

| Piece               | Where                                                                                                                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boss data           | `src/data/bosses.ts` (new): `BossDef` with id, name, map, body, card lines, defence profile, life and damage multiples, timers and pattern ids.                                                                                                                 |
| Schedule            | `gen/mapPlan.ts`: `endKindForMap` returns `'boss'` on 10, 30, 50, 70, 90 and 100, with the boss id from `bossForMap`. 20, 40, 60 and 80 keep their champions.                                                                                                   |
| Arena               | The end room of a boss map is a round arena, joined to the labyrinth (`gen/arena.ts` gives the shape). It is large enough for the Courser's gallop. No escort.                                                                                                  |
| Spawning            | `gen/population.ts`: the boss spec carries `bossId`; Witnesses are placed with it. The Regent's code becomes the Unmaker's.                                                                                                                                     |
| Fight scripts       | `src/sim/bosses/` (new): one file per boss, with `tick`, `onHit` and `onDeath`, called from where `world.ts` handles the Regent now. They reuse the encounter engine (blasts, patterns, windows, modes) and `EncState`.                                         |
| Theft               | `src/sim/bosses/unmaker.ts` and a `Theft` record on the world. Character stats are re-read with the theft applied, the way `hexPlayer` changes them.                                                                                                            |
| Cards and readiness | `src/run/bossInfo.ts` (new): `bossCard`, `bossReadiness`. `ui/Camp.tsx` strip, `ui/OfferInfo.tsx` gate line, `ui/Hud.tsx` boss bar.                                                                                                                             |
| Visuals             | `src/render/styles/grim/bossFx.ts` (new), on the `EncounterFx` host: the bell and its count, gallop lanes and the dust trail, hourglass and chains, attunement colours and cracks, ailment tints, shards and what the Unmaker wears. New figures in `paint.ts`. |
| Dev                 | `__dev.boss(id, { level, build })` stages one boss in an arena, like `__dev.stage`.                                                                                                                                                                             |
| Text                | `Summary.tsx` names the final boss. PLAYER-AI.md gets section 11.1's rules (with its author).                                                                                                                                                                   |

The sim keeps its rules: no `Math.random`, `w.rngAi` for choices, and no new fields on `Actor` literals beyond what the
x9 speed floor allows (a boss's state lives in its own record, as `EncState` does).

---

## 13. Measuring

Bot samples are run sparingly: the user's standing preference is no incremental sims and at most one at the end.

- **Unit tests per boss** (no bot):
  - its card is complete;
  - its windows and phases fire in the order the plan says;
  - each answer works: a stun cancels a toll; chill slows the Courser; killing a Witness shrinks the Sentence; a broken
    shard returns its piece;
  - rule 6's guard.
- **The ceilings** (rules 4 and 5) as tests. The Courser's melee penalty is about position, not defences, so the matrix
  cannot see it. Its ceiling is checked by a test of a standing melee character's hit rate against the canter, and by the
  gauntlet.
  - the kill side reads each boss's profile through `calc/matrix.ts` with its windows weighted by time;
  - the survive side computes the Sentence and the other big blows against a reference pool per map, read from the
    curve the bot's characters follow.
- **The gauntlet** (`scripts/boss-gauntlet.ts`, new, built after B6). For each boss, each of the six classes is played
  by the bot to the map before, then fights the boss map over a few seeds, as `theme-lethality` does for themes. It
  prints the clear rate, the time to kill, the lowest life and the cause of any death. A second mode stages fixed reference
  builds (melee physical, physical flurry, fire, cold and lightning spells, ignite, poison, minions, totems) at the boss's
  level with gear on the curve, so that each category of section 14 is measured even where the bot never builds it.
- **Acceptance**, at the one measurement run (B7):
  - every reference build clears every boss in at least half its seeds;
  - the slowest build's time to kill is at most **2.5×** the fastest's (3× for slow melee on the Courser);
  - no boss is the top cause of death of the 24-run bot sample by more than half again the next one.

---

## 14. The build × boss table

`+` easier than the mean, `−` harder, `−−` the boss's own test (hard, never a wall), blank neutral.

| Build category              | Tollkeeper | Courser | Magistrate | Prism Warden | Rotwife | Unmaker |
| --------------------------- | :--------: | :-----: | :--------: | :----------: | :-----: | :-----: |
| Melee, big hits             |     +      |   −−    |            |              |         |         |
| Melee, fast hits            |     −      |    −    |            |              |    +    |         |
| Bow and wand                |     −      |    +    |            |              |         |         |
| Spells (hits)               |            |    +    |     −      |              |         |         |
| Damage over time            |     +      |    +    |            |              |    +    |         |
| Fire                        |            |    −    |            |      −       |    +    |    −    |
| Cold                        |     +      |    +    |            |      −       |         |    −    |
| Lightning                   |     −      |         |     +      |      −       |         |    −    |
| Chaos                       |            |         |            |      +       |    −    |    −    |
| Two or more elements        |            |         |            |      +       |         |    +    |
| Minions                     |            |    +    |     +      |              |         |         |
| Totems, traps               |            |    +    |            |              |         |         |
| Curse builds                |            |         |     −      |              |    +    |         |
| Area, chain, pierce         |            |         |     +      |              |         |    +    |
| Armour and life             |            |         |     +      |              |         |         |
| Evasion, attack block       |            |    +    |     −−     |      −       |         |         |
| Spell block, spell dodge    |     +      |         |            |      +       |         |         |
| Energy shield               |            |         |     +      |              |    −    |         |
| Ailment immunity, cleansing |            |         |            |      +       |   ++    |         |
| Stun, stun avoidance        |     +      |         |     +      |              |         |         |
| One great pillar            |     +      |         |            |              |         |   −−    |

Every row that has a `−` or `−−` also has a `+` somewhere, and no build has two `−−`. A few of the `+` entries above
need a word:

- energy shield at the Magistrate: half of all stuns are ignored while energy shield is up, which blunts the Sentence's
  stun;
- one great pillar at the Tollkeeper: a single huge damage pillar is exactly what beats a clock. Every column has builds it
  favours. A test holds the table to the data, as in ENCOUNTERS.md section 10: every boss trait has a row entry.

### 14.1 What exists today for each category (code audit, 2026-10-10)

The categories above are real in the code. Counts are of active gems in `ALL_GEMS`.

- **Classes (6):**
  - vanguard: 2-handed mace;
  - strider: bow;
  - mystic: wand and energy shield;
  - reaver: sword and shield;
  - zealot: sceptre and energy-shield shield;
  - shade: dexterity and intelligence.
- **Melee:**
  - 25 strikes and 13 slams or areas, and 7 attacks that move;
  - mostly 100% physical, with partial conversion to an element on some, and a few that are half chaos;
  - so armour, the hit cap and physical reduction fall on them.
- **Ranged attacks:** 14 bow and 9 wand or thrown, physical unless converted. Four bow skills are fully fire.
- **Spells:** 39, across all five damage types; 5 are physical. Spells always hit.
- **Damage over time:**
  - 11 skills with their own DoT: 7 chaos, 3 fire and 1 cold;
  - ailment builds run through supports, 121 in all;
  - skill DoTs skip evasion, block, armour and the hit cap.
- **Minions:**
  - 13 summoning skills: golems of each element, husks, bonewalkers, spectres, a relic, motes and a decoy;
  - 2 clone attacks.
  - Minions pick the nearest enemy, not the character's target. Monster area attacks, blasts and zones hit them; chain
    retargets do not.
- **Deployables:** 8 totems, 9 traps, 3 mines and 2 brands. They have no body and cannot be hit.
- **Movement:** 8 blinks plus the 7 moving attacks; the haste flask (+40%); the move-speed stat. A blink closes a gap or,
  with the Escape role, gets out.
- **Curses the player casts:** 13. The hexing-strikes support curses on hit.
- **The character's defences, all applied:**
  - armour;
  - evasion, against attacks only;
  - attack block and spell block, each up to 75%;
  - attack dodge and spell dodge, up to 75%, from two keystones, buffs and uniques (there is no spell suppression);
  - stun threshold, stun avoidance, and "cannot be stunned";
  - resistances and maximum resistances, fortify, energy shield and its recharge, regeneration, leech;
  - self curse effect: −25% from the tree, immunity only from uniques.
- **Ailments on the character:** see section 11.2. In short: avoidance is from uniques only, and nothing removes poison
  or shock.

---

## 15. Milestones

Each ends with `npm run check`, the x9 speed floor, a look in the browser pane, and a commit of my own files only (the
tree is shared; never `git stash`; the user pushes).

| #   | Milestone        | What                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B0  | Frame            | `bosses.ts`, the schedule (each gate turns into a boss map only when its boss lands; until then it keeps its champion), the arena, the boss strip and readiness lines, the boss bar, the targeting and stall-breaker rules, rule 6, `__dev.boss`, the ceiling tests. The Regent moves to map 100 as a placeholder for the Unmaker. |
| B1  | The Tollkeeper   | The first boss, end to end, as a vertical slice. Then the user plays it.                                                                                                                                                                                                                                                           |
| B2  | The Courser      | The two gaits, lanes, minion blocking, chill on its clock.                                                                                                                                                                                                                                                                         |
| B3  | The Magistrate   | Witnesses, the Sentence, the flask reflex, `spellBlock` in the profile, curse effect per boss.                                                                                                                                                                                                                                     |
| B4  | The Prism Warden | Attunement, Fractured, the three patterns, the crystal shield.                                                                                                                                                                                                                                                                     |
| B5  | The Rotwife      | The ailment audit and polish of section 11.2 first, then her rotation, rot and regrowth.                                                                                                                                                                                                                                           |
| B6  | The Unmaker      | Theft, shards, what it wears, adaptation. The Regent is retired (open question 2).                                                                                                                                                                                                                                                 |
| B7  | One measurement  | The gauntlet and one 24-run bot sample. Tuning is in `bosses.ts`. Docs: PROGRESS.md, DESIGN.md, PLAYER-AI.md (with its author).                                                                                                                                                                                                    |

B1 is the point to stop and play before building the other five.

---

## 16. Risks

| Risk                                                                | Answer                                                                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| A boss shuts out a category of build, and a run ends at a gate      | The rules of section 2, their tests, the gauntlet's reference builds, and the card five maps ahead.                             |
| A boss is a damage tax the character cannot answer                  | Every mechanic names its reflex (section 11.1); each has a test showing the character answering it.                             |
| The Courser's movement breaks melee hit resolution or pathing       | Its orbit is a fixed radius inside reach; the gallop only crosses open arena; a test for a standing melee character's hit rate. |
| Freeze or stun lock                                                 | Rule 6, tested.                                                                                                                 |
| The Unmaker's theft is complex (stats re-read mid-fight)            | It reuses the hex path (a temporary modifier on the character), and comes last (B6).                                            |
| The Rotwife needs work outside the boss (ailments on the character) | It is scoped and audited first in B5, and useful on every map, not only hers.                                                   |
| Map 100 at the default scaling is ×20 harder than the old curve     | The Unmaker's life and damage are set from the gauntlet, not from the Regent's 200×.                                            |
| The other agent edits the character's AI (`utility.ts`, strategy)   | The reflexes of section 11.1 touch `ai.ts` targeting and `flaskPolicy.ts` only; coordinate before B3.                           |
| Names clash with the reference game                                 | Every name passes `ip.test.ts`.                                                                                                 |

---

## 17. Open questions (defaults in effect until answered)

1. **Champions on maps 10, 30, 50, 70 and 90:** replaced by the bosses. Default: yes; champions stay on 20, 40, 60
   and 80. A boss map still pays its theme's bonus currency.
2. **The Ossuary Regent:** retired when the Unmaker lands. Default: retired; the summary names the Unmaker.
3. **Death at a boss:** ends the run as any death does. Default: yes. (A retry would soften the gates; not in this plan.)
4. **Rewards:** what a boss drops. Default: what the Regent's rarity gives today (30× experience), a guaranteed unique,
   and twice a champion's currency.
5. **How far ahead the card shows:** default five maps.
6. **Should the offers before a boss lean toward its answers** (for example a cold support before the Courser)? Default:
   no. The card informs and the player chooses.
7. **Does the bot prepare for a boss** (read the card at camp)? Default: no. The gauntlet then measures unprepared builds,
   which is the lower bound the ceilings are about.
8. **The Unmaker's fourth theft (flasks):** in, or too cruel at 20%? Default: in. It is last, and its shard is frail.

---

## 18. As built (2026-10-10)

Built the same day, all milestones at once (the user asked for the whole plan without stopping). Local commits only.

### 18.1 What is where

| Piece                                                                                | Where                                                                                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| The bosses' data and cards, the schedule, every tuning number                        | `src/data/bosses.ts`                                                                                       |
| The eight types (six bosses, the Witness, the shard), boss-only                      | `src/data/monsters.ts` (`bossOnly`), kept out of every pack pool in `gen/packs.ts` and `gen/population.ts` |
| The arena appended past the last room                                                | `src/gen/bossArena.ts`, from `gen/mapPlan.ts`                                                              |
| The fights                                                                           | `src/sim/bosses.ts`, called from the encounter hooks (`sim/encounters.ts`) and `monsterAI` (`bossAI`)      |
| What the Unmaker holds                                                               | `src/sim/theft.ts`, read by `characterWith` (`sim/charges.ts`) as trophies are                             |
| Ailments and stuns outside a hit, the boss lock (rule 6)                             | `src/sim/afflict.ts`                                                                                       |
| Cleansing flasks for poison, shock and curses; immunity during every cleansing flask | `data/flasks.ts`, `calc/flasks.ts`, `sim/world.ts`, `sim/flaskPolicy.ts`                                   |
| The tells                                                                            | `src/render/styles/grim/bossFx.ts`; the figures in `render/style/figure.ts`                                |
| The boss bar, the card, ailment and theft chips                                      | `src/ui/Hud.tsx`, `src/ui/BossCard.tsx`                                                                    |
| The card and readiness at camp; the offer line                                       | `src/ui/Camp.tsx`, `src/ui/OfferInfo.tsx`, `src/run/bossInfo.ts`                                           |
| Tests                                                                                | `src/sim/bosses.test.ts` (every mechanic, the boss maps, rule 4)                                           |
| The gauntlet                                                                         | `scripts/boss-gauntlet.ts`                                                                                 |
| Dev                                                                                  | `__dev.fight(id, { level, until })`                                                                        |

### 18.2 What changed on the way

- **The arena** is appended to the side of the labyrinth whose way out from the last room crosses no floor, joined by a
  straight corridor (radius 11). The boss stands alone; the Magistrate's Witnesses rise when the fight begins.
- **The flat boss bonuses** (+30% elemental resistance, 4× stun threshold, the 1.6 s swing, the boss radius) apply only to
  the old kind of boss; the six take their card's numbers. Curse effect is the card's too (the Magistrate is hex-warded).
- **A timed move waits for the boss to be between blows**, as windows do: a boss in a fight is otherwise never between
  them.
- **The Courser's evasion is +100%**, not the "very evasive" first written: a probe showed a third of the swings that reached
  it landing, which on top of the canter would have hit melee attack builds twice.
- **The Rotwife regrows 0.4% a second, not 0.6%**: the rule 4 test showed 0.6% put a chaos build with no ailment at about
  2.1× (over the ceiling).
- **The Magistrate is weak to lightning** (section 3), so that lightning builds have a boss that favours them.
- **The Unmaker** hits in the element it stole (it takes that element's variant) and drinks the flasks it holds. It does
  **not** yet wear the stolen defence or copy the stolen supports' shape; the theft itself, the shards and the stagger are
  as planned.
- **Ailment avoidance from items and passives** was not added: the cleansing flasks (now all of 3.9's: removal on use and
  immunity during the effect) are every build's answer, and the holes in immunity (shocking ground, hobble) are closed.
- **Rule 5** is measured by the gauntlet (the Sentence's share of the pool), not a unit test: the pool of a curve
  character is the bot's.
- **Rewards** needed nothing: a boss already drops two uniques, three times the currency of a normal monster's roll (twice a
  champion's), the theme's bonus currency and 30× experience.

- **A boss map is one offer** (the user, 2026-10-10): the level select shows the boss's own panel instead of three cards,
  set apart from every other level (a banner, the boss's portrait, its question, its card, where the build stands, the
  map that leads to it, and one "Face …" button). No Respite, no map type, no level offset on a boss map. The side strip
  shows the next boss only before its map.
- **The warning describes, and does not advise** (the user, 2026-10-11: the card was too didactic, and discovery is part
  of the joy): two lines of what the boss is (`BossDef.brief`), with nothing about resistances, weaknesses or how to
  fight it. The question, the deals/resists/weak head, the kill and survive columns and the readiness lines (and
  `src/run/bossInfo.ts` with them) are gone from the screen; the detail stays in this document. The player finds out
  what a boss is hard and soft to by fighting it.
- **A boss map is left on its own after twice the usual time** (about 17 minutes instead of 8; the user, 2026-10-10), so
  a long boss fight is not cut short, while a character that cannot win is still not stuck for ever.

### 18.3 The measurement (one 24-run bot sample)

Four bot runs of each class, every boss fight watched (`scripts/boss-gauntlet.ts`). The bot's builds are much weaker than a
player's, and most runs ended before map 50 for reasons that are not the bosses.

| Boss              | Fought | Won | Died there | Mean kill time | Slowest | Mean low point | Notes                                                    |
| ----------------- | ------ | --- | ---------- | -------------- | ------- | -------------- | -------------------------------------------------------- |
| Tollkeeper (10)   | 17     | 11  | 3          | 67 s           | 129 s   | 59%            | 8.1 tolls                                                |
| Courser (30)      | 9      | 9   | 0          | 83 s           | 281 s   | 88%            | 8.2 gallops blocked by minions                           |
| Magistrate (50)   | 3      | 2   | 1          | 96 s           | 149 s   | 54%            | 7.3 Sentences, the largest 26% of the pool before armour |
| Prism Warden (70) | 1      | 1   | 0          | 58 s           |         | 85%            |                                                          |
| Rotwife (90)      | 1      | 1   | 0          | 109 s          |         | 87%            |                                                          |
| Unmaker (100)     | 0      |     |            |                |         |                | no run reached it                                        |

The user, 2026-10-10: the bot's builds are not a player's, the game runs at up to 8× speed, and a one-minute fight is not
the target. So the bosses' life was **not** cut from this sample. The one change made from it is the Tollkeeper's armour
(+150% to +100%): the strider (bow, many small physical hits) lost both its fights there, which is the build-category wall
the plan's rule 3 is about. What the target length of a fight should be is open question 9.

9. **(added) How long a boss fight should take** for a player's build at 1× speed. Default: as built, with no target set
   from the bot.

---

## 19. Four more: maps 20, 40, 60 and 80 (2026-10-11)

The user, 2026-10-11: the bosses add a great deal to the game's strategy, so add four more at the tenth maps that lack one
(20, 40, 60 and 80), drawing on the pitches that were nearly included. Eight were pitched (the Carapace Knight, the Bulwark
Engine, the Sundered Twins, the Hollow Choir, the Veiled Duellist, the Culler, the Glass Saint, the Siege Marshal); the
user kept **the Bulwark Engine, the Sundered Twins, the Veiled Duellist and the Siege Marshal**. All four keep every rule of
section 2.

| Map | Boss                | Main test                                | Deals                          | Soft to                                    |
| --- | ------------------- | ---------------------------------------- | ------------------------------ | ------------------------------------------ |
| 20  | The Siege Marshal   | endurance: a long fight with no spike    | physical (sabre), his soldiers | anything: he is gentle                     |
| 40  | The Veiled Duellist | critical strikes, both ways              | physical, in a fan of crits    | anything that does not need to crit        |
| 60  | The Bulwark Engine  | hit size, and stun, both ways            | physical, slow and heavy       | many small hits, given time                |
| 80  | The Sundered Twins  | defence and offence of two kinds at once | physical (Ash), fire (Cinder)  | the elements (Ash), a plain blade (Cinder) |

### 19.1 The Siege Marshal — map 20

**The question:** can you keep your feet through a whole battle? It is an early boss, so it is the gentlest: no spike, no
clock, only attrition.

- He stands at the middle of the arena and **commands**. A horn sounds (a 1.6 s tell), then a regiment marches in from the
  arena's edge: **three regiments** (shieldbearers and warriors; archers and a shieldbearer; mages and warriors). They are
  his, not rolled: no experience, no loot, and they leave with him.
- **Command.** While his soldiers stand he takes **6% less** from every hit for each, up to 60%. It applies to every damage
  type alike, so no build is favoured by it. When the last of the third regiment falls he **comes down himself**, and for
  6 s he is **routed** (takes 20% more) before he fights, with a sabre.
- The next regiment comes when the last has **thinned to two**, or **22 s** after it came, whichever is first: he cannot be
  outlasted by standing back, and a build that clears slowly meets more of them at once.
- Answers: damage (the whole fight shortens), clear speed and area (the soldiers), recovery and flasks (the attrition), and
  defences of every kind (the soldiers attack in different ways). Nothing in it is specific.

### 19.2 The Veiled Duellist — map 40

**The question:** how much of your damage depends on crits, and can you take his?

- He fights behind a **veil**: while it is up, **nothing can crit him**. The veil is up for **3 s of every 9** (a third).
  Every hit that would have crit lands at its base instead.
- When the veil drops he **lunges**: three lanes of steel fan toward the character, shown for 0.9 s on the floor, each a
  blow of **1.7×** his usual (the crit). They can be stepped out of like any blast. After the lunge he is **bare** for
  2.5 s (takes 25% more).
- Between lunges he fights with quick, light blows.
- The lanes fan out from him, so at his feet they overlap: a character that stays in reach through the tell takes all three
  (about 4.5 times a blow of his, the size of a Sentence), and one that steps out takes none. It is the sharpest moment
  of the four new fights; the lanes are 0.45 radians apart to give the step sideways room.
- The veil costs a build that lives on crits at most about a third more time, however large its multiplier (tested), and
  the bare window gives every build something back. A build with no crits loses nothing to the veil. Defending against
  his lunge is life, armour or evasion and the usual reflex of stepping out of the lanes; no stat in the game reduces the
  extra damage of a crit taken (open question 10).

### 19.3 The Bulwark Engine — map 60

**The question:** are your hits big enough, and can you take a stun?

- Its **plates** are a bar worth **10% of its life**. While they stand, **hits take 35% less**. A hit wears the bar down
  by its damage times a weight: **1.0 for a hit of 1.2% of its life or more, falling to 0.3 for the smallest**, never
  lower. So big hits break it fast and small ones take about three times as long, and never fail to.
- **Damage over time** (a burn, a bleed, a poison) is not reduced by the plates, and chips the bar at 0.3 of what it deals:
  rule 3 holds, and a damage-over-time build is neither helped nor hindered by them.
- When the bar goes the plates **give**: it stops dead for **5 s** (stunned, whatever its stun threshold, which is
  otherwise immune) and takes **50% more**. Then they are replaced and the bar is full.
- Its blows are slow and heavy, and **stun the character** (0.7 s, once in the boss lock of rule 6). Every 13 s it
  **grinds**: a line of pistons marching at the character, the March pattern.
- Stun avoidance helps against it. It is the second boss that stuns the character (the Magistrate's Sentence is the
  other), and the only one that asks it every blow.
- Tested: over a range of damage rates, the smallest hits take at most twice as long to kill it as the biggest.

### 19.4 The Sundered Twins — map 80

**The question:** can you deal with two sorts of enemy at once, with two sorts of defence?

- **Ash** is slow, armoured and physical, and weak to the elements (-15% to each). **Cinder** is quick, evasive and
  elemental (it deals fire; resistant to all three elements, and with no armour), and casts from range. They stand together
  in the arena. Each has **its own life**, half of the fight's each, and its own bar.
- **When one dies, the other grieves.** The user asked what happens when one dies. The pitch said "shared life", which would
  have left nothing to happen, so it is two lives instead: the survivor is **30% faster and deals 25% more**, and every
  6 s it sends **the dead twin's own kind of blow**. Cinder, alone, casts Ash's steel (the Cross, eight lanes, physical);
  Ash, alone, casts Cinder's fire (the Closing ring, fire).
- The map is over only when both have fallen (the exit opens when none of the arena's own is left).
- The order is the player's: the character takes whichever is nearest. A build strong against one twin kills it first and
  meets the other grieving. The fight's length is the mean of the two bodies (the kill-side ceiling is held to it).

### 19.5 As built

- Data in `src/data/bosses.ts` (`siegeMarshal`, `duellist`, `bulwarkEngine`, `twins` with `partners: ['cinder']`;
  `bossOfType` finds a boss by any of its types), monsters in `src/data/monsters.ts` (`siegeMarshal`, `duellist`,
  `bulwarkEngine`, `ash`, `cinder`), fights in `src/sim/bosses.ts`, the veil's crit rule in `sim/combat.ts` (`hit`), the
  second twin placed by `gen/population.ts`, the HUD's bar for each boss in a fight (`ui/Hud.tsx`), the tells in
  `bossFx.ts`, the rigs in `render/style/figure.ts`. Tests in `src/sim/bosses.test.ts`.
- **A boss now ends every tenth map.** `endKindForMap` never returns a mini-boss for one, so **the nine theme champions
  (`ThemeDef.chief`) have no map to end now**, except a Crawl's last segment and a Quarry's. (Open question 11.)
- The camp's description of each (two lines, in the style of the others, advising nothing) is `BossDef.brief`.

### 19.6 Open questions (defaults in effect)

10. **A defence against crits.** The Duellist's lunge is a crit in all but name; nothing reduces a crit taken. A small
    passive or item mod ("hits against you have less extra damage when they crit") would give it a specific answer.
11. **The nine champions.** The theme champions (the Bone Warden, the Treasurer, the Cinder Tyrant and so on) are met
    nowhere on the maps now that every tenth map is a boss's. They could stand beside the boss as its escort, take the
    place of a rare at the end of other maps, or be left to the Quarry and the Crawl.
