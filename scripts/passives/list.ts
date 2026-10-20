/**
 * A markdown listing of the hand-written tree for a reviewer (docs/tree/design/D-method.md): each area, its reason, its
 * clusters, every node's text and strength in units, every link's reason.
 *
 *   npx tsx scripts/passives/list.ts [region] [out.md]
 */
import { writeFileSync } from 'node:fs';
import { modsText } from '../../src/mods/text';
import { AREAS, buildAll } from '../../src/data/passives';
import { KEYSTONES } from '../../src/data/tree/keystones';
import type { AreaSpec, NodeSpec } from '../../src/data/passives/types';

const argv = process.argv.slice(2);
const region = argv.find((a) => !a.endsWith('.md'));
const out = argv.find((a) => a.endsWith('.md'));

const built = buildAll({ allowNew: true });
const lines: string[] = [];
const units = (n: NodeSpec) => n.lines.reduce((s, l) => s + l.units, 0);
const text = (n: NodeSpec) =>
  n.kind === 'keystone'
    ? (KEYSTONES.find((k) => k.name === n.name)?.description ?? '(no keystone of that name)')
    : modsText(n.lines.flatMap((l) => l.mods)).join('; ');

const areas: AreaSpec[] = AREAS.filter(
  (a) => !region || a.region === region || a.id.startsWith(region + '.'),
);
for (const area of areas) {
  lines.push(`## ${area.name} (${area.id})`, '', area.why, '');
  for (const c of area.clusters) {
    lines.push(`### ${c.name} (${c.id})`, '', c.why, '');
    for (const n of c.nodes) {
      const u = n.kind === 'keystone' ? '' : ` (${units(n).toFixed(1)} units)`;
      const tag = n.kind === 'small' ? '' : `**${n.kind}${n.name ? ' ' + n.name : ''}** `;
      lines.push(`- \`${n.id}\` ${tag}${text(n)}${u}${n.why ? ' — ' + n.why : ''}`);
    }
    lines.push('');
  }
  if (area.links.length) {
    lines.push('Links:', '');
    for (const l of area.links) lines.push(`- ${l.from} ↔ ${l.to}: ${l.why}`);
    lines.push('');
  }
}
if (built.problems.length)
  lines.push('## Problems', '', ...built.problems.map((p) => `- ${p}`), '');
const md = lines.join('\n');
if (out) {
  writeFileSync(out, md);
  console.log(`${out}: ${areas.length} areas, ${md.length} chars`);
} else console.log(md);
