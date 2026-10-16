import { describe, expect, it } from 'vitest';
import { MONSTER_TYPES, type MonsterTypeId } from '../../data/monsters';
import { buildFigure, poseFor, poseForType, type FigureKind } from './figure';

describe('the creature rigs (EXPANSION 7.3, docs/ROSTER.md 4.2)', () => {
  const kinds: FigureKind[] = [
    'gnawer',
    'bat',
    'beetle',
    'nest',
    'sentinel',
    'arbalest',
    'golem',
    'pylon',
    'bloat',
    'toad',
    'orb',
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

describe('kits and palettes (docs/ENEMIES.md section 6)', () => {
  const types = Object.keys(MONSTER_TYPES) as MonsterTypeId[];

  it('every monster type builds in every pose, with finite shapes', () => {
    for (const id of types) {
      const body = MONSTER_TYPES[id].body;
      for (const anim of ['idle', 'walk', 'attack', 'stun', 'death'] as const) {
        const prims = buildFigure(body, poseForType(id, anim, 0.4), id, 0.4);
        expect(prims.length, `${id} ${anim}`).toBeGreaterThan(4);
        for (const p of prims) {
          const nums =
            p.k === 'tri' ? p.pts : p.k === 'cap' ? [p.x1, p.y1, p.x2, p.y2, p.r] : [p.x, p.y];
          for (const n of nums) expect(Number.isFinite(n), `${id} ${anim}`).toBe(true);
        }
      }
    }
  });

  it('no two types share a silhouette', () => {
    const sig = (id: MonsterTypeId) => {
      const body = MONSTER_TYPES[id].body;
      return JSON.stringify(buildFigure(body, poseForType(id, 'idle', 0), id, 0));
    };
    const seen = new Map<string, MonsterTypeId>();
    for (const id of types) {
      const s = sig(id);
      expect(seen.get(s), `${id} looks like ${seen.get(s)}`).toBeUndefined();
      seen.set(s, id);
    }
  });
});
