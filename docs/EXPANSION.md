# Bob — Depth Expansion Plan: uniques, enemy factions and currency

Status: **approved with changes, 2026-10-06** · Owner: the user · Implementer: Claude

This plan extends [DESIGN.md](DESIGN.md). The decisions in section 3 are recorded in DESIGN.md §2 and Appendix A, and
this file tracks the X milestones in section 11. One question is still open: secondary casts (5.5a, section 13).

**Changes from the review:**

- unique jewels are out;
- currency was redesigned around the player's agency (section 8);
- triggered skills follow the reference game's rules, including mana (5.5), and a proposal to cast every equipped skill
  was added (5.5a);
- saves may break, so the v1 → v2 migration is gone.

Conventions follow DESIGN.md:

- Tables are authoritative.
- Every number is a v1 value and _tunable_ unless stated.
- Reference-game names appear only in parentheses, to say which mechanic is meant (DESIGN §3.5).
- Every name in an "Ours" column is invented here and must pass the IP scan when it enters `src/data`.

**Reading guide.** Sections 0–4 make the case and list the decisions; start there. Sections 5–9 are the systems.
Sections 10–11 cover how we measure and the build order. Sections 12–13 are risks and open questions.

---

## 0. Summary

- **The problem.** Almost every decision today is "take the bigger number":
  - a greedy bot that maximises DPS × EHP wins 22 of 60 runs;
  - uniques barely exist in practice: a 100-map run finds 2–7, and the bot wore none at the end of 6 of 6 runs;
  - the tree's 139 notables are unconditional stat bonuses;
  - enemies differ in their stats, not in what they demand of a build.
- **The approach.** First add a small set of engine **verbs**: new conditions and flags, item rules and triggers, and
  later charges and curses. Then build three kinds of content on them:
  1. **About 40 uniques that change behaviour**, each modelled on a reference-game unique. They are released in waves
     by engine cost, together with an **acquisition overhaul** so they are actually found and worth wearing.
  2. **Enemies that ask questions:** 15 counterplay monster mods (mostly data or a single new flag), then five new undead
     **factions** with their own types, champions and drops, staged by art and engine cost.
  3. **Eight currencies, five essences and a Workbench**, built so the player chooses what happens to an item: which
     affix goes, which family is added, which affixes are kept, how many sockets. Chance only fills in details, or
     offers a short list to pick from. A few gambles remain as an opt-in risk dial.
- **The glue.** Map themes and map affixes that say what you will face, a camp **threat preview** (your DPS and EHP
  against each offered map), and a **death recap**. Together they turn the existing 1-of-2 map choice into the main
  strategic decision of a run.
- **Measurement first.** Before any content, fix the bot's blind spot: it scores with every condition switched off, so
  conditional and triggered effects look worthless to it. Then make it choose maps, and add depth metrics to
  `npm run sim` and `npm run random` (section 10).
- **Build order** (baselines are recorded in X1, before any engine change):
  - X1 measurement;
  - X2 engine verbs, triggers and (if approved) secondary casts;
  - X3 acquisition and uniques wave 1;
  - X4 trigger uniques;
  - X5 counterplay mods, map affixes and the threat preview;
  - X6 currency;
  - X7 factions I (Rot, Hollow);
  - X8 charges, curses and the Choir;
  - X9 Swarm and Reliquary.

---

## 1. Goal and principles

**Goal** (the user's words): expressive, skillful choices that produce interesting new behaviour through the
combinatorial interaction of items, enemies, skill trees and game mechanics.

1. **Verbs over numbers.** New content changes _what happens_ (a spell fires on a crit, chaos stops bypassing energy
   shield, a corpse rises, a shock spreads), not only _how much_. A line that only adds a number belongs in the affix
   pool.
2. **Power has a price the build must solve.** Examples: no sockets, a lost ring slot, more damage taken, a damage type
   you can no longer deal. Solving the price is the skill.
3. **Enemies ask questions; builds answer them.** Every faction and counterplay mod punishes one strategy. Each can be
   answered from at least two systems: tree, unique, gem, flask, currency or map choice.
4. **Information before commitment.** The player cannot act inside a map (D9). So every threat is visible in camp
   before the map is chosen, and every death is explained afterwards.
5. **If the calc engine can't see it, it doesn't exist.** Players and the bot plan with the character sheet. Each verb
   ships with a calc estimate and, where possible, a calc ↔ sim convergence case (DESIGN §8.3).
6. **Measure, don't guess.** Every milestone has harness metrics (section 10).
7. **Expressive means more than one way to win.** A player can pick an identity (unarmed brawler, trigger spellblade,
   low-life caster, shock-chain clearer) and find the pieces to make it work.
8. **The IP policy is unchanged** (DESIGN §3). Mechanics may be copied; names, text, data and art are ours.

---

## 2. Where the choices stand today (measured 2026-10-06)

| Measure                                    | Value                                                                                              | Source                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Greedy bot, 60 runs (10 per class)         | 22 wins; class median map reached 55.5–101                                                         | `docs/PROGRESS.md`                      |
| Random camp decisions, 120 runs            | All 120 die by map 9; 98 die within the first 5 maps                                               | `npm run random -- --runs 120 --seed 2` |
| Uniques found per 100-map bot run (6 runs) | 3, 2, 3, 3, 7, 4 (the Strider died on map 68)                                                      | one-off count of picked-up items        |
| Uniques the bot wore at the end of the run | None, in all 6 runs                                                                                | same                                    |
| Items picked up per 100-map run            | 730–770, including 59–97 rares, 17–31 gems and 84–91 flasks                                        | same                                    |
| Passive tree                               | 139 notables from 57 themes: no conditional mods, no flags. Rules change only via the 21 keystones | `src/data/tree/notableThemes.ts`        |
| Uniques (30)                               | 2 conditional mods in total (`targetStunned`, `onLowLife`) and 3 flags; the rest are stat lines    | `src/data/uniques.ts`                   |
| Monster mods (15)                          | 12 stat changes; 3 behaviours coded in the sim (Volatile, Raiser, Rime Aura)                       | `src/data/monsters.ts`                  |
| Skills                                     | 7 actives (one used at a time), 17 supports, 7 auras                                               | `src/data/gems.ts`                      |
| Bot decisions                              | Scores with all conditions off; always takes the first offered theme; one change at a time         | `src/run/bot.ts`                        |

What this means:

- **The decision space is close to monotone.** Most options are simply better or worse on one axis. A greedy score is
  therefore near-optimal, and skill reduces to reading the bigger number. Random play dies quickly because the numbers
  are tight, not because the choices are rich.
- **Uniques can't matter.** They show up about three times per run, and the ones that exist lose to rares. Adding more
  uniques without changing how they are found changes nothing.
- **The combinatorial space is narrow.** It lives almost entirely in 21 keystones and 7 × 17 skill/support pairs. This
  plan widens it where the reference game gets its depth: rule-changing uniques, conditional payoffs, enemies with
  specific demands, and directed crafting.

---

## 3. Decisions to reopen

DESIGN.md §2 says its decisions are not reopened during implementation. This plan asks the user to reopen these:

**D6 (out of scope list).**

- _Today:_ ascendancies, charges, jewels, influence, crafting/currency, minions, totems, traps and curses are all out.
- _Proposed:_ bring in **crafting/currency** (section 8), **charges** (5.6) and **curses** (5.7). Jewels, ascendancies,
  influence, minions, totems and traps stay out.
- _Why:_ currency was requested. Charges and curses power many of the uniques worth copying, and curses give enemies a
  way to pressure a build other than raw damage. Minions, totems and traps all need allied AI: high cost, little
  interaction with the rest.

**§2.1 "Crafting / currency".**

- _Today:_ "None. Items come from drops and the between-map reward choice."
- _Proposed:_ "Eight currencies, five essences and a Workbench (section 8). The player chooses what changes; chance
  fills in tier and value, or offers a short list to pick from."
- _Why:_ follows from D6. The reference game's currency is a gamble sized for a trade economy. This is a single-player
  game, so the currency gives the player agency over items instead.

**§2.1 "Multiple skills".**

- _Today:_ one primary skill, auto-used.
- _Proposed:_
  - keep one primary skill, and add **triggered skills** that follow the reference game's rules (5.5). A triggered
    skill is a second active gem fired by a trigger (on crit, on hit, on attack, when hit), granted by a support gem
    or a unique;
  - and, pending the user's answer, **secondary casts** (5.5a): every other equipped active skill is cast when it is
    ready.
- _Why:_ this turns skill × support into skill × skill, the engine behind many reference-game weapon uniques, and needs
  no input from the player.

**§5.5 "Saving".**

- _Today:_ `{ version: 1, run }`, and an unknown version is rejected. "No migrations in v1."
- _Proposed:_ unchanged in mechanism. Saves may break at any milestone: `SAVE_VERSION` is bumped whenever `RunState` or
  the tree changes, and older saves are rejected.
- _Why:_ the user does not need old saves to survive.

**D10 (enemies).**

- _Today:_ one family, skeletons, with elemental variants and rarity tiers.
- _Proposed:_ **undead and crypt-dwelling factions.** Skeletons stay the core and early-game family. Five factions
  join from map 8 onward, staged so the humanoid ones (which reuse the figure rig) come first.
- _Why:_ the user asked for new enemy types, and staging puts the cheap art first.

---

## 4. What a skillful choice looks like

The test for this plan: does it create situations where a player who understands the systems makes a different, better
choice than one who reads the biggest number? Six worked examples follow, each naming the content it needs.

**1. Reading the map, not the reward.** A Mystic has an igniting Flame Bolt and an energy-shield defence (Arcane Ward
plus ES gear). The camp offers two maps:

- _Charnel Pits_ (the Rot: chaos damage, poison, corpses that rise), with +1 essence;
- _Rimed Catacomb_, with the map affix "Monsters have +40% fire resistance".

The threat preview reads, for example, "Charnel Pits: DPS ×1.0, EHP ×0.45 (chaos bypasses your ES; chaos resistance
−20%)" and "Rimed Catacomb: DPS ×0.6, EHP ×1.0". A number-reader takes the Catacomb because its EHP looks safe. A
skilled player takes the Pits:

- ignite burns corpses, so the Rot's signature mechanic does nothing to this build;
- the chaos gap can be fixed in camp, with a chaos-resistance craft at the Workbench and a flask "of Cleansing";
- the fire-resistance affix can't be fixed, and it slows every fight.

_Needs:_ the Rot (7.3), corpse rules (5.8), the threat preview (section 9), the Workbench (8.3).

