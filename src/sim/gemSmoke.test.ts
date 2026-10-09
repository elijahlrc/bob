import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { resolveActive } from '../calc/gems';
import {
  ACTIVE_GEMS,
  AURA_GEMS,
  GRANTED_GEMS,
  SUPPORT_GEMS,
  type SupportGemDef,
} from '../data/gems';
import { typesAllow } from '../data/skillTypes';
import { createDummyWorld } from './dummy';
import { buildFor, buildForActive, classFor as ATTR_CLASS, weaponFor } from './gemKit';
import { stepWorld } from './world';

/**
 * A smoke test generated for every gem (COVERAGE 7.3): its sheet computes, the sim uses it for ten seconds against the
 * dummy without error and deals damage if it is a damage skill, and its support compatibility follows its rules. New
 * gems are covered the moment they exist.
 */

const finite = (x: number) => Number.isFinite(x);

describe('every active gem', () => {
  for (const def of [...ACTIVE_GEMS, ...GRANTED_GEMS]) {
    it(`${def.id}: its sheet computes and the sim uses it for ten seconds`, () => {
      const granted = GRANTED_GEMS.includes(def);
      const b = buildForActive(def);
      const c = new Character(b, { areaLevel: 50 });
      const sheet = c.sheet();
      if (def.selfTrigger) {
        // A counter-attack: a trigger of its own casts it, and it is never the primary skill.
        expect(c.primary.skill.id).toBe('crushingBlow');
        expect(c.triggers.some((t) => t.skills.some((x) => x.skill.id === def.id))).toBe(true);
        expect(finite(sheet.life)).toBe(true);
        return;
      }
      if (def.utility) {
        // A utility skill is cast by policy next to a damage skill: it never becomes the primary, and its effect shows up.
        expect(c.utilities.map((u) => u.skill.id)).toContain(def.id);
        expect(c.primary.skill.id).toBe('crushingBlow');
        const { world, dummy } = createDummyWorld(b, { distance: 2 });
        world.opts.freeResources = true;
        world.opts.godMode = true;
        dummy.rarity = 'boss'; // rallying skills wait for a pack or a big enemy
        let seen = false;
        const u = def.utility;
        // A guard waits for low life.
        if (u.kind === 'buff' && u.policy === 'guard')
          world.player.life = world.player.def.maxLife * 0.4;
        for (let i = 0; i < 20 * 60 && !seen; i++) {
          stepWorld(world);
          if (u.kind === 'buff') seen = world.buffT[u.buff] > 0;
          else if (u.kind === 'curse') seen = dummy.hexes.some((h) => h.id === u.hex);
          else if (u.kind === 'summon') seen = world.minions.length > 0;
          else if (u.kind === 'shout') seen = Object.keys(dummy.fx).length > 0;
          else seen = true;
        }
        expect(seen).toBe(true);
        return;
      }
      for (const v of [sheet.life, sheet.mana, sheet.skill.totalDps, sheet.skill.avgHit, sheet.ehp])
        expect(finite(v)).toBe(true);
      if (granted && !def.utility) return;
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
      const ok = actives.filter((a) => typesAllow(s, new Set(resolveActive(a, 1).types)));
      // A support nothing can use is a data mistake (unless it is a trigger or hex support that needs others).
      expect(ok.length).toBeGreaterThan(0);
      const a = ok[0];
      const b = buildFor([a.id, s.id], weaponFor(a), ATTR_CLASS(a.attr));
      const c = new Character(b, { areaLevel: 50 });
      expect(finite(c.sheet().skill.totalDps)).toBe(true);
      if (s.blasphemy) {
        // The curse stands on enemies hit and reserves mana instead of being cast.
        const choice = c.actives.find((x) => x.skill.id === a.id)!;
        expect(choice.supports.map((x) => x.def.id)).toContain(s.id);
        expect(c.hexes.length).toBeGreaterThan(0);
        expect(c.reservedMana).toBeGreaterThan(0);
        expect(c.utilities).toHaveLength(0);
      } else if (!s.trigger && !s.hexOnHit) {
        const choice = c.actives.find((x) => x.skill.id === a.id)!;
        expect(choice.supports.map((x) => x.def.id)).toContain(s.id);
      }
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
  for (const def of AURA_GEMS) {
    it(`${def.id}: socketed beside an attack, the sheet computes`, () => {
      const b = buildFor(['crushingBlow', def.id], 'mace2_3', 'vanguard');
      const sheet = new Character(b, { areaLevel: 50 }).sheet();
      expect(finite(sheet.skill.totalDps)).toBe(true);
      expect(finite(sheet.life)).toBe(true);
    });
  }
});

describe('every aura gem', () => {
  for (const def of AURA_GEMS) {
    it(`${def.id}: is active when socketed, reserves what it says, and its sheet computes`, () => {
      const b = buildFor([def.id], 'sword_3', ATTR_CLASS(def.attr));
      const c = new Character(b, { areaLevel: 50 });
      const sheet = c.sheet();
      expect(c.auras.map((a) => a.def.id)).toContain(def.id);
      const a = c.auras.find((x) => x.def.id === def.id)!;
      expect(a.active).toBe(true);
      if (def.reservePct) expect(a.reserved).toBeGreaterThan(0);
      for (const t of def.triggers ?? [])
        expect(c.triggers.some((s) => s.def.effect.kind === t.effect.kind)).toBe(true);
      expect(finite(sheet.life)).toBe(true);
      expect(finite(sheet.ehp)).toBe(true);
    });
  }
});
