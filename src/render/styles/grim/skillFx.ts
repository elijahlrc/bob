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
import { HIT_AT, SCATTER_RADIUS } from '../../../data/constants';
import { MINIONS } from '../../../data/minions';
import {
  bondLinks,
  choiceByKey,
  MINE_ARM,
  MINE_RADIUS,
  ringSpots,
  TRAP_RADIUS,
} from '../../../sim/deploy';
import type { Field } from '../../../sim/fields';
import type { Actor, SimEvent, World } from '../../../sim/types';
import { beamMotifOf, motifOf } from '../../../calc/areaLook';
import { playMotif, tongue } from './areaMotifs';
import { drawBuffs, type BuffMark } from './buffFx';
import { drawLanded, fillArea, outlineArea, shapeOfExplode, type AreaShape } from './areaFx';

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
  /** A short line of text over a point on screen (a mode's name as it fires). */
  floater?(x: number, y: number, text: string, color: number, big: boolean): void;
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

/** An explode event smaller than this (tiles) is a spark, not an area. */
const COSMETIC_R = 0.6;

const KIND_COLOR = { totem: 0xc8a060, brand: 0xb070ff, trap: 0xe0c040, mine: 0xff7040 } as const;

/** Seconds a trap or a mine takes to fly from the hand to the ground, and a totem or a brand to drop onto it. */
const LOB_SECONDS = 0.3;
const DROP_SECONDS = 0.18;

/** What a deployable still in the air needs to be drawn, and to land. */
type Flight = {
  t: number;
  total: number;
  kind: string;
  /** Where it comes down, and where it was thrown from (tiles). */
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  glow: number;
};

/** The colour of the ground that skills leave (the element does not say it: consecrated ground is physical but gold). */
const GROUND_COLOR = { consecrated: 0xffe39a, chilling: 0x9ad8ff, caustic: 0x9ae05a } as const;

const shade = (c: number, f: number): number =>
  (Math.round(((c >> 16) & 255) * f) << 16) |
  (Math.round(((c >> 8) & 255) * f) << 8) |
  Math.round((c & 255) * f);

