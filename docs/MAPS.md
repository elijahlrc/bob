# Bob — Map Choice Plan: offers, attrition and map types

Status: **approved 2026-10-07; R0 (three offers) is built, R1 onwards is next**; revised with the user's answers · Owner: the user · Implementer: Claude

This plan extends [DESIGN.md](DESIGN.md) and [EXPANSION.md](EXPANSION.md). **Implementation waits** until the passive-tree
work stream has landed, because R0 rewrites `src/run/run.ts` and the DESIGN edits (section 13) touch `docs/DESIGN.md`,
which that stream is also changing. When work starts, the edits in section 13 go into DESIGN.md and Appendix A, and the
R milestones in section 11 are tracked in `docs/PROGRESS.md`.

Conventions follow DESIGN.md:

- Every number is a v1 value and _tunable_ unless stated.
- Reference-game names appear only in parentheses, to say which mechanic is meant (DESIGN §3.5).
- Every name in an "Ours" column is invented here and must pass the IP scan when it enters `src/data`.
- Reference tables for map mods go in `docs/coverage/`, never in `src/` (DESIGN §3.2).

**Reading guide.** Sections 0–3 make the case and list the decisions. Sections 4–9 are the systems. Section 10 covers
legibility and the bot. Sections 11–13 are milestones, risks and the DESIGN edits. Section 14 records what the user
decided, the interpretations to confirm, and what is still open.

**What changed in this revision.** The first draft let a player skip or repeat levels ("push" and "detour"). The user
rejected that: **the level of the map you take never changes which map comes next.** The counter advances by exactly 1 per
level, always, so the run stays 100 maps long and the crossing rules, gate clamps, variable run length and detour grind
rules are gone. An offer's level is now only a difficulty and reward dial. Camp restores only 10 seconds of natural
recovery (no restore table, no mercy floor), abandon takes 5 s and advances the counter, and Respite advances it too.

---

## 0. Summary

- **The problem.** Build choices matter, but the route does not. Each camp offers 2 themes at the _same_ area level,
  most of them small bonuses on a fixed monster mix, so one option is usually just better for the build. Nothing
  carries between maps (every map starts at full life, mana and flasks), and a map can only end in a clear or a death.
- **The approach.** Turn the next-map offer into a small **contract**: one of three maps that differ in what they ask
  and what they pay. Four things make the contracts matter:
  1. **Level offsets.** An offer can sit two levels above or below the counter. Higher pays more XP and better items;
     lower is the place to recover life and refill flasks. Neither changes which level comes next.
  2. **Map affixes** drawn from the reference game's map mods, from early in the run, with a fixed reward currency
     per affix so the pay-off is not always "more items".
  3. **Attrition.** Life, mana, energy shield and flask charges carry from map to map. Camp restores only what 10
     seconds of sitting still would. A non-combat **Respite** offer restores everything, at the price of the level.
  4. **Abandon.** The player can leave a map (except a mini-boss or boss map) and keep what they earned so far. The
     level still counts as passed.
- **New map types** change what kind of challenge a map is. The first is **Crescendo**, whose monsters grow stronger
  with time, so the abandon button becomes a real decision. Quarry (a hunt for a few champions) and Stampede (a very
  large crowd of weak monsters) cost almost nothing to build. Holdout, Collapse and Crawl are later.
- **How we know it worked.** The headless bot gets a route policy. Success means a bot that reads the offers beats a bot
  that picks at random, no single offer kind is the best pick for every build, and the greedy exploits (always
  abandon, always rest, always take the easy map) stay below the honest strategy (section 10.3).

---

## 1. Goals and principles

1. **A choice is a trade-off between things the player can see.** Every offer states its danger and what it pays,
   and shows what it means for _this_ build (the threat preview, extended).
2. **The build is the question the offers ask.** Affixes and types are written to punish or favour specific builds,
   so the same three offers rank differently for a fire mage and an armour bruiser. Strong regeneration is a way to
   afford the harder offers.
3. **Skipping costs a level, not a clock.** The game has no timer, so anything repeatable and free becomes a grind.
   The counter advances every time, so Respite and Abandon cost the loot and XP of a level, and nothing can be
   repeated.
4. **Pacing survives.** The counter is the schedule. Level should still track it, with offsets and skipped levels
   adding spread (section 10.3).
5. **No new input during a map except abandon.** The character still walks and fights alone (section 3, D9).
6. **Determinism.** Offers are rolled from the run seed and stored in the save, so reloading cannot re-roll them.
   The headless modules stay headless (DESIGN §14.2).

**Non-goals for this plan.** A town or shop; map items as a consumable economy; a map device with sockets; endgame
atlas; the more intricate reference-game map types (we copy none of their complexity yet); mid-map decisions by the
player other than abandon; skipping or repeating levels.

---

## 2. Where things stand (read from the code, 2026-10-07)

