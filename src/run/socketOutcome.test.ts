import { describe, expect, it } from 'vitest';
import { makeGem, makeItem } from '../gen/items';
import type { GemItem, Item } from '../data/types';
import { dryEquip, equip, socketGem } from './inventory';
import { compareSlots, itemInfos, placementsFor } from './inventoryOps';
import { newRun } from './run';

/** A run with no gems anywhere, at level 30 so most bases fit, and helpers to build gear for it. */
function setup(classId = 'mystic') {
  const run = newRun(classId, 1);
  run.build.level = 30;
  const uid = () => run.nextUid++;
  const gems = (ids: string[]): GemItem[] => ids.map((g) => makeGem(uid, g));
  /** Wear a body with `n` sockets holding these gems, the first of them the primary skill. */
  const wearBody = (n: number, ids: string[]): Item => {
    const body = makeItem(uid, 'body_ar_1', 30, n);
    body.sockets = [...gems(ids), ...new Array(n - ids.length).fill(null)];
    run.build.equipment.body = body;
    run.build.primaryGem = body.sockets[0]?.uid;
    return body;
  };
  const carry = (n: number, base = 'body_ar_1'): Item => {
    const it = makeItem(uid, base, 30, n);
    run.inventory.push(it);
    return it;
  };
  return { run, uid, gems, wearBody, carry };
}

const names = (gs: GemItem[]) => gs.map((g) => g.gemId);

describe('the gems of a swap (docs/EQUIP.md 3.1)', () => {
  it('fewer sockets than gems: the last ones come out, and the row says how many fit', () => {
    const { run, wearBody, carry } = setup();
    wearBody(4, ['flameBolt', 'echoingCast', 'bruteForce', 'kindle']);
    const next = carry(2);
    const o = dryEquip(run, next.uid, 'body').sockets;
    expect(o.before).toEqual({ sockets: 4, filled: 4 });
    expect(o.after).toEqual({ sockets: 2, filled: 2 });
    expect(names(o.moved)).toEqual(['flameBolt', 'echoingCast']);
    expect(names(o.out)).toEqual(['bruteForce', 'kindle']);
    expect(o.freeAfter).toBe(0);
    expect(o.lostPrimary).toBe(false);
  });

  it('more sockets: everything moves and the extra sockets are free', () => {
    const { run, wearBody, carry } = setup();
    wearBody(2, ['flameBolt', 'echoingCast']);
    const next = carry(5);
    const o = dryEquip(run, next.uid, 'body').sockets;
    expect(o.out).toEqual([]);
    expect(names(o.moved)).toEqual(['flameBolt', 'echoingCast']);
    expect(o.after).toEqual({ sockets: 5, filled: 2 });
    expect(o.freeAfter).toBe(3);
  });

  it('an empty slot has nothing to carry over', () => {
    const { run, carry } = setup();
    delete run.build.equipment.body;
    const next = carry(3);
    const o = dryEquip(run, next.uid, 'body').sockets;
    expect(o.before).toEqual({ sockets: 0, filled: 0 });
    expect(o.after).toEqual({ sockets: 3, filled: 0 });
    expect(o.moved).toEqual([]);
    expect(o.out).toEqual([]);
    expect(o.freeAfter).toBe(3);
  });

  it('a swap that pushes the primary skill out says so', () => {
    const { run, wearBody, carry } = setup();
    const body = wearBody(3, ['bruteForce', 'echoingCast', 'flameBolt']);
    run.build.primaryGem = body.sockets[2]!.uid;
    const next = carry(2);
    const o = dryEquip(run, next.uid, 'body').sockets;
    expect(names(o.out)).toEqual(['flameBolt']);
    expect(o.lostPrimary).toBe(true);
    // The real equip agrees: no primary is left.
    expect(equip(run, next.uid, 'body').ok).toBe(true);
    expect(run.build.primaryGem).toBeUndefined();
  });

  it('a primary skill that fits stays the primary skill', () => {
    const { run, wearBody, carry } = setup();
    wearBody(3, ['flameBolt', 'echoingCast', 'bruteForce']);
    const next = carry(2);
    expect(dryEquip(run, next.uid, 'body').sockets.lostPrimary).toBe(false);
  });

  it('a support whose skill is the one pushed out is idle, with the reason', () => {
    const { run, wearBody, carry } = setup();
    // The support is first in socket order, so it moves and the skill after it does not.
    const body = wearBody(2, ['echoingCast', 'flameBolt']);
    run.build.primaryGem = body.sockets[1]!.uid;
    const next = carry(1);
    const c = compareSlots(run, next.uid)[0];
    expect(names(c.sockets.out)).toEqual(['flameBolt']);
    expect(c.sockets.idle.map((x) => x.gem.gemId)).toEqual(['echoingCast']);
    expect(c.sockets.idle[0].why).toMatch(/skill in the same item/);
    expect(c.sockets.lostPrimary).toBe(true);
  });

  it('a support that was idle already is not blamed on the swap', () => {
    const { run, wearBody, carry } = setup();
    wearBody(2, ['echoingCast', 'bruteForce']);
    run.build.primaryGem = undefined;
    const next = carry(2);
    expect(compareSlots(run, next.uid)[0].sockets.idle).toEqual([]);
  });

  it('a weapon that cannot use a skill elsewhere makes that skill idle', () => {
    const { run, uid, wearBody, carry } = setup('strider');
    wearBody(1, ['splitVolley']);
    run.build.equipment.mainHand = makeItem(uid, 'bow_1', 30);
    delete run.build.equipment.offHand;
    // A sword cannot loose arrows.
    const sword = carry(0, 'sword_1');
    const c = compareSlots(run, sword.uid).find((s) => s.slot === 'mainHand')!;
    expect(c.check.ok).toBe(true);
    expect(c.sockets.idle.map((x) => x.gem.gemId)).toEqual(['splitVolley']);
    expect(c.sockets.idle[0].why).toMatch(/bow/);
  });

  it('a ring onto a ring is judged per ring slot', () => {
    const { run, uid, gems, carry } = setup();
    const r1 = makeItem(uid, 'ring_fire', 5, 1);
    r1.sockets = gems(['kindle']);
    run.build.equipment.ring1 = r1;
    const r2 = makeItem(uid, 'ring_cold', 5, 0);
    run.build.equipment.ring2 = r2;
    const next = carry(0, 'ring_life');
    const [a, b] = compareSlots(run, next.uid);
    expect(a.slot).toBe('ring1');
    expect(a.sockets.before).toEqual({ sockets: 1, filled: 1 });
    expect(names(a.sockets.out)).toEqual(['kindle']);
    expect(b.sockets.before).toEqual({ sockets: 0, filled: 0 });
    expect(b.sockets.out).toEqual([]);
  });

  it('a two-hander over a shield sends the shield and its gems back', () => {
    const { run, uid, gems, carry } = setup('vanguard');
    const shield = makeItem(uid, 'shield_ar_1', 30, 2);
    shield.sockets = gems(['bruteForce', 'kindle']);
    run.build.equipment.offHand = shield;
    const maul = carry(0, 'mace2_1');
    const c = compareSlots(run, maul.uid)[0];
    expect(c.alsoMoves.map((x) => x.uid)).toEqual([shield.uid]);
    expect(names(c.sockets.out)).toEqual(['bruteForce', 'kindle']);
    expect(names(c.sockets.fromOffHand)).toEqual(['bruteForce', 'kindle']);
    // Nothing is lost for good: the real equip leaves the gems in the bag.
    expect(equip(run, maul.uid, 'mainHand').ok).toBe(true);
    expect(run.inventory.filter((x) => x.kind === 'gem')).toHaveLength(2);
  });

  it('a two-hander that is not a bow cannot be worn over a quiver, and the gems stay put', () => {
    const { run, uid, gems, carry } = setup('vanguard');
    const quiver = makeItem(uid, 'quiver_acc', 30, 1);
    quiver.sockets = gems(['kindle']);
    run.build.equipment.offHand = quiver;
    const maul = carry(0, 'mace2_1');
    const d = dryEquip(run, maul.uid, 'mainHand');
    expect(d.check.ok).toBe(false);
    expect(d.sockets.out).toEqual([]);
  });

  it('a one-hander in the off hand does not count the main hand', () => {
    const { run, uid, gems, carry } = setup('vanguard');
    const sword = makeItem(uid, 'sword_1', 30, 1);
    sword.sockets = gems(['kindle']);
    run.build.equipment.mainHand = sword;
    delete run.build.equipment.offHand;
    const dagger = carry(2, 'sword_1');
    const o = dryEquip(run, dagger.uid, 'offHand').sockets;
    expect(o.before).toEqual({ sockets: 0, filled: 0 });
    expect(o.out).toEqual([]);
    expect(o.fromOffHand).toEqual([]);
  });

  it('a swap that fails changes nothing and says so', () => {
    const { run, wearBody, carry } = setup();
    wearBody(2, ['flameBolt', 'echoingCast']);
    const next = carry(1, 'sword_5');
    run.build.level = 10;
    const d = dryEquip(run, next.uid, 'body');
    expect(d.check.ok).toBe(false);
    expect(d.sockets.out).toEqual([]);
    expect(d.sockets.before).toEqual({ sockets: 2, filled: 2 });
  });

  it('the bag rows carry the gems the best-slot swap sends back', () => {
    const { run, wearBody, carry } = setup();
    wearBody(3, ['flameBolt', 'echoingCast', 'bruteForce']);
    const next = carry(1);
    const info = itemInfos(run).get(next.uid)!;
    expect(info.slot).toBe('body');
    expect(names(info.gemsOut)).toEqual(['echoingCast', 'bruteForce']);
  });
});

