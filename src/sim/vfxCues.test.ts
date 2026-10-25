import { describe, expect, it } from 'vitest';
import type { FlaskSpec } from '../calc/flasks';
import { resolveHit } from '../calc/combat';
import { Rng } from '../core/rng';
import { targetState } from './combat';
import { mineBonus } from './deploy';
import type { Side } from './side';
import type { TriggerDef } from '../data/triggers';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { galleryEntries, galleryRun, galleryWorld } from '../run/gallery';
import { newRun } from '../run/run';
import { createDummyWorld, dummyDefence } from './dummy';
import { buildFor as kitBuild, classFor } from './gemKit';
import { noteRecover, RECOVER_GAP, RECOVER_SHARE, tickRecover } from './recovery';
import type { Actor, SimEvent, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** The events a skill emits in the training arena over a few seconds. */
function eventsOf(id: string, seconds = 8): SimEvent[] {
  const entry = galleryEntries().find((e) => e.id === id)!;
  const w = galleryWorld(galleryRun(entry, 1), entry);
  const out: SimEvent[] = [];
  for (let i = 0; i < seconds * 60 && w.status === 'running'; i++) {
    stepWorld(w);
    out.push(...w.events);
  }
  return out;
}

/** A melee build whose body armour carries the given triggers and spells. */
function buildFor(triggers: TriggerDef[], spells: string[] = ['arcChain']): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  const weapon = makeItem(uid, 'mace2_3', 40, 1);
  weapon.sockets = [makeGem(uid, 'crushingBlow')];
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, Math.max(1, spells.length), 'unique');
  body.sockets = spells.map((g) => makeGem(uid, g));
  body.uniqueTriggers = triggers;
  b.equipment.body = body;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

/** The events of a dummy world over some seconds, the character starting at a share of its life. */
function dummyEvents(build: Build, seconds: number, lifeShare = 1): { w: World; out: SimEvent[] } {
  const { world } = createDummyWorld(build, { distance: 1.6, maxTime: seconds, seed: 1 });
  const p = world.sides[0].player;
  // (A dummy world refills the character each tick unless told not to.)
  world.sides[0].opts.freeResources = false;
  p.life = p.def.maxLife * lifeShare;
  const out: SimEvent[] = [];
  while (world.status === 'running') {
    stepWorld(world);
    out.push(...world.events);
  }
  return { w: world, out };
}

describe('a totem, a brand or a mirage archer says what fired and where (docs/VISUAL_LANGUAGE.md, "Cues")', () => {
  it('a shot from a totem carries the totem, its place and the spot it was fired at', () => {
    const shots = eventsOf('fatherTotem', 12).filter(
      (e): e is Extract<SimEvent, { t: 'use' }> => e.t === 'use' && e.via === 'deployed',
    );
    expect(shots.length).toBeGreaterThan(0);
    for (const s of shots) {
      expect(s.dep, 'dep').toBeDefined();
      expect(s.dep!.kind).toBe('totem');
      expect(Number.isFinite(s.dep!.x + s.dep!.y + s.dep!.tx + s.dep!.ty)).toBe(true);
      // A melee totem is not a projectile.
      expect(s.dep!.shot).toBe(false);
    }
  });

  it('the aura of a mine adds to a hit and says which mine did it', () => {
    const bonus = eventsOf('mortarCharge', 14).filter(
      (e): e is Extract<SimEvent, { t: 'mineBonus' }> => e.t === 'mineBonus',
    );
    expect(bonus.length).toBeGreaterThan(0);
    for (const b of bonus) {
      expect(b.kind).toBe('fire');
      expect(Number.isFinite(b.mx + b.my + b.x + b.y)).toBe(true);
    }
  });
});

describe('Echoing Blow gives each extra enemy its own thrust', () => {
  /** The most thrusts of the character in one tick over some seconds, with `extra` other enemies standing beside the first. */
  const mostThrusts = (extra: number): number => {
    const { world: w, dummy } = createDummyWorld(
      kitBuild(['crushingBlow', 'echoingBlow'], 'sword_3', classFor('str')),
      { distance: 1.4, maxTime: 60 },
    );
    w.sides[0].opts.freeResources = true;
    w.sides[0].opts.godMode = true;
    dummy.def = dummyDefence({ maxLife: 1e9 });
    dummy.life = 1e9;
    for (let i = 0; i < extra; i++) {
      const m = spawnMonster(
        w,
        { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
        dummy.x + 0.5 + i * 0.4,
        dummy.y + (i % 2 ? 0.9 : -0.9),
        0,
        0,
        'Neighbour',
      );
      m.def = dummyDefence({ maxLife: 1e9 });
      m.life = 1e9;
    }
    let most = 0;
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(w);
      const n = w.events.filter((e) => e.t === 'thrust' && e.src === w.sides[0].player.id).length;
      most = Math.max(most, n);
    }
    return most;
  };

  it('one thrust for the struck enemy and one for each other it hits; none extra when alone', () => {
    expect(mostThrusts(0)).toBe(1);
    expect(mostThrusts(3)).toBeGreaterThanOrEqual(3);
  });
});

