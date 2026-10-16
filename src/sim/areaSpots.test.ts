import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { ACTIVE_GEMS } from '../data/gems';
import { createDummyWorld } from './dummy';
import { buildFor, classFor, weaponFor } from './gemKit';
import type { World } from './types';
import { stepWorld } from './world';

/**
 * No skill and no support puts two areas of one use on one spot. These run a skill against the dummy and look at where its
 * areas go off, one tick (one moment) at a time.
 */

type Burst = { t: number; x: number; y: number; r: number };

function run(gems: string[], seconds: number, distance = 2.5) {
  const def = ACTIVE_GEMS.find((g) => g.id === gems[0])!;
  const off = def.needsShield ? 'shield' : def.needsDualWield || def.bothWeapons ? 'dual' : 'none';
  const b = buildFor(gems, weaponFor(def), classFor(def.attr), off);
  const c = new Character(b, { areaLevel: 50 });
  const { world, dummy } = createDummyWorld(b, { distance });
  world.sides[0].opts.freeResources = true;
  world.sides[0].opts.godMode = true;
  const bursts: Burst[] = [];
  const sprung: { t: number; x: number; y: number }[] = [];
  const zones: { t: number; x: number; y: number; r: number }[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(world);
    for (const e of world.events) {
      if (e.t === 'explode') bursts.push({ t: world.t, x: e.x, y: e.y, r: e.r });
      if (e.t === 'sprung') sprung.push({ t: world.t, x: e.x, y: e.y });
    }
    for (const z of (world as World).zones)
      if (!seen.has(z.id)) {
        seen.add(z.id);
        zones.push({ t: world.t, x: z.x, y: z.y, r: z.radius });
      }
  }
  return { c, world, dummy, bursts, sprung, zones };
}

/** The moments at which several things went off at once, with what each did. */
function together<T extends { t: number }>(list: T[], most = 1): T[][] {
  const by = new Map<number, T[]>();
  for (const x of list) by.set(x.t, [...(by.get(x.t) ?? []), x]);
  return [...by.values()].filter((g) => g.length > most);
}

const apart = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe('what a set of traps, mines or totems does together', () => {
  const cases: [string, string[]][] = [
    ['Double Set traps', ['frostTrap', 'doubleSet']],
    ['Triple Snare traps', ['frostTrap', 'tripleSnare']],
    ['Snare Cluster traps', ['frostTrap', 'snareCluster']],
    ['Double Set mines', ['mortarCharge', 'doubleSet']],
    ['Field of Charges mines', ['mortarCharge', 'fieldOfCharges']],
    ['Totem Choir totems', ['creepingPlague', 'standingCast', 'totemChoir']],
  ];
  for (const [name, gems] of cases)
    it(`${name}: the areas that go off together do not share a spot, and each holds the enemy`, () => {
      const { dummy, bursts } = run(gems, 8);
      // The areas of the skill itself (a mine's rain and a leftover mark are smaller).
      const big = bursts.filter((b) => b.r >= 2);
      const groups = together(big);
      expect(groups.length).toBeGreaterThan(0);
      for (const g of groups) {
        for (let i = 0; i < g.length; i++) {
          // (The enemy stands inside every one of them.)
          expect(apart(g[i], dummy)).toBeLessThanOrEqual(g[i].r);
          for (let j = i + 1; j < g.length; j++) expect(apart(g[i], g[j])).toBeGreaterThan(0.2);
        }
      }
    });

  it('a lone trap still lands on its enemy', () => {
    const { dummy, bursts } = run(['frostTrap'], 6);
    const big = bursts.filter((b) => b.r >= 2);
    expect(big.length).toBeGreaterThan(0);
    for (const b of big) expect(apart(b, dummy)).toBeLessThan(0.05);
  });
});

describe('what one use of a skill does with its supports', () => {
  it('Echoing Cast: the repeat of a burst lands off the first, and the enemy is still in it', () => {
    const { dummy, bursts } = run(['suddenFrost', 'echoingCast'], 2);
    const big = bursts.filter((b) => b.r >= 2 && b.t < 1.5);
    expect(big.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < big.length; i++) {
      expect(apart(big[i], dummy)).toBeLessThanOrEqual(big[i].r);
      for (let j = i + 1; j < big.length; j++) expect(apart(big[i], big[j])).toBeGreaterThan(0.2);
    }
  });

  it('a burst that leaves ground behind is marked once, not twice', () => {
    for (const id of ['suddenFrost', 'blizzardRing', 'cleansingBlaze']) {
      const { bursts } = run([id], 1.2);
      for (const g of together(bursts))
        for (let i = 0; i < g.length; i++)
          for (let j = i + 1; j < g.length; j++)
            expect(apart(g[i], g[j]) < 0.2 && Math.abs(g[i].r - g[j].r) < 0.05, id).toBe(false);
    }
  });

  it('Artillery Ballista: the arrows of one shot burst along a line, not on one spot', () => {
    const { bursts } = run(['mortarBow'], 1.6, 2.5);
    const first = bursts.filter((b) => b.t < 1.5);
    expect(first.length).toBeGreaterThan(1);
    for (let i = 0; i < first.length; i++)
      for (let j = i + 1; j < first.length; j++)
        expect(apart(first[i], first[j])).toBeGreaterThan(0.3);
  });

  it('Molten Strike: the balls thrown round the enemy keep their distance', () => {
    const { zones } = run(['slagBlow'], 8, 1.6);
    const groups = together(zones);
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups)
      for (let i = 0; i < g.length; i++)
        for (let j = i + 1; j < g.length; j++) expect(apart(g[i], g[j])).toBeGreaterThan(0.3);
  });
});
