# Bob — Spirit Plan: making every gem do what its reference gem does

Status: **plan, 2026-10-08. Nothing is built; the user has said to implement all of it, on their go-ahead.** It follows [AUDIT-GEMS.md](AUDIT-GEMS.md), which re-judged all 326 gems of the
coverage plan against what each is _for_ in the reference game (PoE 3.9.0): 155 faithful, 133 drifted, 38 gutted. This plan
is the work to make the other 171 faithful. The user answered four of the open questions on 2026-10-08 (section 11); the rest have defaults, and the user can overturn any of them. It reopens
several rows of [DESIGN.md](DESIGN.md) 2.1 and says so in section 3.

---

## 0. Summary

**The bar.** The user, 2026-10-08: _"I would like player abilities to be totally analogous to POE 3.9 when this plan is
implemented."_ Earlier the same day: _"I don't need the numbers to be exactly the same, but the spirit of the ability does
need to be captured and transferred over."_ Put together, and made testable:

> When this plan is done, **all 326 gems read `faithful` under the rubric of AUDIT-GEMS.md**: a player of the reference game
> would pick the gem for the same reason and get the same loop (what it consumes, what it gives, what it needs, how it is
> timed, what it trades off), with Bob's own names and tuned numbers. The test is a **re-run of the audit** by fresh
> reviewers who are not told the old verdicts (milestone S14), not a feeling.

Where a skill asks the player for aim or timing, the character decides instead (section 5, "policies"). That is an
adaptation of _who decides when_, never of _what the skill is_. Each such adaptation is listed in section 5; anything not
listed there has to behave as the reference game does.

**What is wrong, in one paragraph.** The audit found that the damage is not 170 separate mistakes. The gems were ported with
the defining _number_ kept and the defining _loop_ lost, because the engine had no way to say the loop. A dozen engine
pieces are missing: skills cannot have a cooldown and charges cannot be spent; "channelling" is a tag nothing reads; enemies
cannot be slowed, maimed, blinded or made vulnerable by a skill; the player cannot leave burning ground; projectiles cannot
fire in sequence (Barrage) or be flagged to shotgun; there is no skill damage over time; corpses are not objects the player can
use; totems cannot be hit.

**The parts.**

| Part                                      | What                                                                                                                                                                                                                                | Gems it makes whole (see the curve, section 7) | Size                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------- |
| **S0 Ledger and checking**                | The audit pipeline moves into `scripts/`; a ledger with one row per gem; every claim the audit left as "a reviewer's reading" is checked before it is fixed; the 3.9 text of each gem's reference page is read at the point of work | 0 (it is how the rest is measured)             | M                    |
| **S1 Gems that do nothing**               | Cast on Melee Kill, the Multistrike echo, four uncastable curses, Dual Strike's off hand, kill triggers that fire on any death, notes that claim more than the code does                                                            | 8 start working                                | S                    |
| **S2 The use model**                      | Cooldowns on any skill, spending charges, cooldown bypass, a buff on use, exerted attacks, windows after a block, how the character chooses among its skills                                                                        | 10                                             | L                    |
| **S3 The enemy status layer, and curses** | Slow, maim, blind, hinder, immobilise, exposure, vulnerability, stacking debuffs; self-cast curses and marks with their real effects and the curse limit                                                                            | 18                                             | L                    |
| **S4 Projectile shapes**                  | Sequential volleys (Barrage), the two skills flagged to shotgun, parallel lanes, nova, split, chain and fork, strike-then-projectiles; calc agrees with the sim                                                                     | 16                                             | M                    |
| **S5 Channelling**                        | Stages, ramp and release as a way to use a skill                                                                                                                                                                                    | 8                                              | L                    |
| **S6 Ground and lasting objects**         | Burning, chilling and consecrated ground the player leaves; walls; Standards; orbs; the Righteous Fire family done properly                                                                                                         | 11                                             | L                    |
| **S7 Damage over time and spread**        | Skill damage over time, stacks, leech from it, ailments that spread                                                                                                                                                                 | 12                                             | M                    |
| **S8 Blink and travel**                   | What a blink does on arrival and departure; a delayed warp; hits along a dash; distance scaling                                                                                                                                     | 8                                              | M                    |
| **S9 Stances, guards, rage and absorb**   | Toggle stances the character swaps by situation; absorb-then-release pools; rage that is spent; buff rules                                                                                                                          | 6                                              | M                    |
| **S10 Deployables that exist**            | Totems, traps, mines as things in the world that can be hit, taunt, hold and detonate                                                                                                                                               | 6                                              | L                    |
| **S11 Corpses**                           | Every kill leaves one; skills that consume them (swap, raise, offer, detonate, desecrate, unearth)                                                                                                                                  | 4                                              | M                    |
| **S12 Minions**                           | Golem and offering buffs that follow the minion, a spectre that is a monster, an animated guardian that wears items, minion auras                                                                                                   | 7                                              | M                    |
| **S13 The long tail**                     | The 65 gems whose gap is their own: a stack, a weapon rule, a conditional, a per-charge scaling                                                                                                                                     | 65                                             | L (in three batches) |
| **S14 Close**                             | A fresh re-audit, the residue, the docs, a bot sample                                                                                                                                                                               | the verdict                                    | M                    |

**Order of work.** S0, S1, S2, S3, S4 first: they repair the most gems per unit of engine, and they are what the user's
Flicker Strike example is about. S5 to S12 follow the dependencies of section 7. S13 and S14 close. The plan can be stopped
at a few points and still be worth having; section 7 says what each stopping point buys.

**What this plan does not touch.** Gems, and the granted skills and item-linked supports that a gem change reaches. Not the
passive tree, notables, keystones, uniques, flasks, monsters (except where a gem needs a monster to be targetable or to leave
a corpse), or the economy.

---

## 1. Goals and principles

From the user:

- 2026-10-08: the Blinking Cut port _"just generates charges and ramps up into faster attacks"_ where the original
  _"fills a niche of converting charges into burst damage"_; the worry that _"coarse assumptions lead to a dumbing down and
  simplification of many of the more interesting"_ abilities.
- 2026-10-08: _"When porting an ability from POE to this project, I don't need the numbers to be exactly the same, but the
  spirit of the ability does need to be captured and transferred over."_
- 2026-10-08: _"I would like player abilities to be totally analogous to POE 3.9 when this plan is implemented."_

Principles, in addition to those of [COVERAGE.md](COVERAGE.md) and DESIGN.md 3:

- **Verify the reference before building on it.** The first audit stated how the reference game handles several projectiles from
  memory, and was wrong (AUDIT-GEMS.md, erratum). Every claim about the reference game that a change depends on is read from the
  3.9 wiki through `npm run coverage:wiki`, or from the PoB data, and recorded in the gem's spec before the change is made.
  A reviewer's memory is a lead, not a source.
- **Spirit is the loop, not the number.** For an active skill, the loop is what it consumes, gives, needs, how it is timed and
  what it trades off. For a support, it is the trade it offers (a restriction for power, a cost for a mode, a trigger, a
  change of behaviour). Dropping a cosmetic does not lose it; dropping the interaction that made the gem a niche does.
- **Say it once, as an engine primitive.** A gem that needs "spend a charge to skip the cooldown" gets a field that says
  exactly that and a test of exactly that, not a special case in `abilities.ts`. The next gem that needs it is a data row.
- **The 3.9 numbers are the default where the mechanic exists.** The Path of Building v1.4.155 data in `docs/coverage` has
  mana costs, cooldowns, durations, effectiveness and per-level values for 3.9. Where the engine can now express a loop,
  its numbers are those, scaled by Bob's existing level and damage curves; where Bob has its own tuned number, it keeps it.
- **A gem's text derives from its data.** Cards, the skill bar and the inspect panel are built from the definition
  (`src/ui/gemText.ts`); a new primitive ships with its string, or it does not ship. A gem that claims an effect its code does
  not have is the failure the audit found most often (Ensnaring Arrow's chill, Spirit Saw's energy shield).
- **Calc and sim agree.** Every primitive is modelled in `src/calc` (the sheet, the DPS the player reads) and in `src/sim`
  (what happens), and the convergence tests hold them together. A mechanic that only the sim has makes the sheet lie; one
  that only the sheet has is the old failure again.
- **The character is the player.** Bob's character is controlled by the sim. Every gem that a human drives by aim or timing
  names its policy (section 5), and the policy is something a good player would do, not a convenience.
- **Our own names, our own text.** Names, descriptions and art are Bob's (DESIGN.md 3; the IP scan, `src/data/ip.test.ts`).
  Reference names appear in `docs/` and `scripts/` only. No code from any tool is copied.
