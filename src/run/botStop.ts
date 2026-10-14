import { EQUIP_SLOTS, type Item } from '../data/types';
import { HOARD_TAKE } from '../data/stops';
import {
  awlsmithItems,
  cartProblem,
  hoardGems,
  hoardKinds,
  saleStock,
  shrineBlessings,
  stopProblem,
  takeStop,
  type StopChoice,
} from './stops';
import type { RunState } from './run';
import { provisionDef } from '../data/provisions';
import { reprieveBlocker } from './reprieves';

/**
 * What the headless bot does at a stop (docs/WAYSIDE.md 9.3). A first valuation only: the Awlsmith bores the worn item that
 * already holds the most sockets (the bot keeps all its gems on one item), and the Gem Hoard takes gems the run does not hold.
 * The measured valuation is milestone Y7.
 */
export function botStopChoice(run: RunState, slot: number): StopChoice | null {
  const offer = run.offers[slot];
  if (!offer || offer.kind !== 'stop') return null;
  let choice: StopChoice | null = null;
  if (offer.stop === 'awlsmith') {
    const worn = new Set(EQUIP_SLOTS.map((s) => run.build.equipment[s]?.uid));
    const best = awlsmithItems(run)
      .filter((it: Item) => worn.has(it.uid))
      .sort((a, b) => b.sockets.length - a.sockets.length)[0];
    if (best) choice = { stop: 'awlsmith', itemUid: best.uid };
  } else if (offer.stop === 'gemHoard') {
    const held = new Set<string>();
    for (const it of run.inventory) if (it.kind === 'gem') held.add(it.gemId);
    for (const it of Object.values(run.build.equipment))
      for (const g of it?.sockets ?? []) if (g) held.add(g.gemId);
    let top: { tag: string; fresh: string[]; laid: string[] } | null = null;
    for (const k of hoardKinds(run, offer)) {
      const laid = hoardGems(run, offer, k.tag);
      const fresh = laid.filter((g) => !held.has(g));
      if (!top || fresh.length > top.fresh.length) top = { tag: k.tag, fresh, laid };
    }
    if (top) {
      const picks = [...top.fresh, ...top.laid.filter((g) => !top!.fresh.includes(g))].slice(
        0,
        Math.min(HOARD_TAKE, top.laid.length),
      );
      choice = { stop: 'gemHoard', tag: top.tag, picks };
    }
  } else if (offer.stop === 'shrine') {
    const ids = shrineBlessings(run, offer);
    const order = ['fury', 'vigour', 'cadence', 'ward', 'grit', 'swift', 'fortune'];
    const best = order.find((id) => ids.includes(id as never)) ?? ids[0];
    choice = { stop: 'shrine', blessing: best };
  } else if (offer.stop === 'quartermaster') {
    // The Reprieve if it is affordable and none is held, then the staples that fit the Pouch and the budget.
    const stock = saleStock(run, offer);
    const buy: string[] = [];
    let left = run.dust;
    const rep = stock.find((w) => w.kind === 'reprieve');
    if (rep && rep.price <= left && reprieveBlocker(run) === null) {
      buy.push(rep.id);
      left -= rep.price;
    }
    for (const w of stock) {
      if (w.kind !== 'provision' || provisionDef(w.ref!).kind !== 'staple') continue;
      if (w.price <= left && cartProblem(run, stock, [...buy, w.id]) === null) {
        buy.push(w.id);
        left -= w.price;
      }
    }
    if (buy.length) choice = { stop: 'quartermaster', buy };
  } else if (offer.stop === 'ferryman') {
    // A Revive if one is on offer (the bot does not swap what it holds).
    if (reprieveBlocker(run) === null) choice = { stop: 'ferryman', reprieve: 'lastSpark' };
  }
  return choice && stopProblem(run, slot, choice) === null ? choice : null;
}

/** Whether the default bot would rather spend the level at this stop than play the best map (a first guess; Y7 measures it). */
export function botWantsStop(run: RunState, slot: number): boolean {
  const offer = run.offers[slot];
  if (!offer || offer.kind !== 'stop' || botStopChoice(run, slot) === null) return false;
  // A socket on the item that holds the gems is worth a level, and so is insurance (a Reprieve bought at the Quartermaster, or
  // given by the Ferryman); a handful of gems of a chosen kind and a blessing are not.
  if (offer.stop === 'ferryman') return true;
  if (offer.stop === 'quartermaster') {
    const choice = botStopChoice(run, slot);
    return (
      choice?.stop === 'quartermaster' &&
      choice.buy.some((id) => saleStock(run, offer).find((w) => w.id === id)?.kind === 'reprieve')
    );
  }
  return offer.stop === 'awlsmith';
}

/** Take the stop in a slot as the bot would; false if there is nothing valid to do there. */
export function botTakeStop(run: RunState, slot: number): boolean {
  const choice = botStopChoice(run, slot);
  return choice !== null && takeStop(run, slot, choice).ok;
}
