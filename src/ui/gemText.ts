import { gemAttrReq, gemMods, levelValue, spellDamageAt } from '../calc/gems';
import {
  GEM_LEVEL_REQ,
  type ActiveGemDef,
  type GemDef,
  type LevelValue,
  type SkillBehaviour,
} from '../data/gems';
import { BUFFS } from '../data/buffs';
import { HEXES, hexEffect, hexSeconds, hexText } from '../data/hexes';
import { STATUSES } from '../data/statuses';
import { MINIONS } from '../data/minions';
import { triggerCause, triggerText } from '../data/triggers';
import { modsText } from '../mods/text';
import { auraFxLines, fxLines, utilityFxLines } from './gemFx';

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
  banner: 'Carried as soon as enemies are near; put down once it holds stages and a fight is on',
} as const;

/** What a utility skill (a curse, a buff, a summon, a blink) does, in plain lines. */
function utilityLines(def: ActiveGemDef, level: number): { stats: string[]; effects: string[] } {
  const u = def.utility;
  if (!u) return { stats: [], effects: [] };
  if (u.kind === 'curse')
    return {
      stats: [
        `Curses enemies in a radius of ${num(u.radius)}, for ${num(hexSeconds(u.hex, level))} seconds`,
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
  if (u.kind === 'buff' && u.banner) {
    const b = u.banner;
    const d = STATUSES[b.enemy.id];
    const per = b.perStage;
    return {
      stats: [
        `Carry it, holding ${num(b.reservePct)}% of your mana; cast again to put it down for ${num(b.placedSeconds)} s`,
        `Gains a stage for each ${b.stageOn === 'kill' ? 'kill' : 'impale'} while carried, up to ${b.maxStages}`,
        `Each stage: ${num(per.area)}% more area, ${num(per.effect)}% more effect, ${num(per.seconds)} s longer once put down`,
        POLICY_TEXT.banner,
      ],
      effects: [
        ...modsText(gemMods(u.mods, level, def.id)),
        `Enemies near it: ${d.text.replace('{v}', num(levelValue(b.enemy.v, level)))}`,
        `Putting it down gives ${BUFFS[b.place.buff].name} for ${num(b.place.secondsPerStage)} s for each stage`,
      ],
    };
  }
  if (u.kind === 'buff' && (u.rage || u.degen))
    return {
      stats: [
        ...(u.rage
          ? [
              `Needs ${num(u.rage.min)} rage; lasts until the rage is gone, which it spends at ${num(u.rage.drain)} a second, ${num(u.rage.accel)}% faster every second`,
            ]
          : [`Lasts ${num(u.seconds)} s`]),
        ...(u.degen
          ? [
              `You lose ${num(u.degen)}% of your life and energy shield each second as physical damage`,
            ]
          : []),
        ...(u.refreshOnKill ? ['A kill renews it'] : []),
        POLICY_TEXT[u.policy],
        ...(u.cooldown
          ? [`${num(u.cooldown)} s cooldown${u.rage ? ', which does not run while it lasts' : ''}`]
          : []),
      ],
      effects: modsText(gemMods(u.mods, level, def.id)),
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
  if (u.kind === 'shout')
    return {
      stats: [
        `Shouts at enemies in a radius of ${num(u.radius)}`,
        POLICY_TEXT.rally,
        `${num(u.cooldown)} s cooldown, shared with the other warcries`,
      ],
      effects: u.statuses.map((s) => {
        const d = STATUSES[s.id];
        const v = levelValue(s.v, level);
        const more = s.perNearby
          ? `, and ${num(levelValue(s.perNearby, level))}% more for each other enemy nearby`
          : '';
        return `${d.name} for ${num(s.seconds)} s: ${d.text
          .replace('{v}', num(v))
          .replace('{x}', num(s.x ?? 0))
          .replace('{n}', '1')}${more}`;
      }),
    };
  if (u.kind === 'summon') {
    const m = MINIONS[u.minion];
    const n = Math.round(levelValue(u.count, level));
    const lines: string[] = [];
    if (u.corpse)
      lines.push(
        `Raises a corpse near you as that monster, at level ${num(levelValue(u.corpse.level, level))}, with the attack it had; ${level >= 13 ? 2 : 1} at a time`,
      );
    else if (u.animate)
      lines.push(
        `Uses up a normal or magic melee weapon on the ground (item level up to ${num(levelValue(u.animate.maxIlvl, level))}); it strikes with that weapon's damage and ${num(levelValue(u.animate.addMin, level))} to ${num(levelValue(u.animate.addMax, level))} added physical damage`,
      );
    else if (u.warden)
      lines.push(
        `Puts the normal or magic armour and weapons on the ground (up to level ${num(levelValue(u.warden.maxReq, level))}) on one Warden, a piece for each cast; ${num(levelValue(u.warden.addMin, level))} to ${num(levelValue(u.warden.addMax, level))} added physical damage`,
      );
    else
      lines.push(
        `Summons ${n} ${m.name}${n === 1 ? '' : 's'}${u.seconds ? ` for ${num(u.seconds)} s` : ''}`,
      );
    lines.push(
      'They follow you and strike the nearest enemy; they can fall, and casting again fills their places',
    );
    if (def.cooldown) lines.push(`${num(levelValue(def.cooldown, level))} s cooldown`);
    const effects = modsText(gemMods(u.ownerMods ?? [], level, def.id));
    if (u.golem)
      effects.push(
        `The other minions deal ${num(levelValue(u.golem.addMin, level))} to ${num(levelValue(u.golem.addMax, level))} added physical damage while it stands`,
        `It deals ${num(u.golem.perNearby)}% more damage for each of them near it, up to ${num(u.golem.cap)}%, and has ${num(levelValue(u.golem.life, level))}% more life`,
      );
    return { stats: lines, effects };
  }
  if (u.kind === 'offering') {
    const fx: [string, LevelValue | undefined, string][] = [
      ['Minions attack', u.atkInc, '% faster'],
      ['Minions move', u.moveInc, '% faster'],
      ['Minions cast', u.castInc, '% faster'],
      ['Minions have', u.blockAtk, '% more chance to block attacks'],
      ['Minions have', u.blockSpell, '% more chance to block spells'],
      ['Minions recover', u.healOnBlock, ' life when they block'],
      ['Minions gain', u.physAsChaos, '% of their physical damage as chaos damage'],
      ['Minions have', u.res, '% to all elemental resistances'],
    ];
    return {
      stats: [
        `Uses a corpse and up to ${u.maxCorpses - 1} more about it; lasts ${num(u.seconds)} s and ${num(u.perCorpse)} s more for each extra corpse`,
        'Only one offering stands at a time; cast when you have minions and a corpse is near',
      ],
      effects: [
        ...fx
          .filter((x) => x[1] !== undefined)
          .map((x) => `${x[0]} ${num(levelValue(x[1]!, level))}${x[2]}`),
        ...(u.esPerCorpse
          ? [
              `Minions gain ${num(u.esPerCorpse)}% of their life as energy shield for each corpse used`,
            ]
          : []),
      ],
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
      return [
        `Chains ${n} time${n === 1 ? '' : 's'}`,
        ...(b.ramp ? [`${b.ramp}% more damage for each chain still to come`] : []),
        ...(b.fork ? ['Each chain also reaches a second enemy beside the first'] : []),
      ];
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
    if (def.utility)
      stats.push(...utilityLines(def, level).stats, ...utilityFxLines(def.utility, level));
    else stats.push(...behaviourLines(def.behaviour, level));
    stats.push(...fxLines(def, level));
    if (def.travel) stats.push(`Carries you up to ${num(def.travel)} toward the target`);
    if (def.ballista) stats.push('A ballista: its totems attack at half speed');
    if (def.mortar)
      stats.push('Arrows come down in a line toward the target and burst where they land');
    if (def.bond)
      stats.push(
        `Its totems cast beams at you and at each other (up to ${num(def.bond.range)} away) that burn what they cross`,
      );
    if (def.ancestral)
      stats.push(
        `Active only while you are within ${num(def.ancestral.range)} of it; the bonus does not stack`,
      );
    if (def.mineRain)
      stats.push(
        `Rains ${def.mineRain.count} smaller bursts around the mine, one more for every ${def.mineRain.perPrior} mines before it`,
      );
    if (def.mineAura) stats.push('Mines near an enemy add fire damage to the hits against it');
    if (def.deploySeconds) stats.push(`What it puts down stands for ${num(def.deploySeconds)} s`);
    if (def.cooldown && def.cooldownUses && def.cooldownUses > 1)
      stats.push(
        `${num(levelValue(def.cooldown, level))} s cooldown, ${def.cooldownUses} uses stored`,
      );
    if (def.selfTrigger) stats.push(triggerText(def.selfTrigger));
    if (def.needsShield) stats.push('Requires a shield');
    if (def.needsTwoHand) stats.push('Requires a two-handed weapon');
    if (def.needsDualWield) stats.push('Requires two weapons');
    if (def.requiresWeapon?.length)
      stats.push(`Requires ${def.requiresWeapon.map(tagLabel).join(' or ')} weapon`);
    if (def.bothWeapons) stats.push('Hits with both weapons when dual wielding');
    effects = [...modsText(gemMods(def.mods, level, def.id)), ...utilityLines(def, level).effects];
    if (def.ancestral)
      effects.push(
        ...modsText(gemMods(def.ancestral.mods, level, def.id)).map(
          (m) => `While it is active: ${m}`,
        ),
      );
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
    if (def.limitWeapon)
      stats.push(`Only works with ${def.limitWeapon.map(tagLabel).join(' or ')} weapons`);
    const extra = Math.round((def.costMult - 1) * 100);
    if (extra) stats.push(`${extra > 0 ? '+' : ''}${extra}% mana cost of the supported skill`);
    effects = [
      ...modsText(gemMods(def.mods, level, def.id)),
      ...modsText(gemMods(def.global ?? [], level, def.id)),
    ];
  } else {
    type = 'Aura gem';
    if (def.reservePct) stats.push(`Reserves ${def.reservePct}% of your mana`);
    if (def.reserveFlat)
      stats.push(`Reserves ${Math.round(levelValue(def.reserveFlat, level))} mana`);
    for (const t of def.triggers ?? []) stats.push(triggerText(t));
    stats.push(...auraFxLines(def, level));
    effects = modsText(gemMods(def.mods, level, def.id));
    // A stance has two sets of effects, one for each stance; the character swaps by policy (a crowd: the Sand stance).
    if (def.stance) {
      stats.push(
        'Two stances; you take the Sand stance when three or more enemies are near, the Blood stance otherwise',
      );
      for (const [name, side] of [
        ['Blood stance', def.stance.blood],
        ['Sand stance', def.stance.sand],
      ] as const) {
        for (const m of modsText(gemMods(side.mods, level, def.id))) effects.push(`${name}: ${m}`);
        if (side.enemies) {
          const s = STATUSES[side.enemies.id];
          effects.push(
            `${name}: enemies near you are ${s.name.toLowerCase()} (${s.text
              .replace('{v}', num(levelValue(side.enemies.v, level)))
              .replace(
                '{x}',
                num(side.enemies.x === undefined ? 0 : levelValue(side.enemies.x, level)),
              )})`,
          );
        }
        if (side.farLess)
          effects.push(
            `${name}: ${num(levelValue(side.farLess, level))}% less damage from attacks by enemies that are not near`,
          );
      }
    }
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
