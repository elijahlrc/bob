import type Phaser from 'phaser';
import { ELEMENT_COLOR } from '../../../calc/skillLook';
import { HIT_AT } from '../../../data/constants';
import { PATTERNS } from '../../../data/encounters';
import { MONSTER_TYPES } from '../../../data/monsters';
import { LEAP_SPEED } from '../../../sim/abilities';
import type { Actor, GroundEffect, SimEvent, World } from '../../../sim/types';
import { sidearmStance } from './encounterFx';
import type { FxHost } from './skillFx';

/**
 * What a monster sends and where it goes (docs/VISUAL_LANGUAGE.md, "Projectiles"). Several monster attacks are one event in the sim
 * (a lob bursts at the aim point, a pattern's blasts and a lane land at once, a lance hits its whole line, a leap slides): the
 * words say a thing is thrown, shot or lunged, so the renderer draws the body that does it during the wind-up the sim already has,
 * and it arrives as the sim's blow lands. Nothing here decides a hit, and nothing is read from the sim that it does not already keep.
 *
 *  - a **lob** (spitter, hag, spinner, pyre priest and the sidearms of the same shape): a glob or an orb that arcs from the
 *    caster to the aim point between the moment the aim is fixed and the moment the burst lands;
 *  - a **mortar** blast: a shell that falls onto each spot in the last stretch of its warning;
 *  - a **loosing call** lane: a volley of arrows that crosses the lane from the archer and sticks in the ground at its end;
 *  - a **flurry** lane: the duellist's lunge as ghosts of him along the lane;
 *  - a **lance or a beam**: a bolt, a lash, an eye-beam or a hook by what fires it, in the colour of its damage (lightning keeps the
 *    jagged bolt);
 *  - a **leap**: the figure rises and falls over the slide (its shadow stays on the floor).
 *
 * Every body wears the monsters' red rim, as `ProjectileFx` does for their projectiles.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };
type Timed = { t: number; total: number; draw: (k: number) => void };

const RIM = 0xff4a3a;
const DARK = 0x3a0808;
const STEEL = 0xd8e4f0;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

// ---- What each body does, as numbers (pure, tested) --------------------------------------------------------------------

/** Pixels a thrown thing leaves the hand at. */
export const LOB_HAND = 12;
/** Share of the wind-up at which a throw is released when the skill does not fix its aim (it is released as the aim is fixed). */
const LOB_RELEASE = 0.3;

/** The height of a lob at `u` (0 to 1 of its way), in pixels: from the hand, over an arch that grows with the throw, to the ground. */
export function lobHeight(u: number, tiles: number): number {
  const peak = clamp(tiles * 4, 12, 34);
  return LOB_HAND * (1 - u) + 4 * u * (1 - u) * peak;
}

/** What a monster's lob needs to be drawn now: the throw from where it stands to where it will land, and how far along it is. */
export type Lob = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  u: number;
  dtype: number;
  spell: boolean;
  zone: 'caustic' | 'burning' | 'chilling' | 'shocking';
};

/** The damage type of the biggest chunk of a hit (as the telegraphs colour a warning). */
function dominantType(p: { hands: { chunks: { type: number; max: number }[] }[] }): number {
  let dtype = 0;
  let best = -1;
  for (const c of p.hands[0]?.chunks ?? [])
    if (c.max > best) {
      best = c.max;
      dtype = c.type;
    }
  return dtype;
}

/**
 * The lob a monster is winding up, or null. A lob is a burst at the place it aims (not around itself: that is a nova) that leaves a
 * zone where it lands (a slam leaves none). It leaves the hand when the aim is fixed, which the warning ring already shows, and lands
 * when the sim's burst fires (`HIT_AT` of the use), so the body arrives with the blast.
 */
export function lobOf(a: Actor): Lob | null {
  const act = a.action;
  if (a.isPlayer || !a.alive || !act || act.fired || act.which !== 'monster') return null;
  const b = act.profile.skill.behaviour;
  if (b.kind !== 'burst' || b.origin !== 'target' || !b.zone) return null;
  const land = HIT_AT * act.duration;
  const release = Math.min(act.profile.skill.lockAim ?? LOB_RELEASE, HIT_AT - 0.1) * act.duration;
  if (act.elapsed < release) return null;
  return {
    sx: a.x,
    sy: a.y,
    tx: act.aimX,
    ty: act.aimY,
    u: clamp((act.elapsed - release) / Math.max(0.05, land - release), 0, 1),
    dtype: dominantType(act.profile),
    spell: act.profile.skill.type === 'spell',
    zone: b.zone.kind,
  };
}

