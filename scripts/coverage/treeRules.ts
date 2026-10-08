/**
 * Phrases of the 3.9 passive tree that the unique-item rules in modDict.ts do not have: weapon-scoped ailment damage,
 * deployable and minion lines, damage over time multipliers, charge gains, and so on. They are added to the same
 * rule and clause lists (translate.ts imports this file), so uniques that use the same phrase translate too.
 *
 * A stat marked NEW below did not exist before the tree pass; the engine reads it (see docs/TREE.md).
 */
import type { SkillTag } from '../../src/mods/types';
import { CLAUSES, RULES } from './modDict';
import { DMG_TYPES, type Clause, type ModT, type Num, type Rule } from './translate';

const mk = (stat: string, kind: ModT['kind'], n: Num, extra: Partial<ModT> = {}): ModT => ({
  stat,
  kind,
  min: n[0],
  max: n[1],
  ...extra,
});
const neg = (n: Num): Num => [-n[0], -n[1]];
const rule = (re: RegExp, make: Rule['make']) => RULES.push({ re, make });
const clause = (re: RegExp, apply: Clause['apply']) => CLAUSES.push({ re, apply });
const withTags =
  (...tags: SkillTag[]): Clause['apply'] =>
  (_m, x) => ({ ...x, tags: [...new Set([...(x.tags ?? []), ...tags])] });
const withCond =
  (id: NonNullable<ModT['condition']>['id'], not = false): Clause['apply'] =>
  (_m, x) => ({ ...x, condition: { id, ...(not ? { not: true } : {}) } });

const TYPE = '(Physical|Fire|Cold|Lightning|Chaos|Elemental)';
const typeOf = (w: string) => DMG_TYPES[w];

/** Weapons by the phrase the tree uses, and the weapon tag each gives a skill. */
const WEAPONS: [string, SkillTag[]][] = [
  ['Bows?', ['bow']],
  ['Swords?', ['sword']],
  ['Axes?', ['axe']],
  ['Maces?', ['mace']],
  ['Sceptres?', ['sceptre']],
  ['Daggers?', ['dagger']],
  ['Claws?', ['claw']],
  ['Wands?', ['wand']],
  ['Staves|Staff', ['staff']],
  ['Two Handed Melee Weapons?', ['twoHand', 'melee']],
  ['Two Handed Weapons?', ['twoHand']],
  ['One Handed Melee Weapons?', ['oneHand', 'melee']],
  ['One Handed Weapons?', ['oneHand']],
];

// ---- Clauses -----------------------------------------------------------------------------------------------------

