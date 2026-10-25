import type Phaser from 'phaser';
import { ELEMENT_COLOR } from '../../../calc/skillLook';
import type { Actor } from '../../../sim/types';
import { tongue, type MotifHost } from './areaMotifs';

/**
 * What was done to an enemy, shown at the moment it happens (docs/VISUAL_LANGUAGE.md, "On the enemy"). The lasting marks (the pips of
 * a status, the spears stuck in a body) are drawn from state by `render/style/statusMarks.ts`; these are the short effects the sim's events start:
 * a spear driven in or paid out, an ailment passed from one enemy to the next, a kill that sets its neighbours burning, a frozen body
 * shattering, and the flames on a pack of burning minions. They are thin and quick so that a pack of enemies can have them at once.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

const TAU = Math.PI * 2;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** A fixed pseudo-random number from 0 to 1 for a seed and an index. */
const rnd = (seed: number, i: number): number => {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** Pixels over the feet that a body's middle is (the effects aim at the chest). */
const CHEST = 10;

/** The emitter of the particles of a damage type (fire, cold, lightning, chaos, physical). */
const EMITTER = ['spark', 'bolt', 'ice', 'flame', 'poison'] as const;

const lifted = (m: MotifHost, x: number, y: number, lift = CHEST): Pt => {
  const p = m.host.project(x, y);
  return { x: p.x, y: p.y - lift };
};

/** The wood of a spear shaft, and the ring of the spears' bone-pale butts. */
export const SPEAR_COLOR = 0xb89a6a;

/** A spear was driven in: a short stab of light into the chest and a few chips. */
export function impaleStuck(m: MotifHost, x: number, y: number, seed: number): void {
  const c = lifted(m, x, y);
  const ang = -Math.PI / 2 + (rnd(seed, 1) - 0.5) * 2.2;
  m.add(0.16, true, (g, k) => {
    const len = 12 * (1 - k * k);
    g.lineStyle(3, ELEMENT_COLOR[0], 0.7 * (1 - k)).lineBetween(
      c.x + Math.cos(ang) * (len + 6),
      c.y + Math.sin(ang) * (len + 6) * 0.7,
      c.x,
      c.y,
    );
    g.lineStyle(1, 0xffffff, 0.95 * (1 - k)).lineBetween(
      c.x + Math.cos(ang) * (len + 6),
      c.y + Math.sin(ang) * (len + 6) * 0.7,
      c.x,
      c.y,
    );
  });
  m.host.em.spark?.explode(2, c.x, c.y);
}

/** The spears in a body paid out: `n` spears used up fly off in a burst of bone-pale spikes, and the rest of the body shivers. */
export function impalePaid(m: MotifHost, x: number, y: number, n: number, seed: number): void {
  const c = lifted(m, x, y);
  const spikes = Math.max(2, Math.min(5, n + 1));
  m.add(0.28, true, (g, k) => {
    const out = 1 - (1 - k) * (1 - k);
    const a = 1 - k;
    for (let i = 0; i < spikes; i++) {
      const ang = (i / spikes) * TAU + rnd(seed, i) * 0.8;
      const r0 = 4 + 5 * out;
      const r1 = 8 + 12 * out;
      const ex = Math.cos(ang);
      const ey = Math.sin(ang) * 0.7;
      g.lineStyle(2.5, ELEMENT_COLOR[0], 0.5 * a).lineBetween(
        c.x + ex * r0,
        c.y + ey * r0,
        c.x + ex * r1,
        c.y + ey * r1,
      );
      g.lineStyle(1, 0xffffff, 0.95 * a).lineBetween(
        c.x + ex * r0,
        c.y + ey * r0,
        c.x + ex * r1,
        c.y + ey * r1,
      );
    }
    g.fillStyle(0xffffff, 0.55 * a).fillCircle(c.x, c.y, 3 * (1 - k * 0.5));
  });
  m.host.em.bone?.explode(Math.min(4, 1 + n), c.x, c.y);
}

/** A frozen body breaks: shards of ice fly from it and fall, and a pale ring goes out. */
export function shatterBurst(m: MotifHost, x: number, y: number, big: boolean): void {
  const c = lifted(m, x, y);
  const shards = big ? 12 : 8;
  const ice = ELEMENT_COLOR[2];
  m.add(0.5, true, (g, k) => {
    const out = 1 - (1 - k) * (1 - k);
    for (let i = 0; i < shards; i++) {
      const ang = (i / shards) * TAU + rnd(i, 3) * 0.6;
      const speed = 10 + rnd(i, 5) * 16;
      // They fly out and fall.
      const px = c.x + Math.cos(ang) * speed * out;
      const py = c.y + Math.sin(ang) * speed * 0.6 * out + 22 * k * k;
      const s = 2.5 + rnd(i, 7) * 2.5;
      const spin = ang + k * 5 * (i % 2 ? 1 : -1);
      const dx = Math.cos(spin) * s;
      const dy = Math.sin(spin) * s * 0.7;
      const a = 1 - k * k;
      g.fillStyle(ice, 0.85 * a).fillTriangle(
        px - dx,
        py - dy,
        px + dx,
        py + dy,
        px + dy * 0.8,
        py - dx * 0.8,
      );
      g.fillStyle(0xffffff, 0.8 * a).fillCircle(px, py, 1);
    }
  });
  m.add(0.3, false, (g, k) => {
    const rx = m.host.rpx(0.4 + 0.9 * (1 - (1 - k) * (1 - k)));
    g.lineStyle(1, ice, 0.8 * (1 - k)).strokeEllipse(
      c.x,
      c.y + CHEST,
      rx * 2,
      rx * 2 * m.host.squash(),
    );
  });
  m.host.em.ice?.explode(big ? 18 : 12, c.x, c.y);
  m.host.flash(c.x, c.y, ice, 1, 0.18);
}

/**
 * An ailment or a debuff passed from one enemy to the next: a short arc in the colour of what it is, rising from the carrier to the new
 * target and fading, and a few motes of it at the target. The ailment's own marks on the target are drawn from its state as usual.
 */
export function spreadLink(m: MotifHost, from: Pt, to: Pt, dtype: number): void {
  const a = lifted(m, from.x, from.y);
  const b = lifted(m, to.x, to.y);
  const color = ELEMENT_COLOR[dtype] ?? ELEMENT_COLOR[0];
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const lift = 6 + dist * 0.25;
  const pts: Pt[] = [];
  const N = 8;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * lift,
    });
  }
  m.add(0.4, true, (g, k) => {
    // The head of the arc runs out to the target in the first half; the tail follows and fades.
    const head = clamp01(k * 2.2);
    const tail = clamp01((k - 0.25) * 1.6);
    const i0 = Math.floor(tail * N);
    const i1 = Math.max(i0 + 1, Math.ceil(head * N));
    const a1 = 1 - clamp01((k - 0.5) * 2);
    for (const [w, c, al] of [
      [5, color, 0.28],
      [2.5, lighten(color, 0.3), 0.75],
      [1, 0xffffff, 0.95],
    ] as const) {
      g.lineStyle(w, c, al * a1)
        .beginPath()
        .moveTo(pts[i0].x, pts[i0].y);
      for (let i = i0 + 1; i <= Math.min(N, i1); i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    }
    if (head >= 1) g.fillStyle(color, 0.6 * a1).fillCircle(b.x, b.y, 3 * (1 - k * 0.4));
  });
  const emitter = m.host.em[EMITTER[dtype] ?? 'spark'];
  emitter?.explode(3, b.x, b.y);
}