/** The colour of a lob: its damage, or for a web, a net or burrs (physical, slowing) a pale one. */
export function lobColor(dtype: number, zone: Lob['zone']): number {
  if (dtype === 0 && zone === 'chilling') return 0xdce8f0;
  return ELEMENT_COLOR[dtype] ?? ELEMENT_COLOR[0];
}

/** Seconds before a mortar blast lands that its shell is in the air. */
export const MORTAR_FALL = 0.45;
/** Pixels over the ground a mortar shell starts from. */
export const MORTAR_HEIGHT = 120;

/** How far a mortar shell has come (0 just above, 1 on the ground), or null when it is not falling. */
export function mortarProgress(
  e: Pick<GroundEffect, 't' | 'delay' | 'shape' | 'label'>,
): number | null {
  if (e.label !== PATTERNS.mortar.name || (e.shape && e.shape !== 'circle')) return null;
  if (e.delay !== undefined && e.delay > 0) return null;
  if (e.t <= 0 || e.t > MORTAR_FALL) return null;
  return 1 - e.t / MORTAR_FALL;
}

/** The height of a falling shell: slow at first, quick at the end (it falls). */
export const fallHeight = (u: number): number => MORTAR_HEIGHT * (1 - u * u);

/** The volley of a loosing call: how many arrows, how long each is on the way, and how far apart in time they arrive. */
export const VOLLEY_ARROWS = 4;
export const VOLLEY_CROSS = 0.26;
export const VOLLEY_GAP = 0.04;

/**
 * Where arrow `i` of a volley is along its lane (0 at the archer, 1 at the end of the lane) when the lane has `left` seconds to
 * land. The last arrow arrives as the lane lands; the others a little before, and wait in the ground. Null before it is loosed.
 */
export function volleyArrow(i: number, left: number): number | null {
  const arrives = (VOLLEY_ARROWS - 1 - i) * VOLLEY_GAP;
  const f = 1 - (left - arrives) / VOLLEY_CROSS;
  return f <= 0 ? null : Math.min(1, f);
}

/** The duellist's lunge: seconds before the lanes land that he crosses them. */
export const FLURRY_CROSS = 0.24;
export const FLURRY_LABEL = 'Flurry';
/** Where the head of his lunge is along a lane (0 at him, 1 at its end) with `left` seconds to land; null before it starts. */
export function lungeHead(left: number): number | null {
  const f = 1 - left / FLURRY_CROSS;
  if (f <= 0) return null;
  const u = Math.min(1, f);
  // Quick off the mark, then easing into the end.
  return 1 - (1 - u) * (1 - u);
}

/** The height of a leaper over the ground, in pixels, `u` of the way along a leap of `tiles`. */
export function leapHeight(u: number, tiles: number): number {
  return Math.sin(Math.PI * clamp(u, 0, 1)) * clamp(tiles * 2.4, 7, 22);
}

/** What a lance or a beam of a monster is, by what fires it. */
export type BeamBody = 'bolt' | 'lash' | 'eye' | 'hook';

/** The body of a monster's lance: a crossbow's bolt, a lash, a spell's eye-beam, or a hook on a chain. Null for lightning (the jagged bolt). */
export function beamBodyOf(caster: Actor | undefined, dtype: number): BeamBody | null {
  if (dtype === 1) return null;
  if (!caster?.mon) return 'eye';
  if (caster.action?.profile.skill.pull) return 'hook';
  if (sidearmStance(caster) === 'lash') return 'lash';
  return MONSTER_TYPES[caster.mon.spec.type].attack === 'projectile' ? 'bolt' : 'eye';
}

// ---- The drawing ---------------------------------------------------------------------------------------------------------

export class MonsterFlightFx {
  private body: Gfx;
  private glow: Gfx;
  private dirty = false;
  private list: Timed[] = [];
  /** The length of the leap each monster is in, tiles, from the first frame it was seen in it. */
  private leaps = new Map<number, number>();
  private host: FxHost;

