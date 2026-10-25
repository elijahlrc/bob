import type Phaser from 'phaser';
import { PYLON_RANGE, RIME_AURA_RANGE, TYPE_ABILITIES } from '../../../data/abilities';
import type { FlaskKind } from '../../../data/flasks';
import { ELEMENT_COLOR } from '../../../calc/skillLook';
import { TREASURER_RANGE } from '../../../sim/factions';
import type { Actor, SimEvent, World } from '../../../sim/types';
import {
  BUFF_COLOR,
  CURL_COLOR,
  FERVOUR_COLOR,
  immuneElement,
  PYLON_COLOR,
  TWIN_COLOR,
  WARD_COLOR,
  ZEAL_COLOR,
} from '../../style/stateMarks';
import type { FxHost } from './skillFx';

/**
 * What monsters do to each other and to the character that is not an attack (docs/VFX-AUDIT.md, pass 5): a Choirmaster's heal
 * gathering and landing, the buffs of the Choir and of a pack, a pylon's protection, a curled beetle, a ward, a Mirrored pair,
 * a Reliquarian's immunity, a Carrion Mother's pools opening, a hex being cast, a thief's flask, and the zones of a Bursar and
 * a Rime Aura. The language is the one of the other tells: a ring on the ground is a reach (drawn lightly, and only while it
 * matters or the monster is near the character), a mote is a gain, a pip over the head is a state (`stateMarks.ts`).
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };
type Fx = { t: number; total: number; air: boolean; draw: (g: Gfx, k: number) => void };

/** Green: life given back. */
const HEAL = 0x7ae88a;
/** The zone in which nothing recovers. */
const SUPPRESS = 0xb08ae0;
/** A Rime Aura. */
const RIME = 0xa8f4ff;
/** A Carrion Mother's pools. */
const ROT = 0xa0e04a;
/** A hex's kind: its colour, so the four read apart (they stay in the violet-to-red family of a monster's curse). */
export const HEX_TINT: Record<string, number> = {
  brittleDoom: 0xe0c898,
  leadenLimbs: 0x88aee8,
  feebleGrip: 0xc898f4,
  openWounds: 0xff6272,
};
const HEX_DEFAULT = 0xc090ff;
const FLASK_TINT: Record<FlaskKind, number> = {
  life: 0xe04040,
  mana: 0x4a78ff,
  hybrid: 0xc060c0,
  utility: 0xffd070,
};
const ELEMENT_NAME = ['', 'Lightning', 'Cold', 'Fire'];

/** Monsters farther than this from the character are not looked at (the camera never shows them). */
const FAR = 34;
/** A reach ring is drawn while the character is within this many tiles of its edge. */
const NEAR_EDGE = 9;
/** At most this many lines from one pylon. */
const PYLON_LINKS = 10;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** The body of a sprite as the state of a monster changes it: a curled beetle is small, a Mirrored pair is pale. */
export function stateSprite(a: Actor): { tint?: number; scale?: number } | null {
  if (a.curlT > 0) return { scale: 0.8, tint: 0xe0d0b0 };
  if (a.mirror.id !== 0) return { tint: 0xbfe8ff };
  return null;
}

export class MonsterStateFx {
  private air: Gfx;
  private list: Fx[] = [];
  private host: FxHost;
  /** The sim time of the last heal drawn on each monster (a pack heals in a burst; one set of motes is enough). */
  private lastHeal = new Map<number, number>();
  private now = 0;

  constructor(host: FxHost, scene: Phaser.Scene) {
    this.host = host;
    // Light adds up: gains and signs glow against the dark map.
    this.air = scene.add.graphics().setDepth(94400).setBlendMode(1);
  }

  destroy(): void {
    this.air.destroy();
    this.list = [];
    this.lastHeal.clear();
  }

  /** The effects waiting to finish (tests read it). */
  pending(): number {
    return this.list.length;
  }

  private add(total: number, air: boolean, draw: (g: Gfx, k: number) => void): void {
    if (this.list.length > 120) this.list.shift();
    this.list.push({ t: total, total, air, draw });
  }

