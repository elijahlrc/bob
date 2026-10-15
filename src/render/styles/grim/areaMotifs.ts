import type Phaser from 'phaser';
import type { Motif } from '../../../calc/areaLook';
import type { FxHost } from './skillFx';

/**
 * What plays inside an area where it goes off (docs/VISUAL_LANGUAGE.md, "Areas"; the names and the words are in
 * `src/calc/areaLook.ts`). The clean outline of the exact ground is `areaFx.ts`'s and is always drawn; these say what the skill
 * does there. Each motif adds one or two timed effects that draw themselves from a seed (so a replay looks the same), on the
 * ground layer (under the actors) or on the additive layer above (light, fire, sparks), and may throw a few particles.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

/** What a motif needs from the skill effects: the renderer's host and a way to queue an effect. */
export type MotifHost = {
  host: FxHost;
  add(total: number, air: boolean, draw: (g: Gfx, k: number) => void): void;
};

/** The area a motif plays in. `light` is a later pulse of an area that pulses: a few accents, not the whole show. */
export type MotifArea = {
  x: number;
  y: number;
  r: number;
  color: number;
  strip?: [number, number, number, number];
  light?: boolean;
};

const TAU = Math.PI * 2;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
/** Fast at the start and slow at the end. */
const out = (t: number): number => 1 - (1 - clamp01(t)) * (1 - clamp01(t));
/** A rise that peaks mid-way: 0 at 0 and at 1. */
const arch = (t: number): number => 4 * clamp01(t) * (1 - clamp01(t));

/** A fixed pseudo-random number from 0 to 1 for a seed and an index. */
const rnd = (seed: number, i: number): number => {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** The area as the ground ellipse of the view: its centre, a point at an angle and a share of the radius, and a size to scale by. */
function frameOf(h: FxHost, a: MotifArea) {
  const p = h.project(a.x, a.y);
  const rx = h.rpx(a.r);
  const sq = h.squash();
  return {
    p,
    rx,
    sq,
    /** A tile-sized scale for things that stand up: about one for a 2.4-tile area. */
    s: Math.max(0.55, Math.min(1.6, rx / 54)),
    at: (ang: number, f: number): Pt => ({
      x: p.x + Math.cos(ang) * rx * f,
      y: p.y + Math.sin(ang) * rx * f * sq,
    }),
  };
}

/** A jagged path from one point to another: `n` steps, each knocked aside by up to `jit` pixels. */
function jagged(from: Pt, to: Pt, n: number, jit: number, seed: number): Pt[] {
  const pts: Pt[] = [from];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < n; i++) {
    const f = i / n;
    const side = (rnd(seed, i) - 0.5) * 2 * jit;
    pts.push({ x: from.x + dx * f + (-dy / len) * side, y: from.y + dy * f + (dx / len) * side });
  }
  pts.push(to);
  return pts;
}

function stroke(g: Gfx, pts: Pt[], width: number, color: number, alpha: number): void {
  if (pts.length < 2 || alpha <= 0) return;
  g.lineStyle(width, color, alpha).beginPath().moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.strokePath();
}

/** A glowing line: a soft outer stroke, the colour, a bright core. */
function glow(g: Gfx, pts: Pt[], color: number, alpha: number, width = 1): void {
  stroke(g, pts, 5 * width, color, 0.22 * alpha);
  stroke(g, pts, 2.4 * width, lighten(color, 0.3), 0.7 * alpha);
  stroke(g, pts, 1 * width, 0xffffff, 0.95 * alpha);
}

const poly = (g: Gfx, pts: Pt[], color: number, alpha: number): void => {
  g.fillStyle(color, alpha).fillPoints(pts as Phaser.Math.Vector2[], true);
};

/** A teardrop of flame standing on (x, y), `h` tall and `w` wide, leaning by `sway`. */
export function tongue(
  g: Gfx,
  x: number,
  y: number,
  w: number,
  h: number,
  sway: number,
  alpha: number,
): void {
  const shape = (k: number): Pt[] => [
    { x: x - w * k, y },
    { x: x - w * 0.8 * k, y: y - h * 0.35 * k },
    { x: x - w * 0.25 * k + sway * 0.5, y: y - h * 0.75 * k },
    { x: x + sway * k, y: y - h * k },
    { x: x + w * 0.3 * k + sway * 0.5, y: y - h * 0.68 * k },
    { x: x + w * 0.85 * k, y: y - h * 0.33 * k },
    { x: x + w * k, y },
  ];
  poly(g, shape(1), 0xff5a18, 0.85 * alpha);
  poly(g, shape(0.7), 0xff9a30, 0.9 * alpha);
  poly(g, shape(0.4), 0xffe080, 0.95 * alpha);
}

/** A crystal or a spear standing on (x, y): a lit half and a shaded half. */
function spike(
  g: Gfx,
  x: number,
  y: number,
  w: number,
  h: number,
  lit: number,
  shaded: number,
  alpha: number,
): void {
  poly(
    g,
    [
      { x: x - w, y },
      { x, y: y - h },
      { x, y },
    ],
    lit,
    alpha,
  );
  poly(
    g,
    [
      { x, y },
      { x, y: y - h },
      { x: x + w, y },
    ],
    shaded,
    alpha,
  );
}

/** A bright flash on the additive layer where the blow lands, with the lights of the host. */
function flash(m: MotifHost, a: MotifArea, color: number, scale: number, intensity: number): void {
  const p = m.host.project(a.x, a.y);
  m.host.flash(p.x, p.y, color, scale, intensity);
}

// ---- Slams ---------------------------------------------------------------------------------------

/** The floor cracks outward, dust runs out and rubble is thrown up; `waves` rings of broken ground follow. */
function quake(m: MotifHost, a: MotifArea, waves: number): void {
  const f = frameOf(m.host, a);
  const light = a.light ?? false;
  const seed = a.x * 7.3 + a.y * 3.1;
  const nCracks = light ? 3 : 9;
  const cracks = Array.from({ length: nCracks }, (_, i) => {
    const ang = (i / nCracks) * TAU + (rnd(seed, i) - 0.5) * 0.5;
    const to = f.at(ang, 0.7 + 0.3 * rnd(seed, i + 40));
    return jagged(f.p, to, 4, 4 * f.s, seed + i);
  });
  const nChips = light ? 3 : 12;
  const chips = Array.from({ length: nChips }, (_, i) => ({
    ang: rnd(seed, i + 80) * TAU,
    reach: 0.35 + 0.8 * rnd(seed, i + 120),
    up: 14 + 18 * rnd(seed, i + 160),
    size: 1.5 + 1.8 * rnd(seed, i + 200),
    shade: rnd(seed, i + 240),
  }));
  m.host.em.dust.explode(light ? 3 : 8 + Math.round(a.r * 3), f.p.x, f.p.y);
  if (!light) m.host.shake(Math.min(5, 1.5 + a.r));
  m.add(0.85, false, (g, k) => {
    const ring = out(k / 0.45);
    if (k < 0.7) {
      g.lineStyle(5 * f.s, 0x8a7a68, 0.45 * (1 - k / 0.7));
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * ring, f.rx * 2 * ring * f.sq);
      g.lineStyle(2, 0xcbbd9e, 0.5 * (1 - k / 0.7));
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * ring * 0.96, f.rx * 2 * ring * 0.96 * f.sq);
    }
    for (let w = 0; w < waves; w++) {
      const t = (k - 0.12 - 0.14 * w) / 0.45;
      if (t <= 0 || t >= 1.2) continue;
      g.lineStyle(3 * f.s, 0x6a5a48, 0.55 * (1 - clamp01(t)));
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * out(t), f.rx * 2 * out(t) * f.sq);
    }
    const grow = out(k / 0.35);
    const fade = 1 - clamp01((k - 0.6) / 0.4);
    for (const c of cracks) {
      const n = Math.max(2, Math.ceil(c.length * grow));
      const pts = c.slice(0, n);
      stroke(g, pts, 3 * f.s, 0x000000, 0.35 * fade);
      stroke(g, pts, 1.6, 0x1a120c, 0.9 * fade);
    }
    for (const c of chips) {
      const t = clamp01(k / 0.65);
      const at = f.at(c.ang, c.reach * out(t));
      const y = at.y - c.up * arch(t) * f.s;
      const alpha = 1 - clamp01((k - 0.62) / 0.3);
      g.fillStyle(c.shade < 0.5 ? 0x5a4a38 : 0x9a8868, alpha).fillRect(at.x, y, c.size, c.size);
    }
  });
}