  constructor(host: FxHost, scene: Phaser.Scene) {
    this.host = host;
    this.body = scene.add.graphics().setDepth(80001);
    this.glow = scene.add.graphics().setDepth(79998).setBlendMode(1);
  }

  /** The graphics objects, for the style to own (and destroy with the map). */
  objects(): Gfx[] {
    return [this.body, this.glow];
  }

  private at(x: number, y: number, z: number): Pt {
    const q = this.host.project(x, y);
    return { x: q.x, y: q.y - z };
  }

  private add(total: number, draw: (k: number) => void): void {
    if (this.list.length > 60) this.list.shift();
    this.list.push({ t: total, total, draw });
  }

  /** Draw what is in the air now. `dt` keeps the sim's pace. */
  frame(w: World, dt: number, time: number): void {
    if (this.dirty) {
      this.body.clear();
      this.glow.clear();
      this.dirty = false;
    }
    for (const a of w.actors) {
      const lob = a.action ? lobOf(a) : null;
      if (lob) this.drawLob(lob, time, a.id);
    }
    for (const e of w.effects) {
      if (!e.label) continue;
      const fall = mortarProgress(e);
      if (fall !== null) this.drawShell(e, fall);
      else if (e.shape === 'lane' && e.x2 !== undefined && e.y2 !== undefined) {
        if (e.label === PATTERNS.volley.name) this.drawVolley(e);
        else if (e.label === FLURRY_LABEL) this.drawLunge(e);
      }
    }
    let j = 0;
    for (const f of this.list) {
      f.t -= dt;
      if (f.t <= 0) continue;
      this.list[j++] = f;
      f.draw(1 - f.t / f.total);
    }
    this.list.length = j;
    if (j > 0) this.dirty = true;
  }

  // ---- Lobs and shells --------------------------------------------------------------------------------------------------

  /** A shadow on the ground under a flight. */
  private shadow(x: number, y: number, lift: number, color: number, size = 1): void {
    const q = this.host.project(x, y);
    const s = Math.max(0.5, 1 - lift / 60) * size;
    this.body.fillStyle(0x000000, 0.32 * s).fillEllipse(q.x, q.y + 1, 7 * s, 3 * s);
    this.glow.fillStyle(color, 0.2 * s).fillEllipse(q.x, q.y + 1, 11 * s, 4.5 * s);
  }

  /** A glob (a thrown thing: a lump that tumbles) or an orb (a spell) in a dark rim with the monsters' red. */
  private blob(h: Pt, r: number, color: number, spell: boolean, time: number, phase: number): void {
    const b = this.body;
    const light = lighten(color, 0.45);
    this.glow.fillStyle(color, 0.28).fillCircle(h.x, h.y, r * 2.4);
    b.lineStyle(1.2, RIM, 0.9).strokeCircle(h.x, h.y, r + 2.2);
    b.fillStyle(DARK, 0.9).fillCircle(h.x, h.y, r + 1.4);
    b.fillStyle(color, 1).fillCircle(h.x, h.y, r);
    if (spell) {
      b.fillStyle(light, 1).fillCircle(h.x - r * 0.15, h.y - r * 0.15, r * 0.65);
      b.fillStyle(0xffffff, 1).fillCircle(h.x - r * 0.2, h.y - r * 0.2, r * 0.3);
      return;
    }
    const a = time * 10 + phase;
    b.fillStyle(light, 1).fillCircle(
      h.x + Math.cos(a) * r * 0.5,
      h.y + Math.sin(a) * r * 0.5,
      r * 0.55,
    );
    b.fillStyle(0xffffff, 0.9).fillCircle(h.x - r * 0.3, h.y - r * 0.35, r * 0.22);
  }

