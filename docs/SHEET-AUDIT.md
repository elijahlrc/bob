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

### 3.2 Totems, brands, traps and mines

- a ballista (Scatter Bow) shoots at half speed in the sim; the sheet ignored it (the shared numbers now live in
  `src/calc/deploy.ts`: `totemInterval`, `deploySecondsOf`, `deployCap`);
- a totem stands a while and is put down again when it ends, so it takes a use to put one down and shoots meanwhile: the plan
  counts the placements (uses) and the shots (fires) apart. `usesPerSec` on the skill's line is the shots a second;
- a trap or mine set by a periodic skill counted one per use, not one per trap in the set.

### 3.3 One skill's own model

- **Rime Core (and every crystal):** the sheet counted a pulse of the ground every half second (four hits a use); the sim stands
  the crystal and bursts it once. It was five times too high, and it is the first spell most characters are given. Fixed in
  `buildProfile` (`pulses` is 1 for a crystal).
- **A utility skill with a cooldown of its own** (a blink) was cast on that cooldown in the plan; it is cast at the interval the
  character keeps (`utilityLoad`). Verified against the sim with Wither beside a spell: 31.7 on the sheet, 32.0 in the sim.

### 3.4 Results on the bot's builds (35 builds at maps 6, 11, 16, level 5 to 17, all eight classes)

|                                                | before  | after   |
| ---------------------------------------------- | ------- | ------- |
| typical error (mean of \|ln sim/sheet\|), pack | 30%     | 21%     |
| typical error, boss                            | 29%     | 19%     |
| within 10%, pack / boss                        | 8 / 7   | 14 / 14 |
| within 25%, pack / boss                        | 20 / 20 | 24 / 25 |
| sheet more than 25% too high, pack / boss      | 9 / 8   | 2 / 0   |
| sheet more than 25% too low, pack / boss       | 6 / 7   | 9 / 10  |

The sheet no longer overstates; what is left is mostly skills whose sim deals extra hits the sheet does not count (section 5).

## 4. The mana gap (left as a decision)

The sheet counts every skill at full rate; the sim's character falls back to the free weapon attack when it cannot pay. With real
mana, the same 35 builds deal on average 17% less than with free mana, and 17 of them more than 20% less (early characters, with
little mana and a cost on every cast). docs/MANA.md decided that the sheet would not count mana (flasks, uniques and the tree
change mana in ways a sheet cannot foresee) and that the bot would weigh it itself (`manaFactor`). The Skills tab already says
"Mana-starved". Whether the sheet should show a second, **sustained** DPS is open.

## 5. Per-gem mismatches (`npm run dpsgems`)

121 damage gems, each alone, level 50, boss dummy. After the fixes above: **75 within 10%, 88 within 25%**, 7 where the sheet is
more than 33% too high and 26 where the sim deals more than a quarter more. Most of the second kind are skills whose behaviour
has extra hits that the sheet does not count (`dpsinspect` shows hits a use above 1 in the sim where the sheet has 1): a blade
volley after a hit (Rime Splinter), scattered arrows (Whirl Shot), ... The list and the reasons are kept in
`docs/coverage/` terms by the gem; this file keeps the open ones below as they are worked.

## 6. Open

- the gems above, one by one (each a change in the calc to count what the sim does, with a test that compares the two);
- charges that skip a cooldown (Blinking Cut) are credited at the skill's own chance per hit; the sim also rolls them on the hits
  of the other skills, so the skill comes up more often (0.85 a second against 0.47 on one build);
- an opener, an emergency and a keep-up damage skill are not in the plan (the opener is once a fight);
- the triggered skills are priced on the main skill's hits only;
- a periodic skill with less reach than the main skill is still counted as never cast (PLAYER-AI.md 4.2);
- conditions: the sheet assumes those the `steady` mode names; the sim has the ones that are true then.
