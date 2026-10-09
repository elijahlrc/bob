import type { Rng } from '../core/rng';
import {
  FAMILIES,
  familyMods,
  RARE_FIRST,
  RARE_SECOND,
  type Family,
  type SlotTag,
} from '../data/affixes';
import { isWeaponClass, ITEM_BASES } from '../data/bases';
import { FLASK_AFFIXES, FLASK_BASES } from '../data/flasks';
import { classDef } from '../data/classes';
import { ALL_GEMS, type GemDef } from '../data/gems';
import type { MonsterRarity } from '../data/monsters';
import type { ThemeDef } from '../data/themes';
import type {
  AffixRoll,
  AnyItem,
  InventoryItem,
  FlaskItem,
  GemItem,
  Item,
  ItemBase,
  Rarity,
} from '../data/types';
import { UNIQUE_FLASKS, type UniqueFlaskDef } from '../data/uniqueFlasks';
import { UNIQUES, type UniqueDef } from '../data/uniques';
import type { Mod } from '../mods/types';
import type { UidSource } from './items';

/** Affix-eligibility tags of a base. */
export function itemTags(base: ItemBase): Set<SlotTag> {
  const t = new Set<SlotTag>();
  const c = base.itemClass;
  if (isWeaponClass(c)) {
    t.add('weapon');
    t.add(base.hands === 2 ? 'twoHand' : 'oneHand');
    if (c === 'wand' || c === 'sceptre' || c === 'staff') t.add('casterWeapon');
    if (c === 'bow') t.add('bow');
    if (c === 'staff') t.add('staff');
  } else if (c === 'helmet' || c === 'gloves' || c === 'boots' || c === 'body' || c === 'shield') {
    t.add(c);
    t.add('armourPiece');
    const d = base.defenceType ?? 'ar';
    if (d.includes('ar')) t.add('ar');
    if (d.includes('ev')) t.add('ev');
    if (d.includes('es')) t.add('es');
  } else t.add(c as SlotTag);
  return t;
}

export function eligible(f: Family, tags: Set<SlotTag>, rarity: Rarity): boolean {
  if (f.rareOnly && rarity !== 'rare') return false;
  if (!f.slots.some((s) => tags.has(s))) return false;
  if (f.requires && !f.requires.every((s) => tags.has(s))) return false;
  return true;
}

function rollValue(rng: Rng, lo: number, hi: number, dec = 0): number {
  if (dec === 0) return rng.int(Math.round(lo), Math.round(hi));
  const f = Math.pow(10, dec);
  return rng.int(Math.round(lo * f), Math.round(hi * f)) / f;
}

/** Roll one affix of a type (§11.3 roll rule). Returns null if none is eligible. */
export function rollAffix(
  rng: Rng,
  base: ItemBase,
  ilvl: number,
  rarity: Rarity,
  type: 'prefix' | 'suffix',
  used: Set<string>,
): AffixRoll | null {
  const tags = itemTags(base);
  const fams: Family[] = [];
  const weights: number[] = [];
  for (const f of FAMILIES) {
    if (f.type !== type || used.has(f.id) || !eligible(f, tags, rarity)) continue;
    let w = 0;
    for (const t of f.tiers) if (t.minIlvl <= ilvl) w += t.weight;
    if (w > 0) {
      fams.push(f);
      weights.push(w);
    }
  }
  if (fams.length === 0) return null;
  const f = fams[rng.weightedIndex(weights)];
  const tiers = f.tiers.filter((t) => t.minIlvl <= ilvl);
  const tier = tiers[rng.weightedIndex(tiers.map((t) => t.weight))];
  const values = tier.ranges.map(([lo, hi], i) => rollValue(rng, lo, hi, f.mods[i].dec));
  return { family: f.id, tier: tier.tier, mods: familyMods(f, values) };
}