  private drawLob(l: Lob, time: number, id: number): void {
    this.dirty = true;
    const color = lobColor(l.dtype, l.zone);
    const tiles = Math.hypot(l.tx - l.sx, l.ty - l.sy);
    const at = (u: number) => {
      const x = l.sx + (l.tx - l.sx) * u;
      const y = l.sy + (l.ty - l.sy) * u;
      return { x, y, p: this.at(x, y, lobHeight(u, tiles)) };
    };
    // The trail: the last stretch of the arc, tapering to the head.
    const n = 6;
    let prev = at(Math.max(0, l.u - 0.035 * n)).p;
    for (let i = n - 1; i >= 0; i--) {
      const q = at(Math.max(0, l.u - 0.035 * i)).p;
      const f = (n - i) / n;
      this.glow.lineStyle(5 * f, color, 0.5 * f).lineBetween(prev.x, prev.y, q.x, q.y);
      prev = q;
    }
    const head = at(l.u);
    this.shadow(head.x, head.y, lobHeight(l.u, tiles), color);
    this.blob(head.p, l.spell ? 3.8 : 3.4, color, l.spell, time, id);
  }

  private drawShell(e: GroundEffect, u: number): void {
    this.dirty = true;
    const color = ELEMENT_COLOR[e.dtype] ?? ELEMENT_COLOR[0];
    const ground = this.host.project(e.x, e.y);
    const z = fallHeight(u);
    const head = { x: ground.x - (1 - u) * 4, y: ground.y - 4 - z };
    // The shadow grows as it comes down, so the spot it will hit is told before it does.
    this.shadow(e.x, e.y, z * 0.5, color, 0.5 + 0.7 * u);
    const tail = { x: head.x - 2.5, y: head.y - 10 - 18 * (1 - u) };
    this.glow.lineStyle(4, color, 0.45).lineBetween(tail.x, tail.y, head.x, head.y);
    this.glow.lineStyle(1.5, 0xffffff, 0.5).lineBetween(tail.x, tail.y, head.x, head.y);
    this.blob(head, 3.2, color, false, u * 0.4, e.id);
  }

  // ---- A volley and a lunge --------------------------------------------------------------------------------------------

  private arrow(h: Pt, dx: number, dy: number, color: number, alpha = 1): void {
    const len = 11;
    const t = { x: h.x - dx * len, y: h.y - dy * len };
    const px = -dy;
    const py = dx;
    const g = this.body;
    g.lineStyle(3.4, 0x7a1010, 0.85 * alpha).lineBetween(t.x, t.y, h.x, h.y);
    g.lineStyle(1.8, 0xb8a888, alpha).lineBetween(t.x, t.y, h.x, h.y);
    g.lineStyle(0.9, 0xf0e6cc, alpha).lineBetween(t.x, t.y, h.x, h.y);
    g.fillStyle(0xff4a3a, 0.9 * alpha).fillTriangle(
      h.x + dx * 4.6,
      h.y + dy * 4.6,
      h.x - dx + px * 2.6,
      h.y - dy + py * 2.6,
      h.x - dx - px * 2.6,
      h.y - dy - py * 2.6,
    );
    g.fillStyle(0xffffff, alpha).fillTriangle(
      h.x + dx * 3.6,
      h.y + dy * 3.6,
      h.x - dx * 0.6 + px * 1.6,
      h.y - dy * 0.6 + py * 1.6,
      h.x - dx * 0.6 - px * 1.6,
      h.y - dy * 0.6 - py * 1.6,
    );
    g.lineStyle(1, 0xf0e6cc, 0.9 * alpha)
      .lineBetween(t.x, t.y, t.x + dx * 2.5 + px * 2, t.y + dy * 2.5 + py * 2)
      .lineBetween(t.x, t.y, t.x + dx * 2.5 - px * 2, t.y + dy * 2.5 - py * 2);
    this.glow.fillStyle(color, 0.3 * alpha).fillCircle(h.x, h.y, 4);
  }

