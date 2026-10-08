import { Character, type SteadyMode } from '../calc/character';
import { NO_SHIFT } from '../calc/combat';
import { baseXp, monsterHit, monsterLife } from '../calc/formulas';
import { easeDamage, easeLife } from '../data/constants';
import { LEGACY, statLevel, type Difficulty } from '../data/difficulty';
import { mapTypeDef, THRONG_AFFIX, type MapTypeId } from '../data/mapTypes';
import { buildMonster } from '../calc/monster';
import {
  affixMonsterMods,
  affixPlayerMods,
  affixReward,
  affixRarePacks,
  mapAffixDef,
} from '../data/mapAffixes';
import { MONSTER_TYPES, type FactionId, type MonsterTypeId, type Variant } from '../data/monsters';
import type { ThemeDef } from '../data/themes';
import { ELEMENT_WEIGHTS, neverPlain, typeShares } from '../gen/population';

/**
 * What a map theme asks of a build (EXPANSION 5.10 and section 9). The first version works from the
 * theme's monster mix alone; faction profiles and map affixes extend it in X5.
 */
export type ThemeThreat = {
  /** Shares of the incoming damage that are physical, lightning, cold, fire and chaos (sum 1). */
  mix: number[];
  /** Share of the monsters that are each variant (sum 1). */
  variants: Record<Variant, number>;
  /** Damage rate × time to kill, relative to the plain mix of monsters (1 = average). */
  pressure: number;
};

const ELEMENT_INDEX: Record<Variant, number> = { none: 0, lightning: 1, cold: 2, fire: 3 };
const CONVERT_TARGET: Record<string, number> = { lightning: 1, cold: 2, fire: 3, chaos: 4 };

/** The share of a type's physical damage that it converts by nature (the Rot to chaos, the Hollow to cold). */
function innateConversion(id: MonsterTypeId): { to: number; share: number } | null {
  for (const m of MONSTER_TYPES[id].mods) {
    const [kind, from, to] = m.stat.split('.');
    if (kind === 'convert' && from === 'physical' && CONVERT_TARGET[to])
      return { to: CONVERT_TARGET[to], share: m.value / 100 };
  }
  return null;
}
/** What a faction's behaviours add to its raw numbers (zones, raising, blinking), as a multiplier. */
const FACTION_PRESSURE: Record<FactionId, number> = {
  ossuary: 1,
  rot: 1.25,
  hollow: 1.2,
  choir: 1.3,
  swarm: 1.3,
  reliquary: 1.3,
  kennel: 1.3,
  gilded: 1.25,
};
const ALL_VARIANTS = Object.keys(ELEMENT_WEIGHTS) as Variant[];

function rawThreat(
  theme: Pick<ThemeDef, 'typeWeights' | 'elementWeights' | 'factions'>,
): ThemeThreat {
  const mix = [0, 0, 0, 0, 0];
  const variants: Record<Variant, number> = { none: 0, fire: 0, cold: 0, lightning: 0 };
  let pressure = 0;
  let total = 0;
  for (const [id, typeShare] of typeShares(theme)) {
    const t = MONSTER_TYPES[id];
    const innate = t.innate ? innateConversion(id) : null;
    const vs = t.innate
      ? (['none'] as Variant[])
      : ALL_VARIANTS.filter((v) => !neverPlain(id) || v !== 'none');
    const weight = (v: Variant) => ELEMENT_WEIGHTS[v] * (theme.elementWeights[v] ?? 1);
    const vTotal = vs.reduce((s, v) => s + weight(v), 0);
    for (const v of vs) {
      const share = (typeShare * weight(v)) / vTotal;
      // Variants turn part of the physical damage into their element (mages all of it).
      const conv = v === 'none' ? 0 : id === 'mage' ? 1 : 0.6;
      const dmg = share * t.dmgMult;
      if (innate) {
        mix[0] += dmg * (1 - innate.share);
        mix[innate.to] += dmg * innate.share;
      } else {
        mix[0] += dmg * (1 - conv);
        mix[ELEMENT_INDEX[v]] += dmg * conv;
      }
      variants[v] += share;
      pressure += (share * t.dmgMult * t.lifeMult) / t.attackTime;
      total += share;
    }
  }
  const dmgTotal = mix.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 5; i++) mix[i] /= dmgTotal;
  for (const v of ALL_VARIANTS) variants[v] /= total;
  return { mix, variants, pressure: pressure / total };
}

const BASE_PRESSURE = rawThreat({ typeWeights: {}, elementWeights: {} }).pressure;

export function themeThreat(theme: ThemeDef): ThemeThreat {
  const t = rawThreat(theme);
  return { ...t, pressure: t.pressure / BASE_PRESSURE };
}

