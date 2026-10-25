import type Phaser from 'phaser';
import { chargeLane } from '../../../sim/abilities';
import { inBlast, pending } from '../../../sim/blasts';
import { hookTell, pullLanding } from '../../../sim/factions';
import { hunted } from '../../../sim/side';
import { inTelegraph, telegraphs } from '../../../sim/telegraph';
import type { Actor, SimEvent, World } from '../../../sim/types';
import type { FxHost } from './skillFx';

/**
 * How a monster moves the character, or itself, in one step: the hook of a pull (a chain that flies out and reels the character
 * in), the shock of a push (a ring and a trail), the lane of a charge (marked for the whole warning, and a streak as it runs).
 * The sim moves things at once; these draw the move so that it is seen coming and seen happening (docs/VISUAL_LANGUAGE.md).
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };
type Fx = { t: number; total: number; draw: (g: Gfx, air: Gfx, k: number) => void };

/** The host of the other effects, and where a figure is drawn now (a pulled figure slides, the sim has already moved it). */
export type MoveHost = FxHost & { renderPos?(id: number): Pt | null };

/** The colour of a warning, by damage type (as encounterFx.ts). */
const WARN = [0xe0d0b0, 0xd0b0ff, 0x90d8ff, 0xff9a40, 0xa0e04a];
/** A Tidewarden's hook is cold, like the sea it comes from. */
const HOOK = 0x90d8ff;
const CHAIN = 0x8f98a4;
const LINK = 0xe8eef4;
const IRON = 0x1c1f24;
const SHOCK = 0xf0e8d0;
/** Seconds the hook takes to reach the character, and the whole life of a pull's chain. */
const HOOK_FLIGHT = 0.12;
const CHAIN_LIFE = 0.5;

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

// ---- Geometry (pure, tested) -------------------------------------------------------------------------------------------

/** The points of a chain between two screen points: a slack chain sags (`slack` is the share of its length), a taut one is straight. */
export function chainPoints(a: Pt, b: Pt, slack: number, n = 10): Pt[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    out.push({
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f + Math.sin(Math.PI * f) * slack * len * 0.25,
    });
  }
  return out;
}

/** The barbs along a hooked lane from (x, y) to (x2, y2): where each tip is, and the direction the lane runs there (the barbs trail back at the caster). */
export function hookBarbs(
  x: number,
  y: number,
  x2: number,
  y2: number,
  spacing = 1.4,
  first = 1.2,
): { x: number; y: number; ang: number }[] {
  const ang = Math.atan2(y2 - y, x2 - x);
  const len = Math.hypot(x2 - x, y2 - y);
  const out: { x: number; y: number; ang: number }[] = [];
  for (let d = first; d < len; d += spacing)
    out.push({ x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, ang });
  return out;
}

/** The arrows of a push inside its disc: rings of them running outward from the middle (`time` moves them), each pointing out. */
export function pushArrows(
  x: number,
  y: number,
  radius: number,
  time: number,
  spokes = 8,
  rings = 2,
): { x: number; y: number; ang: number }[] {
  const out: { x: number; y: number; ang: number }[] = [];
  for (let j = 0; j < rings; j++) {
    const f = (((time * 0.8 + j / rings) % 1) + 1) % 1;
    const r = radius * (0.2 + 0.7 * f);
    for (let i = 0; i < spokes; i++) {
      const ang = (i / spokes) * Math.PI * 2 + (j % 2) * (Math.PI / spokes);
      out.push({ x: x + Math.cos(ang) * r, y: y + Math.sin(ang) * r, ang });
    }
  }
  return out;
}

export class MoveFx {
  private list: Fx[] = [];
  private air: Gfx;
  private host: MoveHost;
  /** The monsters that wound up a charge, and the seconds of the warning they were given. */
  private rushes = new Map<number, number>();
  private dustT = new Map<number, number>();

  constructor(host: MoveHost, scene: Phaser.Scene) {
    this.host = host;
    // Above the figures: a chain is in the air between hands.
    this.air = scene.add.graphics().setDepth(94400);
  }

