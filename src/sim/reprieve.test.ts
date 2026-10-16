import { describe, expect, it } from 'vitest';
import { CURSE_LEVELS, reprieveDef } from '../data/reprieves';
import { playOffer } from '../run/play';
import { heldReprieveIds } from '../run/provisions';
import { acquireReprieve, curseAffixes } from '../run/reprieves';
import { finishMap, newRun, planFor, setMap, type RunState } from '../run/run';
import { waysideOf } from '../run/wayside';
import { applyDamage, lifeCap } from './combat';
import { createWorld } from './world';
import type { World } from './types';

const LETHAL = (): number[] => [1e9, 0, 0, 0, 0];

function worldOn(map: number, reprieves: string[]): { run: RunState; w: World } {
  const run = newRun('vanguard', 3);
  setMap(run, map);
  const plan = planFor(run, run.offers[0]);
  const w = createWorld({ plan, build: run.build, xp: 0, opts: { reprieves } });
  return { run, w };
}

/** Drink the flasks down, so that a refill is something to see. */
function emptyFlasks(w: World): void {
  for (const f of w.sides[0].flasks) f.charges = 0;
}

describe('a Revive (docs/WAYSIDE.md 7)', () => {
  it("stands the character up at the item's share of life, makes it safe for a while, and is used up", () => {
    const { w } = worldOn(7, ['lastSpark']);
    const cap = lifeCap(w, w.player);
    applyDamage(w, w.player, LETHAL());
    expect(w.player.alive).toBe(true);
    expect(w.status).toBe('running');
    expect(w.player.life).toBeCloseTo(reprieveDef('lastSpark').life * cap, 3);
    expect(w.sides[0].reprieve.fired).toEqual(['lastSpark']);
    expect(w.events.some((e) => e.t === 'reprieve' && e.how === 'revive')).toBe(true);
    // Nothing can hurt it for the seconds that follow ...
    const life = w.player.life;
    applyDamage(w, w.player, LETHAL());
    expect(w.player.life).toBe(life);
    expect(w.player.alive).toBe(true);
    // ... and when they are over the next blow kills: the item is gone.
    w.sides[0].reprieve.invulnT = 0;
    applyDamage(w, w.player, LETHAL());
    expect(w.player.alive).toBe(false);
    expect(w.status).toBe('dead');
  });

  it('refills every flask, so that the character has something to drink', () => {
    const { w } = worldOn(7, ['lastSpark']);
    expect(w.sides[0].flasks.length).toBeGreaterThan(0);
    emptyFlasks(w);
    applyDamage(w, w.player, LETHAL());
    for (const f of w.sides[0].flasks) expect(f.charges).toBe(f.spec.maxCharges);
  });

  it('throws back and stuns the monsters around it', () => {
    const { w } = worldOn(7, ['lastSpark']);
    const monster = w.actors.find((a) => !a.isPlayer && a.faction === 1 && a.alive)!;
    monster.x = w.player.x + 2;
    monster.y = w.player.y;
    monster.stunT = 0;
    applyDamage(w, w.player, LETHAL());
    expect(monster.stunT).toBeGreaterThan(0);
  });

  it('works on a tenth map too', () => {
    const { w } = worldOn(10, ['lastSpark']);
    applyDamage(w, w.player, LETHAL());
    expect(w.player.alive).toBe(true);
    expect(w.sides[0].reprieve.fired).toEqual(['lastSpark']);
  });

  it('with several carried, the next one fires after the first has run out', () => {
    const { w } = worldOn(7, ['lastSpark', 'bargainCoin']);
    applyDamage(w, w.player, LETHAL());
    expect(w.sides[0].reprieve.fired).toEqual(['lastSpark']);
    w.sides[0].reprieve.invulnT = 0;
    applyDamage(w, w.player, LETHAL());
    expect(w.sides[0].reprieve.fired).toEqual(['lastSpark', 'bargainCoin']);
    expect(w.player.alive).toBe(true);
    expect(w.player.life).toBeCloseTo(reprieveDef('bargainCoin').life * lifeCap(w, w.player), 3);
    w.sides[0].reprieve.invulnT = 0;
    applyDamage(w, w.player, LETHAL());
    expect(w.status).toBe('dead');
  });

  it("is gone from the map's world when none is held, and the character dies as before", () => {
    const { w } = worldOn(7, []);
    applyDamage(w, w.player, LETHAL());
    expect(w.status).toBe('dead');
    expect(w.sides[0].reprieve.fired).toEqual([]);
  });
});

