import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { buildMonster, type MonsterSpec } from '../calc/monster';
import {
  affixMonsterMods,
  affixPlayerMods,
  affixReward,
  affixStrength,
  affixText,
  MAP_AFFIXES,
  mapAffixDef,
  rewardText,
  scaleValue,
} from '../data/mapAffixes';
import { themeDef } from '../data/themes';
import { makeItem } from '../gen/items';
import { makeMapPlan } from '../gen/mapPlan';
import { mod } from '../mods/types';
import { makeCharacter } from '../sim/world';
import { cfgFor } from './bot';
import { chalkOptions } from './craft';
import { newRun, setMap, type RunState } from './run';
import { withStarterGems } from './starterGems';
import { affixThreat, scoreTheme } from './threat';

const base: MonsterSpec = {
  type: 'warrior',
  variant: 'none',
  rarity: 'normal',
  level: 60,
  mods: [],
};
const monster = (id?: string, level = 60) =>
  buildMonster({ ...base, level, affix: id ? [id] : [] });

describe('affix strength follows the level band (docs/MAPS.md 6.1)', () => {
  it('is half on levels 5 to 29, three quarters on 30 to 59, full from 60', () => {
    expect([5, 29].map(affixStrength)).toEqual([0.5, 0.5]);
    expect([30, 59].map(affixStrength)).toEqual([0.75, 0.75]);
    expect([60, 100].map(affixStrength)).toEqual([1, 1]);
  });

  it('values scale and round, but never to nothing; flags do not scale', () => {
    expect(scaleValue(40, 0.5)).toBe(20);
    expect(scaleValue(25, 0.75)).toBe(19);
    expect(scaleValue(1, 0.5)).toBe(1);
    expect(scaleValue(-20, 0.5)).toBe(-10);
    const flag = affixMonsterMods('unyielding', 10)[0];
    expect(flag.kind).toBe('flag');
    expect(flag.value).toBe(1);
  });

  it('a monster has the scaled mods, and the text, reward and effect agree', () => {
    const life = (lvl: number) =>
      monster('moreLife', lvl).defence.maxLife / monster(undefined, lvl).defence.maxLife;
    expect(life(10)).toBeCloseTo(1.2, 1);
    expect(life(40)).toBeCloseTo(1.3, 1);
    expect(life(70)).toBeCloseTo(1.4, 1);
    const def = mapAffixDef('moreLife');
    expect(affixText(def, 10)).toContain('20%');
    expect(affixText(def, 40)).toContain('30%');
    expect(affixText(def, 70)).toContain('40%');
    expect(rewardText(def, 10)).toBe('+10% item quantity');
    expect(rewardText(def, 70)).toBe('+20% item quantity');
    expect(affixReward(def, 40).quantity).toBeCloseTo(0.15);
  });

  it('rare packs scale to at least one', () => {
    const pack = (lvl: number) =>
      makeMapPlan(9, lvl, 'ashenCrypt', ['extraRares']).pop.monsters.filter(
        (m) => m.spec.rarity === 'rare',
      ).length;
    expect(pack(10)).toBeGreaterThan(0);
    expect(pack(70)).toBeGreaterThan(pack(10));
  });
});