  /** A volley crosses the lane from the archer; each arrow stands in the ground at the lane's end until the lane lands. */
  private drawVolley(e: GroundEffect): void {
    const ang = Math.atan2(e.y2! - e.y, e.x2! - e.x);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const wide = (e.width ?? 0.8) * 0.8;
    for (let i = 0; i < VOLLEY_ARROWS; i++) {
      const f = volleyArrow(i, e.t);
      if (f === null) continue;
      this.dirty = true;
      const side = ((i + 0.5) / VOLLEY_ARROWS - 0.5) * wide;
      const x = e.x + (e.x2! - e.x) * f + nx * side;
      const y = e.y + (e.y2! - e.y) * f + ny * side;
      const z = 10 * (1 - f) + 2;
      const head = this.at(x, y, z);
      const back = this.at(x - Math.cos(ang) * 0.1, y - Math.sin(ang) * 0.1, z);
      let dx = head.x - back.x;
      let dy = head.y - back.y;
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl;
      dy /= dl;
      if (f < 1) {
        this.shadow(x, y, z, 0xb8a888, 0.7);
        this.arrow(head, dx, dy, 0xb8a888);
      } else {
        // In the ground: the shaft stands out of it at a slant and shivers.
        const q = this.at(x, y, 0);
        this.arrow({ x: q.x, y: q.y - 4 }, dx * 0.4, -0.9, 0xb8a888, 0.9);
      }
    }
  }

  /** The duellist's lunge: his ghosts run down each lane and a streak is left behind them. */
  private drawLunge(e: GroundEffect): void {
    const head = lungeHead(e.t);
    if (head === null) return;
    this.dirty = true;
    const ang = Math.atan2(e.y2! - e.y, e.x2! - e.x);
    const px = (f: number) => this.at(e.x + (e.x2! - e.x) * f, e.y + (e.y2! - e.y) * f, 0);
    const a = px(0);
    const b = px(head);
    this.glow.lineStyle(7, STEEL, 0.25).lineBetween(a.x, a.y - 8, b.x, b.y - 8);
    this.body.lineStyle(1.5, 0xffffff, 0.7).lineBetween(a.x, a.y - 8, b.x, b.y - 8);
    for (let i = 3; i >= 0; i--) {
      const f = head - i * 0.07;
      if (f < 0) continue;
      const p = px(f);
      const fade = 1 - i * 0.22;
      this.ghost(p, ang, fade * (i === 0 ? 0.95 : 0.55));
    }
  }

  /** A slim figure caught mid-lunge: a leaning cloak, a head, and the blade thrust ahead of it. */
  private ghost(p: Pt, ang: number, alpha: number): void {
    const dir = this.at(Math.cos(ang), Math.sin(ang), 0);
    const base = this.at(0, 0, 0);
    let dx = dir.x - base.x;
    let dy = dir.y - base.y;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    const g = this.body;
    const lean = dx * 4;
    g.fillStyle(0x1c2430, 0.8 * alpha).fillTriangle(
      p.x + lean,
      p.y - 26,
      p.x - 6,
      p.y - 1,
      p.x + 6,
      p.y - 1,
    );
    g.fillStyle(STEEL, 0.55 * alpha).fillTriangle(
      p.x + lean,
      p.y - 26,
      p.x - 2,
      p.y - 1,
      p.x + 3,
      p.y - 1,
    );
    g.fillStyle(0x1c2430, 0.85 * alpha).fillCircle(p.x + lean, p.y - 29, 3.2);
    g.lineStyle(2.4, RIM, 0.5 * alpha).lineBetween(
      p.x + lean,
      p.y - 20,
      p.x + dx * 15,
      p.y - 20 + dy * 15 * 0.5,
    );
    g.lineStyle(1.2, 0xffffff, 0.95 * alpha).lineBetween(
      p.x + lean,
      p.y - 20,
      p.x + dx * 15,
      p.y - 20 + dy * 15 * 0.5,
    );
  }

  // ---- Lances and beams ---------------------------------------------------------------------------------------------

  /**
   * A monster's lance or beam fired: a body drawn along its line by what fires it. Returns whether it took the event (a lightning
   * lance is left to the jagged bolt). A beam with a skill is a character's, and the storm herald's strike has no width.
   */
  onBeam(e: Extract<SimEvent, { t: 'beam' }>, w: World): boolean {
    if (e.skill || !e.width) return false;
    const caster = w.actors.find((a) => !a.isPlayer && a.x === e.x && a.y === e.y && a.mon);
    const kind = beamBodyOf(caster, e.dtype);
    if (!kind) return false;
    const color = ELEMENT_COLOR[e.dtype] ?? ELEMENT_COLOR[0];
    const ang = Math.atan2(e.y2 - e.y, e.x2 - e.x);
    const len = Math.hypot(e.x2 - e.x, e.y2 - e.y);
    const along = (f: number, side = 0, z = 12): Pt =>
      this.at(
        e.x + Math.cos(ang) * len * f - Math.sin(ang) * side,
        e.y + Math.sin(ang) * len * f + Math.cos(ang) * side,
        z * (1 - 0.6 * f),
      );
    switch (kind) {
      case 'bolt':
        this.add(0.3, (k) => this.drawBolt(along, ang, color, e.dtype === 0, k));
        break;
      case 'lash':
        this.add(0.28, (k) => this.drawLash(along, len, color, e.dtype === 0, k));
        break;
      case 'hook':
        this.add(0.5, (k) => this.drawHook(along, len, color, k));
        break;
      default:
        this.add(0.3, (k) => this.drawEye(along, e.width!, color, k));
    }
    return true;
  }

