export const DAMAGE_TYPES = ['physical', 'lightning', 'cold', 'fire', 'chaos'] as const;
export type DamageType = (typeof DAMAGE_TYPES)[number];
export const ELEMENTS = ['lightning', 'cold', 'fire'] as const;
export type Element = (typeof ELEMENTS)[number];

export function dmgBit(t: DamageType): number {
  return 1 << DAMAGE_TYPES.indexOf(t);
}
export function dmgMask(ts: readonly DamageType[] | undefined): number {
  if (!ts) return 0;
  let m = 0;
  for (const t of ts) m |= dmgBit(t);
  return m;
}

/**
 * Masks (tags and conditions) are plain numbers holding up to 52 bits. Native bit operators only see 32 bits, so combine,
 * intersect and compare them with `maskOr`, `maskAnd` and `maskSubset`.
 */
const W32 = 4294967296;
export function maskOr(a: number, b: number): number {
  if (a < W32 && b < W32) return (a | b) >>> 0;
  const al = a % W32;
  const bl = b % W32;
  const ah = (a - al) / W32;
  const bh = (b - bl) / W32;
  return ((al | bl) >>> 0) + ((ah | bh) >>> 0) * W32;
}
export function maskAnd(a: number, b: number): number {
  if (a < W32 && b < W32) return (a & b) >>> 0;
  const al = a % W32;
  const bl = b % W32;
  const ah = (a - al) / W32;
  const bh = (b - bl) / W32;
  return ((al & bl) >>> 0) + ((ah & bh) >>> 0) * W32;
}
/** Whether every bit of `need` is set in `have`. */
export function maskSubset(need: number, have: number): boolean {
  return maskAnd(need, have) === need;
}
/** Whether any bit of `a` is set in `b`. */
export function maskIntersects(a: number, b: number): boolean {
  return maskAnd(a, b) !== 0;
}

/** Skill tags. A tag's bit is 2^index; add new tags at the end. */
export const SKILL_TAGS = [
  'attack',
  'spell',
  'melee',
  'projectile',
  'area',
  'strike',
  'chaining',
  'dot',
  'ignite',
  'bleed',
  'poison',
  'aura',
  'fire',
  'cold',
  'lightning',
  'sword',
  'axe',
  'mace',
  'sceptre',
  'dagger',
  'claw',
  'wand',
  'staff',
  'bow',
  'twoHand',
  'oneHand',
  'dualWield',
  'shield',
  'unarmed',
  'hit',
  'triggered',
  // Added by the coverage plan (C2). Bits 31 and up: masks are numbers of up to 52 bits (see `maskOr`).
  'totem',
  'trap',
  'mine',
  'brand',
  'minion',
  'channelling',
  'duration',
  'curse',
  'warcry',
  'herald',
  'guard',
  'movement',
  'nova',
  'slam',
  'physical',
  'chaos',
] as const;
export type SkillTag = (typeof SKILL_TAGS)[number];

const TAG_INDEX = new Map<string, number>(SKILL_TAGS.map((t, i) => [t, i]));
export function tagBit(t: SkillTag): number {
  return 2 ** (TAG_INDEX.get(t) as number);
}
export function tagMask(ts: readonly SkillTag[] | undefined): number {
  if (!ts) return 0;
  let m = 0;
  for (const t of ts) m = maskOr(m, tagBit(t));
  return m;
}

/** Conditions (DESIGN.md §7.3) plus a few internal ones used by keystones. */
export const CONDITIONS = [
  'onFullLife',
  'onLowLife',
  'killedRecently',
  'critRecently',
  'hitRecently',
  'usedFlaskRecently',
  'flaskActive',
  'dualWielding',
  'holdingShield',
  'targetIgnited',
  'targetShocked',
  'targetChilled',
  'targetFrozen',
  'targetBleeding',
  'targetPoisoned',
  'targetStunned',
  'targetRareOrUnique',
  'targetNearby',
  'stunnedRecently',
  'overloadActive',
  'blockedRecently',
  'beenHitRecently',
  'leeching',
  'esFull',
  'targetLowLife',
  'onLowMana',
  'targetCursed',
  'cursed',
  // The buff layer (src/data/buffs.ts).
  'fortified',
  'onslaught',
  'unholyMight',
  'arcaneSurge',
] as const;
export type CondId = (typeof CONDITIONS)[number];

const COND_INDEX = new Map<string, number>(CONDITIONS.map((c, i) => [c, i]));
export function condBit(c: CondId): number {
  return 2 ** (COND_INDEX.get(c) as number);
}

export type ModKind = 'base' | 'inc' | 'more' | 'flag' | 'override';

export type Condition = { id: CondId; not?: boolean };

export type ModSourceKind =
  'tree' | 'item' | 'gem' | 'aura' | 'flask' | 'base' | 'monster' | 'class';
export type ModSource = { kind: ModSourceKind; id: string };

/**
 * Stat ids are plain strings. The vocabulary is documented in `stats.ts`; conversion and gain use
 * composite ids `convert.<from>.<to>` / `gain.<from>.<to>`.
 */
export type StatId = string;

export type Mod = {
  stat: StatId;
  kind: ModKind;
  /** Percent mods are stored as numbers (20 = 20%); flags as 1. */
  value: number;
  damageTypes?: DamageType[];
  /** All must be present on the skill use. */
  tags?: SkillTag[];
  condition?: Condition;
  /** value × floor(statValue / div). */
  per?: { stat: StatId; div: number };
  source?: ModSource;
  /** Local item mod: applied to the item's own base stats only. */
  local?: boolean;
};

/** Shorthand constructor used throughout the data files. */
export function mod(
  stat: StatId,
  kind: ModKind,
  value: number,
  extra?: Partial<Omit<Mod, 'stat' | 'kind' | 'value'>>,
): Mod {
  return { stat, kind, value, ...extra };
}
