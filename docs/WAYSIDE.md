# Bob — Wayside Plan: stops, a Market, provisions and reprieves

Status: **built 2026-10-13 (Y1 to Y7); every number is a first guess, measured only in part (section 16); questions met while building are in [WAYSIDE-QUESTIONS.md](WAYSIDE-QUESTIONS.md)** · Owner: the user · Author: Claude

> **Cut on 2026-10-14 (the user): the Market, the Wares tab.** Sorting through more gear after every short level is too much overhead for the play loop, so the per-level
> stock, the tab, buying at camp, the Market's Reprieve sale and the bot's shopping were removed from the code. Everything below that speaks of the Market (sections 1, 4.2 to 4.4,
> 6.1, 7.4, 8, 9.1, 10, 11 Y2, 12.2, 14.2) is the plan as it was, kept for the record. What is left of it is the **Quartermaster stop**, the only place wares are
> for sale (twelve wares at their plain price, a Reprieve among them from level 20), and Bone Dust is spent only there. Provisions now come from the Quartermaster and from reward picks;
> a Reprieve from the Quartermaster, the Ferryman or a boss level's pick. Section 16.5 says what this does to the economy.
>
> **Revised on 2026-10-14 (the user's second round of feedback): section 17 wins wherever it disagrees with sections 1 to 16.** In short: the old
> principle that nothing may make the character stronger than gear and the tree can was dropped (a shop may sell what the best drops
> are, and a buff may beat any item for a map); the Workbench is not designed around or against at all; the Awlsmith charges Bone Dust, and
> every other currency no longer drops; Shrine blessings are about 75% stronger; the pouch holds three provisions, any or all armed, and
> reprieves are provisions of a third kind; the specialist provisions are gone; every reprieve refills the flasks; and the systems start
> at level 5 and are a regular part of play (stops about one level in five from level 6, provisions found on cleared maps, cards in
> every reward pick).

This plan extends [MAPS.md](MAPS.md) (offers, Respite, Abandon, carry-over) and [DESIGN.md](DESIGN.md). It reopens two non-goals
of MAPS.md section 1 ("a town or shop", "map items as a consumable economy"); section 13 lists the edits that go into DESIGN.md
on approval. It began as a pitch (`PITCH-WAYSIDE.md`, since folded in), was attacked by an independent Opus review that read the
code, and was rewritten around what that review found. Section 15 says what the review changed.

Conventions follow DESIGN.md and MAPS.md:

- Every number is a first guess and _tunable_. Milestone Y0 measures before any number is fixed.
- Reference-game names appear nowhere. Every name here is a placeholder invented for this plan and must pass the IP scan
  (`src/data/ip.test.ts`) when it enters `src/data`; a naming pass is part of Y7.
- `core`, `data`, `mods`, `calc`, `gen`, `sim` and `run` stay headless (DESIGN §14.2). No `Math.random`, `Date.now` or
  `performance.now` outside `render` and `ui`.

**Reading guide.** Sections 0 to 3 make the case and fix the rules. Sections 4 to 8 are the four systems. Section 9 covers
legibility, auto-continue and the bot. Sections 10 to 13 are engine changes, milestones, risks and DESIGN edits. Section 14 lists
what the user decided and what is open for the deep dive. Section 15 is the review.

---

## 0. Premises (the user, 2026-10-13)

1. **The Workbench is closed. Design as though it did not exist.** It will come back "someday"; nothing here is built around it, to
   avoid it, or to stay clear of what it sells. When it returns, a stop and the Workbench may offer something alike: both are
   limited in how they are reached, so some overlap is fine.
2. **A reload is a free undo, and that is fine.** The camp saves on every change, a reload mid-map returns to the camp save, and
   consumables spent in that map come back with it. We do not add a save at map start, and we do not guard against it. A player who
   reloads to cheat is cheating at a single-player game. (This closes the largest blocker the review raised; section 14.1.)
3. **The whole thing is wanted**: stops, a Market, one-map buffs and second chances, as one design.
4. Unchanged from MAPS.md: **the counter advances by exactly 1 per level, always**; the run is 100 maps; the character fights alone
   and the player's only input in a map is Abandon (D9); death or clearing map 100 ends the run; offers are rolled from the run
   seed and stored in the save.

---

## 1. Summary

Today the gap between maps is a pause with two kinds of decisions (what to wear, which of three maps to take). The **Wayside**
adds a second, quieter game in that gap, made of four parts that share one economy and one rule:

| Part                 | What it is                                                                                                                                               | What it costs                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| ~~The Market~~ (cut) | A camp tab with a small, fixed stock that restocks each level, priced in **Bone Dust** (what salvaging already pays)                                     | Bone Dust                                                     |
| **Stops**            | A new kind of offer, next to map and Respite: a non-combat place that gives something a map cannot                                                       | **A level** (the counter still advances)                      |
| **Provisions**       | Three items carried in a pouch: staples and bets are armed at camp, burn when the next map starts and help for that map only; reprieves ride along ready | Found on cleared maps, picked, or bought at the Quartermaster |
| **Reprieves**        | A provision of a third kind: if the character would die, it pulls it out of the map or revives it, and refills the flasks                                | Picked, bought, or given for a bargain                        |

The rule that holds them together: **the game's price is a level.** A stop spends a level, a retreat spends a level, a bet
spends safety. Bone Dust is the only money. Nothing here adds a clock, a second currency or a mid-map input.

```
Camp ── arm provisions (any of the three) ── pick 1 of 3 offers ─▶ Map      (provisions burn at the start;
  │                                                                  │                a Reprieve may trigger)
  │                                                                  ├─────▶ Respite  (exists: restores everything)
  │                                                                  └─────▶ Stop     (new: costs the level, gives a service)
  └─ Pouch (three provisions, reprieves among them) · Bone Dust
```

---

## 2. Where things stand (read from the code, 2026-10-13)

| Fact                                                                                                                                                                                                                        | Where                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| The Workbench tab and the item-detail craft button are disabled (`CRAFTING_OPEN = false`, commit d56f803). Chalk on offered maps still works. Most currency has no player-facing use.                                       | `constants.ts:217`, `Camp.tsx`, `ItemDetail.tsx` |
| Bone Dust already exists as `run.dust`, paid by salvage: `SALVAGE_BASE` normal 1, magic 2, rare 5, unique 15, gem 4, flask 1, times `1 + ilvl/50`. Clean up says so ("... for 410 Bone Dust"). Its only sink was the Bench. | `currency.ts:287`, `craft.ts:471`, `cleanUp.ts`  |
| Bench prices (the unit the old design calibrated): resist or life 15 to 20, remove 25, chaos res and 4th socket 40, 5th 120, 6th 300 Dust.                                                                                  | `currency.ts:270`                                |
| A Socket Auger sets the socket count (the 4th to 6th cost 1, 2, 3 Augers) and drops from map 5. With crafting closed it cannot be used.                                                                                     | `currency.ts`, `craft.ts:252`                    |
| The camp saves on any camp change and on entering camp. `startMap` switches the screen to `map` before it calls `changed()`, so a reload mid-map restores the camp save.                                                    | `controller.ts:111`, `:277`                      |
| Offers are three per level; a boss level has one; a Respite takes a slot when life, mana or a flask is under 0.9 (always under 0.4); a Respite is never on levels 1 to 4 or on a tenth level.                               | `offers.ts:127` to `:143`                        |
| Abandon is unavailable on every tenth map (the mini-boss or boss), takes a 5 s timer, advances the counter and loses the level's clear rewards. Map 100 is the victory.                                                     | MAPS 7, `finishMap`                              |
| Reward picks come after every 5th map (`run.map % 5 === 0`) and every mini-boss; uniques after 25, 50, 75.                                                                                                                  | `run.ts:343`, MAPS 5.2                           |
| `godMode` already sets the player to 1 life instead of dying, in the one damage routine: the natural place for a death hook.                                                                                                | `combat.ts:319`                                  |
| The five-slot flask belt is driven by thresholds from the Strategy tab.                                                                                                                                                     | `flaskPolicy.ts`, `data/strategy.ts`             |
| The threat preview builds the `Character` at the offer's level with the offer's affixes as `extraMods`, and scores every offer.                                                                                             | `threat.ts:231`, `preview.ts`                    |
| The camp has eight tabs. Every screen needs a phone layout (MOBILE.md).                                                                                                                                                     | `Camp.tsx:41`                                    |
| `SAVE_VERSION` is 18.                                                                                                                                                                                                       | `run.ts:34`                                      |
| The latest bot samples win about 2 runs in 96 and reach a median of maps 5 to 15, so win rate is too noisy to measure a feature.                                                                                            | `docs/PROGRESS.md` (bot sections)                |

Consequence: the economy has income and nowhere to spend it. The Wayside is the sink, and it is built so that it works beside the
Workbench rather than around it.

---

## 3. Goals, principles and non-goals

1. **Every part is a bet with information.** The camp already shows each offer's threat and pay. A provision, a stop and a
   Reprieve are chosen against those figures, not in the dark.
2. **The price is a level.** A stop, a retreat and a skipped boss reward cost the thing the game already counts. Money is
   secondary and only one kind.
3. **Power is allowed.** A provision or a blessing may make the character stronger for a map, or for several, than any item could;
   a shop may sell an item as good as the best that could drop. What limits a power is its price (a level, Bone Dust, a cost
   in danger) and how often it comes, not a ceiling set below what the game already hands out.
4. **Nothing new in a map.** Provisions are mods and population changes set before the map; a Reprieve triggers by policy, the
   same seam as flasks and Abandon.
5. **Measurable.** Each part has a bot strategy that tries to abuse it and a bound it must stay under (section 12).
6. **No design around the Workbench** (premise 1). Overlap with it is not a problem.

**Non-goals.** A town screen with walking around; trade between players; a new currency; selling items one by one (salvage already
does it); retrying a map; rewinding time (section 7.5); mid-map decisions; anything that makes the 100-map run longer or shorter.

---

## 4. Bone Dust and the Market (the Market was cut on 2026-10-14; see the note at the top)

### 4.1 Bone Dust is the money

No new currency. `run.dust` already exists, resets each run, and is already paid by salvage and by Clean up. Salvage prices scale
with `1 + ilvl/50`; so do the prices below, which keeps purchasing power steady across the run: a rare salvaged at level 50 pays
10 Dust and a staple provision at level 50 costs 10 Dust, at level 5 it is 5.5 and 5.5.

Price in the tables below is the **base**, before the `(1 + areaLevel/50)` factor, and is given as "rare equivalents" (RE: one
salvaged rare is 5 base). With about 7.5 items a level, mostly normal and magic, a player who salvages everything earns roughly 2 to
4 RE a level _(an estimate from drop rates, not measured; Y0 measures it)_.

### 4.2 The Market

A camp tab, **Wares**. Always open, no level cost. Stock is rolled from `new Rng(seed).fork('market' + map)` when the previous level
ends and **stored in the save** (`run.wayside.market`), so reloading cannot re-roll it, and a purchase stays bought. It restocks
every level; unbought wares are gone. There is no reroll and no selling step.

Six slots, fixed by role so that the shop reads at a glance:

| Slot      | What it holds                                                                                             | Base price (RE)                   |
| --------- | --------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Gear ×2   | A rare of the current level for a slot you choose to compare (shown in full, with `compareSlots`)         | 6                                 |
| Gem       | One gem you have not found yet this run, at level 1                                                       | 2.4                               |
| Flask     | A utility flask with a good affix                                                                         | 3                                 |
| Provision | One of the provisions of section 6, drawn by weight                                                       | 1 (staple), 2 (bet or specialist) |
| Wildcard  | Rotates: a second provision, a currency bundle (3 to 5 of one kind), or from map 20 a **Reprieve** (rare) | 1.5 to 50                         |

Design notes:

- **~~Decent, not best~~ (dropped, 2026-10-14).** The shop should be able to sell something as good as the best that could drop:
  the Quartermaster's gear is the best of four rares rolled two item levels up (section 17).
- **The Reprieve ware** appears at most once per five levels and never twice in a row, and costs about 30 times a staple
  (section 7.4).
- **Phones.** One column of cards with the price in the corner; no table.

### 4.3 What this does to the economy

Dust now has a sink, salvage a purpose, and Clean up becomes more than tidying. The risk is the opposite of the old one: a player
who hoards junk and salvages in one pile gets the same Dust as one who salvages as they go, so there is no sell-in-batches trick to
protect against (this is why the pitch's sale cap and Reroll Man are gone). The remaining abuse is _saving_: Dust carried over many
levels buys a Reprieve early. That is the intended use, and the price (section 7.4) is set so a saver pays for it in levels of
other things not bought.

### 4.4 ~~Beside the Workbench~~ (dropped, 2026-10-14)

The plan once priced the shop and the Awlsmith so as not to compete with the Workbench. The user: the Workbench is closed and nothing is
designed around it; both are limited in how they are reached, so overlap is fine.

---

## 5. Stops

A stop is a third kind of offer. It takes the place of a map in a slot, **costs the level**, and gives a service. It is the
non-combat room the plan is named for.

### 5.1 What a stop is, mechanically

```ts
type OfferKind = 'map' | 'respite' | 'stop';
type StopId = 'awlsmith' | 'gemHoard' | 'shrine' | 'quartermaster' | 'ferryman';
type MapOffer = { /* as today */ kind: OfferKind; stop?: StopId };
```

- Taking a stop spends the level exactly as a Respite does: the counter advances by 1, there is **no XP, no clear reward, no
  refund point and no reward pick**, and it is recorded in the history (`MapRecord.status` gains `'stop'`). Vitals get the same 10
  seconds of natural recovery as any camp; a stop is not a Respite and does not restore everything.
- **A stop is risk-free.** The review's point: a skipped level is a level without the chance of dying in it, and the bot dies
  around maps 5 to 15. A bot that always takes stops could beat the anchor for a weak build. The `stopper` strategy (section 12)
  holds this to the same "no more than 10 points above the anchor" rule MAPS uses for the other exploits.
- **Frequency.** At most one stop per set. Never on levels 1 to 5, on a tenth level (the boss gate), or on a level where a reward
  pick is due (every fifth: a stop would delete the pick, and the pick is the pay-off the game keeps promising). Never in the slot
  a forced Respite takes (life under 0.4). Never the anchor: the anchor stays a map at the level's own number, so auto-continue,
  which takes the first offer, never picks one.
- **A schedule, not a roll.** The run is cut into windows of five levels starting at level 6 (6 to 10, 11 to 15, and so on; the fifth level of each is a pick or a gate, so the stop falls on one of the other four). For
  each window the seed picks one eligible level for a stop and one kind. That gives about eighteen stops in a run, the first before level 10, predictable enough
  to plan around ("a stop is coming before 24"), with no pity counter in the save. Kinds are drawn by weight and the same kind
  does not repeat in consecutive windows.
- The card says what the stop gives, what it costs (the level, and what that level would have paid, from the same `offerRewards`
  figures the map cards use), and is sorted next to the maps.

### 5.2 The stops

| Stop                  | What the player does                                                                                                                                                                          | Why take it                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **The Awlsmith**      | Pick one item (worn or carried): **its next socket is free**, up to its ceiling. Further sockets in the same visit cost **Bone Dust** (the 4th 40, the 5th 120, the 6th 300).                 | Socket count                                                                                   |
| **The Gem Hoard**     | The stop names four tags (fire, projectile, aura, minion...). Pick one; it offers **8 gems of that tag** at the level their drops would have, and you take **3**.                             | A targeted pile of gems, without waiting for drops. Gems are plentiful; a specific kind is not |
| **The Shrine**        | Pick one of three **blessings** (for example +22% maximum life, +15% damage, +26% all resistances, +18% movement speed). It lasts until the next stop and **replaces** the previous blessing. | A real standing edge for about five levels; only one is active                                 |
| **The Quartermaster** | Eight wares for Bone Dust: two rares (the best of four, rolled two levels up), a gem, a utility flask, three provisions and a reprieve. Anything you do not buy is gone.                      | A shop, when you are rich in Dust                                                              |
| **The Ferryman**      | Offers a **reprieve for free** (your pouch needs room), but with a **bargain**: a curse for the next five levels (−15% maximum life). You may refuse.                                         | A second path to insurance that costs risk instead of Dust                                     |

The first three come from the user's list (sockets, "lots of gems") and the rest from the second-chance and shop asks.

### 5.3 Rejected or cut stops (and why)

- **Glasshouse** (raise a gem two levels): gems level themselves (DESIGN 2.1) and moving one is already free.
- **Old Forge** (a free craft): needs the closed Workbench.
- **Cartographer** (see the next sets, reroll): offers are rolled from the vitals at the moment the previous level ends, so there is
  no future set to show; a reroll breaks "one set per level"; a free edit is Chalk.
- **Penitent's Rite** (curse for a reward): Chalk and the existing affixes already cover it; the Ferryman is the same trade for a
  Reprieve, which is a bigger prize.
- **Pawned unique**: tablet sets and the unique picks (maps 25, 50, 75) already do it.
- **Hearthstone** (refill without losing the level): a Respite that costs nothing deletes the attrition system MAPS 8 built.

---

## 6. Provisions

A provision is an item carried in the **pouch**. A **staple** or a **bet** is **armed** at camp and **burns when the next map starts**,
helping for that map only. A **reprieve** (section 7) is the third kind: it needs no arming and is used up only when it saves the
character.

### 6.1 Rules

- **Pouch.** Holds **three** provisions in all, of any kind (a reprieve counts). They are not inventory items: they stack by kind in
  `run.wayside.pouch`.
- **Armed.** Any or all of the three may be armed (`PROVISIONS_PER_MAP` is the pouch's size). Arming is explicit and shown on the camp
  screen before the offers; the offers' threat verdicts include the armed set (section 9.1). A reprieve is never armed: it is always ready.
- **Burn.** A provision burns when the map starts and is spent whether the map is cleared, abandoned or lost. A Respite or a stop
  does not burn them.
- **Reload.** A reload during a map restores the camp save, so the provision is back (premise 2). Accepted.
- **Sources** (they are meant to be a regular part of play, not a rarity; section 17):
  - **A cleared map may leave one in the pouch**: from level 3, with a 40% chance, and the first time for certain (`forage`). Camp says
    so ("The last map left you Whetted Powder"). Nothing when the pouch is full.
  - **Reward picks**: every fifth map's pick may hold a provision card (40%) or a reprieve card (30%; 60% on a boss level's pick).
  - **The Quartermaster** sells three provisions and a reprieve.
  - The Ferryman gives a reprieve.

### 6.2 What a provision may do (and may not)

The review's challenge: most buffs are utility flasks or Chalk under another name, and the preview that scores them would pick the
best one for you. The answer is to make provisions do things flasks and Chalk cannot, and to make some of them _bets_ whose value
depends on the offers you can see. A provision may well make the character stronger for a map than any item it could find: that is
what it is for (principle 3).

- **Staples** are small, flat buffs. They are the floor: cheap, always right, never interesting.
- **Bets** are strong buffs with a cost. They are a decision only when the preview shows the trade honestly.

| Kind   | Provision      | Effect for one map                                            | Catch                                   |
| ------ | -------------- | ------------------------------------------------------------- | --------------------------------------- |
| Staple | Whetted Powder | +12% damage                                                   | none                                    |
| Staple | Ward-oil       | +12% to all resistances                                       | none                                    |
| Staple | Bloodsalt      | 2% of damage dealt is leeched as life                         | none                                    |
| Bet    | Glass Draught  | +60% damage                                                   | +40% damage taken                       |
| Bet    | Greedy Lantern | +30% item quantity                                            | −15% maximum life                       |
| Bet    | Rushing Tonic  | +15% movement speed, +10% attack and cast speed               | monsters move 10% faster                |
| Bet    | Hunter's Bell  | Three more rare packs; +25% experience and +20% item quantity | harder map (the threat model prices it) |

~~Specialists~~ (Slow Fuse, Bonebreaker, Counterweight) were **dropped on 2026-10-14**: they paid only against one map type or an affix, so
they were mostly dead weight in the pouch.

### 6.3 What is deliberately not a provision

Anything that rerolls the offers, and anything that lasts more than one map (the Shrine's blessing is a stop, section 5). Restoring life,
mana and flasks is a reprieve's job (it refills the flasks).

---

---

## 7. Reprieves (second chances)

Death ends the run. A Reprieve is the one thing that can change that, so it is the strongest and the most guarded item in this plan.

### 7.1 Where they live and the rules

- **A reprieve is a provision of a third kind** (2026-10-14): it sits in the pouch with the others (three of anything at most), needs no
  arming, and is always ready. There is no slot of its own, no run cap, and the character may carry up to three.
- It triggers by **policy**, never by input (a `ReprievePolicy` was planned; the only trigger is "damage would kill", so there is none).
  Several carried are used in order: a revive before a retreat (a retreat is passed over on a boss level for a revive carried with it).
- Every reprieve **refills all the character's flasks** when it fires, so that it has a chance at what follows.
- It is used up when it fires. The HUD shows the reprieves carried as chips in the status line; the camp says "Last Spark saved you" or
  "Ferry Token pulled you out".

### 7.2 Two families

**Retreat** (the lead family): death becomes an abandon. On lethal damage the character is pulled out, the map ends as abandoned
(it keeps the XP and loot earned so far and loses the clear rewards, MAPS 7.2), the counter advances, and life is set to a
quarter. It is the best fit for this game: it prices death in a level, like everything else, and reuses the `abandoned` path
in `finishMap`.

**Revive**: on lethal damage the character stays in the map at a fraction of its life with a few seconds of invulnerability and a
pulse that pushes nearby monsters away. It is the larger swing and the more dangerous one for the balance: the same automatic
character goes back into the fight that just killed it. It ships anyway: the first strength is a guess (35% and 50% life), and the
measurement in Y0 (7.6) re-sizes it. A wrong first number is a one-line change.

| Item             | Family  | Effect                                                                                                            | Cost / catch                                          | Base price (RE) |
| ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------- |
| **Ferry Token**  | Retreat | On lethal damage, leave the map as an abandon; life set to 25%; flasks refilled.                                  | The level's clear rewards (7.3).                      | 25              |
| **Last Spark**   | Revive  | On lethal damage: revive at 35% life, flasks refilled, 3 s of invulnerability, a pulse that pushes monsters back. | One use; the pulse can wake rooms next to you.        | 45              |
| **Bargain Coin** | Revive  | Revive at 50% life, flasks refilled, 1.5 s of invulnerability.                                                    | A curse for the next five levels (as the Ferryman's). | 30              |

_(Placeholder names. Cut after the review: the Recall Cord, which shortened the 5 s escape timer that makes Abandon a decision, and the Scorched Feather, a worse Last Spark with extra rules.)_

### 7.3 Boss levels and map 100

The review's second blocker: Abandon is unavailable on every tenth map, and map 100 is the win. The simplest rule that leaves
MAPS 5.2 intact:

- **A Retreat item does nothing on a tenth map** (a mini-boss, a boss, and map 100). Abandon is already unavailable there, so the
  item adds no new way out of a boss, and the "+3 passive points can never be lost" promise stands.
- **A Revive item works on every map**, including tenth maps and map 100: it stays in the map, so it skips nothing.
- Everywhere else, a Retreat is an ordinary abandon.

The cost is that a Retreat cannot save a character from the deaths that happen at bosses; those are the Revive family's job, which
is the reason to ship both.

### 7.4 Where they come from

A regular part of play, from level 5 (section 17): about one reward pick in three holds a reprieve card (more often on a boss
level's pick); the Quartermaster sells one every time it is met; the Ferryman gives one free. The pouch of three is the limit.

### 7.5 Cut: Retry, Hourglass and Checkpoint Lantern

- **Retry the map** and **rewind eight seconds** both need the sim to replay. The sim is seeded and takes no input
  (MAPS acceptance 7), so a replay is _the same death_ unless the seed changes, and then it is just a reroll with extra steps.
  A snapshot of a `World` is large and fragile (its options hold functions; `causes` is a weak map; grids).
- A Retry item would also make the reload undo "official" and priced. Dropped.

### 7.6 Measuring before choosing a strength

`godMode` already catches a lethal hit. A script (`npm run deaths`-style, Y0) replays paired seeds with `godMode` on and records,
per map: how many lethal hits were absorbed, the hit's share of max life, and whether the character would have died again within 10
seconds. Two outcomes:

- Most lethal hits come from a healthy character in one blow: a Revive is valuable and its strength can be modest.
- Most come at low life after a long fight: a Revive only delays the death and a Retreat is the right family.

This is the number that sets the revive percentages above, and it can be produced before any feature code. It does not cover
every route to death (degeneration, ground effects, the Collapse front); Y4 checks that they all go through the one damage
routine.

---

## 8. How the pieces feed each other

- Salvage → Bone Dust → the Awlsmith's further sockets and the Quartermaster's wares. Cleaning up the bag pays for them.
- A stop trades a level for a service, so a rich player takes a Gem Hoard over a hard map and a poor one a Ferryman's bargain.
- A bet provision is a wager against the offers: the preview shows the trade, the map is chosen, the provision burns.
- A Reprieve changes how deep the player dares to push (+2 offsets, bets, Crescendo) because it prices a death in a level.
- A cleared map leaves a provision; arming it is the choice before the offers; a reprieve is the cushion that lets the player take the harder one.

---

## 9. Legibility, auto-continue and the bot

### 9.1 What the player sees

- **The offer card** shows, for a map, the existing threat and pay figures _with the armed provisions applied_, and a second line
  "without" when something is armed. A stop's card shows what it gives and the level it costs ("skips this level's about 7 items and
  1 character level").
- **The camp screen** gains a strip above the offers: the pouch of three (what is armed, what is ready) and any curse carried. On a phone it
  is one row that wraps.
- **Arm helper.** A button "Arm the best for this map" per offer, which uses `scoreTheme`. It is only a convenience; the player can
  arm by hand.
- **First use teaches.** The first stop, the first provision and the first reprieve each show a short explanation once
  (a flag in the save).

### 9.2 Auto-continue

Auto-continue takes the first offer (the anchor, always a map) and is off by default, so it never takes a stop. It pauses (the
existing `autoBlocker`) when: a stop is in the set _and_ it is the first sighting; the Pouch holds an unarmed provision and a
slot is free (a soft pause, once); a bought Reprieve is unseen. These are reasons that show on the camp screen, like the others.

### 9.3 The bot

`chooseOffer` gains a stop valuation (a table, measured, not hand-tuned in the bot), the bot salvages with `botTidy` as now, arms the
staples it carries, and takes the stops it can use (the Awlsmith, the Ferryman, a Quartermaster with a reprieve in it). It never shops at camp
(there is nothing to shop at). Bot behaviour is the spine of section 12: every part has a strategy that abuses it.

---

## 10. Engine and data

| Area                                                                                                | Change                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run/run.ts`                                                                                        | `RunState.wayside`: `market`, `pouch`, `armed`, `reprieve`, `blessing`, `curses[]` (id, until), `acquired`, `seen` flags. `SAVE_VERSION` 18 → 19 with a migration (`saveMigrate.test.ts` style).                                                        |
| `run/offers.ts`                                                                                     | `OfferKind` gains `'stop'`; `MapOffer.stop`; the window schedule (5.1); stops in `makeOffer`/`rollOffers` that never take the anchor or a forced Respite slot.                                                                                          |
| `run/stops.ts` (new)                                                                                | The five stops as operations on the run (`doAwlsmith`, `doGemHoard`, ...) with their rolls from `Rng(seed).fork('stop' + map)`; `finishStop` advances the counter and writes the record.                                                                |
| `run/sale.ts` (new; first `market.ts`)                                                              | The Quartermaster's stock, prices (`base × (1 + level/50)`), `grantWare`; the Market itself was cut.                                                                                                                                                    |
| `data/provisions.ts`                                                                                | The provision table (mods, plan hooks, price, kind). Mods use ordinary `Mod` values with a new `ModSourceKind` (`src/mods/types.ts`) so the sheet can name them.                                                                                        |
| `calc/character.ts`, `sim/world.ts`, `run/run.ts` `worldOptsFor`, `run/threat.ts`, `run/preview.ts` | Carry armed provisions as `extraMods` into the world, the sheet and the threat preview; bot `buildKey` includes the armed set or it returns stale scores.                                                                                               |
| `gen/mapPlan.ts` `planFor`                                                                          | `plan.provisions` hook for the population and affix provisions (Hunter's Bell, Counterweight); `data/mapTypes.ts` rules for Slow Fuse and Bonebreaker.                                                                                                  |
| `sim/combat.ts`                                                                                     | The Reprieve hook at the lethal-damage line (`combat.ts:319`), **before** `killActor` sends `'death'` and `'playerDied'` (renderer and death record listen); `World` gains `reprieve` state and a `retreat` request that `finishMap` treats as abandon. |
| `run/reprieve.ts` (new)                                                                             | `ReprievePolicy` (default: fire on lethal damage), retreat/revive rules, the boss-level rule (7.3).                                                                                                                                                     |
| `run/finishMap`                                                                                     | `MapRecord.status` gains `'stop'` and a retreat note; reports and the death screen show "Saved by"; `history` keeps stops for the Last-map tab.                                                                                                         |
| `ui/`                                                                                               | `Wares.tsx` (Market tab), `Stop.tsx` (the stop screens), a Satchel strip in `Camp.tsx`, offer-card changes, phone CSS (`wayside.css`, `mobile.css`), the first-use explainers.                                                                          |

Everything stays headless below `ui`. Stock, schedules and stop rolls use named RNG forks, never `craftSeq`, so a stop or a Market
cannot disturb the loot of a map.

---

## 11. Milestones

**Built 2026-10-13, one commit each:** Y1 stops, Y2 the Market, Y3 provisions, Y4 Reprieves, Y5 the Shrine, the Quartermaster and the Ferryman, Y6 the provisions that change the map, Y7 the measuring, tips, names and docs (Y0 was done inside Y7). Section 16 says what was measured and what was not.

**Order change (2026-10-13):** Y0 (measure) moved to the end of the build. The user said a wrong first guess is cheap to fix, so Y1 to Y6 use the numbers in this plan and the measurements are taken in Y7, when there is something to tune.

| #      | Milestone                   | Contents                                                                                                                                                                                                                               | Done when                                                                                    |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Y0** | **Measure**                 | The lethal-hit script (7.6) on paired seeds; Dust income per level from the bot with `botTidy`; the `stopper` strategy skeleton; the paired-seed comparison harness (maps reached, deaths by map).                                     | A short report in `docs/PROGRESS.md`; numbers in this plan replaced by measured ones.        |
| **Y1** | **Stops**                   | `OfferKind 'stop'`, the window schedule, save v19 and its migration, `finishStop`, `Stop.tsx`, the Awlsmith and the Gem Hoard, bot valuation, auto-continue rules, the `stopper` bot bound, patch notes.                               | A stop appears about every eight levels, takes a level, and the exploit bot is within bound. |
| **Y2** | **The Market**              | `market.ts`, the Wares tab, six slots, prices in Dust, the Quartermaster variant held for Y5, bot buying, phone layout, patch notes.                                                                                                   | Dust has a sink; the bot's Dust never idles above three levels of income.                    |
| **Y3** | **Provisions (mods)**       | Pouch, arming, burn on map start, the mod source and plumbing (7 entries in section 10), threat preview with the armed set, the three staples and three mod-only bets (Glass Draught, Greedy Lantern, Rushing Tonic).                  | The sheet and preview show the armed set; the bot's bet-versus-none comparison is bounded.   |
| **Y4** | **Reprieves**               | The sim hook, `ReprievePolicy`, the retreat family (Ferry Token), HUD icon, death/record/report text, the boss rule, the Market's wildcard, the reward-pick option, then the revive family (Last Spark, Bargain Coin), re-sized by Y0. | Lethal hits are caught on every route; the paired-seed effect of each item is within bound.  |
| **Y5** | **More stops**              | The Shrine, the Quartermaster, the Ferryman (needs Y4), blessings and the curse list with expiry.                                                                                                                                      | Each stop has a test and a card; the stopper bound still holds.                              |
| **Y6** | **Plan-level provisions**   | Hunter's Bell, Counterweight, Slow Fuse, Bonebreaker: the `plan.provisions` and map-type hooks.                                                                                                                                        | Each provision pays only where its text says.                                                |
| **Y7** | **Tuning, names, teaching** | One bot pass per part, price table, the naming pass and IP scan, the first-use explainers, `docs/PLAYER-AI.md` updated for the new decisions, patch notes.                                                                             | Section 12 passes; `npm run check` and `build` green.                                        |

Each milestone ends green (`npm run check`, `npm run build`), with its patch-note line, and is committed on its own.

---

## 12. Acceptance criteria and measuring

All comparisons run on **paired seeds**: the same run seed with and without the feature, measured by maps reached, the map of
death and lethal hits absorbed, because win rate (2 in 96) is too noisy to measure a feature.

1. **Stops.** A `stopper` bot that takes a stop whenever one is offered stays within **10 points** of the anchor strategy's
   median maps reached; a bot that never takes stops loses at most a small margin to one that reads the cards. No kind of stop is
   chosen more than twice as often as another.
2. **The Market.** A bot that buys by priority beats one that never buys by a bounded margin; Dust held across levels stays under
   three levels of income on average (so the sink works and nothing is hoarded); no single ware is bought in more than 60% of
   visits.
3. **Provisions.** Armed staples lift maps reached by a small bounded amount; a bet that is unbounded in either direction
   (always right or always wrong) is re-priced.
4. **Reprieves.** For each item: the paired-seed effect on maps reached and on the distribution of death maps, the number of
   lethal hits it absorbs per run, and the price in levels it implies. If a Revive lifts maps reached by more than the price it
   costs in Dust and levels, the effect or the price changes. The Retreat family is checked against the abandon rules (7.2, 7.3).
5. **No new input.** The headless modules stay headless; a test fails if a provision, stop or Reprieve reads a clock or
   `Math.random`.
6. **Determinism.** Market stock, stop schedule and stop rolls reproduce from the seed; a reload shows the same ones.
7. **Boss rules.** A test for each case in 7.3 (a Retreat item on map 100, on another tenth map and on an ordinary map; a Revive item on each).
8. **Phones.** Wares, each stop screen and the Satchel strip fit 375 px without sideways scroll.

---

## 13. DESIGN.md edits on approval

- §5.1 loop: `[Camp → (Map | Respite | Stop)]×100`; add Dust and the Market to the camp description.
- §5.3 offers: three offers, any of which may be a Respite or a stop (conditions in 5.1 of this plan).
- Appendix A: Bone Dust is the money (D17); stops (D18); provisions (D19); Reprieves (D20); the boss rule (7.3); a reload is a free
  undo and stays one (premise 2).
- MAPS.md §1 non-goals: remove "a town or shop" and "map items as a consumable economy" and point here.
- CLAUDE.md: a Wayside line, as for the other plans.

---

## 14. Decisions

### 14.1 Decided (the user, 2026-10-13)

1. Do not plan around the Workbench; it will return someday.
2. A reload is a free undo and that is acceptable. No save at map start, no reload-as-abandon.
3. Build the whole thing, as one unified design.

### 14.2 Settled by the author (2026-10-13; the user said a wrong first guess is cheap to change later)

1. **Boss levels and map 100** (7.3): a Retreat item does nothing on any tenth map; a Revive item works everywhere. No MAPS
   decision is reversed.
2. **Bone Dust is the only money** (and, from 2026-10-14, the only currency that drops at all).
3. **A stop costs the level and heals nothing**, unlike a Respite; never on a fifth or tenth level.
4. **Provisions burn when the map starts**, abandoned or not.
5. ~~At most three reprieves per run, one held.~~ Reprieves are provisions of a third kind: up to three carried (section 17).
6. **Retry and rewind are out** (7.5).
7. **UI shape:** a strip for the pouch in the offers panel (the Wares tab was cut) (not a bottom bar); stop
   screens replace the camp view for one visit. Checked on the real-device pass.

### 14.3 The open questions, answered

1. **Recall Cord:** cut. It shortens the escape timer that makes Abandon a decision. The Ferry Token stays.
2. **Revive:** ship it, with Last Spark (35% life) and Bargain Coin (50% life, with a curse). The strength is a guess that Y0
   (7.6) corrects; Scorched Feather is cut.
3. ~~The Awlsmith when the Workbench returns~~ (not a question: nothing is designed around the Workbench).
4. ~~Counterweight versus Chalk's remove~~ (Counterweight dropped with the other specialists, 2026-10-14).
5. **Blessings:** one at a time, and the next stop's replaces it. Stacking them is power creep.
6. **The Ferryman's curse:** −15% maximum life for five levels as the first guess; Y0 sets it.
7. ~~Market gear~~ (the Quartermaster's gear is the best of four, rolled two levels up).
8. **Naming:** everything is placeholder, and the pass with the IP scan is in Y7. Taken already: Tithe, Cinderfeather, Martyr's,
   Hourglass, Locket and Hearthstone.
9. **Mobile layout:** the offers panel (see 14.2.7), tested on the real-device pass.
10. **Patch notes:** one line per milestone, as with the other plans.

---

## 15. What the independent review changed

An Opus review read the pitch and the code. What it found, and what happened to it:

| Finding                                                                                        | Result                                                                                     |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A reload gives back every consumable (it blocked everything).                                  | **Accepted by the user** (premise 2). No guard.                                            |
| The pitch said nothing about boss levels and map 100.                                          | Section 7.3: Retreat does nothing on a tenth map.                                          |
| "Tithe" duplicates Bone Dust, and the Workbench had just closed.                               | Tithe, selling, the sale cap and the Reroll Man dropped; the Market is priced in Dust (4). |
| "Win rate with and without" cannot be measured (2 in 96 wins).                                 | Paired-seed measures and a `godMode` lethal-hit count (7.6, 12).                           |
| Half the stops duplicate crafting, Chalk, gem levelling or the unique picks.                   | Cut to five (5.2, 5.3).                                                                    |
| Most provisions are utility flasks or Chalk under new names.                                   | Reframed as staples, bets and specialists (6.2); flask-like effects removed (6.3).         |
| Retry, rewind and the Hourglass cannot be built on a deterministic sim without being a reroll. | Cut (7.5).                                                                                 |
| The Recall Tag removes the 5 s escape timer.                                                   | Cut (14.3).                                                                                |
| A stop is a level without risk of death; an always-stop bot may win.                           | The `stopper` bot and its bound (5.1, 12).                                                 |
| A shared Satchel for provisions and insurance is no choice with one Reprieve per run.          | Separate slots (6, 7.1).                                                                   |
| "Ordinary mods, no new machinery" understated the plumbing.                                    | Section 10 lists a mod source, world options, the sheet, the bot cache and plan hooks.     |
| Names clash with existing uniques and a trademark.                                             | Flagged; a naming pass in Y7.                                                              |
| Missing: save version, stop status in records, auto-continue rules, phone layout, patch notes. | In sections 5.1, 9, 10 and 11.                                                             |

What the review got wrong or I qualified: the plan keeps trade-off provisions (it said defer; I think they are the part most like
a roguelike's relics, and Y3 builds only the mod-only bets first) and keeps the revive family on a measured basis rather than
dropping it. Not verified: whether degeneration and the Collapse front all pass through the one damage routine (Y4 checks), and
how quickly a skipped level is made up _(derived from the formulas, not measured)_.

---

## 16. As built, and what was measured

Everything in sections 4 to 9 is built as written, with the changes listed in 14.2 and 14.3 and the ones below. Every number is a first
guess (the user: "this is very easy to change later"). This section says what was measured, what it showed, and what was not measured.

### 16.1 What the lethal-hit count showed (`scripts/lethal.ts`, 2026-10-13)

30 bot runs (6 classes × 5 seeds, up to map 40) with the character held at 1 life on a lethal blow, 29 of which had one. This was the
test section 7.6 set before choosing a Reprieve family.

- **It did not look like the case for a Revive.** None of the 29 first lethal blows was a spike: the character had a median 5% of its
  life a second before and 19% five seconds before. Deaths are grinds, a character worn down over a long fight, not one blow from
  a healthy one. Section 7.6 said that outcome "means a Revive only delays the death and a Retreat is the right family". The
  Revive family shipped anyway (the author's call in 14.3.2, made before this number existed), and it should be read as that.
- **A Retreat covers only about half of the deaths that end runs.** 13 of the 29 (45%) came on a tenth map (a mini-boss or boss),
  where a Retreat does nothing; it saves the rest, which are ordinary maps.
- **A Revive buys little.** With Last Spark's numbers (35% life, 3 s safe), 14% of the revived characters died again within 10 s
  on the same map, and the median number of maps gained before the next lethal blow was 0: the next one usually comes on the same map,
  later. The pulse buys the fight a moment; it does not change who wins it.
- What a tuning pass could do (not done): a cheaper Revive, a Revive that also refills the flasks, or letting a Retreat work on a
  mini-boss map (not on map 100). The data says the first deaths at boss levels are the ones that matter.

### 16.2 What the bot comparison showed (`npm run sim`, paired seeds)

Three arms on the same 6 classes and seeds: `--no-wayside` (no stops, no Market, no provisions, no Reprieves; a stop is replaced by the
anchor), the default bot, and `--strategy stopper` (takes every stop it can use). Maps reached, mean over the runs:

| Difficulty and length                 | Runs per arm | No Wayside | Default bot | Stopper |
| ------------------------------------- | ------------ | ---------- | ----------- | ------- |
| The game's own (scaling 1.75), to 100 | 48           | 14.23      | 15.48       | 15.65   |
| Easier (`--legacy`), to map 40        | 36           | 34.83      | 36.19       | 35.42   |

Paired by seed, the default bot is ahead of the no-Wayside bot by 1.25 maps (7 runs better, 3 worse, of 48) and by 1.36 (9 better, 2
worse, of 36); the median difference is 0 in every comparison, so this is noise-sized at these counts and should be read as "the Wayside
does not break the bot in either direction", not as a gain. The stopper took 0.94 and 3.44 stops a run and did not beat the default
bot (acceptance 12.1, the "no more than 10 points above" bound, holds trivially). Two caveats: the no-Wayside arm still has a stop in
a slot where it plays the anchor, so on a stop level it has two maps to choose from, not three (a small bias in the Wayside's
favour); and the bots die around map 10 at the game's own difficulty, so most runs never reach a stop (the first is at level 9).

Speed: the bot's runs are about as fast with the Wayside as without (most classes within 10%); the two speed tests in `npm run check`
(`x9`, and the bot's 150× floor) fail when the machine is busy with something else and pass when it is not.

### 16.3 The acceptance criteria of section 12, scored

| #   | Criterion                                                                                                 | Result                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Stops: a stopper stays within 10 points of the anchor                                                     | Met (16.2).                                                                                                                                                |
| 2   | The Market: Dust held under three levels of income, no ware in more than 60% of visits                    | **Cut with the Market** (2026-10-14).                                                                                                                      |
| 3   | Provisions: staples lift maps reached by a bounded amount, bets are neither always right nor always wrong | **Not measured.** The bot arms only staples; bets and specialists were tested by unit tests (their numbers move the sheet as written) and not by bot runs. |
| 4   | Reprieves: the paired effect of each item                                                                 | **Partly:** the Revive's effect from `lethal.ts` (16.1); the Retreat's and the items' effect in whole bot runs was not run.                                |
| 5   | No new input, headless                                                                                    | Met: the simulation modules read no clock and no `Math.random`; `npm run check` enforces it.                                                               |
| 6   | Determinism: stock, schedule and stop rolls from the seed                                                 | Met: tested (`sale.test.ts`, `stops.test.ts`).                                                                                                             |
| 7   | Boss rules                                                                                                | Met: tested (`reprieve.test.ts`: a Retreat on maps 10, 20 and 100, a Revive on map 10).                                                                    |
| 8   | Phones: every stop screen and the Satchel fit 375 px                                                      | Met, checked in the browser with no horizontal overflow; the real-device pass is still open (MOBILE.md).                                                   |

### 16.4 Built differently from the plan, or not built

- Not built: the "Arm the best for this map" button, the second "without" verdict line on an offer card, a Reprieve policy seam
  (section 7 and WAYSIDE-QUESTIONS.md), the line on a stop card of what the skipped level would have paid, and a way for the bot to arm bets and specialists.
- Built differently: reward picks can hold a Reprieve or a provision as a `PouchCard` (the plan said so but not how); Counterweight
  cancels the worst affix and does not ask (14.3); Hunter's Bell is three extra rare packs; the Bargain Coin's curse starts when it
  fires; the Ferryman's curse starts at once.
- Names were checked against every unique, flask, gem, currency, affix, base, theme and boss name in the game: no clashes (the word
  "haste" was a deny-list hit and the Shrine's blessing is now "Swiftness"; "Swift" and "Shrinekeeper Mask" are loose substring
  matches only).

### 16.5 The Market was cut (2026-10-14)

The user, after trying the build: the Wares tab "adds too much overhead to the overall play loop. Nobody wants to sort through more
gear to see if they want it after every short level." It was removed: `src/ui/Wares.tsx`, the Wares tab and its tip, the per-level
stock (`rollMarket`, `ensureMarket`, `wayside.market`, `wayside.marketLevel`), buying at camp (`buyWare`, `Controller.buy`), the
Market's Reprieve sale (`reprieveOnSale`) and the bot's shopping (`botShop`, now `botArm`, which only arms staples). The Quartermaster's
stock generator, which shared that code, lives on as `src/data/sale.ts` and `src/run/sale.ts` (the files were renamed from
`market`), and the stop's price is now the plain price (there is no Market to be a quarter under).

What this changes, plainly:

- **Bone Dust has one sink again: the Quartermaster**, a stop about once in two dozen levels. Salvaging still pays Dust and Clean up still
  says so, so most Dust will pile up unspent until the Workbench returns or a Quartermaster comes. If that feels empty, the options are
  a cheaper, more frequent Quartermaster, or letting the Awlsmith take Dust for sockets instead of Augers.
- **Provisions are scarcer:** only the Quartermaster (three of its twelve wares) and a fifth map's reward pick (30%) give them, so the
  Satchel will often be empty. The default bot, which only armed staples it had bought, now arms what a pick gave it.
- **A Reprieve now comes only from** the Quartermaster, the Ferryman, or a boss level's pick.
- The Quartermaster still lays out three rares, which is the sorting the user did not want after every level; it is one stop in
  about eight, it costs the level, and it is the player's choice to enter. Dropping gear from its stock is one line in `sale.ts`
  if that is still too much.
- The measurements in 16.2 were taken with the Market in place and were not repeated.

---

## 17. The second round of feedback (2026-10-14): what changed

The user played the first ten levels, saw none of these systems, and sent nine points. Where this section disagrees with sections 1 to 16,
it wins; the sections above are corrected where it was cheap and otherwise kept as the plan as it was.

| #   | The user said                                                                                                                                                                                                                          | What was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Nothing makes the character stronger than the tree and gear can" is not a good principle: temporary power beyond an item is fine, and a shop should be able to sell something as good as the best drops. "Decent, not best" is silly. | Principle 3 is rewritten (3, above). The Quartermaster's gear is the best of four rares rolled at the item level of an offer two levels up (`GEAR_CANDIDATES`, `GEAR_ILVL_BONUS`; "best" by the sum of the affix tiers).                                                                                                                                                                                                                                                                                                |
| 2   | "Does not fight the Workbench" is flawed: both have limited access, so overlap is fine.                                                                                                                                                | Principle 6 and section 4.4 are dropped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3   | The user said the Workbench is closed and not to design around it; the design seemed to design around it.                                                                                                                              | Premise 1 is reworded: design as though it did not exist, and overlap is fine.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 4   | A special currency (Socket Augers) just for the Awlsmith makes no sense. Drop all currencies but Bone Dust for now, and make sure they do not drop.                                                                                    | The Awlsmith's further sockets cost Bone Dust (4th 40, 5th 120, 6th 300; the first is free). `CURRENCY_DROPS = false` (`data/constants.ts`): no currency drops from monsters, from a Quarry champion or in reward picks, and the Quartermaster sells none. The currency code, the Workbench and their tests are untouched, for when crafting returns. Currency already in a save stays there.                                                                                                                           |
| 5   | Shrine blessings should be 50 to 100% stronger: below one passive node there is no reason to visit.                                                                                                                                    | About 75% stronger: +22% maximum life, +15% damage, +26% all resistances, +18% movement speed, +36% armour and evasion, +18% item quantity, +15% attack and cast speed.                                                                                                                                                                                                                                                                                                                                                 |
| 6   | The pouch of six is generous: three, any or all armed. Reprieves should be a special type of provision, so the player may hold up to three.                                                                                            | `POUCH_LIMIT` and `PROVISIONS_PER_MAP` are 3. A reprieve is a provision of kind `reprieve`: in the pouch, never armed, always ready, used up when it fires. The slot, the run cap and the swap at the Ferryman are gone; a save made with a reprieve in its old slot carries it in the pouch. Several carried are used in order (a revive before a retreat).                                                                                                                                                            |
| 7   | The specialist provisions are too specialist: drop them.                                                                                                                                                                               | Slow Fuse, Bonebreaker and Counterweight are gone, with their hooks (the Crescendo pace, the cancelled affix on the card).                                                                                                                                                                                                                                                                                                                                                                                              |
| 8   | Ferry Token, Last Spark and Bargain Coin should all refill the potions.                                                                                                                                                                | Every reprieve refills all flasks when it fires (a retreat arrives in camp with full flasks).                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 9   | No sign of any of these systems in the first ten levels: they should start around level 5 and be a standard part of the game.                                                                                                          | Stops come from level 6, one in every window of five levels (about eighteen a run; the first before level 10; never on a fifth or tenth level, where a pick or a gate is due). A cleared map may leave a provision in the pouch from level 3 (40%; the first time for certain). Every reward pick may hold a provision card (40%) or a reprieve card (30%; 60% on a boss level's pick), from the pick at level 5. Reprieves are for sale and given from level 5 or 6, and provisions turn up from level 1 to 5 by kind. |

### 17.1 Consequences worth knowing

- **Stops are common now, and each costs a level.** At about one level in five, a player who takes every one gives up a fifth of the run's
  XP and loot. They are offers, never forced, and the `stopper` bot comparison of 16.2 was made at one in eight; it has not been repeated.
- **The first stop can be a Ferryman with a full pouch.** The schedule does not look at the pouch, so a Ferryman met with three provisions
  carried cannot give its reprieve (the screen says why). Arming and using provisions first makes room.
- **Dust has two sinks:** the Awlsmith's further sockets and the Quartermaster.
- **Provisions are common enough that the pouch will usually be full.** With three held, a find is lost (nothing is dropped, the pouch is
  simply full), so the player is nudged to arm and spend them. Not measured.
- **The measurements of section 16 are stale** (they were taken with the old rates, the Market, a single reprieve slot and the specialists).

### 17.2 Twice as many stops (2026-10-15)

Players found stops rare. Each window of five levels now holds two stops (`STOPS_PER_WINDOW`, `stopLevels` in `offers.ts`), on levels that are not fifths or tenths and never next to each other, so about two levels in five. A player who takes every one gives up two fifths of the run's XP and loot; the `stopper` bot comparison has not been repeated at this density.
