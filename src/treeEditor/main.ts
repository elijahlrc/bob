/**
 * The tree editor (`npm run tree:edit`, then http://localhost:5173/tree-editor.html). Move nodes, change their type, add and remove
 * nodes and connections, copy the stats of one node onto another. Save writes `src/data/tree/treeEdits.json` (a patch against the
 * baked tree; see src/data/tree/edits.ts), and the game reads it from there. Dev server only: the page is not part of the build.
 *
 * With `?tree=next` (`npm run passives:edit`) it edits the hand-written tree instead (src/data/passives): the base is the tree
 * built from the area files, the patch is src/data/passives/edits.json, keyed by the registry numbers of ids.json, and the
 * listing, picture and audit tools apply it. No region backdrop then: the new tree has its own map.
 */
import { applyEditsStable, diffTree, NO_EDITS, type TreeEdits } from '../data/tree/edits';
import edits from '../data/tree/treeEdits.json';
import { BAKED_TREE } from '../data/tree/treeBaked';
import type { Tree, TreeNode, TreeNodeKind } from '../data/tree/types';
import { buildAll } from '../data/passives';
import type { LineSpec } from '../data/passives/types';
import { CHOICES, defaultSpec, makeLine, nameOfLines, VOCAB } from '../data/passives/vocab';
import passiveEdits from '../data/passives/edits.json';
import { modsText } from '../mods/text';
import { edgePath } from '../ui/treeStyle';
import {
  BG,
  edgeStyle,
  GOLD,
  paintAreaLabels,
  paintBackdrop,
  paintLabel,
  paintNode,
  paintText,
  reach,
} from './paint';
import { KEYSTONES } from '../data/tree/keystones';
import { checkTree } from './check';

type Tool = 'select' | 'link' | 'add' | 'stamp';
const KINDS: TreeNodeKind[] = ['small', 'notable', 'keystone', 'travel'];
const TOOLS: { id: Tool; label: string; key: string; hint: string }[] = [
  {
    id: 'select',
    label: 'Select / move',
    key: 'V',
    hint: 'Click a node to select it (Shift adds). Drag a node to move it; drag empty space to pan; Shift-drag empty space to box-select.',
  },
  {
    id: 'link',
    label: 'Connect',
    key: 'L',
    hint: 'Click one node, then another: a connection is made, or taken away if there was one. The second node stays the start of the next.',
  },
  {
    id: 'add',
    label: 'Add node',
    key: 'A',
    hint: 'Click empty space to place a node of the type chosen below. It takes the name and stats of the selected node, and is connected to it.',
  },
  {
    id: 'stamp',
    label: 'Copy stats',
    key: 'C',
    hint: 'Select a node with the stats you want, then click the nodes that should get its name and stats.',
  },
];

const canvas = document.getElementById('cv') as HTMLCanvasElement;
const side = document.getElementById('side') as HTMLElement;
const ctx = canvas.getContext('2d')!;

// ---- which tree ----------------------------------------------------------------------------------------------------------------
const NEXT = new URLSearchParams(location.search).get('tree') === 'next';
const BUILT = NEXT ? buildAll({ allowNew: true, edits: false }) : null;
const BASE: Tree = BUILT ? BUILT.tree : BAKED_TREE;
/** Every base node's lines in the vocabulary (hand-written tree only): what the line editor starts from and diffs against. */
const BASE_LINES: LineSpec[][] = BUILT?.lines ?? [];
const EDITS = (NEXT ? passiveEdits : edits) as unknown as TreeEdits;
const EDITS_FILE = NEXT ? 'src/data/passives/edits.json' : 'src/data/tree/treeEdits.json';
const SAVE_URL = NEXT ? '/__tree-edits?tree=next' : '/__tree-edits';
if (NEXT) document.title = 'Bob tree editor (hand-written tree)';

