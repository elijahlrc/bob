import { LOW_LIFE } from '../data/constants';
import type { World } from './types';

/**
 * Automatic flask use (§6.9). Replaceable later by manual input: the sim asks the policy which
 * flask indices to use this tick.
 */
export type FlaskPolicy = (w: World) => number[];

export const autoFlaskPolicy: FlaskPolicy = (w) => {
  const p = w.player;
  const out: number[] = [];
  const cap = Math.max(1, p.def.maxLife - w.char.reservedLife);
  const cost = w.primary.usable ? w.char.profile(w.primary).cost : 0;
  let nearbyRare = false;
  let nearby = 0;
  for (const m of w.actors) {
    if (m.isPlayer || !m.alive) continue;
    if (Math.hypot(m.x - p.x, m.y - p.y) > 8) continue;
    nearby++;
    if (m.rarity === 'rare' || m.rarity === 'miniboss' || m.rarity === 'boss') nearbyRare = true;
  }
  const lifeActive = w.flasks.some(
    (f) => (f.spec.kind === 'life' || f.spec.kind === 'hybrid') && (f.activeT > 0 || f.queued),
  );
  let usedLife = false;
  w.flasks.forEach((f, i) => {
    if (f.charges < f.spec.perUse) return;
    const k = f.spec.kind;
    if (
      (k === 'life' || k === 'hybrid') &&
      !usedLife &&
      !lifeActive &&
      p.life < cap * Math.max(0.5, LOW_LIFE)
    ) {
      out.push(i);
      usedLife = true;
      return;
    }
    if (k === 'mana' && !f.queued && p.mana < 2 * cost) {
      if (f.activeT <= 0) out.push(i);
      return;
    }
    if (k === 'utility' && f.activeT <= 0 && (nearbyRare || nearby >= 5)) out.push(i);
  });
  return out;
};
