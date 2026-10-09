import { useEffect, useMemo, useState } from 'preact/hooks';
import type { EquipSlot, InventoryItem } from '../data/types';
import type { Controller } from '../run/controller';
import { salvage, salvageValue } from '../run/craft';
import {
  canEquip,
  discard,
  dryEquip,
  equip,
  equipFlask,
  slotsFor,
  unequip,
  unequipFlask,
} from '../run/inventory';
import {
  filterItems,
  flaskTarget,
  isUpgrade,
  itemInfos,
  junkItems,
  quickEquip,
  searchText,
  slotName,
  sortItems,
  type SortKey,
} from '../run/inventoryOps';
import { isFavourite, markSeen, toggleFavourite } from '../run/found';
import { ask } from './Confirm';
import { CleanUp } from './CleanUp';
import { useViewport } from './device';
import { Gear, gearSummary, type SlotMark } from './Gear';
import { ItemDetail, type Sel, type Status } from './ItemDetail';
import { ItemList, type View, type What } from './ItemList';
import { itemTitle } from './ItemCard';
import { loadPref, savePref } from './prefs';

type Drag = { kind: 'inv'; uid: number } | { kind: 'slot'; slot: EquipSlot } | null;

const WHATS: What[] = ['all', 'weapon', 'armour', 'jewellery', 'flask', 'gem'];
const VIEWS: View[] = ['all', 'new', 'upgrades', 'last', 'fav'];

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
}: {
  c: Controller;
  /** Select this item when it changes (set by the Workbench's "Show in Items"). */
  focus?: { uid: number; n: number } | null;
  /** Open the Workbench with this item. */
  onCraft?: (uid: number) => void;
}) {
  const run = c.run!;
  const { layout, coarse } = useViewport();
  const phone = layout === 'phone';
  const [sel, setSel] = useState<Sel | null>(null);
  const [peek, setPeek] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [status, setStatus] = useState<Status>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>(() => loadPref<SortKey>('inv.sort', 'newest'));
  const [desc, setDesc] = useState<boolean>(() => loadPref<boolean>('inv.desc', false));
  const [what, setWhat] = useState<What>(loadWhat);
  const [view, setView] = useState<View>(loadView);
  const [pinFav, setPinFav] = useState<boolean>(() => loadPref<boolean>('inv.pinFav', true));
  const [cleaning, setCleaning] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  useEffect(() => savePref('inv.pinFav', pinFav), [pinFav]);
  useEffect(() => savePref('inv.sort', sort), [sort]);
  useEffect(() => savePref('inv.desc', desc), [desc]);
  useEffect(() => savePref('inv.what', what), [what]);
  useEffect(() => savePref('inv.view', view), [view]);

  // An item stays NEW until the player looks at it (selects it) or marks everything seen.
  const unseen = useMemo(() => new Set(run.unseen), [run.unseen]);
  const favs = useMemo(() => new Set(run.favourites), [run.favourites]);
  useEffect(() => {
    if (sel?.from === 'inv' && run.unseen.includes(sel.uid)) c.act((r) => markSeen(r, [sel.uid]));
  }, [sel]);

  const infos = useMemo(() => itemInfos(run), [run.build, run.inventory]);
  const lastDrops = useMemo(() => new Set(run.lastDrops ?? []), [run.lastDrops]);
  const counts = useMemo(
    () => ({
      new: run.inventory.filter((x) => unseen.has(x.uid)).length,
      upgrades: run.inventory.filter((x) => isUpgrade(infos.get(x.uid)!)).length,
      last: run.inventory.filter((x) => lastDrops.has(x.uid)).length,
      fav: run.inventory.filter((x) => favs.has(x.uid)).length,
    }),
    [run.inventory, infos, unseen, lastDrops, favs],
  );
  const q = search.trim().toLowerCase();
  const visible = useMemo(() => {
    let pool: InventoryItem[] = run.inventory;
    if (view === 'new') pool = pool.filter((x) => unseen.has(x.uid));
    else if (view === 'last') pool = pool.filter((x) => lastDrops.has(x.uid));
    else if (view === 'fav') pool = pool.filter((x) => favs.has(x.uid));
    else if (view === 'upgrades') pool = filterItems(pool, infos, 'upgrades');
    if (what !== 'all') pool = filterItems(pool, infos, what);
    if (q) pool = pool.filter((x) => searchText(x).includes(q));
    const sorted = sortItems(pool, infos, sort, desc);
    // Starred items go on top of whatever the sort is, keeping the sort inside both groups.
    return pinFav && view !== 'fav'
      ? [...sorted.filter((x) => favs.has(x.uid)), ...sorted.filter((x) => !favs.has(x.uid))]
      : sorted;
  }, [run.inventory, infos, sort, desc, what, view, q, lastDrops, unseen, favs, pinFav]);
  const junk = useMemo(() => junkItems(run), [run.build, run.inventory]);

  // Keep the selected row in view (above the sheet on a phone) when the selection changes.
  useEffect(() => {
    if (sel?.from === 'inv')
      document.querySelector('.ix-row.sel')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const lookup = (s: Sel | null): InventoryItem | null => {
    if (!s) return null;
    if (s.from === 'inv') return run.inventory.find((x) => x.uid === s.uid) ?? null;
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

  const say = (text: string, undo = true) => setStatus({ text, undo });
  const after = (r: { ok: boolean; reason?: string } | void, ok: () => void) => {
    if (r && r.ok) ok();
    else say(r?.reason ?? 'That did not work.', false);
  };

  const equipTo = (uid: number, slot: EquipSlot) => {
    const item = run.inventory.find((x) => x.uid === uid);
    if (!item) return;
    const dry = dryEquip(run, uid, slot);
    const r = c.act((rn) => equip(rn, uid, slot));
    after(r, () => {
      const back = dry.toBag;
      say(
        `Equipped ${itemTitle(item)} in ${slotName(slot)}.` +
          (back.length ? ` ${back.map((x) => x.name).join(' and ')} went to the bag.` : ''),
      );
      // Next you want to know whether the old one was worth keeping: select it.
      setSel(back.length ? { from: 'inv', uid: back[0].uid } : { from: 'slot', slot });
    });
  };
  const equipFlaskTo = (uid: number, idx: number) => {
    const f = run.inventory.find((x) => x.uid === uid);
    const old = run.build.flasks[idx];
    const r = c.act((rn) => equipFlask(rn, uid, idx));
    after(r === undefined ? undefined : { ok: !!r }, () => {
      say(
        `Equipped ${f?.kind === 'flask' ? f.name : 'the flask'} in Flask ${idx + 1}.` +
          (old ? ` ${old.name} went to the bag.` : ''),
      );
      setSel(old ? { from: 'inv', uid: old.uid } : { from: 'flask', idx });
    });
  };
  const doQuick = (uid: number) => {
    const it = run.inventory.find((x) => x.uid === uid);
    if (!it) return;
    if (it.kind === 'item') {
      const slot = infos.get(uid)?.slot;
      if (!slot) return say(infos.get(uid)?.reason ?? 'Cannot be worn.', false);
      return equipTo(uid, slot);
    }
    if (it.kind === 'flask') {
      if (!infos.get(uid)?.equippable)
        return say(infos.get(uid)?.reason ?? 'Cannot be worn.', false);
      return equipFlaskTo(uid, flaskTarget(run, it));
    }
    const r = c.act((rn) => quickEquip(rn, uid));
    after(r, () => {
      say(`Socketed ${itemTitle(it)}.`);
      setSel(null);
    });
  };
  const unequipSlot = (slot: EquipSlot) => {
    const it = run.build.equipment[slot];
    c.act((r) => unequip(r, slot));
    if (it) {
      say(`Took off ${it.name}. It is in the bag.`);
      setSel({ from: 'inv', uid: it.uid });
    }
  };
  const unequipFlaskAt = (idx: number) => {
    const f = run.build.flasks[idx];
    c.act((r) => unequipFlask(r, idx));
    if (f) {
      say(`Took off ${f.name}. It is in the bag.`);
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
    c.act((r) => discard(r, uid));
    say(`Discarded ${itemTitle(it)}.`);
    setSel(next);
  };
  const doSalvage = async (uid: number) => {
    const it = run.inventory.find((x) => x.uid === uid);
    if (!it) return;
    const dust = salvageValue(it);
    const ok = await ask({
      title: 'Salvage for Bone Dust?',
      body: `${itemTitle(it)}${isFavourite(run, uid) ? ' (a favourite)' : ''} is broken down for good. Salvage cannot be undone.`,
      facts: [`${dust} Bone Dust`],
      confirm: `Salvage for ${dust} Bone Dust`,
      danger: true,
    });
    if (!ok) return;
    const next = stepAfter(uid);
    c.craft((r) => salvage(r, uid));
    say(`Salvaged ${itemTitle(it)} for ${dust} Bone Dust.`, false);
    setSel(next);
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
    say(`Salvaged ${junk.length} items for ${dust} Bone Dust.`, false);
    setSel(null);
  };
  const step = (dir: -1 | 1) => {
    const cur = sel?.from === 'inv' ? visible.findIndex((x) => x.uid === sel.uid) : -1;
    const n = Math.max(0, Math.min(visible.length - 1, cur + dir));
    if (visible[n]) setSel({ from: 'inv', uid: visible[n].uid });
  };
  const bestUpgrade = () => {
    let best: InventoryItem | null = null;
    for (const x of run.inventory) {
      const i = infos.get(x.uid)!;
      if (isUpgrade(i) && (!best || i.scorePct > infos.get(best.uid)!.scorePct)) best = x;
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

  const onSlot = (slot: EquipSlot) => {
    const t = targets.get(slot);
    if (sel?.from === 'inv' && t) {
      if (t.ok) equipTo(sel.uid, slot);
      else say(t.reason ?? 'Cannot be worn there.', false);
    } else setSel({ from: 'slot', slot });
  };
  const onFlask = (idx: number) => {
    if (sel?.from === 'inv' && flaskTargets) equipFlaskTo(sel.uid, idx);
    else setSel({ from: 'flask', idx });
  };

  const info = sel?.from === 'inv' ? infos.get(sel.uid) : undefined;
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
          status={status}
          upgrades={counts.upgrades}
          onBestUpgrade={bestUpgrade}
          coarse={coarse}
          phone={phone}
          onEquip={equipTo}
          onEquipFlask={equipFlaskTo}
          onUnequip={unequipSlot}
          onUnequipFlask={unequipFlaskAt}
          onFavourite={star}
          onSalvage={(uid) => void doSalvage(uid)}
          onDiscard={(uid) => void doDiscard(uid)}
          onSocket={doQuick}
          onCraft={(uid) => onCraft?.(uid)}
          onClose={() => setSel(null)}
          onStep={step}
          onUndo={() => {
            c.undo();
            setStatus(null);
          }}
        />
      </section>
      <section class="ix-listcol" aria-label="Bag">
        <ItemList
          rows={visible}
          infos={infos}
          selUid={sel?.from === 'inv' ? sel.uid : null}
          favs={favs}
          unseen={unseen}
          coarse={coarse}
          total={run.inventory.length}
          counts={counts}
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
          pinFav={pinFav}
          setPinFav={setPinFav}
          unseenCount={counts.new}
          junkCount={junk.length}
          onMarkSeen={() => c.act((r) => markSeen(r, 'all'))}
          onCleanUp={() => setCleaning(true)}
          onSalvageJunk={() => void salvageJunk()}
          onSelect={(uid) => setSel({ from: 'inv', uid })}
          onQuick={doQuick}
          onStar={star}
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
