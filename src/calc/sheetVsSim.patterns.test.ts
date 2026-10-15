import { describe, expect, it } from 'vitest';
import { createDummyWorld, dummyDefence } from '../sim/dummy';
import { activeGem, buildFor, buildForActive, classFor, weaponFor } from '../sim/gemKit';
import { stepWorld } from '../sim/world';
import type { Build } from '../data/types';
import { Character, scenarioDps } from './character';
import {
  cloneDamage,
  elementAfterHits,
  orbHits,
  podHits,
  shotgunHits,
  volleysHits,
} from './patterns';

/**
 * Projectile patterns (docs/SHEET-AUDIT.md section 5): skills that fire many projectiles, rains, volleys, drifting orbs and
 * the clones and ground they leave, where how many land on one target decides the damage. The sheet's damage a second against
 * a boss-sized training dummy is checked against what the sim deals, with each gem alone and with a support or two.
 */

const SECONDS = 60;
const DISTANCE = 3;

/** What the sheet says a boss training dummy takes a second, and what the sim says it took, from the sim's own ledger. */
function measure(build: Build): { sheet: number; sim: number; hits: number } {
  const c = new Character(build, { targetDistance: DISTANCE, areaLevel: build.level });
  const sheet = c.sheet(c.configConds, 'boss', {
    def: dummyDefence(),
    shock: 0,
    resShift: [0, 0, 0, 0, 0],
  });
  const { world } = createDummyWorld(build, {
    distance: DISTANCE,
    maxTime: SECONDS,
    seed: 1,
    rarity: 'boss',
    fixed: true,
  });
  while (world.status === 'running') stepWorld(world);
  let total = 0;
  for (const kind of ['skill', 'minion', 'ailment', 'monster', 'effect'] as const)
    for (const row of world.ledger.dealt[kind].values())
      total += row.dmg.reduce((a, b) => a + b, 0);
  return { sheet: scenarioDps(sheet), sim: total / world.t, hits: sheet.skill.hitDps };
}

const alone = (id: string): Build => buildForActive(activeGem(id));
const withSupports = (id: string, ...supports: string[]): Build => {
  const def = activeGem(id);
  return buildFor([id, ...supports], weaponFor(def), classFor(def.attr));
};

function expectClose(b: Build, lo = 0.9, hi = 1.1): void {
  const m = measure(b);
  expect(m.sim / m.sheet).toBeGreaterThanOrEqual(lo);
  expect(m.sim / m.sheet).toBeLessThanOrEqual(hi);
}

describe('projectile patterns: each gem alone, sim against sheet', () => {
  // Arrows fall around the target, each leaving a pod that bursts: those within the burst of the target's edge hit it.
  it('Venom Shower counts the pods that burst on the target', () =>
    expectClose(alone('venomShower')));
  // The clone the arrow leaves shoots with the character's bow for its few seconds, and each use leaves one.
  it('Mirror Quiver counts the clones', () => expectClose(alone('mirrorQuiver')));
  // Six volleys one width further on each: only the first two cover a target at the aim.
  it('Rain of Steel counts the volleys that reach the target', () =>
    expectClose(alone('rainOfSteel')));
  // The chilled ground a skull leaves pulses on the target for its five seconds, patch on patch.
  it('Rime Drift counts the pulses of the ground it leaves', () => expectClose(alone('rimeDrift')));
  // A slow orb strikes everything within its reach at every beat while it drifts past the target.
  it('Drifting Storm counts the beats of the orb near the target', () =>
    expectClose(alone('driftingStorm')));
  // Three shards in a wide fan: only the one aimed at the target hits it.
  it('Splinter Volley hits with the shard aimed at the target only', () =>
    expectClose(alone('splinterVolley')));
  // A cold strike sends a wave of three after it, and its middle projectile goes through the target; one use in three.
  it('Prime Splash counts the wave of its cold strikes', () => expectClose(alone('primeSplash')));
  // An ensnared enemy takes more from projectile attack hits, and the arrow ensnares it.
  it('Snare Shot counts the snare on its own later hits', () => expectClose(alone('snareShot')));
});

