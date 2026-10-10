import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { CHARGE_SECONDS, noCharges } from '../calc/charges';
import type { MonsterSpec } from '../calc/monster';
import { Rng } from '../core/rng';
import { hexEffect, HEX_SECONDS } from '../data/hexes';
import { MONSTER_TYPES, type MonsterModId, type MonsterTypeId } from '../data/monsters';
import { themeDef, themesFor } from '../data/themes';
import type { Build } from '../data/types';
import { uniqueDef } from '../data/uniques';
import { makeGem, makeItem } from '../gen/items';
import { rollUnique } from '../gen/loot';
import { generateLabyrinth } from '../gen/labyrinth';
import { populate, rollMonsterMods } from '../gen/population';
import { mod } from '../mods/types';
import { newRun, planFor, setMap } from '../run/run';
import { gainCharge, tickCharges } from './charges';
import { applyDamage, killActor } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { hexPlayer } from './factions';
import { applyHex } from './hexes';
import { runMap } from './runMap';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

let n = 9000;
const uid = () => n++;

function buildOf(
  gems: string[],
  tweak: (b: Build) => void = () => undefined,
  main = 'mace2_3',
): Build {
  const run = newRun('vanguard', 1);
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, main, 40, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  tweak(b);
  return b;
}

/** A world with a passive player (stunned for good) to watch the monsters on their own. */
function arena(build: Build = buildOf(['crushingBlow'])): World {
  const { world } = createDummyWorld(build, { distance: 30 });
  world.player.stunT = 1e9;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId, over: Partial<MonsterSpec> = {}): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 30,
  mods: [],
  ...over,
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0, over: Partial<MonsterSpec> = {}) {
  const m = spawnMonster(w, spec(type, over), w.player.x + dx, w.player.y + dy, 0, 0, type);
  m.state = 'chase';
  return m;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

const withMod =
  (...mods: ReturnType<typeof mod>[]) =>
  (b: Build) =>
    b.equipment.body!.implicits.push(...mods);

describe('charges in the sim (EXPANSION 5.6)', () => {
  it('gain up to the maximum, refresh together, and expire together after ten seconds', () => {
    const w = arena(buildOf(['crushingBlow'], withMod(mod('chargeOn.kill.fervour', 'base', 100))));
    // The sim starts with none, whatever the sheet assumes.
    expect(w.char.charges).toEqual(noCharges());
    const speedBefore = w.player.def.moveSpeed;
    gainCharge(w, 'fervour');
    gainCharge(w, 'fervour');
    expect(w.char.charges.fervour).toBe(2);
    expect(w.player.def.moveSpeed).toBeCloseTo(speedBefore, 6); // no movement speed from Fervour (3.9)
    run(w, 5);
    gainCharge(w, 'fervour');
    gainCharge(w, 'fervour');
    expect(w.char.charges.fervour).toBe(3);
    // Gaining refreshed the timer of all three.
    run(w, CHARGE_SECONDS - 1);
    expect(w.char.charges.fervour).toBe(3);
    run(w, 1.5);
    expect(w.char.charges.fervour).toBe(0);
    expect(w.player.def.moveSpeed).toBeCloseTo(speedBefore, 6);
  });

  it('the effect follows the count: Grit raises resistances and physical reduction', () => {
    const w = arena(buildOf(['crushingBlow'], withMod(mod('chargeOn.block.grit', 'base', 100))));
    const res0 = w.player.def.res[3];
    gainCharge(w, 'grit');
    gainCharge(w, 'grit');
    expect(w.player.def.res[3] - res0).toBeCloseTo(8, 6);
    expect(w.player.def.physReduction).toBeGreaterThanOrEqual(0.08 - 1e-9);
  });

  it('kills roll their chance (Fervent Stride) and the world keeps one character per count', () => {
    const b = buildOf(['crushingBlow'], (x) => {
      x.equipment.boots = rollUnique(new Rng(1), uid, uniqueDef('ferventStride'), 40);
    });
    const w = arena(b);
    for (let i = 0; i < 30; i++) killActor(w, put(w, 'warrior', 8 + i * 0.1));
    expect(w.char.charges.fervour).toBeGreaterThan(0);
    const built = w.chars.size;
    tickCharges(w, 0.01);
    expect(w.chars.size).toBe(built);
  });

  it('charges survive a level up with their counts', () => {
    const w = arena(buildOf(['crushingBlow'], withMod(mod('chargeOn.kill.insight', 'base', 100))));
    gainCharge(w, 'insight');
    w.xp = 1e9;
    stepWorld(w);
    expect(w.build.level).toBeGreaterThan(40);
    expect(w.char.charges.insight).toBe(1);
  });
});

describe('hexes in the sim (EXPANSION 5.7)', () => {
  it('last as long as their gem says (six seconds from a monster) and are renewed by their source', () => {
    const w = arena();
    const m = put(w, 'warrior', 8);
    applyHex(w, m, 'openWounds', 25, 1, 1, HEX_SECONDS);
    expect(m.hexVuln).toBeCloseTo(0.25, 6);
    run(w, HEX_SECONDS - 1);
    applyHex(w, m, 'openWounds', 25, 1, 1, HEX_SECONDS);
    run(w, HEX_SECONDS - 1);
    expect(m.hexes).toHaveLength(1);
    run(w, 1.5);
    expect(m.hexes).toHaveLength(0);
    expect(m.hexVuln).toBe(0);
  });

  it('an enemy holds only as many hexes as the limit; the one with least time left goes', () => {
    const w = arena();
    const m = put(w, 'warrior', 8);
    applyHex(w, m, 'feebleGrip', 20, 2);
    run(w, 1);
    applyHex(w, m, 'openWounds', 20, 2);
    applyHex(w, m, 'leadenLimbs', 20, 2);
    expect(m.hexes.map((h) => h.id).sort()).toEqual(['leadenLimbs', 'openWounds']);
  });

  it('Open Wounds raises physical damage taken, Brittle Doom the elemental', () => {
    const w = arena();
    const a = put(w, 'warrior', 8);
    const b = put(w, 'warrior', 9);
    applyHex(w, b, 'openWounds', 50, 1);
    const before = [a.life, b.life];
    applyDamage(w, a, [100, 0, 0, 0, 0]);
    applyDamage(w, b, [100, 0, 0, 0, 0]);
    const lostA = before[0] - a.life;
    const lostB = before[1] - b.life;
    expect(lostB / lostA).toBeCloseTo(1, 6); // applyDamage is raw: the hex acts in the hit code
    const raw = (x: Actor) => (w.opts.godMode, x.hexVuln);
    expect(raw(b)).toBeCloseTo(0.5, 6);
    const c = put(w, 'warrior', 10);
    applyHex(w, c, 'brittleDoom', 30, 1);
    expect(c.hexRes.slice(1, 4)).toEqual([30, 30, 30]);
  });

  it('Leaden Limbs slows movement and actions; Feeble Grip lowers damage dealt', () => {
    const w = arena();
    const m = put(w, 'warrior', 8);
    applyHex(w, m, 'leadenLimbs', 20, 1);
    expect(m.hexSpeed).toBeCloseTo(0.8, 6);
    const g = put(w, 'warrior', 9);
    applyHex(w, g, 'feebleGrip', 20, 1);
    expect(g.hexDmg).toBeCloseTo(0.8, 6);
  });

  it('a Hex-warded monster cannot be hexed', () => {
    const w = arena();
    const m = put(w, 'warrior', 8, 0, { rarity: 'magic', mods: ['hexWarded'] });
    applyHex(w, m, 'feebleGrip', 20, 1);
    expect(m.hexes).toHaveLength(0);
  });

  it('a monster hex on the player is one at a time, scales with level and with curse resistance', () => {
    const w = arena();
    hexPlayer(w, 'feebleGrip');
    hexPlayer(w, 'openWounds');
    expect(w.player.hexes).toHaveLength(1);
    expect(w.player.hexes[0].id).toBe('openWounds');
    const lvl = Math.min(20, Math.floor(w.plan.areaLevel / 5) + 1);
    expect(w.player.hexes[0].effect).toBeCloseTo(hexEffect('openWounds', lvl), 6);
    const ward = arena(
      buildOf(['crushingBlow'], (b) => {
        b.equipment.ring1 = rollUnique(new Rng(1), uid, uniqueDef('pickpocketsLament'), 40);
      }),
    );
    hexPlayer(ward, 'openWounds');
    expect(ward.player.hexes[0].effect).toBeCloseTo(hexEffect('openWounds', lvl) * 0.5, 6);
  });

  it('a hit by a character with Hexing Strikes hexes the enemy', () => {
    const b = buildOf(['crushingBlow', 'hexingStrikes', 'openWounds']);
    const { world, dummy } = createDummyWorld(b, { distance: 1.6, maxTime: 30 });
    run(world, 5);
    expect(dummy.hexes.map((h) => h.id)).toEqual(['openWounds']);
    expect(dummy.hexVuln).toBeGreaterThan(0.19);
  });

  it('convergence: Open Wounds on the training dummy is within 3% of the calc', () => {
    const b = buildOf(['crushingBlow', 'hexingStrikes', 'openWounds']);
    const c = new Character(b, { targetDistance: 1.6 });
    const ht = c.hexTarget();
    const calc = c.skillSheet(c.primary, {
      def: dummyDefence(),
      shock: 0,
      resShift: ht.resShift,
      vuln: ht.vuln,
    }).hitDps;
    let dmg = 0;
    let time = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const { world } = createDummyWorld(b, { distance: 1.6, maxTime: 600, seed });
      while (world.status === 'running') {
        stepWorld(world);
        for (const e of world.events)
          if (e.t === 'hit' && e.src === world.player.id) dmg += e.amount;
      }
      time += world.t;
    }
    const ratio = dmg / time / calc;
    expect(ratio, `sim ${(dmg / time).toFixed(2)} vs calc ${calc.toFixed(2)}`).toBeGreaterThan(
      0.97,
    );
    expect(ratio, `sim ${(dmg / time).toFixed(2)} vs calc ${calc.toFixed(2)}`).toBeLessThan(1.03);
  });
});

