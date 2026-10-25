import type Phaser from 'phaser';
import { ELEMENT_COLOR } from '../../calc/skillLook';
import { STATUS_IDS, STATUSES, type StatusId } from '../../data/statuses';
import type { Actor } from '../../sim/types';

/**
 * What has been done to an enemy that is neither a curse nor an ailment, as a row of tiny pips over its life bar: one for each
 * status it carries (slowed, blinded, exposed, withered, ...) and one for each element of damage over time a skill put on it
 * (Slow Rot, Burning Pack, Torch Arrow, ...). A pip is a little glyph in a colour of its own with an ink rim, smaller than an
 * affix stone and without its gold setting, so it reads as something that will pass. It stays while the status does and blinks
 * in its last half second (a status that lasts a second or less is not worth blinking). Stacks are dots under the glyph.
 *
 * The rows are pure functions of the actor, so a test can walk every status and every element (statusMarks.test.ts).
 */

type Gfx = Phaser.GameObjects.Graphics;

export type Glyph =
  | 'down'
  | 'square'
  | 'hollow'
  | 'ring'
  | 'cross'
  | 'eye'
  | 'bang'
  | 'drop'
  | 'fork'
  | 'crack'
  | 'skull'
  | 'asterisk'
  | 'slash'
  | 'flame'
  | 'bolt'
  | 'diamond';

export type StatusLook = { glyph: Glyph; color: number };

/** The look of each status. No two share both a glyph and a colour (statusMarks.test.ts). */
export const STATUS_LOOK: Record<StatusId, StatusLook> = {
  // Slowed and held: arrows down, a stone block, a shackle ring, a snare cross.
  hinder: { glyph: 'down', color: 0x8ab4d8 },
  maim: { glyph: 'down', color: 0xd8583a },
  immobilised: { glyph: 'square', color: 0xc8c0a8 },
  bound: { glyph: 'ring', color: 0xd8b060 },
  ensnared: { glyph: 'cross', color: 0x8cc060 },
  // Misses more.
  blind: { glyph: 'eye', color: 0xb89ae8 },
  unnerved: { glyph: 'bang', color: 0xe8d070 },
  // Takes more: a cracked ring in the element, a hollow plate, a wilted sprig, a scar.
  exposedLightning: { glyph: 'crack', color: ELEMENT_COLOR[1] },
  exposedCold: { glyph: 'crack', color: ELEMENT_COLOR[2] },
  exposedFire: { glyph: 'crack', color: ELEMENT_COLOR[3] },
  overpowered: { glyph: 'hollow', color: 0xe0e4f0 },
  withered: { glyph: 'fork', color: 0xa8a050 },
  scarred: { glyph: 'slash', color: 0xe05050 },
  // Mends less; goes off when it dies.
  regenLess: { glyph: 'asterisk', color: 0xcfeaff },
  venomed: { glyph: 'drop', color: 0xb8e848 },
  doomed: { glyph: 'skull', color: 0x8fd070 },
};

/** The look of a skill's damage over time, by the damage type it deals: the element's colour and a glyph of its nature. */
export const DOT_LOOK: readonly StatusLook[] = [
  { glyph: 'slash', color: ELEMENT_COLOR[0] },
  { glyph: 'bolt', color: ELEMENT_COLOR[1] },
  { glyph: 'diamond', color: ELEMENT_COLOR[2] },
  { glyph: 'flame', color: ELEMENT_COLOR[3] },
  { glyph: 'drop', color: ELEMENT_COLOR[4] },
];

export type StatusPip = StatusLook & {
  /** Stacks shown as dots under the glyph (1 shows none). */
  n: number;
  /** 0 to 1: how strongly it is drawn (fading as it runs out, for the ones that fade). */
  alpha: number;
  /** Seconds left, and whether to blink as it ends. */
  left: number;
  blinks: boolean;
};

/** Most pips in a row; a monster under more shows the first ones. */
export const MAX_PIPS = 8;
/** Stacks that are shown as dots. */
const MAX_DOTS = 3;
const BLINK_BELOW = 0.5;
const BLINK_MIN_SECONDS = 1.5;

/** Whether the actor carries a status or a skill's damage over time (most do not, so the hot paths ask first). */
export function hasAfflictions(a: Actor): boolean {
  for (const _ in a.fx) return true;
  return a.sdots.length > 0 || a.impales.length > 0;
}

