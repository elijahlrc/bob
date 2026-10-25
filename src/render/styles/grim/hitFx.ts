import type Phaser from 'phaser';
import type { Actor, SimEvent } from '../../../sim/types';

/**
 * Hit feedback that is not a skill's own look: whose damage earns a number (and how the numbers of auras and bursts are kept from
 * flooding), the pale words of a hit that dealt nothing, and the spikes that flash on a monster that throws a hit back
 * (docs/VISUAL_LANGUAGE.md, "Hits"). No scene is needed to read the rules, so a test can.
 */

type Gfx = Phaser.GameObjects.Graphics;
type HitEvent = Extract<SimEvent, { t: 'hit' }>;
type ReflectEvent = Extract<SimEvent, { t: 'reflect' }>;

/** The colour of a damage number, by type (physical, lightning, cold, fire, chaos). */
export const DTYPE_COLOR = [0xeadfc8, 0xc89cff, 0x9ad8ff, 0xff9a40, 0x9ae05a];
/** The red of the Thorned pip and of the spikes. */
export const THORN_COLOR = 0xd04040;
/** The word on a number that was thrown back. */
export const REFLECT_WORD = 'Thorns';
/** The pale word of a hit a Warden Pylon turned aside, and its colour. */
export const WARDED_WORD = 'Warded';
export const WARDED_COLOR = 0xd8c878;
/** The number of a hit a curled beetle shrugged off most of. */
export const CURLED_COLOR = 0xa8a090;

/** Seconds in which the numbers of effects on one target are one number (the first at once, the rest summed). */
export const EFFECT_WINDOW = 0.3;
/** How long the spikes of a reflection last. */
export const SPIKE_SECONDS = 0.38;

/**
 * Which number a hit earns. `direct`: the character's own hit, or a hit on a character. `effect`: damage a side dealt with no
 * attacker of its own on an enemy (an explosion, an aura, a minion's blow): it is kept from flooding. `none`: no number here (a hit
 * that dealt nothing says so in words, and a reflection is told by its own event).
 */
export function numberKind(
  e: HitEvent,
  srcIsPlayer: boolean,
  dstIsPlayer: boolean,
): 'direct' | 'effect' | 'none' {
  if (e.immune || e.warded || e.reflect !== undefined) return 'none';
  if (Math.round(e.amount) <= 0) return 'none';
  if (srcIsPlayer || dstIsPlayer) return 'direct';
  return e.side !== undefined ? 'effect' : 'none';
}

type Gate = { until: number; pending: number; dtype: number; x: number; y: number };

/**
 * One number per target per window: the first effect on a target shows at once, the ones after it within the window are summed and
 * shown together when it ends. A burning aura or a nova that strikes a crowd is a number a target, not a number a tick.
 */
export class NumberGate {
  private open = new Map<number, Gate>();

  /** Offer a number: true when it shows now; false when it is held, to show with the others when the window ends. */
  push(id: number, amount: number, dtype: number, x: number, y: number, now: number): boolean {
    const g = this.open.get(id);
    if (!g || (g.until <= now && g.pending <= 0)) {
      this.open.set(id, { until: now + EFFECT_WINDOW, pending: 0, dtype, x, y });
      return true;
    }
    // (A window that has ended but not been flushed yet still holds its sum: this joins it, and shows with it.)
    g.pending += amount;
    g.dtype = dtype;
    g.x = x;
    g.y = y;
    return false;
  }

  /** The held numbers whose window has ended (each opens a new window), and forgets the targets that have none. */
  flush(now: number): { amount: number; dtype: number; x: number; y: number }[] {
    const out: { amount: number; dtype: number; x: number; y: number }[] = [];
    for (const [id, g] of this.open) {
      if (g.until > now) continue;
      if (g.pending > 0) {
        out.push({ amount: g.pending, dtype: g.dtype, x: g.x, y: g.y });
        g.pending = 0;
        g.until = now + EFFECT_WINDOW;
      } else this.open.delete(id);
    }
    return out;
  }

  clear(): void {
    this.open.clear();
  }

  get size(): number {
    return this.open.size;
  }
}

/** The corners of a ring of `n` spikes about (cx, cy): base on radius `r`, tip on `r + len`, squashed to the ground ellipse. */
export function spikeRing(
  cx: number,
  cy: number,
  r: number,
  len: number,
  n: number,
  squash: number,
  spin = 0,
): { base: [number, number, number, number]; tip: [number, number] }[] {
  const out: { base: [number, number, number, number]; tip: [number, number] }[] = [];
  const half = Math.PI / n / 2.6;
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * Math.PI * 2;
    out.push({
      base: [
        cx + Math.cos(a - half) * r,
        cy + Math.sin(a - half) * r * squash,
        cx + Math.cos(a + half) * r,
        cy + Math.sin(a + half) * r * squash,
      ],
      tip: [cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len) * squash],
    });
  }
  return out;
}

