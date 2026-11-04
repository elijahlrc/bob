/**
 * What share of the monsters' damage is of each type, before the character's defences: every map offered at every level, over
 * many runs, each monster weighted by its raw damage a second (its attack, its sidearm and the abilities that hit) times how
 * many there are. An approximation: every monster is taken to be attacking all the time, and damage over time, ground
 * effects, one-off windows and the scripted attacks of bosses are left out (they are listed at the end).
 *
 *   npx tsx scripts/damage-mix.ts [--seeds 20] [--class vanguard]
 */
import { readFileSync } from 'node:fs';
import { buildMonster, type MonsterStats } from '../src/calc/monster';
import { BURSTS } from '../src/sim/factions';
import { SENTINEL_SLAM_INTERVAL, TYPE_ABILITIES } from '../src/data/abilities';
import { TYPE_SIDEARMS } from '../src/data/encounters';
import { MONSTER_TYPES } from '../src/data/monsters';
import { rollOffers } from '../src/run/offers';
import { newRun, planFor } from '../src/run/run';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const seeds = Number(arg('seeds', '20'));
const classId = arg('class', 'vanguard');
const TYPES = ['physical', 'lightning', 'cold', 'fire', 'chaos'];
const BANDS: [string, number, number][] = [
  ['1-10', 1, 10],
  ['11-20', 11, 20],
  ['21-40', 21, 40],
  ['41-60', 41, 60],
  ['61-80', 61, 80],
  ['81-100', 81, 100],
];
type Vec = number[];
const zero = (): Vec => [0, 0, 0, 0, 0];
const add = (a: Vec, b: Vec, k = 1) => b.forEach((v, i) => (a[i] += v * k));

/** Raw damage a second of one profile by type: the average hit of each chunk, times its repeats and pulses, over its use time. */
function profileDps(p: ReturnType<MonsterStats['profile']>, every?: number): Vec {
  const v = zero();
  const per = (1 + p.repeats) * p.pulses;
  const h = p.hands[0];
  if (!h) return v;
  for (const c of h.chunks)
    v[c.type] += (((c.min + c.max) / 2) * h.hitMult * per) / (every ?? p.useTime);
  return v;
}
/** How a profile's damage gets to the character: a melee blow, a projectile (or a chained bolt), an area, or a beam. */
function deliveryOf(p: ReturnType<MonsterStats['profile']>): string {
  if (p.skill.pattern) return 'area';
  const k = p.skill.behaviour.kind;
  return k === 'melee'
    ? 'melee'
    : k === 'projectile' || k === 'chain'
      ? 'projectile'
      : k === 'burst'
        ? 'area'
        : k;
}
const DELIVERY: Record<string, string> = {};
const hitOf = (s: MonsterStats) =>
  s.profile(0).hands[0].chunks.reduce((a, c) => a + (c.min + c.max) / 2, 0);

/** By source, the damage a second of one monster. */
/** A burster (Bloater, Cinderling) never strikes: its blast and fire land once, taken as once in this many seconds. */
const BURST_EVERY = 4;

function monsterDps(s: MonsterStats): Record<string, Vec> {
  const burst = BURSTS[s.spec.type];
  const out: Record<string, Vec> = { attack: profileDps(s.profile(0)) };
  DELIVERY.attack = deliveryOf(s.profile(0));
  if (burst) {
    const once = hitOf(s) * (burst.mult + burst.dps * burst.seconds * 0.5);
    out.attack = [0, 0, 0, once / BURST_EVERY, 0];
    DELIVERY.attack = 'area';
  }
  if (s.sidearm) {
    out.sidearm = profileDps(s.sidearm.profile(0), s.sidearm.spec.every);
    DELIVERY.sidearm = deliveryOf(s.sidearm.profile(0));
  }
  const hit = hitOf(s);
  for (const ab of TYPE_ABILITIES[s.spec.type] ?? []) {
    const v = zero();
    if (ab.id === 'slam') v[0] = (ab.amount! * hit) / (ab.interval ?? SENTINEL_SLAM_INTERVAL);
    else if (ab.id === 'tithe') v[4] = ab.amount! * hit;
    else if (ab.id === 'stasis') v[1] = (ab.amount! * hit) / ab.interval!;
    else continue;
    DELIVERY[`ability:${ab.id}`] = ab.id === 'tithe' ? 'beam' : 'area';
    out[`ability:${ab.id}`] = v;
  }
  if (s.spec.mods.includes('wardingPulse')) out['mod:wardingPulse'] = [(0.6 * hit) / 8, 0, 0, 0, 0];
  DELIVERY['mod:wardingPulse'] = 'area';
  return out;
}

