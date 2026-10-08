import { describe, expect, it } from 'vitest';
import { BOSS_ATTACK_TIME, buildMonster, type MonsterSpec } from '../calc/monster';
import { monsterLife } from '../calc/formulas';
import { Rng } from '../core/rng';
import { meanDurability } from '../calc/matrix';
import { profileOf } from '../data/defence';
import { MONSTER_MODS, MONSTER_TYPES } from '../data/monsters';
import { THEMES, themeDef } from '../data/themes';
import { generateLabyrinth } from '../gen/labyrinth';
import { makeMapPlan } from '../gen/mapPlan';
import { populate, rollMonsterMods } from '../gen/population';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import { spawnMonster, stepWorld } from './world';

const spec = (over: Partial<MonsterSpec> = {}): MonsterSpec => ({
  type: 'warrior',
  variant: 'none',
  rarity: 'normal',
  level: 20,
  mods: [],
  ...over,
});

describe('monster stats (§12.1–12.5)', () => {
  it('types and rarities scale life', () => {
    const base = monsterLife(20);
    expect(buildMonster(spec()).defence.maxLife).toBe(base);
    // A type's life multiple is its toughness: with its defences paid for in life (docs/ROSTER.md 6.2).
    const brute = MONSTER_TYPES.brute;
    const paid = meanDurability(profileOf(brute.faction, brute.defence), 20);
    expect(paid).toBeGreaterThan(1);
    expect(buildMonster(spec({ type: 'brute' })).defence.maxLife).toBe(
      Math.round(base * (brute.lifeMult / paid)),
    );
    expect(buildMonster(spec({ rarity: 'rare' })).defence.maxLife).toBe(Math.round(base * 4.5));
    expect(buildMonster(spec({ rarity: 'boss' })).defence.maxLife).toBe(Math.round(base * 30));
    expect(buildMonster(spec({ rarity: 'rare', mods: ['fortified'] })).defence.maxLife).toBe(
      Math.round(base * 4.5) * 2,
    );
  });

  it('elemental variants convert damage and resist their element', () => {
    const m = buildMonster(spec({ variant: 'fire' }));
    const chunks = m.profile(0).hands[0].chunks;
    const fire = chunks.filter((c) => c.type === 3).reduce((s, c) => s + c.min, 0);
    const phys = chunks.filter((c) => c.type === 0).reduce((s, c) => s + c.min, 0);
    expect(fire / (fire + phys)).toBeCloseTo(0.6);
    expect(m.defence.res[3]).toBe(40);
    const mage = buildMonster(spec({ type: 'mage', variant: 'cold' }));
    expect(mage.profile(0).hands[0].chunks.every((c) => c.type === 2)).toBe(true);
  });

  it('monster mods change stats', () => {
    const hasted = buildMonster(spec({ rarity: 'magic', mods: ['hasted'] }));
    expect(hasted.moveSpeed).toBeCloseTo(3 * 1.25);
    expect(buildMonster(spec({ rarity: 'magic', mods: ['armoured'] })).defence.armour).toBe(
      3 * (20 + 10 * 20),
    );
    expect(
      buildMonster(spec({ rarity: 'magic', mods: ['unshakable'] })).defence.cannotBeStunned,
    ).toBe(true);
    expect(buildMonster(spec({ rarity: 'magic', mods: ['prismatic'] })).defence.res[1]).toBe(30);
    expect(
      buildMonster(spec({ rarity: 'magic', mods: ['vampiric'] })).profile(0).leechLife[0],
    ).toBeCloseTo(0.1);
    expect(
      buildMonster(spec({ rarity: 'magic', mods: ['regenerating'] })).defence.lifeRegen,
    ).toBeGreaterThan(0);
    const stormBound = buildMonster(spec({ rarity: 'magic', mods: ['stormBound'] })).profile(0)
      .hands[0].chunks;
    expect(stormBound.some((c) => c.type === 1)).toBe(true);
  });

  it('bosses and mini-bosses have higher stun thresholds; the boss swings every 1.6 s', () => {
    const boss = buildMonster(spec({ rarity: 'boss' }));
    expect(boss.defence.stunThreshold).toBe(boss.defence.maxLife * 4);
    expect(boss.defence.res[3]).toBe(30);
    expect(boss.profile(0).useTime).toBeCloseTo(BOSS_ATTACK_TIME);
    const mini = buildMonster(
      spec({ rarity: 'miniboss', mods: ['hasted', 'armoured', 'elusive', 'prismatic'] }),
    );
    expect(mini.defence.stunThreshold).toBe(mini.defence.maxLife * 2);
  });

  it('magic monsters only roll magic-allowed mods; no duplicates', () => {
    const rng = new Rng(1);
    const magicOk = new Set(MONSTER_MODS.filter((m) => m.magic).map((m) => m.id));
    for (let i = 0; i < 500; i++) {
      const mm = rollMonsterMods(rng, 'magic');
      expect(mm.length).toBeGreaterThanOrEqual(1);
      expect(mm.length).toBeLessThanOrEqual(2);
      for (const id of mm) expect(magicOk.has(id)).toBe(true);
      const r = rollMonsterMods(rng, 'rare');
      expect(new Set(r).size).toBe(r.length);
      expect(r.length).toBeGreaterThanOrEqual(2);
      expect(rollMonsterMods(rng, 'miniboss')).toHaveLength(4);
    }
  });
});

