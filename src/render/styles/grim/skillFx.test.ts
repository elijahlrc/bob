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
    fields: [],
    grid: { w: 20 },
    hexes: [],
    char: { auras: [], utilities: [], actives: [] },
    vortex: null,
    stormOrb: null,
    markers: [],
    fuses: [],
    spores: [],
    mirage: null,
    charged: {},
    shell: null,
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

  it('every shape of area is outlined, drawn and gone again: circles, strips, beams, cries and rain', () => {
    const a = actor();
    const fx = new SkillFx(host([a]), scene);
    const w = world(a);
    const events: SimEvent[] = [
      { t: 'explode', x: 5, y: 5, r: 2, dtype: 3 },
      { t: 'explode', x: 6, y: 5, r: 1.5, dtype: 2, strip: [4, 5, 8, 5] },
      { t: 'explode', x: 5, y: 5, r: 3, dtype: 0, fall: 'arrow' },
      { t: 'explode', x: 5, y: 5, r: 3, dtype: 3, fall: 'bolt' },
      { t: 'beam', x: 5, y: 5, x2: 10, y2: 5, dtype: 1, width: 1.2 },
      { t: 'cry', x: 5, y: 5, r: 6 },
    ];
    for (const e of events) {
      const before = pending(fx);
      fx.onEvent(e, w);
      expect(pending(fx), e.t).toBeGreaterThan(before);
    }
    // A spark is not an area, and a bolt that strikes a point (no width) has none either.
    const n = pending(fx);
    fx.onEvent({ t: 'beam', x: 5, y: 2, x2: 5, y2: 5, dtype: 1 }, w);
    expect(pending(fx)).toBe(n);
    for (let i = 0; i < 40; i++) fx.frame(w, 0.05, 1 + i * 0.05, gfx() as never);
    expect(pending(fx)).toBe(0);
  });

  it('areas that go off ring out in their element', () => {
    const a = actor();
    const fx = new SkillFx(host([a]), scene);
    for (let d = 0; d < 5; d++) fx.onEvent({ t: 'explode', x: 5, y: 5, r: 2, dtype: d }, world(a));
    expect(pending(fx)).toBeGreaterThanOrEqual(5);
  });

  it('a trap or a mine is thrown and lands; a totem comes down; neither is a cast', () => {
    const a = actor();
    const fx = new SkillFx(host([a]), scene);
    const w = world(a);
    fx.onEvent({ t: 'deploy', id: 7, kind: 'trap', x: 9, y: 5, end: false }, w);
    const flights = () => (fx as unknown as { flights: Map<number, unknown> }).flights;
    expect(flights().size).toBe(1);
    // The thing is in the air for a moment, then lands and the flight is over.
    fx.frame(w, 0.1, 1, gfx() as never);
    expect(flights().size).toBe(1);
    for (let i = 0; i < 4; i++) fx.frame(w, 0.1, 1.1 + i * 0.1, gfx() as never);
    expect(flights().size).toBe(0);
    // One that ends while still in the air (it sprang at once) is gone, not landing.
    fx.onEvent({ t: 'deploy', id: 8, kind: 'mine', x: 9, y: 5, end: false }, w);
    expect(flights().size).toBe(1);
    fx.onEvent({ t: 'deploy', id: 8, kind: 'mine', x: 9, y: 5, end: true }, w);
    expect(flights().size).toBe(0);
    // A shot fired by a deployable is not the character casting.
    const n = pending(fx);
    fx.onEvent({ t: 'use', src: 1, skill: 'jawsTrap', via: 'deployed' }, w);
    expect(pending(fx)).toBe(n);
  });

  it('a trap that springs bursts and runs a line to its target', () => {
    const a = actor();
    const fx = new SkillFx(host([a]), scene);
    const w = world(a);
    fx.onEvent({ t: 'sprung', id: 7, kind: 'trap', x: 9, y: 5, tx: 11, ty: 5 }, w);
    expect(pending(fx)).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < 20; i++) fx.frame(w, 0.05, 1 + i * 0.05, gfx() as never);
    expect(pending(fx)).toBe(0);
  });

  it('every kind of lasting field is drawn without error, and a wall is drawn tile by tile', () => {
    const a = actor();
    const fx = new SkillFx(host([a]), scene);
    const w = world(a);
    const kinds = [
      'consecrated',
      'chilling',
      'caustic',
      'pod',
      'crystal',
      'storm',
      'wall',
      'orb',
      'zap',
      'trail',
      'ghost',
      'bladestorm',
      'geyser',
      'smoke',
    ];
    w.fields = kinds.map((kind, i) => ({
      id: i,
      owner: 1,
      kind,
      x: 6 + i,
      y: 5,
      x2: 8 + i,
      y2: 6,
      r0: 1.5,
      grow: 1,
      radius: 1.5,
      t: 2,
      total: 4,
      hand: 0,
      pulseT: 0,
      interval: 1,
      dps: 0,
      dtype: i % 5,
      tiles: [45, 46, 66],
      stages: 3,
    })) as never;
    fx.frame(w, 0.05, 1, gfx() as never);
    // A field that is nearly gone (fading) and one just made (rising) draw too.
    for (const f of w.fields) f.t = 0.1;
    fx.frame(w, 0.05, 1.05, gfx() as never);
    for (const f of w.fields) f.t = 3.95;
    fx.frame(w, 0.05, 1.1, gfx() as never);
  });
});
