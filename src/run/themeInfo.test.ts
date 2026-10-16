import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { TAG_ORDER } from '../data/monsterInfo';
import { THEMES, themeDef } from '../data/themes';
import { offersFor } from './preview';
import { newRun } from './run';
import { MAX_TAGS, MAX_TYPES, themeInfo, weakestAxis } from './themeInfo';

describe('what the camp card says about a map (docs/ENEMIES.md 5.1)', () => {
  it('the shares of factions and of damage each add up to one', () => {
    for (const t of THEMES) {
      const info = themeInfo(t);
      expect(
        info.factions.reduce((n, f) => n + f.share, 0),
        t.id,
      ).toBeCloseTo(1, 6);
      expect(
        info.mix.reduce((n, x) => n + x, 0),
        t.id,
      ).toBeCloseTo(1, 6);
      expect(info.types.length).toBeLessThanOrEqual(MAX_TYPES);
      expect(info.tags.length).toBeLessThanOrEqual(MAX_TAGS);
      expect(info.factions[0].share).toBeGreaterThanOrEqual(info.factions.at(-1)!.share);
    }
  });

  it('tags are in the fixed order', () => {
    for (const t of THEMES) {
      const tags = themeInfo(t).tags;
      expect(tags).toEqual([...tags].sort((a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b)));
    }
  });

  it('a mixed theme names what both its factions ask', () => {
    const mixed = themeInfo(THEMES.find((t) => t.id.startsWith('mix:'))!);
    expect(mixed.asks).toHaveLength(2);
  });

  it('a map that adds chaos damage shows more chaos', () => {
    const t = themeDef('ashenCrypt');
    const plain = themeInfo(t, [], 'plain', 40).mix[4];
    const chaos = themeInfo(t, ['extraChaos'], 'plain', 40).mix[4];
    expect(chaos).toBeGreaterThan(plain);
  });

  it('the weakest resistance is named when it stands out, and not when there is none', () => {
    const run = newRun('vanguard', 1);
    const ch = new Character(run.build, { areaLevel: 40, steady: 'clearing' });
    const line = weakestAxis(ch, [0.2, 0.1, 0.1, 0.5, 0.1]);
    expect(line).toContain('fire');
    expect(weakestAxis(ch, [1, 0, 0, 0, 0])).toBeNull();
  });

  it('every offer on the camp screen carries it', () => {
    const run = newRun('vanguard', 1);
    for (const o of offersFor(run)) {
      expect(o.info).toBeDefined();
      expect(o.info!.factions.length).toBeGreaterThan(0);
    }
  });
});
