import { lifeCap } from './combat';
import { reservedMana } from './reserve';
import type { Vitals, World } from './types';

/** What the player has left, as fractions of the maximum (docs/MAPS.md section 8.1). */
export function vitalsOf(w: World): Vitals {
  const p = w.player;
  const manaCap = Math.max(0, p.def.maxMana - reservedMana(w));
  const frac = (value: number, max: number) =>
    max > 0 ? Math.min(1, Math.max(0, value / max)) : 1;
  const flasks: Record<number, number> = {};
  // Flask activity (a recovery under way, a buff running) ends with the map; charges are what carries.
  for (const f of w.flasks) flasks[f.spec.uid] = frac(f.charges, f.spec.maxCharges);
  return {
    life: frac(p.life, lifeCap(w, p)),
    mana: frac(p.mana, manaCap),
    es: frac(p.es, p.def.maxEs),
    flasks,
  };
}
