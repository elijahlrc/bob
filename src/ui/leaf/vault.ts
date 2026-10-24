/**
 * The passive tree as a starry vault (docs/mockups/style/STYLE-GUIDE.md sections 8 and 10): a worn lapis sky with a
 * gold rim; taken passives gold stars on gold lines, the rest enamel in the colour of what they give (the colour says
 * the family, a notable's glyph says exactly what). The view is drawn each frame on a canvas at half resolution and
 * scaled up with hard pixels: nodes are sprites painted once per kind, colour, state and size, lines one art pixel wide
 * with their alpha snapped. The words are placed by `placeLabels`, most wanted first, where they fit.
 */
import type { TreeNode, TreeNodeKind } from '../../data/tree';
import { NODE_RADIUS, shapeScale, TONE_GLYPH, type Tone } from '../treeStyle';
import { age, crisp } from './age';
import { canvas, col, ctx2d, P, rng, seedOf, type Ramp } from './ramps';
import { lit, pearl } from './shapes';

/** A colour family per tone. */
export const TONE_RAMP: Record<Tone, [Ramp, number]> = {
  life: ['vermilion', 4],
  str: ['vermilion', 3],
  fire: ['vermilion', 5],
  dex: ['green', 4],
  evasion: ['green', 5],
  int: ['azure', 3],
  mana: ['azure', 2],
  spell: ['violet', 5],
  es: ['sky', 4],
  defence: ['sky', 2],
  cold: ['teal', 4],
  minion: ['teal', 5],
  lightning: ['straw', 4],
  crit: ['straw', 5],
  attack: ['straw', 2],
  physical: ['straw', 1],
  chaos: ['porphyry', 5],
  curse: ['porphyry', 6],
  utility: ['pearl', 2],
  damage: ['pearl', 4],
  all: ['pearl', 3],
};
/** A class start's field. */
export const CLASS_RAMP: Record<string, [Ramp, number]> = {
  mystic: ['azure', 3],
  shade: ['violet', 5],
  strider: ['green', 4],
  reaver: ['straw', 4],
  vanguard: ['vermilion', 4],
  zealot: ['gold', 5],
};

/** How a node is drawn: taken, on the path being looked at, takeable now, plain, a search hit, or dimmed by a search. */
export type NodeState = 'on' | 'path' | 'can' | 'off' | 'lit' | 'dim';

const MIN_D: Record<TreeNodeKind, number> = {
  travel: 2,
  hub: 3,
  small: 3,
  notable: 8,
  keystone: 12,
  start: 14,
};
const MAX_D: Record<TreeNodeKind, number> = {
  travel: 5,
  hub: 7,
  small: 9,
  notable: 24,
  keystone: 34,
  start: 38,
};
/** How many art pixels across a node is drawn at zoom k. */
export const diam = (kind: TreeNodeKind, k: number): number =>
  Math.max(
    MIN_D[kind],
    Math.min(MAX_D[kind], Math.round((2 * NODE_RADIUS[kind] * k * shapeScale(kind, k)) / P)),
  );

