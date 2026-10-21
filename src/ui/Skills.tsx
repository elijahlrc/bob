import { useEffect, useMemo, useState } from 'preact/hooks';
import { sheetDps, type Character } from '../calc/character';
import { naturalGemLevel, resolveActive } from '../calc/gems';
import { supportLive } from '../calc/reach';
import { typesAllow } from '../data/skillTypes';
import { weaponBar } from '../data/weaponFit';
import { gemDef, type GemDef } from '../data/gems';
import { EQUIP_SLOTS, type EquipSlot, type GemItem } from '../data/types';
import type { Controller } from '../run/controller';
import { setPrimary, socketGem, unsocketGem } from '../run/inventory';
import { sheetOf } from '../run/bot';
import { gemStatus } from '../run/gemStatus';
import {
  bestPlacement,
  moveGem,
  placementsFor,
  quickSocket,
  slotLabel,
  type Placement,
  type SocketRef,
} from '../run/inventoryOps';

import { useViewport } from './device';
import { GemCard, GemTip } from './GemCard';
import { Badge } from './SocketPicker';
import { SocketPips } from './SocketPips';
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

/** How long the badges are worked on at a time before the screen gets its turn, in milliseconds. */
const BADGE_SLICE_MS = 8;
/** How long after the last change they wait before they start, in milliseconds. */
const BADGE_DELAY_MS = 250;

const sameSocket = (a: SocketRef, b: SocketRef) => a.slot === b.slot && a.socket === b.socket;

