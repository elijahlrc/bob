import { describe, expect, it } from 'vitest';
import { resolveHit } from '../calc/combat';
import { Rng } from '../core/rng';
import { RAGE_HOLD } from '../data/buffs';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { condBit, mod, type Mod } from '../mods/types';
import { newRun } from '../run/run';
import { gainBuff, gainRage, rollGains, tickBuffs } from './buffs';
import { applyHit, flaskMask, playerConds, refreshPlayerDefence, targetState } from './combat';
import { createDummyWorld } from './dummy';

function buildWith(extra: Mod[], gems = ['crushingBlow']): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 40, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, gems.length, 'unique');
  body.sockets = gems.map((g) => makeGem(uid, g));
  body.uniqueMods = extra;
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

function arena(extra: Mod[] = [], gems?: string[]) {
  const { world, dummy } = createDummyWorld(buildWith(extra, gems), { distance: 2 });
  return { w: world, dummy, p: world.player };
}

const SECOND = 60;
function run(w: ReturnType<typeof arena>['w'], seconds: number) {
  for (let i = 0; i < seconds * SECOND; i++) tickBuffs(w, 1 / SECOND);
}

describe('buffs: conditions with timers (C2)', () => {
  it('cannot be gained without a source, and their mods are not in the database', () => {
    const { w } = arena();
    gainBuff(w, 'fortify');
    expect(w.buffT.fortify).toBe(0);
    expect(w.char.buffSource.fortify).toBe(false);
  });

  it('Fortify: 20% less damage from hits for 4 seconds, and none from damage over time', () => {
    const { w, p } = arena([mod('buffOn.hit.fortify', 'base', 100)]);
    expect(w.char.buffSource.fortify).toBe(true);
    const plain = p.def.hitTakenMult;
    expect(plain).toBe(1);
    rollGains(w, 'hit');
    expect(w.buffT.fortify).toBeCloseTo(4);
    expect(playerConds(w, null) & condBit('fortified')).toBeGreaterThan(0);
    refreshPlayerDefence(w);
    expect(p.def.hitTakenMult).toBeCloseTo(0.8);
    expect(p.def.damageTakenMult).toBe(1); // damage over time uses this one
    run(w, 4.1);
    refreshPlayerDefence(w);
    expect(w.buffT.fortify).toBe(0);
    expect(p.def.hitTakenMult).toBe(1);
  });

  it('a chance below 100% is rolled, and a gain refreshes the full time', () => {
    const { w } = arena([mod('buffOn.kill.onslaught', 'base', 50)]);
    let got = 0;
    for (let i = 0; i < 400; i++) {
      w.buffT.onslaught = 0;
      rollGains(w, 'kill');
      if (w.buffT.onslaught > 0) got++;
    }
    expect(got).toBeGreaterThan(140);
    expect(got).toBeLessThan(260);
    w.buffT.onslaught = 1;
    gainBuff(w, 'onslaught');
    expect(w.buffT.onslaught).toBeCloseTo(4);
  });

  it('Quickened: 20% increased attack, cast and movement speed', () => {
    const { w, p } = arena([mod('buffOn.kill.onslaught', 'base', 100)]);
    const before = w.char.profile(w.primary, playerConds(w, null), flaskMask(w)).useTime;
    const speed = p.def.moveSpeed;
    gainBuff(w, 'onslaught');
    const conds = playerConds(w, null);
    const after = w.char.profile(w.primary, conds, flaskMask(w)).useTime;
    expect(after).toBeCloseTo(before / 1.2);
    refreshPlayerDefence(w);
    expect(p.def.moveSpeed).toBeCloseTo(speed * 1.2);
  });

  it('Dread Might: 30% of physical damage as extra chaos', () => {
    const { w } = arena([mod('buffOn.hit.unholyMight', 'base', 100)]);
    const chaos = (conds: number) =>
      w.char
        .profile(w.primary, conds, flaskMask(w))
        .hands[0].chunks.filter((c) => c.type === 4)
        .reduce((s, c) => s + c.max, 0);
    expect(chaos(playerConds(w, null))).toBe(0);
    gainBuff(w, 'unholyMight');
    expect(chaos(playerConds(w, null))).toBeGreaterThan(0);
  });

  it('Arcane Tide: 10% more spell damage and cast speed', () => {
    const { w } = arena([mod('buffOn.hit.arcaneSurge', 'base', 100)], ['flameBolt']);
    const prof = () => w.char.profile(w.primary, playerConds(w, null), flaskMask(w));
    const before = prof();
    gainBuff(w, 'arcaneSurge');
    const after = prof();
    expect(after.useTime).toBeCloseTo(before.useTime / 1.1);
    expect(after.hands[0].chunks[0].max / before.hands[0].chunks[0].max).toBeCloseTo(1.1);
  });
});

