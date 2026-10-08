import { describe, expect, it } from 'vitest';
import { ModDB } from '../mods/modDb';
import { mod } from '../mods/types';
import { dummyDefence } from '../sim/dummy';
import { Rng } from '../core/rng';
import { ailmentsFromHit, expectedHit, resolveHit, type TargetState } from './combat';
import { DEFAULT_ATTACK } from './gems';
import { buildProfile, type HandStats } from './skill';

/** The stats the passive tree grants, as the profile and the hit calculation read them. */
const hand: HandStats = {
  flats: [
    [10, 20],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  aps: 1,
  crit: 0,
  range: 1.3,
  tags: ['sword', 'oneHand'],
};
const t = (over = {}): TargetState => ({
  def: dummyDefence(over),
  shock: 0,
  resShift: [0, 0, 0, 0, 0],
});
const profile = (db: ModDB, conds = 0) =>
  buildProfile({
    skill: DEFAULT_ATTACK,
    db,
    hands: [hand],
    extraTags: [],
    costMult: 1,
    conds,
    statValue: () => 0,
  });
const always = () => true;
const ailments = (db: ModDB, conds = 0) => {
  const p = profile(db, conds);
  const ex = expectedHit(p, p.hands[0], t(), 0);
  return ailmentsFromHit(p, p.hands[0], ex.avgH, ex.avgHA, false, t(), always);
};
const chances = [mod('chance.bleed', 'base', 100), mod('chance.poison', 'base', 100)];

describe('passive tree stats', () => {
  it('an attack skill is an attack skill: ailment damage from attacks can be scaled on its own', () => {
    const plain = ailments(new ModDB(chances));
    const scaled = ailments(
      new ModDB([...chances, mod('damage', 'inc', 100, { tags: ['dot', 'attackSkill'] })]),
    );
    expect(scaled.bleed).toBeCloseTo(plain.bleed * 2);
    expect(scaled.poison).toBeCloseTo(plain.poison * 2);
  });

  it('the damage over time multiplier adds to the ailment, by ailment and by type', () => {
    const plain = ailments(new ModDB(chances));
    const all = ailments(new ModDB([...chances, mod('dotMulti', 'base', 50)]));
    expect(all.bleed).toBeCloseTo(plain.bleed * 1.5);
    expect(all.poison).toBeCloseTo(plain.poison * 1.5);
    const poisonOnly = ailments(
      new ModDB([...chances, mod('dotMulti', 'base', 100, { tags: ['poison'] })]),
    );
    expect(poisonOnly.bleed).toBeCloseTo(plain.bleed);
    expect(poisonOnly.poison).toBeCloseTo(plain.poison * 2);
    const chaos = ailments(
      new ModDB([...chances, mod('dotMulti', 'base', 100, { damageTypes: ['chaos'] })]),
    );
    expect(chaos.bleed).toBeCloseTo(plain.bleed);
    expect(chaos.poison).toBeCloseTo(plain.poison * 2);
  });

  it('bleeding and poison can deal their damage faster, for less time', () => {
    const plain = profile(new ModDB(chances));
    const fast = profile(
      new ModDB([...chances, mod('bleed.speed', 'inc', 100), mod('poison.speed', 'inc', 50)]),
    );
    expect(fast.bleed.dur).toBeCloseTo(plain.bleed.dur / 2);
    expect(fast.poison.dur).toBeCloseTo(plain.poison.dur / 1.5);
    expect(ailments(new ModDB([...chances, mod('bleed.speed', 'inc', 100)])).bleed).toBeCloseTo(
      ailments(new ModDB(chances)).bleed * 2,
    );
  });

  it('enemy physical damage reduction is taken off, and can go below nothing', () => {
    const armoured = t({ physReduction: 0.3 });
    const base = profile(new ModDB([]));
    const less = profile(new ModDB([mod('enemyPhysReduction', 'base', 20)]));
    const hit = (p: typeof base) => expectedHit(p, p.hands[0], armoured, 0).perType[0];
    expect(hit(less) / hit(base)).toBeCloseTo(0.9 / 0.7, 3);
    const naked = t();
    expect(expectedHit(less, less.hands[0], naked, 0).perType[0]).toBeGreaterThan(
      expectedHit(base, base.hands[0], naked, 0).perType[0],
    );
  });

  it('double damage doubles the hit on a roll and averages out in the sheet', () => {
    const base = profile(new ModDB([]));
    const dbl = profile(new ModDB([mod('doubleDamage', 'base', 50)]));
    expect(expectedHit(dbl, dbl.hands[0], t(), 0).perType[0]).toBeCloseTo(
      expectedHit(base, base.hands[0], t(), 0).perType[0] * 1.5,
    );
    const rng = new Rng(3);
    const sure = profile(new ModDB([mod('doubleDamage', 'base', 100)]));
    const r = resolveHit(rng, sure, sure.hands[0], t(), 0, false);
    expect(r.outcome).toBe('hit');
    const lo = resolveHit(new Rng(3), base, base.hands[0], t(), 0, false);
    expect(r.total).toBeCloseTo(lo.total * 2);
  });
});
