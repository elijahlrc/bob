/**
 * Where the action is in the filmed clips (scripts/trailer/capture.ts writes each clip's sim events per frame): for each clip,
 * a line per second of kills, hits and skill uses, and the two-second window with the most kills. Used to pick the frames
 * docs/trailer/cut.html cuts in on (its `IN` table).
 *
 *   npx tsx scripts/trailer/events.ts [clip ...]
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(import.meta.dirname, '../../docs/trailer/footage');
const want = process.argv.slice(2);

for (const clip of readdirSync(DIR).sort()) {
  const file = path.join(DIR, clip, 'events.json');
  if ((want.length && !want.includes(clip)) || !existsSync(file)) continue;
  const log: string[][] = JSON.parse(readFileSync(file, 'utf8'));
  const count = (f: string[], t: string) => f.filter((e) => e === t).length;
  const deaths = log.map((f) => count(f, 'death'));
  if (!deaths.some((d) => d)) {
    if (!log.some((f) => f.length)) continue;
  }
  console.log(`${clip} (${log.length} frames)`);
  for (let s = 0; s * 30 < log.length; s++) {
    const sec = log.slice(s * 30, s * 30 + 30);
    const marks = sec.map((f) => (count(f, 'death') ? 'x' : count(f, 'hit') ? '.' : ' ')).join('');
    console.log(`  ${String(s * 30).padStart(4)} |${marks}|`);
  }
  let best = 0;
  let bestAt = 0;
  for (let i = 0; i + 60 <= log.length; i++) {
    const k = deaths.slice(i, i + 60).reduce((a, b) => a + b, 0);
    if (k > best) [best, bestAt] = [k, i];
  }
  console.log(`  most kills in two seconds: ${best} from frame ${bestAt}`);
}
