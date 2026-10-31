import { Rng } from '../core/rng';
import { flaskBase } from '../data/flasks';
import {
  GEAR_CANDIDATES,
  GEAR_ILVL_BONUS,
  priceAt,
  QUARTERMASTER_SIZE,
  WARE_BASE,
} from '../data/sale';
import { PROVISIONS, type ProvisionId } from '../data/provisions';
import { REPRIEVES, type ReprieveId } from '../data/reprieves';
import { rollDrop, rollFlask, rollGem } from '../gen/loot';
import type { Item } from '../data/types';
import { noteFound } from './found';
import { addProvision } from './provisions';
import { acquireReprieve } from './reprieves';
import type { RunState } from './run';
import { uidSource } from './run';
import { grantRelic, keptRelics, type Ware } from './wayside';
import { relicDef, type RunRewardId } from '../data/runRewards';

/** The Quartermaster's: nine wares, a reprieve and a run reward among them (docs/WAYSIDE.md 5.2, docs/ATTRITION.md). */
const SALE_SLOTS = [
  'gear',
  'gear',
  'gem',
  'flask',
  'provision',
  'provision',
  'provision',
  'reprieve',
  // A run reward (docs/ATTRITION.md): a provision instead when none is left to buy.
  'reward',
] as const;

type Slot = (typeof SALE_SLOTS)[number];

/** How strong a rare is, roughly: the tiers of its affixes (a higher tier is a rarer, stronger roll). */
function itemPower(it: Item): number {
  return it.affixes.reduce((n, a) => n + a.tier, 0);
}

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
      const open = PROVISIONS.filter((p) => p.kind !== 'reprieve' && p.from <= level);
      const p = rng.weighted(open, (x) => x.weight);
      return { id: String(index), kind: 'provision', price: price(p.base), ref: p.id };
    }
    case 'reprieve': {
      const r = rng.weighted(
        REPRIEVES.filter((x) => x.from <= level),
        (x) => x.weight,
      );
      return { id: String(index), kind: 'reprieve', price: price(r.base), ref: r.id };
    }
    default: {
      // As good as the best a map of the level could drop (docs/WAYSIDE.md 3): the best of a few rares rolled at the item level of an
      // offer two levels up, by the tiers of their affixes.
      const ctx = {
        ilvl: Math.min(100, level + GEAR_ILVL_BONUS),
        monster: 'rare' as const,
        classId: run.build.classId,
      };
      let best: Item | null = null;
      for (let i = 0; i < GEAR_CANDIDATES; i++) {
        const it = rollDrop(rng, uid, ctx, true);
        if (it.kind === 'item' && (!best || itemPower(it) > itemPower(best))) best = it;
      }
      const item = best ?? (rollDrop(rng, uid, ctx, true) as Item);
      return { id: String(index), kind: 'gear', price: price(WARE_BASE.gear), item };
    }
  }
}

/**
 * The Quartermaster's stock for the offer at hand (docs/WAYSIDE.md 5.2): nine wares, a reprieve and a run reward among them.
 * Drawn from the run seed, the level and the offer, so it is the same every time it is looked at.
 */
export function rollSale(run: RunState, offerId: string): Ware[] {
  const rng = new Rng(run.seed).fork(`sale${offerId}`);
  const slots = SALE_SLOTS.slice(0, QUARTERMASTER_SIZE).map((s) =>
    s === 'reprieve' && !REPRIEVES.some((r) => r.from <= run.map) ? 'gear' : s,
  );
  // The run reward draws from a stream of its own, so the other wares are what they were before it was added.
  const rr = new Rng(run.seed).fork(`salereward${offerId}`);
  return slots.map((slot, i) =>
    slot === 'reward'
      ? (rewardWare(run, offerId, i, rr) ?? ware(run, 'provision', i, rr))
      : ware(run, slot, i, rng),
  );
}

/**
 * A relic the run can still take, for sale (docs/ATTRITION.md): drawn by the character's attributes the first time the stock is
 * looked at, then kept for the level (`keptRelics`). Null when there is none.
 */
function rewardWare(run: RunState, offerId: string, index: number, rng: Rng): Ware | null {
  const id = keptRelics(run, `sale${offerId}.${index}`, rng, 1)[0];
  if (!id) return null;
  return { id: String(index), kind: 'reward', price: priceAt(relicDef(id).base, run.map), ref: id };
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
  } else if (ware.kind === 'reward' && ware.ref) {
    grantRelic(run, ware.ref as RunRewardId);
  }
}