  // ---- Primitives -------------------------------------------------------------------------------------------------

  private pt(x: number, y: number): Pt {
    return this.host.project(x, y);
  }

  /** The edge of a reach on the ground: a dark line under a colour line, as every other area. */
  private reach(g: Gfx, x: number, y: number, r: number, color: number, alpha: number): void {
    const p = this.pt(x, y);
    const rx = this.host.rpx(r) * 2;
    const ry = rx * this.host.squash();
    g.lineStyle(2, 0x000000, 0.25 * alpha).strokeEllipse(p.x, p.y, rx, ry);
    g.lineStyle(1, color, alpha).strokeEllipse(p.x, p.y, rx, ry);
  }

  /** The same edge in dashes that turn slowly: a reach that is only there to be read, not to be stepped out of. */
  private dashed(
    g: Gfx,
    x: number,
    y: number,
    r: number,
    color: number,
    alpha: number,
    time: number,
  ): void {
    const n = Math.max(14, Math.min(36, Math.round(r * 8)));
    g.lineStyle(1, color, alpha);
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2 + time * 0.25;
      const a1 = ((i + 1) / n) * Math.PI * 2 + time * 0.25;
      const p0 = this.pt(x + Math.cos(a0) * r, y + Math.sin(a0) * r);
      const p1 = this.pt(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
      g.lineBetween(p0.x, p0.y, p1.x, p1.y);
    }
  }

