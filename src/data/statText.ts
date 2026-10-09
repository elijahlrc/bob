import { CHARGE_KINDS, CHARGE_NAMES } from '../calc/charges';
import { BUFF_IDS, BUFFS } from './buffs';
import { ALL_GEMS, GRANTED_GEMS } from './gems';
import { ALL_HEX_IDS, HEXES } from './hexes';
import { STATUS_IDS, STATUSES } from './statuses';
import { KEYSTONES } from './tree/keystones';
/**
 * Per-stat text templates (DESIGN.md §7.1). Text is always generated from structured mods; it is
 * never parsed back. `name` is used with increased/more/base phrasing; `pct` marks stats whose
 * base value is a percentage; `flag` is the full line for flag mods.
 */
export type StatText = { name?: string; pct?: boolean; flag?: string; base?: string };

export const STAT_TEXT: Record<string, StatText> = {
  str: { name: 'Strength' },
  dex: { name: 'Dexterity' },
  int: { name: 'Intelligence' },
  allAttr: { name: 'all Attributes' },
  life: { name: 'maximum Life' },
  mana: { name: 'maximum Mana' },
  es: { name: 'maximum Energy Shield' },
  lifeRegen: { base: '{v} Life Regenerated per second', name: 'Life Regeneration rate' },
  lifeRegenPct: { base: 'Regenerate {v}% of Life per second' },
  manaRegen: { name: 'Mana Regeneration Rate' },
  manaRegenFlat: { base: '{v} Mana Regenerated per second' },
  esRechargeRate: { name: 'Energy Shield Recharge Rate' },
  esRechargeDelay: { name: 'faster start of Energy Shield Recharge' },
  armour: { name: 'Armour' },
  evasion: { name: 'Evasion Rating' },
  accuracy: { name: 'Accuracy Rating' },
  blockAttack: { name: 'Chance to Block Attack Damage', pct: true },
  blockSpell: { name: 'Chance to Block Spell Damage', pct: true },
  blockCap: { name: 'maximum Chance to Block', pct: true },
  'resist.fire': { name: 'Fire Resistance', pct: true },
  'resist.cold': { name: 'Cold Resistance', pct: true },
  'resist.lightning': { name: 'Lightning Resistance', pct: true },
  'resist.chaos': { name: 'Chaos Resistance', pct: true },
  'resist.allEle': { name: 'all Elemental Resistances', pct: true },
  'maxResist.fire': { name: 'maximum Fire Resistance', pct: true },
  'maxResist.cold': { name: 'maximum Cold Resistance', pct: true },
  'maxResist.lightning': { name: 'maximum Lightning Resistance', pct: true },
  'maxResist.chaos': { name: 'maximum Chaos Resistance', pct: true },
  'maxResist.allEle': { name: 'maximum Elemental Resistances', pct: true },
  attackSpeed: { name: 'Attack Speed' },
  castSpeed: { name: 'Cast Speed' },
  moveSpeed: { name: 'Movement Speed' },
  actionSpeed: { name: 'Action Speed' },
  critChance: { name: 'Critical Strike Chance', pct: true },
  critMulti: { name: 'Critical Strike Multiplier', pct: true },
  penetration: { base: 'Damage Penetrates {v}% of Enemy {types} Resistance' },
  'chance.ignite': { name: 'chance to Ignite', pct: true },
  'chance.bleed': { name: 'chance to cause Bleeding', pct: true },
  'chance.poison': { name: 'chance to Poison on Hit', pct: true },
  'chance.shock': { name: 'chance to Shock', pct: true },
  'chance.freeze': { name: 'chance to Freeze', pct: true },
  'duration.ignite': { name: 'Ignite Duration' },
  'duration.bleed': { name: 'Bleeding Duration' },
  'duration.poison': { name: 'Poison Duration' },
  'duration.shock': { name: 'Shock Duration' },
  'duration.chill': { name: 'Chill Duration' },
  'duration.freeze': { name: 'Freeze Duration' },
  'effect.shock': { name: 'Effect of Shock' },
  'effect.chill': { name: 'Effect of Chill' },
  ailmentEffect: { name: 'Effect of non-damaging Ailments' },
  'leech.life': {
    name: 'of Damage Leeched as Life',
    pct: true,
    base: '{v}% of {types}Damage Leeched as Life',
  },
  'leech.mana': {
    name: 'of Damage Leeched as Mana',
    pct: true,
    base: '{v}% of {types}Damage Leeched as Mana',
  },
  lifeOnHit: { base: 'Gain {v} Life per Enemy Hit' },
  lifeOnKill: { base: 'Gain {v} Life per Enemy Killed' },
  lifeOnKillPct: { base: 'Recover {v}% of Life on Kill' },
  manaOnKill: { base: 'Gain {v} Mana per Enemy Killed' },
  lifeOnBlockPct: { base: 'Recover {v}% of Life when you Block' },
  stunThreshold: { name: 'Stun Threshold' },
  stunDuration: { name: 'Stun Duration on Enemies' },
  enemyStunThreshold: { base: '{v}% reduced Enemy Stun Threshold' },
  stunAvoid: { name: 'chance to Avoid being Stunned', pct: true },
  stunDurationOnSelf: { base: '{v}% reduced Stun Duration on you' },
  stunDamage: { name: 'Stun Damage' },
  projectiles: { base: '{v} additional Projectiles' },
  pierce: { base: 'Projectiles Pierce {v} additional Targets' },
  chains: { base: 'Chain {v} additional times' },
  projectileSpeed: { name: 'Projectile Speed' },
  aoe: { name: 'Area of Effect' },
  reducedReservation: { base: '{v}% reduced Mana Reserved' },
  auraEffect: { name: 'effect of Auras on you' },
  flaskEffect: { name: 'effect of Flasks' },
  flaskCharges: { name: 'Flask Charges gained' },
  flaskRecovery: { name: 'Flask Recovery amount' },
  flaskDuration: { name: 'Flask effect Duration' },
  damageTaken: { name: 'Damage taken' },
  physReduction: { base: '{v}% additional Physical Damage Reduction' },
  cost: { name: 'Mana Cost of Skills' },
  'evadeBonus.projectile': { base: '{v}% chance to Evade Projectile Attacks' },
  'evadeBonus.melee': { base: '{v}% chance to Evade Melee Attacks' },
  socketedGemLevel: { base: '+{v} to Level of Socketed Gems' },
  itemQuantity: { name: 'Quantity of Items found' },
  itemRarity: { name: 'Rarity of Items found' },
  xpGain: { name: 'Experience gained' },
  // Flags.
  neverCrit: { flag: 'Never deal Critical Strikes' },
  alwaysHit: { flag: "Your hits can't be Evaded" },
  lifeIsOne: { flag: 'Maximum Life becomes 1' },
  immuneChaos: { flag: 'Immune to Chaos Damage' },
  skillsCostLife: { flag: 'Skills cost Life instead of Mana; Auras reserve Life' },
  evasionToArmour: { flag: 'Evasion Rating is converted to Armour' },
  manaBeforeLife30: { flag: '30% of Damage is taken from Mana before Life' },
  avatarOfFire: { flag: '50% of non-Fire Damage converted to Fire; deal no non-Fire Damage' },
  closeQuarters: { flag: 'Projectiles deal more Damage at close range, less at long range' },
  instantLeechNoRegen: { flag: 'Life Leech is instant; you have no Life Regeneration' },
  feverPitch: {
    flag: '40% more Elemental Damage for 8 seconds after a Critical Strike; Critical Strike Multiplier is 100%',
  },
  painConduit: { flag: '30% more Spell Damage while on Low Life' },
  cannotBeStunned: { flag: 'Cannot be Stunned' },
  cannotEvade: { flag: 'Cannot Evade enemy Attacks' },
  prismaticBalance: { flag: 'Hits shift Enemy Elemental Resistances for 5 seconds' },
  regenToES: { flag: 'Life Regeneration applies to Energy Shield instead' },
  leechToES: { flag: 'Life Leech applies to Energy Shield instead' },
  strongarm: { flag: "Strength's Damage bonus applies to Projectile Attacks" },
  woundDance: { flag: 'Bleeding stacks up to 8 times; no extra Damage while moving' },
  cruelAgony: { flag: 'Ailments are affected by Critical Strike Multiplier' },
  manaBastion: { flag: 'Energy Shield protects Mana instead of Life' },
  arrowWeave: { flag: 'Evade Projectiles more easily, Melee Attacks less easily' },
  cannotInflictEle: { flag: 'Cannot inflict Elemental Ailments' },
  cannotBeChilled: { flag: 'Cannot be Chilled' },
  cannotBeFrozen: { flag: 'Cannot be Frozen' },
  alwaysFreezeOnCrit: { flag: 'Always Freeze on Critical Strike' },
  removeIgnite: { flag: 'Removes Burning on use' },
  removeFreeze: { flag: 'Removes Freeze and Chill on use' },
  removeBleed: { flag: 'Removes Bleeding on use' },
};

