import { BASE_CRIT_MULTI, MONSTER_CRIT_MULTI, easeDamage, easeLife } from '../data/constants';
import {
  FACTION_MODS,
  MONSTER_TYPES,
  RARITY_MULTS,
  type MonsterTypeDef,
  monsterModDef,
  variantMods,
  type MonsterModId,
  type MonsterRarity,
  type MonsterTypeId,
  type Variant,
} from '../data/monsters';
import { affixMonsterMods } from '../data/mapAffixes';
import { LEGACY, statLevel, type Difficulty } from '../data/difficulty';
import { CondIndex, ModDB } from '../mods/modDb';
import { maskAnd, mod, type Mod } from '../mods/types';
import type { Defence } from './combat';
import { defenceFromDb } from './defence';
import {
  baseXp,
  monsterAccuracy,
  monsterArmour,
  monsterEvasion,
  monsterHit,
  monsterLife,
} from './formulas';
import type { SkillDef } from './gems';
import { buildProfile, type HandStats, type SkillProfile } from './skill';

/** §12.7 crushing swing. */
export const BOSS_ATTACK_TIME = 1.6;

export type MonsterSpec = {
  type: MonsterTypeId;
  variant: Variant;
  rarity: MonsterRarity;
  level: number;
  mods: MonsterModId[];
  /** Ids of the map affixes that apply to every monster on the map. */
  affix?: string[];
  /** The level its life and damage are read at (docs/ENEMIES.md 8.1); the area level when absent. */
  statLevel?: number;
  /** Its hardness multiplier (life times damage) from the difficulty settings; 1 when absent. */
  power?: number;
};

/** The difficulty fields of a spec: what a monster summoned, raised or split off by this one inherits. */
export function scaleOf(spec: MonsterSpec): Pick<MonsterSpec, 'statLevel' | 'power'> {
  return { statLevel: spec.statLevel, power: spec.power };
}

export type MonsterStats = {
  spec: MonsterSpec;
  db: ModDB;
  defence: Defence;
  profile: (conds: number) => SkillProfile;
  moveSpeed: number;
  range: number;
  radius: number;
  xp: number;
};

/** The condition bits of every monster kind (they share one index, so `monsterConds` means the same for all). */
export const MONSTER_CONDS = new CondIndex();
MONSTER_CONDS.bit('onLowLife');

/** A type's skill with its attack shape applied (docs/ROSTER.md 5.1): the behaviour and the aim lock; the mods are `shapeMods`. */
function withShape(sk: SkillDef, t: MonsterTypeDef): SkillDef {
  const s = t.shape;
  if (!s || s.id === 'strike') return sk;
  const lockAim = s.lock;
  switch (s.id) {
    case 'swing':
      return {
        ...sk,
        behaviour: {
          kind: 'melee',
          range: t.range,
          arc: s.arc ?? 120,
          radius: s.radius ?? t.range + 0.8,
        },
        lockAim,
      };
    case 'slam':
      return {
        ...sk,
        tags: [...sk.tags, 'slam'],
        behaviour: { kind: 'burst', radius: s.radius ?? 2, origin: 'target', reach: t.range + 0.5 },
        lockAim,
      };
    case 'lob':
      return {
        ...sk,
        behaviour: {
          kind: 'burst',
          radius: s.radius ?? 1.6,
          origin: 'target',
          reach: t.range + 0.5,
          zone: { kind: s.zone ?? 'caustic', seconds: s.seconds ?? 4, dps: s.dps ?? 0.4 },
        },
        lockAim,
      };
    case 'nova':
      return {
        ...sk,
        tags: [...sk.tags, 'nova'],
        behaviour: { kind: 'burst', radius: s.radius ?? 2.5, origin: 'self' },
      };
    case 'lance':
      return {
        ...sk,
        behaviour: { kind: 'beam', length: s.length ?? 10, width: s.width ?? 1 },
        lockAim,
      };
    case 'salvo':
    case 'orb':
      return { ...sk, behaviour: { kind: 'projectile', count: 1, spread: 0, range: t.range + 2 } };
  }
}

/** The mods an attack shape adds to a monster's build: a volley fires again, an orb flies slowly. */
function shapeMods(t: MonsterTypeDef): Mod[] {
  const s = t.shape;
  if (!s) return [];
  if (s.id === 'salvo' || s.id === 'swing')
    return (s.count ?? 1) > 1 ? [mod('repeats', 'base', Math.min(1, (s.count ?? 1) - 1))] : [];
  if (s.id === 'orb')
    return [mod('projectileSpeed', 'inc', -Math.round((1 - (s.speed ?? 0.5)) * 100))];
  return [];
}

function monsterSkill(spec: MonsterSpec, dmg: number): SkillDef {
  const t = MONSTER_TYPES[spec.type];
  return withShape(monsterBaseSkill(spec, dmg), t);
}

function monsterBaseSkill(spec: MonsterSpec, dmg: number): SkillDef {
  const t = MONSTER_TYPES[spec.type];
  const base: SkillDef = {
    id: `monster_${t.id}`,
    name: t.name,
    type: 'attack',
    tags: ['attack', 'melee'],
    types: ['attack', 'melee'],
    behaviour: { kind: 'melee', range: t.range },
    level: spec.level,
    baseMult: 100,
    spellDamage: [],
    effectiveness: 100,
    castTime: t.attackTime,
    crit: 5,
    cost: 0,
    mods: [],
  };
  if (t.attack === 'projectile')
    return {
      ...base,
      tags: ['attack', 'projectile'],
      types: ['attack', 'projectile'],
      behaviour: { kind: 'projectile', count: 1, spread: 0, range: t.range + 2 },
    };
  if (t.attack === 'spell')
    return {
      ...base,
      type: 'spell',
      tags: ['spell', 'projectile'],
      behaviour:
        spec.variant === 'lightning'
          ? { kind: 'chain', range: t.range, chains: 0, chainRange: 0 }
          : { kind: 'projectile', count: 1, spread: 0, range: t.range + 2 },
      spellDamage: [{ type: 'physical', min: Math.round(dmg * 0.75), max: Math.round(dmg * 1.25) }],
    };
  return base;
}

