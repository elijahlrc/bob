# Bob — Design Document (first pass)

Status: **draft for review** · Written 2026-10-06, revised 2026-10-06 · Owner: the user; implementer: Claude (goal mode)

**Bob** is the game's code name. The repository folder is still `Auto`.

This document is the single source of truth for the first playable version. It is written so that an implementer
with **no other context** (no chat history, no memories) can build the game from it. Where this doc gives a table
of numbers, **the table is authoritative**; every number is a v1 value we chose, and anything marked _tunable_ is
expected to change during balancing.

---

## 1. Vision

An in-browser, top-down 2D auto-battler built on the core numerical rules of Path of Exile 1 (PoE). The player
builds a single character between maps — passive tree, attributes, items with random affixes, skill gems with
supports, auras, flasks — and then **watches** that character walk on its own through a randomly generated, linear
labyrinth full of skeletons. The run is a roguelike: **100 maps** of rising difficulty that take the character from
**level 1 to level 100**, ending in a boss. Death ends the run.

The appeal is the same as theorycrafting in Path of Building, but with the numbers playing out on screen: you see your
crits, ignites, leech and resistances matter.

---

## 2. Decisions log

These were decided with the user before this doc was written. Do not re-open them during implementation.

| #   | Topic                | Decision                                                                                                                                                                                                                                                                               |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Game shape           | One character walks through maps. After each map, update the build with items and XP gained.                                                                                                                                                                                           |
| D2  | Skills               | A limited set of skill gems (section 11.5). _(Superseded 2026-10-07: the coverage plan, `docs/COVERAGE.md`, targets 90% of 3.9.0's gems and uniques.)_                                                                                                                                 |
| D3  | Fidelity             | Aspire to real PoE mechanics; diverge freely when something is hard or a trade-off favours simplicity. Divergences are listed in 2.1.                                                                                                                                                  |
| D4  | IP                   | Our own names and our own art. The PoE wiki and Path of Building data may be consulted for mechanics and numbers; never copy code, names, flavour text or art (section 3; revised with the user 2026-10-07).                                                                           |
| D5  | v1 mechanics         | Passive tree (small/notable/keystone), attributes, life/mana/ES, armour/evasion/block/resists, crit, conversion, increased vs more, ignite/shock/chill/freeze/bleed/poison, **stun**, item bases + affixes, monster level scaling, **flasks, auras + mana reservation, unique items**. |
| D6  | Out of scope         | Ascendancies, jewels of any kind, influence. _(Charges, curses and crafting/currency were brought in by the depth expansion, `docs/EXPANSION.md`; minions, totems, traps, mines and brands by the coverage plan, `docs/COVERAGE.md`, 2026-10-07.)_                                     |
| D7  | Reference version    | PoE 1 **patch 3.9.0** (December 2019), frozen (section 4). Pinned with the user 2026-10-07.                                                                                                                                                                                            |
| D8  | Meta structure       | Run-based roguelike.                                                                                                                                                                                                                                                                   |
| D9  | Player input in maps | None: pure auto-battler. Speed controls only. Manual flask use is a future option, so keep flask triggering behind a policy interface.                                                                                                                                                 |
| D10 | Enemies              | Skeletons are the core family, with elemental variants and normal/magic/rare/unique tiers carrying monster mods. _(Undead and crypt-dwelling factions were added by the depth expansion, `docs/EXPANSION.md`.)_                                                                        |
| D11 | View & maps          | Top-down. Each map is a linear, randomly generated labyrinth the character walks through, meeting enemies on the way.                                                                                                                                                                  |
| D12 | Data                 | We author and maintain all game data ourselves. We do not pull from Path of Building or GGG data exports.                                                                                                                                                                              |
| D13 | Code name            | **Bob.**                                                                                                                                                                                                                                                                               |
| D14 | Passive tree size    | **Full size**, comparable to PoE's (~1,300 nodes, section 9).                                                                                                                                                                                                                          |
| D15 | Run length           | **100 maps, character level 1 → 100.** Map _n_ has area level _n_, and the character should be about level _n_ (section 5).                                                                                                                                                            |

### 2.1 Divergences from PoE (decided here)

| Area                | PoE                              | Bob v1                                                                                                                                                                                   |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket colours      | R/G/B sockets tied to attributes | **No colours.** Gems still have attribute requirements.                                                                                                                                  |
| Links               | Random link groups               | **All sockets on an item are linked.** Socket _count_ is still random.                                                                                                                   |
| Gem XP              | Gems earn XP separately          | **Gems auto-level** to the highest level the character level and attributes allow (section 11.5).                                                                                        |
| Respec              | Orbs of Regret / respec points   | Earn **refund points** (1 per completed map).                                                                                                                                            |
| Evasion             | Entropy-based for players        | Plain random roll for everyone.                                                                                                                                                          |
| Curses, dodge       | Present                          | No dodge. Curses arrive as hexes in the depth expansion (X8).                                                                                                                            |
| Stun lock           | Possible                         | After a stun ends, that entity cannot be stunned again for 0.5 s.                                                                                                                        |
| Area level range    | Tops out around 84–86            | Area and monster levels run 1–100, one per map.                                                                                                                                          |
| Crafting / currency | Many orbs                        | Items come from drops and the between-map reward choice. The depth expansion adds currencies that let the player choose what changes on an item (`docs/EXPANSION.md` section 8).         |
| Multiple skills     | Player presses many skills       | One **primary skill**, auto-used. Auras are always on. A free default attack is used when out of mana. The depth expansion adds triggered skills that follow the reference game's rules. |
| Acts / town         | Story acts, town hub             | A camp screen between maps.                                                                                                                                                              |
| Resist penalty      | −30%/−60% after acts             | 0 / −30 / −60 by run stage (section 5).                                                                                                                                                  |
| Mid-map saving      | n/a                              | Saves happen only at camp. Reloading mid-map restarts that map from the same seed.                                                                                                       |
| Monster stats       | Per-level tables                 | Bot-tuned curves for life, damage, accuracy, evasion and armour (section 12.1). Monster accuracy is higher than 3.9's at the same level.                                                 |
| Attack damage       | Weapons only                     | Characters also add flat physical damage per level to attacks, and one-handed weapons deal 1.6× (`ATTACK_LEVEL_*`, `ONE_HAND_DAMAGE`): tuned numbers with no 3.9 counterpart.            |
| Gem quality         | Quality currencies               | Not modelled: gems auto-level and there are no quality orbs.                                                                                                                             |
| Resist floor        | None                             | Effective resistance is floored at −200%.                                                                                                                                                |
| Critical rolls      | Once per skill use               | Once per target hit (the same expected value, a different variance).                                                                                                                     |
| Block               | Blocked hits keep on-hit effects | A blocked hit does nothing else.                                                                                                                                                         |
| Damage taken        | Shock sums with other increases  | Shock multiplies separately from "increased damage taken".                                                                                                                               |
| Flasks              | End at full life or mana         | A recovery flask runs its full time. The bot never drinks a second life flask while one is active.                                                                                       |
| Curses              | Self-cast, 9–11 s                | Hexes last 6 s, are applied on hit, and use Bob's own numbers (close to 3.9's mid tier). Self-cast curses come with C4.                                                                  |
| Reservation         | Support multipliers apply        | Support cost multipliers do not raise an aura's reservation (every socket is linked).                                                                                                    |
| Trigger thresholds  | Fixed damage by gem level        | Wounded Retort fires after a share of maximum life, so it scales with Bob's life.                                                                                                        |
| Leech to ES         | 2% and 10% of max ES             | Uses the life rates.                                                                                                                                                                     |

---

## 3. IP policy (hard rules)

_Revised with the user on 2026-10-07. The earlier version of rules 1–2 was written without the user's input and was
stricter than they intended._

1. **No code** from Path of Building, PoE tools, or any other project is copied or translated. Formulas are
   implemented by us in our own code.
2. **Data may be consulted.** The PoE wiki (including its Cargo API) and Path of Building's data files may be read for
   mechanics and numbers, and scripts may use them to draft entries in our own data format, which are then reviewed
   by hand. Reference data lives under `docs/coverage/` or `scripts/`, never in `src/`, and the game never loads it
   at runtime. Record where a number came from when it follows the reference (section 4).
3. **No names or text.** Every player-visible string in `src/` — classes, gems, notables, keystones, uniques, item
   bases, affix names, flavour text — is our own invention. A name merely _describing_ a mechanic ("Fire Resistance",
   "Critical Strike Chance", "Ignite") is fine. A PoE proper name ("Resolute Technique", "Kaom's Heart", "Marauder",
   "Wraeclast") is not.
4. **No art or audio** from PoE. v1 art is generated programmatically (section 14.5).
5. This design doc may use PoE names **in parentheses** to explain which mechanic is meant. Data files may not.
6. A test (`src/data/ip.test.ts`) scans all string values in `src/data` against a deny-list of known PoE proper nouns
   in `src/data/ipDenyList.ts`. The list is ours and is not exhaustive; it catches slips.

---

## 4. Reference ruleset

We model **PoE 1 patch 3.9.0** (December 2019, pinned 2026-10-07; earlier drafts said "roughly the 3.0–3.9 era"). It
has every mechanic in D5 (poison and bleed, flasks, auras with percentage reservation, uniques, energy shield, block)
and predates cluster jewels and the later ailment and defence reworks. The coverage plan's denominator is everything
that existed in 3.9.0 (`docs/COVERAGE.md`).

Mechanics should match 3.9.0 unless a divergence is listed in 2.1. Bob's own scale (100 maps, levels 1–100) means
many numbers are retuned rather than copied. When a constant is changed to follow 3.9.0, update this doc and record
the source (a wiki page revision from the 3.9 period, or the Path of Building data of that era). **Never** change a
constant to match a _remembered_ PoE number.

---

## 5. Run structure

### 5.1 Flow

```
Title → Class select → [Camp → Map]×100 → Victory
                         ↑        │
                         └─ (map cleared)
                       Death in any map → Run summary → Title
```

- **Camp** (DOM UI): passive tree, equipment and inventory, gem sockets, character sheet, a reward pick (1 of 3, when
  earned), and the next-map choice (1 of 2). The game saves on entering camp.
- **Map** (Phaser): the character auto-walks the labyrinth. A map is cleared when the boss or final pack in the last
  room is dead **and** the character reaches the exit. Then it returns to camp.

### 5.2 Classes

There are six classes. Classes differ only in starting attributes, starting gear, and where they start on the tree. A character starts with
no gems (changed 2026-10-07): it fights with its weapon, and the first skill gems come as a pick of three after each
of maps 1 to 4 (EXPANSION section 8 and `SKILL_REWARD_MAPS`).

