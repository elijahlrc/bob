/**
 * Writes src/data/baseTables.ts: one Bob base for every droppable reference base (the item base audit, reference/docs/, local), with its level,
 * requirements, defences or weapon numbers and implicit as the reference tables have them, under the name
 * reference/coverage/base-names.json gives it. The names file is the join: it is also how a reference unique finds its base
 * (bobBase.ts). The implicit lines go through the unique translator (modDict.ts); a rolled range is taken at its middle.
 *
 *   npm run coverage:emit-bases
 *
 * Nothing from the reference reaches src/: the generated file carries our names, ids and numbers only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { COVERAGE_DIR, loadPhrases } from './reference';
import type { RefBase } from './ref-bases-extract';
import { ctxFor, translateLine, type ModT } from './translate';

export const NAMES_FILE = resolve(COVERAGE_DIR, 'base-names.json');
export const OUT = resolve(COVERAGE_DIR, '../../src/data/baseTables.ts');

/**
 * Reference bases the game does not take on (reference/docs/AUDIT-ITEM-BASES.md section 9): quest, league and other
 * special bases (named in the local reference data).
 */
export const SKIPPED = new Set(loadPhrases().skippedBases);

/** The rune daggers and warstaves of an earlier class split: the files carry them as daggers and staves. */
export const RUNE_DAGGERS = new Set(loadPhrases().runeDaggers);
export const WARSTAVES = new Set(loadPhrases().warstaves);

const WEAPON_FAMILY: Record<string, string> = {
  'One Handed Sword': 'sword',
  'Thrusting One Handed Sword': 'thrust',
  'Two Handed Sword': 'sword2',
  'One Handed Axe': 'axe',
  'Two Handed Axe': 'axe2',
  'One Handed Mace': 'mace',
  'Two Handed Mace': 'mace2',
  Sceptre: 'sceptre',
  Dagger: 'dagger',
  Claw: 'claw',
  Wand: 'wand',
  Staff: 'staff',
  Bow: 'bow',
};
const SLOT: Record<string, string> = {
  'Body Armour': 'body',
  Helmet: 'helmet',
  Gloves: 'gloves',
  Boots: 'boots',
  Shield: 'shield',
};
const DEF_TYPE: Record<string, string> = {
  Armour: 'ar',
  Evasion: 'ev',
  'Energy Shield': 'es',
  'Armour/Evasion': 'arev',
  'Armour/Energy Shield': 'ares',
  'Evasion/Energy Shield': 'eves',
};
/** The ids the jewellery bases already had (saves and uniques name them), and the five new kinds. */
const JEWELLERY_IDS: Record<string, string> = {
  'Glass Ring': 'ring_mana',
  'Heartwood Ring': 'ring_life',
  'Spiked Ring': 'ring_phys',
  'Bulwark Ring': 'ring_defences',
  'Hollow Ring': 'ring_socket',
  'Cinder Ring': 'ring_fire',
  'Rime Ring': 'ring_cold',
  'Spark Ring': 'ring_light',
  'Triple Band': 'ring_attrs',
  'Gilt Ring': 'ring_rarity',
  'Veil Ring': 'ring_es',
  'Keen Ring': 'ring_crit',
  'Ember-Rime Ring': 'ring_fire_cold',
  'Ember-Spark Ring': 'ring_fire_light',
  'Rime-Spark Ring': 'ring_cold_light',
  'Mire Ring': 'ring_chaos',
  'Triad Ring': 'ring_all',
  'Steelbound Ring': 'ring_heavy',
  'Shard Ring': 'ring_ele',
  'Crimson Signet': 'ring_lifepct',
  'Azure Signet': 'ring_manapct',
  'Knucklebone Charm': 'amulet_str',
  'Feather Charm': 'amulet_dex',
  'Inkstone Charm': 'amulet_int',
  'Wellspring Charm': 'amulet_manaregen',
  'Mending Charm': 'amulet_liferegen',
  'Ember Charm': 'amulet_fire',
  'Coin Charm': 'amulet_rarity',
  'Spectrum Charm': 'amulet_ele',
  'Stag Charm': 'amulet_str_dex',
  'Heron Charm': 'amulet_str_int',
  'Magpie Charm': 'amulet_dex_int',
  'Prism Charm': 'amulet_all',
  'Verdant Charm': 'amulet_liferegen_pct',
  'Tidal Charm': 'amulet_manaregen_high',
  "Brawler's Sash": 'belt_phys',
  'Rope Sash': 'belt_life',
  'Gilt Sash': 'belt_rarity',
  'Ironbound Belt': 'belt_str',
  'Sturdy Wrap': 'belt_stun',
  'Hammerhand Belt': 'belt_stunner',
  'Silk Cord': 'belt_es',
  'Fencer Girdle': 'belt_duelist',
  'Prism Cord': 'belt_es2',
  'Cinder Quiver': 'quiver_fire',
  'Frostbite Quiver': 'quiver_cold',
  'Storm Quiver': 'quiver_light',
  'Hawk Quiver': 'quiver_accpct',
  'Thorned Quiver': 'quiver_attack',
  "Stalker's Quiver": 'quiver_hit',
  'Falconer Quiver': 'quiver_dex',
  'Blunted Quiver': 'quiver_stun',
  'Barbed Quiver': 'quiver_phys',
  'Pyre Quiver': 'quiver_fire_bow',
  'Sundering Quiver': 'quiver_phys_bow',
  'Skewering Quiver': 'quiver_pierce',
  'Stormwatch Quiver': 'quiver_crit',
  'Gemmed Quiver': 'quiver_socket',
};
/** The ids the utility flasks already had, and the nine new kinds (their effects are authored in flasks.ts). */
const UTILITY_IDS: Record<string, string> = {
  'Haste Draught': 'flask_haste',
  'Prism Draught': 'flask_prism',
  'Smokeveil Draught': 'flask_smokeveil',
  'Ember Draught': 'flask_ember',
  'Frost Draught': 'flask_frost',
  'Storm Draught': 'flask_storm',
  'Mire Draught': 'flask_mire',
  'Onrush Draught': 'flask_onrush',
  'Keen Draught': 'flask_keen',
  'Bulwark Draught': 'flask_bulwark',
  'Ghoststep Draught': 'flask_ghoststep',
  'Mist Draught': 'flask_mist',
  'Chillwake Draught': 'flask_chillwake',
  'Sanctum Draught': 'flask_sanctum',
  'Stonehide Draught': 'flask_stonehide',
};

