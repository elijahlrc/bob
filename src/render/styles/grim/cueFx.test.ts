import { describe, expect, it } from 'vitest';
import type { Deployable } from '../../../sim/deploy';
import type { Actor, SimEvent, World } from '../../../sim/types';
import { CLEANSE_COLOR, drawFlaskPips, flaskLook } from './flaskFx';
import { auraColor, drawDeployZones } from './deployFx';
import { SkillFx, type FxHost } from './skillFx';

/** A graphics object that accepts every call and counts them. */
function gfx() {
  const calls = { n: 0 };
  const g: unknown = new Proxy(() => g, {
    get: (_t, k) =>
      k === 'calls' ? calls : k === 'destroy' ? () => undefined : () => ((calls.n += 1), g),
  });
  return g as { calls: { n: number } };
}
const scene = { add: { graphics: () => ({ setDepth: () => gfx() }) } } as never;
const noop = new Proxy({}, { get: () => ({ explode: () => undefined }) });

function host(actors: Actor[], floaters: string[] = []): FxHost {
  return {
    project: (x, y) => ({ x, y }),
    rpx: (r) => r * 10,
    squash: () => 0.5,
    em: noop as FxHost['em'],
    flash: () => undefined,
    shake: () => undefined,
    actorById: (id) => actors.find((a) => a.id === id) ?? null,
    floater: (_x, _y, text) => void floaters.push(text),
  };
}

const actor = (over: Partial<Actor> = {}): Actor =>
  ({ id: 1, isPlayer: true, x: 5, y: 5, r: 0.4, facing: 0, alive: true, ...over }) as Actor;

type StubSkill = Record<string, unknown>;
const choice = (key: string, skill: StubSkill) => ({
  key,
  skill: { id: key, name: key, tags: [], type: 'spell', behaviour: { kind: 'burst' }, ...skill },
});

function world(
  p: Actor,
  over: {
    deployables?: Partial<Deployable>[];
    actives?: ReturnType<typeof choice>[];
    utilities?: ReturnType<typeof choice>[];
    flasks?: unknown[];
  } = {},
): World {
  return {
    actors: [p],
    grid: { w: 20 },
    hexes: [],
    sides: [
      {
        player: p,
        char: {
          auras: [],
          utilities: over.utilities ?? [],
          actives: over.actives ?? [],
          secondaries: [],
        },
        buffT: {},
        minions: [],
        zones: [],
        deployables: over.deployables ?? [],
        fields: [],
        flasks: over.flasks ?? [],
        vortex: null,
        stormOrb: null,
        markers: [],
        fuses: [],
        spores: [],
        mirage: null,
        charged: {},
        shell: null,
        channel: null,
        wither: null,
      },
    ],
  } as unknown as World;
}

const pending = (fx: SkillFx): number => (fx as unknown as { list: unknown[] }).list.length;
const flights = (fx: SkillFx): number =>
  (fx as unknown as { flights: Map<number, unknown> }).flights.size;
const settle = (fx: SkillFx, w: World, seconds = 2, ground = gfx()) => {
  for (let i = 0; i < seconds * 20; i++) fx.frame(w, 0.05, 1 + i * 0.05, ground as never);
};

describe('a totem, a brand or a mirage archer firing is seen', () => {
  const use = (
    over: Partial<NonNullable<Extract<SimEvent, { t: 'use' }>['dep']>> = {},
  ): SimEvent => ({
    t: 'use',
    src: 1,
    skill: 'x',
    via: 'deployed',
    dep: { id: 3, kind: 'totem', x: 7, y: 5, tx: 11, ty: 5, shot: false, dtype: 3, ...over },
  });

  it('pulses at the totem and sends a spark to the spot an area spell was fired at; both expire', () => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    const w = world(p);
    fx.onEvent(use(), w);
    expect(pending(fx)).toBe(2);
    settle(fx, w);
    expect(pending(fx)).toBe(0);
  });

  it('a projectile needs the pulse only: the projectile is the link', () => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    fx.onEvent(use({ shot: true }), world(p));
    expect(pending(fx)).toBe(1);
  });

  it('a brand and a mirage archer are cued like a totem, a trap or a mine (which have their own) is not', () => {
    const p = actor();
    for (const kind of ['brand', 'mirage']) {
      const fx = new SkillFx(host([p]), scene);
      fx.onEvent(use({ kind }), world(p));
      expect(pending(fx), kind).toBeGreaterThan(0);
    }
    for (const kind of ['trap', 'mine']) {
      const fx = new SkillFx(host([p]), scene);
      fx.onEvent(use({ kind }), world(p));
      expect(pending(fx), kind).toBe(0);
    }
  });
});

