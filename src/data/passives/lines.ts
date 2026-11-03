/**
 * The vocabulary of node lines (docs/tree/design/D-method.md). One function per line a node may carry; each builds the
 * engine's mods and says how many units it is worth, a unit being the small node of that stat. The unit values are the
 * reference's magnitudes as the previous tree already used them (docs/tree/design/C-brief.md §5: one value per stat).
 *
 * A line is added here first, with its stat checked against docs/tree/design/A2-vocabulary.md (the sheet shows it, the
 * fight obeys it). Nothing here is a node: the area files decide what a node carries.
 */
import { mod, type Condition, type DamageType, type Mod, type SkillTag } from '../../mods/types';
import { sustainMods } from '../sustain';
import type { Line } from './types';

/**
 * A line. Its mods go through the sustain pass (data/sustain.ts: flat life and mana grow, regeneration and the other
 * recovery that heals to full is cut, "while leeching" grows), and the label shows the number the node gives; the units
 * stay those of the written value.
 */
const line = (label: string, units: number, ...mods: Mod[]): Line => {
  const out = sustainMods(mods, 'tree');
  const i = mods.findIndex((m, j) => out[j] !== m);
  return {
    label: i < 0 ? label : label.replace(String(mods[i].value), String(out[i].value)),
    units,
    mods: out,
  };
};

/** A tagged line's tags as the words a node card shows before the stat ("two-handed melee", "brand"). */
const TAG_WORDS: Partial<Record<SkillTag, string>> = {
  oneHand: 'one-handed',
  twoHand: 'two-handed',
  channelling: 'channelling',
};
const tagWords = (tags?: SkillTag[]): string =>
  tags ? tags.map((t) => TAG_WORDS[t] ?? t).join(' ') + ' ' : '';

/**
 * Names a line function and records, on every line it makes, which function and arguments made it (`Line.spec`), so the
 * tree editor can show and change a node's lines in this vocabulary and a patch can be folded back into an area file.
 */
const def =
  <A extends unknown[]>(fn: string, f: (...args: A) => Line) =>
  (...args: A): Line => ({ ...f(...args), spec: { fn, args } });

// ---- Attributes (the road nodes and the signature notables) ----
// A point of an attribute is worth about a fifteenth of a small node in direct stats (+0.5 life or +2 accuracy); the gear it unlocks is the rest.
export const str = def('str', (v: number): Line =>
  line(`+${v} strength`, v / 15, mod('str', 'base', v)),
);
export const dex = def('dex', (v: number): Line =>
  line(`+${v} dexterity`, v / 15, mod('dex', 'base', v)),
);
export const int = def('int', (v: number): Line =>
  line(`+${v} intelligence`, v / 15, mod('int', 'base', v)),
);
export const allAttr = def('allAttr', (v: number): Line =>
  line(`+${v} all attributes`, v / 4, mod('allAttr', 'base', v)),
);

// ---- Defence ----
export const UNIT = {
  life: 5,
  es: 5,
  mana: 8,
  armour: 12,
  evasion: 10,
  resAll: 4,
  resOne: 10,
  lifeRegen: 0.4,
  manaRegen: 10,
  stunThreshold: 8,
  moveSpeed: 4,
  attackSpeed: 5,
  castSpeed: 4,
  accuracy: 10,
  critChance: 15,
  critMulti: 12,
  aoe: 8,
  stunDuration: 15,
  enemyStunThreshold: 8,
  gritDuration: 15,
  warcryDuration: 15,
  totemDamage: 12,
  melee: 8,
  meleePhys: 10,
  mace: 14,
  axe: 12,
  twoHand: 12,
  leechLife: 0.4,
} as const;

export const life = def('life', (v: number): Line =>
  line(`${v}% life`, v / UNIT.life, mod('life', 'inc', v)),
);
export const armour = def('armour', (v: number): Line =>
  line(`${v}% armour`, v / UNIT.armour, mod('armour', 'inc', v)),
);
export const evasion = def('evasion', (v: number): Line =>
  line(`${v}% evasion`, v / UNIT.evasion, mod('evasion', 'inc', v)),
);
export const es = def('es', (v: number): Line =>
  line(`${v}% energy shield`, v / UNIT.es, mod('es', 'inc', v)),
);
export const mana = def('mana', (v: number): Line =>
  line(`${v}% mana`, v / UNIT.mana, mod('mana', 'inc', v)),
);
export const resAll = def('resAll', (v: number): Line =>
  line(`+${v}% all resistances`, v / UNIT.resAll, mod('resist.allEle', 'base', v)),
);
export const resOne = def('resOne', (t: 'fire' | 'cold' | 'lightning' | 'chaos', v: number): Line =>
  line(`+${v}% ${t} resistance`, v / UNIT.resOne, mod(`resist.${t}`, 'base', v)),
);
export const maxResAll = def('maxResAll', (v: number): Line =>
  line(`+${v}% maximum resistances`, v * 2, mod('maxResist.allEle', 'base', v)),
);
export const lifeRegen = def('lifeRegen', (v: number): Line =>
  line(`${v}% life regenerated`, v / UNIT.lifeRegen, mod('lifeRegenPct', 'base', v)),
);
export const manaRegen = def('manaRegen', (v: number): Line =>
  line(`${v}% mana regeneration`, v / UNIT.manaRegen, mod('manaRegen', 'inc', v)),
);
export const physReduction = def('physReduction', (v: number): Line =>
  line(`${v}% physical damage reduction`, v, mod('physReduction', 'base', v)),
);
export const stunThreshold = def('stunThreshold', (v: number): Line =>
  line(`${v}% stun threshold`, v / UNIT.stunThreshold, mod('stunThreshold', 'inc', v)),
);
export const stunAvoid = def('stunAvoid', (v: number): Line =>
  line(`${v}% avoid stun`, v / 20, mod('stunAvoid', 'base', v)),
);
export const moveSpeed = def('moveSpeed', (v: number): Line =>
  line(`${v}% movement speed`, v / UNIT.moveSpeed, mod('moveSpeed', 'inc', v)),
);
export const blockAttack = def('blockAttack', (v: number, cond?: Condition): Line =>
  line(
    `+${v}% block${cond ? ' (' + cond.id + ')' : ''}`,
    v / 2,
    mod('blockAttack', 'base', v, cond ? { condition: cond } : undefined),
  ),
);

// ---- Offence, generic ----
export const attackSpeed = def('attackSpeed', (v: number, tags?: SkillTag[]): Line =>
  line(
    `${v}% ${tagWords(tags)}attack speed`,
    v / UNIT.attackSpeed,
    mod('attackSpeed', 'inc', v, tags ? { tags } : undefined),
  ),
);
export const castSpeed = def('castSpeed', (v: number): Line =>
  line(`${v}% cast speed`, v / UNIT.castSpeed, mod('castSpeed', 'inc', v)),
);
export const accuracy = def('accuracy', (v: number): Line =>
  line(`${v}% accuracy`, v / UNIT.accuracy, mod('accuracy', 'inc', v)),
);
export const accuracyFlat = def('accuracyFlat', (v: number): Line =>
  line(`+${v} accuracy`, v / 20, mod('accuracy', 'base', v)),
);
export const critChance = def('critChance', (v: number, tags?: SkillTag[]): Line =>
  line(
    `${v}% ${tagWords(tags)}crit chance`,
    v / UNIT.critChance,
    mod('critChance', 'inc', v, tags ? { tags } : undefined),
  ),
);
export const critMulti = def('critMulti', (v: number, tags?: SkillTag[]): Line =>
  line(
    `+${v}% ${tagWords(tags)}crit multiplier`,
    v / UNIT.critMulti,
    mod('critMulti', 'base', v, tags ? { tags } : undefined),
  ),
);
export const aoe = def('aoe', (v: number, tags?: SkillTag[]): Line =>
  line(
    `${v}% ${tagWords(tags)}area`,
    v / UNIT.aoe,
    mod('aoe', 'inc', v, tags ? { tags } : undefined),
  ),
);
export const damage = def(
  'damage',
  (
    v: number,
    opts: {
      tags?: SkillTag[];
      types?: DamageType[];
      condition?: Condition;
      unit: number;
      label: string;
    },
  ): Line =>
    line(
      opts.label,
      v / opts.unit,
      mod('damage', 'inc', v, {
        tags: opts.tags,
        damageTypes: opts.types,
        condition: opts.condition,
      }),
    ),
);