export type Row = {
  id: string;
  name: string;
  level: number;
  req: [number, number, number];
  def?: [number, number, number, number];
  weapon?: [number, number, number, number, number];
  implicits: string[];
  sockets?: number;
  minion?: boolean;
  flask?: [number, number, number, number, number];
};

const lit = (v: unknown): string => JSON.stringify(v);

/** A rolled range at its middle, at the precision the line is written in. */
function mid(m: ModT): number {
  const v = (m.min + m.max) / 2;
  const dec = Number.isInteger(m.min) && Number.isInteger(m.max) ? 0 : 1;
  return dec === 0 ? Math.round(v) : Math.round(v * 10) / 10;
}

function modSource(m: ModT): string {
  const extra: string[] = [];
  if (m.damageTypes) extra.push(`damageTypes: ${lit(m.damageTypes)}`);
  if (m.tags) extra.push(`tags: ${lit(m.tags)}`);
  if (m.local) extra.push('local: true');
  if (m.condition) extra.push(`condition: ${lit(m.condition)}`);
  const head = `mod('${m.stat}', '${m.kind}', ${mid(m)}`;
  return extra.length ? `${head}, { ${extra.join(', ')} })` : `${head})`;
}

/** The implicit lines of a base as mod sources; a line the translator cannot map stops the emit. */
function implicitsOf(b: RefBase, slot: string): string[] {
  const out: string[] = [];
  for (const line of b.implicit.split('\\n').filter(Boolean)) {
    const r = translateLine(line, ctxFor(b.name, slot));
    if (r.kind === 'mods') out.push(...r.mods.map(modSource));
    else if (r.kind === 'unmapped')
      throw new Error(`base "${b.name}": implicit not mapped: ${line}`);
  }
  return out;
}

export function loadNames(): Record<string, string> {
  return JSON.parse(readFileSync(NAMES_FILE, 'utf8')) as Record<string, string>;
}

/** The family key of a reference base, or null when the game does not take it on. */
export function familyOf(b: RefBase): string | null {
  if (SKIPPED.has(b.name) || b.type === 'Jewel' || b.subType === 'Talisman') return null;
  const w = WEAPON_FAMILY[b.type];
  if (w) {
    if (w === 'dagger' && RUNE_DAGGERS.has(b.name)) return 'runedagger';
    if (w === 'staff' && WARSTAVES.has(b.name)) return 'warstaff';
    return w;
  }
  const slot = SLOT[b.type];
  if (slot) {
    const t = DEF_TYPE[b.subType];
    return t ? `${slot}_${t}` : null;
  }
  if (b.type === 'Ring' || b.type === 'Amulet' || b.type === 'Belt' || b.type === 'Quiver')
    return b.type.toLowerCase();
  if (b.type === 'Flask') return `flask_${b.subType.toLowerCase()}`;
  return null;
}

