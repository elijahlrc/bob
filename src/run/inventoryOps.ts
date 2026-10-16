import {
  Character,
  diffSheets,
  sheetDps,
  type CharacterSheet,
  type SheetDiff,
} from '../calc/character';
import { itemMods } from '../calc/items';
import { itemBase, isWeaponClass } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { modsText } from '../mods/text';
import { gemDef } from '../data/gems';
import {
  EQUIP_SLOTS,
  type InventoryItem,
  type EquipSlot,
  type FlaskItem,
  type GemItem,
  type Item,
  type Rarity,
  type Build,
} from '../data/types';
import {
  dryEquip,
  equip,
  equipFlask,
  slotsFor,
  socketGem,
  type EquipCheck,
  type SocketOutcome,
} from './inventory';
import { cfgFor, score, sheetOf } from './bot';
import { gemIdle } from './gemStatus';
import { isFavourite } from './found';
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
  /** Percent change in DPS / effective HP / the bot's score if equipped in `slot`. */
  dpsPct: number;
  ehpPct: number;
  scorePct: number;
  replaces?: Item;
  /** The gems the best-slot swap sends to the bag (a row's warning; no sheet is worked out for it). */
  gemsOut: GemItem[];
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

/** A slot's name where two slots share a label: "Ring 1", "Ring 2". */
export function slotName(s: EquipSlot): string {
  return s === 'ring1' ? 'Ring 1' : s === 'ring2' ? 'Ring 2' : SLOT_LABEL[s];
}

