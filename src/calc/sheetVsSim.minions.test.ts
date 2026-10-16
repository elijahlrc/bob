import { describe, expect, it } from 'vitest';
import { activeGem, buildFor, buildForActive, classFor, seedFor, weaponFor } from '../sim/gemKit';
import { createDummyWorld } from '../sim/dummy';
import { stepWorld } from '../sim/world';
import type { Build } from '../data/types';
import { Character } from './character';
import { relicNovasPerSec, timedDuty } from './minionDps';

/**
 * The sheet's minion damage against the sim's (docs/SHEET-AUDIT.md): summoning gems beside a plain attack, a boss dummy that
 * stands still and does not hit back. Minions never fall in that arena, so the sheet's allowance for the time they spend fallen
 * (`minionUptime`, a fact of real maps) is left out of the sheet's figure (`falls` false) before the two are compared; the time
 * they are gone between one lot and the next stays in, because the sim has it too.
 */

/** What the sim's minions dealt a second to the dummy (the ledger's minion rows: strikes and the relic's novas). */
function simMinionDps(build: Build, id: string, distance = 3, seconds = 30): number {
  const { world, dummy } = createDummyWorld(build, {
    distance,
    maxTime: seconds,
    seed: 1,
    rarity: 'boss',
    fixed: true,
    angle: 0.6,
  });
  seedFor(activeGem(id), world, dummy);
  while (world.status === 'running') stepWorld(world);
  let total = 0;
  for (const row of world.sides[0].ledger.dealt.minion.values())
    total += row.dmg.reduce((a, b) => a + b, 0);
  return total / world.t;
}

/** The sheet's minion damage with the minions never falling, as in the arena. */
function sheetStanding(build: Build, distance = 3): number {
  const c = new Character(build, { targetDistance: distance, areaLevel: build.level });
  return c.minionDps(c.configConds, 'boss', false);
}

/** sim / sheet for the summoning gem alone, or with the build given. */
function ratio(id: string, build = buildForActive(activeGem(id)), distance = 3, seconds = 30) {
  return simMinionDps(build, id, distance, seconds) / sheetStanding(build, distance);
}

const within = (r: number, id: string) => {
  expect(r, id).toBeGreaterThan(0.9);
  expect(r, id).toBeLessThan(1.1);
};

describe('minion damage: the sheet against the sim', () => {
  it('a colossus counts one target only: the splash of its blow is a crowd, not the dummy', () => {
    // All six colossi were 1.4 times too high on the sheet, each by its (1 + splash / 2).
    for (const id of [
      'stoneColossus',
      'blightColossus',
      'emberColossus',
      'rimeColossus',
      'stormColossus',
      'carrionColossus',
    ])
      within(ratio(id), id);
  });

  it('skeletons and furies: lots of minions that last 20 s and 5 s are gone for a moment between lots', () => {
    for (const id of ['callBonewalkers', 'callFuries']) within(ratio(id, undefined, 3, 60), id);
    // The gap between the lots of the 5-second furies is a tenth of the time; the skeletons' is a thirtieth.
    expect(timedDuty(5, 0.5, 0.7)).toBeCloseTo(0.88, 2);
    expect(timedDuty(20, 0.7, 0.7)).toBeGreaterThan(0.96);
  });

  it('husks (given corpses to rise from)', () => {
    within(ratio('raiseHusk'), 'raiseHusk');
  });

  it('a relic deals its nova when the attacks hit, and only to what is near it', () => {
    const build = buildForActive(activeGem('hallowedRelic'));
    expect(sheetStanding(build)).toBeGreaterThan(0);
    within(ratio('hallowedRelic'), 'hallowedRelic');
    // Out of reach of the nova the sim deals nothing, and so does the sheet.
    expect(sheetStanding(build, 7)).toBe(0);
    expect(simMinionDps(build, 'hallowedRelic', 7, 20)).toBe(0);
  });

  it('a relic answers a hit at most once in its cooldown', () => {
    expect(relicNovasPerSec(0, 0.5)).toBe(0);
    expect(relicNovasPerSec(1.37, 0.5)).toBeCloseTo(1.37, 6);
    expect(relicNovasPerSec(4, 0.5)).toBeCloseTo(2, 6);
    expect(relicNovasPerSec(3, 0.5)).toBeCloseTo(1.5, 6);
  });

  it('a relic with spells only is silent: only attacks set it off', () => {
    const build = buildFor(['flameBolt', 'hallowedRelic'], 'wand_3', 'mystic');
    const c = new Character(build, { targetDistance: 3, areaLevel: build.level });
    expect(c.primary.skill.id).toBe('flameBolt');
    // The weapon is not used while the spell can be (the plan gives it no time), so nothing sets the relic off.
    expect(c.minionDps(c.configConds, 'boss', false)).toBeLessThan(0.01);
  });

  it('motes and lure posts deal no damage of their own, on the sheet or in the sim', () => {
    for (const id of ['whirringMotes', 'lureTotem']) {
      const build = buildForActive(activeGem(id));
      expect(sheetStanding(build), id).toBe(0);
      expect(simMinionDps(build, id, 3, 10), id).toBe(0);
    }
  });
});

