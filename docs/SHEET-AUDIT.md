# The damage preview against the damage dealt (audit of 2026-10-14)

The Character sheet, the Strategy tab, item and gem comparisons, the bot's score and the map cards all read one number: the
sheet's DPS (`Character.sheet()`, `sheetDps` in `src/calc/character.ts`). The user's report: it "seems mostly wrong" for a
caster with two main skills by fight type and a rotation of skills on cooldowns, and the melee weapon's damage moved the figure
of a character who never swings it. This file says how the preview was measured against the sim (the game as played), what was
wrong, what was changed, and what is left.

## 1. The yardstick

The sheet claims one thing: **the damage a second one target takes from the rotation, in a fight of a kind** (a pack: three or
more enemies near, or one that is a boss). It is single-target by design (area and chain damage are not added for a crowd), and,
by an earlier decision (docs/MANA.md), it counts every skill at full rate whatever the mana. So the sim is asked the same
question, in an open arena, against a training dummy that does not hit back:

- **boss fight:** the dummy is a boss;
- **pack fight:** the dummy is a normal enemy with three more that take no damage standing near it (so the pack conditions hold);
- the character keeps its first target (the `stick` priority), the dummies cannot be pushed (`fixed`), mana and life are free;
- the sim's number is everything the sim's own ledger says was dealt (`world.ledger.dealt`: skills, ailments, minions), per
  skill, so that an error can be placed in a skill, not only in a total.

Real maps add dodging, walking, packs that take area damage, mana that runs out and kills that change conditions. They are not
in the yardstick; the mana part is measured below (section 4) and left as a decision.

## 2. The tools

