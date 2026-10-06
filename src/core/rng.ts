import { fnv1a, mix32 } from './hash';

export type RngState = [number, number, number, number];

/**
 * sfc32 pseudo-random generator. All randomness in the headless layers goes through this.
 * Streams are forked by label so their sequence never depends on call order elsewhere.
 */
export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  /** Identity of this stream (derived from the root seed and fork labels), used to fork children. */
  readonly key: number;

  constructor(seed: number | string, key?: number) {
    const s = typeof seed === 'string' ? fnv1a(seed) : seed >>> 0;
    this.key = key ?? mix32(s ^ 0x9e3779b9);
    // splitmix32 to fill the state.
    let x = s;
    const sm = (): number => {
      x = (x + 0x9e3779b9) >>> 0;
      let z = x;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
      return (z ^ (z >>> 16)) >>> 0;
    };
    this.a = sm();
    this.b = sm();
    this.c = sm();
    this.d = sm();
    for (let i = 0; i < 12; i++) this.nextU32();
  }

  static fromState(state: RngState, key: number): Rng {
    const r = new Rng(0, key);
    [r.a, r.b, r.c, r.d] = state;
    return r;
  }

  getState(): RngState {
    return [this.a, this.b, this.c, this.d];
  }

  nextU32(): number {
    const t = (((this.a + this.b) >>> 0) + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) >>> 0;
    return t >>> 0;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    return this.nextU32() / 4294967296;
  }

  /** Uniform integer in [a, b] inclusive. */
  int(a: number, b: number): number {
    if (b < a) [a, b] = [b, a];
    return a + Math.floor(this.next() * (b - a + 1));
  }

  /** Uniform float in [a, b). */
  float(a: number, b: number): number {
    return a + this.next() * (b - a);
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return p >= 1 ? true : p <= 0 ? false : this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick from empty array');
    return items[Math.floor(this.next() * items.length)];
  }

  weightedIndex(weights: readonly number[]): number {
    let total = 0;
    for (const w of weights) total += Math.max(0, w);
    if (total <= 0) throw new Error('weighted pick with no positive weight');
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      const w = Math.max(0, weights[i]);
      if (r < w) return i;
      r -= w;
    }
    // Floating-point fallthrough: return the last positive weight.
    for (let i = weights.length - 1; i >= 0; i--) if (weights[i] > 0) return i;
    return 0;
  }

  weighted<T>(items: readonly T[], weight: readonly number[] | ((item: T) => number)): T {
    const ws = typeof weight === 'function' ? items.map(weight) : weight;
    return items[this.weightedIndex(ws)];
  }

  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  /**
   * A child stream identified by `label`. The child depends only on this stream's key and the
   * label, never on how many numbers have been drawn, so forking is order-independent.
   */
  fork(label: string): Rng {
    const k = mix32(fnv1a(label, this.key));
    return new Rng(k ^ 0x5bd1e995, k);
  }
}
