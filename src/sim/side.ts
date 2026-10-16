import type { PendingShot } from './shots';
import type { ChannelState, StackState } from './channel';
import type { SkillProfile } from '../calc/skill';
import type { Mirage } from './supportFx';
import type { CaughtState, WarpState, WitherState } from './blinks';
import type { OfferingState } from './minionFx';
import type { BannerState } from './banners';
import type { Field } from './fields';
import type { Minion } from './minions';
import type { Deployable } from './deploy';
import type { Character, SkillChoice } from '../calc/character';
import type { BuffId } from '../data/buffs';
import type { AnyItem, Build } from '../data/types';
import type { Ledger } from './ledger';
import type { ReprieveState } from './reprieve';
import type {
  Actor,
  DamageRecord,
  FlaskState,
  PlayerAI,
  SkillZone,
  TriggerRuntime,
  Vitals,
  World,
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
  // G4: the skills' running state
  /** Counters the supports keep (src/sim/supportFx.ts): uses of a skill, Intensity, Seals, a mirage archer, Inspiration's mana. */
  uses: Record<string, number>;
  intensity: Record<string, number>;
  intensityT: Record<string, number>;
  seals: Record<string, { n: number; t: number }>;
  mirage: Mirage | null;
  inspireMana: number;
  /** The channelling skill whose Infusion is held, if one is. */
  infusing: string | null;
  shockCd: Record<string, number>;
  inShock: boolean;
  /** The critical roll the strikes of one use share: set while the extra strikes of a use are made. */
  critLock: boolean | null;
  critSeen: boolean;
  /** The element of the next use of a skill that picks one (1 lightning, 2 cold, 3 fire), and the last one used. */
  elem: number;
  elemLast: number;
  /** The buff of Static Strike: its stacks (seconds left) and the time toward the next beams. */
  staticFx: { key: string; stacks: number[]; acc: number } | null;
  /** Molten Shell: the pool left, the damage it has taken, and what comes of it. */
  shell: {
    left: number;
    taken: number;
    absorb: number;
    reflect: number;
    radius: number;
    buff: BuffId;
    profile: SkillProfile;
  } | null;
  /** Herald of Agony: the Virulence held (it runs out), and the time to the next patch of Rimeplate's trail. */
  virulence: number;
  /** The mana the supported skills have spent toward Arcane Surge. */
  surgeMana: number;
  /** The relic's regeneration: seconds left, and the life a second for the character and for the minions; and its nova's cooldown. */
  relicRegen: { t: number; me: number; minions: number };
  relicT: number;
  trailT: number;
  /** The blades of Blade Vortex: seconds left of each, and the time toward the next round. */
  vortex: { key: string; blades: number[]; acc: number } | null;
  /** The markers of Storm Call. */
  markers: { x: number; y: number; t: number; profile: SkillProfile; hand: number }[];
  /** The orb of Orb of Storms. */
  stormOrb: {
    x: number;
    y: number;
    t: number;
    acc: number;
    profile: SkillProfile;
    hand: number;
  } | null;
  /** The arrows stuck in an enemy (or the ground) awaiting their fuse. */
  fuses: {
    target: number;
    x: number;
    y: number;
    t: number;
    arrows: { profile: SkillProfile; hand: number }[];
  }[];
  /** The pods of Scourge Arrow waiting to bloom. */
  spores: {
    x: number;
    y: number;
    t: number;
    profile: SkillProfile;
    hand: number;
    arrows: number;
    range: number;
  }[];
  /** The enemies carrying a charged debuff (Infernal Blow), by id. */
  charged: Record<number, { n: number; t: number; key: string }>;
  /** Set while a skill's own secondary hits are made, so they do not feed the skill again. */
  inFx: boolean;
  /** How far the last travelling skill carried the character, in tiles. */
  lastTravel: number;
  /** The channelled skill being held: its stages so far. */
  channel: ChannelState | null;
  /** The stages of a skill that grows with use, and how many hits the player has landed (a use that hits builds a stage). */
  stacks: StackState | null;
  hitsLanded: number;
  /** The projectiles of a barrage still to be fired, one after another. */
  shots: PendingShot[];
  /** How the last hit of the player's resolved (a strike that sends more out waits to see it land). */
  lastOutcome: 'hit' | 'miss' | 'block' | null;
  // G5: the character
  player: Actor;
  char: Character;
  build: Build;
  primary: SkillChoice;
};

/** The team of the monsters (docs/DUEL.md 3.1): side 0 is team 0, a second side is team 2. */
export const MONSTERS = 1;

/**
 * The character a monster hunts: that of the nearest living side (on a map, the only one; docs/DUEL.md 3.2). With none alive the
 * first side's character stands in, as the one character of a map did when it was dead.
 */
export function hunted(w: World, m: Pick<Actor, 'x' | 'y'>): Actor {
  const sides = w.sides;
  // One side (a map): the character, with no search (monsters ask every tick).
  if (sides.length === 1) return sides[0].player;
  let best: Actor | null = null;
  let bd = Infinity;
  for (let i = 0; i < sides.length; i++) {
    const p = sides[i].player;
    if (!p.alive) continue;
    const d = (p.x - m.x) * (p.x - m.x) + (p.y - m.y) * (p.y - m.y);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best ?? sides[0].player;
}
