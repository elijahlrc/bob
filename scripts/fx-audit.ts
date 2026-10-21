/**
 * Does every skill look like what it deals? Runs each active gem against a dummy (the smoke test's kit, src/sim/gemKit.ts) and
 * compares the elements its pictures are drawn in (events, projectiles, ground, the icon, the motif inside its areas) with the
 * damage it dealt, its damage over time, and the element words of its name and description.
 *
 *   npx tsx scripts/fx-audit.ts            mismatches only
 *   npx tsx scripts/fx-audit.ts --all      every gem
 *   npx tsx scripts/fx-audit.ts --only id  one gem
 *   npx tsx scripts/fx-audit.ts --added lightning   with a little added damage of that type on the gear
 */
import { ACTIVE_GEMS, GRANTED_GEMS, type ActiveGemDef } from '../src/data/gems';
import { DAMAGE_TYPES, type DamageType } from '../src/mods/types';
import { activeLook, ELEMENT_NAME, profileLook } from '../src/calc/skillLook';
import { beamMotifOf, motifOf, type Motif } from '../src/calc/areaLook';
import { buildForActive, layCorpses, seedFor } from '../src/sim/gemKit';
import { createDummyWorld } from '../src/sim/dummy';
import { stepWorld } from '../src/sim/world';

const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
const added = (args.includes('--added') ? args[args.indexOf('--added') + 1] : undefined) as
  DamageType | undefined;

const P = 0;
const L = 1;
const C = 2;
const F = 3;
const X = 4;

/** The element a motif draws, or -1 for one that belongs to none (a quake, blades, rain). */
const MOTIF_EL: Record<Motif, number> = {
  quake: -1,
  quakeWave: -1,
  boneSpikes: -1,
  stoneSpikes: -1,
  iceSpikes: C,
  frostBloom: C,
  freeze: C,
  iceShatter: C,
  iceWaves: C,
  iceNova: C,
  whirlFrost: C,
  flames: F,
  geyser: F,
  fireball: F,
  fireNova: F,
  flameLine: F,
  lava: F,
  splat: F,
  strike: L,
  storm: L,
  pillar: L,
  crackleNova: L,
  crackleLine: L,
  cloud: X,
  ritual: X,
  holy: -1,
  shrapnel: -1,
  jaws: -1,
  drain: -1,
  blades: -1,
  swingNova: -1,
  whirlBlades: -1,
  forceWave: -1,
  breath: X,
  rain: -1,
};

/** Element words of names and descriptions. */
const WORDS: [number, RegExp][] = [
  [
    F,
    /\b(fire|flames?|flaming|burn\w*|embers?|blaze\w*|cinders?|magma|lava|molten|scorch\w*|sear\w*|inferno|pyre|ignit\w*|furnace|slag|heat|hotter)\b/i,
  ],
  [
    C,
    /\b(cold|ice|icy|frost\w*|freez\w*|chill\w*|frozen|glacia\w*|glacier|rime|snow|hoarfrost|blizzard)\b/i,
  ],
  // Not "arc" (a sweep), "storm" (of blades) or "shockwave".
  [L, /\b(lightning|shock(?!wave)\w*|sparks?|thunder\w*|crackl\w*|static|electric\w*|zaps?)\b/i],
  [
    X,
    /\b(chaos|poison\w*|venom\w*|rot|rotting|plague|blight\w*|decay\w*|toxic|caustic|wither\w*|corrupt\w*|acid)\b/i,
  ],
];

type Row = {
  id: string;
  name: string;
  dealt: Map<number, number>;
  dot: Set<number>;
  words: Set<number>;
  tagEl: number;
  icon: number;
  seen: Map<string, Set<number>>;
  motifs: Set<string>;
  problems: string[];
};

const el = (i: number) => (i < 0 ? 'none' : ELEMENT_NAME[i]);
const els = (s: Iterable<number>) => [...s].map(el).join('+') || '-';

