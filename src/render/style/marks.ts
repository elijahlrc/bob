import Phaser from 'phaser';
import { MOD_MARKS, RARITY_COLOR, type ModShape } from '../../data/monsterMarks';
import { tone } from '../../data/palette';
import type { Actor, World } from '../../sim/types';
import { isViewer } from './who';

export type MarkTheme = {
  /** World-pixel size of one mark unit (pips are ~2 units wide). */
  unit: number;
  /** Outline colour for pips and bars. */
  outline: number;
  /** Ground-aura ellipse height / width. */
  squash: number;
};

type Pos = { x: number; y: number; headUp: number; r: number };

/** A colour moved towards white (t > 0) or black (t < 0) by |t|. */
function shade(c: number, t: number): number {
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (to - v) * k);
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
}

/**
 * The ring round a life bar, by rarity (docs/WORLD-LEAF.md 3.2): the menus' small-bar recipe, a thin ring in the
 * palette's gold or lapis. A plain monster's is a dull gold, a rare's bright, a boss's the brightest.
 */
const BAR_RING: Record<string, number> = {
  normal: tone('gold', 1),
  magic: tone('lapis', 6),
  rare: tone('gold', 5),
  miniboss: tone('gold', 6),
  boss: tone('gold', 7),
};

/**
 * Style-agnostic enemy readouts drawn in world space: affix pips above magic/rare monsters (stones in gold settings),
 * a faint ground aura for the "visible" affixes, thin life bars (always on magic and up, and on any damaged
 * monster; a bitumen back, a gold ring, an ink outline and a hard shadow, in whole world pixels so they stay crisp),
 * and the selection bracket.
 * Full details live in the inspect card (UI), opened by clicking an enemy.
 */
export class MonsterMarks {
  private g: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private theme: MarkTheme;

  constructor(scene: Phaser.Scene, theme: MarkTheme) {
    this.scene = scene;
    this.theme = theme;
    this.g = scene.add.graphics().setDepth(100000);
  }

