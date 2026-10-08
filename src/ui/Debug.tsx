import { useEffect, useState } from 'preact/hooks';
import { referenceMonster } from '../calc/monster';
import { monsterHit, monsterLife } from '../calc/formulas';
import {
  BASE_RANGE,
  DEFAULT,
  LEGACY,
  SCALING_RANGE,
  VARIANCE_RANGE,
  difficultyText,
  relativeHardness,
  sameDifficulty,
  statLevel,
  type Difficulty,
} from '../data/difficulty';
import type { Controller } from '../run/controller';
import { debugEnabled } from './debugFlag';
import { loadPref, savePref } from './prefs';

const f0 = (v: number) => Math.round(v).toLocaleString();

/** One slider with a number box beside it. */
function Setting(props: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  const { label, hint, value, min, max, step, disabled, onChange } = props;
  const set = (raw: string) => {
    const v = Number(raw);
    if (Number.isFinite(v)) onChange(v);
  };
  return (
    <label class="debug-row" title={hint}>
      <span class="debug-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onInput={(e) => set((e.target as HTMLInputElement).value)}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => set((e.target as HTMLInputElement).value)}
      />
    </label>
  );
}

/**
 * The difficulty controls (docs/ENEMIES.md 8.3): scaling, base difficulty and variance. At camp they edit the run in
 * progress (from the next map on); on the title screen they set the next new run. Hidden unless `debugEnabled()`.
 */
export function DebugPanel({ c }: { c: Controller }) {
  const run = c.run;
  const atCamp = !!run && c.screen === 'camp';
  const d: Difficulty = atCamp ? run.difficulty : c.startDifficulty;
  // The title screen keeps its setting between visits.
  useEffect(() => {
    if (atCamp) return;
    const saved = loadPref<Partial<Difficulty> | null>('difficulty', null);
    if (saved) c.setStartDifficulty(saved);
  }, []);
  const [open, setOpen] = useState(false);
  if (!debugEnabled()) return null;
  const apply = (next: Partial<Difficulty>) => {
    if (atCamp) c.setDifficulty(next);
    else {
      c.setStartDifficulty(next);
      savePref('difficulty', c.startDifficulty);
    }
  };
  const map = atCamp ? run.map : 25;
  const sample = referenceMonster(map, d);
  const dmg = sample.profile(0).hands[0].chunks.reduce((n, k) => n + (k.min + k.max) / 2, 0);
  const sampleLegacy = referenceMonster(map, LEGACY);
  const dmgLegacy = sampleLegacy
    .profile(0)
    .hands[0].chunks.reduce((n, k) => n + (k.min + k.max) / 2, 0);
  return (
    <details
      class="debug-panel"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary>Debug: difficulty</summary>
      <div class="muted">
        {atCamp
          ? 'Changes apply from the next map you start.'
          : 'Sets the difficulty of the next new run.'}
      </div>
      <Setting
        label="Scaling"
        hint="How fast monsters grow stronger with the level. 1 is the old curve; higher is steeper."
        value={d.scaling}
        {...SCALING_RANGE}
        disabled={false}
        onChange={(v) => apply({ scaling: v })}
      />
      <Setting
        label="Base"
        hint="A flat multiplier on how hard every monster is, at every level. 1 is the old curve."
        value={d.base}
        {...BASE_RANGE}
        disabled={false}
        onChange={(v) => apply({ base: v })}
      />
      <Setting
        label="Variance"
        hint="How much harder or easier some maps and packs are than the average (seeded: a map is the same on a reload)."
        value={d.variance}
        {...VARIANCE_RANGE}
        disabled={false}
        onChange={(v) => apply({ variance: v })}
      />
      <div class="debug-buttons">
        <button class="btn small" onClick={() => apply({ ...DEFAULT })}>
          Reset to default
        </button>
        <button class="btn small" onClick={() => apply({ ...LEGACY })}>
          Legacy curve
        </button>
        {sameDifficulty(d, DEFAULT) && <span class="muted">default</span>}
      </div>
      <table class="debug-table">
        <thead>
          <tr>
            <th>Map</th>
            <th>10</th>
            <th>25</th>
            <th>50</th>
            <th>100</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Stat level</td>
            {[10, 25, 50, 100].map((m) => (
              <td key={m}>{statLevel(m, d).toFixed(0)}</td>
            ))}
          </tr>
          <tr>
            <td>Harder than the old curve</td>
            {[10, 25, 50, 100].map((m) => (
              <td key={m}>×{relativeHardness(m, d, monsterLife, monsterHit).toFixed(2)}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <div class="muted">
        A normal Skeleton Warrior at map {map}: {f0(sample.defence.maxLife)} life (was{' '}
        {f0(sampleLegacy.defence.maxLife)}), hits for {f0(dmg)} (was {f0(dmgLegacy)}).
      </div>
      <div class="muted">Now: {difficultyText(d)}</div>
    </details>
  );
}