/** Roll the tier and values of one chosen family, within the tiers the item level allows. */
export function rollAffixOfFamily(rng: Rng, f: Family, ilvl: number): AffixRoll | null {
  const tiers = f.tiers.filter((t) => t.minIlvl <= ilvl);
  if (tiers.length === 0) return null;
  const tier = tiers[rng.weightedIndex(tiers.map((t) => t.weight))];
  const values = tier.ranges.map(([lo, hi], i) => rollValue(rng, lo, hi, f.mods[i].dec));
  return { family: f.id, tier: tier.tier, mods: familyMods(f, values) };
}

export const SOCKET_MAX: Partial<Record<string, number>> = {
  helmet: 4,
  gloves: 4,
  boots: 4,
  body: 6,
  shield: 3,
  quiver: 0,
  ring: 0,
  amulet: 0,
  belt: 0,
};

export function socketCap(ilvl: number): number {
  return ilvl < 10 ? 2 : ilvl < 25 ? 3 : ilvl < 40 ? 4 : ilvl < 50 ? 5 : 6;
}

/** The most sockets an item of this base and level can have. */
export function socketLimit(base: ItemBase, ilvl: number): number {
  const slotMax = isWeaponClass(base.itemClass)
    ? base.hands === 2
      ? 6
      : 3
    : (SOCKET_MAX[base.itemClass] ?? 0);
  return Math.min(slotMax, socketCap(ilvl));
}

/** §11.1 socket count: capped by slot and item level, weighted towards fewer (w(n) = 1/n). */
export function rollSockets(rng: Rng, base: ItemBase, ilvl: number): number {
  const cap = socketLimit(base, ilvl);
  if (cap <= 0) return 0;
  const ns = Array.from({ length: cap }, (_, i) => i + 1);
  return rng.weighted(ns, (n) => 1 / n);
}

const CLASS_WEIGHTS: [string, number][] = [
  ['weapon', 30],
  ['helmet', 9],
  ['gloves', 9],
  ['boots', 9],
  ['body', 11],
  ['shield', 6],
  ['ring', 9],
  ['amulet', 6],
  ['belt', 6],
  ['quiver', 3],
];

/** Pick a base: a class by weight, then usually the best tier the item level allows. */
export function rollBase(rng: Rng, ilvl: number): ItemBase {
  for (let guard = 0; guard < 20; guard++) {
    const group = rng.weighted(CLASS_WEIGHTS, (x) => x[1])[0];
    let pool = ITEM_BASES.filter(
      (b) =>
        !b.uniqueOnly && (group === 'weapon' ? isWeaponClass(b.itemClass) : b.itemClass === group),
    );
    if (group === 'weapon') {
      const cls = rng.pick([...new Set(pool.map((b) => b.itemClass))]);
      pool = pool.filter((b) => b.itemClass === cls);
    } else if (pool[0]?.defenceType) {
      const dt = rng.pick([...new Set(pool.map((b) => b.defenceType))]);
      pool = pool.filter((b) => b.defenceType === dt);
    }
    pool = pool.filter((b) => b.level <= ilvl);
    if (pool.length === 0) continue;
    pool.sort((a, b) => a.level - b.level);
    return rng.chance(0.6) ? pool[pool.length - 1] : rng.pick(pool);
  }
  return ITEM_BASES[0];
}

export function rareName(rng: Rng, base: ItemBase): string {
  const c = base.itemClass;
  const group = isWeaponClass(c)
    ? 'weapon'
    : c === 'ring' || c === 'amulet'
      ? 'jewellery'
      : c === 'belt' || c === 'quiver' || c === 'shield'
        ? c
        : 'armour';
  return `${rng.pick(RARE_FIRST)} ${rng.pick(RARE_SECOND[group])}`;
}

function affixName(roll: AffixRoll): string {
  const f = FAMILIES.find((x) => x.id === roll.family)!;
  const i = Math.min(2, Math.floor(((roll.tier - 1) / f.tiers.length) * 3));
  return f.names[i];
}