**2. A unique that rewrites the socket plan.** A Vanguard finds _The Walled Heart_: no sockets, +340 life. Equipped
naively, it strands the 5-socket main skill (`transferGems` has nowhere to put the gems), so the sheet shows DPS
collapsing, and the greedy bot rejects it. A skilled player first moves the main skill to a 2H mace with 6 sockets,
setting that weapon's socket count to 6 with Socket Augers. Then they wear the Heart: the same damage and far more life.
The value only appears as a two-step plan.

_Needs:_ The Walled Heart (6.4), the Socket Auger (8.2), bot lookahead (10.1).

**3. A low-life caster.** The pieces:

- two auras socketed in _Bloodglass Ward_ (socketed gems reserve life) reserve about 65% of life, while the main skill
  still costs mana;
- life therefore sits permanently below 35% of maximum, which switches on Pain Conduit (30% more spell damage on low
  life) and Last Breath (an existing unique, 30% more spell damage on low life);
- _Embalmer's Wraps_ (chaos damage does not bypass ES) lets a large ES pool shield the small life pool.

It is strong against the Rot. It is weak against the Swarm: constant small hits stop ES from ever starting its
recharge.

_Needs:_

- the low-life rule fix: DESIGN §6.3 measures low life against maximum life, but the code measures it against
  unreserved life (5.3);
- Bloodglass Ward and Embalmer's Wraps (6.4);
- bot conditions (10.1).

**4. A shock chain that eats swarms.** The pieces:

- _Meteorite Edge_: physical damage can shock, but the wielder deals no elemental damage;
- a shock-chance suffix (a new affix family);
- _Stormsplit Jerkin_: shocked enemies explode when killed;
- _Kindred Sparks_: killing a shocked enemy spreads its shock to its neighbours.

In a Swarm room, each kill shocks and bursts the pack around it. The same build is poor against single bosses and
against the Reliquary's storm-core golems, which can't be shocked. So the player routes through Swarm themes, avoids
storm-core vaults, and carries a hex on hit for bosses.

_Needs:_ triggers (5.5), the Swarm and Reliquary (7.3), the new affix family (5.3).

**5. Overcapped resistance against the Choir.** The Choir's Hexers curse you with _Brittle Doom_ (−20% elemental
resistances). A build sitting exactly at the 75% cap drops to 55% and dies to the next cold mage pack. Resistance above
the cap, normally wasted, becomes the answer. The alternatives:

- a flask "of Warding" (immune to hexes during the effect);
- _Pickpocket's Lament_ (50% reduced curse effect on you, at the cost of a ring slot);
- the other map.

_Needs:_ curses (5.7), the Choir (7.3), Workbench resistance crafts (8.3).

**6. A trigger spellblade and the element gap.** _Frostwrit_ is a sword with no physical damage that fires a socketed
cold spell on melee crit. Socket it with Frost Lance and Precision Strikes, and a loop forms:

- the lances chill;
- Frostwrit has more crit chance against chilled enemies;
- more crits fire more lances.

Crit notables pay twice, for the sword and for the spell. The gap: frost-core golems and Frost-warded rares are immune
to cold. The answers are a second element (Kindling Halo, or Ember Infusion in the sword) or a route away from
frost-core vaults.

_Needs:_ triggers (5.5), Frostwrit (6.4), the Reliquary (7.3), Frost-warded (7.2).

### 4.1 Questions and answers

Each row is a question some enemy asks, and the answers each system offers. A healthy plan has two or more answers per
row from different columns.

| Question                      | Asked by                                 | Tree                                       | Uniques                                              | Gems                                                         | Flasks                          | Workbench / currency                 |
| ----------------------------- | ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------ | ------------------------------- | ------------------------------------ |
| Chaos damage that bypasses ES | Rot; Rot-touched mod                     | Hollow Vessel (immune to chaos)            | Embalmer's Wraps, Martyr's Draught                   | —                                                            | "of Cleansing" (removes poison) | chaos-resistance craft; Plague Ichor |
| Less physical damage taken    | Hollow (Ethereal); Bulwarked mod         | Searing Avatar (converts to fire)          | Rimeclasp Gloves, Ember-wrap, Frostwrit              | Ember Infusion, Frost Halo, Kindling Halo, any spell         | Hoarfrost Draught               | added elemental damage crafts        |
| High evasion                  | Hollow; Elusive                          | Unerring Discipline                        | Unblinking Longbow                                   | spells always hit                                            | —                               | accuracy craft                       |
| Mana drain                    | Hollow wisps; Siphoning                  | Blood Rite                                 | Bloodglass Ward                                      | Clear Mind                                                   | mana flask                      | mana regeneration craft              |
| Hexes on you                  | Choir; Hexcaller                         | reduced curse effect (new notable)         | Pickpocket's Lament                                  | —                                                            | "of Warding"                    | overcapped resistance crafts         |
| Many small enemies            | Swarm; Splitting                         | area notables                              | Stormsplit Jerkin, Kindred Sparks, The Thousand Ribs | Reaping Arc, Flame Bolt, Arc Chain, Volley Split, Wide Blast | Last Light Flask                | Chitin                               |
| Big, slow hits                | Brutes; Reliquary Sentinels              | Rooted Stance; Grit charges (new)          | The Walled Heart, Deathless Vigil                    | Iron Bastion                                                 | Bulwark flask, Stonebrew Flask  | life and armour crafts               |
| Immune to your element        | Reliquary cores; Fire/Frost/Storm-warded | Prismatic Balance                          | Meteorite Edge (deals only physical)                 | a second element: two Halos, Ember Infusion                  | —                               | essences for another element         |
| Immune to ailments            | Unyielding                               | hit-damage notables                        | —                                                    | hit supports over ailment supports                           | —                               | —                                    |
| Cannot be leeched from        | Bloodless                                | regeneration notables (Crimson Pact fails) | (Bloodquick Gauntlets fail)                          | —                                                            | life flasks                     | life regeneration craft              |
| Cannot be hexed               | Hex-warded                               | —                                          | (Lullaby Silks fails)                                | (Hexing Strikes fails)                                       | —                               | —                                    |
| Blocks or evades projectiles  | Deflecting; Shieldbearers                | —                                          | —                                                    | melee, area explosions (Flame Bolt), chaining (Arc Chain)    | —                               | —                                    |
| Blocks spells                 | Spellwarded                              | —                                          | —                                                    | attacks                                                      | —                               | —                                    |

The map choice is the last column for every row: with the threat preview, skipping a map you can't answer is always an
option, at the price of that map's reward.

---

## 5. Engine extensions

Content is data on top of these, so they are scheduled first. Engine cost codes, used throughout:

- **D** — data only: existing stats, flags and conditions in existing code paths.
- **F** — a new stat, flag or rule read in one existing code path.
- **H** — a new sim hook: a trigger, on-kill, on-block or flask behaviour.
- **S** — a new system with its own state and UI (charges, curses, corpses, the skill rotation).

### 5.1 Budgets

- **`SKILL_TAGS`** (`src/mods/types.ts`) is a 32-bit mask (`tagBit` = `1 << index`). It had 30 tags; X2 adds
  `triggered` (31), and X8 adds `hex` (32). The plan no longer needs a `chaos` tag (chaos damage is a damage type, not a
  skill tag). So the mask is **not widened**: it fills up exactly. A 33rd tag would mean widening it to two words
  behind the `tagMask()` / `tagBit()` API.
- **`CONDITIONS`** is also bit-packed: 21 of 32 were used. X2 adds 5 (26), and X8 adds 2 more (28).

### 5.2 New conditions

| Condition         | True when                                | Used by                                                     |
| ----------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `beenHitRecently` | You were hit in the last 4 s             | defensive notables, Wounded Retort                          |
| `targetCursed`    | X8: the target carries one of your hexes | conditional notables ("more damage against cursed enemies") |
| `cursed`          | X8: you carry a monster hex              | defensive notables ("while cursed")                         |
| `leeching`        | A life leech instance is active          | conditional notables                                        |
| `esFull`          | Energy shield is full                    | ES notables                                                 |
| `targetLowLife`   | The target is at or below 35% life       | execute-style notables                                      |
| `onLowMana`       | Mana is at or below 35%                  | Mind Bulwark builds                                         |

Built in X2: all but `targetCursed` and `cursed`, which arrive with hexes in X8.

### 5.3 New stats, flags and rule fixes (cost F)

**Built in X2** under these stat ids (all are mods on gear, the tree or flasks): `chaosNotBypassEs`,
`physTakenAs.<type>`, `damageTaken.<type>` (typed; plain `damageTaken` stays global), `canShock.<type>`,
`canIgnite.<type>`, `canChill.<type>` and `canFreeze.<type>`, `noElementalDamage`, `noPhysicalDamage`,
`spellIncAppliesToAttacks`, `minDamage` and `maxDamage` (separate "more"), `instantLeechOnCrit`,
`cannotBeLeechedFrom`, `immuneAilments`, `immune.<element>`, `unaffectedByShock`. Item rules are flag mods on the item:
`rule.noOtherRing`, `rule.socketedGemsUseLife` (with `socketedReducedReservation`), `grantsKeystone.<keystone id>`, and a
`socketedGemLevel` mod with tags reaches only gems carrying them. Flask buffs now reach the skill profile, loot reads
`itemQuantity` and `itemRarity`, and low life is measured against maximum life.

