import { describe, expect, it } from 'vitest';
import { attackHitChance, mitigate, NO_SHIFT } from '../calc/combat';
import { buildMonster, type MonsterSpec } from '../calc/monster';
import { Rng } from '../core/rng';
import { MOD_MARKS } from '../data/monsterMarks';
import { MONSTER_MODS, type MonsterModId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { rollMonsterMods } from '../gen/population';
import { newRun } from '../run/run';
import { applyHit, killActor } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster } from './world';

const COUNTERPLAY: MonsterModId[] = [
  'bloodless',
  'unyielding',
  'deflecting',
  'spellwarded',
  'fireWarded',
  'frostWarded',
  'stormWarded',
  'bulwarked',
  'keenEyed',
  'sundering',
  'siphoning',
  'rotTouched',
  'shrouded',
  'splitting',
  'thorned',
];

const spec = (mods: MonsterModId[], over: Partial<MonsterSpec> = {}): MonsterSpec => ({
  type: 'warrior',
  variant: 'none',
  rarity: 'rare',
  level: 60,
  mods,
  ...over,
});

const ok = (amount = 100) => ({
  outcome: 'hit' as const,
  crit: false,
  dmg: [amount, 0, 0, 0, 0],
  total: amount,
  H: [amount, 0, 0, 0, 0],
  ailments: { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 },
  stun: 0,
});

/** A mace-wielding player and a monster with the given mods right next to them. */
function arena(mods: MonsterModId[]): { world: World; mon: Actor; player: Actor } {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 60;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 60, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 20 });
  const mon = spawnMonster(world, spec(mods), world.player.x + 1, world.player.y, 0, 0, 'Test');
  return { world, mon, player: world.player };
}

describe('counterplay monster mods (EXPANSION 7.2)', () => {
  it('there are fifteen, each with a mark and a plain description', () => {
    for (const id of COUNTERPLAY) {
      expect(
        MONSTER_MODS.some((m) => m.id === id),
        id,
      ).toBe(true);
      expect(MOD_MARKS[id].desc.length, id).toBeGreaterThan(10);
    }
  });

  it('Bloodless, Unyielding and the warded mods set their defence flags', () => {
    expect(buildMonster(spec(['bloodless'])).defence.cannotBeLeechedFrom).toBe(true);
    expect(buildMonster(spec([])).defence.cannotBeLeechedFrom).toBe(false);
    expect(buildMonster(spec(['unyielding'])).defence.immuneAilments).toBe(true);
    const warded = (id: MonsterModId) => buildMonster(spec([id])).defence.immune;
    expect(warded('fireWarded')).toEqual([false, false, false, true, false]);
    expect(warded('frostWarded')).toEqual([false, false, true, false, false]);
    expect(warded('stormWarded')).toEqual([false, true, false, false, false]);
  });

  it('Deflecting and Spellwarded change what hits and spells do to it', () => {
    const d = buildMonster(spec(['deflecting'])).defence;
    expect(d.evadeProj).toBeCloseTo(0.5);
    expect(buildMonster(spec(['spellwarded'])).defence.blockSpell).toBeCloseTo(0.4);
    // A projectile attack against a Deflecting monster hits less often.
    const { world } = arena([]);
    const prof = {
      ...world.char.profile(world.char.primary),
      alwaysHit: false,
      isAttack: true,
      skill: {
        ...world.char.primary.skill,
        behaviour: { kind: 'projectile', count: 1, spread: 0 },
      },
    } as never;
    const hand = world.char.profile(world.char.primary).hands[0];
    const plain = buildMonster(spec([])).defence;
    expect(attackHitChance(prof, hand, d)).toBeLessThan(attackHitChance(prof, hand, plain));
  });

  it('Bulwarked takes less physical damage', () => {
    expect(buildMonster(spec(['bulwarked'])).defence.physReduction).toBeCloseTo(0.3);
  });

  it('Keen-eyed hits cannot be evaded; Sundering hits ignore half the armour', () => {
    const keen = buildMonster(spec(['keenEyed'])).profile(0);
    expect(keen.alwaysHit).toBe(true);
    const sund = buildMonster(spec(['sundering'])).profile(0);
    expect(sund.armourIgnore).toBeCloseTo(0.5);
    const plain = buildMonster(spec([])).profile(0);
    const target = { def: dummyDefence({ armour: 5000 }), shock: 0, resShift: [...NO_SHIFT] };
    const a = mitigate(plain, target, [1000, 0, 0, 0, 0])[0];
    const b = mitigate(sund, target, [1000, 0, 0, 0, 0])[0];
    expect(b).toBeGreaterThan(a);
  });

  it('Rot-touched adds chaos damage', () => {
    const p = buildMonster(spec(['rotTouched'])).profile(0);
    expect(p.hands[0].chunks.some((c) => c.type === 4)).toBe(true);
    expect(
      buildMonster(spec([]))
        .profile(0)
        .hands[0].chunks.some((c) => c.type === 4),
    ).toBe(false);
  });

  it('Shrouded has an energy shield worth a quarter of its life', () => {
    const m = buildMonster(spec(['shrouded']));
    expect(m.defence.maxEs).toBe(Math.round(m.defence.maxLife * 0.25));
    expect(buildMonster(spec([])).defence.maxEs).toBe(0);
  });

  it("Siphoning hits drain the player's mana", () => {
    const { world, mon, player } = arena(['siphoning']);
    player.def = { ...player.def, maxMana: 200 };
    player.mana = 100;
    const prof = mon.mon!.profile(0);
    applyHit(world, mon, player, prof, ok(1));
    expect(player.mana).toBeCloseTo(100 - 200 * 0.05);
  });

  it('Thorned reflects part of a melee hit, but not a ranged one', () => {
    const { world, mon, player } = arena(['thorned']);
    player.life = player.def.maxLife = 100000;
    player.def = { ...player.def, armour: 0, physReduction: 0, damageTakenMult: 1 };
    const melee = world.char.profile(world.char.primary);
    expect(melee.skill.behaviour.kind).toBe('melee');
    applyHit(world, player, mon, melee, ok(1000));
    expect(player.life).toBeLessThan(100000);
    expect(100000 - player.life).toBeGreaterThan(50);
    const before = player.life;
    const ranged = {
      ...melee,
      skill: { ...melee.skill, behaviour: { kind: 'projectile' } },
    } as never;
    applyHit(world, player, mon, ranged, ok(1000));
    expect(player.life).toBe(before);
  });

  it('Splitting leaves two weaker copies that give nothing and do not split', () => {
    const { world, mon } = arena(['splitting']);
    const before = world.actors.length;
    killActor(world, mon);
    const copies = world.actors.slice(before);
    expect(copies).toHaveLength(2);
    for (const c of copies) {
      expect(c.noReward).toBe(true);
      expect(c.modIds).toEqual([]);
      expect(c.rarity).toBe('normal');
      expect(c.mon!.defence.maxLife).toBeLessThan(mon.mon!.defence.maxLife);
    }
    const kills = world.stats.kills;
    killActor(world, copies[0]);
    expect(world.actors.length).toBe(before + 2); // no further split
    expect(world.stats.kills).toBe(kills);
  });
});

