import { describe, expect, it } from 'vitest';
import { Character, sheetDps } from '../calc/character';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld, dummyDefence } from './dummy';
import { stepWorld } from './world';

/**
 * EXPANSION 5.5a: every equipped active skill is cast when ready, with a cooldown. The sim's long-run
 * damage and use counts must match the calc within ±5% for a primary plus one secondary.
 */

function build(primary: string, secondary: string, mainHand: string) {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 30;
  b.equipment.mainHand = makeItem(uid, mainHand, 30, 1);
  const body = makeItem(uid, 'body_ar_1', 30, 1);
  body.sockets = [makeGem(uid, primary)];
  b.equipment.body = body;
  const boots = makeItem(uid, 'boots_ar_1', 30, 1);
  boots.sockets = [makeGem(uid, secondary)];
  b.equipment.boots = boots;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const SEEDS = [1, 2, 3, 4, 5];

describe('secondary casts (EXPANSION 5.5a)', () => {
  const b = build('crushingBlow', 'flameBolt', 'mace2_3');
  const distance = 1.6;

  it('the character lists every other active skill as a secondary, with a cooldown', () => {
    const c = new Character(b, { targetDistance: distance });
    expect(c.primary.skill.id).toBe('crushingBlow');
    expect(c.secondaries.map((s) => s.skill.id)).toEqual(['flameBolt']);
    const useTime = c.profile(c.secondaries[0]).useTime;
    expect(c.cooldownOf(c.secondaries[0])).toBeCloseTo(Math.max(3, 6 * useTime), 6);
    const s = c.sheet();
    expect(s.secondary).toHaveLength(1);
    expect(s.secondaryDps).toBeGreaterThan(0);
    expect(sheetDps(s)).toBeCloseTo(s.skill.sustainedDps + s.triggeredDps + s.secondaryDps, 6);
  });

  it('a skill that cannot reach as far as the primary is not a secondary', () => {
    // A bow primary stands off; a melee skill would never be in reach, so it must not be credited either.
    const run = newRun('strider', 1);
    const uid = () => run.nextUid++;
    const bow = run.build;
    bow.level = 30;
    bow.equipment.mainHand = makeItem(uid, 'bow_3', 30, 1);
    delete bow.equipment.offHand;
    const body = makeItem(uid, 'body_ar_1', 30, 1);
    body.sockets = [makeGem(uid, 'splitVolley')];
    bow.equipment.body = body;
    const boots = makeItem(uid, 'boots_ar_1', 30, 1);
    boots.sockets = [makeGem(uid, 'crushingBlow')];
    bow.equipment.boots = boots;
    bow.primaryGem = body.sockets[0]!.uid;
    bow.flasks = [null, null, null, null, null];
    const c = new Character(bow, { targetDistance: 4 });
    expect(c.primary.skill.id).toBe('splitVolley');
    expect(c.secondaries).toEqual([]);
    expect(c.sheet().secondaryDps).toBe(0);
    const { world } = createDummyWorld(bow, { distance: 4, maxTime: 60, seed: 1 });
    let melee = 0;
    while (world.status === 'running') {
      stepWorld(world);
      for (const e of world.events)
        if (e.t === 'use' && e.src === world.player.id && e.skill === 'crushingBlow') melee++;
    }
    expect(melee).toBe(0);
  });

  it('the primary gives up the time the secondary takes', () => {
    const solo = new Character(
      { ...b, equipment: { ...b.equipment, boots: undefined } },
      { targetDistance: distance },
    );
    const both = new Character(b, { targetDistance: distance });
    expect(solo.secondaries).toHaveLength(0);
    expect(solo.primaryShare()).toBe(1);
    expect(both.primaryShare()).toBeLessThan(1);
    expect(both.sheet().skill.usesPerSec).toBeLessThan(solo.sheet().skill.usesPerSec);
  });

  it('sim damage and cast counts match the calc within 5%', () => {
    const c = new Character(b, { targetDistance: distance });
    const t = { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] };
    const prim = c.skillSheet(c.primary, t, c.configConds, undefined, 0, c.primaryShare());
    const sec = c.secondarySheets(c.configConds, t);
    const calcDps = prim.hitDps + sec.reduce((a, s) => a + s.skill.hitDps, 0);
    const calcSecUses = sec[0].usesPerSec;

    let dmg = 0;
    let time = 0;
    let secUses = 0;
    let primUses = 0;
    for (const seed of SEEDS) {
      const { world } = createDummyWorld(b, { distance, maxTime: 600, seed });
      while (world.status === 'running') {
        stepWorld(world);
        for (const e of world.events) {
          if (e.t === 'hit' && e.src === world.player.id) dmg += e.amount;
          if (e.t === 'use' && e.src === world.player.id) {
            if (e.skill === 'flameBolt') secUses++;
            else if (e.skill === 'crushingBlow') primUses++;
          }
        }
      }
      time += world.t;
    }
    const within = (sim: number, calc: number, what: string) => {
      const r = sim / calc;
      expect(r, `${what}: sim ${sim.toFixed(3)} vs calc ${calc.toFixed(3)}`).toBeGreaterThan(0.95);
      expect(r, `${what}: sim ${sim.toFixed(3)} vs calc ${calc.toFixed(3)}`).toBeLessThan(1.05);
    };
    within(secUses / time, calcSecUses, 'secondary casts per second');
    within(primUses / time, prim.usesPerSec, 'primary uses per second');
    within(dmg / time, calcDps, 'hit DPS');
  });
});

