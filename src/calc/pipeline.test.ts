import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { ModDB } from '../mods/modDb';
import { mod } from '../mods/types';
import { dummyDefence } from '../sim/dummy';
import {
  ailmentsFromHit,
  attackHitChance,
  expectedHit,
  mitigate,
  resolveHit,
  stunFromHit,
  type TargetState,
} from './combat';
import { DEFAULT_ATTACK, type SkillDef } from './gems';
import { buildProfile, convertChunks, FIRE, PHYS, COLD, type HandStats } from './skill';

const hand = (min: number, max: number, crit = 5, aps = 1): HandStats => ({
  flats: [
    [min, max],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  aps,
  crit,
  range: 1.3,
  tags: ['mace', 'oneHand'],
});

const spell: SkillDef = {
  ...DEFAULT_ATTACK,
  id: 'testSpell',
  type: 'spell',
  tags: ['spell'],
  spellDamage: [{ type: 'fire', min: 10, max: 20 }],
  effectiveness: 50,
  castTime: 0.5,
  crit: 6,
};

function profile(db: ModDB, skill: SkillDef = DEFAULT_ATTACK, hands = [hand(10, 20)]) {
  return buildProfile({
    skill,
    db,
    hands: skill.type === 'attack' ? hands : [],
    extraTags: [],
    costMult: 1,
    conds: 0,
    statValue: () => 0,
  });
}

const target = (over = {}): TargetState => ({
  def: dummyDefence(over),
  shock: 0,
  resShift: [0, 0, 0, 0, 0],
});

describe('§6.5 step 3: conversion and gain', () => {
  const ctx = { tags: 0, ancestry: 0, conds: 0 };
  it('converts forward and keeps ancestry', () => {
    const db = new ModDB([mod('convert.physical.fire', 'base', 40)]);
    const out = convertChunks([{ type: PHYS, anc: 1, min: 10, max: 10 }], db, ctx);
    const fire = out.find((c) => c.type === FIRE)!;
    const phys = out.find((c) => c.type === PHYS)!;
    expect(phys.min).toBeCloseTo(6);
    expect(fire.min).toBeCloseTo(4);
    expect(fire.anc).toBe((1 << PHYS) | (1 << FIRE));
  });

  it('gain adds extra damage from the pre-conversion amount', () => {
    const db = new ModDB([
      mod('convert.physical.cold', 'base', 100),
      mod('gain.physical.fire', 'base', 20),
    ]);
    const out = convertChunks([{ type: PHYS, anc: 1, min: 10, max: 10 }], db, ctx);
    expect(out.filter((c) => c.type === PHYS)).toHaveLength(0);
    expect(out.find((c) => c.type === COLD)!.min).toBeCloseTo(10);
    expect(out.find((c) => c.type === FIRE)!.min).toBeCloseTo(2);
  });

  it('skill conversion applies first; other conversion is scaled into what is left', () => {
    const db = new ModDB([
      mod('convertSkill.physical.lightning', 'base', 60),
      mod('convert.physical.cold', 'base', 50),
      mod('convert.physical.fire', 'base', 30),
    ]);
    const out = convertChunks([{ type: PHYS, anc: 1, min: 100, max: 100 }], db, ctx);
    const by = (t: number) => out.filter((c) => c.type === t).reduce((s, c) => s + c.min, 0);
    expect(by(1)).toBeCloseTo(60);
    expect(by(COLD)).toBeCloseTo(25);
    expect(by(FIRE)).toBeCloseTo(15);
    expect(by(PHYS)).toBeCloseTo(0);
  });

  it('chains: phys → cold → fire keeps the full ancestry', () => {
    const db = new ModDB([
      mod('convert.physical.cold', 'base', 100),
      mod('convert.cold.fire', 'base', 100),
    ]);
    const out = convertChunks([{ type: PHYS, anc: 1, min: 10, max: 10 }], db, ctx);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe(FIRE);
    expect(out[0].anc).toBe((1 << PHYS) | (1 << COLD) | (1 << FIRE));
  });

  it('physical mods scale converted damage through ancestry', () => {
    const db = new ModDB([
      mod('convert.physical.fire', 'base', 100),
      mod('damage', 'inc', 50, { damageTypes: ['physical'] }),
      mod('damage', 'inc', 50, { damageTypes: ['fire'] }),
    ]);
    const p = profile(db);
    const fire = p.hands[0].chunks.find((c) => c.type === FIRE)!;
    expect(fire.min).toBeCloseTo(10 * 2);
  });
});

describe('§6.5 steps 1–2, 4, 7: base, scaling and crit', () => {
  it('attack base multiplier and increased/more', () => {
    const db = new ModDB([mod('damage', 'inc', 50), mod('damage', 'more', 20)]);
    const p = profile(db, { ...DEFAULT_ATTACK, baseMult: 150 });
    expect(p.hands[0].chunks[0].min).toBeCloseTo(10 * 1.5 * 1.5 * 1.2);
  });

  it('spell base damage plus added damage × effectiveness', () => {
    const db = new ModDB([
      mod('damage.min', 'base', 4, { damageTypes: ['fire'] }),
      mod('damage.max', 'base', 8, { damageTypes: ['fire'] }),
    ]);
    const p = profile(db, spell);
    const c = p.hands[0].chunks.find((x) => x.type === FIRE)!;
    expect(c.min).toBeCloseTo(12);
    expect(c.max).toBeCloseTo(24);
    expect(p.useTime).toBeCloseTo(0.5);
  });

  it('crit chance: base × (1 + inc) × more, capped at 95%', () => {
    expect(profile(new ModDB([mod('critChance', 'inc', 100)])).hands[0].critChance).toBeCloseTo(
      0.1,
    );
    expect(profile(new ModDB([mod('critChance', 'inc', 5000)])).hands[0].critChance).toBe(0.95);
    expect(profile(new ModDB([mod('neverCrit', 'flag', 1)])).hands[0].critChance).toBe(0);
    expect(profile(new ModDB([mod('critMulti', 'base', 50)])).hands[0].critMulti).toBeCloseTo(2);
    expect(profile(new ModDB([mod('overload', 'flag', 1)])).hands[0].critMulti).toBe(1);
  });

  it('attack speed and dual wield', () => {
    const db = new ModDB([mod('attackSpeed', 'inc', 50)]);
    expect(profile(db).useTime).toBeCloseTo(1 / 1.5);
    const dw = profile(new ModDB(), DEFAULT_ATTACK, [hand(1, 2, 5, 1), hand(1, 2, 5, 2)]);
    expect(dw.hands[0].time).toBeCloseTo(1 / 1.1);
    expect(dw.hands[1].time).toBeCloseTo(1 / 2.2);
  });
});

describe('§6.3 defences in hits', () => {
  it('accuracy vs evasion, always-hit and evade bonuses', () => {
    const p = profile(new ModDB([mod('accuracy', 'base', 500)]));
    const t = target({ evasion: 1000 });
    expect(attackHitChance(p, p.hands[0], t.def)).toBeCloseTo(500 / (500 + Math.pow(250, 0.8)));
    const rt = profile(new ModDB([mod('alwaysHit', 'flag', 1)]));
    expect(attackHitChance(rt, rt.hands[0], t.def)).toBe(1);
    const sp = profile(new ModDB(), spell);
    expect(attackHitChance(sp, sp.hands[0], t.def)).toBe(1);
  });

  it('armour reduces physical by A / (A + 10D); resistances and penetration', () => {
    const p = profile(new ModDB([mod('penetration', 'base', 10, { damageTypes: ['fire'] })]));
    const d = mitigate(p, target({ armour: 1000, res: [0, 0, 0, 50, 0] }), [100, 0, 0, 100, 0]);
    expect(d[0]).toBeCloseTo(50);
    expect(d[3]).toBeCloseTo(60);
  });

  it('shock and damage taken multiply after mitigation; chaos immunity', () => {
    const p = profile(new ModDB());
    const t = target({ immuneChaos: true });
    t.shock = 0.2;
    const d = mitigate(p, t, [100, 0, 0, 0, 100]);
    expect(d[0]).toBeCloseTo(120);
    expect(d[4]).toBe(0);
  });

  it('blocked hits deal nothing', () => {
    const p = profile(new ModDB());
    const rng = new Rng(1);
    for (let i = 0; i < 20; i++) {
      const r = resolveHit(rng, p, p.hands[0], target({ blockAttack: 1 }), 1, true);
      expect(r.outcome).toBe('block');
      expect(r.total).toBe(0);
    }
  });

  it('expected hit equals the mean of rolled hits', () => {
    const p = profile(new ModDB([mod('critChance', 'inc', 300)]));
    const t = target({ res: [0, 0, 0, 0, 0] });
    const ex = expectedHit(p, p.hands[0], t, 1);
    const rng = new Rng(2);
    let s = 0;
    const n = 40000;
    for (let i = 0; i < n; i++) s += resolveHit(rng, p, p.hands[0], t, 1, false).total;
    expect(s / n / ex.perUse).toBeGreaterThan(0.98);
    expect(s / n / ex.perUse).toBeLessThan(1.02);
  });
});

describe('§6.6 ailments', () => {
  const t = target({ ailmentThreshold: 100 });
  const always = () => true;
  it('ignite is 50% of fire H per second, mitigated by fire resistance', () => {
    const p = profile(new ModDB([mod('chance.ignite', 'base', 100)]));
    const a = ailmentsFromHit(
      p,
      p.hands[0],
      [0, 0, 0, 40, 0],
      false,
      target({ res: [0, 0, 0, 50, 0] }),
      always,
    );
    expect(a.ignite).toBeCloseTo(10);
  });
  it('crits always ignite', () => {
    const p = profile(new ModDB());
    const never = () => false;
    expect(ailmentsFromHit(p, p.hands[0], [0, 0, 0, 40, 0], true, t, never).ignite).toBeGreaterThan(
      0,
    );
    expect(ailmentsFromHit(p, p.hands[0], [0, 0, 0, 40, 0], false, t, never).ignite).toBe(0);
  });
  it('bleed and poison scale with their own mods only', () => {
    const p = profile(
      new ModDB([
        mod('chance.bleed', 'base', 100),
        mod('chance.poison', 'base', 100),
        mod('damage', 'more', 100, { tags: ['poison'] }),
      ]),
    );
    const a = ailmentsFromHit(p, p.hands[0], [50, 0, 0, 0, 0], false, t, always);
    expect(a.bleed).toBeCloseTo(10);
    expect(a.poison).toBeCloseTo(20);
  });
  it('shock and chill use mag(r, cap) and the 5% floor', () => {
    const p = profile(new ModDB([mod('chance.shock', 'base', 100)]));
    expect(ailmentsFromHit(p, p.hands[0], [0, 50, 0, 0, 0], false, t, always).shock).toBeCloseTo(
      0.5,
    );
    expect(ailmentsFromHit(p, p.hands[0], [0, 0, 12.5, 0, 0], false, t, always).chill).toBeCloseTo(
      0.15,
    );
    expect(ailmentsFromHit(p, p.hands[0], [0, 0.1, 0, 0, 0], false, t, always).shock).toBe(0);
  });
  it('freeze lasts min(3, 6r) s and needs at least 0.3 s', () => {
    const p = profile(new ModDB([mod('chance.freeze', 'base', 100)]));
    expect(ailmentsFromHit(p, p.hands[0], [0, 0, 20, 0, 0], false, t, always).freeze).toBeCloseTo(
      1.2,
    );
    expect(ailmentsFromHit(p, p.hands[0], [0, 0, 1, 0, 0], false, t, always).freeze).toBe(0);
    expect(ailmentsFromHit(p, p.hands[0], [0, 0, 500, 0, 0], false, t, always).freeze).toBe(3);
  });
  it('cannot inflict elemental ailments', () => {
    const p = profile(new ModDB([mod('cannotInflictEle', 'flag', 1)]));
    const a = ailmentsFromHit(p, p.hands[0], [0, 50, 50, 50, 0], true, t, always);
    expect(a.ignite + a.shock + a.chill + a.freeze).toBe(0);
  });
});

describe('§6.6a stun', () => {
  it('chance = 2S / threshold with stun-damage and enemy-threshold mods', () => {
    const p = profile(
      new ModDB([mod('stunDamage', 'inc', 50), mod('enemyStunThreshold', 'base', 25)]),
    );
    const def = dummyDefence({ stunThreshold: 1000, cannotBeStunned: false });
    const r = stunFromHit(p, [100, 0, 0, 100, 0], def, true, null);
    // S = (100 + 50) × 1.5 = 225; threshold 750 → 0.6.
    expect(r.chance).toBeCloseTo(0.6);
    expect(r.duration).toBeCloseTo(0.35);
  });
  it('no stun below 10%, during grace, or when immune', () => {
    const p = profile(new ModDB());
    const def = dummyDefence({ stunThreshold: 1000, cannotBeStunned: false });
    expect(stunFromHit(p, [40, 0, 0, 0, 0], def, true, null).chance).toBe(0);
    expect(stunFromHit(p, [500, 0, 0, 0, 0], def, false, null).chance).toBe(0);
    expect(
      stunFromHit(p, [500, 0, 0, 0, 0], { ...def, cannotBeStunned: true }, true, null).chance,
    ).toBe(0);
  });
});
