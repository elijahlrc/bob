/**
 * The player's strategy (DESIGN.md Appendix A, 2026-10-09): how the character mixes its skills and how it fights, set on the
 * Strategy tab. Everything is optional: what is not set takes its default, so a build nobody has touched plays sensibly.
 */

/**
 * What a skill is for.
 * - `main`: used whenever it can be: the filler, after every other skill has had its chance.
 * - `periodic`: used every so often (its own cooldown, or a pause), ahead of the main skills.
 * - `keepUp`: kept going: a buff renewed as it ends, a curse or a debuff kept on the target, minions kept standing.
 * - `opener`: used once at the start of each fight, and once on each rare or boss enemy.
 * - `emergency`: used when life falls below a threshold.
 * - `escape`: a blink or a run, used to get away: when hurt with an enemy near, or when surrounded (each can be switched off).
 *   A blink goes to the safest spot in reach, not toward the enemy.
 * - `auto`: a utility skill's own judgement (a guard when hurt, a warcry for a pack, a blink to close a gap).
 * - `off`: never used.
 */
export type SkillRole =
  'main' | 'periodic' | 'keepUp' | 'opener' | 'emergency' | 'escape' | 'auto' | 'off';

/**
 * When a skill may be used, on top of its role.
 * - `pack`: 3 or more enemies near the character.
 * - `single`: fewer than that.
 * - `rare`: the target is rare, a champion or a boss.
 * - `boss`: the target is a champion or a boss.
 */
export type SkillWhen = 'any' | 'pack' | 'single' | 'rare' | 'boss';

export type SkillTactic = {
  role?: SkillRole;
  when?: SkillWhen;
  /** A periodic skill without a cooldown of its own: seconds between uses (unset: six of its use times, at least 3 s). */
  every?: number;
  /** An emergency or escape skill: the share of life below which it is used. */
  life?: number;
  /** An escape skill: whether it goes when life is low with an enemy near (unset: yes). */
  lowLife?: boolean;
  /** An escape skill: whether it goes when 3 or more enemies are close, however healthy (unset: yes). */
  surrounded?: boolean;
};

/**
 * Whom the character fights first.
 * - `nearest`: the nearest enemy (support monsters first).
 * - `rares`: rare, champion and boss enemies as if they were 4 tiles nearer.
 * - `lowest`: the enemy with the least life left, in points (support monsters first).
 * - `stick`: the current target until it falls or gets away.
 */
export type TargetPriority = 'nearest' | 'rares' | 'lowest' | 'stick';

/**
 * Where a ranged character stands.
 * - `hold`: at the full range of its skill.
 * - `close`: closer in, within `CLOSE_RANGE` tiles.
 * - `kite`: at full range, stepping back when an enemy comes within `KITE_RANGE` tiles.
 */
export type Spacing = 'hold' | 'close' | 'kite';

/**
 * When a utility flask is drunk: with a boss about, with a rare (or a boss) about, with a pack or a rare about, or whenever an
 * enemy is near.
 */
export type UtilityFlaskUse = 'bosses' | 'rares' | 'packs' | 'always';

/**
 * The flask belt's own settings, by belt slot (docs/ATTRITION.md): a life or hybrid flask's share of life below which it is
 * drunk, a mana flask's share of mana, a utility flask's condition. Unset slots take the defaults by position.
 */
export type FlaskRules = {
  at?: (number | null)[];
  use?: (UtilityFlaskUse | null)[];
};

export type Strategy = {
  /** Per skill gem, by the gem's uid. */
  skills?: Record<string, SkillTactic>;
  /** The gem uids in the order the character considers them (the main skills are ordered among themselves). */
  order?: number[];
  target?: TargetPriority;
  spacing?: Spacing;
  /** The share of life below which a life flask is drunk (before the belt had its own settings: now the first life flask's). */
  lifeFlask?: number;
  /** The utility flasks' condition where `flasks.use` sets none. */
  utilityFlask?: UtilityFlaskUse;
  flasks?: FlaskRules;
};

/** The defaults of the global settings. */
export const STRATEGY_DEFAULTS = {
  target: 'nearest' as TargetPriority,
  spacing: 'hold' as Spacing,
  lifeFlask: 0.5,
  utilityFlask: 'packs' as UtilityFlaskUse,
};

/** How close a ranged character with the `close` spacing stands, in tiles. */
export const CLOSE_RANGE = 3.5;
/** How near an enemy comes before a kiting character steps back, in tiles. */
export const KITE_RANGE = 3;
/** How long a kiting step lasts and how long before the next, in seconds. */
export const KITE_TIME = 0.6;
export const KITE_COOLDOWN = 1.5;
/**
 * The most a character dodges before it holds its ground, in seconds, and how long it then stands in the warnings and fights
 * on (so a room full of blasts cannot keep it from ever attacking). Dodging time is a budget: it drains by this share of a
 * second for each second spent not dodging, so many short dodges count as one long one.
 */