| Class (ours) | PoE analogue | Str | Dex | Int | Start weapon      | Start skill   | Start support       |
| ------------ | ------------ | --- | --- | --- | ----------------- | ------------- | ------------------- |
| Vanguard     | Marauder     | 32  | 14  | 14  | 2H mace           | Crushing Blow | Brute Force         |
| Strider      | Ranger       | 14  | 32  | 14  | Bow (+ quiver)    | Split Volley  | Swift Assault       |
| Mystic       | Witch        | 14  | 14  | 32  | Wand              | Flame Bolt    | Echoing Cast        |
| Reaver       | Duelist      | 23  | 23  | 14  | 1H sword + shield | Reaping Arc   | Brute Force         |
| Zealot       | Templar      | 23  | 14  | 23  | Sceptre + shield  | Arc Chain     | Channelled Elements |
| Shade        | Shadow       | 14  | 23  | 23  | Dagger + dagger   | Venom Cut     | Swift Assault       |

Every class also starts with: a 2-socket body armour (holding the start skill and support), one life flask and one
mana flask.

### 5.3 Map schedule (100 maps)

| Map _n_                     | Rule                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| Area level                  | `n` (monster level = n)                                                                                |
| Rooms on the main path      | `4 + floor(n / 25)`, giving 4–8                                                                        |
| Side branches               | Maps 1–4: 0. Otherwise a random 0–2.                                                                   |
| Resist penalty              | Maps 1–30: 0. Maps 31–60: −30%. Maps 61–100: −60%.                                                     |
| End room                    | `n` = 100: **unique boss**. `n` divisible by 10: **mini-boss**. Otherwise: rare pack.                  |
| Target duration at 1× speed | 90–120 s (measured by the headless bot). A full run is about 3 hours at 1×, or about 25 minutes at 8×. |

- A mini-boss is a rare monster with 4 mods and ×1.5 life over a normal rare.
- **Passive points:**
  - 1 per character level (99 in total).
  - **+3 bonus after clearing each of maps 10, 20, …, 80.**
  - That makes 123 points in total, the same as PoE.
- **Refund points:** +1 per cleared map. Refunding a node costs 1 point and only works if the tree stays connected.
- **Reward pick** (1 of 3): after every 5th map and after every mini-boss.
- **Next-map choice:** two options with the same area level but different **themes** (section 12.6).
- **Auto-continue:** the camp has a toggle, on by default. When on, if there are no unspent passive points, no pending
  reward pick and no new unique or rare item, the next map starts with the first theme after a 2-second countdown the
  player can cancel. This keeps 100 maps from becoming 100 forced menu visits.

### 5.4 Experience and pacing

The pacing target: **character level ≈ map number** throughout. The character reaches level 100 during maps 97–100.
The XP numbers below are derived from that target, not invented separately.

- **Monster XP:** `xp = baseXp(monLevel) · rarityXpMult · levelPenalty`, where `baseXp(m) = round(6 + 1.6 · m^1.55)`.
  _Tunable._
- **Level penalty:**
  - `safe = 3 + floor(playerLevel / 16)`;
  - `excess = max(0, |playerLevel − monLevel| − safe)`;
  - `levelPenalty = max(0.05, 1 − 0.12 · excess)`.
- **Level curve:** `xpToNext(L) = round(expectedMapXp(L) · k(L))`.
  - `expectedMapXp(L)` = the mean XP for clearing a map at area level L, measured by the headless bot over 30 seeds
    and stored as a table in `src/data/xpTable.ts`.
  - Until the bot exists, use the estimate `monstersPerMap(L) · baseXp(L) · 1.6`, where
    `monstersPerMap = rooms · 5.5`.
  - `k(L) = 1.0` for L < 90, rising linearly to 1.3 at L = 99. This makes the last levels feel earned while still
    reaching 100 by map 100.
- **Max level 100.** XP past 100 is discarded.
- Death has no XP penalty, because the run ends.
- **Acceptance:** with the bot, the median character level after map _n_ is within ±4 of _n_ for every _n_ the bot
  reaches.

### 5.5 Saving

- `localStorage` key `bob.save`. The value is JSON `{ version: 1, run: RunState }`.
- The game saves on entering camp and on any camp change.
- On load, if the version is unknown, show "save incompatible" and offer a new run. There are no migrations: saves may
  break at any milestone, and `SAVE_VERSION` is bumped whenever `RunState` or the tree changes.

---

## 6. Character stats and formulas

All formulas live in `src/calc/` and are shared by the calc engine and the sim. World distance unit = **tiles**
(1 tile = 32 px when rendered). Time is in seconds.

### 6.1 Base character stats

| Stat                     | Value                                 | Notes                               |
| ------------------------ | ------------------------------------- | ----------------------------------- |
| Base life                | `38 + 12 · level`                     | before attributes                   |
| Base mana                | `34 + 6 · level`                      |                                     |
| Base evasion             | `53 + 3 · level`                      |                                     |
| Base accuracy            | `2 · level`                           | plus dexterity bonus                |
| Base mana regen          | 1.75% of max mana per second          |                                     |
| Base crit multiplier     | 150%                                  |                                     |
| Max resistance (default) | 75% each element; chaos 75%           | can be raised by mods, hard cap 90% |
| Base movement speed      | 4.0 tiles/s                           | _tunable_                           |
| Ailment threshold        | max life (players: max life + max ES) |                                     |
| Stun threshold           | max life                              | modified by stun threshold mods     |

### 6.2 Attributes

| Attribute | Per 10 points                                   |
| --------- | ----------------------------------------------- |
| Strength  | +5 max life; 2% increased melee physical damage |
| Dexterity | +20 accuracy; 2% increased evasion rating       |
| Intellect | +5 max mana; 2% increased max energy shield     |

These are computed per point (not floored to tens): +0.5 life per Str, and so on.

### 6.3 Defences

| Mechanic      | Formula / rule                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Hit chance    | `clamp(1.15 · acc / (acc + (eva / 4)^0.8), 0.05, 1.0)`. Spells always hit. A critical strike by an attack needs a second hit-chance roll. |
| Armour        | Physical hit reduction = `A / (A + 10 · D)`, where D = incoming physical damage of that hit; cap 90%.                                     |
| Resistances   | Elemental/chaos damage × `(1 − res)`. Effective res = min(res, maxRes) − penetration; floor −200%.                                        |
| Block         | Separate attack-block and spell-block chances, each capped at 75%. A blocked hit deals 0 and applies no ailments.                         |
| Energy shield | Takes damage before life. **Chaos damage bypasses ES.** Recharge starts 2.0 s after the last damage taken, at 20% of max ES per second.   |
| Damage taken  | "Increased damage taken" (e.g. shock) multiplies after mitigation.                                                                        |
| Low life      | Life ≤ 35% of max. Full life: life = max.                                                                                                 |

### 6.4 Recovery

| Mechanic     | Rule                                                                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Life regen   | (flat/s + % of max life/s) × (1 + increased life regeneration)                                                                                                                                                                                                                                          |
| Mana regen   | (1.75% of max mana + flat) × (1 + increased mana regen)                                                                                                                                                                                                                                                 |
| Leech        | Each hit creates a leech instance of `damageDealt · leech%`, recovered at **2% of max life per second** per instance. One instance holds at most **10% of max life**. Total leech rate cap: **20% of max life per second**. Instances end when finished or at full life. Mana leech works the same way. |
| Life on hit  | Flat life gained per hit (per target hit).                                                                                                                                                                                                                                                              |
| Life on kill | Flat or % of max life.                                                                                                                                                                                                                                                                                  |

### 6.5 Damage pipeline (hits)

The order is normative. Each step operates on **damage chunks**: `{ type, min, max, ancestry: Set<DamageType> }`.
Damage types are `physical`, `lightning`, `cold`, `fire`, `chaos`.

1. **Base damage**
   - Attack: the weapon's local damage (after local item mods) per type. Plus global "adds X–Y to attacks" ×
     the skill's _added damage effectiveness_.
   - Spell: the gem's base damage at its level per type. Plus global "adds X–Y to spells" × effectiveness.
   - Dual wield: each attack uses one weapon, alternating main hand and off hand.
2. **Skill base multiplier.** The gem's "deals N% of base damage" applies as a more multiplier to attack base damage.
3. **Conversion and gain.** Process source types in the order physical → lightning → cold → fire → chaos.
   - Skill and support conversion applies first. Other conversion fills what is left, scaled down proportionally if
     the total exceeds 100%.
   - "Gain X% of T as extra U" adds a new chunk computed from the **pre-conversion** amount of T. The original stays.
   - Converted or gained chunks inherit the source chunk's ancestry plus their new type.
   - Conversion never goes backwards in the order.
4. **Scaling.** Each chunk is multiplied by `(1 + Σ increased) · Π(1 + more)`, using every mod whose damage-type
   filter intersects the chunk's ancestry and whose tag and condition filters match the skill use.
5. **Roll.** Each chunk rolls uniformly in [min, max] independently.
6. **Hit check** (attacks only), then **block check**.
7. **Crit.** `critChance = clamp(base · (1 + Σinc) · Π more, 0, 0.95)`. Attack base = weapon crit; spell base =
   gem crit. On a crit, all chunks × critMultiplier.
8. **Mitigation** per chunk (armour for physical, resistances for the rest), then increased damage taken (shock and
   so on).
9. **Apply**: to ES then life (chaos bypasses ES), then leech, on-hit effects, ailments (6.6) and on-kill effects.

### 6.6 Ailments

Ailment damage is based on the hit's **base damage** (step 3, before scaling), calculated separately from the hit: only
generic mods, damage-type mods of the type the ailment deals (ignite fire, bleed physical, poison chaos, whatever type the hit was), `dot` mods and the ailment's own tag apply; a condition on the target never does. Attack, spell, melee,
projectile, area and weapon mods never reach it, and neither does the critical strike multiplier. In the table, "H" is
that damage of the relevant types. It is then mitigated by the target's resistance to the ailment's damage type. Shock,
chill and freeze use the hit's damage with all its mods (the damage dealt). Crits always apply ignite,
shock and freeze if the hit dealt the relevant element. Crits apply bleed and poison only through their normal
chance.

Ailments inflicted by a critical strike carry a fixed **150%**, whatever the critical strike multiplier. Penetration does not apply to damage over time.

`mag(r, cap, e) = min(cap, 50 · r^0.4 · (1 + e))`, where `r = H_relevant / ailmentThreshold` and `e` is the increased ailment effect (it counts before the cap).

