import { describe, expect, it } from 'vitest';
import { RIME_AURA_RANGE } from '../../../data/abilities';
import type { Actor, SimEvent, World } from '../../../sim/types';
import { shownMaxEs, statePips } from '../../style/stateMarks';
import { HEX_TINT, hexGlyph, MonsterStateFx, stateSprite } from './monsterStateFx';
import type { FxHost } from './skillFx';

/** A graphics object that accepts every call and counts them. */
function gfx() {
  const calls = { n: 0 };
  const g: unknown = new Proxy(() => g, {
    get: (_t, k) => (k === 'calls' ? calls : () => ((calls.n += 1), g)),
  });
  return g as { calls: { n: number } };
}

const noop = new Proxy({}, { get: () => ({ explode: () => undefined }) });

function setup(actors: Actor[]) {
  const air = gfx();
  const ground = gfx();
  const scene = {
    add: { graphics: () => ({ setDepth: () => ({ setBlendMode: () => air }) }) },
  } as never;
  const flashes: unknown[] = [];
  const said: string[] = [];
  const player = actor({ id: 1, isPlayer: true, x: 0, y: 0 });
  const host: FxHost = {
    project: (x, y) => ({ x: x * 10, y: y * 5 }),
    rpx: (r) => r * 10,
    squash: () => 0.5,
    em: noop as FxHost['em'],
    flash: (...a) => void flashes.push(a),
    shake: () => undefined,
    actorById: (id) => (id === player.id ? player : (actors.find((a) => a.id === id) ?? null)),
    floater: (_x, _y, text) => void said.push(text),
  };
  const fx = new MonsterStateFx(host, scene);
  const world = (): World =>
    ({
      actors: [player, ...actors],
      sides: [{ player }],
      hasPylons: actors.some((a) => a.mon?.spec.type === 'pylon'),
    }) as unknown as World;
  /** Draw one frame; returns how many drawing calls the ground and the air layers made. */
  const frame = (dt = 0.016): { ground: number; air: number } => {
    const g0 = ground.calls.n;
    const a0 = air.calls.n;
    fx.frame(world(), dt, 1.3, ground as never);
    // The air layer clears itself first: that call is not a drawing.
    return { ground: ground.calls.n - g0, air: air.calls.n - a0 - 1 };
  };
  return { fx, player, frame, flashes, said, world };
}

let nextId = 10;
function actor(over: Partial<Actor> & { type?: string } = {}): Actor {
  const { type, ...rest } = over;
  const a = {
    id: nextId++,
    isPlayer: false,
    x: 4,
    y: 0,
    r: 0.45,
    facing: 0,
    alive: true,
    life: 100,
    es: 0,
    def: { maxLife: 100, maxEs: 0, immune: [false, false, false, false, false] },
    state: 'chase',
    modIds: [],
    mon: type ? { spec: { type } } : { spec: { type: 'warrior' } },
    choir: { buffT: 0, zealT: 0, fervour: 0, fervourT: 0 },
    mirror: { id: 0, t: 0 },
    shellBy: 0,
    curlT: 0,
    channelT: 0,
    suppressT: 0,
    leech: { life: [], es: [], mana: [] },
    ...rest,
  };
  return a as unknown as Actor;
}

const none = { ground: 0, air: 0 };
const some = (r: { ground: number; air: number }): number => r.ground + r.air;

describe('a monster in no state draws nothing', () => {
  it('a plain warrior, near or far', () => {
    const s = setup([actor(), actor({ x: 60 })]);
    expect(s.frame()).toEqual(none);
  });
});

