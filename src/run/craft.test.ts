import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { family } from '../data/affixes';
import { itemBase } from '../data/bases';
import { tabletsNeeded } from '../data/currency';
import type { Item } from '../data/types';
import { uniqueDef } from '../data/uniques';
import { makeGem, makeItem } from '../gen/items';
import { rollItemOf, rollUnique } from '../gen/loot';
import { chalkAdd, chalkOptions, chalkRemove } from './craft';
import {
  addableFamilies,
  benchAdd,
  benchRemove,
  benchRemoveBench,
  benchSockets,
  completeTabletSets,
  drawReforge,
  locate,
  pickReforge,
  polishedRoll,
  redeemTablets,
  reforgeCost,
  salvage,
  salvageValue,
  socketCost,
  useAuger,
  useDie,
  usePearl,
  useSeal,
  useThread,
  useWhetstone,
  useEssence,
} from './craft';
import { Controller } from './controller';
import { loadRun, MemoryStore, SAVE_KEY, saveRun } from './save';
import { newRun, SAVE_VERSION, stash, type RunState, setMap } from './run';

let n = 90000;
const uid = () => n++;

/** A run holding a rare body armour (in the inventory), with a pouch of everything. */
function setup(over: { map?: number; rarity?: 'normal' | 'magic' | 'rare'; base?: string } = {}) {
  const run = newRun('vanguard', 11);
  setMap(run, over.map ?? 60);
  run.build.level = 60;
  const base = itemBase(over.base ?? 'body_ar_3');
  const item = rollItemOf(new Rng(5), uid, base, 70, over.rarity ?? 'rare');
  run.inventory.push(item);
  for (const id of ['ember', 'pearl', 'thread', 'whetstone', 'auger', 'die', 'seal', 'chalk'])
    run.currency[id] = 50;
  run.dust = 1000;
  return { run, item };
}

const get = (run: RunState, it: Item) => locate(run, it.uid)!.item;
/** JSON without uids, to compare things made in two separate runs. */
const shape = (x: unknown) => JSON.stringify(x).replace(/"(uid|itemUid)":\d+/g, '');
const fams = (it: Item) => it.affixes.map((a) => a.family);

describe('Marrow Pearl: add the family you choose', () => {
  it('adds exactly that family, rolls only its tier and value, and costs one pearl', () => {
    const { run, item } = setup();
    const f = addableFamilies(item).find((x) => !fams(item).includes(x.id))!;
    const before = item.affixes.length;
    expect(usePearl(run, item.uid, f.id).ok).toBe(true);
    const now = get(run, item);
    expect(now.affixes).toHaveLength(before + 1);
    expect(fams(now)).toContain(f.id);
    expect(run.currency.pearl).toBe(49);
    const roll = now.affixes.find((a) => a.family === f.id)!;
    const tier = f.tiers.find((t) => t.tier === roll.tier)!;
    expect(tier.minIlvl).toBeLessThanOrEqual(item.ilvl);
    roll.mods.forEach((m, i) => {
      expect(m.value).toBeGreaterThanOrEqual(tier.ranges[i][0]);
      expect(m.value).toBeLessThanOrEqual(tier.ranges[i][1]);
    });
  });

  it('refuses families that are not offered, a full item, uniques and sealed items', () => {
    const { run, item } = setup();
    expect(usePearl(run, item.uid, fams(item)[0]).ok).toBe(false); // already there
    expect(usePearl(run, item.uid, 'nonsense').ok).toBe(false);
    const full = { ...item, affixes: item.affixes };
    let guard = 0;
    while (addableFamilies(get(run, full)).length > 0 && guard++ < 8)
      usePearl(run, item.uid, addableFamilies(get(run, full))[0].id);
    expect(get(run, item).affixes).toHaveLength(6);
    expect(addableFamilies(get(run, item))).toHaveLength(0);
    const u = rollUnique(new Rng(1), uid, uniqueDef('gravehammer'), 60);
    expect(addableFamilies(u)).toHaveLength(0);
  });

  it('is deterministic: the same run and craft number give the same result', () => {
    const a = setup();
    const b = setup();
    const f = addableFamilies(a.item).find((x) => !fams(a.item).includes(x.id))!;
    usePearl(a.run, a.item.uid, f.id);
    usePearl(b.run, b.item.uid, f.id);
    expect(shape(get(a.run, a.item))).toBe(shape(get(b.run, b.item)));
    expect(a.run.craftSeq).toBe(1);
  });

  it('a normal item becomes magic, and a magic item with two affixes becomes rare', () => {
    const { run, item } = setup({ rarity: 'normal', base: 'helmet_ar_3' });
    const pick = () => addableFamilies(get(run, item))[0].id;
    usePearl(run, item.uid, pick());
    expect(get(run, item).rarity).toBe('magic');
    usePearl(run, item.uid, pick());
    expect(get(run, item).rarity).toBe('magic');
    expect(get(run, item).affixes).toHaveLength(2);
    usePearl(run, item.uid, pick());
    expect(get(run, item).rarity).toBe('rare');
    expect(get(run, item).affixes).toHaveLength(3);
  });

  it('fails without a pearl', () => {
    const { run, item } = setup();
    run.currency.pearl = 0;
    const f = addableFamilies(item)[0];
    expect(usePearl(run, item.uid, f.id).ok).toBe(false);
  });
});

