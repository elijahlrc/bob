import { describe, expect, it } from 'vitest';
import { mitigate } from '../calc/combat';
import type { Build } from '../data/types';
import { buildFor, classFor } from './gemKit';
import { killActor, rawHit, targetState } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { pushDot } from './combat';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S7 (docs/SPIRIT.md): damage over time as a debuff of its own, and ailments that spread. */

const INT = classFor('int');
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

function world(build: Build, distance = 3, maxTime = 60) {
  const run = createDummyWorld(build, { distance, maxTime });
  run.world.opts.freeResources = true;
  return run;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('Contagion (creepingPlague)', () => {
  it('leaves a debuff on every enemy in the area that deals chaos damage over time, and no hit', () => {
    const { world: w, dummy } = world(buildFor(['creepingPlague'], 'wand_3', INT));
    const other = neighbour(w, dummy.x + 1, dummy.y + 0.5);
    let hits = 0;
    for (let i = 0; i < 2 * 60 && !dummy.sdots.length; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'hit' && e.src === w.player.id) hits++;
    }
    expect(dummy.sdots.some((d) => d.src === 'creepingPlague')).toBe(true);
    expect(other.sdots.some((d) => d.src === 'creepingPlague')).toBe(true);
    // The cast itself did not hit.
    expect(hits).toBe(0);
    const before = dummy.life;
    run(w, 1);
    expect(dummy.life).toBeLessThan(before);
  });

  it('is cast again when it is about to end, not while it holds', () => {
    const { world: w, dummy } = world(buildFor(['creepingPlague'], 'wand_3', INT));
    let casts = 0;
    for (let i = 0; i < 10 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'use' && e.skill === 'creepingPlague') casts++;
    }
    expect(casts).toBeGreaterThanOrEqual(2);
    expect(casts).toBeLessThanOrEqual(4);
    expect(dummy.sdots.length).toBeLessThanOrEqual(1);
  });

  it('passes on to the enemies near one that dies, with the time it had left', () => {
    const { world: w, dummy } = world(buildFor(['creepingPlague'], 'wand_3', INT));
    run(w, 1);
    const near = neighbour(w, dummy.x + 2.2, dummy.y);
    const far = neighbour(w, dummy.x + 12, dummy.y);
    const d = dummy.sdots.find((x) => x.src === 'creepingPlague')!;
    expect(d).toBeDefined();
    const left = d.t;
    expect(near.sdots.length).toBe(0);
    killActor(w, dummy);
    const copy = near.sdots.find((x) => x.src === 'creepingPlague');
    expect(copy).toBeDefined();
    expect(copy!.t).toBeCloseTo(left, 1);
    expect(far.sdots.length).toBe(0);
  });
});

describe('Withering Breath (Blight)', () => {
  it('adds a layer with each breath, each on its own time, up to twenty, and slows what was not withered', () => {
    const { world: w, dummy } = world(buildFor(['witheringBreath'], 'wand_3', INT), 3);
    let most = 0;
    let hinderSeen = false;
    for (let i = 0; i < 5 * 60; i++) {
      stepWorld(w);
      most = Math.max(most, dummy.sdots.filter((d) => d.layer).length);
      if (dummy.fx.hinder) hinderSeen = true;
    }
    expect(most).toBeGreaterThanOrEqual(5);
    expect(most).toBeLessThanOrEqual(20);
    expect(hinderSeen).toBe(true);
  });
});

describe('Scorching Ray (searingLance)', () => {
  it('gains a stage with each breath, hotter for each, and exposes to fire at the last', () => {
    const { world: w, dummy } = world(buildFor(['searingLance'], 'wand_3', INT), 3);
    let first = 0;
    let top = 0;
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(w);
      const d = dummy.sdots.find((x) => x.src === 'searingLance');
      if (d && first === 0) first = d.raw;
      if (d) top = Math.max(top, d.raw);
    }
    expect(top).toBeGreaterThan(first * 3);
    expect(dummy.fx.exposedFire).toBeDefined();
  });

  it('keeps burning for a moment after the ray leaves', () => {
    const { world: w, dummy } = world(buildFor(['searingLance'], 'wand_3', INT), 3);
    run(w, 2);
    w.player.stunT = 1e9;
    const before = dummy.life;
    run(w, 1);
    expect(dummy.life).toBeLessThan(before);
    run(w, 3);
    expect(dummy.sdots.some((d) => d.src === 'searingLance')).toBe(false);
  });
});