describe('Echoing Cast repeats the spell (visible and in the numbers)', () => {
  function spellBuild(gems: string[]) {
    const run = newRun('mystic', 1);
    const uid = () => run.nextUid++;
    const b = run.build;
    b.level = 30;
    const body = makeItem(uid, 'body_ar_1', 30, gems.length);
    body.sockets = gems.map((g) => makeGem(uid, g));
    b.equipment.body = body;
    b.primaryGem = body.sockets[0]!.uid;
    b.flasks = [null, null, null, null, null];
    return b;
  }
  const dist = 4;

  it('each cast lands twice, and the calc counts both', () => {
    const plain = new Character(spellBuild(['flameBolt']), { targetDistance: dist });
    const echo = new Character(spellBuild(['flameBolt', 'echoingCast']), { targetDistance: dist });
    expect(echo.profile(echo.primary, 0).repeats).toBe(1);
    expect(plain.profile(plain.primary, 0).repeats).toBe(0);
    const a = plain.sheet().skill;
    const b = echo.sheet().skill;
    // Slower casts (cast speed -20%), twice the hits, 10% less damage each.
    expect(b.usesPerSec / a.usesPerSec).toBeCloseTo(0.8, 2);
    expect(b.hitDps / a.hitDps).toBeCloseTo(0.8 * 2 * 0.9, 2);
  });

  it('the sim fires the spell twice per cast, and the damage matches the calc within 5%', () => {
    const b = spellBuild(['flameBolt', 'echoingCast']);
    const c = new Character(b, { targetDistance: dist });
    const calc = c.skillSheet(c.primary, {
      def: dummyDefence(),
      shock: 0,
      resShift: [0, 0, 0, 0, 0],
    });
    let dmg = 0;
    let time = 0;
    let uses = 0;
    let echoes = 0;
    let projectiles = 0;
    for (const seed of [1, 2, 3]) {
      const { world } = createDummyWorld(b, { distance: dist, maxTime: 400, seed });
      while (world.status === 'running') {
        stepWorld(world);
        for (const e of world.events) {
          if (e.t === 'hit' && e.src === world.player.id) dmg += e.amount;
          if (e.t === 'use' && e.src === world.player.id) uses++;
          if (e.t === 'echo') echoes++;
          if (e.t === 'projectileSpawned') projectiles++;
        }
      }
      time += world.t;
    }
    expect(echoes / uses).toBeGreaterThan(0.95);
    expect(projectiles / uses).toBeGreaterThan(1.9);
    expect(uses / time).toBeGreaterThan(calc.usesPerSec * 0.95);
    expect(uses / time).toBeLessThan(calc.usesPerSec * 1.05);
    const ratio = dmg / time / calc.hitDps;
    expect(
      ratio,
      `sim ${(dmg / time).toFixed(2)} vs calc ${calc.hitDps.toFixed(2)}`,
    ).toBeGreaterThan(0.95);
    expect(ratio).toBeLessThan(1.05);
  });
});
