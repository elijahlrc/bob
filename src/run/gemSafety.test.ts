import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { makeGem, makeItem } from '../gen/items';
import type { InventoryItem } from '../data/types';
import { applyClean } from './cleanUp';
import { salvage } from './craft';
import { DEFAULT_CLEAN } from './found';
import { discard, equip, releaseStrandedGems, socketGem, unequip } from './inventory';
import { junkItems } from './inventoryOps';
import { newRun, type RunState } from './run';
import { loadRun, MemoryStore, saveRun } from './save';
import { withStarterGems } from './starterGems';

/** Every gem the run has, wherever it is: socketed in worn gear, loose, or hidden inside a carried item. */
function allGems(run: RunState): { worn: number[]; loose: number[]; stranded: number[] } {
  const worn: number[] = [];
  const stranded: number[] = [];
  for (const it of Object.values(run.build.equipment))
    for (const g of it.sockets) if (g) worn.push(g.uid);
  const loose = run.inventory.filter((x) => x.kind === 'gem').map((x) => x.uid);
  for (const it of run.inventory)
    if (it.kind === 'item') for (const g of it.sockets) if (g) stranded.push(g.uid);
  return { worn: worn.sort(), loose: loose.sort(), stranded: stranded.sort() };
}

const total = (run: RunState) => {
  const g = allGems(run);
  return [...g.worn, ...g.loose, ...g.stranded].sort((a, b) => a - b);
};

/** A character wearing a four-socket body with three gems and a gem in the off hand's item. */
function geared() {
  const run = withStarterGems(newRun('reaver', 1));
  const uid = () => run.nextUid++;
  const body = makeItem(uid, 'body_ar_1', 1, 4);
  body.sockets[0] = makeGem(uid, 'crushingBlow');
  body.sockets[1] = makeGem(uid, 'bruteForce');
  body.sockets[2] = makeGem(uid, 'kindle');
  run.build = { ...run.build, equipment: { ...run.build.equipment, body } };
  const shield = run.build.equipment.offHand!;
  run.build.equipment.offHand = {
    ...shield,
    sockets: [makeGem(uid, 'kindle'), ...shield.sockets.slice(1)],
  };
  if (run.build.equipment.offHand.sockets.length === 0)
    run.build.equipment.offHand = { ...shield, sockets: [makeGem(uid, 'kindle')] };
  return { run, uid };
}

