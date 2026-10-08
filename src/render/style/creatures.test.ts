import { describe, expect, it } from 'vitest';
import {
  MONSTER_TYPES,
  FACTION_NAMES,
  bodyStyleOf,
  leavesBody,
  type FactionId,
  type MonsterTypeId,
} from '../../data/monsters';
import { pairScores } from './silhouette';
import { monsterPalette } from '../styles/grim/paint';
import { buildFigure, poseFor, poseForType, stanceFor, type FigureKind } from './figure';

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

  it('a kit leaves the plain body alone: the Ossuary warrior is the bare skeleton', () => {
    const plain = JSON.stringify(buildFigure('warrior', poseFor('warrior', 'idle', 0)));
    const warrior = JSON.stringify(
      buildFigure('warrior', poseFor('warrior', 'idle', 0), 'warrior'),
    );
    expect(warrior).toBe(plain);
  });

  it('every faction has a palette of its own, and an element is an accent that does not hide it', () => {
    const factions = Object.keys(FACTION_NAMES) as FactionId[];
    const pals = factions.map((f) =>
      JSON.stringify(monsterPalette({ faction: f, variant: 'none' })),
    );
    expect(new Set(pals).size).toBe(factions.length);
    for (const f of factions) {
      const none = monsterPalette({ faction: f, variant: 'none' });
      const fire = monsterPalette({ faction: f, variant: 'fire' });
      const cold = monsterPalette({ faction: f, variant: 'cold' });
      expect(fire.eye).not.toEqual(none.eye);
      expect(fire.eye).not.toEqual(cold.eye);
      // The body is still the faction's: close to its own colour, far from another faction's.
      const d = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      expect(d(fire.bone, none.bone)).toBeLessThan(
        d(
          fire.bone,
          monsterPalette({ faction: f === 'rot' ? 'choir' : 'rot', variant: 'none' }).bone,
        ),
      );
    }
  });
});

describe('body styles (docs/ROSTER.md 4.1)', () => {
  const types = Object.keys(MONSTER_TYPES) as MonsterTypeId[];
  const humanoid = (id: MonsterTypeId) =>
    ['warrior', 'brute', 'archer', 'mage'].includes(MONSTER_TYPES[id].body);

  it('bone is the Ossuary alone: every other person is flesh or spectre', () => {
    for (const id of types.filter(humanoid)) {
      const style = bodyStyleOf(id);
      if (MONSTER_TYPES[id].faction === 'ossuary') expect(style, id).toBe('bone');
      else expect(style, `${id} is on a skeleton`).not.toBe('bone');
    }
    expect(bodyStyleOf(undefined)).toBe('bone');
  });

  it('the Hollow are spectres, with no legs: their figure has nothing below the hip but a tail', () => {
    for (const id of ['gloomstalker', 'wailer', 'wight'] as const) {
      expect(bodyStyleOf(id)).toBe('spectre');
      const body = MONSTER_TYPES[id].body;
      const walk = (t: number) =>
        JSON.stringify(buildFigure(body, poseForType(id, 'walk', t), id, t));
      // The legs do not swing (a body with legs would differ between these two strides in its feet).
      const a = poseForType(id, 'walk', 0.25);
      expect(a.legB).toBe(0);
      expect(walk(0.1)).not.toBe(walk(0.35));
    }
  });

  it('a flesh body falls and stays; a spectre unravels', () => {
    const flesh = poseForType('hexer', 'death', 1);
    expect(flesh.scatter).toBe(0);
    expect(flesh.fade).toBe(0);
    const bone = poseFor('warrior', 'death', 1);
    expect(bone.scatter).toBeGreaterThan(0.9);
    const spectre = poseForType('wailer', 'death', 1);
    expect(spectre.fade).toBeGreaterThan(0.9);
    const size = (p: ReturnType<typeof poseForType>) =>
      buildFigure('mage', p, 'wailer', 1).reduce((s, q) => s + (q.k === 'circ' ? q.r : 0), 0);
    expect(size(spectre)).toBeLessThan(size(poseForType('wailer', 'idle', 0)) * 0.5);
  });

  it('a type may throw: the arm goes back and up, then over', () => {
    const wind = poseFor('archer', 'attack', 0.35, 'throw', 'flesh');
    const strike = poseFor('archer', 'attack', 0.55, 'throw', 'flesh');
    expect(wind.armA).toBeLessThan(-1.5);
    expect(strike.armA).toBeGreaterThan(1);
    expect(stanceFor('spitter', 'archer')).toBe('throw');
    expect(stanceFor('archer', 'archer')).toBe('bow');
  });

  it('only a body that leaves a body behind can be raised or rise again', () => {
    expect(leavesBody('warrior')).toBe(true);
    expect(leavesBody('hexer')).toBe(true);
    for (const id of ['gloomstalker', 'wailer', 'wight', 'wisp'] as const)
      expect(leavesBody(id), id).toBe(false);
  });

  it('silhouettes differ: no two types of different factions are near twins, and none in a faction are', () => {
    // These limits tighten as the milestones of docs/ROSTER.md land (to 0.75 and 0.85 in the end).
    const pairs = pairScores();
    for (const p of pairs) {
      const limit = p.sameFaction ? 0.9 : 0.85;
      expect(p.sim, `${p.a} and ${p.b} are too much alike`).toBeLessThan(limit);
    }
  });
});