- **Data first.** A gem is a decision file in `docs/coverage/gems/*.json` turned into `src/data/gemsGen.ts` by the emitter.
  Nothing is edited in `gemsGen.ts` by hand. Engine work lands in `src/calc`, `src/sim` and the type files.
- **Ids are stable.** Gem ids are never renamed (items in saves hold them). A change of `kind` (the four old hex gems)
  keeps the id.

---

## 2. Where things stand (read from the code, 2026-10-08)

What the audit found, with the file where it lives. **Checked** means I read the code to confirm; the rest are reviewers'
readings that milestone S0 confirms before anything is built on them.

### 2.1 How a character uses skills

- One **primary** skill is used by the AI whenever it can; every other equipped active skill is a **secondary**, cast when
  ready (`chooseSkill`, `src/sim/ai.ts`). **Utilities** (curses, buffs, guards, warcries, blinks, summons) are cast first, by
  policy (`chooseUtility`, `src/sim/utility.ts`: upkeep, guard, rally). When nothing can be used it falls back to a default
  attack. **Checked.**
- `SkillDef.cooldown` exists but only says how long a _secondary_ waits; no gem sets it, and `resolveActive` never does, so
  the wait is the default (six uses, at least three seconds; `cooldownOf`, `src/calc/character.ts`). A primary skill has no
  cooldown at all. **Checked.**
- **Charges** (`grit`, `fervour`, `insight`) can be gained (`gainCharge`, `rollCharges`) and expire (`tickCharges`);
  nothing spends one. **Checked** (`src/sim/charges.ts`).
- **Buffs** are timers that switch a condition on (`src/data/buffs.ts`, `src/sim/buffs.ts`); the `utility` kinds are `buff`,
  `curse`, `blink` and `summon`. A skill cannot grant itself a buff on use. **Checked.**
- **Rage** exists as a count with decay; nothing needs or spends it. **Checked** (`gainRage`, `tickBuffs`).
- **Triggers** (`src/data/triggers.ts`) have effects `castSocketed`, `castGranted`, `explode`, `spread`, `sacrifice`,
  `recover`; events include `kill`, `hit`, `block`, `attack`, `cast`. The `block` event fires for the player
  (`src/sim/combat.ts:272`), which is what a retaliation skill needs. **Checked.**

### 2.2 What a hit can do to an enemy

- Ailments are ignite, bleed, poison, shock, chill, freeze. There is **no maim, no blind, no hinder, no general slow, no
  exposure, no "takes more damage" debuff** a skill can apply. `maim` and `blind` do not appear in `src/sim` or `src/calc`.
  **Checked.**
- Curses are **hexes** (`src/sim/hexes.ts`): 6 seconds, applied on hit or by a utility cast, limited by `BASE_HEX_LIMIT`
  (1). The four gems of the old `hex` kind (Brittle Doom, Leaden Limbs, Feeble Grip, Open Wounds) have no cast path; only the
  Hexing Strikes support applies them (`character.ts:992`). **Checked.**
- Target conditions are read for the primary target and then applied to everything an area hits. _(reviewer)_

### 2.3 Projectiles, areas, lasting things

- **All projectiles of one use share a hit list** (`useHits`, `src/sim/actions.ts:396`; a decision of 2026-10-06), so a target is
  hit once per use. **This matches the reference game for projectiles fired together** (the 3.9 wiki: a single enemy cannot be hit
  by more than one projectile of a bow attack fired together; shotgunning was removed in 2.0.0). It does not allow for the
  exceptions: Barrage and Barrage Support fire their projectiles in sequence, so they can all hit one target; the 3.9 data flags
  Shrapnel Ballista and Shattering Steel as able to shotgun. **Checked** in the code and the wiki. Projectile count is ignored
  by the sheet's DPS, which is right for simultaneous projectiles and wrong for those exceptions.
- `chains` is consumed only inside the `chain` behaviour (`actions.ts:292`). Chain Support does nothing on a projectile
  skill. **Checked.**
- Skills can leave a **zone** (`behaviour: ground`, `w.zones`, `tickSkillZones`) that pulses a hit. Burning, chilling and
  consecrated ground that does something other than hit, a wall, a placed object, an orb: none exist on the player's side.
  Monsters have lasting zones with effects (`openZone`, `hazardAt`, `src/sim/factions.ts`).
- **Channelling** is a tag. Nothing reads it except the ailment keyword mask (`src/calc/skill.ts`). **Checked.**
- There is no skill damage over time: only ignite, bleed and poison tick. Hit leech never reaches a tick. _(reviewer)_
- **Blinks** are one effect, a gap-closing jump (`applyUtility`, `src/sim/utility.ts`); `travel` on a damaging skill moves the
  caster before the hit and does nothing else (`actions.ts:235`). **Checked.**

### 2.4 Things that stand in the world

- **Totems, traps, mines, brands** are plain records in `w.deployables` (`src/sim/deploy.ts`), not actors: they have no life,
  monsters cannot target them, and every mine detonates when an enemy is within 3.5 tiles. _(reviewer, matches the file)_
- **Minions** are mortal actors on the player's side (`src/sim/minions.ts`). The owner buffs a golem or offering gives
  (`ownerMods`) are on whether or not the minion is alive. Minions ignore flat added damage. _(reviewer)_
- **Corpses** exist, on the monsters' side only: `Corpse`, `leaveCorpse`, `raise`, `tickCorpses` in `src/sim/factions.ts` (the
  Reliquary raises the Ossuary's dead). The player has no way to use one. **Checked** that the type and functions exist.

### 2.5 The gems that do nothing

Listed in AUDIT-GEMS.md; they are milestone S1.

---

## 3. Decisions to reopen

"Totally analogous" overturns, or narrows, several rows of DESIGN.md 2.1 and one decision of 2026-10-06. D1, D4, D5 and D7 were put to the user on 2026-10-08
and are answered as marked; the others are defaults in effect until the user says otherwise (section 11).

| #   | Today                                                                                                                                                                                    | The plan proposes                                                                                                                                                                                                                                                                                         | Why                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Projectiles share a hit list** (2026-10-06): a use hits each target once                                                                                                               | **Kept**, because it is the reference game's rule for projectiles fired together. Added: a `sequential` mode (Barrage and Barrage Support: each volley has its own hit list, so they can hit one target) and a `shotgun` flag for the two skills the 3.9 data flags (Shrapnel Ballista, Shattering Steel) | Checked against the 3.9 wiki after the user questioned the first draft of this plan, which proposed removing the rule. The audit's shotgun findings were mostly this error and are corrected |
| D2  | "Multiple skills: **one primary skill**, auto-used"                                                                                                                                      | The primary may be on a cooldown or conditional, and the character then uses the next skill or the default attack, as a player does                                                                                                                                                                       | Flicker Strike, Cold Snap, Vigilant Strike and the retaliation skills are cooldown or conditional skills; the engine already has the fallback                                                |
| D3  | "Block: a blocked hit does nothing else"                                                                                                                                                 | Unchanged for hits; a block still fires the `block` event, and retaliation skills become usable for a window after it                                                                                                                                                                                     | The event exists; only the skills need it                                                                                                                                                    |
| D4  | "Curses: self-cast 9 to 11 s in PoE; Bob's hexes last 6 s, are applied on hit and use Bob's numbers"                                                                                     | **Decided by the user, 2026-10-08:** curses are cast by the character, last as long as the 3.9 gem says (scaled by the curse-duration mods), use the 3.9 effect lists and the curse limit; Hexing Strikes keeps applying curses on hit as Hextouch does                                                   | The curses' effects (accuracy, crit, slow, vulnerability, ailment chance) are their reason to be taken                                                                                       |
| D5  | "Gem quality: not modelled"                                                                                                                                                              | **Stays out** (the user, 2026-10-08). The Enhance analog is then the one gem that cannot be faithful, and is recorded as such in the ledger (`accepted`)                                                                                                                                                  | Quality is an upgrade path with its own economy, not a skill behaviour                                                                                                                       |
| D6  | "Critical rolls: once per target hit"                                                                                                                                                    | Unchanged. It changes variance, not any gem's loop                                                                                                                                                                                                                                                        |                                                                                                                                                                                              |
| D7  | COVERAGE excluded corpse skills (Desecrate, Detonate Dead, Unearth, Volatile Dead), Vaal skills, Manabond, Plague Bearer, Herald of Purity, Tempest Shield, remote trap and mine control | **Unchanged: they stay out.** The user, 2026-10-08, chose "none of them". The corpses part (S11) builds only what the 326 gems need (Bodyswap, Spectre, the Offerings)                                                                                                                                    | The 23 uncovered gems are not in the audit                                                                                                                                                   |
| D8  | Cooldowns: "guards, warcries and blinks do not share"                                                                                                                                    | Whatever the 3.9 rules are (S0 checks them), including any shared cooldowns between guard skills                                                                                                                                                                                                          |                                                                                                                                                                                              |

