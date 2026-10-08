import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import { getTree, type TreeNode } from '../data/tree';
import { modsText } from '../mods/text';
import type { Controller } from '../run/controller';
import { passivePoints } from '../run/run';
import { allocate, canRemove, pathTo, refund } from '../run/tree';
import { hex } from './ClassSelect';
import { useViewport } from './device';
import {
  fitView,
  nearestNode,
  pinchView,
  zoomAt,
  type HitNode,
  type Pt,
  type View,
} from './treeHit';

const RADIUS: Record<TreeNode['kind'], number> = {
  start: 34,
  keystone: 30,
  notable: 22,
  small: 12,
  travel: 10,
  hub: 12,
};

/** On a coarse pointer a node is hit within this many screen pixels, however small it is drawn. */
const FINGER_PX = 22;
/** The view is never fitted to less than this scale, so a late-game tree still opens at a readable size. */
const FIT_MIN_K = 0.15;

export function TreeView({ c }: { c: Controller }) {
  const run = c.run!;
  const tree = getTree();
  const { coarse, layout } = useViewport();
  // A small screen gets the zoom buttons and a view fitted to the build; only a coarse pointer changes how taps work.
  const small = coarse || layout !== 'desktop';
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const start = tree.nodes[tree.starts[run.classId]];
  const view = useRef<View>({ x: 0, y: 0, k: 0.22 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(
    null,
  );
  const pointers = useRef(new Map<number, Pt>());
  const pinch = useRef<{ from: [Pt, Pt]; v: View } | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const [hover, setHover] = useState<{ id: number; mx: number; my: number } | null>(null);
  // On a coarse pointer the first tap on a node shows it (the dock below); the second tap or the button commits.
  const [picked, setPicked] = useState<number | null>(null);
  const points = passivePoints(run);
  const alloc = run.build.allocated;
  const allocSet = useMemo(() => new Set(alloc), [alloc]);
  const classColor = hex(classDef(run.classId).color);
  const hitNodes = useMemo<HitNode[]>(
    () => tree.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, r: RADIUS[n.kind] })),
    [tree],
  );

  const apply = () => {
    const v = view.current;
    gRef.current?.setAttribute('transform', `translate(${v.x} ${v.y}) scale(${v.k})`);
  };
  const local = (e: PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // Centre on the class start initially (on a small screen: fit the build and the ring around it).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    size.current = { w: r.width, h: r.height };
    if (!small) {
      view.current = { k: 0.22, x: r.width / 2 - start.x * 0.22, y: r.height / 2 - start.y * 0.22 };
    } else {
      const ids = [start.id, ...alloc];
      const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
      for (const id of ids) {
        const n = tree.nodes[id];
        box.minX = Math.min(box.minX, n.x);
        box.minY = Math.min(box.minY, n.y);
        box.maxX = Math.max(box.maxX, n.x);
        box.maxY = Math.max(box.maxY, n.y);
      }
      const fit = fitView(box, r.width, r.height, 450);
      const k = Math.max(FIT_MIN_K, fit.k);
      const cx = (box.minX + box.maxX) / 2;
      const cy = (box.minY + box.maxY) / 2;
      view.current = { k, x: r.width / 2 - cx * k, y: r.height / 2 - cy * k };
    }
    apply();
  }, [run.classId, small]);

  // Keep the centre of the view when the area changes (a rotation, the address bar, a window resize).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const r = svg.getBoundingClientRect();
      const old = size.current;
      if (old.w > 0) {
        view.current.x += (r.width - old.w) / 2;
        view.current.y += (r.height - old.h) / 2;
        apply();
      }
      size.current = { w: r.width, h: r.height };
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  const reachable = useMemo(() => {
    const s = new Set<number>();
    const from = [start.id, ...alloc];
    for (const id of from)
      for (const m of tree.nodes[id].links)
        if (!allocSet.has(m) && tree.nodes[m].kind !== 'start') s.add(m);
    return s;
  }, [alloc, run.classId]);

  // The static layer (edges + nodes) only changes when the allocation changes.
  const layer = useMemo(() => {
    const edges: preact.JSX.Element[] = [];
    for (const n of tree.nodes)
      for (const m of n.links) {
        if (m < n.id) continue;
        const o = tree.nodes[m];
        const on = (allocSet.has(n.id) || n.id === start.id) && (allocSet.has(m) || m === start.id);
        edges.push(
          <line
            key={`${n.id}-${m}`}
            x1={n.x}
            y1={n.y}
            x2={o.x}
            y2={o.y}
            class={on ? 'edge on' : 'edge'}
          />,
        );
      }
    const nodes = tree.nodes.map((n) => {
      const on = allocSet.has(n.id);
      const cls =
        n.kind === 'start'
          ? n.id === start.id
            ? 'node start mine'
            : 'node start'
          : `node ${n.kind}${on ? ' on' : reachable.has(n.id) ? ' can' : ''}`;
      return (
        <circle
          key={n.id}
          data-id={n.id}
          cx={n.x}
          cy={n.y}
          r={RADIUS[n.kind]}
          class={cls}
          style={n.id === start.id ? { fill: classColor } : undefined}
        />
      );
    });
    return (
      <g>
        <g>{edges}</g>
        <g>{nodes}</g>
      </g>
    );
  }, [allocSet, reachable]);

  // The node being looked at: the hovered one with a mouse, the tapped one with a finger.
  const focusId = coarse ? picked : (hover?.id ?? null);
  const hoverPath = useMemo(() => {
    if (focusId === null || allocSet.has(focusId)) return null;
    return pathTo(alloc, run.classId, focusId);
  }, [focusId, alloc]);

  const zoomBy = (f: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    view.current = zoomAt(view.current, f, r.width / 2, r.height / 2);
    apply();
  };
  const centre = () => {
    const r = svgRef.current!.getBoundingClientRect();
    const k = view.current.k;
    view.current = { k, x: r.width / 2 - start.x * k, y: r.height / 2 - start.y * k };
    apply();
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const r = svgRef.current!.getBoundingClientRect();
    view.current = zoomAt(
      view.current,
      Math.exp(-e.deltaY * 0.0015),
      e.clientX - r.left,
      e.clientY - r.top,
    );
    apply();
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const commit = (n: number) => {
    if (allocSet.has(n)) c.act((r) => refund(r, n));
    else c.act((r) => allocate(r, n));
  };

  const onDown = (e: PointerEvent) => {
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (coarse) {
      try {
        svgRef.current?.setPointerCapture(e.pointerId);
      } catch {
        /* a pointer that has already ended: nothing to capture */
      }
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { from: [a, b], v: { ...view.current } };
      drag.current = null;
      return;
    }
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      vx: view.current.x,
      vy: view.current.y,
      moved: false,
    };
  };
  const onMove = (e: PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, local(e));
    const pz = pinch.current;
    if (pz && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      view.current = pinchView(pz.v, pz.from, [a, b]);
      apply();
      return;
    }
    const d = drag.current;
    if (d && e.buttons) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > (coarse ? 10 : 4)) d.moved = true;
      view.current.x = d.vx + dx;
      view.current.y = d.vy + dy;
      apply();
      return;
    }
    if (coarse) return;
    const id = (e.target as Element).getAttribute?.('data-id');
    if (id !== null && id !== undefined) setHover({ id: Number(id), mx: e.clientX, my: e.clientY });
    else if (hover) setHover(null);
  };
  const onUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    drag.current = null;
    // A lifted finger after a pinch, or the end of a pan, is not a tap.
    if (!d || d.moved) return;
    if (coarse) {
      const p = local(e);
      const id = nearestNode(hitNodes, view.current, p.x, p.y, FINGER_PX);
      if (id === null) setPicked(null);
      else if (id === picked) commit(id);
      else setPicked(id);
      return;
    }
    const id = (e.target as Element).getAttribute?.('data-id');
    if (id === null || id === undefined) return;
    commit(Number(id));
  };
  const onCancel = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
  };

  const hn = focusId !== null ? tree.nodes[focusId] : null;
  const nodeText = (n: TreeNode) => (
    <>
      <div class={`tt-name ${n.kind}`}>
        {n.kind === 'start' ? classDef(n.classStart!).name : n.name}
      </div>
      {modsText(n.mods).map((l, i) => (
        <div key={i} class="tt-mod">
          {l}
        </div>
      ))}
    </>
  );
  const isOn = hn ? allocSet.has(hn.id) : false;
  const removable = hn && isOn ? canRemove(alloc, run.classId, hn.id) : false;
  return (
    <div class="tree-wrap">
      <div class="tree-bar">
        <span>
          Passive points: <b>{points}</b>
        </span>
        <span>
          Refund points: <b>{run.refundPoints}</b>
        </span>
        {small && (
          <span class="tree-zoom">
            <button class="btn small" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.4)}>
              −
            </button>
            <button class="btn small" aria-label="Zoom in" onClick={() => zoomBy(1.4)}>
              +
            </button>
            <button class="btn small" onClick={centre}>
              Centre
            </button>
          </span>
        )}
        <span class="muted tree-help">
          {coarse
            ? 'Drag to pan · pinch to zoom · tap a node to look, tap it again to allocate or refund'
            : 'Drag to pan · wheel to zoom · click to allocate or refund'}
        </span>
      </div>
      <svg
        ref={svgRef}
        class="tree"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <g ref={gRef}>
          {layer}
          {(hoverPath || (hn && isOn)) && (
            <g>
              {(hoverPath ?? [hn!.id]).map((id) => {
                const n = tree.nodes[id];
                return (
                  <circle key={id} cx={n.x} cy={n.y} r={RADIUS[n.kind] + 6} class="path-ring" />
                );
              })}
            </g>
          )}
        </g>
      </svg>
      {hn && hover && !coarse && (
        <div class="tooltip" style={{ left: hover.mx + 16, top: hover.my + 12 }}>
          {nodeText(hn)}
          {isOn ? (
            <div class="tt-hint">
              {removable
                ? run.refundPoints > 0
                  ? 'Click to refund (1 refund point)'
                  : 'No refund points'
                : 'Other passives depend on this one'}
            </div>
          ) : hoverPath ? (
            <div class="tt-hint">
              {hoverPath.length} point{hoverPath.length === 1 ? '' : 's'}
              {hoverPath.length > points ? ' — not enough points' : ' — click to allocate'}
            </div>
          ) : null}
        </div>
      )}
      {hn && coarse && (
        <div class="tree-dock">
          <button class="sheet-x tree-dock-x" aria-label="Close" onClick={() => setPicked(null)}>
            ×
          </button>
          {nodeText(hn)}
          {hn.kind === 'start' ? null : isOn ? (
            <>
              <div class="tt-hint">
                {removable
                  ? run.refundPoints > 0
                    ? 'Refunding costs 1 refund point.'
                    : 'No refund points left.'
                  : 'Other passives depend on this one.'}
              </div>
              <button
                class="btn small danger"
                disabled={!removable || run.refundPoints <= 0}
                onClick={() => commit(hn.id)}
              >
                Refund
              </button>
            </>
          ) : hoverPath ? (
            <>
              <div class="tt-hint">
                {hoverPath.length} point{hoverPath.length === 1 ? '' : 's'}
                {hoverPath.length > points ? ' — not enough points' : ''}
              </div>
              <button
                class="btn small primary"
                disabled={hoverPath.length > points}
                onClick={() => commit(hn.id)}
              >
                Allocate
              </button>
            </>
          ) : (
            <div class="tt-hint">Not connected to your passives yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
