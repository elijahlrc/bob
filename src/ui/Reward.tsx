import { useState } from 'preact/hooks';
import { currencyLabel, currencyText } from '../data/currency';
import type { Controller } from '../run/controller';
import { takeReward } from '../run/run';
import { ItemCard, itemTitle, rarityClass } from './ItemCard';

/** The 1-of-3 reward pick (§5.3). */
export function Reward({ c }: { c: Controller }) {
  const run = c.run!;
  const [hover, setHover] = useState<number | null>(null);
  const offers = run.reward ?? [];
  const shown = offers.find((o) => o.uid === hover);
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
          class={`inv-item ${o.kind === 'currency' ? 'flaskitem' : rarityClass(o)}`}
          onMouseEnter={() => setHover(o.uid)}
          onMouseLeave={() => setHover(null)}
          onClick={() => c.act((r) => takeReward(r, o.uid))}
        >
          {o.kind === 'currency' ? `${o.count} × ${currencyLabel(o.id)}` : itemTitle(o)}
        </button>
      ))}
      <button class="btn small" onClick={() => c.act((r) => takeReward(r, null))}>
        Skip
      </button>
      {shown && (
        <div class="reward-preview">
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