export const CONDITION_TEXT: Record<string, string> = {
  onFullLife: 'while on Full Life',
  onLowLife: 'while on Low Life',
  killedRecently: 'if you have Killed Recently',
  critRecently: 'if you have Crit Recently',
  hitRecently: 'if you have Hit Recently',
  usedFlaskRecently: 'if you have used a Flask Recently',
  flaskActive: 'during Flask effect',
  dualWielding: 'while Dual Wielding',
  holdingShield: 'while holding a Shield',
  targetIgnited: 'against Ignited Enemies',
  targetShocked: 'against Shocked Enemies',
  targetChilled: 'against Chilled Enemies',
  targetFrozen: 'against Frozen Enemies',
  targetBleeding: 'against Bleeding Enemies',
  targetPoisoned: 'against Poisoned Enemies',
  targetStunned: 'against Stunned Enemies',
  targetRareOrUnique: 'against Rare or Unique Enemies',
  targetNearby: 'against nearby Enemies',
  stunnedRecently: 'if you have Stunned an Enemy Recently',
  overloadActive: 'after a recent Critical Strike',
  blockedRecently: 'if you have Blocked Recently',
  beenHitRecently: 'if you have been Hit Recently',
  leeching: 'while Leeching',
  esFull: 'while Energy Shield is full',
  targetLowLife: 'against Enemies on Low Life',
  onLowMana: 'while on Low Mana',
  targetCursed: 'against Hexed Enemies',
  cursed: 'while Hexed',
  stationary: 'while stationary',
  ignited: 'while Ignited',
  shocked: 'while Shocked',
  chilled: 'while Chilled',
  frozen: 'while Frozen',
  bleeding: 'while Bleeding',
  poisoned: 'while Poisoned',
  wieldingStaff: 'while wielding a Staff',
  wieldingBow: 'while wielding a Bow',
  wieldingSword: 'while wielding a Sword',
  wieldingAxe: 'while wielding an Axe',
  wieldingMace: 'while wielding a Mace',
  wieldingDagger: 'while wielding a Dagger',
  wieldingClaw: 'while wielding a Claw',
  wieldingWand: 'while wielding a Wand',
  wieldingSceptre: 'while wielding a Sceptre',
  wieldingTwoHand: 'while wielding a Two Handed Weapon',
  wieldingOneHand: 'while wielding a One Handed Weapon',
};