describe('Unravelling Thread and Whetstone: remove or polish the affix you choose', () => {
  it('Thread removes exactly the chosen affix', () => {
    const { run, item } = setup();
    const target = item.affixes[1].family;
    expect(useThread(run, item.uid, target).ok).toBe(true);
    const now = get(run, item);
    expect(fams(now)).not.toContain(target);
    expect(fams(now)).toEqual(fams(item).filter((f) => f !== target));
    expect(run.currency.thread).toBe(49);
    expect(useThread(run, item.uid, target).ok).toBe(false);
  });

  it('Whetstone raises the affix to its tier maximum, twice at most', () => {
    const { run, item } = setup();
    const [a, b, c] = fams(item);
    expect(useWhetstone(run, item.uid, a).ok).toBe(true);
    const now = get(run, item);
    const roll = now.affixes.find((x) => x.family === a)!;
    const tier = family(a).tiers.find((t) => t.tier === roll.tier)!;
    roll.mods.forEach((m, i) => expect(m.value).toBe(tier.ranges[i][1]));
    expect(roll).toEqual(polishedRoll(item.affixes.find((x) => x.family === a)!));
    expect(useWhetstone(run, item.uid, a).ok).toBe(false); // already polished
    expect(useWhetstone(run, item.uid, b).ok).toBe(true);
    expect(useWhetstone(run, item.uid, c).ok).toBe(false); // the limit is two
    expect(get(run, item).polished).toEqual([a, b]);
    // Removing a polished affix frees the slot.
    useThread(run, item.uid, a);
    expect(useWhetstone(run, item.uid, c).ok).toBe(true);
  });
});

describe('Socket Auger: set the socket count', () => {
  it('the first three sockets are free; the 4th, 5th and 6th cost 1, 2 and 3', () => {
    expect([socketCost(0, 3), socketCost(3, 4), socketCost(4, 6), socketCost(2, 6)]).toEqual([
      0, 1, 5, 6,
    ]);
    const { run, item } = setup();
    item.sockets = [null, null];
    run.currency.auger = 6;
    const have = item.sockets.length;
    expect(useAuger(run, item.uid, 6).ok).toBe(true);
    expect(get(run, item).sockets).toHaveLength(6);
    expect(run.currency.auger ?? 0).toBe(6 - socketCost(have, 6));
  });

  it('going down is free and returns the gems to the inventory', () => {
    const { run, item } = setup();
    item.sockets = [null, null];
    useAuger(run, item.uid, 6);
    const it = get(run, item);
    it.sockets[5] = makeGem(uid, 'frostLance');
    const before = run.currency.auger;
    expect(useAuger(run, item.uid, 3).ok).toBe(true);
    expect(get(run, item).sockets).toHaveLength(3);
    expect(run.currency.auger).toBe(before);
    expect(run.inventory.some((x) => x.kind === 'gem' && x.gemId === 'frostLance')).toBe(true);
  });

  it('respects the cap of the base, fixed-socket uniques and the pouch', () => {
    const { run, item } = setup({ base: 'ring_all' });
    expect(useAuger(run, item.uid, 1).ok).toBe(false); // rings have no sockets
    const heart = rollUnique(new Rng(2), uid, uniqueDef('walledHeart'), 60);
    run.inventory.push(heart);
    expect(useAuger(run, heart.uid, 3).ok).toBe(false); // keeps its sockets
    const body = setup();
    body.run.currency.auger = 0;
    expect(useAuger(body.run, body.item.uid, 6).ok).toBe(false);
  });
});