// ---- Things that rise out of the ground -----------------------------------------------------------

const SPIKE_PAL = {
  boneSpikes: { lit: 0xf1e8d2, shaded: 0xb8aa8c, h: 24, w: 3.2, dust: 0x9a8a70 },
  stoneSpikes: { lit: 0xa08c70, shaded: 0x6a5a48, h: 20, w: 5, dust: 0x8a7a68 },
  iceSpikes: { lit: 0xe8f8ff, shaded: 0x8fd0ff, h: 26, w: 3.6, dust: 0xcfeeff },
} as const;

/** Spears, rock or ice burst up one after another over the ground, or in a rolling line down a band. */
function spikes(m: MotifHost, a: MotifArea, kind: keyof typeof SPIKE_PAL): void {
  const f = frameOf(m.host, a);
  const pal = SPIKE_PAL[kind];
  const seed = a.x * 5.1 + a.y * 9.7;
  const n = a.light ? 6 : a.strip ? 16 : 14;
  const spots = Array.from({ length: n }, (_, i) => {
    let at: Pt;
    let delay: number;
    if (a.strip) {
      // Along the band, the nearer end first.
      const t = (i + 0.5) / n;
      const x = a.strip[0] + (a.strip[2] - a.strip[0]) * t;
      const y = a.strip[1] + (a.strip[3] - a.strip[1]) * t;
      const side = (rnd(seed, i) - 0.5) * 1.4 * a.r;
      const dx = a.strip[2] - a.strip[0];
      const dy = a.strip[3] - a.strip[1];
      const len = Math.hypot(dx, dy) || 1;
      at = m.host.project(x + (-dy / len) * side, y + (dx / len) * side);
      delay = t * 0.4;
    } else {
      const ang = i * 2.39996 + seed;
      at = f.at(ang, 0.9 * Math.sqrt((i + 0.5) / n));
      delay = rnd(seed, i + 30) * 0.18;
    }
    return {
      at,
      delay,
      h: pal.h * (0.7 + 0.6 * rnd(seed, i + 60)),
      w: pal.w * (0.8 + 0.5 * rnd(seed, i + 90)),
    };
  }).sort((u, v) => u.at.y - v.at.y);
  m.add(0.95, false, (g, k) => {
    for (const s of spots) {
      const up = out((k - s.delay) / 0.16);
      const down = 1 - clamp01((k - s.delay - 0.4) / 0.4);
      const u = up * down;
      if (u <= 0.02) continue;
      // Dust at the foot while it bursts through.
      if (k - s.delay < 0.25)
        g.fillStyle(pal.dust, 0.35 * (1 - (k - s.delay) / 0.25)).fillEllipse(
          s.at.x,
          s.at.y,
          10 * f.s,
          4 * f.s,
        );
      spike(g, s.at.x, s.at.y, s.w * f.s, s.h * u * f.s, pal.lit, pal.shaded, Math.min(1, u * 2));
    }
  });
  if (kind === 'iceSpikes') m.host.em.ice.explode(a.light ? 3 : 8, f.p.x, f.p.y);
  else m.host.em.dust.explode(a.light ? 2 : 6, f.p.x, f.p.y);
}

// ---- Cold ----------------------------------------------------------------------------------------

/** A frosted disc, crystals growing up from it and a pale mist; `freeze`: a front of frost runs out and more mist rises. */
function frostBloom(m: MotifHost, a: MotifArea, freeze: boolean): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 3.3 + a.y * 8.1;
  const nUp = a.light ? 3 : freeze ? 10 : 8;
  const up = Array.from({ length: nUp }, (_, i) => ({
    at: f.at(i * 2.39996 + seed, 0.78 * Math.sqrt((i + 0.5) / nUp)),
    h: (11 + 12 * rnd(seed, i)) * f.s,
    w: (2.2 + 1.6 * rnd(seed, i + 20)) * f.s,
    delay: rnd(seed, i + 50) * 0.2,
  })).sort((u, v) => u.at.y - v.at.y);
  const nLie = a.light ? 4 : 12;
  const lying = Array.from({ length: nLie }, (_, i) => ({
    ang: (i / nLie) * TAU + rnd(seed, i + 70) * 0.4,
    len: 0.45 + 0.5 * rnd(seed, i + 90),
  }));
  const nSpark = a.light ? 4 : 14;
  const sparks = Array.from({ length: nSpark }, (_, i) => ({
    at: f.at(rnd(seed, i + 110) * TAU, Math.sqrt(rnd(seed, i + 130)) * 0.95),
    phase: rnd(seed, i + 150) * 6,
  }));
  m.host.em.ice.explode(a.light ? 3 : freeze ? 6 : 9, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0x9ad8ff, 1.8, 0.4);
  m.add(1.0, false, (g, k) => {
    const spread = out(k / 0.3);
    const fade = 1 - clamp01((k - 0.55) / 0.45);
    g.fillStyle(0xcfeeff, 0.2 * fade).fillEllipse(
      f.p.x,
      f.p.y,
      f.rx * 2 * spread,
      f.rx * 2 * spread * f.sq,
    );
    g.fillStyle(0xffffff, 0.12 * fade).fillEllipse(
      f.p.x,
      f.p.y,
      f.rx * 1.2 * spread,
      f.rx * 1.2 * spread * f.sq,
    );
    if (freeze) {
      const front = out(k / 0.5);
      g.lineStyle(2, 0xe8f8ff, 0.8 * (1 - front) * fade);
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * front, f.rx * 2 * front * f.sq);
      g.lineStyle(1, 0x9ad8ff, 0.7 * fade);
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 1.3 * front, f.rx * 1.3 * front * f.sq);
    }
    // Shards lying flat, pointing out from the middle.
    const lie = out(k / 0.35);
    for (const l of lying) {
      const tip = f.at(l.ang, l.len * lie);
      const base = f.at(l.ang, 0.08);
      const px = -Math.sin(l.ang) * 2.2 * f.s;
      const py = Math.cos(l.ang) * 1.1 * f.s;
      poly(
        g,
        [
          { x: base.x + px, y: base.y + py },
          { x: tip.x, y: tip.y },
          { x: base.x - px, y: base.y - py },
        ],
        0xd8f2ff,
        0.8 * fade,
      );
    }
    for (const c of up) {
      const u = out((k - c.delay) / 0.25) * (1 - clamp01((k - 0.6) / 0.4));
      if (u <= 0.02) continue;
      spike(g, c.at.x, c.at.y, c.w, c.h * u, 0xe8f8ff, 0x8fd0ff, Math.min(1, u * 2));
    }
    // Mist rises and thins.
    for (let i = 0; i < (a.light ? 1 : freeze ? 4 : 3); i++) {
      const mx = f.p.x + (rnd(seed, i + 170) - 0.5) * f.rx * 1.2;
      const my = f.p.y - (6 + 16 * k) * f.s + (rnd(seed, i + 190) - 0.5) * 8;
      g.fillStyle(0xe8f4ff, 0.13 * Math.sin(Math.PI * clamp01(k))).fillEllipse(
        mx,
        my,
        (24 + 30 * k) * f.s,
        (10 + 12 * k) * f.s,
      );
    }
    for (const s of sparks) {
      const tw = Math.sin(k * 14 + s.phase);
      if (tw > 0.3) g.fillStyle(0xffffff, 0.9 * fade).fillRect(s.at.x - 1, s.at.y - 1, 2, 2);
    }
  });
}