// ---- state -------------------------------------------------------------------------------------------------------------------
let nodes: TreeNode[] = applyEditsStable(BASE, EDITS);
/** The lines of every node, by id, as edited (hand-written tree only); the patch records those that differ from the base. */
let nodeLines: Record<number, LineSpec[]> = baseLines();
function baseLines(): Record<number, LineSpec[]> {
  const out: Record<number, LineSpec[]> = {};
  BASE_LINES.forEach((l, i) => l.length && (out[i] = JSON.parse(JSON.stringify(l))));
  for (const [id, l] of Object.entries(EDITS.lines ?? {}))
    out[Number(id)] = JSON.parse(JSON.stringify(l));
  return out;
}
/** The lines that differ from the base, for the patch. */
function linesPatch(): Record<string, LineSpec[]> | undefined {
  if (!NEXT) return undefined;
  const out: Record<string, LineSpec[]> = {};
  for (const n of nodes) {
    if (n.kind === 'start' || n.kind === 'keystone') continue;
    const now = nodeLines[n.id] ?? [];
    const was = BASE_LINES[n.id] ?? [];
    if (JSON.stringify(now) !== JSON.stringify(was)) out[String(n.id)] = now;
  }
  return Object.keys(out).length ? out : undefined;
}
/** The whole patch: the node and link diff, plus the changed lines. */
function currentPatch(): TreeEdits {
  const patch = diffTree(BASE, nodes);
  const lines = linesPatch();
  return lines ? { ...patch, lines } : patch;
}
/** Gives a node new lines: its mods follow, and a small or attribute node's name too. */
function setLines(n: TreeNode, specs: LineSpec[]) {
  nodeLines[n.id] = specs;
  const made = specs.map(makeLine).filter((l): l is NonNullable<typeof l> => l !== null);
  n.mods = made.flatMap((l) => l.mods);
  if (n.kind === 'small' || n.kind === 'travel') n.name = nameOfLines(made);
}
let byId = new Map<number, TreeNode>();
const reindex = () => (byId = new Map(nodes.map((n) => [n.id, n])));
reindex();
let nextId = Math.max(BASE.nodes.length, ...nodes.map((n) => n.id + 1));
const baseBy = new Map(BASE.nodes.map((n) => [n.id, n]));
const startIds = new Set(Object.values(BASE.starts));

let tool: Tool = 'select';
let sel = new Set<number>();
let anchor: number | null = null; // the node a connection starts from
let stampFrom: number | null = null;
let addKind: TreeNodeKind = 'small';
let snap = true;
let showLabels = true;
/** The areas' names, zoomed out (the hand-written tree only). */
let showAreas = true;
/** Stat lines under every node once the view is close enough for them to fit (paintText). */
let showText = true;
/** A node's lines as text, kept per mods array (an edit replaces the array, so the cache follows). */
const textCache = new WeakMap<object, string[]>();
function textOf(n: TreeNode): string[] {
  if (n.kind === 'start') return [];
  let t = textCache.get(n.mods);
  if (!t) {
    t =
      n.kind === 'keystone'
        ? (KEYSTONES.find((k) => k.name === n.name)?.description ?? '')
            .split('. ')
            .map((s) => s.replace(/\.$/, ''))
            .filter(Boolean)
        : modsText(n.mods);
    textCache.set(n.mods, t);
  }
  return t;
}
let view = { x: 0, y: 0, k: 0.2 };
let dirty = false;
let status = '';
let report = '';
let changed = new Set<number>();
let hover: number | null = null;
const undoStack: string[] = [];
const redoStack: string[] = [];

const snapshot = () => JSON.stringify({ nodes, nextId, nodeLines });
function remember() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack.length = 0;
}
function restore(s: string) {
  const o = JSON.parse(s) as {
    nodes: TreeNode[];
    nextId: number;
    nodeLines?: Record<number, LineSpec[]>;
  };
  nodes = o.nodes;
  nextId = o.nextId;
  nodeLines = o.nodeLines ?? {};
  reindex();
  sel = new Set([...sel].filter((i) => byId.has(i)));
  anchor = null;
  refreshChanged();
}
function undo() {
  const s = undoStack.pop();
  if (!s) return;
  redoStack.push(snapshot());
  restore(s);
  dirty = true;
  draw();
  panel();
}
function redo() {
  const s = redoStack.pop();
  if (!s) return;
  undoStack.push(snapshot());
  restore(s);
  dirty = true;
  draw();
  panel();
}

