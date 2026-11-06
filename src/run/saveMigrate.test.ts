import { describe, expect, it } from 'vitest';
import { getTree } from '../data/tree';
import type { StopId } from '../data/stops';
import { makeStop, rollOffers } from './offers';
import { newRun, SAVE_VERSION, setMap, TREE_REVISION } from './run';
import { loadRun, migrate, saveRun } from './save';
import { waysideOf } from './wayside';

describe('migrating a save of the passive tree before the district layout (docs/TREE-REDESIGN.md)', () => {
  it('keeps the run and hands the allocated passives back, since their node ids mean other nodes now', () => {
    const run = newRun('vanguard', 1);
    const start = getTree().starts[run.classId];
    run.build.allocated = getTree().nodes[start].links.slice(0, 1);
    run.version = 10;
    const out = migrate(10, run);
    expect(out).not.toBeNull();
    expect(out!.version).toBe(SAVE_VERSION);
    expect(out!.build.allocated).toEqual([]);
    expect(out!.classId).toBe('vanguard');
  });

  it('hands them back from a save of the tree before iterations 3 to 8 too', () => {
    for (const v of [11, 12, 13, 14, 15, 16, 17]) {
      const run = newRun('mystic', 1);
      run.build.allocated = getTree().nodes[getTree().starts[run.classId]].links.slice(0, 1);
      run.version = v;
      const out = migrate(v, run);
      expect(out!.version).toBe(SAVE_VERSION);
      expect(out!.build.allocated).toEqual([]);
    }
  });

  it('hands them back from a save of the generated tree, before the hand-written one, or of it before its growth (docs/PASSIVE-TREE.md)', () => {
    for (const v of [18, 19, 20]) {
      const run = newRun('zealot', 1);
      run.build.allocated = getTree().nodes[getTree().starts[run.classId]].links.slice(0, 2);
      run.bonusPoints = 1;
      run.version = v;
      const out = migrate(v, run);
      expect(out!.version).toBe(SAVE_VERSION);
      expect(out!.build.allocated).toEqual([]);
      expect(out!.bonusPoints).toBe(1);
    }
  });
});

describe('the Wayside state (docs/WAYSIDE.md)', () => {
  it('a save of version 18 loads, and its Wayside state is filled in with defaults on first use', () => {
    const run = newRun('vanguard', 1);
    delete run.wayside;
    run.version = 18;
    const out = migrate(18, run);
    expect(out!.version).toBe(SAVE_VERSION);
    const w = waysideOf(out!);
    expect(w.armed).toEqual([]);
    expect(w.pouch).toEqual({});
    expect(out!.wayside).toBe(w);
  });

  it('a run saved while a reprieve had a slot of its own carries it in the pouch now', () => {
    const run = newRun('vanguard', 1);
    run.wayside = { pouch: { wardOil: 1 }, reprieve: 'lastSpark', reprieves: 2 } as never;
    const w = waysideOf(run);
    expect(w.pouch).toEqual({ wardOil: 1, lastSpark: 1 });
    expect('reprieve' in w).toBe(false);
    // Reading it again changes nothing.
    expect(waysideOf(run).pouch).toEqual({ wardOil: 1, lastSpark: 1 });
  });

  it('a state missing a field gets that field filled in without losing the others', () => {
    const run = newRun('vanguard', 1);
    run.wayside = { pouch: { whettedPowder: 2 } } as never;
    const w = waysideOf(run);
    expect(w.pouch).toEqual({ whettedPowder: 2 });
    expect(w.curses).toEqual([]);
    expect(w.seen).toEqual({});
  });
});

describe('a stop cut from the game (the Awlsmith, 2026-11-05)', () => {
  it('a save offering one loads with its level offered as it would be now', () => {
    const run = newRun('vanguard', 7);
    setMap(run, 12);
    const now = JSON.stringify(rollOffers(run.seed, run.map));
    // As a save from before the cut may hold it: a stop the game no longer knows in the second slot, with a visit open.
    run.offers[1] = { ...makeStop(run.map, 1, 'gemHoard'), stop: 'awlsmith' as StopId };
    waysideOf(run).stopVisit = { slot: 1 };
    const store = new Map<string, string>();
    saveRun(
      {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => void store.set(k, v),
        removeItem: (k) => void store.delete(k),
      },
      run,
    );
    const loaded = loadRun({
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
      removeItem: (k) => void store.delete(k),
    });
    expect(loaded.status).toBe('ok');
    const out = (loaded as { run: typeof run }).run;
    expect(out.offers.some((o) => (o.stop as string) === 'awlsmith')).toBe(false);
    expect(JSON.stringify(out.offers)).toBe(now);
    expect(waysideOf(out).stopVisit).toBeNull();
  });
});

describe('a run in progress on an older tree revision (2026-11-05)', () => {
  const store = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };
  };

  it('gets its passives back when it loads, once, and keeps the save version', () => {
    const run = newRun('mystic', 3);
    run.build.allocated = getTree().nodes[getTree().starts[run.classId]].links.slice(0, 2);
    delete run.treeRevision;
    const s = store();
    saveRun(s, run);
    const first = loadRun(s);
    if (first.status !== 'ok') throw new Error(first.status);
    expect(first.run.build.allocated).toEqual([]);
    expect(first.run.treeRevision).toBe(TREE_REVISION);
    expect(first.run.version).toBe(SAVE_VERSION);
    // Spent again on the current tree, the passives stay through the next load.
    first.run.build.allocated = getTree().nodes[getTree().starts[run.classId]].links.slice(0, 1);
    saveRun(s, first.run);
    const second = loadRun(s);
    if (second.status !== 'ok') throw new Error(second.status);
    expect(second.run.build.allocated).toHaveLength(1);
  });

  it('a new run is on the current revision', () => {
    expect(newRun('zealot', 1).treeRevision).toBe(TREE_REVISION);
  });
});
