import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import { stepWorld } from './world';

let n = 70000;
const uid = () => n++;

function build(gems: string[], main = 'wand_3') {
  const run = newRun('mystic', 1);
  const b = run.build;
  b.level = 50;
  b.equipment.mainHand = makeItem(uid, main, 50, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 50, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

function run(gems: string[], seconds: number, main?: string) {
  const b = build(gems, main);
  const c = new Character(b, { areaLevel: 50 });
  const { world, dummy } = createDummyWorld(b, { distance: 3 });
  world.opts.freeResources = true;
  world.opts.godMode = true;
  let most = 0;
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(world);
    most = Math.max(most, world.deployables.length);
  }
  return { c, world, dummy, most };
}

describe('deployables', () => {
  it('a totem support makes the spell a totem that shoots on its own', () => {
    const { c, dummy, most } = run(['flameBolt', 'standingCast'], 8);
    expect(c.primary.deploy).toBe('totem');
    expect(most).toBe(1);
    expect(dummy.life).toBeLessThan(dummy.def.maxLife);
  });

  it('a totem skill is worth its totems on the sheet: more totems, more damage', () => {
    const one = new Character(build(['flameBolt', 'standingCast']), { areaLevel: 50 }).sheet();
    const three = new Character(build(['flameBolt', 'standingCast', 'totemChoir']), {
      areaLevel: 50,
    }).sheet();
    expect(three.skill.usesPerSec).toBeCloseTo(3 * one.skill.usesPerSec, 5);
  });

  it('a trap lies until an enemy steps close, then goes off once', () => {
    const { c, dummy, most } = run(['frostTrap'], 10);
    expect(c.primary.deploy).toBe('trap');
    expect(most).toBeGreaterThan(0);
    expect(dummy.life).toBeLessThan(dummy.def.maxLife);
  });

  it('a mine goes off after it is armed when enemies are near', () => {
    const { c, dummy } = run(['stormCharge'], 10);
    expect(c.primary.deploy).toBe('mine');
    expect(dummy.life).toBeLessThan(dummy.def.maxLife);
  });

  it('a brand stands where it was put and pulses', () => {
    const { c, dummy, most } = run(['doomSigil'], 10);
    expect(c.primary.deploy).toBe('brand');
    expect(most).toBe(1);
    expect(dummy.life).toBeLessThan(dummy.def.maxLife);
  });

  it('at most the allowed number of totems stand', () => {
    const { most } = run(['pyreTotem', 'totemChoir'], 15);
    expect(most).toBeLessThanOrEqual(3);
    expect(most).toBeGreaterThan(1);
  });
});
