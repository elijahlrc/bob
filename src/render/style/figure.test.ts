import { describe, expect, it } from 'vitest';
import { AnimTrack } from './anim';
import {
  buildFigure,
  heroFigure,
  isRanged,
  poseFor,
  type AnimName,
  type FigureKind,
} from './figure';
import type { Actor } from '../../sim/types';

const KINDS: FigureKind[] = [
  'warrior',
  'brute',
  'archer',
  'mage',
  'boss',
  'hero_mace',
  'hero_sword',
  'hero_bow',
  'hero_wand',
  'hero_dagger',
];
const ANIMS: AnimName[] = ['idle', 'walk', 'attack', 'stun', 'death'];

describe('figure rig (shared by all visual styles)', () => {
  it('builds finite primitives for every kind, animation and time', () => {
    for (const kind of KINDS)
      for (const anim of ANIMS)
        for (const t of [0, 0.25, 0.5, 0.75, 1]) {
          const prims = buildFigure(kind, poseFor(kind, anim, t));
          expect(prims.length).toBeGreaterThan(12);
          for (const p of prims) {
            const nums =
              p.k === 'circ'
                ? [p.x, p.y, p.r]
                : p.k === 'cap'
                  ? [p.x1, p.y1, p.x2, p.y2, p.r]
                  : p.k === 'box'
                    ? [p.x, p.y, p.w, p.h, p.rot]
                    : p.pts;
            for (const n of nums) expect(Number.isFinite(n)).toBe(true);
          }
        }
  });

  it('is deterministic', () => {
    const a = buildFigure('warrior', poseFor('warrior', 'walk', 0.3));
    const b = buildFigure('warrior', poseFor('warrior', 'walk', 0.3));
    expect(a).toEqual(b);
  });

  it('walk cycles loop, attacks have anticipation then a strike, death collapses', () => {
    const w0 = poseFor('warrior', 'walk', 0);
    const w1 = poseFor('warrior', 'walk', 1);
    expect(w0.legA).toBeCloseTo(w1.legA, 5);
    const wind = poseFor('hero_mace', 'attack', 0.35);
    const strike = poseFor('hero_mace', 'attack', 0.55);
    expect(wind.armA).toBeLessThan(0);
    expect(strike.armA).toBeGreaterThan(0);
    expect(strike.lean).toBeGreaterThan(wind.lean);
    const d0 = poseFor('warrior', 'death', 0);
    const d1 = poseFor('warrior', 'death', 1);
    expect(Math.abs(d0.rot)).toBe(0);
    expect(Math.abs(d1.rot)).toBeGreaterThan(1.2);
    expect(d1.scatter).toBeGreaterThan(0.9);
  });

  it('ranged figures draw a bow; casters glow while charging', () => {
    expect(isRanged('archer')).toBe(true);
    expect(isRanged('warrior')).toBe(false);
    expect(poseFor('hero_bow', 'attack', 0.3).charge).toBeGreaterThan(0.3);
    expect(poseFor('mage', 'attack', 0.35).charge).toBeGreaterThan(0.5);
  });

  it('picks hero figures by weapon class', () => {
    expect(heroFigure('mace2')).toBe('hero_mace');
    expect(heroFigure('bow')).toBe('hero_bow');
    expect(heroFigure('wand')).toBe('hero_wand');
    expect(heroFigure('dagger')).toBe('hero_dagger');
    expect(heroFigure('sword')).toBe('hero_sword');
    expect(heroFigure(undefined)).toBe('hero_sword');
  });
});

describe('animation tracking', () => {
  const actor = (over: Partial<Actor> = {}): Actor =>
    ({
      x: 5,
      y: 5,
      alive: true,
      action: null,
      stunT: 0,
      facing: 0,
      ail: { freezeT: 0 },
      ...over,
    }) as unknown as Actor;

  it('derives idle, walk, attack, stun and death states', () => {
    const t = new AnimTrack();
    const a = actor();
    t.update(a, 1 / 60);
    expect(t.state(a).anim).toBe('idle');
    for (let i = 0; i < 20; i++) {
      a.x += 0.07;
      t.update(a, 1 / 60);
    }
    expect(t.state(a).anim).toBe('walk');
    expect(t.face).toBe(1);
    // A one-frame wobble the other way must not flip the sprite...
    a.x -= 0.02;
    t.update(a, 1 / 60);
    expect(t.face).toBe(1);
    // ...but sustained leftward motion turns it around.
    for (let i = 0; i < 30; i++) {
      a.x -= 0.07;
      t.update(a, 1 / 60);
    }
    expect(t.face).toBe(-1);
    a.action = { elapsed: 0.3, duration: 0.6, profile: { repeats: 0 } } as never;
    expect(t.state(a)).toEqual({ anim: 'attack', t: 0.5 });
    a.action = null;
    a.stunT = 0.3;
    expect(t.state(a).anim).toBe('stun');
    a.alive = false;
    t.update(a, 0.35);
    expect(t.state(a)).toEqual({ anim: 'death', t: 0.5 });
  });
});

describe('the attack animation of a repeating skill (Echoing Cast)', () => {
  it('winds up and strikes again for each echo, landing when the sim fires it', () => {
    const t = new AnimTrack();
    const a = {
      x: 5,
      y: 5,
      alive: true,
      action: null,
      stunT: 0,
      facing: 0,
      ail: { freezeT: 0 },
    } as unknown as Actor;
    t.update(a, 1 / 60);
    const at = (u: number) => {
      a.action = { elapsed: u, duration: 1, profile: { repeats: 1 }, which: 'primary' } as never;
      return t.state(a).t;
    };
    expect(at(0.3)).toBeCloseTo(0.3, 6);
    // Just after the first strike the figure is back at the wind-up...
    expect(at(0.61)).toBeLessThan(0.3);
    // ...and strikes again where the sim fires the echo (0.6 + 0.25 of the use time).
    expect(at(0.849)).toBeGreaterThan(0.5);
    expect(at(0.849)).toBeLessThan(0.6);
    // Then it recovers.
    expect(at(0.95)).toBeGreaterThan(0.6);
    a.action = { elapsed: 0.3, duration: 1, profile: { repeats: 0 }, which: 'primary' } as never;
    expect(t.state(a).t).toBeCloseTo(0.3, 6);
  });
});
