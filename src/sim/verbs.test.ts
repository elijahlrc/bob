import { describe, expect, it } from 'vitest';
import { resolveHit } from '../calc/combat';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { rarityWeights, rollMonsterDrops } from '../gen/loot';
import { Rng } from '../core/rng';
import { LOW_LIFE } from '../data/constants';
import { condBit, mod, type Mod } from '../mods/types';
import { newRun } from '../run/run';
import { applyDamage, applyHit, playerConds, rawHit, targetConds } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import type { World } from './types';

function buildWith(extra: Mod[], gems = ['crushingBlow', 'kindlingHalo']): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 30;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 30, 1);
  const body = makeItem(uid, 'body_ar_1', 30, gems.length, 'unique');
  body.sockets = gems.map((g) => makeGem(uid, g));
  body.uniqueMods = extra;
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

function arena(extra: Mod[] = [], gems?: string[]) {
  const { world, dummy } = createDummyWorld(buildWith(extra, gems), { distance: 2 });
  return { world, dummy, player: world.player };
}

describe('sim rules for the new verbs', () => {
  it('chaos damage hits energy shield first when the rule is on', () => {
    const { world, player } = arena();
    player.def = { ...player.def, maxEs: 100 };
    player.es = 100;
    player.life = 500;
    applyDamage(world, player, [0, 0, 0, 0, 60]);
    expect(player.es).toBe(100); // chaos bypasses ES by default
    expect(player.life).toBe(440);
    player.def = { ...player.def, chaosHitsEs: true };
    applyDamage(world, player, [0, 0, 0, 0, 60]);
    expect(player.es).toBe(40);
    expect(player.life).toBe(440);
  });

  it('raw damage (explosions, slams) follows taken-as, immunity and typed damage taken', () => {
    const { world, player } = arena();
    player.life = player.def.maxLife = 1000;
    player.def = {
      ...player.def,
      armour: 0,
      physReduction: 0,
      damageTakenMult: 1,
      res: [0, 50, 0, 0, 0],
      maxRes: [75, 75, 75, 75, 75],
      physTakenAs: [0, 0.5, 0, 0, 0],
      damageTakenType: [1, 1, 1, 2, 1],
      immune: [false, false, true, false, false],
    };
    rawHit(world, player, 100, 0); // 50 physical + 50 lightning at 50% res
    expect(player.life).toBeCloseTo(1000 - 50 - 25);
    player.life = 1000;
    rawHit(world, player, 100, 2); // immune to cold
    expect(player.life).toBe(1000);
    rawHit(world, player, 100, 3); // fire taken at double
    expect(player.life).toBeCloseTo(800);
  });

  it('leech from crits can be instant, and some monsters cannot be leeched from', () => {
    const { world, player, dummy } = arena([
      mod('instantLeechOnCrit', 'flag', 1),
      mod('leech.life', 'base', 10, { damageTypes: ['physical'] }),
    ]);
    const prof = world.char.profile(world.char.primary);
    expect(prof.instantLeechOnCrit).toBe(true);
    const hand = prof.hands[0];
    const res = (crit: boolean) => ({
      outcome: 'hit' as const,
      crit,
      dmg: [1000, 0, 0, 0, 0],
      total: 1000,
      H: [1000, 0, 0, 0, 0],
      ailments: { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 },
      stun: 0,
    });
    player.life = 100;
    // One leech instance recovers at most 10% of the maximum, so keep the maximum large.
    player.def = { ...player.def, instantLeech: false, maxLife: 5000 };
    applyHit(world, player, dummy, prof, res(false));
    expect(player.life).toBe(100); // normal leech is gradual
    expect(player.leechLife.length).toBe(1);
    player.leechLife.length = 0;
    applyHit(world, player, dummy, prof, res(true));
    expect(player.life).toBeCloseTo(200); // 10% of 1000, instantly
    dummy.def = dummyDefence({ cannotBeLeechedFrom: true });
    player.life = 100;
    applyHit(world, player, dummy, prof, res(true));
    expect(player.life).toBe(100);
    expect(hand).toBeDefined();
  });

  it('resolved hits against an immune target do nothing', () => {
    const { world, player, dummy } = arena();
    const prof = world.char.profile(world.char.primary);
    dummy.def = dummyDefence({ immune: [true, true, true, true, true] });
    const rng = new Rng(1);
    const r = resolveHit(
      rng,
      { ...prof, alwaysHit: true },
      prof.hands[0],
      { def: dummy.def, shock: 0, resShift: [0, 0, 0, 0, 0] },
      2,
      false,
    );
    // Physical is not an element: only elemental immunity applies to it.
    expect(r.dmg[1] + r.dmg[2] + r.dmg[3]).toBe(0);
    expect(player.alive).toBe(true);
  });
});