| Fact                                                                                                                                      | Where                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| The camp offers `nextThemes: [string, string]`, two themes at area level `map`.                                                           | `run.ts`, `Camp.tsx`                  |
| `map` is both the counter and the area level. Rooms, end kind, resist tier, bonus points, rewards and victory use it.                     | `mapPlan.ts`, `finishMap`             |
| Both offers share one labyrinth seed (`mapSeed(run, map)`); only the population differs.                                                  | `run.ts`                              |
| Map affixes start at map 20: 11 affixes, count 0–1 / 1–2 / 2–3 by map 20/40/60, each paying item quantity or rarity.                      | `mapAffixes.ts`, `rollMapAffixes`     |
| Chalk edits are kept per offer in `mapEdits` (2 entries) and merged in `affixesFor`.                                                      | `run.ts`, `craft.ts`                  |
| A new world starts at full life, mana, ES and flask charges. The comment on `CreateWorldInput.xp` mentions carry-over but nothing exists. | `world.ts`                            |
| `MapStatus` is `running / cleared / dead / timeout`. `finishMap` treats everything but `cleared` as death.                                | `sim/types.ts`, `run.ts`              |
| The threat preview scores each theme by DPS, effective HP and a pressure number, and builds its `Character` at `areaLevel: run.map`.      | `threat.ts`, `preview.ts`, `Camp.tsx` |
| Auto-continue starts offer 0 after a 2 s countdown. The bot ranks the two themes with `scoreTheme`.                                       | `Camp.tsx`, `bot.ts:120`              |
| `levelPenalty` costs 12% XP per level of distance beyond `3 + floor(playerLevel / 16)`.                                                   | DESIGN §5.4                           |
| Flasks gain charges only from kills (`FLASK_CHARGES_ON_KILL` in `killActor`).                                                             | `sim/combat.ts`                       |
| EXPANSION 7.5 lists affixes not yet implemented: caustic ground, a champion at the end, the two hex affixes, reflect (Chalk only).        | `EXPANSION.md`, `mapAffixes.ts`       |

Consequence: the offers are different _flavours_ of the same step. The plan makes them different _bets_.

---

## 3. Decisions to reopen

These touch decisions recorded in DESIGN.md. Each needs an explicit yes when the work starts. **D15 is unchanged:** the run
is still 100 maps from level 1 to level 100.

| #    | Decision today                                               | Proposal                                                                                                                                                                                                 |
| ---- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D9   | "Player input in maps: None. Speed controls only."           | **Amended: speed controls and Abandon.** Flask triggering stays behind a policy interface, and Abandon gets one too (`AbandonPolicy`, section 7), so the bot and a future manual mode use the same seam. |
| New  | —                                                            | **D16, route choice:** three offers per level, differing in level offset, type, theme and affixes; carry-over of life, mana, ES and flask charges; Respite; Abandon.                                     |
| §5.1 | `[Camp → Map]×100`                                           | `[Camp → (Map \| Respite)]×100`. Camp is visited after every level, including an abandoned one. Death or clearing map 100 ends the run.                                                                  |
| §5.3 | "Next-map choice: two options with the same area level"      | Three offers (section 4). Area level may differ from the map number by ±2 (section 5). Every other rule keyed to the map number stays keyed to it.                                                       |
| §5.4 | "Median level within ±4 of _n_ after map _n_"                | Unchanged for a bot that always takes the anchor. Restated with wider bounds for a bot that reads the offers (section 10.3).                                                                             |
| 2.1  | "Mid-map saving: reload restarts the map from the same seed" | Unchanged. With Abandon and carry-over a reload is a free undo of a bad map; the user accepted this (section 12, risk 6).                                                                                |

---

## 4. Offers

### 4.1 The offer record

`RunState.nextThemes` and `mapEdits` are replaced by a stored set of three offers. `run.map` stays as the counter.

```ts
type OfferKind = 'map' | 'respite';
type MapTypeId = 'plain' | 'crescendo' | 'quarry' | 'stampede' | 'holdout' | 'collapse' | 'crawl';

type MapOffer = {
  /** Stable within a run: `${map}.${slot}`. Seeds the layout. */
  id: string;
  kind: OfferKind;
  type: MapTypeId; // 'plain' for respite
  /** The level of the monsters and loot: the counter plus the offset, clamped to 1–100. */
  areaLevel: number;
  /** −2, 0 or +2. Zero for the anchor, for respite, and on the first four levels. */
  offset: number;
  themeId: string; // unused by respite
  affixes: string[]; // Chalk edits this list in place; no separate edit record
};
```

- `RunState` gains `offers: MapOffer[]` and `vitals` (section 8). `nextThemes`, `mapEdits` and `noMapEdits` go.
- Offers are rolled when the previous level ends and stored in the save. They never depend on anything that can
  change at camp except the vitals read at the moment of the roll (section 4.2), so equipping gear cannot re-roll
  them, and a reload shows the same set.
- The layout seed of an offer is `fork('map.' + offer.id)`, so the three offers have different layouts (today they
  share one).
- **One set per level.** The player takes one offer, and the counter advances by 1 whatever happens: a clear, an
  abandon and a Respite all lead to the next level's set. There is no second chance at the same level, so nothing can
  be farmed.

### 4.2 Composition

The set always has three offers, with three different themes. Rolls happen in this order, which `rollOffers` must follow:

1. **Slot 1, the anchor:** a map at offset 0. It can carry affixes and a type like any other.
2. **Slots 2 and 3, kind:** each is a `map`, unless a Respite is rolled (below).
3. **Offset** for slots 2 and 3, on levels 5 and up: 60% offset 0, 20% −2, 20% +2. When life or any flask is under 60%,
   the weight of −2 doubles, so the recovery option shows up when it is needed. At map 100 a +2 clamps to 100.
4. **Type**, for every map offer except on a gate level (a multiple of 10): each has a 35% chance of being typed once
   any type is unlocked at that level (table in 9.2), with the type chosen equally among those unlocked, capped at one
   typed offer per set until level 40 and two after.
5. **Affixes** (section 6) and the theme.

**Respite** is one of slots 2 and 3, with weight 10, only when life, mana or any flask is below 90%, and it is always
present in the set when life is below 40%. It never appears on levels 1–4 or on a gate level.

**Gate levels (multiples of 10).** The mini-boss (or, at 100, the unique boss) is in every offer. Offers on a gate level
roll their offsets and affixes like any other level. They cannot be typed, cannot be a Respite and cannot be abandoned.

So a set can be all hard maps. The anchor is the baseline for _level_, not a promise of safety: the safety valves are a
lower-level offer and Respite.

### 4.3 What the player is told

An offer is shown with:

