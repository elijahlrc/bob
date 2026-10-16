import { describe, expect, it } from 'vitest';
import { buildMonster, type MonsterSpec } from '../calc/monster';
import { Rng } from '../core/rng';
import { MONSTER_MODS } from '../data/monsters';
import { themeDef } from '../data/themes';
import { generateLabyrinth } from '../gen/labyrinth';
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
    const normal = buildMonster(spec()).defence.maxLife;
    const rare = buildMonster(spec({ rarity: 'rare' })).defence.maxLife;
    expect(rare).toBeGreaterThan(normal);
    expect(buildMonster(spec({ rarity: 'boss' })).defence.maxLife).toBeGreaterThan(rare);
    expect(
      buildMonster(spec({ rarity: 'rare', mods: ['fortified'] })).defence.maxLife,
    ).toBeGreaterThan(rare);
  });

  it('elemental variants convert damage and resist their element', () => {
    const plain = buildMonster(spec());
    const m = buildMonster(spec({ variant: 'fire' }));
    const chunks = m.profile(0).hands[0].chunks;
    const fire = chunks.filter((c) => c.type === 3).reduce((s, c) => s + c.min, 0);
    expect(fire).toBeGreaterThan(0);
    expect(m.defence.res[3]).toBeGreaterThan(plain.defence.res[3]);
  });

  it('monster mods change stats', () => {
    const plain = buildMonster(spec({ rarity: 'magic' }));
    const hasted = buildMonster(spec({ rarity: 'magic', mods: ['hasted'] }));
    expect(hasted.moveSpeed).toBeGreaterThan(plain.moveSpeed);
    expect(
      buildMonster(spec({ rarity: 'magic', mods: ['armoured'] })).defence.armour,
    ).toBeGreaterThan(plain.defence.armour);
    expect(
      buildMonster(spec({ rarity: 'magic', mods: ['unshakable'] })).defence.cannotBeStunned,
    ).toBe(true);
    expect(
      buildMonster(spec({ rarity: 'magic', mods: ['prismatic'] })).defence.res[1],
    ).toBeGreaterThan(plain.defence.res[1]);
    expect(
      buildMonster(spec({ rarity: 'magic', mods: ['vampiric'] })).profile(0).leechLife[0],
    ).toBeGreaterThan(0);
    expect(
      buildMonster(spec({ rarity: 'magic', mods: ['regenerating'] })).defence.lifeRegen,
    ).toBeGreaterThan(0);
    const stormBound = buildMonster(spec({ rarity: 'magic', mods: ['stormBound'] })).profile(0)
      .hands[0].chunks;
    expect(stormBound.some((c) => c.type === 1)).toBe(true);
  });

  it('magic monsters only roll magic-allowed mods; no duplicates', () => {
    const rng = new Rng(1);
    const magicOk = new Set(MONSTER_MODS.filter((m) => m.magic).map((m) => m.id));
    for (let i = 0; i < 500; i++) {
      const mm = rollMonsterMods(rng, 'magic');
      expect(mm.length).toBeGreaterThanOrEqual(1);
      for (const id of mm) expect(magicOk.has(id)).toBe(true);
      const r = rollMonsterMods(rng, 'rare');
      expect(new Set(r).size).toBe(r.length);
    }
  });
});

describe('population (§10.3)', () => {
  it('fills rooms with packs; the end room follows the schedule', () => {
    const rng = new Rng(3);
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
    }
  });

  it('has more magic and rare packs deeper in the run', () => {
    const share = (map: number) => {
      let rare = 0;
      let magic = 0;
      let all = 0;
      for (let s = 0; s < 120; s++) {
        const lab = generateLabyrinth(new Rng(s), { rooms: 6, sideBranches: 1 });
        const pop = populate(new Rng(s + 1000), lab, {
          areaLevel: map,
          endKind: 'rare',
          theme: themeDef('ashenCrypt'),
          map,
        });
        const end = lab.mainPath[lab.mainPath.length - 1];
        const packs = new Map<number, string[]>();
        for (const m of pop.monsters)
          if (m.room !== end) packs.set(m.pack, [...(packs.get(m.pack) ?? []), m.spec.rarity]);
        for (const p of packs.values()) {
          all++;
          if (p.includes('rare')) rare++;
          else if (p.includes('magic')) magic++;
        }
      }
      return { rare: rare / all, magic: magic / all };
    };
    const early = share(1);
    const late = share(90);
    expect(late.rare).toBeGreaterThan(early.rare * 2);
    expect(late.magic).toBeGreaterThan(early.magic);
  });

  it('themes bias elements and types', () => {
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
    world.sides[0].opts.freeResources = true;
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
  });

  it('Rime Aura chills the player nearby', () => {
    const w = arena();
    const m = spawnMonster(
      w,
      spec({ rarity: 'rare', mods: ['rimeAura'] }),
      w.sides[0].player.x + 2,
      w.sides[0].player.y,
      0,
      9,
      'rime',
    );
    m.state = 'chase';
    m.dummy = true;
    stepWorld(w);
    expect(w.sides[0].player.ail.chill).toBeGreaterThan(0);
  });
});
