import { describe, expect, it } from 'vitest';
import { Character, scenarioDps } from './character';
import { illusionStill, landsPerUse } from './melee';
import { createDummyWorld, dummyDefence } from '../sim/dummy';
import { activeGem, buildFor, buildForActive, classFor, weaponFor } from '../sim/gemKit';
import { stepWorld } from '../sim/world';

/**
 * Melee areas, spins, runs and strikes with an extra effect (docs/SHEET-AUDIT.md section 5): the sheet counts what the sim deals
 * for the skills that do more than hit once. Each skill alone, level 50, a fitting weapon, free mana, a boss-sized dummy that does
 * not move at three tiles, a minute of play: the damage a second the sim's ledger says was dealt, against the sheet's.
 */

const DISTANCE = 3;

/** The sim's damage a second for a build, and the sheet's. */
function measure(gems: string[]): { sim: number; sheet: number } {
  const def = activeGem(gems[0]);
  const build =
    gems.length === 1
      ? buildForActive(def)
      : buildFor(gems, weaponFor(def), classFor(def.attr), def.needsShield ? 'shield' : 'none');
  build.strategy = { ...build.strategy, target: 'stick' };
  const c = new Character(build, { targetDistance: DISTANCE, areaLevel: build.level });
  const target = { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] };
  const sheet = scenarioDps(c.sheet(c.configConds, 'boss', target));
  const { world } = createDummyWorld(build, {
    distance: DISTANCE,
    maxTime: 60,
    seed: 1,
    rarity: 'boss',
    fixed: true,
  });
  while (world.status === 'running') stepWorld(world);
  let dealt = 0;
  for (const kind of ['skill', 'minion', 'ailment', 'monster', 'effect'] as const)
    for (const row of world.ledger.dealt[kind].values())
      dealt += row.dmg.reduce((a, b) => a + b, 0);
  return { sim: dealt / world.t, sheet };
}

function expectClose(gems: string[]) {
  const { sim, sheet } = measure(gems);
  const r = sim / sheet;
  expect(
    r,
    `${gems.join('+')}: sim ${sim.toFixed(1)} vs sheet ${sheet.toFixed(1)}`,
  ).toBeGreaterThan(0.9);
  expect(r, `${gems.join('+')}: sim ${sim.toFixed(1)} vs sheet ${sheet.toFixed(1)}`).toBeLessThan(
    1.1,
  );
}

describe('the sheet counts the extra hits of a melee skill the way the sim plays them', () => {
  it('Whirlwind Cleave: five sweeps, and the storms of blades it leaves behind (and the speed of standing in one)', () => {
    expectClose(['whirlwindCleave']);
  });

  it('Whirlwind Cleave with a repeat: an echo of a spin is one sweep, not five', () => {
    expectClose(['whirlwindCleave', 'tripleCadence']);
  });

  it('Spinning Dash with repeats: the same, for a spin that runs', () => {
    expectClose(['spinningDash', 'tripleCadence']);
  });

  it('Faultline: the ground erupts again, harder, a moment after the slam', () => {
    expectClose(['faultline']);
  });

  it('Faultline with repeats: every repeat quakes, and each is harder than the last', () => {
    expectClose(['faultline', 'tripleCadence']);
  });

  it('Charged Blow: each hit calls beams while the stacks last', () => {
    expectClose(['chargedBlow']);
  });

  it('Cinder Blow: each hit puts a charge on the enemy, and the charges burst', () => {
    expectClose(['cinderBlow']);
  });

  it('Cinder Blow with repeats: every landing hit still charges once', () => {
    expectClose(['cinderBlow', 'tripleCadence']);
  });

  it('Charged Blow with repeats: the stacks count the hits, not their weight', () => {
    expectClose(['chargedBlow', 'tripleCadence']);
  });

  it('Thunder Rebuke: the lightning aura of its own hit is on its next hits', () => {
    expectClose(['thunderRebuke']);
  });

  it('Bulwark Rush: a charge at a target it has already reached has no run left to add to its blow', () => {
    expectClose(['bulwarkRush']);
  });

  it('Storm Rush: the illusion that has stopped breaks its waves harder', () => {
    expectClose(['stormRush']);
  });
});