describe('Reforging Ember: pin, draw three, pick one', () => {
  it('the price is one ember plus one for each pinned affix', () => {
    expect([0, 1, 3].map(reforgeCost)).toEqual([1, 2, 4]);
    const { run, item } = setup();
    const pins = fams(item).slice(0, 2);
    expect(drawReforge(run, item.uid, pins).ok).toBe(true);
    expect(run.currency.ember).toBe(50 - 3);
  });

  it('draws three alternatives that keep every pinned affix, and holds them until a pick', () => {
    const { run, item } = setup();
    const pins = fams(item).slice(0, 2);
    drawReforge(run, item.uid, pins);
    const p = run.pendingCraft!;
    expect(p.options).toHaveLength(3);
    for (const opt of p.options) {
      for (const f of pins) expect(fams(opt)).toContain(f);
      expect(opt.affixes).toHaveLength(item.affixes.length);
      expect(new Set(fams(opt)).size).toBe(opt.affixes.length);
    }
    // The pinned affixes keep their exact rolls.
    for (const f of pins)
      expect(p.options[0].affixes.find((a) => a.family === f)).toEqual(
        item.affixes.find((a) => a.family === f),
      );
    // Another craft is refused while a pick is open.
    expect(drawReforge(run, item.uid, []).ok).toBe(false);
    // The item is unchanged until the pick.
    expect(get(run, item).affixes).toEqual(item.affixes);
  });

  it('picking an option replaces the affixes; keeping the original costs the same embers', () => {
    const { run, item } = setup();
    drawReforge(run, item.uid, [fams(item)[0]]);
    const opt = run.pendingCraft!.options[1];
    expect(pickReforge(run, 1).ok).toBe(true);
    expect(get(run, item).affixes).toEqual(opt.affixes);
    expect(run.pendingCraft).toBeNull();
    const spent = 50 - run.currency.ember;
    const second = setup();
    drawReforge(second.run, second.item.uid, [fams(second.item)[0]]);
    expect(pickReforge(second.run, null).ok).toBe(true);
    expect(get(second.run, second.item).affixes).toEqual(second.item.affixes);
    expect(50 - second.run.currency.ember).toBe(spent);
  });

  it('is deterministic, and a reloaded save shows the same open pick', () => {
    const a = setup();
    const b = setup();
    drawReforge(a.run, a.item.uid, [fams(a.item)[0]]);
    drawReforge(b.run, b.item.uid, [fams(b.item)[0]]);
    expect(shape(a.run.pendingCraft)).toBe(shape(b.run.pendingCraft));
    const store = new MemoryStore();
    saveRun(store, a.run);
    const loaded = loadRun(store);
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') {
      expect(loaded.run.pendingCraft).toEqual(a.run.pendingCraft);
      expect(loaded.run.craftSeq).toBe(a.run.craftSeq);
    }
  });

  it('refuses non-rare items, pins the item lacks, and pinning everything', () => {
    const { run, item } = setup();
    expect(drawReforge(run, item.uid, ['nonsense']).ok).toBe(false);
    expect(drawReforge(run, item.uid, fams(item)).ok).toBe(false);
    const magic = setup({ rarity: 'magic' });
    expect(drawReforge(magic.run, magic.item.uid, []).ok).toBe(false);
    expect(pickReforge(run, 0).ok).toBe(false);
  });
});

