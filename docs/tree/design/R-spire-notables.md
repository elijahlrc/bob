# The Spire's notables (draft 1, 2026-10-31)

The notables pass of the Spire's rebuild (R-spire.md). Every notable: where it is (area, step from the Mystic's start),
its lines now, its lines proposed, and its hook. Names are working names (the naming pass is at the end). Values follow
the Knife's pricing (a notable is about 4 to 7 units); regeneration, leech and flask numbers wait for the flask stats.

New lines marked ★ need a new entry in `lines.ts`; ★★ also need the calc to read a new stat (maximum mana as a `per`
stat, `character.ts` `statValue`). Every condition used already exists in the fight (`src/sim/combat.ts`): `esFull`,
`targetIgnited`, `targetShocked`, `critRecently`, `stationary`, `killedRecently`, `leechingEs`, `targetChilled`,
`targetRareOrUnique`.

## The Gate (home, steps 5 to 7)

| Notable     | Step | Now                                            | Proposed                                           | Hook                                                                                 |
| ----------- | ---- | ---------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| First Light | 5    | 14% spell damage, 6% ES, 5% life, +15 int      | 14% damage, 6% ES, 5% life, +15 int                | The generalist every Mystic passes, the wand attacker included.                      |
| Ready Wit   | 6    | 20% spell damage, 6% cast speed                | same                                               | Offence on the defensive half.                                                       |
| Warded Mind | 5    | +20% chaos res, 8% mana, 10% mana regen        | +20% chaos res, +6% all res, 4% life               | The resistances a caster lacks; mana lines gone (mana near home kept to Still Mind). |
| Still Mind  | 7    | 20% mana regen, +30 mana                       | same                                               | The one mana notable near home.                                                      |
| Draught     | 5    | 10% flask effect, 10% duration, 10% mana regen | 10% flask effect, 10% duration, 10% flask recovery | The flask layer, generic.                                                            |
| Warm Blood  | 5    | 12% life, 6% ES                                | same                                               | The life caster's first notable, east.                                               |
| Hale Scribe | 5    | 12% life, 10% mana                             | 10% life, +6% all res                              | Life and resistances near home; mana gone.                                           |
| Sharp Mind  | 7    | 30% spell crit, +15% spell crit multi          | same                                               | Spell crit near home.                                                                |

## The Cloister (west: defence, mana, the Cathedral seam, fire's first rungs)

