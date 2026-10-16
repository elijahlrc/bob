import type Phaser from 'phaser';
import { ELEMENT_COLOR } from '../../../calc/skillLook';
import {
  ATTUNE_SHIFT,
  BAR_SHARE,
  BOSSES,
  CANTER_RADIUS,
  HORN_TELL,
  ROT_ROTATION,
  SENTENCE_TELL,
  TOLL_EVERY,
  TOLL_TELL,
  bossOfType,
  type RotAilment,
} from '../../../data/bosses';
import { bossState, livingWitnesses, type BossState } from '../../../sim/bosses';
import { theftOf } from '../../../sim/theft';
import type { Actor, GroundEffect, SimEvent, World } from '../../../sim/types';
import type { FxHost } from './skillFx';

/**
 * How the bosses look in a fight (docs/BOSSES.md): the tell of every mechanic, drawn in the colour of what it does. The
 * Tollkeeper's count and the cracks of its tolls, the Courser's ember trail, the Magistrate's hourglass and the chains of
 * its Witnesses, the Prism Warden's runes, the Rotwife's hand and stitches, the Unmaker's tethers and sheen. Ailments on the
 * character show over its head whatever gave them.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };
type Fx = { t: number; total: number; draw: (g: Gfx, k: number) => void };

/** By damage type: physical, lightning, cold, fire, chaos. */
const DTYPE = [0xe0d0b0, 0xc89cff, 0x9ad8ff, 0xff9a40, 0xa0e04a];
const GOLD = 0xffd070;
const CHAIN = 0xe8c060;
const EXPOSED = 0xff4a3a;
const PALE = 0xe8e4f4;
const AIL_COLOR: Record<RotAilment | 'chill', number> = {
  bleed: 0xd02a2a,
  poison: 0x8ae04a,
  ignite: 0xff8a30,
  freeze: 0x9ad8ff,
  chill: 0x9ad8ff,
  shock: 0xc89cff,
};
const THEFT_TEXT: Record<string, string> = {
  resistance: 'your resistance',
  defence: 'your defence',
  supports: 'your supports',
  flasks: 'your flasks',
};

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

export class BossFx {
  private list: Fx[] = [];
  private host: FxHost;
  /** The cracks of light each toll leaves on the floor, per Tollkeeper. */
  private cracks = new Map<number, { x: number; y: number }[][]>();

  constructor(host: FxHost) {
    this.host = host;
  }

  private add(total: number, draw: (g: Gfx, k: number) => void): void {
    if (this.list.length > 80) this.list.shift();
    this.list.push({ t: total, total, draw });
  }

  private pt(x: number, y: number): Pt {
    return this.host.project(x, y);
  }

