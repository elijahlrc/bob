import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { newRun, planFor, worldOptsFor } from '../run/run';
import { pullLanding } from './factions';
import { PLAYER_STRAND_GRACE, STRAND_GRACE } from './strand';
import type { World } from './types';
import { createWorld, spawnMonster, stepWorld } from './world';

function mapWorld(seed: number, offer = 0): World {
  const run = newRun('vanguard', seed);
  const plan = planFor(run, run.offers[offer]);
  const w = createWorld({ plan, build: run.build, xp: 0, opts: worldOptsFor(run, plan) });
  w.sides[0].opts.godMode = true;
  return w;
}

const rare = (type: MonsterTypeId): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'rare',
  level: 20,
  mods: [],
});

/** A wall tile with no floor within `gap` tiles: well inside the rock. */
function deepRock(w: World, gap = 3): { x: number; y: number } {
  const { grid } = w;
  for (let ty = gap; ty < grid.h - gap; ty++)
    for (let tx = gap; tx < grid.w - gap; tx++) {
      let near = false;
      for (let dy = -gap; dy <= gap && !near; dy++)
        for (let dx = -gap; dx <= gap; dx++) if (grid.isFloor(tx + dx, ty + dy)) near = true;
      if (!near) return { x: tx + 0.5, y: ty + 0.5 };
    }
  throw new Error('no deep rock on this map');
}

describe('a monster out of reach', () => {
  it('every monster the map is made with can be reached', () => {
    for (let seed = 1; seed <= 12; seed++)
      for (let offer = 0; offer < 3; offer++) {
        const w = mapWorld(seed, offer);
        for (const a of w.actors)
          if (!a.isPlayer && !a.flies && !a.phases) expect(w.grid.reachable(a.x, a.y)).toBe(true);
      }
  });

  it('is set down on reachable floor when something places it in a wall or outside the map', () => {
    const w = mapWorld(3);
    const rock = deepRock(w);
    for (const [x, y] of [
      [rock.x, rock.y],
      [-8, -8],
      [w.grid.w + 5, w.grid.h / 2],
    ]) {
      const m = spawnMonster(w, rare('warrior'), x, y, 0, 0, 'Stray');
      expect(w.grid.reachable(m.x, m.y)).toBe(true);
    }
  });

  it('a flier may hover over a wall, but is kept on the map', () => {
    const w = mapWorld(3);
    const rock = deepRock(w);
    const flier = (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).find(
      (t) => MONSTER_TYPES[t].flies,
    )!;
    const over = spawnMonster(w, rare(flier), rock.x, rock.y, 0, 0, 'Bat');
    expect([over.x, over.y]).toEqual([rock.x, rock.y]);
    const off = spawnMonster(w, rare(flier), -8, -8, 0, 0, 'Bat');
    expect(off.x).toBeGreaterThanOrEqual(0);
    expect(off.y).toBeGreaterThanOrEqual(0);
  });

  it('dies where the character can reach it, after a short grace, if it ends up in a wall anyway', () => {
    const w = mapWorld(5);
    const rock = deepRock(w);
    const m = spawnMonster(
      w,
      rare('warrior'),
      w.sides[0].player.x + 2,
      w.sides[0].player.y,
      0,
      0,
      'Stray',
    );
    m.life = 1e12;
    m.def.maxLife = 1e12;
    m.x = rock.x;
    m.y = rock.y;
    const ticks = Math.ceil(STRAND_GRACE * 60);
    for (let i = 0; i < ticks / 2; i++) stepWorld(w);
    expect(m.alive).toBe(true);
    for (let i = 0; i < ticks; i++) stepWorld(w);
    expect(m.alive).toBe(false);
    expect(w.grid.reachable(m.x, m.y)).toBe(true);
  });

  it('does not touch a monster that stands on reachable floor', () => {
    const w = mapWorld(5);
    const m = spawnMonster(
      w,
      rare('warrior'),
      w.sides[0].player.x + 2,
      w.sides[0].player.y,
      0,
      0,
      'Fine',
    );
    m.life = 1e12;
    m.def.maxLife = 1e12;
    for (let i = 0; i < STRAND_GRACE * 60 * 3; i++) stepWorld(w);
    expect(m.alive).toBe(true);
  });
});

describe('the character out of reach', () => {
  it('is set down on floor after a short grace when it ends up in rock or off the map', () => {
    for (const where of ['rock', 'off'] as const) {
      const w = mapWorld(5);
      const p = w.sides[0].player;
      const rock = deepRock(w);
      p.x = where === 'rock' ? rock.x : -6;
      p.y = where === 'rock' ? rock.y : -6;
      for (let i = 0; i < (PLAYER_STRAND_GRACE * 60) / 2; i++) stepWorld(w);
      expect(w.grid.reachable(p.x, p.y)).toBe(false);
      for (let i = 0; i < PLAYER_STRAND_GRACE * 60; i++) stepWorld(w);
      expect(w.grid.reachable(p.x, p.y)).toBe(true);
    }
  });

  it('is not dragged through a wall by a hook', () => {
    let tested = 0;
    for (let seed = 1; seed <= 12 && tested < 3; seed++) {
      const w = mapWorld(seed);
      const p = w.sides[0].player;
      const { grid } = w;
      // A floor tile, one tile of wall to its east, and open floor beyond it: the way a hook from the next room would come.
      for (let ty = 2; ty < grid.h - 2 && tested < 3; ty++)
        for (let tx = 2; tx < grid.w - 10; tx += 5) {
          const open = [2, 3, 4, 5, 6, 7].every((d) => grid.reachable(tx + d + 0.5, ty + 0.5));
          if (!grid.reachable(tx + 0.5, ty + 0.5) || grid.isFloor(tx + 1, ty) || !open) continue;
          p.x = tx + 0.5;
          p.y = ty + 0.5;
          const hooker = spawnMonster(w, rare('warrior'), tx + 7.5, ty + 0.5, 0, 0, 'Hooker');
          const land = pullLanding(w, p, hooker, 4);
          expect(land === null || land.x < tx + 1).toBe(true);
          tested++;
          break;
        }
    }
    expect(tested).toBeGreaterThan(0);
  });
});
