import { describe, expect, it } from 'vitest';
import { getTree } from '../data/tree';
import { newRun, SAVE_VERSION } from './run';
import { migrate } from './save';

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

  it('hands them back from a save of the tree before iterations 3 to 6 too', () => {
    for (const v of [11, 12, 13, 14]) {
      const run = newRun('mystic', 1);
      run.build.allocated = getTree().nodes[getTree().starts[run.classId]].links.slice(0, 1);
      run.version = v;
      const out = migrate(v, run);
      expect(out!.version).toBe(SAVE_VERSION);
      expect(out!.build.allocated).toEqual([]);
    }
  });
});
