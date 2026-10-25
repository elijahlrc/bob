import type Phaser from 'phaser';
import { ELEMENT_COLOR } from '../../../calc/skillLook';
import type { Side } from '../../../sim/side';
import type { SimEvent, World } from '../../../sim/types';
import type { FxHost } from './skillFx';

/**
 * Blinks that wait for something to cross the ground (docs/VISUAL_LANGUAGE.md, "Blinks"): Shadow Quiver looses an arrow and the
 * character follows it, Bolt Step runs as lightning. The sim says when one starts (`warp`: from, to, how long) and the blink ends it;
 * until then a flight is drawn along the path. A Rotting Stride keeps a faint ring round the character, the reach of its withering.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

type Flight = {
  id: number;
  x: number;
  y: number;
  x2: number;
  y2: number;
  t: number;
  seconds: number;
  arrow: boolean;
  color: number;
};

/** Pixels a flight rides over the ground (as a projectile does). */
const HEIGHT = 9;
const ARROW_COLOR = 0xc8d8f0;
const WITHER_COLOR = 0x80b040;

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

export class WarpFx {
  private flights = new Map<number, Flight>();
  private host: FxHost;

  constructor(host: FxHost) {
    this.host = host;
  }

  /** How many flights are in the air (for the tests). */
  get count(): number {
    return this.flights.size;
  }

  onEvent(e: SimEvent, w: World): void {
    if (e.t === 'warp') {
      const side = w.sides.find((s) => s.player.id === e.id) ?? w.sides[0];
      const c = side?.char?.utilities?.find((x) => x.skill.id === e.skill);
      const u = c?.skill.utility;
      const arrow = u?.kind === 'blink' && !!u.warp && 'speed' in u.warp;
      this.flights.set(e.id, {
        id: e.id,
        x: e.x,
        y: e.y,
        x2: e.x2,
        y2: e.y2,
        t: 0,
        seconds: Math.max(0.05, e.seconds),
        arrow,
        color: arrow ? ARROW_COLOR : ELEMENT_COLOR[1],
      });
    } else if (e.t === 'blink' && e.end) this.flights.delete(e.id);
  }

  private at(f: Flight, u: number, lift = HEIGHT): Pt {
    const p = this.host.project(f.x + (f.x2 - f.x) * u, f.y + (f.y2 - f.y) * u);
    return { x: p.x, y: p.y - lift };
  }

  /** Advance the flights and draw them (`air` is the additive layer, `ground` the one under the figures). */
  frame(w: World, dt: number, time: number, ground: Gfx, air: Gfx): void {
    for (const [id, f] of this.flights) {
      f.t += dt;
      // A flight whose blink never came (the character fell) goes when its time is well past.
      if (f.t > f.seconds * 1.2 + 0.3) {
        this.flights.delete(id);
        continue;
      }
      const u = Math.min(1, f.t / f.seconds);
      if (f.arrow) this.arrow(f, u, ground, air);
      else this.bolt(f, u, time, air);
    }
    for (const s of w.sides) this.wither(s, ground, time);
  }

