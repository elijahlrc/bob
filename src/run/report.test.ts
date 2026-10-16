import { describe, expect, it } from 'vitest';
import { FACTION_NAMES } from '../data/monsters';
import { randomRun } from './randomBot';

describe('run metrics', () => {
  it('the random player records who killed it', () => {
    const r = randomRun('vanguard', 2000, 30);
    expect(r.died).toBe(true);
    expect(Object.keys(FACTION_NAMES)).toContain(r.killer?.faction);
    expect(r.deathMap).toBe(r.reached);
    expect(r.signature.length).toBeGreaterThan(0);
  });
});
