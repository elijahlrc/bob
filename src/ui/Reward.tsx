import { useState } from 'preact/hooks';
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
      <div class="notice">Choose a reward:</div>
      {offers.map((o) => (
        <button
          key={o.uid}
          class={`inv-item ${rarityClass(o)}`}
          onMouseEnter={() => setHover(o.uid)}
          onMouseLeave={() => setHover(null)}
          onClick={() => c.act((r) => takeReward(r, o.uid))}
        >
          {itemTitle(o)}
        </button>
      ))}
      <button class="btn small" onClick={() => c.act((r) => takeReward(r, null))}>
        Skip
      </button>
      {shown && (
        <div class="reward-preview">
          <ItemCard it={shown} />
        </div>
      )}
    </div>
  );
}
