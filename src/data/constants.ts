/**
 * Tunable constants (DESIGN.md). Every value marked _tunable_ in the doc lives here so balance
 * passes are edit → rerun.
 */
export const TICK_RATE = 60;
export const DT = 1 / TICK_RATE;

/**
 * The shared curve of spell base damage at damage effectiveness 100%: the average roll, from gem level 1 to 20 (geometric,
 * and the same curve past 20). A spell's own damage is this times its effectiveness (COVERAGE 5.2).
 */
export const SPELL_BASE_L1 = 6.5;
export const SPELL_BASE_L20 = 380;
export const spellBaseDamage = (level: number): number =>
  SPELL_BASE_L1 * Math.pow(SPELL_BASE_L20 / SPELL_BASE_L1, (level - 1) / 19);

// §6.1 Base character stats.
export const BASE_LIFE = (level: number): number => 38 + 12 * level;
export const BASE_MANA = (level: number): number => 34 + 6 * level;
export const BASE_EVASION = (level: number): number => 53 + 3 * level;
export const BASE_ACCURACY = (level: number): number => 2 * level;
export const BASE_MANA_REGEN_PCT = 1.75;
export const BASE_CRIT_MULTI = 150;
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
/** Share of maximum energy shield recharged per second (the reference game: 20%; the mechanics audit). */
export const ES_RECHARGE_RATE = 0.2;
export const MIN_HIT_CHANCE = 0.05;
/** Attacker accuracy counts 15% extra in the hit chance formula (as in the reference game). */
export const ACCURACY_FACTOR = 1.15;

// §6.4 Recovery.
export const LEECH_RATE_PER_INSTANCE = 0.02;
export const LEECH_RATE_CAP = 0.2;
/** One leech instance can recover at most this share of the maximum (as in the reference game). */
export const LEECH_INSTANCE_MAX = 0.1;

// §6.6 Ailments.
export const IGNITE_DPS_FRAC = 0.5;
export const IGNITE_DURATION = 4;
/** Bleed deals 70% of the hit's physical damage a second (as in the reference game), tripled while the target moves; a monster's bleed on the player deals 10%. */
export const BLEED_DPS_FRAC = 0.7;
export const MONSTER_BLEED_DPS_FRAC = 0.1;
export const BLEED_MOVING_MULT = 3;
/** Ailments inflicted by a critical strike carry this fixed multiplier, whatever the critical strike multiplier (as in the reference game). */
export const CRIT_AILMENT_MULT = 1.5;
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
/** After a freeze on the character ends it cannot be frozen again for this long, and a freeze is not lengthened while it lasts. */
export const FREEZE_GRACE = 1;
export const WOUND_DANCE_STACKS = 8;

// §6.6a Stun.
export const STUN_BASE_DURATION = 0.35;
/** A stun chance at or under this is ignored (the reference game: 20%). */
export const STUN_MIN_CHANCE = 0.2;
/** Stun damage weights (as in the reference game): melee physical, and non-melee non-physical. */
export const STUN_MELEE_PHYS = 1.25;
export const STUN_NON_MELEE_NON_PHYS = 0.75;
/** While energy shield is up, a stun is ignored with this chance (as in the reference game). */
export const STUN_ES_IGNORE = 0.5;
export const STUN_GRACE = 0.5;
/** Blocking a hit staggers the character for this long (the reference game's block recovery), before faster recovery shortens it. */
export const BLOCK_STAGGER = STUN_BASE_DURATION;

// Impale (as in the reference game): a hit that impales records 10% of its physical damage; the next 5 hits each deal it again as reflected
// physical damage. A target holds at most 5 impales.
export const IMPALE_SHARE = 0.1;
export const IMPALE_HITS = 5;
export const IMPALE_MAX = 5;
/** A culling strike kills a target left at this share of its life or less. */
export const CULLING_SHARE = 0.1;

// §6.7 Speeds and costs.
export const DUAL_WIELD_MORE_APS = 10;
/** Dual wielding (as in the reference game): 20% more physical attack damage and 15% additional chance to block attacks. */
export const DUAL_WIELD_MORE_PHYS = 20;
export const DUAL_WIELD_BLOCK = 15;
/** Monsters crit for 130% (as in the reference game), not the 150% of players. */
export const MONSTER_CRIT_MULTI = 130;
export const FISTS = { min: 2, max: 6, aps: 1.2, crit: 0 };
export const HIT_AT = 0.6;
/** Echoing Cast: each echo lands this share of the use time after the one before. */
export const ECHO_GAP = 0.25;

// §8.2 Simulation.
export const PROJECTILE_SPEED = 12;
export const RECENT = 4;

// §6.9 Flasks.
/** Charges a kill grants each flask, by the monster's rarity (as in the reference game; fractions are kept). */
export const FLASK_CHARGES_ON_KILL = { normal: 1, magic: 3.5, rare: 6, unique: 11 } as const;

// Duels (docs/DUEL.md 4.4).
/**
 * What the damage a character takes in a duel is multiplied by, both sides (a hit, a burst, every tick of damage over time).
 * Measured with the bot's builds (docs/DUEL.md 4.4): at ×0.3 the median fight is 16 s among builds of the legacy difficulty at maps 20
 * and 40 and 25 s among builds of the default difficulty at maps 5 to 20, with 3% and 6% of the fights ending on the time cap
 * (at ×1 the median is 6 s).
 */
export const DUEL_DAMAGE_SCALE = 0.3;
/** The Bargain Coins each side carries into a duel (docs/DUEL-BALANCE.md 2): a fight is one of four lives a side. */
export const DUEL_REPRIEVES = 3;
/**
 * What a character's life and energy shield are multiplied by in a duel against an opponent of level 100 (docs/DUEL-BALANCE.md 4):
 * the factor runs on a straight line from 1 at level 1 to this at level 100, and each side's is read from the other side's level.
 */
