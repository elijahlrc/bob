import { DAMAGE_TYPES } from '../mods/types';
import { infoProps } from './info';

const f0 = (v: number) => Math.round(v).toLocaleString();
const pct = (v: number) => `${v >= 10 ? Math.round(v) : v.toFixed(1)}%`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * A painted bar split by damage type (the offer cards' bar, leaf/shapes.ts `mixBar`), shared by the Last map screen and the
 * Strategy tab's Damage details; styled by report.css (`mr-bar`). Each type's stretch of it says its damage and share on a
 * hover, or on a tap on a touch screen. `scale` is how much of the full width the whole bar takes (1 for the largest row).
 */
export function TypeBar({ dmg, scale = 1 }: { dmg: number[]; scale?: number }) {
  const total = dmg.reduce((a, b) => a + b, 0);
  if (total <= 0) return <div class="mr-bar" />;
  const mix = dmg.map((d) => (d / total).toFixed(3)).join(',');
  let at = 0;
  const segs = dmg.map((d, i) => {
    const left = at;
    at += d / total;
    // A sliver too thin to point at gets no stretch of its own.
    if (d / total < 0.01) return null;
    return (
      <span
        key={i}
        class="mr-seg"
        style={{ left: `${left * 100}%`, width: `${(d / total) * 100}%` }}
        {...infoProps(`${cap(DAMAGE_TYPES[i])} ${f0(d)} (${pct((d / total) * 100)})`)}
      />
    );
  });
  return (
    <div class="mr-bar">
      <div
        class="mr-fill"
        data-paint="mix"
        data-mix={mix}
        data-pk={mix}
        style={{ width: `max(22px, ${scale * 100}%)` }}
      >
        {segs}
      </div>
    </div>
  );
}
