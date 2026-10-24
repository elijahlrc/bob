# SUPPORTS: making support gems do what they say, and be worth choosing (plan)

Status: built, 2026-10-12 (section 7 says what was built and where it differs from the plan). Written after the "Twin Salvo does nothing
on Arrow Shower" report.
Evidence: the local reference research note (`reference/docs/research/`, not in the repository: what the reference game does, with sources) and `docs/research/support-audit.md`
(what every support does in Bob, with a matrix of dead pairings). Read those for numbers; this document is the decision and the work.

## 1. The problem, in three layers

1. **The bug.** Twin Salvo is accepted on Arrow Shower and does nothing: `skill.ts:800` counts projectiles only for `projectile`
   behaviour, and Arrow Shower is a `ground` zone whose arrows are "folded into one pulse" (the local gem audit). The mana cost and the damage
   penalty still apply, so the socket is worse than empty.
2. **The class.** Acceptance is decided by skill types alone (`typesAllow`, `skillTypes.ts:54`); nothing checks that the support's effect
   can happen on the skill's behaviour. Of 1,092 pairs where the effect depends on behaviour, **280 are dead or half dead (19 supports,
   78 of 124 damaging skills)**, **101 are strictly worse than an empty socket**, and 33 are free lunches (the penalty is the dead part).
   The projectile-count family is dead on 14 skills. Utility skills (curses, buffs, minions) accept 98 of 120 supports, about 2,200
   pairs with nothing to act on. Blunt Intent zeroes the damage of 46 pure-elemental pairs.
3. **The shape of the pool.** Most supports are either an unconditional damage multiplier or a count/penalty swap; a few are outliers
   (Triple Cadence about 4.7x DPS in the sim; Snare Cluster strictly dominated by Triple Snare; Refine Gem dominated by Steel Resolve /
   Firm Hold). `volleyable` is declared on 21 skills and used by no support. That is the "supports are not interesting or balanced" part.

## 2. What the reference game does (verified in the research file)

- **Its arrow rain** fires many arrows (18 at level 1, 22 at 20; the reference counts are inferred), each with its own small area. Half land
  at random, half on targets in rings; **extra arrows go on outer rings and widen coverage without raising damage on one target** (the
  developers). The greater and lesser extra-projectile supports **are allowed** on it by a special per-skill flag. The fork, chain,
  pierce, parallel-volley and arrow-nova supports are **not**, because the arrows never collide. The greater extra-projectile support at level 20 comes to about 0.87x total damage and 0.74x on
  one target: a coverage tool paid for with damage and cost, not a free multiplier.
- **Its exploding rain** (the same family, overlapping arrows) goes the other way: the reference version made extra projectiles add extra explosions on the same
  spot. The same support is worth about 1.23x there. **Same support, opposite value, decided by the skill's geometry.**
- **Eligibility is a per-skill capability flag, not a tag**: can volley, can cascade, can repeat, takes a projectile count.
  The arrow rain has the Projectile tag but not the flags that the fork, chain and pierce supports need. Dead pairs are rejected by data; the reference game does not give
  a no-op support a penalty.
- **Its lateral-cascade support** is a lateral copy: three areas (target, one in front, one behind), area 25..16% less, damage 40..21% less, 140% cost,
  spells only, no totems/traps/mines/minions. Bob's Flanking Cast re-casts on the same point, which is an Echo with extra steps.
- **Design rules its developers state** (in the reference version and a later design statement): the multiplier is the price and the mechanic is the product; pair each count
  bonus with a different cost axis (damage, attack time, risk, reliability); side-benefit supports stay under about 25% more damage at
  level 20, damage-only about 30-35%, real downsides 38-48%; pure damage supports were cut because they crowded out interesting ones;
  keep tiers distinct (the lesser extra-projectile and parallel-volley supports were cheapened in the reference version because the greater one dominated); a flat "+N projectiles" is worth N over the skill's
  base count, so tune the base count.
- Unverified: the cascade delay, exact reference arrow counts, the sequential-arrow support on the arrow rain, the melee repeat support's numbers (the reference wiki and the reference data
  disagree), the lesser extra-projectile support's penalty in the reference version (the reference data only).

## 3. Principles for Bob

