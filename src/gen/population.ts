import { bossOfType } from '../data/bosses';
import { endChampion } from '../data/champions';
import { Rng } from '../core/rng';
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
import { LEGACY, packPower, statLevel, type Difficulty } from '../data/difficulty';
import { affixRarePacks, affixStrengthOf, mapAffixDef } from '../data/mapAffixes';
import { HOLDOUT_FIRST, HOLDOUT_INTERVAL, HOLDOUT_WAVES, type MapTypeId } from '../data/mapTypes';
import type { ThemeDef } from '../data/themes';
import { packPlan, packTypes, type PackPlan } from './packs';
import { isFloor, type Labyrinth, type Room } from './labyrinth';

export type MonsterSpawn = {
  spec: MonsterSpec;
  x: number;
  y: number;
  room: number;
  pack: number;
  name: string;
  /** Lies in wait (an Ambush) until the character comes close or something hits it. */
  hold?: boolean;
  /** Walks between these two points until it notices the character (a Patrol). */
  patrol?: { x: number; y: number }[];
};

export type EndKind = 'rare' | 'miniboss' | 'boss';

/** A Holdout wave: when it arrives and who is in it. */
export type Wave = { t: number; monsters: MonsterSpawn[] };

export type Population = {
  monsters: MonsterSpawn[];
  chests: { x: number; y: number; room: number }[];
  /** A Holdout's waves (its monsters come in them, not at the start). */
  waves?: Wave[];
};

/** A swarm template room keeps this share of the monsters a room of its size would have. */
const SWARM_SHARE = 0.6;

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
  hound: 45,
  boar: 30,
  handler: 12,
  cat: 12,
  cutpurse: 20,
  guard: 35,
  bursar: 12,
  slinger: 25,
  crawler: 18,
  heap: 4,
  gorger: 14,
  watcher: 10,
  bell: 8,
  spinner: 14,
  coffer: 8,
  tidecaller: 16,
  wrack: 30,
  leech: 40,
  drowner: 14,
  cinderling: 40,
  slagbrute: 28,
  pyrepriest: 16,
  slagworm: 12,
  // The bosses and their creatures are placed by the boss maps, never rolled (docs/BOSSES.md).
  tollkeeper: 0,
  courser: 0,
  magistrate: 0,
  witness: 0,
  prismWarden: 0,
  siegeMarshal: 0,
  duellist: 0,
  bulwarkEngine: 0,
  ash: 0,
  cinder: 0,
  rotwife: 0,
  unmaker: 0,
  shard: 0,
};

/** Whether the faction has any type that can appear on a map of this level (a faction's types all have a first level). */
export function factionHasTypes(faction: FactionId, level = Infinity): boolean {
  return Object.values(MONSTER_TYPES).some(
    (t) => t.faction === faction && !t.bossOnly && (t.minLevel ?? 0) <= level,
  );
}

/**
 * The faction shares of a theme at a map level: only the factions that have a type at that level (a theme can be met
 * a map or two below the first level of its faction); the Ossuary when none does, so a pack is never left with no types.
 */
export function factionsAt(
  factions: ThemeDef['factions'] | undefined,
  level = Infinity,
): [FactionId, number][] {
  const f = (Object.entries(factions ?? { ossuary: 1 }) as [FactionId, number][]).filter(
    ([id, w]) => w > 0 && factionHasTypes(id, level),
  );
  return f.length ? f : [['ossuary', 1]];
}