export const TAG_TEXT: Record<string, string> = {
  attack: 'with Attacks',
  spell: 'with Spells',
  melee: 'with Melee',
  projectile: 'with Projectiles',
  area: 'with Area Skills',
  dot: 'over Time',
  ignite: 'with Ignite',
  bleed: 'with Bleeding',
  poison: 'with Poison',
  sword: 'with Swords',
  axe: 'with Axes',
  mace: 'with Maces',
  sceptre: 'with Sceptres',
  dagger: 'with Daggers',
  claw: 'with Claws',
  wand: 'with Wands',
  staff: 'with Staves',
  bow: 'with Bows',
  twoHand: 'with Two Handed Weapons',
  oneHand: 'with One Handed Weapons',
  dualWield: 'while Dual Wielding',
  shield: 'while holding a Shield',
  unarmed: 'while Unarmed',
  hit: 'with Hits',
  strike: 'with Strike Skills',
  chaining: 'with Chaining Skills',
  aura: 'of Auras',
  fire: 'with Fire Skills',
  cold: 'with Cold Skills',
  lightning: 'with Lightning Skills',
};

export const PER_TEXT: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  int: 'Intelligence',
  level: 'Level',
};

// ---- Stats added by the depth expansion (EXPANSION 5.3) ---------------------------------------