const bands = new Map(BANDS.map(([b]) => [b, zero()]));
const byDelivery = new Map(BANDS.map(([b]) => [b, new Map<string, Vec>()]));
const byDeliveryType = new Map<string, Map<string, number>>();
/** Per type: spawns by band, damage by type, damage by delivery. */
const typeRows = new Map<
  string,
  {
    id: string;
    n: Map<string, number>;
    dmg: Vec;
    del: Map<string, number>;
    band: Map<string, number>;
  }
>();
const bySource = new Map(BANDS.map(([b]) => [b, new Map<string, Vec>()]));
const byType = new Map<string, Vec>();
const byTypeBand = new Map(BANDS.map(([b]) => [b, new Map<string, Vec>()]));
const skipped = new Map<string, number>();
const volatile = zero();
const bandOf = (m: number) => BANDS.find(([, lo, hi]) => m >= lo && m <= hi)![0];

for (let seed = 1; seed <= seeds; seed++) {
  const run = newRun(classId, seed * 7919);
  for (let map = 1; map <= 100; map++) {
    run.map = map;
    const band = bandOf(map);
    for (const offer of rollOffers(run.seed, map)) {
      if (offer.kind !== 'map') continue;
      const plan = planFor(run, offer);
      const spawns = [...plan.pop.monsters, ...(plan.pop.waves ?? []).flatMap((w) => w.monsters)];
      for (const sp of spawns) {
        const t = MONSTER_TYPES[sp.spec.type];
        if (sp.spec.rarity === 'boss' || t.bossOnly) {
          skipped.set('bosses', (skipped.get('bosses') ?? 0) + 1);
          continue;
        }
        const s = buildMonster(sp.spec);
        const parts = monsterDps(s);
        if (!typeRows.has(t.name))
          typeRows.set(t.name, {
            id: t.id,
            n: new Map(),
            dmg: zero(),
            del: new Map(),
            band: new Map(),
          });
        const row = typeRows.get(t.name)!;
        row.n.set(band, (row.n.get(band) ?? 0) + 1);
        for (const [src, v] of Object.entries(parts)) {
          add(row.dmg, v);
          row.band.set(band, (row.band.get(band) ?? 0) + v.reduce((a, b) => a + b, 0));
          row.del.set(
            DELIVERY[src],
            (row.del.get(DELIVERY[src]) ?? 0) + v.reduce((a, b) => a + b, 0),
          );
        }
        for (const [src, v] of Object.entries(parts)) {
          add(bands.get(band)!, v);
          const m = bySource.get(band)!;
          if (!m.has(src)) m.set(src, zero());
          add(m.get(src)!, v);
          const key = `${t.name}`;
          if (!byType.has(key)) byType.set(key, zero());
          add(byType.get(key)!, v);
          const tb = byTypeBand.get(band)!;
          if (!tb.has(key)) tb.set(key, zero());
          add(tb.get(key)!, v);
          const dm = byDelivery.get(band)!;
          const dl = DELIVERY[src];
          if (!dm.has(dl)) dm.set(dl, zero());
          add(dm.get(dl)!, v);
          if (!byDeliveryType.has(dl)) byDeliveryType.set(dl, new Map());
          const dt = byDeliveryType.get(dl)!;
          dt.set(t.name, (dt.get(t.name) ?? 0) + v.reduce((a, b) => a + b, 0));
        }
        if (sp.spec.mods.includes('volatile')) volatile[3] += 3 * hitOf(s);
        for (const ab of TYPE_ABILITIES[sp.spec.type] ?? [])
          if (!['slam', 'tithe', 'stasis', 'burst'].includes(ab.id))
            skipped.set(`ability:${ab.id}`, (skipped.get(`ability:${ab.id}`) ?? 0) + 1);
      }
    }
  }
}

