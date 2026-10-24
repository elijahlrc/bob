import {
  gemAttrReq,
  gemLevelReq,
  gemMods,
  levelValue,
  scaleLevel,
  spellDamageAt,
} from '../calc/gems';
import { type ActiveGemDef, type GemDef, type LevelValue, type SkillBehaviour } from '../data/gems';
import { BUFFS } from '../data/buffs';
import { HEXES, hexEffect, hexSeconds, hexText } from '../data/hexes';
import { STATUSES } from '../data/statuses';
import { MINIONS } from '../data/minions';
import { triggerCause, triggerText } from '../data/triggers';
import { modsText } from '../mods/text';
import { auraFxLines, fxLines, utilityFxLines } from './gemFx';

/** A gem's mods at a level as card lines; one worth nothing at this level ("0% increased Projectile Speed") is left out. */
function cardMods(...args: Parameters<typeof gemMods>): string[] {
  return modsText(
    gemMods(...args).filter(
      (m) =>
        m.kind === 'flag' || m.value !== 0 || m.stat === 'damage.min' || m.stat === 'damage.max',
    ),
  );
}

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
        // Rendered together, so an added-damage pair reads as one line ("Adds 9 to 12 Chaos Damage against them").
        ...modsText(
          (HEXES[u.hex].selfMods ?? []).map((m) => {
            const t = Math.max(0, Math.min(1, (level - 1) / 19));
            return {
              stat: m.stat,
              kind: m.kind,
              value: Math.round(m.low + (m.high - m.low) * t),
              tags: m.tags,
              damageTypes: m.damageTypes,
            };
          }),
        ).map((x) => `${x} against them`),
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
        `Each stage: ${num(per.area)}% more area, ${num(per.effect)}% more effect (on you and on enemies), ${num(per.seconds)} s longer once put down`,
        POLICY_TEXT.banner,
        ...(u.cooldown ? [`${num(u.cooldown)} s cooldown`] : []),
      ],
      effects: [
        ...cardMods(u.mods, level, def.id),
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
      effects: cardMods(u.mods, level, def.id),
    };
  if (u.kind === 'buff')
    return {
      stats: [
        `Lasts ${num(u.seconds)} s`,
        u.second ? 'Used when a crowd closes in or you are hurt' : POLICY_TEXT[u.policy],
        ...(u.cooldown ? [`${num(u.cooldown)} s cooldown`] : []),
      ],
      effects: cardMods(u.mods, level, def.id),
    };
  if (u.kind === 'shout') {
    // A warcry shouts and shares its cooldown with the other warcries; a channelled touch (Rot Touch) does neither.
    const cry = def.tags.includes('warcry');
    return {
      stats: cry
        ? [
            `Shouts at enemies in a radius of ${num(u.radius)}`,
            POLICY_TEXT.rally,
            `${num(u.cooldown)} s cooldown, shared with the other warcries`,
          ]
        : [
            `Afflicts enemies in a radius of ${num(u.radius)}`,
            u.policy === 'upkeep'
              ? 'Channelled while an enemy is within it'
              : POLICY_TEXT[u.policy ?? 'rally'],
            `${num(u.cooldown)} s between uses`,
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
  }
  if (u.kind === 'summon') {
    const m = MINIONS[u.minion];
    const n = Math.round(levelValue(u.count, level));
    const lines: string[] = [];
    if (u.corpse)
      lines.push(
        `Raises a corpse near you as that monster, at level ${num(levelValue(u.corpse.level, level))}, with the attack it had; ${level >= 13 ? 2 : 1} at a time`,
      );
    else
      lines.push(
        `Summons ${n} ${m.name}${n === 1 ? '' : 's'}${u.seconds ? ` for ${num(u.seconds)} s` : ''}`,
      );
    lines.push(
      'They follow you and strike the nearest enemy; they can fall, and casting again fills their places',
    );
    if (def.cooldown) lines.push(`${num(levelValue(def.cooldown, level))} s cooldown`);
    const effects = cardMods(u.ownerMods ?? [], level, def.id);
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
      ...(def.cooldown === undefined ? [`${num(u.cooldown)} s cooldown`] : []),
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
        ...(b.count === undefined
          ? []
          : [
              b.spread === 'stack'
                ? `Comes down as ${b.count} explosions on the same place; each extra projectile is one more`
                : `Comes down as ${b.count} arrows; extra projectiles land on rings round it and reach more ground, and an enemy is hit once`,
            ]),
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
      const r = spellDamageAt(d, def.effectiveness ?? 100, level, scaleLevel(def, level));
      stats.push(`Deals ${r.min} to ${r.max} ${cap(r.type)} damage`);
    }
    if (def.castTime) stats.push(`Cast time ${num(def.castTime)} s`);
    if (def.crit) stats.push(`Base critical chance ${num(def.crit)}%`);
    if (def.utility)
      stats.push(...utilityLines(def, level).stats, ...utilityFxLines(def.utility, level));
    else stats.push(...behaviourLines(def.behaviour, level));
    stats.push(...fxLines(def, level));
    if (def.spin)
      stats.push(
        `Spins as you run up to ${num(def.travel ?? 0)} toward the target, hitting everything within ${num(def.spin.radius)} of you ${def.spin.hits} times in one use, and spinning on where you stop`,
      );
    else if (def.travel)
      stats.push(
        def.channel
          ? 'Carries you toward the target as you spin, at your movement speed'
          : `Carries you up to ${num(def.travel)} toward the target`,
      );
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
    // A blink's own cooldown is the stored-uses one; any other skill's line is made in fxLines or utilityLines.
    if (def.utility?.kind === 'blink' && def.cooldown !== undefined)
      stats.push(
        `${num(levelValue(def.cooldown, level))} s cooldown${def.cooldownUses && def.cooldownUses > 1 ? `, ${def.cooldownUses} uses stored` : ''}`,
      );
    if (def.selfTrigger) stats.push(triggerText(def.selfTrigger, true));
    if (def.needsShield) stats.push('Requires a shield');
    if (def.needsTwoHand) stats.push('Requires a two-handed weapon');
    if (def.needsDualWield) stats.push('Requires two weapons');
    if (def.requiresWeapon?.length)
      stats.push(`Requires ${def.requiresWeapon.map(tagLabel).join(' or ')} weapon`);
    if (def.bothWeapons) stats.push('Hits with both weapons when dual wielding');
    effects = [...cardMods(def.mods, level, def.id), ...utilityLines(def, level).effects];
    if (def.ancestral)
      effects.push(
        ...cardMods(def.ancestral.mods, level, def.id).map((m) => `While it is active: ${m}`),
      );
  } else if (def.kind === 'support') {
    type = 'Support gem';
    stats.push(
      def.supports.length
        ? `Supports ${def.supports.map(tagLabel).join(' or ')} skills`
        : 'Supports any skill',
    );
    if (def.needs?.length) stats.push(`Needs ${def.needs.map(tagLabel).join(' and ')} skills`);
    if (def.excludes?.length) stats.push(`Not ${def.excludes.map(tagLabel).join(' or ')} skills`);
    if (def.trigger)
      stats.push(
        `Linked spells are cast ${triggerCause(def.trigger)} (${def.trigger.cooldown} s cooldown)`,
      );
    for (const t of def.extraTriggers ?? []) stats.push(triggerText(t));
    if (def.curseAura)
      stats.push(
        `Stands on every enemy you hit, and reserves ${def.curseAura.reservePct}% of your mana`,
      );
    if (def.limitWeapon)
      stats.push(`Only works with ${def.limitWeapon.map(tagLabel).join(' or ')} weapons`);
    const extra = Math.round((def.costMult - 1) * 100);
    if (extra) stats.push(`${extra > 0 ? '+' : ''}${extra}% mana cost of the supported skill`);
    effects = [...cardMods(def.mods, level, def.id), ...cardMods(def.global ?? [], level, def.id)];
  } else {
    type = 'Aura gem';
    if (def.reservePct) stats.push(`Reserves ${def.reservePct}% of your mana`);
    if (def.reserveFlat)
      stats.push(`Reserves ${Math.round(levelValue(def.reserveFlat, level))} mana`);
    for (const t of def.triggers ?? []) stats.push(triggerText(t));
    stats.push(...auraFxLines(def, level));
    effects = cardMods(def.mods, level, def.id);
    // A stance has two sets of effects, one for each stance; the character swaps by policy (a crowd: the Sand stance).
    if (def.stance) {
      stats.push(
        'Two stances; you take the Sand stance when three or more enemies are near, the Blood stance otherwise',
      );
      for (const [name, side] of [
        ['Blood stance', def.stance.blood],
        ['Sand stance', def.stance.sand],
      ] as const) {
        for (const m of cardMods(side.mods, level, def.id)) effects.push(`${name}: ${m}`);
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
  const attrs = gemAttrReq(def.attr, scaleLevel(def, level));
  const req = [`level ${gemLevelReq(def, level)}`];
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
