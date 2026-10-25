import { describe, expect, it } from 'vitest';
import type { Actor, SimEvent, World } from '../../../sim/types';
import { chainPoints, hookBarbs, MoveFx, pushArrows, type MoveHost } from './moveFx';

/** A graphics object that accepts every call (the effects only draw; nothing is read back). */
const gfx = (): unknown => {
  const g: unknown = new Proxy(() => g, {
    get: (_t, k) => (k === 'destroy' ? () => undefined : () => g),
  });
  return g;
};
const scene = { add: { graphics: () => ({ setDepth: () => gfx() }) } } as never;
const noop = new Proxy({}, { get: () => ({ explode: () => undefined }) });

function host(actors: Actor[]): MoveHost {
  return {
    project: (x, y) => ({ x, y }),
    rpx: (r) => r * 10,
    squash: () => 0.5,
    em: noop as MoveHost['em'],
    flash: () => undefined,
    shake: () => undefined,
    actorById: (id) => actors.find((a) => a.id === id) ?? null,
  };
}

const actor = (over: Partial<Actor> = {}): Actor =>
  ({
    id: 1,
    isPlayer: false,
    x: 5,
    y: 5,
    r: 0.5,
    facing: 0,
    alive: true,
    modIds: [],
    dash: { t: 0, windT: 0, v: 0, x: 0, y: 0 },
    ...over,
  }) as unknown as Actor;

const emptyWorld = { actors: [], effects: [], sides: [] } as unknown as World;
const pending = (fx: MoveFx): number => (fx as unknown as { list: unknown[] }).list.length;

describe('the geometry of a move', () => {
  it('a taut chain is a straight line, a slack one sags between its ends', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 100, y: 0 };
    const taut = chainPoints(a, b, 0);
    expect(taut).toHaveLength(11);
    for (const p of taut) expect(p.y).toBeCloseTo(0, 5);
    const slack = chainPoints(a, b, 0.5);
    expect(slack[0]).toEqual({ x: 0, y: 0 });
    expect(slack[10].y).toBeCloseTo(0, 5);
    expect(slack[5].y).toBeGreaterThan(5);
  });

  it('barbs sit on the lane from its first stride to its end, and trail along it', () => {
    const barbs = hookBarbs(0, 0, 6, 0);
    expect(barbs.length).toBeGreaterThan(2);
    expect(barbs[0].x).toBeCloseTo(1.2, 5);
    for (const b of barbs) {
      expect(b.y).toBeCloseTo(0, 5);
      expect(b.x).toBeLessThan(6);
      expect(b.ang).toBeCloseTo(0, 5);
    }
  });

  it('the arrows of a push stay inside the disc and point out from its middle', () => {
    for (const time of [0, 0.37, 1.9]) {
      const arrows = pushArrows(3, 4, 3, time);
      expect(arrows.length).toBe(16);
      for (const a of arrows) {
        const d = Math.hypot(a.x - 3, a.y - 4);
        expect(d).toBeLessThanOrEqual(3);
        expect(Math.atan2(a.y - 4, a.x - 3)).toBeCloseTo(
          Math.atan2(Math.sin(a.ang), Math.cos(a.ang)),
          5,
        );
      }
    }
    // They run outward as time passes.
    const r = (t: number) =>
      Math.hypot(pushArrows(0, 0, 3, t, 1, 1)[0].x, pushArrows(0, 0, 3, t, 1, 1)[0].y);
    expect(r(0.5)).toBeGreaterThan(r(0.2));
  });
});

describe('what a move leaves for the renderer to draw', () => {
  const player = actor({ id: 1, isPlayer: true, x: 5, y: 5 });
  const monster = actor({ id: 2, x: 9, y: 5 });

  it('a pull draws its chain and the trail of the character, and a push its ring and its trail', () => {
    const fx = new MoveFx(host([player, monster]), scene);
    const pull: SimEvent = { t: 'pull', src: 2, dst: 1, x: 5, y: 5, x2: 7, y2: 5, hx: 9, hy: 5 };
    fx.onEvent(pull, emptyWorld);
    expect(pending(fx)).toBe(2);
    const push: SimEvent = {
      t: 'push',
      src: 2,
      dst: 1,
      x: 5,
      y: 5,
      x2: 7,
      y2: 5,
      ox: 4,
      oy: 5,
      r: 3,
    };
    fx.onEvent(push, emptyWorld);
    expect(pending(fx)).toBe(4);
    // They draw while they last, and are gone after.
    fx.frame(emptyWorld, 0.1, 1, gfx() as never);
    expect(pending(fx)).toBe(4);
    fx.frame(emptyWorld, 1, 1, gfx() as never);
    expect(pending(fx)).toBe(0);
  });

  it('a charge is remembered from its event until its rush is over', () => {
    const rusher = actor({ id: 3, x: 5, y: 5, dash: { t: 0, windT: 0.5, v: 0, x: 9, y: 5 } });
    const fx = new MoveFx(host([player, rusher]), scene);
    const rushes = (fx as unknown as { rushes: Map<number, number> }).rushes;
    fx.onEvent({ t: 'rush', id: 3, seconds: 0.6 }, emptyWorld);
    expect(rushes.get(3)).toBe(0.6);
    const w = {
      actors: [player, rusher],
      effects: [],
      sides: [],
      grid: { collide: (x: number, y: number) => ({ x, y }) },
    } as unknown as World;
    // Winding up: the lane is drawn; running: the streak is; over: it is forgotten.
    fx.frame(w, 0.016, 1, gfx() as never);
    expect(rushes.has(3)).toBe(true);
    rusher.dash.windT = 0;
    rusher.dash.t = 0.3;
    fx.frame(w, 0.016, 1, gfx() as never);
    expect(rushes.has(3)).toBe(true);
    rusher.dash.t = 0;
    fx.frame(w, 0.016, 1, gfx() as never);
    expect(rushes.has(3)).toBe(false);
  });

  it('a charge whose monster has died is forgotten', () => {
    const rusher = actor({ id: 3, alive: false });
    const fx = new MoveFx(host([rusher]), scene);
    fx.onEvent({ t: 'rush', id: 3, seconds: 0.6 }, emptyWorld);
    fx.frame(emptyWorld, 0.016, 1, gfx() as never);
    expect((fx as unknown as { rushes: Map<number, number> }).rushes.size).toBe(0);
  });
});