| Stat, flag or rule                                      | Meaning                                                                        | Read in                                                 | Used by                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------- |
| `chaosNotBypassEs`                                      | Chaos damage hits energy shield before life                                    | `sim/combat.ts applyDamage`; EHP in `calc/character.ts` | Embalmer's Wraps, Martyr's Draught             |
| `physTakenAs.<type>`                                    | A share of physical hit damage is taken as another type                        | `calc/combat.ts` mitigation; EHP                        | Thunderwire Hauberk, Hoarfrost Draught         |
| Typed `damageTaken`                                     | More or less damage taken of one damage type (today it is a single multiplier) | `calc/combat.ts`, `calc/defence.ts`                     | The Bare Visor, Hollow (Ethereal), Open Wounds |
| `canShock.physical` (and siblings)                      | A damage type can inflict another type's ailment                               | ailment chances in `calc/skill.ts`                      | Meteorite Edge                                 |
| `noElementalDamage`, `noPhysicalDamage`                 | Those chunks are dropped after conversion                                      | `calc/skill.ts`                                         | Meteorite Edge, Frostwrit                      |
| `spellIncAppliesToAttacks`                              | Increased and reduced spell damage also apply to attacks                       | attack profile query in `calc/skill.ts`                 | Spellsworn Circlet                             |
| Separate min and max physical "more"                    | Scales a chunk's minimum and maximum separately                                | chunk scaling in `calc/skill.ts`                        | The Wide Cinch                                 |
| `instantLeechOnCrit`                                    | Leech from critical strikes is instant                                         | `sim/combat.ts applyHit`                                | Bloodquick Gauntlets                           |
| `cannotBeLeeched` (monsters)                            | Hits against it leech nothing                                                  | `sim/combat.ts applyHit`                                | Bloodless                                      |
| `immuneAilments` (monsters)                             | No ailments                                                                    | `sim/combat.ts applyAilments`                           | Unyielding                                     |
| `immune.<element>`                                      | 100% resistance past the 90% hard cap, and immune to that element's ailment    | `calc/combat.ts`, `applyAilments`                       | Reliquary cores; Fire/Frost/Storm-warded       |
| `unaffectedByShock`                                     | Shock does nothing to you                                                      | `applyAilments` with the player as target               | Stormsplit Jerkin                              |
| Item rule: cannot use the other ring                    | The other ring slot must stay empty                                            | `run/inventory.ts canEquip`                             | Pickpocket's Lament                            |
| Item rule: grants a keystone                            | Adds that keystone's mods and flags                                            | `calc/character.ts`                                     | Ashen Heartstone, The Steadfast Cassock        |
| Item rule: socketed gems use life                       | Costs and reservations of gems in this item come from life                     | reservation and cost in `calc/character.ts`             | Bloodglass Ward                                |
| Tag-filtered `socketedGemLevel`                         | "+2 to level of socketed aura gems"                                            | gem levels in `calc/character.ts`                       | Cantor's Hood                                  |
| Flask buffs reach the skill profile                     | Today `Character.profile()` takes no flask mask; only `defence()` does         | `calc/character.ts`, action start in `sim/actions.ts`   | Last Light Flask, Rotwine Flask, Hoarfrost     |
| Loot reads the player's item rarity and quantity        | Today only the theme's quantity bonus is read                                  | `gen/loot.ts`                                           | Gambler's Tonic                                |
| **Rule fix:** low life is measured against maximum life | DESIGN §6.3 says so; `playerConds` uses unreserved life                        | `sim/combat.ts playerConds`; calc conditions            | every low-life build (example 3)               |
| Shock-chance and freeze-chance suffix families          | Like the existing ignite, bleed and poison chance suffixes                     | `src/data/affixes.ts` (D)                               | shock and freeze builds (example 4)            |

### 5.4 Item-granted skills

A unique may grant a skill that exists only on items, such as _Ember Burst_ (a fire nova around the target). Its gem
definition lives with the gems but never drops. It is used through triggers (5.5). Cost F.

### 5.5 Triggers and triggered skills (cost H)

```ts
type Trigger = {
  on: 'hit' | 'crit' | 'attack' | 'kill' | 'block' | 'hitTaken';
  /** Only skill uses with all these tags count (for example 'melee'). */
  tags?: SkillTag[];
  /** Kill triggers: only targets carrying this count. */
  targetHas?: 'shock' | 'ignite' | 'hex';
  chance: number; // percent
  cooldown: number; // seconds
  effect:
    | { kind: 'castSocketed'; spellTags: SkillTag[] } // a spell socketed in the same item
    | { kind: 'castGranted'; skillId: string; level: number } // an item-only skill (5.4)
    | { kind: 'explode'; pctOfMaxLife: number; dtype: DamageType; radius: number }
    | { kind: 'spread'; ailment: 'shock' | 'ignite'; radius: number }
    | { kind: 'recover'; pool: 'life' | 'es' | 'mana'; pctOf: 'maxLife' | 'armour'; value: number }
    | { kind: 'charge'; charge: ChargeId } // X8
    | { kind: 'hex'; hexId: string; level: number }; // X8
};
```

Rules:

- **Where triggers fire:**
  - `applyHit` in `sim/combat.ts`: hit and crit, plus block on the defender's side;
  - `startAction` in `sim/actions.ts`: attack;
  - `killActor`: kill;
  - `applyDamage` with the player as target: hit taken.
- **Triggered skills:**
  - use their own profile: their gem level and the supports in their item;
  - aim at the hit target, or at the nearest enemy for hit-taken triggers;
  - do not use the player's action time;
  - pay their mana cost as usual and do not fire when mana is short, as in the reference game, so sustain still
    matters;
  - share one cooldown per trigger source, however many hits arrive during it.
- **Loops:** triggered skills never trigger anything. Kill explosions may kill and chain: at most 20 detonate per tick,
  and the rest wait in a queue, so a long chain carries on over the next ticks instead of recursing.
- **Calc:** the primary skill is used at regular intervals, and each use produces a triggering event with probability
  q (1 for attacks, hit chance for hits, hit chance × crit chance for crits). After a firing, the trigger waits out its
  cooldown (k uses long) and then fires on the first event that passes its chance, so it fires once per
  interval × (k − 1 + 1 / (q × chance)) seconds. Kill, block and hit-taken triggers depend on the fight and are not
  estimated. The sheet shows each triggered skill as its own line with its DPS, and that DPS counts in the bot's score.
- **Data:** a unique lists its triggers (`triggers`), and the item it drops as carries them (`uniqueTriggers`). The spells
  socketed in a trigger's item that it casts are triggered-only: they are never the primary skill.
- **New supports** (X4):
  - **Critical Relay** — linked spells are triggered by linked attacks' crits (0.25 s cooldown); triggered spells deal
    20% less damage.
  - **Wounded Retort** — linked spells are triggered whenever you have taken damage equal to 30% of maximum life since
    the last trigger (0.5 s cooldown).
- **Convergence case:** an attack with Critical Relay and Frost Lance against the training dummy. Each skill's DPS must
  be within ±5% of the calc; this is wider than §8.3's ±3% because of cooldown quantisation.

### 5.5a Secondary casts: every equipped skill gets used (cost S; built under the default, 2026-10-06)

Today only the primary skill is used, so a second active gem is dead weight. Proposal: **the primary stays the spam
skill, and every other equipped active skill is cast whenever it is ready.**

- **Which skills.** Every usable active gem socketed in any equipped item, except skills driven by a trigger (5.5),
  which fire only from it. The star in the Skills tab still marks the primary.
- **Ready means:** off cooldown, enough mana, and a target in the skill's range.
- **Cooldown.** An active gem may define a `cooldown` (seconds). A gem without one gets a default when used as a
  secondary: 6 × its use time, at least 3 s (_tunable_). Authored cooldowns come with new utility skills (hexes, X8).
- **Priority.** When the player is free to act, it casts the ready secondary with the longest cooldown (ties by socket
  order); otherwise the primary; otherwise the default attack when mana is short, as today.
- **Cost.** A secondary cast takes action time and mana like any cast, and the supports in its own item apply to it.
  Supports are per item, so N actives in N items are N skill-and-support groups at once. That is the combinatorial
  payoff: setup skills, payoff skills, debuffs and bursts that interact through the rest of the build.
- **Calc.** A secondary is cast once per (cooldown + use time), so the primary's DPS is reduced by the action time the
  secondaries take. The sheet shows a line per skill and a combined total, and the bot scores the combined total.
- **Why cooldowns.** A plain rotation without them only averages the skills' DPS, so a second damage skill could never
  help. A cooldown makes a secondary an event with a real cost in action time: a burst, a debuff, or the payoff for
  what the primary sets up.
- **What it touches:** `chooseSkill` and `payCost` in `sim/ai.ts`; `Character` (a profile list and a combined line);
  `botRegem`, which picks one host and one active; the random bot's primary move; the Skills tab; the flask policy,
  which reads the primary's cost; and mana sustain, which becomes the real limiter.
- **Reach rule (built).** A skill is a secondary only if its reach is at least the primary's: the character stands where
  the primary can hit, so a melee skill behind a bow would never fire, and the calc must not credit it.
- **Cycle (built).** A secondary is cast, the primary is used in whole uses until the cooldown has run out, and then it
  is cast again, so the calc's cast rate is 1 / (use time + ceil((cooldown − use time) / primary use time) × primary
  use time). The primary's share of time falls by the secondaries' use time.
- **Convergence case:** a primary plus one secondary against the training dummy, each skill's DPS within ±5% of the
  calc.
- **Decision.** Recommended: yes, built in X2 after the X1 baselines (section 13). If the answer is no, triggered
  skills (5.5) remain the only way to use a second active gem.

### 5.6 Charges (cost S; needs D6 reopened)

| Charge (ours) | Per charge                                                      | Modelled on        |
| ------------- | --------------------------------------------------------------- | ------------------ |
| Grit          | +4% physical damage reduction; +4% to all elemental resistances | (Endurance charge) |
| Fervour       | 4% increased attack, cast and movement speed; 4% more damage    | (Frenzy charge)    |
| Insight       | 40% increased critical strike chance                            | (Power charge)     |

- **Limits:** at most 3 of each, raised by items and the tree. Charges last 10 s, and all charges of a kind refresh
  when one is gained.
- **Sources:** tree notables, uniques, and monster versions (the Flagellant, 7.3). Examples: "25% chance to gain a
  Fervour charge on kill", "Gain a Grit charge when you block", "Gain an Insight charge on critical strike".
- **Scaling:** mods use the existing `per` field, for example `per: { stat: 'charges.fervour', div: 1 }`.
- **Calc and UI:** the sheet assumes maximum charges when a source exists, with a toggle like the condition toggles.
  The HUD shows charges as pips.

### 5.7 Curses: hexes (cost S; needs D6 reopened)

- **What a hex is:** a debuff with an effect value. It lasts 6 s, and its source re-applies it.
- **Limits:**
  - a target holds at most as many of _your_ hexes as your hex limit (1, or 2 with the Twice-Hexed Ring);
  - the player holds at most one monster hex, and a new one replaces the old.
- **Effect** scales with "increased curse effect" on the applier and "reduced effect of curses on you" on the target.
- **How hexes are applied:**
  - by the player, through hex gems (a new gem kind) linked to the support **Hexing Strikes** (linked hexes are applied
    to enemies you hit), or through uniques;
  - by monsters, through the Choir and the Hexcaller mod.

| Hex (ours)   | Effect, level 1 → 20                        | Modelled on          |
| ------------ | ------------------------------------------- | -------------------- |
| Brittle Doom | −20% → −35% to all elemental resistances    | (Elemental Weakness) |
| Leaden Limbs | 15% → 25% reduced action and movement speed | (Temporal Chains)    |
| Feeble Grip  | 15% → 25% less damage dealt                 | (Enfeeble)           |
| Open Wounds  | 20% → 35% increased physical damage taken   | (Vulnerability)      |

### 5.8 Corpses and ground effects (cost S, X7)