| Ailment | Trigger                                    | Effect                                                                                                      | Duration                                  | Stacking                              |
| ------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------- |
| Ignite  | chance on hits dealing fire                | fire DoT of **50% of H_fire per second**                                                                    | 4 s                                       | only the highest-DPS one deals damage |
| Bleed   | chance on **attack** hits dealing physical | physical DoT of **70% of H_phys per second** (10% when a monster bleeds you), **×3 while the target moves** | 5 s                                       | only the highest one                  |
| Poison  | chance on hits dealing physical or chaos   | chaos DoT of **20% of (H_phys + H_chaos) per second**                                                       | 2 s                                       | **unlimited stacks**                  |
| Shock   | chance on hits dealing lightning           | increased damage taken = `mag(r, 50%)`; not applied if < 5%                                                 | 2 s                                       | highest effect                        |
| Chill   | **every** hit dealing cold                 | slow (action and move speed) = `mag(r, 30%)`; not applied if < 5%                                           | 2 s                                       | highest effect                        |
| Freeze  | chance on hits dealing cold                | cannot act or move; also chilled                                                                            | `min(3, 6 · r)` s; not applied if < 0.3 s | longest remaining                     |

The duration modifiers ("increased ignite duration" and so on) apply. Players suffer ailments from monsters with the
same rules.

### 6.6a Stun

Stun is not an ailment: it does not need a "chance to" stat, and ailment-effect mods don't scale it.

| Rule                | Value                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stun damage `S`     | Post-mitigation hit damage. Melee: physical counts 125%, other types 100%. Not melee: physical 100%, other types 75%. Attacks deal × (1 + increased stun damage).                             |
| Stun chance         | `clamp(2 · S / effectiveThreshold, 0, 1)`. No stun if the chance is at most 20%.                                                                                                              |
| Effective threshold | `stunThreshold · (1 + Σinc stun threshold) · (1 − Σ reduced enemy stun threshold from the attacker)`                                                                                          |
| Duration            | `0.35 s · (1 + Σinc stun duration on enemies)` (attacker side) · `(1 − Σ reduced stun duration on you)` (defender side)                                                                       |
| Effect              | Cancels the current action (wind-up lost) and stops movement for the duration                                                                                                                 |
| Avoid stun          | The defender's `% chance to avoid being stunned` is rolled after a stun succeeds. While the defender has energy shield, half of all stuns are also ignored (not with Eldritch Battery rules). |
| Grace period        | After a stun ends, that entity cannot be stunned again for **0.5 s** (anti stun-lock)                                                                                                         |
| Bosses              | The unique boss has ×4 stun threshold. Mini-bosses have ×2.                                                                                                                                   |
| Blocked hits        | Deal 0 damage, so they never stun.                                                                                                                                                            |

The player can be stunned by monsters. Brutes are the main stun threat (12.3).

### 6.7 Speeds and costs

| Thing          | Formula                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attack rate    | `weaponAPS · (1 + Σinc attack speed) · Π more`. Dual wield: alternating weapons, 10% more attack speed, 20% more physical attack damage and 15% additional chance to block attacks. |
| Cast rate      | `(1 / castTime) · (1 + Σinc cast speed) · Π more`                                                                                                                                   |
| Action slow    | Chill multiplies action speed by `(1 − slow)`.                                                                                                                                      |
| Mana cost      | `gemBaseCost(level) · Π supportCostMultipliers`, rounded. If mana < cost, use the default attack instead.                                                                           |
| Default attack | Attack with the equipped weapon (or fists: 2–6 physical, 1.2 APS, 0% crit), 100% base damage, no cost, no supports.                                                                 |

### 6.8 Auras and reservation

- An aura gem in any socket is active while equipped. It reserves a percentage of **unreserved max mana**:
  `reservation = baseReservation · (1 − Σ reduced reservation)`, rounded up.
- Auras are activated in socket order. If not enough mana remains, that aura is inactive (the UI shows a warning).
- Auras affect only the player in v1, since there are no allies. Monster "auras" (from mods) affect the player within
  their radius.

### 6.9 Flasks

- Five flask slots. Every flask gains charges on kill: normal 1, magic 2, rare 5, unique 10 (× increased charges
  gained).
- **Life and mana flasks** recover their amount evenly over their duration. A new use while one is active is queued and
  starts when the previous one ends (max one queued).
- **Utility flasks** grant a buff for their duration. A utility flask cannot be re-used while active.
- Automatic use policy (`src/sim/flaskPolicy.ts`, replaceable later by manual input):
  - Life flask when life < 50% and no life recovery is active or queued.
  - Mana flask when mana < 2 × primary skill cost.
  - Utility flask when it is not active and (a rare or unique monster is within 8 tiles, or ≥ 5 monsters are within
    8 tiles).

---

## 7. Modifier model

This is the spine of the game. It must be spec'd tightly and implemented first.

### 7.1 Types

```ts
type ModKind = 'base' | 'inc' | 'more' | 'flag' | 'override';
type DamageType = 'physical' | 'lightning' | 'cold' | 'fire' | 'chaos';

type Mod = {
  stat: StatId; // e.g. 'damage', 'life', 'attackSpeed', 'critChance', 'resist.fire'
  kind: ModKind;
  value: number; // percent mods are stored as numbers (20 = 20%), flags as 1
  damageTypes?: DamageType[]; // for damage-related stats: which ancestry types this applies to
  tags?: SkillTag[]; // all must be present on the skill use: 'attack', 'spell', 'melee', 'projectile',
  // 'area', 'dot', 'ignite', 'bleed', 'poison', weapon tags 'sword', 'bow', ...
  condition?: Condition; // optional; see 7.3
  per?: { stat: StatId; div: number }; // value × floor(stat / div), e.g. 1% inc damage per 10 Str
  source: ModSource; // { kind: 'tree' | 'item' | 'gem' | 'aura' | 'flask' | 'base' | 'monster', id }
};
```

- **`base` mods add flat values.** Ranged flats (`adds 3–7 fire`) are two stats: `damage.min` and `damage.max`, each
  with `damageTypes`.
- **Local item mods** (`local: true` in item data) are applied when the item's own stats are built (weapon damage,
  APS and crit; armour, evasion and ES on that item). They never enter the character's mod list.
- **Text is generated from structured mods** using per-stat templates in `src/data/statText.ts`. We never parse text
  into mods.

### 7.2 Querying

`ModDB.sum(kind, stat, ctx)` and `ModDB.product(stat, ctx)` filter mods by:

- the `damageTypes` overlap with `ctx.ancestry`;
- `tags ⊆ ctx.tags`;
- the condition evaluating true in `ctx`.

The final stat value is `base · (1 + Σinc / 100) · Π(1 + more / 100)`.

Performance rule: on build change, mods are split into **static** mods (no condition) and **conditional** mods.
Static sums are cached per skill use; the sim re-evaluates only conditional mods per action.

### 7.3 Conditions (v1 set)

`onFullLife`, `onLowLife`, `killedRecently` (4 s), `critRecently` (4 s), `hitRecently` (4 s), `usedFlaskRecently`
(4 s), `flaskActive`, `dualWielding`, `holdingShield`, `targetIgnited`, `targetShocked`, `targetChilled`,
`targetFrozen`, `targetBleeding`, `targetPoisoned`, `targetStunned`, `targetRareOrUnique`, `targetNearby` (≤ 2 tiles),
`stunnedRecently` (4 s).

The calc engine evaluates conditions using a **configuration** (all false by default, with toggles in the character
sheet). The sim evaluates them live.

### 7.4 Keystone flags

Keystones are `flag` mods read by specific code paths: `neverCrit`, `alwaysHit`, `lifeIsOne`, `immuneChaos`,
`skillsCostLife`, `evasionToArmour`, `manaBeforeLife30`, `avatarOfFire`, `closeQuarters`, `instantLeechNoRegen`,
`overload`, `painConduit`, `cannotBeStunned`, `cannotEvade`, `prismaticBalance`, `regenToES`, `leechToES`,
`strongarm`, `woundDance`, `cruelAgony`, `manaBastion`, `arrowWeave` (section 9.4).

---

## 8. Calc engine and simulation

These are two consumers of the same formulas.

### 8.1 Calc engine (`src/calc/`)

`computeCharacter(build, config) → CharacterSheet`. It is pure and synchronous, and must compute in < 5 ms for a
full build. The sheet contains:

- Attributes; life, mana and ES (with reserved mana); armour, evasion and block; resistances (with caps and penalty);
  stun threshold and stun avoidance.
- For the primary skill:
  - average hit per damage type and total;
  - crit chance and multiplier, hit chance vs a reference monster;
  - uses per second;
  - stun chance vs the reference monster;
  - **hit DPS**, **ailment DPS** (ignite/bleed: chance-weighted, with only the strongest one applying; poison:
    stacking steady state), and **total DPS**.
- Effective HP against a reference monster's typical hit mix (physical/fire/cold/lightning at the area level).
- **Item compare:** `diff(sheetA, sheetB)` drives tooltip deltas (Δ DPS, Δ life, Δ ES, Δ resists, Δ EHP).

The reference monster is a normal Skeleton Warrior at the current area level.

### 8.2 Simulation (`src/sim/`)

- **Fixed timestep, 60 ticks/s.** Speed controls (1×, 2×, 4×, 8×, pause) run more or fewer ticks per frame. There is also
  a headless `runMap(seed, build) → MapResult` that runs as fast as possible.
- **Deterministic.** Use our own seeded PRNG (sfc32), with separate streams for: map generation, monster rolls, loot,
  and combat.
  - `Math.random`, `Date.now` and `performance.now` are banned in `sim`, `calc`, `gen` and `data` (ESLint).
  - Iteration order must never depend on object key insertion from untrusted sources. Use arrays and integer ids.
- **Entities:** player, monsters, projectiles, ground effects (AoE telegraphs, explosions), and loot drops. Each has an
  integer id, position (tiles, float), radius, and faction.
- **Collision:** circle vs tile grid (walls), with soft separation between monsters.
- **Actions:** an action (attack or cast) has a wind-up equal to its use time. The hit lands at **60%** of use time.
  Movement stops during the action.
- **Projectiles:** speed 12 tiles/s (_tunable_). They hit the first enemy, are destroyed by walls, and pierce or
  spread per mods.
- **Events:** the sim emits an event list each tick (`hit`, `crit`, `miss`, `block`, `stun`, `ailmentApplied`, `death`,
  `levelUp`, `drop`, `flaskUsed`, `projectileSpawned`, …) for the renderer and UI. The renderer never mutates sim
  state.

### 8.3 Correctness anchor: calc ↔ sim convergence

`src/sim/convergence.test.ts`: for each of a set of reference builds (one per primary skill, plus crit, conversion
and dual-wield builds), run the sim against a stationary training dummy for 600 simulated seconds.

- With 0 armour, 0 evasion and 0 resistances, hit DPS must be within **±3%** of the calc engine.
- With the dummy's evasion and resistances set, it must also be within ±3%.
- Poison steady-state DPS must also be within ±3%.

Never weaken this test to make it pass. Fix the formula mismatch.

---

## 9. Passive tree

### 9.1 Structure (full size)