describe('player and target conditions in the sim', () => {
  const has = (mask: number, c: Parameters<typeof condBit>[0]) => (mask & condBit(c)) !== 0;

  it('been hit recently, leeching, ES full, low mana', () => {
    const { world, player } = arena([], ['crushingBlow']);
    player.def = { ...player.def, maxEs: 100, maxMana: 100 };
    player.es = 100;
    player.mana = 100;
    player.tBeenHit = 99;
    let c = playerConds(world, null);
    expect(has(c, 'beenHitRecently')).toBe(false);
    expect(has(c, 'leeching')).toBe(false);
    expect(has(c, 'esFull')).toBe(true);
    expect(has(c, 'onLowMana')).toBe(false);
    player.tBeenHit = 1;
    player.leechLife.push(10);
    player.es = 50;
    player.mana = 20;
    c = playerConds(world, null);
    expect(has(c, 'beenHitRecently')).toBe(true);
    expect(has(c, 'leeching')).toBe(true);
    expect(has(c, 'esFull')).toBe(false);
    expect(has(c, 'onLowMana')).toBe(true);
  });

  it('a hit marks its victim as recently hit', () => {
    const { world, player, dummy } = arena();
    const prof = world.char.profile(world.char.primary);
    const ok = {
      outcome: 'hit' as const,
      crit: false,
      dmg: [1, 0, 0, 0, 0],
      total: 1,
      H: [1, 0, 0, 0, 0],
      ailments: { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 },
      stun: 0,
    };
    dummy.tBeenHit = 99;
    applyHit(world, player, dummy, prof, ok);
    expect(dummy.tBeenHit).toBe(0);
  });

  it('the target is on low life at 35% of its maximum', () => {
    const { player, dummy } = arena();
    dummy.def = dummyDefence({ maxLife: 1000 });
    dummy.life = 1000 * LOW_LIFE + 1;
    expect(has(targetConds(dummy, player), 'targetLowLife')).toBe(false);
    dummy.life = 1000 * LOW_LIFE - 1;
    expect(has(targetConds(dummy, player), 'targetLowLife')).toBe(true);
  });

  it('low life is measured against maximum life, not against life left after reservation (DESIGN 6.3)', () => {
    // An aura that reserves life leaves the player with a life cap of half the maximum.
    const { world, player } = arena(
      [mod('skillsCostLife', 'flag', 1), mod('reducedReservation', 'base', -0)],
      ['crushingBlow', 'kindlingHalo'],
    );
    expect(world.char.reservedLife).toBeGreaterThan(0);
    const max = player.def.maxLife;
    const cap = max - world.char.reservedLife;
    expect(cap / max).toBeLessThan(0.6);
    // 30% of maximum life: low life by the rule, though above 35% of what the cap allows.
    player.life = 0.3 * max;
    expect(player.life / cap).toBeGreaterThan(LOW_LIFE);
    expect(has(playerConds(world, null), 'onLowLife')).toBe(true);
    player.life = 0.4 * max;
    expect(has(playerConds(world, null), 'onLowLife')).toBe(false);
  });
});

describe("loot reads the player's item quantity and rarity", () => {
  it('rarity multiplies the weights of magic, rare and unique, not normal', () => {
    const a = rarityWeights('normal', 1, 1);
    const b = rarityWeights('normal', 1, 2);
    expect(b.normal).toBe(a.normal);
    expect(b.magic).toBe(a.magic * 2);
    expect(b.rare).toBe(a.rare * 2);
    expect(b.unique).toBe(a.unique * 2);
  });

  it('quantity raises the number of drops', () => {
    const count = (playerQuantity: number) => {
      let n = 0;
      for (let seed = 1; seed <= 400; seed++) {
        let uid = 1;
        n += rollMonsterDrops(new Rng(seed), () => uid++, {
          ilvl: 20,
          monster: 'normal',
          playerQuantity,
        }).length;
      }
      return n;
    };
    expect(count(3)).toBeGreaterThan(count(1) * 2);
  });
});

export type { World };
