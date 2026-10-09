import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { gainCharge } from './charges';
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
