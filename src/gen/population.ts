import type { Rng } from '../core/rng';
import type { MonsterSpec } from '../calc/monster';
import {
  BOSS_NAME,
  MONSTER_MODS,
  MONSTER_TYPES,
  monsterModDef,
  RARE_MONSTER_FIRST,
  RARE_MONSTER_SECOND,
  VARIANT_NAMES,
  type FactionId,
  type MonsterModId,
  type MonsterRarity,
  type MonsterTypeId,
  type Variant,
} from '../data/monsters';
import { affixRarePacks, affixStrengthOf, mapAffixDef } from '../data/mapAffixes';
import type { MapTypeId } from '../data/mapTypes';
import type { ThemeDef } from '../data/themes';
import { isFloor, type Labyrinth, type Room } from './labyrinth';

export type MonsterSpawn = {
  spec: MonsterSpec;
  x: number;
  y: number;
  room: number;
  pack: number;
  name: string;
};

export type EndKind = 'rare' | 'miniboss' | 'boss';

export type Population = {
  monsters: MonsterSpawn[];
  chests: { x: number; y: number; room: number }[];
};

/** How common each type is within its faction. */
export const TYPE_WEIGHTS: Record<MonsterTypeId, number> = {
  warrior: 50,
  brute: 15,
  archer: 20,
  mage: 15,
  shieldbearer: 8,
  shambler: 40,
  bloater: 25,
  spitter: 20,
  hag: 10,
  gloomstalker: 35,
  wailer: 25,
  wisp: 25,
  wight: 10,
  gnawer: 50,
  bat: 25,
  beetle: 20,
  nest: 5,
  sentinel: 24,
  arbalest: 14,
  golem: 35,
  pylon: 8,
  hexer: 30,
  censer: 25,
  flagellant: 30,
  choirmaster: 15,
};

/** The share of every type on a theme's maps (sum 1): its factions, then the types within each. */
export function typeShares(
  theme: Pick<ThemeDef, 'typeWeights' | 'factions'>,
): [MonsterTypeId, number][] {
  const factions = theme.factions ?? { ossuary: 1 };
  const fTotal = Object.values(factions).reduce((a, b) => a + b, 0);
  const out: [MonsterTypeId, number][] = [];
  for (const [fac, fw] of Object.entries(factions)) {
    const types = (Object.keys(TYPE_WEIGHTS) as MonsterTypeId[]).filter(
      (id) => MONSTER_TYPES[id].faction === fac,
    );
    const w = (id: MonsterTypeId) => TYPE_WEIGHTS[id] * (theme.typeWeights[id] ?? 1);
    const tTotal = types.reduce((a, id) => a + w(id), 0);
    for (const id of types) out.push([id, (fw / fTotal) * (w(id) / tTotal)]);
  }
  return out;
}
export const ELEMENT_WEIGHTS: Record<Variant, number> = {
  none: 55,
  fire: 15,
  cold: 15,
  lightning: 15,
};

export function rollType(rng: Rng, theme: ThemeDef): MonsterTypeId {
  const shares = typeShares(theme);
  return rng.weighted(
    shares.map(([id]) => id),
    (id) => shares.find(([x]) => x === id)![1],
  );
}

/** Types that always carry an element: the Ossuary mage, and the Core Golem. */
export const neverPlain = (type: MonsterTypeId): boolean =>
  type === 'mage' || !!MONSTER_TYPES[type].elemental;

export function rollVariant(rng: Rng, type: MonsterTypeId, theme: ThemeDef): Variant {
  // Casters of the Rot and the Hollow have an element of their own.
  if (MONSTER_TYPES[type].innate) return 'none';
  const vs = (Object.keys(ELEMENT_WEIGHTS) as Variant[]).filter(
    (v) => !neverPlain(type) || v !== 'none',
  );
  return rng.weighted(vs, (v) => ELEMENT_WEIGHTS[v] * (theme.elementWeights[v] ?? 1));
}

/** Mods held back on early maps (tunable; bot-balanced, see Appendix A). */
const LATE_MODS: MonsterModId[] = ['fortified', 'raiser', 'rimeAura', 'frenzied'];
export const LATE_MOD_LEVEL = 15;
export const MINIBOSS_LATE_MOD_LEVEL = 50;