/** What a map's affixes do to the monsters, in a form the threat model can use (on a map of this level). */
export function affixThreat(
  affixes: string[],
  level: number,
): {
  life: number;
  /** Damage rate: "more damage" and the speed at which monsters attack. */
  damage: number;
  /** Extra damage as a share of the physical damage, per type (physical, lightning, cold, fire, chaos). */
  gain: number[];
  cannotEvade: boolean;
  /** What the mods cannot say (crits, penetration, stun, regeneration, ...): a multiplier on how hard the map is. */
  pressure: number;
} {
  let life = 1;
  let damage = 1;
  const gain = [0, 0, 0, 0, 0];
  const GAIN_INDEX: Record<string, number> = { lightning: 1, cold: 2, fire: 3, chaos: 4 };
  let cannotEvade = false;
  let pressure = 1;
  for (const id of affixes) {
    for (const m of affixMonsterMods(id, level)) {
      if (m.stat === 'life' && m.kind === 'more') life *= 1 + m.value / 100;
      if (m.stat === 'damage' && m.kind === 'more') damage *= 1 + m.value / 100;
      if (m.stat === 'attackSpeed' && m.kind === 'inc') damage *= 1 + m.value / 100;
      if (m.stat.startsWith('gain.physical.')) {
        const k = GAIN_INDEX[m.stat.slice('gain.physical.'.length)];
        if (k !== undefined) gain[k] += m.value / 100;
      }
      if (m.stat === 'alwaysHit') cannotEvade = true;
    }
    pressure *= mapAffixDef(id).pressure ?? 1;
    // More monsters and more rare packs make a map harder in ways the mods do not show.
    const def = mapAffixDef(id);
    if (def.packSize && !def.pressure && !def.fixed) pressure *= 1 + def.packSize * 0.5;
    if (affixRarePacks(id, level) > 0 && !def.pressure)
      pressure *= 1 + 0.03 * affixRarePacks(id, level);
  }
  return { life, damage, gain, cannotEvade, pressure };
}

/** A small value for what a theme and its affixes pay out, as a fraction of a normal map's rewards. */
export function themeReward(
  theme: ThemeDef,
  affixes: string[] = [],
  level = 100,
  type: MapTypeId = 'plain',
): number {
  let r =
    0.5 * theme.itemQuantity +
    0.3 * (theme.rareWeightMult - 1) +
    0.6 * (theme.xpMult - 1) +
    0.05 * theme.extraRarePacks +
    0.03 * theme.extraChests +
    // Extra essences and currency are worth about a fifth and a tenth of the same share of item quantity.
    0.2 * (theme.extraEssence ?? 0) +
    0.1 * (theme.extraCurrency ?? 0) +
    (theme.bonusCurrency ? 0.03 : 0);
  for (const id of affixes) {
    const a = mapAffixDef(id);
    const w = affixReward(a, level);
    r += 0.5 * (w.quantity ?? 0) + 0.3 * (w.rarity ?? 0);
    // Experience counts as the themes' XP bonus does; currency as a tenth of the same share of quantity.
    r += 0.6 * (w.experience ?? 0) + 0.1 * (w.currency ?? 0);
    r += 0.05 * affixRarePacks(id, level);
  }
  // The map type pays too; a Quarry's three guaranteed rare drops and currency stacks are worth about a third more.
  const tr = mapTypeDef(type).reward;
  r += 0.5 * (tr.quantity ?? 0) + 0.3 * (tr.rarity ?? 0) + 0.6 * (tr.experience ?? 0);
  if (type === 'quarry') r += 0.3;
  return r;
}

export type ThemeScore = {
  /** DPS against this theme's monsters, and effective HP against its damage mix. */
  dps: number;
  ehp: number;
  pressure: number;
  /** The number the bot ranks themes by: survival first, rewards as a tiebreaker. */
  value: number;
};

/** How much harder the monsters of one level are than those of another: their blows times their life (with the early easing). */
export function levelHardness(level: number, ref: number, d: Difficulty = LEGACY): number {
  const f = (m: number) =>
    monsterHit(statLevel(m, d)) * easeDamage(m) * monsterLife(statLevel(m, d)) * easeLife(m);
  return f(level) / f(ref);
}

/**
 * How a character fares against a theme and its map affixes: DPS against the monsters it will meet,
 * effective HP against the damage they deal, and how hard the monsters are to kill and to survive.
 */