/** A ring of ice shards runs out from the caster (or from a spot) and frosts the ground behind it. */
function iceNova(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 4.4 + a.y * 6.2;
  const n = a.light ? 10 : 24;
  const shards = Array.from({ length: n }, (_, i) => ({
    ang: (i / n) * TAU + rnd(seed, i) * 0.2,
    h: (7 + 9 * rnd(seed, i + 30)) * f.s,
  }));
  m.host.em.ice.explode(a.light ? 3 : 10, f.p.x, f.p.y);
  m.add(0.9, false, (g, k) => {
    const front = out(k / 0.5);
    const fade = 1 - clamp01((k - 0.5) / 0.5);
    g.fillStyle(0xcfeeff, 0.18 * fade).fillEllipse(
      f.p.x,
      f.p.y,
      f.rx * 2 * front,
      f.rx * 2 * front * f.sq,
    );
    for (const s of shards) {
      const at = f.at(s.ang, front);
      const lag = f.at(s.ang, Math.max(0, front - 0.06));
      const u = k < 0.5 ? 1 : fade;
      spike(g, at.x, at.y, 2.4 * f.s, s.h * u, 0xe8f8ff, 0x8fd0ff, 0.95 * u);
      stroke(g, [lag, at], 1.5, 0xffffff, 0.5 * fade);
    }
  });
}

/** Rings of frost one after another, each with shards standing on its edge (a heavy slam that sends frost out in three waves). */
function iceWaves(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 2.2 + a.y * 5.7;
  const per = a.light ? 8 : 16;
  m.host.em.ice.explode(a.light ? 3 : 8, f.p.x, f.p.y);
  if (!a.light) m.host.shake(3);
  m.add(1.0, false, (g, k) => {
    for (let w = 0; w < 3; w++) {
      const t = (k - 0.1 * w) / 0.45;
      if (t <= 0 || t > 1.25) continue;
      const front = out(t);
      const fade = 1 - clamp01((t - 0.6) / 0.65);
      g.lineStyle(3 * f.s, 0x9ad8ff, 0.6 * fade);
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * front, f.rx * 2 * front * f.sq);
      g.lineStyle(1.2, 0xffffff, 0.8 * fade);
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * front * 0.97, f.rx * 2 * front * 0.97 * f.sq);
      for (let i = 0; i < per; i++) {
        const ang = (i / per) * TAU + w * 0.3 + rnd(seed, i + w * 50) * 0.2;
        const at = f.at(ang, front);
        spike(
          g,
          at.x,
          at.y,
          2 * f.s,
          (6 + 7 * rnd(seed, i + w * 20)) * f.s * fade,
          0xe8f8ff,
          0x8fd0ff,
          0.9 * fade,
        );
      }
    }
  });
}

/** A small burst of shards flung out of the point of the blow, with a flash of cold. */
function iceShatter(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 6.1 + a.y * 2.9;
  const n = a.light ? 5 : 12;
  const bits = Array.from({ length: n }, (_, i) => ({
    ang: rnd(seed, i) * TAU,
    reach: 0.4 + 0.6 * rnd(seed, i + 20),
    up: 12 + 14 * rnd(seed, i + 40),
  }));
  m.host.em.ice.explode(a.light ? 3 : 10, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0x9ad8ff, 1.6, 0.35);
  m.add(0.6, true, (g, k) => {
    const t = clamp01(k / 0.7);
    g.fillStyle(0x9ad8ff, 0.25 * (1 - k)).fillEllipse(
      f.p.x,
      f.p.y,
      f.rx * 2 * out(k / 0.4),
      f.rx * 2 * out(k / 0.4) * f.sq,
    );
    for (const b of bits) {
      const at = f.at(b.ang, b.reach * out(t));
      const y = at.y - b.up * arch(t) * f.s;
      poly(
        g,
        [
          { x: at.x - 1.6 * f.s, y: y + 2 },
          { x: at.x, y: y - 3.5 * f.s },
          { x: at.x + 1.6 * f.s, y: y + 2 },
        ],
        0xe8f8ff,
        0.95 * (1 - clamp01((k - 0.5) / 0.5)),
      );
    }
  });
}

/** Arms of white wind turn round the spot and sweep snow up with them. */
function whirl(m: MotifHost, a: MotifArea, color: number, blades: boolean): void {
  const f = frameOf(m.host, a);
  const arms = blades ? 3 : 4;
  if (!blades) m.host.em.ice.explode(a.light ? 2 : 6, f.p.x, f.p.y);
  m.add(blades ? 0.7 : 1.1, false, (g, k) => {
    const fade = 1 - clamp01((k - 0.6) / 0.4);
    const spin = k * (blades ? 9 : 5);
    for (let arm = 0; arm < arms; arm++) {
      const a0 = (arm / arms) * TAU + spin;
      const steps = 14;
      const pts: Pt[] = [];
      for (let i = 0; i <= steps; i++) {
        const s = i / steps;
        const reach = 0.12 + 0.88 * s * out(k / 0.35);
        pts.push(f.at(a0 - s * 2.4, reach));
      }
      // The arm fades toward its tail; drawn in two or three pieces so the head is the brightest.
      const third = Math.floor(steps / 3);
      stroke(g, pts.slice(0, third + 1), 3 * f.s, color, 0.15 * fade);
      stroke(g, pts.slice(third, 2 * third + 1), 2 * f.s, lighten(color, 0.3), 0.4 * fade);
      stroke(g, pts.slice(2 * third), 1.4, 0xffffff, 0.8 * fade);
      if (blades) {
        const tip = pts[steps];
        poly(
          g,
          [
            { x: tip.x - 3, y: tip.y },
            { x: tip.x + 5 * Math.cos(a0), y: tip.y + 2.5 * Math.sin(a0) - 3 },
            { x: tip.x + 3, y: tip.y + 1 },
          ],
          0xe6e0d4,
          0.95 * fade,
        );
      }
    }
    if (!blades)
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * TAU + spin * 0.6;
        const rho = 0.25 + 0.7 * ((i * 0.37 + k) % 1);
        const at = f.at(ang, rho);
        g.fillStyle(0xffffff, 0.8 * fade).fillRect(at.x, at.y - 10 * k * f.s, 1.5, 1.5);
      }
  });
}

// ---- Fire ----------------------------------------------------------------------------------------