describe('a Retreat (docs/WAYSIDE.md 7.2 and 7.3)', () => {
  it('ends the map as an abandon with a quarter of the life and the flasks full, and is used up', () => {
    const { w } = worldOn(7, ['ferryToken']);
    const cap = lifeCap(w, w.player);
    emptyFlasks(w);
    applyDamage(w, w.player, LETHAL());
    expect(w.status).toBe('abandoned');
    expect(w.player.alive).toBe(true);
    expect(w.player.life).toBeCloseTo(reprieveDef('ferryToken').life * cap, 3);
    expect(w.sides[0].reprieve.fired).toEqual(['ferryToken']);
    expect(w.events.some((e) => e.t === 'reprieve' && e.how === 'retreat')).toBe(true);
    for (const f of w.sides[0].flasks) expect(f.charges).toBe(f.spec.maxCharges);
  });

  it('does nothing on a tenth map: the character dies', () => {
    for (const map of [10, 20, 100]) {
      const { w } = worldOn(map, ['ferryToken']);
      applyDamage(w, w.player, LETHAL());
      expect(w.status, `map ${map}`).toBe('dead');
      expect(w.sides[0].reprieve.fired).toEqual([]);
    }
  });

  it('is passed over on a tenth map for a revive that is carried with it', () => {
    const { w } = worldOn(10, ['ferryToken', 'lastSpark']);
    applyDamage(w, w.player, LETHAL());
    expect(w.status).toBe('running');
    expect(w.sides[0].reprieve.fired).toEqual(['lastSpark']);
  });
});

describe('a reprieve in a run', () => {
  it('turns a death into an abandon: the run goes on, the item is gone, the level is spent', () => {
    const run = newRun('vanguard', 5);
    setMap(run, 9);
    expect(acquireReprieve(run, 'ferryToken').ok).toBe(true);
    // A character far too weak for the map: it dies in the first fight without help.
    const res = playOffer(run, run.offers[0], (o) => (o.autoAbandonAt = Infinity));
    expect(res.status).toBe('abandoned');
    expect(res.reprieves).toEqual(['ferryToken']);
    finishMap(run, res);
    expect(run.phase).toBe('camp');
    expect(run.map).toBe(10);
    expect(heldReprieveIds(run)).toEqual([]);
    expect(run.history.at(-1)).toMatchObject({ status: 'abandoned', saved: ['ferryToken'] });
    expect(run.vitals.life).toBeLessThan(0.5);
    // ... and the flasks are full for the next level.
    for (const v of Object.values(run.vitals.flasks)) expect(v).toBe(1);
  });

  it('a Bargain Coin starts a curse for the next five levels, and the curse is on those maps', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 8);
    acquireReprieve(run, 'bargainCoin');
    const res = playOffer(run, run.offers[0], (o) => (o.autoAbandonAt = Infinity));
    expect(res.reprieves).toContain('bargainCoin');
    finishMap(run, res);
    const w = waysideOf(run);
    const until = 8 + CURSE_LEVELS;
    expect(w.curses).toEqual([{ id: 'bargain', until }]);
    for (let map = 9; map <= until; map++) {
      run.map = map;
      expect(curseAffixes(run), `map ${map}`).toEqual(['curse.bargain']);
    }
    run.map = until + 1;
    expect(curseAffixes(run)).toEqual([]);
    run.map = 9;
    expect(planFor(run, run.offers[0]).affixes).toContain('curse.bargain');
  });
});