function dotTypes(def: ActiveGemDef): Set<number> {
  const out = new Set<number>();
  const add = (t?: string) => t && out.add(DAMAGE_TYPES.indexOf(t as never));
  add(def.dot?.type);
  const leaves = def.leaves as { kind?: string } | undefined;
  if (leaves?.kind)
    add(
      { burning: 'fire', chilling: 'cold', shocking: 'lightning', caustic: 'chaos' }[leaves.kind] ??
        undefined,
    );
  return out;
}

function audit(def: ActiveGemDef): Row {
  const b = buildForActive(def);
  // Gear that adds a little damage of another type (the case of a ray of fire drawn as lightning): the pictures must not follow it.
  if (added)
    b.equipment.body!.uniqueMods = [
      ...(b.equipment.body!.uniqueMods ?? []),
      { stat: 'damage.min', kind: 'base', value: 3, damageTypes: [added] },
      { stat: 'damage.max', kind: 'base', value: 6, damageTypes: [added] },
    ];
  const { world, dummy } = createDummyWorld(b, { distance: def.utility ? 2 : 2.5 });
  const side = world.sides[0];
  side.opts.freeResources = true;
  side.opts.godMode = true;
  seedFor(def, world, dummy);
  if (def.utility?.kind === 'summon') layCorpses(world, dummy.x, dummy.y, 3);
  dummy.rarity = 'boss';
  const seen = new Map<string, Set<number>>();
  const see = (what: string, t: number | undefined) => {
    if (t === undefined) return;
    if (!seen.has(what)) seen.set(what, new Set());
    seen.get(what)!.add(t);
  };
  const motifs = new Set<string>();
  const dealt = new Map<number, number>();
  const me = side.player.id;
  const mine = (src: number) =>
    src === me ||
    side.minions.some((m) => m.id === src) ||
    side.deployables.some((d) => d.id === src);
  for (let i = 0; i < 8 * 60; i++) {
    stepWorld(world);
    for (const e of world.events) {
      switch (e.t) {
        case 'hit':
          if (mine(e.src) && e.dst === dummy.id)
            dealt.set(e.dtype, (dealt.get(e.dtype) ?? 0) + e.amount);
          break;
        case 'explode':
          if (e.skill === def.id) {
            see('area', e.dtype);
            const m = motifOf(e.skill, e.dtype, !!e.strip);
            motifs.add(`${m}`);
            if (MOTIF_EL[m] >= 0) see('motif', MOTIF_EL[m]);
          }
          break;
        case 'beam':
          if (e.skill === def.id || e.skill === undefined) {
            see('beam', e.dtype);
            const m = e.skill && e.width ? beamMotifOf(e.skill, e.dtype) : null;
            motifs.add(m ? `beam:${m}` : 'beam:bolt');
            if (!m || MOTIF_EL[m] >= 0) see('motif', m ? MOTIF_EL[m] : L);
          }
          break;
        case 'swing':
        case 'thrust':
          // A skill that is not a melee one leaves the plain attack to fill the gaps: that is not its picture.
          if (e.src === me && def.behaviour.kind === 'melee') see(e.t, e.dtype);
          break;
        case 'chain':
          see('chain', e.dtype ?? L);
          break;
        default:
          break;
      }
    }
    for (const p of world.projectiles)
      if (p.profile.skill.id === def.id) see('projectile', p.dtype);
    for (const z of side.zones) see('zone', z.dtype);
    for (const f of side.fields) if (!f.skill || f.skill === def.id) see('field', f.dtype);
  }
  const choice = side.char.actives.find((a) => a.skill.id === def.id);
  const prof = choice ? side.char.profile(choice, 0) : undefined;
  const icon = prof ? profileLook(prof).element : -2;
  // What the skill's own hit is made of (the hits on the dummy also count the plain attack and minions).
  if (prof && def.behaviour.kind !== 'melee' && !def.utility) {
    dealt.clear();
    // A skill that never hits deals none of its hand.
    if (!def.dot?.hitless)
      for (const c of prof.hands[0]?.chunks ?? [])
        dealt.set(c.type, (dealt.get(c.type) ?? 0) + (c.min + c.max) / 2);
  }
  const words = new Set<number>();
  const text = `${def.name}. ${def.description}`;
  for (const [t, re] of WORDS) if (re.test(text)) words.add(t);
  const row: Row = {
    id: def.id,
    name: def.name,
    dealt,
    dot: dotTypes(def),
    words,
    tagEl: activeLook(def).element,
    icon,
    seen,
    motifs,
    problems: [],
  };
  judge(row, def);
  return row;
}