  /** An arc of the ground ellipse round a point, from the top, `frac` of the way round. */
  private arc(
    g: Gfx,
    x: number,
    y: number,
    r: number,
    frac: number,
    color: number,
    alpha: number,
  ): void {
    const n = Math.max(2, Math.round(24 * frac));
    g.lineStyle(2, color, alpha);
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i / n) * frac * Math.PI * 2;
      const p = this.pt(x + Math.cos(a) * r, y + Math.sin(a) * r);
      if (i === 0) g.moveTo(p.x, p.y);
      else g.lineTo(p.x, p.y);
    }
    g.strokePath();
  }

  /** A ring that spreads from a point to a radius and fades (a cast, a landing, a change). */
  private wave(x: number, y: number, r: number, color: number, secs = 0.5, from = 0.3): void {
    this.add(secs, false, (g, k) => this.reach(g, x, y, from + (r - from) * k, color, 1 - k));
  }

  private say(a: Actor, text: string, color: number): void {
    const p = this.pt(a.x, a.y);
    this.host.floater?.(p.x, p.y - 22, text, color, false);
  }

  // ---- Per frame --------------------------------------------------------------------------------------------------

  frame(w: World, dt: number, time: number, g: Gfx): void {
    this.now += dt;
    const air = this.air;
    air.clear();
    const watch = w.sides[0].player;
    let pylons: Actor[] | null = null;
    for (const a of w.actors) {
      if (!a.alive) continue;
      if (a.isPlayer) {
        if (a.suppressT > 0) this.drawSuppressed(air, a, time);
        continue;
      }
      if (!a.mon || Math.hypot(a.x - watch.x, a.y - watch.y) > FAR) continue;
      if (a.mon.spec.type === 'pylon') (pylons ??= []).push(a);
      this.drawMonster(g, air, w, a, Math.hypot(a.x - watch.x, a.y - watch.y), time);
    }
    if (pylons) this.drawPylons(g, air, w, pylons, time);
    let j = 0;
    for (const f of this.list) {
      f.t -= dt;
      if (f.t <= 0) continue;
      this.list[j++] = f;
      f.draw(f.air ? air : g, 1 - f.t / f.total);
    }
    this.list.length = j;
  }

  private drawMonster(g: Gfx, air: Gfx, w: World, a: Actor, dp: number, time: number): void {
    const type = a.mon!.spec.type;
    const abs = TYPE_ABILITIES[type];
    const o = this.pt(a.x, a.y);
    if (a.channelT > 0 && abs) {
      const ab = abs.find((x) => x.id === 'healChannel');
      if (ab) this.drawGather(g, air, a, ab.range!, ab.telegraph ?? 1, o, time);
    }
    // Reaches that are only a rule while the monster hunts: drawn lightly while the character is near, brighter inside.
    if (a.state === 'chase') {
      if (abs)
        for (const ab of abs) {
          if (ab.id === 'aura') this.drawReach(g, a, ab.range!, BUFF_COLOR, dp, time, false);
          else if (ab.id === 'suppress') this.drawReach(g, a, ab.range!, SUPPRESS, dp, time, true);
        }
      if (a.modIds.includes('rimeAura'))
        this.drawReach(g, a, RIME_AURA_RANGE, RIME, dp, time, true);
      if (a.modIds.includes('treasurer'))
        this.drawReach(g, a, TREASURER_RANGE, SUPPRESS, dp, time, true);
    }
    // States on the body.
    if (a.es > 0) this.drawWard(air, a, o, time);
    if (a.curlT > 0) this.drawCurl(g, a, o);
    const c = a.choir;
    if (c.buffT > 0) this.drawGain(air, a, o, time, BUFF_COLOR, 0);
    if (c.zealT > 0) this.drawGain(air, a, o, time, ZEAL_COLOR, 1);
    if (c.fervour > 0) {
      const k = 0.05 + 0.03 * c.fervour;
      air
        .fillStyle(FERVOUR_COLOR, k * (0.8 + 0.2 * Math.sin(time * 9 + a.id)))
        .fillEllipse(o.x, o.y - 10, 18, 24);
    }
    const el = immuneElement(a);
    if (el > 0) this.drawImmune(g, a, el, time);
    if (a.mirror.id !== 0) this.drawTwin(g, a, time);
    if (a.life < a.def.maxLife) {
      if (a.modIds.includes('regenerating')) this.drawRegen(air, a, o, time);
      if (a.leech.life.length > 0 && dp < 14) this.drawDrain(air, w.sides[0].player, a, time);
    }
  }

  /** A reach ring: dashes while the character is near its edge, firmer while the character stands inside. */
  private drawReach(
    g: Gfx,
    a: Actor,
    r: number,
    color: number,
    dp: number,
    time: number,
    hurtsCharacter: boolean,
  ): void {
    if (dp > r + NEAR_EDGE) return;
    const inside = hurtsCharacter && dp <= r;
    this.dashed(g, a.x, a.y, r, color, inside ? 0.55 : 0.2, time);
    if (inside) {
      const o = this.pt(a.x, a.y);
      const rx = this.host.rpx(r) * 2;
      g.fillStyle(color, 0.05).fillEllipse(o.x, o.y, rx, rx * this.host.squash());
    }
  }

  /** A Choirmaster gathering a heal: the reach it will cover, and motes drawn in to it. */
  private drawGather(
    g: Gfx,
    air: Gfx,
    a: Actor,
    range: number,
    total: number,
    o: Pt,
    time: number,
  ): void {
    const k = clamp01(1 - a.channelT / total);
    this.reach(g, a.x, a.y, range, HEAL, 0.2 + 0.35 * k);
    this.reach(g, a.x, a.y, Math.max(0.4, range * (1 - k)), HEAL, 0.5);
    air.fillStyle(HEAL, 0.1 + 0.14 * k).fillEllipse(o.x, o.y - 12, 16 + 8 * k, 22 + 10 * k);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + 0.4 + time * 0.3;
      const f = (k * 1.4 + i * 0.125) % 1;
      const rr = range * (1 - f);
      const p = this.pt(a.x + Math.cos(ang) * rr, a.y + Math.sin(ang) * rr);
      const al = Math.sin(f * Math.PI);
      air.fillStyle(HEAL, 0.3 * al).fillCircle(p.x, p.y - 4 - 6 * f, 3);
      air.fillStyle(0xe8ffe8, 0.9 * al).fillCircle(p.x, p.y - 4 - 6 * f, 1.3);
    }
  }

  /** A gain: a few chevrons that climb off the body in the colour of what it gained (amber speed and weight, red spite). */
  private drawGain(air: Gfx, a: Actor, o: Pt, time: number, color: number, slot: number): void {
    for (let i = 0; i < 2; i++) {
      const f = (time * 0.9 + i * 0.5 + a.id * 0.173 + slot * 0.25) % 1;
      const x = o.x + (i ? 4 : -4) + (slot ? 3 : -3);
      const y = o.y - 6 - f * 22;
      const al = Math.sin(f * Math.PI);
      air.lineStyle(1.5, color, 0.9 * al);
      air.beginPath();
      air.moveTo(x - 2, y + 1.5);
      air.lineTo(x, y - 1);
      air.lineTo(x + 2, y + 1.5);
      air.strokePath();
    }
  }

  /** A ward: a thin shell about the body, brighter when a Wight gave it. */
  private drawWard(air: Gfx, a: Actor, o: Pt, time: number): void {
    const wd = Math.max(16, this.host.rpx(a.r) * 2.3);
    const h = wd * 1.4;
    const gift = a.shellBy > 0;
    const pulse = 0.85 + 0.15 * Math.sin(time * 4 + a.id);
    air.fillStyle(WARD_COLOR, (gift ? 0.07 : 0.04) * pulse).fillEllipse(o.x, o.y - h * 0.42, wd, h);
    air
      .lineStyle(1, WARD_COLOR, (gift ? 0.5 : 0.28) * pulse)
      .strokeEllipse(o.x, o.y - h * 0.42, wd, h);
    // A glint that runs round it.
    const ang = time * 1.6 + a.id;
    air
      .fillStyle(0xffffff, 0.55 * pulse)
      .fillRect(
        o.x + Math.cos(ang) * wd * 0.5 - 1,
        o.y - h * 0.42 + Math.sin(ang) * h * 0.5 - 1,
        2,
        2,
      );
  }

  /** A curled beetle: a shell ring tight about it and plates across the ground. */
  private drawCurl(g: Gfx, a: Actor, o: Pt): void {
    const rx = this.host.rpx(a.r * 1.25);
    const sq = this.host.squash();
    g.lineStyle(2, 0x000000, 0.3).strokeEllipse(o.x, o.y, rx * 2, rx * 2 * sq);
    g.lineStyle(1.5, CURL_COLOR, 0.8).strokeEllipse(o.x, o.y, rx * 2, rx * 2 * sq);
    g.lineStyle(1, CURL_COLOR, 0.55);
    g.lineBetween(o.x - rx * 0.9, o.y, o.x + rx * 0.9, o.y);
    g.lineBetween(o.x, o.y - rx * sq * 0.9, o.x, o.y + rx * sq * 0.9);
  }

  /** A Reliquarian's immunity now: two rings in that element's colour, so the one to avoid is plain. */
  private drawImmune(g: Gfx, a: Actor, el: number, time: number): void {
    const col = ELEMENT_COLOR[el];
    const pulse = 0.8 + 0.2 * Math.sin(time * 5);
    this.reach(g, a.x, a.y, a.r + 0.4, col, 0.8 * pulse);
    this.reach(g, a.x, a.y, a.r + 0.6 + 0.08 * Math.sin(time * 3), col, 0.4);
  }

  /** One of a Mirrored pair: a shimmering line to its twin, and the seconds the survivor has left to be made whole. */
  private drawTwin(g: Gfx, a: Actor, time: number): void {
    const twin = this.host.actorById(a.mirror.id);
    if (twin && twin.alive && a.id < twin.id) {
      const p = this.pt(a.x, a.y);
      const q = this.pt(twin.x, twin.y);
      g.lineStyle(1, TWIN_COLOR, 0.18 + 0.1 * Math.sin(time * 6));
      g.lineBetween(p.x, p.y - 8, q.x, q.y - 8);
      for (let i = 0; i < 3; i++) {
        const f = (time * 0.7 + i / 3) % 1;
        g.fillStyle(TWIN_COLOR, 0.8 * Math.sin(f * Math.PI)).fillRect(
          p.x + (q.x - p.x) * f - 1,
          p.y - 8 + (q.y - p.y) * f - 1,
          2,
          2,
        );
      }
    }
    if (a.mirror.t > 0 && !(twin && twin.alive)) {
      // The survivor: a ring that empties as the three seconds run out.
      this.arc(g, a.x, a.y, a.r + 0.5, clamp01(a.mirror.t / 3), TWIN_COLOR, 0.9);
    }
  }

  /** A slow green plus now and then: a monster that mends. */
  private drawRegen(air: Gfx, a: Actor, o: Pt, time: number): void {
    const f = (time * 0.7 + a.id * 0.37) % 1;
    const x = o.x + Math.sin(a.id * 5.1) * 5;
    const y = o.y - 8 - f * 20;
    const al = Math.sin(f * Math.PI);
    air.lineStyle(1.5, 0x58d858, 0.9 * al);
    air.lineBetween(x - 2, y, x + 2, y);
    air.lineBetween(x, y - 2, x, y + 2);
  }

  /** A leech at work: drops of the character's blood running to the monster that drinks them. */
  private drawDrain(air: Gfx, from: Actor, a: Actor, time: number): void {
    const p = this.pt(from.x, from.y);
    const q = this.pt(a.x, a.y);
    for (let i = 0; i < 2; i++) {
      const f = (time * 1.4 + i * 0.5 + a.id * 0.21) % 1;
      air
        .fillStyle(0xe02848, 0.85 * Math.sin(f * Math.PI))
        .fillCircle(
          p.x + (q.x - p.x) * f,
          p.y - 10 + (q.y - p.y) * f - Math.sin(f * Math.PI) * 5,
          1.5,
        );
    }
  }

  /** The character cannot recover while a Bursar or the Treasurer is near: a struck-through plus by its head. */
  private drawSuppressed(air: Gfx, p: Actor, time: number): void {
    const o = this.pt(p.x, p.y);
    const x = o.x - 15;
    const y = o.y - 31;
    const pulse = 0.8 + 0.2 * Math.sin(time * 7);
    air.lineStyle(1.5, SUPPRESS, 0.9 * pulse).strokeCircle(x, y, 4.5);
    air.lineStyle(1.5, HEAL, 0.8 * pulse);
    air.lineBetween(x - 2, y, x + 2, y);
    air.lineBetween(x, y - 2, x, y + 2);
    air.lineStyle(1.5, SUPPRESS, 0.95 * pulse).lineBetween(x - 3.5, y + 3.5, x + 3.5, y - 3.5);
  }

  /** Pylons: a thin line to each monster one keeps from harm, and a faint ring of its reach while it keeps any. */
  private drawPylons(g: Gfx, air: Gfx, w: World, pylons: Actor[], time: number): void {
    for (const py of pylons) {
      let n = 0;
      const o = this.pt(py.x, py.y);
      for (const a of w.actors) {
        if (a === py || !a.alive || a.isPlayer || a.mon?.spec.type === 'pylon') continue;
        if (Math.hypot(a.x - py.x, a.y - py.y) > PYLON_RANGE) continue;
        if (++n > PYLON_LINKS) break;
        const q = this.pt(a.x, a.y);
        g.lineStyle(1, PYLON_COLOR, 0.28).lineBetween(o.x, o.y - 12, q.x, q.y - 8);
        const f = (time * 0.8 + a.id * 0.19) % 1;
        air
          .fillStyle(PYLON_COLOR, 0.8 * Math.sin(f * Math.PI))
          .fillRect(o.x + (q.x - o.x) * f - 1, o.y - 12 + (q.y - 8 - o.y + 12) * f - 1, 2, 2);
      }
      if (n > 0) this.reach(g, py.x, py.y, PYLON_RANGE, PYLON_COLOR, 0.2);
    }
  }

  // ---- Events -----------------------------------------------------------------------------------------------------

  onEvent(e: SimEvent): void {
    switch (e.t) {
      case 'heal':
        this.healed(e);
        break;
      case 'cue':
        this.cue(e);
        break;
      case 'twin':
        this.twin(e);
        break;
      case 'hexCast':
        this.hexCast(e);
        break;
      case 'stolen':
        this.stolen(e);
        break;
      default:
        break;
    }
  }

  /** Green motes rise on a monster that was healed, and a thread of green runs to it from the channel that healed it. */
  private healed(e: Extract<SimEvent, { t: 'heal' }>): void {
    const a = this.host.actorById(e.id);
    if (!a) return;
    if (this.now - (this.lastHeal.get(e.id) ?? -9) < 0.3) return;
    this.lastHeal.set(e.id, this.now);
    if (this.lastHeal.size > 80)
      for (const [id, t] of this.lastHeal) if (this.now - t > 2) this.lastHeal.delete(id);
    const src = e.src !== undefined ? this.host.actorById(e.src) : null;
    this.add(0.9, true, (g, k) => {
      const o = this.pt(a.x, a.y);
      const al = Math.sin(k * Math.PI);
      for (let i = 0; i < 5; i++) {
        const f = clamp01(k * 1.1 - i * 0.04);
        const x = o.x + (i - 2) * 3.2 + Math.sin(k * 5 + i) * 1.2;
        const y = o.y - 4 - f * 26;
        g.fillStyle(HEAL, 0.3 * al).fillCircle(x, y, 3);
        g.lineStyle(1.5, 0xe8ffe8, 0.9 * al);
        g.lineBetween(x - 1.6, y, x + 1.6, y);
        g.lineBetween(x, y - 1.6, x, y + 1.6);
      }
    });
    if (src && src !== a)
      this.add(0.35, true, (g, k) => {
        const p = this.pt(src.x, src.y);
        const q = this.pt(a.x, a.y);
        g.lineStyle(3, HEAL, 0.25 * (1 - k)).lineBetween(p.x, p.y - 10, q.x, q.y - 10);
        g.lineStyle(1, 0xe8ffe8, 0.8 * (1 - k)).lineBetween(p.x, p.y - 10, q.x, q.y - 10);
      });
  }

  private cue(e: Extract<SimEvent, { t: 'cue' }>): void {
    const a = this.host.actorById(e.id);
    const o = this.pt(e.x, e.y);
    switch (e.kind) {
      case 'mend':
        this.wave(e.x, e.y, e.r, HEAL, 0.6, 0.5);
        this.host.flash(o.x, o.y - 10, HEAL, 1.2, 0.25);
        break;
      case 'mendBroken':
        this.host.em.smoke.explode(5, o.x, o.y - 14);
        this.host.em.spark.explode(5, o.x, o.y - 18);
        if (a) this.say(a, 'Interrupted', 0xd0d0d0);
        break;
      case 'aura':
        this.wave(e.x, e.y, e.r, BUFF_COLOR, 0.6, 0.5);
        break;
      case 'whistle':
        this.wave(e.x, e.y, e.r, BUFF_COLOR, 0.6, 0.5);
        this.wave(e.x, e.y, e.r * 0.6, 0xffe0a0, 0.45, 0.5);
        break;
      case 'zeal':
        this.wave(e.x, e.y, e.r, ZEAL_COLOR, 0.6, 0.5);
        this.host.flash(o.x, o.y - 8, ZEAL_COLOR, 1.2, 0.25);
        break;
      case 'ward':
        this.wave(e.x, e.y, e.r, WARD_COLOR, 0.6, 0.5);
        break;
      case 'pools':
        // Where a pool opens: a burst of the colour it holds, in the circle it will hurt in.
        this.wave(e.x, e.y, e.r, ROT, 0.55, 0.3);
        this.add(0.5, true, (g, k) => {
          g.fillStyle(ROT, 0.2 * (1 - k)).fillEllipse(
            o.x,
            o.y,
            this.host.rpx(e.r) * 2 * (0.4 + 0.6 * k),
            this.host.rpx(e.r) * 2 * this.host.squash() * (0.4 + 0.6 * k),
          );
        });
        this.host.em.poison.explode(6, o.x, o.y - 2);
        break;
      case 'immune': {
        const el = e.n ?? 0;
        const col = ELEMENT_COLOR[el] ?? 0xffffff;
        this.wave(e.x, e.y, 2.4, col, 0.55, 0.4);
        this.host.flash(o.x, o.y - 10, col, 1.4, 0.3);
        if (a && el > 0) this.say(a, `${ELEMENT_NAME[el]} immune`, col);
        break;
      }
      case 'whole':
        this.wave(e.x, e.y, 1.8, TWIN_COLOR, 0.5, 0.3);
        this.host.flash(o.x, o.y - 10, HEAL, 1.2, 0.25);
        break;
    }
  }

  /** A Mirrored twin steps out of the air: a ring and a pale column where it stands, and a thread to the one it mirrors. */
  private twin(e: Extract<SimEvent, { t: 'twin' }>): void {
    const t = this.host.actorById(e.id);
    const m = this.host.actorById(e.of);
    if (!t) return;
    const x = t.x;
    const y = t.y;
    const o = this.pt(x, y);
    this.wave(x, y, 1.6, TWIN_COLOR, 0.6, 0.2);
    this.host.flash(o.x, o.y - 10, TWIN_COLOR, 1.3, 0.3);
    this.host.em.mote.explode(8, o.x, o.y - 10);
    this.add(0.7, true, (g, k) => {
      const al = 1 - k;
      for (const [w2, h, a2] of [
        [10, 40, 0.12],
        [5, 40, 0.3],
        [2, 36, 0.8],
      ] as const)
        g.fillStyle(TWIN_COLOR, a2 * al).fillRect(
          o.x - w2 / 2,
          o.y - h * (0.4 + 0.6 * k),
          w2,
          h * (0.4 + 0.6 * k),
        );
    });
    if (m)
      this.add(0.5, true, (g, k) => {
        const p = this.pt(m.x, m.y);
        g.lineStyle(1.5, TWIN_COLOR, 0.8 * (1 - k)).lineBetween(p.x, p.y - 9, o.x, o.y - 9);
      });
  }

  /** A hex being cast: a rune flares on the caster, a line runs to the character, and the hex's own glyph rises over it. */
  private hexCast(e: Extract<SimEvent, { t: 'hexCast' }>): void {
    const to = this.host.actorById(e.to);
    if (!to) return;
    const col = HEX_TINT[e.hex] ?? HEX_DEFAULT;
    const from = e.from >= 0 ? this.host.actorById(e.from) : null;
    if (from) {
      this.wave(from.x, from.y, e.renew ? 0.8 : 1.2, col, 0.4, 0.2);
      this.add(0.4, true, (g, k) => {
        const o = this.pt(from.x, from.y);
        hexGlyph(g, e.hex, o.x, o.y - 30 - 4 * k, e.renew ? 3 : 4, col, 1 - k);
      });
      this.add(0.3, true, (g, k) => {
        const p = this.pt(from.x, from.y);
        const q = this.pt(to.x, to.y);
        g.lineStyle(1, col, 0.8 * (1 - k));
        for (let i = 0; i < 6; i += 2) {
          const f0 = (i / 6) * (0.4 + 0.6 * k);
          const f1 = ((i + 1) / 6) * (0.4 + 0.6 * k);
          g.lineBetween(
            p.x + (q.x - p.x) * f0,
            p.y - 10 + (q.y - p.y) * f0,
            p.x + (q.x - p.x) * f1,
            p.y - 10 + (q.y - p.y) * f1,
          );
        }
      });
    }
    if (e.renew) {
      // A renewal: the glyph is small and a ring closes on the character.
      this.add(0.45, true, (g, k) => {
        const o = this.pt(to.x, to.y);
        hexGlyph(g, e.hex, o.x, o.y - 38, 3, col, 1 - k);
      });
      this.add(0.35, false, (g, k) => this.reach(g, to.x, to.y, 1.4 - 0.8 * k, col, 1 - k));
    } else {
      this.add(1.1, true, (g, k) => {
        const o = this.pt(to.x, to.y);
        hexGlyph(g, e.hex, o.x, o.y - 38 - 8 * k, 5, col, Math.sin(clamp01(k * 1.2) * Math.PI));
      });
      this.add(0.5, false, (g, k) => this.reach(g, to.x, to.y, 0.5 + 0.9 * k, col, 1 - k));
    }
  }

  /** A thief takes charges: the flask's bottle flies from the character to it. */
  private stolen(e: Extract<SimEvent, { t: 'stolen' }>): void {
    const v = this.host.actorById(e.src);
    const th = this.host.actorById(e.to);
    if (!v || !th) return;
    const col = FLASK_TINT[e.kind as FlaskKind] ?? FLASK_TINT.life;
    const o = this.pt(v.x, v.y);
    this.host.flash(o.x, o.y - 14, col, 1, 0.2);
    this.add(0.55, true, (g, k) => {
      const p = this.pt(v.x, v.y);
      const q = this.pt(th.x, th.y);
      const x = p.x + (q.x - p.x) * k;
      const y = p.y - 14 + (q.y - 12 - p.y + 14) * k - Math.sin(k * Math.PI) * 12;
      g.fillStyle(col, 0.25).fillCircle(x, y, 6);
      g.fillStyle(col, 0.95).fillEllipse(x, y + 1, 5, 6);
      g.fillStyle(0xe8e0d0, 0.95).fillRect(x - 1, y - 4, 2, 3);
      g.fillStyle(0xffffff, 0.9).fillRect(x - 1.5, y, 1, 2);
      if (k > 0.85)
        g.lineStyle(1.5, col, (1 - k) * 6).strokeCircle(q.x, q.y - 12, 6 * (k - 0.8) * 5);
    });
  }
}