/** A fixed pseudo-random number from 0 to 1 for a pair of numbers (a tile's height of ice). */
const hash2 = (a: number, b: number): number => {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

type DeployKindName = keyof typeof KIND_COLOR;

export class SkillFx {
  private list: Fx[] = [];
  /** The width of the map in tiles (the tiles of a wall are indices into it). */
  private gridW = 0;
  private flights = new Map<number, Flight>();
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
    this.flights.clear();
  }

  // ---- Primitives -----------------------------------------------------------------------------
  private add(total: number, air: boolean, draw: (g: Gfx, k: number) => void): void {
    if (this.list.length > 140) this.list.shift();
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

  /** An area went off: its exact ground, outlined, held a moment, with the front of the blow running out to the edge. */
  landed(shape: AreaShape, color: number, total = 0.55): void {
    this.add(total, false, (g, k) =>
      drawLanded(g, this.host, shape, color, lighten(color, 0.45), k),
    );
  }

  // ---- Events ---------------------------------------------------------------------------------
  onEvent(e: SimEvent, w: World): void {
    switch (e.t) {
      case 'use': {
        // A trap that goes off or a totem that shoots is not the character casting: no cue round the character.
        if (e.via) break;
        const a = this.host.actorById(e.src);
        if (a) this.cast(a, w);
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
        // A spark or a ping (a fraction of a tile) is not an area to read: it only rings.
        if (e.r < COSMETIC_R) this.wave(e.x, e.y, e.r * 0.2, Math.max(0.5, e.r), c, 0.34);
        else this.landed(shapeOfExplode(e), c);
        if (e.r >= COSMETIC_R) {
          if (e.skill) {
            // What the skill is, inside the ground it covers.
            const motif = motifOf(e.skill, e.dtype, !!e.strip);
            playMotif({ host: this.host, add: (t, air, draw) => this.add(t, air, draw) }, motif, {
              x: e.x,
              y: e.y,
              r: e.r,
              color: c,
              strip: e.strip,
              light: e.pulse,
            });
            if (e.fall && motif !== 'blades')
              this.rain(e.x, e.y, e.r, e.fall === 'bolt' && e.dtype === 3 ? 'rock' : e.fall, c);
          } else {
            if (e.dtype === 0) this.cracks(e.x, e.y, e.r);
            if (e.fall) this.rain(e.x, e.y, e.r, e.fall, c);
          }
        }
        break;
      }
      case 'cry':
        // A warcry reaches everything within its radius: that ground, outlined, and a shake.
        this.landed({ kind: 'circle', x: e.x, y: e.y, r: e.r }, UTILITY_COLOR.warcry, 0.6);
        this.host.shake(1.5);
        break;
      case 'beam':
        // The band a beam hurt, along its whole length (a bolt that strikes a point has no width).
        if (e.width)
          this.landed(
            { kind: 'lane', x: e.x, y: e.y, x2: e.x2, y2: e.y2, half: e.width / 2 },
            ELEMENT_COLOR[e.dtype] ?? 0xffffff,
            0.45,
          );
        if (e.skill && e.width) {
          // What the band is made of (a bolt of lightning is the host's).
          const motif = beamMotifOf(e.skill, e.dtype);
          if (motif) {
            const mx = (e.x + e.x2) / 2;
            const my = (e.y + e.y2) / 2;
            playMotif({ host: this.host, add: (t, air, draw) => this.add(t, air, draw) }, motif, {
              x: mx,
              y: my,
              r: e.width / 2,
              color: ELEMENT_COLOR[e.dtype] ?? 0xffffff,
              strip: [e.x, e.y, e.x2, e.y2],
              light: false,
            });
          }
        }
        break;
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
      case 'deploy':
        if (e.end) {
          // It ended while still in the air (a trap sprang the moment it was thrown): it is gone, not landing.
          this.flights.delete(e.id);
          this.wave(e.x, e.y, 0.15, 0.6, 0xffe0a0, 0.25, 1);
        } else this.setDown(e, w);
        break;
      case 'sprung':
        this.sprung(e, w);
        break;
      default:
        break;
    }
  }

  /** The colour of the element a deployable's skill deals. */
  private glowOf(w: World, id: number): number {
    const d = w.deployables.find((x) => x.id === id);
    const choice = d ? choiceByKey(w, d.key) : undefined;
    return ELEMENT_COLOR[choice ? elementOfTags(choice.skill.tags, choice.skill.spellDamage) : 0];
  }

  /**
   * A totem, brand, trap or mine is put down: a trap or a mine is thrown from the hand in an arc, a totem or a brand
   * comes down from above. The thing is drawn in the air until it lands (`flying`), then it lands with dust and a small ring.
   */
  private setDown(e: Extract<SimEvent, { t: 'deploy' }>, w: World): void {
    const thrown = e.kind === 'trap' || e.kind === 'mine';
    const total = thrown ? LOB_SECONDS : DROP_SECONDS;
    this.flights.set(e.id, {
      t: total,
      total,
      kind: e.kind,
      x: e.x,
      y: e.y,
      fromX: w.player.x,
      fromY: w.player.y,
      glow: this.glowOf(w, e.id),
    });
  }

  private landFlight(f: Flight): void {
    const p = this.host.project(f.x, f.y);
    const thrown = f.kind === 'trap' || f.kind === 'mine';
    this.host.em.dust.explode(thrown ? 4 : 7, p.x, p.y - 1);
    this.wave(f.x, f.y, 0.15, thrown ? 0.7 : 1.0, lighten(f.glow, 0.3), 0.3, 1.5);
    if (!thrown) this.host.shake(1.5);
  }

  /** A trap springs or a mine goes: the casing bursts into spikes and a line runs to what it fires at. */
  private sprung(e: Extract<SimEvent, { t: 'sprung' }>, w: World): void {
    const glow = this.glowOf(w, e.id);
    const mine = e.kind === 'mine';
    const reach = mine ? 1.7 : 1.2;
    const o = this.lifted(e.x, e.y, 3);
    const t = this.lifted(e.tx, e.ty, 6);
    this.add(0.34, true, (g, k) => {
      const a = 1 - k;
      const run = Math.min(1, k * 3);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + e.x * 3;
        const p0 = this.lifted(
          e.x + Math.cos(ang) * reach * 0.12 * (1 + run),
          e.y + Math.sin(ang) * reach * 0.12 * (1 + run),
          3,
        );
        const p1 = this.lifted(
          e.x + Math.cos(ang) * reach * (0.2 + 0.8 * run),
          e.y + Math.sin(ang) * reach * (0.2 + 0.8 * run),
          3,
        );
        g.lineStyle(mine ? 2.5 : 2, lighten(glow, 0.45), a).lineBetween(p0.x, p0.y, p1.x, p1.y);
      }
    });
    this.add(0.22, true, (g, k) => this.streak(g, [o, t], glow, 1 - k, 0.9));
    this.wave(e.x, e.y, 0.15, mine ? 1.1 : 0.8, lighten(glow, 0.35), 0.3, 1.5);
    this.host.flash(o.x, o.y, glow, mine ? 1.4 : 1, 0.25);
    this.host.em.spark.explode(mine ? 8 : 5, o.x, o.y);
  }

  /**
   * The wind-up of a skill that puts something down: the thing itself is held up in the hand, glowing brighter as the throw comes,
   * and where a trap, a mine or a brand will go (at the target) a ring closes on the spot.
   */
  private readying(a: Actor, act: NonNullable<Actor['action']>, kind: DeployKindName): void {
    const glow = ELEMENT_COLOR[profileLook(act.profile).element] ?? 0xffffff;
    const total = Math.max(0.15, act.duration * HIT_AT);
    this.add(total, true, (g, k) => {
      if (!a.alive) return;
      const hx = a.x + Math.cos(a.facing) * 0.3;
      const hy = a.y + Math.sin(a.facing) * 0.3;
      const hand = this.host.project(hx, hy);
      g.fillStyle(glow, 0.12 + 0.28 * k).fillCircle(hand.x, hand.y - 14, 4 + 5 * k);
      this.deployable(
        g,
        kind,
        hand.x,
        hand.y,
        glow,
        Math.min(1, k * 5),
        false,
        false,
        this.now,
        0,
        14,
      );
    });
    if (kind === 'totem') return;
    // Where it will go: a dark-edged ring on the ground closes on each place as the throw comes (a ring of them for a set, one
    // wide place for traps that scatter).
    const prof = act.profile;
    const scatter = kind === 'trap' && prof.deployScatter;
    const spots =
      kind === 'brand'
        ? [{ dx: 0, dy: 0 }]
        : scatter
          ? [{ dx: 0, dy: 0 }]
          : ringSpots(prof.deployCount);
    this.add(total, false, (g, k) => {
      const t = this.host.actorById(act.targetId);
      if (!t) return;
      const to = scatter ? SCATTER_RADIUS : 0.3 + 0.9 * (1 - k);
      for (const s of spots) {
        const r = scatter ? to : spots.length > 1 ? 0.25 + 0.6 * (1 - k) : to;
        outlineArea(
          g,
          this.host,
          { kind: 'circle', x: t.x + s.dx, y: t.y + s.dy, r },
          lighten(glow, 0.2),
          0.5 + 0.5 * k,
          1.5,
        );
        this.disc(g, t.x + s.dx, t.y + s.dy, r, glow, 0.1 + 0.15 * k);
      }
    });
  }

  /** What a skill use shows while it winds up: the cue of its kind. */
  private cast(a: Actor, w: World): void {
    const act = a.action;
    if (!act) return;
    // A skill that puts something down shows the thing being readied, not a spell going off.
    const deploy = a.isPlayer
      ? w.char.actives.find((c) => c.skill.id === act.profile.skill.id)?.deploy
      : undefined;
    if (deploy) {
      this.readying(a, act, deploy);
      return;
    }
    // A skill of beams puts its totems down: no blast shows around the caster.
    if (act.profile.skill.bond) return;
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

  /**
   * Missiles come down on an area (a rain, a hail): a handful fall one after another from above onto points scattered over it,
   * each streaking down in the colour of the damage and splashing where it lands, so the skill is seen to fire its missiles. An
   * arrow is a thin streak and a puff of dust; a burning rock is a ball of fire with a tail that bursts into a small flame; a
   * bolt (a spell of lightning) is a streak with a white head.
   */
  private rain(
    x: number,
    y: number,
    r: number,
    look: 'arrow' | 'bolt' | 'rock',
    color: number,
  ): void {
    const n = Math.max(4, Math.min(12, Math.round(r * 3)));
    const FALL = 0.15;
    const SPLASH = look === 'rock' ? 0.22 : 0.14;
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + x * 7.1;
      const d = r * Math.sqrt((i + 0.5) / n) * 0.92;
      const tx = x + Math.cos(a) * d;
      const ty = y + Math.sin(a) * d;
      const wait = (i / n) * 0.2;
      const total = wait + FALL + SPLASH;
      this.add(total, true, (g, k) => {
        const t = k * total - wait;
        if (t < 0) return;
        const ground = this.host.project(tx, ty);
        if (t <= FALL) {
          const u = t / FALL;
          const head = { x: ground.x - (1 - u) * 6, y: ground.y - HAND - (1 - u) * 90 };
          if (look === 'rock') {
            const tail = { x: head.x - 5, y: head.y - 26 };
            this.streak(g, [tail, head], 0xff7a20, 0.8, 0.55);
            g.fillStyle(0xff5a18, 0.9).fillCircle(head.x, head.y, 3);
            g.fillStyle(0xffd060, 0.95).fillCircle(head.x, head.y, 1.6);
          } else {
            const tail = { x: head.x - 2, y: head.y - (look === 'arrow' ? 14 : 10) };
            this.streak(g, [tail, head], color, 0.9, look === 'arrow' ? 0.5 : 0.7);
            if (look === 'bolt') g.fillStyle(0xffffff, 0.95).fillCircle(head.x, head.y, 1.8);
          }
        } else {
          const v = (t - FALL) / SPLASH;
          if (look === 'rock') {
            // A small flame stands up where it landed and gutters out.
            const h = 11 * Math.sin(Math.PI * Math.min(1, v * 1.1));
            tongue(g, ground.x, ground.y, 3.2, h, Math.sin(v * 14 + i) * 1.5, 1 - v * 0.6);
            this.ring(g, tx, ty, 0.1 + 0.25 * v, 0xffa040, 0.8 * (1 - v), 1.2);
          } else {
            this.ring(g, tx, ty, 0.12 + 0.3 * v, lighten(color, 0.4), 1 - v, 1.2);
            if (look === 'arrow' && v < 0.6)
              g.fillStyle(0x8a7a68, 0.4 * (1 - v)).fillEllipse(
                ground.x,
                ground.y,
                8 * v + 3,
                3 * v + 1.5,
              );
          }
        }
      });
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
    // The ground the sweep covers, outlined where it lies.
    this.landed({ kind: 'wedge', x: e.x, y: e.y, r: e.radius, facing: e.facing, half }, color, 0.4);
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
    this.gridW = w.grid.w;
    this.zones(ground, w, time);
    this.bonds(ground, w, time);
    this.deployables(ground, w, time);
    this.minions(ground, w, time);
    this.upkeep(ground, w, time);
    const air = this.air;
    air.clear();
    this.flying(ground, air, dt, time);
    this.fieldMarks(ground, air, w, time);
    this.curseMarks(air, w, time);
    this.siphons(air, w, time);
    this.buffMarks(ground, air, w, time);
    this.lasting(ground, air, w, time);
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
        outlineArea(
          g,
          this.host,
          { kind: 'lane', x: z.x, y: z.y, x2: z.x2, y2: z.y2, half: z.radius },
          edge,
          (live ? 0.95 : 0.6) * fade,
          live ? 1.5 : 1,
        );
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
      // A rain with extra arrows: the places where the extra ones burst, outlined like the shower itself.
      if (z.spots && !z.stack)
        for (let i = 1; i < z.spots.length; i++) {
          const s = z.spots[i];
          outlineArea(
            g,
            this.host,
            { kind: 'circle', x: s.x, y: s.y, r: s.r },
            edge,
            z.delayT > 0 ? 0.6 : 0.9 * fade,
            1,
          );
        }
      if (z.delayT > 0) {
        // The zone is coming: a faint disc with a ring of ticks that closes in.
        const k = 1 - z.delayT / Math.max(0.01, z.delayT + 0.3);
        void k;
        this.disc(g, z.x, z.y, z.radius, c, 0.08);
        outlineArea(g, this.host, { kind: 'circle', x: z.x, y: z.y, r: z.radius }, edge, 0.7, 1);
        this.ticks(g, z.x, z.y, z.radius, 16, time * 1.2, edge, 0.8, 2);
        continue;
      }
      this.disc(g, z.x, z.y, z.radius, c, (0.14 + 0.04 * Math.sin(time * 3)) * fade);
      outlineArea(
        g,
        this.host,
        { kind: 'circle', x: z.x, y: z.y, r: z.radius },
        edge,
        0.95 * fade,
        1.5,
      );
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

  /** The beams between a skill's totems and the character (Cinder Bond): a glowing band on the ground, flickering. */
  private bonds(g: Gfx, w: World, time: number): void {
    for (const l of bondLinks(w)) {
      const choice = choiceByKey(w, l.key);
      const element = choice ? elementOfTags(choice.skill.tags, choice.skill.spellDamage) : 0;
      const glow = ELEMENT_COLOR[element];
      const a = this.host.project(l.x1, l.y1);
      const b = this.host.project(l.x2, l.y2);
      // The width in tiles, as pixels where the beam lies.
      const o = this.host.project(l.x1 + l.width, l.y1);
      const px = Math.max(3, Math.hypot(o.x - a.x, o.y - a.y) * 0.55);
      const flick = 0.75 + 0.25 * Math.sin(time * 14 + l.x1 * 3 + l.y1);
      g.lineStyle(px * 1.8, glow, 0.14 * flick).lineBetween(a.x, a.y - 4, b.x, b.y - 4);
      g.lineStyle(px, glow, 0.38 * flick).lineBetween(a.x, a.y - 4, b.x, b.y - 4);
      g.lineStyle(Math.max(1, px * 0.3), lighten(glow, 0.55), 0.9 * flick).lineBetween(
        a.x,
        a.y - 4,
        b.x,
        b.y - 4,
      );
    }
  }

  /** Totems, brands, traps and mines: the shape says which, the glow says the element. */
  private deployables(g: Gfx, w: World, time: number): void {
    for (const d of w.deployables) {
      // Still in the air: drawn by `flying` until it lands.
      if (this.flights.has(d.id)) continue;
      const { x, y } = this.host.project(d.x, d.y);
      const choice = choiceByKey(w, d.key);
      const element = choice ? elementOfTags(choice.skill.tags, choice.skill.spellDamage) : 0;
      const glow = ELEMENT_COLOR[element];
      const fade = Math.min(1, d.t);
      const armed = d.fireT <= 0.05;
      const going = d.goAt !== undefined;
      this.deployable(g, d.kind, x, y, glow, fade, armed, going, time, d.id, 0);
      if (d.kind !== 'trap' && d.kind !== 'mine') continue;
      if (going) {
        // Set off: a ring closes on the mine until it goes.
        const k = Math.min(1, Math.max(0, d.goAt! - w.t) / 0.25);
        this.ring(g, d.x, d.y, 0.3 + 1.1 * k, 0xffffff, 0.9 * fade, 1.5);
      } else if (!armed) {
        // Arming: a ring of its colour closes on it, and then it is ready.
        const full = d.kind === 'mine' ? MINE_ARM : 0.3;
        const k = Math.min(1, Math.max(0, d.fireT / full));
        this.ring(g, d.x, d.y, 0.25 + 0.85 * k, glow, 0.85 * fade, 1.2);
      } else {
        // Ready: the ground that sets it off, marked (how close an enemy has to come).
        const trap = d.kind === 'trap';
        const reach = trap ? TRAP_RADIUS : MINE_RADIUS;
        this.ring(g, d.x, d.y, reach, glow, (trap ? 0.28 : 0.2) * fade, 1);
        this.ticks(g, d.x, d.y, reach, trap ? 12 : 22, 0, glow, (trap ? 0.7 : 0.5) * fade, 3);
      }
    }
  }

  /**
   * One totem, brand, trap or mine at a screen point (a spot on the ground, `lift` pixels above it while it is in the air).
   * `armed` is a trap or a mine that is ready, `going` a mine that has been set off.
   */
  private deployable(
    g: Gfx,
    kind: DeployKindName,
    x: number,
    y: number,
    glow: number,
    fade: number,
    armed: boolean,
    going: boolean,
    time: number,
    id: number,
    lift: number,
  ): void {
    const base = KIND_COLOR[kind];
    const sy = y - lift;
    g.fillStyle(0x000000, 0.3 * fade).fillEllipse(x, y + 1, 12, 5);
    if (kind === 'totem') {
      g.fillStyle(0x6a5030, 0.95 * fade).fillRect(x - 3, sy - 13, 6, 13);
      g.fillStyle(base, 0.95 * fade).fillRect(x - 4, sy - 15, 8, 3);
      const pulse = 0.6 + 0.4 * Math.sin(time * 6 + id);
      g.fillStyle(glow, 0.35 * fade * pulse).fillCircle(x, sy - 19, 5);
      g.fillStyle(lighten(glow, 0.4), 0.95 * fade).fillCircle(x, sy - 19, 2.4);
    } else if (kind === 'brand') {
      const spin = time * 1.5 + id;
      g.fillStyle(glow, 0.12 * fade).fillEllipse(x, y, 20, 10);
      g.lineStyle(1, glow, 0.9 * fade).strokeEllipse(x, sy - 6, 12, 6);
      for (let i = 0; i < 3; i++) {
        const a = spin + (i / 3) * Math.PI * 2;
        g.lineStyle(1, lighten(glow, 0.3), 0.8 * fade).lineBetween(
          x,
          sy - 6,
          x + Math.cos(a) * 6,
          sy - 6 + Math.sin(a) * 3,
        );
      }
      g.fillStyle(0xffffff, 0.9 * fade).fillCircle(x, sy - 6, 1.5);
    } else if (kind === 'trap') {
      // A plate set with teeth, lit in the element's colour when it is ready.
      g.fillStyle(0x3a3020, 0.95 * fade).fillRect(x - 9, sy - 2, 18, 6);
      g.lineStyle(1, base, 0.95 * fade).strokeRect(x - 9, sy - 2, 18, 6);
      const lit = (armed ? 0.95 : 0.45) * fade;
      for (const dx of [-6.5, -2.2, 2.2, 6.5])
        g.fillStyle(glow, lit).fillTriangle(x + dx - 2, sy - 2, x + dx + 2, sy - 2, x + dx, sy - 9);
    } else {
      const blink = going
        ? 0.5 + 0.5 * Math.sin(time * 40)
        : armed
          ? 0.55 + 0.45 * Math.sin(time * 10 + id)
          : 0.3;
      g.fillStyle(0x2a2018, 0.95 * fade).fillEllipse(x, sy, 13, 7);
      g.fillStyle(glow, blink * fade * 0.35).fillCircle(x, sy - 1, 5);
      g.fillStyle(lighten(glow, 0.3), blink * fade).fillCircle(x, sy - 1, 2.4);
      g.lineStyle(1, base, 0.85 * fade).strokeEllipse(x, sy, 13, 7);
    }
  }

  /** Totems and brands coming down from above, and traps and mines thrown from the hand in an arc, until they land. */
  private flying(ground: Gfx, air: Gfx, dt: number, time: number): void {
    for (const [id, f] of this.flights) {
      f.t -= dt;
      if (f.t <= 0) {
        this.flights.delete(id);
        this.landFlight(f);
        continue;
      }
      const u = 1 - f.t / f.total;
      const thrown = f.kind === 'trap' || f.kind === 'mine';
      const to = this.host.project(f.x, f.y);
      const from = this.host.project(f.fromX, f.fromY);
      // Where it is at `s` of the way: along the ground, and how far up.
      const at = (s: number): { x: number; y: number; lift: number } => {
        if (!thrown) return { x: to.x, y: to.y, lift: (1 - s) * (1 - s) * 70 };
        const span = Math.hypot(to.x - from.x, to.y - from.y);
        return {
          x: from.x + (to.x - from.x) * s,
          y: from.y + (to.y - from.y) * s,
          lift: 14 * (1 - s) + Math.sin(Math.PI * s) * (22 + span * 0.12),
        };
      };
      if (thrown && u > 0.15)
        this.streak(
          air,
          [0.15, 0.07, 0].map((back) => {
            const p = at(u - back);
            return { x: p.x, y: p.y - p.lift };
          }),
          f.glow,
          0.7,
          0.6,
        );
      const p = at(u);
      air.fillStyle(f.glow, 0.3).fillCircle(p.x, p.y - p.lift - 4, 7);
      this.deployable(
        ground,
        f.kind as DeployKindName,
        p.x,
        p.y,
        f.glow,
        1,
        false,
        false,
        time,
        id,
        p.lift,
      );
    }
  }

  /**
   * What the sim keeps in `w.fields` (ground a skill leaves, a wall of ice, a crystal, an orb, a trail, an illusion, a
   * geyser, smoke, a storm), drawn from its state each frame. Each says what it is by its shape; the colour is the element.
   */
  private fieldMarks(ground: Gfx, air: Gfx, w: World, time: number): void {
    for (const f of w.fields) {
      const fade = Math.min(1, Math.max(0, f.t) / 0.6);
      const born = Math.min(1, (f.total - f.t) * 4);
      const el = ELEMENT_COLOR[f.dtype] ?? 0xffffff;
      switch (f.kind) {
        case 'consecrated':
        case 'chilling':
        case 'caustic': {
          const c = GROUND_COLOR[f.kind];
          const motif = f.kind === 'consecrated' ? 3 : f.kind === 'chilling' ? 2 : 4;
          this.disc(
            ground,
            f.x,
            f.y,
            f.radius,
            c,
            (0.13 + 0.03 * Math.sin(time * 3 + f.id)) * fade * born,
          );
          outlineArea(
            ground,
            this.host,
            { kind: 'circle', x: f.x, y: f.y, r: f.radius },
            c,
            0.9 * fade * born,
            1.5,
          );
          this.zoneMotif(ground, f.x, f.y, f.radius, motif, c, time, fade * born);
          break;
        }
        case 'pod': {
          // A spore pod in the ground: it bursts when its time is up.
          const o = this.host.project(f.x, f.y);
          const pulse = 0.6 + 0.4 * Math.sin(time * 5 + f.id);
          this.ring(ground, f.x, f.y, f.radius, GROUND_COLOR.caustic, 0.22 * fade, 1);
          ground.fillStyle(0x000000, 0.3 * fade).fillEllipse(o.x, o.y + 1, 10, 4);
          ground.fillStyle(0x6a8a3a, 0.9 * fade).fillEllipse(o.x, o.y - 3, 8, 7);
          air.fillStyle(0xa0e060, 0.4 * pulse * fade).fillCircle(o.x, o.y - 4, 5);
          break;
        }
        case 'crystal': {
          // A shard of ice standing where it will burst; it flickers as the burst comes.
          const o = this.host.project(f.x, f.y);
          const h = 22 * born;
          const soon = f.t < 0.5 ? 0.5 + 0.5 * Math.sin(time * 30) : 1;
          this.disc(ground, f.x, f.y, f.radius, el, 0.08 * fade);
          outlineArea(
            ground,
            this.host,
            { kind: 'circle', x: f.x, y: f.y, r: f.radius },
            el,
            0.6 * fade,
            1,
          );
          ground.fillStyle(0x000000, 0.3).fillEllipse(o.x, o.y + 1, 12, 5);
          ground
            .fillStyle(shade(el, 0.55), 0.95 * fade)
            .fillTriangle(o.x - 5, o.y, o.x + 5, o.y, o.x, o.y + 3);
          ground
            .fillStyle(shade(el, 0.8), 0.95 * fade)
            .fillTriangle(o.x - 5, o.y, o.x + 5, o.y, o.x, o.y - h);
          air
            .fillStyle(0xffffff, 0.55 * soon * fade)
            .fillTriangle(o.x - 1, o.y - 2, o.x + 5, o.y, o.x, o.y - h);
          break;
        }
        case 'storm': {
          // A storm that follows the character: a ring of crackling ticks about it.
          this.disc(ground, f.x, f.y, f.radius, el, 0.06 * fade);
          this.ring(ground, f.x, f.y, f.radius, el, 0.5 * fade, 1.5);
          this.ticks(ground, f.x, f.y, f.radius, 14, time * 1.5, lighten(el, 0.5), 0.9 * fade, 2);
          break;
        }
        case 'wall':
          this.iceWall(ground, air, f, fade, time);
          break;
        case 'orb': {
          // A frost orb that hangs over the character: it grows with its stages and sheds motes.
          const stages = Math.max(0, f.stages ?? 0);
          const r = Math.min(12, 6 + stages * 0.6);
          const o = this.lifted(f.x, f.y, 26 + Math.sin(time * 3) * 2);
          const spec = f.profile?.skill.orb;
          if (spec?.kind === 'frost') this.ring(ground, f.x, f.y, spec.range, el, 0.1 * fade, 1);
          air.fillStyle(el, 0.18 * fade).fillCircle(o.x, o.y, r + 5);
          air.fillStyle(el, 0.5 * fade).fillCircle(o.x, o.y, r);
          air.fillStyle(0xffffff, 0.95 * fade).fillCircle(o.x, o.y, r * 0.4);
          for (let i = 0; i < 5; i++) {
            const a = time * 3 + (i / 5) * Math.PI * 2;
            air
              .fillStyle(lighten(el, 0.5), 0.9 * fade)
              .fillCircle(o.x + Math.cos(a) * (r + 6), o.y + Math.sin(a) * (r + 6) * 0.5, 1.5);
          }
          break;
        }
        case 'zap': {
          // A bead of lightning that jumps from spot to spot.
          const o = this.lifted(f.x, f.y, 10);
          this.ring(ground, f.x, f.y, f.radius, el, 0.3 * fade, 1);
          air.fillStyle(el, 0.3 * fade).fillCircle(o.x, o.y, 6);
          air.fillStyle(0xffffff, 0.95 * fade).fillCircle(o.x, o.y, 2.5);
          for (let i = 0; i < 3; i++) {
            const a = time * 9 + i * 2.1;
            air
              .lineStyle(1, 0xffffff, 0.8 * fade)
              .lineBetween(o.x, o.y, o.x + Math.cos(a) * 8, o.y + Math.sin(a) * 6);
          }
          break;
        }
        case 'trail': {
          // Ground a dash left along its way: a band with motes drifting up it.
          const shape = {
            kind: 'lane',
            x: f.x,
            y: f.y,
            x2: f.x2!,
            y2: f.y2!,
            half: f.radius,
          } as const;
          fillArea(ground, this.host, shape, el, 0.14 * fade);
          outlineArea(ground, this.host, shape, el, 0.8 * fade, 1.2);
          for (let i = 0; i < 8; i++) {
            const s = (i / 8 + time * 0.5) % 1;
            const side = Math.sin(i * 12.9898) * 0.6 * f.radius;
            const len = Math.hypot(f.x2! - f.x, f.y2! - f.y) || 1;
            const nx = (-(f.y2! - f.y) / len) * side;
            const ny = ((f.x2! - f.x) / len) * side;
            const p = this.host.project(f.x + (f.x2! - f.x) * s + nx, f.y + (f.y2! - f.y) * s + ny);
            ground.fillStyle(lighten(el, 0.4), 0.7 * fade).fillRect(p.x - 1, p.y - 1, 2, 2);
          }
          break;
        }
        case 'ghost': {
          // The illusion that runs ahead of the character: a pale figure in a ring.
          const o = this.host.project(f.x, f.y);
          this.ring(ground, f.x, f.y, f.radius, el, 0.3 * fade, 1);
          ground.fillStyle(0x000000, 0.25).fillEllipse(o.x, o.y + 1, 10, 4);
          air.fillStyle(el, 0.4).fillTriangle(o.x - 5, o.y, o.x + 5, o.y, o.x, o.y - 16);
          air.fillStyle(el, 0.55).fillCircle(o.x, o.y - 19, 3.5);
          air.lineStyle(1, 0xffffff, 0.6).strokeCircle(o.x, o.y - 19, 3.5);
          break;
        }
        case 'bladestorm':
          // Blades that drift over the ground, one ring with two blades going round it, as the spin of a character.
          this.whirl(
            ground,
            air,
            { x: f.x, y: f.y } as Actor,
            this.colorOfSkill(w, f.profile?.skill.id ?? ''),
            f.radius,
            fade * born,
            time * 9,
          );
          break;
        case 'geyser': {
          // A pit in the ground that throws embers up while it sends its blasts down about it.
          const o = this.host.project(f.x, f.y);
          this.ring(ground, f.x, f.y, f.radius, el, 0.3 * fade, 1);
          ground.fillStyle(0x1a0c06, 0.8 * fade).fillEllipse(o.x, o.y, 22, 10);
          ground.lineStyle(1, el, 0.9 * fade).strokeEllipse(o.x, o.y, 22, 10);
          for (let i = 0; i < 6; i++) {
            const rise = ((time * 1.2 + i * 0.17) % 1) * 24;
            air
              .fillStyle(lighten(el, 0.3), 0.9 * (1 - rise / 24) * fade)
              .fillRect(o.x + Math.sin(i * 5.1) * 6 - 1, o.y - rise - 1, 2, 2);
          }
          break;
        }
        case 'smoke': {
          // A cloud that blinds what stands in it.
          this.disc(ground, f.x, f.y, f.radius, 0x9a9aa0, 0.16 * fade * born);
          const o = this.host.project(f.x, f.y);
          const rx = this.host.rpx(f.radius);
          const sq = this.host.squash();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + time * 0.3;
            air
              .fillStyle(0xc8c8d0, 0.08 * fade * born)
              .fillCircle(
                o.x + Math.cos(a) * rx * 0.5,
                o.y - 6 + Math.sin(a) * rx * 0.5 * sq,
                rx * 0.32,
              );
          }
          this.ring(ground, f.x, f.y, f.radius, 0xc8c8d0, 0.3 * fade, 1);
          break;
        }
        default:
          break;
      }
    }
  }

  /**
   * A wall of ice: a block of ice on each tile the wall holds shut, rising out of the ground when it is raised and sinking into
   * it as it melts. Drawn tile by tile, so it is exactly the ground that is blocked.
   */
  private iceWall(ground: Gfx, air: Gfx, f: Field, fade: number, time: number): void {
    const w = this.gridW;
    if (!f.tiles || w <= 0) return;
    const rise = 1 - (1 - Math.min(1, (f.total - f.t) * 5)) ** 2;
    const up = rise * fade;
    const ice = ELEMENT_COLOR[2];
    // Back to front, so a block in front covers the one behind it.
    const tiles = f.tiles
      .map((idx) => ({ tx: idx % w, ty: Math.floor(idx / w) }))
      .sort(
        (a, b) =>
          this.host.project(a.tx + 0.5, a.ty + 0.5).y - this.host.project(b.tx + 0.5, b.ty + 0.5).y,
      );
    for (const { tx, ty } of tiles) {
      const h = (20 + 12 * hash2(tx, ty)) * up;
      const at = (dx: number, dy: number, lift: number): Pt => {
        const p = this.host.project(tx + dx, ty + dy);
        return { x: p.x, y: p.y - lift };
      };
      const foot = [at(0, 0, 0), at(1, 0, 0), at(1, 1, 0), at(0, 1, 0)];
      const top = [at(0, 0, h), at(1, 0, h), at(1, 1, h), at(0, 1, h)];
      const mid = at(0.5, 0.5, 0);
      const V = (p: Pt[]) => p as Phaser.Math.Vector2[];
      const mix = (p: Pt, q: Pt, k: number): Pt => ({
        x: p.x + (q.x - p.x) * k,
        y: p.y + (q.y - p.y) * k,
      });
      // The frost on the ground under it.
      ground.fillStyle(ice, 0.22 * fade).fillPoints(V(foot), true);
      ground.lineStyle(1, ice, 0.5 * fade).strokePoints(V(foot), true, true);
      // The sides that face the viewer (the lower edges on the screen): a lighter upper band over a darker lower one, a slanting
      // facet of light, and a bright edge; the left side darker than the right.
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        if ((foot[i].y + foot[j].y) / 2 <= mid.y + 0.5) continue;
        const k = (foot[i].x + foot[j].x) / 2 < mid.x ? 0.5 : 0.68;
        const lo = [foot[i], foot[j], mix(foot[j], top[j], 0.5), mix(foot[i], top[i], 0.5)];
        const hi = [lo[3], lo[2], top[j], top[i]];
        ground.fillStyle(shade(ice, k * 0.85), 0.96 * fade).fillPoints(V(lo), true);
        ground.fillStyle(shade(ice, Math.min(1, k * 1.15)), 0.96 * fade).fillPoints(V(hi), true);
        const f0 = mix(top[i], top[j], 0.15);
        const f1 = mix(top[i], top[j], 0.5);
        const f2 = mix(mix(foot[i], foot[j], 0.3), mix(top[i], top[j], 0.3), 0.35);
        ground
          .fillStyle(lighten(ice, 0.6), 0.32 * fade)
          .fillTriangle(f0.x, f0.y, f1.x, f1.y, f2.x, f2.y);
        ground
          .lineStyle(1, lighten(ice, 0.6), 0.6 * fade)
          .lineBetween(foot[i].x, foot[i].y, top[i].x, top[i].y);
        ground
          .lineStyle(1, 0x10243a, 0.5 * fade)
          .lineBetween(foot[i].x, foot[i].y, foot[j].x, foot[j].y);
      }
      ground.fillStyle(lighten(ice, 0.2), 0.96 * fade).fillPoints(V(top), true);
      ground.lineStyle(1, 0x1a3a5a, 0.6 * fade).strokePoints(V(top), true, true);
      // A cluster of shards standing on the top.
      for (const [sx, sy, sh] of [
        [0.3, 0.35, 0],
        [0.65, 0.55, 1],
        [0.42, 0.75, 2],
      ] as const) {
        const c = at(sx, sy, h);
        const spike = (6 + 12 * hash2(tx + sh * 3.1, ty - sh * 1.7)) * up;
        ground
          .fillStyle(lighten(ice, 0.6), 0.95 * fade)
          .fillTriangle(c.x - 3, c.y, c.x + 3, c.y, c.x + 0.5, c.y - spike);
        ground
          .fillStyle(0xffffff, 0.5 * fade)
          .fillTriangle(c.x - 3, c.y, c.x, c.y, c.x + 0.5, c.y - spike);
      }
      const glint = 0.5 + 0.5 * Math.sin(time * 4 + tx * 1.7 + ty);
      air
        .lineStyle(1, 0xffffff, 0.5 * glint * fade)
        .lineBetween(top[3].x, top[3].y, top[2].x, top[2].y);
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
  }

  /** Each buff that is up has a mark of its own on the character (buffFx.ts); one about to end blinks. */
  private buffMarks(ground: Gfx, air: Gfx, w: World, time: number): void {
    const p = w.player;
    if (!p.alive) return;
    const marks: BuffMark[] = [];
    for (const id of BUFF_IDS) {
      const left = w.buffT[id];
      if (left <= 0) continue;
      // A buff about to end blinks.
      marks.push({ id, alpha: left < 1.5 ? 0.4 + 0.6 * Math.abs(Math.sin(time * 8)) : 1 });
    }
    drawBuffs(air, ground, this.host, p, marks, time);
  }

  /** A curse is a violet sigil turning over the head of each enemy that carries one. */
  /** The element's colour of the character's skill that has this id. */
  private colorOfSkill(w: World, id: string): number {
    const c = w.char.actives.find((x) => x.skill.id === id);
    return ELEMENT_COLOR[c ? elementOfTags(c.skill.tags, c.skill.spellDamage) : 0] ?? 0xffffff;
  }

  /**
   * What single skills leave standing that is not a zone or a deployable, drawn from the sim's state: the blades circling the
   * character (Blade Vortex), the orb (Orb of Storms), the markers waiting to be struck (Storm Call), the arrows stuck in an
   * enemy (Explosive Arrow) and the pods in the ground (Scourge Arrow), the mirage archer, the charges on an enemy
   * (Infernal Blow) and the shell about the character (Molten Shell).
   */
  /**
   * What stays on the character while a skill carries it or spins it: one ring with two blades going round it (a spin, or a channel
   * that pulses around the character), speed lines behind a run or a charge, and the chain of a hook.
   */
  private spinning(ground: Gfx, air: Gfx, w: World, time: number): void {
    const p = w.player;
    if (!p.alive) return;
    const act = p.action;
    const spin = act?.profile.skill.spin;
    if (act && spin) {
      const k = Math.min(1, act.elapsed / act.duration);
      this.whirl(
        ground,
        air,
        p,
        this.colorOfSkill(w, act.profile.skill.id),
        spin.radius * act.profile.radiusMult + p.r,
        Math.min(1, k * 10, (1 - k) * 10 + 0.25),
        time * 18,
      );
    }
    const ch = w.channel;
    const spec = ch?.profile.skill.channel;
    const beh = ch?.profile.skill.behaviour;
    if (ch && spec?.tick && beh?.kind === 'burst' && beh.origin === 'self') {
      const r =
        beh.radius *
          ch.profile.radiusMult *
          (1 + ((spec.tickRadiusPerStage ?? 0) * ch.stage) / 100) +
        p.r;
      const fade = Math.min(1, (w.t - ch.startT) * 6);
      this.whirl(ground, air, p, this.colorOfSkill(w, ch.key), r, fade, time * (10 + 2 * ch.stage));
    }
    const run = act?.profile.skill.run;
    if (act && run && !act.fired) {
      const color = this.colorOfSkill(w, act.profile.skill.id);
      const k = Math.min(1, act.elapsed / (HIT_AT * act.duration));
      if (run.style === 'hook') {
        const t = this.host.actorById(act.targetId);
        if (t) {
          const a = this.lifted(p.x, p.y);
          const b = this.lifted(t.x, t.y);
          this.streak(air, [a, b], 0xc8c8d0, 0.9, 0.8);
          air.fillStyle(0xe8e8f0, 1).fillCircle(b.x, b.y, 3);
        }
      } else if (run.style !== 'leap' && p.moving) {
        // Lines trailing from the character, back along the way it came.
        const bx = Math.cos(p.facing);
        const by = Math.sin(p.facing);
        for (const off of [-0.35, 0, 0.35]) {
          const x = p.x - by * off;
          const y = p.y + bx * off;
          const a = this.lifted(x - bx * 0.3, y - by * 0.3);
          const b = this.lifted(x - bx * (1.2 + 0.6 * k), y - by * (1.2 + 0.6 * k));
          this.streak(air, [a, b], run.style === 'charge' ? 0xdfe6ee : color, 0.7, 0.8);
        }
      }
    }
  }

  /** One ring on the ground round an actor, with two blades going round it; `fade` is how bright. */
  private whirl(
    ground: Gfx,
    air: Gfx,
    p: Actor,
    color: number,
    r: number,
    fade: number,
    head0: number,
  ): void {
    this.disc(ground, p.x, p.y, r, color, 0.1 * fade);
    this.ring(ground, p.x, p.y, r, color, 0.55 * fade, 1);
    for (let blade = 0; blade < 2; blade++) {
      const head = head0 + blade * Math.PI;
      const pts: Pt[] = [];
      for (let i = 0; i <= 10; i++) {
        const a = head - i * 0.14;
        pts.push(this.lifted(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r));
      }
      this.streak(air, pts, color, fade, 1.2);
    }
  }

  private lasting(ground: Gfx, air: Gfx, w: World, time: number): void {
    const p = w.player;
    this.spinning(ground, air, w, time);
    const vx = w.vortex;
    if (vx && p.alive && vx.blades.length > 0) {
      const spec = choiceByKey(w, vx.key)?.skill.vortex;
      const color = this.colorOfSkill(w, choiceByKey(w, vx.key)?.skill.id ?? '');
      const o = this.host.project(p.x, p.y);
      const rx = this.host.rpx(Math.min(1.4, spec?.radius ?? 1.4));
      const sq = this.host.squash();
      const n = vx.blades.length;
      ground.lineStyle(1, color, 0.3).strokeEllipse(o.x, o.y, rx * 2, rx * 2 * sq);
      for (let i = 0; i < n; i++) {
        const a = time * 5 + (i / n) * Math.PI * 2;
        const x = o.x + Math.cos(a) * rx;
        const y = o.y - 8 + Math.sin(a) * rx * sq;
        const fade = Math.min(1, vx.blades[i] * 2);
        air.fillStyle(color, 0.3 * fade).fillCircle(x, y, 5);
        air
          .fillStyle(lighten(color, 0.5), 0.95 * fade)
          .fillTriangle(
            x + Math.cos(a + 1.57) * 4,
            y + Math.sin(a + 1.57) * 2,
            x - Math.cos(a + 1.57) * 4,
            y - Math.sin(a + 1.57) * 2,
            x + Math.cos(a) * 2,
            y + Math.sin(a) * 1,
          );
      }
    }
    const orb = w.stormOrb;
    if (orb) {
      const o = this.lifted(orb.x, orb.y, 14);
      const fade = Math.min(1, orb.t);
      const color = ELEMENT_COLOR[1];
      air.fillStyle(color, 0.18 * fade).fillCircle(o.x, o.y, 11);
      air.fillStyle(color, 0.5 * fade).fillCircle(o.x, o.y, 6);
      air.fillStyle(0xffffff, 0.95 * fade).fillCircle(o.x, o.y, 2.5);
      for (let i = 0; i < 3; i++) {
        const a = time * 7 + i * 2.1;
        air
          .lineStyle(1, 0xffffff, 0.8 * fade)
          .lineBetween(o.x, o.y, o.x + Math.cos(a) * 10, o.y + Math.sin(a) * 7);
      }
      this.ring(ground, orb.x, orb.y, 0.5, color, 0.35 * fade, 1);
    }
    for (const m of w.markers) {
      const color = this.colorOfSkill(w, m.profile.skill.id);
      const spec = w.char.actives.find((x) => x.skill.id === m.profile.skill.id)?.skill.markers;
      const r = (spec?.radius ?? 1.5) * m.profile.radiusMult;
      const left = spec ? Math.min(1, Math.max(0, m.t / spec.delay)) : 0.5;
      this.ring(ground, m.x, m.y, r, color, 0.5, 1);
      this.ring(ground, m.x, m.y, r * (0.15 + 0.85 * left), color, 0.9, 1.5);
      const c = this.host.project(m.x, m.y);
      air.fillStyle(0xffffff, 0.85).fillCircle(c.x, c.y, 1.8);
    }
    for (const f of w.fuses) {
      const t = this.host.actorById(f.target);
      const x = t && t.alive ? t.x : f.x;
      const y = t && t.alive ? t.y : f.y;
      const o = this.lifted(x, y, 12);
      const blink = 0.55 + 0.45 * Math.sin(time * (6 + 14 / Math.max(0.3, f.t)));
      for (let i = 0; i < Math.min(6, f.arrows.length); i++) {
        const a = i * 2.4;
        air
          .lineStyle(1.5, 0xe8d8b0, 0.9)
          .lineBetween(
            o.x + Math.cos(a) * 2,
            o.y + Math.sin(a) * 2,
            o.x + Math.cos(a) * 7,
            o.y + Math.sin(a) * 6,
          );
      }
      air.fillStyle(ELEMENT_COLOR[3], 0.45 * blink).fillCircle(o.x, o.y, 6);
      air.fillStyle(0xffd080, 0.9 * blink).fillCircle(o.x, o.y, 2);
    }
    for (const s of w.spores) {
      const o = this.host.project(s.x, s.y);
      const pulse = 0.6 + 0.4 * Math.sin(time * 5 + s.x * 3);
      ground.fillStyle(0x000000, 0.3).fillEllipse(o.x, o.y + 1, 10, 4);
      ground.fillStyle(0x6a8a3a, 0.9).fillEllipse(o.x, o.y - 3, 8, 7);
      air.fillStyle(0xa0e060, 0.4 * pulse).fillCircle(o.x, o.y - 4, 5);
    }
    const mi = w.mirage;
    if (mi) {
      const o = this.host.project(mi.x, mi.y);
      const fade = Math.min(1, mi.t);
      ground.fillStyle(0x000000, 0.25 * fade).fillEllipse(o.x, o.y + 1, 12, 5);
      air.fillStyle(0x80c0ff, 0.45 * fade).fillCircle(o.x, o.y - 12, 3.5);
      air.fillStyle(0x80c0ff, 0.35 * fade).fillTriangle(o.x - 5, o.y, o.x + 5, o.y, o.x, o.y - 10);
      air.lineStyle(1, 0xffffff, 0.6 * fade).strokeCircle(o.x, o.y - 12, 3.5);
    }
    for (const id in w.charged) {
      const e = this.host.actorById(Number(id));
      const ch = w.charged[id];
      if (!e || !e.alive) continue;
      const o = this.host.project(e.x, e.y);
      for (let i = 0; i < ch.n; i++)
        air.fillStyle(ELEMENT_COLOR[3], 0.95).fillCircle(o.x - (ch.n - 1) * 3 + i * 6, o.y - 32, 2);
    }
    const sh = w.shell;
    if (sh && p.alive) {
      const flick = 0.7 + 0.3 * Math.sin(time * 6);
      this.disc(ground, p.x, p.y, 0.9, ELEMENT_COLOR[3], 0.12 * flick);
      this.ring(ground, p.x, p.y, 0.9, ELEMENT_COLOR[3], 0.7 * flick, 1.5);
    }
  }

  /**
   * The beams of a draining skill (Drain Trap): from each enemy it holds to the character, a band in the element's colour
   * with a red mote (life) and a blue one (mana) running along it toward the character.
   */
  private siphons(g: Gfx, w: World, time: number): void {
    const p = w.player;
    if (!p.alive) return;
    for (const c of w.char.actives) {
      if (!c.usable || !c.skill.siphon) continue;
      const glow = ELEMENT_COLOR[elementOfTags(c.skill.tags, c.skill.spellDamage)];
      const to = this.lifted(p.x, p.y, 10);
      for (const e of w.actors) {
        if (e.isPlayer || !e.alive || !e.sdots.some((d) => d.src === c.skill.id && d.t > 0))
          continue;
        const from = this.lifted(e.x, e.y, 10);
        const flick = 0.75 + 0.25 * Math.sin(time * 12 + e.id);
        g.lineStyle(10, glow, 0.22 * flick).lineBetween(from.x, from.y, to.x, to.y);
        g.lineStyle(4, glow, 0.65 * flick).lineBetween(from.x, from.y, to.x, to.y);
        g.lineStyle(1, 0xffffff, 0.85 * flick).lineBetween(from.x, from.y, to.x, to.y);
        for (const [color, phase] of [
          [0xff5060, 0],
          [0x60a0ff, 0.5],
        ] as const)
          for (let i = 0; i < 2; i++) {
            const k = (time * 1.4 + phase * 0.5 + i * 0.5 + e.id * 0.13) % 1;
            g.fillStyle(color, 0.95 * Math.sin(k * Math.PI)).fillCircle(
              from.x + (to.x - from.x) * k,
              from.y + (to.y - from.y) * k,
              2.2,
            );
          }
      }
    }
  }

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
