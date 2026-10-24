/**
 * The network's supply (docs/tree/design/G-growth.md, G0 item 3): units of every stat family by region and area, every
 * specialization's notables with their partners and the steps between twins (CONSTRAINTS §5.1–2), and the empty space
 * the network could grow into without moving anything.
 *
 *   npx tsx scripts/passives/supply.ts [--md out.md] [--pic empty.png] [--cell 100] [--clear 170]
 *
 * A cell of the map is empty when no node is within `--clear` tree units of its centre; it belongs to the region of its
 * nearest node. Empty cells are counted inside the network's outline (the farthest node from the middle), so the rim
 * is not counted as room.
 */
import { writeFileSync } from 'node:fs';
import { AREAS, buildAll } from '../../src/data/passives';
import { makeLine } from '../../src/data/passives/vocab';
import { Canvas, hex } from '../tree/png';
import type { LineSpec } from '../../src/data/passives/types';

const argv = process.argv.slice(2);
const arg = (k: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : undefined;
};
const mdOut = arg('--md');
const picOut = arg('--pic');
const CELL = Number(arg('--cell') ?? 100);
const CLEAR = Number(arg('--clear') ?? 170);

const built = buildAll({ allowNew: true });
const { nodes } = built.tree;
const N = nodes.length;
const live = (i: number) => nodes[i].name !== '(retired)';
const REGIONS = ['strider', 'shade', 'mystic', 'zealot', 'vanguard', 'reaver', 'centre'];

