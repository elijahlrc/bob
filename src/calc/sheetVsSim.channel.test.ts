import { describe, expect, it } from 'vitest';
import type { Build } from '../data/types';
import { createDummyWorld, dummyDefence } from '../sim/dummy';
import { activeGem, buildFor, buildForActive, classFor, weaponFor } from '../sim/gemKit';
import { stepWorld } from '../sim/world';
import { Character, channelMult, scenarioDps } from './character';
import { sporeHits, zapMult } from './channelFx';

/**
 * The sheet against the sim for the skills that build up or whose damage comes from something the use sets going (docs/SHEET-AUDIT.md
 * section 5): channels with a release, circling blades, a mote on its own beat, ground that goes on hurting. Each gem alone, level 50,
 * a fitting weapon, one boss dummy, free mana. The first ten seconds are left out of the sim's side: the sheet is the steady state,
 * and blades, stages and debuffs take a few seconds to build up.
 */

const WARM = 10;

/** What the sim's ledger says was dealt to the dummy so far, by everything. */
function dealtSoFar(world: ReturnType<typeof createDummyWorld>['world']): number {
  let total = 0;
  for (const kind of ['skill', 'minion', 'ailment', 'monster', 'effect'] as const)
    for (const row of world.ledger.dealt[kind].values())
      total += row.dmg.reduce((a, b) => a + b, 0);
  return total;
}

function compare(
  build0: Build,
  distance = 3,
  time = 60,
): { sheet: number; sim: number; ratio: number } {
  // The character keeps its first target; the dummy takes no defence into the sheet either.
  const build: Build = { ...build0, strategy: { ...build0.strategy, target: 'stick' } };
  const c = new Character(build, { targetDistance: distance, areaLevel: build.level });
  const target = { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] };
  const sheet = scenarioDps(c.sheet(c.configConds, 'boss', target));
  const { world } = createDummyWorld(build, {
    distance,
    maxTime: time,
    seed: 1,
    rarity: 'boss',
    fixed: true,
  });
  let before = 0;
  let from = 0;
  while (world.status === 'running') {
    stepWorld(world);
    if (from === 0 && world.t >= WARM) {
      before = dealtSoFar(world);
      from = world.t;
    }
  }
  const sim = (dealtSoFar(world) - before) / (world.t - from);
  return { sheet, sim, ratio: sim / sheet };
}

const alone = (id: string, distance?: number) => compare(buildForActive(activeGem(id)), distance);

function withSupport(id: string, ...supports: string[]) {
  const def = activeGem(id);
  return compare(buildFor([id, ...supports], weaponFor(def), classFor(def.attr), 'none'));
}

const near = (r: { ratio: number; sheet: number; sim: number }) => {
  expect(r.ratio, `sim ${r.sim.toFixed(1)} against sheet ${r.sheet.toFixed(1)}`).toBeGreaterThan(
    0.9,
  );
  expect(r.ratio, `sim ${r.sim.toFixed(1)} against sheet ${r.sheet.toFixed(1)}`).toBeLessThan(1.1);
};

describe('channels: what a held skill leaves and how often it hits', () => {
  it('Blight Hail: the pods of the released arrow bloom into thorns the sheet counts', () => {
    near(alone('blightHail'));
  });

  it('Blight Hail: the thorns that reach a target depend on how far it stands', () => {
    near(alone('blightHail', 6));
    near(alone('blightHail', 1.5));
    const c = new Character(buildForActive(activeGem('blightHail')), { targetDistance: 3 });
    const p = c.profile(c.primary, 0);
    // Five pods of nine thorns: those at the target are all in, the rest only part of a ring, so well under all forty-five.
    const near3 = sporeHits(p, 3);
    expect(near3).toBeGreaterThan(15);
    expect(near3).toBeLessThan(30);
    // Far from the pods none reaches a target at the very edge of the arrow's range.
    expect(sporeHits(p, 9)).toBeLessThan(near3);
  });

  it('Judgement Tempest: the uses that build the stages hit for half', () => {
    const c = new Character(buildForActive(activeGem('judgementTempest')), { targetDistance: 3 });
    // Twenty stages at half a hit, and a release of twenty hits, shared over the twenty uses.
    expect(channelMult(c.profile(c.primary, 0))).toBeCloseTo((20 * 0.5 + 20) / 20, 6);
    near(alone('judgementTempest'));
  });

  it('Thunder Spiral: an orb blasts at each jump but the last, and only some blasts land on the target', () => {
    const c = new Character(buildForActive(activeGem('brimstoneStorm')), { targetDistance: 3 });
    const p = c.profile(c.primary, 0);
    // 1.2 s at a jump every 0.4 s is two blasts; a blast of 1.2 and a target of 0.5 reach 1.7 of the 2 tiles the orbs scatter over.
    expect(zapMult(p)).toBeCloseTo(2 * (1.7 / 2) ** 2, 6);
    near(alone('brimstoneStorm'));
  });

  it('Searing Lance: at its top stage the debuff exposes the target to the fire it deals', () => {
    near(alone('searingLance'));
  });
});

describe('skills whose damage comes from what the use sets going', () => {
  it('Orbiting Blades: the blades build up to the most and cut together, harder and sooner for each', () => {
    near(alone('orbitingBlades'));
  });

  it('Orbiting Blades: fewer blades with a shorter life, two a cast with Echoing Cast', () => {
    near(withSupport('orbitingBlades', 'briefBurst'));
    near(withSupport('orbitingBlades', 'echoingCast'));
  });

  it('Tempest Mote: the mote strikes on its own beat, not once for each cast', () => {
    near(alone('tempestMote'));
    near(withSupport('tempestMote', 'echoingCast'));
  });

  it('Sudden Frost: the frozen ground goes on hurting after the burst', () => {
    near(alone('suddenFrost'));
    near(withSupport('suddenFrost', 'echoingCast'));
  });

  it('Rime Drift: the chilled ground that creeps toward the enemy is counted the same way', () => {
    near(alone('rimeDrift'));
  });
});
