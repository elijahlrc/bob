import { scenarioDps, type Character, type CharacterSheet } from '../calc/character';
import type { StatTotal } from '../calc/statTotals';
import {
  ACCURACY_FACTOR,
  ARMOUR_CAP,
  BASE_MANA_REGEN_PCT,
  BASE_MOVE_SPEED,
  ES_RECHARGE_RATE,
  MIN_HIT_CHANCE,
} from '../data/constants';
import { GLOSSARY } from '../data/glossary';
import { modLabel } from '../mods/text';
import type { Mod } from '../mods/types';

/**
 * The Character tab's tips with the arithmetic (the owner, 2026-10-26): what a number is for in one plain line, how the game
 * uses it as a formula, and the formula with the character's own numbers in it. A tip is lines joined by "\n" (the popover
 * keeps them apart).
 */

const f0 = (v: number) => Math.round(v).toLocaleString();
const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString();
const pc = (v: number) => `${Math.round(v * 100)}%`;
const x2 = (v: number) => v.toFixed(2);
/** A percentage as it reads after "1 +" or "1 −": "45%", or "− 20%" for a decrease. */
const signed = (v: number) => (v < 0 ? `− ${f1(-v)}%` : `+ ${f1(v)}%`);
const lines = (...ls: (string | false | null | undefined)[]) => ls.filter(Boolean).join('\n');

/** A modifier line as a multiplier: (1 + increases) × more = ×M. */
export function totalTip(t: StatTotal, lead?: string): string {
  const name = modLabel(t.mod).toLowerCase();
  const more = Math.abs(t.more - 1) > 0.0005 ? ` × ${x2(t.more)}` : '';
  return lines(
    lead,
    `Your ${name} is multiplied by (1 + increases) × each more multiplier.`,
    `(1 ${signed(t.inc)})${more} = ×${x2(t.mult)}`,
  );
}

/** A pool (life, ES, mana) as its flat amount times its multiplier, and what refills it. */
export function poolTip(
  ch: Character,
  s: CharacterSheet,
  pool: 'life' | 'es' | 'mana',
  total: StatTotal | undefined,
): string {
  const def = ch.defence();
  const max = pool === 'life' ? s.life : pool === 'es' ? s.es : s.mana;
  const m = total?.mult ?? 1;
  const flat = m > 0 ? max / m : 0;
  const name = pool === 'life' ? 'Life' : pool === 'es' ? 'Energy shield' : 'Mana';
  const formula = `${name} = flat ${name.toLowerCase()} × multiplier: ${f0(flat)} × ${x2(m)} = ${f0(max)}.`;
  if (pool === 'life')
    return lines(
      GLOSSARY.life,
      formula,
      s.reservedLife > 0 && `${f0(s.reservedLife)} reserved: ${f0(max - s.reservedLife)} to lose.`,
    );
  if (pool === 'es')
    return lines(
      GLOSSARY.es,
      formula,
      max > 0 &&
        `Refills at ${f1(ES_RECHARGE_RATE * 100)}% of it a second × recharge rate = ${f1(def.esRecharge)}/s, ${f1(def.esDelay)} s after the last hit.`,
    );
  return lines(
    GLOSSARY.mana,
    formula,
    s.reservedMana > 0 &&
      `${f0(s.reservedMana)} reserved by auras: ${f0(max - s.reservedMana)} to spend.`,
  );
}

/** What an attribute gives: per point, then for the character's points. */
export function attrTip(ch: Character, key: 'str' | 'dex' | 'int', lead: string): string {
  const points = ch.attrs[key];
  const fx = ch.attrEffects.filter((e) => e.attr === key);
  const text = (m: Mod, v: number) => {
    const n = Math.round(v * 100) / 100;
    return `+${n.toLocaleString()}${m.kind === 'inc' ? '% increased' : ''} ${modLabel({
      ...m,
      kind: 'base',
    })
      .replace(/^Maximum /, '')
      .toLowerCase()}`;
  };
  return lines(
    // The glossary's line says what each point adds in words; the numbers below say it exactly.
    lead.split('. ')[0].replace(/\.?$/, '.'),
    points > 0 && `Each point: ${fx.map((e) => text(e.mod, e.mod.value / points)).join(', ')}.`,
    points > 0 && `${f0(points)} points: ${fx.map((e) => text(e.mod, e.mod.value)).join(', ')}.`,
  );
}

/** A resistance: damage of its type taken times (1 − resistance), up to its maximum. */
export function resistTip(name: string, res: number, max: number, lead: string): string {
  const eff = Math.min(res, max);
  return lines(
    lead,
    `${name} damage taken × (1 − resistance); resistance counts up to its maximum, ${max}%.`,
    `(1 ${eff < 0 ? `+ ${-eff}` : `− ${eff}`}%) = ×${x2(1 - eff / 100)} ${name.toLowerCase()} damage taken` +
      (res > max ? `; ${res - max}% over the maximum counts for nothing.` : '.'),
  );
}