The tree is comparable in size to PoE's, so a character's 123 points (5.3) cover only about 10% of it, and builds
must choose.

| Node kind                  | Target count    | Notes                                                                                    |
| -------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| Class starts               | 6               | —                                                                                        |
| Keystones                  | 21              | Section 9.4                                                                              |
| Notables                   | ~130            | Unique names. At most 3 notables share the same mod set (with different values allowed). |
| Small passives in clusters | ~800            | Repeat the cluster's theme at about 1/3 of the notable's main stat                       |
| Travel / attribute nodes   | ~350            | +10 to one attribute, or a minor generic stat                                            |
| **Total**                  | **1,250–1,350** |                                                                                          |

- **Layout:** the six class starts sit on an inner ring, in PoE order:
  - Mystic (Int) at the top;
  - Shade (Dex/Int) at the upper right;
  - Strider (Dex) at the right;
  - Reaver (Str/Dex) at the bottom;
  - Vanguard (Str) at the lower left;
  - Zealot (Str/Int) at the upper left.
- Each start is surrounded by its region. The space between neighbouring regions holds hybrid themes.
- The outer ring holds the strongest notables and most keystones, reached through long travel paths.
- The centre is a hub that lets builds cross to another region.
- **IP:** the layout is our own. Do not reproduce PoE's tree shape, node positions or cluster arrangement. Only the
  _kinds_ of nodes and the general region-by-attribute idea are borrowed.

### 9.2 Spec-driven generation

At ~1,300 nodes, the tree is authored at the **cluster** level, never node by node.

- `src/data/tree/spec.ts` lists about 160 clusters:
  `{ id, region, center: {r, θ}, kind: 'wheel'|'chain'|'spur'|'keystone', small: ModTemplate, smallCount, notable?: NotableDef, links: ClusterId[] }`.
- **Travel paths** between linked clusters are generated automatically.
  - Each path is a run of travel nodes spaced along the link.
  - Its attribute follows the regions it passes through.
- `src/data/tree/build.ts` is a pure, deterministic function that lays out nodes `(x, y)` with ids and edges.
  - It runs once at startup and is memoised.
  - A snapshot test pins the node count, edge count and every keystone's id and position.
- Notables are authored with **theme templates**:
  - `src/data/tree/notableThemes.ts` defines about 40 parameterised themes (for example "melee physical + life";
    "crit chance + crit multi with daggers").
  - The spec instantiates each theme 2–4 times at different strengths and positions, each with its own name.
- **Rendering:** SVG with about 1,300 circles and about 1,500 lines must pan and zoom at 60 fps on a mid-range laptop.
  If it does not, switch the tree view to a `<canvas>` renderer behind the same component interface, and record it in
  Appendix A.

### 9.3 Tree invariants (tested)

- The node count is 1,250–1,350 and the keystone count is 21.
- The graph is connected, and every node is reachable from every class start.
- No two nodes are closer than 40 units in layout space, and no edge passes through a node it isn't attached to.
- Every cluster link references an existing cluster.
- Each class start reaches at least **4 keystones within 40 points** and at least **15 notables within 30 points**.
- All notable names are unique, and every name passes the IP deny-list test.

### 9.4 Keystones (21)

| Name (ours)         | Effect                                                                                                   | PoE analogue          |
| ------------------- | -------------------------------------------------------------------------------------------------------- | --------------------- |
| Unerring Discipline | Attacks always hit. Never deal critical strikes.                                                         | Resolute Technique    |
| Hollow Vessel       | Max life is 1. Immune to chaos damage.                                                                   | Chaos Inoculation     |
| Blood Rite          | Skills cost life instead of mana. Max mana is 0. Auras reserve life instead of mana.                     | Blood Magic           |
| Plated Hide         | Evasion rating is converted to armour. Dexterity gives no evasion bonus.                                 | Iron Reflexes         |
| Mind Bulwark        | 30% of damage is taken from mana before life.                                                            | Mind Over Matter      |
| Searing Avatar      | 50% of physical, lightning and cold damage is converted to fire. Deal no non-fire damage.                | Avatar of Fire        |
| Close Quarters      | Projectile damage: up to 50% more at short range, falling to 50% less at long range (linear, 1–8 tiles). | Point Blank           |
| Crimson Pact        | Leech is instant. You have no life regeneration.                                                         | Vaal Pact             |
| Fever Pitch         | After a crit, 40% more elemental damage for 8 s. Crit multiplier is fixed at 100%.                       | Elemental Overload    |
| Pain Conduit        | 30% more spell damage while on low life.                                                                 | Pain Attunement       |
| Rooted Stance       | Cannot be stunned. Cannot evade enemy attacks.                                                           | Unwavering Stance     |
| Prismatic Balance   | Your hits give the target +25% resist to the hit's element(s) and −50% to the other elements, for 5 s.   | Elemental Equilibrium |
| Living Ward         | Life regeneration applies to ES instead of life. Max life is 1 (needs Hollow Vessel to be sensible).     | Zealot's Oath         |
| Shade Leech         | Life leech applies to ES instead. No life leech. ES recharge is 50% slower.                              | Ghost Reaver          |
| Strongarm           | Strength's melee damage bonus also applies to projectile attacks.                                        | Iron Grip             |
| Wound Dance         | Bleeds stack up to 8 times. Bleed no longer deals extra damage to moving targets.                        | Crimson Dance         |
| Cruel Agony         | Ailments are affected by crit multiplier (when from a crit). Crits deal 30% less hit damage.             | Perfect Agony         |
| Mana Bastion        | ES protects mana instead of life. Skill costs are paid from ES before mana.                              | Eldritch Battery      |
| Arrow Weave         | +40% chance to evade projectile attacks; −30% chance to evade melee attacks.                             | Arrow Dancing         |
| Shieldwall          | Block chance cap +10%. 30% less evasion rating.                                                          | (ours)                |
| Steady Draw         | Bow attacks: 25% more damage, 20% less attack speed.                                                     | (ours)                |

"Chance to evade" adjusts the hit check: `hitChance · (1 − evadeBonus)`, clamped as in 6.3.

### 9.5 Notable themes by region (about 18 notables per region, plus the hub)

| Region  | Themes                                                                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Str     | Max life %, armour, 2H weapon damage, mace damage, life regen, melee physical, flat damage reduction, **stun threshold, stun duration on enemies** |
| Str/Dex | Sword and axe damage, attack speed, block, bleed, dual wield, accuracy, life leech, **stun avoidance**                                             |
| Dex     | Bow damage, projectile damage, evasion, movement speed, crit with bows, flask effect, projectile speed, flask charges                              |
| Dex/Int | Dagger and claw damage, poison, crit chance, crit multiplier, ES/evasion hybrid, chaos damage, life on hit                                         |
| Int     | Spell damage, ES, mana, cast speed, elemental damage, wand damage, reduced mana reservation, ES recharge                                           |
| Str/Int | Sceptre and staff damage, elemental resists, aura effect, ignite, armour/ES hybrid, max resistance +1, staff block                                 |
| Hub     | Generic: all attributes, life, damage, ailment effect, flask charges                                                                               |

Each region also has 2–3 "outer ring" notables that are stronger, at about 1.5× the region's normal values, at the
far end of long paths.

---

## 10. Labyrinth generation (`src/gen/labyrinth.ts`)

### 10.1 Algorithm

1. Coarse grid of **14×14-tile cells**. Run a self-avoiding random walk from the start cell for `rooms` steps (from
   the map schedule). If stuck, backtrack. This gives the **main path**.
2. Each path cell gets one room: a random rectangle of 6–12 tiles per side, inset at least 1 tile from its cell.
   - The first room is the **start**.
   - The last room is the **end room**, at least 10×10 tiles.
3. Connect consecutive rooms with corridors 2–3 tiles wide. A corridor is L-shaped with a random elbow, and 30% of
   corridors get an extra jog.
4. **Side branches:** attach 1–2 rooms to random main-path rooms (not start or end) via free neighbouring cells.
   Each side branch's last room holds a **chest** (one magic-or-better item).
5. Rasterise to a tile grid: `wall | floor`.
   - The exit is a tile in the end room, active once the end room's monsters are dead.
6. **Waypoints:** the player's route is a list of room centres in visiting order. Side branches are visited as
   out-and-back detours from the room they attach to.

### 10.2 Invariants (tested over 200 seeds for each room count, 4–8)

- All floor tiles are connected.
- The exit is reachable from the start.
- The end room is the last main-path room. No rooms overlap.
- The map fits within 160×160 tiles.
- The same seed produces an identical grid.

### 10.3 Population

| Room               | Content                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start              | Empty                                                                                                                                                          |
| Normal main / side | 1 pack: 3–7 monsters (+1 per 20 maps). Pack rarity: 70% normal, 22% contains a magic group of 2–3 magic monsters, 8% contains one rare with 2–4 normal escorts |
| End                | Per schedule: a rare pack, a mini-boss with 4 escorts, or the unique boss                                                                                      |

The monster level equals the area level. The theme (12.6) biases the element weights.

---

## 11. Items

### 11.1 Slots

| Slot                  | Notes                                                  | Max sockets        |
| --------------------- | ------------------------------------------------------ | ------------------ |
| Main hand             | Any weapon                                             | 1H: 3 · 2H: 6      |
| Off hand              | Shield, 1H weapon (dual wield), quiver (with bow only) | shield 3, quiver 0 |
| Helmet, gloves, boots | —                                                      | 4                  |
| Body armour           | —                                                      | 6                  |
| Amulet, ring ×2, belt | —                                                      | 0                  |
| Flask ×5              | —                                                      | 0                  |

- 2H weapons and bows occupy the off hand. A bow is allowed only a quiver there.
- Socket count is capped by item level: ilvl 1–9 → 2, 10–24 → 3, 25–39 → 4, 40–49 → 5, 50+ → 6. Within the cap, the
  count rolls with weights favouring lower counts: `w(n) = 1 / n`.
- All sockets on an item are linked (2.1).

### 11.2 Bases

Every base has: id, name (ours), slot, weapon class or armour type, level requirement, attribute requirements,
implicit mods, and base stats.

**Weapon classes (12):**

