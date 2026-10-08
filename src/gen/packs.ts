import type { Rng } from '../core/rng';
import { MONSTER_TYPES, type FactionId, type MonsterTypeId, type Role } from '../data/monsters';
import type { ThemeDef } from '../data/themes';
import { TYPE_WEIGHTS } from './population';

/**
 * Pack templates (docs/ENEMIES.md 4.2, rule 5): a room is one pack of one faction, and a pack has a shape. The roles of
 * the types fill the shape, so a Rot room is "a Hag with four Shamblers" or "two Spitters behind three Shamblers" and not
 * the faction's average mix.
 */
export type TemplateId = 'phalanx' | 'line' | 'escort' | 'swarm' | 'mixed' | 'ambush' | 'patrol';

export const TEMPLATE_NAMES: Record<TemplateId, string> = {
  phalanx: 'Phalanx',
  line: 'Firing line',
  escort: 'Escort',
  swarm: 'Swarm',
  mixed: 'Mixed arms',
  ambush: 'Ambush',
  patrol: 'Patrol',
};

/** How often each faction forms each shape. Mixed arms is the old behaviour: every monster rolls its own type. */
export const TEMPLATE_WEIGHTS: Record<FactionId, Partial<Record<TemplateId, number>>> = {
  ossuary: { mixed: 3, line: 3, phalanx: 2, escort: 2, ambush: 1, patrol: 1 },
  rot: { escort: 3, line: 3, phalanx: 2, mixed: 1, ambush: 2 },
  hollow: { swarm: 2, line: 2, escort: 3, mixed: 1, patrol: 1 },
  choir: { escort: 3, line: 2, phalanx: 2, mixed: 1, patrol: 3 },
  swarm: { swarm: 5, escort: 2, phalanx: 1, mixed: 1, ambush: 2 },
  reliquary: { phalanx: 3, line: 3, escort: 3, mixed: 1 },
  kennel: { swarm: 3, escort: 3, phalanx: 2, ambush: 3, mixed: 1 },
  gilded: { line: 3, escort: 3, phalanx: 2, patrol: 2, mixed: 1 },
  drowned: { swarm: 3, escort: 3, phalanx: 2, ambush: 2, line: 1, mixed: 1 },
  emberborn: { swarm: 3, escort: 3, phalanx: 2, line: 2, ambush: 1, mixed: 1 },
};

/** What follows the leader of an escort (the Swarm's nests are followed by their vermin). */
const ESCORT_FOLLOWERS: Partial<Record<FactionId, Role>> = {
  swarm: 'swarm',
  kennel: 'swarm',
  drowned: 'swarm',
  emberborn: 'swarm',
};

/** The faction types that have a role. */
function typesWithRole(faction: FactionId, role: Role, level = Infinity): MonsterTypeId[] {
  return (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
    (id) =>
      MONSTER_TYPES[id].faction === faction &&
      MONSTER_TYPES[id].role === role &&
      (MONSTER_TYPES[id].minLevel ?? 0) <= level,
  );
}

/** What a map's monsters are drawn from: a theme's weights and factions, and the level of the map (a type has a first level). */
export type ThemeMix = Pick<ThemeDef, 'typeWeights'> & {
  factions?: ThemeDef['factions'];
  level?: number;
};

/** One type of the faction for a role, by the type weights and the theme's leanings; falls back to the front line. */
export function pickByRole(
  rng: Rng,
  theme: ThemeMix,
  faction: FactionId,
  role: Role,
): MonsterTypeId {
  const level = theme.level ?? Infinity;
  let pool = typesWithRole(faction, role, level);
  if (!pool.length) pool = typesWithRole(faction, 'front', level);
  if (!pool.length)
    pool = (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
      (id) => MONSTER_TYPES[id].faction === faction && (MONSTER_TYPES[id].minLevel ?? 0) <= level,
    );
  return rng.weighted(pool, (id) => TYPE_WEIGHTS[id] * (theme.typeWeights[id] ?? 1));
}

/** The faction of a pack: by the theme's shares (the Ossuary when it names none). */
export function pickFaction(
  rng: Rng,
  theme: Pick<ThemeDef, 'factions'> | { factions?: ThemeDef['factions'] },
): FactionId {
  const f = Object.entries(theme.factions ?? { ossuary: 1 }) as [FactionId, number][];
  return f.length === 1 ? f[0][0] : rng.weighted(f, ([, w]) => w)[0];
}

