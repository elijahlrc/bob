import type { CaughtState, WarpState, WitherState } from './blinks';
import type { OfferingState } from './minionFx';
import type { BannerState } from './banners';
import type { Field } from './fields';
import type { Minion } from './minions';
import type { Deployable } from './deploy';
import type { Character } from '../calc/character';
import type { BuffId } from '../data/buffs';
import type { AnyItem } from '../data/types';
import type { Ledger } from './ledger';
import type { ReprieveState } from './reprieve';
import type {
  DamageRecord,
  FlaskState,
  PlayerAI,
  SkillZone,
  TriggerRuntime,
  Vitals,
} from './types';

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
  // G2: charges, buffs and rage, the triggers, cooldowns and openers
  /** Seconds left on the charges of each kind (EXPANSION 5.6), and the characters built for each count held. */
  chargeT: Record<'grit' | 'fervour' | 'insight', number>;
  /** Seconds left of each buff (src/data/buffs.ts), the rage held, seconds since rage was fed, and the drain timer. */
  buffT: Record<BuffId, number>;
  rage: number;
  rageT: number;
  rageDrain: number;
  /** When rage was last gained from a melee hit. */
  rageGainT: number;
  /** The Trophy Cord: monster mods held, by mod id, and the seconds left of each. */
  trophy: Record<string, number>;
  trig: TriggerRuntime;
  /** When each secondary skill (by choice key) can next be cast (EXPANSION 5.5a). */
  secondaryReady: Record<string, number>;
  /** A guard that cut the physical damage taken for as long as its buff runs (spent charges made it stronger). */
  guard: { buff: BuffId; physMult: number } | null;
  /** Skills with a cooldown of their own (by choice key): the uses held and the seconds until the next one is regained. */
  cooldowns: Record<string, { uses: number; t: number }>;
  /** When each utility skill (by choice key) can next be cast. */
  utilityReady: Record<string, number>;
  /** The openers used (by choice key): in which fight, and on which rare or boss targets. */
  openers: Record<string, { fight: number; ids: number[] }>;
  /** Time since the burning aura last struck. */
  auraBurnT: number;
  /** Seconds a Berserk has lasted (its drain of rage rises with it). */
  berserkT: number;
  chars: Map<string, Character>;
  // G3: summons and ground (deployables, minions, fields, zones, banner, offering, warp, wither, caught)
  /** The totems, brands, traps and mines on the ground. */
  deployables: Deployable[];
  deploySeq: number;
  /** The minions standing. */
  minions: Minion[];
  /** Ground and standing things the player's skills made: consecrated and chilling ground, crystals, storms, walls. */
  fields: Field[];
  /** Zones the player's skills left on the ground. */
  zones: SkillZone[];
  /** The banner the character carries or has put down (src/sim/banners.ts). */
  banner: BannerState | null;
  /** The offering that stands, if one does (src/sim/minionFx.ts). */
  offering: OfferingState | null;
  /** A teleport on its way, Withering Step's aura, and the projectiles a Venom Gyre has caught (src/sim/blinks.ts). */
  warp: WarpState | null;
  wither: WitherState | null;
  caught: CaughtState | null;
};