  /** A crossbow's bolt: a quarrel that crosses the line in a few frames and leaves a thin bar that fades. */
  private drawBolt(
    along: (f: number, s?: number, z?: number) => Pt,
    ang: number,
    color: number,
    phys: boolean,
    k: number,
  ): void {
    this.dirty = true;
    const fly = 0.4;
    const f = Math.min(1, k / fly);
    const tail = along(Math.max(0, f - 0.3));
    const head = along(f);
    const col = phys ? 0xd8cdb8 : color;
    const bar = 1 - Math.max(0, (k - fly) / (1 - fly));
    const from = along(0);
    const to = along(1);
    this.glow.lineStyle(5, col, 0.35 * bar).lineBetween(from.x, from.y, to.x, to.y);
    this.body.lineStyle(1.2, 0xffffff, 0.6 * bar).lineBetween(from.x, from.y, to.x, to.y);
    this.body.lineStyle(3.6, DARK, 0.9).lineBetween(tail.x, tail.y, head.x, head.y);
    this.body.lineStyle(2, col, 1).lineBetween(tail.x, tail.y, head.x, head.y);
    let dx = head.x - tail.x;
    let dy = head.y - tail.y;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    this.body
      .fillStyle(RIM, 0.95)
      .fillTriangle(
        head.x + dx * 5,
        head.y + dy * 5,
        head.x - dy * 2.6,
        head.y + dx * 2.6,
        head.x + dy * 2.6,
        head.y - dx * 2.6,
      );
    this.glow.fillStyle(col, 0.5).fillCircle(head.x, head.y, 5);
    void ang;
  }

