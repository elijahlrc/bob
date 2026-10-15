import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, GRANTED_GEMS, type ActiveGemDef } from '../data/gems';
import {
  BEAM_MOTIF,
  MOTIFS,
  MOTIF_LOOK,
  SKILL_MOTIF,
  beamMotifOf,
  fallbackMotif,
  motifOf,
} from './areaLook';
import { activeLook } from './skillLook';

const GEMS: ActiveGemDef[] = [...ACTIVE_GEMS, ...GRANTED_GEMS];
const byId = new Map(GEMS.map((g) => [g.id, g]));

/** A skill that puts damage on ground: it lands an area (a burst, a zone, a strip, a nova, an explosion). */
const AREA_KEYS = [
  'leaves',
  'afterHit',
  'mortar',
  'geyser',
  'pods',
  'crystal',
  'wall',
  'orb',
  'markers',
  'stormOrb',
  'cascade',
  'aftershock',
  'volleys',
  'wave',
  'vortex',
  'bladestorm',
  'pulse',
  'mineRain',
  'fuse',
  'charge',
] as const;
function makesArea(g: ActiveGemDef): boolean {
  const l = activeLook(g);
  if (l.element < 0) return false;
  const b = g.behaviour as { explodeRadius?: number };
  const rec = g as unknown as Record<string, unknown>;
  return (
    ['blast', 'nova', 'field', 'wall'].includes(l.delivery) ||
    !!b.explodeRadius ||
    AREA_KEYS.some((k) => rec[k])
  );
}

/** Skills that make an area only in passing and are drawn by what they are (a strike, a swing): no motif of their own. */
const NO_OWN_MOTIF = new Set(['rimeSplinter', 'boltCleave', 'sweepingCut', 'cinderBond']);

describe('what an area looks like (areaLook.ts)', () => {
  it('every motif is described, and every skill named in the tables is a gem', () => {
    for (const m of MOTIFS) expect(MOTIF_LOOK[m], m).toBeTruthy();
    for (const id of [...Object.keys(SKILL_MOTIF), ...Object.keys(BEAM_MOTIF)])
      expect(byId.has(id), id).toBe(true);
    for (const m of [...Object.values(SKILL_MOTIF), ...Object.values(BEAM_MOTIF)])
      expect(MOTIFS).toContain(m);
  });

  it('every skill that lands an area has a motif of its own', () => {
    for (const g of GEMS)
      if (makesArea(g) && !NO_OWN_MOTIF.has(g.id)) expect(SKILL_MOTIF[g.id], g.id).toBeTruthy();
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

  it('a skill with no motif of its own falls back to one of its element and delivery', () => {
    expect(motifOf('nothing', 1)).toBe('strike');
    expect(motifOf('nothing', 2)).toBe('frostBloom');
    expect(motifOf('nothing', 3, true)).toBe('flameLine');
    expect(fallbackMotif('nova', 4)).toBe('cloud');
    expect(fallbackMotif('field', 0)).toBe('quake');
  });

  it('the band of a beam is what it is made of; lightning keeps the bolt', () => {
    expect(beamMotifOf('scorchWave', 3)).toBe('flameLine');
    expect(beamMotifOf('witheringBreath', 4)).toBe('breath');
    expect(beamMotifOf('x', 1)).toBeNull();
  });
});
