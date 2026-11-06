# Bob — Showing replenish to the player

Status: planned and built 2026-11-06. Sections 1 to 3 are the owner's decisions; section 4 holds the calls the owner left
to Claude's judgment ("use your best judgment and I'll give you feedback"), each open to change.

## 1. Why

Replenish (docs/SUSTAIN.md) caps the life a character wins back in a fight: at most a share of the life it lost in the
last few seconds, less what it has already won back in that time. Since 2026-11-06 it covers all life won back in a fight
except flasks, regeneration and the Tithe of the Servants (section 2). It shapes every fight, but a player saw almost none
of it: the lines on items and the tree said "Replenish", and the character sheet had one Replenish Limit row with a
tooltip. Nothing in a fight or after a map showed the limit at work, so a player could not tell why life on hit stopped
healing, or that the limit was the reason.

## 2. What replenish covers (built 2026-11-06)

- **Replenish:** life leech, life on hit, life on kill, life on block, life won back on any event (crit, when hit, evade,
  blink, a kill of an ignited enemy, ...), curses that give life when their enemy is hit or killed, skills that mend the
  character (a damage over time that heals by its damage, the siphon beams) and triggered heals on uniques. Their text
  says "Replenish".
- **Not replenish:** flasks, regeneration (consecrated ground and the relic's regeneration included) and the Tithe of the
  Servants (a minion gone heals its owner), which acts like regeneration.
- **Energy shield is unchanged:** only life gains are replenish; energy shield gains have no limit, except life leech
  under the Shade Leech keystone.
- The share goes back from 45% to 50% of the life lost in the window; gear and passives can still raise it.
- "While replenishing" bonuses now hold for a moment after any replenish, a block heal or a curse's life included, not
  only leech and life on hit or kill.

## 3. Showing it (built 2026-11-06)

A first-time tip was offered and not chosen.

1. **A band on the life orb** (`Orb` in `src/ui/Hud.tsx`, `.orb-replenish` in `src/ui/leaf/hud.css`). Above the liquid,
   up to where the room left would take it (`replenishRoom`, `src/sim/replenish.ts`), never into the part auras reserve.
   It shrinks as replenish uses it and as old losses leave the window. The orb's tooltip adds "Replenish can win back N
   more".
2. **A line in the map report** (`src/ui/MapReport.tsx`, under what the damage came out of): "Replenish won back 1,234
   life; its limit held back 567 more." The map's ledger counts both in `replenish()` (`Ledger.replenished`,
   `heldBack`); held back is what a source offered, after the life the character was missing, beyond the room left.
   Reports from before have no line.
3. **A Replenish section on the character sheet** (`src/ui/Sheet.tsx`), after Recovery: Limit (the share and the
   window), From Damage (leech), On Hit, On Kill, On Block, the shares of life on kill and on block, every other event
   the gear and tree give life on, and the multipliers to replenish (its speed and window). Mana keeps its rows in
   Recovery. Curses, skills that mend and unique triggers are not listed.
4. **The Tithe of the Servants, halved:** 2.5% of a slain minion's life (was 5%) and 0.6% of an expired one's (was
   1.25%), `TITHE_SLAIN` and `TITHE_EXPIRED` in `src/data/runRewards.ts`. Section 4 says why.

## 4. Calls made while building (Claude's judgment, 2026-11-06)

- **Mock-up skipped.** The owner handed the whole plan over for feedback, so the band was built in the game and shown as
  a screenshot instead of an Artifact first.
- **The band's look:** a ghost of the life liquid in diagonal stripes (the liquid's own colour, faint), with a pale top
  edge, so it reads as life not yet had; it sits under the energy shield film and stops at the reserved band. It follows
  the room with a short ease, and none with reduced motion.
- **One total in the map report,** not a split by source: one line says what the player needs (it worked, and how much
  the limit cost), and the in-game text rule is as few words as it takes.
- **The Tithe's numbers.** `scripts/tithe-measure.ts` played the two level-100 Mystics on the high scores that carry the
  relic (rivals 929 and 944, save version 25) through six level-99 maps each, from 60% life. At 5% and 1.25% the Tithe
  healed about 0.3 to 0.4% of maximum life a second, like these builds' regeneration, but for rival 929 (whose only
  minions come from one Call Bonewalkers gem) it healed 52 to 93% of all the life the character lost, against 895 life
  from replenish; Raise Husk with its supports healed 38% of maximum life in one tick when a pack died together. Halved,
  it heals about 0.2% a second, 35 to 50% of rival 929's losses and 7 to 17% of rival 944's, and the largest single heal
  is 19% of maximum life; neither build cleared fewer maps (929 failed one of six both times, 944 none).
- **No bot run** for what block and recovery-on-event builds lose under the limit: a bot measures poorly what a player
  builds, and the leaderboard builds above already show the cost in the report line. Rival 929 had 59,000 life refused
  by the limit over six maps (much of it at the start of a map, from 60% life with no recent loss), so the limit bites
  hardest on a build that heals without being hit. Worth watching on the high scores.
