import {
  MONSTER_TYPES,
  RARITY_MULTS,
  monsterModDef,
  variantMods,
  type MonsterModId,
  type MonsterRarity,
  type MonsterTypeId,
  type Variant,
} from '../data/monsters';
import { ModDB } from '../mods/modDb';
import { mod, type Mod } from '../mods/types';
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
};

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

function monsterSkill(spec: MonsterSpec, dmg: number): SkillDef {
  const t = MONSTER_TYPES[spec.type];
  const base: SkillDef = {
    id: `monster_${t.id}`,
    name: t.name,
    type: 'attack',
    tags: ['attack', 'melee'],
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

export function monsterKey(spec: MonsterSpec): string {
  return `${spec.type}|${spec.variant}|${spec.rarity}|${spec.level}|${spec.mods.join(',')}`;
}

/** Build (and memoise) a monster's stats from its spec. */
export function buildMonster(spec: MonsterSpec): MonsterStats {
  const k = monsterKey(spec);
  const hit = cache.get(k);
  if (hit) return hit;
  const t = MONSTER_TYPES[spec.type];
  const r = RARITY_MULTS[spec.rarity];
  const m = spec.level;
  const mods: Mod[] = [
    mod('life', 'base', Math.round(monsterLife(m) * t.lifeMult * r.life)),
    mod('accuracy', 'base', monsterAccuracy(m)),
    mod('evasion', 'base', monsterEvasion(m)),
    mod('armour', 'base', monsterArmour(m)),
    mod('moveSpeed', 'base', t.speed),
    ...t.mods,
    ...variantMods(spec.variant, spec.type === 'mage'),
  ];
  for (const id of spec.mods) mods.push(...monsterModDef(id).mods);
  if (spec.rarity === 'boss') mods.push(mod('resist.allEle', 'base', 30));
  const db = new ModDB(mods.map((x) => ({ ...x, source: { kind: 'monster', id: k } })));
  const ctx = { tags: 0, ancestry: 0, conds: 0 };
  const stunThreshMult = spec.rarity === 'boss' ? 4 : spec.rarity === 'miniboss' ? 2 : 1;
  const defence = defenceFromDb(db, ctx, { isPlayer: false, resistPenalty: 0, stunThreshMult });
  const dmg = monsterHit(m) * t.dmgMult * r.dmg;
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
    const c = conds & relevant;
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
export function referenceMonster(level: number): MonsterStats {
  return buildMonster({ type: 'warrior', variant: 'none', rarity: 'normal', level, mods: [] });
}