/** The pips of an actor, in the order of the statuses and then the damage types; at most `MAX_PIPS`. */
export function statusPips(a: Actor): StatusPip[] {
  const out: StatusPip[] = [];
  for (const id of STATUS_IDS) {
    const s = a.fx[id];
    if (!s) continue;
    const look = STATUS_LOOK[id];
    const def = STATUSES[id];
    out.push({
      ...look,
      n: s.n,
      // A shackle starts strong and fades to nothing over its time.
      alpha: id === 'bound' ? 0.5 + 0.5 * Math.max(0, Math.min(1, s.t / Math.max(0.01, s.t0))) : 1,
      left: s.t,
      blinks: Math.max(def.seconds, s.t0) >= BLINK_MIN_SECONDS,
    });
  }
  if (a.sdots.length > 0) {
    // One pip for each damage type, with the layers counted (several Creeping Plagues are one rot, thicker).
    const byType = new Map<number, { n: number; left: number }>();
    for (const d of a.sdots) {
      const have = byType.get(d.type);
      if (have) {
        have.n += d.layer ? 1 : 0;
        have.left = Math.max(have.left, d.t);
      } else byType.set(d.type, { n: 1, left: d.t });
    }
    for (const [type, v] of [...byType].sort((p, q) => p[0] - q[0])) {
      const look = DOT_LOOK[type] ?? DOT_LOOK[0];
      out.push({ ...look, n: v.n, alpha: 1, left: v.left, blinks: true });
    }
  }
  return out.length > MAX_PIPS ? out.slice(0, MAX_PIPS) : out;
}

/** Pixels from one pip's middle to the next's. */
export const PIP_STEP = 8;

/**
 * Draw a row of pips centred on x at height y. `ink` is the outline colour of the monster marks. The row is drawn in whole pixels:
 * each glyph twice, an ink silhouette a pixel larger and then the colour.
 */
export function drawStatusRow(
  g: Gfx,
  cx: number,
  y: number,
  pips: readonly StatusPip[],
  ink: number,
  time: number,
): void {
  const n = pips.length;
  let x = Math.round(cx - ((n - 1) * PIP_STEP) / 2);
  for (const p of pips) {
    const blink =
      p.blinks && p.left < BLINK_BELOW ? 0.35 + 0.65 * Math.abs(Math.sin(time * 14 + x)) : 1;
    const a = p.alpha * blink;
    drawGlyph(g, p.glyph, x, y, ink, ink, 1, a);
    drawGlyph(g, p.glyph, x, y, p.color, ink, 0, a);
    const dots = Math.min(MAX_DOTS, p.n - 1);
    for (let i = 0; i < dots; i++) {
      const dx = x + (i - (dots - 1) / 2) * 3;
      g.fillStyle(ink, a).fillRect(dx - 1, y + 4, 3, 3);
      g.fillStyle(p.color, a).fillRect(dx, y + 5, 1, 1);
    }
    x += PIP_STEP;
  }
}

/** Half the width of a glyph in pixels. */
const H = 3;

/**
 * One glyph at (x, y). With `grow` 1 it is the ink silhouette (a pixel larger all round, in `c`); with 0 it is the colour `c`, and the
 * holes in it (a ring's, an eye's pupil) are in `ink`.
 */
