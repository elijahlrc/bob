import { describe, expect, it } from 'vitest';
import { buildFor, classFor } from './gemKit';
import { killActor, playerConds } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { stanceFarLess, stanceOf } from './stances';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S9 (docs/SPIRIT.md): stances, rage, Blood Rage and the storms of a stance. */

const STR = classFor('str');
const DEX = classFor('dex');

function neighbour(w: World, x: number, y: number): Actor {
  const m = spawnMonster(
    w,
    { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
    x,
    y,
    0,
    0,
    'Neighbour',
  );
  m.def = dummyDefence({ maxLife: 1e9 });
  m.life = 1e9;
  return m;
}

function world(gems: string[], distance = 1.5, main = 'sword_3', cls = STR) {
  const run = createDummyWorld(buildFor(gems, main, cls), { distance, maxTime: 120 });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  return run;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('stances (Blood and Sand, Flesh and Stone)', () => {
  it('start in the Blood stance, hold mana, and swap to the Sand stance when a crowd is near', () => {
    const { world: w, dummy } = world(['whirlwindCleave', 'duneStance']);
    expect(stanceOf(w)).toBe('blood');
    expect(w.char.reservedMana).toBeGreaterThan(0);
    run(w, 0.5);
    expect(stanceOf(w)).toBe('blood');
    neighbour(w, dummy.x + 1, dummy.y + 1);
    neighbour(w, dummy.x + 1, dummy.y - 1);
    neighbour(w, dummy.x + 2, dummy.y);
    run(w, 2.5);
    expect(stanceOf(w)).toBe('sand');
  });

  it('Blood and Sand: more area damage over less area, or more area and less damage', () => {
    const { world: w, dummy } = world(['whirlwindCleave', 'duneStance']);
    const prof = () => w.char.profile(w.primary, playerConds(w, dummy));
    const blood = prof();
    w.buffT.bloodStance = 0;
    w.buffT.sandStance = 1e9;
    const sand = prof();
    expect(blood.hands[0].chunks[0].max).toBeGreaterThan(sand.hands[0].chunks[0].max);
    expect(sand.radiusMult).toBeGreaterThan(blood.radiusMult);
  });

  it('Flesh and Stone: the Blood stance maims the enemies near, the Sand stance blinds them and softens far attacks', () => {
    const { world: w, dummy } = world(['crushingBlow', 'stoneStance']);
    run(w, 1);
    expect(dummy.fx.maim).toBeDefined();
    expect(dummy.fx.maim!.x).toBeGreaterThan(10);
    expect(dummy.fx.blind).toBeUndefined();
    w.buffT.bloodStance = 0;
    w.buffT.sandStance = 1e9;
    w.utilityReady['@stance'] = w.t + 100; // hold the stance
    run(w, 1);
    expect(dummy.fx.blind).toBeDefined();
    // The far attacks do less: a hit from beyond the aura's reach, against one from inside.
    expect(stanceFarLess(w)).not.toBeNull();
    expect(stanceFarLess(w)!.less).toBeGreaterThan(0.08);
  });

  it('the stance is shared: a second stance gem does not make a second stance', () => {
    const { world: w } = world(['crushingBlow', 'duneStance', 'stoneStance']);
    w.buffT.sandStance = 1e9;
    w.buffT.bloodStance = 0;
    run(w, 0.2);
    expect(w.buffT.sandStance > 0 && w.buffT.bloodStance > 0).toBe(false);
  });
});

describe('Bladestorm (whirlwindCleave)', () => {
  it('leaves a storm that hits for a time, half as hard, and gives the character in it a buff of its stance', () => {
    const { world: w } = world(['whirlwindCleave']);
    let storm = false;
    let buff = false;
    for (let i = 0; i < 5 * 60; i++) {
      stepWorld(w);
      if (w.fields.some((f) => f.kind === 'bladestorm')) storm = true;
      if (w.buffT.bladestormBlood > 0) buff = true;
    }
    expect(storm).toBe(true);
    expect(buff).toBe(true);
    expect(w.buffT.bladestormSand).toBe(0);
    // It ends by itself.
    w.player.stunT = 1e9;
    run(w, 4);
    expect(w.fields.some((f) => f.kind === 'bladestorm')).toBe(false);
  });

  it('in the Sand stance the storm drifts and quickens the character instead', () => {
    const { world: w } = world(['whirlwindCleave']);
    w.buffT.bloodStance = 0;
    w.buffT.sandStance = 1e9;
    let moved = 0;
    let first: { x: number; y: number } | null = null;
    let sandBuff = false;
    for (let i = 0; i < 2 * 60; i++) {
      stepWorld(w);
      const f = w.fields.find((x) => x.kind === 'bladestorm');
      if (f) {
        first ??= { x: f.x, y: f.y };
        moved = Math.hypot(f.x - first.x, f.y - first.y);
      }
      if (w.buffT.bladestormSand > 0) sandBuff = true;
    }
    expect(moved).toBeGreaterThan(0.3);
    expect(sandBuff).toBe(true);
  });

  it('three storms at most', () => {
    const { world: w } = world(['whirlwindCleave']);
    let most = 0;
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(w);
      most = Math.max(most, w.fields.filter((f) => f.kind === 'bladestorm').length);
    }
    expect(most).toBeLessThanOrEqual(3);
    expect(most).toBeGreaterThanOrEqual(2);
  });
});

describe('Berserk (rampage)', () => {
  it('waits for rage, lasts as long as the rage does and spends it faster each second', () => {
    const { world: w, dummy } = world(['crushingBlow', 'rampage']);
    dummy.rarity = 'boss';
    w.rage = 0;
    run(w, 3);
    expect(w.buffT.berserk).toBe(0);
    w.rage = 30;
    for (let i = 0; i < 4 * 60 && w.buffT.berserk <= 0; i++) stepWorld(w);
    expect(w.buffT.berserk).toBeGreaterThan(0);
    const r1 = w.rage;
    run(w, 1);
    const r2 = w.rage;
    run(w, 1);
    const r3 = w.rage;
    expect(r1 - r2).toBeGreaterThan(0);
    // Each second it spends more than the one before.
    expect(r2 - r3).toBeGreaterThan(r1 - r2);
    let ended = -1;
    for (let i = 0; i < 20 * 60 && ended < 0; i++) {
      stepWorld(w);
      if (w.buffT.berserk === 0) ended = w.t;
    }
    expect(ended).toBeGreaterThan(0);
    expect(w.rage).toBe(0);
  });

  it('its cooldown starts when it ends', () => {
    const { world: w, dummy } = world(['crushingBlow', 'rampage']);
    dummy.rarity = 'boss';
    w.rage = 12;
    let ended = -1;
    for (let i = 0; i < 20 * 60 && ended < 0; i++) {
      stepWorld(w);
      if (w.t > 0.6 && w.buffT.berserk === 0) ended = w.t;
    }
    expect(ended).toBeGreaterThan(0);
    const key = w.char.utilities.find((c) => c.skill.id === 'rampage')!.key;
    expect(w.utilityReady[key]).toBeGreaterThanOrEqual(ended + 4.5);
    expect(w.utilityReady[key]).toBeLessThan(ended + 5.5);
  });
});

describe('Blood Rage (bloodSurgeCall)', () => {
  it('costs life each second, a kill renews it, and it may give a charge', () => {
    const { world: w, dummy } = world(['crushingBlow', 'bloodSurgeCall'], 1.5, 'sword_3', DEX);
    dummy.rarity = 'boss';
    w.opts.freeResources = false;
    w.opts.godMode = false;
    // Let a cast happen.
    for (let i = 0; i < 3 * 60 && w.buffT.bloodSurge <= 0; i++) stepWorld(w);
    expect(w.buffT.bloodSurge).toBeGreaterThan(0);
    const before = w.player.life;
    const seconds = w.buffT.bloodSurge;
    w.player.stunT = 1e9;
    w.player.life = w.player.def.maxLife;
    run(w, 1);
    expect(w.player.life).toBeLessThan(w.player.def.maxLife * 0.97);
    expect(w.player.life).toBeGreaterThan(w.player.def.maxLife * 0.9);
    // A kill renews it.
    w.buffT.bloodSurge = 2;
    const m = neighbour(w, w.player.x + 2, w.player.y);
    m.def = dummyDefence({ maxLife: 10 });
    m.life = 1;
    killActor(w, m);
    expect(w.buffT.bloodSurge).toBeGreaterThan(seconds - 0.5);
    void before;
  });

  it('is let go when life runs low', () => {
    const { world: w } = world(['crushingBlow', 'bloodSurgeCall'], 1.5, 'sword_3', DEX);
    w.opts.freeResources = false;
    for (let i = 0; i < 3 * 60 && w.buffT.bloodSurge <= 0; i++) stepWorld(w);
    expect(w.buffT.bloodSurge).toBeGreaterThan(0);
    w.player.stunT = 1e9;
    w.player.life = w.player.def.maxLife * 0.2;
    run(w, 0.2);
    expect(w.buffT.bloodSurge).toBe(0);
  });
});
