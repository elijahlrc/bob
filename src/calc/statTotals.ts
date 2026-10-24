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

/** Where a total sits on the Character tab. */
export type TotalGroup = 'offence' | 'defence' | 'other';

/**
 * One stat's increases and more multipliers added up over the whole character: `mod` stands for the line (its stat, damage
 * types, tags and condition), `mult` is what they multiply the stat by together (1 for a line nothing touches).
 */
export type StatTotal = { group: TotalGroup; mod: Mod; mult: number };

type Line = { stat: StatId; damageTypes?: DamageType[]; tags?: SkillTag[] };

/**
 * The lines every character shows, in the order shown, whether anything touches them or not. Within a group a line the build
 * has that is not here (damage with a weapon kind, a conditional line) follows the last fixed line of its stat.
 */
const FIXED: Record<Exclude<TotalGroup, 'other'>, Line[]> = {
  defence: [
    { stat: 'life' },
    { stat: 'es' },
    { stat: 'mana' },
    { stat: 'armour' },
    { stat: 'evasion' },
    { stat: 'lifeRegen' },
    { stat: 'manaRegen' },
    { stat: 'esRechargeRate' },
  ],
  offence: [
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
    { stat: 'attackSpeed' },
    { stat: 'castSpeed' },
    { stat: 'critChance' },
    { stat: 'aoe' },
    { stat: 'projectileSpeed' },
    { stat: 'skillDuration' },
  ],
};

const DEFENCE =
  /^(life|mana|es|armour|evasion|block|resist|maxResist|lifeRegen|manaRegen|esRecharge|leech|recover|damageTaken|hitTaken|stun|avoid|flask|physReduction|ailmentThreshold|lifeOn|manaOn|globalDefences|shield)/;
const OFFENCE =
  /^(damage|minDamage|maxDamage|attackSpeed|castSpeed|crit|accuracy|aoe|projectile|pen|ignite|bleed|poison|chance|duration|effect|dot|minion|skillDuration|cooldown|trap|mine|totem|ailment|impale|chain|pierce|fork|curseEffect$|stunDamage|stunDuration)/;

function groupOf(stat: StatId): TotalGroup {
  if (DEFENCE.test(stat)) return 'defence';
  if (OFFENCE.test(stat)) return 'offence';
  return 'other';
}

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
 * left out. The fixed lines come in their order, at ×1 when nothing touches them; the build's other lines follow their stat
 * (those of a stat with no fixed line at the end of the group), and are dropped when they come to nothing.
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
  for (const g of Object.values(FIXED)) for (const l of g) lineOf(l);
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
  const fixedAt = new Map<string, number>();
  const statAt = new Map<StatId, number>();
  for (const g of Object.values(FIXED))
    g.forEach((l, i) => {
      fixedAt.set(keyOf(l), i);
      statAt.set(l.stat, i);
    });
  const out: (StatTotal & { at: number; fixed: boolean })[] = [];
  for (const [key, { mod, inc, more }] of lines) {
    const mult = Math.max(0, 1 + inc / 100) * more;
    const fixed = fixedAt.has(key);
    if (!fixed && Math.abs(mult - 1) < 0.005) continue;
    const at = fixedAt.get(key) ?? statAt.get(mod.stat) ?? 1000;
    out.push({ group: groupOf(mod.stat), mod, mult, at, fixed });
  }
  out.sort((a, b) => a.at - b.at || Number(b.fixed) - Number(a.fixed) || keyCmp(a.mod, b.mod));
  return out.map(({ group, mod, mult }) => ({ group, mod, mult }));
}

const keyCmp = (a: Mod, b: Mod) => (keyOf(a, a.condition) < keyOf(b, b.condition) ? -1 : 1);
