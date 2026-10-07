import { describe, expect, it } from 'vitest';
import { stepWorld } from '../sim/world';
import { galleryEntries, galleryRun, galleryWorld } from './gallery';

describe('skill gallery', () => {
  it('shows every skill: the gem is the main skill, a utility skill or an aura of the character, and the arena runs', () => {
    const entries = galleryEntries();
    expect(entries.length).toBeGreaterThan(150);
    for (const e of entries) {
      const world = galleryWorld(galleryRun(e, 1), e);
      const ch = world.char;
      const has =
        ch.primary.skill.id === e.id ||
        ch.utilities.some((c) => c.skill.id === e.id) ||
        ch.auras.some((a) => a.def.id === e.id) ||
        ch.actives.some((c) => c.skill.id === e.id);
      expect(has, `${e.id} is not on the character: ${ch.warnings.join('; ')}`).toBe(true);
      for (let i = 0; i < 90; i++) stepWorld(world);
      expect(world.status).toBe('running');
    }
  });
});