/** Tongues of flame stand up round the edge, a column in the middle, embers rise and the ground is scorched. */
function flames(m: MotifHost, a: MotifArea, column: boolean, big = 1): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 4.7 + a.y * 2.3;
  const n = a.light ? 4 : 11;
  const tongues = Array.from({ length: n }, (_, i) => ({
    at: f.at((i / n) * TAU + rnd(seed, i) * 0.4, 0.55 + 0.4 * rnd(seed, i + 30)),
    h: (15 + 14 * rnd(seed, i + 60)) * f.s * big,
    w: (4 + 3 * rnd(seed, i + 90)) * f.s,
    phase: rnd(seed, i + 120) * 6,
  })).sort((u, v) => u.at.y - v.at.y);
  m.host.em.flame.explode(a.light ? 2 : 8, f.p.x, f.p.y);
  m.host.em.spark.explode(a.light ? 2 : 8, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0xff9a40, 2.2, 0.5);
  m.add(0.8, false, (g, k) => {
    g.fillStyle(0x1a0c06, 0.3 * (1 - clamp01((k - 0.4) / 0.6))).fillEllipse(
      f.p.x,
      f.p.y,
      f.rx * 1.7,
      f.rx * 1.7 * f.sq,
    );
  });
  m.add(0.8, true, (g, k) => {
    const grow = out(k / 0.25) * (1 - clamp01((k - 0.55) / 0.45));
    for (const t of tongues) {
      const sway = Math.sin(k * 18 + t.phase) * 3 * f.s;
      tongue(g, t.at.x, t.at.y, t.w, t.h * grow, sway, 0.9);
    }
    if (column)
      tongue(g, f.p.x, f.p.y, 9 * f.s * big, 44 * f.s * big * grow, Math.sin(k * 14) * 3, 0.95);
  });
}

/** A tall column of fire erupts from the spot and throws embers down about it. */
function geyser(m: MotifHost, a: MotifArea): void {
  // What the geyser sends down about itself afterwards, one after another, is a small burst of fire each.
  if (a.light) return fireball(m, a);
  const f = frameOf(m.host, a);
  m.host.em.flame.explode(10, f.p.x, f.p.y);
  m.host.em.spark.explode(12, f.p.x, f.p.y - 20);
  flash(m, a, 0xff9a40, 2.4, 0.6);
  m.add(0.9, true, (g, k) => {
    const rise = out(k / 0.2) * (1 - clamp01((k - 0.5) / 0.5));
    for (let i = 0; i < 3; i++) {
      const sway = Math.sin(k * 16 + i * 2) * 3;
      tongue(
        g,
        f.p.x + (i - 1) * 4 * f.s,
        f.p.y,
        (8 - i * 2) * f.s,
        (70 - i * 12) * f.s * rise,
        sway,
        0.9,
      );
    }
    // Embers falling back.
    for (let i = 0; i < 10; i++) {
      const ang = rnd(a.x + a.y, i) * TAU;
      const t = clamp01((k - 0.15) / 0.7);
      const at = f.at(ang, 0.9 * out(t) * rnd(a.x, i + 9));
      g.fillStyle(0xffb040, 0.9 * (1 - t)).fillRect(
        at.x,
        at.y - 40 * f.s * (1 - t) * (1 - t) - 2,
        2,
        2,
      );
    }
  });
}

/** A ball of fire swells and bursts with a ring of heat; sparks and smoke fly out. */
function fireball(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  m.host.em.flame.explode(a.light ? 2 : 8, f.p.x, f.p.y);
  m.host.em.spark.explode(a.light ? 3 : 10, f.p.x, f.p.y);
  m.host.em.smoke.explode(a.light ? 1 : 3, f.p.x, f.p.y - 6);
  if (!a.light) flash(m, a, 0xff9a40, 2.0, 0.5);
  m.add(0.55, true, (g, k) => {
    const swell = out(k / 0.4);
    const fade = 1 - clamp01((k - 0.35) / 0.65);
    const cy = f.p.y - 8 * f.s * swell;
    const rr = f.rx * 0.55 * swell;
    g.fillStyle(0xff4a10, 0.5 * fade).fillCircle(f.p.x, cy, rr);
    g.fillStyle(0xff8a28, 0.7 * fade).fillCircle(f.p.x, cy, rr * 0.75);
    g.fillStyle(0xffd060, 0.85 * fade).fillCircle(f.p.x, cy, rr * 0.45);
    g.fillStyle(0xffffff, 0.9 * fade).fillCircle(f.p.x, cy, rr * 0.2);
    const ring = out(k / 0.5);
    g.lineStyle(2.5, 0xffb060, 0.8 * (1 - ring));
    g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * ring, f.rx * 2 * ring * f.sq);
  });
  m.add(0.6, false, (g, k) => {
    g.fillStyle(0x1a0c06, 0.3 * (1 - k)).fillEllipse(f.p.x, f.p.y, f.rx * 1.4, f.rx * 1.4 * f.sq);
  });
}

/** A ring of flame runs out from the caster, tongues standing up along its edge, the ground scorched behind it. */
function fireNova(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 1.9 + a.y * 7.7;
  const n = a.light ? 12 : 26;
  const ang = Array.from({ length: n }, (_, i) => (i / n) * TAU + rnd(seed, i) * 0.2);
  m.host.em.flame.explode(a.light ? 3 : 10, f.p.x, f.p.y);
  m.host.em.spark.explode(a.light ? 3 : 10, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0xff9a40, 2.4, 0.55);
  m.add(0.85, false, (g, k) => {
    const front = out(k / 0.5);
    g.fillStyle(0x1a0c06, 0.28 * (1 - clamp01((k - 0.45) / 0.55))).fillEllipse(
      f.p.x,
      f.p.y,
      f.rx * 2 * front,
      f.rx * 2 * front * f.sq,
    );
  });
  m.add(0.85, true, (g, k) => {
    const front = out(k / 0.5);
    const fade = 1 - clamp01((k - 0.45) / 0.55);
    for (let i = 0; i < n; i++) {
      const at = f.at(ang[i], front);
      const sway = Math.sin(k * 20 + i) * 2;
      tongue(g, at.x, at.y, 3.6 * f.s, (12 + 8 * rnd(seed, i + 40)) * f.s * fade, sway, 0.9);
    }
  });
}

/** Flame tongues roll along a band, the nearer end first. */
function flameLine(m: MotifHost, a: MotifArea): void {
  const s = a.strip ?? [a.x - a.r, a.y, a.x + a.r, a.y];
  const f = frameOf(m.host, a);
  const seed = a.x * 2.7 + a.y * 1.3;
  const n = a.light ? 5 : 14;
  const dx = s[2] - s[0];
  const dy = s[3] - s[1];
  const len = Math.hypot(dx, dy) || 1;
  const spots = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const side = (rnd(seed, i) - 0.5) * 1.2 * a.r;
    return {
      at: m.host.project(s[0] + dx * t + (-dy / len) * side, s[1] + dy * t + (dx / len) * side),
      t,
      h: (13 + 12 * rnd(seed, i + 20)) * f.s,
    };
  }).sort((u, v) => u.at.y - v.at.y);
  m.host.em.flame.explode(a.light ? 2 : 6, f.p.x, f.p.y);
  m.add(0.8, true, (g, k) => {
    for (const sp of spots) {
      const u = out((k - sp.t * 0.3) / 0.2) * (1 - clamp01((k - sp.t * 0.3 - 0.35) / 0.35));
      if (u <= 0.02) continue;
      tongue(g, sp.at.x, sp.at.y, 4 * f.s, sp.h * u, Math.sin(k * 18 + sp.t * 9) * 2, 0.9);
    }
  });
}