- its level offset ("Level 22 (+2)", "Level 18 (−2)", "Respite");
- its type and theme (factions, element, theme bonus);
- every affix, in words;
- what it pays: quantity, rarity, XP and currency bonuses, extra drops;
- **For you:** DPS ×, effective HP × (as today), plus the build's current life fraction, and a verdict chip
  (section 10.1).

---

## 5. Level offsets

### 5.1 What an offset does

An offset changes **only the level of the monsters and the loot** on that map. It does not change the counter, the
number of maps left, the schedule or what the next set will be.

| Offer level | What the player gets                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Counter + 2 | Monsters two levels up: more XP per kill, better item level, harder hits. Strong regeneration and good defences pay for it.                                     |
| Counter     | The baseline.                                                                                                                                                   |
| Counter − 2 | Easier monsters, so less XP and lower item level, but a cheaper place to recover: regeneration works and kills refill flask charges while the danger stays low. |

There is no explicit bonus for either (`OFFSET_PREMIUM` is a lever set to 0, kept for balancing). The existing scaling
does the work: `baseXp(level)`, item level and monster stats all follow the offer's level.

### 5.2 What keys to the counter and what to the offer

| Rule                      | Keyed to                | Notes                                                                                                              |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Monster level, item level | the offer's `areaLevel` | clamped to 1–100                                                                                                   |
| Monster XP                | the offer's `areaLevel` | `baseXp(areaLevel) · rarity · levelPenalty(player level, areaLevel)`. `levelPenalty` needs no change.              |
| Rooms on the main path    | the counter             | `4 + floor(n/25)`, so an offset cannot shorten a map                                                               |
| Side branches             | the counter             | none on levels 1–4, else 0–2                                                                                       |
| Resist penalty tier       | the counter             | 0 / 30 / 60, so an offset cannot dodge a tier                                                                      |
| End room                  | the counter             | boss at 100, mini-boss at multiples of 10, else a rare pack. The boss or mini-boss uses the offer's monster level. |
| Affix count and strength  | the counter             | section 6                                                                                                          |
| Passive bonus (+3)        | the counter, on a clear | after clearing maps 10, 20 … 80                                                                                    |
| Refund points             | the counter, on a clear | +1 per cleared map                                                                                                 |
| Reward picks              | the counter, on a clear | after every 5th map and every mini-boss; uniques after 25, 50 and 75                                               |
| Skill gem picks           | the counter, on a clear | maps 1–4 (no offsets, no Respite and no Abandon there)                                                             |
| Victory                   | the counter, on a clear | map 100 cleared                                                                                                    |

**Abandoned and Respite levels** advance the counter but earn none of the "on a clear" rows: no refund point, no passive
bonus, no reward pick. Abandoning map 5, 15 or any other multiple of 5 loses that level's reward pick. The user's
direction ("no abandoning mini-bosses") means the +3 passive bonus can never be lost this way.

### 5.3 Pacing

The counter schedule is unchanged, so the pacing target (character level ≈ map number) still applies to a bot that
always takes the anchor. A higher offset adds XP; a lower one removes it; an abandon or a Respite removes a level's worth.
The character at map 100 may therefore be a few levels under 100, which is the price of skipping. Section 10.3 measures
the spread, and `xpTable.ts` is re-measured in R3.

---

## 6. Map affixes

### 6.1 Structure

The existing 11 affixes stay. Changes to how they work:

- **They start earlier.** From map 5 instead of 20. Early affixes are mild (below).
- **Strength follows the counter's band**, so one definition serves the whole run.

| Map    | Value strength (× the numbers in the tables) |
| ------ | -------------------------------------------- |
| 5–29   | 0.5                                          |
| 30–59  | 0.75                                         |
| 60–100 | 1.0                                          |

The tables show full strength. Flags (such as "cannot be stunned") do not scale. Rewards scale with strength.

- **Count by map**, for every offer on that level:

| Map    | Affixes |
| ------ | ------- |
| 1–4    | 0       |
| 5–19   | 0–1     |
| 20–39  | 1–2     |
| 40–59  | 2–3     |
| 60–100 | 3–4     |

An offset does not change the count or the strength: a lower-level map is easier because its monsters are weaker,
not because it has fewer mods.

- **No contradictions.** Two affixes that act on the same stat do not appear together, and the same element is never
  proofed and also given as extra damage on one map. The data file lists the pairs.
- **Reward currencies.** An affix pays one of four things, so offers differ in _what_ they pay, not only how much.

| Reward     | Effect                                                    | Who wants it                                       |
| ---------- | --------------------------------------------------------- | -------------------------------------------------- |
| quantity   | more items per drop roll (as today)                       | the gear-hungry                                    |
| rarity     | better rarity weights (as today)                          | uniques and rares                                  |
| experience | more XP per kill                                          | the underlevelled, especially after skipped levels |
| currency   | extra currency drops (`extraCurrency` in the theme model) | the crafter                                        |

New affixes are priced against the existing ones: about +20% quantity (or its equivalent) per 40% more life,
that is, **reward ≈ half the pressure it adds**. The bot measures whether that is right (section 10.3).

### 6.2 New affixes

The "Analogue" column names the reference mod type in parentheses. The "Cost" column is an **estimate from reading the
existing affix and monster-mod definitions, not a stat audit**; R4's first task is to cross-check the names in the "Ours" column against the 3.9 map prefixes and suffixes drafted into `docs/coverage/` (the IP deny-list catches proper nouns, not generic adjectives that coincide; the existing "Savage" is a candidate to check) and to check the cost column against
`src/mods/types.ts` and the monster calc. `D` means data only; `F` a new flag or stat hook; `P` population only.