for (const [phrase, tags] of WEAPONS) clause(new RegExp(`with ${phrase}$`), withTags(...tags));
clause(/while wielding a Two Handed Weapon$/, withCond('wieldingTwoHand'));
clause(/while wielding a One Handed Weapon$/, withCond('wieldingOneHand'));
// Alternatives a clause cannot express (a mod has one set of tags) are written out as one mod each by `both`.
clause(/with Bow Skills$/, withCond('wieldingBow'));
clause(/with Trap Skills$/, withTags('trap'));
clause(/with Mines$/, withTags('mine'));
clause(/with Traps$/, withTags('trap'));
clause(/with Totem Skills$/, withTags('totem'));
clause(/with Brand Skills$/, withTags('brand'));
clause(/with Minion Skills$/, withTags('minion'));
clause(/with Channelling Skills$/, withTags('channelling'));
clause(/with Lightning Skills$/, withTags('lightning'));
clause(/with Fire Skills$/, withTags('fire'));
clause(/with Cold Skills$/, withTags('cold'));
clause(/with Chaos Skills$/, withTags('chaos'));
clause(/if you've Hit an Enemy Recently$/, withCond('hitRecently'));
clause(/if you've Stunned an Enemy Recently$/, withCond('stunnedRecently'));
clause(/(?:while|when) you have Fortify$/, withCond('fortified'));
clause(/while you have Onslaught$/, withCond('onslaught'));
clause(/(?:against|on) Enemies that are on Low Life$/, withCond('targetLowLife'));
clause(/while on Full Energy Shield$/, withCond('esFull'));

// ---- Damage scoped by weapon, skill kind and ailment ------------------------------------------------------------------

// "#% increased Damage with Ailments from Attack Skills" (the weapon is a clause).
rule(/^# increased Damage with Ailments from Attack Skills$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['dot', 'attackSkill'] }),
]);
rule(/^Attack Skills deal # increased Damage with Ailments$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['dot', 'attackSkill'] }),
]);
rule(
  /^# increased Damage with Ailments from Attack Skills while wielding a Mace or Sceptre$/,
  (_m, n) => [
    mk('damage', 'inc', n[0], { tags: ['dot', 'attackSkill'], condition: { id: 'wieldingMace' } }),
    mk('damage', 'inc', n[0], {
      tags: ['dot', 'attackSkill'],
      condition: { id: 'wieldingSceptre' },
    }),
  ],
);
rule(
  /^# increased Damage with Ailments from Attack Skills while wielding a Melee Weapon$/,
  (_m, n) => [mk('damage', 'inc', n[0], { tags: ['dot', 'attackSkill', 'melee'] })],
);
rule(/^# increased Damage over Time$/i, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['dot'] })]);
rule(/^# increased Damage with Poison$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['poison'] }),
]);
rule(/^# increased Damage with Bleeding$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['bleed'] }),
]);
rule(/^# increased Damage with Ignite$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['ignite'] }),
]);
rule(/^# increased Damage with Maces and Sceptres$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['mace'] }),
  mk('damage', 'inc', n[0], { tags: ['sceptre'] }),
]);
rule(new RegExp(`^# increased ${TYPE} Damage with Maces and Sceptres$`), (m, n) => [
  mk('damage', 'inc', n[0], { tags: ['mace'], damageTypes: typeOf(m[1]) }),
  mk('damage', 'inc', n[0], { tags: ['sceptre'], damageTypes: typeOf(m[1]) }),
]);
rule(/^# increased Critical Strike Chance with Maces and Sceptres$/, (_m, n) => [
  mk('critChance', 'inc', n[0], { tags: ['mace'] }),
  mk('critChance', 'inc', n[0], { tags: ['sceptre'] }),
]);
rule(/^# to Critical Strike Multiplier with Maces and Sceptres$/, (_m, n) => [
  mk('critMulti', 'base', n[0], { tags: ['mace'] }),
  mk('critMulti', 'base', n[0], { tags: ['sceptre'] }),
]);
rule(/^# increased Accuracy Rating with Maces and Sceptres$/, (_m, n) => [
  mk('accuracy', 'inc', n[0], { tags: ['mace'] }),
  mk('accuracy', 'inc', n[0], { tags: ['sceptre'] }),
]);
rule(/^# increased Attack Speed with Maces and Sceptres$/, (_m, n) => [
  mk('attackSpeed', 'inc', n[0], { tags: ['mace'] }),
  mk('attackSpeed', 'inc', n[0], { tags: ['sceptre'] }),
]);
rule(/^# increased Elemental Damage with Maces and Sceptres$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['mace'], damageTypes: ['fire', 'cold', 'lightning'] }),
  mk('damage', 'inc', n[0], { tags: ['sceptre'], damageTypes: ['fire', 'cold', 'lightning'] }),
]);
rule(/^# increased Accuracy Rating with Two Handed Melee Weapons$/, (_m, n) => [
  mk('accuracy', 'inc', n[0], { tags: ['twoHand', 'melee'] }),
]);
rule(/^# increased Physical Damage with Maces and Sceptres$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['mace'], damageTypes: ['physical'] }),
  mk('damage', 'inc', n[0], { tags: ['sceptre'], damageTypes: ['physical'] }),
]);
rule(/^# increased Melee Physical Damage$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['melee'], damageTypes: ['physical'] }),
]);
rule(/^# increased Attack Physical Damage$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['attack'], damageTypes: ['physical'] }),
]);
rule(/^# increased Physical Attack Damage$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['attack'], damageTypes: ['physical'] }),
]);
rule(/^# increased Attack Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['attack'] })]);
rule(/^# increased Projectile Attack Damage$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['attack', 'projectile'] }),
]);
rule(/^# increased Weapon Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['attack'] })]);
rule(/^# increased Melee Critical Strike Chance$/, (_m, n) => [
  mk('critChance', 'inc', n[0], { tags: ['melee'] }),
]);
rule(/^# to Melee Critical Strike Multiplier$/, (_m, n) => [
  mk('critMulti', 'base', n[0], { tags: ['melee'] }),
]);
rule(/^# increased Critical Strike Chance$/, (_m, n) => [mk('critChance', 'inc', n[0])]);
rule(/^# to Critical Strike Multiplier$/, (_m, n) => [mk('critMulti', 'base', n[0])]);
rule(/^# increased Attack Speed$/, (_m, n) => [mk('attackSpeed', 'inc', n[0])]);
rule(/^# increased Melee Attack Speed$/, (_m, n) => [
  mk('attackSpeed', 'inc', n[0], { tags: ['melee'] }),
]);
rule(/^# increased Cast Speed$/, (_m, n) => [mk('castSpeed', 'inc', n[0])]);
rule(/^# increased Accuracy Rating$/, (_m, n) => [mk('accuracy', 'inc', n[0])]);
rule(/^# increased Weapon Damage$/, (_m, n) => [mk('damage', 'inc', n[0], { tags: ['attack'] })]);
rule(/^# increased Damage with One Handed Weapons$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['attack', 'oneHand'] }),
]);
rule(/^# increased Damage with Two Handed Weapons$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['attack', 'twoHand'] }),
]);
rule(/^# increased Attack Damage with Main Hand$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['attack'] }),
]);
rule(/^# increased Attack Speed with Off Hand$/, (_m, n) => [
  mk('attackSpeed', 'inc', n[0], { tags: ['attack'] }),
]);
rule(/^# increased Weapon Critical Strike Chance while Dual Wielding$/, (_m, n) => [
  mk('critChance', 'inc', n[0], { tags: ['attack'], condition: { id: 'dualWielding' } }),
]);
rule(/^# increased Weapon Damage while Dual Wielding$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['attack'], condition: { id: 'dualWielding' } }),
]);
rule(/^# increased Attack Speed while Dual Wielding$/, (_m, n) => [
  mk('attackSpeed', 'inc', n[0], { tags: ['attack'], condition: { id: 'dualWielding' } }),
]);

