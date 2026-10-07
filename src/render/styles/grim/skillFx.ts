import type Phaser from 'phaser';
import { BUFF_IDS } from '../../../data/buffs';
import {
  auraLook,
  deliveryOf,
  elementOfTags,
  ELEMENT_COLOR,
  profileLook,
  UTILITY_COLOR,
  type Delivery,
} from '../../../calc/skillLook';
import { MINIONS } from '../../../data/minions';
import { choiceByKey } from '../../../sim/deploy';
import type { Actor, SimEvent, World } from '../../../sim/types';

/**
 * Skill effects for the grim style, drawn from sim events and sim state. The language (see src/calc/skillLook.ts):
 * colour is the damage type, shape is the delivery. Attacks are sharp (crescents, thrusts, thin streaks), spells are
 * round (runes, rings, orbs), areas are rings that grow from where they go off, lasting zones are patches on the ground,
 * and upkeep (buffs, warcries, curses, summons, auras) uses its own gold, steel, violet and teal.
 */

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;
type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

export type FxHost = {
  project(x: number, y: number): Pt;
  /** A radius in tiles as the horizontal semi-axis in pixels, and the height over width of a ground circle. */
  rpx(r: number): number;
  squash(): number;
  em: Record<string, Emitter>;
  flash(x: number, y: number, color: number, scale?: number, intensity?: number): void;
  shake(amount: number): void;
  actorById(id: number): Actor | null;
};

type Fx = { t: number; total: number; air: boolean; draw: (g: Gfx, k: number) => void };

/** Pixels an effect is lifted to the height of a hand or a chest. */
const HAND = 8;

const lighten = (c: number, f: number): number => {
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m(r) << 16) | (m(g) << 8) | m(b);
};

const KIND_COLOR = { totem: 0xc8a060, brand: 0xb070ff, trap: 0xe0c040, mine: 0xff7040 } as const;

export class SkillFx {
  private list: Fx[] = [];
  private air: Gfx;
  private blinkFrom = new Map<number, Pt>();
  private lastBuff = new Map<string, number>();
  private lastHex = new Map<number, number>();
  private now = 0;

  private host: FxHost;

  constructor(host: FxHost, scene: Phaser.Scene) {
    this.host = host;
    // Light adds up: effects glow against the dark map.
    this.air = scene.add.graphics().setDepth(94500).setBlendMode(1);
  }

  destroy(): void {
    this.air.destroy();
    this.list = [];
  }

  // ---- Primitives -----------------------------------------------------------------------------
  private add(total: number, air: boolean, draw: (g: Gfx, k: number) => void): void {
    if (this.list.length > 80) this.list.shift();
    this.list.push({ t: total, total, air, draw });
  }

