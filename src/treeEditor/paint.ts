/** Draws the tree the way the game's tree screen does (src/ui/TreeView.tsx, tree.css) on a canvas: same colours, shapes, frames, sizes and names. */
import { classDef } from '../data/classes';
import { HUB_RADIUS, REGIONS, START_RADIUS } from '../data/tree/spec';
import type { TreeNode, TreeNodeKind } from '../data/tree/types';
import {
  AREA_COLOUR,
  AREA_LABEL,
  areaLabelAlpha,
  LABEL_K_KEYSTONE,
  LABEL_K_NOTABLE,
  NODE_RADIUS,
  octagon,
  shapeScale,
  TONE_COLOR,
  TONE_GLYPH,
  toneOf,
} from '../ui/treeStyle';

export const BG = '#0c0b10';
const NODE_BG = '#14111a';
const EDGE = '#4a4458';
export const GOLD = '#e6b84a';
/** The outer edge of a notable's, keystone's and start's frame, in tree units. */
export const FRAME_R = { notable: 30, keystone: 47, start: 42 } as const;
const ATTR_WORD = { str: 'Strength', dex: 'Dexterity', int: 'Intelligence' } as const;

const rgba = (hex: string, a: number) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};
const regionRgb = (attrs: readonly ('str' | 'dex' | 'int')[]) => {
  const c = attrs.map((a) => [1, 3, 5].map((i) => parseInt(TONE_COLOR[a].slice(i, i + 2), 16)));
  return [0, 1, 2].map((i) => Math.round(c.reduce((s, x) => s + x[i], 0) / c.length));
};

const octPath = (r: number, turn = 0) => {
  const p = new Path2D();
  octagon(r, turn)
    .split(' ')
    .forEach((pt, i) => {
      const [x, y] = pt.split(',').map(Number);
      if (i) p.lineTo(x, y);
      else p.moveTo(x, y);
    });
  p.closePath();
  return p;
};
const circ = (r: number) => {
  const p = new Path2D();
  p.arc(0, 0, r, 0, Math.PI * 2);
  return p;
};
const SHAPES = {
  keystoneRim: octPath(FRAME_R.keystone),
  keystoneRing: octPath(37, Math.PI / 8),
  notableRim: circ(FRAME_R.notable),
  notableRing: circ(23),
  startRim: circ(FRAME_R.start),
  startRing: circ(34),
};
const glyphs = new Map<string, Path2D>();
const glyph = (d: string) => {
  let p = glyphs.get(d);
  if (!p) glyphs.set(d, (p = new Path2D(d)));
  return p;
};

