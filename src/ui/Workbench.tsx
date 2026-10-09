import { useEffect, useState } from 'preact/hooks';
import { itemBase } from '../data/bases';
import { EQUIP_SLOTS, type Item } from '../data/types';
import { modsText } from '../mods/text';
import type { Controller } from '../run/controller';
import { locate, pickReforge, type CraftResult } from '../run/craft';
import {
  affixInfo,
  applyCraft,
  describeChange,
  planCraft,
  slotRoom,
  type CraftAction,
  type CraftPlan,
} from '../run/craftPlan';
import { slotLabel, slotName } from '../run/inventoryOps';
import type { RunState } from '../run/run';
import { isFavourite } from '../run/found';
import { ask } from './Confirm';
import { useViewport } from './device';
import { rarityClass } from './ItemCard';
import { loadPref, savePref } from './prefs';
import { Actions } from './WbActions';
import { Guide, Pouch, type GroupId } from './WbPouch';
import { ResultPanel } from './WbResult';

type Row = { item: Item; where: string; worn: boolean };

/** Every item the player has that can be crafted: worn first, then carried. */
function craftable(run: RunState): Row[] {
  const rows: Row[] = [];
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (it) rows.push({ item: it, where: slotName(slot), worn: true });
  }
  for (const it of run.inventory)
    if (it.kind === 'item') rows.push({ item: it, where: 'Bag', worn: false });
  return rows;
}

type Filter = 'all' | 'worn' | 'bag';

function Picker({
  run,
  rows,
  uid,
  onChoose,
}: {
  run: RunState;
  rows: Row[];
  uid: number | null;
  onChoose: (uid: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (filter === 'all' || (filter === 'worn') === r.worn) &&
      (!q ||
        r.item.name.toLowerCase().includes(q) ||
        r.where.toLowerCase().includes(q) ||
        itemBase(r.item.baseId).name.toLowerCase().includes(q)),
  );
  return (
    <div class="wx-picker">
      <input
        class="wx-search"
        type="search"
        placeholder={`Search ${rows.length} items`}
        aria-label="Search items"
        value={query}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
      />
      <div class="ix-chips">
        {(['all', 'worn', 'bag'] as const).map((f) => (
          <button
            key={f}
            class={'chip' + (filter === f ? ' on' : '')}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'worn' ? 'Worn' : 'Bag'}
          </button>
        ))}
      </div>
      <div class="wx-list">
        {shown.map(({ item, where, worn }) => (
          <button
            key={item.uid}
            class={`wx-pick ${rarityClass(item)}${uid === item.uid ? ' sel' : ''}`}
            onClick={() => onChoose(item.uid)}
          >
            <span class="muted wx-pick-where">{worn ? where : 'Bag'}</span>
            <span class="wx-pick-name">
              {isFavourite(run, item.uid) ? '★ ' : ''}
              {item.name}
            </span>
            {item.sealed && <span class="badge down">sealed</span>}
          </button>
        ))}
        {shown.length === 0 && <div class="muted">No item matches.</div>}
      </div>
    </div>
  );
}