describe('landsPerUse', () => {
  const profileOf = (id: string) => {
    const build = buildForActive(activeGem(id));
    const c = new Character(build, { targetDistance: DISTANCE, areaLevel: build.level });
    return c.profile(c.primary);
  };
  const ctx = (usesPerSec: number, over: Partial<Parameters<typeof landsPerUse>[1]> = {}) => ({
    usesPerSec,
    triggered: false,
    volley: 1,
    land: 1,
    ...over,
  });

  it('a skill with none of the effects lands as it always did: its repeats times its pulses times its volley', () => {
    const p = profileOf('crushingBlow');
    expect(landsPerUse(p, ctx(1))).toBe((1 + p.repeats) * p.pulses);
    expect(landsPerUse({ ...p, repeats: 2 }, ctx(1, { volley: 2 }))).toBe(6);
    expect(landsPerUse({ ...p, repeats: 2 }, ctx(1, { triggered: true }))).toBe(1);
  });

  it('each repeat of a Multistrike is harder than the one before, the first blow is not', () => {
    const p = profileOf('crushingBlow');
    const m = { ...p, repeats: 2, multistrike: { ramp: 22 } };
    expect(landsPerUse(m, ctx(1))).toBeCloseTo(1 + 1.22 + 1.44, 9);
    expect(landsPerUse(m, ctx(1, { triggered: true }))).toBe(1);
    // The quake of a slam repeats with it, as hard as the repeat is.
    const q = profileOf('faultline');
    const more = 1 + q.skill.aftershock!.more / 100;
    expect(landsPerUse({ ...q, repeats: 2, multistrike: { ramp: 22 } }, ctx(1))).toBeCloseTo(
      (1 + more) * (1 + 1.22 + 1.44),
      9,
    );
  });

  it('an aftershock is one more hit, harder by the share the gem says, for each time the slam lands', () => {
    const p = profileOf('faultline');
    const more = 1 + p.skill.aftershock!.more / 100;
    expect(landsPerUse(p, ctx(1))).toBeCloseTo(1 + more, 9);
    expect(landsPerUse({ ...p, repeats: 2 }, ctx(1))).toBeCloseTo(3 * (1 + more), 9);
    expect(landsPerUse({ ...p, repeats: 2 }, ctx(1, { triggered: true }))).toBeCloseTo(1 + more, 9);
  });

  it('a charge is worth its share of a blow for every hit that lands', () => {
    const p = profileOf('cinderBlow');
    const share = p.skill.charge!.perCharge / 100;
    expect(landsPerUse(p, ctx(1))).toBeCloseTo(1 + share, 9);
    expect(landsPerUse(p, ctx(1, { land: 0.5 }))).toBeCloseTo(1 + share / 2, 9);
  });

  it('storms stand only as many as the most: faster uses do not add to the storm hits a second', () => {
    const p = profileOf('whirlwindCleave');
    const hits = p.skill.spin!.hits;
    const storm = (rate: number) => (landsPerUse(p, ctx(rate)) - hits) * rate;
    // Three storms of three seconds fill at one use a second; beyond that each use only replaces the oldest.
    expect(storm(2)).toBeCloseTo(storm(3), 6);
    expect(storm(0.5)).toBeLessThan(storm(1));
  });

  it('beams come faster with more stacks, which need more hits a second', () => {
    const p = profileOf('chargedBlow');
    // The beams a second: none to speak of when a hit comes rarely, one stack's worth when it comes every few seconds, more with three.
    const beams = (rate: number) => (landsPerUse(p, ctx(rate)) - 1) * rate;
    expect(beams(0.05)).toBeLessThan(beams(0.25));
    expect(beams(0.25)).toBeLessThan(beams(1));
    expect(beams(2)).toBeCloseTo(beams(4), 6);
  });

  it('an illusion is still when it has had the time to run to the target', () => {
    const o = { speed: 1.3, distance: 8, waveStages: 2 };
    // 4 tiles a second: 5.2 tiles a second for the illusion, three tiles away: it arrives in about half a second.
    const run = { distance: 3, speed: 4 };
    expect(illusionStill(o, 0.431, 1, 5, run)).toBe(false);
    expect(illusionStill(o, 0.431, 2, 5, run)).toBe(true);
    // Far away it is later; with no word of the target, the later half.
    expect(illusionStill(o, 0.431, 2, 5, { distance: 8, speed: 4 })).toBe(false);
    expect(illusionStill(o, 0.431, 2, 5)).toBe(false);
    expect(illusionStill(o, 0.431, 3, 5)).toBe(true);
  });
});
