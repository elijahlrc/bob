import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { ModDB } from '../mods/modDb';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { dummyDefence } from '../sim/dummy';
import { Character } from './character';
import {
  ailmentsFromHit,
  expectedHit,
  resolveHit,
  stunFromHit,
  type Defence,
  type TargetState,
} from './combat';
import { DEFAULT_ATTACK } from './gems';
import { buildMonster, referenceMonster } from './monster';
import { buildProfile, type HandStats } from './skill';

/** Changes made by the 3.9 mechanics audit (docs/AUDIT-3.9.md), one test per rule. */

const hand = (crit = 5): HandStats => ({
  flats: [
    [10, 20],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  aps: 1,
  crit,
  range: 1.3,
  tags: ['mace', 'oneHand'],
});

function profile(db: ModDB, hands = [hand()]) {
  return buildProfile({
    skill: DEFAULT_ATTACK,
    db,
    hands,
    extraTags: [],
    costMult: 1,
    conds: 0,
    statValue: () => 0,
  });
}

const target = (over: Partial<Defence> = {}, es = 0): TargetState => ({
  def: dummyDefence(over),
  shock: 0,
  resShift: [0, 0, 0, 0, 0],
  es,
});
const always = () => true;

let n = 9000;
const uid = () => n++;

function build(offHand: boolean): Build {
  const b = newRun('vanguard', 1).build;
  b.level = 30;
  b.equipment.mainHand = makeItem(uid, 'sword_1', 30, 0);
  if (offHand) b.equipment.offHand = makeItem(uid, 'sword_1', 30, 0);
  else delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 30, 1);
  body.sockets = [makeGem(uid, 'reapingArc')];
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

describe('audit 3.9: hits and criticals', () => {
  it('an attack confirms a critical strike with a second accuracy check', () => {
    const p = profile(new ModDB([mod('critChance', 'base', 95)]));
    const evasive = target({ evasion: 4000 });
    const hc = expectedHit(p, p.hands[0], evasive, 0).hitChance;
    expect(hc).toBeLessThan(0.9);
    const rng = new Rng(7);
    let hits = 0;
    let crits = 0;
    for (let i = 0; i < 20000; i++) {
      const r = resolveHit(rng, p, p.hands[0], evasive, 0, false);
      if (r.outcome === 'hit') {
        hits++;
        if (r.crit) crits++;
      }
    }
    // Given a hit, a crit needs the crit roll and one more accuracy roll.
    expect(crits / hits).toBeCloseTo(p.hands[0].critChance * hc, 1);
  });

  it('ailments from a critical strike carry a fixed 150%', () => {
    const p = profile(new ModDB([mod('chance.bleed', 'base', 100), mod('critMulti', 'base', 100)]));
    const t = target();
    const non = ailmentsFromHit(p, p.hands[0], [50, 0, 0, 0, 0], false, t, always).bleed;
    const crit = ailmentsFromHit(p, p.hands[0], [50, 0, 0, 0, 0], true, t, always).bleed;
    expect(crit / non).toBeCloseTo(1.5); // not the 250% critical strike multiplier
  });

  it('a monster bleeds you for a seventh of what you bleed it for', () => {
    const p = profile(new ModDB([mod('chance.bleed', 'base', 100)]));
    const onMonster = ailmentsFromHit(p, p.hands[0], [50, 0, 0, 0, 0], false, target(), always);
    const onPlayer = ailmentsFromHit(
      p,
      p.hands[0],
      [50, 0, 0, 0, 0],
      false,
      target({ isPlayer: true }),
      always,
    );
    expect(onMonster.bleed / onPlayer.bleed).toBeCloseTo(7);
  });

  it('penetration does not apply to ignite', () => {
    const base = [mod('chance.ignite', 'base', 100)];
    const plain = profile(new ModDB(base));
    const pen = profile(
      new ModDB([...base, mod('penetration', 'base', 30, { damageTypes: ['fire'] })]),
    );
    const t = target({ res: [0, 0, 0, 40, 0] });
    const h = [0, 0, 0, 50, 0];
    expect(ailmentsFromHit(pen, pen.hands[0], h, false, t, always).ignite).toBeCloseTo(
      ailmentsFromHit(plain, plain.hands[0], h, false, t, always).ignite,
    );
  });

  it('monsters crit for 130%', () => {
    const m = referenceMonster(40);
    expect(m.profile(0).hands[0].critMulti).toBeCloseTo(1.3);
    expect(m.profile(0).hands[0].critChance).toBeGreaterThan(0);
  });
});

describe('audit 3.9: stun', () => {
  it('energy shield ignores half of all stuns', () => {
    const p = profile(new ModDB());
    const def = dummyDefence({ stunThreshold: 100, cannotBeStunned: false });
    expect(stunFromHit(p, [200, 0, 0, 0, 0], def, true, null, false).chance).toBe(1);
    expect(stunFromHit(p, [200, 0, 0, 0, 0], def, true, null, true).chance).toBeCloseTo(0.5);
    const protectsMana = { ...def, esProtectsMana: true };
    expect(stunFromHit(p, [200, 0, 0, 0, 0], protectsMana, true, null, true).chance).toBe(1);
  });

  it('melee physical stuns best, and non-melee non-physical worst', () => {
    const melee = profile(new ModDB());
    const def = dummyDefence({ stunThreshold: 1000, cannotBeStunned: false });
    const physical = stunFromHit(melee, [250, 0, 0, 0, 0], def, true, null).chance;
    const fire = stunFromHit(melee, [0, 0, 0, 250, 0], def, true, null).chance;
    expect(physical / fire).toBeCloseTo(1.25);
    const ranged = buildProfile({
      skill: { ...DEFAULT_ATTACK, tags: ['attack', 'projectile'] },
      db: new ModDB(),
      hands: [hand()],
      extraTags: [],
      costMult: 1,
      conds: 0,
      statValue: () => 0,
    });
    const rangedFire = stunFromHit(ranged, [0, 0, 0, 250, 0], def, true, null).chance;
    const rangedPhys = stunFromHit(ranged, [250, 0, 0, 0, 0], def, true, null).chance;
    expect(rangedFire / rangedPhys).toBeCloseTo(0.75);
  });
});

describe('audit 3.9: dual wielding and characters', () => {
  it('dual wielding gives 15% block and 20% more physical attack damage', () => {
    const one = new Character(build(false), { areaLevel: 30 });
    const two = new Character(build(true), { areaLevel: 30 });
    expect(two.dualWielding).toBe(true);
    expect(two.defence().blockAttack - one.defence().blockAttack).toBeCloseTo(0.15);
    const dmg = (c: Character) =>
      c.profile(c.primary).hands[0].chunks.reduce((s, k) => s + k.max, 0);
    expect(dmg(two) / dmg(one)).toBeGreaterThan(1.15);
  });

  it('energy shield recharges 20% of its maximum a second', () => {
    const b = build(false);
    b.equipment.body!.implicits.push(mod('es', 'base', 1000));
    const c = new Character(b, { areaLevel: 30 });
    const d = c.defence();
    expect(d.esRecharge / d.maxEs).toBeCloseTo(0.2);
  });

  it('chaos inoculation keeps the stun threshold of the life it replaces', () => {
    const b = build(false);
    const normal = new Character(b, { areaLevel: 30 }).defence();
    b.equipment.body!.implicits.push(mod('lifeIsOne', 'flag', 1));
    const ci = new Character(b, { areaLevel: 30 }).defence();
    expect(ci.maxLife).toBe(1);
    expect(ci.stunThreshold).toBeCloseTo(normal.stunThreshold);
  });

  it('increased life regeneration also scales percentage regeneration', () => {
    const b = build(false);
    b.equipment.body!.implicits.push(mod('lifeRegenPct', 'base', 2));
    const base = new Character(b, { areaLevel: 30 }).defence().lifeRegen;
    b.equipment.body!.implicits.push(mod('lifeRegen', 'inc', 100));
    expect(new Character(b, { areaLevel: 30 }).defence().lifeRegen).toBeCloseTo(base * 2);
  });

  it('a boss monster comes with its own stun threshold and crit multiplier', () => {
    const boss = buildMonster({
      type: 'warrior',
      variant: 'none',
      rarity: 'boss',
      level: 50,
      mods: [],
    });
    expect(boss.profile(0).hands[0].critMulti).toBeCloseTo(1.3);
  });
});