/** The share of every type on a theme's maps (sum 1): its factions, then the types within each. */
export function typeShares(
  theme: Pick<ThemeDef, 'typeWeights' | 'factions'> & { level?: number },
): [MonsterTypeId, number][] {
  const level = theme.level ?? Infinity;
  const factions = factionsAt(theme.factions, level);
  const fTotal = factions.reduce((a, [, w]) => a + w, 0);
  const out: [MonsterTypeId, number][] = [];
  for (const [fac, fw] of factions) {
    const types = (Object.keys(TYPE_WEIGHTS) as MonsterTypeId[]).filter(
      (id) =>
        MONSTER_TYPES[id].faction === fac &&
        !MONSTER_TYPES[id].bossOnly &&
        (MONSTER_TYPES[id].minLevel ?? 0) <= level,
    );
    const w = (id: MonsterTypeId) => TYPE_WEIGHTS[id] * (theme.typeWeights[id] ?? 1);
    const tTotal = types.reduce((a, id) => a + w(id), 0);
    for (const id of types)
      out.push([id, (fw / fTotal) * (tTotal > 0 ? w(id) / tTotal : 1 / types.length)]);
  }
  return out;
}
export const ELEMENT_WEIGHTS: Record<Variant, number> = {
  none: 55,
  fire: 15,
  cold: 15,
  lightning: 15,
};

export function rollType(
  rng: Rng,
  theme: Pick<ThemeDef, 'typeWeights' | 'factions'> & { level?: number },
): MonsterTypeId {
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
/**
 * How the mix of ordinary rooms' packs shifts with the map number (nothing on map 1, all of it on map 100): plain packs lose
 * `NORMAL_FADE` of the rooms and rare packs gain `RARE_GROWTH`, magic packs taking the rest. Map 1: 70% plain, 22% magic, 8%
 * rare; map 60: 52%, 27%, 21%; map 100: 40%, 30%, 30%.
 */
export const NORMAL_FADE = 0.3;
export const RARE_GROWTH = 0.22;
/** One more magic monster in a magic pack, and in a rare's escort, for every this many maps. */
export const MAGIC_BAND_MAPS = 25;

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
      // A twin is for a rare: a gate fight is hard enough with one champion (docs/ROSTER.md 7.5).
      !(m.id === 'mirrored' && rarity === 'miniboss') &&
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
  if (spec.rarity === 'boss')
    return MONSTER_TYPES[spec.type].bossOnly ? MONSTER_TYPES[spec.type].name : BOSS_NAME;
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
  /** The difficulty settings (docs/ENEMIES.md 8): the legacy curve when absent. */
  difficulty?: Difficulty;
  /** The map's own draw in [-1, 1] (`offerNoise`), the shared part of the variance. */
  mapNoise?: number;
  /** The boss's type, on a boss map (docs/BOSSES.md): it stands alone in the arena. */
  boss?: MonsterTypeId;
};

/**
 * The map's own draw of the difficulty variance, in [-1, 1]: fixed by the run seed and the offer, so the offer card can
 * show it before the map is made and a reload gives the same value.
 */
export function offerNoise(seed: number, offerId: string): number {
  return new Rng(seed).fork(`diff.${offerId}`).float(-1, 1);
}

/** §10.3 room population, then the difficulty settings applied to every monster. */
export function populate(rng: Rng, lab: Labyrinth, opts: PopulateOpts): Population {
  const pop = populateRaw(rng, lab, opts);
  const d = opts.difficulty ?? LEGACY;
  if (d.scaling === 1 && d.base === 1 && d.variance === 0) return pop;
  const drng = rng.fork('difficulty');
  const packNoise = new Map<number, number>();
  const scale = (m: MonsterSpawn): MonsterSpawn => {
    let n = packNoise.get(m.pack);
    if (n === undefined) {
      n = drng.fork(`pack${m.pack}`).float(-1, 1);
      packNoise.set(m.pack, n);
    }
    const power = Math.round(packPower(d, opts.mapNoise ?? 0, n) * d.base * 20) / 20;
    return { ...m, spec: { ...m.spec, statLevel: statLevel(opts.areaLevel, d), power } };
  };
  return {
    ...pop,
    monsters: pop.monsters.map(scale),
    ...(pop.waves
      ? { waves: pop.waves.map((w) => ({ ...w, monsters: w.monsters.map(scale) })) }
      : {}),
  };
}