| Class    | Hands | Implicit theme                   | Base crit | Bases (req. level)    |
| -------- | ----- | -------------------------------- | --------- | --------------------- |
| Sword    | 1H    | +accuracy                        | 5%        | 1 / 15 / 30 / 45 / 60 |
| Axe      | 1H    | —                                | 5%        | 1 / 15 / 30 / 45 / 60 |
| Mace     | 1H    | 15% reduced enemy stun threshold | 5%        | 1 / 15 / 30 / 45 / 60 |
| Sceptre  | 1H    | inc elemental                    | 6%        | 1 / 15 / 30 / 45 / 60 |
| Dagger   | 1H    | inc crit chance                  | 6.5%      | 1 / 15 / 30 / 45 / 60 |
| Claw     | 1H    | life on hit                      | 6.3%      | 1 / 15 / 30 / 45 / 60 |
| Wand     | 1H    | inc spell damage                 | 7%        | 1 / 15 / 30 / 45 / 60 |
| 2H sword | 2H    | +accuracy                        | 5%        | 1 / 15 / 30 / 45 / 60 |
| 2H axe   | 2H    | —                                | 5%        | 1 / 15 / 30 / 45 / 60 |
| 2H mace  | 2H    | 25% reduced enemy stun threshold | 5%        | 1 / 15 / 30 / 45 / 60 |
| Staff    | 2H    | +block, inc spell damage         | 6.5%      | 1 / 15 / 30 / 45 / 60 |
| Bow      | 2H    | —                                | 5.5%      | 1 / 15 / 30 / 45 / 60 |

That makes 60 weapon bases.

APS by class (_tunable_): dagger and claw 1.5; sword 1.45; wand 1.4; axe 1.3; sceptre and mace 1.25; bow 1.4;
2H sword 1.35; 2H axe 1.25; staff 1.2; 2H mace 1.1.

Damage scales roughly ×1.9 per base tier (_tunable_).

**Armour:**

- Helmet, gloves, boots and body armour, in six defence types: armour, evasion, ES, armour/evasion, armour/ES and
  evasion/ES.
- Four tiers each (req. ~1, 20, 40, 60). That makes 96 bases.
- Shields: 12 bases (armour, evasion and ES; 4 tiers), each with block chance 20–28%.

**Jewellery and other:**

- Rings: 5 bases (implicit: +mana, +fire resist, +cold resist, +lightning resist, +all elemental resist at req. 40).
- Amulets: 4 bases (implicit: +Str, +Dex, +Int, +all attributes).
- Belts: 3 bases (implicit: +life, +armour, +ES).
- Quivers: 2 bases (implicit: +accuracy, +physical damage to bow attacks).

### 11.3 Affixes

- Each affix **family** is `{ id, type: 'prefix'|'suffix', slots: SlotTag[], local?: boolean, tiers: Tier[] }`.
- Each tier is `{ minIlvl, weight, mods: [range…] }`.
- Roll rule: choose a family by summed weights of the tiers allowed by ilvl. Then choose a tier among the allowed ones
  by weight. Then roll the values uniformly (integers).
- An item has at most one affix per family.

Target: **about 50 families, 4–10 tiers each (about 350 tiers)**. The tiers' `minIlvl` values are spread from 1 to 84, so new
tiers keep unlocking throughout the 100-map run. Families:

- **Prefixes:**
  - +max life;
  - +max mana;
  - +max ES (global on jewellery and belt; local on armour);
  - local inc armour/evasion/ES and the hybrids;
  - flat local armour/evasion;
  - local inc physical damage;
  - local adds physical/fire/cold/lightning;
  - global adds physical/fire/cold/lightning to attacks (rings, amulets, gloves, quivers);
  - adds fire/cold/lightning to spells (wand, sceptre, staff);
  - inc spell damage;
  - inc elemental damage with attacks;
  - life leech %.
- **Suffixes:**
  - fire, cold, lightning, all-elemental and chaos resist;
  - Str, Dex, Int and all attributes;
  - local attack speed;
  - global attack speed (gloves, quivers);
  - cast speed;
  - local crit chance;
  - global crit chance;
  - crit multiplier;
  - accuracy;
  - life regen;
  - mana regen;
  - life on hit;
  - movement speed (boots);
  - block chance (shields);
  - ignite, bleed and poison chance;
  - reduced mana reservation (amulet, rare tiers only);
  - increased stun duration on enemies (weapons, gloves);
  - reduced enemy stun threshold (weapons);
  - chance to avoid being stunned (body armour, boots, belt);
  - increased stun threshold (belt, body armour).
- **Rare high-level prefix:** +1 to the level of socketed gems (helmet, body armour, 2H weapon; minIlvl 60).

### 11.4 Rarity

| Rarity | Affixes                                                     | Name                                                 |
| ------ | ----------------------------------------------------------- | ---------------------------------------------------- |
| Normal | 0                                                           | base name                                            |
| Magic  | 1–2 (max 1 prefix and 1 suffix)                             | `<prefix name> Base <suffix name>`                   |
| Rare   | 4–6 (max 3 prefixes and 3 suffixes; 4: 50%, 5: 35%, 6: 15%) | two random words from our lists, e.g. "Grim Lantern" |
| Unique | fixed mods with authored ranges                             | authored                                             |

**Drop rarity weights:** normal 60, magic 32, rare 7.5, unique 0.5.

- Monster rarity multiplies the non-normal weights: magic ×1.5, rare ×3, unique ×6.
- Drop chance per kill (_tunable_): normal 8%, magic 25%, rare 100% for 1–2 items, mini-boss and boss 100% for 3–4
  items with at least one rare.
- About 15% of drops are flasks.
- Item level = monster level. A unique drops only if its base level ≤ ilvl.

### 11.5 Gems

- Gems are items placed in sockets. An **active** gem in an item's socket group is supported by every **support** gem in
  the same item.
- Supports never affect auras in v1.
- Exactly one active gem is marked **primary** (the UI defaults to the highest-DPS one). Other actives are inactive in
  v1 and the UI says so.
- Auto-level: a gem's _natural_ level is the highest L ≤ 20 such that `gemLevelReq[L] ≤ characterLevel` **and** the character
  meets that level's attribute requirement.
  - `gemLevelReq = [1, 2, 4, 7, 11, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 67, 70]`.
  - `+N to level of socketed gems` mods add N on top of the natural level, up to 25. They ignore requirements.
    Stats above L20 extrapolate the L1→L20 curve.
  - The attribute requirement scales linearly from 10 at L1 to 98 at L20 in the gem's attribute; hybrid gems use
    60% of that in each attribute.
- Gem stats are authored at L1 and L20. Values in between interpolate geometrically for damage and linearly for
  everything else. A gem may override a single level.
- **Acquisition:** the skill gem picks after maps 1–4; gem drops; the camp reward pick (1 of 3 offers drawn from item, gem and flask pools); and
  side-branch chests (20% chance of a gem instead of an item).

**Active skills (7):**

| Name (ours)   | Type                          | Attr | Behaviour                                                                                                     | Base % / effectiveness            | Notes                            | PoE analogue   |
| ------------- | ----------------------------- | ---- | ------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- | -------------- |
| Crushing Blow | Attack, melee, strike         | Str  | Single-target hit, range 1.4 tiles (2H: 1.7); +25% stun duration, 25% increased stun damage                   | 150%→190%                         | —                                | Heavy Strike   |
| Reaping Arc   | Attack, melee, area           | Str  | 120° arc, radius 2.2 tiles; hits all                                                                          | 100%→140%                         | Dual wield: both weapons hit     | Cleave         |
| Split Volley  | Attack, projectile, bow       | Dex  | Fires 3 arrows in a 30° spread (+1 per 5 levels)                                                              | 90%→120%                          | Needs a bow                      | Split Arrow    |
| Venom Cut     | Attack, melee, strike         | Dex  | Single-target; +40% poison chance; 25% more poison damage                                                     | 100%→130%                         | Needs a dagger, claw or 1H sword | Viper Strike   |
| Flame Bolt    | Spell, projectile, area, fire | Int  | Projectile; on hit, explodes in a 1.2-tile radius; 25% ignite chance                                          | 9–14 → 520–780 fire, eff. 240%    | Cast time 0.75 s                 | Fireball       |
| Arc Chain     | Spell, lightning, chaining    | Int  | Instant hit on a target within 7 tiles, chaining to 2 (+1 per 5 levels) more within 4 tiles; 10% shock chance | 2–20 → 70–650 lightning, eff. 80% | Cast time 0.8 s                  | Arc            |
| Frost Lance   | Spell, projectile, cold       | Int  | Piercing projectile, range 9 tiles; damage falls off to 50% at max range                                      | 7–11 → 480–720 cold, eff. 130%    | Cast time 0.65 s                 | Freezing Pulse |

**Supports (17):**

| Name (ours)         | Effect                                                            | Cost × | Tags       | PoE analogue                |
| ------------------- | ----------------------------------------------------------------- | ------ | ---------- | --------------------------- |
| Brute Force         | 40%→59% more melee physical damage                                | 1.4    | melee      | Melee Physical Damage       |
| Swift Assault       | 25%→44% increased attack speed                                    | 1.15   | attack     | Faster Attacks              |
| Quick Cast          | 20%→39% increased cast speed                                      | 1.2    | spell      | Faster Casting              |
| Ember Infusion      | Gain 25%→34% of physical as extra fire                            | 1.2    | attack     | Added Fire Damage           |
| Channelled Elements | 30%→49% more elemental damage; cannot inflict elemental ailments  | 1.3    | any        | Elemental Focus             |
| Focused Ruin        | 30%→49% more spell damage; 100% reduced crit chance               | 1.3    | spell      | Controlled Destruction      |
| Echoing Cast        | Repeats the cast (70% more cast speed); 10% less damage           | 1.4    | spell      | Spell Echo                  |
| Volley Split        | +2 projectiles; 25% less projectile damage                        | 1.5    | projectile | Lesser Multiple Projectiles |
| Piercing Shot       | Projectiles pierce 2→5 targets; 10% more projectile damage at L20 | 1.2    | projectile | Pierce                      |
| Dense Blast         | 35%→54% more area damage; 30% less area of effect                 | 1.4    | area       | Concentrated Effect         |
| Wide Blast          | 30%→49% increased area of effect                                  | 1.4    | area       | Increased AoE               |
| Precision Strikes   | 30%→49% increased crit chance; +15%→34% crit multiplier           | 1.2    | any        | Increased Critical Strikes  |
| Rending Edge        | 25% chance to bleed; 30%→49% more bleed damage                    | 1.2    | attack     | Chance to Bleed             |
| Toxin Coat          | 40% chance to poison; 20%→39% more poison damage                  | 1.2    | any        | Chance to Poison            |
| Kindle              | 30% ignite chance; 40%→59% more ignite damage                     | 1.2    | any        | Immolate/Burning-ish        |
| Bloodthirst         | 2% of attack damage leeched as life                               | 1.3    | attack     | Life Leech                  |
| Staggering Force    | 30%→49% increased stun duration; 20% reduced enemy stun threshold | 1.15   | attack     | (ours)                      |

That is 17 supports.

**Auras (7):**