- **Corpses:** a dying monster leaves a corpse for 10 s. There is no corpse if the monster:
  - was killed while frozen (it shatters);
  - was killed while ignited (it burns away);
  - was caught in an explosion within 1 s of death.

  Enemies use corpses: Shamblers rise again and Carrion Hags raise them. The player's freeze, ignite and explosions thus
  become corpse control.

- **Ground effects:** persistent circles with a radius and a duration. While you stand in one, it either deals damage
  over time (caustic: chaos; burning: fire) or applies chill or shock. Each is owned by a faction; monsters don't harm
  each other.
- **Player AI:** steps out of telegraphs and ground effects when it is not mid-action and the step keeps the target in
  range. This is a rule in `sim/ai.ts`; the stuck guard is unchanged.

### 5.9 Monster behaviours (cost H unless noted)

- Energy shield shells (D: monsters already build their defence with `defenceFromDb`).
- Auras that buff allies within a radius.
- Channelled heals, interrupted by stun.
- Stationary monsters and spawners (generalised from Raiser).
- Blink: teleport near the player after a 0.4 s telegraph.
- Fliers: ignore walls for movement, but not for line of sight.
- Frontal shields: block projectiles arriving within the front 90°.
- Immunity pylons: allies within the radius take no damage while the pylon stands.
- Splitting on death.
- Mana drain on hit.
- Reflect: melee hit damage only.

### 5.10 Calc engine and character sheet (cost F; X1 and X5)

- **Steady-state conditions.** The sheet, and the bot, evaluate each build under two condition sets:
  - _clearing:_ `killedRecently`, `hitRecently` and `usedFlaskRecently` on; `onLowLife` on if reserved life is at least
    65% of maximum; `critRecently` on if crit chance is at least 20%;
  - _boss:_ the same, with `killedRecently` off.

  Today every condition is off unless the player switches it on in the sheet.

- Triggered skills, charges and hexes appear on the sheet (5.5–5.7).
- **Threat profiles.** Each faction and map affix defines:
  - a reference defence: resistances, armour, typed damage taken, immunities;
  - a reference incoming-damage mix: physical, elemental and chaos shares, and any hexes it applies.

  DPS and EHP against a map are the sheet evaluated against that map's profile. This drives the threat preview
  (section 9) and the bot's map choice (10.1).

---

## 6. Uniques

### 6.1 Rules for a new unique

1. At least one line from section 5 that changes behaviour or a rule, not only numbers. The exception is the leveling
   uniques of 6.3.
2. A real price (principle 2).
3. Authoring notes in the data, not shown to players: what it pairs with (at least two things from other systems) and
   what it is weak against (at least one faction or mod).
4. Its level requirement fits its base. Across all uniques, every 10-map band introduces 3–6 new ones.
5. Its mechanic is modelled on a named reference-game item (in parentheses here), with values scaled to Bob's numbers
   and marked _tunable_.
6. The name passes the IP scan, and the flavour text is ours.

### 6.2 Acquisition: the actual bottleneck

**Targets:**

- a 100-map run finds 15–25 uniques (today 2–7), of which 4–8 are usable by the build;
- a player who wants a particular unique can pursue it.

**Changes:**

1. **Drop weight** rises from 0.5 to 1.5. The rarity weights become normal 60, magic 32, rare 7.5, unique 1.5
   (`rarityWeights` in `gen/loot.ts`).
2. **Mini-bosses** (every 10th map) drop one unique from their faction's pool. The Ossuary Regent drops two.
3. **Reward picks** after maps 25, 50 and 75 offer three uniques the character can equip at its level.
4. **Faction pools.** Each unique lists the factions it drops more often from (×4 weight). The map buttons show
   "notable drops" for each offered theme.
5. **Epitaph tablets** (divination cards). Each faction drops tablets for 3–4 named uniques. A complete set (3–6
   tablets, by power) is exchanged in camp for that unique. This gives steady progress toward a planned unique.
6. **Knucklebone Die** (8.2): a normal item becomes a unique of its base 10% of the time.

### 6.3 The existing 30 uniques

- **All 30 stay in the data.**
- **8 become leveling uniques** (levels 2–16), strong but simple: Oaken Grudge, First Splinter, Cinder Reed, Votary of
  Dawn, Viper Tongue, Lantern of the Lost, Marrow Loop, Wanderer's Sash.
- **8 already carry a rule, so they stay as they are:**
  - Rattle-bow (+1 projectile, double attack speed, 40% less damage);
  - Coldheart (always freeze on crit);
  - Stillstone (cannot be stunned);
  - The Hollow Crown (reduced reservation);
  - Gravehammer (pays off stun);
  - Last Breath (pays off low life);
  - Thornshield (life on block);
  - Ironroot Treads (cannot be chilled).
- **The remaining 14 are mostly stat lines.** In X4 they either gain one verb line each or stay as filler for slots
  with few uniques.

### 6.4 The new uniques

Values are Bob-scaled and _tunable_. The level is the requirement; the base tier is the base type it sits on.

**Wave 1 (X3): data-only or one new stat, flag or rule (D or F).**

