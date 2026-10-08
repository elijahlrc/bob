import { Character } from '../calc/character';
import { itemHasRule, itemReq } from '../calc/items';
import { itemBase, isWeaponClass } from '../data/bases';
import { flaskBase } from '../data/flasks';
import type {
  InventoryItem,
  Attrs,
  Build,
  EquipSlot,
  FlaskItem,
  GemItem,
  Item,
} from '../data/types';
import type { RunState } from './run';

export const INVENTORY_SIZE = 60;

/** Which slots an item may go into. */
export function slotsFor(item: Item): EquipSlot[] {
  const c = itemBase(item.baseId).itemClass;
  if (isWeaponClass(c)) {
    return itemBase(item.baseId).hands === 1 ? ['mainHand', 'offHand'] : ['mainHand'];
  }
  switch (c) {
    case 'shield':
    case 'quiver':
      return ['offHand'];
    case 'ring':
      return ['ring1', 'ring2'];
    default:
      return [c as EquipSlot];
  }
}

/** The attributes worked out by `attrsWithout`, by the build they were worked out for (a build is replaced, not edited). */
const attrCache = new WeakMap<object, Map<string, Attrs>>();

/** Attributes the character would have without the item currently in `slot`. */
function attrsWithout(run: RunState, slot: EquipSlot | null): Attrs {
  // Judging a pile of items asks this for the same few builds over and over, so remember the answers.
  const b = run.build;
  const worn = Object.entries(b.equipment)
    .map(([k, it]) => `${k}${it?.uid}`)
    .join(',');
  const key = `${slot}|${b.level}|${b.allocated.join(',')}|${worn}`;
  let per = attrCache.get(b.equipment);
  if (!per) attrCache.set(b.equipment, (per = new Map()));
  const hit = per.get(key);
  if (hit) return hit;
  const equipment = { ...b.equipment };
  if (slot) delete equipment[slot];
  const attrs = new Character({ ...b, equipment }).attrs;
  per.set(key, attrs);
  return attrs;
}

export type EquipCheck = { ok: boolean; reason?: string };

export function canEquip(run: RunState, item: Item, slot: EquipSlot): EquipCheck {
  if (!slotsFor(item).includes(slot)) return { ok: false, reason: 'Wrong slot' };
  const base = itemBase(item.baseId);
  if (base.level > run.build.level) return { ok: false, reason: `Requires level ${base.level}` };
  const a = attrsWithout(run, slot);
  for (const k of ['str', 'dex', 'int'] as const)
    if (a[k] < itemReq(item)[k]) return { ok: false, reason: `Requires ${itemReq(item)[k]} ${k}` };
  // A ring with the "no other ring" rule needs the other ring slot empty, and blocks a second ring.
  if (slot === 'ring1' || slot === 'ring2') {
    const other = run.build.equipment[slot === 'ring1' ? 'ring2' : 'ring1'];
    if (other && itemHasRule(item, 'noOtherRing'))
      return { ok: false, reason: 'Cannot be worn with another ring' };
    if (other && itemHasRule(other, 'noOtherRing'))
      return { ok: false, reason: `${other.name} cannot be worn with another ring` };
  }
  const main = slot === 'mainHand' ? item : run.build.equipment.mainHand;
  const off = slot === 'offHand' ? item : run.build.equipment.offHand;
  if (main && off) {
    const mb = itemBase(main.baseId);
    const ob = itemBase(off.baseId);
    if (ob.itemClass === 'quiver' && mb.itemClass !== 'bow')
      return { ok: false, reason: 'Quivers need a bow' };
    if (mb.itemClass === 'bow' && ob.itemClass !== 'quiver' && slot === 'offHand')
      return { ok: false, reason: 'A bow allows only a quiver' };
    if (mb.hands === 2 && mb.itemClass !== 'bow' && slot === 'offHand')
      return { ok: false, reason: 'Two-handed weapon equipped' };
  }
  return { ok: true };
}

/**
 * Move gems from the item being replaced into the new item's empty sockets (in order). Returns
 * the new item and what remains of the old one.
 */
export function transferGems(
  oldItem: Item | undefined,
  newItem: Item,
): { next: Item; prev?: Item } {
  if (!oldItem) return { next: newItem };
  const nextSockets = [...newItem.sockets];
  const prevSockets = [...oldItem.sockets];
  for (let i = 0; i < prevSockets.length; i++) {
    const g = prevSockets[i];
    if (!g) continue;
    const slot = nextSockets.indexOf(null);
    if (slot < 0) break;
    nextSockets[slot] = g;
    prevSockets[i] = null;
  }
  return { next: { ...newItem, sockets: nextSockets }, prev: { ...oldItem, sockets: prevSockets } };
}

/**
 * An item that is no longer worn goes to the inventory bare: its gems go beside it, as gems of their own. A gem left
 * inside a carried item cannot be socketed anywhere and is thrown away with the item (salvage, discard, clean-up), so no
 * path may leave one there.
 */
function stash(run: RunState, item: Item): void {
  const gems = item.sockets.filter((g): g is GemItem => g !== null);
  run.inventory.push(
    gems.length ? { ...item, sockets: item.sockets.map(() => null) } : item,
    ...gems,
  );
}

