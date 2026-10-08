import { useState } from 'preact/hooks';
import { Character, diffSheets, type SheetDiff } from '../calc/character';
import { family, familyMods, type Family } from '../data/affixes';
import { itemBase } from '../data/bases';
import {
  augerCost,
  BENCH_RECIPES,
  CURRENCIES,
  currencyDef,
  currencyLabel,
  currencyText,
  TABLET_PREFIX,
} from '../data/currency';
import { EQUIP_SLOTS, type EquipSlot, type Item } from '../data/types';
import { modsText } from '../mods/text';
import { cfgFor } from '../run/bot';
import type { Controller } from '../run/controller';
import {
  addableFamilies,
  benchAdd,
  benchRemove,
  benchRemoveBench,
  benchSocketCost,
  benchSockets,
  completeTabletSets,
  drawReforge,
  locate,
  owned,
  pickReforge,
  POLISH_LIMIT,
  redeemTablets,
  reforgeCost,
  salvage,
  salvageValue,
  socketCeiling,
  socketCost,
  useAuger,
  useDie,
  useEssence,
  usePearl,
  useSeal,
  useThread,
  useWhetstone,
  type CraftResult,
} from '../run/craft';
import type { RunState } from '../run/run';
import { viewport } from './device';
import { infoProps } from './info';
import { ItemCard, rarityClass } from './ItemCard';
import { slotLabel } from '../run/inventoryOps';

/** "+N to maximum Life": what a family adds, with the numbers left out. */
function familyLabel(f: Family): string {
  const top = f.tiers[f.tiers.length - 1];
  const text = modsText(
    familyMods(
      f,
      top.ranges.map((r) => r[1]),
    ),
  )
    .join(' and ')
    .replace(/\d+(\.\d+)?/g, 'N');
  return `${f.type === 'prefix' ? 'Prefix' : 'Suffix'}: ${text}`;
}

const affixLabel = (id: string) => familyLabel(family(id));

type Row = { item: Item; where: string };

/** Every item the player has that can be crafted: worn first, then carried. */
function craftable(run: RunState): Row[] {
  const rows: Row[] = [];
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (it) rows.push({ item: it, where: slotLabel(slot) });
  }
  for (const it of run.inventory) if (it.kind === 'item') rows.push({ item: it, where: 'Carried' });
  return rows;
}

/** How wearing `next` instead of the current item changes the character (worn items only). */
function diffFor(run: RunState, current: Item, next: Item): SheetDiff | null {
  const slot = EQUIP_SLOTS.find((s) => run.build.equipment[s]?.uid === current.uid) as
    EquipSlot | undefined;
  if (!slot) return null;
  const a = new Character(run.build, cfgFor(run)).sheet();
  const b = new Character(
    { ...run.build, equipment: { ...run.build.equipment, [slot]: next } },
    cfgFor(run),
  ).sheet();
  return diffSheets(a, b);
}

