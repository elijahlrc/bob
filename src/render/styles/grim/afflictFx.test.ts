import { describe, expect, it } from 'vitest';
import { MINIONS } from '../../../data/minions';
import type { Actor, SimEvent, World } from '../../../sim/types';
import { SkillFx, type FxHost } from './skillFx';

/** A graphics object that accepts every call (the effects only draw; nothing is read back). */
const gfx = (): unknown => {
  const g: unknown = new Proxy(() => g, {
    get: (_t, k) => (k === 'destroy' ? () => undefined : () => g),
  });
  return g;
};
const scene = { add: { graphics: () => ({ setDepth: () => gfx() }) } } as never;

/** Particle emitters that count what they are asked to throw. */
const thrown: Record<string, number> = {};
const em = new Proxy(
  {},
  {
    get: (_t, name: string) => ({
      explode: (n: number) => (thrown[name] = (thrown[name] ?? 0) + n),
    }),
  },
);

function host(actors: Actor[]): FxHost {
  return {
    project: (x, y) => ({ x, y }),
    rpx: (r) => r * 10,
    squash: () => 0.5,
    em: em as FxHost['em'],
    flash: () => undefined,
    shake: () => undefined,
    actorById: (id) => actors.find((a) => a.id === id) ?? null,
  };
}

function actor(id: number, over: Partial<Actor> = {}): Actor {
  return {
    id,
    isPlayer: false,
    x: 5 + id,
    y: 5,
    r: 0.4,
    facing: 0,
    alive: true,
    rarity: 'normal',
    hexes: [],
    ...over,
  } as Actor;
}

const world = (actors: Actor[], minions: Actor[] = []): World =>
  ({
    actors,
    grid: { w: 20 },
    hexes: [],
    sides: [
      {
        player: actors[0],
        char: { auras: [], utilities: [], actives: [] },
        buffT: {},
        minions,
        zones: [],
        deployables: [],
        fields: [],
        vortex: null,
        stormOrb: null,
        markers: [],
        fuses: [],
        spores: [],
        mirage: null,
        charged: {},
        shell: null,
        channel: null,
      },
    ],
  }) as unknown as World;

const pending = (fx: SkillFx): number => (fx as unknown as { list: unknown[] }).list.length;

/** Play the effect out: it draws, then it is gone. */
function playOut(fx: SkillFx, w: World): void {
  for (let i = 0; i < 40; i++) fx.frame(w, 0.05, 1 + i * 0.05, gfx() as never);
  expect(pending(fx)).toBe(0);
}

const events: Record<string, SimEvent[]> = {
  'a spear driven in': [{ t: 'impale', dst: 2, kind: 'stuck', n: 2 }],
  'impales paid out': [{ t: 'impale', dst: 2, kind: 'paid', n: 3 }],
  'a frozen body shattered': [{ t: 'shatter', id: 2 }],
  'an ignite passed on': [{ t: 'spread', from: 2, to: 3, kind: 'ignite', dtype: 3 }],
  'a shock passed on': [{ t: 'spread', from: 2, to: 3, kind: 'shock', dtype: 1 }],
  'a chill passed on': [{ t: 'spread', from: 2, to: 3, kind: 'chill', dtype: 2 }],
  'a debuff passed on': [{ t: 'spread', from: 3, to: 2, kind: 'dot', dtype: 4 }],
  'a kill that sets its neighbours burning': [{ t: 'kindle', x: 6, y: 5, r: 2.5, n: 2 }],
};

describe('what was done to an enemy, at the moment it happens', () => {
  for (const [name, es] of Object.entries(events))
    it(`${name} shows, and is gone again`, () => {
      const actors = [actor(1, { isPlayer: true }), actor(2), actor(3)];
      const fx = new SkillFx(host(actors), scene);
      const w = world(actors);
      for (const e of es) fx.onEvent(e, w);
      expect(pending(fx), name).toBeGreaterThan(0);
      playOut(fx, w);
    });

  it('a kill that burned no one shows nothing', () => {
    const actors = [actor(1, { isPlayer: true })];
    const fx = new SkillFx(host(actors), scene);
    fx.onEvent({ t: 'kindle', x: 6, y: 5, r: 2.5, n: 0 }, world(actors));
    expect(pending(fx)).toBe(0);
  });

  it('a link from or to an enemy that is gone is skipped, not drawn from nowhere', () => {
    const actors = [actor(1, { isPlayer: true }), actor(2)];
    const fx = new SkillFx(host(actors), scene);
    fx.onEvent({ t: 'spread', from: 2, to: 99, kind: 'ignite', dtype: 3 }, world(actors));
    fx.onEvent({ t: 'impale', dst: 99, kind: 'paid', n: 1 }, world(actors));
    fx.onEvent({ t: 'shatter', id: 99 }, world(actors));
    expect(pending(fx)).toBe(0);
  });

  it('a shatter throws ice, a spread link throws the particles of its element, a payout bones', () => {
    for (const k of Object.keys(thrown)) delete thrown[k];
    const actors = [actor(1, { isPlayer: true }), actor(2), actor(3)];
    const fx = new SkillFx(host(actors), scene);
    const w = world(actors);
    fx.onEvent({ t: 'shatter', id: 2 }, w);
    expect(thrown.ice).toBeGreaterThan(0);
    fx.onEvent({ t: 'spread', from: 2, to: 3, kind: 'ignite', dtype: 3 }, w);
    expect(thrown.flame).toBeGreaterThan(0);
    fx.onEvent({ t: 'impale', dst: 2, kind: 'paid', n: 2 }, w);
    expect(thrown.bone).toBeGreaterThan(0);
  });
});

describe('a burning pack', () => {
  const minion = (id: number, burn: number): Actor =>
    ({
      ...actor(id),
      kind: Object.keys(MINIONS)[0],
      life: 10,
      def: { maxLife: 10 },
      sup: { burn, selfBurn: burn },
    }) as unknown as Actor;

  it('draws flames on a minion that burns and nothing extra on one that does not', () => {
    const calls = (burn: number): number => {
      const counted = { n: 0 };
      const g: unknown = new Proxy(() => g, {
        get: () => () => ((counted.n += 1), g),
      });
      const actors = [actor(1, { isPlayer: true })];
      const fx = new SkillFx(host(actors), scene);
      // The frame draws the burning minions' flames on the layers it is given and the one it makes: count on the ground given.
      fx.frame(world(actors, [minion(7, burn)]), 0.05, 1, g as never);
      return counted.n;
    };
    expect(calls(5)).toBeGreaterThan(calls(0));
  });
});