/** The ground splits into glowing fissures that run out from the point of the blow, bubble and cool. */
function lava(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 8.3 + a.y * 1.7;
  const n = a.light ? 4 : 8;
  const cracks = Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * TAU + (rnd(seed, i) - 0.5) * 0.6;
    return jagged(f.p, f.at(ang, 0.65 + 0.3 * rnd(seed, i + 30)), 8, 3.2 * f.s, seed + i * 3);
  });
  const bubbles = Array.from({ length: a.light ? 3 : 8 }, (_, i) => ({
    at: f.at(rnd(seed, i + 60) * TAU, 0.2 + 0.7 * rnd(seed, i + 90)),
    t0: 0.2 + 0.5 * rnd(seed, i + 120),
  }));
  m.host.em.flame.explode(a.light ? 2 : 6, f.p.x, f.p.y);
  m.host.em.spark.explode(a.light ? 2 : 8, f.p.x, f.p.y);
  if (!a.light) {
    flash(m, a, 0xff7a20, 2.0, 0.5);
    m.host.shake(2.5);
  }
  m.add(1.1, false, (g, k) => {
    g.fillStyle(0x140a06, 0.3 * (1 - clamp01((k - 0.5) / 0.5))).fillEllipse(
      f.p.x,
      f.p.y,
      f.rx * 1.8,
      f.rx * 1.8 * f.sq,
    );
    // The cracks themselves, dark, and what is left of them when the rock has cooled.
    const grow = out(k / 0.3);
    for (const c of cracks)
      stroke(
        g,
        c.slice(0, Math.max(2, Math.ceil(c.length * grow))),
        8 * f.s,
        0x120804,
        0.75 * (1 - clamp01((k - 0.7) / 0.3)),
      );
  });
  m.add(1.1, true, (g, k) => {
    const grow = out(k / 0.3);
    const cool = 1 - clamp01((k - 0.45) / 0.55);
    const pulse = 0.75 + 0.25 * Math.sin(k * 24);
    for (const c of cracks) {
      const pts = c.slice(0, Math.max(2, Math.ceil(c.length * grow)));
      // A river of molten rock in a dark crack: orange rock with a hot middle that pulses.
      stroke(g, pts, 5 * f.s, 0xff5a10, 0.85 * cool);
      stroke(g, pts, 2.6 * f.s, 0xffa030, 0.9 * cool * pulse);
    }
    for (const b of bubbles) {
      const t = (k - b.t0) / 0.18;
      if (t < 0 || t > 1) continue;
      g.fillStyle(0xffb040, 0.9 * (1 - t)).fillCircle(b.at.x, b.at.y - 4 * t, 1.5 + 2 * t);
    }
  });
}

/** Blobs of molten metal are flung out, land, spread glowing and cool. */
function splat(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 5.9 + a.y * 3.7;
  const n = a.light ? 3 : 7;
  const blobs = Array.from({ length: n }, (_, i) => ({
    to: f.at(rnd(seed, i) * TAU, 0.3 + 0.65 * rnd(seed, i + 30)),
    up: 22 + 20 * rnd(seed, i + 60),
    size: (2.5 + 2 * rnd(seed, i + 90)) * f.s,
  }));
  m.host.em.spark.explode(a.light ? 2 : 8, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0xff8a30, 1.8, 0.45);
  m.add(0.95, true, (g, k) => {
    for (const b of blobs) {
      const fly = clamp01(k / 0.32);
      if (fly < 1) {
        const x = f.p.x + (b.to.x - f.p.x) * fly;
        const y = f.p.y + (b.to.y - f.p.y) * fly - b.up * arch(fly) * f.s;
        g.fillStyle(0xffb040, 0.95).fillCircle(x, y, b.size);
        g.fillStyle(0xffe080, 0.9).fillCircle(x, y, b.size * 0.5);
      } else {
        const t = clamp01((k - 0.32) / 0.63);
        const spread = out(t * 3);
        const cool = 1 - t;
        g.fillStyle(0xff5a10, 0.55 * cool).fillEllipse(
          b.to.x,
          b.to.y,
          b.size * 4.4 * spread,
          b.size * 2.2 * spread,
        );
        g.fillStyle(0xffa030, 0.8 * cool).fillEllipse(
          b.to.x,
          b.to.y,
          b.size * 3 * spread,
          b.size * 1.5 * spread,
        );
        g.fillStyle(0xffe080, 0.9 * cool * cool).fillEllipse(
          b.to.x,
          b.to.y,
          b.size * 1.4 * spread,
          b.size * 0.7 * spread,
        );
      }
    }
  });
}

// ---- Lightning -----------------------------------------------------------------------------------

/** A jagged bolt from the sky onto a point, with a fork or two. */
function bolt(g: Gfx, to: Pt, seed: number, alpha: number, high = 130): void {
  const from = { x: to.x + (rnd(seed, 1) - 0.5) * 24, y: to.y - high };
  const pts = jagged(from, to, 8, 9, seed);
  glow(g, pts, 0xc89cff, alpha, 1.1);
  for (let b = 0; b < 2; b++) {
    const at = pts[2 + b * 3];
    const end = {
      x: at.x + (b ? 1 : -1) * (14 + 10 * rnd(seed, b + 5)),
      y: at.y + 24 + 16 * rnd(seed, b + 9),
    };
    glow(g, jagged(at, end, 3, 5, seed + b * 7), 0xc89cff, 0.7 * alpha, 0.7);
  }
}

/** Arcs run out over the ground from a point, flickering. */
function groundArcs(
  g: Gfx,
  f: ReturnType<typeof frameOf>,
  n: number,
  reach: number,
  k: number,
  seed: number,
  alpha: number,
): void {
  const flick = Math.floor(k * 22);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + rnd(seed, i) * 0.5;
    const to = f.at(ang, reach * out(k / 0.3));
    glow(g, jagged(f.p, to, 4, 4 * f.s, seed + i * 5 + flick), 0xc89cff, alpha, 0.8);
  }
}

/** A bolt comes down from the sky onto the spot and arcs run out over the ground. */
function strike(m: MotifHost, a: MotifArea, bolts: number): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 3.9 + a.y * 6.3;
  const spots = Array.from({ length: bolts }, (_, i) =>
    bolts === 1 ? f.p : f.at(i * 2.39996 + seed, 0.75 * Math.sqrt((i + 0.5) / bolts)),
  );
  m.host.em.bolt.explode(a.light ? 3 : 10, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0xc8a0ff, 2.0, 0.5);
  m.add(0.6 + 0.08 * bolts, true, (g, k) => {
    const total = 0.6 + 0.08 * bolts;
    for (let i = 0; i < spots.length; i++) {
      const t = (k * total - i * 0.08) / 0.18;
      if (t < 0 || t > 1.6) continue;
      const flicker = t < 1 ? 1 : 1 - (t - 1) / 0.6;
      bolt(g, spots[i], seed + i * 11 + Math.floor(t * 6), flicker);
      g.fillStyle(0xffffff, 0.6 * flicker).fillEllipse(
        spots[i].x,
        spots[i].y,
        f.rx * 0.4,
        f.rx * 0.2,
      );
    }
    groundArcs(g, f, a.light ? 3 : 6, 0.8, k, seed, 0.8 * (1 - clamp01((k - 0.3) / 0.5)));
  });
}

/** A column of lightning stands up from the spot and the ground about it crackles. */
function pillar(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 9.1 + a.y * 2.2;
  // Traps go off many times at once, so this is small and faint: a thin spire that tapers to a point (no flat top to cut off
  // against the sky), a small flash and a few arcs. Three nested layers, each shorter than the last, so it fades out upward.
  m.host.em.bolt.explode(a.light ? 2 : 5, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0xc8a0ff, 1.4, 0.3);
  m.add(0.65, true, (g, k) => {
    const rise = out(k / 0.12);
    const fall = 1 - clamp01((k - 0.4) / 0.6);
    const h = 118 * f.s * rise * fall;
    const w = 9 * f.s * (0.8 + 0.2 * Math.sin(k * 40));
    const spire = (hh: number, ww: number): Pt[] => [
      { x: f.p.x - ww, y: f.p.y },
      { x: f.p.x - ww * 0.45, y: f.p.y - hh * 0.55 },
      { x: f.p.x + 2, y: f.p.y - hh },
      { x: f.p.x + ww * 0.45, y: f.p.y - hh * 0.55 },
      { x: f.p.x + ww, y: f.p.y },
    ];
    poly(g, spire(h, w), 0xc89cff, 0.2 * fall);
    poly(g, spire(h * 0.85, w * 0.6), 0xe6d0ff, 0.4 * fall);
    poly(g, spire(h * 0.66, w * 0.25), 0xffffff, 0.6 * fall);
    glow(
      g,
      jagged(
        { x: f.p.x, y: f.p.y },
        { x: f.p.x + 2, y: f.p.y - h * 0.9 },
        6,
        3,
        seed + Math.floor(k * 25),
      ),
      0xc89cff,
      0.55 * fall,
      0.7,
    );
    groundArcs(g, f, a.light ? 2 : 4, 0.8, k, seed, 0.5 * fall);
  });
}

