/**
 * Gold Leaf: the shapes surfaces are drawn from, at art resolution and in ramp colours, before they are aged: framed
 * panels (maybe arched, with pearls, a tile foot, friezes under headings), medallions, the damage-type bar and the
 * repeating border strips.
 */
import { canvas, col, ctx2d, nearest, noise, RGB, RI, type Rand, type Ramp } from './ramps';

/** A soft light from the top left across a field, which the ramps turn into hard steps. */
export function lit(
  ctx: CanvasRenderingContext2D,
  field: Ramp,
  x: number,
  y: number,
  rad: number,
  from = 4,
): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, rad));
  g.addColorStop(0, col(field, from + 1));
  g.addColorStop(0.45, col(field, from));
  g.addColorStop(1, col(field, from - 2));
  return g;
}

/** A running wave scroll in gold on lapis, h pixels tall, then a gold and an ink line under it. */
export function wave(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number) {
  ctx.fillStyle = col('lapis', 1);
  ctx.fillRect(x0, y, x1 - x0, h);
  const k = h / 7;
  const per = Math.round(14 * k);
  ctx.strokeStyle = col('gold', 6);
  ctx.lineWidth = 1.2 * Math.max(1, k * 0.8);
  for (let x = x0 - per; x < x1; x += per) {
    ctx.beginPath();
    ctx.moveTo(x, y + h - 1.5 * k);
    ctx.bezierCurveTo(x + 5 * k, y + h - 1.5 * k, x + 6 * k, y + 1.5 * k, x + 9.5 * k, y + 1.5 * k);
    ctx.bezierCurveTo(
      x + 13 * k,
      y + 1.5 * k,
      x + 13 * k,
      y + h - 2.5 * k,
      x + 10.5 * k,
      y + h - 3 * k,
    );
    ctx.bezierCurveTo(
      x + 9 * k,
      y + h - 3.2 * k,
      x + 8.6 * k,
      y + h - 4.6 * k,
      x + 10 * k,
      y + h - 4.8 * k,
    );
    ctx.stroke();
  }
  ctx.fillStyle = col('gold', 5);
  ctx.fillRect(x0, y + h, x1 - x0, 1);
  ctx.fillStyle = col('ink', 0);
  ctx.fillRect(x0, y + h + 1, x1 - x0, 1);
}

/** A row of coloured tiles with ink grout, 5 px tall. */
export function tileRow(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number) {
  const C = [
    col('vermilion', 5),
    col('pearl', 4),
    col('lapis', 5),
    col('gold', 6),
    col('green', 5),
    col('pearl', 4),
  ];
  ctx.fillStyle = col('ink', 0);
  ctx.fillRect(x0, y, x1 - x0, 5);
  for (let x = x0 + 1, i = 0; x < x1 - 1; x += 4, i++) {
    ctx.fillStyle = C[i % C.length];
    ctx.fillRect(x, y + 1, Math.min(3, x1 - 1 - x), 3);
  }
}

/** A pearl (white or gold), one or two pixels across. */
export function pearl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  big: boolean,
  gold = false,
) {
  const n: Ramp = gold ? 'gold' : 'pearl';
  ctx.fillStyle = col(n, gold ? 6 : 4);
  if (big) {
    ctx.fillRect(x - 1, y - 1, 2, 2);
    ctx.fillStyle = col(n, gold ? 7 : 5);
    ctx.fillRect(x - 1, y - 1, 1, 1);
  } else ctx.fillRect(x, y, 1, 1);
}

function shape(ctx: CanvasRenderingContext2D, W: number, H: number, inset: number, archRy: number) {
  ctx.beginPath();
  const x0 = inset;
  const x1 = W - inset;
  const y1 = H - inset;
  if (archRy) {
    const rx = (x1 - x0) / 2;
    const ry = Math.max(1, archRy - inset);
    const cy = inset + ry;
    ctx.moveTo(x0, y1);
    ctx.lineTo(x0, cy);
    ctx.ellipse(x0 + rx, cy, rx, ry, 0, Math.PI, 2 * Math.PI);
    ctx.lineTo(x1, y1);
    ctx.closePath();
  } else ctx.rect(x0, inset, x1 - x0, y1 - inset);
}