// ---- Deployables ----------------------------------------------------------------------------------------------------

for (const [word, tag] of [
  ['Totem', 'totem'],
  ['Trap', 'trap'],
  ['Mine', 'mine'],
  ['Brand', 'brand'],
] as const) {
  rule(new RegExp(`^# increased ${word} Damage$`), (_m, n) => [
    mk('damage', 'inc', n[0], { tags: [tag] }),
  ]);
  rule(new RegExp(`^# increased Damage with ${word} Skills$`), (_m, n) => [
    mk('damage', 'inc', n[0], { tags: [tag] }),
  ]);
  rule(new RegExp(`^# increased Critical Strike Chance with ${word}s?(?: Skills)?$`), (_m, n) => [
    mk('critChance', 'inc', n[0], { tags: [tag] }),
  ]);
  rule(new RegExp(`^# to Critical Strike Multiplier with ${word}s?(?: Skills)?$`), (_m, n) => [
    mk('critMulti', 'base', n[0], { tags: [tag] }),
  ]);
  rule(new RegExp(`^${word} Damage Penetrates # Elemental Resistances$`), (_m, n) => [
    mk('penetration', 'base', n[0], { tags: [tag], damageTypes: ['fire', 'cold', 'lightning'] }),
  ]);
}
rule(/^# increased Totem Placement speed$/, (_m, n) => [
  mk('castSpeed', 'inc', n[0], { tags: ['totem'] }),
]);
rule(/^# increased Trap Throwing Speed$/, (_m, n) => [
  mk('castSpeed', 'inc', n[0], { tags: ['trap'] }),
]);
rule(/^# increased Mine Throwing Speed$/, (_m, n) => [
  mk('castSpeed', 'inc', n[0], { tags: ['mine'] }),
]);
rule(/^# increased Brand Activation frequency$/, (_m, n) => [
  mk('castSpeed', 'inc', n[0], { tags: ['brand'] }),
]);
rule(/^Attacks used by Totems have # increased Attack Speed$/, (_m, n) => [
  mk('attackSpeed', 'inc', n[0], { tags: ['totem'] }),
]);
rule(/^Spells Cast by Totems have # increased Cast Speed$/, (_m, n) => [
  mk('castSpeed', 'inc', n[0], { tags: ['totem'] }),
]);
rule(/^Skills used by Mines have # increased Area of Effect$/, (_m, n) => [
  mk('aoe', 'inc', n[0], { tags: ['mine'] }),
]);
rule(/^Can have up to # additional Traps? placed at a time$/, (_m, n) => [
  mk('deployCount', 'base', n[0], { tags: ['trap'] }),
]);
rule(/^Can have up to # additional Remote Mines? placed at a time$/, (_m, n) => [
  mk('deployCount', 'base', n[0], { tags: ['mine'] }),
]);
rule(/^You can Cast an additional Brand$/, () => [
  mk('deployCount', 'base', [1, 1], { tags: ['brand'] }),
]);
rule(/^# increased Brand Attachment range$/, () => []);
rule(/^# increased Trap Trigger Area of Effect$/, (_m, n) => [
  mk('aoe', 'inc', n[0], { tags: ['trap'] }),
]);
rule(/^# reduced Mana Reservation of Skills that throw Mines$/, (_m, n) => [
  mk('reducedReservation', 'base', n[0], { tags: ['mine'] }),
]);

