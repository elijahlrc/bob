import { mod, type Mod } from '../../mods/types';

/** DESIGN.md §9.4: the 21 keystones. */
export type KeystoneDef = { id: string; name: string; mods: Mod[]; description: string };

const ELE = ['fire', 'cold', 'lightning'] as ('fire' | 'cold' | 'lightning')[];

export const KEYSTONES: KeystoneDef[] = [
  {
    id: 'unerringDiscipline',
    name: 'Unerring Discipline',
    mods: [mod('alwaysHit', 'flag', 1), mod('neverCrit', 'flag', 1)],
    description: 'Attacks always hit. Never deal critical strikes.',
  },
  {
    id: 'hollowVessel',
    name: 'Hollow Vessel',
    mods: [mod('lifeIsOne', 'flag', 1), mod('immuneChaos', 'flag', 1)],
    description: 'Maximum life is 1. Immune to chaos damage.',
  },
  {
    id: 'bloodRite',
    name: 'Blood Rite',
    mods: [mod('skillsCostLife', 'flag', 1)],
    description: 'Skills cost life instead of mana. Maximum mana is 0. Auras reserve life.',
  },
  {
    id: 'platedHide',
    name: 'Plated Hide',
    mods: [mod('evasionToArmour', 'flag', 1)],
    description: 'Evasion rating is converted to armour. Dexterity gives no evasion bonus.',
  },
  {
    id: 'mindBulwark',
    name: 'Mind Bulwark',
    mods: [mod('manaBeforeLife30', 'flag', 1)],
    description: '30% of damage is taken from mana before life.',
  },
  {
    id: 'searingAvatar',
    name: 'Searing Avatar',
    mods: [
      mod('avatarOfFire', 'flag', 1),
      mod('convert.physical.fire', 'base', 50),
      mod('convert.lightning.fire', 'base', 50),
      mod('convert.cold.fire', 'base', 50),
    ],
    description:
      '50% of physical, lightning and cold damage converted to fire. Deal no non-fire damage.',
  },
  {
    id: 'closeQuarters',
    name: 'Close Quarters',
    mods: [mod('closeQuarters', 'flag', 1)],
    description:
      'Projectile attack damage: up to 50% more at close range, falling to 50% less at long range.',
  },
  {
    id: 'crimsonPact',
    name: 'Crimson Pact',
    mods: [mod('instantLeechNoRegen', 'flag', 1)],
    description: 'Leech is instant. You have no life regeneration.',
  },
  {
    id: 'feverPitch',
    name: 'Fever Pitch',
    mods: [
      mod('feverPitch', 'flag', 1),
      mod('damage', 'more', 40, { damageTypes: ELE, condition: { id: 'overloadActive' } }),
    ],
    description:
      'After a critical strike, 40% more elemental damage for 8 s. Critical strike multiplier is 100%.',
  },
  {
    id: 'painConduit',
    name: 'Pain Conduit',
    mods: [
      mod('painConduit', 'flag', 1),
      mod('damage', 'more', 30, { tags: ['spell'], condition: { id: 'onLowLife' } }),
    ],
    description: '30% more spell damage while on low life.',
  },
  {
    id: 'rootedStance',
    name: 'Rooted Stance',
    mods: [mod('cannotBeStunned', 'flag', 1), mod('cannotEvade', 'flag', 1)],
    description: 'Cannot be stunned. Cannot evade enemy attacks.',
  },
  {
    id: 'prismaticBalance',
    name: 'Prismatic Balance',
    mods: [mod('prismaticBalance', 'flag', 1)],
    description:
      "Your hits give the target +25% resistance to the hit's elements and −50% to the others for 5 s.",
  },
  {
    id: 'livingWard',
    name: 'Living Ward',
    mods: [mod('regenToES', 'flag', 1), mod('lifeIsOne', 'flag', 1)],
    description: 'Life regeneration applies to energy shield instead. Maximum life is 1.',
  },
  {
    id: 'shadeLeech',
    name: 'Shade Leech',
    mods: [mod('leechToES', 'flag', 1), mod('esRechargeRate', 'more', -50)],
    description:
      'Life leech applies to energy shield instead. Energy shield recharge is 50% slower.',
  },
  {
    id: 'strongarm',
    name: 'Strongarm',
    mods: [mod('strongarm', 'flag', 1)],
    description: "Strength's melee damage bonus also applies to projectile attacks.",
  },
  {
    id: 'woundDance',
    name: 'Wound Dance',
    mods: [mod('woundDance', 'flag', 1)],
    description:
      'Bleeds stack up to 8 times. Bleeding no longer deals extra damage to moving targets.',
  },
  {
    id: 'cruelAgony',
    name: 'Cruel Agony',
    mods: [mod('cruelAgony', 'flag', 1)],
    description:
      'Ailments from critical strikes use your critical strike multiplier. Crits deal 30% less hit damage.',
  },
  {
    id: 'manaBastion',
    name: 'Mana Bastion',
    mods: [mod('manaBastion', 'flag', 1)],
    description:
      'Energy shield protects mana instead of life. Skill costs are paid from energy shield first.',
  },
  {
    id: 'arrowWeave',
    name: 'Arrow Weave',
    mods: [
      mod('arrowWeave', 'flag', 1),
      mod('evadeBonus.projectile', 'base', 40),
      mod('evadeBonus.melee', 'base', -30),
    ],
    description: '+40% chance to evade projectile attacks; −30% chance to evade melee attacks.',
  },
  {
    id: 'shieldwall',
    name: 'Shieldwall',
    mods: [mod('blockCap', 'base', 10), mod('evasion', 'more', -30)],
    description: 'Block chance cap +10%. 30% less evasion rating.',
  },
  {
    id: 'steadyDraw',
    name: 'Steady Draw',
    mods: [
      mod('damage', 'more', 25, { tags: ['bow'] }),
      mod('attackSpeed', 'more', -20, { tags: ['bow'] }),
    ],
    description: 'Bow attacks deal 25% more damage with 20% less attack speed.',
  },
];

export function keystoneDef(id: string): KeystoneDef {
  const k = KEYSTONES.find((x) => x.id === id);
  if (!k) throw new Error(`unknown keystone ${id}`);
  return k;
}
