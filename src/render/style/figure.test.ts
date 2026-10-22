import { describe, expect, it } from 'vitest';
import { itemBase } from '../../data/bases';
import { classDef } from '../../data/classes';
import { newRun } from '../../run/run';
import { TOLL_TELL } from '../../data/bosses';
import { bossState, initBoss } from '../../sim/bosses';
import { createDuelWorld } from '../../sim/duel';
import { AnimTrack } from './anim';
import {
  buildFigure,
  heroFigure,
  poseFor,
  poseForType,
  type AnimName,
  type FigureKind,
} from './figure';
import type { Actor, World } from '../../sim/types';
import { figureOf, heroColor, isViewer } from './who';

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
const ANIMS: AnimName[] = ['idle', 'walk', 'attack', 'stun', 'death', 'windup', 'release'];

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

  it('walk cycles loop', () => {
    const w0 = poseFor('warrior', 'walk', 0);
    const w1 = poseFor('warrior', 'walk', 1);
    expect(w0.legA).toBeCloseTo(w1.legA, 5);
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

describe("the Tollkeeper's toll (a boss whose body shows its big move)", () => {
  /** The highest point of the Tollkeeper's figure in a pose (y grows downward). */
  const top = (anim: AnimName, t: number) =>
    Math.min(
      ...buildFigure('tollkeeper', poseForType('tollkeeper', anim, t), 'tollkeeper', t).map((p) =>
        p.k === 'circ'
          ? p.y - p.r
          : p.k === 'cap'
            ? Math.min(p.y1, p.y2) - p.r
            : p.k === 'box'
              ? p.y - p.h / 2
              : Math.min(p.pts[1], p.pts[3], p.pts[5]),
      ),
    );

  it('hoists its bell through the tell, and brings it down when the bell tolls', () => {
    const a = {
      x: 5,
      y: 5,
      alive: true,
      action: null,
      stunT: 0,
      facing: 0,
      ail: { freezeT: 0 },
      life: 100,
      def: { maxLife: 100 },
      mon: { spec: { type: 'tollkeeper' } },
    } as unknown as Actor;
    initBoss({} as World, a);
    const st = bossState(a)!;
    const t = new AnimTrack();
    t.update(a, 1 / 60);
    expect(t.state(a).anim).toBe('idle');
    st.tellT = TOLL_TELL / 4;
    expect(t.state(a)).toEqual({ anim: 'windup', t: 0.75 });
    st.tellT = 0;
    st.tolls = 1;
    t.update(a, 0.35);
    expect(t.state(a)).toEqual({ anim: 'release', t: 0.5 });
    t.update(a, 0.4);
    expect(t.state(a).anim).toBe('idle');
    // High over its head at the top of the tell; down on the floor when it lands.
    expect(top('windup', 1)).toBeLessThan(top('idle', 0) - 20);
    expect(top('release', 0.4)).toBeGreaterThan(top('windup', 1) + 20);
  });
});

describe('who a character is drawn as (a duel has two)', () => {
  const weaponFigure = (b: ReturnType<typeof newRun>['build']): FigureKind => {
    const mh = b.equipment.mainHand;
    return heroFigure(mh ? itemBase(mh.baseId).itemClass : undefined);
  };

  it('each character is its own side’s class: its figure by its weapon, its colour by its class', () => {
    const a = newRun('vanguard', 1).build;
    const b = newRun('strider', 2).build;
    const w = createDuelWorld(a, b, 1);
    const [sa, sb] = w.sides;
    expect(figureOf(w, sa.player)).toBe(weaponFigure(a));
    expect(figureOf(w, sb.player)).toBe(weaponFigure(b));
    expect(figureOf(w, sb.player)).not.toBe(figureOf(w, sa.player));
    expect(heroColor(w, sa.player)).toBe(classDef('vanguard').color);
    expect(heroColor(w, sb.player)).toBe(classDef('strider').color);
    expect(heroColor(w, sb.player)).not.toBe(heroColor(w, sa.player));
  });

  it('only side 0’s character is the viewer’s; an actor that names no side counts as side 0’s', () => {
    const w = createDuelWorld(newRun('vanguard', 1).build, newRun('vanguard', 2).build, 1);
    expect(isViewer(w.sides[0].player)).toBe(true);
    expect(isViewer(w.sides[1].player)).toBe(false);
    expect(isViewer({ isPlayer: true } as Actor)).toBe(true);
    expect(isViewer({ isPlayer: false, side: null } as unknown as Actor)).toBe(false);
  });
});
