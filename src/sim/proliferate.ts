import { pushDot } from './combat';
import type { Actor, World } from './types';

/**
 * Proliferation (docs/SPIRIT.md S7): an ailment that was inflicted by a skill with Wildfire Seed or Elemental Proliferation
 * carries a radius, and while its carrier has it, the enemies within that radius get the same ailment with the same time left.
 * What they get does not itself spread. A carrier that dies passes its ailments on once more, as its corpse would.
 */

const EVERY = 0.5;

/** Give the enemies near `from` the ailments `from` spreads. */
export function spreadAilments(w: World, from: Actor): void {
  const ail = from.ail;
  let ignite = null as { dps: number; t: number; spread?: number } | null;
  for (const d of ail.ignites) if (d.spread && (!ignite || d.dps > ignite.dps)) ignite = d;
  const ele = ail.spreadEle > 0;
  if (!ignite && !ele) return;
  const radius = Math.max(ignite?.spread ?? 0, ail.spreadEle);
  for (const e of w.actors) {
    if (e === from || e.isPlayer || !e.alive || e.faction !== from.faction) continue;
    if (e.def.immuneAilments || Math.hypot(e.x - from.x, e.y - from.y) > radius + e.r) continue;
    if (ignite && !e.ail.ignites.some((d) => d.dps >= ignite!.dps * 0.99)) {
      pushDot(e.ail.ignites, { dps: ignite.dps, t: ignite.t });
      w.events.push({ t: 'ailment', dst: e.id, kind: 'ignite' });
    }
    if (!ele) continue;
    if (ail.shockT > 0 && ail.shock > e.ail.shock) {
      e.ail.shock = ail.shock;
      e.ail.shockT = Math.max(e.ail.shockT, ail.shockT);
      w.events.push({ t: 'ailment', dst: e.id, kind: 'shock' });
    }
    if (ail.chillT > 0 && ail.chill > e.ail.chill && !e.def.cannotBeChilled) {
      e.ail.chill = ail.chill;
      e.ail.chillT = Math.max(e.ail.chillT, ail.chillT);
    }
    if (ail.freezeT > 0 && e.ail.freezeT < ail.freezeT * 0.99) {
      e.ail.freezeT = ail.freezeT;
      w.events.push({ t: 'ailment', dst: e.id, kind: 'freeze' });
    }
  }
}

/** Twice a second, every afflicted enemy that spreads its ailments passes them on. */
export function tickProliferation(w: World, dt: number): void {
  if (Math.floor(w.t / EVERY) === Math.floor((w.t - dt) / EVERY)) return;
  for (const a of w.actors) {
    if (a.isPlayer || !a.alive) continue;
    if (a.ail.spreadEle > 0 || a.ail.ignites.some((d) => d.spread)) spreadAilments(w, a);
  }
}