describe('population (§10.3)', () => {
  it('fills rooms with packs; the end room follows the schedule', () => {
    const rng = new Rng(3);
    let normal = 0;
    let magicPacks = 0;
    let rarePacks = 0;
    for (let s = 0; s < 200; s++) {
      const lab = generateLabyrinth(new Rng(s), { rooms: 6, sideBranches: 1 });
      const pop = populate(rng, lab, {
        areaLevel: 30,
        endKind: 'rare',
        theme: themeDef('ashenCrypt'),
        map: 30,
      });
      const end = lab.mainPath[lab.mainPath.length - 1];
      expect(pop.monsters.some((m) => m.room === end && m.spec.rarity === 'rare')).toBe(true);
      const startRoom = lab.mainPath[0];
      expect(pop.monsters.some((m) => m.room === startRoom)).toBe(false);
      const packs = new Map<number, string[]>();
      for (const m of pop.monsters)
        if (m.room !== end) packs.set(m.pack, [...(packs.get(m.pack) ?? []), m.spec.rarity]);
      for (const p of packs.values()) {
        if (p.includes('rare')) rarePacks++;
        else if (p.includes('magic')) magicPacks++;
        else normal++;
      }
    }
    const total = normal + magicPacks + rarePacks;
    expect(normal / total).toBeCloseTo(0.7, 1);
    expect(magicPacks / total).toBeCloseTo(0.22, 1);
    expect(rarePacks / total).toBeCloseTo(0.08, 1);
  });

  it('mini-bosses every 10th map, the unique boss on map 100', () => {
    expect(
      makeMapPlan(1, 10, 'ashenCrypt').pop.monsters.some((m) => m.spec.rarity === 'miniboss'),
    ).toBe(true);
    const p100 = makeMapPlan(1, 100, 'ashenCrypt');
    expect(p100.pop.monsters.filter((m) => m.spec.rarity === 'boss')).toHaveLength(1);
    expect(p100.pop.monsters.find((m) => m.spec.rarity === 'boss')!.name).toBe(
      'the Ossuary Regent',
    );
  });

  it('themes bias elements and types', () => {
    for (const t of THEMES) expect(t.name.length).toBeGreaterThan(0);
    const rng = new Rng(4);
    let cold = 0;
    let total = 0;
    for (let s = 0; s < 50; s++) {
      const lab = generateLabyrinth(new Rng(s), { rooms: 6, sideBranches: 0 });
      for (const m of populate(rng, lab, {
        areaLevel: 20,
        endKind: 'rare',
        theme: themeDef('rimedCatacomb'),
        map: 20,
      }).monsters) {
        total++;
        if (m.spec.variant === 'cold') cold++;
      }
    }
    // Cold weight ×3: 45 / (55 + 15 + 45 + 15) ≈ 35% (mages are never "none").
    expect(cold / total).toBeGreaterThan(0.28);
  });
});

describe('monster behaviours in the sim (§12.5, §12.7)', () => {
  function arena() {
    const run = newRun('vanguard', 5);
    run.build.level = 30;
    const { world } = createDummyWorld(run.build, { distance: 25 });
    world.opts.freeResources = true;
    return world;
  }

  it('Volatile monsters explode on death after a telegraph', () => {
    const w = arena();
    const m = spawnMonster(w, spec({ rarity: 'magic', mods: ['volatile'] }), 10, 15.5, 0, 9, 'v');
    m.life = 0;
    m.def = { ...m.def };
    // Kill it through the normal path.
    m.life = 1;
    m.alive = true;
    m.ail.poisons = [{ dps: 1e6, t: 1 }];
    stepWorld(w);
    expect(m.alive).toBe(false);
    expect(w.effects.some((e) => e.kind === 'volatile')).toBe(true);
  });

  it('Raisers summon warriors (cap 6) that give no reward', () => {
    const w = arena();
    const r = spawnMonster(w, spec({ rarity: 'rare', mods: ['raiser'] }), 12, 15.5, 0, 9, 'raiser');
    r.state = 'chase';
    r.dummy = true;
    for (let i = 0; i < 60 * 40; i++) stepWorld(w);
    const summons = w.actors.filter((a) => a.summonedBy === r.id);
    expect(summons.length).toBeGreaterThan(0);
    expect(summons.every((s) => s.noReward)).toBe(true);
    expect(summons.filter((s) => s.alive).length).toBeLessThanOrEqual(6);
  });

  it('Rime Aura chills the player nearby', () => {
    const w = arena();
    const m = spawnMonster(
      w,
      spec({ rarity: 'rare', mods: ['rimeAura'] }),
      w.player.x + 2,
      w.player.y,
      0,
      9,
      'rime',
    );
    m.state = 'chase';
    m.dummy = true;
    stepWorld(w);
    expect(w.player.ail.chill).toBeCloseTo(0.15);
  });

  it('the Ossuary Regent slams and raises the dead at 75/50/25% life', () => {
    const w = arena();
    const boss = spawnMonster(
      w,
      spec({ rarity: 'boss', level: 30 }),
      w.player.x + 6,
      w.player.y,
      0,
      9,
      'the Ossuary Regent',
    );
    boss.state = 'chase';
    boss.dummy = true;
    for (let i = 0; i < 60 * 8; i++) stepWorld(w);
    expect(
      w.effects.some((e) => e.kind === 'slam') || w.events.some((e) => e.t === 'explode'),
    ).toBe(true);
    boss.life = boss.def.maxLife * 0.49;
    stepWorld(w);
    expect(w.actors.filter((a) => a.summonedBy === boss.id)).toHaveLength(8);
  });
});