// ---- Melee and weapons ----
export const meleeDamage = def('meleeDamage', (v: number): Line =>
  damage(v, { tags: ['melee'], unit: UNIT.melee, label: `${v}% melee damage` }),
);
export const meleePhys = def('meleePhys', (v: number): Line =>
  damage(v, {
    tags: ['melee'],
    types: ['physical'],
    unit: UNIT.meleePhys,
    label: `${v}% melee physical damage`,
  }),
);
export const meleeArea = def('meleeArea', (v: number): Line =>
  damage(v, { tags: ['melee', 'area'], unit: UNIT.melee, label: `${v}% melee area damage` }),
);
/** A weapon line reaches the weapon's hits and, as the previous tree did, the ailments its attacks inflict (A2 §1 finding c). */
function weaponLine(
  label: string,
  v: number,
  unit: number,
  tags: SkillTag[],
  cond: Condition['id'],
  types?: DamageType[],
): Line {
  return line(
    label,
    v / unit,
    mod('damage', 'inc', v, { tags, damageTypes: types }),
    mod('damage', 'inc', v, { tags: ['dot', 'attackSkill'], condition: { id: cond } }),
  );
}
export const maceDamage = def('maceDamage', (v: number): Line => ({
  label: `${v}% mace and sceptre damage`,
  units: v / UNIT.mace,
  mods: [
    ...weaponLine('', v, 1, ['mace'], 'wieldingMace', ['physical']).mods,
    ...weaponLine('', v, 1, ['sceptre'], 'wieldingSceptre', ['physical']).mods,
  ],
}));
export const axeDamage = def('axeDamage', (v: number): Line =>
  weaponLine(`${v}% axe damage`, v, UNIT.axe, ['axe'], 'wieldingAxe', ['physical']),
);
export const twoHandDamage = def('twoHandDamage', (v: number): Line =>
  weaponLine(
    `${v}% two-handed melee damage`,
    v,
    UNIT.twoHand,
    ['twoHand', 'melee'],
    'wieldingTwoHand',
    ['physical'],
  ),
);
export const swordDamage = def('swordDamage', (v: number): Line =>
  weaponLine(`${v}% sword damage`, v, 10, ['sword'], 'wieldingSword'),
);

// ---- Stun ----
export const stunDuration = def('stunDuration', (v: number): Line =>
  line(`${v}% stun duration`, v / UNIT.stunDuration, mod('stunDuration', 'inc', v)),
);
export const enemyStunThreshold = def('enemyStunThreshold', (v: number): Line =>
  line(
    `${v}% reduced enemy stun threshold`,
    v / UNIT.enemyStunThreshold,
    mod('enemyStunThreshold', 'base', v),
  ),
);
export const stunDamage = def('stunDamage', (v: number): Line =>
  line(`${v}% stun damage`, v / 15, mod('stunDamage', 'inc', v)),
);
export const knockback = def('knockback', (v: number): Line =>
  line(`knockback ${v}`, v * 2, mod('knockback', 'base', v)),
);

// ---- Charges, warcries, totems ----
export const gritDuration = def('gritDuration', (v: number): Line =>
  line(`${v}% grit charge duration`, v / UNIT.gritDuration, mod('chargeDuration.grit', 'inc', v)),
);
export const maxGrit = def('maxGrit', (v: number): Line =>
  line(`+${v} maximum grit charges`, v * 3, mod('maxCharges.grit', 'base', v)),
);
export const gritOnHitTaken = def('gritOnHitTaken', (v: number): Line =>
  line(`${v}% grit charge when hit`, v / 10, mod('chargeOn.hitTaken.grit', 'base', v)),
);
export const lifeRegenPerGrit = def('lifeRegenPerGrit', (v: number): Line =>
  line(
    `${v}% life regenerated per grit charge`,
    (v * 3) / UNIT.lifeRegen,
    mod('lifeRegenPct', 'base', v, { per: { stat: 'charges.grit', div: 1 } }),
  ),
);
export const warcryDuration = def('warcryDuration', (v: number): Line =>
  line(
    `${v}% warcry duration`,
    v / UNIT.warcryDuration,
    mod('skillDuration', 'inc', v, { tags: ['warcry'] }),
  ),
);
export const warcryEffect = def('warcryEffect', (v: number): Line =>
  line(`${v}% warcry buff effect`, v / 10, mod('warcryEffect', 'inc', v)),
);
export const totemDamage = def('totemDamage', (v: number): Line =>
  damage(v, { tags: ['totem'], unit: UNIT.totemDamage, label: `${v}% totem damage` }),
);
/** A totem skill's use time is both its placing and its firing, so speed with totems is the totem's own attack rate: priced like attack speed. */
export const totemSpeed = def('totemSpeed', (v: number): Line =>
  line(
    `${v}% totem attack and cast speed`,
    v / 3.5,
    mod('attackSpeed', 'inc', v, { tags: ['totem'] }),
    mod('castSpeed', 'inc', v, { tags: ['totem'] }),
  ),
);
export const totemDuration = def('totemDuration', (v: number): Line =>
  line(`${v}% totem duration`, v / 15, mod('skillDuration', 'inc', v, { tags: ['totem'] })),
);

// ---- Recovery ----
export const leechLife = def('leechLife', (v: number, tags?: SkillTag[]): Line =>
  line(
    `${v}% ${tagWords(tags)}replenish`,
    v / UNIT.leechLife,
    mod('leech.life', 'base', v, tags ? { tags } : undefined),
  ),
);
export const lifeOnHit = def('lifeOnHit', (v: number, tags?: SkillTag[]): Line =>
  line(
    `+${v} life on ${tagWords(tags)}hit`,
    v / 4,
    mod('lifeOnHit', 'base', v, tags ? { tags } : undefined),
  ),
);
export const lifeOnKill = def('lifeOnKill', (v: number): Line =>
  line(`+${v} life on kill`, v / 10, mod('lifeOnKill', 'base', v)),
);

// ---- Flags that keystones use (their mods come from src/data/tree/keystones.ts) ----
export const flag = def('flag', (stat: string, label: string): Line =>
  line(label, 0, mod(stat, 'flag', 1)),
);

// ---- The Yard's lines: one-handers, dual wield, shields, bleed, leech, fervour charges ----
const DUAL: Condition = { id: 'dualWielding' };
const SHIELD: Condition = { id: 'holdingShield' };
export const oneHandMelee = def('oneHandMelee', (v: number): Line =>
  damage(v, { tags: ['oneHand', 'melee'], unit: 10, label: `${v}% one-handed melee damage` }),
);
/** Dual-wield damage reaches the hits and, as weapon lines do, the ailments the attacks inflict. */
export const dualDamage = def('dualDamage', (v: number): Line =>
  line(
    `${v}% attack damage while dual wielding`,
    v / 10,
    mod('damage', 'inc', v, { tags: ['attack'], condition: DUAL }),
    mod('damage', 'inc', v, { tags: ['dot', 'attackSkill'], condition: DUAL }),
  ),
);
export const dualSpeed = def('dualSpeed', (v: number): Line =>
  line(
    `${v}% attack speed while dual wielding`,
    v / UNIT.attackSpeed,
    mod('attackSpeed', 'inc', v, { condition: DUAL }),
  ),
);
export const dualBlock = def('dualBlock', (v: number): Line =>
  line(
    `+${v}% block while dual wielding`,
    v / 2,
    mod('blockAttack', 'base', v, { condition: DUAL }),
  ),
);
export const shieldBlock = def('shieldBlock', (v: number): Line =>
  line(`+${v}% block with a shield`, v / 2, mod('blockAttack', 'base', v, { condition: SHIELD })),
);
export const shieldSpellBlock = def('shieldSpellBlock', (v: number): Line =>
  line(
    `+${v}% spell block with a shield`,
    v / 2,
    mod('blockSpell', 'base', v, { condition: SHIELD }),
  ),
);
export const shieldDef = def('shieldDef', (v: number): Line =>
  line(`${v}% defences from your shield`, v / 15, mod('shieldDefences', 'inc', v)),
);
export const lifeOnBlock = def('lifeOnBlock', (v: number): Line =>
  line(`+${v} life on block`, v / 15, mod('lifeOnBlock', 'base', v)),
);
export const shieldStunAvoid = def('shieldStunAvoid', (v: number): Line =>
  line(
    `${v}% avoid stun with a shield`,
    v / 20,
    mod('stunAvoid', 'base', v, { condition: SHIELD }),
  ),
);
export const bleedChance = def('bleedChance', (v: number): Line =>
  line(
    `${v}% chance to bleed with attacks`,
    v / 10,
    mod('chance.bleed', 'base', v, { tags: ['attack'] }),
  ),
);
export const bleedDamage = def('bleedDamage', (v: number): Line =>
  line(`${v}% bleed damage`, v / 12, mod('damage', 'inc', v, { tags: ['bleed'] })),
);
export const bleedFaster = def('bleedFaster', (v: number): Line =>
  line(`bleeds ${v}% faster`, v / 10, mod('bleed.speed', 'inc', v)),
);
export const leechRate = def('leechRate', (v: number): Line =>
  line(`${v}% leech rate`, v / 10, mod('leechRate', 'inc', v)),
);
export const fervourDuration = def('fervourDuration', (v: number): Line =>
  line(`${v}% fervour charge duration`, v / 15, mod('chargeDuration.fervour', 'inc', v)),
);
export const maxFervour = def('maxFervour', (v: number): Line =>
  line(`+${v} maximum fervour charges`, v * 3, mod('maxCharges.fervour', 'base', v)),
);
export const fervourOnKill = def('fervourOnKill', (v: number): Line =>
  line(`${v}% fervour charge on kill`, v / 10, mod('chargeOn.kill.fervour', 'base', v)),
);

// ---- Elements on attacks (the Bow's and the Yard's "elemental damage with attacks" clusters, C-brief §11) ----
export const eleAttack = def('eleAttack', (v: number): Line =>
  damage(v, {
    tags: ['attack'],
    types: ['fire', 'cold', 'lightning'],
    unit: 10,
    label: `${v}% elemental damage with attacks`,
  }),
);
export const eleAttackOne = def(
  'eleAttackOne',
  (t: 'fire' | 'cold' | 'lightning', v: number): Line =>
    damage(v, { tags: ['attack'], types: [t], unit: 12, label: `${v}% ${t} damage with attacks` }),
);

