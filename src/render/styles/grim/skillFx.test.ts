import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, GRANTED_GEMS } from '../../../data/gems';
import { activeLook } from '../../../calc/skillLook';
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
const noop = new Proxy({}, { get: () => ({ explode: () => undefined }) });

function host(actors: Actor[]): FxHost {
  return {
    project: (x, y) => ({ x, y }),
    rpx: (r) => r * 10,
    squash: () => 0.5,
    em: noop as FxHost['em'],
    flash: () => undefined,
    shake: () => undefined,
    actorById: (id) => actors.find((a) => a.id === id) ?? null,
  };
}

const world = (a: Actor): World =>
  ({
    player: a,
    actors: [a],
    minions: [],
    zones: [],
    deployables: [],
    hexes: [],
    char: { auras: [], utilities: [] },
    buffT: {},
  }) as unknown as World;

function actor(over: Partial<Actor> = {}): Actor {
  return {
    id: 1,
    isPlayer: true,
    x: 5,
    y: 5,
    r: 0.4,
    facing: 0,
    alive: true,
    hexes: [],
    ...over,
  } as Actor;
}

const pending = (fx: SkillFx): number => (fx as unknown as { list: unknown[] }).list.length;

describe('skill effects', () => {
  it('every gem shows something when it is used or when its blow lands', () => {
    for (const g of [...ACTIVE_GEMS, ...GRANTED_GEMS]) {
      const look = activeLook(g);
      const skill = {
        name: g.name,
        type: g.skillType,
        tags: g.tags,
        behaviour: g.behaviour,
        utility: g.utility,
      };
      const a = actor({
        action: {
          profile: { skill, hands: [{ chunks: [{ max: 5, type: Math.max(0, look.element) }] }] },
          targetId: 2,
        },
      } as never);
      const target = actor({ id: 2, isPlayer: false, x: 7, y: 5 });
      const fx = new SkillFx(host([a, target]), scene);
      const w = world(a);
      const events: SimEvent[] = [{ t: 'use', src: 1, skill: g.id }];
      // Blows and blinks are drawn when they land, not while they wind up.
      if (look.delivery === 'swing')
        events.push({
          t: 'swing',
          src: 1,
          x: 5,
          y: 5,
          facing: 0,
          radius: 2,
          arc: 120,
          dtype: look.element,
          heavy: false,
        });
      if (look.delivery === 'strike')
        events.push({
          t: 'thrust',
          src: 1,
          x: 5,
          y: 5,
          x2: 7,
          y2: 5,
          dtype: look.element,
          heavy: false,
        });
      if (look.delivery === 'blink') {
        events.push(
          { t: 'blink', id: 1, x: 5, y: 5, end: false },
          { t: 'blink', id: 1, x: 9, y: 5, end: true },
        );
      }
      for (const e of events) fx.onEvent(e, w);
      expect(pending(fx), `${g.id} (${look.delivery})`).toBeGreaterThan(0);
      // And the effects draw and expire without throwing.
      fx.frame(w, 0.05, 1, gfx() as never);
      for (let i = 0; i < 20; i++) fx.frame(w, 0.1, 1 + i * 0.1, gfx() as never);
      expect(pending(fx)).toBe(0);
    }
  });

  it('areas that go off ring out in their element', () => {
    const a = actor();
    const fx = new SkillFx(host([a]), scene);
    for (let d = 0; d < 5; d++) fx.onEvent({ t: 'explode', x: 5, y: 5, r: 2, dtype: d }, world(a));
    expect(pending(fx)).toBeGreaterThanOrEqual(5);
  });
});
