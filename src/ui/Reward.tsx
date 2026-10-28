import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { currencyLabel, currencyText } from '../data/currency';
import { itemBase } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { gemDef } from '../data/gems';
import type { ItemClass } from '../data/types';
import type { Controller } from '../run/controller';
import { seatFirstSkill } from '../run/inventoryOps';
import { takeReward } from '../run/run';
import { useViewport } from './device';
import { gemCardData } from './gemText';
import { ItemCard, itemTitle, rarityClass } from './ItemCard';
import { ProvisionCard } from './Satchel';
import { provisionDef } from '../data/provisions';
import type { RewardCard } from '../run/run';
import { uiZoom } from './uiScale';
import { sfx } from './sound/engine';
import { rewardSound } from './sound/hooks';

/** What a card of the pick is called on its button. */
function cardTitle(o: RewardCard): string {
  if (o.kind === 'pouch') return provisionDef(o.id).name;
  return o.kind === 'currency' ? `${o.count} × ${currencyLabel(o.id)}` : itemTitle(o);
}

function cardClass(o: RewardCard): string {
  return o.kind === 'pouch' ? 'flaskitem' : o.kind === 'currency' ? 'flaskitem' : rarityClass(o);
}

/** The slot glyph (leaf/kinds.ts) of an item class. */
const GLYPH: Partial<Record<ItemClass, string>> = {
  shield: 'shield',
  helmet: 'helm',
  body: 'body',
  gloves: 'gloves',
  boots: 'boots',
  ring: 'ring',
  amulet: 'amulet',
  belt: 'belt',
};

/** The small painted object at the head of a card: the gem's stone, the flask's bottle, the item's roundel. */
function CardIcon({ o }: { o: RewardCard }) {
  if (o.kind === 'gem') {
    const g = gemDef(o.gemId);
    return (
      <i
        class="reward-icon"
        data-paint="gem"
        data-gem={g.attr}
        data-shape={g.kind === 'support' ? 'support' : 'skill'}
        data-pk={o.gemId}
      />
    );
  }
  if (o.kind === 'flask')
    return (
      <i
        class="reward-icon"
        data-paint="bottle"
        data-liquid={flaskBase(o.baseId).kind}
        data-fill="0.8"
        data-pk={flaskBase(o.baseId).kind}
      />
    );
  if (o.kind === 'pouch')
    return (
      <i
        class="reward-icon"
        data-paint="bottle"
        data-liquid="util"
        data-fill="0.6"
        data-pk="pouch"
      />
    );
  if (o.kind === 'item') {
    const cls = itemBase(o.baseId).itemClass;
    return (
      <i
        class="reward-icon"
        data-paint="slot"
        data-rar={o.rarity}
        data-glyph={GLYPH[cls] ?? 'blade'}
        data-pk={`${o.rarity}${cls}`}
      />
    );
  }
  return <i class="reward-icon" data-paint="medal" data-field="gold,4" data-medal="plain" />;
}

/** The second line of a card: what kind of thing it is, when its name does not say. */
function cardKind(o: RewardCard): string | null {
  if (o.kind === 'gem') return gemCardData(gemDef(o.gemId), 1).tags.join(', ') || null;
  if (o.kind === 'pouch') return 'Provision';
  if (o.kind === 'item') {
    const b = itemBase(o.baseId).name;
    return b !== o.name ? b : null;
  }
  return null;
}

/**
 * The 1-of-3 reward pick (§5.3). With a mouse, hovering previews an offer and a click takes it. On a coarse pointer
 * there is no hover, so the first tap previews (and marks) an offer and a Take button commits it: a tap must never
 * take a reward the player has not been able to read. Each offer is an object on a small plaque with a thin gold rim;
 * the marked one has the heavy rim.
 */
export function Reward({ c, onTaken }: { c: Controller; onTaken?: (uid: number) => void }) {
  const run = c.run!;
  const { coarse } = useViewport();
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const offers = run.reward ?? [];
  const shown = offers.find((o) => o.uid === (coarse ? (picked ?? hover) : hover));
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => rewardSound(offers), [offers]);
  const take = (uid: number | null) => {
    // The run's first skill gem goes straight into a socket (docs/NEWPLAYER.md N7); the camp then says where it is.
    const ok = c.act((r) => {
      const took = takeReward(r, uid);
      if (took && uid !== null) seatFirstSkill(r, uid);
      return took;
    });
    if (ok === false) sfx('denied');
    else if (ok && uid !== null) sfx('equip');
    setNote(ok === false ? 'That does not fit now: your pouch is full.' : null);
    if (ok && uid !== null) onTaken?.(uid);
  };
  // With a mouse the preview floats by the pointer (it would push the page down in the flow), kept inside the window.
  const tip = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const place = () => {
    const el = tip.current;
    if (!el) return;
    // In interface pixels (the layer may be zoomed, uiScale.ts).
    const z = uiZoom();
    const [x, y] = [mouse.current.x / z, mouse.current.y / z];
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = x + 18;
    if (left + w > window.innerWidth / z - 8) left = Math.max(8, x - 18 - w);
    const top = Math.max(8, Math.min(y + 18, window.innerHeight / z - 8 - h));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  };
  useLayoutEffect(place, [shown?.uid]);
  return (
    <div class="reward">
      <div class="reward-head">
        {offers.length > 0 && offers.every((o) => o.kind === 'gem')
          ? 'Choose a skill gem'
          : 'Choose a reward'}
      </div>
      <div class="reward-cards">
        {offers.map((o) => {
          const sel = coarse && picked === o.uid;
          const kind = cardKind(o);
          return (
            <button
              key={o.uid}
              class={`reward-card${sel ? ' sel' : ''}`}
              data-paint="panel"
              data-thin={sel ? undefined : ''}
              data-pk={sel ? 'sel' : ''}
              onMouseEnter={(e) => {
                mouse.current = { x: e.clientX, y: e.clientY };
                setHover(o.uid);
              }}
              onMouseMove={(e) => {
                mouse.current = { x: e.clientX, y: e.clientY };
                place();
              }}
              onMouseLeave={() => setHover(null)}
              onClick={() => (coarse ? setPicked(o.uid) : take(o.uid))}
            >
              <CardIcon o={o} />
              <span class="reward-text">
                <span class={`reward-name ${cardClass(o)}`}>{cardTitle(o)}</span>
                {kind && <span class="muted">{kind}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {note && <div class="warn">{note}</div>}
      <div class="reward-buttons">
        {coarse && (
          <button class="btn small primary" disabled={picked === null} onClick={() => take(picked)}>
            Take
          </button>
        )}
        <button class="btn small" onClick={() => take(null)}>
          Skip
        </button>
      </div>
      {shown && (
        <div class={coarse ? 'reward-preview' : 'reward-preview float'} ref={tip}>
          {shown.kind === 'pouch' ? (
            <ProvisionCard id={shown.id} />
          ) : shown.kind === 'currency' ? (
            <div class="item-card flaskitem">
              <div class="ic-name" data-paint="panel" data-thin data-field="plaster">
                {shown.count} × {currencyLabel(shown.id)}
              </div>
              <div class="muted">{currencyText(shown.id)}</div>
            </div>
          ) : (
            <ItemCard it={shown} build={run.build} />
          )}
        </div>
      )}
    </div>
  );
}