export function groupOf(it: InventoryItem): ItemGroup {
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

function slotOrder(it: InventoryItem): number {
  if (it.kind === 'item') return EQUIP_SLOTS.indexOf(slotsFor(it)[0]);
  return 20 + GROUP_ORDER[groupOf(it)];
}

function naturalLabel(it: InventoryItem): string {
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
      gemsOut: [],
    };
    if (it.kind === 'flask') {
      info.equippable = flaskBase(it.baseId).level <= run.build.level;
      if (!info.equippable) info.reason = `Requires level ${flaskBase(it.baseId).level}`;
    } else if (it.kind === 'item') {
      info.equippable = false;
      let best = -Infinity;
      for (const slot of slotsFor(it)) {
        // The build the real equip would leave (a two-hander clears the off hand), not a guess at it.
        const dry = dryEquip(run, it.uid, slot);
        if (!dry.check.ok) {
          info.reason ??= dry.check.reason;
          continue;
        }
        const s = sheetOf(run, dry.build);
        const sc = score(s);
        if (sc > best) {
          best = sc;
          info.slot = slot;
          info.equippable = true;
          info.reason = undefined;
          info.dpsPct = pct(sheetDps(base), sheetDps(s));
          info.ehpPct = pct(base.ehp, s.ehp);
          info.scorePct = pct(baseScore, sc);
          info.replaces = run.build.equipment[slot];
          info.gemsOut = dry.sockets.out;
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

function rarityRank(it: InventoryItem): number {
  return it.kind === 'item'
    ? RARITY_RANK[it.rarity]
    : it.kind === 'flask'
      ? it.affixes.length
        ? 1
        : 0
      : 0;
}

function name(it: InventoryItem): string {
  return it.kind === 'gem' ? gemDef(it.gemId).name : it.name;
}

/** Whether an item is an upgrade worth highlighting. */
export function isUpgrade(info: ItemInfo): boolean {
  return info.group !== 'gem' && info.equippable && info.scorePct > 0.5;
}

export function filterItems(
  items: InventoryItem[],
  infos: Map<number, ItemInfo>,
  f: FilterKey,
): InventoryItem[] {
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
  items: InventoryItem[],
  infos: Map<number, ItemInfo>,
  key: SortKey,
  desc: boolean,
): InventoryItem[] {
  const info = (x: InventoryItem) => infos.get(x.uid)!;
  const val = (x: InventoryItem): number | string => {
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

/** The flask slot a flask goes into: an empty one, else the lowest-level flask of the same kind, else the lowest-level one. */
export function flaskTarget(run: RunState, f: FlaskItem): number {
  const flasks = run.build.flasks;
  const empty = flasks.findIndex((x) => !x);
  if (empty >= 0) return empty;
  const rank = (x: (typeof flasks)[number]) => (x ? flaskBase(x.baseId).level : -1);
  const kind = flaskBase(f.baseId).kind;
  const same = flasks
    .map((x, i) => ({ x, i }))
    .filter((e) => e.x && flaskBase(e.x.baseId).kind === kind)
    .sort((a, c) => rank(a.x) - rank(c.x));
  return same.length
    ? same[0].i
    : flasks.map((x, i) => ({ x, i })).sort((a, c) => rank(a.x) - rank(c.x))[0].i;
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
    const idx = flaskTarget(run, it);
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
  /** Percent change in DPS / effective HP if the gem goes here. */
  dpsPct: number;
  ehpPct: number;
  scorePct: number;
  /** The gem currently there (it would return to the inventory). */
  replaces?: string;
};

/**
 * Whether an item has a skill that supports can link to: an active gem in one of its sockets, or one the item grants. Supports
 * link within an item (`Character`, "linked"), so a support put in an item with none does nothing.
 */
function hasActiveSkill(it: Item): boolean {
  if (it.sockets.some((g) => g && gemDef(g.gemId).kind === 'active')) return true;
  return itemMods(it).some(
    (m) =>
      m.stat.startsWith('grantSkill.') &&
      gemDef(m.stat.slice(m.stat.indexOf('.') + 1)).kind === 'active',
  );
}

export type PlacementOpts = {
  /** The sheet of the character as it is, when the caller has it (a list of gems shares one). */
  base?: CharacterSheet;
  /**
   * Only the empty sockets, when there are any (a gem put in a full one pushes another out, which no list of badges leans on). The
   * Skills tab's badges and `quickSocket` want this; the sockets a selected gem could go into want all of them.
   */
  emptiesFirst?: boolean;
};

/** Every socket the gem could go into, with the effect of putting it there. */
export function placementsFor(
  run: RunState,
  gemUid: number,
  opts: PlacementOpts = {},
): Placement[] {
  const gem = run.inventory.find((x) => x.uid === gemUid);
  if (!gem || gem.kind !== 'gem') return [];
  const kind = gemDef(gem.gemId).kind;
  const base = opts.base ?? sheetOf(run);
  const baseDps = sheetDps(base);
  const baseScore = score(base);
  const spots: { slot: EquipSlot; it: Item; socket: number; cur: Item['sockets'][number] }[] = [];
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (it) it.sockets.forEach((cur, socket) => spots.push({ slot, it, socket, cur }));
  }
  const empties = spots.filter((p) => !p.cur);
  const wanted = opts.emptiesFirst && empties.length ? empties : spots;
  const out: Placement[] = [];
  for (const { slot, it, socket, cur } of wanted) {
    const replaces = cur ? gemDef(cur.gemId).name : undefined;
    // A support in an empty socket of an item with no skill to support changes nothing: no need to work the sheet out.
    if (kind === 'support' && !cur && !hasActiveSkill(it)) {
      out.push({ slot, socket, dpsPct: 0, ehpPct: 0, scorePct: 0, replaces });
      continue;
    }
    const sockets = [...it.sockets];
    sockets[socket] = gem;
    const s = sheetOf(run, {
      ...run.build,
      equipment: { ...run.build.equipment, [slot]: { ...it, sockets } },
    });
    out.push({
      slot,
      socket,
      dpsPct: pct(baseDps, sheetDps(s)),
      ehpPct: pct(base.ehp, s.ehp),
      scorePct: pct(baseScore, score(s)),
      replaces,
    });
  }
  return out;
}

/** The best socket for each of the gems, as the Skills tab's list badges show it (empty sockets first). */
export function bestPlacements(run: RunState, gemUids: number[]): Map<number, Placement | null> {
  const base = sheetOf(run);
  const m = new Map<number, Placement | null>();
  for (const uid of gemUids) m.set(uid, bestPlacement(run, uid, base));
  return m;
}

/** The best socket for one gem (the empty sockets, or all of them when none is empty), by the bot's score. */
export function bestPlacement(
  run: RunState,
  gemUid: number,
  base?: CharacterSheet,
): Placement | null {
  const ps = placementsFor(run, gemUid, { base, emptiesFirst: true });
  const empties = ps.filter((p) => !p.replaces);
  const pool = empties.length ? empties : ps;
  return pool.sort((a, b) => b.scorePct - a.scorePct)[0] ?? null;
}

/** Put a gem in the empty socket where it helps most (ties: the item with the most sockets). */
export function quickSocket(run: RunState, gemUid: number): boolean {
  const empties = placementsFor(run, gemUid, { emptiesFirst: true }).filter((p) => !p.replaces);
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

/** Inventory items the "discard junk" button removes: non-upgrade normal/magic items that are not favourites. */
export function junkItems(run: RunState): InventoryItem[] {
  const infos = itemInfos(run);
  return run.inventory.filter((x) => {
    if (x.kind !== 'item' || (x.rarity !== 'normal' && x.rarity !== 'magic')) return false;
    if (isFavourite(run, x.uid)) return false;
    return !isUpgrade(infos.get(x.uid)!);
  });
}

// ---- Compare, one entry per slot --------------------------------------------------------------

/** What putting an inventory item into one particular slot would do. */
export type SlotCompare = {
  slot: EquipSlot;
  /** "Ring 1". */
  label: string;
  /** The item worn there now. */
  equipped?: Item;
  check: EquipCheck;
  /** Change to the character sheet (null when the item cannot go there). */
  delta: SheetDiff | null;
  dpsPct: number;
  ehpPct: number;
  scorePct: number;
  /** Everything that goes back to the bag, the item that was worn there included. */
  toBag: Item[];
  /** What goes back besides the item worn there: a two-hander's off hand. */
  alsoMoves: Item[];
  /** What happens to the gems (docs/EQUIP.md 3.1). */
  sockets: SocketOutcome;
  /** The slot the bot's score likes best (what `itemInfos` calls the item's slot). */
  best: boolean;
};

/**
 * Worn gems that do something now and nothing after the swap: a support whose skill left its item, a skill the new weapon
 * cannot use. Compared with the character as it is, so a gem that was idle already is not blamed on the swap.
 */
function idleAfter(run: RunState, now: Character, build: Build): SocketOutcome['idle'] {
  const then = new Character(build, cfgFor(run));
  const idle: SocketOutcome['idle'] = [];
  for (const slot of EQUIP_SLOTS)
    for (const g of build.equipment[slot]?.sockets ?? []) {
      if (!g) continue;
      const def = gemDef(g.gemId);
      const why = gemIdle(then, g.uid, def);
      if (why && !gemIdle(now, g.uid, def)) idle.push({ gem: g, why });
    }
  return idle;
}

/** One entry for every slot the item may go into: rings give two, one-handers two, a two-hander its own. */
export function compareSlots(run: RunState, uid: number): SlotCompare[] {
  const it = run.inventory.find((x) => x.uid === uid);
  if (!it || it.kind !== 'item') return [];
  const base = sheetOf(run);
  const baseScore = score(base);
  let ch: Character | undefined;
  const before = () => (ch ??= new Character(run.build, cfgFor(run)));
  const out: SlotCompare[] = slotsFor(it).map((slot) => {
    const dry = dryEquip(run, uid, slot);
    const equipped = run.build.equipment[slot];
    const c: SlotCompare = {
      slot,
      label: slotName(slot),
      equipped,
      check: dry.check,
      delta: null,
      dpsPct: 0,
      ehpPct: 0,
      scorePct: 0,
      toBag: dry.toBag,
      alsoMoves: dry.toBag.filter((x) => x.uid !== equipped?.uid),
      sockets: dry.sockets,
      best: false,
    };
    if (dry.check.ok) {
      c.sockets = { ...dry.sockets, idle: idleAfter(run, before(), dry.build) };
      const s = sheetOf(run, dry.build);
      c.delta = diffSheets(base, s);
      c.dpsPct = pct(sheetDps(base), sheetDps(s));
      c.ehpPct = pct(base.ehp, s.ehp);
      c.scorePct = pct(baseScore, score(s));
    }
    return c;
  });
  let best: SlotCompare | null = null;
  for (const c of out) if (c.check.ok && (!best || c.scorePct > best.scorePct)) best = c;
  if (best) best.best = true;
  return out;
}

export type FlaskCompare = {
  idx: number;
  equipped: FlaskItem | null;
  /** The slot a plain Equip uses (`flaskTarget`). */
  chosen: boolean;
  ok: boolean;
  reason?: string;
};

/** The five flask slots a carried flask could go into, and which one a plain Equip picks. */
export function compareFlasks(run: RunState, uid: number): FlaskCompare[] {
  const f = run.inventory.find((x) => x.uid === uid);
  if (!f || f.kind !== 'flask') return [];
  const need = flaskBase(f.baseId).level;
  const ok = need <= run.build.level;
  const pick = flaskTarget(run, f);
  return run.build.flasks.map((equipped, idx) => ({
    idx,
    equipped,
    chosen: idx === pick,
    ok,
    reason: ok ? undefined : `Requires level ${need}`,
  }));
}

/** Everything a search box looks at for an item: its name, its base, its rarity and the words of what it gives. */
export function searchText(it: InventoryItem): string {
  if (it.kind === 'gem') return gemDef(it.gemId).name.toLowerCase();
  const lines = it.affixes.flatMap((a) => modsText(a.mods));
  if (it.kind === 'flask')
    return [it.name, flaskBase(it.baseId).name, ...lines].join(' ').toLowerCase();
  return [
    it.name,
    itemBase(it.baseId).name,
    it.rarity,
    ...modsText(it.implicits),
    ...lines,
    ...modsText(it.uniqueMods ?? []),
  ]
    .join(' ')
    .toLowerCase();
}
