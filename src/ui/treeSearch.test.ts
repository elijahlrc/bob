import { describe, expect, it } from 'vitest';
import { getTree } from '../data/tree';
import { modsText } from '../mods/text';
import { searchMatches, searchWords } from './treeSearch';

describe('the tree search', () => {
  const tree = getTree();
  const texts = tree.nodes.map((n) => (n.name + ' ' + modsText(n.mods).join(' ')).toLowerCase());
  const notStart = (i: number) => tree.nodes[i].kind === 'start';

  it('splits a query into words and ignores the rest', () => {
    expect(searchWords('  Spell   CRIT ')).toEqual(['spell', 'crit']);
    expect(searchWords('   ')).toEqual([]);
    expect(searchWords('spell, crit')).toEqual(['spell', 'crit']);
  });

  it('finds nothing for an empty query', () => {
    expect(searchMatches('', texts)).toEqual([]);
  });

  it('wants every word, in any order, as part of a word', () => {
    const hit = searchMatches('crit spell', texts, notStart);
    expect(hit.length).toBeGreaterThan(3);
    for (const i of hit) {
      expect(texts[i]).toContain('crit');
      expect(texts[i]).toContain('spell');
    }
    // "minion" alone finds the minion clusters; adding a word that is nowhere narrows it to nothing.
    expect(searchMatches('minion', texts, notStart).length).toBeGreaterThan(12);
    expect(searchMatches('minion qqqq', texts, notStart)).toEqual([]);
  });
});