export type PanelOpts = {
  field: Ramp;
  /** One gold step in the rim instead of two (plaques, buttons). */
  thin?: boolean;
  rim?: Ramp;
  arch?: boolean;
  pearls?: boolean;
  foot?: boolean;
  /** Where a frieze starts under each heading, in art pixels from the top of the panel. */
  friezes?: number[];
};

/**
 * A framed field: a gold rim (whole, no ink outside it), an ink line, then the field lit from the top left. Drawn a
 * little inside its box, so the shadow the aging adds has room.
 */
export function panel(W0: number, H0: number, o: PanelOpts): HTMLCanvasElement {
  const m = o.thin ? 2 : 3;
  const out = canvas(W0, H0);
  if (W0 > 2 * m + 2 && H0 > 2 * m + 2)
    ctx2d(out).drawImage(panelCore(W0 - 2 * m, H0 - 2 * m, o), m, m);
  return out;
}
function panelCore(W: number, H: number, o: PanelOpts): HTMLCanvasElement {
  const cv = canvas(W, H);
  const ctx = ctx2d(cv);
  const ar = o.arch ? Math.min(Math.round(W / 2), 84) : 0;
  const t = o.thin ? 3 : 5;
  const rim = o.rim ?? 'gold';
  const fill = (inset: number, style: string | CanvasGradient) => {
    ctx.fillStyle = style;
    shape(ctx, W, H, inset, ar);
    ctx.fill();
  };
  fill(0, col(rim, 5));
  if (!o.thin) fill(1, col(rim, 6));
  fill(t, col('ink', 0));
  fill(
    t + 1,
    lit(
      ctx,
      o.field,
      W * 0.3,
      ar ? ar * 0.5 : H * 0.1,
      Math.max(W, H) * 1.1,
      o.field === 'gold' ? 5 : o.field === 'bitumen' ? 3 : 4,
    ),
  );
  if (o.foot) tileRow(ctx, t + 1, W - t - 1, H - t - 6);
  // A frieze under each heading: gold bars from rim to rim with a wave scroll between, part of the frame.
  for (const fy of o.friezes ?? []) {
    const y = fy - (o.thin ? 2 : 3);
    ctx.fillStyle = col(rim, 5);
    ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = col(rim, 6);
    ctx.fillRect(0, y + 1, W, 1);
    wave(ctx, t, W - t, y + 2, 7);
    ctx.fillStyle = col(rim, 6);
    ctx.fillRect(0, y + 9, W, 1);
    ctx.fillStyle = col(rim, 5);
    ctx.fillRect(0, y + 10, W, 1);
    ctx.fillStyle = col('ink', 0);
    ctx.fillRect(t, y + 11, W - 2 * t, 1);
  }
  if (o.pearls && ar) {
    const ins = t + 3;
    const rx = (W - 2 * ins) / 2;
    const ry = ar - ins;
    const cy = ins + ry;
    const footY = H - t - 9;
    const n = Math.round((Math.PI * (rx + ry)) / 2 / 4);
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * Math.PI;
      pearl(
        ctx,
        Math.round(W / 2 + Math.cos(a) * rx),
        Math.round(cy + Math.sin(a) * ry),
        true,
        i % 2 === 1,
      );
    }
    for (let y = cy + 4, k = 0; y < footY; y += 4, k++) {
      pearl(ctx, ins, Math.round(y), true, k % 2 === 1);
      pearl(ctx, W - ins, Math.round(y), true, k % 2 === 1);
    }
  }
  return cv;
}

/**
 * The dark material's ground, laid over the bitumen of a painting before it is aged: faint brush strokes on a slant,
 * a craquelure a step or two darker, a few of its seams opening onto red. The aging then mottles it, cracks it and
 * wears it through to the red bole (LOSS_TO).
 */
