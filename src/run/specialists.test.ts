import { describe, expect, it } from 'vitest';
import { affixRarePacks, MAP_AFFIXES } from '../data/mapAffixes';
import { crescendoStep, crescendoStepAt } from '../data/mapTypes';
import { provisionAffixId } from '../data/provisions';
import { createWorld, stepWorld } from '../sim/world';
import { makeOffer, type MapOffer } from './offers';
import {
  addProvision,
  armProvision,
  cancelledAffix,
  provisionAffixes,
  startProvisions,
} from './provisions';
import { offersFor } from './preview';
import { newRun, planFor, setMap } from './run';

const offerWith = (type: MapOffer['type'], affixes: string[] = []): MapOffer => ({
  ...makeOffer(1, 12, 0, 'sporefen', 0, type),
  affixes,
});

describe("Hunter's Bell", () => {
  it('adds three rare packs, experience and quantity to the map', () => {
    expect(affixRarePacks(provisionAffixId('hunterBell'), 10)).toBe(3);
    expect(affixRarePacks(provisionAffixId('hunterBell'), 80)).toBe(3);
    const run = newRun('vanguard', 2);
    setMap(run, 12);
    run.build = { ...run.build, level: 12 };
    const before = offersFor(run)[0];
    addProvision(run, 'hunterBell');
    armProvision(run, 'hunterBell');
    const after = offersFor(run)[0];
    expect(after.rewards!.experience).toBeGreaterThan(before.rewards!.experience + 0.2);
    expect(after.rewards!.quantity).toBeGreaterThan(before.rewards!.quantity + 0.15);
    expect(after.rewards!.monsters.rare).toBeGreaterThan(before.rewards!.monsters.rare);
  });
});

describe('Slow Fuse', () => {
  it('pays only on a Crescendo map, and stretches its steps to twice as long', () => {
    expect(provisionAffixes(['slowFuse'], offerWith('plain'))).toEqual([]);
    expect(provisionAffixes(['slowFuse'], offerWith('crescendo'))).toEqual([
      provisionAffixId('slowFuse'),
    ]);
    expect(crescendoStepAt(300, 0.5)).toBeLessThan(crescendoStep(300));
    expect(crescendoStepAt(30 + 15 * 8, 0.5)).toBe(4);
    expect(crescendoStep(30 + 15 * 8)).toBe(8);
  });

  it("slows the world's own step", () => {
    for (const armed of [false, true]) {
      const run = newRun('vanguard', 3);
      setMap(run, 12);
      const offer = { ...run.offers[0], type: 'crescendo' as const };
      run.offers[0] = offer;
      if (armed) {
        addProvision(run, 'slowFuse');
        armProvision(run, 'slowFuse');
        startProvisions(run);
      }
      const w = createWorld({
        plan: planFor(run, offer),
        build: run.build,
        xp: 0,
        opts: { maxTime: 1000 },
      });
      w.t = 30 + 15 * 8 + 0.5;
      w.player.life = 1e9;
      w.player.def = { ...w.player.def, maxLife: 1e9 };
      stepWorld(w);
      expect(w.surge).toBe(armed ? 4 : 8);
    }
  });
});

describe('Bonebreaker', () => {
  it('pays only on a Throng map, with more area for you and less life for them', () => {
    expect(provisionAffixes(['bonebreaker'], offerWith('plain'))).toEqual([]);
    expect(provisionAffixes(['bonebreaker'], offerWith('throng'))).toEqual([
      provisionAffixId('bonebreaker'),
    ]);
    const a = MAP_AFFIXES.find((x) => x.id === provisionAffixId('bonebreaker'))!;
    expect(a.playerMods?.some((m) => m.stat === 'aoe' && m.value === 30)).toBe(true);
    expect(a.monsterMods?.some((m) => m.stat === 'life' && m.value === -20)).toBe(true);
  });
});

describe('Counterweight', () => {
  const lifeAffix = MAP_AFFIXES.find(
    (a) => !a.id.includes('.') && a.monsterMods?.some((m) => m.stat === 'life' && m.value >= 40),
  )!;
  const quiet = MAP_AFFIXES.find((a) => a.id === 'noLeech')!;

  it('pays only on a map with an affix of its own, and cancels the one that makes it hardest', () => {
    expect(provisionAffixes(['counterweight'], offerWith('plain'))).toEqual([]);
    const offer = offerWith('plain', [quiet.id, lifeAffix.id]);
    expect(provisionAffixes(['counterweight'], offer)).toEqual([provisionAffixId('counterweight')]);
    expect(cancelledAffix(offer, ['counterweight'])).toBe(lifeAffix.id);
    expect(cancelledAffix(offer, ['whettedPowder'])).toBeNull();
    expect(cancelledAffix(offerWith('plain'), ['counterweight'])).toBeNull();
  });

  it('takes that affix off the map that is played, and shows it struck through on the card', () => {
    const run = newRun('vanguard', 4);
    setMap(run, 12);
    run.build = { ...run.build, level: 12 };
    run.offers[0] = { ...run.offers[0], affixes: [quiet.id, lifeAffix.id] };
    addProvision(run, 'counterweight');
    armProvision(run, 'counterweight');
    expect(offersFor(run)[0].cancelled).toBe(lifeAffix.id);
    expect(offersFor(run)[0].affixes).toEqual([quiet.id, lifeAffix.id]);
    startProvisions(run);
    const plan = planFor(run, run.offers[0]);
    expect(plan.affixes).not.toContain(lifeAffix.id);
    expect(plan.affixes).toContain(quiet.id);
    expect(plan.affixes).toContain(provisionAffixId('counterweight'));
  });
});
