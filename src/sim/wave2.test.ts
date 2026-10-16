import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { expectedIgnites } from '../calc/combat';
import { itemBase } from '../data/bases';
import { GRANTED_GEMS } from '../data/gems';
import { UNIQUE_FLASKS } from '../data/uniqueFlasks';
import { uniqueDef } from '../data/uniques';
import type { Build, EquipSlot, Item } from '../data/types';
import { Rng } from '../core/rng';
import { mod } from '../mods/types';
import { makeGem } from '../gen/items';
import { rollUnique, rollUniqueFlask } from '../gen/loot';
import { scoreBuild } from '../run/bot';
import { canEquip, slotsFor } from '../run/inventory';
import { newRun, setMap } from '../run/run';
import { applyHit, killActor } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { autoFlaskPolicy } from './flaskPolicy';
import { spawnMonster, stepWorld } from './world';

let n = 5000;
const uid = () => n++;

function build(classId: string, uniqueId?: string, setup?: (b: Build) => Item | void): Build {
  const run = newRun(classId, 1);
  const b = run.build;
  b.level = 60;
  if (uniqueId) {
    const it = rollUnique(new Rng(7), uid, uniqueDef(uniqueId), 60);
    const slot: EquipSlot = slotsFor(it)[0];
    b.equipment[slot] = it;
    if (slot === 'mainHand' && itemBase(it.baseId).hands === 2) delete b.equipment.offHand;
  }
  setup?.(b);
  return b;
}
const ch = (b: Build) => new Character(b, { areaLevel: 60 });

const okHit = (amount = 10) => ({
  outcome: 'hit' as const,
  crit: false,
  dmg: [amount, 0, 0, 0, 0],
  total: amount,
  H: [amount, 0, 0, 0, 0],
  ailments: { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 },
  stun: 0,
});

describe('trigger supports and Ember Burst', () => {
  const withSupport = (support: string) =>
    build('mystic', undefined, (b) => {
      b.equipment.body!.sockets = [makeGem(uid, 'frostLance'), makeGem(uid, support)];
      b.equipment.mainHand!.sockets = [makeGem(uid, 'flameBolt')];
      b.primaryGem = b.equipment.mainHand!.sockets[0]!.uid;
    });

  it('Critical Relay casts the linked spell when an attack crits, and the spell deals more damage', () => {
    const c = ch(withSupport('criticalRelay'));
    expect(c.triggers).toHaveLength(1);
    expect(c.triggers[0].def).toMatchObject({ on: 'crit' });
    expect(c.triggers[0].skills.map((s) => s.skill.id)).toEqual(['frostLance']);
    expect(c.primary.skill.id).toBe('flameBolt');
    const plain = ch(
      build('mystic', undefined, (b) => {
        b.equipment.body!.sockets = [makeGem(uid, 'frostLance'), null];
      }),
    );
    const damage = (x: Character, choice = x.actives.find((a) => a.skill.id === 'frostLance')!) =>
      x.profile(choice).hands[0].chunks.reduce((s, k) => s + k.max, 0);
    expect(damage(c)).toBeGreaterThan(damage(plain));
  });

  it('Wounded Retort casts the linked spell after enough damage is taken', () => {
    const b = withSupport('woundedRetort');
    const { world, dummy } = createDummyWorld(b, { distance: 3 });
    world.opts.freeResources = false;
    const p = world.player;
    const max = p.def.maxLife;
    const prof = world.char.profile(world.char.primary);
    let casts = 0;
    for (let i = 0; i < 4; i++) {
      applyHit(world, dummy, p, prof, okHit(max * 0.1));
      casts += world.events.filter((e) => e.t === 'trigger').length;
      world.events.length = 0;
    }
    // 10% + 10% + 10% reaches the threshold on the third hit: one cast, then the cooldown.
    expect(casts).toBe(1);
  });

  it('Ember Burst is item-only: it never drops as a gem and bursts around the target', () => {
    expect(GRANTED_GEMS.map((g) => g.id)).toContain('emberBurst');
    const b = build('vanguard', 'cinderfallAxe');
    const c = ch(b);
    expect(c.triggers[0].skills[0].skill.id).toBe('emberBurst');
    const { world, dummy } = createDummyWorld(b, { distance: 3 });
    const near = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      dummy.x + 0.8,
      dummy.y,
      0,
      0,
      'Near',
    );
    near.def = dummyDefence({ maxLife: 1e9 });
    near.life = 1e9;
    const far = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      dummy.x + 5,
      dummy.y,
      0,
      0,
      'Far',
    );
    far.def = dummyDefence({ maxLife: 1e9 });
    far.life = 1e9;
    world.rngTrig = new Rng(1);
    // The trigger has a 20% chance: land hits until it fires.
    const prof = world.char.profile(world.char.primary);
    let fired = false;
    for (let i = 0; i < 80 && !fired; i++) {
      world.trig.cooldown = {};
      applyHit(world, world.player, dummy, prof, okHit(1));
      fired = world.events.some((e) => e.t === 'trigger');
      if (!fired) world.events.length = 0;
    }
    expect(fired).toBe(true);
    expect(near.life).toBeLessThan(1e9);
    expect(far.life).toBe(1e9);
  });
});