const cache = new Map<string, MonsterStats>();

/** How many monster builds are held (a test and the bot report read it: see docs/ENEMIES.md 14). */
export function monsterCacheSize(): number {
  return cache.size;
}

export function monsterKey(spec: MonsterSpec): string {
  return `${spec.type}|${spec.variant}|${spec.rarity}|${spec.level}|${spec.mods.join(',')}|${(spec.affix ?? []).join(',')}|${spec.statLevel ?? ''}|${spec.power ?? ''}`;
}

/** Build (and memoise) a monster's stats from its spec. */
export function buildMonster(spec: MonsterSpec): MonsterStats {
  const k = monsterKey(spec);
  const hit = cache.get(k);
  if (hit) return hit;
  const t = MONSTER_TYPES[spec.type];
  const r = RARITY_MULTS[spec.rarity];
  const m = spec.level;
  // Life and damage read the curves at the stat level and share the hardness multiplier; the rest stay on the area level.
  const sl = spec.statLevel ?? m;
  const share = Math.sqrt(spec.power ?? 1);
  const life = Math.round(monsterLife(sl) * easeLife(m) * t.lifeMult * r.life * share);
  const mods: Mod[] = [
    mod('life', 'base', life),
    mod('accuracy', 'base', monsterAccuracy(m)),
    mod('evasion', 'base', monsterEvasion(m)),
    mod('armour', 'base', monsterArmour(m)),
    mod('moveSpeed', 'base', t.speed),
    mod('critMulti', 'base', MONSTER_CRIT_MULTI - BASE_CRIT_MULTI),
    ...t.mods,
    ...shapeMods(t),
    ...(FACTION_MODS[t.faction] ?? []),
    ...variantMods(spec.variant, spec.type === 'mage'),
  ];
  // A Core Golem is immune to its element and to that element's ailments.
  if (t.elemental && spec.variant !== 'none') mods.push(mod(`immune.${spec.variant}`, 'flag', 1));
  for (const id of spec.mods) mods.push(...monsterModDef(id).mods);
  for (const id of spec.affix ?? []) mods.push(...affixMonsterMods(id, spec.level));
  // Shrouded: an energy shield shell worth a quarter of its life, which recharges when it is left alone.
  if (spec.mods.includes('shrouded')) mods.push(mod('es', 'base', Math.round(life * 0.25)));
  if (spec.rarity === 'boss') mods.push(mod('resist.allEle', 'base', 30));
  const db = new ModDB(
    mods.map((x) => ({ ...x, source: { kind: 'monster', id: k } })),
    MONSTER_CONDS,
  );
  const ctx = { tags: 0, ancestry: 0, conds: 0 };
  const stunThreshMult = spec.rarity === 'boss' ? 4 : spec.rarity === 'miniboss' ? 2 : 1;
  const defence = defenceFromDb(db, ctx, { isPlayer: false, resistPenalty: 0, stunThreshMult });
  const dmg = monsterHit(sl) * easeDamage(m) * t.dmgMult * (t.shape?.mult ?? 1) * r.dmg * share;
  const skill = monsterSkill(spec, dmg);
  const hand: HandStats = {
    flats: [
      [dmg * 0.75, dmg * 1.25],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    // The Ossuary Regent's crushing swing takes 1.6 s (§12.7).
    aps: 1 / (spec.rarity === 'boss' ? BOSS_ATTACK_TIME : t.attackTime),
    crit: 5,
    range: t.range,
    tags: [],
  };
  const profiles = new Map<number, SkillProfile>();
  const relevant = db.condsUsed();
  const profile = (conds: number) => {
    const c = maskAnd(conds, relevant);
    let p = profiles.get(c);
    if (!p) {
      p = buildProfile({
        skill,
        db,
        hands: skill.type === 'attack' ? [hand] : [],
        extraTags: [],
        costMult: 1,
        conds: c,
        statValue: () => 0,
      });
      profiles.set(c, p);
    }
    return p;
  };
  const stats: MonsterStats = {
    spec,
    db,
    defence,
    profile,
    moveSpeed: defence.moveSpeed,
    range: t.range,
    radius: spec.rarity === 'boss' ? 0.9 : spec.rarity === 'miniboss' ? t.radius * 1.3 : t.radius,
    xp: Math.round(baseXp(m) * r.xp),
  };
  cache.set(k, stats);
  return stats;
}

/** The reference monster (§8.1): a normal Skeleton Warrior at the area level. */
export function referenceMonster(level: number, d: Difficulty = LEGACY): MonsterStats {
  return buildMonster({
    type: 'warrior',
    variant: 'none',
    rarity: 'normal',
    level,
    mods: [],
    ...scaleFor(level, d),
  });
}

/** The difficulty fields of a normal monster at this area level under these settings (no variance). */
export function scaleFor(level: number, d: Difficulty): Pick<MonsterSpec, 'statLevel' | 'power'> {
  return d.scaling === 1 && d.base === 1 ? {} : { statLevel: statLevel(level, d), power: d.base };
}
