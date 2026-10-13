import type Phaser from 'phaser';
import type { Projectile } from '../../../sim/types';

/**
 * How a skill's projectiles are drawn (docs/VISUAL_LANGUAGE.md, "Projectiles"). Every projectile is a body you can name at a
 * glance, in front of the floor and the particles: an attack flies as an arrow (a shaft with a head and fletching), a spell as an
 * orb (a coloured core in a dark rim, a white heart and a halo), and the odd flights have their own shape (a shield, a tornado, a
 * skull, a mirrored arrow). Each one rides a hand's height over the ground with a shadow where it really is, leaves a tapered
 * trail behind it (not a spray of particles), and a flight the description calls a lob (a mortar, a nova arrow) rises and falls.
 * Physics are the sim's: only the picture lifts.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

export type ProjectileHost = {
  project(x: number, y: number): Pt;
  rpx(r: number): number;
  squash(): number;
};

/** What the renderer keeps for each projectile in the air. */
export type ProjectileState = {
  /** Where it has been (world tiles), newest last. */
  trail: { x: number; y: number; z: number }[];
  /** A phase for the flicker and the spin, so neighbours do not move together. */
  phase: number;
};

/** Pixels a flight rides over the ground (a hand's height). */
export const FLIGHT_HEIGHT = 9;

export function newProjectileState(p: Projectile): ProjectileState {
  return { trail: [], phase: (p.id * 2.399963) % (Math.PI * 2) };
}

/** What kind of body a projectile has. */
export type Body = 'arrow' | 'orb' | 'bigOrb' | 'shield' | 'tornado' | 'skull' | 'mirror';

export function bodyOf(p: Projectile): Body {
  switch (p.kind) {
    case 'shield':
      return 'shield';
    case 'tornado':
      return 'tornado';
    case 'creep':
      return 'skull';
    case 'mirror':
      return 'mirror';
    case 'orb':
      return 'bigOrb';
    default:
      break;
  }
  if (p.profile.skill.type === 'attack') return 'arrow';
  return 'orb';
}

/** Whether the flight is a lob that goes up and comes down (the arrow of a nova, a mortar shell). */
export function isLob(p: Projectile): boolean {
  return p.kind === 'mortar' || p.kind === 'nova';
}

/** The height of a lob at `u` (0 to 1 of its way), in pixels over the usual flight height. */
export function lobHeight(p: Projectile): number {
  const u = Math.max(0, Math.min(1, p.travelled / Math.max(0.5, p.maxRange)));
  const peak = Math.max(10, Math.min(30, p.maxRange * 4));
  return 4 * u * (1 - u) * peak;
}

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** How long a trail is (tiles of flight) by body. */
const TRAIL_TILES: Record<Body, number> = {
  arrow: 1.5,
  orb: 1.1,
  bigOrb: 1.4,
  shield: 0.7,
  tornado: 0.9,
  skull: 1.0,
  mirror: 1.2,
};

export class ProjectileFx {
  private body: Gfx;
  private glow: Gfx;
  private stamp = -1;
  /** Whether the projectile being drawn is a monster's. */
  private hostile = false;
  private dirty = false;

  private host: ProjectileHost;

  constructor(host: ProjectileHost, scene: Phaser.Scene) {
    this.host = host;
    this.body = scene.add.graphics().setDepth(80000);
    this.glow = scene.add.graphics().setDepth(79999).setBlendMode(1);
  }

  /** The graphics objects, for the style to own (and destroy with the map). */
  objects(): Gfx[] {
    return [this.body, this.glow];
  }

  /** Called every frame after the projectiles: clear what a frame with none left behind. */
  settle(count: number): void {
    if (count === 0 && this.dirty) {
      this.body.clear();
      this.glow.clear();
      this.dirty = false;
    }
  }

  /** The first call of a frame clears what the last one drew. */
  begin(time: number): void {
    if (this.stamp === time) return;
    this.stamp = time;
    this.body.clear();
    this.glow.clear();
    this.dirty = true;
  }

  /** Where a point of the flight is on screen: the ground point, raised by `z` pixels. */
  private at(x: number, y: number, z: number): Pt {
    const q = this.host.project(x, y);
    return { x: q.x, y: q.y - z };
  }

  /** A shadow on the ground under the flight, and a faint pool of its colour, so the true line of flight reads. */
  shadow(x: number, y: number, lift: number, color: number): void {
    const q = this.host.project(x, y);
    const s = Math.max(0.5, 1 - lift / 60);
    this.body.fillStyle(0x000000, 0.32 * s).fillEllipse(q.x, q.y + 1, 7 * s, 3 * s);
    this.glow.fillStyle(color, 0.22 * s).fillEllipse(q.x, q.y + 1, 11 * s, 4.5 * s);
  }

