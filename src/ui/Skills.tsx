import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
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
import { foundLastLevel } from '../run/found';
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
import { GemTip } from './GemCard';
import { infoProps } from './info';
import { Badge } from './SocketPicker';
import { gemCardData } from './gemText';
import { loadPref, savePref } from './prefs';
import { matchesTerms, searchTerms } from './search';
import { useRehearsal } from './rehearsal';
import { introSeen, seeIntro } from './intro';

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
const f0 = (v: number) => Math.round(v).toLocaleString();

/** "a, b and c". */
const listOf = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

/** A gem's colour on its stone: its attribute (a gem of two attributes takes the first). */
const attrOf = (d: GemDef) => d.attr.slice(0, 3);

/** The text colour class of an item's name, by rarity. */
const RARITY_TEXT: Record<string, string> = { magic: 'magic', rare: 'rare', unique: 'unique' };

/**
 * A gem as a painted stone in a gold setting (round for a skill, a lozenge for a support), its level on the stone; an empty
 * socket is a dark hollow. `state` rings it: picked (`sel`) or a place the picked gem can go (`target`).
 */
function Stone({
  d,
  level,
  state = '',
}: {
  d: GemDef | null;
  level?: number;
  state?: '' | 'sel' | 'target';
}) {
  const gem = d ? attrOf(d) : 'empty';
  const shape = d?.kind === 'support' ? 'support' : 'skill';
  return (
    <span class="sk-gemwrap" aria-hidden="true">
      <span
        class="sk-stone"
        data-paint="gem"
        data-gem={gem}
        data-shape={shape}
        data-state={state}
        data-pk={`${gem}-${shape}-${state}`}
      />
      {level !== undefined && <span class="sk-lvl">{level}</span>}
    </span>
  );
}

