import { Rng } from '../core/rng';
import { flaskBase } from '../data/flasks';
import { MARKET_SIZE, priceAt, WARE_BASE } from '../data/market';
import { PROVISIONS, type ProvisionId } from '../data/provisions';
import { addProvision, pouchCount } from './provisions';
import { acquireReprieve, reprieveBlocker, reprieveOnSale } from './reprieves';
import { reprieveDef, type ReprieveId } from '../data/reprieves';
import { POUCH_LIMIT } from '../data/provisions';
import type { Item } from '../data/types';
import { rollCurrencyBundle } from '../gen/currencyDrops';
import { rollDrop, rollFlask, rollGem } from '../gen/loot';
import type { CraftResult } from './craft';
import { noteFound } from './found';
import type { RunState } from './run';
import { stash, uidSource } from './run';
import { waysideOf, type Ware } from './wayside';

/** How a stock is laid out: a ware for each slot, in this order. A slot the build cannot fill yet is filled by the next kind. */
const MARKET_SLOTS = ['gear', 'gear', 'gem', 'flask', 'provision', 'currency'] as const;

type Slot = (typeof MARKET_SLOTS)[number];

/** Stock items carry a negative uid until they are bought (a real uid comes from the run's counter, so the roll never moves it). */
function tempUid(): () => number {
  let n = 0;
  return () => -++n;
}

function heldGems(run: RunState): Set<string> {
  const held = new Set<string>();
  for (const it of run.inventory) if (it.kind === 'gem') held.add(it.gemId);
  for (const it of Object.values(run.build.equipment))
    for (const g of it?.sockets ?? []) if (g) held.add(g.gemId);
  return held;
}

/** What one slot holds on a level: drawn from the run seed and the level, so a reload shows the same stock. */
function ware(run: RunState, slot: Slot, index: number, rng: Rng, off = 0): Ware {
  const level = run.map;
  const uid = tempUid();
  const price = (base: number) => Math.max(1, Math.round(priceAt(base, level) * (1 - off)));
  switch (slot) {
    case 'gem': {
      const held = heldGems(run);
      let gem = rollGem(rng, uid, { classId: run.build.classId, ilvl: level });
      for (let i = 0; i < 12 && held.has(gem.gemId); i++)
        gem = rollGem(rng, uid, { classId: run.build.classId, ilvl: level });
      return { id: String(index), kind: 'gem', price: price(WARE_BASE.gem), item: gem };
    }
    case 'flask': {
      let flask = rollFlask(rng, uid, level, 1);
      for (let i = 0; i < 10 && flaskBase(flask.baseId).kind !== 'utility'; i++)
        flask = rollFlask(rng, uid, level, 1);
      return { id: String(index), kind: 'flask', price: price(WARE_BASE.flask), item: flask };
    }
    case 'provision': {
      const open = PROVISIONS.filter((p) => p.from <= level);
      const p = rng.weighted(open, (x) => x.weight);
      return {
        id: String(index),
        kind: 'provision',
        price: price(p.base),
        ref: p.id,
      };
    }
    case 'currency': {
      // Some levels the last slot holds a Reprieve instead (docs/WAYSIDE.md 7.4).
      const sale = reprieveOnSale(run.seed, level);
      if (sale)
        return {
          id: String(index),
          kind: 'reprieve',
          price: price(reprieveDef(sale).base),
          ref: sale,
        };
      const bundle = rollCurrencyBundle(rng, uid, level);
      return {
        id: String(index),
        kind: 'currency',
        price: price(WARE_BASE.currency),
        ref: bundle.id,
        count: bundle.count,
      };
    }
    default: {
      let item = rollDrop(
        rng,
        uid,
        { ilvl: level, monster: 'rare', classId: run.build.classId },
        true,
      );
      for (let i = 0; i < 5 && item.kind !== 'item'; i++)
        item = rollDrop(
          rng,
          uid,
          { ilvl: level, monster: 'rare', classId: run.build.classId },
          true,
        );
      return { id: String(index), kind: 'gear', price: price(WARE_BASE.gear), item };
    }
  }
}

/** The Market's stock for the level the run is about to play. */
export function rollMarket(run: RunState): Ware[] {
  const rng = new Rng(run.seed).fork(`market${run.map}`);
  return MARKET_SLOTS.slice(0, MARKET_SIZE).map((slot, i) => ware(run, slot, i, rng));
}

/** Roll the stock for the level the run is on, unless it already holds it (the controller calls this when a level begins). */
export function ensureMarket(run: RunState): Ware[] {
  const w = waysideOf(run);
  if (w.marketLevel !== run.map || !w.market.length) {
    w.market = rollMarket(run);
    w.marketLevel = run.map;
  }
  return w.market;
}

/** What a ware is called on a card. */
export function wareName(it: Ware): string {
  if (it.item) return it.item.kind === 'gem' ? it.item.gemId : (it.item as Item).name;
  return it.ref ?? '';
}

/** Buy a ware of the current stock: the Dust is paid and the ware joins the run. */
export function buyWare(run: RunState, id: string): CraftResult {
  const stock = ensureMarket(run);
  const ware = stock.find((x) => x.id === id);
  if (!ware) return { ok: false, reason: 'No such ware' };
  if (ware.sold) return { ok: false, reason: 'Already bought' };
  if (run.dust < ware.price) return { ok: false, reason: 'Not enough Bone Dust' };
  if (ware.kind === 'provision' && pouchCount(run) >= POUCH_LIMIT)
    return { ok: false, reason: 'Your pouch is full' };
  if (ware.kind === 'reprieve') {
    const why = reprieveBlocker(run);
    if (why) return { ok: false, reason: why };
  }
  run.dust -= ware.price;
  ware.sold = true;
  if (ware.item) {
    const bought = { ...ware.item, uid: uidSource(run)() };
    run.inventory.push(bought);
    noteFound(run, bought);
  } else if (ware.kind === 'reprieve' && ware.ref) {
    acquireReprieve(run, ware.ref as ReprieveId);
  } else if (ware.kind === 'provision' && ware.ref) {
    addProvision(run, ware.ref as ProvisionId);
  } else if (ware.kind === 'currency' && ware.ref) {
    stash(run, { kind: 'currency', uid: uidSource(run)(), id: ware.ref, count: ware.count ?? 1 });
  }
  return { ok: true };
}
