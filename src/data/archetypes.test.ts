import { describe, expect, it } from 'vitest';
import { buildMonster, type MonsterSpec } from '../calc/monster';
import { PROBES, durabilityTable, meanDurability } from '../calc/matrix';
import { ARCHETYPES, ARCHETYPE_IDS } from './archetypes';
import { defenceMods, defenceTexts, profileOf } from './defence';
import { FACTION_NAMES, MONSTER_TYPES, type FactionId, type MonsterTypeId } from './monsters';

const TYPES = Object.keys(MONSTER_TYPES) as MonsterTypeId[];
const FACTIONS = Object.keys(FACTION_NAMES) as FactionId[];
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

  it('every archetype is used by some type, and has its words', () => {
    for (const a of ARCHETYPE_IDS) {
      expect(
        TYPES.some((id) => MONSTER_TYPES[id].archetype === a),
        a,
      ).toBe(true);
      expect(ARCHETYPES[a].question.length).toBeGreaterThan(5);
    }
  });

  it('the stat bands are occupied: three types in each speed band, two in each reach band', () => {
    const speed = (lo: number, hi: number) =>
      TYPES.filter((id) => MONSTER_TYPES[id].speed >= lo && MONSTER_TYPES[id].speed < hi).length;
    const reach = (lo: number, hi: number) =>
      TYPES.filter((id) => MONSTER_TYPES[id].range >= lo && MONSTER_TYPES[id].range < hi).length;
    expect(speed(0, 2)).toBeGreaterThanOrEqual(3);
    expect(speed(2, 3.3)).toBeGreaterThanOrEqual(3);
    expect(speed(3.3, 4.5)).toBeGreaterThanOrEqual(3);
    expect(speed(4.5, 99)).toBeGreaterThanOrEqual(3);
    expect(reach(1, 1.6)).toBeGreaterThanOrEqual(2);
    expect(reach(2, 5.5)).toBeGreaterThanOrEqual(2);
    expect(reach(5.5, 8.5)).toBeGreaterThanOrEqual(2);
    expect(reach(8.5, 99)).toBeGreaterThanOrEqual(2);
  });

  it('a faction fields at least three archetypes (four from the additions of docs/ROSTER.md 7.1)', () => {
    for (const f of FACTIONS) {
      const mine = TYPES.filter((id) => MONSTER_TYPES[id].faction === f);
      const kinds = new Set(mine.map((id) => MONSTER_TYPES[id].archetype));
      expect(kinds.size, f).toBeGreaterThanOrEqual(Math.min(3, mine.length));
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

  it('every other type is hard to something and soft to something, by a fifth or more', () => {
    for (const id of TYPES.filter((i) => i !== 'warrior')) {
      const v = Object.values(table(id));
      expect(Math.max(...v) / Math.min(...v), id).toBeGreaterThanOrEqual(1.2);
    }
  });

  it('each kind of damage is hard for two factions and soft for two', () => {
    const groups: Record<string, string[]> = {
      physical: ['physical', 'flurry'],
      fire: ['fire'],
      cold: ['cold'],
      lightning: ['lightning'],
      chaos: ['chaos'],
    };
    const mean = (f: FactionId, probes: string[]) => {
      const rows = TYPES.filter((id) => MONSTER_TYPES[id].faction === f).map(table);
      return (
        rows.reduce((s, r) => s + probes.reduce((a, p) => a + r[p], 0) / probes.length, 0) /
        rows.length
      );
    };
    for (const [kind, probes] of Object.entries(groups)) {
      const m = FACTIONS.map((f) => mean(f, probes));
      expect(m.filter((x) => x >= 1.2).length, `${kind} hard`).toBeGreaterThanOrEqual(2);
      expect(m.filter((x) => x <= 0.87).length, `${kind} soft`).toBeGreaterThanOrEqual(2);
    }
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
    expect(brute.armour / warrior.armour).toBeCloseTo(1.8, 5);
    const wailer = buildMonster(spec('wailer')).defence;
    expect(wailer.res[2]).toBe(60);
    expect(wailer.res[3]).toBe(-30);
    expect(wailer.physReduction).toBeCloseTo(0.5, 5);
    expect(buildMonster(spec('mage')).defence.maxEs).toBeGreaterThan(0);
    expect(buildMonster(spec('shambler')).defence.avoid.poison).toBe(1);
    expect(buildMonster(spec('pylon')).defence.stunAvoid).toBe(1);
    expect(buildMonster(spec('sentinel')).hitCap).toBe(0.2);
    expect(buildMonster(spec('brute')).hitCap).toBeUndefined();
  });

  it('a profile has words, and a plain one has none', () => {
    expect(defenceTexts({})).toEqual([]);
    const t = defenceTexts(profileOf('reliquary', { armour: 100, hitCap: 0.2 }));
    expect(t.join(' ')).toContain('Heavily armoured');
    expect(t.join(' ')).toContain('Carapace');
    expect(t.join(' ')).toContain('Resists fire');
    expect(t.join(' ')).toContain('poisoned');
    expect(defenceMods({ es: 0.5 }, 100)).toHaveLength(1);
  });

  it('the probes are the eight of the plan', () => {
    expect(PROBES).toHaveLength(8);
  });
});
