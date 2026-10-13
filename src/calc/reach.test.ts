import { describe, expect, it } from 'vitest';
import { ACTIVE_GEMS, SUPPORT_GEMS, gemDef, type SupportGemDef } from '../data/gems';
import { typesAllow } from '../data/skillTypes';
import { resolveActive, type SkillDef } from './gems';
import { projectileBase, supportLive } from './reach';

/** Which supports can act on which skills, asked of the gem data (docs/SUPPORTS-PLAN.md 4.1). */

const skill = (id: string): SkillDef => {
  const d = ACTIVE_GEMS.find((g) => g.id === id);
  if (!d) throw new Error(`no skill ${id}`);
  return resolveActive(d, 20);
};
const support = (id: string): SupportGemDef => gemDef(id) as SupportGemDef;
/** Whether the pair is offered: allowed by the types and able to act. */
const offered = (sup: string, sk: string): boolean => {
  const s = skill(sk);
  const d = support(sup);
  return typesAllow(d, new Set(s.types)) && supportLive(d, s).live;
};

describe('a rain of arrows takes the supports that add arrows and widen it, not the ones that need a flight', () => {
  for (const rain of ['arrowShower', 'emberDownpour']) {
    it(`${rain} takes projectile counts, area and a second landing`, () => {
      for (const s of [
        'twinSalvo',
        'wideSalvo',
        'volleySplit',
        'tripleShot',
        'wideBlast',
        'flankingVolley',
      ])
        expect(offered(s, rain), `${s} on ${rain}`).toBe(true);
    });
    it(`${rain} does not take pierce, fork, chain, projectile speed or close quarters`, () => {
      for (const s of ['piercingShot', 'splitShot', 'ricochet', 'swiftFlight', 'closeQuarters'])
        expect(offered(s, rain), `${s} on ${rain}`).toBe(false);
    });
  }

  it('a skill that fires one thing has no count to add to', () => {
    for (const sk of ['stormArrow', 'driftingStorm', 'rimeDrift', 'mirrorQuiver'])
      expect(offered('twinSalvo', sk), `Twin Salvo on ${sk}`).toBe(false);
  });

  it('the reason names the skill', () => {
    const v = supportLive(support('piercingShot'), skill('arrowShower'));
    expect(v.live).toBe(false);
    if (!v.live) expect(v.why).toMatch(/Arrow Shower/);
  });
});

describe('melee supports need what they work on', () => {
  it('Wide Crush needs a skill with an area: a thrust tagged with one has none', () => {
    expect(offered('wideCrush', 'crushingBlow')).toBe(false);
    expect(offered('wideCrush', 'venomStrike')).toBe(false);
    expect(offered('wideCrush', 'sweepingCut')).toBe(true);
  });
  it('Echoing Blow and Shattering Blows are for strikes, not for arcs and slams', () => {
    expect(offered('echoingBlow', 'crushingBlow')).toBe(true);
    expect(offered('echoingBlow', 'sweepingCut')).toBe(false);
    expect(offered('shatteringBlows', 'faultline')).toBe(false);
  });
});

describe('damage types and hits', () => {
  it('Blunt Intent needs physical damage to work on', () => {
    expect(offered('bluntIntent', 'crushingBlow')).toBe(true);
    expect(offered('bluntIntent', 'emberHail')).toBe(false);
    expect(offered('bluntIntent', 'torchArrow')).toBe(false);
  });
  it('a penetration support needs a skill that deals the type', () => {
    expect(offered('ashbreaker', 'emberHail')).toBe(true);
    expect(offered('frostbreaker', 'emberHail')).toBe(false);
  });
  it('added damage does not need the type to start from', () => {
    expect(offered('cindering', 'suddenFrost')).toBe(true);
  });
  it('a damage support does nothing for a curse, a trigger or a mana cost cut does', () => {
    expect(offered('bluntIntent', 'tinderCurse')).toBe(false);
    expect(offered('standingCurse', 'tinderCurse')).toBe(true);
    expect(offered('deepInsight', 'tinderCurse')).toBe(true);
  });
});

describe('spells and attacks have their own copy of a support', () => {
  it('Flanking Cast is for spells and Flanking Volley for attacks', () => {
    expect(offered('flankingCast', 'suddenFrost')).toBe(true);
    expect(offered('flankingCast', 'arrowShower')).toBe(false);
    expect(offered('flankingVolley', 'arrowShower')).toBe(true);
    expect(offered('flankingVolley', 'suddenFrost')).toBe(false);
  });
  it('a cascade needs somewhere to the sides: not a nova around the caster', () => {
    expect(offered('flankingCast', 'blizzardRing')).toBe(false);
  });
  it('Kindle is for attacks and Cindering for spells', () => {
    expect(offered('kindle', 'crushingBlow')).toBe(true);
    expect(offered('kindle', 'suddenFrost')).toBe(false);
    expect(offered('cindering', 'suddenFrost')).toBe(true);
    expect(offered('cindering', 'crushingBlow')).toBe(false);
  });
});

describe('across every pair', () => {
  const pairs: [SupportGemDef, SkillDef][] = [];
  for (const a of ACTIVE_GEMS) {
    const s = resolveActive(a, 20);
    for (const sup of SUPPORT_GEMS) if (typesAllow(sup, new Set(s.types))) pairs.push([sup, s]);
  }

  it('a support that adds projectiles is offered only where the skill has projectiles to add to', () => {
    for (const [sup, s] of pairs) {
      if (!sup.mods.some((m) => m.stat === 'projectiles')) continue;
      if (supportLive(sup, s).live)
        expect(projectileBase(s), `${sup.name} on ${s.name}`).not.toBeNull();
    }
  });

  it('every refusal gives a reason', () => {
    for (const [sup, s] of pairs) {
      const v = supportLive(sup, s);
      if (!v.live) expect(v.why.length, `${sup.name} on ${s.name}`).toBeGreaterThan(5);
    }
  });

  it('most pairs are still offered: this is a filter, not a purge', () => {
    const live = pairs.filter(([sup, s]) => supportLive(sup, s).live).length;
    expect(live / pairs.length).toBeGreaterThan(0.8);
  });
});