| Name (ours)   | Reservation   | Effect at L1 → L20                                 | Attr    | PoE analogue  |
| ------------- | ------------- | -------------------------------------------------- | ------- | ------------- |
| Kindling Halo | 50%           | Adds 4–7 → 120–180 fire to attacks and spells      | Str     | Anger         |
| Storm Halo    | 50%           | Adds 1–12 → 20–300 lightning to attacks and spells | Int     | Wrath         |
| Frost Halo    | 50%           | Gain 10% → 19% of physical as extra cold           | Dex/Int | Hatred        |
| Veil of Grace | 50%           | +60 → +1,700 evasion rating                        | Dex     | Grace         |
| Iron Bastion  | 50%           | +20% → +39% more armour                            | Str     | Determination |
| Arcane Ward   | 35%           | +60 → +500 max ES                                  | Int     | Discipline    |
| Clear Mind    | 35 → 100 flat | +1.8 → 8 mana regen per second                     | Int     | Clarity       |

### 11.6 Flasks

| Base                    | Type      | Effect                                                                                        | Charges (max / per use) | Duration |
| ----------------------- | --------- | --------------------------------------------------------------------------------------------- | ----------------------- | -------- |
| Life flask ×8 tiers     | Life      | Recovers 70 / 150 / 270 / 450 / 700 / 1,000 / 1,400 / 1,900 life (req. 1/8/18/30/42/54/66/78) | 21 / 7                  | 4 s      |
| Mana flask ×6 tiers     | Mana      | Recovers 50 / 110 / 200 / 320 / 460 / 620 mana (req. 1/10/22/36/50/64)                        | 24 / 6                  | 4 s      |
| Hybrid flask ×3         | Life+mana | 60%/60% of the same-tier values                                                               | 30 / 10                 | 5 s      |
| Bulwark flask           | Utility   | +1,500 armour (scales ×(1 + 0.04 · ilvl))                                                     | 50 / 25                 | 4 s      |
| Mist flask              | Utility   | +1,500 evasion (scales the same way)                                                          | 50 / 25                 | 4 s      |
| Haste flask             | Utility   | 40% increased movement speed                                                                  | 50 / 25                 | 4 s      |
| Ember/Frost/Storm flask | Utility   | +50% resist to that element, +5% to its max                                                   | 50 / 25                 | 4 s      |

Magic flask affixes (one prefix, one suffix; about 8 families):

- **Prefixes:** increased amount, increased charges, reduced duration with more recovery, instant recovery (life only,
  less amount).
- **Suffixes:** removes ignite, removes freeze/chill, removes bleed, increased armour during effect.

### 11.7 Uniques (target 30)

Authored items with fixed mods. Each should enable or reward a build idea. The required examples are:

1. **Hollow crown** (helmet): +X max ES; auras reserve 15% less.
2. **Gravemarrow chest** (ES body armour): +large ES; +35% chaos resist; −20% max life.
3. **Coldheart dagger**: always freezes on crit; adds cold damage.
4. **Rattle-bow**: +1 projectile; 100% increased attack speed; 40% less damage.
5. **Ember-wrap gloves**: 10% of physical converted to fire; ignite chance 15%.
6. **Ironroot boots**: 25% movement speed; +armour; cannot be chilled.
7. **Bloodknot ring**: 1% life leech; −10% all resists.
8. **Stormcall sceptre**: 50% of physical converted to lightning; shock chance 20%.
9. **Wanderer's sash** (belt): +flask charges gained; flasks have 30% increased effect.
10. **Thornshield**: +6% block; recover 2% of life on block.
11. **Gravehammer** (2H mace): 40% reduced enemy stun threshold; 50% increased stun duration; 20% more damage
    against stunned enemies.
12. **Stillstone belt**: cannot be stunned; 15% reduced attack speed.

The rest are filled during implementation:

- at least one per weapon class used by a starting class;
- level requirements spread across 1–80, so uniques keep appearing throughout the run.

---

## 12. Monsters

### 12.1 Level scaling (_tunable_; balance with the headless bot)

| Stat         | Formula at monster level m (1–100)    |
| ------------ | ------------------------------------- |
| Life         | `round(20 · 1.055^m + 12 · m)`        |
| Hit damage   | `2 + 0.085 · m^1.5` (avg)             |
| Accuracy     | `20 + 14 · m`                         |
| Evasion      | `30 + 12 · m`                         |
| Armour       | `20 + 10 · m`                         |
| Stun thresh. | = life                                |
| Base ele res | 0% (the type or variant may add some) |

Sample values for a normal Warrior:

| m   | Life  | Avg hit | Accuracy | Evasion | Armour | Base XP |
| --- | ----- | ------- | -------- | ------- | ------ | ------- |
| 1   | 33    | 2       | 34       | 42      | 30     | 8       |
| 10  | 154   | 5       | 160      | 150     | 120    | 63      |
| 25  | 376   | 13      | 370      | 330     | 270    | 241     |
| 50  | 891   | 32      | 720      | 630     | 520    | 694     |
| 75  | 2,009 | 57      | 1070     | 930     | 770    | 1296    |
| 100 | 5,429 | 87      | 1420     | 1230    | 1020   | 2020    |

Use these as unit-test fixtures for the formulas. They are not balance commitments.

### 12.2 Rarity

| Rarity      | Life × | Damage × | XP × | Mods  | Name                                    |
| ----------- | ------ | -------- | ---- | ----- | --------------------------------------- |
| Normal      | 1      | 1        | 1    | 0     | type name                               |
| Magic       | 2      | 1.15     | 2    | 1–2   | type name, blue outline                 |
| Rare        | 4.5    | 1.35     | 5    | 2–4   | generated two-part name, yellow outline |
| Mini-boss   | 6.75   | 1.5      | 8    | 4     | generated name                          |
| Unique boss | 30     | 2.0      | 30   | fixed | "the Ossuary Regent"                    |

### 12.3 Base types

| Type    | Life × | Dmg × | Range               | Speed (tiles/s) | Attack time | Behaviour                        |
| ------- | ------ | ----- | ------------------- | --------------- | ----------- | -------------------------------- |
| Warrior | 1.0    | 1.0   | melee 1.2           | 3.0             | 1.2 s       | chase and swing                  |
| Brute   | 1.7    | 1.9   | melee 1.5           | 2.4             | 1.9 s       | slow, heavy; +50% stun damage    |
| Archer  | 0.7    | 0.8   | 7 tiles, projectile | 3.0             | 1.3 s       | stops at range; retreats if < 2  |
| Mage    | 0.6    | 1.1   | 7 tiles, spell      | 2.8             | 1.5 s       | stops at range; always elemental |

### 12.4 Elemental variants

Any type can roll an element. For warriors, brutes and archers the weights are 55% none, 15% fire, 15% cold,
15% lightning. Mages are never "none".

| Variant | Effect                                                                                      | Tint      |
| ------- | ------------------------------------------------------------------------------------------- | --------- |
| Burning | 60% of physical converted to fire (mage: 100% fire); +40% fire res; 15% ignite chance       | orange    |
| Frozen  | 60% physical → cold (mage: 100%); +40% cold res; 20% freeze chance (mage projectile chills) | pale blue |
| Storm   | 60% physical → lightning (mage: 100%, chaining bolt); +40% lightning res; 20% shock chance  | violet    |

### 12.5 Monster mods (15)

| Mod          | Effect                                                                           | Magic?    |
| ------------ | -------------------------------------------------------------------------------- | --------- |
| Hasted       | 25% increased move, attack and cast speed                                        | ✓         |
| Armoured     | +200% armour                                                                     | ✓         |
| Elusive      | +200% evasion                                                                    | ✓         |
| Prismatic    | +30% all elemental resists                                                       | ✓         |
| Fire-bound   | Gain 50% of damage as extra fire                                                 | ✓         |
| Frost-bound  | Gain 50% of damage as extra cold                                                 | ✓         |
| Storm-bound  | Gain 50% of damage as extra lightning                                            | ✓         |
| Vampiric     | 20% life leech                                                                   | ✓         |
| Regenerating | 3% life regen per second                                                         | ✓         |
| Fortified    | 100% more life                                                                   | rare only |
| Volatile     | On death, a 1-second telegraphed fire explosion (radius 2, 3× hit damage)        | ✓         |
| Raiser       | Every 8 s, summons 2 skeleton warriors (cap 6 alive); summons give no XP or loot | rare only |
| Frenzied     | 50% more damage below 35% life                                                   | ✓         |
| Rime Aura    | Chills the player by 15% within 3 tiles                                          | rare only |
| Unshakable   | Cannot be stunned                                                                | ✓         |

Magic monsters roll from the ✓ rows. Rares roll from all rows. There are no duplicates.

### 12.6 Map themes

Each map offers 2 themes (5.3). A theme adjusts element weights and adds a small bonus:

| Theme            | Element weights    | Bonus                               |
| ---------------- | ------------------ | ----------------------------------- |
| Ashen Crypt      | fire ×3            | +20% item quantity                  |
| Rimed Catacomb   | cold ×3            | +20% item rarity (rare weight ×1.2) |
| Thunder Vault    | lightning ×3       | +15% XP                             |
| Bone Pits        | none ×2, brutes ×2 | +1 rare pack                        |
| Archer's Gallery | archers ×3         | +1 chest                            |

### 12.7 The unique boss: the Ossuary Regent (map 100)

- **Crushing swing:** melee, 1.6 s.
- **Grave slam:** every 7 s, a telegraphed (1.2 s) 3-tile circle at the player's position, dealing 4× hit damage.
- **Raise dead:** at 75%, 50% and 25% life, summons 4 warriors of a random element.
- **Resists:** +30% all elemental. Stun threshold ×4 (6.6a).
- Killing it and reaching the exit wins the run.

---

## 13. AI

### 13.1 Player (`src/sim/ai/player.ts`)

The player AI is a state machine:

- **Advance:** follow the waypoint route. Pathing uses A* over the tile grid, recomputed when the target changes or
  every 0.5 s.
- **Engage** (enter when any monster is within **9 tiles** with line of sight):
  - The target is the nearest monster. Ties go to the lower life.
  - Move until the target is within the primary skill's range, then use the skill.
  - Ranged and spell skills hold position.
  - Projectile skills require line of sight to fire.
- **Loot:** when no monster is within 9 tiles, walk to any drop or unopened chest within 6 tiles and pick it up.
  Pickup is automatic on contact.
- **Exit:** when the end room is cleared, walk to the exit.
- **Stuck guard:** if position progress is < 1 tile over 20 s while in Advance, teleport to the next waypoint and log
  a warning event. The headless bot reports these.

### 13.2 Monsters

- **Idle** until the player is within 8 tiles with line of sight, or the monster takes damage. Then pack-mates within
  6 tiles are alerted too.
- **Chase** using a **flow field**: a BFS distance map from the player's tile, rebuilt whenever the player changes
  tile.
- **Attack** when in range.
- Ranged types stop at range and retreat if the player is within 2 tiles.
- Monsters leash back after losing the player for 6 s.

---

## 14. Architecture

### 14.1 Module map

