import { useState } from 'preact/hooks';
import type { EquipSlot, InventoryItem } from '../data/types';
import { slotsFor } from '../run/inventory';
import {
  slotName,
  SORT_LABELS,
  type FilterKey,
  type ItemInfo,
  type SortKey,
} from '../run/inventoryOps';
import { itemTitle, rarityClass } from './ItemCard';
import { infoProps } from './info';

/** What kind of thing (one at a time) and which view of the bag (one at a time); the two combine. */
export type What = Extract<FilterKey, 'all' | 'weapon' | 'armour' | 'jewellery' | 'flask' | 'gem'>;
export type View = 'all' | 'new' | 'upgrades' | 'last' | 'fav' | 'discarded';
/** The bag's order: the run's sorts, or favourites first (newest first inside both groups). */
export type ListSort = SortKey | 'fav';

/** The kinds, as glyph buttons (leaf/kinds.ts draws the glyphs) with their names in a tip. */
const WHATS: [What, string, string][] = [
  ['all', 'Everything', 'all'],
  ['weapon', 'Weapons', 'blade'],
  ['armour', 'Armour', 'helm'],
  ['jewellery', 'Jewellery', 'ring'],
  ['flask', 'Flasks', 'flask'],
  ['gem', 'Gems', 'gem'],
];

const VIEWS: [View, string][] = [
  ['all', 'All'],
  ['new', 'New'],
  ['upgrades', 'Upgrades'],
  ['last', 'Last map'],
  ['fav', '★'],
  ['discarded', 'Discarded'],
];

const SORTS: [ListSort, string][] = [
  ...(Object.keys(SORT_LABELS) as SortKey[]).map((k): [ListSort, string] => [k, SORT_LABELS[k]]),
  ['fav', 'Favourites'],
];

function Badge({ v, label }: { v: number; label: string }) {
  if (Math.abs(v) < 0.5) return null;
  return (
    <span
      class={'badge ' + (v > 0 ? 'up' : 'down')}
      title={`${v > 0 ? '+' : ''}${v.toFixed(1)}% ${label}`}
    >
      {v > 0 ? '▲' : '▼'}
      {Math.abs(Math.round(v))}% {label}
    </span>
  );
}

type RowProps = {
  it: InventoryItem;
  info: ItemInfo;
  selected: boolean;
  favourite: boolean;
  unseen: boolean;
  coarse: boolean;
  onSelect: () => void;
  onQuick: () => void;
  onPeek: (uid: number | null) => void;
  onDrag: (uid: number | null) => void;
};

/**
 * One item of the bag, a small plaque of its own (an object, not a line of text): its name in its rarity's colour, a
 * gold mark while it is new, then where it goes and what it would change.
 */