  /** A lash: a long cord that whips out along the line in a wave, cracks at its end, and falls back. */
  private drawLash(
    along: (f: number, s?: number, z?: number) => Pt,
    len: number,
    color: number,
    phys: boolean,
    k: number,
  ): void {
    this.dirty = true;
    const out = 0.4;
    const reach = k < out ? k / out : 1;
    const slack = k < out ? 0 : (k - out) / (1 - out);
    const n = 14;
    const amp = (1.1 - 0.9 * Math.min(1, k / out)) * 0.5 * (1 - slack);
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const s = (i / n) * reach;
      const wave = Math.sin(s * 9 - k * 22) * amp * Math.sin(Math.PI * (i / n)) * (1 + 0.15 * len);
      pts.push(along(s * (1 - 0.35 * slack), wave));
    }
    const col = phys ? 0xb0875a : color;
    for (const [w, c, a] of [
      [4, DARK, 0.9],
      [2.4, col, 1],
      [1, lighten(col, 0.6), 0.95],
    ] as const) {
      this.body.lineStyle(w, c, a);
      for (let i = 1; i < pts.length; i++)
        this.body.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
    const tip = pts[pts.length - 1];
    if (k >= out * 0.9 && k < out * 2) {
      const f = 1 - (k - out * 0.9) / (out * 1.1);
      this.glow.fillStyle(0xffffff, 0.8 * f).fillCircle(tip.x, tip.y, 5 * f + 1);
      this.body.lineStyle(1.2, RIM, f);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        this.body.lineBetween(
          tip.x,
          tip.y,
          tip.x + Math.cos(a) * 7 * f,
          tip.y + Math.sin(a) * 4 * f,
        );
      }
    }
  }

  /** A watcher's eye-beam: a straight bar of its damage's colour with a white core, a flare at the eye and a splash at the end. */
  private drawEye(
    along: (f: number, s?: number, z?: number) => Pt,
    width: number,
    color: number,
    k: number,
  ): void {
    this.dirty = true;
    const fade = 1 - k * k;
    const half = (width / 2) * (1 - 0.5 * k);
    const a = along(0, half);
    const b = along(1, half);
    const c = along(1, -half);
    const d = along(0, -half);
    this.glow.fillStyle(color, 0.4 * fade).fillPoints([a, b, c, d] as Phaser.Math.Vector2[], true);
    const m0 = along(0);
    const m1 = along(1);
    this.glow.lineStyle(6 * fade, color, 0.5).lineBetween(m0.x, m0.y, m1.x, m1.y);
    this.body
      .lineStyle(2.2 * fade + 0.4, 0xffffff, 0.95 * fade)
      .lineBetween(m0.x, m0.y, m1.x, m1.y);
    this.body
      .lineStyle(1, RIM, 0.8 * fade)
      .lineBetween(a.x, a.y, b.x, b.y)
      .lineBetween(d.x, d.y, c.x, c.y);
    this.glow.fillStyle(color, 0.6 * fade).fillCircle(m0.x, m0.y, 8 * fade + 2);
    this.glow.fillStyle(0xffffff, 0.8 * fade).fillCircle(m0.x, m0.y, 3 * fade + 1);
    this.glow.fillStyle(color, 0.45 * fade).fillCircle(m1.x, m1.y, 9 * k + 3);
  }

  /** A hook on a chain: it shoots out along the line, then the chain draws back in (the pull the sim gives). */
  private drawHook(
    along: (f: number, s?: number, z?: number) => Pt,
    len: number,
    color: number,
    k: number,
  ): void {
    this.dirty = true;
    const f = k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7;
    const links = Math.max(3, Math.round(len * f * 1.6));
    for (let i = 1; i <= links; i++) {
      const p = along((i / links) * f);
      this.body.fillStyle(DARK, 0.9).fillEllipse(p.x, p.y, 4.4, i % 2 ? 2.6 : 3.4);
      this.body.fillStyle(lighten(color, 0.2), 1).fillEllipse(p.x, p.y, 3, i % 2 ? 1.4 : 2.2);
    }
    const tip = along(f);
    const back = along(Math.max(0, f - 0.06));
    let dx = tip.x - back.x;
    let dy = tip.y - back.y;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    // The hook: a barb that curls back from the tip.
    this.body.lineStyle(3.4, DARK, 0.95);
    this.body.lineBetween(tip.x, tip.y, tip.x + dx * 4 - dy * 4, tip.y + dy * 4 + dx * 4);
    this.body.lineStyle(1.8, 0xe8f0f8, 1);
    this.body.lineBetween(tip.x, tip.y, tip.x + dx * 4 - dy * 4, tip.y + dy * 4 + dx * 4);
    this.body.lineBetween(tip.x + dx * 5, tip.y + dy * 5, tip.x - dx * 2, tip.y - dy * 2);
    this.body.lineStyle(1, RIM, 0.9).strokeCircle(tip.x, tip.y, 3.4);
    this.glow.fillStyle(color, 0.45).fillCircle(tip.x, tip.y, 6);
  }

  // ---- Leaps --------------------------------------------------------------------------------------------------------------

  /**
   * How many pixels a leaping monster is lifted over the ground now (zero when it is not in a leap). The sim slides it over the
   * floor at a steady pace; the picture rises and falls over the same stretch (`stop`: tiles before the end of it that it halts, on contact). A charge is a run, not a leap, and does not lift.
   */
  leapLift(a: Actor, stop = 0): number {
    if (a.isPlayer || a.dash.t <= 0 || a.dash.v !== LEAP_SPEED) {
      if (this.leaps.size > 0) this.leaps.delete(a.id);
      return 0;
    }
    // The sim ends a leap when the leaper reaches the character (`stop` tiles short of the spot it aimed at), so the picture lands there.
    const left = Math.max(0, Math.hypot(a.dash.x - a.x, a.dash.y - a.y) - stop);
    let total = this.leaps.get(a.id);
    if (total === undefined) {
      total = Math.max(0.1, left);
      this.leaps.set(a.id, total);
    }
    return leapHeight(1 - left / total, total);
  }
}