/**
 * The Skills tab, in Gold Leaf (docs/mockups/style/STYLE-GUIDE.md, docs/mockups/style/skills.js): the whole DPS and the
 * effective HP as medallions; each socketed item a lapis panel with its gems as stones on a gold chain; the gem bag a lapis
 * panel with its filters. Pick a gem in the bag, then a socket ("Place it here"); a socketed gem picked can be made the main
 * skill, taken out, or moved by picking another socket. Gems drag between sockets and the bag with a mouse.
 */
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
  const [supportSeen, setSupportSeen] = useState(() => introSeen('support'));
  // A copy painted ahead out of sight (rehearsal.ts) has not been seen.
  const rehearsal = useRehearsal();
  useEffect(() => {
    if (!rehearsal) savePref('skills.hintSeen', true);
  }, []);
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
  const terms = searchTerms(q);
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
  // Gems found on the level just played are marked new (with one of each, when any copy is).
  const newIds = new Set(gems.filter((g) => foundLastLevel(run, g.uid)).map((g) => g.gemId));
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
    if (!terms.length) return true;
    const d = gemCardData(def, 20);
    return matchesTerms(
      `${d.name} ${d.type} ${d.tags.join(' ')} ${d.description}`.toLowerCase(),
      terms,
    );
  });
  const levelOf = (uid: number) => ch.gems.find((g) => g.gem.uid === uid)?.level ?? 1;
  const bagLevel = (d: GemDef) => naturalGemLevel(d, run.build.level, ch.attrs);

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
    // Not for a copy painted ahead: nobody reads its badges, and the open tab works them out again.
    if (rehearsal) return;
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
    requestAnimationFrame(() =>
      document
        .querySelector(`[data-slot="${to.slot}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    );
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
      return g ? { gemId: g.gemId, level: bagLevel(gemDef(g.gemId)) } : null;
    }
    const g = run.build.equipment[sel.slot]?.sockets[sel.socket];
    return g ? { gemId: g.gemId, level: levelOf(g.uid), uid: g.uid } : null;
  })();
  const selDef = selGem ? gemDef(selGem.gemId) : null;
  // A touch screen has no hover: the gem picked shows its card by the tap that picked it, until the next tap or a
  // scroll (the card does not take taps, so the sockets under it still do).
  const lastTap = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!coarse) return;
    setTip(selGem ? { gemId: selGem.gemId, level: selGem.level, ...lastTap.current } : null);
  }, [
    coarse,
    sel?.from,
    sel && 'uid' in sel ? sel.uid : null,
    sel && 'slot' in sel ? `${sel.slot}:${sel.socket}` : null,
  ]);
  useEffect(() => {
    if (!coarse) return;
    const close = () => setTip(null);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [coarse]);
  // What replacing the gem in the picked socket would do, said before it is done.
  const replaced = pending ? run.build.equipment[pending.slot]?.sockets[pending.socket] : null;
  const pendingP = pending ? placements.get(`${pending.slot}:${pending.socket}`) : undefined;
  const replacedStatus = replaced ? gemStatus(ch, replaced.uid, gemDef(replaced.gemId)) : null;
  const confirm =
    pending && replaced && sel?.from === 'inv' && selDef ? (
      <div class="sk-confirm" role="status">
        <div>
          Replace <b>{gemDef(replaced.gemId).name}</b>
          {ch.primary.gemUid === replaced.uid ? ', your main skill' : ''} with <b>{selDef.name}</b>?
          It goes to the bag.
        </div>
        {pendingP && (
          <div class="sk-badges">
            <Badge p={pendingP} />
          </div>
        )}
        {replacedStatus && (
          <div class="sk-sub">
            {gemDef(replaced.gemId).name}: {replacedStatus.text}
          </div>
        )}
        <div class="sk-acts">
          <button class="btn small primary" onClick={() => place(pending, sel)}>
            Replace {gemDef(replaced.gemId).name}
          </button>
          <button class="btn small" onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      </div>
    ) : null;
  /** What can be done with the picked gem: socket it at its best (from the bag), or make it main and take it out. */
  const actions =
    sel && selGem && selDef ? (
      sel.from === 'inv' ? (
        <>
          <button
            class="btn small"
            onClick={() => {
              const ok = c.act((r) => quickSocket(r, sel.uid));
              setMsg(ok ? '' : `No free socket: ${coarse ? 'tap' : 'click'} one to replace a gem`);
              if (ok) setSel(null);
            }}
          >
            Socket in the best place
          </button>
          <button class="btn small" onClick={() => setSel(null)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          {selDef.kind === 'active' && selGem.uid !== undefined && (
            <button
              class="btn small"
              disabled={ch.primary.gemUid === selGem.uid}
              onClick={() => c.act((r) => setPrimary(r, selGem.uid!))}
            >
              {ch.primary.gemUid === selGem.uid ? '★ Main skill' : '★ Make main'}
            </button>
          )}
          <button class="btn small" onClick={() => unsocket(sel)}>
            Take out
          </button>
          <button class="btn small" onClick={() => setSel(null)}>
            Done
          </button>
        </>
      )
    ) : null;
  const bestOfSel = sel?.from === 'inv' ? best.get(sel.uid) : null;
  const tap = coarse ? 'tap' : 'click';
  /** The line that names the picked gem and says what to do next. */
  const pickLine =
    sel && selDef ? (
      <span class="sk-pickname">
        <b>{selDef.name}</b>
        {sel.from === 'inv' ? (
          <>
            : {tap} a socket
            {bestOfSel && (
              <span class="sk-badges">
                {' '}
                (<Badge p={bestOfSel} /> in {slotLabel(bestOfSel.slot)})
              </span>
            )}
          </>
        ) : (
          <>: {tap} another socket to move it</>
        )}
      </span>
    ) : null;

  const summary = ch.mainSheet();
  const secondary = ch.secondarySheets();
  // The headline is the sheet the socket badges compare against, so a "▲13% DPS" moves it by 13% (docs/NEWPLAYER.md N4).
  const whole = sheetOf(run);
  const rotationTip =
    `${summary.name}${summary.isDefault ? ' (default attack)' : ''} alone: ${f0(summary.totalDps)} DPS.` +
    (secondary.length
      ? ` Every few seconds also ${listOf(secondary.map((x) => x.skill.name))}.`
      : '');
  return (
    <div
      class="sk"
      onPointerDownCapture={(e) => {
        // Any tap closes the card; picking a gem opens it again where the tap was.
        lastTap.current = { x: e.clientX, y: e.clientY };
        if (coarse) setTip(null);
      }}
    >
      <div class="sk-top">
        <div class="sk-medals">
          <div class="sk-medal" data-paint="medal" data-field="vermilion,4">
            <span>Damage per second</span>
            <b>{f0(sheetDps(whole))}</b>
            <i
              class="sk-plaque"
              data-paint="panel"
              data-thin
              tabIndex={0}
              {...infoProps(rotationTip)}
            >
              {summary.isDefault ? summary.name : `★ ${summary.name}`}
            </i>
          </div>
          <div class="sk-medal" data-paint="medal" data-field="porphyry,4">
            <span>Effective HP</span>
            <b>{f0(whole.ehp)}</b>
          </div>
        </div>
        {sel && selDef ? (
          <div class="sk-pick" data-paint="panel" data-thin>
            <div class="sk-pickrow">
              {pickLine}
              {!confirm && <span class="sk-acts">{actions}</span>}
            </div>
            {confirm}
          </div>
        ) : null}
        <button
          class="btn small sk-help"
          aria-label="How this works"
          aria-expanded={hint}
          onClick={() => setHint(!hint)}
        >
          ?
        </button>
        {hint && (
          <p class="sk-hint" data-paint="panel" data-thin>
            Skill gems are your character's skills: put them in sockets on your gear. A support gem
            changes the skills in the same item. ★ marks the main skill; the Strategy tab says when
            the others are used.
          </p>
        )}
      </div>
      <div class="sk-cols">
        <div class="sk-main">
          {ch.primary.gemUid === null && (
            <div class="sk-warn" data-paint="panel" data-field="vermilion" data-thin>
              No usable active skill: using the default attack.
            </div>
          )}
          {!supportSeen && !rehearsal && (
            <FirstSupport
              gems={gems}
              ch={ch}
              onSeen={() => {
                seeIntro('support');
                setSupportSeen(true);
              }}
            />
          )}
          {msg && (
            <div class="sk-warn" data-paint="panel" data-field="vermilion" data-thin>
              {msg}
            </div>
          )}
          <div class="sk-grid">
            {EQUIP_SLOTS.map((slot) => {
              const it = run.build.equipment[slot];
              if (!it || it.sockets.length === 0) return null;
              return (
                <section
                  key={slot}
                  class={'sk-item' + (focusSlot === slot ? ' focus' : '')}
                  data-slot={slot}
                  data-paint="panel"
                >
                  <h4 class="sk-head">
                    <span class={RARITY_TEXT[it.rarity] ?? ''}>{it.name}</span>
                    <span class="sk-slot">{slotLabel(slot)}</span>
                  </h4>
                  <div class="sk-socks">
                    {it.sockets.map((g, i) => {
                      const ref: SocketRef = { slot, socket: i };
                      const key = `${slot}:${i}`;
                      const p = placements.get(key);
                      const isSel = sel?.from === 'socket' && sameSocket(sel, ref);
                      const dropHere = over === key;
                      const chain = i < it.sockets.length - 1 && (
                        <span
                          class="sk-chain"
                          data-paint="chain"
                          {...infoProps(
                            'Linked: a support gem works on the skills in the same item.',
                          )}
                        />
                      );
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
                      if (!g) {
                        const aim = !!p || !!drag || sel?.from === 'socket';
                        return (
                          <div key={i} class="sk-link">
                            <button
                              class={`sk-sock empty${p ? ' aim' : ''}${dropHere ? ' drop' : ''}`}
                              onClick={() => onSocketClick(ref)}
                              {...common}
                            >
                              <Stone d={null} state={aim ? 'target' : ''} />
                              <span class="sk-text">
                                <span class="sk-name sk-empty">
                                  {p
                                    ? 'Place it here'
                                    : sel?.from === 'socket'
                                      ? 'Move it here'
                                      : drag
                                        ? 'Drop it here'
                                        : 'Empty'}
                                </span>
                                {p && (
                                  <span class="sk-sub sk-badges">
                                    <Badge p={p} />
                                  </span>
                                )}
                              </span>
                            </button>
                            {chain}
                          </div>
                        );
                      }
                      const d = gemDef(g.gemId);
                      const primary = ch.primary.gemUid === g.uid;
                      const active = ch.actives.find((a) => a.gemUid === g.uid);
                      const status = gemStatus(ch, g.uid, d);
                      const pend = !!pending && sameSocket(pending, ref);
                      return (
                        <div key={i} class="sk-link">
                          <button
                            class={`sk-sock${isSel || pend ? ' on' : ''}${p ? ' aim' : ''}${
                              dropHere ? ' drop' : ''
                            }`}
                            draggable={!coarse}
                            onDragStart={() => setDrag({ from: 'socket', ...ref })}
                            onDragEnd={() => {
                              setDrag(null);
                              setOver(null);
                            }}
                            {...common}
                            {...hoverGem(g.gemId, levelOf(g.uid))}
                            onClick={() => onSocketClick(ref)}
                            onDblClick={() => c.act((r) => unsocketGem(r, slot, i))}
                          >
                            <Stone
                              d={d}
                              level={levelOf(g.uid)}
                              state={isSel || pend ? 'sel' : p ? 'target' : ''}
                            />
                            <span class="sk-text">
                              <span class="sk-name">
                                {primary && <span class="sk-star">★ </span>}
                                {d.name}
                              </span>
                              {p && (
                                <span class="sk-sub sk-badges">
                                  <Badge p={p} /> if you replace it
                                </span>
                              )}
                              {active && !active.usable && (
                                <span class="sk-sub sk-bad">{active.reason}</span>
                              )}
                              {status && (
                                <span class={'sk-sub' + (status.ok ? '' : ' sk-bad')}>
                                  {status.text}
                                </span>
                              )}
                            </span>
                          </button>
                          {chain}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
        <section
          class={'lf-panel sk-bag' + (over === 'inv' ? ' drop' : '')}
          data-paint="panel"
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
          <h4 class="lf-h">Gems{gems.length > 0 ? ` (${gems.length})` : ''}</h4>
          {gems.length > 8 && (
            <input
              class="sk-search"
              type="text"
              placeholder="Search by name, tag or type"
              title="Commas join terms: area, attack"
              value={q}
              onInput={(e) => {
                const v = (e.target as HTMLInputElement).value;
                setQ(v);
                savePref('gemSearch', v);
              }}
            />
          )}
          {gems.length > 1 && (
            <div class="sk-filters">
              <label class="sk-check">
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
              <label class="sk-check">
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
              <label class="sk-for">
                <span class="sk-lbl">Supports for</span>
                <span class="sk-sel" data-paint="panel" data-thin>
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
                </span>
              </label>
            </div>
          )}
          {gems.length > 0 && shownGems.length === 0 && (
            <p class="sk-none">No gem matches the filters.</p>
          )}
          {gems.length === 0 && (
            <p class="sk-none">
              No spare gems.{' '}
              {coarse
                ? 'Tap a socketed gem to take it out'
                : 'Drag a socketed gem here to take it out'}
              .
            </p>
          )}
          {GEM_GROUPS.map((group) => {
            const list = shownGems.filter((g) => groupOfGem(gemDef(g.gemId)) === group);
            if (!list.length) return null;
            return (
              <div key={group} class="sk-group">
                <h5 class="sk-sh">{group}</h5>
                {list.map((g) => {
                  const d = gemDef(g.gemId);
                  const b = best.get(g.uid);
                  const on = sel?.from === 'inv' && sel.uid === g.uid;
                  const fresh = oneEach ? newIds.has(g.gemId) : foundLastLevel(run, g.uid);
                  return (
                    <button
                      key={g.uid}
                      class={'sk-bagrow' + (on ? ' on' : '')}
                      draggable={!coarse}
                      {...hoverGem(g.gemId, bagLevel(d))}
                      onDragStart={() => setDrag({ from: 'inv', uid: g.uid })}
                      onDragEnd={() => {
                        setDrag(null);
                        setOver(null);
                      }}
                      onClick={() => setSel(on ? null : { from: 'inv', uid: g.uid })}
                      onDblClick={() => {
                        const ok = c.act((r) => quickSocket(r, g.uid));
                        setMsg(ok ? '' : 'No free socket: click a socket to replace a gem');
                        setSel(null);
                      }}
                    >
                      <Stone d={d} level={bagLevel(d)} state={on ? 'sel' : ''} />
                      <span class="sk-text">
                        <span class="sk-name">
                          {d.name}
                          {oneEach && (counts.get(g.gemId) ?? 1) > 1 && (
                            <span class="sk-count"> ×{counts.get(g.gemId)}</span>
                          )}
                          {fresh && <span class="sk-new">New</span>}
                        </span>
                        {b && (
                          <span class="sk-sub sk-badges">
                            <Badge p={{ ...b, idle: b.idle?.replace(' on this item', '') }} />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </section>
      </div>
      {tip && <GemTip {...tip} />}
    </div>
  );
}

/**
 * The first support gem in the bag, explained once per device (docs/NEWPLAYER.md N7): what a support does, and whether this one
 * works with the main skill.
 */
function FirstSupport({
  gems,
  ch,
  onSeen,
}: {
  gems: GemItem[];
  ch: Character;
  onSeen: () => void;
}) {
  const g = gems.find((x) => gemDef(x.gemId).kind === 'support');
  if (!g) return null;
  const sup = gemDef(g.gemId);
  const main = ch.primary.gemUid !== null ? ch.primary.skill : null;
  const fits =
    sup.kind === 'support' &&
    !!main &&
    typesAllow(sup, new Set(main.types)) &&
    supportLive(sup, main).live;
  return (
    <div class="tip" data-paint="panel" data-thin>
      <div class="tip-text">
        Support gems modify the skills socketed in the same item.
        {fits && ` Try placing ${main!.name} with ${sup.name} in the same item.`}
      </div>
      <button class="btn small" onClick={onSeen}>
        Got it
      </button>
    </div>
  );
}
