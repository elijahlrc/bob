import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { Rng } from '../core/rng';
import { AMBUSH_RANGE } from '../data/constants';
import type { MonsterTypeId } from '../data/monsters';
import { themeDef } from '../data/themes';
import { generateLabyrinth } from '../gen/labyrinth';
import { packPlan, TEMPLATE_WEIGHTS } from '../gen/packs';
import { populate } from '../gen/population';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A world with a passive player (stunned for good) to watch the monsters on their own. */
function arena(): World {
  const { world } = createDummyWorld(newRun('vanguard', 1).build, { distance: 30 });
  world.player.stunT = 1e9;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 10,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0): Actor {
  return spawnMonster(w, spec(type), w.player.x + dx, w.player.y + dy, 0, 0, type);
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('Ambush and Patrol (docs/ENEMIES.md 4.2)', () => {
  it('an ambush lies still, however long the character is in sight, until it comes close', () => {
    const w = arena();
    const far = put(w, 'warrior', 9);
    far.hold = true;
    const near = put(w, 'warrior', AMBUSH_RANGE - 2, 2);
    near.hold = true;
    run(w, 0.3);
    expect(near.state).toBe('chase');
    expect(near.hold).toBe(false);
    // Its pack wakes with it; the one nine tiles away would have noticed a plain monster, and has not.
    expect(far.hold || far.state === 'chase').toBe(true);
  });

  it('a dormant monster that is not near does not wake on its own', () => {
    const w = arena();
    const m = put(w, 'warrior', 9);
    m.hold = true;
    run(w, 5);
    expect(m.state).toBe('idle');
    expect(m.hold).toBe(true);
  });

  it('a patrol walks to its far point and back, slowly, until it notices the character', () => {
    const w = arena();
    const m = put(w, 'warrior', 25);
    m.patrol = [
      { x: m.x, y: m.y },
      { x: m.x, y: m.y - 6 },
    ];
    // Out of the character\'s sight, so that it keeps walking.
    const start = { x: m.x, y: m.y };
    run(w, 2);
    expect(m.state).toBe('idle');
    const moved = Math.hypot(m.x - start.x, m.y - start.y);
    expect(moved).toBeGreaterThan(0.5);
    // A patrol is slow: less than half the pace of the same monster chasing.
    expect(moved).toBeLessThan(m.def.moveSpeed * 2 * 0.6);
  });
});

describe('the Ambush and Patrol packs of a map', () => {
  it('a faction that forms them makes them, and they carry what they need', () => {
    expect(TEMPLATE_WEIGHTS.rot.ambush).toBeGreaterThan(0);
    expect(TEMPLATE_WEIGHTS.choir.patrol).toBeGreaterThan(0);
    let holds = 0;
    let patrols = 0;
    for (let s = 0; s < 60; s++) {
      const lab = generateLabyrinth(new Rng(s), { rooms: 8, sideBranches: 1 });
      for (const [theme, kind] of [
        ['charnelPits', 'hold'],
        ['ashenNave', 'patrol'],
      ] as const) {
        const pop = populate(new Rng(s + 3), lab, {
          areaLevel: 30,
          endKind: 'rare',
          theme: themeDef(theme),
          map: 30,
        });
        for (const m of pop.monsters) {
          if (kind === 'hold' && m.hold) holds++;
          if (kind === 'patrol' && m.patrol) {
            patrols++;
            expect(m.patrol).toHaveLength(2);
          }
        }
      }
    }
    expect(holds).toBeGreaterThan(0);
    expect(patrols).toBeGreaterThan(0);
  });

  it('an ambush and a patrol never share a pack, and a plain pack has neither', () => {
    for (let seed = 1; seed < 300; seed++) {
      const p = packPlan(new Rng(seed), themeDef('ashenNave'), 5);
      expect(p.hold && p.patrol).toBe(false);
      if (p.template !== 'ambush') expect(p.hold).toBe(false);
      if (p.template !== 'patrol') expect(p.patrol).toBe(false);
    }
  });

  it('the same map is the same on every build: who lies in wait and who walks', () => {
    const lab = generateLabyrinth(new Rng(4), { rooms: 8, sideBranches: 1 });
    const make = () =>
      populate(new Rng(9), lab, {
        areaLevel: 30,
        endKind: 'rare',
        theme: themeDef('ashenNave'),
        map: 30,
      });
    expect(JSON.stringify(make())).toBe(JSON.stringify(make()));
  });
});
