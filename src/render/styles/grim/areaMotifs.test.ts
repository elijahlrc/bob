import { describe, expect, it } from 'vitest';
import { MOTIFS } from '../../../calc/areaLook';
import { playMotif, type MotifHost } from './areaMotifs';

/** A graphics object that accepts every call (the effects only draw). */
const gfx = (): unknown => {
  const g: unknown = new Proxy(() => g, { get: () => () => g });
  return g;
};
const emitters = new Proxy({}, { get: () => ({ explode: () => undefined }) });

function rig() {
  const queued: { total: number; air: boolean; draw: (g: never, k: number) => void }[] = [];
  const host: MotifHost = {
    host: {
      project: (x, y) => ({ x: x * 16, y: y * 8 }),
      rpx: (r) => r * 22,
      squash: () => 0.5,
      em: emitters as never,
      flash: () => undefined,
      shake: () => undefined,
      actorById: () => null,
    },
    add: (total, air, draw) => queued.push({ total, air, draw: draw as never }),
  };
  return { host, queued };
}

describe('area motifs', () => {
  for (const motif of MOTIFS)
    for (const kind of ['circle', 'strip', 'light'] as const)
      it(`${motif} (${kind}) draws at every moment of its life without error`, () => {
        const { host, queued } = rig();
        playMotif(host, motif, {
          x: 9.5,
          y: 7.5,
          r: kind === 'strip' ? 1.4 : 2.4,
          color: 0xffffff,
          strip: kind === 'strip' ? [6, 6, 12, 9] : undefined,
          light: kind === 'light',
        });
        for (const q of queued) {
          // It ends.
          expect(q.total).toBeGreaterThan(0);
          expect(Number.isFinite(q.total)).toBe(true);
          for (let i = 0; i <= 20; i++) q.draw(gfx() as never, i / 20);
        }
      });
});