function drawGlyph(
  g: Gfx,
  glyph: Glyph,
  x: number,
  y: number,
  c: number,
  ink: number,
  grow: number,
  a: number,
): void {
  const h = H + grow;
  const w = 2 + grow * 2;
  g.fillStyle(c, a);
  g.lineStyle(w, c, a);
  switch (glyph) {
    case 'down':
      g.fillTriangle(x - h, y - h + 1, x + h, y - h + 1, x, y + h);
      break;
    case 'square':
      g.fillRect(x - (H - 1) - grow, y - (H - 1) - grow, 2 * (H - 1 + grow), 2 * (H - 1 + grow));
      break;
    case 'hollow':
      g.fillRect(x - h, y - h, 2 * h, 2 * h);
      if (!grow) g.fillStyle(ink, a).fillRect(x - 1, y - 1, 2, 2);
      break;
    case 'ring':
      g.fillCircle(x, y, h);
      if (!grow) g.fillStyle(ink, a).fillCircle(x, y, 1.4);
      break;
    case 'cross':
      g.lineBetween(x - H + 0.5, y - H + 0.5, x + H - 0.5, y + H - 0.5);
      g.lineBetween(x - H + 0.5, y + H - 0.5, x + H - 0.5, y - H + 0.5);
      break;
    case 'eye':
      g.fillEllipse(x, y, 2 * h + 1, h + 1);
      if (!grow) g.fillStyle(ink, a).fillRect(x - 1, y - 1, 2, 2);
      break;
    case 'bang':
      g.fillRect(x - 1 - grow, y - H - grow, 2 + 2 * grow, 4 + 2 * grow);
      g.fillRect(x - 1 - grow, y + 2 - grow, 2 + 2 * grow, 2 + 2 * grow);
      break;
    case 'drop':
      g.fillTriangle(x, y - h - 1, x - h + 1, y + 1, x + h - 1, y + 1);
      g.fillCircle(x, y + 1, h - 1);
      break;
    case 'fork':
      g.lineBetween(x, y + H, x, y);
      g.lineBetween(x, y, x - H, y - H);
      g.lineBetween(x, y, x + H, y - H);
      break;
    case 'crack':
      g.fillCircle(x, y, h);
      if (!grow) {
        g.fillStyle(ink, a).fillCircle(x, y, 1.6);
        g.lineStyle(1.5, ink, a).lineBetween(x - 1, y - H - 1, x + 1, y + H + 1);
      }
      break;
    case 'skull':
      g.fillCircle(x, y - 1, h);
      g.fillRect(x - 2 - grow, y + 1, 4 + 2 * grow, 3 + grow);
      if (!grow)
        g.fillStyle(ink, a)
          .fillRect(x - 2, y - 2, 1, 2)
          .fillRect(x + 1, y - 2, 1, 2);
      break;
    case 'asterisk':
      g.lineBetween(x - H, y, x + H, y);
      g.lineBetween(x, y - H, x, y + H);
      g.lineBetween(x - 2, y - 2, x + 2, y + 2);
      g.lineBetween(x - 2, y + 2, x + 2, y - 2);
      break;
    case 'slash':
      g.lineBetween(x - H, y + H, x + H, y - H);
      break;
    case 'flame':
      g.fillTriangle(x, y - h - 1, x - h + 1, y + h, x + h - 1, y + h);
      if (!grow) g.fillStyle(0xfff0c0, a).fillTriangle(x, y - 1, x - 1, y + H, x + 1, y + H);
      break;
    case 'bolt':
      g.beginPath();
      g.moveTo(x + 1, y - H - grow);
      g.lineTo(x - 1, y);
      g.lineTo(x + 1, y);
      g.lineTo(x - 1, y + H + grow);
      g.strokePath();
      break;
    case 'diamond':
      g.fillTriangle(x - h, y, x + h, y, x, y - h - 1);
      g.fillTriangle(x - h, y, x + h, y, x, y + h + 1);
      break;
  }
}

/** The wood of a spear's shaft and the bone-pale of its butt. */
const SHAFT = 0xb89a6a;
const BUTT = 0xeadfc8;
const WOOD_LIT = 0xd8bc88;

/** A fixed pseudo-random number from 0 to 1 for a seed and an index. */
const rnd = (seed: number, i: number): number => {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Most spears drawn in one body (a target holds five impales at most). */
export const MAX_SPEARS = 5;

/**
 * Skewer's impales: a short spear stuck in the body for each one held, sticking out round the chest in a fan, the tip in the body and
 * the butt out. (cx, cy) is the middle of the body and `br` the radius of it in pixels. The fan is the same for the same `seed`, so a
 * spear does not move when another is added.
 */
export function drawSpears(
  g: Gfx,
  cx: number,
  cy: number,
  br: number,
  count: number,
  seed: number,
  ink: number,
): void {
  const n = Math.min(MAX_SPEARS, count);
  for (let i = 0; i < n; i++) {
    // Slots spread round the upper body and the flanks (none straight down), each nudged a little.
    const ang = -Math.PI / 2 + (i - (MAX_SPEARS - 1) / 2) * 0.72 + (rnd(seed, i) - 0.5) * 0.3;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang) * 0.75;
    const x0 = cx + dx * br * 0.25;
    const y0 = cy + dy * br * 0.25;
    const len = br + 7 + rnd(seed, i + 9) * 3;
    const x1 = cx + dx * len;
    const y1 = cy + dy * len;
    g.lineStyle(4, ink, 0.9).lineBetween(x0, y0, x1, y1);
    g.lineStyle(2, SHAFT, 1).lineBetween(x0, y0, x1, y1);
    g.lineStyle(1, WOOD_LIT, 1).lineBetween(x0, y0 - 1, x1, y1 - 1);
    g.fillStyle(ink, 1).fillRect(Math.round(x1) - 2, Math.round(y1) - 2, 4, 4);
    g.fillStyle(BUTT, 1).fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 2, 2);
  }
}