  /** Draw one projectile (and keep its trail). */
  draw(p: Projectile, st: ProjectileState, color: number, time: number): void {
    this.begin(time);
    const body = bodyOf(p);
    const lift = FLIGHT_HEIGHT + (isLob(p) ? lobHeight(p) : 0);
    // The trail is the last stretch of the flight, in world tiles.
    st.trail.push({ x: p.x, y: p.y, z: lift });
    const maxLen = TRAIL_TILES[body];
    let len = 0;
    for (let i = st.trail.length - 1; i > 0; i--) {
      len += Math.hypot(st.trail[i].x - st.trail[i - 1].x, st.trail[i].y - st.trail[i - 1].y);
      if (len > maxLen) {
        st.trail.splice(0, i - 1);
        break;
      }
    }
    this.shadow(p.x, p.y, lift - FLIGHT_HEIGHT, color);
    const head = this.at(p.x, p.y, lift);
    // The way it points on screen: toward where it is going.
    const ahead = this.at(p.x + p.vx * 0.04, p.y + p.vy * 0.04, lift);
    let dx = ahead.x - head.x;
    let dy = ahead.y - head.y;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    this.ribbon(st, color, body);
    // What a monster sends at the character wears a red rim, so a threat is told from the character's own at a glance.
    this.hostile = p.faction === 1;
    const light = lighten(color, 0.45);
    switch (body) {
      case 'arrow':
        this.arrow(head, dx, dy, color, p.dtype === 0, 1);
        break;
      case 'mirror':
        this.arrow({ x: head.x - dy * 2.5, y: head.y + dx * 2.5 }, dx, dy, 0xa8d8ff, false, 0.55);
        this.arrow({ x: head.x + dy * 2.5, y: head.y - dx * 2.5 }, dx, dy, 0xa8d8ff, false, 0.55);
        break;
      case 'orb':
        this.orb(head, p.explodeRadius > 0 ? 4.6 : 3.6, color, light, st.phase, time);
        break;
      case 'bigOrb':
        this.orb(head, 6.5, color, light, st.phase, time);
        this.sparks(head, 9, color, time + st.phase);
        break;
      case 'skull':
        this.orb(head, 4.6, 0xcfeaff, 0xffffff, st.phase, time);
        this.body.fillStyle(0x101820, 0.9);
        this.body.fillRect(head.x - 2, head.y - 1, 1.5, 1.5);
        this.body.fillRect(head.x + 0.5, head.y - 1, 1.5, 1.5);
        break;
      case 'shield':
        this.shieldBody(head, color, light, time + st.phase);
        break;
      case 'tornado':
        this.orb(head, 3.2, color, light, st.phase, time);
        this.spin(head, 7, color, time * 9 + st.phase);
        break;
    }
  }

