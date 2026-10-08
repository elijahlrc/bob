import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { MOVEMENT_INFO, movementTexts, senseText } from '../data/movement';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { applyDamage } from './combat';
import { createDummyWorld } from './dummy';
import { revealed, senseOf, targetOf } from './movement';
import type { Actor, World } from './types';
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
  world.player.stunT = 1e9;
  world.opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 30,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0, chase = true): Actor {
  const m = spawnMonster(w, spec(type), w.player.x + dx, w.player.y + dy, 0, 0, type);
  m.state = chase ? 'chase' : 'idle';
  return m;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

/** How far a monster moved in each of the next `n` ticks. */
function strides(w: World, m: Actor, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = m.x;
    const y = m.y;
    stepWorld(w);
    out.push(Math.hypot(m.x - x, m.y - y));
  }
  return out;
}

describe('movement styles (docs/ROSTER.md 6.3)', () => {
  it('a lurch moves in lunges and stands still between them, and still gets there', () => {
    const w = arena();
    const m = put(w, 'shambler', 16);
    const s = strides(w, m, 240);
    expect(s.filter((x) => x < 1e-6).length).toBeGreaterThan(40);
    expect(s.filter((x) => x > 1e-6).length).toBeGreaterThan(80);
    // A lunge is faster than the walk.
    expect(Math.max(...s) * 60).toBeGreaterThan(MONSTER_TYPES.shambler.speed * 1.2);
    run(w, 10);
    expect(Math.hypot(m.x - w.player.x, m.y - w.player.y)).toBeLessThan(3);
  });

  it('momentum gathers speed, and a stun brings it to a halt', () => {
    const w = arena();
    const m = put(w, 'boar', 17);
    const early = strides(w, m, 30).reduce((a, b) => a + b, 0);
    run(w, 1.2);
    const late = strides(w, m, 30).reduce((a, b) => a + b, 0);
    expect(late).toBeGreaterThan(early * 1.5);
    m.stunT = 0.5;
    stepWorld(w);
    stepWorld(w);
    expect(m.mv.ramp).toBeCloseTo(0.5, 5);
  });

  it('a skitter zig-zags: it wanders off the straight line and still arrives', () => {
    const w = arena();
    const m = put(w, 'gnawer', 14);
    let off = 0;
    for (let i = 0; i < 180; i++) {
      stepWorld(w);
      off = Math.max(off, Math.abs(m.y - w.player.y));
    }
    expect(off).toBeGreaterThan(0.6);
    run(w, 6);
    expect(Math.hypot(m.x - w.player.x, m.y - w.player.y)).toBeLessThan(2);
  });

  it('a swoop strikes and withdraws before it comes in again', () => {
    const w = arena();
    const m = put(w, 'bat', 3);
    let struck = false;
    let far = 0;
    for (let i = 0; i < 360; i++) {
      stepWorld(w);
      if (m.mv.attacked || m.action) struck = true;
      if (struck) far = Math.max(far, Math.hypot(m.x - w.player.x, m.y - w.player.y));
    }
    expect(struck).toBe(true);
    expect(far).toBeGreaterThan(2.5);
  });

  it('a circle goes round before it closes in', () => {
    const w = arena();
    const m = put(w, 'wisp', 8);
    const a0 = Math.atan2(m.y - w.player.y, m.x - w.player.x);
    let turned = 0;
    let last = a0;
    for (let i = 0; i < 150; i++) {
      stepWorld(w);
      const a = Math.atan2(m.y - w.player.y, m.x - w.player.x);
      let da = a - last;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      turned += Math.abs(da);
      last = a;
    }
    expect(turned).toBeGreaterThan(0.3);
  });

  it('a tether holds a monster with its pack while the character is away, and lets it out after a while', () => {
    const w = arena();
    const archer = put(w, 'archer', 17, 0, false);
    archer.stationary = true;
    const guard = put(w, 'shieldbearer', 16, 0);
    const x0 = guard.x;
    run(w, 2);
    // The character is more than the tether's ground from the pack: the guard stays by it.
    expect(Math.abs(guard.x - x0)).toBeLessThan(2.5);
    run(w, 8);
    expect(guard.x).toBeLessThan(x0 - 3);
  });

  it('a follower stays a little behind the front of its pack', () => {
    const w = arena();
    const front = put(w, 'guard', 12);
    front.stationary = true;
    const bursar = put(w, 'bursar', 20);
    run(w, 8);
    // On the far side of the guard from the character, within a few tiles of it.
    expect(bursar.x).toBeGreaterThan(front.x);
    expect(Math.hypot(bursar.x - front.x, bursar.y - front.y)).toBeLessThan(5);
  });

  it('a phasing monster passes through walls', () => {
    const w = arena();
    expect(put(w, 'wailer', 5).phases).toBe(true);
    expect(put(w, 'gloomstalker', 5).phases).toBe(true);
    expect(put(w, 'warrior', 5).phases).toBe(false);
  });

  it('every style has words, and the inspect card says them', () => {
    for (const id of Object.keys(MOVEMENT_INFO) as (keyof typeof MOVEMENT_INFO)[])
      expect(MOVEMENT_INFO[id].text({ id }).length).toBeGreaterThan(10);
    expect(movementTexts(MONSTER_TYPES.shambler.movement).join(' ')).toContain('Lurch');
    expect(movementTexts(undefined)).toEqual([]);
  });
});