describe('what a standing totem or mine commands is drawn', () => {
  const totem = (active: boolean): Partial<Deployable> => ({
    id: 4,
    kind: 'totem',
    key: 'cry',
    x: 5,
    y: 5,
    t: 8,
    fireT: 1,
    active,
  });
  const drawn = (d: Partial<Deployable>, skill: StubSkill): number => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    const w = world(p, { deployables: [d], actives: [choice('cry', skill)] });
    const g = gfx();
    fx.frame(w, 0.05, 1, g as never);
    return g.calls.n;
  };

  it('a war-cry totem draws its reach, brighter and with a lit mark while it is active', () => {
    const ancestral = { ancestral: { buff: 'guardianCairn', range: 8, mods: [] } };
    const plain = drawn(totem(false), {});
    const idle = drawn(totem(false), ancestral);
    const active = drawn(totem(true), ancestral);
    expect(idle).toBeGreaterThan(plain);
    expect(active).toBeGreaterThan(idle);
  });

  it('a mine draws the aura it gives, in the colour of what it does', () => {
    const mine = (aura: Deployable['aura']): Partial<Deployable> => ({
      id: 5,
      kind: 'mine',
      key: 'cry',
      x: 5,
      y: 5,
      t: 5,
      fireT: 0,
      aura,
    });
    const aura = { double: 0, min: 1, max: 2, cap: 9, radius: 3.5 };
    expect(drawn(mine(aura), {})).toBeGreaterThan(drawn(mine(undefined), {}));
    expect(auraColor(aura)).not.toBe(auraColor({ ...aura, max: 0, double: 30 }));
    expect(auraColor({ ...aura, max: 0, double: 30 })).not.toBe(
      auraColor({ ...aura, max: 0, double: 0, taken: 3 }),
    );
  });

  it('the zones draw at several moments without trouble', () => {
    const g = gfx();
    const h = host([actor()]);
    for (const time of [0, 0.4, 3.3])
      drawDeployZones(
        g as never,
        h,
        { ...totem(true), x: 3, y: 3 } as Deployable,
        choice('cry', { ancestral: { buff: 'x', range: 5 } }) as never,
        1,
        time,
      );
    expect(g.calls.n).toBeGreaterThan(0);
  });

  it('a mine adding to a hit runs a spark from the mine to the enemy, not too often', () => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    const w = world(p);
    const bonus = (kind: 'fire' | 'double'): SimEvent => ({
      t: 'mineBonus',
      kind,
      x: 9,
      y: 5,
      mx: 7,
      my: 5,
    });
    fx.onEvent(bonus('fire'), w);
    expect(pending(fx)).toBe(1);
    fx.onEvent(bonus('fire'), w);
    expect(pending(fx)).toBe(1);
    settle(fx, w);
    expect(pending(fx)).toBe(0);
  });
});

