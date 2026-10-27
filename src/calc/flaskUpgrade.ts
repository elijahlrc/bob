import { flaskBase } from '../data/flasks';
import type { FlaskItem } from '../data/types';
import { ModDB } from '../mods/modDb';
import { flaskSpec, type FlaskSpec } from './flasks';

/**
 * When a carried flask is an upgrade for a worn one. Both are resolved with no character mods (the character's flask mods
 * scale the two alike), so only the base and the flask's own affixes decide.
 */

const NEUTRAL = new ModDB([]);

/** Flags a flask can carry; a flask with more of them (and nothing less) is the better one. */
const FLAGS = [
  'instant',
  'removeIgnite',
  'removeFreeze',
  'removeBleed',
  'removePoison',
  'removeShock',
  'removeCurse',
  'lifeToEs',
] as const;

/** The same sort of flask: the same kind, the same effect for a utility flask, the same unique for a unique one. */
export function sameFlaskType(a: FlaskItem, b: FlaskItem): boolean {
  if (a.uniqueId !== b.uniqueId) return false;
  const ba = flaskBase(a.baseId);
  const bb = flaskBase(b.baseId);
  return ba.kind === bb.kind && (ba.kind !== 'utility' || ba.id === bb.id);
}

/** What a flask's buff grants, summed per stat and kind. */
function buffTotals(s: FlaskSpec): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of s.buff) {
    const k = `${x.stat}|${x.kind}`;
    m.set(k, (m.get(k) ?? 0) + x.value);
  }
  return m;
}

/**
 * Whether `a` is strictly better than `b`: the same type, nothing worse and something better in charges (more, each use
 * cheaper), what it recovers, how long a utility flask runs, any flag it has and the other lacks, and every stat of its buff.
 * A recovery flask's duration is a trade (the same amount over more or less time), so it does not count.
 */
export function flaskBeats(a: FlaskItem, b: FlaskItem): boolean {
  if (!sameFlaskType(a, b)) return false;
  const sa = flaskSpec(a, NEUTRAL);
  const sb = flaskSpec(b, NEUTRAL);
  const pairs: [number, number][] = [
    [sa.life, sb.life],
    [sa.mana, sb.mana],
    [sa.maxCharges, sb.maxCharges],
    [sb.perUse, sa.perUse],
  ];
  if (sa.kind === 'utility') pairs.push([sa.duration, sb.duration]);
  for (const f of FLAGS) pairs.push([sa[f] ? 1 : 0, sb[f] ? 1 : 0]);
  const ta = buffTotals(sa);
  const tb = buffTotals(sb);
  for (const k of new Set([...ta.keys(), ...tb.keys()]))
    pairs.push([ta.get(k) ?? 0, tb.get(k) ?? 0]);
  return pairs.every(([x, y]) => x >= y) && pairs.some(([x, y]) => x > y);
}

/** Whether `a` is a higher tier than `b` of the same type (a higher base level). */
export function flaskHigherTier(a: FlaskItem, b: FlaskItem): boolean {
  return sameFlaskType(a, b) && flaskBase(a.baseId).level > flaskBase(b.baseId).level;
}

/** Whether `a` is an upgrade for the worn `b`: strictly better, or a higher tier that `b` does not beat. */
export function flaskUpgradesOver(a: FlaskItem, b: FlaskItem): boolean {
  return flaskBeats(a, b) || (flaskHigherTier(a, b) && !flaskBeats(b, a));
}
