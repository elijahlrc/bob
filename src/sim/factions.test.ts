import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { Rng } from '../core/rng';
import { FACTION_NAMES, factionOfSpec, MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { themeDef, themesFor } from '../data/themes';
import { makeGem, makeItem } from '../gen/items';
import { generateLabyrinth } from '../gen/labyrinth';
import { populate, rollMonsterMods, rollType, typeShares } from '../gen/population';
import { newRun, planFor, rollThemes } from '../run/run';
import { applyDamage, killActor } from './combat';
import { createDummyWorld } from './dummy';
import {
  bloaterBurst,
  CORPSE_LIFE,
  HAG_RAISE_INTERVAL,
  isZone,
  registerBlast,
  shieldBlocks,
  SHAMBLER_RISE_TIME,
} from './factions';
import type { Actor, World } from './types';
import { runMap } from './runMap';
import { spawnMonster, stepWorld } from './world';

/** A world with a passive player (stunned for good) and no dummy interference, to watch monsters on their own. */
function arena(): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 40, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 30 });
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

describe('the factions (EXPANSION 7.3)', () => {
  it('every type belongs to a faction and has a body', () => {
    for (const id of Object.keys(MONSTER_TYPES) as MonsterTypeId[]) {
      const t = MONSTER_TYPES[id];
      expect(Object.keys(FACTION_NAMES)).toContain(t.faction);
      expect(t.body.length).toBeGreaterThan(2);
    }
    expect(factionOfSpec({ type: 'shambler' })).toBe('rot');
    expect(factionOfSpec({ type: 'wisp' })).toBe('hollow');
    expect(factionOfSpec({ type: 'shieldbearer' })).toBe('ossuary');
  });

  it('the new themes arrive on their maps and spawn their own faction', () => {
    expect(themesFor(7).some((t) => t.id === 'charnelPits')).toBe(false);
    expect(themesFor(8).some((t) => t.id === 'charnelPits')).toBe(true);
    expect(themesFor(14).some((t) => t.id === 'hollowVigil')).toBe(false);
    expect(themesFor(15).some((t) => t.id === 'hollowVigil')).toBe(true);
    for (const map of [1, 5, 10, 20, 40])
      for (const id of rollThemes(3, map)) expect((themeDef(id).fromMap ?? 1) <= map).toBe(true);
    const shares = typeShares(themeDef('charnelPits'));
    expect(shares.reduce((a, [, s]) => a + s, 0)).toBeCloseTo(1, 9);
    const rot = shares
      .filter(([id]) => MONSTER_TYPES[id].faction === 'rot')
      .reduce((a, [, s]) => a + s, 0);
    expect(rot).toBeCloseTo(0.7, 9);
    const rng = new Rng(5);
    let rotCount = 0;
    for (let i = 0; i < 2000; i++)
      if (MONSTER_TYPES[rollType(rng, themeDef('charnelPits'))].faction === 'rot') rotCount++;
    expect(rotCount / 2000).toBeGreaterThan(0.64);
    expect(rotCount / 2000).toBeLessThan(0.76);
  });

  it('Hollow monsters take half the physical damage and cannot bleed; the Ossuary is unchanged', () => {
    const ghost = spawnMonster(arena(), spec('gloomstalker'), 5, 5, 0, 0, 'g');
    const bones = spawnMonster(arena(), spec('warrior'), 5, 5, 0, 0, 'b');
    expect(ghost.def.physReduction).toBeCloseTo(0.5, 6);
    expect(bones.def.physReduction).toBeCloseTo(0, 6);
    expect(MONSTER_TYPES.gloomstalker.faction).toBe('hollow');
  });

  it('a Shambler: corpse, then it rises once at half life, and not again', () => {
    const w = arena();
    const m = put(w, 'shambler', 8);
    killActor(w, m);
    expect(w.corpses).toHaveLength(1);
    run(w, SHAMBLER_RISE_TIME - 0.5);
    expect(w.corpses).toHaveLength(1);
    expect(
      w.actors.filter((a) => a.alive && !a.isPlayer && a.mon?.spec.type === 'shambler'),
    ).toHaveLength(0);
    run(w, 1);
    const risen = w.actors.filter((a) => a.alive && !a.isPlayer && a.mon?.spec.type === 'shambler');
    expect(risen).toHaveLength(1);
    expect(risen[0].risen).toBe(true);
    expect(risen[0].noReward).toBe(true);
    expect(risen[0].life).toBeLessThanOrEqual(risen[0].def.maxLife * 0.5 + 1);
    killActor(w, risen[0]);
    expect(w.corpses).toHaveLength(0);
  });

  it('corpses crumble after ten seconds', () => {
    const w = arena();
    const m = put(w, 'warrior', 8);
    killActor(w, m);
    expect(w.corpses).toHaveLength(1);
    run(w, CORPSE_LIFE - 0.5);
    expect(w.corpses).toHaveLength(1);
    run(w, 1);
    expect(w.corpses).toHaveLength(0);
  });

  it('no corpse if the monster was frozen, ignited, or caught in an explosion', () => {
    const w = arena();
    const frozen = put(w, 'warrior', 8);
    frozen.ail.freezeT = 2;
    killActor(w, frozen);
    const burning = put(w, 'warrior', 9);
    burning.ail.ignites.push({ dps: 10, t: 2 });
    killActor(w, burning);
    expect(w.corpses).toHaveLength(0);
    const blown = put(w, 'warrior', 10);
    registerBlast(w, blown.x, blown.y, 2);
    killActor(w, blown);
    expect(w.corpses).toHaveLength(0);
    // An explosion within a second also destroys a corpse that is already there.
    const late = put(w, 'warrior', 25);
    killActor(w, late);
    expect(w.corpses).toHaveLength(1);
    registerBlast(w, late.x, late.y, 2);
    expect(w.corpses).toHaveLength(0);
  });

  it('a Bloater bursts on contact into a caustic cloud that hurts for four seconds', () => {
    const w = arena();
    const m = put(w, 'bloater', 1.4);
    run(w, 0.5);
    expect(m.alive).toBe(false);
    expect(m.noReward).toBe(true);
    const zones = w.effects.filter(isZone);
    expect(zones).toHaveLength(1);
    expect(zones[0].kind).toBe('caustic');
    expect(zones[0].radius).toBe(2);
    expect(zones[0].dtype).toBe(4);
    // The player stands inside it: pulses of chaos damage land (the arena refills life each tick).
    let pulses = 0;
    for (let k = 0; k < 60; k++) {
      stepWorld(w);
      pulses += w.events.filter(
        (e) => e.t === 'hit' && e.dst === w.player.id && e.dtype === 4,
      ).length;
    }
    expect(pulses).toBeGreaterThanOrEqual(3);
    run(w, 4);
    expect(w.effects.filter(isZone)).toHaveLength(0);
  });

  it('a Bloater killed from afar also leaves its cloud', () => {
    const w = arena();
    const m = put(w, 'bloater', 8);
    applyDamage(w, m, [m.def.maxLife * 2, 0, 0, 0, 0]);
    expect(w.effects.filter(isZone)).toHaveLength(1);
  });

  it('a Putrid monster leaves a cloud; a Festering one poisons', () => {
    const w = arena();
    const m = put(w, 'shambler', 8, 0, { rarity: 'magic', mods: ['putrid'] });
    killActor(w, m);
    expect(w.effects.filter(isZone)).toHaveLength(1);
    const f = spawnMonster(
      w,
      spec('shambler', { rarity: 'magic', mods: ['festering'] }),
      5,
      5,
      0,
      0,
      'f',
    );
    expect(f.mon!.profile(0).poison.chance).toBeGreaterThan(0.25);
  });

  it('a Carrion Hag raises up to three corpses every eight seconds', () => {
    const w = arena();
    for (let i = 0; i < 5; i++) killActor(w, put(w, 'warrior', 4 + i * 0.1, i * 0.3 - 0.6));
    expect(w.corpses).toHaveLength(5);
    const hag = put(w, 'hag', 6);
    hag.skillT = 0;
    run(w, 0.1);
    const raised = w.actors.filter((a) => a.alive && a.risen);
    expect(raised).toHaveLength(3);
    expect(raised.every((a) => a.noReward)).toBe(true);
    expect(w.corpses).toHaveLength(2);
    run(w, HAG_RAISE_INTERVAL + 0.5);
    expect(w.actors.filter((a) => a.alive && a.risen).length).toBeGreaterThanOrEqual(5);
  });

  it('a Gloomstalker blinks next to the player after a short telegraph', () => {
    const w = arena();
    const m = put(w, 'gloomstalker', 9);
    m.skillT = 0;
    const events: string[] = [];
    let landed: { x: number; y: number } | null = null;
    for (let i = 0; i < 90 && !landed; i++) {
      stepWorld(w);
      for (const e of w.events)
        if (e.t === 'blink') {
          events.push(e.end ? 'land' : 'start');
          if (e.end) landed = { x: e.x, y: e.y };
        }
    }
    expect(events).toEqual(['start', 'land']);
    expect(Math.hypot(landed!.x - w.player.x, landed!.y - w.player.y)).toBeLessThan(2);
  });

  it('a Mana Wisp drains mana on hit and in its death nova', () => {
    const w = arena();
    w.player.stunT = 0;
    const p = w.player;
    p.def.maxMana = 100;
    p.mana = 100;
    const m = put(w, 'wisp', 1);
    expect(m.mon!.profile(0).manaDrain).toBeCloseTo(8, 6);
    p.stunT = 1e9;
    killActor(w, m);
    expect(p.mana).toBeCloseTo(80, 6);
  });

  it('a Lantern Wight shields allies within six tiles while it lives', () => {
    const w = arena();
    const wight = put(w, 'wight', 10);
    const near = put(w, 'warrior', 12);
    const far = put(w, 'warrior', 20);
    run(w, 0.2);
    expect(near.es).toBeCloseTo(near.def.maxLife * 0.3, 3);
    expect(far.es).toBe(0);
    expect(wight.es).toBe(0);
    killActor(w, wight);
    expect(near.es).toBe(0);
  });

  it('a Shieldbearer blocks projectiles from the front, and lowers the shield to swing', () => {
    const w = arena();
    const sb = put(w, 'shieldbearer', 6);
    // From the player side (the front), and from behind.
    expect(shieldBlocks(w, sb, sb.x - 0.4, sb.y)).toBe(true);
    expect(shieldBlocks(w, sb, sb.x + 0.4, sb.y)).toBe(false);
    expect(shieldBlocks(w, sb, sb.x, sb.y + 0.4)).toBe(false);
    sb.action = { which: 'monster' } as Actor['action'];
    expect(shieldBlocks(w, sb, sb.x - 0.4, sb.y)).toBe(false);
    sb.action = null;
    sb.stunT = 1;
    expect(shieldBlocks(w, sb, sb.x - 0.4, sb.y)).toBe(false);
  });

  it('bursting a Bloater by hand gives no experience or loot', () => {
    const w = arena();
    const m = put(w, 'bloater', 1);
    const kills = w.stats.kills;
    bloaterBurst(w, m);
    expect(w.stats.kills).toBe(kills);
  });

  it('the Carrion Mother raises every corpse in her room, and bursts into four pools at half life', () => {
    const w = arena();
    const mother = put(w, 'shambler', 10, 0, { rarity: 'miniboss', mods: ['carrionMother'] });
    for (let k = 0; k < 4; k++) killActor(w, put(w, 'warrior', 4 + k * 0.2, k * 0.2));
    expect(w.corpses).toHaveLength(4);
    mother.raiserT = 0;
    run(w, 0.1);
    expect(
      w.actors.filter((a) => a.alive && a.risen && a.mon!.spec.type === 'warrior'),
    ).toHaveLength(4);
    expect(w.corpses).toHaveLength(0);
    expect(w.effects.filter(isZone)).toHaveLength(0);
    mother.life = mother.def.maxLife * 0.49;
    run(w, 0.1);
    expect(w.effects.filter(isZone)).toHaveLength(4);
  });

  it('the Unremembered phases out for two seconds after each fifth of its life, then appears behind you', () => {
    const w = arena();
    const m = put(w, 'gloomstalker', 8, 0, { rarity: 'miniboss', mods: ['unremembered'] });
    run(w, 0.1);
    expect(m.phaseT).toBe(0);
    m.life = m.def.maxLife * 0.79;
    run(w, 0.1);
    expect(m.phaseT).toBeGreaterThan(1.5);
    // Immune while it phases, and not a target.
    const before = m.life;
    applyDamage(w, m, [1000, 0, 0, 0, 0]);
    expect(m.life).toBe(before);
    run(w, 2.2);
    expect(m.phaseT).toBeLessThanOrEqual(0);
    expect(Math.hypot(m.x - w.player.x, m.y - w.player.y)).toBeLessThan(2.5);
    applyDamage(w, m, [10, 0, 0, 0, 0]);
    expect(m.life).toBeLessThan(before);
  });

  it('champions lead the mini-boss of their own theme and are never rolled', () => {
    for (const [theme, mod, type, name] of [
      ['charnelPits', 'carrionMother', 'shambler', 'The Carrion Mother'],
      ['hollowVigil', 'unremembered', 'gloomstalker', 'The Unremembered'],
    ] as const) {
      const lab = generateLabyrinth(new Rng(4), { rooms: 6, sideBranches: 1 });
      const pop = populate(new Rng(9), lab, {
        areaLevel: 30,
        endKind: 'miniboss',
        theme: themeDef(theme),
        map: 30,
      });
      const champ = pop.monsters.find((m) => m.spec.rarity === 'miniboss')!;
      expect(champ.spec.mods).toContain(mod);
      expect(champ.spec.type).toBe(type);
      expect(champ.name).toBe(name);
    }
    const rng = new Rng(2);
    for (let k = 0; k < 500; k++)
      for (const rarity of ['magic', 'rare', 'miniboss'] as const)
        expect(
          rollMonsterMods(rng, rarity, 80, 'rot').some(
            (id) => id === 'carrionMother' || id === 'unremembered',
          ),
        ).toBe(false);
  });

  it('faction mods roll only on their own faction', () => {
    const rng = new Rng(3);
    let rot = 0;
    for (let k = 0; k < 600; k++) {
      if (
        rollMonsterMods(rng, 'rare', 60, 'ossuary').some(
          (id) => id === 'festering' || id === 'putrid',
        )
      )
        throw new Error('Rot mod on the Ossuary');
      if (
        rollMonsterMods(rng, 'rare', 60, 'rot').some((id) => id === 'festering' || id === 'putrid')
      )
        rot++;
    }
    expect(rot).toBeGreaterThan(20);
  });

  for (const theme of ['charnelPits', 'hollowVigil']) {
    it(`a ${theme} map runs the same way twice (determinism)`, () => {
      const r = newRun('vanguard', 77);
      r.map = 25;
      r.build.level = 30;
      const go = () => runMap(planFor(r, theme), r.build, 0, { godMode: true, maxTime: 150 });
      const a = go();
      const b = go();
      expect(a.eventHash).toBe(b.eventHash);
      expect(a.ticks).toBe(b.ticks);
    });
  }
});
