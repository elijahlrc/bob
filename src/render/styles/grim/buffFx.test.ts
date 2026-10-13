import { describe, expect, it } from 'vitest';
import { BUFF_IDS } from '../../../data/buffs';
import type { Actor } from '../../../sim/types';
import { BUFF_LOOK, drawBuff } from './buffFx';
import type { FxHost } from './skillFx';

/** A graphics object that accepts every call and counts the strokes. */
function gfx() {
  const calls = { n: 0 };
  const g: unknown = new Proxy(() => g, {
    get: (_t, k) => (k === 'calls' ? calls : () => ((calls.n += 1), g)),
  });
  return g as { calls: { n: number } };
}

const host = {
  project: (x: number, y: number) => ({ x, y }),
  rpx: (r: number) => r * 10,
  squash: () => 0.5,
} as unknown as FxHost;

describe('a buff that is up shows on the character', () => {
  it('every buff has a look of its own kind and colour', () => {
    for (const id of BUFF_IDS) expect(BUFF_LOOK[id], id).toBeDefined();
    expect(Object.keys(BUFF_LOOK).length).toBe(BUFF_IDS.length);
  });

  it('every look draws something, at every moment of its cycle', () => {
    const p = { x: 5, y: 5, facing: 0.7 } as Actor;
    for (const id of BUFF_IDS)
      for (const time of [0, 0.37, 1.9, 7.3]) {
        const air = gfx();
        const ground = gfx();
        drawBuff(air as never, ground as never, host, p, BUFF_LOOK[id], time, 1, 1);
        expect(air.calls.n + ground.calls.n, `${id} at ${time}`).toBeGreaterThan(0);
      }
  });
});
