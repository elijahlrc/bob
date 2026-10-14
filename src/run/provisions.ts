import {
  POUCH_LIMIT,
  PROVISIONS_PER_MAP,
  provisionAffixId,
  provisionDef,
  type ProvisionId,
} from '../data/provisions';
import type { CraftResult } from './craft';
import type { MapOffer } from './offers';
import type { RunState } from './run';
import { standingAffixes } from './reprieves';
import { affixThreat } from './threat';
import { waysideOf } from './wayside';

/** How many provisions the Pouch holds in all (every kind counted). */
export function pouchCount(run: RunState): number {
  return Object.values(waysideOf(run).pouch).reduce((n, c) => n + c, 0);
}

/** Put a provision in the Pouch (bought, or found). False when the Pouch is full. */
export function addProvision(run: RunState, id: ProvisionId): boolean {
  provisionDef(id);
  if (pouchCount(run) >= POUCH_LIMIT) return false;
  const pouch = waysideOf(run).pouch;
  pouch[id] = (pouch[id] ?? 0) + 1;
  return true;
}

/** How many of a provision are in the Pouch and not yet armed. */
export function spare(run: RunState, id: string): number {
  const w = waysideOf(run);
  return (w.pouch[id] ?? 0) - w.armed.filter((x) => x === id).length;
}

/** Arm a provision for the next map: up to two, each one taken from the Pouch when the map starts. */
export function armProvision(run: RunState, id: ProvisionId): CraftResult {
  const w = waysideOf(run);
  if (run.phase !== 'camp') return { ok: false, reason: 'not in camp' };
  if (spare(run, id) <= 0) return { ok: false, reason: 'You have none to arm' };
  if (w.armed.length >= PROVISIONS_PER_MAP)
    return { ok: false, reason: `Only ${PROVISIONS_PER_MAP} can be armed for one map` };
  w.armed.push(id);
  return { ok: true };
}

/** Take an armed provision off again (it stays in the Pouch). */
export function disarmProvision(run: RunState, id: ProvisionId): CraftResult {
  const w = waysideOf(run);
  const i = w.armed.indexOf(id);
  if (i < 0) return { ok: false, reason: 'That one is not armed' };
  w.armed.splice(i, 1);
  return { ok: true };
}

/**
 * The map starts: what is armed burns, whether or not the map is cleared (it is gone from the Pouch now), and goes on
 * working until the map ends. Returns what is burning.
 */
export function startProvisions(run: RunState): string[] {
  const w = waysideOf(run);
  w.active = [...w.armed];
  for (const id of w.armed) {
    w.pouch[id] = (w.pouch[id] ?? 1) - 1;
    if (w.pouch[id] <= 0) delete w.pouch[id];
  }
  w.armed = [];
  return w.active;
}

/** The map is over: nothing is burning any more. */
export function endProvisions(run: RunState): void {
  waysideOf(run).active = [];
}

/**
 * The hidden map affixes the given provisions add to an offer: a specialist adds its own only when the offer is the kind of map
 * it needs. They go on top of the offer's own affixes wherever a map's mods, rewards or threat are read.
 */
export function provisionAffixes(ids: readonly string[], offer: MapOffer): string[] {
  return ids
    .filter((id) => {
      const d = provisionDef(id);
      if (d.needsType && offer.type !== d.needsType) return false;
      return !d.needsAffix || offer.affixes.length > 0;
    })
    .map(provisionAffixId);
}

/** The affix a Counterweight cancels on an offer: the one that makes the map hardest (by the threat model's own reading), or null. */
export function cancelledAffix(offer: MapOffer, ids: readonly string[]): string | null {
  if (!ids.includes('counterweight') || !offer.affixes.length) return null;
  let worst = offer.affixes[0];
  let worstScore = -1;
  for (const id of offer.affixes) {
    const t = affixThreat([id], offer.areaLevel);
    const score = t.pressure * t.life * t.damage * (1 + t.gain.reduce((n, g) => n + g, 0));
    if (score > worstScore + 1e-9) {
      worst = id;
      worstScore = score;
    }
  }
  return worst;
}

/**
 * Every affix a map is played with: its own (less the one a Counterweight cancels), the burning provisions' hidden ones, and the
 * standing effects the character carries (curses, a blessing). `ids` is what is burning (the map plan) or armed (the preview).
 */
export function mapAffixList(run: RunState, offer: MapOffer, ids: readonly string[]): string[] {
  const cut = cancelledAffix(offer, ids);
  const own = cut ? offer.affixes.filter((a) => a !== cut) : offer.affixes;
  return [...own, ...provisionAffixes(ids, offer), ...standingAffixes(run)];
}

/** The offer's affixes with the armed provisions', the curses' and the blessing's on top: what the threat preview and the bot's scoring should read. */
export function affixesWithArmed(run: RunState, offer: MapOffer): string[] {
  return mapAffixList(run, offer, waysideOf(run).armed);
}
