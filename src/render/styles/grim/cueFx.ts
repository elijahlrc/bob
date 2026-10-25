import type Phaser from 'phaser';
import { elementOfTags, ELEMENT_COLOR } from '../../../calc/skillLook';
import type { SimEvent, World } from '../../../sim/types';
import type { FxHost } from './skillFx';

/**
 * Small cues for things the sim does that have no picture of their own (docs/VISUAL_LANGUAGE.md, "Cues"): a totem, a brand or a
 * mirage archer firing, a mine's aura adding to a hit, a trigger or an echo casting a spell, and the character getting back life,
 * energy shield or mana (or giving life up). They are thin, short and rate-limited, because a build repeats them: a totem fires several
 * times a second, a trigger on every hit, leech on every blow. None of them flashes a light.
 */

type Gfx = Phaser.GameObjects.Graphics;
type Pt = { x: number; y: number };

/** The registry of short effects that `SkillFx` keeps (`air`: drawn on the additive layer). */
export type AddFx = (total: number, air: boolean, draw: (g: Gfx, k: number) => void) => void;

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** A fixed pseudo-random number from 0 to 1 (the spread of motes; the same event always looks the same). */
const rnd = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** The colours of what is recovered, and of what is given up. */
export const POOL_COLOR = { life: 0x6ae07a, es: 0xa8e8ff, mana: 0x5a8aff } as const;
export const SACRIFICE_COLOR = 0xd03030;

/** Pixels over the ground at which each kind of thing that fires has its muzzle. */
const MUZZLE: Record<string, number> = { totem: 19, brand: 6, mirage: 12 };

/** The least time between two cues of a kind, in seconds. */
const GAP = { bonus: 0.25, trigger: 0.5, triggerName: 1.5, echo: 0.2 } as const;

export class CueFx {
  private last = new Map<string, number>();
  private n = 0;
  private host: FxHost;
  private add: AddFx;

  constructor(host: FxHost, add: AddFx) {
    this.host = host;
    this.add = add;
  }

  onEvent(e: SimEvent, w: World, now: number): void {
    switch (e.t) {
      case 'use':
        this.fired(e);
        break;
      case 'mineBonus':
        this.mineBonus(e, now);
        break;
      case 'trigger':
        this.trigger(e, w, now);
        break;
      case 'echo':
        this.echo(e, w, now);
        break;
      case 'recover':
        this.recover(e);
        break;
      case 'sacrifice':
        this.sacrifice(e);
        break;
      default:
        break;
    }
  }

  private lifted(x: number, y: number, lift: number): Pt {
    const p = this.host.project(x, y);
    return { x: p.x, y: p.y - lift };
  }

  /** True (and the time is noted) if the cue of this key is not too soon after the last. */
  private ready(key: string, now: number, gap: number): boolean {
    if (now - (this.last.get(key) ?? -9) < gap) return false;
    this.last.set(key, now);
    if (this.last.size > 200) this.last.clear();
    return true;
  }

  /** The element colour of the character's skill with this id (gold when it is not found). */
  private colorOf(w: World, src: number, skill: string): { color: number; name?: string } {
    const side = w.sides.find((s) => s.player.id === src) ?? w.sides[0];
    // (A spell a trigger grants is not among the actives: it is in the trigger's own list.)
    const c =
      side?.char?.actives?.find((x) => x.skill.id === skill) ??
      side?.char?.utilities?.find((x) => x.skill.id === skill) ??
      side?.char?.triggers?.flatMap((t) => t.skills).find((x) => x.skill.id === skill);
    if (!c) return { color: 0xffd070 };
    return {
      color: ELEMENT_COLOR[elementOfTags(c.skill.tags, c.skill.spellDamage)] ?? 0xffd070,
      name: c.skill.name,
    };
  }