// ---- The Bow's lines: projectiles, bows, physical attacks ----
/** Damage of every kind, attacks, spells and damage over time alike: the start line of a class that serves attackers and casters (the reference's dual-class starts open on it). Priced above a single kind's line. */
export const allDamage = def('allDamage', (v: number): Line =>
  damage(v, { unit: 12, label: `${v}% damage` }),
);
/** Attack damage of any kind: the generic attacker's line, for the home of a class whose skills are bows, blades and thrown steel alike. */
export const attackDamage = def('attackDamage', (v: number): Line =>
  damage(v, { tags: ['attack'], unit: 10, label: `${v}% attack damage` }),
);
/** Projectile attacks: bows and thrown weapons, not spell projectiles (tags are a subset test, so both must be on the skill). */
export const projectileAttack = def('projectileAttack', (v: number): Line =>
  damage(v, { tags: ['projectile', 'attack'], unit: 10, label: `${v}% projectile attack damage` }),
);
/** Penetration of all three elements at once: priced like one element's and a half, since an attack is usually one element. */
export const elePenetration = def('elePenetration', (v: number): Line =>
  line(
    `elemental penetration ${v}%`,
    v / 1.5,
    mod('penetration', 'base', v, { damageTypes: ['fire', 'cold', 'lightning'] }),
  ),
);
export const projectileDamage = def('projectileDamage', (v: number): Line =>
  damage(v, { tags: ['projectile'], unit: 10, label: `${v}% projectile damage` }),
);
export const projectileSpeed = def('projectileSpeed', (v: number): Line =>
  line(`${v}% projectile speed`, v / 10, mod('projectileSpeed', 'inc', v)),
);
/** An extra projectile: hand-valued at four units (a fifth to a whole skill's damage, by the skill). */
export const extraProjectile = def('extraProjectile', (v: number): Line =>
  line(`+${v} projectile`, v * 4, mod('projectiles', 'base', v)),
);
export const bowDamage = def('bowDamage', (v: number): Line =>
  weaponLine(`${v}% bow damage`, v, 10, ['bow'], 'wieldingBow'),
);
export const bowSpeed = def('bowSpeed', (v: number): Line =>
  line(
    `${v}% bow attack speed`,
    v / UNIT.attackSpeed,
    mod('attackSpeed', 'inc', v, { tags: ['bow'] }),
  ),
);
export const physAttack = def('physAttack', (v: number): Line =>
  damage(v, {
    tags: ['attack'],
    types: ['physical'],
    unit: 10,
    label: `${v}% physical attack damage`,
  }),
);

// ---- The Spire's lines: spells, elements, energy shield and mana, wands, insight charges ----
const WAND: Condition = { id: 'wieldingWand' };
export const spellDamage = def('spellDamage', (v: number): Line =>
  damage(v, { tags: ['spell'], unit: 8, label: `${v}% spell damage` }),
);
export const wandSpellDamage = def('wandSpellDamage', (v: number): Line =>
  damage(v, { tags: ['spell'], condition: WAND, unit: 8, label: `${v}% spell damage with a wand` }),
);
export const wandCastSpeed = def('wandCastSpeed', (v: number): Line =>
  line(`${v}% cast speed with a wand`, v / 4, mod('castSpeed', 'inc', v, { condition: WAND })),
);
const DAGGER: Condition = { id: 'wieldingDagger' };
export const daggerSpellDamage = def('daggerSpellDamage', (v: number): Line =>
  damage(v, {
    tags: ['spell'],
    condition: DAGGER,
    unit: 8,
    label: `${v}% spell damage with a dagger`,
  }),
);
const STAFF: Condition = { id: 'wieldingStaff' };
/** Spell damage while wielding a staff: the staff caster's line, apart from the staff attacker's `staffDamage`. */
export const staffSpellDamage = def('staffSpellDamage', (v: number): Line =>
  damage(v, {
    tags: ['spell'],
    condition: STAFF,
    unit: 8,
    label: `${v}% spell damage with a staff`,
  }),
);
export const daggerSpellCrit = def('daggerSpellCrit', (v: number): Line =>
  line(
    `${v}% spell crit chance with a dagger`,
    v / 15,
    mod('critChance', 'inc', v, { tags: ['spell'], condition: DAGGER }),
  ),
);
export const channelDamage = def('channelDamage', (v: number): Line =>
  damage(v, { tags: ['channelling'], unit: 10, label: `${v}% damage with channelling skills` }),
);
export const spellCrit = def('spellCrit', (v: number): Line =>
  line(`${v}% spell crit chance`, v / 15, mod('critChance', 'inc', v, { tags: ['spell'] })),
);
export const spellArea = def('spellArea', (v: number): Line =>
  line(`${v}% spell area`, v / 8, mod('aoe', 'inc', v, { tags: ['spell'] })),
);
export const spellAreaDamage = def('spellAreaDamage', (v: number): Line =>
  damage(v, { tags: ['spell', 'area'], unit: 8, label: `${v}% spell area damage` }),
);
export const spellProjectile = def('spellProjectile', (v: number): Line =>
  damage(v, { tags: ['spell', 'projectile'], unit: 10, label: `${v}% spell projectile damage` }),
);
export const esRecharge = def('esRecharge', (v: number): Line =>
  line(`${v}% energy shield recharge rate`, v / 15, mod('esRechargeRate', 'inc', v)),
);
export const esRechargeDelay = def('esRechargeDelay', (v: number): Line =>
  line(`${v}% faster start of recharge`, v / 10, mod('esRechargeDelay', 'inc', v)),
);
export const costReduction = def('costReduction', (v: number): Line =>
  line(`${v}% reduced mana cost`, v / 4, mod('cost', 'inc', -v)),
);
export const eleDamage = def('eleDamage', (t: DamageType, v: number): Line =>
  damage(v, { types: [t], unit: 10, label: `${v}% ${t} damage` }),
);
export const eleDamageAll = def('eleDamageAll', (v: number): Line =>
  damage(v, { types: ['fire', 'cold', 'lightning'], unit: 10, label: `${v}% elemental damage` }),
);
/** Penetration is dear: two units a percent, as a notable's line. */
export const penetration = def('penetration', (t: 'fire' | 'cold' | 'lightning', v: number): Line =>
  line(`${t} penetration ${v}%`, v / 2, mod('penetration', 'base', v, { damageTypes: [t] })),
);
export const igniteChance = def('igniteChance', (v: number): Line =>
  line(`${v}% chance to ignite`, v / 10, mod('chance.ignite', 'base', v)),
);
export const burnDamage = def('burnDamage', (v: number): Line =>
  damage(v, { tags: ['dot'], types: ['fire'], unit: 12, label: `${v}% burning damage` }),
);
export const igniteFaster = def('igniteFaster', (v: number): Line =>
  line(`ignites ${v}% faster`, v / 10, mod('ignite.speed', 'inc', v)),
);
export const shockEffect = def('shockEffect', (v: number): Line =>
  line(`${v}% effect of shock`, v / 10, mod('effect.shock', 'inc', v)),
);
export const shockChance = def('shockChance', (v: number): Line =>
  line(`${v}% chance to shock`, v / 10, mod('chance.shock', 'base', v)),
);
export const chillEffect = def('chillEffect', (v: number): Line =>
  line(`${v}% effect of chill`, v / 10, mod('effect.chill', 'inc', v)),
);
export const freezeChance = def('freezeChance', (v: number): Line =>
  line(`${v}% chance to freeze`, v / 8, mod('chance.freeze', 'base', v)),
);
export const coldDot = def('coldDot', (v: number): Line =>
  line(
    `+${v}% cold damage over time multiplier`,
    v / 6,
    mod('dotMulti', 'base', v, { damageTypes: ['cold'] }),
  ),
);
export const maxInsight = def('maxInsight', (v: number): Line =>
  line(`+${v} maximum insight charges`, v * 3, mod('maxCharges.insight', 'base', v)),
);
export const insightDuration = def('insightDuration', (v: number): Line =>
  line(`${v}% insight charge duration`, v / 15, mod('chargeDuration.insight', 'inc', v)),
);
export const insightOnCrit = def('insightOnCrit', (v: number): Line =>
  line(`${v}% insight charge on crit`, v / 10, mod('chargeOn.crit.insight', 'base', v)),
);

// ---- The wider palette (2026-10-19, after the user's review: "a far smaller vocabulary of node types than the reference").
// Every stat here is one the engine already reads (A2 §1); the units are the reference's small-node magnitudes.

