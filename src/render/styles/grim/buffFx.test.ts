import { describe, expect, it } from 'vitest';
import { BUFF_IDS } from '../../../data/buffs';
import type { Actor } from '../../../sim/types';
import { BUFF_LOOK, drawBuffs, type BuffMark } from './buffFx';
import type { FxHost } from './skillFx';

/** A graphics object that accepts every call and counts them. */
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

const player = { x: 5, y: 5, facing: 0.7 } as Actor;
const drawn = (marks: BuffMark[], time: number): number => {
  const air = gfx();
  const ground = gfx();
  drawBuffs(air as never, ground as never, host, player, marks, time);
  return air.calls.n + ground.calls.n;
};
const marks = (ids: readonly string[]): BuffMark[] =>
  ids.map((id) => ({ id: id as BuffMark['id'], alpha: 1 }));

const dist = (a: number, b: number): number =>
  Math.hypot((a >> 16) - (b >> 16), ((a >> 8) & 255) - ((b >> 8) & 255), (a & 255) - (b & 255));

describe('a buff that is up shows on the character', () => {
  it('every buff has a look', () => {
    for (const id of BUFF_IDS) expect(BUFF_LOOK[id], id).toBeDefined();
    expect(Object.keys(BUFF_LOOK).length).toBe(BUFF_IDS.length);
  });

  it('buffs of one kind are told apart by colour', () => {
    for (let i = 0; i < BUFF_IDS.length; i++)
      for (let j = i + 1; j < BUFF_IDS.length; j++) {
        const a = BUFF_LOOK[BUFF_IDS[i]];
        const b = BUFF_LOOK[BUFF_IDS[j]];
        if (a.motif === b.motif)
          expect(dist(a.color, b.color), `${BUFF_IDS[i]} and ${BUFF_IDS[j]}`).toBeGreaterThan(85);
      }
  });

  it('every look draws something, at every moment of its cycle', () => {
    for (const id of BUFF_IDS)
      for (const time of [0, 0.37, 1.9, 7.3])
        expect(drawn(marks([id]), time), `${id} at ${time}`).toBeGreaterThan(0);
  });

  it('buffs that are up together are drawn as one: more of a kind share a place, and all together draw without trouble', () => {
    const plates = BUFF_IDS.filter((id) => BUFF_LOOK[id].motif === 'plates');
    expect(plates.length).toBeGreaterThan(2);
    expect(drawn(marks(plates), 1)).toBeGreaterThan(drawn(marks(plates.slice(0, 1)), 1));
    for (const time of [0, 0.5, 3.1]) expect(drawn(marks(BUFF_IDS), time)).toBeGreaterThan(0);
  });
});
