import type Phaser from 'phaser';
import { sidearmSkillId } from '../../../calc/monster';
import {
  BRACE_HALF,
  SANCTUARY_RANGE,
  TYPE_SIDEARMS,
  TYPE_WINDOWS,
  type ProjectileLook,
} from '../../../data/encounters';
import type { Stance } from '../../../data/monsters';
import { ELEMENT_COLOR } from '../../../calc/skillLook';
import type { Actor, GroundEffect, SimEvent, World } from '../../../sim/types';
import type { FxHost } from './skillFx';

/**
 * How the encounters look (docs/ENCOUNTERS.md): the warnings of shaped blasts and the later steps of a pattern, what each
 * does when it lands, and the tells of a monster's window. Every mechanic has a tell on the floor or on the body before it
 * matters, in the colour of the damage it will do (VISUAL_LANGUAGE.md), so a death is never a surprise.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };
type Fx = { t: number; total: number; draw: (g: Gfx, k: number) => void };

/** The colour of a warning, by damage type (physical, lightning, cold, fire, chaos): as the telegraphs of `index.ts`. */
const WARN = [0xe0d0b0, 0xd0b0ff, 0x90d8ff, 0xff9a40, 0xa0e04a];
/** A Brace: polished bronze. */
const BRACE = 0xffc860;
/** A Counter-stance: steel; a Sanctuary: warm light; an Aegis: pale blue; exposed: red; the Rot: green. */
const STEEL = 0xd8e4f0;
const HOLY = 0xffe8a8;
const AEGIS = 0x9ac8ff;
const EXPOSED = 0xff4a3a;
const ROT = 0xa0e04a;

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** The texture a thrown thing flies as. */
export function projectileTexture(look: ProjectileLook): string {
  return `g_p_${look}`;
}

/** Whether a thrown thing turns with its flight (a spear) or tumbles (a boulder). */
export function projectileSpins(look: ProjectileLook): boolean {
  return look === 'boulder' || look === 'gobbet' || look === 'clot' || look === 'spore';
}

/** The pose of a monster that is using its sidearm: a throw, a cast or a lash, instead of its type's own blow. */
export function sidearmStance(a: Actor): Stance | undefined {
  const act = a.action;
  if (!act || !a.mon || act.profile.skill.id !== sidearmSkillId(a.mon.spec.type)) return undefined;
  const s = TYPE_SIDEARMS[a.mon.spec.type];
  if (!s) return undefined;
  return s.stance ?? (s.pattern || s.ring ? 'cast' : s.shape?.id === 'lance' ? 'lash' : 'throw');
}

export class EncounterFx {
  private list: Fx[] = [];
  private host: FxHost;

  constructor(host: FxHost) {
    this.host = host;
  }

  private add(total: number, draw: (g: Gfx, k: number) => void): void {
    if (this.list.length > 120) this.list.shift();
    this.list.push({ t: total, total, draw });
  }

  private pt(x: number, y: number): Pt {
    return this.host.project(x, y);
  }

  // ---- Shapes on the ground ---------------------------------------------------------------------------------------

  private circle(g: Gfx, x: number, y: number, r: number): void {
    const p = this.pt(x, y);
    const rx = this.host.rpx(r);
    g.fillEllipse(p.x, p.y, rx * 2, rx * 2 * this.host.squash());
  }

