import type { ModDB } from '../mods/modDb';
import { CONDITION_TEXT } from '../data/statText';
import {
  maskIntersects,
  type Condition,
  type DamageType,
  type Mod,
  type SkillTag,
  type StatId,
} from '../mods/types';

/** The section of the Character tab a total sits in, in the order the tab shows them. */
export const TOTAL_SECTIONS = [
  'pools',
  'armour',
  'block',
  'recovery',
  'defenceOther',
  'damage',
  'speed',
  'crit',
  'reach',
  'ailments',
  'offenceOther',
  'other',
] as const;
export type TotalSection = (typeof TOTAL_SECTIONS)[number];

/**
 * One stat's increases and more multipliers added up over the whole character: `mod` stands for the line (its stat, damage
 * types, tags and condition), `mult` is what they multiply the stat by together (1 for a line nothing touches).
 */
export type StatTotal = {
  section: TotalSection;
  mod: Mod;
  mult: number;
  /** The increases added up, in percent, and the more multipliers multiplied together: `mult` = (1 + inc/100) × more. */
  inc: number;
  more: number;
};

type Line = { stat: StatId; damageTypes?: DamageType[]; tags?: SkillTag[] };

/**
 * Each section's stats (a line of any of them that the build has lands there; the first section that matches wins) and its
 * fixed lines, shown in this order whether anything touches them or not. A line the build has that is not fixed (damage with a
 * weapon kind, a conditional line) follows the last fixed line of its stat, or ends its section.
 */
const SECTIONS: Record<TotalSection, { stats: RegExp; fixed: Line[] }> = {
  pools: { stats: /^(life|es|mana)$/, fixed: [{ stat: 'life' }, { stat: 'es' }, { stat: 'mana' }] },
  armour: {
    stats: /^(armour|evasion|globalDefences|physReduction|shieldDefences)$/,
    fixed: [{ stat: 'armour' }, { stat: 'evasion' }],
  },
  block: { stats: /^(block|stunThreshold|avoid)/, fixed: [] },
  recovery: {
    stats: /^(lifeRegen|manaRegen|esRecharge|leech|recover|lifeOn|manaOn|flask)/,
    fixed: [{ stat: 'lifeRegen' }, { stat: 'manaRegen' }, { stat: 'esRechargeRate' }],
  },
  defenceOther: {
    stats: /^(resist|maxResist|damageTaken|hitTaken|ailmentThreshold|curseEffectOnSelf|shield)/,
    fixed: [],
  },
  damage: {
    stats: /^(damage|minDamage|maxDamage|pen)/,
    fixed: [
      { stat: 'damage' },
      { stat: 'damage', tags: ['attack'] },
      { stat: 'damage', tags: ['spell'] },
      { stat: 'damage', damageTypes: ['physical'] },
      { stat: 'damage', damageTypes: ['cold', 'fire', 'lightning'] },
      { stat: 'damage', damageTypes: ['fire'] },
      { stat: 'damage', damageTypes: ['cold'] },
      { stat: 'damage', damageTypes: ['lightning'] },
      { stat: 'damage', damageTypes: ['chaos'] },
      { stat: 'damage', tags: ['dot'] },
    ],
  },
  speed: {
    stats: /^(attackSpeed|castSpeed|actionSpeed|cooldownRecovery)$/,
    fixed: [{ stat: 'attackSpeed' }, { stat: 'castSpeed' }],
  },
  crit: { stats: /^(crit|accuracy)/, fixed: [{ stat: 'critChance' }] },
  reach: {
    stats: /^(aoe|projectile|skillDuration|chain|pierce|fork|buffDuration)/,
    fixed: [{ stat: 'aoe' }, { stat: 'projectileSpeed' }, { stat: 'skillDuration' }],
  },
  ailments: {
    stats:
      /^(chance|duration|effect|ignite|bleed|poison|ailment|impale|stunDamage|stunDuration|dot)/,
    fixed: [],
  },
  offenceOther: {
    stats: /^(minion|trap|mine|totem|curseEffect$|warcryEffect|auraEffect)/,
    fixed: [],
  },
  other: { stats: /./, fixed: [] },
};

const sectionOf = (stat: StatId): TotalSection =>
  TOTAL_SECTIONS.find((id) => SECTIONS[id].stats.test(stat)) ?? 'other';

const keyOf = (l: Line, condition?: Condition) =>
  [
    l.stat,
    l.damageTypes?.join('+') ?? '',
    l.tags?.join('+') ?? '',
    condition ? `${condition.not ? '!' : ''}${condition.id}` : '',
  ].join('|');

/**
 * The character's increased and more modifiers, summed per line (DESIGN.md Appendix A, 2026-10-23): increases add, more
 * multipliers multiply, and the two together give one multiplier per line. A condition the sheet takes to hold (an aura, a buff
 * counted as up) is dropped from the line; one it does not stays on it. Local item mods (already in the item's own numbers) are
 * left out. Lines come by section; the fixed lines in their order, at ×1 when nothing touches them; the build's other lines
 * follow their stat (or end their section), and are dropped when they come to nothing.
 */
