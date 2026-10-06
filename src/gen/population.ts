import type { Rng } from '../core/rng';
import type { MonsterSpec } from '../calc/monster';
import {
  BOSS_NAME,
  MONSTER_MODS,
  MONSTER_TYPES,
  RARE_MONSTER_FIRST,
  RARE_MONSTER_SECOND,
  VARIANT_NAMES,
  type MonsterModId,
  type MonsterRarity,
  type MonsterTypeId,
  type Variant,
} from '../data/monsters';
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

const TYPE_WEIGHTS: Record<MonsterTypeId, number> = {
  warrior: 50,
  brute: 15,
  archer: 20,
  mage: 15,
};
const ELEMENT_WEIGHTS: Record<Variant, number> = { none: 55, fire: 15, cold: 15, lightning: 15 };

export function rollType(rng: Rng, theme: ThemeDef): MonsterTypeId {
  const ids = Object.keys(TYPE_WEIGHTS) as MonsterTypeId[];
  return rng.weighted(ids, (id) => TYPE_WEIGHTS[id] * (theme.typeWeights[id] ?? 1));
}

export function rollVariant(rng: Rng, type: MonsterTypeId, theme: ThemeDef): Variant {
  const vs = (Object.keys(ELEMENT_WEIGHTS) as Variant[]).filter(
    (v) => type !== 'mage' || v !== 'none',
  );
  return rng.weighted(vs, (v) => ELEMENT_WEIGHTS[v] * (theme.elementWeights[v] ?? 1));
}

export function rollMonsterMods(rng: Rng, rarity: MonsterRarity): MonsterModId[] {
  const [lo, hi] =
    rarity === 'magic'
      ? [1, 2]
      : rarity === 'rare'
        ? [2, 4]
        : rarity === 'miniboss'
          ? [4, 4]
          : [0, 0];
  const n = rng.int(lo, hi);
  const pool = MONSTER_MODS.filter((m) => rarity !== 'magic' || m.magic).map((m) => m.id);
  rng.shuffle(pool);
  return pool.slice(0, n).sort();
}

export function rareName(rng: Rng): string {
  return `${rng.pick(RARE_MONSTER_FIRST)}${rng.pick(RARE_MONSTER_SECOND)}`;
}

export function monsterName(spec: MonsterSpec, rng: Rng): string {
  if (spec.rarity === 'boss') return BOSS_NAME;
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
};

/** §10.3 room population. */
export function populate(rng: Rng, lab: Labyrinth, opts: PopulateOpts): Population {
  const monsters: MonsterSpawn[] = [];
  const level = opts.areaLevel;
  let pack = 0;
  const add = (room: Room, spec: MonsterSpec, at: { x: number; y: number }) => {
    monsters.push({ spec, x: at.x, y: at.y, room: room.id, pack, name: monsterName(spec, rng) });
  };
  const normal = (rarity: MonsterRarity = 'normal'): MonsterSpec => {
    const type = rollType(rng, opts.theme);
    return {
      type,
      variant: rollVariant(rng, type, opts.theme),
      rarity,
      level,
      mods: rollMonsterMods(rng, rarity),
    };
  };
  const extra = Math.floor(opts.map / 20);
  // Theme bonus: extra rare packs replace normal rooms' packs.
  let extraRares = opts.theme.extraRarePacks;
  for (const room of lab.rooms) {
    if (room.kind === 'start') continue;
    if (room.kind === 'end') {
      if (opts.endKind === 'boss') {
        const spec: MonsterSpec = {
          type: 'warrior',
          variant: 'none',
          rarity: 'boss',
          level,
          mods: [],
        };
        add(room, spec, { x: room.cx + 0.5, y: room.cy + 0.5 });
      } else {
        const leader: MonsterSpec =
          opts.endKind === 'miniboss' ? normal('miniboss') : normal('rare');
        const n = opts.endKind === 'miniboss' ? 4 : rng.int(2, 4);
        const ps = spots(rng, lab, room, n + 1);
        if (ps.length) add(room, leader, ps[0]);
        for (let i = 1; i < ps.length; i++) add(room, normal(), ps[i]);
      }
      pack++;
      continue;
    }
    const roll = rng.next();
    if (extraRares > 0 && room.kind === 'main') {
      extraRares--;
      const ps = spots(rng, lab, room, 1 + rng.int(2, 4));
      ps.forEach((p, i) => add(room, i === 0 ? normal('rare') : normal(), p));
    } else if (roll < 0.7) {
      const ps = spots(rng, lab, room, rng.int(3, 7) + extra);
      for (const p of ps) add(room, normal(), p);
    } else if (roll < 0.92) {
      const nm = rng.int(2, 3);
      const ps = spots(rng, lab, room, rng.int(3, 7) + extra);
      ps.forEach((p, i) => add(room, i < nm ? normal('magic') : normal(), p));
    } else {
      const ps = spots(rng, lab, room, 1 + rng.int(2, 4) + extra);
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
