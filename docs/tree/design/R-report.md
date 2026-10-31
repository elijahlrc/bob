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