export function statTotals(
  db: ModDB,
  conds: number,
  statValue: (s: StatId) => number,
): StatTotal[] {
  const lines = new Map<string, { mod: Mod; inc: number; more: number }>();
  const lineOf = (l: Line, condition?: Condition) => {
    const key = keyOf(l, condition);
    let got = lines.get(key);
    if (!got)
      lines.set(key, (got = { mod: { ...l, kind: 'inc', value: 0, condition }, inc: 0, more: 1 }));
    return got;
  };
  for (const id of TOTAL_SECTIONS) for (const l of SECTIONS[id].fixed) lineOf(l);
  for (const m of db.mods()) {
    if ((m.kind !== 'inc' && m.kind !== 'more') || m.local) continue;
    let condition: Condition | undefined;
    if (m.condition && maskIntersects(conds, db.cond.peek(m.condition.id)) === !!m.condition.not) {
      // A condition with no words is the game's own bookkeeping (a buff not counted as up): it says nothing to the player.
      if (!CONDITION_TEXT[m.condition.id]) continue;
      condition = m.condition;
    }
    const value = m.per ? m.value * Math.floor(statValue(m.per.stat) / m.per.div) : m.value;
    if (value === 0) continue;
    const l = lineOf(
      {
        stat: m.stat,
        damageTypes: m.damageTypes?.length ? [...m.damageTypes].sort() : undefined,
        tags: m.tags?.length ? [...m.tags].sort() : undefined,
      },
      condition,
    );
    if (m.kind === 'inc') l.inc += value;
    else l.more *= 1 + value / 100;
  }
  // A line's place: its section, then its fixed line's index, or the last fixed index of its stat, or the section's end.
  const fixedAt = new Map<string, number>();
  const statAt = new Map<string, number>();
  TOTAL_SECTIONS.forEach((id, si) =>
    SECTIONS[id].fixed.forEach((l, i) => {
      fixedAt.set(keyOf(l), si * 1000 + i);
      statAt.set(`${id}|${l.stat}`, si * 1000 + i);
    }),
  );
  const out: (StatTotal & { at: number; fixed: boolean })[] = [];
  for (const [key, { mod, inc, more }] of lines) {
    const mult = Math.max(0, 1 + inc / 100) * more;
    const fixed = fixedAt.has(key);
    if (!fixed && Math.abs(mult - 1) < 0.005) continue;
    const section = sectionOf(mod.stat);
    const si = TOTAL_SECTIONS.indexOf(section);
    const at = fixedAt.get(key) ?? statAt.get(`${section}|${mod.stat}`) ?? si * 1000 + 999;
    out.push({ section, mod, mult, inc, more, at, fixed });
  }
  out.sort((a, b) => a.at - b.at || Number(b.fixed) - Number(a.fixed) || keyCmp(a.mod, b.mod));
  return out.map(({ section, mod, mult, inc, more }) => ({ section, mod, mult, inc, more }));
}

/**
 * The character's flat amounts of one stat (leech, life on hit), summed per line as `statTotals` sums increases: a line for
 * each set of tags, damage types and condition the sheet does not take to hold. Only the character's own mods are here (gear,
 * the tree, relics, buffs); what a skill's gems add to that skill is the skill's. Lines that come to nothing are dropped.
 */
export function statBaseLines(
  db: ModDB,
  conds: number,
  statValue: (s: StatId) => number,
  stat: StatId,
): Mod[] {
  const lines = new Map<string, Mod>();
  for (const m of db.mods()) {
    if (m.stat !== stat || m.kind !== 'base' || m.local) continue;
    let condition: Condition | undefined;
    if (m.condition && maskIntersects(conds, db.cond.peek(m.condition.id)) === !!m.condition.not) {
      if (!CONDITION_TEXT[m.condition.id]) continue;
      condition = m.condition;
    }
    const value = m.per ? m.value * Math.floor(statValue(m.per.stat) / m.per.div) : m.value;
    if (value === 0) continue;
    const l: Line = {
      stat,
      damageTypes: m.damageTypes?.length ? [...m.damageTypes].sort() : undefined,
      tags: m.tags?.length ? [...m.tags].sort() : undefined,
    };
    const key = keyOf(l, condition);
    const got = lines.get(key) ?? { ...l, kind: 'base' as const, value: 0, condition };
    lines.set(key, { ...got, value: got.value + value });
  }
  return [...lines.values()].filter((m) => m.value !== 0).sort(keyCmp);
}

const keyCmp = (a: Mod, b: Mod) => (keyOf(a, a.condition) < keyOf(b, b.condition) ? -1 : 1);
