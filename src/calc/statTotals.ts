import type { ModDB } from '../mods/modDb';
import { CONDITION_TEXT } from '../data/statText';
import { maskIntersects, type Condition, type Mod, type StatId } from '../mods/types';

/** Where a total sits on the Character tab. */
export type TotalGroup = 'offence' | 'defence' | 'other';

/**
 * One stat's increases and more multipliers added up over the whole character: `mod` stands for the line (its stat, damage
 * types, tags and condition), `mult` is what they multiply the stat by together.
 */
export type StatTotal = { group: TotalGroup; mod: Mod; mult: number };

const DEFENCE =
  /^(life|mana|es|armour|evasion|block|resist|maxResist|lifeRegen|manaRegen|esRecharge|leech|recover|damageTaken|hitTakenType|stun|avoid|flask|physReduction|ailmentThreshold|lifeOn|manaOn)/;
const OFFENCE =
  /^(damage|minDamage|maxDamage|attackSpeed|castSpeed|crit|accuracy|area|projectile|pen|ignite|bleed|poison|shock|chill|freeze|dot|minion|skillDuration|duration|cooldown|trap|mine|totem|ailment|impale|chain|pierce|fork|hex|curse)/;

function groupOf(stat: StatId): TotalGroup {
  if (DEFENCE.test(stat)) return 'defence';
  if (OFFENCE.test(stat)) return 'offence';
  return 'other';
}

/**
 * The character's increased and more modifiers, summed per line (DESIGN.md Appendix A, 2026-10-23): increases add, more
 * multipliers multiply, and the two together give one multiplier per line. A condition the sheet takes to hold (an aura, a buff
 * counted as up) is dropped from the line; one it does not stays on it. Local item mods (already in the item's own numbers) are
 * left out, and lines that come to nothing are dropped. Biggest effect first within each group.
 */
export function statTotals(
  db: ModDB,
  conds: number,
  statValue: (s: StatId) => number,
): StatTotal[] {
  const lines = new Map<string, { mod: Mod; inc: number; more: number }>();
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
    const line: Mod = {
      stat: m.stat,
      kind: 'inc',
      value: 0,
      damageTypes: m.damageTypes ? [...m.damageTypes].sort() : undefined,
      tags: m.tags ? [...m.tags].sort() : undefined,
      condition,
    };
    const key = [
      line.stat,
      line.damageTypes?.join('+') ?? '',
      line.tags?.join('+') ?? '',
      condition ? `${condition.not ? '!' : ''}${condition.id}` : '',
    ].join('|');
    let l = lines.get(key);
    if (!l) lines.set(key, (l = { mod: line, inc: 0, more: 1 }));
    if (m.kind === 'inc') l.inc += value;
    else l.more *= 1 + value / 100;
  }
  const out: StatTotal[] = [];
  for (const { mod, inc, more } of lines.values()) {
    const mult = Math.max(0, 1 + inc / 100) * more;
    if (Math.abs(mult - 1) < 0.005) continue;
    out.push({ group: groupOf(mod.stat), mod, mult });
  }
  return out.sort((a, b) => Math.abs(Math.log(b.mult)) - Math.abs(Math.log(a.mult)));
}