1. **A support never costs anything on a skill it cannot affect.** Not "warns": cannot be socketed to effect. The reference game refuses; Bob refuses.
2. **Skill geometry decides what "more" means; the support stays uniform.** `+N projectiles` is the same text everywhere and pays off
   differently on a fan, a rain, a stacking barrage and a strike-then-bolts skill.
3. **Every support has a price axis and a product, and the product is a behaviour where possible.** Pure multipliers get a drawback or
   stay in the lowest band.
4. **Calibrate with bands, not feel.** Utility/side-benefit: under about +25% at level 20. Damage-only: about +30-35%. Real downside:
   +38-48%. Check the pool against this with one script, not by eye.
5. **Tiers are distinct.** Twin Salvo, Triple Shot, Wide Salvo, Rolling Volleys each win somewhere (cost, small base counts, high base
   counts, single target).
6. **One source of truth for "does this work here", and it is the gem data.** No list of pairs, no per-skill or per-support authoring.
   The verdict is computed at runtime from what the support's mods say and what the skill is, by the same code the calc uses.

## 4. The design

### 4.1 Compatibility computed from the gem data (the generalisation)

A support is a list of mods (`stat`, `kind`, `value`, optional `tags`, `damageTypes`, `condition`). A skill is its tags, types,
behaviour, `SkillFx`, own mods and conversions. That is enough to answer "can this mod change this skill?", in three layers that already
exist or are small:

1. **Mod gates already in the data.** `tags` (Wide Crush's damage needs the `area` tag), `damageTypes` (Frostbreaker needs cold) and
   `condition` are matched against the skill by the mod database's own matching. Reuse that matcher; a mod it would not apply to is dead.
2. **Behaviour reach, asked of the calc itself.** Stats like `projectiles`, `pierce`, `chains`, `aoe`, `skillDuration`, `cascade`,
   `extraTargets`, `shockwave` are only honoured by some behaviours. Today that knowledge is scattered through `skill.ts` as ad-hoc
   conditions (`beh.kind === 'projectile' ? ... : 1`). Gather it into **one function, `reaches(stat, skill)`, that the profile builder
   calls when it sums the stat and that the compatibility check calls too**. They cannot disagree, because it is the same call: the
   Arrow Shower bug is exactly the two places drifting. It is code beside the profile builder, not a table of pairs; a new skill or support
   needs no entry. A test probes each behaviour kind with the real sim (one exemplar skill per kind) to keep `reaches` honest.
3. **Upside versus price, from the mod's sign.** A mod that lowers damage, speed or crit, or raises cost, is a price; the rest are upsides.
   A support is **live on a skill if it has at least one upside mod that passes layers 1 and 2**, or an upside that is not a stat (a
   trigger, a `levelBonus`, a `global`, `hexOnHit`), which is live by construction.

Acceptance becomes `typesAllow(support, skill) && supportLive(support, skill)`. The same call returns a **reason** built from the dead
mod ("Arrow Shower fires no projectiles", "Storm Arrow's chain carries one arrow", "no area on this skill") for the gem status line.
Consequences and rules:

- **Penalty-only pairs are refused.** Wide Crush on a thrust (see section 6) has no live upside, so it is simply not offered. A
  support with one dead upside and one live one is accepted; the dead half just does nothing and says so in its text on that skill.
- **Free lunches are the reverse problem**: the price mod is dead and the upside is live (Lingering Shots' slow projectiles on a ground
  skill). They are accepted, and the balance script flags them; fix each by moving the price somewhere that always lands.
- **Intentional absences stay in the skill's data** as it already says what it is: Storm Arrow is a `chain` behaviour, Rime Drift a
  `creep` projectile, Pyre Burst a `burst`. `reaches` reads that; there is nothing to author. Where a skill is a special case (a mirror
  arrow, a single orb), the `SkillFx` key already marks it, and `reaches` treats the key as the reason.
- **Utility skills** (curses, buffs, minions, blinks, banners) carry a `utility` field already. Damage-class upsides do not reach a skill
  with no hit (layer 2: the stat `damage` reaches only skills with a hit). The roughly 560 meaningful pairs (triggers, minion supports,
  Standing Curse, Quick Cast, Lingering Effect) pass because their upside is not a damage stat.
- `gemStatus` (`Skills.tsx:57`) shows the reason. A run that already has a now-refused support socketed keeps it, greyed and inactive,
  and pays no cost for it (no save migration, no surprise loss).
- A vitest enumerates every support x skill pair and fails on any accepted pair with no live upside that is not on an allowlist (which
  starts as today's dead pairs and shrinks to empty in phase 2). This stops the class from growing as gems are added.

### 4.2 Making "more instances" real, per behaviour (the reference game's rule: geometry decides)

| skill                                                                        | geometry              | what `+N projectiles` does                                                                                               | reference analogue    |
| ---------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| Arrow Shower (`ground`)                                                      | rings                 | one zone, N landing spots on rings; **N widens the area, one hit per enemy per pulse**; single-target damage never rises | its arrow rain        |
| Ember Downpour (`ground`)                                                    | stack                 | N small explosions on nearly the same spot; **each hits**, so N adds damage on one target                                | its exploding rain    |
| Rime Splinter, Bolt Cleave, Slag Blow, Prime Splash (`melee` + `afterHit`)   | bolts after a strike  | `spec.count + N` bolts; the shared hit list keeps once-per-target                                                        | normal projectile fan |
| Whirl Shot (`tornado`)                                                       | 3 secondaries         | `3 + N` secondaries                                                                                                      |                       |
| Drifting Storm                                                               | one orb               | refuse (or N orbs; decide)                                                                                               |                       |
| Storm Arrow, Rime Drift, Mirror Quiver, Pyre Burst, Slag Lob, Hoarfrost Mote | single object / chain | refuse via data                                                                                                          |                       |

The baseline must not move. Give the `ground` behaviour `count` (default 1 = today) and a `spread: 'rings' | 'stack'`. A skill that
gets a real base count (say Arrow Shower 6 landing spots, a working number to tune) keeps today's total coverage and damage at the
default: per-spot radius `b = R0 / sqrt(n0)`, per-spot damage `folded / n0` in `stack` mode. With `rings`, N spots cover an envelope of
radius `R0 * sqrt(N / n0)` at the same density, which is exactly "extra arrows widen the shower". Then `+2` on 6 is +33% area, `+4` is +67%,
and Twin Salvo's cost/penalty buys coverage on packs. The sheet's pack scenario needs a coverage term (reuse the `volleyHits` pod overlap
formula, `character.ts:2038`); the single-target figure stays flat, which is true to the reference game and to docs/SPIRIT.md (one hit per use).

Lanes (`projectilesParallel`, sequential, nova) are not projectile paths on a rain: on ground skills only the **count** half of Twin Salvo,
Wide Salvo, Triple Shot and Rolling Volleys is live. Say so in their text rather than splitting the gems. Rolling Volleys' sequential
half becomes stagger: each spot gets its own `delayT` (the `fireVolleys` pattern, `skillFx.ts:922`).

Implementation (from the audit, section 5.1): one calc line (`skill.ts:800`), the ground branch of `fireEffect` (`actions.ts:568`),
`spots?` on `SkillZone` with a loop in `tickSkillZones` (`actions.ts:239`), the loop in the renderer's `zones()` (`skillFx.ts:446`), and the
same `spots: undefined` on the other four zone literals (`actions.ts:290`, `shots.ts:543`, `skillFx.ts:503`, `skillFx.ts:922`) so the
object shape stays stable. `placePods` (`fields.ts:128`) is the placement helper to reuse. No new event type: `explode` already fires per
pulse. Do not add fields to `Actor`. Edit gem data through `reference/coverage/gems/*.json` and `npm run coverage:emit-gems`, never `gemsGen.ts`.

### 4.3 Sheet and sim parity (cheap, found by the audit)

- Ground pulses ignore `skillDuration` in the sim (`actions.ts:584`) but the sheet counts it: Lingering Effect on Ember Hail shows 11
  pulses and hits 97 times either way. Fix the sim; update the `SkillZone` comment.
- Flanking Cast on a self-centred nova (Blizzard Ring) fires three novas on the caster (`actions.ts:526`). Make Cascade lateral:
  offset along the line to the target, front and back, as the reference game does, and refuse it on `origin: 'self'` skills.
- Echoing Cast on traps repeats the placement, not each shot (`deploy.ts:235`), while the sheet multiplies every shot. Pick one and make
  both agree (recommend: the repeat applies to the use, so it places another set; correct the sheet).

### 4.4 Making supports interesting and balanced (the "write large" part)

**Scope (your call, 2026-10-12):** the work is fixing and balancing first. Add a new support only where the reference game has an obvious one that is
missing, or where an idea is clearly good; do not invent a roster. The candidates below are the ones that pass that test, in this
order; anything else waits for a reason.

**Interesting.** Today `repeatable`, `cascadable`, `trappable`, `mineable`, `totemable` are each used by one or two supports, `volleyable`
and `orb` by none. Candidate supports, each a trade plus a geometry, in the reference game's spirit:

- _Scatter_ (trap/mine, ground): copies thrown at random within a disc instead of a line (as the reference game's scattered and lined-up trap supports differ). Replaces the
  dominated Snare Cluster; gives Triple Snare a distinct partner.
- _Lateral cascade for attacks that land on the ground_ (Arrow Shower, Ember Downpour): a staggered second and third shower to the sides,
  area and damage down. Uses `volleyable` or `cascadable`; this is the "more AoE regions" support the user asked about.
- _Hold the line / Rolling Volleys on a rain_: stagger (above) as a real identity, with an attack-time cost per extra arrow (the reference game's rule for its sequential-arrow support).
- A risk-priced damage support (as in the reference game): more damage per consecutive use, self-cost on a miss window. Optional.

**Balanced.** One script, `scripts/audit-supports`, computes for each support at level 20: damage more, speed more, mana per second
multiplier, and the capability it unlocks, then flags: outside its band (section 3, rule 4), strictly dominated by another support with the
same `supports`/`needs`, or worse than empty on the skills it is accepted on. Known targets: Triple Cadence (about 4.7x), Cruel Flight
(second `more` is damage over time only; its sheet number is inflated), Blunt Intent (1.59x on everything, zero on pure elemental),
Snare Cluster, Refine Gem, Chained Charges / Heavy Charge (0.3 cost multiplier), and the pure-multiplier group (Brute Force, Focused Ruin,
Patient Power, Lingering Cruelty, Channelled Elements) which get a drawback or sit in the lowest band, as the reference game's developers did in a later version. Per project
rule, this uses one bot sim at the end of the work, not incremental sims, and does not tune bot kill times into player balance.

## 5. Order of work

| phase | what                                                                                                                                                                                                                                                                        | size         | why first                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| 0     | `reaches(stat, skill)` gathered out of `skill.ts` and called by the profile builder; `supportLive` with a reason for `gemStatus`; enumerating vitest with an allowlist of today's dead pairs; fix ground `skillDuration`; correct the local gem audit for the ground skills | small        | stops the class growing, no behaviour change, makes the user's case visible in the UI |
| 1     | Ground `count`/`spread` and spots (sim, calc, sheet, renderer, tests); melee `afterHit` count; Whirl Shot                                                                                                                                                                   | medium       | fixes the report, makes the supports work where the reference lets them               |
| 2     | Turn on refusal: `typesAllow && supportLive` in acceptance; greyed-out socketed leftovers; shrink the allowlist to empty                                                                                                                                                    | medium       | removes the 101 worse-than-empty pairs and the 2,200 utility pairs                    |
| 3     | Cascade made lateral; Echoing Cast on deployables decided; sheet/sim parity                                                                                                                                                                                                 | small-medium |                                                                                       |
| 4     | Balance script and pass: outliers, dominated supports, bands; one bot sim                                                                                                                                                                                                   | medium       | needs 0-3 so numbers mean something                                                   |
| 5     | New supports (section 4.4)                                                                                                                                                                                                                                                  | open         | only after the pool is honest                                                         |

Each phase ends with `tsc`, prettier, the full suite (the x9 "forty Swarm actors" speed test is flaky under parallel load and passes alone)
and a docs/PROGRESS.md entry. Phase 1 adds a ground-skill speed test so the zone work cannot cost speed unnoticed.

## 6. Decisions

Decided (2026-10-12):

1. **Refuse** a support on a skill it cannot affect (the reference game's rule). Existing socketed pairs stay, greyed and inactive.
2. **Arrow Shower widens coverage (rings); Ember Downpour stacks explosions**, per the reference game (its arrow rain versus its exploding rain).
3. **Six base landing spots** for the two ground skills; the default look and total damage do not change.
4. **Scope of 4.4**: fix and balance first; add a support only where the reference game has an obvious missing one or the idea is clearly good.
   Compatibility comes from the gem data (section 4.1), not from a table.

Open:

4. **Wide Crush and the free lunches.** Wide Crush is a melee support: 40-59% more damage that only applies to skills with the `area`
   tag, 25-34% increased area, 15% less attack speed, 1.4x cost. A skill with no area (the audit lists 12: Crushing Blow, Venom Cut, Twin Cut,
   Twin Blades, Rime Splinter, Rime Mallet, Bolt Cleave, Gouge Shot, Iron Rebuke, Guarded Strike, Blinking Cut, Guardian Cairn) gets neither the damage (tag gate) nor the area (nothing to widen), so only the attack-speed penalty is left. It is not
   half dead there, it is fully dead with its price intact, and section 4.1 refuses it on those 12 skills; on area-tagged melee skills it
   is fully live. The "half dead" cases are the reverse, a dead price with a live bonus (Lingering Shots on a ground skill: the slower
   projectiles never matter, the extra damage does). Recommend accepting those, flagging them in the balance script, and moving each
   one's price to something that always lands. Say if you would rather refuse them too.

## 7. What was built (2026-10-12), and where it differs from the plan

**Compatibility from the data** (4.1): `src/calc/reach.ts`. `supportLive(support, skill)` answers whether a support can act on a skill, with a
reason. A mod is dead when its `tags` name a keyword the skill cannot have (the `area` keyword needs a real area, not just the tag), when its
damage type is one the skill cannot deal (`damage` and `penetration` only: added damage makes its own), when its stat is one the skill's
behaviour does not honour (`REACH`), or when it is about hits and the skill makes none. A support is live when its defining mod is: if it has
a behaviour stat (projectiles, pierce, area, ...) one of those must act, so a plain damage bonus does not keep Piercing Shot on a rain of
arrows; a duration side effect does not define a support (Swift Snares). A trigger, a level bonus, a global mod and a pure cost cut are live
wherever the types allow. `Character` filters the linked supports with it (`SkillChoice.inert` keeps the refused ones and why), the gem
status line shows the reason, and the profile builder gets its projectile count from the same file (`projectileBase`).
Of 10,730 pairs the types allow, 1,998 are refused: 1,280 are damage supports on skills that deal no damage (curses, buffs, blinks) and 718
have a defining effect that cannot act (421 of the 7,985 pairs on damaging skills, the rest utility skills with a stat that means nothing to them).

**Rains** (4.2): `src/sim/rain.ts`, with `count` and `spread` on the `ground` behaviour. Six arrows each. Arrow Shower: rings, hit once.
Ember Downpour: stacked explosions, each a sixth of the use. Rime Splinter, Bolt Cleave and Slag Blow send more bolts, blades or balls
(`afterStrike`); Whirl Shot scatters more. The sheet counts a stacked rain's extra explosions (`volleyHits`) and not a ring's.

**Not as planned.** (a) Flanking Cast was already lateral (before and behind the target); the plan's "repeats on the same point" came from a
stale audit note. It needed only the refusal on a nova around the caster, `needs: spell`, and an attack twin, **Flanking Volley**, for the rains
and slams, so the "more areas" support exists. (b) Echoing Cast on deployables: a trap or mine repeated is another set laid, which the sheet
already counted, so only totems and brands are excluded. (c) The sim and the sheet disagreed on ground-zone pulses and `skillDuration`; the sim now
counts them as the calc does.

**Balance** (4.4): `scripts/audit-supports.ts` prints every support's numbers and the ones beaten outright. Changes: Triple Cadence deals
about 1.45 times the plain skill and not 4.7 (its repeats cost no time; the cost is now written as -55% to -52% attack speed); Snare Cluster
scatters five traps over a wide place (it was Triple Snare at a higher price); Kindle and Cindering, one gem at two prices, are one gem (Kindle; a
saved Cindering loads as Kindle); Blunt Intent and the penetration supports are refused where the skill deals no such damage. **Left alone on purpose:** the
pool as a whole follows the reference numbers, which are above the developers' later bands (damage-only supports give about +35% to +59% at level 20 against 30-35%
in their later note). Moving them is a game-wide rebalance that needs a bot run and a decision; the script shows where each stands.

**New supports:** Flanking Volley and the scatter on Snare Cluster. Nothing else was added: a risk-priced damage support and the
rest wait for a reason.
