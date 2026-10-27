import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { EquipSlot, InventoryItem } from '../data/types';
import type { Controller } from '../run/controller';
import { discardedValue, salvageDiscarded, salvage, salvageValue } from '../run/craft';
import {
  canEquip,
  discardToPile,
  dryEquip,
  equip,
  equipFlask,
  putBack,
  slotsFor,
  socketGem,
  unequip,
  unequipFlask,
} from '../run/inventory';
import {
  filterItems,
  flaskTarget,
  isUpgrade,
  itemInfos,
  type ItemInfo,
  junkItems,
  quickEquip,
  searchText,
  skillsLost,
  swapSockets,
  type SocketRef,
  sortItems,
} from '../run/inventoryOps';
import { Character } from '../calc/character';
import { gemDef } from '../data/gems';
import { isFavourite, markSeen, toggleFavourite } from '../run/found';
import { ask } from './Confirm';
import { CleanUp } from './CleanUp';
import { useViewport } from './device';
import { Gear, gearSummary, type SlotMark } from './Gear';
import { ItemDetail, type Sel } from './ItemDetail';
import { ItemList, type ListSort, type View, type What } from './ItemList';
import { itemTitle } from './ItemCard';
import { loadPref, savePref } from './prefs';
import { matchesTerms, searchTerms } from './search';

type Drag = { kind: 'inv'; uid: number } | { kind: 'slot'; slot: EquipSlot } | null;

const WHATS: What[] = ['all', 'weapon', 'armour', 'jewellery', 'flask', 'gem'];
const VIEWS: View[] = ['all', 'new', 'upgrades', 'last', 'fav', 'discarded'];

/** The filters were one row of chips once (`inv.filter`); a saved value from then is read as either half. */
function loadWhat(): What {
  const w = loadPref<string>('inv.what', loadPref<string>('inv.filter', 'all'));
  return WHATS.includes(w as What) ? (w as What) : 'all';
}
function loadView(): View {
  const v = loadPref<string>('inv.view', loadPref<string>('inv.filter', 'all'));
  return VIEWS.includes(v as View) ? (v as View) : 'all';
}

/**
 * The Items tab (docs/ITEMS.md section 3). One selection at a time, always shown in the detail panel: a carried item is
 * compared with every slot it could go into, and what an action moves is said before and after. Hovering a row only
 * outlines the slots it fits.
 */
