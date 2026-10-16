import { describe, expect, it } from 'vitest';
import { buildMonster, type MonsterSpec } from '../calc/monster';
import { durabilityTable, meanDurability } from '../calc/matrix';
import { ARCHETYPES } from './archetypes';
import { profileOf } from './defence';
import { MONSTER_TYPES, type MonsterTypeId } from './monsters';

// The bosses are not pack monsters and keep no archetype's envelope (docs/BOSSES.md): their cards are their own.
const TYPES = (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
  (id) => !MONSTER_TYPES[id].bossOnly,
);
const inside = (v: number, r: readonly [number, number]) => v >= r[0] - 1e-9 && v <= r[1] + 1e-9;
const spec = (type: MonsterTypeId, level = 30): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level,
  mods: [],
});

describe('archetypes (docs/ROSTER.md 6.1)', () => {
  it('every type has one, and lies inside its envelope of toughness, damage, speed and reach', () => {
    for (const id of TYPES) {
      const t = MONSTER_TYPES[id];
      const a = ARCHETYPES[t.archetype];
      expect(a, id).toBeDefined();
      expect(inside(t.lifeMult, a.toughness), `${id} toughness ${t.lifeMult} in ${a.name}`).toBe(
        true,
      );
      expect(inside(t.dmgMult, a.damage), `${id} damage ${t.dmgMult} in ${a.name}`).toBe(true);
      expect(inside(t.speed, a.speed), `${id} speed ${t.speed} in ${a.name}`).toBe(true);
      expect(inside(t.range, a.reach), `${id} reach ${t.range} in ${a.name}`).toBe(true);
    }
  });
});

describe('defence profiles and the build matrix (docs/ROSTER.md 6.2)', () => {
  const L = 30;
  const table = (id: MonsterTypeId) =>
    durabilityTable(profileOf(MONSTER_TYPES[id].faction, MONSTER_TYPES[id].defence), L);

  it('the plain Warrior is the control: no probe makes it harder or softer', () => {
    for (const v of Object.values(table('warrior'))) expect(v).toBeCloseTo(1, 9);
  });

  it('a defence is paid for in life: raw life times mean durability is the stated toughness', () => {
    for (const id of TYPES) {
      const t = MONSTER_TYPES[id];
      const m = buildMonster(spec(id, 30));
      // Life is read from the monster itself, with the curve it is built from.
      const plain = buildMonster(spec('warrior', 30)).defence.maxLife;
      const mean = meanDurability(profileOf(t.faction, t.defence), 30);
      expect(m.defence.maxLife / plain, id).toBeCloseTo(t.lifeMult / mean, 1);
    }
  });

  it('the profile reaches the monster: armour, resistances, shields and immunities are on the built defence', () => {
    const brute = buildMonster(spec('brute')).defence;
    const warrior = buildMonster(spec('warrior')).defence;
    expect(brute.armour).toBeGreaterThan(warrior.armour);
    const wailer = buildMonster(spec('wailer')).defence;
    expect(wailer.res[2]).toBeGreaterThan(warrior.res[2]);
    expect(wailer.res[3]).toBeLessThan(warrior.res[3]);
    expect(wailer.physReduction).toBeGreaterThan(warrior.physReduction);
    expect(buildMonster(spec('mage')).defence.maxEs).toBeGreaterThan(0);
    expect(buildMonster(spec('shambler')).defence.avoid.poison).toBe(1);
    expect(buildMonster(spec('pylon')).defence.stunAvoid).toBe(1);
    expect(buildMonster(spec('sentinel')).hitCap).toBeDefined();
    expect(buildMonster(spec('brute')).hitCap).toBeUndefined();
  });
});
