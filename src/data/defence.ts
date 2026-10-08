import { mod, type Mod } from '../mods/types';
import type { FactionId } from './monsters';

/**
 * Defence profiles (docs/ROSTER.md 6.2). Until now a monster's armour, evasion and resistances were one function of its
 * level: a build met the same defences on every type, and its time to kill differed only by life. A type, and a faction, now
 * say what they are hard and soft to. A profile is written as the numbers a build can reason about; `defenceMods` turns it
 * into the mods the monster's build already reads, so the player's defence model resolves it with no new combat code.
 */
export type Immunity = 'stun' | 'freeze' | 'ignite' | 'shock' | 'chill' | 'bleed' | 'poison';
export type Element = 'fire' | 'cold' | 'lightning' | 'chaos';

export type DefenceProfile = {
  /** More (or less) armour and evasion than the level gives, in percent. */
  armour?: number;
  evasion?: number;
  /** An energy shield worth this share of its life (chaos goes past it). */
  es?: number;
  /** Resistance by element in percent: negative is a weakness. */
  res?: Partial<Record<Element, number>>;
  /** Percent less physical damage taken. */
  physReduction?: number;
  /** Ailments and effects it cannot suffer. */
  immune?: Immunity[];
  /** Life regenerated each second, in percent of its life. */
  regen?: number;
  /** A carapace: no single hit removes more than this share of its life. */
  hitCap?: number;
  /** More (or less) stun threshold, in percent. */
  stun?: number;
};

/**
 * What every monster of a faction is hard and soft to (docs/ROSTER.md 6.2, the signature table). Each element is soft for at
 * least two factions and hard for at least two, so no build is always right.
 */
export const FACTION_DEFENCE: Partial<Record<FactionId, DefenceProfile>> = {
  // The dead of the Rot shrug off poison and chaos, and burn.
  rot: { armour: -45, res: { chaos: 60, fire: -30 }, immune: ['poison'] },
  // Ethereal: half the physical damage (as before), the cold of the grave, and no defence against fire and lightning.
  hollow: { physReduction: 50, res: { cold: 50, fire: -30, lightning: -30, chaos: 30 } },
  // Living zealots, flesh in cloth: soft to chaos and to blows.
  choir: { armour: -40, res: { chaos: -30 } },
  // Chitin insulates against lightning; the nests burn.
  swarm: { armour: -55, res: { fire: -20, cold: -25, lightning: 20 } },
  // Stone and iron resist the elements and are hollow to chaos; nothing bleeds or is poisoned.
  reliquary: {
    res: { fire: 25, cold: 25, lightning: 25, chaos: -40 },
    immune: ['bleed', 'poison'],
  },
  // Hounds and their keepers: chilled and shocked easily.
  kennel: { armour: -45, res: { cold: -25, lightning: -20 } },
  // Water: fire is no match for it, cold slides off, and it conducts; nothing that lives in it freezes.
  drowned: { res: { fire: 40, cold: 30, lightning: -40 }, immune: ['freeze'] },
  // Made of fire: it shrugs off flame, cannot be set alight, and is quenched by cold.
  emberborn: { res: { fire: 75, cold: -40 }, immune: ['ignite'] },
  // Gilt does not burn, and conducts.
  gilded: { res: { fire: 20, cold: -35, lightning: -30 } },
};

const add = (a: number | undefined, b: number | undefined): number | undefined =>
  a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0);

/** A type's whole profile: its faction's, with its own on top (numbers add, immunities join, a carapace takes the lower). */
export function profileOf(faction: FactionId, own: DefenceProfile | undefined): DefenceProfile {
  const f = FACTION_DEFENCE[faction] ?? {};
  const o = own ?? {};
  const res: Partial<Record<Element, number>> = { ...f.res };
  for (const [k, v] of Object.entries(o.res ?? {}) as [Element, number][])
    res[k] = (res[k] ?? 0) + v;
  const immune = [...new Set<Immunity>([...(f.immune ?? []), ...(o.immune ?? [])])];
  const caps = [f.hitCap, o.hitCap].filter((x): x is number => x !== undefined);
  return {
    armour: add(f.armour, o.armour),
    evasion: add(f.evasion, o.evasion),
    es: add(f.es, o.es),
    res,
    physReduction: add(f.physReduction, o.physReduction),
    immune,
    regen: add(f.regen, o.regen),
    hitCap: caps.length ? Math.min(...caps) : undefined,
    stun: add(f.stun, o.stun),
  };
}

/** The mods that give a monster of `life` this profile. */
export function defenceMods(p: DefenceProfile, life: number): Mod[] {
  const out: Mod[] = [];
  if (p.armour) out.push(mod('armour', 'inc', p.armour));
  if (p.evasion) out.push(mod('evasion', 'inc', p.evasion));
  if (p.es) out.push(mod('es', 'base', Math.round(life * p.es)));
  for (const [el, v] of Object.entries(p.res ?? {}))
    if (v) out.push(mod(`resist.${el}`, 'base', v));
  if (p.physReduction) out.push(mod('physReduction', 'base', p.physReduction));
  for (const i of p.immune ?? [])
    out.push(i === 'stun' ? mod('stunAvoid', 'base', 100) : mod(`avoid.${i}`, 'base', 100));
  if (p.regen) out.push(mod('lifeRegenPct', 'base', p.regen));
  if (p.stun) out.push(mod('stunThreshold', 'inc', p.stun));
  return out;
}

const IMMUNE_TEXT: Record<Immunity, string> = {
  stun: 'stunned',
  freeze: 'frozen',
  ignite: 'ignited',
  shock: 'shocked',
  chill: 'chilled',
  bleed: 'made to bleed',
  poison: 'poisoned',
};

/** What a card says about a profile, one clause each (none for a plain type). */
export function defenceTexts(p: DefenceProfile): string[] {
  const out: string[] = [];
  if ((p.armour ?? 0) >= 50) out.push('Heavily armoured: physical hits do little.');
  else if ((p.armour ?? 0) <= -20) out.push('Lightly armoured: physical damage hurts more.');
  if ((p.evasion ?? 0) >= 50) out.push('Hard to hit: attacks miss it often (spells do not).');
  else if ((p.evasion ?? 0) <= -20) out.push('Easy to hit.');
  if ((p.es ?? 0) >= 0.25) out.push('An energy shield soaks damage first (chaos goes past it).');
  if ((p.physReduction ?? 0) >= 25) out.push(`Takes ${p.physReduction}% less physical damage.`);
  for (const [el, v] of Object.entries(p.res ?? {}) as [Element, number][]) {
    if (v >= 25) out.push(`Resists ${el} (${v}%).`);
    else if (v <= -20) out.push(`Weak to ${el}: takes ${-v}% more.`);
  }
  for (const i of p.immune ?? []) out.push(`Cannot be ${IMMUNE_TEXT[i]}.`);
  if (p.hitCap)
    out.push(`Carapace: no hit takes more than ${Math.round(p.hitCap * 100)}% of its life.`);
  if ((p.regen ?? 0) > 0) out.push(`Regenerates ${p.regen}% of its life a second.`);
  return out;
}