describe('the two gambles: Knucklebone Die and Rot Seal', () => {
  it('the die gives magic 60%, rare 30% and a unique of the base 10% (±2 points over 10,000)', () => {
    const { run } = setup();
    run.currency.die = 1e9;
    const counts = { magic: 0, rare: 0, unique: 0, normal: 0 };
    const N = 10000;
    for (let i = 0; i < N; i++) {
      const it = makeItem(uid, 'mace2_3', 60);
      run.inventory.push(it);
      run.craftSeq = i;
      expect(useDie(run, it.uid).ok).toBe(true);
      counts[get(run, it).rarity]++;
      run.inventory.pop();
    }
    expect(counts.normal).toBe(0);
    expect(Math.abs(counts.magic / N - 0.6)).toBeLessThan(0.02);
    expect(Math.abs(counts.rare / N - 0.3)).toBeLessThan(0.02);
    expect(Math.abs(counts.unique / N - 0.1)).toBeLessThan(0.02);
  });

  it('the die works only on normal items, keeps the item and its gems, and a unique is of its base', () => {
    const { run, item } = setup();
    expect(useDie(run, item.uid).ok).toBe(false);
    const w = makeItem(uid, 'mace2_3', 60, 2);
    w.sockets = [makeGem(uid, 'crushingBlow'), null];
    run.inventory.push(w);
    for (let i = 0; i < 60; i++) {
      run.craftSeq = i;
      const t = { ...w };
      run.inventory[run.inventory.length - 1] = t;
      useDie(run, w.uid);
      const now = get(run, w);
      expect(now.uid).toBe(w.uid);
      expect(now.baseId).toBe('mace2_3');
      expect(now.sockets.filter(Boolean).some((g) => g!.gemId === 'crushingBlow')).toBe(true);
      if (now.uniqueId) expect(uniqueDef(now.uniqueId).baseId).toBe('mace2_3');
    }
  });

  it('the seal: 25% each of an implicit, new sockets, a new rare, or nothing (±2 points over 10,000)', () => {
    const { run } = setup();
    run.currency.seal = 1e9;
    let implicit = 0;
    let sockets = 0;
    let rare = 0;
    let nothing = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) {
      const it = rollItemOf(new Rng(i + 1), uid, itemBase('body_ar_3'), 70, 'rare');
      it.sockets = [null, null, null, null, null, null].slice(0, 3);
      run.inventory.push(it);
      run.craftSeq = i;
      expect(useSeal(run, it.uid).ok).toBe(true);
      const now = get(run, it);
      expect(now.sealed).toBe(true);
      if (now.implicits.length > it.implicits.length) implicit++;
      else if (JSON.stringify(now.affixes) !== JSON.stringify(it.affixes)) rare++;
      else if (now.sockets.length !== it.sockets.length) sockets++;
      else nothing++;
      run.inventory.pop();
    }
    // A socket reroll can land on the same count, and a new rare could repeat itself; both are rare.
    for (const [name, v] of [
      ['implicit', implicit],
      ['rare', rare],
    ] as const)
      expect(Math.abs(v / N - 0.25), name).toBeLessThan(0.02);
    expect((sockets + nothing) / N).toBeGreaterThan(0.46);
    expect((sockets + nothing) / N).toBeLessThan(0.54);
  });

  it('a sealed item can never be changed again', () => {
    const { run, item } = setup();
    expect(useSeal(run, item.uid).ok).toBe(true);
    expect(useSeal(run, item.uid).ok).toBe(false);
    expect(useThread(run, item.uid, fams(item)[0]).ok).toBe(false);
    expect(useWhetstone(run, item.uid, fams(item)[0]).ok).toBe(false);
    expect(drawReforge(run, item.uid, []).ok).toBe(false);
    expect(useAuger(run, item.uid, 3).ok).toBe(false);
    expect(addableFamilies(get(run, item))).toHaveLength(0);
    expect(benchRemove(run, item.uid, fams(item)[0]).ok).toBe(false);
  });
});

