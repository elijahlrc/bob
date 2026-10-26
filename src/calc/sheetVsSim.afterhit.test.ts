import { describe, expect, it } from 'vitest';
import { strongestOf } from './ailmentMax';
import { Character, scenarioDps, volleyHits } from './character';
import { dummyDefence, createDummyWorld } from '../sim/dummy';
import { activeGem, buildFor, buildForActive } from '../sim/gemKit';
import { stepWorld } from '../sim/world';
import type { Build } from '../data/types';

/**
 * The hits that follow a hit (docs/SHEET-AUDIT.md, section 5): the sheet and the sim are asked what one gem deals a second to one
 * boss-sized dummy that does not hit back (level 50, a fitting weapon, free mana). The sim's number is everything its ledger
 * says was dealt; the sheet's is `scenarioDps` of the boss fight against the same bare defence.
 */

function compare(build: Build, distance = 3, seconds = 60) {
  const c = new Character(build, { targetDistance: distance, areaLevel: build.level });
  const target = { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] };
  const sheet = scenarioDps(c.sheet(c.configConds, 'boss', target));
  const { world } = createDummyWorld(build, {
    distance,
    maxTime: seconds,
    seed: 1,
    rarity: 'boss',
    fixed: true,
  });
  while (world.status === 'running') stepWorld(world);
  let dealt = 0;
  for (const kind of ['skill', 'minion', 'ailment', 'monster', 'effect'] as const)
    for (const row of world.sides[0].ledger.dealt[kind].values())
      dealt += row.dmg.reduce((a, b) => a + b, 0);
  const sim = dealt / world.t;
  return { c, sheet, sim, ratio: sim / sheet };
}

const alone = (id: string, distance?: number, seconds?: number) =>
  compare(buildForActive(activeGem(id)), distance, seconds);

describe('the bolts, balls and scatter after a hit are counted on the sheet', () => {
  it('Bolt Cleave: the one bolt of the arc that reaches the target is a hit of 75%', () => {
    const { ratio } = alone('boltCleave');
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('Slag Blow: the balls that burst within reach of the struck enemy are hits of 50%', () => {
    const { ratio } = alone('slagBlow');
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('Slag Blow: more projectiles throw more balls, and more area reaches farther', () => {
    const solo = compare(buildFor(['slagBlow'], 'sword_3', 'vanguard'));
    const salvo = compare(buildFor(['slagBlow', 'twinSalvo'], 'sword_3', 'vanguard'));
    expect(salvo.ratio).toBeGreaterThan(0.9);
    expect(salvo.ratio).toBeLessThan(1.1);
    // (The support itself takes some damage off each hit, so compare the hits and not the dps.)
    const hitsOf = (r: typeof solo) => volleyHits(r.c.profile(r.c.primary), 3);
    expect(hitsOf(salvo)).toBeGreaterThan(hitsOf(solo));
    const wide = compare(buildFor(['slagBlow', 'wideCrush'], 'sword_3', 'vanguard'));
    expect(wide.ratio).toBeGreaterThan(0.9);
    expect(wide.ratio).toBeLessThan(1.1);
    expect(hitsOf(wide)).toBeGreaterThan(hitsOf(solo));
  });

  it('Slag Lob: the orb bursts where it lands and again where it bounces on, and the target is inside two', () => {
    const { ratio } = alone('slagLob');
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('Slag Lob: a smaller burst does not reach from the first to the second', () => {
    const build = buildForActive(activeGem('slagLob'));
    build.equipment.body!.uniqueMods = [{ stat: 'aoe', kind: 'inc', value: -40 }];
    const { c, ratio } = compare(build);
    const plain = new Character(buildForActive(activeGem('slagLob')), {
      targetDistance: 3,
      areaLevel: build.level,
    });
    expect(volleyHits(c.profile(c.primary), 3)).toBeLessThan(
      volleyHits(plain.profile(plain.primary), 3),
    );
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('Whirl Shot: the arrow, and one of the arrows it scatters where it ends, hit the target', () => {
    const { ratio } = alone('whirlShot');
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('Whirl Shot: extra projectiles scatter more arrows, which share one hit list and add no hits', () => {
    const { ratio } = compare(buildFor(['whirlShot', 'twinSalvo'], 'bow_3', 'strider'));
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('what a strike sends out has to hit too: against a target that is often missed the sheet counts less', () => {
    const build = buildForActive(activeGem('slagBlow'));
    const c = new Character(build, { targetDistance: 3, areaLevel: build.level });
    const p = c.profile(c.primary);
    // The strike itself is 1 of the hits; what it sends out is the rest, and lands only as often as a hit does.
    const all = volleyHits(p, 3);
    expect(all).toBeGreaterThan(1);
    expect(volleyHits(p, 3, 0.5)).toBeCloseTo(1 + (all - 1) * 0.5, 2);
    const evasive = { def: dummyDefence({ evasion: 6000 }), shock: 0, resShift: [0, 0, 0, 0, 0] };
    const s = c.sheet(c.configConds, 'boss', evasive).skill;
    expect(s.hitChance).toBeLessThan(0.8);
    const bare = c.sheet(c.configConds, 'boss', {
      def: dummyDefence(),
      shock: 0,
      resShift: [0, 0, 0, 0, 0],
    }).skill;
    // Both the strike and the balls are missed in the same share of uses, so the two figures keep the same proportions.
    expect(s.hitDps / bare.hitDps).toBeCloseTo(
      s.hitChance * ((1 + (all - 1) * s.hitChance) / all),
      1,
    );
  });

  it('Rime Splinter: the blades fly at the others, so the sheet adds no hit on the one struck', () => {
    const { c } = alone('rimeSplinter');
    expect(volleyHits(c.profile(c.primary), 3)).toBe(1);
  });
});

describe('only the strongest bleed or ignite burns, and the sheet counts the best of those alive', () => {
  const target = { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] };
  // About one hit in eighteen crits.
  const CC = 0.055;

  it('Gouge Shot: eleven bleeds are alive at once, and the best of them is well above the average one', () => {
    const { c, ratio } = alone('gougeShot');
    const p = c.profile(c.primary);
    const top = strongestOf(p, p.hands[0], target, 3, 1.4, CC);
    expect(top.bleed).toBeGreaterThan(1.25);
    expect(top.ignite).toBe(1);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('a bleed that comes once in a long while is the only one alive, so it stays at its average', () => {
    const { c } = alone('gougeShot');
    const p = c.profile(c.primary);
    expect(strongestOf(p, p.hands[0], target, 3, 0.05, CC).bleed).toBe(1);
    expect(strongestOf(p, p.hands[0], target, 3, 0, CC).bleed).toBe(1);
    // The more hits, the better the best of them.
    const some = strongestOf(p, p.hands[0], target, 3, 0.5, CC).bleed;
    const many = strongestOf(p, p.hands[0], target, 3, 3, CC).bleed;
    expect(some).toBeGreaterThan(1);
    expect(many).toBeGreaterThan(some);
  });

  it('Torch Arrow: the ignite is the best of those alive, and its burning goes by the average ignite', () => {
    // Over a longer fight: a minute is too short for the share of crits, which all ignite, to settle.
    const { c, ratio } = alone('torchArrow', 3, 200);
    const p = c.profile(c.primary);
    expect(strongestOf(p, p.hands[0], target, 3, 1.4, CC).ignite).toBeGreaterThan(1.1);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });
});
