import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { sheetDps, type Character } from '../calc/character';
import { naturalGemLevel } from '../calc/gems';
import { weaponBar } from '../data/weaponFit';
import { gemDef, type GemDef } from '../data/gems';
import { typesAllow } from '../data/skillTypes';
import { supportLive } from '../calc/reach';
import { EQUIP_SLOTS, type EquipSlot, type GemItem } from '../data/types';
import type { Controller } from '../run/controller';
import { setPrimary, socketGem, unsocketGem } from '../run/inventory';
import { sheetOf } from '../run/bot';
import { foundLastLevel } from '../run/found';
import { gemStatus } from '../run/gemStatus';
import {
  bestPlacement,
  mainLostByMove,
  mainLostBySocketing,
  moveGem,
  movesFor,
  placementsFor,
  quickSocket,
  slotLabel,
  type Placement,
  type SocketRef,
} from '../run/inventoryOps';

import { ask } from './Confirm';
import { useViewport } from './device';
import { GemTip } from './GemCard';
import { infoProps } from './info';
import { gemCardData } from './gemText';
import { loadPref, savePref } from './prefs';
import { matchesTerms, searchTerms } from './search';
import { useRehearsal } from './rehearsal';
import { introSeen, seeIntro } from './intro';
import { SupportsPicker } from './SupportsPicker';

const GEM_GROUPS = ['Skills', 'Utility skills', 'Supports', 'Auras'] as const;

/** The inventory heading a gem sits under: damage skills, the utility skills a policy casts, supports, auras. */
function groupOfGem(d: GemDef): (typeof GEM_GROUPS)[number] {
  if (d.kind === 'active') return d.utility ? 'Utility skills' : 'Skills';
  if (d.kind === 'support') return 'Supports';
  return 'Auras';
}

/**
 * What is picked (docs/GEM-SOCKETS.md 2): a gem in the bag, a socketed gem, or an empty socket. A tap picks; a tap on a lit
 * place puts the picked gem there; a tap on the picked thing lets go.
 */
type Pick = { from: 'inv'; uid: number } | ({ from: 'socket' | 'empty' } & SocketRef);
/** What a mouse drags: a gem in the bag or a socketed gem. */
type Drag = { from: 'inv'; uid: number } | ({ from: 'socket' } & SocketRef);

/** How long the badges are worked on at a time before the screen gets its turn, in milliseconds. */
const BADGE_SLICE_MS = 8;
/** How long after the last change they wait before they start, in milliseconds. */
const BADGE_DELAY_MS = 250;

const sameSocket = (a: SocketRef, b: SocketRef) => a.slot === b.slot && a.socket === b.socket;
const keyOf = (r: SocketRef) => `${r.slot}:${r.socket}`;
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
 * What a gem would do in a place, in as few words as it takes: the DPS change bare ("▲12%"), the EHP change named, "no
 * effect" when neither moves (an idle support's reason is its tip). `swap` says the place holds a gem that would leave.
 */
function Delta({ p, swap }: { p: Placement; swap?: boolean }) {
  const parts: [string, number][] = [
    ['', p.dpsPct],
    [' EHP', p.ehpPct],
  ];
  const shown = parts.filter(([, v]) => Math.abs(v) >= 0.5);
  return (
    <span class="sk-delta" title={p.idle}>
      {swap && <span class="sk-swap">Swap </span>}
      {shown.length === 0 ? (
        <span class="badge neutral">no effect</span>
      ) : (
        shown.map(([l, v]) => (
          <span key={l} class={'badge ' + (v > 0 ? 'up' : 'down')}>
            {v > 0 ? '▲' : '▼'}
            {Math.abs(Math.round(v))}%{l}
          </span>
        ))
      )}
    </span>
  );
}

/**
 * The Skills tab, in Gold Leaf (docs/GEM-SOCKETS.md; docs/mockups/style/STYLE-GUIDE.md): the gear on the left and the gem bag
 * on the right, each scrolling on its own, the DPS and effective HP above (medallions on a desktop, one line on a phone), and a
 * bar at the bottom with what is picked and its buttons. A tap picks a gem or a socket; every place it can go lights and says
 * what it would do; a tap on one does it (only losing the main skill asks first; Undo takes any of it back). Gems drag
 * between sockets and the bag with a mouse.
 */