| Ours (provisional)         | Text                                                                 | Analogue                       | Punishes / favours          | Reward     | Cost |
| -------------------------- | -------------------------------------------------------------------- | ------------------------------ | --------------------------- | ---------- | ---- |
| Swift                      | Monsters have 20% increased move, attack and cast speed              | (Hasted monsters)              | slow builds, kiters         | quantity   | D    |
| Kindled                    | Monsters gain 25% of damage as extra fire                            | (extra damage as fire)         | low fire resistance         | quantity   | D    |
| Rimed                      | Monsters gain 25% of damage as extra cold                            | (extra damage as cold)         | low cold resistance         | quantity   | D    |
| Charged                    | Monsters gain 25% of damage as extra lightning                       | (extra damage as lightning)    | low lightning resistance    | quantity   | D    |
| Unyielding                 | Monsters cannot be stunned                                           | (cannot be stunned)            | stun builds                 | quantity   | D    |
| Mending                    | Monsters regenerate 2% of their life each second                     | (monster life regeneration)    | low burst, damage over time | quantity   | D    |
| Warded                     | Monsters have +20% to all elemental resistances                      | (monster elemental resistance) | elemental builds            | quantity   | D    |
| Keen-eyed                  | Monsters have +40% accuracy                                          | (monster accuracy)             | evasion builds              | rarity     | D    |
| Sharpened                  | Monsters have +5% critical strike chance and 50% critical multiplier | (monster critical strikes)     | low life, glass builds      | rarity     | F    |
| Piercing                   | Monsters penetrate 15% of elemental resistances                      | (monster penetration)          | builds that cap resistances | currency   | F    |
| Afflicting                 | Monsters' hits have 20% chance to ignite, freeze or shock            | (monster ailments)             | no ailment avoidance        | currency   | D/F  |
| Teeming                    | +25% monsters                                                        | (increased pack size)          | clear speed, AoE            | experience | P    |
| Elite-laden                | +40% magic monsters, +1 rare pack                                    | (more magic and rare monsters) | single-target damage        | rarity     | P    |
| Sluggish                   | Players have 15% less movement speed                                 | (reduced player movement)      | long maps, Crescendo        | experience | D    |
| Sundered                   | Players have 35% less armour and evasion                             | (reduced player defences)      | armour and evasion builds   | quantity   | D    |
| Stifled                    | Players have 30% less area of effect                                 | (reduced area of effect)       | area builds                 | experience | D    |
| Dry                        | Players gain 40% less flask charges                                  | (reduced flask charges)        | flask-reliant builds        | currency   | D    |
| Unguarded                  | Players have −20% block chance (spells too)                          | (reduced block)                | block builds                | quantity   | D    |
| Hexed (EXPANSION 7.5)      | Players are hexed with Brittle Doom                                  | (curse on players)             | builds at the resist cap    | quantity   | F    |
| Hex-warded (EXPANSION 7.5) | Monsters are warded against hexes                                    | (hex immunity)                 | hex builds                  | quantity   | F    |
| Caustic (EXPANSION 7.5)    | Patches of caustic ground                                            | (caustic ground)               | melee                       | quantity   | F    |
| Guarded (EXPANSION 7.5)    | A faction champion guards the end room                               | (map boss)                     | —                           | +1 unique  | F    |

Left out to keep this plan small: reflect (Chalk only, per EXPANSION 7.5), extra monster projectiles, curses that drain
resources and degeneration ground. R4's reference table in `docs/coverage/` lists them as candidates for a later wave.

---

## 7. Abandon

### 7.1 Rules

- A **map-screen button**, "Abandon map", with a second click to confirm. It is available whenever the map is running
  and the exit is not yet open.
- **It is not available on a mini-boss or boss map** (a multiple of 10) **or on levels 1–4** (the early skill picks).
- Pressing it starts an **escape timer of 5 s** of game time (tunable), shown on the button. The character keeps
  fighting and moving. If it dies during the timer, the run ends as usual. Pressing the button again cancels the timer.
  The timer exists so that "abandon" is a decision made _before_ the last hit, not a free undo at 1 life.
- When the timer ends the map ends with status `abandoned`, and the player goes to camp. **The counter advances by 1.**

### 7.2 What an abandoned map keeps and loses

| Kept                                               | Lost                                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Items, gems, flasks and currency already picked up | Anything still on the ground and unopened chests                                                   |
| XP earned so far (and any level-ups)               | The clear rewards: no refund point, no reward pick (including the 5th-map pick), no end-room drops |
| Flask charges earned by kills                      | The rest of the level's XP and loot: the level counts as passed, so the map cannot be played again |
| Life, mana, ES and flask state as they stood       | Nothing else: camp's recovery is the same 10 seconds as after a clear (section 8.2)                |

An abandoned map is logged in `history` with its own status, its area level, its kills and its time.

### 7.3 Engine

- `MapStatus` gains `'abandoned'`. `finishMap` handles it explicitly: today any status other than `cleared` ends
  the run, including `timeout`, so this must not fall through.
- `World` gets an `abandon` request and an escape timer, read in `stepWorld` beside the death checks. The player's
  decision arrives through an `AbandonPolicy` (the UI button is one implementation, the bot another), mirroring
  `FlaskPolicy`.
- A plain map's `timeout` stays a death (it still means "stuck", and `stats.stuck` should stay visible). **A Crescendo
  map has its own hard limit of 330 s** after which the character is pulled out as an abandon, counter advance
  included (section 9.1).

---

## 8. Carry-over: life, mana, ES and flasks between maps

### 8.1 What is stored

`RunState.vitals`:

```ts
type Vitals = {
  /** Fractions of the maximum, so a change of gear at camp keeps them meaningful. */
  life: number; // 0–1
  mana: number; // 0–1
  es: number; // 0–1
  /** Flask charges as a fraction of that flask's maximum, by flask uid. A new flask is full. */
  flasks: Record<number, number>;
};
```

- At the end of a map the world writes the player's life, mana and ES fractions and each flask's charge fraction.
  `MapResult.lifeFrac` already exists; the rest join it.
