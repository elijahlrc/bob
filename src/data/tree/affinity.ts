/**
 * Which clusters go together (iteration 8, the user: two clusters may be joined only if some build wants both). A cluster is about a
 * few **categories** (read off its lines), and two categories either belong in one build or do not. Pure data and no engine: the
 * layout asks `related` before it joins two clusters.
 */
import type { Mod } from '../../mods/types';

export type Category =
  | 'life'
  | 'armour'
  | 'evasion'
  | 'es'
  | 'res'
  | 'mana'
  | 'spell'
  | 'attack'
  | 'crit'
  | 'elemental'
  | 'chaos'
  | 'physical'
  | 'minion'
  | 'sigil'
  | 'curse'
  | 'charge'
  | 'flask';

const WEAPON_TAGS = new Set([
  'mace',
  'sword',
  'axe',
  'bow',
  'dagger',
  'claw',
  'wand',
  'staff',
  'sceptre',
  'twoHand',
  'oneHand',
  'dualWield',
  'melee',
  'attack',
  'projectile',
]);
const SIGIL_TAGS = new Set(['trap', 'mine', 'totem', 'brand']);
const ELEMENTS = new Set(['fire', 'cold', 'lightning']);

/** What a cluster is about: the categories of its lines. */
export function categoriesOf(mods: readonly Mod[]): Set<Category> {
  const out = new Set<Category>();
  for (const m of mods) {
    const s = m.stat as string;
    const tags: readonly string[] = m.tags ?? [];
    const types: readonly string[] = m.damageTypes ?? [];
    if (/^(life|leech\.life|lifeOn|recover)/.test(s)) out.add('life');
    if (/^(armour|physReduction|block|shieldDef|stun|enemyStun)/.test(s)) out.add('armour');
    if (/^(evasion|evade|dodge|moveSpeed)/.test(s)) out.add('evasion');
    if (/^(es|shieldEs|esRecharge|leechToES|regenToES)/.test(s)) out.add('es');
    if (/^(resist|maxResist)/.test(s)) out.add('res');
    if (/^(mana|reducedReservation|cost|leech\.mana)/.test(s)) out.add('mana');
    if (/^castSpeed/.test(s) || tags.includes('spell')) out.add('spell');
    if (/^(attackSpeed|accuracy|projectile|aoe)/.test(s) || tags.some((t) => WEAPON_TAGS.has(t)))
      out.add('attack');
    if (/^(critChance|critMulti)/.test(s)) out.add('crit');
    if (
      types.some((t) => ELEMENTS.has(t)) ||
      tags.some((t) => ELEMENTS.has(t)) ||
      /ignite|chill|freeze|shock|\.fire|\.cold|\.lightning|penetration/.test(s)
    )
      out.add('elemental');
    if (
      types.includes('chaos') ||
      /poison|chaos|dotMulti/.test(s) ||
      tags.includes('dot') ||
      tags.includes('poison')
    )
      out.add('chaos');
    if (types.includes('physical') || /bleed|impale|physical/.test(s)) out.add('physical');
    if (/^minion/.test(s) || tags.includes('minion')) out.add('minion');
    if (/^(deploy|totem|trap|mine)/.test(s) || tags.some((t) => SIGIL_TAGS.has(t)))
      out.add('sigil');
    if (/^(curse|aura|hexLimit)/.test(s)) out.add('curse');
    if (/charge|maxCharges/.test(s)) out.add('charge');
    if (/^flask/.test(s)) out.add('flask');
  }
  return out;
}

/** The defences and the basics of a body: a build that stands on one often stands on several. */
const BODY: Category[] = ['life', 'armour', 'evasion', 'es', 'res'];

/** Pairs of categories that belong in one build (the pairs are symmetric; a category goes with itself). */
const PAIRS: [Category, Category][] = [
  ['mana', 'es'],
  ['mana', 'spell'],
  ['mana', 'curse'],
  ['mana', 'sigil'],
  ['mana', 'minion'],
  ['mana', 'life'],
  ['spell', 'crit'],
  ['spell', 'elemental'],
  ['spell', 'chaos'],
  ['spell', 'es'],
  ['spell', 'sigil'],
  ['spell', 'curse'],
  ['spell', 'minion'],
  ['attack', 'crit'],
  ['attack', 'physical'],
  ['attack', 'elemental'],
  ['attack', 'life'],
  ['attack', 'armour'],
  ['attack', 'evasion'],
  ['attack', 'charge'],
  ['attack', 'flask'],
  ['crit', 'elemental'],
  ['crit', 'chaos'],
  ['crit', 'physical'],
  ['crit', 'sigil'],
  ['elemental', 'res'],
  ['elemental', 'curse'],
  ['chaos', 'curse'],
  ['chaos', 'minion'],
  ['chaos', 'physical'],
  ['physical', 'life'],
  ['physical', 'armour'],
  ['physical', 'charge'],
  ['minion', 'curse'],
  ['minion', 'life'],
  ['sigil', 'curse'],
  ['charge', 'flask'],
  ['charge', 'life'],
  ['flask', 'life'],
  ['flask', 'mana'],
  ['flask', 'evasion'],
];

const GOES = new Set<string>();
for (const [a, b] of PAIRS) {
  GOES.add(`${a}|${b}`);
  GOES.add(`${b}|${a}`);
}
for (const a of BODY) for (const b of BODY) GOES.add(`${a}|${b}`);

/** Whether a build might want both of two clusters: some category of one goes with some category of the other. */
export function related(a: ReadonlySet<Category>, b: ReadonlySet<Category>): boolean {
  for (const x of a) for (const y of b) if (x === y || GOES.has(`${x}|${y}`)) return true;
  return false;
}
