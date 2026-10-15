import { describe, expect, it } from 'vitest';
import { Character, scenarioDps, type Scenario } from './character';
import type { SkillTactic } from '../data/strategy';
import type { Build } from '../data/types';
import { buildFor } from '../sim/gemKit';
import { createDummyWorld, dummyDefence } from '../sim/dummy';
import { stepWorld } from '../sim/world';

/**
 * The sheet's rotation against the sim's (docs/SHEET-AUDIT.md): the shapes of build a player makes with the Strategy tab, each
 * played for two minutes against a training dummy, the uses a second of every skill and the damage a second on both sides.
 * The uses are the rotation and are held tight; the damage also has what each skill is worth in a use (the sheetVsSim tests of the
 * gems) and what skills do to each other's target (Rime Core exposes it to cold, so a cold skill beside it hits harder in the sim,
 * which the sheet does not count), so it is held to a looser bound.
 */

const DIST = 4;

/** A level 50 Mystic with the gems in the body armour, and the tactics by gem index. */
function build(
  gems: string[],
  tactics: Record<number, SkillTactic> = {},
  weapon = 'wand_3',
): Build {
  const b = buildFor(gems, weapon, 'mystic');
  const skills: Record<string, SkillTactic> = {};
  for (const [i, t] of Object.entries(tactics))
    skills[String(b.equipment.body!.sockets[Number(i)]!.uid)] = t;
  b.strategy = { skills };
  return b;
}

type Seen = { dps: number; uses: Record<string, number> };

function inSim(b: Build, fight: Scenario): Seen {
  const { world } = createDummyWorld(b, {
    distance: DIST,
    maxTime: 120,
    seed: 1,
    rarity: fight === 'boss' ? 'boss' : 'normal',
    bystanders: fight === 'pack' ? 3 : 0,
    fixed: true,
  });
  const uses: Record<string, number> = {};
  while (world.status === 'running') {
    stepWorld(world);
    for (const e of world.events)
      if (e.t === 'use' && e.src === world.player.id && !e.via)
        uses[e.skill] = (uses[e.skill] ?? 0) + 1;
  }
  let dealt = 0;
  for (const side of Object.values(world.ledger.dealt))
    for (const r of side.values()) dealt += r.dmg.reduce((a, x) => a + x, 0);
  for (const k of Object.keys(uses)) uses[k] /= world.t;
  return { dps: dealt / world.t, uses };
}

function onSheet(b: Build, fight: Scenario): Seen {
  const c = new Character(b, { targetDistance: DIST, areaLevel: b.level });
  const target = { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] };
  const plan = c.plan(c.configConds, fight);
  const uses: Record<string, number> = {};
  for (const a of c.actives)
    if (plan.acts[a.key] !== undefined) uses[a.skill.id] = plan.acts[a.key];
  if (plan.weapon > 0) uses[c.defaultAttack.skill.id] = plan.weapon;
  return { dps: scenarioDps(c.sheet(c.configConds, fight, target)), uses };
}

const near = (sim: number, sheet: number, tol: number, what: string) => {
  const r = sim / sheet;
  expect(r, `${what}: sim ${sim.toFixed(3)} vs sheet ${sheet.toFixed(3)}`).toBeGreaterThan(1 - tol);
  expect(r, `${what}: sim ${sim.toFixed(3)} vs sheet ${sheet.toFixed(3)}`).toBeLessThan(1 + tol);
};

