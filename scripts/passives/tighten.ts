/**
 * Pulls every notable's and keystone's own small nodes in close to it, so a cluster reads as a cluster (the user,
 * 2026-10-21), and lays each of its chains in a straight line toward where the chain leads, so no small node sits on a
 * bend with no reason for it. It moves small nodes only, never a notable, a keystone, a road node or a link.
 *
 *   npx tsx scripts/passives/tighten.ts [--write] [--region strider]
 *
 * A notable's own smalls are the ones a chain of smalls of one stat reaches from it (up to three deep); a chain that
 * reaches two notables (a wheel's rim) is left where it is. The first small of a chain sits `FIRST` from the notable, the
 * next ones `NEXT` apart, along the line from the notable to the node the chain leads on to; a dead-end chain keeps its
 * bearing. A chain is left alone when its new place would cross a link or draw a node over another (`drawnOver`). Without `--write` it only reports; with it, it rewrites the `at` of each moved node in its area file, in the
 * file's own notation (`P(out, side)` where the file uses its region's frame). Run `npm run passives:bake` after.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { buildAll } from '../../src/data/passives';
import { drawnOver } from '../../src/data/passives/build';

/** From a notable (or keystone) to its first small, and between smalls of a chain, in tree units. */
const FIRST = { notable: 70, keystone: 85 } as const;
const NEXT = 58;
/** How deep a chain of one stat may run from its notable and still be the notable's own. */
const DEPTH = 3;

const argv = process.argv.slice(2);
const write = argv.includes('--write');
const ri = argv.indexOf('--region');
const only = ri >= 0 ? argv[ri + 1] : null;

const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const live = (i: number) => nodes[i] && nodes[i].name !== '(retired)';
const N = nodes.length;
const isBig = (i: number) => nodes[i].kind === 'notable' || nodes[i].kind === 'keystone';
const pos = nodes.map((n) => ({ x: n.x, y: n.y }));

// ---- whose small is whose
type Branch = { owner: number; members: number[]; parent: Map<number, number> };
const claims = new Map<number, number[]>();
const groups: Branch[] = [];
for (let n = 0; n < N; n++) {
  if (!live(n) || !isBig(n)) continue;
  if (only && built.place[n].region !== only) continue;
  for (const first of nodes[n].links) {
    if (nodes[first].kind !== 'small') continue;
    const parent = new Map<number, number>([[first, n]]);
    const members = [first];
    const depth = new Map([[first, 1]]);
    for (let q = 0; q < members.length; q++) {
      const s = members[q];
      if (depth.get(s)! >= DEPTH) continue;
      for (const t of nodes[s].links)
        if (
          t !== n &&
          !parent.has(t) &&
          nodes[t].kind === 'small' &&
          nodes[t].name === nodes[s].name
        ) {
          parent.set(t, s);
          depth.set(t, depth.get(s)! + 1);
          members.push(t);
        }
    }
    groups.push({ owner: n, members, parent });
    for (const s of members) claims.set(s, [...(claims.get(s) ?? []), n]);
  }
}
// A branch that touches another notable, or shares a small with another notable's branch, is a rim: leave it.
const branches = groups.filter(
  (b) =>
    b.members.every((s) => claims.get(s)!.length === 1) &&
    b.members.every((s) => nodes[s].links.every((t) => t === b.owner || !isBig(t))),
);

// ---- geometry checks
const edges: [number, number][] = [];
for (let i = 0; i < N; i++)
  if (live(i)) for (const j of nodes[i].links) if (j > i) edges.push([i, j]);
const cross = (a: number, b: number, c: number, d: number) => {
  if (a === c || a === d || b === c || b === d) return false;
  const p = pos[a],
    q = pos[b],
    r = pos[c],
    s = pos[d];
  const o = (u: typeof p, v: typeof p, w: typeof p) =>
    Math.sign((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x));
  return o(p, q, r) !== o(p, q, s) && o(r, s, p) !== o(r, s, q);
};
const crossings = (on?: Set<number>) => {
  let c = 0;
  for (let e = 0; e < edges.length; e++) {
    const [a, b] = edges[e];
    for (let f = e + 1; f < edges.length; f++) {
      const [x, y] = edges[f];
      if (on && !on.has(a) && !on.has(b) && !on.has(x) && !on.has(y)) continue;
      if (cross(a, b, x, y)) c++;
    }
  }
  return c;
};
/** Two nodes drawn over each other, or nearly (CONSTRAINTS §11: the only spacing rule). */
const tooNear = (i: number, j: number) =>
  drawnOver(nodes[i].kind, nodes[j].kind, Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y));
