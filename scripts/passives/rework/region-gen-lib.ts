// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// The Knife's generator (knife-gen.ts) made general: writes one region's area files from a hand-made table. The region's
// clusters as they were come from its snapshot (before/<region>.json, snapshot.ts), so a generator reruns from the same
// start. The table is the region's own file (<region>-gen.ts): roads node by node, each moved cluster's area, place,
// entrance and road node, redesigned lines (over), trims, new clusters, second notables and cluster-to-cluster links.
// Placement only rotates a moved cluster to face its road, and nudges a new cluster clear of existing nodes; what goes
// where is the table's choice.
import fs from 'fs';
export const ROOT = 'E:/Proj/Auto/.claude/worktrees/flask-scarcity/';

export type P2 = [number, number];
export type RoadNode = {
  id: string;
  at: P2;
  hub?: boolean;
  lines?: string;
  kind?: string;
  why?: string;
};
export type Road = {
  area: string;
  id: string;
  name: string;
  why: string;
  nodes: RoadNode[];
  links: [string, string][];
};
export type Move = {
  from: string;
  area: string;
  id?: string;
  at: P2;
  entry: [string, string][];
  why: string;
  ats?: Record<string, P2>;
};
export type NewCluster = {
  area: string;
  id: string;
  name: string;
  lines: string;
  smalls: string[];
  entry?: string;
  toward?: P2;
  ats?: P2[];
  why: string;
  kind?: 'notable' | 'keystone';
  nwhy?: string;
};
export type Second = {
  cluster: string;
  attach: string;
  id: string;
  name: string;
  lines: string;
  why: string;
};
export type Over = Record<string, { name?: string; lines: string; why?: string; kind?: string }>;
export type Config = {
  region: string; // folder and id prefix: 'spire'
  regionId: string; // place region: 'mystic'
  classId: string;
  th: number; // the region's angle in degrees
  start: P2;
  roadLines: string; // a road node's lines
  hubLines: string;
  roads: Road[];
  moves: Move[];
  links: [string, string, string][];
  over: Over;
  trim: Record<string, string[]>;
  newc: NewCluster[];
  second: Second[];
  pairs: [string, string][];
  areas: Record<string, { name: string; at: P2; why: string }>; // by file name; the export comes from the snapshot
  doc: string; // the plan doc named in each file's header
  dryRun?: boolean;
  external?: Record<string, P2>; // positions of other regions' nodes this region hangs clusters from
};

export const polar =
  (th: number) =>
  (r: number, d: number): P2 => {
    const a = ((th + d) * Math.PI) / 180;
    return [Math.round(r * Math.cos(a)), Math.round(r * Math.sin(a))];
  };
export const lerp = (p: P2, q: P2, t: number): P2 => [
  Math.round(p[0] + (q[0] - p[0]) * t),
  Math.round(p[1] + (q[1] - p[1]) * t),
];

