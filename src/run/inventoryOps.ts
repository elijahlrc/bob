import { itemBase, isWeaponClass } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { gemDef } from '../data/gems';
import { EQUIP_SLOTS, type AnyItem, type EquipSlot, type Item, type Rarity } from '../data/types';
import { canEquip, equip, equipFlask, slotsFor, socketGem, withEquipped } from './inventory';
import { score, sheetOf } from './bot';
import type { RunState } from './run';

/** Headless helpers behind the inventory UI: upgrade hints, sorting, filtering, gem placement. */

export type ItemGroup = 'weapon' | 'armour' | 'jewellery' | 'flask' | 'gem';

export type ItemInfo = {
  uid: number;
  group: ItemGroup;
  /** Sort position of the item's natural slot (weapons first, then armour, jewellery). */
  slotOrder: number;
  slotLabel: string;
  /** Best slot to equip into (highest resulting score), if any slot is usable. */
  slot: EquipSlot | null;
  equippable: boolean;
  reason?: string;
  /** Percent change in sustained DPS / effective HP / the bot's score if equipped in `slot`. */
  dpsPct: number;
  ehpPct: number;
  scorePct: number;
  replaces?: Item;
};

const SLOT_LABEL: Record<EquipSlot, string> = {
  mainHand: 'Main hand',
  offHand: 'Off hand',
  helmet: 'Helmet',
  body: 'Body',
  gloves: 'Gloves',
  boots: 'Boots',
  amulet: 'Amulet',
  ring1: 'Ring',
  ring2: 'Ring',
  belt: 'Belt',
};
export function slotLabel(s: EquipSlot): string {
  return SLOT_LABEL[s];
}

export function groupOf(it: AnyItem): ItemGroup {
  if (it.kind === 'gem') return 'gem';
  if (it.kind === 'flask') return 'flask';
  const c = itemBase(it.baseId).itemClass;
  if (isWeaponClass(c) || c === 'quiver') return 'weapon';
  if (c === 'ring' || c === 'amulet' || c === 'belt') return 'jewellery';
  return 'armour';
}

const GROUP_ORDER: Record<ItemGroup, number> = {
  weapon: 0,
  armour: 1,
  jewellery: 2,
  flask: 3,
  gem: 4,
};

function slotOrder(it: AnyItem): number {
  if (it.kind === 'item') return EQUIP_SLOTS.indexOf(slotsFor(it)[0]);
  return 20 + GROUP_ORDER[groupOf(it)];
}

function naturalLabel(it: AnyItem): string {
  if (it.kind === 'gem') return 'Gem';
  if (it.kind === 'flask') return 'Flask';
  const c = itemBase(it.baseId).itemClass;
  if (isWeaponClass(c)) return itemBase(it.baseId).hands === 2 ? 'Two-hand' : 'One-hand';
  return SLOT_LABEL[slotsFor(it)[0]];
}

const pct = (a: number, b: number) => (a > 0 ? ((b - a) / a) * 100 : 0);

/** Upgrade information for every inventory item (computed once per build/inventory change). */
export function itemInfos(run: RunState): Map<number, ItemInfo> {
  const base = sheetOf(run);
  const baseScore = score(base);
  const out = new Map<number, ItemInfo>();
  for (const it of run.inventory) {
    const info: ItemInfo = {
      uid: it.uid,
      group: groupOf(it),
      slotOrder: slotOrder(it),
      slotLabel: naturalLabel(it),
      slot: null,
      equippable: it.kind !== 'gem',
      dpsPct: 0,
      ehpPct: 0,
      scorePct: 0,
    };
    if (it.kind === 'flask') {
      info.equippable = flaskBase(it.baseId).level <= run.build.level;
      if (!info.equippable) info.reason = `Requires level ${flaskBase(it.baseId).level}`;
    } else if (it.kind === 'item') {
      info.equippable = false;
      let best = -Infinity;
      for (const slot of slotsFor(it)) {
        const chk = canEquip(run, it, slot);
        if (!chk.ok) {
          info.reason ??= chk.reason;
          continue;
        }
        const s = sheetOf(run, withEquipped(run.build, it, slot));
        const sc = score(s);
        if (sc > best) {
          best = sc;
          info.slot = slot;
          info.equippable = true;
          info.reason = undefined;
          info.dpsPct = pct(base.skill.sustainedDps, s.skill.sustainedDps);
          info.ehpPct = pct(base.ehp, s.ehp);
          info.scorePct = pct(baseScore, sc);
          info.replaces = run.build.equipment[slot];
        }
      }
    }
    out.set(it.uid, info);
  }
  return out;
}

