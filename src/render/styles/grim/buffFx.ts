import type Phaser from 'phaser';
import type { BuffId } from '../../../data/buffs';
import type { Actor } from '../../../sim/types';
import type { FxHost } from './skillFx';

/**
 * What a buff that is up looks like on the character: a small mark of a kind that says what sort of buff it is (speed leaves
 * streaks behind, a guard is plates or a halo, a surge of power circles the body, a rage gives off embers, and so on), in a colour
 * of its own. Every buff has one, and no two buffs of a kind share a colour (buffFx.test.ts).
 *
 * Buffs that are up together combine by kind: each kind has its own place on the body (a halo over the head, plates close round
 * the torso, motes on a wider ring, streaks behind, stances and storms on the ground), and buffs of one kind share that place
 * rather than drawing over each other: the plates of three buffs are one ring of plates in three colours, two halos stack, two
 * stances are rings one inside the other, and so on.
 */

type Gfx = Phaser.GameObjects.Graphics;

export type Motif =
  | 'halo'
  | 'plates'
  | 'orbit'
  | 'rise'
  | 'embers'
  | 'streaks'
  | 'smoke'
  | 'crackle'
  | 'cross'
  | 'flag'
  | 'wings'
  | 'stance'
  | 'spin';

export type BuffLook = { motif: Motif; color: number };

export const BUFF_LOOK: Record<BuffId, BuffLook> = {
  fortify: { motif: 'halo', color: 0xe0c060 },
  deathless: { motif: 'halo', color: 0xffffff },
  onslaught: { motif: 'streaks', color: 0xffd040 },
  combatRush: { motif: 'streaks', color: 0xff7020 },
  adrenaline: { motif: 'streaks', color: 0xff3060 },
  flickerStep: { motif: 'streaks', color: 0xe8f0f8 },
  phaseRun: { motif: 'streaks', color: 0x4080ff },
  phaseStrike: { motif: 'streaks', color: 0xc060ff },
  unholyMight: { motif: 'orbit', color: 0xb040ff },
  arcaneSurge: { motif: 'orbit', color: 0x3070ff },
  decoyTotem: { motif: 'orbit', color: 0xd0d8d8 },
  offeringSpirit: { motif: 'orbit', color: 0x30e0b0 },
  infusion: { motif: 'orbit', color: 0xff80e0 },
  steelHide: { motif: 'plates', color: 0x9aa8b8 },
  enduringCry: { motif: 'plates', color: 0xf0c030 },
  offeringBone: { motif: 'plates', color: 0xf0ead0 },
  guardianCairn: { motif: 'plates', color: 0x6a8a6a },
  warchiefCairn: { motif: 'plates', color: 0xb86a3a },
  rallyingCry: { motif: 'rise', color: 0xffd870 },
  offeringFlesh: { motif: 'rise', color: 0xe05080 },
  punisher: { motif: 'rise', color: 0x9a5a2a },
  elusive: { motif: 'rise', color: 0x50ffd0 },
  bloodSurge: { motif: 'embers', color: 0xa01030 },
  moltenGuard: { motif: 'embers', color: 0xff8a20 },
  infernalCry: { motif: 'embers', color: 0xffe060 },
  berserk: { motif: 'embers', color: 0xff2020 },
  witherStep: { motif: 'smoke', color: 0x80b040 },
  smokeScreen: { motif: 'smoke', color: 0xb0b0b8 },
  catStealth: { motif: 'smoke', color: 0x3a7a9a },
  smiteAura: { motif: 'crackle', color: 0xffe060 },
  innervation: { motif: 'crackle', color: 0x70b0ff },
  regenTotem: { motif: 'cross', color: 0x60e080 },
  warBanner: { motif: 'flag', color: 0xe05050 },
  dreadBanner: { motif: 'flag', color: 0x9060d0 },
  avianBoon: { motif: 'wings', color: 0xd8e8ff },
  bloodStance: { motif: 'stance', color: 0xd03040 },
  sandStance: { motif: 'stance', color: 0xd8b060 },
  bladestormBlood: { motif: 'spin', color: 0xff6070 },
  bladestormSand: { motif: 'spin', color: 0xe8c878 },
};

