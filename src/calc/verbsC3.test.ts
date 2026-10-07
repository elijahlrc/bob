import { describe, expect, it } from 'vitest';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { mod, type Mod } from '../mods/types';
import { newRun } from '../run/run';
import { Character } from './character';

/** The verbs added for the coverage plan's uniques (C3), one test each. */

let n = 30000;
const uid = () => n++;

function build(gems: string[], extra: Mod[] = [], classId = 'mystic'): Build {
  const b = newRun(classId, 1).build;
  b.level = 40;
  const body = makeItem(uid, 'body_ar_1', 40, gems.length, 'unique');
  body.sockets = gems.map((g) => makeGem(uid, g));
  body.uniqueMods = extra;
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const levelOf = (c: Character, id: string) => c.gems.find((g) => g.def.id === id)!.level;

describe('gem levels from anywhere', () => {
  it('+N to the level of all gems of a kind raises those gems wherever they are socketed', () => {
    const plain = new Character(build(['flameBolt', 'frostLance']), { areaLevel: 40 });
    // The bonus sits on the body, but the gems are in a helmet: it still applies.
    const b = build(['flameBolt'], []);
    const helm = makeItem(uid, 'helmet_es_1', 40, 2, 'unique');
    helm.sockets = [makeGem(uid, 'frostLance'), null];
    helm.uniqueMods = [mod('gemLevel', 'base', 2, { tags: ['fire', 'spell'] })];
    b.equipment.helmet = helm;
    const c = new Character(b, { areaLevel: 40 });
    const base = levelOf(plain, 'flameBolt');
    expect(levelOf(c, 'flameBolt')).toBe(base + 2);
    expect(levelOf(c, 'frostLance')).toBe(levelOf(plain, 'frostLance'));
  });
});