  /** An ellipse on the ground around a world point. */
  private ring(
    g: Gfx,
    x: number,
    y: number,
    r: number,
    color: number,
    alpha: number,
    width = 1,
  ): void {
    const p = this.host.project(x, y);
    const rx = this.host.rpx(r);
    g.lineStyle(width, color, alpha).strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.host.squash());
  }

  private disc(g: Gfx, x: number, y: number, r: number, color: number, alpha: number): void {
    const p = this.host.project(x, y);
    const rx = this.host.rpx(r);
    g.fillStyle(color, alpha).fillEllipse(p.x, p.y, rx * 2, rx * 2 * this.host.squash());
  }

  /** Small ticks spaced round a ground circle (rotating with `spin`). */
  private ticks(
    g: Gfx,
    x: number,
    y: number,
    r: number,
    n: number,
    spin: number,
    color: number,
    alpha: number,
    size = 2,
  ): void {
    const p = this.host.project(x, y);
    const rx = this.host.rpx(r);
    const sq = this.host.squash();
    g.fillStyle(color, alpha);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + spin;
      g.fillRect(
        p.x + Math.cos(a) * rx - size / 2,
        p.y + Math.sin(a) * rx * sq - size / 2,
        size,
        size,
      );
    }
  }

  /** Three strokes (a soft outer glow, the colour, a white core) along a polyline of screen points. */
  private streak(g: Gfx, pts: Pt[], color: number, alpha: number, scale = 1): void {
    if (pts.length < 2) return;
    for (const [w, c, a] of [
      [9 * scale, color, 0.28],
      [5 * scale, lighten(color, 0.25), 0.7],
      [2 * scale, 0xffffff, 0.95],
    ] as const) {
      g.lineStyle(w, c, a * alpha)
        .beginPath()
        .moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    }
  }

  private lifted(x: number, y: number, lift = HAND): Pt {
    const p = this.host.project(x, y);
    return { x: p.x, y: p.y - lift };
  }

  /** A rune circle drawn on the ground: the spell cue, round and ringed. */
  rune(x: number, y: number, r: number, color: number, total: number, spinDir = 1): void {
    this.add(total, false, (g, k) => {
      const a = 1 - k * k;
      this.disc(g, x, y, r, color, 0.16 * a);
      this.ring(g, x, y, r * (0.8 + 0.2 * k), color, 0.95 * a, 2.5);
      this.ring(g, x, y, r * 0.55, lighten(color, 0.3), 0.55 * a, 1);
      this.ticks(g, x, y, r * 0.8, 6, spinDir * k * 4, 0xffffff, 0.9 * a, 2);
    });
  }

  /** A ring that grows from a point: an area going off. */
  wave(
    x: number,
    y: number,
    r0: number,
    r1: number,
    color: number,
    total: number,
    width = 2.5,
  ): void {
    this.add(total, false, (g, k) => {
      const e = 1 - (1 - k) * (1 - k);
      const r = r0 + (r1 - r0) * e;
      this.disc(g, x, y, r, color, 0.24 * (1 - k));
      this.ring(g, x, y, r, color, 1 * (1 - k), width * 1.4 * (1 - 0.6 * k));
      this.ring(g, x, y, r * 0.82, lighten(color, 0.4), 0.5 * (1 - k), 1);
    });
  }

  // ---- Events ---------------------------------------------------------------------------------
  onEvent(e: SimEvent, w: World): void {
    switch (e.t) {
      case 'use': {
        const a = this.host.actorById(e.src);
        if (a) this.cast(a);
        break;
      }
      case 'swing':
        this.swing(e);
        break;
      case 'thrust':
        this.thrust(e);
        break;
      case 'explode': {
        const c = ELEMENT_COLOR[e.dtype] ?? 0xffffff;
        this.wave(e.x, e.y, e.r * 0.2, Math.max(0.5, e.r), c, 0.34);
        if (e.dtype === 0) this.cracks(e.x, e.y, e.r);
        break;
      }
      case 'buff':
        this.buffPulse(e.id, w);
        break;
      case 'hex': {
        if (this.now - (this.lastHex.get(e.id) ?? -9) < 0.6) break;
        this.lastHex.set(e.id, this.now);
        const t = this.host.actorById(e.id);
        if (t) this.rune(t.x, t.y, 0.95, UTILITY_COLOR.curse, 0.55, -1);
        break;
      }
      case 'summon': {
        const m = w.minions.find((x) => x.id === e.id);
        if (m) {
          this.rune(m.x, m.y, 0.9, UTILITY_COLOR.summon, 0.6);
          const p = this.lifted(m.x, m.y, 4);
          this.host.em.mote.explode(5, p.x, p.y);
        }
        break;
      }
      case 'blink': {
        if (!e.end) {
          this.blinkFrom.set(e.id, { x: e.x, y: e.y });
          break;
        }
        const from = this.blinkFrom.get(e.id);
        this.blinkFrom.delete(e.id);
        if (!from) break;
        const a = this.lifted(from.x, from.y);
        const b = this.lifted(e.x, e.y);
        this.add(0.24, true, (g, k) => this.streak(g, [a, b], UTILITY_COLOR.blink, 1 - k, 1.4));
        this.wave(e.x, e.y, 0.2, 1.0, UTILITY_COLOR.blink, 0.3, 1.5);
        break;
      }
      case 'deploy': {
        const c = 0xffe0a0;
        this.wave(e.x, e.y, 0.2, e.end ? 1.4 : 0.9, c, e.end ? 0.35 : 0.3, 1.5);
        break;
      }
      default:
        break;
    }
  }

  /** What a skill use shows while it winds up: the cue of its kind. */
  private cast(a: Actor): void {
    const act = a.action;
    if (!act) return;
    const look = profileLook(act.profile);
    const c = look.color;
    switch (look.delivery) {
      case 'swing':
      case 'strike':
        return;
      case 'arrow': {
        // A muzzle streak toward where the arrow goes.
        const fx = Math.cos(a.facing);
        const fy = Math.sin(a.facing);
        const p0 = this.lifted(a.x + fx * 0.3, a.y + fy * 0.3);
        const p1 = this.lifted(a.x + fx * 1.1, a.y + fy * 1.1);
        this.add(0.12, true, (g, k) => this.streak(g, [p0, p1], c, 1 - k, 0.8));
        this.host.em.spark.explode(2, p0.x, p0.y);
        return;
      }
      case 'curse': {
        const t = this.host.actorById(act.targetId);
        this.rune(a.x, a.y, 0.7, c, 0.4, -1);
        if (t) this.rune(t.x, t.y, 1.0, c, 0.55, -1);
        return;
      }
      case 'summon':
        this.rune(a.x, a.y, 1.3, c, 0.6);
        return;
      case 'blink':
        return;
      case 'buff':
      case 'warcry':
      case 'guard':
      case 'aura':
      case 'herald':
        this.rune(a.x, a.y, 0.8, c, 0.45);
        return;
      default:
        this.rune(a.x, a.y, a.isPlayer ? 0.8 : 0.6, c, 0.45);
    }
  }

  private cracks(x: number, y: number, r: number): void {
    const n = 9;
    const seeds = Array.from(
      { length: n },
      (_, i) => (i / n) * Math.PI * 2 + Math.sin(x * 7 + i) * 0.3,
    );
    this.add(0.5, false, (g, k) => {
      const p = this.host.project(x, y);
      const rx = this.host.rpx(r);
      const sq = this.host.squash();
      g.lineStyle(1.5, 0x1a1410, 0.75 * (1 - k * k));
      for (const a of seeds) {
        const r0 = rx * 0.25;
        const r1 = rx * (0.7 + 0.3 * Math.min(1, k * 3));
        g.lineBetween(
          p.x + Math.cos(a) * r0,
          p.y + Math.sin(a) * r0 * sq,
          p.x + Math.cos(a) * r1,
          p.y + Math.sin(a) * r1 * sq,
        );
      }
    });
  }

  /** A melee sweep: a crescent that follows the weapon through the arc and fills the area it covers. */
  private swing(e: Extract<SimEvent, { t: 'swing' }>): void {
    const src = this.host.actorById(e.src);
    const enemy = !!src && !src.isPlayer;
    const color = ELEMENT_COLOR[e.dtype] ?? 0xffffff;
    const half = ((e.arc / 2) * Math.PI) / 180;
    const a0 = e.facing - half;
    const a1 = e.facing + half;
    const scale = enemy ? 0.75 : 1;
    this.add(0.22, true, (g, k) => {
      const head = a0 + (a1 - a0) * Math.min(1, k * 2.4);
      const fade = 1 - Math.max(0, (k - 0.3) / 0.7);
      const n = 16;
      const pts: Pt[] = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((head - a0) * i) / n;
        pts.push(this.lifted(e.x + Math.cos(a) * e.radius, e.y + Math.sin(a) * e.radius));
      }
      const o = this.lifted(e.x, e.y);
      g.fillStyle(color, 0.12 * fade)
        .beginPath()
        .moveTo(o.x, o.y);
      for (const p of pts) g.lineTo(p.x, p.y);
      g.closePath().fillPath();
      this.streak(g, pts, color, fade, scale);
    });
    if (e.heavy) {
      const p = this.lifted(
        e.x + Math.cos(e.facing) * e.radius * 0.8,
        e.y + Math.sin(e.facing) * e.radius * 0.8,
        0,
      );
      this.host.em.dust.explode(6, p.x, p.y);
      this.host.shake(2);
    }
  }

  /** A melee thrust at one enemy: a straight streak with a point at its end. */
  private thrust(e: Extract<SimEvent, { t: 'thrust' }>): void {
    const src = this.host.actorById(e.src);
    const enemy = !!src && !src.isPlayer;
    const color = ELEMENT_COLOR[e.dtype] ?? 0xffffff;
    const dx = e.x2 - e.x;
    const dy = e.y2 - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    // From the front of the body to the enemy, a little short of its centre.
    const p0 = this.lifted(e.x + ux * 0.4, e.y + uy * 0.4);
    const p1 = this.lifted(e.x2 - ux * 0.2, e.y2 - uy * 0.2);
    const scale = (enemy ? 0.75 : 1) * (e.heavy ? 1.6 : 1);
    this.add(0.18, true, (g, k) => {
      const head = {
        x: p0.x + (p1.x - p0.x) * Math.min(1, k * 3),
        y: p0.y + (p1.y - p0.y) * Math.min(1, k * 3),
      };
      const tail = {
        x: p0.x + (head.x - p0.x) * Math.max(0, k * 1.5 - 0.2),
        y: p0.y + (head.y - p0.y) * Math.max(0, k * 1.5 - 0.2),
      };
      this.streak(g, [tail, head], color, 1 - k * k, scale);
    });
    if (e.heavy) {
      const p = this.host.project(e.x2, e.y2);
      this.host.em.dust.explode(6, p.x, p.y);
      this.host.shake(2);
    }
  }

  /** A buff or warcry begins: a pulse around the player, in the colour of its kind. */
  private buffPulse(id: string, w: World): void {
    if (this.now - (this.lastBuff.get(id) ?? -9) < 1.2) return;
    const c = w.char.utilities.find(
      (u) => u.skill.utility?.kind === 'buff' && u.skill.utility.buff === id,
    );
    if (!c) return;
    this.lastBuff.set(id, this.now);
    const s = c.skill;
    const delivery: Delivery = deliveryOf(s.behaviour, s.type, s.tags, s.utility);
    const p = w.player;
    const color = UTILITY_COLOR[delivery === 'warcry' || delivery === 'guard' ? delivery : 'buff'];
    if (delivery === 'warcry') {
      this.wave(p.x, p.y, 0.5, 5, color, 0.55, 3);
      this.wave(p.x, p.y, 0.3, 3, lighten(color, 0.4), 0.4, 2);
      this.host.shake(1.5);
    } else if (delivery === 'guard') {
      this.wave(p.x, p.y, 0.4, 1.5, color, 0.45, 2);
      this.add(0.6, true, (g, k) => {
        const o = this.lifted(p.x, p.y, 2);
        const a = 1 - k;
        g.lineStyle(1.5, color, 0.9 * a).beginPath();
        for (let i = 0; i <= 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const x = o.x + Math.cos(ang) * 9;
          const y = o.y - 10 - k * 6 + Math.sin(ang) * 4.5;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokePath();
      });
    } else {
      this.wave(p.x, p.y, 0.3, 1.8, color, 0.5, 2);
      const q = this.lifted(p.x, p.y, 6);
      this.host.em.mote.explode(8, q.x, q.y);
    }
  }

  // ---- Per frame ------------------------------------------------------------------------------
  /**
   * Advance and draw: lasting things that follow the sim's state (zones, deployables, minions, auras, buffs, curse
   * marks) and the short effects the events started. `ground` is the style's ground layer, already cleared.
   */
  frame(w: World, dt: number, time: number, ground: Gfx): void {
    this.now = time;
    this.zones(ground, w, time);
    this.deployables(ground, w, time);
    this.minions(ground, w, time);
    this.upkeep(ground, w, time);
    const air = this.air;
    air.clear();
    this.curseMarks(air, w, time);
    let j = 0;
    for (const f of this.list) {
      f.t -= dt;
      if (f.t <= 0) continue;
      this.list[j++] = f;
      f.draw(f.air ? air : ground, 1 - f.t / f.total);
    }
    this.list.length = j;
  }

  /** Zones the player's skills left on the ground: a telegraph before the first pulse, then a patch in the element's colour. */
  private zones(g: Gfx, w: World, time: number): void {
    for (const z of w.zones) {
      const c = ELEMENT_COLOR[z.dtype] ?? 0xffffff;
      const owner = this.host.actorById(z.owner);
      const hostile = !!owner && !owner.isPlayer;
      const left =
        z.delayT > 0 ? z.interval * z.pulsesLeft : z.pulseT + (z.pulsesLeft - 1) * z.interval;
      const fade = Math.min(1, Math.max(0, left / 0.8));
      const edge = hostile ? lighten(c, 0.2) : c;
      if (z.x2 !== undefined && z.y2 !== undefined) {
        // A strip: a band along the line with marks flowing down it.
        const dx = z.x2 - z.x;
        const dy = z.y2 - z.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * z.radius;
        const ny = (dx / len) * z.radius;
        const q = [
          this.host.project(z.x + nx, z.y + ny),
          this.host.project(z.x2 + nx, z.y2 + ny),
          this.host.project(z.x2 - nx, z.y2 - ny),
          this.host.project(z.x - nx, z.y - ny),
        ];
        const live = z.delayT <= 0;
        g.fillStyle(c, (live ? 0.16 : 0.07) * fade)
          .beginPath()
          .moveTo(q[0].x, q[0].y);
        for (let i = 1; i < 4; i++) g.lineTo(q[i].x, q[i].y);
        g.closePath().fillPath();
        g.lineStyle(1, edge, (live ? 0.8 : 0.5) * fade)
          .beginPath()
          .moveTo(q[0].x, q[0].y);
        for (let i = 1; i < 4; i++) g.lineTo(q[i].x, q[i].y);
        g.closePath().strokePath();
        if (live)
          for (let i = 0; i < 9; i++) {
            const f = (i / 9 + time * 0.6) % 1;
            const side = Math.sin(i * 12.9898) * 0.6;
            const p = this.host.project(
              z.x + dx * f + (nx / z.radius) * side * z.radius,
              z.y + dy * f + (ny / z.radius) * side * z.radius,
            );
            g.fillStyle(lighten(c, 0.4), 0.7 * fade).fillRect(p.x - 1, p.y - 1, 2, 2);
          }
        continue;
      }
      if (z.delayT > 0) {
        // The zone is coming: a faint disc with a ring of ticks that closes in.
        const k = 1 - z.delayT / Math.max(0.01, z.delayT + 0.3);
        void k;
        this.disc(g, z.x, z.y, z.radius, c, 0.06);
        this.ring(g, z.x, z.y, z.radius, edge, 0.55, 1);
        this.ticks(g, z.x, z.y, z.radius, 16, time * 1.2, edge, 0.8, 2);
        continue;
      }
      this.disc(g, z.x, z.y, z.radius, c, (0.14 + 0.04 * Math.sin(time * 3)) * fade);
      this.ring(g, z.x, z.y, z.radius, edge, 0.75 * fade, 1);
      this.zoneMotif(g, z.x, z.y, z.radius, z.dtype, c, time, fade);
    }
  }

  /** The marks inside a lasting zone say what it is made of. */
  private zoneMotif(
    g: Gfx,
    x: number,
    y: number,
    r: number,
    dtype: number,
    c: number,
    time: number,
    fade: number,
  ): void {
    const p = this.host.project(x, y);
    const rx = this.host.rpx(r);
    const sq = this.host.squash();
    const n = 8;
    for (let i = 0; i < n; i++) {
      const seed = i * 1.7;
      const a = (i / n) * Math.PI * 2 + (dtype === 4 ? time * 0.9 : seed);
      const rr = rx * (0.25 + 0.6 * ((i * 0.37 + (dtype === 4 ? 0 : time * 0.1)) % 1));
      const px = p.x + Math.cos(a) * rr;
      const py = p.y + Math.sin(a) * rr * sq;
      if (dtype === 3) {
        // Fire: embers rising.
        const rise = ((time * 0.8 + i * 0.31) % 1) * 10;
        g.fillStyle(lighten(c, 0.3), 0.8 * (1 - rise / 10) * fade).fillRect(
          px - 1,
          py - rise - 1,
          2,
          2,
        );
      } else if (dtype === 2) {
        // Cold: crystals that glint.
        const glint = Math.sin(time * 5 + i * 2) > 0.5 ? 1 : 0.35;
        g.fillStyle(0xffffff, 0.7 * glint * fade).fillTriangle(
          px,
          py - 3,
          px - 1.5,
          py,
          px + 1.5,
          py,
        );
      } else if (dtype === 1) {
        // Lightning: a crackle that jumps.
        if (Math.sin(time * 9 + i * 3) > 0.4) {
          g.lineStyle(1, 0xffffff, 0.85 * fade)
            .beginPath()
            .moveTo(px, py)
            .lineTo(px + 2, py - 2)
            .lineTo(px - 1, py - 4)
            .lineTo(px + 1, py - 6)
            .strokePath();
        }
      } else if (dtype === 4) {
        // Chaos: slow swirling motes.
        g.fillStyle(lighten(c, 0.2), 0.75 * fade).fillCircle(px, py, 1.4);
      } else {
        // Physical: dust ticks lying on the ground.
        g.fillStyle(0x6a5a48, 0.7 * fade).fillRect(px - 1.5, py, 3, 1);
      }
    }
  }

  /** Totems, brands, traps and mines: the shape says which, the glow says the element. */
  private deployables(g: Gfx, w: World, time: number): void {
    for (const d of w.deployables) {
      const { x, y } = this.host.project(d.x, d.y);
      const choice = choiceByKey(w, d.key);
      const element = choice ? elementOfTags(choice.skill.tags, choice.skill.spellDamage) : 0;
      const glow = ELEMENT_COLOR[element];
      const base = KIND_COLOR[d.kind];
      const fade = Math.min(1, d.t);
      const armed = d.fireT <= 0.05;
      g.fillStyle(0x000000, 0.3 * fade).fillEllipse(x, y + 1, 12, 5);
      if (d.kind === 'totem') {
        g.fillStyle(0x6a5030, 0.95 * fade).fillRect(x - 3, y - 13, 6, 13);
        g.fillStyle(base, 0.95 * fade).fillRect(x - 4, y - 15, 8, 3);
        const pulse = 0.6 + 0.4 * Math.sin(time * 6 + d.id);
        g.fillStyle(glow, 0.35 * fade * pulse).fillCircle(x, y - 19, 5);
        g.fillStyle(lighten(glow, 0.4), 0.95 * fade).fillCircle(x, y - 19, 2.4);
      } else if (d.kind === 'brand') {
        const spin = time * 1.5 + d.id;
        g.fillStyle(glow, 0.12 * fade).fillEllipse(x, y, 20, 10);
        g.lineStyle(1, glow, 0.9 * fade).strokeEllipse(x, y - 6, 12, 6);
        for (let i = 0; i < 3; i++) {
          const a = spin + (i / 3) * Math.PI * 2;
          g.lineStyle(1, lighten(glow, 0.3), 0.8 * fade).lineBetween(
            x,
            y - 6,
            x + Math.cos(a) * 6,
            y - 6 + Math.sin(a) * 3,
          );
        }
        g.fillStyle(0xffffff, 0.9 * fade).fillCircle(x, y - 6, 1.5);
      } else if (d.kind === 'trap') {
        g.fillStyle(0x3a3020, 0.9 * fade).fillRect(x - 5, y - 2, 10, 4);
        g.lineStyle(1, base, 0.9 * fade).strokeRect(x - 5, y - 2, 10, 4);
        g.fillStyle(glow, (armed ? 0.9 : 0.4) * fade).fillTriangle(
          x,
          y - 3,
          x - 3,
          y + 1,
          x + 3,
          y + 1,
        );
      } else {
        const blink = armed ? 0.55 + 0.45 * Math.sin(time * 10 + d.id) : 0.3;
        g.fillStyle(0x2a2018, 0.9 * fade).fillEllipse(x, y, 10, 5);
        g.fillStyle(glow, blink * fade).fillCircle(x, y - 1, 2.2);
        g.lineStyle(1, base, 0.7 * fade).strokeEllipse(x, y, 10, 5);
      }
    }
  }

  /** Minions: a teal ring at their feet, their body, and what is left of their life. */
  private minions(g: Gfx, w: World, time: number): void {
    for (const m of w.minions) {
      if (!m.alive) continue;
      const { x, y } = this.host.project(m.x, m.y);
      const col = MINIONS[m.kind].color;
      g.fillStyle(0x000000, 0.35).fillEllipse(x, y + 1, 9, 4);
      g.lineStyle(1, UTILITY_COLOR.summon, 0.55 + 0.15 * Math.sin(time * 3 + m.id)).strokeEllipse(
        x,
        y + 1,
        12,
        5,
      );
      g.fillStyle(col, 0.95).fillCircle(x, y - 5, 4);
      g.lineStyle(1, 0xffffff, 0.6).strokeCircle(x, y - 5, 4);
      if (m.life < m.def.maxLife) {
        const frac = Math.max(0, m.life / m.def.maxLife);
        g.fillStyle(0x000000, 0.6).fillRect(x - 6, y - 13, 12, 2);
        g.fillStyle(0x6ad07a, 0.95).fillRect(x - 6, y - 13, 12 * frac, 2);
      }
    }
  }

  /** Auras are slow rings at the player's feet (heralds are spiked), and each buff running is a mote circling the body. */
  private upkeep(g: Gfx, w: World, time: number): void {
    const p = w.player;
    if (!p.alive) return;
    let i = 0;
    for (const a of w.char.auras) {
      if (!a.active || i >= 4) continue;
      const look = auraLook(a.def);
      const r = 1.0 + i * 0.28;
      const pulse = 0.5 + 0.2 * Math.sin(time * 2 + i);
      this.disc(g, p.x, p.y, r, look.color, 0.05 + 0.03 * pulse);
      this.ring(g, p.x, p.y, r, look.color, 0.55 + 0.25 * pulse, 1.5);
      if (look.delivery === 'herald') {
        const o = this.host.project(p.x, p.y);
        const rx = this.host.rpx(r);
        const sq = this.host.squash();
        g.fillStyle(look.color, 0.8);
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2 + time * 0.6;
          const x0 = o.x + Math.cos(ang) * rx;
          const y0 = o.y + Math.sin(ang) * rx * sq;
          g.fillTriangle(
            x0 + Math.cos(ang) * 4,
            y0 + Math.sin(ang) * 2,
            x0 - Math.sin(ang) * 1.5,
            y0 + Math.cos(ang) * 0.75,
            x0 + Math.sin(ang) * 1.5,
            y0 - Math.cos(ang) * 0.75,
          );
        }
      } else this.ticks(g, p.x, p.y, r, 10, time * 0.4 * (i % 2 ? -1 : 1), look.color, 0.85, 2);
      i++;
    }
    let n = 0;
    for (const id of BUFF_IDS) {
      const left = w.buffT[id];
      if (left <= 0 || n >= 6) continue;
      const util = w.char.utilities.find(
        (u) => u.skill.utility?.kind === 'buff' && u.skill.utility.buff === id,
      );
      let color = UTILITY_COLOR.buff;
      if (util) {
        const s = util.skill;
        const d = deliveryOf(s.behaviour, s.type, s.tags, s.utility);
        color = UTILITY_COLOR[d === 'warcry' || d === 'guard' ? d : 'buff'];
      }
      // A buff about to end blinks.
      const blink = left < 1.5 ? 0.4 + 0.6 * Math.abs(Math.sin(time * 8)) : 1;
      const o = this.host.project(p.x, p.y);
      const ang = time * 2 + (n / 6) * Math.PI * 2;
      const rx = this.host.rpx(0.65);
      g.fillStyle(color, 0.9 * blink).fillCircle(
        o.x + Math.cos(ang) * rx,
        o.y - 10 + Math.sin(ang) * rx * 0.5,
        1.6,
      );
      n++;
    }
  }

  /** A curse is a violet sigil turning over the head of each enemy that carries one. */
  private curseMarks(g: Gfx, w: World, time: number): void {
    for (const a of w.actors) {
      if (!a.alive || a.isPlayer || a.hexes.length === 0) continue;
      const o = this.host.project(a.x, a.y);
      for (let h = 0; h < a.hexes.length; h++) {
        const cy = o.y - 28 - h * 6;
        g.lineStyle(1, UTILITY_COLOR.curse, 0.85).strokeEllipse(o.x, cy, 10, 5);
        g.fillStyle(UTILITY_COLOR.curse, 0.9);
        for (let k = 0; k < 3; k++) {
          const ang = time * 3 + (k / 3) * Math.PI * 2 + h;
          g.fillRect(o.x + Math.cos(ang) * 5 - 1, cy + Math.sin(ang) * 2.5 - 1, 2, 2);
        }
      }
    }
  }
}
