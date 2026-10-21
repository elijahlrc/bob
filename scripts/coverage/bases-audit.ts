/**
 * Compares every Bob item and flask base with the 3.9 base it stands for (reference/coverage/base-names.json against
 * reference/coverage/ref-bases.json): level, requirements, defences, block, weapon numbers, flask amounts and charges, and the
 * implicit lines. Prints what differs, and the reference bases the game has no base for. The check behind
 * docs/AUDIT-ITEM-BASES.md: at parity it prints nothing but the counts.
 *
 *   npm run coverage:bases-audit
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ITEM_BASES, REQUIREMENT_SCALE, WEAPON_DAMAGE_SCALE } from '../../src/data/bases';
import { FLASK_BASES } from '../../src/data/flasks';
import { modsText } from '../../src/mods/text';
import { COVERAGE_DIR } from './reference';
import type { PobBase } from './pob-bases';
import { familyOf, loadNames } from './emit-bases';

type Diff = { base: string; what: string; ours: string; theirs: string };

export function auditBases(): { diffs: Diff[]; unmatched: string[]; compared: number } {
  const bases = (
    JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'ref-bases.json'), 'utf8')) as {
      bases: PobBase[];
    }
  ).bases;
  const names = loadNames();
  const byName = new Map(ITEM_BASES.map((b) => [b.name, b]));
  const flaskByName = new Map(FLASK_BASES.map((f) => [f.name, f]));
  const diffs: Diff[] = [];
  const unmatched: string[] = [];
  let compared = 0;
  const seen = new Set<string>();
  const note = (base: string, what: string, ours: unknown, theirs: unknown) => {
    if (String(ours) !== String(theirs))
      diffs.push({ base, what, ours: String(ours), theirs: String(theirs) });
  };
  for (const r of bases) {
    if (!familyOf(r) || r.name === 'Two-Stone Ring' || seen.has(r.name)) continue;
    seen.add(r.name);
    const own = names[r.name];
    const level = Math.max(1, r.level);
    if (r.flask) {
      const f = own ? flaskByName.get(own) : undefined;
      if (!f) {
        unmatched.push(r.name);
        continue;
      }
      compared++;
      note(f.name, 'level', f.level, level);
      note(f.name, 'life', f.life, r.flask.life);
      note(f.name, 'mana', f.mana, r.flask.mana);
      note(f.name, 'seconds', f.duration, r.flask.duration);
      note(f.name, 'charges', `${f.maxCharges}/${f.perUse}`, `${r.flask.charges}/${r.flask.uses}`);
      continue;
    }
    const b = own ? byName.get(own) : undefined;
    if (!b) {
      unmatched.push(r.name);
      continue;
    }
    compared++;
    note(b.name, 'level', b.level, level);
    note(
      b.name,
      'requirements',
      `${b.req.str}/${b.req.dex}/${b.req.int}`,
      [r.req.str, r.req.dex, r.req.int].map((x) => Math.round(x * REQUIREMENT_SCALE)).join('/'),
    );
    if (b.defence) {
      note(b.name, 'armour', b.defence.armour ?? 0, r.armour);
      note(b.name, 'evasion', b.defence.evasion ?? 0, r.evasion);
      note(b.name, 'energy shield', b.defence.es ?? 0, r.energyShield);
      note(b.name, 'block', b.defence.block ?? 0, r.block);
    }
    if (b.weapon && r.weapon) {
      note(
        b.name,
        'damage',
        `${b.weapon.min}-${b.weapon.max}`,
        `${Math.round(r.weapon.min * WEAPON_DAMAGE_SCALE)}-${Math.round(r.weapon.max * WEAPON_DAMAGE_SCALE)}`,
      );
      note(b.name, 'attacks per second', b.weapon.aps, r.weapon.aps);
      note(b.name, 'critical strike chance', b.weapon.crit, r.weapon.crit);
    }
    const lines = r.implicit.split('\\n').filter(Boolean).length;
    const ours = modsText(b.implicits).length;
    // A socket, the minion wand's note and a flask's ground are fields of the base, not lines.
    const fields = /Has 1 Socket|Can roll Minion/.test(r.implicit) ? 1 : 0;
    if (ours === 0 && lines - fields > 0) note(b.name, 'implicit', '(none)', r.implicit);
  }
  return { diffs, unmatched, compared };
}

function main(): void {
  const { diffs, unmatched, compared } = auditBases();
  for (const d of diffs) console.log(`${d.base}: ${d.what} ${d.ours} (reference ${d.theirs})`);
  console.log(
    `${compared} bases compared, ${diffs.length} differences; reference bases without a base of ours: ${unmatched.join(', ') || 'none'}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