describe('Essence Drain (sapBolt)', () => {
  it('leaves a debuff on the enemies where it lands, and the caster mends from it', () => {
    const { world: w, dummy } = world(buildFor(['sapBolt'], 'wand_3', INT));
    const next = neighbour(w, dummy.x + 0.8, dummy.y);
    run(w, 1.5);
    expect(dummy.sdots.some((d) => d.src === 'sapBolt')).toBe(true);
    expect(next.sdots.some((d) => d.src === 'sapBolt')).toBe(true);
    w.opts.freeResources = false;
    w.player.life = 1;
    const l0 = w.player.life;
    run(w, 1);
    expect(w.player.life).toBeGreaterThan(l0 + 1);
  });

  it('goes along with Contagion to the enemies near a corpse, but not without it', () => {
    const dot = (src: string, spreadR: number, carry: boolean) => ({
      src,
      dps: 10,
      raw: 10,
      type: 4,
      t: 3,
      layer: false,
      n: 1,
      spreadR,
      carry,
      regen: 0,
    });
    const { world: w, dummy } = world(buildFor(['sapBolt', 'creepingPlague'], 'wand_3', INT));
    const near = neighbour(w, dummy.x + 2, dummy.y);
    dummy.sdots.push(dot('creepingPlague', 2.5, false), dot('sapBolt', 0, true));
    killActor(w, dummy);
    expect(near.sdots.map((d) => d.src).sort()).toEqual(['creepingPlague', 'sapBolt']);
    const alone = world(buildFor(['sapBolt'], 'wand_3', INT));
    const next = neighbour(alone.world, alone.dummy.x + 2, alone.dummy.y);
    alone.dummy.sdots.push(dot('sapBolt', 0, true));
    killActor(alone.world, alone.dummy);
    expect(next.sdots.length).toBe(0);
  });
});

describe('Caustic Arrow (acidArrow)', () => {
  it('leaves ground that afflicts what stands in it, and nothing sticks to what leaves it', () => {
    const { world: w, dummy } = world(buildFor(['acidArrow'], 'bow_3', DEX));
    const far = neighbour(w, dummy.x + 8, dummy.y);
    let ground = false;
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(w);
      if (w.fields.some((f) => f.kind === 'caustic')) ground = true;
    }
    expect(ground).toBe(true);
    expect(dummy.sdots.some((d) => d.src === 'acidArrow')).toBe(true);
    expect(far.sdots.length).toBe(0);
    // Patches do not add up: still one debuff, and it ends soon after the ground.
    expect(dummy.sdots.filter((d) => d.src === 'acidArrow').length).toBe(1);
    w.player.stunT = 1e9;
    run(w, 4);
    expect(dummy.sdots.length).toBe(0);
  });
});

describe('Torch Arrow (torchArrow)', () => {
  it('an ignite it causes also leaves burning debuffs, a few at once', () => {
    const { world: w, dummy } = world(buildFor(['torchArrow'], 'bow_3', DEX));
    let most = 0;
    for (let i = 0; i < 20 * 60; i++) {
      stepWorld(w);
      most = Math.max(most, dummy.sdots.filter((d) => d.src === '@burning').length);
    }
    expect(most).toBeGreaterThanOrEqual(1);
    expect(most).toBeLessThanOrEqual(5);
  });
});

describe('Decay (slowRot) and Vile Toxins (foulBrew)', () => {
  it('Decay: a hit leaves flat chaos damage over time, one at a time, that is not poison', () => {
    const { world: w, dummy } = world(buildFor(['sapBolt', 'slowRot'], 'wand_3', INT));
    run(w, 4);
    const decays = dummy.sdots.filter((d) => d.src === '@decay');
    expect(decays.length).toBe(1);
    expect(dummy.ail.poisons.length).toBe(0);
    expect(decays[0].type).toBe(4);
  });

  it('Vile Toxins: a hit deals more for each poison on the target, up to a limit', () => {
    const { world: w, dummy } = world(buildFor(['sapBolt', 'foulBrew'], 'wand_3', INT));
    const prof = w.char.profile(w.primary, 0);
    expect(prof.perPoison).not.toBeNull();
    const dmg = () => {
      const t = targetState(dummy);
      const d = [0, 0, 0, 0, 1000];
      return mitigate(prof, t, d)[4];
    };
    const none = dmg();
    for (let i = 0; i < 3; i++) pushDot(dummy.ail.poisons, { dps: 1, t: 10 }, 400);
    const three = dmg();
    for (let i = 0; i < 30; i++) pushDot(dummy.ail.poisons, { dps: 1, t: 10 }, 400);
    const many = dmg();
    const per = prof.perPoison!.per / 100;
    expect(three / none).toBeCloseTo(1 + per * 3, 5);
    expect(many / none).toBeCloseTo(1 + per * prof.perPoison!.max, 5);
  });
});

