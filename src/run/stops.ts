import { Rng } from '../core/rng';
import { ACTIVE_GEMS, SUPPORT_GEMS, gemDef } from '../data/gems';
import {
  HOARD_KINDS,
  HOARD_LAID,
  HOARD_TAKE,
  HOARD_TAGS,
  knucklePrice,
  stopDef,
  SURGEON_FADE,
  SURGEON_MAX,
  SURGEON_OFFERED,
  SURGEON_TRADES,
  surgeonTrade,
  type KnuckleThrow,
  type StopId,
} from '../data/stops';
import { EQUIP_SLOTS, type Item } from '../data/types';
import { gemStart } from '../calc/gems';
import { gemWeight } from '../gen/loot';
import { restAtCamp } from './camp';
import { awlsmithDust, awlsmithSockets, socketCeiling, type CraftResult } from './craft';
import { noteFound } from './found';
import type { MapOffer } from './offers';
import { advanceLevel, TOTAL_MAPS, uidSource, type RunState } from './run';
import {
  grantRelic,
  heldReward,
  keptRelics,
  waysideOf,
  type StopVisit,
  type Ware,
} from './wayside';
import { grantShadeItem, shadeItems, type Shade } from './shades';
import { BOSS_RELIC_CHOICES, type RunRewardId } from '../data/runRewards';
import type { Mod } from '../mods/types';
import { knuckleCan, throwBones } from './craft';
import { BLESSING_LEVELS, BLESSINGS, SHRINE_CHOICES, type BlessingId } from '../data/blessings';
import { priceAt, REFILL_BASE, RESTOCK_BASE } from '../data/sale';
import { REPRIEVES, type ReprieveId } from '../data/reprieves';
import { grantWare, rollSale } from './sale';
import { pouchRoom } from './provisions';
import { acquireReprieve, addCurse, reprieveBlocker } from './reprieves';

/** What the player decided at a stop. The stop's screen builds one and `takeStop` applies it all at once, so nothing is half done. */
export type StopChoice =
  | { stop: 'awlsmith'; itemUid: number; extra?: number }
  | { stop: 'gemHoard'; tag: string; picks: string[] }
  | { stop: 'shrine'; blessing: string }
  | { stop: 'quartermaster'; buy: string[]; refill?: boolean }
  | { stop: 'ferryman'; reprieve: string }
  | { stop: 'surgeon'; trades: string[] }
  | { stop: 'knucklebone' }
  | { stop: 'enviousDead'; itemUid?: number; relic?: string }
  | { stop: 'remains'; itemUid: number };

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

/** The most sockets one visit can add to an item, and the Bone Dust a given number costs (the first is free). */
export function awlsmithRoom(it: Item): number {
  return Math.max(0, socketCeiling(it) - it.sockets.length);
}
export function awlsmithCost(it: Item, added: number): number {
  return added <= 1 ? 0 : awlsmithDust(it.sockets.length + 1, it.sockets.length + added);
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
  // Only gems the level could drop (gem levels, DESIGN.md Appendix A).
  const pool = [
    ...ACTIVE_GEMS.filter((g) => (g.tags as string[]).includes(tag)),
    ...SUPPORT_GEMS.filter((g) => (g.supports as string[]).includes(tag)),
  ].filter((g) => gemStart(g) <= offer.areaLevel);
  const out: string[] = [];
  const left = [...pool];
  while (out.length < HOARD_LAID && left.length) {
    const g = rng.weighted(left, (x) => Math.max(0.1, gemWeight(x, run.classId, offer.areaLevel)));
    out.push(g.id);
    left.splice(left.indexOf(g), 1);
  }
  return out;
}

// ---- Taking a stop ---------------------------------------------------------------------------------

// ---- The Shrine ------------------------------------------------------------------------------------

/** The blessings a Shrine offers: three, drawn from the offer's own seed. */
export function shrineBlessings(run: RunState, offer: MapOffer): BlessingId[] {
  const rng = new Rng(run.seed).fork(`shrine${offer.id}`);
  const pool = BLESSINGS.map((b) => b.id);
  rng.shuffle(pool);
  return pool.slice(0, SHRINE_CHOICES);
}

// ---- The Quartermaster -----------------------------------------------------------------------------

/**
 * The Quartermaster's wares for an offer: eight, the same every time they are looked at (run/sale.ts), and new ones after each
 * restock bought there.
 */
export function saleStock(run: RunState, offer: MapOffer): Ware[] {
  const n = waysideOf(run).restocks[offer.id] ?? 0;
  return rollSale(run, n ? `${offer.id}#${n}` : offer.id);
}

/** What the Quartermaster's services cost at this level (docs/ATTRITION.md): every flask refilled, and new wares. */
export const refillPrice = (run: RunState): number => priceAt(REFILL_BASE, run.map);
export const restockPrice = (run: RunState): number => priceAt(RESTOCK_BASE, run.map);

