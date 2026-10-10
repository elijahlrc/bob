# Mana economy audit

Audit of 2026-10-09. Fixed the same day: F1, F6 (the bot now weighs mana by itself, the sheet's DPS still does not), F7 and the mine supports of 3.1. The rest is open. The figures come from throw-away scripts (sheet calls,
the gem sim against a training dummy, instrumented bot runs) checked against the 3.9 reference data in
`docs/coverage/pob-skills.json` and the wiki pages for Mana, Mana regeneration, Mana reservation, Eldritch Battery and Blastchain
Mine Support.

The intended trade-off: using spells rapidly with many supports should need real investment in mana, on the tree, in gear, or both.

## 1. How the economy works, and that the base design holds

- Pool `34 + 6 · level`, plus 0.5 per Intelligence; regeneration 1.75% of the pool a second, with flat regeneration added before the
  increases. Reserved mana does not slow regeneration (matches the wiki).
- A skill costs `gem cost · Π support multipliers · (1 + Σ cost increases) + flat`. Triggered skills cost nothing (AUDIT-3.9, rev 800053 of the Trigger page).
- Gem costs equal the 3.9 costs at level 20 for almost every gem with a reference, and support multipliers equal 3.9 for almost every
  support; the exceptions are listed in 3.1. Aura, Skitterbot and Blasphemy reservations equal 3.9.

A level-70 Mystic, Frost Lance (cost 23, 1.4 casts a second), the sheet's regeneration against what the skill spends:

| Setup                                                                     | Mana | Regen/s | Spend/s | Regen ÷ spend |
| ------------------------------------------------------------------------- | ---- | ------- | ------- | ------------- |
| Bare skill, no tree, no gear                                              | 545  | 9.5     | 33      | 0.29          |
| Bare skill, 69 points all in mana                                         | 2048 | 106     | 29      | 3.7           |
| Bare skill, gear only (4 best regen suffixes, 5 best flat mana)           | 945  | 62      | 33      | 1.9           |
| Four supports (cost 65, 1.6 casts a second = 104 a second): no investment | 545  | 9.5     | 104     | 0.09          |
| Four supports: all 69 tree points                                         | 2064 | 70      | 104     | 0.66          |
| Four supports: gear only                                                  | 945  | 62      | 104     | 0.6           |
| Four supports: tree and gear                                              | 3152 | 318     | 91      | 3.5           |

Regeneration is pool × increased regeneration, so mana investment compounds: neither the whole tree nor four dedicated affixes
carries a four-support spell alone, and both together overshoot. **The base trade-off works.** The findings below are the things
that skip it, and the one place nothing is watching it.

## 2. Findings that break the trade-off

Reference scale at level 70: the four-support spell above spends about 104 mana a second; base regeneration is 9.5.

| #   | Source                                                         | What it gives (mana a second)                                                                                                               | Verdict         |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| F1  | **Lone Prism**: 30 mana on every hit, no attack condition      | One dummy: Frost Lance +74, Drifting Storm +35, Rime Spires +194, Ember Hail +296, a Winter Orb analog +268; it pays for every spell tested | **Bug**         |
| F2  | **Gilded Pall** +100 on kill; **Wellburst Ward** rolls 1–100   | About 45–125 at the 0.45–1.25 kills a second of the bot's maps: one chest piece pays for a four-support spell                               | Too strong      |
| F3  | **Twin Moon Ring**: 40 flat regeneration a second              | +40, and flat regeneration is multiplied by increased regeneration: about 150 with the gear column above                                    | Too strong      |
| F4  | **Mana flasks**: 620 over 4 s at the top tier, 6 charges a use | The bot's one flask gave 30–85 a second (regeneration was 20 in the same runs); at most about 155 for one flask                             | Dominant source |
| F5  | **Mana Bastion** (ES pays skill costs, recharge keeps going)   | 509 ES from base armour alone recharges 102 a second, 214 with +150% ES; the pool and the mana tree are not needed                          | Confirm intent  |
| F6  | **Nothing in the build tools sees mana**                       | See below                                                                                                                                   | Consequence     |
| F7  | **Sheet model of utility skills**                              | A blink or curse gem is modelled as cast non-stop (3.2)                                                                                     | Sheet bug       |

