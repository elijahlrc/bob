// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// A region's sustain lines by kind, before (its snapshot) and now (the built tree): leech, regeneration, on block, on hit,
// on kill, energy shield recovery, flasks. Counts lines on every node (notables and smalls apart).
// Run: npx tsx sustain.ts <folder> <place region>
import fs from 'fs';
const ROOT = 'E:/Proj/Auto/.claude/worktrees/flask-scarcity/';
const [folder, reg] = process.argv.slice(2);
const { buildAll } = await import('file:///' + ROOT + 'src/data/passives/index.ts');
const kinds: [string, RegExp][] = [
  ['leech', /^(leechLife|leechRate|manaLeech|esLeech|speedWhileLeeching|damageWhileLeeching)/],
  ['regeneration', /^(lifeRegen|manaRegen|lifeRegenWhenHit|lifeRegenPerGrit)/],
  ['on block', /^(lifeOnBlock|manaOnBlock)/],
  ['on hit', /^(lifeOnHit|manaOnHit|esOnHit)/],
  ['on kill', /^(lifeOnKill|manaOnKill|damageOnKill)|^recoverOn\('kill/],
  ['recover on events', /^recoverOn\('(crit|hitTaken|evade|blink|killIgnited)/],
  ['flasks', /^flask/],
];
const tally = (lines: { kind: string; line: string }[]) => {
  const t: Record<string, { notable: number; small: number }> = {};
  for (const [k] of kinds) t[k] = { notable: 0, small: 0 };
  for (const { kind, line } of lines)
    for (const [k, re] of kinds)
      if (re.test(line)) t[k][kind === 'notable' || kind === 'keystone' ? 'notable' : 'small']++;
  return t;
};
const snap = JSON.parse(
  fs.readFileSync(ROOT + `scripts/passives/rework/before/${folder}.json`, 'utf8'),
);
const before = snap.flatMap((a: any) =>
  a.clusters.flatMap((c: any) =>
    c.nodes.flatMap((n: any) => n.lines.map((l: string) => ({ kind: n.kind, line: l }))),
  ),
);
const b = buildAll({ allowNew: true });
const now: { kind: string; line: string }[] = [];
b.tree.nodes.forEach((n: any, i: number) => {
  if (b.place[i]?.region !== reg) return;
  for (const s of b.lines[i] ?? [])
    now.push({
      kind: n.kind,
      line: `${s.fn}(${s.args.map((a: unknown) => JSON.stringify(a).replace(/"/g, "'")).join(', ')})`,
    });
});
const tb = tally(before),
  tn = tally(now);
console.log('kind | before (notables / smalls) | now (notables / smalls)');
for (const [k] of kinds)
  console.log(`${k} | ${tb[k].notable} / ${tb[k].small} | ${tn[k].notable} / ${tn[k].small}`);