describe('projectile patterns: the gems with supports', () => {
  it('Venom Shower with Volley Split (nine pods over wider ground)', () =>
    expectClose(withSupports('venomShower', 'volleySplit')));
  it('Venom Shower with Wide Blast (the pods and their bursts grow)', () =>
    expectClose(withSupports('venomShower', 'wideBlast')));
  it('Rain of Steel with Dense Blast (smaller volleys, harder hits)', () =>
    expectClose(withSupports('rainOfSteel', 'denseBlast')));
  // Two patches a use, and more of them than the ground allows at once: the oldest gives way.
  it('Rime Drift with Echoing Cast (the cap on patches)', () =>
    expectClose(withSupports('rimeDrift', 'echoingCast'), 0.88, 1.1));
  it('Splinter Volley with Volley Split (seven shards in the same fan)', () =>
    expectClose(withSupports('splinterVolley', 'volleySplit')));
  it('Snare Shot with Piercing Shot', () => expectClose(withSupports('snareShot', 'piercingShot')));
  it('Prime Splash with Volley Split (a wave of seven)', () =>
    expectClose(withSupports('primeSplash', 'volleySplit')));
  it('Mirror Quiver with Volley Split (one arrow still leaves one clone)', () =>
    expectClose(withSupports('mirrorQuiver', 'volleySplit')));
});

describe('projectile patterns: the pieces', () => {
  const profile = (id: string, ...supports: string[]) => {
    const b = supports.length ? withSupports(id, ...supports) : alone(id);
    const c = new Character(b, { targetDistance: DISTANCE, areaLevel: b.level });
    return { c, p: c.profile(c.primary) };
  };

  it('a target right at the aim is covered by pods in proportion to the burst and the spread', () => {
    const { p } = profile('venomShower');
    // 5 pods over a disc of 2.2; a burst of 1.4 and a target 0.5 wide: ((1.4 + 0.5) / 2.2)^2 of them.
    expect(podHits(p)).toBeCloseTo(5 * (1.9 / 2.2) ** 2, 5);
    // More area widens both the spread and the burst, but not the target: a smaller share of the pods bursts on it.
    const wide = profile('venomShower', 'wideBlast').p;
    const rm = wide.radiusMult;
    expect(rm).toBeGreaterThan(1);
    expect(podHits(wide)).toBeCloseTo(5 * ((1.4 * rm + 0.5) / (2.2 * rm)) ** 2, 5);
    expect(podHits(wide)).toBeLessThan(podHits(p));
  });

  it('the first two volleys of Rain of Steel reach a target at the aim, each weaker', () => {
    const { p } = profile('rainOfSteel');
    const v = volleysHits(p);
    expect(v).toBeGreaterThan(1.5);
    expect(v).toBeLessThan(2);
  });

  it('a shotgun fan of 45 degrees hits once at three tiles, and close up three arrows hit', () => {
    const { p } = profile('splinterVolley');
    expect(shotgunHits(p, 3)).toBe(1);
    expect(shotgunHits(p, 0.7)).toBe(3);
  });

  it('a clone shoots as it appears and then at the weapon speed, for the length it stands', () => {
    const { c, p } = profile('mirrorQuiver');
    const spec = p.skill.mirror!;
    const hand = c.hands[0];
    const per = cloneDamage(hand, spec, p);
    const flat = hand.flats.reduce((a, [lo, hi]) => a + (lo + hi) / 2, 0);
    const blows = Math.floor(spec.seconds * p.skillDuration * hand.aps * p.minionSpeed + 1e-9) + 1;
    expect(per).toBeCloseTo(blows * flat * 1.75 * p.minionDamage * 0.85, 5);
  });

  it('an orb at a target far past the end of its path strikes it little or not at all', () => {
    const { p } = profile('driftingStorm');
    expect(orbHits(p, 3)).toBeGreaterThanOrEqual(2);
    expect(orbHits(p, 30)).toBe(0);
  });

  it('only the cold strike of an element skill hits the one struck again, one use in three', () => {
    const { p } = profile('primeSplash');
    expect(elementAfterHits(p, DISTANCE)).toBeCloseTo(1 / 3, 5);
  });
});
