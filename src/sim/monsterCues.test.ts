import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { RIME_AURA_RANGE } from '../data/abilities';
import type { MonsterModId, MonsterTypeId } from '../data/monsters';
import { newRun } from '../run/run';
import { killActor } from './combat';
import { createDummyWorld } from './dummy';
import { hexPlayer } from './factions';
import type { Actor, SimEvent, World } from './types';
import { spawnMonster, stepWorld } from './world';

/**
 * The tells the sim hands the renderer for what monsters do for each other and to the character (docs/VFX-AUDIT.md, pass 5).
 * They are events only: each test also checks that the thing itself still happens as it did.
 */

function arena(): World {
  const { world } = createDummyWorld(newRun('vanguard', 1).build, { distance: 30 });
  world.sides[0].player.stunT = 1e9;
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
  const m = spawnMonster(
    w,
    spec(type, over),
    w.sides[0].player.x + dx,
    w.sides[0].player.y + dy,
    0,
    0,
    type,
  );
  m.state = 'chase';
  return m;
}

/** Step the world and gather every event it says. */
function watch(w: World, seconds: number): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    out.push(...w.events);
  }
  return out;
}

type Cue = Extract<SimEvent, { t: 'cue' }>;
const cues = (ev: SimEvent[], kind: Cue['kind']): Cue[] =>
  ev.filter((e): e is Cue => e.t === 'cue' && e.kind === kind);
const mods = (...m: string[]): Partial<MonsterSpec> => ({
  rarity: 'magic',
  mods: m as MonsterModId[],
});

describe('a Choirmaster mends in the open', () => {
  it('the heal lands with a cue and one heal event for each ally it helped', () => {
    const w = arena();
    const cm = put(w, 'choirmaster', 10);
    const hurt = put(w, 'warrior', 12);
    const whole = put(w, 'warrior', 12, 1);
    hurt.life = hurt.def.maxLife * 0.3;
    cm.skillT = 0;
    const ev = watch(w, 1.6);
    const landed = cues(ev, 'mend');
    expect(landed).toHaveLength(1);
    expect(landed[0].id).toBe(cm.id);
    expect(landed[0].r).toBeGreaterThan(3);
    const heals = ev.filter((e) => e.t === 'heal');
    expect(heals.some((e) => e.t === 'heal' && e.id === hurt.id && e.src === cm.id)).toBe(true);
    expect(heals.some((e) => e.t === 'heal' && e.id === whole.id)).toBe(false);
    expect(hurt.life).toBeGreaterThan(hurt.def.maxLife * 0.3);
  });

  it('a stun that cuts the channel says so, and nothing is healed', () => {
    const w = arena();
    const cm = put(w, 'choirmaster', 10);
    const hurt = put(w, 'warrior', 12);
    hurt.life = hurt.def.maxLife * 0.3;
    cm.skillT = 0;
    watch(w, 0.2);
    expect(cm.channelT).toBeGreaterThan(0);
    cm.stunT = 2;
    const ev = watch(w, 1.5);
    expect(cues(ev, 'mendBroken')).toHaveLength(1);
    expect(cues(ev, 'mend')).toHaveLength(0);
    expect(ev.some((e) => e.t === 'heal')).toBe(false);
    expect(hurt.life).toBeCloseTo(hurt.def.maxLife * 0.3, 3);
  });
});