  /** The tapered trail: wide and faint at the head's heels, thin and bright at the tail's end fading out. */
  private ribbon(st: ProjectileState, color: number, body: Body): void {
    const n = st.trail.length;
    if (n < 2) return;
    const pts = st.trail.map((t) => this.at(t.x, t.y, t.z));
    const widest = body === 'arrow' ? 3.2 : body === 'bigOrb' ? 8 : 5;
    for (let i = 1; i < n; i++) {
      const f = i / (n - 1);
      const w = widest * f;
      const a = 0.55 * f;
      this.glow.lineStyle(w, color, a).lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      this.glow
        .lineStyle(Math.max(0.8, w * 0.35), 0xffffff, a * 0.8)
        .lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
  }

  /** A shaft, a head and fletching, in a dark rim so it holds against any floor. */
  private arrow(h: Pt, dx: number, dy: number, color: number, phys: boolean, alpha: number): void {
    const len = 11;
    const t = { x: h.x - dx * len, y: h.y - dy * len };
    const g = this.body;
    const shaft = phys ? 0xf0e6cc : lighten(color, 0.35);
    g.lineStyle(3.4, this.hostile ? 0x7a1010 : 0x000000, 0.85 * alpha).lineBetween(
      t.x,
      t.y,
      h.x,
      h.y,
    );
    g.lineStyle(1.8, phys ? 0xb8a888 : color, alpha).lineBetween(t.x, t.y, h.x, h.y);
    g.lineStyle(0.9, shaft, alpha).lineBetween(t.x, t.y, h.x, h.y);
    // The head: a bright wedge at the front.
    const px = -dy;
    const py = dx;
    g.fillStyle(this.hostile ? 0xff4a3a : 0x000000, 0.9 * alpha).fillTriangle(
      h.x + dx * 4.6,
      h.y + dy * 4.6,
      h.x - dx * 1 + px * 2.6,
      h.y - dy * 1 + py * 2.6,
      h.x - dx * 1 - px * 2.6,
      h.y - dy * 1 - py * 2.6,
    );
    g.fillStyle(0xffffff, alpha).fillTriangle(
      h.x + dx * 3.6,
      h.y + dy * 3.6,
      h.x - dx * 0.6 + px * 1.6,
      h.y - dy * 0.6 + py * 1.6,
      h.x - dx * 0.6 - px * 1.6,
      h.y - dy * 0.6 - py * 1.6,
    );
    // The fletching: two short feathers at the tail.
    g.lineStyle(1, shaft, 0.9 * alpha)
      .lineBetween(t.x, t.y, t.x + dx * 2.5 + px * 2, t.y + dy * 2.5 + py * 2)
      .lineBetween(t.x, t.y, t.x + dx * 2.5 - px * 2, t.y + dy * 2.5 - py * 2);
    this.glow.fillStyle(color, 0.3 * alpha).fillCircle(h.x, h.y, 4);
  }

  /** A coloured core in a dark rim with a white heart and a breathing halo. */
  private orb(h: Pt, r: number, color: number, light: number, phase: number, time: number): void {
    const breathe = 1 + 0.12 * Math.sin(time * 14 + phase);
    this.glow.fillStyle(color, 0.28).fillCircle(h.x, h.y, r * 2.4 * breathe);
    this.glow.lineStyle(1, light, 0.55).strokeCircle(h.x, h.y, r * 1.7 * breathe);
    if (this.hostile) this.body.lineStyle(1.2, 0xff4a3a, 0.9).strokeCircle(h.x, h.y, r + 2.2);
    this.body.fillStyle(this.hostile ? 0x3a0808 : 0x000000, 0.9).fillCircle(h.x, h.y, r + 1.4);
    this.body.fillStyle(color, 1).fillCircle(h.x, h.y, r);
    this.body.fillStyle(light, 1).fillCircle(h.x - r * 0.15, h.y - r * 0.15, r * 0.65);
    this.body.fillStyle(0xffffff, 1).fillCircle(h.x - r * 0.2, h.y - r * 0.2, r * 0.3);
  }

  /** Short arcs that jump off a large orb. */
  private sparks(h: Pt, r: number, color: number, t: number): void {
    this.glow.lineStyle(1, lighten(color, 0.6), 0.8);
    for (let i = 0; i < 4; i++) {
      const a = t * 5 + (i * Math.PI) / 2 + Math.sin(t * 17 + i) * 0.5;
      this.glow.lineBetween(
        h.x + Math.cos(a) * r,
        h.y + Math.sin(a) * r * 0.7,
        h.x + Math.cos(a + 0.35) * (r + 4),
        h.y + Math.sin(a + 0.35) * (r + 4) * 0.7,
      );
    }
  }

  /** Three curved blades that turn about a point (a tornado). */
  private spin(h: Pt, r: number, color: number, a0: number): void {
    this.body.lineStyle(2, 0x000000, 0.7);
    this.glow.lineStyle(1.2, lighten(color, 0.5), 0.9);
    for (let i = 0; i < 3; i++) {
      const a = a0 + (i * Math.PI * 2) / 3;
      const x0 = h.x + Math.cos(a) * 2;
      const y0 = h.y + Math.sin(a) * 1;
      const x1 = h.x + Math.cos(a + 0.8) * r;
      const y1 = h.y + Math.sin(a + 0.8) * r * 0.6;
      this.body.lineBetween(x0, y0, x1, y1);
      this.glow.lineBetween(x0, y0, x1, y1);
    }
  }

  /** A hexagonal shield, turning edge on to face on as it flies. */
  private shieldBody(h: Pt, color: number, light: number, t: number): void {
    const w = 5.5 * Math.abs(Math.cos(t * 4)) + 1.5;
    const pts: Pt[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push({ x: h.x + Math.cos(a) * w, y: h.y + Math.sin(a) * 5.5 });
    }
    this.body.fillStyle(0x000000, 0.85).fillCircle(h.x, h.y, 6.8);
    this.body.fillStyle(color, 1).fillPoints(pts as Phaser.Math.Vector2[], true);
    this.body.lineStyle(1.2, light, 1).strokePoints(pts as Phaser.Math.Vector2[], true, true);
    this.glow.fillStyle(color, 0.3).fillCircle(h.x, h.y, 11);
  }
}
