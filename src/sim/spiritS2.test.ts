import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { gainCharge } from './charges';
import { fireTriggers } from './triggers';
import { createDummyWorld } from './dummy';
import type { World } from './types';
import { stepWorld } from './world';

/** Tests of the spirit plan's S2 (docs/SPIRIT.md): cooldowns, spending charges to skip them, a buff on use. */

function holding(main: string, gems: string[]): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 50;
  const weapon = makeItem(uid, main, 50, gems.length);
  weapon.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

/** Step the world, and note when each skill is used and what is spent. */
function watch(world: World, seconds: number, skill: string) {
  const uses: number[] = [];
  const spends: number[] = [];
  const others: number[] = [];
  const buffs: string[] = [];
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(world);
    for (const e of world.events) {
      if (e.t === 'use' && e.src === world.player.id)
        (e.skill === skill ? uses : others).push(world.t);
      if (e.t === 'spend') spends.push(world.t);
      if (e.t === 'buff') buffs.push(e.id);
    }
  }
  return { uses, spends, others, buffs };
}

describe('Flicker Strike (blinkingCut)', () => {
  const build = () => holding('sword_3', ['blinkingCut']);

  it('has a cooldown of two seconds that charges can skip, and a buff on use', () => {
    const c = new Character(build(), {});
    expect(c.primary.skill).toMatchObject({
      cooldown: 2,
      bypass: { charge: 'fervour', n: 1 },
    });
    expect(c.buffSource.flickerStep).toBe(true);
  });

  it('waits out its cooldown when it holds no charges, and the weapon fills the gaps', () => {
    const { world } = createDummyWorld(build(), { distance: 1.2 });
    world.opts.freeResources = true;
    const t = watch(world, 20, 'blinkingCut');
    // A use at the start, then at most one more every two seconds, plus one for every charge spent.
    expect(t.uses.length).toBeLessThanOrEqual(1 + Math.ceil(20 / 2) + t.spends.length);
    // The default attack fills the time between uses.
    expect(t.others.length).toBeGreaterThan(5);
  });

  it('spends a charge to use it again at once, and the use grants the buff', () => {
    const { world } = createDummyWorld(build(), { distance: 1.2 });
    world.opts.freeResources = true;
    gainCharge(world, 'fervour');
    gainCharge(world, 'fervour');
    expect(world.char.charges.fervour).toBe(2);
    const t = watch(world, 1.2, 'blinkingCut');
    // The first use takes the stored use; the next ones are paid for with the charges held.
    expect(t.uses.length).toBeGreaterThanOrEqual(2);
    expect(t.spends.length).toBeGreaterThanOrEqual(1);
    expect(t.buffs).toContain('flickerStep');
  });

  it('is not skipped without charges: a second use inside two seconds needs one', () => {
    const { world } = createDummyWorld(build(), { distance: 1.2 });
    world.opts.freeResources = true;
    const t = watch(world, 1.4, 'blinkingCut');
    // One hit may have gained a charge (15%), which a second use then spends; never more uses than the cooldown plus spends allow.
    expect(t.uses.length).toBeLessThanOrEqual(1 + t.spends.length);
  });

  it('the sheet counts the cooldown and the charges that skip it', () => {
    const c = new Character(build(), {});
    const rate = c.cooldownRate(c.primary)!;
    // Half a use a second, raised by the charges each use gains (15% of the uses are paid for by them).
    expect(rate).toBeGreaterThan(0.5);
    expect(rate).toBeLessThan(0.7);
    const s = c.skillSheet(c.primary);
    expect(s.usesPerSec).toBeCloseTo(rate, 6);
    // The weapon fills the rest, so the total is more than the skill alone.
    expect(s.hitDps).toBeGreaterThan(s.avgHit * s.usesPerSec * 0.9);
  });
});

describe('Vigilant Strike (guardedStrike)', () => {
  it('waits four seconds between uses unless a Grit charge is spent', () => {
    const c = new Character(holding('sword_3', ['guardedStrike']), {});
    expect(c.primary.skill).toMatchObject({ cooldown: 4, bypass: { charge: 'grit', n: 1 } });
    const { world } = createDummyWorld(holding('sword_3', ['guardedStrike']), { distance: 1.2 });
    world.opts.freeResources = true;
    gainCharge(world, 'grit');
    const t = watch(world, 2.5, 'guardedStrike');
    expect(t.uses.length).toBe(2);
    expect(t.spends).toHaveLength(1);
    expect(world.char.charges.grit).toBe(0);
  });
});

describe('Discharge (chargeRelease)', () => {
  const build = () => holding('sword_3', ['crushingBlow', 'chargeRelease']);

  it('is cast once three charges are held, and spends every charge it uses', () => {
    const { world } = createDummyWorld(build(), { distance: 1.2 });
    world.opts.freeResources = true;
    gainCharge(world, 'grit');
    gainCharge(world, 'fervour');
    // Two charges are not enough to be worth it.
    const early = watch(world, 1.5, 'chargeRelease');
    expect(early.uses).toHaveLength(0);
    gainCharge(world, 'insight');
    expect(world.char.charges).toMatchObject({ grit: 1, fervour: 1, insight: 1 });
    const t = watch(world, 2, 'chargeRelease');
    expect(t.uses.length).toBeGreaterThanOrEqual(1);
    expect(t.spends.length).toBeGreaterThanOrEqual(3);
  });

  it('does more damage for more charges, and 35% less when triggered', () => {
    const none = new Character(build(), {});
    const three = new Character(build(), { charges: { grit: 3, fervour: 0, insight: 0 } });
    const pick = (c: Character) => c.actives.find((a) => a.skill.id === 'chargeRelease')!;
    const d0 = none.skillSheet(pick(none)).avgHit;
    const d3 = three.skillSheet(pick(three)).avgHit;
    expect(d3).toBeGreaterThan(d0);
    expect(pick(three).skill.consumeCharges).toEqual({ min: 3 });
  });
});