/** The name of a magic item: its prefix, its base and its suffix. */
export function magicName(base: ItemBase, affixes: AffixRoll[]): string {
  const p = affixes.find((a) => FAMILIES.find((f) => f.id === a.family)!.type === 'prefix');
  const s = affixes.find((a) => FAMILIES.find((f) => f.id === a.family)!.type === 'suffix');
  return [p ? affixName(p) : '', base.name, s ? affixName(s) : ''].filter(Boolean).join(' ');
}

/** Generate a non-unique item of a given rarity. */
export function rollItemOf(
  rng: Rng,
  uid: UidSource,
  base: ItemBase,
  ilvl: number,
  rarity: Rarity,
): Item {
  const affixes: AffixRoll[] = [];
  const used = new Set<string>();
  const add = (type: 'prefix' | 'suffix') => {
    const a = rollAffix(rng, base, ilvl, rarity, type, used);
    if (a) {
      used.add(a.family);
      affixes.push(a);
    }
    return !!a;
  };
  let name = base.name;
  if (rarity === 'magic') {
    const two = rng.chance(0.5);
    const first: 'prefix' | 'suffix' = rng.chance(0.5) ? 'prefix' : 'suffix';
    add(first);
    if (two) add(first === 'prefix' ? 'suffix' : 'prefix');
    const p = affixes.find((a) => FAMILIES.find((f) => f.id === a.family)!.type === 'prefix');
    const s = affixes.find((a) => FAMILIES.find((f) => f.id === a.family)!.type === 'suffix');
    name = [p ? affixName(p) : '', base.name, s ? affixName(s) : ''].filter(Boolean).join(' ');
  } else if (rarity === 'rare') {
    const target = rng.weighted([4, 5, 6], [50, 35, 15]);
    let pre = 0;
    let suf = 0;
    for (let guard = 0; affixes.length < target && guard < 20; guard++) {
      const canP = pre < 3;
      const canS = suf < 3;
      const type: 'prefix' | 'suffix' = canP && (!canS || rng.chance(0.5)) ? 'prefix' : 'suffix';
      if (add(type)) {
        if (type === 'prefix') pre++;
        else suf++;
      } else if (type === 'prefix') pre = 3;
      else suf = 3;
      if (pre >= 3 && suf >= 3) break;
    }
    name = rareName(rng, base);
  }
  return {
    kind: 'item',
    uid: uid(),
    baseId: base.id,
    rarity,
    name,
    ilvl,
    implicits: base.implicits.map((m) => ({ ...m })),
    affixes,
    sockets: new Array(rollSockets(rng, base, ilvl)).fill(null),
  };
}

export function rollUnique(rng: Rng, uid: UidSource, u: UniqueDef, ilvl: number): Item {
  const base = ITEM_BASES.find((b) => b.id === u.baseId)!;
  const mods: Mod[] = u.mods.map((m) => ({
    stat: m.stat,
    kind: m.kind,
    value: m.min === m.max ? m.min : rng.int(m.min, m.max),
    ...(m.damageTypes ? { damageTypes: m.damageTypes } : {}),
    ...(m.tags ? { tags: m.tags } : {}),
    ...(m.local ? { local: true } : {}),
    ...(m.condition ? { condition: m.condition } : {}),
    ...(m.per ? { per: m.per } : {}),
  }));
  return {
    kind: 'item',
    uid: uid(),
    baseId: base.id,
    rarity: 'unique',
    name: u.name,
    ilvl,
    implicits: base.implicits.map((m) => ({ ...m })),
    affixes: [],
    uniqueId: u.id,
    uniqueMods: mods,
    ...(u.triggers ? { uniqueTriggers: u.triggers } : {}),
    ...(u.req ? { uniqueReq: u.req } : {}),
    ...(u.sockets !== undefined ? { fixedSockets: true } : {}),
    sockets: new Array(u.sockets ?? rollSockets(rng, base, ilvl)).fill(null),
  };
}

