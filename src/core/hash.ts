/** FNV-1a 32-bit hash of a string. */
export function fnv1a(str: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Mix a 32-bit integer (murmur3 finaliser). */
export function mix32(x: number): number {
  x >>>= 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

/** Incremental hash over a stream of numbers (used for event-log determinism checks). */
export class Hasher {
  private h = 0x811c9dc5;

  num(n: number): this {
    // Quantise floats so the hash is stable across platforms for identical computations.
    const q = Math.round(n * 1000);
    this.h = Math.imul(this.h ^ (q & 0xffff), 0x01000193) >>> 0;
    this.h = Math.imul(this.h ^ ((q >>> 16) & 0xffff), 0x01000193) >>> 0;
    return this;
  }

  str(s: string): this {
    this.h = fnv1a(s, this.h);
    return this;
  }

  digest(): number {
    return mix32(this.h);
  }
}