describe('a skill gem is never lost with the item it sat in', () => {
  it('swapping in an item with fewer sockets sets the extra gems free, not into the old item', () => {
    const { run, uid } = geared();
    const before = total(run);
    const small = makeItem(uid, 'body_ar_1', 1, 1);
    run.inventory.push(small);
    expect(equip(run, small.uid, 'body').ok).toBe(true);
    const g = allGems(run);
    // One gem went in, the three others are loose, and the old body is bare.
    expect(g.worn.length).toBeGreaterThanOrEqual(1);
    expect(g.stranded).toEqual([]);
    expect(total(run)).toEqual([...before, ...(g.stranded as number[])].sort((a, b) => a - b));
    expect(g.loose.length + g.worn.length).toBe(before.length);
  });

  it('then salvaging or discarding the old item loses nothing', () => {
    const { run, uid } = geared();
    const before = total(run);
    const small = makeItem(uid, 'body_ar_1', 1, 1);
    run.inventory.push(small);
    equip(run, small.uid, 'body');
    for (const it of run.inventory.filter((x): x is InventoryItem => x.kind === 'item')) {
      salvage(run, it.uid);
    }
    expect(total(run)).toEqual(before);
  });

  it('unequipping puts the gems beside the bare item', () => {
    const { run } = geared();
    const before = total(run);
    unequip(run, 'body');
    expect(allGems(run).stranded).toEqual([]);
    expect(total(run)).toEqual(before);
    expect(run.build.equipment.body).toBeUndefined();
  });

  it('a two-hander that clears the off hand keeps the gem that was in it', () => {
    const { run, uid } = geared();
    const before = total(run);
    const maul = makeItem(uid, 'mace2_1', 1);
    run.inventory.push(maul);
    expect(equip(run, maul.uid, 'mainHand').ok).toBe(true);
    expect(run.build.equipment.offHand).toBeUndefined();
    expect(allGems(run).stranded).toEqual([]);
    expect(total(run)).toEqual(before);
  });

  it('discard, salvage, the junk button and the clean-up never take a gem with an item', () => {
    const { run, uid } = geared();
    // A carried item that holds gems (a save from before, or any way it could have happened).
    const carried = makeItem(uid, 'sword_1', 1, 2);
    carried.sockets[0] = makeGem(uid, 'kindle');
    carried.sockets[1] = makeGem(uid, 'bruteForce');
    const carried2 = makeItem(uid, 'sword_1', 1, 1);
    carried2.sockets[0] = makeGem(uid, 'crushingBlow');
    const carried3 = makeItem(uid, 'sword_1', 1, 1);
    carried3.sockets[0] = makeGem(uid, 'kindle');
    run.inventory.push(carried, carried2, carried3);
    const before = total(run);
    discard(run, carried.uid);
    salvage(run, carried2.uid);
    expect(total(run)).toEqual(before);
    // The junk button and the clean-up go through salvage and discard.
    run.map = 60;
    for (const j of junkItems(run)) salvage(run, j.uid);
    applyClean(run, { ...DEFAULT_CLEAN, includeUnseen: true, olderThan: 0 });
    expect(total(run)).toEqual(before);
  });

  it('a save with gems stuck inside a carried item gets them back on load', () => {
    const { run, uid } = geared();
    const stuck = makeItem(uid, 'sword_1', 1, 2);
    stuck.sockets[0] = makeGem(uid, 'kindle');
    run.inventory.push(stuck);
    const before = total(run);
    const store = new MemoryStore();
    saveRun(store, run);
    const res = loadRun(store);
    expect(res.status).toBe('ok');
    if (res.status !== 'ok') return;
    expect(allGems(res.run).stranded).toEqual([]);
    expect(total(res.run)).toEqual(before);
    expect(releaseStrandedGems(res.run)).toBe(0);
  });

  it('the primary skill gem stays primary while it is worn, and is cleared when it is not', () => {
    const { run, uid } = geared();
    const body = run.build.equipment.body!;
    run.build = { ...run.build, primaryGem: body.sockets[0]!.uid };
    // A body with four sockets keeps it.
    const roomy = makeItem(uid, 'body_ar_1', 1, 4);
    run.inventory.push(roomy);
    equip(run, roomy.uid, 'body');
    expect(run.build.primaryGem).toBe(body.sockets[0]!.uid);
    // No sockets at all: every gem comes out, and nothing points at a gem that is not worn.
    const none = makeItem(uid, 'body_ar_1', 1, 0);
    run.inventory.push(none);
    equip(run, none.uid, 'body');
    expect(run.build.primaryGem).toBeUndefined();
  });
});

describe('gems survive any sequence of equipment changes', () => {
  it('over random equips, unequips, discards, salvages and re-sockets, the gems are all still there', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const { run, uid } = geared();
      const rng = new Rng(seed);
      const before = total(run);
      const bases = ['body_ar_1', 'sword_1', 'mace2_1', 'shield_ar_1', 'quiver_acc'];
      for (let step = 0; step < 60; step++) {
        const op = rng.int(0, 5);
        const items = run.inventory.filter(
          (x): x is Extract<InventoryItem, { kind: 'item' }> => x.kind === 'item',
        );
        if (op === 0) {
          const b = rng.pick(bases);
          run.inventory.push(makeItem(uid, b, 1, rng.int(0, 4)));
        } else if (op === 1 && items.length) {
          const it = rng.pick(items);
          for (const slot of ['body', 'mainHand', 'offHand'] as const)
            if (equip(run, it.uid, slot).ok) break;
        } else if (op === 2) {
          unequip(run, rng.pick(['body', 'mainHand', 'offHand'] as const));
        } else if (op === 3 && items.length) {
          discard(run, rng.pick(items).uid);
        } else if (op === 4 && items.length) {
          salvage(run, rng.pick(items).uid);
        } else if (op === 5) {
          const gem = run.inventory.find((x) => x.kind === 'gem');
          const slot = rng.pick(['body', 'mainHand', 'offHand'] as const);
          if (gem && run.build.equipment[slot]) socketGem(run, slot, 0, gem.uid);
        }
        expect(allGems(run).stranded, `seed ${seed} step ${step}`).toEqual([]);
        expect(total(run), `seed ${seed} step ${step}`).toEqual(before);
      }
    }
  });
});