export function ItemRow(p: RowProps) {
  const { it, info } = p;
  const slots: EquipSlot[] = it.kind === 'item' ? slotsFor(it) : [];
  const gear = info.group !== 'gem' && info.group !== 'flask';
  return (
    <button
      class={`ix-row ${rarityClass(it)}${p.selected ? ' sel' : ''}${info.equippable ? '' : ' unusable'}`}
      data-paint="panel"
      data-thin={p.selected ? undefined : ''}
      data-pk={p.selected ? 'sel' : ''}
      draggable={!p.coarse && it.kind !== 'gem'}
      onDragStart={(e) => {
        e.dataTransfer?.setData('text/plain', `inv:${it.uid}`);
        p.onDrag(it.uid);
      }}
      onDragEnd={() => p.onDrag(null)}
      onClick={p.onSelect}
      onDblClick={p.onQuick}
      onMouseEnter={() => !p.coarse && p.onPeek(it.uid)}
      onMouseLeave={() => p.onPeek(null)}
      title={info.reason}
    >
      <span class="ix-row-main">
        {p.unseen && <i class="ix-new" aria-label="New" />}
        {p.favourite && <span class="ix-favmark">★</span>}
        <span class="ix-row-name">{itemTitle(it)}</span>
      </span>
      <span class="ix-row-sub">
        <span class="muted">{info.slotLabel}</span>
        {slots.length > 1 && info.slot && <span class="ix-best">→ {slotName(info.slot)}</span>}
        {info.fillsFlask && <span class="badge up">▲ empty flask slot</span>}
        {gear && info.equippable && (
          <>
            <Badge v={info.dpsPct} label="DPS" />
            <Badge v={info.ehpPct} label="EHP" />
          </>
        )}
        {gear && info.equippable && info.gemsOut.length > 0 && (
          <span
            class="badge warn"
            title={`${info.gemsOut.length} gem${info.gemsOut.length > 1 ? 's' : ''} would go to the bag`}
          >
            ⚠ {info.gemsOut.length} gem{info.gemsOut.length > 1 ? 's' : ''} out
          </span>
        )}
        {!info.equippable && info.group !== 'gem' && <span class="badge down">can't use</span>}
      </span>
    </button>
  );
}

type Props = {
  rows: InventoryItem[];
  infos: Map<number, ItemInfo>;
  selUid: number | null;
  favs: Set<number>;
  unseen: Set<number>;
  coarse: boolean;
  /** A phone folds the filters into a sheet. */
  phone: boolean;
  total: number;
  counts: { new: number; upgrades: number; last: number; fav: number; discarded: number };
  /** What salvaging the whole discarded pile would give. */
  discardedDust: number;
  onSalvageDiscarded: () => void;
  search: string;
  setSearch: (s: string) => void;
  sort: ListSort;
  setSort: (s: ListSort) => void;
  desc: boolean;
  setDesc: (d: boolean) => void;
  what: What;
  setWhat: (w: What) => void;
  view: View;
  setView: (v: View) => void;
  unseenCount: number;
  junkCount: number;
  onMarkSeen: () => void;
  onCleanUp: () => void;
  onSalvageJunk: () => void;
  onSelect: (uid: number) => void;
  onQuick: (uid: number) => void;
  onPeek: (uid: number | null) => void;
  onDrag: (uid: number | null) => void;
  onDropOnList: () => void;
  dragFromSlot: boolean;
};

/** Whether the list is narrowed by anything the player set: a kind, a view, or words in the search box (the sort is an order). */
export function isFiltered(what: What, view: View, search: string): boolean {
  return what !== 'all' || view !== 'all' || search.trim() !== '';
}

const kindLabel = (k: What) => WHATS.find(([w]) => w === k)![1];
const viewLabel = (v: View) => VIEWS.find(([w]) => w === v)![1];

/**
 * The bag (docs/mockups/style/STYLE-GUIDE.md section 10): the views as tabs, the kinds as glyph buttons, search and
 * sort, the items as plaques, and the housekeeping always at its foot. A phone folds the views, kinds and sort into a
 * sheet behind one button.
 */
export function ItemList(p: Props) {
  const [sheet, setSheet] = useState(false);
  const filtered = isFiltered(p.what, p.view, p.search);
  const clear = () => {
    p.setWhat('all');
    p.setView('all');
    p.setSearch('');
  };
  const count = (v: View) => (v === 'all' ? 0 : p.counts[v]);
  const search = (
    <input
      class="ix-search"
      type="search"
      placeholder="Search the bag"
      aria-label="Search the bag"
      value={p.search}
      onInput={(e) => p.setSearch((e.target as HTMLInputElement).value)}
    />
  );
  const sortSelect = (
    <select
      class="ix-sort"
      aria-label="Sort"
      value={p.sort}
      onChange={(e) => p.setSort((e.target as HTMLSelectElement).value as ListSort)}
    >
      {SORTS.map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
  const reverse = (
    <button
      class={'btn small ix-rev' + (p.desc ? ' on' : '')}
      aria-pressed={p.desc}
      aria-label="Turn the sort the other way round"
      title="Turn the sort the other way round"
      onClick={() => p.setDesc(!p.desc)}
    >
      ⇅
    </button>
  );
  const views = (
    <div class="ix-views" role="group" aria-label="Show">
      {VIEWS.map(([k, label]) => (
        <button
          key={k}
          class={'ix-view' + (p.view === k ? ' on' : '')}
          data-paint={p.view === k ? 'panel' : 'none'}
          data-thin
          data-field="gold"
          aria-pressed={p.view === k}
          aria-label={k === 'fav' ? 'Favourites' : undefined}
          onClick={() => p.setView(k)}
        >
          {label}
          {count(k) > 0 && <span class="n"> {count(k)}</span>}
        </button>
      ))}
    </div>
  );
  const kinds = (
    <div class="ix-kinds" role="group" aria-label="Kind">
      {WHATS.map(([k, label, glyph]) => (
        <button
          key={k}
          class={'ix-kind' + (p.what === k ? ' on' : '')}
          data-paint="panel"
          data-thin
          data-field={p.what === k ? 'gold' : 'lapis'}
          data-pk={p.what === k ? 'on' : 'off'}
          aria-pressed={p.what === k}
          aria-label={label}
          {...infoProps(label)}
          onClick={() => p.setWhat(k)}
        >
          <i data-paint="glyph" data-glyph={glyph} data-pk={`${glyph}${p.what === k}`} />
        </button>
      ))}
    </div>
  );
  // The housekeeping, always in sight at the foot of the bag: the two salvages share a line.
  const tidy = (
    <div class="ix-tidy">
      <div class="ix-tidy-row">
        <button class="btn small" disabled={!p.unseenCount} onClick={p.onMarkSeen}>
          Mark all seen
        </button>
        <button class="btn small" onClick={p.onCleanUp}>
          Clean up old items…
        </button>
      </div>
      <div class="ix-tidy-row">
        <button class="btn small danger" disabled={!p.junkCount} onClick={p.onSalvageJunk}>
          Salvage junk ({p.junkCount})
        </button>
        <button
          class="btn small danger"
          disabled={!p.counts.discarded}
          title={`Break down every discarded item for ${p.discardedDust} Bone Dust. It cannot be undone.`}
          onClick={p.onSalvageDiscarded}
        >
          Salvage discarded ({p.counts.discarded})
        </button>
      </div>
    </div>
  );
  const clearButton = (cls: string) => (
    <button class={cls} onClick={clear}>
      Clear filters
    </button>
  );
  // How many of the two filters are set: what the Filter button counts.
  const active = (p.what !== 'all' ? 1 : 0) + (p.view !== 'all' ? 1 : 0);
  return (
    <div
      class={'ix-list-col' + (p.dragFromSlot ? ' drop' : '')}
      data-paint="panel"
      onDragOver={(e) => p.dragFromSlot && e.preventDefault()}
      onDrop={(e) => {
        if (!p.dragFromSlot) return;
        e.preventDefault();
        p.onDropOnList();
      }}
    >
      <h4 class="ix-baghead">Bag</h4>
      {p.phone ? (
        <>
          <div class="ix-tools phone">
            {search}
            <button class="btn small ix-fbtn" aria-expanded={sheet} onClick={() => setSheet(true)}>
              Filter{active > 0 && <span class="n"> {active}</span>} ▾
            </button>
          </div>
          {(p.what !== 'all' || p.view !== 'all' || filtered) && (
            <div class="ix-chips">
              {p.what !== 'all' && (
                <button
                  class="ix-rm"
                  aria-label={`Remove the ${kindLabel(p.what)} filter`}
                  onClick={() => p.setWhat('all')}
                >
                  {kindLabel(p.what)} <i>×</i>
                </button>
              )}
              {p.view !== 'all' && (
                <button
                  class="ix-rm"
                  aria-label={`Remove the ${viewLabel(p.view)} filter`}
                  onClick={() => p.setView('all')}
                >
                  {viewLabel(p.view)} ({count(p.view)}) <i>×</i>
                </button>
              )}
              {filtered && clearButton('ix-rm clr')}
            </div>
          )}
          {sheet && (
            <>
              <div class="ix-tidy-veil" onClick={() => setSheet(false)} />
              <div class="ix-fsheet" role="dialog" aria-label="Filter and sort" data-paint="panel">
                <div class="ix-fhead">
                  <b>Filter and sort</b>
                  <button
                    class="btn small ix-close"
                    aria-label="Close"
                    onClick={() => setSheet(false)}
                  >
                    ×
                  </button>
                </div>
                {views}
                {kinds}
                <div class="ix-fsort">
                  {sortSelect}
                  {reverse}
                </div>
                <div class="ix-ffoot">
                  <button class="btn primary" onClick={() => setSheet(false)}>
                    Show {p.rows.length} item{p.rows.length === 1 ? '' : 's'}
                  </button>
                  <button class="btn" disabled={!filtered} onClick={clear}>
                    Reset filters
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {views}
          {kinds}
          <div class="ix-tools">
            {search}
            {sortSelect}
            {reverse}
          </div>
          {(p.what !== 'all' || p.search.trim() !== '') && (
            <div class="ix-chips">{clearButton('ix-rm clr')}</div>
          )}
        </>
      )}
      <div class="ix-list">
        {p.rows.length === 0 && (
          <div class="muted ix-nothing">
            {p.view === 'discarded' && p.what === 'all' && !p.search.trim()
              ? 'Nothing is discarded.'
              : p.total === 0 && !filtered
                ? 'The bag is empty.'
                : 'Nothing matches. '}
            {(p.what !== 'all' || p.search.trim() !== '') && (
              <button class="link" onClick={clear}>
                Clear filters
              </button>
            )}
          </div>
        )}
        {p.rows.map((it) => (
          <ItemRow
            key={it.uid}
            it={it}
            info={p.infos.get(it.uid)!}
            selected={p.selUid === it.uid}
            favourite={p.favs.has(it.uid)}
            unseen={p.unseen.has(it.uid)}
            coarse={p.coarse}
            onSelect={() => p.onSelect(it.uid)}
            onQuick={() => p.onQuick(it.uid)}
            onPeek={p.onPeek}
            onDrag={p.onDrag}
          />
        ))}
      </div>
      {tidy}
    </div>
  );
}
