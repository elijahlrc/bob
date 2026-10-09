import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { currencyLabel, currencyText } from '../data/currency';
import type { Controller } from '../run/controller';
import { takeReward } from '../run/run';
import { useViewport } from './device';
import { ItemCard, itemTitle, rarityClass } from './ItemCard';

/**
 * The 1-of-3 reward pick (§5.3). With a mouse, hovering previews an offer and a click takes it. On a coarse pointer
 * there is no hover, so the first tap previews (and marks) an offer and a Take button commits it: a tap must never
 * take a reward the player has not been able to read.
 */
export function Reward({ c }: { c: Controller }) {
  const run = c.run!;
  const { coarse } = useViewport();
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const offers = run.reward ?? [];
  const shown = offers.find((o) => o.uid === (coarse ? (picked ?? hover) : hover));
  const take = (uid: number | null) => c.act((r) => takeReward(r, uid));
  // With a mouse the preview floats by the pointer (it would push the page down in the flow), kept inside the window.
  const tip = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const place = () => {
    const el = tip.current;
    if (!el) return;
    const { x, y } = mouse.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = x + 18;
    if (left + w > window.innerWidth - 8) left = Math.max(8, x - 18 - w);
    const top = Math.max(8, Math.min(y + 18, window.innerHeight - 8 - h));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  };
  useLayoutEffect(place, [shown?.uid]);
  return (
    <div class="reward">
      <div class="notice">
        {offers.length > 0 && offers.every((o) => o.kind === 'gem')
          ? 'Choose a skill gem:'
          : 'Choose a reward:'}
      </div>
      {offers.map((o) => (
        <button
          key={o.uid}
          class={`inv-item ${o.kind === 'currency' ? 'flaskitem' : rarityClass(o)}${
            coarse && picked === o.uid ? ' sel' : ''
          }`}
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
          {o.kind === 'currency' ? `${o.count} × ${currencyLabel(o.id)}` : itemTitle(o)}
        </button>
      ))}
      {coarse && (
        <button class="btn small primary" disabled={picked === null} onClick={() => take(picked)}>
          Take
        </button>
      )}
      <button class="btn small" onClick={() => take(null)}>
        Skip
      </button>
      {shown && (
        <div class={coarse ? 'reward-preview' : 'reward-preview float'} ref={tip}>
          {shown.kind === 'currency' ? (
            <div class="item-card flaskitem">
              <div class="ic-name">
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
