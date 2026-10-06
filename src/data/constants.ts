/**
 * Tunable constants (DESIGN.md). Every value marked _tunable_ in the doc lives here so balance
 * passes are edit → rerun.
 */
export const TICK_RATE = 60;
export const DT = 1 / TICK_RATE;

// §6.1 Base character stats.
export const BASE_LIFE = (level: number): number => 38 + 12 * level;
export const BASE_MANA = (level: number): number => 34 + 6 * level;
export const BASE_EVASION = (level: number): number => 50 + 3 * level;
export const BASE_ACCURACY = (level: number): number => 2 * level;
export const BASE_MANA_REGEN_PCT = 1.75;
export const BASE_CRIT_MULTI = 150;
/** Built-in flat physical damage to attacks per character level (tunable; see Appendix A). */
export const ATTACK_LEVEL_MIN = 0.7;
export const ATTACK_LEVEL_MAX = 1.4;
export const DEFAULT_MAX_RES = 75;
export const HARD_MAX_RES = 90;
export const BASE_MOVE_SPEED = 4.0;
export const LOW_LIFE = 0.35;

// §6.2 Attributes (per point).
export const STR_LIFE = 0.5;
export const STR_MELEE_PHYS_INC = 0.2;
export const DEX_ACCURACY = 2;
export const DEX_EVASION_INC = 0.2;
export const INT_MANA = 0.5;
export const INT_ES_INC = 0.2;

// §6.3 Defences.
export const ARMOUR_CAP = 0.9;
export const BLOCK_CAP = 75;
export const RES_FLOOR = -200;
export const ES_RECHARGE_DELAY = 2.0;
export const ES_RECHARGE_RATE = 0.333;
export const MIN_HIT_CHANCE = 0.05;

// §6.4 Recovery.
export const LEECH_RATE_PER_INSTANCE = 0.02;
export const LEECH_RATE_CAP = 0.2;

// §6.6 Ailments.
export const IGNITE_DPS_FRAC = 0.5;
export const IGNITE_DURATION = 4;
export const BLEED_DPS_FRAC = 0.2;
export const BLEED_MOVING_MULT = 2;
export const BLEED_DURATION = 5;
export const POISON_DPS_FRAC = 0.2;
export const POISON_DURATION = 2;
export const SHOCK_CAP = 50;
export const CHILL_CAP = 30;
export const SHOCK_DURATION = 2;
export const CHILL_DURATION = 2;
export const MIN_SHOCK_CHILL = 5;
export const FREEZE_MAX = 3;
export const FREEZE_PER_R = 6;
export const MIN_FREEZE = 0.3;
export const WOUND_DANCE_STACKS = 8;

// §6.6a Stun.
export const STUN_BASE_DURATION = 0.35;
export const STUN_MIN_CHANCE = 0.1;
export const STUN_GRACE = 0.5;
export const STUN_NON_PHYS = 0.5;

// §6.7 Speeds and costs.
export const DUAL_WIELD_MORE_APS = 10;
export const FISTS = { min: 2, max: 6, aps: 1.2, crit: 0 };
export const HIT_AT = 0.6;

// §8.2 Simulation.
export const PROJECTILE_SPEED = 12;
export const RECENT = 4;

// §6.9 Flasks.
export const FLASK_CHARGES_ON_KILL = { normal: 1, magic: 2, rare: 5, unique: 10 } as const;

// §13 AI.
export const ENGAGE_RANGE = 9;
export const LOOT_RANGE = 6;
export const MONSTER_AGGRO = 8;
export const PACK_ALERT = 6;
export const LEASH_TIME = 6;
export const STUCK_TIME = 20;
export const REPATH_INTERVAL = 0.5;
export const RETREAT_TIME = 0.8;
export const RETREAT_COOLDOWN = 3;

// §12.1 Monster scaling (tunable; bot-balanced, see DESIGN.md Appendix A).
export const MONSTER_LIFE_BASE = 20;
export const MONSTER_LIFE_GROWTH = 1.055;
export const MONSTER_LIFE_LINEAR = 12;
export const MONSTER_HIT_BASE = 2;
export const MONSTER_HIT_COEF = 0.085;
export const MONSTER_HIT_EXP = 1.5;
/** Early-map easing: monster life and damage ramp from these fractions to full by EASE_LEVEL. */
export const EASE_LEVEL = 20;
export const EASE_LIFE = 0.5;
export const EASE_DAMAGE = 0.6;
export function easeLife(m: number): number {
  return EASE_LIFE + (1 - EASE_LIFE) * Math.min(1, (m - 1) / (EASE_LEVEL - 1));
}
export function easeDamage(m: number): number {
  return EASE_DAMAGE + (1 - EASE_DAMAGE) * Math.min(1, (m - 1) / (EASE_LEVEL - 1));
}

// §10 Labyrinth.
export const CELL = 14;
export const MAP_MAX = 160;
