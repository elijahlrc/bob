import type { FlaskItem, Item } from '../data/types';
import { triggerText } from '../data/triggers';
import { modsText } from '../mods/text';
import { armourLine, flaskBaseLines, lineKey, weaponLine } from './ItemCard';

/** A weapon's or armour piece's own numbers, one string each (the card's muted line). */
function statParts(it: Item): string[] {
  const w = weaponLine(it);
  if (w)
    return [w.phys, w.speed, w.crit, ...(w.extra.length ? [`Adds ${w.extra.join(', ')}`] : [])];
  return armourLine(it)?.map((p) => p.text) ?? [];
}

/**
 * One row of a side-by-side compare (docs/ITEM-SLOTS.md): a stat both items have, `same` or the new one `better` / `worse`
 * (by its numbers), or stats only one item has, side by side (`apart`; either side may be empty).
 */
export type CompareRow = { a?: string; b?: string; mark: 'same' | 'better' | 'worse' | 'apart' };

/** The mean of a line's numbers ("2 to 4" is 3), or null when it has none. */
function lineValue(line: string): number | null {
  const m = line.match(/\d+(?:\.\d+)?/g);
  return m ? m.map(Number).reduce((x, y) => x + y, 0) / m.length : null;
}

/**
 * Two lists of lines side by side: the stats both have first, a row each, then what only one has, filling the rows beside
 * each other with no empty rows between.
 */
export function pairSideBySide(mine: string[], theirs: string[]): CompareRow[] {
  const used = new Set<number>();
  const shared: CompareRow[] = [];
  const onlyMine: string[] = [];
  for (const a of mine) {
    const j = theirs.findIndex((b, i) => !used.has(i) && lineKey(b) === lineKey(a));
    if (j < 0) {
      onlyMine.push(a);
      continue;
    }
    used.add(j);
    const b = theirs[j];
    const [x, y] = [lineValue(a), lineValue(b)];
    const mark =
      a === b || x === null || y === null || x === y ? 'same' : x > y ? 'better' : 'worse';
    shared.push({ a, b, mark });
  }
  const onlyTheirs = theirs.filter((_, i) => !used.has(i));
  const apart: CompareRow[] = [];
  for (let i = 0; i < Math.max(onlyMine.length, onlyTheirs.length); i++)
    apart.push({ a: onlyMine[i], b: onlyTheirs[i], mark: 'apart' });
  return [...shared, ...apart];
}

/** An item's stats in two groups: what its base gives (its own numbers, implicit lines), then what its affixes give. */
export function statGroups(it: Item | FlaskItem): { base: string[]; affix: string[] } {
  if (it.kind === 'flask')
    return { base: flaskBaseLines(it), affix: it.affixes.flatMap((a) => modsText(a.mods)) };
  const all = [...it.affixes.flatMap((a) => a.mods), ...(it.uniqueMods ?? [])];
  return {
    base: [...statParts(it), ...modsText(it.implicits)],
    affix: [
      ...modsText(all.filter((m) => m.kind !== 'flag')),
      ...modsText(all.filter((m) => m.kind === 'flag')),
      ...(it.uniqueTriggers ?? []).map((t) => triggerText(t)),
    ],
  };
}

/** The side-by-side compare of `it` with what it would replace: its base stats, then its affix stats. */
export function compareGroups(
  it: Item | FlaskItem,
  against?: Item | FlaskItem,
): { base: CompareRow[]; affix: CompareRow[] } {
  const a = statGroups(it);
  const b = against && against.kind === it.kind ? statGroups(against) : { base: [], affix: [] };
  return { base: pairSideBySide(a.base, b.base), affix: pairSideBySide(a.affix, b.affix) };
}
