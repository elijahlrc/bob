# The attrition rework of the tree: the unattended run's log (2026-10-31)

Written as the work goes, region by region, so the final report is built from it rather than from memory. The final
report for the owner is the last section (and its Artifact page).

## Decisions taken in the owner's absence (owner decisions needed)

- The Spire: the Mystic with a shield (spell block) stays in the Spire or goes to the Cathedral's shields (decided in the
  Spire's notables pass). Minions stay in the Spire only at the west, two homes, facing the Cathedral's. Insight stays one
  Spire home beside the Knife's two; growing it toward charge play with engine work was not done unless noted below.

## Engine additions

- The Spire: maximum mana as a `per` stat (`src/calc/character.ts` statValue `maxMana`), for spell damage per 100 mana
  and mana as extra energy shield; auras reserving life (`auraReserveLife`, the aura loop in `character.ts`); a
  `killIgnited` event for gains and recovery (`src/data/buffs.ts`, `killActor` in `src/sim/combat.ts`); energy shield
  recharge starting on a kill (`esRechargeOnKill`, `killActor`); chilled enemies dealing less damage
  (`chilledLessDamage`, before a monster's hit lands, at most 50%). New lines in `lines.ts` under "The Spire's rule
  benders". None is covered by a test yet (no tests while iterating); the sheet's handling of the new conditions
  (standing still, leeching energy shield, hit recently) was not audited against the sim.

## Regions

### The Spire

- Stage 1 (plan): R-spire.md written. Review round 1: REVISE (elements all at the rim; wands on one spoke; Pain Conduit
  among wand attackers; no full placement table; strays; each half one-sided; east start half-useful to wand users; mana
  piling near home). Revised with element ladders (first rungs at 9-10), wands split, Pain Conduit west, the table.
  Round 2: approved.
- Stage 2 (structure): round 1 REVISE (west seam behind a wheel at step 8; damage over time chained behind other
  archetypes; crowding; no pair links). Round 2: three clusters out past step 8 (mana piling). Done: Frugal and Flashes
  of Insight cut, 13 own notables within 8 steps (Knife 11), 8 pair links. Approved.
- Stage 3 (notables): round 1 REVISE (three copies of Knife notables; no hook at home; ES leech on every payoff; flat
  second notables; generic wand lines; too few true rule benders). Revision 2 adds five engine pieces (above) and eleven
  rule benders.
  Round 2: approved with two fixes (Draught's flask trigger re-keyed to mana on kill; utility raised to 17%).
- Stage 4 (final review): approved after three fixes (three hooks priced up to 4+ units; the per-stat cap shown to the
  player, "up to 40%", in `src/mods/text.ts`; the new lines registered in the editor's vocabulary, `vocab.ts`).
  **The Spire is done** (2026-10-31): 64 notables, 5 keystones; notables 58/25/17 offence/defence/utility (reference
  55/23/22); 14 own notables within 8 steps (the Knife 11). For the centre pass: the west seam reaches the unmoved
  centre ring at step 4, so three centre notables sit at 7 from the Mystic; the redrawn centre should sit about as far
  from every start. Label overlaps on second notables go to the tidy pass.
- Owner questions from the Spire: shields with spell block (sent to the Cathedral's shields, Spirit Ward replaced);
  minions only at the west; insight left to the Knife (Flashes of Insight cut); flask charges on killing a rare (an idea
  for Draught, held for the flask stats).

### The Bow

- Stage 1 (plan): R-bow.md. Round 1 REVISE (trap copies of the Knife at the same border; a sweep of north-seam copies;
  axes and a new dual-wield home were strays; cold arrows missing; Hedge Magic and Fleet Foot cut). Round 2 approved.
- Stage 2 (structure): round 1 REVISE. **Names:** several new names were the reference game's own notable names
  (exact or near). All renamed; `scripts/passives/rework/ref-names.ts` now checks every tree name against the reference
  tree's notable and keystone names (the repo's `ip.test.ts` checks gems and uniques only). The same sweep renamed three
  Spire names that `ip.test.ts` flagged as reference gem names (Pyre, Arc, Volley → Kiln Heart, Thunder's Reach, Spray of
  Bolts) and the Knife's Frostbite (→ Bitter Chill). The Wall's old keystone Strongarm matches a reference name: renamed
  in the Wall pass. Two defence homes moved out of the first ring (one folded into Hardy Stock); 11 own notables within 8.
- Stage 3 (notables): round 1 REVISE (the first ring refilled with mana; copies across borders; flat second notables;
  no flask charges; low prices; resistance padding). Round 2 REVISE (too few notables after the cuts: 51). Round 3 adds
  eight hooked notables.
- Engine additions for the Bow: the Long Shot distance rule (`farShot`, `src/calc/skill.ts` distanceMult: up to +30% at
  eight tiles, 20% less point blank); `evade` and `blink` events for gains and recovery (`src/data/buffs.ts`; rolled in
  `evaded()` in `combat.ts` and in `arrive()` in `src/sim/blinks.ts`); lines on existing machinery: flask charges gained
  and used (`flaskCharges`, `flaskChargesUsed`: under attrition the only way a kill refills flasks), evasion and attack
  speed while moving and crit while standing still (the `stationary` condition), attack damage per 200 accuracy,
  Quickened and Elusive gained on events, payoffs while Quickened or Elusive, fervour on crit, attack speed per fervour
  charge, buff duration, traps gaining cold, physical attack damage converted to cold, regeneration if hit recently.
- Stage 4 (final review): approved after one fix (an escape blink now rolls the blink gains too, `escapeCast` in
  `src/sim/blinks.ts`). **The Bow is done** (2026-10-31): 57 notables, 4 keystones (the reference 67: thirteen flat
  notables were cut rather than kept to hold the count); notables 59/24/18 (reference 55/24/21); 11 own notables within 8.
  Its identity: moving against standing still (Wayfarer, Wind Rider, Far Reach against Steadfast Aim, Telling Shot,
  Close Quarters), Quickened and Elusive with a payoff, flask charges as the attrition lever, cold and fire arrows.
  For the tidy pass: crowding and label collisions round the Yard seam's mid ring junction; Lingering Momentum could
  sit nearer Pursuit's End. Owner question: cold arrows in the Bow (carried on).