export function rollUniqueFlask(
  rng: Rng,
  uid: UidSource,
  u: UniqueFlaskDef,
  ilvl: number,
): FlaskItem {
  const mods: Mod[] = u.mods.map((x) => ({
    stat: x.stat,
    kind: x.kind,
    value: x.min === x.max ? x.min : rng.int(x.min, x.max),
    ...(x.damageTypes ? { damageTypes: x.damageTypes } : {}),
    ...(x.tags ? { tags: x.tags } : {}),
  }));
  return {
    kind: 'flask',
    uid: uid(),
    baseId: u.baseId,
    ilvl,
    name: u.name,
    uniqueId: u.id,
    affixes: [{ family: 'unique', tier: 1, mods }],
  };
}

/** Any unique, item or flask. */
export type UniqueEntry = { kind: 'item'; def: UniqueDef } | { kind: 'flask'; def: UniqueFlaskDef };

/** Every unique an item level allows. */
export function uniquePool(ilvl: number): UniqueEntry[] {
  return [
    ...UNIQUES.filter((u) => u.level <= ilvl).map((def) => ({ kind: 'item' as const, def })),
    ...UNIQUE_FLASKS.filter((u) => u.level <= ilvl).map((def) => ({ kind: 'flask' as const, def })),
  ];
}

/** A unique drops four times as often from the factions that list it (EXPANSION 6.2). */
export const FACTION_POOL_WEIGHT = 4;

/** Roll a unique (item or flask) the item level allows, favouring the faction's own. */
export function rollUniqueOf(
  rng: Rng,
  uid: UidSource,
  ilvl: number,
  faction?: string,
  exclude: ReadonlySet<string> = new Set(),
): InventoryItem | null {
  const pool = uniquePool(ilvl).filter((e) => !exclude.has(e.def.id));
  if (pool.length === 0) return null;
  const e = rng.weighted(pool, (x) =>
    faction && x.def.factions?.includes(faction) ? FACTION_POOL_WEIGHT : 1,
  );
  return e.kind === 'item'
    ? rollUnique(rng, uid, e.def, ilvl)
    : rollUniqueFlask(rng, uid, e.def, ilvl);
}

/** The unique id of an item or flask, if it is a unique. */
export function uniqueIdOf(it: AnyItem): string | undefined {
  return it.kind === 'gem' || it.kind === 'currency' ? undefined : it.uniqueId;
}

/** Skills that need a system the first maps do not teach (a deployable, a minion, a curse, a warcry, a channel). */
const SPECIAL_TAGS = new Set<string>([
  'totem',
  'trap',
  'mine',
  'brand',
  'minion',
  'curse',
  'warcry',
  'guard',
  'movement',
  'herald',
  'channelling',
]);

function isSpecial(g: GemDef): boolean {
  if (g.kind === 'aura') return g.reservePct === 0 || !!g.triggers;
  if (g.kind === 'support')
    return !!(
      g.adds?.length ||
      g.trigger ||
      g.hexOnHit ||
      g.blasphemy ||
      g.global ||
      g.extraTriggers
    );
  return !!g.utility || g.tags.some((t) => SPECIAL_TAGS.has(t));
}

/**
 * How likely a gem is to drop: plain damage skills most, supports and auras a little less, the special kinds least, and the
 * character's own attribute twice as much. The first four maps hold nothing special at all.
 */
export function gemWeight(g: GemDef, classId?: string, ilvl = 99): number {
  const special = isSpecial(g);
  if (special && ilvl <= EARLY_MAPS) return 0;
  let w = special ? 1 : g.kind === 'active' ? 3 : 2;
  if (classId) {
    const a = classDef(classId).attrs;
    const main = a.str >= a.dex && a.str >= a.int ? 'str' : a.dex >= a.int ? 'dex' : 'int';
    if (g.attr.includes(main)) w *= 2;
  }
  return w;
}

export const EARLY_MAPS = 4;

