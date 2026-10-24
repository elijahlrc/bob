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

describe('a lobbed orb takes the supports that add projectiles', () => {
  it('Slag Lob counts projectiles, each another orb', () => {
    expect(projectileBase(skill('slagLob'))).toBe(1);
    for (const s of ['twinSalvo', 'tripleShot'])
      expect(offered(s, 'slagLob'), `${s} on slagLob`).toBe(true);
  });
});

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
    for (const sk of ['driftingStorm', 'rimeDrift', 'mirrorQuiver'])
      expect(offered('twinSalvo', sk), `Twin Salvo on ${sk}`).toBe(false);
  });
});

describe('an arrow that chains on its own', () => {
  it('takes the supports that add arrows and chains', () => {
    expect(projectileBase(skill('stormArrow'))).toBe(1);
    for (const s of ['twinSalvo', 'ricochet'])
      expect(offered(s, 'stormArrow'), `${s} on stormArrow`).toBe(true);
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
    expect(offered('kindle', 'suddenFrost')).toBe(true);
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
  it('a saved Cindering is a Kindle', () => {
    expect(gemDef('cindering').id).toBe('kindle');
  });
  it('Kindle adds its fire to attacks and spells alike', () => {
    expect(offered('kindle', 'crushingBlow')).toBe(true);
    expect(offered('kindle', 'suddenFrost')).toBe(true);
  });
});

describe('the Duration tag means that something lasts', () => {
  it('a mine or a trap whose blast is over at once takes neither duration support', () => {
    for (const sk of [
      'icicleCharge',
      'mortarCharge',
      'stormCharge',
      'shrapnelTrap',
      'frostTrap',
      'boltTrap',
    ]) {
      expect(skill(sk).types, sk).not.toContain('duration');
      expect(offered('lingeringEffect', sk), `Lingering Effect on ${sk}`).toBe(false);
      expect(offered('briefBurst', sk), `Brief Burst on ${sk}`).toBe(false);
    }
  });

  it('a trap that leaves ground or drains, and a mine that blinks, still do', () => {
    for (const sk of [
      'blazeTrap',
      'fireBreathTrap',
      'spireTrap',
      'rumbleTrap',
      'drainTrap',
      'smokeCharge',
    ])
      expect(offered('lingeringEffect', sk), `Lingering Effect on ${sk}`).toBe(true);
  });

  it('every mine that carries the tag lets Lingering Effect act', () => {
    for (const g of ACTIVE_GEMS) {
      if (!g.tags.includes('mine') || !g.tags.includes('duration')) continue;
      expect(offered('lingeringEffect', g.id), g.id).toBe(true);
    }
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
});