describe('senses and targets (docs/ROSTER.md 6.4)', () => {
  it('the senses a type sets are read: the Arbalest notices from afar, the Brute from close by', () => {
    expect(senseOf(put(arena(), 'arbalest', 5)).aggro).toBe(14);
    expect(senseOf(put(arena(), 'brute', 5)).aggro).toBe(7);
    expect(senseOf(put(arena(), 'warrior', 5))).toEqual({});
    const w = arena();
    const far = put(w, 'arbalest', 13, 0, false);
    const near = put(w, 'warrior', 11, 7, false);
    run(w, 1);
    expect(far.state).toBe('chase');
    expect(near.state).toBe('idle');
  });

  it('a pack wakes to the radius its type sets', () => {
    const w = arena();
    const gnawer = put(w, 'gnawer', 9, 0, false);
    const sleeper = put(w, 'gnawer', 9, 11, false);
    const warrior = put(w, 'warrior', 14, 0.5, false);
    run(w, 0.6);
    expect(gnawer.state).toBe('chase');
    // A Gnawer wakes the sleepers within twelve tiles, further than most.
    expect(sleeper.state).toBe('chase');
    expect(warrior.state).toBe('chase');
  });

  it('a hunter never gives up, and goes for the minions first', () => {
    const w = arena();
    const hound = put(w, 'hound', 8);
    expect(senseOf(hound).leash).toBe(0);
    expect(targetOf(w, hound)).toBe(w.player);
    const minion = put(w, 'warrior', 5, 1);
    w.minions.push(minion as never);
    expect(targetOf(w, hound)).toBe(minion);
    // A monster that is not a hunter goes for the character, minions or not.
    expect(targetOf(w, put(w, 'warrior', 7))).toBe(w.player);
    // Out of sight for a minute, it still chases.
    w.minions.length = 0;
    hound.lostT = 60;
    run(w, 0.1);
    expect(hound.state).toBe('chase');
  });

  it('a veiled monster is seen only close up, or just after it strikes or is struck', () => {
    const w = arena();
    const stalker = put(w, 'gloomstalker', 8);
    expect(revealed(w, stalker)).toBe(false);
    expect(revealed(w, put(w, 'warrior', 8))).toBe(true);
    stalker.x = w.player.x + 2;
    stalker.y = w.player.y;
    expect(revealed(w, stalker)).toBe(true);
    stalker.x = w.player.x + 8;
    expect(revealed(w, stalker)).toBe(false);
    applyDamage(w, stalker, [1, 0, 0, 0, 0]);
    expect(revealed(w, stalker)).toBe(true);
    run(w, 2);
    expect(stalker.revealT).toBeLessThanOrEqual(1.5);
  });

  it('the character does not take aim at what it cannot see', () => {
    const run2 = newRun('vanguard', 1);
    const uid = () => run2.nextUid++;
    const b = run2.build;
    b.level = 40;
    b.equipment.mainHand = makeItem(uid, 'mace2_3', 40, 1);
    b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
    b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
    delete b.equipment.offHand;
    const { world: w } = createDummyWorld(b, { distance: 30 });
    w.opts.godMode = true;
    for (const a of w.actors) if (a.dummy) a.alive = false;
    const stalker = spawnMonster(w, spec('gloomstalker'), w.player.x + 6, w.player.y, 0, 0, 's');
    stalker.state = 'idle';
    stalker.dummy = true;
    for (let i = 0; i < 30; i++) stepWorld(w);
    expect(w.ai.targetId).not.toBe(stalker.id);
  });

  it('the senses have words', () => {
    expect(senseText(MONSTER_TYPES.gloomstalker.senses).join(' ')).toContain('Veiled');
    expect(senseText(MONSTER_TYPES.hound.senses).join(' ')).toContain('minions');
    expect(senseText(MONSTER_TYPES.hound.senses).join(' ')).toContain('Never gives up');
    expect(senseText(undefined)).toEqual([]);
  });
});
