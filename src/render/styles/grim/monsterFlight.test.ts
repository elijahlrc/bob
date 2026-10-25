import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../../../calc/monster';
import type { MonsterTypeId } from '../../../data/monsters';
import { startAction } from '../../../sim/actions';
import { createDummyWorld } from '../../../sim/dummy';
import type { Actor, SimEvent, World } from '../../../sim/types';
import { spawnMonster, stepWorld } from '../../../sim/world';
import { makeGem, makeItem } from '../../../gen/items';
import { newRun } from '../../../run/run';
import type { FxHost } from './skillFx';
import {
  beamBodyOf,
  FLURRY_CROSS,
  fallHeight,
  leapHeight,
  lobHeight,
  lobOf,
  lungeHead,
  MonsterFlightFx,
  MORTAR_FALL,
  mortarProgress,
  VOLLEY_ARROWS,
  VOLLEY_CROSS,
  volleyArrow,
} from './monsterFlight';

/** A character in an open arena, fixed to the spot, with no dummies. */
function arena(): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 40, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 30 });
  world.sides[0].player.stunT = 1e9;
  world.sides[0].opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 40,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0, pack = 0): Actor {
  const m = spawnMonster(
    w,
    spec(type),
    w.sides[0].player.x + dx,
    w.sides[0].player.y + dy,
    0,
    pack,
    type,
  );
  m.state = 'chase';
  return m;
}

/** A graphics object that records what is drawn on it. */
const drawn: string[] = [];
const gfx = (): unknown => {
  const g: unknown = new Proxy(() => g, {
    get: (_t, k) =>
      k === 'destroy'
        ? () => undefined
        : () => {
            drawn.push(String(k));
            return g;
          },
  });
  return g;
};

function flightFx(w: World): MonsterFlightFx {
  const host: FxHost = {
    project: (x, y) => ({ x: x * 10, y: y * 5 }),
    rpx: (r) => r * 10,
    squash: () => 0.5,
    em: new Proxy({}, { get: () => ({ explode: () => undefined }) }) as FxHost['em'],
    flash: () => undefined,
    shake: () => undefined,
    actorById: (id) => w.actors.find((a) => a.id === id) ?? null,
  };
  return new MonsterFlightFx(host, { add: { graphics: () => gfx() } } as never);
}

/** How many draw calls one frame makes. */
function marks(fx: MonsterFlightFx, w: World, dt = 0): number {
  drawn.length = 0;
  fx.frame(w, dt, 1);
  return drawn.filter((c) => c.startsWith('fill') || c.startsWith('line')).length;
}

/** Start an attack of the monster's (its own, or its sidearm) and step until `until` says so; returns the ticks stepped. */
function wind(
  w: World,
  m: Actor,
  side: boolean,
  until: (act: NonNullable<Actor['action']>) => boolean,
): void {
  const p = side ? m.mon!.sidearm!.profile(0) : m.mon!.profile(0);
  startAction(w, m, 'monster', p, w.sides[0].player);
  for (let i = 0; i < 240 && m.action && !until(m.action); i++) stepWorld(w);
}