  draw(world: World, selectedId: number | null, time: number, pos: (a: Actor) => Pos | null): void {
    const g = this.g;
    g.clear();
    const view = this.scene.cameras.main.worldView;
    const u = this.theme.unit;
    for (const a of world.actors) {
      // The viewer's own character has the HUD; the rival of a duel is marked like an enemy.
      if (isViewer(a) || !a.alive) continue;
      const sel = a.id === selectedId;
      const interesting =
        a.rarity !== 'normal' || sel || a.life < a.def.maxLife || a.es < a.def.maxEs;
      if (!interesting) continue;
      const p = pos(a);
      if (!p) continue;
      if (p.x < view.x - 40 || p.x > view.right + 40 || p.y < view.y - 80 || p.y > view.bottom + 40)
        continue;
      const rc = a.isPlayer
        ? 0xe04030
        : (RARITY_COLOR[a.rarity as keyof typeof RARITY_COLOR] ?? 0xffffff);
      const pulse = 0.5 + 0.5 * Math.sin(time * 3 + a.id);

      // Ground auras for affixes that visibly change the monster.
      let k = 0;
      for (const id of a.modIds) {
        const m = MOD_MARKS[id];
        if (!m.aura) continue;
        const rx = p.r * (1.15 + 0.12 * k) + pulse * u * 0.8;
        g.lineStyle(u * 0.9, m.color, 0.35 + 0.3 * pulse);
        g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.theme.squash);
        if (k === 0) {
          g.fillStyle(m.color, 0.08 + 0.07 * pulse);
          g.fillEllipse(p.x, p.y, rx * 2, rx * 2 * this.theme.squash);
        }
        k++;
        if (k >= 3) break;
      }

      // Selection bracket: ink under the menus' gold.
      if (sel) {
        const rx = p.r * 1.5 + u;
        g.lineStyle(u * 0.9, this.theme.outline, 0.85);
        g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.theme.squash);
        g.lineStyle(u * 0.6, tone('gold', 7), 0.95);
        g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.theme.squash);
      }

      // Life bar, in whole world pixels from the inside out: the fill, a 1 px ring, a 1 px ink outline, a hard shadow.
      const big = a.rarity === 'boss' || a.rarity === 'miniboss';
      const maxLife = Math.max(1, a.def.maxLife);
      const frac = Math.max(0, Math.min(1, a.life / maxLife));
      const w = Math.round(u * (a.rarity === 'boss' ? 16 : 11));
      const h = big ? 5 : 4;
      // Energy shield: a thinner strip stacked on top of the life bar, so a shielded monster reads as two layers.
      const maxEs = a.def.maxEs;
      const esFrac = maxEs > 0 ? Math.max(0, Math.min(1, a.es / maxEs)) : 0;
      const eh = maxEs > 0 ? 2 : 0;
      const bx = Math.round(p.x - w / 2);
      let by = Math.round(p.y - p.headUp - h - eh - u * 1.2);
      if (a.rarity !== 'normal' || frac < 1 || esFrac < 1) {
        const ink = this.theme.outline;
        const ring = a.isPlayer ? BAR_RING.boss : (BAR_RING[a.rarity] ?? BAR_RING.normal);
        const H = h + eh;
        g.fillStyle(ink, 0.5).fillRect(bx - 1, by - 1, w + 4, H + 4);
        g.fillStyle(ink, 1).fillRect(bx - 2, by - 2, w + 4, H + 4);
        g.fillStyle(ring, 1).fillRect(bx - 1, by - 1, w + 2, H + 2);
        g.fillStyle(tone('bitumen', 2), 1).fillRect(bx, by, w, H);
        if (maxEs > 0) {
          const ew = Math.round(w * esFrac);
          g.fillStyle(tone('sky', 4), 1).fillRect(bx, by, ew, eh);
          g.fillStyle(tone('sky', 5), 1).fillRect(bx, by, ew, 1);
        }
        const lw = Math.round(w * frac);
        g.fillStyle(rc, 1).fillRect(bx, by + eh, lw, h);
        g.fillStyle(shade(rc, 0.35), 1).fillRect(bx, by + eh, lw, 1);
        g.fillStyle(shade(rc, -0.35), 1).fillRect(bx, by + eh + h - 1, lw, 1);
        // A boss's bar is set between two gold lozenges with a stone of its colour.
        if (big) {
          const cy = by + Math.floor(H / 2);
          this.setting(bx - 3, cy, rc);
          this.setting(bx + w + 2, cy, rc);
        }
      }

      // Affix pips, one per affix, centred above the bar: stones in gold settings.
      const n = a.modIds.length;
      if (n > 0) {
        const step = Math.round(u * 3.2);
        let x = Math.round(p.x - ((n - 1) * step) / 2);
        by -= Math.round(u * 2.6);
        for (const id of a.modIds) {
          this.pip(x, by, u, MOD_MARKS[id].color, MOD_MARKS[id].shape);
          x += step;
        }
      }
    }
  }

  /** A small gold lozenge holding a stone, at the end of a boss's bar. */
  private setting(x: number, y: number, stone: number): void {
    const g = this.g;
    const lz = (r: number) =>
      [
        { x, y: y - r },
        { x: x + r, y },
        { x, y: y + r },
        { x: x - r, y },
      ].map((q) => new Phaser.Math.Vector2(q.x, q.y));
    g.fillStyle(this.theme.outline, 1).fillPoints(lz(5.5), true);
    g.fillStyle(tone('gold', 6), 1).fillPoints(lz(4.5), true);
    g.fillStyle(stone, 1).fillPoints(lz(2.5), true);
    g.fillStyle(shade(stone, 0.45), 1).fillRect(x - 1, y - 1, 1, 1);
  }

  private pip(x: number, y: number, u: number, color: number, shape: ModShape): void {
    const g = this.g;
    const r = Math.round(u);
    const path = (rr: number): { x: number; y: number }[] => {
      switch (shape) {
        case 'diamond':
          return [
            { x, y: y - rr * 1.2 },
            { x: x + rr, y },
            { x, y: y + rr * 1.2 },
            { x: x - rr, y },
          ];
        case 'square':
          return [
            { x: x - rr * 0.9, y: y - rr * 0.9 },
            { x: x + rr * 0.9, y: y - rr * 0.9 },
            { x: x + rr * 0.9, y: y + rr * 0.9 },
            { x: x - rr * 0.9, y: y + rr * 0.9 },
          ];
        case 'triUp':
          return [
            { x, y: y - rr * 1.1 },
            { x: x + rr * 1.1, y: y + rr * 0.9 },
            { x: x - rr * 1.1, y: y + rr * 0.9 },
          ];
        case 'triDown':
          return [
            { x: x - rr * 1.1, y: y - rr * 0.9 },
            { x: x + rr * 1.1, y: y - rr * 0.9 },
            { x, y: y + rr * 1.1 },
          ];
        default:
          return [];
      }
    };
    const outline = this.theme.outline;
    const gold = tone('gold', 5);
    const lit = shade(color, 0.45);
    if (shape === 'circle' || shape === 'ring') {
      g.fillStyle(outline, 1).fillCircle(x, y, r + 2);
      g.fillStyle(gold, 1).fillCircle(x, y, r + 1);
      g.fillStyle(color, 1).fillCircle(x, y, r);
      if (shape === 'ring') g.fillStyle(outline, 1).fillCircle(x, y, r * 0.45);
      else g.fillStyle(lit, 1).fillRect(x - 1, y - 1, 1, 1);
      return;
    }
    const pts = (rr: number) => path(rr).map((q) => new Phaser.Math.Vector2(q.x, q.y));
    g.fillStyle(outline, 1).fillPoints(pts(r + 2), true);
    g.fillStyle(gold, 1).fillPoints(pts(r + 1), true);
    g.fillStyle(color, 1).fillPoints(pts(r), true);
    g.fillStyle(lit, 1).fillRect(x - 1, y - 1, 1, 1);
  }

  destroy(): void {
    this.g.destroy();
  }
}