export function Workbench({ c }: { c: Controller }) {
  const run = c.run!;
  const [uid, setUid] = useState<number | null>(null);
  const [pins, setPins] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [pearlFam, setPearlFam] = useState('');
  const [essence, setEssence] = useState('');
  const [essFam, setEssFam] = useState('');
  const [essReplace, setEssReplace] = useState('');
  const [sockets, setSockets] = useState(0);
  const [query, setQuery] = useState('');
  const rows = craftable(run);
  const q = query.trim().toLowerCase();
  const shown = q
    ? rows.filter(
        (r) =>
          r.item.name.toLowerCase().includes(q) ||
          r.where.toLowerCase().includes(q) ||
          itemBase(r.item.baseId).name.toLowerCase().includes(q),
      )
    : rows;
  const loc = uid !== null ? locate(run, uid) : null;
  const it = loc?.item ?? null;

  const act = (r: (run: RunState) => CraftResult | void) =>
    c.craft((run) => {
      const res = r(run);
      setMsg(res && !res.ok ? res.reason : '');
    });

  const pending = run.pendingCraft;
  const pendingItem = pending ? locate(run, pending.itemUid)?.item : null;
  const pouch = CURRENCIES.filter((d) => owned(run, d.id) > 0);
  const tablets = Object.entries(run.tablets).filter(([, n]) => n > 0);
  const complete = completeTabletSets(run);

  const choose = (u: number) => {
    setUid(u);
    setPins([]);
    setMsg('');
    const found = locate(run, u)?.item;
    setSockets(found?.sockets.length ?? 0);
    // On a phone the panel for the item is below the list: bring it into view.
    if (viewport().layout === 'phone')
      setTimeout(() => document.querySelector('.wb-work')?.scrollIntoView({ block: 'start' }), 0);
  };

  return (
    <div class="workbench">
      <div class="wb-pouch">
        <div>
          <b>Bone Dust</b> {run.dust}
        </div>
        {pouch.length === 0 && (
          <span class="muted">No currency yet. Monsters and rewards drop it.</span>
        )}
        {pouch.map((d) => (
          <span key={d.id} class="chip" {...infoProps(d.text)}>
            {d.name} × {owned(run, d.id)}
          </span>
        ))}
        {tablets.map(([id, n]) => (
          <span key={id} class="chip" {...infoProps(currencyText(TABLET_PREFIX + id))}>
            {currencyLabel(TABLET_PREFIX + id)} × {n}
            {complete.includes(id) && (
              <button class="btn small" onClick={() => act((r) => redeemTablets(r, id))}>
                Redeem
              </button>
            )}
          </span>
        ))}
      </div>
      {msg && <div class="warn">{msg}</div>}

      {pending && pendingItem && (
        <div class="wb-pick">
          <div class="notice">
            Pick a result for {pendingItem.name}. The Embers are spent either way.
          </div>
          <div class="wb-options">
            <div>
              <div class="muted">Keep the original</div>
              <ItemCard it={pendingItem} />
              <button class="btn small" onClick={() => act((r) => pickReforge(r, null))}>
                Keep it
              </button>
            </div>
            {pending.options.map((o, i) => (
              <div key={i}>
                <div class="muted">Alternative {i + 1}</div>
                <ItemCard it={o} diff={diffFor(run, pendingItem, o)} />
                <button class="btn small primary" onClick={() => act((r) => pickReforge(r, i))}>
                  Take this
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div class="wb-body">
        <div class="wb-side">
          {rows.length > 12 && (
            <input
              class="wb-search"
              type="search"
              placeholder={`Search ${rows.length} items`}
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
          )}
          <div class="wb-list">
            {shown.map(({ item, where }) => (
              <button
                key={item.uid}
                class={`inv-item ${rarityClass(item)}${uid === item.uid ? ' sel' : ''}`}
                onClick={() => choose(item.uid)}
              >
                <span class="muted">{where}</span> {item.name}
              </button>
            ))}
            {shown.length === 0 && <div class="muted">No item matches.</div>}
          </div>
        </div>
        {it && !pending && (
          <ItemWork
            run={run}
            it={it}
            pins={pins}
            setPins={setPins}
            act={act}
            pearlFam={pearlFam}
            setPearlFam={setPearlFam}
            essence={essence}
            setEssence={setEssence}
            essFam={essFam}
            setEssFam={setEssFam}
            essReplace={essReplace}
            setEssReplace={setEssReplace}
            sockets={sockets}
            setSockets={setSockets}
            carried={loc?.slot === null}
            onSalvaged={() => setUid(null)}
          />
        )}
        {!it && <div class="muted">Choose an item to work on.</div>}
      </div>
    </div>
  );
}

type WorkProps = {
  run: RunState;
  it: Item;
  pins: string[];
  setPins: (p: string[]) => void;
  act: (r: (run: RunState) => CraftResult | void) => void;
  pearlFam: string;
  setPearlFam: (s: string) => void;
  essence: string;
  setEssence: (s: string) => void;
  essFam: string;
  setEssFam: (s: string) => void;
  essReplace: string;
  setEssReplace: (s: string) => void;
  sockets: number;
  setSockets: (n: number) => void;
  carried: boolean;
  onSalvaged: () => void;
};

function ItemWork(p: WorkProps) {
  const { run, it, act } = p;
  const addable = addableFamilies(it);
  const essDef = p.essence ? currencyDef(p.essence) : null;
  const essOptions = essDef?.families?.map(family) ?? [];
  const polished = it.polished ?? [];
  const sealed = !!it.sealed;
  const ceiling = socketCeiling(it);
  const cost = socketCost(it.sockets.length, p.sockets);
  const dustCost = benchSocketCost(it.sockets.length, p.sockets, run.map);
  const have = (id: string) => owned(run, id);
  const buttons = (label: string, id: string, n: number, on: () => void, ok = true) => (
    <button class="btn small" disabled={!ok || have(id) < n || sealed} onClick={on}>
      {label} ({n} {currencyDef(id).name}
      {n > 1 ? 's' : ''})
    </button>
  );
  return (
    <div class="wb-work">
      <ItemCard it={it} />
      {sealed && <div class="warn">Sealed: this item can never be changed again.</div>}
      <h4>Affixes</h4>
      {it.affixes.length === 0 && <div class="muted">No affixes.</div>}
      {it.affixes.map((a) => (
        <div key={a.family} class="wb-affix">
          {it.rarity === 'rare' && (
            <label title="Pin: keep this affix in a reforge">
              <input
                type="checkbox"
                checked={p.pins.includes(a.family)}
                disabled={sealed}
                onChange={(e) =>
                  p.setPins(
                    (e.target as HTMLInputElement).checked
                      ? [...p.pins, a.family]
                      : p.pins.filter((f) => f !== a.family),
                  )
                }
              />{' '}
              pin
            </label>
          )}{' '}
          {modsText(a.mods).join(' · ')}
          {a.bench ? ' (bench)' : ''}
          {polished.includes(a.family) ? ' (polished)' : ''}
          <span class="wb-ops">
            <button
              class="btn small"
              disabled={sealed || have('thread') < 1}
              title="Unravelling Thread: remove this affix"
              onClick={() => act((r) => useThread(r, it.uid, a.family))}
            >
              Remove
            </button>
            <button
              class="btn small"
              disabled={
                sealed ||
                have('whetstone') < 1 ||
                polished.includes(a.family) ||
                polished.length >= POLISH_LIMIT
              }
              title="Whetstone: raise this affix to the maximum of its tier"
              onClick={() => act((r) => useWhetstone(r, it.uid, a.family))}
            >
              Polish
            </button>
            <button
              class="btn small"
              disabled={sealed || run.dust < 25 || run.map < 10}
              title="Bench: remove this affix for 25 Bone Dust"
              onClick={() => act((r) => benchRemove(r, it.uid, a.family))}
            >
              Bench remove
            </button>
          </span>
        </div>
      ))}
      {it.affixes.some((a) => a.bench) && (
        <button class="btn small" onClick={() => act((r) => benchRemoveBench(r, it.uid))}>
          Remove the bench affix (free)
        </button>
      )}

      {it.rarity === 'rare' && !sealed && (
        <div class="wb-box">
          <h4>Reforging Ember</h4>
          <div class="muted">
            Pin the affixes to keep, then pick one of three alternatives for the rest, or the
            original.
          </div>
          <button
            class="btn small"
            disabled={
              have('ember') < reforgeCost(p.pins.length) || p.pins.length >= it.affixes.length
            }
            onClick={() => act((r) => drawReforge(r, it.uid, p.pins))}
          >
            Reforge ({reforgeCost(p.pins.length)} Reforging Ember
            {reforgeCost(p.pins.length) > 1 ? 's' : ''})
          </button>
        </div>
      )}

      {!sealed && !it.uniqueId && (
        <div class="wb-box">
          <h4>Add an affix</h4>
          <select
            value={p.pearlFam}
            onChange={(e) => p.setPearlFam((e.target as HTMLSelectElement).value)}
          >
            <option value="">Choose an affix…</option>
            {addable.map((f) => (
              <option key={f.id} value={f.id}>
                {familyLabel(f)}
              </option>
            ))}
          </select>{' '}
          {buttons(
            'Marrow Pearl',
            'pearl',
            1,
            () => act((r) => usePearl(r, it.uid, p.pearlFam)),
            !!p.pearlFam,
          )}
          {BENCH_RECIPES.filter((r) => r.kind === 'add').map((r) =>
            r.kind === 'add' ? (
              <button
                key={r.family}
                class="btn small"
                disabled={run.dust < r.dust || run.map < r.minMap}
                title={`Bench: ${r.label}, ${r.dust} Bone Dust, at a mid-low tier. Unlocks at map ${r.minMap}.`}
                onClick={() => act((rn) => benchAdd(rn, it.uid, r.family))}
              >
                {r.label} ({r.dust})
              </button>
            ) : null,
          )}
        </div>
      )}

      {!sealed && !it.uniqueId && CURRENCIES.some((d) => d.families && have(d.id) > 0) && (
        <div class="wb-box">
          <h4>Essence</h4>
          <select
            value={p.essence}
            onChange={(e) => {
              p.setEssence((e.target as HTMLSelectElement).value);
              p.setEssFam('');
              p.setEssReplace('');
            }}
          >
            <option value="">Choose an essence…</option>
            {CURRENCIES.filter((d) => d.families && have(d.id) > 0).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} × {have(d.id)}
              </option>
            ))}
          </select>{' '}
          {essDef && (
            <>
              <select
                value={p.essFam}
                onChange={(e) => p.setEssFam((e.target as HTMLSelectElement).value)}
              >
                <option value="">Choose an affix…</option>
                {essOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {familyLabel(f)}
                  </option>
                ))}
              </select>{' '}
              <select
                value={p.essReplace}
                onChange={(e) => p.setEssReplace((e.target as HTMLSelectElement).value)}
              >
                <option value="">Replace nothing</option>
                {it.affixes.map((a) => (
                  <option key={a.family} value={a.family}>
                    Replace: {affixLabel(a.family)}
                  </option>
                ))}
              </select>{' '}
              <button
                class="btn small"
                disabled={!p.essFam}
                onClick={() =>
                  act((r) => useEssence(r, it.uid, p.essence, p.essFam, p.essReplace || undefined))
                }
              >
                Use
              </button>
            </>
          )}
        </div>
      )}

      {!sealed && !it.fixedSockets && ceiling > 0 && (
        <div class="wb-box">
          <h4>Sockets</h4>
          <div class="muted">
            {it.sockets.length} of up to {ceiling}. The first three are free; the 4th, 5th and 6th
            cost 1, 2 and 3 Socket Augers ({[4, 5, 6].map((k) => augerCost(k)).join(', ')}).
          </div>
          <input
            type="range"
            min={0}
            max={ceiling}
            value={p.sockets}
            onInput={(e) => p.setSockets(Number((e.target as HTMLInputElement).value))}
          />{' '}
          {p.sockets} sockets{' '}
          {buttons(
            'Set',
            'auger',
            cost,
            () => act((r) => useAuger(r, it.uid, p.sockets)),
            p.sockets !== it.sockets.length,
          )}
          {p.sockets > it.sockets.length && (
            <button
              class="btn small"
              disabled={dustCost === null || run.dust < (dustCost ?? 0)}
              title="Bench: raise the socket count for Bone Dust"
              onClick={() => act((r) => benchSockets(r, it.uid, p.sockets))}
            >
              Bench ({dustCost ?? 'locked'} Dust)
            </button>
          )}
        </div>
      )}

      <div class="wb-box">
        <h4>Gambles and the rest</h4>
        {it.rarity === 'normal' &&
          buttons('Throw the Knucklebone Die', 'die', 1, () => act((r) => useDie(r, it.uid)))}
        {!sealed &&
          buttons('Rot Seal', 'seal', 1, () => {
            if (confirm('Seal this item? It can never be changed again.'))
              act((r) => useSeal(r, it.uid));
          })}
        {p.carried && (
          <button
            class="btn small danger"
            onClick={() => {
              act((r) => salvage(r, it.uid));
              p.onSalvaged();
            }}
          >
            Salvage for {salvageValue(it)} Bone Dust
          </button>
        )}
      </div>
      <div class="muted">{itemBase(it.baseId).name}</div>
    </div>
  );
}
