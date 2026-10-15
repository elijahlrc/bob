import type { SkillProfile } from '../calc/skill';
import { fallOf } from '../calc/skillLook';
import { hit } from './combat';
import { scaleProfile } from './shots';
import type { Actor, RainSpot, SkillZone, World } from './types';

/**
 * A rain of arrows that has more arrows than the skill starts with (docs/SUPPORTS-PLAN.md 4.2). Geometry decides what an extra arrow is
 * worth, as in the reference game:
 *  - 'rings' (Rain of Arrows): the shower stays where it is and the extra arrows burst on rings round it. It reaches more ground, and
 *    an enemy under several of them is hit once. Alone against one enemy the extra arrows add nothing.
 *  - 'stack' (Blast Rain): the extra arrows are more explosions on the same place and every one hits. Each of the skill's explosions
 *    is worth `1 / count` of the use, so the default count deals what the skill always dealt.
 * At the skill's own count there is nothing to place: the zone is the one it always was (`null`).
 */
export function plantRain(
  w: World,
  p: SkillProfile,
  cx: number,
  cy: number,
  radius: number,
): { spots: RainSpot[]; stack: boolean; profile: SkillProfile } | null {
  const b = p.skill.behaviour;
  if (b.kind !== 'ground' || b.count === undefined) return null;
  const n0 = b.count;
  const n = Math.round(p.projectiles);
  if (n <= n0) return null;
  if (b.spread === 'stack') {
    const spots: RainSpot[] = [];
    for (let i = 0; i < n; i++) spots.push({ x: cx, y: cy, r: radius });
    return { spots, stack: true, profile: scaleProfile(p, 1 / n0) };
  }
  // Each arrow bursts over a share of the shower, and the extra ones go on rings just outside it.
  const a = radius / Math.sqrt(n0);
  const spots: RainSpot[] = [{ x: cx, y: cy, r: radius }];
  let left = n - n0;
  let ring = radius;
  const turn = w.rngTrig.float(0, Math.PI * 2);
  while (left > 0) {
    const room = Math.max(3, Math.floor((Math.PI * 2 * ring) / (1.8 * a)));
    const here = Math.min(left, room);
    for (let i = 0; i < here; i++) {
      const ang = turn + ((i + (ring > radius ? 0.5 : 0)) / here) * Math.PI * 2;
      const spot = w.grid.collide(cx + Math.cos(ang) * ring, cy + Math.sin(ang) * ring, 0.3);
      spots.push({ x: spot.x, y: spot.y, r: a });
    }
    left -= here;
    ring += 1.6 * a;
  }
  return { spots, stack: false, profile: p };
}

/** The pulse of a zone with several spots: an explosion at each, and each enemy under one is hit (once, or once for every spot it is under). */
export function pulseRain(w: World, owner: Actor, z: SkillZone, enemies: Actor[]): void {
  const spots = z.spots!;
  // The renderer draws the arrows coming down on a rain (VISUAL_LANGUAGE.md).
  const fall = fallOf(z.profile.skill.id, z.profile.skill.type);
  for (let i = 0; i < spots.length; i++) {
    const s = z.stack
      ? // The same place: show the explosions apart so that the eye counts them.
        {
          x: z.x + Math.cos(i * 2.4) * 0.5 * z.radius * Math.sqrt((i + 0.5) / spots.length),
          y: z.y + Math.sin(i * 2.4) * 0.5 * z.radius * Math.sqrt((i + 0.5) / spots.length),
          r: spots[i].r * 0.55,
        }
      : spots[i];
    w.events.push({
      t: 'explode',
      x: s.x,
      y: s.y,
      r: s.r,
      dtype: z.dtype,
      skill: z.profile.skill.id,
      ...(z.pulsed && z.pulsed > 1 ? { pulse: true } : {}),
      ...(fall ? { fall } : {}),
    });
  }
  for (const e of enemies) {
    for (const s of spots) {
      if (Math.hypot(e.x - s.x, e.y - s.y) > s.r + e.r) continue;
      hit(w, owner, e, z.profile, z.hand, Math.hypot(e.x - owner.x, e.y - owner.y));
      if (!z.stack) break;
    }
  }
}
