import {
  BUFFS,
  BUFF_IDS,
  RAGE_DECAY_EVERY,
  RAGE_HOLD,
  buffStat,
  RECOVER_POOLS,
  rageStat,
  recoverPctStat,
  recoverStat,
  type BuffEvent,
  type BuffId,
} from '../data/buffs';
import { reservedMana } from './reserve';
import type { Mod } from '../mods/types';
import { sumOf } from './charges';
import { lifeCap } from './combat';
import { noteRecover } from './recovery';
import { startShell } from './skillFx';
import type { World } from './types';
import type { Side } from './side';

/**
 * The buff layer in the sim (src/data/buffs.ts). A buff is a timer: while it runs, its condition is true and the calc
 * engine's mods behind that condition apply. Rage is a count that drains when nothing feeds it.
 */

const RAGE_GAIN_COOLDOWN = 0.4;

/** Gain a buff, or refresh it to its full time. */
export function gainBuff(w: World, s: Side, id: BuffId): void {
  if (!s.char.buffSource[id]) return;
  // Elusive cannot be renewed until it has run out.
  if (id === 'elusive' && s.buffT.elusive > 0) return;
  const seconds = BUFFS[id].seconds * s.char.db.mult('buffDuration');
  s.buffT[id] = Math.max(s.buffT[id], seconds);
  w.events.push({ t: 'buff', id });
}

/** Gain points of rage, up to the character's maximum. */
export function gainRage(s: Side, points: number): void {
  if (!s.char.rageSource || points <= 0) return;
  s.rage = Math.min(s.char.rageMax, s.rage + points);
  s.rageT = 0;
}

/** Roll the buffs and rage that an event can give (a kill, a hit landed or taken, a critical strike, a flask). */
export function rollGains(w: World, s: Side, event: BuffEvent, extra: readonly Mod[] = []): void {
  const ch = s.char;
  if (!ch.anyGain) return;
  for (const id of BUFF_IDS) {
    if (!ch.buffSource[id]) continue;
    const chance = ch.db.sum('base', buffStat(event, id)) + sumOf(extra, buffStat(event, id));
    if (chance > 0 && w.rngTrig.chance(Math.min(1, chance / 100))) {
      gainBuff(w, s, id);
      // A guard's buff gained this way (Stoneward Gauntlets' Steel Hide) brings its shell, if the guard is socketed.
      const guard = ch.utilities.find(
        (c) => c.skill.utility?.kind === 'buff' && c.skill.utility.buff === id,
      );
      const u = guard?.skill.utility;
      if (guard && u?.kind === 'buff' && u.shell)
        startShell(s, id, u.shell, guard.skill.level, ch.profile(guard));
    }
  }
  if (ch.rageSource) {
    // Rage from melee hits comes once in 0.4 s, however many enemies the swing hit.
    if (event !== 'meleeHit' || w.t - s.rageGainT >= RAGE_GAIN_COOLDOWN) {
      const pts = ch.db.sum('base', rageStat(event)) + sumOf(extra, rageStat(event));
      if (pts > 0 && event === 'meleeHit') s.rageGainT = w.t;
      gainRage(s, pts);
    }
  }
  for (const pool of RECOVER_POOLS) {
    const flat =
      ch.db.sum('base', recoverStat(event, pool)) + sumOf(extra, recoverStat(event, pool));
    const pct =
      ch.db.sum('base', recoverPctStat(event, pool)) + sumOf(extra, recoverPctStat(event, pool));
    if (flat === 0 && pct === 0) continue;
    const p = s.player;
    const max = pool === 'life' ? p.def.maxLife : pool === 'mana' ? p.def.maxMana : p.def.maxEs;
    const amount = flat + (pct / 100) * max;
    const before = p[pool];
    if (pool === 'life') p.life = Math.min(lifeCap(p), p.life + amount);
    else if (pool === 'mana')
      p.mana = Math.min(Math.max(0, p.def.maxMana - reservedMana(s)), p.mana + amount);
    else p.es = Math.min(p.def.maxEs, p.es + amount);
    noteRecover(p, pool, p[pool] - before);
  }
  // Being hit holds the rage you have, as gaining it does.
  if (event === 'hitTaken') s.rageT = 0;
}

/** Run down the timers, and drain rage once it has not been fed for a while. */
export function tickBuffs(s: Side, dt: number): void {
  for (const id of BUFF_IDS) if (s.buffT[id] > 0) s.buffT[id] = Math.max(0, s.buffT[id] - dt);
  if (s.rage > 0) {
    s.rageT += dt;
    if (s.rageT >= RAGE_HOLD) {
      s.rageDrain += dt;
      while (s.rageDrain >= RAGE_DECAY_EVERY && s.rage > 0) {
        s.rageDrain -= RAGE_DECAY_EVERY;
        s.rage--;
      }
    }
  } else s.rageDrain = 0;
}
