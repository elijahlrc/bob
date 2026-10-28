import { describe, expect, it } from 'vitest';
import { getTree } from '../../data/tree';
import type { SimEvent, World } from '../../sim/types';
import { BOSS_NEAR, mapCues, passiveVariant } from './hooks';

/** Just the parts of a world the map sounds read. */
function world(over: { endKind?: string; actors?: object[]; drops?: object[] } = {}): World {
  const player = { id: 1, x: 0, y: 0, alive: true, rarity: 'player' };
  return {
    sides: [{ player }],
    actors: [player, ...(over.actors ?? [])],
    drops: over.drops ?? [],
    plan: { endKind: over.endKind ?? 'rare' },
  } as unknown as World;
}
const ids = (w: World, ev: SimEvent[], seen = { boss: false }) =>
  mapCues(w, ev, seen).map((q) => (q.variant ? `${q.id}.${q.variant}` : q.id));

describe('map sounds (docs/AUDIO.md)', () => {
  it("are the character's own level up and death, and the map cleared", () => {
    const w = world();
    expect(
      ids(w, [
        { t: 'levelUp', src: 1, level: 5 },
        { t: 'levelUp', src: 7, level: 3 },
        { t: 'cleared' },
        { t: 'playerDied', src: 1 },
      ] as SimEvent[]),
    ).toEqual(['levelUp', 'cleared', 'death']);
  });

  it('hear rare and unique drops only', () => {
    const drop = (id: number, rarity: string) => ({
      id,
      x: 0,
      y: 0,
      item: { kind: 'item', rarity },
    });
    const w = world({ drops: [drop(1, 'magic'), drop(2, 'rare'), drop(3, 'unique')] });
    const ev = [1, 2, 3].map((id) => ({ t: 'drop', id })) as SimEvent[];
    expect(ids(w, ev)).toEqual(['find.rare', 'find.unique']);
  });

  it("hear a boss map's boss once, when it comes near", () => {
    const boss = { id: 9, x: BOSS_NEAR + 5, y: 0, alive: true, rarity: 'boss' };
    const w = world({ endKind: 'boss', actors: [boss] });
    const seen = { boss: false };
    expect(ids(w, [], seen)).toEqual([]);
    boss.x = BOSS_NEAR - 1;
    expect(ids(w, [], seen)).toEqual(['boss']);
    expect(ids(w, [], seen)).toEqual([]);
    // A boss walking up on a map that does not end in one is not announced.
    expect(ids(world({ actors: [{ ...boss }] }), [])).toEqual([]);
  });
});

describe('the Passive sound', () => {
  it('is the biggest kind of node an allocation took', () => {
    const of = (kind: string) => getTree().nodes.find((n) => n.kind === kind)!.id;
    expect(passiveVariant([of('small')])).toBe('small');
    expect(passiveVariant([of('small'), of('notable')])).toBe('notable');
    expect(passiveVariant([of('notable'), of('keystone'), of('small')])).toBe('keystone');
  });
});
