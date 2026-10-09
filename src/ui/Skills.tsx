import { useMemo, useState } from 'preact/hooks';
import type { Character } from '../calc/character';
import { naturalGemLevel } from '../calc/gems';
import { gemDef, type GemDef } from '../data/gems';
import { EQUIP_SLOTS, type GemItem } from '../data/types';
import type { Controller } from '../run/controller';
import { setPrimary, socketGem, unsocketGem } from '../run/inventory';
import {
  moveGem,
  placementsFor,
  quickSocket,
  slotLabel,
  type Placement,
  type SocketRef,
} from '../run/inventoryOps';

import { useViewport } from './device';
import { GemCard, GemTip } from './GemCard';
import { gemCardData } from './gemText';
import { loadPref, savePref } from './prefs';

const GEM_GROUPS = ['Skills', 'Utility skills', 'Supports', 'Auras'] as const;

/** The inventory heading a gem sits under: damage skills, the utility skills a policy casts, supports, auras. */
function groupOfGem(d: GemDef): (typeof GEM_GROUPS)[number] {
  if (d.kind === 'active') return d.utility ? 'Utility skills' : 'Skills';
  if (d.kind === 'support') return 'Supports';
  return 'Auras';
}

type Sel = { from: 'inv'; uid: number } | ({ from: 'socket' } & SocketRef);
type Drag = { from: 'inv'; uid: number } | ({ from: 'socket' } & SocketRef);

function Badge({ p }: { p: Pick<Placement, 'dpsPct' | 'ehpPct' | 'scorePct'> }) {
  const parts: [string, number][] = [
    ['DPS', p.dpsPct],
    ['EHP', p.ehpPct],
  ];
  const shown = parts.filter(([, v]) => Math.abs(v) >= 0.5);
  if (shown.length === 0) return <span class="badge neutral">no change</span>;
  return (
    <>
      {shown.map(([l, v]) => (
        <span key={l} class={'badge ' + (v > 0 ? 'up' : 'down')}>
          {v > 0 ? '▲' : '▼'}
          {Math.abs(Math.round(v))}% {l}
        </span>
      ))}
    </>
  );
}

/**
 * Whether a socketed gem is doing anything, in a line: which skills a support is on, what supports a skill, whether an aura
 * is active, and why not when it is not (a support needs a matching skill in the same item).
 */
export function gemStatus(
  ch: Character,
  uid: number,
  def: ReturnType<typeof gemDef>,
): { ok: boolean; text: string; hint?: string } | null {
  if (def.kind === 'support') {
    const on = ch.actives.filter((a) => a.supports.some((x) => x.gem.uid === uid));
    if (on.length)
      return { ok: true, text: `Supporting: ${on.map((a) => a.skill.name).join(', ')}` };
    const needs = def.supports.length ? def.supports.join(' or ') : 'an active skill';
    return {
      ok: false,
      text: `Not supporting anything: needs a ${needs} skill in the same item`,
    };
  }
  if (def.kind === 'active') {
    if (ch.isHexTouched(uid)) return { ok: true, text: 'Hexes the enemies you hit' };
    const a = ch.actives.find((x) => x.gemUid === uid);
    if (!a || !a.usable) return null;
    const names = a.supports.map((x) => x.def.name);
    const linked = names.length ? `Supported by: ${names.join(', ')}` : 'No supports linked';
    // A skill the mana cannot pay for is mostly replaced by the weapon attack: say so.
    if (ch.primary.gemUid === uid) {
      const sustain = ch.skillSheet(
        a,
        undefined,
        ch.configConds,
        undefined,
        0,
        ch.primaryShare(),
      ).sustain;
      if (sustain < 0.9)
        return {
          ok: false,
          text: `${linked} · Mana-starved (${Math.round(sustain * 100)}%)`,
          hint: `Your mana regeneration can pay for about ${Math.round(sustain * 100)}% of this skill's casts. The rest are weapon attacks. Add mana regeneration, reduce the cost, or use fewer supports.`,
        };
    }
    return { ok: true, text: linked };
  }
  if (def.kind === 'aura') {
    const au = ch.auras.find((x) => x.def.id === def.id);
    if (au && !au.active) return { ok: false, text: 'Inactive: not enough mana to reserve it' };
    return au ? { ok: true, text: `Active, reserving ${Math.round(au.reserved)} mana` } : null;
  }
  return null;
}

