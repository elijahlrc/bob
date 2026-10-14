import { Rng } from '../core/rng';
import { ACTIVE_GEMS, SUPPORT_GEMS, gemDef } from '../data/gems';
import {
  HOARD_KINDS,
  HOARD_LAID,
  HOARD_TAKE,
  HOARD_TAGS,
  stopDef,
  type StopId,
} from '../data/stops';
import { EQUIP_SLOTS, type Item } from '../data/types';
import { gemWeight } from '../gen/loot';
import { restAtCamp } from './camp';
import { awlsmithSockets, socketCeiling, socketCost, type CraftResult } from './craft';
import { noteFound } from './found';
import type { MapOffer } from './offers';
import { advanceLevel, TOTAL_MAPS, uidSource, type RunState } from './run';
import { waysideOf } from './wayside';

/** What the player decided at a stop. The stop's screen builds one and `takeStop` applies it all at once, so nothing is half done. */
export type StopChoice =
  | { stop: 'awlsmith'; itemUid: number; extra?: number }
  | { stop: 'gemHoard'; tag: string; picks: string[] };

const fail = (reason: string): CraftResult => ({ ok: false, reason });

// ---- The Awlsmith ----------------------------------------------------------------------------------

/** The items the Awlsmith can bore into: worn or carried, with room for a socket. */
export function awlsmithItems(run: RunState): Item[] {
  const worn = EQUIP_SLOTS.map((s) => run.build.equipment[s]).filter((x): x is Item => !!x);
  const carried = run.inventory.filter((x): x is Item => x.kind === 'item');
  return [...worn, ...carried].filter(
    (it) => !it.sealed && !it.fixedSockets && it.sockets.length < socketCeiling(it),
  );
}

/** The most sockets one visit can add to an item, and the Augers a given number costs (the first is free). */
export function awlsmithRoom(it: Item): number {
  return Math.max(0, socketCeiling(it) - it.sockets.length);
}
export function awlsmithCost(it: Item, added: number): number {
  return added <= 1 ? 0 : socketCost(it.sockets.length + 1, it.sockets.length + added);
}

// ---- The Gem Hoard ---------------------------------------------------------------------------------

/** The kinds of gem a gem hoard offers to name: four, drawn from the offer's own seed. */
export function hoardKinds(run: RunState, offer: MapOffer): { tag: string; name: string }[] {
  const rng = new Rng(run.seed).fork(`hoardkinds${offer.id}`);
  const pool = [...HOARD_TAGS];
  rng.shuffle(pool);
  return pool.slice(0, HOARD_KINDS);
}

/**
 * The gems laid out for a kind: active gems of that tag and the supports that can support such a skill, eight of them, drawn by
 * how often those gems drop. The same offer and kind lay out the same eight every time.
 */
export function hoardGems(run: RunState, offer: MapOffer, tag: string): string[] {
  const rng = new Rng(run.seed).fork(`hoardgems${offer.id}.${tag}`);
  const pool = [
    ...ACTIVE_GEMS.filter((g) => (g.tags as string[]).includes(tag)),
    ...SUPPORT_GEMS.filter((g) => (g.supports as string[]).includes(tag)),
  ];
  const out: string[] = [];
  const left = [...pool];
  while (out.length < HOARD_LAID && left.length) {
    const g = rng.weighted(left, (x) => Math.max(0.1, gemWeight(x, run.classId, 99)));
    out.push(g.id);
    left.splice(left.indexOf(g), 1);
  }
  return out;
}

// ---- Taking a stop ---------------------------------------------------------------------------------

/** Whether the stop in a slot can be taken with this choice: null when it can, else why not. */
export function stopProblem(run: RunState, slot: number, choice: StopChoice): string | null {
  const offer = run.offers[slot];
  if (run.phase !== 'camp') return 'not in camp';
  if (!offer || offer.kind !== 'stop' || offer.stop !== choice.stop) return 'no such stop';
  if (choice.stop === 'awlsmith') {
    const it = awlsmithItems(run).find((x) => x.uid === choice.itemUid);
    if (!it) return 'That item has no room for a socket';
    const extra = Math.max(0, Math.floor(choice.extra ?? 0));
    if (extra + 1 > awlsmithRoom(it)) return 'This item cannot have that many sockets';
    const need = awlsmithCost(it, extra + 1);
    if ((run.currency.auger ?? 0) < need) return `That needs ${need} Socket Augers`;
    return null;
  }
  const kinds = hoardKinds(run, offer).map((k) => k.tag);
  if (!kinds.includes(choice.tag)) return 'Name one of the four kinds';
  const laid = hoardGems(run, offer, choice.tag);
  const want = Math.min(HOARD_TAKE, laid.length);
  if (new Set(choice.picks).size !== choice.picks.length) return 'Take each gem once';
  if (choice.picks.length !== want) return `Take ${want} gems`;
  if (!choice.picks.every((g) => laid.includes(g))) return 'That gem is not laid out';
  return null;
}

/**
 * Take the stop in a slot with the choice made there. The level passes exactly as a Respite's does (the counter advances, no XP,
 * no clear rewards, no reward pick, no refund point), the character gets the usual few seconds of rest, and the next level's
 * offers are rolled. Nothing is applied unless the whole choice is valid.
 */
export function takeStop(run: RunState, slot: number, choice: StopChoice): CraftResult {
  const why = stopProblem(run, slot, choice);
  if (why) return fail(why);
  if (run.map >= TOTAL_MAPS) return fail('The last level has no stop');
  const offer = run.offers[slot];
  if (choice.stop === 'awlsmith') {
    const res = awlsmithSockets(run, choice.itemUid, choice.extra ?? 0);
    if (!res.ok) return res;
  } else {
    const uid = uidSource(run);
    for (const gemId of choice.picks) {
      const g = { kind: 'gem' as const, uid: uid(), gemId };
      run.inventory.push(g);
      noteFound(run, g);
    }
  }
  run.history.push({
    map: run.map,
    areaLevel: run.map,
    status: 'stop',
    stop: offer.stop,
    time: 0,
    levelAfter: run.build.level,
    kills: 0,
    stuck: 0,
  });
  waysideOf(run).stops++;
  run.vitals = restAtCamp(run.build, run.map, run.vitals);
  advanceLevel(run);
  return { ok: true };
}

/** What a stop is called on a card or in a record. */
export const stopName = (id: StopId): string => stopDef(id).name;

/** The gem's name for the Hoard screen. */
export const hoardGemName = (id: string): string => gemDef(id).name;
