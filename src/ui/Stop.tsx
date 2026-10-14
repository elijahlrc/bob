import { useState } from 'preact/hooks';
import { gemDef } from '../data/gems';
import { HOARD_TAKE, stopDef } from '../data/stops';
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
import { itemTitle, rarityClass } from './ItemCard';

/** What the level costs, in words the stop's screen and its card share. */
export const STOP_PRICE =
  'The level passes with no loot, no XP and no clear rewards, as with a Respite; you get ten seconds of rest.';

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
  const [error, setError] = useState<string | null>(null);

  let choice: StopChoice | null = null;
  if (offer.stop === 'awlsmith' && itemUid !== null) choice = { stop: 'awlsmith', itemUid, extra };
  if (offer.stop === 'gemHoard' && tag) choice = { stop: 'gemHoard', tag, picks };
  const problem = choice ? stopProblem(run, slot, choice) : 'Choose first';

  const take = () => {
    if (!choice) return;
    const res = c.takeStop(slot, choice);
    if (!res.ok) setError(res.reason);
    else onBack();
  };

  return (
    <div class="stop">
      <h3 class="stop-name">{def.name}</h3>
      <div class="muted">Level {offer.areaLevel} passes here.</div>
      <p>{def.how}</p>
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
      <div class="stop-price muted">{STOP_PRICE}</div>
      {error && <div class="warn">{error}</div>}
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
          Back to the offers
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
  const chosen = items.find((i) => i.uid === itemUid);
  const augers = run.currency.auger ?? 0;
  if (!items.length)
    return <div class="muted">None of your items has room for another socket.</div>;
  const row = (it: Item) => (
    <button
      key={it.uid}
      class={'stop-item btn' + (it.uid === itemUid ? ' on' : '')}
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
      <div class="stop-list">{items.map(row)}</div>
      {chosen && awlsmithRoom(chosen) > 1 && (
        <div class="stop-extra">
          <span>Sockets beyond the first:</span>
          <button class="btn small" disabled={extra <= 0} onClick={() => onExtra(extra - 1)}>
            −
          </button>
          <strong>{extra}</strong>
          <button
            class="btn small"
            disabled={extra + 1 >= awlsmithRoom(chosen) || awlsmithCost(chosen, extra + 2) > augers}
            onClick={() => onExtra(extra + 1)}
          >
            +
          </button>
          <span class="muted">
            {awlsmithCost(chosen, extra + 1)} Socket Auger
            {awlsmithCost(chosen, extra + 1) === 1 ? '' : 's'} of {augers}
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
                class={'stop-gem btn' + (picks.includes(id) ? ' on' : '')}
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