describe('socketing over the primary skill', () => {
  it('replacing the primary skill gem leaves the primary pointing at a gem in the bag, so the next usable skill is used', () => {
    const { run, wearBody, gems } = setup();
    const body = wearBody(2, ['flameBolt', 'glacierDart']);
    const [primary, other] = body.sockets as GemItem[];
    const [fresh] = gems(['kindle']);
    run.inventory.push(fresh);
    expect(socketGem(run, 'body', 0, fresh.uid)).toBe(true);
    expect(run.build.primaryGem).toBe(primary.uid);
    expect(run.inventory.some((x) => x.uid === primary.uid)).toBe(true);
    expect(run.build.equipment.body!.sockets[1]!.uid).toBe(other.uid);
  });
});

describe('placements say why a support has nowhere to work', () => {
  it('an item with no skill gives the reason, and one with a skill does not', () => {
    const { run, uid, wearBody, gems } = setup();
    wearBody(3, ['flameBolt']);
    const helmet = makeItem(uid, 'helmet_ar_1', 30, 2);
    run.build.equipment.helmet = helmet;
    const [support] = gems(['echoingCast']);
    run.inventory.push(support);
    const ps = placementsFor(run, support.uid, { emptiesFirst: true });
    const onHelmet = ps.find((p) => p.slot === 'helmet')!;
    const onBody = ps.find((p) => p.slot === 'body')!;
    expect(onHelmet.idle).toMatch(/^needs an? .*skill on this item$/);
    expect(onBody.idle).toBeUndefined();
  });
});