/** Armour and flat reduction against the area's typical hit. */
export function armourTip(ch: Character, s: CharacterSheet): string {
  const def = ch.defence();
  const { hit } = ch.againstReference(def);
  const a = s.armour;
  const fromArmour = a > 0 ? Math.min(ARMOUR_CAP, a / (a + 10 * hit)) : 0;
  return lines(
    GLOSSARY.armour,
    `Share of a physical hit of H taken off = armour ÷ (armour + 10 × H), at most ${pc(ARMOUR_CAP)}.`,
    `A typical hit here, ${f0(hit)}: ${f0(a)} ÷ (${f0(a)} + 10 × ${f0(hit)}) = ${pc(fromArmour)}` +
      (def.physReduction > 0 ? `, + ${pc(def.physReduction)} flat reduction.` : '.'),
  );
}

/** Evasion against the area's typical monster's accuracy. */
export function evasionTip(ch: Character, s: CharacterSheet): string {
  const def = ch.defence();
  const { accuracy, hc } = ch.againstReference(def);
  if (def.cannotEvade)
    return lines(GLOSSARY.evasion, 'Your character cannot evade: every attack hits.');
  return lines(
    GLOSSARY.evasion,
    `Chance an attack hits = ${ACCURACY_FACTOR} × accuracy ÷ (accuracy + (evasion ÷ 4)^0.8), from ${pc(MIN_HIT_CHANCE)} to 100%.`,
    `A typical monster here has ${f0(accuracy)} accuracy against your ${f0(s.evasion)}: it hits ${pc(hc)}, you evade ${pc(1 - hc)}.`,
  );
}

/** A block chance: a blocked hit deals nothing. */
export function blockTip(ch: Character, chance: number, what: string): string {
  const cap = ch.defence().blockCap;
  return lines(
    GLOSSARY.block,
    `${what} taken × (1 − block chance); block is at most ${pc(cap)}.`,
    `(1 − ${pc(chance)}) = ×${x2(1 - chance)} of ${what.toLowerCase()} taken.`,
  );
}

export function stunTip(chance: number): string {
  return lines(GLOSSARY.stun, `Of the stuns that would land, ${pc(chance)} do not.`);
}

/** Life regeneration: flat and a share of life, times the rate multiplier. */
export function lifeRegenTip(s: CharacterSheet, rate: StatTotal | undefined): string {
  const m = rate?.mult ?? 1;
  const before = m > 0 ? s.lifeRegen / m : 0;
  return lines(
    GLOSSARY.regen,
    'Life a second = (flat regeneration + its share of maximum life) × regeneration rate.',
    `${f1(before)} × ${x2(m)} = ${f1(s.lifeRegen)}/s` +
      (s.life > 0 && s.lifeRegen > 0
        ? `, ${f1((s.lifeRegen / s.life) * 100)}% of your life.`
        : '.'),
  );
}

/** Mana regeneration: a share of maximum mana (and flat), times the rate multiplier. */
export function manaRegenTip(s: CharacterSheet, rate: StatTotal | undefined): string {
  const m = rate?.mult ?? 1;
  const base = (s.mana * BASE_MANA_REGEN_PCT) / 100;
  const extra = (m > 0 ? s.manaRegen / m : 0) - base;
  return lines(
    GLOSSARY.regen,
    `Mana a second = (${BASE_MANA_REGEN_PCT}% of maximum mana + your other regeneration) × regeneration rate.`,
    `(${BASE_MANA_REGEN_PCT}% × ${f0(s.mana)}` +
      (Math.abs(extra) >= 0.05 ? ` + ${f1(extra)}` : '') +
      `) × ${x2(m)} = ${f1(s.manaRegen)}/s.`,
  );
}

export function moveTip(s: CharacterSheet, move: StatTotal | undefined): string {
  return lines(
    GLOSSARY.move,
    `Speed = ${BASE_MOVE_SPEED} tiles a second × multiplier.`,
    `${BASE_MOVE_SPEED} × ${x2(move?.mult ?? 1)} = ${f1(s.moveSpeed)} tiles/s.`,
  );
}

/** The DPS estimate: each part of what the character deals, by kind. */
export function dpsTip(s: CharacterSheet): string {
  const parts: [string, number][] = [
    ['main skill', s.skill.totalDps],
    ['other skills', s.secondaryDps],
    ['triggered skills', s.triggeredDps],
    ['minions', s.minionDps],
  ];
  const shown = parts.filter(([, v]) => v >= 0.5);
  return lines(
    GLOSSARY.dps,
    'Each skill: damage of one use on one target × uses a second, as the Strategy tab has them used; summed.',
    shown.length > 1 &&
      `${shown.map(([l, v]) => `${l} ${f0(v)}`).join(' + ')} = ${f0(scenarioDps(s))}.`,
    !!s.scenarios &&
      s.scenarios.pack !== s.scenarios.boss &&
      'Worked out for a fight with a pack and for one with a boss.',
  );
}

/** Effective HP: the pool over the share of a typical hit that gets through. */
export function ehpTip(s: CharacterSheet): string {
  const pool = s.life - s.reservedLife + s.es;
  const share = s.ehp > 0 ? pool / s.ehp : 0;
  return lines(
    GLOSSARY.ehp,
    '(Life + energy shield) ÷ the share of a typical hit that reaches you, after armour, resistances, evasion and block.',
    `${f0(pool)} ÷ ${x2(share)} = ${f0(s.ehp)}.`,
  );
}
