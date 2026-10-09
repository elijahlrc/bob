import { describe, expect, it } from 'vitest';
import { getTree } from '../data/tree';
import type { Build, Item } from '../data/types';
import { makeFlask, makeGem, makeItem } from '../gen/items';
import { ModDB } from '../mods/modDb';
import { CONDITIONS, mod, type Mod } from '../mods/types';
import { newRun } from '../run/run';
import { dummyDefence } from '../sim/dummy';
import { Character } from './character';
import { ailBaseOf, ailmentsFromHit, mitigate, shockTaken, NO_SHIFT } from './combat';
import { defenceFromDb } from './defence';
import type { HandProfile, SkillProfile } from './skill';

/** A starter build with extra mods on its body armour, and optionally other gems in it. */
function buildWith(
  classId: string,
  extra: Mod[],
  opts: { gems?: string[]; main?: string; level?: number } = {},
): Build {
  const run = newRun(classId, 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = opts.level ?? 30;
  if (opts.main) b.equipment.mainHand = makeItem(uid, opts.main, b.level, 1);
  const gems = opts.gems ?? ['crushingBlow'];
  const body = makeItem(uid, 'body_ar_1', b.level, Math.max(1, gems.length), 'unique');
  body.sockets = gems.map((g) => makeGem(uid, g));
  body.uniqueMods = extra;
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const defOf = (mods: Mod[]) =>
  defenceFromDb(
    new ModDB(mods),
    { tags: 0, ancestry: 0, conds: 0 },
    { isPlayer: true, resistPenalty: 0 },
  );

describe('new conditions (EXPANSION 5.2)', () => {
  it('exist, are distinct, and fit the 32-bit mask', () => {
    for (const c of [
      'beenHitRecently',
      'leeching',
      'esFull',
      'targetLowLife',
      'onLowMana',
    ] as const)
      expect(CONDITIONS).toContain(c);
    expect(new Set(CONDITIONS).size).toBe(CONDITIONS.length);
  });

  it('a calc config can switch one on', () => {
    const b = buildWith('vanguard', [
      mod('damage', 'more', 50, { condition: { id: 'targetLowLife' } }),
    ]);
    const off = new Character(b, { areaLevel: 30 }).sheet().skill.totalDps;
    const on = new Character(b, { areaLevel: 30, conds: ['targetLowLife'] }).sheet().skill.totalDps;
    expect(on).toBeGreaterThan(off * 1.3);
  });
});

describe('damage taken rules', () => {
  const hitOf = (type: number, amount: number) => {
    const d = [0, 0, 0, 0, 0];
    d[type] = amount;
    return d;
  };
  const prof = {
    pen: [0, 0, 0, 0, 0],
    armourIgnore: 0,
    enemyPhysRed: 0,
    enemyBlockLess: 0,
    statuses: [],
    fleeChance: 0,
    exposure: 0,
    projMode: {
      sequential: false,
      shotgun: false,
      parallel: false,
      nova: false,
      tornado: false,
      fork: false,
    },
    doubleChance: 0,
  } as unknown as SkillProfile;
  const target = (def: ReturnType<typeof dummyDefence>) => ({
    def,
    shock: 0,
    resShift: [...NO_SHIFT],
  });

  it('physical damage taken as lightning is mitigated as lightning', () => {
    const plain = dummyDefence({ res: [0, 75, 0, 0, 0] });
    const shifted = dummyDefence({ res: [0, 75, 0, 0, 0], physTakenAs: [0, 0.4, 0, 0, 0] });
    const a = mitigate(prof, target(plain), hitOf(0, 1000));
    const b = mitigate(prof, target(shifted), hitOf(0, 1000));
    expect(a[0]).toBeCloseTo(1000);
    expect(b[0]).toBeCloseTo(600);
    expect(b[1]).toBeCloseTo(100); // 400 lightning, 75% resisted
  });

  it('the shares come from `physTakenAs.<type>` stats and never exceed 100%', () => {
    const d = defOf([
      mod('physTakenAs.lightning', 'base', 70),
      mod('physTakenAs.cold', 'base', 70),
    ]);
    expect(d.physTakenAs[1] + d.physTakenAs[2]).toBeCloseTo(1);
    expect(defOf([mod('physTakenAs.fire', 'base', 30)]).physTakenAs[3]).toBeCloseTo(0.3);
  });

  it('typed damage taken scales only that type', () => {
    const d = defOf([mod('damageTaken.physical', 'more', 50)]);
    expect(d.damageTakenType).toEqual([1.5, 1, 1, 1, 1]);
    const out = mitigate(prof, target(d), hitOf(3, 100));
    expect(out[3]).toBeCloseTo(100);
    expect(mitigate(prof, target(d), hitOf(0, 100))[0]).toBeCloseTo(150);
  });

  it("immunity removes that element's damage and ailments", () => {
    const d = defOf([mod('immune.fire', 'flag', 1)]);
    expect(d.immune).toEqual([false, false, false, true, false]);
    expect(mitigate(prof, target(d), hitOf(3, 100))[3]).toBe(0);
    expect(mitigate(prof, target(d), hitOf(2, 100))[2]).toBeCloseTo(100);
  });

  it('shock does nothing to those unaffected by it', () => {
    expect(shockTaken(dummyDefence(), 0.3)).toBeCloseTo(1.3);
    expect(shockTaken(dummyDefence({ unaffectedByShock: true }), 0.3)).toBe(1);
    expect(defOf([mod('unaffectedByShock', 'flag', 1)]).unaffectedByShock).toBe(true);
  });

  it('effective HP follows the new rules', () => {
    const base = buildWith('vanguard', []);
    const asLightning = buildWith('vanguard', [
      mod('physTakenAs.lightning', 'base', 50),
      mod('resist.lightning', 'base', 75),
    ]);
    const a = new Character(base, { areaLevel: 30 }).sheet().ehp;
    const b = new Character(asLightning, { areaLevel: 30 }).sheet().ehp;
    expect(b).toBeGreaterThan(a);
    const worse = buildWith('vanguard', [mod('damageTaken.physical', 'more', 100)]);
    expect(new Character(worse, { areaLevel: 30 }).sheet().ehp).toBeLessThan(a);
  });
});

describe('ailment rules', () => {
  const hand = { critMulti: 1.5 } as HandProfile;
  const prof = (over: Partial<SkillProfile> = {}) =>
    ({
      pen: [0, 0, 0, 0, 0],
      cruelAgony: false,
      cannotInflictEle: false,
      alwaysFreezeOnCrit: false,
      isAttack: true,
      ignite: { chance: 0, mult: 1, dur: 4 },
      bleed: { chance: 0, mult: 1, dur: 5 },
      poison: { chance: 0, mult: 1, dur: 2 },
      shock: { chance: 0, effect: 1, dur: 2 },
      chill: { effect: 1, dur: 2 },
      freeze: { chance: 0, dur: 1 },
      ailmentFrom: { ignite: [3], shock: [1], chill: [2], freeze: [2] },
      ...over,
    }) as SkillProfile;
  const phys = [1000, 0, 0, 0, 0];
  const t = (def = dummyDefence({ ailmentThreshold: 1000 })) => ({
    def,
    shock: 0,
    resShift: [...NO_SHIFT],
  });
  const always = () => true;

  it('physical damage cannot shock unless a rule says so', () => {
    expect(ailmentsFromHit(prof(), hand, phys, ailBaseOf(phys), true, t(), always).shock).toBe(0);
    const can = prof({ ailmentFrom: { ignite: [3], shock: [1, 0], chill: [2], freeze: [2] } });
    expect(
      ailmentsFromHit(can, hand, phys, ailBaseOf(phys), true, t(), always).shock,
    ).toBeGreaterThan(0);
  });

  it('the rule is read from `canShock.physical`', () => {
    const b = buildWith('vanguard', [mod('canShock.physical', 'flag', 1)]);
    const p = new Character(b, { areaLevel: 30 });
    expect(p.profile(p.primary).ailmentFrom.shock).toEqual([1, 0]);
    expect(
      new Character(buildWith('vanguard', []), {}).profile(p.primary).ailmentFrom.shock,
    ).toEqual([1]);
  });

  it('immune targets suffer no ailments; shock-immune ones no shock', () => {
    const light = [0, 1000, 0, 0, 0];
    expect(
      ailmentsFromHit(prof(), hand, light, ailBaseOf(light), true, t(), always).shock,
    ).toBeGreaterThan(0);
    const unaffected = t(dummyDefence({ ailmentThreshold: 1000, unaffectedByShock: true }));
    expect(
      ailmentsFromHit(prof(), hand, light, ailBaseOf(light), true, unaffected, always).shock,
    ).toBe(0);
    const immune = t(dummyDefence({ ailmentThreshold: 1000, immuneAilments: true }));
    const all = ailmentsFromHit(
      prof(),
      hand,
      [1000, 1000, 1000, 1000, 0],
      ailBaseOf([1000, 1000, 1000, 1000, 0]),
      true,
      immune,
      always,
    );
    expect(Object.values(all).every((v) => v === 0)).toBe(true);
    const fireproof = t(
      dummyDefence({ ailmentThreshold: 1000, immune: [false, false, false, true, false] }),
    );
    expect(
      ailmentsFromHit(
        prof(),
        hand,
        [0, 0, 0, 1000, 0],
        ailBaseOf([0, 0, 0, 1000, 0]),
        true,
        fireproof,
        always,
      ).ignite,
    ).toBe(0);
  });
});

describe('damage rules on the skill profile', () => {
  const chunks = (b: Build) => {
    const c = new Character(b, { areaLevel: 30 });
    return c.profile(c.primary).hands[0].chunks;
  };
  const avg = (b: Build) => chunks(b).reduce((s, c) => s + (c.min + c.max) / 2, 0);

  it('"no elemental damage" drops converted elemental damage', () => {
    const conv = [mod('convert.physical.fire', 'base', 50)];
    const withFire = buildWith('vanguard', conv, { main: 'mace2_3' });
    const noEle = buildWith('vanguard', [...conv, mod('noElementalDamage', 'flag', 1)], {
      main: 'mace2_3',
    });
    expect(chunks(withFire).some((c) => c.type === 3)).toBe(true);
    expect(chunks(noEle).some((c) => c.type === 3)).toBe(false);
    expect(avg(noEle)).toBeLessThan(avg(withFire) + 1e-9);
  });

  it('"no physical damage" drops physical damage', () => {
    const b = buildWith('vanguard', [mod('noPhysicalDamage', 'flag', 1)], { main: 'mace2_3' });
    expect(chunks(b).every((c) => c.type !== 0)).toBe(true);
  });

  it('spell damage increases apply to attacks only with the rule, and "more" does not', () => {
    const inc = mod('damage', 'inc', 100, { tags: ['spell'] });
    const more = mod('damage', 'more', 100, { tags: ['spell'] });
    const base = avg(buildWith('vanguard', [], { main: 'mace2_3' }));
    const plain = avg(buildWith('vanguard', [inc], { main: 'mace2_3' }));
    const rule = mod('spellIncAppliesToAttacks', 'flag', 1);
    const ruled = avg(buildWith('vanguard', [inc, rule], { main: 'mace2_3' }));
    const ruledMore = avg(buildWith('vanguard', [more, rule], { main: 'mace2_3' }));
    expect(plain).toBeCloseTo(base);
    expect(ruled).toBeGreaterThan(base * 1.3);
    expect(ruledMore).toBeCloseTo(base);
  });

  it('minimum and maximum damage scale separately', () => {
    const b0 = buildWith('vanguard', [], { main: 'mace2_3' });
    const b1 = buildWith(
      'vanguard',
      [mod('maxDamage', 'more', 50), mod('minDamage', 'more', -50)],
      { main: 'mace2_3' },
    );
    const [c0] = chunks(b0);
    const [c1] = chunks(b1);
    expect(c1.max).toBeCloseTo(c0.max * 1.5);
    expect(c1.min).toBeCloseTo(c0.min * 0.5);
  });

  it('flags for instant crit leech are read', () => {
    const b = buildWith('vanguard', [mod('instantLeechOnCrit', 'flag', 1)]);
    const c = new Character(b, {});
    expect(c.profile(c.primary).instantLeechOnCrit).toBe(true);
  });
});

describe('item rules (EXPANSION 5.3)', () => {
  it('socketed gems use life: auras reserve life and skills cost life, in that item only', () => {
    const rule = mod('rule.socketedGemsUseLife', 'flag', 1);
    const b = buildWith('vanguard', [rule], { gems: ['crushingBlow', 'kindlingHalo'] });
    const c = new Character(b, { areaLevel: 30 });
    expect(c.reservedLife).toBeGreaterThan(0);
    expect(c.reservedMana).toBe(0);
    expect(c.primary.costsLife).toBe(true);
    const plain = new Character(
      buildWith('vanguard', [], { gems: ['crushingBlow', 'kindlingHalo'] }),
      {
        areaLevel: 30,
      },
    );
    expect(plain.reservedMana).toBeGreaterThan(0);
    expect(plain.primary.costsLife).toBe(false);
  });

  it("socketed reservation reduction applies to the item's own auras", () => {
    const gems = ['crushingBlow', 'kindlingHalo'];
    const a = new Character(buildWith('vanguard', [], { gems }), { areaLevel: 30 });
    const b = new Character(
      buildWith('vanguard', [mod('socketedReducedReservation', 'base', 25)], { gems }),
      { areaLevel: 30 },
    );
    expect(b.reservedMana).toBeLessThan(a.reservedMana);
    expect(b.reservedMana).toBeGreaterThan(a.reservedMana * 0.7);
  });

  it('a tagged socketed-gem level bonus reaches only matching gems', () => {
    const gems = ['crushingBlow', 'kindlingHalo'];
    const levelOf = (extra: Mod[], id: string) =>
      new Character(buildWith('vanguard', extra, { gems, level: 12 }), {}).gems.find(
        (g) => g.def.id === id,
      )!.level;
    const none = levelOf([], 'kindlingHalo');
    expect(levelOf([mod('socketedGemLevel', 'base', 2, { tags: ['aura'] })], 'kindlingHalo')).toBe(
      none + 2,
    );
    expect(levelOf([mod('socketedGemLevel', 'base', 2, { tags: ['aura'] })], 'crushingBlow')).toBe(
      levelOf([], 'crushingBlow'),
    );
    expect(levelOf([mod('socketedGemLevel', 'base', 1)], 'crushingBlow')).toBe(
      levelOf([], 'crushingBlow') + 1,
    );
  });

  it('an item can grant a keystone, once', () => {
    const grant = mod('grantsKeystone.mindBulwark', 'flag', 1);
    const c = new Character(buildWith('vanguard', [grant]), {});
    expect(c.db.flag('manaBeforeLife30')).toBe(true);
    expect(new Character(buildWith('vanguard', []), {}).db.flag('manaBeforeLife30')).toBe(false);
    // Searing Avatar converts 50% of physical to fire; the tree and an item together must not stack.
    const node = getTree().nodes.find((n) => n.name === 'Searing Avatar')!;
    const both = buildWith('vanguard', [mod('grantsKeystone.searingAvatar', 'flag', 1)]);
    both.allocated = [node.id];
    expect(new Character(both, {}).db.sum('base', 'convert.physical.fire')).toBe(50);
    const itemOnly = buildWith('vanguard', [mod('grantsKeystone.searingAvatar', 'flag', 1)]);
    expect(new Character(itemOnly, {}).db.sum('base', 'convert.physical.fire')).toBe(50);
  });
});

describe('flask buffs reach the skill profile', () => {
  it('a damage buff from an active flask raises the damage of the skill', () => {
    const b = buildWith('vanguard', [], { main: 'mace2_3' });
    const flask = makeFlask(() => 900, 'flask_haste', 20);
    flask.affixes = [{ family: 'test', tier: 1, mods: [mod('damage', 'more', 50)] }];
    b.flasks = [flask, null, null, null, null];
    const c = new Character(b, {});
    const sum = (mask: number) =>
      c.profile(c.primary, 0, mask).hands[0].chunks.reduce((s, x) => s + x.max, 0);
    expect(sum(1)).toBeGreaterThan(sum(0) * 1.4);
    expect(c.dbWith(1).mult('damage')).toBeGreaterThan(1.4);
  });
});

export type { Item };