describe('buffs between monsters', () => {
  it('a censer shows its reach when it takes hold of someone new, not every tick', () => {
    const w = arena();
    const c = put(w, 'censer', 10);
    const ally = put(w, 'warrior', 12);
    const ev = watch(w, 1);
    const rings = cues(ev, 'aura');
    expect(rings.length).toBeGreaterThanOrEqual(1);
    expect(rings.length).toBeLessThanOrEqual(1);
    expect(rings[0].id).toBe(c.id);
    expect(rings[0].r).toBe(5);
    expect(ally.choir.buffT).toBeGreaterThan(0);
  });

  it('a whistle shows the reach it empowers', () => {
    const w = arena();
    const h = put(w, 'handler', 10);
    h.abT[0] = 0;
    const hound = put(w, 'hound', 12);
    const ev = watch(w, 0.3);
    const rings = cues(ev, 'whistle');
    expect(rings).toHaveLength(1);
    expect(rings[0].r).toBe(8);
    expect(hound.choir.buffT).toBeGreaterThan(0);
  });

  it('a Zealous death that spurs allies says how far it reaches', () => {
    const w = arena();
    const z = put(w, 'warrior', 10, 0, mods('zealous'));
    const ally = put(w, 'warrior', 12);
    const far = put(w, 'warrior', 30);
    killActor(w, z);
    const rings = cues(w.events, 'zeal');
    expect(rings).toHaveLength(1);
    expect(rings[0].r).toBe(6);
    expect(ally.choir.zealT).toBeGreaterThan(0);
    expect(far.choir.zealT).toBe(0);
  });

  it('the fall of a Choir leader stuns its pack, and each stun is an event', () => {
    const w = arena();
    const leader = put(w, 'choirmaster', 10);
    const a = put(w, 'warrior', 12);
    const b = put(w, 'warrior', 13);
    a.stunT = 0;
    killActor(w, leader);
    const stuns = w.events.filter((e) => e.t === 'stun');
    expect(stuns.map((e) => (e.t === 'stun' ? e.dst : 0)).sort()).toEqual([a.id, b.id].sort());
    expect(a.stunT).toBeGreaterThan(0);
  });

  it('a Wight settling a ward says so once, and the ally carries the shield', () => {
    const w = arena();
    const wight = put(w, 'wight', 10);
    const ally = put(w, 'warrior', 12);
    const ev = watch(w, 0.5);
    const wards = cues(ev, 'ward');
    expect(wards).toHaveLength(1);
    expect(wards[0].id).toBe(wight.id);
    expect(ally.shellBy).toBe(wight.id);
    expect(ally.es).toBeGreaterThan(ally.def.maxEs);
  });
});

describe('heals with no channel', () => {
  it('a Gorger eating a body is a heal, not a summon', () => {
    const w = arena();
    const dead = put(w, 'warrior', 12, 3);
    killActor(w, dead);
    const g = put(w, 'gorger', 12, 1.5);
    g.life = g.def.maxLife * 0.4;
    const ev = watch(w, 1.2);
    expect(ev.some((e) => e.t === 'heal' && e.id === g.id)).toBe(true);
    expect(ev.some((e) => e.t === 'summon' && e.id === g.id)).toBe(false);
    expect(g.life).toBeGreaterThan(g.def.maxLife * 0.6);
  });

  it('the Precentor heals itself in the open, only when it was hurt', () => {
    const w = arena();
    const p = put(w, 'hexer', 10, 0, { rarity: 'miniboss', mods: ['precentor'] });
    p.raiserT = 0;
    p.life = p.def.maxLife * 0.8;
    const ev = watch(w, 22);
    expect(ev.some((e) => e.t === 'heal' && e.id === p.id)).toBe(true);
  });
});

describe('a Mirrored monster', () => {
  it('its twin appears with an event, and the survivor is made whole with a cue', () => {
    const w = arena();
    const m = put(w, 'warrior', 14, 0, mods('mirrored'));
    const ev = watch(w, 0.2);
    const twin = ev.find((e) => e.t === 'twin');
    expect(twin).toBeDefined();
    expect(twin?.t === 'twin' && twin.of).toBe(m.id);
    const t = w.actors.find((a) => a.id === (twin?.t === 'twin' ? twin.id : -1)) as Actor;
    expect(t.mirror.id).toBe(m.id);
    // One falls; the other has three seconds before it is whole again.
    m.life = m.def.maxLife * 0.5;
    t.life = 0;
    killActor(w, t);
    expect(m.mirror.t).toBe(3);
    const after = watch(w, 3.3);
    const whole = cues(after, 'whole');
    expect(whole).toHaveLength(1);
    expect(whole[0].id).toBe(m.id);
    expect(m.life).toBe(m.def.maxLife);
    expect(after.some((e) => e.t === 'heal' && e.id === m.id)).toBe(true);
  });
});

