/**
 * Gold Leaf: what fifteen hundred years did. A drawing at art resolution is snapped to the ramps, mottled along them,
 * grimed at its edges, then aged: gold flaked to the red bole, paint worn to plaster, cracks, a few glints, and a
 * dithered pixel shadow below and right of it.
 */
import { ctx2d, LOSS_TO, nearest, noiseGrid, RAMP_NAMES, RGB, RI, type Rand } from './ramps';

export type AgeOpts = {
  /** The share of flaking pixels. */
  loss?: number;
  cracks?: number;
  crackLen?: number;
  /** How strongly the mottling moves pixels along their ramp (1 for the wall, about 0.55 under text). */
  texture?: number;
  grime?: number;
  /** How much flakes gather near the edges, and how far in an edge counts. */
  edgeBias?: number;
  edgeReach?: number;
  /** The size of a flake's blotch. */
  blotch?: number;
  /** The chance a gold pixel chosen to flake really does (rims stay nearly whole at 0.08). */
  goldLoss?: number;
  glint?: number;
  shadow?: boolean;
  wrapX?: boolean;
  wrapY?: boolean;
  /** Snap to the dark material's ramps too (a bitumen painting). */
  dark?: boolean;
  /** Boxes kept calm (no flakes, no cracks, less grime): where text sits straight on the surface. */
  calm?: { x: number; y: number; w: number; h: number }[];
  /**
   * The whole surface calm: the same mottle as the aged painting with the same seed (the random draws up to it are the
   * same), without its grime patches, flakes or cracks. Cut into boxes and laid over the aged painting, it stands in for
   * `calm` without painting the whole surface again (the wall, painter.ts).
   */
  cleanOnly?: boolean;
  /**
   * Also make the clean twin of this painting in the same pass (as `cleanOnly` would, at the cost of one extra
   * canvas): it is handed to this.
   */
  twin?: (clean: HTMLCanvasElement) => void;
};

/** What each ramp (by index) wears through to, by index; -1 for a ramp that does not flake. */
const LOSS_I = RAMP_NAMES.map((n) => {
  const to = LOSS_TO[n];
  return to ? RI[to] : -1;
});

const DIRS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
] as const;