export function generate(cfg: Config) {
  const pre = cfg.region + '.';
  const snap: any[] = JSON.parse(
    fs.readFileSync(ROOT + `scripts/passives/rework/before/${cfg.region}.json`, 'utf8'),
  );
  const areaById = new Map(snap.map((a) => [a.id.slice(pre.length), a]));
  const oldCluster = (key: string) => {
    const [area, id] = key.split('.');
    const a = areaById.get(area);
    if (!a) throw new Error('no area ' + area);
    const c = a.clusters.find((x: any) => x.id === id);
    if (!c) throw new Error('no cluster ' + key);
    return c;
  };
  const { roads, moves: M, over: OVER, trim: TRIM, newc: NEWC, second: SECOND, pairs: PAIRS } = cfg;
  const L = [...cfg.links];
  const keyOf = (m: Move) => `${pre}${m.area}.${m.id ?? m.from.split('.')[1]}`;
  for (const m of M)
    for (const [node, road] of m.entry) L.push([`${keyOf(m)}.${node}`, road, 'The way in.']);

  const roadIndex = new Map<string, P2>(Object.entries(cfg.external ?? {}));
  for (const r of roads)
    for (const n of r.nodes) roadIndex.set(`${pre}${r.area}.${r.id}.${n.id}`, n.at);
  for (const c of NEWC)
    if (c.ats)
      [...c.smalls.map((_, i) => `s${i + 1}`), 'n'].forEach((id, i) =>
        roadIndex.set(`${pre}${c.area}.${c.id}.${id}`, c.ats![i]),
      );
  const movedIndex = new Map<string, P2>();
  const roadPos = (full: string): P2 => {
    const p = roadIndex.get(full) ?? movedIndex.get(full);
    if (!p) throw new Error('no road ' + full);
    return p;
  };
  const place = (m: Move): P2[] => {
    const c = oldCluster(m.from);
    if (m.ats)
      return c.nodes.map((n: any) => {
        if (!m.ats![n.id]) throw new Error(`ats misses ${m.from}.${n.id}`);
        return m.ats![n.id];
      });
    const old = c.nodes.map((n: any) => n.at);
    const cx = old.reduce((s: number, p: number[]) => s + p[0], 0) / old.length;
    const cy = old.reduce((s: number, p: number[]) => s + p[1], 0) / old.length;
    const e = c.nodes.findIndex((n: any) => n.id === m.entry[0][0]);
    if (e < 0) throw new Error(`no entry node ${m.from}.${m.entry[0][0]}`);
    const road = roadPos(m.entry[0][1]);
    let rot = 0;
    if (c.nodes.length > 1) {
      const a0 = Math.atan2(old[e][1] - cy, old[e][0] - cx);
      const a1 = Math.atan2(road[1] - m.at[1], road[0] - m.at[0]);
      rot = a1 - a0;
    }
    return c.nodes.map((_: any, i: number) => {
      const dx = old[i][0] - cx,
        dy = old[i][1] - cy;
      return [
        Math.round(m.at[0] + dx * Math.cos(rot) - dy * Math.sin(rot)),
        Math.round(m.at[1] + dx * Math.sin(rot) + dy * Math.cos(rot)),
      ] as P2;
    });
  };
  const placed = new Map<Move, P2[]>();
  // A cluster hung from another moved cluster needs that one placed first: place in passes until all are placed.
  let todo = [...M];
  for (let pass = 0; todo.length && pass < 10; pass++) {
    const next: Move[] = [];
    for (const m of todo) {
      try {
        roadPos(m.entry[0][1]);
      } catch {
        next.push(m);
        continue;
      }
      const ps = place(m);
      placed.set(m, ps);
      const c = oldCluster(m.from);
      c.nodes.forEach((n: any, i: number) => movedIndex.set(`${keyOf(m)}.${n.id}`, ps[i]));
    }
    todo = next;
  }
  if (todo.length)
    throw new Error('unplaced: ' + todo.map((m) => m.from + ' via ' + m.entry[0][1]).join(', '));

  const shapeOf = (m: Move) => {
    const c = oldCluster(m.from);
    const ps = placed.get(m)!;
    const drop = new Set(TRIM[keyOf(m)] ?? []);
    let links: [string, string][] = c.links.map(([a, b]: [string, string]) => [a, b]);
    for (const x of drop) {
      const nb = links.filter((l) => l.includes(x)).map((l) => (l[0] === x ? l[1] : l[0]));
      links = links.filter((l) => !l.includes(x));
      if (nb.length === 2) links.push([nb[0], nb[1]]);
    }
    const nodes = c.nodes
      .map((n: any, i: number) => ({ n, at: ps[i] }))
      .filter((x: any) => !drop.has(x.n.id));
    return { c, nodes, links };
  };

  const occupied: P2[] = [];
  for (const r of roads) for (const n of r.nodes) occupied.push(n.at);
  for (const m of M) for (const x of shapeOf(m).nodes) occupied.push(x.at);
  for (const c of NEWC) if (c.ats) occupied.push(...c.ats);
  const clear = (p: P2, except: P2[]) =>
    occupied.every(
      (o) => except.some((e) => e === o) || Math.hypot(o[0] - p[0], o[1] - p[1]) >= 100,
    );
  const NUDGES = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90, 110, -110];
  const chainFrom = (from: P2, heading: number, n: number, step = 88, except: P2[] = []) => {
    for (const d of NUDGES) {
      const a = heading + (d * Math.PI) / 180;
      const pts: P2[] = [];
      for (let k = 1; k <= n; k++)
        pts.push([
          Math.round(from[0] + Math.cos(a) * step * k),
          Math.round(from[1] + Math.sin(a) * step * k),
        ]);
      if (pts.every((p) => clear(p, except))) return pts;
    }
    throw new Error('no room at ' + from);
  };
  const newPlaced = new Map<NewCluster, P2[]>();
  for (const c of NEWC) {
    if (c.ats) {
      newPlaced.set(c, c.ats);
      if (c.entry)
        L.push([`${pre}${c.area}.${c.id}.${c.smalls.length ? 's1' : 'n'}`, c.entry, 'The way in.']);
      continue;
    }
    const from = roadPos(c.entry!);
    const pts = chainFrom(
      from,
      Math.atan2(c.toward![1] - from[1], c.toward![0] - from[0]),
      c.smalls.length + 1,
      88,
      [from],
    );
    newPlaced.set(c, pts);
    occupied.push(...pts);
    L.push([`${pre}${c.area}.${c.id}.${c.smalls.length ? 's1' : 'n'}`, c.entry!, 'The way in.']);
  }
  const secondPlaced = new Map<Second, P2>();
  for (const s of SECOND) {
    const m = M.find((x) => keyOf(x) === s.cluster);
    if (!m) throw new Error('second: no moved cluster ' + s.cluster);
    const sh = shapeOf(m);
    const att = sh.nodes.find((x: any) => x.n.id === s.attach);
    if (!att) throw new Error('second: no node ' + s.cluster + '.' + s.attach);
    const at = att.at;
    const cx = sh.nodes.reduce((t: number, x: any) => t + x.at[0], 0) / sh.nodes.length;
    const cy = sh.nodes.reduce((t: number, x: any) => t + x.at[1], 0) / sh.nodes.length;
    const heading = Math.hypot(at[0] - cx, at[1] - cy) < 1 ? 0 : Math.atan2(at[1] - cy, at[0] - cx);
    const [p] = chainFrom(at, heading, 1, 85, [at]);
    secondPlaced.set(s, p);
    occupied.push(p);
  }

  const nodesOf = (key: string) => {
    const m = M.find((x) => keyOf(x) === key);
    if (m)
      return shapeOf(m).nodes.map((x: any) => ({
        id: `${key}.${x.n.id}`,
        kind: x.n.kind,
        at: x.at,
      }));
    const c = NEWC.find((x) => `${pre}${x.area}.${x.id}` === key);
    if (c)
      return [...c.smalls.map((_, i) => `s${i + 1}`), 'n'].map((id, i) => ({
        id: `${key}.${id}`,
        kind: id === 'n' ? (c.kind ?? 'notable') : 'small',
        at: newPlaced.get(c)![i],
      }));
    throw new Error('pair: no cluster ' + key);
  };
  for (const [a, b] of PAIRS) {
    let best: [string, string, number] | null = null;
    for (const x of nodesOf(a))
      for (const y of nodesOf(b)) {
        if (x.kind === 'keystone' || y.kind === 'keystone') continue;
        const d = Math.hypot(x.at[0] - y.at[0], x.at[1] - y.at[1]);
        if (!best || d < best[2]) best = [x.id, y.id, d];
      }
    L.push([
      best![0],
      best![1],
      'A way across between neighbouring clusters, dearer than the roads.',
    ]);
    console.log(`pair ${best![0]} – ${best![1]}: ${Math.round(best![2])}`);
  }

  // Report: old clusters not carried over, and over/trim/second keys that match nothing.
  const usedOld = new Set(M.map((m) => m.from));
  for (const a of snap)
    for (const c of a.clusters) {
      const k = `${a.id.slice(pre.length)}.${c.id}`;
      if (!usedOld.has(k))
        console.log(
          `dropped: ${k} (${c.nodes
            .filter((n: any) => n.kind === 'notable' || n.kind === 'keystone')
            .map((n: any) => n.name)
            .join(', ')})`,
        );
    }
  const allIds = new Set<string>();
  for (const m of M) for (const x of shapeOf(m).nodes) allIds.add(`${keyOf(m)}.${x.n.id}`);
  for (const k of Object.keys(OVER))
    if (!allIds.has(k) && !k.endsWith('?')) console.log('over matches nothing: ' + k);

  // ---- Writing the files.
  const q = (s: string) => JSON.stringify(s);
  const files = new Map(snap.map((a) => [a.file, a]));
  const out: Record<string, string> = {};
  for (const file of Object.keys(cfg.areas)) {
    const meta = cfg.areas[file];
    const snapArea = files.get(file);
    const exportName = snapArea?.export ?? file;
    const areaKey = snapArea ? snapArea.id.slice(pre.length) : file;
    const used = new Set<string>();
    const use = (lines: string) => {
      for (const f of lines.match(/[a-zA-Z]+(?=\()/g) ?? []) used.add(f);
      return lines;
    };
    const clusters: string[] = [];
    for (const r of roads.filter((x) => x.area === areaKey)) {
      const nodes = r.nodes.map((n) => {
        const lines = use(n.lines ?? (n.hub ? cfg.hubLines : cfg.roadLines));
        return `        { id: ${q(n.id)}, kind: ${q(n.kind ?? 'attribute')}, lines: [${lines}], at: [${n.at[0]}, ${n.at[1]}]${n.why ? `, why: ${q(n.why)}` : ''} },`;
      });
      clusters.push(
        `    {\n      id: ${q(r.id)},\n      name: ${q(r.name)},\n      why: ${q(r.why)},\n      at: [${r.nodes[0].at[0]}, ${r.nodes[0].at[1]}],\n      shape: { kind: 'hand' },\n      nodes: [\n${nodes.join('\n')}\n      ],\n      links: [${r.links.map(([a, b]) => `[${q(a)}, ${q(b)}]`).join(', ')}],\n    },`,
      );
    }
    for (const m of M.filter((x) => x.area === areaKey)) {
      const key = keyOf(m);
      const sh = shapeOf(m);
      let cname = sh.c.name;
      const nodes = sh.nodes.map(({ n, at }: any) => {
        const o = OVER[`${key}.${n.id}`];
        const lines = use(o ? o.lines : n.lines.join(', '));
        const name = o?.name ?? n.name;
        const kind = o?.kind ?? n.kind;
        if (o?.name && cname === n.name) cname = o.name;
        const why =
          o?.why ??
          (!o && n.why && (n.kind === 'notable' || n.kind === 'keystone') ? n.why : undefined);
        return `        { id: ${q(n.id)}, kind: ${q(kind)}${name && kind !== 'small' && kind !== 'attribute' ? `, name: ${q(name)}` : ''}, lines: [${lines}], at: [${at[0]}, ${at[1]}]${why ? `, why: ${q(why)}` : ''} },`;
      });
      const links = [...sh.links];
      for (const s of SECOND.filter((x) => x.cluster === key)) {
        const p = secondPlaced.get(s)!;
        nodes.push(
          `        { id: ${q(s.id)}, kind: 'notable', name: ${q(s.name)}, lines: [${use(s.lines)}], at: [${p[0]}, ${p[1]}], why: ${q(s.why)} },`,
        );
        links.push([s.attach, s.id]);
      }
      clusters.push(
        `    {\n      id: ${q(m.id ?? sh.c.id)},\n      name: ${q(cname)},\n      why: ${q(m.why)},\n      at: [${Math.round(m.at[0])}, ${Math.round(m.at[1])}],\n      shape: { kind: 'hand' },\n      nodes: [\n${nodes.join('\n')}\n      ],\n      links: [${links.map(([a, b]) => `[${q(a)}, ${q(b)}]`).join(', ')}],\n    },`,
      );
    }
    for (const c of NEWC.filter((x) => x.area === areaKey)) {
      const pts = newPlaced.get(c)!;
      const ids = [...c.smalls.map((_, i) => `s${i + 1}`), 'n'];
      const nodes = ids.map((id, i) => {
        const isN = id === 'n';
        return `        { id: ${q(id)}, kind: ${q(isN ? (c.kind ?? 'notable') : 'small')}${isN ? `, name: ${q(c.name)}` : ''}, lines: [${use(isN ? c.lines : c.smalls[i])}], at: [${pts[i][0]}, ${pts[i][1]}]${isN && (c.nwhy ?? c.why) ? `, why: ${q(c.nwhy ?? c.why)}` : ''} },`;
      });
      const links = ids.slice(1).map((id, i) => `[${q(ids[i])}, ${q(id)}]`);
      clusters.push(
        `    {\n      id: ${q(c.id)},\n      name: ${q(c.name)},\n      why: ${q(c.why)},\n      at: [${pts[pts.length - 1][0]}, ${pts[pts.length - 1][1]}],\n      shape: { kind: 'hand' },\n      nodes: [\n${nodes.join('\n')}\n      ],\n      links: [${links.join(', ')}],\n    },`,
      );
    }
    const startId = `start.${cfg.classId}`;
    const links = L.filter(
      ([a]) => a.startsWith(`${pre}${areaKey}.`) || (areaKey === 'home' && a === startId),
    ).map(([a, b, why]) => `    { from: ${q(a)}, to: ${q(b)}, why: ${q(why)} },`);
    const text: string[] = [];
    text.push(
      `/**\n * ${meta.name}: ${meta.why}\n * Written for the attrition rework from docs/tree/design/${cfg.doc} (2026-10-31).\n */`,
    );
    text.push(`import { ${[...used].sort().join(', ')} } from '../lines';`);
    text.push(`import type { AreaSpec } from '../types';\n`);
    if (areaKey === 'home')
      text.push(
        `export const START = {\n  classId: ${q(cfg.classId)},\n  region: ${q(cfg.regionId)} as const,\n  id: ${q(startId)},\n  at: [${cfg.start[0]}, ${cfg.start[1]}] as [number, number],\n};\n`,
      );
    text.push(
      `export const ${exportName}: AreaSpec = {\n  id: ${q(pre + areaKey)},\n  region: ${q(cfg.regionId)},\n  name: ${q(meta.name)},\n  why: ${q(meta.why)},\n  at: [${meta.at[0]}, ${meta.at[1]}],\n  clusters: [\n${clusters.join('\n')}\n  ],\n  links: [\n${links.join('\n')}\n  ],\n};\n`,
    );
    out[file] = text.join('\n');
  }
  // Links whose `from` is in no written area are lost: say so.
  const written = Object.keys(cfg.areas).map(
    (f) => pre + (files.get(f)?.id.slice(pre.length) ?? f) + '.',
  );
  for (const [a, b] of L)
    if (!written.some((w) => a.startsWith(w)) && a !== `start.${cfg.classId}`)
      console.log(`link from outside the region, add by hand: ${a} -> ${b}`);
  if (!cfg.dryRun)
    for (const [file, text] of Object.entries(out))
      fs.writeFileSync(ROOT + `src/data/passives/${cfg.region}/${file}.ts`, text);
  console.log(cfg.dryRun ? 'dry run' : 'written', Object.keys(out).join(', '));
}
