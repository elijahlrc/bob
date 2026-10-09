import { DAMAGE_TYPES, type SkillTag } from '../mods/types';
import type { ActiveGemDef, AuraGemDef, SkillBehaviour, UtilityDef } from '../data/gems';
import type { SkillProfile } from './skill';

/**
 * The visual language of skills. One colour says what a skill does to the enemy, one shape says how it gets there:
 *
 *   colour  physical bone, lightning violet, cold ice blue, fire orange, chaos green.
 *   attacks sharp: crescents, thin streaks, straight thrusts.
 *   spells  round: orbs, rings, runes drawn on the ground.
 *   areas   rings and discs that grow from where they go off; lasting zones are patches that stay on the ground.
 *   upkeep  buffs and warcries are gold or steel pulses around the player, curses are violet sigils over the enemy,
 *           summons are teal circles, blinks are a blue-white streak, auras are a slow ring at the player's feet.
 *
 * Everything below is plain data, shared by the map renderer, the skill bar and the Codex, and tested for coverage:
 * every skill in the game must land on one of these deliveries.
 */

/** Index into DAMAGE_TYPES: 0 physical, 1 lightning, 2 cold, 3 fire, 4 chaos. */
export const ELEMENT_COLOR = [0xeadfc8, 0xc89cff, 0x9ad8ff, 0xff9a40, 0x9ae05a] as const;
export const ELEMENT_NAME = ['Physical', 'Lightning', 'Cold', 'Fire', 'Chaos'] as const;

export const DELIVERIES = [
  'swing',
  'strike',
  'arrow',
  'orb',
  'chain',
  'beam',
  'nova',
  'blast',
  'field',
  'wall',
  'buff',
  'warcry',
  'guard',
  'curse',
  'blink',
  'summon',
  'aura',
  'herald',
] as const;
export type Delivery = (typeof DELIVERIES)[number];

export const DELIVERY_NAME: Record<Delivery, string> = {
  swing: 'Sweeping melee attack',
  strike: 'Single-target melee attack',
  arrow: 'Ranged attack',
  orb: 'Projectile spell',
  chain: 'Chaining spell',
  beam: 'Beam',
  nova: 'Nova around you',
  blast: 'Area burst at the target',
  field: 'Lasting zone',
  wall: 'Lasting strip',
  buff: 'Buff',
  warcry: 'Warcry',
  guard: 'Guard skill',
  curse: 'Curse',
  blink: 'Blink',
  summon: 'Summon',
  aura: 'Aura',
  herald: 'Herald',
};

/** Colours of skills that deal no damage (they have no element). */
export const UTILITY_COLOR: Record<
  'buff' | 'warcry' | 'guard' | 'curse' | 'blink' | 'summon' | 'aura',
  number
> = {
  buff: 0xffd070,
  warcry: 0xffb050,
  guard: 0xa8c0e0,
  curse: 0xb070e0,
  blink: 0xb0e0ff,
  summon: 0x70d0b0,
  aura: 0xffe0a0,
};

export type SkillLook = {
  delivery: Delivery;
  /** Index into DAMAGE_TYPES, or -1 for a skill that deals no damage. */
  element: number;
  color: number;
  /** One or two letters for an icon. */
  initials: string;
};

export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** How a skill gets to the enemy, from what it is. */
export function deliveryOf(
  b: SkillBehaviour,
  type: 'attack' | 'spell',
  tags: readonly SkillTag[],
  utility?: UtilityDef,
): Delivery {
  if (utility) {
    switch (utility.kind) {
      case 'buff':
        return tags.includes('warcry') ? 'warcry' : tags.includes('guard') ? 'guard' : 'buff';
      case 'curse':
        return 'curse';
      case 'shout':
        return 'warcry';
      case 'blink':
        return 'blink';
      case 'summon':
        return 'summon';
    }
  }
  switch (b.kind) {
    case 'melee':
      return b.arc !== undefined ? 'swing' : 'strike';
    case 'projectile':
      return type === 'attack' ? 'arrow' : 'orb';
    case 'chain':
      return 'chain';
    case 'beam':
      return 'beam';
    case 'burst':
      return b.origin === 'self' ? 'nova' : 'blast';
    case 'ground':
      return b.line !== undefined ? 'wall' : 'field';
  }
}

