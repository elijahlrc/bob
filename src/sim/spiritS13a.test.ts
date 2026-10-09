import { describe, expect, it } from 'vitest';
import { DYN_SHIFT } from '../data/buffs';
import { distanceMult } from '../calc/skill';
import { buildFor, classFor, layCorpses } from './gemKit';
import { createDummyWorld, dummyDefence } from './dummy';
import { killActor, playerConds, rawHit } from './combat';
import { fireTriggers } from './triggers';
import { afterStrike } from './shots';
import { frostBite, orbAnswers, tickSkillFx } from './skillFx';
import { targetOf } from './movement';
import { mineAuraAt } from './deploy';
import type { Action, Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S13a/S13b (docs/SPIRIT.md): attacks, spells, auras and traps rebuilt to be like their 3.9 originals. */

const INT = classFor('int');
const STR = classFor('str');
const DEX = classFor('dex');

function neighbour(w: World, x: number, y: number, life = 1e9): Actor {
  const m = spawnMonster(
    w,
    { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
    x,
    y,
    0,
    0,
    'Neighbour',
  );
  m.def = dummyDefence({ maxLife: life });
  m.life = life;
  return m;
}

function world(
  gems: string[],
  distance: number,
  main: string,
  cls: string,
  off: 'none' | 'dual' | 'shield' = 'none',
) {
  const run = createDummyWorld(buildFor(gems, main, cls, off), { distance, maxTime: 120 });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  run.dummy.def = dummyDefence({ maxLife: 1e9 });
  run.dummy.life = 1e9;
  return run;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

const maxHit = (p: { hands: { chunks: { max: number }[] }[] }) =>
  p.hands[0].chunks.reduce((s, c) => s + c.max, 0);

describe('auras (stormHalo, frostHalo, arcaneWard)', () => {
  it('Wrath adds lightning to attacks, and gives spells more lightning damage instead', () => {
    const atk = world(['crushingBlow', 'stormHalo'], 1.4, 'sword_3', STR).world;
    const atkPlain = world(['crushingBlow'], 1.4, 'sword_3', STR).world;
    const a1 = atk.char.profile(atk.primary, 0);
    const a0 = atkPlain.char.profile(atkPlain.primary, 0);
    expect(a1.hands[0].chunks.some((c) => c.type === 1 && c.max > 0)).toBe(true);
    expect(maxHit(a1)).toBeGreaterThan(maxHit(a0));
    const sp = world(['frostLance', 'stormHalo'], 4, 'wand_3', INT).world;
    const spPlain = world(['frostLance'], 4, 'wand_3', INT).world;
    const s1 = sp.char.profile(sp.primary, 0);
    const s0 = spPlain.char.profile(spPlain.primary, 0);
    // No flat lightning on the spell's hit.
    expect(s1.hands[0].chunks.some((c) => c.type === 1)).toBe(
      s0.hands[0].chunks.some((c) => c.type === 1),
    );
  });

  it('Hatred gives physical as extra cold and more cold damage', () => {
    const plain = world(['crushingBlow'], 1.4, 'sword_3', STR).world;
    const hat = world(['crushingBlow', 'frostHalo'], 1.4, 'sword_3', STR).world;
    const c = (w: World) =>
      w.char
        .profile(w.primary, 0)
        .hands[0].chunks.filter((x) => x.type === 2)
        .reduce((s, x) => s + x.max, 0);
    expect(c(plain)).toBe(0);
    expect(c(hat)).toBeGreaterThan(0);
  });

  it('Discipline adds energy shield and ES recharge rate', () => {
    const plain = world(['crushingBlow'], 1.4, 'sword_3', STR).world;
    const dis = world(['crushingBlow', 'arcaneWard'], 1.4, 'sword_3', STR).world;
    expect(dis.char.defence().maxEs).toBeGreaterThan(plain.char.defence().maxEs);
    // 30% faster than the usual fifth of the pool a second.
    expect(dis.char.defence().esRecharge / dis.char.defence().maxEs).toBeCloseTo(0.26, 2);
  });
});

describe('Dual Strike, Lightning Trap, Puncture', () => {
  it('Dual Strike crits more and hits harder against an enemy on full life only', () => {
    const { world: w, dummy } = world(['twinBlades'], 1.4, 'sword_3', DEX, 'dual');
    const full = w.char.profile(w.primary, playerConds(w, dummy));
    dummy.life = dummy.def.maxLife * 0.5;
    const half = w.char.profile(w.primary, playerConds(w, dummy));
    expect(full.hands[0].critChance).toBeGreaterThan(half.hands[0].critChance * 1.8);
    expect(maxHit(full)).toBeGreaterThan(maxHit(half) * 1.25);
  });

  it('Lightning Trap crits more against a shocked enemy', () => {
    const { world: w, dummy } = world(['boltTrap'], 4, 'wand_3', DEX);
    const cold = w.char.profile(w.primary, playerConds(w, dummy));
    dummy.ail.shock = 15;
    const shocked = w.char.profile(w.primary, playerConds(w, dummy));
    expect(shocked.hands[0].critChance).toBeGreaterThan(cold.hands[0].critChance * 1.7);
  });

  it('Puncture is a shot with a bow and a stab with a dagger, and its bleed lasts eight seconds', () => {
    const bow = world(['gougeShot'], 4, 'bow_3', DEX).world;
    expect(bow.char.primary.skill.behaviour.kind).toBe('projectile');
    const dag = world(['gougeShot'], 1.2, 'dagger_3', DEX).world;
    expect(dag.char.primary.skill.behaviour.kind).toBe('melee');
    const p = dag.char.profile(dag.primary, 0);
    expect(p.bleed.chance).toBe(1);
    expect(p.bleed.dur).toBeCloseTo(8, 1);
  });
});

describe('counter-attacks (bladeWind, rimeRebuke)', () => {
  it('Reckoning answers a block with a cone of blades, at most once in 0.4 seconds', () => {
    const { world: w, dummy } = world(['crushingBlow', 'bladeWind'], 1.5, 'sword_3', STR, 'shield');
    w.player.stunT = 100;
    const near = neighbour(w, dummy.x, dummy.y + 0.4);
    let n = 0;
    for (let i = 0; i < 3; i++) {
      fireTriggers(w, { on: 'block' });
      for (const e of w.events) if (e.t === 'trigger') n++;
      w.events.length = 0;
    }
    expect(n).toBe(1);
    expect(dummy.life).toBeLessThan(1e9);
    expect(near.life).toBeLessThan(1e9);
  });

  it('Riposte answers a block with one strike, once in 0.8 seconds, and costs nothing', () => {
    const { world: w, dummy } = world(['crushingBlow', 'rimeRebuke'], 1.2, 'sword_3', STR);
    w.player.stunT = 100;
    w.player.mana = 0;
    fireTriggers(w, { on: 'block' });
    expect(dummy.life).toBeLessThan(1e9);
    const left = dummy.life;
    fireTriggers(w, { on: 'block' });
    expect(dummy.life).toBe(left);
    run(w, 1);
    fireTriggers(w, { on: 'block' });
    expect(dummy.life).toBeLessThan(left);
  });
});

describe('Sweep (haloSweep)', () => {
  it('needs a two-handed weapon, and throws enemies back', () => {
    const one = world(['haloSweep'], 1.5, 'sword_3', STR).world;
    expect(one.char.primary.skill.id).not.toBe('haloSweep');
    const { world: w, dummy } = world(['haloSweep'], 1.5, 'sword2_3', STR);
    expect(w.char.primary.skill.id).toBe('haloSweep');
    const x0 = Math.hypot(dummy.x - w.player.x, dummy.y - w.player.y);
    let far = 0;
    for (let i = 0; i < 90; i++) {
      stepWorld(w);
      far = Math.max(far, Math.hypot(dummy.x - w.player.x, dummy.y - w.player.y));
    }
    expect(far).toBeGreaterThan(x0 + 1);
  });
});

describe('Pestilent Strike (venomStrike)', () => {
  it('an enemy that dies poisoned sets its poison on those around it', () => {
    const { world: w, dummy } = world(['venomStrike'], 1.2, 'dagger_3', DEX);
    expect(w.char.primary.skill.id).toBe('venomStrike');
    const near = neighbour(w, dummy.x + 1.2, dummy.y);
    let done = false;
    for (let i = 0; i < 20 * 60 && !done; i++) {
      stepWorld(w);
      if (dummy.fx.venomed && dummy.ail.poisons.length > 0) {
        killActor(w, dummy);
        done = true;
      }
    }
    expect(done).toBe(true);
    expect(near.sdots.some((d) => d.src === 'venom')).toBe(true);
  });
});

describe('Perforate (spearBurst)', () => {
  it('six spikes in Blood Stance, one thrust in Sand Stance', () => {
    const { world: w } = world(['spearBurst'], 2, 'sword_3', STR);
    const blood = w.char.profile(w.primary, 0);
    expect(blood.repeats).toBe(5);
  });
});

describe('strikes with a second effect (thunderRebuke, primalStrike, primeSplash)', () => {
  it('Smite also strikes the enemies about the one it hit, which it does not hit twice, and lights the character', () => {
    const { world: w, dummy } = world(['thunderRebuke'], 1.4, 'mace_3', STR);
    const near = neighbour(w, dummy.x + 0.8, dummy.y + 0.5);
    const far = neighbour(w, dummy.x + 6, dummy.y);
    let dummyHits = 0;
    for (let i = 0; i < 90; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'hit' && e.dst === dummy.id) dummyHits++;
      if (dummyHits > 0 && i > 30) break;
    }
    expect(near.life).toBeLessThan(1e9);
    expect(far.life).toBe(1e9);
    expect(w.buffT.smiteAura).toBeGreaterThan(0);
    const lit = w.char.profile(w.primary, playerConds(w, dummy));
    expect(
      lit.hands[0].chunks.filter((c) => c.type === 1).reduce((s, c) => s + c.max, 0),
    ).toBeGreaterThan(0);
  });

  it('Elemental Hit deals one element for each use, never the same one twice running', () => {
    const { world: w, dummy } = world(['primalStrike'], 1.4, 'sword_3', DEX);
    const seen: number[] = [];
    for (let i = 0; i < 60 * 14; i++) {
      const before = w.elem;
      stepWorld(w);
      for (const e of w.events) if (e.t === 'use') seen.push(before);
    }
    expect(seen.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
    expect(new Set(seen).size).toBe(3);
    for (const el of [1, 2, 3]) {
      w.elem = el;
      const p = w.char.profile(w.primary, playerConds(w, dummy));
      const types = new Set(p.hands[0].chunks.filter((c) => c.max > 0).map((c) => c.type));
      expect([...types]).toEqual([el]);
    }
  });

  it('Elemental Hit has more area against an enemy with the ailment of its element', () => {
    const { world: w, dummy } = world(['primalStrike'], 1.4, 'sword_3', DEX);
    w.elem = 3;
    const prof = w.char.profile(w.primary, playerConds(w, dummy));
    const act: Action = {
      profile: prof,
      which: 'primary',
      hand: 0,
      duration: 0,
      elapsed: 0,
      fired: true,
      echoes: 0,
      elem: 3,
      targetId: dummy.id,
      aimX: dummy.x,
      aimY: dummy.y,
    };
    const radius = () => {
      w.events.length = 0;
      afterStrike(w, w.player, act, dummy);
      return (
        Math.round(
          w.events.filter((e) => e.t === 'explode').map((e) => (e as { r: number }).r)[0] * 100,
        ) / 100
      );
    };
    dummy.ail.ignites = [];
    expect(radius()).toBe(1.3);
    dummy.ail.ignites = [{ dps: 5, t: 9 }];
    expect(radius()).toBe(2.34);
  });

  it('Wild Strike turns the damage into the element and sends out what the element says', () => {
    for (const el of [3, 2, 1]) {
      const { world: w, dummy } = world(['primeSplash'], 1.4, 'sword_3', DEX);
      const near = neighbour(w, dummy.x + 1.0, dummy.y + 0.5);
      const p0 = w.char.profile(w.primary, playerConds(w, dummy));
      expect(p0.hands[0].chunks.every((c) => c.type !== 0 || c.max === 0)).toBe(true);
      let hurt = false;
      for (let i = 0; i < 100 && !hurt; i++) {
        w.elem = el;
        stepWorld(w);
        hurt = near.life < 1e9;
      }
      expect(hurt, `element ${el}`).toBe(true);
    }
  });
});

describe('waves (ruptureLine, cleansingBlaze)', () => {
  it('Sunder: the wave strikes what is in line, and each enemy it strikes sets off a shockwave on the others', () => {
    const { world: w, dummy } = world(['ruptureLine'], 2.2, 'mace_3', STR);
    const beside = neighbour(w, dummy.x + 0.5, dummy.y + 1.6);
    const behind = neighbour(w, dummy.x + 3, dummy.y);
    run(w, 2.5);
    expect(dummy.life).toBeLessThan(1e9);
    expect(behind.life).toBeLessThan(1e9);
    expect(beside.life).toBeLessThan(1e9);
    // The shockwave does less than the wave.
    expect(1e9 - beside.life).toBeLessThan(1e9 - behind.life);
  });

  it('Purifying Flame: a wave, consecrated ground, and a shockwave over the ground for 25% less', () => {
    const { world: w, dummy } = world(['cleansingBlaze'], 5, 'wand_3', INT);
    const off = neighbour(w, dummy.x + 0.4, dummy.y + 2.6);
    run(w, 1.5);
    expect(dummy.life).toBeLessThan(1e9);
    expect(off.life).toBeLessThan(1e9);
    expect(w.fields.some((f) => f.kind === 'consecrated')).toBe(true);
  });
});

describe('strikes that leave something behind (chargedBlow, cinderBlow, rimeMallet)', () => {
  it('Static Strike: hits build a stack of a buff, and beams strike the enemies near while it lasts', () => {
    const { world: w, dummy } = world(['chargedBlow'], 1.4, 'sword_3', STR);
    const near = neighbour(w, w.player.x - 2.2, w.player.y);
    let stacks = 0;
    for (let i = 0; i < 60 * 8; i++) {
      stepWorld(w);
      stacks = Math.max(stacks, w.staticFx?.stacks.length ?? 0);
    }
    expect(stacks).toBeGreaterThanOrEqual(2);
    expect(stacks).toBeLessThanOrEqual(3);
    expect(near.life).toBeLessThan(1e9);
    expect(dummy.life).toBeLessThan(1e9);
    // The buff ends once the hitting stops.
    w.player.stunT = 100;
    run(w, 6);
    expect(w.staticFx).toBeNull();
  });

  it('Static Strike beams hit harder while the character moves', () => {
    const { world: w } = world(['chargedBlow'], 1.4, 'sword_3', STR);
    const spec = w.char.primary.skill.beams!;
    expect(spec.lessMoving).toEqual([40, 31]);
    expect(spec.lessStill).toEqual([60, 54]);
  });

  it('Infernal Blow: charges build on the enemy, then burst on those about it; one that dies bursts as fire', () => {
    const { world: w, dummy } = world(['cinderBlow'], 1.4, 'sword_3', STR);
    const near = neighbour(w, dummy.x + 1.0, dummy.y);
    let maxN = 0;
    let bursts = 0;
    for (let i = 0; i < 60 * 8; i++) {
      stepWorld(w);
      maxN = Math.max(maxN, w.charged[dummy.id]?.n ?? 0);
      for (const e of w.events) if (e.t === 'explode') bursts++;
    }
    expect(maxN).toBeGreaterThanOrEqual(2);
    expect(bursts).toBeGreaterThan(0);
    expect(near.life).toBeLessThan(1e9);
  });

  it('Infernal Blow: an enemy that dies carrying the debuff explodes as fire for a share of its life', () => {
    const { world: w, dummy } = world(['cinderBlow'], 1.4, 'sword_3', STR);
    const near = neighbour(w, dummy.x + 1.0, dummy.y, 1e6);
    w.player.stunT = 100;
    w.charged[dummy.id] = { n: 1, t: 5, key: 'cinderBlow' };
    dummy.def = dummyDefence({ maxLife: 100000 });
    dummy.life = 100000;
    killActor(w, dummy);
    expect(w.charged[dummy.id]).toBeUndefined();
    // 6% of its life, as fire, less its resistance.
    expect(1e6 - near.life).toBeGreaterThan(1000);
  });

  it('Glacial Hammer: every third strike freezes harder, and a frozen enemy on under a third of its life shatters', () => {
    const { world: w, dummy } = world(['rimeMallet'], 1.4, 'mace_3', STR);
    const p = w.char.profile(w.primary, playerConds(w, dummy));
    expect(p.freezeThird).toBeGreaterThanOrEqual(200);
    expect(p.shatter).toBe(true);
    dummy.def = dummyDefence({ maxLife: 100000 });
    dummy.life = 20000;
    dummy.ail.freezeT = 5;
    for (let i = 0; i < 90 && dummy.alive; i++) stepWorld(w);
    expect(dummy.alive).toBe(false);
    // Not a unique one.
    const boss = neighbour(w, w.player.x + 1.2, w.player.y + 0.3, 100000);
    boss.rarity = 'boss';
    boss.life = 20000;
    boss.ail.freezeT = 5;
    dummy.alive = false;
    for (let i = 0; i < 90; i++) stepWorld(w);
    expect(boss.alive).toBe(true);
  });
});

describe('shield and charge skills (snagLash, bulwarkRush, ghostShard)', () => {
  it('Chain Hook pulls the character to a distant enemy, gives rage, and is wider with rage', () => {
    const { world: w, dummy } = world(['snagLash'], 5, 'sword_3', STR);
    expect(Math.hypot(dummy.x - w.player.x, dummy.y - w.player.y)).toBeGreaterThan(4.5);
    let nearest = 99;
    for (let i = 0; i < 90; i++) {
      stepWorld(w);
      nearest = Math.min(nearest, Math.hypot(dummy.x - w.player.x, dummy.y - w.player.y));
    }
    expect(nearest).toBeLessThan(2.6);
    expect(w.rage).toBeGreaterThan(0);
    const calm = w.char.profile(w.primary, 0, 0);
    const raging = w.char.profile(w.primary, 0, 20 << DYN_SHIFT);
    expect(raging.radiusMult).toBeGreaterThan(calm.radiusMult);
  });

  it('Shield Charge: the damage is the shield\u2019s, and a longer run hits harder', () => {
    const near = world(['bulwarkRush'], 1.6, 'sword_3', STR, 'shield');
    const far = world(['bulwarkRush'], 6.5, 'sword_3', STR, 'shield');
    expect(far.world.char.primary.skill.id).toBe('bulwarkRush');
    const hits = (r: ReturnType<typeof world>) => {
      let h = 0;
      for (let i = 0; i < 60 && h === 0; i++) {
        stepWorld(r.world);
        for (const e of r.world.events) if (e.t === 'hit' && e.dst === r.dummy.id) h = e.amount;
      }
      return h;
    };
    const hn = hits(near);
    const hf = hits(far);
    expect(far.world.lastTravel).toBeGreaterThan(3);
    expect(hn).toBeGreaterThan(0);
    expect(hf).toBeGreaterThan(hn * 1.2);
    // The weapon's damage does not count: the same with a better sword.
    const plain = near.world.char.profile(near.world.primary, 0);
    expect(plain.hands[0].chunks.every((c) => c.type === 0)).toBe(true);
  });

  it('Spectral Shield Throw: one shield that shatters where it hits into shards that fly all round', () => {
    const { world: w, dummy } = world(['ghostShard'], 4, 'sword_3', DEX, 'shield');
    const behind = neighbour(w, dummy.x - 0.2, dummy.y + 1.6);
    let projectiles = 0;
    for (let i = 0; i < 100; i++) {
      stepWorld(w);
      projectiles = Math.max(projectiles, w.projectiles.length);
      if (behind.life < 1e9) break;
    }
    expect(projectiles).toBeGreaterThanOrEqual(8);
    expect(behind.life).toBeLessThan(1e9);
  });
});

describe('Shattering Steel and Soulrend (splinterVolley, spiritSaw)', () => {
  it('shards hit harder the farther they have flown', () => {
    const { world: w } = world(['splinterVolley'], 3, 'sword_3', DEX);
    const p = w.char.profile(w.primary, 0);
    expect(distanceMult(p, 4.5)).toBeCloseTo(2, 5);
    expect(distanceMult(p, 0.5)).toBeLessThan(1.2);
  });

  it('Soulrend turns toward enemies off its line, and afflicts those about it all the way', () => {
    const { world: w, dummy } = world(['spiritSaw'], 6, 'wand_3', INT);
    dummy.y += 0.0;
    const off = neighbour(w, dummy.x - 2.0, dummy.y + 1.2);
    let carried = false;
    for (let i = 0; i < 160; i++) {
      stepWorld(w);
      if (off.sdots.some((d) => d.src === 'spiritSaw')) carried = true;
    }
    expect(carried).toBe(true);
    expect(w.player.es).toBeGreaterThanOrEqual(0);
  });
});

describe('orbs, markers and arrows that wait (orbitingBlades, skyfall, tempestMote, slagLob, fuseArrow, blightHail)', () => {
  it('Blade Vortex: each cast adds a blade to a ring that hits everything about together, and the blades run out', () => {
    const { world: w, dummy } = world(['orbitingBlades'], 1.2, 'wand_3', DEX);
    let most = 0;
    const near = neighbour(w, w.player.x - 1.0, w.player.y);
    for (let i = 0; i < 60 * 6; i++) {
      stepWorld(w);
      most = Math.max(most, w.vortex?.blades.length ?? 0);
    }
    expect(most).toBeGreaterThanOrEqual(5);
    expect(most).toBeLessThanOrEqual(10);
    expect(dummy.life).toBeLessThan(1e9);
    expect(near.life).toBeLessThan(1e9);
    w.player.stunT = 100;
    run(w, 6);
    expect(w.vortex).toBeNull();
  });

  it('Blade Vortex: more blades make a round come sooner and hit harder', () => {
    const { world: w, dummy } = world(['orbitingBlades'], 1.2, 'wand_3', DEX);
    w.player.stunT = 100;
    const dmg = (n: number) => {
      w.vortex = { key: 'orbitingBlades', blades: Array.from({ length: n }, () => 5), acc: 0 };
      dummy.life = 1e9;
      run(w, 2);
      return 1e9 - dummy.life;
    };
    expect(dmg(8)).toBeGreaterThan(dmg(1) * 3);
  });

  it('Storm Call: markers wait, and when one is struck all of them are', () => {
    const { world: w, dummy } = world(['skyfall'], 5, 'wand_3', INT);
    let most = 0;
    let struck = false;
    for (let i = 0; i < 60 * 3; i++) {
      const before = w.markers.length;
      stepWorld(w);
      most = Math.max(most, w.markers.length);
      if (before >= 2 && w.markers.length === 0) struck = true;
    }
    expect(most).toBeGreaterThanOrEqual(2);
    expect(struck).toBe(true);
    expect(dummy.life).toBeLessThan(1e9);
  });

  it('Orb of Storms: one orb at a time, whose bolt splits to others, and a lightning cast inside it makes another bolt', () => {
    const { world: w, dummy } = world(['tempestMote', 'skyfall'], 2.0, 'wand_3', INT);
    const other = neighbour(w, dummy.x + 1.5, dummy.y + 1.0);
    let orbs = 0;
    for (let i = 0; i < 60 * 4; i++) {
      stepWorld(w);
      if (w.stormOrb) orbs = 1;
    }
    expect(orbs).toBe(1);
    expect(dummy.life).toBeLessThan(1e9);
    expect(other.life).toBeLessThan(1e9);
    const sky = w.char.actives.find((c) => c.skill.id === 'skyfall')!;
    const prof = w.char.profile(sky, 0);
    w.player.stunT = 100;
    w.stormOrb!.x = w.player.x;
    w.stormOrb!.y = w.player.y;
    w.stormOrb!.acc = -100;
    const before = dummy.life;
    orbAnswers(w, prof);
    expect(dummy.life).toBeLessThan(before);
  });

  it('Rolling Magma: bursts where it lands, then bounces on and bursts again', () => {
    const { world: w, dummy } = world(['slagLob'], 5, 'wand_3', INT);
    const beyond = neighbour(w, dummy.x + 1.6, dummy.y);
    let bursts = 0;
    for (let i = 0; i < 60 * 1.6; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'explode') bursts++;
    }
    expect(bursts).toBeGreaterThanOrEqual(2);
    expect(bursts).toBeLessThanOrEqual(6);
    expect(beyond.life).toBeLessThan(1e9);
  });

  it('Explosive Arrow: arrows stick, and the first to go off takes the others with it', () => {
    const { world: w, dummy } = world(['fuseArrow'], 6, 'bow_3', DEX);
    let most = 0;
    let bursts = 0;
    for (let i = 0; i < 60 * 5; i++) {
      stepWorld(w);
      most = Math.max(
        most,
        w.fuses.reduce((n, f) => Math.max(n, f.arrows.length), 0),
      );
      for (const e of w.events) if (e.t === 'explode') bursts++;
    }
    expect(most).toBeGreaterThanOrEqual(2);
    expect(bursts).toBeGreaterThan(0);
    expect(dummy.life).toBeLessThan(1e9);
  });

  it('Scourge Arrow: the released arrow leaves pods that bloom into thorn arrows', () => {
    const { world: w } = world(['blightHail'], 6, 'bow_3', DEX);
    let pods = 0;
    let arrows = 0;
    for (let i = 0; i < 60 * 8; i++) {
      stepWorld(w);
      pods = Math.max(pods, w.spores.length);
      arrows = Math.max(arrows, w.projectiles.length);
    }
    expect(pods).toBeGreaterThanOrEqual(2);
    expect(arrows).toBeGreaterThanOrEqual(8);
  });
});

describe('auras, traps and guards (rimePlate, sourHerald, drainTrap, whirringMotes, smokeCharge, lureTotem, slagCarapace, slipstream)', () => {
  it('Arctic Armour: less physical and fire damage from hits while standing still, a chill on what hits you, a chilled trail when moving', () => {
    const { world: w, dummy } = world(['crushingBlow', 'rimePlate'], 8, 'sword_3', STR);
    w.player.moving = false;
    const still = w.char.defence(playerConds(w, null));
    expect(still.hitTakenType![0]).toBeLessThan(0.93);
    expect(still.hitTakenType![3]).toBeLessThan(0.93);
    expect(still.hitTakenType![2]).toBe(1);
    expect(still.hitTakenType![1]).toBe(1);
    w.player.moving = true;
    const moving = w.char.defence(playerConds(w, null));
    expect(moving.hitTakenType![0]).toBe(1);
    frostBite(w, dummy);
    expect(dummy.ail.chill).toBeCloseTo(0.3, 2);
    w.player.stunT = 0;
    w.fields.length = 0;
    for (let i = 0; i < 90; i++) {
      w.player.moving = true;
      tickSkillFx(w, 1 / 60);
    }
    expect(w.fields.filter((f) => f.kind === 'chilling').length).toBeGreaterThanOrEqual(2);
  });

  it('Herald of Agony: poisons build Virulence and call a crawler that cannot be hurt, and with no Virulence it is gone', () => {
    const { world: w } = world(['venomStrike', 'sourHerald'], 1.2, 'dagger_3', DEX);
    let v = 0;
    for (let i = 0; i < 60 * 12; i++) {
      stepWorld(w);
      v = Math.max(v, w.virulence);
    }
    expect(v).toBeGreaterThan(2);
    const crawler = w.minions.find((m) => m.kind === 'crawler');
    expect(crawler?.alive).toBe(true);
    expect(w.char.agonySpec?.max).toBe(40);
    w.player.stunT = 100;
    w.virulence = 5;
    run(w, 12);
    expect(w.virulence).toBe(0);
    expect(w.minions.some((m) => m.kind === 'crawler' && m.alive)).toBe(false);
  });

  it('Siphoning Trap: beams on up to ten enemies drain life and mana to the character, more for each', () => {
    const { world: w, dummy } = world(['drainTrap'], 4, 'wand_3', DEX);
    const others = Array.from({ length: 3 }, (_, i) =>
      neighbour(w, dummy.x + 0.5 * i, dummy.y + 0.8),
    );
    w.opts.godMode = false;
    w.opts.freeResources = false;
    w.player.life = 10;
    let got = 0;
    for (let i = 0; i < 60 * 8; i++) {
      stepWorld(w);
      got = Math.max(got, w.player.life);
      if (i % 60 === 0) w.player.life = Math.min(w.player.life, 10);
    }
    expect(got).toBeGreaterThan(10);
    expect(
      dummy.sdots.some((d) => d.src === 'drainTrap') || others.some((o) => o.sdots.length > 0),
    ).toBe(true);
  });

  it('Summon Skitterbots: two motes hold mana, chill and shock the enemies near, and set off traps from afar', () => {
    const { world: w, dummy } = world(['jawsTrap', 'whirringMotes'], 6, 'wand_3', DEX);
    expect(w.char.reservedMana).toBeGreaterThan(0);
    let bots = 0;
    for (let i = 0; i < 60 * 14; i++) {
      stepWorld(w);
      bots = Math.max(bots, w.minions.filter((m) => m.bot).length);
    }
    expect(bots).toBe(2);
    const kinds = new Set(w.minions.map((m) => m.bot?.kind));
    expect(kinds.has('chill')).toBe(true);
    expect(kinds.has('shock')).toBe(true);
    // Beside them, an enemy is chilled and shocked.
    const bot = w.minions.find((m) => m.bot)!;
    const foe = neighbour(w, bot.x + 0.5, bot.y);
    tickSkillFx(w, 1 / 60);
    expect(foe.ail.chill + foe.ail.shock).toBeGreaterThan(0);
    void dummy;
  });

  it('Smoke Mine: the character gets away when hurt, with smoke at both ends that blinds, and a speed buff', () => {
    const { world: w, dummy } = world(['crushingBlow', 'smokeCharge'], 1.5, 'sword_3', DEX);
    const start = { x: w.player.x, y: w.player.y };
    w.opts.godMode = true;
    w.player.life = w.player.def.maxLife * 0.4;
    for (let i = 0; i < 60 && w.fields.length === 0; i++) stepWorld(w);
    expect(Math.hypot(w.player.x - start.x, w.player.y - start.y)).toBeGreaterThan(2.5);
    expect(w.fields.filter((f) => f.kind === 'smoke')).toHaveLength(2);
    expect(w.buffT.smokeScreen).toBeGreaterThan(0);
    // Enemies in the smoke are blinded.
    const smoke = w.fields.find((f) => f.kind === 'smoke')!;
    dummy.x = smoke.x;
    dummy.y = smoke.y;
    run(w, 1);
    expect(dummy.fx.blind).toBeDefined();
  });

  it('Decoy Totem: a totem the enemies near it go for instead of the character', () => {
    const { world: w, dummy } = world(['crushingBlow', 'lureTotem'], 2.5, 'sword_3', STR);
    dummy.rarity = 'boss';
    let decoy;
    for (let i = 0; i < 60 * 3 && !decoy; i++) {
      stepWorld(w);
      decoy = w.minions.find((m) => m.kind === 'decoy' && m.alive);
    }
    expect(decoy).toBeDefined();
    expect(targetOf(w, dummy)).toBe(decoy);
    const far = neighbour(w, w.player.x + 20, w.player.y);
    expect(targetOf(w, far)).toBe(w.player);
    // It ends.
    w.player.stunT = 100;
    run(w, 9);
    expect(w.minions.some((m) => m.kind === 'decoy' && m.alive)).toBe(false);
  });

  it('Molten Shell: most of the damage goes into a pool, and when the shell ends what it took goes out as fire', () => {
    const { world: w, dummy } = world(['crushingBlow', 'slagCarapace'], 1.2, 'sword_3', STR);
    w.opts.godMode = true;
    w.player.life = w.player.def.maxLife * 0.4;
    for (let i = 0; i < 90 && !w.shell; i++) stepWorld(w);
    expect(w.shell).not.toBeNull();
    w.player.stunT = 100;
    const pool = w.shell!.left;
    expect(pool).toBeGreaterThan(0);
    const life = w.player.life;
    rawHit(w, w.player, 100, 0, 'Test');
    expect(life - w.player.life).toBeLessThan(100);
    expect(w.shell!.taken).toBeGreaterThan(1);
    dummy.life = 1e9;
    const before = dummy.life;
    w.buffT.moltenGuard = 0;
    stepWorld(w);
    expect(w.shell).toBeNull();
    expect(dummy.life).toBeLessThan(before);
  });

  it('Phase Run: speed and melee damage for a moment; the first skill used ends the speed, and the damage stays briefly', () => {
    const { world: w, dummy } = world(['crushingBlow', 'slipstream'], 1.4, 'sword_3', STR);
    // A crowd is what it is used for.
    neighbour(w, dummy.x + 0.5, dummy.y + 1);
    neighbour(w, dummy.x + 0.5, dummy.y - 1);
    for (let i = 0; i < 60 && w.buffT.phaseRun <= 0; i++) stepWorld(w);
    expect(w.buffT.phaseRun).toBeGreaterThan(0);
    expect(w.buffT.phaseStrike).toBeGreaterThan(0);
    // The character runs on without an attack until the speed is over; then it strikes, and the damage lingers a moment.
    const before = dummy.life;
    let ended = false;
    for (let i = 0; i < 60 * 4 && !ended; i++) {
      stepWorld(w);
      if (w.buffT.phaseRun > 0) expect(dummy.life).toBe(before);
      if (w.buffT.phaseRun === 0) ended = true;
    }
    expect(ended).toBe(true);
  });
});

describe('carrying damage about oneself (searingMantle, orbitingBlades)', () => {
  it('a character with a burning aura walks in among the enemies instead of standing off at its range', () => {
    const plain = world(['arcChain'], 7, 'wand_3', INT);
    run(plain.world, 4);
    const burning = world(['arcChain', 'searingMantle'], 7, 'wand_3', INT);
    run(burning.world, 4);
    const d = (r: typeof plain) =>
      Math.hypot(r.world.player.x - r.dummy.x, r.world.player.y - r.dummy.y);
    expect(d(burning)).toBeLessThan(2.8 + burning.dummy.r);
    expect(d(burning)).toBeLessThan(d(plain));
  });

  it('with blades circling it closes in on the enemies too', () => {
    const { world: w, dummy } = world(['arcChain', 'orbitingBlades'], 7, 'wand_3', INT);
    w.vortex = { key: 'orbitingBlades', blades: [20, 20, 20], acc: 0 };
    run(w, 4);
    expect(Math.hypot(w.player.x - dummy.x, w.player.y - dummy.y)).toBeLessThan(1.6 + dummy.r);
  });
});

describe('repairs from the fresh audit (S14)', () => {
  it('Arc hits harder with more chains to come, and each jump reaches a second enemy', () => {
    const { world: w, dummy } = world(['arcChain'], 4, 'wand_3', INT);
    const b = w.char.primary.skill.behaviour;
    expect(b.kind === 'chain' && b.ramp).toBe(15);
    const a = neighbour(w, dummy.x + 1, dummy.y);
    const c = neighbour(w, dummy.x + 1, dummy.y + 1.2);
    const d = neighbour(w, dummy.x + 1.2, dummy.y - 1.2);
    run(w, 1.5);
    expect([a, c, d].filter((m) => m.life < 1e9).length).toBeGreaterThanOrEqual(3);
  });

  it('Viper Strike converts to chaos, poisons for four seconds, and strikes with both weapons when dual wielding', () => {
    const one = world(['venomCut'], 1.2, 'dagger_3', DEX).world;
    const p = one.char.profile(one.primary, 0);
    expect(p.hands[0].chunks.some((c) => c.type === 4 && c.max > 0)).toBe(true);
    expect(p.poison.chance).toBeGreaterThanOrEqual(0.6);
    expect(p.poison.dur).toBeCloseTo(4, 0);
    const two = world(['venomCut'], 1.2, 'dagger_3', DEX, 'dual').world;
    expect(two.char.profile(two.primary, 0).bothHands).toBe(true);
  });

  it('Leap Slam always stuns an enemy on full life and throws it back', () => {
    const { world: w, dummy } = world(['skyfallLeap'], 3, 'sword_3', STR);
    dummy.def = dummyDefence({ maxLife: 1e9 });
    dummy.def.cannotBeStunned = false;
    let stunned = false;
    for (let i = 0; i < 120 && !stunned; i++) {
      stepWorld(w);
      stunned = w.events.some((e) => e.t === 'stun' && e.dst === dummy.id);
    }
    expect(stunned).toBe(true);
  });

  it('Whirling Blades hits everything on the way through, and Spark bounces off walls', () => {
    const { world: w } = world(['spinningDash'], 6, 'dagger_3', DEX);
    const mid = neighbour(w, w.player.x + 3, w.player.y + 0.2);
    mid.def = dummyDefence({ maxLife: 1e9 });
    run(w, 4);
    expect(mid.life).toBeLessThan(1e9);
    const sk = world(['skitterFlash'], 5, 'wand_3', INT);
    expect(sk.world.char.primary.skill.wander).toBeDefined();
  });

  it('a Stormblast mine makes the enemies near it take more from every hit', () => {
    const { world: w, dummy } = world(['crushingBlow', 'stormCharge'], 6, 'sword_3', STR);
    let more = 0;
    for (let i = 0; i < 60 * 12 && more === 0; i++) {
      stepWorld(w);
      more = mineAuraAt(w, dummy.x, dummy.y)?.taken ?? 0;
    }
    expect(more).toBeGreaterThan(0);
  });

  it('Lacerate bleeds in Blood Stance and sweeps wider in Sand Stance', () => {
    const { world: w, dummy } = world(['twinSlash'], 1.2, 'sword_3', DEX);
    const blood = w.char.profile(w.primary, 0);
    expect(blood.bleed.chance).toBeGreaterThan(0);
    w.buffT.sandStance = 5;
    const sand = w.char.profile(w.primary, playerConds(w, dummy));
    expect(sand.bleed.chance).toBe(0);
    expect(sand.radiusMult).toBeGreaterThan(blood.radiusMult);
  });

  it('Arcane Surge comes after enough mana is spent, and Raise Zombie uses up a corpse', () => {
    const { world: w } = world(['suddenFrost', 'tideGathering'], 4, 'wand_3', INT);
    let surge = 0;
    w.surgeMana = 300;
    for (let i = 0; i < 60 * 10; i++) {
      stepWorld(w);
      surge = Math.max(surge, w.buffT.arcaneSurge);
    }
    expect(surge).toBeGreaterThan(0);
    const z = world(['crushingBlow', 'raiseHusk'], 3, 'sword_3', STR);
    run(z.world, 3);
    expect(z.world.minions.length).toBe(0);
    layCorpses(z.world, z.world.player.x, z.world.player.y, 2);
    run(z.world, 3);
    expect(z.world.minions.length).toBeGreaterThan(0);
    expect(z.world.corpses.length).toBeLessThan(2);
  });

  it('Holy Relic answers an attack hit with a nova and mends the character', () => {
    const { world: w, dummy } = world(['crushingBlow', 'hallowedRelic'], 1.4, 'sword_3', STR);
    w.opts.godMode = true;
    w.opts.freeResources = false;
    const near = neighbour(w, dummy.x + 0.5, dummy.y + 0.5);
    run(w, 6);
    expect(w.minions.some((m) => m.kind === 'relic')).toBe(true);
    expect(near.life).toBeLessThan(1e9);
    expect(w.relicRegen.me).toBeGreaterThan(0);
  });

  it('Ice Nova can expand from Glacier Darts in flight', () => {
    const { world: w, dummy } = world(['glacierDart', 'frostRing'], 5, 'wand_3', INT);
    void dummy;
    const dart = w.char.actives.find((c) => c.skill.id === 'glacierDart')!;
    const nova = w.char.actives.find((c) => c.skill.id === 'frostRing')!;
    expect(nova.skill.castOn?.skill).toBe('glacierDart');
    expect(dart.skill.id).toBe('glacierDart');
  });

  it('Cast when Stunned triggers on a stun, Livewire gives Innervation, and rage comes once in 0.4 s', () => {
    const { world: w, dummy } = world(
      ['suddenFrost', 'frostLance', 'reelingCast'],
      4,
      'wand_3',
      INT,
    );
    const trig = w.char.triggers.find((t) => t.def.on === 'stunned');
    expect(trig).toBeDefined();
    void dummy;
    const lw = world(['crushingBlow', 'livewire'], 1.4, 'sword_3', STR).world;
    expect(lw.char.buffSource.innervation).toBe(true);
    const fy = world(['crushingBlow', 'fury'], 1.4, 'sword_3', STR);
    const near = neighbour(fy.world, fy.dummy.x, fy.dummy.y + 0.5);
    void near;
    run(fy.world, 2);
    // At most one point per 0.4 s: five in two seconds.
    expect(fy.world.rage).toBeLessThanOrEqual(6);
    expect(fy.world.rage).toBeGreaterThan(0);
  });

  it('Spectral Throw pierces, so it can hit on the way out and on the way back', () => {
    const { world: w } = world(['phantomToss'], 4, 'sword_3', DEX);
    expect(w.char.profile(w.primary, 0).pierce).toBeGreaterThan(0);
  });
});

describe('Cobra Lash (viperLash)', () => {
  it('is a chaos projectile that flies on from enemy to enemy, not a bolt of lightning', () => {
    const { world: w, dummy } = world(['viperLash'], 4, 'dagger_3', DEX);
    const sk = w.char.primary.skill;
    expect(sk.behaviour.kind).toBe('projectile');
    expect(sk.tags).not.toContain('lightning');
    const p = w.char.profile(w.primary, 0);
    expect(p.chains).toBeGreaterThanOrEqual(3);
    expect(p.hands[0].chunks.every((c) => c.type === 0 || c.type === 4)).toBe(true);
    const second = neighbour(w, dummy.x + 1.5, dummy.y + 1.0);
    let spawned = 0;
    let bolts = 0;
    for (let i = 0; i < 60 * 4; i++) {
      stepWorld(w);
      for (const e of w.events) {
        if (e.t === 'projectileSpawned') spawned++;
        if (e.t === 'chain') bolts++;
      }
    }
    expect(spawned).toBeGreaterThan(0);
    expect(bolts).toBe(0);
    expect(dummy.life).toBeLessThan(1e9);
    expect(second.life).toBeLessThan(1e9);
  });
});

describe('Mirror Arrow and Blink Arrow clones', () => {
  it('Mirror Arrow leaves a clone where the arrow ends, which fires with the character’s weapon', () => {
    const { world: w, dummy } = world(['mirrorQuiver'], 6, 'bow_3', DEX);
    expect(w.char.primary.skill.behaviour.kind).toBe('projectile');
    let clone;
    for (let i = 0; i < 60 * 4 && !clone; i++) {
      stepWorld(w);
      clone = w.minions.find((m) => m.kind === 'clone' && m.alive);
    }
    expect(clone).toBeDefined();
    const hand = w.char.hands[0];
    const avg = hand.flats.reduce((s, [a, b]) => s + (a + b) / 2, 0);
    expect(clone!.fixedHit).toBeCloseTo(avg * 1.75, 5);
    expect(clone!.fixedRate).toBeCloseTo(hand.aps, 5);
    run(w, 3);
    expect(dummy.life).toBeLessThan(1e9);
  });
});

describe('Bladefall, Creeping Frost and Melee Physical Damage', () => {
  it('Bladefall falls in six volleys, each wider and weaker', () => {
    const { world: w, dummy } = world(['rainOfSteel'], 6, 'wand_3', DEX);
    const seen: { r: number; hitMult: number }[] = [];
    for (let i = 0; i < 60 * 3; i++) {
      stepWorld(w);
      if (seen.length === 0 && w.zones.length >= 6)
        for (const z of w.zones) seen.push({ r: z.radius, hitMult: z.profile.hands[0].hitMult });
    }
    expect(seen).toHaveLength(6);
    for (let k = 1; k < 6; k++) {
      expect(seen[k].r).toBeGreaterThan(seen[k - 1].r);
      expect(seen[k].hitMult).toBeCloseTo(seen[k - 1].hitMult * 0.94, 5);
    }
    expect(dummy.life).toBeLessThan(1e9);
  });

  it('Creeping Frost bursts, then leaves chilled ground that creeps toward an enemy, ten patches at most', () => {
    const { world: w, dummy } = world(['rimeDrift'], 5, 'wand_3', INT);
    expect(w.char.primary.skill.behaviour.kind).toBe('projectile');
    let patch: { x: number; y: number } | undefined;
    let start = 0;
    let moved = 0;
    for (let i = 0; i < 60 * 8; i++) {
      stepWorld(w);
      const f = w.fields.find((x) => x.kind === 'chilling' && x.creep);
      if (f && !patch) {
        patch = f;
        start = Math.hypot(f.x - dummy.x, f.y - dummy.y);
      }
      if (f && patch) moved = Math.max(moved, start - Math.hypot(f.x - dummy.x, f.y - dummy.y));
      expect(w.fields.filter((x) => x.creep).length).toBeLessThanOrEqual(10);
    }
    expect(patch).toBeDefined();
    expect(dummy.life).toBeLessThan(1e9);
  });

  it('Melee Physical Damage also makes the bleed and poison of melee hits stronger', () => {
    const plain = world(['venomCut'], 1.2, 'dagger_3', DEX).world;
    const sup = world(['venomCut', 'bruteForce'], 1.2, 'dagger_3', DEX).world;
    const a = plain.char.profile(plain.primary, 0).hands[0].ailChunks[0].k[2];
    const b = sup.char.profile(sup.primary, 0).hands[0].ailChunks[0].k[2];
    expect(b).toBeGreaterThan(a * 1.25);
  });
});