describe('the sheet plays the rotation the sim plays', () => {
  it('a main skill on a cooldown: the weapon fills the gaps, and its damage is on the sheet as a line of its own', () => {
    const b = build(['rimeCore']);
    const sim = inSim(b, 'boss');
    const sheet = onSheet(b, 'boss');
    near(sim.uses.rimeCore, sheet.uses.rimeCore, 0.08, 'Rime Core uses');
    near(sim.uses.defaultAttack, sheet.uses.defaultAttack, 0.08, 'weapon uses');
    near(sim.dps, sheet.dps, 0.1, 'DPS');
  });

  it('a second main skill stands in while the first waits, before the weapon does', () => {
    // (A cold skill beside Rime Core would hit harder in the sim, which exposes the target to cold: docs/SHEET-AUDIT.md.)
    const b = build(['rimeCore', 'flameBolt']);
    const sim = inSim(b, 'boss');
    const sheet = onSheet(b, 'boss');
    expect(sheet.uses.defaultAttack ?? 0).toBeLessThan(0.02);
    near(sim.uses.rimeCore, sheet.uses.rimeCore, 0.08, 'Rime Core uses');
    near(sim.uses.flameBolt, sheet.uses.flameBolt, 0.08, 'Flame Bolt uses');
    near(sim.dps, sheet.dps, 0.2, 'DPS');
  });

  it('two main skills for different fights: each fight has its own rotation', () => {
    const b = build(['frostLance', 'flameBolt'], {
      0: { role: 'main', when: 'pack' },
      1: { role: 'main', when: 'single' },
    });
    for (const fight of ['pack', 'boss'] as const) {
      const sim = inSim(b, fight);
      const sheet = onSheet(b, fight);
      const used = fight === 'pack' ? 'frostLance' : 'flameBolt';
      const other = fight === 'pack' ? 'flameBolt' : 'frostLance';
      expect(sheet.uses[other] ?? 0, `${fight}: the other main skill is not used`).toBe(0);
      near(sim.uses[used], sheet.uses[used], 0.08, `${fight}: ${used} uses`);
      near(sim.dps, sheet.dps, 0.1, `${fight}: DPS`);
    }
  });

  it('periodic skills on cooldowns beside a main skill: uses and damage', () => {
    const b = build(['frostLance', 'rimeCore', 'flameBolt']);
    const sim = inSim(b, 'boss');
    const sheet = onSheet(b, 'boss');
    near(sim.uses.rimeCore, sheet.uses.rimeCore, 0.08, 'Rime Core uses');
    near(sim.uses.flameBolt, sheet.uses.flameBolt, 0.08, 'Flame Bolt uses');
    near(sim.uses.frostLance, sheet.uses.frostLance, 0.08, 'Frost Lance uses');
    near(sim.dps, sheet.dps, 0.3, 'DPS');
  });

  it('a main skill that is always ready never swings the weapon, so the weapon does not move the figure', () => {
    const sword = build(['frostLance'], {}, 'sword_3');
    const wand = build(['frostLance'], {}, 'wand_3');
    const a = onSheet(sword, 'boss');
    const b = onSheet(wand, 'boss');
    expect(a.uses.defaultAttack ?? 0).toBe(0);
    // A sword and a wand differ in what they add to a spell (nothing, here), not in what the character swings.
    expect(a.dps / b.dps).toBeGreaterThan(0.8);
    expect(a.dps / b.dps).toBeLessThan(1.25);
  });

  it('a ballista totem: the totems shoot while the character swings its weapon', () => {
    const b = buildFor(['scatterBow'], 'bow_3', 'strider');
    const sim = inSim(b, 'boss');
    const sheetC = new Character(b, { targetDistance: DIST, areaLevel: b.level });
    const target = { def: dummyDefence(), shock: 0, resShift: [0, 0, 0, 0, 0] };
    const plan = sheetC.plan(sheetC.configConds, 'boss');
    near(sim.uses.scatterBow, plan.acts[sheetC.primary.key], 0.1, 'totems put down');
    near(sim.uses.defaultBowAttack, plan.weapon, 0.1, 'weapon uses');
    // (A little under what the sim shows: the scattered arrows of one shot are not all counted. Tracked in docs/SHEET-AUDIT.md.)
    near(sim.dps, scenarioDps(sheetC.sheet(sheetC.configConds, 'boss', target)), 0.2, 'DPS');
  });
});