/** A buff that is up: which, and how strongly to draw it (1, less while it is about to end). */
export type BuffMark = { id: BuffId; alpha: number };

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** A small pseudo-random number from a seed, for flicker that holds still between steps. */
const rnd = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Member = { c: number; hi: number; a: number };
type Ctx = {
  air: Gfx;
  ground: Gfx;
  host: FxHost;
  p: Actor;
  /** The character's feet on screen, and the middle of its body. */
  ox: number;
  oy: number;
  cx: number;
  cy: number;
  time: number;
};

/** The order the kinds are drawn in: the ground first, then what is close to the body, then what is above it. */
const ORDER: Motif[] = [
  'stance',
  'spin',
  'smoke',
  'wings',
  'streaks',
  'plates',
  'embers',
  'rise',
  'cross',
  'orbit',
  'crackle',
  'flag',
  'halo',
];

/** Draw every buff that is up on the character `p`. `air` is the additive layer (light), `ground` the layer under the figures. */
export function drawBuffs(
  air: Gfx,
  ground: Gfx,
  host: FxHost,
  p: Actor,
  marks: readonly BuffMark[],
  time: number,
): void {
  if (marks.length === 0) return;
  const o = host.project(p.x, p.y);
  const cx = { air, ground, host, p, ox: o.x, oy: o.y, cx: o.x, cy: o.y - 11, time };
  const by = new Map<Motif, Member[]>();
  for (const m of marks) {
    const l = BUFF_LOOK[m.id];
    const list = by.get(l.motif) ?? [];
    list.push({ c: l.color, hi: lighten(l.color, 0.5), a: m.alpha });
    by.set(l.motif, list);
  }
  for (const motif of ORDER) {
    const list = by.get(motif);
    if (list) DRAW[motif](cx, list);
  }
}

