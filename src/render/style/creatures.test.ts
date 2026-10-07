import { describe, expect, it } from 'vitest';
import { buildFigure, poseFor, type FigureKind } from './figure';

describe('the creature rigs of the Swarm and the Reliquary (EXPANSION 7.3)', () => {
  const kinds: FigureKind[] = [
    'gnawer',
    'bat',
    'beetle',
    'nest',
    'sentinel',
    'arbalest',
    'golem',
    'pylon',
  ];

  it('every rig builds in every pose, with finite shapes', () => {
    for (const k of kinds)
      for (const anim of ['idle', 'walk', 'attack', 'stun', 'death'] as const) {
        const prims = buildFigure(k, poseFor(k, anim, 0.4));
        expect(prims.length, `${k} ${anim}`).toBeGreaterThan(4);
        for (const p of prims) {
          const nums =
            p.k === 'tri' ? p.pts : p.k === 'cap' ? [p.x1, p.y1, p.x2, p.y2, p.r] : [p.x, p.y];
          for (const n of nums) expect(Number.isFinite(n)).toBe(true);
        }
      }
  });

  it('the rigs differ from one another and move between poses', () => {
    const sig = (k: FigureKind) => JSON.stringify(buildFigure(k, poseFor(k, 'idle', 0)));
    expect(new Set(kinds.map(sig)).size).toBe(kinds.length);
    const walk = (t: number) => JSON.stringify(buildFigure('gnawer', poseFor('gnawer', 'walk', t)));
    expect(walk(0.1)).not.toBe(walk(0.35));
  });
});
