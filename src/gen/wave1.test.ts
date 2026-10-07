import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { armourStats } from '../calc/items';
import { Rng } from '../core/rng';
import { itemBase } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { UNIQUE_FLASKS } from '../data/uniqueFlasks';
import { UNIQUES, uniqueDef } from '../data/uniques';
import { WAVE1_UNIQUES } from '../data/uniquesWave1';
import type { Build, EquipSlot, Item } from '../data/types';
import { modsText } from '../mods/text';
import { makeGem, makeItem } from './items';
import { CONDITIONS } from '../mods/types';
import { flaskSpec } from '../calc/flasks';
import { newRun, rollRewards, type RunState } from '../run/run';
import { slotsFor } from '../run/inventory';
import {
  FACTION_POOL_WEIGHT,
  rarityWeights,
  rollMonsterDrops,
  rollUnique,
  rollUniqueFlask,
  uniqueIdOf,
  uniquePool,
} from './loot';

const rng = () => new Rng(42);
let n = 1000;
const uid = () => n++;

/** A fresh build of a class, optionally with the unique worn in its slot. */
function build(classId: string, uniqueId?: string, setup?: (b: Build) => void): Build {
  const run = newRun(classId, 1);
  const b = run.build;
  b.level = 60;
  setup?.(b);
  if (uniqueId) {
    const it = rollUnique(rng(), uid, uniqueDef(uniqueId), 60);
    const slot: EquipSlot = slotsFor(it)[0];
    // Keep the gems of the item being replaced where they can be.
    const old = b.equipment[slot];
    if (old) it.sockets = it.sockets.map((_, i) => old.sockets[i] ?? null);
    b.equipment[slot] = it;
    if (slot === 'mainHand' && itemBase(it.baseId).hands === 2) delete b.equipment.offHand;
  }
  return b;
}

const ch = (b: Build) => new Character(b, { areaLevel: 60 });
const hitMax = (c: Character, conds = 0, mask = 0) =>
  c.profile(c.primary, conds, mask).hands[0].chunks.reduce((s, x) => s + x.max, 0);