/** Whether the faction has a type that can lead an escort. */
function hasLeader(faction: FactionId, level: number): boolean {
  return (
    typesWithRole(faction, 'support', level).length +
      typesWithRole(faction, 'special', level).length >
    0
  );
}

/** The roles of the monsters of a pack of `n`, leader first; null for Mixed arms (each rolls its own type). */
export function templateRoles(
  rng: Rng,
  faction: FactionId,
  n: number,
  /** A Throng is all normal monsters: no specials or supports to lead it. */
  plain: boolean,
  level = Infinity,
): { template: TemplateId; roles: Role[] | null } {
  const weights = TEMPLATE_WEIGHTS[faction];
  const ids = (Object.keys(weights) as TemplateId[]).filter((t) => {
    if (t === 'swarm') return typesWithRole(faction, 'swarm', level).length > 0;
    if (t === 'line') return typesWithRole(faction, 'ranged', level).length > 0;
    if (t === 'escort' || t === 'ambush')
      return t === 'ambush' || (!plain && hasLeader(faction, level));
    return true;
  });
  const template = rng.weighted(ids, (t) => weights[t] ?? 0);
  const fill = (r: Role) => Array.from({ length: n }, () => r);
  switch (template) {
    case 'phalanx':
      return { template, roles: fill('front') };
    case 'line': {
      const shooters = Math.max(1, Math.round(n * 0.4));
      return {
        template,
        roles: [
          ...fill('front').slice(0, Math.max(0, n - shooters)),
          ...fill('ranged').slice(0, shooters),
        ],
      };
    }
    case 'escort':
    case 'ambush': {
      // An ambush is an escort (or a line of the front, where there is no leader) that lies in wait.
      if (!hasLeader(faction, level)) return { template, roles: fill('front') };
      const leaders = [
        ...typesWithRole(faction, 'support', level),
        ...typesWithRole(faction, 'special', level),
      ];
      const lead: Role = MONSTER_TYPES[rng.pick(leaders)].role;
      const follow = ESCORT_FOLLOWERS[faction] ?? 'front';
      return { template, roles: [lead, ...fill(follow).slice(1)] };
    }
    case 'patrol': {
      // A patrol is a short line on the march: some in front, the rest behind.
      const shooters = typesWithRole(faction, 'ranged', level).length > 0 ? Math.round(n * 0.3) : 0;
      return {
        template,
        roles: [...fill('front').slice(0, n - shooters), ...fill('ranged').slice(0, shooters)],
      };
    }
    case 'swarm':
      return { template, roles: fill('swarm') };
    default:
      return { template: 'mixed', roles: null };
  }
}

/** One type of the faction, any role: the faction's own mix (what each monster rolled before the templates). */
function pickAny(rng: Rng, theme: ThemeMix, faction: FactionId): MonsterTypeId {
  const level = theme.level ?? Infinity;
  const pool = (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
    (id) => MONSTER_TYPES[id].faction === faction && (MONSTER_TYPES[id].minLevel ?? 0) <= level,
  );
  return rng.weighted(pool, (id) => TYPE_WEIGHTS[id] * (theme.typeWeights[id] ?? 1));
}

/** One pack: the types of its monsters, leader first, the shape it was made in, and what it does before it sees you. */
export type PackPlan = {
  types: MonsterTypeId[];
  template: TemplateId;
  hold: boolean;
  patrol: boolean;
};

/** The types of the monsters of one pack of `n` (docs/ENEMIES.md 4.2). */
export function packPlan(rng: Rng, theme: ThemeMix, n: number, plain = false): PackPlan {
  const faction = pickFaction(rng, theme);
  const { template, roles } = templateRoles(rng, faction, n, plain, theme.level);
  const types = roles
    ? roles.map((r) => pickByRole(rng, theme, faction, r))
    : Array.from({ length: n }, () => pickAny(rng, theme, faction));
  return { types, template, hold: template === 'ambush', patrol: template === 'patrol' };
}

/** The types of a pack, for the places that need no more than that. */
export function packTypes(rng: Rng, theme: ThemeMix, n: number, plain = false): MonsterTypeId[] {
  return packPlan(rng, theme, n, plain).types;
}
