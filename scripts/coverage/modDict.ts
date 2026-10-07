/**
 * The translation rules: phrases of the 3.9-era unique item text, in the normalised form of translate.ts (numbers are
 * `#`), to mods in Bob's own stat vocabulary. A stat that does not exist in Bob yet is listed by `needs-verb` (npm run
 * coverage:translate -- --needs) and is implemented when three or more uniques want it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SkillTag } from '../../src/mods/types';
import { COVERAGE_DIR, key } from './reference';
import { DMG_TYPES, type Clause, type LineCtx, type ModT, type Num, type Rule } from './translate';

const mk = (stat: string, kind: ModT['kind'], n: Num, extra: Partial<ModT> = {}): ModT => ({
  stat,
  kind,
  min: n[0],
  max: n[1],
  ...extra,
});
const neg = (n: Num): Num => [-n[0], -n[1]];
const flag = (stat: string): ModT => ({ stat, kind: 'flag', min: 1, max: 1 });

/** Bob's flat defences run below the reference game's: apply the ratio from the base tables (scale.ts). */
const FLAT_SCALE: Record<string, number> = { armour: 0.6, evasion: 0.6, es: 0.45 };
const scaled = (stat: string, n: Num): Num => {
  const f = FLAT_SCALE[stat] ?? 1;
  return [Math.round(n[0] * f), Math.round(n[1] * f)];
};

const TYPE = '(Physical|Fire|Cold|Lightning|Chaos|Elemental)';
const typeOf = (w: string) => DMG_TYPES[w];

/** Lines that say nothing Bob models: they never block a unique from counting. */
export const IGNORED: RegExp[] = [
  /^Requires Level: #$/,
  /^Corrupted$/,
  /^(Elder|Shaper|Fractured|Synthesised) Item$/,
  /^Extra [Gg]ore$/,
  /^Gore Footprints$/,
  /light radius/i,
  /^# increased (Strength|Dexterity|Intelligence) Requirement$/,
  /^#% (increased|reduced) (Strength|Dexterity|Intelligence|Attribute) Requirements?$/,
  /^When used in the Synthesiser/,
  /^Can't use Flask in/i,
  /^Mirrored$/,
  /^Unidentified$/,
  /^Has # Abyssal Sockets?$/,
  /^Has # Socket$/,
  /^Cannot be Blinded$/,
  /^Items and Gems have # reduced Attribute Requirements$/,
  /^Unaffected by (Shocked|Chilled|Burning|Desecrated) Ground$/,
  /Footprints$/,
  /^# chance to Cause Monsters to Flee/i,
  /^# increased Effect of Socketed Jewels$/,
  /^Cover Enemies in Ash/,
  /^Zealot's Oath$/,
  /^# increased Character Size$/,
  /^Minions have # (to|increased|reduced) .*(Resistance|Resistances)$/,
  /^Aspect of the (Cat|Avian|Spider|Crab) Reserves no Mana$/,
  /^Can have a second Enchantment Modifier$/,
  /^Can be modified while Corrupted$/,
  /^Can have up to # Implicit Modifiers while Item has this Modifier$/,
  /Fishing Line Strength$/,
  /(Quantity|Rarity) of Fish Caught$/,
  /^You can catch Corrupted Fish$/,
  /^Veiled (prefix|suffix)/,
  /^(of the Veil|Veiled)/,
];

// ---- Clauses -----------------------------------------------------------------------------------------------------

const withCond =
  (id: NonNullable<ModT['condition']>['id'], not = false): Clause['apply'] =>
  (_m, x) => ({
    ...x,
    condition: { id, ...(not ? { not: true } : {}) },
  });
const withTags =
  (...tags: SkillTag[]): Clause['apply'] =>
  (_m, x) => ({ ...x, tags: [...new Set([...(x.tags ?? []), ...tags])] });

