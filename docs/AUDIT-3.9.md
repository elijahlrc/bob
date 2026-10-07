# Bob — Mechanics audit against 3.9.0 (COVERAGE C1)

Status: **done 2026-10-07**. Plan: [COVERAGE.md](COVERAGE.md) section 6.

## Method

Three reviewers each took a group of areas. Each read Bob's code and compared it with the PoE wiki **as it stood just
before 3.10** (`npm run coverage:wiki -- "Page title"` prints a page at a date; the default is 2020-03-12). Claims
below cite the page and the revision the tool printed. Every finding was then sorted into one of four outcomes:

- **Fixed**: Bob now follows 3.9.0, with a test (`src/calc/audit39.test.ts` and the updated older tests).
- **Divergence**: kept on purpose and written into DESIGN 2.1.
- **Add**: a mechanic 3.9.0 has and Bob lacks, scheduled for a milestone.
- **Match**: checked, nothing to do.

The convergence tests (calc against sim) passed unchanged after the fixes, so they were not retuned. A small bot run
(4 runs × 6 classes, seed 11) after the fixes gave 3/24 wins, against 2/24 before: within noise. The full balance
pass is C7.

## Fixed

| Area                       | Was                                                                                                                 | Now (3.9.0)                                                                                                        | Source                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Hit chance                 | `acc / (acc + (eva/4)^0.8)`                                                                                         | `1.15 · acc / (…)`, 5% to 100%                                                                                     | Accuracy rev 1065477; Evasion rev 641856 |
| Critical strike confirm    | one crit roll per hit                                                                                               | an attack also passes a second hit-chance roll to crit                                                             | Critical strike rev 614250               |
| Critical chance cap        | 95%                                                                                                                 | 100% (3.6 removed the caps)                                                                                        | Critical strike rev 614250               |
| Ailments from crits        | ×1.0                                                                                                                | fixed ×1.5, whatever the crit multiplier (Cruel Agony still applies the full multiplier)                           | Ailment; Critical strike rev 614250      |
| Monster crit multiplier    | 150%                                                                                                                | 130%                                                                                                               | Monster rev 709317                       |
| Bleed                      | 20% of the hit a second, ×2 moving                                                                                  | 70% a second, ×3 moving; 10% when a monster bleeds the player                                                      | Bleeding rev 587485                      |
| Shock and chill            | `cap · min(1, √(2r))`, effect mods after the cap                                                                    | `min(cap, 50 · r^0.4 · (1 + effect))`: the effect bonus counts before the cap                                      | Shock rev 752943; Chill rev 604168       |
| Ailment base damage        | scaled from the hit, so attack, spell, melee, projectile, area and weapon modifiers raised ignite, bleed and poison | scaled from base damage separately: only generic, damage-over-time, ailment-tagged and damage-type modifiers apply | Ailment ("calculated separately")        |
| Penetration                | also applied to ailment damage                                                                                      | not applied to damage over time                                                                                    | Penetration rev 739421                   |
| Stun chance                | ignored under 10%; physical 1.0, other 0.5                                                                          | ignored at or under 20%; melee physical 1.25, non-melee non-physical 0.75, the rest 1.0                            | Stun rev 767262                          |
| Stun and energy shield     | —                                                                                                                   | half of all stuns are ignored while ES is up (not with Eldritch Battery rules)                                     | Energy shield rev 638986                 |
| Stun threshold under CI    | 1 life, so every hit stunned                                                                                        | the life the character would have without it                                                                       | Stun rev 767262                          |
| ES recharge                | 33.3% of max a second                                                                                               | 20% a second (the 2 s delay already matched)                                                                       | Character rev 603082                     |
| Leech                      | no per-instance cap                                                                                                 | one instance holds at most 10% of the maximum                                                                      | Leech rev 687420                         |
| Life and mana regeneration | increased regen scaled flat life regen only                                                                         | scales flat and percentage life regen; flat mana regen scales too                                                  | Mana rev 700374                          |
| Dual wielding              | 10% more attack speed                                                                                               | plus 20% more physical attack damage and +15% attack block                                                         | Character rev 603082                     |
| Base evasion               | `50 + 3L`                                                                                                           | `53 + 3L`                                                                                                          | Character rev 603082                     |
| Fervour charge             | also +4% movement speed                                                                                             | attack speed, cast speed and more damage only                                                                      | Character rev 603082                     |
| Flask charges per kill     | 1 / 2 / 5 / 10                                                                                                      | 1 / 3.5 / 6 / 11 (normal / magic / rare / unique)                                                                  | Flask rev 649239                         |
| Flask effect and duration  | effect scaled buffs only; longer duration cut the rate                                                              | effect scales recovery too; a longer duration recovers proportionally more at the same rate                        | Flask rev 649239                         |
| Triggered skills           | paid mana and stopped when short; one cooldown a source; random spell                                               | cost nothing; own cooldown per spell; spells cast in socket order                                                  | Trigger rev 800053                       |
| Trigger gems               | Critical Relay 0.25 s, −25..−15% damage; Wounded Retort 0.5 s                                                       | Critical Relay 0.15 s, +20..39% more damage; Wounded Retort 0.25 s                                                 | CoC rev 598738; CWDT rev 599179          |
| Curses on bosses           | full effect                                                                                                         | a third less                                                                                                       | Curse rev 615860                         |

## Verified

- **Match:** armour and physical reduction (`A/(A+10D)`, cap 90%), block caps, resistance caps and the hard cap,
  order of mitigation, conversion and gain, added-damage effectiveness, crit multiplier, base accuracy, base life and
  mana, 1.75% mana regeneration, mana cost multiplication, speed formulas, ES recharge delay, ignite (50% a second, 4 s,
  strongest only), poison (20% a second, stacking), freeze duration, charge duration and cap, Grit and Insight effects,
  curse limit, hexproof as immunity, aura reservation as a percentage of **max** mana.

## Divergences kept (all in DESIGN 2.1)

Bot-tuned monster accuracy, evasion and armour; flat physical attack damage per level and the one-hand bonus; no gem
quality; the −200% resist floor; per-hit crit rolls; blocked hits without on-hit effects; shock multiplying separately
from other increased damage taken; flasks that do not end early at full life; fixed 6 s hexes with their own numbers;
support cost multipliers not raising reservation; Wounded Retort using a share of life; ES leech using the life rates.
Smaller ones: aura reservation rounds up the mana value, not the percentage, and "less reservation" is modelled as
"reduced"; the `chargeOn.hit` source is defined but no data uses it.

## Add (mechanics 3.9.0 has and Bob lacks)

Scheduled in C2 (engine foundations), before the content batches that need them:

- **Buff layer:** Fortify (20% less damage from hits, 4 s), Onslaught (20% increased attack, cast and movement speed),
  Unholy Might (30% of physical as extra chaos), Rage (stacking attack buff), Arcane Surge (a support gem buff),
  Rampage.
- **Impale** (records part of the physical hit and replays it on the next hits).
- **Culling Strike** (a hit kills at 10% life or less).
- Charges gained on being hit and on flask use.

## Not retrievable from the wiki

Weapon base critical strike chances, the base flask table (amounts, charges, uses), per-level aura reservation and
whether a triggered skill can trigger another. The first two come from the Path of Building data when C3 reaches
them; Bob keeps its own values until then.
