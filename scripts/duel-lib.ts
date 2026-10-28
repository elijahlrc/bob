/**
 * Where the duel scripts get their builds (docs/DUEL.md 8.3): a bot run snapshotted at a map, an entry of the ladder probe's
 * `--save` file, or a saved run exported as JSON.
 */
import { readFileSync } from 'node:fs';
import { classDef } from '../src/data/classes';
import { gemDef } from '../src/data/gems';
import type { Build } from '../src/data/types';
import { snapshotBuild, type Snap } from '../src/run/duelBot';
import { buildSignature } from '../src/run/metrics';
import { loadRun, MemoryStore } from '../src/run/save';

// The bot builds are made in src/run/duelBot.ts (the Debug panel plays them too).
export { botSeed, LEGACY_PLAY, snapshotBuild, type Snap } from '../src/run/duelBot';

/** A build from a file: a save (the title screen's Copy button), a run's JSON, or a build's. */
export function buildFromFile(path: string): Build {
  const data = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  if (data.run && typeof data.version === 'number') {
    const store = new MemoryStore();
    store.setItem('k', JSON.stringify(data));
    const r = loadRun(store, 'k');
    if (r.status !== 'ok') throw new Error(`${path}: a save of another version of the game`);
    return r.run.build;
  }
  if (data.build) return data.build as Build;
  if (data.classId && data.equipment) return data as unknown as Build;
  throw new Error(`${path}: neither a save, a run nor a build`);
}

export type Fighter = { build: Build; label: string };

/** What a build is, in a line: class, level, main skill, keystones and uniques. */
export function describeBuild(build: Build): string {
  const sig = buildSignature(build).split(' | ');
  const main = sig[0] === 'default' ? 'default attack' : gemDef(sig[0]).name;
  return `${classDef(build.classId).name} L${build.level}  ${main}  [${sig[1]}]  [${sig[2]}]`;
}

/**
 * Resolve what `--a` or `--b` names: `class:seed:map` plays the bot to that map; a number picks an entry of the probe's snapshots
 * (`loaded`); anything else is a file.
 */
export function fighterFromSpec(spec: string, loaded: Snap[], legacy: boolean): Fighter {
  const m = /^([a-z]+):(\d+):(\d+)$/.exec(spec);
  if (m) {
    const snap = snapshotBuild(m[1], Number(m[2]), Number(m[3]), legacy);
    if (!snap) throw new Error(`${spec}: the bot died before it reached map ${m[3]}`);
    return { build: snap.build, label: `${spec} (L${snap.level})` };
  }
  if (/^\d+$/.test(spec)) {
    const snap = loaded[Number(spec)];
    if (!snap) throw new Error(`${spec}: the snapshot file has ${loaded.length} builds`);
    return { build: snap.build, label: `${snap.cls}:${snap.seed}:${snap.map} (L${snap.level})` };
  }
  return { build: buildFromFile(spec), label: spec };
}