export function bitumenGround(cv: HTMLCanvasElement, r: Rand): HTMLCanvasElement {
  const W = cv.width;
  const H = cv.height;
  const ctx = ctx2d(cv);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  // The craquelure: a point jittered in each cell of a grid; a pixel's seam is how much nearer its nearest point is
  // than the next.
  const S = 9;
  const gw = Math.ceil(W / S) + 2;
  const gh = Math.ceil(H / S) + 2;
  const pts = Float32Array.from({ length: gw * gh * 2 }, () => 0.15 + r() * 0.7);
  const seam = (x: number, y: number) => {
    const cx = Math.floor(x / S);
    const cy = Math.floor(y / S);
    let d1 = 1e9;
    let d2 = 1e9;
    for (let gy = cy - 1; gy <= cy + 1; gy++)
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        const c = ((gy + 1) * gw + (gx + 1)) * 2;
        if (c < 0 || c >= pts.length) continue;
        const dd = Math.hypot(x - (gx + pts[c]) * S, y - (gy + pts[c + 1]) * S);
        if (dd < d1) {
          d2 = d1;
          d1 = dd;
        } else if (dd < d2) d2 = dd;
      }
    return d2 - d1;
  };
  const stroke = noise(r, W, H, 3);
  const red = noise(r, W, H, 16);
  const ramp = RGB[RI.bitumen];
  const cracks = RGB[RI.crackred];
  const a = 0.5;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      if (d[p + 3] < 128) continue;
      const hit = nearest(d[p], d[p + 1], d[p + 2], true);
      if (hit >> 4 !== RI.bitumen) continue;
      const u = x * Math.cos(a) + y * Math.sin(a);
      const v = -x * Math.sin(a) + y * Math.cos(a);
      let i = (hit & 15) + Math.round((stroke((u / 9) % W, (v * 2) % H) - 0.5) * 1.1);
      const s = seam(x, y);
      let c: [number, number, number];
      if (s < 0.42 && red(x, y) > 0.35)
        c = cracks[Math.min(cracks.length - 1, Math.floor(r() * 3))];
      else {
        if (s < 0.55) i -= 2;
        c = ramp[Math.max(0, Math.min(ramp.length - 1, i))];
      }
      d[p] = c[0];
      d[p + 1] = c[1];
      d[p + 2] = c[2];
    }
  ctx.putImageData(img, 0, 0);
  return cv;
}

/** The damage-type bar: a gold-rimmed strip of small tiles, each run of tiles in its damage type's colour. */
const MIX_RAMP: [Ramp, number][] = [
  ['pearl', 4],
  ['violet', 5],
  ['teal', 5],
  ['vermilion', 5],
  ['green', 5],
];
export function mixBar(W: number, H: number, mix: number[]): HTMLCanvasElement {
  const cv = canvas(W, H);
  const ctx = ctx2d(cv);
  ctx.fillStyle = col('ink', 0);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = col('gold', 5);
  ctx.fillRect(1, 1, W - 2, H - 2);
  ctx.fillStyle = col('ink', 0);
  ctx.fillRect(2, 2, W - 4, H - 4);
  const total = mix.reduce((a, b) => a + b, 0) || 1;
  const cells = Math.floor((W - 6) / 4);
  let acc = 0;
  let at = 0;
  const ends = mix.map((m) => Math.round(((acc += m) / total) * cells));
  for (let c = 0; c < cells; c++) {
    while (c >= ends[at] && at < ends.length - 1) at++;
    const [n, i] = MIX_RAMP[at] ?? MIX_RAMP[0];
    ctx.fillStyle = col(n, i);
    ctx.fillRect(3 + c * 4, 3, 3, H - 6);
  }
  return cv;
}

