import { useState } from 'preact/hooks';
import { gemDef } from '../data/gems';
import type { EquipSlot, InventoryItem } from '../data/types';
import { slotsFor } from '../run/inventory';
import {
  slotName,
  SORT_LABELS,
  type ItemGroup,
  type ItemInfo,
  type SortKey,
} from '../run/inventoryOps';
import { GLOSSARY } from '../data/glossary';
import { itemTitle, rarityClass } from './ItemCard';
import { infoProps } from './info';
import { introSeen, seeIntro } from './intro';

/** A mark the bag can be narrowed to: new, an upgrade, from the last map, a favourite. */
export type Mark = 'new' | 'upgrades' | 'last' | 'fav';
/**
 * The bag's filters, combined freely (the owner, 2026-11-04): any of the kinds turned on (none is every kind), every mark turned
 * on, and the discarded pile in place of the bag.
 */
export type Filters = { kinds: ItemGroup[]; marks: Mark[]; pile: boolean };
export const NO_FILTERS: Filters = { kinds: [], marks: [], pile: false };
/** A kind, or every kind (the first glyph button). */
type What = ItemGroup | 'all';
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

const MARKS: [Mark, string][] = [
  ['new', 'New'],
  ['upgrades', 'Upgrades'],
  ['last', 'Last map'],
  ['fav', '★'],
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
 * One item of the bag, a tight row of the bag's panel: its name in its rarity's colour, a gold mark while it is new, then
 * where it goes and what it would change.
 */
export function ItemRow(p: RowProps) {
  const { it, info } = p;
  const slots: EquipSlot[] = it.kind === 'item' ? slotsFor(it) : [];
  const gear = info.group !== 'gem' && info.group !== 'flask';
  return (
    <button
      class={`ix-row ${rarityClass(it)}${p.selected ? ' sel' : ''}${info.equippable ? '' : ' unusable'}`}
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
        {info.flaskSlot !== undefined && !info.fillsFlask && (
          <span class="badge up">
            ▲ {info.dryFlask ? 'replaces empty flask' : 'upgrades flask'} {info.flaskSlot + 1}
          </span>
        )}
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
        {gear && info.equippable && info.skillsIdle.length > 0 && (
          <span
            class="badge warn"
            title={`${info.skillsIdle.map((g) => gemDef(g.gemId).name).join(', ')} would stop working`}
          >
            ⚠ {gemDef(info.skillsIdle[0].gemId).name} stops
            {info.skillsIdle.length > 1 ? ` (+${info.skillsIdle.length - 1})` : ''}
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
  filters: Filters;
  setFilters: (f: Filters) => void;
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

/** Whether the list is narrowed by anything the player set: a kind, a mark, the pile, or words in the search box (the sort is an order). */
export function isFiltered(f: Filters, search: string): boolean {
  return f.kinds.length > 0 || f.marks.length > 0 || f.pile || search.trim() !== '';
}

const kindLabel = (k: What) => WHATS.find(([w]) => w === k)![1];
const markLabel = (m: Mark) => MARKS.find(([w]) => w === m)![1];
const toggle = <T,>(xs: T[], x: T): T[] =>
  xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x];

/**
 * The bag (docs/mockups/style/STYLE-GUIDE.md section 10): the views as tabs, the kinds as glyph buttons, search and
 * sort, the items as plaques, and the housekeeping always at its foot. A phone folds the views, kinds and sort into a
 * sheet behind one button.
 */
export function ItemList(p: Props) {
  const [sheet, setSheet] = useState(false);
  const f = p.filters;
  const filtered = isFiltered(f, p.search);
  // The tip on what the filters and an upgrade are: once per device, the first time the Filter sheet opens or Upgrades is
  // turned on.
  const [tip, setTip] = useState(false);
  const meetFilters = () => {
    if (!introSeen('filters')) setTip(true);
  };
  const tipSeen = () => {
    seeIntro('filters');
    setTip(false);
  };
  const clear = () => {
    p.setFilters(NO_FILTERS);
    p.setSearch('');
  };
  const setMarks = (marks: Mark[]) => p.setFilters({ ...f, marks });
  const flipMark = (m: Mark) => {
    if (m === 'upgrades' && !f.marks.includes(m)) meetFilters();
    setMarks(toggle(f.marks, m));
  };
  const setKinds = (kinds: ItemGroup[]) => p.setFilters({ ...f, kinds });
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
      <button
        class={'ix-view' + (!f.marks.length && !f.pile ? ' on' : '')}
        data-paint={!f.marks.length && !f.pile ? 'panel' : 'none'}
        data-thin
        data-field="gold"
        aria-pressed={!f.marks.length && !f.pile}
        onClick={() => p.setFilters({ ...f, marks: [], pile: false })}
      >
        All
      </button>
      {MARKS.map(([k, label]) => {
        const on = f.marks.includes(k);
        return (
          <button
            key={k}
            class={'ix-view' + (on ? ' on' : '')}
            data-paint={on ? 'panel' : 'none'}
            data-thin
            data-field="gold"
            aria-pressed={on}
            aria-label={k === 'fav' ? 'Favourites' : undefined}
            {...(k === 'upgrades' ? infoProps(GLOSSARY.upgrade) : {})}
            onClick={() => flipMark(k)}
          >
            {label}
            {p.counts[k] > 0 && <span class="n"> {p.counts[k]}</span>}
          </button>
        );
      })}
      <button
        class={'ix-view' + (f.pile ? ' on' : '')}
        data-paint={f.pile ? 'panel' : 'none'}
        data-thin
        data-field="gold"
        aria-pressed={f.pile}
        onClick={() => p.setFilters({ ...f, pile: !f.pile })}
      >
        Discarded
        {p.counts.discarded > 0 && <span class="n"> {p.counts.discarded}</span>}
      </button>
    </div>
  );
  const kinds = (
    <div class="ix-kinds" role="group" aria-label="Kind">
      {WHATS.map(([k, label, glyph]) => {
        const on = k === 'all' ? !f.kinds.length : f.kinds.includes(k);
        return (
          <button
            key={k}
            class={'ix-kind' + (on ? ' on' : '')}
            data-paint="panel"
            data-thin
            data-field={on ? 'gold' : 'lapis'}
            data-pk={on ? 'on' : 'off'}
            aria-pressed={on}
            aria-label={label}
            {...infoProps(label)}
            onClick={() => setKinds(k === 'all' ? [] : toggle(f.kinds, k))}
          >
            <i data-paint="glyph" data-glyph={glyph} data-pk={`${glyph}${on}`} />
          </button>
        );
      })}
    </div>
  );
  // The once-only tip: filters combine, and what makes an upgrade.
  const tipBox = tip && (
    <div class="tip ix-ftip" data-paint="panel" data-thin>
      <div class="tip-text">
        Filters combine: turn on several and the bag shows what matches them all (any one of the
        kinds you pick). Upgrades: {GLOSSARY.upgrade}
      </div>
      <button class="btn small" onClick={tipSeen}>
        Got it
      </button>
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
  // How many filters are set: what the Filter button counts.
  const active = f.kinds.length + f.marks.length + (f.pile ? 1 : 0);
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
      {p.phone ? (
        <>
          <div class="ix-tools phone">
            {search}
            <button
              class="btn small ix-fbtn"
              aria-expanded={sheet}
              onClick={() => {
                setSheet(true);
                meetFilters();
              }}
            >
              Filter{active > 0 && <span class="n"> {active}</span>} ▾
            </button>
          </div>
          {filtered && (
            <div class="ix-chips">
              {f.kinds.map((k) => (
                <button
                  key={k}
                  class="ix-rm"
                  aria-label={`Remove the ${kindLabel(k)} filter`}
                  onClick={() => setKinds(f.kinds.filter((x) => x !== k))}
                >
                  {kindLabel(k)} <i>×</i>
                </button>
              ))}
              {f.marks.map((m) => (
                <button
                  key={m}
                  class="ix-rm"
                  aria-label={`Remove the ${markLabel(m)} filter`}
                  onClick={() => setMarks(f.marks.filter((x) => x !== m))}
                >
                  {markLabel(m)} ({p.counts[m]}) <i>×</i>
                </button>
              ))}
              {f.pile && (
                <button
                  class="ix-rm"
                  aria-label="Remove the Discarded filter"
                  onClick={() => p.setFilters({ ...f, pile: false })}
                >
                  Discarded ({p.counts.discarded}) <i>×</i>
                </button>
              )}
              {clearButton('ix-rm clr')}
            </div>
          )}
          {!sheet && tipBox}
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
                {tipBox}
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
          <div class="ix-tools">
            {search}
            {sortSelect}
            {reverse}
          </div>
          {kinds}
          {filtered && <div class="ix-chips">{clearButton('ix-rm clr')}</div>}
          {tipBox}
        </>
      )}
      <div class="ix-list">
        {p.rows.length === 0 && (
          <div class="muted ix-nothing">
            {f.pile && !f.kinds.length && !f.marks.length && !p.search.trim()
              ? 'Nothing is discarded.'
              : p.total === 0 && !filtered
                ? 'The bag is empty.'
                : 'Nothing matches. '}
            {filtered && !(f.pile && !f.kinds.length && !f.marks.length && !p.search.trim()) && (
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
