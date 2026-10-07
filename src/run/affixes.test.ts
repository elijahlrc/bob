import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { buildMonster, type MonsterSpec } from '../calc/monster';
import { MAP_AFFIXES, mapAffixDef, rewardText } from '../data/mapAffixes';
import { themeDef } from '../data/themes';
import { makeItem } from '../gen/items';
import { mod } from '../mods/types';
import { makeMapPlan, rollMapAffixes } from '../gen/mapPlan';
import { runMap } from '../sim/runMap';
import { makeCharacter } from '../sim/world';
import { cfgFor } from './bot';
import { offersFor } from './preview';
import { withStarterGems } from './starterGems';
import { affixRewards, affixesFor, finishMap, newRun, planFor, worldOptsFor } from './run';
import { threatPreview } from './threat';

describe('map affixes (EXPANSION 7.5)', () => {
  it('every affix has text, a reward, and an effect', () => {
    for (const a of MAP_AFFIXES) {
      expect(a.text.length, a.id).toBeGreaterThan(8);
      expect(rewardText(a).length, a.id).toBeGreaterThan(5);
      const effect =
        (a.monsterMods?.length ?? 0) + (a.playerMods?.length ?? 0) + (a.extraRarePacks ?? 0);
      expect(effect, a.id).toBeGreaterThan(0);
    }
    expect(new Set(MAP_AFFIXES.map((a) => a.id)).size).toBe(MAP_AFFIXES.length);
  });

  it('none before map 20, then 0–1, 1–2 and 2–3, all different, and always the same offer', () => {
    for (let map = 1; map < 20; map++) expect(rollMapAffixes(7, map, 0)).toEqual([]);
    const counts = (lo: number, hi: number) => {
      const seen = new Set<number>();
      for (let map = lo; map <= hi; map++)
        for (let seed = 1; seed <= 30; seed++)
          for (const offer of [0, 1]) {
            const a = rollMapAffixes(seed, map, offer);
            expect(new Set(a).size).toBe(a.length);
            expect(rollMapAffixes(seed, map, offer)).toEqual(a);
            seen.add(a.length);
          }
      return [...seen].sort();
    };
    expect(counts(20, 39)).toEqual([0, 1]);
    expect(counts(40, 59)).toEqual([1, 2]);
    expect(counts(60, 99)).toEqual([2, 3]);
  });

  it('the plan carries the affixes, and every monster on the map has them', () => {
    const plan = makeMapPlan(5, 30, 'ashenCrypt', ['moreLife', 'fireproof']);
    expect(plan.affixes).toEqual(['moreLife', 'fireproof']);
    expect(plan.pop.monsters.length).toBeGreaterThan(0);
    for (const m of plan.pop.monsters) expect(m.spec.affix).toEqual(['moreLife', 'fireproof']);
    const spec = plan.pop.monsters[0].spec;
    const plain = buildMonster({ ...spec, affix: [] });
    const hardy = buildMonster(spec);
    expect(hardy.defence.maxLife).toBeCloseTo(plain.defence.maxLife * 1.4, -1);
    expect(hardy.defence.res[3]).toBe(plain.defence.res[3] + 40);
  });

  it('monster affixes: bloodless, no evade, extra chaos, more damage', () => {
    const base: MonsterSpec = {
      type: 'warrior',
      variant: 'none',
      rarity: 'normal',
      level: 40,
      mods: [],
    };
    const m = (id: string) => buildMonster({ ...base, affix: [id] });
    expect(m('noLeech').defence.cannotBeLeechedFrom).toBe(true);
    expect(m('noEvade').profile(0).alwaysHit).toBe(true);
    expect(
      m('extraChaos')
        .profile(0)
        .hands[0].chunks.some((c) => c.type === 4),
    ).toBe(true);
    const dmg = (id?: string) =>
      buildMonster({ ...base, affix: id ? [id] : [] })
        .profile(0)
        .hands[0].chunks.reduce((s, c) => s + c.max, 0);
    expect(dmg('moreDamage')).toBeCloseTo(dmg() * 1.25);
  });

  it('player affixes change the character: less maximum resistance, less recovery', () => {
    const run = newRun('vanguard', 1);
    run.build.level = 60;
    const plain = makeMapPlan(5, 60, 'ashenCrypt', []);
    const eroded = makeMapPlan(5, 60, 'ashenCrypt', ['lessMaxRes', 'lessRecovery']);
    const a = makeCharacter(run.build, plain).defence();
    const b = makeCharacter(run.build, eroded).defence();
    for (const t of [1, 2, 3, 4]) expect(b.maxRes[t]).toBe(a.maxRes[t] - 20);
    expect(b.lifeRegen).toBeLessThanOrEqual(a.lifeRegen);
  });

  it('extra rare packs add rare monsters', () => {
    const rares = (affixes: string[]) =>
      makeMapPlan(9, 40, 'ashenCrypt', affixes).pop.monsters.filter((m) => m.spec.rarity === 'rare')
        .length;
    expect(rares(['extraRares'])).toBeGreaterThan(rares([]));
  });

  it('affixes add to the loot: quantity and rarity multipliers', () => {
    expect(affixRewards([])).toEqual({ quantity: 0, rarity: 0 });
    const r = affixRewards(['moreLife', 'extraRares']);
    expect(r.quantity).toBeCloseTo(mapAffixDef('moreLife').reward.quantity!);
    expect(r.rarity).toBeCloseTo(0.3);
    const run = newRun('vanguard', 1);
    run.map = 40;
    expect(worldOptsFor(run, makeMapPlan(1, 40, 'ashenCrypt', ['moreLife'])).loot).toBeDefined();
  });
});

