import { Rng } from '../core/rng';
import { family, familyMods, FAMILIES, type Family } from '../data/affixes';
import { itemBase } from '../data/bases';
import {
  augerCost,
  BENCH_RECIPES,
  currencyDef,
  SALVAGE_BASE,
  tabletsNeeded,
  TABLET_SETS,
} from '../data/currency';
import { affixesConflict, MAP_AFFIXES } from '../data/mapAffixes';
import {
  EQUIP_SLOTS,
  type AffixRoll,
  type EquipSlot,
  type InventoryItem,
  type Item,
  type Rarity,
} from '../data/types';
import { UNIQUE_FLASKS } from '../data/uniqueFlasks';
import { UNIQUES, uniqueDef } from '../data/uniques';
import {
  eligible,
  itemTags,
  magicName,
  rareName,
  rollAffix,
  rollAffixOfFamily,
  rollItemOf,
  rollSockets,
  rollUnique,
  rollUniqueFlask,
  socketLimit,
} from '../gen/loot';
import { uidSource, type RunState } from './run';

/**
 * Crafting (EXPANSION section 8). The player chooses what changes; chance fills in the details or
 * offers a short list to pick from. Every draw comes from `new Rng(seed).fork('craft' + craftSeq)`
 * and bumps `craftSeq`, so reloading a save shows the same outcomes and closing the game gains
 * nothing.
 */

export type CraftResult = { ok: true } | { ok: false; reason: string };
const OK: CraftResult = { ok: true };
const fail = (reason: string): CraftResult => ({ ok: false, reason });

/** Polished affixes allowed on one item. */
export const POLISH_LIMIT = 2;
/** Alternatives a Reforging Ember draws. */
export const REFORGE_OPTIONS = 3;

export function craftRng(run: RunState, label = 'craft'): Rng {
  return new Rng(run.seed).fork(`${label}${run.craftSeq}`);
}

export const owned = (run: RunState, id: string): number => run.currency[id] ?? 0;

function pay(run: RunState, id: string, n = 1): boolean {
  if (owned(run, id) < n) return false;
  run.currency[id] -= n;
  if (run.currency[id] <= 0) delete run.currency[id];
  return true;
}

export function addCurrency(run: RunState, id: string, n = 1): void {
  run.currency[id] = (run.currency[id] ?? 0) + n;
}

// ---- Finding and replacing an item --------------------------------------------------------------

type Located = { item: Item; slot: EquipSlot | null; index: number };

/** An item the player has: worn, or in the inventory. */
export function locate(run: RunState, uid: number): Located | null {
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (it?.uid === uid) return { item: it, slot, index: -1 };
  }
  const i = run.inventory.findIndex((x) => x.kind === 'item' && x.uid === uid);
  return i >= 0 ? { item: run.inventory[i] as Item, slot: null, index: i } : null;
}

function replace(run: RunState, loc: Located, next: Item): void {
  if (loc.slot)
    run.build = { ...run.build, equipment: { ...run.build.equipment, [loc.slot]: next } };
  else run.inventory[loc.index] = next;
}

function changeable(it: Item): CraftResult {
  return it.sealed ? fail('A sealed item can never be changed') : OK;
}

// ---- Affix slots ---------------------------------------------------------------------------------

function typeOf(a: AffixRoll): 'prefix' | 'suffix' {
  return family(a.family).type;
}

function slotCounts(affixes: AffixRoll[]): { prefix: number; suffix: number } {
  let prefix = 0;
  for (const a of affixes) if (typeOf(a) === 'prefix') prefix++;
  return { prefix, suffix: affixes.length - prefix };
}

/** The rarity an item has after gaining one more affix. */
function rarityAfterAdd(it: Item): Rarity {
  if (it.rarity === 'rare' || (it.rarity === 'magic' && it.affixes.length >= 2)) return 'rare';
  return 'magic';
}

/**
 * The affix families that could be added to an item: a free prefix or suffix, a family it may carry,
 * and a tier its level allows. (A normal item becomes magic; a magic item with two affixes becomes rare.)
 */
export function addableFamilies(it: Item): Family[] {
  if (it.uniqueId || it.sealed) return [];
  const tags = itemTags(itemBase(it.baseId));
  const used = new Set(it.affixes.map((a) => a.family));
  const result = rarityAfterAdd(it);
  const cap = result === 'rare' ? 3 : 1;
  const c = slotCounts(it.affixes);
  return FAMILIES.filter(
    (f) =>
      !used.has(f.id) &&
      (f.type === 'prefix' ? c.prefix : c.suffix) < cap &&
      eligible(f, tags, result) &&
      f.tiers.some((t) => t.minIlvl <= it.ilvl),
  );
}

