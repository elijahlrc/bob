import { describe, expect, it } from 'vitest';
import { ALL_GEMS, GRANTED_GEMS } from '../data/gems';
import { gemCardData } from './gemText';

describe('gem cards', () => {
  it('every gem has a readable card at level 1 and level 20, with no raw ids or NaN', () => {
    for (const def of [...ALL_GEMS, ...GRANTED_GEMS])
      for (const level of [1, 20]) {
        const c = gemCardData(def, level);
        const text = [c.name, c.type, ...c.stats, ...c.effects, c.requires, c.description].join(
          '\n',
        );
        expect(text, `${def.id} ${level}`).not.toMatch(/NaN|undefined|\[object/);
        // Compound stat ids (dotted or camel-case) must never reach the player.
        for (const line of c.effects)
          expect(line, `${def.id}: ${line}`).not.toMatch(
            /[a-z]+\.[a-z]+\.|[a-z][A-Z][a-z]+\.[a-z]/,
          );
        expect(c.stats.length + c.effects.length, def.id).toBeGreaterThan(0);
      }
  });

  it('skills that do something of their own say so on their cards', () => {
    const find = (id: string) => ALL_GEMS.find((g) => g.id === id)!;
    const says = (id: string, re: RegExp) =>
      expect(gemCardData(find(id), 10).stats.join(' '), id).toMatch(re);
    says('chargedBlow', /beams strike/);
    says('cinderBlow', /charge on the enemy/);
    says('ruptureLine', /wave .* shockwave/);
    says('primalStrike', /fire, cold or lightning at random/);
    says('primeSplash', /icy projectiles/);
    says('ghostShard', /shield .* shatters/);
    says('spiritSaw', /turns toward/);
    says('orbitingBlades', /blade that circles/);
    says('skyfall', /marker/);
    says('tempestMote', /orb by you/);
    says('slagLob', /bounces on/);
    says('fuseArrow', /sticks/);
    says('blightHail', /pod for each stage/);
    says('drainTrap', /regain/);
    says('rimePlate', /chilled/);
    says('sourHerald', /Virulence/);
    says('whirringMotes', /set off your traps/);
    says('smokeCharge', /safest spot/);
    says('lureTotem', /go for it instead of you/);
    says('slagCarapace', /pool/);
    says('slipstream', /first skill you use/);
    says('rimeMallet', /cooldown|Requires/);
    expect(gemCardData(find('knifeRange'), 10).stats.join(' ')).toMatch(/Only works with/);
    expect(gemCardData(find('thunderRebuke'), 10).stats.join(' ')).toMatch(/Thunder Aura/);
  });

  it('utility, summon and deploying gems say what they do', () => {
    const find = (id: string) => ALL_GEMS.find((g) => g.id === id)!;
    expect(gemCardData(find('tinderCurse'), 10).stats.join(' ')).toMatch(/Curses enemies/);
    expect(gemCardData(find('callBonewalkers'), 10).stats.join(' ')).toMatch(/Summons/);
    expect(gemCardData(find('steadfastBellow'), 10).stats.join(' ')).toMatch(/Cast when a pack/);
    expect(gemCardData(find('quickStep'), 10).stats.join(' ')).toMatch(/Jumps up to/);
    expect(gemCardData(find('bladeWind'), 10).stats.join(' ')).toMatch(/shield/);
    expect(gemCardData(find('rimeRebuke'), 10).stats.join(' ')).toMatch(/block/i);
    expect(gemCardData(find('rimeHerald'), 10).stats.join(' ')).toMatch(/frozen/);
  });
});
