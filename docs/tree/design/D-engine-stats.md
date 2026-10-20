# D. Three candidate engine stats, investigated

Read 2026-10-19 against `src/data/gemsGen.ts`, `src/data/buffs.ts`, `src/calc/{character,skill,deploy,deployed,minionDps,reach}.ts`,
`src/sim/{utility,ai,deploy,minions,minionFx,combat,charges,cooldowns,buffs}.ts`. Read-only; no sims run. Line numbers are of that day.

**Summary.** (1) Warcries: add **warcry buff effect** (`warcryEffect`, the `auraEffect` pattern, half a day); do not add a duration
stat, `skillDuration` tagged `warcry` already lengthens a warcry in the sim, and the sheet needs three lines to see it. (2) Traps and
mines: **skip both**; trigger area is invisible (traps land inside their own trigger radius) and detonation speed moves 0.25 s of an
0.85 s cycle; the area has eight sim-real stats already. (3) Minions: **skip both**; minions never miss (raw hits, no accuracy roll),
so accuracy is new sim behaviour, and the movement half of a speed split has no sheet reader. Dead nodes found on the way: `skillDuration`
tagged `mine` (4 nodes; a mine's life ignores it, one line in `calc/deploy.ts` 33 would fix that), `aoe` tagged `minion` (minion splash
is a fixed field), and `cooldownRecovery` tagged `warcry` (utility cooldowns are never scaled). A2 §4 should move "warcry cooldown
recovery" out of bucket A.

---

## 1. Warcry duration and warcry buff effect

**Today.** Four warcry gems (`gemsGen.ts` 3600-3720, 3895-3930): Steadfast Bellow (buff `enduringCry`, 8 s, cooldown 4, `lifeRegen` 8-60),
Rallying Roar (buff `rallyingCry`, 8 s, cooldown 4, `damage` inc 24-40% and `manaRegenFlat`), Graveyard Bellow (a `shout`: statuses
`hinder` and `doomed` on enemies within 4 tiles, cooldown 4) and Deathless Call (a guard with the `warcry` tag, 1 s). All carry the
`duration` tag. The buff's effects are the gem's own `utility.mods`, not `buffs.ts` (`BUFFS.rallyingCry.mods` is empty, `gem: true`,
`buffs.ts` 393-400); the character folds them into its db behind the buff's condition (`character.ts` 1099-1112), and the sim reads
that same db live, so whatever scales them there reaches the fight for free.

- Duration in the sim: `buffT = u.seconds × db.mult('buffDuration') × act.profile.skillDuration` (`utility.ts` 367-370; shout statuses
  likewise, 331). `profile.skillDuration` is `db.mult('skillDuration', baseCtx)` with the skill's tags (`skill.ts` 378-382, 610), so
  **`skillDuration` tagged `warcry` is a sim-real warcry duration today.** `buffDuration` is read with no tags (`utility.ts` 369,
  `buffs.ts` 33) and `ModDB.matches` needs every mod tag on the use (`modDb.ts` 107), so a _tagged_ `buffDuration` would be dead.
- Duration on the sheet: uptime = `min(1, seconds × buffDuration / cooldown)` (`character.ts` 1103-1106) ignores `skillDuration`,
  and 8 s / 4 s is already capped at 1 for both rally cries; `utilityLoadFor` budgets a recast every `max(cooldown, seconds)` with raw
  seconds (2146-2149); the skill bar's total is `seconds × buffDuration` (`ui/skillStatus.ts` 178). Three lines to make the existing
  stat honest; nothing new to add.
- Cooldown: a warcry's `u.cooldown` is stored raw (`utility.ts` 85, 176; `ai.ts` 537), and `cooldownSeconds` scales only a gem's
  top-level `skill.cooldown` (`cooldowns.ts` 17), which no warcry has. **`cooldownRecovery` tagged `warcry` does nothing today.** All
  warcries also share a fixed 4 s lockout (`WARCRY_SECONDS`, `utility.ts` 40, 321).
- Effect: no stat. `auraEffect` is the precedent: one `db0.mult` and one `value: m.value * auraEffect` at fold-in (`character.ts`
  987, 1051).

**What adding takes.** `warcryEffect` (inc): `character.ts` 1108 multiply `gemMods(u.mods, ...)` values when `a.skill.tags` has
`warcry` (4 lines, incl. the `second` buff); `utility.ts` 325-328 scale a shout's status `v` (2 lines); `statText.ts` one entry and
the `warcry` tag text exists (482); one test in `treeStats.test.ts` or `keystones2.test.ts` (profile with Rallying Roar up, damage
doubles with 100% effect) and one in `buffs.test.ts` for the shout. About 25 lines, half a day. One decision: Deathless Call carries
the `warcry` tag and its mod is `hitTaken more -25..-35`; a 100% effect node would make that -50..-70% less, a different kind of
node, so exclude `policy: 'guard'` at the fold point unless that is wanted. A duration stat: nothing, use `skillDuration` tagged
`warcry` and fix the three sheet lines above.