function judge(r: Row, def: ActiveGemDef): void {
  if (def.utility) return;
  const total = [...r.dealt.values()].reduce((a, b) => a + b, 0);
  // What the skill is made of: every type with at least a fifth of its hit damage, and its damage over time.
  const made = new Set<number>(r.dot);
  for (const [t, v] of r.dealt) if (total > 0 && v / total >= 0.2) made.add(t);
  let main = -1;
  let best = 0;
  for (const [t, v] of r.dealt)
    if (v > best) {
      best = v;
      main = t;
    }
  if (main < 0 && r.dot.size) main = [...r.dot][0];
  const ok = new Set<number>([...made, ...r.words]);
  // A skill that picks an element for each use deals each of them in turn.
  if (def.element) for (const t of [L, C, F]) ok.add(t);
  for (const [what, set] of r.seen)
    for (const t of set)
      if (!ok.has(t) && !(t === P && what !== 'motif' && made.size === 0))
        r.problems.push(`${what} drawn ${el(t)}`);
  if (!def.element && r.icon >= 0 && main >= 0 && r.icon !== main && !made.has(r.icon))
    r.problems.push(`icon ${el(r.icon)}`);
  // Words that promise an element the skill does not deal (a description of fire on a cold skill).
  for (const t of r.words)
    if (made.size > 0 && !made.has(t) && !r.dealt.has(t)) r.problems.push(`text says ${el(t)}`);
  if (main >= 0) {
    const drawn = new Set<number>();
    for (const s of r.seen.values()) for (const t of s) drawn.add(t);
    if (drawn.size > 0 && main !== P && !drawn.has(main))
      r.problems.push(`deals ${el(main)} but never drawn so`);
  }
}

// An item-granted damage skill has no gem to socket in the kit: its look is its gem's (activeLook), checked by the tests.
const defs = [
  ...ACTIVE_GEMS,
  ...GRANTED_GEMS.filter((d) => d.utility && !ACTIVE_GEMS.includes(d)),
].filter((d) => !only || d.id === only);
let bad = 0;
for (const def of defs) {
  let row: Row;
  try {
    row = audit(def);
  } catch (err) {
    console.log(`${def.id.padEnd(22)} ERROR ${(err as Error).message}`);
    continue;
  }
  if (row.problems.length) bad++;
  if (!all && !only && row.problems.length === 0) continue;
  const dealt = [...row.dealt]
    .sort((a, b) => b[1] - a[1])
    .map(([t, v]) => `${el(t)} ${Math.round(v)}`)
    .join(', ');
  const seen = [...row.seen].map(([k, s]) => `${k}:${els(s)}`).join(' ');
  console.log(
    `${def.id.padEnd(22)} ${row.problems.length ? 'FIX ' : 'ok  '} dealt[${dealt || '-'}] dot[${els(row.dot)}] words[${els(row.words)}] tags[${el(row.tagEl)}] icon[${el(row.icon)}]`,
  );
  console.log(`${''.padEnd(27)} seen ${seen || '-'} motifs ${[...row.motifs].join(',') || '-'}`);
  if (row.problems.length) console.log(`${''.padEnd(27)} -> ${row.problems.join('; ')}`);
}
console.log(`\n${bad} of ${defs.length} gems flagged`);