/** Take the gems out of every carried item (a save from before `stash`, or any path that missed it). Returns how many. */
export function releaseStrandedGems(run: RunState): number {
  let n = 0;
  const out: InventoryItem[] = [];
  for (const it of run.inventory) {
    if (it.kind === 'item' && it.sockets.some(Boolean)) {
      const gems = it.sockets.filter((g): g is GemItem => g !== null);
      n += gems.length;
      out.push({ ...it, sockets: it.sockets.map(() => null) }, ...gems);
    } else out.push(it);
  }
  if (n > 0) run.inventory = out;
  return n;
}

/** The build with `item` placed in `slot` (gems carried over), for compare deltas. */
export function withEquipped(build: Build, item: Item, slot: EquipSlot): Build {
  const { next } = transferGems(build.equipment[slot], item);
  return { ...build, equipment: { ...build.equipment, [slot]: next } };
}

function take(run: RunState, uid: number): InventoryItem | undefined {
  const i = run.inventory.findIndex((x) => x.uid === uid);
  if (i < 0) return undefined;
  return run.inventory.splice(i, 1)[0];
}

/** Equip an inventory item; the displaced item(s) return to the inventory. */
export function equip(run: RunState, uid: number, slot: EquipSlot): EquipCheck {
  const item = run.inventory.find((x) => x.uid === uid);
  if (!item || item.kind !== 'item') return { ok: false, reason: 'Not an item' };
  const chk = canEquip(run, item, slot);
  if (!chk.ok) return chk;
  take(run, uid);
  const eq = { ...run.build.equipment };
  const { next, prev } = transferGems(eq[slot], item);
  // Gems that did not fit in the new item come out of the old one.
  if (prev) stash(run, prev);
  eq[slot] = next;
  // Two-handers clear an incompatible off hand.
  const base = itemBase(item.baseId);
  if (slot === 'mainHand' && base.hands === 2 && eq.offHand) {
    const ob = itemBase(eq.offHand.baseId);
    if (!(base.itemClass === 'bow' && ob.itemClass === 'quiver')) {
      stash(run, eq.offHand);
      delete eq.offHand;
    }
  }
  if (
    slot === 'mainHand' &&
    base.itemClass !== 'bow' &&
    eq.offHand &&
    itemBase(eq.offHand.baseId).itemClass === 'quiver'
  ) {
    stash(run, eq.offHand);
    delete eq.offHand;
  }
  run.build = { ...run.build, equipment: eq };
  dropLostPrimary(run);
  return { ok: true };
}

/** The primary skill gem is none any more once the gem is not in a socket. */
function dropLostPrimary(run: RunState): void {
  const p = run.build.primaryGem;
  if (p === undefined) return;
  const worn = Object.values(run.build.equipment).some((it) =>
    it.sockets.some((g) => g?.uid === p),
  );
  if (!worn) run.build = { ...run.build, primaryGem: undefined };
}

export function unequip(run: RunState, slot: EquipSlot): void {
  const eq = { ...run.build.equipment };
  const old = eq[slot];
  if (!old) return;
  stash(run, old);
  delete eq[slot];
  run.build = { ...run.build, equipment: eq };
  dropLostPrimary(run);
}

/** Throw an item away. A gem it holds is not thrown away with it: it stays in the inventory. */
export function discard(run: RunState, uid: number): void {
  const it = take(run, uid);
  if (it?.kind === 'item')
    run.inventory.push(...it.sockets.filter((g): g is GemItem => g !== null));
}

/** Put an inventory gem into a socket (the previous gem returns to the inventory). */
export function socketGem(run: RunState, slot: EquipSlot, socket: number, gemUid: number): boolean {
  const item = run.build.equipment[slot];
  const gem = run.inventory.find((x) => x.uid === gemUid);
  if (!item || !gem || gem.kind !== 'gem' || socket >= item.sockets.length) return false;
  take(run, gemUid);
  const sockets = [...item.sockets];
  const old = sockets[socket];
  if (old) run.inventory.push(old);
  sockets[socket] = gem as GemItem;
  run.build = { ...run.build, equipment: { ...run.build.equipment, [slot]: { ...item, sockets } } };
  return true;
}

export function unsocketGem(run: RunState, slot: EquipSlot, socket: number): void {
  const item = run.build.equipment[slot];
  const gem = item?.sockets[socket];
  if (!item || !gem) return;
  const sockets = [...item.sockets];
  sockets[socket] = null;
  run.inventory.push(gem);
  if (run.build.primaryGem === gem.uid) run.build = { ...run.build, primaryGem: undefined };
  run.build = { ...run.build, equipment: { ...run.build.equipment, [slot]: { ...item, sockets } } };
}

export function setPrimary(run: RunState, gemUid: number): void {
  run.build = { ...run.build, primaryGem: gemUid };
}

/** Put an inventory flask into a flask slot (the previous flask returns to the inventory). */
export function equipFlask(run: RunState, uid: number, idx: number): boolean {
  const f = run.inventory.find((x) => x.uid === uid);
  if (!f || f.kind !== 'flask' || idx < 0 || idx > 4) return false;
  if (flaskBase(f.baseId).level > run.build.level) return false;
  take(run, uid);
  const flasks = [...run.build.flasks];
  const old = flasks[idx];
  if (old) run.inventory.push(old);
  flasks[idx] = f as FlaskItem;
  run.build = { ...run.build, flasks };
  return true;
}

export function unequipFlask(run: RunState, idx: number): void {
  const flasks = [...run.build.flasks];
  const old = flasks[idx];
  if (!old) return;
  run.inventory.push(old);
  flasks[idx] = null;
  run.build = { ...run.build, flasks };
}
