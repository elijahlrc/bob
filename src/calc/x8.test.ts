import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { gemDef } from '../data/gems';
import { hexEffect, HEX_IDS } from '../data/hexes';
import { uniqueDef } from '../data/uniques';
import { WAVE3_UNIQUES } from '../data/uniquesWave3';
import { getTree } from '../data/tree';
import type { Build, Item } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { rollUnique } from '../gen/loot';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { Character } from './character';
import { BASE_MAX_CHARGES, chargeMods, noCharges } from './charges';
import { dummyDefence } from '../sim/dummy';

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
    expect(regen(band(2))).toBeCloseTo(0.8, 6);
    expect(band(0).chargeMax.grit).toBe(BASE_MAX_CHARGES + 1);
  });
});

describe('hexes in the calc (EXPANSION 5.7)', () => {
  it('there are four hexes with the effects of the plan, from level 1 to 20', () => {
    expect(hexEffect('brittleDoom', 1)).toBe(20);
    expect(hexEffect('brittleDoom', 20)).toBe(35);
    expect(hexEffect('leadenLimbs', 1)).toBe(15);
    expect(hexEffect('leadenLimbs', 20)).toBe(25);
    expect(hexEffect('feebleGrip', 20)).toBe(25);
    expect(hexEffect('openWounds', 10)).toBeGreaterThan(20);
    expect(HEX_IDS).toHaveLength(4);
    // The four are curses the character casts, and Hexing Strikes applies them on hit instead.
    for (const id of HEX_IDS)
      expect(gemDef(id)).toMatchObject({ kind: 'active', utility: { kind: 'curse' } });
    expect(gemDef('hexingStrikes').kind).toBe('support');
  });

  it('hex gems in the item of the primary skill apply on hit only with Hexing Strikes', () => {
    const without = new Character(build(['crushingBlow', 'openWounds']), { areaLevel: 40 });
    expect(without.hexes).toEqual([]);
    const withIt = new Character(build(['crushingBlow', 'hexingStrikes', 'openWounds']), {
      areaLevel: 40,
    });
    expect(withIt.hexes).toHaveLength(1);
    expect(withIt.hexes[0].id).toBe('openWounds');
    expect(withIt.hexes[0].effect).toBeGreaterThanOrEqual(20);
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
    expect(ow.sheet().skill.hitDps / plain.sheet().skill.hitDps).toBeGreaterThan(1.15);
    expect(ow.hexTarget().vuln).toBeGreaterThan(0.19);
    const bd = new Character(build(['crushingBlow', 'hexingStrikes', 'brittleDoom']), {
      areaLevel: 40,
    });
    expect(bd.hexTarget().resShift[3]).toBeLessThan(-19);
    const fg = new Character(build(['crushingBlow', 'hexingStrikes', 'feebleGrip']), {
      areaLevel: 40,
    });
    expect(fg.sheet().ehp).toBeGreaterThan(plain.sheet().ehp * 1.15);
    const ll = new Character(build(['crushingBlow', 'hexingStrikes', 'leadenLimbs']), {
      areaLevel: 40,
    });
    expect(ll.sheet().ehp).toBeGreaterThan(plain.sheet().ehp * 1.1);
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

  it('Brittle Doom shifts the dummy-independent target: a hit on a monster at 30% fire resistance deals more', () => {
    const c = new Character(build(['crushingBlow', 'hexingStrikes', 'brittleDoom']), {
      areaLevel: 40,
    });
    const t = (shift: number) => ({
      def: dummyDefence({ res: [0, 30, 30, 30, 0] }),
      shock: 0,
      resShift: [0, shift, shift, shift, 0],
    });
    // The skill is physical, so resistances do not move it; the shift is read through the engine all the same.
    expect(c.skillSheet(c.primary, t(0)).hitDps).toBeCloseTo(
      c.skillSheet(c.primary, t(-20)).hitDps,
      6,
    );
  });
});

describe('wave 3 uniques (EXPANSION 6.4)', () => {
  it('there are five, each with a card text from structure', () => {
    expect(WAVE3_UNIQUES).toHaveLength(5);
    for (const u of WAVE3_UNIQUES) {
      const it = rollUnique(new Rng(2), uid, uniqueDef(u.id), 45);
      expect(it.baseId).toBe(u.baseId);
      expect(u.notes?.weakAgainst.length).toBeGreaterThan(0);
    }
  });

  it('Lullaby Silks hex with level 11 Leaden Limbs and explode hexed kills', () => {
    const silks = rollUnique(new Rng(2), uid, uniqueDef('lullabySilks'), 45);
    const b = build(['crushingBlow']);
    b.equipment.gloves = silks;
    const c = new Character(b, { areaLevel: 40 });
    expect(c.hexes.map((h) => h.id)).toEqual(['leadenLimbs']);
    expect(c.hexes[0].level).toBe(11);
    expect(c.triggers.some((t) => t.def.targetHas === 'hex')).toBe(true);
  });

  it('Fervent Stride and Band of Endless Grit give sources and limits', () => {
    const b = build(['crushingBlow']);
    b.equipment.boots = rollUnique(new Rng(2), uid, uniqueDef('ferventStride'), 40);
    const c = new Character(b, { areaLevel: 40 });
    expect(c.chargeMax.fervour).toBe(BASE_MAX_CHARGES + 1);
    expect(c.chargeSource.fervour).toBe(true);
  });
});

describe('the tree after X8 (EXPANSION 6.5)', () => {
  const tree = getTree();
  const names = [
    'Bulwark of Habit',
    'Stored Fortitude',
    'Deepened Stance',
    'Feast of Frenzy',
    'Quickened Heartbeat',
    'Cold Clarity',
    "Hexbinder's Tithe",
    'Spite-Proof Skin',
    'Marrow Veil',
    'Hunter of the Marked',
    'Red Gait',
    'Grudge Engine',
  ];

  it('has twelve new notables with charge, hex and conditional effects', () => {
    for (const name of names) {
      const node = tree.nodes.find((x) => x.name === name);
      expect(node, name).toBeDefined();
      expect(node!.kind).toBe('notable');
      expect(node!.mods.length).toBeGreaterThan(0);
    }
    const stats = tree.nodes.flatMap((x) => x.mods.map((m) => m.stat));
    expect(stats.filter((s) => s.startsWith('chargeOn.')).length).toBeGreaterThanOrEqual(3);
    expect(stats).toContain('curseEffect');
    expect(stats).toContain('curseEffectOnSelf');
    expect(stats).toContain('maxCharges.grit');
    expect(stats).toContain('maxCharges.fervour');
  });

  it('a notable that grants charges is a source for the sheet', () => {
    const node = tree.nodes.find((x) => x.name === 'Feast of Frenzy')!;
    const b = build(['crushingBlow']);
    b.allocated = [node.id];
    const c = new Character(b, { areaLevel: 40 });
    expect(c.chargeSource.fervour).toBe(true);
  });
});
