import { describe, expect, it } from 'vitest';
import { getTree } from '../data/tree';
import { KEYSTONES } from '../data/tree/keystones';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { condBit, mod } from '../mods/types';
import { newRun } from '../run/run';
import { applyDamage } from '../sim/combat';
import { createDummyWorld, dummyDefence } from '../sim/dummy';
import { stepWorld } from '../sim/world';
import { Character } from './character';
import { attackHitChance, mitigate, resolveHit } from './combat';
import { distanceMult } from './skill';
import { Rng } from '../core/rng';

function ksNode(id: string): number {
  const name = KEYSTONES.find((k) => k.id === id)!.name;
  return getTree().nodes.find((n) => n.kind === 'keystone' && n.name === name)!.id;
}

function build(classId: string, keystones: string[], gems?: string[], main?: string): Build {
  const run = newRun(classId, 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  if (main) b.equipment.mainHand = makeItem(uid, main, 40, 1);
  if (gems) {
    const body = makeItem(uid, 'body_ar_1', 40, gems.length);
    body.sockets = gems.map((g) => makeGem(uid, g));
    b.equipment.body = body;
    b.primaryGem = body.sockets[0]!.uid;
  }
  b.allocated = keystones.map(ksNode);
  return b;
}

const both = (classId: string, ks: string, gems?: string[], main?: string) => ({
  without: new Character(build(classId, [], gems, main)),
  with: new Character(build(classId, [ks], gems, main)),
});

describe('keystones (§9.4) — every one has an effect', () => {
  it('all 21 keystones are in the tree', () => {
    for (const k of KEYSTONES) expect(ksNode(k.id)).toBeGreaterThanOrEqual(0);
  });

  it('Unerring Discipline: attacks always hit and never crit', () => {
    const c = both('vanguard', 'unerringDiscipline').with;
    const p = c.profile(c.primary);
    expect(attackHitChance(p, p.hands[0], dummyDefence({ evasion: 5000 }))).toBe(1);
    expect(p.hands[0].critChance).toBe(0);
  });

  it('Hollow Vessel: life is 1 and chaos damage is ignored', () => {
    const c = both('mystic', 'hollowVessel').with;
    const d = c.defence();
    expect(d.maxLife).toBe(1);
    expect(d.immuneChaos).toBe(true);
    expect(
      mitigate(
        c.profile(c.primary),
        { def: d, shock: 0, resShift: [0, 0, 0, 0, 0] },
        [0, 0, 0, 0, 50],
      )[4],
    ).toBe(0);
  });

  it('Blood Rite: no mana, auras reserve life', () => {
    const c = both('vanguard', 'bloodRite', ['crushingBlow', 'ironBastion']).with;
    expect(c.defence().maxMana).toBe(0);
    expect(c.reservedLife).toBeGreaterThan(0);
    expect(c.reservedMana).toBe(0);
  });

  it('Plated Hide: evasion becomes armour', () => {
    const { without, with: w } = both('strider', 'platedHide');
    expect(w.defence().evasion).toBe(0);
    expect(w.defence().armour).toBeGreaterThan(without.defence().armour);
  });

  it('Mind Bulwark: 30% of damage taken from mana first', () => {
    const c = both('mystic', 'mindBulwark').with;
    expect(c.defence().manaBeforeLife).toBe(0.3);
  });

  it('Searing Avatar: deals only fire damage', () => {
    const c = both('vanguard', 'searingAvatar').with;
    const chunks = c.profile(c.primary).hands[0].chunks;
    expect(chunks.length).toBeGreaterThan(0);
    for (const ch of chunks) expect(ch.type).toBe(3);
  });

  it('Close Quarters: more damage up close, less far away', () => {
    const c = both('strider', 'closeQuarters').with;
    const p = c.profile(c.primary);
    expect(distanceMult(p, 1)).toBeCloseTo(1.5);
    expect(distanceMult(p, 8)).toBeCloseTo(0.5);
  });

  it('Crimson Pact: instant leech, no regeneration', () => {
    const c = new Character({
      ...build('vanguard', ['crimsonPact']),
    });
    const d = c.defence();
    expect(d.instantLeech).toBe(true);
    expect(d.lifeRegen).toBe(0);
  });

  it('Overload: 100% crit multi; 40% more elemental damage after a crit', () => {
    const c = both('mystic', 'overload').with;
    const base = c.profile(c.primary, 0);
    const after = c.profile(c.primary, condBit('overloadActive'));
    expect(base.hands[0].critMulti).toBe(1);
    expect(after.hands[0].chunks[0].min / base.hands[0].chunks[0].min).toBeCloseTo(1.4);
  });

  it('Pain Conduit: 30% more spell damage on low life', () => {
    const c = both('mystic', 'painConduit').with;
    const hi = c.profile(c.primary, 0).hands[0].chunks[0].min;
    const lo = c.profile(c.primary, condBit('onLowLife')).hands[0].chunks[0].min;
    expect(lo / hi).toBeCloseTo(1.3);
  });

  it('Rooted Stance: cannot be stunned, cannot evade', () => {
    const d = both('vanguard', 'rootedStance').with.defence();
    expect(d.cannotBeStunned).toBe(true);
    expect(d.cannotEvade).toBe(true);
  });

  it('Prismatic Balance: hits shift the target resistances', () => {
    const b = build('zealot', ['prismaticBalance']);
    const { world, dummy } = createDummyWorld(b, { distance: 4 });
    for (let i = 0; i < 180 && dummy.resShiftT <= 0; i++) stepWorld(world);
    expect(dummy.resShift[1]).toBe(25);
    expect(dummy.resShift[3]).toBe(-50);
  });

  it('Living Ward: life is 1 and life regeneration feeds ES', () => {
    const d = both('mystic', 'livingWard').with.defence();
    expect(d.maxLife).toBe(1);
    expect(d.regenToEs).toBe(true);
  });

  it('Shade Leech: leech goes to ES; ES recharge is halved', () => {
    const b = build('mystic', ['shadeLeech']);
    b.equipment.helmet = makeItem(() => 9999, 'helmet_es_2', 40);
    const without = new Character({ ...b, allocated: [] }).defence();
    const d = new Character(b).defence();
    expect(d.leechToEs).toBe(true);
    expect(d.esRecharge / d.maxEs).toBeCloseTo((without.esRecharge / without.maxEs) * 0.5);
  });

  it('Strongarm: strength boosts projectile attacks', () => {
    const { without, with: w } = both('strider', 'strongarm');
    expect(w.profile(w.primary).hands[0].chunks[0].min).toBeGreaterThan(
      without.profile(without.primary).hands[0].chunks[0].min,
    );
  });

  it('Wound Dance: bleeds stack and ignore movement', () => {
    const c = both('reaver', 'woundDance').with;
    expect(c.profile(c.primary).woundDance).toBe(true);
    const { world, dummy } = createDummyWorld(build('reaver', []), { distance: 20 });
    dummy.ail.bleeds = [
      { dps: 10, t: 5, stack: true },
      { dps: 10, t: 5, stack: true },
      { dps: 10, t: 5, stack: true },
    ];
    dummy.moving = true;
    const l0 = dummy.life;
    stepWorld(world);
    expect((l0 - dummy.life) * 60).toBeCloseTo(30);
  });

  it('Cruel Agony: crits deal 30% less hit damage', () => {
    const c = both('shade', 'cruelAgony').with;
    const p = c.profile(c.primary);
    const h = {
      ...p.hands[0],
      critChance: 1,
      chunks: [{ type: 0, anc: 1, min: 100, max: 100 }],
      hitMult: 1,
    };
    const r = resolveHit(
      new Rng(1),
      { ...p, alwaysHit: true },
      h,
      { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] },
      1,
      false,
    );
    expect(r.total).toBeCloseTo(100 * h.critMulti * 0.7);
  });

  it('Mana Bastion: ES protects mana, not life', () => {
    const b = build('mystic', ['manaBastion']);
    const { world } = createDummyWorld(b, { distance: 20 });
    const p = world.player;
    p.def = { ...p.def, esProtectsMana: true, maxEs: 50 };
    p.es = 50;
    const l0 = p.life;
    applyDamage(world, p, [10, 0, 0, 0, 0]);
    expect(p.es).toBe(50);
    expect(p.life).toBeCloseTo(l0 - 10);
  });

  it('Arrow Weave: harder to hit with projectiles, easier with melee', () => {
    const c = both('strider', 'arrowWeave').with;
    const d = c.defence();
    expect(d.evadeProj).toBeCloseTo(0.4);
    expect(d.evadeMelee).toBeCloseTo(-0.3);
  });

  it('Shieldwall: block cap +10%, 30% less evasion', () => {
    const b = build('reaver', ['shieldwall']);
    b.equipment.helmet = {
      ...makeItem(() => 9998, 'helmet_ar_1', 40),
      implicits: [mod('blockAttack', 'base', 95)],
    };
    const d = new Character(b).defence();
    const d0 = new Character({ ...b, allocated: [] }).defence();
    expect(d.blockAttack).toBeCloseTo(0.85);
    expect(d0.blockAttack).toBeCloseTo(0.75);
    expect(d.evasion / d0.evasion).toBeCloseTo(0.7, 1);
  });

  it('Steady Draw: bows deal 25% more damage, 20% less attack speed', () => {
    const { without, with: w } = both('strider', 'steadyDraw');
    const p0 = without.profile(without.primary);
    const p1 = w.profile(w.primary);
    expect(p1.hands[0].chunks[0].min / p0.hands[0].chunks[0].min).toBeCloseTo(1.25);
    expect(p1.useTime / p0.useTime).toBeCloseTo(1 / 0.8);
  });
});
