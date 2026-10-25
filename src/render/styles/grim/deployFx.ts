import type Phaser from 'phaser';
import type { SkillChoice } from '../../../calc/character';
import { ELEMENT_COLOR } from '../../../calc/skillLook';
import type { Deployable } from '../../../sim/deploy';
import type { FxHost } from './skillFx';

/**
 * The ground that a standing totem or mine commands (docs/VISUAL_LANGUAGE.md, "Cues"): a war-cry totem's reach, bright while the
 * character stands in it and the totem is active, and the aura of a mine (fire added to hits, a chance of double damage, more damage
 * taken), marked by chevrons that point in. Both are faint: a build puts down many.
 */

type Gfx = Phaser.GameObjects.Graphics;

const lighten = (c: number, f: number): number => {
  const m = (v: number) => Math.round(v + (255 - v) * f);
  return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255);
};

/** The colour of what a mine's aura does: fire for added fire, gold for double damage, violet for more damage taken. */
export function auraColor(a: NonNullable<Deployable['aura']>): number {
  if (a.max > 0) return ELEMENT_COLOR[3];
  if (a.double > 0) return 0xffd870;
  return ELEMENT_COLOR[1];
}

export function drawDeployZones(
  g: Gfx,
  host: FxHost,
  d: Deployable,
  choice: SkillChoice | undefined,
  fade: number,
  time: number,
): void {
  const an = d.kind === 'totem' ? choice?.skill.ancestral : undefined;
  if (an) ancestral(g, host, d, an.range, d.active === true, fade, time);
  if (d.kind === 'mine' && d.aura) aura(g, host, d, d.aura, fade, time);
}

/** The reach of a war-cry totem: a faint ring while it is idle, a brighter ring with ticks turning and a lit mark over it while it is active. */
function ancestral(
  g: Gfx,
  host: FxHost,
  d: Deployable,
  range: number,
  active: boolean,
  fade: number,
  time: number,
): void {
  const color = 0xffc060;
  const p = host.project(d.x, d.y);
  const rx = host.rpx(range);
  const sq = host.squash();
  g.lineStyle(1, color, (active ? 0.4 : 0.12) * fade).strokeEllipse(p.x, p.y, rx * 2, rx * 2 * sq);
  if (!active) return;
  g.fillStyle(color, 0.04 * fade).fillEllipse(p.x, p.y, rx * 2, rx * 2 * sq);
  g.fillStyle(lighten(color, 0.4), 0.7 * fade);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + time * 0.5;
    g.fillRect(p.x + Math.cos(a) * rx - 1, p.y + Math.sin(a) * rx * sq - 1, 2, 2);
  }
  // A lit mark over the totem's top: it is giving its buff.
  const pulse = 0.7 + 0.3 * Math.sin(time * 6 + d.id);
  const y = p.y - 31;
  g.lineStyle(1.5, lighten(color, 0.5), 0.9 * fade * pulse)
    .lineBetween(p.x - 4, y, p.x + 4, y)
    .lineBetween(p.x, y - 4, p.x, y + 4);
}

/** A mine's aura: a faint ring at its radius with chevrons turning slowly, pointing in. */
function aura(
  g: Gfx,
  host: FxHost,
  d: Deployable,
  a: NonNullable<Deployable['aura']>,
  fade: number,
  time: number,
): void {
  const color = auraColor(a);
  const p = host.project(d.x, d.y);
  // A little inside the ring that sets the mine off (the two radii may be equal).
  const rx = host.rpx(a.radius) * 0.97;
  const sq = host.squash();
  g.lineStyle(1, color, 0.16 * fade).strokeEllipse(p.x, p.y, rx * 2, rx * 2 * sq);
  g.fillStyle(lighten(color, 0.2), 0.6 * fade);
  const n = 10;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 - time * 0.3;
    const cx = Math.cos(ang);
    const cy = Math.sin(ang) * sq;
    const x = p.x + cx * rx;
    const y = p.y + cy * rx;
    // Base on the ring, apex toward the mine.
    g.fillTriangle(
      x - cy * 2.2,
      y + cx * sq * 2.2,
      x + cy * 2.2,
      y - cx * sq * 2.2,
      x - cx * 4.5,
      y - cy * 4.5,
    );
  }
}
