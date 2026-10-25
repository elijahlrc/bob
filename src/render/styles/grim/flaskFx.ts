import type Phaser from 'phaser';
import { ELEMENT_COLOR } from '../../../calc/skillLook';
import type { Mod } from '../../../mods/types';
import type { Side } from '../../../sim/side';
import type { SimEvent, World } from '../../../sim/types';
import type { AddFx } from './cueFx';
import type { FxHost } from './skillFx';

/**
 * What a flask looks like in use (docs/VISUAL_LANGUAGE.md, "Flasks"). A flask is drunk with a cue of its own kind: life and mana
 * flasks send up drops (red, blue, both for a hybrid), and a utility flask is drawn by what it does: a ward for resistances and
 * armour (a hexagon that rises), a rush for speed and evasion (streaks behind), an edge for damage and critical strikes (a flare).
 * While a utility flask runs it leaves a small pip under the character's feet that drains with it. A flask that takes an ailment
 * off sends that ailment's colour away from the body.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

export type FlaskMotif = 'drops' | 'ward' | 'rush' | 'edge';
export type FlaskLook = { color: number; motif: FlaskMotif; second?: number };

type LookSource = { kind: string; buff: readonly Mod[]; grants?: string; ground?: string };

const LIFE = 0xe04a58;
const MANA = 0x4a78ff;

/** The look of utility effects, by the first stat they give that is listed. */
const STAT_LOOK: [string, FlaskLook][] = [
  ['moveSpeed', { color: 0xffe070, motif: 'rush' }],
  ['resist.allEle', { color: 0xe8e0c0, motif: 'ward' }],
  ['resist.fire', { color: ELEMENT_COLOR[3], motif: 'ward' }],
  ['maxResist.fire', { color: ELEMENT_COLOR[3], motif: 'ward' }],
  ['resist.cold', { color: ELEMENT_COLOR[2], motif: 'ward' }],
  ['maxResist.cold', { color: ELEMENT_COLOR[2], motif: 'ward' }],
  ['resist.lightning', { color: ELEMENT_COLOR[1], motif: 'ward' }],
  ['maxResist.lightning', { color: ELEMENT_COLOR[1], motif: 'ward' }],
  ['resist.chaos', { color: ELEMENT_COLOR[4], motif: 'ward' }],
  ['evasion', { color: 0x50ffd0, motif: 'rush' }],
  ['dodge', { color: 0x9ad8ff, motif: 'rush' }],
  ['avoidHit', { color: 0x9ad8ff, motif: 'ward' }],
  ['armour', { color: 0x9aa8b8, motif: 'ward' }],
  ['physReduction', { color: 0xb8a888, motif: 'ward' }],
  ['reflectPhys', { color: 0xb8a888, motif: 'ward' }],
  ['crit', { color: 0xfff0a0, motif: 'edge' }],
  ['damage', { color: 0xffb050, motif: 'edge' }],
];

const GRANT_LOOK: Record<string, FlaskLook> = { onslaught: { color: 0xffd040, motif: 'rush' } };
const GROUND_LOOK: Record<string, FlaskLook> = {
  consecrated: { color: 0xffe39a, motif: 'edge' },
  chilling: { color: 0x9ad8ff, motif: 'ward' },
  smoke: { color: 0xb0b0b8, motif: 'rush' },
};

/** The look of a flask: from its kind, and for a utility flask from what it gives. */
export function flaskLook(spec: LookSource | undefined): FlaskLook {
  if (!spec) return { color: 0xffd070, motif: 'ward' };
  if (spec.kind === 'life') return { color: LIFE, motif: 'drops' };
  if (spec.kind === 'mana') return { color: MANA, motif: 'drops' };
  if (spec.kind === 'hybrid') return { color: LIFE, motif: 'drops', second: MANA };
  if (spec.grants && GRANT_LOOK[spec.grants]) return GRANT_LOOK[spec.grants];
  for (const [prefix, look] of STAT_LOOK)
    if (spec.buff.some((m) => m.stat.startsWith(prefix))) return look;
  if (spec.ground && GROUND_LOOK[spec.ground]) return GROUND_LOOK[spec.ground];
  return { color: 0xffd070, motif: 'ward' };
}

/** The colour an ailment leaves in when a flask takes it off. */
export const CLEANSE_COLOR: Record<string, number> = {
  ignite: ELEMENT_COLOR[3],
  bleed: 0xc03030,
  freeze: ELEMENT_COLOR[2],
  poison: ELEMENT_COLOR[4],
  shock: ELEMENT_COLOR[1],
  curse: 0xb070e0,
};

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

export class FlaskFx {
  private host: FxHost;
  private add: AddFx;

  constructor(host: FxHost, add: AddFx) {
    this.host = host;
    this.add = add;
  }

  onEvent(e: SimEvent, w: World): void {
    if (e.t !== 'flaskUsed') return;
    const side = w.sides.find((s) => s.player.id === e.src) ?? w.sides[0];
    const look = flaskLook(side?.flasks?.[e.idx]?.spec);
    const who = this.host.actorById(e.src);
    if (!who) return;
    this.used(e.src, look);
    for (const [i, kind] of (e.cleansed ?? []).entries()) this.cleanse(e.src, kind, i);
  }