export function rollMonsterMods(
  rng: Rng,
  rarity: MonsterRarity,
  level = 100,
  faction: FactionId = 'ossuary',
): MonsterModId[] {
  const [lo, hi] =
    rarity === 'magic'
      ? [1, 2]
      : rarity === 'rare'
        ? [2, 4]
        : rarity === 'miniboss'
          ? [4, 4]
          : [0, 0];
  const n = rng.int(lo, hi);
  const pool = MONSTER_MODS.filter(
    (m) =>
      (rarity !== 'magic' || m.magic) &&
      !m.chief &&
      (m.faction === undefined || m.faction === faction) &&
      level >= (m.minLevel ?? 0) &&
      (level >= (rarity === 'miniboss' ? MINIBOSS_LATE_MOD_LEVEL : LATE_MOD_LEVEL) ||
        !LATE_MODS.includes(m.id)),
  ).map((m) => m.id);
  rng.shuffle(pool);
  return pool.slice(0, n).sort();
}

export function rareName(rng: Rng): string {
  return `${rng.pick(RARE_MONSTER_FIRST)}${rng.pick(RARE_MONSTER_SECOND)}`;
}

export function monsterName(spec: MonsterSpec, rng: Rng): string {
  if (spec.rarity === 'boss') return BOSS_NAME;
  const champion = spec.mods.find((m) => monsterModDef(m).chief);
  if (champion) return monsterModDef(champion).name;
  if (spec.rarity === 'rare' || spec.rarity === 'miniboss') return rareName(rng);
  const v = VARIANT_NAMES[spec.variant];
  const t = MONSTER_TYPES[spec.type].name;
  return v ? `${v} ${t}` : t;
}

/** Random floor positions inside a room, spread out a little. */
function spots(rng: Rng, lab: Labyrinth, room: Room, n: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const r = room.rect;
  for (let i = 0; i < n; i++) {
    for (let tries = 0; tries < 30; tries++) {
      const x = rng.float(r.x + 1, r.x + r.w - 1);
      const y = rng.float(r.y + 1, r.y + r.h - 1);
      if (!isFloor(lab, Math.floor(x), Math.floor(y))) continue;
      if (out.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 0.8)) continue;
      out.push({ x, y });
      break;
    }
  }
  return out;
}

export type PopulateOpts = {
  areaLevel: number;
  endKind: EndKind;
  theme: ThemeDef;
  map: number;
  /** Map affixes that apply to every monster. */
  affixes?: string[];
  /** The map type (docs/MAPS.md 9): Quarry and Throng change who is on the map. */
  type?: MapTypeId;
};

