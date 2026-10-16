import { describe, expect, it } from 'vitest';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import { hunted, MONSTERS } from './side';

describe('sides (docs/DUEL.md 3)', () => {
  const { world: w, dummy } = createDummyWorld(newRun('vanguard', 1).build, { distance: 5 });

  it('a world made for one character has exactly one side, and the character knows it', () => {
    expect(w.sides).toHaveLength(1);
    const s = w.sides[0];
    expect(s.id).toBe(0);
    expect(s.team).toBe(0);
    expect(s.player.side).toBe(s);
    expect(w.actors.filter((a) => a.side)).toEqual([s.player]);
    expect(dummy.side).toBeNull();
  });

  it('teams: the character is team 0 and a monster team 1', () => {
    expect(w.sides[0].player.team).toBe(w.sides[0].team);
    expect(dummy.team).toBe(MONSTERS);
  });

  it('a monster hunts the nearest living side’s character; with one side, that one', () => {
    expect(hunted(w, dummy)).toBe(w.sides[0].player);
  });
});
