import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { MAP_MAX } from '../data/constants';
import { FLOOR, generateLabyrinth, isFloor, type Labyrinth } from './labyrinth';

function floodFrom(lab: Labyrinth, sx: number, sy: number): Uint8Array {
  const seen = new Uint8Array(lab.w * lab.h);
  const stack = [sy * lab.w + sx];
  seen[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % lab.w;
    const y = Math.floor(i / lab.w);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (!isFloor(lab, nx, ny)) continue;
      const j = ny * lab.w + nx;
      if (!seen[j]) {
        seen[j] = 1;
        stack.push(j);
      }
    }
  }
  return seen;
}

describe('labyrinth (DESIGN.md §10.2)', () => {
  for (let rooms = 4; rooms <= 8; rooms++) {
    it(`meets every invariant over 200 seeds with ${rooms} rooms`, () => {
      for (let seed = 0; seed < 200; seed++) {
        const lab = generateLabyrinth(new Rng(`lab-${rooms}-${seed}`), {
          rooms,
          sideBranches: seed % 3,
        });
        // Fits in 160×160.
        expect(lab.w).toBeLessThanOrEqual(MAP_MAX);
        expect(lab.h).toBeLessThanOrEqual(MAP_MAX);
        // Main path length and end room last.
        expect(lab.mainPath.length).toBe(rooms);
        const end = lab.rooms[lab.mainPath[lab.mainPath.length - 1]];
        expect(end.kind).toBe('end');
        expect(end.rect.w).toBeGreaterThanOrEqual(10);
        expect(end.rect.h).toBeGreaterThanOrEqual(10);
        // No rooms overlap.
        for (const a of lab.rooms)
          for (const b of lab.rooms) {
            if (a.id >= b.id) continue;
            const overlap =
              a.rect.x < b.rect.x + b.rect.w &&
              b.rect.x < a.rect.x + a.rect.w &&
              a.rect.y < b.rect.y + b.rect.h &&
              b.rect.y < a.rect.y + a.rect.h;
            expect(overlap).toBe(false);
          }
        // All floor connected and exit reachable from start.
        const sx = Math.floor(lab.start.x);
        const sy = Math.floor(lab.start.y);
        expect(isFloor(lab, sx, sy)).toBe(true);
        const seen = floodFrom(lab, sx, sy);
        for (let i = 0; i < lab.tiles.length; i++)
          if (lab.tiles[i] === FLOOR) expect(seen[i]).toBe(1);
        expect(seen[Math.floor(lab.exit.y) * lab.w + Math.floor(lab.exit.x)]).toBe(1);
        // Every waypoint is on the floor.
        for (const wp of lab.waypoints)
          expect(isFloor(lab, Math.floor(wp.x), Math.floor(wp.y))).toBe(true);
      }
    });
  }

  it('is deterministic for a seed', () => {
    const a = generateLabyrinth(new Rng(77), { rooms: 6, sideBranches: 2 });
    const b = generateLabyrinth(new Rng(77), { rooms: 6, sideBranches: 2 });
    expect(Array.from(a.tiles)).toEqual(Array.from(b.tiles));
    expect(a.waypoints).toEqual(b.waypoints);
  });

  it('puts chests at the end of side branches', () => {
    let chests = 0;
    for (let s = 0; s < 20; s++) {
      const lab = generateLabyrinth(new Rng(s), { rooms: 6, sideBranches: 2 });
      chests += lab.rooms.filter((r) => r.chest).length;
      for (const r of lab.rooms) if (r.chest) expect(r.kind).toBe('side');
    }
    expect(chests).toBeGreaterThan(20);
  });
});
