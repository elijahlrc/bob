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

/** Skill tags. Kept to at most 32 (31 in use) so they fit a 32-bit mask; widen it if a 33rd is needed. */
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
] as const;
export type SkillTag = (typeof SKILL_TAGS)[number];

export function tagBit(t: SkillTag): number {
  return 1 << SKILL_TAGS.indexOf(t);
}
export function tagMask(ts: readonly SkillTag[] | undefined): number {
  if (!ts) return 0;
  let m = 0;
  for (const t of ts) m |= tagBit(t);
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
] as const;
export type CondId = (typeof CONDITIONS)[number];

export function condBit(c: CondId): number {
  return 1 << CONDITIONS.indexOf(c);
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