export function Skills({
  c,
  ch,
  focusSlot,
  focusGem,
}: {
  c: Controller;
  ch: Character;
  /** Scroll to the sockets of this slot when the tab opens. */
  focusSlot?: EquipSlot | null;
  /** Pick this bag gem when it changes (the Items tab's Socket): every place it can go lights. */
  focusGem?: { uid: number; n: number } | null;
}) {
  const run = c.run!;
  const { coarse, layout } = useViewport();
  const phone = layout === 'phone';
  const [pick, setPick] = useState<Pick | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [card, setCard] = useState(false);
  const [supportsFor, setSupportsFor] = useState<SocketRef | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hint, setHint] = useState(() => !loadPref<boolean>('skills.hintSeen', false));
  const [supportSeen, setSupportSeen] = useState(() => introSeen('support'));
  // A copy painted ahead out of sight (rehearsal.ts) has not been seen.
  const rehearsal = useRehearsal();
  useEffect(() => {
    if (!rehearsal) savePref('skills.hintSeen', true);
  }, []);
  useEffect(() => {
    setCard(false);
    setMsg('');
  }, [pick]);
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
  // A pick that no longer exists (the gem left the bag, the socket emptied by an undo) lets go.
  useEffect(() => {
    if (!pick) return;
    if (pick.from === 'inv' ? !gems.some((g) => g.uid === pick.uid) : !socketAt(pick))
      setPick(null);
    else if (pick.from !== 'inv' && !!socketAt(pick)?.gem !== (pick.from === 'socket'))
      setPick({ ...pick, from: pick.from === 'socket' ? 'empty' : 'socket' });
  }, [gemKey, run.build]);
  // The list's filters (kept between visits): one of each gem, and only what the weapons in hand can use. They are kept across
  // runs, and the filters are only offered for a bag of some size, so a filter left over from an earlier run must not act on
  // a bag that cannot show it.
  const searchShown = gems.length > 8;
  const filtersShown = gems.length > 1;
  const terms = searchShown ? searchTerms(q) : [];
  const [oneEachSet, setOneEach] = useState(() => loadPref('gemOneEach', false));
  const [usableSet, setUsableOnly] = useState(() => loadPref('gemUsable', false));
  const oneEach = filtersShown && oneEachSet;
  const usableOnly = filtersShown && usableSet;
  const hold = ch.weaponHold();
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
    if (!terms.length) return true;
    const d = gemCardData(def, 20);
    return matchesTerms(
      `${d.name} ${d.type} ${d.tags.join(' ')} ${d.description}`.toLowerCase(),
      terms,
    );
  });
  const levelOf = (uid: number) => ch.gems.find((g) => g.gem.uid === uid)?.level ?? 1;
  const bagLevel = (d: GemDef) => naturalGemLevel(d, run.build.level, ch.attrs);
  function socketAt(r: SocketRef): { gem: GemItem | null } | null {
    const it = run.build.equipment[r.slot];
    return it && r.socket < it.sockets.length ? { gem: it.sockets[r.socket] ?? null } : null;
  }

  // The gem being placed (picked or dragged), and what each socket would make of it: a gem from the bag going in, or a socketed
  // gem moving (a swap with what is there).
  const src: Drag | null = drag ?? (pick && pick.from !== 'empty' ? (pick as Drag) : null);
  const srcKey = !src ? '' : src.from === 'inv' ? `i${src.uid}` : `s${keyOf(src)}`;
  const targets = useMemo(() => {
    const m = new Map<string, Placement>();
    if (!src) return m;
    const ps = src.from === 'inv' ? placementsFor(run, src.uid) : movesFor(run, src);
    for (const p of ps) m.set(keyOf(p), p);
    return m;
  }, [srcKey, run.build, gemKey]);
  // The socket picked, when one is: each bag gem's badge says what it would do there (docs/GEM-SOCKETS.md K6).
  const atSocket: SocketRef | null =
    pick && pick.from !== 'inv' ? { slot: pick.slot, socket: pick.socket } : null;
  const mode = atSocket ? keyOf(atSocket) : '';
  // Each bag gem's badge: its best placement, or what it would do in the picked socket. Each is a few sheets, so they are worked
  // out a little at a time after the screen has been drawn; badges of another mode are not shown while the new ones come.
  const [badges, setBadges] = useState<{ mode: string; m: Map<number, Placement | null> }>(() => ({
    mode: '',
    m: new Map(),
  }));
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
      while (at < uids.length && performance.now() - t0 < BADGE_SLICE_MS) {
        const uid = uids[at++];
        done.set(
          uid,
          atSocket
            ? (placementsFor(run, uid, { base, at: atSocket })[0] ?? null)
            : bestPlacement(run, uid, base),
        );
      }
      setBadges((prev) => {
        const m = new Map<number, Placement | null>();
        if (prev.mode === mode) for (const [uid, p] of prev.m) if (alive.has(uid)) m.set(uid, p);
        for (const [uid, p] of done) m.set(uid, p);
        return { mode, m };
      });
      if (at < uids.length) timer = setTimeout(step, 0);
    };
    // (After a pause: a run of moves does not start the work again with every one. A socket picked is answered at once.)
    timer = setTimeout(step, atSocket ? 0 : BADGE_DELAY_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [gems, run.build, mode]);
  const badgeOf = (uid: number) => (badges.mode === mode ? badges.m.get(uid) : undefined);
  // The order of the bag for a picked socket: by what the badges show (DPS and EHP together).
  const gain = (p: Placement | null | undefined) =>
    p ? (100 + p.dpsPct) * (100 + p.ehpPct) : -Infinity;
  // With a socket picked and every badge in, the bag is ordered best first within each heading.
  const ranked = !!atSocket && badges.mode === mode && gems.every((g) => badges.m.has(g.uid));

  const done = () => {
    setPick(null);
    setDrag(null);
    setOver(null);
  };
  /** The question before a change that takes the main skill away; true to go on. */
  const mainOk = async (lost: string | null) =>
    !lost ||
    (await ask({
      title: 'Lose your main skill?',
      body: `${lost} will no longer be used.`,
      confirm: 'Swap',
      danger: true,
    }));
  // A no to the question keeps the pick, so another place can be tapped.
  const putIn = async (to: SocketRef, uid: number) => {
    setDrag(null);
    setOver(null);
    if (!(await mainOk(mainLostBySocketing(run, to, uid)))) return;
    done();
    c.act((r) => socketGem(r, to.slot, to.socket, uid));
  };
  const move = async (from: SocketRef, to: SocketRef) => {
    setDrag(null);
    setOver(null);
    if (sameSocket(from, to)) return done();
    if (!(await mainOk(mainLostByMove(run, from, to)))) return;
    done();
    if (!c.act((r) => moveGem(r, from, to))) setMsg('Cannot move the gem there');
  };
  const takeOut = (from: SocketRef) => {
    done();
    c.act((r) => unsocketGem(r, from.slot, from.socket));
  };
  const place = (to: SocketRef, from: Drag) =>
    from.from === 'inv' ? putIn(to, from.uid) : move(from, to);

  const onSocketTap = (ref: SocketRef, filled: boolean) => {
    if (pick && pick.from !== 'inv' && sameSocket(pick, ref)) return setPick(null);
    if (pick?.from === 'inv') return void putIn(ref, pick.uid);
    if (pick?.from === 'socket') return void move(pick, ref);
    setPick({ from: filled ? 'socket' : 'empty', ...ref });
  };
  const onBagTap = (uid: number) => {
    if (atSocket) return void putIn(atSocket, uid);
    setPick(pick?.from === 'inv' && pick.uid === uid ? null : { from: 'inv', uid });
  };

  // The picked gem, for the bar and its card.
  const picked: { d: GemDef; level: number; uid: number } | null = (() => {
    if (!pick || pick.from === 'empty') return null;
    if (pick.from === 'inv') {
      const g = gems.find((x) => x.uid === pick.uid);
      return g ? { d: gemDef(g.gemId), level: bagLevel(gemDef(g.gemId)), uid: g.uid } : null;
    }
    const g = socketAt(pick)?.gem;
    return g ? { d: gemDef(g.gemId), level: levelOf(g.uid), uid: g.uid } : null;
  })();
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!card || !picked) return;
    const r = barRef.current?.getBoundingClientRect();
    setTip({ gemId: picked.d.id, level: picked.level, x: r ? r.left + 8 : 8, y: r ? r.top : 0 });
  }, [card]);
  useEffect(() => {
    if (!coarse) return;
    const close = () => setTip(null);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [coarse]);

  const tap = coarse ? 'Tap' : 'Click';
  /**
   * The bar: one row, the picked thing's buttons and, when it has one, its problem (why a skill cannot be used, a support does
   * nothing); with nothing picked, what to do. Always the same height.
   */
  const bar: { acts: ComponentChildren; note?: string | null } = (() => {
    const cardBtn = coarse && picked && (
      <button class="btn small" onClick={() => setCard(!card)} aria-pressed={card}>
        Card
      </button>
    );
    const cancel = (
      <button class="btn small" onClick={() => setPick(null)}>
        Cancel
      </button>
    );
    if (pick?.from === 'inv' && picked) {
      return {
        acts: (
          <>
            <button
              class="btn small"
              onClick={() => {
                const ok = c.act((r) => quickSocket(r, pick.uid));
                if (ok) setPick(null);
                else setMsg('No free socket: pick one to swap');
              }}
            >
              Best place
            </button>
            {cardBtn}
            {cancel}
          </>
        ),
      };
    }
    if (pick?.from === 'socket' && picked) {
      const { d, uid } = picked;
      const a = ch.actives.find((x) => x.gemUid === uid);
      const st = gemStatus(ch, uid, d);
      const why = a && !a.usable ? a.reason : st && !st.ok ? st.text : null;
      const canMain = d.kind === 'active' && !d.utility && !!a?.usable;
      return {
        note: why,
        acts: (
          <>
            {d.kind === 'active' && (
              <button
                class="btn small"
                onClick={() => setSupportsFor({ slot: pick.slot, socket: pick.socket })}
              >
                Supports
              </button>
            )}
            {canMain && ch.primary.gemUid !== uid && (
              <button class="btn small" onClick={() => c.act((r) => setPrimary(r, uid))}>
                ★ Make main
              </button>
            )}
            <button class="btn small" onClick={() => takeOut(pick)}>
              Take out
            </button>
            {cardBtn}
            {cancel}
          </>
        ),
      };
    }
    if (pick?.from === 'empty') {
      return { acts: cancel };
    }
    return { acts: null };
  })();
  const note = msg || bar.note;

  const summary = ch.mainSheet();
  const secondary = ch.secondarySheets();
  // The headline is the sheet the socket badges compare against, so a "▲13%" moves it by 13% (docs/NEWPLAYER.md N4).
  const whole = sheetOf(run);
  const rotationTip =
    `${summary.name}${summary.isDefault ? ' (default attack)' : ''} alone: ${f0(summary.totalDps)} DPS.` +
    (secondary.length
      ? ` Every few seconds also ${listOf(secondary.map((x) => x.skill.name))}.`
      : '');
  const mainName = summary.isDefault ? summary.name : `★ ${summary.name}`;
  const filtersOn = +oneEach + +usableOnly;
  const clearFilters = () => {
    setQ('');
    savePref('gemSearch', '');
    setOneEach(false);
    savePref('gemOneEach', false);
    setUsableOnly(false);
    savePref('gemUsable', false);
  };
  // The Items tab's Socket: that gem picked, with whatever hides it cleared, and brought into view.
  useEffect(() => {
    if (!focusGem || rehearsal || !gems.some((g) => g.uid === focusGem.uid)) return;
    if (!shownGems.some((g) => g.uid === focusGem.uid)) clearFilters();
    setPick({ from: 'inv', uid: focusGem.uid });
    requestAnimationFrame(() =>
      document
        .querySelector(`.sk-bagrow[data-uid="${focusGem.uid}"]`)
        ?.scrollIntoView({ block: 'center' }),
    );
  }, [focusGem?.n]);
  return (
    <div
      class="sk"
      onPointerDownCapture={() => {
        // Any tap closes a card shown on a touch screen.
        if (coarse) setTip(null);
      }}
    >
      <div class="sk-top">
        {phone ? (
          <div class="sk-strip">
            <span>
              DPS <b>{f0(sheetDps(whole))}</b>
            </span>
            <span>
              EHP <b>{f0(whole.ehp)}</b>
            </span>
            <i class="sk-mainname" tabIndex={0} {...infoProps(rotationTip)}>
              {mainName}
            </i>
          </div>
        ) : (
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
                {mainName}
              </i>
            </div>
            <div class="sk-medal" data-paint="medal" data-field="porphyry,4">
              <span>Effective HP</span>
              <b>{f0(whole.ehp)}</b>
            </div>
          </div>
        )}
        <button
          class="btn small sk-help"
          aria-label="How this works"
          aria-expanded={hint}
          onClick={() => setHint(!hint)}
        >
          ?
        </button>
      </div>
      {hint && (
        <p class="sk-hint" data-paint="panel" data-thin>
          Skill gems are your character's skills: put them in sockets on your gear. A support gem
          changes the skills in the same item. ★ marks the main skill; the Strategy tab says when
          the others are used.
        </p>
      )}
      {/* One lapis panel for both panes, a gold rule between them. */}
      <div class="sk-cols" data-paint="panel" data-thin>
        <section class="sk-pane sk-gear">
          <div class="sk-scroll">
            {!ch.hasMainSkill && (
              <div class="sk-warn">No usable skill: using the default attack.</div>
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
            <div class="sk-grid">
              {EQUIP_SLOTS.map((slot) => {
                const it = run.build.equipment[slot];
                if (!it || it.sockets.length === 0) return null;
                return (
                  <section
                    key={slot}
                    class={'sk-item' + (focusSlot === slot ? ' focus' : '')}
                    data-slot={slot}
                  >
                    <h4 class="sk-head">
                      <span class="sk-slot">{slotLabel(slot)}</span>
                      {!phone && <span class={RARITY_TEXT[it.rarity] ?? ''}>{it.name}</span>}
                    </h4>
                    <div class="sk-socks">
                      {it.sockets.map((g, i) => {
                        const ref: SocketRef = { slot, socket: i };
                        const key = keyOf(ref);
                        const p = targets.get(key);
                        const isPick = !!pick && pick.from !== 'inv' && sameSocket(pick, ref);
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
                            if (drag) void place(ref, drag);
                          },
                        };
                        const cls = `sk-sock${isPick ? ' on' : ''}${p ? ' aim' : ''}${dropHere ? ' drop' : ''}`;
                        if (!g) {
                          return (
                            <div key={i} class="sk-link">
                              <button
                                class={cls + ' empty'}
                                aria-label={`Empty ${slotLabel(slot)} socket`}
                                onClick={() => onSocketTap(ref, false)}
                                {...common}
                              >
                                <Stone d={null} state={isPick ? 'sel' : p ? 'target' : ''} />
                                <span class="sk-text">
                                  {p ? (
                                    <Delta p={p} />
                                  ) : (
                                    <span class="sk-name sk-empty">{isPick ? 'Empty' : ''}</span>
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
                        const bad =
                          active && !active.usable
                            ? 'Unusable'
                            : status && !status.ok
                              ? 'Idle'
                              : null;
                        return (
                          <div key={i} class="sk-link">
                            <button
                              class={cls}
                              draggable={!coarse}
                              onDragStart={() => setDrag({ from: 'socket', ...ref })}
                              onDragEnd={() => {
                                setDrag(null);
                                setOver(null);
                              }}
                              {...common}
                              {...hoverGem(g.gemId, levelOf(g.uid))}
                              onClick={() => onSocketTap(ref, true)}
                            >
                              <Stone
                                d={d}
                                level={levelOf(g.uid)}
                                state={isPick ? 'sel' : p ? 'target' : ''}
                              />
                              <span class="sk-text">
                                <span class="sk-name">
                                  {primary && <span class="sk-star">★ </span>}
                                  {d.name}
                                </span>
                                {p ? (
                                  <Delta p={p} swap />
                                ) : (
                                  bad && <span class="sk-sub sk-bad">{bad}</span>
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
        </section>
        <span class="sk-divider" aria-hidden="true" />
        <section
          class={'sk-pane sk-bag' + (over === 'inv' ? ' drop' : '')}
          onDragOver={(e) => {
            if (drag?.from === 'socket') {
              e.preventDefault();
              if (over !== 'inv') setOver('inv');
            }
          }}
          onDragLeave={() => over === 'inv' && setOver(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (drag?.from === 'socket') takeOut(drag);
          }}
        >
          {(searchShown || filtersShown) && (
            <div class="sk-find">
              {searchShown && (
                <input
                  class="sk-search"
                  type="text"
                  placeholder="Search"
                  title="Name, tag or type; commas join terms: area, attack"
                  value={q}
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    setQ(v);
                    savePref('gemSearch', v);
                  }}
                />
              )}
              {filtersShown && (
                <button
                  class="btn small sk-filterbtn"
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  Filter{filtersOn ? ` (${filtersOn})` : ''}
                </button>
              )}
            </div>
          )}
          {filtersShown && filtersOpen && (
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
            </div>
          )}
          <div class="sk-scroll">
            {gems.length > 0 && shownGems.length === 0 && (
              <p class="sk-none">
                No gem matches.{' '}
                <button class="btn small" onClick={clearFilters}>
                  Clear filters
                </button>
              </p>
            )}
            {gems.length === 0 && <p class="sk-none">No spare gems.</p>}
            {GEM_GROUPS.map((group) => {
              let list = shownGems.filter((g) => groupOfGem(gemDef(g.gemId)) === group);
              if (!list.length) return null;
              if (ranked)
                list = [...list].sort((a, b) => gain(badgeOf(b.uid)) - gain(badgeOf(a.uid)));
              return (
                <div key={group} class="sk-group">
                  <h5 class="sk-sh">{group}</h5>
                  {list.map((g) => {
                    const d = gemDef(g.gemId);
                    const b = badgeOf(g.uid);
                    const on = pick?.from === 'inv' && pick.uid === g.uid;
                    const fresh = oneEach ? newIds.has(g.gemId) : foundLastLevel(run, g.uid);
                    return (
                      <button
                        key={g.uid}
                        data-uid={g.uid}
                        class={'sk-bagrow' + (on ? ' on' : '') + (atSocket ? ' aim' : '')}
                        draggable={!coarse}
                        {...hoverGem(g.gemId, bagLevel(d))}
                        onDragStart={() => setDrag({ from: 'inv', uid: g.uid })}
                        onDragEnd={() => {
                          setDrag(null);
                          setOver(null);
                        }}
                        onClick={() => onBagTap(g.uid)}
                      >
                        <Stone
                          d={d}
                          level={bagLevel(d)}
                          state={on ? 'sel' : atSocket ? 'target' : ''}
                        />
                        <span class="sk-text">
                          {/* With the New tag the name keeps to one line, cut short if it must be, so the tag stays beside it. */}
                          <span class={'sk-name' + (fresh ? ' tagged' : '')}>
                            <span class="sk-nm">
                              {d.name}
                              {oneEach && (counts.get(g.gemId) ?? 1) > 1 && (
                                <span class="sk-count"> ×{counts.get(g.gemId)}</span>
                              )}
                            </span>
                            {fresh && <span class="sk-new">New</span>}
                          </span>
                          {b && <Delta p={b} swap={!!atSocket && !!b.replaces} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <div class="sk-bar" ref={barRef}>
        {bar.acts && <div class="sk-acts">{bar.acts}</div>}
        {note ? (
          <span class="sk-barsub sk-bad" title={note}>
            {note}
          </span>
        ) : (
          !pick && <span class="sk-barsub">{tap} a gem or a socket</span>
        )}
      </div>
      {supportsFor && (
        <SupportsPicker c={c} at={supportsFor} onClose={() => setSupportsFor(null)} />
      )}
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
