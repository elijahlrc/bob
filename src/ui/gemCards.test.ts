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
});
