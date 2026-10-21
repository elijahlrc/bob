/**
 * The join of one gem with its reference (docs/SPIRIT.md 4.1): the reference description, skill types, stat ids and level-1
 * and level-20 numbers from the reference data, then Bob's definition and the port note. This is where a milestone starts
 * work on a gem, and what a re-audit hands its reviewers.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALL_GEMS } from '../../src/data/gems';
import type { RefLevel, RefSkill } from '../coverage/ref-extract';
import { COVERAGE_DIR, key } from '../coverage/reference';

type MapEntry = { ref: string; status: string; note: string };

export function loadMapGems(): Record<string, MapEntry> {
  return (
    JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'map.json'), 'utf8')) as {
      gems: Record<string, MapEntry>;
    }
  ).gems;
}

let refByName: Map<string, RefSkill> | null = null;
function refSkills(): Map<string, RefSkill> {
  if (!refByName) {
    const skills = (
      JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'ref-skills.json'), 'utf8')) as {
        skills: RefSkill[];
      }
    ).skills;
    refByName = new Map();
    for (const s of skills) refByName.set(key(s.name), s);
  }
  return refByName;
}

/** The reference data's record of a reference gem, by name (a support is looked up with and without "Support"). */
export function refFor(ref: string): RefSkill | undefined {
  const m = refSkills();
  return (
    m.get(key(ref)) ??
    m.get(key(ref.replace(/ Support$/, ''))) ??
    m.get(key(ref.replace(/ Support$/, '') + 'Support'))
  );
}

const fmtLevel = (l: RefLevel | undefined): string =>
  l
    ? `mana ${l.manaCost ?? '-'} mult ${l.baseMultiplier ?? '-'} eff ${l.damageEffectiveness ?? '-'} cd ${l.cooldown ?? '-'} as ${l.attackSpeedMultiplier ?? '-'} vals ${JSON.stringify(l.values)}`
    : '';

/** The text block for one gem id. */
export function joinBlock(id: string): string {
  const g = ALL_GEMS.find((x) => x.id === id);
  const m = loadMapGems()[id];
  if (!g || !m) return `### ${id}: not a mapped gem`;
  const p = refFor(m.ref);
  const { description, ...rest } = g as typeof g & Record<string, unknown>;
  const lines = [`### ${g.id} (${g.name}) [${g.kind}]  <=  ${m.ref}`];
  lines.push(`Reference (${p ? 'data' : 'NO REFERENCE DATA'}): ${p?.description ?? ''}`);
  if (p) {
    lines.push(`  types: ${p.skillTypes.join(',')} ; tags: ${p.gem?.tags.join(',') ?? ''}`);
    lines.push(`  stats: ${p.stats.join(', ')}`);
    if (p.constantStats.length) lines.push(`  constants: ${JSON.stringify(p.constantStats)}`);
    lines.push(`  L1: ${fmtLevel(p.levels.first)}`, `  L20: ${fmtLevel(p.levels.l20)}`);
  }
  lines.push(`Bob def: ${JSON.stringify(rest)}`, `Bob desc: ${description}`);
  lines.push(`Port note (status ${m.status}): ${m.note}`);
  return lines.join('\n') + '\n';
}

/** The ids of every mapped gem that has a reference (the gems the ledger covers). */
export function mappedGemIds(): string[] {
  const map = loadMapGems();
  return ALL_GEMS.filter((g) => map[g.id]?.ref).map((g) => g.id);
}
