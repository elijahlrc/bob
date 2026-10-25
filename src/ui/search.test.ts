import { describe, expect, it } from 'vitest';
import { ALL_GEMS } from '../data/gems';
import { gemCardData } from './gemText';
import { matchesTerms, searchTerms } from './search';

describe('the list search', () => {
  it('splits a query on commas, keeping the spaces inside a term', () => {
    expect(searchTerms(' Area,  ATTACK ,')).toEqual(['area', 'attack']);
    expect(searchTerms('fire damage')).toEqual(['fire damage']);
    expect(searchTerms(' , ')).toEqual([]);
  });

  it('wants every term', () => {
    expect(matchesTerms('area attack melee', ['area', 'attack'])).toBe(true);
    expect(matchesTerms('area spell', ['area', 'attack'])).toBe(false);
    expect(matchesTerms('anything', [])).toBe(true);
  });

  it('finds the gems with both tags for "area, attack"', () => {
    const text = (g: (typeof ALL_GEMS)[number]) => {
      const d = gemCardData(g, 20);
      return {
        tags: d.tags.map((t) => t.toLowerCase()),
        all: `${d.name} ${d.type} ${d.tags.join(' ')} ${d.description}`.toLowerCase(),
      };
    };
    const terms = searchTerms('area, attack');
    const both = ALL_GEMS.filter((g) => matchesTerms(text(g).all, terms));
    const area = ALL_GEMS.filter((g) => matchesTerms(text(g).all, ['area']));
    expect(both.length).toBeGreaterThan(3);
    expect(both.length).toBeLessThan(area.length);
    const tagged = ALL_GEMS.filter((g) => {
      const t = text(g).tags;
      return t.includes('area') && t.includes('attack');
    });
    for (const g of tagged) expect(both).toContain(g);
  });
});
