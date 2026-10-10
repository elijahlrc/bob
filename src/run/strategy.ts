import type { SkillTactic, Strategy } from '../data/strategy';
import type { RunState } from './run';

/**
 * Changes to the strategy (the Strategy tab). The build is replaced, never edited in place, like every other change to it. A
 * setting put back to its default is removed, so a strategy nobody has touched stays empty.
 */

function setStrategy(run: RunState, s: Strategy): void {
  const out: Strategy = { ...s };
  if (out.skills && Object.keys(out.skills).length === 0) delete out.skills;
  if (out.order && out.order.length === 0) delete out.order;
  for (const k of Object.keys(out) as (keyof Strategy)[]) if (out[k] === undefined) delete out[k];
  run.build = { ...run.build, strategy: Object.keys(out).length ? out : undefined };
  if (!run.build.strategy) delete run.build.strategy;
}

/** Set part of a skill's tactic; a field given as undefined goes back to its default. */
export function setTactic(run: RunState, gemUid: number, patch: SkillTactic): void {
  const s = run.build.strategy ?? {};
  const key = String(gemUid);
  const t: SkillTactic = { ...(s.skills?.[key] ?? {}), ...patch };
  for (const k of Object.keys(t) as (keyof SkillTactic)[]) if (t[k] === undefined) delete t[k];
  const skills = { ...(s.skills ?? {}) };
  if (Object.keys(t).length) skills[key] = t;
  else delete skills[key];
  setStrategy(run, { ...s, skills });
}

/**
 * Move a skill one place up (-1) or down (+1) in an ordered list of gem uids (the list the tab shows: the skills of one group,
 * in the order the character considers them). The whole list is written, so the order holds as gems come and go.
 */
export function moveSkill(run: RunState, list: number[], gemUid: number, dir: -1 | 1): void {
  const i = list.indexOf(gemUid);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const moved = [...list];
  [moved[i], moved[j]] = [moved[j], moved[i]];
  const s = run.build.strategy ?? {};
  // The other skills keep their places: the moved group replaces its own entries, wherever they stand.
  const rest = (s.order ?? []).filter((u) => !list.includes(u));
  setStrategy(run, { ...s, order: [...moved, ...rest] });
}

/** Set one of the global settings; undefined puts it back to its default. */
export function setStrategyOption(
  run: RunState,
  patch: Pick<Strategy, 'target' | 'spacing' | 'lifeFlask' | 'utilityFlask'>,
): void {
  setStrategy(run, { ...(run.build.strategy ?? {}), ...patch });
}

/** Back to the defaults: every skill its usual role, every setting its default. */
export function resetStrategy(run: RunState): void {
  setStrategy(run, {});
}
