import type { Rng } from '../core/rng';
import { MONSTER_TYPES, type FactionId, type MonsterTypeId, type Role } from '../data/monsters';
import type { ThemeDef } from '../data/themes';
import { TYPE_WEIGHTS } from './population';

/**
 * Pack templates (docs/ENEMIES.md 4.2, rule 5): a room is one pack of one faction, and a pack has a shape. The roles of
 * the types fill the shape, so a Rot room is "a Hag with four Shamblers" or "two Spitters behind three Shamblers" and not
 * the faction's average mix.
 */
export type TemplateId = 'phalanx' | 'line' | 'escort' | 'swarm' | 'mixed';

export const TEMPLATE_NAMES: Record<TemplateId, string> = {
  phalanx: 'Phalanx',
  line: 'Firing line',
  escort: 'Escort',
  swarm: 'Swarm',
  mixed: 'Mixed arms',
};

/** How often each faction forms each shape. Mixed arms is the old behaviour: every monster rolls its own type. */
export const TEMPLATE_WEIGHTS: Record<FactionId, Partial<Record<TemplateId, number>>> = {
  ossuary: { mixed: 3, line: 3, phalanx: 2, escort: 2 },
  rot: { escort: 3, line: 3, phalanx: 2, mixed: 1 },
  hollow: { swarm: 2, line: 2, escort: 3, mixed: 1 },
  choir: { escort: 4, line: 2, phalanx: 2, mixed: 1 },
  swarm: { swarm: 5, escort: 2, phalanx: 1, mixed: 1 },
  reliquary: { phalanx: 3, line: 3, escort: 3, mixed: 1 },
};

/** What follows the leader of an escort (the Swarm's nests are followed by their vermin). */
const ESCORT_FOLLOWERS: Partial<Record<FactionId, Role>> = { swarm: 'swarm' };

/** The faction types that have a role. */
function typesWithRole(faction: FactionId, role: Role): MonsterTypeId[] {
  return (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
    (id) => MONSTER_TYPES[id].faction === faction && MONSTER_TYPES[id].role === role,
  );
}

/** One type of the faction for a role, by the type weights and the theme's leanings; falls back to the front line. */
export function pickByRole(
  rng: Rng,
  theme: Pick<ThemeDef, 'typeWeights'>,
  faction: FactionId,
  role: Role,
): MonsterTypeId {
  let pool = typesWithRole(faction, role);
  if (!pool.length) pool = typesWithRole(faction, 'front');
  if (!pool.length)
    pool = (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
      (id) => MONSTER_TYPES[id].faction === faction,
    );
  return rng.weighted(pool, (id) => TYPE_WEIGHTS[id] * (theme.typeWeights[id] ?? 1));
}

/** The faction of a pack: by the theme's shares (the Ossuary when it names none). */
export function pickFaction(rng: Rng, theme: Pick<ThemeDef, 'factions'>): FactionId {
  const f = Object.entries(theme.factions ?? { ossuary: 1 }) as [FactionId, number][];
  return f.length === 1 ? f[0][0] : rng.weighted(f, ([, w]) => w)[0];
}

/** The roles of the monsters of a pack of `n`, leader first; null for Mixed arms (each rolls its own type). */
export function templateRoles(
  rng: Rng,
  faction: FactionId,
  n: number,
  /** A Throng is all normal monsters: no specials or supports to lead it. */
  plain: boolean,
): { template: TemplateId; roles: Role[] | null } {
  const weights = TEMPLATE_WEIGHTS[faction];
  const ids = (Object.keys(weights) as TemplateId[]).filter((t) => {
    if (t === 'swarm') return typesWithRole(faction, 'swarm').length > 0;
    if (t === 'line') return typesWithRole(faction, 'ranged').length > 0;
    if (t === 'escort')
      return (
        !plain &&
        (typesWithRole(faction, 'support').length || typesWithRole(faction, 'special').length) > 0
      );
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
    case 'escort': {
      const leaders = [...typesWithRole(faction, 'support'), ...typesWithRole(faction, 'special')];
      const lead: Role = MONSTER_TYPES[rng.pick(leaders)].role;
      const follow = ESCORT_FOLLOWERS[faction] ?? 'front';
      return { template, roles: [lead, ...fill(follow).slice(1)] };
    }
    case 'swarm':
      return { template, roles: fill('swarm') };
    default:
      return { template: 'mixed', roles: null };
  }
}

/** One type of the faction, any role: the faction's own mix (what each monster rolled before the templates). */
function pickAny(
  rng: Rng,
  theme: Pick<ThemeDef, 'typeWeights'>,
  faction: FactionId,
): MonsterTypeId {
  const pool = (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
    (id) => MONSTER_TYPES[id].faction === faction,
  );
  return rng.weighted(pool, (id) => TYPE_WEIGHTS[id] * (theme.typeWeights[id] ?? 1));
}

/** The types of the monsters of one pack of `n` (docs/ENEMIES.md 4.2), leader first, and the shape it was made in. */
export function packTypes(
  rng: Rng,
  theme: Pick<ThemeDef, 'typeWeights' | 'factions'>,
  n: number,
  plain = false,
): MonsterTypeId[] {
  const faction = pickFaction(rng, theme);
  const { roles } = templateRoles(rng, faction, n, plain);
  if (!roles) return Array.from({ length: n }, () => pickAny(rng, theme, faction));
  return roles.map((r) => pickByRole(rng, theme, faction, r));
}
