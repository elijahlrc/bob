import { gemAttrReq, gemMods, levelValue, spellDamageAt } from '../calc/gems';
import { GEM_LEVEL_REQ, type ActiveGemDef, type GemDef, type SkillBehaviour } from '../data/gems';
import { HEXES, HEX_SECONDS, hexEffect, hexText } from '../data/hexes';
import { MINIONS } from '../data/minions';
import { triggerCause, triggerText } from '../data/triggers';
import { modsText } from '../mods/text';

export type GemCardData = {
  name: string;
  /** "Active skill · Attack", "Support gem", "Aura gem". */
  type: string;
  tags: string[];
  level: number;
  /** Plain stat lines (cost, damage, reservation). */
  stats: string[];
  /** What the gem does to the build, rendered from its mods at this level. */
  effects: string[];
  requires: string;
  description: string;
};

const TAG_LABEL: Record<string, string> = {
  attack: 'Attack',
  spell: 'Spell',
  melee: 'Melee',
  strike: 'Strike',
  area: 'Area',
  projectile: 'Projectile',
  bow: 'Bow',
  physical: 'Physical',
  fire: 'Fire',
  cold: 'Cold',
  lightning: 'Lightning',
  chaos: 'Chaos',
  chain: 'Chain',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const tagLabel = (t: string) => TAG_LABEL[t] ?? cap(t);
const num = (v: number) => String(Math.round(v * 10) / 10);

const POLICY_TEXT = {
  upkeep: 'Cast again when it ends, while enemies are near',
  guard: 'Cast when your life is low',
  rally: 'Cast when a pack or a strong enemy is near',
} as const;

/** What a utility skill (a curse, a buff, a summon, a blink) does, in plain lines. */
function utilityLines(def: ActiveGemDef, level: number): { stats: string[]; effects: string[] } {
  const u = def.utility;
  if (!u) return { stats: [], effects: [] };
  if (u.kind === 'curse')
    return {
      stats: [
        `Curses enemies in a radius of ${num(u.radius)}, for ${HEX_SECONDS} seconds`,
        'Cast on packs and strong enemies, one curse at a time',
      ],
      effects: [
        hexText(u.hex, hexEffect(u.hex, level)),
        ...(HEXES[u.hex].selfMods ?? []).map((m) => {
          const t = Math.max(0, Math.min(1, (level - 1) / 19));
          return modsText([
            { stat: m.stat, kind: m.kind, value: m.low + (m.high - m.low) * t, tags: m.tags },
          ])
            .map((x) => `${x} against them`)
            .join('');
        }),
      ],
    };
  if (u.kind === 'buff')
    return {
      stats: [
        `Lasts ${num(u.seconds)} s`,
        POLICY_TEXT[u.policy],
        ...(u.cooldown ? [`${num(u.cooldown)} s cooldown`] : []),
      ],
      effects: modsText(gemMods(u.mods, level, def.id)),
    };
  if (u.kind === 'summon') {
    const m = MINIONS[u.minion];
    const n = Math.round(levelValue(u.count, level));
    return {
      stats: [
        `Summons ${n} ${m.name}${n === 1 ? '' : 's'}${u.seconds ? ` for ${num(u.seconds)} s` : ''}`,
        'They follow you and strike the nearest enemy',
      ],
      effects: modsText(gemMods(u.ownerMods ?? [], level, def.id)),
    };
  }
  return {
    stats: [
      `Jumps up to ${num(u.distance)} toward a target out of reach`,
      `${num(u.cooldown)} s cooldown`,
    ],
    effects: [],
  };
}

function behaviourLines(b: SkillBehaviour, level: number): string[] {
  const per5 = Math.floor(level / 5);
  switch (b.kind) {
    case 'melee':
      return [
        b.arc
          ? `Hits all enemies in a ${b.arc}° arc, reach ${num(b.range)}`
          : `Single target, reach ${num(b.range)}`,
      ];
    case 'projectile': {
      const n = b.count + (b.countPer5 ?? 0) * per5;
      const out = [`Fires ${n} projectile${n === 1 ? '' : 's'}`];
      if (b.pierce) out.push(`Pierces ${b.pierce} enem${b.pierce === 1 ? 'y' : 'ies'}`);
      if (b.explodeRadius) out.push(`Explodes in a radius of ${num(b.explodeRadius)}`);
      if (b.falloff) out.push('Damage falls off with distance');
      return out;
    }
    case 'chain': {
      const n = b.chains + (b.chainsPer5 ?? 0) * per5;
      return [`Chains ${n} time${n === 1 ? '' : 's'}`];
    }
    case 'burst':
      return [
        b.origin === 'self'
          ? `Bursts around you in a radius of ${num(b.radius)}`
          : `Bursts around the target in a radius of ${num(b.radius)}`,
      ];
    case 'beam':
      return [`Hits everything in a line ${num(b.length)} long`];
    case 'ground':
      return [
        b.line
          ? `Leaves a strip ${num(b.line)} long for ${num(b.duration)} s`
          : `Leaves a zone of radius ${num(b.radius)} for ${num(b.duration)} s`,
        `Hits every ${num(b.interval)} s${b.delay ? ` after ${num(b.delay)} s` : ''}`,
      ];
  }
}

/** Everything a player wants to know about a gem at a given level. */
export function gemCardData(def: GemDef, level: number): GemCardData {
  const tags: string[] = [];
  const stats: string[] = [];
  let type: string;
  let effects: string[];
  if (def.kind === 'active') {
    type = `Active skill · ${cap(def.skillType)}`;
    tags.push(...def.tags.map(tagLabel));
    stats.push(`Costs ${Math.round(levelValue(def.cost, level))} mana`);
    if (def.baseMult) stats.push(`Deals ${num(levelValue(def.baseMult, level))}% of base damage`);
    for (const d of def.spellDamage ?? []) {
      const r = spellDamageAt(d, def.effectiveness ?? 100, level);
      stats.push(`Deals ${r.min} to ${r.max} ${cap(r.type)} damage`);
    }
    if (def.castTime) stats.push(`Cast time ${num(def.castTime)} s`);
    if (def.crit) stats.push(`Base critical chance ${num(def.crit)}%`);
    if (def.utility) stats.push(...utilityLines(def, level).stats);
    else stats.push(...behaviourLines(def.behaviour, level));
    if (def.travel) stats.push(`Carries you up to ${num(def.travel)} toward the target`);
    if (def.needsShield) stats.push('Requires a shield');
    if (def.needsDualWield) stats.push('Requires two weapons');
    if (def.requiresWeapon?.length)
      stats.push(`Requires ${def.requiresWeapon.map(tagLabel).join(' or ')} weapon`);
    if (def.bothWeapons) stats.push('Hits with both weapons when dual wielding');
    effects = [...modsText(gemMods(def.mods, level, def.id)), ...utilityLines(def, level).effects];
  } else if (def.kind === 'support') {
    type = 'Support gem';
    stats.push(
      def.supports.length
        ? `Supports ${def.supports.map(tagLabel).join(' or ')} skills`
        : 'Supports any skill',
    );
    if (def.trigger)
      stats.push(
        `Linked spells are cast ${triggerCause(def.trigger)} (${def.trigger.cooldown} s cooldown)`,
      );
    for (const t of def.extraTriggers ?? []) stats.push(triggerText(t));
    if (def.blasphemy)
      stats.push(
        `Stands on every enemy you hit, and reserves ${def.blasphemy.reservePct}% of your mana`,
      );
    const extra = Math.round((def.costMult - 1) * 100);
    if (extra) stats.push(`${extra > 0 ? '+' : ''}${extra}% mana cost of the supported skill`);
    effects = [
      ...modsText(gemMods(def.mods, level, def.id)),
      ...modsText(gemMods(def.global ?? [], level, def.id)),
    ];
  } else if (def.kind === 'hex') {
    type = 'Hex gem';
    stats.push('Needs Hexing Strikes in the same item to hex the enemies you hit');
    stats.push(`Lasts ${HEX_SECONDS} seconds, renewed on each hit`);
    effects = [hexText(def.hex, hexEffect(def.hex, level))];
  } else {
    type = 'Aura gem';
    if (def.reservePct) stats.push(`Reserves ${def.reservePct}% of your mana`);
    if (def.reserveFlat)
      stats.push(`Reserves ${Math.round(levelValue(def.reserveFlat, level))} mana`);
    for (const t of def.triggers ?? []) stats.push(triggerText(t));
    effects = modsText(gemMods(def.mods, level, def.id));
  }
  const attrs = gemAttrReq(def.attr, level);
  const req = [`level ${GEM_LEVEL_REQ[Math.min(level, 20) - 1]}`];
  if (attrs.str) req.push(`${attrs.str} Str`);
  if (attrs.dex) req.push(`${attrs.dex} Dex`);
  if (attrs.int) req.push(`${attrs.int} Int`);
  return {
    name: def.name,
    type,
    tags,
    level,
    stats,
    effects,
    requires: req.join(', '),
    description: def.description,
  };
}