| Command                                             | What it does                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dpsaudit -- --class all --maps 6,11,16,21` | Bot builds at the start of those maps, each in both fights: sheet DPS, sim DPS, ratio, and per skill the uses a second and the damage a second on both sides. `--save f.json` keeps the builds, `--builds f.json` reuses them, `--mana` plays with real mana, `--target reference` gives the dummy the reference monster's defence. |
| `npm run dpsgems`                                   | Every damage gem alone (level 50, a fitting weapon, one boss dummy): sheet against sim, worst first.                                                                                                                                                                                                                                |
| `npm run dpsinspect -- <gemId>`                     | One gem: the sheet's uses, hit, crit and DPS beside the sim's observed uses, hits a use, damage a hit and ledger. The first thing to run on a gem that disagrees.                                                                                                                                                                   |
| `npm run dpssupports`                               | Each support on three plain skills: what it does to the sheet's DPS against what it does in the sim.                                                                                                                                                                                                                                |
| `npm run dpsminions`                                | Each summoning gem: the sheet's minion damage (with the minions standing) against the ledger's.                                                                                                                                                                                                                                     |

`scripts/dps-lib.ts` holds the measuring; `createDummyWorld` (`src/sim/dummy.ts`) gained `rarity`, `bystanders` and `fixed`.
`Character.sheet(conds, scenario, target)` takes the target the sim uses.

## 3. What was wrong, and what was done

### 3.1 The rotation

The sim chooses (`chooseSkill`, `src/sim/ai.ts`; docs/PLAYER-AI.md 4.1): the first of the non-main skills whose moment has come;
else the first main skill that can be used; else, with no main skill to use, **a periodic skill that is ready whatever its
pause**; else the weapon. The sheet instead gave the **first fitting main** all the time that the periodic and utility skills
left, **limited it by its cooldown** when it had one, and put the **weapon in the gaps at 90%** (and, for a totem or brand, on top
of the totems at 90%). Differences that follow:

- a main skill on a cooldown (Rime Core, every 2.5 s) has gaps; the sim fills them with a **second main skill**, then **any
  periodic skill that is ready, ignoring its pause**, and only then the weapon. A mine or trap skill used as a periodic skill
  therefore fires about four times as often as its "6 uses, at least 3 s" pause suggests (1.2 a second, not 0.3);
- every other skill the character casts before the main skill delays the main skill a little more than its use time (an action
  is never cut short), so a cooldown skill comes up less often than 1 over its cooldown (0.3 a second, not 0.4);
- a second main skill, and the weapon, were not on the sheet at all, except as the "weapon top-up".

**Change:** `planRotation` (`src/calc/rotation.ts`, tests in `rotation.test.ts`) plays the sim's choice over 300 seconds with
nothing else going on and counts the uses. `Character.plan(conds, scenario)` builds its input from the strategy (mains that hold
in the fight, periodic skills with the main's reach, utility skills at their own intervals, the weapon's use time);
`Character.planned()` turns the counts into the rates `skillSheet` takes. The sheet's DPS is then main + the other mains used +
periodic + the weapon where it is used + triggered + minions. The weapon appears on the sheet as a line of its own
("Default Attack") when it is used, so a caster whose main skill waits on a cooldown can see where the melee weapon's damage comes
from. `secondaryLoad` and the weapon top-ups are gone. Skills with the periodic role and a cooldown of their own are ready when
a use is, as before.

A periodic skill counts when it reaches as far as the main skill or as far as the sheet puts the target (`targetDistance`, 3 tiles
by default): a spell of 8 tiles beside a bow of 9 is in reach of an enemy that has come close, a melee skill beside a bow is not.
The map cards (`scoreTheme`, `src/run/threat.ts`) priced only the primary skill; they now price the whole rotation against a pack
(`Character.rotationDps`). A renewed debuff (Creeping Plague, Ruin Ritual) is not recast while it holds, so the plan treats it as
ready a gap after its last use (`renewalGap`, `src/calc/dot.ts`) and the weapon fills the rest. The Skills tab and the Character
sheet read the plan (`mainSheet`, the "Other skills in the rotation" table).

### 3.2 Totems, brands, traps and mines

- a ballista (Scatter Bow) shoots at half speed in the sim; the sheet ignored it (the shared numbers now live in
  `src/calc/deploy.ts`: `totemInterval`, `deploySecondsOf`, `deployCap`);
- a totem stands a while and is put down again when it ends, so it takes a use to put one down and shoots meanwhile: the plan
  counts the placements (uses) and the shots (fires) apart. `usesPerSec` on the skill's line is the shots a second;
- a trap or mine set by a periodic skill counted one per use, not one per trap in the set.
- **one shot, trap or mine** (`src/calc/deployed.ts`, tests in `sheetVsSim.deploy.test.ts`): a mortar totem (Mortar Bow) lands
  every arrow whose burst reaches the target (6 a shot, not 1); a mine's rain of small bursts is counted by the chance each lands
  on the target (Mortar Charge: about 2 hits a mine, not 1); the aura of the mines near the target adds raw fire damage to every
  hit (the sim's `Mine` ledger row) and, for Storm Charge, more damage taken; a wall (Glacier Wall) hurts once as it goes up, not
  every half second. Traps and mines stand in the rotation plan now (`setStanding`): the character lays no more once as many as
  may stand do (3 sets), and uses its weapon until they go off, as the sim does (Mortar Charge 4.0 to 2.05 sets a second, with
  0.68 weapon uses a second; Shrapnel Trap 1.0 to 0.58). Fire Breath Trap stays 15% low: its "more damage against the ignited"
  holds in the sim (the dummy burns) and the sheet takes no condition of the target for granted (section 6).

### 3.3 What one use of a skill lands on a target

The rotation says how often a skill is used; these say what a use is worth. Each is a small module in `src/calc/` that counts what
the sim does with the gem's own fields (never a gem id), with a test that plays the gem against the sim
(`src/calc/sheetVsSim.<family>.test.ts`, held to 0.9 to 1.1; the supports named below are checked too).

| Module                | What it counts                                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `afterHit.ts`         | the bolts, balls, bounces and scattered arrows that follow a hit (Bolt Cleave, Slag Blow, Slag Lob, Whirl Shot)                                                                                                                        |
| `ailmentMax.ts`       | only the strongest bleed or ignite burns, not the average (Gouge Shot, Torch Arrow)                                                                                                                                                    |
| `patterns.ts`         | pods, volleys, the pulses of a drifting orb, the ground a skull leaves, the true shotgun, the clones of Mirror Quiver, the cold wave of Prime Splash, the debuff that makes a skill's own later hits harder (Snare Shot)               |
| `channelFx.ts`        | the thorns a channel scatters (Blight Hail), blades that circle (Orbiting Blades), a mote's own beat (Tempest Mote), half-hit builds (Judgement Tempest), an exposure at the top stage (Searing Lance)                                 |
| `dot.ts`, `geyser.ts` | how long a carried debuff stays on (Spirit Saw); how often the character recasts a renewed debuff (`renewalGap`: Creeping Plague, Ruin Ritual, the weapon fills the rest); the blasts of a geyser (Pyre Burst)                         |
| `melee.ts`            | a spin's sweeps, the bladestorm, the aftershock, charges, beams, the Triple Cadence ramp, the buffs a skill keeps up by its own use (Whirlwind Cleave, Faultline, Charged Blow, Cinder Blow, Thunder Rebuke, Bulwark Rush, Storm Rush) |
| `deployed.ts`         | every arrow of a mortar totem, a mine's rain and aura, the traps and mines that stand (Mortar Bow, Mortar Charge, Shrapnel Trap, Storm Charge, Glacier Wall)                                                                           |
| `minionDps.ts`        | a golem or colossus counts one target, a relic its nova, a band its gaps between lots, the minion supports (all the summoning gems except Bind Shade)                                                                                  |

Also fixed in `skill.ts`: a crystal (Rime Core) and a wall are one hit, not a pulse each interval (Rime Core was five times too high,
and it is the first spell most characters are given).

### 3.4 What came out of the sim, and was put right there

- Whirring Motes put 15 to 18 on a shock the sim reads as a fraction (shock of 1500%): one line, `sk.v / 100` (`src/sim/skillFx.ts`);
- a wall of ice pushed a fixed training dummy along (`src/sim/fields.ts`). Test: `src/sim/auditFixes.test.ts`.

### 3.5 Results

On the bot's builds, free mana (`npm run dpsaudit -- --builds <saved> --time 150`), typical error = mean of |ln sim/sheet|:

|                                                                                                                                                                                | before    | after     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | --------- |
| 35 builds, maps 6 to 16 (level 5 to 17, all classes): typical error, pack / boss                                                                                               | 30% / 29% | 16% / 17% |
| within 10%, pack / boss                                                                                                                                                        | 9 / 8     | 15 / 14   |
| within 25%, pack / boss                                                                                                                                                        | 20 / 20   | 30 / 27   |
| sheet more than 25% too high, pack / boss                                                                                                                                      | 9 / 8     | 2 / 3     |
| 31 builds, maps 20 to 44 (level 19 to 49), boss, leaving out 3 that cannot pay for their main skill: typical error (before = with the rotation plan, without the per-gem work) | 21%       | 20%       |
| ... within 10%                                                                                                                                                                 | 9         | 13        |

Every damage gem alone (`npm run dpsgems`, 121 gems, level 50, boss dummy): **within 10% 75 to 113, within 25% 88 to 118.**
Every support on three plain skills (`npm run dpssupports`, 344 pairs): 324 within 10%, 329 within 25%. Summoning gems
(`npm run dpsminions`): all within 3% of the sim except Bind Shade (below).

The later-map builds improve less: what is left there is mostly mana (below), and skills that act on their own (totems, motes, mines)
in the pack fight, where the dummies standing around take the shots the sheet counts on the one target. The boss fight is the
cleaner yardstick for damage; the pack fight is for which skills the rotation uses.

The bot's depth did not move (18 runs, median map reached 19 before, 20 after); the bot's score reads the same sheet and was not
retuned.

## 4. Mana (left as a decision)

The sheet counts every skill at full rate (docs/MANA.md). What the sim does with real mana:

- in a **continuous** 150 s fight the 35 low-level builds deal on average 17% less than with free mana (17 of them more than 20% less);
- in a **30 s** fight from a full pool (about the length of a pack) they deal 1% less: the pool and the flasks last;
- a build whose reservations leave **less mana than its main skill costs** can never cast it, whatever the sheet says: three of the
  31 later-map builds (sim 250 against a sheet of 2500) dealt only what their weapon does. The Skills tab says "Mana-starved" but the
  sheet's DPS does not change.

A model of the pool (regeneration, cost, mana on hit, the weapon as the free fallback) was built into the rotation plan and tried
as a second, sustained figure: with the regeneration alone it undershot the sim by 46% over a long fight (flasks, leech and the
mana a kill gives are not in it), and spread over a 30 s fight it still read 13 points under the sim. It was taken out again. A
cheap and honest change would be to make the sheet say, in red, when the main skill cannot be paid for at all.

## 5. Things the audit found that are not the sheet's to fix

Sim behaviour that contradicts what the gem says; **not changed**, because each changes how a gem plays:

- **Rime Splinter** (`afterStrike`, `src/sim/shots.ts`, the blades branch): the blades start from the struck enemy with an empty
  hit list, so the first one hits it again: two hits a use on a lone enemy, against the gem's text ("from behind the enemy at the
  others near it") and its siblings (the shield shards seed the struck enemy's id). The fix is `hitIds: [struck.id]`; the sheet
  already counts no second hit (sim/sheet is 1.98 until then).
- **Bind Shade**: the spectre's blow reads `spellBaseDamage(corpse level)` (`raiseSpectre`, `src/sim/minions.ts`; `minionStrike`,
  `src/sim/minionFx.ts`), which is the gem-level curve and reaches 40 thousand at level 41: 24 thousand damage a second in the dummy
  against a character's own 190. Either read the blow at the gem level or use a monster damage curve.
- **Hallowed Relic** stays where it is put (reach 6); the text says it follows the character.
- **Mirror Quiver** clones are not capped (about four stand at once at 1.4 uses a second); the clone data has `respawn: 4`, which
  `summonAt` ignores.
- **Swelling Blast** shrinks area spells by 12% a stage; the text says they swell.
- **Slow channels:** `LULL = 0.9 s` ends a channel whenever two uses are more than 0.9 s apart, so a channelling skill with a slow
  use time (Blight Hail on a ballista, or with little attack speed) can never build its stages.
- `reference/coverage/spirit.json` still says Hallowed Relic's "nova trigger not modelled"; the sim models it.

## 6. Open

- **Self-applied debuffs.** A skill that makes the target take more damage from the rest of the rotation is not counted for the
  rest: Rime Core's cold exposure (Frost Lance beside it hits 23% harder in the sim), Whirring Motes' shock, Snare Shot beyond its
  own hits. It wants the plan's uses and a target with a resistance.
- **Charges that skip a cooldown** (Blinking Cut, Guarded Strike): credited at the skill's own chance per hit; the sim also rolls
  them on the hits of the other skills (0.85 uses a second against 0.47 on one build).
- **Rage** is assumed at 20; a skill that gains rage on every melee hit (Snag Lash) sits near 39 in the sim (1.24 of the sheet).
- **Opener, emergency and keep-up damage skills** are not in the plan (the opener is once a fight).
- **Triggered skills** are priced on the main skill's hits only.
- **A periodic skill with less reach** than the main skill and than where the target stands is counted as never cast
  (PLAYER-AI.md 4.2).
- **Conditions.** The sheet assumes what `steady` names (and the camp, none); the sim has what is true. Fire Breath Trap's "more
  against the ignited" is true in the sim, where the dummy burns. A support like Fresh Vigour ("at full life") reads 1.0 on the sheet
  and 1.3 in a dummy fight that never hurts the character.
- **Elements.** A skill that picks fire, cold or lightning for each use is priced as fire (the ignite share is corrected, not the
  shock and chill).
- **Charge Release** needs charges; with no source the sheet says 0 and the sim swings the weapon (about 100 a second).
- **Corpses.** Skills that raise or burst corpses are priced as if there were always one, as before (Pyre Burst now reads 0.92 of
  the sim with a corpse laid every 0.4 s).
- **Burning Pack**, Offerings and the Hallowed Relic's hit chance are not modelled.
- The pack fight of the audit is a yardstick for the rotation, not for damage (see 3.5).