function populateRaw(rng: Rng, lab: Labyrinth, opts: PopulateOpts): Population {
  const monsters: MonsterSpawn[] = [];
  const level = opts.areaLevel;
  let pack = 0;
  const add = (
    room: Room,
    spec: MonsterSpec,
    at: { x: number; y: number },
    extra: Partial<MonsterSpawn> = {},
  ) => {
    monsters.push({
      spec,
      x: at.x,
      y: at.y,
      room: room.id,
      pack,
      name: monsterName(spec, rng),
      ...extra,
    });
  };
  // What a pack does before it sees the character: lie in wait, or walk to the next room and back.
  const behave = (room: Room, plan: PackPlan): Partial<MonsterSpawn> => {
    if (plan.hold) return { hold: true };
    if (plan.patrol && room.kind === 'main') {
      const next =
        lab.rooms.find((r) => r.kind !== 'side' && r.pathIndex === room.pathIndex + 1) ??
        lab.rooms.find((r) => r.kind !== 'side' && r.pathIndex === room.pathIndex - 1);
      if (next)
        return {
          patrol: [
            { x: room.cx + 0.5, y: room.cy + 0.5 },
            { x: next.cx + 0.5, y: next.cy + 0.5 },
          ],
        };
    }
    return {};
  };
  // What the map's monsters are drawn from: the theme, and the level (a heavy type has a first level).
  const mix = {
    typeWeights: opts.theme.typeWeights,
    factions: opts.theme.factions,
    level: opts.areaLevel,
  };
  const affixField = opts.affixes?.length ? { affix: opts.affixes } : {};
  const normal = (rarity: MonsterRarity = 'normal', forced?: MonsterTypeId): MonsterSpec => {
    const type = forced ?? rollType(rng, mix);
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
  // As the run goes on, fewer packs are plain: magic packs and rare packs take their share (docs/DESIGN.md, 2026-10-10).
  const depth = Math.min(1, opts.map / 100);
  const normalCut = 0.7 - NORMAL_FADE * depth;
  const magicCut = 0.92 - RARE_GROWTH * depth;
  // A magic pack has more magic monsters, and a rare comes with magic escorts, deeper in.
  const magicBand = Math.floor(opts.map / MAGIC_BAND_MAPS);
  // A Holdout is eight waves into one arena, each from the edge, the last led by a rare.
  if (opts.type === 'holdout') {
    const room = lab.rooms[0];
    const waves: Wave[] = [];
    for (let k = 0; k < HOLDOUT_WAVES; k++) {
      const last = k === HOLDOUT_WAVES - 1;
      const n = sized(5 + k + extra) + (last ? 1 : 0);
      const ps: { x: number; y: number }[] = [];
      for (let i = 0; i < n; i++)
        for (let tries = 0; tries < 40; tries++) {
          const x = rng.float(room.rect.x + 1, room.rect.x + room.rect.w - 1);
          const y = rng.float(room.rect.y + 1, room.rect.y + room.rect.h - 1);
          if (
            Math.hypot(x - lab.start.x, y - lab.start.y) < 10 ||
            !isFloor(lab, Math.floor(x), Math.floor(y))
          )
            continue;
          if (ps.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 0.8)) continue;
          ps.push({ x, y });
          break;
        }
      const types = packTypes(rng, mix, ps.length, throng);
      const mons: MonsterSpawn[] = ps.map((p, i) => {
        const rarity: MonsterRarity =
          last && i === 0 ? 'rare' : k % 2 === 1 && i < 2 ? 'magic' : 'normal';
        const spec = normal(rarity, types[i]);
        return { spec, x: p.x, y: p.y, room: room.id, pack: k, name: monsterName(spec, rng) };
      });
      waves.push({ t: HOLDOUT_FIRST + k * HOLDOUT_INTERVAL, monsters: mons });
    }
    return { monsters: [], chests: [], waves };
  }
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
        // A boss stands alone in the middle of its arena (docs/BOSSES.md 12): what it brings, it brings itself. The
        // Magistrate is hex-warded ("the court admits no magic").
        const type = opts.boss ?? 'unmaker';
        const spec: MonsterSpec = {
          type,
          variant: 'none',
          rarity: 'boss',
          level,
          mods: type === 'magistrate' ? ['hexWarded'] : [],
          ...affixField,
        };
        // The Twins stand side by side, each a boss in its own right.
        const partners = bossOfType(type)?.partners ?? [];
        const side = partners.length ? 1.6 : 0;
        add(room, spec, { x: room.cx + 0.5 - side, y: room.cy + 0.5 });
        partners.forEach((t, i) =>
          add(
            room,
            { ...spec, type: t, mods: [] },
            { x: room.cx + 0.5 + side * (i + 1), y: room.cy + 0.5 },
          ),
        );
      } else {
        let leader: MonsterSpec = opts.endKind === 'miniboss' ? normal('miniboss') : normal('rare');
        // The mini-boss of a faction's own theme is its champion, and on an ordinary map the champion takes the rare's place.
        const champ =
          opts.endKind === 'miniboss'
            ? opts.theme.chief
            : opts.type === 'crawl'
              ? undefined
              : endChampion(opts.theme, opts.map, opts.areaLevel, opts.endKind);
        if (champ)
          leader = {
            ...leader,
            type: champ.type,
            variant:
              MONSTER_TYPES[champ.type].elemental || champ.mod === 'boneWarden'
                ? rollVariant(rng, champ.type, opts.theme)
                : 'none',
            mods: [...leader.mods.slice(0, 3), champ.mod].sort(),
          };
        const n = opts.endKind === 'miniboss' ? 4 : rng.int(2, 4);
        const ps = spots(rng, lab, room, n + 1);
        if (ps.length) add(room, leader, ps[0]);
        const escort = packTypes(rng, mix, ps.length, throng);
        for (let i = 1; i < ps.length; i++) add(room, normal('normal', escort[i]), ps[i]);
      }
      pack++;
      continue;
    }
    const drawn = rng.next();
    const roll = throng ? 0 : drawn;
    if (extraRares > 0 && room.kind === 'main') {
      extraRares--;
      const ps = spots(rng, lab, room, 1 + rng.int(2, 4));
      const plan = packPlan(rng, mix, ps.length, throng);
      const types = plan.types;
      const how = behave(room, plan);
      ps.forEach((p, i) =>
        add(room, i === 0 ? normal('rare', types[i]) : normal('normal', types[i]), p, how),
      );
    } else if (roll < normalCut - magicShift) {
      let ps = spots(rng, lab, room, sized(rng.int(3, 7) + extra));
      let packed = false;
      const plan = packPlan(rng, mix, ps.length, throng);
      // A swarm is made of small things in numbers (and a Gnawer brings more): its own count is smaller, so that a room of
      // vermin is not twice the monsters of any other.
      if (plan.template === 'swarm')
        ps = ps.slice(0, Math.max(2, Math.ceil(ps.length * SWARM_SHARE)));
      const types = plan.types;
      const how = behave(room, plan);
      for (const [i, p] of ps.entries()) {
        const spec = normal('normal', types[i]);
        add(room, spec, p, how);
        // A Gnawer never comes alone: the first one in a room brings three to six more (a pack of a dozen, with the room's own).
        if (spec.type === 'gnawer' && spec.rarity === 'normal' && !packed) {
          packed = true;
          const extraN = rng.int(3, 6);
          for (const q of spots(rng, lab, room, extraN))
            add(room, { ...normal(), type: 'gnawer', variant: 'none' }, q);
        }
      }
    } else if (roll < magicCut) {
      const nm = rng.int(2, 3) + magicBand;
      const ps = spots(rng, lab, room, sized(rng.int(3, 7) + extra));
      const plan = packPlan(rng, mix, ps.length, throng);
      const how = behave(room, plan);
      ps.forEach((p, i) => add(room, normal(i < nm ? 'magic' : 'normal', plan.types[i]), p, how));
    } else {
      const ps = spots(rng, lab, room, sized(1 + rng.int(2, 4) + extra));
      const plan = packPlan(rng, mix, ps.length, throng);
      const how = behave(room, plan);
      ps.forEach((p, i) =>
        add(
          room,
          normal(i === 0 ? 'rare' : i <= magicBand ? 'magic' : 'normal', plan.types[i]),
          p,
          how,
        ),
      );
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
