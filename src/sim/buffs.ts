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
import type { Mod } from '../mods/types';
import { sumOf } from './charges';
import { lifeCap } from './combat';
import type { World } from './types';

/**
 * The buff layer in the sim (src/data/buffs.ts). A buff is a timer: while it runs, its condition is true and the calc
 * engine's mods behind that condition apply. Rage is a count that drains when nothing feeds it.
 */

/** Gain a buff, or refresh it to its full time. */
export function gainBuff(w: World, id: BuffId): void {
  if (!w.char.buffSource[id]) return;
  const seconds = BUFFS[id].seconds * w.char.db.mult('buffDuration');
  w.buffT[id] = Math.max(w.buffT[id], seconds);
  w.events.push({ t: 'buff', id });
}

/** Gain points of rage, up to the character's maximum. */
export function gainRage(w: World, points: number): void {
  if (!w.char.rageSource || points <= 0) return;
  w.rage = Math.min(w.char.rageMax, w.rage + points);
  w.rageT = 0;
}

/** Roll the buffs and rage that an event can give (a kill, a hit landed or taken, a critical strike, a flask). */
export function rollGains(w: World, event: BuffEvent, extra: readonly Mod[] = []): void {
  const ch = w.char;
  if (!ch.anyGain) return;
  for (const id of BUFF_IDS) {
    if (!ch.buffSource[id]) continue;
    const chance = ch.db.sum('base', buffStat(event, id)) + sumOf(extra, buffStat(event, id));
    if (chance > 0 && w.rngTrig.chance(Math.min(1, chance / 100))) gainBuff(w, id);
  }
  if (ch.rageSource)
    gainRage(w, ch.db.sum('base', rageStat(event)) + sumOf(extra, rageStat(event)));
  for (const pool of RECOVER_POOLS) {
    const flat =
      ch.db.sum('base', recoverStat(event, pool)) + sumOf(extra, recoverStat(event, pool));
    const pct =
      ch.db.sum('base', recoverPctStat(event, pool)) + sumOf(extra, recoverPctStat(event, pool));
    if (flat === 0 && pct === 0) continue;
    const p = w.player;
    const max = pool === 'life' ? p.def.maxLife : pool === 'mana' ? p.def.maxMana : p.def.maxEs;
    const amount = flat + (pct / 100) * max;
    if (pool === 'life') p.life = Math.min(lifeCap(w, p), p.life + amount);
    else if (pool === 'mana')
      p.mana = Math.min(Math.max(0, p.def.maxMana - ch.reservedMana), p.mana + amount);
    else p.es = Math.min(p.def.maxEs, p.es + amount);
  }
  // Being hit holds the rage you have, as gaining it does.
  if (event === 'hitTaken') w.rageT = 0;
}

/** Run down the timers, and drain rage once it has not been fed for a while. */
export function tickBuffs(w: World, dt: number): void {
  for (const id of BUFF_IDS) if (w.buffT[id] > 0) w.buffT[id] = Math.max(0, w.buffT[id] - dt);
  if (w.rage > 0) {
    w.rageT += dt;
    if (w.rageT >= RAGE_HOLD) {
      w.rageDrain += dt;
      while (w.rageDrain >= RAGE_DECAY_EVERY && w.rage > 0) {
        w.rageDrain -= RAGE_DECAY_EVERY;
        w.rage--;
      }
    }
  } else w.rageDrain = 0;
}
