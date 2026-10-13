import type Phaser from 'phaser';
import type { BuffId } from '../../../data/buffs';
import type { Actor } from '../../../sim/types';
import type { FxHost } from './skillFx';

/**
 * What a buff that is up looks like on the character: a small mark in its own colour, of a kind that says what sort of buff it
 * is (speed leaves streaks behind, a guard is plates or a halo, a surge of power circles the body, a rage gives off embers, and so
 * on). Every buff has one (buffFx.test.ts), and several at once are told apart by the kind and the colour.
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
  | 'stance';

export type BuffLook = { motif: Motif; color: number };

const GOLD = 0xe0c060;
const FIRE = 0xff7a30;
const BLOOD = 0xd03040;
const STEEL = 0xb0c0d0;
const SPARK = 0xffe060;

export const BUFF_LOOK: Record<BuffId, BuffLook> = {
  fortify: { motif: 'halo', color: GOLD },
  onslaught: { motif: 'streaks', color: 0xffc060 },
  unholyMight: { motif: 'orbit', color: 0xb060ff },
  arcaneSurge: { motif: 'orbit', color: 0x60a0ff },
  bloodSurge: { motif: 'embers', color: BLOOD },
  steelHide: { motif: 'plates', color: STEEL },
  moltenGuard: { motif: 'embers', color: FIRE },
  deathless: { motif: 'halo', color: 0xfff0d0 },
  phaseRun: { motif: 'streaks', color: 0x90a0ff },
  enduringCry: { motif: 'plates', color: GOLD },
  rallyingCry: { motif: 'rise', color: 0xffd070 },
  infernalCry: { motif: 'embers', color: 0xff9040 },
  warBanner: { motif: 'flag', color: 0xe05050 },
  dreadBanner: { motif: 'flag', color: 0x9060d0 },
  witherStep: { motif: 'smoke', color: 0x80a050 },
  berserk: { motif: 'embers', color: 0xff3030 },
  regenTotem: { motif: 'cross', color: 0x60e080 },
  decoyTotem: { motif: 'orbit', color: 0xc0e0e0 },
  smokeScreen: { motif: 'smoke', color: 0xa0a0a8 },
  offeringBone: { motif: 'plates', color: 0xe8e0c8 },
  offeringFlesh: { motif: 'rise', color: 0xe06080 },
  offeringSpirit: { motif: 'orbit', color: 0x80e8e0 },
  catStealth: { motif: 'smoke', color: 0x50808a },
  avianBoon: { motif: 'wings', color: 0xd8e8ff },
  flickerStep: { motif: 'streaks', color: 0xe0e8f0 },
  punisher: { motif: 'rise', color: 0xc05030 },
  adrenaline: { motif: 'streaks', color: 0xff5050 },
  elusive: { motif: 'rise', color: 0x80ffd0 },
  bloodStance: { motif: 'stance', color: BLOOD },
  sandStance: { motif: 'stance', color: 0xd8b060 },
  bladestormBlood: { motif: 'orbit', color: 0xff6070 },
  bladestormSand: { motif: 'orbit', color: 0xe8c878 },
  guardianCairn: { motif: 'plates', color: 0x9a9080 },
  warchiefCairn: { motif: 'plates', color: 0xb08060 },
  combatRush: { motif: 'streaks', color: 0xff9040 },
  infusion: { motif: 'orbit', color: 0xa0c8ff },
  smiteAura: { motif: 'crackle', color: SPARK },
  phaseStrike: { motif: 'streaks', color: 0xc080ff },
  innervation: { motif: 'crackle', color: 0xa0d0ff },
};

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** A small pseudo-random number from a seed, for flicker that holds still between steps. */
const rnd = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Draw one buff's mark on the character `p`. `air` is the additive layer (light), `ground` the layer under the figures; `slot`
 * is how many buffs are drawn before this one (it staggers their phases) and `alpha` is 1, less when it is about to end.
 */