  /** An arrow along the path: a tapered trail, a shaft with a head, a shadow on the floor, and the character's after-image following it. */
  private arrow(f: Flight, u: number, ground: Gfx, air: Gfx): void {
    const head = this.at(f, u);
    const ahead = this.at(f, Math.min(1, u + 0.02));
    let dx = ahead.x - head.x;
    let dy = ahead.y - head.y;
    if (Math.hypot(dx, dy) < 0.01) {
      const a = this.at(f, 0);
      const b = this.at(f, 1);
      dx = b.x - a.x;
      dy = b.y - a.y;
    }
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    const g = this.host.project(f.x + (f.x2 - f.x) * u, f.y + (f.y2 - f.y) * u);
    ground.fillStyle(0x000000, 0.3).fillEllipse(g.x, g.y + 1, 7, 3);
    // The landing: a ring on the spot the character will come to.
    const end = this.host.project(f.x2, f.y2);
    air.lineStyle(1, f.color, 0.4).strokeEllipse(end.x, end.y, 16, 8);
    // The trail: the last stretch of the path, wide at the head and thin at the tail.
    const tail = Math.max(0, u - 0.25);
    for (let i = 1; i <= 4; i++) {
      const a = this.at(f, tail + ((u - tail) * (i - 1)) / 4);
      const b = this.at(f, tail + ((u - tail) * i) / 4);
      air.lineStyle(1 + i * 0.8, f.color, 0.12 * i).lineBetween(a.x, a.y, b.x, b.y);
    }
    // The shaft and the head, in a dark rim.
    const t = { x: head.x - dx * 11, y: head.y - dy * 11 };
    const px = -dy;
    const py = dx;
    ground.lineStyle(3.4, 0x000000, 0.85).lineBetween(t.x, t.y, head.x, head.y);
    air.lineStyle(1.8, f.color, 1).lineBetween(t.x, t.y, head.x, head.y);
    air.lineStyle(0.9, lighten(f.color, 0.5), 1).lineBetween(t.x, t.y, head.x, head.y);
    air
      .fillStyle(0xffffff, 1)
      .fillTriangle(
        head.x + dx * 3.6,
        head.y + dy * 3.6,
        head.x - dx * 0.6 + px * 1.6,
        head.y - dy * 0.6 + py * 1.6,
        head.x - dx * 0.6 - px * 1.6,
        head.y - dy * 0.6 - py * 1.6,
      );
    air
      .lineStyle(1, lighten(f.color, 0.5), 0.9)
      .lineBetween(t.x, t.y, t.x + dx * 2.5 + px * 2, t.y + dy * 2.5 + py * 2)
      .lineBetween(t.x, t.y, t.x + dx * 2.5 - px * 2, t.y + dy * 2.5 - py * 2);
    air.fillStyle(f.color, 0.3).fillCircle(head.x, head.y, 4);
    // The character follows: a pale after-image a way behind the arrow.
    if (u > 0.2) {
      const b = this.at(f, u - 0.2, 0);
      air.fillStyle(f.color, 0.22).fillEllipse(b.x, b.y - 9, 7, 16);
      air.fillStyle(0xffffff, 0.3).fillCircle(b.x, b.y - 15, 2.4);
    }
  }

  /** The run of a Bolt Step: a jagged bolt from where the character stood to the head, which is a white spark. */
  private bolt(f: Flight, u: number, time: number, air: Gfx): void {
    const n = 8;
    const pts: Pt[] = [];
    const step = Math.floor(time * 24);
    for (let i = 0; i <= n; i++) {
      const p = this.at(f, (u * i) / n);
      const j = i === 0 || i === n ? 0 : 1;
      pts.push({
        x: p.x + j * Math.sin(step * 3.1 + i * 7.7) * 3,
        y: p.y + j * Math.sin(step * 2.3 + i * 5.1) * 3,
      });
    }
    for (const [w, c, a] of [
      [7, f.color, 0.22],
      [3, lighten(f.color, 0.25), 0.7],
      [1.2, 0xffffff, 0.95],
    ] as const) {
      air.lineStyle(w, c, a).beginPath().moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) air.lineTo(pts[i].x, pts[i].y);
      air.strokePath();
    }
    const head = pts[n];
    air.fillStyle(f.color, 0.35).fillCircle(head.x, head.y, 6);
    air.fillStyle(0xffffff, 0.95).fillCircle(head.x, head.y, 2.4);
    const end = this.host.project(f.x2, f.y2);
    air.lineStyle(1, f.color, 0.4).strokeEllipse(end.x, end.y, 16, 8);
  }

  /** The reach of Rotting Stride's withering: a faint ring round the character, until it does something else. */
  private wither(side: Side, ground: Gfx, time: number): void {
    const wd = side.wither;
    const p = side.player;
    if (!wd || !p.alive) return;
    const o = this.host.project(p.x, p.y);
    const rx = this.host.rpx(wd.radius);
    const sq = this.host.squash();
    ground.lineStyle(1, WITHER_COLOR, 0.3).strokeEllipse(o.x, o.y, rx * 2, rx * 2 * sq);
    ground.fillStyle(WITHER_COLOR, 0.05).fillEllipse(o.x, o.y, rx * 2, rx * 2 * sq);
    ground.fillStyle(lighten(WITHER_COLOR, 0.4), 0.6);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - time * 0.5;
      ground.fillRect(o.x + Math.cos(a) * rx - 1, o.y + Math.sin(a) * rx * sq - 1, 2, 2);
    }
  }
}
