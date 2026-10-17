import { describe, expect, it } from 'vitest';
import { newRun, planFor, worldOptsFor } from '../run/run';
import { createDummyWorld } from './dummy';
import { hunted, MONSTERS } from './side';
import { createWorld } from './world';

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

  it('a world made for a map has exactly one side, at the plan’s start, on team 0', () => {
    const run = newRun('vanguard', 1);
    const plan = planFor(run, run.offers[0]);
    const opts = worldOptsFor(run, plan);
    const m = createWorld({ plan, build: run.build, xp: 7, opts });
    expect(m.sides).toHaveLength(1);
    const s = m.sides[0];
    expect([s.id, s.team, s.player.team, s.player.id]).toEqual([0, 0, 0, 1]);
    expect(s.player.side).toBe(s);
    expect(s.xp).toBe(7);
    expect([s.player.x, s.player.y]).toEqual([plan.lab.start.x, plan.lab.start.y]);
    expect(s.areaLevel).toBe(plan.areaLevel);
    expect(m.opts).toBe(opts);
    expect(m.nextId).toBeGreaterThan(1);
    expect(m.actors.filter((a) => a.isPlayer)).toEqual([s.player]);
    // Every monster is on the monsters' team, and none has a side.
    for (const a of m.actors)
      if (a !== s.player) expect([a.team, a.side]).toEqual([MONSTERS, null]);
  });

  it('teams: the character is team 0 and a monster team 1', () => {
    expect(w.sides[0].player.team).toBe(w.sides[0].team);
    expect(dummy.team).toBe(MONSTERS);
  });

  it('a monster hunts the nearest living side’s character; with one side, that one', () => {
    expect(hunted(w, dummy)).toBe(w.sides[0].player);
  });
});
