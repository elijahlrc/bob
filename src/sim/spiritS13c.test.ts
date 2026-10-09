import { describe, expect, it } from 'vitest';
import { distanceMult } from '../calc/skill';
import { buildFor, classFor } from './gemKit';
import { createDummyWorld, dummyDefence } from './dummy';
import { playerConds, rawHit } from './combat';
import type { Actor, World } from './types';
import { tickSupports } from './supportFx';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S13c (docs/SPIRIT.md): the supports. */

const INT = classFor('int');
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

function world(gems: string[], distance: number, main: string, cls: string) {
  const run = createDummyWorld(buildFor(gems, main, cls), { distance, maxTime: 120 });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  run.dummy.def = dummyDefence({ maxLife: 1e9 });
  run.dummy.life = 1e9;
  return run;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

const profile = (gems: string[], main: string, cls: string, conds = 0) => {
  const { world: w } = world(gems, 3, main, cls);
  return w.char.profile(w.primary, conds);
};

const maxHit = (p: ReturnType<typeof profile>) => p.hands[0].chunks.reduce((s, c) => s + c.max, 0);

describe('strength and weapons (firmHold, steelResolve, knifeRange, veilCut, shatteringBlows, twinShadow)', () => {
  it('Firm Hold and Steel Resolve extend the strength bonus to projectile attacks and spells', () => {
    const plain = profile(['splitVolley'], 'bow_3', DEX);
    const grip = profile(['splitVolley', 'firmHold'], 'bow_3', DEX);
    expect(maxHit(grip)).toBeGreaterThan(maxHit(plain) * 1.0);
    const sp = profile(['frostLance'], 'wand_3', INT);
    const will = profile(['frostLance', 'steelResolve'], 'wand_3', INT);
    expect(maxHit(will)).toBeGreaterThan(maxHit(sp));
  });

  it('a support that limits the weapon makes the skill unusable with another', () => {
    const { world: ok } = world(['crushingBlow', 'knifeRange'], 3, 'sword_3', STR);
    expect(ok.char.primary.usable).toBe(true);
    const { world: bad } = world(['crushingBlow', 'knifeRange'], 3, 'mace_3', STR);
    expect(bad.char.warnings.some((x) => x.includes('limits'))).toBe(true);
    expect(bad.char.primary.skill.id).not.toBe('crushingBlow');
  });

  it('Close Combat: more melee damage near, none at five tiles', () => {
    const p = profile(['crushingBlow', 'knifeRange'], 'sword_3', STR);
    expect(p.closeCombat).toBeGreaterThanOrEqual(40);
    expect(distanceMult(p, 1.5)).toBeCloseTo(1 + p.closeCombat / 100, 5);
    expect(distanceMult(p, 5.3)).toBeCloseTo(1, 5);
    const mid = distanceMult(p, 3.65);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(1 + p.closeCombat / 100);
  });

  it('a hit with Close Combat gives Combat Rush', () => {
    const { world: w } = world(['crushingBlow', 'knifeRange'], 1.4, 'sword_3', STR);
    run(w, 3);
    expect(w.buffT.combatRush).toBeGreaterThan(0);
  });

  it('Shockwave: a melee hit sets off a shockwave on the others around, one a second', () => {
    const { world: w, dummy } = world(['crushingBlow', 'shatteringBlows'], 1.4, 'mace_3', STR);
    const near = neighbour(w, dummy.x + 1.2, dummy.y);
    let bursts = 0;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'explode') bursts++;
    }
    expect(near.life).toBeLessThan(1e9);
    // At most one a second.
    expect(bursts).toBeLessThanOrEqual(5);
    expect(bursts).toBeGreaterThanOrEqual(2);
  });

  it('Nightblade: a critical strike makes the character Elusive, which cannot be renewed while it lasts', () => {
    const { world: w } = world(['viperLash', 'veilCut'], 4, 'dagger_3', DEX);
    expect(w.char.primary.usable).toBe(true);
    let got = false;
    for (let i = 0; i < 30 * 60 && !got; i++) {
      stepWorld(w);
      got = w.buffT.elusive > 0;
    }
    expect(got).toBe(true);
    const left = w.buffT.elusive;
    run(w, 1);
    // Not renewed to full by the crits that follow.
    expect(w.buffT.elusive).toBeLessThanOrEqual(left);
  });
});