/** The map behind the tree: a tinted wedge per region, the dividers, the two rings of the middle, the rim and the region names. */
export function paintBackdrop(ctx: CanvasRenderingContext2D, maxR: number, k: number) {
  const R = maxR + 260;
  const px = 1 / k;
  for (const reg of REGIONS) {
    const [r, g, b] = regionRgb(reg.attrs);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    for (const [o, a] of [
      [0, 0],
      [0.18, 0.07],
      [0.6, 0.14],
      [1, 0.26],
    ] as const)
      grad.addColorStop(o, `rgba(${r},${g},${b},${a})`);
    const a0 = ((reg.angle - 30) * Math.PI) / 180;
    const a1 = ((reg.angle + 30) * Math.PI) / 180;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R * Math.cos(a0), R * Math.sin(a0));
    ctx.arc(0, 0, R, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.lineWidth = px;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (const reg of REGIONS) {
    const a = ((reg.angle - 30) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R * Math.cos(a), R * Math.sin(a));
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  for (const r of [HUB_RADIUS, START_RADIUS]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(201,164,104,0.35)';
  ctx.lineWidth = 2 * px;
  ctx.beginPath();
  ctx.arc(0, 0, maxR + 120, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201,164,104,0.18)';
  ctx.lineWidth = px;
  ctx.beginPath();
  ctx.arc(0, 0, maxR + 170, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(201,164,104,0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '150px system-ui, sans-serif';
  ctx.letterSpacing = '37px';
  for (const reg of REGIONS) {
    const a = (reg.angle * Math.PI) / 180;
    const r = maxR + 420;
    ctx.fillText(
      reg.attrs
        .map((x) => ATTR_WORD[x])
        .join(' · ')
        .toUpperCase(),
      r * Math.cos(a),
      r * Math.sin(a),
    );
  }
  ctx.letterSpacing = '0px';
  ctx.textBaseline = 'alphabetic';
}

/** The hand-written tree's area names, behind everything, in tree units; they fade as the view closes in (as in the game). */
export function paintAreaLabels(
  ctx: CanvasRenderingContext2D,
  areas: readonly { name: string; region: string; x: number; y: number }[],
  k: number,
) {
  const alpha = areaLabelAlpha(k) * 0.5;
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${AREA_LABEL.size}px system-ui, sans-serif`;
  for (const a of areas) {
    ctx.fillStyle = AREA_COLOUR[a.region] ?? '#8a90a0';
    ctx.fillText(a.name, a.x, a.y);
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
}

export const edgeStyle = (ctx: CanvasRenderingContext2D, k: number) => {
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.6 / k;
};

/** One node, as the game draws it when it is not allocated. */
export function paintNode(ctx: CanvasRenderingContext2D, n: TreeNode, k: number) {
  const s = shapeScale(n.kind, k);
  const toneId = toneOf(n);
  const tone = TONE_COLOR[toneId];
  const lw = (px: number) => px / (k * s);
  ctx.save();
  ctx.translate(n.x, n.y);
  ctx.scale(s, s);
  switch (n.kind) {
    case 'keystone':
      ctx.strokeStyle = '#b58cf0';
      ctx.lineWidth = lw(1.8);
      ctx.stroke(SHAPES.keystoneRim);
      ctx.fillStyle = '#1c1226';
      ctx.fill(SHAPES.keystoneRing);
      ctx.strokeStyle = tone;
      ctx.lineWidth = lw(2.6);
      ctx.stroke(SHAPES.keystoneRing);
      ctx.scale(1.5, 1.5);
      ctx.fillStyle = tone;
      ctx.fill(glyph(TONE_GLYPH[toneId]));
      break;
    case 'notable':
      ctx.strokeStyle = 'rgba(143,126,92,0.85)';
      ctx.lineWidth = lw(1.4);
      ctx.stroke(SHAPES.notableRim);
      ctx.fillStyle = NODE_BG;
      ctx.fill(SHAPES.notableRing);
      ctx.strokeStyle = rgba(tone, 0.9);
      ctx.lineWidth = lw(2.2);
      ctx.stroke(SHAPES.notableRing);
      ctx.scale(0.95, 0.95);
      ctx.fillStyle = rgba(tone, 0.85);
      ctx.fill(glyph(TONE_GLYPH[toneId]));
      break;
    case 'start':
      ctx.strokeStyle = 'rgba(110,101,119,0.85)';
      ctx.lineWidth = lw(1.4);
      ctx.stroke(SHAPES.startRim);
      ctx.fillStyle = '#2a2630';
      ctx.fill(SHAPES.startRing);
      ctx.strokeStyle = 'rgba(138,132,148,0.7)';
      ctx.lineWidth = lw(2);
      ctx.stroke(SHAPES.startRing);
      break;
    default: {
      const c = circ(NODE_RADIUS[n.kind]);
      ctx.fillStyle = NODE_BG;
      ctx.strokeStyle = rgba(tone, n.kind === 'travel' ? 0.5 : 0.55);
      ctx.lineWidth = lw(n.kind === 'travel' ? 1.4 : 1.6);
      ctx.fill(c);
      ctx.stroke(c);
      ctx.fillStyle = rgba(tone, 0.6);
      ctx.fill(circ(n.kind === 'travel' ? 3.4 : 4.4));
    }
  }
  ctx.restore();
}

/** The outer radius of a node's shape on the map, in tree units (for rings drawn around it and for hit tests). */
export function reach(kind: TreeNodeKind, k: number): number {
  const s = shapeScale(kind, k);
  const frame =
    kind === 'keystone' || kind === 'notable' || kind === 'start'
      ? FRAME_R[kind]
      : NODE_RADIUS[kind];
  return frame * s;
}

/** The widest a node's text may be, in tree units, before it is left out: about the spacing of neighbouring nodes. */
export const TEXT_FIT = 130;

/**
 * A node's stat lines under it, once the view is close enough that they fit: the text is set in screen pixels, so zooming
 * in shrinks its width in tree units until it is narrower than `TEXT_FIT` and appears. Under the name when the node has one
 * drawn (notable, keystone, start), else under the node itself.
 */
export function paintText(ctx: CanvasRenderingContext2D, n: TreeNode, k: number, lines: string[]) {
  if (!lines.length) return;
  const px = 1 / k;
  const size = 11 * px;
  ctx.font = `${size}px system-ui, sans-serif`;
  let w = 0;
  for (const t of lines) w = Math.max(w, ctx.measureText(t).width);
  if (w > TEXT_FIT) return;
  const named = n.kind === 'notable' || n.kind === 'keystone' || n.kind === 'start';
  const nameSize = (n.kind === 'notable' ? 13 : 15) * px;
  const y0 = n.y + reach(n.kind, k) + 13 * px + (named ? nameSize + 6 * px : 0) + size * 0.5;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3 * px;
  ctx.strokeStyle = '#05040a';
  ctx.fillStyle = '#b8c0cc';
  lines.forEach((t, i) => {
    const y = y0 + i * size * 1.25;
    ctx.strokeText(t, n.x, y);
    ctx.fillText(t, n.x, y);
  });
}

/** A name under a notable, keystone or class start, once the view is close enough (as in the game). */
export function paintLabel(ctx: CanvasRenderingContext2D, n: TreeNode, k: number, force = false) {
  const big = n.kind === 'keystone' || n.kind === 'start';
  if (!force) {
    if (!big && n.kind !== 'notable') return;
    if (k < (n.kind === 'notable' ? LABEL_K_NOTABLE : LABEL_K_KEYSTONE)) return;
  }
  const text = n.kind === 'start' ? classDef(n.classStart!).name : n.name;
  const px = 1 / k;
  const size = (big ? 15 : 13) * px;
  ctx.font = `${big ? 'bold ' : ''}${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  const y = n.y + reach(n.kind, k) + 13 * px + size * 0.5;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.2 * px;
  ctx.strokeStyle = '#05040a';
  ctx.strokeText(text, n.x, y);
  ctx.fillStyle = n.kind === 'keystone' ? '#cba8ff' : n.kind === 'start' ? '#fff' : '#d8cdb4';
  ctx.fillText(text, n.x, y);
}