export type HitHost = {
  project(x: number, y: number): { x: number; y: number };
  actorById(id: number): Actor | null;
  floater?(x: number, y: number, text: string, color: number, big: boolean): void;
  squash(): number;
};

type Spikes = { id: number; x: number; y: number; r: number; t: number };

export class HitFx {
  private gate = new NumberGate();
  private spikes: Spikes[] = [];

  private host: HitHost;

  constructor(host: HitHost) {
    this.host = host;
  }

  /** The number of an effect on an enemy, kept from flooding. */
  effectNumber(id: number, amount: number, dtype: number, x: number, y: number, now: number): void {
    if (this.gate.push(id, amount, dtype, x, y, now))
      this.host.floater?.(
        x,
        y,
        String(Math.round(amount)),
        DTYPE_COLOR[dtype] ?? DTYPE_COLOR[0],
        false,
      );
  }

  onEvent(e: SimEvent): void {
    if (e.t === 'reflect') this.reflect(e);
  }

  /** The spikes flash on the one that threw the hit back; the number that was thrown lands on the one it hit, with a word. */
  private reflect(e: ReflectEvent): void {
    const from = this.host.actorById(e.src);
    const to = this.host.actorById(e.dst);
    if (from) {
      if (this.spikes.length > 24) this.spikes.shift();
      this.spikes.push({ id: e.src, x: from.x, y: from.y, r: Math.max(0.35, from.r), t: 0 });
    }
    if (to) {
      const p = this.host.project(to.x, to.y);
      const color = to.isPlayer ? 0xff5050 : (DTYPE_COLOR[e.dtype] ?? DTYPE_COLOR[0]);
      this.host.floater?.(p.x, p.y - 14, `${Math.round(e.amount)} ${REFLECT_WORD}`, color, false);
    }
  }

  /** Shows the held numbers whose window ended, and draws the spikes (the shared ground graphics, cleared each frame). */
  frame(dt: number, now: number, g: Gfx): void {
    for (const n of this.gate.flush(now))
      this.host.floater?.(
        n.x,
        n.y,
        String(Math.round(n.amount)),
        DTYPE_COLOR[n.dtype] ?? DTYPE_COLOR[0],
        false,
      );
    const sq = this.host.squash();
    for (let i = this.spikes.length - 1; i >= 0; i--) {
      const s = this.spikes[i];
      s.t += dt;
      const k = s.t / SPIKE_SECONDS;
      if (k >= 1) {
        this.spikes.splice(i, 1);
        continue;
      }
      // Follow the one that threw the hit while it stands; the ring was cast where it stood.
      const a = this.host.actorById(s.id);
      if (a) {
        s.x = a.x;
        s.y = a.y;
      }
      const c = this.host.project(s.x, s.y);
      // The spikes spring out fast, hold, and fade: a dark line under the red, as every other outline.
      const out = Math.min(1, k / 0.3);
      const alpha = k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5;
      const r = (10 + 5 * out) * (0.8 + s.r);
      const len = 3 + 7 * (1 - Math.pow(1 - out, 2));
      for (const sp of spikeRing(c.x, c.y + 1, r, len, 9, sq, k * 0.6)) {
        const tri = [sp.base[0], sp.base[1], sp.base[2], sp.base[3], sp.tip[0], sp.tip[1]];
        g.fillStyle(0x000000, 0.45 * alpha).fillTriangle(
          tri[0] - 0.5,
          tri[1] + 0.5,
          tri[2] + 0.5,
          tri[3] + 0.5,
          tri[4],
          tri[5] - 0.5,
        );
        g.fillStyle(THORN_COLOR, 0.9 * alpha).fillTriangle(
          tri[0],
          tri[1],
          tri[2],
          tri[3],
          tri[4],
          tri[5],
        );
        g.fillStyle(0xffd0c0, 0.8 * alpha).fillRect(
          Math.round(tri[4]) - 1,
          Math.round(tri[5]),
          1,
          1,
        );
      }
      g.lineStyle(1, THORN_COLOR, 0.5 * alpha).strokeEllipse(c.x, c.y + 1, r * 2, r * 2 * sq);
    }
  }

  destroy(): void {
    this.gate.clear();
    this.spikes = [];
  }
}