const nearPairs = (on?: Set<number>) => {
  let c = 0;
  for (let i = 0; i < N; i++)
    if (live(i))
      for (let j = i + 1; j < N; j++)
        if (live(j) && (!on || on.has(i) || on.has(j)) && tooNear(i, j)) c++;
  return c;
};
const crossingsBefore = crossings();
const nearBefore = nearPairs();

// ---- place each branch
const unit = (dx: number, dy: number) => {
  const l = Math.hypot(dx, dy) || 1;
  return { x: dx / l, y: dy / l };
};
let moved = 0;
const kept: string[] = [];
for (const b of branches) {
  const n = b.owner;
  const children = (s: number) => b.members.filter((t) => b.parent.get(t) === s);
  // The spine: from the first small, always on to the child with the longest chain below it.
  const height = (s: number): number => Math.max(0, ...children(s).map((t) => 1 + height(t)));
  const spine = [b.members[0]];
  for (;;) {
    const kids = children(spine[spine.length - 1]);
    if (!kids.length) break;
    spine.push(kids.reduce((x, y) => (height(y) > height(x) ? y : x)));
  }
  const tip = spine[spine.length - 1];
  const exits = nodes[tip].links.filter((t) => t !== b.parent.get(tip) && !b.members.includes(t));
  // Where the chain leads: the node the tip links on to (a road node first); a dead end keeps its bearing.
  const target = exits.sort(
    (x, y) => Number(nodes[y].kind === 'travel') - Number(nodes[x].kind === 'travel'),
  )[0];
  const u =
    target !== undefined
      ? unit(pos[target].x - pos[n].x, pos[target].y - pos[n].y)
      : unit(pos[b.members[0]].x - pos[n].x, pos[b.members[0]].y - pos[n].y);
  const first = FIRST[nodes[n].kind as 'notable' | 'keystone'];
  const want = new Map<number, { x: number; y: number }>();
  spine.forEach((s, k) => {
    const r = first + k * NEXT;
    want.set(s, { x: pos[n].x + u.x * r, y: pos[n].y + u.y * r });
  });
  // Off the spine (rare): a side small keeps its bearing from its parent, one step out.
  for (const s of b.members)
    if (!want.has(s)) {
      const p = b.parent.get(s)!;
      const v = unit(pos[s].x - pos[p].x, pos[s].y - pos[p].y);
      const at = want.get(p) ?? pos[p];
      want.set(s, { x: at.x + v.x * NEXT, y: at.y + v.y * NEXT });
    }
  // Room on the line: the tip has to stay short of where the chain leads.
  if (target !== undefined) {
    const reach = Math.hypot(pos[target].x - pos[n].x, pos[target].y - pos[n].y);
    if (first + (spine.length - 1) * NEXT > reach - 60) {
      kept.push(`${built.ids[n]}: no room toward ${built.ids[target]}`);
      continue;
    }
  }
  const old = new Map(b.members.map((s) => [s, { ...pos[s] }]));
  const touched = new Set(b.members);
  const c0 = crossings(touched);
  const n0 = nearPairs(touched);
  for (const [s, p] of want) pos[s] = { x: Math.round(p.x), y: Math.round(p.y) };
  const c1 = crossings(touched);
  const n1 = nearPairs(touched);
  if (c1 > c0 || n1 > n0) {
    for (const [s, p] of old) pos[s] = p;
    kept.push(
      `${built.ids[b.members[0]]} (${nodes[n].name}): ${c1 > c0 ? 'would cross a link' : 'would crowd a node'}`,
    );
    continue;
  }
  moved += b.members.length;
}

