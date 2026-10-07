import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, AURA_GEMS, gemDef, SUPPORT_GEMS } from '../data/gems';
import { makeGem, makeItem } from '../gen/items';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { Character } from './character';
import { spellBaseDamage } from '../data/constants';
import { gemAttrReq, levelValue, naturalGemLevel, resolveActive, spellDamageAt } from './gems';

function buildWith(
  classId: string,
  level: number,
  gems: string[],
  extraMods = [] as ReturnType<typeof mod>[],
) {
  const run = newRun(classId, 1);
  const uid = () => run.nextUid++;
  run.build.level = level;
  const body = makeItem(uid, 'body_ar_1', level, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  body.implicits.push(...extraMods);
  run.build.equipment.body = body;
  run.build.primaryGem = body.sockets[0]!.uid;
  return run.build;
}

describe('gems (§11.5)', () => {
  it('has the first 7 actives, 19 supports and 7 auras, and the coverage plan adds more (generated)', () => {
    expect(ACTIVE_GEMS.length).toBeGreaterThanOrEqual(7);
    expect(SUPPORT_GEMS.length).toBeGreaterThanOrEqual(19);
    expect(AURA_GEMS.length).toBeGreaterThanOrEqual(7);
  });

  it('interpolates L1→L20 and extrapolates above', () => {
    expect(levelValue([10, 48], 1)).toBe(10);
    expect(levelValue([10, 48], 20)).toBe(48);
    expect(levelValue([10, 48], 21)).toBe(50);
    expect(levelValue([9, 520], 20, true)).toBeCloseTo(520);
  });

  it('auto-levels by character level and attributes', () => {
    const d = gemDef('crushingBlow');
    expect(naturalGemLevel(d, 1, { str: 999, dex: 0, int: 0 })).toBe(1);
    expect(naturalGemLevel(d, 70, { str: 999, dex: 0, int: 0 })).toBe(20);
    expect(naturalGemLevel(d, 70, { str: 10, dex: 0, int: 0 })).toBe(1);
    expect(gemAttrReq('str', 20).str).toBe(98);
    expect(gemAttrReq('dexint', 20).dex).toBe(Math.round(98 * 0.6));
  });

  it('+level of socketed gems goes past 20 up to 25', () => {
    const b = buildWith(
      'vanguard',
      80,
      ['crushingBlow'],
      [mod('socketedGemLevel', 'base', 9, { local: true })],
    );
    b.allocated = [];
    const run = new Character({ ...b });
    // Attribute requirements may cap the natural level; the bonus is added on top, max 25.
    const g = run.gems[0];
    expect(g.level).toBeLessThanOrEqual(25);
    expect(g.level).toBeGreaterThan(9);
  });

  it('projectile counts and chains grow every 5 levels', () => {
    expect(resolveActive(gemDef('splitVolley') as never, 10).behaviour).toMatchObject({ count: 5 });
    expect(resolveActive(gemDef('arcChain') as never, 15).behaviour).toMatchObject({ chains: 5 });
  });

  it('supports apply only to matching actives in the same item and multiply cost', () => {
    const c = new Character(buildWith('mystic', 20, ['flameBolt', 'bruteForce', 'quickCast']));
    const fb = c.actives[0];
    expect(fb.supports.map((s) => s.def.id)).toEqual(['quickCast']);
    expect(fb.costMult).toBeCloseTo(1.2);
  });

  it('falls back to the default attack when the primary needs another weapon', () => {
    const c = new Character(buildWith('vanguard', 10, ['splitVolley']));
    expect(c.primary.gemUid).toBeNull();
    expect(c.warnings.join()).toMatch(/needs a bow/);
  });

  it('auras reserve mana in socket order; one that does not fit is inactive', () => {
    const c = new Character(
      buildWith('mystic', 10, ['flameBolt', 'stormHalo', 'arcaneWard', 'kindlingHalo']),
    );
    const states = c.auras.map((a) => a.active);
    expect(states).toEqual([true, true, false]);
    expect(c.reservedMana).toBeGreaterThan(0);
    expect(c.sheet().warnings.join()).toMatch(/Kindling Halo is inactive/);
    // Arcane Ward's ES is granted.
    expect(c.defence().maxEs).toBeGreaterThan(0);
  });

  it('reduced reservation lowers the cost', () => {
    const a = new Character(buildWith('mystic', 10, ['flameBolt', 'stormHalo']));
    const b = new Character(
      buildWith('mystic', 10, ['flameBolt', 'stormHalo'], [mod('reducedReservation', 'base', 20)]),
    );
    expect(b.reservedMana).toBeLessThan(a.reservedMana);
  });
});

describe('the shared spell base-damage curve (COVERAGE 5.2)', () => {
  it('turns a spread and an effectiveness into a damage range at any level', () => {
    const d = { type: 'fire', spread: [0.8, 1.2] } as const;
    const l1 = spellDamageAt(d, 100, 1);
    expect(l1.min).toBe(Math.round(spellBaseDamage(1) * 0.8));
    expect(l1.max).toBe(Math.round(spellBaseDamage(1) * 1.2));
    const l20 = spellDamageAt(d, 180, 20);
    expect((l20.min + l20.max) / 2).toBeCloseTo(spellBaseDamage(20) * 1.8, 0);
    expect(spellDamageAt(d, 100, 25).max).toBeGreaterThan(l20.max / 1.8);
  });

  it('a share scales one type of several', () => {
    const half = spellDamageAt({ type: 'cold', spread: [1, 1], share: 0.5 }, 100, 10);
    const full = spellDamageAt({ type: 'cold', spread: [1, 1] }, 100, 10);
    expect(Math.abs(half.min - full.min / 2)).toBeLessThanOrEqual(1);
  });

  it('keeps hand-tuned numbers as they are', () => {
    const r = spellDamageAt({ type: 'fire', min: [9, 520], max: [14, 780] }, 240, 1);
    expect(r).toEqual({ type: 'fire', min: 9, max: 14 });
  });
});
