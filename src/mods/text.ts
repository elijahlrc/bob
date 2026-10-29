import { CONDITION_TEXT, PER_TEXT, STAT_TEXT, TAG_TEXT } from '../data/statText';
import type { DamageType, Mod } from './types';

const TYPE_NAME: Record<DamageType, string> = {
  physical: 'Physical',
  lightning: 'Lightning',
  cold: 'Cold',
  fire: 'Fire',
  chaos: 'Chaos',
};

function fmt(v: number): string {
  const a = Math.abs(v);
  return Number.isInteger(a) ? String(a) : a.toFixed(a < 10 ? 2 : 1).replace(/\.?0+$/, '');
}

function typesPhrase(ts: readonly DamageType[] | undefined): string {
  if (!ts || ts.length === 0) return '';
  const els = ['fire', 'cold', 'lightning'];
  if (ts.length === 3 && els.every((e) => ts.includes(e as DamageType))) return 'Elemental';
  return ts.map((t) => TYPE_NAME[t]).join(' and ');
}

function suffix(m: Mod): string {
  const parts: string[] = [];
  for (const t of m.tags ?? []) if (TAG_TEXT[t]) parts.push(TAG_TEXT[t]);
  if (m.condition) {
    const c = CONDITION_TEXT[m.condition.id] ?? m.condition.id;
    parts.push(m.condition.not ? `unless ${c.replace(/^(while|if you have|against) /, '')}` : c);
  }
  if (m.per) parts.push(`per ${m.per.div} ${PER_TEXT[m.per.stat] ?? m.per.stat}`);
  return parts.length ? ' ' + parts.join(' ') : '';
}

function statName(m: Mod): string {
  if (m.stat === 'damage') {
    const tp = typesPhrase(m.damageTypes);
    return tp ? `${tp} Damage` : 'Damage';
  }
  if (m.stat === 'minDamage' || m.stat === 'maxDamage') {
    const tp = typesPhrase(m.damageTypes);
    return `${m.stat === 'minDamage' ? 'minimum' : 'maximum'} ${tp ? tp + ' ' : ''}Damage`;
  }
  const conv = /^(convert|gain|convertSkill)\.(\w+)\.(\w+)$/.exec(m.stat);
  if (conv) return `${TYPE_NAME[conv[2] as DamageType]} as ${TYPE_NAME[conv[3] as DamageType]}`;
  // "less Physical Damage taken from Hits": a mod limited to damage types names them.
  if (m.stat === 'hitTakenType' || m.stat === 'damageTaken') {
    const tp = typesPhrase(m.damageTypes);
    const what = m.stat === 'hitTakenType' ? 'Damage taken from Hits' : 'Damage taken';
    return tp ? `${tp} ${what}` : what;
  }
  return STAT_TEXT[m.stat]?.name ?? m.stat;
}

/** Render one mod to a player-visible line. */
export function modText(m: Mod): string {
  const t = STAT_TEXT[m.stat];
  // "+2 to Level of Socketed Aura Gems": the tags say which gems.
  if (m.stat === 'gemLevel') {
    const tags = (m.tags ?? []).map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
    return `+${fmt(m.value)} to Level of all ${tags ? tags + ' ' : ''}Skill Gems`;
  }
  if (m.stat === 'socketedGemLevel' && m.tags?.length) {
    const tags = m.tags.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
    return `+${fmt(m.value)} to Level of Socketed ${tags} Gems`;
  }
  const sfx = suffix(m);
  const v = fmt(m.value);
  // Kills give no flask charges of their own (docs/ATTRITION.md): "increased flask charges gained" is a flat gain, 1% of a
  // charge a kill per 1%.
  if (m.stat === 'flaskCharges' && m.kind === 'inc')
    return `${m.value < 0 ? '-' : '+'}${fmt(m.value / 100)} Flask Charges per kill${sfx}`;
  // "of Physical Attack Damage Leeched as Life": leech from attacks names the attacks before the damage.
  if ((m.stat === 'leech.life' || m.stat === 'leech.mana') && m.tags?.includes('attack')) {
    const tp = typesPhrase(m.damageTypes);
    const rest = suffix({ ...m, tags: m.tags.filter((t) => t !== 'attack') });
    return `${v}% of ${tp ? tp + ' ' : ''}Attack Damage Leeched as ${m.stat === 'leech.life' ? 'Life' : 'Mana'}${rest}`;
  }
  const conv = /^(convert|convertSkill|gain)\.(\w+)\.(\w+)$/.exec(m.stat);
  if (conv) {
    const from = TYPE_NAME[conv[2] as DamageType];
    const to = TYPE_NAME[conv[3] as DamageType];
    return conv[1] === 'gain'
      ? `Gain ${v}% of ${from} Damage as Extra ${to} Damage${sfx}`
      : `${v}% of ${from} Damage Converted to ${to} Damage${sfx}`;
  }
  switch (m.kind) {
    case 'flag':
      return (t?.flag ?? m.stat) + sfx;
    case 'override':
      return `${statName(m)} is ${v}${t?.pct ? '%' : ''}${sfx}`;
    case 'base': {
      if (t?.base) {
        const tp = typesPhrase(m.damageTypes);
        return (
          t.base.replace('{v}', v).replace('{types}', tp ? tp + ' ' : '') +
          (m.value < 0 ? '' : '') +
          sfx
        );
      }
      const sign = m.value < 0 ? '-' : '+';
      return t?.pct
        ? `${sign}${v}% to ${statName(m)}${sfx}`
        : `${sign}${v} to ${statName(m)}${sfx}`;
    }
    case 'inc':
      // Damage from attacks: "increased Attack Damage", "increased Elemental Damage with Attack Skills".
      if (m.stat === 'damage' && m.tags?.length === 1 && m.tags[0] === 'attack') {
        const tp = typesPhrase(m.damageTypes);
        const word = m.value < 0 ? 'reduced' : 'increased';
        return tp
          ? `${v}% ${word} ${tp} Damage with Attack Skills${suffix({ ...m, tags: [] })}`
          : `${v}% ${word} Attack Damage${suffix({ ...m, tags: [] })}`;
      }
      // Plain spell damage reads as its own stat, not as damage "with Spells".
      if (
        m.stat === 'damage' &&
        !m.damageTypes?.length &&
        m.tags?.length === 1 &&
        m.tags[0] === 'spell'
      )
        return `${v}% ${m.value < 0 ? 'reduced' : 'increased'} Spell Damage${suffix({ ...m, tags: [] })}`;
      return `${v}% ${m.value < 0 ? 'reduced' : 'increased'} ${statName(m)}${sfx}`;
    case 'more':
      return `${v}% ${m.value < 0 ? 'less' : 'more'} ${statName(m)}${sfx}`;
  }
}

