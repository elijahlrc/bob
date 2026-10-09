/**
 * Where the spirit plan stands (docs/SPIRIT.md 4.1).
 *
 *   npm run spirit                      counts by verdict and by milestone
 *   npm run spirit -- --gem blinkingCut the join block and the ledger row of one gem
 *   npm run spirit -- --milestone S2    the gems a milestone finishes, with their missing primitives
 *   npm run spirit -- --open            every gem still to do
 */
import { pathToFileURL } from 'node:url';
import { joinBlock } from './join';
import { loadLedger, MILESTONES, summarise, type LedgerRow } from './ledger';

const row = (id: string, r: LedgerRow): string =>
  `${id.padEnd(18)} ${r.verdict.padEnd(8)} ${(r.milestone ?? '-').padEnd(4)} ${r.name} (${r.ref})${r.accepted ? ' [accepted]' : ''}${r.missing.length ? ' : ' + r.missing.join(', ') : ''}`;

export function main(args: string[]): void {
  const ledger = loadLedger();
  const i = args.indexOf('--gem');
  if (i >= 0) {
    const id = args[i + 1];
    const r = ledger.gems[id];
    console.log(joinBlock(id));
    console.log(r ? JSON.stringify(r, null, 1) : '(no ledger row)');
    return;
  }
  const j = args.indexOf('--milestone');
  if (j >= 0) {
    const m = args[j + 1];
    for (const [id, r] of Object.entries(ledger.gems))
      if (r.milestone === m && r.verdict !== 'faithful') console.log(row(id, r));
    return;
  }
  if (args.includes('--open')) {
    for (const [id, r] of Object.entries(ledger.gems))
      if (r.verdict !== 'faithful' && r.accepted === undefined) console.log(row(id, r));
    return;
  }
  const s = summarise(ledger);
  const total = Object.keys(ledger.gems).length;
  console.log(
    `gems ${total}: faithful ${s.byVerdict.faithful}, drifted ${s.byVerdict.drifted}, gutted ${s.byVerdict.gutted}`,
  );
  for (const m of [...MILESTONES, '-']) {
    const c = s.byMilestone[m];
    if (c) console.log(`  ${m.padEnd(4)} open ${String(c.open).padStart(3)}  (gutted ${c.gutted})`);
  }
  const verified = Object.values(ledger.gems).filter((r) => r.verified).length;
  console.log(`verified ${verified} of ${total}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main(process.argv.slice(2));