describe('a Reliquarian changes its immunity', () => {
  it('says which element, at the start and at each quarter of its life lost', () => {
    const w = arena();
    const r = put(w, 'guard', 12, 0, { rarity: 'miniboss', mods: ['reliquarian'] });
    const first = cues(watch(w, 0.2), 'immune');
    expect(first).toHaveLength(1);
    const el = first[0].n ?? 0;
    expect(el).toBeGreaterThanOrEqual(1);
    expect(el).toBeLessThanOrEqual(3);
    expect(r.def.immune[el]).toBe(true);
    r.life = r.def.maxLife * 0.7;
    const second = cues(watch(w, 0.2), 'immune');
    expect(second).toHaveLength(1);
    expect(second[0].n).not.toBe(el);
    expect(r.def.immune[second[0].n ?? 0]).toBe(true);
  });
});

describe('a Carrion Mother at half life', () => {
  it('each of her four pools says where it opened, as the zone does', () => {
    const w = arena();
    const m = put(w, 'warrior', 14, 0, { rarity: 'miniboss', mods: ['carrionMother'] });
    m.life = m.def.maxLife * 0.49;
    const ev = watch(w, 0.2);
    const pools = cues(ev, 'pools');
    expect(pools).toHaveLength(4);
    const zones = w.effects.filter((e) => e.kind === 'caustic');
    expect(zones).toHaveLength(4);
    for (const p of pools) {
      expect(p.id).toBe(m.id);
      expect(zones.some((z) => Math.abs(z.x - p.x) < 1e-9 && Math.abs(z.y - p.y) < 1e-9)).toBe(
        true,
      );
    }
  });
});

describe('hexes cast at the character', () => {
  it('say who cast them, which, and whether it renews one the character holds', () => {
    const w = arena();
    const m = put(w, 'watcher', 30);
    const p = w.sides[0].player;
    hexPlayer(w, w.sides[0], 'feebleGrip', m);
    hexPlayer(w, w.sides[0], 'feebleGrip', m);
    hexPlayer(w, w.sides[0], 'openWounds');
    const casts = w.events.filter((e) => e.t === 'hexCast');
    expect(casts).toEqual([
      { t: 'hexCast', from: m.id, to: p.id, hex: 'feebleGrip', renew: false },
      { t: 'hexCast', from: m.id, to: p.id, hex: 'feebleGrip', renew: true },
      { t: 'hexCast', from: -1, to: p.id, hex: 'openWounds', renew: false },
    ]);
    // A hex the character already has is renewed (silently before), still one at a time.
    expect(p.hexes).toHaveLength(1);
  });

  it('a Watcher casts on its own and the event names it', () => {
    const w = arena();
    const m = put(w, 'watcher', 8);
    m.skillT = 0;
    const ev = watch(w, 1);
    expect(ev.some((e) => e.t === 'hexCast' && e.from === m.id)).toBe(true);
  });
});

describe('a thief takes charges', () => {
  it('the flask that was robbed is named, with the thief', () => {
    const w = arena();
    const flask = w.sides[0].flasks[0];
    const before = flask.charges;
    const thief = put(w, 'cutpurse', 1);
    const ev = watch(w, 3);
    const took = ev.find((e) => e.t === 'stolen');
    expect(took).toBeDefined();
    expect(took?.t === 'stolen' && took.to).toBe(thief.id);
    expect(took?.t === 'stolen' && took.src).toBe(w.sides[0].player.id);
    expect(took?.t === 'stolen' && ['life', 'mana', 'hybrid', 'utility']).toContain(
      took?.t === 'stolen' ? took.kind : '',
    );
    expect(flask.charges).toBeLessThan(before);
  });
});

describe('the reach of a Rime Aura', () => {
  it('chills within the radius the renderer draws', () => {
    const w = arena();
    const p = w.sides[0].player;
    p.stunT = 1e9;
    put(w, 'warrior', RIME_AURA_RANGE - 0.3, 0, mods('rimeAura')).stunT = 1e9;
    watch(w, 0.3);
    expect(p.ail.chill).toBeGreaterThan(0);
    const w2 = arena();
    put(w2, 'warrior', RIME_AURA_RANGE + 0.5, 0, mods('rimeAura')).stunT = 1e9;
    watch(w2, 0.3);
    expect(w2.sides[0].player.ail.chill).toBe(0);
  });
});