export function rollGem(
  rng: Rng,
  uid: UidSource,
  ctx: { classId?: string; ilvl?: number } = {},
): GemItem {
  const gem = rng.weighted(ALL_GEMS, (g) => gemWeight(g, ctx.classId, ctx.ilvl));
  return { kind: 'gem', uid: uid(), gemId: gem.id };
}

/** A flask base the item level allows (biased to recent tiers), 35% magic with 1–2 affixes. */
export function rollFlask(rng: Rng, uid: UidSource, ilvl: number, magicChance = 0.35): FlaskItem {
  const pool = FLASK_BASES.filter((f) => f.level <= ilvl && !f.uniqueOnly);
  const kinds = [...new Set(pool.map((f) => f.kind))];
  const kind = rng.weighted(kinds, (k) =>
    k === 'life' ? 4 : k === 'mana' ? 2 : k === 'hybrid' ? 1 : 3,
  );
  const ofKind = pool.filter((f) => f.kind === kind).sort((a, b) => a.level - b.level);
  const base =
    kind === 'utility'
      ? rng.pick(ofKind)
      : rng.chance(0.65)
        ? ofKind[ofKind.length - 1]
        : rng.pick(ofKind);
  const affixes: AffixRoll[] = [];
  let name = base.name;
  if (rng.chance(magicChance)) {
    const parts: string[] = [];
    for (const type of ['prefix', 'suffix'] as const) {
      if (affixes.length > 0 && rng.chance(0.4)) continue;
      const fams = FLASK_AFFIXES.filter(
        (a) =>
          a.type === type &&
          a.minIlvl <= ilvl &&
          (a.kinds.length === 0 || a.kinds.includes(base.kind)),
      );
      if (!fams.length) continue;
      const a = rng.weighted(fams, (x) => x.weight);
      affixes.push({
        family: a.id,
        tier: 1,
        mods: a.mods.map((m) => ({ stat: m.stat, kind: m.kind, value: rng.int(m.min, m.max) })),
      });
      parts.push(a.name);
    }
    const pre = affixes.find(
      (a) => FLASK_AFFIXES.find((f) => f.id === a.family)!.type === 'prefix',
    );
    const suf = affixes.find(
      (a) => FLASK_AFFIXES.find((f) => f.id === a.family)!.type === 'suffix',
    );
    name = [
      pre ? FLASK_AFFIXES.find((f) => f.id === pre.family)!.name : '',
      base.name,
      suf ? FLASK_AFFIXES.find((f) => f.id === suf.family)!.name : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
  return { kind: 'flask', uid: uid(), baseId: base.id, ilvl, name, affixes };
}

export type DropContext = {
  ilvl: number;
  monster: MonsterRarity;
  theme?: ThemeDef;
  /** The faction of the monster that dropped it (its own uniques drop more often). */
  faction?: string;
  /** The character's class (its own attribute's gems drop more often). */
  classId?: string;
  /** The player's item quantity and rarity multipliers (1 = none), from gear and flasks. */
  playerQuantity?: number;
  playerRarity?: number;
};

/** §11.4 drop rarity weights, scaled by monster rarity and the theme. */
export function rarityWeights(
  monster: MonsterRarity,
  rareMult = 1,
  rarityMult = 1,
): Record<Rarity, number> {
  const m = monster === 'magic' ? 1.5 : monster === 'rare' ? 3 : monster === 'normal' ? 1 : 6;
  return {
    normal: 60,
    magic: 32 * m * rarityMult,
    rare: 7.5 * m * rareMult * rarityMult,
    unique: 1.5 * m * rarityMult,
  };
}

/** Roll a single item drop (15% flasks). */
export function rollDrop(
  rng: Rng,
  uid: UidSource,
  ctx: DropContext,
  forceRare = false,
): InventoryItem {
  if (!forceRare && rng.chance(0.15)) return rollFlask(rng, uid, ctx.ilvl);
  const w = rarityWeights(ctx.monster, ctx.theme?.rareWeightMult ?? 1, ctx.playerRarity ?? 1);
  let rarity: Rarity = forceRare
    ? 'rare'
    : rng.weighted(['normal', 'magic', 'rare', 'unique'] as Rarity[], (r) => w[r]);
  if (rarity === 'unique') {
    const u = rollUniqueOf(rng, uid, ctx.ilvl, ctx.faction);
    if (u) return u;
    rarity = 'rare';
  }
  return rollItemOf(rng, uid, rollBase(rng, ctx.ilvl), ctx.ilvl, rarity);
}

/** Expected skill gems from one monster, before item quantity: gems are a drop of their own. */
export const GEM_RATE: Record<MonsterRarity, number> = {
  normal: 0.006,
  magic: 0.03,
  rare: 0.18,
  miniboss: 1,
  boss: 1.5,
};

/** Chance that a chest holds a gem instead of an item. */
export const CHEST_GEM_CHANCE = 0.4;

/** The gems one dead monster leaves behind. */
export function rollGemDrops(rng: Rng, uid: UidSource, ctx: DropContext): GemItem[] {
  const q = (1 + (ctx.theme?.itemQuantity ?? 0)) * (ctx.playerQuantity ?? 1);
  const expected = GEM_RATE[ctx.monster] * q;
  const n = Math.floor(expected) + (rng.chance(expected - Math.floor(expected)) ? 1 : 0);
  return Array.from({ length: n }, () => rollGem(rng, uid, ctx));
}

/** §11.4 drops for a killed monster. */
export function rollMonsterDrops(rng: Rng, uid: UidSource, ctx: DropContext): InventoryItem[] {
  const q = (1 + (ctx.theme?.itemQuantity ?? 0)) * (ctx.playerQuantity ?? 1);
  const out: InventoryItem[] = rollGemDrops(rng, uid, ctx);
  switch (ctx.monster) {
    case 'normal':
      if (rng.chance(0.08 * q)) out.push(rollDrop(rng, uid, ctx));
      break;
    case 'magic':
      if (rng.chance(0.25 * q)) out.push(rollDrop(rng, uid, ctx));
      break;
    case 'rare': {
      const n = rng.int(1, 2) + (rng.chance(q - 1) ? 1 : 0);
      for (let i = 0; i < n; i++) out.push(rollDrop(rng, uid, ctx));
      break;
    }
    case 'miniboss':
    case 'boss': {
      // A mini-boss drops a unique from its faction's pool; the boss drops two (EXPANSION 6.2).
      const n = rng.int(3, 4) + (rng.chance(q - 1) ? 1 : 0);
      const uniques = ctx.monster === 'boss' ? 2 : 1;
      const seen = new Set<string>();
      for (let i = 0; i < uniques; i++) {
        const u = rollUniqueOf(rng, uid, ctx.ilvl, ctx.faction, seen);
        if (u) {
          out.push(u);
          seen.add(uniqueIdOf(u) ?? '');
        } else out.push(rollDrop(rng, uid, ctx, true));
      }
      for (let i = uniques; i < n; i++) out.push(rollDrop(rng, uid, ctx));
      break;
    }
  }
  return out;
}

/** §10.1 chests: one magic-or-better item, or (40%) a gem. */
export function rollChest(rng: Rng, uid: UidSource, ilvl: number): InventoryItem[] {
  if (rng.chance(CHEST_GEM_CHANCE)) return [rollGem(rng, uid, { ilvl })];
  const w = rarityWeights('magic');
  let rarity = rng.weighted(['magic', 'rare', 'unique'] as Rarity[], (r) => w[r]);
  if (rarity === 'unique') {
    const u = rollUniqueOf(rng, uid, ilvl);
    if (u) return [u];
    rarity = 'rare';
  }
  return [rollItemOf(rng, uid, rollBase(rng, ilvl), ilvl, rarity)];
}
