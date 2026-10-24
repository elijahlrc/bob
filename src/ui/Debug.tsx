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
import { BIOMES, forceBiome, type BiomeId } from '../data/biomes';
import { CLASSES, classDef } from '../data/classes';
import { DENSITIES, forceDensity, type DensityId } from '../data/density';
import { REPRIEVES } from '../data/reprieves';
import type { Controller } from '../run/controller';
import { botBuild } from '../run/duelBot';
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

/** Forces the biome and the density style of every map from now on (docs/MAP-VARIETY.md); remembered between visits. */
function MapLooks() {
  const [biome, setBiome] = useState<string>(() => loadPref<string>('debugBiome', ''));
  const [density, setDensity] = useState<string>(() => loadPref<string>('debugDensity', ''));
  useEffect(() => {
    forceBiome((biome || null) as BiomeId | null);
    forceDensity((density || null) as DensityId | null);
  }, [biome, density]);
  return (
    <div class="debug-row">
      <span class="debug-label">Biome</span>
      <select
        value={biome}
        onChange={(e) => {
          const v = (e.target as HTMLSelectElement).value;
          setBiome(v);
          savePref('debugBiome', v);
        }}
      >
        <option value="">rolled</option>
        {BIOMES.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <span class="debug-label">Density</span>
      <select
        value={density}
        onChange={(e) => {
          const v = (e.target as HTMLSelectElement).value;
          setDensity(v);
          savePref('debugDensity', v);
        }}
      >
        <option value="">rolled</option>
        {DENSITIES.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * A duel from camp (docs/DUEL.md 5): the character against a copy of itself (Mirror), or against a bot build of a class that has
 * been played to a map on the legacy curve (Bot; the run takes seconds, and the button says so while it plays).
 */
function DuelRow({ c }: { c: Controller }) {
  const run = c.run;
  const [cls, setCls] = useState<string>(run?.classId ?? CLASSES[0].id);
  const [map, setMap] = useState<number>(run?.map ?? 10);
  const [seed, setSeed] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  if (!run) return null;
  const me = classDef(run.classId).name;
  const mirror = () => c.startDuel(run.build, run.build, seed, { names: [me, 'Mirror'] });
  const bot = () => {
    setBusy(true);
    // The bot's run is synchronous: wait a moment so that the label is on the screen before the page stops to play it.
    setTimeout(() => {
      const snap = botBuild(cls, seed, map, true);
      setBusy(false);
      c.startDuel(run.build, snap.build, seed, { names: [me, `${classDef(cls).name} bot`] });
    }, 30);
  };
  const num = (raw: string, lo: number, hi: number, set: (v: number) => void) => {
    const v = Math.round(Number(raw));
    if (Number.isFinite(v)) set(Math.max(lo, Math.min(hi, v)));
  };
  return (
    <div class="debug-row">
      <span class="debug-label">Duel</span>
      <select
        value={cls}
        disabled={busy}
        title="The class of the bot build"
        onChange={(e) => setCls((e.target as HTMLSelectElement).value)}
      >
        {CLASSES.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        max={100}
        value={map}
        disabled={busy}
        title="The map the bot is played to"
        onChange={(e) => num((e.target as HTMLInputElement).value, 1, 100, setMap)}
      />
      <input
        type="number"
        value={seed}
        disabled={busy}
        title="The seed of the fight"
        onChange={(e) => num((e.target as HTMLInputElement).value, 0, 0x7fffffff, setSeed)}
      />
      <button class="btn small" disabled={busy} onClick={mirror}>
        Mirror
      </button>
      <button class="btn small" disabled={busy} onClick={bot}>
        {busy ? `Playing the bot to map ${map}…` : 'Bot'}
      </button>
    </div>
  );
}

/** Put a reprieve in the pouch, to see it fire on the next map (docs/DUEL-BALANCE.md 3). */
function ReprieveRow({ c }: { c: Controller }) {
  const [full, setFull] = useState(false);
  return (
    <div class="debug-row">
      <span class="debug-label">Reprieve</span>
      {REPRIEVES.map((r) => (
        <button key={r.id} class="btn small" onClick={() => setFull(!c.debugGiveProvision(r.id))}>
          {r.name}
        </button>
      ))}
      {full && <span class="muted">Pouch full</span>}
    </div>
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
      data-paint="panel"
      data-thin
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary>Debug: difficulty and maps</summary>
      <MapLooks />
      {atCamp && <DuelRow c={c} />}
      {atCamp && <ReprieveRow c={c} />}
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
