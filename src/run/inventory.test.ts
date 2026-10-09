import { describe, expect, it } from 'vitest';
import { makeFlask, makeGem, makeItem } from '../gen/items';
import { discardedValue, salvageDiscarded, salvageValue } from './craft';
import { newRun } from './run';
import { withStarterGems } from './starterGems';
import {
  canEquip,
  discard,
  discardToPile,
  equip,
  equipFlask,
  putBack,
  slotsFor,
  socketGem,
  unequip,
  unsocketGem,
} from './inventory';

function setup(classId = 'reaver') {
  const run = withStarterGems(newRun(classId, 1));
  const uid = () => run.nextUid++;
  return { run, uid };
}

describe('equipment rules (§11.1)', () => {
  it('slots by item class', () => {
    const { uid } = setup();
    expect(slotsFor(makeItem(uid, 'sword_1', 1))).toEqual(['mainHand', 'offHand']);
    expect(slotsFor(makeItem(uid, 'mace2_1', 1))).toEqual(['mainHand']);
    expect(slotsFor(makeItem(uid, 'ring_fire', 1))).toEqual(['ring1', 'ring2']);
    expect(slotsFor(makeItem(uid, 'quiver_acc', 1))).toEqual(['offHand']);
  });

  it('checks level and attribute requirements', () => {
    const { run, uid } = setup();
    const big = makeItem(uid, 'sword_5', 60);
    expect(canEquip(run, big, 'mainHand').ok).toBe(false);
    run.build.level = 70;
    expect(canEquip(run, big, 'mainHand').reason).toMatch(/Requires \d+ (str|dex)/);
  });

  it('two-handers clear the off hand; quivers need a bow', () => {
    const { run, uid } = setup();
    const maul = makeItem(uid, 'mace2_1', 1);
    run.inventory.push(maul);
    expect(equip(run, maul.uid, 'mainHand').ok).toBe(true);
    expect(run.build.equipment.offHand).toBeUndefined();
    expect(run.inventory.some((x) => x.kind === 'item' && x.baseId === 'shield_ar_1')).toBe(true);
    const quiver = makeItem(uid, 'quiver_acc', 1);
    run.inventory.push(quiver);
    expect(equip(run, quiver.uid, 'offHand').ok).toBe(false);
  });

  it('unequip and discard move items in and out of the inventory', () => {
    const { run } = setup();
    unequip(run, 'offHand');
    const shield = run.inventory.find((x) => x.kind === 'item')!;
    expect(shield).toBeTruthy();
    discard(run, shield.uid);
    expect(run.inventory).toHaveLength(0);
  });

  it('gems move between sockets and the inventory', () => {
    const { run, uid } = setup();
    const g = makeGem(uid, 'kindle');
    run.inventory.push(g);
    expect(socketGem(run, 'mainHand', 0, g.uid)).toBe(true);
    expect(run.build.equipment.mainHand!.sockets[0]!.gemId).toBe('kindle');
    unsocketGem(run, 'mainHand', 0);
    expect(run.inventory.some((x) => x.uid === g.uid)).toBe(true);
  });

  it('flasks equip into slots and respect their level', () => {
    const { run, uid } = setup();
    const f = makeFlask(uid, 'flask_life_3', 20);
    run.inventory.push(f);
    expect(equipFlask(run, f.uid, 2)).toBe(false);
    run.build.level = 20;
    expect(equipFlask(run, f.uid, 2)).toBe(true);
    expect(run.build.flasks[2]?.uid).toBe(f.uid);
  });
});

describe('gem transfer on equip', () => {
  it('moves gems into the new item when it has room', () => {
    const run = withStarterGems(newRun('vanguard', 1));
    const uid = () => run.nextUid++;
    const body = makeItem(uid, 'body_ar_1', 1, 3);
    run.inventory.push(body);
    expect(equip(run, body.uid, 'body').ok).toBe(true);
    const sockets = run.build.equipment.body!.sockets;
    expect(sockets.filter(Boolean).map((g) => g!.gemId)).toEqual(['crushingBlow', 'bruteForce']);
    const old = run.inventory.find((x) => x.kind === 'item')!;
    expect(old.kind === 'item' && old.sockets.every((s) => s === null)).toBe(true);
  });
});

describe('the discarded pile', () => {
  it('discarding sets an item aside: out of the bag, a held gem stays, and it can be put back', () => {
    const { run, uid } = setup();
    const it = makeItem(uid, 'sword_1', 1);
    const gem = makeGem(uid, 'kindle');
    it.sockets = [gem];
    run.inventory.push(it);
    expect(discardToPile(run, it.uid)).toBe(true);
    expect(run.inventory.some((x) => x.uid === it.uid)).toBe(false);
    expect(run.discarded!.map((x) => x.uid)).toEqual([it.uid]);
    expect(run.inventory.some((x) => x.uid === gem.uid)).toBe(true);
    expect(putBack(run, it.uid)).toBe(true);
    expect(run.discarded).toEqual([]);
    expect(run.inventory.some((x) => x.uid === it.uid)).toBe(true);
    expect(discardToPile(run, 99999)).toBe(false);
  });

  it('salvaging the pile pays for every item in it, once, and empties it', () => {
    const { run, uid } = setup();
    const a = makeItem(uid, 'sword_1', 1);
    const b = makeItem(uid, 'ring_fire', 1);
    run.inventory.push(a, b);
    discardToPile(run, a.uid);
    discardToPile(run, b.uid);
    const worth = discardedValue(run);
    expect(worth).toBe(salvageValue(a) + salvageValue(b));
    const dust = run.dust;
    expect(salvageDiscarded(run)).toEqual({ count: 2, dust: worth });
    expect(run.dust).toBe(dust + worth);
    expect(run.discarded).toEqual([]);
    expect(salvageDiscarded(run)).toEqual({ count: 0, dust: 0 });
  });
});
