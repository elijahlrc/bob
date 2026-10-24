/**
 * Gold Leaf: the small painted things, each drawn to an element's size from its data attributes: a gem in its setting,
 * a chain between linked sockets, slot glyphs, flask bottles, a piece of gear as a roundel, the soul whose shadow holds
 * the worn gear, and the small gold setting that separates items on one line.
 */
import type { AgeOpts } from './age';
import { bitumenGround, lit, panel, pearl } from './shapes';
import { canvas, col, ctx2d, isRamp, rng, seedOf, type Ramp } from './ramps';

export type Kind = (el: HTMLElement, W: number, H: number) => [HTMLCanvasElement, AgeOpts | false];

const disc = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  style: string | CanvasGradient,
) => {
  if (r <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = style;
  ctx.fill();
};
const diamond = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  style: string | CanvasGradient,
) => {
  if (r <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = style;
  ctx.fill();
};

/** The ramp and its middle step for a gem's colour (str, dex, int, white). */
export const GEM: Record<string, [Ramp, number]> = {
  str: ['vermilion', 4],
  dex: ['green', 4],
  int: ['azure', 3],
  any: ['pearl', 3],
};
/** The field a piece of gear shows for its rarity, and whether a glyph on it is dark. */
export const RARITY: Record<string, [Ramp, number, boolean]> = {
  normal: ['plaster', 3, true],
  magic: ['sky', 3, true],
  rare: ['gold', 5, true],
  // Dark brown, so a unique's name keeps the orange players know uniques by.
  unique: ['bole', 1, false],
  empty: ['lapis', 2, false],
};

/** A dotted pearl ring round the centre: a target. */
function dots(ctx: CanvasRenderingContext2D, c: number, r: number, every: number) {
  const n = Math.max(8, Math.round((2 * Math.PI * r) / 2));
  for (let i = 0; i < n; i += every) {
    const a = (i / n) * Math.PI * 2;
    ctx.fillStyle = col('pearl', 5);
    ctx.fillRect(
      Math.round(c + Math.cos(a) * r - 0.5),
      Math.round(c + Math.sin(a) * r - 0.5),
      1,
      1,
    );
  }
}

/** A gem in its setting: round for a skill, a lozenge for a support, a dark hollow when empty. */
const gem: Kind = (el, W, H) => {
  const S = Math.min(W, H);
  const cv = canvas(S, S);
  const ctx = ctx2d(cv);
  const c = S / 2;
  const R = c - 2;
  const sup = el.dataset.shape === 'support';
  const sh = sup ? diamond : disc;
  const k = sup ? 1.25 : 1;
  if (el.dataset.state === 'target') dots(ctx, c, R + 1, 2);
  sh(ctx, c, c, (R - 1) * k, col('gold', 5));
  sh(ctx, c, c, (R - 2) * k, col('gold', 6));
  sh(ctx, c, c, (R - 3) * k, col('ink', 0));
  const g = el.dataset.gem;
  if (!g || g === 'empty') {
    sh(ctx, c, c, (R - 4) * k, col('lapis', 0));
    sh(ctx, c + 1, c + 1, (R - 6) * k, col('lapis', 1));
  } else {
    const [ramp, from] = GEM[g] ?? GEM.any;
    sh(ctx, c, c, (R - 4) * k, lit(ctx, ramp, c - R * 0.35, c - R * 0.4, R * 1.4, from));
    if (R >= 6) {
      ctx.fillStyle = col('pearl', 5);
      ctx.fillRect(Math.round(c - R * 0.35), Math.round(c - R * 0.4), 2, 1);
      ctx.fillRect(Math.round(c - R * 0.35), Math.round(c - R * 0.4) + 1, 1, 1);
    }
  }
  if (el.dataset.state === 'sel') {
    ctx.strokeStyle = col('gold', 7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c, c, R + 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  return [
    cv,
    {
      loss: 0.02,
      cracks: 0,
      texture: 0.4,
      edgeBias: 0.6,
      edgeReach: 3,
      goldLoss: 0.05,
      shadow: true,
    },
  ];
};

/** A gold chain running down (or across, data-dir="x") between linked sockets. */
const chain: Kind = (el, W, H) => {
  const across = el.dataset.dir === 'x';
  const L = across ? W : H;
  const cv = canvas(W, H);
  const ctx = ctx2d(cv);
  const mid = Math.floor((across ? H : W) / 2);
  for (let p = 0, i = 0; p < L; p += 4, i++) {
    if (i % 2 === 0) {
      ctx.strokeStyle = col('gold', 6);
      ctx.lineWidth = 1;
      if (across) ctx.strokeRect(p + 0.5, mid - 1.5, 4, 3);
      else ctx.strokeRect(mid - 1.5, p + 0.5, 3, 4);
    } else {
      ctx.fillStyle = col('gold', 5);
      if (across) ctx.fillRect(p - 1, mid, 6, 1);
      else ctx.fillRect(mid, p - 1, 1, 6);
    }
  }
  return [cv, { loss: 0, cracks: 0, texture: 0.3, grime: 0.3, glint: 0.05, shadow: true }];
};

/** Slot glyphs, drawn in a box of about 14 art pixels round (x, y). */
export function glyph(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  s: number,
  fill: string,
  dark: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  const R = (x0: number, y0: number, w: number, h: number) => ctx.fillRect(x0, y0, w, h);
  const P = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
    ctx.closePath();
    ctx.fill();
  };
  switch (name) {
    case 'blade':
      P([
        [5, -7],
        [6.5, -5.5],
        [-2, 3],
        [-3.5, 1.5],
      ]);
      R(-6, 1, 6, 1.6);
      P([
        [-5, 0],
        [-3.6, -1.4],
        [1.4, 3.6],
        [0, 5],
      ]);
      P([
        [-4, 4],
        [-2.6, 5.4],
        [-5.4, 8.2],
        [-6.8, 6.8],
      ]);
      break;
    case 'shield':
      P([
        [0, -7],
        [6, -5],
        [6, 0],
        [0, 7],
        [-6, 0],
        [-6, -5],
      ]);
      break;
    case 'helm':
      ctx.beginPath();
      ctx.arc(0, 0, 6, Math.PI, 0);
      ctx.lineTo(6, 5);
      ctx.lineTo(2, 5);
      ctx.lineTo(2, 1);
      ctx.lineTo(-2, 1);
      ctx.lineTo(-2, 5);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      break;
    case 'body':
      P([
        [-3, -7],
        [3, -7],
        [7, -4],
        [5, 0],
        [4, -1],
        [4, 7],
        [-4, 7],
        [-4, -1],
        [-5, 0],
        [-7, -4],
      ]);
      break;
    case 'gloves':
      P([
        [-4, 7],
        [-4, -2],
        [-6, -4],
        [-5, -5],
        [-3, -4],
        [-3, -7],
        [-1, -7],
        [-1, -3],
        [0, -7],
        [2, -7],
        [2, -3],
        [3, -6],
        [5, -6],
        [4, 7],
      ]);
      break;
    case 'boots':
      P([
        [-4, -7],
        [1, -7],
        [1, 3],
        [7, 4],
        [7, 7],
        [-4, 7],
      ]);
      break;
    case 'ring':
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      diamond(ctx, 0, -4, 2.6, fill);
      break;
    case 'amulet':
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -3, 5, Math.PI * 0.1, Math.PI * 0.9, true);
      ctx.stroke();
      diamond(ctx, 0, 3, 4, fill);
      break;
    case 'belt':
      R(-7, -2, 14, 4);
      ctx.fillStyle = dark;
      R(-2, -1, 4, 2);
      break;
    case 'flask':
      R(-1.5, -7, 3, 2);
      R(-2.5, -5, 5, 3);
      disc(ctx, 0, 2.5, 5, fill);
      break;
    case 'gem':
      P([
        [-3, -6],
        [3, -6],
        [6, -2],
        [0, 7],
        [-6, -2],
      ]);
      ctx.fillStyle = dark;
      R(-6, -2, 12, 1);
      break;
    case 'all':
      for (const [a, b] of [
        [-4, -4],
        [2, -4],
        [-4, 2],
        [2, 2],
      ])
        R(a, b, 3, 3);
      break;
  }
  ctx.restore();
}
const glyphKind: Kind = (el, W, H) => {
  const cv = canvas(W, H);
  const ctx = ctx2d(cv);
  const on = !!el.closest('.on');
  glyph(
    ctx,
    el.dataset.glyph ?? '',
    W / 2,
    H / 2,
    Math.min(W, H) / 18,
    col(on ? 'ink' : 'gold', on ? 0 : 6),
    col('lapis', 1),
  );
  return [cv, { loss: 0, cracks: 0, texture: 0.4, grime: 0.2, shadow: !on }];
};

/** A flask: cork, neck and round glass, the liquid lit from the top left and filled to data-fill (0..1). */
const LIQUID: Record<string, [Ramp, number]> = {
  life: ['vermilion', 4],
  mana: ['lapis', 5],
  hybrid: ['porphyry', 5],
  util: ['straw', 3],
  utility: ['straw', 3],
  green: ['green', 4],
  teal: ['teal', 4],
};
const bottle: Kind = (el, W, H) => {
  const cv = canvas(W, H);
  const ctx = ctx2d(cv);
  const cx = W / 2;
  const r = Math.min(W / 2 - 2, H * 0.32);
  const cy = H - r - 2;
  const [ramp, from] = LIQUID[el.dataset.liquid ?? ''] ?? LIQUID.util;
  ctx.fillStyle = col('gold', 3);
  ctx.fillRect(Math.round(cx - 2), 1, 4, 3);
  ctx.fillStyle = col('pearl', 2);
  ctx.fillRect(Math.round(cx - 3), 4, 6, Math.max(1, Math.round(cy - r - 2)));
  disc(ctx, cx, cy, r + 1, col('pearl', 2));
  disc(ctx, cx, cy, r, col('ink', 1));
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(0.5, r - 1), 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = lit(ctx, ramp, cx - r * 0.4, cy - r * 0.2, r * 1.6, from);
  const f = el.dataset.fill !== undefined ? Number(el.dataset.fill) : 0.8;
  const top = cy + r - f * 2 * r;
  ctx.fillRect(0, top, W, H);
  ctx.restore();
  ctx.fillStyle = col('pearl', 5);
  ctx.fillRect(Math.round(cx - r * 0.5), Math.round(cy - r * 0.5), 1, 2);
  return [cv, { loss: 0.02, cracks: 0, texture: 0.4, grime: 0.4, shadow: true }];
};

/** A piece of gear: a roundel in its rarity's colour, its slot glyph, its sockets as small gems on the lower rim. */
const slot: Kind = (el, W, H) => {
  const S = Math.min(W, H);
  const cv = canvas(S, S);
  const ctx = ctx2d(cv);
  const c = S / 2;
  const R = c - 3;
  const d = el.dataset;
  const [ramp, from, darkGlyph] = RARITY[d.rar ?? 'empty'] ?? RARITY.empty;
  if (d.state === 'target' || d.state === 'aim') dots(ctx, c, R + 2, d.state === 'aim' ? 1 : 2);
  disc(ctx, c, c, R, col('gold', 5));
  disc(ctx, c, c, R - 1, col('gold', 6));
  disc(ctx, c, c, R - 2, col('ink', 0));
  disc(ctx, c, c, R - 3, lit(ctx, ramp, c - R * 0.35, c - R * 0.4, R * 1.5, from));
  const empty = !d.rar || d.rar === 'empty';
  if (d.glyph)
    glyph(
      ctx,
      d.glyph,
      c,
      c - 1,
      (R - 3) / 9,
      empty ? col('lapis', 4) : darkGlyph ? col('ink', 1) : col('pearl', 4),
      col(ramp, from),
    );
  const sockets = (d.sockets ?? '').split('').filter(Boolean);
  sockets.forEach((g, i) => {
    const a = Math.PI / 2 + (i - (sockets.length - 1) / 2) * 0.32;
    const x = Math.round(c + Math.cos(a) * (R - 1));
    const y = Math.round(c + Math.sin(a) * (R - 1));
    const [gr, gf]: [Ramp, number] =
      (
        { r: GEM.str, g: GEM.dex, b: GEM.int, w: GEM.any, o: ['lapis', 0] } as Record<
          string,
          [Ramp, number]
        >
      )[g] ?? GEM.any;
    ctx.fillStyle = col('ink', 0);
    ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.fillStyle = col(gr, gf + (g === 'o' ? 0 : 1));
    ctx.fillRect(x - 1, y - 1, 2, 2);
  });
  return [
    cv,
    {
      loss: 0.025,
      cracks: 0,
      texture: 0.5,
      edgeBias: 0.6,
      edgeReach: 4,
      goldLoss: 0.06,
      shadow: true,
    },
  ];
};

/**
 * The reliquary: an arched lapis niche with the shadow of a damned soul standing in it, arms hanging (the player is in
 * hell, not holy). data-rows: the row centres of head, shoulders, hands, waist and feet, as fractions of the height.
 */
const soul: Kind = (el, W, H) => {
  // The niche is the dark material (the owner, 2026-10-24); the figure is laid on after its ground, an ink-black soul
  // with a blood-red rim light.
  const cv = bitumenGround(
    panel(W, H, { field: 'bitumen', arch: true, pearls: true, foot: true }),
    rng(seedOf('soul')),
  );
  const ctx = ctx2d(cv);
  const [rHead, rSh, rHand, rWaist, rFeet] = (el.dataset.rows ?? '0.2,0.33,0.46,0.6,0.73')
    .split(',')
    .map((f) => Math.round(H * Number(f)));
  const cx = W / 2;
  const sh = W * 0.17;
  const hand = W * 0.36;
  const body = () => {
    ctx.beginPath();
    ctx.arc(cx, rHead, W * 0.075, 0, Math.PI * 2);
    ctx.moveTo(cx - W * 0.03, rHead);
    ctx.lineTo(cx + W * 0.03, rHead);
    ctx.lineTo(cx + W * 0.04, rSh - 6);
    ctx.lineTo(cx + sh, rSh - 2);
    ctx.lineTo(cx + hand + 4, rHand + 2);
    ctx.lineTo(cx + hand - 4, rHand + 6);
    ctx.lineTo(cx + sh - 4, rSh + 10);
    ctx.lineTo(cx + W * 0.13, rWaist);
    ctx.lineTo(cx + W * 0.11, rFeet + 6);
    ctx.lineTo(cx - W * 0.11, rFeet + 6);
    ctx.lineTo(cx - W * 0.13, rWaist);
    ctx.lineTo(cx - sh + 4, rSh + 10);
    ctx.lineTo(cx - hand + 4, rHand + 6);
    ctx.lineTo(cx - hand - 4, rHand + 2);
    ctx.lineTo(cx - sh, rSh - 2);
    ctx.lineTo(cx - W * 0.04, rSh - 6);
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(1, 1);
  body();
  ctx.fillStyle = col('blood', 1);
  ctx.fill();
  ctx.restore();
  body();
  ctx.fillStyle = col('ink', 0);
  ctx.fill();
  return [
    cv,
    {
      dark: true,
      texture: 0.5,
      edgeBias: 0.45,
      edgeReach: 12,
      goldLoss: 0.08,
      shadow: true,
      loss: 0.02,
      cracks: 4,
    },
  ];
};

/** A small gold setting with a stone, set between items on one line. */
const sep: Kind = (el, W, H) => {
  const S = Math.min(W, H);
  const cv = canvas(S, S);
  const ctx = ctx2d(cv);
  const c = S / 2;
  diamond(ctx, c, c, c - 0.5, col('gold', 5));
  diamond(ctx, c, c, c - 1.5, col('gold', 6));
  const stone = el.dataset.stone;
  diamond(ctx, c, c, c - 2.5, col(isRamp(stone) ? stone : 'vermilion', 4));
  return [cv, { loss: 0, cracks: 0, texture: 0.3, grime: 0.3, shadow: true }];
};

/** A gold star in a field, for a small marker (new items). */
const star: Kind = (_el, W, H) => {
  const S = Math.min(W, H);
  const cv = canvas(S, S);
  const ctx = ctx2d(cv);
  const c = S / 2;
  diamond(ctx, c, c, c - 0.5, col('gold', 6));
  pearl(ctx, Math.round(c), Math.round(c), false, true);
  return [cv, { loss: 0, cracks: 0, texture: 0.2, grime: 0.2, glint: 0.2, shadow: true }];
};

export const KINDS: Record<string, Kind> = {
  gem,
  chain,
  glyph: glyphKind,
  bottle,
  slot,
  soul,
  sep,
  star,
};