/** Snap, mottle and age `cv` in place. */
export function age(cv: HTMLCanvasElement, r: Rand, o: AgeOpts = {}): HTMLCanvasElement {
  const W = cv.width;
  const H = cv.height;
  const ctx = ctx2d(cv);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const N = W * H;
  const ramp = new Int8Array(N).fill(-1);
  const idx = new Int8Array(N);
  for (let p = 0; p < N; p++) {
    if (d[p * 4 + 3] < 128) continue;
    const hit = nearest(d[p * 4], d[p * 4 + 1], d[p * 4 + 2], o.dark);
    ramp[p] = hit >> 4;
    idx[p] = hit & 15;
  }
  const at = (x: number, y: number): number => {
    if (o.wrapX) x = (x + W) % W;
    else if (x < 0 || x >= W) return -1;
    if (o.wrapY) y = (y + H) % H;
    else if (y < 0 || y >= H) return -1;
    return y * W + x;
  };
  const opaque = (x: number, y: number) => {
    const p = at(x, y);
    return p >= 0 && ramp[p] >= 0;
  };
  const lens = RGB.map((c) => c.length);
  const len = (ri: number) => lens[ri];
  const calmMask = new Uint8Array(N);
  for (const b of o.calm ?? [])
    for (let y = Math.max(0, b.y); y < Math.min(H, b.y + b.h); y++)
      calmMask.fill(1, y * W + Math.max(0, b.x), y * W + Math.min(W, b.x + b.w));
  const allCalm = !!o.cleanOnly;
  const inCalm = (x: number, y: number) =>
    allCalm || (x >= 0 && x < W && y >= 0 && y < H && calmMask[y * W + x] === 1);
  const edge = edgeDistance(ramp, W, H, !!o.wrapX, !!o.wrapY);
  const bc = o.blotch ?? 4;
  const n1 = noiseGrid(r, W, H, 10);
  const n2 = noiseGrid(r, W, H, 3);
  const n3 = noiseGrid(r, W, H, 16);
  const n4 = noiseGrid(r, W, H, bc);
  const n5 = noiseGrid(r, W, H, bc * 5);
  const tex = o.texture ?? 1;
  const grime = o.grime ?? 1;
  // The clean twin's steps: the same mottle without the grime patches, and none of the wear that follows.
  const twinIdx = o.twin ? new Int8Array(N) : null;
  // Mottle along the ramp; darken grimy patches and the pixels near an edge.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (ramp[p] < 0 || ramp[p] === RI.ink) {
        if (twinIdx) twinIdx[p] = idx[p];
        continue;
      }
      let s = ((n1[p] - 0.5) * 2.2 + (n2[p] - 0.5) * 1.4 + (r() - 0.5) * 1.1) * tex;
      if (edge[p] <= 2) s -= 0.9 * grime;
      if (twinIdx) twinIdx[p] = Math.max(0, Math.min(len(ramp[p]) - 1, idx[p] + Math.round(s)));
      if (n3[p] > 0.66 && !inCalm(x, y)) s -= grime;
      idx[p] = Math.max(0, Math.min(len(ramp[p]) - 1, idx[p] + Math.round(s)));
    }
  const twinRamp = o.twin ? ramp.slice() : null;
  // Flakes: the most exposed share of each flaking pixel, by blotchy noise, more of it near the edges.
  const loss = allCalm ? 0 : (o.loss ?? 0.08);
  if (loss > 0) {
    const v = new Float32Array(N).fill(-1);
    const list = new Float64Array(N);
    let listed = 0;
    const reach = o.edgeReach ?? 4;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (ramp[p] < 0 || LOSS_I[ramp[p]] < 0) continue;
        const k = edge[p];
        const e = k <= reach ? (reach + 1 - k) / reach : 0;
        v[p] =
          n4[p] * 0.5 +
          n5[p] * 0.5 +
          e * (o.edgeBias ?? 0.12) +
          r() * 0.04 -
          (inCalm(x, y) ? 9 : 0);
        list[listed++] = v[p];
      }
    const sorted = list.subarray(0, listed).sort();
    const cut = sorted[Math.floor(listed * (1 - loss))] ?? 2;
    const lost = new Uint8Array(N);
    for (let p = 0; p < N; p++)
      if (v[p] >= cut && !(o.goldLoss !== undefined && ramp[p] === RI.gold && r() >= o.goldLoss)) {
        ramp[p] = LOSS_I[ramp[p]];
        idx[p] = 1 + Math.floor(r() * 3);
        lost[p] = 1;
      }
    // The broken edge of a flake: a dark lip along its top, a lit one along its bottom.
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (!lost[p]) continue;
        const up = at(x, y - 1);
        const dn = at(x, y + 1);
        if (up >= 0 && !lost[up] && ramp[up] >= 0) idx[p] = 0;
        if (dn >= 0 && !lost[dn] && ramp[dn] >= 0 && ramp[dn] !== RI.ink)
          idx[dn] = Math.min(len(ramp[dn]) - 1, idx[dn] + 1);
      }
  }
  // Cracks: short wandering walks to the darkest step of whatever they cross.
  for (let c = 0; c < (allCalm ? 0 : (o.cracks ?? 0)); c++) {
    let x = Math.floor(r() * W);
    let y = Math.floor(r() * H);
    let dir = Math.floor(r() * 8);
    const steps = 6 + Math.floor(r() * (o.crackLen ?? 26));
    for (let s = 0; s < steps; s++) {
      const p = at(x, y);
      if (p >= 0 && ramp[p] >= 0 && ramp[p] !== RI.ink && !inCalm(x, y))
        idx[p] = ramp[p] === RI.gold ? 1 : 0;
      if (r() < 0.35) dir = (dir + (r() < 0.5 ? 1 : 7)) % 8;
      x += DIRS[dir][0];
      y += DIRS[dir][1];
      if (r() < 0.04) {
        const bd = (dir + 2) % 8;
        for (let k = 0, xx = x, yy = y; k < 5; k++, xx += DIRS[bd][0], yy += DIRS[bd][1]) {
          const q = at(xx, yy);
          if (q >= 0 && ramp[q] >= 0 && ramp[q] !== RI.ink) idx[q] = 0;
        }
      }
    }
  }
  // A few glints where the leaf still catches the light (on the twin too, where its leaf is whole).
  for (let p = 0; p < N; p++)
    if (ramp[p] === RI.gold && r() < (o.glint ?? 0.006)) {
      idx[p] = len(RI.gold) - 1;
      if (twinIdx) twinIdx[p] = idx[p];
    }
  if (o.twin && twinIdx && twinRamp) {
    const tw = document.createElement('canvas');
    tw.width = W;
    tw.height = H;
    const tctx = ctx2d(tw);
    const timg = tctx.createImageData(W, H);
    const t = timg.data;
    for (let p = 0; p < N; p++) {
      if (twinRamp[p] < 0) continue;
      const c = RGB[twinRamp[p]][twinIdx[p]];
      t[p * 4] = c[0];
      t[p * 4 + 1] = c[1];
      t[p * 4 + 2] = c[2];
      t[p * 4 + 3] = 255;
    }
    tctx.putImageData(timg, 0, 0);
    o.twin(tw);
  }
  const shade = new Uint8Array(N);
  if (o.shadow)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (ramp[p] >= 0) continue;
        if (opaque(x - 1, y - 2) || opaque(x, y - 2) || opaque(x - 1, y - 1)) shade[p] = 120;
        else if (
          (x + y) % 2 === 0 &&
          (opaque(x - 2, y - 3) || opaque(x - 1, y - 3) || opaque(x - 2, y - 2))
        )
          shade[p] = 70;
      }
  for (let p = 0; p < N; p++) {
    if (ramp[p] < 0) {
      d[p * 4] = 10;
      d[p * 4 + 1] = 6;
      d[p * 4 + 2] = 3;
      d[p * 4 + 3] = shade[p];
      continue;
    }
    const c = RGB[ramp[p]][idx[p]];
    d[p * 4] = c[0];
    d[p * 4 + 1] = c[1];
    d[p * 4 + 2] = c[2];
    d[p * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

/**
 * For every opaque pixel, how far the nearest clear pixel is straight left, right, up or down (the least of the four; the
 * edge of the canvas counts as clear unless the axis wraps), capped at 255. Clear pixels get 0.
 */
function edgeDistance(
  ramp: Int8Array,
  W: number,
  H: number,
  wrapX: boolean,
  wrapY: boolean,
): Uint8Array {
  const out = new Uint8Array(W * H).fill(255);
  // One axis at a time: `n` lines of `len` pixels, pixel i of line j at start(j) + i * step.
  const scan = (
    n: number,
    len: number,
    start: (j: number) => number,
    step: number,
    wrap: boolean,
  ) => {
    for (let j = 0; j < n; j++) {
      const o = start(j);
      for (const dir of [1, -1]) {
        // A wrapping line runs round twice so that its start knows the pixels at its end.
        let run = 0;
        const laps = wrap ? 2 : 1;
        for (let t = 0; t < len * laps; t++) {
          const i = dir === 1 ? t % len : len - 1 - (t % len);
          const p = o + i * step;
          if (ramp[p] < 0) run = 0;
          else run = Math.min(255, run + 1);
          if (t >= len * (laps - 1) && run < out[p]) out[p] = run;
        }
      }
    }
  };
  scan(H, W, (y) => y * W, 1, wrapX);
  scan(W, H, (x) => x, W, wrapY);
  return out;
}

/** Hard alpha: anti-aliased edges become whole pixels or nothing. */
export function crisp(cv: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = ctx2d(cv);
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] < 110 ? 0 : 255;
  ctx.putImageData(img, 0, 0);
  return cv;
}
