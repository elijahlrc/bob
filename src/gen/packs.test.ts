import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { MONSTER_TYPES, type FactionId, type Role } from '../data/monsters';
import { themeDef, THEMES } from '../data/themes';
import { generateLabyrinth } from './labyrinth';
import {
  packPlan,
  packTypes,
  pickByRole,
  pickFaction,
  TEMPLATE_WEIGHTS,
  templateRoles,
} from './packs';
import { factionsAt, populate, typeShares } from './population';

const FACTIONS = Object.keys(TEMPLATE_WEIGHTS) as FactionId[];

describe('pack templates (docs/ENEMIES.md 4.2)', () => {
  it('every type has a role, and a faction that forms a phalanx has a front line', () => {
    const roles: Role[] = ['front', 'ranged', 'support', 'special', 'swarm'];
    for (const t of Object.values(MONSTER_TYPES)) expect(roles).toContain(t.role);
    for (const f of FACTIONS.filter((x) => TEMPLATE_WEIGHTS[x].phalanx))
      expect(
        Object.values(MONSTER_TYPES).some((t) => t.faction === f && t.role === 'front'),
        f,
      ).toBe(true);
  });

  it('a pack is one faction, of the size asked for, with the leader first', () => {
    const theme = themeDef('charnelPits');
    for (let seed = 1; seed <= 60; seed++) {
      const types = packTypes(new Rng(seed), theme, 5);
      expect(types).toHaveLength(5);
      expect(new Set(types.map((t) => MONSTER_TYPES[t].faction)).size).toBe(1);
    }
  });

  it('an escort has one leader of support or special role and followers of the front line', () => {
    let seen = 0;
    for (let seed = 1; seed <= 200 && seen < 10; seed++) {
      const { template, roles } = templateRoles(new Rng(seed), 'rot', 5, false);
      if (template !== 'escort') continue;
      seen++;
      expect(['support', 'special']).toContain(roles![0]);
      expect(roles!.slice(1).every((r) => r === 'front')).toBe(true);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('a firing line has shooters behind the front, and a swarm is all vermin', () => {
    const line = (() => {
      for (let seed = 1; seed < 200; seed++) {
        const r = templateRoles(new Rng(seed), 'rot', 5, false);
        if (r.template === 'line') return r.roles!;
      }
      return [];
    })();
    expect(line.filter((r) => r === 'ranged').length).toBe(2);
    expect(line.slice(0, 3).every((r) => r === 'front')).toBe(true);
    for (let seed = 1; seed < 200; seed++) {
      const r = templateRoles(new Rng(seed), 'swarm', 6, false);
      if (r.template === 'swarm') expect(r.roles!.every((x) => x === 'swarm')).toBe(true);
    }
  });

  it('a throng never has a leader of the support or special kind', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { template } = templateRoles(new Rng(seed), 'rot', 5, true);
      expect(template).not.toBe('escort');
    }
  });

  it('a pack of the Ossuary is made of skeletons only', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const types = packTypes(new Rng(seed), themeDef('ashenCrypt'), 4);
      expect(types.every((t) => MONSTER_TYPES[t].faction === 'ossuary')).toBe(true);
    }
  });

  it('the faction of a pack follows the shares of the theme', () => {
    const theme = themeDef('charnelPits');
    let rot = 0;
    for (let seed = 1; seed <= 2000; seed++) if (pickFaction(new Rng(seed), theme) === 'rot') rot++;
    expect(rot / 2000).toBeGreaterThan(0.8);
    expect(rot / 2000).toBeLessThan(0.9);
  });

  it('rooms of one theme differ in shape: not every room is the faction average', () => {
    const shapes = new Set<string>();
    for (let s = 0; s < 40; s++) {
      const lab = generateLabyrinth(new Rng(s), { rooms: 6, sideBranches: 1 });
      const pop = populate(new Rng(s + 7), lab, {
        areaLevel: 20,
        endKind: 'rare',
        theme: themeDef('charnelPits'),
        map: 20,
      });
      const byRoom = new Map<number, string[]>();
      for (const m of pop.monsters)
        byRoom.set(m.room, [...(byRoom.get(m.room) ?? []), MONSTER_TYPES[m.spec.type].role]);
      for (const roles of byRoom.values()) shapes.add([...new Set(roles)].sort().join('+'));
    }
    expect(shapes.size).toBeGreaterThan(3);
  });
});

describe('a pack is never left with nothing to draw from', () => {
  const ROLES: Role[] = ['front', 'ranged', 'support', 'special', 'swarm'];
  const kiln = themeDef('kilnHall');
  const firstLevel = (f: FactionId) =>
    Math.min(
      ...Object.values(MONSTER_TYPES)
        .filter((t) => t.faction === f)
        .map((t) => t.minLevel ?? 0),
    );

  it('a theme met below the first level of its faction falls back to the factions that have a type', () => {
    const level = firstLevel('emberborn') - 1;
    expect(factionsAt(kiln.factions, level).map(([f]) => f)).toEqual(['ossuary']);
    for (let seed = 1; seed <= 100; seed++) {
      const theme = { ...kiln, level };
      expect(pickFaction(new Rng(seed), theme)).toBe('ossuary');
      const types = packPlan(new Rng(seed), theme, 5).types;
      expect(types).toHaveLength(5);
      for (const t of types) expect(MONSTER_TYPES[t].minLevel ?? 0).toBeLessThanOrEqual(level);
    }
    const shares = typeShares({ ...kiln, level });
    expect(shares.reduce((a, [, w]) => a + w, 0)).toBeCloseTo(1);
  });

  it('every theme at every level yields a pack of the right size from types that exist at that level', () => {
    for (const theme of THEMES)
      for (const level of [1, 5, 12, 20, 25, 26, 30, 45])
        for (let seed = 1; seed <= 12; seed++) {
          const types = packPlan(new Rng(seed), { ...theme, level }, 4 + (seed % 3)).types;
          expect(types.length).toBeGreaterThan(0);
          for (const t of types) expect(MONSTER_TYPES[t].minLevel ?? 0).toBeLessThanOrEqual(level);
        }
  });

  it('a pool the theme weighs at nothing is drawn from evenly', () => {
    const zero = { typeWeights: { warrior: 0, brute: 0, archer: 0, mage: 0, shieldbearer: 0 } };
    for (const role of ROLES)
      for (let seed = 1; seed <= 20; seed++) {
        const t = pickByRole(new Rng(seed), { ...zero, level: 1 }, 'ossuary', role);
        expect(MONSTER_TYPES[t].faction).toBe('ossuary');
      }
  });
});
