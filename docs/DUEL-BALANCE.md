# Bob — Duel balance: reprieves, a life curve and the end of a fight

Status: **B0 to B4 built and measured (2026-10-20, section 8.1); the cap's target is missed and the tuning is the owner's. The `duels` table's new rules (docs/rivals.sql 9) wait for
the owner's go-ahead before they are applied to the live database** · Owner: the user · Author: Claude

The duels of [DUEL.md](DUEL.md) (rivals after a run, "Duel for your damned soul's fate") are decided by damage. A character in
a duel has the life it has on a map, but its opponent hits like a character and not like a monster, so a fight is a race of a
few hits. The only lever is `DUEL_DAMAGE_SCALE` (×0.3 on all damage a character takes, section 4.3), and F4 left its open
question unanswered: the median fight was 44 s at map 5 and 10 s at maps 15 and 20, so no single scale fits every level
(DUEL.md 4.4). The rated fight is the first fight of a pair, so a fight decided by the first exchange decides a rating.

This plan changes four things, one of which the main game needs anyway:

1. **Three reprieves for each side** in every duel: a duel shows a run's real play, where a character carries reprieves, and a
   fight that one bad exchange decided becomes a fight of four lives.
2. **A way to see a reprieve fire**, on a map and in a duel. Today a reprieve fires with no effect on screen: the
   `'reprieve'` event is read by nothing in `render` or `ui`.
3. **A life curve:** each character's life and energy shield are multiplied by a factor from 1 at level 1 to 10 at level
   100, read from the **opponent's** level, which gives the lower-level character a small edge.
4. **The end rules:** a longer time cap, and a cap broken by the reprieves left; and every duel starts at 1× speed.

Conventions follow DESIGN.md and DUEL.md: every number is a first guess and tunable; `sim` and `run` stay headless; in-game
text is concise. Decisions go in DESIGN.md Appendix A when built (section 8.3).

---

## 1. Premises (the user, 2026-10-20)

- Post-game balance leans to damage over life, most of all late in the game. Life is scaled up in duels; the curve begins at
  1× at level 1 and reaches 10× at level 100.
- **The curve is read from the opponent's level** ("this curve should set the opponent's HP multiplier, and thus give a small
  advantage to lower-level characters").
- Each side has three reprieves, all of them Bargain Coins.
- A reprieve that fires must be seen. The main game needs this as much as the duel.
- Minion builds get no special treatment: minion life is scaled on the tree, and building for it is part of a minion build.
- A tie is an acceptable result. A low-life build is a deliberate choice and must not lose a close fight for it.
- People mostly want to watch duels, and some are over fast, so every duel starts at 1× speed.
- The rated fight stays the first fight of each pair, with no limit on how many rivals are fought.

---

## 2. The duel reprieve: Bargain Coin

Each side carries **three Bargain Coins** (`bargainCoin`, `src/data/reprieves.ts`), the reprieve as it is in the game:

- it fires when damage would kill;
- it sets life to 50% of the maximum and refills the flasks;
- the character cannot be hurt for 1.5 s.

Notes on the reuse:

- **Its curse does not apply.** The curse ("Ferryman's Bargain", 15% less life for five levels) is laid on the run by
  `src/run/reprieves.ts` after a map ends. A duel ends in `duelEnd` and never reaches the run's map flow (DUEL.md 5), so the
  curse is never laid. The duel's own code adds nothing for it.
- **Wiring.** `Side.reprieve` and `SideOpts.reprieves` already exist. `createDuelWorld` passes
  `reprieves: ['bargainCoin', 'bargainCoin', 'bargainCoin']` (`DUEL_REPRIEVES = 3`) to both sides, and `reprieveFires` does the
  rest.
  - It is a `revive`, so `nextReprieve`'s check for a Retreat on a tenth map never applies.
  - `duelEnd` reads `player.alive`, and a reprieve stops the death before that is set. So "a death" stays the end: the fourth
    one.
- **Life only.** As on a map, the reprieve sets life and leaves energy shield at zero, where it was (life is hit only once the
  shield is gone). The shield then recharges as usual.
