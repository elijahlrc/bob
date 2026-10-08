import { spawnBeside } from './factions';
import type { Actor, World } from './types';

/**
 * Phases (docs/ROSTER.md 6.5): a thing a type does once when its life falls to a share. Champions have always been scripted
 * by life; this opens the same to any type, as data (`MonsterTypeDef.phases`).
 */
export function tickPhases(w: World, m: Actor): void {
  const list = m.mon?.kind.phases;
  if (!list) return;
  const frac = m.life / m.def.maxLife;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (m.phaseMask & (1 << i) || frac > p.at) continue;
    m.phaseMask |= 1 << i;
    switch (p.do) {
      case 'enrage':
        m.enraged = true;
        break;
      case 'flee':
        m.fleeT = Math.max(m.fleeT, p.seconds ?? 4);
        break;
      case 'split':
        for (let k = 0; k < (p.count ?? 3); k++) if (p.into) spawnBeside(w, m, p.into, 0.9);
        break;
    }
  }
}
