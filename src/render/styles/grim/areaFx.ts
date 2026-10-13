import type Phaser from 'phaser';

/**
 * The one way an area is drawn (docs/VISUAL_LANGUAGE.md, "Areas"): its exact ground, outlined in a clean dark-and-colour line, so
 * the player can see what was (or will be) hit. Used by the player's skills (`skillFx.ts`), the warnings and landings of monsters
 * (`index.ts`, `encounterFx.ts`) and the zones left on the ground. A circle is drawn as the ground ellipse of the isometric view,
 * a wedge and a lane are drawn corner by corner.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

/** What the area drawing needs from the renderer (the same host the skill effects use). */
export type AreaHost = {
  project(x: number, y: number): Pt;
  rpx(r: number): number;
  squash(): number;
};

export type AreaShape =
  | { kind: 'circle'; x: number; y: number; r: number }
  /** A sector opening from (x, y) toward `facing`, `half` radians either side. */
  | { kind: 'wedge'; x: number; y: number; r: number; facing: number; half: number }
  /** A band along the segment (x, y)-(x2, y2), `half` wide either side of it. */
  | { kind: 'lane'; x: number; y: number; x2: number; y2: number; half: number };

/** The shape of an explode event (a circle, or the band of a strip). */
export function shapeOfExplode(e: {
  x: number;
  y: number;
  r: number;
  strip?: [number, number, number, number];
}): AreaShape {
  return e.strip
    ? { kind: 'lane', x: e.strip[0], y: e.strip[1], x2: e.strip[2], y2: e.strip[3], half: e.r }
    : { kind: 'circle', x: e.x, y: e.y, r: e.r };
}

/** The corners of a wedge or a lane as screen points, filled to `f` of its length (a wedge's radius, a lane's run). */
export function outlinePoints(h: AreaHost, s: AreaShape, f = 1): Pt[] {
  if (s.kind === 'wedge') {
    const out = [h.project(s.x, s.y)];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = s.facing - s.half + (2 * s.half * i) / n;
      out.push(h.project(s.x + Math.cos(a) * s.r * f, s.y + Math.sin(a) * s.r * f));
    }
    return out;
  }
  if (s.kind === 'lane') {
    const dx = s.x2 - s.x;
    const dy = s.y2 - s.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * s.half;
    const ny = (dx / len) * s.half;
    const ex = s.x + dx * f;
    const ey = s.y + dy * f;
    return [
      h.project(s.x + nx, s.y + ny),
      h.project(ex + nx, ey + ny),
      h.project(ex - nx, ey - ny),
      h.project(s.x - nx, s.y - ny),
    ];
  }
  return [];
}

/** Fill an area, from its start to `f` of its extent (1 for the whole). */
export function fillArea(
  g: Gfx,
  h: AreaHost,
  s: AreaShape,
  color: number,
  alpha: number,
  f = 1,
): void {
  g.fillStyle(color, alpha);
  if (s.kind === 'circle') {
    const p = h.project(s.x, s.y);
    const rx = h.rpx(s.r * f);
    g.fillEllipse(p.x, p.y, rx * 2, rx * 2 * h.squash());
    return;
  }
  g.fillPoints(outlinePoints(h, s, f) as Phaser.Math.Vector2[], true);
}

/** The edge of an area as a path only. */
function edge(g: Gfx, h: AreaHost, s: AreaShape): void {
  if (s.kind === 'circle') {
    const p = h.project(s.x, s.y);
    const rx = h.rpx(s.r);
    g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * h.squash());
    return;
  }
  g.strokePoints(outlinePoints(h, s) as Phaser.Math.Vector2[], true, true);
}

/**
 * The clean outline: a dark line under a colour line, so it reads on a pale floor and a dark one, at `alpha` (the width is the
 * colour line's; the dark line is a pixel and a half wider).
 */
export function outlineArea(
  g: Gfx,
  h: AreaHost,
  s: AreaShape,
  color: number,
  alpha: number,
  width = 1.5,
): void {
  g.lineStyle(width + 1.5, 0x000000, 0.5 * alpha);
  edge(g, h, s);
  g.lineStyle(width, color, alpha);
  edge(g, h, s);
}

/**
 * An area that has just gone off: it holds its full outline, a wash fills it and fades, and a bright front sweeps out to the
 * edge (a ring for a circle, the far edge for a wedge or a lane). `k` runs 0 to 1 over the effect.
 */
export function drawLanded(
  g: Gfx,
  h: AreaHost,
  s: AreaShape,
  color: number,
  light: number,
  k: number,
): void {
  const hold = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
  const front = Math.min(1, k / 0.35);
  fillArea(g, h, s, color, 0.2 * hold);
  if (front < 1) fillArea(g, h, s, light, 0.25 * (1 - front), front);
  outlineArea(g, h, s, color, hold, 1.5 + (1 - k));
  // The bright front of the blow, a thin line that runs out to the edge.
  if (s.kind === 'circle') {
    if (front < 1) outlineArea(g, h, { ...s, r: s.r * front }, light, 0.8 * (1 - front), 1);
  } else if (front < 1) {
    const f = outlinePoints(h, s, front);
    g.lineStyle(1, light, 0.8 * (1 - front)).strokePoints(f as Phaser.Math.Vector2[], true, true);
  }
}
