import { describe, expect, it } from 'vitest';
import { attackHitChance, blockChance } from '../calc/combat';
import { Character } from '../calc/character';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { killActor } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { hexSeconds, hexTotals } from '../data/hexes';
import { moveMult } from './factions';
import { applyHex, hexHit, hexKill } from './hexes';
import {
  applyStatus,
  blockLessOf,
  hitChanceFactor,
  hitTakenExtra,
  moveFactor,
  rollStatuses,
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

describe('the curses and marks with their reference effects', () => {
  it('last as long as their gem says', () => {
    expect(hexSeconds('brittleDoom', 1)).toBe(9);
    expect(hexSeconds('brittleDoom', 20)).toBeCloseTo(10.9, 6);
    expect(hexSeconds('leadenLimbs', 1)).toBe(5);
    expect(hexSeconds('critMark', 1)).toBe(6);
    expect(hexSeconds('critMark', 20)).toBeCloseTo(9.8, 6);
  });

  it('Enfeeble and Temporal Chains take half as much from rare and unique enemies', () => {
    const feeble = [{ id: 'feebleGrip' as const, effect: 30 }];
    expect(hexTotals(feeble, 'normal').damageMult).toBeCloseTo(0.7, 6);
    expect(hexTotals(feeble, 'rare').damageMult).toBeCloseTo(0.85, 6);
    expect(hexTotals(feeble).acc).toBeCloseTo(0.165, 6);
    expect(hexTotals(feeble).critChance).toBeCloseTo(0.25, 6);
    expect(hexTotals(feeble).critMulti).toBeCloseTo(0.3, 6);
    const chains = [{ id: 'leadenLimbs' as const, effect: 29 }];
    expect(hexTotals(chains, 'magic').speedMult).toBeCloseTo(0.71, 6);
    expect(hexTotals(chains, 'boss').speedMult).toBeCloseTo(0.855, 6);
    expect(hexTotals(chains).expireSlow).toBeCloseTo(0.4, 6);
  });

  it('Vulnerability raises physical damage and the physical damage over time taken', () => {
    const t = hexTotals([{ id: 'openWounds', effect: 35 }]);
    expect(t.vulnPhys).toBeCloseTo(0.35, 6);
    expect(t.dotPhys).toBeCloseTo(0.35, 6);
    expect(t.bleedHit).toBeCloseTo(0.2, 6);
    expect(t.maimHit).toBeCloseTo(0.2, 6);
  });

  it('effects on a cursed enemy run out more slowly under Temporal Chains', () => {
    const { world, dummy } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    world.opts.freeResources = true;
    world.player.stunT = 1e9;
    dummy.ail.ignites.push({ dps: 1, t: 2 });
    applyHex(world, dummy, 'leadenLimbs', 25, 1, 10);
    for (let i = 0; i < 2.5 * 60; i++) stepWorld(world);
    expect(dummy.ail.ignites.length).toBe(1);
    const plain = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    plain.world.player.stunT = 1e9;
    plain.dummy.ail.ignites.push({ dps: 1, t: 2 });
    for (let i = 0; i < 2.5 * 60; i++) stepWorld(plain.world);
    expect(plain.dummy.ail.ignites.length).toBe(0);
  });

  it('the marks give back when their enemy is killed, and Mark of Plenty fills flasks', () => {
    const { world, dummy } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    world.player.life = 1;
    world.player.mana = 0;
    applyHex(world, dummy, 'critMark', 2, 1, 20);
    expect(hexKill(world, dummy)).toBe(0);
    expect(world.player.life).toBeGreaterThan(20);
    expect(world.player.mana).toBeGreaterThan(20);
    const again = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    applyHex(again.world, again.dummy, 'flaskMark', 30, 1, 5);
    expect(hexKill(again.world, again.dummy)).toBe(1);
  });

  it('a hit on Mark of Plenty gives life and mana, and its evasion is lower', () => {
    const { world, dummy } = createDummyWorld(holding(['crushingBlow']), { distance: 3 });
    world.player.life = 1;
    applyHex(world, dummy, 'flaskMark', 40, 1, 10);
    hexHit(world, dummy);
    expect(world.player.life).toBeGreaterThan(5);
    expect(hexTotals(dummy.hexes).evasion).toBeCloseTo(0.4, 6);
  });

  it('Punishment makes a melee hit on the cursed enemy grant the Punisher buff', () => {
    const { world, dummy } = createDummyWorld(holding(['crushingBlow', 'penance']), {
      distance: 1.2,
    });
    world.opts.freeResources = true;
    // The curse is cast by the character; against the first enemy it hits it is a melee attack that counts.
    applyHex(world, dummy, 'hardTimes', 20, 1, 10);
    let seen = false;
    for (let i = 0; i < 10 * 60 && !seen; i++) {
      stepWorld(world);
      for (const e of world.events) if (e.t === 'buff' && e.id === 'punisher') seen = true;
    }
    expect(seen).toBe(true);
  });
});

describe('the skills that lean on statuses', () => {
  function bow(gems: string[]): Build {
    const run = newRun('strider', 1);
    const uid = () => run.nextUid++;
    const b = run.build;
    b.level = 50;
    const weapon = makeItem(uid, 'bow_3', 50, gems.length);
    weapon.sockets = gems.map((g) => makeGem(uid, g));
    b.equipment.mainHand = weapon;
    delete b.equipment.offHand;
    b.primaryGem = weapon.sockets[0]!.uid;
    b.flasks = [null, null, null, null, null];
    return b;
  }

  it('Ensnaring Arrow snares what it hits, and the snared take more from projectile attacks', () => {
    const { world, dummy } = createDummyWorld(bow(['snareShot']), { distance: 4 });
    world.opts.freeResources = true;
    for (let i = 0; i < 6 * 60 && !dummy.fx.ensnared; i++) stepWorld(world);
    expect(dummy.fx.ensnared).toBeDefined();
    expect(dummy.fx.ensnared!.x).toBeGreaterThanOrEqual(15);
  });

  it('Bear Trap holds an enemy for as long as the hit was a share of its life, then shackles it', () => {
    const { world, dummy } = createDummyWorld(holding(['jawsTrap']), {
      distance: 3,
      maxTime: 60,
    });
    const c = new Character(holding(['jawsTrap']), {});
    const p = c.profile(c.primary, 0);
    expect(p.statuses.map((s) => s.id).sort()).toEqual(['bound', 'immobilised']);
    dummy.def = dummyDefence({ maxLife: 1000 });
    dummy.life = 1000;
    world.player.stunT = 1e9;
    // A hit of a tenth of its life: a hold of 1.5 s.
    rollStatuses(world, dummy, p, false, { dmg: [100, 0, 0, 0, 0], total: 100 });
    expect(dummy.fx.immobilised!.t).toBeCloseTo(1.5, 6);
    expect(moveFactor(dummy)).toBe(0);
    expect(dummy.fx.bound!.t).toBeCloseTo(4.5, 6);
    for (let i = 0; i < 2 * 60; i++) stepWorld(world);
    // The hold is over, and the shackle still slows.
    expect(dummy.fx.immobilised).toBeUndefined();
    expect(moveFactor(dummy)).toBeGreaterThan(0);
    expect(moveFactor(dummy)).toBeLessThan(0.7);
  });

  it('the shout hinders more the more enemies stand near, and leaves the Doomed', () => {
    const { world, dummy } = createDummyWorld(holding(['crushingBlow', 'kindledBellow']), {
      distance: 2,
    });
    world.opts.freeResources = true;
    world.opts.godMode = true;
    dummy.rarity = 'boss';
    const near = [0, 1, 2].map((i) =>
      spawnMonster(
        world,
        { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
        dummy.x + 0.5 + i * 0.4,
        dummy.y + 0.6,
        0,
        0,
        'Crowd',
      ),
    );
    for (let i = 0; i < 6 * 60 && !dummy.fx.hinder; i++) stepWorld(world);
    const hindered = dummy.fx.hinder?.v ?? 0;
    // 20% at least (level 1), and more with the others near.
    expect(hindered).toBeGreaterThan(20);
    expect(dummy.fx.doomed).toBeDefined();
    expect(near.some((m) => m.fx.hinder)).toBe(true);
  });

  it('Wave of Conviction exposes the enemy to the element it took the most damage from', () => {
    const c = new Character(holding(['tideOfJudgement']), {});
    expect(c.primary.skill.id).toBe('tideOfJudgement');
    expect(c.profile(c.primary, 0).exposure).toBe(1);
    const { world, dummy } = createDummyWorld(holding(['tideOfJudgement']), { distance: 2 });
    world.opts.freeResources = true;
    const seen = new Set<string>();
    for (let i = 0; i < 12 * 60; i++) {
      stepWorld(world);
      for (const e of world.events) if (e.t === 'status') seen.add(e.id);
    }
    expect([...seen].some((s) => s.startsWith('exposed'))).toBe(true);
    expect(Object.keys(dummy.fx).some((k) => k.startsWith('exposed'))).toBe(true);
  });
});

describe('Wither (rotTouch)', () => {
  it('goes on hindering and withering the enemies near, stack on stack', () => {
    const { world, dummy } = createDummyWorld(holding(['crushingBlow', 'rotTouch']), {
      distance: 1.5,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    world.opts.godMode = true;
    for (let i = 0; i < 5 * 60; i++) stepWorld(world);
    expect(dummy.fx.withered).toBeDefined();
    expect(dummy.fx.withered!.n).toBeGreaterThan(3);
    expect(statusTaken(dummy).vulnType[4]).toBeGreaterThan(0.2);
  });
});