- `createWorld` starts the player from `vitals` instead of full. `CreateWorldInput` gets an explicit
  `start` field (the old comment about carried resources is replaced).
- Flask _activity_ (a recovery in progress, a utility buff running, a queued use) is not carried: it ends at the end
  of the map. Charges are what carries.

### 8.2 What camp restores

Camp restores each resource by **what it would recover if the character sat still for 10 seconds**
(`CAMP_REST_SECONDS`, tunable). There is no table of percentages and no minimum starting life.

| Resource      | Restored at camp by                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Life          | 10 s of the character's life regeneration                                                                            |
| Mana          | 10 s of mana regeneration (net of reservation, as in the sim)                                                        |
| Energy shield | 10 s of recharge, using the sim's own delay and rate, so most of it comes back                                       |
| Flask charges | 10 s of any time-based charge gain a flask has. Flasks otherwise fill only from kills, so most gain nothing at camp. |

- **Not counted:** leech (it needs hits), flask effects, damage over time, and map affixes (camp is outside any map).
- One function (`restAtCamp`, headless, in `src/run/`) takes the `Character` and the `Vitals` and returns the new
  `Vitals`. It reads the same recovery numbers the sim reads, so there is a single source of truth.
- Restores are fractions of the _current_ maximum and cap at full. Re-equipping gear at camp changes the amounts, not
  the fractions, so it cannot be used to heal.
- Camp is visited after every level, so this restore happens once per level, after a clear and after an abandon alike.
- A **Respite** restores everything to full, ES included. A death ends the run, so nothing carries past it.

### 8.3 What it changes in play

- A hard map costs the _next_ map. A build that wins by a hair has to choose a lower-level offer to recover, or a
  Respite, or has to be strong enough to afford the harder ones.
- **Regeneration is the currency of ambition.** A build with high regeneration or ES recharge recovers most of a map in
  10 s of camp and can take the +2 offers freely; a flask-and-leech build has to pay for each hard map.
- Flasks refill only by killing, so a flask-reliant build needs fights it can win safely. That is the job of the −2 offer.
- The Draining affix (`lessRecovery`) matters twice: in the map, and in the damage it leaves for the next level.

---

## 9. Map types

A type changes what the map _is_. A type is independent of theme (factions, elements) and of affixes, and combines
with both. The type shows on the offer with its rule in one sentence. **A type never appears on a gate level**
(section 4.2), and never on a Respite.

### 9.1 Crescendo — monsters grow stronger with time (first type)

**Rule.** For the first 30 s nothing changes. After that, every 15 s the monsters get one step stronger:
`step = clamp(floor((t − 30) / 15), 0, 16)`, so step 1 arrives at 45 s and the cap of 16 at 270 s.

| Quantity       | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step           | every 15 s after a 30 s grace; at most 16 steps (+80%)                                                                                                         |
| Per step       | monsters deal 5% more damage and have 5% more life                                                                                                             |
| Type reward    | +25% item quantity; **each kill at step _s_ drops +3% × _s_ more**, so lingering pays                                                                          |
| Hard limit     | 330 s: the character is pulled out as an abandon. Deliberately 60 s after the cap, so a very slow clear faces a full +80% for a minute before it is hauled out |
| Typical effect | a 100 s clear ends at step 4 (+20% / +20%); a 200 s clear at step 11 (+55% / +55%)                                                                             |
| From           | level 10                                                                                                                                                       |

**Why it makes Abandon matter.** Slow builds and bad layouts see the map get harder as they stay. The player decides
when the remaining loot is not worth the danger, and since an abandon keeps what is already picked up, the right moment
can come while the map is still open. The price is the level's clear rewards (a reward pick on every 5th map, the
refund point), so the decision is not free either. A fast build treats Crescendo as a bonus map.

**Engine.** Rescaling spawned monsters step by step would mean rebuilding their stats. Instead the world keeps a
`surge` number (the current step), and the hit pipeline reads it in two places: the damage monsters deal to the
player and the damage the player deals to monsters (equivalent to life, and shown to the player as "life"). The loot
hook reads it for the kill bonus. The affixes that already change monster stats are baked into `MonsterSpec`
(`spec.affix`), so this is a different mechanism on purpose. To confirm in R5: the exact lines in `combat.ts`'s hit
resolution and that regeneration and leech scale consistently. The HUD shows the step and the reward bonus.

### 9.2 The other types

| Type         | Rule                                                                                                                                                                                             | What it asks of the build                            | Engine cost                                                                     | From |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------- | ---- |
| **Quarry**   | Three rare champions (the mini-boss recipe with 3 mods) and a quarter of the usual trash. Each carries a guaranteed rare-or-better and a currency stack. The exit opens when all three are dead. | Single-target damage and counterplay to monster mods | Population only (`P`): placement and a spawn recipe. Short maps (3 rooms).      | 10   |
| **Stampede** | 2.5× as many monsters, all normal, each with 40% less life and 20% less damage. +40% item quantity, +25% XP.                                                                                     | Area damage and defence against many small hits      | Population plus two data mods (`P` + `D`).                                      | 12   |
| **Holdout**  | A single arena. The character holds a beacon; 8 waves arrive 12 s apart, the last with a rare. Chests open per wave survived.                                                                    | Sustained defence and area damage; no kiting         | New generator, a "hold" AI mode and a wave spawner. Medium.                     | 25   |
| **Collapse** | After 60 s a pursuer appears at the start and walks the main path. It cannot be killed and a touch is lethal. Reach the exit first.                                                              | Clear speed and movement speed: a hard clock         | A new actor type and AI. Medium. Distinct from Crescendo: a cliff, not a slope. | 30   |
| **Crawl**    | Three short maps in a row with no camp between, one carried state and one reward at the end (a pick of 3, one of them a unique).                                                                 | Endurance: ties directly to carry-over               | A chain in the controller and `finishMap`; per-segment reporting. Medium-high.  | 40   |

