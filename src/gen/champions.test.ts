import { describe, expect, it } from 'vitest';
import { CHAMPION_FROM_MAP, endChampion } from '../data/champions';
import { themeDef } from '../data/themes';
import { makeMapPlan } from './mapPlan';

/** The monsters of a plan's end room. */
function endRoom(plan: ReturnType<typeof makeMapPlan>) {
  const end = plan.lab.rooms[plan.lab.mainPath[plan.lab.mainPath.length - 1]];
  return plan.pop.monsters.filter((m) => m.room === end.id);
}

describe('a theme’s champion ends an ordinary map (docs/BOSSES.md 19)', () => {
  const theme = themeDef('ashenCrypt');

  it('takes the end-of-map rare’s place from map 5, with a rare’s power and its own mod', () => {
    for (const map of [5, 15, 37]) {
      const leader = endRoom(makeMapPlan(3, map, 'ashenCrypt'))[0];
      expect(leader.spec.rarity, `map ${map}`).toBe('rare');
      expect(leader.spec.type).toBe(theme.chief!.type);
      expect(leader.spec.mods).toContain(theme.chief!.mod);
    }
  });

  it('not on the first maps, not on a boss map, not in a Crawl', () => {
    expect(endRoom(makeMapPlan(3, CHAMPION_FROM_MAP - 1, 'ashenCrypt'))[0].spec.mods).not.toContain(
      theme.chief!.mod,
    );
    expect(endChampion(theme, 20, 20, 'boss')).toBeUndefined();
    const crawl = makeMapPlan(3, 15, 'ashenCrypt', [], 15, 'crawl', 0);
    expect(endRoom(crawl).some((m) => m.spec.mods.includes(theme.chief!.mod))).toBe(false);
  });

  it('only once its type is met on maps of that level', () => {
    const t = themeDef('drownedVault');
    // A Wrack is not met below its level.
    expect(endChampion(t, 15, 15, 'rare')).toBeUndefined();
    expect(endChampion(t, 30, 30, 'rare')?.mod).toBe('tidewarden');
  });
});