/** Buy a restock at the Quartermaster in a slot: paid at once, and the stock is new (what was in the cart goes back). */
export function restockQuartermaster(run: RunState, slot: number): CraftResult {
  const offer = run.offers[slot];
  if (run.phase !== 'camp' || offer?.kind !== 'stop' || offer.stop !== 'quartermaster')
    return fail('No Quartermaster here');
  const price = restockPrice(run);
  if (run.dust < price) return fail(`A restock costs ${price} Bone Dust`);
  run.dust -= price;
  const way = waysideOf(run);
  way.restocks[offer.id] = (way.restocks[offer.id] ?? 0) + 1;
  return { ok: true };
}

/** Why a cart of the Quartermaster's wares cannot be bought (null: it can), with the refill if it is asked for. */
export function cartProblem(
  run: RunState,
  stock: Ware[],
  ids: string[],
  refill = false,
): string | null {
  if (new Set(ids).size !== ids.length) return 'Take each ware once';
  const picked: Ware[] = [];
  for (const id of ids) {
    const w = stock.find((x) => x.id === id);
    if (!w) return 'No such ware';
    picked.push(w);
  }
  const total = picked.reduce((n, w) => n + w.price, 0) + (refill ? refillPrice(run) : 0);
  if (total > run.dust) return `That costs ${total} Bone Dust`;
  // Provisions and reprieves share the pouch of three.
  const carried = picked.filter((w) => w.kind === 'provision' || w.kind === 'reprieve').length;
  if (!pouchRoom(run, carried)) return 'Your pouch cannot hold that many';
  return null;
}

/** The Dust a cart costs. */
export const cartCost = (stock: Ware[], ids: string[]): number =>
  ids.reduce((n, id) => n + (stock.find((w) => w.id === id)?.price ?? 0), 0);

// ---- The Surgeon -----------------------------------------------------------------------------------

/** The trades a Surgeon offers: four, drawn from the offer's own seed. */
export function surgeonTrades(run: RunState, offer: MapOffer): string[] {
  const rng = new Rng(run.seed).fork(`surgeon${offer.id}`);
  const pool = SURGEON_TRADES.map((t) => t.id);
  rng.shuffle(pool);
  return pool.slice(0, SURGEON_OFFERED);
}

/** The mods a run of trades puts on the character: each trade's price whole, its gain less by `SURGEON_FADE` for each before it. */
export function surgeonMods(trades: readonly string[]): Mod[] {
  return trades.flatMap((id, k) => {
    const t = surgeonTrade(id);
    if (!t) return [];
    const keep = 1 - SURGEON_FADE * k;
    return [
      ...t.gain.map((m) => ({ ...m, value: Math.max(1, Math.round(m.value * keep)) })),
      ...t.price.map((m) => ({ ...m })),
    ];
  });
}

// ---- The Knucklebone Man ---------------------------------------------------------------------------

/** The items the bones can be thrown over: worn or carried, neither unique nor sealed, with something a throw could change. */
export function knuckleItems(run: RunState): Item[] {
  const worn = EQUIP_SLOTS.map((s) => run.build.equipment[s]).filter((x): x is Item => !!x);
  const carried = run.inventory.filter((x): x is Item => x.kind === 'item');
  return [...worn, ...carried].filter((it) => knuckleCan(it, run.map));
}

/**
 * Whether a stop's visit holds the level (docs/ATTRITION.md): once a throw is made or the duel fought, leaving the stop passes the
 * level, as the Respite does after a craft. A shade only drawn holds nothing.
 */
export const visitLocked = (v: StopVisit | null): boolean =>
  !!v && ((v.throws ?? 0) > 0 || !!v.duel);

/** The throws made this visit at the stop in a slot. */
const throwsAt = (run: RunState, slot: number): number => {
  const v = waysideOf(run).stopVisit;
  return v && v.slot === slot ? (v.throws ?? 0) : 0;
};

/** What the next throw of this visit costs over an item: more for each throw, by the item's level. */
export function knuckleCost(run: RunState, it: Item, slot: number): number {
  return priceAt(knucklePrice(throwsAt(run, slot)), it.ilvl);
}

/** Why the bones cannot be thrown over an item now (null: they can). */
export function knuckleProblem(run: RunState, slot: number, itemUid: number): string | null {
  const offer = run.offers[slot];
  if (run.phase !== 'camp' || offer?.kind !== 'stop' || offer.stop !== 'knucklebone')
    return 'No Knucklebone Man here';
  const visit = waysideOf(run).stopVisit;
  if (visit && visit.slot !== slot && visitLocked(visit)) return 'No Knucklebone Man here';
  const it = knuckleItems(run).find((x) => x.uid === itemUid);
  if (!it) return 'The bones can do nothing with that item';
  const cost = knuckleCost(run, it, slot);
  if (run.dust < cost) return `A throw costs ${cost} Bone Dust`;
  return null;
}

