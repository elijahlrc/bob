import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import type { MonsterModId, MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { chargeLane } from './abilities';
import { segmentDist } from './actions';
import { createDummyWorld } from './dummy';
import { hookTell, pullLanding } from './factions';
import { telegraphs } from './telegraph';
import type { Actor, SimEvent, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character, frozen to the spot and deathless, in an open arena with no dummies. */
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

function put(
  w: World,
  type: MonsterTypeId,
  dx: number,
  dy = 0,
  over: Partial<MonsterSpec> = {},
): Actor {
  const spec: MonsterSpec = {
    type,
    variant: 'none',
    rarity: 'normal',
    level: 30,
    mods: [],
    ...over,
  };
  const m = spawnMonster(w, spec, w.sides[0].player.x + dx, w.sides[0].player.y + dy, 0, 0, type);
  m.state = 'chase';
  return m;
}

/** Step the world and keep every event, as the renderer is given them. */
function run(w: World, seconds: number): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    out.push(...w.events);
  }
  return out;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe('a pull is told to the renderer (docs/VFX-AUDIT.md)', () => {
  it("a Tidecaller's lance says who hooked whom, from where to where", () => {
    const w = arena();
    const p = w.sides[0].player;
    const tc = put(w, 'tidecaller', 8);
    let seen = 0;
    for (let i = 0; i < 6 * 60 && !seen; i++) {
      stepWorld(w);
      for (const e of w.events) {
        if (e.t !== 'pull') continue;
        seen++;
        expect(e.src).toBe(tc.id);
        expect(e.dst).toBe(p.id);
        // It was dragged toward the hook, and the event ends where the character stands.
        expect(dist({ x: e.x2, y: e.y2 }, tc)).toBeLessThan(dist({ x: e.x, y: e.y }, tc) - 1);
        expect(e.x2).toBe(p.x);
        expect(e.y2).toBe(p.y);
        expect(e.hx).toBe(tc.x);
        expect(e.hy).toBe(tc.y);
      }
    }
    expect(seen).toBe(1);
  });

  it("a lance's warning knows it is a hook, who casts it, and where the drag would leave the character", () => {
    const w = arena();
    const p = w.sides[0].player;
    const tc = put(w, 'tidecaller', 8);
    let hooked = false;
    for (let i = 0; i < 6 * 60 && !hooked; i++) {
      stepWorld(w);
      const lane = telegraphs(w).find((t) => t.kind === 'lane' && t.pull);
      if (!lane || lane.kind !== 'lane') continue;
      hooked = true;
      expect(lane.src).toBe(tc.id);
      expect(lane.pull).toBe(3.5);
      expect(pullLanding(w, p, tc, lane.pull!)).not.toBeNull();
    }
    expect(hooked).toBe(true);
  });

  it('the Tidewarden hook is told before it flies, without moving when it flies', () => {
    const w = arena();
    const p = w.sides[0].player;
    const chief = put(w, 'wrack', 9, 0, {
      rarity: 'miniboss',
      mods: ['tidewarden' as MonsterModId],
    });
    // Nothing shows for most of the ten seconds.
    chief.raiserT = 5;
    expect(hookTell(w, chief)).toBeNull();
    // In the last moments the tell fills, and it knows where the drag will leave the character.
    chief.raiserT = 0.4;
    const tell = hookTell(w, chief)!;
    expect(tell.inRange).toBe(true);
    expect(tell.ready).toBe(false);
    expect(tell.progress).toBeCloseTo(0.5, 5);
    expect(tell.land).not.toBeNull();
    // When the hook flies, it lands where the tell said (the Warden has walked a step).
    chief.raiserT = 0.03;
    const land = hookTell(w, chief)!.land!;
    const events = run(w, 0.2);
    const pull = events.find((e) => e.t === 'pull') as Extract<SimEvent, { t: 'pull' }>;
    expect(pull).toBeDefined();
    expect(pull.src).toBe(chief.id);
    expect(dist({ x: pull.x2, y: pull.y2 }, land)).toBeLessThan(0.35);
    expect(dist(p, chief)).toBeLessThan(9 - 2);
  });

  it('a hook that is ready waits for the character to come in range, and says so', () => {
    const w = arena();
    const chief = put(w, 'wrack', 20, 0, {
      rarity: 'miniboss',
      mods: ['tidewarden' as MonsterModId],
    });
    chief.raiserT = 0;
    const tell = hookTell(w, chief)!;
    expect(tell.ready).toBe(true);
    expect(tell.inRange).toBe(false);
    expect(tell.land).toBeNull();
    // A monster that is not a Tidewarden, or is not hunting, has no hook to tell.
    const plain = put(w, 'wrack', 9);
    plain.raiserT = 0;
    expect(hookTell(w, plain)).toBeNull();
    chief.state = 'idle';
    expect(hookTell(w, chief)).toBeNull();
  });
});

describe('a push is told to the renderer', () => {
  it('a Warding Pulse says where it went off and where it threw the character', () => {
    const w = arena();
    const p = w.sides[0].player;
    const m = put(w, 'warrior', 2.5, 0, { rarity: 'rare', mods: ['wardingPulse' as MonsterModId] });
    m.pulseT = 0.05;
    const events = run(w, 1.5);
    const push = events.find((e) => e.t === 'push') as Extract<SimEvent, { t: 'push' }>;
    expect(push).toBeDefined();
    expect(push.src).toBe(m.id);
    expect(push.dst).toBe(p.id);
    expect(push.r).toBe(3);
    // Farther from the middle than it was, by about the push (the floor may hold it back).
    expect(dist({ x: push.x2, y: push.y2 }, { x: push.ox, y: push.oy })).toBeGreaterThan(
      dist({ x: push.x, y: push.y }, { x: push.ox, y: push.oy }) + 1.5,
    );
    expect(push.x2).toBe(p.x);
    expect(events.filter((e) => e.t === 'push')).toHaveLength(1);
  });
});

describe('a charge is told to the renderer', () => {
  it('the warning names the lane the rush will run, to its true length, and the dot goes out as a dud', () => {
    const w = arena();
    const p = w.sides[0].player;
    const m = put(w, 'warrior', 8, 0, { rarity: 'magic', mods: ['charging' as MonsterModId] });
    m.abT[9] = 0;
    let rush: Extract<SimEvent, { t: 'rush' }> | undefined;
    for (let i = 0; i < 10 && !rush; i++) {
      stepWorld(w);
      rush = w.events.find((e) => e.t === 'rush') as typeof rush;
    }
    expect(rush).toBeDefined();
    expect(rush!.id).toBe(m.id);
    expect(rush!.seconds).toBeCloseTo(0.6, 5);
    const lane = chargeLane(w, m)!;
    expect(lane).not.toBeNull();
    expect(lane.width).toBeCloseTo(m.r * 2, 5);
    // From the monster through the character, and three tiles past (the arena is open that far).
    const len = dist(m, p);
    expect(dist({ x: lane.x2, y: lane.y2 }, { x: lane.x, y: lane.y })).toBeCloseTo(len + 3, 0);
    // The rush runs where the lane said: it has left its place, and it stands on the line.
    const events = run(w, 0.7);
    expect(dist(m, { x: lane.x, y: lane.y })).toBeGreaterThan(0.5);
    expect(segmentDist(m.x, m.y, lane.x, lane.y, lane.x2, lane.y2)).toBeLessThan(0.4);
    const duds = events.filter((e) => e.t === 'explode' && e.dud);
    expect(duds).toHaveLength(1);
    expect(chargeLane(w, m)).toBeNull();
  });

  it('a monster that is not winding up has no lane', () => {
    const w = arena();
    const m = put(w, 'warrior', 8);
    expect(chargeLane(w, m)).toBeNull();
  });
});
