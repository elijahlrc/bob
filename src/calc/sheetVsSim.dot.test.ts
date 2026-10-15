import { describe, expect, it } from 'vitest';
import { Character, scenarioDps } from './character';
import { carriedSeconds, renewalGap } from './dot';
import { planRotation } from './rotation';
import { activeGem, buildFor, buildForActive, weaponFor } from '../sim/gemKit';
import { createDummyWorld, dummyDefence } from '../sim/dummy';
import { stepWorld } from '../sim/world';
import type { Build } from '../data/types';
import type { Actor, World } from '../sim/types';

/**
 * Damage over time, curses and clouds, sheet against sim (docs/SHEET-AUDIT.md): one gem alone at level 50 against a boss-sized
 * training dummy, free mana. The sheet's boss DPS is compared with everything the sim's ledger says was dealt.
 */

const DISTANCE = 3;

type Run = {
  world: World;
  dummy: Actor;
  perSec: number;
  byName: Map<string, number>;
  uses: number;
};

/** Play the build against the dummy; `feed` is called each step (to lay corpses, say). */
function play(
  build: Build,
  skillId: string,
  maxTime: number,
  feed?: (world: World, dummy: Actor) => void,
  seed = 1,
): Run {
  const { world, dummy } = createDummyWorld(build, {
    distance: DISTANCE,
    maxTime,
    seed,
    rarity: 'boss',
    fixed: true,
  });
  let uses = 0;
  while (world.status === 'running') {
    feed?.(world, dummy);
    stepWorld(world);
    for (const e of world.events)
      if (e.t === 'use' && e.src === world.player.id && e.skill === skillId) uses++;
  }
  let total = 0;
  const byName = new Map<string, number>();
  for (const kind of ['skill', 'minion', 'ailment', 'monster', 'effect'] as const)
    for (const r of world.ledger.dealt[kind].values()) {
      const dmg = r.dmg.reduce((a, b) => a + b, 0);
      total += dmg;
      byName.set(r.name, (byName.get(r.name) ?? 0) + dmg / world.t);
    }
  return { world, dummy, perSec: total / world.t, byName, uses: uses / world.t };
}

const sheetOf = (build: Build) => {
  const c = new Character(build, { targetDistance: DISTANCE, areaLevel: build.level });
  const sheet = c.sheet(c.configConds, 'boss', {
    def: dummyDefence(),
    shock: 0,
    resShift: [0, 0, 0, 0, 0],
  });
  return { c, sheet, dps: scenarioDps(sheet) };
};

describe('Spirit Saw: the saw carries its debuff along', () => {
  const build = buildForActive(activeGem('spiritSaw'));
  it('the sheet counts the debuff on the target all the time the saw is near', () => {
    const { dps } = sheetOf(build);
    const sim = play(build, 'spiritSaw', 30);
    expect(sim.perSec / dps).toBeGreaterThan(0.9);
    expect(sim.perSec / dps).toBeLessThan(1.1);
  });

  /** Seconds, per pass, that a projectile of the character is within the debuff's zone of the dummy. */
  function passSeconds(b: Build): number {
    const { c } = sheetOf(b);
    const p = c.profile(c.primary);
    const zone = p.skillDot!.spec.carried! * p.radiusMult;
    const { world, dummy } = createDummyWorld(b, {
      distance: DISTANCE,
      maxTime: 12,
      seed: 1,
      rarity: 'boss',
      fixed: true,
    });
    let last = 0;
    let near = 0;
    let inside = false;
    let passes = 0;
    while (world.status === 'running') {
      stepWorld(world);
      const dt = world.t - last;
      last = world.t;
      const now = world.projectiles.some(
        (pr) =>
          pr.owner === world.player.id &&
          Math.hypot(pr.x - dummy.x, pr.y - dummy.y) <= zone + dummy.r,
      );
      if (now) near += dt;
      if (now && !inside) passes++;
      inside = now;
    }
    return near / passes;
  }

  it('a pass through the target keeps the debuff on for as long as the sim says', () => {
    const c = sheetOf(build).c;
    expect(carriedSeconds(c.profile(c.primary), DISTANCE)).toBeCloseTo(passSeconds(build), 1);
  });

  it('a faster saw crosses the zone sooner', () => {
    const fast = buildFor(
      ['spiritSaw', 'swiftFlight'],
      weaponFor(activeGem('spiritSaw')),
      'mystic',
    );
    const c = sheetOf(fast).c;
    const bare = sheetOf(build).c;
    const window = carriedSeconds(c.profile(c.primary), DISTANCE);
    expect(window).toBeLessThan(carriedSeconds(bare.profile(bare.primary), DISTANCE) * 0.8);
    expect(window).toBeCloseTo(passSeconds(fast), 1);
  });

  it('a skill that does not carry its debuff has no such stretch', () => {
    const b = buildForActive(activeGem('creepingPlague'));
    const c = sheetOf(b).c;
    expect(carriedSeconds(c.profile(c.primary), DISTANCE)).toBe(0);
  });
});

describe('Charge Release: a skill that spends charges the dummy test does not give', () => {
  it('with none held, the sheet and the sim both get nothing from the skill (the weapon fills the sim)', () => {
    const def = activeGem('chargeRelease');
    const build = buildForActive(def);
    const { c, sheet } = sheetOf(build);
    expect(c.charges.grit + c.charges.fervour + c.charges.insight).toBe(0);
    expect(sheet.skill.totalDps).toBe(0);
    const sim = play(build, def.id, 20);
    expect(sim.uses).toBe(0);
    expect(sim.byName.get(def.name) ?? 0).toBe(0);
  });
});

describe('a debuff that is renewed, not stacked (Creeping Plague, Ruin Ritual)', () => {
  for (const id of ['creepingPlague', 'ruinRitual']) {
    describe(id, () => {
      const build = buildForActive(activeGem(id));
      const { c, sheet } = sheetOf(build);
      const sim = play(build, id, 120);

      it("the sheet's damage over time is what the sim's ledger says the skill itself dealt", () => {
        const name = activeGem(id).name;
        const dealt = sim.byName.get(name) ?? 0;
        expect(dealt / sheet.skill.dotDps).toBeGreaterThan(0.9);
        expect(dealt / sheet.skill.dotDps).toBeLessThan(1.1);
      });

      it('the character casts it again only as it runs low: the rotation plan, given that gap, uses it as often as the sim', () => {
        const p = c.profile(c.primary);
        const gap = renewalGap(p)!;
        expect(gap).toBeGreaterThan(p.useTime);
        const plan = planRotation({
          rotation: [],
          mains: [{ key: id, useTime: p.useTime, pause: 0, cooldown: { seconds: gap, uses: 1 } }],
          weapon: c.profile(c.defaultAttack).useTime,
        });
        expect(plan.acts[id] / sim.uses).toBeGreaterThan(0.9);
        expect(plan.acts[id] / sim.uses).toBeLessThan(1.1);
        // The time it leaves is the weapon's: that is the damage the sheet's total misses without the gap in the plan.
        expect(plan.weapon).toBeGreaterThan(0.5);
      });
    });
  }

  it('a debuff that is stacked, or comes with a hit, has no gap to keep', () => {
    for (const id of ['spiritSaw', 'flameBolt']) {
      const c = sheetOf(buildForActive(activeGem(id))).c;
      expect(renewalGap(c.profile(c.primary))).toBeUndefined();
    }
  });
});