**F1 (confirmed in the sim, and the fix confirmed).** The decision note says "for each enemy hit by your Attacks", and the same
unique's life-on-hit line carries the attack tag, but `manaOnHit` was written without it (`src/data/uniquesGen.ts`, `lonePrism`).
Pickpocket's Lament has the tag. It applies on every hit event, so pulsing ground spells and projectile fans are the worst cases.
With `tags: ['attack']` the same test gives spells +0 and attacks unchanged (33–42 a second against one target).

**F2.** Argued from Bob's own pools: 100 on a kill is 10–20% of a pool of 500–1000 each kill. Options: a share of the maximum
(about 5%), or 30–40. Wellburst Ward's 1–100 roll puts the same ceiling on a random item.

**F3.** 40 flat is more than four times the base regeneration at level 70 (9.5) and five times it at level 40 (7.7). Options: 15–20, or drop
the multiplication by increased regeneration for this item.

**F4.** Not a bug (it has the same shape in 3.9), but it is the cheapest strong source: one of five flask slots, no tree. Charge
income is generous: 1, 3.5, 6 and 11 charges for a normal, magic, rare and unique kill, so a normal pack gives about 2.4 charges a
second against 1.5 a second to keep one flask running. Options: fewer charges for mana flasks, or a smaller top-tier amount.
Unbound Draught (no skill costs for 6 s on 25 of 50 charges) gives about half-time free skills; that is its job.

**F5.** Matches the wiki (spending ES does not interrupt recharge), but here it means any ES build needs no mana stats at all. In
the sim a hit resets the recharge delay, so real fights give less than the table. A decision, not a defect.

**F6, the main consequence of today's DPS decision.** The sim enforces the economy: a bot Mystic (seed 2) walked from map 46
(Frost Lance with four supports, cost 83, 368 mana a second, 3% of ticks short of mana) to map 54 (60% of ticks short on 72 a second
of flask mana) to map 62 (cost 198, 1153 a second against 22.7 regeneration, short of mana for 100% of the fight, dead after 41
seconds with no kills). Nothing stopped it, because mana is no longer in the sheet's DPS, so adding supports is free to the bot's
score, to the item and gem comparisons, and to the tree allocator; the only signal is the `sustain` line on the Skills tab. Not a
reason to undo the decision, but a player now meets the cost only in play, and the bot cannot be used to test mana balance.
(Item flags that put the cost on life, such as Veinletter Mask at level 20, are not a bypass: they set maximum mana to 0 and
reserve life, as the keystone does.)

## 3. Things that are wrong but do not change the trade-off much

### 3.1 Prices that differ from 3.9

| Gem                                                                                        | Ours (level 20) | 3.9     |
| ------------------------------------------------------------------------------------------ | --------------- | ------- |
| Chained Charges (Blastchain Mine) and Heavy Charge (High-Impact Mine), support multiplier  | 1.5             | 0.3     |
| Greater Multiple Projectiles (Volley Split)                                                | 1.5             | 1.65    |
| Barrage (Rolling Volleys)                                                                  | 1.4             | 1.5     |
| Cast On Critical Strike (Critical Relay)                                                   | 1.3             | 1.4     |
| Minion Speed (Pack Haste)                                                                  | 1.2             | 1.3     |
| Pierce, Chance to Bleed, Immolate (Cindering): +0.1 each; Increased Critical Strikes +0.05 | 1.1–1.3         |         |
| Heavy Strike, Cleave, Viper Strike analogs (Crushing Blow, Reaping Arc, Venom Cut)         | 8, 9, 7         | 5, 6, 5 |
| Molten Shell analog (Slag Carapace)                                                        | 16              | 12      |

