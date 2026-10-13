import { describe, expect, it } from 'vitest';
import { galleryEntries, galleryRun, galleryWorld } from '../run/gallery';
import { ACTIVE_GEMS, GRANTED_GEMS } from '../data/gems';
import { FALLING_SKILLS } from '../calc/skillLook';
import { stepWorld } from './world';
import type { SimEvent } from './types';

/** The events a skill emits in the training arena over a few seconds (what the renderer is given to draw). */
function eventsOf(id: string, seconds = 6): SimEvent[] {
  const entry = galleryEntries().find((e) => e.id === id)!;
  const w = galleryWorld(galleryRun(entry, 1), entry);
  const out: SimEvent[] = [];
  for (let i = 0; i < seconds * 60 && w.status === 'running'; i++) {
    stepWorld(w);
    out.push(...w.events);
  }
  return out;
}

describe('what the sim tells the renderer so that an area can be outlined (docs/VISUAL_LANGUAGE.md)', () => {
  it('a beam carries its width, and a strip its band', () => {
    const beams = eventsOf('blazeStream').filter((e) => e.t === 'beam');
    expect(beams.length).toBeGreaterThan(0);
    for (const b of beams) expect((b as { width?: number }).width).toBeGreaterThan(0);
    const strips = eventsOf('rimeSpires').filter((e) => e.t === 'explode' && e.strip);
    expect(strips.length).toBeGreaterThan(0);
    for (const s of strips) {
      const e = s as Extract<SimEvent, { t: 'explode' }>;
      expect(e.r).toBeGreaterThan(0);
      // The event's own centre is the middle of the band.
      expect(e.x).toBeCloseTo((e.strip![0] + e.strip![2]) / 2, 5);
    }
  });

  it('a warcry says how far it goes', () => {
    const cries = eventsOf('kindledBellow').filter((e) => e.t === 'cry');
    expect(cries.length).toBeGreaterThan(0);
    for (const c of cries) expect((c as { r: number }).r).toBeGreaterThan(1);
  });

  it('a rain of arrows or bolts says what falls', () => {
    const arrows = eventsOf('arrowShower').filter((e) => e.t === 'explode' && e.fall);
    expect(arrows.length).toBeGreaterThan(0);
    expect((arrows[0] as { fall?: string }).fall).toBe('arrow');
    const bolts = eventsOf('emberHail').filter((e) => e.t === 'explode' && e.fall);
    expect(bolts.length).toBeGreaterThan(0);
    expect((bolts[0] as { fall?: string }).fall).toBe('bolt');
  });

  it('the falling skills are all real skills', () => {
    const ids = new Set([...ACTIVE_GEMS, ...GRANTED_GEMS].map((g) => g.id));
    for (const id of FALLING_SKILLS) expect(ids.has(id), id).toBe(true);
  });
});
