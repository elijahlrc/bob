import { describe, expect, it } from 'vitest';
import type { Build } from '../data/types';
import { createDummyWorld, dummyDefence } from '../sim/dummy';
import { activeGem, buildFor, buildForActive, classFor, weaponFor } from '../sim/gemKit';
import type { World } from '../sim/types';
import { stepWorld } from '../sim/world';
import { Character, scenarioDps } from './character';
import type { TargetState } from './combat';
import { mineAura, mineRainHits, mortarHits } from './deployed';

/**
 * Totems, traps, mines and walls: the sheet's damage against the sim's (docs/SHEET-AUDIT.md section 5). One gem alone, level 50, a
 * fitting weapon, a boss-sized training dummy that does not move, free mana; the sim's side is everything its ledger says was dealt.
 * What one shot, trap or mine is worth is the calc's (`src/calc/deployed.ts`); how often it goes off is the rotation's, and for
 * mines and traps the rotation stands them (`setStanding`): the character lays no more once as many as may stand do, and uses its
 * weapon until they go off.
 */

type Run = {
  c: Character;
  target: TargetState;
  /** The sheet's damage a second for the rotation, and the sim's. */
  sheet: number;
  sim: number;
  world: World;
  secs: number;
  /** Uses of each skill (what the character started) and shots (what its totems, traps and mines fired), by skill id. */
  uses: Record<string, number>;
  shots: Record<string, number>;
  /** The ledger's rows of damage dealt, by name: the damage and the number of hits. */
  rows: Record<string, { dmg: number; hits: number }>;
};

function play(ids: string[], o: { distance?: number; time?: number } = {}): Run {
  const distance = o.distance ?? 3;
  const def = activeGem(ids[0]);
  const base: Build =
    ids.length === 1
      ? buildForActive(def)
      : buildFor(ids, weaponFor(def), classFor(def.attr), 'none');
  // The character keeps its first target, so that the dummy is the one it fights.
  const build: Build = { ...base, strategy: { ...base.strategy, target: 'stick' } as never };
  const c = new Character(build, { targetDistance: distance, areaLevel: build.level });
  const target: TargetState = { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] };
  const sheet = scenarioDps(c.sheet(c.configConds, 'boss', target));
  const { world } = createDummyWorld(build, {
    distance,
    maxTime: o.time ?? 40,
    seed: 1,
    rarity: 'boss',
    fixed: true,
  });
  const me = world.sides[0].player.id;
  const uses: Record<string, number> = {};
  const shots: Record<string, number> = {};
  while (world.status === 'running') {
    stepWorld(world);
    for (const e of world.events)
      if (e.t === 'use' && e.src === me) {
        const into = e.via ? shots : uses;
        into[e.skill] = (into[e.skill] ?? 0) + 1;
      }
  }
  const rows: Run['rows'] = {};
  let total = 0;
  for (const kind of ['skill', 'minion', 'ailment', 'monster', 'effect'] as const)
    for (const r of world.sides[0].ledger.dealt[kind].values()) {
      const dmg = r.dmg.reduce((a, b) => a + b, 0);
      total += dmg;
      const row = (rows[r.name] ??= { dmg: 0, hits: 0 });
      row.dmg += dmg;
      row.hits += r.hits;
    }
  return { c, target, sheet, sim: total / world.t, world, secs: world.t, uses, shots, rows };
}

/** sim / sheet, which is 1 when the sheet predicts the damage the game deals. */
const ratio = (r: Run) => r.sim / r.sheet;