export function Items({
  c,
  focus,
  onCraft,
  onEditGems,
  startView,
}: {
  c: Controller;
  /** Select this item when it changes (set by the Workbench's "Show in Items"). */
  focus?: { uid: number; n: number } | null;
  /** Open the Workbench with this item. */
  onCraft?: (uid: number) => void;
  /** Open the Skills tab at the sockets of this slot. */
  onEditGems?: (slot: EquipSlot) => void;
  /**
   * Open on this view with every kind of item shown, for this visit only: the player's own filters are not overwritten
   * (the camp opens on the last map's drops after a map, docs/STREAMLINE.md S2).
   */
  startView?: View;
}) {
  const run = c.run!;
  const { layout, coarse } = useViewport();
  const phone = layout === 'phone';
  const [sel, setSel] = useState<Sel | null>(null);
  const [peek, setPeek] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ListSort>(() => loadPref<ListSort>('inv.sort', 'newest'));
  const [desc, setDesc] = useState<boolean>(() => loadPref<boolean>('inv.desc', false));
  const [what, setWhat] = useState<What>(() => (startView ? 'all' : loadWhat()));
  const [view, setView] = useState<View>(() => startView ?? loadView());
  // A visit opened on `startView` saves the filters only once the player changes them.
  const keepWhat = useRef(startView !== undefined);
  const keepView = useRef(startView !== undefined);
  const [cleaning, setCleaning] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  // Where the picked bag item is aimed (a slot, or a flask slot): a lit slot on the reliquary or a tab re-aims it, and
  // Wear puts it there. Unset, it is the best slot.
  const [aim, setAim] = useState<{ uid: number; slot?: EquipSlot; idx?: number } | null>(null);
  // A new pick starts aimed at the best slot again.
  useEffect(() => setAim(null), [sel]);
  // The item a swap just took off, for its caption.
  const [justOff, setJustOff] = useState<number | null>(null);
  useEffect(() => savePref('inv.sort', sort), [sort]);
  useEffect(() => savePref('inv.desc', desc), [desc]);
  useEffect(() => {
    if (keepWhat.current) keepWhat.current = false;
    else savePref('inv.what', what);
  }, [what]);
  useEffect(() => {
    if (keepView.current) keepView.current = false;
    else savePref('inv.view', view);
  }, [view]);

  // An item stays NEW until the player looks at it (selects it) or marks everything seen.
  const unseen = useMemo(() => new Set(run.unseen), [run.unseen]);
  const favs = useMemo(() => new Set(run.favourites), [run.favourites]);
  useEffect(() => {
    if (sel?.from === 'inv' && run.unseen.includes(sel.uid)) c.act((r) => markSeen(r, [sel.uid]));
  }, [sel]);

  // The bag and the pile are changed in place, so their sizes stand in for "it changed" next to the references.
  const pile = run.discarded ?? [];
  const rev = `${run.inventory.length}:${pile.length}`;
  const infos = useMemo(() => itemInfos(run), [run.build, run.inventory, rev]);
  // The discarded pile: rows like the bag's, with their own facts (what each would be worth worn is still shown).
  const pileInfos = useMemo(
    () => itemInfos({ ...run, inventory: pile }),
    [run.build, run.discarded, rev],
  );
  const listInfos = useMemo(() => new Map([...infos, ...pileInfos]), [infos, pileInfos]);
  const lastDrops = useMemo(() => new Set(run.lastDrops ?? []), [run.lastDrops]);
  const counts = useMemo(
    () => ({
      new: run.inventory.filter((x) => unseen.has(x.uid)).length,
      upgrades: run.inventory.filter((x) => isUpgrade(infos.get(x.uid)!)).length,
      last: run.inventory.filter((x) => lastDrops.has(x.uid)).length,
      fav: run.inventory.filter((x) => favs.has(x.uid)).length,
      discarded: pile.length,
    }),
    [run.inventory, run.discarded, rev, infos, unseen, lastDrops, favs],
  );
  // Opened on the upgrades after a level: with none, the last map's drops (or everything) instead of an empty list.
  useEffect(() => {
    if (startView === 'upgrades' && view === 'upgrades' && counts.upgrades === 0)
      setView(counts.last ? 'last' : 'all');
  }, []);
  const terms = searchTerms(search);
  const visible = useMemo(() => {
    let pool: InventoryItem[] = view === 'discarded' ? pile : run.inventory;
    if (view === 'new') pool = pool.filter((x) => unseen.has(x.uid));
    else if (view === 'last') pool = pool.filter((x) => lastDrops.has(x.uid));
    else if (view === 'fav') pool = pool.filter((x) => favs.has(x.uid));
    else if (view === 'upgrades') pool = filterItems(pool, infos, 'upgrades');
    if (what !== 'all') pool = filterItems(pool, listInfos, what);
    if (terms.length) pool = pool.filter((x) => matchesTerms(searchText(x), terms));
    const sorted = sortItems(pool, listInfos, sort === 'fav' ? 'newest' : sort, desc);
    // Sorted by favourites: the starred ones first, newest first inside both groups.
    return sort === 'fav'
      ? [...sorted.filter((x) => favs.has(x.uid)), ...sorted.filter((x) => !favs.has(x.uid))]
      : sorted;
  }, [
    run.inventory,
    run.discarded,
    rev,
    listInfos,
    sort,
    desc,
    what,
    view,
    search,
    lastDrops,
    unseen,
    favs,
  ]);
  const junk = useMemo(() => junkItems(run), [run.build, run.inventory, rev]);

  // Keep the selected row in view (above the sheet on a phone) when the selection changes.
  useEffect(() => {
    if (sel?.from === 'inv' || sel?.from === 'pile')
      document.querySelector('.ix-row.sel')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const lookup = (s: Sel | null): InventoryItem | null => {
    if (!s) return null;
    if (s.from === 'inv') return run.inventory.find((x) => x.uid === s.uid) ?? null;
    if (s.from === 'pile') return pile.find((x) => x.uid === s.uid) ?? null;
    if (s.from === 'slot') return run.build.equipment[s.slot] ?? null;
    return run.build.flasks[s.idx] ?? null;
  };
  const selected = lookup(sel);
  // The selection can vanish under us (an undo, a salvage): then there is nothing selected.
  useEffect(() => {
    if (sel && !selected) setSel(null);
  }, [sel, selected]);

  // "Show in Items" from the Workbench.
  useEffect(() => {
    if (!focus) return;
    if (run.inventory.some((x) => x.uid === focus.uid)) setSel({ from: 'inv', uid: focus.uid });
    else {
      const slot = (Object.keys(run.build.equipment) as EquipSlot[]).find(
        (s) => run.build.equipment[s]?.uid === focus.uid,
      );
      if (slot) setSel({ from: 'slot', slot });
    }
    setSearch('');
    setWhat('all');
    setView('all');
  }, [focus?.n]);

  const after = (r: { ok: boolean; reason?: string } | void, ok: () => void) => {
    if (r && r.ok) ok();
  };

  const equipTo = async (uid: number, slot: EquipSlot) => {
    const item = run.inventory.find((x) => x.uid === uid);
    if (!item) return;
    const dry = dryEquip(run, uid, slot);
    // A swap that takes a skill away asks first (docs/NEWPLAYER.md N8).
    const lost = skillsLost(swapSockets(run, uid, slot));
    if (lost.length) {
      const primary = new Character(run.build).primary.gemUid;
      const ok = await ask({
        title: `Wear ${itemTitle(item)}?`,
        body:
          lost.length === 1
            ? `${gemDef(lost[0].gem.gemId).name} stops working.`
            : 'These skills stop working.',
        facts: lost.map(
          (l) =>
            `${gemDef(l.gem.gemId).name}${l.gem.uid === primary ? ' (your main skill)' : ''} ${l.why}`,
        ),
        confirm: 'Wear it',
        danger: lost.some((l) => l.gem.uid === primary),
      });
      if (!ok || c.run !== run || !run.inventory.some((x) => x.uid === uid)) return;
    }
    const r = c.act((rn) => equip(rn, uid, slot));
    after(r, () => {
      const back = dry.toBag;
      // Next you want to know whether the old one was worth keeping: select it.
      setSel(back.length ? { from: 'inv', uid: back[0].uid } : { from: 'slot', slot });
      setJustOff(back.length ? back[0].uid : null);
    });
  };
  const equipFlaskTo = (uid: number, idx: number) => {
    const old = run.build.flasks[idx];
    const r = c.act((rn) => equipFlask(rn, uid, idx));
    after(r === undefined ? undefined : { ok: !!r }, () => {
      setSel(old ? { from: 'inv', uid: old.uid } : { from: 'flask', idx });
    });
  };
  const doQuick = (uid: number) => {
    const it = run.inventory.find((x) => x.uid === uid);
    if (!it) return;
    if (it.kind === 'item') {
      const slot = infos.get(uid)?.slot;
      return slot && equipTo(uid, slot);
    }
    if (it.kind === 'flask') {
      if (!infos.get(uid)?.equippable) return;
      return equipFlaskTo(uid, flaskTarget(run, it));
    }
    const r = c.act((rn) => quickEquip(rn, uid));
    after(r, () => {
      setSel(null);
    });
  };
  /** Put a bag gem in a chosen socket; a gem that was there goes to the bag. */
  const socketAt = (uid: number, ref: SocketRef) => {
    const gem = run.inventory.find((x) => x.uid === uid);
    if (gem?.kind !== 'gem') return;
    if (c.act((rn) => socketGem(rn, ref.slot, ref.socket, uid))) setSel(null);
  };
  const unequipSlot = (slot: EquipSlot) => {
    const it = run.build.equipment[slot];
    c.act((r) => unequip(r, slot));
    if (it) {
      setSel({ from: 'inv', uid: it.uid });
    }
  };
  const unequipFlaskAt = (idx: number) => {
    const f = run.build.flasks[idx];
    c.act((r) => unequipFlask(r, idx));
    if (f) {
      setSel({ from: 'inv', uid: f.uid });
    }
  };
  const star = (uid: number) => c.act((r) => toggleFavourite(r, uid));
  /** Keep the selection moving through the list so repeated removals are quick. */
  const stepAfter = (uid: number): Sel | null => {
    const i = visible.findIndex((x) => x.uid === uid);
    const next = visible[i + 1] ?? visible[i - 1];
    return next ? { from: 'inv', uid: next.uid } : null;
  };
  const doDiscard = async (uid: number) => {
    const it = run.inventory.find((x) => x.uid === uid);
    if (!it) return;
    if (
      isFavourite(run, uid) &&
      !(await ask({
        title: 'Discard a favourite?',
        body: `${itemTitle(it)} is starred.`,
        confirm: 'Discard it',
        danger: true,
      }))
    )
      return;
    const next = stepAfter(uid);
    c.act((r) => discardToPile(r, uid));
    setSel(next);
  };
  const doPutBack = (uid: number) => {
    const it = pile.find((x) => x.uid === uid);
    if (!it) return;
    const i = visible.findIndex((x) => x.uid === uid);
    const next = visible[i + 1] ?? visible[i - 1];
    c.act((r) => putBack(r, uid));
    setSel(next ? { from: 'pile', uid: next.uid } : null);
  };
  /** Salvage everything discarded: the one step that cannot be taken back. */
  const salvageAllDiscarded = async () => {
    if (!pile.length) return;
    const dust = discardedValue(run);
    const ok = await ask({
      title: 'Salvage everything discarded?',
      body: 'Every discarded item is broken down for good. This cannot be undone.',
      facts: [`${pile.length} item${pile.length > 1 ? 's' : ''}`, `${dust} Bone Dust`],
      confirm: `Salvage ${pile.length} for ${dust} Bone Dust`,
      danger: true,
    });
    if (!ok) return;
    c.craft((r) => salvageDiscarded(r));
    setSel(null);
    if (view === 'discarded') setView('all');
  };
  const salvageJunk = async () => {
    if (!junk.length) return;
    const dust = junk.reduce((n, x) => n + salvageValue(x), 0);
    const ok = await ask({
      title: 'Salvage the junk?',
      body: 'Every normal or magic item that is not an upgrade and not a favourite is broken down for good.',
      facts: [`${junk.length} item${junk.length > 1 ? 's' : ''}`, `${dust} Bone Dust`],
      confirm: `Salvage ${junk.length} for ${dust} Bone Dust`,
      danger: true,
    });
    if (!ok) return;
    c.craft((r) => junk.forEach((x) => salvage(r, x.uid)));
    setSel(null);
  };
  const step = (dir: -1 | 1) => {
    const from = view === 'discarded' ? 'pile' : 'inv';
    const cur = sel?.from === from ? visible.findIndex((x) => x.uid === sel.uid) : -1;
    const n = Math.max(0, Math.min(visible.length - 1, cur + dir));
    if (visible[n]) setSel({ from, uid: visible[n].uid });
  };
  const bestUpgrade = () => {
    // Gear by how much it adds; a flask only when no gear is better.
    const rank = (i: ItemInfo) =>
      (i.fillsFlask || i.flaskSlot !== undefined) && i.scorePct <= 0.5 ? -1 : i.scorePct;
    let best: InventoryItem | null = null;
    for (const x of run.inventory) {
      const i = infos.get(x.uid)!;
      if (isUpgrade(i) && (!best || rank(i) > rank(infos.get(best.uid)!))) best = x;
    }
    if (!best) return;
    setSearch('');
    setWhat('all');
    setView('upgrades');
    setSel({ from: 'inv', uid: best.uid });
  };

  // Slots the selected (or dragged) carried item can go into.
  const carried =
    drag?.kind === 'inv'
      ? (run.inventory.find((x) => x.uid === drag.uid) ?? null)
      : sel?.from === 'inv'
        ? selected
        : null;
  const targets = new Map<EquipSlot, SlotMark>();
  if (carried?.kind === 'item')
    for (const s of slotsFor(carried)) targets.set(s, canEquip(run, carried, s));
  const flaskTargets = carried?.kind === 'flask';
  const peeked = peek !== null ? run.inventory.find((x) => x.uid === peek) : null;
  const peekSlots = new Set<EquipSlot>(peeked?.kind === 'item' ? slotsFor(peeked) : []);

  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'SELECT' || tag === 'INPUT') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      step(e.key === 'ArrowDown' ? 1 : -1);
    } else if ((e.key === 'Enter' || e.key === 'e') && sel?.from === 'inv') {
      doQuick(sel.uid);
    } else if ((e.key === 'u' || e.key === 'Backspace') && sel?.from === 'slot') {
      unequipSlot(sel.slot);
    } else if ((e.key === 'u' || e.key === 'Backspace') && sel?.from === 'flask') {
      unequipFlaskAt(sel.idx);
    } else if ((e.key === 'Delete' || e.key === 'x') && sel?.from === 'inv') {
      void doDiscard(sel.uid);
    } else if (e.key === 'f' && sel?.from === 'inv') {
      star(sel.uid);
    } else if (e.key === 'Escape') setSel(null);
  };

  // A slot the picked bag item fits is a place to aim it (the comparison follows; Wear puts it there); any other slot
  // shows what is worn there.
  const onSlot = (slot: EquipSlot) => {
    if (sel?.from === 'inv' && targets.get(slot)) setAim({ uid: sel.uid, slot });
    else setSel({ from: 'slot', slot });
  };
  const onFlask = (idx: number) => {
    if (sel?.from === 'inv' && flaskTargets) setAim({ uid: sel.uid, idx });
    else setSel({ from: 'flask', idx });
  };

  const info = sel?.from === 'inv' ? infos.get(sel.uid) : undefined;
  const aimed = sel?.from === 'inv' && aim?.uid === sel.uid ? aim : null;
  const aimSlot =
    aimed?.slot ?? (sel?.from === 'inv' && targets.size ? (info?.slot ?? null) : null);
  const aimFlask =
    aimed?.idx ??
    (sel?.from === 'inv' && flaskTargets && selected?.kind === 'flask'
      ? flaskTarget(run, selected)
      : null);
  const showGear = !phone || gearOpen;
  return (
    <div class="ix" tabIndex={0} onKeyDown={onKey}>
      {cleaning && <CleanUp c={c} onClose={() => setCleaning(false)} />}
      <section class="ix-gearcol" aria-label="Worn gear">
        {phone && (
          <button
            class="ix-gear-toggle"
            aria-expanded={gearOpen}
            onClick={() => setGearOpen(!gearOpen)}
          >
            {gearSummary(run)} {gearOpen ? '▴' : '▾'}
          </button>
        )}
        {showGear && (
          <Gear
            run={run}
            selSlot={sel?.from === 'slot' ? sel.slot : null}
            selFlask={sel?.from === 'flask' ? sel.idx : null}
            targets={targets}
            peek={peekSlots}
            flaskTargets={flaskTargets}
            aimSlot={aimSlot}
            aimFlask={aimFlask}
            dragging={drag !== null}
            onSlot={onSlot}
            onFlask={onFlask}
            onUnequip={unequipSlot}
            onUnequipFlask={unequipFlaskAt}
            onDragSlot={(slot) => setDrag(slot ? { kind: 'slot', slot } : null)}
            onDropSlot={(slot) => drag?.kind === 'inv' && equipTo(drag.uid, slot)}
          />
        )}
      </section>
      <section class={'ix-detailcol' + (selected ? ' has-sel' : '')} aria-label="Selected item">
        <ItemDetail
          run={run}
          sel={sel}
          selected={selected}
          info={info}
          favourite={selected ? favs.has(selected.uid) : false}
          upgrades={counts.upgrades}
          onBestUpgrade={bestUpgrade}
          aimSlot={aimed?.slot ?? null}
          justOff={justOff}
          aimFlask={aimed?.idx ?? null}
          onAim={(slot, idx) => sel?.from === 'inv' && setAim({ uid: sel.uid, slot, idx })}
          coarse={coarse}
          phone={phone}
          onEquip={equipTo}
          onEquipFlask={equipFlaskTo}
          onUnequip={unequipSlot}
          onUnequipFlask={unequipFlaskAt}
          onFavourite={star}
          onPutBack={doPutBack}
          onDiscard={(uid) => void doDiscard(uid)}
          onSocket={doQuick}
          onSocketAt={socketAt}
          onCraft={(uid) => onCraft?.(uid)}
          onEditGems={onEditGems}
          onClose={() => setSel(null)}
          onStep={step}
        />
      </section>
      <section class="ix-listcol" aria-label="Bag">
        <ItemList
          rows={visible}
          infos={listInfos}
          selUid={sel?.from === 'inv' || sel?.from === 'pile' ? sel.uid : null}
          favs={favs}
          unseen={unseen}
          coarse={coarse}
          phone={phone}
          total={run.inventory.length}
          counts={counts}
          discardedDust={discardedValue(run)}
          onSalvageDiscarded={() => void salvageAllDiscarded()}
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSort={setSort}
          desc={desc}
          setDesc={setDesc}
          what={what}
          setWhat={setWhat}
          view={view}
          setView={setView}
          unseenCount={counts.new}
          junkCount={junk.length}
          onMarkSeen={() => c.act((r) => markSeen(r, 'all'))}
          onCleanUp={() => setCleaning(true)}
          onSalvageJunk={() => void salvageJunk()}
          onSelect={(uid) => setSel({ from: view === 'discarded' ? 'pile' : 'inv', uid })}
          onQuick={doQuick}
          onPeek={setPeek}
          onDrag={(uid) => setDrag(uid === null ? null : { kind: 'inv', uid })}
          onDropOnList={() => {
            if (drag?.kind === 'slot') unequipSlot(drag.slot);
            setDrag(null);
          }}
          dragFromSlot={drag?.kind === 'slot'}
        />
      </section>
    </div>
  );
}
