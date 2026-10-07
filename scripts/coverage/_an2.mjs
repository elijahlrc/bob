import { readFileSync } from 'node:fs';
const u = JSON.parse(readFileSync('docs/coverage/pob-uniques.json', 'utf8')).uniques;
const ref = JSON.parse(readFileSync('docs/coverage/reference-3.9.0.json', 'utf8'));
const names = new Set(ref.uniques.map((x) => x.name.toLowerCase().replace(/^the /, '')));
const T = /\b(Physical|Fire|Cold|Lightning|Chaos|Elemental)\b/g;
const A = /\b(Ignite|Freeze|Shock|Chill|Bleed(?:ing)?|Poison(?:ed)?|Burn(?:ing)?|Stun(?:ned)?|Maim(?:ed)?|Blind(?:ed)?)\b/g;
const CH = /\b(Endurance|Frenzy|Power)\b/g;
const n1 = (l) => l.replace(/\{[^}]*\}/g, '').replace(/\(?[+-]?\d+(\.\d+)?([–-]\d+(\.\d+)?)?\)?/g, '#').replace(T, 'T').replace(A, 'A').replace(CH, 'C').replace(/\s+/g, ' ').trim();
const split = (l) => {
  const m = l.match(/^(.*?)( (?:while|if|when|per|for each|against|during|after|on|with|from|at|by|of) .*)$/);
  return m ? [m[1], m[2]] : [l, ''];
};
const cores = new Map(), clauses = new Map();
let total = 0;
const per = [];
for (const x of u) {
  if (!names.has(x.name.toLowerCase().replace(/^the /, ''))) continue;
  const set = [];
  for (const l of x.lines) {
    const n = n1(l);
    if (!n) continue;
    const [c, cl] = split(n);
    cores.set(c, (cores.get(c) || 0) + 1);
    if (cl) clauses.set(cl, (clauses.get(cl) || 0) + 1);
    set.push(c);
    total++;
  }
  per.push([...new Set(set)]);
}
const sc = [...cores.entries()].sort((a, b) => b[1] - a[1]);
console.log('lines', total, 'distinct cores', sc.length, 'distinct clauses', clauses.size);
const rank = new Map(sc.map(([k], i) => [k, i]));
for (const K of [100, 200, 300, 500, 800, 1200]) {
  const ok = per.filter((ps) => ps.every((p) => rank.get(p) < K)).length;
  console.log('K', K, 'uniques fully covered', ok);
}
console.log(sc.slice(0, 5).map(([k, v]) => v + ' ' + k).join('\n'));
console.log([...clauses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => v + ' ' + k).join('\n'));