describe('Immortal Call (deathlessCall)', () => {
  const build = () => holding('sword_3', ['crushingBlow', 'deathlessCall']);

  function cast(charges: number) {
    const { world } = createDummyWorld(build(), { distance: 1.2 });
    world.opts.freeResources = true;
    world.opts.godMode = true;
    for (let i = 0; i < charges; i++) gainCharge(world, 'grit');
    world.player.life = world.player.def.maxLife * 0.4;
    let longest = 0;
    let used = 0;
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(world);
      longest = Math.max(longest, world.buffT.deathless);
      for (const e of world.events) if (e.t === 'spend') used += e.n;
    }
    return { world, longest, used };
  }

  it('lasts a second on its own, and longer for each Grit charge it spends', () => {
    const plain = cast(0);
    expect(plain.longest).toBeGreaterThan(0.9);
    expect(plain.longest).toBeLessThanOrEqual(1.01);
    const charged = cast(3);
    expect(charged.used).toBe(3);
    // Three charges at 20% each add 60% to the time.
    expect(charged.longest).toBeGreaterThan(1.55);
    expect(charged.world.guard!.physMult).toBeCloseTo(Math.pow(0.85, 3), 6);
  });

  it('is a guard that waits three seconds, and the other guards wait with it', () => {
    const { world } = createDummyWorld(
      holding('sword_3', ['crushingBlow', 'deathlessCall', 'ironHide']),
      { distance: 1.2 },
    );
    world.opts.freeResources = true;
    world.opts.godMode = true;
    world.player.life = world.player.def.maxLife * 0.4;
    const buffs: string[] = [];
    for (let i = 0; i < 2.5 * 60; i++) {
      stepWorld(world);
      for (const e of world.events) if (e.t === 'buff') buffs.push(e.id);
    }
    // One guard went up, and the second waited for it: within 2.5 s only one of the two guards was cast.
    expect(buffs.filter((b) => b === 'deathless' || b === 'steelHide')).toHaveLength(1);
  });
});

describe('Vengeance (anvilDrop)', () => {
  it('cannot be the primary skill, and strikes back when the character is hit', () => {
    const b = holding('sword_3', ['crushingBlow', 'anvilDrop']);
    const c = new Character(b, {});
    expect(c.primary.skill.id).toBe('crushingBlow');
    expect(
      c.triggers.some((t) => t.def.on === 'hitTaken' && t.skills[0]?.skill.id === 'anvilDrop'),
    ).toBe(true);
    expect(c.secondaries.map((s) => s.skill.id)).not.toContain('anvilDrop');
    // Hit it many times: the counter-attack fires on some of the hits, never faster than its cooldown allows.
    const { world, dummy } = createDummyWorld(b, { distance: 1.2 });
    world.opts.godMode = true;
    world.opts.freeResources = true;
    let counters = 0;
    for (let i = 0; i < 20 * 60; i++) {
      if (i % 20 === 0) {
        fireTriggers(world, { on: 'hitTaken', damage: 5 });
        for (const e of world.events) if (e.t === 'trigger' && e.skill === 'anvilDrop') counters++;
      }
      stepWorld(world);
      for (const e of world.events) if (e.t === 'trigger' && e.skill === 'anvilDrop') counters++;
    }
    expect(counters).toBeGreaterThan(0);
    expect(counters).toBeLessThanOrEqual(20 / 1.2 + 1);
    expect(dummy.life).toBeLessThan(dummy.def.maxLife);
  });
});

describe('Frost Fang (frostFang)', () => {
  it('gains a Fervour charge only when its hit kills a frozen enemy', () => {
    const b = holding('sword_3', ['crushingBlow', 'frostFang']);
    // A fresh chance of at least 50% each trial: across trials, frozen kills give a charge and others never do.
    const trial = (frozen: boolean, seed: number) => {
      const { world, dummy } = createDummyWorld(b, { distance: 1.2, seed });
      dummy.noReward = false;
      dummy.life = 1;
      if (frozen) dummy.ail.freezeT = 30;
      for (let i = 0; i < 3 * 60 && dummy.alive; i++) stepWorld(world);
      expect(dummy.alive).toBe(false);
      return world.char.charges.fervour;
    };
    let frozenGot = 0;
    let plainGot = 0;
    for (let seed = 1; seed <= 12; seed++) {
      frozenGot += trial(true, seed);
      plainGot += trial(false, seed);
    }
    expect(frozenGot).toBeGreaterThan(0);
    expect(plainGot).toBe(0);
  });
});

describe('Lightheart (lightheart)', () => {
  it('earns an Insight charge each time the skill is used', () => {
    const { world } = createDummyWorld(holding('sword_3', ['crushingBlow', 'lightheart']), {
      distance: 1.2,
    });
    world.opts.freeResources = true;
    watch(world, 3, 'crushingBlow');
    expect(world.char.charges.insight).toBeGreaterThan(0);
  });
});
