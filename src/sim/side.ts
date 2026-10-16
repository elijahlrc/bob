import type { AnyItem } from '../data/types';
import type { Ledger } from './ledger';
import type { ReprieveState } from './reprieve';
import type { DamageRecord, FlaskState, PlayerAI, Vitals } from './types';

/** What a side counts as it plays: the kills and the time lost, and the damage it took and dealt. */
export type SideStats = {
  kills: number;
  xpGained: number;
  stuck: number;
  stalls: number;
  /** Kiting steps taken (the `kite` spacing). */
  kites: number;
  /** Player projectiles stopped by walls. */
  wallBlocked: number;
  picked: number;
  damageTaken: number;
  damageDealt: number;
};

/** What a character brings to a map (what the map decides is `WorldOpts`). */
export type SideOpts = {
  /** Life, mana, energy shield and flask charges the player starts with (default: all full). */
  start?: Vitals;
  /** Refill the player's life and mana every tick (training-dummy tests). */
  freeResources?: boolean;
  /** Balance probes: the player cannot die (life is restored at 1). */
  godMode?: boolean;
  /** The reprieves the character carries, in the order they are used (data/reprieves.ts): one fires when damage would kill (docs/WAYSIDE.md 7). */
  reprieves?: string[];
};

/**
 * A side of a map (docs/DUEL.md section 3): one character and everything of theirs. `World` is the arena; `World.sides` holds
 * the sides, and side 0 is the local player's. Monsters belong to no side (`Actor.side` is null).
 *
 * The type grows one group of fields at a time, as they move out of `World` (DUEL.md 3.3).
 */
export type Side = {
  id: number;
  /** Actors of different teams are enemies. The monsters are team 1, side 0 is team 0, a second side is team 2. */
  team: number;
  /** G1: the flasks, the AI's state, what is counted, what is dealt and taken (the report), what is earned and picked up. */
  flasks: FlaskState[];
  ai: PlayerAI;
  stats: SideStats;
  /** Everything dealt and taken on the map, by source and type (the map report). */
  ledger: Ledger;
  /** Damage the character took in the last few seconds. */
  dmgLog: DamageRecord[];
  /** The reprieves carried, the ones that fired, and the seconds of safety left after a Revive. */
  reprieve: ReprieveState;
  xp: number;
  picked: AnyItem[];
  opts: SideOpts;
};