describe('the Ashen Choir (EXPANSION 7.3)', () => {
  it('has five types, is offered from map 15, and its mini-boss is the Precentor', () => {
    const types = Object.values(MONSTER_TYPES).filter((t) => t.faction === 'choir');
    expect(types.map((t) => t.id).sort()).toEqual([
      'bell',
      'censer',
      'choirmaster',
      'flagellant',
      'hexer',
    ]);
    expect(themesFor(14).some((t) => t.id === 'ashenNave')).toBe(false);
    expect(themesFor(15).some((t) => t.id === 'ashenNave')).toBe(true);
    const lab = generateLabyrinth(new Rng(4), { rooms: 6, sideBranches: 1 });
    const pop = populate(new Rng(9), lab, {
      areaLevel: 30,
      endKind: 'miniboss',
      theme: themeDef('ashenNave'),
      map: 30,
    });
    const chief = pop.monsters.find((m) => m.spec.rarity === 'miniboss')!;
    expect(chief.name).toBe('The Precentor');
    expect(chief.spec.mods).toContain('precentor');
  });

  it('a Censer-bearer speeds allies within five tiles and makes them hit harder', () => {
    const w = arena();
    put(w, 'censer', 10);
    const near = put(w, 'warrior', 12);
    const far = put(w, 'warrior', 20);
    run(w, 0.3);
    expect(near.buffT).toBeGreaterThan(0);
    expect(far.buffT).toBeLessThanOrEqual(0);
  });

  it('a Flagellant gains Fervour whenever an ally within six tiles dies, up to five', () => {
    const w = arena();
    const f = put(w, 'flagellant', 10);
    for (let i = 0; i < 7; i++) killActor(w, put(w, 'warrior', 12 + i * 0.1));
    expect(f.fervour).toBe(5);
    const far = put(w, 'flagellant', 25);
    killActor(w, put(w, 'warrior', 12));
    expect(far.fervour).toBe(0);
    run(w, 10.5);
    expect(f.fervour).toBe(0);
  });

  it('a Choirmaster heals allies by a fifth after a one second channel, and a stun interrupts it', () => {
    const w = arena();
    const cm = put(w, 'choirmaster', 10);
    const ally = put(w, 'warrior', 12);
    ally.life = ally.def.maxLife * 0.3;
    cm.skillT = 0;
    run(w, 0.2);
    expect(cm.channelT).toBeGreaterThan(0);
    run(w, 1.2);
    expect(ally.life).toBeCloseTo(ally.def.maxLife * 0.5, 1);
    // Interrupted by a stun.
    const w2 = arena();
    const cm2 = put(w2, 'choirmaster', 10);
    const ally2 = put(w2, 'warrior', 12);
    ally2.life = ally2.def.maxLife * 0.3;
    cm2.skillT = 0;
    run(w2, 0.2);
    cm2.stunT = 2;
    run(w2, 1.5);
    expect(ally2.life).toBeCloseTo(ally2.def.maxLife * 0.3, 3);
  });

  it('a Hexer draws a sigil that hexes the player standing in it, and the Zealous mod spurs allies when it dies', () => {
    const w = arena();
    const h = put(w, 'hexer', 8);
    h.skillT = 0;
    // The sigil (docs/ENCOUNTERS.md 7) bites after half a second's grace; the character here cannot step out.
    run(w, 1);
    expect(w.player.hexes).toHaveLength(1);
    const z = put(w, 'warrior', 10, 0, { rarity: 'magic', mods: ['zealous'] });
    const ally = put(w, 'warrior', 12);
    killActor(w, z);
    expect(ally.zealT).toBeGreaterThan(5);
  });

  it('a Hexcaller hexes the player when it hits, with a four second cooldown', () => {
    const w = arena();
    w.player.stunT = 0;
    w.player.def.maxLife = 1e9;
    const m = put(w, 'warrior', 1, 0, { rarity: 'rare', mods: ['hexcaller'] });
    let hexes = 0;
    for (let i = 0; i < 60 * 6; i++) {
      stepWorld(w);
      w.player.life = 1e9;
      hexes += w.events.filter((e) => e.t === 'hex' && e.id === w.player.id).length;
    }
    expect(hexes).toBeGreaterThanOrEqual(1);
    expect(hexes).toBeLessThanOrEqual(3);
    expect(m.hexCd).toBeDefined();
  });

  it('the Precentor cycles the four hexes and calls a Choirmaster at half life', () => {
    const w = arena();
    const p = put(w, 'hexer', 10, 0, { rarity: 'miniboss', mods: ['precentor'] });
    p.raiserT = 0;
    const seen = new Set<string>();
    for (let i = 0; i < 60 * 22; i++) {
      stepWorld(w);
      for (const h of w.player.hexes) seen.add(h.id);
    }
    expect(seen.size).toBe(4);
    p.life = p.def.maxLife * 0.49;
    run(w, 0.2);
    expect(w.actors.some((a) => a.alive && a.mon?.spec.type === 'choirmaster')).toBe(true);
  });

  it('the hex mods roll from map 25 and the Choir mod only on the Choir', () => {
    const rng = new Rng(8);
    let warded = 0;
    for (let i = 0; i < 400; i++) {
      const mods: MonsterModId[] = rollMonsterMods(rng, 'rare', 60, 'ossuary');
      if (mods.includes('zealous')) throw new Error('Zealous on the Ossuary');
      if (mods.includes('hexWarded') || mods.includes('hexcaller')) warded++;
      expect(rollMonsterMods(rng, 'rare', 20, 'choir')).not.toContain('hexcaller');
    }
    expect(warded).toBeGreaterThan(10);
  });

  it('the Ashen Nave runs the same way twice (determinism)', () => {
    const r = newRun('vanguard', 77);
    setMap(r, 30);
    r.build.level = 30;
    const go = () => runMap(planFor(r, 'ashenNave'), r.build, 0, { godMode: true, maxTime: 150 });
    const a = go();
    const b = go();
    expect(a.eventHash).toBe(b.eventHash);
  });
});

