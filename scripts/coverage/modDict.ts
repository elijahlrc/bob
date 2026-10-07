/**
 * The translation rules: phrases of the 3.9-era unique item text, in the normalised form of translate.ts (numbers are
 * `#`), to mods in Bob's own stat vocabulary. A stat that does not exist in Bob yet is listed by `needs-verb` (npm run
 * coverage:translate -- --needs) and is implemented when three or more uniques want it.
 */
import type { SkillTag } from '../../src/mods/types';
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
  { re: /against Cursed Enemies$/, apply: withCond('targetCursed') },
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

export const RULES = rules;
