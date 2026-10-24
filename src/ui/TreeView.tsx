import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import { getTree, isLive, type TreeNode } from '../data/tree';
import { modsText } from '../mods/text';
import type { Mod } from '../mods/types';
import type { Controller } from '../run/controller';
import { passivePoints } from '../run/run';
import { allocate, canRemove, pathTo, refund } from '../run/tree';
import { useViewport } from './device';
import { infoProps } from './info';
import { searchMatches } from './treeSearch';
import {
  fitView,
  nearestNode,
  pinchView,
  zoomAt,
  type HitNode,
  type Pt,
  type View,
} from './treeHit';
import { NODE_RADIUS, TONE_LABEL, toneOf, type Tone } from './treeStyle';
import { P } from './leaf/ramps';
import {
  clearWidths,
  drawVault,
  BoxGrid,
  diam,
  placeLabels,
  skyUrl,
  wrapTo,
  type Drawn,
  type Edge,
  type NodeState,
  textWidth,
  type Want,
} from './leaf/vault';
import { edgePath } from './treeStyle';

/** On a coarse pointer a node is hit within this many screen pixels, however small it is drawn; a mouse within this. */
const FINGER_PX = 22;
const MOUSE_PX = 9;
/** The view is never fitted to less than this scale, so a late-game tree still opens at a readable size. */
const FIT_MIN_K = 0.15;

const F_NOTE = "600 15px Grenze, 'Palatino Linotype', Georgia, serif";
const F_SMALL = "400 15px Grenze, 'Palatino Linotype', Georgia, serif";
const F_KEY = "400 21px 'Jacquard 24', 'Palatino Linotype', Georgia, serif";
/** The line heights of the words (tree.css says the same). */
const H_LINE = 18;
const H_KEY = 23;
/** From this zoom on, a run of alike small nodes shows each node's own word instead of one word for the run. */
const K_SPLIT = 0.8;
/** The most alike small nodes one word stands for; a longer run gets a word for each chunk of neighbours. */
const MAX_RUN = 4;
/** The widest a word on the tree may be before it wraps, in pixels. */
const WRAP = 240;

