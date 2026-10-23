/**
 * The passive tree shot's camera (docs/trailer/README.md): one smooth zoom out, from a part-way close view of the class start to
 * the whole finished build, the view's middle following the middle of what is lit. The zoom is a fixed curve of time; the
 * build grows at the pace it leaves room for. Pure arithmetic in tree units, so a script can check it without a browser.
 */
export type Pt = [number, number];
export type Cam = { k: number; cx: number; cy: number; lit: number };

/** Tree units kept clear around the lit nodes (their size and their names). */
const PAD = 170;
const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/**
 * For each of `frames` frames: the zoom, the middle of the view and how many of `pts` are lit. `w` and `h` are the view's size in
 * pixels; `first` is the zoom of the first frame. The nodes lit follow a smooth schedule that reaches all of them a few frames
 * before the end, held back where the zoom does not yet leave room for them (and kept from jumping more than `step` a frame).
 */
export function treeCamera(
  start: Pt,
  pts: Pt[],
  w: number,
  h: number,
  frames: number,
  opts: { first: number; step?: number; around?: number; lead?: number; pace?: number } = {
    first: 0.28,
  },
): Cam[] {
  const step = opts.step ?? 4;
  const around = opts.around ?? 10;
  const box = (n: number) => {
    const p: Pt[] = [start, ...pts.slice(0, n)];
    return {
      x0: Math.min(...p.map((q) => q[0])),
      x1: Math.max(...p.map((q) => q[0])),
      y0: Math.min(...p.map((q) => q[1])),
      y1: Math.max(...p.map((q) => q[1])),
    };
  };
  /** The zoom at which a box fills `frac` of the view. */
  const fit = (b: ReturnType<typeof box>, frac: number) =>
    frac * Math.min(w / (b.x1 - b.x0 + 2 * PAD), h / (b.y1 - b.y0 + 2 * PAD));
  const k1 = fit(box(pts.length), 0.92);
  const k0 = Math.max(opts.first, k1);
  const ks = Array.from({ length: frames }, (_, i) =>
    Math.exp(Math.log(k0) + (Math.log(k1) - Math.log(k0)) * smoothstep(i / (frames - 1))),
  );
  // How many nodes are lit on each frame.
  const lit: number[] = [];
  for (let i = 0; i < frames; i++) {
    const want = Math.max(
      3,
      Math.round(pts.length * Math.pow(smoothstep(i / (frames - 8)), opts.pace ?? 1)),
    );
    const prev = i ? lit[i - 1] : 3;
    lit.push(Math.min(Math.max(want, prev), prev + step, pts.length));
  }
  lit[frames - 1] = pts.length;
  const boxes = lit.map(box);
  // The middle aimed at: the middle of the lit box, drawn toward the newest nodes (where the eye is) early on and not at all at the
  // end.
  const front = lit.map((n) => {
    const r = pts.slice(Math.max(0, n - 5), n);
    const p = r.length ? r : [start];
    return [p.reduce((a, q) => a + q[0], 0) / p.length, p.reduce((a, q) => a + q[1], 0) / p.length];
  });
  const lead = (i: number) => (opts.lead ?? 0.8) * (1 - smoothstep(i / (frames - 1)));
  const mx = boxes.map((b, i) => (b.x0 + b.x1) / 2 + (front[i][0] - (b.x0 + b.x1) / 2) * lead(i));
  const my = boxes.map((b, i) => (b.y0 + b.y1) / 2 + (front[i][1] - (b.y0 + b.y1) / 2) * lead(i));
  const at = (i: number) => Math.min(frames - 1, Math.max(0, i));
  const out: Cam[] = [];
  for (let i = 0; i < frames; i++) {
    // A Gaussian average of the aimed-at middle over the frames around this one (sigma `around` frames).
    let cx = 0;
    let cy = 0;
    let ws = 0;
    for (let j = -Math.ceil(3 * around); j <= Math.ceil(3 * around); j++) {
      const wt = Math.exp(-(j * j) / (2 * around * around));
      cx += mx[at(i + j)] * wt;
      cy += my[at(i + j)] * wt;
      ws += wt;
    }
    cx /= ws;
    cy /= ws;
    out.push({ k: ks[i], cx, cy, lit: lit[i] });
  }
  return out;
}