describe('the states of a monster are drawn from the sim every frame', () => {
  it('a Choirmaster gathering a heal draws its reach and motes drawn in', () => {
    const cm = actor({ type: 'choirmaster', channelT: 0.5 });
    const s = setup([cm]);
    const r = s.frame();
    expect(r.ground).toBeGreaterThan(0);
    expect(r.air).toBeGreaterThan(0);
    // It stops when the channel does.
    cm.channelT = 0;
    expect(s.frame()).toEqual(none);
  });

  it('an aura, a bursar and a Rime Aura draw their reach while the character is near its edge, and not far away', () => {
    for (const mk of [
      () => actor({ type: 'censer' }),
      () => actor({ type: 'bell' }),
      () => actor({ type: 'bursar' }),
      () => actor({ modIds: ['rimeAura'] }),
      () => actor({ modIds: ['treasurer'] }),
    ]) {
      const near = setup([mk()]);
      expect(some(near.frame())).toBeGreaterThan(0);
      const far = setup([{ ...mk(), x: 30 } as Actor]);
      expect(some(far.frame())).toBe(0);
    }
  });

  it('a reach is firmer with the character inside it', () => {
    const rime = actor({ modIds: ['rimeAura'], x: RIME_AURA_RANGE - 1 });
    const inside = setup([rime]).frame();
    const outside = setup([actor({ modIds: ['rimeAura'], x: RIME_AURA_RANGE + 2 })]).frame();
    expect(inside.ground).toBeGreaterThan(outside.ground);
  });

  it('a monster that is not hunting shows no reach', () => {
    const s = setup([actor({ modIds: ['rimeAura'], state: 'idle' })]);
    expect(some(s.frame())).toBe(0);
  });

  it('a ward, a buff, a spur, a fervour, a curl, an immunity and a mirrored pair each draw', () => {
    const cases: Partial<Actor>[] = [
      { es: 20 },
      { es: 30, shellBy: 99 },
      { choir: { buffT: 2, zealT: 0, fervour: 0, fervourT: 0 } },
      { choir: { buffT: 0, zealT: 3, fervour: 0, fervourT: 0 } },
      { choir: { buffT: 0, zealT: 0, fervour: 3, fervourT: 5 } },
      { curlT: 1 },
      {
        modIds: ['reliquarian'],
        def: { maxLife: 100, maxEs: 0, immune: [false, true, false, false, false] },
      } as never,
    ];
    for (const c of cases)
      expect(some(setup([actor(c)]).frame()), JSON.stringify(c)).toBeGreaterThan(0);
    const a = actor();
    const b = actor();
    a.mirror = { id: b.id, t: 0 };
    b.mirror = { id: a.id, t: 0 };
    expect(setup([a, b]).frame().ground).toBeGreaterThan(0);
  });

  it('a Mirrored survivor shows the seconds it has left', () => {
    const survivor = actor({ mirror: { id: 999, t: 2 } });
    expect(setup([survivor]).frame().ground).toBeGreaterThan(0);
  });

  it('mending and draining monsters draw only while they are hurt', () => {
    const regen = actor({ modIds: ['regenerating'] });
    const s = setup([regen]);
    expect(some(s.frame())).toBe(0);
    regen.life = 50;
    expect(s.frame().air).toBeGreaterThan(0);
    const leech = actor({ leech: { life: [5], es: [], mana: [] } as never, life: 50 });
    expect(setup([leech]).frame().air).toBeGreaterThan(0);
  });

  it('the character who cannot recover wears a sign, and loses it', () => {
    const s = setup([]);
    s.player.suppressT = 0.25;
    expect(s.frame().air).toBeGreaterThan(0);
    s.player.suppressT = 0;
    expect(s.frame()).toEqual(none);
  });

  it('a pylon draws a line to each monster it keeps from harm, and nothing when it keeps none', () => {
    const pylon = actor({ type: 'pylon', stationary: true } as never);
    const lone = setup([pylon]);
    expect(some(lone.frame())).toBe(0);
    const near = actor({ x: 6 });
    const withOne = setup([pylon, near]);
    expect(withOne.frame().ground).toBeGreaterThan(0);
    const farOff = setup([pylon, actor({ x: 20 })]);
    expect(some(farOff.frame())).toBe(0);
  });
});

describe('the pips say the states, and the sprite follows two of them', () => {
  it('each state has a pip of its own colour, and a plain monster has none', () => {
    const w = { hasPylons: false } as World;
    expect(statePips(w, actor())).toHaveLength(0);
    const m = actor({
      choir: { buffT: 1, zealT: 1, fervour: 2, fervourT: 3 },
      es: 5,
      shellBy: 7,
      curlT: 1,
    });
    m.mirror = { id: 5, t: 0 };
    const pips = statePips(w, m);
    expect(pips.map((p) => p.id)).toEqual(['buff', 'zeal', 'fervour', 'ward', 'twin', 'curl']);
    expect(new Set(pips.map((p) => p.color)).size).toBe(pips.length);
    expect(statePips(w, actor({ alive: false, curlT: 1 }))).toHaveLength(0);
  });

  it('a Reliquarian shows the element it is immune to, and a ward is a share of life on its strip', () => {
    const w = { hasPylons: false } as World;
    const r = actor({
      modIds: ['reliquarian'],
      def: { maxLife: 100, maxEs: 0, immune: [false, false, true, false, false] },
    } as never);
    expect(statePips(w, r).map((p) => p.id)).toEqual(['immune']);
    expect(shownMaxEs(actor({ shellBy: 3 }))).toBeGreaterThan(0);
    expect(shownMaxEs(actor())).toBe(0);
  });

  it('a curled beetle is smaller and a Mirrored monster is pale', () => {
    expect(stateSprite(actor({ curlT: 1 }))?.scale).toBeLessThan(1);
    expect(stateSprite(actor({ mirror: { id: 3, t: 0 } }))?.tint).toBeDefined();
    expect(stateSprite(actor())).toBeNull();
  });
});