/** Throw the bones over an item: paid, done, and counted; the visit then belongs to this level (leaving passes it). */
export function knuckleThrow(
  run: RunState,
  slot: number,
  itemUid: number,
): CraftResult & { what?: KnuckleThrow } {
  const why = knuckleProblem(run, slot, itemUid);
  if (why) return fail(why);
  const cost = knuckleCost(
    run,
    knuckleItems(run).find((x) => x.uid === itemUid)!,
    slot,
  );
  const throws = throwsAt(run, slot);
  const res = throwBones(run, itemUid);
  if (!res.ok) return res;
  run.dust -= cost;
  waysideOf(run).stopVisit = { slot, throws: throws + 1 };
  return res;
}

// ---- The rivals stops: the Envious Dead and Another's Remains --------------------------------------

/** The shade of a rivals stop's visit, if one was drawn for this slot. */
export function visitShade(run: RunState, slot: number): Shade | null {
  const v = waysideOf(run).stopVisit;
  return v && v.slot === slot && v.shade ? v.shade : null;
}

/**
 * Keep the shade a rivals stop is made of for this visit (drawn by `pickShade` from what was fetched): from then on the stop's
 * screen stays open and a reload finds the same one. The level does not pass until the stop is taken.
 */
export function openShade(run: RunState, slot: number, shade: Shade): CraftResult {
  const offer = run.offers[slot];
  if (run.phase !== 'camp' || offer?.kind !== 'stop' || !stopDef(offer.stop!).rivals)
    return fail('No such stop');
  const way = waysideOf(run);
  if (way.stopVisit && way.stopVisit.slot !== slot && visitLocked(way.stopVisit))
    return fail('Another stop is open');
  if (way.stopVisit?.slot === slot && way.stopVisit.shade) return { ok: true };
  way.stopVisit = { slot, shade };
  return { ok: true };
}

/** The relics a win against the Envious Dead offers: three the run can still take, from the offer's own seed. */
export function enviousRelics(run: RunState, offer: MapOffer): string[] {
  const rng = new Rng(run.seed).fork(`envious${offer.id}`);
  return keptRelics(run, `envious${offer.id}`, rng, BOSS_RELIC_CHOICES);
}

/** The seed of the Envious Dead's duel: fixed by the offer, so a reload fights the same fight. */
export const enviousSeed = (run: RunState, offer: MapOffer): number =>
  new Rng(run.seed).fork(`envious-duel${offer.id}`).nextU32();

/** Record the Envious Dead's duel: under way (before it starts, so it cannot be fled), then won or lost. */
export function markDuel(run: RunState, slot: number, duel: 'fought' | 'won' | 'lost'): void {
  const v = waysideOf(run).stopVisit;
  if (v && v.slot === slot) v.duel = duel;
}

// ---- Taking a stop ---------------------------------------------------------------------------------

/** Whether the stop in a slot can be taken with this choice: null when it can, else why not. */
export function stopProblem(run: RunState, slot: number, choice: StopChoice): string | null {
  const offer = run.offers[slot];
  if (run.phase !== 'camp') return 'not in camp';
  if (!offer || offer.kind !== 'stop' || offer.stop !== choice.stop) return 'no such stop';
  switch (choice.stop) {
    case 'awlsmith': {
      const it = awlsmithItems(run).find((x) => x.uid === choice.itemUid);
      if (!it) return 'That item has no room for a socket';
      const extra = Math.max(0, Math.floor(choice.extra ?? 0));
      if (extra + 1 > awlsmithRoom(it)) return 'This item cannot have that many sockets';
      const need = awlsmithCost(it, extra + 1);
      if (run.dust < need) return `That needs ${need} Bone Dust`;
      return null;
    }
    case 'gemHoard': {
      const kinds = hoardKinds(run, offer).map((k) => k.tag);
      if (!kinds.includes(choice.tag)) return 'Name one of the four kinds';
      const laid = hoardGems(run, offer, choice.tag);
      const want = Math.min(HOARD_TAKE, laid.length);
      if (new Set(choice.picks).size !== choice.picks.length) return 'Take each gem once';
      if (choice.picks.length !== want) return `Take ${want} gems`;
      if (!choice.picks.every((g) => laid.includes(g))) return 'That gem is not laid out';
      return null;
    }
    case 'shrine':
      return shrineBlessings(run, offer).includes(choice.blessing as BlessingId)
        ? null
        : 'Choose one of the three blessings';
    case 'quartermaster':
      return cartProblem(run, saleStock(run, offer), choice.buy, choice.refill);
    case 'ferryman': {
      if (!REPRIEVES.some((r) => r.id === choice.reprieve)) return 'Choose one of the reprieves';
      return reprieveBlocker(run);
    }
    case 'surgeon': {
      const offered = surgeonTrades(run, offer);
      if (choice.trades.length < 1) return 'Choose a trade';
      if (choice.trades.length > SURGEON_MAX) return `At most ${SURGEON_MAX} trades`;
      if (!choice.trades.every((t) => offered.includes(t))) return 'That trade is not offered';
      return null;
    }
    case 'knucklebone': {
      const v = waysideOf(run).stopVisit;
      return v && v.slot !== slot && visitLocked(v) ? 'no such stop' : null;
    }
    case 'enviousDead': {
      const shade = visitShade(run, slot);
      if (!shade) return 'No shade here';
      const duel = waysideOf(run).stopVisit?.duel;
      // A duel left before it ended (a reload) counts as lost.
      if (duel === 'lost' || duel === 'fought') return null;
      if (duel !== 'won') return 'Fight the shade first';
      if (!shadeItems(shade).some((it) => it.uid === choice.itemUid))
        return 'Choose one of its items';
      if (
        enviousRelics(run, offer).length &&
        !enviousRelics(run, offer).includes(choice.relic ?? '')
      )
        return 'Choose a relic';
      return null;
    }
    case 'remains': {
      const shade = visitShade(run, slot);
      if (!shade) return 'No remains here';
      return shadeItems(shade).some((it) => it.uid === choice.itemUid)
        ? null
        : 'Choose one of the items';
    }
  }
}

