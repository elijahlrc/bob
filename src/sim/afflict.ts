import type { AilmentName } from '../calc/combat';
import type { FlaskSpec } from '../calc/flasks';
import { BOSS_LOCK_SECONDS } from '../data/bosses';
import { STUN_ES_IGNORE } from '../data/constants';
import type { Actor, Dot, World } from './types';

/**
 * Ailments and stuns put on the character outside a hit's own rolls (docs/BOSSES.md 11.2): a boss's blow that carries an
 * ailment, a toll's ring, a Sentence. Each honours the character's immunities, its chances to avoid, how long ailments last
 * on it, a cleansing flask that is running, and the boss lock (rule 6).
 */

/** What a cleansing flask keeps off (3.9: removes on use, and immunity during the flask effect). */
export type Cleansed = 'bleed' | 'poison' | 'ignite' | 'freeze' | 'shock' | 'curse';

export function flaskCleanses(s: FlaskSpec, kind: Cleansed): boolean {
  switch (kind) {
    case 'bleed':
      return s.removeBleed;
    case 'poison':
      return s.removePoison;
    case 'ignite':
      return s.removeIgnite;
    case 'freeze':
      return s.removeFreeze;
    case 'shock':
      return s.removeShock;
    case 'curse':
      return s.removeCurse;
  }
}

/** Whether a running flask makes the character immune to this. */
export function flaskWards(w: World, kind: Cleansed): boolean {
  for (const f of w.flasks) if (f.activeT > 0 && flaskCleanses(f.spec, kind)) return true;
  return false;
}

/** A boss's freeze or stun on the character: not again for a while after one (docs/BOSSES.md rule 6). */
const locks = new WeakMap<World, number>();
export function bossLocked(w: World): boolean {
  return (locks.get(w) ?? -Infinity) > w.t;
}
export function lockBoss(w: World): void {
  locks.set(w, w.t + BOSS_LOCK_SECONDS);
}
/** A boss, or a creature a boss brings. */
export const isBossSide = (a: Actor | undefined): boolean => !!a?.mon?.kind.bossOnly;

function pushDot(list: Dot[], d: Dot, cap: number): void {
  list.push(d);
  if (list.length > cap) {
    let wi = 0;
    for (let i = 1; i < list.length; i++) if (list[i].dps < list[wi].dps) wi = i;
    list.splice(wi, 1);
  }
}

/**
 * Put an ailment on the character: `value` is damage a second for bleed, poison and ignite, the effect (a fraction) for
 * shock and chill, and unused for freeze; `seconds` is its length before the character's own duration. Returns whether it
 * took.
 */
export function afflictPlayer(
  w: World,
  kind: AilmentName,
  value: number,
  seconds: number,
  fromBoss = false,
): boolean {
  const p = w.player;
  const d = p.def;
  if (!p.alive || d.immuneAilments) return false;
  if (kind === 'freeze' && (d.cannotBeFrozen || d.immune[2])) return false;
  if (kind === 'chill' && (d.cannotBeChilled || d.immune[2])) return false;
  if (kind === 'shock' && (d.immune[1] || d.unaffectedByShock)) return false;
  if (kind === 'ignite' && d.immune[3]) return false;
  if (kind === 'poison' && d.immuneChaos) return false;
  if (flaskWards(w, kind === 'chill' ? 'freeze' : kind)) return false;
  if (kind === 'freeze' && fromBoss && bossLocked(w)) return false;
  if (kind === 'freeze' && (p.ail.freezeT > 0 || p.ail.freezeGraceT > 0)) return false;
  if (d.avoid[kind] > 0 && w.rngCombat.chance(d.avoid[kind])) return false;
  const t = seconds * d.durOnSelf[kind];
  const ail = p.ail;
  switch (kind) {
    case 'bleed':
      pushDot(ail.bleeds, { dps: value, t }, 30);
      break;
    case 'poison':
      pushDot(ail.poisons, { dps: value, t }, 400);
      break;
    case 'ignite':
      pushDot(ail.ignites, { dps: value, t }, 30);
      break;
    case 'shock':
      if (value < ail.shock) return false;
      ail.shock = value;
      ail.shockT = t;
      break;
    case 'chill':
      if (value < ail.chill) return false;
      ail.chill = value;
      ail.chillT = t;
      return true;
    case 'freeze':
      ail.freezeT = Math.max(ail.freezeT, t);
      if (fromBoss) lockBoss(w);
      break;
  }
  w.events.push({ t: 'ailment', dst: p.id, kind });
  return true;
}

/** Stun the character (a Sentence): its own avoidance, the energy shield's half, and the boss lock. Returns whether it did. */
export function stunPlayer(w: World, seconds: number, fromBoss = true): boolean {
  const p = w.player;
  const d = p.def;
  if (!p.alive || d.cannotBeStunned) return false;
  if (w.channel?.profile.skill.channel?.stunImmune) return false;
  if (fromBoss && bossLocked(w)) return false;
  if (d.stunAvoid > 0 && w.rngCombat.chance(d.stunAvoid)) return false;
  if (p.es > 0 && !d.esProtectsMana && w.rngCombat.chance(STUN_ES_IGNORE)) return false;
  const t = seconds * d.stunDurOnSelf;
  p.stunT = Math.max(p.stunT, t);
  p.action = null;
  w.events.push({ t: 'stun', dst: p.id, dur: t });
  if (fromBoss) lockBoss(w);
  return true;
}