describe('the moments are events, each drawn and each gone again', () => {
  const heal = (id: number, src?: number): SimEvent => ({ t: 'heal', id, src });
  const cue = (
    kind: Extract<SimEvent, { t: 'cue' }>['kind'],
    id: number,
    n?: number,
  ): SimEvent => ({
    t: 'cue',
    kind,
    id,
    x: 4,
    y: 0,
    r: 5,
    n,
  });

  it('every kind of cue and every event leaves something that fades', () => {
    const m = actor();
    const t = actor({ x: 6 });
    const s = setup([m, t]);
    // The events that name the character look it up in the host as well.
    const events: SimEvent[] = [
      heal(m.id),
      heal(t.id, m.id),
      cue('mend', m.id),
      cue('aura', m.id),
      cue('whistle', m.id),
      cue('zeal', m.id),
      cue('ward', m.id),
      cue('pools', m.id),
      cue('immune', m.id, 2),
      cue('whole', m.id),
      { t: 'twin', id: t.id, of: m.id },
      { t: 'hexCast', from: m.id, to: s.player.id, hex: 'feebleGrip', renew: false },
      { t: 'hexCast', from: m.id, to: s.player.id, hex: 'openWounds', renew: true },
      { t: 'hexCast', from: -1, to: s.player.id, hex: 'brittleDoom', renew: false },
      { t: 'stolen', src: s.player.id, to: m.id, kind: 'mana' },
    ];
    for (const e of events) {
      const solo = setup([m, t]);
      solo.fx.onEvent(e);
      const queued = solo.fx.pending();
      expect(queued + solo.flashes.length + solo.said.length, JSON.stringify(e)).toBeGreaterThan(0);
      if (queued > 0) {
        expect(some(solo.frame(0.01)), JSON.stringify(e)).toBeGreaterThan(0);
        solo.frame(3);
        expect(solo.fx.pending(), JSON.stringify(e)).toBe(0);
      }
    }
  });

  it('a pack healed at once gets one set of motes each, not one per event', () => {
    const m = actor();
    const s = setup([m]);
    s.fx.onEvent(heal(m.id));
    const one = s.fx.pending();
    s.fx.onEvent(heal(m.id));
    expect(s.fx.pending()).toBe(one);
  });

  it('a cue about an actor that is gone does no harm', () => {
    const s = setup([]);
    expect(() => {
      s.fx.onEvent(heal(999));
      s.fx.onEvent({ t: 'twin', id: 999, of: 998 });
      s.fx.onEvent({ t: 'hexCast', from: 5, to: 6, hex: 'feebleGrip', renew: false });
      s.fx.onEvent({ t: 'stolen', src: 5, to: 6, kind: 'life' });
    }).not.toThrow();
    expect(s.fx.pending()).toBe(0);
  });
});

describe('hex glyphs', () => {
  it('each hex has a glyph of its own, in a colour of its own', () => {
    const ids = Object.keys(HEX_TINT);
    expect(ids).toHaveLength(4);
    expect(new Set(Object.values(HEX_TINT)).size).toBe(4);
    const counts = ids.map((id) => {
      const g = gfx();
      hexGlyph(g as never, id, 0, 0, 5, 0xffffff, 1);
      return g.calls.n;
    });
    for (const n of counts) expect(n).toBeGreaterThan(1);
    const g = gfx();
    hexGlyph(g as never, 'unknownHex', 0, 0, 5, 0xffffff, 1);
    expect(g.calls.n).toBeGreaterThan(1);
    const off = gfx();
    hexGlyph(off as never, 'openWounds', 0, 0, 5, 0xffffff, 0);
    expect(off.calls.n).toBe(0);
  });
});