describe('a spell cast by a trigger or an echo is seen at the character', () => {
  const skill = { fire: true, tags: ['spell', 'fire'], spellDamage: [{ type: 'fire' }] };
  it('a trigger turns a rune and names the spell, each at most once in a while', () => {
    const p = actor();
    const names: string[] = [];
    const fx = new SkillFx(host([p], names), scene);
    const w = world(p, { actives: [choice('frostBolt', skill)] });
    const trig: SimEvent = { t: 'trigger', skill: 'frostBolt', kind: 'hit', src: 1 };
    fx.onEvent(trig, w);
    expect(pending(fx)).toBe(1);
    expect(names).toEqual(['frostBolt']);
    // A spam trigger does not flood: the same skill again at once is nothing new.
    fx.onEvent(trig, w);
    expect(pending(fx)).toBe(1);
    expect(names).toHaveLength(1);
    settle(fx, w);
    expect(pending(fx)).toBe(0);
  });

  it('an echo closes a ring on the character, and many in a moment are one', () => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    const w = world(p, { actives: [choice('frostBolt', skill)] });
    fx.onEvent({ t: 'echo', src: 1, skill: 'frostBolt' }, w);
    fx.onEvent({ t: 'echo', src: 1, skill: 'frostBolt' }, w);
    expect(pending(fx)).toBe(1);
    settle(fx, w);
    expect(pending(fx)).toBe(0);
  });
});

describe('getting life back, or giving it up, is seen on the character', () => {
  it('motes rise in the colour of the pool, more for a bigger share, and are gone again', () => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    const w = world(p);
    for (const pool of ['life', 'es', 'mana'] as const) {
      fx.onEvent({ t: 'recover', src: 1, pool, pct: 0.05 }, w);
      expect(pending(fx), pool).toBeGreaterThan(0);
    }
    const g = gfx();
    fx.frame(w, 0.05, 1, gfx() as never);
    settle(fx, w, 2, g);
    expect(pending(fx)).toBe(0);
  });

  it('a sacrifice drains in red', () => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    const w = world(p);
    fx.onEvent({ t: 'sacrifice', src: 1, amount: 50 }, w);
    expect(pending(fx)).toBe(1);
    settle(fx, w);
    expect(pending(fx)).toBe(0);
  });
});

describe('a blink that waits for a flight draws it; an escape throws its mine', () => {
  const quiver = choice('shadowQuiver', {
    utility: { kind: 'blink', distance: 9, cooldown: 0.3, warp: { speed: 1 } },
  });
  const bolt = choice('boltStep', {
    utility: { kind: 'blink', distance: 9, cooldown: 0.5, warp: { lessDuration: [20, 39] } },
  });
  const smoke = choice('smokeCharge', {
    utility: {
      kind: 'blink',
      distance: 7,
      cooldown: 2.5,
      escape: { smoke: {}, buff: 'x', mods: [] },
    },
  });
  const warp = (skill: string): SimEvent => ({
    t: 'warp',
    id: 1,
    skill,
    x: 5,
    y: 5,
    x2: 12,
    y2: 5,
    seconds: 0.5,
  });
  const flightCount = (fx: SkillFx) => (fx as unknown as { warps: { count: number } }).warps.count;

  it('an arrow and a run of lightning fly until the blink ends them', () => {
    for (const skill of ['shadowQuiver', 'boltStep']) {
      const p = actor();
      const fx = new SkillFx(host([p]), scene);
      const w = world(p, { utilities: [quiver, bolt] });
      fx.onEvent(warp(skill), w);
      expect(flightCount(fx), skill).toBe(1);
      const g = gfx();
      for (let i = 0; i < 5; i++) fx.frame(w, 0.05, 1 + i * 0.05, g as never);
      expect(g.calls.n, skill).toBeGreaterThan(0);
      fx.onEvent({ t: 'blink', id: 1, x: 12, y: 5, end: true, skill }, w);
      expect(flightCount(fx), skill).toBe(0);
    }
  });

  it('an arrow flight with no end is dropped when its time is well past', () => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    const w = world(p, { utilities: [quiver] });
    fx.onEvent(warp('shadowQuiver'), w);
    settle(fx, w, 3);
    expect(flightCount(fx)).toBe(0);
  });

  it('Smoke Charge throws a mine from where the character stood to where it lands', () => {
    const p = actor();
    const fx = new SkillFx(host([p]), scene);
    const w = world(p, { utilities: [smoke, quiver] });
    fx.onEvent({ t: 'blink', id: 1, x: 5, y: 5, end: false, skill: 'smokeCharge' }, w);
    fx.onEvent({ t: 'blink', id: 1, x: 10, y: 5, end: true, skill: 'smokeCharge' }, w);
    expect(flights(fx)).toBe(1);
    settle(fx, w, 1);
    expect(flights(fx)).toBe(0);
    // Another blink throws nothing.
    fx.onEvent({ t: 'blink', id: 1, x: 5, y: 5, end: false, skill: 'shadowQuiver' }, w);
    fx.onEvent({ t: 'blink', id: 1, x: 10, y: 5, end: true, skill: 'shadowQuiver' }, w);
    expect(flights(fx)).toBe(0);
  });
});

