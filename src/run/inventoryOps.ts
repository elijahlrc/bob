import {
  Character,
  diffSheets,
  sheetDps,
  type CharacterSheet,
  type SheetDiff,
} from '../calc/character';
import { flaskUpgradesOver } from '../calc/flaskUpgrade';
import { itemMods } from '../calc/items';
import { itemBase, isWeaponClass } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { modsText } from '../mods/text';
import { gemDef } from '../data/gems';
import { aSkill, typesAllow } from '../data/skillTypes';
import { resolveActive } from '../calc/gems';
import { supportLive } from '../calc/reach';
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
import { cfgFor, flaskRank, score, sheetOf } from './bot';
import { gemIdle } from './gemStatus';
import { settlePrimary } from './primary';
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
  /** The worn skill gems the best-slot swap leaves unable to work (a weapon they cannot be used with). */
  skillsIdle: GemItem[];
  /** A flask that would fill an empty flask slot (one of the best few, as many as there are empty slots). */
  fillsFlask?: boolean;
  /** The worn flask slot this flask is an upgrade for (strictly better, or a higher tier of the same type). */
  flaskSlot?: number;
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
  let now: Character | undefined;
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
      skillsIdle: [],
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
          // Only a weapon or an off hand changes which skills can be used; the check needs a Character, so only for those.
          info.skillsIdle =
            slot === 'mainHand' || slot === 'offHand'
              ? skillsIdled({
                  ...dry.sockets,
                  idle: idleAfter(run, (now ??= new Character(run.build, cfgFor(run))), dry.build),
                })
              : [];
        }
      }
    }
    out.set(it.uid, info);
  }
  // An empty flask slot is filled by the best usable flasks in the bag, as many as there are empty slots.
  const empty = run.build.flasks.filter((f) => !f).length;
  if (empty > 0) {
    const flasks = run.inventory
      .filter((x) => x.kind === 'flask' && out.get(x.uid)!.equippable)
      .sort((a, b) => flaskRank(b) - flaskRank(a));
    for (const f of flasks.slice(0, empty)) out.get(f.uid)!.fillsFlask = true;
  }
  for (const it of run.inventory) {
    const info = out.get(it.uid)!;
    if (it.kind !== 'flask' || !info.equippable) continue;
    const slot = flaskUpgradeSlot(run, it);
    if (slot >= 0) info.flaskSlot = slot;
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
  return (
    info.group !== 'gem' &&
    info.equippable &&
    (info.scorePct > 0.5 || !!info.fillsFlask || info.flaskSlot !== undefined)
  );
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

/** The worn flask this one is an upgrade for (the lowest-level one if several), or -1. */
export function flaskUpgradeSlot(run: RunState, f: FlaskItem): number {
  let best = -1;
  run.build.flasks.forEach((x, i) => {
    if (!x || !flaskUpgradesOver(f, x)) return;
    if (best < 0 || flaskBase(x.baseId).level < flaskBase(run.build.flasks[best]!.baseId).level)
      best = i;
  });
  return best;
}

/** The flask slot a flask goes into: an empty one, else the one it upgrades, else the lowest-level flask of the same kind, else the lowest-level one. */
export function flaskTarget(run: RunState, f: FlaskItem): number {
  const flasks = run.build.flasks;
  const empty = flasks.findIndex((x) => !x);
  if (empty >= 0) return empty;
  const up = flaskUpgradeSlot(run, f);
  if (up >= 0) return up;
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
  /**
   * Why the gem would do nothing there: its item has no skill for it to support ("needs a melee skill on this item"), the skill
   * it is linked to cannot use it ("Rime Drift sends a single skull"), or the rotation would never cast it.
   */
  idle?: string;
  /** The DPS change (percent) that comes from taking out the gem it replaces, by itself. */
  fromRemoval?: number;
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
  /** Only this socket (the Skills tab asks what each bag gem would do in the socket picked). */
  at?: SocketRef;
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
  const at = opts.at;
  const wanted = at
    ? spots.filter((p) => p.slot === at.slot && p.socket === at.socket)
    : opts.emptiesFirst && empties.length
      ? empties
      : spots;
  const out: Placement[] = [];
  for (const { slot, it, socket, cur } of wanted) {
    const replaces = cur ? gemDef(cur.gemId).name : undefined;
    // A support in an empty socket of an item with no skill to support changes nothing: no need to work the sheet out.
    if (kind === 'support' && !cur && !hasActiveSkill(it)) {
      const def = gemDef(gem.gemId);
      out.push({
        slot,
        socket,
        dpsPct: 0,
        ehpPct: 0,
        scorePct: 0,
        replaces,
        idle: `needs ${aSkill(def.kind === 'support' ? def.supports : [])} on this item`,
      });
      continue;
    }
    const withGem = (g: GemItem | null): Build => {
      const sockets = [...it.sockets];
      sockets[socket] = g;
      // The primary as camp would settle it once the gem is in (the strongest skill, unless one is starred).
      return settlePrimary(run, {
        ...run.build,
        equipment: { ...run.build.equipment, [slot]: { ...it, sockets } },
      });
    };
    const trial = withGem(gem);
    const s = sheetOf(run, trial);
    const dpsPct = pct(baseDps, sheetDps(s));
    const ehpPct = pct(base.ehp, s.ehp);
    // What taking the old gem out does by itself, so a gain that comes from the gem leaving is not credited to the new one.
    const fromRemoval = cur ? pct(baseDps, sheetDps(sheetOf(run, withGem(null)))) : undefined;
    // A support that would act on nothing, or a skill the rotation would never cast, says why.
    let idle: string | undefined;
    const def = gemDef(gem.gemId);
    if (def.kind === 'support' || (Math.abs(dpsPct) < 0.5 && Math.abs(ehpPct) < 0.5)) {
      const ch = new Character(trial, cfgFor(run));
      idle =
        def.kind === 'support'
          ? (gemIdle(ch, gem.uid, def) ?? undefined)
          : (ch.unusedWhy(gem.uid) ?? undefined);
    }
    out.push({
      slot,
      socket,
      dpsPct,
      ehpPct,
      scorePct: pct(baseScore, score(s)),
      replaces,
      ...(fromRemoval !== undefined && Math.abs(fromRemoval) >= 0.5 ? { fromRemoval } : {}),
      ...(idle ? { idle } : {}),
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
  return pool.sort((a, b) => b.scorePct - a.scorePct || +!!a.idle - +!!b.idle)[0] ?? null;
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

/** The skill gems a swap leaves socketed but unable to work (supports that idle are left out: they ask nothing). */
export function skillsIdled(o: SocketOutcome): GemItem[] {
  return o.idle.filter((x) => gemDef(x.gem.gemId).kind === 'active').map((x) => x.gem);
}

/**
 * What a swap does to the character's skills, when it takes any away (docs/NEWPLAYER.md N8): the skill gems that go to
 * the bag and those left unable to work, with the reason. Empty when no skill is lost.
 */
export function skillsLost(o: SocketOutcome): { gem: GemItem; why: string }[] {
  const out = o.out
    .filter((g) => gemDef(g.gemId).kind === 'active')
    .map((gem) => ({ gem, why: 'goes to the bag: no socket for it' }));
  const idle = o.idle.filter((x) => gemDef(x.gem.gemId).kind === 'active');
  return [...out, ...idle];
}

/** Whether any worn item holds an active skill gem. */
export function hasSocketedSkill(build: Build): boolean {
  return EQUIP_SLOTS.some((s) =>
    (build.equipment[s]?.sockets ?? []).some((g) => g && gemDef(g.gemId).kind === 'active'),
  );
}

/**
 * The run's first skill gem seats itself (docs/NEWPLAYER.md N7): the gem taken from the pick after the first map, when no
 * skill is socketed yet, goes in its best free socket. Every later gem stays in the bag. Returns whether it was socketed.
 */
export function seatFirstSkill(run: RunState, gemUid: number): boolean {
  if (run.history.length !== 1 || hasSocketedSkill(run.build)) return false;
  const g = run.inventory.find((x) => x.uid === gemUid);
  if (g?.kind !== 'gem' || gemDef(g.gemId).kind !== 'active') return false;
  return quickSocket(run, gemUid);
}

/** Where a gem is: the worn item holding it, the bag, or neither (salvaged, sold). */
export function gemWhere(
  run: RunState,
  gemUid: number,
): { at: 'worn'; slot: EquipSlot; item: Item } | { at: 'bag'; gem: GemItem } | null {
  for (const s of EQUIP_SLOTS) {
    const it = run.build.equipment[s];
    if (it?.sockets.some((g) => g?.uid === gemUid)) return { at: 'worn', slot: s, item: it };
  }
  const g = run.inventory.find((x) => x.uid === gemUid);
  return g?.kind === 'gem' ? { at: 'bag', gem: g } : null;
}

/** Whether a bag gem has a free socket where it would do something (what "Socket it" fills). */
export function canQuickSocket(run: RunState, gemUid: number): boolean {
  return placementsFor(run, gemUid, { emptiesFirst: true }).some((p) => !p.replaces && !p.idle);
}

/**
 * When the character has no skill it can use, the bag's skill gem that would do most in a free socket (the camp's warning
 * offers it); null when one is in use or none would work.
 */
export function skillToSocket(run: RunState, ch: Character): GemItem | null {
  if (ch.primary.gemUid !== null) return null;
  const base = sheetOf(run);
  let best: { g: GemItem; score: number } | null = null;
  for (const g of run.inventory) {
    if (g.kind !== 'gem' || gemDef(g.gemId).kind !== 'active') continue;
    const p = bestPlacement(run, g.uid, base);
    if (!p || p.replaces || p.idle) continue;
    if (!best || p.scorePct > best.score) best = { g, score: p.scorePct };
  }
  return best?.g ?? null;
}

/** The build with a socketed gem moved to another socket (swapping with whatever is there), or null when it cannot be. */
function movedBuild(build: Build, from: SocketRef, to: SocketRef): Build | null {
  if (from.slot === to.slot && from.socket === to.socket) return null;
  const a = build.equipment[from.slot];
  const b = build.equipment[to.slot];
  const ga = a?.sockets[from.socket];
  if (!a || !b || !ga || to.socket >= b.sockets.length) return null;
  const gb = b.sockets[to.socket] ?? null;
  const eq = { ...build.equipment };
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
  return { ...build, equipment: eq };
}

/** Move a socketed gem to another socket (swapping with whatever is there). */
export function moveGem(run: RunState, from: SocketRef, to: SocketRef): boolean {
  const b = movedBuild(run.build, from, to);
  if (b) run.build = b;
  return !!b;
}

/**
 * Every other socket a socketed gem could move to, with the effect of moving it there (a swap with the gem there, which goes to
 * the picked gem's socket). `replaces` names that gem.
 */
export function movesFor(run: RunState, from: SocketRef, base?: CharacterSheet): Placement[] {
  base ??= sheetOf(run);
  const baseDps = sheetDps(base);
  const baseScore = score(base);
  const out: Placement[] = [];
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (!it) continue;
    it.sockets.forEach((cur, socket) => {
      const moved = movedBuild(run.build, from, { slot, socket });
      if (!moved) return;
      const s = sheetOf(run, settlePrimary(run, moved));
      out.push({
        slot,
        socket,
        dpsPct: pct(baseDps, sheetDps(s)),
        ehpPct: pct(base.ehp, s.ehp),
        scorePct: pct(baseScore, score(s)),
        ...(cur ? { replaces: gemDef(cur.gemId).name } : {}),
      });
    });
  }
  return out;
}

/** The build after a gem from the bag goes into a socket (what `socketGem` would make of it). */
function socketedBuild(run: RunState, to: SocketRef, gemUid: number): Build | null {
  const it = run.build.equipment[to.slot];
  const g = run.inventory.find((x) => x.uid === gemUid);
  if (!it || g?.kind !== 'gem' || to.socket >= it.sockets.length) return null;
  const sockets = [...it.sockets];
  sockets[to.socket] = g;
  return { ...run.build, equipment: { ...run.build.equipment, [to.slot]: { ...it, sockets } } };
}

/**
 * The main skill a change would take away: the name of the gem that is the main skill now, when after the change it is no longer
 * socketed or can no longer be used; null when the main skill stays (or there is none). The Skills tab asks before such a swap
 * (docs/GEM-SOCKETS.md 2).
 */
export function mainLostBy(run: RunState, after: Build | null): string | null {
  if (!after) return null;
  const main = new Character(run.build, cfgFor(run)).primary;
  if (main.gemUid === null) return null;
  const still = new Character(after, cfgFor(run)).actives.find((a) => a.gemUid === main.gemUid);
  return still?.usable ? null : main.skill.name;
}

/** The main skill a gem from the bag would take away in a socket (`mainLostBy`). */
export function mainLostBySocketing(run: RunState, to: SocketRef, gemUid: number): string | null {
  return mainLostBy(run, socketedBuild(run, to, gemUid));
}

/** The main skill moving a socketed gem would take away (`mainLostBy`). */
export function mainLostByMove(run: RunState, from: SocketRef, to: SocketRef): string | null {
  return mainLostBy(run, movedBuild(run.build, from, to));
}

// ---- Supports for a skill (docs/GEM-SOCKETS.md 4) -------------------------------------------

/** A support that works with a skill, and where it is: in the skill's item, in the bag, or in another worn item. */
export type SupportChoice = {
  gem: GemItem;
  where: 'linked' | 'bag' | EquipSlot;
};

/** Whether a support works with a skill gem (the test the bag's old "Supports for" filter used). */
export function supportFits(support: GemItem, skill: GemItem): boolean {
  const sup = gemDef(support.gemId);
  const sk = gemDef(skill.gemId);
  if (sup.kind !== 'support' || sk.kind !== 'active') return false;
  const r = resolveActive(sk, 20);
  return typesAllow(sup, new Set(r.types)) && supportLive(sup, r).live;
}

/**
 * The supports that work with the skill in a socket: the ones linked to it already, then the bag's (one of each kind, the
 * first found), then those in other worn items. Supports already linked come first and are listed even when they do not fit.
 */
export function supportChoices(run: RunState, at: SocketRef): SupportChoice[] {
  const it = run.build.equipment[at.slot];
  const skill = it?.sockets[at.socket];
  if (!it || !skill || gemDef(skill.gemId).kind !== 'active') return [];
  const out: SupportChoice[] = [];
  it.sockets.forEach((g, i) => {
    if (g && i !== at.socket && gemDef(g.gemId).kind === 'support')
      out.push({ gem: g, where: 'linked' });
  });
  const has = new Set(out.map((c) => c.gem.gemId));
  const bag = new Map<string, GemItem>();
  for (const g of run.inventory) {
    if (g.kind !== 'gem' || has.has(g.gemId) || !supportFits(g, skill)) continue;
    if (!bag.has(g.gemId)) bag.set(g.gemId, g);
  }
  const bagList = [...bag.values()].sort((a, b) =>
    gemDef(a.gemId).name.localeCompare(gemDef(b.gemId).name),
  );
  for (const g of bagList) out.push({ gem: g, where: 'bag' });
  for (const slot of EQUIP_SLOTS) {
    if (slot === at.slot) continue;
    for (const g of run.build.equipment[slot]?.sockets ?? [])
      if (g && !has.has(g.gemId) && !bag.has(g.gemId) && supportFits(g, skill))
        out.push({ gem: g, where: slot });
  }
  return out;
}

/** What linking a set of supports to a skill would do: the build after, and the gems that leave the skill's item for the bag. */
export type SupportPlan = { build: Build; inventory: InventoryItem[]; out: GemItem[] };

/**
 * The skill in `at` with exactly the supports `uids` beside it in its item (docs/GEM-SOCKETS.md 4): chosen supports already
 * there keep their sockets; the others take the empty sockets first, then those of the supports not chosen, then those of other
 * gems. Linked supports not chosen go to the bag, as does whatever a chosen one displaces; a support taken from another item
 * leaves its socket empty. Null when more are chosen than the item has sockets beside the skill.
 */
export function planSupports(run: RunState, at: SocketRef, uids: number[]): SupportPlan | null {
  const it = run.build.equipment[at.slot];
  const skill = it?.sockets[at.socket];
  if (!it || !skill || uids.length > it.sockets.length - 1) return null;
  const chosen = new Set(uids);
  const equipment = { ...run.build.equipment };
  const inventory = [...run.inventory];
  const sockets = [...it.sockets];
  const out: GemItem[] = [];
  // Linked supports not chosen leave.
  sockets.forEach((g, i) => {
    if (g && i !== at.socket && gemDef(g.gemId).kind === 'support' && !chosen.has(g.uid)) {
      out.push(g);
      sockets[i] = null;
    }
  });
  const here = new Set(sockets.flatMap((g) => (g ? [g.uid] : [])));
  const incoming: GemItem[] = [];
  for (const uid of uids) {
    if (here.has(uid)) continue;
    const bi = inventory.findIndex((x) => x.uid === uid);
    if (bi >= 0) {
      incoming.push(inventory.splice(bi, 1)[0] as GemItem);
      continue;
    }
    for (const slot of EQUIP_SLOTS) {
      const other = equipment[slot];
      const si = slot === at.slot ? -1 : (other?.sockets.findIndex((g) => g?.uid === uid) ?? -1);
      if (other && si >= 0) {
        incoming.push(other.sockets[si]!);
        const s2 = [...other.sockets];
        s2[si] = null;
        equipment[slot] = { ...other, sockets: s2 };
        break;
      }
    }
  }
  // Where they go: empty sockets first, then sockets of other gems (never the skill's own).
  const free = sockets.flatMap((g, i) => (i !== at.socket && !g ? [i] : []));
  const others = sockets.flatMap((g, i) => (i !== at.socket && g && !chosen.has(g.uid) ? [i] : []));
  const spots = [...free, ...others];
  for (const g of incoming) {
    const i = spots.shift();
    if (i === undefined) return null;
    const old = sockets[i];
    if (old) out.push(old);
    sockets[i] = g;
  }
  equipment[at.slot] = { ...it, sockets };
  inventory.push(...out);
  const build = { ...run.build, equipment };
  return { build, inventory, out };
}

/** Link exactly the supports `uids` to the skill in `at` (`planSupports`). Returns whether it was done. */
export function linkSupports(run: RunState, at: SocketRef, uids: number[]): boolean {
  const p = planSupports(run, at, uids);
  if (!p) return false;
  run.build = p.build;
  run.inventory.splice(0, run.inventory.length, ...p.inventory);
  return true;
}

/** The sheet of the build a support plan makes (its primary settled as camp would). */
export function planSheet(run: RunState, p: SupportPlan): CharacterSheet {
  return sheetOf(run, settlePrimary(run, p.build));
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

/** What equipping a bag item in `slot` does to the gems, the gems left unable to work included (`idle`). */
export function swapSockets(run: RunState, uid: number, slot: EquipSlot): SocketOutcome {
  const dry = dryEquip(run, uid, slot);
  if (!dry.check.ok) return dry.sockets;
  return { ...dry.sockets, idle: idleAfter(run, new Character(run.build, cfgFor(run)), dry.build) };
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