describe('essences', () => {
  it('add the family you choose from the essence list, and nothing else changes', () => {
    const { run, item } = setup({ base: 'sword_3' });
    item.affixes = item.affixes.slice(0, 2); // leave room
    // Chitin offers attack speed, life on hit or area of effect.
    run.currency.chitin = 2;
    const free = ['aspdGlobal', 'aspdLocal', 'lifeOnHit', 'areaEffect'].filter((f) =>
      addableFamilies(item).some((x) => x.id === f),
    );
    expect(free.length).toBeGreaterThan(0);
    const before = fams(item);
    expect(useEssence(run, item.uid, 'chitin', free[0]).ok).toBe(true);
    expect(fams(get(run, item))).toEqual([...before, free[0]]);
    expect(run.currency.chitin).toBe(1);
    expect(useEssence(run, item.uid, 'chitin', 'fireRes').ok).toBe(false); // not on its list
  });

  it('replace an affix of the same kind when the slots are full', () => {
    const { run, item } = setup({ base: 'mace2_3' });
    item.affixes = item.affixes.filter((x) => x.family !== 'physLocal');
    // Fill every free slot, but never with the family the essence will bring.
    let guard = 0;
    for (;;) {
      const next = addableFamilies(get(run, item)).find((x) => x.id !== 'physLocal');
      if (!next || guard++ > 8) break;
      usePearl(run, item.uid, next.id);
    }
    const full = get(run, item);
    const prefixes = full.affixes.filter((x) => family(x.family).type === 'prefix');
    expect(prefixes).toHaveLength(3);
    run.currency.reliquarySlag = 1;
    const victim = prefixes[0].family;
    expect(useEssence(run, item.uid, 'reliquarySlag', 'physLocal').ok).toBe(false);
    expect(useEssence(run, item.uid, 'reliquarySlag', 'physLocal', 'life').ok).toBe(false); // wrong kind
    expect(useEssence(run, item.uid, 'reliquarySlag', 'physLocal', victim).ok).toBe(true);
    expect(fams(get(run, item))).toContain('physLocal');
    expect(fams(get(run, item))).not.toContain(victim);
    expect(get(run, item).affixes).toHaveLength(full.affixes.length);
  });
});

describe('the Workbench: Bone Dust', () => {
  it('salvages carried items by rarity and item level, never worn ones', () => {
    const { run, item } = setup();
    const v = salvageValue(item);
    expect(v).toBe(Math.round(5 * (1 + item.ilvl / 50)));
    expect(salvage(run, item.uid).ok).toBe(true);
    expect(run.dust).toBe(1000 + v);
    expect(run.inventory.some((x) => x.uid === item.uid)).toBe(false);
    const g = makeGem(uid, 'frostLance');
    expect(salvageValue(g)).toBe(4);
    run.build.equipment.helmet = makeItem(uid, 'helmet_ar_3', 60);
    expect(salvage(run, run.build.equipment.helmet.uid).ok).toBe(false);
  });

  it('recipes unlock by map, one bench affix per item, and it can be removed for free', () => {
    const early = setup({ map: 5 });
    expect(benchAdd(early.run, early.item.uid, 'life').ok).toBe(false);
    const { run, item } = setup({ map: 30, base: 'helmet_ar_3' });
    // A rare with room, and none of the families the recipes add.
    item.affixes = item.affixes
      .filter((x) => !['life', 'fireRes', 'coldRes', 'lightRes', 'chaosRes'].includes(x.family))
      .slice(0, 2);
    const dust = run.dust;
    expect(benchAdd(run, item.uid, 'life').ok).toBe(true);
    expect(run.dust).toBe(dust - 20);
    const now = get(run, item);
    const bench = now.affixes.find((a) => a.bench)!;
    expect(bench.family).toBe('life');
    expect(bench.tier).toBeLessThanOrEqual(3);
    expect(benchAdd(run, item.uid, 'fireRes').ok).toBe(false); // one per item
    const before = run.dust;
    expect(benchRemoveBench(run, item.uid).ok).toBe(true);
    expect(run.dust).toBe(before);
    expect(get(run, item).affixes.some((a) => a.bench)).toBe(false);
    expect(benchAdd(run, item.uid, 'chaosRes').ok).toBe(true); // unlocked at 25
  });

  it('removes a chosen affix for 25 Dust, and sockets cost 40, 120 and 300', () => {
    const { run, item } = setup({ map: 70 });
    const before = run.dust;
    expect(benchRemove(run, item.uid, fams(item)[0]).ok).toBe(true);
    expect(run.dust).toBe(before - 25);
    const w = setup({ map: 70, base: 'body_ar_3' });
    w.item.sockets = [null, null];
    w.run.dust = 1000;
    const have = w.item.sockets.length;
    expect(benchSockets(w.run, w.item.uid, 6).ok).toBe(true);
    const owed = [4, 5, 6]
      .filter((k) => k > have)
      .reduce((s, k) => s + { 4: 40, 5: 120, 6: 300 }[k]!, 0);
    expect(1000 - w.run.dust).toBe(owed);
    const poor = setup({ map: 30 });
    expect(benchSockets(poor.run, poor.item.uid, 6).ok).toBe(false); // the 5th and 6th are locked
  });
});

