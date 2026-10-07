import { readFileSync } from 'node:fs';
const u = JSON.parse(readFileSync('docs/coverage/pob-uniques.json', 'utf8')).uniques;
const ref = JSON.parse(readFileSync('docs/coverage/reference-3.9.0.json', 'utf8'));
const names = new Set(ref.uniques.map((x) => x.name.toLowerCase().replace(/^the /, '')));
const norm = (l) => l.replace(/\{[^}]*\}/g, '').replace(/\(?[+-]?\d+(\.\d+)?([–-]\d+(\.\d+)?)?\)?/g, '#').replace(/\s+/g, ' ').trim();
const freq = new Map();
let total = 0, entries = 0;
for (const x of u) {
  if (!names.has(x.name.toLowerCase().replace(/^the /, ''))) continue;
  entries++;
  for (const l of x.lines) {
    const n = norm(l);
    if (!n) continue;
    total++;
    freq.set(n, (freq.get(n) || 0) + 1);
  }
}
const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
console.log('uniques', entries, 'lines', total, 'distinct', sorted.length);
let cum = 0;
for (const [i, [k, v]] of sorted.entries()) { cum += v; if ([49, 99, 199, 399, 799, 1499].includes(i)) console.log('top', i + 1, 'covers', ((100 * cum) / total).toFixed(1) + '%'); }
console.log(sorted.slice(0, 60).map(([k, v]) => v + ' ' + k).join('\n'));
const per = [];
for (const x of u) {
  if (!names.has(x.name.toLowerCase().replace(/^the /, ''))) continue;
  per.push([...new Set(x.lines.map(norm).filter(Boolean))]);
}
const rank = new Map(sorted.map(([k], i) => [k, i]));
for (const K of [100, 200, 300, 500, 800, 1200, 2000]) {
  const ok = per.filter((ps) => ps.every((p) => rank.get(p) < K)).length;
  const most = per.filter((ps) => ps.filter((p) => rank.get(p) >= K).length <= 1).length;
  console.log('K', K, 'uniques fully covered', ok, 'of', per.length, ' with at most one unmapped line', most);
}