describe('the numbers of a flight', () => {
  it('a lob leaves the hand, rises over the throw and comes down on the ground', () => {
    expect(lobHeight(0, 6)).toBeGreaterThan(0);
    expect(lobHeight(1, 6)).toBe(0);
    expect(lobHeight(0.5, 6)).toBeGreaterThan(lobHeight(0, 6));
    expect(lobHeight(0.5, 6)).toBeGreaterThan(lobHeight(0.9, 6));
    // A longer throw arches higher.
    expect(lobHeight(0.5, 8)).toBeGreaterThan(lobHeight(0.5, 2));
  });

  it('a mortar shell is in the air for the last stretch of its warning and is on the ground as it lands', () => {
    const e = { t: 0.8, delay: undefined, shape: 'circle' as const, label: 'Mortar' };
    expect(mortarProgress(e)).toBeNull();
    expect(mortarProgress({ ...e, t: MORTAR_FALL / 2 })).toBeCloseTo(0.5, 5);
    expect(mortarProgress({ ...e, t: 0.001 })).toBeGreaterThan(0.99);
    expect(mortarProgress({ ...e, t: 0 })).toBeNull();
    // A step that waits its turn, and a blast of another pattern, show nothing.
    expect(mortarProgress({ ...e, t: 0.2, delay: 0.5 })).toBeNull();
    expect(mortarProgress({ ...e, t: 0.2, label: 'March' })).toBeNull();
    expect(fallHeight(0)).toBeGreaterThan(fallHeight(0.5));
    expect(fallHeight(1)).toBe(0);
  });

  it('the last arrow of a volley reaches the end of the lane as it lands, the first before it', () => {
    const last = VOLLEY_ARROWS - 1;
    expect(volleyArrow(last, 0)).toBe(1);
    expect(volleyArrow(0, 0)).toBe(1);
    // Nothing is loosed before the cross begins.
    expect(volleyArrow(last, VOLLEY_CROSS + 0.01)).toBeNull();
    const mid = volleyArrow(last, VOLLEY_CROSS / 2)!;
    expect(mid).toBeGreaterThan(0.4);
    expect(mid).toBeLessThan(0.6);
    // The first arrow is ahead of the last.
    expect(volleyArrow(0, VOLLEY_CROSS / 2)!).toBeGreaterThan(mid);
  });

  it('the duellist lunges down a lane in the last moments of its warning', () => {
    expect(lungeHead(FLURRY_CROSS + 0.1)).toBeNull();
    expect(lungeHead(FLURRY_CROSS / 2)!).toBeGreaterThan(0.5);
    expect(lungeHead(0)).toBe(1);
  });

  it('a leap rises and falls and is on the ground at both ends', () => {
    expect(leapHeight(0, 5)).toBeCloseTo(0, 5);
    expect(leapHeight(1, 5)).toBeCloseTo(0, 5);
    expect(leapHeight(0.5, 5)).toBeGreaterThan(5);
  });
});

describe('the lobs of monsters', () => {
  const lobbers: [MonsterTypeId, boolean][] = [
    ['spitter', false],
    ['hag', false],
    ['spinner', false],
    ['pyrepriest', false],
    ['shambler', true],
    ['censer', true],
    ['cutpurse', true],
    ['slagbrute', true],
    ['handler', true],
  ];
  for (const [type, side] of lobbers)
    it(`${type}${side ? ' sidearm' : ''} throws a body that lands as its burst does`, () => {
      const w = arena();
      const m = put(w, type, 6);
      expect(m.mon, type).toBeTruthy();
      if (side) expect(m.mon!.sidearm, type).toBeTruthy();
      startAction(
        w,
        m,
        'monster',
        side ? m.mon!.sidearm!.profile(0) : m.mon!.profile(0),
        w.sides[0].player,
      );
      // Before the aim is fixed it is still in the hand.
      expect(lobOf(m)).toBeNull();
      let seen: ReturnType<typeof lobOf> = null;
      let last = 0;
      let aimed = false;
      const p = w.sides[0].player;
      for (let i = 0; i < 400 && m.action && !m.action.fired; i++) {
        stepWorld(w);
        const l = lobOf(m);
        if (!l) continue;
        seen = l;
        aimed = Math.hypot(l.tx - p.x, l.ty - p.y) < 0.5 || aimed;
        expect(l.u).toBeGreaterThanOrEqual(last);
        last = l.u;
      }
      expect(seen, type).not.toBeNull();
      // It is on its way for a part of the wind-up, and nearly there when the burst fires.
      expect(last).toBeGreaterThan(0.85);
      expect(aimed).toBe(true);
      // Once the burst has fired it is gone.
      expect(lobOf(m)).toBeNull();
    });

  it('a slam or a nova is not a lob', () => {
    const w = arena();
    const brute = put(w, 'brute', 1.8);
    startAction(w, brute, 'monster', brute.mon!.profile(0), w.sides[0].player);
    for (let i = 0; i < 20; i++) stepWorld(w);
    expect(lobOf(brute)).toBeNull();
  });

  it('the body is drawn in flight and gone when the burst fires', () => {
    const w = arena();
    const m = put(w, 'spitter', 6);
    const fx = flightFx(w);
    expect(marks(fx, w)).toBe(0);
    wind(w, m, false, (a) => a.elapsed > 0.45 * a.duration);
    expect(lobOf(m)).not.toBeNull();
    expect(marks(fx, w)).toBeGreaterThan(5);
    wind(w, m, false, (a) => a.fired);
    expect(marks(fx, w)).toBe(0);
  });
});

