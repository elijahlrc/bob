import { itemBase } from '../data/bases';
import type { Item, ItemBase } from '../data/types';
import { DAMAGE_TYPES, mod, type Mod } from '../mods/types';
import type { HandStats } from './skill';

export function itemMods(item: Item): Mod[] {
  const out: Mod[] = [...item.implicits];
  for (const a of item.affixes) out.push(...a.mods);
  if (item.uniqueMods) out.push(...item.uniqueMods);
  return out;
}

function localSum(mods: Mod[], stat: string, kind: Mod['kind'], type?: string): number {
  let s = 0;
  for (const m of mods)
    if (
      m.local &&
      m.stat === stat &&
      m.kind === kind &&
      (!type || m.damageTypes?.includes(type as never))
    )
      s += m.value;
  return s;
}

/** Resolve a weapon's local stats (§7.1 local mods). */
export function weaponStats(item: Item): HandStats {
  const base = itemBase(item.baseId);
  const w = base.weapon!;
  const mods = itemMods(item);
  const flats: [number, number][] = DAMAGE_TYPES.map((t) => [
    localSum(mods, 'damage.min', 'base', t),
    localSum(mods, 'damage.max', 'base', t),
  ]);
  const physInc = 1 + localSum(mods, 'damage', 'inc', 'physical') / 100;
  flats[0] = [(w.min + flats[0][0]) * physInc, (w.max + flats[0][1]) * physInc];
  return {
    flats,
    aps: w.aps * (1 + localSum(mods, 'attackSpeed', 'inc') / 100),
    crit: w.crit * (1 + localSum(mods, 'critChance', 'inc') / 100),
    range: w.range,
    tags: base.tags,
    accuracy: localSum(mods, 'accuracy', 'base'),
  };
}

export type ArmourStats = { armour: number; evasion: number; es: number; block: number };

export function armourStats(item: Item, base: ItemBase = itemBase(item.baseId)): ArmourStats {
  const d = base.defence ?? {};
  const mods = itemMods(item);
  const v = (stat: 'armour' | 'evasion' | 'es', b: number) =>
    Math.round((b + localSum(mods, stat, 'base')) * (1 + localSum(mods, stat, 'inc') / 100));
  return {
    armour: v('armour', d.armour ?? 0),
    evasion: v('evasion', d.evasion ?? 0),
    es: v('es', d.es ?? 0),
    block: (d.block ?? 0) + localSum(mods, 'blockAttack', 'base'),
  };
}

/** Mods an equipped item contributes to the character (non-local mods + resolved defences). */
export function itemGlobalMods(item: Item): Mod[] {
  const base = itemBase(item.baseId);
  const src = { kind: 'item' as const, id: String(item.uid) };
  const out: Mod[] = itemMods(item)
    .filter((m) => !m.local)
    .map((m) => ({ ...m, source: src }));
  if (base.defence) {
    const a = armourStats(item, base);
    if (a.armour) out.push(mod('armour', 'base', a.armour, { source: src }));
    if (a.evasion) out.push(mod('evasion', 'base', a.evasion, { source: src }));
    if (a.es) out.push(mod('es', 'base', a.es, { source: src }));
    if (a.block) out.push(mod('blockAttack', 'base', a.block, { source: src }));
  }
  return out;
}

/** Socketed-gem level bonus of an item ("+N to level of socketed gems"). */
export function socketedGemBonus(item: Item): number {
  let s = 0;
  for (const m of itemMods(item)) if (m.stat === 'socketedGemLevel') s += m.value;
  return s;
}
