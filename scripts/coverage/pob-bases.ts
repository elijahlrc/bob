/**
 * Extracts base item data (class, defence type, level, weapon numbers) from the 3.9-era Path of Building data, for the
 * unique drafts: a draft picks the Bob base nearest the reference base. Same source and rules as pob-extract.ts.
 *
 *   npm run coverage:bases -- <path to the unzipped PathOfBuilding-1.4.155/Data folder>
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { POB_SOURCE } from './pob-extract';
import { COVERAGE_DIR } from './reference';

export type PobBase = {
  name: string;
  /** "Body Armour", "One Handed Sword", "Ring", "Utility Flask", ... */
  type: string;
  subType: string;
  level: number;
  req: { str: number; dex: number; int: number };
  armour: number;
  evasion: number;
  energyShield: number;
  block: number;
  weapon?: { min: number; max: number; crit: number; aps: number; range: number };
  implicit: string;
  flask?: { life: number; mana: number; duration: number; charges: number; uses: number };
};

const num = (block: string, re: RegExp): number => Number(block.match(re)?.[1] ?? 0);

export function parseBases(lua: string): PobBase[] {
  const out: PobBase[] = [];
  for (const part of lua.split(/\nitemBases\["/).slice(1)) {
    const name = part.slice(0, part.indexOf('"'));
    const base: PobBase = {
      name,
      type: part.match(/type = "([^"]*)"/)?.[1] ?? '',
      subType: part.match(/subType = "([^"]*)"/)?.[1] ?? '',
      level: num(part, /req = \{[^}]*level = (\d+)/),
      req: {
        str: num(part, /req = \{[^}]*str = (\d+)/),
        dex: num(part, /req = \{[^}]*dex = (\d+)/),
        int: num(part, /req = \{[^}]*int = (\d+)/),
      },
      armour: num(part, /ArmourBase = (\d+)/),
      evasion: num(part, /EvasionBase = (\d+)/),
      energyShield: num(part, /EnergyShieldBase = (\d+)/),
      block: num(part, /BlockChance = (\d+)/),
      implicit: part.match(/implicit = "([^"]*)"/)?.[1] ?? '',
    };
    if (/weapon = \{/.test(part))
      base.weapon = {
        min: num(part, /PhysicalMin = (\d+)/),
        max: num(part, /PhysicalMax = (\d+)/),
        crit: num(part, /CritChanceBase = ([\d.]+)/),
        aps: num(part, /AttackRateBase = ([\d.]+)/),
        range: num(part, /Range = (\d+)/),
      };
    if (/flask = \{/.test(part))
      base.flask = {
        life: num(part, /life = (\d+)/),
        mana: num(part, /mana = (\d+)/),
        duration: num(part, /duration = ([\d.]+)/),
        charges: num(part, /chargesMax = (\d+)/),
        uses: num(part, /chargesUsed = (\d+)/),
      };
    out.push(base);
  }
  return out;
}

function main(): void {
  const dir = process.argv[2];
  if (!dir) throw new Error('usage: coverage:bases -- <path to PathOfBuilding-1.4.155/Data>');
  const root = resolve(dir, '3_0/Bases');
  const bases: PobBase[] = [];
  for (const f of readdirSync(root).filter((x) => x.endsWith('.lua')))
    bases.push(...parseBases(readFileSync(join(root, f), 'utf8')));
  writeFileSync(
    join(COVERAGE_DIR, 'pob-bases.json'),
    JSON.stringify({ source: POB_SOURCE, bases }) + '\n',
  );
  console.log(`bases: ${bases.length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