The wiki confirms the mine supports at a 30% multiplier (`static_mana_multiplier = 30`). Ours are five times that, with no reason in
the gem notes, on supports that already cost damage (less damage, a five-second wait): they make mines the dearest way to run a
spell. The three starter attacks cost more than 3.9 at level 20 and a fifth of it at level 1 (1 against 5); the other early-level
gaps are in our favour (Fireball analog 3 against 6 at level 1). Clear Mind (Clarity) reserves a flat 35 to 100 for 1.8 to 8
regeneration a second against 3.9's 34 to 279 for 1.8 to 19.8: weaker and cheaper in proportion.

### 3.2 The character sheet costs utility skills as if they were cast non-stop

`utilityLoad` uses the utility's `cooldown`, which blinks and several curses do not have, so they are costed once per cast time.
Frost Lance with one utility gem socketed (Skills tab and the bot's scoring; the sim casts these by policy and is not affected):

| Added gem      | DPS | Share of time left | Sustain |
| -------------- | --- | ------------------ | ------- |
| none           | 60  | 1.00               | 0.39    |
| Frostblink     | 30  | 0.50               | 0.00    |
| Withering Step | 40  | 0.67               | 0.00    |
| Flame Dash     | 6   | 0.10               | 0.00    |
| Wither         | 6   | 0.10               | 0.00    |
| Blood Rage     | 45  | 0.75               | 0.00    |

A bot offered one of these gems would see its score halve or worse; a bot run with one offered was not checked.

### 3.3 Small

- With a flat cost mod (Venomtongue Gloves +50), the sheet shows the free default attack as costing 50. The sim still lets it attack with 0 mana.
- The banner reserves 10% of the pool while carried; the reference data has a flat 10 mana. At 545 mana that is 55.
- Mana leech is attack-only and capped at 20% of the pool a second, so it cannot carry a spell build; for attacks 2% leech is enough.
- Cost reductions on the tree total about −44% (−23 in notables, −21 in smalls), plus −32 in gear and Unbound Draught: not a break.
- DESIGN.md's 2026-10-06 row and EXPANSION.md (5.5) still say triggered skills pay mana; the code and AUDIT-3.9 say they cost nothing. Stale text.

## 4. Skill prices and efficiency

Apart from 3.1 no gem is priced above its 3.9 analogue. Damage per mana in the sim against a single dummy for 20 s, level 50 kit,
no supports: spells spend 10–25 mana a second for 30–130 damage a second (median about 5 damage per mana), attacks spend 8–19 for
100–500 (median about 25). Against a pack of seven, spells reach a median of about 30. The worst against a pack, which deal poor
damage for their price at the same level:

| Skill                        | Mana/s | Damage/s | Damage per mana |
| ---------------------------- | ------ | -------- | --------------- |
| Tempest Mote (Orb of Storms) | 14     | 26       | 1.9             |
| Skitter Flash (Spark)        | 12     | 27       | 2.2             |
| Frost Lance (Ice Spear)      | 16     | 43       | 2.7             |
| Flame Bolt (Fireball)        | 9      | 55       | 5.8             |
| Glacier Dart (Frostbolt)     | 14     | 116      | 8.6             |

These are damage questions (narrow projectiles into a compact pack) rather than price ones; the cheap-per-damage end is the rapid
channels (Blaze Stream, a Winter Orb analog, a Flameblast analog) and the totems and brands, whose cost is paid once.

## 5. Suggested order of work

1. F1: add the attack tag to Lone Prism's mana on hit (data fix, `docs/coverage/uniques/c3-b03.json`).
2. 3.2: cost a blink or curse by its real policy rate (or leave it out of `primaryShare`) so the sheet stops penalising them.
3. 3.1: bring the two mine supports to a price that fits (0.3 is the 3.9 number; 1.0 to 1.2 would be gentler).
4. F2, F3, F4: decide the target (a share of the pool, a lower flat number, fewer flask charges).
5. F5, F6: decide whether Mana Bastion is meant to replace mana investment, and whether the sheet should show mana somewhere the bot and the allocator can read.