```
src/
  main.ts                 boot: mounts the DOM UI root and the Phaser game
  core/                   rng (sfc32), ids, math, event bus, types shared everywhere
  data/                   authored content: constants, classes, tree spec, bases, affixes, uniques,
                          gems, flasks, monsters, monster mods, themes, stat text, name lists, ipDenyList
  mods/                   Mod, ModDB, conditions, stat ids, text rendering
  calc/                   computeCharacter, damage pipeline, defences, ailment math, reference monster
  gen/                    labyrinth, packs, item generation, monster generation, reward offers
  sim/                    world state, tick, entities, actions, projectiles, ailments, AI, flask policy, loot
  run/                    RunState, run state machine (title/camp/map/summary), save/load
  render/                 Phaser scenes (MapScene), sprite sync from sim state, damage numbers, placeholder art
  ui/                     Preact components: title, class select, camp (tree SVG, inventory, sheet, rewards), HUD
scripts/
  simulate.ts             headless runs with the decision bot (npm run sim)
```

### 14.2 Import boundaries (enforced with ESLint `no-restricted-imports`)

- `core`, `data`, `mods`, `calc`, `gen`, `sim` and `run` must **not** import `phaser`, `preact`, `render` or `ui`,
  and must not use DOM globals. They run headless under Node and Vitest.
- `render` may import `sim` and `core` to read state. It never writes sim state.
- `ui` may import anything except `render`. It talks to Phaser only through `run`'s event bus.
- `Math.random`, `Date.now` and `performance.now` are banned outside `render` and `ui`.

### 14.3 UI technology

- **Phaser 4** renders only the map: the labyrinth, entities, projectiles, effects, damage numbers and the in-map HUD
  (life/mana/ES orbs, flask slots, speed buttons). The HUD may be DOM if simpler.
- **Preact** (new dependency) with `@preact/signals` renders every other screen as DOM over the canvas.
- The passive tree is an **SVG** rendered by Preact, with pan (drag), zoom (wheel), hover tooltips, and click to
  allocate or refund.
- Tooltips use one shared component. Item tooltips show requirements, implicit and explicit mods, and compare deltas
  against the equipped item.

### 14.4 Dependencies to add

- `preact`, `@preact/signals`.
- Dev: `@preact/preset-vite`, and `tsx` (for `npm run sim`).
- Nothing else without recording why in the Implementation decisions appendix.

### 14.5 Placeholder art

All art is generated at boot into Phaser textures with `Graphics`. No image files in v1.

- **Floor and wall tiles:** two-tone with noise.
- **Player:** a circle with a facing wedge, coloured by class.
- **Skeleton types:** bone-white shapes, distinct silhouettes per type (warrior circle with blade line, brute large
  square-ish, archer with bow arc, mage with orb). Tinted by element. Rarity outlines in blue, yellow or orange.
- **Projectiles:** coloured by damage type.
- **AoE:** expanding rings. Telegraphs: red translucent circles.
- **Ailment indicators:** small coloured pips over the entity. Stun: a spinning star ring.
- **Floating damage numbers:** white = physical, element colours otherwise, larger for crits.

Visual quality is explicitly secondary in v1. Readability comes first.

---

## 15. Verification strategy

1. **Unit tests** (Vitest) for every formula in section 6, mod queries (7.2), conversion with ancestry, affix rolling
   constraints, gem levelling, reservation, and flask policy.
2. **Data validation tests:**
   - every id referenced across `src/data` exists;
   - every affix tier range has min ≤ max;
   - every base's requirements are within limits;
   - the tree invariants (9.3);
   - the IP deny-list scan (section 3).
3. **Determinism test:** `runMap(seed, build)` twice gives identical results (event-log hash).
4. **Convergence test:** calc ↔ sim (8.3).
5. **Headless bot** (`npm run sim -- --runs 10 --class all`):
   - Plays complete runs with a greedy decision bot that:
     - allocates passives by best Δ(DPS × EHP) per point among reachable nodes;
     - equips items by the same score;
     - sockets the best supports;
     - takes the highest-scoring reward.
   - Prints per class: win rate, median map reached, median level per map, deaths by map, stuck-guard count, mean
     map duration at 1×, and wall-clock time per run.
   - **Performance requirement:** the headless sim runs at least **500× real time**, so a full 100-map run takes
     about 25 s or less. Profile and optimise the sim if it doesn't.
   - `--maps a-b` stops a run after map b, for quick checks of early balance.
6. **Browser smoke check:**
   - Run `npm run dev`.
   - Play map 1 at 4× speed through to camp.
   - Confirm there are no console errors, and record a screenshot in `docs/screenshots/` per milestone.

---

## 16. Milestones

Each milestone ends with: `npm run check` green, `npm run build` green, a browser smoke check where relevant, an
update to `docs/PROGRESS.md`, and **one git commit**. Acceptance criteria must be checkable without judgment calls.

### M0 — Foundations

1. The `src/` folders from 14.1 exist. The ESLint import boundaries and the banned-globals rules are active, and a
   deliberate violation fails lint (verified once, then removed).
2. `core/rng.ts` implements sfc32 with `next()`, `int(a, b)`, `float(a, b)`, `pick`, `weighted` and `fork(label)`.
   It has tests, including distribution sanity and reproducibility.
3. `mods/` implements `Mod`, `ModDB.sum/product`, conditions, `per` scaling and text templates. It has tests covering
   increased vs more, tag filtering, and ancestry filtering.
4. The Preact and Vite setup renders a "Title" screen DOM overlay above the existing Phaser canvas.

### M1 — Playable vertical slice (ugly is fine)

1. `gen/labyrinth.ts` generates maps meeting every invariant in 10.2 (tests over 200 seeds).
2. A `MapScene` renders the grid. The player (one class, default attack only) auto-walks the waypoints, and normal
   skeleton warriors chase and fight it.
3. Simple combat: flat damage, life, death.
4. The end room is cleared, then the exit, then a stub camp screen with a "Next map" button. Death leads to a run
   summary.
5. Speed controls work: 1×, 2×, 4×, 8× and pause.
6. The determinism test passes for `runMap`.
7. In the browser, map 1 → camp → map 2 plays with zero input and no console errors.

### M2 — Combat rules

1. The full damage pipeline (6.5): accuracy, block, crit, conversion and gain, armour, resists, ES, leech, regen and
   life on hit. All are unit-tested.
2. All six ailments (6.6) and stun (6.6a) in the sim, with visual indicators.
3. `calc/computeCharacter` produces the full sheet (8.1).
4. The convergence test (8.3) passes for at least: a melee physical build, a crit spell build, a conversion build,
   a dual-wield build, and a poison build.
5. Flasks (6.9) work with the auto-use policy.

### M3 — Character building

1. Six classes with starting attributes, gear and gems (5.2).
2. Tree engine: spec → generated tree, with every region and all 21 keystones present. At this milestone the tree
   may be partial (≥ 450 nodes). Every invariant in 9.3 except the node-count range passes. All 21 keystones work,
   each with at least one test.
3. The SVG tree UI supports pan, zoom, tooltips, allocate and refund. The points counters are correct.
4. XP, levelling, passive points and bonus points per 5.3–5.4.
5. Gems: sockets, all-linked support application, auto-levelling, primary-skill selection, the default-attack
   fallback, and all 7 actives and 17 supports.
6. All 7 auras with reservation (6.8) and the inactive-aura warning.

### M4 — Items

1. Every base in 11.2, about 50 affix families (about 350 tiers, minIlvl spread 1–84), and ilvl-gated rolling with
   max-affix rules (tested).
2. Rarity generation and naming, and the drop tables (11.4).
3. At least 30 uniques, including the 12 listed in 11.7.
4. Every flask base and its affixes.
5. The equipment and inventory UI: equip, unequip, discard, socket and unsocket gems, attribute and level requirement
   checks, and tooltips with compare deltas from the calc engine.
6. Chests in side branches.

### M5 — Enemies

1. All four types × elemental variants (12.3–12.4) with distinct placeholder silhouettes.
2. Magic, rare and mini-boss tiers with all 15 mods (12.5). Rares get generated names.
3. Level-scaling tables (12.1), XP per 5.4, and pack population (10.3).
4. Map themes and the 2-option next-map choice (12.6).
5. The Ossuary Regent boss fight (12.7).

### M6 — Run loop

1. The full 100-map run with the schedule (5.3):
   - resist penalties;
   - bonus passive points;
   - refund points;
   - reward picks;
   - auto-continue;
   - mini-bosses every 10th map;
   - victory and run-summary screens.
2. Save and load at camp (5.5), plus "continue run" on the title screen.
3. `npm run sim` headless bot (15.5) implemented and meeting the 500× performance requirement.
4. The XP table is derived from bot measurements (5.4).
5. The README is updated: how to play, and the commands, including `npm run sim`.

### M7 — Full-size tree and balance

1. The tree is expanded to the full size in 9.1 (1,250–1,350 nodes, ~130 notables). **Every** invariant in 9.3 passes.
2. The tree view meets the rendering requirement in 9.2, or has switched to canvas.
3. A balance pass, using 10 bot runs per class (60 runs):
   - map 1 clear rate 100%;
   - every class has a median map reached ≥ 25;
   - at least 3 classes have a median map reached ≥ 50;
   - at least one run in total wins (clears map 100);
   - pacing per 5.4 (median level within ±4 of the map number);
   - stuck-guard triggers < 1 per 10 maps on average.
     Results are recorded in `docs/PROGRESS.md`.

### Definition of done for the first pass

M0–M7 acceptance criteria are all met. The final commit has a green `npm run check` and `npm run build`. A browser
playthrough of at least maps 1–2 shows no console errors. `docs/PROGRESS.md` lists what was cut or deferred.

### Stretch (only after DoD)

- Minimap.
- Combat log panel.
- More uniques (target 35).
- A per-skill DPS breakdown panel like Path of Building's.
- Manual flask hotkeys behind a toggle.
- Sound.
- Run seed entry and sharing.

---

## 17. Goal-run operating rules

1. Work milestones in order. Within a milestone, keep the game runnable at every commit.
2. Before every commit, run `npm run check` (tsc, eslint, prettier and tests) and `npm run build`. Both must be green.
   Never skip hooks or weaken tests to pass.
3. Commit at the end of each milestone, and optionally at stable points inside one. Use clear messages.
   **Never push**, and never add a remote.
4. When a decision is needed that this doc does not cover:
   - pick the simplest option consistent with sections 2–4;
   - record it in Appendix A with a one-line reason;
   - continue.
     Do not stop to ask unless the decision would violate section 2 or 3.
5. If a milestone criterion proves infeasible:
   - implement the closest feasible version;
   - record the gap in `docs/PROGRESS.md` under "Deferred";
   - move on.
     Prefer reaching M7 thin over finishing M4 lavishly.
