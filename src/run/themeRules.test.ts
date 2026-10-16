import { describe, expect, it } from 'vitest';
import { MONSTER_TYPES } from '../data/monsters';
import {
  leaderOf,
  ossuaryLed,
  OSSUARY_CAP_FROM,
  themeDef,
  themesFor,
  themeWeight,
  THEMES,
} from '../data/themes';
import { rollThemes } from './offers';

describe('the offer set rules (docs/ENEMIES.md 4.2)', () => {
  it('a set is three different themes from the pool, the same on every roll', () => {
    for (let map = 1; map <= 100; map += 3)
      for (let seed = 1; seed <= 12; seed++) {
        const set = rollThemes(seed, map);
        expect(set).toHaveLength(3);
        expect(new Set(set).size).toBe(3);
        expect(rollThemes(seed, map)).toEqual(set);
        for (const id of set) expect((themeDef(id).fromMap ?? 1) <= map).toBe(true);
      }
  });

  it('from map 4 a set holds at most one skeleton-led theme', () => {
    for (let map = OSSUARY_CAP_FROM; map <= 100; map++)
      for (let seed = 1; seed <= 15; seed++) {
        const led = rollThemes(seed, map).filter((id) => ossuaryLed(themeDef(id)));
        expect(led.length, `map ${map} seed ${seed}`).toBeLessThanOrEqual(1);
      }
  });

  it('the leading factions of a set differ whenever the pool has enough of them', () => {
    for (let map = 10; map <= 100; map += 5) {
      const pool = new Set(themesFor(map).map((t) => leaderOf(t)));
      if (pool.size < 3) continue;
      for (let seed = 1; seed <= 20; seed++) {
        const leaders = rollThemes(seed, map).map((id) => leaderOf(themeDef(id)));
        expect(new Set(leaders).size, `map ${map} seed ${seed}`).toBe(3);
      }
    }
  });

  it('skeleton themes thin out, and only they', () => {
    const crypt = themeDef('ashenCrypt');
    const rot = themeDef('charnelPits');
    expect(themeWeight(crypt, 10)).toBeLessThan(themeWeight(crypt, 5));
    for (const m of [1, 10, 60]) expect(themeWeight(rot, m)).toBe(1);
  });

  it("a faction theme's chief is of its leading faction", () => {
    for (const t of THEMES.filter((x) => !x.id.startsWith('mix:') && !ossuaryLed(x))) {
      expect(t.chief, t.id).toBeDefined();
      expect(MONSTER_TYPES[t.chief!.type].faction, t.id).toBe(leaderOf(t));
    }
  });
});
