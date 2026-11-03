// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Rails: for each class start, the nodes within 6 points whose removal pushes notables within 14 points 3+ points further
// (or out of reach). A node many notables depend on is a gate every build of that start passes through.
// Also, per start, how many niche notables (a weapon, an element, a mechanic) sit within 8 points, against general ones.
const R = 'file:///E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const { makeLine } = await import(R + 'data/passives/vocab.ts');
const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const N = nodes.length;
const starts = nodes.map((n: any, i: number) => [n.classStart, i] as const).filter(([c]: any) => c);
const label = (i: number) => (built.lines[i] ?? []).map((s: any) => makeLine(s).label).join('; ');
function bfs(src: number, cut = -1): number[] {
  const d = new Array(N).fill(Infinity);
  d[src] = 0;
  const q = [src];
  while (q.length) {
    const a = q.shift()!;
    for (const b of nodes[a].links) {
      if (b === cut || (nodes[b].classStart && b !== src)) continue;
      if (d[b] === Infinity) {
        d[b] = d[a] + 1;
        q.push(b);
      }
    }
  }
  return d;
}
// Niche: a line tied to a weapon, an element, a damage form or a mechanic most builds do not use.
const NICHE =
  /claw|dagger|sword|axe|mace|staff|wand|bow|shield|dual|two-handed|one-handed|fire|cold|lightning|chaos|poison|bleed|ignite|freeze|shock|minion|totem|trap|mine|brand|curse|aura|warcr|insight|grit|fervour/i;
const GENERAL_ONLY = /^(attack|spell|melee)$/i;
for (const [cls, s] of starts as [string, number][]) {
  const d = bfs(s);
  const notables = nodes
    .map((_: any, i: number) => i)
    .filter((i: number) => nodes[i].kind === 'notable' && d[i] <= 14);
  console.log(`\n# ${cls}: ${notables.length} notables within 14`);
  const gates: string[] = [];
  for (let c = 0; c < N; c++) {
    if (c === s || d[c] > 6 || nodes[c].kind === 'start') continue;
    const dc = bfs(s, c);
    const hit = notables.filter((i: number) => i !== c && dc[i] - d[i] >= 3).length;
    if (hit >= 4)
      gates.push(
        `${String(hit).padStart(3)} behind ${d[c]}-pt ${nodes[c].kind} ${nodes[c].name || ''} [${built.place[c]?.area}] ${label(c)}`,
      );
  }
  gates.sort().reverse();
  console.log(
    gates.length
      ? gates.join('\n')
      : 'no gate: nothing within 6 points holds 4+ notables behind it',
  );
  const near8 = nodes
    .map((_: any, i: number) => i)
    .filter((i: number) => nodes[i].kind === 'notable' && d[i] <= 8);
  const niche = near8.filter((i: number) => {
    const words = label(i)
      .split(';')
      .map((x: string) => x.trim());
    return words.filter((w: string) => NICHE.test(w)).length > words.length / 2;
  });
  console.log(
    `within 8: ${near8.length} notables, ${niche.length} mostly niche: ${niche.map((i: number) => nodes[i].name).join(', ')}`,
  );
}