// Recovery and pools
export const lifeFlat = def('lifeFlat', (v: number): Line =>
  line(`+${v} maximum life`, v / 20, mod('life', 'base', v)),
);
export const manaFlat = def('manaFlat', (v: number): Line =>
  line(`+${v} maximum mana`, v / 20, mod('mana', 'base', v)),
);
export const esFlat = def('esFlat', (v: number): Line =>
  line(`+${v} maximum energy shield`, v / 15, mod('es', 'base', v)),
);
export const manaLeech = def('manaLeech', (v: number, tags?: SkillTag[]): Line =>
  line(`${v}% mana leech`, v / 0.4, mod('leech.mana', 'base', v, tags ? { tags } : undefined)),
);
export const esLeech = def('esLeech', (v: number): Line =>
  line(`${v}% energy shield leech`, v / 0.4, mod('leech.es', 'base', v)),
);
export const manaOnHit = def('manaOnHit', (v: number, tags?: SkillTag[]): Line =>
  line(`+${v} mana on hit`, v / 4, mod('manaOnHit', 'base', v, tags ? { tags } : undefined)),
);
export const manaOnKill = def('manaOnKill', (v: number): Line =>
  line(`+${v} mana on kill`, v / 10, mod('manaOnKill', 'base', v)),
);
export const esOnHit = def('esOnHit', (v: number, tags?: SkillTag[]): Line =>
  line(`+${v} energy shield on hit`, v / 4, mod('esOnHit', 'base', v, tags ? { tags } : undefined)),
);
export const manaOnBlock = def('manaOnBlock', (v: number): Line =>
  line(`+${v} mana on block`, v / 8, mod('manaOnBlock', 'base', v)),
);
export const reducedReservation = def('reducedReservation', (v: number): Line =>
  line(`${v}% reduced mana reservation`, v / 3, mod('reducedReservation', 'base', v)),
);
export const auraEffect = def('auraEffect', (v: number): Line =>
  line(`${v}% aura effect`, v / 6, mod('auraEffect', 'inc', v)),
);

// Poison and chaos
export const poisonChance = def('poisonChance', (v: number): Line =>
  line(
    `${v}% chance to poison with attacks`,
    v / 10,
    mod('chance.poison', 'base', v, { tags: ['attack'] }),
  ),
);
export const poisonDamage = def('poisonDamage', (v: number): Line =>
  line(`${v}% poison damage`, v / 12, mod('damage', 'inc', v, { tags: ['poison'] })),
);
export const poisonFaster = def('poisonFaster', (v: number): Line =>
  line(`poisons ${v}% faster`, v / 10, mod('poison.speed', 'inc', v)),
);
export const poisonDuration = def('poisonDuration', (v: number): Line =>
  line(`${v}% poison duration`, v / 15, mod('duration.poison', 'inc', v)),
);
export const chaosAttack = def('chaosAttack', (v: number): Line =>
  damage(v, {
    tags: ['attack'],
    types: ['chaos'],
    unit: 12,
    label: `${v}% chaos damage with attacks`,
  }),
);
export const chaosSpell = def('chaosSpell', (v: number): Line =>
  damage(v, {
    tags: ['spell'],
    types: ['chaos'],
    unit: 12,
    label: `${v}% chaos damage with spells`,
  }),
);
export const physSpell = def('physSpell', (v: number): Line =>
  damage(v, {
    tags: ['spell'],
    types: ['physical'],
    unit: 12,
    label: `${v}% physical damage with spells`,
  }),
);
export const chaosDot = def('chaosDot', (v: number): Line =>
  line(
    `+${v}% chaos damage over time multiplier`,
    v / 6,
    mod('dotMulti', 'base', v, { damageTypes: ['chaos'] }),
  ),
);
export const dotDamage = def('dotDamage', (v: number): Line =>
  damage(v, { tags: ['dot'], unit: 10, label: `${v}% damage over time` }),
);

// Ailments
export const bleedDuration = def('bleedDuration', (v: number): Line =>
  line(`${v}% bleed duration`, v / 15, mod('duration.bleed', 'inc', v)),
);
export const igniteDuration = def('igniteDuration', (v: number): Line =>
  line(`${v}% ignite duration`, v / 15, mod('duration.ignite', 'inc', v)),
);
export const shockDuration = def('shockDuration', (v: number): Line =>
  line(`${v}% shock duration`, v / 15, mod('duration.shock', 'inc', v)),
);
export const freezeDuration = def('freezeDuration', (v: number): Line =>
  line(`${v}% freeze duration`, v / 15, mod('duration.freeze', 'inc', v)),
);
export const ailmentEffect = def('ailmentEffect', (v: number): Line =>
  line(`${v}% effect of non-damaging ailments`, v / 10, mod('ailmentEffect', 'inc', v)),
);
export const avoidAilments = def('avoidAilments', (v: number): Line =>
  line(`${v}% chance to avoid elemental ailments`, v / 10, mod('avoid.elemental', 'base', v)),
);

// Weapons: damage, crit, speed and crit multiplier by weapon kind
export type Weapon =
  'sword' | 'axe' | 'mace' | 'sceptre' | 'dagger' | 'claw' | 'wand' | 'staff' | 'bow';
const WIELD: Record<Weapon, Condition['id']> = {
  sword: 'wieldingSword',
  axe: 'wieldingAxe',
  mace: 'wieldingMace',
  sceptre: 'wieldingSceptre',
  dagger: 'wieldingDagger',
  claw: 'wieldingClaw',
  wand: 'wieldingWand',
  staff: 'wieldingStaff',
  bow: 'wieldingBow',
};
export const daggerDamage = def('daggerDamage', (v: number): Line =>
  weaponLine(`${v}% dagger damage`, v, 10, ['dagger'], 'wieldingDagger'),
);
export const clawDamage = def('clawDamage', (v: number): Line =>
  weaponLine(`${v}% claw damage`, v, 10, ['claw'], 'wieldingClaw'),
);
export const staffDamage = def('staffDamage', (v: number): Line =>
  weaponLine(`${v}% staff damage`, v, 12, ['staff'], 'wieldingStaff'),
);
export const wandAttack = def('wandAttack', (v: number): Line =>
  weaponLine(`${v}% wand attack damage`, v, 12, ['wand'], 'wieldingWand'),
);
/** Any weapon's damage, by name: the editor's one line for all of them. */
export const weaponDamage = def('weaponDamage', (w: Weapon, v: number): Line =>
  weaponLine(`${v}% ${w} damage`, v, 10, [w], WIELD[w]),
);
export const weaponCrit = def('weaponCrit', (w: Weapon, v: number): Line =>
  line(
    `${v}% crit chance with ${w}s`,
    v / UNIT.critChance,
    mod('critChance', 'inc', v, { tags: [w] }),
  ),
);
export const weaponCritMulti = def('weaponCritMulti', (w: Weapon, v: number): Line =>
  line(`+${v}% crit multiplier with ${w}s`, v / 12, mod('critMulti', 'base', v, { tags: [w] })),
);
export const weaponSpeed = def('weaponSpeed', (w: Weapon, v: number): Line =>
  line(
    `${v}% attack speed with ${w}s`,
    v / UNIT.attackSpeed,
    mod('attackSpeed', 'inc', v, { tags: [w] }),
  ),
);
export const weaponAccuracy = def('weaponAccuracy', (w: Weapon, v: number): Line =>
  line(`${v}% accuracy with ${w}s`, v / 10, mod('accuracy', 'inc', v, { tags: [w] })),
);

// Shields, dual wield, block and dodge
export const shieldAttack = def('shieldAttack', (v: number): Line =>
  line(
    `${v}% attack damage with a shield`,
    v / 10,
    mod('damage', 'inc', v, { tags: ['attack'], condition: SHIELD }),
  ),
);
export const shieldSpeed = def('shieldSpeed', (v: number): Line =>
  line(
    `${v}% attack speed with a shield`,
    v / UNIT.attackSpeed,
    mod('attackSpeed', 'inc', v, { condition: SHIELD }),
  ),
);
export const dualCrit = def('dualCrit', (v: number): Line =>
  line(
    `${v}% crit chance while dual wielding`,
    v / UNIT.critChance,
    mod('critChance', 'inc', v, { condition: DUAL }),
  ),
);
export const dualAccuracy = def('dualAccuracy', (v: number): Line =>
  line(
    `${v}% accuracy while dual wielding`,
    v / 10,
    mod('accuracy', 'inc', v, { condition: DUAL }),
  ),
);
export const spellBlock = def('spellBlock', (v: number): Line =>
  line(`+${v}% spell block`, v / 2, mod('blockSpell', 'base', v)),
);
/** Spell block while wielding a staff: the staff's answer to a shield's `shieldSpellBlock`. */
export const staffSpellBlock = def('staffSpellBlock', (v: number): Line =>
  line(
    `+${v}% spell block with a staff`,
    v / 2,
    mod('blockSpell', 'base', v, { condition: { id: 'wieldingStaff' } }),
  ),
);
export const blockRecovery = def('blockRecovery', (v: number): Line =>
  line(`${v}% block recovery`, v / 20, mod('blockRecovery', 'inc', v)),
);
export const dodgeAttack = def('dodgeAttack', (v: number): Line =>
  line(`${v}% chance to dodge attacks`, v / 3, mod('dodgeAttack', 'base', v)),
);
export const dodgeSpell = def('dodgeSpell', (v: number): Line =>
  line(`${v}% chance to dodge spells`, v / 3, mod('dodgeSpell', 'base', v)),
);

// Defence
export const globalDefences = def('globalDefences', (v: number): Line =>
  line(`${v}% global defences`, v / 8, mod('globalDefences', 'inc', v)),
);
export const stunRecovery = def('stunRecovery', (v: number): Line =>
  line(`${v}% reduced stun duration on you`, v / 15, mod('stunDurationOnSelf', 'base', v)),
);
export const maxResOne = def(
  'maxResOne',
  (t: 'fire' | 'cold' | 'lightning' | 'chaos', v: number): Line =>
    line(`+${v}% maximum ${t} resistance`, v * 1.5, mod(`maxResist.${t}`, 'base', v)),
);
export const armourFlat = def('armourFlat', (v: number): Line =>
  line(`+${v} armour`, v / 60, mod('armour', 'base', v)),
);
export const evasionFlat = def('evasionFlat', (v: number): Line =>
  line(`+${v} evasion`, v / 60, mod('evasion', 'base', v)),
);

