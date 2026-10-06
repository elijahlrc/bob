import Phaser from 'phaser';
import { MOD_MARKS, RARITY_COLOR, type ModShape } from '../../data/monsterMarks';
import type { Actor, World } from '../../sim/types';

export type MarkTheme = {
  /** World-pixel size of one mark unit (pips are ~2 units wide). */
  unit: number;
  /** Outline colour for pips and bars. */
  outline: number;
  /** Ground-aura ellipse height / width. */
  squash: number;
};

type Pos = { x: number; y: number; headUp: number; r: number };

/**
 * Style-agnostic enemy readouts drawn in world space: coloured affix pips above magic/rare monsters,
 * a faint ground aura for the "visible" affixes, thin life bars, and the selection bracket.
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
      if (a.isPlayer || !a.alive) continue;
      const sel = a.id === selectedId;
      const interesting = a.rarity !== 'normal' || sel;
      if (!interesting) continue;
      const p = pos(a);
      if (!p) continue;
      if (p.x < view.x - 40 || p.x > view.right + 40 || p.y < view.y - 80 || p.y > view.bottom + 40)
        continue;
      const rc = RARITY_COLOR[a.rarity as keyof typeof RARITY_COLOR] ?? 0xffffff;
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

      // Selection bracket.
      if (sel) {
        const rx = p.r * 1.5 + u;
        g.lineStyle(u * 0.9, 0x000000, 0.8);
        g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.theme.squash);
        g.lineStyle(u * 0.6, 0xffffff, 0.95);
        g.strokeEllipse(p.x, p.y, rx * 2, rx * 2 * this.theme.squash);
      }

      // Life bar.
      const maxLife = Math.max(1, a.def.maxLife);
      const frac = Math.max(0, Math.min(1, a.life / maxLife));
      const w = u * (a.rarity === 'boss' ? 16 : 11);
      const h = u * 1.5;
      const bx = p.x - w / 2;
      let by = p.y - p.headUp - h - u * 1.2;
      if (a.rarity !== 'normal' || frac < 1) {
        g.fillStyle(this.theme.outline, 0.85).fillRect(
          bx - u * 0.4,
          by - u * 0.4,
          w + u * 0.8,
          h + u * 0.8,
        );
        g.fillStyle(0x401010, 1).fillRect(bx, by, w, h);
        g.fillStyle(rc, 1).fillRect(bx, by, w * frac, h);
      }

      // Affix pips, one per affix, centred above the bar.
      const n = a.modIds.length;
      if (n > 0) {
        const step = u * 2.6;
        let x = p.x - ((n - 1) * step) / 2;
        by -= u * 2.2;
        for (const id of a.modIds) {
          this.pip(x, by, u, MOD_MARKS[id].color, MOD_MARKS[id].shape);
          x += step;
        }
      }
    }
  }

  private pip(x: number, y: number, u: number, color: number, shape: ModShape): void {
    const g = this.g;
    const r = u * 1.15;
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
    if (shape === 'circle' || shape === 'ring') {
      g.fillStyle(outline, 1).fillCircle(x, y, r + u * 0.55);
      if (shape === 'ring') {
        g.fillStyle(color, 1).fillCircle(x, y, r);
        g.fillStyle(outline, 1).fillCircle(x, y, r * 0.45);
      } else g.fillStyle(color, 1).fillCircle(x, y, r);
      return;
    }
    g.fillStyle(outline, 1).fillPoints(
      path(r + u * 0.6).map((q) => new Phaser.Math.Vector2(q.x, q.y)),
      true,
    );
    g.fillStyle(color, 1).fillPoints(
      path(r).map((q) => new Phaser.Math.Vector2(q.x, q.y)),
      true,
    );
  }

  destroy(): void {
    this.g.destroy();
  }
}
