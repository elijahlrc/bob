import { useEffect, useState } from 'preact/hooks';
import { gemDef } from '../data/gems';
import {
  HOARD_TAKE,
  KNUCKLE_ODDS,
  stopDef,
  SURGEON_MAX,
  surgeonTrade,
  type StopId,
} from '../data/stops';
import { classDef } from '../data/classes';
import { modsText } from '../mods/text';
import type { Mod } from '../mods/types';
import {
  enviousRelics,
  knuckleCost,
  knuckleItems,
  knuckleProblem,
  knuckleThrow,
  openShade,
  surgeonMods,
  surgeonTrades,
  visitLocked,
  visitShade,
} from '../run/stops';
import { shadeItems, shadeKey } from '../run/shades';
import { ItemCard } from './ItemCard';
import { RelicPanel } from './WareCard';
import { runRewardDef } from '../data/runRewards';
import type { Item } from '../data/types';
import type { Controller } from '../run/controller';
import {
  awlsmithCost,
  awlsmithItems,
  awlsmithRoom,
  hoardGems,
  hoardKinds,
  stopProblem,
  type StopChoice,
} from '../run/stops';
import { GemCard } from './GemCard';
import { blessingDef } from '../data/blessings';
import { REPRIEVES } from '../data/reprieves';
import {
  cartCost,
  cartProblem,
  refillPrice,
  restockPrice,
  restockQuartermaster,
  saleStock,
  shrineBlessings,
} from '../run/stops';
import { reprieveBlocker } from '../run/reprieves';
import { searchText } from '../run/inventoryOps';
import { waysideOf } from '../run/wayside';
import { ReprieveCard } from './Satchel';
import { WareCard } from './WareCard';
import { itemTitle, rarityClass } from './ItemCard';
import { matchesTerms, searchTerms } from './search';
import { sfx } from './sound/engine';

/**
 * A stop's emblem: a few of the painted objects it deals in, standing in its niche (the empty middle of a stop card,
 * docs/mockups/style/STYLE-GUIDE.md section 9). The Awlsmith adds a socket to a linked row, the Gem Hoard lays out
 * gems, the Shrine is a starry roundel, the Quartermaster sells provisions, the Bloodletter's bottle of life is nearly drained.
 */
export function StopEmblem({ stop }: { stop: StopId }) {
  const gem = (g: string, shape = 'skill', state?: string) => (
    <i
      class="se-gem"
      data-paint="gem"
      data-gem={g}
      data-shape={shape}
      data-state={state}
      data-pk={g + shape + (state ?? '')}
    />
  );
  const link = <i class="se-chain" data-paint="chain" data-dir="x" />;
  let inner;
  if (stop === 'awlsmith')
    inner = (
      <>
        {gem('int')}
        {link}
        {gem('str')}
        {link}
        {gem('empty', 'skill', 'target')}
      </>
    );
  else if (stop === 'gemHoard')
    inner = (
      <>
        {gem('dex')}
        {gem('int', 'support')}
        {gem('str')}
      </>
    );
  else if (stop === 'shrine')
    inner = <i class="se-medal" data-paint="medal" data-field="lapis,3" data-medal="stars" />;
  else if (stop === 'quartermaster')
    inner = (
      <>
        <i
          class="se-bottle"
          data-paint="bottle"
          data-liquid="life"
          data-fill="0.8"
          data-pk="life"
        />
        <i
          class="se-bottle"
          data-paint="bottle"
          data-liquid="util"
          data-fill="0.6"
          data-pk="util"
        />
        <i
          class="se-bottle"
          data-paint="bottle"
          data-liquid="mana"
          data-fill="0.9"
          data-pk="mana"
        />
      </>
    );
  else if (stop === 'surgeon')
    inner = (
      <>
        <i
          class="se-bottle"
          data-paint="bottle"
          data-liquid="life"
          data-fill="0.5"
          data-pk="life"
        />
        {link}
        <i
          class="se-bottle"
          data-paint="bottle"
          data-liquid="mana"
          data-fill="0.5"
          data-pk="mana"
        />
      </>
    );
  else if (stop === 'knucklebone')
    inner = (
      <>
        {gem('str', 'support')}
        {gem('dex', 'support')}
        {gem('int', 'support')}
      </>
    );
  else if (stop === 'enviousDead')
    inner = <i class="se-medal" data-paint="medal" data-field="vermilion,4" data-medal="plain" />;
  else if (stop === 'remains')
    inner = <i class="se-medal" data-paint="medal" data-field="plaster,3" data-medal="plain" />;
  else
    inner = (
      <i class="se-bottle" data-paint="bottle" data-liquid="life" data-fill="0.15" data-pk="bled" />
    );
  return (
    <div class={'stop-emblem se-' + stop} aria-hidden="true">
      {inner}
    </div>
  );
}