/** The stat family a line key belongs to, for tables a person can read. */
export function familyOf(key: string): string {
  const [fn, a] = key.split(':');
  const W = ['sword', 'axe', 'mace', 'sceptre', 'dagger', 'claw', 'wand', 'staff', 'bow'];
  if (fn.startsWith('weapon') && a && W.includes(a)) return a;
  const T: [string, string[]][] = [
    ['attributes', ['str', 'dex', 'int', 'allAttr']],
    ['life', ['life', 'lifeFlat', 'lifeRegen', 'lifeRegenPerGrit']],
    ['energy shield', ['es', 'esFlat', 'esRecharge', 'esRechargeDelay', 'esOnHit', 'esLeech']],
    ['armour', ['armour', 'armourFlat', 'physReduction', 'globalDefences']],
    ['evasion', ['evasion', 'evasionFlat']],
    [
      'block and shields',
      [
        'shieldBlock',
        'blockAttack',
        'spellBlock',
        'shieldSpellBlock',
        'blockRecovery',
        'lifeOnBlock',
        'manaOnBlock',
        'shieldDef',
        'shieldAttack',
        'shieldSpeed',
        'shieldStunAvoid',
      ],
    ],
    ['dodge', ['dodgeAttack', 'dodgeSpell']],
    ['resistances', ['resAll', 'resOne', 'maxResAll', 'maxResOne', 'avoidAilments']],
    ['stun (self)', ['stunThreshold', 'stunAvoid', 'stunRecovery']],
    [
      'mana',
      ['mana', 'manaFlat', 'manaRegen', 'costReduction', 'manaLeech', 'manaOnHit', 'manaOnKill'],
    ],
    ['auras', ['reducedReservation', 'auraEffect']],
    ['leech', ['leechLife', 'lifeOnHit', 'lifeOnKill', 'leechRate']],
    ['flasks', ['flaskEffect', 'flaskRecovery', 'flaskDuration', 'flaskCharges']],
    ['movement', ['moveSpeed']],
    [
      'spells',
      [
        'spellDamage',
        'castSpeed',
        'spellArea',
        'spellAreaDamage',
        'spellProjectile',
        'spellCrit',
        'spellCritMulti',
        'physSpell',
        'chaosSpell',
      ],
    ],
    ['wand', ['wandAttack', 'wandSpellDamage', 'wandCastSpeed']],
    ['dagger', ['daggerDamage', 'daggerSpellDamage', 'daggerSpellCrit']],
    ['sword', ['swordDamage']],
    ['axe', ['axeDamage']],
    ['mace', ['maceDamage']],
    ['claw', ['clawDamage']],
    ['staff', ['staffDamage']],
    ['bow', ['bowDamage', 'bowSpeed']],
    ['two-handed', ['twoHandDamage']],
    ['dual wield', ['dualDamage', 'dualSpeed', 'dualCrit', 'dualAccuracy', 'dualBlock']],
    [
      'attacks',
      [
        'attackSpeed',
        'accuracy',
        'accuracyFlat',
        'attackDamage',
        'physAttack',
        'attackSpeedOnKill',
      ],
    ],
    ['melee', ['meleeDamage', 'meleePhys', 'meleeArea', 'meleeRange', 'oneHandMelee']],
    [
      'projectiles',
      [
        'projectileDamage',
        'projectileAttack',
        'projectileSpeed',
        'pierce',
        'chain',
        'extraProjectile',
      ],
    ],
    ['elemental', ['eleDamageAll', 'eleAttack', 'elePenetration']],
    ['chaos', ['chaosAttack', 'chaosDot']],
    [
      'poison',
      ['poisonChance', 'poisonDamage', 'poisonFaster', 'poisonDuration', 'damageVsPoisoned'],
    ],
    ['bleed', ['bleedChance', 'bleedDamage', 'bleedFaster', 'bleedDuration', 'damageVsBleeding']],
    ['damage over time', ['dotDamage', 'ailmentEffect']],
    ['crit', ['critChance', 'critMulti', 'critOnFullLife']],
    ['area', ['areaDamage', 'aoe']],
    ['minions', ['minionDamage', 'minionLife', 'minionSpeed']],
    ['totems', ['totemDamage', 'totemSpeed', 'totemDuration']],
    ['traps', ['trapDamage', 'trapSpeed']],
    ['mines', ['mineDamage', 'mineSpeed']],
    ['brands', ['brandDamage']],
    ['curses', ['curseEffect', 'hexLimit', 'curseArea', 'damageVsCursed']],
    ['warcries', ['warcryEffect', 'warcryDuration']],
    [
      'charges',
      [
        'gritDuration',
        'maxGrit',
        'gritOnHitTaken',
        'fervourDuration',
        'maxFervour',
        'fervourOnKill',
        'maxInsight',
        'insightDuration',
        'insightOnCrit',
      ],
    ],
    ['stun (enemy)', ['stunDuration', 'enemyStunThreshold', 'stunDamage', 'knockback']],
    ['channelling', ['channelDamage']],
    ['duration and cooldown', ['skillDuration', 'cooldownRecovery']],
    [
      'conditional damage',
      ['damageOnFullLife', 'damageOnLowLife', 'damageVsLowLife', 'cullingStrike', 'doubleDamage'],
    ],
  ];
  // Tagged variants that belong to a narrower family than their function.
  if (a === 'melee' && (fn === 'critChance' || fn === 'aoe')) return 'melee';
  if (a === 'trap' && fn === 'aoe') return 'traps';
  if (a?.startsWith('twoHand') && fn === 'attackSpeed') return 'two-handed';
  if (a === 'oneHand' && fn === 'attackSpeed') return 'melee';
  if (a === 'channelling') return 'channelling';
  if (a === 'axe' && fn === 'attackSpeed') return 'axe';
  if (fn === 'eleDamage' || fn === 'eleAttackOne' || fn === 'penetration')
    return a === 'physical' ? 'physical' : a;
  if (['burnDamage', 'igniteChance', 'igniteDuration', 'igniteFaster'].includes(fn)) return 'fire';
  if (['chillEffect', 'freezeChance', 'freezeDuration', 'coldDot'].includes(fn)) return 'cold';
  if (['shockEffect', 'shockChance', 'shockDuration', 'damageVsShocked'].includes(fn))
    return 'lightning';
  if (fn === 'resOne' && a === 'chaos') return 'resistances';
  for (const [f, fns] of T) if (fns.includes(fn)) return f;
  return `other (${key})`;
}