// Offence, the rarer lines
export const pierce = def('pierce', (v: number): Line =>
  line(`projectiles pierce ${v} more`, v * 3, mod('pierce', 'base', v)),
);
export const chain = def('chain', (v: number): Line =>
  line(`chain ${v} more`, v * 4, mod('chains', 'base', v)),
);
export const doubleDamage = def('doubleDamage', (v: number): Line =>
  line(`${v}% chance to deal double damage`, v / 5, mod('doubleDamage', 'base', v)),
);
export const cullingStrike = def('cullingStrike', (): Line =>
  line('culling strike', 3, mod('cullingStrike', 'flag', 1)),
);
export const meleeRange = def('meleeRange', (v: number): Line =>
  line(`+${v} melee range`, v * 2, mod('meleeRange', 'base', v)),
);
export const areaDamage = def('areaDamage', (v: number): Line =>
  damage(v, { tags: ['area'], unit: 10, label: `${v}% area damage` }),
);
export const spellCritMulti = def('spellCritMulti', (v: number): Line =>
  line(`+${v}% spell crit multiplier`, v / 12, mod('critMulti', 'base', v, { tags: ['spell'] })),
);
export const damageVsLowLife = def('damageVsLowLife', (v: number): Line =>
  line(
    `${v}% damage against enemies on low life`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'targetLowLife' } }),
  ),
);
export const damageVsBleeding = def('damageVsBleeding', (v: number): Line =>
  line(
    `${v}% damage against bleeding enemies`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'targetBleeding' } }),
  ),
);
export const damageVsPoisoned = def('damageVsPoisoned', (v: number): Line =>
  line(
    `${v}% damage against poisoned enemies`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'targetPoisoned' } }),
  ),
);
export const damageVsChilled = def('damageVsChilled', (v: number): Line =>
  line(
    `${v}% damage against chilled enemies`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'targetChilled' } }),
  ),
);
export const damageVsShocked = def('damageVsShocked', (v: number): Line =>
  line(
    `${v}% damage against shocked enemies`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'targetShocked' } }),
  ),
);
export const damageVsCursed = def('damageVsCursed', (v: number): Line =>
  line(
    `${v}% damage against cursed enemies`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'targetCursed' } }),
  ),
);
export const damageOnFullLife = def('damageOnFullLife', (v: number): Line =>
  line(
    `${v}% damage while on full life`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'onFullLife' } }),
  ),
);
export const damageOnLowLife = def('damageOnLowLife', (v: number): Line =>
  line(
    `${v}% damage while on low life`,
    v / 6,
    mod('damage', 'inc', v, { condition: { id: 'onLowLife' } }),
  ),
);
export const attackSpeedOnKill = def('attackSpeedOnKill', (v: number): Line =>
  line(
    `${v}% attack speed if you killed recently`,
    // Conditional, so a third cheaper than plain attack speed.
    v / ((UNIT.attackSpeed * 4) / 3),
    mod('attackSpeed', 'inc', v, { condition: { id: 'killedRecently' } }),
  ),
);
// ---- Rule benders of the attrition rework (docs/tree/design/R-knife.md): each a condition or a count the fight already
// tracks (src/sim/combat.ts), priced a third to a half cheaper than the plain line for being conditional.
export const damageOnKill = def('damageOnKill', (v: number): Line =>
  line(
    `${v}% damage if you killed recently`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'killedRecently' } }),
  ),
);
export const critVsFullLife = def('critVsFullLife', (v: number): Line =>
  line(
    `${v}% crit chance against enemies on full life`,
    v / (UNIT.critChance * 2),
    mod('critChance', 'inc', v, { condition: { id: 'targetFullLife' } }),
  ),
);
export const critWhileEsFull = def('critWhileEsFull', (v: number): Line =>
  line(
    `${v}% crit chance while energy shield is full`,
    v / (UNIT.critChance * 1.5),
    mod('critChance', 'inc', v, { condition: { id: 'esFull' } }),
  ),
);
export const speedWhileLeeching = def('speedWhileLeeching', (v: number): Line =>
  line(
    `${v}% attack and cast speed while replenishing`,
    v / ((UNIT.attackSpeed * 3) / 2),
    mod('attackSpeed', 'inc', v, { condition: { id: 'leeching' } }),
    mod('castSpeed', 'inc', v, { condition: { id: 'leeching' } }),
  ),
);
export const damageVsRare = def('damageVsRare', (v: number): Line =>
  line(
    `${v}% damage against rare and unique enemies`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'targetRareOrUnique' } }),
  ),
);
export const castSpeedOnLowMana = def('castSpeedOnLowMana', (v: number): Line =>
  line(
    `${v}% cast speed while on low mana`,
    v / 8,
    mod('castSpeed', 'inc', v, { condition: { id: 'onLowMana' } }),
  ),
);
/** One more trap (or mine) out at a time: the count deployables are placed by (src/calc/skill.ts `deployCount`). */
export const trapLimit = def('trapLimit', (v: number): Line =>
  line(`+${v} trap out at a time`, v * 4, mod('deployCount', 'base', v, { tags: ['trap'] })),
);
export const mineLimit = def('mineLimit', (v: number): Line =>
  line(`+${v} mine out at a time`, v * 4, mod('deployCount', 'base', v, { tags: ['mine'] })),
);
// The Spire's rule benders (docs/tree/design/R-spire-notables.md): conditions the fight tracks (src/sim/combat.ts), and
// maximum mana read as a `per` stat (src/calc/character.ts statValue 'maxMana').
export const damageWhileEsFull = def('damageWhileEsFull', (v: number): Line =>
  line(
    `${v}% damage while energy shield is full`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'esFull' } }),
  ),
);
export const damageVsIgnited = def('damageVsIgnited', (v: number): Line =>
  line(
    `${v}% damage against ignited enemies`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'targetIgnited' } }),
  ),
);
export const critVsShocked = def('critVsShocked', (v: number): Line =>
  line(
    `${v}% crit chance against shocked enemies`,
    v / (UNIT.critChance * 1.5),
    mod('critChance', 'inc', v, { condition: { id: 'targetShocked' } }),
  ),
);
export const castSpeedOnCrit = def('castSpeedOnCrit', (v: number): Line =>
  line(
    `${v}% cast speed if you crit recently`,
    v / 6,
    mod('castSpeed', 'inc', v, { condition: { id: 'critRecently' } }),
  ),
);
export const damageStationary = def('damageStationary', (v: number): Line =>
  line(
    `${v}% damage while standing still`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'stationary' } }),
  ),
);
export const spellAreaOnKill = def('spellAreaOnKill', (v: number): Line =>
  line(
    `${v}% spell area if you killed recently`,
    v / 12,
    mod('aoe', 'inc', v, { tags: ['spell'], condition: { id: 'killedRecently' } }),
  ),
);
export const spellDamageWhileLeechingEs = def('spellDamageWhileLeechingEs', (v: number): Line =>
  line(
    `${v}% spell damage while leeching energy shield`,
    v / 12,
    mod('damage', 'inc', v, { tags: ['spell'], condition: { id: 'leechingEs' } }),
  ),
);
/** Spell damage per 100 maximum mana, at most `max` times (the reference's mana-scaled spell notable). */
export const spellDamagePerMana = def('spellDamagePerMana', (v: number, max: number): Line =>
  line(
    `${v}% spell damage per 100 maximum mana, up to ${v * max}%`,
    (v * Math.min(max, 6)) / 8,
    mod('damage', 'inc', v, { tags: ['spell'], per: { stat: 'maxMana', div: 100, max } }),
  ),
);
/** The Spire's spell minions: minion damage per 100 maximum mana (the joins pass: their hook, apart from the Cathedral's). */
export const minionDamagePerMana = def('minionDamagePerMana', (v: number, max: number): Line =>
  line(
    `${v}% minion damage per 100 maximum mana, up to ${v * max}%`,
    (v * Math.min(max, 6)) / 12,
    mod('minionDamage', 'inc', v, { per: { stat: 'maxMana', div: 100, max } }),
  ),
);
/** Extra energy shield of v per 100 maximum mana (v% of maximum mana, counted in hundreds). */
export const manaAsEs = def('manaAsEs', (v: number): Line =>
  line(
    `gain ${v}% of maximum mana as extra energy shield`,
    v / 2,
    mod('es', 'base', v, { per: { stat: 'maxMana', div: 100 } }),
  ),
);
/** Auras reserve life instead of mana (src/calc/character.ts, the aura loop): the low-life build's notable. */
export const auraReserveLife = def('auraReserveLife', (): Line =>
  line('Auras reserve life instead of mana', 4, mod('auraReserveLife', 'flag', 1)),
);
/** Energy shield starts recharging at once on a kill (src/sim/combat.ts `killActor`). */
export const esRechargeOnKill = def('esRechargeOnKill', (): Line =>
  line('Energy shield starts recharging when you kill', 3, mod('esRechargeOnKill', 'flag', 1)),
);
/** A share of a pool's maximum recovered on an event (src/data/buffs.ts `recoverPctStat`, src/sim/buffs.ts). */
export const recoverOn = def(
  'recoverOn',
  (
    event: 'kill' | 'killIgnited' | 'crit' | 'hitTaken' | 'evade' | 'blink' | 'block',
    pool: 'life' | 'mana' | 'es',
    v: number,
  ): Line =>
    line(
      `recover ${v}% of ${pool === 'es' ? 'energy shield' : pool} ${{ kill: 'on kill', killIgnited: 'when you kill an ignited enemy', crit: 'on crit', hitTaken: 'when hit', evade: 'when you evade an attack', blink: 'when you blink', block: 'when you block' }[event]}`,
      v * (event === 'kill' || event === 'killIgnited' ? 0.8 : 1.2),
      mod(`recoverPct.${event}.${pool}`, 'base', v),
    ),
);
/** A chance to gain Arcane Tide (the arcaneSurge buff: more spell damage, cast speed, mana) on an event. */
export const arcaneTideOn = def(
  'arcaneTideOn',
  (event: 'flask' | 'crit' | 'kill', v: number): Line =>
    line(
      `${v === 100 ? 'gain' : `${v}% chance to gain`} Arcane Tide ${{ flask: 'when you use a flask', crit: 'on crit', kill: 'on kill' }[event]}`,
      (v / 100) * (event === 'flask' ? 2 : 4),
      mod(`buffOn.${event}.arcaneSurge`, 'base', v),
    ),
);
/** Chilled enemies deal less damage to you (src/sim/combat.ts, before a hit lands; at most 50%). */
export const chilledLessDamage = def('chilledLessDamage', (v: number): Line =>
  line(`chilled enemies deal ${v}% less damage to you`, v / 2, mod('chilledLessDamage', 'base', v)),
);
/** The two-element rule: fire hits harder against the chilled, cold against the ignited. */
export const crossElement = def('crossElement', (v: number): Line => ({
  label: `${v}% fire damage against chilled enemies; ${v}% cold damage against ignited enemies`,
  units: v / 8,
  mods: [
    mod('damage', 'inc', v, { damageTypes: ['fire'], condition: { id: 'targetChilled' } }),
    mod('damage', 'inc', v, { damageTypes: ['cold'], condition: { id: 'targetIgnited' } }),
  ],
}));
export const spellDamageWhenHit = def('spellDamageWhenHit', (v: number): Line =>
  line(
    `${v}% spell damage if you were hit recently`,
    v / 12,
    mod('damage', 'inc', v, { tags: ['spell'], condition: { id: 'beenHitRecently' } }),
  ),
);
export const critMultiVsFrozen = def('critMultiVsFrozen', (v: number): Line =>
  line(
    `+${v}% crit multiplier against frozen enemies`,
    v / (UNIT.critMulti * 1.5),
    mod('critMulti', 'base', v, { condition: { id: 'targetFrozen' } }),
  ),
);
export const wandPhysAsLightning = def('wandPhysAsLightning', (v: number): Line =>
  line(
    `gain ${v}% of wand physical damage as extra lightning`,
    v / 4,
    mod('gain.physical.lightning', 'base', v, { tags: ['wand'] }),
  ),
);
export const wandChain = def('wandChain', (v: number): Line =>
  line(
    `wand attacks chain ${v} more`,
    v * 3,
    mod('chains', 'base', v, { tags: ['attack', 'wand'] }),
  ),
);
export const spellExtraProjectile = def('spellExtraProjectile', (v: number): Line =>
  line(`+${v} projectile with spells`, v * 3, mod('projectiles', 'base', v, { tags: ['spell'] })),
);
// The Bow's rule benders (docs/tree/design/R-bow-notables.md).
/** Projectile attacks hit harder the farther they fly (src/calc/skill.ts `distanceMult`): a fifth less point blank. */
export const farShot = def('farShot', (v: number): Line =>
  line(
    `projectile attacks deal up to ${v}% more damage far away, 20% less up close`,
    v / 8,
    mod('farShot', 'base', v),
  ),
);
export const evasionWhileMoving = def('evasionWhileMoving', (v: number): Line =>
  line(
    `${v}% evasion while moving`,
    v / ((UNIT.evasion * 4) / 3),
    mod('evasion', 'inc', v, { condition: { id: 'stationary', not: true } }),
  ),
);
/** Attack damage per 200 accuracy (the calc's `accuracy` per stat), at most `max` times. */
export const attackDamagePerAccuracy = def(
  'attackDamagePerAccuracy',
  (v: number, max: number): Line =>
    line(
      `${v}% attack damage per 200 accuracy, up to ${v * max}%`,
      (v * Math.min(max, 8)) / 10,
      mod('damage', 'inc', v, { tags: ['attack'], per: { stat: 'accuracy', div: 200, max } }),
    ),
);
/** A chance to gain Quickened (the onslaught buff: attack, cast and movement speed) on an event. */
export const quickenedOn = def('quickenedOn', (event: 'kill' | 'crit' | 'blink', v: number): Line =>
  line(
    `${v === 100 ? 'gain' : `${v}% chance to gain`} Quickened ${{ kill: 'on kill', crit: 'on crit', blink: 'when you blink' }[event]}`,
    (v / 100) * 6,
    mod(`buffOn.${event}.onslaught`, 'base', v),
  ),
);
/** A chance to gain Elusive (dodge, fading) on an event. */
export const elusiveOn = def(
  'elusiveOn',
  (event: 'kill' | 'crit' | 'evade' | 'blink', v: number): Line =>
    line(
      `${v === 100 ? 'gain' : `${v}% chance to gain`} Elusive ${{ kill: 'on kill', crit: 'on crit', evade: 'when you evade an attack', blink: 'when you blink', block: 'when you block' }[event]}`,
      (v / 100) * 8,
      mod(`buffOn.${event}.elusive`, 'base', v),
    ),
);
export const trapGainCold = def('trapGainCold', (v: number): Line =>
  line(
    `traps gain ${v}% of physical damage as extra cold`,
    v / 5,
    mod('gain.physical.cold', 'base', v, { tags: ['trap'] }),
  ),
);
export const attackPhysToCold = def('attackPhysToCold', (v: number): Line =>
  line(
    `${v}% of physical attack damage converted to cold`,
    v / 10,
    mod('convert.physical.cold', 'base', v, { tags: ['attack'] }),
  ),
);
export const lifeRegenWhenHit = def('lifeRegenWhenHit', (v: number): Line =>
  line(
    `${v}% life regenerated if you were hit recently`,
    v / ((UNIT.lifeRegen * 3) / 2),
    mod('lifeRegenPct', 'base', v, { condition: { id: 'beenHitRecently' } }),
  ),
);
/**
 * Flask charges on kill: under attrition a kill gives charges only from this (src/sim/combat.ts `killGains`, 100 is a
 * charge to every flask), so the text says the flat gain, as items do (src/mods/text.ts).
 */
