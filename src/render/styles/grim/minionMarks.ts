import type Phaser from 'phaser';

/**
 * The small drawings of a minion's blows and tells (docs/VISUAL_LANGUAGE.md, "Minions"): the body a ranged blow flies as, the
 * marks an offering, a golem, a relic, a mote or a burning aura leave on a minion. All of them take screen points and draw into
 * a graphics object; `skillFx.ts` decides when and where. They are tiny on purpose: a minion build has many of them at once.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** A fixed number from 0 to 1 for a pair of numbers (the jags of a bolt hold still between frames). */
const hash2 = (a: number, b: number): number => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Seconds a ranged blow takes to fly, and how long its landing ring lasts after it (the damage is instant). */
export const SHOT_FLIGHT = 0.14;
export const SHOT_LAND = 0.1;

const lerp = (a: Pt, b: Pt, f: number): Pt => ({
  x: a.x + (b.x - a.x) * f,
  y: a.y + (b.y - a.y) * f,
});

/** A jagged line of lightning from `a` to `b`, `seed` fixing the jags. */
export function zigzag(a: Pt, b: Pt, seed: number, jag: number, steps = 6): Pt[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts: Pt[] = [a];
  for (let i = 1; i < steps; i++) {
    const f = i / steps;
    const o = (hash2(seed, i) - 0.5) * 2 * jag;
    pts.push({ x: a.x + dx * f + nx * o, y: a.y + dy * f + ny * o });
  }
  pts.push(b);
  return pts;
}

/**
 * A ranged blow in flight from `a` to `b` (screen points, both lifted to a hand's height): `f` is how far along it is (0 to 1).
 * An arrow is a short shaft with a head, an orb a coloured core with a halo and a short tail, a bolt a jagged line of lightning.
 */
export function drawShot(
  g: Gfx,
  a: Pt,
  b: Pt,
  f: number,
  shot: 'arrow' | 'orb' | 'bolt',
  color: number,
  seed: number,
): void {
  const head = lerp(a, b, f);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  if (shot === 'arrow') {
    const tail = lerp(a, b, Math.max(0, f - 9 / len));
    g.lineStyle(2.6, 0x000000, 0.7).lineBetween(tail.x, tail.y, head.x, head.y);
    g.lineStyle(1.4, lighten(color, 0.3), 1).lineBetween(tail.x, tail.y, head.x, head.y);
    g.fillStyle(0xffffff, 1).fillTriangle(
      head.x + ux * 3.5,
      head.y + uy * 3.5,
      head.x - ux * 0.5 - uy * 1.8,
      head.y - uy * 0.5 + ux * 1.8,
      head.x - ux * 0.5 + uy * 1.8,
      head.y - uy * 0.5 - ux * 1.8,
    );
    return;
  }
  if (shot === 'bolt') {
    const tail = lerp(a, b, Math.max(0, f - 0.55));
    const pts = zigzag(tail, head, seed, 2.4, 5);
    for (const [w, c, al] of [
      [5, color, 0.3],
      [2.4, lighten(color, 0.35), 0.8],
      [1, 0xffffff, 1],
    ] as const) {
      g.lineStyle(w, c, al).beginPath().moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    }
    return;
  }
  // An orb: a short tail, a halo, a coloured core and a white heart.
  const tail = lerp(a, b, Math.max(0, f - 0.3));
  g.lineStyle(3, color, 0.35).lineBetween(tail.x, tail.y, head.x, head.y);
  g.fillStyle(color, 0.3).fillCircle(head.x, head.y, 5);
  g.fillStyle(color, 1).fillCircle(head.x, head.y, 2.6);
  g.fillStyle(0xffffff, 1).fillCircle(head.x - 0.4, head.y - 0.4, 1.2);
}

/** What a minion with an offering over it wears: a mote circling it, plates about it, or sparks rising off it. */
export function drawOfferingMark(
  g: Gfx,
  motif: 'orbit' | 'plates' | 'rise' | string,
  x: number,
  y: number,
  color: number,
  time: number,
  seed: number,
): void {
  const cy = y - 5;
  if (motif === 'orbit') {
    for (let i = 0; i < 2; i++) {
      const a = time * 3 + seed + i * Math.PI;
      const px = x + Math.cos(a) * 7;
      const py = cy + Math.sin(a) * 3.5;
      g.fillStyle(color, 0.95).fillCircle(px, py, 1.5);
      g.fillStyle(0xffffff, 0.9).fillCircle(px, py, 0.6);
    }
  } else if (motif === 'plates') {
    g.lineStyle(1.6, color, 0.85);
    for (let i = 0; i < 3; i++) {
      const a = time * 0.8 + seed + (i * Math.PI * 2) / 3;
      g.beginPath()
        .arc(x, cy, 6.5, a, a + 0.7)
        .strokePath();
    }
  } else {
    for (let i = 0; i < 2; i++) {
      const ph = (time * 0.9 + i * 0.5 + seed * 0.13) % 1;
      g.fillStyle(color, 0.9 * (1 - ph)).fillCircle(x + (i ? 3 : -3), cy - 3 - ph * 10, 1.1);
    }
  }
}