/** Arcs of lightning run out along the ground from the centre to the edge. */
function crackleNova(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 2.1 + a.y * 4.9;
  m.host.em.bolt.explode(a.light ? 3 : 8, f.p.x, f.p.y);
  m.add(0.7, true, (g, k) => {
    const front = out(k / 0.4);
    const fade = 1 - clamp01((k - 0.4) / 0.6);
    const flick = Math.floor(k * 24);
    const n = a.light ? 5 : 10;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + rnd(seed, i) * 0.4;
      glow(
        g,
        jagged(f.at(ang, 0.1), f.at(ang, front), 6, 4.5 * f.s, seed + i * 3 + flick),
        0xc89cff,
        0.85 * fade,
        0.8,
      );
    }
    g.lineStyle(1.5, 0xe6d0ff, 0.6 * fade);
    g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * front, f.rx * 2 * front * f.sq);
  });
}

/** Arcs of lightning jump along a band. */
function crackleLine(m: MotifHost, a: MotifArea): void {
  const s = a.strip ?? [a.x - a.r, a.y, a.x + a.r, a.y];
  const f = frameOf(m.host, a);
  const seed = a.x * 6.6 + a.y * 3.1;
  const from = m.host.project(s[0], s[1]);
  const to = m.host.project(s[2], s[3]);
  m.host.em.bolt.explode(a.light ? 2 : 6, f.p.x, f.p.y);
  m.add(0.6, true, (g, k) => {
    const fade = 1 - clamp01((k - 0.35) / 0.65);
    const flick = Math.floor(k * 24);
    const reach = out(k / 0.3);
    for (let i = 0; i < (a.light ? 2 : 4); i++) {
      const end = { x: from.x + (to.x - from.x) * reach, y: from.y + (to.y - from.y) * reach };
      const lane = (i - 1.5) * 4 * f.s;
      glow(
        g,
        jagged(
          { x: from.x, y: from.y + lane },
          { x: end.x, y: end.y + lane },
          9,
          5 * f.s,
          seed + i * 7 + flick,
        ),
        0xc89cff,
        0.8 * fade,
        0.8,
      );
    }
  });
}

// ---- Chaos ---------------------------------------------------------------------------------------

/** A cloud of sickly green billows out over the area and drifts up; `ritual` lights a rune circle under it. */
function cloud(m: MotifHost, a: MotifArea, ritual: boolean): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 7.7 + a.y * 1.1;
  const n = a.light ? 5 : 13;
  const puffs = Array.from({ length: n }, (_, i) => ({
    at: f.at(rnd(seed, i) * TAU, Math.sqrt(rnd(seed, i + 30)) * 0.8),
    size: (0.28 + 0.26 * rnd(seed, i + 60)) * f.rx,
    drift: 6 + 10 * rnd(seed, i + 90),
    phase: rnd(seed, i + 120) * 6,
  })).sort((u, v) => u.at.y - v.at.y);
  m.host.em.poison.explode(a.light ? 3 : 10, f.p.x, f.p.y);
  m.add(1.0, false, (g, k) => {
    if (ritual) {
      const fade = 1 - clamp01((k - 0.5) / 0.5);
      g.lineStyle(1.5, 0x9ae05a, 0.9 * fade);
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 1.7, f.rx * 1.7 * f.sq);
      g.strokeEllipse(f.p.x, f.p.y, f.rx * 1.0, f.rx * 1.0 * f.sq);
      for (let i = 0; i < 6; i++) {
        const p1 = f.at((i / 6) * TAU + k * 2, 0.85);
        const p2 = f.at(((i + 2) / 6) * TAU + k * 2, 0.85);
        g.lineBetween(p1.x, p1.y, p2.x, p2.y);
      }
    }
    const grow = out(k / 0.5);
    const fade = Math.sin(Math.PI * clamp01(k * 0.95 + 0.03));
    for (const p of puffs) {
      const x = p.at.x + Math.sin(k * 3 + p.phase) * 3;
      const y = p.at.y - p.drift * k * f.s;
      g.fillStyle(0x3a6a22, 0.36 * fade).fillEllipse(x, y, p.size * 2 * grow, p.size * 1.4 * grow);
      g.fillStyle(0x7ab84a, 0.36 * fade).fillEllipse(
        x,
        y - 2,
        p.size * 1.5 * grow,
        p.size * 1.0 * grow,
      );
      g.fillStyle(0xb8e878, 0.28 * fade).fillEllipse(
        x - 2,
        y - 3,
        p.size * 0.8 * grow,
        p.size * 0.5 * grow,
      );
    }
  });
}

// ---- Holy ground and fire ------------------------------------------------------------------------

/** A column of golden light stands on the spot, a ring runs out and rays spread over the ground. */
function holy(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  m.host.em.mote.explode(a.light ? 3 : 12, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0xffe39a, 1.6, 0.3);
  m.add(0.9, true, (g, k) => {
    const rise = out(k / 0.15);
    const fall = 1 - clamp01((k - 0.35) / 0.65);
    const h = 100 * f.s * rise;
    // A column of light that thins and fades as it climbs: slices, each a little narrower and dimmer than the one below.
    const slices = 10;
    for (let i = 0; i < slices; i++) {
      const t0 = i / slices;
      const w = 9 * f.s * (1 - 0.5 * t0);
      const al = (1 - t0) * fall;
      g.fillStyle(0xffe39a, 0.16 * al).fillRect(
        f.p.x - w,
        f.p.y - h * (t0 + 0.1),
        w * 2,
        (h / slices) * 1.1,
      );
      g.fillStyle(0xfff4d0, 0.3 * al).fillRect(
        f.p.x - w * 0.45,
        f.p.y - h * (t0 + 0.1),
        w * 0.9,
        (h / slices) * 1.1,
      );
    }
    const ring = out(k / 0.5);
    g.lineStyle(2.5, 0xffe39a, 0.8 * (1 - ring));
    g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * ring, f.rx * 2 * ring * f.sq);
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * TAU;
      const p1 = f.at(ang, 0.1);
      const p2 = f.at(ang, 0.95 * ring);
      g.lineStyle(1, 0xfff0c0, 0.6 * fall).lineBetween(p1.x, p1.y, p2.x, p2.y);
    }
  });
}

// ---- Steel, shards and teeth ---------------------------------------------------------------------

