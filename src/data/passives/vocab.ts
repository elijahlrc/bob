/**
 * The line vocabulary as a table the tree editor can offer: every exported line function of `lines.ts` with the kinds of
 * its arguments, and the way back from a `LineSpec` (`{ fn, args }`) to a `Line`. Lines whose arguments are not plain
 * values (`damage` takes an options object, `flag` a stat name) are left out of the table and cannot be made in the editor.
 */
import * as L from './lines';
import type { Line, LineSpec } from './types';

/** What one argument is: a number, an element, an element or chaos, a damage type, or an optional list of skill tags. */
export type ParamKind = 'n' | 'ele' | 'ele4' | 'dmg' | 'weapon' | 'tags?';

export const CHOICES: Record<Exclude<ParamKind, 'n' | 'tags?'>, readonly string[]> = {
  ele: ['fire', 'cold', 'lightning'],
  ele4: ['fire', 'cold', 'lightning', 'chaos'],
  dmg: ['physical', 'fire', 'cold', 'lightning', 'chaos'],
  weapon: ['sword', 'axe', 'mace', 'sceptre', 'dagger', 'claw', 'wand', 'staff', 'bow'],
};

const SPECIAL: Record<string, ParamKind[]> = {
  resOne: ['ele4', 'n'],
  eleAttackOne: ['ele', 'n'],
  eleDamage: ['dmg', 'n'],
  penetration: ['ele', 'n'],
  attackSpeed: ['n', 'tags?'],
  critChance: ['n', 'tags?'],
  critMulti: ['n', 'tags?'],
  aoe: ['n', 'tags?'],
  leechLife: ['n', 'tags?'],
  lifeOnHit: ['n', 'tags?'],
  manaLeech: ['n', 'tags?'],
  manaOnHit: ['n', 'tags?'],
  esOnHit: ['n', 'tags?'],
  maxResOne: ['ele4', 'n'],
  weaponDamage: ['weapon', 'n'],
  weaponCrit: ['weapon', 'n'],
  weaponCritMulti: ['weapon', 'n'],
  weaponSpeed: ['weapon', 'n'],
  weaponAccuracy: ['weapon', 'n'],
  cullingStrike: [],
};
const LEFT_OUT = new Set(['damage', 'flag', 'UNIT']);

type LineFn = (...args: unknown[]) => Line;
const FNS: Record<string, LineFn> = {};
for (const [name, f] of Object.entries(L))
  if (typeof f === 'function' && !LEFT_OUT.has(name)) FNS[name] = f as LineFn;

/** Every line the editor can make, with the kinds of its arguments, in the vocabulary's order. */
export const VOCAB: Record<string, ParamKind[]> = Object.fromEntries(
  Object.keys(FNS).map((name) => [name, SPECIAL[name] ?? ['n']]),
);

/** The line a spec names, or null when the function is unknown. */
export function makeLine(spec: LineSpec): Line | null {
  const f = FNS[spec.fn];
  if (!f) return null;
  const kinds = VOCAB[spec.fn];
  const args = spec.args.slice(0, kinds.length).map((a, i) => (kinds[i] === 'n' ? Number(a) : a));
  // An empty tag list means no tags.
  if (
    kinds[kinds.length - 1] === 'tags?' &&
    args.length === kinds.length &&
    !(args[args.length - 1] as unknown[])?.length
  )
    args.pop();
  try {
    return f(...args);
  } catch {
    return null;
  }
}

/** A fresh spec for a function, with the first sensible arguments. */
export function defaultSpec(fn: string): LineSpec {
  const kinds = VOCAB[fn] ?? ['n'];
  return {
    fn,
    args: kinds.filter((k) => k !== 'tags?').map((k) => (k === 'n' ? 10 : CHOICES[k][0])),
  };
}

/** The name a small or attribute node shows: its lines' labels (as build.ts names it). */
export const nameOfLines = (lines: Line[]): string => lines.map((l) => l.label).join(', ');
