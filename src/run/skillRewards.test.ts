import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { CLASSES } from '../data/classes';
import { gemDef, type ActiveGemDef } from '../data/gems';
import { weaponBar } from '../data/weaponFit';
import { mainAttr } from '../gen/loot';
import { newRun, rollSkillRewards } from './run';
import { withStarterGems } from './starterGems';

/** The early picks fit the character (docs/NEWPLAYER.md N3): usable with its weapon, one of them its own kind of damage. */
describe('early skill gem picks', () => {
  for (const cls of CLASSES)
    it(`${cls.id}: every pick of maps 1 to 4 is usable with the start weapon`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const run = withStarterGems(newRun(cls.id, seed));
        const hold = new Character(run.build).weaponHold();
        for (let map = 1; map <= 4; map++) {
          run.map = map;
          const picks = rollSkillRewards(run).map(
            (g) => gemDef((g as { gemId: string }).gemId) as ActiveGemDef,
          );
          expect(picks, `${cls.id} seed ${seed} map ${map}`).toHaveLength(3);
          expect(new Set(picks.map((p) => p.id)).size).toBe(3);
          for (const p of picks) expect(weaponBar(p, hold), `${p.id}`).toBeNull();
          expect(
            picks.some((p) => !p.utility && p.attr.includes(mainAttr(cls.id))),
            `${cls.id} seed ${seed} map ${map}: ${picks.map((p) => p.id)}`,
          ).toBe(true);
        }
      }
    });
});