const keyOf = (s: LineSpec): string =>
  [
    s.fn,
    ...s.args
      .filter((x) => typeof x === 'string' || Array.isArray(x))
      .map((x) => (Array.isArray(x) ? x.join('+') : String(x))),
  ].join(':');

// ---- Lines by node.
type Row = { fam: string; units: number; amount: number };
const rows: Row[][] = built.lines.map((specs) =>
  specs.flatMap((s) => {
    const l = makeLine(s);
    if (!l) return [];
    const amount = (s.args.find((x) => typeof x === 'number') as number | undefined) ?? 0;
    return [{ fam: familyOf(keyOf(s)), units: l.units, amount }];
  }),
);

const out: string[] = [];
const say = (s = '') => out.push(s);
const fmt = (n: number) => (n === 0 ? '.' : n < 10 ? n.toFixed(1) : String(Math.round(n)));

// ---- 1. Units by family and region.
const byFam = new Map<string, Record<string, number>>();
for (let i = 0; i < N; i++) {
  if (!live(i)) continue;
  const r = built.place[i].region;
  for (const row of rows[i]) {
    const e = byFam.get(row.fam) ?? {};
    e[r] = (e[r] ?? 0) + (row.fam === 'attributes' ? row.amount : row.units);
    byFam.set(row.fam, e);
  }
}
say('## Units of each stat family by region');
say();
say(
  'A unit is the small node of the stat (`lines.ts`); attributes are in points. Sorted by total.',
);
say();
say(`| family | ${REGIONS.join(' | ')} | total |`);
say(`| --- | ${REGIONS.map(() => '---:').join(' | ')} | ---: |`);
const famRows = [...byFam].map(([f, e]) => ({
  f,
  e,
  t: Object.values(e).reduce((s, x) => s + x, 0),
}));
famRows.sort((x, y) => (x.f === 'attributes' ? 1 : y.f === 'attributes' ? -1 : y.t - x.t));
for (const { f, e, t } of famRows)
  say(`| ${f} | ${REGIONS.map((r) => fmt(e[r] ?? 0)).join(' | ')} | ${fmt(t)} |`);

// ---- 2. Node counts by region and area.
say();
say('## Nodes by region and area');
say();
say('| region | area | small | notable | keystone | road | total |');
say('| --- | --- | ---: | ---: | ---: | ---: | ---: |');
for (const reg of REGIONS)
  for (const a of AREAS.filter((x) => x.region === reg)) {
    const k: Record<string, number> = {};
    for (let i = 0; i < N; i++)
      if (live(i) && built.place[i].area === a.id) k[nodes[i].kind] = (k[nodes[i].kind] ?? 0) + 1;
    const t = Object.values(k).reduce((s, x) => s + x, 0);
    say(
      `| ${reg} | ${a.name} | ${k.small ?? 0} | ${k.notable ?? 0} | ${k.keystone ?? 0} | ${k.travel ?? 0} | ${t} |`,
    );
  }

