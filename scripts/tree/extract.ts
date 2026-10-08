/**
 * Extracts the parts of the 3.9 passive tree that parity is measured against (DESIGN §3 rule 2: data may be consulted,
 * layout and names are never copied). Raw files stay outside the repo; the trimmed JSON written here is reference data
 * under docs/tree/ and is never loaded by the game.
 *
 *   npm run tree:extract -- <path to TreeData/3_9/tree.lua>
 *
 * Source: the tree-3_9.zip of Path of Building v1.4.155 (see scripts/coverage/pob-extract.ts), 2019-12-11, 3.9.x. Kept per
 * node: its kind, its stat lines, the group (cluster) it sits in and the sector of the tree it is in (the class whose start
 * is nearest); no coordinates, so the layout cannot be reproduced from it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type Lua = unknown;

/** A reader for the plain tables Path of Building writes its data in: numbers, strings, booleans and nested tables. */
export function parseLua(src: string): Lua {
  let i = src.indexOf('{');
  const ws = () => {
    while (/\s/.test(src[i])) i++;
  };
  const value = (): Lua => {
    ws();
    const c = src[i];
    if (c === '{') return table();
    if (c === '"') {
      let j = i + 1;
      let out = '';
      while (src[j] !== '"') {
        if (src.charCodeAt(j) === 92) {
          out += src[j + 1] === 'n' ? '\n' : src[j + 1];
          j += 2;
        } else out += src[j++];
      }
      i = j + 1;
      return out;
    }
    const m = /^-?[0-9.eE+-]+|^true|^false|^nil/.exec(src.slice(i, i + 40));
    if (!m) throw new Error('cannot read ' + src.slice(i, i + 40));
    i += m[0].length;
    return m[0] === 'true' ? true : m[0] === 'false' ? false : m[0] === 'nil' ? null : Number(m[0]);
  };
  const table = (): Lua => {
    i++;
    const obj: Record<string, Lua> = {};
    let n = 0;
    let arr = true;
    for (;;) {
      ws();
      if (src[i] === '}') {
        i++;
        break;
      }
      if (src[i] === ',') {
        i++;
        continue;
      }
      if (src[i] === '[') {
        arr = false;
        i++;
        const k = value() as string;
        ws();
        i++;
        ws();
        i++;
        obj[k] = value();
      } else obj[n++] = value();
    }
    return arr ? Object.values(obj) : obj;
  };
  return value();
}

export type TreeRef = {
  source: string;
  /** The reference class starts, by sector index, in the order of `sectors`. */
  sectors: string[];
  nodes: RefNode[];
};

export type RefNode = {
  id: number;
  name: string;
  kind: 'small' | 'notable' | 'keystone' | 'start';
  lines: string[];
  /** The cluster (group) the node sits in. */
  group: number;
  /** Index into `sectors`: the class start nearest to the node's group. */
  sector: number;
  /** How far from the middle of the tree the group is, 0 to 1 (no angle: the layout cannot be rebuilt from it). */
  depth: number;
  /** Ids of the nodes it is linked to. */
  links: number[];
};

type RawNode = {
  id: number;
  dn: string;
  sd?: string[];
  ks?: boolean;
  not?: boolean;
  m?: boolean;
  isJewelSocket?: boolean;
  ascendancyName?: string;
  isProxy?: boolean;
  spc?: unknown[] | Record<string, number>;
  g: number;
  out?: Record<string, number> | number[];
  in?: Record<string, number> | number[];
};

const hasClass = (n: RawNode): boolean => !!n.spc && Object.keys(n.spc).length > 0;

export function extract(luaPath: string): TreeRef {
  const raw = parseLua(readFileSync(luaPath, 'utf8')) as {
    nodes: Record<string, RawNode>;
    groups: Record<string, { x: number; y: number }>;
  };
  const all = Object.values(raw.nodes);
  const starts = all.filter((n) => hasClass(n) && !n.ascendancyName);
  const names = ['MARAUDER', 'RANGER', 'WITCH', 'DUELIST', 'TEMPLAR', 'SHADOW'];
  const startNodes = names.map((nm) =>
    starts.find((n) => n.dn === nm || (n.dn === 'SIX' && nm === 'SHADOW')),
  );
  const sectors = names.map((s) => s.toLowerCase());
  const sectorOf = (g: number): number => {
    const p = raw.groups[g];
    let best = 0;
    let bd = Infinity;
    startNodes.forEach((s, i) => {
      if (!s) return;
      const q = raw.groups[s.g];
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const ids = (v: RawNode['out']): number[] => (v ? Object.values(v) : []);
  const reach = Math.max(...Object.values(raw.groups).map((g) => Math.hypot(g.x, g.y)));
  const nodes: RefNode[] = [];
  for (const n of all) {
    if (n.ascendancyName || n.isProxy || n.m || n.isJewelSocket) continue;
    if (hasClass(n)) continue;
    const lines = n.sd ?? [];
    const kind = n.ks ? 'keystone' : n.not ? 'notable' : 'small';
    nodes.push({
      id: n.id,
      name: n.dn,
      kind,
      lines,
      group: n.g,
      sector: sectorOf(n.g),
      depth: Math.round((Math.hypot(raw.groups[n.g].x, raw.groups[n.g].y) / reach) * 1000) / 1000,
      links: [...new Set([...ids(n.out), ...ids(n.in)])].sort((a, b) => a - b),
    });
  }
  nodes.sort((a, b) => a.id - b.id);
  return {
    source: 'Path of Building v1.4.155, TreeData/3_9/tree.lua (3.9.x)',
    sectors,
    nodes,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = process.argv[2];
  if (!path) throw new Error('usage: npm run tree:extract -- <path to tree.lua>');
  const ref = extract(resolve(path));
  const out = resolve(import.meta.dirname, '../../docs/tree/pob-tree.json');
  writeFileSync(out, JSON.stringify(ref));
  const c = (k: string) => ref.nodes.filter((n) => n.kind === k).length;
  console.log(
    `wrote ${ref.nodes.length} nodes: ${c('small')} small, ${c('notable')} notable, ${c('keystone')} keystone`,
  );
}