function withAffix(it: Item, roll: AffixRoll, rng: Rng): Item {
  const base = itemBase(it.baseId);
  const affixes = [...it.affixes, roll];
  const rarity = rarityAfterAdd(it);
  const name =
    rarity === 'rare'
      ? rarity === it.rarity
        ? it.name
        : rareName(rng, base)
      : magicName(base, affixes);
  return { ...it, affixes, rarity, name };
}

function withoutAffix(it: Item, familyId: string): Item {
  const affixes = it.affixes.filter((a) => a.family !== familyId);
  const polished = (it.polished ?? []).filter((f) => f !== familyId);
  const name = it.rarity === 'magic' ? magicName(itemBase(it.baseId), affixes) : it.name;
  return { ...it, affixes, name, ...(polished.length ? { polished } : { polished: undefined }) };
}

// ---- Previews (for the bots and the UI): what a craft would do, on average --------------------------

/** A typical roll of a family: the tiers an item level allows, weighted as the drops are. */
export function expectedRoll(f: Family, ilvl: number): AffixRoll | null {
  const tiers = f.tiers.filter((t) => t.minIlvl <= ilvl);
  if (tiers.length === 0) return null;
  const total = tiers.reduce((s, t) => s + t.weight, 0);
  const values = f.mods.map((m, i) => {
    const mean = tiers.reduce((s, t) => s + (t.weight * (t.ranges[i][0] + t.ranges[i][1])) / 2, 0);
    const k = Math.pow(10, m.dec ?? 0);
    return Math.round((mean / total) * k) / k;
  });
  const top = tiers[tiers.length - 1];
  return { family: f.id, tier: top.tier, mods: familyMods(f, values) };
}

/** The item with a typical roll of a family added. */
export function previewAdd(it: Item, f: Family): Item | null {
  const roll = expectedRoll(f, it.ilvl);
  return roll ? withAffix(it, roll, new Rng(0)) : null;
}

/** The item with an affix removed. */
export const previewRemove = (it: Item, familyId: string): Item => withoutAffix(it, familyId);

/** The item with one affix polished. */
export function previewPolish(it: Item, familyId: string): Item {
  return {
    ...it,
    affixes: it.affixes.map((a) => (a.family === familyId ? polishedRoll(a) : a)),
    polished: [...(it.polished ?? []), familyId],
  };
}

// ---- The currencies ------------------------------------------------------------------------------

/** Marrow Pearl: add an affix of a family you choose. Only the tier and value are rolled. */
export function usePearl(run: RunState, itemUid: number, familyId: string): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const f = addableFamilies(loc.item).find((x) => x.id === familyId);
  if (!f) return fail('That affix cannot be added to this item');
  if (!pay(run, 'pearl')) return fail('You have no Marrow Pearl');
  const rng = craftRng(run);
  run.craftSeq++;
  replace(run, loc, withAffix(loc.item, rollAffixOfFamily(rng, f, loc.item.ilvl)!, rng));
  return OK;
}

/** Unravelling Thread: remove the affix you choose. */
export function useThread(run: RunState, itemUid: number, familyId: string): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const sealed = changeable(loc.item);
  if (!sealed.ok) return sealed;
  if (!loc.item.affixes.some((a) => a.family === familyId))
    return fail('The item has no such affix');
  if (!pay(run, 'thread')) return fail('You have no Unravelling Thread');
  run.craftSeq++;
  replace(run, loc, withoutAffix(loc.item, familyId));
  return OK;
}

/** An affix with every value at the maximum of its tier. */
export function polishedRoll(a: AffixRoll): AffixRoll {
  const f = family(a.family);
  const tier = f.tiers.find((t) => t.tier === a.tier) ?? f.tiers[f.tiers.length - 1];
  return {
    ...a,
    mods: familyMods(
      f,
      tier.ranges.map(([, hi]) => hi),
    ),
  };
}

