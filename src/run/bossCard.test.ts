import { describe, expect, it } from 'vitest';
import { BOSSES, BOSS_IDS } from '../data/bosses';
import { THEMES } from '../data/themes';
import { themeInfo } from './themeInfo';

/** A boss map's card counts the boss's damage (docs/NEWPLAYER.md N12). */
describe('the damage mix on a boss map’s card', () => {
  it('shows the Tollkeeper’s lightning whatever the theme', () => {
    for (const theme of THEMES) {
      const plain = themeInfo(theme, [], 'plain', 10).mix;
      const boss = themeInfo(theme, [], 'plain', 10, 'tollkeeper').mix;
      expect(boss[1], theme.id).toBeGreaterThan(Math.max(0.15, plain[1]));
    }
  });

  it('every boss has a fight mix that sums to one, and the blend still does', () => {
    for (const id of BOSS_IDS) {
      const sum = BOSSES[id].fightMix.reduce((a, b) => a + b, 0);
      expect(sum, id).toBeCloseTo(1, 2);
      const mix = themeInfo(THEMES[0], [], 'plain', BOSSES[id].map, id).mix;
      expect(
        mix.reduce((a, b) => a + b, 0),
        id,
      ).toBeCloseTo(1, 2);
    }
  });
});