const sprites = new Map<string, HTMLCanvasElement>();
/** A node's sprite, painted once (cls: the class of a start node). */
export function sprite(
  kind: TreeNodeKind,
  tone: Tone | 'start',
  st: NodeState,
  d: number,
  cls = '',
): HTMLCanvasElement {
  const key = `${kind}|${tone}|${st}|${d}|${cls}`;
  const had = sprites.get(key);
  if (had) return had;
  const pad = kind === 'keystone' ? 6 : 3;
  const S = d + pad * 2;
  const cv = canvas(S, S);
  const ctx = ctx2d(cv);
  const c = S / 2;
  const R = d / 2;
  const disc = (r: number, style: string | CanvasGradient) => {
    if (r <= 0) return;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fillStyle = style;
    ctx.fill();
  };
  const [ramp, from] = tone === 'start' ? (CLASS_RAMP[cls] ?? ['lapis', 4]) : TONE_RAMP[tone];
  const on = st === 'on' || st === 'path';
  const dim = st === 'dim';
  const ring = (r: number, step: number) => {
    const n = Math.max(8, Math.round((2 * Math.PI * r) / 2));
    for (let i = 0; i < n; i += step) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillStyle = col('pearl', 5);
      ctx.fillRect(
        Math.round(c + Math.cos(a) * r - 0.5),
        Math.round(c + Math.sin(a) * r - 0.5),
        1,
        1,
      );
    }
  };
  let out: HTMLCanvasElement;
  if (kind === 'small' || kind === 'travel' || kind === 'hub') {
    if (st === 'on') {
      // a gold star with the enamel at its heart
      const r = R + 1;
      ctx.fillStyle = col('gold', 6);
      ctx.beginPath();
      ctx.moveTo(c, c - r - 1);
      ctx.lineTo(c + r * 0.35, c - r * 0.35);
      ctx.lineTo(c + r + 1, c);
      ctx.lineTo(c + r * 0.35, c + r * 0.35);
      ctx.lineTo(c, c + r + 1);
      ctx.lineTo(c - r * 0.35, c + r * 0.35);
      ctx.lineTo(c - r - 1, c);
      ctx.lineTo(c - r * 0.35, c - r * 0.35);
      ctx.fill();
      disc(R * 0.75, col('gold', 7));
      if (d >= 4) disc(R * 0.45, col(ramp, from + 1));
    } else {
      // From medium zoom a small node gets a setting: a ring of dark gold round its enamel, so the colour reads.
      const set = d >= 4 && !dim;
      if (set)
        disc(
          R + 1,
          st === 'lit' || st === 'path' ? col('pearl', 4) : col('gold', st === 'can' ? 4 : 3),
        );
      disc(
        R,
        dim
          ? col('lapis', 3)
          : st === 'path'
            ? col('pearl', 4)
            : col(ramp, from - (st === 'lit' ? 0 : set ? 1 : 2)),
      );
      if (st === 'lit') disc(Math.max(1, R * 0.4), col('pearl', 5));
      if (st === 'can') ring(R + (set ? 2.5 : 1.5), d >= 5 ? 2 : 1);
    }
    out = crisp(cv);
  } else {
    const rimHi = on ? 6 : dim ? 1 : 3;
    if (kind === 'keystone') {
      const wr = R + 3;
      const n = Math.max(10, Math.round((2 * Math.PI * wr) / 4));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        ctx.save();
        ctx.translate(c + Math.cos(a) * wr, c + Math.sin(a) * wr);
        ctx.rotate(a + Math.PI / 2 + 0.75);
        ctx.beginPath();
        ctx.ellipse(0, -1.5, 1, 2.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = col('green', dim ? 1 : on ? 5 : 3);
        ctx.fill();
        ctx.restore();
      }
    }
    disc(R, col('gold', rimHi - 1));
    disc(R - 1, col('gold', rimHi));
    disc(R - 2, col('ink', 0));
    disc(
      R - 3,
      dim
        ? col('lapis', 2)
        : lit(ctx, ramp, c - R * 0.35, c - R * 0.4, R * 1.4, from - (on || st === 'lit' ? 0 : 2)),
    );
    const g = tone !== 'start' ? TONE_GLYPH[tone] : undefined;
    if (d >= 14 && g) {
      ctx.save();
      ctx.translate(c, c);
      const k = ((R - 3) * 0.72) / 11;
      ctx.scale(k, k);
      const path = new Path2D(g);
      ctx.translate(1 / k, 1 / k);
      ctx.fillStyle = col('ink', 0);
      ctx.fill(path);
      ctx.translate(-1 / k, -1 / k);
      ctx.fillStyle = col('pearl', on ? 5 : dim ? 1 : 3);
      ctx.fill(path);
      ctx.restore();
    }
    if (on && kind !== 'notable') {
      const n = Math.round((2 * Math.PI * (R - 2.5)) / 3);
      for (let i = 0; i < n; i++)
        pearl(
          ctx,
          Math.round(c + Math.cos((i / n) * 6.283) * (R - 2.5)),
          Math.round(c + Math.sin((i / n) * 6.283) * (R - 2.5)),
          false,
          i % 2 === 1,
        );
    }
    if (st === 'can' || st === 'lit') ring(R + 1.5, 2);
    out = age(cv, rng(seedOf(key)), {
      loss: 0.02,
      cracks: 0,
      texture: 0.35,
      grime: 0.4,
      edgeBias: 0.6,
      edgeReach: 2,
      goldLoss: on ? 0.03 : 0.1,
      shadow: true,
    });
  }
  sprites.set(key, out);
  return out;
}

