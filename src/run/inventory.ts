import { Character } from '../calc/character';
import { itemBase, isWeaponClass } from '../data/bases';
import { flaskBase } from '../data/flasks';
import type { AnyItem, Attrs, EquipSlot, FlaskItem, GemItem, Item } from '../data/types';
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

/** Attributes the character would have without the item currently in `slot`. */
function attrsWithout(run: RunState, slot: EquipSlot | null): Attrs {
  const equipment = { ...run.build.equipment };
  if (slot) delete equipment[slot];
  return new Character({ ...run.build, equipment }).attrs;
}

export type EquipCheck = { ok: boolean; reason?: string };

export function canEquip(run: RunState, item: Item, slot: EquipSlot): EquipCheck {
  if (!slotsFor(item).includes(slot)) return { ok: false, reason: 'Wrong slot' };
  const base = itemBase(item.baseId);
  if (base.level > run.build.level) return { ok: false, reason: `Requires level ${base.level}` };
  const a = attrsWithout(run, slot);
  for (const k of ['str', 'dex', 'int'] as const)
    if (a[k] < base.req[k]) return { ok: false, reason: `Requires ${base.req[k]} ${k}` };
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

function take(run: RunState, uid: number): AnyItem | undefined {
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
  const old = eq[slot];
  if (old) run.inventory.push(old);
  eq[slot] = item;
  // Two-handers clear an incompatible off hand.
  const base = itemBase(item.baseId);
  if (slot === 'mainHand' && base.hands === 2 && eq.offHand) {
    const ob = itemBase(eq.offHand.baseId);
    if (!(base.itemClass === 'bow' && ob.itemClass === 'quiver')) {
      run.inventory.push(eq.offHand);
      delete eq.offHand;
    }
  }
  if (
    slot === 'mainHand' &&
    base.itemClass !== 'bow' &&
    eq.offHand &&
    itemBase(eq.offHand.baseId).itemClass === 'quiver'
  ) {
    run.inventory.push(eq.offHand);
    delete eq.offHand;
  }
  run.build = { ...run.build, equipment: eq };
  return { ok: true };
}

export function unequip(run: RunState, slot: EquipSlot): void {
  const eq = { ...run.build.equipment };
  const old = eq[slot];
  if (!old) return;
  run.inventory.push(old);
  delete eq[slot];
  run.build = { ...run.build, equipment: eq };
}

export function discard(run: RunState, uid: number): void {
  take(run, uid);
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
