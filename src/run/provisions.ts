import { Rng } from '../core/rng';
import {
  FORAGE_CHANCE,
  FORAGE_FROM,
  isReprieveId,
  POUCH_LIMIT,
  PROVISIONS,
  provisionAffixId,
  provisionDef,
  type ProvisionId,
} from '../data/provisions';
import type { ReprieveId } from '../data/reprieves';
import type { CraftResult } from './craft';
import type { MapOffer } from './offers';
import type { RunState } from './run';
import { standingAffixes } from './reprieves';
import { heldReward, waysideOf } from './wayside';

/** How many provisions the pouch can hold, and arm for one map: three, and two more with the Gravewarden's Satchel (docs/ATTRITION.md). */
export function pouchLimit(run: RunState): number {
  return POUCH_LIMIT + 2 * heldReward(run, 'deeperPouch');
}

/** How many provisions the pouch holds in all (a reprieve counts). */
export function pouchCount(run: RunState): number {
  return Object.values(waysideOf(run).pouch).reduce((n, c) => n + c, 0);
}

/** Whether the pouch has room for `n` more. */
export function pouchRoom(run: RunState, n = 1): boolean {
  return pouchCount(run) + n <= pouchLimit(run);
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
  if (w.armed.length >= pouchLimit(run))
    return { ok: false, reason: `Only ${pouchLimit(run)} can be armed for one map` };
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
 * Throw one of a provision away (a reprieve too), to make room in a full pouch for a pick's card. A spare one goes first;
 * when every one held is armed, one is disarmed with it. False when the pouch holds none.
 */
export function dropProvision(run: RunState, id: string): boolean {
  const w = waysideOf(run);
  const n = w.pouch[id] ?? 0;
  if (n <= 0) return false;
  if (n === 1) delete w.pouch[id];
  else w.pouch[id] = n - 1;
  if (w.armed.filter((x) => x === id).length > n - 1) w.armed.splice(w.armed.indexOf(id), 1);
  return true;
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

/**
 * The hidden map affixes the given provisions add to a map: one each (a reprieve has none), and each twice with Twice-Steeped
 * Dregs (relic 1.1: an affix listed twice counts twice everywhere it is read).
 */
export function provisionAffixes(ids: readonly string[], twice = false): string[] {
  const out = ids.filter((id) => !isReprieveId(id)).map(provisionAffixId);
  return twice ? out.flatMap((a) => [a, a]) : out;
}

/**
 * The Gleaner's Hook (relic 1.2): every level passed leaves a provision in the pouch, drawn from the seed and the level, as
 * foraging draws. Nothing when the pouch is full.
 */
export function glean(run: RunState): ProvisionId | null {
  if (!heldReward(run, 'gleanersHook') || !pouchRoom(run)) return null;
  const rng = new Rng(run.seed).fork(`glean${run.map}`);
  const open = PROVISIONS.filter((p) => p.kind !== 'reprieve' && p.from <= run.map);
  if (!open.length) return null;
  const pick = rng.weighted(open, (p) => p.weight).id;
  addProvision(run, pick);
  return pick;
}

/**
 * Every affix a map is played with: its own, the burning provisions' hidden ones, and the standing effects the character carries
 * (curses, a blessing). `ids` is what is burning (the map plan) or armed (the preview).
 */
export function mapAffixList(run: RunState, offer: MapOffer, ids: readonly string[]): string[] {
  return [
    ...offer.affixes,
    ...provisionAffixes(ids, heldReward(run, 'twiceSteeped') > 0),
    ...standingAffixes(run),
  ];
}

/** The offer's affixes with the armed provisions', the curses' and the blessing's on top: what the threat preview and the bot's scoring should read. */
export function affixesWithArmed(run: RunState, offer: MapOffer): string[] {
  return mapAffixList(run, offer, waysideOf(run).armed);
}