/** Which nodes differ from the baked tree (they get a ring). */
function refreshChanged() {
  changed = new Set();
  const patch = currentPatch();
  for (const id of Object.keys(patch.lines ?? {})) changed.add(Number(id));
  for (const id of Object.keys(patch.nodes ?? {})) changed.add(Number(id));
  for (const a of patch.add ?? []) changed.add(a.id);
  for (const [a, b] of [...(patch.linkAdd ?? []), ...(patch.linkRemove ?? [])]) {
    changed.add(a);
    changed.add(b);
  }
}

// ---- view --------------------------------------------------------------------------------------------------------------------
let fitted = false;
function resize() {
  const r = canvas.getBoundingClientRect();
  if (!fitted && r.width > 0) {
    fitted = true;
    fit();
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  draw();
}
function fit() {
  const r = canvas.getBoundingClientRect();
  const m = Math.max(...nodes.map((n) => Math.max(Math.abs(n.x), Math.abs(n.y)))) + 100;
  view = { x: 0, y: 0, k: Math.min(r.width, r.height) / (2 * m) };
}
const toWorld = (px: number, py: number) => {
  const r = canvas.getBoundingClientRect();
  return {
    x: (px - r.left - r.width / 2) / view.k + view.x,
    y: (py - r.top - r.height / 2) / view.k + view.y,
  };
};

function nodeAt(wx: number, wy: number): number | null {
  let best: number | null = null;
  let bd = Infinity;
  for (const n of nodes) {
    const d = Math.hypot(n.x - wx, n.y - wy);
    const r = Math.max(reach(n.kind, view.k), 9 / view.k);
    if (d <= r && d < bd) {
      best = n.id;
      bd = d;
    }
  }
  return best;
}

// ---- drawing -----------------------------------------------------------------------------------------------------------------
const maxR = Math.max(...BASE.nodes.map((n) => Math.hypot(n.x, n.y)));

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width;
  const h = canvas.height;
  const k = view.k;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  ctx.setTransform(k * dpr, 0, 0, k * dpr, w / 2 - view.x * k * dpr, h / 2 - view.y * k * dpr);
  ctx.lineCap = 'round';
  const px = 1 / k;
  const left = view.x - w / dpr / 2 / k - 80;
  const right = view.x + w / dpr / 2 / k + 80;
  const top = view.y - h / dpr / 2 / k - 80;
  const bottom = view.y + h / dpr / 2 / k + 80;
  const seen = (n: TreeNode) => n.x >= left && n.x <= right && n.y >= top && n.y <= bottom;
  if (!NEXT) paintBackdrop(ctx, maxR, k);
  else if (showAreas) paintAreaLabels(ctx, BUILT?.tree.areas ?? [], k);
  // links (a link is drawn when either end is on screen)
  edgeStyle(ctx, k);
  for (const n of nodes)
    for (const m of n.links) {
      if (m < n.id) continue;
      const o = byId.get(m);
      if (o && (seen(n) || seen(o))) ctx.stroke(new Path2D(edgePath(n, o)));
    }
  // links that differ from the baked tree
  const patch = diffTree(BASE, nodes);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.6 * px;
  for (const [a, b] of patch.linkAdd ?? []) {
    const na = byId.get(a);
    const nb = byId.get(b);
    if (na && nb) ctx.stroke(new Path2D(edgePath(na, nb)));
  }
  for (const n of nodes) if (seen(n)) paintNode(ctx, n, k);
  // what the editor adds on top: hand edits, selection, the node a connection starts from
  const ring = (n: TreeNode, color: string, extra: number, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width * px;
    ctx.beginPath();
    ctx.arc(n.x, n.y, reach(n.kind, k) + extra * px, 0, Math.PI * 2);
    ctx.stroke();
  };
  for (const id of changed) {
    const n = byId.get(id);
    if (n && seen(n)) ring(n, '#f0a060', 3, 2);
  }
  for (const id of sel) {
    const n = byId.get(id);
    if (n) ring(n, '#ffffff', 6, 2.5);
  }
  for (const id of [anchor, stampFrom, hover]) {
    const n = id === null ? null : byId.get(id);
    if (n) ring(n, id === hover ? '#8d8fa8' : '#70d090', 10, 2);
  }
  // names, as in the game; the node under the pointer and the selection always show theirs
  if (showLabels) for (const n of nodes) if (seen(n)) paintLabel(ctx, n, k);
  if (showText) for (const n of nodes) if (seen(n)) paintText(ctx, n, k, textOf(n));
  for (const id of [hover, ...sel]) {
    const n = id === null ? null : byId.get(id);
    if (n) paintLabel(ctx, n, k, true);
  }
  if (box) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = '#8d8fa8';
    ctx.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
  }
}

