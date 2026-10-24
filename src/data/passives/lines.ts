/**
 * The vocabulary of node lines (docs/tree/design/D-method.md). One function per line a node may carry; each builds the
 * engine's mods and says how many units it is worth, a unit being the small node of that stat. The unit values are the
 * reference's magnitudes as the previous tree already used them (docs/tree/design/C-brief.md §5: one value per stat).
 *
 * A line is added here first, with its stat checked against docs/tree/design/A2-vocabulary.md (the sheet shows it, the
 * fight obeys it). Nothing here is a node: the area files decide what a node carries.
 */
import { mod, type Condition, type DamageType, type Mod, type SkillTag } from '../../mods/types';
import type { Line } from './types';

const line = (label: string, units: number, ...mods: Mod[]): Line => ({ label, units, mods });

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
    `${v}% ${tagWords(tags)}life leech`,
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
