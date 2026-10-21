import type { Character } from '../calc/character';
import { gemDef } from '../data/gems';
import { aSkill } from '../data/skillTypes';

/**
 * Whether a socketed gem is doing anything, in a line: which skills a support is on, what supports a skill, whether an aura
 * is active, and why not when it is not (a support needs a matching skill in the same item).
 */
export function gemStatus(
  ch: Character,
  uid: number,
  def: ReturnType<typeof gemDef>,
): { ok: boolean; text: string; hint?: string } | null {
  if (def.kind === 'support') {
    const on = ch.actives.filter((a) => a.supports.some((x) => x.gem.uid === uid));
    if (on.length)
      return { ok: true, text: `Supporting: ${on.map((a) => a.skill.name).join(', ')}` };
    // Linked to a skill it fits by type but cannot act on: say what it cannot do.
    const idle = supportIdle(ch, uid, def);
    if (idle)
      return {
        ok: false,
        text: `${idle.inert ? 'No effect' : 'Not supporting anything'}: ${idle.why}`,
      };
    return null;
  }
  if (def.kind === 'active') {
    if (ch.isHexTouched(uid)) return { ok: true, text: 'Hexes the enemies you hit' };
    const a = ch.actives.find((x) => x.gemUid === uid);
    if (!a || !a.usable) return null;
    const names = a.supports.map((x) => x.def.name);
    const linked = names.length ? `Supported by: ${names.join(', ')}` : 'No supports linked';
    // A skill the mana cannot pay for is mostly replaced by the weapon attack: say so.
    // The same figure as the Skills tab's summary line: the regeneration left after the other skills' casts.
    if (ch.primary.gemUid === uid) {
      const sustain = ch.mainSheet().sustain;
      if (sustain < 0.9)
        return {
          ok: false,
          text: `${linked} · Mana-starved (${Math.round(sustain * 100)}%)`,
          hint: `What your mana regeneration has left after your other skills pays for about ${Math.round(sustain * 100)}% of this skill's casts. The rest are weapon attacks. Add mana regeneration, reduce the cost, or use fewer skills or supports.`,
        };
    }
    return { ok: true, text: linked };
  }
  if (def.kind === 'aura') {
    const au = ch.auras.find((x) => x.def.id === def.id);
    if (au && !au.active) return { ok: false, text: 'Inactive: not enough mana to reserve it' };
    return au ? { ok: true, text: `Active, reserving ${Math.round(au.reserved)} mana` } : null;
  }
  return null;
}

/**
 * Why a support supports nothing (null when it supports something): linked to a skill it fits by type but cannot act on
 * (`inert`), or no skill of its kind in the same item. `why` reads after the gem's name: "needs a melee skill in the same item".
 */
function supportIdle(
  ch: Character,
  uid: number,
  def: ReturnType<typeof gemDef>,
): { why: string; inert: boolean } | null {
  if (def.kind !== 'support') return null;
  if (ch.actives.some((a) => a.supports.some((x) => x.gem.uid === uid))) return null;
  const idle = ch.actives.flatMap((a) => (a.inert ?? []).filter((x) => x.gem.gem.uid === uid));
  if (idle.length) return { why: idle[0].why, inert: true };
  return { why: `needs ${aSkill(def.supports)} in the same item`, inert: false };
}

/**
 * Why a worn gem does nothing, structurally: a support with no skill to work on, or a skill the weapons or shield in hand
 * cannot use. Null when it is doing its job. (A skill that is merely short of mana is not idle: `gemStatus` says that.)
 */
export function gemIdle(ch: Character, uid: number, def: ReturnType<typeof gemDef>): string | null {
  if (def.kind === 'support') return supportIdle(ch, uid, def)?.why ?? null;
  if (def.kind === 'active') {
    const a = ch.actives.find((x) => x.gemUid === uid);
    if (a && !a.usable) return a.reason ?? 'cannot be used';
  }
  return null;
}
