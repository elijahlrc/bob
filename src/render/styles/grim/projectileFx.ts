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
  /** An attack shot from a wand: a bolt, not an arrow. */
  bolt: boolean;
  /** The kind of weapon the thrower holds, for a body that is a copy of it. */
  weapon: WeaponShape;
};

/** The outline a thrown copy of a weapon has. */
export type WeaponShape = 'blade' | 'axe' | 'mace';

/** The shape of a held weapon class, for a thrown copy of it. */
export function weaponShapeOf(itemClass: string | null): WeaponShape {
  if (itemClass === 'axe' || itemClass === 'axe2') return 'axe';
  if (
    itemClass === 'mace' ||
    itemClass === 'mace2' ||
    itemClass === 'sceptre' ||
    itemClass === 'staff'
  )
    return 'mace';
  return 'blade';
}

/** Pixels a flight rides over the ground (a hand's height). */
export const FLIGHT_HEIGHT = 9;

export function newProjectileState(
  p: Projectile,
  bolt = false,
  weapon: WeaponShape = 'blade',
): ProjectileState {
  return { trail: [], phase: (p.id * 2.399963) % (Math.PI * 2), bolt, weapon };
}

/** What kind of body a projectile has. */
export type Body =
  | 'arrow'
  | 'orb'
  | 'bigOrb'
  | 'shield'
  | 'tornado'
  | 'skull'
  | 'mirror'
  | 'crystal'
  | 'sliver'
  | 'knife'
  | 'saw'
  | 'spiritSaw'
  | 'weapon'
  | 'ghostWeapon'
  | 'shard'
  | 'spear'
  | 'icicle'
  | 'spark'
  | 'bolt'
  | 'dart'
  | 'twister';

/**
 * Skills whose description names what flies (knives, a saw, a copy of the weapon, shards, spears, icicles, sparks, bolts, a twister),
 * drawn as that thing. A blade or a thrown weapon spins as it flies; a shard tumbles. A function picks by the projectile (the main
 * blade of a fan and the shards beside it; the shield and the shards it breaks into).
 */
const SKILL_BODY: Readonly<Record<string, Body | ((p: Projectile) => Body)>> = {
  ghostBlades: 'knife',
  spiritSaw: 'spiritSaw',
  toxinCircle: 'saw',
  phantomToss: 'ghostWeapon',
  hurledSteel: (p) => (p.lead ? 'weapon' : 'shard'),
  splinterVolley: 'shard',
  ghostShard: (p) => (p.kind === 'shield' ? 'shield' : 'shard'),
  frostLance: 'spear',
  icicleCharge: 'icicle',
  skitterFlash: 'spark',
  boltCleave: 'bolt',
  mindDrain: 'dart',
  galeTwister: 'twister',
};

export function bodyOf(p: Projectile, bolt = false): Body {
  const own = SKILL_BODY[p.profile.skill.id];
  if (own) return typeof own === 'function' ? own(p) : own;
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
  // A skill that names its own shape (a heavy crystal, a thin sliver) is drawn as that.
  const b = p.profile.skill.behaviour;
  if (b.kind === 'projectile' && b.shape) return b.shape;
  // The lumps a strike throws (an attack, but not a shaft) fly as orbs.
  if (p.profile.skill.afterHit?.kind === 'balls') return 'orb';
  if (p.profile.skill.type === 'attack' && !bolt) return 'arrow';
  return 'orb';
}

/** Whether the flight is a lob that goes up and comes down (the arrow of a nova, a mortar shell). */
export function isLob(p: Projectile): boolean {
  return p.kind === 'mortar' || p.kind === 'nova';
}

/**
 * How much of a fading projectile is left (1 up close, a little at the end of its range): a skill whose damage falls with
 * distance is drawn fainter as it flies, by the same distance. Others stay whole.
 */
export function fadeOf(p: Projectile): number {
  const b = p.profile.skill.behaviour;
  if (b.kind !== 'projectile' || b.falloff === undefined) return 1;
  const u = Math.max(0, Math.min(1, p.travelled / Math.max(0.5, p.maxRange)));
  return 1 - 0.85 * u;
}