describe('wave 2 uniques', () => {
  it('Thunderknell: needs Intelligence, chains once more, casts a socketed lightning spell on hit', () => {
    const it = rollUnique(new Rng(1), uid, uniqueDef('thunderknell'), 60);
    const run = newRun('vanguard', 1);
    run.build.level = 60;
    expect(canEquip(run, it, 'mainHand').ok).toBe(false);
    const b = build('mystic', 'thunderknell', (x) => {
      x.equipment.mainHand!.sockets = [makeGem(uid, 'arcChain'), null, null];
      x.equipment.body!.sockets = [makeGem(uid, 'flameBolt'), null];
      x.primaryGem = x.equipment.body!.sockets[0]!.uid;
    });
    const c = ch(b);
    expect(c.triggers[0].skills[0].skill.id).toBe('arcChain');
    const arc = c.triggers[0].skills[0];
    const plain = ch(
      build('mystic', undefined, (x) => {
        x.equipment.mainHand!.sockets = [makeGem(uid, 'arcChain')];
      }),
    );
    const plainArc = plain.actives.find((a) => a.skill.id === 'arcChain')!;
    expect(c.profile(arc).chains).toBeGreaterThan(plain.profile(plainArc).chains);
  });

  it('Frostwrit: no physical damage, a cold spell on melee crits, and the spell raises the score', () => {
    const run = newRun('vanguard', 1);
    setMap(run, 40);
    const sword = (b: Build, spell: boolean) => {
      const it = b.equipment.mainHand!;
      it.sockets = [spell ? makeGem(uid, 'frostLance') : null, null, null];
    };
    const withSpell = build('vanguard', 'frostwrit', (b) => sword(b, true));
    const without = build('vanguard', 'frostwrit', (b) => sword(b, false));
    const c = ch(withSpell);
    expect(c.profile(c.primary).hands[0].chunks.every((k) => k.type !== 0)).toBe(true);
    expect(c.sheet().triggered.length).toBe(1);
    expect(scoreBuild(run, withSpell)).toBeGreaterThan(scoreBuild(run, without));
  });

  it('Gravescribe: gem levels that grow with character level', () => {
    const lvl = (level: number) => {
      const bb = build('shade', 'gravescribe', (x) => {
        x.level = level;
        x.equipment.mainHand!.sockets = [makeGem(uid, 'frostLance'), null, null];
      });
      return new Character(bb, {}).gems.find((g) => g.def.id === 'frostLance')!.level;
    };
    // Character levels add gem levels on top of the natural level.
    const naturalAt = (level: number) => {
      const bb = build('shade', undefined, (x) => {
        x.level = level;
        x.equipment.mainHand!.sockets = [makeGem(uid, 'frostLance')];
      });
      return new Character(bb, {}).gems.find((g) => g.def.id === 'frostLance')!.level;
    };
    expect(lvl(50) - naturalAt(50)).toBeGreaterThan(lvl(24) - naturalAt(24));
  });

  it('Stormsplit Jerkin: unaffected by shock, and shocked kills explode', () => {
    const b = build('shade', 'stormsplitJerkin');
    const c = ch(b);
    expect(c.defence().unaffectedByShock).toBe(true);
    const { world, dummy } = createDummyWorld(b, { distance: 2 });
    dummy.def = dummyDefence({ maxLife: 1000 });
    const other = spawnMonster(
      world,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      dummy.x + 1,
      dummy.y,
      0,
      0,
      'Neighbour',
    );
    other.def = dummyDefence({ maxLife: 1000 });
    other.life = 1000;
    dummy.ail.shock = 0.2;
    killActor(world, dummy);
    expect(other.life).toBeLessThan(1000);
    expect(other.ail.shock).toBe(0); // explosions never shock
  });

  it('Twin Pyre Band: two ignites, burning faster, for less damage each', () => {
    const plain = ch(build('mystic'));
    const ring = ch(build('mystic', 'twinPyreBand'));
    const a = plain.profile(plain.primary).ignite;
    const b = ring.profile(ring.primary).ignite;
    expect(b.max).toBeGreaterThan(a.max);
    expect(b.speed).toBeGreaterThan(1);
    expect(b.dur).toBeLessThan(a.dur);
    // Less burning damage, as the ignite sees the hit's damage.
    const k = (c: Character) => c.profile(c.primary).hands[0].ailChunks[0].k[0];
    expect(k(ring)).toBeLessThan(k(plain));
  });

  it('expected ignites: one counts like before, two add up to less than double', () => {
    const one = expectedIgnites(0.3, 6, 1);
    const two = expectedIgnites(0.3, 6, 2);
    expect(two).toBeGreaterThan(one);
    expect(two).toBeLessThan(2 * one);
    expect(expectedIgnites(1, 5, 2)).toBe(2);
    expect(expectedIgnites(0, 5, 2)).toBe(0);
    // With rare ignites two at once almost never happen.
    expect(expectedIgnites(0.01, 2, 2)).toBeCloseTo(expectedIgnites(0.01, 2, 1), 2);
  });

  it('Bloodglass Ward: socketed gems use life and reserve less', () => {
    const setup = (b: Build) => {
      const ward = b.equipment.offHand!;
      ward.sockets = [makeGem(uid, 'kindlingHalo'), null].slice(
        0,
        Math.max(1, ward.sockets.length),
      );
      if (ward.sockets.length === 0) ward.sockets = [makeGem(uid, 'kindlingHalo')];
    };
    const c = ch(build('vanguard', 'bloodglassWard', setup));
    expect(c.reservedLife).toBeGreaterThan(0);
    expect(c.reservedMana).toBe(0);
  });

  it("Pickpocket's Lament: one ring only, gain life and mana per attack hit", () => {
    const b = build('vanguard', 'pickpocketsLament');
    const { world, dummy } = createDummyWorld(b, { distance: 2 });
    const pl = world.player;
    pl.mana = 0;
    pl.life = 1;
    world.events.length = 0;
    applyHit(world, pl, dummy, world.char.profile(world.char.primary), okHit(1));
    expect(pl.mana).toBeGreaterThan(0);
    expect(pl.life).toBeGreaterThan(1);
  });
});