const skies = new Map<string, string>();
/** The sky behind the tree at this size (art pixels): worn lapis with a gold rim and a few dim gold specks. */
export function skyUrl(w: number, h: number): string {
  const key = `${w}x${h}`;
  const had = skies.get(key);
  if (had) return had;
  const cv = canvas(w, h);
  const ctx = ctx2d(cv);
  ctx.fillStyle = col('gold', 5);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = col('gold', 6);
  ctx.fillRect(1, 1, w - 2, h - 2);
  ctx.fillStyle = col('ink', 0);
  ctx.fillRect(3, 3, w - 6, h - 6);
  const g = ctx.createRadialGradient(
    w * 0.45,
    h * 0.4,
    0,
    w * 0.45,
    h * 0.4,
    Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, col('lapis', 2));
  g.addColorStop(0.6, col('lapis', 1));
  g.addColorStop(1, col('lapis', 0));
  ctx.fillStyle = g;
  ctx.fillRect(4, 4, w - 8, h - 8);
  const r = rng(91);
  for (let i = 0; i < (w * h) / 900; i++) {
    ctx.fillStyle = col('gold', 2 + Math.floor(r() * 2));
    ctx.fillRect(4 + Math.floor(r() * (w - 8)), 4 + Math.floor(r() * (h - 8)), 1, 1);
  }
  const url = age(cv, rng(77), {
    loss: 0.012,
    blotch: 6,
    cracks: Math.round((w * h) / 5000),
    crackLen: 24,
    texture: 0.7,
    grime: 0.7,
    edgeBias: 0.2,
    goldLoss: 0.1,
  }).toDataURL();
  skies.set(key, url);
  return url;
}

export type Edge = { a: number; b: number; path: Path2D };
/** A drawn node: where it landed in art pixels and how large it is. */
export type Drawn = { n: TreeNode; x: number; y: number; d: number; st: NodeState };

/**
 * Draw the view: the sky is the element's background; this draws the lines (on their own crisp layer) and the nodes.
 * The camera is snapped to whole art pixels, so panning never makes the nodes jitter against each other.
 */
export function drawVault(
  ctx: CanvasRenderingContext2D,
  lines: HTMLCanvasElement,
  o: {
    nodes: TreeNode[];
    edges: Edge[];
    tone: (id: number) => Tone | 'start';
    state: (id: number) => NodeState;
    taken: (id: number) => boolean;
    path: Set<number> | null;
    view: { x: number; y: number; k: number };
    sel: number | null;
  },
): Drawn[] {
  const { width: w, height: h } = ctx.canvas;
  const k = o.view.k;
  const s = k / P;
  const ox = Math.round(o.view.x / P);
  const oy = Math.round(o.view.y / P);
  ctx.clearRect(0, 0, w, h);
  const lc = ctx2d(lines);
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.clearRect(0, 0, w, h);
  lc.setTransform(s, 0, 0, s, ox, oy);
  const pass = (pick: (a: number, b: number) => boolean, style: string, width: number) => {
    lc.strokeStyle = style;
    lc.lineWidth = width / s;
    for (const e of o.edges) if (pick(e.a, e.b)) lc.stroke(e.path);
  };
  const both = (a: number, b: number) => o.taken(a) && o.taken(b);
  pass((a, b) => !both(a, b), col('gold', 2), 1);
  pass(both, col('gold', 3), 3);
  pass(both, col('gold', 6), 1.6);
  const path = o.path;
  if (path?.size)
    pass(
      (a, b) =>
        (path.has(a) || o.taken(a)) && (path.has(b) || o.taken(b)) && (path.has(a) || path.has(b)),
      col('pearl', 4),
      1.6,
    );
  crisp(lines);
  ctx.drawImage(lines, 0, 0);
  // Nodes, smallest first, so a notable sits over the lines and dots near it.
  const drawn: Drawn[] = [];
  for (const kind of ['travel', 'hub', 'small', 'notable', 'keystone', 'start'] as TreeNodeKind[]) {
    const d = diam(kind, k);
    for (const n of o.nodes) {
      if (n.kind !== kind) continue;
      const x = Math.round(n.x * s) + ox;
      const y = Math.round(n.y * s) + oy;
      if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue;
      const st = o.state(n.id);
      const sp = sprite(kind, o.tone(n.id), st, d, n.classStart ?? '');
      ctx.drawImage(sp, x - Math.floor(sp.width / 2), y - Math.floor(sp.height / 2));
      drawn.push({ n, x, y, d, st });
    }
  }
  if (o.sel !== null) {
    const hit = drawn.find((v) => v.n.id === o.sel);
    if (hit) {
      const r = Math.ceil(hit.d / 2) + 4;
      ctx.fillStyle = col('pearl', 5);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        ctx.fillRect(
          Math.round(hit.x + Math.cos(a) * r),
          Math.round(hit.y + Math.sin(a) * r),
          1,
          1,
        );
      }
    }
  }
  return drawn;
}