---

## 4. The bar, and how it is measured

### 4.1 The ledger

`docs/coverage/spirit.json` (new): one row per mapped gem, keyed by id: `verdict` (faithful, drifted, gutted), `missing`
(primitives), `milestone` (the one that finishes it), `effects` (what a run of the gem must visibly do: see 4.3), `verified`
(a person or a test has checked the claim), `accepted` (a documented adaptation that is not a gap). A test fails if a mapped
gem has no row, if a gem marked `faithful` lists a missing primitive, or if a milestone is marked done while its gems are
not `faithful`. Today's rows come from the audit's merged output.

`npm run spirit` prints counts by verdict and milestone; `npm run spirit -- --gem blinkingCut` prints the join block for one
gem (the reference description, skill types, stats and level-1 and level-20 values from the PoB data, Bob's definition and
its note), which is how a milestone starts work on a gem. These are the audit's own scripts, moved from the scratchpad into
`scripts/spirit/` so the audit can be repeated.

### 4.2 Read the reference first, at the point of work

Each milestone starts, per gem it repairs, by writing a **spec**: five lines at most, in the ledger, of what the 3.9 gem does,
read from (1) the PoB data and (2) the 3.9 wiki page as it stood before 3.10 (`npm run coverage:wiki -- "Page title"`, which
AUDIT-3.9.md used). The wiki site blocks bots, so the tool is the way; poedb shows later versions and is a hint, not a
source. **Every non-faithful row's account of the reference game (the "PoE" line of AUDIT-GEMS.md) is re-checked this way before
its milestone starts**; where the wiki says something different, the row is corrected first, as the projectile rows were. The spec is the acceptance test's source. Nothing in `docs/` is copied into `src/`.

### 4.3 Tests

- **A loop test per gem**, in the style of `src/sim/gemSmoke.test.ts` and `triggers.test.ts`: a scripted world, the gem
  in a build, and the assertion that the loop happens (Flicker Strike: a charge is spent and the cooldown is skipped; the
  movement buff starts; with no charge the second use waits). The test is written from the spec, before the gem is edited.
- **A primitive test per primitive**: the sim and the calc each, and a convergence check that the sheet and the sim agree to
  the existing tolerance.
- **A parity smoke**: every gem is run for a fixed time against a dummy and its observed **effects** (a blink, a spent
  charge, a zone, a debuff of a given kind, a summoned or raised minion, a corpse used) are compared with the ledger's
  `effects`. This is what would have caught a note that said "chills" for a gem nothing chills. New events are added to the
  sim's event list where one is missing.
- `npm run check` and `npm run build` at every milestone's end; the existing floors (`x9`, the bot speed) re-run; no
  balance sims in between (section 8).

### 4.4 Done means re-judged

A milestone is done when every gem it names has been re-judged `faithful` by a reviewer who has read the spec and the code
(not the previous verdict), with the loop test passing. The final re-audit (S14) is the same seven-batch process as the
first, with fresh reviewers.

---

## 5. Policies: what the character does in place of the player

An autobattler cannot ask for a keypress, so each skill that a human drives gets a **policy**: when the character uses it,
and what it chooses. These are the adaptations the bar allows. A policy is data on the gem (a `use` field), not code in the
AI, so the card can state it ("Used when 3 enemies are near").