- **The stall rule** (15 s without damage) is not tripped by 1.5 s of invulnerability and needs no change.
- **Text.** DUEL.md 4.1 and 4.3 ("reprieves are not brought, so a death is a death") change when this is built.

---

## 3. Seeing a reprieve fire (map and duel)

This milestone (B0) comes first and stands alone: it improves the main game whatever happens to the rest of the plan.

- **The event says whose reprieve it is.** `{ t: 'reprieve'; how; id }` gets `src` (the character's actor id), as
  `levelUp` has, so that the renderer finds the side with `sideOf(world, e.src)`. On a map it is always side 0.
- **A Revive** (Last Spark, Bargain Coin), in `grim/index.ts`, beside `levelUp`:
  - a burst at the character: a pale flash, motes rising, and a short ring;
  - **a ward drawn while `invulnT > 0`:** a faint shell around the figure that thins as the seconds run out. It is drawn from
    the side's state every frame, not from the event, so a paused or sped-up game shows it correctly;
  - hits that land in that window show "Immune" instead of a number, so the player sees why a big hit did nothing.
- **Last Spark's throw-back:** a ring that grows to `PULSE_RADIUS` (6 tiles), matching the monsters knocked back.
- **A Retreat** (Ferry Token): the figure fades out in a column of light; the map's end screen follows as now.
- **HUD on a map.** `ReprieveBadge` already marks a used reprieve as "<name> used"; a one-second flash on that badge when it
  happens ties the effect to the item.
- **HUD in a duel.**
  - Three pips beside the player's life orb, emptied one by one. Today the badge is hidden in a duel (`!duel`); the pips
    replace it there, since the three are all the same.
  - Three pips on the rival's boss bar.
- **Result screen.** One line per side: "Reprieves used 2 of 3".

---

## 4. The life curve

### 4.1 The curve and whose level reads it

`m(L) = 1 + 9 × (L − 1) / 99`: a straight line from 1 at level 1 to 10 at level 100 (`duelLifeMult`, `src/data/constants.ts`
for its two ends). Each side's life and energy shield are multiplied by **m of the other side's level**:

```
lifeMult(A) = m(level of B)        lifeMult(B) = m(level of A)
```

Equal levels give equal factors. In a gap, the lower-level character gets the larger factor, and the higher-level one the
smaller. That is the edge the user asked for. Equivalently, the higher-level character's hits count for less, by `m` of its own
level.

Worked example, level 30 against level 70:

- the level 30 character has `m(70)` = 7.27× life;
- the level 70 character has `m(30)` = 3.64× life;
- so, measured against its own life, the level 30 character can take twice as much.

The size of the edge, for the gaps the rivals screen offers (±10 maps, and the level is close to the map):

| Levels | m (lower, higher) | Lower character's edge in life |
| ------ | ----------------- | ------------------------------ |
| 10, 20 | 1.82, 2.73        | 1.50×                          |
| 20, 30 | 2.73, 3.64        | 1.33×                          |
| 40, 50 | 4.55, 5.45        | 1.20×                          |
| 80, 90 | 8.18, 9.09        | 1.11×                          |

On a straight line the edge is largest at low levels, where a ten-level gap is also a large gap in power, and shrinks late.
A curve rising faster at the end, `10^((L − 1)/99)`, gives a flat 1.26× for every ten levels and only 3.1× at level 50 (5.5× on
the line). The line is the default (decision 2).

### 4.2 How "more life" is built: the pool

The maximum life and energy shield of each side's character are multiplied (decision 3). Compared with dividing the damage
taken, which gives the same time to kill:

- recovery that is a share of the maximum (regeneration of life, ES recharge, the reprieve's 50%) weighs the same against the
  damage either way;
- **flat recovery** (flasks, life on hit, flat regeneration, leech by amount) keeps its value per second against the damage, as
  on a map, and is a smaller share of the larger pool. Dividing the damage instead would make it up to 10× stronger late in the
  game.

How it is built:

- **A side's field, `Side.lifeMult`** (1 on a map), applied in the one place the sim makes a character's defence:
  `refreshPlayerDefence` (`src/sim/combat.ts`), which builds `p.def` from the sheet. It multiplies `maxLife` and `maxEs`
  there, so the 108 reads of `def.maxLife` and `def.maxEs` in 25 files of `src/sim` all see the larger pool without being
  touched: `lifeCap`, the low-life and full-life checks, the reprieve's 50%, the starting vitals, the HUD and the boss bar.
- It is **not a mod**: the sheet, the Skills tab and the Character tab show the character as it is.
- **The audit is of the reads that must not scale.** Those are a hit's damage taken from the attacker's own maximum life or
  shield, and a flat amount the sheet stored as a share of life. Each one found is listed in the commit with a test. The
  multiplier gives toughness, not damage.
- **Regeneration that the sheet already turned into a number per second** (a share of life computed at sheet time) is
  multiplied too: it is a share of the pool. Life on hit and the flask amounts are not.
- **Minions are not multiplied** (decision 4). Their life is the build's business, through the tree, as on a map.
  - B4 reports how minion builds fare. Already today a minion takes full damage while its owner takes ×0.3.
  - With the curve, the characters last longer and the minions do not.

### 4.3 The ×0.3 damage scale stays, under the curve

`DUEL_DAMAGE_SCALE = 0.3` (`src/data/constants.ts`) is in the game today:

- it was added with the duel rules (DUEL.md 4.4, F4, 2026-10-16);
- in a duel, a character takes 30% of the damage of every hit, burst and tick of damage over time;
- minions, ailments and stun are not scaled.

It was chosen because at ×1 the median fight among bot builds was 6 s and the first hit decided it; at ×0.3 the medians were
16 s and 25 s, though they still fell by a factor of four to five from map 5 to map 20.

The curve multiplies today's fight, ×0.3 included, so level 1 duels play as they do now plus the reprieves. Against the
unscaled game, level 100 is 10 / 0.3 ≈ 33× as tough. Whether ×0.3 should then go, or fall with the level, is what the
measurement (B4) answers (decision 5).

---

## 5. The end of a fight

Four lives and up to ten times the life make the 90 s cap (`DUEL_MAX_TIME`) too short. At map 20, F4's median of 10 s becomes
roughly 10 × 2.5 (the reprieves) × 2.7 (the curve at level 20) ≈ 65 s, and later maps grow more.

- **The cap is set by measurement** (B4) so that 5% or fewer of the fights reach it. The first guess is 180 s.
- **At the cap, the side that used fewer reprieves wins** (decision 6). With the same number used, it is a draw.
  - Life left is not counted. A build may run with little life on purpose, and it should not lose a close fight for it.
  - The result says "Won on time: fewer reprieves used", or "A draw: time ran out" as now.
- **The stall** (15 s with no damage to either side) stays a draw.
- **Both falling in one tick** stays a draw.
- The server's Elo needs no change: it already takes a win, a loss or a draw.

### 5.1 Every duel starts at 1×

The speed (`Controller.speed`) carries over from the run's maps today, so a duel started after a run played at 8× is over
before it is seen.

- `startDuel` sets the speed to 1× and unpauses. Every start goes through it: a rival's fight, **Again**, and the Debug
  panel's duels.
- The speed controls work as they do in the duel.
- Leaving a duel (Back, Leave) puts back the speed the run had, so a Debug duel from camp does not change the run's maps.

---

## 6. The rated fight

Unchanged: the first fight of a pair (the player's snapshot and the rival) is rated, and "Again" and every later fight against
that rival are practice. Any number of different rivals may be fought, each rated once (decision 7). One fight with four lives a
side does much of what a series would. A best of three would need a seed per game in `duels` (it has `unique (a_id, b_id)` and
a seed forced from the pair), a migration and a new rule for the verifier, for three times the watching per rating.

Save version 20's **4 rated duels**, played under the current rules, are left as they are (decision 8).

The duel rules are part of the game version, so the nightly verifier (DUEL.md 13), when it exists, replays each fight under its
own rules.

---

## 7. Milestones

| #      | What                                                                                                                                                                     | Done when                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **B0** | A reprieve is seen (section 3): the event carries `src`; the revive burst, the ward while invulnerable, "Immune", the throw-back ring, the retreat fade, the badge flash | Seen in the browser on a map with each of the three reprieves (Debug panel); the sim's results unchanged (the event hash fence apart from the new field)                                               |
| **B1** | Three Bargain Coins a side (section 2), pips for both sides, the result line; duels start at 1× (5.1)                                                                    | A duel test: a character that would die three times stands up three times and falls on the fourth, with no curse; mirrored builds stay fair over seeds (the F4 check); a controller test for the speed |
| **B2** | The life curve (section 4): `duelLifeMult`, `Side.lifeMult` from the opponent's level, scaled in `refreshPlayerDefence`, the audit of reads that must not scale          | Tests: equal levels get equal factors, a gap favours the lower level, a flask heals the same amount, the 50% is of the larger pool, the sheet's numbers unchanged, minions unscaled                    |
| **B3** | The end rules (section 5): the cap's tie-break by reprieves, the result's line, `DUEL_MAX_TIME` provisional at 180                                                       | A duel test for each case: fewer reprieves wins, equal is a draw                                                                                                                                       |
| **B4** | **One measurement** (8.1), then the defaults set from it                                                                                                                 | The numbers in section 8.1 against their targets, written into DUEL.md 4.4; DESIGN.md Appendix A; DUEL.md 4.1, 4.3 and 12 updated                                                                      |

B0 can ship by itself; so can the 1× start. B1 to B3 change the duel together and are released together after B4: a duel with
three reprieves and no curve would be longer but still a race of damage.

The new snapshots and the rival pool are untouched: nothing here changes what a snapshot holds, so no save-version bump and no
reseeding.

---

## 8. Measurement and decisions

### 8.1 The one measurement (B4)

The F4 method (`playDuel`, `scripts/duel.ts`). The builds are **the 54 bot characters seeded for save version 20** (levels 8
to 91, from the dump files the seeding wrote), paired as the rivals screen pairs them (±10 maps), a few seeds each, both
orders. One run, at the end, per the standing rule. It reports:

| Measure                                                      | Target (first guess)                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Median fight length per band of ten levels                   | 30 to 90 s in every band (today 44 s at map 5, 10 s at 20)       |
| Share of fights reaching the cap, and of those, decided      | 5% or fewer reach it                                             |
| Win share of the lower-level side at a gap of 5 to 10 levels | Reported, with the same pairs at ×1 life for comparison          |
| Win share of the side that lands the first hit               | Lower than at today's rules (it is the problem this plan is for) |
| Win share of minion builds                                   | Reported                                                         |
| Mirrored builds, side 0's wins                               | Within the F4 fairness band                                      |

If the medians still fall steeply with the level, the next lever is the ×0.3 itself (decision 5), not a steeper life curve.

**Measured, 2026-10-20** (`scripts/duel-balance.ts`): the 54 bot rivals of save version 20 (levels 8 to 91), every pair within
10 maps (532), both orders, seeds 1 and 2, under the new rules, the new rules with the curve off ("flat"), and F4's ("old": no
reprieves, no curve, 90 s), plus each build against itself on six seeds: 6,708 fights.

| Band (mean level) | Fights | New: median, on the cap (decided)                        | Flat  | Old   |
| ----------------- | ------ | -------------------------------------------------------- | ----- | ----- |
| 0–9               | 12     | 180 s, 75% (all decided)                                 | 150 s | 44 s  |
| 10–19             | 172    | 46 s, 14% (79%)                                          | 20 s  | 7.2 s |
| 20–29             | 832    | 34 s, 5% (70%)                                           | 17 s  | 6.0 s |
| 30–39             | 652    | 91 s, 28% (67%)                                          | 29 s  | 8.5 s |
| 40–49             | 324    | 104 s, 31% (65%)                                         | 28 s  | 9.5 s |
| 50–59             | 80     | 106 s, 38% (70%)                                         | 27 s  | 10 s  |
| 60–69             | 44     | 54 s, 20% (22%)                                          | 24 s  | 8.5 s |
| 70–79             | 12     | 28 s, 33% (all decided)                                  | 15 s  | 5.7 s |
| **All**           | 2,128  | **57 s; 81% a death, 13% won on time, 6% drawn on time** | 22 s  | 7.4 s |

| Measure                                          | New             | Flat            | Old             | Target                    |
| ------------------------------------------------ | --------------- | --------------- | --------------- | ------------------------- |
| On the cap                                       | 19%             | 6%              | 2%              | 5% or fewer: **missed**   |
| Lower level's score, gap 1–4 / 5–10 / 11+ levels | 40% / 22% / 16% | 39% / 23% / 16% | 40% / 24% / 18% | reported                  |
| Score of the side whose damage landed first      | 44%             | 45%             | 47%             | lower than old: met       |
| Score of a minion build against one without      | 42%             | 45%             | 49%             | reported                  |
| Mirrored builds: side 0 won / side 1 won / drawn | 84 / 69 / 171   |                 |                 | within ±18.6 of 76.5: met |

What it says:

- **Fights are four to eight times as long as F4's**, and the medians no longer fall with the level: they are 34 to 46 s up to
  level 30 and 91 to 106 s at levels 30 to 59. But a fifth of the fights reach the cap (a third at levels 30 to 59), so the cap's
  target is missed at 180 s, and data cut at the cap cannot say what cap would meet it.
- **The life curve gives the lower level almost nothing** that can be seen: a gap of 5 to 10 levels between bot builds is a gap in
  power (the lower one scores 22% under every rule), and the 1.1× to 1.5× edge in life does not close it.
- **The first hit no longer decides**, though in these builds it did not decide under F4's rules either (47%).
- **Minion builds fall from 49% to 42%** against the others, as section 9 expected: the characters' life grows and the minions'
  does not.
- **A mirror is a draw half the time**: the same build on both sides uses as many reprieves and runs out the clock.
- Three in four fights see one side use all three reprieves.

The levers, for the owner: a longer cap (180 s is three minutes at 1×), a larger damage scale under the curve (×0.3 was chosen
for a fight with one life and no curve; the "flat" column is the curve's whole effect on length), or a gentler curve. Until then
the defaults stand as built: 180 s, ×0.3, the straight line to 10×.

### 8.2 Decisions

| #   | Decision                   | Settled (the owner, 2026-10-20, unless marked default)                                      |
| --- | -------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | The duel reprieve          | **Bargain Coin**, three a side; its curse does not reach a duel                             |
| 2   | The curve's shape          | A straight line, 1× at level 1 to 10× at level 100 (default)                                |
| 3   | How more life is built     | **The pool:** maximum life and ES multiplied, flat recovery not                             |
| 4   | Minions                    | **Not multiplied:** minion life is the build's, through the tree                            |
| 5   | The ×0.3 damage scale      | Kept, under the curve, until B4 measures (default)                                          |
| 6   | The time cap               | **Fewer reprieves used wins; otherwise a draw.** Life left is not counted. 180 s, set by B4 |
| 7   | Rated fights               | **The first fight of a pair, as now**                                                       |
| 8   | Version 20's 4 rated duels | **Left as they are**                                                                        |
| 9   | Speed                      | **Every duel starts at 1×**; leaving puts back the run's speed                              |

### 8.3 Edits to DESIGN.md and DUEL.md when built

- DESIGN.md Appendix A, dated: a duel brings three Bargain Coins for each side; life and ES are multiplied by the curve of the
  opponent's level, minions not; the cap is broken by the reprieves used; duels start at 1×; the measured defaults.
- DUEL.md 4.1 and 4.3 (reprieves are brought, the cap's tie-break), 4.4 (the life curve beside the damage scale), 5 (the 1×
  start), and 12 (decisions 3, 4 and 6 of that table).

---

## 9. Risks

| Risk                                                                                                     | Fence                                                                                            |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Something that should stay flat scales with the pool (a hit that deals damage from its own maximum life) | The audit of B2, listed in the commit, with a test per kind                                      |
| The multiplier leaks onto a map                                                                          | It is a duel option, 1 by default; the event hash fence on a map                                 |
| Fights get long and dull to watch                                                                        | The B4 targets; the cap; the speed controls                                                      |
| Late duels become about recovery instead of damage                                                       | The pool approach keeps flat recovery at its map value; B4 reports the winners' recovery sources |
| Minion builds fall behind as the characters' life grows and theirs does not                              | B4 reports their win share; the owner's call whether that is a problem                           |
| The new rules move ratings that were set under the old ones                                              | Few rated duels so far (decision 8); the server's rules are unchanged                            |