export type MedalOpts = {
  field: Ramp;
  from?: number;
  R: number;
  wreath?: boolean;
  stars?: boolean;
  /** Larger pearls (the big medallions). */
  big?: boolean;
  /** No ring of pearls. */
  plain?: boolean;
};
/** A medallion: the field lit from the top left, a string of pearls, an ink line, a gold rim; maybe a wreath, stars. */
export function medallion(S: number, o: MedalOpts): HTMLCanvasElement {
  const cv = canvas(S, S);
  const ctx = ctx2d(cv);
  const c = S / 2;
  const R = o.R;
  const disc = (rad: number, style: string | CanvasGradient) => {
    if (rad <= 0) return;
    ctx.beginPath();
    ctx.arc(c, c, rad, 0, Math.PI * 2);
    ctx.fillStyle = style;
    ctx.fill();
  };
  if (o.wreath) {
    const wr = R + 8;
    ctx.beginPath();
    ctx.arc(c, c, wr, 0, Math.PI * 2);
    ctx.strokeStyle = col('green', 1);
    ctx.lineWidth = 2;
    ctx.stroke();
    const n = Math.round((2 * Math.PI * wr) / 7);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(c + Math.cos(a) * wr, c + Math.sin(a) * wr);
        ctx.rotate(a + Math.PI / 2 + side * 0.75);
        ctx.beginPath();
        ctx.ellipse(0, -3, 1.6, 3.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = col('ink', 0);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -3, 1, 2.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = col('green', side < 0 ? 5 : 4);
        ctx.fill();
        ctx.restore();
      }
      if (k % 2 === 0) {
        ctx.beginPath();
        ctx.arc(
          c + Math.cos(a + 0.14) * (wr + 3.5),
          c + Math.sin(a + 0.14) * (wr + 3.5),
          1.4,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = col('vermilion', 5);
        ctx.fill();
      }
    }
  }
  disc(R + 5, col('gold', 5));
  disc(R + 4, col('gold', 6));
  disc(R + 2, col('ink', 0));
  disc(R, lit(ctx, o.field, c - R * 0.35, c - R * 0.4, R * 1.5, o.from ?? 4));
  if (o.stars)
    for (let y = 3; y < S; y += 5)
      for (let x = (y / 5) % 2 ? 3 : 5.5; x < S; x += 5)
        if ((x - c) ** 2 + (y - c) ** 2 < (R - 2) ** 2) {
          ctx.fillStyle = col('gold', 7);
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
  const n = o.plain ? 0 : Math.round((2 * Math.PI * (R + 1)) / (o.big ? 4 : 3));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pearl(
      ctx,
      Math.round(c + Math.cos(a) * (R + 1)),
      Math.round(c + Math.sin(a) * (R + 1)),
      !!o.big,
      i % 2 === 1,
    );
  }
  return cv;
}

/** The repeating border strips: [label, width, height, draw]. A width is a whole number of its pattern's periods. */
export const STRIPS: Record<
  string,
  [string, number, number, (ctx: CanvasRenderingContext2D, W: number) => void]
> = {
  wave: [
    'Wave scroll',
    80,
    11,
    (ctx, W) => {
      ctx.fillStyle = col('ink', 0);
      ctx.fillRect(0, 0, W, 1);
      wave(ctx, 0, W, 1, 8);
    },
  ],
  triangles: [
    'Triangles',
    48,
    7,
    (ctx, W) => {
      ctx.fillStyle = col('gold', 5);
      ctx.fillRect(0, 0, W, 7);
      for (let x = 0; x < W; x += 8) {
        ctx.fillStyle = col('ink', 0);
        ctx.beginPath();
        ctx.moveTo(x, 6.5);
        ctx.lineTo(x + 4, 0.5);
        ctx.lineTo(x + 8, 6.5);
        ctx.fill();
        ctx.fillStyle = col('green', 4);
        ctx.beginPath();
        ctx.moveTo(x + 1.3, 6);
        ctx.lineTo(x + 4, 2);
        ctx.lineTo(x + 6.7, 6);
        ctx.fill();
      }
      ctx.fillStyle = col('ink', 0);
      ctx.fillRect(0, 0, W, 1);
      ctx.fillRect(0, 6, W, 1);
    },
  ],
  tiles: ['Tile row', 48, 5, (ctx, W) => tileRow(ctx, 0, W, 0)],
  // A line of gold tesserae, every third a pearl: what divides rows of text inside a panel.
  dots: [
    'Tesserae',
    24,
    3,
    (ctx, W) => {
      for (let x = 0, i = 0; x < W; x += 4, i++) {
        const n: Ramp = i % 3 === 2 ? 'pearl' : 'gold';
        ctx.fillStyle = col(n, n === 'gold' ? 5 : 3);
        ctx.fillRect(x + 1, 0, 2, 2);
        ctx.fillStyle = col(n, n === 'gold' ? 6 : 4);
        ctx.fillRect(x + 1, 0, 1, 1);
        ctx.fillStyle = col('ink', 0);
        ctx.fillRect(x + 2, 2, 1, 1);
      }
    },
  ],
};