export function Skills({
  c,
  ch,
  focusSlot,
}: {
  c: Controller;
  ch: Character;
  /** Scroll to the sockets of this slot when the tab opens. */
  focusSlot?: EquipSlot | null;
}) {
  const run = c.run!;
  const { coarse } = useViewport();
  const [sel, setSel] = useState<Sel | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  // A gem from the bag picked, and the socket that holds a gem it would replace: read before committing (docs/EQUIP.md 3.6).
  const [pending, setPending] = useState<SocketRef | null>(null);
  const [hint, setHint] = useState(() => !loadPref<boolean>('skills.hintSeen', false));
  useEffect(() => savePref('skills.hintSeen', true), []);
  useEffect(() => setPending(null), [sel]);
  useEffect(() => {
    if (focusSlot)
      document.querySelector(`[data-slot="${focusSlot}"]`)?.scrollIntoView({ block: 'center' });
  }, [focusSlot]);
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
  // Socketing and unsocketing edit the inventory array in place, so its identity says nothing about what is in it: key the list
  // on the gems it holds instead.
  const gemKey = run.inventory.flatMap((x) => (x.kind === 'gem' ? [x.uid] : [])).join(',');
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
    [gemKey],
  );
  const needle = q.trim().toLowerCase();
  // The list's filters (kept between visits): one of each gem, only what the weapons in hand can use, and the supports that
  // would act on one chosen skill.
  const [oneEach, setOneEach] = useState(() => loadPref('gemOneEach', false));
  const [usableOnly, setUsableOnly] = useState(() => loadPref('gemUsable', false));
  const [forSkill, setForSkill] = useState(() => loadPref('gemSupportsFor', ''));
  const hold = ch.weaponHold();
  // The skills a support can be asked about: the ones worn and the ones in the bag, one of each.
  const skillIds = [
    ...new Set([
      ...ch.actives.flatMap((a) => (a.gemUid !== null && !a.skill.utility ? [a.skill.id] : [])),
      ...gems.filter((g) => gemDef(g.gemId).kind === 'active').map((g) => g.gemId),
    ]),
  ];
  const forDef = forSkill && skillIds.includes(forSkill) ? gemDef(forSkill) : null;
  const forResolved = forDef?.kind === 'active' ? resolveActive(forDef, 20) : null;
  const counts = new Map<string, number>();
  for (const g of gems) counts.set(g.gemId, (counts.get(g.gemId) ?? 0) + 1);
  const seen = new Set<string>();
  const shownGems = gems.filter((g) => {
    const def = gemDef(g.gemId);
    if (oneEach) {
      if (seen.has(g.gemId)) return false;
      seen.add(g.gemId);
    }
    if (usableOnly) {
      if (def.kind === 'active' && weaponBar(def, hold)) return false;
      if (
        def.kind === 'support' &&
        def.limitWeapon &&
        !def.limitWeapon.some((t) => hold.tags.has(t))
      )
        return false;
    }
    if (forResolved) {
      if (def.kind !== 'support') return false;
      if (!typesAllow(def, new Set(forResolved.types)) || !supportLive(def, forResolved).live)
        return false;
    }
    if (!needle) return true;
    const d = gemCardData(def, 20);
    return `${d.name} ${d.type} ${d.tags.join(' ')} ${d.description}`
      .toLowerCase()
      .includes(needle);
  });
  const levelOf = (uid: number) => ch.gems.find((g) => g.gem.uid === uid)?.level ?? 1;

  // The inventory gem being placed (selected or being dragged), and what each socket would gain.
  const placing = drag?.from === 'inv' ? drag.uid : sel?.from === 'inv' ? sel.uid : null;
  const placements = useMemo(() => {
    const m = new Map<string, Placement>();
    if (placing !== null)
      for (const p of placementsFor(run, placing)) m.set(`${p.slot}:${p.socket}`, p);
    return m;
  }, [placing, run.build, gemKey]);
  // Best placement per inventory gem, for the list badges. Each gem is tried in each socket, which is a lot of sheets, so it is
  // worked out a little at a time after the screen has been drawn, and the badges already shown stay until their gem is redone.
  const [best, setBest] = useState<Map<number, Placement | null>>(() => new Map());
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const uids = gems.map((g) => g.uid);
    const alive = new Set(uids);
    let base: ReturnType<typeof sheetOf> | undefined;
    let at = 0;
    const step = () => {
      if (stopped) return;
      base ??= sheetOf(run);
      const done = new Map<number, Placement | null>();
      const t0 = performance.now();
      while (at < uids.length && performance.now() - t0 < BADGE_SLICE_MS)
        done.set(uids[at], bestPlacement(run, uids[at++], base));
      setBest((prev) => {
        const m = new Map<number, Placement | null>();
        for (const [uid, p] of prev) if (alive.has(uid)) m.set(uid, p);
        for (const [uid, p] of done) m.set(uid, p);
        return m;
      });
      if (at < uids.length) timer = setTimeout(step, 0);
    };
    // (After a pause: a run of moves does not start the work again with every one.)
    timer = setTimeout(step, BADGE_DELAY_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [gems, run.build]);

  const place = (to: SocketRef, from: Drag | Sel) => {
    if (from.from === 'inv') {
      c.act((r) => socketGem(r, to.slot, to.socket, from.uid));
    } else {
      const ok = c.act((r) => moveGem(r, from, to));
      if (!ok && !sameSocket(from, to)) setMsg('Cannot move the gem there');
    }
    setSel(null);
    setPending(null);
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
      else if (sel.from === 'inv' && run.build.equipment[ref.slot]!.sockets[ref.socket])
        setPending(pending && sameSocket(pending, ref) ? null : ref);
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
  // Worn items with no socket at all: named once, so a missing row is not a mystery.
  const notSocketable = EQUIP_SLOTS.filter((slot) => {
    const it = run.build.equipment[slot];
    return it && it.sockets.length === 0;
  }).map(slotLabel);
  // What replacing the gem in the picked socket would do, said before it is done.
  const replaced = pending ? run.build.equipment[pending.slot]?.sockets[pending.socket] : null;
  const confirm =
    pending && replaced && sel?.from === 'inv' && selGem ? (
      <div class="ix-confirm" role="status">
        <div>
          Replace <b>{gemDef(replaced.gemId).name}</b>
          {ch.primary.gemUid === replaced.uid ? ', your primary skill' : ''} with{' '}
          <b>{gemDef(selGem.gemId).name}</b>? It goes to the bag.
        </div>
        {placements.get(`${pending.slot}:${pending.socket}`) && (
          <div class="ix-confirm-b">
            <Badge p={placements.get(`${pending.slot}:${pending.socket}`)!} />
          </div>
        )}
        {gemStatus(ch, replaced.uid, gemDef(replaced.gemId)) && (
          <div class="muted">
            {gemDef(replaced.gemId).name}:{' '}
            {gemStatus(ch, replaced.uid, gemDef(replaced.gemId))!.text}
          </div>
        )}
        <div class="item-actions">
          <button class="btn small primary" onClick={() => place(pending, sel)}>
            Replace {gemDef(replaced.gemId).name}
          </button>
          <button class="btn small" onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      </div>
    ) : null;
  const summary = ch.mainSheet();
  const secondary = ch.secondarySheets();
  // The headline is the sheet the socket badges compare against, so a "▲13% DPS" moves it by 13% (docs/NEWPLAYER.md N4).
  const whole = sheetOf(run);
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return (
    <div class="skills-wrap">
      <div class="skills">
        <div class="skill-summary">
          <button
            class="link skills-help"
            aria-label="How this works"
            aria-expanded={hint}
            onClick={() => setHint(!hint)}
          >
            ?
          </button>{' '}
          <b>{summary.name}</b>
          {summary.isDefault ? ' (default attack)' : ''}
          <span class="muted">
            {' '}
            · {r1(sheetDps(whole))} DPS{secondary.length > 0 ? ' in all' : ''} ·{' '}
            {Math.round(whole.ehp)} effective HP
          </span>
        </div>
        {(secondary.length > 0 || summary.sustain < 1) && (
          <div class="skill-summary muted">
            {secondary.length > 0 ? `${summary.name} alone: ${r1(summary.totalDps)} DPS` : ''}
            {summary.sustain < 1
              ? `${secondary.length > 0 ? '; m' : 'M'}ana regeneration pays for ${Math.round(summary.sustain * 100)}% of its casts`
              : ''}
            {secondary.length > 0 &&
              ` · also every so often: ${secondary
                .map((x) => `${x.skill.name} (every ${r1(x.cooldown)} s, ${r1(x.dps)} DPS)`)
                .join(' · ')}`}
          </div>
        )}
        {hint && (
          <p class="muted hint">
            Every skill you have equipped is used: the ★ primary is the main skill, used over and
            over, and every other active skill is used every so often. The Strategy tab sets what
            each skill is for, when it is used and in what order. Every socket on an item is linked.{' '}
            {coarse
              ? 'Tap a gem, then a socket. Tap a placed gem for its options. ★ sets the primary skill.'
              : 'Click a gem, then a socket — or drag gems onto sockets (drop on the gem list to remove). Double-click a gem to auto-place or remove it. ★ sets the primary skill.'}
          </p>
        )}
        {EQUIP_SLOTS.map((slot) => {
          const it = run.build.equipment[slot];
          if (!it || it.sockets.length === 0) return null;
          return (
            <div
              key={slot}
              class={'socket-row' + (focusSlot === slot ? ' focus' : '')}
              data-slot={slot}
            >
              <div class="socket-item">
                <div class="muted">{slotLabel(slot)}</div>
                <div class="socket-item-name">{it.name}</div>
                <div class="socket-item-n muted">
                  <SocketPips
                    sockets={it.sockets}
                    primary={ch.primary.gemUid ?? undefined}
                    size="sm"
                  />{' '}
                  {it.sockets.length} linked
                </div>
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
                    }${pending && sameSocket(pending, ref) ? ' pend' : ''}${dropHere ? ' drop' : ''}`}
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
                          <Badge p={p} /> <span class="muted">if you replace it</span>
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
        {notSocketable.length > 0 && (
          <div class="muted socket-none">Not socketable: {notSocketable.join(', ')}</div>
        )}
        {ch.primary.gemUid === null && (
          <div class="warn">No usable active skill: using the default attack.</div>
        )}
        {!coarse && confirm}
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
        {gems.length > 1 && (
          <div class="gem-filters">
            <label class="sx-check">
              <input
                type="checkbox"
                checked={oneEach}
                onChange={(e) => {
                  const v = (e.target as HTMLInputElement).checked;
                  setOneEach(v);
                  savePref('gemOneEach', v);
                }}
              />
              <span>One of each</span>
            </label>
            <label class="sx-check">
              <input
                type="checkbox"
                checked={usableOnly}
                onChange={(e) => {
                  const v = (e.target as HTMLInputElement).checked;
                  setUsableOnly(v);
                  savePref('gemUsable', v);
                }}
              />
              <span>Usable with my weapons</span>
            </label>
            <label class="gem-for">
              <span>Supports for</span>
              <select
                value={forDef ? forSkill : ''}
                onChange={(e) => {
                  const v = (e.target as HTMLSelectElement).value;
                  setForSkill(v);
                  savePref('gemSupportsFor', v);
                }}
              >
                <option value="">any skill</option>
                {skillIds
                  .map((id) => gemDef(id))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        )}
        {gems.length > 0 && shownGems.length === 0 && (
          <div class="muted">No gem matches the filters.</div>
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
                    <span>
                      {d.name}
                      {oneEach && (counts.get(g.gemId) ?? 1) > 1 && (
                        <span class="muted"> ×{counts.get(g.gemId)}</span>
                      )}
                    </span>
                    {b && (
                      <span class="gem-chip-b">
                        <Badge
                          p={{
                            ...b,
                            idle: b.idle?.replace('on this item', 'on one of your items'),
                          }}
                        />
                        {(Math.abs(b.dpsPct) >= 0.5 || Math.abs(b.ehpPct) >= 0.5) && (
                          <span class="muted">→ {slotLabel(b.slot)}</span>
                        )}
                      </span>
                    )}
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
          {confirm}
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
