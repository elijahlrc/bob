import { Character } from '../calc/character';
import { CAMP_REST_SECONDS } from '../data/constants';
import type { Build } from '../data/types';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Vitals } from '../sim/types';

/**
 * What camp does for a character between maps (docs/MAPS.md section 8.2): life, mana and energy shield recover
 * what they would in `seconds` of sitting still, using the same regeneration and recharge numbers the sim reads.
 * Not counted: leech (it needs hits), flask effects, damage over time. Flasks gain charges only from kills (the
 * game has no time-based charge gain), so they come back unchanged.
 */
export function restAtCamp(
  build: Build,
  map: number,
  from: Vitals,
  seconds = CAMP_REST_SECONDS,
): Vitals {
  const ch = new Character(build, { areaLevel: map, resistPenalty: resistPenaltyForMap(map) });
  const def = ch.defence();
  const lifeCap = Math.max(1, def.maxLife - ch.reservedLife);
  const manaCap = Math.max(0, def.maxMana - ch.reservedMana);
  let life = from.life * lifeCap;
  let mana = from.mana * manaCap;
  let es = from.es * def.maxEs;
  if (def.lifeRegen > 0) {
    if (def.regenToEs) es = Math.min(def.maxEs, es + def.lifeRegen * seconds);
    else life = Math.min(lifeCap, life + def.lifeRegen * seconds);
  }
  mana = Math.min(manaCap, mana + def.manaRegen * seconds);
  // Energy shield recharges once the delay has passed, as in the sim.
  if (def.maxEs > 0)
    es = Math.min(def.maxEs, es + def.esRecharge * Math.max(0, seconds - def.esDelay));
  const frac = (value: number, max: number) => (max > 0 ? Math.min(1, value / max) : 1);
  return {
    life: frac(life, lifeCap),
    mana: frac(mana, manaCap),
    es: frac(es, def.maxEs),
    flasks: { ...from.flasks },
  };
}
