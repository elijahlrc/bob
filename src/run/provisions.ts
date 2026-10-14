import { Rng } from '../core/rng';
import {
  FORAGE_CHANCE,
  FORAGE_FROM,
  isReprieveId,
  POUCH_LIMIT,
  PROVISIONS,
  PROVISIONS_PER_MAP,
  provisionAffixId,
  provisionDef,
  type ProvisionId,
} from '../data/provisions';
import type { ReprieveId } from '../data/reprieves';
import type { CraftResult } from './craft';
import type { MapOffer } from './offers';
import type { RunState } from './run';
import { standingAffixes } from './reprieves';
import { waysideOf } from './wayside';

/** How many provisions the pouch holds in all (a reprieve counts). */
export function pouchCount(run: RunState): number {
  return Object.values(waysideOf(run).pouch).reduce((n, c) => n + c, 0);
}

/** Whether the pouch has room for `n` more. */
export function pouchRoom(run: RunState, n = 1): boolean {
  return pouchCount(run) + n <= POUCH_LIMIT;
}

/** Put a provision in the pouch (found, picked, bought or given). False when the pouch is full. */
export function addProvision(run: RunState, id: ProvisionId): boolean {
  provisionDef(id);
  if (!pouchRoom(run)) return false;
  const pouch = waysideOf(run).pouch;
  pouch[id] = (pouch[id] ?? 0) + 1;
  return true;
}

/** How many of a provision are in the pouch and not yet armed. */
export function spare(run: RunState, id: string): number {
  const w = waysideOf(run);
  return (w.pouch[id] ?? 0) - w.armed.filter((x) => x === id).length;
}

/**
 * Arm a provision for the next map: any or all of the three in the pouch, each one taken from it when the map starts. A reprieve is
 * never armed; it is always ready.
 */
export function armProvision(run: RunState, id: ProvisionId): CraftResult {
  const w = waysideOf(run);
  if (run.phase !== 'camp') return { ok: false, reason: 'not in camp' };
  if (isReprieveId(id))
    return { ok: false, reason: 'A reprieve is always ready: there is nothing to arm' };
  if (spare(run, id) <= 0) return { ok: false, reason: 'You have none to arm' };
  if (w.armed.length >= PROVISIONS_PER_MAP)
    return { ok: false, reason: `Only ${PROVISIONS_PER_MAP} can be armed for one map` };
  w.armed.push(id);
  return { ok: true };
}

/** Take an armed provision off again (it stays in the pouch). */
export function disarmProvision(run: RunState, id: ProvisionId): CraftResult {
  const w = waysideOf(run);
  const i = w.armed.indexOf(id);
  if (i < 0) return { ok: false, reason: 'That one is not armed' };
  w.armed.splice(i, 1);
  return { ok: true };
}

/**
 * The map starts: what is armed burns, whether or not the map is cleared (it is gone from the pouch now), and goes on
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

/** The provisions a character carries that are reprieves, in the order they are used: a revive before a retreat. */
export const REPRIEVE_ORDER: readonly ReprieveId[] = ['lastSpark', 'bargainCoin', 'ferryToken'];
export function heldReprieveIds(run: RunState): ReprieveId[] {
  const pouch = waysideOf(run).pouch;
  const out: ReprieveId[] = [];
  for (const id of REPRIEVE_ORDER) for (let i = 0; i < (pouch[id] ?? 0); i++) out.push(id);
  return out;
}

/** The reprieves still ready after some have fired on this Crawl's earlier maps (each one fires once). */
export function readyReprieves(run: RunState, fired: readonly string[] = []): ReprieveId[] {
  const left = [...fired];
  return heldReprieveIds(run).filter((id) => {
    const at = left.indexOf(id);
    if (at < 0) return true;
    left.splice(at, 1);
    return false;
  });
}

/**
 * A cleared map may leave a provision in the pouch (docs/WAYSIDE.md 6.1): from level 3, with a fair chance, and the first time
 * for certain, so that every run meets the idea early. Nothing when the pouch is full. Returns what was found.
 */
export function forage(run: RunState): ProvisionId | null {
  const w = waysideOf(run);
  if (run.map < FORAGE_FROM || !pouchRoom(run)) return null;
  const rng = new Rng(run.seed).fork(`forage${run.map}`);
  if (w.seen.foraged && !rng.chance(FORAGE_CHANCE)) return null;
  const open = PROVISIONS.filter((p) => p.kind !== 'reprieve' && p.from <= run.map);
  const pick = rng.weighted(open, (p) => p.weight).id;
  w.seen.foraged = true;
  addProvision(run, pick);
  return pick;
}

/** The hidden map affixes the given provisions add to a map: one each (a reprieve has none). */
export function provisionAffixes(ids: readonly string[]): string[] {
  return ids.filter((id) => !isReprieveId(id)).map(provisionAffixId);
}

/**
 * Every affix a map is played with: its own, the burning provisions' hidden ones, and the standing effects the character carries
 * (curses, a blessing). `ids` is what is burning (the map plan) or armed (the preview).
 */
export function mapAffixList(run: RunState, offer: MapOffer, ids: readonly string[]): string[] {
  return [...offer.affixes, ...provisionAffixes(ids), ...standingAffixes(run)];
}

/** The offer's affixes with the armed provisions', the curses' and the blessing's on top: what the threat preview and the bot's scoring should read. */
export function affixesWithArmed(run: RunState, offer: MapOffer): string[] {
  return mapAffixList(run, offer, waysideOf(run).armed);
}