export function buildRows(bases: RefBase[], names: Record<string, string>): Record<string, Row[]> {
  const fams: Record<string, Row[]> = {};
  const seenName = new Set<string>();
  for (const b of bases) {
    const fam = familyOf(b);
    if (!fam) continue;
    // The unlabelled two-stone rings and the second Diamond Flask repeat other rows.
    if (b.name === 'Two-Stone Ring' || seenName.has(b.name)) continue;
    seenName.add(b.name);
    const name = names[b.name];
    if (!name) throw new Error(`no Bob name for "${b.name}"`);
    const slot = b.type;
    const row: Row = {
      id: '',
      name,
      level: Math.max(1, b.level),
      req: [b.req.str, b.req.dex, b.req.int],
      implicits: implicitsOf(b, slot),
    };
    if (b.weapon)
      row.weapon = [b.weapon.min, b.weapon.max, b.weapon.crit, b.weapon.aps, b.weapon.range];
    else if (SLOT[b.type]) row.def = [b.armour, b.evasion, b.energyShield, b.block];
    if (b.flask)
      row.flask = [b.flask.life, b.flask.mana, b.flask.duration, b.flask.charges, b.flask.uses];
    if (/^Has 1 Socket$/m.test(b.implicit)) row.sockets = 1;
    if (/Can roll Minion Modifiers/.test(b.implicit)) row.minion = true;
    (fams[fam] ??= []).push(row);
  }
  for (const [fam, rows] of Object.entries(fams)) {
    rows.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    const used = new Set<string>();
    for (const r of rows) {
      const fixed = JEWELLERY_IDS[r.name] ?? UTILITY_IDS[r.name];
      if (fixed) r.id = fixed;
      else {
        // Level-keyed ids; a second base at the same level of a family takes a letter.
        let id = `${fam}_l${r.level}`;
        for (let k = 0; used.has(id); k++) id = `${fam}_l${r.level}${'bcdefg'[k]}`;
        r.id = id;
      }
      if (used.has(r.id)) throw new Error(`repeated id ${r.id}`);
      used.add(r.id);
    }
  }
  return fams;
}

function rowSource(r: Row): string {
  const parts = [
    `id: '${r.id}'`,
    `name: ${lit(r.name)}`,
    `level: ${r.level}`,
    `req: ${lit(r.req)}`,
  ];
  if (r.def) parts.push(`def: ${lit(r.def)}`);
  if (r.weapon) parts.push(`weapon: ${lit(r.weapon)}`);
  if (r.flask) parts.push(`flask: ${lit(r.flask)}`);
  if (r.implicits.length) parts.push(`implicits: [${r.implicits.join(', ')}]`);
  if (r.sockets) parts.push(`sockets: ${r.sockets}`);
  if (r.minion) parts.push('minion: true');
  return `{ ${parts.join(', ')} }`;
}

export async function emitBases(): Promise<string> {
  const bases = (
    JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'ref-bases.json'), 'utf8')) as {
      bases: RefBase[];
    }
  ).bases;
  const fams = buildRows(bases, loadNames());
  const order = Object.keys(fams).sort();
  const src = [
    '// GENERATED by `npm run coverage:emit-bases` (scripts/coverage/emit-bases.ts) from the reference base tables and',
    '// reference/coverage/base-names.json: every droppable base, its level, requirements, numbers and implicit, under our',
    '// own name. Do not edit by hand: change the names file or the emitter and run it again.',
    "import { mod, type Mod } from '../mods/types';",
    '',
    'export type BaseRow = {',
    '  id: string;',
    '  name: string;',
    '  level: number;',
    '  /** Strength, dexterity, intelligence. */',
    '  req: [number, number, number];',
    '  /** Armour, evasion, energy shield, block. */',
    '  def?: [number, number, number, number];',
    '  /** Minimum and maximum physical damage, critical strike chance, attacks per second, range (reference units). */',
    '  weapon?: [number, number, number, number, number];',
    '  /** Life, mana, seconds, charges, charges per use. */',
    '  flask?: [number, number, number, number, number];',
    '  implicits?: Mod[];',
    '  /** A jewellery base with a socket. */',
    '  sockets?: number;',
    '  /** A weapon that rolls the minion affixes. */',
    '  minion?: boolean;',
    '};',
    '',
    '/** Rows by family: a slot and defence type (`body_ar`), a weapon kind (`sword`, `runedagger`), a jewellery class or a flask kind. */',
    'export const BASE_ROWS: Record<string, BaseRow[]> = {',
    ...order.map(
      (fam) => `  ${fam}: [\n${fams[fam].map((r) => `    ${rowSource(r)},`).join('\n')}\n  ],`,
    ),
    '};',
    '',
  ].join('\n');
  const cfg = (await resolveConfig(OUT)) ?? {};
  return format(src, { ...cfg, filepath: OUT });
}

async function main(): Promise<void> {
  const text = await emitBases();
  writeFileSync(OUT, text);
  const n = (text.match(/\{ id: /g) ?? []).length;
  console.log(`wrote ${OUT}: ${n} bases`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
