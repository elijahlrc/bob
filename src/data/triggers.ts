import type { DamageType, SkillTag } from '../mods/types';
import { gemDef } from './gems';

/**
 * Triggers (EXPANSION 5.5). A trigger makes something happen when the player does something, without
 * the player spending action time on it. Triggered skills follow the reference game's rules (AUDIT-3.9): each
 * triggered skill has its own cooldown, a triggered skill costs no mana, and nothing triggers from a triggered skill.
 */
export type TriggerOn =
  /** The player lands a hit. */
  | 'hit'
  /** The player lands a critical strike. */
  | 'crit'
  /** The player starts an attack. */
  | 'attack'
  /** The player starts casting a spell. */
  | 'cast'
  /** The player kills an enemy. */
  | 'kill'
  /** The player blocks a hit. */
  | 'block'
  /** The player takes damage (see `threshold`). */
  | 'hitTaken';

export type TriggerEffect =
  /** Cast one of the active spells socketed in the same item. */
  | { kind: 'castSocketed'; spellTags?: SkillTag[] }
  /** Cast a skill that exists only through this trigger. */
  | { kind: 'castGranted'; skillId: string; level: number }
  /** Kill triggers: the dead enemy explodes for a share of its maximum life. */
  | { kind: 'explode'; pctOfMaxLife: number; dtype: DamageType; radius: number }
  /** Kill triggers: the dead enemy's shock or ignite spreads to enemies nearby. */
  | { kind: 'spread'; ailment: 'shock' | 'ignite'; radius: number }
  /** Give up a share of maximum life to gain that much in another pool (Demon Stitcher analog). */
  | { kind: 'sacrifice'; pctOfLife: number; pool: 'es' | 'mana' }
  /** Kill triggers: bolts strike the enemies around the character for a while (Herald of Thunder). */
  | {
      kind: 'storm';
      seconds: number;
      interval: number;
      radius: number;
      dtype: DamageType;
      effectiveness: number;
    }
  /** Recover a share of maximum life, or of armour, into a pool. */
  | { kind: 'recover'; pool: 'life' | 'es' | 'mana'; pctOf: 'maxLife' | 'armour'; value: number };

export type TriggerDef = {
  on: TriggerOn;
  /** Only skill uses with all these tags count (for example 'melee'). */
  tags?: SkillTag[];
  /** Kill triggers: only enemies carrying this count. */
  targetHas?: 'shock' | 'ignite' | 'hex' | 'freeze' | 'poison' | 'bleed';
  /** Chance each time the trigger is met, percent. */
  chance: number;
  /** Seconds between two firings of this trigger. */
  cooldown: number;
  /** Hit-taken triggers: fire after damage equal to this percent of maximum life has been taken. */
  threshold?: number;
  effect: TriggerEffect;
};

const TARGET_WORD: Record<NonNullable<TriggerDef['targetHas']>, string> = {
  shock: 'shocked',
  ignite: 'ignited',
  hex: 'hexed',
  freeze: 'frozen',
  poison: 'poisoned',
  bleed: 'bleeding',
};

const TAG_WORD: Record<string, string> = {
  melee: 'melee',
  attack: 'attack',
  spell: 'spell',
  projectile: 'projectile',
};

function effectText(e: TriggerEffect): string {
  switch (e.kind) {
    case 'castSocketed':
      return `cast a socketed ${(e.spellTags ?? []).map((t) => TAG_WORD[t] ?? t).join(' ')} spell`.replace(
        'socketed  ',
        'socketed ',
      );
    case 'castGranted':
      return `cast level ${e.level} ${gemDef(e.skillId).name}`;
    case 'explode':
      return `the enemy explodes for ${e.pctOfMaxLife}% of its maximum life as ${e.dtype} damage`;
    case 'spread':
      return `spread its ${e.ailment} to nearby enemies`;
    case 'storm':
      return `bolts of ${e.dtype} strike the enemies around you for ${e.seconds} seconds`;
    case 'sacrifice':
      return `sacrifice ${e.pctOfLife}% of life to gain that much ${e.pool === 'es' ? 'energy shield' : e.pool}`;
    case 'recover':
      return `recover ${e.value}% of ${e.pctOf === 'armour' ? 'armour' : 'maximum life'} as ${e.pool === 'es' ? 'energy shield' : e.pool}`;
  }
}

/** When a trigger fires, as a phrase: "on melee critical strike", "when you block". */
export function triggerCause(t: TriggerDef): string {
  const tags = (t.tags ?? []).map((x) => TAG_WORD[x] ?? x).join(' ');
  switch (t.on) {
    case 'hit':
      return tags ? `on ${tags} hit` : 'on hit';
    case 'crit':
      return tags ? `on ${tags} critical strike` : 'on critical strike';
    case 'attack':
      return 'when you attack';
    case 'cast':
      return 'when you cast a spell';
    case 'kill':
      return `when you kill ${t.targetHas ? `a ${TARGET_WORD[t.targetHas]} enemy` : 'an enemy'}`;
    case 'block':
      return 'when you block';
    case 'hitTaken':
      return `when you take damage (after ${t.threshold ?? 0}% of maximum life)`;
  }
}

/** One line for an item card, rendered from the structure (never parsed back). */
export function triggerText(t: TriggerDef): string {
  const chance = t.chance < 100 ? `${t.chance}% chance to ` : '';
  return `${chance}${effectText(t.effect)} ${triggerCause(t)}, ${t.cooldown} s cooldown`;
}
