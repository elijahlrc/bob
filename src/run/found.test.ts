import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { ITEM_BASES } from '../data/bases';
import type { GemItem, InventoryItem } from '../data/types';
import { rollFlask, rollItemOf } from '../gen/loot';
import { Controller } from './controller';
import { applyClean, cleanSummary } from './cleanUp';
import {
  ageOf,
  DEFAULT_CLEAN,
  isFavourite,
  markSeen,
  noteFound,
  oldItems,
  pruneFound,
  toggleFavourite,
  unseenItems,
  unseenRares,
  type CleanOpts,
} from './found';
import { equip, unequip } from './inventory';
import { junkItems } from './inventoryOps';
import { finishMap, newRun, setMap, takeReward, uidSource, type RunState } from './run';
import { loadRun, MemoryStore, SAVE_KEY, saveRun } from './save';
import { fullVitals } from '../sim/types';
import type { MapResult } from '../sim/runMap';

const cleared = (level: number, picked: MapResult['picked'] = []): MapResult => ({
  status: 'cleared',
  areaLevel: level,
  time: 90,
  ticks: 5400,
  level,
  xp: 0,
  xpGained: 100,
  kills: 10,
  stuck: 0,
  picked,
  eventHash: 0,
  lifeFrac: 1,
  vitals: fullVitals(),
});

/** A run at a given level with items found on levels given as ages: `found(run, 'magic', 12)` was found 12 levels ago. */
function found(
  run: RunState,
  kind: 'normal' | 'magic' | 'rare' | 'unique' | 'gem' | 'flask',
  ago: number,
) {
  const rng = new Rng(run.nextUid * 31 + 7);
  const uid = uidSource(run);
  let it: InventoryItem;
  if (kind === 'gem') it = { kind: 'gem', uid: uid(), gemId: 'crushingBlow' } as GemItem;
  else if (kind === 'flask') it = rollFlask(rng, uid, 10, 0);
  else {
    const base = ITEM_BASES.find((b) => b.level <= 5 && !b.id.startsWith('quiver'))!;
    it = rollItemOf(rng, uid, base, 10, kind === 'unique' ? 'rare' : kind);
    if (kind === 'unique') (it as { rarity: string }).rarity = 'unique';
  }
  run.inventory.push(it);
  noteFound(run, it);
  run.acquired[it.uid] = run.map - ago;
  return it;
}

const seeAll = (run: RunState) => markSeen(run, 'all');

describe('finding things', () => {
  it('lists every kind of pickup as unseen, with the level it was found on', () => {
    const run = newRun('vanguard', 3);
    run.map = 7;
    const gem = { kind: 'gem' as const, uid: 801, gemId: 'crushingBlow' };
    const flask = rollFlask(new Rng(1), uidSource(run), 5, 0);
    const pot = { kind: 'currency' as const, uid: 803, id: 'ember', count: 2 };
    finishMap(run, cleared(7, [gem, flask, pot]));
    expect(run.unseen).toEqual([801, flask.uid]);
    expect(run.acquired[801]).toBe(7);
    expect(run.acquired[flask.uid]).toBe(7);
    expect(run.acquired[803]).toBeUndefined();
    expect(unseenItems(run).map((x) => x.uid)).toEqual([801, flask.uid]);
  });

  it('a picked reward is unseen too, and a skipped one is not', () => {
    const run = newRun('mystic', 4);
    run.reward = [
      { kind: 'gem', uid: 901, gemId: 'crushingBlow' },
      { kind: 'gem', uid: 902, gemId: 'crushingBlow' },
    ];
    takeReward(run, 902);
    expect(run.unseen).toEqual([902]);
    run.reward = [{ kind: 'gem', uid: 903, gemId: 'crushingBlow' }];
    takeReward(run, null);
    expect(run.unseen).toEqual([902]);
  });

  it('stays unseen until it is marked seen, not when the camp is left or a map starts', () => {
    const c = new Controller(null);
    c.startRun('vanguard', 5);
    const run = c.run!;
    const it = found(run, 'rare', 0);
    expect(unseenRares(run).map((x) => x.uid)).toEqual([it.uid]);
    expect(c.autoBlocker()).toMatch(/new rare/);
    c.startMap(0);
    expect(run.unseen).toContain(it.uid);
    c.act((r) => markSeen(r, [it.uid]));
    expect(run.unseen).not.toContain(it.uid);
  });

  it('does not pause Auto-continue for unseen normal items or gems', () => {
    const run = newRun('vanguard', 6);
    found(run, 'normal', 0);
    found(run, 'gem', 0);
    expect(unseenRares(run)).toEqual([]);
  });

  it('every item of the starting kit has a level, so nothing is unknown', () => {
    const run = newRun('zealot', 1);
    for (const it of Object.values(run.build.equipment)) expect(run.acquired[it.uid]).toBe(1);
    for (const f of run.build.flasks) if (f) expect(run.acquired[f.uid]).toBe(1);
  });
});