describe("tablets and Wayfinder's Chalk", () => {
  it('a complete set is exchanged for the unique', () => {
    const { run } = setup();
    const id = 'unblinkingLongbow';
    expect(tabletsNeeded(id)).toBe(4);
    stash(run, { kind: 'currency', uid: 1, id: `tablet:${id}`, count: 3 });
    expect(completeTabletSets(run)).toEqual([]);
    expect(redeemTablets(run, id).ok).toBe(false);
    stash(run, { kind: 'currency', uid: 2, id: `tablet:${id}`, count: 2 });
    expect(completeTabletSets(run)).toEqual([id]);
    expect(redeemTablets(run, id).ok).toBe(true);
    expect(run.tablets[id]).toBe(1);
    const got = run.inventory.find((x) => x.kind === 'item' && x.uniqueId === id);
    expect(got).toBeDefined();
    expect(run.newLoot).toContain(got!.uid);
  });

  it('chalk offers three affixes that stay until the next craft; adding costs one, removing two', () => {
    const { run } = setup({ map: 50 });
    const opts = chalkOptions(run, 0);
    expect(opts).toHaveLength(3);
    expect(chalkOptions(run, 0)).toEqual(opts);
    expect(chalkAdd(run, 0, 'nonsense').ok).toBe(false);
    expect(chalkAdd(run, 0, opts[0]).ok).toBe(true);
    expect(run.currency.chalk).toBe(49);
    expect(run.offers[0].affixes).toContain(opts[0]);
    expect(chalkOptions(run, 0)).not.toEqual(opts); // a craft happened
    const have = run.offers[0].affixes;
    expect(chalkRemove(run, 0, have[0]).ok).toBe(true);
    expect(run.currency.chalk).toBe(47);
    expect(run.offers[0].affixes).not.toContain(have[0]);
    expect(chalkRemove(run, 0, 'nonsense').ok).toBe(false);
  });
});

describe('crafting is final (EXPANSION 8.4)', () => {
  it('a craft clears the undo history', () => {
    const c = new Controller(null);
    c.run = newRun('vanguard', 3);
    // Make an undoable change first.
    c.act((r) => {
      r.refundPoints += 1;
    });
    expect(c.canUndo).toBe(true);
    c.craft((r) => {
      r.dust += 5;
    });
    expect(c.canUndo).toBe(false);
  });

  it('saves from before the currency fields are rejected, not migrated', () => {
    const store = new MemoryStore();
    const run = newRun('vanguard', 1);
    store.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION - 1, run }));
    expect(loadRun(store).status).toBe('incompatible');
    saveRun(store, run);
    expect(loadRun(store).status).toBe('ok');
  });
});