describe('rolling the counterplay mods', () => {
  const rolled = (rarity: 'magic' | 'rare' | 'miniboss', level: number) => {
    const seen = new Set<string>();
    const rng = new Rng(11);
    for (let i = 0; i < 400; i++)
      for (const id of rollMonsterMods(rng, rarity, level)) seen.add(id);
    return seen;
  };

  it('none roll before map 15', () => {
    const seen = rolled('rare', 14);
    for (const id of COUNTERPLAY) expect(seen.has(id), id).toBe(false);
    expect(rolled('magic', 14).size).toBeGreaterThan(0);
  });

  it('the warded mods wait for map 30 and Thorned for map 40', () => {
    const at = (level: number) => rolled('rare', level);
    for (const id of ['fireWarded', 'frostWarded', 'stormWarded'])
      expect(at(29).has(id), id).toBe(false);
    for (const id of ['fireWarded', 'frostWarded', 'stormWarded'])
      expect(at(30).has(id), id).toBe(true);
    expect(at(39).has('thorned')).toBe(false);
    expect(at(40).has('thorned')).toBe(true);
  });

  it('magic monsters roll only the mods that allow it', () => {
    const seen = rolled('magic', 90);
    for (const id of ['unyielding', 'sundering', 'splitting', 'thorned', 'fireWarded'])
      expect(seen.has(id), id).toBe(false);
    for (const id of ['bloodless', 'deflecting', 'spellwarded', 'siphoning', 'shrouded'])
      expect(seen.has(id), id).toBe(true);
  });

  it('every mark is distinct by colour and shape', () => {
    const seen = new Set<string>();
    for (const m of MONSTER_MODS) {
      const k = `${MOD_MARKS[m.id].color}/${MOD_MARKS[m.id].shape}`;
      expect(seen.has(k), m.id).toBe(false);
      seen.add(k);
    }
  });
});
