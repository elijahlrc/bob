import { ailmentsFromHit, emptyAilBase } from './combat';
import type { TargetState } from './combat';
import { distanceMult } from './skill';
import type { HandProfile, SkillProfile } from './skill';

/**
 * Only the strongest ignite (or bleed) on an enemy burns (the sim picks it each tick: `tickDots`, src/sim/combat.ts), so with
 * hits coming faster than the ailment runs out the one that burns is the best of those alive, not the average one. A hit rolls its
 * damage in a range and may crit, so the best of a dozen is well above the mean: a long bleed fed by a fast attack deals about
 * four tenths more than the sheet's average application did. This works out how much more, from the same rolls the sim makes.
 */

/** The most rolls tried for the damage of one application (spread over the chunks of damage that feed the ailment). */
const BUDGET = 96;
/** With fewer applications than this alive at a time, the best of them is the one there is, and the average is right. */
const NEGLIGIBLE = 0.25;

export type StrongestOf = { ignite: number; bleed: number };

/**
 * By what the strongest of the ignites (or bleeds) alive deals more than the sheet's average one did, for hits that land
 * `hitsPerSec` times a second on one target, a share `cc` of them critical strikes. 1 for an ailment that stacks (it adds up
 * anyway) and for one that rarely comes twice.
 */
export function strongestOf(
  p: SkillProfile,
  hand: HandProfile,
  t: TargetState,
  dist: number,
  hitsPerSec: number,
  cc: number,
): StrongestOf {
  const out: StrongestOf = { ignite: 1, bleed: 1 };
  if (hitsPerSec <= 0) return out;
  // A critical strike always ignites; a bleed has the same chance whether it crits or not.
  if (p.ignite.max <= 1)
    out.ignite = factor(p, hand, t, dist, 0, hitsPerSec * p.ignite.dur, cc, p.ignite.chance, 1);
  if (!p.woundDance && p.bleed.chance > 0)
    out.bleed = factor(
      p,
      hand,
      t,
      dist,
      1,
      hitsPerSec * p.bleed.dur,
      cc,
      p.bleed.chance,
      p.bleed.chance,
    );
  return out;
}

/**
 * How much better the strongest application of the `n` hits that fall within an ailment's life is than the average one, when
 * a hit that crits (chance `cc`) applies it with chance `onCrit` and one that does not with chance `plain`. `kind`: 0 ignite,
 * 1 bleed. The applications are every roll of the damage chunks that feed the ailment, crit and not, as the sim rolls them.
 */
function factor(
  p: SkillProfile,
  hand: HandProfile,
  t: TargetState,
  dist: number,
  kind: 0 | 1,
  n: number,
  cc: number,
  plain: number,
  onCrit: number,
): number {
  if (n * ((1 - cc) * plain + cc * onCrit) < NEGLIGIBLE) return 1;
  const feeding: number[] = [];
  hand.ailChunks.forEach((c, i) => {
    if (c.k[kind] > 0 && c.max > c.min) feeding.push(i);
  });
  if (feeding.length === 0) return 1;
  const dm = distanceMult(p, dist);
  const zeros = [0, 0, 0, 0, 0];
  const always = () => true;
  // What an application deals is a sum of the rolls of the chunks that feed it, so it is a straight line in each roll: the
  // value with every chunk at the middle of its range, and what one chunk moved to the top of its range adds.
  const dps = (crit: boolean, top: number): number => {
    const ha = emptyAilBase();
    hand.ailChunks.forEach((c, i) => {
      const base = (c.min + (i === top ? 1 : 0.5) * (c.max - c.min)) * dm;
      ha.ignite[c.type] += base * c.k[0];
      ha.bleed[c.type] += base * c.k[1];
      ha.poison[c.type] += base * c.k[2];
    });
    const a = ailmentsFromHit(p, hand, zeros, ha, crit, t, always);
    return kind === 0 ? a.ignite : a.bleed;
  };
  const levels = Math.max(2, Math.min(16, Math.floor(Math.pow(BUDGET, 1 / feeding.length))));
  const rolls = Math.pow(levels, feeding.length);
  // Each application with the chance that one hit makes it.
  const events: [number, number][] = [];
  for (const crit of [false, true]) {
    const mid = dps(crit, -1);
    if (mid <= 0) continue;
    const chance = (crit ? cc * onCrit : (1 - cc) * plain) / rolls;
    if (chance <= 0) continue;
    const slope = feeding.map((i) => 2 * (dps(crit, i) - mid));
    for (let r = 0; r < rolls; r++) {
      let rest = r;
      let x = mid;
      for (const s of slope) {
        x += s * (((rest % levels) + 0.5) / levels - 0.5);
        rest = Math.floor(rest / levels);
      }
      events.push([x, chance]);
    }
  }
  const total = events.reduce((s, [, q]) => s + q, 0);
  if (total <= 0 || n * total < NEGLIGIBLE) return 1;
  events.sort((a, b) => a[0] - b[0]);
  const mean = events.reduce((s, [x, q]) => s + x * q, 0) / total;
  const average = mean * (1 - Math.pow(1 - total, n));
  // The strongest of n hits that each apply with these chances: P(none above x) is (1 - P(one hit applies above x))^n.
  let best = 0;
  let before = 0;
  let above = total;
  for (const [x, q] of events) {
    best += (x - before) * (1 - Math.pow(Math.max(0, 1 - above), n));
    before = x;
    above -= q;
  }
  return average > 0 ? Math.max(1, best / average) : 1;
}