/** Whetstone: raise one affix to the maximum of its tier. At most two polished affixes per item. */
export function useWhetstone(run: RunState, itemUid: number, familyId: string): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const it = loc.item;
  const sealed = changeable(it);
  if (!sealed.ok) return sealed;
  const a = it.affixes.find((x) => x.family === familyId);
  if (!a) return fail('The item has no such affix');
  const done = it.polished ?? [];
  if (done.includes(familyId)) return fail('That affix is already polished');
  if (done.length >= POLISH_LIMIT) return fail('An item can hold two polished affixes');
  if (!pay(run, 'whetstone')) return fail('You have no Whetstone');
  run.craftSeq++;
  replace(run, loc, {
    ...it,
    affixes: it.affixes.map((x) => (x.family === familyId ? polishedRoll(x) : x)),
    polished: [...done, familyId],
  });
  return OK;
}

/** Socket Augers needed to go from `from` sockets up to `to` (going down is free). */
export function socketCost(from: number, to: number): number {
  let n = 0;
  for (let k = from + 1; k <= to; k++) n += augerCost(k);
  return n;
}

/** The most sockets an item can be set to (a unique with fixed sockets keeps them). */
export function socketCeiling(it: Item): number {
  if (it.fixedSockets || it.sealed) return it.sockets.length;
  return socketLimit(itemBase(it.baseId), it.ilvl);
}

/** Change an item's socket count, returning gems from removed sockets to the inventory. */
function resocket(run: RunState, loc: Located, count: number): Item {
  const it = loc.item;
  const sockets = it.sockets.slice(0, count);
  for (const g of it.sockets.slice(count)) if (g) run.inventory.push(g);
  while (sockets.length < count) sockets.push(null);
  if (run.build.primaryGem !== undefined) {
    const lost = it.sockets.slice(count).some((g) => g?.uid === run.build.primaryGem);
    if (lost) run.build = { ...run.build, primaryGem: undefined };
  }
  return { ...it, sockets };
}

/** Socket Auger: set the socket count. */
export function useAuger(run: RunState, itemUid: number, count: number): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const sealed = changeable(loc.item);
  if (!sealed.ok) return sealed;
  if (loc.item.fixedSockets) return fail('This unique keeps the sockets it has');
  if (count < 0 || count > socketCeiling(loc.item))
    return fail('This item cannot have that many sockets');
  if (count === loc.item.sockets.length) return fail('It already has that many sockets');
  const cost = socketCost(loc.item.sockets.length, count);
  if (owned(run, 'auger') < cost) return fail(`That needs ${cost} Socket Augers`);
  if (cost > 0) pay(run, 'auger', cost);
  run.craftSeq++;
  replace(run, loc, resocket(run, loc, count));
  return OK;
}

// ---- Reforging Ember: pin, draw, pick ---------------------------------------------------------

/** 1 Ember, plus 1 for each affix pinned: the price of control. */
export function reforgeCost(pinned: number): number {
  return 1 + pinned;
}

/** One alternative: the pinned affixes stay, and the others are rolled again in the same prefix/suffix slots. */
function alternative(rng: Rng, it: Item, pinned: Set<string>): Item {
  const base = itemBase(it.baseId);
  const keep = it.affixes.filter((a) => pinned.has(a.family));
  const redo = it.affixes.filter((a) => !pinned.has(a.family));
  const used = new Set(keep.map((a) => a.family));
  const affixes = [...keep];
  for (const old of redo) {
    const a = rollAffix(rng, base, it.ilvl, it.rarity, typeOf(old), used);
    if (a) {
      used.add(a.family);
      affixes.push(a);
    }
  }
  const polished = (it.polished ?? []).filter((f) => pinned.has(f));
  return { ...it, affixes, ...(polished.length ? { polished } : { polished: undefined }) };
}

/** Pay the Embers and draw three alternatives, which wait in `run.pendingCraft` to be picked. */
export function drawReforge(run: RunState, itemUid: number, pinned: string[]): CraftResult {
  if (run.pendingCraft) return fail('Pick a result for the open craft first');
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const it = loc.item;
  const sealed = changeable(it);
  if (!sealed.ok) return sealed;
  if (it.rarity !== 'rare') return fail('Only rare items can be reforged');
  const have = new Set(it.affixes.map((a) => a.family));
  if (pinned.some((f) => !have.has(f))) return fail('You can only pin affixes the item has');
  if (pinned.length >= it.affixes.length) return fail('Leave at least one affix unpinned');
  const cost = reforgeCost(pinned.length);
  if (owned(run, 'ember') < cost) return fail(`That needs ${cost} Reforging Embers`);
  pay(run, 'ember', cost);
  const rng = craftRng(run);
  run.craftSeq++;
  const keep = new Set(pinned);
  const options = Array.from({ length: REFORGE_OPTIONS }, () => alternative(rng, it, keep));
  run.pendingCraft = { itemUid, pinned: [...pinned], options };
  return OK;
}