// ---- 3. Specializations: notables, partners, twins.
const steps = (from: number) => {
  const d = new Int32Array(N).fill(-1);
  d[from] = 0;
  const q = [from];
  for (let h = 0; h < q.length; h++)
    for (const m of nodes[q[h]].links)
      if (d[m] < 0 && nodes[m].kind !== 'start') {
        d[m] = d[q[h]] + 1;
        q.push(m);
      }
  return d;
};
/** A notable's families by units, its cluster's smalls included (the cluster is what the player walks to). */
function famsOf(i: number): Map<string, number> {
  const m = new Map<string, number>();
  const cl = nodes[i].cluster;
  for (let j = 0; j < N; j++) {
    if (!live(j) || (j !== i && (nodes[j].cluster !== cl || nodes[j].kind !== 'small'))) continue;
    for (const r of rows[j])
      if (r.fam !== 'attributes') m.set(r.fam, (m.get(r.fam) ?? 0) + r.units);
  }
  return m;
}
const SKIP = new Set(['attributes', 'resistances', 'movement', 'flasks']);
const notables = nodes.filter((n) => live(n.id) && n.kind === 'notable').map((n) => n.id);
const fams = new Map<number, Map<string, number>>(notables.map((i) => [i, famsOf(i)]));
/** The families a notable is "about": a third or more of its cluster's units. */
const about = (i: number) => {
  const m = fams.get(i)!;
  const t = [...m.values()].reduce((s, x) => s + x, 0);
  return [...m].filter(([f, u]) => !SKIP.has(f) && u >= t / 3).map(([f]) => f);
};
const dist = new Map<number, Int32Array>(notables.map((i) => [i, steps(i)]));
const bySpec = new Map<string, number[]>();
for (const i of notables) for (const f of about(i)) bySpec.set(f, [...(bySpec.get(f) ?? []), i]);
say();
say('## Specializations: their notables, partners and twins');
say();
say(
  "A notable belongs to a family when a third or more of its cluster's units are that family (resistances, movement and flasks are generic and left out). Partner: the cluster's other families. Nearest twin: steps to the closest notable of the same family (CONSTRAINTS §5.2 wants about five or more). **Same pairing** marks two notables of the family whose partners are the same, which is not a choice (§5.1).",
);
for (const [f, list] of [...bySpec].sort((x, y) => y[1].length - x[1].length)) {
  say();
  say(`### ${f} (${list.length})`);
  say();
  for (const i of list) {
    const partners = about(i).filter((g) => g !== f);
    const others = list.filter((j) => j !== i);
    const near = others
      .map((j) => ({ j, d: dist.get(i)![j] }))
      .filter((x) => x.d >= 0)
      .sort((x, y) => x.d - y.d)[0];
    const same = others.filter((j) => {
      const p = about(j).filter((g) => g !== f);
      return p.length && p.join() === partners.join();
    });
    say(
      `- ${nodes[i].name} (${built.place[i].region}, ${AREAS.find((a) => a.id === built.place[i].area)?.name}): partner ${partners.join(', ') || 'none'}; nearest twin ${near ? `${nodes[near.j].name} ${near.d}` : 'none'}${near && near.d < 5 ? ' **close**' : ''}${same.length ? `; **same pairing** as ${same.map((j) => nodes[j].name).join(', ')}` : ''}`,
    );
  }
}

// ---- 4. Empty space.
const xs = notables.length ? nodes.filter((n) => live(n.id)) : [];
let rOut = 0;
for (const n of xs) rOut = Math.max(rOut, Math.hypot(n.x, n.y));
/** The network's own outline: by 5� sector, the farthest node in it or its two neighbours. */
const SECTORS = 72;
const outer = new Array<number>(SECTORS).fill(0);
const sectorOf = (x: number, y: number) =>
  Math.floor((((Math.atan2(y, x) * 180) / Math.PI + 360) % 360) / (360 / SECTORS));
for (const n of xs) {
  const k = sectorOf(n.x, n.y);
  outer[k] = Math.max(outer[k], Math.hypot(n.x, n.y));
}
const edge = outer.map((_, k) =>
  Math.max(outer[(k + SECTORS - 1) % SECTORS], outer[k], outer[(k + 1) % SECTORS]),
);
const cells: { x: number; y: number; region: string; inside: boolean }[] = [];
const emptyBy: Record<string, number> = {};
const rimBy: Record<string, number> = {};
const cellsBy: Record<string, number> = {};
for (let y = -rOut; y <= rOut; y += CELL)
  for (let x = -rOut; x <= rOut; x += CELL) {
    if (Math.hypot(x, y) > rOut - CELL / 2) continue;
    let best = Infinity,
      reg = '';
    for (const n of xs) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < best) {
        best = d;
        reg = built.place[n.id].region;
      }
    }
    const inside = Math.hypot(x, y) <= edge[sectorOf(x, y)];
    if (inside) cellsBy[reg] = (cellsBy[reg] ?? 0) + 1;
    if (best > CLEAR) {
      cells.push({ x, y, region: reg, inside });
      if (inside) emptyBy[reg] = (emptyBy[reg] ?? 0) + 1;
      else rimBy[reg] = (rimBy[reg] ?? 0) + 1;
    }
  }