/** The item's affixes as the form the crafts work on: pick one for the Change group, or tick the ones a reforge keeps. */
function AffixList({
  it,
  selAffix,
  setSelAffix,
  pinning,
  pins,
  setPins,
  flash,
  locked,
}: {
  it: Item;
  selAffix: string | null;
  setSelAffix: (f: string | null) => void;
  pinning: boolean;
  pins: string[];
  setPins: (p: string[]) => void;
  flash: Set<string>;
  locked: boolean;
}) {
  if (it.affixes.length === 0 && (it.uniqueMods ?? []).length === 0)
    return <div class="muted">No affixes yet.</div>;
  return (
    <div class="wx-affixes">
      {it.affixes.map((a) => {
        const info = affixInfo(it, a);
        const pinned = pins.includes(a.family);
        const sel = !pinning && selAffix === a.family;
        const body = (
          <>
            <span class="wx-affix-kind muted">{info.type === 'prefix' ? 'Prefix' : 'Suffix'}</span>
            <span class="wx-affix-text">{modsText(a.mods).join(' and ')}</span>
            <span class="wx-affix-meta">
              <span class="muted" title="Higher tiers are stronger and rarer.">
                tier {info.tier}/{info.tiers}
              </span>
              <span
                class="wx-bar"
                title={`Where the value sits in its tier: ${Math.round(info.at * 100)}%`}
              >
                <i style={{ width: `${Math.round(info.at * 100)}%` }} />
              </span>
              {info.polished && <span class="badge up">raised</span>}
              {info.bench && <span class="badge">bench</span>}
            </span>
          </>
        );
        const cls = `wx-affix${sel ? ' sel' : ''}${pinned ? ' pinned' : ''}${flash.has(a.family) ? ' flash' : ''}`;
        return pinning ? (
          <label key={a.family} class={cls}>
            <input
              type="checkbox"
              checked={pinned}
              disabled={locked}
              onChange={(e) =>
                setPins(
                  (e.target as HTMLInputElement).checked
                    ? [...pins, a.family]
                    : pins.filter((f) => f !== a.family),
                )
              }
            />
            {body}
          </label>
        ) : (
          <button
            key={a.family}
            class={cls}
            aria-pressed={sel}
            disabled={locked}
            onClick={() => setSelAffix(sel ? null : a.family)}
          >
            {body}
          </button>
        );
      })}
      {(it.uniqueMods ?? []).map((m, i) => (
        <div key={`u${i}`} class="wx-affix fixed">
          <span class="wx-affix-kind muted">Unique</span>
          <span class="wx-affix-text">{modsText([m]).join(' and ')}</span>
        </div>
      ))}
    </div>
  );
}

/** What gets a confirmation before it is paid for: the gambles and the things that cannot be taken back at all. */
function needsConfirm(a: CraftAction): boolean {
  return a.kind === 'die' || a.kind === 'seal' || a.kind === 'salvage';
}

const costText = (plan: CraftPlan) =>
  plan.cost.map((c) => `${c.n} ${c.label}`).join(' and ') || 'nothing';

/**
 * The Workbench (docs/ITEMS.md section 4): choose an item, choose what to do to it, see the result, pay. Every craft is
 * staged in the result panel first, built by `planCraft` from the real craft code.
 */
