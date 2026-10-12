/**
 * The balance pass of the generated clusters (docs/TREE-REDESIGN.md, T2), run by the emitter after the translation:
 *
 *   1. a stat's small nodes all give one value (the median of what they gave);
 *   2. a cluster's small nodes agree with its notable (they give the notable's own stat, or its nearest relative);
 *   3. a notable is worth at least `NOTABLE_FLOOR` small nodes, `NOTABLE_SINGLE_LINE` if it has one line.
 *
 * Nothing here adds a line or a node: it only changes values and replaces a small node's stat. `npm run tree:emit` prints the report.
 */
import {
  floorFor,
  isScalable,
  modKey,
  niceValue,
  powerOf,
  unitsOf,
  type Priced,
} from '../../src/data/tree/power';
import type { ModT } from '../coverage/translate';
import type { ClusterBuilt } from './clusters';

const priced = (m: ModT): Priced => ({
  stat: m.stat,
  kind: m.kind,
  value: m.min,
  ...(m.damageTypes ? { damageTypes: m.damageTypes } : {}),
  ...(m.tags ? { tags: m.tags } : {}),
  ...(m.condition ? { condition: m.condition } : {}),
});
const withValue = (m: ModT, v: number): ModT => ({ ...m, min: v, max: v });

/** The stat a counted or charge line has no small node of; its nearest relative that a small node can give. */
function relative(m: ModT): ModT | null {
  const charge = /^(?:maxCharges|chargeOn\.[a-zA-Z]+)\.?(?:[a-zA-Z]+\.)?([a-zA-Z]+)$/.exec(m.stat);
  if (charge && ['fervour', 'grit', 'insight'].includes(charge[1]))
    return { stat: `chargeDuration.${charge[1]}`, kind: 'inc', min: 18, max: 18 };
  return null;
}

/** Lines that say the same thing (the same stat, for the same things) become one with the sum: a card does not list "1 additional Minion" three times. */
function mergeSame(mods: ModT[]): ModT[] {
  const at = new Map<string, number>();
  const out: ModT[] = [];
  for (const m of mods) {
    const k = JSON.stringify([m.stat, m.kind, m.tags, m.damageTypes, m.condition, m.per, m.local]);
    const i = at.get(k);
    if (i === undefined || m.kind === 'flag') {
      at.set(k, out.length);
      out.push({ ...m });
    } else out[i] = { ...out[i], min: out[i].min + m.min, max: out[i].max + m.max };
  }
  return out;
}

export type BalanceReport = {
  normalised: number;
  coherent: number;
  raised: string[];
  stillWeak: string[];
};

export function balance(built: ClusterBuilt[]): { built: ClusterBuilt[]; report: BalanceReport } {
  const out = built.map((b) => ({
    ...b,
    notable: mergeSame(b.notable),
    small: mergeSame(b.small),
  }));
  const report: BalanceReport = { normalised: 0, coherent: 0, raised: [], stillWeak: [] };

  // 1. one value for a stat's small nodes.
  {
    const u = unitsOf(out.flatMap((b) => b.small.map(priced)));
    for (const b of out)
      b.small = b.small.map((m) => {
        const unit = u.byKey.get(modKey(priced(m)));
        if (unit === undefined || m.kind === 'flag' || unit === m.min) return m;
        report.normalised++;
        return withValue(m, unit);
      });
  }

  // 2. the small nodes give what the notable gives.
  {
    const u = unitsOf(out.flatMap((b) => b.small.map(priced)));
    for (const b of out) {
      const have = new Set(b.notable.map((m) => m.stat));
      if (b.small.some((m) => have.has(m.stat))) continue;
      let pick: ModT | null = null;
      for (const m of b.notable) {
        if (m.kind === 'flag') continue;
        const rel = relative(m);
        if (rel) {
          pick = rel;
          break;
        }
        const unit = u.byKey.get(modKey(priced(m))) ?? u.byStat.get(`${m.stat}|${m.kind}`);
        if (unit !== undefined) {
          pick = withValue(m, unit);
          break;
        }
      }
      if (!pick) continue;
      b.small = [pick];
      report.coherent++;
    }
  }

  // 3. the floor for a notable. The units are those of the small nodes as they now stand.
  {
    const u = unitsOf(out.flatMap((b) => b.small.map(priced)));
    out.forEach((b, i) => {
      const need = floorFor(b.notable.length);
      const now = powerOf(b.notable.map(priced), u);
      if (now >= need - 1e-9) return;
      const fixed = b.notable.filter((m) => !isScalable(priced(m), u));
      const free = b.notable.filter((m) => isScalable(priced(m), u));
      const fixedPower = powerOf(fixed.map(priced), u);
      const freePower = powerOf(free.map(priced), u);
      if (!free.length || freePower <= 0) {
        report.stillWeak.push(`g${i} ${now.toFixed(2)}`);
        return;
      }
      let k = (need - fixedPower) / freePower;
      let next = b.notable;
      for (let tries = 0; tries < 6; tries++) {
        next = b.notable.map((m) =>
          isScalable(priced(m), u) ? withValue(m, niceValue(m.min * k) || m.min) : m,
        );
        if (powerOf(next.map(priced), u) >= need - 1e-9) break;
        k *= 1.1;
      }
      report.raised.push(
        `g${i} ${now.toFixed(2)} -> ${powerOf(next.map(priced), u).toFixed(2)}: ${b.notable.map((m) => `${m.stat} ${m.min}`).join(', ')} => ${next.map((m) => `${m.stat} ${m.min}`).join(', ')}`,
      );
      b.notable = next;
    });
  }
  return { built: out, report };
}