describe('favourites', () => {
  it('toggle, and survive equip and unequip (the uid is the same)', () => {
    const run = newRun('vanguard', 8);
    const it = found(run, 'rare', 0);
    expect(toggleFavourite(run, it.uid)).toBe(true);
    expect(isFavourite(run, it.uid)).toBe(true);
    if (it.kind === 'item') {
      const before = run.inventory.length;
      const r = equip(run, it.uid, 'amulet');
      if (r.ok) {
        expect(run.inventory.length).toBe(before - 1);
        unequip(run, 'amulet');
        expect(isFavourite(run, it.uid)).toBe(true);
      }
    }
    expect(toggleFavourite(run, it.uid)).toBe(false);
    expect(isFavourite(run, it.uid)).toBe(false);
  });

  it('are never junk', () => {
    const run = newRun('vanguard', 9);
    const a = found(run, 'normal', 3);
    seeAll(run);
    const before = junkItems(run).map((x) => x.uid);
    expect(before).toContain(a.uid);
    toggleFavourite(run, a.uid);
    expect(junkItems(run).map((x) => x.uid)).toEqual(before.filter((u) => u !== a.uid));
  });

  it('keep their star when the item is discarded and the discard is undone', () => {
    const c = new Controller(null);
    c.startRun('vanguard', 10);
    const run = c.run!;
    const it = found(run, 'rare', 0);
    c.act((r) => toggleFavourite(r, it.uid));
    c.act((r) => (r.inventory = r.inventory.filter((x) => x.uid !== it.uid)));
    expect(c.undo()).toBe(true);
    expect(c.run!.inventory.some((x) => x.uid === it.uid)).toBe(true);
    expect(isFavourite(c.run!, it.uid)).toBe(true);
  });

  it('are forgotten once the item is gone for good', () => {
    const run = newRun('vanguard', 11);
    const it = found(run, 'rare', 0);
    toggleFavourite(run, it.uid);
    run.inventory = run.inventory.filter((x) => x.uid !== it.uid);
    pruneFound(run);
    expect(run.favourites).toEqual([]);
    expect(run.unseen).toEqual([]);
    expect(run.acquired[it.uid]).toBeUndefined();
  });
});

describe('old items', () => {
  const at = (map: number) => {
    const run = newRun('vanguard', 12);
    run.map = map;
    return run;
  };

  it('are those found MORE than n levels ago: exactly n is kept, n + 1 goes', () => {
    const run = at(30);
    const eleven = found(run, 'magic', 11);
    const ten = found(run, 'magic', 10);
    seeAll(run);
    expect(ageOf(run, ten.uid)).toBe(10);
    const plan = oldItems(run, { ...DEFAULT_CLEAN, olderThan: 10 });
    expect(plan.items.map((x) => x.uid)).toEqual([eleven.uid]);
    expect(plan.kept.young).toBe(1);
  });

  it('skip favourites and (by default) unseen items, and say why', () => {
    const run = at(40);
    const fav = found(run, 'rare', 20);
    const unseen = found(run, 'rare', 20);
    const plain = found(run, 'rare', 20);
    markSeen(run, [fav.uid, plain.uid]);
    toggleFavourite(run, fav.uid);
    const plan = oldItems(run);
    expect(plan.items.map((x) => x.uid)).toEqual([plain.uid]);
    expect(plan.kept).toMatchObject({ favourite: 1, unseen: 1 });
    const all = oldItems(run, { ...DEFAULT_CLEAN, includeUnseen: true });
    expect(all.items.map((x) => x.uid).sort()).toEqual([unseen.uid, plain.uid].sort());
  });

  it('follow the kinds and rarities chosen: uniques and gems are opt-in', () => {
    const run = at(50);
    const normal = found(run, 'normal', 20);
    const rare = found(run, 'rare', 20);
    const unique = found(run, 'unique', 20);
    const gem = found(run, 'gem', 20);
    const flask = found(run, 'flask', 20);
    seeAll(run);
    const uids = (o: CleanOpts) =>
      oldItems(run, o)
        .items.map((x) => x.uid)
        .sort();
    expect(uids(DEFAULT_CLEAN)).toEqual([normal.uid, rare.uid, flask.uid].sort());
    expect(uids({ ...DEFAULT_CLEAN, gems: true })).toContain(gem.uid);
    expect(
      uids({ ...DEFAULT_CLEAN, rarities: { ...DEFAULT_CLEAN.rarities, unique: true } }),
    ).toContain(unique.uid);
    expect(uids({ ...DEFAULT_CLEAN, flasks: false })).not.toContain(flask.uid);
    expect(uids({ ...DEFAULT_CLEAN, items: false })).toEqual([flask.uid]);
  });

  it('never include gear that is worn or gems that are socketed', () => {
    const run = at(60);
    run.build.equipment.mainHand = run.build.equipment.mainHand!;
    setMap(run, 60);
    const worn = Object.values(run.build.equipment).map((x) => x.uid);
    seeAll(run);
    const plan = oldItems(run, {
      ...DEFAULT_CLEAN,
      olderThan: 0,
      gems: true,
      rarities: { normal: true, magic: true, rare: true, unique: true },
    });
    for (const u of worn) expect(plan.items.map((x) => x.uid)).not.toContain(u);
  });

  it('never choose a worn, starred or unseen item for random runs (property)', () => {
    const rng = new Rng(99);
    for (let n = 0; n < 40; n++) {
      const run = at(rng.int(5, 90));
      const kinds = ['normal', 'magic', 'rare', 'unique', 'gem', 'flask'] as const;
      for (let i = rng.int(0, 25); i > 0; i--) found(run, rng.pick([...kinds]), rng.int(0, 40));
      for (const it of run.inventory) {
        if (rng.chance(0.3)) toggleFavourite(run, it.uid);
        if (rng.chance(0.5)) markSeen(run, [it.uid]);
      }
      const opts: CleanOpts = {
        olderThan: rng.int(0, 20),
        items: rng.chance(0.8),
        flasks: rng.chance(0.8),
        gems: rng.chance(0.5),
        rarities: {
          normal: rng.chance(0.8),
          magic: rng.chance(0.8),
          rare: rng.chance(0.8),
          unique: rng.chance(0.5),
        },
        includeUnseen: false,
      };
      const worn = new Set(Object.values(run.build.equipment).map((x) => x.uid));
      for (const it of oldItems(run, opts).items) {
        expect(worn.has(it.uid)).toBe(false);
        expect(isFavourite(run, it.uid)).toBe(false);
        expect(run.unseen.includes(it.uid)).toBe(false);
        expect(ageOf(run, it.uid)).toBeGreaterThan(opts.olderThan);
      }
    }
  });
});