export const CLAUSES: Clause[] = [
  { re: /(?:while|when) on Low Life$/, apply: withCond('onLowLife') },
  { re: /(?:while|when) on Full Life$/, apply: withCond('onFullLife') },
  { re: /while Dual Wielding$/, apply: withCond('dualWielding') },
  { re: /while holding a Shield$/, apply: withCond('holdingShield') },
  { re: /if you've Killed Recently$/, apply: withCond('killedRecently') },
  { re: /if you haven't Killed Recently$/, apply: withCond('killedRecently', true) },
  { re: /if you've been Hit Recently$/, apply: withCond('beenHitRecently') },
  { re: /if you haven't been Hit Recently$/, apply: withCond('beenHitRecently', true) },
  { re: /if you've dealt a Critical Strike Recently$/, apply: withCond('critRecently') },
  { re: /if you've used a Flask Recently$/, apply: withCond('usedFlaskRecently') },
  { re: /during Flask effect$/, apply: withCond('flaskActive') },
  { re: /while Leeching$/, apply: withCond('leeching') },
  { re: /(?:against|on) Frozen Enemies$/, apply: withCond('targetFrozen') },
  { re: /(?:against|on) Shocked Enemies$/, apply: withCond('targetShocked') },
  { re: /(?:against|on) Chilled Enemies$/, apply: withCond('targetChilled') },
  { re: /(?:against|on) Ignited Enemies$/, apply: withCond('targetIgnited') },
  { re: /(?:against|on) Bleeding Enemies$/, apply: withCond('targetBleeding') },
  { re: /(?:against|on) Poisoned Enemies$/, apply: withCond('targetPoisoned') },
  { re: /(?:against|when Hitting) Cursed Enemies$/, apply: withCond('targetCursed') },
  { re: /while affected by Herald of Ash$/, apply: withCond('heraldAsh') },
  { re: /while affected by Herald of Ice$/, apply: withCond('heraldIce') },
  { re: /while affected by Herald of Thunder$/, apply: withCond('heraldThunder') },
  { re: /while affected by Herald of Agony$/, apply: withCond('heraldAgony') },
  { re: /against Rare or Unique Enemies$/, apply: withCond('targetRareOrUnique') },
  { re: /(?:when|while) at least # Enemies are Nearby$/, apply: withCond('targetNearby') },
  {
    re: /per Endurance Charge$/,
    apply: (_m, x) => ({ ...x, per: { stat: 'charges.grit', div: 1 } }),
  },
  {
    re: /per Frenzy Charge$/,
    apply: (_m, x) => ({ ...x, per: { stat: 'charges.fervour', div: 1 } }),
  },
  {
    re: /per Power Charge$/,
    apply: (_m, x) => ({ ...x, per: { stat: 'charges.insight', div: 1 } }),
  },
  {
    re: /per # (Strength|Dexterity|Intelligence)$/,
    apply: (m, x, n) => ({
      ...x,
      per: {
        stat: { Strength: 'str', Dexterity: 'dex', Intelligence: 'int' }[m[1]] as string,
        div: n[0]?.[0] ?? 1,
      },
    }),
  },
  { re: /while stationary$/, apply: withCond('stationary') },
  { re: /while Ignited$/, apply: withCond('ignited') },
  { re: /while Shocked$/, apply: withCond('shocked') },
  { re: /while Chilled$/, apply: withCond('chilled') },
  { re: /while Frozen$/, apply: withCond('frozen') },
  { re: /while Bleeding$/, apply: withCond('bleeding') },
  { re: /while Poisoned$/, apply: withCond('poisoned') },
  { re: /while wielding a Staff$/, apply: withCond('wieldingStaff') },
  { re: /while wielding a Bow$/, apply: withCond('wieldingBow') },
  { re: /while wielding a Sword$/, apply: withCond('wieldingSword') },
  { re: /while wielding an Axe$/, apply: withCond('wieldingAxe') },
  { re: /while wielding a Mace$/, apply: withCond('wieldingMace') },
  { re: /while wielding a Dagger$/, apply: withCond('wieldingDagger') },
  { re: /while wielding a Claw$/, apply: withCond('wieldingClaw') },
  { re: /while wielding a Wand$/, apply: withCond('wieldingWand') },
  { re: /while wielding a Sceptre$/, apply: withCond('wieldingSceptre') },
  { re: /while not on Low Mana$/, apply: withCond('onLowMana', true) },
  { re: /(?:when|while) on Low Mana$/, apply: withCond('onLowMana') },
  { re: /if you've Blocked Recently$/, apply: withCond('blockedRecently') },
  { re: /per Level$/, apply: (_m, x) => ({ ...x, per: { stat: 'level', div: 1 } }) },
  { re: /with Weapons$/, apply: withTags('attack') },
  { re: /with Attack Skills$/, apply: withTags('attack') },
  { re: /with Spell Skills$/, apply: withTags('spell') },
  { re: /with Bows$/, apply: withTags('bow') },
  { re: /with Swords$/, apply: withTags('sword') },
  { re: /with Axes$/, apply: withTags('axe') },
  { re: /with Maces$/, apply: withTags('mace') },
  { re: /with Daggers$/, apply: withTags('dagger') },
  { re: /with Claws$/, apply: withTags('claw') },
  { re: /with Wands$/, apply: withTags('wand') },
  { re: /with Staves$/, apply: withTags('staff') },
  { re: /with Melee Skills$/, apply: withTags('melee') },
  { re: /with Projectile Attack Skills$/, apply: withTags('attack', 'projectile') },
  { re: /with Elemental Skills$/, apply: (_m, x) => x },
];

// ---- Rules -------------------------------------------------------------------------------------------------------

const rules: Rule[] = [];
const rule = (re: RegExp, make: Rule['make']) => rules.push({ re, make });

/** "#% increased X" / "#% reduced X" / "#% more X" / "#% less X" for a stat. */
function incRule(
  phrase: string,
  stat: string,
  extra: (c: LineCtx) => Partial<ModT> = () => ({}),
): void {
  rule(new RegExp(`^# increased ${phrase}$`), (_m, n, c) => [mk(stat, 'inc', n[0], extra(c))]);
  rule(new RegExp(`^# reduced ${phrase}$`), (_m, n, c) => [mk(stat, 'inc', neg(n[0]), extra(c))]);
  rule(new RegExp(`^# more ${phrase}$`), (_m, n, c) => [mk(stat, 'more', n[0], extra(c))]);
  rule(new RegExp(`^# less ${phrase}$`), (_m, n, c) => [mk(stat, 'more', neg(n[0]), extra(c))]);
}
/** "+# to X" for a flat stat. */
function baseRule(
  phrase: string,
  stat: string,
  extra: (c: LineCtx) => Partial<ModT> = () => ({}),
): void {
  rule(new RegExp(`^# to ${phrase}$`), (_m, n, c) => [
    mk(stat, 'base', scaled(stat, n[0]), extra(c)),
  ]);
}

const L = (_c: LineCtx, on: boolean) => (on ? { local: true } : {});

// Vitals and attributes.
baseRule('maximum Life', 'life');
baseRule('maximum Mana', 'mana');
baseRule('maximum Energy Shield', 'es');
incRule('maximum Life', 'life');
incRule('maximum Mana', 'mana');
incRule('maximum Energy Shield', 'es');
baseRule('Strength', 'str');
baseRule('Dexterity', 'dex');
baseRule('Intelligence', 'int');
baseRule('all Attributes', 'allAttr');
rule(/^# to (Strength|Dexterity|Intelligence) and (Strength|Dexterity|Intelligence)$/, (m, n) => {
  const s = (w: string) =>
    ({ Strength: 'str', Dexterity: 'dex', Intelligence: 'int' })[w] as string;
  return [mk(s(m[1]), 'base', n[0]), mk(s(m[2]), 'base', n[0])];
});
incRule('Strength', 'str');
incRule('Dexterity', 'dex');
incRule('Intelligence', 'int');

// Defences (local on armour pieces, global elsewhere).
baseRule('Armour', 'armour', (c) => L(c, c.armourPiece));
baseRule('Evasion Rating', 'evasion', (c) => L(c, c.armourPiece));
baseRule('Energy Shield', 'es', (c) => L(c, c.armourPiece));
incRule('Armour', 'armour', (c) => L(c, c.armourPiece));
incRule('Evasion Rating', 'evasion', (c) => L(c, c.armourPiece));
incRule('Energy Shield', 'es', (c) => L(c, c.armourPiece));
rule(/^# increased Armour and Energy Shield$/, (_m, n, c) => [
  mk('armour', 'inc', n[0], L(c, c.armourPiece)),
  mk('es', 'inc', n[0], L(c, c.armourPiece)),
]);
rule(/^# increased Armour and Evasion$/, (_m, n, c) => [
  mk('armour', 'inc', n[0], L(c, c.armourPiece)),
  mk('evasion', 'inc', n[0], L(c, c.armourPiece)),
]);
rule(/^# increased Evasion and Energy Shield$/, (_m, n, c) => [
  mk('evasion', 'inc', n[0], L(c, c.armourPiece)),
  mk('es', 'inc', n[0], L(c, c.armourPiece)),
]);
rule(/^# increased Armour, Evasion and Energy Shield$/, (_m, n, c) => [
  mk('armour', 'inc', n[0], L(c, c.armourPiece)),
  mk('evasion', 'inc', n[0], L(c, c.armourPiece)),
  mk('es', 'inc', n[0], L(c, c.armourPiece)),
]);
incRule('Global Defences', 'globalDefences');
rule(/^# Chance to Block$/, (_m, n, c) => [mk('blockAttack', 'base', n[0], L(c, c.armourPiece))]);
rule(/^# chance to Block Spell Damage$/, (_m, n) => [mk('blockSpell', 'base', n[0])]);
rule(/^# Chance to Block Spell Damage$/, (_m, n) => [mk('blockSpell', 'base', n[0])]);
rule(/^# (?:chance|Chance) to Block Attack Damage$/, (_m, n, c) => [
  mk('blockAttack', 'base', n[0], L(c, c.armourPiece)),
]);
rule(/^# of Block Chance applied to Spells$/, (_m, n) => [
  mk('blockSpellFromAttack', 'base', n[0]),
]);

// Resistances.
rule(new RegExp(`^# to ${TYPE} Resistance$`), (m, n) => {
  const t = typeof m[1] === 'string' ? m[1] : 'Fire';
  if (t === 'Elemental') return [mk('resist.allEle', 'base', n[0])];
  return [mk(`resist.${t.toLowerCase()}`, 'base', n[0])];
});
rule(new RegExp(`^# to all ${TYPE} Resistances$`), (_m, n) => [mk('resist.allEle', 'base', n[0])]);
rule(new RegExp(`^# to ${TYPE} and ${TYPE} Resistances$`), (m, n) => [
  mk(`resist.${m[1].toLowerCase()}`, 'base', n[0]),
  mk(`resist.${m[2].toLowerCase()}`, 'base', n[0]),
]);
rule(new RegExp(`^# to maximum ${TYPE} Resistance$`), (m, n) => [
  mk(m[1] === 'Elemental' ? 'maxResist.allEle' : `maxResist.${m[1].toLowerCase()}`, 'base', n[0]),
]);
rule(new RegExp(`^# to all maximum ${TYPE} Resistances$`), (_m, n) => [
  mk('maxResist.allEle', 'base', n[0]),
]);

// Speed, crit, accuracy.
incRule('Movement Speed', 'moveSpeed');
incRule('Attack Speed', 'attackSpeed', (c) => L(c, c.weapon));
incRule('Cast Speed', 'castSpeed');
rule(/^# increased Attack and Cast Speed$/, (_m, n) => [
  mk('attackSpeed', 'inc', n[0]),
  mk('castSpeed', 'inc', n[0]),
]);
rule(/^# reduced Attack and Cast Speed$/, (_m, n) => [
  mk('attackSpeed', 'inc', neg(n[0])),
  mk('castSpeed', 'inc', neg(n[0])),
]);
rule(/^# increased Critical Strike Chance$/, (_m, n, c) => [
  mk('critChance', 'inc', n[0], L(c, c.weapon)),
]);
rule(/^# increased Global Critical Strike Chance$/, (_m, n) => [mk('critChance', 'inc', n[0])]);
rule(/^# increased Critical Strike Chance for Spells$/, (_m, n) => [
  mk('critChance', 'inc', n[0], { tags: ['spell'] }),
]);
rule(/^# less Critical Strike Chance$/, (_m, n) => [mk('critChance', 'more', neg(n[0]))]);
rule(/^# to Global Critical Strike Multiplier$/, (_m, n) => [mk('critMulti', 'base', n[0])]);
baseRule('Accuracy Rating', 'accuracy', (c) => L(c, c.weapon));
incRule('Accuracy Rating', 'accuracy', (c) => L(c, c.weapon));
incRule('Global Accuracy Rating', 'accuracy');
rule(/^# increased Area of Effect$/, (_m, n) => [mk('aoe', 'inc', n[0])]);
rule(/^# increased Area of Effect of Area Skills$/, (_m, n) => [
  mk('aoe', 'inc', n[0], { tags: ['area'] }),
]);
incRule('Projectile Speed', 'projectileSpeed');

// Damage.
rule(new RegExp(`^# increased ${TYPE} Damage$`), (m, n, c) => {
  const t = m[1] ?? 'Physical';
  return [
    mk('damage', 'inc', n[0], { damageTypes: typeOf(t), ...L(c, c.weapon && t === 'Physical') }),
  ];
});
rule(new RegExp(`^# reduced ${TYPE} Damage$`), (m, n) => [
  mk('damage', 'inc', neg(n[0]), { damageTypes: typeOf(m[1]) }),
]);
rule(new RegExp(`^# increased Global ${TYPE} Damage$`), (m, n) => [
  mk('damage', 'inc', n[0], { damageTypes: typeOf(m[1]) }),
]);
rule(new RegExp(`^# more ${TYPE} Damage$`), (m, n) => [
  mk('damage', 'more', n[0], { damageTypes: typeOf(m[1]) }),
]);
rule(new RegExp(`^# less ${TYPE} Damage$`), (m, n) => [
  mk('damage', 'more', neg(n[0]), { damageTypes: typeOf(m[1]) }),
]);
rule(/^# increased Damage$/, (_m, n) => [mk('damage', 'inc', n[0])]);
rule(/^# more Damage$/, (_m, n) => [mk('damage', 'more', n[0])]);
rule(/^# less Damage$/, (_m, n) => [mk('damage', 'more', neg(n[0]))]);
rule(/^# increased Spell Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['spell'] })]);
rule(/^# reduced Spell Damage$/, (_m, n) => [mk('damage', 'inc', neg(n[0]), { tags: ['spell'] })]);
rule(/^# increased Projectile Damage$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['projectile'] }),
]);
rule(/^# increased Area Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['area'] })]);
rule(/^# increased Melee Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['melee'] })]);
rule(/^# increased Damage over Time$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['dot'] })]);
rule(/^# increased Burning Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['ignite'] })]);
rule(/^# increased Bleeding Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['bleed'] })]);
rule(/^# increased Poison Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['poison'] })]);
rule(new RegExp(`^# increased ${TYPE} Damage with Weapons$`), (m, n) => [
  mk('damage', 'inc', n[0], { damageTypes: typeOf(m[1]), tags: ['attack'] }),
]);
rule(new RegExp(`^Adds # to # ${TYPE} Damage$`), (m, n, c) => {
  const t = typeOf(m[1]);
  const lc = L(c, c.weapon);
  return [
    mk('damage.min', 'base', n[0], { damageTypes: t, ...lc }),
    mk('damage.max', 'base', n[1], { damageTypes: t, ...lc }),
  ];
});
for (const [phrase, tags] of [
  ['to Attacks', ['attack']],
  ['to Spells', ['spell']],
  ['to Attacks with Bows', ['attack', 'bow']],
] as [string, SkillTag[]][])
  rule(new RegExp(`^Adds # to # ${TYPE} Damage ${phrase}$`), (m, n) => {
    const t = typeOf(m[1]);
    return [
      mk('damage.min', 'base', n[0], { damageTypes: t, tags }),
      mk('damage.max', 'base', n[1], { damageTypes: t, tags }),
    ];
  });
rule(new RegExp(`^Adds # to # ${TYPE} Damage to Spells and Attacks$`), (m, n) => {
  const t = typeOf(m[1]);
  return [
    mk('damage.min', 'base', n[0], { damageTypes: t }),
    mk('damage.max', 'base', n[1], { damageTypes: t }),
  ];
});
rule(new RegExp(`^# of ${TYPE} Damage Converted to ${TYPE} Damage$`), (m, n) => [
  mk(`convert.${m[1].toLowerCase()}.${m[2].toLowerCase()}`, 'base', n[0]),
]);
rule(new RegExp(`^Gain # of ${TYPE} Damage as Extra ${TYPE} Damage$`), (m, n) => [
  mk(`gain.${m[1].toLowerCase()}.${m[2].toLowerCase()}`, 'base', n[0]),
]);
rule(new RegExp(`^Damage Penetrates # ${TYPE} Resistance$`), (m, n) => [
  mk('penetration', 'base', n[0], { damageTypes: typeOf(m[1]) }),
]);
rule(/^# chance to Ignite$/, (_m, n) => [mk('chance.ignite', 'base', n[0])]);
rule(/^# chance to Freeze$/, (_m, n) => [mk('chance.freeze', 'base', n[0])]);
rule(/^# chance to Shock$/, (_m, n) => [mk('chance.shock', 'base', n[0])]);
rule(/^# chance to Poison on Hit$/, (_m, n) => [mk('chance.poison', 'base', n[0])]);
rule(/^# chance to cause Bleeding on Hit$/, (_m, n) => [mk('chance.bleed', 'base', n[0])]);
rule(/^Causes Bleeding on Hit$/, () => [mk('chance.bleed', 'base', [100, 100])]);
rule(/^# chance to Freeze, Shock and Ignite$/, (_m, n) => [
  mk('chance.freeze', 'base', n[0]),
  mk('chance.shock', 'base', n[0]),
  mk('chance.ignite', 'base', n[0]),
]);
incRule('Chill Duration on Enemies', 'duration.chill');
incRule('Effect of Shock', 'effect.shock');

// Leech and gain.
rule(new RegExp(`^# of ${TYPE} Attack Damage Leeched as Life$`), (m, n) => [
  mk('leech.life', 'base', n[0], { damageTypes: typeOf(m[1]), tags: ['attack'] }),
]);
rule(new RegExp(`^# of ${TYPE} Attack Damage Leeched as Mana$`), (m, n) => [
  mk('leech.mana', 'base', n[0], { damageTypes: typeOf(m[1]), tags: ['attack'] }),
]);
rule(new RegExp(`^# of ${TYPE} Damage Leeched as Life$`), (m, n) => [
  mk('leech.life', 'base', n[0], { damageTypes: typeOf(m[1]) }),
]);
rule(/^# of Attack Damage Leeched as Life$/, (_m, n) => [
  mk('leech.life', 'base', n[0], { tags: ['attack'] }),
]);
rule(/^# Life gained for each Enemy hit by (?:your )?Attacks$/, (_m, n) => [
  mk('lifeOnHit', 'base', n[0], { tags: ['attack'] }),
]);
rule(/^# Life gained on Kill$/, (_m, n) => [mk('lifeOnKill', 'base', n[0])]);
rule(/^# Mana [Gg]ained on Kill$/, (_m, n) => [mk('manaOnKill', 'base', n[0])]);
rule(/^Recover # of Maximum Life on Kill$/, (_m, n) => [mk('lifeOnKillPct', 'base', n[0])]);
rule(/^# Life Regenerated per second$/, (_m, n) => [mk('lifeRegen', 'base', n[0])]);
rule(/^# Mana Regenerated per second$/, (_m, n) => [mk('manaRegenFlat', 'base', n[0])]);
rule(/^# of Life Regenerated per [Ss]econd$/, (_m, n) => [mk('lifeRegenPct', 'base', n[0])]);
incRule('Mana Regeneration Rate', 'manaRegen');
incRule('faster start of Energy Shield Recharge', 'esRechargeDelay');
incRule('Energy Shield Recharge Rate', 'esRechargeRate');

// Stun and ailments on the player.
incRule('Stun Duration on Enemies', 'stunDuration');
rule(/^# reduced Enemy Stun Threshold(?: with this Weapon)?$/, (_m, n) => [
  mk('enemyStunThreshold', 'base', n[0]),
]);
rule(/^# increased Stun (?:and Block )?Recovery$/, (_m, n) => [
  mk('stunDurationOnSelf', 'base', n[0]),
]);
rule(/^Cannot be Frozen$/, () => [flag('cannotBeFrozen')]);
rule(/^Cannot be Chilled$/, () => [flag('cannotBeChilled')]);
rule(/^Cannot be Stunned$/, () => [flag('cannotBeStunned')]);
rule(/^Hits can't be Evaded$/, () => [flag('alwaysHit')]);
rule(/^Culling Strike$/, () => [flag('cullingStrike')]);
rule(/^Blood Magic$/, () => [flag('skillsCostLife')]);
rule(/^Your T Damage can Shock$/, () => []);

// Items, flasks, reservation.
incRule('Rarity of Items found', 'itemRarity');
incRule('Quantity of Items found', 'itemQuantity');
incRule('Experience gain', 'xpGain');
rule(/^# reduced Mana Reserved$/, (_m, n) => [mk('reducedReservation', 'base', n[0])]);
rule(/^# increased Mana Reserved$/, (_m, n) => [mk('reducedReservation', 'base', neg(n[0]))]);
rule(/^Socketed Gems have # reduced Mana Reservation$/, (_m, n) => [
  mk('socketedReducedReservation', 'base', n[0]),
]);
// "Socketed Gems are Supported by level N X": the support is linked to every gem in the item. Only supports Bob has.
{
  const gems = (
    JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'map.json'), 'utf8')) as {
      gems: Record<string, { ref: string }>;
    }
  ).gems;
  const byName = new Map<string, string>();
  for (const [id, e] of Object.entries(gems)) byName.set(key(e.ref.replace(/ Support$/, '')), id);
  const alt = Object.values(gems)
    .filter((e) => / Support$/.test(e.ref))
    .map((e) => e.ref.replace(/ Support$/, ''))
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  rule(new RegExp(`^Socketed Gems are supported by level # (${alt})$`, 'i'), (m, n) => {
    const id = byName.get(key(m[1]));
    return id ? [mk(`socketSupport.${id}`, 'base', n[0])] : [];
  });
}
// "Grants Level N X Skill": the character has the skill as if it were socketed (an item-granted gem). Only skills Bob has.
{
  const gems = (
    JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'map.json'), 'utf8')) as {
      gems: Record<string, { ref: string }>;
    }
  ).gems;
  const skills = Object.entries(gems).filter(([, e]) => !/ Support$/.test(e.ref));
  const byName = new Map<string, string>();
  for (const [id, e] of skills) byName.set(key(e.ref), id);
  const alt = skills.map(([, e]) => e.ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  rule(new RegExp(`^Grants Level # (${alt}) Skill$`, 'i'), (m, n) => {
    const id = byName.get(key(m[1]));
    return id ? [mk(`grantSkill.${id}`, 'base', n[0])] : [];
  });
  rule(new RegExp(`^Grants (${alt}) Skill$`, 'i'), (m) => {
    const id = byName.get(key(m[1]));
    return id ? [mk(`grantSkill.${id}`, 'base', [20, 20])] : [];
  });
}
rule(/^# reduced Effect of Curses on You$/, (_m, n) => [mk('curseEffectOnSelf', 'inc', neg(n[0]))]);
for (const [word, id] of [
  ['Cat', 'aspectOfPrey'],
  ['Avian', 'aspectOfWing'],
  ['Spider', 'aspectOfWeb'],
] as const)
  rule(new RegExp(`^Grants Level # Aspect of the ${word} Skill$`), (_m, n) => [
    mk(`grantSkill.${id}`, 'base', n[0]),
  ]);
rule(/^Minions deal # increased Damage$/, (_m, n) => [mk('minionDamage', 'inc', n[0])]);
rule(/^Minions have # increased Movement Speed$/, (_m, n) => [mk('minionSpeed', 'inc', n[0])]);
rule(/^Minions have # increased Attack Speed$/, (_m, n) => [mk('minionSpeed', 'inc', n[0])]);
rule(/^Minions have # increased maximum Life$/, (_m, n) => [mk('minionLife', 'inc', n[0])]);
rule(/^# to Maximum number of (?:Skeletons|Zombies|Spectres|Raging Spirits|Golems)$/, (_m, n) => [
  mk('minionCount', 'base', n[0]),
]);
rule(/^# to Level of Socketed Gems$/, (_m, n) => [mk('socketedGemLevel', 'base', n[0])]);
for (const [word, tag] of [
  ['Fire', 'fire'],
  ['Cold', 'cold'],
  ['Lightning', 'lightning'],
  ['Aura', 'aura'],
  ['Curse', 'curse'],
  ['Minion', 'minion'],
  ['Warcry', 'warcry'],
  ['Golem', 'minion'],
  ['Melee', 'melee'],
  ['Projectile', 'projectile'],
  ['Spell', 'spell'],
  ['Bow', 'bow'],
  ['Movement', 'movement'],
  ['Totem', 'totem'],
  ['Trap', 'trap'],
  ['Mine', 'mine'],
  ['Chaos', 'chaos'],
  ['Physical', 'physical'],
] as [string, SkillTag][])
  rule(new RegExp(`^# to Level of Socketed ${word} Gems$`), (_m, n) => [
    mk('socketedGemLevel', 'base', n[0], { tags: [tag] }),
  ]);
rule(/^# to Maximum Power Charges$/, (_m, n) => [mk('maxCharges.insight', 'base', n[0])]);
rule(/^# to Maximum Frenzy Charges$/, (_m, n) => [mk('maxCharges.fervour', 'base', n[0])]);
rule(/^# to Maximum Endurance Charges$/, (_m, n) => [mk('maxCharges.grit', 'base', n[0])]);
for (const [word, kind] of [
  ['Endurance', 'grit'],
  ['Frenzy', 'fervour'],
  ['Power', 'insight'],
] as const) {
  rule(new RegExp(`^# chance to gain an? ${word} Charge on Kill$`), (_m, n) => [
    mk(`chargeOn.kill.${kind}`, 'base', n[0]),
  ]);
  rule(new RegExp(`^# chance to gain an? ${word} Charge on Hit$`), (_m, n) => [
    mk(`chargeOn.hit.${kind}`, 'base', n[0]),
  ]);
  rule(new RegExp(`^# chance to gain an? ${word} Charge on Critical Strike$`), (_m, n) => [
    mk(`chargeOn.crit.${kind}`, 'base', n[0]),
  ]);
}
incRule('Movement Speed per Frenzy Charge', 'moveSpeed', () => ({
  per: { stat: 'charges.fervour', div: 1 },
}));

// Recovery on events.
const RECOVER_EVENTS: [string, string][] = [
  ['on Kill', 'kill'],
  ['when you Block', 'block'],
  ['on Critical Strike', 'crit'],
  ['when Hit', 'hitTaken'],
  ['when you are Hit', 'hitTaken'],
];
const POOLS: [string, string][] = [
  ['Life', 'life'],
  ['Mana', 'mana'],
  ['Energy Shield', 'es'],
];
for (const [phrase, event] of RECOVER_EVENTS)
  for (const [label, pool] of POOLS) {
    rule(new RegExp(`^# ${label} [Gg]ained ${phrase}$`), (_m, n) => [
      mk(`recover.${event}.${pool}`, 'base', n[0]),
    ]);
    rule(new RegExp(`^Recover # ${label} ${phrase}$`), (_m, n) => [
      mk(`recover.${event}.${pool}`, 'base', n[0]),
    ]);
    rule(new RegExp(`^Recover # of Maximum ${label} ${phrase}$`), (_m, n) => [
      mk(`recoverPct.${event}.${pool}`, 'base', n[0]),
    ]);
  }
rule(/^# Mana gained for each Enemy hit by Attacks$/, (_m, n) => [mk('manaOnHit', 'base', n[0])]);

// Buffs and rage on events.
const BUFF_WORDS: Record<string, string> = {
  Onslaught: 'onslaught',
  Fortify: 'fortify',
  'Unholy Might': 'unholyMight',
  'Arcane Surge': 'arcaneSurge',
};
const BUFF_EVENTS: [string, string][] = [
  ['on Kill', 'kill'],
  ['on Critical Strike', 'crit'],
  ['on Hit', 'hit'],
  ['on Melee Hit', 'meleeHit'],
  ['when you Block', 'block'],
  ['when Hit', 'hitTaken'],
];
for (const [word, id] of Object.entries(BUFF_WORDS))
  for (const [phrase, event] of BUFF_EVENTS) {
    rule(new RegExp(`^You gain ${word} for # seconds? ${phrase}$`), () => [
      mk(`buffOn.${event}.${id}`, 'base', [100, 100]),
    ]);
    rule(new RegExp(`^# chance to gain ${word} for # seconds? ${phrase}$`), (_m, n) => [
      mk(`buffOn.${event}.${id}`, 'base', n[0]),
    ]);
    rule(new RegExp(`^# chance to gain ${word} ${phrase}$`), (_m, n) => [
      mk(`buffOn.${event}.${id}`, 'base', n[0]),
    ]);
  }
rule(/^Gain # Rage on Hit$/, (_m, n) => [mk('rageOn.hit', 'base', n[0])]);
rule(/^# to maximum Rage$/, (_m, n) => [mk('maxRage', 'base', n[0])]);

// Avoiding and suffering ailments.
for (const [word, id] of [
  ['Ignited', 'ignite'],
  ['Shocked', 'shock'],
  ['Poisoned', 'poison'],
  ['Frozen', 'freeze'],
  ['Chilled', 'chill'],
] as const) {
  rule(new RegExp(`^Cannot be ${word}$`), () => [mk(`avoid.${id}`, 'base', [100, 100])]);
  rule(new RegExp(`^# chance to Avoid being ${word}$`), (_m, n) => [
    mk(`avoid.${id}`, 'base', n[0]),
  ]);
}
rule(/^# chance to Avoid being Stunned$/, (_m, n) => [mk('stunAvoid', 'base', n[0])]);
for (const [word, id] of [
  ['Shock', 'shock'],
  ['Chill', 'chill'],
  ['Freeze', 'freeze'],
  ['Ignite', 'ignite'],
  ['Poison', 'poison'],
  ['Bleeding', 'bleed'],
] as const) {
  rule(new RegExp(`^# increased ${word} Duration on You$`), (_m, n) => [
    mk(`durationOnSelf.${id}`, 'inc', n[0]),
  ]);
  rule(new RegExp(`^# reduced ${word} Duration on You$`), (_m, n) => [
    mk(`durationOnSelf.${id}`, 'inc', neg(n[0])),
  ]);
}
rule(/^Moving while Bleeding doesn't cause you to take extra Damage$/, () => [
  flag('noMovingBleed'),
]);

// Damage taken, reflect and dodge.
rule(new RegExp(`^# of Physical Damage (?:from Hits )?taken as ${TYPE} Damage$`), (m, n) =>
  m[1] === 'Physical' ? [] : [mk(`physTakenAs.${m[1].toLowerCase()}`, 'base', n[0])],
);
rule(new RegExp(`^# increased ${TYPE} Damage taken$`), (m, n) =>
  (typeOf(m[1]) ?? []).map((t) => mk(`damageTaken.${t}`, 'inc', n[0])),
);
rule(new RegExp(`^# reduced ${TYPE} Damage taken$`), (m, n) =>
  (typeOf(m[1]) ?? []).map((t) => mk(`damageTaken.${t}`, 'inc', neg(n[0]))),
);
rule(new RegExp(`^# ${TYPE} Damage taken from Attacks$`), (m, n) =>
  (typeOf(m[1]) ?? []).map((t) => mk(`flatTaken.attack.${t}`, 'base', n[0])),
);
rule(new RegExp(`^Take # ${TYPE} Damage when hit by Attacks$`), (m, n) =>
  (typeOf(m[1]) ?? []).map((t) => mk(`flatTaken.attack.${t}`, 'base', n[0])),
);
rule(new RegExp(`^Reflects # ${TYPE} Damage to Melee Attackers$`), (m, n) =>
  (typeOf(m[1]) ?? []).map((t) => mk(`reflect.${t}`, 'base', n[0])),
);
rule(new RegExp(`^Reflects # to # ${TYPE} Damage to Melee Attackers$`), (m, n) =>
  (typeOf(m[1]) ?? []).map((t) =>
    mk(`reflect.${t}`, 'base', [
      Math.round((n[0][0] + n[1][0]) / 2),
      Math.round((n[0][1] + n[1][1]) / 2),
    ]),
  ),
);
rule(/^# of Melee Physical Damage taken reflected to Attacker$/, (_m, n) => [
  mk('reflectPhysPct', 'base', n[0]),
]);
rule(/^# chance to Dodge Attacks$/, (_m, n) => [mk('dodgeAttack', 'base', n[0])]);
rule(/^# [Cc]hance to Dodge Spell Damage$/, (_m, n) => [mk('dodgeSpell', 'base', n[0])]);
rule(/^# chance to Dodge Attack and Spell Hits$/, (_m, n) => [
  mk('dodgeAttack', 'base', n[0]),
  mk('dodgeSpell', 'base', n[0]),
]);

// Durations on enemies, leech rate, flasks, cost, range, arrows, curses on hit, keystones.
for (const [word, id] of [
  ['Shock', 'shock'],
  ['Chill', 'chill'],
  ['Freeze', 'freeze'],
  ['Ignite', 'ignite'],
  ['Poison', 'poison'],
  ['Bleeding', 'bleed'],
] as const) {
  incRule(`${word} Duration on Enemies`, `duration.${id}`);
}
rule(/^# increased Life Leeched per second$/, (_m, n) => [mk('leechRate', 'inc', n[0])]);
rule(/^# increased Mana Leeched per second$/, (_m, n) => [mk('leechRate', 'inc', n[0])]);
rule(/^Gain Life from Leech instantly from Hits with this Weapon$/, () => [
  flag('instantLeechAlways'),
]);
rule(/^# increased Life Recovery from Flasks$/, (_m, n) => [mk('flaskLifeRecovery', 'inc', n[0])]);
rule(/^# increased Mana Recovery from Flasks$/, (_m, n) => [mk('flaskManaRecovery', 'inc', n[0])]);
rule(/^# increased Flask Life Recovery rate$/, (_m, n) => [mk('flaskLifeRate', 'inc', n[0])]);
rule(/^# increased Flask Mana Recovery rate$/, (_m, n) => [mk('flaskManaRate', 'inc', n[0])]);
rule(/^# to Total Mana Cost of Skills$/, (_m, n) => [mk('costFlat', 'base', n[0])]);
rule(/^# to Melee Weapon and Unarmed range$/, (_m, n) => [
  mk('meleeRange', 'base', [n[0][0] / 10, n[0][1] / 10]),
]);
rule(/^# to Weapon range$/, (_m, n) => [mk('meleeRange', 'base', [n[0][0] / 10, n[0][1] / 10])]);
rule(/^Adds an additional Arrow$/, () => [mk('projectiles', 'base', [1, 1], { tags: ['bow'] })]);
rule(/^# additional Arrows$/, (_m, n) => [mk('projectiles', 'base', n[0], { tags: ['bow'] })]);
rule(/^Arrows Pierce an additional Target$/, () => [
  mk('pierce', 'base', [1, 1], { tags: ['bow'] }),
]);
rule(/^# to Critical Strike Multiplier for Spells$/, (_m, n) => [
  mk('critMulti', 'base', n[0], { tags: ['spell'] }),
]);
rule(/^# to Critical Strike Multiplier$/, (_m, n) => [mk('critMulti', 'base', n[0])]);
rule(/^# to Maximum (Fire|Cold|Lightning|Chaos) Resistance$/, (m, n) => [
  mk(`maxResist.${m[1].toLowerCase()}`, 'base', n[0]),
]);
rule(/^You gain # (Evasion Rating|Armour)$/, (m, n) => {
  const stat = m[1] === 'Armour' ? 'armour' : 'evasion';
  return [mk(stat, 'base', scaled(stat, n[0]))];
});
rule(new RegExp(`^Adds # to # ${TYPE} Damage to Attacks with this Weapon$`), (m, n) => {
  const t = typeOf(m[1]);
  return [
    mk('damage.min', 'base', n[0], { damageTypes: t, tags: ['attack'] }),
    mk('damage.max', 'base', n[1], { damageTypes: t, tags: ['attack'] }),
  ];
});
rule(/^Your spells have # chance to Shock against Frozen enemies$/, (_m, n) => [
  mk('chance.shock', 'base', n[0], { tags: ['spell'], condition: { id: 'targetFrozen' } }),
]);
const CURSE_HEX: Record<string, string> = {
  'Temporal Chains': 'leadenLimbs',
  Enfeeble: 'feebleGrip',
  Vulnerability: 'openWounds',
  'Elemental Weakness': 'brittleDoom',
};
for (const [word, id] of Object.entries(CURSE_HEX)) {
  rule(new RegExp(`^# chance to Curse (?:un-cursed )?Enemies with ${word} on Hit$`), () => [
    mk(`hexOnHit.${id}`, 'base', [10, 10]),
  ]);
  rule(new RegExp(`^Curse Enemies with level # ${word} on Hit$`), (_m, n) => [
    mk(`hexOnHit.${id}`, 'base', n[0]),
  ]);
  rule(new RegExp(`^# chance to Curse Enemies with level # ${word} on Hit$`), (_m, n) => [
    mk(`hexOnHit.${id}`, 'base', n[1] ?? n[0]),
  ]);
}
for (const [phrase, id] of [
  ['Pain Attunement', 'painConduit'],
  ['Chaos Inoculation', 'hollowVessel'],
  ['Iron Reflexes', 'platedHide'],
  ['Mind Over Matter', 'mindBulwark'],
  ['Avatar of Fire', 'searingAvatar'],
  ['Point Blank', 'closeQuarters'],
  ['Ghost Reaver', 'shadeLeech'],
  ['Elemental Overload', 'feverPitch'],
  ['Crimson Dance', 'woundDance'],
  ['Perfect Agony', 'cruelAgony'],
  ['Eldritch Battery', 'manaBastion'],
  ['Resolute Technique', 'unerringDiscipline'],
  ['Unwavering Stance', 'rootedStance'],
  ['Arrow Dancing', 'arrowWeave'],
] as const)
  rule(new RegExp(`^${phrase}$`), () => [flag(`grantsKeystone.${id}`)]);

// All gems of a kind (not only the socketed ones).
rule(/^# to Level of all (Fire|Cold|Lightning|Chaos|Physical) Spell Skill Gems$/, (m, n) => [
  mk('gemLevel', 'base', n[0], { tags: [m[1].toLowerCase() as SkillTag, 'spell'] }),
]);
rule(/^# to Level of all Spell Skill Gems$/, (_m, n) => [
  mk('gemLevel', 'base', n[0], { tags: ['spell'] }),
]);
rule(/^# to Level of all Skill Gems$/, (_m, n) => [mk('gemLevel', 'base', n[0])]);

export const RULES = rules;