// ---- editing -----------------------------------------------------------------------------------------------------------------
const linked = (a: TreeNode, b: TreeNode) => a.links.includes(b.id);
function toggleLink(aId: number, bId: number) {
  const a = byId.get(aId)!;
  const b = byId.get(bId)!;
  if (a === b) return;
  if (linked(a, b)) {
    a.links = a.links.filter((x) => x !== b.id);
    b.links = b.links.filter((x) => x !== a.id);
  } else {
    a.links.push(b.id);
    b.links.push(a.id);
  }
}
function removeNodes(ids: number[]) {
  const doomed = new Set(ids.filter((i) => !startIds.has(i)));
  if (!doomed.size) return;
  remember();
  for (const n of nodes) n.links = n.links.filter((m) => !doomed.has(m));
  nodes = nodes.filter((n) => !doomed.has(n.id));
  reindex();
  sel = new Set([...sel].filter((i) => !doomed.has(i)));
  anchor = null;
  touched();
}
function touched() {
  dirty = true;
  refreshChanged();
  draw();
  panel();
}
const snapTo = (v: number) => (snap ? Math.round(v / 10) * 10 : Math.round(v));

let drag:
  | { kind: 'pan'; sx: number; sy: number; vx: number; vy: number }
  | { kind: 'move'; sx: number; sy: number; orig: Map<number, [number, number]>; moved: boolean }
  | null = null;
let box: { x0: number; y0: number; x1: number; y1: number } | null = null;

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  const r = canvas.getBoundingClientRect();
  const w = toWorld(e.clientX, e.clientY);
  const id = nodeAt(w.x, w.y);
  if (
    e.button === 1 ||
    e.button === 2 ||
    (e.button === 0 && id === null && tool !== 'add' && !e.shiftKey)
  ) {
    drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    if (e.button === 0 && tool === 'select' && !e.shiftKey) sel = new Set();
    return;
  }
  if (e.button !== 0) return;
  if (tool === 'select') {
    if (id === null) {
      // shift on empty space: box select
      box = {
        x0: e.clientX - r.left,
        y0: e.clientY - r.top,
        x1: e.clientX - r.left,
        y1: e.clientY - r.top,
      };
      return;
    }
    if (e.shiftKey) {
      if (sel.has(id)) sel.delete(id);
      else sel.add(id);
    } else if (!sel.has(id)) sel = new Set([id]);
    drag = {
      kind: 'move',
      sx: w.x,
      sy: w.y,
      orig: new Map([...sel].map((i) => [i, [byId.get(i)!.x, byId.get(i)!.y] as [number, number]])),
      moved: false,
    };
    panel();
  } else if (tool === 'link') {
    if (id === null) {
      anchor = null;
    } else if (anchor === null) {
      anchor = id;
      sel = new Set([id]);
    } else if (anchor !== id) {
      remember();
      toggleLink(anchor, id);
      anchor = id;
      sel = new Set([id]);
      touched();
      return;
    }
    panel();
  } else if (tool === 'add') {
    if (id !== null) {
      sel = new Set([id]);
    } else {
      const from = sel.size === 1 ? byId.get([...sel][0]) : undefined;
      remember();
      const n: TreeNode = {
        id: nextId++,
        kind: addKind,
        name: from?.name ?? 'New node',
        mods: from ? JSON.parse(JSON.stringify(from.mods)) : [],
        x: snapTo(w.x),
        y: snapTo(w.y),
        links: [],
        ...(from?.region ? { region: from.region } : {}),
      };
      nodes.push(n);
      if (from && nodeLines[from.id])
        nodeLines[n.id] = JSON.parse(JSON.stringify(nodeLines[from.id]));
      reindex();
      if (from) toggleLink(from.id, n.id);
      sel = new Set([n.id]);
      touched();
      return;
    }
    panel();
  } else if (tool === 'stamp') {
    if (id === null) return;
    if (stampFrom === null || e.shiftKey) {
      stampFrom = id;
      sel = new Set([id]);
    } else if (id !== stampFrom) {
      const src = byId.get(stampFrom)!;
      const dst = byId.get(id)!;
      if (!startIds.has(id)) {
        remember();
        dst.name = src.name;
        dst.mods = JSON.parse(JSON.stringify(src.mods));
        touched();
        return;
      }
    }
    panel();
  }
  draw();
});

