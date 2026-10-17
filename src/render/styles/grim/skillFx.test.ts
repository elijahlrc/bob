import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, GRANTED_GEMS } from '../../../data/gems';
import { activeLook } from '../../../calc/skillLook';
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
    actors: [a],
    grid: { w: 20 },
    hexes: [],
    sides: [
      {
        player: a,
        char: { auras: [], utilities: [], actives: [] },
        buffT: {},
        minions: [],
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
    expect(pending(fx)).toBeGreaterThan(0);
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
    w.sides[0].fields = kinds.map((kind, i) => ({
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
    for (const f of w.sides[0].fields) f.t = 0.1;
    fx.frame(w, 0.05, 1.05, gfx() as never);
    for (const f of w.sides[0].fields) f.t = 3.95;
    fx.frame(w, 0.05, 1.1, gfx() as never);
  });

  it('a skill that puts something down shows it readied in the hand, not a cast rune', () => {
    const target = actor({ id: 2, isPlayer: false, x: 9, y: 5 });
    const skill = {
      id: 'jawsTrap',
      name: 'Jaws Trap',
      type: 'spell',
      tags: [],
      behaviour: { kind: 'burst', radius: 2 },
    };
    const a = actor({
      action: {
        profile: { skill, hands: [{ chunks: [{ max: 5, type: 2 }] }] },
        targetId: 2,
        duration: 1,
      },
    } as never);
    const w = world(a);
    (w.sides[0].char as unknown as { actives: unknown[] }).actives = [{ skill, deploy: 'trap' }];
    const fx = new SkillFx(host([a, target]), scene);
    fx.onEvent({ t: 'use', src: 1, skill: 'jawsTrap' }, w);
    // Two effects that last the wind-up (the thing in the hand, the ring on the target) and draw until the throw.
    expect(pending(fx)).toBe(2);
    fx.frame(w, 0.3, 1, gfx() as never);
    expect(pending(fx)).toBe(2);
    for (let i = 0; i < 4; i++) fx.frame(w, 0.1, 1.3 + i * 0.1, gfx() as never);
    expect(pending(fx)).toBe(0);
  });
});

describe('skill effects with two sides (a duel)', () => {
  /** A graphics object that counts the ellipses it is asked to fill (a minion stands on one). */
  const counting = (): { g: unknown; ellipses: () => number } => {
    let n = 0;
    const g: unknown = new Proxy(() => g, {
      get: (_t, k) =>
        k === 'fillEllipse'
          ? () => {
              n++;
              return g;
            }
          : k === 'destroy'
            ? () => undefined
            : () => g,
    });
    return { g, ellipses: () => n };
  };

  /** A world of two sides, each with a character and its own stub kit. */
  const duel = (a: Actor, b: Actor): World => {
    const w = world(a);
    const first = w.sides[0];
    first.char = { auras: [], utilities: [], actives: [], secondaries: [] } as never;
    const second = { ...first, id: 1, player: b, minions: [], deployables: [] };
    w.sides.push(second as never);
    w.actors.push(b);
    return w;
  };

  const minion = (id: number, x: number): Actor =>
    ({
      id,
      alive: true,
      x,
      y: 5,
      life: 10,
      def: { maxLife: 10 },
      kind: Object.keys(MINIONS)[0],
    }) as unknown as Actor;

  it('draws the minions of every side, not the first side’s alone', () => {
    const a = actor();
    const b = actor({ id: 3, x: 15 });
    const w = duel(a, b);
    const fx = new SkillFx(host([a, b]), scene);
    // (The other things a frame fills are the same in each frame, so the minions are the difference.)
    const none = counting();
    fx.frame(w, 0.05, 1, none.g as never);
    const one = counting();
    w.sides[0].minions = [minion(10, 6)] as never;
    fx.frame(w, 0.05, 1.05, one.g as never);
    expect(one.ellipses() - none.ellipses()).toBe(1);
    const two = counting();
    w.sides[1].minions = [minion(11, 14)] as never;
    fx.frame(w, 0.05, 1.1, two.g as never);
    expect(two.ellipses() - none.ellipses()).toBe(2);
  });

  it('a deployable is thrown from the character that put it down', () => {
    const a = actor();
    const b = actor({ id: 3, x: 15, y: 7 });
    const w = duel(a, b);
    const fx = new SkillFx(host([a, b]), scene);
    w.sides[1].deployables = [
      { id: 7, key: 'k', kind: 'trap', x: 12, y: 7, t: 5, fireT: 0 },
    ] as never;
    fx.onEvent({ t: 'deploy', id: 7, kind: 'trap', x: 12, y: 7, end: false }, w);
    const flights = (fx as unknown as { flights: Map<number, { fromX: number; fromY: number }> })
      .flights;
    expect([flights.get(7)!.fromX, flights.get(7)!.fromY]).toEqual([15, 7]);
    // One that no side holds any more is thrown from the first side's character, as before.
    fx.onEvent({ t: 'deploy', id: 8, kind: 'trap', x: 12, y: 7, end: false }, w);
    expect([flights.get(8)!.fromX, flights.get(8)!.fromY]).toEqual([5, 5]);
  });

  it('a summoned minion is found on whichever side has it', () => {
    const a = actor();
    const b = actor({ id: 3, x: 15 });
    const w = duel(a, b);
    const fx = new SkillFx(host([a, b]), scene);
    w.sides[1].minions = [minion(11, 14)] as never;
    fx.onEvent({ t: 'summon', id: 11 }, w);
    expect(pending(fx)).toBeGreaterThan(0);
    const n = pending(fx);
    fx.onEvent({ t: 'summon', id: 99 }, w);
    expect(pending(fx)).toBe(n);
  });

  it('the rival’s hexes show over it, the viewer’s own do not (they are chips on the HUD)', () => {
    const a = actor();
    const b = actor({ id: 3, x: 15 });
    (a as { side?: unknown }).side = { id: 0 };
    (b as { side?: unknown }).side = { id: 1 };
    const w = duel(a, b);
    // The sigils are drawn on the effects' own layer (`air`), which the scene stub hands out: it is the one that records.
    const rec: number[] = [];
    const g: unknown = new Proxy(() => g, {
      get: (_t, k) =>
        k === 'strokeEllipse'
          ? (x: number) => {
              rec.push(x);
              return g;
            }
          : () => g,
    });
    const fx = new SkillFx(host([a, b]), {
      add: { graphics: () => ({ setDepth: () => g }) },
    } as never);
    /** The x of every ellipse a frame strokes (the host projects a tile to itself). */
    const stroked = (): number[] => {
      rec.length = 0;
      fx.frame(w, 0.05, 1, g as never);
      return [...rec];
    };
    const base = stroked();
    a.hexes = [{ id: 'h' }] as never;
    b.hexes = [{ id: 'h' }] as never;
    const hexed = stroked();
    // One sigil, over the rival: the first side's own hex is not drawn.
    expect(hexed.length - base.length).toBe(1);
    expect(hexed.filter((x) => x === 15).length - base.filter((x) => x === 15).length).toBe(1);
    expect(hexed.filter((x) => x === 5).length).toBe(base.filter((x) => x === 5).length);
  });
});
