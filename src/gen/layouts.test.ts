import { describe, expect, it } from 'vitest';
import { BIOMES, PINNED_BIOME } from '../data/biomes';
import { LEGACY } from '../data/difficulty';
import type { MapTypeId } from '../data/mapTypes';
import { isFloor } from './labyrinth';
import { makeMapPlan } from './mapPlan';

const plan = (biome: string, map: number, seed: number, type: MapTypeId = 'plain') =>
  makeMapPlan(seed * 104729, map, 'ashenCrypt', [], map, type, 0, LEGACY, 0, biome, 'standard');

/** Tiles reachable from the start on foot (4 neighbours). */
function reach(p: ReturnType<typeof plan>): Set<number> {
  const { lab } = p;
  const seen = new Set<number>();
  const stack = [Math.floor(lab.start.y) * lab.w + Math.floor(lab.start.x)];
  seen.add(stack[0]);
  while (stack.length) {
    const k = stack.pop()!;
    const x = k % lab.w;
    const y = (k - x) / lab.w;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nk = (y + dy) * lab.w + x + dx;
      if (isFloor(lab, x + dx, y + dy) && !seen.has(nk)) {
        seen.add(nk);
        stack.push(nk);
      }
    }
  }
  return seen;
}

describe('biome layouts (docs/MAP-VARIETY.md 3.2)', () => {
  for (const b of BIOMES) {
    it(`${b.id} (${b.layout}): every room, the exit, the chests and every monster can be walked to`, () => {
      for (const map of [1, 6, 15, 40, 75, 100])
        for (let seed = 1; seed <= 8; seed++) {
          const p = plan(b.id, map, seed);
          const seen = reach(p);
          const at = (x: number, y: number) => Math.floor(y) * p.lab.w + Math.floor(x);
          expect(seen.has(at(p.lab.exit.x, p.lab.exit.y))).toBe(true);
          for (const r of p.lab.rooms) expect(seen.has(r.cy * p.lab.w + r.cx)).toBe(true);
          for (const m of p.pop.monsters) expect(seen.has(at(m.x, m.y))).toBe(true);
          for (const c of p.pop.chests) expect(seen.has(at(c.x, c.y))).toBe(true);
          for (const w of p.lab.waypoints) expect(seen.has(at(w.x, w.y))).toBe(true);
        }
    });

    it(`${b.id}: the same seed makes the same map`, () => {
      const a = plan(b.id, 30, 5);
      const c = plan(b.id, 30, 5);
      expect(Array.from(a.lab.tiles)).toEqual(Array.from(c.lab.tiles));
      expect(a.pop.monsters.length).toBe(c.pop.monsters.length);
    });
  }

  it('a cave has no long straight wall, and a field is more open than a chain', () => {
    const open = (b: string) => {
      let sum = 0;
      for (let seed = 1; seed <= 10; seed++) {
        const p = plan(b, 40, seed);
        let floor = 0;
        for (const v of p.lab.tiles) floor += v;
        sum += floor / (p.lab.w * p.lab.h);
      }
      return sum / 10;
    };
    expect(open('hollow')).toBeGreaterThan(open('crypt'));
    // The longest run of floor along any row in a cave is far shorter than in a chain of rectangular rooms.
    const run = (b: string) => {
      let best = 0;
      for (let seed = 1; seed <= 10; seed++) {
        const { lab } = plan(b, 40, seed);
        for (let y = 0; y < lab.h; y++) {
          let n = 0;
          for (let x = 0; x < lab.w; x++) {
            n = lab.tiles[y * lab.w + x] === 1 ? n + 1 : 0;
            best = Math.max(best, n);
          }
        }
      }
      return best;
    };
    expect(run('cavern')).toBeLessThan(run('hollow'));
  });

  it('ruins have more than one way between some halls: a loop', () => {
    // A chain of n rooms has a spanning path; a loop adds an extra corridor, so the floor of ruins exceeds the chain's.
    let more = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const a = plan('ruins', 40, seed);
      const c = plan('crypt', 40, seed);
      const floor = (p: typeof a) => p.lab.tiles.reduce((n, v) => n + v, 0);
      if (floor(a) > floor(c)) more++;
    }
    expect(more).toBeGreaterThan(8);
  });

  it('every map type that pins a biome has a biome whose layout can be made', () => {
    for (const [type, id] of Object.entries(PINNED_BIOME)) {
      const p = plan(id!, 40, 3, type as MapTypeId);
      expect(p.lab.rooms.length).toBeGreaterThan(0);
    }
  });
});