describe('a flask is drawn by what it is, and while it runs', () => {
  const spec = (over: Record<string, unknown>) => ({
    kind: 'utility',
    buff: [],
    duration: 4,
    ...over,
  });
  const mod = (stat: string) => ({ stat, kind: 'base', value: 1 });

  it('life, mana and hybrid flasks differ, and a utility flask takes its look from what it gives', () => {
    const looks = [
      flaskLook(spec({ kind: 'life' }) as never),
      flaskLook(spec({ kind: 'mana' }) as never),
      flaskLook(spec({ kind: 'hybrid' }) as never),
      flaskLook(spec({ buff: [mod('moveSpeed')] }) as never),
      flaskLook(spec({ buff: [mod('resist.fire')] }) as never),
      flaskLook(spec({ buff: [mod('resist.cold')] }) as never),
      flaskLook(spec({ buff: [mod('armour')] }) as never),
      flaskLook(spec({ buff: [mod('critLucky')] }) as never),
      flaskLook(spec({ buff: [mod('damage')], ground: 'consecrated' }) as never),
    ];
    expect(new Set(looks.map((l) => l.color)).size).toBeGreaterThanOrEqual(7);
    expect(looks[0].motif).toBe('drops');
    expect(looks[3].motif).toBe('rush');
    expect(looks[4].motif).toBe('ward');
    expect(looks[7].motif).toBe('edge');
    // A flask no listed stat describes still has a look.
    expect(flaskLook(spec({}) as never).color).toBeGreaterThan(0);
    expect(flaskLook(undefined).color).toBeGreaterThan(0);
  });

  it('drinking any kind draws and expires; a cleansed ailment adds motes of its colour', () => {
    const p = actor();
    for (const kind of ['life', 'mana', 'hybrid', 'utility']) {
      const fx = new SkillFx(host([p]), scene);
      const w = world(p, { flasks: [{ spec: spec({ kind, buff: [mod('moveSpeed')] }) }] });
      fx.onEvent({ t: 'flaskUsed', src: 1, idx: 0 }, w);
      const plain = pending(fx);
      expect(plain, kind).toBeGreaterThan(0);
      fx.onEvent({ t: 'flaskUsed', src: 1, idx: 0, cleansed: ['ignite', 'bleed'] }, w);
      expect(pending(fx) - plain, kind).toBe(plain + 2);
      settle(fx, w);
      expect(pending(fx), kind).toBe(0);
    }
    for (const kind of ['ignite', 'bleed', 'freeze', 'poison', 'shock', 'curse'])
      expect(CLEANSE_COLOR[kind], kind).toBeGreaterThan(0);
  });

  it('a utility flask that runs leaves a pip; a life flask does not; the pip drains', () => {
    const p = actor();
    const h = host([p]);
    const side = (flasks: unknown[]) => world(p, { flasks }).sides[0];
    const pips = (flasks: unknown[]) => {
      const g = gfx();
      drawFlaskPips(g as never, h, side(flasks), 1);
      return g.calls.n;
    };
    const running = (kind: string, activeT: number) => ({
      spec: spec({ kind, buff: [mod('moveSpeed')] }),
      activeT,
    });
    expect(pips([])).toBe(0);
    expect(pips([running('life', 3)])).toBe(0);
    expect(pips([running('utility', 0)])).toBe(0);
    expect(pips([running('utility', 3)])).toBeGreaterThan(0);
    expect(pips([running('utility', 3), running('utility', 2)])).toBeGreaterThan(
      pips([running('utility', 3)]),
    );
  });
});