/** The mark of a hex, drawn about (x, y) at half-size `s`: a cracked ring, weights, an open grip, slashes. */
export function hexGlyph(
  g: Gfx,
  id: string,
  x: number,
  y: number,
  s: number,
  color: number,
  alpha: number,
): void {
  if (alpha <= 0) return;
  g.lineStyle(1.5, color, alpha);
  switch (id) {
    case 'brittleDoom': {
      g.strokeCircle(x, y, s);
      g.beginPath();
      g.moveTo(x - s * 0.2, y - s);
      g.lineTo(x + s * 0.2, y - s * 0.3);
      g.lineTo(x - s * 0.2, y + s * 0.1);
      g.lineTo(x + s * 0.2, y + s);
      g.strokePath();
      break;
    }
    case 'leadenLimbs': {
      for (const dy of [-0.5, 0.35]) {
        g.beginPath();
        g.moveTo(x - s * 0.8, y + s * (dy - 0.4));
        g.lineTo(x, y + s * (dy + 0.4));
        g.lineTo(x + s * 0.8, y + s * (dy - 0.4));
        g.strokePath();
      }
      break;
    }
    case 'feebleGrip': {
      g.beginPath();
      for (let i = 0; i <= 10; i++) {
        const a = 0.5 + (i / 10) * (Math.PI * 2 - 1);
        const px = x + Math.cos(a) * s;
        const py = y + Math.sin(a) * s;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
      g.lineBetween(x - s * 0.5, y + s * 0.5, x + s * 0.5, y - s * 0.5);
      break;
    }
    case 'openWounds': {
      for (let i = -1; i <= 1; i++)
        g.lineBetween(x + i * s * 0.8 - s * 0.4, y - s, x + i * s * 0.8 + s * 0.4, y + s);
      break;
    }
    default: {
      g.beginPath();
      g.moveTo(x, y - s);
      g.lineTo(x + s, y);
      g.lineTo(x, y + s);
      g.lineTo(x - s, y);
      g.closePath();
      g.strokePath();
    }
  }
}
