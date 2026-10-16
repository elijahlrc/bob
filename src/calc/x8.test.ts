import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { uniqueDef } from '../data/uniques';
import { getTree } from '../data/tree';
import type { Build, Item } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { rollUnique } from '../gen/loot';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { Character } from './character';
import { BASE_MAX_CHARGES, chargeMods, noCharges } from './charges';

let n = 5000;
const uid = () => n++;

function build(
  gems: string[],
  extra: (b: Build, body: Item) => void = () => undefined,
  classId = 'vanguard',
): Build {
  const run = newRun(classId, 1);
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 40, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  extra(b, body);
  return b;
}

const withMods = (b: Build, ...mods: ReturnType<typeof mod>[]) => {
  b.equipment.body!.implicits.push(...mods);
};

describe('charges in the calc (EXPANSION 5.6)', () => {
  it('without a source there are none; with a source the sheet assumes the maximum', () => {
    const plain = new Character(build(['crushingBlow']), { areaLevel: 40 });
    expect(plain.charges).toEqual(noCharges());
    const b = build(['crushingBlow'], (x) => withMods(x, mod('chargeOn.kill.fervour', 'base', 20)));
    const c = new Character(b, { areaLevel: 40 });
    expect(c.charges.fervour).toBe(BASE_MAX_CHARGES);
    expect(c.charges.grit).toBe(0);
    expect(c.chargeSource.fervour).toBe(true);
  });

  it('the maximum rises with items and the tree', () => {
    const b = build(['crushingBlow'], (x) =>
      withMods(x, mod('chargeOn.kill.grit', 'base', 20), mod('maxCharges.grit', 'base', 2)),
    );
    const c = new Character(b, { areaLevel: 40 });
    expect(c.chargeMax.grit).toBe(BASE_MAX_CHARGES + 2);
    expect(c.charges.grit).toBe(5);
  });

  it('an explicit count overrides the assumption, and each kind does what it says', () => {
    const b = build(['crushingBlow']);
    const none = new Character(b, { areaLevel: 40, charges: noCharges() });
    const grit = new Character(b, { areaLevel: 40, charges: { ...noCharges(), grit: 3 } });
    expect(grit.defence().physReduction - none.defence().physReduction).toBeCloseTo(0.12, 6);
    expect(grit.defence().res[3] - none.defence().res[3]).toBeCloseTo(12, 6);
    const fer = new Character(b, { areaLevel: 40, charges: { ...noCharges(), fervour: 3 } });
    const ratio = fer.skillSheet().usesPerSec / none.skillSheet().usesPerSec;
    expect(ratio).toBeCloseTo(1.12, 2);
    // 3.9: Fervour gives no movement speed.
    expect(fer.defence().moveSpeed / none.defence().moveSpeed).toBeCloseTo(1, 6);
    // 4% more damage per charge, as three separate multipliers.
    const more = chargeMods('fervour', 3).filter((m) => m.stat === 'damage' && m.kind === 'more');
    expect(more).toHaveLength(3);
    const ins = new Character(b, { areaLevel: 40, charges: { ...noCharges(), insight: 2 } });
    expect(ins.profile(ins.primary, 0).hands[0].critChance).toBeGreaterThan(
      none.profile(none.primary, 0).hands[0].critChance * 1.5,
    );
  });

  it('a count above the maximum is clamped', () => {
    const c = new Character(build(['crushingBlow']), {
      areaLevel: 40,
      charges: { ...noCharges(), grit: 9 },
    });
    expect(c.charges.grit).toBe(BASE_MAX_CHARGES);
  });

  it('per-charge mods read the count (Band of Endless Grit)', () => {
    const band = (grit: number) => {
      const it = rollUnique(new Rng(1), uid, uniqueDef('bandOfEndlessGrit'), 40);
      const b = build(['crushingBlow']);
      b.equipment.ring1 = it;
      return new Character(b, { areaLevel: 40, charges: { ...noCharges(), grit } });
    };
    const regen = (c: Character) =>
      c.db.sum('base', 'lifeRegenPct', { tags: 0, ancestry: 0, conds: 0, statValue: c.statValue });
    expect(regen(band(0))).toBe(0);
    expect(regen(band(2))).toBeGreaterThan(0);
  });
});

