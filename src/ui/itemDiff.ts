import type { FlaskItem, Item } from '../data/types';
import { triggerText } from '../data/triggers';
import { armourLine, flaskLines, itemLines, lineKey, weaponLine } from './ItemCard';

/**
 * One line of the merged compare card (docs/EQUIP.md 3.2): the new item's line with what it is against the worn one's, or a line
 * only the worn item had. `was` is the old value of a changed line ("+38" where the new line says "+42").
 */
export type DiffRow = { text: string; mark: 'same' | 'gain' | 'lost' | 'diff'; was?: string };

/** The numbers of a line, as the old value of a changed one: "+38", "2–4", "17%". The whole line when it has none. */
export function oldValue(line: string): string {
  const nums = line.match(/[+\-−]?\d+(?:\.\d+)?(?:[–-]\d+(?:\.\d+)?)?%?/g);
  return nums ? nums.join(' / ') : line;
}

/**
 * Pair two lists of lines by what they say with the numbers taken out (`lineKey`): in both and equal is `same`, in both with
 * another number is `diff` (with `was`), only in `mine` is `gain`; the lines only `theirs` has follow as `lost`.
 */
export function pairLines(mine: string[], theirs: string[]): DiffRow[] {
  const old = new Map(theirs.map((l) => [lineKey(l), l]));
  const have = new Set(mine.map(lineKey));
  const rows: DiffRow[] = mine.map((text) => {
    const t = old.get(lineKey(text));
    if (t === undefined) return { text, mark: 'gain' };
    return t === text ? { text, mark: 'same' } : { text, mark: 'diff', was: oldValue(t) };
  });
  for (const text of theirs) if (!have.has(lineKey(text))) rows.push({ text, mark: 'lost' });
  return rows;
}

/** A weapon's or armour piece's own numbers, one string each (the card's muted line). */
function statParts(it: Item): string[] {
  const w = weaponLine(it);
  if (w)
    return [w.phys, w.speed, w.crit, ...(w.extra.length ? [`Adds ${w.extra.join(', ')}`] : [])];
  return armourLine(it)?.map((p) => p.text) ?? [];
}

const modLines = (it: Item): string[] => [
  ...itemLines(it),
  ...(it.uniqueTriggers ?? []).map(triggerText),
];

/**
 * The compare of `it` against what it would replace, as one list: its own numbers first, then its mods. Lines the worn item
 * has and `it` lacks are at the end of their group, marked `lost`.
 */
export function diffRows(it: Item | FlaskItem, against?: Item | FlaskItem): DiffRow[] {
  if (it.kind === 'flask')
    return pairLines(flaskLines(it), against?.kind === 'flask' ? flaskLines(against) : []);
  const old = against?.kind === 'item' ? against : undefined;
  return [
    ...pairLines(statParts(it), old ? statParts(old) : []),
    ...pairLines(modLines(it), old ? modLines(old) : []),
  ];
}
