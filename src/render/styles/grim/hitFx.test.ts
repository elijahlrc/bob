import { describe, expect, it } from 'vitest';
import type { SimEvent } from '../../../sim/types';
import {
  EFFECT_WINDOW,
  HitFx,
  NumberGate,
  numberKind,
  REFLECT_WORD,
  spikeRing,
  type HitHost,
} from './hitFx';

type Hit = Extract<SimEvent, { t: 'hit' }>;
const hit = (over: Partial<Hit> = {}): Hit => ({
  t: 'hit',
  src: 0,
  dst: 7,
  amount: 40,
  crit: false,
  dtype: 3,
  ...over,
});

describe('which hits earn a number', () => {
  it("the character's own hit and any hit on a character do, as they always did", () => {
    expect(numberKind(hit({ src: 1 }), true, false)).toBe('direct');
    expect(numberKind(hit({ dst: 1 }), false, true)).toBe('direct');
  });

  it("damage a side dealt with no attacker of its own (an explosion, an aura, a minion's blow) earns a merged number", () => {
    expect(numberKind(hit({ side: 0 }), false, false)).toBe('effect');
    // Nobody's damage on an enemy (monster against monster) earns none.
    expect(numberKind(hit(), false, false)).toBe('none');
  });

  it('a hit that dealt nothing or was thrown back earns none of its own', () => {
    expect(numberKind(hit({ side: 0, amount: 0 }), false, false)).toBe('none');
    expect(numberKind(hit({ side: 0, amount: 0.3 }), false, false)).toBe('none');
    expect(numberKind(hit({ warded: true, amount: 0, side: 0 }), false, false)).toBe('none');
    expect(numberKind(hit({ immune: true, dst: 1 }), false, true)).toBe('none');
    expect(numberKind(hit({ dst: 1, reflect: 9 }), false, true)).toBe('none');
  });
});

describe('numbers of effects do not flood', () => {
  it('the first number shows at once and the rest of a window are summed into one', () => {
    const g = new NumberGate();
    expect(g.push(5, 10, 3, 0, 0, 0)).toBe(true);
    for (let i = 1; i <= 4; i++) expect(g.push(5, 10, 3, 1, 1, i * 0.05)).toBe(false);
    expect(g.flush(0.1)).toEqual([]);
    const out = g.flush(EFFECT_WINDOW + 0.01);
    expect(out).toHaveLength(1);
    expect(out[0].amount).toBe(40);
    // The summed number opened a new window; a quiet one lets the target go.
    expect(g.push(5, 10, 3, 0, 0, EFFECT_WINDOW + 0.02)).toBe(false);
    expect(g.flush(EFFECT_WINDOW * 3)).toHaveLength(1);
    expect(g.flush(EFFECT_WINDOW * 6)).toEqual([]);
    expect(g.size).toBe(0);
  });

  it('each target has its own window', () => {
    const g = new NumberGate();
    for (let id = 1; id <= 30; id++) expect(g.push(id, 5, 3, 0, 0, 0)).toBe(true);
    for (let id = 1; id <= 30; id++) expect(g.push(id, 5, 3, 0, 0, 0.1)).toBe(false);
    expect(g.flush(1)).toHaveLength(30);
  });

  it('ten ticks a second for ten seconds is a number a window, with every point of it counted', () => {
    const shown: number[] = [];
    const host: HitHost = {
      project: (x, y) => ({ x, y }),
      actorById: () => null,
      squash: () => 0.5,
      floater: (_x, _y, text) => shown.push(Number(text)),
    };
    const fx = new HitFx(host);
    // 30 simulated frames a second, 10 damage every third frame on one target.
    for (let f = 0; f < 300; f++) {
      const now = f / 30;
      if (f % 3 === 0) fx.effectNumber(3, 10, 3, 0, 0, now);
      fx.frame(1 / 30, now, { fillStyle: () => ({}), lineStyle: () => ({}) } as never);
    }
    // Whatever the batching, nothing is lost and nothing is invented.
    const held = shown.reduce((a, b) => a + b, 0);
    expect(held).toBeLessThanOrEqual(1000);
    expect(held).toBeGreaterThanOrEqual(1000 - 40);
    expect(shown.length).toBeLessThanOrEqual(38);
  });
});

describe('the spikes of a reflection', () => {
  it('are a ring of triangles with the base on the ring and the tip outside it', () => {
    const ring = spikeRing(100, 50, 10, 6, 8, 0.5);
    expect(ring).toHaveLength(8);
    for (const s of ring) {
      const tipD = Math.hypot(s.tip[0] - 100, (s.tip[1] - 50) / 0.5);
      const baseD = Math.hypot(s.base[0] - 100, (s.base[1] - 50) / 0.5);
      expect(tipD).toBeCloseTo(16, 6);
      expect(baseD).toBeLessThan(10.01);
      expect(baseD).toBeGreaterThan(9);
    }
  });

  it('flash on the one that threw the hit back, and the number lands on the one it hit, with its word', () => {
    const text: { x: number; y: number; text: string }[] = [];
    const actors = {
      1: { id: 1, x: 2, y: 2, r: 0.4, isPlayer: true },
      2: { id: 2, x: 4, y: 3, r: 0.4, isPlayer: false },
    } as const;
    const host: HitHost = {
      project: (x, y) => ({ x: x * 10, y: y * 10 }),
      actorById: (id) => (actors as never)[id] ?? null,
      squash: () => 0.5,
      floater: (x, y, t) => text.push({ x, y, text: t }),
    };
    const fx = new HitFx(host);
    const calls: string[] = [];
    const g = new Proxy(
      {},
      {
        get: (_t, k) => () => {
          calls.push(String(k));
          return g;
        },
      },
    );
    // The monster (2) throws a hit back at the character (1).
    fx.onEvent({ t: 'reflect', src: 2, dst: 1, amount: 12.4, dtype: 0 });
    expect(text).toHaveLength(1);
    expect(text[0].text).toBe(`12 ${REFLECT_WORD}`);
    expect(text[0].x).toBe(20);
    fx.frame(0.1, 0.1, g as never);
    expect(calls).toContain('fillTriangle');
    // The spikes pass.
    calls.length = 0;
    fx.frame(1, 1.1, g as never);
    expect(calls).not.toContain('fillTriangle');
  });
});