describe('minion damage scales with the supports and the gear that change minions', () => {
  /** A build with a summoning gem and supports beside a plain attack. */
  function withSupports(id: string, supports: string[]): Build {
    const def = activeGem(id);
    return buildFor(
      ['crushingBlow', id, ...supports],
      weaponFor(def),
      classFor(def.attr),
      def.needsShield ? 'shield' : 'none',
    );
  }

  it('Pack Fury and Pack Haste (minion damage, minion speed) are counted as the sim counts them', () => {
    const build = withSupports('stoneColossus', ['packFury', 'packHaste']);
    const plain = sheetStanding(buildForActive(activeGem('stoneColossus')));
    expect(sheetStanding(build) / plain).toBeGreaterThan(1.5);
    within(ratio('stoneColossus', build), 'stoneColossus + packs');
  });

  it('Elemental Pack: elemental minions deal more elemental damage', () => {
    const build = withSupports('emberColossus', ['elementalPack']);
    const plain = sheetStanding(buildForActive(activeGem('emberColossus')));
    expect(sheetStanding(build) / plain).toBeGreaterThan(1.15);
    within(ratio('emberColossus', build), 'emberColossus + elementalPack');
  });

  it('Warding Pack: more damage to the enemies near the character, and not to those far off', () => {
    const build = withSupports('callBonewalkers', ['wardingPack']);
    expect(sheetStanding(build, 3) / sheetStanding(build, 6)).toBeGreaterThan(1.15);
    within(ratio('callBonewalkers', build), 'callBonewalkers + wardingPack');
  });

  it('extra minions from the gear are counted', () => {
    const plain = sheetStanding(buildForActive(activeGem('callBonewalkers')));
    // (An item is never edited in place: what it gives is remembered by object, so this is a build of its own.)
    const build = buildForActive(activeGem('callBonewalkers'));
    build.equipment.body!.uniqueMods = [{ stat: 'minionCount', kind: 'base', value: 2 }];
    expect(sheetStanding(build) / plain).toBeGreaterThan(1);
    within(ratio('callBonewalkers', build), 'callBonewalkers + 2 minions');
  });

  it('a golem adds to the other minions: flat damage on their blows, and a harder blow of its own for each', () => {
    const build = buildFor(
      ['crushingBlow', 'callBonewalkers', 'carrionColossus'],
      'wand_3',
      'mystic',
    );
    const alone = new Character(build, { targetDistance: 3, areaLevel: build.level });
    const together = alone.minionDps(alone.configConds, 'boss', false);
    const sum =
      sheetStanding(buildForActive(activeGem('callBonewalkers'))) +
      sheetStanding(buildForActive(activeGem('carrionColossus')));
    // More than the two summons apart.
    expect(together).toBeGreaterThan(sum * 1.1);
    within(simMinionDps(build, 'callBonewalkers', 3, 60) / together, 'bonewalkers + carrion');
  });
});
