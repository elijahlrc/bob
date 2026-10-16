import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, GRANTED_GEMS, type ActiveGemDef } from '../data/gems';
import { BEAM_MOTIF, SKILL_MOTIF } from './areaLook';
import { activeLook } from './skillLook';

const GEMS: ActiveGemDef[] = [...ACTIVE_GEMS, ...GRANTED_GEMS];
const byId = new Map(GEMS.map((g) => [g.id, g]));

describe('what an area looks like (areaLook.ts)', () => {
  it('every skill named in the tables is a gem', () => {
    for (const id of [...Object.keys(SKILL_MOTIF), ...Object.keys(BEAM_MOTIF)])
      expect(byId.has(id), id).toBe(true);
  });

  it('a motif says what the skill is made of: lightning only for lightning, frost for cold, flame for fire, rot for chaos', () => {
    const needs: Record<string, string> = {
      strike: 'lightning',
      storm: 'lightning',
      pillar: 'lightning',
      crackleNova: 'lightning',
      crackleLine: 'lightning',
      frostBloom: 'cold',
      freeze: 'cold',
      iceShatter: 'cold',
      iceWaves: 'cold',
      iceNova: 'cold',
      whirlFrost: 'cold',
      iceSpikes: 'cold',
      flames: 'fire',
      geyser: 'fire',
      fireball: 'fire',
      fireNova: 'fire',
      flameLine: 'fire',
      lava: 'fire',
      splat: 'fire',
      cloud: 'chaos',
      ritual: 'chaos',
      breath: 'chaos',
    };
    for (const [id, m] of Object.entries(SKILL_MOTIF)) {
      const tag = needs[m];
      if (!tag) continue;
      const g = byId.get(id)!;
      const l = activeLook(g);
      const element = ['physical', 'lightning', 'cold', 'fire', 'chaos'][l.element];
      expect(g.tags.includes(tag as never) || element === tag, `${id}: ${m}`).toBe(true);
    }
  });
});