- **Phase 1 types:** Crescendo, Quarry, Stampede. Between them they ask for speed, burst and area damage, with almost
  no new engine code beyond Crescendo's hook.
- **Phase 2 types:** Holdout, Collapse, Crawl. They are drafted here so the offer and type model has room for them.
- A type may appear on any map offer that is not on a gate level, at any offset, including the anchor.
- Types do not combine with each other.
- Quarry and Collapse need a forced exit rule that fits "no abandoning mini-bosses" (neither ends in a mini-boss, so
  they are fine). Crawl's chain needs its own rule for the counter, which R7 settles.

### 9.3 Respite is an offer, not a type

A respite resolves at once, with no map: life, mana, ES and flasks go to full, nothing else changes, and **the counter
advances by 1**. It pays no XP or loot and earns no refund point or reward pick. See section 4.2 for when it is
offered. It is the most expensive way to recover (a whole level) and the only way to recover fully.

---

## 10. Legibility, the bot and measuring

### 10.1 What the player sees

- **Offer cards** per section 4.3, with the type's rule in one sentence and every affix in words.
- **Extended threat preview.** Today it reports DPS × and effective HP × against a neutral map. The extension makes
  it per-offer (its `Character` is built at the offer's own area level and the Chalk-edited affix list), makes it
  aware of the new affixes and the type (a Crescendo preview shows "the monsters will be +N% at your usual clear
  time", estimated from the build's DPS and the map's total monster life), and weights effective HP by the life
  fraction the player will arrive with, after camp's 10 s of recovery.
- **Verdict chip** on each card: _Comfortable_, _Close_ or _Dangerous_, from the same number the bot uses to rank. The
  text of the verdict is never a promise, and the chip says so in its tooltip.
- A HUD for the map screen: the Abandon button and its timer, the Crescendo step, and the current life/mana/flask
  state as already shown.

### 10.2 Auto-continue

Today auto-continue starts offer 0 after a countdown. With real choices it needs a rule:

- It takes the **anchor** (slot 1), never another offer.
- It **pauses** (the countdown is cancelled) when life or any flask is below 50%, or when the anchor has a type, in
  addition to today's reasons (unspent points, a pending reward, a craft, new gear). Camp shows the reason.
- The player can switch it off entirely. Stances ("play safest", "play richest") are not part of this plan.

### 10.3 The bot and the acceptance criteria

The bot is the balance instrument (`npm run sim`). It gains:

- **`scoreOffer`**, which generalises `scoreTheme` to an offer: it adds the affix strength bands, the level offset, the
  type and the arriving life fraction. `scoreTheme` stays as its core.
- **`chooseOffer`** (replacing the two-way comparison at `bot.ts:120`) and an **`AbandonPolicy`** for the bot:
  abandon when life stays below a threshold, or when the remaining Crescendo steps outweigh the remaining loot.
- Run strategies selectable with `--strategy random|anchor|greedy|lowball|resting|abandoner`, so the exploits can be
  tested. `lowball` always takes the lowest-level offer; `resting` takes a Respite whenever one is offered;
  `abandoner` abandons at the first sign of trouble.

**Acceptance criteria** (measured over 30 seeds per class and 10 runs where noted):

1. **Reading the offers pays.** The `greedy` bot (best `scoreOffer`) wins more runs than the `anchor` bot, and the
   `anchor` bot wins more than the `random` bot.
2. **No kind dominates.** Over 200 sampled (build, level) pairs, each of the anchor-level map, the +2 offer, the −2
   offer, Respite and each phase-1 type is the top-ranked offer in at least 15% of the sets in which it appears.
   Otherwise the offer is dominated and the generator or the pricing is wrong.
3. **Exploits are not strategies.** The `lowball`, `resting` and `abandoner` bots must each win no more than 10 points
   above the `anchor` bot.
4. **Pacing, restated.** For the `anchor` bot the old check holds: the median character level after map _n_ is within ±4
   of _n_. For `greedy`, the median gap stays within ±6, and no run ends with the character more than 10 levels under
   the monsters it faces at the finish.
5. **Attrition is felt but not fatal.** For the `anchor` bot the median life fraction on entering a map is between
   60% and 90%, and no more than 10% of runs enter three maps in a row below 40% life. There is no mercy floor, so
   this is the guard against a spiral.
6. **Crescendo is used.** In `greedy` runs that take a Crescendo map, at least 20% of them are abandoned or end at
   step 8 or higher, and at least 30% are cleared below step 5. If almost nobody abandons, or almost nobody
   cares about the clock, the step size is wrong.
7. **Determinism.** Replaying the same run seed with the same strategy and abandon timings twice gives identical
   event hashes. Because every offer now has its own layout seed, hashes cannot match the old code's; instead a golden
   test runs `runMap` on a hand-built `MapPlan` with a fixed seed, which the offer refactor must not change.
8. **XP table.** Re-measure and rewrite `xpTable.ts` with `--write-xp`, since expected XP per level now depends on the
   offsets and the skipped levels.

---

## 11. Milestones

Each milestone ends green on `npm run check` and `npm run build`, and with a bot run summarised in `docs/PROGRESS.md`.
Saves break: `SAVE_VERSION` goes up by one in R0 and again whenever `RunState` changes. **No work starts until the
passive-tree work stream has landed.**

| #      | Milestone                       | Work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Acceptance                                                                                                                                         |
| ------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R0** | **Three offers**                | `RunState`: `offers`, `MapOffer`; drop `nextThemes`, `mapEdits`, `noMapEdits`; `rollThemes` → `rollOffers` (three themes, offset 0, today's affixes). `run.map` stays the counter. Per-offer layout seeds. Consumers: `run.ts` (`affixesFor`, `planFor`, `finishMap`), `mapPlan.ts` (`makeMapPlan` takes an offer), `controller.ts` (`startMap`, and the showcase launcher that reads `nextThemes[0]`), `Camp.tsx`, `preview.ts`, `bot.ts:120` and `bot.ts:585`, `botCraft.ts`, `craft.ts` (Chalk by offer id), `randomBot.ts`, `gallery.ts` (`galleryRun`), and `MapRecord` (add `areaLevel`). | Same difficulty as today, three choices. Save version bumped. Offer set is identical after reload. The bot completes runs. IP scan passes.         |
| **R1** | **Carry-over**                  | `Vitals`; `MapResult` gains mana, ES and flask fractions; `createWorld` takes a `start`; `restAtCamp` (10 s of recovery from the same numbers the sim uses); HUD and camp readouts; update the bot's camp to read vitals; first balance pass on `CAMP_REST_SECONDS`.                                                                                                                                                                                                                                                                                                                            | Acceptance 5. Reload keeps vitals. Gear changes at camp cannot heal. A regen-heavy test build recovers more than a regen-less one.                 |
| **R2** | **Abandon**                     | `MapStatus` gains `abandoned`; `finishMap` branch (counter advances, no clear rewards); `World` abandon request and 5 s timer; `AbandonPolicy`; the button (with confirm) and cancel; unavailable on gate levels and levels 1–4; `MapRecord`; summary note; bot policy.                                                                                                                                                                                                                                                                                                                         | Kept/lost table (7.2) is tested. Death during the timer ends the run. A plain-map `timeout` still reads as death. Abandon at map 5 loses the pick. |
| **R3** | **Level offsets**               | Split `map` from `areaLevel` in `makeMapPlan` (rooms, resist tier, end kind stay on the counter); offsets in `rollOffers` with the 60/20/20 split and the hurt weighting; clamp to 1–100; per-offer preview areaLevel; `--strategy` flag; re-measure pacing and rewrite `xpTable.ts`.                                                                                                                                                                                                                                                                                                           | Acceptance 3 (`lowball`), 4 and 8. Tests: a +2 offer at map 99 clamps; rooms and resist tier follow the counter; XP follows the offer level.       |
| **R4** | **Affixes**                     | Audit `src/mods/types.ts` against the table in 6.2 and fix the cost column; add the `D` rows first, then `F` and `P`; strength bands; count table; contradiction pairs; reward currencies (`experience`, `currency`); the reference table in `docs/coverage/`; `affixThreat` and `scoreTheme` aware of all new affixes; Chalk options by strength.                                                                                                                                                                                                                                              | Acceptance 2 for affixes. `ip.test.ts` passes. Every affix has a threat-model entry and a unit test of the mod it applies.                         |
| **R5** | **Crescendo, Quarry, Stampede** | Offer `type`; the `surge` number in the sim and its two reads; the loot hook; the Crescendo HUD and 330 s limit; population recipes for Quarry and Stampede; type text on cards; type start levels; no types on gate levels; bot knowledge of each.                                                                                                                                                                                                                                                                                                                                             | Acceptance 6. The Crescendo preview estimate is within 25% of the measured step at the end of the map. Quarry maps always have 3 champions.        |
| **R6** | **Respite and legibility**      | The `respite` offer (weights, the always-offered-below-40%-life rule, no gate levels); verdict chips; auto-continue rules (10.2); final balance pass on pricing; DESIGN edits (section 13); Appendix A.                                                                                                                                                                                                                                                                                                                                                                                         | Acceptance 3 (`resting`) and 1–8 all hold together. A browser play-through of 10 maps with no console errors.                                      |
| **R7** | **Phase-2 types (stretch)**     | Holdout, Collapse, Crawl, one at a time, each with its own bot knowledge and a measured balance pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Per type: acceptance 2 and 6 equivalents.                                                                                                          |

Order and dependencies: R0 first. R1, R2 and R3 are independent of each other once R0 is done, and R3 is the smallest of
them. R4 can start after R0. R5 needs R2 (the forced exit uses abandon) and R4's pricing. R6 is last because it needs
everything for the balance pass.

---

## 12. Risks

1. **The anchor is always right.** If a build can always afford the anchor, the other offers are decoration. The
   non-domination check (acceptance 2) is the guard, and the levers are pricing: affix rewards, the offset's natural
   scaling (and `OFFSET_PREMIUM`), type rewards.
2. **The lower offer is a dead pick.** It pays less by design. It only earns its place if recovery matters enough that a
   build in trouble wants it, so acceptance 2 and the hurt weighting (4.2) are tested together. If it fails, the lever is
   how fast flasks refill on kills, not a bonus for easy maps.
3. **Attrition spirals, with no mercy floor.** A build with weak recovery can start each map worse than the last. The
   guards are the −2 offer, the always-offered Respite below 40% life, and acceptance 5. R1 ends with its own bot run.
   If the spiral shows in the numbers, the first levers are `CAMP_REST_SECONDS` and the Respite threshold, then a floor
   (the user declined one for now).
4. **Abandon trivialises death.** The escape timer, the lost clear rewards and the skipped level are the costs. If bots
   that abandon early still beat the anchor bot (acceptance 3), lengthen the timer or cut the XP kept.
5. **Pricing is a guess.** The reward ≈ half the pressure rule comes from the existing 11 affixes. With 30 or so
   affixes and four reward currencies it needs measuring; R4 and R6 budget a pass each.
6. **Reload is a free undo.** The save is written at camp, so reloading mid-map restarts the map with its vitals and
   its offers intact. That was acceptable when a map could only be cleared or lost; with abandon and carry-over it undoes
   a bad map entirely. The user accepted this for now. A later fix is to write the save at map start with an "in map" flag
   and treat a reload as an abandon.
7. **The pacing model shifts.** The XP table assumes one path. Offsets, abandons and Respites move total XP a little.
   R3 re-measures, and acceptance 4 is the check.
8. **A set can be all hard.** The anchor can have affixes and a type, so three bad offers are possible. The lower
   offer, Respite and auto-continue's pause rule are the answers; if play shows too many bad sets, add a guarantee that at
   least one offer has no type.
9. **Scope.** R0 touches the run model and every consumer of `nextThemes`. R0 is deliberately a pure refactor with
   no change in difficulty so the churn can be reviewed on its own.

---

## 13. DESIGN.md edits on approval

Not made yet. `docs/DESIGN.md` and `src/run/run.ts` are being changed by other in-flight work (the passive-tree
work), so these edits wait until that lands, and the "read from the code" table in section 2 should be re-checked
against `run.ts` at that point. When work starts:

- **§2 decisions log:** amend **D9** (speed controls and Abandon); add **D16** (route choice: three offers, level
  offsets, carry-over, Respite, Abandon). D15 stays as it is.
- **§2.1 divergences:** add rows for _Map choice_ (three offers per level), _Mid-map input_ (Abandon),
  _Resource carry-over_ (life, mana, ES and flask charges; 10 s of recovery at camp), and _Area level_ (±2 around the
  map number); amend _Mid-map saving_ with the reload note.
- **§5.1 flow** and **§5.3 schedule:** `[Camp → (Map | Respite)]×100`; three offers; the area level of a map is the map
  number plus its offset; the "on a clear" rules in 5.2 of this file.
- **§5.4 pacing acceptance:** unchanged for the anchor bot, restated for a route-reading bot (10.3, criterion 4).
- **§5.5 saving:** `SAVE_VERSION` bumped.
- **§12.6 themes:** point to this file for the offer model; the themes themselves are unchanged.
- **Appendix A:** record the decisions in sections 4.1 (one set per level), 4.2 (gate-level rules, hurt weighting,
  Respite rule), 5.2 (what keys to what), 7.1 (5 s timer, where abandon is unavailable), 8.2 (the 10 s rest) and 9.1.
- **CLAUDE.md:** note the new doc and its milestones under "Status".

---

## 14. What the user decided, and what is still open

### 14.1 Decided (2026-10-07)

| Topic                        | Decision                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Push                         | Dropped. The level of the map taken never affects the next set. The counter advances by 1 per level; the run stays 100 maps.                                                                                                                                                                                                                     |
| Offsets                      | −2, 0 and +2 around the counter. Some sets have an off-level offer.                                                                                                                                                                                                                                                                              |
| Purpose of the lower offer   | To recover life and flasks when nearly depleted.                                                                                                                                                                                                                                                                                                 |
| Purpose of the higher offer  | XP and items; strong regeneration offsets the cost.                                                                                                                                                                                                                                                                                              |
| Abandon and Respite          | Both advance the counter. No abandoning mini-boss maps.                                                                                                                                                                                                                                                                                          |
| Gate-level offers            | Not pinned to the exact level: normal map affixes plus the boss.                                                                                                                                                                                                                                                                                 |
| Rooms, resist tier, passives | Keyed to the counter.                                                                                                                                                                                                                                                                                                                            |
| The anchor                   | Can carry affixes and a type.                                                                                                                                                                                                                                                                                                                    |
| Camp restore                 | Each resource recovers what it would in 10 s of sitting still. Nothing else, since camp follows every level.                                                                                                                                                                                                                                     |
| Mercy floor                  | None.                                                                                                                                                                                                                                                                                                                                            |
| Abandon timing               | 5 s escape timer with a confirm; loot already picked up is kept.                                                                                                                                                                                                                                                                                 |
| Reload mid-map               | Left as is.                                                                                                                                                                                                                                                                                                                                      |
| Everything else              | The plan's defaults: phase-1 types Crescendo, Quarry and Stampede; heavier types pay more; affixes from level 5 at half strength; four reward currencies; Chalk kept; auto-continue takes the anchor and pauses under 50%; verdict chip; keep the win-rate target and run length; revise this doc before code; wait for the tree work; R0 first. |

### 14.2 Interpretations to confirm

These are gaps in the answers that I filled in. Say which are wrong.

1. **Gate levels.** "Normal map affixes + boss" is read as: offers on a gate level roll their offsets and affixes like any
   other, the boss is in all three, and, to keep the boss map clean, they cannot be typed, be a Respite or be abandoned.
2. **Abandon on levels 1–4** is also unavailable, because those levels end with the first skill-gem picks.
3. **Abandoned and Respite levels earn no clear rewards**, so abandoning a 5th map loses its reward pick.
4. **Respite is always offered when life is below 40%**, and otherwise only when something is below 90%. It is not a
   mercy floor (it costs a level), but it is a safety net you did not ask for.
5. **The offset split is 60% / 20% / 20%** per non-anchor slot, with the −2 weight doubled when life or flasks are under
   60%. At map 100 a +2 clamps.
6. **Energy shield carries** and recovers with the sim's own recharge rules. "Restore all of them" is read as life, mana
   and ES; flasks recover only through any time-based charge gain they have, and otherwise through kills.
7. **Auto-continue also pauses when the anchor has a type**, since the anchor can now be a Crescendo map.
8. **A Crescendo pull-out at 330 s counts as an abandon** (the counter advances, no clear rewards).

### 14.3 Still open

| #   | Question                                                           | Default                                                   |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| 1   | Should offsets widen later in the run (±3 from map 50)?            | No. ±2 throughout; revisit after R3's measurements.       |
| 2   | Should a set be guaranteed at least one offer with no type?        | No. Add it only if play shows too many bad sets (risk 8). |
| 3   | Crawl's rule for the counter (three segments, one level or three?) | One level. Settled in R7.                                 |