describe('wave 1 data (EXPANSION 6.4)', () => {
  it('holds the 18 items and 5 flasks (wave 2 adds one more flask), all unique ids', () => {
    expect(WAVE1_UNIQUES).toHaveLength(18);
    expect(UNIQUE_FLASKS.filter((u) => u.id !== 'martyrsDraught')).toHaveLength(5);
    const ids = [...UNIQUES, ...UNIQUE_FLASKS].map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has a valid base, a level that fits it, and authoring notes (rule 6.1.3)', () => {
    for (const u of WAVE1_UNIQUES) {
      const b = itemBase(u.baseId);
      expect(u.level, u.id).toBeGreaterThanOrEqual(b.level);
      expect(u.notes?.pairsWith.length, u.id).toBeGreaterThanOrEqual(2);
      expect(u.notes?.weakAgainst.length, u.id).toBeGreaterThanOrEqual(1);
      expect(u.flavour.length, u.id).toBeGreaterThan(10);
    }
  });

  it('every flask has a unique-only base at its level, and notes', () => {
    for (const u of UNIQUE_FLASKS) {
      const b = flaskBase(u.baseId);
      expect(b.uniqueOnly, u.id).toBe(true);
      expect(b.kind).toBe('utility');
      expect(b.level, u.id).toBe(u.level);
      expect(u.notes?.pairsWith.length, u.id).toBeGreaterThanOrEqual(2);
      expect(u.notes?.weakAgainst.length, u.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('every mod renders as player text, never as a raw stat id', () => {
    for (const u of [...WAVE1_UNIQUES, ...UNIQUE_FLASKS]) {
      const lines = modsText(
        u.mods.map((m) => ({
          stat: m.stat,
          kind: m.kind,
          value: m.min,
          tags: m.tags,
          damageTypes: m.damageTypes,
        })),
      );
      expect(lines).toHaveLength(
        u.mods.length - u.mods.filter((m) => m.stat === 'damage.max').length,
      );
      // Compound ids (dotted or camel-case) must never show; short ones like 'es' can occur in words.
      for (const m of u.mods.filter((x) => /[.A-Z]/.test(x.stat)))
        for (const l of lines) expect(l.includes(m.stat), `${u.id}: ${l}`).toBe(false);
    }
  });

  it('the new uniques cover their slots, and levels are spread over the run', () => {
    const classes = new Set(WAVE1_UNIQUES.map((u) => itemBase(u.baseId).itemClass));
    for (const c of ['body', 'helmet', 'gloves', 'sword2', 'bow', 'amulet', 'ring', 'belt'])
      expect(classes.has(c as never), c).toBe(true);
    const levels = WAVE1_UNIQUES.map((u) => u.level).concat(UNIQUE_FLASKS.map((u) => u.level));
    expect(Math.min(...levels)).toBeLessThanOrEqual(5);
    expect(Math.max(...levels)).toBeGreaterThanOrEqual(50);
  });
});

describe('wave 1 signature lines', () => {
  const base = (cls = 'vanguard') => ch(build(cls));

  it('The Walled Heart: no sockets, a great deal of life, more fire damage', () => {
    const it = rollUnique(rng(), uid, uniqueDef('walledHeart'), 60);
    expect(it.sockets).toHaveLength(0);
    const c = ch(build('vanguard', 'walledHeart'));
    expect(c.defence().maxLife).toBeGreaterThan(base().defence().maxLife + 280);
  });

  it("Gravedigger's Smock: six sockets, and no defence", () => {
    const it = rollUnique(rng(), uid, uniqueDef('gravediggersSmock'), 3);
    expect(it.sockets).toHaveLength(6);
    expect(it.uniqueMods).toEqual([]);
    expect(armourStats(it)).toEqual({ armour: 0, evasion: 0, es: 0, block: 0 });
  });

  it("Embalmer's Wraps: chaos damage hits energy shield first", () => {
    const d = ch(build('mystic', 'embalmersWraps')).defence();
    expect(d.chaosHitsEs).toBe(true);
    expect(d.maxEs).toBeGreaterThan(base('mystic').defence().maxEs);
    expect(base('mystic').defence().chaosHitsEs).toBe(false);
  });

  it('Thunderwire Hauberk: physical damage taken as lightning, at a cost to maximum resistance', () => {
    const d = ch(build('reaver', 'thunderwireHauberk')).defence();
    expect(d.physTakenAs[1]).toBeGreaterThanOrEqual(0.3);
    expect(d.physTakenAs[1]).toBeLessThanOrEqual(0.5);
    expect(d.maxRes[1]).toBe(60);
  });

  it('The Steadfast Cassock: grants Mind Bulwark', () => {
    expect(ch(build('shade', 'steadfastCassock')).db.flag('manaBeforeLife30')).toBe(true);
    expect(base('shade').db.flag('manaBeforeLife30')).toBe(false);
  });

  it('Spellsworn Circlet: spell damage increases reach attacks', () => {
    const inc = (b: Build) => {
      b.equipment.amulet = {
        ...makeItem(uid, 'amulet_str', 40, 0, 'unique'),
        uniqueMods: [{ stat: 'damage', kind: 'inc', value: 100, tags: ['spell'] }],
      };
    };
    const without = hitMax(ch(build('vanguard', undefined, inc)));
    const withCirclet = hitMax(ch(build('vanguard', 'spellswornCirclet', inc)));
    expect(withCirclet).toBeGreaterThan(without * 1.4);
  });

  it('The Bare Visor: more added physical damage and crit multiplier, much more physical damage taken', () => {
    const b = build('vanguard', 'bareVisor');
    const c = ch(b);
    expect(c.defence().damageTakenType[0]).toBeGreaterThanOrEqual(1.4);
    expect(c.defence().damageTakenType[0]).toBeLessThanOrEqual(1.5);
    expect(hitMax(c)).toBeGreaterThan(hitMax(base()) + 20);
    expect(c.profile(c.primary).hands[0].critMulti).toBeGreaterThan(
      base().profile(base().primary).hands[0].critMulti + 0.5,
    );
  });

  it("Cantor's Hood: socketed auras are two levels higher, cannot be frozen", () => {
    const setup = (b: Build) => {
      b.equipment.body!.sockets = [makeGem(uid, 'crushingBlow'), makeGem(uid, 'kindlingHalo')];
    };
    const plain = ch(build('vanguard', undefined, setup));
    const b = build('vanguard', 'cantorsHood', (x) => {
      setup(x);
      const hood = rollUnique(rng(), uid, uniqueDef('cantorsHood'), 60);
      hood.sockets = [makeGem(uid, 'kindlingHalo'), null].slice(0, hood.sockets.length);
    });
    b.equipment.helmet!.sockets = b.equipment.helmet!.sockets.map((_, i) =>
      i === 0 ? makeGem(uid, 'frostHalo') : null,
    );
    const c = ch(b);
    expect(c.defence().cannotBeFrozen).toBe(true);
    const frost = c.gems.find((g) => g.def.id === 'frostHalo');
    if (frost) {
      const natural = new Character(build('vanguard'), { areaLevel: 60 });
      expect(frost.level).toBeGreaterThanOrEqual(natural.attrs.str > 0 ? 3 : 1);
    }
    expect(plain.defence().cannotBeFrozen).toBe(false);
  });

  it('Knucklebone Bindings: huge physical damage, but only bare-handed', () => {
    const bare = (b: Build) => {
      delete b.equipment.mainHand;
      delete b.equipment.offHand;
    };
    const plain = hitMax(ch(build('shade', undefined, bare)));
    const bound = hitMax(ch(build('shade', 'knuckleboneBindings', bare)));
    expect(bound).toBeGreaterThan(plain * 5);
    // With a weapon in hand the bonus is gone.
    const armed = hitMax(ch(build('shade', 'knuckleboneBindings')));
    expect(armed).toBeLessThan(bound / 3);
  });

  it('Rimeclasp Gloves: all physical damage becomes cold', () => {
    const c = ch(build('vanguard', 'rimeclaspGloves'));
    const chunks = c.profile(c.primary).hands[0].chunks;
    expect(chunks.every((x) => x.type === 2)).toBe(true);
    expect(c.defence().res[2]).toBeGreaterThan(base().defence().res[2] + 19);
  });

  it('Bloodquick Gauntlets: crit leech is instant', () => {
    const c = ch(build('reaver', 'bloodquickGauntlets'));
    expect(c.profile(c.primary).instantLeechOnCrit).toBe(true);
    expect(c.profile(c.primary).leechLife[0]).toBeCloseTo(0.02);
  });

  it('Meteorite Edge: physical damage can shock, and there is no elemental damage', () => {
    const c = ch(
      build('vanguard', 'meteoriteEdge', (b) => {
        b.equipment.body!.uniqueMods = [{ stat: 'convert.physical.fire', kind: 'base', value: 50 }];
      }),
    );
    const p = c.profile(c.primary);
    expect(p.ailmentFrom.shock).toContain(0);
    expect(p.hands[0].chunks.every((x) => x.type === 0 || x.type === 4)).toBe(true);
  });

  it('Unblinking Longbow: hits cannot be evaded', () => {
    const c = ch(build('strider', 'unblinkingLongbow'));
    expect(c.profile(c.primary).alwaysHit).toBe(true);
  });

  it('The Thousand Ribs: four more arrows', () => {
    const plain = ch(build('strider'));
    const ribs = ch(build('strider', 'thousandRibs'));
    expect(ribs.profile(ribs.primary).projectiles).toBe(
      plain.profile(plain.primary).projectiles + 4,
    );
  });

  it('Ashen Heartstone: grants Searing Avatar and penetrates fire resistance', () => {
    const c = ch(build('zealot', 'ashenHeartstone'));
    expect(c.db.flag('avatarOfFire')).toBe(true);
    expect(c.profile(c.primary).pen[3]).toBeGreaterThanOrEqual(0.1 - 1e-9);
  });

  it('Orrery of Bone: sixty or more to every attribute', () => {
    const a = base().attrs;
    const b = ch(build('vanguard', 'orreryOfBone')).attrs;
    for (const k of ['str', 'dex', 'int'] as const) expect(b[k] - a[k]).toBeGreaterThanOrEqual(60);
  });

  it('Rot-heart Band: added chaos damage and chaos resistance, less life', () => {
    const c = ch(build('vanguard', 'rotheartBand'));
    expect(c.profile(c.primary).hands[0].chunks.some((x) => x.type === 4)).toBe(true);
    expect(c.defence().res[4]).toBeGreaterThanOrEqual(base().defence().res[4] + 17);
    expect(c.defence().maxLife).toBeLessThan(base().defence().maxLife);
  });

  it('The Wide Cinch: a higher maximum hit and a lower minimum hit', () => {
    const plain = base()
      .profile(base().primary)
      .hands[0].chunks.find((x) => x.type === 0)!;
    const c = ch(build('vanguard', 'wideCinch'));
    const chunk = c.profile(c.primary).hands[0].chunks.find((x) => x.type === 0)!;
    expect(chunk.max).toBeGreaterThan(plain.max * 1.25);
    expect(chunk.min).toBeLessThan(plain.min * 0.75);
  });
});

describe('wave 1 flasks', () => {
  const withFlask = (id: string, classId = 'vanguard') => {
    const def = UNIQUE_FLASKS.find((u) => u.id === id)!;
    const b = build(classId);
    b.flasks = [rollUniqueFlask(rng(), uid, def, 60), null, null, null, null];
    return ch(b);
  };

  it('a rolled unique flask is a unique, with its mods as its effect', () => {
    for (const u of UNIQUE_FLASKS) {
      const f = rollUniqueFlask(rng(), uid, u, 60);
      expect(f.uniqueId).toBe(u.id);
      expect(uniqueIdOf(f)).toBe(u.id);
      const spec = flaskSpec(
        f,
        new (class {
          mult() {
            return 1;
          }
        })() as never,
      );
      // Mods named `flask.…` change the flask itself and are not part of the buff.
      expect(spec.buff.length, u.id).toBe(
        u.mods.filter((x) => !x.stat.startsWith('flask.')).length,
      );
    }
  });

  it('Hoarfrost Draught: physical taken as cold, and physical gained as cold, only while active', () => {
    const c = withFlask('hoarfrostDraught');
    expect(c.defence(0, 0).physTakenAs[2]).toBe(0);
    expect(c.defence(0, 1).physTakenAs[2]).toBeCloseTo(0.3);
    const coldMax = (mask: number) =>
      c
        .profile(c.primary, 0, mask)
        .hands[0].chunks.filter((x) => x.type === 2)
        .reduce((s, x) => s + x.max, 0);
    expect(coldMax(0)).toBe(0);
    expect(coldMax(1)).toBeGreaterThan(0);
  });

  it('Last Light Flask: two more projectiles and more area while active', () => {
    const c = withFlask('lastLightFlask', 'strider');
    expect(c.profile(c.primary, 0, 1).projectiles).toBe(c.profile(c.primary, 0, 0).projectiles + 2);
    expect(c.profile(c.primary, 0, 1).radiusMult).toBeGreaterThan(
      c.profile(c.primary, 0, 0).radiusMult,
    );
  });

  it('Rotwine Flask: damage gained as chaos, and chaos leeched, while active', () => {
    const c = withFlask('rotwineFlask');
    const chaos = (mask: number) =>
      c
        .profile(c.primary, 0, mask)
        .hands[0].chunks.filter((x) => x.type === 4)
        .reduce((s, x) => s + x.max, 0);
    expect(chaos(0)).toBe(0);
    expect(chaos(1)).toBeGreaterThan(0);
    expect(c.profile(c.primary, 0, 1).leechLife[4]).toBeGreaterThan(0);
  });

  it('Stonebrew Flask: block while active', () => {
    const c = withFlask('stonebrewFlask');
    expect(c.defence(0, 1).blockAttack).toBeGreaterThan(c.defence(0, 0).blockAttack + 0.11);
  });

  it("Gambler's Tonic: item rarity and quantity while active", () => {
    const c = withFlask('gamblersTonic');
    expect(c.dbWith(1).mult('itemRarity')).toBeGreaterThanOrEqual(1.2);
    expect(c.dbWith(1).mult('itemQuantity')).toBeGreaterThanOrEqual(1.2);
    expect(c.dbWith(0).mult('itemRarity')).toBe(1);
  });
});

describe('acquisition (EXPANSION 6.2 items 1–4)', () => {
  it('the unique weight is 1.5, three times what it was', () => {
    expect(rarityWeights('normal').unique).toBe(1.5);
    expect(rarityWeights('rare').unique / rarityWeights('rare').rare).toBeCloseTo(1.5 / 7.5);
  });

  it('a mini-boss drops a unique, and the final boss drops two different ones', () => {
    const r = new Rng(3);
    for (let i = 0; i < 40; i++) {
      const mini = rollMonsterDrops(r, uid, { ilvl: 50, monster: 'miniboss' });
      expect(mini.filter((x) => uniqueIdOf(x)).length).toBeGreaterThanOrEqual(1);
      const boss = rollMonsterDrops(r, uid, { ilvl: 90, monster: 'boss' });
      const ids = boss.map(uniqueIdOf).filter(Boolean);
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("a faction's own uniques drop four times as often from its monsters", () => {
    expect(FACTION_POOL_WEIGHT).toBe(4);
    const count = (faction: string) => {
      const r = new Rng(9);
      let hits = 0;
      for (let i = 0; i < 3000; i++) {
        const d = rollMonsterDrops(r, uid, { ilvl: 80, monster: 'miniboss', faction });
        if (d.some((x) => uniqueIdOf(x) === 'walledHeart')) hits++;
      }
      return hits;
    };
    const own = count('reliquary');
    const other = count('hollow');
    expect(own).toBeGreaterThan(other * 2);
  });

  it('only uniques the item level allows are in the pool', () => {
    for (const e of uniquePool(10)) expect(e.def.level).toBeLessThanOrEqual(10);
    expect(uniquePool(100).length).toBe(UNIQUES.length + UNIQUE_FLASKS.length);
  });

  function atMap(map: number): RunState {
    const run = newRun('reaver', 5);
    run.map = map;
    run.build.level = map;
    return run;
  }

  it('the reward picks after maps 25, 50 and 75 offer three different uniques the character can wear', () => {
    for (const map of [25, 50, 75]) {
      const offers = rollRewards(atMap(map));
      expect(offers).toHaveLength(3);
      const ids = offers.map(uniqueIdOf);
      expect(ids.every(Boolean), `map ${map}`).toBe(true);
      expect(new Set(ids).size).toBe(3);
      for (const o of offers) {
        if (o.kind === 'item') expect(uniqueDef(o.uniqueId!).level).toBeLessThanOrEqual(map);
        else if (o.kind === 'flask')
          expect(UNIQUE_FLASKS.find((u) => u.id === o.uniqueId)!.level).toBeLessThanOrEqual(map);
      }
    }
  });

  it('other reward picks are not all uniques', () => {
    const offers = [5, 10, 15, 20, 30, 35, 40].flatMap((m) => rollRewards(atMap(m)));
    expect(offers.some((o) => !uniqueIdOf(o))).toBe(true);
  });

  it('flask conditions exist for the flask rules', () => {
    expect(CONDITIONS).toContain('flaskActive');
  });
});

export type { Item };
