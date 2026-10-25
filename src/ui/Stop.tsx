import { useState } from 'preact/hooks';
import { gemDef } from '../data/gems';
import { HOARD_TAKE, stopDef, type StopId } from '../data/stops';
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
import { cartCost, cartProblem, saleStock, shrineBlessings } from '../run/stops';
import { reprieveBlocker } from '../run/reprieves';
import { searchText } from '../run/inventoryOps';
import { waysideOf } from '../run/wayside';
import { ReprieveCard } from './Satchel';
import { WareCard } from './WareCard';
import { itemTitle, rarityClass } from './ItemCard';
import { matchesTerms, searchTerms } from './search';

/**
 * A stop's emblem: a few of the painted objects it deals in, standing in its niche (the empty middle of a stop card,
 * docs/mockups/style/STYLE-GUIDE.md section 9). The Awlsmith adds a socket to a linked row, the Gem Hoard lays out
 * gems, the Shrine is a starry roundel, the Quartermaster sells provisions, the Ferryman takes two coins.
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
  else
    inner = (
      <>
        <i class="se-coin" data-paint="medal" data-field="gold,4" data-medal="plain" />
        <i class="se-coin" data-paint="medal" data-field="gold,4" data-medal="plain" />
      </>
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
  const [reprieve, setReprieve] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  let choice: StopChoice | null = null;
  if (offer.stop === 'awlsmith' && itemUid !== null) choice = { stop: 'awlsmith', itemUid, extra };
  if (offer.stop === 'gemHoard' && tag) choice = { stop: 'gemHoard', tag, picks };
  if (offer.stop === 'shrine' && blessing) choice = { stop: 'shrine', blessing };
  if (offer.stop === 'quartermaster') choice = { stop: 'quartermaster', buy: cart };
  if (offer.stop === 'ferryman' && reprieve) choice = { stop: 'ferryman', reprieve };
  const problem = choice ? stopProblem(run, slot, choice) : 'Choose first';

  const take = () => {
    if (!choice) return;
    const res = c.takeStop(slot, choice);
    if (!res.ok) setError(res.reason);
    else onBack();
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
        <Quartermaster run={run} slot={slot} cart={cart} onCart={setCart} />
      )}
      {offer.stop === 'ferryman' && <Ferryman run={run} reprieve={reprieve} onPick={setReprieve} />}
      {error && (
        <div class="stop-warn" data-paint="panel" data-thin data-field="vermilion">
          {error}
        </div>
      )}
      <div class="stop-buttons">
        <button
          class="btn primary"
          disabled={problem !== null}
          onClick={take}
          title={problem ?? ''}
        >
          Take {def.name}
        </button>
        <button class="btn" onClick={onBack}>
          Back
        </button>
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
  const held = waysideOf(run).blessing;
  return (
    <div class="stop-body">
      {held && (
        <div class="muted">
          Current: {blessingDef(held).name} ({blessingDef(held).text})
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
  run,
  slot,
  cart,
  onCart,
}: {
  run: NonNullable<Controller['run']>;
  slot: number;
  cart: string[];
  onCart: (change: (ids: string[]) => string[]) => void;
}) {
  const stock = saleStock(run, run.offers[slot]);
  const cost = cartCost(stock, cart);
  const why = cartProblem(run, stock, cart);
  const toggle = (id: string) =>
    onCart((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  return (
    <div class="stop-body">
      <div class="wares-head">
        <span>
          In the cart: <strong>{cart.length}</strong> · <strong>{cost}</strong> of{' '}
          <strong>{run.dust.toLocaleString()}</strong> Bone Dust
        </span>
      </div>
      {why && cart.length > 0 && (
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

function Ferryman({
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
        Price: 15% less maximum life for five levels.
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