/** Fragments fly out from the point of the blow, trailing sparks, and stick in the ground. */
function shrapnel(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 1.7 + a.y * 9.3;
  const n = a.light ? 6 : 16;
  const bits = Array.from({ length: n }, (_, i) => ({
    ang: (i / n) * TAU + rnd(seed, i) * 0.4,
    reach: 0.55 + 0.5 * rnd(seed, i + 30),
    up: 4 + 8 * rnd(seed, i + 60),
  }));
  m.host.em.spark.explode(a.light ? 3 : 10, f.p.x, f.p.y);
  if (!a.light) flash(m, a, 0xffd090, 1.8, 0.45);
  m.add(0.7, true, (g, k) => {
    const t = clamp01(k / 0.45);
    const fade = 1 - clamp01((k - 0.5) / 0.5);
    for (const b of bits) {
      const head = f.at(b.ang, b.reach * out(t));
      const tail = f.at(b.ang, b.reach * out(Math.max(0, t - 0.18)));
      const lift = b.up * arch(t) * f.s;
      if (t < 1) {
        stroke(
          g,
          [
            { x: tail.x, y: tail.y - lift },
            { x: head.x, y: head.y - lift },
          ],
          1.6,
          0xffc060,
          0.8,
        );
        g.fillStyle(0xe6e0d4, 0.95).fillRect(head.x - 1, head.y - lift - 1, 2.5, 2.5);
      } else {
        g.fillStyle(0xe6e0d4, 0.9 * fade).fillRect(head.x - 1, head.y - 3, 1.5, 4);
      }
    }
  });
}

/** Blades of steel come down on the area and stand in the ground a moment. */
function blades(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 3.1 + a.y * 5.3;
  const n = a.light ? 4 : 9;
  const falling = Array.from({ length: n }, (_, i) => ({
    at: f.at(i * 2.39996 + seed, 0.9 * Math.sqrt((i + 0.5) / n)),
    wait: (i / n) * 0.3,
  })).sort((u, v) => u.at.y - v.at.y);
  m.add(0.9, true, (g, k) => {
    for (const b of falling) {
      const t = (k - b.wait) / 0.22;
      if (t < 0) continue;
      const fade = 1 - clamp01((k - b.wait - 0.45) / 0.4);
      if (fade <= 0) continue;
      const drop = t < 1 ? (1 - out(t)) * 90 * f.s : 0;
      const tipY = b.at.y - drop;
      // A long thin blade point-down, a lit edge and a dark one, with a streak behind it while it falls.
      if (t < 1)
        stroke(
          g,
          [
            { x: b.at.x - 3, y: tipY - 34 },
            { x: b.at.x - 1, y: tipY - 12 },
          ],
          1.5,
          0xffffff,
          0.35,
        );
      poly(
        g,
        [
          { x: b.at.x - 2, y: tipY - 16 },
          { x: b.at.x, y: tipY },
          { x: b.at.x, y: tipY - 16 },
        ],
        0xf2eee4,
        0.95 * fade,
      );
      poly(
        g,
        [
          { x: b.at.x, y: tipY - 16 },
          { x: b.at.x, y: tipY },
          { x: b.at.x + 2, y: tipY - 16 },
        ],
        0xa8a496,
        0.95 * fade,
      );
      g.fillStyle(0x5a4a38, fade).fillRect(b.at.x - 2.5, tipY - 19, 5, 3);
      if (t >= 1 && t < 1.4)
        g.lineStyle(1.5, 0xe6e0d4, 0.7 * (1 - (t - 1) / 0.4)).strokeEllipse(
          b.at.x,
          b.at.y,
          12 * (t - 0.9),
          6 * (t - 0.9),
        );
    }
  });
}

/** Two rows of iron teeth close on the spot and hold. */
function jaws(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const teeth = 6;
  m.host.em.spark.explode(a.light ? 2 : 6, f.p.x, f.p.y);
  m.host.em.dust.explode(a.light ? 1 : 4, f.p.x, f.p.y);
  if (!a.light) m.host.shake(2);
  m.add(0.95, false, (g, k) => {
    const close = out(k / 0.2);
    const fade = 1 - clamp01((k - 0.7) / 0.3);
    const gap = 0.85 * (1 - close) + 0.1;
    // Rows lie on either side of the spot along one axis and rise toward each other.
    for (const side of [-1, 1]) {
      for (let i = 0; i < teeth; i++) {
        const along = ((i + 0.5) / teeth - 0.5) * 1.5;
        const p = f.at(0, 0);
        const x = p.x + along * f.rx * 0.6 * 1.3;
        const y = p.y + side * gap * f.rx * f.sq * 0.9 + along * 3;
        const h = (16 + (i % 2) * 4) * f.s * (0.4 + 0.6 * close);
        // Teeth point toward the middle: up for the far row, down for the near one.
        const dir = -side;
        poly(
          g,
          [
            { x: x - 4.2 * f.s, y },
            { x, y: y + dir * h },
            { x: x + 3.4 * f.s, y },
          ],
          0xcfc8b8,
          0.95 * fade,
        );
        poly(
          g,
          [
            { x, y },
            { x, y: y + dir * h },
            { x: x + 3.4 * f.s, y },
          ],
          0x7a766a,
          0.95 * fade,
        );
      }
      g.lineStyle(3 * f.s, 0x3a3630, 0.9 * fade);
      g.lineBetween(
        f.p.x - f.rx * 0.5,
        f.p.y + side * gap * f.rx * f.sq * 0.9,
        f.p.x + f.rx * 0.5,
        f.p.y + side * gap * f.rx * f.sq * 0.9,
      );
    }
    if (k > 0.18 && k < 0.4) {
      const s = (k - 0.18) / 0.22;
      g.lineStyle(2, 0xffffff, 0.8 * (1 - s)).strokeEllipse(
        f.p.x,
        f.p.y,
        f.rx * 1.2 * s,
        f.rx * 1.2 * s * f.sq,
      );
    }
  });
}

/** Motes are drawn in from the edge to the centre in curving trails. */
function drain(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  const seed = a.x * 4.1 + a.y * 7.9;
  const n = a.light ? 6 : 16;
  const motes = Array.from({ length: n }, (_, i) => ({
    ang: (i / n) * TAU + rnd(seed, i) * 0.4,
    delay: rnd(seed, i + 30) * 0.4,
    color: i % 3 === 0 ? 0xff6070 : i % 3 === 1 ? 0x70a8ff : a.color,
  }));
  m.add(1.1, true, (g, k) => {
    const edge = 1 - clamp01((k - 0.6) / 0.4);
    g.lineStyle(1.5, a.color, 0.5 * edge).strokeEllipse(
      f.p.x,
      f.p.y,
      f.rx * 2 * 0.95,
      f.rx * 2 * 0.95 * f.sq,
    );
    for (const mt of motes) {
      const t = clamp01((k - mt.delay) / 0.6);
      if (t <= 0 || t >= 1) continue;
      const pts: Pt[] = [];
      for (let j = 0; j < 5; j++) {
        const tt = Math.max(0, t - j * 0.05);
        pts.push(f.at(mt.ang + (1 - tt) * 1.4, 0.95 * (1 - tt * tt)));
      }
      stroke(g, pts, 2, mt.color, 0.5 * (1 - t));
      g.fillStyle(0xffffff, 0.9 * (1 - t)).fillCircle(pts[0].x, pts[0].y, 1.6);
    }
  });
}

/** A bright crescent sweeps all the way round the caster and a ring of dust follows it. */
function swingNova(m: MotifHost, a: MotifArea): void {
  const f = frameOf(m.host, a);
  m.host.em.dust.explode(a.light ? 2 : 8, f.p.x, f.p.y);
  if (!a.light) m.host.shake(2);
  m.add(0.6, true, (g, k) => {
    const sweep = out(k / 0.4) * TAU;
    const fade = 1 - clamp01((k - 0.4) / 0.6);
    const head = -Math.PI / 2 + sweep;
    const steps = 20;
    const trail = Math.min(sweep, 2.6);
    const pts: Pt[] = [];
    for (let i = 0; i <= steps; i++) pts.push(f.at(head - trail * (1 - i / steps), 0.88));
    stroke(g, pts.slice(0, 8), 3 * f.s, 0xeadfc8, 0.2 * fade);
    stroke(g, pts.slice(6, 14), 4 * f.s, 0xeadfc8, 0.45 * fade);
    stroke(g, pts.slice(12), 5 * f.s, 0xffffff, 0.9 * fade);
  });
  m.add(0.6, false, (g, k) => {
    const ring = out(k / 0.5);
    g.lineStyle(4 * f.s, 0x8a7a68, 0.4 * (1 - k));
    g.strokeEllipse(f.p.x, f.p.y, f.rx * 2 * ring, f.rx * 2 * ring * f.sq);
  });
}