| #   | Ours · slot · level                                       | What it does                                                                                                                           | Its price                                                                                | Modelled on             | Engine                            |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------- | --------------------------------- |
| 1   | **The Walled Heart** · armour body armour · 48            | Has no sockets. +(300–380) maximum life. (20–30)% increased fire damage.                                                               | The body armour usually carries the main skill.                                          | (Kaom's Heart)          | D (`sockets: 0`)                  |
| 2   | **Gravedigger's Smock** · body armour · 3                 | Always has 6 sockets. No defences and no other mods.                                                                                   | No defence at all.                                                                       | (Tabula Rasa)           | D                                 |
| 3   | **Embalmer's Wraps** · ES body armour · 45                | Chaos damage does not bypass energy shield. (100–140)% increased ES. +(20–30)% lightning resistance.                                   | Only an ES build gains anything.                                                         | (Shavronne's Wrappings) | F `chaosNotBypassEs`              |
| 4   | **Thunderwire Hauberk** · armour/evasion body armour · 42 | (30–50)% of physical damage from hits is taken as lightning damage. +(50–70) maximum life.                                             | Maximum lightning resistance is 15% lower.                                               | (Lightning Coil)        | F `physTakenAs`                   |
| 5   | **The Steadfast Cassock** · evasion/ES body armour · 30   | Grants Mind Bulwark. +(60–80) maximum mana. (30–40)% increased mana regeneration.                                                      | Mana-draining enemies reach your life through your mana.                                 | (Cloak of Defiance)     | F grants keystone                 |
| 6   | **Spellsworn Circlet** · ES helmet · 30                   | Increases and reductions to spell damage also apply to attacks. +(40–60) ES.                                                           | Pays off only if the tree takes spell damage while you attack.                           | (Crown of Eyes)         | F `spellIncAppliesToAttacks`      |
| 7   | **The Bare Visor** · armour helmet · 46                   | Adds (12–18) to (26–34) physical damage to attacks. +(60–80)% critical strike multiplier. You take (40–50)% increased physical damage. | Much more physical damage taken.                                                         | (Abyssus)               | F typed `damageTaken`             |
| 8   | **Cantor's Hood** · evasion/ES helmet · 28                | +2 to level of socketed aura gems. Cannot be frozen. 8% reduced mana reserved.                                                         | The helmet's sockets go to auras, not supports.                                          | (Alpha's Howl)          | F tag-filtered gem level          |
| 9   | **Knucklebone Bindings** · evasion gloves · 12            | (500–700)% more physical damage with unarmed attacks. +(20–30)% critical strike multiplier.                                            | No weapon: no weapon mods or weapon sockets.                                             | (Facebreaker)           | D                                 |
| 10  | **Rimeclasp Gloves** · armour/evasion gloves · 22         | 100% of physical damage is converted to cold damage. +(20–30)% cold resistance.                                                        | No bleeding; converted damage counts 50% for stun.                                       | (Hrimsorrow)            | D                                 |
| 11  | **Bloodquick Gauntlets** · armour gloves · 40             | Leech from critical strikes is instant. 2% of physical attack damage is leeched as life. (30–40)% increased critical strike chance.    | Worthless against Bloodless monsters.                                                    | (Atziri's Acuity)       | F `instantLeechOnCrit`            |
| 12  | **Meteorite Edge** · 2H sword · 52                        | (300–380)% increased physical damage. Your physical damage can shock. You deal no elemental damage. 20% increased area of effect.      | Elemental auras, supports and conversion do nothing.                                     | (Starforge)             | F `canShock`, `noElementalDamage` |
| 13  | **Unblinking Longbow** · bow · 24                         | Your hits can't be evaded. (150–200)% increased physical damage.                                                                       | A slow base; no crit bonuses.                                                            | (Lioneye's Glare)       | D (`alwaysHit`)                   |
| 14  | **The Thousand Ribs** · bow · 56                          | Bow attacks fire 4 additional arrows. (100–140)% increased physical damage.                                                            | Extra arrows add coverage, not single-target damage (one use hits a target once).        | (Reach of the Council)  | D                                 |
| 15  | **Ashen Heartstone** · amulet · 44                        | Grants Searing Avatar. Damage penetrates 10% fire resistance. +(20–30) Strength.                                                       | The keystone's "deal no non-fire damage".                                                | (Xoph's Blood)          | F grants keystone                 |
| 16  | **Orrery of Bone** · amulet · 50                          | +(60–80) to all attributes.                                                                                                            | Nothing else on the slot.                                                                | (Astramentis)           | D                                 |
| 17  | **Rot-heart Band** · ring · 30                            | Adds (10–15) to (20–28) chaos damage to attacks. +(17–23)% chaos resistance. (10–15)% reduced maximum life.                            | Less life.                                                                               | (Ming's Heart)          | D                                 |
| 18  | **The Wide Cinch** · belt · 28                            | (30–40)% more maximum physical attack damage. (30–40)% less minimum physical attack damage.                                            | The average hit barely moves; hits get spikier (better stuns and freezes, worse floors). | (Ryslatha's Coil)       | F min/max scaling                 |
| 19  | **Hoarfrost Draught** · utility flask · 26                | During the effect: 30% of physical damage from hits is taken as cold; gain (10–15)% of physical damage as extra cold.                  | A utility flask slot and its uptime.                                                     | (Taste of Hate)         | F `physTakenAs`; flask → profile  |
| 20  | **Last Light Flask** · utility flask · 40                 | During the effect: skills fire 2 additional projectiles; (20–30)% increased area of effect.                                            | A utility flask slot and its uptime.                                                     | (Dying Sun)             | F flask → profile                 |
| 21  | **Rotwine Flask** · utility flask · 35                    | During the effect: gain (10–15)% of physical damage and 10% of elemental damage as extra chaos; 2% of chaos damage is leeched as life. | A utility flask slot and its uptime.                                                     | (Atziri's Promise)      | F flask → profile                 |
| 22  | **Stonebrew Flask** · utility flask · 20                  | During the effect: +(12–15)% chance to block attack and spell damage.                                                                  | A utility flask slot and its uptime.                                                     | (Rumi's Concoction)     | D                                 |
| 23  | **Gambler's Tonic** · utility flask · 22                  | During the effect: (20–30)% increased item rarity and quantity.                                                                        | No combat value; only kills during the effect count.                                     | (Divination Distillate) | F loot reads player stats         |

**Wave 2 (X4): mostly new sim hooks (H).**

| #   | Ours · slot · level                                 | What it does                                                                                                                                                                                            | Its price                                                                     | Modelled on              | Engine                                     |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------ | ------------------------------------------ |
| 24  | **Thunderknell** · 1H mace · 40                     | Triggers a socketed lightning spell on hit (0.5 s cooldown). Skills chain +1 time. Requires 120 Intelligence.                                                                                           | An Intelligence-hungry mace; the spell takes one of only 3 sockets.           | (Mjolner)                | H hit → cast socketed                      |
| 25  | **Frostwrit** · 1H sword · 46                       | Adds (40–50) to (80–100) cold damage. No physical damage. Triggers a socketed cold spell on melee crit (0.25 s cooldown). 60% increased crit chance against chilled enemies. Requires 160 Intelligence. | No physical damage: Brute Force, bleeding and physical stun lose their value. | (Cospri's Malice)        | H crit → cast socketed; F                  |
| 26  | **Gravescribe** · wand · 24                         | Triggers a socketed spell when you attack with this wand (0.25 s cooldown). +1 to level of socketed active gems per 25 character levels.                                                                | The wand must attack, so the free default attack becomes a trigger engine.    | (Poet's Pen)             | H attack → cast socketed                   |
| 27  | **Cinderfall Axe** · 1H axe · 50                    | 20% chance on melee hit to cast a level 20 _Ember Burst_. 60% of physical damage is converted to fire.                                                                                                  | Bleeding loses most of its base.                                              | (Ngamahu's Flame)        | H hit → cast granted (5.4)                 |
| 28  | **Stormsplit Jerkin** · evasion/ES body armour · 38 | Shocked enemies you kill explode for 5% of their maximum life as lightning damage, which cannot shock. You are unaffected by shock. +(60–80) maximum life.                                              | Little value against a single target.                                         | (Inpulsa's Broken Heart) | H kill → explode                           |
| 29  | **Kindred Sparks** · ring · 32                      | When you kill a shocked enemy, inflict an equivalent shock on each nearby enemy. The same for ignite.                                                                                                   | Needs dense packs and reliable ailments.                                      | (Berek's Respite)        | H kill → spread                            |
| 30  | **Twin Pyre Band** · ring · 36                      | You can inflict an additional ignite on an enemy. Ignites deal their damage 40% faster. 40% less burning damage.                                                                                        | Less damage per ignite.                                                       | (Emberwake)              | H top-two ignites                          |
| 31  | **The Lantern Bulwark** · armour/ES shield · 44     | Recover energy shield equal to 2% of armour when you block. (60–80)% increased armour and ES.                                                                                                           | Wants block, armour and ES at once.                                           | (Aegis Aurora)           | H block → recover                          |
| 32  | **Bloodglass Ward** · armour/ES shield · 34         | Socketed gems cost and reserve life instead of mana. Socketed gems have 25% reduced reservation. +(15–20) to all attributes.                                                                            | Reserved life is life you don't have.                                         | (Prism Guardian)         | F item rule                                |
| 33  | **Martyr's Draught** · utility flask · 30           | On use, removes all but 1 life; the removed life returns as ES over 2 s. During the effect, chaos damage does not bypass ES.                                                                            | Lethal for life builds; the flask policy must know when it is safe to drink.  | (Coruscating Elixir)     | H flask behaviour + policy                 |
| 34  | **Pickpocket's Lament** · ring · 34                 | Gain (10–15) life and (5–8) mana per enemy hit with attacks. 50% reduced effect of curses on you. +(12–16)% to all elemental resistances. You cannot equip another ring.                                | A whole ring slot.                                                            | (Thief's Torment)        | F ring rule (curse line is inert until X8) |

**Wave 3 (X8): needs charges, curses or a buff layer (S).**

| #   | Ours · slot · level                     | What it does                                                                                                                             | Its price                            | Modelled on                               | Engine             |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------- | ------------------ |
| 35  | **Lullaby Silks** · ES gloves · 42      | Hexes enemies with level 11 Leaden Limbs on hit. Cursed enemies you kill explode for 25% of their maximum life as chaos damage.          | Useless against Hex-warded monsters. | (Asenath's Gentle Touch)                  | S hexes + H        |
| 36  | **Twice-Hexed Ring** · ring · 40        | You can apply an additional hex. (10–15)% increased curse effect.                                                                        | Only useful with two hex sources.    | (Doedre's Damning)                        | S hexes            |
| 37  | **Band of Endless Grit** · ring · 36    | +1 maximum Grit charge. Regenerate 0.4% of life per second per Grit charge. +(20–30) Strength.                                           | Needs a Grit source.                 | (Kaom's Way)                              | S charges          |
| 38  | **Fervent Stride** · evasion boots · 30 | +1 maximum Fervour charge. 20% chance to gain a Fervour charge on kill. 10% increased movement speed.                                    | Value falls away against bosses.     | (the common "+1 maximum charges" pattern) | S charges          |
| 39  | **The Trophy Cord** · belt · 40         | When you kill a rare monster, you gain its monster mods for 20 s (player versions; Raiser and Volatile excluded). +(30–40) maximum life. | Weak on maps with few rares.         | (Headhunter)                              | S timed buff layer |

### 6.5 Gems and tree nodes that come with them

| Addition                                             | Kind                          | Effect                                                                                                                                                                                               | Milestone |
| ---------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Critical Relay, Wounded Retort                       | support                       | trigger linked spells (5.5)                                                                                                                                                                          | X4        |
| Ember Burst                                          | item-only active              | fire nova around the target, radius 2                                                                                                                                                                | X4        |
| Hexing Strikes                                       | support                       | linked hexes are applied to enemies you hit                                                                                                                                                          | X8        |
| Brittle Doom, Leaden Limbs, Feeble Grip, Open Wounds | hex                           | 5.7                                                                                                                                                                                                  | X8        |
| At least 10 new notables                             | tree (spec edit; saves break) | charge sources, curse effect, reduced curse effect on you, chaos resistance with ES, and conditional payoffs ("more damage against cursed enemies", "while leeching", "if you've been hit recently") | X8        |

---

## 7. Enemies

### 7.1 Principles

A threat must be:

- **specific** — it punishes one strategy, not everyone;
- **answerable** from at least two systems (4.1);
- **visible before the map**, through the theme, the map affixes and the threat preview;
- **readable on screen**, through silhouette, tint and telegraph;
- **explainable after a death**, through the death recap.

Data first: as many threats as possible are monster mods that existing code paths already read.

### 7.2 Counterplay monster mods

| Mod (ours)                  | Effect                                                                    | Punishes                                     | Answers                                                   | Cost                        | Rolls on          |
| --------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------- | --------------------------- | ----------------- |
| Bloodless                   | Cannot be leeched from                                                    | leech sustain (Crimson Pact, Bloodthirst)    | regeneration, life on hit, flasks                         | F                           | magic, rare       |
| Unyielding                  | Immune to ailments                                                        | ignite, bleed, poison and freeze builds      | hit damage, crit                                          | F                           | rare              |
| Hex-warded                  | Cannot be hexed                                                           | hex builds                                   | hit harder                                                | F (X8)                      | magic, rare       |
| Deflecting                  | +50% chance to evade projectile attacks                                   | projectile attacks                           | spells, melee, Unerring Discipline                        | D (`evadeBonus.projectile`) | magic, rare       |
| Spellwarded                 | +40% chance to block spells                                               | spells                                       | attacks                                                   | D (`blockSpell`)            | magic, rare       |
| Fire-, Frost-, Storm-warded | Immune to one element and its ailment                                     | single-element builds                        | a second element, conversion, Prismatic Balance           | F                           | rare, from map 30 |
| Bulwarked                   | 30% additional physical damage reduction                                  | physical builds                              | conversion, elemental auras, spells                       | D (`physReduction`)         | magic, rare       |
| Keen-eyed                   | Its hits can't be evaded                                                  | evasion builds (Veil of Grace, Arrow Weave)  | armour, block, ES                                         | D (`alwaysHit`)             | magic, rare       |
| Sundering                   | Its hits ignore 50% of your armour                                        | armour builds                                | evasion, block, ES                                        | F                           | rare              |
| Siphoning                   | Its hits drain 5% of your maximum mana                                    | mana-hungry skills, Mind Bulwark             | Blood Rite, mana regeneration and leech, Clear Mind       | F                           | magic, rare       |
| Rot-touched                 | Gains 30% of its damage as extra chaos                                    | ES builds, low chaos resistance              | chaos resistance, Hollow Vessel, Embalmer's Wraps         | D (`gain.physical.chaos`)   | magic, rare       |
| Shrouded                    | An ES shell equal to 25% of its life, recharging after 2 s without damage | slow damage over time                        | burst, chaos damage (bypasses ES)                         | F                           | magic, rare       |
| Splitting                   | Splits into 2 weaker copies on death (no XP or loot)                      | single-target builds                         | area, chaining, pierce                                    | H                           | rare              |
| Thorned                     | Reflects 10% of melee hit damage dealt to it, as physical damage          | glass melee builds                           | leech, armour, ranged attacks                             | H                           | rare, from map 40 |
| Hexcaller                   | Hexes you with a random hex on hit (4 s cooldown)                         | builds sitting exactly at the resistance cap | overcapped resistance, "of Warding", reduced curse effect | S (X8)                      | rare              |

These are gated like today's late mods (none before map 15, the harshest later), named on the inspect card, and
concentrated by map affixes (7.5).

### 7.3 Factions

Each faction has:

- a question it asks;
- 3–4 types with distinct roles;
- faction mods;
- a **champion**, which is the 10th-map mini-boss when the theme is theirs;
- drops: an essence (8.2) and epitaph tablets (6.2).

Humanoid factions reuse the figure rig with new silhouettes and palettes. The Swarm and the Reliquary need new
procedural rigs, so they come last.

The life (Life ×) and damage (Dmg ×) columns are multipliers on the base monster at that area level, like DESIGN
§12.3. Speed is in tiles per second.

**The Ossuary (skeletons), maps 1–100.** Unchanged, plus one type:

| Type         | Life × / Dmg ×        | Behaviour                                                                                 | Cost |
| ------------ | --------------------- | ----------------------------------------------------------------------------------------- | ---- |
| Shieldbearer | 1.4 / 0.8, melee, 2.6 | Carries a tower shield that blocks projectiles from its front 90°; its shield bash stuns. | H    |

Drops: tablets for Gravedigger's Smock, Knucklebone Bindings, Unblinking Longbow and Orrery of Bone.

**The Rot (plague dead), from map 8.** Question: chaos damage, poison, and corpses.

| Type        | Life × / Dmg ×                 | Behaviour                                                                                             | Cost |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- | ---- |
| Shambler    | 1.6 / 0.9, melee, 2.2          | Rises once, 3 s after death, at 50% life, if its corpse is intact.                                    | H    |
| Bloater     | 1.2 / —, melee, 2.0            | Walks to you and bursts on contact or death: a 2-tile caustic cloud (chaos damage over time) for 4 s. | H    |
| Spitter     | 0.7 / 0.9, projectile, 6 tiles | Chaos projectiles with a 40% poison chance.                                                           | D    |
| Carrion Hag | 1.0 / 0.6, spell, 2.6          | Every 8 s, raises up to 3 intact corpses of any faction; keeps her distance.                          | H    |

- Faction mods: **Festering** (hits poison; D) and **Putrid** (leaves a caustic cloud on death; H).
- Champion: **The Carrion Mother** raises every intact corpse in the room every 10 s, and bursts into four caustic pools
  at 50% life.
- Drops: Plague Ichor; tablets for Embalmer's Wraps, Rotwine Flask, Rot-heart Band and Martyr's Draught.

**The Hollow (wraiths), from map 15.** Question: physical damage stops working, and mana and accuracy are tested.

| Type          | Life × / Dmg ×                 | Behaviour                                                                          | Cost |
| ------------- | ------------------------------ | ---------------------------------------------------------------------------------- | ---- |
| Gloomstalker  | 0.8 / 1.0, melee, 3.4          | Blinks next to you every 6 s; twice the normal evasion.                            | H    |
| Wailer        | 0.7 / 1.0, cold spell, 7 tiles | Chilling bolts.                                                                    | D    |
| Mana Wisp     | 0.4 / 0.5, melee, 4.0          | Hits drain 8% of maximum mana; on death, a nova that drains 20%.                   | F/H  |
| Lantern Wight | 1.2 / 0.6, spell, 2.4          | While it lives, allies within 6 tiles have an ES shell equal to 30% of their life. | H    |

- Faction mod: **Ethereal**, on every Hollow monster: 50% less physical damage taken, and cannot bleed (F).
- Champion: **The Unremembered** phases out (immune and unseen) for 2 s after each 20% of life it loses, then reappears
  behind you.
- Drops: Ectoplasm; tablets for The Steadfast Cassock, Spellsworn Circlet and Bloodglass Ward.

**The Ashen Choir (living cultists), from map 25.** Question: hexes, buffs and heals. What do you kill first?

| Type          | Life × / Dmg ×            | Behaviour                                                                                     | Cost |
| ------------- | ------------------------- | --------------------------------------------------------------------------------------------- | ---- |
| Hexer         | 0.7 / 0.8, spell, 7 tiles | Hexes you every 6 s with one of the four hexes.                                               | S    |
| Censer-bearer | 0.8 / 0.5, melee          | Aura: allies within 5 tiles have 20% increased speed and 15% more damage.                     | H    |
| Flagellant    | 1.2 / 1.1, melee, 3.2     | Gains a monster Fervour charge whenever an ally within 6 tiles dies (up to 5).                | S    |
| Choirmaster   | 1.5 / 0.7, spell          | Every 7 s, channels a 1 s heal of 20% of life on allies within 6 tiles; a stun interrupts it. | H    |

- Faction mod: **Zealous**: on death, nearby allies gain 20% more damage for 6 s (H).
- Champion: **The Precentor** cycles all four hexes, heals, and calls a Choirmaster at 50% life.
- Drops: Censer Ash; tablets for Cantor's Hood, Pickpocket's Lament, Twice-Hexed Ring and Lullaby Silks.

**The Swarm (bone vermin), from map 12.** Question: numbers.

| Type        | Life × / Dmg ×         | Behaviour                                                                              | Cost |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------- | ---- |
| Gnawer      | 0.3 / 0.35, melee, 4.5 | Packs of 8–14; small bleed chance.                                                     | D    |
| Carrion Bat | 0.3 / 0.4, melee, 4.0  | Flies: ignores walls when moving (not for line of sight); erratic approach.            | H    |
| Bone Beetle | 0.6 / 0.5, melee, 3.0  | Curls up for 1.5 s after being hit: 80% less physical damage taken (3 s cooldown).     | H    |
| Nest        | 3.0 / —, stationary    | Spawns 2 Gnawers every 4 s (up to 8 alive) until destroyed; spawns give no XP or loot. | H    |

- Faction mod: **Brood**: splits into 3 Gnawers on death (H).
- Champion: **The Gnawing Queen** burrows, emerges under you after a telegraph, and spawns Nests.
- Drops: Chitin; tablets for The Thousand Ribs, Stormsplit Jerkin, Kindred Sparks and Last Light Flask.
- Note: armour works best against many small hits (DESIGN §6.3). Armour builds shine here and struggle against the
  Reliquary's slams; that contrast is intended.

**The Reliquary (bone-and-iron constructs), from map 35.** Question: armour and immunity.

| Type                                 | Life × / Dmg ×        | Behaviour                                                                                                      | Cost |
| ------------------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------- | ---- |
| Sentinel                             | 2.0 / 1.6, melee, 2.0 | ×4 armour, ×3 stun threshold; a telegraphed slam (2-tile radius, 3× hit damage).                               | D    |
| Arbalest                             | 1.2 / 1.2, stationary | Every 2 s, fires a bolt that pierces everything in a 10-tile line.                                             | H    |
| Core Golem (fire, cold or lightning) | 1.5 / 1.2, melee, 2.4 | Immune to its element and that element's ailment; on death, leaves burning, chilled or shocked ground for 6 s. | F/H  |
| Warden Pylon                         | 0.8 / —, stationary   | Allies within 5 tiles take no damage while it stands; high armour.                                             | H    |

- Champion: **The Reliquarian** switches its core element at every 25% of life, and is immune to the current one.
- Drops: Reliquary Slag, extra Socket Augers; tablets for The Walled Heart, Meteorite Edge, The Lantern Bulwark and
  Thunderwire Hauberk.

### 7.4 Themes

Themes become faction-led. The five Ossuary themes stay (maps 1+). New themes join as their faction does, and
mixed-faction themes appear from map 40. Each map still offers two themes.

| Theme             | Factions (share)                    | Element leaning         | Bonus              | From map |
| ----------------- | ----------------------------------- | ----------------------- | ------------------ | -------- |
| Ashen Crypt       | Ossuary                             | fire ×3                 | +20% item quantity | 1        |
| Rimed Catacomb    | Ossuary                             | cold ×3                 | +20% item rarity   | 1        |
| Thunder Vault     | Ossuary                             | lightning ×3            | +15% experience    | 1        |
| Bone Pits         | Ossuary (brutes ×2)                 | none ×2                 | +1 rare pack       | 1        |
| Archer's Gallery  | Ossuary (archers ×3, Shieldbearers) | —                       | +1 chest           | 1        |
| Charnel Pits      | Rot 70%, Ossuary 30%                | —                       | +1 essence         | 8        |
| Gnawing Warrens   | Swarm 70%, Ossuary 30%              | —                       | +30% item quantity | 12       |
| Hollow Vigil      | Hollow 70%, Ossuary 30%             | cold ×2                 | +20% item rarity   | 15       |
| Ashen Nave        | Choir 60%, Ossuary 40%              | fire and lightning ×2   | +1 currency item   | 25       |
| Reliquary Vault   | Reliquary 60%, Ossuary 40%          | one core element, shown | +1 Socket Auger    | 35       |
| Mixed (generated) | two new factions, 50/50             | —                       | the stronger bonus | 40       |

Each theme button shows the factions, the element, the bonus, notable drops (6.2), any map affixes (7.5), and the
threat preview (section 9).

### 7.5 Map affixes

From map 20, each offered map rolls 0–1 affixes, rising to 2–3 by map 60. Each affix adds its reward to the map.
Wayfinder's Chalk (8.2) adds an affix (one of three shown) or removes one.

| Affix                                                                         | Punishes                            | Reward             |
| ----------------------------------------------------------------------------- | ----------------------------------- | ------------------ |
| Monsters cannot be leeched from                                               | leech                               | +15% item quantity |
| Players have 40% less recovery (life, ES, leech, flasks)                      | sustain                             | +20% item quantity |
| Players have −20% to maximum resistances                                      | everyone; builds sitting at the cap | +25% item quantity |
| Monsters have +40% resistance to one element (shown)                          | that element                        | +15% item quantity |
| Monsters gain 30% of damage as extra chaos                                    | ES builds, low chaos resistance     | +20% item quantity |
| Monsters' hits can't be evaded                                                | evasion                             | +15% item quantity |
| Monsters have 40% more life                                                   | slow builds                         | +20% item quantity |
| Monsters deal 25% more damage                                                 | glass builds                        | +20% item quantity |
| +2 rare packs                                                                 | everyone (The Trophy Cord loves it) | +30% item rarity   |
| Patches of caustic ground                                                     | melee                               | +15% item quantity |
| A faction champion guards the end room                                        | —                                   | +1 unique          |
| Monsters are Hex-warded (X8)                                                  | hexes                               | +10% item quantity |
| Players are hexed with Brittle Doom (X8)                                      | builds sitting at the cap           | +20% item quantity |
| Monsters reflect 10% of elemental damage (Chalk only, never rolled at random) | high-damage elemental builds        | +40% item quantity |

---

## 8. Currency and crafting

### 8.1 Principles

Single player has no trade economy, so currency does not have to be scarce, opaque or risky to keep its value. The only
design question is: who decides what happens to an item? The answer here is the player.

- **The player chooses; the dice fill in the details.** The player picks which affix is removed, which family is added,
  which affixes are kept, and how many sockets the item has. Chance is limited to the tier and value of a chosen
  family, and to a short list of outcomes shown before the player decides.
- **Look, then pick.** A craft that draws outcomes (the Reforging Ember) shows all of them, each as a card with its
  effect on the character sheet (DPS, effective HP, resistances), and the player keeps one. There are no retries: the
  currency is spent when the outcomes are drawn, and the choice is in the pick, including "keep the original".
- **Deterministic.** Draws come from `new Rng(seed).fork('craft' + craftSeq)`, and `craftSeq` rises with every draw.
  Reloading a save shows the same outcomes, so closing the game gains nothing. A pending pick is part of the save.
- **Few verbs, each obvious.** Each currency names one verb on one part of the item: sockets, the affix set, affix
  values, or the seal. The Workbench lists every action available for the selected item, with its price.
- **A floor.** Salvaged items give Dust, and Dust buys basic versions of the directed crafts (8.3). A run with poor
  currency luck still has a plan.
- **Two gambles remain**, because a risk dial is also a choice: the Knucklebone Die and the Rot Seal. Everything else
  does exactly what it says.
- **Camp-only and per run.** Nothing carries over between runs. Crafting is final, so it clears the undo history.

### 8.2 The currencies

| Ours                                                                      | You choose                                                                                                                                                                         | Left to chance                                                                                                                                                                                                       | Price and trade-off                                                                                                           | Modelled on                   | Main source                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------ |
| Reforging Ember                                                           | Which affixes to **pin** (keep). Then one of four results: the original, or one of three alternatives for the unpinned affixes. Rare items; base, sockets and item level are kept. | The three alternatives.                                                                                                                                                                                              | 1 Ember plus 1 per pinned affix. Spent whether or not you swap, so the price of control is visible.                           | (Chaos Orb)                   | all maps from 10; common       |
| Marrow Pearl                                                              | The **family** to add, from those valid for the item's slot and level, onto a rare with a free prefix or suffix.                                                                   | The tier and value, by item level.                                                                                                                                                                                   | 1 Pearl. A full item needs a Thread first.                                                                                    | (Exalted Orb, crafting bench) | mini-bosses; rares from map 30 |
| Unravelling Thread                                                        | The **affix to remove**.                                                                                                                                                           | Nothing.                                                                                                                                                                                                             | 1 Thread.                                                                                                                     | (Orb of Annulment)            | uncommon                       |
| Whetstone                                                                 | One affix to **polish**: its value is raised to the maximum of its tier.                                                                                                           | Nothing.                                                                                                                                                                                                             | 1 Whetstone. At most 2 polished affixes per item.                                                                             | (Divine Orb)                  | uncommon                       |
| Socket Auger                                                              | The **socket count**, up to the item's cap.                                                                                                                                        | Nothing.                                                                                                                                                                                                             | The 4th, 5th and 6th sockets cost 1, 2 and 3 Augers. Going down is free, and gems in removed sockets return to the inventory. | (Jeweller's Orb)              | common; the Reliquary more     |
| Knucklebone Die                                                           | Which normal item to throw.                                                                                                                                                        | Magic 60%, rare 30%, or a unique of that base 10%.                                                                                                                                                                   | The item is used up, and the result is usually modest.                                                                        | (Orb of Chance)               | uncommon                       |
| Rot Seal                                                                  | Which item to seal, and when.                                                                                                                                                      | 25% each: a corruption implicit (such as +1 to socketed gem levels, +2% to a maximum resistance, or immunity to hexes), a socket-count reroll, a reforge as a random rare (a unique loses its identity), or nothing. | The item can never be changed again.                                                                                          | (Vaal Orb)                    | rare; the Rot more             |
| Essences (5): Plague Ichor, Ectoplasm, Censer Ash, Chitin, Reliquary Slag | One affix **family** from the essence's list (below), added to a normal, magic or rare item. If no slot of that kind is free, you also choose which affix it replaces.             | The value, within the tier set by item level.                                                                                                                                                                        | The matching faction is the only source. Nothing else on the item changes.                                                    | (Essences)                    | the matching faction only      |
| Wayfinder's Chalk                                                         | On an offered map: add an affix (one of three shown), or remove one.                                                                                                               | The three shown.                                                                                                                                                                                                     | More danger for more loot; removal costs 2.                                                                                   | (map currency)                | common from map 20             |

| Essence        | Affix families offered                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| Plague Ichor   | chaos resistance; chance to poison; adds chaos damage to attacks (new family) |
| Ectoplasm      | energy shield (local and global); evasion; maximum mana                       |
| Censer Ash     | reduced mana reserved; aura effect (new); curse effect (new, X8)              |
| Chitin         | attack speed; life on hit; area of effect (new)                               |
| Reliquary Slag | armour; physical damage; stun threshold                                       |

### 8.3 Salvage and the Workbench

- **Salvage.** Any inventory item can be salvaged into **Bone Dust**: normal 1, magic 2, rare 5, gem 4, flask 1,
  unique 15, each × (1 + item level / 50). The Items tab's "discard junk" becomes "salvage junk". This gives each of
  the 730–770 items a run picks up a use.
- **The Workbench** (modelled on the crafting bench) is the one screen where every craft happens. Choose an item
  (equipped or carried), and the screen lists each action available for it with its price, then shows the result as
  a card with its effect on the sheet.
- **Dust crafts** are the floor: always available, deterministic, and capped at a mid-low tier, so currency is how you
  reach the top tiers.
  - add one chosen affix into a free prefix or suffix. One bench affix per item, removable for free;
  - remove one chosen affix;
  - set an item's socket count to N, at an escalating cost;
  - add flask suffixes: of Warding (immune to hexes during the effect; X8), of Cleansing (removes poison), of Grounding
    (removes shock), plus the existing ones.
- **Recipes** unlock in bands at maps 10, 25, 40 and 60. Example costs:

| Recipe                                    | Dust           |
| ----------------------------------------- | -------------- |
| Maximum life (prefix, tier 3)             | 20             |
| One elemental resistance (suffix, tier 3) | 15             |
| Chaos resistance (suffix, tier 2)         | 40             |
| Attack speed or cast speed (suffix)       | 30             |
| Remove one chosen affix                   | 25             |
| Socket count 4 / 5 / 6                    | 40 / 120 / 300 |

### 8.4 How currency fits the run loop

- **Save data.** New `RunState` fields: `currency` (count per currency id), `dust`, `tablets` (count per unique id),
  `craftSeq`, and `pendingCraft` (the item and the drawn options, while a pick is open). `SAVE_VERSION` is bumped and
  older saves are rejected, as DESIGN §5.5 already says.
- **Pickup.** Currency drops are picked up like items and go into a pouch outside the 60-slot inventory.
- **Auto-continue.** Currency never pauses auto-continue, since it arrives almost every map; a camp badge shows what
  is new. A completed tablet set pauses it, like a new rare, because a decision is waiting. An open pick (a drawn
  craft that has not been chosen) also blocks it.
- **Reward pick.** One of the three offers can be a currency bundle. Offer pool weights become item 45, gem 25,
  flask 15, currency 15.
- **No undo.** Crafting and salvage clear the camp undo history. Draws use `craftSeq`, so undo could not make a reroll
  free, but a clean rule is easier to explain.
- **UI.** A Workbench tab in camp shows the item list, the currency pouch, and the selected item's card with the action
  list and option cards (section 9). Wayfinder's Chalk is used on the map buttons instead.
- **Bots.** The greedy bot evaluates the real options on the sheet instead of sampling outcomes:
  - Pearl: the family with the best score gain;
  - Thread: the affix whose removal costs the least score;
  - Ember: pins every affix that raises the score, then takes the best of the four results;
  - Whetstone: the affix with the biggest gain;
  - Auger: the socket count the build's gems can use;
  - Die and Seal: only on items it would discard anyway, never on its equipped gear.

  The random bot makes random legal choices with whatever it holds.

### 8.5 Economy targets (measured with the bot)

Currency is deliberately more generous than a trade economy could allow, because the player's choices are the scarce
resource, not the items. All values are _tunable_; the greedy win rate staying inside 25–50% is the check.

| Map band | Currency items per map | Dust per map from salvage | Crafts per camp visit |
| -------- | ---------------------- | ------------------------- | --------------------- |
| 1–10     | 0.5                    | 10                        | 1–2                   |
| 11–30    | 1.5                    | 25                        | 2–3                   |
| 31–60    | 3                      | 40                        | 3–4                   |
| 61–100   | 4                      | 60                        | 3–5                   |

---

## 9. Legibility: what the player sees

- **Threat preview on the map buttons:** factions, element, affixes, and "against this map: DPS ×0.62 · EHP ×0.48
  (chaos resistance −20%)", computed from the threat profiles (5.10).
- **Death recap on the run summary:**
  - the last 5 s of damage taken, by source and damage type;
  - the killer's mods;
  - your resistances, hexes and ailments at the time.
- **Inspect card:** faction rules in plain words ("Ethereal: takes 50% less physical damage"), next to the existing
  affix marks.
- **Item and gem cards:** rule lines (triggers, granted keystones, item rules) set apart from stat lines. A triggered
  gem says what triggers it, for example "Triggered by Frostwrit (melee crit)". A secondary skill shows its cooldown.
- **Sheet and Skills tab:** a line per skill (primary, secondary casts, triggered skills) with its own DPS, and a
  combined total (5.5a).
- **HUD:** charge pips, and hex icons on you and on the selected target.
- **Workbench:** the price of every action on the selected item. A craft that draws options shows each as a card with
  its change in DPS, effective HP and resistances (the same diff the equip comparison uses), next to the original.
- **Tablet progress** per unique.

---

## 10. Measuring depth

### 10.1 Bot upgrades (X1, X2, X4, X6)

The harness is only as good as the bot playing it. Each blind spot below would make the metrics lie:

1. **Conditions.** The bot scores with every condition off (`cfgFor` in `src/run/bot.ts`), so conditional and
   triggered content looks worthless. Fix: score with the steady-state condition sets (5.10). For the top 3 candidates
   of each decision, break ties with a short sim (30 simulated seconds on a reference room of the next theme's factions;
   about 15 ms each at today's speed).
2. **Map choice.** The bot always takes the first theme. Fix: choose by the threat-preview score.
3. **Multi-step plans.** Equip decisions are single swaps, so example 2's socket move is invisible. Fix: when an item
   would strand gems, also evaluate moving the gem group to the best other host.
4. **Skills.** `botRegem` picks one host item and one active skill. With secondary casts (5.5a) it must also decide
   which further actives earn a socket, by the combined score.
5. **Currency** (8.4): the bot crafts by evaluating the real options.
6. **Archetype bots.** Each worked example in section 4 and each build-defining unique becomes a scripted plan: a
   target skill, keystones and uniques the bot steers toward, using tablets and currency. The depth metrics run per
   archetype.

### 10.2 Metrics and targets

| Metric                                                                            | Target                                                                                   | Today                    |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| Random play dying within the first 5 maps (120 runs)                              | at least 75%                                                                             | 82%                      |
| Greedy bot win rate (60 runs)                                                     | 25–50% after every milestone (content is not just power creep)                           | 37%                      |
| Distinct build signatures among bot wins (primary skill, keystones, uniques worn) | at least 6, none above 35% of wins                                                       | not measured             |
| Bot runs wearing a build-defining unique at map 50                                | at least 50%                                                                             | none at map 100 (6 runs) |
| Faction pressure                                                                  | each faction is the top killer of at least one archetype; none causes over 35% of deaths | one faction              |
| Theme-aware bot vs first-theme bot                                                | +8 points of win rate                                                                    | —                        |
| Crafting bot vs non-crafting bot                                                  | +8 points of win rate                                                                    | —                        |
| Crafting bot vs a bot that crafts at random                                       | wins by at least 5 points: the choices matter                                            | —                        |
| Sim speed                                                                         | at least 500× real time (DESIGN §15.5)                                                   | 1,600–2,300×             |

### 10.3 Reports

`npm run sim` and `npm run random` gain:

- a killer histogram by faction, monster type, mod and damage type;
- uniques found and worn at maps 25, 50 and 75;
- the build signature of each win;
- currency earned and spent per map band;
- a faction × archetype death matrix.

`randomRun` already records each run's killer; X1 aggregates it.

---

## 11. Milestones

Each milestone ends like DESIGN's:

- green `npm run check` and `npm run build`;
- a browser smoke check where something is visible;
- updated progress notes;
- one commit, made when the user asks.

**Order matters.** X1 records the baselines before any engine or content change, so every later number compares
against a clean "before". Secondary casts (5.5a) are an engine change, so they come after X1.

### X1 — Measurement and bot readiness

_Status: done 2026-10-06. See `docs/PROGRESS.md`._

1. Baselines (60 greedy-bot runs, 120 random runs, seeds recorded) go into `docs/PROGRESS.md` **first**, before
   anything below changes the bot.
2. The reports of 10.3 exist (faction columns show only the Ossuary until new factions land).
3. The calc config has the _clearing_ and _boss_ condition sets (5.10), and the bot scores with them. A test shows a
   conditional mod ("more damage if you've killed recently") changing the bot's score.
4. The bot picks the better-scoring theme; `--themes first` keeps today's behaviour for comparison.
5. The baselines are recorded again with the upgraded bot, so later milestones compare against the bot that will
   actually play them.

### X2 — Engine verbs I

_Status: done, including secondary casts (built under the plan's default after the user asked for every equipped skill to be cast; one revert if they would rather not). See `docs/PROGRESS.md`._

1. The tag budget is settled (5.1): `triggered` joins the mask and it is not widened. Every existing test passes,
   including convergence.
2. The conditions, stats, flags and item rules of 5.2–5.4 exist, each with a unit test. Low life follows DESIGN §6.3
   (test).
3. Triggers (5.5), with the reference game's rules: hit, crit, attack, kill, block and hit-taken triggers fire with
   their chance and cooldown. Triggered skills use their own profile, pay mana (and do not fire when mana is short),
   and never trigger anything. Kill explosions are capped per tick. Each rule has a test.
4. Secondary casts (5.5a), if approved: every equipped active skill is cast when it is ready. The sheet shows a line
   per skill and a combined total; the bot and the random player know about it.
5. The convergence cases of 5.5 and 5.5a pass (±5%).
6. The determinism test passes, and the sim stays at 500× real time or faster.

### X3 — Acquisition and uniques wave 1

_Status: done 2026-10-06, with 7 of the 8 hoped-for wave-1 uniques worn at map 50 (9 at map 75). See `docs/PROGRESS.md`._

1. 6.2 items 1–4 are in place: drop weights, mini-boss uniques, unique reward picks, faction pools. 60 bot runs find a
   median of at least 15 uniques per 100 maps.
2. The 23 wave-1 uniques and the shock- and freeze-chance suffixes are in `src/data`. The IP scan passes, and each
   signature line has a test.
3. In 60 bot runs, at least 8 different wave-1 uniques are worn at map 50 in at least one run each.
4. At least 75% of 120 random runs still die within 5 maps.
5. Item cards set rule lines apart.

### X4 — Trigger uniques and supports

_Status: done 2026-10-06 (optional item 4 not done)._

1. The 11 wave-2 uniques, Critical Relay, Wounded Retort and Ember Burst exist, with tests.
2. The sheet shows triggered skills with their DPS. A test shows Frostwrit with Frost Lance socketed scoring above
   Frostwrit alone.
3. Bot lookahead for stranded gems (10.1 item 3) exists, with a test equipping The Walled Heart after a gem move.
4. Optional: verb lines for the 14 stat-stick uniques (6.3).

### X5 — Counterplay mods, map affixes, threat preview, death recap

_Status: done 2026-10-06: the theme-aware bot beats the first-theme bot by 18 points._

1. The 13 counterplay mods that don't need hexes exist, with tests and late-map gating.
2. Map affixes (7.5) appear from map 20 and show on the map buttons.
3. The threat preview appears on the map buttons.
4. The death recap appears on the run summary.
5. Over 60 runs, the theme-aware bot beats the first-theme bot by at least 5 points of win rate (target 8).

### X6 — Currency and crafting (done)

1. All 8 currencies and the 5 essences, salvage, the Workbench with its Dust recipes, epitaph tablets and reward-pick
   bundles exist. `RunState` gains `currency`, `dust`, `tablets`, `craftSeq` and `pendingCraft`, and `SAVE_VERSION` is
   bumped (old saves are rejected).
2. Tests:
   - each directed currency produces exactly the chosen outcome: the removed affix is the picked one, the added
     family is the picked one, the socket count is the set one, and pinned affixes survive a reforge;
   - a Reforging Ember offers the original and three alternatives, and its price follows the pin count;
   - the Knucklebone Die and Rot Seal odds over 10,000 samples are within ±2 points;
   - crafting clears the undo history;
   - outcomes are deterministic per `craftSeq`, and a reloaded save shows the same pending pick;
   - sealed items reject further changes.
3. The bot crafts by evaluating the real options on the sheet. Over 60 runs, a crafting bot beats a non-crafting bot
   by at least 5 points of win rate (target 8), and beats a bot that crafts at random.
4. The economy is within ±30% of the 8.5 targets, and the greedy win rate stays inside the 25–50% band.

### X7 — Factions I: the Rot and the Hollow (done)

1. The Shieldbearer, the Rot (4 types) and the Hollow (4 types) exist, with distinct silhouettes. So do corpses, ground
   effects, the hazard-aware player AI, blink, monster ES shells and mana drain.
2. The Charnel Pits and Hollow Vigil themes exist, with champions, essences and tablets.
3. Each behaviour has a test; the determinism test passes; the sim stays at 500× real time or faster.
4. Neither faction causes more than 35% of bot deaths, and each is the top killer of at least one archetype.

### X8 — Charges, curses, the Choir and uniques wave 3 (done)

1. Charges and hexes (5.6–5.7) work in both calc and sim, with HUD pips and icons. Hexing Strikes, the 4 hex gems, and
   the Hex-warded and Hexcaller mods exist.
2. The tree gains at least 10 new notables (6.5), and `SAVE_VERSION` is bumped.
3. The Choir faction, the Ashen Nave theme and the five wave-3 uniques exist.
4. Convergence: Open Wounds on the training dummy is within ±3% of the calc.

### X9 — The Swarm and the Reliquary (built; win rate 21% against a 25–50% target, see PROGRESS)

1. The Swarm (4 types) and the Reliquary (4 types) exist with new procedural rigs, along with fliers, spawners, pylons,
   core golems, their themes, champions and drops.
2. Rooms of 40 Swarm actors keep the sim at 500× real time or faster.
3. The depth targets of 10.2 are met.

---

## 12. Risks

1. **Scope.** This is several times the content of DESIGN's M4 and M5 together. Each milestone ships on its own, and
   X1–X6 already deliver the item, currency and map-choice depth without any new enemy art.
2. **Balance blow-ups.** The likely ones:
   - trigger loops (mitigated by cooldowns, no triggers from triggered skills, and the explosion cap);
   - secondary casts adding a second damage source on top of the primary;
   - directed crafting making a good item reliable (the economy numbers in 8.5 are the dial, and the 25–50% win-rate
     band is the alarm);
   - Knucklebone Bindings multiplying the per-level attack damage (DESIGN Appendix A);
   - The Trophy Cord snowballing;
   - reflect.

   The harness catches these as win-rate spikes in a single archetype.

3. **A bot that can't play the content makes every metric lie.** That is why X1 comes first, and why archetype bots
   exist.
4. **Performance:** swarms, ground effects and explosion chains.
5. **Readability:** more effects on an already busy isometric screen. Mitigated by telegraph colours by threat and
   distinct faction silhouettes.
6. **Saves.** Changes to `RunState` and edits to the tree bump `SAVE_VERSION`, and older saves are rejected (the
   loader already does this). There is no migration, and nothing else needs protecting, so unique ids may change.
7. **IP:** about 60 new names. When the content lands, every reference name used in this document's parentheses is
   added to `src/data/ipDenyList.ts`.
8. **Auto-battler fit.** Reference uniques that depend on manual play are left out until the AI has tactics settings.
   That covers positioning, movement skills and close-range bow bonuses (for example the item behind Chin Sol).
9. **Skill model.** Once secondary casts exist, the primary skill's DPS is no longer the whole story. Per-skill sheet
   lines and a combined total keep it readable, and the convergence cases keep the calc honest.

---

## 13. Open questions for the user (defaults in effect until answered)

Answered in review (2026-10-06): unique jewels are out; saves may break, so there is no migration; currency should
favour the player's agency over the reference game's behaviour (section 8); triggered skills follow the reference
game's rules (5.5).

| Question                                                                         | Default                                                                                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Cast every equipped skill: a primary plus secondary casts with cooldowns (5.5a)? | Yes, built after X6 under the default (the user asked for it); they can still say no and it is reverted |
| Reopen D6 for charges and curses?                                                | Yes, in X8                                                                                              |
| New factions beyond skeletons (D10)?                                             | Yes, staged; humanoid factions first                                                                    |
| Reflect in map affixes?                                                          | Only when added with Wayfinder's Chalk; never rolled at random                                          |
| Player tactics in camp (target priority, hazard avoidance, preferred range)?     | Not in this plan; a sensible default AI. Revisit after X7: it would unlock range-dependent uniques      |
| Currency or unlocks carried between runs (meta-progression)?                     | No; everything is per run                                                                               |