/**
 * The name of what an increase or more multiplier scales, without its number ("Physical Damage", "Attack Speed while
 * Fortified"), for lines that show a total beside it.
 */
export function modLabel(m: Mod): string {
  let s: string;
  if (m.stat === 'damage' && m.tags?.length === 1 && m.tags[0] === 'attack') {
    const tp = typesPhrase(m.damageTypes);
    const rest = suffix({ ...m, tags: [] });
    s = tp ? `${tp} Damage with Attack Skills${rest}` : `Attack Damage${rest}`;
  } else if (
    m.stat === 'damage' &&
    !m.damageTypes?.length &&
    m.tags?.length === 1 &&
    m.tags[0] === 'spell'
  )
    s = `Spell Damage${suffix({ ...m, tags: [] })}`;
  else s = statName(m) + suffix(m);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DEFENCE_NAME: Record<string, string> = {
  armour: 'Armour',
  evasion: 'Evasion',
  es: 'Energy Shield',
};

/** Two increases rolled as one ("Armour and Evasion", "Attack and Cast Speed") are one line. */
function mergedPair(a: Mod, b: Mod): string | null {
  if (a.kind !== 'inc' || b.kind !== 'inc' || a.value !== b.value || a.condition || b.condition)
    return null;
  if (a.stat in DEFENCE_NAME && b.stat in DEFENCE_NAME && a.stat !== b.stat && a.local && b.local)
    return `${fmt(a.value)}% ${a.value < 0 ? 'reduced' : 'increased'} ${DEFENCE_NAME[a.stat]} and ${DEFENCE_NAME[b.stat]}`;
  if (a.stat === 'attackSpeed' && b.stat === 'castSpeed' && !a.tags?.length && !b.tags?.length)
    return `${fmt(a.value)}% ${a.value < 0 ? 'reduced' : 'increased'} Attack and Cast Speed`;
  return null;
}

/**
 * Render a list of mods, merging `damage.min`/`damage.max` pairs into "Adds X to Y" lines.
 */
export function modsText(mods: readonly Mod[]): string[] {
  const out: string[] = [];
  const used = new Set<number>();
  for (let i = 0; i < mods.length; i++) {
    if (used.has(i)) continue;
    const m = mods[i];
    if (m.stat === 'damage.min') {
      const j = mods.findIndex(
        (n, k) =>
          k > i &&
          !used.has(k) &&
          n.stat === 'damage.max' &&
          typesPhrase(n.damageTypes) === typesPhrase(m.damageTypes) &&
          (n.tags ?? []).join() === (m.tags ?? []).join(),
      );
      if (j >= 0) {
        used.add(j);
        const tags = m.tags ?? [];
        const to = tags.includes('attack')
          ? ' to Attacks'
          : tags.includes('spell')
            ? ' to Spells'
            : '';
        const rest = suffix({ ...m, tags: tags.filter((t) => t !== 'attack' && t !== 'spell') });
        out.push(
          `Adds ${fmt(m.value)} to ${fmt(mods[j].value)} ${typesPhrase(m.damageTypes)} Damage${to}${rest}`,
        );
        continue;
      }
    }
    const next = mods[i + 1];
    const both = next && !used.has(i + 1) ? mergedPair(m, next) : null;
    if (both) {
      used.add(i + 1);
      out.push(both);
      continue;
    }
    out.push(modText(m));
  }
  // A flag whose line is said by another mod of the node has no text of its own.
  return out.filter((l) => l.trim() !== '');
}
