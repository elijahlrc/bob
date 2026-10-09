import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { classDef } from '../data/classes';
import { getTree, type TreeNode } from '../data/tree';
import { HUB_RADIUS, REGIONS, RING_START, RING_STEP, START_RADIUS } from '../data/tree/spec';
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
import {
  LABEL_K_KEYSTONE,
  LABEL_K_NOTABLE,
  NODE_RADIUS,
  edgePath,
  octagon,
  shapeScale,
  TONE_COLOR,
  TONE_GLYPH,
  TONE_LABEL,
  toneOf,
} from './treeStyle';

/** On a coarse pointer a node is hit within this many screen pixels, however small it is drawn. */
const FINGER_PX = 22;
/** The view is never fitted to less than this scale, so a late-game tree still opens at a readable size. */
const FIT_MIN_K = 0.15;

const ATTR_WORD = { str: 'Strength', dex: 'Dexterity', int: 'Intelligence' } as const;
/** The outer edge of a notable's and a keystone's frame, in tree units (labels sit below it). */
const FRAME_R = { notable: 30, keystone: 47, start: 42 } as const;
const KINDS = ['small', 'travel', 'hub', 'notable', 'keystone', 'start'] as const;

/** Where a node is, how large it is drawn at this zoom (the --s-* variables of the svg) and what colour it has. */
function nodeStyle(n: TreeNode, tone: string): string {
  return `--t:${tone};transform:translate(${n.x}px,${n.y}px) scale(var(--s-${n.kind},1))`;
}

/** The mix of the attribute colours a region stands for. */
function regionColor(attrs: readonly ('str' | 'dex' | 'int')[]): string {
  const rgb = attrs.map((a) => {
    const h = TONE_COLOR[a];
    return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  });
  const mix = [0, 1, 2].map((i) => Math.round(rgb.reduce((s, c) => s + c[i], 0) / rgb.length));
  return `rgb(${mix.join(',')})`;
}