describe('rage', () => {
  it('each point is 1% increased attack damage, 0.5% attack speed and 0.2% movement speed', () => {
    const { w, p } = arena([mod('rageOn.hit', 'base', 1)]);
    expect(w.char.rageSource).toBe(true);
    const base = w.char.profile(w.primary, 0, flaskMask(w));
    gainRage(w, 20);
    expect(w.rage).toBe(20);
    const raging = w.char.profile(w.primary, 0, flaskMask(w));
    expect(raging.useTime).toBeCloseTo(base.useTime / 1.1);
    const dmg = (x: typeof base) => x.hands[0].chunks.reduce((s, c) => s + c.max, 0);
    expect(dmg(raging) / dmg(base)).toBeGreaterThan(1.15);
    refreshPlayerDefence(w);
    expect(p.def.moveSpeed).toBeCloseTo(w.char.defence(0, 0).moveSpeed * 1.04);
  });

  it('is capped at 50, drains one every half second once it has not been fed, and is held by hits', () => {
    const { w } = arena([mod('rageOn.hit', 'base', 1)]);
    gainRage(w, 80);
    expect(w.rage).toBe(50);
    run(w, RAGE_HOLD - 0.5);
    expect(w.rage).toBe(50);
    run(w, 0.5 + 2.1);
    expect(w.rage).toBe(46);
    rollGains(w, 'hitTaken');
    run(w, RAGE_HOLD - 0.5);
    expect(w.rage).toBe(46);
  });

  it('a hit landed feeds it', () => {
    const { w, dummy, p } = arena([mod('rageOn.hit', 'base', 3)]);
    const prof = w.char.profile(w.primary, 0, 0);
    const res = resolveHit(new Rng(1), prof, prof.hands[0], targetState(dummy), 1, false);
    if (res.outcome !== 'hit') res.outcome = 'hit';
    applyHit(w, p, dummy, prof, res);
    expect(w.rage).toBe(3);
  });
});

describe('impale and culling strike', () => {
  const impaler = [mod('chance.impale', 'base', 100)];

  it('a hit that impales records 10% of its physical damage; the next hits repeat it', () => {
    const { w, dummy, p } = arena(impaler);
    dummy.def = { ...dummy.def, maxLife: 1e9, armour: 0 };
    dummy.life = 1e9;
    const prof = w.char.profile(w.primary, 0, 0);
    expect(prof.impale.chance).toBe(1);
    const hit = () => {
      const r = resolveHit(new Rng(3), prof, prof.hands[0], targetState(dummy), 1, false);
      r.outcome = 'hit';
      return r;
    };
    const r1 = hit();
    expect(r1.rawPhys).toBeGreaterThan(0);
    applyHit(w, p, dummy, prof, r1);
    expect(dummy.impales).toHaveLength(1);
    expect(dummy.impales[0].dmg).toBeCloseTo((r1.rawPhys ?? 0) * 0.1);
    applyHit(w, p, dummy, prof, hit());
    expect(dummy.impales).toHaveLength(2);
    expect(dummy.impales[0].hits).toBe(4);
  });

  it('at most five impales at once, and each wears out after five hits', () => {
    const { w, dummy, p } = arena(impaler);
    dummy.def = { ...dummy.def, maxLife: 1e9 };
    dummy.life = 1e9;
    const prof = w.char.profile(w.primary, 0, 0);
    const r = () => {
      const x = resolveHit(new Rng(4), prof, prof.hands[0], targetState(dummy), 1, false);
      x.outcome = 'hit';
      return x;
    };
    for (let i = 0; i < 12; i++) applyHit(w, p, dummy, prof, r());
    expect(dummy.impales.length).toBeLessThanOrEqual(5);
    const noImpale = { ...prof, impale: { ...prof.impale, chance: 0 } };
    for (let i = 0; i < 5; i++) applyHit(w, p, dummy, noImpale, r());
    expect(dummy.impales).toHaveLength(0);
  });

  it('the calc counts impale as up to +50% physical damage per hit at full chance', () => {
    const plain = arena();
    const imp = arena(impaler);
    const dmg = (a: ReturnType<typeof arena>) => {
      const ch = a.w.char;
      return ch.skillSheet(ch.primary, undefined, 0).avgHit;
    };
    expect(dmg(imp) / dmg(plain)).toBeGreaterThan(1.3);
    expect(dmg(imp) / dmg(plain)).toBeLessThan(1.6);
  });

  it('culling strike finishes a target left at 10% life or less', () => {
    const { w, dummy, p } = arena([mod('cullingStrike', 'flag', 1)]);
    const prof = w.char.profile(w.primary, 0, 0);
    expect(prof.culling).toBe(true);
    dummy.def = { ...dummy.def, maxLife: 1000 };
    dummy.life = 104;
    const r = resolveHit(new Rng(5), prof, prof.hands[0], targetState(dummy), 1, false);
    r.outcome = 'hit';
    r.dmg = [5, 0, 0, 0, 0];
    r.total = 5;
    applyHit(w, p, dummy, prof, r);
    expect(dummy.alive).toBe(false);
    // Above the threshold nothing happens.
    const { w: w2, dummy: d2, p: p2 } = arena([mod('cullingStrike', 'flag', 1)]);
    d2.def = { ...d2.def, maxLife: 1000 };
    d2.life = 500;
    const prof2 = w2.char.profile(w2.primary, 0, 0);
    const r2 = resolveHit(new Rng(5), prof2, prof2.hands[0], targetState(d2), 1, false);
    r2.outcome = 'hit';
    r2.dmg = [5, 0, 0, 0, 0];
    r2.total = 5;
    applyHit(w2, p2, d2, prof2, r2);
    expect(d2.alive).toBe(true);
  });
});