export function Workbench({
  c,
  focus,
  onShowInItems,
}: {
  c: Controller;
  /** Choose this item when it changes (the Items tab's "Craft…"). */
  focus?: { uid: number; n: number } | null;
  onShowInItems?: (uid: number) => void;
}) {
  const run = c.run!;
  const { layout, width } = useViewport();
  const phone = layout === 'phone';
  const wide = width >= 1100;
  const [uid, setUid] = useState<number | null>(null);
  const [staged, setStaged] = useState<CraftAction | null>(null);
  const [selAffix, setSelAffix] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'reforge'>('view');
  const [pins, setPins] = useState<string[]>([]);
  const [addFam, setAddFam] = useState('');
  const [essence, setEssence] = useState('');
  const [essReplace, setEssReplace] = useState<Record<string, string>>({});
  const [sockets, setSockets] = useState(0);
  const [open, setOpen] = useState<GroupId | null>(null);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<Record<number, string[]>>({});
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [guide, setGuide] = useState(false);
  const [intro, setIntro] = useState<boolean>(() => loadPref<boolean>('wb.intro', true));

  const rows = craftable(run);
  const loc = uid !== null ? locate(run, uid) : null;
  const it = loc?.item ?? null;
  const pending = run.pendingCraft;
  const locked = !!pending;

  const choose = (u: number) => {
    setUid(u);
    setStaged(null);
    setSelAffix(null);
    setMode('view');
    setPins([]);
    setAddFam('');
    setEssence('');
    setEssReplace({});
    setFlash(new Set());
    setSockets(locate(run, u)?.item.sockets.length ?? 0);
    setPickerOpen(false);
  };
  // "Craft…" from the Items tab, or a reforge that is still waiting for its pick.
  useEffect(() => {
    if (focus && locate(run, focus.uid)) choose(focus.uid);
  }, [focus?.n]);
  useEffect(() => {
    if (pending && uid === null && locate(run, pending.itemUid)) choose(pending.itemUid);
  }, []);

  const plan = it && staged ? planCraft(run, it.uid, staged) : null;
  // A staged craft that stopped making sense (the item changed under it) is dropped.
  useEffect(() => {
    if (staged && !it) setStaged(null);
  }, [staged, it]);

  const stage = (a: CraftAction | null) => {
    setStaged(a);
    // On a phone the result is a sheet; nothing else to do. Elsewhere it is already beside the work.
  };
  const openGroup = (g: GroupId) => {
    setOpen(g);
    setTimeout(() => {
      const el = document.querySelector(`[data-group="${g}"]`);
      el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      el?.classList.add('hot');
      setTimeout(() => el?.classList.remove('hot'), 1200);
    }, 0);
  };

  const apply = async () => {
    if (!it || !staged || !plan?.ok) return;
    const action = staged;
    if (needsConfirm(action)) {
      const ok = await ask({
        title:
          action.kind === 'seal'
            ? 'Seal this item?'
            : action.kind === 'die'
              ? 'Throw the Knucklebone Die?'
              : 'Salvage this item?',
        body:
          action.kind === 'salvage'
            ? `${it.name} is broken down for good.`
            : action.kind === 'seal'
              ? 'It can never be changed again. It may gain something, or be remade.'
              : `${it.name} is remade by chance.`,
        facts: [
          ...(plan.odds ?? []),
          ...(plan.gain ? [`Gives ${plan.gain}`] : []),
          `Costs ${costText(plan)}`,
        ],
        confirm:
          action.kind === 'salvage'
            ? 'Salvage it'
            : action.kind === 'seal'
              ? 'Seal it'
              : 'Throw it',
        danger: true,
      });
      if (!ok) return;
    }
    const before = it;
    let res: CraftResult | undefined;
    c.craft((r) => {
      res = applyCraft(r, before.uid, action);
    });
    const done = res as CraftResult | undefined;
    if (!done || !done.ok) {
      setStatus(done && !done.ok ? done.reason : 'That did not work.');
      return;
    }
    const after = locate(c.run!, before.uid)?.item ?? null;
    const drew = action.kind === 'reforge';
    const lines = drew
      ? ['Three alternatives drawn']
      : after
        ? describeChange(before, after)
        : ['Salvaged'];
    const said = drew
      ? `Drew three alternatives for ${before.name}. Spent ${costText(plan)}. Pick one, or keep the original.`
      : `${plan.verb}: ${lines.join('; ')}. Spent ${costText(plan)}.`;
    setStatus(said);
    setLogs((l) => ({
      ...l,
      [before.uid]: [`${plan.verb}: ${lines.join('; ')}`, ...(l[before.uid] ?? [])].slice(0, 5),
    }));
    setStaged(null);
    setMode('view');
    setPins([]);
    if (!after) {
      setUid(null);
    } else {
      setSockets(after.sockets.length);
      const was = new Map(before.affixes.map((a) => [a.family, JSON.stringify(a.mods)]));
      const fams = new Set(
        after.affixes
          .filter((a) => was.get(a.family) !== JSON.stringify(a.mods))
          .map((a) => a.family),
      );
      setFlash(fams);
      setTimeout(() => setFlash(new Set()), 2500);
      if (selAffix && !after.affixes.some((a) => a.family === selAffix)) setSelAffix(null);
    }
  };

  const pick = (i: number | null) => {
    const orig = pending ? locate(run, pending.itemUid)?.item : null;
    c.craft((r) => pickReforge(r, i));
    setStatus(
      i === null
        ? `Kept ${orig?.name ?? 'the original'}. The Embers are spent.`
        : `Took alternative ${i + 1}.`,
    );
    if (orig) {
      setLogs((l) => ({
        ...l,
        [orig.uid]: [
          i === null ? 'Reroll: kept the original' : `Reroll: took alternative ${i + 1}`,
          ...(l[orig.uid] ?? []),
        ].slice(0, 5),
      }));
      if (i !== null)
        setFlash(new Set(locate(c.run!, orig.uid)?.item.affixes.map((a) => a.family) ?? []));
      setTimeout(() => setFlash(new Set()), 2500);
    }
  };

  const room = it ? slotRoom(it) : null;
  const resultOn = !!(plan || pending);
  const result = (
    <ResultPanel
      run={run}
      item={it}
      plan={plan}
      pick={!!pending}
      log={uid !== null ? (logs[uid] ?? []) : []}
      onApply={() => void apply()}
      onCancel={() => setStaged(null)}
      onPick={pick}
    />
  );

  return (
    <div class="wx">
      {guide && <Guide run={run} onClose={() => setGuide(false)} />}
      <Pouch c={c} run={run} onGroup={openGroup} onGuide={() => setGuide(true)} />
      {intro && (
        <div class="wx-intro">
          <span>
            <b>How this works:</b> pick an item, pick what to do to it, and look at the result
            before you pay.
          </span>
          <button
            class="btn small"
            onClick={() => {
              setIntro(false);
              savePref('wb.intro', false);
            }}
          >
            Got it
          </button>
        </div>
      )}
      {status && (
        <div class="ix-status" role="status">
          {status}{' '}
          <button class="link" onClick={() => setStatus('')}>
            Dismiss
          </button>
        </div>
      )}
      <div class={'wx-body' + (resultOn ? ' has-result' : '')}>
        {wide && (
          <div class="wx-pickcol">
            <Picker run={run} rows={rows} uid={uid} onChoose={choose} />
          </div>
        )}
        <div class="wx-work">
          {!wide && (
            <button class="btn wx-change" onClick={() => setPickerOpen(true)}>
              {it ? 'Change item…' : 'Choose an item…'}
            </button>
          )}
          {pickerOpen && !wide && (
            <div class="modal" onClick={() => setPickerOpen(false)}>
              <div
                class="modal-card"
                role="dialog"
                aria-label="Choose an item"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  class="sheet-x modal-x"
                  aria-label="Close"
                  onClick={() => setPickerOpen(false)}
                >
                  ×
                </button>
                <h3>Choose an item</h3>
                <Picker run={run} rows={rows} uid={uid} onChoose={choose} />
              </div>
            </div>
          )}
          {!it && <div class="muted wx-none">Choose an item to work on.</div>}
          {it && room && (
            <>
              <div class="wx-item">
                <div class="wx-item-head">
                  <span class={'ix-title ' + rarityClass(it)}>{it.name}</span>
                  {onShowInItems && (
                    <button class="btn small" onClick={() => onShowInItems(it.uid)}>
                      Show in Items
                    </button>
                  )}
                </div>
                <div class="muted">
                  {itemBase(it.baseId).name} · item level {it.ilvl}
                  {loc?.slot ? ` · worn as ${slotLabel(loc.slot)}` : ' · in the bag'}
                </div>
                <div class="wx-room">
                  <span class="wx-room-chip">
                    Prefixes {room.prefix.used}/{room.prefix.cap}
                  </span>
                  <span class="wx-room-chip">
                    Suffixes {room.suffix.used}/{room.suffix.cap}
                  </span>
                  {room.sockets.max > 0 && (
                    <span class="wx-room-chip">
                      Sockets {room.sockets.n}/{room.sockets.max}
                    </span>
                  )}
                  {it.sealed && <span class="wx-room-chip sealed">Sealed</span>}
                  {it.uniqueId && <span class="wx-room-chip">Unique</span>}
                </div>
                {modsText(it.implicits).map((l, i) => (
                  <div key={i} class="ic-mod implicit">
                    {l}
                  </div>
                ))}
                <AffixList
                  it={it}
                  selAffix={selAffix}
                  setSelAffix={setSelAffix}
                  pinning={mode === 'reforge'}
                  pins={pins}
                  setPins={(p) => {
                    setPins(p);
                    if (staged?.kind === 'reforge') setStaged(null);
                  }}
                  flash={flash}
                  locked={locked}
                />
              </div>
              <Actions
                run={run}
                it={it}
                carried={loc?.slot === null}
                staged={staged}
                stage={stage}
                selAffix={selAffix}
                mode={mode}
                setMode={(m) => {
                  setMode(m);
                  if (m === 'view') {
                    setPins([]);
                    if (staged?.kind === 'reforge') setStaged(null);
                  }
                }}
                pins={pins}
                addFam={addFam}
                setAddFam={setAddFam}
                essence={essence}
                setEssence={setEssence}
                essReplace={essReplace}
                setEssReplace={setEssReplace}
                sockets={sockets}
                setSockets={(n) => {
                  setSockets(n);
                  if (staged?.kind === 'sockets') setStaged(null);
                }}
                open={open}
                setOpen={setOpen}
                phone={phone}
                locked={locked}
              />
            </>
          )}
        </div>
        <aside class={'wx-resultcol' + (resultOn ? ' on' : '')} aria-label="Result">
          {result}
        </aside>
      </div>
    </div>
  );
}