  private circleLine(g: Gfx, x: number, y: number, r: number): void {
    const p = this.pt(x, y);
    const rx = this.host.rpx(r);
    g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.host.squash());
  }

  /** A ring band between two radii, as quads (a fill cannot have a hole). */
  private annulus(g: Gfx, x: number, y: number, r0: number, r1: number): void {
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      g.fillPoints(
        [
          this.pt(x + Math.cos(a0) * r0, y + Math.sin(a0) * r0),
          this.pt(x + Math.cos(a0) * r1, y + Math.sin(a0) * r1),
          this.pt(x + Math.cos(a1) * r1, y + Math.sin(a1) * r1),
          this.pt(x + Math.cos(a1) * r0, y + Math.sin(a1) * r0),
        ] as Phaser.Math.Vector2[],
        true,
      );
    }
  }

  /** The corners of a lane from (x, y) to (x2, y2), `width` wide, filled from the start to `f` of its length. */
  private laneQuad(e: GroundEffect, f = 1): Pt[] {
    const ang = Math.atan2(e.y2! - e.y, e.x2! - e.x);
    const nx = -Math.sin(ang) * (e.width! / 2);
    const ny = Math.cos(ang) * (e.width! / 2);
    const ex = e.x + (e.x2! - e.x) * f;
    const ey = e.y + (e.y2! - e.y) * f;
    return [
      this.pt(e.x + nx, e.y + ny),
      this.pt(ex + nx, ey + ny),
      this.pt(ex - nx, ey - ny),
      this.pt(e.x - nx, e.y - ny),
    ];
  }

  private wedgePts(e: GroundEffect, f = 1): Pt[] {
    const out = [this.pt(e.x, e.y)];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const a = e.facing! - e.half! + (2 * e.half! * i) / n;
      out.push(this.pt(e.x + Math.cos(a) * e.radius * f, e.y + Math.sin(a) * e.radius * f));
    }
    return out;
  }

  /** The whole area of a blast, filled with the current fill style. */
  private area(g: Gfx, e: GroundEffect, f = 1): void {
    switch (e.shape) {
      case 'lane':
        g.fillPoints(this.laneQuad(e, f) as Phaser.Math.Vector2[], true);
        return;
      case 'wedge':
        g.fillPoints(this.wedgePts(e, f) as Phaser.Math.Vector2[], true);
        return;
      case 'donut':
        this.annulus(g, e.x, e.y, e.inner!, e.inner! + (e.radius - e.inner!) * f);
        return;
      default:
        this.circle(g, e.x, e.y, e.radius * f);
    }
  }

  /** The edge of a blast. */
  private edge(g: Gfx, e: GroundEffect): void {
    switch (e.shape) {
      case 'lane':
        g.strokePoints(this.laneQuad(e) as Phaser.Math.Vector2[], true, true);
        return;
      case 'wedge':
        g.strokePoints(this.wedgePts(e) as Phaser.Math.Vector2[], true, true);
        return;
      case 'donut':
        this.circleLine(g, e.x, e.y, e.inner!);
        this.circleLine(g, e.x, e.y, e.radius);
        return;
      default:
        this.circleLine(g, e.x, e.y, e.radius);
    }
  }

  /**
   * A blast of a pattern: a faint outline while it waits its turn (the player can read the whole pattern), then a warning that
   * fills from its start (a lane from the caster, a ring outward, a circle from its centre) until it lands. A donut keeps its
   * safe middle clear and outlined in white, so where to stand is as plain as where not to.
   */
  drawBlast(g: Gfx, e: GroundEffect, time: number): void {
    const col = WARN[e.dtype] ?? WARN[0];
    if (e.delay !== undefined && e.delay > 0) {
      const a = 0.35 + 0.15 * Math.sin(time * 10 + e.id);
      g.lineStyle(1.5, col, a);
      this.edge(g, e);
      return;
    }
    const k = 1 - e.t / e.total;
    // A dark wash first, so a pale warning still reads on a pale floor.
    g.fillStyle(0x000000, 0.22);
    this.area(g, e);
    g.fillStyle(col, 0.24 + 0.14 * k);
    this.area(g, e);
    g.fillStyle(lighten(col, 0.25), 0.25 + 0.4 * k);
    this.area(g, e, Math.max(0.05, k));
    g.lineStyle(3, 0x000000, 0.45);
    this.edge(g, e);
    g.lineStyle(2, col, 1);
    this.edge(g, e);
    // Runes that turn round the rim of a circle or a ring: the mark of a blast that is coming, as the slams have.
    if (e.shape === 'circle' || e.shape === 'donut') {
      const r = e.shape === 'donut' ? e.radius : e.radius;
      const n = Math.max(8, Math.round(r * 6));
      g.fillStyle(lighten(col, 0.5), 0.95);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + time * 1.6;
        const p = this.pt(e.x + Math.cos(a) * (r - 0.12), e.y + Math.sin(a) * (r - 0.12));
        g.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
    }
    if (e.shape === 'donut') {
      // Where it is safe: a calm white rim and a pulse inside it.
      g.lineStyle(1.5, 0xffffff, 0.75 + 0.25 * Math.sin(time * 12));
      this.circleLine(g, e.x, e.y, e.inner! - 0.08);
    }
    if (e.pull) {
      // A hook: barbs along the lane, pointing back at the caster.
      const ang = Math.atan2(e.y2! - e.y, e.x2! - e.x);
      const len = Math.hypot(e.x2! - e.x, e.y2! - e.y);
      g.lineStyle(1.5, 0xffffff, 0.6 + 0.4 * k);
      for (let d = 1.2; d < len; d += 1.4) {
        const cx = e.x + Math.cos(ang) * d;
        const cy = e.y + Math.sin(ang) * d;
        const tip = this.pt(cx, cy);
        for (const s of [-1, 1]) {
          const b = this.pt(cx + Math.cos(ang + s * 2.5) * 0.4, cy + Math.sin(ang + s * 2.5) * 0.4);
          g.lineBetween(tip.x, tip.y, b.x, b.y);
        }
      }
    }
  }

  /** A blast lands: a flash over the shape it covered, cracks for a physical one, a ring wave for a donut. */
  private landed(e: GroundEffect): void {
    const col = ELEMENT_COLOR[e.dtype] ?? 0xffffff;
    this.add(0.35, (g, k) => {
      const a = 1 - k;
      g.fillStyle(lighten(col, 0.4), 0.45 * a);
      this.area(g, e);
      g.lineStyle(2.5 * a + 0.5, col, a);
      this.edge(g, e);
    });
    if (e.shape === 'lane') {
      const p0 = this.pt(e.x, e.y);
      const p1 = this.pt(e.x2!, e.y2!);
      this.add(0.22, (g, k) => {
        for (const [w, c, al] of [
          [8, col, 0.3],
          [4, lighten(col, 0.3), 0.8],
          [1.5, 0xffffff, 1],
        ] as const) {
          g.lineStyle(w, c, al * (1 - k));
          g.lineBetween(p0.x, p0.y - 4, p1.x, p1.y - 4);
        }
      });
      this.host.em.dust.explode(5, p1.x, p1.y);
    } else {
      const p = this.pt(e.x, e.y);
      this.host.em.dust.explode(e.shape === 'donut' ? 10 : 5, p.x, p.y);
      if (e.radius > 2.5) this.host.shake(2);
    }
  }

  // ---- Windows ----------------------------------------------------------------------------------------------------

  /**
   * A Brace: while it gathers, a thin bronze arc sweeps up in front of the monster; while it holds, a thick bright arc
   * at the front with a ground wedge showing the side it guards, and a glint that runs along the rim.
   */
  private drawBrace(g: Gfx, a: Actor, time: number): void {
    const e = a.enc!;
    const gathering = e.warnT > 0;
    const r = a.r + 0.35;
    const n = 12;
    const k = gathering ? 1 - e.warnT / 0.35 : 1;
    const half = BRACE_HALF * (gathering ? k : 1);
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const ang = a.facing - half + (2 * half * i) / n;
      pts.push(this.pt(a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r));
    }
    if (!gathering) {
      // The guarded side, faint on the floor.
      const wedge: Pt[] = [this.pt(a.x, a.y)];
      for (let i = 0; i <= n; i++) {
        const ang = a.facing - BRACE_HALF + (2 * BRACE_HALF * i) / n;
        wedge.push(this.pt(a.x + Math.cos(ang) * 1.6, a.y + Math.sin(ang) * 1.6));
      }
      g.fillStyle(BRACE, 0.1 + 0.04 * Math.sin(time * 8));
      g.fillPoints(wedge as Phaser.Math.Vector2[], true);
    }
    const lift = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y - h });
    for (const h of gathering ? [6] : [3, 6, 9]) {
      g.lineStyle(gathering ? 1.5 : 2.5, BRACE, gathering ? 0.6 : 0.95);
      g.strokePoints(pts.map((p) => lift(p, h)) as Phaser.Math.Vector2[], false, false);
    }
    if (!gathering) {
      const j = Math.floor(((time * 1.6) % 1) * n);
      const q = lift(pts[j], 6);
      g.fillStyle(0xffffff, 0.95).fillRect(q.x - 1, q.y - 2, 2, 4);
    }
  }

  /**
   * A Counter-stance: a blade raised over the head with a bright edge, and a thin steel wedge on the floor in front showing
   * where a blow will be answered.
   */
  private drawCounter(g: Gfx, a: Actor, time: number): void {
    const e = a.enc!;
    const k = e.warnT > 0 ? 1 - e.warnT / 0.35 : 1;
    const base = this.pt(a.x, a.y);
    const top = { x: base.x + Math.cos(a.facing) * 3, y: base.y - 10 - 10 * k };
    g.lineStyle(3, 0x30343c, 0.9).lineBetween(base.x, base.y - 9, top.x, top.y);
    g.lineStyle(1.5, STEEL, 0.95).lineBetween(base.x, base.y - 9, top.x, top.y);
    if (e.openT > 0) {
      const f = (time * 2.2) % 1;
      const gx = base.x + (top.x - base.x) * f;
      const gy = base.y - 9 + (top.y - base.y + 9) * f;
      g.fillStyle(0xffffff, 1).fillRect(gx - 1, gy - 1, 3, 3);
      const n = 10;
      const wedge: Pt[] = [this.pt(a.x, a.y)];
      for (let i = 0; i <= n; i++) {
        const ang = a.facing - 0.95 + (1.9 * i) / n;
        wedge.push(this.pt(a.x + Math.cos(ang) * 1.8, a.y + Math.sin(ang) * 1.8));
      }
      g.fillStyle(STEEL, 0.12 + 0.05 * Math.sin(time * 10));
      g.fillPoints(wedge as Phaser.Math.Vector2[], true);
      g.lineStyle(1, STEEL, 0.7);
      g.strokePoints(wedge as Phaser.Math.Vector2[], true, true);
    }
  }

  /** A Sanctuary: a ring of warm light on the floor round the singer, its runes turning, and a halo over each ally it shelters. */
  private drawSanctuary(g: Gfx, a: Actor, w: World, time: number): void {
    const e = a.enc!;
    const k = e.warnT > 0 ? 1 - e.warnT / 0.4 : 1;
    const r = SANCTUARY_RANGE * k;
    g.fillStyle(HOLY, 0.16 + 0.05 * Math.sin(time * 5));
    this.circle(g, a.x, a.y, r);
    g.lineStyle(3, HOLY, 1);
    this.circleLine(g, a.x, a.y, r);
    g.lineStyle(1, 0xffffff, 0.5);
    this.circleLine(g, a.x, a.y, r * 0.92);
    const n = 16;
    g.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 - time * 0.9;
      const p = this.pt(a.x + Math.cos(ang) * r * 0.96, a.y + Math.sin(ang) * r * 0.96);
      g.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    if (e.openT <= 0) return;
    for (const o of w.actors) {
      if (!o.alive || o.isPlayer || o === a || Math.hypot(o.x - a.x, o.y - a.y) > SANCTUARY_RANGE)
        continue;
      const p = this.pt(o.x, o.y);
      g.lineStyle(1.5, HOLY, 0.95).strokeEllipse(p.x, p.y - 22, 9, 3.5);
    }
  }

  /** The plates of an Aegis: small shields turning round the Sentinel at chest height. */
  private drawAegis(g: Gfx, a: Actor, time: number): void {
    const n = a.enc!.plates;
    const r = a.r + 0.5;
    for (let i = 0; i < n; i++) {
      const ang = (i / 4) * Math.PI * 2 + time * 1.3;
      const c = this.pt(a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r);
      const y = c.y - 8;
      const pts = [
        { x: c.x, y: y - 4 },
        { x: c.x + 3, y: y - 1 },
        { x: c.x, y: y + 4 },
        { x: c.x - 3, y: y - 1 },
      ];
      g.fillStyle(AEGIS, 0.85).fillPoints(pts as Phaser.Math.Vector2[], true);
      g.lineStyle(1, 0xffffff, 0.9).strokePoints(pts as Phaser.Math.Vector2[], true, true);
    }
  }

  /** The tells of a monster's modes: a broken guard, a stone skin, an open core, a chant, an adaptation. */
  private drawModes(g: Gfx, a: Actor, w: World, time: number): void {
    const e = a.enc!;
    const p = this.pt(a.x, a.y);
    const rx = this.host.rpx(a.r + 0.25);
    const sq = this.host.squash();
    if (e.vulnT > 0) {
      // Exposed: a red ring, broken in four places, that pulses.
      const pulse = 0.6 + 0.4 * Math.sin(time * 14);
      g.lineStyle(2, EXPOSED, pulse);
      for (let i = 0; i < 4; i++) {
        const a0 = (i / 4) * Math.PI * 2 + 0.25;
        g.beginPath();
        for (let s = 0; s <= 6; s++) {
          const ang = a0 + (s / 6) * (Math.PI / 2 - 0.5);
          const x = p.x + Math.cos(ang) * rx;
          const y = p.y + Math.sin(ang) * rx * sq;
          if (s === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokePath();
      }
    }
    if (e.stoneT > 0) {
      // Stone: cracks spread over the ground under it as the burst comes.
      const k = 1 - e.stoneT / 3;
      g.lineStyle(1.5, 0x2a2622, 0.85);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + 0.3;
        const r = rx * (0.6 + 2.2 * k);
        g.lineBetween(p.x, p.y, p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r * sq);
      }
    }
    if (e.ventT > 0) {
      // An open core: a hot disc that throbs, and sparks that rise from it.
      const pulse = 0.5 + 0.5 * Math.sin(time * 18);
      g.fillStyle(0xffd080, 0.35 + 0.25 * pulse).fillEllipse(
        p.x,
        p.y - 10,
        9 + 4 * pulse,
        9 + 4 * pulse,
      );
      g.fillStyle(0xffffff, 0.8).fillEllipse(p.x, p.y - 10, 4, 4);
      if (Math.random() < 0.3) this.host.em.spark.emitParticleAt(p.x, p.y - 10, 1);
    }
    if (e.ritesT > 0) {
      // A chant: green threads from the Hag to each body it will burst.
      g.lineStyle(1.5, ROT, 0.55 + 0.35 * Math.sin(time * 12));
      for (const b of w.effects)
        if (b.owner === a.id && b.label === 'Last rites') {
          const q = this.pt(b.x, b.y);
          g.lineBetween(p.x, p.y - 10, q.x, q.y);
        }
      g.lineStyle(2, ROT, 0.9);
      this.circleLine(g, a.x, a.y, a.r + 0.4 + 0.15 * Math.sin(time * 8));
    }
    if (e.done & 4 && Math.random() < 0.05) this.host.em.smoke.emitParticleAt(p.x, p.y - 10, 1);
    if (a.modIds.includes('adaptive') && a.resShiftT > 0) {
      // Adapted: a ring in the colour of the element it now resists.
      let t = 1;
      for (let i = 2; i < 5; i++) if (a.resShift[i] > a.resShift[t]) t = i;
      g.lineStyle(2, WARN[t], 0.8);
      this.circleLine(g, a.x, a.y, a.r + 0.45);
      g.lineStyle(1, WARN[t], 0.5);
      this.circleLine(g, a.x, a.y, a.r + 0.6 + 0.1 * Math.sin(time * 6));
    }
  }

  // ---- Per frame and events ----------------------------------------------------------------------------------------

  /** Draw the pattern blasts, the windows and the modes; advance the short effects. `dt` keeps the sim's pace. */
  frame(w: World, dt: number, time: number, g: Gfx): void {
    for (const e of w.effects) if (e.shape || e.label) this.drawBlast(g, e, time);
    for (const a of w.actors) {
      if (!a.alive || !a.enc || !a.mon) continue;
      const e = a.enc;
      if (e.warnT > 0 || e.openT > 0) {
        const kind = TYPE_WINDOWS[a.mon.spec.type]?.id;
        if (kind === 'brace') this.drawBrace(g, a, time);
        else if (kind === 'counter') this.drawCounter(g, a, time);
        else if (kind === 'sanctuary') this.drawSanctuary(g, a, w, time);
      }
      if (e.plates > 0) this.drawAegis(g, a, time);
      this.drawModes(g, a, w, time);
    }
    let j = 0;
    for (const f of this.list) {
      f.t -= dt;
      if (f.t <= 0) continue;
      this.list[j++] = f;
      f.draw(g, 1 - f.t / f.total);
    }
    this.list.length = j;
  }

  /** A ring that spreads from a monster, in a mode's colour. */
  private pulse(a: Actor, color: number, r1 = 1.6): void {
    const x = a.x;
    const y = a.y;
    this.add(0.4, (g, k) => {
      g.lineStyle(2.5 * (1 - k) + 0.5, color, 1 - k);
      this.circleLine(g, x, y, 0.3 + r1 * k);
    });
  }

  private say(a: Actor, text: string, color: number): void {
    const p = this.pt(a.x, a.y);
    this.host.floater?.(p.x, p.y - 22, text, color, false);
  }

  onEvent(e: SimEvent, w: World): void {
    switch (e.t) {
      case 'blast':
        this.landed(e.e);
        break;
      case 'window': {
        const a = this.host.actorById(e.id);
        if (!a) break;
        const p = this.pt(a.x, a.y);
        const em = this.host.em;
        switch (e.kind) {
          case 'brace':
          case 'counter':
            em.spark.explode(4, p.x, p.y - 8);
            break;
          case 'sanctuary':
            this.pulse(a, HOLY, SANCTUARY_RANGE);
            break;
          case 'plate':
            em.spark.explode(6, p.x, p.y - 8);
            this.pulse(a, AEGIS, 0.8);
            break;
          case 'aegis':
            this.pulse(a, AEGIS, 1.2);
            break;
          case 'broken':
            this.pulse(a, EXPOSED, 1.4);
            this.say(a, 'Guard broken', EXPOSED);
            break;
          case 'fade':
            em.smoke.explode(8, p.x, p.y - 8);
            this.pulse(a, 0x9a7ad8, 1);
            break;
          case 'petrify':
            em.dust.explode(10, p.x, p.y - 4);
            this.say(a, 'Petrified', 0xb0a898);
            break;
          case 'vent':
            this.host.flash(p.x, p.y - 10, 0xffa040, 1.2, 0.3);
            this.say(a, 'Core open', 0xffb060);
            break;
          case 'quench':
            em.smoke.explode(14, p.x, p.y - 8);
            this.say(a, 'Quenched', 0x9ad8ff);
            break;
          case 'gorged':
            em.poison.explode(10, p.x, p.y - 8);
            this.pulse(a, ROT, 1);
            break;
          case 'rites':
            this.pulse(a, ROT, 2.5);
            this.say(a, 'Last rites', ROT);
            break;
          case 'ritesBroken':
            this.say(a, 'Silenced', 0xd0d0d0);
            break;
          case 'grief':
            this.pulse(a, 0x9ad8ff, 2);
            break;
          case 'riled':
            this.host.flash(p.x, p.y - 8, EXPOSED, 1, 0.2);
            this.say(a, 'Riled', EXPOSED);
            break;
          case 'molten':
            em.flame.explode(10, p.x, p.y - 8);
            break;
          default:
            if (e.kind.startsWith('adapt')) {
              const t = Number(e.kind.slice(5));
              this.pulse(a, WARN[t] ?? 0xffffff, 1.2);
              this.say(a, 'Adapts', WARN[t] ?? 0xffffff);
            } else em.spark.explode(4, p.x, p.y - 8);
        }
        break;
      }
      case 'block': {
        // A blow turned by a Brace rings on the shield.
        const a = this.host.actorById(e.dst);
        if (!a?.enc || a.enc.openT <= 0) break;
        const p = this.pt(a.x + Math.cos(a.facing) * 0.5, a.y + Math.sin(a.facing) * 0.5);
        this.host.flash(p.x, p.y - 6, BRACE, 0.8, 0.12);
        this.add(0.25, (g, k) => {
          g.lineStyle(2, BRACE, 1 - k);
          g.strokeEllipse(p.x, p.y - 6, 6 + 10 * k, 4 + 6 * k);
        });
        break;
      }
      default:
        break;
    }
    void w;
  }
}

/**
 * How a monster's sprite is changed by its modes: grey stone, a quenched blue-grey, a swollen green, a molten glow (and
 * bigger with each stack). Absent fields leave the sprite as it is.
 */
export function encounterSprite(a: Actor): { tint?: number; scale?: number; fill?: boolean } {
  const e = a.enc;
  if (!e) return {};
  // Stone is a flat grey silhouette: a statue, not a tint.
  if (e.stoneT > 0) return { tint: 0x9aa2ae, fill: true };
  if (e.gorgedT > 0) return { tint: 0xc8f0a0, scale: 1.2 };
  if (e.molten > 0) return { tint: 0xffe0b0, scale: 1 + 0.08 * e.molten };
  if (e.done & 4) return { tint: 0xa8c0d0 };
  return {};
}
