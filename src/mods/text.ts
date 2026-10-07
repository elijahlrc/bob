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
  return STAT_TEXT[m.stat]?.name ?? m.stat;
}

/** Render one mod to a player-visible line. */
export function modText(m: Mod): string {
  const t = STAT_TEXT[m.stat];
  // "+2 to Level of Socketed Aura Gems": the tags say which gems.
  if (m.stat === 'socketedGemLevel' && m.tags?.length) {
    const tags = m.tags.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
    return `+${fmt(m.value)} to Level of Socketed ${tags} Gems`;
  }
  const sfx = suffix(m);
  const v = fmt(m.value);
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
      return `${v}% ${m.value < 0 ? 'reduced' : 'increased'} ${statName(m)}${sfx}`;
    case 'more':
      return `${v}% ${m.value < 0 ? 'less' : 'more'} ${statName(m)}${sfx}`;
  }
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
    out.push(modText(m));
  }
  return out;
}