/** A word to place: what it says, how it looks, how much it is wanted (lower first). */
export type Want = { v: Drawn; text: string; cls: string; font: string; h: number; p: number };
export type Box = { x: number; y: number; w: number; h: number };

const meas = typeof document !== 'undefined' ? ctx2d(canvas(1, 1)) : null;
const widths = new Map<string, number>();
export function textWidth(t: string, font: string): number {
  const k = font + t;
  let w = widths.get(k);
  if (w === undefined) {
    if (!meas) return t.length * 8;
    meas.font = font;
    w = meas.measureText(t).width;
    widths.set(k, w);
  }
  return w;
}
export const clearWidths = () => widths.clear();

/** Boxes kept in a grid of cells, so asking whether a box is free looks only at its neighbours. */
export class BoxGrid {
  private cells = new Map<number, Box[]>();
  private readonly size = 96;
  private each(b: Box, f: (key: number) => void) {
    const s = this.size;
    for (let gx = Math.floor(b.x / s); gx <= Math.floor((b.x + b.w) / s); gx++)
      for (let gy = Math.floor(b.y / s); gy <= Math.floor((b.y + b.h) / s); gy++)
        f((gx + 32768) * 65536 + (gy + 32768));
  }
  add(b: Box) {
    this.each(b, (key) => {
      const c = this.cells.get(key);
      if (c) c.push(b);
      else this.cells.set(key, [b]);
    });
  }
  hits(b: Box): boolean {
    let hit = false;
    this.each(b, (key) => {
      if (hit) return;
      for (const o of this.cells.get(key) ?? [])
        if (b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y) {
          hit = true;
          return;
        }
    });
    return hit;
  }
}

/** A word placed: its box, what it was, and the two ends of the thin line from its node to it. */
export type Placed = Box & { want: Want; line: [number, number, number, number] };

/**
 * Place the words greedily, most wanted first, each where nothing else is: beside its node (eight places round it),
 * then a step and two steps further out, a thin line joining it to its node. Positions are in the view's pixels at
 * this zoom with the camera at 0, so the whole tree is placed at once and panning only moves the result.
 */
export function placeLabels(want: Want[], taken: BoxGrid): Placed[] {
  const out: Placed[] = [];
  for (const it of [...want].sort((a, b) => a.p - b.p)) {
    const tw = textWidth(it.text, it.font) + 4;
    const th = it.h;
    const cx = it.v.x * P;
    const cy = it.v.y * P;
    const r0 = (it.v.d / 2 + 1.5) * P;
    let done = false;
    for (const gap of [6, 22, 40]) {
      const r = r0 + gap;
      const d = r * 0.7;
      const tries = [
        { x: cx - tw / 2, y: cy + r },
        { x: cx - tw / 2, y: cy - r - th },
        { x: cx + r, y: cy - th / 2 },
        { x: cx - r - tw, y: cy - th / 2 },
        { x: cx + d, y: cy + d },
        { x: cx - d - tw, y: cy + d },
        { x: cx + d, y: cy - d - th },
        { x: cx - d - tw, y: cy - d - th },
      ];
      for (const t of tries) {
        const b = { x: t.x, y: t.y, w: tw, h: th };
        if (taken.hits(b)) continue;
        taken.add(b);
        // From the node's rim to the nearest point of the word's box.
        const nx = Math.max(b.x, Math.min(cx, b.x + b.w));
        const ny = Math.max(b.y, Math.min(cy, b.y + b.h));
        const len = Math.hypot(nx - cx, ny - cy) || 1;
        const rim = r0 - 2;
        out.push({
          ...b,
          want: it,
          line: [cx + ((nx - cx) / len) * rim, cy + ((ny - cy) / len) * rim, nx, ny],
        });
        done = true;
        break;
      }
      if (done) break;
    }
  }
  return out;
}