/** A small cross rising off a body that is being mended. */
export function drawMend(g: Gfx, x: number, y: number, time: number, seed: number): void {
  const ph = (time * 0.8 + seed * 0.37) % 1;
  const cx = x + Math.sin(seed * 3.1) * 3;
  const cy = y - 9 - ph * 8;
  g.lineStyle(1.2, 0x7ae08a, 0.9 * (1 - ph))
    .lineBetween(cx - 1.8, cy, cx + 1.8, cy)
    .lineBetween(cx, cy - 1.8, cx, cy + 1.8);
}

/** The relic: a small gold obelisk in a halo. */
export function drawRelicBody(g: Gfx, x: number, y: number, color: number, time: number): void {
  const breathe = 0.5 + 0.5 * Math.sin(time * 2.4);
  g.fillStyle(color, 0.12 + 0.1 * breathe).fillCircle(x, y - 7, 8 + breathe);
  g.lineStyle(1, lighten(color, 0.4), 0.55).strokeCircle(x, y - 7, 7.5 + breathe);
  g.fillStyle(0x000000, 0.7).fillTriangle(x - 4.5, y - 7, x, y - 14.5, x + 4.5, y - 7);
  g.fillStyle(0x000000, 0.7).fillTriangle(x - 4.5, y - 7, x, y + 0.5, x + 4.5, y - 7);
  g.fillStyle(color, 1).fillTriangle(x - 3.5, y - 7, x, y - 13, x + 3.5, y - 7);
  g.fillStyle(lighten(color, 0.4), 1).fillTriangle(x - 3.5, y - 7, x, y - 1, x + 3.5, y - 7);
  g.fillStyle(0xffffff, 0.9).fillCircle(x, y - 7, 1.1);
}

/** A mote: a small core with a rotor spinning about it (slower while it waits to set off another device). */
export function drawMoteBody(
  g: Gfx,
  x: number,
  y: number,
  color: number,
  time: number,
  idle: boolean,
  seed: number,
): void {
  const cy = y - 6;
  const a = time * (idle ? 3 : 11) + seed;
  g.fillStyle(color, 0.95).fillCircle(x, cy, 2.4);
  g.fillStyle(0xffffff, 0.9).fillCircle(x, cy, 1);
  g.lineStyle(1.2, lighten(color, 0.3), 0.9)
    .lineBetween(
      x + Math.cos(a) * 5,
      cy + Math.sin(a) * 2.5,
      x - Math.cos(a) * 5,
      cy - Math.sin(a) * 2.5,
    )
    .lineBetween(
      x + Math.cos(a + Math.PI / 2) * 5,
      cy + Math.sin(a + Math.PI / 2) * 2.5,
      x - Math.cos(a + Math.PI / 2) * 5,
      cy - Math.sin(a + Math.PI / 2) * 2.5,
    );
}

/** A golem: a heavier body, a block with a darker rim and a lit top. */
export function drawGolemBody(g: Gfx, x: number, y: number, color: number): void {
  g.fillStyle(0x000000, 0.8).fillRect(x - 6, y - 12, 12, 12);
  g.fillStyle(color, 1).fillRect(x - 5, y - 11, 10, 10);
  g.fillStyle(lighten(color, 0.35), 1).fillRect(x - 5, y - 11, 10, 3);
  g.fillStyle(0xffffff, 0.8)
    .fillRect(x - 3, y - 7, 2, 1.5)
    .fillRect(x + 1, y - 7, 2, 1.5);
}

/** A pip over a minion that a golem is adding damage to. */
export function drawBoostPip(g: Gfx, x: number, y: number, color: number): void {
  g.fillStyle(0x000000, 0.7).fillTriangle(x - 2.6, y - 12.4, x + 2.6, y - 12.4, x, y - 16.8);
  g.fillStyle(lighten(color, 0.3), 1).fillTriangle(x - 1.8, y - 13, x + 1.8, y - 13, x, y - 15.8);
}