/** Pick one of the drawn alternatives, or null to keep the original. The Embers are spent either way. */
export function pickReforge(run: RunState, index: number | null): CraftResult {
  const pending = run.pendingCraft;
  if (!pending) return fail('There is no open craft');
  const loc = locate(run, pending.itemUid);
  if (index !== null) {
    const opt = pending.options[index];
    if (!opt) return fail('No such option');
    if (loc) replace(run, loc, opt);
  }
  run.pendingCraft = null;
  return OK;
}

// ---- Knucklebone Die and Rot Seal: the two gambles --------------------------------------------

/** Replace an item's contents but keep its identity and carry its gems over. */
function remake(run: RunState, loc: Located, made: Item): Item {
  const old = loc.item;
  const gems = old.sockets.filter(Boolean);
  const sockets = made.sockets.length >= old.sockets.length ? made.sockets : made.sockets;
  const next: Item = { ...made, uid: old.uid, sockets: [...sockets] };
  // Move gems into the new sockets in order; any that do not fit go back to the inventory.
  next.sockets = next.sockets.map(() => null);
  gems.forEach((g, i) => {
    if (i < next.sockets.length) next.sockets[i] = g!;
    else run.inventory.push(g!);
  });
  return next;
}

/** Knucklebone Die: a normal item becomes magic (60%), rare (30%) or a unique of its base (10%). */
export function useDie(run: RunState, itemUid: number): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  if (loc.item.rarity !== 'normal') return fail('The die only works on normal items');
  if (!pay(run, 'die')) return fail('You have no Knucklebone Die');
  const rng = craftRng(run);
  run.craftSeq++;
  const uid = uidSource(run);
  const base = itemBase(loc.item.baseId);
  const r = rng.next();
  const uniques = UNIQUES.filter((u) => u.baseId === base.id);
  let made: Item;
  if (r >= 0.9 && uniques.length) made = rollUnique(rng, uid, rng.pick(uniques), loc.item.ilvl);
  else made = rollItemOf(rng, uid, base, loc.item.ilvl, r < 0.6 ? 'magic' : 'rare');
  replace(run, loc, remake(run, loc, made));
  return OK;
}

/** Corruption implicits a Rot Seal can give. */
export const SEAL_IMPLICITS = [
  { stat: 'socketedGemLevel', kind: 'base', value: 1 },
  { stat: 'maxResist.fire', kind: 'base', value: 2 },
  { stat: 'maxResist.cold', kind: 'base', value: 2 },
  { stat: 'maxResist.lightning', kind: 'base', value: 2 },
  { stat: 'maxResist.chaos', kind: 'base', value: 2 },
] as const;

/** Rot Seal: seal an item for good. 25% each: a corruption implicit, new sockets, a new rare, or nothing. */
export function useSeal(run: RunState, itemUid: number): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  if (loc.item.sealed) return fail('It is already sealed');
  if (!pay(run, 'seal')) return fail('You have no Rot Seal');
  const rng = craftRng(run);
  run.craftSeq++;
  const it = loc.item;
  const base = itemBase(it.baseId);
  const outcome = rng.int(0, 3);
  let next: Item = it;
  if (outcome === 0) {
    const imp = rng.pick([...SEAL_IMPLICITS]);
    next = { ...it, implicits: [...it.implicits, { ...imp }] };
  } else if (outcome === 1 && !it.fixedSockets) {
    next = resocket(
      run,
      loc,
      Math.min(socketLimit(base, it.ilvl), rollSockets(rng, base, it.ilvl)),
    );
  } else if (outcome === 2) {
    next = remake(run, loc, rollItemOf(rng, uidSource(run), base, it.ilvl, 'rare'));
    if (loc.slot === null) next = { ...next };
  }
  replace(run, loc, { ...next, sealed: true });
  return OK;
}

// ---- Essences -------------------------------------------------------------------------------------

/**
 * Essence: add an affix of a family from the essence's list. If the item has no free slot of that
 * kind, `replaceFamily` names the affix of the same kind to give up.
 */