export const flaskCharges = def('flaskCharges', (v: number): Line =>
  line(`+${v / 100} flask charges per kill`, v / 8, mod('flaskCharges', 'inc', v)),
);
/** Flask charges on kill for each charge of a kind held (docs/tree/design/F-flasks.md); priced at three charges held. */
export const flaskChargesPerCharge = def(
  'flaskChargesPerCharge',
  (charge: 'grit' | 'fervour' | 'insight', v: number): Line =>
    line(
      `+${v / 100} flask charges per kill for each ${charge} charge`,
      (v * 3) / 8,
      mod('flaskCharges', 'inc', v, { per: { stat: `charges.${charge}`, div: 1 } }),
    ),
);
/**
 * Flask charges for an enemy killed by an ailment: the killing blow must be its damage, not a hit on a burning enemy
 * (src/sim/combat.ts `dotKind`; docs/tree/design/F-flasks.md). Harder to arrange than any kill, so priced lower.
 */
export const flaskChargesKilledBy = def(
  'flaskChargesKilledBy',
  (by: 'ignite' | 'bleed' | 'poison', v: number): Line =>
    line(
      `+${v / 100} flask charges when an enemy is killed by ${{ ignite: 'burning', bleed: 'bleeding', poison: 'poison' }[by]}`,
      v / 12,
      mod(`flaskChargesKilledBy.${by}`, 'base', v),
    ),
);
export const flaskChargesUsed = def('flaskChargesUsed', (v: number): Line =>
  line(`${v}% reduced flask charges used`, v / 4, mod('flaskChargesUsed', 'base', v)),
);
export const attackSpeedWhileMoving = def('attackSpeedWhileMoving', (v: number): Line =>
  line(
    `${v}% attack speed while moving`,
    v / ((UNIT.attackSpeed * 4) / 3),
    mod('attackSpeed', 'inc', v, { condition: { id: 'stationary', not: true } }),
  ),
);
export const critWhileStationary = def('critWhileStationary', (v: number): Line =>
  line(
    `${v}% crit chance while standing still`,
    v / ((UNIT.critChance * 4) / 3),
    mod('critChance', 'inc', v, { condition: { id: 'stationary' } }),
  ),
);
export const damageWhileQuickened = def('damageWhileQuickened', (v: number): Line =>
  line(
    `${v}% damage while Quickened`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'onslaught' } }),
  ),
);
export const critMultiWhileElusive = def('critMultiWhileElusive', (v: number): Line =>
  line(
    `+${v}% crit multiplier while Elusive`,
    v / (UNIT.critMulti * 1.5),
    mod('critMulti', 'base', v, { condition: { id: 'elusive' } }),
  ),
);
export const fervourOnCrit = def('fervourOnCrit', (v: number): Line =>
  line(
    `${v}% chance to gain a fervour charge on crit`,
    v / 6,
    mod('chargeOn.crit.fervour', 'base', v),
  ),
);
/** Attack speed per fervour charge held (the calc's charges.fervour per stat). */
export const attackSpeedPerFervour = def('attackSpeedPerFervour', (v: number): Line =>
  line(
    `${v}% attack speed per fervour charge`,
    v * 0.9,
    mod('attackSpeed', 'inc', v, { per: { stat: 'charges.fervour', div: 1 } }),
  ),
);
export const buffDuration = def('buffDuration', (v: number): Line =>
  line(`${v}% buff duration`, v / 8, mod('buffDuration', 'inc', v)),
);
// The Yard's rule benders (docs/tree/design/R-yard.md): conditions and stats the fight already reads.
/** A block while dual wielding may give Quickened (event gains are asked under the conditions that hold, src/sim/buffs.ts). */
export const quickenedOnDualBlock = def('quickenedOnDualBlock', (v: number): Line =>
  line(
    `${v}% chance to gain Quickened when you block while dual wielding`,
    (v / 100) * 5,
    mod('buffOn.block.onslaught', 'base', v, { condition: { id: 'dualWielding' } }),
  ),
);
export const damageAfterBlock = def('damageAfterBlock', (v: number): Line =>
  line(
    `${v}% damage if you blocked recently`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'blockedRecently' } }),
  ),
);
export const damageVsStunned = def('damageVsStunned', (v: number): Line =>
  line(
    `${v}% damage against stunned enemies`,
    v / 8,
    mod('damage', 'inc', v, { condition: { id: 'targetStunned' } }),
  ),
);
export const damageWhileLeeching = def('damageWhileLeeching', (v: number): Line =>
  line(
    `${v}% damage while replenishing`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'leeching' } }),
  ),
);
export const fortifyOnMeleeHit = def('fortifyOnMeleeHit', (v: number): Line =>
  line(
    `${v}% chance to gain Fortified on melee hit`,
    (v / 100) * 8,
    mod('buffOn.meleeHit.fortify', 'base', v),
  ),
);
/** Fortified earned in the duel: when you stun an enemy (the `stun` event, src/sim/buffs.ts). */
export const fortifyOnStun = def('fortifyOnStun', (v: number): Line =>
  line(
    `${v}% chance to gain Fortified when you stun an enemy`,
    (v / 100) * 4,
    mod('buffOn.stun.fortify', 'base', v),
  ),
);
export const fervourOnBlock = def('fervourOnBlock', (v: number): Line =>
  line(
    `${v}% chance to gain a fervour charge when you block`,
    v / 8,
    mod('chargeOn.block.fervour', 'base', v),
  ),
);
/** Damage per fervour charge held, while dual wielding (the calc's charges.fervour per stat). */
export const dualDamagePerFervour = def('dualDamagePerFervour', (v: number): Line =>
  line(
    `${v}% damage per fervour charge while dual wielding`,
    v * 0.8,
    mod('damage', 'inc', v, {
      condition: { id: 'dualWielding' },
      per: { stat: 'charges.fervour', div: 1 },
    }),
  ),
);
export const critVsBleeding = def('critVsBleeding', (v: number): Line =>
  line(
    `${v}% crit chance against bleeding enemies`,
    v / (UNIT.critChance * 1.5),
    mod('critChance', 'inc', v, { condition: { id: 'targetBleeding' } }),
  ),
);
export const critVsStunned = def('critVsStunned', (v: number): Line =>
  line(
    `${v}% crit chance against stunned enemies`,
    v / (UNIT.critChance * 1.5),
    mod('critChance', 'inc', v, { condition: { id: 'targetStunned' } }),
  ),
);
export const meleeAreaOnKill = def('meleeAreaOnKill', (v: number): Line =>
  line(
    `${v}% melee area if you killed recently`,
    v / 12,
    mod('aoe', 'inc', v, { tags: ['melee'], condition: { id: 'killedRecently' } }),
  ),
);
export const damageWhileFortified = def('damageWhileFortified', (v: number): Line =>
  line(
    `${v}% damage while Fortified`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'fortified' } }),
  ),
);
export const impaleChance = def('impaleChance', (v: number): Line =>
  line(
    `${v}% chance to impale with attacks`,
    v / 6,
    mod('chance.impale', 'base', v, { tags: ['attack'] }),
  ),
);
export const impaleEffect = def('impaleEffect', (v: number): Line =>
  line(`${v}% impale effect`, v / 8, mod('impaleEffect', 'inc', v)),
);
export const maxImpaleLine = def('maxImpaleLine', (v: number): Line =>
  line(`+${v} impale on an enemy at a time`, v * 4, mod('maxImpale', 'base', v)),
);
/** A share of armour meets elemental hits before the resistance does (src/sim/combat.ts, as The Mountain's Hide). */
export const armourVsEle = def('armourVsEle', (v: number): Line =>
  line(`${v}% of armour also applies to elemental hits`, v / 4, mod('armourVsEle', 'base', v)),
);
export const meleeGainFire = def('meleeGainFire', (v: number): Line =>
  line(
    `melee attacks gain ${v}% of physical damage as extra fire`,
    v / 4,
    mod('gain.physical.fire', 'base', v, { tags: ['melee'] }),
  ),
);
// The Wall's rule benders (docs/tree/design/R-wall.md): grit gained on events the fight rolls charges for (block, stun),
// grit as a per stat, totems on the deploy count, strikes on the calc's extra targets.
export const gritOnStun = def('gritOnStun', (v: number): Line =>
  line(
    `${v}% chance to gain a grit charge when you stun an enemy`,
    v / 8,
    mod('chargeOn.stun.grit', 'base', v),
  ),
);
export const gritOnBlock = def('gritOnBlock', (v: number): Line =>
  line(
    `${v}% chance to gain a grit charge when you block`,
    v / 8,
    mod('chargeOn.block.grit', 'base', v),
  ),
);
export const gritOnKill = def('gritOnKill', (v: number): Line =>
  line(`${v}% chance to gain a grit charge on kill`, v / 8, mod('chargeOn.kill.grit', 'base', v)),
);
/** A warcry may give grit (the `warcry` charge event, rolled when a warcry is used: src/sim/utility.ts). */
export const gritOnWarcry = def('gritOnWarcry', (v: number): Line =>
  line(
    `${v}% chance to gain a grit charge when you use a warcry`,
    v / 12,
    mod('chargeOn.warcry.grit', 'base', v),
  ),
);
/** Mace hits may give grit (charges are rolled under the fight's conditions: wielding a mace). */
export const gritOnMaceHit = def('gritOnMaceHit', (v: number): Line =>
  line(
    `${v}% chance to gain a grit charge on melee hit with a mace`,
    v / 2,
    mod('chargeOn.meleeHit.grit', 'base', v, { condition: { id: 'wieldingMace' } }),
  ),
);
/** Block chance per grit charge while holding a shield. */
export const blockPerGrit = def('blockPerGrit', (v: number): Line =>
  line(
    `+${v}% block per grit charge while holding a shield`,
    v * 3,
    mod('blockAttack', 'base', v, {
      condition: { id: 'holdingShield' },
      per: { stat: 'charges.grit', div: 1 },
    }),
  ),
);
/** Melee physical damage per 10 strength, at most `max` times. */
export const meleePerStr = def('meleePerStr', (v: number, max: number): Line =>
  line(
    `${v}% melee physical damage per 10 strength, up to ${v * max}%`,
    (v * Math.min(max, 25)) / 10,
    mod('damage', 'inc', v, {
      tags: ['melee'],
      damageTypes: ['physical'],
      per: { stat: 'str', div: 10, max },
    }),
  ),
);
/** Two-handed attack speed per grit charge held: grit spent as momentum. */
export const twoHandSpeedPerGrit = def('twoHandSpeedPerGrit', (v: number): Line =>
  line(
    `${v}% two-handed attack speed per grit charge`,
    v * 0.9,
    mod('attackSpeed', 'inc', v, {
      tags: ['twoHand', 'melee'],
      per: { stat: 'charges.grit', div: 1 },
    }),
  ),
);
export const damagePerGrit = def('damagePerGrit', (v: number): Line =>
  line(
    `${v}% melee damage per grit charge`,
    v * 0.8,
    mod('damage', 'inc', v, { tags: ['melee'], per: { stat: 'charges.grit', div: 1 } }),
  ),
);
export const armourWhileStationary = def('armourWhileStationary', (v: number): Line =>
  line(
    `${v}% armour while standing still`,
    v / ((UNIT.armour * 4) / 3),
    mod('armour', 'inc', v, { condition: { id: 'stationary' } }),
  ),
);
export const stunAvoidStationary = def('stunAvoidStationary', (v: number): Line =>
  line(
    `${v}% avoid stun while standing still`,
    v / 25,
    mod('stunAvoid', 'base', v, { condition: { id: 'stationary' } }),
  ),
);
/** One more totem out at a time: the deploy count totems are placed by (src/calc/skill.ts `deployCount`). */
export const totemLimit = def('totemLimit', (v: number): Line =>
  line(`+${v} totem out at a time`, v * 4, mod('deployCount', 'base', v, { tags: ['totem'] })),
);
/** Strike skills hit one more nearby enemy (the calc's `extraTargets`). */
export const strikeTargets = def('strikeTargets', (v: number): Line =>
  line(
    `strike skills hit ${v} more nearby enemy`,
    v * 3.5,
    mod('extraTargets', 'base', v, { tags: ['strike'] }),
  ),
);
export const critOnFullLife = def('critOnFullLife', (v: number): Line =>
  line(
    `${v}% crit chance while on full life`,
    // Conditional, so a quarter cheaper than plain crit chance.
    v / ((UNIT.critChance * 5) / 4),
    mod('critChance', 'inc', v, { condition: { id: 'onFullLife' } }),
  ),
);