const pct = (v: Vec) => {
  const t = v.reduce((a, b) => a + b, 0) || 1;
  return v.map((x) => `${((100 * x) / t).toFixed(1)}%`);
};
const sum = (v: Vec) => v.reduce((a, b) => a + b, 0);
console.log(`Raw damage a second by type, ${seeds} runs, every map offer, bosses left out\n`);
console.log(`| Maps | ${TYPES.join(' | ')} | of which sidearms | of which abilities |`);
console.log(`| --- | ${TYPES.map(() => '---').join(' | ')} | --- | --- |`);
for (const [b] of BANDS) {
  const v = bands.get(b)!;
  const src = bySource.get(b)!;
  const side = sum(src.get('sidearm') ?? zero());
  const abil = [...src.entries()]
    .filter(([k]) => k.includes(':'))
    .reduce((a, [, x]) => a + sum(x), 0);
  console.log(
    `| ${b} | ${pct(v).join(' | ')} | ${((100 * side) / sum(v)).toFixed(1)}% | ${((100 * abil) / sum(v)).toFixed(1)}% |`,
  );
}
const all = zero();
for (const v of bands.values()) add(all, v);
console.log(`| all | ${pct(all).join(' | ')} | | |`);

const KINDS = ['melee', 'projectile', 'area', 'beam'];
console.log(`
Raw damage a second by how it is delivered (and how much of each is physical)
`);
console.log(`| Maps | ${KINDS.join(' | ')} |`);
console.log(`| --- | ${KINDS.map(() => '---').join(' | ')} |`);
const allDel = new Map<string, Vec>();
for (const [b] of BANDS) {
  const dm = byDelivery.get(b)!;
  const t = sum(bands.get(b)!);
  for (const [k, v] of dm) {
    if (!allDel.has(k)) allDel.set(k, zero());
    add(allDel.get(k)!, v);
  }
  console.log(
    `| ${b} | ${KINDS.map((k) => {
      const v = dm.get(k) ?? zero();
      return `${((100 * sum(v)) / t).toFixed(1)}% (${((100 * v[0]) / (sum(v) || 1)).toFixed(0)}% phys)`;
    }).join(' | ')} |`,
  );
}
console.log(
  `| all | ${KINDS.map((k) => {
    const v = allDel.get(k) ?? zero();
    return `${((100 * sum(v)) / sum(all)).toFixed(1)}% (${((100 * v[0]) / (sum(v) || 1)).toFixed(0)}% phys)`;
  }).join(' | ')} |`,
);
const others = [...allDel.keys()].filter((k) => !KINDS.includes(k));
if (others.length) console.log('Other deliveries:', others);
for (const k of KINDS) {
  const m = byDeliveryType.get(k);
  if (!m) continue;
  const t = [...m.values()].reduce((a, b) => a + b, 0);
  console.log(`
${k}: ${[...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([n, v]) => `${n} ${((100 * v) / t).toFixed(0)}%`)
    .join(', ')}`);
}

for (const [b] of [BANDS[0], BANDS[2], BANDS[4]]) {
  const tb = byTypeBand.get(b)!;
  const tot = sum(bands.get(b)!);
  console.log(`\nMaps ${b}: monster types by share of all raw damage (top 12)\n`);
  console.log(`| Monster | share | ${TYPES.join(' | ')} |`);
  console.log(`| --- | --- | ${TYPES.map(() => '---').join(' | ')} |`);
  for (const [k, v] of [...tb.entries()].sort((a, c) => sum(c[1]) - sum(a[1])).slice(0, 12))
    console.log(`| ${k} | ${((100 * sum(v)) / tot).toFixed(1)}% | ${pct(v).join(' | ')} |`);
}

console.log('\nAll monster types, share of all raw damage and how much of it is physical\n');
const tot = sum(all);
for (const [k, v] of [...byType.entries()].sort((a, c) => sum(c[1]) - sum(a[1])))
  console.log(
    `${k.padEnd(26)} ${((100 * sum(v)) / tot).toFixed(1).padStart(5)}%  phys ${((100 * v[0]) / (sum(v) || 1)).toFixed(0)}%`,
  );