export function useEssence(
  run: RunState,
  itemUid: number,
  essenceId: string,
  familyId: string,
  replaceFamily?: string,
): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const def = currencyDef(essenceId);
  if (!def.families?.includes(familyId)) return fail('That essence cannot give that affix');
  if (owned(run, essenceId) < 1) return fail(`You have no ${def.name}`);
  let it = loc.item;
  let f = addableFamilies(it).find((x) => x.id === familyId);
  if (!f && replaceFamily) {
    const target = family(familyId);
    const old = it.affixes.find((a) => a.family === replaceFamily);
    if (!old || typeOf(old) !== target.type)
      return fail('Choose an affix of the same kind to replace');
    it = withoutAffix(it, replaceFamily);
    f = addableFamilies(it).find((x) => x.id === familyId);
  }
  if (!f) return fail('That affix cannot be added to this item');
  pay(run, essenceId);
  const rng = craftRng(run);
  run.craftSeq++;
  replace(run, loc, withAffix(it, rollAffixOfFamily(rng, f, it.ilvl)!, rng));
  return OK;
}

// ---- The Workbench: Bone Dust --------------------------------------------------------------------

/** Salvage value of an inventory item, in Bone Dust. */
export function salvageValue(it: InventoryItem): number {
  if (it.kind === 'gem') return SALVAGE_BASE.gem;
  if (it.kind === 'flask') return Math.round(SALVAGE_BASE.flask * (1 + it.ilvl / 50));
  return Math.round(SALVAGE_BASE[it.rarity] * (1 + it.ilvl / 50));
}

export function salvage(run: RunState, uid: number): CraftResult {
  const i = run.inventory.findIndex((x) => x.uid === uid);
  if (i < 0) return fail('Only carried items can be salvaged');
  run.dust += salvageValue(run.inventory[i]);
  run.inventory.splice(i, 1);
  return OK;
}

/** Whether a Dust recipe is unlocked at this point of the run. */
export const unlocked = (run: RunState, minMap: number): boolean => run.map >= minMap;

/** Bench: add an affix of a listed family at a fixed mid-low tier, for Dust. One per item. */
export function benchAdd(run: RunState, itemUid: number, familyId: string): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const rec = BENCH_RECIPES.find((r) => r.kind === 'add' && r.family === familyId);
  if (!rec || rec.kind !== 'add') return fail('No such recipe');
  if (!unlocked(run, rec.minMap)) return fail(`Unlocks at map ${rec.minMap}`);
  if (loc.item.affixes.some((a) => a.bench)) return fail('The item already has a bench affix');
  const f = addableFamilies(loc.item).find((x) => x.id === familyId);
  if (!f) return fail('That affix cannot be added to this item');
  if (run.dust < rec.dust) return fail(`That needs ${rec.dust} Bone Dust`);
  const tiers = f.tiers.filter((t) => t.minIlvl <= loc.item.ilvl);
  const tier = tiers[Math.min(2, tiers.length - 1)];
  const values = tier.ranges.map(([lo, hi], i) => {
    const dec = f.mods[i].dec ?? 0;
    const k = Math.pow(10, dec);
    return Math.round(((lo + hi) / 2) * k) / k;
  });
  run.dust -= rec.dust;
  const rng = craftRng(run);
  run.craftSeq++;
  const roll: AffixRoll = {
    family: f.id,
    tier: tier.tier,
    mods: familyMods(f, values),
    bench: true,
  };
  replace(run, loc, withAffix(loc.item, roll, rng));
  return OK;
}

/** Remove the bench affix for free. */
export function benchRemoveBench(run: RunState, itemUid: number): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const b = loc.item.affixes.find((a) => a.bench);
  if (!b) return fail('The item has no bench affix');
  run.craftSeq++;
  replace(run, loc, withoutAffix(loc.item, b.family));
  return OK;
}

/** Bench: remove an affix of your choice, for Dust. */
export function benchRemove(run: RunState, itemUid: number, familyId: string): CraftResult {
  const rec = BENCH_RECIPES.find((r) => r.kind === 'remove');
  if (!rec) return fail('No such recipe');
  if (!unlocked(run, rec.minMap)) return fail(`Unlocks at map ${rec.minMap}`);
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const sealed = changeable(loc.item);
  if (!sealed.ok) return sealed;
  if (!loc.item.affixes.some((a) => a.family === familyId))
    return fail('The item has no such affix');
  if (run.dust < rec.dust) return fail(`That needs ${rec.dust} Bone Dust`);
  run.dust -= rec.dust;
  run.craftSeq++;
  replace(run, loc, withoutAffix(loc.item, familyId));
  return OK;
}