const TYPE_LABEL: Record<string, string> = {
  physical: 'Physical',
  lightning: 'Lightning',
  cold: 'Cold',
  fire: 'Fire',
  chaos: 'Chaos',
};

Object.assign(STAT_TEXT, {
  chaosNotBypassEs: { flag: 'Chaos Damage does not bypass Energy Shield' },
  minDamage: { name: 'minimum Damage' },
  maxDamage: { name: 'maximum Damage' },
  instantLeechOnCrit: { flag: 'Leech from Critical Strikes is instant' },
  cannotBeLeechedFrom: { flag: 'Cannot be Leeched from' },
  immuneAilments: { flag: 'Immune to Ailments' },
  unaffectedByShock: { flag: 'Unaffected by Shock' },
  noElementalDamage: { flag: 'Deal no Elemental Damage' },
  noPhysicalDamage: { flag: 'Deal no Physical Damage' },
  spellIncAppliesToAttacks: {
    flag: 'Increases and reductions to Spell Damage also apply to Attacks',
  },
  'rule.noOtherRing': { flag: 'You cannot equip another Ring' },
  'rule.socketedGemsUseLife': {
    flag: 'Socketed Gems cost and reserve Life instead of Mana',
  },
  socketedReducedReservation: { base: '{v}% reduced Reservation of Socketed Gems' },
  manaOnHit: { base: 'Gain {v} Mana per Enemy Hit' },
  curseEffectOnSelf: { name: 'effect of Curses on you' },
  'ignite.extra': { base: 'You can inflict {v} additional Ignite on an enemy' },
  'ignite.speed': { name: 'speed at which Ignites deal their damage' },
  'flask.lifeToEs': {
    flag: 'On use, removes all but 1 Life; the removed Life returns as Energy Shield over 2 seconds',
  },
} satisfies Record<string, StatText>);

for (const t of ['lightning', 'cold', 'fire', 'chaos']) {
  const label = TYPE_LABEL[t];
  STAT_TEXT[`physTakenAs.${t}`] = {
    base: `{v}% of Physical Damage from Hits taken as ${label} Damage`,
  };
  STAT_TEXT[`immune.${t}`] = { flag: `Immune to ${label} Damage and its Ailments` };
  for (const [stat, ailment] of [
    ['canIgnite', 'Ignite'],
    ['canShock', 'Shock'],
    ['canChill', 'Chill'],
    ['canFreeze', 'Freeze'],
  ])
    STAT_TEXT[`${stat}.${t}`] = { flag: `Your ${label} Damage can ${ailment}` };
}
for (const t of ['physical', 'lightning', 'cold', 'fire', 'chaos'])
  STAT_TEXT[`damageTaken.${t}`] = { name: `${TYPE_LABEL[t]} Damage taken` };
Object.assign(STAT_TEXT, {
  curseEffect: { name: 'effect of your Hexes' },
  repeats: { base: 'Skill repeats {v} additional time' },
  trophyMods: {
    flag: 'When you kill a Rare monster, you gain its monster mods for 20 seconds',
  },
  hexLimit: { base: 'You can apply {v} additional Hex' },
} satisfies Record<string, StatText>);
for (const k of CHARGE_KINDS) {
  const name = CHARGE_NAMES[k];
  STAT_TEXT[`chargeDuration.${k}`] = { name: `${name} Charge Duration` };
  STAT_TEXT[`maxCharges.${k}`] = { base: `{v} to Maximum ${name} Charges` };
  STAT_TEXT[`chargeOn.kill.${k}`] = { base: `{v}% chance to gain a ${name} Charge on Kill` };
  STAT_TEXT[`chargeOn.block.${k}`] = {
    base: `{v}% chance to gain a ${name} Charge when you Block`,
  };
  STAT_TEXT[`chargeOn.crit.${k}`] = {
    base: `{v}% chance to gain a ${name} Charge on Critical Strike`,
  };
  STAT_TEXT[`chargeOn.hit.${k}`] = { base: `{v}% chance to gain a ${name} Charge on Hit` };
}
for (const id of ALL_HEX_IDS)
  STAT_TEXT[`hexOnHit.${id}`] = { base: `Hexes Enemies you Hit with level {v} ${HEXES[id].name}` };
