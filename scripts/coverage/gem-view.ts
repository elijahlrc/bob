/**
 * Shows the next undecided gems with their 3.9-era numbers, a few lines each, for a human to turn into decisions
 * (docs/coverage/gems/*.json). The bucket of each gem is the one coverage.ts uses.
 *
 *   npm run coverage:gems -- --next 20 [active|support] [bucket,bucket]
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gemBucket, loadOverrides, type Bucket } from './buckets';
import type { PobSkill } from './pob-extract';
import { COVERAGE_DIR, key, loadReference } from './reference';

const round = (n: number | undefined) => (n === undefined ? '' : String(Math.round(n * 100) / 100));
const range = (a: number | undefined, b: number | undefined) =>
  a === undefined ? '' : a === b ? round(a) : `${round(a)}→${round(b)}`;

function decidedRefs(): Set<string> {
  const out = new Set<string>();
  const dir = resolve(COVERAGE_DIR, 'gems');
  try {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')))
      for (const d of JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as { ref: string }[])
        out.add(key(d.ref));
  } catch {
    /* none yet */
  }
  const map = JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'map.json'), 'utf8')) as {
    gems: Record<string, { ref: string; status: string }>;
  };
  for (const e of Object.values(map.gems))
    if (e.ref && e.status !== 'excluded') out.add(key(e.ref));
  return out;
}

export function describeGem(
  g: ReturnType<typeof loadReference>['gems'][number],
  s: PobSkill | undefined,
): string {
  const head = `## ${g.name} [${g.kind}] ${gemBucket(g)} | attr ${g.attr} | wiki tags ${g.tags.join(' ')} | released ${g.release || 'launch'}`;
  if (!s) return `${head}\n   (no 3.9-era data found: draft from the wiki)`;
  const f = s.levels.first;
  const l = s.levels.l20;
  const lines = [head];
  const types = s.skillTypes.length ? s.skillTypes.join(' ') : '';
  if (s.support)
    lines.push(
      `   requires: ${s.requireSkillTypes.join(' ') || 'any'} | excludes: ${s.excludeSkillTypes.join(' ') || '-'} | adds: ${s.addSkillTypes.join(' ') || '-'} | mana x${range(f.manaMultiplier, l.manaMultiplier)}%`,
    );
  else
    lines.push(
      `   types: ${types} | cast ${round(s.castTime)} | cost ${range(f.manaCost ?? f.cost?.Mana, l.manaCost ?? l.cost?.Mana)} | eff ${range(f.damageEffectiveness && f.damageEffectiveness * 100, l.damageEffectiveness && l.damageEffectiveness * 100)} | base ${range(f.baseMultiplier && f.baseMultiplier * 100, l.baseMultiplier && l.baseMultiplier * 100)} | crit ${round(l.critChance)} | cd ${round(l.cooldown)}`,
    );
  const stats = s.stats
    .map((st, i) => (f.values[i] === undefined ? st : `${st} ${range(f.values[i], l.values[i])}`))
    .join('; ');
  lines.push(`   stats: ${stats}`);
  if (s.constantStats.length)
    lines.push(`   constant: ${s.constantStats.map(([k, v]) => `${k} ${v}`).join('; ')}`);
  if (s.qualityStats.length)
    lines.push(`   quality: ${s.qualityStats.map(([k, v]) => `${k} ${v}`).join('; ')}`);
  if (s.description) lines.push(`   desc: ${s.description.slice(0, 160)}`);
  return lines.join('\n');
}

function main(): void {
  const args = process.argv.slice(2);
  const n = Number(args[1] ?? 20);
  const kind = args[2] === 'active' || args[2] === 'support' ? args[2] : undefined;
  const buckets = (args[3] ?? 'plain,dot,charges,triggers,channelling').split(',') as Bucket[];
  const ref = loadReference();
  const pob = (
    JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'pob-skills.json'), 'utf8')) as {
      skills: PobSkill[];
    }
  ).skills;
  const over = loadOverrides();
  const done = decidedRefs();
  const rows = ref.gems
    .filter((g) => !done.has(key(g.name)) && (!kind || g.kind === kind))
    .filter((g) => buckets.includes(over[key(g.name)] ?? gemBucket(g)))
    .slice(0, n);
  for (const g of rows) {
    const bare = g.name.replace(/ Support$/, '');
    const s =
      pob.find((x) => key(x.name) === key(g.name)) ?? pob.find((x) => key(x.name) === key(bare));
    console.log(describeGem(g, s));
  }
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').slice(-1)[0])
)
  main();