export function drawBuff(
  air: Gfx,
  ground: Gfx,
  host: FxHost,
  p: Actor,
  look: BuffLook,
  time: number,
  slot: number,
  alpha: number,
): void {
  const o = host.project(p.x, p.y);
  const cx = o.x;
  const cy = o.y - 11;
  const c = look.color;
  const hi = lighten(c, 0.5);
  switch (look.motif) {
    case 'halo': {
      const hy = o.y - 31;
      const pulse = 0.8 + 0.2 * Math.sin(time * 3 + slot);
      air.fillStyle(c, 0.18 * alpha * pulse).fillEllipse(cx, hy, 16, 7);
      air.lineStyle(1.5, c, 0.9 * alpha).strokeEllipse(cx, hy, 12 * pulse, 5 * pulse);
      air
        .fillStyle(0xffffff, 0.8 * alpha)
        .fillCircle(cx + Math.cos(time * 2) * 6, hy + Math.sin(time * 2) * 2.5, 1.2);
      break;
    }
    case 'plates': {
      for (let i = 0; i < 4; i++) {
        const a = time * 1.4 + (i / 4) * Math.PI * 2 + slot;
        const x = cx + Math.cos(a) * 10;
        const y = cy + Math.sin(a) * 5;
        const front = Math.sin(a) > 0 ? 1 : 0.55;
        air.fillStyle(c, 0.9 * alpha * front).fillRect(x - 1.5, y - 3, 3, 6);
        air.fillStyle(hi, 0.8 * alpha * front).fillRect(x - 1.5, y - 3, 1, 6);
      }
      break;
    }
    case 'orbit': {
      for (let i = 0; i < 3; i++) {
        const a = time * 3 + (i / 3) * Math.PI * 2 + slot * 0.7;
        const x = cx + Math.cos(a) * 11;
        const y = cy - 4 + Math.sin(a) * 5 - slot;
        air.fillStyle(c, 0.3 * alpha).fillCircle(x, y, 4);
        air.fillStyle(hi, 0.95 * alpha).fillCircle(x, y, 1.7);
      }
      break;
    }
    case 'rise': {
      for (let i = 0; i < 5; i++) {
        const k = (time * 0.9 + i / 5 + slot * 0.17) % 1;
        const x = cx + (i - 2) * 3.5 + Math.sin(time * 3 + i * 2) * 1.5;
        const y = o.y - 2 - k * 32;
        const a = Math.sin(k * Math.PI) * alpha;
        air.fillStyle(c, 0.3 * a).fillCircle(x, y, 3);
        air.fillStyle(hi, 0.95 * a).fillCircle(x, y, 1.4);
      }
      break;
    }
    case 'embers': {
      const flick = 0.7 + 0.3 * Math.sin(time * 14 + slot * 2);
      air.fillStyle(c, 0.14 * alpha * flick).fillEllipse(cx, cy - 2, 22, 28);
      for (let i = 0; i < 6; i++) {
        const k = (time * 1.6 + i / 6 + rnd(i + slot) * 0.3) % 1;
        const x = cx + (rnd(i * 3 + slot) - 0.5) * 16 + Math.sin(time * 6 + i) * 1.5;
        const y = o.y - 6 - k * 30;
        const a = (1 - k) * alpha;
        air.fillStyle(lighten(c, 0.3 + 0.4 * k), 0.95 * a).fillRect(x - 1, y - 1, 2, 2);
      }
      break;
    }
    case 'streaks': {
      // Behind the character, against the way it faces.
      const b = host.project(p.x - Math.cos(p.facing) * 1.1, p.y - Math.sin(p.facing) * 1.1);
      const dx = b.x - o.x;
      const dy = b.y - o.y;
      for (let i = 0; i < 3; i++) {
        const off = (i - 1) * 5;
        const len = 0.55 + 0.45 * rnd(Math.floor(time * 12) + i * 7 + slot);
        const x0 = cx + off * 0.6;
        const y0 = cy + off;
        air.lineStyle(3, c, 0.25 * alpha).lineBetween(x0, y0, x0 + dx * len, y0 + dy * len);
        air.lineStyle(1, hi, 0.85 * alpha).lineBetween(x0, y0, x0 + dx * len, y0 + dy * len);
      }
      break;
    }
    case 'smoke': {
      for (let i = 0; i < 4; i++) {
        const k = (time * 0.5 + i / 4 + slot * 0.2) % 1;
        const x = cx + Math.sin(time + i * 1.7) * 7;
        const y = o.y - 3 - k * 16;
        air.fillStyle(lighten(c, 0.25), 0.5 * (1 - k) * alpha).fillCircle(x, y, 3 + k * 5);
      }
      break;
    }
    case 'crackle': {
      const step = Math.floor(time * 10);
      for (let l = 0; l < 2; l++) {
        const a = rnd(step * 2 + l + slot * 9) * Math.PI * 2;
        let x = cx + Math.cos(a) * 4;
        let y = cy + Math.sin(a) * 4;
        air
          .lineStyle(1, hi, 0.95 * alpha)
          .beginPath()
          .moveTo(x, y);
        for (let s = 0; s < 3; s++) {
          x += Math.cos(a) * 4 + (rnd(step + s * 5 + l) - 0.5) * 6;
          y += Math.sin(a) * 3 + (rnd(step + s * 7 + l) - 0.5) * 6;
          air.lineTo(x, y);
        }
        air.strokePath();
        air.fillStyle(c, 0.35 * alpha).fillCircle(x, y, 3);
      }
      break;
    }
    case 'cross': {
      for (let i = 0; i < 2; i++) {
        const k = (time * 0.7 + i * 0.5 + slot * 0.13) % 1;
        const x = cx + (i ? 7 : -7);
        const y = o.y - 4 - k * 28;
        const a = Math.sin(k * Math.PI) * alpha;
        air.lineStyle(2, c, 0.95 * a).lineBetween(x - 2.5, y, x + 2.5, y);
        air.lineStyle(2, c, 0.95 * a).lineBetween(x, y - 2.5, x, y + 2.5);
      }
      break;
    }
    case 'flag': {
      const px = cx + 8;
      const top = o.y - 34;
      air.lineStyle(1, 0xd8c8a0, 0.9 * alpha).lineBetween(px, o.y - 12, px, top);
      const w = Math.sin(time * 4 + slot);
      air
        .fillStyle(c, 0.95 * alpha)
        .fillTriangle(px, top, px, top + 7, px + 9 + w * 1.5, top + 3.5 + w);
      air.fillStyle(c, 0.25 * alpha).fillCircle(px + 4, top + 3.5, 6);
      break;
    }
    case 'wings': {
      const flap = Math.sin(time * 6);
      for (const s of [-1, 1]) {
        air
          .fillStyle(c, 0.35 * alpha)
          .fillTriangle(
            cx + s * 3,
            cy - 2,
            cx + s * (11 + flap * 2),
            cy - 10 - flap * 3,
            cx + s * 8,
            cy + 3,
          );
        air
          .lineStyle(1, 0xffffff, 0.8 * alpha)
          .lineBetween(cx + s * 3, cy - 2, cx + s * (11 + flap * 2), cy - 10 - flap * 3);
      }
      break;
    }
    case 'stance': {
      const rx = host.rpx(0.75);
      const sq = host.squash();
      ground.fillStyle(c, 0.1 * alpha).fillEllipse(o.x, o.y, rx * 2, rx * 2 * sq);
      ground.lineStyle(1.5, c, 0.75 * alpha).strokeEllipse(o.x, o.y, rx * 2, rx * 2 * sq);
      for (let i = 0; i < 6; i++) {
        const a = time * 0.9 + (i / 6) * Math.PI * 2;
        ground
          .fillStyle(hi, 0.9 * alpha)
          .fillRect(o.x + Math.cos(a) * rx - 1, o.y + Math.sin(a) * rx * sq - 1, 2, 2);
      }
      break;
    }
  }
}