describe("Martyr's Draught", () => {
  const def = UNIQUE_FLASKS.find((u) => u.id === 'martyrsDraught')!;
  const arena = () => {
    const b = build('mystic', undefined, (x) => {
      x.flasks = [rollUniqueFlask(new Rng(1), uid, def, 40), null, null, null, null];
      x.equipment.body!.uniqueMods = [mod('es', 'base', 6000)];
    });
    const { world, dummy } = createDummyWorld(b, { distance: 12 });
    world.opts.freeResources = false;
    return { world, dummy, p: world.player };
  };

  it('its buff stops chaos bypassing energy shield', () => {
    const f = rollUniqueFlask(new Rng(1), uid, def, 40);
    const b = build('mystic', undefined, (x) => {
      x.flasks = [f, null, null, null, null];
    });
    expect(ch(b).defence(0, 1).chaosHitsEs).toBe(true);
    expect(ch(b).defence(0, 0).chaosHitsEs).toBe(false);
  });

  it('on use leaves 1 life and returns the life as energy shield over two seconds', () => {
    const { world, p } = arena();
    p.life = p.def.maxLife;
    p.es = 0;
    const life = p.life;
    world.flasks[0].charges = 100;
    // A fight is coming (an enemy 12 tiles away) and none is close: the policy drinks it.
    expect(autoFlaskPolicy(world)).toEqual([0]);
    stepWorld(world); // the world uses the flask
    expect(world.player.life).toBeLessThan(life * 0.1);
    for (let i = 0; i < 130; i++) stepWorld(world);
    expect(world.player.es).toBeGreaterThan(life * 0.5);
  });

  it('is not drunk while an enemy is close, or at low life', () => {
    const { world, dummy, p } = arena();
    world.flasks[0].charges = 100;
    dummy.x = p.x + 3;
    expect(autoFlaskPolicy(world)).toEqual([]);
    dummy.x = p.x + 10;
    p.life = p.def.maxLife * 0.5;
    expect(autoFlaskPolicy(world)).toEqual([]);
  });
});