describe('Ruthless, Ancestral Call, Multistrike (mercilessCadence, echoingBlow, tripleCadence)', () => {
  it('every third use is a Ruthless Blow: much harder and it stuns', () => {
    const { world: w, dummy } = world(['crushingBlow', 'mercilessCadence'], 1.4, 'sword_3', STR);
    const amounts: number[] = [];
    let stuns = 0;
    for (let i = 0; i < 12 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) {
        if (e.t === 'hit' && e.dst === dummy.id) amounts.push(e.amount);
        if (e.t === 'stun' && e.dst === dummy.id) stuns++;
      }
    }
    expect(amounts.length).toBeGreaterThanOrEqual(9);
    // Strongest of each three beats the others on average by a lot.
    const groups = Math.floor(amounts.length / 3);
    let big = 0;
    let small = 0;
    for (let g = 0; g < groups; g++) {
      big += amounts[g * 3 + 2];
      small += (amounts[g * 3] + amounts[g * 3 + 1]) / 2;
    }
    expect(big / groups).toBeGreaterThan((small / groups) * 1.3);
    expect(stuns).toBeGreaterThanOrEqual(1);
  });

  it('Ancestral Call: the strike also hits two other enemies, and nothing extra without them', () => {
    const { world: w, dummy } = world(['crushingBlow', 'echoingBlow'], 1.4, 'sword_3', STR);
    const a = neighbour(w, dummy.x + 0.5, dummy.y + 0.9);
    const b = neighbour(w, dummy.x + 0.5, dummy.y - 0.9);
    const c = neighbour(w, dummy.x + 1.0, dummy.y);
    run(w, 3);
    const hurt = [a, b, c].filter((m) => m.life < 1e9).length;
    expect(hurt).toBeGreaterThanOrEqual(2);
    expect(dummy.life).toBeLessThan(1e9);
  });

  it('Multistrike: three strikes, the repeats ramping and going to enemies near', () => {
    const { world: w, dummy } = world(['crushingBlow', 'tripleCadence'], 1.4, 'sword_3', STR);
    const other = neighbour(w, dummy.x + 0.6, dummy.y + 0.8);
    const p = w.char.profile(w.primary, playerConds(w, dummy));
    expect(p.repeats).toBe(2);
    expect(p.multistrike?.ramp).toBe(22);
    run(w, 6);
    expect(dummy.life).toBeLessThan(1e9);
    expect(other.life).toBeLessThan(1e9);
  });
});

describe('Spell Cascade, Intensify, Unleash (flankingCast, swellingBlast, doubleRelease)', () => {
  it('Spell Cascade: the spell lands three times, before and behind its target too', () => {
    const { world: w } = world(['suddenFrost', 'flankingCast'], 4, 'wand_3', INT);
    const xs: number[] = [];
    for (let i = 0; i < 90 && xs.length < 3; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'explode') xs.push(e.x);
    }
    expect(xs.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(2);
  });

  it('Intensify: each cast builds a stack, and moving loses it', () => {
    const { world: w } = world(['suddenFrost', 'swellingBlast'], 4, 'wand_3', INT);
    run(w, 14);
    const n = w.intensity.suddenFrost ?? 0;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(4);
    w.player.action = null;
    w.player.moving = true;
    for (let i = 0; i < 30; i++) tickSupports(w, 1 / 60);
    expect(w.intensity.suddenFrost).toBe(n - 2);
    w.player.moving = false;
    for (let i = 0; i < 60; i++) tickSupports(w, 1 / 60);
    expect(w.intensity.suddenFrost).toBe(n - 2);
  });

  it('Unleash: seals gather while the spell rests, up to three, and the next cast spends them as repeats', () => {
    const { world: w } = world(['frostLance', 'doubleRelease'], 6, 'wand_3', INT);
    w.player.action = null;
    for (let i = 0; i < 4 * 60; i++) tickSupports(w, 1 / 60);
    const had = w.seals.frostLance.n;
    expect(had).toBe(3);
    run(w, 1);
    expect(w.seals.frostLance.n).toBeLessThan(had);
  });
});

describe('Immolate, Combustion (cindering, kindle, tinderbox)', () => {
  it('Cindering and Kindle add fire damage only against burning enemies', () => {
    const { world: w, dummy } = world(['suddenFrost', 'cindering'], 3, 'wand_3', INT);
    const cold = w.char.profile(w.primary, playerConds(w, dummy));
    dummy.ail.ignites.push({ dps: 5, t: 5 });
    const hot = w.char.profile(w.primary, playerConds(w, dummy));
    const fire = (p: typeof cold) =>
      p.hands[0].chunks.filter((c) => c.type === 3).reduce((s, c) => s + c.max, 0);
    expect(fire(cold)).toBe(0);
    expect(fire(hot)).toBeGreaterThan(40);
    const k = world(['crushingBlow', 'kindle'], 1.4, 'sword_3', STR);
    const k0 = k.world.char.profile(k.world.primary, playerConds(k.world, k.dummy));
    k.dummy.ail.ignites.push({ dps: 5, t: 5 });
    const k1 = k.world.char.profile(k.world.primary, playerConds(k.world, k.dummy));
    expect(fire(k0)).toBe(0);
    expect(fire(k1)).toBeGreaterThan(40);
  });

  it('Combustion: an enemy the skill ignites has less fire resistance while it burns', () => {
    const { world: w, dummy } = world(['cleansingBlaze', 'tinderbox'], 3, 'wand_3', INT);
    let seen = false;
    for (let i = 0; i < 60 * 20 && !seen; i++) {
      stepWorld(w);
      if (dummy.ail.ignites.length > 0 && dummy.fx.exposedFire) seen = true;
    }
    expect(seen).toBe(true);
    expect(dummy.fx.exposedFire!.v).toBeGreaterThanOrEqual(10);
  });
});