export type SortKey = 'newest' | 'slot' | 'rarity' | 'ilvl' | 'dps' | 'ehp' | 'upgrade' | 'name';
export type FilterKey = 'all' | ItemGroup | 'upgrades' | 'usable';

export const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest',
  slot: 'Slot',
  rarity: 'Rarity',
  ilvl: 'Item level',
  dps: 'Δ DPS',
  ehp: 'Δ Effective HP',
  upgrade: 'Best upgrade',
  name: 'Name',
};

const RARITY_RANK: Record<Rarity, number> = { normal: 0, magic: 1, rare: 2, unique: 3 };

function rarityRank(it: AnyItem): number {
  return it.kind === 'item'
    ? RARITY_RANK[it.rarity]
    : it.kind === 'flask'
      ? it.affixes.length
        ? 1
        : 0
      : 0;
}

function name(it: AnyItem): string {
  return it.kind === 'gem' ? gemDef(it.gemId).name : it.name;
}

/** Whether an item is an upgrade worth highlighting. */
export function isUpgrade(info: ItemInfo): boolean {
  return info.group !== 'gem' && info.equippable && info.scorePct > 0.5;
}

export function filterItems(
  items: AnyItem[],
  infos: Map<number, ItemInfo>,
  f: FilterKey,
): AnyItem[] {
  switch (f) {
    case 'all':
      return items;
    case 'upgrades':
      return items.filter((x) => isUpgrade(infos.get(x.uid)!));
    case 'usable':
      return items.filter((x) => infos.get(x.uid)!.equippable);
    default:
      return items.filter((x) => infos.get(x.uid)!.group === f);
  }
}

/** Sort a copy of `items`. `desc` flips the natural direction of the key. */
export function sortItems(
  items: AnyItem[],
  infos: Map<number, ItemInfo>,
  key: SortKey,
  desc: boolean,
): AnyItem[] {
  const info = (x: AnyItem) => infos.get(x.uid)!;
  const val = (x: AnyItem): number | string => {
    switch (key) {
      case 'newest':
        return x.uid;
      case 'slot':
        return info(x).slotOrder;
      case 'rarity':
        return rarityRank(x);
      case 'ilvl':
        return x.kind === 'gem' ? 0 : x.ilvl;
      case 'dps':
        return info(x).dpsPct;
      case 'ehp':
        return info(x).ehpPct;
      case 'upgrade':
        return info(x).scorePct;
      case 'name':
        return name(x).toLowerCase();
    }
  };
  // Metric-like keys read best high-to-low; slot and name read best low-to-high.
  const naturalDesc = key !== 'slot' && key !== 'name';
  const dir = (desc ? !naturalDesc : naturalDesc) ? -1 : 1;
  return [...items].sort((a, b) => {
    const va = val(a);
    const vb = val(b);
    if (va < vb) return -dir;
    if (va > vb) return dir;
    // Stable, useful tie-breakers: group the slot, better rarity, better upgrade, newest.
    return (
      info(a).slotOrder - info(b).slotOrder ||
      rarityRank(b) - rarityRank(a) ||
      info(b).scorePct - info(a).scorePct ||
      b.uid - a.uid
    );
  });
}

