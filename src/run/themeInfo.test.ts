import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { TAG_INFO, TAG_ORDER, TYPE_BLURBS, TYPE_TAGS } from '../data/monsterInfo';
import { THEMES, themeDef } from '../data/themes';
import { offersFor } from './preview';
import { newRun } from './run';
import { MAX_TAGS, MAX_TYPES, themeInfo, weakestAxis } from './themeInfo';

const TYPES = Object.keys(MONSTER_TYPES) as MonsterTypeId[];

describe('what the camp card says about a map (docs/ENEMIES.md 5.1)', () => {
  it('every type has a blurb, and every tag has text', () => {
    for (const id of TYPES) expect(TYPE_BLURBS[id].length, id).toBeGreaterThan(10);
    for (const t of TAG_ORDER) expect(TAG_INFO[t].text.length, t).toBeGreaterThan(10);
    for (const tags of Object.values(TYPE_TAGS))
      for (const t of tags!) expect(TAG_ORDER).toContain(t);
  });

  it('the shares of factions and of damage each add up to one', () => {
    for (const t of THEMES) {
      const info = themeInfo(t);
      expect(
        info.factions.reduce((n, f) => n + f.share, 0),
        t.id,
      ).toBeCloseTo(1, 6);
      expect(
        info.mix.reduce((n, x) => n + x, 0),
        t.id,
      ).toBeCloseTo(1, 6);
      expect(info.types.length).toBeLessThanOrEqual(MAX_TYPES);
      expect(info.tags.length).toBeLessThanOrEqual(MAX_TAGS);
      expect(info.factions[0].share).toBeGreaterThanOrEqual(info.factions.at(-1)!.share);
    }
  });

  it('tags are in the fixed order, and say what the theme asks', () => {
    for (const t of THEMES) {
      const tags = themeInfo(t).tags;
      expect(tags).toEqual([...tags].sort((a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b)));
    }
    expect(themeInfo(themeDef('gnawingWarrens')).tags).toContain('swarm');
    expect(themeInfo(themeDef('ashenNave')).tags).toContain('hexes');
    expect(themeInfo(themeDef('archersGallery')).tags).toContain('ranged');
    expect(themeInfo(themeDef('reliquaryVault')).tags).toContain('armoured');
    expect(themeInfo(themeDef('bonePits')).tags).not.toContain('hexes');
  });

  it('names the leading factions and what they ask, and the rules that apply', () => {
    const rot = themeInfo(themeDef('charnelPits'));
    expect(rot.factions[0].id).toBe('rot');
    expect(rot.asks.map((a) => a.id)).toEqual(['rot']);
    const hollow = themeInfo(themeDef('hollowVigil'));
    expect(hollow.rules.join(' ')).toContain('Ethereal');
    // A mixed theme names both.
    const mixed = themeInfo(THEMES.find((t) => t.id.startsWith('mix:'))!);
    expect(mixed.asks).toHaveLength(2);
  });

  it('a map that adds chaos damage shows more chaos', () => {
    const t = themeDef('ashenCrypt');
    const plain = themeInfo(t, [], 'plain', 40).mix[4];
    const chaos = themeInfo(t, ['extraChaos'], 'plain', 40).mix[4];
    expect(chaos).toBeGreaterThan(plain);
  });

  it('the weakest resistance is named when it stands out, and not when there is none', () => {
    const run = newRun('vanguard', 1);
    const ch = new Character(run.build, { areaLevel: 40, steady: 'clearing' });
    const line = weakestAxis(ch, [0.2, 0.1, 0.1, 0.5, 0.1]);
    expect(line).toContain('fire');
    expect(weakestAxis(ch, [1, 0, 0, 0, 0])).toBeNull();
  });

  it('every offer on the camp screen carries it', () => {
    const run = newRun('vanguard', 1);
    for (const o of offersFor(run)) {
      expect(o.info).toBeDefined();
      expect(o.info!.factions.length).toBeGreaterThan(0);
    }
  });
});
