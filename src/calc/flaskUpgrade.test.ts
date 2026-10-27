import { describe, expect, it } from 'vitest';
import { mod } from '../mods/types';
import type { FlaskItem } from '../data/types';
import { makeFlask } from '../gen/items';
import { flaskBeats, flaskHigherTier, flaskUpgradesOver, sameFlaskType } from './flaskUpgrade';

let n = 1;
const flask = (baseId: string, affixes: FlaskItem['affixes'] = []): FlaskItem => ({
  ...makeFlask(() => n++, baseId, 20),
  affixes,
});
const roll = (family: string, ...mods: ReturnType<typeof mod>[]) => ({ family, tier: 1, mods });
const deeper = roll('flaskCharges', mod('flask.maxCharges', 'inc', 40));
const bigger = roll('flaskAmount', mod('flask.amount', 'inc', 30));
const instant = roll(
  'flaskInstant',
  mod('flask.instant', 'flag', 1),
  mod('flask.amount', 'more', -25),
);
const dousing = roll('flaskRemoveIgnite', mod('removeIgnite', 'flag', 1));

describe('a strictly better flask', () => {
  it('has the same base with an affix that adds and takes nothing away', () => {
    const plain = flask('flask_life_l6');
    expect(flaskBeats(flask('flask_life_l6', [deeper]), plain)).toBe(true);
    expect(flaskBeats(flask('flask_life_l6', [bigger]), plain)).toBe(true);
    expect(flaskBeats(flask('flask_life_l6', [dousing]), plain)).toBe(true);
    expect(flaskBeats(plain, flask('flask_life_l6', [deeper]))).toBe(false);
  });

  it('is not a copy of the same flask, nor a trade', () => {
    const plain = flask('flask_life_l6');
    expect(flaskBeats(flask('flask_life_l6'), plain)).toBe(false);
    // Instant recovers less: better in one thing, worse in another.
    expect(flaskBeats(flask('flask_life_l6', [instant]), plain)).toBe(false);
    expect(flaskBeats(plain, flask('flask_life_l6', [instant]))).toBe(false);
    expect(flaskBeats(flask('flask_life_l6', [deeper]), flask('flask_life_l6', [bigger]))).toBe(
      false,
    );
  });

  it('counts a higher tier only when each use is not dearer', () => {
    // The higher tier costs more charges per use, so it is not strictly better.
    expect(flaskBeats(flask('flask_life_l12'), flask('flask_life_l6'))).toBe(false);
    expect(flaskBeats(flask('flask_life_l12', [deeper, bigger]), flask('flask_life_l6'))).toBe(
      false,
    );
  });

  it('is only ever of the same type', () => {
    expect(flaskBeats(flask('flask_mana_l6', [deeper]), flask('flask_life_l6'))).toBe(false);
    expect(sameFlaskType(flask('flask_haste'), flask('flask_prism'))).toBe(false);
    expect(flaskBeats(flask('flask_haste', [deeper]), flask('flask_prism'))).toBe(false);
    expect(flaskBeats(flask('flask_haste', [deeper]), flask('flask_haste'))).toBe(true);
  });

  it('counts a longer utility flask, and a longer recovery flask for the more it recovers', () => {
    const lasting = roll('flaskUtilDuration', mod('flask.duration', 'inc', 30));
    expect(flaskBeats(flask('flask_haste', [lasting]), flask('flask_haste'))).toBe(true);
    // A recovery flask recovers its amount over its whole duration, so a longer one recovers more.
    const slow = roll('x', mod('flask.duration', 'inc', 30));
    expect(flaskBeats(flask('flask_life_l6', [slow]), flask('flask_life_l6'))).toBe(true);
    const brisk = roll('flaskBrisk', mod('flask.duration', 'inc', -33));
    expect(flaskBeats(flask('flask_life_l6', [brisk]), flask('flask_life_l6'))).toBe(false);
  });

  it('counts a utility affix that adds a buff stat', () => {
    const buff = roll('x', mod('moveSpeed', 'inc', 10));
    expect(flaskBeats(flask('flask_haste', [buff]), flask('flask_haste'))).toBe(true);
  });
});

describe('a flask that upgrades another', () => {
  it('is a higher tier of the same type', () => {
    const l6 = flask('flask_life_l6');
    const l12 = flask('flask_life_l12');
    expect(flaskHigherTier(l12, l6)).toBe(true);
    expect(flaskUpgradesOver(l12, l6)).toBe(true);
    expect(flaskUpgradesOver(l6, l12)).toBe(false);
    expect(flaskUpgradesOver(flask('flask_mana_l12'), l6)).toBe(false);
  });

  it('is not a higher tier the worn flask beats', () => {
    const l12 = flask('flask_life_l12');
    const worn = flask('flask_life_l12', [deeper]);
    expect(flaskUpgradesOver(l12, worn)).toBe(false);
    expect(flaskUpgradesOver(worn, l12)).toBe(true);
  });

  it('is not the same tier with nothing better, nor a lower tier', () => {
    expect(flaskUpgradesOver(flask('flask_life_l6'), flask('flask_life_l6'))).toBe(false);
    expect(flaskUpgradesOver(flask('flask_life_l3', [deeper]), flask('flask_life_l6'))).toBe(false);
  });
});