/** Equip an inventory item into the best slot. Returns a message when it cannot. */
export function quickEquip(
  run: RunState,
  uid: number,
): { ok: boolean; reason?: string; slot?: EquipSlot; flask?: number } {
  const it = run.inventory.find((x) => x.uid === uid);
  if (!it) return { ok: false, reason: 'Not in the inventory' };
  if (it.kind === 'gem')
    return quickSocket(run, uid) ? { ok: true } : { ok: false, reason: 'No free socket' };
  if (it.kind === 'flask') {
    const b = flaskBase(it.baseId);
    if (b.level > run.build.level) return { ok: false, reason: `Requires level ${b.level}` };
    const flasks = run.build.flasks;
    let idx = flasks.findIndex((f) => !f);
    if (idx < 0) {
      // Replace the lowest-level flask of the same kind, else the lowest-level one.
      const rank = (f: (typeof flasks)[number]) => (f ? flaskBase(f.baseId).level : -1);
      const same = flasks
        .map((f, i) => ({ f, i }))
        .filter((x) => x.f && flaskBase(x.f.baseId).kind === b.kind)
        .sort((a, c) => rank(a.f) - rank(c.f));
      idx = same.length
        ? same[0].i
        : flasks.map((f, i) => ({ f, i })).sort((a, c) => rank(a.f) - rank(c.f))[0].i;
    }
    return equipFlask(run, uid, idx)
      ? { ok: true, flask: idx }
      : { ok: false, reason: 'Cannot equip' };
  }
  const info = itemInfos(run).get(uid)!;
  if (!info.slot) return { ok: false, reason: info.reason ?? 'Cannot equip' };
  const r = equip(run, uid, info.slot);
  return r.ok ? { ok: true, slot: info.slot } : r;
}

// ---- Gems ---------------------------------------------------------------------------------

export type SocketRef = { slot: EquipSlot; socket: number };

export type Placement = SocketRef & {
  /** Percent change in sustained DPS / effective HP if the gem goes here. */
  dpsPct: number;
  ehpPct: number;
  scorePct: number;
  /** The gem currently there (it would return to the inventory). */
  replaces?: string;
};

/** Every socket the gem could go into, with the effect of putting it there. */
export function placementsFor(run: RunState, gemUid: number): Placement[] {
  const gem = run.inventory.find((x) => x.uid === gemUid);
  if (!gem || gem.kind !== 'gem') return [];
  const base = sheetOf(run);
  const out: Placement[] = [];
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (!it) continue;
    it.sockets.forEach((cur, socket) => {
      const sockets = [...it.sockets];
      sockets[socket] = gem;
      const s = sheetOf(run, {
        ...run.build,
        equipment: { ...run.build.equipment, [slot]: { ...it, sockets } },
      });
      out.push({
        slot,
        socket,
        dpsPct: pct(base.skill.sustainedDps, s.skill.sustainedDps),
        ehpPct: pct(base.ehp, s.ehp),
        scorePct: pct(score(base), score(s)),
        replaces: cur ? gemDef(cur.gemId).name : undefined,
      });
    });
  }
  return out;
}

/** Put a gem in the empty socket where it helps most (ties: the item with the most sockets). */
export function quickSocket(run: RunState, gemUid: number): boolean {
  const empties = placementsFor(run, gemUid).filter((p) => !p.replaces);
  if (empties.length === 0) return false;
  empties.sort(
    (a, b) =>
      b.scorePct - a.scorePct ||
      run.build.equipment[b.slot]!.sockets.length - run.build.equipment[a.slot]!.sockets.length,
  );
  return socketGem(run, empties[0].slot, empties[0].socket, gemUid);
}

/** Move a socketed gem to another socket (swapping with whatever is there). */
export function moveGem(run: RunState, from: SocketRef, to: SocketRef): boolean {
  if (from.slot === to.slot && from.socket === to.socket) return false;
  const a = run.build.equipment[from.slot];
  const b = run.build.equipment[to.slot];
  const ga = a?.sockets[from.socket];
  if (!a || !b || !ga || to.socket >= b.sockets.length) return false;
  const gb = b.sockets[to.socket] ?? null;
  const eq = { ...run.build.equipment };
  if (from.slot === to.slot) {
    const sockets = [...a.sockets];
    sockets[from.socket] = gb;
    sockets[to.socket] = ga;
    eq[from.slot] = { ...a, sockets };
  } else {
    const sa = [...a.sockets];
    const sb = [...b.sockets];
    sa[from.socket] = gb;
    sb[to.socket] = ga;
    eq[from.slot] = { ...a, sockets: sa };
    eq[to.slot] = { ...b, sockets: sb };
  }
  run.build = { ...run.build, equipment: eq };
  return true;
}

/** Inventory items the "discard junk" button removes: non-upgrade normal/magic items. */
export function junkItems(run: RunState): AnyItem[] {
  const infos = itemInfos(run);
  return run.inventory.filter((x) => {
    if (x.kind !== 'item' || (x.rarity !== 'normal' && x.rarity !== 'magic')) return false;
    return !isUpgrade(infos.get(x.uid)!);
  });
}