describe('Energy Leech, Mirage Archer, Inspiration, Infused Channelling', () => {
  it('Energy Leech: damage dealt comes back as energy shield', () => {
    const build = buildFor(['crushingBlow', 'wardSiphon'], 'sword_3', STR);
    build.equipment.body!.uniqueMods = [{ stat: 'es', kind: 'base', value: 300 }];
    const r0 = createDummyWorld(build, { distance: 1.4, maxTime: 120 });
    const w = r0.world;
    w.opts.godMode = true;
    r0.dummy.def = dummyDefence({ maxLife: 1e9 });
    r0.dummy.life = 1e9;
    expect(w.player.def.maxEs).toBeGreaterThan(200);
    w.player.es = 0;
    let max = 0;
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(w);
      max = Math.max(max, w.player.es);
    }
    expect(max).toBeGreaterThan(0);
  });

  it('Mirage Archer: an arrow hit calls one archer that shoots with the skill for a while', () => {
    const { world: w, dummy } = world(['splitVolley', 'twinShadow'], 6, 'bow_3', DEX);
    let called = false;
    let shots = 0;
    for (let i = 0; i < 8 * 60; i++) {
      stepWorld(w);
      if (w.mirage) called = true;
      for (const e of w.events) if (e.t === 'use') shots++;
    }
    expect(called).toBe(true);
    expect(dummy.life).toBeLessThan(1e9);
    expect(shots).toBeGreaterThan(2);
  });

  it('Inspiration: the charges are all lost once the supported skills have spent too much mana', () => {
    const { world: w } = world(['suddenFrost', 'lightheart'], 4, 'wand_3', INT);
    const p = w.char.profile(w.primary, 0);
    expect(p.inspire).toBeGreaterThan(100);
    run(w, 3);
    expect(w.char.charges.insight).toBeGreaterThan(0);
    w.inspireMana = p.inspire + 1;
    run(w, 2);
    // The counter reset when the next use came.
    expect(w.inspireMana).toBeLessThan(p.inspire);
  });

  it('Infused Channelling: after a while of channelling you are Infused, and it stays six seconds', () => {
    const { world: w } = world(['flurryOfEdges', 'chargedBreath'], 1.4, 'sword_3', DEX);
    run(w, 3);
    expect(w.buffT.infusion).toBeGreaterThan(5);
  });
});

describe('durations, ailments and traps (briefBurst, lingeringEffect, freedRot, swiftSnares)', () => {
  it('Lingering Effect lengthens the ground a skill leaves, Brief Burst shortens it', () => {
    const base = world(['suddenFrost'], 3, 'wand_3', INT);
    const long = world(['suddenFrost', 'lingeringEffect'], 3, 'wand_3', INT);
    const short = world(['suddenFrost', 'briefBurst'], 3, 'wand_3', INT);
    const life = (r: ReturnType<typeof world>) => {
      for (let i = 0; i < 300 && r.world.fields.length === 0; i++) stepWorld(r.world);
      return r.world.fields[0].total;
    };
    const b = life(base);
    expect(life(long)).toBeGreaterThan(b * 1.3);
    expect(life(short)).toBeLessThan(b * 0.7);
  });

  it('Freed Rot and Swift Snares carry what the reference gems give', () => {
    const rot = profile(['crushingBlow', 'freedRot'], 'sword_3', STR);
    const plain = profile(['crushingBlow'], 'sword_3', STR);
    expect(rot.shock.effect).toBeGreaterThan(plain.shock.effect);
    expect(rot.chill.dur).toBeGreaterThan(plain.chill.dur);
    const snare = profile(['jawsTrap', 'swiftSnares'], 'wand_3', DEX);
    expect(snare.useTime).toBeLessThan(profile(['jawsTrap'], 'wand_3', DEX).useTime);
    expect(snare.skillDuration).toBeGreaterThan(1.05);
  });
});

describe('Blasphemy and Meat Shield (standingCurse, wardingPack)', () => {
  it('a curse under Blasphemy falls on every enemy within its reach, hit or not', () => {
    const { world: w, dummy } = world(
      ['crushingBlow', 'tinderCurse', 'standingCurse'],
      8,
      'sword_3',
      STR,
    );
    const near = neighbour(w, w.player.x + 2, w.player.y + 1);
    run(w, 2);
    expect(near.hexes.length).toBeGreaterThan(0);
    void dummy;
  });

  it('Meat Shield: the minions stay near the character and hit harder what is near it', () => {
    const { world: w } = world(['crushingBlow', 'stoneColossus', 'wardingPack'], 8, 'sword_3', STR);
    for (let i = 0; i < 6 * 60 && w.minions.length === 0; i++) stepWorld(w);
    const m = w.minions[0] as unknown as { defensive?: boolean; nearMore?: number };
    expect(m.defensive).toBe(true);
    expect(m.nearMore).toBeGreaterThanOrEqual(20);
  });
});

// A hit that kills is kept out of these tests.
void rawHit;