/** A front of force runs down a band, throwing dust up before it and flattening the ground behind. */
function forceWave(m: MotifHost, a: MotifArea): void {
  const s = a.strip ?? [a.x - a.r, a.y, a.x + a.r, a.y];
  const f = frameOf(m.host, a);
  const from = m.host.project(s[0], s[1]);
  const to = m.host.project(s[2], s[3]);
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const wide = m.host.rpx(a.r) * 0.9;
  m.host.em.dust.explode(a.light ? 2 : 6, from.x, from.y);
  m.add(0.7, false, (g, k) => {
    const run = out(k / 0.5);
    const fade = 1 - clamp01((k - 0.45) / 0.55);
    const head = { x: from.x + (to.x - from.x) * run, y: from.y + (to.y - from.y) * run };
    // The flattened ground behind the front, then the front itself: a chevron leaning back from its point.
    poly(
      g,
      [
        { x: from.x + nx * wide * 0.5, y: from.y + ny * wide * 0.5 * f.sq },
        { x: head.x + nx * wide * 0.5, y: head.y + ny * wide * 0.5 * f.sq },
        { x: head.x - nx * wide * 0.5, y: head.y - ny * wide * 0.5 * f.sq },
        { x: from.x - nx * wide * 0.5, y: from.y - ny * wide * 0.5 * f.sq },
      ],
      0xeadfc8,
      0.24 * fade,
    );
    const back = 18 * f.s;
    const bx = Math.cos(ang) * back;
    const by = Math.sin(ang) * back * 0.5;
    stroke(
      g,
      [
        { x: head.x - bx + nx * wide, y: head.y - by + ny * wide * f.sq },
        head,
        { x: head.x - bx - nx * wide, y: head.y - by - ny * wide * f.sq },
      ],
      3 * f.s,
      0xeadfc8,
      0.95 * fade,
    );
    stroke(
      g,
      [
        { x: head.x - bx * 0.5 + nx * wide * 0.5, y: head.y - by * 0.5 + ny * wide * 0.5 * f.sq },
        head,
        { x: head.x - bx * 0.5 - nx * wide * 0.5, y: head.y - by * 0.5 - ny * wide * 0.5 * f.sq },
      ],
      1.5,
      0xffffff,
      0.9 * fade,
    );
    for (let i = 0; i < 8; i++) {
      const lane = (rnd(a.x + a.y, i) - 0.5) * 2 * wide * 0.8;
      const t0 = Math.max(0, run - 0.3 - 0.2 * rnd(a.x, i + 9));
      const p1 = {
        x: from.x + (to.x - from.x) * t0 + nx * lane,
        y: from.y + (to.y - from.y) * t0 + ny * lane * f.sq,
      };
      const p2 = {
        x: from.x + (to.x - from.x) * run + nx * lane,
        y: from.y + (to.y - from.y) * run + ny * lane * f.sq,
      };
      stroke(g, [p1, p2], 1, 0xcbbd9e, 0.5 * fade);
    }
  });
}

/** A drifting breath of sickly green runs down a band, thickening as it goes. */
function breath(m: MotifHost, a: MotifArea): void {
  const s = a.strip ?? [a.x - a.r, a.y, a.x + a.r, a.y];
  const f = frameOf(m.host, a);
  const from = m.host.project(s[0], s[1]);
  const to = m.host.project(s[2], s[3]);
  const seed = a.x * 2.9 + a.y * 6.1;
  const n = a.light ? 5 : 12;
  const puffs = Array.from({ length: n }, (_, i) => ({
    t: (i + 0.5) / n,
    off: (rnd(seed, i) - 0.5) * 1.3,
    size: 7 + 7 * rnd(seed, i + 30),
  }));
  const wide = m.host.rpx(a.r);
  m.host.em.poison.explode(a.light ? 2 : 6, from.x, from.y);
  m.add(0.9, false, (g, k) => {
    const run = out(k / 0.5);
    const fade = Math.sin(Math.PI * clamp01(k * 0.95 + 0.04));
    for (const p of puffs) {
      if (p.t > run) continue;
      const grow = 0.5 + p.t * 0.9;
      const x =
        from.x +
        (to.x - from.x) * p.t +
        -Math.sin(Math.atan2(to.y - from.y, to.x - from.x)) * wide * p.off * 0.5;
      const y =
        from.y +
        (to.y - from.y) * p.t +
        Math.cos(Math.atan2(to.y - from.y, to.x - from.x)) * wide * p.off * 0.25 -
        8 * k * f.s;
      g.fillStyle(0x3a6a22, 0.36 * fade).fillEllipse(x, y, p.size * 2 * grow, p.size * 1.3 * grow);
      g.fillStyle(0x9ad060, 0.2 * fade).fillEllipse(
        x,
        y - 1,
        p.size * 1.2 * grow,
        p.size * 0.8 * grow,
      );
    }
  });
}

const PLAYERS: Record<Motif, (m: MotifHost, a: MotifArea) => void> = {
  quake: (m, a) => quake(m, a, 0),
  quakeWave: (m, a) => quake(m, a, 2),
  boneSpikes: (m, a) => spikes(m, a, 'boneSpikes'),
  stoneSpikes: (m, a) => spikes(m, a, 'stoneSpikes'),
  iceSpikes: (m, a) => spikes(m, a, 'iceSpikes'),
  frostBloom: (m, a) => frostBloom(m, a, false),
  freeze: (m, a) => frostBloom(m, a, true),
  iceShatter,
  iceWaves,
  iceNova,
  whirlFrost: (m, a) => whirl(m, a, 0xcfeeff, false),
  flames: (m, a) => flames(m, a, true),
  geyser,
  fireball,
  fireNova,
  flameLine,
  lava,
  splat,
  strike: (m, a) => strike(m, a, 1),
  storm: (m, a) => strike(m, a, 4),
  pillar,
  crackleNova,
  crackleLine,
  cloud: (m, a) => cloud(m, a, false),
  ritual: (m, a) => cloud(m, a, true),
  holy,
  shrapnel,
  jaws,
  drain,
  blades,
  swingNova,
  whirlBlades: (m, a) => whirl(m, a, 0xe6e0d4, true),
  forceWave,
  breath,
  rain: () => undefined,
};

/** The names of the motifs this file draws (the coverage test checks it against `MOTIFS`). */
export const DRAWN_MOTIFS = Object.keys(PLAYERS) as Motif[];

/** Play a motif in an area. */
export function playMotif(m: MotifHost, motif: Motif, a: MotifArea): void {
  PLAYERS[motif](m, a);
}

/** What a motif leaves on the ground for good: a scorch mark, or a crack in the floor. */
export const MOTIF_DECAL: Partial<Record<Motif, 'scorch' | 'crack'>> = {
  quake: 'crack',
  quakeWave: 'crack',
  lava: 'scorch',
  flames: 'scorch',
  geyser: 'scorch',
  fireball: 'scorch',
  fireNova: 'scorch',
  splat: 'scorch',
};