if (process.argv.includes('--types')) {
  const spawns = new Map(BANDS.map(([b]) => [b, 0]));
  for (const r of typeRows.values()) for (const [b, n] of r.n) spawns.set(b, spawns.get(b)! + n);
  console.log(
    `\n| Type | faction | role | attack | shape | sidearm | abilities | dmg share | ${TYPES.map((x) => x.slice(0, 4)).join(' | ')} | melee/proj/area/beam | spawn share ${BANDS.map(([b]) => b).join(' / ')} |`,
  );
  for (const [name, r] of [...typeRows.entries()].sort((a, c) => sum(c[1].dmg) - sum(a[1].dmg))) {
    const t = MONSTER_TYPES[r.id as keyof typeof MONSTER_TYPES];
    const side = TYPE_SIDEARMS[r.id as keyof typeof TYPE_SIDEARMS];
    const d = sum(r.dmg) || 1;
    const del = KINDS.map((k) => Math.round((100 * (r.del.get(k) ?? 0)) / d)).join('/');
    const sh = BANDS.map(([b]) =>
      ((100 * (r.n.get(b) ?? 0)) / (spawns.get(b) || 1)).toFixed(1),
    ).join(' / ');
    const sideTxt = side
      ? `${side.name} (${side.pattern ?? side.shape?.id ?? side.step ?? (side.ring ? 'ring' : '')}${side.convert ? ' ' + side.convert : ''}${side.minLevel ? ' L' + side.minLevel : ''})`
      : '';
    const abil = (TYPE_ABILITIES[r.id] ?? []).map((a) => a.id).join(',');
    console.log(
      `| ${name} | ${t.faction} | ${t.role} | ${t.attack ?? 'melee'}${t.innate ? ' innate' : ''}${t.elemental ? ' elemental' : ''} | ${t.shape?.id ?? 'strike'} | ${sideTxt} | ${abil} | ${((100 * sum(r.dmg)) / sum(all)).toFixed(1)}% | ${r.dmg.map((x) => Math.round((100 * x) / d)).join(' | ')} | ${del} | ${sh} |`,
    );
  }
}
/**
 * A what-if (--proposal file.json): each type listed gets a new split of its damage by type ([physical, lightning, cold, fire,
 * chaos]) and by delivery ([melee, projectile, area, beam]), in any units, and optionally a multiplier on its damage; the
 * rest keep what they have. `late` is a second damage split for the maps from `lateFrom` on (a type whose damage shifts with
 * the map level); `bandMult` scales how much of the type there is in a band (a faction met more often later). Prints the mix
 * the roster would have.
 */
const propFile = arg('proposal', '');
if (propFile) {
  const prop: Record<
    string,
    {
      dmg?: number[];
      late?: number[];
      lateFrom?: number;
      del?: number[];
      mult?: number;
      bandMult?: Record<string, number>;
    }
  > = JSON.parse(readFileSync(propFile, 'utf8'));
  const norm = (v: number[]) => v.map((x) => x / (v.reduce((a, b) => a + b, 0) || 1));
  const pb = new Map(BANDS.map(([b]) => [b, { dmg: zero(), del: [0, 0, 0, 0] }]));
  for (const r of typeRows.values()) {
    const p = prop[r.id] ?? {};
    const d = sum(r.dmg) || 1;
    const split = p.dmg ? norm(p.dmg) : r.dmg.map((x) => x / d);
    const del = p.del ? norm(p.del) : KINDS.map((k) => (r.del.get(k) ?? 0) / d);
    for (const [b, tot] of r.band) {
      const x = pb.get(b)!;
      const late = p.late && BANDS.find(([n]) => n === b)![1] >= (p.lateFrom ?? 41);
      const k = (p.mult ?? 1) * (p.bandMult?.[b] ?? 1);
      add(x.dmg, late ? norm(p.late!) : split, tot * k);
      del.forEach((v, i) => (x.del[i] += v * tot * k));
    }
  }
  console.log(`\nProjected with ${propFile}\n`);
  console.log(`| Maps | ${TYPES.join(' | ')} | ${KINDS.join(' | ')} |`);
  console.log(`| --- | ${[...TYPES, ...KINDS].map(() => '---').join(' | ')} |`);
  const tot = { dmg: zero(), del: [0, 0, 0, 0] };
  for (const [b] of BANDS) {
    const x = pb.get(b)!;
    add(tot.dmg, x.dmg);
    add(tot.del, x.del);
    console.log(`| ${b} | ${pct(x.dmg).join(' | ')} | ${pct(x.del).join(' | ')} |`);
  }
  console.log(`| all | ${pct(tot.dmg).join(' | ')} | ${pct(tot.del).join(' | ')} |`);
}
console.log('\nLeft out (spawn counts):', Object.fromEntries(skipped));
console.log(
  `Volatile death blasts (fire, once each): ${(sum(volatile) / tot).toFixed(1)} seconds of the whole roster's damage a second`,
);
