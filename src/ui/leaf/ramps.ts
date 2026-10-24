/**
 * Gold Leaf (docs/mockups/style/STYLE-GUIDE.md): the colour ramps every painted surface is snapped to, and the small
 * tools the painter shares: a seeded random source, smooth value noise and canvases. Paintings are deterministic from a
 * key, so a surface keeps its wear across renders and sizes.
 */

/** Screen pixels per art pixel: every surface is painted at half resolution and scaled up with hard pixels. */
export const P = 2;

export const RAMPS = {
  gold: ['#4a3616', '#634a21', '#7e622c', '#977835', '#ad8b40', '#c09d4e', '#d1b062', '#e2c681'],
  bole: ['#2e140d', '#431f15', '#5a2b1d', '#703826'],
  plaster: ['#4b463b', '#655f50', '#807866', '#9b927c', '#b3aa92'],
  ink: ['#0b0805', '#17110b', '#251c13'],
  lapis: ['#0c1129', '#11183a', '#172049', '#1d2958', '#24336a', '#2f417e', '#3f5291'],
  pearl: ['#7a7262', '#9a917c', '#b6ad95', '#cec6ad', '#e0d9c2', '#eee8d6'],
  vermilion: ['#3b120c', '#541a12', '#702418', '#8a3020', '#a23f2b', '#b6553d', '#c87257'],
  green: ['#112118', '#193022', '#23422d', '#2f5639', '#3f6c48', '#55845a', '#709c71'],
  teal: ['#122a31', '#1a3c46', '#25515c', '#326773', '#447f8b', '#6098a3', '#84b2b9'],
  porphyry: ['#1b0d14', '#28131e', '#381a2a', '#492337', '#5b2e46', '#713c58', '#88506d'],
  straw: ['#675b35', '#827444', '#9d8f57', '#b6a86e', '#ccbf8a', '#ddd2a8'],
  violet: ['#221930', '#312445', '#433359', '#57456f', '#6d5a87', '#8672a0', '#a08db8'],
  sky: ['#485564', '#617081', '#7c8d9f', '#99a9b9', '#b7c4d1', '#d3dce5'],
  azure: ['#1d3672', '#264993', '#335fb2', '#4877cb', '#6893dd', '#93b4ec'],
  // The dark material (the owner, 2026-10-24): an umber-black glaze leaning to oxblood, worn to a red bole, its
  // craquelure opening onto red. Only a painting of it snaps to these (DARK, `age`'s `dark`).
  bitumen: ['#0e0907', '#160d0a', '#1f120d', '#291711', '#341c15', '#412318', '#4f2a1e'],
  blood: ['#2e140d', '#5a2414', '#7a2e18', '#93391f'],
  crackred: ['#2c0f0a', '#431710', '#561a10'],
} as const;
export type Ramp = keyof typeof RAMPS;
export const RAMP_NAMES = Object.keys(RAMPS) as Ramp[];
export const isRamp = (s: string | undefined): s is Ramp => !!s && s in RAMPS;

/** A step of a ramp, clamped to its ends. */
export function col(ramp: Ramp, i: number): string {
  const r = RAMPS[ramp];
  return r[Math.max(0, Math.min(r.length - 1, i))];
}

const rgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
export const RGB: [number, number, number][][] = RAMP_NAMES.map((n) => RAMPS[n].map(rgb));
export const RI = Object.fromEntries(RAMP_NAMES.map((n, i) => [n, i])) as Record<Ramp, number>;

/** What each ramp wears through to: gold flakes to the red bole, paint to plaster; ink, bole and plaster do not flake. */
export const LOSS_TO: Partial<Record<Ramp, Ramp>> = {
  gold: 'bole',
  lapis: 'plaster',
  pearl: 'plaster',
  vermilion: 'plaster',
  green: 'plaster',
  teal: 'plaster',
  porphyry: 'plaster',
  straw: 'plaster',
  sky: 'plaster',
  violet: 'plaster',
  azure: 'plaster',
  bitumen: 'blood',
};

