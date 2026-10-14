import { useState } from 'preact/hooks';
import { currencyLabel, currencyText } from '../data/currency';
import { resistPenaltyForMap } from '../gen/mapPlan';
import type { Controller } from '../run/controller';
import { ensureMarket } from '../run/market';
import type { Ware } from '../run/wayside';
import { compareDelta, ItemCard } from './ItemCard';

/** The Market (docs/WAYSIDE.md section 4): a few wares for Bone Dust, restocked every level. */
export function Wares({ c }: { c: Controller }) {
  const run = c.run!;
  const stock = ensureMarket(run);
  const [error, setError] = useState<string | null>(null);
  const cfg = {
    areaLevel: run.map,
    difficulty: run.difficulty,
    resistPenalty: resistPenaltyForMap(run.map),
  };
  const buy = (w: Ware) => {
    const res = c.buy(w.id);
    setError(res.ok ? null : res.reason);
  };
  return (
    <div class="wares">
      <div class="wares-head">
        <h3>Wares</h3>
        <span class="dust" title="What salvaging items pays. Spend it here.">
          Bone Dust: <strong>{run.dust.toLocaleString()}</strong>
        </span>
      </div>
      <div class="muted">
        The stock changes every level. Salvage items you do not need in the Items tab to earn Bone
        Dust.
      </div>
      {error && <div class="warn">{error}</div>}
      <div class="ware-grid">
        {stock.map((w) => (
          <div key={w.id} class={'ware' + (w.sold ? ' sold' : '')}>
            {w.item ? (
              <ItemCard
                it={w.item}
                build={run.build}
                diff={w.item.kind === 'item' ? compareDelta(run.build, w.item, cfg) : null}
              />
            ) : (
              <div class="item-card flaskitem">
                <div class="ic-name">
                  {w.count} × {currencyLabel(w.ref!)}
                </div>
                <div class="muted">{currencyText(w.ref!)}</div>
              </div>
            )}
            <div class="ware-buy">
              <span class="ware-price">{w.price} Bone Dust</span>
              <button
                class="btn small primary"
                disabled={w.sold || run.dust < w.price}
                onClick={() => buy(w)}
              >
                {w.sold ? 'Bought' : 'Buy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
