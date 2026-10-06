import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import { getTree, type TreeNode } from '../data/tree';
import { modsText } from '../mods/text';
import type { Controller } from '../run/controller';
import { passivePoints } from '../run/run';
import { allocate, canRemove, pathTo, refund } from '../run/tree';
import { hex } from './ClassSelect';

const RADIUS: Record<TreeNode['kind'], number> = {
  start: 34,
  keystone: 30,
  notable: 22,
  small: 12,
  travel: 10,
  hub: 12,
};

type View = { x: number; y: number; k: number };

export function TreeView({ c }: { c: Controller }) {
  const run = c.run!;
  const tree = getTree();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const start = tree.nodes[tree.starts[run.classId]];
  const view = useRef<View>({ x: 0, y: 0, k: 0.22 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(
    null,
  );
  const [hover, setHover] = useState<{ id: number; mx: number; my: number } | null>(null);
  const points = passivePoints(run);
  const alloc = run.build.allocated;
  const allocSet = useMemo(() => new Set(alloc), [alloc]);
  const classColor = hex(classDef(run.classId).color);

  const apply = () => {
    const v = view.current;
    gRef.current?.setAttribute('transform', `translate(${v.x} ${v.y}) scale(${v.k})`);
  };

  // Centre on the class start initially.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    view.current = { k: 0.22, x: r.width / 2 - start.x * 0.22, y: r.height / 2 - start.y * 0.22 };
    apply();
  }, [run.classId]);

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

  const hoverPath = useMemo(() => {
    if (!hover || allocSet.has(hover.id)) return null;
    return pathTo(alloc, run.classId, hover.id);
  }, [hover?.id, alloc]);

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const v = view.current;
    const k2 = Math.max(0.05, Math.min(1.5, v.k * Math.exp(-e.deltaY * 0.0015)));
    v.x = mx - ((mx - v.x) * k2) / v.k;
    v.y = my - ((my - v.y) * k2) / v.k;
    v.k = k2;
    apply();
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const onDown = (e: PointerEvent) => {
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      vx: view.current.x,
      vy: view.current.y,
      moved: false,
    };
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (d && e.buttons) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      view.current.x = d.vx + dx;
      view.current.y = d.vy + dy;
      apply();
      return;
    }
    const id = (e.target as Element).getAttribute?.('data-id');
    if (id !== null && id !== undefined) setHover({ id: Number(id), mx: e.clientX, my: e.clientY });
    else if (hover) setHover(null);
  };
  const onUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) return;
    const id = (e.target as Element).getAttribute?.('data-id');
    if (id === null || id === undefined) return;
    const n = Number(id);
    if (allocSet.has(n)) c.act((r) => refund(r, n));
    else c.act((r) => allocate(r, n));
  };

  const hn = hover ? tree.nodes[hover.id] : null;
  return (
    <div class="tree-wrap">
      <div class="tree-bar">
        <span>
          Passive points: <b>{points}</b>
        </span>
        <span>
          Refund points: <b>{run.refundPoints}</b>
        </span>
        <span class="muted">Drag to pan · wheel to zoom · click to allocate or refund</span>
      </div>
      <svg
        ref={svgRef}
        class="tree"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <g ref={gRef}>
          {layer}
          {hoverPath && (
            <g>
              {hoverPath.map((id) => {
                const n = tree.nodes[id];
                return (
                  <circle key={id} cx={n.x} cy={n.y} r={RADIUS[n.kind] + 6} class="path-ring" />
                );
              })}
            </g>
          )}
        </g>
      </svg>
      {hn && hover && (
        <div class="tooltip" style={{ left: hover.mx + 16, top: hover.my + 12 }}>
          <div class={`tt-name ${hn.kind}`}>
            {hn.kind === 'start' ? classDef(hn.classStart!).name : hn.name}
          </div>
          {modsText(hn.mods).map((l, i) => (
            <div key={i} class="tt-mod">
              {l}
            </div>
          ))}
          {allocSet.has(hn.id) ? (
            <div class="tt-hint">
              {canRemove(alloc, run.classId, hn.id)
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
    </div>
  );
}