/** A thing to choose on a stop: a small plaque with a thin gold rim, the chosen one with the heavy rim. */
const plaque = (on: boolean) => ({
  'data-paint': 'panel',
  'data-thin': on ? undefined : '',
  'data-pk': on ? 'on' : '',
});

/** The screen of a stop the player has chosen (docs/WAYSIDE.md section 5): nothing is done until it is confirmed. */
export function StopScreen({
  c,
  slot,
  onBack,
}: {
  c: Controller;
  slot: number;
  onBack: () => void;
}) {
  const run = c.run!;
  const offer = run.offers[slot];
  if (!offer || offer.kind !== 'stop') return null;
  const def = stopDef(offer.stop!);
  const [itemUid, setItemUid] = useState<number | null>(null);
  const [extra, setExtra] = useState(0);
  const [tag, setTag] = useState<string | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [blessing, setBlessing] = useState<string | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  const [refill, setRefill] = useState(false);
  const [reprieve, setReprieve] = useState<string | null>(null);
  const [trades, setTrades] = useState<string[]>([]);
  const [relic, setRelic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A rivals stop keeps the shade it was opened with for the visit (docs/ATTRITION.md).
  const status = c.shades[shadeKey(run, offer.id)];
  const rivals = !!def.rivals;
  useEffect(() => {
    if (rivals && status?.state === 'ready' && !visitShade(run, slot))
      c.act((r) => openShade(r, slot, status.shade));
  }, [rivals, status, slot]);
  const visit = waysideOf(run).stopVisit;
  const locked = visitLocked(visit) && visit!.slot === slot;
  const duel = visit?.slot === slot ? visit.duel : undefined;

  let choice: StopChoice | null = null;
  if (offer.stop === 'awlsmith' && itemUid !== null) choice = { stop: 'awlsmith', itemUid, extra };
  if (offer.stop === 'gemHoard' && tag) choice = { stop: 'gemHoard', tag, picks };
  if (offer.stop === 'shrine' && blessing) choice = { stop: 'shrine', blessing };
  if (offer.stop === 'quartermaster') choice = { stop: 'quartermaster', buy: cart, refill };
  if (offer.stop === 'ferryman' && reprieve) choice = { stop: 'ferryman', reprieve };
  if (offer.stop === 'surgeon' && trades.length) choice = { stop: 'surgeon', trades };
  if (offer.stop === 'knucklebone') choice = { stop: 'knucklebone' };
  if (offer.stop === 'enviousDead' && duel && duel !== 'won') choice = { stop: 'enviousDead' };
  if (offer.stop === 'enviousDead' && duel === 'won' && itemUid !== null)
    choice = { stop: 'enviousDead', itemUid, relic: relic ?? undefined };
  if (offer.stop === 'remains' && itemUid !== null) choice = { stop: 'remains', itemUid };
  const problem = choice ? stopProblem(run, slot, choice) : 'Choose first';

  const take = () => {
    if (!choice) return;
    const dust = run.dust;
    const res = c.takeStop(slot, choice);
    // Paying Bone Dust pours it; the other stops answer with the tap's own Press.
    if (res.ok && run.dust < dust) sfx('dust');
    if (!res.ok) {
      sfx('denied');
      setError(res.reason);
    } else onBack();
  };

  return (
    <div class="stop" data-paint="panel" data-field="porphyry" data-arch data-foot data-loss="0.02">
      <div class="stop-name">{def.name}</div>
      <div class="muted stop-level">Level {offer.areaLevel}</div>
      <StopEmblem stop={offer.stop!} />
      {def.flavour && <p class="stop-flavour">{def.flavour}</p>}
      <p class="stop-how">{def.how}</p>
      {offer.stop === 'awlsmith' && (
        <Awlsmith
          run={run}
          itemUid={itemUid}
          extra={extra}
          onPick={(uid) => {
            setItemUid(uid);
            setExtra(0);
          }}
          onExtra={setExtra}
        />
      )}
      {offer.stop === 'gemHoard' && (
        <Hoard
          c={c}
          slot={slot}
          tag={tag}
          picks={picks}
          onTag={(t) => {
            setTag(t);
            setPicks([]);
          }}
          onPicks={setPicks}
        />
      )}
      {offer.stop === 'shrine' && (
        <Shrine run={run} slot={slot} blessing={blessing} onPick={setBlessing} />
      )}
      {offer.stop === 'quartermaster' && (
        <Quartermaster
          c={c}
          slot={slot}
          cart={cart}
          onCart={setCart}
          refill={refill}
          onRefill={setRefill}
        />
      )}
      {offer.stop === 'ferryman' && (
        <Bloodletter run={run} reprieve={reprieve} onPick={setReprieve} />
      )}
      {offer.stop === 'surgeon' && (
        <Surgeon run={run} slot={slot} trades={trades} onTrades={setTrades} />
      )}
      {offer.stop === 'knucklebone' && (
        <Knucklebone c={c} slot={slot} itemUid={itemUid} onPick={setItemUid} />
      )}
      {(offer.stop === 'enviousDead' || offer.stop === 'remains') && (
        <ShadeStop
          c={c}
          slot={slot}
          itemUid={itemUid}
          onPick={setItemUid}
          relic={relic}
          onRelic={setRelic}
        />
      )}
      {error && (
        <div class="stop-warn" data-paint="panel" data-thin data-field="vermilion">
          {error}
        </div>
      )}
      <div class="stop-buttons">
        {offer.stop === 'enviousDead' && !duel ? (
          <button
            class="btn primary"
            disabled={!visitShade(run, slot)}
            onClick={() => {
              if (!c.startShadeDuel(slot)) {
                sfx('denied');
                setError('The shade would not fight.');
              }
            }}
          >
            Duel for your damned soul's fate
          </button>
        ) : (
          <button
            class="btn primary"
            disabled={problem !== null}
            onClick={take}
            title={problem ?? ''}
          >
            {offer.stop === 'knucklebone' || (offer.stop === 'enviousDead' && duel !== 'won')
              ? 'Leave'
              : offer.stop === 'enviousDead'
                ? 'Take them'
                : offer.stop === 'remains'
                  ? 'Take it'
                  : `Take ${def.name}`}
          </button>
        )}
        {!locked && (
          <button class="btn" onClick={onBack}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}

function Awlsmith({
  run,
  itemUid,
  extra,
  onPick,
  onExtra,
}: {
  run: NonNullable<Controller['run']>;
  itemUid: number | null;
  extra: number;
  onPick: (uid: number) => void;
  onExtra: (n: number) => void;
}) {
  const items = awlsmithItems(run);
  const worn = new Set(Object.values(run.build.equipment).map((i) => i?.uid));
  const nWorn = items.filter((i) => worn.has(i.uid)).length;
  const [show, setShow] = useState<'worn' | 'carried' | 'all'>(nWorn ? 'worn' : 'all');
  const [search, setSearch] = useState('');
  const chosen = items.find((i) => i.uid === itemUid);
  const dust = run.dust;
  if (!items.length)
    return <div class="muted">None of your items has room for another socket.</div>;
  const terms = searchTerms(search);
  const shown = items.filter(
    (i) =>
      (show === 'all' || worn.has(i.uid) === (show === 'worn')) &&
      matchesTerms(searchText(i), terms),
  );
  const chips: [typeof show, string, number][] = [
    ['worn', 'Worn', nWorn],
    ['carried', 'Carried', items.length - nWorn],
    ['all', 'All', items.length],
  ];
  const row = (it: Item) => (
    <button
      key={it.uid}
      class={'stop-item' + (it.uid === itemUid ? ' sel' : '')}
      {...plaque(it.uid === itemUid)}
      onClick={() => onPick(it.uid)}
    >
      <span class={'stop-item-name ' + rarityClass(it)}>{itemTitle(it)}</span>
      <span class="muted">
        {worn.has(it.uid) ? 'worn · ' : ''}
        {it.sockets.length} → {it.sockets.length + 1} sockets
      </span>
    </button>
  );
  return (
    <div class="stop-body">
      <div class="stop-kinds">
        {chips.map(([id, name, n]) => (
          <button
            key={id}
            class={'btn small' + (id === show ? ' on' : '')}
            onClick={() => setShow(id)}
          >
            {name} ({n})
          </button>
        ))}
      </div>
      <input
        class="ix-search"
        type="search"
        placeholder="Search items"
        aria-label="Search items"
        value={search}
        onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
      />
      <div class="stop-list">
        {shown.map(row)}
        {!shown.length && <div class="muted">Nothing here. Try another filter.</div>}
      </div>
      {chosen && !shown.includes(chosen) && <div class="muted">Chosen: {itemTitle(chosen)}</div>}
      {chosen && awlsmithRoom(chosen) > 1 && (
        <div class="stop-extra">
          <span>Extra sockets:</span>
          <button class="btn small" disabled={extra <= 0} onClick={() => onExtra(extra - 1)}>
            −
          </button>
          <strong>{extra}</strong>
          <button
            class="btn small"
            disabled={extra + 1 >= awlsmithRoom(chosen) || awlsmithCost(chosen, extra + 2) > dust}
            onClick={() => onExtra(extra + 1)}
          >
            +
          </button>
          <span class="muted">
            {awlsmithCost(chosen, extra + 1)} Bone Dust of {dust}
          </span>
        </div>
      )}
    </div>
  );
}

function Hoard({
  c,
  slot,
  tag,
  picks,
  onTag,
  onPicks,
}: {
  c: Controller;
  slot: number;
  tag: string | null;
  picks: string[];
  onTag: (t: string) => void;
  onPicks: (p: string[]) => void;
}) {
  const run = c.run!;
  const offer = run.offers[slot];
  const kinds = hoardKinds(run, offer);
  const laid = tag ? hoardGems(run, offer, tag) : [];
  const want = Math.min(HOARD_TAKE, laid.length);
  const toggle = (id: string) =>
    onPicks(picks.includes(id) ? picks.filter((x) => x !== id) : [...picks, id].slice(-want));
  return (
    <div class="stop-body">
      <div class="stop-kinds">
        {kinds.map((k) => (
          <button
            key={k.tag}
            class={'btn small' + (k.tag === tag ? ' on' : '')}
            onClick={() => onTag(k.tag)}
          >
            {k.name}
          </button>
        ))}
      </div>
      {tag && (
        <>
          <div class="muted">
            Take {want}: {picks.length} chosen.
          </div>
          <div class="stop-gems">
            {laid.map((id) => (
              <button
                key={id}
                class={'stop-gem' + (picks.includes(id) ? ' sel' : '')}
                {...plaque(picks.includes(id))}
                onClick={() => toggle(id)}
                title={gemDef(id).name}
              >
                <GemCard gemId={id} level={1} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Shrine({
  run,
  slot,
  blessing,
  onPick,
}: {
  run: NonNullable<Controller['run']>;
  slot: number;
  blessing: string | null;
  onPick: (id: string) => void;
}) {
  const ids = shrineBlessings(run, run.offers[slot]);
  const way = waysideOf(run);
  const held = way.blessing && (way.blessingUntil ?? Infinity) >= run.map ? way.blessing : null;
  return (
    <div class="stop-body">
      {held && (
        <div class="muted">
          Current: {blessingDef(held).name} ({blessingDef(held).text}). A new one replaces it.
        </div>
      )}
      <div class="stop-list">
        {ids.map((id) => (
          <button
            key={id}
            class={'stop-item' + (id === blessing ? ' sel' : '')}
            {...plaque(id === blessing)}
            onClick={() => onPick(id)}
          >
            <span class="stop-item-name">{blessingDef(id).name}</span>
            <span class="muted">{blessingDef(id).text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Quartermaster({
  c,
  slot,
  cart,
  onCart,
  refill,
  onRefill,
}: {
  c: Controller;
  slot: number;
  cart: string[];
  onCart: (change: (ids: string[]) => string[]) => void;
  refill: boolean;
  onRefill: (on: boolean) => void;
}) {
  const run = c.run!;
  const stock = saleStock(run, run.offers[slot]);
  const refillCost = refillPrice(run);
  const restockCost = restockPrice(run);
  const cost = cartCost(stock, cart) + (refill ? refillCost : 0);
  const why = cartProblem(run, stock, cart, refill);
  const toggle = (id: string) =>
    onCart((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const restock = () => {
    const res = c.craft((r) => restockQuartermaster(r, slot));
    if (res?.ok) {
      sfx('dust');
      onCart(() => []);
    } else sfx('denied');
  };
  return (
    <div class="stop-body">
      <div class="wares-head">
        <span>
          In the cart: <strong>{cart.length}</strong> · <strong>{cost}</strong> of{' '}
          <strong>{run.dust.toLocaleString()}</strong> Bone Dust
        </span>
      </div>
      <div class="stop-kinds">
        <button class={'btn small' + (refill ? ' on' : '')} onClick={() => onRefill(!refill)}>
          {refill ? 'Flask refill in the cart' : `Refill every flask: ${refillCost} Bone Dust`}
        </button>
        <button class="btn small" disabled={run.dust < restockCost} onClick={restock}>
          Restock: {restockCost} Bone Dust
        </button>
      </div>
      {why && (cart.length > 0 || refill) && (
        <div class="stop-warn" data-paint="panel" data-thin data-field="vermilion">
          {why}
        </div>
      )}
      <div class="ware-grid">
        {stock.map((w) => (
          <div
            key={w.id}
            class={'ware' + (cart.includes(w.id) ? ' chosen' : '')}
            {...plaque(cart.includes(w.id))}
          >
            <WareCard w={w} run={run} />
            <div class="ware-buy">
              <span class="ware-price">{w.price} Bone Dust</span>
              <button
                class={'btn small' + (cart.includes(w.id) ? ' on' : '')}
                onClick={() => toggle(w.id)}
              >
                {cart.includes(w.id) ? 'In the cart' : 'Add'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bloodletter({
  run,
  reprieve,
  onPick,
}: {
  run: NonNullable<Controller['run']>;
  reprieve: string | null;
  onPick: (id: string) => void;
}) {
  const blocked = reprieveBlocker(run);
  return (
    <div class="stop-body">
      <div class="stop-warn" data-paint="panel" data-thin data-field="vermilion">
        Price: 15% less maximum life for five levels. Your flasks are refilled.
      </div>
      {blocked && (
        <div class="stop-warn" data-paint="panel" data-thin data-field="vermilion">
          {blocked}
        </div>
      )}
      <div class="stop-list">
        {REPRIEVES.map((r) => (
          <button
            key={r.id}
            class={'stop-item' + (r.id === reprieve ? ' sel' : '')}
            {...plaque(r.id === reprieve)}
            onClick={() => onPick(r.id)}
          >
            <ReprieveCard id={r.id} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Mods alike but for their value, added together (the Surgeon's trades in all). */
function summed(mods: Mod[]): Mod[] {
  const out = new Map<string, Mod>();
  for (const m of mods) {
    const key = `${m.stat}|${m.kind}`;
    const had = out.get(key);
    out.set(key, had ? { ...had, value: had.value + m.value } : { ...m });
  }
  return [...out.values()].filter((m) => m.value !== 0);
}

/** A trade's lines: what it gives (less after the first, `surgeonMods`) and what it takes. */
function tradeLines(id: string, nth: number): { gain: string[]; price: string[] } {
  const t = surgeonTrade(id)!;
  const mods = surgeonMods([...new Array(nth).fill(id), id]).slice(
    -(t.gain.length + t.price.length),
  );
  return {
    gain: modsText(mods.slice(0, t.gain.length)),
    price: modsText(mods.slice(t.gain.length)),
  };
}

function Surgeon({
  run,
  slot,
  trades,
  onTrades,
}: {
  run: NonNullable<Controller['run']>;
  slot: number;
  trades: string[];
  onTrades: (t: string[]) => void;
}) {
  const offered = surgeonTrades(run, run.offers[slot]);
  const full = trades.length >= SURGEON_MAX;
  return (
    <div class="stop-body">
      <div class="muted">
        Trades chosen: {trades.length} of {SURGEON_MAX}.
      </div>
      <div class="stop-list">
        {offered.map((id) => {
          const { gain, price } = tradeLines(id, trades.length);
          return (
            <button
              key={id}
              class="stop-item"
              {...plaque(false)}
              disabled={full}
              onClick={() => onTrades([...trades, id])}
            >
              <span class="stop-item-name">{gain.join(', ')}</span>
              <span class="muted">Price: {price.join(', ')}</span>
            </button>
          );
        })}
      </div>
      {trades.length > 0 && (
        <div class="stop-extra">
          <span>In all: {modsText(summed(surgeonMods(trades))).join(', ')}</span>
          <button class="btn small" onClick={() => onTrades(trades.slice(0, -1))}>
            Undo the last
          </button>
        </div>
      )}
    </div>
  );
}

/** What the bones did, in a few words. */
const THROWN: Record<string, string> = {
  down: 'The bones fall badly: an affix drops a tier.',
  nothing: 'The bones fall badly, but find nothing to take.',
  up: 'The bones raise an affix a tier.',
  add: 'The bones add an affix.',
  best: 'The bones raise an affix to its best tier.',
  all: 'Jackpot! Every affix rises to its best tier.',
};

/** The bones' odds, in a line. */
const ODDS = `${KNUCKLE_ODDS.good}%: an affix rises a tier. ${KNUCKLE_ODDS.great}%: one rises to its best tier. ${KNUCKLE_ODDS.jackpot}%: all do. ${KNUCKLE_ODDS.bad}%: one drops a tier.`;

function Knucklebone({
  c,
  slot,
  itemUid,
  onPick,
}: {
  c: Controller;
  slot: number;
  itemUid: number | null;
  onPick: (uid: number) => void;
}) {
  const run = c.run!;
  const items = knuckleItems(run);
  const worn = new Set(Object.values(run.build.equipment).map((i) => i?.uid));
  const [said, setSaid] = useState<string | null>(null);
  const chosen = items.find((i) => i.uid === itemUid) ?? null;
  const why = chosen ? knuckleProblem(run, slot, chosen.uid) : null;
  const cost = chosen ? knuckleCost(run, chosen, slot) : 0;
  const roll = () => {
    if (!chosen) return;
    const res = c.craft((r) => knuckleThrow(r, slot, chosen.uid));
    if (res?.ok) {
      sfx('dust');
      setSaid(THROWN[res.what ?? ''] ?? null);
    } else {
      sfx('denied');
      setSaid(res && !res.ok ? res.reason : null);
    }
  };
  if (!items.length) return <div class="muted">None of your items can be thrown over.</div>;
  return (
    <div class="stop-body">
      <div class="muted">You have {run.dust.toLocaleString()} Bone Dust.</div>
      <div class="stop-list">
        {items.map((it) => (
          <button
            key={it.uid}
            class={'stop-item' + (it.uid === itemUid ? ' sel' : '')}
            {...plaque(it.uid === itemUid)}
            onClick={() => {
              onPick(it.uid);
              setSaid(null);
            }}
          >
            <span class={'stop-item-name ' + rarityClass(it)}>{itemTitle(it)}</span>
            <span class="muted">{worn.has(it.uid) ? 'worn' : 'carried'}</span>
          </button>
        ))}
      </div>
      {chosen && (
        <>
          <ItemCard it={chosen} build={run.build} />
          {said && <div class="stop-flavour">{said}</div>}
          <div class="muted">{ODDS}</div>
          <div class="stop-kinds">
            <button class="btn small" disabled={why !== null} onClick={roll} title={why ?? ''}>
              Throw: {cost} Bone Dust
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ShadeStop({
  c,
  slot,
  itemUid,
  onPick,
  relic,
  onRelic,
}: {
  c: Controller;
  slot: number;
  itemUid: number | null;
  onPick: (uid: number) => void;
  relic: string | null;
  onRelic: (id: string) => void;
}) {
  const run = c.run!;
  const offer = run.offers[slot];
  const shade = visitShade(run, slot);
  const status = c.shades[shadeKey(run, offer.id)];
  if (!shade)
    return (
      <div class="muted">
        {status?.state === 'closed' ? status.why : 'Looking for a fallen player near this level…'}
      </div>
    );
  const duel = waysideOf(run).stopVisit?.duel;
  const who = (
    <div class="stop-flavour">
      {shade.name}, a level {shade.level} {classDef(shade.classId).name}, fell on map {shade.map}.
    </div>
  );
  if (offer.stop === 'enviousDead' && duel !== 'won')
    return (
      <div class="stop-body">
        {who}
        {duel === 'lost' || duel === 'fought' ? (
          <div class="stop-warn" data-paint="panel" data-thin data-field="vermilion">
            The shade was not beaten, but you live. Only the level is spent.
          </div>
        ) : (
          <div class="muted">
            Win or lose, you walk away alive, with your life and flasks as they were.
          </div>
        )}
      </div>
    );
  const items = shadeItems(shade);
  const relics = offer.stop === 'enviousDead' ? enviousRelics(run, offer) : [];
  return (
    <div class="stop-body">
      {who}
      {offer.stop === 'enviousDead' && (
        <div class="muted">You won. Take one of its items and a relic.</div>
      )}
      <div class="ware-grid">
        {items.map((it) => (
          <div
            key={it.uid}
            class={'ware' + (it.uid === itemUid ? ' chosen' : '')}
            {...plaque(it.uid === itemUid)}
          >
            <ItemCard it={it} build={run.build} />
            <div class="ware-buy">
              <button
                class={'btn small' + (it.uid === itemUid ? ' on' : '')}
                onClick={() => onPick(it.uid)}
              >
                {it.uid === itemUid ? 'Chosen' : 'Choose'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {relics.length > 0 && (
        <div class="stop-list">
          {relics.map((id) => (
            <button
              key={id}
              class={'stop-item' + (id === relic ? ' sel' : '')}
              {...plaque(id === relic)}
              onClick={() => onRelic(id)}
              title={runRewardDef(id).text}
            >
              <RelicPanel id={id} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