for (const k of KEYSTONES) STAT_TEXT[`grantsKeystone.${k.id}`] = { flag: `Grants ${k.name}` };
for (const t of ['physical', 'lightning', 'cold', 'fire'])
  for (const a of ['canIgnite', 'canShock', 'canChill', 'canFreeze'])
    STAT_TEXT[`${a}.${t}`] ??= {
      flag: `Your ${TYPE_LABEL[t]} Damage can ${a.slice(3)}`,
    };

TAG_TEXT.unarmed = 'while Unarmed';
TAG_TEXT.attackSkill = 'from Attack Skills';
TAG_TEXT.triggered = 'with Triggered Skills';
TAG_TEXT.aura = 'with Auras';

// ---- Added by the coverage plan (C2): the buff layer, impale, culling and the new tags -------------

Object.assign(STAT_TEXT, {
  minionInstability: { flag: 'Minions burst when they fall to low life' },
  idleHands: { flag: 'You deal no damage with your own skills' },
  loneVow: { flag: 'Only your first aura is active, and it reserves nothing' },
  dotMulti: { base: '{v}% to the Damage over Time Multiplier' },
  'bleed.speed': { name: 'speed at which Bleeding deals its damage' },
  'poison.speed': { name: 'speed at which Poison deals its damage' },
  enemyPhysReduction: { base: 'Your Hits take {v}% off the Physical Damage Reduction of Enemies' },
  doubleDamage: { base: '{v}% chance to deal Double Damage' },
  shieldDefences: { name: 'Defences from your Shield' },
  shieldEs: { name: 'Energy Shield from your Shield' },
  minionPhysReduction: { base: 'Your Minions have {v}% additional Physical Damage Reduction' },
  minionBlock: { base: 'Your Minions have {v}% Chance to Block' },
  hitTaken: { name: 'damage taken from Hits' },
  manaRegenPct: { base: 'Regenerate {v}% of Mana per second' },
  'chance.impale': { name: 'chance to Impale Enemies on Hit', pct: true },
  impaleEffect: { name: 'Impale Effect' },
  impaleHits: { base: 'Impales last {v} additional Hits' },
  maxImpale: { base: '{v} to maximum Impales on an Enemy' },
  cullingStrike: { flag: 'Your Hits kill Enemies left at 10% Life or less' },
  maxRage: { base: '{v} to maximum Rage' },
  gemLevel: { base: '{v} to Level of all Skill Gems' },
  buffDuration: { name: 'Buff Duration' },
} satisfies Record<string, StatText>);
for (const id of BUFF_IDS) {
  const name = BUFFS[id].name;
  const on: Record<string, string> = {
    kill: 'on Kill',
    hit: 'on Hit',
    meleeHit: 'on Melee Hit',
    crit: 'on Critical Strike',
    block: 'when you Block',
    hitTaken: 'when you are Hit',
    flask: 'when you use a Flask',
  };
  for (const [event, phrase] of Object.entries(on))
    STAT_TEXT[`buffOn.${event}.${id}`] = { base: `{v}% chance to gain ${name} ${phrase}` };
}
// Statuses a skill inflicts on hit (docs/SPIRIT.md S3).
for (const id of STATUS_IDS) {
  const name = STATUSES[id].name;
  STAT_TEXT[`status.${id}.chance`] =
    id === 'overpowered'
      ? { base: `{v}% chance to inflict ${name} when a Hit is Blocked` }
      : { base: `{v}% chance to inflict ${name} on Hit` };
  STAT_TEXT[`status.${id}.seconds`] = { base: `${name} lasts {v} seconds` };
  STAT_TEXT[`status.${id}.v`] = { base: `${name} effect: {v}%` };
  STAT_TEXT[`status.${id}.x`] = { base: `${name} secondary effect: {v}%` };
}
// How projectiles go (docs/SPIRIT.md S4).
STAT_TEXT.projectilesSequential = {
  flag: 'Projectiles are fired one after another, and can each hit the same Enemy',
};
STAT_TEXT.projectilesShotgun = { flag: 'Projectiles can hit the same Enemy several times' };
STAT_TEXT.projectilesParallel = { flag: 'Projectiles are fired side by side' };
STAT_TEXT.arrowNova = { flag: 'Arrows land at the target and fly out from there in a ring' };
STAT_TEXT.tornadoShot = {
  flag: 'The Arrow flies to the target and scatters Arrows when it arrives',
};
STAT_TEXT.projectilesFork = { flag: 'Projectiles fork in two when they hit an Enemy' };
STAT_TEXT['status.exposure.chance'] = {
  base: '{v}% chance to Expose Enemies to the Element they took most Damage from on Hit',
};
STAT_TEXT['status.flee.chance'] = { base: '{v}% chance to cause Monsters to Flee on Hit' };
STAT_TEXT.statusDuration = { name: 'Duration of Statuses you inflict' };
STAT_TEXT.enemyBlockReduction = { base: 'Enemies have {v}% reduced Chance to Block your Hits' };

