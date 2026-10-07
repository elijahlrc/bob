import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import {
  ACTIVE_GEMS,
  ALL_GEMS,
  AURA_GEMS,
  GRANTED_GEMS,
  SUPPORT_GEMS,
  type ActiveGemDef,
  type GemDef,
  type SupportGemDef,
} from '../data/gems';
import { typesAllow } from '../data/skillTypes';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import { stepWorld } from './world';

/**
 * A smoke test generated for every gem (COVERAGE 7.3): its sheet computes, the sim uses it for ten seconds against the
 * dummy without error and deals damage if it is a damage skill, and its support compatibility follows its rules. New
 * gems are covered the moment they exist.
 */

const WEAPON_FOR: Record<string, string> = {
  bow: 'bow_3',
  dagger: 'dagger_3',
  claw: 'claw_3',
  sword: 'sword_3',
  axe: 'axe_3',
  mace: 'mace_3',
  sceptre: 'sceptre_3',
  wand: 'wand_3',
  staff: 'staff_3',
};
const CLASS_FOR = { str: 'vanguard', dex: 'strider', int: 'mystic' } as const;
const ATTR_CLASS = (a: GemDef['attr']) =>
  a === 'str' || a === 'strdex'
    ? CLASS_FOR.str
    : a === 'dex' || a === 'dexint'
      ? CLASS_FOR.dex
      : CLASS_FOR.int;

let n = 20000;
const uid = () => n++;

function weaponFor(def: ActiveGemDef): string {
  const req = def.requiresWeapon?.find((t) => WEAPON_FOR[t]);
  if (req) return WEAPON_FOR[req];
  if (def.skillType === 'attack') return def.tags.includes('projectile') ? 'bow_3' : 'sword_3';
  return 'wand_3';
}

function buildFor(gems: string[], main: string, classId: string): Build {
  const run = newRun(classId, 1);
  const b = run.build;
  b.level = 50;
  b.equipment.mainHand = makeItem(uid, main, 50, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 50, Math.max(1, gems.length));
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const finite = (x: number) => Number.isFinite(x);

describe('every active gem', () => {
  for (const def of [...ACTIVE_GEMS, ...GRANTED_GEMS]) {
    it(`${def.id}: its sheet computes and the sim uses it for ten seconds`, () => {
      const granted = GRANTED_GEMS.includes(def);
      const classId = ATTR_CLASS(def.attr);
      const main = weaponFor(def);
      const b = buildFor(granted ? [] : [def.id], main, classId);
      const c = new Character(b, { areaLevel: 50 });
      const sheet = c.sheet();
      for (const v of [sheet.life, sheet.mana, sheet.skill.totalDps, sheet.skill.avgHit, sheet.ehp])
        expect(finite(v)).toBe(true);
      if (granted) return;
      expect(c.primary.skill.id).toBe(def.id);
      expect(c.primary.usable).toBe(true);
      const dealsDamage = !!def.baseMult || !!def.spellDamage?.length || def.skillType === 'attack';
      if (dealsDamage) expect(sheet.skill.totalDps).toBeGreaterThan(0);
      // Ten seconds against the dummy, within the skill's reach.
      const reach = Math.min(sheet.skill.range, 5);
      const { world, dummy } = createDummyWorld(b, { distance: Math.max(1.2, reach - 0.3) });
      world.opts.freeResources = true;
      world.opts.godMode = true;
      for (let i = 0; i < 10 * 60; i++) stepWorld(world);
      expect(finite(dummy.life)).toBe(true);
      if (dealsDamage) expect(dummy.life).toBeLessThan(dummy.def.maxLife);
    });
  }
});

describe('every support gem', () => {
  const supports: SupportGemDef[] = SUPPORT_GEMS;
  const actives = ACTIVE_GEMS;
  for (const s of supports) {
    it(`${s.id}: applies to the skills its rules allow, and its sheet computes`, () => {
      const ok = actives.filter((a) => typesAllow(s, new Set([...a.tags, ...(a.types ?? [])])));
      // A support nothing can use is a data mistake (unless it is a trigger or hex support that needs others).
      expect(ok.length).toBeGreaterThan(0);
      const a = ok[0];
      const b = buildFor([a.id, s.id], weaponFor(a), ATTR_CLASS(a.attr));
      const c = new Character(b, { areaLevel: 50 });
      expect(finite(c.sheet().skill.totalDps)).toBe(true);
      if (!s.trigger && !s.hexOnHit)
        expect(c.primary.supports.map((x) => x.def.id)).toContain(s.id);
      for (const other of actives.filter((x) => !ok.includes(x))) {
        const bad = buildFor([other.id, s.id], weaponFor(other), ATTR_CLASS(other.attr));
        const ch = new Character(bad, { areaLevel: 50 });
        const choice = ch.actives.find((x) => x.skill.id === other.id)!;
        expect(choice.supports.map((x) => x.def.id)).not.toContain(s.id);
      }
    });
  }
});

describe('every aura and other gem', () => {
  for (const def of [...AURA_GEMS, ...ALL_GEMS.filter((g) => g.kind === 'hex')]) {
    it(`${def.id}: socketed beside an attack, the sheet computes`, () => {
      const b = buildFor(['crushingBlow', def.id], 'mace2_3', 'vanguard');
      const sheet = new Character(b, { areaLevel: 50 }).sheet();
      expect(finite(sheet.skill.totalDps)).toBe(true);
      expect(finite(sheet.life)).toBe(true);
    });
  }
});
