import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import type { Defence } from '../calc/combat';
import type { Build, Item } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { createDummyWorld, dummyDefence } from './dummy';
import { stepWorld } from './world';

/**
 * §8.3 correctness anchor: long-run sim DPS against a stationary dummy must match the calc engine
 * within ±3%. Never weaken this test; fix the formula mismatch instead.
 */

type RefBuild = { name: string; build: Build; distance: number };

function buildFor(
  classId: string,
  level: number,
  gems: string[],
  opts: { main?: string; off?: string | null; bodyMods?: Item['implicits'] } = {},
): Build {
  const run = newRun(classId, 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = level;
  if (opts.main) b.equipment.mainHand = makeItem(uid, opts.main, level, 1);
  if (opts.off === null) delete b.equipment.offHand;
  else if (opts.off) b.equipment.offHand = makeItem(uid, opts.off, level, 1);
  const body = makeItem(uid, 'body_ar_1', level, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  if (opts.bodyMods) body.implicits.push(...opts.bodyMods);
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const REF_BUILDS: RefBuild[] = [
  {
    name: 'melee physical (Crushing Blow + Brute Force, 2H mace)',
    build: buildFor('vanguard', 30, ['crushingBlow', 'bruteForce'], { main: 'mace2_3' }),
    distance: 1.6,
  },
  {
    name: 'crit spell (Flame Bolt + Precision Strikes)',
    build: buildFor('mystic', 40, ['flameBolt', 'precisionStrikes', 'quickCast'], {
      bodyMods: [mod('critChance', 'inc', 150), mod('critMulti', 'base', 60)],
    }),
    distance: 4,
  },
  {
    name: 'conversion (Crushing Blow + Ember Infusion + 50% phys→cold)',
    build: buildFor('vanguard', 30, ['crushingBlow', 'emberInfusion'], {
      main: 'mace2_3',
      bodyMods: [
        mod('convert.physical.cold', 'base', 50),
        mod('damage', 'inc', 40, { damageTypes: ['cold'] }),
        mod('damage', 'inc', 25, { damageTypes: ['fire'] }),
      ],
    }),
    distance: 1.6,
  },
  {
    name: 'dual wield (Venom Cut, two daggers)',
    build: buildFor('shade', 30, ['venomCut', 'swiftAssault'], {
      main: 'dagger_3',
      off: 'dagger_2',
    }),
    distance: 1.4,
  },
  {
    name: 'dual wield Sweep (both weapons hit)',
    build: buildFor('reaver', 30, ['sweep'], { main: 'sword_3', off: 'axe_2' }),
    distance: 1.6,
  },
  {
    name: 'projectile attack (Split Volley, bow)',
    build: buildFor('strider', 30, ['splitVolley', 'swiftAssault'], { main: 'bow_3' }),
    distance: 4,
  },
  {
    name: 'chaining spell (Arc Chain)',
    build: buildFor('zealot', 30, ['arcChain', 'channelledElements']),
    distance: 4,
  },
  {
    name: 'falloff spell (Frost Lance)',
    build: buildFor('mystic', 30, ['frostLance']),
    distance: 5,
  },
];

const POISON_BUILD: RefBuild = {
  name: 'poison (Venom Cut + Toxin Coat)',
  build: buildFor('shade', 30, ['venomCut', 'toxinCoat'], { main: 'dagger_3', off: 'claw_2' }),
  distance: 1.4,
};

const DEFENCES: [string, Partial<Defence>][] = [
  ['no mitigation', {}],
  ['evasion and resistances', { evasion: 700, res: [0, 30, 40, 20, 25] }],
];

/** 600 simulated seconds per seed, pooled over several seeds to keep roll variance under ±3%. */
const SEEDS = [1, 2, 3, 4, 5];

function simulate(rb: RefBuild, defence: Partial<Defence>) {
  let hitDmg = 0;
  let poisonDmg = 0;
  let time = 0;
  for (const seed of SEEDS) {
    const { world, dummy } = createDummyWorld(rb.build, {
      distance: rb.distance,
      defence,
      maxTime: 600,
      seed,
    });
    while (world.status === 'running') {
      stepWorld(world);
      for (const e of world.events)
        if (e.t === 'hit' && e.src === world.player.id) hitDmg += e.amount;
      let pd = 0;
      for (const d of dummy.ail.poisons) pd += d.dps;
      poisonDmg += pd / 60;
    }
    time += world.t;
  }
  return { hitDps: hitDmg / time, poisonDps: poisonDmg / time };
}

function calcFor(rb: RefBuild, defence: Partial<Defence>) {
  const c = new Character(rb.build, { targetDistance: rb.distance });
  return c.skillSheet(c.primary, {
    def: dummyDefence(defence),
    shock: 0,
    resShift: [0, 0, 0, 0, 0],
  });
}

describe('calc ↔ sim convergence (§8.3)', () => {
  for (const rb of REF_BUILDS) {
    for (const [dname, def] of DEFENCES) {
      it(`${rb.name} — ${dname}`, () => {
        const calc = calcFor(rb, def);
        expect(calc.isDefault).toBe(false);
        expect(calc.hitDps).toBeGreaterThan(0);
        const sim = simulate(rb, def);
        const ratio = sim.hitDps / calc.hitDps;
        expect(
          ratio,
          `sim ${sim.hitDps.toFixed(2)} vs calc ${calc.hitDps.toFixed(2)}`,
        ).toBeGreaterThan(0.97);
        expect(
          ratio,
          `sim ${sim.hitDps.toFixed(2)} vs calc ${calc.hitDps.toFixed(2)}`,
        ).toBeLessThan(1.03);
      });
    }
  }

  for (const [dname, def] of DEFENCES) {
    it(`${POISON_BUILD.name} — steady-state poison DPS — ${dname}`, () => {
      const calc = calcFor(POISON_BUILD, def);
      expect(calc.poisonDps).toBeGreaterThan(0);
      const sim = simulate(POISON_BUILD, def);
      const ratio = sim.poisonDps / calc.poisonDps;
      expect(
        ratio,
        `sim ${sim.poisonDps.toFixed(2)} vs calc ${calc.poisonDps.toFixed(2)}`,
      ).toBeGreaterThan(0.97);
      expect(
        ratio,
        `sim ${sim.poisonDps.toFixed(2)} vs calc ${calc.poisonDps.toFixed(2)}`,
      ).toBeLessThan(1.03);
      const hr = sim.hitDps / calc.hitDps;
      expect(hr).toBeGreaterThan(0.97);
      expect(hr).toBeLessThan(1.03);
    });
  }
});
