import { describe, expect, it } from 'vitest';
import { makeGem } from '../gen/items';
import { heldIds } from './codex';
import { newRun } from './run';

describe('codex', () => {
  it('lists the gems socketed or in the bag and the uniques worn or carried', () => {
    const run = newRun('mystic', 1);
    const uid = () => run.nextUid++;
    run.inventory.push(makeGem(uid, 'flameBolt'));
    const body = run.build.equipment.body;
    if (body) body.sockets = [makeGem(uid, 'frostLance'), ...body.sockets.slice(1)];
    const ids = heldIds(run);
    expect(ids).toContain('flameBolt');
    if (body) expect(ids).toContain('frostLance');
  });
});
