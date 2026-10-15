/**
 * Measuring the damage preview against the sim (docs/SHEET-AUDIT.md): one build, one kind of fight, the sheet's numbers and the
 * sim's side by side. Used by `dps-audit.ts` (bot builds) and `dps-gems.ts` (every gem alone).
 */
import { Character, scenarioDps } from '../src/calc/character';
import type { SkillChoice, SkillSheet } from '../src/calc/character';
import type { TargetState } from '../src/calc/combat';
import { referenceMonster } from '../src/calc/monster';
import type { Build } from '../src/data/types';
import { createDummyWorld, dummyDefence } from '../src/sim/dummy';
import { stepWorld } from '../src/sim/world';

export type Fight = 'pack' | 'boss';

export type MeasureOpts = {
  /** Tiles from the character's start to the dummy. */
  distance: number;
  /** Seconds of play to measure, and how many runs (seeds) of it. */
  time: number;
  sims: number;
  /** Give the dummy the reference monster's defence instead of none. */
  reference: boolean;
  /** Mana and life are free (the sheet's DPS does not consider them). */
  freeResources?: boolean;
};

export type Row = {
  id: string;
  name: string;
  sheetUses: number;
  simUses: number;
  simShots: number;
  sheetDps: number;
  simDps: number;
};

export type Result = {
  sheet: number;
  sim: number;
  rows: Row[];
  mains: string;
  rotation: string;
};

export function targetOf(build: Build, reference: boolean): TargetState {
  const def = reference ? referenceMonster(build.level).defence : dummyDefence();
  return { def, shock: 0, resShift: [0, 0, 0, 0, 0] };
}

export function measure(build0: Build, fight: Fight, o: MeasureOpts): Result {
  // The character keeps its first target (the dummy it was given), so that the others standing about only make a pack.
  const build: Build = { ...build0, strategy: { ...build0.strategy, target: 'stick' } };
  const c = new Character(build, { targetDistance: o.distance, areaLevel: build.level });
  const t = targetOf(build, o.reference);
  const s = c.sheet(c.configConds, fight, t);
  const rows = new Map<string, Row>();
  const row = (id: string, name: string) => {
    let r = rows.get(id);
    if (!r)
      rows.set(
        id,
        (r = { id, name, sheetUses: 0, simUses: 0, simShots: 0, sheetDps: 0, simDps: 0 }),
      );
    return r;
  };
  const nameOf = new Map<string, string>();
  for (const a of c.actives) nameOf.set(a.skill.name, a.skill.id);
  nameOf.set(c.defaultAttack.skill.name, c.defaultAttack.skill.id);
  // The sheet counts the ailments a skill causes in its own total; the sim's ledger keeps them apart, so they are split here.
  const addSheet = (k: SkillSheet, uses: number) => {
    const r = row(k.id, k.name);
    r.sheetUses += uses;
    r.sheetDps += k.hitDps + k.dotDps;
    row('ailments', 'ailments').sheetDps += k.igniteDps + k.bleedDps + k.poisonDps;
  };
  addSheet(s.skill, s.skill.usesPerSec);
  for (const x of s.secondary) addSheet(x.skill, x.usesPerSec);
  for (const x of s.triggered) addSheet(x.skill, x.usesPerSec);
  if (s.minionDps > 0) row('minions', 'minions').sheetDps += s.minionDps;

  let secs = 0;
  let total = 0;
  for (let seed = 1; seed <= o.sims; seed++) {
    const { world } = createDummyWorld(build, {
      distance: o.distance,
      maxTime: o.time,
      seed,
      defence: o.reference ? t.def : undefined,
      rarity: fight === 'boss' ? 'boss' : 'normal',
      bystanders: fight === 'pack' ? 3 : 0,
      fixed: true,
      angle: 0.6,
    });
    if (o.freeResources === false) world.opts.freeResources = false;
    while (world.status === 'running') {
      stepWorld(world);
      for (const e of world.events) {
        if (e.t === 'use' && e.src === world.player.id) {
          const nm = [...nameOf].find(([, id]) => id === e.skill);
          const r = row(e.skill, nm?.[0] ?? e.skill);
          if (e.via) r.simShots++;
          else r.simUses++;
        }
      }
    }
    secs += world.t;
    // Everything dealt, by the sim's own ledger (the dummy is the only thing that takes damage).
    for (const kind of ['skill', 'minion', 'ailment', 'monster', 'effect'] as const)
      for (const lr of world.ledger.dealt[kind].values()) {
        const dmg = lr.dmg.reduce((a, b) => a + b, 0);
        total += dmg;
        const id =
          kind === 'skill'
            ? (nameOf.get(lr.name) ?? lr.name)
            : kind === 'minion'
              ? 'minions'
              : kind === 'ailment'
                ? 'ailments'
                : lr.name;
        row(id, lr.name).simDps += dmg;
      }
  }
  for (const r of rows.values()) {
    r.simUses /= secs;
    r.simShots /= secs;
    r.simDps /= secs;
  }
  const ent = (e: { choice: SkillChoice; role: string; when: string }) =>
    `${e.choice.skill.id}${e.choice.skill.cooldown !== undefined ? `(cd ${e.choice.skill.cooldown})` : ''}${e.when !== 'any' ? `[${e.when}]` : ''}${e.choice.deploy ? `<${e.choice.deploy}>` : ''}`;
  return {
    sheet: scenarioDps(s),
    sim: total / secs,
    rows: [...rows.values()],
    mains: c.mains.map(ent).join(', ') || '-',
    rotation:
      c.rotation
        .filter((e) => !e.choice.skill.utility && e.role !== 'off')
        .map((e) => `${e.role}:${ent(e)}`)
        .join(', ') || '-',
  };
}

export const f1 = (x: number) => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2));