console.log(
  `${branches.length} chains of ${groups.length} (the rest are rims shared by two notables); ${moved} small nodes moved`,
);
console.log(
  `crossings ${crossingsBefore} -> ${crossings()}, crowded pairs ${nearBefore} -> ${nearPairs()}`,
);
if (kept.length) console.log(`left where they were (${kept.length}):\n  ` + kept.join('\n  '));

// ---- write back
if (write) {
  const FRAMES: Record<string, { at: [number, number]; deg: number }> = {
    bow: { at: [866, 500], deg: 30 },
    knife: { at: [866, -500], deg: -30 },
    cathedral: { at: [-866, -500], deg: 210 },
  };
  /** The file an area is written in: the one that declares its id (most are <theme>/<area>.ts, not all). */
  const fileOf = (area: string) => {
    const dir = resolve('src/data/passives', area.split('.')[0]);
    const hit = readdirSync(dir).find((f) =>
      readFileSync(resolve(dir, f), 'utf8').includes(`id: '${area}'`),
    );
    if (!hit) throw new Error(`no file declares ${area}`);
    return resolve(dir, hit);
  };
  const byFile = new Map<string, { cluster: string; node: string; x: number; y: number }[]>();
  for (let i = 0; i < N; i++) {
    if (!live(i) || (pos[i].x === nodes[i].x && pos[i].y === nodes[i].y)) continue;
    const [theme, area, cluster, ...rest] = built.ids[i].split('.');
    const file = fileOf(`${theme}.${area}`);
    byFile.set(file, [
      ...(byFile.get(file) ?? []),
      { cluster, node: rest.join('.'), x: pos[i].x, y: pos[i].y },
    ]);
  }
  for (const [file, moves] of byFile) {
    const text = readFileSync(file, 'utf8');
    const theme = file.split(/[\\/]/).at(-2)!;
    const frame = /import \{ P[ ,}].*from '\.\/frame'/.test(text) ? FRAMES[theme] : undefined;
    const code = (x: number, y: number) => {
      if (!frame) return `[${x}, ${y}]`;
      const a = (frame.deg * Math.PI) / 180;
      const dx = x - frame.at[0],
        dy = y - frame.at[1];
      return `P(${Math.round(dx * Math.cos(a) + dy * Math.sin(a))}, ${Math.round(-dx * Math.sin(a) + dy * Math.cos(a))})`;
    };
    const src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const prop = (o: ts.ObjectLiteralExpression, k: string) =>
      o.properties.find(
        (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText(src) === k,
      );
    const str = (o: ts.ObjectLiteralExpression, k: string) => {
      const p = prop(o, k);
      return p && ts.isStringLiteral(p.initializer) ? p.initializer.text : undefined;
    };
    const edits: { start: number; end: number; text: string }[] = [];
    const visit = (nd: ts.Node) => {
      if (ts.isObjectLiteralExpression(nd) && prop(nd, 'nodes') && str(nd, 'id') !== undefined) {
        const cid = str(nd, 'id');
        const list = prop(nd, 'nodes')!.initializer;
        if (ts.isArrayLiteralExpression(list))
          for (const el of list.elements) {
            if (!ts.isObjectLiteralExpression(el)) continue;
            const m = moves.find((v) => v.cluster === cid && v.node === str(el, 'id'));
            if (!m) continue;
            const at = prop(el, 'at');
            if (at)
              edits.push({
                start: at.initializer.getStart(src),
                end: at.initializer.end,
                text: code(m.x, m.y),
              });
            else {
              const last = el.properties[el.properties.length - 1];
              edits.push({ start: last.end, end: last.end, text: `, at: ${code(m.x, m.y)}` });
            }
            (m as { done?: boolean }).done = true;
          }
      }
      ts.forEachChild(nd, visit);
    };
    visit(src);
    for (const m of moves)
      if (!(m as { done?: boolean }).done)
        console.log(`NOT WRITTEN: ${file} ${m.cluster}.${m.node}`);
    let out = text;
    for (const e of edits.sort((a, b) => b.start - a.start))
      out = out.slice(0, e.start) + e.text + out.slice(e.end);
    writeFileSync(file, out);
  }
  console.log(`wrote ${byFile.size} files`);
}