/** §10.3 room population. */
export function populate(rng: Rng, lab: Labyrinth, opts: PopulateOpts): Population {
  const monsters: MonsterSpawn[] = [];
  const level = opts.areaLevel;
  let pack = 0;
  const add = (room: Room, spec: MonsterSpec, at: { x: number; y: number }) => {
    monsters.push({ spec, x: at.x, y: at.y, room: room.id, pack, name: monsterName(spec, rng) });
  };
  const affixField = opts.affixes?.length ? { affix: opts.affixes } : {};
  const normal = (rarity: MonsterRarity = 'normal'): MonsterSpec => {
    const type = rollType(rng, opts.theme);
    return {
      type,
      variant: rollVariant(rng, type, opts.theme),
      rarity,
      level,
      mods: rollMonsterMods(rng, rarity, level, MONSTER_TYPES[type].faction),
      ...affixField,
    };
  };
  const extra = Math.floor(opts.map / 20);
  const quarry = opts.type === 'quarry';
  const throng = opts.type === 'throng';
  // Theme bonus: extra rare packs replace normal rooms' packs (a Throng is all normal monsters).
  let extraRares = throng
    ? 0
    : opts.theme.extraRarePacks +
      (opts.affixes ?? []).reduce((n, id) => n + affixRarePacks(id, level), 0);
  // Affixes that add monsters to every pack, or turn some normal packs into magic ones (they scale with the level band).
  const packMult =
    1 +
    (opts.affixes ?? []).reduce(
      (n, id) => n + (mapAffixDef(id).packSize ?? 0) * affixStrengthOf(id, level),
      0,
    );
  const magicShift =
    0.22 *
    (opts.affixes ?? []).reduce(
      (n, id) => n + (mapAffixDef(id).magicBonus ?? 0) * affixStrengthOf(id, level),
      0,
    );
  const sized = (n: number) => Math.max(1, Math.round(n * packMult));
  // A Quarry champion: the mini-boss recipe with three mods.
  const champion = (): MonsterSpec => {
    const spec = normal('miniboss');
    return { ...spec, mods: spec.mods.slice(0, 3) };
  };
  for (const room of lab.rooms) {
    if (room.kind === 'start') continue;
    if (quarry && room.kind !== 'end') {
      // A few of the usual trash (a quarter) and a champion in every room on the way.
      if (room.kind === 'main') {
        const trash = Math.max(1, Math.round((rng.int(3, 7) + extra) * 0.25));
        const ps = spots(rng, lab, room, 1 + trash);
        ps.forEach((p, i) => add(room, i === 0 ? champion() : normal(), p));
      }
      pack++;
      continue;
    }
    if (room.kind === 'end') {
      if (quarry) {
        const ps = spots(rng, lab, room, 1 + rng.int(1, 2));
        ps.forEach((p, i) => add(room, i === 0 ? champion() : normal(), p));
      } else if (opts.endKind === 'boss') {
        const spec: MonsterSpec = {
          type: 'warrior',
          variant: 'none',
          rarity: 'boss',
          level,
          mods: [],
          ...affixField,
        };
        add(room, spec, { x: room.cx + 0.5, y: room.cy + 0.5 });
      } else {
        let leader: MonsterSpec = opts.endKind === 'miniboss' ? normal('miniboss') : normal('rare');
        // The mini-boss of a faction's own theme is its champion.
        const champ = opts.theme.chief;
        if (champ && opts.endKind === 'miniboss')
          leader = {
            ...leader,
            type: champ.type,
            variant: MONSTER_TYPES[champ.type].elemental
              ? rollVariant(rng, champ.type, opts.theme)
              : 'none',
            mods: [...leader.mods.slice(0, 3), champ.mod].sort(),
          };
        const n = opts.endKind === 'miniboss' ? 4 : rng.int(2, 4);
        const ps = spots(rng, lab, room, n + 1);
        if (ps.length) add(room, leader, ps[0]);
        for (let i = 1; i < ps.length; i++) add(room, normal(), ps[i]);
      }
      pack++;
      continue;
    }
    const drawn = rng.next();
    const roll = throng ? 0 : drawn;
    if (extraRares > 0 && room.kind === 'main') {
      extraRares--;
      const ps = spots(rng, lab, room, 1 + rng.int(2, 4));
      ps.forEach((p, i) => add(room, i === 0 ? normal('rare') : normal(), p));
    } else if (roll < 0.7 - magicShift) {
      const ps = spots(rng, lab, room, sized(rng.int(3, 7) + extra));
      let packed = false;
      for (const p of ps) {
        const spec = normal();
        add(room, spec, p);
        // A Gnawer never comes alone: the first one in a room brings a pack of eight to fourteen.
        if (spec.type === 'gnawer' && spec.rarity === 'normal' && !packed) {
          packed = true;
          const extraN = rng.int(7, 13);
          for (const q of spots(rng, lab, room, extraN))
            add(room, { ...normal(), type: 'gnawer', variant: 'none' }, q);
        }
      }
    } else if (roll < 0.92) {
      const nm = rng.int(2, 3);
      const ps = spots(rng, lab, room, sized(rng.int(3, 7) + extra));
      ps.forEach((p, i) => add(room, i < nm ? normal('magic') : normal(), p));
    } else {
      const ps = spots(rng, lab, room, sized(1 + rng.int(2, 4) + extra));
      ps.forEach((p, i) => add(room, i === 0 ? normal('rare') : normal(), p));
    }
    pack++;
  }
  const chests = lab.rooms
    .filter((r) => r.chest)
    .map((r) => ({ x: r.cx + 0.5, y: r.cy + 0.5, room: r.id }));
  // Theme bonus chest: in the largest non-start main room.
  for (let i = 0; i < opts.theme.extraChests; i++) {
    const mains = lab.rooms.filter((r) => r.kind === 'main');
    if (mains.length === 0) break;
    const r = mains[rng.int(0, mains.length - 1)];
    chests.push({ x: r.rect.x + 1.5, y: r.rect.y + 1.5, room: r.id });
  }
  return { monsters, chests };
}
