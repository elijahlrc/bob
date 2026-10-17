/**
 * Where the duel scripts get their builds (docs/DUEL.md 8.3): a bot run snapshotted at a map, an entry of the ladder probe's
 * `--save` file, or a saved run exported as JSON.
 */
import { readFileSync } from 'node:fs';
import { classDef } from '../src/data/classes';
import { gemDef } from '../src/data/gems';
import type { Build } from '../src/data/types';
import { botRun } from '../src/run/bot';
import { buildSignature } from '../src/run/metrics';
import { loadRun, MemoryStore } from '../src/run/save';

/** A character taken from a bot run: the class and seed it was played from, the map it was taken at and its level there. */
export type Snap = { cls: string; seed: number; map: number; level: number; build: Build };

/** The seed the bot is played with for a run that is named by `seed` (as `scripts/ladder-probe.ts` has always made it). */
export const botSeed = (seed: number): number => seed * 1000 + 7;

/** The difficulty the probe's `--legacy` plays (the default one kills the bot on maps 10 to 20). */
export const LEGACY_PLAY = { scaling: 1, base: 1, variance: 0 };

/**
 * Play the bot from `cls` and `seed` until it starts map `map`, and take the character as it stands there. The run goes on to the
 * end of that map. Null when the bot died on an earlier map.
 */
export function snapshotBuild(cls: string, seed: number, map: number, legacy = false): Snap | null {
  let snap: Snap | null = null;
  botRun(cls, botSeed(seed), map, {
    ...(legacy ? { difficulty: LEGACY_PLAY } : {}),
    onTick: (_w, run) => {
      if (!snap && run.map >= map)
        snap = {
          cls,
          seed,
          map: run.map,
          level: run.build.level,
          build: structuredClone(run.build),
        };
    },
  });
  return snap;
}

/** A build from a file: a save (`localStorage['bob.save.<id>']`), a run's JSON, or a build's. */
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