  /** The cue of drinking, drawn on the character (it follows it for the half second the cue lasts). */
  private used(src: number, look: FlaskLook): void {
    const host = this.host;
    this.add(0.55, true, (g, k) => {
      const a = host.actorById(src);
      if (!a) return;
      const o = host.project(a.x, a.y);
      const al = 1 - k * k;
      switch (look.motif) {
        case 'drops':
          // Drops rise from the feet: one colour, or the two of a hybrid in turn.
          for (let i = 0; i < 5; i++) {
            const kk = (k - i * 0.07) / 0.65;
            if (kk < 0 || kk > 1) continue;
            const c = look.second && i % 2 ? look.second : look.color;
            const px = o.x + (i - 2) * 4;
            const py = o.y - 2 - kk * 28;
            const f = Math.sin(kk * Math.PI);
            g.fillStyle(c, 0.3 * f).fillCircle(px, py, 3.2);
            g.fillStyle(lighten(c, 0.5), 0.95 * f).fillTriangle(
              px,
              py - 3.5,
              px - 1.8,
              py,
              px + 1.8,
              py,
            );
            g.fillStyle(lighten(c, 0.5), 0.95 * f).fillCircle(px, py + 0.6, 1.6);
          }
          break;
        case 'ward': {
          // A hexagon rises from the feet to the chest and thins.
          const lift = 2 + k * 14;
          g.lineStyle(1.5, look.color, 0.9 * al).beginPath();
          for (let i = 0; i <= 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            const x = o.x + Math.cos(ang) * (10 - 2 * k);
            const y = o.y - lift + Math.sin(ang) * (5 - k);
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.strokePath();
          g.fillStyle(look.color, 0.14 * al).fillEllipse(o.x, o.y - lift, 20, 10);
          break;
        }
        case 'rush': {
          // Streaks sweep back from the body, against the way it faces.
          const b = host.project(a.x - Math.cos(a.facing) * 1.2, a.y - Math.sin(a.facing) * 1.2);
          const dx = (b.x - o.x) * Math.min(1, k * 2.5);
          const dy = (b.y - o.y) * Math.min(1, k * 2.5);
          for (const off of [-5, 0, 5]) {
            g.lineStyle(2.5, look.color, 0.3 * al).lineBetween(
              o.x + off * 0.6,
              o.y - 11 + off,
              o.x + off * 0.6 + dx,
              o.y - 11 + off + dy,
            );
            g.lineStyle(1, lighten(look.color, 0.6), 0.9 * al).lineBetween(
              o.x + off * 0.6,
              o.y - 11 + off,
              o.x + off * 0.6 + dx,
              o.y - 11 + off + dy,
            );
          }
          break;
        }
        case 'edge': {
          // A four-pointed flare opens at the chest, with six sparks.
          const r = 4 + 9 * Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5);
          const cx = o.x;
          const cy = o.y - 12;
          g.lineStyle(1.5, lighten(look.color, 0.5), 0.95 * al)
            .lineBetween(cx - r, cy, cx + r, cy)
            .lineBetween(cx, cy - r, cx, cy + r);
          g.fillStyle(look.color, 0.3 * al).fillCircle(cx, cy, r * 0.6);
          for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2 + 0.4;
            g.fillStyle(0xffffff, 0.8 * al).fillRect(
              cx + Math.cos(ang) * r * 1.3 - 1,
              cy + Math.sin(ang) * r * 0.8 - 1,
              2,
              2,
            );
          }
          break;
        }
      }
    });
  }

  /** An ailment taken off: motes of its colour fly out and up from the body and fade. */
  private cleanse(src: number, kind: string, index: number): void {
    const color = CLEANSE_COLOR[kind] ?? 0xffffff;
    const host = this.host;
    this.add(0.6, true, (g, k) => {
      const a = host.actorById(src);
      if (!a) return;
      const o = host.project(a.x, a.y);
      const al = Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5) * (1 - k);
      for (let i = 0; i < 4; i++) {
        const ang = (index * 1.3 + (i / 4) * Math.PI * 2) % (Math.PI * 2);
        const rr = 6 + 20 * k;
        const px = o.x + Math.cos(ang) * rr;
        const py = o.y - 12 - 10 * k + Math.sin(ang) * rr * 0.5;
        g.fillStyle(color, 0.3 * al).fillCircle(px, py, 3);
        g.fillStyle(lighten(color, 0.5), 0.95 * al).fillCircle(px, py, 1.3);
      }
    });
  }
}

/**
 * The flasks that run, as a row of small gauges under the character's feet, in the colour of each flask's look; each drains with its
 * time and blinks in the last second (as a buff does). Life and mana flasks have none: their drops and the recovery cue say it.
 */
export function drawFlaskPips(ground: Gfx, host: FxHost, side: Side, time: number): void {
  const p = side.player;
  if (!p.alive) return;
  const running = (side.flasks ?? []).filter((f) => f.spec.kind === 'utility' && f.activeT > 0);
  if (running.length === 0) return;
  const o: Pt = host.project(p.x, p.y);
  const w = 5;
  const gap = 2;
  const h = 7;
  const x0 = o.x - (running.length * w + (running.length - 1) * gap) / 2;
  const y = o.y + 6;
  running.forEach((f, i) => {
    const look = flaskLook(f.spec);
    const left = Math.max(0, Math.min(1, f.activeT / Math.max(0.1, f.spec.duration)));
    const blink = f.activeT < 1 ? 0.4 + 0.6 * Math.abs(Math.sin(time * 8)) : 1;
    const x = x0 + i * (w + gap);
    ground.fillStyle(0x000000, 0.65).fillRect(x - 1, y - 1, w + 2, h + 2);
    ground.fillStyle(look.color, 0.95 * blink).fillRect(x, y + h * (1 - left), w, h * left);
    ground.fillStyle(0xffffff, 0.7 * blink).fillRect(x, y + h * (1 - left), w, 1);
  });
}
