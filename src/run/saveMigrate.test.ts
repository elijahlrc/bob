import { describe, expect, it } from 'vitest';
import { getTree } from '../data/tree';
import { newRun, SAVE_VERSION } from './run';
import { migrate } from './save';
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