/**
 * A kill set the enemies round it burning: tongues of flame stand up round the edge of the ground the burn reaches, and sink. The ground's
 * own outline is `landed`'s, drawn by the caller; this is what is inside it.
 */
export function kindleRim(m: MotifHost, x: number, y: number, r: number, n: number): void {
  const o = m.host.project(x, y);
  const rx = m.host.rpx(r);
  const sq = m.host.squash();
  const tongues = 9;
  m.add(0.6, true, (g, k) => {
    const grow = Math.sin(clamp01(k * 1.2) * Math.PI);
    const reach = 0.35 + 0.65 * (1 - (1 - clamp01(k * 3)) * (1 - clamp01(k * 3)));
    for (let i = 0; i < tongues; i++) {
      const ang = (i / tongues) * TAU + rnd(i, 11) * 0.5;
      const px = o.x + Math.cos(ang) * rx * reach;
      const py = o.y + Math.sin(ang) * rx * reach * sq;
      tongue(
        g,
        px,
        py,
        2 + rnd(i, 2),
        4 + 8 * grow * (0.6 + 0.4 * rnd(i, 4)),
        Math.sin(k * 9 + i),
        0.9 * (1 - k * 0.6),
      );
    }
  });
  m.host.em.flame?.explode(Math.min(8, 3 + n), o.x, o.y - CHEST);
}

/**
 * A minion of a burning pack: tongues of flame about its body, which flicker (the picture of one is time-seeded, not a spray of
 * particles, since a pack burns ten at a time), and a thin ring of embers on the ground at the reach of its burn.
 */
export function burningMinion(
  air: Gfx,
  ground: Gfx,
  host: MotifHost['host'],
  m: Actor,
  reach: number,
  time: number,
): void {
  const o = host.project(m.x, m.y);
  const flick = (i: number): number =>
    0.65 + 0.35 * Math.sin(time * (11 + i * 3) + m.id * 1.7 + i * 2.1);
  for (let i = -1; i <= 1; i++) {
    const f = flick(i + 1);
    tongue(
      air,
      o.x + i * 3,
      o.y - 3 + Math.abs(i),
      2.4,
      6 + 4 * f,
      Math.sin(time * 5 + i + m.id) * 1.2,
      0.8,
    );
  }
  // The reach of the burn: a thin ring with embers turning on it.
  const rx = host.rpx(reach);
  const sq = host.squash();
  const fire = ELEMENT_COLOR[3];
  ground.lineStyle(1, fire, 0.22).strokeEllipse(o.x, o.y, rx * 2, rx * 2 * sq);
  ground.fillStyle(fire, 0.7);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU + time * 0.7 + m.id;
    ground.fillRect(o.x + Math.cos(ang) * rx - 1, o.y + Math.sin(ang) * rx * sq - 1, 2, 2);
  }
}