describe('mortar (Mortar Bow)', () => {
  it('the sheet counts every arrow that bursts on the target, not one a shot', () => {
    const r = play(['mortarBow']);
    expect(ratio(r)).toBeGreaterThan(0.9);
    expect(ratio(r)).toBeLessThan(1.1);
  });

  it('follows the supports: more arrows, more of them on the target', () => {
    const r = play(['mortarBow', 'wideSalvo']);
    expect(ratio(r)).toBeGreaterThan(0.9);
    expect(ratio(r)).toBeLessThan(1.1);
  });

  it('a target further off is reached by fewer of the arrows', () => {
    const p = new Character(buildForActive(activeGem('mortarBow'))).profile(
      new Character(buildForActive(activeGem('mortarBow'))).primary,
    );
    expect(mortarHits(p, 8)).toBeLessThan(mortarHits(p, 3));
    expect(mortarHits(p, 8)).toBeGreaterThanOrEqual(1);
    // ... and the sim agrees that a far target takes less than a near one.
    const near = play(['mortarBow'], { distance: 3, time: 20 });
    const far = play(['mortarBow'], { distance: 9, time: 20 });
    const perShot = (r: Run) => r.rows['Mortar Bow'].hits / (r.shots.mortarBow ?? 1);
    expect(perShot(far)).toBeLessThan(perShot(near));
  });
});

describe('mines (Mortar Charge)', () => {
  const r = play(['mortarCharge']);

  it('a mine that goes off rains small bursts that land on the target as the sim lands them', () => {
    const p = r.c.profile(r.c.primary);
    const goes = r.shots.mortarCharge ?? 0;
    expect(goes).toBeGreaterThan(50);
    // The burst itself and the rain that comes after it.
    const simHits = r.rows['Mortar Charge'].hits / goes;
    const calcHits = 1 + mineRainHits(r.c.primary, p);
    expect(calcHits / simHits).toBeGreaterThan(0.9);
    expect(calcHits / simHits).toBeLessThan(1.1);
  });

  it('the aura of the mines near the target adds fire damage to the hits against it', () => {
    const p = r.c.profile(r.c.primary);
    const goes = r.shots.mortarCharge ?? 0;
    // The aura rides on every hit the character lands (the mine's, and the weapon's between mines).
    const hits = r.rows['Mortar Charge'].hits + (r.rows['Default Attack']?.hits ?? 0);
    const simAdd = r.rows.Mine.dmg / hits;
    const calcAdd = mineAura(r.c.primary, p, r.target, goes / r.secs).add;
    expect(calcAdd / simAdd).toBeGreaterThan(0.85);
    expect(calcAdd / simAdd).toBeLessThan(1.15);
  });

  it('the rotation lays mines without a pause: as many go off a second as the sim sets off, up to the mine limit', () => {
    const plan = r.c.plan(r.c.configConds, 'boss');
    const acts = plan.acts[r.c.primary.key] / (r.uses.mortarCharge / r.secs);
    expect(acts).toBeGreaterThan(0.9);
    expect(acts).toBeLessThan(1.1);
    // Fifteen may lie at once (the reference's limit), more than a fight at the target ever leaves: the weapon has no gap to fill.
    expect(plan.weapon).toBeLessThan(0.05);
  });

  it('the sheet predicts the damage a second', () => {
    expect(ratio(r)).toBeGreaterThan(0.9);
    expect(ratio(r)).toBeLessThan(1.1);
  });

  it('follows the supports: Echoing Cast lays the mines again', () => {
    const e = play(['mortarCharge', 'echoingCast']);
    expect(ratio(e)).toBeGreaterThan(0.9);
    expect(ratio(e)).toBeLessThan(1.1);
  });

  it('follows the supports: Wide Blast, a wider burst and a wider rain', () => {
    const w = play(['mortarCharge', 'wideBlast']);
    expect(ratio(w)).toBeGreaterThan(0.9);
    expect(ratio(w)).toBeLessThan(1.1);
  });
});

describe('mines (Storm Charge)', () => {
  it('the enemies near the mines take more from every hit, and the sheet counts it', () => {
    const r = play(['stormCharge']);
    const p = r.c.profile(r.c.primary);
    // The mines near the target make it take more from every hit, and add no damage of their own.
    const aura = mineAura(r.c.primary, p, r.target, (r.shots.stormCharge ?? 0) / r.secs);
    expect(aura.more).toBeGreaterThan(1.02);
    expect(aura.add).toBe(0);
    expect(ratio(r)).toBeGreaterThan(0.9);
    expect(ratio(r)).toBeLessThan(1.1);
  });
});

