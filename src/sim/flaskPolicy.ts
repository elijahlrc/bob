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
  let nearest = Infinity;
  // The surroundings only matter to a utility flask that could be drunk now: most ticks there is none.
  const wantsSurroundings = w.flasks.some(
    (f) => f.spec.kind === 'utility' && f.activeT <= 0 && f.charges >= f.spec.perUse,
  );
  if (wantsSurroundings) {
    let nearest2 = Infinity;
    for (const m of w.actors) {
      if (m.isPlayer || !m.alive) continue;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearest2) nearest2 = d2;
      if (d2 > 64) continue;
      nearby++;
      if (m.rarity === 'rare' || m.rarity === 'miniboss' || m.rarity === 'boss') nearbyRare = true;
    }
    nearest = Math.sqrt(nearest2);
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
    // A hybrid flask also refills mana: it is drunk for low mana as a mana flask is.
    if ((k === 'mana' || k === 'hybrid') && !f.queued && p.mana < 2 * cost) {
      if (f.activeT <= 0) out.push(i);
      return;
    }
    if (k === 'utility' && f.activeT <= 0) {
      if (f.spec.lifeToEs) {
        // It leaves you at 1 life for two seconds: drink it early, with a fight coming but no enemy
        // close, at nearly full life, and only if the energy shield can hold what comes back.
        const safe =
          nearest > 6 && nearest < 16 && p.life >= cap * 0.9 && p.def.maxEs >= p.life * 0.7;
        if (safe) out.push(i);
      } else if (nearbyRare || nearby >= 5) out.push(i);
    }
  });
  return out;
};