canvas.addEventListener('pointermove', (e) => {
  const w = toWorld(e.clientX, e.clientY);
  if (drag?.kind === 'pan') {
    view.x = drag.vx - (e.clientX - drag.sx) / view.k;
    view.y = drag.vy - (e.clientY - drag.sy) / view.k;
  } else if (drag?.kind === 'move') {
    const dx = w.x - drag.sx;
    const dy = w.y - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) * view.k < 3) return;
    if (!drag.moved) remember();
    drag.moved = true;
    for (const [id, [ox, oy]] of drag.orig) {
      const n = byId.get(id)!;
      n.x = snapTo(ox + dx);
      n.y = snapTo(oy + dy);
      // A moved node is off its loop: the line to a neighbour on it would bend the wrong way.
      delete n.orbit;
    }
  } else if (box) {
    const r = canvas.getBoundingClientRect();
    box.x1 = e.clientX - r.left;
    box.y1 = e.clientY - r.top;
  } else {
    const id = nodeAt(w.x, w.y);
    if (id !== hover) {
      hover = id;
      draw();
    }
    return;
  }
  draw();
});

canvas.addEventListener('pointerup', (e) => {
  if (drag?.kind === 'move' && drag.moved) touched();
  if (box) {
    const a = toWorld(
      box.x0 + canvas.getBoundingClientRect().left,
      box.y0 + canvas.getBoundingClientRect().top,
    );
    const b = toWorld(e.clientX, e.clientY);
    const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
    const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
    for (const n of nodes) if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1) sel.add(n.id);
    box = null;
    panel();
  }
  drag = null;
  draw();
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const before = toWorld(e.clientX, e.clientY);
    view.k = Math.min(4, Math.max(0.03, view.k * Math.exp(-e.deltaY * 0.0015)));
    const after = toWorld(e.clientX, e.clientY);
    view.x += before.x - after.x;
    view.y += before.y - after.y;
    draw();
  },
  { passive: false },
);

window.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    void save();
  } else if (e.key === 'Delete' || e.key === 'Backspace') removeNodes([...sel]);
  else if (e.key === 'Escape') {
    anchor = null;
    stampFrom = null;
    sel = new Set();
    draw();
    panel();
  } else {
    const t2 = TOOLS.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
    if (t2 && !e.ctrlKey && !e.metaKey) setTool(t2.id);
  }
});
window.addEventListener('beforeunload', (e) => {
  if (dirty) e.preventDefault();
});

function setTool(t: Tool) {
  tool = t;
  anchor = null;
  stampFrom = null;
  canvas.style.cursor = t === 'select' ? 'default' : 'crosshair';
  draw();
  panel();
}