/**
 * Take the stop in a slot with the choice made there. The level passes exactly as a Respite's does (the counter advances, no XP,
 * no clear rewards, no reward pick, no refund point), the character gets the usual few seconds of rest, and the next level's
 * offers are rolled. Nothing is applied unless the whole choice is valid. A Shrine replaces the blessing held; the Quartermaster
 * (if asked) and the Bloodletter refill the flasks.
 */
export function takeStop(run: RunState, slot: number, choice: StopChoice): CraftResult {
  const why = stopProblem(run, slot, choice);
  if (why) return fail(why);
  if (run.map >= TOTAL_MAPS) return fail('The last level has no stop');
  const offer = run.offers[slot];
  const way = waysideOf(run);
  let refill = false;
  switch (choice.stop) {
    case 'awlsmith': {
      const res = awlsmithSockets(run, choice.itemUid, choice.extra ?? 0);
      if (!res.ok) return res;
      break;
    }
    case 'gemHoard': {
      const uid = uidSource(run);
      for (const gemId of choice.picks) {
        const g = { kind: 'gem' as const, uid: uid(), gemId };
        run.inventory.push(g);
        noteFound(run, g);
      }
      break;
    }
    case 'shrine':
      way.blessing = choice.blessing;
      way.blessingUntil = run.map + BLESSING_LEVELS;
      break;
    case 'quartermaster': {
      const stock = saleStock(run, offer);
      run.dust -= cartCost(stock, choice.buy) + (choice.refill ? refillPrice(run) : 0);
      refill = !!choice.refill;
      for (const id of choice.buy)
        grantWare(
          run,
          stock.find((w) => w.id === id)!,
        );
      break;
    }
    case 'ferryman':
      acquireReprieve(run, choice.reprieve as ReprieveId);
      addCurse(run, 'bargain');
      // He fills the flasks from the river (docs/ATTRITION.md).
      refill = true;
      break;
    case 'surgeon':
      run.build = {
        ...run.build,
        grafts: [...(run.build.grafts ?? []), ...surgeonMods(choice.trades)],
      };
      break;
    case 'knucklebone':
      // The throws were made during the visit; leaving passes the level.
      break;
    case 'enviousDead':
      if (way.stopVisit?.duel === 'won') {
        grantShadeItem(
          run,
          shadeItems(visitShade(run, slot)!).find((it) => it.uid === choice.itemUid)!,
        );
        if (choice.relic) grantRelic(run, choice.relic as RunRewardId);
      }
      break;
    case 'remains':
      grantShadeItem(
        run,
        shadeItems(visitShade(run, slot)!).find((it) => it.uid === choice.itemUid)!,
      );
      break;
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
  way.stops++;
  run.vitals = restAtCamp(run.build, run.map, run.vitals);
  // A Waystation Cup refills them at every stop (docs/ATTRITION.md).
  if (refill || heldReward(run, 'waystationCup') > 0) run.vitals = { ...run.vitals, flasks: {} };
  advanceLevel(run);
  return { ok: true };
}

/** What a stop is called on a card or in a record. */
export const stopName = (id: StopId): string => stopDef(id).name;

/** The gem's name for the Hoard screen. */
export const hoardGemName = (id: string): string => gemDef(id).name;
