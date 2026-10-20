/**
 * Look at, then send, the bot characters a sim wrote with `--rivals-dump` (scripts/rivallog.ts):
 *
 *   npx tsx scripts/postrivals.ts <dump.json>...          what would be sent: per class, the levels and maps, the kit marked
 *   npx tsx scripts/postrivals.ts --post <dump.json>...   send them to the `rivals` table, one row to a request
 *
 * The table caps a day's inserts at 60 from one address (docs/rivals.sql 7d), so a seeding stays under it.
 */
import { readFileSync } from 'node:fs';
import { median } from '../src/core/math';
import { postRival } from '../src/run/rivals';
import { SINK } from '../src/run/telemetry';
import type { DumpedRival } from './rivallog';

const argv = process.argv.slice(2);
const post = argv.includes('--post');
const rows: DumpedRival[] = argv
  .filter((a) => a !== '--post')
  .flatMap((f) => JSON.parse(readFileSync(f, 'utf8')) as DumpedRival[]);

const line = (rs: DumpedRival[]) =>
  rs.length
    ? `${rs.length} · levels ${rs
        .map((r) => r.record.level)
        .sort((a, b) => a - b)
        .join(
          ' ',
        )} (median ${median(rs.map((r) => r.record.level))}) · maps ${Math.min(...rs.map((r) => r.record.map))}–${Math.max(...rs.map((r) => r.record.map))}`
    : '0';
for (const cls of [...new Set(rows.map((r) => r.record.class_id))].sort()) {
  const of = rows.filter((r) => r.record.class_id === cls);
  console.log(
    `${cls}: kit ${line(of.filter((r) => r.kit))}; plain ${line(of.filter((r) => !r.kit))}`,
  );
}
const above20 = rows.filter((r) => r.record.level > 20).length;
console.log(
  `all: ${rows.length} (${rows.filter((r) => r.kit).length} with the kit), ${above20} above level 20, highest level ${Math.max(0, ...rows.map((r) => r.record.level))}`,
);

if (post) {
  let sent = 0;
  for (const r of rows) {
    const res = await postRival((url, init) => fetch(url, init as RequestInit), SINK, r.record);
    if (res.ok) sent++;
    else
      console.log(
        `refused ${r.record.class_id} level ${r.record.level}: ${res.status ?? ''} ${res.message ?? ''}`,
      );
  }
  console.log(`sent ${sent} of ${rows.length}`);
}