// ---- saving ------------------------------------------------------------------------------------------------------------------
async function save() {
  const patch = currentPatch();
  try {
    const res = await fetch(SAVE_URL, { method: 'POST', body: JSON.stringify(patch) });
    if (!res.ok) throw new Error(await res.text());
    dirty = false;
    status = `Saved ${new Date().toLocaleTimeString()} to ${EDITS_FILE}. ${NEXT ? 'The passives tools (list, pic, audit) apply it.' : 'The game reads it on its next load.'}`;
  } catch (err) {
    status = `Could not save (is this the dev server?): ${String(err)}. Use Download instead.`;
  }
  panel();
}
function download() {
  const blob = new Blob([JSON.stringify(currentPatch(), null, 2) + '\n'], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = NEXT ? 'edits.json' : 'treeEdits.json';
  a.click();
}
function revertAll() {
  if (
    !confirm(`Throw away every hand edit and go back to the ${NEXT ? 'area files' : 'baked tree'}?`)
  )
    return;
  remember();
  nodes = applyEditsStable(BASE, NO_EDITS);
  nodeLines = {};
  BASE_LINES.forEach((l, i) => l.length && (nodeLines[i] = JSON.parse(JSON.stringify(l))));
  reindex();
  nextId = BASE.nodes.length;
  sel = new Set();
  touched();
}
function runCheck() {
  const c = checkTree(nodes, BASE.starts);
  const lines: string[] = [];
  const bad = Object.entries(c.unreachable).filter(([, n]) => n > 0);
  lines.push(
    bad.length
      ? `Cut off from: ${bad.map(([k, n]) => `${k} (${n} nodes)`).join(', ')}`
      : 'Every node can be reached from every class start.',
  );
  if (c.loose.length)
    lines.push(
      `Not connected to anything: ${c.loose.slice(0, 8).join(', ')}${c.loose.length > 8 ? '...' : ''}`,
    );
  if (c.crowded.length)
    lines.push(
      `${c.crowded.length} pair(s) of nodes closer than 14 units${c.crowded.length ? ` (first: ${c.crowded[0].join(' and ')})` : ''}`,
    );
  lines.push(`${c.keystones} keystones (27 expected)`);
  report = lines.join('\n');
  panel();
}

// ---- side panel --------------------------------------------------------------------------------------------------------------
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...kids: (Node | string)[]
) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...kids);
  return e;
}
const btn = (label: string, fn: () => void, on = false) => {
  const b = el('button', { textContent: label, onclick: fn });
  if (on) b.className = 'on';
  return b;
};