/** Dust needed to go from `from` sockets up to `to` (the fourth to sixth socket have a price). */
export function benchSocketCost(from: number, to: number, map: number): number | null {
  let dust = 0;
  for (let k = from + 1; k <= to; k++) {
    if (k <= 3) continue;
    const rec = BENCH_RECIPES.find((r) => r.kind === 'socket' && r.nth === k);
    if (!rec || map < rec.minMap) return null;
    dust += rec.dust;
  }
  return dust;
}

/** Bench: raise the socket count, for Dust. */
export function benchSockets(run: RunState, itemUid: number, count: number): CraftResult {
  const loc = locate(run, itemUid);
  if (!loc) return fail('No such item');
  const sealed = changeable(loc.item);
  if (!sealed.ok) return sealed;
  if (loc.item.fixedSockets) return fail('This unique keeps the sockets it has');
  if (count <= loc.item.sockets.length) return fail('Use the Auger to remove sockets');
  if (count > socketCeiling(loc.item)) return fail('This item cannot have that many sockets');
  const dust = benchSocketCost(loc.item.sockets.length, count, run.map);
  if (dust === null) return fail('Those sockets are not unlocked yet');
  if (run.dust < dust) return fail(`That needs ${dust} Bone Dust`);
  run.dust -= dust;
  run.craftSeq++;
  replace(run, loc, resocket(run, loc, count));
  return OK;
}

// ---- Tablets ------------------------------------------------------------------------------------

/** Unique ids whose tablet set is complete. */
export function completeTabletSets(run: RunState): string[] {
  return Object.keys(run.tablets).filter((id) => {
    const need = tabletsNeeded(id);
    return need > 0 && run.tablets[id] >= need;
  });
}

/** Exchange a complete tablet set for its unique. */
export function redeemTablets(run: RunState, uniqueId: string): CraftResult {
  const need = tabletsNeeded(uniqueId);
  if (need === 0) return fail('No tablets exist for that unique');
  if ((run.tablets[uniqueId] ?? 0) < need) return fail(`That needs ${need} tablets`);
  run.tablets[uniqueId] -= need;
  if (run.tablets[uniqueId] <= 0) delete run.tablets[uniqueId];
  const rng = craftRng(run, 'tablet');
  run.craftSeq++;
  const uid = uidSource(run);
  const flask = UNIQUE_FLASKS.find((u) => u.id === uniqueId);
  if (flask) run.inventory.push(rollUniqueFlask(rng, uid, flask, Math.max(run.map, flask.level)));
  else {
    const def = uniqueDef(uniqueId);
    const it = rollUnique(rng, uid, def, Math.max(run.map, def.level));
    run.inventory.push(it);
    run.newLoot.push(it.uid);
  }
  return OK;
}

/** Every unique a faction's tablets can build. */
export function tabletTargets(): string[] {
  return Object.values(TABLET_SETS).flatMap((l) => l.map((t) => t.unique));
}

// ---- Wayfinder's Chalk ----------------------------------------------------------------------------

/** The three affixes Chalk offers to add to an offered map. Fixed until the next craft. */
export function chalkOptions(run: RunState, offer: number): string[] {
  const rng = craftRng(run, `chalk${offer}.`);
  const have = new Set(run.offers[offer]?.affixes);
  // An affix is not offered if the map has it or one that conflicts with it (the same stat or element).
  const pool = MAP_AFFIXES.filter(
    (a) => !a.chalkOnly && ![...have].some((h) => affixesConflict(h, a.id)),
  ).map((a) => a.id);
  return rng.shuffle(pool).slice(0, 3);
}

export function chalkAdd(run: RunState, offer: number, affixId: string): CraftResult {
  const target = run.offers[offer];
  if (!target || target.kind !== 'map') return fail('No such map');
  if (!chalkOptions(run, offer).includes(affixId)) return fail('That affix is not on offer');
  if (!pay(run, 'chalk')) return fail("You have no Wayfinder's Chalk");
  run.craftSeq++;
  target.affixes = [...new Set([...target.affixes, affixId])].sort();
  return OK;
}

export function chalkRemove(run: RunState, offer: number, affixId: string): CraftResult {
  const target = run.offers[offer];
  if (!target || target.kind !== 'map') return fail('No such map');
  if (!target.affixes.includes(affixId)) return fail('The map has no such affix');
  if (owned(run, 'chalk') < 2) return fail("That needs 2 Wayfinder's Chalk");
  pay(run, 'chalk', 2);
  run.craftSeq++;
  target.affixes = target.affixes.filter((id) => id !== affixId);
  return OK;
}