  private groundRing(g: Gfx, x: number, y: number, r: number, color: number, a: number, w = 1) {
    const p = this.host.project(x, y);
    const rx = this.host.rpx(r);
    g.lineStyle(w, color, a).strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.host.squash());
  }

  /** A thin line with a bright core between two screen points. */
  private line(g: Gfx, a: Pt, b: Pt, color: number, alpha: number): void {
    g.lineStyle(3, color, 0.3 * alpha).lineBetween(a.x, a.y, b.x, b.y);
    g.lineStyle(1, lighten(color, 0.6), 0.9 * alpha).lineBetween(a.x, a.y, b.x, b.y);
  }

  // ---- A totem, a brand or a mirage archer fires -----------------------------------------------
  /**
   * The thing that fired pulses (a ring and a bright heart on its top), and a spark runs from it to the spot it fired at, in the
   * colour of the damage. A skill that flies as a projectile needs no spark: its projectile is the link. A trap or a mine has its own
   * cue (`sprung`).
   */
  private fired(e: Extract<SimEvent, { t: 'use' }>): void {
    const d = e.dep;
    if (e.via !== 'deployed' || !d || d.kind === 'trap' || d.kind === 'mine') return;
    const color = ELEMENT_COLOR[d.dtype] ?? 0xffffff;
    const o = this.lifted(d.x, d.y, MUZZLE[d.kind] ?? 12);
    this.add(0.22, true, (g, k) => {
      const a = 1 - k;
      g.fillStyle(color, 0.3 * a).fillCircle(o.x, o.y, 5 + 6 * k);
      g.lineStyle(1.5, lighten(color, 0.5), 0.9 * a).strokeCircle(o.x, o.y, 4 + 8 * k);
      g.fillStyle(0xffffff, 0.9 * a).fillCircle(o.x, o.y, 2.4 - 1.2 * k);
    });
    if (d.shot || Math.hypot(d.tx - d.x, d.ty - d.y) < 0.8) return;
    const t = this.lifted(d.tx, d.ty, 4);
    this.add(0.2, true, (g, k) => {
      const head = Math.min(1, k * 2.6);
      const tail = Math.max(0, k * 2.6 - 0.5);
      const at = (u: number): Pt => ({ x: o.x + (t.x - o.x) * u, y: o.y + (t.y - o.y) * u });
      this.line(g, at(tail), at(head), color, 1 - k * k);
    });
  }

  // ---- The aura of a mine adds to a hit --------------------------------------------------------
  /** A spark runs from the mine to the enemy it helped hit: gold for a hit that rolled double, fire for fire added. */
  private mineBonus(e: Extract<SimEvent, { t: 'mineBonus' }>, now: number): void {
    if (!this.ready(`mb:${e.kind}:${e.mx.toFixed(1)},${e.my.toFixed(1)}`, now, GAP.bonus)) return;
    const double = e.kind === 'double';
    const color = double ? 0xffe080 : ELEMENT_COLOR[3];
    const o = this.lifted(e.mx, e.my, 3);
    const t = this.lifted(e.x, e.y, 8);
    this.add(0.2, true, (g, k) => {
      const head = Math.min(1, k * 3);
      const tail = Math.max(0, k * 3 - 0.5);
      const at = (u: number): Pt => ({ x: o.x + (t.x - o.x) * u, y: o.y + (t.y - o.y) * u });
      this.line(g, at(tail), at(head), color, 1 - k * k);
      if (k > 0.25) {
        const a = 1 - (k - 0.25) / 0.75;
        g.lineStyle(1.5, lighten(color, 0.5), 0.9 * a).strokeCircle(t.x, t.y, 3 + 7 * k);
        if (double) g.fillStyle(0xffffff, 0.8 * a).fillCircle(t.x, t.y, 2);
      }
    });
  }

  // ---- A trigger or an echo casts a spell ------------------------------------------------------
  /** A small rune turns at the character's feet in the spell's colour, and the spell's name rises (less often). */
  private trigger(e: Extract<SimEvent, { t: 'trigger' }>, w: World, now: number): void {
    const src = e.src ?? w.sides[0].player.id;
    const a = this.host.actorById(src);
    if (!a) return;
    const { color, name } = this.colorOf(w, src, e.skill);
    if (this.ready(`tr:${src}:${e.skill}`, now, GAP.trigger)) {
      this.add(0.4, false, (g, k) => {
        const al = 1 - k * k;
        const r = 0.45 + 0.4 * k;
        this.groundRing(g, a.x, a.y, r, color, 0.9 * al, 2);
        this.groundRing(g, a.x, a.y, r * 0.6, lighten(color, 0.4), 0.5 * al, 1);
        const p = this.host.project(a.x, a.y);
        const rx = this.host.rpx(r);
        g.fillStyle(0xffffff, 0.85 * al);
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2 + k * 5;
          g.fillRect(
            p.x + Math.cos(ang) * rx - 1,
            p.y + Math.sin(ang) * rx * this.host.squash() - 1,
            2,
            2,
          );
        }
      });
    }
    if (name && this.ready(`trn:${src}:${e.skill}`, now, GAP.triggerName)) {
      const p = this.host.project(a.x, a.y);
      this.host.floater?.(p.x, p.y - 22, name, color, false);
    }
  }

  /** A ring closes on the character's feet in the skill's colour: the use lands again. */
  private echo(e: Extract<SimEvent, { t: 'echo' }>, w: World, now: number): void {
    if (!this.ready(`ec:${e.src}`, now, GAP.echo)) return;
    const a = this.host.actorById(e.src);
    if (!a) return;
    const { color } = this.colorOf(w, e.src, e.skill);
    this.add(0.3, false, (g, k) => {
      const al = 1 - k;
      this.groundRing(g, a.x, a.y, 1.1 - 0.55 * k, color, 0.85 * al, 1.5);
      this.groundRing(g, a.x, a.y, 0.8 - 0.4 * k, lighten(color, 0.5), 0.5 * al, 1);
    });
  }

  // ---- Recovery --------------------------------------------------------------------------------
  /**
   * Motes rise from the character in the colour of the pool (green for life, blue for mana, pale for energy shield): a few for a
   * trickle that was worth a cue, up to seven for a flask or a big kill. The sim makes at most one of these for a pool in a third of
   * a second, so a steady leech is a faint stream.
   */
  private recover(e: Extract<SimEvent, { t: 'recover' }>): void {
    const color = POOL_COLOR[e.pool];
    const n = Math.max(2, Math.min(7, Math.round(e.pct * 70)));
    const seed = (this.n += 11);
    this.add(0.8, true, (g, k) => {
      const a = this.host.actorById(e.src);
      if (!a) return;
      const o = this.host.project(a.x, a.y);
      for (let i = 0; i < n; i++) {
        const kk = (k - (i / n) * 0.35) / 0.65;
        if (kk < 0 || kk > 1) continue;
        const fade = Math.sin(kk * Math.PI);
        const px = o.x + (rnd(seed + i) - 0.5) * 14 + Math.sin(kk * 6 + i) * 1.5;
        const py = o.y - 3 - kk * 26;
        g.fillStyle(color, 0.3 * fade).fillCircle(px, py, 3);
        g.fillStyle(lighten(color, 0.55), 0.95 * fade).fillCircle(px, py, 1.3);
      }
    });
  }

  /** Red drops run down the character and a red ring closes on it: life given up. */
  private sacrifice(e: Extract<SimEvent, { t: 'sacrifice' }>): void {
    const seed = (this.n += 11);
    this.add(0.6, true, (g, k) => {
      const a = this.host.actorById(e.src);
      if (!a) return;
      const o = this.host.project(a.x, a.y);
      this.groundRing(g, a.x, a.y, 1.2 - 0.8 * k, SACRIFICE_COLOR, 0.8 * (1 - k), 1.5);
      for (let i = 0; i < 6; i++) {
        const kk = (k - (i / 6) * 0.3) / 0.7;
        if (kk < 0 || kk > 1) continue;
        const fade = Math.sin(kk * Math.PI);
        const px = o.x + (rnd(seed + i) - 0.5) * 12;
        const py = o.y - 24 + kk * 24;
        g.fillStyle(SACRIFICE_COLOR, 0.35 * fade).fillCircle(px, py, 3);
        g.fillStyle(0xff8a80, 0.95 * fade).fillCircle(px, py, 1.3);
      }
    });
  }
}
