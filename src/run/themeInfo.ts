import type { Character } from '../calc/character';
import { effectiveRes } from '../calc/formulas';
import { FACTION_NAMES, MONSTER_TYPES, type FactionId, type MonsterTypeId } from '../data/monsters';
import {
  FACTION_ASKS,
  FACTION_RULES,
  TAG_ORDER,
  TYPE_BLURBS,
  TYPE_TAGS,
  type ThreatTag,
} from '../data/monsterInfo';
import { ABILITY_INFO, abilitiesOf } from '../data/abilities';
import { THRONG_AFFIX, type MapTypeId } from '../data/mapTypes';
import type { ThemeDef } from '../data/themes';
import { typeShares } from '../gen/population';
import { affixThreat, themeThreat } from './threat';

/**
 * What a map is made of, for the camp card (docs/ENEMIES.md 5.1): the factions and their shares, what each asks, the
 * damage the monsters deal by type, the commonest types and the threat tags. Derived from the data, so a new type shows up on
 * its own.
 */
export type ThemeInfo = {
  /** Factions by share, largest first. */
  factions: { id: FactionId; name: string; share: number }[];
  /** One line per faction that is a quarter or more of the monsters. */
  asks: { id: FactionId; name: string; text: string }[];
  /** Shares of the monsters' damage that are physical, lightning, cold, fire and chaos (sum 1), affixes included. */
  mix: number[];
  /** The commonest types, with the share of all monsters. */
  types: { id: MonsterTypeId; name: string; blurb: string; share: number; faction: FactionId }[];
  /** At most four, in the fixed order of `TAG_ORDER`. */
  tags: ThreatTag[];
  /** Faction rules that apply (a quarter or more of the monsters). */
  rules: string[];
};

/** A faction is "present" at this share. */
export const PRESENT_SHARE = 0.25;
/** A tag shows when the types that carry it are this share of the monsters (a ranged one needs more). */
export const TAG_SHARE = 0.08;
export const RANGED_SHARE = 0.25;
export const MAX_TAGS = 4;
export const MAX_TYPES = 4;

export function themeInfo(
  theme: ThemeDef,
  affixes: string[] = [],
  type: MapTypeId = 'plain',
  level = 1,
): ThemeInfo {
  const shares = typeShares(theme);
  const byFaction = new Map<FactionId, number>();
  const tagShare = new Map<ThreatTag, number>();
  let ranged = 0;
  for (const [id, share] of shares) {
    const def = MONSTER_TYPES[id];
    byFaction.set(def.faction, (byFaction.get(def.faction) ?? 0) + share);
    if (def.attack !== 'melee') ranged += share;
    // A tag counts once per type, whether the type lists it or an ability of the type carries it.
    const mine = new Set<ThreatTag>(TYPE_TAGS[id] ?? []);
    for (const ab of abilitiesOf(id))
      if (ABILITY_INFO[ab.id].tag) mine.add(ABILITY_INFO[ab.id].tag!);
    for (const tag of mine) tagShare.set(tag, (tagShare.get(tag) ?? 0) + share);
    if (def.role === 'swarm' && !mine.has('swarm'))
      tagShare.set('swarm', (tagShare.get('swarm') ?? 0) + share);
  }
  tagShare.set('ranged', ranged);
  const factions = [...byFaction]
    .map(([id, share]) => ({ id, name: FACTION_NAMES[id], share }))
    .sort((a, b) => b.share - a.share);
  const present = factions.filter((f) => f.share >= PRESENT_SHARE);
  const tags = TAG_ORDER.map((t) => [t, tagShare.get(t) ?? 0] as const)
    .filter(([t, s]) => s >= (t === 'ranged' ? RANGED_SHARE : TAG_SHARE))
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TAGS)
    .map(([t]) => t)
    .sort((a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b));
  // The damage mix: the types' own, with the damage the map's affixes add on top.
  const t = themeThreat(theme);
  const a = affixThreat(type === 'throng' ? [...affixes, THRONG_AFFIX] : affixes, level);
  const g = a.gain.reduce((s, x) => s + x, 0);
  const mix = g > 0 ? t.mix.map((x, i) => (x + a.gain[i]) / (1 + g)) : t.mix;
  return {
    factions,
    asks: present.map((f) => ({ id: f.id, name: f.name, text: FACTION_ASKS[f.id] })),
    mix,
    types: [...shares]
      .sort((x, y) => y[1] - x[1])
      .slice(0, MAX_TYPES)
      .map(([id, share]) => ({
        id,
        name: MONSTER_TYPES[id].name,
        blurb: TYPE_BLURBS[id],
        share,
        faction: MONSTER_TYPES[id].faction,
      })),
    tags,
    rules: present.map((f) => FACTION_RULES[f.id]).filter((r): r is string => !!r),
  };
}

const MIX_NAMES = ['physical', 'lightning', 'cold', 'fire', 'chaos'];

/**
 * The one resistance of the character that the map leans on hardest, as a sentence ("Your chaos resistance is -20%
 * against 35% chaos damage"), or null when nothing stands out: the damage share is a tenth or more and the resistance
 * (after the map's penalty) under half.
 */
export function weakestAxis(ch: Character, mix: number[]): string | null {
  const def = ch.defence();
  let best: { i: number; res: number; share: number; exposure: number } | null = null;
  for (let i = 1; i < 5; i++) {
    if (def.immune[i]) continue;
    const res = effectiveRes(def.res[i], def.maxRes[i]);
    const share = mix[i] ?? 0;
    if (share < 0.1 || res >= 50) continue;
    const exposure = share * (1 - res / 100);
    if (!best || exposure > best.exposure) best = { i, res, share, exposure };
  }
  if (!best) return null;
  return `Your ${MIX_NAMES[best.i]} resistance is ${Math.round(best.res)}% against ${Math.round(best.share * 100)}% ${MIX_NAMES[best.i]} damage`;
}
