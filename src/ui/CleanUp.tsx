import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Rarity } from '../data/types';
import { applyClean, cleanSummary } from '../run/cleanUp';
import type { Controller } from '../run/controller';
import { DEFAULT_CLEAN, type CleanOpts } from '../run/found';
import { itemTitle, rarityClass } from './ItemCard';
import { loadPref, savePref } from './prefs';

const RARITIES: [Rarity, string][] = [
  ['normal', 'Normal'],
  ['magic', 'Magic'],
  ['rare', 'Rare'],
  ['unique', 'Unique'],
];

/** The saved options, repaired where a saved value is missing or out of range. */
function loadOpts(): CleanOpts {
  const o = loadPref<Partial<CleanOpts>>('inv.clean', {});
  return {
    ...DEFAULT_CLEAN,
    ...o,
    olderThan: Math.max(1, Math.min(100, Math.round(o.olderThan ?? DEFAULT_CLEAN.olderThan))),
    rarities: { ...DEFAULT_CLEAN.rarities, ...(o.rarities ?? {}) },
  };
}

/**
 * Clean up old items (docs/MOBILE.md 3.8): salvage every unequipped item found more than n levels ago that is not a
 * favourite. What the list shows is what the button salvages (both come from `cleanSummary`); salvaging cannot be undone.
 */
export function CleanUp({ c, onClose }: { c: Controller; onClose: () => void }) {
  const run = c.run!;
  const [opts, setOpts] = useState<CleanOpts>(loadOpts);
  useEffect(() => savePref('inv.clean', opts), [opts]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const s = useMemo(
    () => cleanSummary(run, opts),
    [run.inventory, run.favourites, run.unseen, run.map, opts],
  );
  const set = (p: Partial<CleanOpts>) => setOpts({ ...opts, ...p });
  const setN = (n: number) => set({ olderThan: Math.max(1, Math.min(100, Math.round(n) || 1)) });
  const go = () => {
    if (!s.count) return;
    const rare = s.rows.filter(
      (r) => r.item.kind === 'item' && (r.item.rarity === 'rare' || r.item.rarity === 'unique'),
    ).length;
    const note = rare ? ` ${rare} of them are rare or unique.` : '';
    if (!confirm(`Salvage ${s.headline}?${note} This cannot be undone.`)) return;
    c.craft((r) => applyClean(r, opts));
    onClose();
  };
  const check = (label: string, on: boolean, change: (v: boolean) => void) => (
    <label class="clean-check">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => change((e.target as HTMLInputElement).checked)}
      />{' '}
      {label}
    </label>
  );
  return (
    <div class="modal" onClick={onClose}>
      <div
        class="modal-card clean"
        role="dialog"
        aria-label="Clean up old items"
        onClick={(e) => e.stopPropagation()}
      >
        <button class="sheet-x modal-x" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h3>Clean up old items</h3>
        <div class="clean-n">
          Found more than
          <button
            class="btn small"
            aria-label="Fewer levels"
            onClick={() => setN(opts.olderThan - 1)}
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={100}
            value={opts.olderThan}
            onInput={(e) => setN(Number((e.target as HTMLInputElement).value))}
          />
          <button
            class="btn small"
            aria-label="More levels"
            onClick={() => setN(opts.olderThan + 1)}
          >
            +
          </button>
          levels ago
        </div>
        <div class="clean-group">
          {check('Items', opts.items, (v) => set({ items: v }))}
          {check('Flasks', opts.flasks, (v) => set({ flasks: v }))}
          {check('Gems', opts.gems, (v) => set({ gems: v }))}
        </div>
        <div class="clean-group">
          {RARITIES.map(([r, label]) =>
            check(label, opts.rarities[r], (v) => set({ rarities: { ...opts.rarities, [r]: v } })),
          )}
        </div>
        {check("Include items I haven't looked at yet", opts.includeUnseen, (v) =>
          set({ includeUnseen: v }),
        )}
        <div class="clean-summary">
          <b>{s.headline}</b>
          {s.kept && <div class="muted">{s.kept}</div>}
          <div class="muted">Favourites, worn gear and socketed gems are never touched.</div>
        </div>
        <div class="clean-list">
          {s.rows.length === 0 && <div class="muted">Nothing to clean up.</div>}
          {s.rows.map((r) => (
            <div key={r.item.uid} class={`clean-row ${rarityClass(r.item)}`}>
              <span class="row-name">{itemTitle(r.item)}</span>
              <span class="muted">{r.age} levels ago</span>
            </div>
          ))}
        </div>
        <div class="item-actions">
          <button class="btn danger" disabled={!s.count} onClick={go}>
            Salvage {s.count} for {s.dust} Bone Dust
          </button>
          <button class="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
