import { describe, expect, it } from 'vitest';
import { STATUS_IDS } from '../../data/statuses';
import type { Actor } from '../../sim/types';
import {
  DOT_LOOK,
  drawSpears,
  drawStatusRow,
  hasAfflictions,
  MAX_PIPS,
  MAX_SPEARS,
  STATUS_LOOK,
  statusPips,
} from './statusMarks';

/** A graphics object that accepts every call and counts them. */
function gfx() {
  const calls = { n: 0 };
  const g: unknown = new Proxy(() => g, {
    get: (_t, k) => (k === 'calls' ? calls : () => ((calls.n += 1), g)),
  });
  return g as { calls: { n: number } };
}

const state = (t: number, t0 = t, n = 1) => ({ t, t0, v: 20, x: 0, n });

function actor(over: Partial<Actor> = {}): Actor {
  return { fx: {}, sdots: [], impales: [], ...over } as unknown as Actor;
}

const dot = (type: number, over: Record<string, unknown> = {}) => ({
  src: 'x',
  dps: 1,
  raw: 1,
  type,
  t: 3,
  layer: false,
  n: 1,
  spreadR: 0,
  carry: false,
  regen: 0,
  ...over,
});

const drawn = (a: Actor, time: number): number => {
  const g = gfx();
  drawStatusRow(g as never, 100, 50, statusPips(a), 0x101010, time);
  return g.calls.n;
};

describe('the pips of what has been done to an enemy', () => {
  it('every status has a look, and no two share both a glyph and a colour', () => {
    const seen = new Set<string>();
    for (const id of STATUS_IDS) {
      const look = STATUS_LOOK[id];
      expect(look, id).toBeDefined();
      const key = `${look.glyph}/${look.color}`;
      expect(seen.has(key), `${id} repeats ${key}`).toBe(false);
      seen.add(key);
    }
    // Each damage type of a skill's damage over time has its own too.
    for (const look of DOT_LOOK) {
      const key = `${look.glyph}/${look.color}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
    expect(DOT_LOOK).toHaveLength(5);
  });

  it('every status draws something, at every moment of its blink', () => {
    for (const id of STATUS_IDS)
      for (const [left, time] of [
        [8, 0],
        [0.2, 0.37],
        [0.2, 1.9],
      ] as const) {
        const a = actor({ fx: { [id]: state(left, 8, 3) } });
        expect(statusPips(a), id).toHaveLength(1);
        expect(drawn(a, time), `${id} at ${left}/${time}`).toBeGreaterThan(0);
      }
  });

  it('an enemy with nothing on it has no pips; a status or a damage over time makes it count', () => {
    expect(hasAfflictions(actor())).toBe(false);
    expect(statusPips(actor())).toHaveLength(0);
    expect(hasAfflictions(actor({ fx: { maim: state(4) } }))).toBe(true);
    expect(hasAfflictions(actor({ sdots: [dot(3)] as never }))).toBe(true);
    expect(hasAfflictions(actor({ impales: [{ dmg: 1, hits: 5 }] }))).toBe(true);
  });

  it('a pip stays while the status does: it is gone with the status', () => {
    const a = actor({ fx: { blind: state(2) } });
    expect(statusPips(a)).toHaveLength(1);
    delete a.fx.blind;
    expect(statusPips(a)).toHaveLength(0);
  });

  it('damage over time shows one pip a damage type, in the colour of the element, with its layers counted', () => {
    const a = actor({
      sdots: [dot(3), dot(3, { layer: true }), dot(3, { layer: true }), dot(4)] as never,
    });
    const pips = statusPips(a);
    expect(pips.map((p) => p.color)).toEqual([DOT_LOOK[3].color, DOT_LOOK[4].color]);
    expect(pips[0].n).toBe(3);
    expect(pips[1].n).toBe(1);
  });

  it('a stacked status shows its stacks as dots under the glyph', () => {
    const one = drawn(actor({ fx: { withered: state(2, 2, 1) } }), 0);
    const many = drawn(actor({ fx: { withered: state(2, 2, 9) } }), 0);
    expect(many).toBeGreaterThan(one);
  });

  it('a row is never longer than the most that fit, however much is on the enemy', () => {
    const fx: Actor['fx'] = {};
    for (const id of STATUS_IDS) fx[id] = state(5);
    const a = actor({ fx, sdots: [dot(0), dot(1), dot(2), dot(3), dot(4)] as never });
    expect(statusPips(a)).toHaveLength(MAX_PIPS);
    expect(drawn(a, 1)).toBeGreaterThan(0);
  });

  it('a shackle fades as it runs out', () => {
    const early = statusPips(actor({ fx: { bound: state(3, 3) } }))[0];
    const late = statusPips(actor({ fx: { bound: state(0.3, 3) } }))[0];
    expect(late.alpha).toBeLessThan(early.alpha);
  });
});

describe('spears stuck in an enemy', () => {
  it('draws one for each impale it holds, up to the most a body shows', () => {
    const calls = (n: number): number => {
      const g = gfx();
      drawSpears(g as never, 100, 80, 10, n, 7, 0x101010);
      return g.calls.n;
    };
    expect(calls(0)).toBe(0);
    expect(calls(2)).toBeGreaterThan(calls(1));
    expect(calls(MAX_SPEARS + 3)).toBe(calls(MAX_SPEARS));
  });
});
