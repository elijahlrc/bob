// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Offence against defence: every line on every node, sorted by the same keyword rules for the Knife and for the
// reference's matching sector (local data). Lines counted once each; notables and smalls reported apart.
import fs from 'fs';
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const { makeLine } = await import(R + 'data/passives/vocab.ts');
const kindOf = (t: string): 'off' | 'def' | 'util' => {
  const s = t.toLowerCase();
  if (/movement|attribute|strength|dexterity|intelligence|\bmana\b|reservation|reserved|flask|charge|cooldown|cost|light radius|duration of|skill effect duration|aura/.test(s) && !/damage|crit/.test(s)) return 'util';
  if (/life|energy shield|evasion|armour|resist|block|dodge|avoid|stun|damage taken|recover|regenerat|leech|reduction|defences|on kill|on hit/.test(s) && !/increased damage|crit|penetrat/.test(s)) return 'def';
  return 'off';
};
const tally = () => ({ off: 0, def: 0, util: 0 });
const pct = (t: { off: number; def: number; util: number }) => {
  const n = t.off + t.def + t.util;
  return `${t.off} off / ${t.def} def / ${t.util} util  (${Math.round((100 * t.off) / n)}% / ${Math.round((100 * t.def) / n)}% / ${Math.round((100 * t.util) / n)}%)`;
};
// Bob: one region (argv: place region, e.g. mystic), without road (attribute) nodes. The reference sector by class.
const REG = process.argv[2] ?? 'shade';
const SECTOR = { vanguard: 0, strider: 1, mystic: 2, reaver: 3, zealot: 4, shade: 5 }[REG];
const b = buildAll({ allowNew: true });
const bob = { notable: tally(), small: tally() };
const bobNear = { all: tally() };
b.tree.nodes.forEach((n: any, i: number) => {
  if (b.place[i]?.region !== REG || !(n.kind === 'notable' || n.kind === 'small')) return;
  for (const s of b.lines[i] ?? []) {
    const k = kindOf(makeLine(s).label);
    bob[n.kind as 'notable' | 'small'][k]++;
  }
});
// The reference sector.
const ref = JSON.parse(fs.readFileSync('E:/Proj/Auto/.claude/worktrees/flask-scarcity/reference/tree/ref-tree.json', 'utf8'));
const rf = { notable: tally(), small: tally() };
for (const n of Object.values(ref.nodes) as any[]) {
  if (n.sector !== SECTOR || !(n.kind === 'notable' || n.kind === 'small')) continue;
  if (n.lines.length === 1 && /^\+\d+ to (Strength|Dexterity|Intelligence)/.test(n.lines[0])) continue; // bare attribute nodes are roads
  for (const l of n.lines) rf[n.kind as 'notable' | 'small'][kindOf(l)]++;
}
void bobNear;
console.log(REG + ' notables:   ', pct(bob.notable));
console.log(REG + ' smalls:     ', pct(bob.small));
console.log('Reference notables:', pct(rf.notable));
console.log('Reference smalls:  ', pct(rf.small));
// Defence lines in the Knife by step from the start, to see where it thins.