/** The height of a lob at `u` (0 to 1 of its way), in pixels over the usual flight height. */
export function lobHeight(p: Projectile): number {
  const u = Math.max(0, Math.min(1, p.travelled / Math.max(0.5, p.maxRange)));
  const peak = Math.max(10, Math.min(30, p.maxRange * 4));
  return 4 * u * (1 - u) * peak;
}

const darken = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v * (1 - f));
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** A point of a shape turned by `a` about `h`: `along` the turned axis and `side` across it. */
const rotor =
  (h: Pt, a: number) =>
  (along: number, side: number): Pt => ({
    x: h.x + Math.cos(a) * along - Math.sin(a) * side,
    y: h.y + Math.sin(a) * along + Math.cos(a) * side,
  });

/** A fixed pseudo-random number from 0 to 1 (a flicker that is the same in a replay). */
const noise = (seed: number, i: number): number => {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
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
  crystal: 0.8,
  sliver: 1.7,
  knife: 1.0,
  saw: 1.0,
  spiritSaw: 1.0,
  weapon: 1.1,
  ghostWeapon: 1.1,
  shard: 0.9,
  spear: 1.6,
  icicle: 1.3,
  spark: 0.6,
  bolt: 1.2,
  dart: 1.4,
  twister: 0,
};

/** How wide a trail is at the head's heels, by body (5 when not named). */
const RIBBON_WIDTH: Partial<Record<Body, number>> = {
  arrow: 3.2,
  bigOrb: 8,
  crystal: 7,
  sliver: 2.4,
  knife: 3.5,
  saw: 4,
  spiritSaw: 4,
  weapon: 4,
  ghostWeapon: 4,
  shard: 2.4,
  spear: 3,
  icicle: 2.4,
  spark: 1.6,
  bolt: 2,
  dart: 3.4,
};

