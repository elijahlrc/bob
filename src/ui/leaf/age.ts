/**
 * Gold Leaf: what fifteen hundred years did. A drawing at art resolution is snapped to the ramps, mottled along them,
 * grimed at its edges, then aged: gold flaked to the red bole, paint worn to plaster, cracks, a few glints, and a
 * dithered pixel shadow below and right of it.
 */
import { ctx2d, LOSS_TO, nearest, noise, RAMP_NAMES, RGB, RI, type Rand } from './ramps';

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
};

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
    const hit = nearest(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);
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
  const len = (ri: number) => RGB[ri].length;
  const bc = o.blotch ?? 4;
  const n1 = noise(r, W, H, 10);
  const n2 = noise(r, W, H, 3);
  const n3 = noise(r, W, H, 16);
  const n4 = noise(r, W, H, bc);
  const n5 = noise(r, W, H, bc * 5);
  const tex = o.texture ?? 1;
  const grime = o.grime ?? 1;
  // Mottle along the ramp; darken grimy patches and the pixels near an edge.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (ramp[p] < 0 || ramp[p] === RI.ink) continue;
      let s = ((n1(x, y) - 0.5) * 2.2 + (n2(x, y) - 0.5) * 1.4 + (r() - 0.5) * 1.1) * tex;
      if (n3(x, y) > 0.66) s -= grime;
      let edge = false;
      for (let k = 1; k <= 2 && !edge; k++)
        edge = !opaque(x - k, y) || !opaque(x + k, y) || !opaque(x, y - k) || !opaque(x, y + k);
      if (edge) s -= 0.9 * grime;
      idx[p] = Math.max(0, Math.min(len(ramp[p]) - 1, idx[p] + Math.round(s)));
    }
  // Flakes: the most exposed share of each flaking pixel, by blotchy noise, more of it near the edges.
  const loss = o.loss ?? 0.08;
  if (loss > 0) {
    const v = new Float32Array(N).fill(-1);
    const list: number[] = [];
    const reach = o.edgeReach ?? 4;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (ramp[p] < 0 || !LOSS_TO[RAMP_NAMES[ramp[p]]]) continue;
        let e = 0;
        for (let k = 1; k <= reach && !e; k++)
          if (!opaque(x - k, y) || !opaque(x + k, y) || !opaque(x, y - k) || !opaque(x, y + k))
            e = (reach + 1 - k) / reach;
        v[p] = n4(x, y) * 0.5 + n5(x, y) * 0.5 + e * (o.edgeBias ?? 0.12) + r() * 0.04;
        list.push(v[p]);
      }
    list.sort((a, b) => a - b);
    const cut = list[Math.floor(list.length * (1 - loss))] ?? 2;
    const lost = new Uint8Array(N);
    for (let p = 0; p < N; p++)
      if (v[p] >= cut && !(o.goldLoss !== undefined && ramp[p] === RI.gold && r() >= o.goldLoss)) {
        const to = LOSS_TO[RAMP_NAMES[ramp[p]]]!;
        ramp[p] = RI[to];
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
  for (let c = 0; c < (o.cracks ?? 0); c++) {
    let x = Math.floor(r() * W);
    let y = Math.floor(r() * H);
    let dir = Math.floor(r() * 8);
    const steps = 6 + Math.floor(r() * (o.crackLen ?? 26));
    for (let s = 0; s < steps; s++) {
      const p = at(x, y);
      if (p >= 0 && ramp[p] >= 0 && ramp[p] !== RI.ink) idx[p] = ramp[p] === RI.gold ? 1 : 0;
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
  // A few glints where the leaf still catches the light.
  for (let p = 0; p < N; p++)
    if (ramp[p] === RI.gold && r() < (o.glint ?? 0.006)) idx[p] = len(RI.gold) - 1;
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

/** Hard alpha: anti-aliased edges become whole pixels or nothing. */
export function crisp(cv: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = ctx2d(cv);
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] < 110 ? 0 : 255;
  ctx.putImageData(img, 0, 0);
  return cv;
}