const DRAW: Record<Motif, (x: Ctx, m: Member[]) => void> = {
  // Over the head, one above the other.
  halo(x, ms) {
    ms.forEach((m, j) => {
      const hy = x.oy - 31 - j * 6;
      const pulse = 0.8 + 0.2 * Math.sin(x.time * 3 + j);
      x.air.fillStyle(m.c, 0.18 * m.a * pulse).fillEllipse(x.cx, hy, 16, 7);
      x.air.lineStyle(1.5, m.c, 0.9 * m.a).strokeEllipse(x.cx, hy, 12 * pulse, 5 * pulse);
      x.air
        .fillStyle(0xffffff, 0.8 * m.a)
        .fillCircle(x.cx + Math.cos(x.time * 2 + j) * 6, hy + Math.sin(x.time * 2 + j) * 2.5, 1.2);
    });
  },
  // One tight ring of plates round the torso, the colours taking turns.
  plates(x, ms) {
    const n = Math.max(4, ms.length * 3);
    for (let i = 0; i < n; i++) {
      const m = ms[i % ms.length];
      const a = x.time * 1.4 + (i / n) * Math.PI * 2;
      const px = x.cx + Math.cos(a) * 9;
      const py = x.cy + Math.sin(a) * 4.5;
      const front = Math.sin(a) > 0 ? 1 : 0.55;
      x.air.fillStyle(m.c, 0.9 * m.a * front).fillRect(px - 1.5, py - 3, 3, 6);
      x.air.fillStyle(m.hi, 0.8 * m.a * front).fillRect(px - 1.5, py - 3, 1, 6);
    }
  },
  // One wider, higher ring of motes, the colours taking turns.
  orbit(x, ms) {
    const n = Math.max(3, ms.length * 3);
    for (let i = 0; i < n; i++) {
      const m = ms[i % ms.length];
      const a = -x.time * 2.6 + (i / n) * Math.PI * 2;
      const px = x.cx + Math.cos(a) * 14;
      const py = x.cy - 7 + Math.sin(a) * 6;
      x.air.fillStyle(m.c, 0.3 * m.a).fillCircle(px, py, 4);
      x.air.fillStyle(m.hi, 0.95 * m.a).fillCircle(px, py, 1.7);
    }
  },
  // Glints that climb from the feet, spread across the width of the body.
  rise(x, ms) {
    const n = ms.length * 4;
    for (let i = 0; i < n; i++) {
      const m = ms[i % ms.length];
      const k = (x.time * 0.9 + i / n) % 1;
      const px = x.cx + ((i + 0.5) / n - 0.5) * 18 + Math.sin(x.time * 3 + i * 2) * 1.5;
      const py = x.oy - 2 - k * 32;
      const a = Math.sin(k * Math.PI) * m.a;
      x.air.fillStyle(m.c, 0.3 * a).fillCircle(px, py, 3);
      x.air.fillStyle(m.hi, 0.95 * a).fillCircle(px, py, 1.4);
    }
  },
  // A glow round the body and sparks that fly up from it, in each buff's colour.
  embers(x, ms) {
    const flick = 0.7 + 0.3 * Math.sin(x.time * 14);
    for (const m of ms)
      x.air
        .fillStyle(m.c, (0.14 / Math.sqrt(ms.length)) * m.a * flick)
        .fillEllipse(x.cx, x.cy - 2, 22, 28);
    const n = ms.length * 6;
    for (let i = 0; i < n; i++) {
      const m = ms[i % ms.length];
      const k = (x.time * 1.6 + i / n + rnd(i) * 0.3) % 1;
      const px = x.cx + (rnd(i * 3) - 0.5) * 16 + Math.sin(x.time * 6 + i) * 1.5;
      const py = x.oy - 6 - k * 30;
      x.air
        .fillStyle(lighten(m.c, 0.3 + 0.4 * k), 0.95 * (1 - k) * m.a)
        .fillRect(px - 1, py - 1, 2, 2);
    }
  },
  // Behind the character, against the way it faces: a fan, a line for each buff.
  streaks(x, ms) {
    const b = x.host.project(
      x.p.x - Math.cos(x.p.facing) * 1.1,
      x.p.y - Math.sin(x.p.facing) * 1.1,
    );
    const dx = b.x - x.ox;
    const dy = b.y - x.oy;
    const n = Math.max(3, ms.length * 2);
    for (let i = 0; i < n; i++) {
      const m = ms[i % ms.length];
      const off = ((i + 0.5) / n - 0.5) * 16;
      const len = 0.55 + 0.45 * rnd(Math.floor(x.time * 12) + i * 7);
      const x0 = x.cx + off * 0.6;
      const y0 = x.cy + off;
      x.air.lineStyle(3, m.c, 0.25 * m.a).lineBetween(x0, y0, x0 + dx * len, y0 + dy * len);
      x.air.lineStyle(1, m.hi, 0.85 * m.a).lineBetween(x0, y0, x0 + dx * len, y0 + dy * len);
    }
  },
  // Puffs at the feet that thin as they climb.
  smoke(x, ms) {
    const n = ms.length * 4;
    for (let i = 0; i < n; i++) {
      const m = ms[i % ms.length];
      const k = (x.time * 0.5 + i / n) % 1;
      const px = x.cx + Math.sin(x.time + i * 1.7) * 7;
      const py = x.oy - 3 - k * 16;
      x.air.fillStyle(lighten(m.c, 0.25), 0.5 * (1 - k) * m.a).fillCircle(px, py, 3 + k * 5);
    }
  },
  // A jagged bolt for each buff, each its own way out of the body.
  crackle(x, ms) {
    const step = Math.floor(x.time * 10);
    ms.forEach((m, l) => {
      const a = rnd(step * 2 + l * 9) * Math.PI + (l % 2) * Math.PI;
      let px = x.cx + Math.cos(a) * 4;
      let py = x.cy + Math.sin(a) * 4;
      x.air
        .lineStyle(1, m.hi, 0.95 * m.a)
        .beginPath()
        .moveTo(px, py);
      for (let s = 0; s < 3; s++) {
        px += Math.cos(a) * 4 + (rnd(step + s * 5 + l) - 0.5) * 6;
        py += Math.sin(a) * 3 + (rnd(step + s * 7 + l) - 0.5) * 6;
        x.air.lineTo(px, py);
      }
      x.air.strokePath();
      x.air.fillStyle(m.c, 0.35 * m.a).fillCircle(px, py, 3);
    });
  },
  // Plus signs that climb at the sides.
  cross(x, ms) {
    const n = ms.length * 2;
    for (let i = 0; i < n; i++) {
      const m = ms[i % ms.length];
      const k = (x.time * 0.7 + i * 0.5) % 1;
      const px = x.cx + (i % 2 ? 7 : -7);
      const py = x.oy - 4 - k * 28;
      const a = Math.sin(k * Math.PI) * m.a;
      x.air.lineStyle(2, m.c, 0.95 * a).lineBetween(px - 2.5, py, px + 2.5, py);
      x.air.lineStyle(2, m.c, 0.95 * a).lineBetween(px, py - 2.5, px, py + 2.5);
    }
  },
  // A small flag on the shoulder, the next on the other shoulder.
  flag(x, ms) {
    ms.forEach((m, j) => {
      const side = j % 2 ? -1 : 1;
      const px = x.cx + side * (8 + Math.floor(j / 2) * 6);
      const top = x.oy - 34 + Math.floor(j / 2) * 3;
      x.air.lineStyle(1, 0xd8c8a0, 0.9 * m.a).lineBetween(px, x.oy - 12, px, top);
      const w = Math.sin(x.time * 4 + j);
      x.air
        .fillStyle(m.c, 0.95 * m.a)
        .fillTriangle(px, top, px, top + 7, px + side * (9 + w * 1.5), top + 3.5 + w);
      x.air.fillStyle(m.c, 0.25 * m.a).fillCircle(px + side * 4, top + 3.5, 6);
    });
  },
  wings(x, ms) {
    const m = ms[0];
    const flap = Math.sin(x.time * 6);
    for (const s of [-1, 1]) {
      const tipX = x.cx + s * (11 + flap * 2);
      const tipY = x.cy - 10 - flap * 3;
      x.air
        .fillStyle(m.c, 0.35 * m.a)
        .fillTriangle(x.cx + s * 3, x.cy - 2, tipX, tipY, x.cx + s * 8, x.cy + 3);
      x.air.lineStyle(1, 0xffffff, 0.8 * m.a).lineBetween(x.cx + s * 3, x.cy - 2, tipX, tipY);
    }
  },
  // Rings on the ground, one inside the other.
  stance(x, ms) {
    const sq = x.host.squash();
    ms.forEach((m, j) => {
      const rx = x.host.rpx(0.75 + j * 0.2);
      x.ground.fillStyle(m.c, 0.1 * m.a).fillEllipse(x.ox, x.oy, rx * 2, rx * 2 * sq);
      x.ground.lineStyle(1.5, m.c, 0.75 * m.a).strokeEllipse(x.ox, x.oy, rx * 2, rx * 2 * sq);
      for (let i = 0; i < 6; i++) {
        const a = x.time * 0.9 * (j % 2 ? -1 : 1) + (i / 6) * Math.PI * 2;
        x.ground
          .fillStyle(m.hi, 0.9 * m.a)
          .fillRect(x.ox + Math.cos(a) * rx - 1, x.oy + Math.sin(a) * rx * sq - 1, 2, 2);
      }
    });
  },
  // Short blades sweeping round the feet on a ring outside the stance rings.
  spin(x, ms) {
    const sq = x.host.squash();
    const rx = x.host.rpx(1.1);
    const n = Math.max(3, ms.length * 3);
    for (let i = 0; i < n; i++) {
      const m = ms[i % ms.length];
      const a = x.time * 5 + (i / n) * Math.PI * 2;
      const px = x.ox + Math.cos(a) * rx;
      const py = x.oy + Math.sin(a) * rx * sq;
      const tx = -Math.sin(a) * 5;
      const ty = Math.cos(a) * 5 * sq;
      x.air.lineStyle(3, m.c, 0.3 * m.a).lineBetween(px, py, px - tx, py - ty);
      x.air.lineStyle(1.5, m.hi, 0.9 * m.a).lineBetween(px, py, px - tx, py - ty);
    }
  },
};