| Skill class                                                                                   | The reference game                               | The policy                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cooldown skill with a bypass (Flicker Strike, Cold Snap, Vigilant Strike)                     | Press again, spending a charge, to skip the wait | Use when ready. While the cooldown runs, spend a charge to use again if one is held and the target is in reach or about to be (keeps a reserve of one if a spend-gated support needs it). The default attack fills the gaps |
| Channelled skill (Flameblast, Blade Flurry, Winter Orb, Cyclone, Divine Ire, Storm Rush, ...) | Hold the button; release to fire or stop         | Channel while a target is in reach and the path is clear. A release skill fires at the stage cap or when the target dies, and a stun or a move ends it. Movement-based channels (Cyclone) move with the fight               |
| Warcry that exerts attacks (Infernal Cry, the cries)                                          | Cry, then attack                                 | Cry when a pack or a rare is near and attacks are about to land; the next N attacks are exerted                                                                                                                             |
| Retaliation skill (Anvil Drop, Rime Rebuke, Blade Wind)                                       | Usable for a short window after you block        | Used at once when the window opens                                                                                                                                                                                          |
| Stance skill (Dune Stance, Stone Stance)                                                      | Swap by clicking the skill                       | The stance fitting the situation: the single-target stance against a boss or one enemy, the area stance against three or more, re-evaluated at most every two seconds, as a player would                                    |
| Guard, buff, aura-like skill                                                                  | Press when needed                                | Guard when life is low or a large hit lands; upkeep while enemies are near; rally against a pack or a rare (today's `utility.policy`)                                                                                       |
| Blink (Flame Dash, Frostblink, Lightning Warp, Shadow Swap)                                   | Aim, press to move                               | Used to close a gap, to leave a hazard the dodge cannot walk out of, and, for those with an effect on arrival, when the effect would land on a pack                                                                         |
| Curse or mark                                                                                 | Cast on a target                                 | A rare, a boss or a pack gets the curses the build holds, up to the curse limit, strongest first; refreshed before it ends                                                                                                  |
| Totem, trap, mine, brand                                                                      | Place by hand; mines are detonated by hand       | Place near the fight when enemies are in reach and fewer than the cap stand. Traps trigger by walking into them as in the game. A mine set detonates when enough enemies stand in its radius or the set is about to expire  |
| Corpse skill (Bodyswap, Detonate Dead, Spectre, Offerings, Desecrate)                         | Aim at a corpse                                  | Used when a corpse is within reach and the skill's purpose applies (a pack near it to detonate; a gap to close by swapping; fewer minions than the cap to raise)                                                            |
| Minion skill                                                                                  | Summon, and sometimes command                    | Summon when under the cap; no commands (the reference game's minions follow and fight)                                                                                                                                      |
| Trigger                                                                                       | The game casts it                                | As the game, with the triggers' rules and mana (already built)                                                                                                                                                              |

If the reference game does something here that the table does not cover, the gem is not done until it does it or the table
gains a row the user accepts.

---

## 6. The parts

Each part lists the types it changes, the sim and calc work, the policy, the gems it finishes (a gem finishes at the last
part it needs; the full list is the appendix), the tests and the size. Sizes: S under a day, M a few days, L about a week;
this plan is larger than the coverage plan.

### S0 Ledger and checking (M)

- `scripts/spirit/` (join, merge, report), `docs/coverage/spirit.json`, `npm run spirit`, the ledger test (4.1).
- **Check the unchecked claims** before any fix is built on them: Cast on Melee Kill is inert; Dual Strike hits with one
  weapon; Chain; the totems and deployables facts; golem and offering buffs; the kill-trigger rule; the mark rule; each port
  note that the audit says claims more than the code does (Shield Charge, Wild Strike, Gouge Shot, Spirit Saw, Ghost Shard,
  Ensnaring Arrow, Slow Rot, Vile Toxins, Frost Fang). Each is a test that fails now, or a note that it was wrong.
- **Re-read the reference for the weakest rows.** Sixteen gems had no PoB data and were judged partly from memory or from
  poedb (current-version values): Rime Drift, Anvil Drop, Rime Rebuke, Halo Sweep, Cluster Bolt, Slag Lob, Ghost Coil, Blade
  Wind, Hunt Sigil, Kindled Bellow, Rot Drain Trap, Toxin Coat, and the supports Chance to Poison, Multiple Projectiles,
  Critical Strike Affliction, More Duration, Hextouch. The Barrage active gem was judged from a mismatched join and from memory.
  Some of these may be later additions that the coverage list admitted through its release-version field: if the 3.9 wiki
  has no such page, the gem is recorded `not in 3.9`, leaves the plan, and keeps its definition.
- **Check the PoE side of the audit itself.** Each of the 171 non-faithful rows has a "PoE" line written by a reviewer, partly
  from memory. S0 re-reads the 3.9 wiki and PoB text for the rows of S1 to S4 (about 75 gems) and corrects any that are wrong,
  as the projectile rows were; later milestones do the same for their own rows at their start (4.2).
- The `effects` vocabulary and the parity smoke (4.3).

### S1 Gems that do nothing (S)

- Cast on Melee Kill (`slayersEcho`): a trigger links _spells_ and the gem supports melee, so its list is empty. Fix the
  linking rule so a melee-kill trigger casts the spells in the same item, as the reference gem does; honour its `tags`
  filter.
- Multistrike (`tripleCadence`): the second echo lands at 1.1 of the use time, after the action ends. Echo timing is
  fitted to the action (the sim and the sheet then agree on the number of hits); the ramp and the target choice are S13.
- Dual Strike (`twinBlades`): single-target melee hits with one hand per use; the sheet counts two.
- The four curse gems become castable curses: `kind` `hex` becomes `active` with `utility: curse`, ids kept. The Hexing
  Strikes support then applies "the curse gems in the same item" by their utility, not by their kind. (The curses' real
  effects are S3.)
- Kill triggers fire on the player's kills (and the minions', where the reference game counts them), not on any death.
- Every port note that overclaims is rewritten to what the gem does today (S13 fixes the gem; the note is honest meanwhile).
- **Gems:** Cast on Melee Kill, Multistrike (start), Dual Strike (start), the four curses (start). Most of these finish in
  later parts.

### S2 The use model (L)

The foundation for Flicker Strike, Cold Snap, Vigilant Strike, Discharge, Immortal Call, Phase Run, Blood Rage, the
warcries, the retaliation skills and Lightheart.

- **Types.** `ActiveGemDef` gains: `cooldown` (a level value, seconds); `spend` (what using the skill consumes: charges of a
  kind, rage, a share of life; with a `bypass` flag when it is a way to skip the cooldown); `onUse` (a buff granted by using
  the skill, and for how long); `window` (usable only for N seconds after an event, a `block` for the retaliation skills);
  `exert` (the next N attacks carry these mods and this extra effect); `use` (the policy of section 5). `SkillDef.cooldown`
  stops being "secondary only".
- **Sim.** A cooldown clock per skill; the AI skips a skill on cooldown (primary included) and falls back as in 2.1;
  `spendCharges(w, kind, n)` in `charges.ts` with a `spent` event that triggers can listen to; the bypass in
  `chooseSkill`; `gainBuff` on use; the `block` window; exerted attacks as a counter on the player that `hit` reads.
- **Calc.** The sheet accounts for the cooldown (a cooldown-limited skill's DPS is its burst over its cycle), for spent charges
  (the uptime they allow), and for exerted attacks.
- **Policy.** Section 5, rows 1, 3, 4, 6.
- **Gems:** Blinking Cut (Flicker Strike), Sudden Frost (Cold Snap, with S3 for its chill and S6 for its ground),
  Guarded Strike (Vigilant Strike), Charge Release (Discharge), Deathless Call (Immortal Call), Slipstream Run (Phase Run),
  Surge of Blood (Blood Rage), Lightheart, the retaliation skills (Anvil Drop, Rime Rebuke, Blade Wind), the cries (Kindled
  Bellow and the others), Thunder Rebuke (Smite), Cinder Herald and Storm Herald (their kill effects use S2's on-use
  and trigger plumbing).
- **Tests.** Flicker Strike's loop as the model: a charge is spent, the cooldown is skipped, the buff starts, the second
  use waits with no charge; Cold Snap's bypass; a retaliation skill unusable until a block, usable for the window after one;
  a cry exerts exactly N attacks. A convergence test for a cooldown-limited skill.
- **Risk.** Cooldowns cut DPS and shift the balance. Section 9.

### S3 The enemy status layer, and curses (L)

- **Statuses on an enemy.** A small registry (`src/data/statuses.ts`) of the effects a skill can apply: slow (a
  movement-speed reduction), hinder, maim (slower movement and attack, and more physical damage taken in the 3.9 form),
  blind (its hits miss more), immobilise (cannot move), exposure (elemental resistance reduced), vulnerability and
  stacking "takes more damage" debuffs (Wither's stacks, Punishment), stun vulnerability. Each says its effect, its stacking
  rule (strongest wins, or stacks to a cap), its source, and how a boss or a unique resists it (today's hexes take 0.67 of
  the effect on bosses and are refused by `hexWarded` enemies; the same rule).
- **Skills apply them**: on hit with a chance, on a cast, from an aura or a ground effect (S6), from a trap (S10).
  `GemMod` stats such as `status.slow.onHit` carry them; the support that adds a chance (Dazzle, Hamstring and so on) is a data row.
- **Curses.** A curse gem is a spell the character casts (S1 makes the old four castable), with the effect list of the 3.9
  gem: Enfeeble's accuracy and critical penalties, Vulnerability's physical taken, bleed and maim, Temporal Chains' slow and
  its effect on the enemy's actions, the elemental curses' resistance reduction **and** their extra chance to be ignited, frozen
  or shocked, Punishment, Despair, Conductivity, Flammability, Frostbite, and the marks. The curse limit (`hexLimit`) is
  a real limit with 3.9's duration; **a mark's bonuses apply only to the target that carries that mark** (today they apply
  to any hexed target). The on-hit "hex supports" stop competing with real curses for the one slot.
- **Calc and sim.** Enemy-side multipliers feed `hit`; the sheet shows "enemies are slowed/maimed/blind" as a configurable
  condition like the existing ones.
- **Gems:** Wither (Rot Touch, with S7), Bear Trap (Jaws Trap, with S10), Ensnaring Arrow (Snare Shot), Hamstring, Dazzle,
  Rout, Punishment (Penance), the Sigils (Ruin, Warlord, Plenty, Hunt), Guard Breaker, Void Curse, Standing Curse, Deep
  Chill, Charged Breath, Kindled Bellow, the Standards' debuffs (with S6), Tide of Judgement, Brittle Doom, Leaden Limbs,
  Feeble Grip, Open Wounds, and the other curses and marks.
- **Tests.** One per status (the effect, the stacking rule, the boss rule); one per curse (every item on its effect list).
- **Risk.** Monster AI that reads speed and accuracy must see the statuses (`speedMult` in `src/sim/factions.ts` already
  folds hexes into speed). It is a layer on existing mods, not a rewrite.

### S4 Projectile shapes (M)

The once-per-target rule for projectiles fired together stays (D1). What is built is what the reference game does around it.

- **Sequential volleys.** A `sequential` mode on projectile behaviour: the projectiles are fired one after another, each with its
  own hit list, so they can all hit one target; with the per-projectile attack-time cost and damage the gem says (Barrage fires
  its projectiles at 40% of base damage each in 3.9; Barrage Support's penalty is a data value from the PoB data). The sheet counts
  each volley as a hit on the target.
- **The shotgun flag.** A `shotgun` flag for a skill whose projectiles each have their own hit list (Shrapnel Ballista and
  Shattering Steel are the two 3.9 flags). The sheet then needs the overlap model: given the spread, the target's size and the
  distance, how many projectiles hit one target (the community's "shotgun" effect); the sim needs none, geometry does it.
- **Parallel lanes** (Volley and Greater Volley): the extra projectiles fly side by side instead of in a fan, which widens the
  front without the cone.
- **Nova** (Arrow Nova: the arrow lands, then a ring), **split at the end** (Tornado Shot: a piercing arrow, then arrows out in
  all directions from where it ends), **spawned from the target** (a strike, then projectiles from the target: Wild Strike),
  **fork** (the projectile splits at the first enemy it hits, once, at 60 degrees: the 3.9 wiki) and **chain** (a projectile
  chooses a target in range and flies to it; it cannot hit a target twice, and none of the projectiles of one use may chain to
  an enemy already hit by another of them: also the 3.9 wiki). Chain Support then works on any projectile skill, which it does
  not today (`chains` is read only by skills with chain behaviour).
- **A cone from the impact** (Galvanic Arrow).
- **Policy.** None new. The AI already closes for a clearer shot when arrows hit walls.
- **Gems:** Barrage (Quiver Rush) and Barrage Support (Rolling Volleys), Shrapnel Ballista (Scatter Bow), Shattering Steel (Splinter
  Volley), Volley and Greater Volley (Twin Salvo, Wide Salvo), Arrow Nova (Arrow Tempest), Tornado Shot (Whirl Shot), Fork (Split
  Shot), Chain (Ricochet), Galvanic Arrow (Storm Quill), Wild Strike (Prime Splash, with S13a), Bolt Cleave and Slag Blow, Rime
  Splinter, Ghost Coil, Toxin Circle, Mortar Bow and Mortar Charge. Greater Multiple Projectiles (Volley Split) was found faithful.
- **Tests.** A sequential volley hits one target once per volley; a fan does not; a flagged shotgun skill hits a close target
  with several projectiles and a far one with fewer; fork, chain and nova as the wiki describes; the sheet and the sim agree.
- **Risk.** Barrage and the two shotgun skills raise single-target damage, as in the reference game. Section 9.

### S5 Channelling (L)

- **Type.** `channel` on an active gem: the stages (how many, and how long each takes), what each stage adds (damage, area,
  projectiles, speed), and the end: a **release** (fires once with the accumulated stage: Flameblast, Blade Flurry, Divine
  Ire's burst) or a **sustain** (keeps hitting while held: Incinerate, Scorching Ray, Winter Orb's stages feeding its
  orb). A movement channel (Cyclone, Charged Dash) moves the character while it runs.
- **Sim.** A channelled use is a long action, ticking at the skill's rate, that the AI keeps going while the target is in reach;
  stun, freeze, death of the target and the stage cap end it; a release fires at the end. Stages accumulate in the action.
- **Calc.** The sheet's DPS for a channel is the average over an assumed channel length (configurable, default the skill's
  stage cap plus a sustain interval), as players read channel DPS, so the "ramp" is visible rather than flattened.
- **Policy.** Section 5, row 2.
- **Gems:** Blade Flurry (Flurry of Edges), Divine Ire (Judgement Tempest), Flameblast (Furnace Roar), Blaze Stream
  (Incinerate), Searing Lance (Scorching Ray), Winter Orb (Hoarfrost Mote), Cyclone (Twister Blade), Charged Dash (Storm Rush), Blight
  (Blight Hail), Static Strike's cousins, Reave (Sweeping Cut), Thunder Spiral, Double Release, Infused Channelling, and
  the supports that act on channelling.
- **Tests.** Stages accumulate; a release fires the stage reached; a stun ends the channel; the sheet's average matches the
  sim's over the assumed length.

### S6 Ground and lasting objects (L)

- **Ground effects the player leaves.** Generalise the monsters' zones (`openZone`, `hazardAt`) to the player's side: kinds
  burning, chilling, shocking, caustic and consecrated, each with its effect on enemies (damage over time, a status from
  S3) and, for consecrated ground, on the character; per-source stacking as the reference game. The character's dodge
  keeps stepping out of _enemy_ zones only.
- **Walls.** A skill may place a temporary solid in the grid that blocks enemy movement and projectiles (Glacier Wall). The
  grid already supports collision queries; a temporary solid needs a lifetime and a cleanup.
- **Placed objects.** A Standard (War Banner and Dread Banner analogs) is an object with an aura and **stages from kills**,
  and ends on its lifetime. An **orb** (Orb of Storms analog) is a summoned object that fires at enemies near it and is replaced
  by a new cast; an orb that follows an owner (Storm Halo/Frost Halo patterns) is an aura object.
- **Righteous Fire and its family.** The self-burn goes through resistance and energy shield like fire damage, not directly
  off life; the enemy burn is the reference formula (a share of life, scaled by damage mods). Arctic Armour's conditions:
  stationary, physical and fire only, chills attackers.
- **Calc.** Ground and object DPS in the sheet with an assumed uptime.
- **Gems:** Fire Trap, Flame Dash's ground (with S8), Frostblink's ground, Blessed Trail (Consecrated Path), Cleansing Blaze
  (Purifying Flame), Glacier Wall, Faultline (Seismic Trap's cousin), Rime Core, Magma Crack (Tectonic Slam), Venom Shower, Hoarfrost
  Mote, Standard of Valour and Standard of Dread, Fervent Halo (Zealotry), Searing Mantle (Righteous Fire), Rimeplate (Arctic
  Armour), Storm Halo and Frost Halo, Slag Carapace's burst (with S9).
- **Risk.** The most code, and the walls touch the grid. The walls may be cut to "blocks projectiles and slows" if the grid
  change is too large.

### S7 Damage over time and spread (M)

- **Skill damage over time.** A damage-over-time component on a skill (Contagion, Blight, Caustic Arrow's ground, Essence Drain,
  Toxic Rain's ticks, Vortex's cousins): ticks at the reference interval, scales with the damage-over-time stats rather than
  hit stats, stacks by the reference rule (Blight stacks to a cap; Contagion does not), and may be leeched from where the
  reference game allows (Essence Drain's recovery). Plumb it through `dotMult` in calc and a `dot` list on the actor in sim.
- **Spread.** Ailments that spread: Pestilent Strike's poison, Contagion, Wildfire and Elemental Proliferation (spread on
  application, or on death, per gem), reusing the `spread` trigger effect where it fits.
- **Per-stack scaling** (Vile Toxins and similar supports) reads the real stack count.
- **Gems:** Contagion (Creeping Plague), Blight (Blight Hail, with S5), Caustic Arrow (Acid Arrow), Essence Drain (Sap Bolt),
  Torch Arrow, Searing Lance's DoT, Wither Mark/Wither, Elemental Proliferation (Wildfire Spread) and Wildfire Seed, Slow Rot,
  Vile Toxins (Foul Brew), Pestilent Strike (Venom Strike), Withering Breath, Open Wounds and Cinder Bond.
- **Tests.** A DoT's tick and total; its stack cap; leech from it; spread on death.

### S8 Blink and travel (M)

- A blink or travel skill gains `onDepart` and `onArrive` (a burst, a ground effect from S6, a status from S3, a corpse use
  from S11), `delay` (Lightning Warp's teleport lands after a delay along the path, leaving markers), `along` (hits enemies
  along the path: Whirling Blades, Charged Dash), and `scaleWithDistance` (Shield Charge's damage per distance travelled).
- Blinks respect the cooldown rules of S2. Phase Run and Withering Step's real buffs (phasing; the elusive-like effect) are
  buffs from S2 and S9.
- **Gems:** Flame Dash (Cinder Step), Frostblink (Rime Step), Lightning Warp (Bolt Step), Bodyswap (Shadow Swap, with S11),
  Withering Step (Rotting Stride), Shield Charge (Bulwark Rush), Whirling Blades (Spinning Dash), Leap Slam (Skyfall Leap),
  Charged Dash (Storm Rush), Shadow Quiver, Ice Spear's cousin (Frost Lance), Point Blank (Close Quarters).

### S9 Stances, guards, rage and absorb (M)

- **Stance state.** Two stances on one gem (Blood and Sand, Flesh and Stone), a current stance on the character, swapped by the
  policy of section 5; each stance's mods and costs.
- **Absorb pools.** Damage taken first drains a pool with the reference rule for how it is consumed and what it does
  afterwards (Steelskin's absorb with its reduction; Molten Shell's absorb and reflection; Immortal Call's endurance
  consumption). A `release` can follow (a burst of the absorbed amount).
- **Rage.** Berserk needs rage and spends it; its effects scale with rage held; Blood Rage's life drain and its frenzy gain on
  kill; "refresh on kill".
- **Buff rules.** A skill that replaces another buff; a buff that ends on using a skill; guard skills' shared limits.
- **Gems:** Dune Stance and Stone Stance, Bladestorm (Whirlwind Cleave), Berserk (Rampage Call), Molten Shell (Slag Carapace),
  Steelskin (Iron Hide), Immortal Call (Deathless Call), Blood Rage (Surge of Blood), Warding Pack (Meat Shield), Arcane Ward
  (Discipline), Rimeplate.

### S10 Deployables that exist (L)

- A totem, trap, mine or brand becomes an **object with life and a place**: it can be targeted and killed by monsters when the
  reference game lets it be (totems take hits; traps and mines do not), it draws aggro when it taunts (Decoy Totem), and is
  counted by the cap. It stays in `w.deployables`, but the monsters' target choice (`src/sim/ai.ts`, and the Hunter and
  taunt rules of ROSTER 6.4) learns it.
- **Traps and mines.** Trap cooldown and throw time (Advanced Traps); mines' laying time and **detonation by the policy of
  section 5**; delayed repeated detonations (Shrapnel Trap's `repeats` become delays, not a pile on one spot); a cascade (Chained
  Charges); a trap that holds (Bear Trap's immobilise from S3); mine/trap damage supports.
- **Totem life, placement speed and the attack/cast speed of totems** are the reference stats.
- **Gems:** Decoy Totem (Lure Totem), Guardian Cairn, Slamming Cairn, Ancestral-style totems, Bear Trap (Jaws Trap), Bolt Trap,
  Drain Trap and Rot Drain Trap, Smoke Charge (Smoke Mine), Mortar Charge (Shrapnel/Explosive Trap cousin), Whirring Motes,
  Chained Charges, Heavy Charge (High-Impact Mine), Swift Snares (Advanced Traps), Cinder Bond.
- **Size L, and the one part that bleeds into the monsters' rules**: it needs a test that no enemy type's behaviour changes when
  no deployable stands.

### S11 Corpses (M)

- Every monster death leaves a **corpse** (unless the monster is a spectre, burnt away, or desecrated) with a lifetime,
  a life value (for Detonate Dead's damage and Bodyswap's) and a type (for the Spectre). The monsters' `Corpse` of
  `src/sim/factions.ts` becomes the one corpse model; the Reliquary's raising keeps working through it.
- Skills take `consumeCorpse` (and `needsCorpse`): Bodyswap (swap with it, then it explodes), Raise Spectre (the minion is the
  monster, S12), the Offerings (S12). The corpse skills COVERAGE left out (Desecrate, Detonate Dead, Unearth, Volatile Dead) stay out.
- **Gems:** Bodyswap (Shadow Swap), Raise Spectre (Bind Shade), Pyre Burst (Cremation-style corpse fire), Wake Blades (Animate Weapon, if it
  needs a corpse in 3.9; S0 checks), and the Offerings.

### S12 Minions (M)

- **Owner buffs follow the minion.** A golem's buff and an offering's apply while the minion or object lives and only then.
- **Spectres are monsters.** Raise Spectre takes a corpse's monster type and makes a minion from `MONSTER_TYPES`, with that
  type's attack shape and ability (ROSTER); the cap is the reference rule.
- **Animate Guardian wears items.** It copies stats of the character's equipped pieces by the reference rule.
- **Minion damage** takes flat added damage; minion auras (Infernal Legion's burn, Meat Shield's taunt and defensive stance,
  Elemental Army's resistances and exposure) are data rows over S3 and S6.
- **Gems:** Carrion Golem (Carrion Colossus), Animate Guardian (Wake Sentinel), Raise Spectre (Bind Shade), the three Offerings
  (Bone, Flesh, Spirit Ward Rite), Elemental Army (Elemental Pack), Infernal Legion (Burning Pack), Meat Shield (Warding Pack),
  Herald of Agony (Sour Herald), and the minion supports.

### S13 The long tail (L, in three batches)

The 65 gems whose gap is their own. Each has a "Missing" line in AUDIT-GEMS.md; the work is a decision-file change and, for
a few, a small primitive. Three batches by kind, each an S0-style spec, loop tests and re-judging:

- **S13a Attacks and spells**: Orbiting Blades, Primal Strike (Wild Strike), Fuse Arrow, Rime Mallet (Frost Blades' cousin), Cinder Blow
  (Infernal Blow), Tempest Mote (Orb of Storms), Spear Burst (Perforate), Gouge Shot, Charged Blow (Static Strike), Skyfall,
  Rupture Line, Glacier Wall, Halo Sweep, Cluster Bolt, Slag Lob, Spirit Saw, Ghost Shard, Prime Splash, Snag Lash (Chain Hook),
  Twister Blade, Ice Spear's distance crit, Spark's erratic paths, and the rest of the attack and spell tail.
- **S13b Auras, heralds, curse-likes, traps**: Storm Halo, Frost Halo, Arcane Ward, Sour Herald, Plenty Sigil, Kindle, Tinderbox,
  Bolt Trap, Drain Trap, Smoke Charge, Lure Totem, Thunder Rebuke, Rot Touch, Void Curse.
- **S13c Supports**: Multistrike's ramp and random targets, Spell Cascade and Echo's lateral and offset casts, Ancestral Call's extra
  targets, Lightheart (its own charge), Knife Range, Stagger Resolve, Frost Fang, Firm Hold, Steel Resolve, Close Quarters,
  Brief Burst and Lingering Effect (duration that the sim reads), Merciless Cadence, Swell, Echoing Blow, Ward Siphon (energy shield
  leech), Cindering, Wildfire Seed, Twin Shadow, Veil Cut, Shattering Blows, Enhance (an accepted divergence, D5).
- Each batch ends with its own re-judge.

### S14 Close (M)

- A **fresh audit**: the same seven-batch process, with reviewers who are not shown the old verdicts, against the code as it
  then stands. Residue is fixed or recorded as `accepted` with the user's say.
- Docs: AUDIT-GEMS.md gets a second status section; COVERAGE.md and CLAUDE.md say that `covered` now means `faithful`;
  DESIGN.md 2.1 rows D1 to D8 are rewritten; PROGRESS.md.
- **One bot sample** on the final build (section 8), which also measures the 1.75 / 1.8 / 0.3 default difficulty for the
  first time.

---

## 7. Order, dependencies and where to stop

```
S0 ── S1 ── S2 ─┬─ S5 channelling ──────────────────────────┐
                │                                            │
                ├─ S3 status layer ─┬─ S6 ground ─┬─ S8 blink ─┤
                │                   │             │            │
                │                   ├─ S7 DoT ────┘            ├─ S13 ─ S14
                │                   │                          │
                ├─ S4 projectiles ──┘                          │
                │                                              │
                └─ S9 stances/absorb ──── S10 deployables ─┬── S11 corpses ── S12 minions
                                                           (taunt, immobilise need S3)
```

- **S1 and S2 first.** S2's primitives (cooldown, spend, on-use, window) are used by S5, S8 and S9. S1 needs nothing and
  removes the gems that do nothing.
- **S3 before S6, S7, S10.** Ground effects apply statuses; DoT needs the stacking rule; a trap that holds applies immobilise.
- **S4 is independent** of S3 and of S2 apart from the policy plumbing, and can run alongside either.
- **S6 before S8**: a blink leaves ground. **S11 before S12**: a Spectre needs a corpse. **S10 before S12's taunt.**
- **S13 last**, because many of its gems finish only after their engine parts.

**Where to stop.** "Finishes" counts the gems whose last missing piece is that part; the figures are from the audit's missing
primitives, matched by keyword, so they are close, not exact (S0 recomputes them in the ledger).

| After     | Gems made faithful (cumulative) | Of the 38 gutted | What it buys                                                                         |
| --------- | ------------------------------: | ---------------: | ------------------------------------------------------------------------------------ |
| S1        |     0 finished; 8 start working |                0 | the gems that do nothing now do something                                            |
| S2        |                              10 |                2 | the Flicker Strike family: cooldowns, spending charges, exerted attacks, retaliation |
| S3        |                              28 |                5 | enemies can be slowed, maimed, blinded and cursed as the game does; curses are real  |
| S4        |                              44 |                7 | Barrage, the two shotgun skills, parallel lanes, Chain, Fork, Arrow Nova             |
| S5        |                              52 |               10 | channelled skills ramp and release                                                   |
| S6        |                              63 |               12 | ground, walls, Standards, orbs, Righteous Fire                                       |
| S7        |                              75 |               14 | skill damage over time and spread                                                    |
| S8 to S12 |                             106 |               21 | blinks, stances, deployables, corpses and minions                                    |
| S13       |                       171 (all) |               38 | the long tail                                                                        |

A sensible first commitment is **S0 to S4**: cheap bugs, cooldowns and charges, the status layer and the projectile rule. It
repairs the user's example and the largest blocks of gutted gems that share a cause, and it is about a third of the work. After S4 the user can look at the audit again and decide whether the rest
is worth its cost.

---

## 8. Measuring

- **Primary:** the ledger. `npm run spirit` after each milestone: the gems it names read `faithful`, the loop tests pass.
- **Per milestone:** `npm run check`, `npm run build`, the existing floors (`x9` forty-Swarm, the bot speed floor), the
  convergence tests, and the parity smoke.
- **Balance: two bot samples in all**, per the user's answer of 2026-10-08 and standing instruction (no incremental sims): one at
  the S4 stopping point, so the user can decide whether to continue, and one at S14. Nothing in between. This plan will move balance a lot: cooldowns cut DPS, ramps reshape it,
  Barrage and the shotgun skills raise single-target damage, statuses make enemies weaker, deployables make some builds stronger or weaker. The difficulty
  default of 1.75 / 1.8 / 0.3 has never been measured and is first measured at S4. The sample is read as a regression
  detector, not a target (it is a weak proxy for a human; the user has said so).
- **The re-audit is the verdict** (4.4).

---

## 9. Risks

| Risk                                                                     | Answer                                                                                                                                                                                               |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The balance moves a lot and is not measured until the end                | Stated up front; each part states its direction (section 6); a sample at S4 and one at S14; the difficulty knobs (scaling, base, variance) are the user's to turn                                    |
| Barrage and the shotgun skills raise single-target damage                | That is the reference game's balance; the sheet's overlap model keeps the DPS honest; S14's sample shows the effect                                                                                  |
| Calc and sim diverge on a new primitive                                  | Every primitive has a convergence test; the sheet is a first-class citizen of each milestone                                                                                                         |
| The AI plays a skill badly (a bad stance swap, a wasted spend)           | The policy is data, stated on the card, tested; a bad policy is a data change                                                                                                                        |
| The chosen 3.9 behaviour is wrong because the source was current-version | Specs are read from the 3.9 wiki through the tool and the PoB data; poedb is only a hint; low-confidence rows are re-read in S0                                                                      |
| Deployables as actors changes monster behaviour (S10)                    | A test that nothing changes with no deployable; the targeting rule is one function                                                                                                                   |
| Walls in the grid (S6)                                                   | May be cut to "blocks projectiles and slows"; the plan says so                                                                                                                                       |
| More mechanics make the skill card unreadable                            | Strings derive from data; a test that every field has a string; the "Policy" line on the card                                                                                                        |
| Saves                                                                    | Gem ids and kinds do not change shape; run state that gains fields (cooldown clocks, stances, rage spent) is rebuilt per map and not saved, as today; `SAVE_VERSION` is bumped if `RunState` changes |
| Speed: more simulated objects (corpses, statuses, DoT stacks)            | The `x9` floor and the bot speed floor re-run; objects are lists with caps                                                                                                                           |
| The tree and uniques that refer to a gem change meaning                  | Uniques that grant or modify skills are found by `npm run coverage`'s map; S14 runs their tests; no unique is edited unless a gem change breaks it                                                   |
| Scope: "totally analogous" has no end                                    | Section 4.4: done is the re-audit, and the user can stop at a stopping point in section 7                                                                                                            |
| The other agent's uncommitted work in the same tree                      | Stage by explicit path; never `git stash`; commit only our hunks                                                                                                                                     |

---

## 10. Milestones

Each ends with `npm run check`, `npm run build`, the floors, the ledger update, a note in `docs/PROGRESS.md`, and, for a
decision, DESIGN.md Appendix A. One commit a milestone, with explicit paths.

| #   | Milestone                     | What                                                                                                                                                                             | Size |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| S0  | Ledger and checking           | `scripts/spirit/`, the ledger and its test, `npm run spirit`; the unchecked claims turned into tests; the sixteen weak rows re-read; the parity smoke and the effects vocabulary | M    |
| S1  | Gems that do nothing          | Cast on Melee Kill, the Multistrike echo, Dual Strike, the four castable curses, kill-trigger ownership, honest notes                                                            | S    |
| S2  | The use model                 | cooldown, spend, bypass, onUse, window, exert, the `use` policies; Flicker Strike and its family; calc and sim                                                                   | L    |
| S3  | Status layer and curses       | the registry, the curses' real effects, marks, the curse limit; the gems that apply statuses                                                                                     | L    |
| S4  | Projectile rules              | per-projectile hits, parallel, nova, spawn-from-target, chain, fork; the overlap model                                                                                           | L    |
| S5  | Channelling                   | stages, ramp, release, sustain, movement channels; the sheet's average                                                                                                           | L    |
| S6  | Ground and lasting objects    | player ground effects, walls, Standards, orbs, Righteous Fire done properly                                                                                                      | L    |
| S7  | Damage over time and spread   | skill DoT, stacking, leech, spread                                                                                                                                               | M    |
| S8  | Blink and travel              | arrive, depart, delay, along, scale with distance                                                                                                                                | M    |
| S9  | Stances, guards, rage, absorb | stance state and swap policy, absorb pools, rage spent, buff rules                                                                                                               | M    |
| S10 | Deployables that exist        | life, targetability, taunt, trap and mine rules                                                                                                                                  | L    |
| S11 | Corpses                       | one corpse model, consumption, the corpse skills                                                                                                                                 | M    |
| S12 | Minions                       | owner buffs that follow the minion, spectres, guardian, minion auras                                                                                                             | M    |
| S13 | The long tail                 | three batches (a, b, c), each re-judged                                                                                                                                          | L    |
| S14 | Close                         | fresh re-audit, residue, docs, one bot sample                                                                                                                                    | M    |

---

## 11. Questions

**Answered by the user, 2026-10-08:**

1. **Projectiles (D1).** The user asked for the reference game's rule to be verified before deciding. It was: the shared hit list
   is the reference rule for projectiles fired together, so it stays, with sequential volleys and a shotgun flag added (S4).
2. **Gem quality (D5).** Not built. Enhance is recorded as the one unfaithful gem.
3. **The gems COVERAGE left out (D7).** None of them: the plan covers the 326 gems of the audit.
4. **Curses (D4).** The 3.9 duration, effect lists and curse limit.

5. **Numbers.** The 3.9 value where the engine can express the loop (costs, cooldowns, durations, effectiveness), scaled by Bob's
   curves; Bob's tuned values stay only where the reference game has none.
6. **The AI's policies (section 5).** Accepted as written. They are the only allowed adaptations.
7. **Bot samples.** One at the S4 stopping point and one at S14, and none in between. A sample is a regression detector. If a
   result is far from the earlier numbers, the plan does not rebalance gems; it reports and the user decides (the difficulty
   knobs, or a gem).
8. **Starting.** The user, 2026-10-08: implement the entire plan, **but wait for their go-ahead**. Nothing is built until they
   give it. The first milestones are S0, S1, S2 in that order, with the sample and a pause at S4.

---

## 12. Edits on approval

- `docs/DESIGN.md`: Appendix A (the decisions D1 to D8) and 2.1 (the rows of section 3); section 11 (gems) for the new fields.
- `docs/COVERAGE.md`: a note that `covered` is now `faithful` by the ledger; the "Known divergences" line rewritten as each
  divergence is removed.
- `docs/AUDIT-GEMS.md`: a status line pointing here; a second section at S14.
- `CLAUDE.md`: a pointer to this plan beside the audit's, and, when S0 lands, one line for `npm run spirit`.
- `docs/coverage/README.md`: the ledger file.

---

## 13. Progress

All milestones are built (2026-10-08). One row for each:

| #   | State | What was built                                                                                                                                                                                                                                            |
| --- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S0  | done  | The ledger (`docs/coverage/spirit.json`, `npm run spirit`), the join of a gem with its reference, the effects smoke.                                                                                                                                      |
| S1  | done  | Cast on Melee Kill and kill triggers, the four old hexes castable, Multistrike and Dual Strike repaired.                                                                                                                                                  |
| S2  | done  | Skill cooldowns with stored uses, spending charges to skip them, a skill that grants a buff on use; Discharge, Immortal Call, Vengeance, Ice Bite.                                                                                                        |
| S3  | done  | The enemy status layer (hinder, maim, blind, exposure, doomed and the rest), curses and marks with their 3.9 effects, shouts.                                                                                                                             |
| S4  | done  | Projectile shapes (sequential, parallel, shotgun, nova, tornado) with the once-per-target rule kept; the S4 bot sample.                                                                                                                                   |
| S5  | done  | Channelling builds stages and is released (`src/sim/channel.ts`).                                                                                                                                                                                         |
| S6  | done  | Ground and lasting objects: consecrated and chilling ground, crystals, walls, orbs, banners (`src/sim/fields.ts`, `banners.ts`).                                                                                                                          |
| S7  | done  | Skill damage over time as its own debuff, proliferation, Bane, pods, overkill burn.                                                                                                                                                                       |
| S8  | done  | Blink and travel: Flame Dash, Frostblink, Lightning Warp, Withering Step, Blink Arrow, Charged Dash, Frost Lance, Venom Gyre.                                                                                                                             |
| S9  | done  | Stances, Berserk, Blood Rage, Bladestorm.                                                                                                                                                                                                                 |
| S10 | done  | Deployables that do what they do: mines set off together, ballistas, Cairns, bonds.                                                                                                                                                                       |
| S11 | done  | Corpses: Raise Spectre, Bodyswap, Pyre Burst, Animate Weapon.                                                                                                                                                                                             |
| S12 | done  | Minions: offerings, golems, supports, the Guardian.                                                                                                                                                                                                       |
| S13 | done  | The long tail in three batches: the supports (`supportFx.ts`), the attacks, spells and auras, traps and guards (`skillFx.ts`, the `SkillFx` fields of a gem); ledger 322 of 326 faithful.                                                                 |
| S14 | done  | Second audit by fresh reviewers (288 faithful, 37 drifted, 1 gutted as reviewed), the repairs it found, card text for every special field (`src/ui/gemFx.ts`), docs, the final bot sample. Ledger: 318 of 320 faithful (six gems were cut on 2026-10-09). |

---

## Appendix: the 171 gems, by the part that finishes them

A gem is listed at the last part whose engine piece it needs, by keyword match on the audit's missing primitives. Verdict
in brackets (G gutted, D drifted). S0 recomputes this from the ledger.

### S2 The use model (10)

Anvil Drop (Crushing Fist) [G]; Guarded Strike (Vigilant Strike) [D]; Deathless Call (Immortal Call) [D]; Blinking Cut (Flicker Strike) [G]; Charge Release (Discharge) [D]; Cinder Herald (Herald of Ash) [D]; Storm Herald (Herald of Thunder) [D]; Stagger Resolve (Endurance Charge on Melee Stun) [D]; Frost Fang (Ice Bite) [D]; Lightheart (Inspiration Support) [D].

### S3 The enemy status layer, and curses (18)

Tide of Judgement (Wave of Conviction) [D]; Void Curse (Despair) [D]; Penance (Punishment) [D]; Ruin Sigil (Assassin's Mark) [D]; Plenty Sigil (Poacher's Mark) [D]; Warlord Sigil (Warlord's Mark) [D]; Kindled Bellow (Infernal Cry) [G]; Jaws Trap (Bear Trap) [G]; Brittle Doom (Elemental Weakness) [D]; Leaden Limbs (Temporal Chains) [D]; Deep Chill (Bonechill) [D]; Wither Mark (Withering Touch) [D]; Charged Breath (Infused Channelling Support) [D]; Dazzle (Blind Support) [D]; Guard Breaker (Block Chance Reduction Support) [G]; Rout (Chance to Flee Support) [D]; Hamstring (Maim Support) [D]; Standing Curse (Blasphemy Support) [D].

### S4 Projectile shapes (16)

Rime Splinter (Frost Blades) [D]; Storm Quill (Galvanic Arrow) [D]; Bolt Cleave (Lightning Strike) [D]; Slag Blow (Molten Strike) [D]; Splinter Volley (Shattering Steel) [D]; Ghost Coil (Spectral Helix) [D]; Whirl Shot (Tornado Shot) [D]; Toxin Circle (Venom Gyre) [D]; Mortar Bow (Artillery Ballista) [D]; Scatter Bow (Shrapnel Ballista) [D]; Mortar Charge (Pyroclast Mine) [D]; Ricochet (Chain) [G]; Split Shot (Fork) [D]; Wide Salvo (Greater Volley) [D]; Arrow Tempest (Arrow Nova) [G]; Twin Salvo (Volley) [D].

### S5 Channelling (8)

Flurry of Edges (Blade Flurry) [G]; Judgement Tempest (Divine Ire) [G]; Furnace Roar (Flameblast) [G]; Blaze Stream (Incinerate) [D]; Sweeping Cut (Reave) [D]; Blight Hail (Scourge Arrow) [D]; Thunder Spiral (Storm Burst) [D]; Double Release (Unleash Support) [D].

### S6 Ground and lasting objects (11)

Sudden Frost (Cold Snap) [G]; Faultline (Earthquake) [D]; Rime Core (Frost Bomb) [D]; Magma Crack (Tectonic Slam) [D]; Venom Shower (Toxic Rain) [D]; Hoarfrost Mote (Winter Orb) [G]; Standard of Valour (War Banner) [D]; Standard of Dread (Dread Banner) [D]; Blessed Trail (Consecrated Path) [D]; Fervent Halo (Zealotry) [D]; Searing Mantle (Righteous Fire) [D].

### S7 Damage over time and spread (12)

Withering Breath (Blight) [D]; Torch Arrow (Burning Arrow) [D]; Acid Arrow (Caustic Arrow) [D]; Creeping Plague (Contagion) [D]; Sap Bolt (Essence Drain) [D]; Searing Lance (Scorching Ray) [D]; Ruin Ritual (Bane) [G]; Open Wounds (Vulnerability) [D]; Slow Rot (Decay) [D]; Wildfire Spread (Elemental Proliferation) [G]; Foul Brew (Vile Toxins) [D]; Wildfire Seed (Ignite Proliferation Support) [D].

### S8 Blink and travel (8)

Frost Lance (Ice Spear) [D]; Cinder Step (Flame Dash) [D]; Rime Step (Frostblink) [D]; Bolt Step (Lightning Warp) [D]; Rotting Stride (Withering Step) [D]; Storm Rush (Charged Dash) [D]; Shadow Quiver (Blink Arrow) [D]; Close Quarters (Point Blank) [D].

### S9 Stances, guards, rage and absorb (6)

Whirlwind Cleave (Bladestorm) [G]; Surge of Blood (Blood Rage) [D]; Rampage Call (Berserk) [D]; Dune Stance (Blood and Sand) [G]; Stone Stance (Flesh and Stone) [G]; Warding Pack (Meat Shield Support) [D].

### S10 Deployables that exist (6)

Cinder Bond (Searing Bond) [D]; Guardian Cairn (Ancestral Protector) [D]; Slamming Cairn (Ancestral Warchief) [D]; Whirring Motes (Summon Skitterbots) [D]; Chained Charges (Blastchain Mine Support) [D]; Heavy Charge (High-Impact Mine Support) [D].

### S11 Corpses (4)

Pyre Burst (Cremation) [D]; Shadow Swap (Bodyswap) [G]; Bind Shade (Raise Spectre) [G]; Wake Blades (Animate Weapon) [D].

### S12 Minions (7)

Carrion Colossus (Summon Carrion Golem) [D]; Wake Sentinel (Animate Guardian) [G]; Bone Ward Rite (Bone Offering) [D]; Flesh Surge Rite (Flesh Offering) [D]; Spirit Ward Rite (Spirit Offering) [D]; Elemental Pack (Elemental Army Support) [D]; Burning Pack (Infernal Legion Support) [G].

### S13 The long tail (65)

Quiver Rush (Barrage) [G]; Orbiting Blades (Blade Vortex) [D]; Twin Blades (Dual Strike) [D]; Primal Strike (Elemental Hit) [D]; Fuse Arrow (Explosive Arrow) [D]; Rime Mallet (Glacial Hammer) [D]; Cinder Blow (Infernal Blow) [G]; Tempest Mote (Orb of Storms) [D]; Spear Burst (Perforate) [D]; Venom Strike (Pestilent Strike) [D]; Gouge Shot (Puncture) [D]; Charged Blow (Static Strike) [G]; Skyfall (Storm Call) [D]; Rupture Line (Sunder) [D]; Snare Shot (Ensnaring Arrow) [G]; Glacier Wall (Frost Wall) [D]; Rime Rebuke (Glacial Shield Swipe) [G]; Halo Sweep (Holy Sweep) [D]; Cluster Bolt (Kinetic Blast of Clustering) [D]; Cleansing Blaze (Purifying Flame) [D]; Slag Lob (Rolling Magma) [D]; Spirit Saw (Soulrend) [D]; Ghost Shard (Spectral Shield Throw) [D]; Blade Wind (Swordstorm) [G]; Prime Splash (Wild Strike) [G]; Rot Touch (Wither) [G]; Slag Carapace (Molten Shell) [G]; Slipstream Run (Phase Run) [D]; Bulwark Rush (Shield Charge) [D]; Twister Blade (Cyclone) [D]; Snag Lash (Chain Hook) [D]; Thunder Rebuke (Smite) [D]; Lure Totem (Decoy Totem) [G]; Bolt Trap (Lightning Trap) [D]; Drain Trap (Siphoning Trap) [D]; Smoke Charge (Smoke Mine) [G]; Rot Drain Trap (Siphoning Trap of Pain) [D]; Storm Halo (Wrath) [D]; Frost Halo (Hatred) [D]; Arcane Ward (Discipline) [D]; Rimeplate (Arctic Armour) [D]; Sour Herald (Herald of Agony) [D]; Feeble Grip (Enfeeble) [D]; Kindle (Immolate) [D]; Tinderbox (Combustion) [D]; Knife Range (Close Combat) [D]; Firm Hold (Iron Grip) [D]; Steel Resolve (Iron Will) [D]; Triple Cadence (Multistrike) [D]; Freed Rot (Unbound Ailments) [D]; Merciless Cadence (Ruthless Support) [D]; Swift Snares (Advanced Traps Support) [D]; Echoing Blow (Ancestral Call Support) [G]; Rolling Volleys (Barrage Support) [G]; Ward Siphon (Energy Leech Support) [D]; Refine Gem (Enhance Support) [G]; Cindering (Immolate Support) [D]; Swelling Blast (Intensify Support) [D]; Brief Burst (Less Duration Support) [D]; Lingering Effect (Increased Duration Support) [D]; Twin Shadow (Mirage Archer Support) [D]; Veil Cut (Nightblade Support) [D]; Shattering Blows (Shockwave Support) [G]; Flanking Cast (Spell Cascade Support) [G]; Slayer's Echo (Cast on Melee Kill Support) [G].