describe('traps (Shrapnel Trap)', () => {
  const r = play(['shrapnelTrap']);

  it('one trap is worth what the sheet says; the repeats lay more traps', () => {
    // The sheet's hit, once for each trap that goes off.
    const traps = r.shots.shrapnelTrap ?? 0;
    expect(traps).toBeGreaterThan(50);
    const perTrap = r.rows['Shrapnel Trap'].dmg / traps;
    const s = r.c.sheet(r.c.configConds, 'boss', r.target).skill;
    expect(perTrap / (s.avgHit * s.hitChance)).toBeGreaterThan(0.85);
    expect(perTrap / (s.avgHit * s.hitChance)).toBeLessThan(1.15);
  });

  it('the rotation stands the traps: the character cannot lay more while the last ones stand, and uses its weapon', () => {
    const plan = r.c.plan(r.c.configConds, 'boss');
    const acts = plan.acts[r.c.primary.key] / (r.uses.shrapnelTrap / r.secs);
    expect(acts).toBeGreaterThan(0.9);
    expect(acts).toBeLessThan(1.1);
    expect(plan.weapon).toBeGreaterThan(0.3);
  });

  it('the sheet predicts the damage a second', () => {
    expect(ratio(r)).toBeGreaterThan(0.9);
    expect(ratio(r)).toBeLessThan(1.1);
  });
});

describe('traps (Fire Breath Trap)', () => {
  it('a trap breathes for as many hits as the sheet counts', () => {
    const r = play(['fireBreathTrap']);
    const p = r.c.profile(r.c.primary);
    const traps = r.shots.fireBreathTrap ?? 0;
    const perTrap = r.rows['Fire Breath Trap'].hits / traps;
    expect(perTrap / p.pulses).toBeGreaterThan(0.9);
    expect(perTrap / p.pulses).toBeLessThan(1.1);
    // The sim's target is ignited most of the time, so the gem's 25% more damage against the ignited holds in it and the sheet,
    // which takes no condition of the target for granted, leaves it out: the total is a little low (docs/SHEET-AUDIT.md section 6).
    expect(ratio(r)).toBeGreaterThan(0.9);
    expect(ratio(r)).toBeLessThan(1.25);
  });
});

describe('walls (Glacier Wall)', () => {
  it('a wall hurts what stands under it once, as it goes up, not a pulse of the ground each half second', () => {
    const r = play(['glacierWall']);
    const p = r.c.profile(r.c.primary);
    expect(p.pulses).toBe(1);
    const casts = r.uses.glacierWall ?? 0;
    expect(casts).toBeGreaterThan(5);
    const row = r.rows['Glacier Wall'];
    // One hit for a wall raised, as the sheet counts. (A cast that finds its place still walled raises nothing: with the dummy
    // fixed that is about every other cast, where an enemy that walks off would be walled again.)
    expect(row.hits).toBeGreaterThan(casts * 0.3);
    const sheet = r.c.sheet(r.c.configConds, 'boss', r.target).skill;
    const simPerCast = row.dmg / row.hits;
    const sheetPerCast = sheet.hitDps / sheet.usesPerSec;
    expect(simPerCast / sheetPerCast).toBeGreaterThan(0.9);
    expect(simPerCast / sheetPerCast).toBeLessThan(1.1);
  });
});

describe('totems (Cinder Bond)', () => {
  it('the beams of burning ground between totems and the weapon between them add up as the sim has them', () => {
    const r = play(['cinderBond']);
    expect(ratio(r)).toBeGreaterThan(0.9);
    expect(ratio(r)).toBeLessThan(1.1);
  });
});