describe('Wildfire Seed and Elemental Proliferation', () => {
  it('an ignite spreads while its carrier burns, to the enemies near it only, and the copies do not spread', () => {
    const { world: w, dummy } = world(buildFor(['torchArrow', 'wildfireSeed'], 'bow_3', DEX));
    const near = neighbour(w, dummy.x + 1.5, dummy.y);
    const far = neighbour(w, dummy.x + 9, dummy.y);
    const farther = neighbour(w, near.x + 1.4, near.y + 2.5);
    let got = false;
    for (let i = 0; i < 30 * 60 && !got; i++) {
      stepWorld(w);
      got = near.ail.ignites.length > 0;
    }
    expect(dummy.ail.ignites.some((d) => d.spread)).toBe(true);
    expect(near.ail.ignites.length).toBeGreaterThan(0);
    expect(near.ail.ignites.every((d) => !d.spread)).toBe(true);
    expect(far.ail.ignites.length).toBe(0);
    expect(farther.ail.ignites.length).toBe(0);
  });

  it('shock spreads with Elemental Proliferation, and again as the carrier dies', () => {
    const { world: w, dummy } = world(buildFor(['searingLance', 'wildfireSpread'], 'wand_3', INT));
    const near = neighbour(w, dummy.x + 1.5, dummy.y);
    dummy.ail.shock = 0.2;
    dummy.ail.shockT = 4;
    dummy.ail.spreadEle = 2;
    run(w, 1);
    expect(near.ail.shock).toBeGreaterThan(0);
    expect(near.ail.spreadEle).toBe(0);
  });
});

describe('Bane (ruinRitual)', () => {
  it('puts a debuff on the enemies, with the curses linked to it, and is stronger and longer for each', () => {
    const plain = world(buildFor(['ruinRitual'], 'wand_3', INT));
    run(plain.world, 1.5);
    const a = plain.dummy.sdots.find((d) => d.src === 'ruinRitual')!;
    expect(a).toBeDefined();
    expect(plain.dummy.hexes.length).toBe(0);

    const linked = world(buildFor(['ruinRitual', 'tinderCurse', 'leadenLimbs'], 'wand_3', INT));
    run(linked.world, 1.5);
    const b = linked.dummy.sdots.find((d) => d.src === 'ruinRitual')!;
    expect(b).toBeDefined();
    expect(linked.dummy.hexes.length).toBeGreaterThanOrEqual(1);
    expect(b.raw).toBeGreaterThan(a.raw * 1.2);
  });
});

describe('Toxic Rain (venomShower)', () => {
  it('drops pods that afflict and slow what is near them, and burst after a moment', () => {
    const { world: w, dummy } = world(buildFor(['venomShower'], 'bow_3', DEX));
    let pods = 0;
    let slowed = false;
    let bursts = 0;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(w);
      pods = Math.max(pods, w.fields.filter((f) => f.kind === 'pod').length);
      if (dummy.fx.hinder) slowed = true;
      for (const e of w.events) if (e.t === 'hit' && e.dst === dummy.id) bursts++;
    }
    expect(pods).toBeGreaterThanOrEqual(5);
    expect(dummy.sdots.some((d) => d.src === 'venomShower')).toBe(true);
    expect(slowed).toBe(true);
    expect(bursts).toBeGreaterThan(0);
  });
});

describe('Herald of Ash (cinderHerald)', () => {
  it('a kill sets the enemies near the corpse burning by the damage it had to spare', () => {
    const { world: w, dummy } = world(
      buildFor(['crushingBlow', 'cinderHerald'], 'sword_3', classFor('str')),
      1.4,
    );
    const near = neighbour(w, dummy.x + 1.5, dummy.y);
    const far = neighbour(w, dummy.x + 9, dummy.y);
    w.player.stunT = 1e9;
    dummy.def = dummyDefence({ maxLife: 100 });
    dummy.life = 100;
    rawHit(w, dummy, 1100, 0);
    expect(dummy.alive).toBe(false);
    const burn = near.sdots.find((d) => d.src === '@herald');
    expect(burn).toBeDefined();
    expect(burn!.raw).toBeGreaterThan(200);
    expect(far.sdots.length).toBe(0);
  });
});