describe('the mortar of a spitter', () => {
  it('a shell falls onto each spot in the last stretch of its warning and lands with the blast', () => {
    const w = arena();
    const m = put(w, 'spitter', 7);
    const fx = flightFx(w);
    const blasts = () => w.effects.filter((e) => e.label === 'Mortar');
    wind(w, m, true, (a) => a.fired);
    // The spitter takes no part in the rest (its own lob would be drawn too).
    m.stunT = 1e9;
    expect(blasts().length).toBeGreaterThanOrEqual(6);
    // At the start of the warning nothing is falling yet.
    for (const e of blasts()) expect(mortarProgress(e)).toBeNull();
    expect(marks(fx, w)).toBe(0);
    // Step into the fall: every spot has a shell, nearer the ground as the blast nears.
    let inFall = 0;
    let prev = -1;
    let landed = 0;
    for (let i = 0; i < 120; i++) {
      stepWorld(w);
      landed += w.events.filter((e: SimEvent) => e.t === 'blast' && e.e.label === 'Mortar').length;
      const bl = blasts();
      if (bl.length && bl.every((e) => mortarProgress(e) !== null)) {
        inFall++;
        const u = mortarProgress(bl[0])!;
        expect(u).toBeGreaterThan(prev);
        prev = u;
        expect(marks(fx, w)).toBeGreaterThan(bl.length * 4);
      }
    }
    expect(inFall).toBeGreaterThan(10);
    expect(prev).toBeGreaterThan(0.9);
    expect(landed).toBeGreaterThanOrEqual(6);
    expect(blasts()).toHaveLength(0);
    expect(marks(fx, w)).toBe(0);
  });
});

describe('the loosing call of archers', () => {
  it('arrows cross each lane from the archer and are in the ground at its end when it lands', () => {
    const w = arena();
    const fx = flightFx(w);
    put(w, 'archer', 7, -1, 5);
    put(w, 'archer', 7, 1, 5);
    const lanes = () => w.effects.filter((e) => e.label === 'Loosing call');
    for (let i = 0; i < 300 && lanes().length < 2; i++) stepWorld(w);
    expect(lanes()).toHaveLength(2);
    expect(marks(fx, w)).toBe(0);
    let flying = 0;
    for (let i = 0; i < 120 && lanes().length; i++) {
      stepWorld(w);
      const e = lanes()[0];
      if (!e) break;
      if (volleyArrow(VOLLEY_ARROWS - 1, e.t) !== null && marks(fx, w) > 10) flying++;
    }
    expect(flying).toBeGreaterThan(5);
  });
});

describe('the lunge of the Veiled Duellist', () => {
  it('draws ghosts along each lane of the flurry in its last moments, with the lane where it was', () => {
    const w = arena();
    const fx = flightFx(w);
    const e = {
      id: 99,
      x: 5,
      y: 5,
      x2: 12,
      y2: 5,
      width: 1.2,
      radius: 3.5,
      t: 0.9,
      total: 0.9,
      kind: 'slam',
      damage: 1,
      dtype: 0,
      team: 1,
      shape: 'lane',
      label: 'Flurry',
    } as never;
    w.effects.push(e);
    expect(marks(fx, w)).toBe(0);
    (e as { t: number }).t = FLURRY_CROSS / 2;
    expect(marks(fx, w)).toBeGreaterThan(10);
    (e as { t: number }).t = 0.001;
    expect(marks(fx, w)).toBeGreaterThan(10);
  });
});