describe('The Trophy Cord (EXPANSION 6.4)', () => {
  it('a rare kill gives its mods for twenty seconds, in player versions', () => {
    const b = buildOf(['crushingBlow'], (x) => {
      x.equipment.belt = rollUnique(new Rng(1), uid, uniqueDef('trophyCord'), 40);
    });
    const w = arena(b);
    const armourBefore = w.player.def.armour;
    const m = put(w, 'warrior', 8, 0, { rarity: 'rare', mods: ['armoured', 'raiser'] });
    killActor(w, m);
    expect(w.player.def.armour).toBeGreaterThanOrEqual(armourBefore * 1.99);
    run(w, 19);
    expect(w.player.def.armour).toBeGreaterThanOrEqual(armourBefore * 1.99);
    run(w, 2);
    expect(w.player.def.armour).toBeCloseTo(armourBefore, 6);
  });

  it('does nothing without the belt, and for non-rare kills', () => {
    const w = arena();
    const armourBefore = w.player.def.armour;
    killActor(w, put(w, 'warrior', 8, 0, { rarity: 'rare', mods: ['armoured'] }));
    expect(w.player.def.armour).toBe(armourBefore);
    const belt = arena(
      buildOf(['crushingBlow'], (x) => {
        x.equipment.belt = rollUnique(new Rng(1), uid, uniqueDef('trophyCord'), 40);
      }),
    );
    const a0 = belt.player.def.armour;
    killActor(belt, put(belt, 'warrior', 8, 0, { rarity: 'magic', mods: ['armoured'] }));
    expect(belt.player.def.armour).toBe(a0);
  });
});