describe('hexes in the calc (EXPANSION 5.7)', () => {
  it('hex gems in the item of the primary skill apply on hit only with Hexing Strikes', () => {
    const without = new Character(build(['crushingBlow', 'openWounds']), { areaLevel: 40 });
    expect(without.hexes).toEqual([]);
    const withIt = new Character(build(['crushingBlow', 'hexingStrikes', 'openWounds']), {
      areaLevel: 40,
    });
    expect(withIt.hexes).toHaveLength(1);
    expect(withIt.hexes[0].id).toBe('openWounds');
    expect(withIt.hexes[0].effect).toBeGreaterThan(0);
  });

  it('the hex limit decides how many apply; Twice-Hexed Ring adds one and curse effect', () => {
    const gems = ['crushingBlow', 'hexingStrikes', 'openWounds', 'feebleGrip', 'leadenLimbs'];
    const one = new Character(build(gems), { areaLevel: 40 });
    expect(one.hexLimit).toBe(1);
    expect(one.hexes).toHaveLength(1);
    const ring = rollUnique(new Rng(1), uid, uniqueDef('twiceHexedRing'), 40);
    const b = build(gems);
    b.equipment.ring1 = ring;
    const two = new Character(b, { areaLevel: 40 });
    expect(two.hexLimit).toBe(2);
    expect(two.hexes).toHaveLength(2);
    // Curse effect raises the effect of each hex.
    const base = new Character(build(['crushingBlow', 'hexingStrikes', 'feebleGrip']), {
      areaLevel: 40,
    });
    const boosted = build(['crushingBlow', 'hexingStrikes', 'feebleGrip']);
    boosted.equipment.ring1 = ring;
    const up = new Character(boosted, { areaLevel: 40 });
    expect(up.hexes[0].effect).toBeGreaterThan(base.hexes[0].effect);
  });

  it('Open Wounds raises physical damage in the sheet, Brittle Doom the elemental, Feeble Grip raises effective HP', () => {
    const plain = new Character(build(['crushingBlow']), { areaLevel: 40 });
    const ow = new Character(build(['crushingBlow', 'hexingStrikes', 'openWounds']), {
      areaLevel: 40,
    });
    expect(ow.sheet().skill.hitDps).toBeGreaterThan(plain.sheet().skill.hitDps);
    expect(ow.hexTarget().vuln).toBeGreaterThan(0);
    const bd = new Character(build(['crushingBlow', 'hexingStrikes', 'brittleDoom']), {
      areaLevel: 40,
    });
    expect(bd.hexTarget().resShift[3]).toBeLessThan(0);
    const fg = new Character(build(['crushingBlow', 'hexingStrikes', 'feebleGrip']), {
      areaLevel: 40,
    });
    expect(fg.sheet().ehp).toBeGreaterThan(plain.sheet().ehp);
    const ll = new Character(build(['crushingBlow', 'hexingStrikes', 'leadenLimbs']), {
      areaLevel: 40,
    });
    expect(ll.sheet().ehp).toBeGreaterThan(plain.sheet().ehp);
  });

  it('a hex gem has a card, and the steady-state mask knows the target is hexed', () => {
    const c = new Character(build(['crushingBlow', 'hexingStrikes', 'openWounds']), {
      areaLevel: 40,
    });
    // Bits exist for the conditions a character's mods use: register the one under test.
    const bit = c.cond.bit('targetCursed');
    expect(c.steadyMask('clearing') & bit).not.toBe(0);
    const plain = new Character(build(['crushingBlow']), { areaLevel: 40 });
    const pbit = plain.cond.bit('targetCursed');
    expect(plain.steadyMask('clearing') & pbit).toBe(0);
  });

  it('a hexed-target condition pays off only against hexed enemies', () => {
    const b = build(['crushingBlow', 'hexingStrikes', 'openWounds'], (x) =>
      withMods(x, mod('damage', 'more', 30, { condition: { id: 'targetCursed' } })),
    );
    const c = new Character(b, { areaLevel: 40 });
    const hexed = c.sheet().skill.hitDps;
    const noHex = new Character(
      build(['crushingBlow'], (x) =>
        withMods(x, mod('damage', 'more', 30, { condition: { id: 'targetCursed' } })),
      ),
      { areaLevel: 40 },
    );
    const plain = new Character(build(['crushingBlow']), { areaLevel: 40 });
    expect(noHex.sheet().skill.hitDps).toBeCloseTo(plain.sheet().skill.hitDps, 6);
    expect(hexed).toBeGreaterThan(noHex.sheet().skill.hitDps * 1.25);
  });
});

describe('wave 3 uniques (EXPANSION 6.4)', () => {
  it('Lullaby Silks hex with Leaden Limbs and explode hexed kills', () => {
    const silks = rollUnique(new Rng(2), uid, uniqueDef('lullabySilks'), 45);
    const b = build(['crushingBlow']);
    b.equipment.gloves = silks;
    const c = new Character(b, { areaLevel: 40 });
    expect(c.hexes.map((h) => h.id)).toEqual(['leadenLimbs']);
    expect(c.triggers.some((t) => t.def.targetHas === 'hex')).toBe(true);
  });

  it('Fervent Stride and Band of Endless Grit give sources and limits', () => {
    const b = build(['crushingBlow']);
    b.equipment.boots = rollUnique(new Rng(2), uid, uniqueDef('ferventStride'), 40);
    const c = new Character(b, { areaLevel: 40 });
    expect(c.chargeMax.fervour).toBeGreaterThan(BASE_MAX_CHARGES);
    expect(c.chargeSource.fervour).toBe(true);
  });
});

describe('the tree after X8 (EXPANSION 6.5)', () => {
  const tree = getTree();
  it('a notable that grants charges is a source for the sheet', () => {
    const node = tree.nodes.find((x) => x.name === 'Feast of Frenzy')!;
    const b = build(['crushingBlow']);
    b.allocated = [node.id];
    const c = new Character(b, { areaLevel: 40 });
    expect(c.chargeSource.fervour).toBe(true);
  });
});
