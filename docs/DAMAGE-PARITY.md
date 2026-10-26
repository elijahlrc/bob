# Damage parity plan (2026-10-25, draft for the owner)

**Goal (the owner, 2026-10-25):** every gem's damage at parity with the reference data (the reference tool's data in
`reference/`), judged by what the skill does in play, not by one number. Attacks, weapons and item affixes are already at reference
numbers, so anything below them is a nerf to that kind of build; parity puts spells, damage over time and minions on the same footing.
Balance is a property of the whole: a gem is not done because its multiplier matches, but because what it deals in a fight matches.

**Lesson to keep (the owner):** a single missed behaviour (a cooldown, how long a debuff lasts, how many hits a use lands, whether
a rain's arrows each hit) has made skills wildly unbalanced before. So every gem is compared at three levels, and a gem that is off at
any level is explained before its numbers change. What cannot be explained goes to the owner.

## 1. Where things stand (measured 2026-10-25, gem level 20)

| Source                           | Bob over reference                              | How it got there                                                                                                                                                                                                                          |
| -------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weapon base damage               | 1.0                                             | `WEAPON_DAMAGE_SCALE = 1` (2026-10-18 base audit)                                                                                                                                                                                         |
| Attack base damage, per level    | about 2.4 (Q0), now 1.0                         | a flat 0.7-1.4 physical per character level on every attack (M6), about one more base weapon at every level from 10 up, standing in for the gems' own added damage; removed for the reference's per-gem tables (decision 5)               |
| Attack multipliers (per hit)     | median 1.0                                      | `baseMult` from the reference                                                                                                                                                                                                             |
| Item affixes, flat added damage  | about 1.0                                       | the reference affix tables (2026-10-16 audits)                                                                                                                                                                                            |
| Ailments (ignite, bleed, poison) | the hit's                                       | reference formulas (`IGNITE_DPS_FRAC` 0.5, `BLEED_DPS_FRAC` 0.7, `POISON_DPS_FRAC` 0.2) on the hit                                                                                                                                        |
| Spell hits                       | 0.35 to 1.02, median 0.64; now 1.0 per hit (Q2) | the 2026-10-07 shared curve (`spellBaseDamage`, fitted to the hand-written starter spells, whose level-20 numbers were about half the reference's) times added-damage effectiveness, where the reference uses each gem's own damage table |
| Gem damage over time             | about 0.8                                       | 2026-10-25: each gem's own table, normalised to the old DoT median                                                                                                                                                                        |
| Minions                          | not measured                                    | their own curve (`spellBaseDamage` x the kind's `dmg`)                                                                                                                                                                                    |

The history is in the local `reference/docs/AUDIT-GEM-IDENTITY.md`, Appendix B. The per-gem inventory (names of the reference
skills, every ratio and every behaviour difference) is the local `reference/docs/PARITY-INVENTORY.md`.

## 2. Method

The measure is the reference tool itself (the owner, 2026-10-25): its calculator, run headless on the reference data, gives each
reference skill's damage a second in a fixed build, and Bob's sheet (held to the sim by `dpsgems`) gives the analog's in the same
build. A script that works out what a gem "should" deal from its numbers is not enough: gems differ in behaviour in ways that justify
damage off any curve, and only a calculator that models the behaviour can say whether the difference is earned.

Each gem is compared at three levels, so that a difference can be traced to its cause:

1. **Per hit or per tick.** The base damage at gem levels 1, 10 and 20 (the reference's at the character level each gem level needs).
2. **Per use.** What one use lands on one target: hits per use (spins, repeats, volleys, a rain's arrows and whether each hits the
   same enemy), pulses of ground, chains and returns that strike the same target, the sheet's counters (`afterHit`, `patterns`,
   `melee`, `deployed`). For damage over time (the owner): how long it lasts, how it stacks (one at a time and renewed, layers each
   with its own time, stages), how often it is reapplied, and whether a reapplication refreshes or adds.
3. **Per second.** Use time (cast time, attack speed multiplier, added attack time), cooldown and stored uses, deploy limits (totems,
   traps, mines, brands at a time, how long they stand), channel stages, minion counts and lifetimes.

A gem passes when Bob's damage a second matches the reference tool's within 10% in the same build, or the difference is a recorded
Bob decision (DESIGN.md Appendix A).

**Off-curve gems get a behaviour study, never a ratio fix (the owner).** A gem far from the reference is studied before anything
moves: how the skill works in the reference game (the reference wiki), how the reference tool models it (its skill and calc data),
and how Bob's sim and sheet do it (`npm run dpsinspect <gem>`). Numbers alone do not say whether a gem is broken: the first look found
Ember Downpour, Arrow Shower, Spinning Dash and Skyfall Leap far from their reference multipliers, and each needs that study before it
can be called too strong or right. What stays unexplained is raised with the owner.

## 3. Milestones

- **Q0, the reference tool headless.** A Lua runtime and the reference tool's headless wrapper, local only (`reference/`, nothing of
  it in `src/` or in the repository), and a script that builds one fixed character per gem (same level, weapon, no gear beyond it,
  no passives, the gem at 20 with no supports) in both tools and prints each damage a second with the per-hit, per-use and per-second
  breakdown. The same build is written once and read by both sides.
- **Q1, study the off-curve gems.** Every gem Q0 finds outside 10% studied as in section 2 (a Bob decision with its Appendix A
  entry, or a gap to fix), in the local inventory. The first look already lists: the rains (Ember Downpour, Arrow Shower), Spinning
  Dash and Skyfall Leap (the reference's added attack time), counts (Quiver Rush 5 vs 4, Mind Drain 5 vs 8, Skitter Flash 5 vs 7,
  Ghost Shard's shards), durations (Glacier Wall 3 vs 4.9 s; the ground DoTs' pulses against the reference's effect durations),
  cooldowns (Tempest Mote's 0.5 s), cast times (Doom Sigil, Tempest Sigil), effectiveness mismatches (Flame Bolt, Drifting Storm,
  Rain of Steel, Sap Bolt), the two traps whose damage is not a spell base stat (Jaws Trap, Drain Trap), and the six gems with no
  reference row (studied from the reference wiki).
- **Q2, spell hits to their own tables.** Each spell's hit from its reference values on its own table at the level's character level
  (`spellDamage` explicit per level or a per-gem curve), at 1.0. Added-damage effectiveness stays what it is in the reference (it
  scales gear's flat damage). The starter spells' rows in DESIGN.md's table change with them. Spirit Saw's and Sap Bolt's hits, cut on
  purpose on 2026-10-09, go to the reference's too unless Q1 finds why not.
- **Q3, damage over time at parity.** The DoT gems (spell and attack: Acid Arrow, Venom Shower) at the reference's numbers, without
  the median normalisation of cf9478c or the 2026-10-09 lift, after Q1 has checked each one's lifetime, stacking and pulses.
- **Q4, minions.** Each summon's damage a second against the reference tool's for the same gem; if the tool does not model one,
  raise it with the owner before choosing a method.
- **Q5, everything else that deals damage.** Granted and triggered skills (uniques, cast-on supports), totem and trap supports'
  multipliers, aura and herald damage, supports' more and less multipliers: each against the reference. DESIGN.md's aura table (Veil
  of Grace, Iron Bastion, Clear Mind below the reference by design) is the owner's call, flagged, not changed.
- **Q6, the whole game.** Before and after, from the same seeds: `npm run sim` per class (pacing, deaths, the level reached), the
  passive tree's 32 archetypes (`npm run passives:builds`), and `dpsgems` / `dpssupports` / `dpsminions`. Monsters are retuned only
  if the measurements call for it (the owner expects spell builds, now somewhat weak, to be about right after parity). The passive tree
  was sized against today's numbers: check its tension report too, and raise anything that moved.
- **Q7, records.** DESIGN.md Appendix A (one entry per milestone), the gem table rows, CLAUDE.md's pointer to this plan. Patch notes
  are written by the `/patch-notes` skill afterwards, never during the work.

## 4. The owner's decisions (2026-10-25)

1. **Overall level:** parity. Spell builds are somewhat weak today, so the rise is expected to be about right; measure it in Q6.
2. **Damage over time:** parity with the reference, no lift.
3. **The measure:** the reference tool's own calculator, run headless (Q0).
4. **Order:** free; cf9478c's DoT numbers are replaced in Q3.
5. **The per-level attack flat goes (Q0, the owner):** every attack gem gets the reference's own added damage directly, and the
   character's flat physical damage per level (`ATTACK_LEVEL_MIN/MAX`) is removed. Q0 measured simple attacks at 1.00 without it and
   about 2.4 with it.
