import { describe, expect, it } from 'vitest';
import { hasReference } from '../../scripts/coverage/reference';
import { loadLedger } from '../../scripts/spirit/ledger';
import { ACTIVE_GEMS, GRANTED_GEMS } from '../data/gems';
import { runGem } from './gemKit';

/**
 * The parity smoke (docs/SPIRIT.md 4.3): a gem whose ledger row declares `effects` must show every one of them within ten
 * seconds against the dummy. A gem whose text claims an effect that nothing in the sim produces fails here.
 */
// The ledger is in the local reference data (scripts/coverage/reference.ts): without it this skips.
describe.skipIf(!hasReference())('the effects the spirit ledger declares', () => {
  it('are all observed in a ten-second run', () => {
    const ledger = loadLedger();
    const actives = [...ACTIVE_GEMS, ...GRANTED_GEMS];
    for (const [id, row] of Object.entries(ledger.gems)) {
      if (!row.effects?.length) continue;
      const def = actives.find((g) => g.id === id);
      expect(def, `${id} is not an active gem`).toBeDefined();
      const { effects } = runGem(def!);
      for (const e of row.effects) expect(effects, `${id}: ${e}`).toContain(e);
    }
  });
});