describe('a mine whose aura helps a hit is named', () => {
  const aura = { double: 30, min: 0, max: 0, cap: 0, radius: 3.5 };
  const mine = (x: number) => ({ kind: 'mine', x, y: 0, aura });
  const run = (mines: ReturnType<typeof mine>[], at: number) => {
    const w = { events: [] as SimEvent[] } as unknown as World;
    const s = { deployables: mines } as unknown as Side;
    mineBonus(w, s, { x: at, y: 0 } as Actor, 'double');
    return w.events;
  };

  it('the nearest mine whose aura reaches the enemy, and none when none does', () => {
    expect(run([mine(0), mine(2)], 3)).toEqual([
      { t: 'mineBonus', kind: 'double', x: 3, y: 0, mx: 2, my: 0 },
    ]);
    expect(run([mine(0)], 9)).toEqual([]);
    expect(run([], 1)).toEqual([]);
  });

  it('a hit that rolled double damage says so', () => {
    const { world, dummy } = createDummyWorld(buildFor([]), { distance: 2 });
    const prof = world.sides[0].char.profile(world.sides[0].primary, 0, 0);
    const roll = (doubleChance: number) =>
      resolveHit(
        new Rng(1),
        { ...prof, doubleChance },
        prof.hands[0],
        targetState(dummy),
        1,
        false,
      );
    expect(roll(1).doubled).toBe(true);
    expect(roll(0).doubled).toBeUndefined();
  });
});

describe('a blink that waits for a flight says so (Shadow Quiver, Bolt Step)', () => {
  it('Shadow Quiver looses an arrow along the path, then the blink ends there', () => {
    const ev = eventsOf('shadowQuiver', 10);
    const i = ev.findIndex((e) => e.t === 'warp');
    expect(i).toBeGreaterThanOrEqual(0);
    const warp = ev[i] as Extract<SimEvent, { t: 'warp' }>;
    expect(warp.skill).toBe('shadowQuiver');
    expect(warp.seconds).toBeGreaterThan(0);
    expect(Math.hypot(warp.x2 - warp.x, warp.y2 - warp.y)).toBeGreaterThan(1);
    const end = ev.slice(i).find((e) => e.t === 'blink' && e.end) as
      Extract<SimEvent, { t: 'blink' }> | undefined;
    expect(end?.skill).toBe('shadowQuiver');
    expect(end!.x).toBeCloseTo(warp.x2, 3);
  });
});

describe('what a trigger does is told', () => {
  it('a triggered spell says whose it is', () => {
    const { w, out } = dummyEvents(
      buildFor([{ on: 'hit', chance: 100, cooldown: 0.2, effect: { kind: 'castSocketed' } }]),
      12,
    );
    const trig = out.filter((e): e is Extract<SimEvent, { t: 'trigger' }> => e.t === 'trigger');
    expect(trig.length).toBeGreaterThan(0);
    const char = w.sides[0].char;
    for (const t of trig) {
      expect(t.src).toBe(w.sides[0].player.id);
      // The renderer finds the spell (for its colour and name) among the character's skills or its triggers' own.
      const known =
        char.actives.some((c) => c.skill.id === t.skill) ||
        char.triggers.some((s) => s.skills.some((c) => c.skill.id === t.skill));
      expect(known, t.skill).toBe(true);
    }
  });

  it('a trigger that recovers life makes a recover event, and one that sacrifices life a sacrifice', () => {
    const rec = dummyEvents(
      buildFor([
        {
          on: 'hit',
          chance: 100,
          cooldown: 0.1,
          effect: { kind: 'recover', pool: 'life', pctOf: 'maxLife', value: 5 },
        },
      ]),
      12,
      0.3,
    );
    const got = rec.out.filter((e): e is Extract<SimEvent, { t: 'recover' }> => e.t === 'recover');
    expect(got.length).toBeGreaterThan(0);
    for (const g of got) {
      expect(g.pool).toBe('life');
      expect(g.pct).toBeGreaterThanOrEqual(RECOVER_SHARE);
    }
    const sac = dummyEvents(
      buildFor([
        {
          on: 'hit',
          chance: 100,
          cooldown: 0.1,
          effect: { kind: 'sacrifice', pctOfLife: 5, pool: 'es' },
        },
      ]),
      12,
    );
    expect(sac.out.some((e) => e.t === 'sacrifice' && e.amount > 0)).toBe(true);
  });
});