function panel() {
  const active = document.activeElement as HTMLInputElement | null;
  const keep = active?.dataset?.keep; // keep typing in a field while the panel redraws
  side.replaceChildren();
  side.append(el('h3', { textContent: 'Tool' }));
  const tools = el('div', { className: 'row' });
  for (const t of TOOLS)
    tools.append(btn(`${t.label} (${t.key})`, () => setTool(t.id), tool === t.id));
  side.append(
    tools,
    el('div', { className: 'mods', textContent: TOOLS.find((t) => t.id === tool)!.hint }),
  );

  const opts = el('div', { className: 'row' });
  const kindSel = el('select');
  for (const k of KINDS)
    kindSel.append(el('option', { value: k, textContent: k, selected: k === addKind }));
  kindSel.onchange = () => (addKind = kindSel.value as TreeNodeKind);
  const snapBox = el('input', {
    type: 'checkbox',
    checked: snap,
    onchange: () => (snap = snapBox.checked),
  });
  const lblBox = el('input', {
    type: 'checkbox',
    checked: showLabels,
    onchange: () => ((showLabels = lblBox.checked), draw()),
  });
  const areaBox = el('input', {
    type: 'checkbox',
    checked: showAreas,
    onchange: () => ((showAreas = areaBox.checked), draw()),
  });
  const textBox = el('input', {
    type: 'checkbox',
    checked: showText,
    onchange: () => ((showText = textBox.checked), draw()),
  });
  opts.append(
    'New node type',
    kindSel,
    el('label', {}, snapBox, ' snap to 10'),
    el('label', {}, lblBox, ' names'),
    ...(NEXT
      ? [
          el(
            'label',
            { title: 'The areas’ names, shown zoomed out and fading as you zoom in.' },
            areaBox,
            ' areas',
          ),
        ]
      : []),
    el(
      'label',
      {
        title:
          'Every node’s stat lines, once you are zoomed in far enough for them to fit between nodes.',
      },
      textBox,
      ' stats',
    ),
  );
  side.append(opts);

  side.append(el('h3', { textContent: 'Selected' }));
  if (sel.size === 0)
    side.append(el('div', { className: 'mods', textContent: 'Nothing selected.' }));
  else if (sel.size > 1) {
    side.append(el('div', { textContent: `${sel.size} nodes.` }));
    const row = el('div', { className: 'row' });
    for (const k of KINDS) row.append(btn(`make ${k}`, () => setKind([...sel], k)));
    row.append(btn('delete', () => removeNodes([...sel])));
    side.append(row);
  } else {
    const n = byId.get([...sel][0])!;
    const base = baseBy.get(n.id);
    side.append(
      el('div', {
        textContent: `#${n.id}  ${n.kind}${startIds.has(n.id) ? ' (class start)' : ''}${base ? '' : '  (new)'}${n.district ? '  ' + n.district : ''}`,
      }),
    );
    const name = el('input', { type: 'text', value: n.name });
    name.dataset.keep = 'name';
    name.onchange = () => (remember(), (n.name = name.value), touched());
    side.append(el('div', { className: 'row' }, 'Name', name));
    const xy = el('div', { className: 'row' });
    for (const ax of ['x', 'y'] as const) {
      const inp = el('input', { type: 'number', value: String(n[ax]) });
      inp.dataset.keep = ax;
      inp.onchange = () => {
        remember();
        n[ax] = Math.round(Number(inp.value)) || 0;
        delete n.orbit;
        touched();
      };
      xy.append(ax.toUpperCase(), inp);
    }
    side.append(xy);
    if (!startIds.has(n.id)) {
      const row = el('div', { className: 'row' }, 'Type');
      for (const k of KINDS) row.append(btn(k, () => setKind([n.id], k), n.kind === k));
      side.append(row);
    }
    if (NEXT && n.kind !== 'start' && n.kind !== 'keystone') side.append(lineEditor(n));
    side.append(
      el('div', { className: 'mods', textContent: modsText(n.mods).join('\n') || '(no stats)' }),
    );
    side.append(el('h3', { textContent: 'Connections' }));
    const ls = el('div', { className: 'links' });
    for (const m of n.links) {
      const o = byId.get(m);
      if (!o) continue;
      ls.append(
        btn(`${o.name} #${o.id} ×`, () => {
          remember();
          toggleLink(n.id, o.id);
          touched();
        }),
      );
    }
    side.append(ls);
    const row = el('div', { className: 'row' });
    row.append(
      btn(
        'centre view',
        () => ((view.x = n.x), (view.y = n.y), (view.k = Math.max(view.k, 0.5)), draw()),
      ),
    );
    if (!startIds.has(n.id)) row.append(btn('delete', () => removeNodes([n.id])));
    side.append(row);
  }

  side.append(el('h3', { textContent: 'Find' }));
  const q = el('input', { type: 'text', placeholder: 'node name…' });
  q.dataset.keep = 'find';
  const res = el('div', { className: 'links' });
  q.oninput = () => {
    res.replaceChildren();
    const s = q.value.trim().toLowerCase();
    if (s.length < 2) return;
    for (const n of nodes.filter((x) => x.name.toLowerCase().includes(s)).slice(0, 14))
      res.append(
        btn(
          `${n.name} #${n.id}`,
          () => (
            (sel = new Set([n.id])),
            (view.x = n.x),
            (view.y = n.y),
            (view.k = Math.max(view.k, 0.6)),
            draw(),
            panel()
          ),
        ),
      );
  };
  side.append(q, res);

  side.append(el('h3', { textContent: 'Tree' }));
  const row = el('div', { className: 'row' });
  row.append(
    btn(`Undo (${undoStack.length})`, undo),
    btn('Redo', redo),
    btn('Check', runCheck),
    btn(dirty ? 'Save *' : 'Save', () => void save()),
    btn('Download', download),
    btn('Revert all', revertAll),
    btn('Fit', () => (fit(), draw())),
  );
  side.append(row);
  const nEdits = changed.size;
  side.append(
    el('div', {
      id: 'status',
      textContent: `${nodes.length} nodes, ${nEdits} touched by hand${dirty ? ', unsaved' : ''}.`,
    }),
  );
  if (status)
    side.append(
      el('div', { className: status.startsWith('Could') ? 'warn' : 'ok', textContent: status }),
    );
  if (report) side.append(el('div', { className: 'mods', textContent: report }));
  side.append(
    el(
      'div',
      { className: 'mods' },
      'Wheel zooms. Drag empty space or use the right button to pan. Orange rings and lines are hand edits. Del removes the selection, Esc clears it, Ctrl+Z / Ctrl+Y undo and redo, Ctrl+S saves. Changing a node to a keystone gives it no keystone effect: those are tied to the keystone names.',
    ),
  );
  if (keep) {
    const again = side.querySelector<HTMLInputElement>(`[data-keep="${keep}"]`);
    again?.focus();
  }
}