export const DODGE_MAX = 10;
export const DODGE_REST = 5;
export const DODGE_DRAIN = 0.5;
/** A fight is over when the character has had no target for this long (an opener is used once per fight). */
export const FIGHT_GAP = 2;
/** The default life threshold of an emergency skill. */
export const EMERGENCY_LIFE = 0.5;
/** The default life threshold of an escape skill, and the crowd (3 or more enemies within `ESCAPE_CROWD_RADIUS`) that also sends it. */
export const ESCAPE_LIFE = 0.7;
export const ESCAPE_CROWD_RADIUS = 4;
/** An escape skill needs an enemy this near to be hurt by. */
export const ESCAPE_NEAR = 5;
/** Enemies this near the character make a pack, for the `pack` and `single` conditions. */
export const PACK_RADIUS = 7;
export const PACK_SIZE = 3;
/** The share of the fights that are packs, for the single DPS figure that comparisons use. */
export const PACK_WEIGHT = 0.7;

/** The pauses a periodic skill without a cooldown of its own can be given, in seconds. */
export const EVERY_CHOICES = [1.5, 3, 5, 8, 12];
/** The life thresholds an emergency skill can be given. */
export const LIFE_CHOICES = [0.3, 0.4, 0.5, 0.6, 0.7];
/** The life thresholds an escape skill can be given: a wider range, since a blink can wait until the last moment or go early. */
export const ESCAPE_LIFE_CHOICES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
/**
 * The flasks drink in belt order, life (and hybrid) flasks and mana flasks each in their own order, and each takes the threshold
 * of its position: the first life flask drinks first, the last is kept for the worst moment (docs/ATTRITION.md, 2026-10-29).
 */
export const LIFE_FLASK_AT = [0.7, 0.5, 0.35, 0.25, 0.15];
export const MANA_FLASK_AT = [0.4, 0.25, 0.15, 0.1, 0.05];
/** The thresholds a flask can be given. */
export const FLASK_AT_CHOICES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

export type FlaskRule = { life?: number; mana?: number; use?: UtilityFlaskUse };

/**
 * What each belt slot's flask is drunk for, from the kinds in the belt and the strategy: a life threshold for a life or hybrid
 * flask, a mana threshold for a mana or hybrid flask (a hybrid's own setting is its life threshold), a condition for a utility
 * flask. Defaults go by position in the life and mana orders.
 */
export function flaskRules(
  kinds: readonly ('life' | 'mana' | 'hybrid' | 'utility' | null)[],
  s: Strategy | undefined,
): FlaskRule[] {
  let lifePos = 0;
  let manaPos = 0;
  return kinds.map((k, slot) => {
    const set = s?.flasks?.at?.[slot] ?? undefined;
    const rule: FlaskRule = {};
    if (k === 'life' || k === 'hybrid') {
      const legacy = lifePos === 0 ? s?.lifeFlask : undefined;
      rule.life = set ?? legacy ?? LIFE_FLASK_AT[Math.min(lifePos, LIFE_FLASK_AT.length - 1)];
      lifePos++;
    }
    if (k === 'mana' || k === 'hybrid') {
      const own = k === 'mana' ? set : undefined;
      rule.mana = own ?? MANA_FLASK_AT[Math.min(manaPos, MANA_FLASK_AT.length - 1)];
      manaPos++;
    }
    if (k === 'utility')
      rule.use = s?.flasks?.use?.[slot] ?? s?.utilityFlask ?? STRATEGY_DEFAULTS.utilityFlask;
    return rule;
  });
}

export const ROLE_NAMES: Record<SkillRole, string> = {
  main: 'Main',
  periodic: 'Periodic',
  keepUp: 'Keep up',
  opener: 'Opener',
  emergency: 'Emergency',
  escape: 'Escape',
  auto: 'Auto',
  off: 'Off',
};

export const WHEN_NAMES: Record<SkillWhen, string> = {
  any: 'Any fight',
  pack: 'Packs',
  single: 'Few enemies',
  rare: 'Rares and bosses',
  boss: 'Bosses only',
};

export const TARGET_NAMES: Record<TargetPriority, string> = {
  nearest: 'Nearest',
  rares: 'Rares first',
  lowest: 'Weakest',
  stick: 'Stick to target',
};

export const SPACING_NAMES: Record<Spacing, string> = {
  hold: 'Hold at range',
  close: 'Close in',
  kite: 'Kite',
};

export const UTILITY_FLASK_NAMES: Record<UtilityFlaskUse, string> = {
  bosses: 'Bosses only',
  rares: 'Rares and bosses',
  packs: 'Packs and rares',
  always: 'Any fight',
};