  destroy(): void {
    this.air.destroy();
    this.list = [];
    this.rushes.clear();
  }

  private add(total: number, draw: (g: Gfx, air: Gfx, k: number) => void): void {
    if (this.list.length > 60) this.list.shift();
    this.list.push({ t: total, total, draw });
  }

  private pt(x: number, y: number): Pt {
    return this.host.project(x, y);
  }

  private lifted(x: number, y: number, lift: number): Pt {
    const p = this.host.project(x, y);
    return { x: p.x, y: p.y - lift };
  }

  /** Where a figure is drawn now, in tiles. */
  private where(id: number, fallback: Pt): Pt {
    const r = this.host.renderPos?.(id);
    if (r) return r;
    const a = this.host.actorById(id);
    return a ? { x: a.x, y: a.y } : fallback;
  }

  private circleLine(g: Gfx, x: number, y: number, r: number): void {
    const p = this.pt(x, y);
    const rx = this.host.rpx(r);
    g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.host.squash());
  }

  /** A quad round a lane, in screen points. */
  private laneQuad(x: number, y: number, x2: number, y2: number, width: number): Pt[] {
    const ang = Math.atan2(y2 - y, x2 - x);
    const nx = -Math.sin(ang) * (width / 2);
    const ny = Math.cos(ang) * (width / 2);
    return [
      this.pt(x + nx, y + ny),
      this.pt(x2 + nx, y2 + ny),
      this.pt(x2 - nx, y2 - ny),
      this.pt(x - nx, y - ny),
    ];
  }

  /** A small chevron on the ground at (x, y) pointing along `ang` (world angle). */
  private chevron(g: Gfx, x: number, y: number, ang: number, size: number): void {
    const tip = this.pt(x, y);
    for (const s of [-1, 1]) {
      const b = this.pt(x + Math.cos(ang + s * 2.6) * size, y + Math.sin(ang + s * 2.6) * size);
      g.lineBetween(tip.x, tip.y, b.x, b.y);
    }
  }

  /** Three strokes (a soft glow, the colour, a white core) along screen points. */
  private streak(g: Gfx, pts: Pt[], color: number, alpha: number, scale = 1): void {
    if (pts.length < 2 || alpha <= 0) return;
    for (const [w, c, a] of [
      [7 * scale, color, 0.28],
      [4 * scale, lighten(color, 0.25), 0.7],
      [1.5 * scale, 0xffffff, 0.95],
    ] as const) {
      g.lineStyle(w, c, a * alpha)
        .beginPath()
        .moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    }
  }

  // ---- Per frame -------------------------------------------------------------------------------------------------

  /** Draw the warnings of hooks and charges, the streaks of a charge, and the short effects of pulls and pushes. */
  frame(w: World, dt: number, time: number, g: Gfx): void {
    this.air.clear();
    this.hooks(w, g, time);
    this.charges(w, dt, time, g);
    let j = 0;
    for (const f of this.list) {
      f.t -= dt;
      if (f.t <= 0) continue;
      this.list[j++] = f;
      f.draw(g, this.air, 1 - f.t / f.total);
    }
    this.list.length = j;
  }

  /**
   * The warning of a Warding Pulse is a disc that hurts and throws: arrows run out from its middle, so that it reads as a push.
   * Drawn after the blast discs, on top of them.
   */
  warnings(w: World, g: Gfx, time: number): void {
    for (const e of w.effects) {
      if (!e.push || e.shape || pending(e)) continue;
      const k = 1 - e.t / e.total;
      g.lineStyle(1.5, SHOCK, 0.55 + 0.4 * k);
      for (const a of pushArrows(e.x, e.y, e.radius, time)) this.chevron(g, a.x, a.y, a.ang, 0.34);
    }
  }

  /** A mark where a hooked lane will leave the character: a ring on the ground and a dotted line from where it stands. */
  private landing(g: Gfx, p: Actor, land: Pt, col: number, time: number): void {
    const pulse = 0.7 + 0.3 * Math.sin(time * 12);
    g.lineStyle(1.5, col, 0.9 * pulse);
    this.circleLine(g, land.x, land.y, p.r + 0.15);
    g.lineStyle(1, 0xffffff, 0.5 * pulse);
    this.circleLine(g, land.x, land.y, p.r + 0.3);
    const a = this.pt(p.x, p.y);
    const b = this.pt(land.x, land.y);
    g.fillStyle(0xffffff, 0.8);
    const n = 6;
    for (let i = 1; i < n; i++)
      g.fillRect(a.x + ((b.x - a.x) * i) / n - 1, a.y + ((b.y - a.y) * i) / n - 1, 2, 2);
  }

  /** Barbs along a hooked lane, pointing back at the caster. */
  private barbs(g: Gfx, x: number, y: number, x2: number, y2: number, alpha: number): void {
    g.lineStyle(1.5, 0xffffff, alpha);
    for (const b of hookBarbs(x, y, x2, y2)) this.chevron(g, b.x, b.y, b.ang, 0.4);
  }

  private hooks(w: World, g: Gfx, time: number): void {
    // A Tidecaller's lance: the lane the ground already shows gets its barbs, and the character in it the place it will be dragged to.
    for (const t of telegraphs(w)) {
      if (t.kind !== 'lane' || !t.pull) continue;
      this.barbs(g, t.x, t.y, t.x2, t.y2, 0.55 + 0.4 * t.progress);
      const src = t.src === undefined ? undefined : this.host.actorById(t.src);
      if (!src) continue;
      const p = hunted(w, src);
      if (!p.alive || !inTelegraph(t, p.x, p.y, p.r)) continue;
      const land = pullLanding(w, p, src, t.pull);
      if (land) this.landing(g, p, land, WARN[t.dtype] ?? WARN[0], time);
    }
    // A hooked lane of a pattern (Twin hooks) shows barbs already; the character it will catch sees where it will be dragged to.
    for (const e of w.effects) {
      if (!e.pull || e.shape !== 'lane' || pending(e) || e.owner === undefined) continue;
      const src = this.host.actorById(e.owner);
      if (!src) continue;
      const p = hunted(w, src);
      if (!p.alive || !inBlast(e, p.x, p.y, p.r)) continue;
      const land = pullLanding(w, p, src, e.pull);
      if (land) this.landing(g, p, land, WARN[e.dtype] ?? WARN[0], time);
    }
    // A Tidewarden throws its hook when a timer runs out: the lane to the character fills over the last moments.
    for (const a of w.actors) {
      const tell = hookTell(w, a);
      if (!tell) continue;
      const p = hunted(w, a);
      if (tell.inRange) {
        const quad = this.laneQuad(a.x, a.y, p.x, p.y, 0.8);
        g.fillStyle(0x000000, 0.18).fillPoints(quad as Phaser.Math.Vector2[], true);
        g.fillStyle(HOOK, 0.16 + 0.16 * tell.progress).fillPoints(
          quad as Phaser.Math.Vector2[],
          true,
        );
        g.lineStyle(2, 0x000000, 0.27).strokePoints(quad as Phaser.Math.Vector2[], true, true);
        g.lineStyle(1, HOOK, 0.6).strokePoints(quad as Phaser.Math.Vector2[], true, true);
        this.barbs(g, a.x, a.y, p.x, p.y, 0.55 + 0.4 * tell.progress);
        if (tell.land) this.landing(g, p, tell.land, HOOK, time);
      }
      if (tell.ready) {
        // The hook is ready and waits for the character to come in range: a ring of barbs round the Warden.
        const pulse = 0.6 + 0.4 * Math.sin(time * 9);
        g.lineStyle(1.5, HOOK, 0.8 * pulse);
        this.circleLine(g, a.x, a.y, a.r + 0.35);
        g.lineStyle(1.5, 0xffffff, 0.7 * pulse);
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + time * 0.8;
          this.chevron(
            g,
            a.x + Math.cos(ang) * (a.r + 0.35),
            a.y + Math.sin(ang) * (a.r + 0.35),
            ang,
            0.25,
          );
        }
      }
    }
  }

  private charges(w: World, dt: number, time: number, g: Gfx): void {
    for (const [id, seconds] of this.rushes) {
      const a = this.host.actorById(id);
      if (!a || !a.alive) {
        this.rushes.delete(id);
        this.dustT.delete(id);
        continue;
      }
      if (a.dash.windT > 0) {
        const lane = chargeLane(w, a);
        if (!lane) continue;
        const k = Math.max(0, Math.min(1, 1 - a.dash.windT / Math.max(0.05, seconds)));
        const quad = this.laneQuad(
          lane.x,
          lane.y,
          lane.x2,
          lane.y2,
          lane.width,
        ) as Phaser.Math.Vector2[];
        g.fillStyle(0x000000, 0.14).fillPoints(quad, true);
        g.fillStyle(WARN[0], 0.08 + 0.14 * k).fillPoints(quad, true);
        g.lineStyle(2, 0x000000, 0.27).strokePoints(quad, true, true);
        g.lineStyle(1, WARN[0], 0.55).strokePoints(quad, true, true);
        // Chevrons run down the lane: it is a path, and it ends at its far edge.
        const ang = Math.atan2(lane.y2 - lane.y, lane.x2 - lane.x);
        const len = Math.hypot(lane.x2 - lane.x, lane.y2 - lane.y);
        g.lineStyle(1.5, lighten(WARN[0], 0.4), 0.45 + 0.45 * k);
        const size = Math.min(0.5, lane.width * 0.4 + 0.1);
        for (let d = 0.8 + ((time * 3) % 0.9); d < len; d += 0.9)
          this.chevron(g, lane.x + Math.cos(ang) * d, lane.y + Math.sin(ang) * d, ang, size);
        const end = this.laneQuad(lane.x2, lane.y2, lane.x2, lane.y2, lane.width);
        g.lineStyle(2, WARN[0], 0.8).lineBetween(end[0].x, end[0].y, end[3].x, end[3].y);
      } else if (a.dash.t > 0) {
        this.rush(a, dt);
      } else {
        this.rushes.delete(id);
        this.dustT.delete(id);
      }
    }
  }

  /** A monster in the middle of a charge: speed lines behind it and dust at its feet. */
  private rush(a: Actor, dt: number): void {
    const dx = a.dash.x - a.x;
    const dy = a.dash.y - a.y;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy * a.r * 0.8;
    const ny = ux * a.r * 0.8;
    const air = this.air;
    for (const [off, tail, al] of [
      [0, 2.4, 1],
      [-1, 1.8, 0.7],
      [1, 1.8, 0.7],
    ] as const) {
      const x0 = a.x + nx * off;
      const y0 = a.y + ny * off;
      this.streak(
        air,
        [this.lifted(x0, y0, 7), this.lifted(x0 - ux * tail, y0 - uy * tail, 7)],
        WARN[0],
        al * 0.8,
        0.7,
      );
    }
    const t = (this.dustT.get(a.id) ?? 0) - dt;
    if (t <= 0) {
      this.dustT.set(a.id, 0.06);
      const p = this.pt(a.x - ux * a.r, a.y - uy * a.r);
      this.host.em.dust.explode(2, p.x, p.y);
    } else this.dustT.set(a.id, t);
  }

  // ---- Events ----------------------------------------------------------------------------------------------------

  onEvent(e: SimEvent, w: World): void {
    switch (e.t) {
      case 'rush':
        this.rushes.set(e.id, e.seconds);
        break;
      case 'pull':
        this.pulled(e);
        break;
      case 'push':
        this.pushed(e);
        break;
      default:
        break;
    }
    void w;
  }

  /** A hook flies out to the character, then the chain draws taut and reels it in; the figure slides along it. */
  private pulled(e: Extract<SimEvent, { t: 'pull' }>): void {
    const from = this.lifted(e.x, e.y, 8);
    this.add(CHAIN_LIFE, (_g, air, k) => {
      const t = k * CHAIN_LIFE;
      const m = this.host.actorById(e.src);
      const hand = this.lifted(m ? m.x : e.hx, m ? m.y : e.hy, 10);
      const fly = Math.min(1, t / HOOK_FLIGHT);
      const body = this.where(e.dst, { x: e.x2, y: e.y2 });
      const bp = this.lifted(body.x, body.y, 8);
      const head =
        fly < 1 ? { x: hand.x + (from.x - hand.x) * fly, y: hand.y + (from.y - hand.y) * fly } : bp;
      const fade = k > 0.7 ? (1 - k) / 0.3 : 1;
      // Slack while it flies, taut once it has hold; it goes slack again as the figure comes to rest.
      const slack = fly < 1 ? 0.5 * (1 - fly) : Math.max(0, 0.25 * (1 - (t - HOOK_FLIGHT) / 0.15));
      const pts = chainPoints(hand, head, slack);
      air
        .lineStyle(3, IRON, 0.8 * fade)
        .beginPath()
        .moveTo(pts[0].x, pts[0].y);
      for (const p of pts) air.lineTo(p.x, p.y);
      air.strokePath();
      air.lineStyle(1.5, CHAIN, fade).beginPath().moveTo(pts[0].x, pts[0].y);
      for (const p of pts) air.lineTo(p.x, p.y);
      air.strokePath();
      air.fillStyle(LINK, fade);
      for (const p of pts) air.fillRect(p.x - 1, p.y - 1, 2, 2);
      // The hook: a barbed head on the end of the chain.
      const ang = Math.atan2(head.y - hand.y, head.x - hand.x);
      air.lineStyle(2, LINK, fade);
      for (const s of [-1, 1])
        air.lineBetween(
          head.x,
          head.y,
          head.x + Math.cos(ang + Math.PI + s * 0.6) * 5,
          head.y + Math.sin(ang + Math.PI + s * 0.6) * 5,
        );
    });
    // The character's own trail: where it was, drawn out toward where it is.
    const to = this.lifted(e.x2, e.y2, 8);
    this.add(0.3, (_g, air, k) => this.streak(air, [from, to], HOOK, 1 - k, 1.2));
    const o = this.pt(e.x, e.y);
    this.host.em.dust.explode(5, o.x, o.y);
  }

  /** A pulse went off: a ring runs out to its edge, and the character that was thrown leaves a trail and a puff where it stood. */
  private pushed(e: Extract<SimEvent, { t: 'push' }>): void {
    this.add(0.4, (g, _air, k) => {
      const r = 0.3 + (e.r * 1.1 - 0.3) * (1 - (1 - k) * (1 - k));
      g.lineStyle(4 * (1 - k) + 1, SHOCK, 1 - k);
      this.circleLine(g, e.ox, e.oy, r);
      g.lineStyle(1, 0xffffff, 0.6 * (1 - k));
      this.circleLine(g, e.ox, e.oy, r * 0.85);
    });
    const dx = e.x2 - e.x;
    const dy = e.y2 - e.y;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    this.add(0.3, (_g, air, k) => {
      // Speed lines behind the figure, along the way it was thrown (the figure slides along them).
      const body = this.where(e.dst, { x: e.x2, y: e.y2 });
      for (const off of [-0.25, 0, 0.25]) {
        const bx = body.x - uy * off;
        const by = body.y + ux * off;
        const tail = 1.6 * (off === 0 ? 1 : 0.7);
        this.streak(
          air,
          [this.lifted(bx, by, 8), this.lifted(bx - ux * tail, by - uy * tail, 8)],
          SHOCK,
          1 - k,
          0.8,
        );
      }
    });
    const o = this.pt(e.x, e.y);
    this.host.em.dust.explode(6, o.x, o.y);
    this.host.flash(o.x, o.y - 8, SHOCK, 1, 0.12);
  }
}