// ---- Damage over time -----------------------------------------------------------------------------------------------

rule(new RegExp(`^# to ${TYPE} Damage over Time Multiplier$`), (m, n) => [
  mk('dotMulti', 'base', n[0], { damageTypes: typeOf(m[1]) }),
]);
rule(/^# to Damage over Time Multiplier$/, (_m, n) => [mk('dotMulti', 'base', n[0])]);
rule(/^# to Damage over Time Multiplier for (Poison|Bleeding|Ignite)$/, (m, n) => [
  mk('dotMulti', 'base', n[0], {
    tags: [m[1] === 'Bleeding' ? 'bleed' : (m[1].toLowerCase() as SkillTag)],
  }),
]);
rule(/^(Bleeding|Poisons?|Ignites?) you inflict deals? Damage # faster$/, (m, n) => [
  mk(
    m[1].startsWith('Bleed')
      ? 'bleed.speed'
      : m[1].startsWith('Poison')
        ? 'poison.speed'
        : 'ignite.speed',
    'inc',
    n[0],
  ),
]);
rule(/^# increased Poison Duration$/, (_m, n) => [mk('duration.poison', 'inc', n[0])]);
rule(/^# increased Bleeding Duration$/, (_m, n) => [mk('duration.bleed', 'inc', n[0])]);
rule(/^# increased Ignite Duration on Enemies$/, (_m, n) => [mk('duration.ignite', 'inc', n[0])]);
rule(/^# chance to Poison on Hit with Attacks$/, (_m, n) => [
  mk('chance.poison', 'base', n[0], { tags: ['attack'] }),
]);
rule(/^Attacks have # chance to cause Bleeding$/, (_m, n) => [
  mk('chance.bleed', 'base', n[0], { tags: ['attack'] }),
]);
rule(/^Bow Attacks have # chance to cause Bleeding$/, (_m, n) => [
  mk('chance.bleed', 'base', n[0], { tags: ['attack', 'bow'] }),
]);
rule(/^# increased Effect of Chill$/, (_m, n) => [mk('effect.chill', 'inc', n[0])]);
rule(/^# increased Skill Effect Duration$/, (_m, n) => [mk('skillDuration', 'inc', n[0])]);

// ---- Penetration, mitigation, double damage -------------------------------------------------------------------------

rule(/^Damage with Weapons Penetrates # (Fire|Cold|Lightning) Resistance$/, (m, n) => [
  mk('penetration', 'base', n[0], { tags: ['attack'], damageTypes: typeOf(m[1]) }),
]);
rule(/^Damage with Weapons Penetrates # Elemental Resistance$/, (_m, n) => [
  mk('penetration', 'base', n[0], { tags: ['attack'], damageTypes: ['fire', 'cold', 'lightning'] }),
]);
rule(/^Damage Penetrates # Elemental Resistances$/, (_m, n) => [
  mk('penetration', 'base', n[0], { damageTypes: ['fire', 'cold', 'lightning'] }),
]);
rule(/^Enemies have -# to Total Physical Damage Reduction against your Hits$/, (_m, n) => [
  mk('enemyPhysReduction', 'base', n[0]),
]);
rule(/^# chance to deal Double Damage$/, (_m, n) => [mk('doubleDamage', 'base', n[0])]);

// ---- Life, mana, leech ----------------------------------------------------------------------------------------------

rule(/^Regenerate # of Life per second$/, (_m, n) => [mk('lifeRegenPct', 'base', n[0])]);
rule(/^Regenerate # Mana per second$/, (_m, n) => [mk('manaRegenFlat', 'base', n[0])]);
rule(/^# increased total Recovery per second from (Life|Mana) Leech$/, (_m, n) => [
  mk('leechRate', 'inc', n[0]),
]);
rule(/^# of Attack Damage Leeched as Mana$/, (_m, n) => [
  mk('leech.mana', 'base', n[0], { tags: ['attack'] }),
]);
rule(/^# of Spell Damage Leeched as Energy Shield$/, () => []);
rule(/^# reduced Mana Cost of Skills$/, (_m, n) => [mk('cost', 'inc', neg(n[0]))]);
rule(/^# reduced Mana Cost of Minion Skills$/, (_m, n) => [
  mk('cost', 'inc', neg(n[0]), { tags: ['minion'] }),
]);
rule(/^# increased effect of Non-Curse Auras from your Skills$/, (_m, n) => [
  mk('auraEffect', 'inc', n[0]),
]);
rule(/^# increased Area of Effect of Aura Skills$/, (_m, n) => [
  mk('aoe', 'inc', n[0], { tags: ['aura'] }),
]);
rule(/^# increased Effect of your Curses$/, (_m, n) => [mk('curseEffect', 'inc', n[0])]);
rule(/^You can apply an additional Curse$/, () => [mk('hexLimit', 'base', [1, 1])]);
rule(/^# increased Evasion Rating and Armour$/, (_m, n) => [
  mk('armour', 'inc', n[0]),
  mk('evasion', 'inc', n[0]),
]);
rule(/^# additional Physical Damage Reduction$/, (_m, n) => [mk('physReduction', 'base', n[0])]);
rule(/^# increased Stun Threshold$/, (_m, n) => [mk('stunThreshold', 'inc', n[0])]);
rule(/^# increased Flask Effect Duration$/, (_m, n) => [mk('flaskDuration', 'inc', n[0])]);
rule(/^Flasks applied to you have # increased Effect$/, (_m, n) => [
  mk('flaskEffect', 'inc', n[0]),
]);
rule(/^# increased Flask Charges gained$/, (_m, n) => [mk('flaskCharges', 'inc', n[0])]);
rule(/^# increased Flask Recovery rate$/, (_m, n) => [mk('flaskRecovery', 'inc', n[0])]);

// ---- Shields ---------------------------------------------------------------------------------------------------------

rule(/^# increased Defences from Equipped Shield$/, (_m, n) => [mk('shieldDefences', 'inc', n[0])]);
rule(/^# increased Energy Shield from Equipped Shield$/, (_m, n) => [mk('shieldEs', 'inc', n[0])]);
rule(/^# Chance to Block Attack Damage while Dual Wielding or holding a Shield$/, (_m, n) => [
  mk('blockAttack', 'base', n[0], { condition: { id: 'dualWielding' } }),
  mk('blockAttack', 'base', n[0], { condition: { id: 'holdingShield' } }),
]);
rule(/^# Chance to Block Attack Damage while holding a Shield$/, (_m, n) => [
  mk('blockAttack', 'base', n[0], { condition: { id: 'holdingShield' } }),
]);
rule(/^# Chance to Block Attack Damage while Dual Wielding$/, (_m, n) => [
  mk('blockAttack', 'base', n[0], { condition: { id: 'dualWielding' } }),
]);

// ---- Minions ---------------------------------------------------------------------------------------------------------

rule(/^Minions have # increased Cast Speed$/, (_m, n) => [mk('minionSpeed', 'inc', n[0])]);
rule(/^Minions Regenerate # of Life per second$/, (_m, n) => [mk('minionRegen', 'base', n[0])]);
rule(/^# to maximum number of (?:Raised Zombies|Spectres|Skeletons)$/i, (_m, n) => [
  mk('minionCount', 'base', n[0]),
]);
rule(/^# to Maximum number of Raised Zombies$/, (_m, n) => [mk('minionCount', 'base', n[0])]);
rule(/^Minions deal # increased Damage if you've used a Minion Skill Recently$/, (_m, n) => [
  mk('minionDamage', 'inc', n[0]),
]);
rule(/^Minions have # additional Physical Damage Reduction$/, (_m, n) => [
  mk('minionPhysReduction', 'base', n[0]),
]);
rule(/^Minions have # Chance to Block (?:Attack|Spell) Damage$/, (_m, n) => [
  mk('minionBlock', 'base', n[0]),
]);

// ---- Charges ---------------------------------------------------------------------------------------------------------

const CHARGE: Record<string, string> = { Frenzy: 'fervour', Endurance: 'grit', Power: 'insight' };
for (const [word, kind] of Object.entries(CHARGE)) {
  rule(new RegExp(`^# increased ${word} Charge Duration$`), (_m, n) => [
    mk(`chargeDuration.${kind}`, 'inc', n[0]),
  ]);
  rule(
    new RegExp(
      `^# chance to gain an? ${word} Charge when you Block(?: Attack Damage| Spell Damage)?$`,
    ),
    (_m, n) => [mk(`chargeOn.block.${kind}`, 'base', n[0])],
  );
  rule(new RegExp(`^# chance to gain an? ${word} Charge on Kill$`), (_m, n) => [
    mk(`chargeOn.kill.${kind}`, 'base', n[0]),
  ]);
  rule(new RegExp(`^# chance to gain an? ${word} Charge when you are Hit$`), (_m, n) => [
    mk(`chargeOn.hitTaken.${kind}`, 'base', n[0]),
  ]);
  rule(new RegExp(`^# chance to gain an? ${word} Charge on Melee Critical Strike$`), (_m, n) => [
    mk(`chargeOn.crit.${kind}`, 'base', n[0], { tags: ['melee'] }),
  ]);
  rule(
    new RegExp(`^# chance to gain an? ${word} Charge when you Stun an Enemy with a Melee Hit$`),
    (_m, n) => [mk(`chargeOn.stun.${kind}`, 'base', n[0])],
  );
  rule(
    new RegExp(`^# chance to gain an? ${word} Charge when you Stun with Melee Damage$`),
    (_m, n) => [mk(`chargeOn.stun.${kind}`, 'base', n[0])],
  );
}
rule(/^# chance to gain a Power, Frenzy or Endurance Charge on Kill$/, (_m, n) => [
  mk('chargeOn.kill.insight', 'base', n[0]),
  mk('chargeOn.kill.fervour', 'base', n[0]),
  mk('chargeOn.kill.grit', 'base', n[0]),
]);

// ---- More phrases ------------------------------------------------------------------------------------------------

rule(/^Enemies have # to Total Physical Damage Reduction against your Hits$/, (_m, n) => [
  mk('enemyPhysReduction', 'base', neg(n[0])),
]);
rule(/^# Elemental Resistances$/, (_m, n) => [mk('resist.allEle', 'base', n[0])]);
rule(/^Channelling Skills deal # increased Damage$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['channelling'] }),
]);
rule(/^Channelling Skills deal # increased Attack Damage$/, (_m, n) => [
  mk('damage', 'inc', n[0], { tags: ['channelling', 'attack'] }),
]);
rule(/^Channelling Skills have # increased Attack Speed$/, (_m, n) => [
  mk('attackSpeed', 'inc', n[0], { tags: ['channelling'] }),
]);
rule(/^Channelling Skills have # increased Attack and Cast Speed$/, (_m, n) => [
  mk('attackSpeed', 'inc', n[0], { tags: ['channelling'] }),
  mk('castSpeed', 'inc', n[0], { tags: ['channelling'] }),
]);
rule(/^# increased Impale Effect$/, (_m, n) => [mk('impaleEffect', 'inc', n[0])]);
rule(/^# chance to Impale Enemies on Hit with Attacks$/, (_m, n) => [
  mk('chance.impale', 'base', n[0], { tags: ['attack'] }),
]);
rule(/^# increased Effect of non-Damaging Ailments on Enemies$/, (_m, n) => [
  mk('ailmentEffect', 'inc', n[0]),
]);
rule(/^# increased total Recovery per second from Energy Shield Leech$/, (_m, n) => [
  mk('leechRate', 'inc', n[0]),
]);
rule(/^# increased (Totem|Trap|Mine|Brand|Minion) Duration$/, (m, n) => [
  mk('skillDuration', 'inc', n[0], { tags: [m[1].toLowerCase() as SkillTag] }),
]);
rule(/^Brand Skills have # increased Duration$/, (_m, n) => [
  mk('skillDuration', 'inc', n[0], { tags: ['brand'] }),
]);
rule(/^Melee Skills have # increased Area of Effect$/, (_m, n) => [
  mk('aoe', 'inc', n[0], { tags: ['melee'] }),
]);
rule(/^Spell Skills have # increased Area of Effect$/, (_m, n) => [
  mk('aoe', 'inc', n[0], { tags: ['spell'] }),
]);
rule(/^Minions have # increased Area of Effect$/, (_m, n) => [
  mk('aoe', 'inc', n[0], { tags: ['minion'] }),
]);
rule(/^# increased Area of Effect of Curse Skills$/, (_m, n) => [
  mk('aoe', 'inc', n[0], { tags: ['curse'] }),
]);
rule(/^Gain # of Wand Physical Damage as Extra (Fire|Cold|Lightning) Damage$/, (m, n) => [
  mk(`gain.physical.${m[1].toLowerCase()}`, 'base', n[0], { tags: ['wand'] }),
]);
rule(
  /^(Fire|Cold|Lightning) Spells have # of Physical Damage Converted to (?:Fire|Cold|Lightning) Damage$/,
  (m, n) => [mk(`convertSkill.physical.${m[1].toLowerCase()}`, 'base', n[0], { tags: ['spell'] })],
);
rule(/^# chance to Dodge Attack Hits$/, (_m, n) => [mk('dodgeAttack', 'base', n[0])]);
rule(/^# increased Damage if you have Shocked an Enemy Recently$/, (_m, n) => [
  mk('damage', 'inc', n[0]),
]);
rule(/^Regenerate # Life per second$/, (_m, n) => [mk('lifeRegen', 'base', n[0])]);
rule(/^# increased Mana Regeneration Rate per # Chance to Block Spell Damage$/, () => []);
rule(/^Chaos Resistance is doubled$/, () => []);

/**
 * Lines of the tree that Bob does not model and does not need to: they never keep a node from counting. They are tried
 * after every rule, so a phrase a rule knows is never swallowed here.
 */
export const LATE_IGNORED: RegExp[] = [
  /^# increased Block Recovery$/,
  /^# increased (?:Minion )?Accuracy Rating$/,
  /^# increased Totem Life$/,
  /^Totems? (?:have|gain) .*$/,
  /^# chance to Knock Enemies Back on hit$/,
  /Knockback Distance$/,
  /Knocks? Back Enemies/,
  /Blind/,
  /Maim/,
  /Phasing/,
  /^# to Melee (?:Weapon and Unarmed Attack )?range/,
  /^\+# to Melee range with/,
  /Reflected (?:Elemental|Physical) Damage taken$/,
  /^Golems have/,
  /Golems?\b/,
  /^Skills supported by Unleash/,
  /Ballista/,
  /Transfiguration of/,
  /Cooldown Recovery Speed/,
  /Fortify/,
  /Onslaught Effect$/,
  /Warcr/,
  /Arcane Surge/,
  /Unholy Might/,
  /Stun Duration/,
  /Maximum total Recovery per second/,
  /^# chance to double Stun Duration$/,
  /Avoid (?:Elemental Ailments|interruption|Lightning Damage|Fire Damage|Cold Damage|Physical Damage)/,
  /Cannot Leech/,
  /Stun Threshold with/,
  /Movement Skill Recently/,
  /^# to Minimum (?:Power|Frenzy|Endurance) Charges$/,
  /Curse Skills have/,
  /Extra Damage from Critical Strikes/,
];