const RECOVER_POOL_TEXT: Record<string, string> = {
  life: 'Life',
  mana: 'Mana',
  es: 'Energy Shield',
};
for (const [event, phrase] of Object.entries({
  kill: 'on Kill',
  hit: 'on Hit',
  meleeHit: 'on Melee Hit',
  crit: 'on Critical Strike',
  block: 'when you Block',
  hitTaken: 'when you are Hit',
  flask: 'when you use a Flask',
}))
  for (const [pool, label] of Object.entries(RECOVER_POOL_TEXT)) {
    STAT_TEXT[`recover.${event}.${pool}`] = { base: `Gain {v} ${label} ${phrase}` };
    STAT_TEXT[`recoverPct.${event}.${pool}`] = {
      base: `Recover {v}% of maximum ${label} ${phrase}`,
    };
  }
for (const [event, phrase] of Object.entries({
  kill: 'on Kill',
  hit: 'on Hit',
  meleeHit: 'on Melee Hit',
  crit: 'on Critical Strike',
  block: 'when you Block',
  hitTaken: 'when you are Hit',
  flask: 'when you use a Flask',
}))
  STAT_TEXT[`rageOn.${event}`] = { base: `Gain {v} Rage ${phrase}` };

Object.assign(TAG_TEXT, {
  totem: 'with Totem Skills',
  trap: 'with Trap Skills',
  mine: 'with Mine Skills',
  brand: 'with Brand Skills',
  minion: 'of Minions',
  channelling: 'with Channelling Skills',
  duration: 'with Duration Skills',
  curse: 'with Curses',
  warcry: 'with Warcries',
  herald: 'with Heralds',
  guard: 'with Guard Skills',
  movement: 'with Movement Skills',
  nova: 'with Nova Skills',
  slam: 'with Slam Skills',
  physical: 'with Physical Skills',
  chaos: 'with Chaos Skills',
});
Object.assign(CONDITION_TEXT, {
  fortified: 'while Fortified',
  onslaught: 'while Quickened',
  unholyMight: 'while you have Dread Might',
  arcaneSurge: 'while you have Arcane Tide',
});

// ---- Added by C3: avoiding ailments, reflect, flat damage taken, dodge ------------------------------

for (const [id, label] of [
  ['ignite', 'Ignited'],
  ['shock', 'Shocked'],
  ['chill', 'Chilled'],
  ['freeze', 'Frozen'],
  ['bleed', 'Bled'],
  ['poison', 'Poisoned'],
] as const) {
  STAT_TEXT[`avoid.${id}`] = { base: `{v}% chance to Avoid being ${label}` };
  STAT_TEXT[`durationOnSelf.${id}`] = { name: `${label.replace(/ed$/, '')} Duration on you` };
}
for (const t of ['physical', 'lightning', 'cold', 'fire', 'chaos']) {
  STAT_TEXT[`flatTaken.attack.${t}`] = {
    base: `{v} ${TYPE_LABEL[t]} Damage taken from Attack Hits`,
  };
  STAT_TEXT[`reflect.${t}`] = { base: `Reflects {v} ${TYPE_LABEL[t]} Damage to Melee Attackers` };
}
Object.assign(STAT_TEXT, {
  reflectPhysPct: { base: '{v}% of Melee Physical Damage taken is reflected to the Attacker' },
  noMovingBleed: { flag: "Moving while Bleeding doesn't cause you to take extra Damage" },
  dodgeAttack: { base: '{v}% chance to Dodge Attack Hits' },
  dodgeSpell: { base: '{v}% chance to Dodge Spell Hits' },
} satisfies Record<string, StatText>);

