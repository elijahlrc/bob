import { describe, expect, it } from 'vitest';
import { attackHitChance, blockChance } from '../calc/combat';
import { Character } from '../calc/character';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { killActor } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { moveMult } from './factions';
import {
  applyStatus,
  blockLessOf,
  hitChanceFactor,
  hitTakenExtra,
  moveFactor,
  statusTaken,
} from './statuses';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S3 (docs/SPIRIT.md): the enemy status layer. */

function holding(gems: string[]): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 50;
  const weapon = makeItem(uid, 'sword_3', 50, gems.length);
  weapon.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

describe('the status layer', () => {
  const { world } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });

  it('slows by what hinder and maim say, and a snare per stack', () => {
    const m = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 10, mods: [] },
      10,
      10,
      0,
      0,
      'Test',
    );
    expect(moveFactor(m)).toBe(1);
    applyStatus(world, m, 'hinder', { seconds: 2 });
    expect(moveFactor(m)).toBeCloseTo(0.7, 6);
    applyStatus(world, m, 'maim', { seconds: 2 });
    expect(moveFactor(m)).toBeCloseTo(0.49, 6);
    applyStatus(world, m, 'ensnared', { seconds: 2 });
    applyStatus(world, m, 'ensnared', { seconds: 2 });
    applyStatus(world, m, 'ensnared', { seconds: 2 });
    applyStatus(world, m, 'ensnared', { seconds: 2 });
    // At most three snares: 40% less each.
    expect(m.fx.ensnared!.n).toBe(3);
    expect(moveFactor(m)).toBeCloseTo(0.49 * 0.6 ** 3, 6);
    // They are part of how fast the monster walks.
    expect(moveMult(m)).toBeLessThan(0.11);
    applyStatus(world, m, 'immobilised', { seconds: 1 });
    expect(moveFactor(m)).toBe(0);
  });

  it('fades: a shackle weakens over its time, and everything ends', () => {
    const { world: w, dummy: d } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    applyStatus(w, d, 'bound', { seconds: 3, v: 80, x: 15 });
    const start = moveFactor(d);
    for (let i = 0; i < 90; i++) stepWorld(w);
    expect(moveFactor(d)).toBeGreaterThan(start);
    for (let i = 0; i < 120; i++) stepWorld(w);
    expect(d.fx.bound).toBeUndefined();
    expect(moveFactor(d)).toBe(1);
  });

  it('withers up to fifteen stacks, each 6% more chaos damage taken', () => {
    const { world: w, dummy: d } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    for (let i = 0; i < 20; i++) applyStatus(w, d, 'withered');
    expect(d.fx.withered!.n).toBe(15);
    expect(statusTaken(d).vulnType[4]).toBeCloseTo(0.9, 6);
    expect(statusTaken(d).vulnType[3]).toBe(0);
  });

  it('exposes one element, and a maimed enemy takes more physical damage', () => {
    const { world: w, dummy: d } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    applyStatus(w, d, 'exposedFire');
    expect(statusTaken(d).res).toEqual([0, 0, 0, 25, 0]);
    applyStatus(w, d, 'maim', { seconds: 4, x: 12 });
    expect(statusTaken(d).vulnType[0]).toBeCloseTo(0.12, 6);
  });

  it('a blinded attacker hits half as often, and an Overpowered enemy blocks less', () => {
    const { world: w, dummy: d } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    applyStatus(w, d, 'blind');
    expect(hitChanceFactor(d)).toBe(0.5);
    const c = new Character(holding(['crushingBlow']), {});
    const p = c.profile(c.primary, 0);
    const def = dummyDefence({ blockAttack: 0.4, evasion: 0 });
    def.cannotEvade = false;
    expect(attackHitChance(p, p.hands[0], def, 0.5)).toBeCloseTo(
      attackHitChance(p, p.hands[0], def) / 2,
      6,
    );
    applyStatus(w, d, 'overpowered', { stacks: 1 });
    applyStatus(w, d, 'overpowered', { stacks: 1 });
    expect(blockLessOf(d)).toBeCloseTo(0.1, 6);
    expect(blockChance(p, def, blockLessOf(d))).toBeCloseTo(0.3, 6);
    expect(blockChance(p, def, 0)).toBeCloseTo(0.4, 6);
  });

  it('a shackled enemy takes more from traps and mines, a snared one from projectile attacks', () => {
    const { world: w, dummy: d } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    const sword = new Character(holding(['crushingBlow']), {}).profile(
      new Character(holding(['crushingBlow']), {}).primary,
      0,
    );
    applyStatus(w, d, 'bound', { x: 15 });
    expect(hitTakenExtra(d, sword)).toBe(0);
    const trap = {
      ...sword,
      skill: { ...sword.skill, tags: [...sword.skill.tags, 'trap' as const] },
    };
    expect(hitTakenExtra(d, trap)).toBeCloseTo(0.15, 6);
  });

  it('a Doomed enemy blows up for a share of its life when it dies', () => {
    const { world: w, dummy: d } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    const m = spawnMonster(
      w,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      d.x + 1,
      d.y,
      0,
      0,
      'Neighbour',
    );
    m.def = dummyDefence({ maxLife: 1000 });
    m.life = 1000;
    d.def = dummyDefence({ maxLife: 1000 });
    d.life = 1000;
    applyStatus(w, d, 'doomed', { seconds: 6, v: 10 });
    killActor(w, d);
    expect(m.life).toBeLessThan(1000);
  });
});

describe('the skills that inflict statuses', () => {
  const effectsOf = (gems: string[], seconds = 15) => {
    const { world, dummy } = createDummyWorld(holding(gems), { distance: 1.2 });
    world.opts.freeResources = true;
    const seen = new Set<string>();
    for (let i = 0; i < seconds * 60; i++) {
      stepWorld(world);
      for (const e of world.events) if (e.t === 'status') seen.add(e.id);
    }
    return { seen, dummy };
  };

  it('Hamstring maims, Dazzle blinds, Wither Mark withers, Guard Breaker needs a block', () => {
    expect(effectsOf(['crushingBlow', 'hamstring']).seen.has('maim')).toBe(true);
    expect(effectsOf(['crushingBlow', 'dazzle']).seen.has('blind')).toBe(true);
    expect(effectsOf(['crushingBlow', 'witherMark']).seen.has('withered')).toBe(true);
    expect(effectsOf(['crushingBlow', 'guardBreaker']).seen.has('overpowered')).toBe(false);
  });

  it('Rout sends a normal monster running', () => {
    const { world, dummy } = createDummyWorld(holding(['crushingBlow', 'rout']), { distance: 1.2 });
    world.opts.freeResources = true;
    dummy.rarity = 'normal';
    let fled = false;
    for (let i = 0; i < 20 * 60 && !fled; i++) {
      stepWorld(world);
      fled = dummy.fleeT > 0;
    }
    expect(fled).toBe(true);
  });
});