export function scoreTheme(
  ch: Character,
  theme: ThemeDef,
  mode: SteadyMode,
  affixes: string[] = [],
  type: MapTypeId = 'plain',
  /** The level offers are compared at (the map number): a higher offer is harder and pays more XP. Default: its own. */
  refLevel?: number,
): ThemeScore {
  const threat = themeThreat(theme);
  const level = ch.config.areaLevel;
  const hard = refLevel === undefined ? 1 : levelHardness(level, refLevel, ch.config.difficulty);
  const pay = refLevel === undefined ? 1 : Math.sqrt(baseXp(level) / baseXp(refLevel));
  // A Throng's monsters carry its hidden affix (fewer hit points and weaker blows, and a much bigger crowd).
  const onMonsters = type === 'throng' ? [...affixes, THRONG_AFFIX] : affixes;
  const a = affixThreat(onMonsters, level);
  // Affixes that change the player change the character itself.
  const playerMods = affixes.flatMap((id) => affixPlayerMods(id, level));
  const me = playerMods.length
    ? new Character(ch.build, { ...ch.config, extraMods: [...ch.config.extraMods, ...playerMods] })
    : ch;
  const conds = me.steadyMask(mode);
  let dps = 0;
  for (const v of ALL_VARIANTS) {
    if (threat.variants[v] <= 0) continue;
    const def = buildMonster({
      type: 'warrior',
      variant: v,
      rarity: 'normal',
      level,
      mods: [],
      affix: onMonsters,
    }).defence;
    const s = me.skillSheet(me.primary, { def, shock: 0, resShift: [...NO_SHIFT] }, conds);
    dps += threat.variants[v] * s.sustainedDps;
  }
  // The Hollow are ethereal (half physical damage taken) and evasive: a build is slower to kill them.
  const hollow = typeShares(theme)
    .filter(([id]) => MONSTER_TYPES[id].faction === 'hollow')
    .reduce((n, [, share]) => n + share, 0);
  if (hollow > 0) {
    const against = (type: MonsterTypeId) =>
      me.skillSheet(
        me.primary,
        {
          def: buildMonster({
            type,
            variant: 'none',
            rarity: 'normal',
            level,
            mods: [],
            affix: affixes,
          }).defence,
          shock: 0,
          resShift: [...NO_SHIFT],
        },
        conds,
      ).sustainedDps;
    const ratio = against('gloomstalker') / Math.max(1e-9, against('warrior'));
    dps *= 1 - hollow + hollow * ratio;
  }
  const g = a.gain.reduce((s, x) => s + x, 0);
  const mix = g > 0 ? threat.mix.map((x, i) => (x + a.gain[i]) / (1 + g)) : threat.mix;
  const defence = me.defence(conds);
  const ehp = me.ehp(a.cannotEvade ? { ...defence, cannotEvade: true } : defence, mix);
  // Corpse raising, ground clouds and blinking add to what the plain numbers say.
  const mechanics = typeShares(theme).reduce(
    (n, [id, share]) => n + share * (FACTION_PRESSURE[MONSTER_TYPES[id].faction] - 1),
    1,
  );
  const pressure =
    threat.pressure *
    mechanics *
    a.life *
    a.damage *
    (1 + g) *
    a.pressure *
    mapTypeDef(type).pressure *
    hard;
  const value =
    ((Math.max(0.1, dps) * ehp) / pressure) * (1 + themeReward(theme, affixes, level, type)) * pay;
  return { dps, ehp, pressure, value };
}

/** A map with nothing special, to compare others against. */
const NEUTRAL: ThemeDef = {
  id: 'neutral',
  name: 'Neutral',
  elementWeights: {},
  typeWeights: {},
  itemQuantity: 0,
  rareWeightMult: 1,
  xpMult: 1,
  extraRarePacks: 0,
  extraChests: 0,
  bonusText: '',
  floor: 0,
  wall: 0,
};

/** How a build fares on a map as a share of how it fares on a plain one at the same level, with the life it arrives with. */
export function survivalRatio(
  ch: Character,
  theme: ThemeDef,
  mode: SteadyMode,
  affixes: string[],
  type: MapTypeId,
  lifeFrac: number,
  refLevel?: number,
): number {
  const base = scoreTheme(ch, NEUTRAL, mode, []);
  const here = scoreTheme(ch, theme, mode, affixes, type, refLevel);
  const per = (s: ThemeScore) => (Math.max(0.1, s.dps) * s.ehp) / s.pressure;
  return (per(here) / Math.max(1e-9, per(base))) * Math.max(0.05, Math.min(1, lifeFrac));
}

/** The threat preview of EXPANSION section 9: your DPS and effective HP on a map, against a plain one. */
export function threatPreview(
  ch: Character,
  theme: ThemeDef,
  mode: SteadyMode,
  affixes: string[] = [],
  type: MapTypeId = 'plain',
): { dps: number; ehp: number } {
  const base = scoreTheme(ch, NEUTRAL, mode, []);
  const here = scoreTheme(ch, theme, mode, affixes, type);
  const a = affixThreat(
    type === 'throng' ? [...affixes, THRONG_AFFIX] : affixes,
    ch.config.areaLevel,
  );
  // Tougher monsters take longer to kill, and harder-hitting ones take more of your life per hit.
  return {
    dps: here.dps / Math.max(1e-9, base.dps) / a.life,
    // Gained damage of any type is extra damage on top of what the monsters already deal.
    ehp:
      here.ehp /
      Math.max(1e-9, base.ehp) /
      (a.damage * (1 + a.gain.reduce((s, x) => s + x, 0)) * a.pressure * mapTypeDef(type).pressure),
  };
}