/** The dark material's ramps: a painting snaps to them only when it asks (`age`'s `dark`), so no other painting moves. */
export const DARK: ReadonlySet<Ramp> = new Set<Ramp>(['bitumen', 'blood', 'crackred']);

const nearCache = [new Map<number, number>(), new Map<number, number>()];
/** The nearest ramp step to a colour, as ramp index × 16 + step; the dark material's ramps only when `dark`. */
export function nearest(r: number, g: number, b: number, dark = false): number {
  const k = (r << 16) | (g << 8) | b;
  const cache = nearCache[dark ? 1 : 0];
  const had = cache.get(k);
  if (had !== undefined) return had;
  let best = 1e9;
  let hit = 0;
  for (let ri = 0; ri < RGB.length; ri++) {
    if (!dark && DARK.has(RAMP_NAMES[ri])) continue;
    for (let i = 0; i < RGB[ri].length; i++) {
      const c = RGB[ri][i];
      const e = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
      if (e < best) {
        best = e;
        hit = ri * 16 + i;
      }
    }
  }
  cache.set(k, hit);
  return hit;
}

export type Rand = () => number;
/** A small seeded random source (mulberry32): the painter's own, so paintings never depend on the game's RNG. */
export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seedOf(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Smooth value noise in 0..1 that tiles over W × H. */
export function noise(
  r: Rand,
  W: number,
  H: number,
  cell: number,
): (x: number, y: number) => number {
  const gw = Math.max(1, Math.round(W / cell));
  const gh = Math.max(1, Math.round(H / cell));
  const g = Float32Array.from({ length: gw * gh }, r);
  const at = (x: number, y: number) => g[(((y % gh) + gh) % gh) * gw + (((x % gw) + gw) % gw)];
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = (x / W) * gw;
    const fy = (y / H) * gh;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = s(fx - ix);
    const ty = s(fy - iy);
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx;
    return a + (b - a) * ty;
  };
}

/**
 * The same noise as `noise`, worked out for every pixel at once (the same random draws and arithmetic, so the same
 * numbers), as a grid read `f[y * W + x]`: far quicker than calling `noise` per pixel.
 */
export function noiseGrid(r: Rand, W: number, H: number, cell: number): Float64Array {
  const gw = Math.max(1, Math.round(W / cell));
  const gh = Math.max(1, Math.round(H / cell));
  const g = Float32Array.from({ length: gw * gh }, r);
  const s = (t: number) => t * t * (3 - 2 * t);
  const wrap = (i: number, n: number) => ((i % n) + n) % n;
  const x0 = new Int32Array(W);
  const x1 = new Int32Array(W);
  const tx = new Float64Array(W);
  for (let x = 0; x < W; x++) {
    const fx = (x / W) * gw;
    const ix = Math.floor(fx);
    x0[x] = wrap(ix, gw);
    x1[x] = wrap(ix + 1, gw);
    tx[x] = s(fx - ix);
  }
  const out = new Float64Array(W * H);
  for (let y = 0; y < H; y++) {
    const fy = (y / H) * gh;
    const iy = Math.floor(fy);
    const ty = s(fy - iy);
    const r0 = wrap(iy, gh) * gw;
    const r1 = wrap(iy + 1, gh) * gw;
    for (let x = 0; x < W; x++) {
      const a = g[r0 + x0[x]] + (g[r0 + x1[x]] - g[r0 + x0[x]]) * tx[x];
      const b = g[r1 + x0[x]] + (g[r1 + x1[x]] - g[r1 + x0[x]]) * tx[x];
      out[y * W + x] = a + (b - a) * ty;
    }
  }
  return out;
}

export function canvas(W: number, H: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, W);
  cv.height = Math.max(1, H);
  return cv;
}
export const ctx2d = (cv: HTMLCanvasElement): CanvasRenderingContext2D =>
  cv.getContext('2d') as CanvasRenderingContext2D;
