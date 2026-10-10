import type { Character } from '../calc/character';
import { armourReduction, effectiveRes, hitChance } from '../calc/formulas';
import { buildMonster, scaleFor } from '../calc/monster';
import { BOSSES, SENTENCE_MULT, WITNESSES, WITNESS_WEIGHT, type BossId } from '../data/bosses';
import { LEGACY } from '../data/difficulty';

/**
 * What the camp says about the next boss, read from the character (docs/BOSSES.md 10): a few lines, each marked ok, warn
 * or bad, from the same numbers as the character sheet. The card says what the boss is; these say where the build stands.
 */
export type Readiness = { level: 'ok' | 'warn' | 'bad'; text: string };

const RES_NAMES = ['physical', 'lightning', 'cold', 'fire', 'chaos'];

/** The boss as it will be on its map, under the run's difficulty. */
function bossStats(id: BossId, ch: Character) {
  const b = BOSSES[id];
  const d = ch.config.difficulty ?? LEGACY;
  return buildMonster({
    type: b.type,
    variant: 'none',
    rarity: 'boss',
    level: b.map,
    mods: id === 'magistrate' ? ['hexWarded'] : [],
    ...scaleFor(b.map, d),
  });
}

function avgHit(stats: ReturnType<typeof buildMonster>): number {
  let s = 0;
  for (const c of stats.profile(0).hands[0]?.chunks ?? []) s += (c.min + c.max) / 2;
  return s;
}

/** The damage types the main skill deals (indices), by its share of the damage. */
function mainTypes(ch: Character): number[] {
  const p = ch.profile(ch.primary);
  const by = [0, 0, 0, 0, 0];
  for (const h of p.hands) for (const c of h.chunks) by[c.type] += (c.min + c.max) / 2;
  const total = by.reduce((a, b) => a + b, 0) || 1;
  return by.map((x, i) => (x / total >= 0.15 ? i : -1)).filter((i) => i >= 0);
}

function resLine(ch: Character, t: number, why: string): Readiness {
  const def = ch.defence();
  const r = Math.round(effectiveRes(def.res[t], def.maxRes[t]));
  return {
    level: r >= 60 ? 'ok' : r >= 30 ? 'warn' : 'bad',
    text: `Your ${RES_NAMES[t]} resistance is ${r}% (${why}).`,
  };
}

export function bossReadiness(ch: Character, id: BossId): Readiness[] {
  const out: Readiness[] = [];
  const def = ch.defence();
  const prof = ch.profile(ch.primary);
  const types = mainTypes(ch);
  const melee = prof.skill.behaviour.kind === 'melee';
  const stats = bossStats(id, ch);
  switch (id) {
    case 'tollkeeper': {
      out.push(resLine(ch, 1, 'its tolls are lightning'));
      if (types.length === 1 && types[0] === 1)
        out.push({
          level: 'warn',
          text: 'Your main skill deals only lightning, which it resists.',
        });
      if (types.includes(2))
        out.push({
          level: 'ok',
          text: 'You deal cold: it is weak to cold, and chill slows its clock.',
        });
      if (types.length === 1 && types[0] === 0 && !melee)
        out.push({
          level: 'warn',
          text: 'Its armour takes the most from many small physical hits.',
        });
      break;
    }
    case 'courser': {
      out.push(resLine(ch, 3, 'it deals fire'));
      if (prof.isAttack) {
        const c = Math.round(hitChance(prof.hands[0]?.accuracy ?? 0, stats.defence.evasion) * 100);
        out.push({
          level: c >= 80 ? 'ok' : c >= 60 ? 'warn' : 'bad',
          text: `Your hit chance against it is ${c}% (it is evasive; spells always hit).`,
        });
      }
      if (melee)
        out.push({
          level: 'warn',
          text: 'Your main skill is melee: it is in reach only while it circles you.',
        });
      if (types.includes(2))
        out.push({ level: 'ok', text: 'You deal cold: chill and freeze slow it down.' });
      break;
    }
    case 'magistrate': {
      const pool = def.maxLife - ch.reservedLife + def.maxEs;
      const raw = avgHit(stats) * SENTENCE_MULT * (1 + WITNESS_WEIGHT * WITNESSES);
      const taken = raw * (1 - Math.min(0.9, armourReduction(def.armour, raw) + def.physReduction));
      const share = Math.round((taken / Math.max(1, pool)) * 100);
      out.push({
        level: share < 45 ? 'ok' : share < 75 ? 'warn' : 'bad',
        text: `Its Sentence, with all four Witnesses, is about ${share}% of your life and energy shield.`,
      });
      if (def.cannotBeStunned || def.stunAvoid >= 0.5)
        out.push({ level: 'ok', text: 'You avoid stuns: the Sentence will not leave you open.' });
      else out.push({ level: 'warn', text: 'The Sentence stuns: stun avoidance would help.' });
      if (prof.skill.type === 'spell')
        out.push({
          level: 'warn',
          text: 'It blocks a quarter of spells; lightning hurts it more.',
        });
      break;
    }
    case 'prismWarden': {
      for (const t of [1, 2, 3]) {
        const line = resLine(ch, t, 'it attunes to each element in turn');
        if (line.level !== 'ok') out.push(line);
      }
      if (out.length === 0)
        out.push({ level: 'ok', text: 'All three of your elemental resistances are high.' });
      const ele = types.filter((t) => t >= 1 && t <= 3);
      if (ele.length === 1 && types.length === 1)
        out.push({
          level: 'warn',
          text: `Your main skill deals only ${RES_NAMES[ele[0]]}: it is immune to that a third of the time.`,
        });
      break;
    }
    case 'rotwife': {
      out.push(resLine(ch, 4, 'up to half of her damage is chaos'));
      const kinds = new Set<string>();
      for (const f of ch.flasks) {
        if (f.removeBleed) kinds.add('bleeding');
        if (f.removePoison) kinds.add('poison');
        if (f.removeIgnite) kinds.add('burning');
        if (f.removeFreeze) kinds.add('freeze');
        if (f.removeShock) kinds.add('shock');
      }
      out.push({
        level: kinds.size >= 2 ? 'ok' : kinds.size === 1 ? 'warn' : 'bad',
        text: kinds.size
          ? `Your flasks cleanse ${[...kinds].join(', ')} (she inflicts every ailment).`
          : 'No cleansing flask (she inflicts every ailment).',
      });
      break;
    }
    case 'unmaker': {
      const over = [1, 2, 3].map((t) => def.res[t] - def.maxRes[t]);
      const best = Math.max(...over);
      out.push({
        level: best >= 50 ? 'ok' : best >= 20 ? 'warn' : 'bad',
        text: `Your highest resistance is overcapped by ${Math.max(0, Math.round(best))}: it takes 50 of it.`,
      });
      if (types.length === 1)
        out.push({
          level: 'warn',
          text: `You deal only ${RES_NAMES[types[0]]}: it hardens against what it is dealt most.`,
        });
      break;
    }
  }
  return out;
}