| Notable                               | Step | Now                                                 | Proposed                                                      | Hook                                                                 |
| ------------------------------------- | ---- | --------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Kept Vows                             | 11   | 5% reduced reservation, 8% ES                       | 8% reduced reservation, 8% aura effect, 6% ES                 | Auras, the Cathedral seam's theme.                                   |
| Quickening                            | 11   | 30% faster recharge start, 15% recharge rate, 5% ES | same                                                          | Recharge, the seam's other theme.                                    |
| ✚ Ward Renewed (second in Quickening) | 12   | —                                                   | 10% ES, 20% recharge rate, +5% all res                        | A defensive second notable.                                          |
| Familiars                             | 12   | 24% minion damage, 12% minion life, 8% spell damage | 20% minion damage, 15% minion life, 10% spell damage          | Spell minions, the Cathedral's minions' near end.                    |
| ✚ Bound Host (second in Familiars)    | 13   | —                                                   | 20% minion life, 5% minion speed, 6% ES                       | The minions' defensive half.                                         |
| Deep Well                             | 8    | 16% mana, 8% cast speed                             | 16% mana, 2% spell damage per 100 maximum mana (up to 40%) ★★ | Mana as the damage stat (the reference's mana-scaled spell notable). |
| Glass Skin                            | 7    | 16% ES, 10% mana                                    | 14% ES, 20% damage while energy shield is full ★              | A full shield pays.                                                  |
| Wandwork                              | 8    | 20% wand spell damage, 8% wand cast speed           | same                                                          | Wand spells' first home.                                             |
| ✚ Kindling (new)                      | 9    | —                                                   | 20% fire damage, 5% cast speed, +15% fire res                 | Fire's first rung, plain.                                            |
| ✚ Warm Hearth (second in Kindling)    | 10   | —                                                   | +20% fire res, +1% max fire res, 0.5% life regen              | Fire's defensive side: the burning caster walks through fire.        |
| Quiet Pulse                           | 11   | 10% life, 0.6% life regen, 4% ES                    | same                                                          | The life caster's regeneration.                                      |
| Flashpoint                            | 10   | 14% fire damage, 25% spell crit, 3% fire pen        | 16% fire damage, 25% spell crit, 10% chance to ignite         | Fire's second rung: crits that ignite.                               |
| Composure                             | 11   | 15% ES, 20% avoid stun                              | same                                                          | Casting through stuns.                                               |
| ✚ Iron Litany (second in Composure)   | 12   | —                                                   | +30% avoid stun, 4% physical damage reduction, 6% ES          | Defence against the big hits.                                        |
| Living Verse                          | 11   | 20% spell damage, 8% life                           | same                                                          | Spells with life.                                                    |

## The Lantern (west toward the rim: fire's payoffs, wands' west home, minions with curses)

| Notable                              | Step | Now                                                 | Proposed                                                             | Hook                                                                                       |
| ------------------------------------ | ---- | --------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| High Veil                            | 13   | 15% ES, +6% all res                                 | same                                                                 | The rim's defence, west.                                                                   |
| ✚ Moonward (second in High Veil)     | 14   | —                                                   | +25 maximum ES, +15% chaos res                                       | The energy shield caster's chaos defence.                                                  |
| Mana Tap                             | 12   | 0.8% mana leech, +6 mana on hit                     | same                                                                 | Mana sustain from hits.                                                                    |
| Bright Wand                          | 12   | 24% wand attack damage, 20% elemental attack damage | 18% wand attack damage, 18% wand spell damage, 10% elemental damage  | The wand that serves both: attacks and spells.                                             |
| Cinder                               | 13   | 15% ignite, 30% burning damage, ignites 10% faster  | 15% ignite, 25% burning damage, 20% damage against ignited enemies ★ | Fire's ignite payoff: the burning target takes more.                                       |
| ✚ Pyre (new)                         | 14   | —                                                   | 20% fire damage, 6% fire pen, 0.3% fire damage leeched as ES         | Fire's payoff: penetration, and the fire feeds the shield.                                 |
| Bad Company                          | 13   | 24% minion damage, 16% curse effect                 | same                                                                 | Minions with curses.                                                                       |
| ✚ Hexed Pack (second in Bad Company) | 14   | —                                                   | 20% curse area, 15% minion life, 5% minion speed                     | The cursing minion master's reach.                                                         |
| ✚ Overflow (replaces Spirit Ward)    | 13   | (Spirit Ward: spell block with a shield)            | 20% mana regen, gain 6% of maximum mana as extra energy shield ★★    | The mana pool becomes a shield; Spirit Ward's shield play goes to the Cathedral's shields. |

## The Scriptorium (east: spell offence, the Knife seam's curses and chaos, lightning's first rungs)

| Notable                     | Step | Now                                                             | Proposed                                                     | Hook                                             |
| --------------------------- | ---- | --------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Hexwright                   | 10   | 20% curse effect, 15% mana regen                                | same                                                         | Curses beside the Knife's.                       |
| Withering                   | 12   | 20% damage over time, +10% chaos DoT multi                      | same                                                         | Chaos over time beside the Knife's chaos spells. |
| Sharp Tongue                | 12   | 20% dagger spell damage, 6% cast speed                          | same                                                         | Dagger spells beside the Knife's.                |
| Siphon                      | 7    | 0.8% ES leech, +6 ES on hit, +10 mana on kill                   | same                                                         | The offence side's sustain.                      |
| ✚ Thirst (second in Siphon) | 8    | —                                                               | 16% spell damage while leeching energy shield ★, 6% ES       | Leeching rewards keeping up the attack.          |
| Deft Wand                   | 9    | 20% wand attack damage, 15% wand accuracy, 10% projectile speed | same                                                         | Wand attacks' first home.                        |
| Thunderhead                 | 9    | 16% lightning damage, 5% cast speed, 10% shock                  | same                                                         | Lightning's first rung, plain.                   |
| Keen Verse                  | 11   | 20% spell damage, +18% spell crit multi                         | +18% spell crit multi, 10% cast speed if you crit recently ★ | Crits speed the casting.                         |
| ✚ Drone (new)               | 11   | —                                                               | 20% channelling damage, 15% damage while standing still ★    | The channeller's second home: stand and pour.    |

## The Gallery (east toward the rim: wand attacks, lightning's payoffs)

| Notable                                  | Step | Now                                                         | Proposed                                                                          | Hook                                                                             |
| ---------------------------------------- | ---- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Live Current                             | 10   | 12% lightning damage, 20% shock effect, 3% lightning pen    | 12% lightning damage, 25% shock effect, 20% shock duration                        | Lightning's second rung: the shock itself.                                       |
| ✚ Conductor (second in Live Current)     | 11   | —                                                           | 15% shock effect, 5% cast speed, +4 ES on hit                                     | The shocker's sustain.                                                           |
| Wand Volley                              | 11   | 24% wand attack damage, 12% wand attack speed               | same                                                                              | Wand attack speed.                                                               |
| ✚ Hail of Sparks (second in Wand Volley) | 12   | —                                                           | 16% wand attack damage, 16% elemental attack damage, projectiles chain once       | The wand spray.                                                                  |
| Mist Walk                                | 13   | 5% spell dodge, 3% attack dodge, 4% movement                | 6% spell dodge, 3% attack dodge, 6% ES                                            | Dodge beside the Knife's; movement out.                                          |
| Needlework                               | 13   | 10% attack speed, 22% crit                                  | same                                                                              | Crit attackers (wands, the Knife's daggers).                                     |
| Long Chant → Recital                     | 13   | 20% spell damage, 15% mana regen                            | 15% spell damage, 25% damage against rare and unique enemies                      | The boss-killer caster (Long Chant was a copy of the Knife's Swift Incantation). |
| Pinpoint                                 | 14   | 20% wand attack damage, 20% wand crit, +12% wand crit multi | same                                                                              | Wand crit.                                                                       |
| ✚ Arc (new)                              | 14   | —                                                           | 20% lightning damage, 6% lightning pen, 30% crit chance against shocked enemies ★ | Lightning's payoff: shock sets up the crit.                                      |
| ✚ Volley (new)                           | 14   | —                                                           | 20% spell projectile damage, projectiles pierce 1                                 | Projectiles' second home.                                                        |

## The Column (the axis at the mid ring)

| Notable                      | Step | Now                                                              | Proposed                                                                  | Hook                                                                               |
| ---------------------------- | ---- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Prism Ward                   | 11   | +8% all res, 20% avoid elemental ailments                        | same                                                                      | Resistances on the axis.                                                           |
| Hoarfrost                    | 11   | 16% cold damage, 15% chill effect, 8% ES                         | same                                                                      | Cold's first rung, with a shield.                                                  |
| ✚ Rime (second in Hoarfrost) | 12   | —                                                                | +12% cold DoT multi, 15% chill effect, 15% damage against chilled enemies | Cold over time: the chill that hurts.                                              |
| ✚ Fire and Frost (new)       | 10   | —                                                                | 15% fire damage, 15% cold damage, +5% all res                             | The two-element path.                                                              |
| Broad Weave                  | 10   | 16% spell area, 12% spell area damage, +10 int                   | same                                                                      | Spell area.                                                                        |
| Darting Bolts                | 10   | 20% spell projectile damage, 10% projectile speed, 4% cast speed | same                                                                      | Spell projectiles.                                                                 |
| Lingering → Slow Burn        | 12   | 16% duration, 16% damage over time                               | 20% burning damage, +10% cold DoT multi, 10% duration                     | Elemental damage over time (Lingering was a copy of the Knife's Lingering Malice). |

## The Belfry (the axis toward the rim: cold's payoffs, any element)

| Notable       | Step | Now                                                         | Proposed                                                        | Hook                                          |
| ------------- | ---- | ----------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| Steady Stream | 13   | 20% channelling damage, 6% reduced cost                     | same                                                            | Channelling with its cost.                    |
| Shatter       | 13   | 12% cold damage, 10% freeze, 4% cold pen                    | 14% cold damage, 5% cold pen, 8% freeze                         | Cold's second rung: through the resistance.   |
| Piercing Word | 13   | 20% spell damage, 3% elemental pen                          | same                                                            | Any element: penetration.                     |
| Harsh Weather | 13   | 20% ailment effect, 15% freeze duration, 15% shock duration | same                                                            | Any element: ailments.                        |
| Cold Light    | 14   | 30% spell crit, 16% cold damage                             | 16% cold damage, 30% spell crit, 0.3% cold damage leeched as ES | Cold's payoff: crit and the shield.           |
| ✚ Blast (new) | 14   | —                                                           | 20% spell area damage, 15% spell area if you killed recently ★  | Area's second home: the pack grows the blast. |

## Count and checks

- 64 notables: 47 kept (Spirit Ward replaced; Snare Line, Frugal and Flashes of Insight cut in the structure pass;
  Long Chant and Lingering redone), 7 new clusters, 10 second notables. 5 keystones as before.
- Steps after the structure pass: 13 of the Spire's own notables within 8 steps (the Knife 11); Deep Well and Glass
  Skin now at 10, Hexwright 8, Quiet Pulse 8 (moved in), Siphon 8. The step column above is approximate.
- Each element: three rungs on one road (fire: Kindling 9, Flashpoint 10, Cinder 13, Pyre 14, plus Warm Hearth's
  defence; cold: Hoarfrost 11, Rime 12, Shatter 13, Cold Light 14; lightning: Thunderhead 9, Live Current 10, Conductor
  11, Arc 14). The three payoffs differ: fire feeds the shield, cold crits and feeds the shield, lightning crits against
  shocked enemies. (Cold Light and Pyre both leech as ES: the reference pairs penetration with ES leech on its element
  payoffs; one could be changed.)
- Rule benders: Deep Well (mana as damage), Overflow (mana as shield), Glass Skin (full shield), Cinder (against
  ignited), Arc (crit against shocked), Keen Verse (crit speeds casting), Drone (standing still), Blast (kills grow the
  area), Thirst (while leeching), Recital (against rares).
- Copies of the Knife removed: Long Chant (= Swift Incantation), Lingering (= Lingering Malice).
- Offence/defence/utility to be counted on the build against the reference sector.

## Revision 2 (after the reviewer's notables round 1)

Built into `src/data/passives/spire/` (the generator's `over` and `second` tables in `scripts/passives/rework/spire-gen.ts`
are the source of truth; the tables above are draft 1).

| Notable                            | Draft 1                                                | Revision 2                                                                              | Why                                                     |
| ---------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Warded Mind                        | chaos res, all res, life (= Ward of Smoke)             | +20% chaos res, recover 1% ES when hit, 5% ES                                           | The Spire's own voice: the shield answers each hit (A). |
| Draught                            | flask effect, duration, recovery (= Smuggler's Flasks) | 10% flask effect, 10% duration, gain Arcane Tide when you use a flask                   | A home hook for any caster (A, B).                      |
| Still Mind                         | mana regen, mana                                       | 20% mana regen, +30 mana, 10% chance to gain Arcane Tide on kill                        | The second home hook (B).                               |
| Hale Scribe                        | life, all res                                          | 10% life, +4 life on spell hit                                                          | No second "resistances near home" (A).                  |
| Rime                               | cold DoT multi, chill, against chilled (= Frostbite)   | 15% chill effect, chilled enemies deal 10% less damage to you ★engine                   | Cold's own defence (A, C).                              |
| Cold Light                         | cold, spell crit, ES leech                             | 16% cold, 30% spell crit, +30% crit multi against frozen enemies                        | Cold's own rule: freeze, then shatter (C).              |
| Pyre                               | (keeps the ES leech)                                   | 20% fire, 6% fire pen, 0.3% ES leech                                                    | The one element payoff with leech (C).                  |
| Thirst → Surging Tide              | spell damage while leeching ES                         | 15% chance to gain Arcane Tide on crit, 6% ES                                           | A buff on crit instead of a flat line (C, G).           |
| Ward Renewed                       | ES, recharge, res                                      | energy shield starts recharging when you kill ★engine, 15% recharge rate                | The attrition sustain voice, a real rule (D, G).        |
| Moonward                           | +25 ES, chaos res                                      | +25 ES, recover 1% ES on crit                                                           | Crits restore the shield (D).                           |
| Iron Litany                        | stun avoid, phys reduction, ES                         | +30% avoid stun, 15% spell damage if you were hit recently                              | Being hit feeds the casting (D).                        |
| Bound Host                         | minion life, speed, ES                                 | 15% minion damage, 8% minion speed, 10% spell damage                                    | Offence, for the balance (D, H).                        |
| Warm Hearth (now second in Cinder) | fire res, max fire res, regen                          | recover 3% life and 3% ES when you kill an ignited enemy ★engine, 10% fire              | A defence that comes from fire (E).                     |
| Needlework                         | attack speed, crit (generic)                           | 16% wand attack damage, gain 15% of wand physical as extra lightning, 15% crit          | The wand meets the Gallery's lightning (F).             |
| Hail of Sparks                     | chain once (any)                                       | 16% wand attack damage, wand attacks chain 1 more                                       | Scoped to wand attacks (F).                             |
| Volley                             | spell projectile damage, pierce (= Fan of Blades)      | 15% spell projectile damage, +1 projectile with spells                                  | Its own projectile rule (F).                            |
| Fire and Frost                     | fire, cold, res                                        | 12% fire, 12% cold, 20% fire damage against chilled and 20% cold damage against ignited | The two-element rule (G).                               |
| Kept Vows                          | reservation, aura effect, ES                           | auras reserve life instead of mana ★engine, 8% aura effect, 5% reduced reservation      | The low-life build's notable beside Pain Conduit (G).   |

**True rule benders now:** Deep Well (mana as damage), Overflow (mana as shield), Drone (stand still), Kept Vows (auras on
life), Ward Renewed (recharge on kill), Fire and Frost (cross-element), Warm Hearth (healing from the burning dead), Rime
(chill as defence), Draught and Surging Tide (Arcane Tide on a flask, on a crit), Cold Light (shatter the frozen).

**Engine additions** (each read by the calc or the fight): maximum mana as a `per` stat (`character.ts` statValue);
auras reserving life (`auraReserveLife`, the aura loop in `character.ts`); a `killIgnited` event for gains and recovery
(`buffs.ts` BUFF_EVENTS, `killActor` in `combat.ts`); energy shield recharge on kill (`esRechargeOnKill`, `killActor`);
chilled enemies dealing less (`chilledLessDamage`, before a hit lands in `combat.ts`). The rest are lines on existing
conditions and events (`lines.ts`).

**Offence, defence and utility** (`offdef.ts mystic`, same keyword rules both sides): Spire notables 62% / 25% / 13%
against the reference sector's 55% / 23% / 22%; smalls 60 / 28 / 12 against 68 / 22 / 11. Defence matches; utility is
light (mana lines were cut near home, Frugal and Flashes of Insight cut, and Arcane Tide lines count as offence).
