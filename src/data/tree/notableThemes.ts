import { mod, type Mod } from '../../mods/types';

/**
 * Parameterised notable themes (DESIGN.md §9.2). `s` is the strength: 1 for normal notables,
 * 1.5 for outer-ring notables. Small nodes repeat the theme at about a third of the notable.
 */
export type Theme = {
  id: string;
  smallName: string;
  small: Mod[];
  notable: (s: number) => Mod[];
};

const r = (v: number) => Math.round(v);
const r1 = (v: number) => Math.round(v * 10) / 10;
const ELE = ['fire', 'cold', 'lightning'] as ('fire' | 'cold' | 'lightning')[];

export const THEMES: Record<string, Theme> = {
  // --- Strength ---------------------------------------------------------------------------
  lifePct: {
    id: 'lifePct',
    smallName: 'Life',
    small: [mod('life', 'inc', 4)],
    notable: (s) => [mod('life', 'inc', r(10 * s)), mod('lifeRegenPct', 'base', r1(0.4 * s))],
  },
  armour: {
    id: 'armour',
    smallName: 'Armour',
    small: [mod('armour', 'inc', 10)],
    notable: (s) => [mod('armour', 'inc', r(30 * s)), mod('life', 'inc', r(4 * s))],
  },
  twoHand: {
    id: 'twoHand',
    smallName: 'Two Handed Damage',
    small: [mod('damage', 'inc', 6, { tags: ['twoHand'] })],
    notable: (s) => [
      mod('damage', 'inc', r(18 * s), { tags: ['twoHand'] }),
      mod('attackSpeed', 'inc', r(4 * s), { tags: ['twoHand'] }),
    ],
  },
  mace: {
    id: 'mace',
    smallName: 'Mace Damage',
    small: [mod('damage', 'inc', 6, { tags: ['mace'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['mace'] }),
      mod('enemyStunThreshold', 'base', r(8 * s)),
    ],
  },
  lifeRegen: {
    id: 'lifeRegen',
    smallName: 'Life Regeneration',
    small: [mod('lifeRegenPct', 'base', 0.3)],
    notable: (s) => [
      mod('lifeRegenPct', 'base', r1(1.2 * s)),
      mod('lifeOnKillPct', 'base', r1(1 * s)),
    ],
  },
  meleePhys: {
    id: 'meleePhys',
    smallName: 'Physical Damage with Melee',
    small: [mod('damage', 'inc', 6, { damageTypes: ['physical'], tags: ['melee'] })],
    notable: (s) => [
      mod('damage', 'inc', r(18 * s), { damageTypes: ['physical'], tags: ['melee'] }),
      mod('stunDamage', 'inc', r(15 * s)),
    ],
  },
  physReduction: {
    id: 'physReduction',
    smallName: 'Armour',
    small: [mod('armour', 'inc', 6)],
    notable: (s) => [mod('physReduction', 'base', r(4 * s)), mod('armour', 'inc', r(15 * s))],
  },
  stunThreshold: {
    id: 'stunThreshold',
    smallName: 'Stun Threshold',
    small: [mod('stunThreshold', 'inc', 8)],
    notable: (s) => [mod('stunThreshold', 'inc', r(25 * s)), mod('stunAvoid', 'base', r(10 * s))],
  },
  stunDuration: {
    id: 'stunDuration',
    smallName: 'Stun Duration',
    small: [mod('stunDuration', 'inc', 8)],
    notable: (s) => [
      mod('stunDuration', 'inc', r(25 * s)),
      mod('enemyStunThreshold', 'base', r(10 * s)),
    ],
  },
  // --- Strength / Dexterity --------------------------------------------------------------
  sword: {
    id: 'sword',
    smallName: 'Sword Damage',
    small: [mod('damage', 'inc', 6, { tags: ['sword'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['sword'] }),
      mod('accuracy', 'inc', r(10 * s), { tags: ['sword'] }),
    ],
  },
  axe: {
    id: 'axe',
    smallName: 'Axe Damage',
    small: [mod('damage', 'inc', 6, { tags: ['axe'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['axe'] }),
      mod('chance.bleed', 'base', r(5 * s)),
    ],
  },
  attackSpeed: {
    id: 'attackSpeed',
    smallName: 'Attack Speed',
    small: [mod('attackSpeed', 'inc', 3)],
    notable: (s) => [mod('attackSpeed', 'inc', r(8 * s)), mod('accuracy', 'inc', r(10 * s))],
  },
  block: {
    id: 'block',
    smallName: 'Block Chance',
    small: [mod('blockAttack', 'base', 1)],
    notable: (s) => [
      mod('blockAttack', 'base', r(4 * s)),
      mod('lifeOnBlockPct', 'base', r1(1 * s)),
    ],
  },
  bleed: {
    id: 'bleed',
    smallName: 'Bleeding',
    small: [mod('damage', 'inc', 8, { tags: ['bleed'] })],
    notable: (s) => [
      mod('chance.bleed', 'base', r(10 * s)),
      mod('damage', 'inc', r(20 * s), { tags: ['bleed'] }),
    ],
  },
  dualWield: {
    id: 'dualWield',
    smallName: 'Dual Wield Damage',
    small: [mod('damage', 'inc', 6, { tags: ['dualWield'] })],
    notable: (s) => [
      mod('attackSpeed', 'inc', r(6 * s), { tags: ['dualWield'] }),
      mod('damage', 'inc', r(12 * s), { tags: ['dualWield'] }),
    ],
  },
  accuracy: {
    id: 'accuracy',
    smallName: 'Accuracy',
    small: [mod('accuracy', 'base', 40)],
    notable: (s) => [mod('accuracy', 'inc', r(20 * s)), mod('critChance', 'inc', r(10 * s))],
  },
  lifeLeech: {
    id: 'lifeLeech',
    smallName: 'Life Leech',
    small: [mod('leech.life', 'base', 0.2, { tags: ['attack'] })],
    notable: (s) => [
      mod('leech.life', 'base', r1(0.6 * s), { tags: ['attack'] }),
      mod('damage', 'inc', r(10 * s), { tags: ['attack'] }),
    ],
  },
  stunAvoid: {
    id: 'stunAvoid',
    smallName: 'Stun Avoidance',
    small: [mod('stunAvoid', 'base', 5)],
    notable: (s) => [
      mod('stunAvoid', 'base', r(20 * s)),
      mod('stunDurationOnSelf', 'base', r(20 * s)),
    ],
  },
  // --- Dexterity -------------------------------------------------------------------------
  bow: {
    id: 'bow',
    smallName: 'Bow Damage',
    small: [mod('damage', 'inc', 6, { tags: ['bow'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['bow'] }),
      mod('attackSpeed', 'inc', r(4 * s), { tags: ['bow'] }),
    ],
  },
  projectile: {
    id: 'projectile',
    smallName: 'Projectile Damage',
    small: [mod('damage', 'inc', 6, { tags: ['projectile'] })],
    notable: (s) => [
      mod('damage', 'inc', r(15 * s), { tags: ['projectile'] }),
      mod('projectileSpeed', 'inc', r(10 * s)),
    ],
  },
  evasion: {
    id: 'evasion',
    smallName: 'Evasion',
    small: [mod('evasion', 'inc', 10)],
    notable: (s) => [mod('evasion', 'inc', r(30 * s)), mod('moveSpeed', 'inc', r(2 * s))],
  },
  moveSpeed: {
    id: 'moveSpeed',
    smallName: 'Movement Speed',
    small: [mod('moveSpeed', 'inc', 2)],
    notable: (s) => [mod('moveSpeed', 'inc', r(6 * s)), mod('evasion', 'base', r(100 * s))],
  },
  bowCrit: {
    id: 'bowCrit',
    smallName: 'Bow Critical Strike Chance',
    small: [mod('critChance', 'inc', 10, { tags: ['bow'] })],
    notable: (s) => [
      mod('critChance', 'inc', r(25 * s), { tags: ['bow'] }),
      mod('critMulti', 'base', r(15 * s), { tags: ['bow'] }),
    ],
  },
  flaskEffect: {
    id: 'flaskEffect',
    smallName: 'Flask Recovery',
    small: [mod('flaskRecovery', 'inc', 5)],
    notable: (s) => [mod('flaskEffect', 'inc', r(10 * s)), mod('flaskRecovery', 'inc', r(15 * s))],
  },
  projSpeed: {
    id: 'projSpeed',
    smallName: 'Projectile Speed',
    small: [mod('projectileSpeed', 'inc', 5)],
    notable: (s) => [mod('projectileSpeed', 'inc', r(15 * s)), mod('pierce', 'base', r(1 * s))],
  },
  flaskCharges: {
    id: 'flaskCharges',
    smallName: 'Flask Charges',
    small: [mod('flaskCharges', 'inc', 5)],
    notable: (s) => [mod('flaskCharges', 'inc', r(20 * s)), mod('flaskDuration', 'inc', r(10 * s))],
  },
  // --- Dexterity / Intelligence ------------------------------------------------------------
  dagger: {
    id: 'dagger',
    smallName: 'Dagger Damage',
    small: [mod('damage', 'inc', 6, { tags: ['dagger'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['dagger'] }),
      mod('critChance', 'inc', r(15 * s), { tags: ['dagger'] }),
    ],
  },
  claw: {
    id: 'claw',
    smallName: 'Claw Damage',
    small: [mod('damage', 'inc', 6, { tags: ['claw'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['claw'] }),
      mod('lifeOnHit', 'base', r(4 * s)),
    ],
  },
  poison: {
    id: 'poison',
    smallName: 'Poison Damage',
    small: [mod('damage', 'inc', 8, { tags: ['poison'] })],
    notable: (s) => [
      mod('chance.poison', 'base', r(10 * s)),
      mod('damage', 'inc', r(20 * s), { tags: ['poison'] }),
    ],
  },
  critChance: {
    id: 'critChance',
    smallName: 'Critical Strike Chance',
    small: [mod('critChance', 'inc', 10)],
    notable: (s) => [mod('critChance', 'inc', r(30 * s)), mod('critMulti', 'base', r(10 * s))],
  },
  critMulti: {
    id: 'critMulti',
    smallName: 'Critical Strike Multiplier',
    small: [mod('critMulti', 'base', 6)],
    notable: (s) => [mod('critMulti', 'base', r(20 * s)), mod('damage', 'inc', r(8 * s))],
  },
  esEvasion: {
    id: 'esEvasion',
    smallName: 'Evasion and Energy Shield',
    small: [mod('es', 'inc', 4), mod('evasion', 'inc', 4)],
    notable: (s) => [mod('es', 'inc', r(12 * s)), mod('evasion', 'inc', r(12 * s))],
  },
  chaos: {
    id: 'chaos',
    smallName: 'Chaos Damage',
    small: [mod('damage', 'inc', 6, { damageTypes: ['chaos'] })],
    notable: (s) => [
      mod('damage', 'inc', r(18 * s), { damageTypes: ['chaos'] }),
      mod('resist.chaos', 'base', r(10 * s)),
    ],
  },
  lifeOnHit: {
    id: 'lifeOnHit',
    smallName: 'Life on Hit',
    small: [mod('lifeOnHit', 'base', 2)],
    notable: (s) => [mod('lifeOnHit', 'base', r(6 * s)), mod('attackSpeed', 'inc', r(4 * s))],
  },
  // --- Intelligence ------------------------------------------------------------------------
  spell: {
    id: 'spell',
    smallName: 'Spell Damage',
    small: [mod('damage', 'inc', 6, { tags: ['spell'] })],
    notable: (s) => [
      mod('damage', 'inc', r(18 * s), { tags: ['spell'] }),
      mod('castSpeed', 'inc', r(4 * s)),
    ],
  },
  es: {
    id: 'es',
    smallName: 'Energy Shield',
    small: [mod('es', 'inc', 5)],
    notable: (s) => [mod('es', 'inc', r(15 * s)), mod('esRechargeRate', 'inc', r(10 * s))],
  },
  mana: {
    id: 'mana',
    smallName: 'Mana',
    small: [mod('mana', 'inc', 5)],
    notable: (s) => [mod('mana', 'inc', r(15 * s)), mod('manaRegen', 'inc', r(20 * s))],
  },
  castSpeed: {
    id: 'castSpeed',
    smallName: 'Cast Speed',
    small: [mod('castSpeed', 'inc', 3)],
    notable: (s) => [mod('castSpeed', 'inc', r(8 * s)), mod('mana', 'inc', r(5 * s))],
  },
  elemental: {
    id: 'elemental',
    smallName: 'Elemental Damage',
    small: [mod('damage', 'inc', 6, { damageTypes: ELE })],
    notable: (s) => [
      mod('damage', 'inc', r(18 * s), { damageTypes: ELE }),
      mod('penetration', 'base', r(3 * s), { damageTypes: ELE }),
    ],
  },
  wand: {
    id: 'wand',
    smallName: 'Wand Damage',
    small: [mod('damage', 'inc', 6, { tags: ['wand'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['wand'] }),
      mod('critChance', 'inc', r(10 * s), { tags: ['wand'] }),
    ],
  },
  reservation: {
    id: 'reservation',
    smallName: 'Reduced Mana Reserved',
    small: [mod('reducedReservation', 'base', 1)],
    notable: (s) => [
      mod('reducedReservation', 'base', r(4 * s)),
      mod('manaRegen', 'inc', r(15 * s)),
    ],
  },
  esRecharge: {
    id: 'esRecharge',
    smallName: 'Energy Shield Recharge',
    small: [mod('esRechargeRate', 'inc', 5)],
    notable: (s) => [mod('esRechargeDelay', 'inc', r(20 * s)), mod('es', 'inc', r(8 * s))],
  },
  // --- Strength / Intelligence -------------------------------------------------------------
  sceptre: {
    id: 'sceptre',
    smallName: 'Sceptre Damage',
    small: [mod('damage', 'inc', 6, { tags: ['sceptre'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['sceptre'] }),
      mod('damage', 'inc', r(8 * s), { damageTypes: ELE }),
    ],
  },
  staff: {
    id: 'staff',
    smallName: 'Staff Damage',
    small: [mod('damage', 'inc', 6, { tags: ['staff'] })],
    notable: (s) => [
      mod('damage', 'inc', r(16 * s), { tags: ['staff'] }),
      mod('blockAttack', 'base', r(3 * s)),
    ],
  },
  eleRes: {
    id: 'eleRes',
    smallName: 'Elemental Resistances',
    small: [mod('resist.allEle', 'base', 3)],
    notable: (s) => [mod('resist.allEle', 'base', r(10 * s)), mod('life', 'inc', r(3 * s))],
  },
  auraEffect: {
    id: 'auraEffect',
    smallName: 'Aura Effect',
    small: [mod('auraEffect', 'inc', 2)],
    notable: (s) => [
      mod('auraEffect', 'inc', r(8 * s)),
      mod('reducedReservation', 'base', r(2 * s)),
    ],
  },
  ignite: {
    id: 'ignite',
    smallName: 'Burning Damage',
    small: [mod('damage', 'inc', 8, { tags: ['ignite'] })],
    notable: (s) => [
      mod('chance.ignite', 'base', r(8 * s)),
      mod('damage', 'inc', r(20 * s), { tags: ['ignite'] }),
      mod('duration.ignite', 'inc', r(10 * s)),
    ],
  },
  armourEs: {
    id: 'armourEs',
    smallName: 'Armour and Energy Shield',
    small: [mod('armour', 'inc', 5), mod('es', 'inc', 3)],
    notable: (s) => [mod('armour', 'inc', r(15 * s)), mod('es', 'inc', r(10 * s))],
  },
  maxRes: {
    id: 'maxRes',
    smallName: 'Elemental Resistances',
    small: [mod('resist.allEle', 'base', 2)],
    notable: (s) => [
      mod('maxResist.allEle', 'base', r(1 * s)),
      mod('resist.allEle', 'base', r(6 * s)),
    ],
  },
  fireDamage: {
    id: 'fireDamage',
    smallName: 'Fire Damage',
    small: [mod('damage', 'inc', 6, { damageTypes: ['fire'] })],
    notable: (s) => [
      mod('damage', 'inc', r(18 * s), { damageTypes: ['fire'] }),
      mod('resist.fire', 'base', r(10 * s)),
    ],
  },
  // --- Hub (generic) -----------------------------------------------------------------------
  allAttr: {
    id: 'allAttr',
    smallName: 'All Attributes',
    small: [mod('allAttr', 'base', 4)],
    notable: (s) => [mod('allAttr', 'base', r(12 * s)), mod('life', 'inc', r(3 * s))],
  },
  hubLife: {
    id: 'hubLife',
    smallName: 'Life',
    small: [mod('life', 'inc', 3)],
    notable: (s) => [mod('life', 'inc', r(8 * s)), mod('mana', 'inc', r(6 * s))],
  },
  hubDamage: {
    id: 'hubDamage',
    smallName: 'Damage',
    small: [mod('damage', 'inc', 5)],
    notable: (s) => [mod('damage', 'inc', r(14 * s)), mod('attackSpeed', 'inc', r(3 * s))],
  },
  ailmentEffect: {
    id: 'ailmentEffect',
    smallName: 'Ailment Effect',
    small: [mod('ailmentEffect', 'inc', 4)],
    notable: (s) => [
      mod('ailmentEffect', 'inc', r(12 * s)),
      mod('damage', 'inc', r(10 * s), { tags: ['dot'] }),
    ],
  },
  hubFlask: {
    id: 'hubFlask',
    smallName: 'Flask Charges',
    small: [mod('flaskCharges', 'inc', 4)],
    notable: (s) => [mod('flaskCharges', 'inc', r(15 * s)), mod('flaskEffect', 'inc', r(6 * s))],
  },
  hubCast: {
    id: 'hubCast',
    smallName: 'Cast and Attack Speed',
    small: [mod('castSpeed', 'inc', 2), mod('attackSpeed', 'inc', 2)],
    notable: (s) => [mod('castSpeed', 'inc', r(5 * s)), mod('attackSpeed', 'inc', r(5 * s))],
  },
  hubMana: {
    id: 'hubMana',
    smallName: 'Mana Regeneration',
    small: [mod('manaRegen', 'inc', 6)],
    notable: (s) => [mod('manaRegen', 'inc', r(20 * s)), mod('lifeRegenPct', 'base', r1(0.4 * s))],
  },
};
