import { describe, expect, it } from 'vitest';
import { planRotation, type PlanSkill } from './rotation';

const skill = (key: string, useTime: number, over: Partial<PlanSkill> = {}): PlanSkill => ({
  key,
  useTime,
  pause: 3,
  ...over,
});
const periodic = (s: PlanSkill) => ({ ...s, utility: false });
const utility = (s: PlanSkill) => ({ ...s, utility: true });

describe('the rotation plan (docs/SHEET-AUDIT.md)', () => {
  it('a lone main skill is used back to back, and the weapon not at all', () => {
    const p = planRotation({ rotation: [], mains: [skill('a', 0.5)], weapon: 1 });
    expect(p.acts.a).toBeCloseTo(2, 2);
    expect(p.weapon).toBe(0);
    expect(p.busy.a).toBeCloseTo(1, 2);
  });

  it('a main skill on a cooldown leaves gaps that the weapon fills', () => {
    const p = planRotation({
      rotation: [],
      mains: [skill('a', 0.5, { cooldown: { seconds: 2.5, uses: 1 } })],
      weapon: 1,
    });
    expect(p.acts.a).toBeCloseTo(0.4, 2);
    // Two weapon uses fit between one use of the skill and the next.
    expect(p.weapon).toBeCloseTo(0.8, 2);
  });

  it('the gap is filled by the next main skill before the weapon', () => {
    const p = planRotation({
      rotation: [],
      mains: [skill('a', 0.5, { cooldown: { seconds: 2.5, uses: 1 } }), skill('b', 0.5)],
      weapon: 1,
    });
    expect(p.acts.a).toBeCloseTo(0.4, 1);
    expect(p.weapon).toBe(0);
    expect(p.acts.a * 0.5 + p.acts.b * 0.5).toBeCloseTo(1, 2);
  });

  it('a periodic skill stands in for a main skill that waits, whatever its pause', () => {
    const p = planRotation({
      rotation: [periodic(skill('p', 0.5, { pause: 3 }))],
      mains: [skill('a', 0.5, { cooldown: { seconds: 2.5, uses: 1 } })],
      weapon: 1,
    });
    // Its pause would allow a third of a use a second; it fills every gap the main skill leaves instead.
    expect(p.acts.p).toBeGreaterThan(1);
    expect(p.weapon).toBe(0);
    expect(p.acts.a).toBeCloseTo(0.4, 1);
  });

  it('a periodic skill waits out its pause when a main skill can be used', () => {
    const p = planRotation({
      rotation: [periodic(skill('p', 0.5, { pause: 3 }))],
      mains: [skill('a', 0.5)],
      weapon: 1,
    });
    // One use in about every 3 seconds, the main skill the rest of the time.
    expect(p.acts.p).toBeCloseTo(1 / 3, 1);
    expect(p.acts.a).toBeCloseTo((1 - 0.5 / 3) / 0.5, 1);
  });

  it('a periodic skill with a cooldown of its own is used whenever a use is ready', () => {
    const p = planRotation({
      rotation: [periodic(skill('p', 0.5, { cooldown: { seconds: 2, uses: 1 } }))],
      mains: [skill('a', 0.5)],
      weapon: 1,
    });
    // Ready every 2 s, but used between actions of the main skill (every 0.5 s): a cycle of 2 s.
    expect(p.acts.p).toBeCloseTo(0.5, 1);
  });

  it('a utility skill is cast on its own interval and takes its time', () => {
    const p = planRotation({
      rotation: [utility(skill('u', 1, { pause: 10 }))],
      mains: [skill('a', 0.5)],
      weapon: 1,
    });
    expect(p.acts.u).toBeCloseTo(0.1, 2);
    expect(p.busy.u).toBeCloseTo(0.1, 2);
  });

  it('totems are put down only while fewer than the most stand, and shoot for as long as they stand', () => {
    const p = planRotation({
      rotation: [],
      mains: [
        skill('t', 0.5, { standing: { count: 3, seconds: 10, firstShot: 0.4, interval: 1 } }),
      ],
      weapon: 1,
    });
    // Three totems per ten seconds, about nine shots each; the weapon fills the time between.
    expect(p.acts.t).toBeCloseTo(0.3, 1);
    expect(p.shots.t).toBeGreaterThan(2.4);
    expect(p.shots.t).toBeLessThan(3);
    expect(p.weapon).toBeGreaterThan(0.8);
  });

  it('charges held let a cooldown skill be used several times in a row', () => {
    const one = planRotation({
      rotation: [],
      mains: [skill('a', 0.5, { cooldown: { seconds: 4, uses: 1 } })],
      weapon: 0.5,
    });
    const two = planRotation({
      rotation: [],
      mains: [skill('a', 0.5, { cooldown: { seconds: 4, uses: 2 } })],
      weapon: 0.5,
    });
    // The average rate is the cooldown's either way: a stock only gathers use for bursts.
    expect(one.acts.a).toBeCloseTo(0.25, 1);
    expect(two.acts.a).toBeCloseTo(0.25, 1);
  });
});