say();
say('## Empty space');
say();
say(
  `Cells of ${CELL}×${CELL} tree units with no node within ${CLEAR} units, by the region of the nearest node. **Inside** is within the network's own outline (by 5° sector, the farthest node there or beside it): room to fill without growing. **Rim** is between that outline and the circle through the farthest node (radius ${Math.round(rOut)}): room to grow outward. A notable with three smalls in a tight cluster takes about four to six cells with the room round it.`,
);
say();
say('| region | cells inside | empty inside | share | empty rim |');
say('| --- | ---: | ---: | ---: | ---: |');
for (const r of REGIONS)
  say(
    `| ${r} | ${cellsBy[r] ?? 0} | ${emptyBy[r] ?? 0} | ${Math.round((100 * (emptyBy[r] ?? 0)) / (cellsBy[r] || 1))}% | ${rimBy[r] ?? 0} |`,
  );

if (picOut) {
  const m = 250;
  const minX = -rOut - m,
    maxX = rOut + m;
  const width = 1800;
  const scale = width / (maxX - minX);
  const cv = new Canvas(width, width, hex('#0f1016'));
  const X = (x: number) => (x - minX) * scale,
    Y = (y: number) => (y - minX) * scale;
  const COL: Record<string, string> = {
    mystic: '#6a8cf0',
    shade: '#c45ad6',
    strider: '#6cc070',
    reaver: '#d8c07a',
    vanguard: '#d8654a',
    zealot: '#e6b060',
    centre: '#8a90a0',
  };
  for (const c of cells)
    cv.disc(X(c.x), Y(c.y), (CELL / 2) * scale, hex(COL[c.region]), c.inside ? 0.35 : 0.1);
  for (let k = 0; k < SECTORS; k++) {
    const a0 = (k * 2 * Math.PI) / SECTORS,
      a1 = ((k + 1) * 2 * Math.PI) / SECTORS;
    cv.line(
      X(edge[k] * Math.cos(a0)),
      Y(edge[k] * Math.sin(a0)),
      X(edge[k] * Math.cos(a1)),
      Y(edge[k] * Math.sin(a1)),
      1,
      hex('#c8ccd8'),
      0.5,
    );
  }
  cv.ring(X(0), Y(0), rOut * scale, 1, hex('#5a5e6c'), 0.8);
  for (const n of nodes)
    for (const k of n.links)
      if (k > n.id && live(n.id) && live(k))
        cv.line(X(n.x), Y(n.y), X(nodes[k].x), Y(nodes[k].y), 1, hex('#8a90a0'), 0.7);
  const R: Record<string, number> = {
    start: 34,
    keystone: 38,
    notable: 24,
    small: 10,
    travel: 9,
    hub: 10,
  };
  for (const n of xs)
    cv.disc(
      X(n.x),
      Y(n.y),
      R[n.kind] * scale * 1.3,
      hex(COL[built.place[n.id].region] ?? '#ffffff'),
      1,
    );
  for (const a of AREAS)
    if (a.region !== 'centre') cv.text(a.name, X(a.at[0]), Y(a.at[1]), 1, hex('#e8e4d8'), 'middle');
  cv.text(
    `Empty space: no node within ${CLEAR} units. Strong: inside the outline. Faint: rim`,
    10,
    16,
    2,
    hex('#e8e4d8'),
    'start',
  );
  cv.save(picOut);
}

const text = out.join('\n') + '\n';
if (mdOut) writeFileSync(mdOut, text);
else process.stdout.write(text);