const sameSocket = (a: SocketRef, b: SocketRef) => a.slot === b.slot && a.socket === b.socket;

export function Skills({ c, ch }: { c: Controller; ch: Character }) {
  const run = c.run!;
  const { coarse } = useViewport();
  const [sel, setSel] = useState<Sel | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState(() => loadPref('gemSearch', ''));
  const [tip, setTip] = useState<{ gemId: string; level: number; x: number; y: number } | null>(
    null,
  );
  const hoverGem = (gemId: string, level: number) =>
    coarse
      ? {}
      : {
          onMouseEnter: (e: MouseEvent) => setTip({ gemId, level, x: e.clientX, y: e.clientY }),
          onMouseMove: (e: MouseEvent) => setTip({ gemId, level, x: e.clientX, y: e.clientY }),
          onMouseLeave: () => setTip(null),
        };
  const gems = useMemo(
    () =>
      run.inventory
        .filter((x): x is GemItem => x.kind === 'gem')
        .sort((a, b) => {
          const order = { active: 0, support: 1, hex: 2, aura: 3 };
          const da = gemDef(a.gemId);
          const db = gemDef(b.gemId);
          return order[da.kind] - order[db.kind] || da.name.localeCompare(db.name);
        }),
    [run.inventory],
  );
  const needle = q.trim().toLowerCase();
  const shownGems = needle
    ? gems.filter((g) => {
        const d = gemCardData(gemDef(g.gemId), 20);
        return `${d.name} ${d.type} ${d.tags.join(' ')} ${d.description}`
          .toLowerCase()
          .includes(needle);
      })
    : gems;
  const levelOf = (uid: number) => ch.gems.find((g) => g.gem.uid === uid)?.level ?? 1;

  // The inventory gem being placed (selected or being dragged), and what each socket would gain.
  const placing = drag?.from === 'inv' ? drag.uid : sel?.from === 'inv' ? sel.uid : null;
  const placements = useMemo(() => {
    const m = new Map<string, Placement>();
    if (placing !== null)
      for (const p of placementsFor(run, placing)) m.set(`${p.slot}:${p.socket}`, p);
    return m;
  }, [placing, run.build, run.inventory]);
  // Best placement per inventory gem, for the list badges.
  const best = useMemo(() => {
    const m = new Map<number, Placement | null>();
    for (const g of gems) {
      const ps = placementsFor(run, g.uid);
      const empties = ps.filter((p) => !p.replaces);
      const pool = empties.length ? empties : ps;
      m.set(g.uid, pool.sort((a, b) => b.scorePct - a.scorePct)[0] ?? null);
    }
    return m;
  }, [gems, run.build]);

  const place = (to: SocketRef, from: Drag | Sel) => {
    if (from.from === 'inv') {
      c.act((r) => socketGem(r, to.slot, to.socket, from.uid));
    } else {
      const ok = c.act((r) => moveGem(r, from, to));
      if (!ok && !sameSocket(from, to)) setMsg('Cannot move the gem there');
    }
    setSel(null);
    setDrag(null);
    setOver(null);
  };
  const unsocket = (from: Drag) => {
    if (from.from === 'socket') c.act((r) => unsocketGem(r, from.slot, from.socket));
    setDrag(null);
    setOver(null);
    setSel(null);
  };
  const onSocketClick = (ref: SocketRef) => {
    if (sel) {
      if (sel.from === 'socket' && sameSocket(sel, ref)) setSel(null);
      else place(ref, sel);
    } else {
      const g = run.build.equipment[ref.slot]!.sockets[ref.socket];
      if (g) setSel({ from: 'socket', ...ref });
    }
  };

  const selGem: { gemId: string; level: number; uid?: number } | null = (() => {
    if (!sel) return null;
    if (sel.from === 'inv') {
      const g = gems.find((x) => x.uid === sel.uid);
      return g
        ? { gemId: g.gemId, level: naturalGemLevel(gemDef(g.gemId), run.build.level, ch.attrs) }
        : null;
    }
    const g = run.build.equipment[sel.slot]?.sockets[sel.socket];
    return g ? { gemId: g.gemId, level: levelOf(g.uid), uid: g.uid } : null;
  })();
  const summary = ch.skillSheet(
    ch.primary,
    undefined,
    ch.configConds,
    undefined,
    0,
    ch.primaryShare(),
  );
  const secondary = ch.secondarySheets();
  return (
    <div class="skills-wrap">
      <div class="skills">
        <div class="skill-summary">
          <b>{summary.name}</b>
          {summary.isDefault ? ' (default attack)' : ''}
          <span class="muted">
            {' '}
            · {Math.round(summary.totalDps * 10) / 10} DPS
            {summary.sustain < 1
              ? ` (mana regeneration alone pays for ${Math.round(summary.sustain * 100)}% of its casts)`
              : ''}{' '}
            · {Math.round(ch.ehp())} effective HP
          </span>
        </div>
        {secondary.length > 0 && (
          <div class="skill-summary muted">
            Also cast whenever ready:{' '}
            {secondary
              .map(
                (x) =>
                  `${x.skill.name} (every ${Math.round(x.cooldown * 10) / 10} s, ${Math.round(x.dps * 10) / 10} DPS)`,
              )
              .join(' · ')}
          </div>
        )}
        <p class="muted hint">
          Every skill you have equipped is used: the ★ primary is cast over and over, and every
          other active skill is cast whenever it is off cooldown. Every socket on an item is linked.{' '}
          {coarse
            ? 'Tap a gem, then a socket. Tap a placed gem for its options. ★ sets the primary skill.'
            : 'Click a gem, then a socket — or drag gems onto sockets (drop on the gem list to remove). Double-click a gem to auto-place or remove it. ★ sets the primary skill.'}
        </p>
        {EQUIP_SLOTS.map((slot) => {
          const it = run.build.equipment[slot];
          if (!it || it.sockets.length === 0) return null;
          return (
            <div key={slot} class="socket-row">
              <div class="socket-item">
                <div class="muted">{slotLabel(slot)}</div>
                <div>{it.name}</div>
              </div>
              {it.sockets.map((g, i) => {
                const ref: SocketRef = { slot, socket: i };
                const key = `${slot}:${i}`;
                const p = placements.get(key);
                const isSel = sel?.from === 'socket' && sameSocket(sel, ref);
                const dropHere = over === key;
                const common = {
                  onDragOver: (e: DragEvent) => {
                    if (drag) {
                      e.preventDefault();
                      if (over !== key) setOver(key);
                    }
                  },
                  onDragLeave: () => over === key && setOver(null),
                  onDrop: (e: DragEvent) => {
                    e.preventDefault();
                    if (drag) place(ref, drag);
                  },
                };
                if (!g)
                  return (
                    <button
                      key={i}
                      class={`socket empty${p ? ' target' : ''}${dropHere ? ' drop' : ''}`}
                      onClick={() => onSocketClick(ref)}
                      {...common}
                    >
                      {p ? <Badge p={p} /> : sel || drag ? 'drop here' : 'empty'}
                    </button>
                  );
                const d = gemDef(g.gemId);
                const primary = ch.primary.gemUid === g.uid;
                const active = ch.actives.find((a) => a.gemUid === g.uid);
                const status = gemStatus(ch, g.uid, d);
                return (
                  <div
                    key={i}
                    class={`socket ${d.kind}${primary ? ' primary' : ''}${isSel ? ' sel' : ''}${
                      p ? ' target' : ''
                    }${dropHere ? ' drop' : ''}`}
                    draggable={!coarse}
                    onDragStart={() => setDrag({ from: 'socket', ...ref })}
                    onDragEnd={() => {
                      setDrag(null);
                      setOver(null);
                    }}
                    {...common}
                    {...hoverGem(g.gemId, levelOf(g.uid))}
                  >
                    <button
                      class="gem-name"
                      onClick={() => onSocketClick(ref)}
                      onDblClick={() => c.act((r) => unsocketGem(r, slot, i))}
                    >
                      {d.name} <span class="muted">L{levelOf(g.uid)}</span>
                      {p && (
                        <div>
                          <Badge p={p} /> <span class="muted">replaces</span>
                        </div>
                      )}
                      {active && !active.usable && <div class="warn">{active.reason}</div>}
                      {status && (
                        <div
                          class={status.ok ? 'muted gem-status' : 'warn gem-status'}
                          title={status.hint}
                        >
                          {status.text}
                        </div>
                      )}
                    </button>
                    {d.kind === 'active' && (
                      <button
                        class={'star' + (primary ? ' on' : '')}
                        title="Make this the primary skill"
                        onClick={() => c.act((r) => setPrimary(r, g.uid))}
                      >
                        ★
                      </button>
                    )}
                    <button
                      class="x"
                      title="Remove (back to the gem list)"
                      onClick={() => c.act((r) => unsocketGem(r, slot, i))}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
        {ch.primary.gemUid === null && (
          <div class="warn">No usable active skill: using the default attack.</div>
        )}
        {msg && <div class="warn">{msg}</div>}
      </div>
      <div
        class={'gem-inv' + (over === 'inv' ? ' drop' : '')}
        onDragOver={(e) => {
          if (drag?.from === 'socket') {
            e.preventDefault();
            if (over !== 'inv') setOver('inv');
          }
        }}
        onDragLeave={() => over === 'inv' && setOver(null)}
        onDrop={(e) => {
          e.preventDefault();
          if (drag) unsocket(drag);
        }}
      >
        <div class="muted">Gems ({gems.length})</div>
        {gems.length > 8 && (
          <input
            class="search"
            type="text"
            placeholder="Search gems by name, tag or type"
            value={q}
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value;
              setQ(v);
              savePref('gemSearch', v);
            }}
          />
        )}
        {gems.length === 0 && (
          <div class="muted">
            No spare gems.{' '}
            {coarse ? 'Remove socketed gems with ×' : 'Drag socketed gems here to remove them'}.
          </div>
        )}
        {GEM_GROUPS.map((group) => {
          const list = shownGems.filter((g) => groupOfGem(gemDef(g.gemId)) === group);
          if (!list.length) return null;
          return (
            <div key={group} class="gem-group">
              <div class="muted gem-group-title">{group}</div>
              {list.map((g) => {
                const d = gemDef(g.gemId);
                const b = best.get(g.uid);
                return (
                  <button
                    key={g.uid}
                    class={`gem-chip ${d.kind}${sel?.from === 'inv' && sel.uid === g.uid ? ' sel' : ''}`}
                    draggable={!coarse}
                    {...hoverGem(g.gemId, naturalGemLevel(d, run.build.level, ch.attrs))}
                    onDragStart={() => setDrag({ from: 'inv', uid: g.uid })}
                    onDragEnd={() => {
                      setDrag(null);
                      setOver(null);
                    }}
                    onClick={() =>
                      setSel(
                        sel?.from === 'inv' && sel.uid === g.uid
                          ? null
                          : { from: 'inv', uid: g.uid },
                      )
                    }
                    onDblClick={() => {
                      const ok = c.act((r) => quickSocket(r, g.uid));
                      setMsg(ok ? '' : 'No free socket — click a socket to replace a gem');
                      setSel(null);
                    }}
                  >
                    <span>{d.name}</span>
                    {b && <Badge p={b} />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {tip && <GemTip {...tip} />}
      {coarse && selGem && sel && (
        <div class="gem-sheet">
          <button class="sheet-x" aria-label="Close" onClick={() => setSel(null)}>
            ×
          </button>
          <GemCard gemId={selGem.gemId} level={selGem.level} />
          <div class="item-actions">
            {sel.from === 'inv' ? (
              <>
                <button
                  class="btn small primary"
                  onClick={() => {
                    const ok = c.act((r) => quickSocket(r, sel.uid));
                    setMsg(ok ? '' : 'No free socket — tap a socket to replace a gem');
                    if (ok) setSel(null);
                  }}
                >
                  Socket in the best place
                </button>
                <span class="muted">or tap a socket</span>
              </>
            ) : (
              <>
                <button class="btn small" onClick={() => unsocket(sel)}>
                  Remove
                </button>
                {gemDef(selGem.gemId).kind === 'active' && selGem.uid !== undefined && (
                  <button
                    class="btn small"
                    onClick={() => c.act((r) => setPrimary(r, selGem.uid!))}
                  >
                    ★ Make primary
                  </button>
                )}
                <span class="muted">or tap another socket to move it</span>
              </>
            )}
          </div>
          {msg && <div class="warn">{msg}</div>}
        </div>
      )}
    </div>
  );
}