export class ProjectileFx {
  private body: Gfx;
  private glow: Gfx;
  private stamp = -1;
  /** Whether the projectile being drawn is a monster's. */
  private hostile = false;
  private dirty = false;
  /** How whole the projectile being drawn is (1 whole, less as it fades). */
  private fade = 1;

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
    this.body.fillStyle(0x000000, 0.32 * s * this.fade).fillEllipse(q.x, q.y + 1, 7 * s, 3 * s);
    this.glow.fillStyle(color, 0.22 * s * this.fade).fillEllipse(q.x, q.y + 1, 11 * s, 4.5 * s);
  }

  /** Draw one projectile (and keep its trail). */
  draw(p: Projectile, st: ProjectileState, color: number, time: number): void {
    this.begin(time);
    const body = bodyOf(p, st.bolt);
    this.fade = fadeOf(p);
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
    this.hostile = p.team === 1;
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
        this.skull(head, color, time + st.phase);
        break;
      case 'shield':
        this.shieldBody(head, color, light, time + st.phase);
        break;
      case 'tornado':
        this.orb(head, 3.2, color, light, st.phase, time);
        this.spin(head, 7, color, time * 9 + st.phase);
        break;
      case 'crystal':
        this.crystal(head, color, light, st.phase, time);
        break;
      case 'sliver':
        this.sliver(head, dx, dy, color, light);
        break;
      case 'knife':
        this.knife(head, time * 20 + st.phase, color, light);
        break;
      case 'saw':
        this.saw(head, time * 16 + st.phase, color, light);
        break;
      case 'spiritSaw':
        // A spirit's blade: pale and see-through, its element only in the glow at its rim, with more and finer teeth.
        this.saw(head, time * 16 + st.phase, color, light, true);
        break;
      case 'weapon':
      case 'ghostWeapon':
        this.weapon(head, time * 14 + st.phase, st.weapon, color, body === 'ghostWeapon');
        break;
      case 'shard':
        this.shard(head, time * 7 + st.phase, st.phase, color, light);
        break;
      case 'spear':
        this.spear(head, dx, dy, color, light, p.formed ? 1.25 : 1);
        break;
      case 'icicle':
        this.spear(head, dx, dy, color, light, 0.9);
        break;
      case 'spark':
        this.spark(head, color, Math.floor(time * 30) + p.id * 7);
        break;
      case 'bolt':
        this.bolt(head, dx, dy, color, Math.floor(time * 30) + p.id * 7);
        break;
      case 'dart':
        this.dart(head, dx, dy, color, light);
        break;
      case 'twister':
        this.twister(this.at(p.x, p.y, 0), color, time + st.phase);
        break;
    }
    this.fade = 1;
  }

  /** A frozen skull: a pale cranium in a dark rim, hollow eyes lit from inside, a jaw of teeth, and a halo of frost. */
  private skull(h: Pt, color: number, t: number): void {
    const g = this.body;
    const bone = 0xe6f4ff;
    const bob = Math.sin(t * 6) * 0.6;
    const c = { x: h.x, y: h.y + bob };
    this.glow.fillStyle(color, 0.32).fillCircle(c.x, c.y, 12);
    g.fillStyle(this.hostile ? 0x3a0808 : 0x000000, 0.9).fillCircle(c.x, c.y - 0.5, 6.8);
    g.fillRoundedRect(c.x - 4.3, c.y + 1.5, 8.6, 5.6, 1.5);
    g.fillStyle(bone, 1).fillCircle(c.x, c.y - 0.5, 5.6);
    g.fillRoundedRect(c.x - 3.3, c.y + 2, 6.6, 4, 1.2);
    g.fillStyle(0xffffff, 0.9).fillCircle(c.x - 1.8, c.y - 3, 1.6);
    // Hollow eyes with a cold light in them, a nose, and the teeth.
    g.fillStyle(0x0c1620, 1).fillEllipse(c.x - 2.2, c.y + 0.4, 2.8, 3);
    g.fillEllipse(c.x + 2.2, c.y + 0.4, 2.8, 3);
    g.fillStyle(lighten(color, 0.3), 1).fillCircle(c.x - 2.2, c.y + 0.6, 0.8);
    g.fillCircle(c.x + 2.2, c.y + 0.6, 0.8);
    g.fillStyle(0x0c1620, 1).fillTriangle(c.x, c.y + 1.8, c.x - 0.8, c.y + 3, c.x + 0.8, c.y + 3);
    g.lineStyle(0.8, 0x0c1620, 0.9);
    for (const x of [-1.6, 0, 1.6]) g.lineBetween(c.x + x, c.y + 4, c.x + x, c.y + 6);
  }

  /** A rim, a body and a lit edge for a flat shape in the screen's plane. */
  private plate(pts: Pt[], fill: number, alpha: number, edge: number): void {
    const g = this.body;
    // A thin dark outline (not a grown silhouette: on a thin blade that swallows the body).
    g.lineStyle(2.4, this.hostile ? 0x3a0808 : 0x000000, 0.7 * this.fade).strokePoints(
      pts as Phaser.Math.Vector2[],
      true,
      true,
    );
    g.fillStyle(fill, alpha * this.fade).fillPoints(pts as Phaser.Math.Vector2[], true);
    g.lineStyle(1, edge, 0.9 * this.fade).strokePoints(pts as Phaser.Math.Vector2[], true, true);
  }

  /** A spectral knife turning end over end: blade, guard and grip. */
  private knife(h: Pt, a: number, color: number, light: number): void {
    const R = rotor(h, a);
    this.glow.fillStyle(color, 0.3).fillCircle(h.x, h.y, 8);
    const g = this.body;
    const [gA, gB, gr, pm] = [R(-1.5, -3.6), R(-1.5, 3.6), R(-6, 0), R(-6.6, 0)];
    const base = R(-1.5, 0);
    g.lineStyle(2.2, 0x000000, 0.55).lineBetween(base.x, base.y, gr.x, gr.y);
    g.lineStyle(1.3, darken(color, 0.35), 1).lineBetween(base.x, base.y, gr.x, gr.y);
    g.fillStyle(darken(color, 0.35), 1).fillCircle(pm.x, pm.y, 1.2);
    this.plate([R(9, 0), R(0, 2.3), R(-1.5, 2.3), R(-1.5, -2), R(0, -2)], light, 0.92, 0xffffff);
    g.lineStyle(2.4, 0x000000, 0.55).lineBetween(gA.x, gA.y, gB.x, gB.y);
    g.lineStyle(1.4, color, 1).lineBetween(gA.x, gA.y, gB.x, gB.y);
  }

  /** A flat toothed disc, seen from above at the camera's tilt, its teeth running round as it spins. */
  private saw(h: Pt, a: number, color: number, light: number, spirit = false): void {
    const g = this.body;
    const sq = 0.6;
    const R = spirit ? 6.2 : 5.6;
    const teeth = spirit ? 14 : 10;
    const tooth = spirit ? 0xf2fbff : light;
    const face = spirit ? 0xcfe6f2 : color;
    const faceAlpha = spirit ? 0.7 : 1;
    this.glow.fillStyle(color, 0.3).fillEllipse(h.x, h.y, R * 4, R * 4 * sq);
    g.fillStyle(this.hostile ? 0x3a0808 : 0x000000, 0.85).fillEllipse(
      h.x,
      h.y,
      R * 2.9,
      R * 2.9 * sq,
    );
    for (let i = 0; i < teeth; i++) {
      const t = a + (i / teeth) * Math.PI * 2;
      const at = (ang: number, r: number): Pt => ({
        x: h.x + Math.cos(ang) * r,
        y: h.y + Math.sin(ang) * r * sq,
      });
      const p0 = at(t - 0.2, R);
      const p1 = at(t + 0.12, R + 2.4);
      const p2 = at(t + 0.2, R);
      g.fillStyle(tooth, 1).fillTriangle(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y);
    }
    g.fillStyle(face, faceAlpha).fillEllipse(h.x, h.y, R * 2, R * 2 * sq);
    if (spirit) g.lineStyle(1.4, light, 1).strokeEllipse(h.x, h.y, R * 2, R * 2 * sq);
    g.lineStyle(1, darken(spirit ? face : color, 0.4), 1).strokeEllipse(
      h.x,
      h.y,
      R * 1.2,
      R * 1.2 * sq,
    );
    // Spokes that turn with the disc, so the spin reads even when the teeth blur.
    for (let i = 0; i < 3; i++) {
      const t = a + (i / 3) * Math.PI * 2;
      g.lineStyle(1, 0xffffff, 0.8).lineBetween(
        h.x + Math.cos(t) * 1.4,
        h.y + Math.sin(t) * 1.4 * sq,
        h.x + Math.cos(t) * R * 0.85,
        h.y + Math.sin(t) * R * 0.85 * sq,
      );
    }
    g.fillStyle(0xffffff, 1).fillEllipse(h.x, h.y, 2.4, 2.4 * sq);
  }

  /** A copy of the thrower's weapon (a blade, an axe or a mace) turning end over end; a phantom one is see-through and glows. */
  private weapon(h: Pt, a: number, shape: WeaponShape, color: number, ghost: boolean): void {
    const turn = rotor(h, a);
    // A weapon is bigger than an arrow: drawn a third larger than its outline's numbers.
    const R = (along: number, side: number): Pt => turn(along * 1.3, side * 1.3);
    const g = this.body;
    const steel = ghost ? lighten(color, 0.35) : 0xd8dce4;
    const alpha = ghost ? 0.75 : 1;
    const wood = ghost ? lighten(color, 0.1) : 0x7a5a3a;
    this.glow.fillStyle(color, ghost ? 0.22 : 0.14).fillCircle(h.x, h.y, 9);
    const haft = (from: Pt, to: Pt, w: number, c: number): void => {
      g.lineStyle(w + 1.6, 0x000000, 0.8).lineBetween(from.x, from.y, to.x, to.y);
      g.lineStyle(w, c, alpha).lineBetween(from.x, from.y, to.x, to.y);
    };
    if (shape === 'blade') {
      this.plate([R(9.5, 0), R(-1.5, 2), R(-1.5, -2)], steel, alpha, 0xffffff);
      haft(R(-1.5, -3.8), R(-1.5, 3.8), 1.4, ghost ? steel : 0xb08a3a);
      haft(R(-1.5, 0), R(-6, 0), 1.4, wood);
      g.fillStyle(ghost ? steel : 0xb08a3a, alpha).fillCircle(R(-6.6, 0).x, R(-6.6, 0).y, 1.3);
    } else if (shape === 'axe') {
      haft(R(-8, 0), R(6, 0), 1.5, wood);
      this.plate(
        [R(3, 0), R(5, -1.4), R(8.5, -5.5), R(9.5, 1.5), R(5, 1.4)],
        steel,
        alpha,
        0xffffff,
      );
    } else {
      haft(R(-8, 0), R(4, 0), 1.5, wood);
      const c = R(6, 0);
      g.fillStyle(0x000000, 0.85).fillCircle(c.x, c.y, 4);
      g.fillStyle(steel, alpha).fillCircle(c.x, c.y, 2.9);
      for (let i = 0; i < 4; i++) {
        const t = a + (i * Math.PI) / 2 + Math.PI / 4;
        g.fillStyle(steel, alpha).fillCircle(c.x + Math.cos(t) * 3, c.y + Math.sin(t) * 3, 1.1);
      }
    }
  }

  /** A jagged sliver of steel, tumbling. */
  private shard(h: Pt, a: number, seed: number, color: number, light: number): void {
    const R = rotor(h, a);
    const radii = [5.4, 1.8, 3.6, 1.4, 2.8];
    const pts = radii.map((r, i) => {
      const t = (i / radii.length) * Math.PI * 2 + Math.sin(seed * 3 + i) * 0.35;
      return R(Math.cos(t) * r, Math.sin(t) * r);
    });
    this.glow.fillStyle(color, 0.25).fillCircle(h.x, h.y, 5);
    this.plate(pts, light, 1, 0xffffff);
  }

  /** A spear (Frost Lance) or an icicle: a long shaft of ice with a pointed head, along the flight. */
  private spear(h: Pt, dx: number, dy: number, color: number, light: number, scale: number): void {
    const s = scale;
    const px = -dy;
    const py = dx;
    const P = (along: number, side: number): Pt => ({
      x: h.x + dx * along * s + px * side * s,
      y: h.y + dy * along * s + py * side * s,
    });
    const g = this.body;
    this.glow.fillStyle(color, 0.3).fillCircle(h.x, h.y, 6 * s);
    if (s >= 1) {
      // A lance: a thin shaft behind a diamond head.
      const tail = P(-15, 0);
      const neck = P(2, 0);
      g.lineStyle(3.4 * s, this.hostile ? 0x3a0808 : 0x000000, 0.85).lineBetween(
        tail.x,
        tail.y,
        neck.x,
        neck.y,
      );
      g.lineStyle(1.6 * s, color, 1).lineBetween(tail.x, tail.y, neck.x, neck.y);
      g.lineStyle(0.7, 0xffffff, 0.8).lineBetween(tail.x, tail.y, neck.x, neck.y);
      this.plate([P(11, 0), P(5, 2.6), P(1.5, 0), P(5, -2.6)], light, 1, 0xffffff);
      return;
    }
    // An icicle: a cone, broad at the back and sharp at the front.
    this.plate([P(9, 0), P(-6, 2.6), P(-7, 0), P(-6, -2.6)], color, 1, light);
    g.fillStyle(light, 1).fillTriangle(
      P(9, 0).x,
      P(9, 0).y,
      P(-6, 2.6).x,
      P(-6, 2.6).y,
      P(-6, 0).x,
      P(-6, 0).y,
    );
    g.fillStyle(0xffffff, 1).fillCircle(P(6, 0).x, P(6, 0).y, 0.9);
  }

  /** A spark: a hot point and a few jagged rays that change every frame. */
  private spark(h: Pt, color: number, seed: number): void {
    const g = this.glow;
    g.fillStyle(color, 0.4).fillCircle(h.x, h.y, 7);
    for (let i = 0; i < 5; i++) {
      const t = noise(seed, i) * Math.PI * 2;
      const len = 6 + 6 * noise(seed, i + 10);
      const mid = {
        x: h.x + Math.cos(t + 0.5) * len * 0.5,
        y: h.y + Math.sin(t + 0.5) * len * 0.5,
      };
      const end = { x: h.x + Math.cos(t) * len, y: h.y + Math.sin(t) * len };
      g.lineStyle(2.2, color, 0.7)
        .lineBetween(h.x, h.y, mid.x, mid.y)
        .lineBetween(mid.x, mid.y, end.x, end.y);
      g.lineStyle(1, 0xffffff, 0.95)
        .lineBetween(h.x, h.y, mid.x, mid.y)
        .lineBetween(mid.x, mid.y, end.x, end.y);
    }
    this.body.fillStyle(0xffffff, 1).fillCircle(h.x, h.y, 2.2);
  }

  /** A short bolt of lightning along the flight: a zigzag that flickers. */
  private bolt(h: Pt, dx: number, dy: number, color: number, seed: number): void {
    const px = -dy;
    const py = dx;
    const pts: Pt[] = [];
    for (let i = 0; i <= 5; i++) {
      const along = 4 - i * 3.2;
      const side = i === 0 ? 0 : (i % 2 ? 1 : -1) * (1.5 + 2 * noise(seed, i));
      pts.push({ x: h.x + dx * along + px * side, y: h.y + dy * along + py * side });
    }
    const line = (w: number, c: number, a: number, gfx: Gfx): void => {
      gfx.lineStyle(w, c, a).beginPath().moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) gfx.lineTo(pts[i].x, pts[i].y);
      gfx.strokePath();
    };
    line(3.6, 0x000000, 0.6, this.body);
    line(4.5, color, 0.35, this.glow);
    line(2, lighten(color, 0.3), 1, this.body);
    line(0.9, 0xffffff, 1, this.body);
    this.glow.fillStyle(color, 0.35).fillCircle(h.x, h.y, 5);
  }

  /** A bolt of force from a wand: a bright head with a tapering tail. */
  private dart(h: Pt, dx: number, dy: number, color: number, light: number): void {
    const tail = { x: h.x - dx * 12, y: h.y - dy * 12 };
    const mid = { x: h.x - dx * 5, y: h.y - dy * 5 };
    const g = this.body;
    // A streak of force: a dark line under it so it holds on a lit floor, then the colour, then a white core.
    g.lineStyle(4.4, 0x000000, 0.45).lineBetween(mid.x, mid.y, h.x, h.y);
    this.glow.lineStyle(5, color, 0.35).lineBetween(tail.x, tail.y, h.x, h.y);
    g.lineStyle(2.6, light, 1).lineBetween(mid.x, mid.y, h.x, h.y);
    g.lineStyle(1.4, light, 0.8).lineBetween(tail.x, tail.y, mid.x, mid.y);
    g.lineStyle(1, 0xffffff, 1).lineBetween(mid.x, mid.y, h.x, h.y);
    g.fillStyle(0xffffff, 1).fillCircle(h.x, h.y, 1.8);
    this.glow.fillStyle(color, 0.3).fillCircle(h.x, h.y, 6);
  }

  /** A twister standing on the ground: a funnel of turning rings, narrow at the foot, wide at the top, swaying. */
  private twister(foot: Pt, color: number, t: number): void {
    const g = this.body;
    const wind = lighten(color, 0.3);
    this.glow.fillStyle(color, 0.22).fillEllipse(foot.x, foot.y, 16, 6);
    const rings = 7;
    for (let i = 0; i < rings; i++) {
      const f = i / (rings - 1);
      const sway = Math.sin(t * 5 + f * 2.4) * 2.5 * f;
      const cx = foot.x + sway;
      const cy = foot.y - 2 - f * 26;
      const rx = 2.4 + f * 9;
      const ry = rx * 0.32;
      g.lineStyle(2.6, 0x000000, 0.45).strokeEllipse(cx, cy, rx * 2, ry * 2);
      g.lineStyle(1.3, wind, 0.85).strokeEllipse(cx, cy, rx * 2, ry * 2);
      // A streak running round each ring, the faster the lower.
      const a = t * (16 - f * 6) + i * 1.3;
      const s0 = { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
      const s1 = { x: cx + Math.cos(a + 0.9) * rx, y: cy + Math.sin(a + 0.9) * ry };
      g.lineStyle(1.6, 0xffffff, 0.9).lineBetween(s0.x, s0.y, s1.x, s1.y);
    }
    g.fillStyle(wind, 0.18).fillTriangle(
      foot.x,
      foot.y - 2,
      foot.x - 11,
      foot.y - 28,
      foot.x + 11,
      foot.y - 28,
    );
  }

  /** The tapered trail: wide and faint at the head's heels, thin and bright at the tail's end fading out. */
  private ribbon(st: ProjectileState, color: number, body: Body): void {
    const n = st.trail.length;
    if (n < 2 || body === 'twister') return;
    const pts = st.trail.map((t) => this.at(t.x, t.y, t.z));
    const widest = RIBBON_WIDTH[body] ?? 5;
    for (let i = 1; i < n; i++) {
      const f = i / (n - 1);
      const w = widest * f;
      const a = 0.55 * f * this.fade;
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

  /** A heavy faceted crystal that turns slowly as it drifts, with frost shards circling it. */
  private crystal(h: Pt, color: number, light: number, phase: number, time: number): void {
    const R = 7.5;
    const turn = time * 1.1 + phase;
    const pts: Pt[] = [];
    for (let i = 0; i < 6; i++) {
      const a = turn + (i / 6) * Math.PI * 2;
      const r = i % 2 === 0 ? R : R * 0.74;
      pts.push({ x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r * 0.85 });
    }
    this.glow.fillStyle(color, 0.3).fillCircle(h.x, h.y, R * 2.2);
    this.glow.lineStyle(1, light, 0.5).strokeCircle(h.x, h.y, R * 1.6);
    const g = this.body;
    // The dark rim first, a little larger than the body.
    g.fillStyle(this.hostile ? 0x3a0808 : 0x000000, 0.9).fillPoints(
      pts.map((p) => ({
        x: h.x + (p.x - h.x) * 1.2,
        y: h.y + (p.y - h.y) * 1.2,
      })) as Phaser.Math.Vector2[],
      true,
    );
    const shades = [lighten(color, 0.55), color, darken(color, 0.35)];
    for (let i = 0; i < 6; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 6];
      g.fillStyle(shades[i % 3], 1).fillTriangle(h.x, h.y, a.x, a.y, b.x, b.y);
    }
    g.lineStyle(1, light, 0.8).strokePoints(pts as Phaser.Math.Vector2[], true, true);
    g.fillStyle(0xffffff, 1).fillCircle(h.x - 1.6, h.y - 1.8, 1.4);
    // Three small shards circle it, in front of and behind its face.
    for (let i = 0; i < 3; i++) {
      const a = -turn * 1.7 + (i * Math.PI * 2) / 3;
      const x = h.x + Math.cos(a) * R * 1.55;
      const y = h.y + Math.sin(a) * R * 1.55 * 0.6;
      g.fillStyle(lighten(color, 0.7), 0.95).fillTriangle(x, y - 2.4, x + 1.5, y, x - 1.5, y);
      g.fillTriangle(x, y + 2.4, x + 1.5, y, x - 1.5, y);
    }
  }

  /** A long thin sliver of ice, pointed both ends, that grows fainter as it flies. */
  private sliver(h: Pt, dx: number, dy: number, color: number, light: number): void {
    const fade = this.fade;
    const px = -dy;
    const py = dx;
    const tip = { x: h.x + dx * 10, y: h.y + dy * 10 };
    const tail = { x: h.x - dx * 8, y: h.y - dy * 8 };
    const l = { x: h.x + dx * 2 + px * 2.1, y: h.y + dy * 2 + py * 2.1 };
    const r = { x: h.x + dx * 2 - px * 2.1, y: h.y + dy * 2 - py * 2.1 };
    const g = this.body;
    const rim = (p: Pt): Pt => ({ x: h.x + (p.x - h.x) * 1.22, y: h.y + (p.y - h.y) * 1.22 });
    const a = rim(tip);
    const b = rim(l);
    const c = rim(r);
    const d = rim(tail);
    g.fillStyle(this.hostile ? 0x3a0808 : 0x000000, 0.85 * fade);
    g.fillTriangle(a.x, a.y, b.x, b.y, c.x, c.y).fillTriangle(d.x, d.y, b.x, b.y, c.x, c.y);
    g.fillStyle(color, fade);
    g.fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y).fillTriangle(
      tail.x,
      tail.y,
      l.x,
      l.y,
      r.x,
      r.y,
    );
    // The lit half, along its spine, and a white point at the tip.
    g.fillStyle(light, fade).fillTriangle(tip.x, tip.y, l.x, l.y, h.x, h.y);
    g.fillStyle(0xffffff, fade).fillTriangle(
      tip.x,
      tip.y,
      tip.x - dx * 4 + px * 0.9,
      tip.y - dy * 4 + py * 0.9,
      tip.x - dx * 4 - px * 0.9,
      tip.y - dy * 4 - py * 0.9,
    );
    this.glow.fillStyle(color, 0.3 * fade).fillCircle(h.x, h.y, 5);
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
