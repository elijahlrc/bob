import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { blockChance } from '../calc/combat';
import { flaskSpec } from '../calc/flasks';
import { BLOCK_STAGGER } from '../data/constants';
import type { Build } from '../data/types';
import { Rng } from '../core/rng';
import { makeGem, makeItem } from '../gen/items';
import { rollFlask } from '../gen/loot';
import { ModDB } from '../mods/modDb';
import { mod, type Mod } from '../mods/types';
import { newRun } from '../run/run';
import { applyHit } from './combat';
import { createDummyWorld } from './dummy';
import { stepWorld } from './world';

/** A melee build whose body armour carries the given mods. */
function buildWith(extra: Mod[]): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  const weapon = makeItem(uid, 'mace2_3', 40, 1);
  weapon.sockets = [makeGem(uid, 'crushingBlow')];
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, 1, 'unique');
  body.uniqueMods = extra;
  b.equipment.body = body;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const blocked = {
  outcome: 'block' as const,
  crit: false,
  dmg: [0, 0, 0, 0, 0],
  total: 0,
  H: [0, 0, 0, 0, 0],
  ailments: { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 },
  stun: 0,
};

describe('block, in the engine', () => {
  it('a block staggers the character, for less time with faster recovery, and not again at once', () => {
    const slow = createDummyWorld(buildWith([]), { distance: 2 });
    const p = slow.world.sides[0].player;
    expect(p.def.blockStagger).toBeCloseTo(BLOCK_STAGGER);
    const prof = slow.world.sides[0].char.profile(slow.world.sides[0].char.primary);
    applyHit(slow.world, slow.dummy, p, prof, blocked);
    expect(p.stunT).toBeCloseTo(BLOCK_STAGGER);
    expect(p.action).toBeNull();
    p.stunT = 0.1;
    applyHit(slow.world, slow.dummy, p, prof, blocked);
    expect(p.stunT).toBeCloseTo(0.1); // still staggered: not lengthened

    const quick = createDummyWorld(buildWith([mod('stunBlockRecovery', 'base', 100)]), {
      distance: 2,
    });
    expect(quick.world.sides[0].player.def.blockStagger).toBeCloseTo(BLOCK_STAGGER / 2);
    expect(quick.world.sides[0].player.def.stunDurOnSelf).toBeCloseTo(0.5);
    const blockOnly = createDummyWorld(buildWith([mod('blockRecovery', 'base', 100)]), {
      distance: 2,
    });
    expect(blockOnly.world.sides[0].player.def.blockStagger).toBeCloseTo(BLOCK_STAGGER / 2);
    expect(blockOnly.world.sides[0].player.def.stunDurOnSelf).toBeCloseTo(1);
  });

  it('a character that cannot be stunned is not staggered by a block', () => {
    const { world, dummy } = createDummyWorld(buildWith([mod('cannotBeStunned', 'flag', 1)]), {
      distance: 2,
    });
    const p = world.sides[0].player;
    applyHit(world, dummy, p, world.sides[0].char.profile(world.sides[0].char.primary), blocked);
    expect(p.def.blockStagger).toBe(0);
    expect(p.stunT).toBe(0);
  });

  it('life and mana are gained when you block', () => {
    const { world, dummy } = createDummyWorld(
      buildWith([mod('lifeOnBlock', 'base', 30), mod('manaOnBlock', 'base', 12)]),
      { distance: 2 },
    );
    const p = world.sides[0].player;
    p.life = p.def.maxLife * 0.5;
    p.mana = 0;
    expect(p.def.lifeOnBlock).toBe(30);
    applyHit(world, dummy, p, world.sides[0].char.profile(world.sides[0].char.primary), blocked);
    expect(p.life).toBeCloseTo(p.def.maxLife * 0.5 + 30);
    expect(p.mana).toBeCloseTo(12);
  });

  it('energy shield regenerates apart from its recharge', () => {
    const { world } = createDummyWorld(
      buildWith([mod('es', 'base', 400), mod('esRegenPct', 'base', 10)]),
      { distance: 2 },
    );
    const p = world.sides[0].player;
    expect(p.def.esRegen).toBeCloseTo(p.def.maxEs * 0.1);
    p.es = 0;
    p.since.damaged = 0; // the recharge has not started
    for (let i = 0; i < 30; i++) stepWorld(world);
    expect(p.es).toBeGreaterThan(p.def.maxEs * 0.02);
    expect(p.es).toBeLessThan(p.def.maxEs * 0.1);
  });

  it('projectile block counts against projectile attacks only, up to the cap', () => {
    const c = new Character(
      buildWith([mod('blockAttack', 'base', 30), mod('blockProjectile', 'base', 12)]),
      {
        areaLevel: 40,
      },
    );
    const def = c.defence();
    const prof = (kind: string, isAttack = true) =>
      ({ isAttack, enemyBlockLess: 0, skill: { behaviour: { kind } } }) as never;
    const melee = blockChance(prof('melee'), def);
    expect(blockChance(prof('projectile'), def)).toBeCloseTo(melee + 0.12);
    expect(blockChance(prof('projectile', false), def)).toBeCloseTo(def.blockSpell);
    const capped = new Character(
      buildWith([mod('blockAttack', 'base', 70), mod('blockProjectile', 'base', 30)]),
      { areaLevel: 40 },
    ).defence();
    expect(blockChance(prof('projectile'), capped)).toBeCloseTo(capped.blockCap);
  });

  it('reduced flask charges used lowers what a flask costs', () => {
    const f = rollFlask(new Rng(4), () => 1, 30);
    const plain = flaskSpec(f, new ModDB([]));
    const thrifty = flaskSpec(f, new ModDB([mod('flaskChargesUsed', 'base', 20)]));
    expect(thrifty.perUse).toBeCloseTo(plain.perUse * 0.8);
  });
});