// Curses, minions, deployables, cooldowns, durations, flasks
export const curseEffect = def('curseEffect', (v: number): Line =>
  line(`${v}% curse effect`, v / 8, mod('curseEffect', 'inc', v)),
);
export const hexLimit = def('hexLimit', (v: number): Line =>
  line(`+${v} curse at a time`, v * 5, mod('hexLimit', 'base', v)),
);
export const curseArea = def('curseArea', (v: number): Line =>
  line(`${v}% curse area`, v / 10, mod('aoe', 'inc', v, { tags: ['curse'] })),
);
export const minionDamage = def('minionDamage', (v: number): Line =>
  line(`${v}% minion damage`, v / 12, mod('minionDamage', 'inc', v)),
);
export const minionLife = def('minionLife', (v: number): Line =>
  line(`${v}% minion life`, v / 12, mod('minionLife', 'inc', v)),
);
export const minionSpeed = def('minionSpeed', (v: number): Line =>
  line(`${v}% minion speed`, v / 5, mod('minionSpeed', 'inc', v)),
);
export const trapDamage = def('trapDamage', (v: number): Line =>
  damage(v, { tags: ['trap'], unit: 12, label: `${v}% trap damage` }),
);
export const mineDamage = def('mineDamage', (v: number): Line =>
  damage(v, { tags: ['mine'], unit: 12, label: `${v}% mine damage` }),
);
export const brandDamage = def('brandDamage', (v: number): Line =>
  damage(v, { tags: ['brand'], unit: 12, label: `${v}% brand damage` }),
);
export const trapSpeed = def('trapSpeed', (v: number): Line =>
  line(
    `${v}% trap throwing speed`,
    v / 4,
    mod('castSpeed', 'inc', v, { tags: ['trap'] }),
    mod('attackSpeed', 'inc', v, { tags: ['trap'] }),
  ),
);
export const mineSpeed = def('mineSpeed', (v: number): Line =>
  line(
    `${v}% mine throwing speed`,
    v / 4,
    mod('castSpeed', 'inc', v, { tags: ['mine'] }),
    mod('attackSpeed', 'inc', v, { tags: ['mine'] }),
  ),
);
export const cooldownRecovery = def('cooldownRecovery', (v: number): Line =>
  line(`${v}% cooldown recovery`, v / 10, mod('cooldownRecovery', 'inc', v)),
);
export const skillDuration = def('skillDuration', (v: number): Line =>
  line(`${v}% skill effect duration`, v / 10, mod('skillDuration', 'inc', v)),
);
export const flaskEffect = def('flaskEffect', (v: number): Line =>
  line(`${v}% flask effect`, v / 5, mod('flaskEffect', 'inc', v)),
);
export const flaskRecovery = def('flaskRecovery', (v: number): Line =>
  line(`${v}% flask recovery`, v / 10, mod('flaskRecovery', 'inc', v)),
);
export const flaskDuration = def('flaskDuration', (v: number): Line =>
  line(`${v}% flask duration`, v / 10, mod('flaskDuration', 'inc', v)),
);
// The flask-lines pass (docs/tree/design/F-flasks.md): life flasks first, mana second, and the two emergency flasks.
export const flaskLifeRecovery = def('flaskLifeRecovery', (v: number): Line =>
  line(`${v}% increased life recovery from flasks`, v / 12, mod('flaskLifeRecovery', 'inc', v)),
);
export const flaskManaRecovery = def('flaskManaRecovery', (v: number): Line =>
  line(`${v}% increased mana recovery from flasks`, v / 15, mod('flaskManaRecovery', 'inc', v)),
);
export const flaskLifeRate = def('flaskLifeRate', (v: number): Line =>
  line(`${v}% faster life flask recovery`, v / 10, mod('flaskLifeRate', 'inc', v)),
);
export const flaskMaxCharges = def('flaskMaxCharges', (v: number): Line =>
  line(`${v}% increased maximum flask charges`, v / 6, mod('flaskMaxCharges', 'inc', v)),
);
/** The flask in the belt's last slot (it drinks at 15% life) recovers more: one way to keep an emergency flask (src/sim/flaskDrink.ts). */
export const flaskLastSlotRecovery = def('flaskLastSlotRecovery', (v: number): Line =>
  line(
    `${v}% increased life recovered by the flask in your last belt slot`,
    v / 15,
    mod('flaskLastSlotRecovery', 'inc', v),
  ),
);
/** A life flask drunk below 30% life recovers more: the other way to keep emergency flasks (src/sim/flaskDrink.ts). */
export const flaskLowLifeRecovery = def('flaskLowLifeRecovery', (v: number): Line =>
  line(
    `${v}% increased life recovered by flasks drunk below 30% life`,
    v / 12,
    mod('flaskLowLifeRecovery', 'inc', v),
  ),
);
// The Cathedral's rule benders (docs/tree/design/R-cathedral.md): what the Zealot plants works for it (minions standing,
// one more brand, auras held), faith turned to fire and lightning, a defence while channelling.
export const minionRegen = def('minionRegen', (v: number): Line =>
  line(`minions regenerate ${v}% of their life per second`, v / 0.5, mod('minionRegen', 'base', v)),
);
export const minionRes = def('minionRes', (v: number): Line =>
  line(`minions have +${v}% elemental resistances`, v / 8, mod('minion.res', 'base', v)),
);
export const brandLimit = def('brandLimit', (v: number): Line =>
  line(`+${v} brand out at a time`, v * 4, mod('deployCount', 'base', v, { tags: ['brand'] })),
);
/** Every hit, spell and attack alike, gains some of its physical damage as fire (the holy warrior's faith). */
export const physGainFire = def('physGainFire', (v: number): Line =>
  line(`gain ${v}% of physical damage as extra fire`, v / 3, mod('gain.physical.fire', 'base', v)),
);
export const spellPhysToLightning = def('spellPhysToLightning', (v: number): Line =>
  line(
    `${v}% of physical spell damage converted to lightning`,
    v / 10,
    mod('convert.physical.lightning', 'base', v, { tags: ['spell'] }),
  ),
);
export const damageWithMinion = def('damageWithMinion', (v: number): Line =>
  line(
    `${v}% damage while you have a minion`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'minionsOut' } }),
  ),
);
export const regenWithMinion = def('regenWithMinion', (v: number): Line =>
  line(
    `${v}% life regenerated while you have a minion`,
    v / (UNIT.lifeRegen * 1.25),
    mod('lifeRegenPct', 'base', v, { condition: { id: 'minionsOut' } }),
  ),
);
export const channelGuard = def('channelGuard', (v: number): Line =>
  line(
    `${v}% physical damage reduction while channelling`,
    v * 0.75,
    mod('physReduction', 'base', v, { condition: { id: 'channelling' } }),
  ),
);
/** A staff block may give insight (charges are rolled under the fight's conditions: wielding a staff). */
export const insightOnStaffBlock = def('insightOnStaffBlock', (v: number): Line =>
  line(
    `${v}% chance to gain an insight charge when you block with a staff`,
    v / 8,
    mod('chargeOn.block.insight', 'base', v, { condition: { id: 'wieldingStaff' } }),
  ),
);
export const insightOnWarcry = def('insightOnWarcry', (v: number): Line =>
  line(
    `${v}% chance to gain an insight charge when you use a warcry`,
    v / 12,
    mod('chargeOn.warcry.insight', 'base', v),
  ),
);
export const regenWithTotem = def('regenWithTotem', (v: number): Line =>
  line(
    `${v}% life regenerated while you have a totem`,
    v / (UNIT.lifeRegen * 1.25),
    mod('lifeRegenPct', 'base', v, { condition: { id: 'totemOut' } }),
  ),
);
export const damageWithTotem = def('damageWithTotem', (v: number): Line =>
  line(
    `${v}% damage while you have a totem`,
    v / 10,
    mod('damage', 'inc', v, { condition: { id: 'totemOut' } }),
  ),
);
/** Damage for every aura standing (the calc's `auras` per stat). */
export const damagePerAura = def('damagePerAura', (v: number): Line =>
  line(
    `${v}% damage for each aura you have`,
    (v * 2) / 10,
    mod('damage', 'inc', v, { per: { stat: 'auras', div: 1 } }),
  ),
);
/** Life regenerated for every aura standing (the calc's `auras` per stat). */
export const regenPerAura = def('regenPerAura', (v: number): Line =>
  line(
    `${v}% life regenerated for each aura you have`,
    (v * 2) / UNIT.lifeRegen,
    mod('lifeRegenPct', 'base', v, { per: { stat: 'auras', div: 1 } }),
  ),
);
