import { Rng } from '../core/rng';
import { flaskBase } from '../data/flasks';
import { priceAt, QUARTERMASTER_SIZE, WARE_BASE } from '../data/sale';
import { PROVISIONS, type ProvisionId } from '../data/provisions';
import { REPRIEVE_FROM, REPRIEVES, type ReprieveId } from '../data/reprieves';
import { rollCurrencyBundle } from '../gen/currencyDrops';
import { rollDrop, rollFlask, rollGem } from '../gen/loot';
import { noteFound } from './found';
import { addProvision } from './provisions';
import { acquireReprieve } from './reprieves';
import type { RunState } from './run';
import { stash, uidSource } from './run';
import type { Ware } from './wayside';

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

type Slot = (typeof SALE_SLOTS)[number];

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

/** What one slot holds: drawn from the run seed, the level and the offer, so a reload shows the same stock. */
function ware(run: RunState, slot: Slot, index: number, rng: Rng): Ware {
  const level = run.map;
  const uid = tempUid();
  const price = (base: number) => priceAt(base, level);
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
      return { id: String(index), kind: 'provision', price: price(p.base), ref: p.id };
    }
    case 'reprieve': {
      const r = rng.weighted(REPRIEVES, (x) => x.weight);
      return { id: String(index), kind: 'reprieve', price: price(r.base), ref: r.id };
    }
    case 'bundle': {
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
      const ctx = { ilvl: level, monster: 'rare' as const, classId: run.build.classId };
      let item = rollDrop(rng, uid, ctx, true);
      for (let i = 0; i < 5 && item.kind !== 'item'; i++) item = rollDrop(rng, uid, ctx, true);
      return { id: String(index), kind: 'gear', price: price(WARE_BASE.gear), item };
    }
  }
}

/**
 * The Quartermaster's stock for the offer at hand (docs/WAYSIDE.md 5.2): twelve wares, a Reprieve among them from level 20.
 * Drawn from the run seed, the level and the offer, so it is the same every time it is looked at.
 */
export function rollSale(run: RunState, offerId: string): Ware[] {
  const rng = new Rng(run.seed).fork(`sale${offerId}`);
  const slots = SALE_SLOTS.slice(0, QUARTERMASTER_SIZE).map((s) =>
    s === 'reprieve' && run.map < REPRIEVE_FROM ? 'gear' : s,
  );
  return slots.map((slot, i) => ware(run, slot, i, rng));
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