  private ring(g: Gfx, x: number, y: number, r: number): void {
    const p = this.pt(x, y);
    const rx = this.host.rpx(r);
    g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.host.squash());
  }

  private disc(g: Gfx, x: number, y: number, r: number): void {
    const p = this.pt(x, y);
    const rx = this.host.rpx(r);
    g.fillEllipse(p.x, p.y, rx * 2, rx * 2 * this.host.squash());
  }

  /** An arc of a ground ring from angle a0 to a1 (radians), as a polyline. */
  private arc(g: Gfx, x: number, y: number, r: number, a0: number, a1: number): void {
    const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) * 8));
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push(this.pt(x + Math.cos(a) * r, y + Math.sin(a) * r));
    }
    g.strokePoints(pts as Phaser.Math.Vector2[], false, false);
  }

  private say(x: number, y: number, text: string, color: number, big = false): void {
    const p = this.pt(x, y);
    this.host.floater?.(p.x, p.y - (big ? 46 : 30), text, color, big);
  }

  // ---- The Tollkeeper -------------------------------------------------------------------------------------------------

  private drawToll(g: Gfx, a: Actor, st: BossState, time: number): void {
    const c = this.pt(a.x, a.y);
    // The cracks of its tolls, in gold light.
    for (const crack of this.cracks.get(a.id) ?? []) {
      const pts = crack.map((q) => this.pt(q.x, q.y));
      g.lineStyle(3, 0x000000, 0.35);
      g.strokePoints(pts as Phaser.Math.Vector2[], false, false);
      g.lineStyle(1.5, GOLD, 0.55 + 0.15 * Math.sin(time * 3));
      g.strokePoints(pts as Phaser.Math.Vector2[], false, false);
    }
    // The count of tolls burns over the bell: a pip for each.
    for (let i = 0; i < st.tolls; i++) {
      const x = c.x - (st.tolls - 1) * 4 + i * 8;
      g.fillStyle(0x000000, 0.6).fillCircle(x, c.y - 74, 3.4);
      g.fillStyle(i === st.tolls - 1 ? 0xffffff : GOLD, 1).fillCircle(x, c.y - 74, 2.4);
    }
    // The clock: a thin arc round its feet that closes as the next toll nears.
    const k = st.tellT > 0 ? 1 : 1 - st.clock / TOLL_EVERY;
    g.lineStyle(2, GOLD, 0.35);
    this.arc(g, a.x, a.y, 1.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
    // The swing: runes fill a ring on the floor while the bell rises (a stun now cancels the toll).
    if (st.tellT > 0) {
      const f = 1 - st.tellT / TOLL_TELL;
      g.fillStyle(0x000000, 0.25);
      this.disc(g, a.x, a.y, 2.6);
      g.fillStyle(DTYPE[1], 0.25 + 0.3 * f);
      this.disc(g, a.x, a.y, 2.6 * Math.max(0.15, f));
      g.lineStyle(5, 0x000000, 0.5);
      this.ring(g, a.x, a.y, 2.6);
      g.lineStyle(4, lighten(DTYPE[1], 0.3), 1);
      this.arc(g, a.x, a.y, 2.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
      const n = 12;
      g.fillStyle(0xffffff, 0.9);
      for (let i = 0; i < n * f; i++) {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        const q = this.pt(a.x + Math.cos(ang) * 2.6, a.y + Math.sin(ang) * 2.6);
        g.fillRect(q.x - 1.5, q.y - 1.5, 3, 3);
      }
    }
  }

  private addCrack(a: Actor): void {
    const list = this.cracks.get(a.id) ?? [];
    const ang = Math.random() * Math.PI * 2;
    const pts: { x: number; y: number }[] = [];
    let x = a.x;
    let y = a.y;
    let dir = ang;
    for (let i = 0; i < 7; i++) {
      pts.push({ x, y });
      dir += (Math.random() - 0.5) * 0.9;
      x += Math.cos(dir) * 0.9;
      y += Math.sin(dir) * 0.9;
    }
    list.push(pts);
    this.cracks.set(a.id, list);
  }

  // ---- The Courser ------------------------------------------------------------------------------------------------------

  private drawCourser(g: Gfx, a: Actor, st: BossState, w: World, time: number): void {
    // Embers off its hooves wherever it runs; the canter's circle is traced faintly round the character.
    if (a.moving && Math.random() < 0.5) {
      const p = this.pt(a.x, a.y);
      this.host.em.flame.explode(1, p.x + (Math.random() - 0.5) * 10, p.y - 2);
    }
    if (st.gait === 'canter') {
      g.lineStyle(1, DTYPE[3], 0.18 + 0.06 * Math.sin(time * 6));
      this.ring(g, w.sides[0].player.x, w.sides[0].player.y, CANTER_RADIUS);
    }
  }

  // ---- The Magistrate ---------------------------------------------------------------------------------------------------

  private drawCourt(g: Gfx, a: Actor, st: BossState, w: World, time: number): void {
    const sentence = w.effects.find((e) => e.owner === a.id && e.label === 'Sentence');
    const to = sentence ?? a;
    const k = sentence ? 1 - sentence.t / sentence.total : 0;
    // A chain of light from each Witness to the Sentence (or to the Magistrate), brighter as the countdown runs.
    for (const x of st.witnesses) {
      if (!x.alive) continue;
      const p0 = this.pt(x.x, x.y);
      const p1 = this.pt(to.x, to.y);
      const n = 10;
      for (let i = 0; i < n; i++) {
        const f = (i + ((time * 2) % 1)) / n;
        const lx = p0.x + (p1.x - p0.x) * f;
        const ly = p0.y - 14 + (p1.y - p0.y + 14) * f;
        g.lineStyle(2, CHAIN, 0.3 + 0.6 * k);
        g.strokeEllipse(lx, ly, 5, 3);
      }
    }
    if (sentence) this.drawSentence(g, sentence, st, time);
  }

  /** The Sentence: a ring closing on the character, and an hourglass over it whose sand runs out. */
  private drawSentence(g: Gfx, e: GroundEffect, st: BossState, time: number): void {
    const k = 1 - e.t / e.total;
    const r = e.radius + (1 - k) * 2.5;
    g.fillStyle(0x000000, 0.25);
    this.disc(g, e.x, e.y, r);
    g.fillStyle(EXPOSED, 0.12 + 0.3 * k);
    this.disc(g, e.x, e.y, e.radius);
    g.lineStyle(3, EXPOSED, 0.9);
    this.ring(g, e.x, e.y, r);
    g.lineStyle(1.5, 0xffffff, 0.5 + 0.5 * Math.sin(time * 14));
    this.ring(g, e.x, e.y, e.radius);
    const c = this.pt(e.x, e.y);
    const hy = c.y - 52;
    const h = 9;
    // The glass.
    g.lineStyle(2, GOLD, 1);
    g.strokeTriangle(c.x - 6, hy - h, c.x + 6, hy - h, c.x, hy);
    g.strokeTriangle(c.x - 6, hy + h, c.x + 6, hy + h, c.x, hy);
    // The sand: what is left above, what has run below.
    const top = 1 - k;
    g.fillStyle(0xffe0a0, 1);
    g.fillTriangle(c.x - 5 * top, hy - h * top, c.x + 5 * top, hy - h * top, c.x, hy);
    g.fillTriangle(c.x - 5 * k, hy + h, c.x + 5 * k, hy + h, c.x, hy + h - h * k);
    // The weight: a pip for each Witness still standing.
    const n = livingWitnesses(st);
    for (let i = 0; i < n; i++) {
      const x = c.x - (n - 1) * 4 + i * 8;
      g.fillStyle(CHAIN, 1).fillCircle(x, hy - h - 6, 2.2);
    }
    void SENTENCE_TELL;
  }

  // ---- The Prism Warden -------------------------------------------------------------------------------------------------

  private drawPrism(g: Gfx, a: Actor, st: BossState, time: number): void {
    const col =
      st.shiftT > 0
        ? DTYPE[1 + (Math.floor(time * 12) % 3)]
        : (ELEMENT_COLOR[st.element] ?? DTYPE[st.element]);
    // Runes round it in the colour of its attunement: a hexagon that turns.
    const pts: Pt[] = [];
    for (let i = 0; i <= 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + time * 0.6;
      pts.push(this.pt(a.x + Math.cos(ang) * 1.9, a.y + Math.sin(ang) * 1.9));
    }
    g.lineStyle(3, 0x000000, 0.4);
    g.strokePoints(pts as Phaser.Math.Vector2[], false, false);
    g.lineStyle(2, col, 0.85);
    g.strokePoints(pts as Phaser.Math.Vector2[], false, false);
    // The shift: the colours chase round it; the immunity is gone for the moment.
    if (st.shiftT > 0) {
      const f = 1 - st.shiftT / ATTUNE_SHIFT;
      g.lineStyle(2, 0xffffff, 0.8);
      this.ring(g, a.x, a.y, 0.6 + 1.8 * f);
    } else {
      // Immune to its element: a shield of that colour over its head.
      const c = this.pt(a.x, a.y);
      g.fillStyle(0x000000, 0.5).fillCircle(c.x, c.y - 92, 6);
      g.fillStyle(col, 1).fillTriangle(c.x - 5, c.y - 96, c.x + 5, c.y - 96, c.x, c.y - 86);
    }
    // Fractured: cracks of the old colour across its body, and a burst where they open.
    if (st.fracturedT > 0) {
      const old = ELEMENT_COLOR[st.fractured] ?? DTYPE[st.fractured];
      const c = this.pt(a.x, a.y);
      g.lineStyle(2, old, 0.95);
      for (let i = 0; i < 5; i++) {
        const y0 = c.y - 20 - i * 12;
        g.lineBetween(c.x - 8 + (i % 2) * 5, y0, c.x + 6 - (i % 2) * 4, y0 - 8);
      }
    }
  }

  // ---- The Rotwife -----------------------------------------------------------------------------------------------------

  private drawRot(g: Gfx, a: Actor, st: BossState, time: number): void {
    const next = ROT_ROTATION[st.rot % ROT_ROTATION.length];
    const c = this.pt(a.x + Math.cos(a.facing) * 0.9, a.y + Math.sin(a.facing) * 0.9);
    // Her hand glows with the ailment her next blow carries.
    g.fillStyle(AIL_COLOR[next], 0.35).fillCircle(c.x, c.y - 30, 9 + Math.sin(time * 8));
    g.fillStyle(lighten(AIL_COLOR[next], 0.4), 1).fillCircle(c.x, c.y - 30, 4);
    // The rotation, as five beads over her head, the next one large.
    const h = this.pt(a.x, a.y);
    ROT_ROTATION.forEach((k, i) => {
      const x = h.x - 16 + i * 8;
      const big = k === next;
      g.fillStyle(0x000000, 0.5).fillCircle(x, h.y - 84, big ? 4 : 3);
      g.fillStyle(AIL_COLOR[k], big ? 1 : 0.55).fillCircle(x, h.y - 84, big ? 3.2 : 2);
    });
    // Regrowing: green stitches that close round her.
    if (st.regrowing) {
      g.lineStyle(2, 0x8ae04a, 0.6 + 0.3 * Math.sin(time * 6));
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + time * 1.5;
        this.arc(g, a.x, a.y, 1.3, ang, ang + 0.4);
      }
    }
  }

  // ---- The Unmaker -----------------------------------------------------------------------------------------------------

  private drawUnmaker(g: Gfx, a: Actor, st: BossState, w: World, time: number): void {
    const c = this.pt(a.x, a.y);
    // A tether of pale light to each shard it holds.
    for (const s of st.shards) {
      if (!s.actor.alive) continue;
      const q = this.pt(s.actor.x, s.actor.y);
      g.lineStyle(3, 0x000000, 0.4).lineBetween(c.x, c.y - 50, q.x, q.y - 12);
      g.lineStyle(1.5, PALE, 0.6 + 0.3 * Math.sin(time * 9 + s.angle)).lineBetween(
        c.x,
        c.y - 50,
        q.x,
        q.y - 12,
      );
    }
    // Its sheen: the damage type it has hardened against, as a rim of that colour.
    let top = 0;
    for (let i = 1; i < 5; i++) if (st.adapt[i] > st.adapt[top]) top = i;
    if (st.adapt[top] > 0.05) {
      g.lineStyle(2 + st.adapt[top] * 6, DTYPE[top], 0.25 + st.adapt[top]);
      this.ring(g, a.x, a.y, 1.2);
    }
    if (st.exposedT > 0) {
      g.lineStyle(3, EXPOSED, 0.6 + 0.4 * Math.sin(time * 16));
      this.ring(g, a.x, a.y, 1.5);
    }
    // While it holds the flasks, it drinks: red motes rise into it.
    if (theftOf(w).flasks && Math.random() < 0.15)
      this.host.em.spark.explode(1, c.x + (Math.random() - 0.5) * 16, c.y - 30);
  }

  // ---- The Siege Marshal ------------------------------------------------------------------------------------------------

  private drawSiege(g: Gfx, a: Actor, st: BossState, time: number): void {
    // While he commands, a thread of gold runs from his baton to each soldier standing: what they take off him.
    if (st.routedT <= 0) {
      const c = this.pt(a.x, a.y);
      for (const x of st.soldiers) {
        if (!x.alive) continue;
        const q = this.pt(x.x, x.y);
        g.lineStyle(1.5, GOLD, 0.25 + 0.15 * Math.sin(time * 4 + x.id));
        g.lineBetween(c.x, c.y - 60, q.x, q.y - 14);
      }
      // The horn: a ring closing on the arena's edge before a regiment comes.
      if (st.hornT > 0) {
        const k = 1 - st.hornT / HORN_TELL;
        g.lineStyle(2, GOLD, 0.8 * (1 - k));
        this.ring(g, a.x, a.y, 9 - 2 * k);
      }
    }
    if (st.routedT > 0) {
      g.lineStyle(3, EXPOSED, 0.6 + 0.4 * Math.sin(time * 16));
      this.ring(g, a.x, a.y, 1.6);
    }
  }

  // ---- The Veiled Duellist ----------------------------------------------------------------------------------------------

  private drawDuel(g: Gfx, a: Actor, st: BossState, time: number): void {
    const c = this.pt(a.x, a.y);
    if (st.veiled) {
      // The veil: a shimmering sheet over him, and a crossed-out mark over his head (nothing critical gets through).
      g.fillStyle(0x6a7ab8, 0.28 + 0.1 * Math.sin(time * 5)).fillEllipse(c.x, c.y - 44, 54, 100);
      g.lineStyle(1.5, 0xc8d4ff, 0.6).strokeEllipse(c.x, c.y - 44, 54, 100);
      g.fillStyle(0x000000, 0.5).fillCircle(c.x, c.y - 100, 6);
      g.lineStyle(2, 0xc8d4ff, 1).strokeCircle(c.x, c.y - 100, 4);
      g.lineBetween(c.x - 3, c.y - 103, c.x + 3, c.y - 97);
    } else if (st.flurryT > 0) {
      g.lineStyle(2, 0xffffff, 0.5 + 0.5 * Math.sin(time * 20));
      this.ring(g, a.x, a.y, 1.1);
    }
    if (st.bareT > 0) {
      g.lineStyle(3, EXPOSED, 0.6 + 0.4 * Math.sin(time * 16));
      this.ring(g, a.x, a.y, 1.4);
    }
  }

  // ---- The Bulwark Engine -----------------------------------------------------------------------------------------------

  private drawEngine(g: Gfx, a: Actor, st: BossState): void {
    // Its plates, as a ring of eight round it: each worn away in turn as the bar goes down.
    const frac = st.brokenT > 0 ? 0 : Math.max(0, st.bar) / Math.max(1, a.def.maxLife * BAR_SHARE);
    for (let i = 0; i < 8; i++) {
      const on = (i + 1) / 8 <= frac + 0.0001;
      const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
      g.lineStyle(on ? 4 : 2, on ? 0xc8b890 : 0x5a4c3c, on ? 0.9 : 0.4);
      this.arc(g, a.x, a.y, 1.6, ang, ang + 0.5);
    }
    if (st.brokenT > 0) {
      g.lineStyle(3, EXPOSED, 0.6 + 0.4 * Math.sin(Date.now() / 60));
      this.ring(g, a.x, a.y, 1.8);
      if (Math.random() < 0.3) {
        const c = this.pt(a.x, a.y);
        this.host.em.smoke.explode(1, c.x + (Math.random() - 0.5) * 30, c.y - 60);
      }
    }
  }

  // ---- The Sundered Twins -----------------------------------------------------------------------------------------------

  private drawTwins(g: Gfx, a: Actor, st: BossState, w: World, time: number): void {
    // A thread between the two, ash and ember, while both stand (drawn once, from Ash).
    if (st.twin === 'ash') {
      const o = w.actors.find((x) => x !== a && x.alive && bossState(x)?.id === 'twins');
      if (o) {
        const p0 = this.pt(a.x, a.y);
        const p1 = this.pt(o.x, o.y);
        const n = 12;
        for (let i = 0; i <= n; i++) {
          const f = i / n;
          const col = i % 2 ? 0xa8a8a8 : 0xff8a30;
          g.fillStyle(col, 0.5).fillCircle(
            p0.x + (p1.x - p0.x) * f,
            p0.y - 26 + (p1.y - p0.y) * f + Math.sin(time * 3 + i) * 2,
            1.6,
          );
        }
      }
    }
    if (st.grief) {
      g.lineStyle(3, EXPOSED, 0.5 + 0.3 * Math.sin(time * 9));
      this.ring(g, a.x, a.y, 1.5);
    }
  }

  // ---- What is on the character -----------------------------------------------------------------------------------------

  /** Every ailment on the character, as a row of icons over its head (docs/BOSSES.md 11.2), whatever gave it. */
  private drawAilments(g: Gfx, w: World): void {
    const p = w.sides[0].player;
    if (!p.alive) return;
    const a = p.ail;
    const on: [number, number][] = [];
    if (a.bleeds.length) on.push([AIL_COLOR.bleed, a.bleeds.length]);
    if (a.poisons.length) on.push([AIL_COLOR.poison, a.poisons.length]);
    if (a.ignites.length) on.push([AIL_COLOR.ignite, a.ignites.length]);
    if (a.freezeT > 0 || a.chill > 0) on.push([AIL_COLOR.freeze, 0]);
    if (a.shock > 0) on.push([AIL_COLOR.shock, 0]);
    if (!on.length) return;
    const c = this.pt(p.x, p.y);
    on.forEach(([col, n], i) => {
      const x = c.x - (on.length - 1) * 6 + i * 12;
      const y = c.y - 44;
      g.fillStyle(0x000000, 0.6).fillCircle(x, y, 5);
      g.fillStyle(col, 1).fillCircle(x, y, 3.8);
      // Stacks: a small bar under the icon, longer with more.
      if (n > 1) g.fillStyle(col, 0.9).fillRect(x - 4, y + 6, Math.min(8, n), 1.5);
    });
  }

  // ---- Per frame and events ---------------------------------------------------------------------------------------------

  frame(w: World, dt: number, time: number, g: Gfx): void {
    this.drawAilments(g, w);
    for (const a of w.actors) {
      if (!a.alive || a.rarity !== 'boss') continue;
      const st = bossState(a);
      if (!st) continue;
      switch (st.id) {
        case 'tollkeeper':
          this.drawToll(g, a, st, time);
          break;
        case 'courser':
          this.drawCourser(g, a, st, w, time);
          break;
        case 'magistrate':
          this.drawCourt(g, a, st, w, time);
          break;
        case 'prismWarden':
          this.drawPrism(g, a, st, time);
          break;
        case 'rotwife':
          this.drawRot(g, a, st, time);
          break;
        case 'unmaker':
          this.drawUnmaker(g, a, st, w, time);
          break;
        case 'siegeMarshal':
          this.drawSiege(g, a, st, time);
          break;
        case 'duellist':
          this.drawDuel(g, a, st, time);
          break;
        case 'bulwarkEngine':
          this.drawEngine(g, a, st);
          break;
        case 'twins':
          this.drawTwins(g, a, st, w, time);
          break;
      }
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

  private pulse(x: number, y: number, color: number, r1: number, t = 0.5): void {
    this.add(t, (g, k) => {
      g.lineStyle(3 * (1 - k) + 0.5, color, 1 - k);
      this.ring(g, x, y, 0.3 + r1 * k);
    });
  }

  /** A beam between two actors that fades: a theft (from the character) or a return (to it). */
  private beam(from: Actor, to: Actor, color: number): void {
    const a = { x: from.x, y: from.y };
    const b = { x: to.x, y: to.y };
    this.add(0.6, (g, k) => {
      const p = this.pt(a.x, a.y);
      const q = this.pt(b.x, b.y);
      for (const [wd, al] of [
        [9, 0.25],
        [4, 0.6],
        [1.5, 1],
      ] as const) {
        g.lineStyle(wd, wd > 2 ? color : 0xffffff, al * (1 - k));
        g.lineBetween(p.x, p.y - 20, q.x, q.y - 40);
      }
    });
  }

  onEvent(e: SimEvent, w: World): void {
    if (e.t === 'blast' && e.e.label === 'Sentence') {
      this.host.shake(6);
      const p = this.pt(e.e.x, e.e.y);
      this.host.flash(p.x, p.y - 10, EXPOSED, 2.2, 0.6);
      this.host.em.dust.explode(18, p.x, p.y);
      return;
    }
    if (e.t !== 'window') return;
    const a = this.host.actorById(e.id);
    if (!a) return;
    const p = this.pt(a.x, a.y);
    const k = e.kind;
    if (k === 'bossBegins') {
      const def = a.mon && bossOfType(a.mon.spec.type);
      if (def) this.say(a.x, a.y, BOSSES[def.id].name, 0xffe0b0, true);
      this.pulse(a.x, a.y, 0xffe0b0, 4, 0.9);
    } else if (k === 'tollTell') this.say(a.x, a.y, 'The bell rises', DTYPE[1]);
    else if (k === 'toll') {
      this.addCrack(a);
      this.host.shake(3);
      this.host.flash(p.x, p.y - 40, DTYPE[1], 1.6, 0.5);
      const st = bossState(a);
      this.say(a.x, a.y, `Toll ${st?.tolls ?? ''}`, GOLD);
    } else if (k === 'tollBroken') {
      this.say(a.x, a.y, 'Rung flat', 0xb8b8b8);
      this.pulse(a.x, a.y, 0xb8b8b8, 2.4);
    } else if (k === 'gallop') this.say(a.x, a.y, 'Gallop', DTYPE[3]);
    else if (k === 'charge') this.say(a.x, a.y, 'Charge!', DTYPE[3]);
    else if (k === 'blocked') {
      this.say(a.x, a.y, 'Blocked', 0xffffff);
      this.host.em.dust.explode(10, p.x, p.y);
    } else if (k === 'sentence') {
      this.say(w.sides[0].player.x, w.sides[0].player.y, 'Sentenced', EXPOSED, true);
    } else if (k === 'witnesses') {
      const st = bossState(a);
      for (const x of st?.witnesses ?? []) if (x.alive) this.pulse(x.x, x.y, CHAIN, 1.2);
    } else if (k.startsWith('attune.')) {
      const el = Number(k.slice(7));
      const col = ELEMENT_COLOR[el] ?? DTYPE[el];
      this.pulse(a.x, a.y, col, 3, 0.7);
      this.say(a.x, a.y, `Attuned: ${['', 'lightning', 'cold', 'fire'][el]}`, col);
    } else if (k === 'shift') this.say(a.x, a.y, 'Shifting', 0xffffff);
    else if (k.startsWith('stolen.')) {
      const what = k.slice(7);
      this.beam(w.sides[0].player, a, PALE);
      this.say(
        w.sides[0].player.x,
        w.sides[0].player.y,
        `It takes ${THEFT_TEXT[what] ?? what}`,
        PALE,
        true,
      );
      this.host.shake(4);
    } else if (k.startsWith('returned.')) {
      const what = k.slice(9);
      this.beam(a, w.sides[0].player, GOLD);
      this.say(
        w.sides[0].player.x,
        w.sides[0].player.y,
        `${THEFT_TEXT[what] ?? what} returned`,
        GOLD,
      );
      this.pulse(a.x, a.y, EXPOSED, 2);
    } else if (k === 'horn') this.say(a.x, a.y, 'The horn sounds', GOLD);
    else if (k === 'march') {
      const st = bossState(a);
      for (const x of st?.soldiers ?? []) if (x.alive) this.pulse(x.x, x.y, GOLD, 1.2);
    } else if (k === 'routed') {
      this.say(a.x, a.y, 'Routed', EXPOSED, true);
      this.pulse(a.x, a.y, EXPOSED, 3);
    } else if (k === 'unveil') this.say(a.x, a.y, 'The veil drops', 0xc8d4ff);
    else if (k === 'veil') this.say(a.x, a.y, 'Veiled', 0xc8d4ff);
    else if (k === 'flurry') this.say(a.x, a.y, 'Flurry', 0xffffff);
    else if (k === 'bare') this.pulse(a.x, a.y, EXPOSED, 2);
    else if (k === 'broken') {
      this.say(a.x, a.y, 'Plates broken', EXPOSED, true);
      this.host.shake(5);
      this.host.em.dust.explode(16, p.x, p.y);
      this.pulse(a.x, a.y, EXPOSED, 3);
    } else if (k === 'replated') this.say(a.x, a.y, 'Replated', 0xc8b890);
    else if (k === 'grind') this.say(a.x, a.y, 'Grind', 0xc8b890);
    else if (k === 'grief') {
      this.say(a.x, a.y, 'Grief', EXPOSED, true);
      this.pulse(a.x, a.y, EXPOSED, 4, 0.9);
      this.host.shake(4);
    } else if (k === 'echo') this.say(a.x, a.y, 'Echo', DTYPE[3]);
    else if (k === 'dismissed') {
      this.host.em.smoke.explode(8, p.x, p.y - 8);
    }
  }
}