/** A flask that takes ignite off, with the fields a flask state needs. */
function cleansingFlask(): World['sides'][number]['flasks'][number] {
  const spec = {
    uid: 1,
    kind: 'utility',
    name: 'Test Flask',
    life: 0,
    mana: 0,
    duration: 4,
    maxCharges: 50,
    perUse: 10,
    instant: false,
    buff: [],
    removeIgnite: true,
    removeFreeze: false,
    removeBleed: false,
    removePoison: false,
    removeShock: false,
    removeCurse: false,
    lifeToEs: false,
  } as FlaskSpec;
  return {
    spec,
    charges: 50,
    activeT: 0,
    queued: false,
    lifeRate: 0,
    manaRate: 0,
    esRate: 0,
    esT: 0,
    uses: 0,
  };
}

describe('a flask says which ailments it took off', () => {
  const drink = (burning: boolean): Extract<SimEvent, { t: 'flaskUsed' }> => {
    const { world } = createDummyWorld(buildFor([]), { distance: 1.6, maxTime: 5, seed: 1 });
    const side = world.sides[0];
    side.flasks = [cleansingFlask()];
    if (burning) side.player.ail.ignites.push({ dps: 5, t: 4 } as never);
    stepWorld(world, () => [0]);
    const used = world.events.find((e) => e.t === 'flaskUsed');
    expect(used).toBeDefined();
    return used as Extract<SimEvent, { t: 'flaskUsed' }>;
  };

  it('names an ailment that was there', () => {
    expect(drink(true).cleansed).toEqual(['ignite']);
  });

  it('names nothing when the character was not afflicted', () => {
    expect(drink(false).cleansed).toBeUndefined();
  });
});

describe('recovery is gathered into cues worth showing (src/sim/recovery.ts)', () => {
  const actor = (): Actor =>
    ({
      id: 1,
      isPlayer: true,
      def: { maxLife: 1000, maxEs: 200, maxMana: 100 },
    }) as unknown as Actor;
  const world = (): World => ({ t: 10, events: [] }) as unknown as World;

  it('a trickle below the share shows nothing, and is forgotten if nothing follows', () => {
    const p = actor();
    const w = world();
    noteRecover(p, 'life', 1000 * RECOVER_SHARE * 0.5);
    tickRecover(w, p, 1 / 60);
    expect(w.events).toHaveLength(0);
    for (let i = 0; i < 120; i++) {
      w.t += 1 / 60;
      tickRecover(w, p, 1 / 60);
    }
    // The old trickle no longer counts: another half share is still not a cue.
    noteRecover(p, 'life', 1000 * RECOVER_SHARE * 0.6);
    tickRecover(w, p, 1 / 60);
    expect(w.events).toHaveLength(0);
  });

  it('enough in one go is one cue, with its share of the pool', () => {
    const p = actor();
    const w = world();
    noteRecover(p, 'mana', 20);
    tickRecover(w, p, 1 / 60);
    expect(w.events).toEqual([{ t: 'recover', src: 1, pool: 'mana', pct: 0.2 }]);
  });

  it('a steady stream is one cue in a gap, however fast it comes', () => {
    const p = actor();
    const w = world();
    let cues = 0;
    for (let i = 0; i < 600; i++) {
      w.t += 1 / 60;
      w.events.length = 0;
      noteRecover(p, 'life', 100);
      tickRecover(w, p, 1 / 60);
      cues += w.events.length;
    }
    // Ten seconds, at most one cue in each gap.
    expect(cues).toBeGreaterThan(10 / (RECOVER_GAP + 0.1));
    expect(cues).toBeLessThanOrEqual(Math.ceil(10 / RECOVER_GAP));
  });

  it('a monster recovers without a cue', () => {
    const m = { ...actor(), isPlayer: false } as Actor;
    const w = world();
    noteRecover(m, 'life', 900);
    tickRecover(w, m, 1 / 60);
    expect(w.events).toHaveLength(0);
  });
});