describe('the Bone Warden (docs/ENEMIES.md 4.2, rule 6)', () => {
  it('every Ossuary theme ends on it, and it is a warrior', () => {
    for (const id of [
      'ashenCrypt',
      'rimedCatacomb',
      'thunderVault',
      'bonePits',
      'archersGallery',
    ]) {
      const lab = generateLabyrinth(new Rng(4), { rooms: 6, sideBranches: 1 });
      const pop = populate(new Rng(9), lab, {
        areaLevel: 20,
        endKind: 'miniboss',
        theme: themeDef(id),
        map: 20,
      });
      const chief = pop.monsters.find((m) => m.spec.rarity === 'miniboss')!;
      expect(chief.name, id).toBe('The Bone Warden');
      expect(chief.spec.type).toBe('warrior');
      expect(chief.spec.mods).toContain('boneWarden');
    }
  });

  it('raises a ring of four Warriors at two thirds and again at one third of its life, no more', () => {
    const w = arena();
    const warden = put(w, 'warrior', 12, 0, { rarity: 'miniboss', mods: ['boneWarden'] });
    const warriors = () =>
      w.actors.filter(
        (a) => a.alive && a.mon?.spec.type === 'warrior' && a.summonedBy === warden.id,
      );
    run(w, 0.2);
    expect(warriors()).toHaveLength(0);
    warden.life = warden.def.maxLife * 0.6;
    run(w, 0.2);
    expect(warriors()).toHaveLength(4);
    warden.life = warden.def.maxLife * 0.5;
    run(w, 0.2);
    expect(warriors()).toHaveLength(4);
    warden.life = warden.def.maxLife * 0.3;
    run(w, 0.2);
    expect(warriors()).toHaveLength(8);
    warden.life = warden.def.maxLife * 0.05;
    run(w, 0.2);
    expect(warriors()).toHaveLength(8);
    expect(warriors().every((a) => a.noReward)).toBe(true);
  });
});