describe('the lances of monsters', () => {
  const lance = (type: MonsterTypeId, side: boolean) => {
    const w = arena();
    const fx = flightFx(w);
    const m = put(w, type, side ? 3.5 : 7);
    const p = side ? m.mon!.sidearm!.profile(0) : m.mon!.profile(0);
    startAction(w, m, 'monster', p, w.sides[0].player);
    let beam: Extract<SimEvent, { t: 'beam' }> | undefined;
    for (let i = 0; i < 300 && !beam; i++) {
      stepWorld(w);
      beam = w.events.find((e): e is Extract<SimEvent, { t: 'beam' }> => e.t === 'beam');
    }
    return { w, fx, m, beam };
  };

  for (const [type, side, body] of [
    ['arbalest', false, 'bolt'],
    ['watcher', false, 'eye'],
    ['flagellant', true, 'lash'],
    ['tidecaller', false, 'hook'],
  ] as const)
    it(`${type} fires ${body === 'eye' ? 'an eye-beam' : `a ${body}`}, not lightning`, () => {
      const { w, fx, m, beam } = lance(type, side);
      expect(beam, type).toBeTruthy();
      // The event has no skill (a monster's), a width, and starts where the monster stands.
      expect(beam!.skill).toBeUndefined();
      expect(beamBodyOf(m, beam!.dtype)).toBe(beam!.dtype === 1 ? null : body);
      if (beam!.dtype === 1) return;
      expect(fx.onBeam(beam!, w)).toBe(true);
      expect(marks(fx, w, 0.05)).toBeGreaterThan(3);
      // It fades out.
      expect(marks(fx, w, 1)).toBe(0);
    });

  it('only lightning keeps the jagged bolt', () => {
    const { w, fx, beam } = lance('arbalest', false);
    expect(beamBodyOf(undefined, 1)).toBeNull();
    expect(fx.onBeam({ ...beam!, dtype: 1 }, w)).toBe(false);
    expect(fx.onBeam({ ...beam!, dtype: 3 }, w)).toBe(true);
    // A character's beam, or a strike with no width, is none of its business.
    expect(fx.onBeam({ ...beam!, skill: 'blazeStream' }, w)).toBe(false);
    expect(fx.onBeam({ ...beam!, width: undefined }, w)).toBe(false);
  });
});

describe('the leap of a hound', () => {
  it('rises and falls over the slide and does not lift a charge', () => {
    const w = arena();
    const fx = flightFx(w);
    const hound = put(w, 'hound', 6);
    const lifts: number[] = [];
    for (let i = 0; i < 400; i++) {
      stepWorld(w);
      if (hound.dash.t > 0)
        lifts.push(fx.leapLift(hound, (hound.mon?.range ?? 1) + hound.r + w.sides[0].player.r));
      else if (lifts.length > 3) break;
    }
    expect(lifts.length).toBeGreaterThan(3);
    expect(Math.max(...lifts)).toBeGreaterThan(5);
    // It leaves the ground and comes back to it.
    expect(lifts[0]).toBeLessThan(Math.max(...lifts));
    expect(lifts[lifts.length - 1]).toBeLessThan(Math.max(...lifts));
    expect(fx.leapLift(hound)).toBe(0);
    // A charge (a different pace) is a run along the floor.
    const boar = put(w, 'hound', 6, 3);
    boar.dash.t = 1;
    boar.dash.v = 10;
    boar.dash.x = boar.x + 4;
    boar.dash.y = boar.y;
    expect(fx.leapLift(boar)).toBe(0);
  });
});