**What the area already has (sim-real, distinct).** Warcry-tagged: `skillDuration` (sim yes, sheet after the fix), `cost` (`skill.ts`
626). `castSpeed` is live but 0.25 s cast times make it noise; `aoe` is dead (shout radius `u.radius` is read raw, `utility.ts` 80,
323); `cooldownRecovery` dead (above); `chargeOn.cast.grit` tagged `warcry` dead (`rollCharges` asks with `playerCtx` tags 0,
`charges.ts` 107-110; the gem's own mods come in untagged via `p.gains`, `character.ts` 1486). Grit side: `maxCharges.grit`,
`chargeOn.<kill|block|hitTaken|...>.grit`, `per: charges.grit` on damage, armour or `lifeRegenPct`, `chargeDuration.grit` (sim only).
18 grit nodes exist today. So the area has 4-5 grit stats and 2 warcry stats before any change; `warcryEffect` makes a third and is
the only warcry stat that moves a sheet row (Rallying Roar's damage, Steadfast's regen).

**Visible in play?** The AI casts a rally warcry when 3+ enemies are within 7 tiles or the target is rare or bigger (`utility.ts`
168-170; PLAYER-AI table), recasts when under 0.55 s is left (163-164), and the buff (8 s) outlasts its cooldown (4 s), so uptime in a
fight is already near full. More duration saves one 0.25 s cast and its mana every 8 s and carries the buff across pack gaps; the
steady sheet counts the buff as up either way (uptime ≥ 0.5 keeps full value, `character.ts` 1110). More effect is a straight
multiplier on 24-40% damage or 8-60 regen while the buff is up: visible on the sheet and in the fight.

**Recommendation.** Add `warcryEffect` (half a day, `auraEffect` pattern). Skip a warcry duration stat: `skillDuration` tagged
`warcry` already does it in the sim; spend the three lines on the sheet's uptime, load and skill bar instead. Note in A2 §4 that
`cooldownRecovery` tagged `warcry` is dead; if a cooldown node is wanted, scaling `pick.cd` by `prof.cooldownRecovery` at `ai.ts` 537
is one line, though the shared 4 s lockout then caps it.

---

## 2. Trap trigger area and mine detonation speed

**Today.** Nine trap skills and four mine skills (`gemsGen.ts` 5060-5530), plus mine supports (Chained Charges, Heavy Charge, Field
of Charges, Static Mines). A set of `deployCount` traps or mines lands in a ring `RING_APART = 1.2` tiles round the target
(`sim/deploy.ts` 78, 86-96, 271-283); a trap arms in 0.3 s (245) then springs on the nearest foe within `TRAP_RADIUS = 1.6` (70,
623), a skitterbot at 4× that (630). A mine arms in `MINE_ARM = 0.6` (72, 245), is set off by a foe within `MINE_RADIUS = 3.5` (588),
and goes `c.skill.detonation ?? 0.25` s later, chained ones `CHAIN_GAP = 0.25` apart (73-75, 361-366); Mortar Charge sets 0.35
(`gemsGen.ts` 5450). The sheet mirrors the mine timing: `mineLife = MINE_ARM + detonation` (`calc/deployed.ts` 24-26, 94-96) and
counts every trap as landing on the target (`sheetVsSim.deploy.test.ts` 174).

**What adding takes.** Trigger area: a profile field (`skill.ts`), `TRAP_RADIUS × mult` at `deploy.ts` 623, text, no sheet reader
(the sheet has no trap geometry); ~10 lines. Detonation speed: profile field, `det / mult` at `deploy.ts` 361, `deployed.ts` 95,
text, a `sheetVsSim.deploy` case; ~20 lines, half a day. Both are cheap; neither is worth it (next two points).

**Visible in play?** Trigger area: the target stands 1.2 tiles from every trap in its ring, inside the 1.6 trigger radius, so a
trap springs on its first armed tick unless the target moved more than 0.4 tiles away in 0.3 s. A wider radius only matters for a
trap whose target died or left before it armed. A2 §4 already lists "trap trigger radius" in bucket D ("a trap's trigger is where
the AI threw it"); it should not also be in bucket B. Detonation speed: the stat would move 0.25 s of an 0.85 s land-to-blast cycle
(0.6 of it is arming), and the AI only waits on the cycle when all `deployCount × 3` sets are out (`deployFull`, `deploy.ts` 151-154,
`calc/deploy.ts` 18-25). A 50% node is worth a few percent of mine throughput, under the sheet's rounding.

**What the area already has (sim-real, distinct).** Tagged `trap` or `mine`: `damage`, `aoe`, `critChance`, `critMulti`,
`castSpeed` (throwing speed), `deployCount`, `penetration`, `cost`, `reducedReservation` (mine), and the base stats `mine.chain`,
`mine.double` (`skill.ts` 607-608), read from the db so a tree node can carry them. Nine to eleven. `deploySeconds` is read from the
db too (606) but it is an override, not an addition (`calc/deploy.ts` 28-33: `prof.deploySeconds > 0 ? prof.deploySeconds : ...`),
so it stays a gem field. **Dead for mine life today:** `skillDuration` tagged `mine` (4 nodes): `deploySecondsOf` leaves trap and
mine life unscaled (`calc/deploy.ts` 33); the nodes reach only Smoke Charge's 4 s smoke (`mine` + `duration` tags, `gemsGen.ts`
5514-5540, scaled at `blinks.ts` 222). One line at `calc/deploy.ts` 33 (scale trap and mine life by `prof.skillDuration` too, which
is what the reference's "mine duration" means) makes the four nodes real and gives the area a tenth stat.

**Recommendation.** Skip both. The Shade's barb has enough with `deployCount`, `castSpeed`, `mine.chain` and `mine.double` beside
damage, area and crit; make `skillDuration` reach mine and trap life with the one-line change, or drop the four nodes.

---

## 3. Minion accuracy and a minion speed split

**Today.** Thirteen summon gems; `minionSpeed` is one multiplier `m.speed = prof.minionSpeed` (`sim/minions.ts` 154) on both
movement (`def.speed × m.speed`, 318) and strike rate (`def.rate × m.speed`, 330); the sheet reads it for strike rate only
(`character.ts` 2070, `patterns.ts` 103) and models no movement. A minion's blow goes through `rawHit` (`minionFx.ts` 175-216 →
`combat.ts` 989-1030): armour, resistance and taken multipliers, **no accuracy or evasion roll, no crit**; the sheet's `minionBlow`
has no hit chance either (`minionDps.ts` 28-42). Minions seek 14 tiles, follow at 3.5 and teleport to the character past 20
(`minions.ts` 56-63).

**What adding takes.** Accuracy: nothing to hang on. Minions would first have to be able to miss (an evasion roll in `minionStrike`
against monster evasion, a sheet hit chance in `minionBlow`, the `sheetVsSim.minions` suite re-based), and the stat would then buy
back a nerf. That is bucket C (new sim behaviour), a day or two, and a baseline change for every minion build. Speed split: a second
profile field (`skill.ts` 113, 611), `minions.ts` 318 reads it, rename the text at `statText.ts` 542 and the wand affix
(`affixes.ts` 1092-1105) and three supports (`gemsGen.ts` 8736, 8767, 8820), extend "Pack Fury and Pack Haste"
(`sheetVsSim.minions.test.ts` 120); ~25 lines, under a day. But the movement field has no sheet reader and no sheet row to be shown
on, so a "minion movement speed" node fails the rule that the sheet shows the stat; the attack half is what `minionSpeed` already is.

**Visible in play?** Accuracy: not until minions can miss. Movement speed: time to the first blow after a summon or a pack change,
a second or two per fight, bounded by the leash; invisible on the sheet. Attack speed: already shown and obeyed as `minionSpeed`.

**What the area already has (sim-real, distinct).** `minionDamage`, `minionLife`, `minionSpeed`, `minionCount`, `minionRegen`,
`minionBlock`, `minionPhysReduction`, `minionTaken`, `minion.res`, `minion.maxRes`, `minion.eleMore`, `minion.exposure`,
`minion.nearMore` (all `db.sum` in the profile, `skill.ts` 609-625, 706-707; obeyed in `minionFx.ts`), `skillDuration` tagged
`minion` (timed summons, `character.ts` 2050), `cost` tagged `minion`. Fifteen; the tree's 40 minion mods use seven of them today
(`minionDamage` 14, `minionSpeed` 10, `minionLife` 9, `minionBlock`, `minionCount`, `minionRegen` 2 each, `minionPhysReduction` 1).
**Dead today:** `aoe` tagged `minion` (2 nodes): minion splash is `st.splash`, a fixed field (`minionFx.ts` 216-221), and nothing in
`minions.ts` or `minionFx.ts` reads `radiusMult`; only a relic's nova radius takes it (`character.ts` 2066).

**Recommendation.** Skip both. Build the Cathedral's minion tower from `minion.res`, `minion.eleMore`, `minion.exposure`,
`minion.nearMore`, `minionRegen`, `minionBlock`, `minionCount` and timed-summon `skillDuration`, none of which the tree uses; keep
`minionSpeed` whole; drop or retag the `aoe`-tagged-`minion` nodes.