Object.assign(STAT_TEXT, {
  leechRate: { name: 'Life and Mana Leeched per second' },
  instantLeechAlways: { flag: 'Leech from Hits is instant' },
  meleeRange: { base: '{v} to Melee Weapon and Unarmed range' },
  costFlat: { base: '{v} to Total Mana Cost of Skills' },
  flaskLifeRecovery: { name: 'Life Recovery from Flasks' },
  flaskManaRecovery: { name: 'Mana Recovery from Flasks' },
  flaskLifeRate: { name: 'Flask Life Recovery rate' },
  flaskManaRate: { name: 'Flask Mana Recovery rate' },
} satisfies Record<string, StatText>);

Object.assign(STAT_TEXT, {
  globalDefences: { name: 'Global Defences', pct: true },
  noChaosDamage: { flag: 'Deals no Chaos Damage' },
  minionDamage: { name: 'Damage of your Minions', pct: true },
  minionSpeed: { name: 'Minion Attack and Movement Speed', pct: true },
  minionLife: { name: 'Life of your Minions', pct: true },
  minionTaken: { name: 'Damage taken by your Minions', pct: true },
  minionRegen: { base: 'Your Minions mend {v}% of their Life each second' },
  minionCount: { base: '{v} additional Minions' },
  esOnHit: { base: 'Gain {v} Energy Shield per Enemy Hit' },
  skillDuration: { name: 'Skill Effect Duration', pct: true },
  deployCount: { base: '{v} additional totems, traps, mines or brands at a time' },
  auraBurn: { base: 'Burn nearby Enemies for {v}% of your Maximum Life as Fire Damage per second' },
  cooldownRecovery: { name: 'Cooldown Recovery Speed', pct: true },
  'dot.decay': { base: 'Hits inflict Decay: {v} Chaos Damage per second, for 8 seconds' },
  'perPoison.more': { base: '{v}% more Damage with Hits for each Poison on the Enemy' },
  'perPoison.max': { base: 'Up to {v} Poisons count' },
  'spread.ignite': { base: 'Ignites spread to Enemies within {v} metres' },
  'spread.ele': { base: 'Elemental Ailments spread to Enemies within {v} metres' },
  selfBurn: { base: 'Burn for {v}% of your Maximum Life per second (cannot kill you)' },
} satisfies Record<string, StatText>);

// Events added with the skill-scoped gains: a stun, the start of a spell.
const MORE_EVENTS: Record<string, string> = {
  use: 'when you use this Skill',
  killFrozen: 'when you Kill a Frozen Enemy',
  stun: 'when you Stun an Enemy',
  cast: 'when you Cast a Spell',
  meleeHit: 'on Melee Hit',
  hitTaken: 'when you are Hit',
};
for (const [event, phrase] of Object.entries(MORE_EVENTS)) {
  for (const id of BUFF_IDS)
    STAT_TEXT[`buffOn.${event}.${id}`] ??= {
      base: `{v}% chance to gain ${BUFFS[id].name} ${phrase}`,
    };
  STAT_TEXT[`rageOn.${event}`] ??= { base: `Gain {v} Rage ${phrase}` };
  for (const k of CHARGE_KINDS)
    STAT_TEXT[`chargeOn.${event}.${k}`] ??= {
      base: `{v}% chance to gain a ${CHARGE_NAMES[k]} Charge ${phrase}`,
    };
  for (const [pool, label] of Object.entries({ life: 'Life', mana: 'Mana', es: 'Energy Shield' })) {
    STAT_TEXT[`recover.${event}.${pool}`] ??= { base: `Gain {v} ${label} ${phrase}` };
    STAT_TEXT[`recoverPct.${event}.${pool}`] ??= {
      base: `Recover {v}% of maximum ${label} ${phrase}`,
    };
  }
}

// Item-granted skills and supports linked to every socketed gem (one stat per gem).
for (const g of [...ALL_GEMS, ...GRANTED_GEMS]) {
  if (g.kind === 'support')
    STAT_TEXT[`socketSupport.${g.id}`] = {
      base: `Socketed Gems are Supported by level {v} ${g.name}`,
    };
  else STAT_TEXT[`grantSkill.${g.id}`] = { base: `Grants Level {v} ${g.name} Skill` };
}