/** The map behind the tree: a tinted wedge per region, rings, the rim and the names of the regions. */
function Backdrop({ maxR }: { maxR: number }) {
  const R = maxR + 260;
  const rings: number[] = [HUB_RADIUS, START_RADIUS];
  for (let r = RING_START; r < maxR + RING_STEP / 2; r += RING_STEP) rings.push(r);
  const pt = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
  };
  return (
    <g class="backdrop">
      <defs>
        {REGIONS.map((reg) => (
          <radialGradient
            key={reg.id}
            id={`tg-${reg.id}`}
            gradientUnits="userSpaceOnUse"
            cx="0"
            cy="0"
            r={R}
          >
            <stop offset="0" stop-color={regionColor(reg.attrs)} stop-opacity="0" />
            <stop offset="0.18" stop-color={regionColor(reg.attrs)} stop-opacity="0.07" />
            <stop offset="0.6" stop-color={regionColor(reg.attrs)} stop-opacity="0.14" />
            <stop offset="1" stop-color={regionColor(reg.attrs)} stop-opacity="0.26" />
          </radialGradient>
        ))}
      </defs>
      {REGIONS.map((reg) => (
        <path
          key={reg.id}
          d={`M0 0 L${pt(R, reg.angle - 30)} A${R} ${R} 0 0 1 ${pt(R, reg.angle + 30)} Z`}
          fill={`url(#tg-${reg.id})`}
        />
      ))}
      {REGIONS.map((reg) => (
        <line
          key={reg.id}
          class="bd-div"
          x1="0"
          y1="0"
          x2={R * Math.cos(((reg.angle - 30) * Math.PI) / 180)}
          y2={R * Math.sin(((reg.angle - 30) * Math.PI) / 180)}
        />
      ))}
      {rings.map((r) => (
        <circle key={r} class="bd-ring" r={r} />
      ))}
      <circle class="bd-rim" r={maxR + 120} />
      <circle class="bd-rim thin" r={maxR + 170} />
      {REGIONS.map((reg) => {
        const a = (reg.angle * Math.PI) / 180;
        const r = maxR + 420;
        return (
          <text
            key={reg.id}
            class="bd-name"
            x={r * Math.cos(a)}
            y={r * Math.sin(a)}
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {reg.attrs.map((x) => ATTR_WORD[x]).join(' · ')}
          </text>
        );
      })}
    </g>
  );
}

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
    () => tree.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, r: NODE_RADIUS[n.kind] })),
    [tree],
  );
  const toneIds = useMemo(() => tree.nodes.map(toneOf), [tree]);
  const tones = useMemo(() => toneIds.map((t) => TONE_COLOR[t]), [toneIds]);
  const maxR = useMemo(() => Math.max(...tree.nodes.map((n) => Math.hypot(n.x, n.y))), [tree]);

  /** Position the tree and set what depends on the zoom: how large each kind of shape is drawn and the labels. */
  const apply = () => {
    const v = view.current;
    gRef.current?.setAttribute('transform', `translate(${v.x} ${v.y}) scale(${v.k})`);
    const svg = svgRef.current;
    if (!svg) return;
    const s = svg.style;
    for (const kind of KINDS) {
      const sc = shapeScale(kind, v.k);
      s.setProperty(`--s-${kind}`, sc.toFixed(3));
      if (kind === 'notable' || kind === 'keystone' || kind === 'start')
        s.setProperty(`--lo-${kind}`, `${((FRAME_R[kind] * sc * v.k + 13) / v.k).toFixed(1)}px`);
    }
    s.setProperty('--fs', `${(13 / v.k).toFixed(1)}px`);
    s.setProperty('--fs-s', `${(11 / v.k).toFixed(1)}px`);
    s.setProperty('--fs-b', `${(15 / v.k).toFixed(1)}px`);
    s.setProperty('--sw', `${(3.2 / v.k).toFixed(1)}px`);
    svg.classList.toggle('z-n', v.k >= LABEL_K_NOTABLE);
    svg.classList.toggle('z-k', v.k >= LABEL_K_KEYSTONE);
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

  // The static layer (edges + nodes + names) only changes when the allocation changes.
  const layer = useMemo(() => {
    const off: preact.JSX.Element[] = [];
    const on: preact.JSX.Element[] = [];
    for (const n of tree.nodes)
      for (const m of n.links) {
        if (m < n.id) continue;
        const o = tree.nodes[m];
        const lit =
          (allocSet.has(n.id) || n.id === start.id) && (allocSet.has(m) || m === start.id);
        const d = edgePath(n, o);
        const line = (key: string, cls: string) => <path key={key} d={d} class={cls} />;
        if (lit) {
          on.push(line(`g${n.id}-${m}`, 'edge glow'));
          on.push(line(`${n.id}-${m}`, 'edge on'));
        } else off.push(line(`${n.id}-${m}`, 'edge'));
      }
    // A node is one group: it is moved to its place and grown with the zoom by its style; the ring takes the clicks.
    const shape = (n: TreeNode) => {
      switch (n.kind) {
        case 'keystone':
          return (
            <>
              <polygon class="rim" points={octagon(FRAME_R.keystone)} />
              <polygon class="ring" data-id={n.id} points={octagon(37, Math.PI / 8)} />
              <path class="pip" d={TONE_GLYPH[toneIds[n.id]]} transform="scale(1.5)" />
            </>
          );
        case 'notable':
          return (
            <>
              <circle class="rim" r={FRAME_R.notable} />
              <circle class="ring" data-id={n.id} r={23} />
              <path class="pip" d={TONE_GLYPH[toneIds[n.id]]} transform="scale(0.95)" />
            </>
          );
        case 'start':
          return (
            <>
              <circle class="rim" r={FRAME_R.start} />
              <circle
                class="ring"
                data-id={n.id}
                r={34}
                style={n.id === start.id ? { fill: classColor } : undefined}
              />
            </>
          );
        default:
          return (
            <>
              <circle class="ring" data-id={n.id} r={NODE_RADIUS[n.kind]} />
              <circle class="pip" r={n.kind === 'travel' ? 3.4 : 4.4} />
            </>
          );
      }
    };
    const nodes = tree.nodes.map((n) => {
      const lit = allocSet.has(n.id);
      const cls =
        n.kind === 'start'
          ? n.id === start.id
            ? 'tn start mine'
            : 'tn start'
          : `tn ${n.kind}${lit ? ' on' : reachable.has(n.id) ? ' can' : ''}`;
      return (
        <g key={n.id} class={cls} style={nodeStyle(n, tones[n.id])}>
          {lit && <circle class="halo" r={NODE_RADIUS[n.kind] * 1.9} />}
          {shape(n)}
        </g>
      );
    });
    const labels = tree.nodes
      .filter((n) => n.kind === 'notable' || n.kind === 'keystone' || n.kind === 'start')
      .map((n) => (
        <text
          key={n.id}
          class={`lb ${n.kind}${allocSet.has(n.id) ? ' on' : ''}`}
          x={n.x}
          y={n.y}
          text-anchor="middle"
        >
          {n.kind === 'start' ? classDef(n.classStart!).name : n.name}
        </text>
      ));
    return (
      <g>
        <g>{off}</g>
        <g>{on}</g>
        <g>{nodes}</g>
        <g>{labels}</g>
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
      {!small && (
        <details class="tree-legend">
          <summary>Colours</summary>
          <ul>
            {TONE_LABEL.map(([tone, label]) => (
              <li key={tone}>
                <i style={{ background: TONE_COLOR[tone] }} /> {label}
              </li>
            ))}
            <li>
              <i class="sq" /> Notable: a stronger passive
            </li>
            <li>
              <i class="oct" /> Keystone: changes how you play
            </li>
          </ul>
        </details>
      )}
      <svg
        ref={svgRef}
        class="tree"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
      >
        <g ref={gRef}>
          <Backdrop maxR={maxR} />
          {layer}
          {(hoverPath || (hn && isOn)) && (
            <g class="preview">
              {hoverPath &&
                hoverPath.map((id, i) => {
                  const n = tree.nodes[id];
                  const prev =
                    i > 0
                      ? tree.nodes[hoverPath[i - 1]]
                      : tree.nodes[
                          [start.id, ...alloc].find((a) => tree.nodes[id].links.includes(a)) ??
                            start.id
                        ];
                  return <path key={`l${id}`} class="edge path" d={edgePath(prev, n)} />;
                })}
              {(hoverPath ?? [hn!.id]).map((id) => {
                const n = tree.nodes[id];
                return (
                  <g key={id} class="tn pr" style={nodeStyle(n, '')}>
                    <circle r={NODE_RADIUS[n.kind] + 8} class="path-ring" />
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>
      {hn && hover && !coarse && (
        <div
          class="tooltip"
          style={{
            // By the cursor, kept on screen (the tooltip is up to 320 px wide). Preact 11 adds no "px" to a number.
            left: `${Math.max(4, Math.min(hover.mx + 16, window.innerWidth - 336))}px`,
            top: `${Math.max(4, Math.min(hover.my + 12, window.innerHeight - 150))}px`,
          }}
        >
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
