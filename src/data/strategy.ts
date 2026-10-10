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
 * - `auto`: a utility skill's own judgement (a guard when hurt, a warcry for a pack, a blink to close a gap).
 * - `off`: never used.
 */
export type SkillRole = 'main' | 'periodic' | 'keepUp' | 'opener' | 'emergency' | 'auto' | 'off';

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
  /** An emergency skill: the share of life below which it is used. */
  life?: number;
};

/**
 * Whom the character fights first.
 * - `nearest`: the nearest enemy (support monsters first).
 * - `rares`: rare, champion and boss enemies as if they were 4 tiles nearer.
 * - `lowest`: the enemy with the smallest share of its life left.
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

/** When a utility flask is drunk: with a rare (or a boss) about, with a pack or a rare about, or whenever an enemy is near. */
export type UtilityFlaskUse = 'rares' | 'packs' | 'always';

export type Strategy = {
  /** Per skill gem, by the gem's uid. */
  skills?: Record<string, SkillTactic>;
  /** The gem uids in the order the character considers them (the main skills are ordered among themselves). */
  order?: number[];
  target?: TargetPriority;
  spacing?: Spacing;
  /** The share of life below which a life flask is drunk. */
  lifeFlask?: number;
  utilityFlask?: UtilityFlaskUse;
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
/** A fight is over when the character has had no target for this long (an opener is used once per fight). */
export const FIGHT_GAP = 2;
/** The default life threshold of an emergency skill. */
export const EMERGENCY_LIFE = 0.5;
/** Enemies this near the character make a pack, for the `pack` and `single` conditions. */
export const PACK_RADIUS = 7;
export const PACK_SIZE = 3;
/** The share of the fights that are packs, for the single DPS figure that comparisons use. */
export const PACK_WEIGHT = 0.7;

/** The pauses a periodic skill without a cooldown of its own can be given, in seconds. */
export const EVERY_CHOICES = [1.5, 3, 5, 8, 12];
/** The life thresholds an emergency skill can be given. */
export const LIFE_CHOICES = [0.3, 0.4, 0.5, 0.6, 0.7];
export const LIFE_FLASK_CHOICES = [0.35, 0.5, 0.65, 0.8];

export const ROLE_NAMES: Record<SkillRole, string> = {
  main: 'Main',
  periodic: 'Periodic',
  keepUp: 'Keep up',
  opener: 'Opener',
  emergency: 'Emergency',
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
  rares: 'Rares and bosses',
  packs: 'Packs and rares',
  always: 'Any fight',
};