describe('threat preview (EXPANSION section 9)', () => {
  const run = withStarterGems(newRun('vanguard', 1));
  run.build.level = 50;
  run.map = 50;
  const ch = new Character(run.build, cfgFor(run));
  const theme = themeDef('ashenCrypt');

  it('a plain map is the reference: DPS ×1 and EHP ×1', () => {
    const p = threatPreview(ch, { ...theme, elementWeights: {}, typeWeights: {} }, 'clearing', []);
    expect(p.dps).toBeCloseTo(1);
    expect(p.ehp).toBeCloseTo(1);
  });

  it('tougher monsters cut your DPS, harder ones your effective HP', () => {
    const plain = threatPreview(ch, theme, 'clearing', []);
    expect(threatPreview(ch, theme, 'clearing', ['moreLife']).dps).toBeCloseTo(plain.dps / 1.4);
    expect(threatPreview(ch, theme, 'clearing', ['moreDamage']).ehp).toBeCloseTo(plain.ehp / 1.25);
  });

  it('lower maximum resistances, extra chaos and unevadeable hits cut your effective HP', () => {
    // Resistances well above the lowered cap, so the cap is what limits them.
    const capped = newRun('vanguard', 1);
    capped.build.level = 50;
    capped.map = 50;
    const ring = makeItem(() => 900, 'ring_all', 50, 0, 'unique');
    ring.uniqueMods = [mod('resist.allEle', 'base', 100), mod('resist.chaos', 'base', 100)];
    capped.build.equipment.ring1 = ring;
    const c = new Character(capped.build, cfgFor(capped));
    const plain = threatPreview(c, theme, 'clearing', []).ehp;
    expect(threatPreview(c, theme, 'clearing', ['lessMaxRes']).ehp).toBeLessThan(plain);
    expect(threatPreview(c, theme, 'clearing', ['extraChaos']).ehp).toBeLessThan(plain);
    expect(threatPreview(ch, theme, 'clearing', ['noEvade']).ehp).toBeLessThanOrEqual(
      threatPreview(ch, theme, 'clearing', []).ehp,
    );
  });

  it('a resistant monster cuts the DPS of an element it resists, not of physical', () => {
    const fireRun = withStarterGems(newRun('mystic', 1));
    fireRun.build.level = 50;
    fireRun.map = 50;
    const c = new Character(fireRun.build, cfgFor(fireRun));
    const plain = threatPreview(c, theme, 'clearing', []).dps;
    expect(threatPreview(c, theme, 'clearing', ['fireproof']).dps).toBeLessThan(plain);
    expect(threatPreview(c, theme, 'clearing', ['coldproof']).dps).toBeCloseTo(plain, 0);
  });

  it('the camp offers two maps, each with its affixes and numbers', () => {
    const r = newRun('reaver', 3);
    r.map = 45;
    r.build.level = 45;
    const offers = offersFor(r);
    expect(offers).toHaveLength(2);
    for (const o of offers) {
      expect(o.affixes).toEqual(affixesFor(r, o.themeId));
      expect(o.dps).toBeGreaterThan(0);
      expect(o.ehp).toBeGreaterThan(0);
    }
    expect(offers.some((o) => o.affixes.length > 0)).toBe(true);
  });
});

describe('death recap (EXPANSION section 9)', () => {
  it('a death records the killer, the last seconds of damage and your defences', () => {
    const run = newRun('mystic', 4);
    run.map = 40;
    const plan = planFor(run, run.nextThemes[0]);
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan));
    expect(res.status).toBe('dead');
    const r = res.recap!;
    expect(r).toBeDefined();
    expect(r.killer.length).toBeGreaterThan(0);
    expect(r.lines.length).toBeGreaterThan(0);
    expect(r.lines[0].amount).toBeGreaterThanOrEqual(r.lines[r.lines.length - 1].amount);
    expect(r.maxLife).toBeGreaterThan(0);
    expect(r.time).toBeGreaterThan(0);
    for (const k of ['fire', 'cold', 'lightning', 'chaos'] as const)
      expect(r.res[k]).toBeLessThanOrEqual(r.maxRes[k]);
    finishMap(run, res);
    expect(run.phase).toBe('dead');
    expect(run.lastRecap).toEqual(r);
  });

  it('a cleared map has no recap', () => {
    const run = newRun('vanguard', 2);
    const plan = planFor(run, run.nextThemes[0]);
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan));
    expect(res.status).toBe('cleared');
    expect(res.recap).toBeUndefined();
  });
});