export const DUEL_LIFE_MULT_TOP = 10;
/**
 * How much of the duel's modifiers (the damage scale and the life multiplier) a character has on each of its lives: the first
 * life, then after each Bargain Coin (the owner, 2026-10-24). Weakest on the first and strongest on the last, so a fight swings
 * back and forth; a share is of the bonus over 1 (`duelStage`). Past the end of the list the last share holds.
 */
export const DUEL_LIFE_STAGES: readonly number[] = [0.5, 5 / 6, 7 / 6, 1.5];

// §13 AI.
export const ENGAGE_RANGE = 9;
export const LOOT_RANGE = 6;
/** Monsters notice the player within this range (line of sight); above ENGAGE_RANGE so nothing is shot at unaware. */
export const MONSTER_AGGRO = 10;
/** Idle monsters this close to a player who starts an attack come running (they hear it). */
export const SHOT_ALERT = 10;
/** The player gives up on a target it has not damaged for this long (seconds), for SKIP_TIME. */
export const STALL_TIME = 20;
export const SKIP_TIME = 30;
/**
 * A target the player's hits have not reached for this long while they land on other enemies (minions summoned in front of
 * it, a pack between) is set aside for SCREENED_SKIP seconds, so the player deals with what is in the way.
 */
export const SCREENED_TIME = 4;
export const SCREENED_SKIP = 4;
/** Hits on other enemies, in that time, that make a target screened. */
export const SCREENED_HITS = 3;
/** Arrows that hit walls within BLOCK_WINDOW seconds before the player moves in for a clearer shot. */
export const BLOCK_LIMIT = 5;
export const BLOCK_WINDOW = 3;
/** How long the player closes in, and how close it tries to get (tiles), when repositioning. */
export const REPOSITION_TIME = 3;
export const REPOSITION_DIST = 3.5;
export const PACK_ALERT = 6;
export const LEASH_TIME = 6;
/** An Ambush wakes when the character is this close (tiles), sight line or not (docs/ENEMIES.md 4.2). */
export const AMBUSH_RANGE = 4.5;
/** A Patrol walks at this share of its speed. */
export const PATROL_SPEED = 0.45;
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
/**
 * A monster's evasion rating by level is `(BASE + LINEAR · m) · GROWTH^m`, and its accuracy the same with its own numbers.
 * Fitted to the reference game's monster tables (reference/coverage/ref-monster-stats.json, `npm run evasion`) so that the
 * same accuracy against the same evasion hits as often: evasion equals the table at every level, accuracy is within 2 points
 * of it (4% at worst, where the numbers are small).
 * The tables are an exponential in the level, not a straight line (docs/EVASION.md).
 */
export const MONSTER_EVASION_BASE = 50;
export const MONSTER_EVASION_LINEAR = 16;
export const MONSTER_EVASION_GROWTH = 1.0212;
export const MONSTER_ACCURACY_BASE = 12.9;
export const MONSTER_ACCURACY_LINEAR = 0.385;
export const MONSTER_ACCURACY_GROWTH = 1.0299;
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

/**
 * The opening: a character starts with almost no gear, so the first maps ask less of it. Monster life and damage are
 * multiplied by these on top of the easing above, from this share on map 1 up to 1 (the curve as it was) on map OPENING_LEVEL.
 * Monsters only: nothing on the character's side moves, so what the first drops add stays worth having.
 */
export const OPENING_LEVEL = 20;
export const OPENING_LIFE = 0.5;
export const OPENING_DAMAGE = 0.5;
const opening = (from: number, m: number) =>
  from + (1 - from) * Math.min(1, Math.max(0, (m - 1) / (OPENING_LEVEL - 1)));
export function openingLife(m: number): number {
  return opening(OPENING_LIFE, m);
}
export function openingDamage(m: number): number {
  return opening(OPENING_DAMAGE, m);
}

// §10 Labyrinth.
export const CELL = 14;
export const MAP_MAX = 160;

// Map choice (docs/MAPS.md section 8): camp restores what a character would recover sitting still this long.
export const CAMP_REST_SECONDS = 10;

/** Seconds between pressing Abandon and leaving the map; the character keeps fighting meanwhile (docs/MAPS.md section 7). */
export const ABANDON_SECONDS = 5;
/** Abandon is unavailable before this map (the first skill gems are picked after maps 1 to 4) and on every tenth map (mini-boss and boss). */
export const ABANDON_FROM_MAP = 5;
/** A map that has run this long (simulated seconds) turns into an abandon on its own, on every map: the way out for a character that is stuck. */
export const AUTO_ABANDON_AFTER = 500;

/** How far from the target a scattered trap (Snare Cluster) may land, in tiles; and the share of them that a lone enemy walks into, for the sheet. */
export const SCATTER_RADIUS = 3.2;
export const SCATTER_HIT_SHARE = 0.6;

/**
 * Whether the crafting tab (the Workbench) is open to the player. It is shut for now: it is not needed to do well, and it is
 * less polished than the rest of the game. The crafting code and the bots that test it stay as they are.
 */
export const CRAFTING_OPEN = false;

/**
 * Whether crafting currency (essences, orbs, tablets, Wayfinder's Chalk, ...) drops in play, in reward picks and in shops. Off for now
 * (the user, 2026-10-14): Bone Dust is the only currency in the game while the Workbench is closed. The currency code, its tests and
 * the Workbench stay as they are, for when crafting returns.
 */
export const CURRENCY_DROPS = false;