/**
 * The lines of a node of the hand-written tree, each a vocabulary function and its arguments, with a row to add one.
 * A change rebuilds the node's mods (and a small node's name) at once.
 */
function lineEditor(n: TreeNode): HTMLElement {
  const box = el('div', { className: 'lines' });
  box.append(el('h3', { textContent: 'Lines' }));
  const specs = nodeLines[n.id] ?? [];
  const commit = (next: LineSpec[]) => {
    remember();
    setLines(n, next);
    touched();
  };
  specs.forEach((spec, i) => {
    const row = el('div', { className: 'row' });
    const fnSel = el('select');
    for (const fn of Object.keys(VOCAB))
      fnSel.append(el('option', { value: fn, textContent: fn, selected: fn === spec.fn }));
    fnSel.onchange = () => {
      const next = specs.map((x) => ({ ...x }));
      next[i] = defaultSpec(fnSel.value);
      commit(next);
    };
    row.append(fnSel);
    const kinds = VOCAB[spec.fn] ?? ['n'];
    kinds.forEach((kind, j) => {
      const set = (v: unknown) => {
        const next = specs.map((x) => ({ fn: x.fn, args: [...x.args] }));
        next[i].args[j] = v;
        commit(next);
      };
      if (kind === 'n') {
        const inp = el('input', { type: 'number', value: String(spec.args[j] ?? 0), step: 'any' });
        inp.onchange = () => set(Number(inp.value));
        row.append(inp);
      } else if (kind === 'tags?') {
        const inp = el('input', {
          type: 'text',
          value: ((spec.args[j] as string[] | undefined) ?? []).join(','),
          placeholder: 'tags',
        });
        inp.title =
          'Skill tags the line is limited to, comma-separated (bow, melee, spell...); empty for all.';
        inp.onchange = () =>
          set(
            inp.value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          );
        row.append(inp);
      } else {
        const sel = el('select');
        for (const c of CHOICES[kind])
          sel.append(el('option', { value: c, textContent: c, selected: c === spec.args[j] }));
        sel.onchange = () => set(sel.value);
        row.append(sel);
      }
    });
    row.append(btn('×', () => commit(specs.filter((_, k) => k !== i))));
    box.append(row);
  });
  const add = el('div', { className: 'row' });
  const addSel = el('select');
  for (const fn of Object.keys(VOCAB)) addSel.append(el('option', { value: fn, textContent: fn }));
  add.append(
    addSel,
    btn('add line', () => commit([...specs, defaultSpec(addSel.value)])),
  );
  box.append(add);
  return box;
}

function setKind(ids: number[], k: TreeNodeKind) {
  const todo = ids.filter((i) => !startIds.has(i) && byId.get(i)!.kind !== k);
  if (!todo.length) return;
  remember();
  for (const i of todo) byId.get(i)!.kind = k;
  touched();
}

new ResizeObserver(resize).observe(canvas);
refreshChanged();
resize();
panel();