/** A stat line shortened for the words beside small nodes ("+6 Dex"); the panel always has the whole line. */
const SHORT: [RegExp, string | ((...m: string[]) => string)][] = [
  [/^\+(\d+) to Strength$/, '+$1 Str'],
  [/^\+(\d+) to Dexterity$/, '+$1 Dex'],
  [/^\+(\d+) to Intelligence$/, '+$1 Int'],
  [/^\+(\d+) to all Attributes$/, '+$1 all attributes'],
  [/^\+(\d+) to maximum (Life|Mana|Energy Shield)$/, (_m, a, b) => `+${a} ${b.toLowerCase()}`],
  [/^\+(\d+)% to (\w+) Resistance$/, (_m, a, b) => `+${a}% ${b.toLowerCase()} res`],
  [
    /^(\d+(?:\.\d+)?)% increased (.*)$/,
    (_m, a, b) => `+${a}% ${b.replace(/ Rating$/, '').toLowerCase()}`,
  ],
  [/^(\d+(?:\.\d+)?)% reduced (.*)$/, (_m, a, b) => `−${a}% ${b.toLowerCase()}`],
];
function short(line: string): string {
  for (const [re, to] of SHORT)
    if (re.test(line))
      return typeof to === 'string' ? line.replace(re, to) : line.replace(re, to as never);
  return line.length > 40 ? line.slice(0, 38) + '…' : line;
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Mods that differ only in value, summed, then written out: what the passives give in all. */
function totals(nodes: TreeNode[]): string[] {
  const sum = new Map<string, Mod>();
  for (const n of nodes)
    for (const m of n.mods) {
      const { value, source: _source, ...rest } = m;
      const key = JSON.stringify(rest);
      const had = sum.get(key);
      if (had) had.value += value;
      else sum.set(key, { ...m, value });
    }
  return modsText([...sum.values()]);
}

/**
 * The passive tree as a starry vault (docs/mockups/style/STYLE-GUIDE.md sections 8 and 10). Tap a node to look at it
 * (the panel shows it, the path to it and what is on the way), tap it again or press Take to take it, on a desktop too;
 * a taken one is refunded the same way. The panel also keeps what the passives give in all; the search lights what
 * matches, a colour group's name included.
 */
export function TreeView({ c }: { c: Controller }) {
  const run = c.run!;
  const tree = getTree();
  const { coarse, layout } = useViewport();
  const phone = layout === 'phone';
  const wrapRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLCanvasElement | null>(null);
  const view = useRef<View>({ x: 0, y: 0, k: 0.3 });
  const size = useRef({ W: 0, H: 0 });
  const [picked, setPicked] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [matchAt, setMatchAt] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [sumOpen, setSumOpen] = useState(false);

  const start = tree.nodes[tree.starts[run.classId]];
  const live = useMemo(() => tree.nodes.filter(isLive), [tree]);
  const tones = useMemo(
    () => tree.nodes.map((n) => (n.kind === 'start' ? 'start' : toneOf(n)) as Tone | 'start'),
    [tree],
  );
  const lines = useMemo(() => tree.nodes.map((n) => (isLive(n) ? modsText(n.mods) : [])), [tree]);
  const edges = useMemo<Edge[]>(() => {
    const out: Edge[] = [];
    for (const n of live)
      for (const m of n.links)
        if (m > n.id && isLive(tree.nodes[m]))
          out.push({ a: n.id, b: m, path: new Path2D(edgePath(n, tree.nodes[m])) });
    return out;
  }, [tree]);
  // Runs of small nodes that say the same thing get one word between them ("+6 Dex, +6 Int ×3").
  const runs = useMemo(() => {
    const text = (id: number) => lines[id].map(short).join(', ');
    const small = (n: TreeNode) => n.kind === 'small' || n.kind === 'travel';
    const seen = new Set<number>();
    const out: { ids: number[]; anchor: number; text: string; one: string }[] = [];
    // The usual length of a link between small nodes: a chunk keeps within a couple of them of its first node.
    const lengths: number[] = [];
    for (const n of live)
      if (small(n))
        for (const m of n.links)
          if (m > n.id && small(tree.nodes[m]))
            lengths.push(Math.hypot(tree.nodes[m].x - n.x, tree.nodes[m].y - n.y));
    lengths.sort((a, b) => a - b);
    const reach = 2.2 * (lengths[Math.floor(lengths.length / 2)] ?? 1);
    for (const n of live) {
      if (seen.has(n.id) || !small(n) || !text(n.id)) continue;
      const t = text(n.id);
      const ids: number[] = [];
      const q = [n.id];
      seen.add(n.id);
      while (q.length) {
        const id = q.pop()!;
        ids.push(id);
        for (const m of tree.nodes[id].links) {
          const o = tree.nodes[m];
          if (!seen.has(m) && isLive(o) && small(o) && text(m) === t) {
            seen.add(m);
            q.push(m);
          }
        }
      }
      // A long run (a road of alike travel nodes) is cut into short chunks of near neighbours, each with its own word
      // near it: one word with lines to dozens of nodes across the tree reads as a tangle.
      const left = new Set(ids);
      for (const first of ids) {
        if (!left.has(first)) continue;
        const chunk = [first];
        left.delete(first);
        for (let k = 0; k < chunk.length && chunk.length < MAX_RUN; k++)
          for (const m of tree.nodes[chunk[k]].links)
            if (
              left.has(m) &&
              chunk.length < MAX_RUN &&
              Math.hypot(
                tree.nodes[m].x - tree.nodes[first].x,
                tree.nodes[m].y - tree.nodes[first].y,
              ) <= reach
            ) {
              chunk.push(m);
              left.delete(m);
            }
        const cx = chunk.reduce((a, id) => a + tree.nodes[id].x, 0) / chunk.length;
        const cy = chunk.reduce((a, id) => a + tree.nodes[id].y, 0) / chunk.length;
        chunk.sort(
          (a, b) =>
            Math.hypot(tree.nodes[a].x - cx, tree.nodes[a].y - cy) -
            Math.hypot(tree.nodes[b].x - cx, tree.nodes[b].y - cy),
        );
        out.push({
          ids: chunk,
          anchor: chunk[0],
          text: chunk.length > 1 ? `${t} ×${chunk.length}` : t,
          one: t,
        });
      }
    }
    return out;
  }, [tree]);
  // What a search reads: a node's name, its lines, and the name of its colour group ("Minions and deployables").
  const groupName = useMemo(() => new Map(TONE_LABEL.map(([t, l]) => [t, l])), []);
  const texts = useMemo(
    () =>
      tree.nodes.map((n, i) =>
        isLive(n)
          ? `${n.name} ${lines[i].join(' ')} ${groupName.get(tones[i] as Tone) ?? ''}`.toLowerCase()
          : '',
      ),
    [tree],
  );
  const matchList = useMemo(
    () => searchMatches(query, texts, (i) => tree.nodes[i].kind === 'start'),
    [query, texts],
  );
  const matches = useMemo(
    () => (query.trim().length >= 2 ? new Set(matchList) : null),
    [matchList, query],
  );
  const hitNodes = useMemo<HitNode[]>(
    () => live.map((n) => ({ id: n.id, x: n.x, y: n.y, r: NODE_RADIUS[n.kind] })),
    [tree],
  );

  const points = passivePoints(run);
  const alloc = run.build.allocated;
  const allocSet = useMemo(() => new Set(alloc), [alloc]);
  const taken = (id: number) => allocSet.has(id) || id === start.id;
  const reachable = useMemo(() => {
    const s = new Set<number>();
    for (const id of [start.id, ...alloc])
      for (const m of tree.nodes[id].links)
        if (!allocSet.has(m) && tree.nodes[m].kind !== 'start') s.add(m);
    return s;
  }, [alloc, run.classId]);
  const looking = hover ?? picked;
  const path = useMemo(
    () =>
      looking !== null && !allocSet.has(looking)
        ? new Set(pathTo(alloc, run.classId, looking) ?? [])
        : null,
    [looking, alloc],
  );
  const state = (id: number): NodeState => {
    const n = tree.nodes[id];
    if (n.kind === 'start') return id === start.id ? 'on' : 'off';
    if (allocSet.has(id)) return 'on';
    if (path?.has(id)) return 'path';
    if (matches) return matches.has(id) ? 'lit' : 'dim';
    return reachable.has(id) ? 'can' : 'off';
  };

  // ---- Drawing: the nodes and lines on the canvas, then the words where they fit ----
  const queued = useRef(false);
  const latest = useRef<() => void>(() => {});
  latest.current = () => {
    const art = artRef.current;
    const wrap = wrapRef.current;
    if (!art || !wrap || !linesRef.current) return;
    const ctx = art.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    drawVault(ctx, linesRef.current, {
      nodes: live,
      edges,
      tone: (id) => tones[id],
      state,
      taken,
      path,
      view: view.current,
      sel: picked,
    });
    words();
  };
  const draw = () => {
    if (queued.current) return;
    queued.current = true;
    requestAnimationFrame(() => {
      queued.current = false;
      latest.current();
    });
  };
  // The words are laid out over the whole tree, in the view's pixels with the camera at 0, whenever the zoom or what
  // they say changes; panning only moves their layer the way the canvas moves the nodes. A word never comes or goes
  // because its node crossed the edge of the view.
  const wordsKey = useRef<unknown[]>([]);
  const words = () => {
    const el = labelsRef.current;
    if (!el) return;
    const { k, x, y } = view.current;
    el.style.transform = `translate(${Math.round(x / P) * P}px, ${Math.round(y / P) * P}px)`;
    const key = [k, allocSet, path, picked, matches, phone, runs, live];
    const was = wordsKey.current;
    if (key.length === was.length && key.every((v, i) => v === was[i])) return;
    wordsKey.current = key;
    el.innerHTML = layoutWords(k);
  };
  const layoutWords = (k: number): string => {
    const s = k / P;
    const all: Drawn[] = live.map((n) => ({
      n,
      x: Math.round(n.x * s),
      y: Math.round(n.y * s),
      d: diam(n.kind, k),
      st: state(n.id),
    }));
    // The big nodes are in the way of words.
    const taken = new BoxGrid();
    for (const v of all)
      if (v.d >= 8) {
        const r = (v.d / 2 + 2) * P;
        taken.add({ x: v.x * P - r, y: v.y * P - r, w: 2 * r, h: 2 * r });
      }
    const want: Want[] = [];
    const byId = new Map(all.map((v) => [v.n.id, v]));
    const pri = (v: Drawn) =>
      v.n.id === picked
        ? 0
        : v.st === 'path'
          ? 1
          : v.st === 'lit'
            ? 2
            : v.st === 'on'
              ? 3
              : v.st === 'can'
                ? 4
                : 5;
    for (const v of all) {
      const n = v.n;
      if (n.kind === 'start')
        want.push({
          v,
          text: classDef(n.classStart!).name,
          cls: 'tv-key',
          font: F_KEY,
          h: H_KEY,
          p: -1,
        });
      else if (n.kind === 'keystone' && k >= 0.1)
        want.push({ v, text: n.name, cls: 'tv-key', font: F_KEY, h: H_KEY, p: pri(v) });
      else if (n.kind === 'notable' && k >= 0.16)
        want.push({
          v,
          text: n.name,
          cls: `tv-note ${v.st}`,
          font: F_NOTE,
          h: H_LINE,
          p: pri(v) + 0.5,
        });
    }
    // Zoomed far in, every small node says its own lines; further out, a run of alike ones shares one word ("×3").
    const nodeSt = (id: number) =>
      allocSet.has(id) ? 'on' : path?.has(id) ? 'path' : matches && !matches.has(id) ? 'dim' : '';
    const smallP = (st: string) => (st === 'path' ? 1 : st === 'on' ? 3.6 : 6);
    if (k >= 0.26)
      for (const r of runs) {
        if (k >= K_SPLIT || r.ids.length === 1) {
          for (const id of r.ids) {
            const v = byId.get(id);
            if (!v) continue;
            const st = nodeSt(id);
            want.push({
              v,
              text: r.one,
              cls: `tv-small ${st}`,
              font: F_SMALL,
              h: H_LINE,
              p: smallP(st) + id * 1e-7,
            });
          }
          continue;
        }
        const v = byId.get(r.anchor);
        if (!v) continue;
        const st = r.ids.some((id) => allocSet.has(id))
          ? 'on'
          : r.ids.some((id) => path?.has(id))
            ? 'path'
            : matches && !r.ids.some((id) => matches.has(id))
              ? 'dim'
              : '';
        want.push({
          v,
          text: r.text,
          cls: `tv-small ${st}`,
          font: F_SMALL,
          h: H_LINE,
          // A fixed order among equals (not the distance from the middle of the view, which panning changes).
          p: smallP(st) + r.anchor * 1e-7,
          group: r.ids.flatMap((id) => {
            const g = byId.get(id);
            return g ? [{ x: g.x * P, y: g.y * P, r: (g.d / 2 + 0.5) * P }] : [];
          }),
        });
      }
    // Long words wrap: a node with several stats reads as a short paragraph, not a line across the view.
    for (const w of want) w.lines = wrapTo(w.text, w.font, WRAP);
    const placed = placeLabels(want, taken);
    const out = placed.map(
      (b) =>
        `<span class="${b.want.cls}" style="left:${Math.round(b.x)}px;top:${Math.round(b.y)}px">${(b.want.lines ?? [b.want.text]).map(esc).join('<br>')}</span>`,
    );
    // A word for several nodes has a thin line to each of them, fanned out from the middle of its facing edge.
    const leaders: string[] = [];
    for (const b of placed) {
      const tip = b.tip;
      if (!tip || !b.want.group) continue;
      for (const g of b.want.group) {
        const len = Math.hypot(tip.x - g.x, tip.y - g.y);
        if (len <= g.r + 2) continue;
        const sx = g.x + ((tip.x - g.x) / len) * g.r;
        const sy = g.y + ((tip.y - g.y) / len) * g.r;
        leaders.push(
          `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tip.x.toFixed(1)}" y2="${tip.y.toFixed(1)}" class="${b.want.cls}" />`,
        );
      }
    }
    // The areas' names, large and faint when zoomed out, wherever the node names left room.
    const alpha = k <= 0.14 ? 1 : k >= 0.3 ? 0 : 1 - (k - 0.14) / 0.16;
    if (alpha > 0) {
      const px = phone ? 32 : 48;
      for (const a of tree.areas ?? []) {
        const ax = Math.round(a.x * k);
        const ay = Math.round(a.y * k);
        const tw = placeWidth(a.name, px);
        const b = { x: ax - tw / 2, y: ay - px / 2, w: tw, h: px };
        if (taken.hits(b)) continue;
        taken.add(b);
        out.push(
          `<span class="tv-area" style="left:${ax}px;top:${ay}px;opacity:${(alpha * 0.85).toFixed(2)}">${esc(a.name)}</span>`,
        );
      }
    }
    return `<svg class="tv-leaders">${leaders.join('')}</svg>${out.join('')}`;
  };
  const placeWidth = (t: string, px: number) =>
    textWidth(t, `400 ${px}px 'Jacquard 24', Georgia, serif`);

  // ---- Size: the canvas at half the box, the sky painted for it ----
  const fit = () => {
    const wrap = wrapRef.current;
    const art = artRef.current;
    if (!wrap || !art) return;
    const W = Math.round(wrap.clientWidth);
    const H = Math.round(wrap.clientHeight);
    if (!W || !H) return;
    const old = size.current;
    size.current = { W, H };
    const w = Math.ceil(W / P);
    const h = Math.ceil(H / P);
    art.width = w;
    art.height = h;
    art.style.width = `${w * P}px`;
    art.style.height = `${h * P}px`;
    if (!linesRef.current) linesRef.current = document.createElement('canvas');
    linesRef.current.width = w;
    linesRef.current.height = h;
    const sky = wrap.querySelector<HTMLElement>('.tv-sky');
    if (sky) sky.style.background = `url(${skyUrl(w, h)}) 0 0 / ${w * P}px ${h * P}px`;
    // Keep the centre of the view when the box changes (a rotation, a resize).
    if (old.W > 0) {
      view.current.x += (W - old.W) / 2;
      view.current.y += (H - old.H) / 2;
    }
    draw();
  };
  // Open on the build and the ring around it.
  const home = () => {
    const { W, H } = size.current;
    const ids = [start.id, ...alloc];
    const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const id of ids) {
      const n = tree.nodes[id];
      box.minX = Math.min(box.minX, n.x);
      box.minY = Math.min(box.minY, n.y);
      box.maxX = Math.max(box.maxX, n.x);
      box.maxY = Math.max(box.maxY, n.y);
    }
    // The panel at the right takes its share of the sky: fit the build into what is left.
    const panel = phone
      ? 0
      : (wrapRef.current?.querySelector<HTMLElement>('.tv-ledger')?.offsetWidth ?? 0) + 16;
    const room = Math.max(200, W - panel);
    const k = Math.min(0.42, Math.max(FIT_MIN_K, fitView(box, room, H, 450).k));
    const cx = (box.minX + box.maxX) / 2;
    const cy = (box.minY + box.maxY) / 2;
    view.current = { k, x: room / 2 - cx * k, y: H / 2 - cy * k };
    draw();
  };
  useEffect(() => {
    fit();
    home();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (wrap.clientWidth !== size.current.W || wrap.clientHeight !== size.current.H) fit();
    });
    ro.observe(wrap);
    document.fonts?.ready.then(() => {
      clearWidths();
      draw();
    });
    return () => ro.disconnect();
  }, [run.classId]);
  useEffect(draw, [allocSet, picked, hover, matches, phone, sumOpen, showAll]);

  // ---- Moving about and picking ----
  const pointers = useRef(new Map<number, Pt>());
  const pinch = useRef<{ from: [Pt, Pt]; v: View } | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(
    null,
  );
  const local = (e: PointerEvent): Pt => {
    const r = artRef.current!.getBoundingClientRect();
    const sc = r.width / (artRef.current!.width * P) || 1;
    return { x: (e.clientX - r.left) / sc, y: (e.clientY - r.top) / sc };
  };
  const commit = (n: number) => {
    if (allocSet.has(n)) c.act((r) => refund(r, n));
    else c.act((r) => allocate(r, n));
  };
  const onDown = (e: PointerEvent) => {
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    try {
      artRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* a pointer that has already ended: nothing to capture */
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { from: [a, b], v: { ...view.current } };
      drag.current = null;
      return;
    }
    drag.current = { x: p.x, y: p.y, vx: view.current.x, vy: view.current.y, moved: false };
  };
  const onMove = (e: PointerEvent) => {
    const p = local(e);
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, p);
    const pz = pinch.current;
    if (pz && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      view.current = pinchView(pz.v, pz.from, [a, b]);
      draw();
      return;
    }
    const d = drag.current;
    if (d && e.buttons) {
      const dx = p.x - d.x;
      const dy = p.y - d.y;
      if (Math.abs(dx) + Math.abs(dy) > (coarse ? 10 : 5)) d.moved = true;
      if (d.moved) {
        view.current.x = d.vx + dx;
        view.current.y = d.vy + dy;
        draw();
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const id = nearestNode(hitNodes, view.current, p.x, p.y, MOUSE_PX);
    if (id !== hover) setHover(id);
    if (artRef.current) artRef.current.style.cursor = id !== null ? 'pointer' : 'grab';
  };
  const onUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    const p = local(e);
    const id = nearestNode(
      hitNodes,
      view.current,
      p.x,
      p.y,
      e.pointerType === 'mouse' ? MOUSE_PX : FINGER_PX,
    );
    // Tap to look; tap the same node again to take it (or refund it).
    if (id === null) {
      setPicked(null);
      setSumOpen(false);
    } else if (id === picked) {
      if (tree.nodes[id].kind !== 'start') commit(id);
    } else setPicked(id);
  };
  const onCancel = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
  };
  useEffect(() => {
    const art = artRef.current;
    if (!art) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e as unknown as PointerEvent);
      view.current = zoomAt(view.current, Math.exp(-e.deltaY * 0.0015), p.x, p.y);
      draw();
    };
    art.addEventListener('wheel', onWheel, { passive: false });
    return () => art.removeEventListener('wheel', onWheel);
  }, []);
  const zoomBy = (f: number) => {
    const { W, H } = size.current;
    view.current = zoomAt(view.current, f, W / 2, H / 2);
    draw();
  };
  /** Bring the next match to the middle of the view. */
  const nextMatch = () => {
    if (!matchList.length) return;
    const n = tree.nodes[matchList[matchAt % matchList.length]];
    setMatchAt(matchAt + 1);
    setPicked(n.id);
    const { W, H } = size.current;
    const k = Math.max(view.current.k, 0.4);
    view.current = { k, x: W / 2 - n.x * k, y: H / 2 - n.y * k };
    draw();
  };

  // ---- The panel ----
  const n = picked !== null ? tree.nodes[picked] : null;
  let look = null;
  if (n) {
    const kindName =
      n.kind === 'notable'
        ? 'Notable'
        : n.kind === 'keystone'
          ? 'Keystone'
          : n.kind === 'start'
            ? 'Start'
            : 'Passive';
    const on = allocSet.has(n.id);
    let act: preact.JSX.Element;
    if (n.kind === 'start')
      act = <p class="tv-why">Where the {classDef(n.classStart!).name} begins.</p>;
    else if (on) {
      const removable = canRemove(alloc, run.classId, n.id);
      act = !removable ? (
        <p class="tv-why">Other passives hang from this one.</p>
      ) : run.refundPoints > 0 ? (
        <>
          <button class="btn danger" onClick={() => commit(n.id)}>
            Refund · 1 refund point
          </button>
          <p class="tv-why">Or tap it again.</p>
        </>
      ) : (
        <p class="tv-why">No refund points left.</p>
      );
    } else {
      const p = pathTo(alloc, run.classId, n.id);
      if (!p) act = <p class="tv-why">Not connected to your passives yet.</p>;
      else {
        const way = totals(p.slice(0, -1).map((id) => tree.nodes[id]));
        act = (
          <>
            {way.length > 0 && (
              <div class="tv-way">
                <span class="muted">On the way ({p.length - 1}):</span> {way.join(', ')}
              </div>
            )}
            <button class="btn primary" disabled={p.length > points} onClick={() => commit(n.id)}>
              Take · {p.length} point{p.length === 1 ? '' : 's'}
            </button>
            <p class="tv-why">
              {p.length <= points
                ? 'Or tap it again.'
                : points > 0
                  ? `You have ${points}.`
                  : 'You have none to spend.'}
            </p>
          </>
        );
      }
    }
    look = (
      <section class="tv-look">
        <div class="tv-lookhead">
          <span class="tv-name">
            {n.kind === 'start'
              ? classDef(n.classStart!).name
              : n.name || lines[n.id].map(short).join(', ')}
          </span>
          <button class="btn small tv-x" aria-label="Close" onClick={() => setPicked(null)}>
            ×
          </button>
        </div>
        <div class="muted">{kindName}</div>
        <ul class="tv-lines">
          {lines[n.id].map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <div class="tv-act">{act}</div>
      </section>
    );
  }
  const all = useMemo(() => totals(alloc.map((id) => tree.nodes[id])), [alloc]);
  const shown = showAll ? all : all.slice(0, 12);
  const ledgerOpen = !phone || picked !== null || sumOpen;
  return (
    <div class="tv" ref={wrapRef}>
      <div class="tv-sky" />
      <canvas
        ref={artRef}
        class="tv-art"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onPointerLeave={() => hover !== null && setHover(null)}
      />
      {/* The words move as one layer (tv-words); the still layer around it clips them inside the sky's rim. */}
      <div class="tv-labels" data-nopaint aria-hidden="true">
        <div class="tv-words" ref={labelsRef} />
      </div>
      <div class="tv-hud">
        {/* The points to spend; more taken than earned (a changed tree) reads as how many to refund. */}
        <div
          class="tv-points"
          data-paint="medal"
          data-field={points < 0 ? 'vermilion,4' : 'azure,2'}
          data-medal="stars"
          data-pk={points < 0 ? 'over' : 'ok'}
        >
          <span>{points < 0 ? 'Too many' : 'Points'}</span>
          <b>{Math.abs(points)}</b>
          <i
            class="tv-refunds"
            data-paint="panel"
            data-thin
            data-field={points < 0 ? 'vermilion' : 'lapis'}
            data-pk={points < 0 ? 'over' : 'ok'}
          >
            {points < 0
              ? `Refund ${-points}`
              : run.refundPoints > 0
                ? `${run.refundPoints} refund${run.refundPoints === 1 ? '' : 's'}`
                : 'No refunds'}
          </i>
        </div>
        <div class="tv-find">
          <input
            type="search"
            placeholder="Find: mana, fire, spell crit…"
            aria-label="Find passives"
            value={query}
            onInput={(e) => {
              setQuery((e.target as HTMLInputElement).value);
              setMatchAt(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') nextMatch();
            }}
          />
          {matches && (
            <span class="tv-count" data-paint="panel" data-thin>
              {matchList.length} found
            </span>
          )}
          {matches && matchList.length > 0 && (
            <button class="btn small" onClick={nextMatch}>
              Next
            </button>
          )}
        </div>
        <div class="tv-zoom">
          <button class="btn small" aria-label="Zoom in" onClick={() => zoomBy(1.4)}>
            +
          </button>
          <button class="btn small" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.4)}>
            −
          </button>
          <button
            class="btn small"
            aria-label="Centre on your passives"
            {...infoProps('Centre on your passives')}
            onClick={home}
          >
            <span class="tv-home" />
          </button>
        </div>
        {phone && (
          <button class="btn small tv-sumbtn" onClick={() => setSumOpen(!sumOpen)}>
            {sumOpen ? 'Hide totals' : 'Your passives'}
          </button>
        )}
      </div>
      {ledgerOpen && (
        <aside class={'tv-ledger' + (phone && picked === null ? ' sum' : '')} data-paint="panel">
          {look}
          {(!phone || (sumOpen && picked === null)) && (
            <section class="tv-sum">
              <h4 class="lf-h">Your passives</h4>
              {all.length === 0 ? (
                <p class="tv-why">None taken yet.</p>
              ) : (
                <ul class="tv-lines">
                  {shown.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              )}
              {all.length > 12 && (
                <button class="btn small" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Fewer' : `All ${all.length}`}
                </button>
              )}
            </section>
          )}
        </aside>
      )}
    </div>
  );
}
