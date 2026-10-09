import { describe, expect, it } from 'vitest';
import { mappedGemIds, loadMapGems, pobFor, joinBlock } from './join';
import { loadLedger, MILESTONES, summarise, validateLedger } from './ledger';

describe('the spirit ledger (docs/coverage/spirit.json)', () => {
  const ledger = loadLedger();

  it('has a row for every mapped gem and no others, and every row is consistent', () => {
    expect(validateLedger(ledger, mappedGemIds())).toEqual([]);
  });

  it('assigns every open gem to a milestone of the plan', () => {
    for (const [id, r] of Object.entries(ledger.gems)) {
      if (r.milestone !== null) expect(MILESTONES, id).toContain(r.milestone);
    }
  });

  it('names the same reference gem as map.json', () => {
    const map = loadMapGems();
    for (const [id, r] of Object.entries(ledger.gems)) expect(r.ref, id).toBe(map[id].ref);
  });

  it('counts add up', () => {
    const s = summarise(ledger);
    expect(s.byVerdict.faithful + s.byVerdict.drifted + s.byVerdict.gutted).toBe(
      Object.keys(ledger.gems).length,
    );
  });
});

describe('the join of a gem with its reference', () => {
  it('finds the 3.9 data of Flicker Strike and prints the cooldown the port lost', () => {
    const p = pobFor('Flicker Strike');
    expect(p?.levels.first.cooldown).toBe(2);
    const block = joinBlock('blinkingCut');
    expect(block).toContain('Flicker Strike');
    expect(block).toContain('cd 2');
    expect(block).toContain('Bob def:');
  });
});
