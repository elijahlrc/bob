import { describe, expect, it } from 'vitest';
import { ALL_GEMS } from '../data/gems';
import { gemCardData } from './gemText';

describe('gemCardData', () => {
  it('a support says which skills it will not take, so "any skill" is true', () => {
    for (const def of ALL_GEMS) {
      if (def.kind !== 'support' || !def.excludes?.length) continue;
      const line = gemCardData(def, 1).stats.find((l) => l.startsWith('Not '));
      expect(line, def.id).toBeDefined();
    }
  });

  it('a card never says the same thing twice', () => {
    for (const def of ALL_GEMS)
      for (const level of [1, 20]) {
        const d = gemCardData(def, level);
        for (const lines of [d.stats, d.effects])
          expect(new Set(lines).size, `${def.id} at level ${level}`).toBe(lines.length);
      }
  });

  it('a card shows no stat id and no line worth nothing', () => {
    for (const def of ALL_GEMS)
      for (const level of [1, 20]) {
        const d = gemCardData(def, level);
        for (const l of [...d.stats, ...d.effects]) {
          expect(l, `${def.id} at level ${level}`).not.toMatch(/\b[a-z]+\.[a-zA-Z]+\b/);
          expect(l, `${def.id} at level ${level}`).not.toMatch(
            /^[+-]?0%? (increased|reduced|more|less|to) /,
          );
        }
      }
  });

  it('a warcry shouts; a channelled touch does not', () => {
    const stats = (id: string) =>
      gemCardData(
        ALL_GEMS.find((g) => g.id === id)!,
        1,
      ).stats.join('|');
    expect(stats('rotTouch')).not.toMatch(/warcr|Shouts/);
    expect(stats('kindledBellow')).toContain('shared with the other warcries');
  });

  it('a mine or trap says how long it waits to be set off, a totem how long it stands', () => {
    const stats = (id: string) =>
      gemCardData(
        ALL_GEMS.find((g) => g.id === id)!,
        1,
      ).stats;
    expect(stats('mortarCharge')).toContain('Waits up to 5 s to go off');
    expect(stats('jawsTrap')).toContain('Waits up to 4 s to go off');
    expect(stats('mortarCharge').join('|')).not.toContain('stands for');
    expect(stats('mortarBow')).toContain('What it puts down stands for 8 s');
  });

  it('scales values with level', () => {
    const def = ALL_GEMS.find((g) => g.kind === 'active')!;
    const lo = gemCardData(def, 1).stats.join('|');
    const hi = gemCardData(def, 20).stats.join('|');
    expect(hi).not.toBe(lo);
  });
});