/** The element a skill is known for: its biggest base damage, else its element tag, else physical. */
export function elementOfTags(
  tags: readonly SkillTag[],
  spellDamage?: ActiveGemDef['spellDamage'],
): number {
  if (spellDamage && spellDamage.length > 0) {
    let best = 0;
    let bestShare = -1;
    for (const d of spellDamage) {
      const share = 'spread' in d ? (d.share ?? 1) : 1;
      if (share > bestShare) {
        bestShare = share;
        best = DAMAGE_TYPES.indexOf(d.type);
      }
    }
    return best;
  }
  if (tags.includes('fire')) return 3;
  if (tags.includes('cold')) return 2;
  if (tags.includes('lightning')) return 1;
  if (tags.includes('chaos')) return 4;
  return 0;
}

/** The look of an active gem. */
export function activeLook(def: ActiveGemDef): SkillLook {
  const delivery = deliveryOf(def.behaviour, def.skillType, def.tags, def.utility);
  const initials = initialsOf(def.name);
  if (def.utility) {
    const kind = delivery as keyof typeof UTILITY_COLOR;
    return { delivery, element: -1, color: UTILITY_COLOR[kind], initials };
  }
  const element = elementOfTags(def.tags, def.spellDamage);
  return { delivery, element, color: ELEMENT_COLOR[element], initials };
}

/** The look of an aura gem: a herald takes the element of what it explodes with, any other aura is gold. */
export function auraLook(def: AuraGemDef): SkillLook {
  const initials = initialsOf(def.name);
  const t = def.triggers?.find((x) => x.effect.kind === 'explode');
  if (def.triggers && def.triggers.length > 0) {
    const element = t && t.effect.kind === 'explode' ? DAMAGE_TYPES.indexOf(t.effect.dtype) : 0;
    return { delivery: 'herald', element, color: ELEMENT_COLOR[element], initials };
  }
  return { delivery: 'aura', element: -1, color: UTILITY_COLOR.aura, initials };
}

/** The element a skill profile is dealing right now: the type of the biggest chunk of its first hand. */
export function profileElement(p: SkillProfile, hand = 0): number {
  let dtype = 0;
  let best = -1;
  for (const c of p.hands[Math.min(hand, p.hands.length - 1)]?.chunks ?? [])
    if (c.max > best) {
      best = c.max;
      dtype = c.type;
    }
  return dtype;
}

/** The look of a skill being used, with the element it deals at the moment (supports can change it). */
export function profileLook(p: SkillProfile): SkillLook {
  const s = p.skill;
  const delivery = deliveryOf(s.behaviour, s.type, s.tags, s.utility);
  const initials = initialsOf(s.name);
  if (s.utility) {
    const kind = delivery as keyof typeof UTILITY_COLOR;
    return { delivery, element: -1, color: UTILITY_COLOR[kind], initials };
  }
  const element = profileElement(p);
  return { delivery, element, color: ELEMENT_COLOR[element], initials };
}

/** What each delivery looks like on the map, in words (the Codex legend and docs/VISUAL_LANGUAGE.md). */
export const DELIVERY_LOOK: Record<Delivery, string> = {
  swing: 'A crescent sweeps through the arc the blow covers and tints the ground it reaches.',
  strike:
    'A sharp streak runs from the attacker to the enemy it hits; a slam adds dust and a shake.',
  arrow: 'A thin streak flies out with a flash at the weapon; the arrow carries the element.',
  orb: 'A rune circle opens at the caster, then a glowing orb leaves it, trailing sparks of its element.',
  chain: 'A rune circle, then forked arcs jump from enemy to enemy.',
  beam: 'A rune circle, then a bright jagged line from the caster through everything it hits.',
  nova: 'A rune circle, then a ring grows outward from the caster.',
  blast:
    'A rune circle, then a ring and a flash grow where the skill lands; physical blasts crack the floor.',
  field:
    'A ring of ticks marks where it will land, then a patch stays on the ground, its marks showing the element.',
  wall: 'A band marked on the ground between the caster and the target, with marks flowing down it.',
  buff: 'A gold ring and rising motes; a gold mote circles you while the buff lasts.',
  warcry: 'A wide orange ring and a shake of the screen.',
  guard: 'A steel hexagonal shield rises around you.',
  curse:
    'A violet rune opens under the target, and a violet sigil turns over its head while it lasts.',
  blink: 'A blue-white streak from where you were to where you land.',
  summon:
    'A teal circle opens where they appear; each minion stands in a teal ring and shows its life when hurt.',
  aura: 'A slow gold ring turns at your feet for as long as the aura is on.',
  herald: 'A spiked ring in the element it explodes with turns at your feet.',
};
