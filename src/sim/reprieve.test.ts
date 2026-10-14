import { describe, expect, it } from 'vitest';
import { reprieveDef } from '../data/reprieves';
import { playOffer } from '../run/play';
import { acquireReprieve, curseAffixes } from '../run/reprieves';
import { finishMap, newRun, planFor, setMap, type RunState } from '../run/run';
import { waysideOf } from '../run/wayside';
import { applyDamage, lifeCap } from './combat';
import { createWorld } from './world';
import type { World } from './types';

const LETHAL = (): number[] => [1e9, 0, 0, 0, 0];

function worldOn(map: number, reprieve: string | null): { run: RunState; w: World } {
  const run = newRun('vanguard', 3);
  setMap(run, map);
  const plan = planFor(run, run.offers[0]);
  const w = createWorld({ plan, build: run.build, xp: 0, opts: { reprieve } });
  return { run, w };
}

describe('a Revive (docs/WAYSIDE.md 7)', () => {
  it("stands the character up at the item's share of life, makes it safe for a while, and is used up", () => {
    const { w } = worldOn(7, 'lastSpark');
    const cap = lifeCap(w, w.player);
    applyDamage(w, w.player, LETHAL());
    expect(w.player.alive).toBe(true);
    expect(w.status).toBe('running');
    expect(w.player.life).toBeCloseTo(0.35 * cap, 3);
    expect(w.reprieve.fired).toBe('lastSpark');
    expect(w.events.some((e) => e.t === 'reprieve' && e.how === 'revive')).toBe(true);
    // Nothing can hurt it for the seconds that follow ...
    const life = w.player.life;
    applyDamage(w, w.player, LETHAL());
    expect(w.player.life).toBe(life);
    expect(w.player.alive).toBe(true);
    // ... and when they are over the next blow kills: the item is gone.
    w.reprieve.invulnT = 0;
    applyDamage(w, w.player, LETHAL());
    expect(w.player.alive).toBe(false);
    expect(w.status).toBe('dead');
  });

  it('throws back and stuns the monsters around it', () => {
    const { w } = worldOn(7, 'lastSpark');
    const monster = w.actors.find((a) => !a.isPlayer && a.faction === 1 && a.alive)!;
    monster.x = w.player.x + 2;
    monster.y = w.player.y;
    monster.stunT = 0;
    applyDamage(w, w.player, LETHAL());
    expect(monster.stunT).toBeGreaterThan(1);
  });

  it('works on a tenth map too', () => {
    const { w } = worldOn(10, 'lastSpark');
    applyDamage(w, w.player, LETHAL());
    expect(w.player.alive).toBe(true);
    expect(w.reprieve.fired).toBe('lastSpark');
  });

  it("is gone from the map's world when none is held, and the character dies as before", () => {
    const { w } = worldOn(7, null);
    applyDamage(w, w.player, LETHAL());
    expect(w.status).toBe('dead');
    expect(w.reprieve.fired).toBeNull();
  });
});

describe('a Retreat (docs/WAYSIDE.md 7.2 and 7.3)', () => {
  it('ends the map as an abandon with a quarter of the life, and is used up', () => {
    const { w } = worldOn(7, 'ferryToken');
    const cap = lifeCap(w, w.player);
    applyDamage(w, w.player, LETHAL());
    expect(w.status).toBe('abandoned');
    expect(w.player.alive).toBe(true);
    expect(w.player.life).toBeCloseTo(0.25 * cap, 3);
    expect(w.reprieve.fired).toBe('ferryToken');
    expect(w.events.some((e) => e.t === 'reprieve' && e.how === 'retreat')).toBe(true);
  });

  it('does nothing on a tenth map: the character dies', () => {
    for (const map of [10, 20, 100]) {
      const { w } = worldOn(map, 'ferryToken');
      applyDamage(w, w.player, LETHAL());
      expect(w.status, `map ${map}`).toBe('dead');
      expect(w.reprieve.fired).toBeNull();
    }
  });
});

describe('a Reprieve in a run', () => {
  it('turns a death into an abandon: the run goes on, the item is gone, the level is spent', () => {
    const run = newRun('vanguard', 5);
    setMap(run, 9);
    expect(acquireReprieve(run, 'ferryToken').ok).toBe(true);
    // A character far too weak for the map: it dies in the first fight without help.
    const res = playOffer(run, run.offers[0], (o) => (o.autoAbandonAt = Infinity));
    expect(res.status).toBe('abandoned');
    expect(res.reprieve).toBe('ferryToken');
    finishMap(run, res);
    expect(run.phase).toBe('camp');
    expect(run.map).toBe(10);
    expect(waysideOf(run).reprieve).toBeNull();
    expect(run.history.at(-1)).toMatchObject({ status: 'abandoned', saved: 'ferryToken' });
    expect(run.vitals.life).toBeLessThan(0.5);
  });

  it('a Bargain Coin starts a curse for the next five levels, and the curse is on those maps', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 8);
    acquireReprieve(run, 'bargainCoin');
    const res = playOffer(run, run.offers[0], (o) => (o.autoAbandonAt = Infinity));
    expect(res.reprieve).toBe('bargainCoin');
    finishMap(run, res);
    const w = waysideOf(run);
    expect(w.curses).toEqual([{ id: 'bargain', until: 13 }]);
    for (const map of [9, 10, 11, 12, 13]) {
      run.map = map;
      expect(curseAffixes(run), `map ${map}`).toEqual(['curse.bargain']);
    }
    run.map = 14;
    expect(curseAffixes(run)).toEqual([]);
    run.map = 9;
    expect(planFor(run, run.offers[0]).affixes).toContain('curse.bargain');
  });

  it('holds one at a time and three in a run', () => {
    const run = newRun('vanguard', 7);
    expect(acquireReprieve(run, 'ferryToken').ok).toBe(true);
    expect(acquireReprieve(run, 'lastSpark').ok).toBe(false);
    for (const id of ['lastSpark', 'bargainCoin'] as const) {
      waysideOf(run).reprieve = null;
      expect(acquireReprieve(run, id).ok).toBe(true);
    }
    waysideOf(run).reprieve = null;
    expect(acquireReprieve(run, 'ferryToken').ok).toBe(false);
    expect(waysideOf(run).reprieves).toBe(3);
  });

  it('every Reprieve has its own data', () => {
    for (const id of ['ferryToken', 'lastSpark', 'bargainCoin'] as const) {
      const d = reprieveDef(id);
      expect(d.life).toBeGreaterThan(0);
      expect(d.life).toBeLessThan(1);
      expect(d.base).toBeGreaterThan(0);
    }
  });
});