describe('saves', () => {
  it('a version 6 save loads with the new lists, everything found now', () => {
    const store = new MemoryStore();
    const run = newRun('vanguard', 13);
    const gem = { kind: 'gem' as const, uid: 77, gemId: 'crushingBlow' };
    run.inventory.push(gem);
    run.map = 12;
    const old = JSON.parse(JSON.stringify(run)) as Record<string, unknown>;
    delete old.unseen;
    delete old.acquired;
    delete old.favourites;
    old.newLoot = [77];
    old.version = 6;
    store.setItem(SAVE_KEY, JSON.stringify({ version: 6, run: old }));
    const res = loadRun(store);
    expect(res.status).toBe('ok');
    if (res.status !== 'ok') return;
    expect(res.run.version).toBe(7);
    expect(res.run.unseen).toEqual([]);
    expect(res.run.favourites).toEqual([]);
    expect(res.run.acquired[77]).toBe(12);
    expect((res.run as unknown as { newLoot?: unknown }).newLoot).toBeUndefined();
    expect(ageOf(res.run, 77)).toBe(0);
  });

  it('round-trips the lists, and an older save is still rejected', () => {
    const store = new MemoryStore();
    const run = newRun('vanguard', 14);
    const it = found(run, 'rare', 4);
    toggleFavourite(run, it.uid);
    saveRun(store, run);
    const res = loadRun(store);
    expect(res.status).toBe('ok');
    if (res.status === 'ok') {
      expect(res.run.favourites).toEqual([it.uid]);
      expect(res.run.unseen).toEqual([it.uid]);
      expect(res.run.acquired[it.uid]).toBe(run.map - 4);
    }
    store.setItem(SAVE_KEY, JSON.stringify({ version: 5, run }));
    expect(loadRun(store).status).toBe('incompatible');
  });
});

describe('clean up', () => {
  it('lists what it will salvage, and salvaging does exactly that', () => {
    const run = newRun('vanguard', 21);
    run.map = 40;
    const old = [found(run, 'normal', 15), found(run, 'magic', 25), found(run, 'rare', 12)];
    const young = found(run, 'rare', 3);
    const star = found(run, 'rare', 30);
    toggleFavourite(run, star.uid);
    const fresh = found(run, 'magic', 30);
    markSeen(run, [...old.map((x) => x.uid), young.uid, star.uid]);
    const dust0 = run.dust;
    const s = cleanSummary(run, DEFAULT_CLEAN);
    expect(s.rows.map((r) => r.item.uid)).toEqual([old[1].uid, old[0].uid, old[2].uid]); // oldest first
    expect(s.count).toBe(3);
    expect(s.kept).toBe('Kept: 1 favourite, 1 not yet looked at, 1 newer');
    expect(s.headline).toBe(`3 items found more than 10 levels ago, for ${s.dust} Bone Dust`);
    const res = applyClean(run, DEFAULT_CLEAN);
    expect(res).toEqual({ count: 3, dust: s.dust });
    expect(run.dust).toBe(dust0 + s.dust);
    const left = run.inventory.map((x) => x.uid);
    expect(left).toEqual(expect.arrayContaining([young.uid, star.uid, fresh.uid]));
    for (const o of old) expect(left).not.toContain(o.uid);
  });

  it('is a no-op with nothing old, and says so', () => {
    const run = newRun('vanguard', 22);
    found(run, 'rare', 1);
    seeAll(run);
    const s = cleanSummary(run, DEFAULT_CLEAN);
    expect(s.count).toBe(0);
    expect(s.headline).toBe('0 items found more than 10 levels ago, for 0 Bone Dust');
    expect(applyClean(run, DEFAULT_CLEAN)).toEqual({ count: 0, dust: 0 });
  });
});