6. Keep `docs/PROGRESS.md` current. It holds: the current milestone, a checklist of acceptance criteria, deferred
   items, known bugs, and the latest bot results.
7. Content data must follow the IP policy (section 3) at all times.
8. Do not add scope beyond this document except for the stretch list after DoD.

---

## 18. Open questions for the user (defaults in effect until answered)

| Question                                       | Default                                   |
| ---------------------------------------------- | ----------------------------------------- |
| License?                                       | None yet (all rights reserved by default) |
| GitHub remote and hosting (e.g. GitHub Pages)? | None. Local only.                         |
| Final (non-code) game title?                   | "Bob" until decided                       |

---

## Appendix A — Implementation decisions

_(Filled in during implementation: date, decision, reason.)_

| Date       | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Reason                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-06 | Renamed supports "Spell Echo" → **Echoing Cast**, "Elemental Focus" → **Channelled Elements**, "Lacerate" → **Rending Edge**, and keystone "Iron Skin" → **Plated Hide**.                                                                                                                                                                                                                                                                                                                                           | The first three are the reference game's own proper names (§3.3); the last was too close to one.                                                                     |
| 2026-10-06 | The IP deny-list matches multi-word entries anywhere as whole words, and single-word entries only when they are an entire string.                                                                                                                                                                                                                                                                                                                                                                                   | Lets common words inside our names ("Veil of Grace", "Haste flask") pass while still catching a gem or class named exactly like the reference.                       |
| 2026-10-06 | Web lookups may be used to understand how a mechanic works; nothing (code, data, text, art) is copied from Path of Building, game files or the wiki. Blender is not used: §14.5 mandates code-generated art.                                                                                                                                                                                                                                                                                                        | Reconciles the goal prompt ("use any tools") with §3.                                                                                                                |
| 2026-10-06 | `run/save.ts` takes an injected key–value storage; `main.ts` passes `window.localStorage`.                                                                                                                                                                                                                                                                                                                                                                                                                          | §5.5 needs localStorage but §14.2 keeps `run/` free of DOM globals.                                                                                                  |
| 2026-10-06 | Added dev dependency `@types/node`. `scripts/` may use wall-clock time (the bot measures its own speed); the banned-globals rule applies to the headless `src/` layers.                                                                                                                                                                                                                                                                                                                                             | `scripts/simulate.ts` needs Node typings and timing.                                                                                                                 |
| 2026-10-06 | Renamed gem **Sweep** → **Reaping Arc** and keystone **Overload** → **Fever Pitch**; both added to the deny-list as whole-name entries.                                                                                                                                                                                                                                                                                                                                                                             | Short single-word names may coincide with the reference game's (Sweep) or sit one word from one already denied (Elemental Overload); renaming is cheap.              |
| 2026-10-06 | Policy for the deny-list scan: single common English words that merely describe a mechanic ("Kindle", "Bloodthirst", "Frost Lance") are exempt under §3.3; the scan catches full-name collisions only. Any name later found to be a reference-game proper name is renamed.                                                                                                                                                                                                                                          | The scan cannot tell a coincidence from a copy without a list of every reference name, which §3.2 forbids us to build from the game's data.                          |
| 2026-10-06 | Saves store passive allocations as tree node ids, which come from `src/data/tree/spec.ts`. Editing the spec invalidates saves (bump `SAVE_VERSION` when you do).                                                                                                                                                                                                                                                                                                                                                    | v1 has no migrations (§5.5).                                                                                                                                         |
| 2026-10-06 | The passive tree stays SVG. Pan and zoom change one group transform (measured 0.16 ms per update with 1,344 nodes and 1,440 edges); paint frame rate could not be measured in the in-app browser, which throttles animation frames.                                                                                                                                                                                                                                                                                 | §9.2 asks for 60 fps and a canvas fallback if missed; the cost measurement gives no reason to build the fallback yet. Revisit if a foreground browser shows stutter. |
| 2026-10-06 | The tree was built at full size at M3 (the doc allows a partial tree there), so M7's tree item was already complete.                                                                                                                                                                                                                                                                                                                                                                                                | The spec-driven builder made the full tree no harder than a partial one.                                                                                             |
| 2026-10-06 | `package.json` name and the HTML title are now `bob`; README rewritten for Bob.                                                                                                                                                                                                                                                                                                                                                                                                                                     | Matches decision D13; the rename had been offered in the earlier session.                                                                                            |
| 2026-10-06 | Percentage aura reservation is a percentage of **max** mana (as in the reference game); an aura activates only if that much is still unreserved.                                                                                                                                                                                                                                                                                                                                                                    | §6.8's "of unreserved max mana" read as the pool the cost is taken from; percent-of-remaining would make stacking auras nearly free.                                 |
| 2026-10-06 | All projectiles of one skill use share a hit list: a use hits each target at most once.                                                                                                                                                                                                                                                                                                                                                                                                                             | Keeps single-target calc DPS exact (§8.3) and avoids point-blank shotgunning with high projectile counts.                                                            |
| 2026-10-06 | The convergence test pools 600 simulated seconds over 5 seeds per case.                                                                                                                                                                                                                                                                                                                                                                                                                                             | One 600 s run has roll variance above ±3% for low-hit-chance builds (verified: long runs converge to within 0.1%).                                                   |
| 2026-10-06 | Monster scaling retuned with the bot: life `round(20·1.055^m + 12m)`, hit damage `2 + 0.085·m^1.5`, plus an easing ramp for maps 1–20 (life ×0.5→1, damage ×0.6→1). §12.1's sample table and the formulas test were updated to match.                                                                                                                                                                                                                                                                               | The original curves made late maps unwinnable for any build the bot could assemble; the doc marks these _tunable_.                                                   |
| 2026-10-06 | One-handed weapons (except wands) deal ×1.6 base damage and bows ×1.3.                                                                                                                                                                                                                                                                                                                                                                                                                                              | A one-handed weapon gives up a hand; at the doc's values the Reaver, Shade and Strider could not out-damage early monsters.                                          |
| 2026-10-06 | Attacks gain built-in flat physical damage per character level: `0.7·L` to `1.4·L`.                                                                                                                                                                                                                                                                                                                                                                                                                                 | Attacks otherwise scaled only through a 100%→140% gem multiplier, so weapon users stalled between weapon tiers while spells scaled with gem level.                   |
| 2026-10-06 | Skill base costs lowered (levels 1→20: attacks 1–9, spells 3–22). The bot score uses "sustained DPS", blending in the default attack when mana regeneration cannot pay for the skill.                                                                                                                                                                                                                                                                                                                               | Starting characters ran dry in seconds and fell back to a weak default attack.                                                                                       |
| 2026-10-06 | Harsh monster mods (Fortified, Raiser, Rime Aura, Frenzied) do not roll on rares before map 15 or mini-bosses before map 50. Vampiric leech 20%→10%, Regenerating 3%→1%.                                                                                                                                                                                                                                                                                                                                            | Early rares with these mods were unwinnable for 6 of 6 classes.                                                                                                      |
| 2026-10-06 | Ranged monsters retreat in 0.8 s bursts (3 s cooldown) instead of continuously.                                                                                                                                                                                                                                                                                                                                                                                                                                     | Continuous retreat let archers and mages kite forever.                                                                                                               |
| 2026-10-06 | Arc skills (Reaping Arc) hit targets out to radius + target radius + attacker radius + 0.4, matching the AI's engage distance.                                                                                                                                                                                                                                                                                                                                                                                      | Swings at targets 2.6–3.0 tiles away whiffed.                                                                                                                        |
| 2026-10-06 | Ailment-only scaling (`dot`, `ignite`, `bleed`, `poison` tags) is applied on top of H; generic damage mods are already inside H (§6.6).                                                                                                                                                                                                                                                                                                                                                                             | Avoids double-counting generic mods.                                                                                                                                 |
| 2026-10-06 | The depth expansion (`docs/EXPANSION.md`) was approved with changes. It reopens D6 (charges, curses, crafting/currency come in; jewels, ascendancies, influence, minions, totems and traps stay out) and D10 (undead and crypt-dwelling factions), and adds triggered skills to §2.1.                                                                                                                                                                                                                               | The user asked for combinatorial depth from uniques, enemies and currency.                                                                                           |
| 2026-10-06 | Currency is designed around the player's choices rather than the reference game's gambles (EXPANSION §8): the player picks which affix goes, which family is added, which affixes are kept and the socket count; chance fills in tier and value or offers three options to pick from. Only the Knucklebone Die and the Rot Seal are blind gambles.                                                                                                                                                                  | Single player has no trade economy; the user asked for more agency over items.                                                                                       |
| 2026-10-06 | Saves may break at any milestone. There is no v1 → v2 migration, and unique ids may change.                                                                                                                                                                                                                                                                                                                                                                                                                         | The user said saves can break.                                                                                                                                       |
| 2026-10-06 | Triggered skills follow the reference game's rules: a cooldown per trigger source, no action time, mana is paid and the trigger does not fire when mana is short, and triggered skills never trigger anything.                                                                                                                                                                                                                                                                                                      | The user asked for triggers that work like the reference game.                                                                                                       |
| 2026-10-06 | Unique jewels are out of the plan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | The user's review.                                                                                                                                                   |
| 2026-10-07 | C1 mechanics audit: Bob's rules were brought in line with 3.9.0 (hit chance, crit cap and confirmation, crit ailments, bleed, shock and chill, stun, ES recharge, leech, regeneration, dual wielding, triggers, flasks, Fervour, boss curses). The full list, with the wiki revision behind each rule, is `docs/AUDIT-3.9.md`.                                                                                                                                                                                      | The user asked that mechanics match 3.9.0, not just content (COVERAGE C-1).                                                                                          |
| 2026-10-07 | Divergences recorded by the audit (2.1 rows): bot-tuned monster accuracy, evasion and armour; per-level flat attack damage and the one-hand bonus; no gem quality; −200 resist floor; per-hit crit rolls; blocked hits skip on-hit effects; "increased damage taken" multiplies separately from shock; flasks do not end early at full life; fixed 6 s hex duration and own hex numbers; support cost multipliers do not raise aura reservation; Wounded Retort uses a share of life; ES leech uses the life rates. | Each is a deliberate simplification or a tuned number with no 3.9 basis; none is worth the engine cost.                                                              |

## Appendix B — Glossary

- **Increased / reduced:** additive percentage modifiers, summed together.
- **More / less:** multiplicative modifiers, each applied separately.
- **Local mod:** an item mod that changes only that item's own base stats.
- **Ancestry:** the set of damage types a damage chunk has passed through via conversion or gain. Mods for any type in
  the ancestry apply.
- **Effectiveness (of added damage):** a multiplier on flat added damage from non-weapon sources for a given skill.
- **Area level:** the monster level of a map.
- **Primary skill:** the one active skill the auto-battler uses.