describe('the second wave of affixes (docs/MAPS.md 6.2)', () => {
  it('swift: monsters are faster in move, attack and cast', () => {
    const m = monster('swift');
    for (const stat of ['attackSpeed', 'castSpeed', 'moveSpeed'] as const)
      expect(m.db.mult(stat)).toBeCloseTo(1.2);
    expect(m.moveSpeed).toBeGreaterThan(monster().moveSpeed);
  });

  it('kindled, rimed and charged add damage of their element', () => {
    const types = (id: string) =>
      new Set(
        monster(id)
          .profile(0)
          .hands[0].chunks.filter((c) => c.max > 0)
          .map((c) => c.type),
      );
    expect(types('kindled').has(3)).toBe(true);
    expect(types('rimed').has(2)).toBe(true);
    expect(types('charged').has(1)).toBe(true);
    expect(types('kindled').has(2)).toBe(false);
  });

  it('unyielding monsters cannot be stunned, mending ones regenerate, warded ones resist', () => {
    expect(monster('unyielding').defence.cannotBeStunned).toBe(true);
    expect(monster().defence.cannotBeStunned).toBe(false);
    expect(monster('mending').defence.lifeRegen).toBeGreaterThan(monster().defence.lifeRegen);
    const plain = monster().defence.res;
    const warded = monster('warded').defence.res;
    for (const t of [1, 2, 3]) expect(warded[t]).toBe(plain[t] + 20);
    expect(warded[4]).toBe(plain[4]);
  });

  it('keen-eyed monsters are more accurate, sharpened ones crit more', () => {
    expect(monster('keenEyed').db.calc('accuracy')).toBeGreaterThan(
      monster().db.calc('accuracy') * 1.3,
    );
    const crit = (id?: string) => monster(id).profile(0).hands[0].critChance;
    expect(crit('sharpened')).toBeGreaterThan(crit() * 1.5);
  });

  it('afflicting monsters hit with ailments, and piercing ones penetrate resistances', () => {
    const m = monster('afflicting');
    expect(m.db.sum('base', 'chance.ignite')).toBeGreaterThanOrEqual(20);
    expect(m.db.sum('base', 'chance.freeze')).toBeGreaterThanOrEqual(20);
    expect(m.db.sum('base', 'chance.shock')).toBeGreaterThanOrEqual(20);
    const pierce = affixMonsterMods('piercing', 60)[0];
    expect(pierce.stat).toBe('penetration');
    expect(pierce.damageTypes).toEqual(['fire', 'cold', 'lightning']);
  });

  it('teeming adds monsters and elite-laden adds magic and rare ones', () => {
    const run = (affixes: string[]) => {
      let monsters = 0;
      let magic = 0;
      let rare = 0;
      for (let seed = 1; seed <= 12; seed++) {
        const plan = makeMapPlan(seed, 60, 'ashenCrypt', affixes);
        monsters += plan.pop.monsters.length;
        magic += plan.pop.monsters.filter((x) => x.spec.rarity === 'magic').length;
        rare += plan.pop.monsters.filter((x) => x.spec.rarity === 'rare').length;
      }
      return { monsters, magic, rare };
    };
    const plain = run([]);
    expect(run(['teeming']).monsters).toBeGreaterThan(plain.monsters * 1.12);
    const elite = run(['eliteLaden']);
    expect(elite.rare).toBeGreaterThan(plain.rare);
    expect(elite.magic).toBeGreaterThan(plain.magic);
  });

  it('the player affixes change the character', () => {
    const r = newRun('reaver', 1);
    r.build.level = 60;
    const at = (id?: string) =>
      makeCharacter(r.build, makeMapPlan(5, 60, 'ashenCrypt', id ? [id] : []));
    const plain = at();
    const d = plain.defence();
    expect(at('sluggish').defence().moveSpeed).toBeLessThan(d.moveSpeed * 0.9);
    expect(at('sundered').defence().armour).toBeLessThan(d.armour * 0.7);
    expect(at('sundered').defence().evasion).toBeLessThan(d.evasion * 0.7);
    expect(at('stifled').db.mult('aoe')).toBeCloseTo(0.7);
    expect(at('dry').db.mult('flaskCharges')).toBeCloseTo(0.6);
    expect(d.blockAttack).toBeGreaterThan(0);
    expect(at('unguarded').defence().blockAttack).toBeLessThan(d.blockAttack);
    expect(
      affixPlayerMods('unguarded', 60)
        .map((m) => m.stat)
        .sort(),
    ).toEqual(['blockAttack', 'blockSpell']);
  });

  it('experience and currency rewards reach the plan and the loot rolls', () => {
    const plan = makeMapPlan(1, 60, 'ashenCrypt', ['teeming', 'sluggish']);
    expect(plan.xpMult).toBeCloseTo(themeDef('ashenCrypt').xpMult * 1.2);
    expect(makeMapPlan(1, 60, 'thunderVault', []).xpMult).toBeCloseTo(
      themeDef('thunderVault').xpMult,
    );
    expect(mapAffixDef('piercing').reward.currency).toBeGreaterThan(0);
    expect(rewardText(mapAffixDef('piercing'))).toBe('+20% currency');
    expect(rewardText(mapAffixDef('teeming'))).toBe('+10% experience');
  });
});

describe('every affix has a threat entry (docs/MAPS.md 10.3)', () => {
  const theme = themeDef('ashenCrypt');
  // An affix can leave one build cold (a fire-proofed map does nothing to a physical build), so the model
  // must say something for at least one of a few different builds.
  const builds = (['reaver', 'mystic', 'strider'] as const).map((cls) => {
    const run = withStarterGems(newRun(cls, 1));
    run.build.level = 60;
    setMap(run, 60);
    return run;
  });
  // Builds with a ring that makes them unusual: resistances far above the cap, an elemental skill, plenty of evasion.
  const ringed = (run: RunState, mods: ReturnType<typeof mod>[]) => {
    const r = structuredClone(run);
    const ring = makeItem(() => 900, 'ring_all', 50, 0, 'unique');
    ring.uniqueMods = mods;
    r.build.equipment.ring1 = ring;
    return r;
  };
  const variants = [
    ringed(builds[0], [mod('resist.allEle', 'base', 100), mod('resist.chaos', 'base', 100)]),
    ringed(builds[0], [mod('convert.physical.cold', 'base', 100)]),
    ringed(builds[0], [mod('convert.physical.lightning', 'base', 100)]),
    ringed(builds[2], [mod('evasion', 'base', 20000)]),
  ];
  const chars = [...builds, ...variants].map((r) => new Character(r.build, cfgFor(r)));
  const plain = chars.map((ch) => scoreTheme(ch, theme, 'clearing', []));

  it('adding the affix changes what the model says, except where it cannot (leech)', () => {
    const silent = MAP_AFFIXES.filter((a) => {
      if (a.id === 'noLeech') return false;
      const t = affixThreat([a.id], 60);
      return chars.every((ch, i) => {
        const s = scoreTheme(ch, theme, 'clearing', [a.id]);
        return (
          s.dps === plain[i].dps &&
          s.ehp === plain[i].ehp &&
          s.pressure === plain[i].pressure &&
          t.pressure === 1
        );
      });
    }).map((a) => a.id);
    expect(silent).toEqual([]);
  });

  it('tougher affixes raise the pressure', () => {
    const p = (id: string) => scoreTheme(chars[0], theme, 'clearing', [id]).pressure;
    for (const id of [
      'swift',
      'moreLife',
      'moreDamage',
      'kindled',
      'sharpened',
      'teeming',
      'mending',
    ])
      expect(p(id), id).toBeGreaterThan(plain[0].pressure);
  });
});

describe('Chalk does not offer an affix that conflicts with one the map has', () => {
  it('a map with a fire-proofed monster mix is not offered extra fire damage or warding', () => {
    const run = newRun('vanguard', 2);
    setMap(run, 50);
    run.offers[1].affixes = ['fireproof'];
    for (let i = 0; i < 20; i++) {
      run.craftSeq = i;
      const opts = chalkOptions(run, 1);
      expect(opts).not.toContain('fireproof');
      expect(opts).not.toContain('kindled');
      expect(opts).not.toContain('warded');
    }
  });
});
