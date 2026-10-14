import { Rng } from '../core/rng';
import { flaskBase } from '../data/flasks';
import {
  MARKET_SIZE,
  priceAt,
  QUARTERMASTER_OFF,
  QUARTERMASTER_SIZE,
  WARE_BASE,
} from '../data/market';
import { PROVISIONS, type ProvisionId } from '../data/provisions';
import { addProvision, pouchCount } from './provisions';
import { acquireReprieve, reprieveBlocker, reprieveOnSale } from './reprieves';
import { REPRIEVE_FROM, REPRIEVES, reprieveDef, type ReprieveId } from '../data/reprieves';
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

/** The Quartermaster's: twelve wares, a Reprieve among them from level 20 (docs/WAYSIDE.md 5.2). */
const SALE_SLOTS = [
  'gear',
  'gear',
  'gear',
  'gem',
  'gem',
  'flask',
  'provision',
  'provision',
  'provision',
  'bundle',
  'bundle',
  'reprieve',
] as const;

type Slot = (typeof MARKET_SLOTS)[number] | (typeof SALE_SLOTS)[number];

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
    case 'reprieve': {
      const r = rng.weighted(REPRIEVES, (x) => x.weight);
      return { id: String(index), kind: 'reprieve', price: price(r.base), ref: r.id };
    }
    case 'currency':
    case 'bundle': {
      // Some levels the Market's last slot holds a Reprieve instead (docs/WAYSIDE.md 7.4).
      const sale = slot === 'currency' ? reprieveOnSale(run.seed, level) : null;
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

/**
 * The Quartermaster's stock for the offer at hand (docs/WAYSIDE.md 5.2): twelve wares a quarter off, a Reprieve among them from
 * level 20. Drawn from the run seed, the level and the offer, so it is the same every time it is looked at.
 */
export function rollSale(run: RunState, offerId: string): Ware[] {
  const rng = new Rng(run.seed).fork(`sale${offerId}`);
  const slots = SALE_SLOTS.slice(0, QUARTERMASTER_SIZE).map((s) =>
    s === 'reprieve' && run.map < REPRIEVE_FROM ? 'gear' : s,
  );
  return slots.map((slot, i) => ware(run, slot, i, rng, QUARTERMASTER_OFF));
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

/** Why a ware cannot join the run now (the Pouch is full, a Reprieve is held), or null. The Dust is not part of this. */
export function wareBlocker(run: RunState, ware: Ware): string | null {
  if (ware.kind === 'provision' && pouchCount(run) >= POUCH_LIMIT) return 'Your pouch is full';
  if (ware.kind === 'reprieve') return reprieveBlocker(run);
  return null;
}

/** Buy a ware of the current stock: the Dust is paid and the ware joins the run. */
export function buyWare(run: RunState, id: string): CraftResult {
  const stock = ensureMarket(run);
  const ware = stock.find((x) => x.id === id);
  if (!ware) return { ok: false, reason: 'No such ware' };
  if (ware.sold) return { ok: false, reason: 'Already bought' };
  if (run.dust < ware.price) return { ok: false, reason: 'Not enough Bone Dust' };
  const why = wareBlocker(run, ware);
  if (why) return { ok: false, reason: why };
  run.dust -= ware.price;
  ware.sold = true;
  grantWare(run, ware);
  return { ok: true };
}

/** The ware joins the run (the Dust is the caller's business). */
export function grantWare(run: RunState, ware: Ware): void {
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
}
