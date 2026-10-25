import { describe, expect, it } from 'vitest';
import { galleryEntries, galleryRun, galleryWorld } from '../run/gallery';
import { stepWorld } from './world';
import type { SimEvent, World } from './types';

/** Things the character throws fly before they burst (docs/VISUAL_LANGUAGE.md): the events and shells the training arena shows. */

type Tick = { t: number; events: SimEvent[] };

/** Run a skill in the training arena, calling `each` after every tick; returns the events by tick. */
function play(id: string, seconds: number, each?: (w: World) => void): Tick[] {
  const entry = galleryEntries().find((e) => e.id === id)!;
  const w = galleryWorld(galleryRun(entry, 1), entry);
  const out: Tick[] = [];
  for (let i = 0; i < seconds * 60 && w.status === 'running'; i++) {
    stepWorld(w);
    out.push({ t: w.t, events: [...w.events] });
    each?.(w);
  }
  return out;
}

const explodes = (ticks: Tick[]) =>
  ticks.flatMap((k) => k.events.flatMap((e) => (e.t === 'explode' ? [{ ...e, at: k.t }] : [])));

describe('Slag Blow: the balls are thrown from the hand and burst where they land', () => {
  it('each ball is a lobbed shell, none is a ground zone, and it bursts 0.3 to 0.6 s after the blow', () => {
    const shells = new Map<number, { born: number; x: number; y: number; r: number }>();
    let zones = 0;
    const ticks = play('slagBlow', 6, (w) => {
      zones = Math.max(zones, w.sides[0].zones.length);
      for (const pr of w.projectiles)
        if (pr.kind === 'mortar' && !shells.has(pr.id)) {
          const sp = Math.hypot(pr.vx, pr.vy);
          shells.set(pr.id, {
            born: w.t,
            x: pr.startX + (pr.vx / sp) * pr.maxRange,
            y: pr.startY + (pr.vy / sp) * pr.maxRange,
            r: pr.explodeRadius,
          });
        }
    });
    expect(shells.size).toBeGreaterThan(3);
    expect(zones).toBe(0);
    const bursts = explodes(ticks).filter((b) => b.skill === 'slagBlow');
    // Every ball bursts on its spot with the radius it was thrown with, a flight after it left the hand.
    let landed = 0;
    for (const s of shells.values()) {
      const b = bursts.find((x) => Math.hypot(x.x - s.x, x.y - s.y) < 0.05 && x.at >= s.born);
      if (!b) continue;
      landed++;
      expect(b.r).toBeCloseTo(s.r, 5);
      expect(b.at - s.born).toBeGreaterThanOrEqual(0.25);
      expect(b.at - s.born).toBeLessThanOrEqual(0.7);
    }
    // (Balls still in the air when the run ends have not burst.)
    expect(landed).toBeGreaterThanOrEqual(shells.size - 4);
    expect(bursts.length).toBeGreaterThan(3);
  });
});

describe('Hoarfrost Mote: the ice flies from the orb and bursts when it lands', () => {
  it('every shard is thrown first, and its burst follows 0.15 to 0.25 s later on the spot it was thrown to', () => {
    const ticks = play('hoarfrostMote', 6);
    const hurls = ticks.flatMap((k) =>
      k.events.flatMap((e) => (e.t === 'hurl' ? [{ ...e, at: k.t }] : [])),
    );
    const bursts = explodes(ticks).filter((b) => b.skill === 'hoarfrostMote');
    expect(hurls.length).toBeGreaterThan(3);
    for (const h of hurls) {
      expect(h.dur).toBeGreaterThanOrEqual(0.15);
      expect(h.dur).toBeLessThanOrEqual(0.25);
      // (A shard thrown in the last moments may not have landed when the run ends.)
      if (h.at + h.dur + 0.1 > ticks[ticks.length - 1].t) continue;
      const b = bursts.find((x) => Math.hypot(x.x - h.x2, x.y - h.y2) < 1e-6 && x.at >= h.at);
      expect(b, 'a burst on the spot').toBeDefined();
      expect(b!.at - h.at).toBeGreaterThanOrEqual(h.dur - 1 / 60);
      expect(b!.at - h.at).toBeLessThanOrEqual(h.dur + 2 / 60);
      expect(b!.pulse).toBe(true);
    }
    // Nothing bursts that was not thrown.
    expect(bursts.length).toBeLessThanOrEqual(hurls.length);
  });
});

describe('Mortar Charge: the smaller bursts come down from above', () => {
  it("the rain bursts say what falls, and the mine's own burst does not", () => {
    const ticks = play('mortarCharge', 8);
    const all = explodes(ticks).filter((b) => b.skill === 'mortarCharge');
    const rain = all.filter((b) => b.fall);
    const main = all.filter((b) => !b.fall);
    expect(rain.length).toBeGreaterThan(1);
    expect(main.length).toBeGreaterThan(0);
    for (const b of rain) expect(b.fall).toBe('bolt');
    // The rain is the smaller one.
    const biggestRain = Math.max(...rain.map((b) => b.r));
    for (const b of main) expect(b.r).toBeGreaterThan(biggestRain);
  });
});
