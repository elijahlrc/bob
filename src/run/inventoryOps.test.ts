import { describe, expect, it } from 'vitest';
import { makeFlask, makeGem, makeItem } from '../gen/items';
import { mod } from '../mods/types';
import { Controller } from './controller';
import { affixSummary } from './affixText';
import { dryEquip, equip } from './inventory';
import {
  compareFlasks,
  compareSlots,
  filterItems,
  itemInfos,
  junkItems,
  moveGem,
  placementsFor,
  quickEquip,
  quickSocket,
  searchText,
  sortItems,
} from './inventoryOps';
import { newRun, type RunState } from './run';
import { withStarterGems } from './starterGems';

function setup(classId = 'reaver'): { run: RunState; uid: () => number } {
  const run = withStarterGems(newRun(classId, 1));
  run.build.level = 20;
  return { run, uid: () => run.nextUid++ };
}

const ids = (xs: { uid: number }[]) => xs.map((x) => x.uid);

describe('upgrade hints and quick equip', () => {
  it('reports the best slot and a positive delta for an upgrade', () => {
    const { run, uid } = setup('vanguard');
    const better = makeItem(uid, 'mace2_2', 20);
    better.affixes = [
      {
        family: 'physLocal',
        tier: 5,
        mods: [mod('damage', 'inc', 80, { damageTypes: ['physical'], local: true })],
      },
    ];
    run.inventory.push(better);
    const info = itemInfos(run).get(better.uid)!;
    expect(info.slot).toBe('mainHand');
    expect(info.dpsPct).toBeGreaterThan(5);
    expect(info.replaces?.baseId).toBe('mace2_1');
    expect(quickEquip(run, better.uid)).toMatchObject({ ok: true, slot: 'mainHand' });
    expect(run.build.equipment.mainHand!.uid).toBe(better.uid);
  });

  it('puts rings in empty slots first, then replaces one', () => {
    const { run, uid } = setup();
    run.build.level = 45;
    const r1 = makeItem(uid, 'ring_fire', 5);
    const r2 = makeItem(uid, 'ring_cold', 5);
    const r3 = makeItem(uid, 'ring_all', 40);
    run.inventory.push(r1, r2, r3);
    expect(quickEquip(run, r1.uid).ok).toBe(true);
    expect(quickEquip(run, r2.uid).ok).toBe(true);
    const slots = [run.build.equipment.ring1?.uid, run.build.equipment.ring2?.uid];
    expect(slots).toContain(r1.uid);
    expect(slots).toContain(r2.uid);
    expect(quickEquip(run, r3.uid).ok).toBe(true);
    expect(run.inventory).toHaveLength(1);
  });

  it('explains why an item cannot be equipped', () => {
    const { run, uid } = setup();
    const big = makeItem(uid, 'sword_5', 60);
    run.inventory.push(big);
    const info = itemInfos(run).get(big.uid)!;
    expect(info.equippable).toBe(false);
    expect(info.reason).toMatch(/Requires/);
    expect(quickEquip(run, big.uid).ok).toBe(false);
  });

  it('equips flasks into an empty slot, else replaces a lower one of the same kind', () => {
    const { run, uid } = setup();
    const flask = (baseId: string, name: string) => ({ ...makeFlask(uid, baseId, 20), name });
    const l3 = flask('flask_life_3', 'L3');
    run.inventory.push(l3);
    expect(quickEquip(run, l3.uid)).toMatchObject({ ok: true, flask: 2 });
    run.build.flasks = run.build.flasks.map((f, i) => f ?? flask('flask_mana_1', `m${i}`));
    const l2 = flask('flask_life_2', 'L2');
    run.inventory.push(l2);
    const r = quickEquip(run, l2.uid);
    expect(r.ok).toBe(true);
    expect(run.build.flasks[r.flask!]!.baseId).toBe('flask_life_2');
  });
});

describe('sorting and filtering', () => {
  it('sorts by slot, rarity, item level and recency; filters by group', () => {
    const { run, uid } = setup('vanguard');
    const body = makeItem(uid, 'body_ar_1', 3, 0, 'rare');
    const ring = makeItem(uid, 'ring_fire', 30, 0, 'magic');
    const wep = makeItem(uid, 'mace2_1', 12, 0, 'normal');
    const gem = makeGem(uid, 'kindle');
    run.inventory.push(body, ring, wep, gem);
    const infos = itemInfos(run);
    expect(ids(sortItems(run.inventory, infos, 'slot', false)).slice(0, 3)).toEqual([
      wep.uid,
      body.uid,
      ring.uid,
    ]);
    expect(ids(sortItems(run.inventory, infos, 'rarity', false))[0]).toBe(body.uid);
    expect(ids(sortItems(run.inventory, infos, 'ilvl', false))[0]).toBe(ring.uid);
    expect(ids(sortItems(run.inventory, infos, 'ilvl', true))[0]).not.toBe(ring.uid);
    expect(ids(sortItems(run.inventory, infos, 'newest', false))[0]).toBe(gem.uid);
    expect(ids(sortItems(run.inventory, infos, 'name', false))[0]).toBe(ring.uid);
    expect(ids(filterItems(run.inventory, infos, 'gem'))).toEqual([gem.uid]);
    expect(ids(filterItems(run.inventory, infos, 'jewellery'))).toEqual([ring.uid]);
    expect(ids(filterItems(run.inventory, infos, 'weapon'))).toEqual([wep.uid]);
  });

  it('junk is non-upgrade normal and magic items only', () => {
    const { run, uid } = setup('vanguard');
    run.build.equipment.helmet = makeItem(uid, 'helmet_ar_1', 1, 0, 'normal');
    const same = makeItem(uid, 'helmet_ar_1', 1, 0, 'normal');
    const rare = makeItem(uid, 'helmet_ar_1', 1, 0, 'rare');
    run.inventory.push(same, rare);
    const j = ids(junkItems(run));
    expect(j).toContain(same.uid);
    expect(j).not.toContain(rare.uid);
  });
});

describe('gem placement', () => {
  it('quickSocket fills free sockets; with none free it returns false', () => {
    const { run, uid } = setup();
    let filled = 0;
    for (let i = 0; i < 12; i++) {
      const g = makeGem(uid, 'swiftAssault');
      run.inventory.push(g);
      if (!quickSocket(run, g.uid)) break;
      filled++;
    }
    expect(filled).toBeGreaterThanOrEqual(1);
    expect(filled).toBeLessThan(12);
    const last = run.inventory[run.inventory.length - 1];
    expect(quickSocket(run, last.uid)).toBe(false);
  });

  it('placementsFor covers every socket and names the gem it would replace', () => {
    const { run, uid } = setup();
    const g = makeGem(uid, 'kindle');
    run.inventory.push(g);
    const ps = placementsFor(run, g.uid);
    expect(ps.length).toBeGreaterThanOrEqual(3);
    expect(ps.some((p) => p.replaces === 'Reaping Arc')).toBe(true);
  });

  it('moveGem swaps gems between sockets', () => {
    const { run } = setup();
    const [a, b] = run.build.equipment.body!.sockets.map((s) => s!.gemId);
    expect(moveGem(run, { slot: 'body', socket: 0 }, { slot: 'body', socket: 1 })).toBe(true);
    expect(run.build.equipment.body!.sockets.map((s) => s!.gemId)).toEqual([b, a]);
    expect(moveGem(run, { slot: 'body', socket: 0 }, { slot: 'body', socket: 0 })).toBe(false);
  });
});

describe('undo', () => {
  it('reverts camp changes in order and ignores no-ops', () => {
    const c = new Controller(null);
    c.startRun('vanguard', 9);
    c.act((r) => (r.unseen = []));
    expect(c.canUndo).toBe(false);
    c.act((r) => {
      r.build.equipment.mainHand = { ...r.build.equipment.mainHand!, sockets: [null] };
      r.inventory.push(makeGem(() => r.nextUid++, 'kindle'));
    });
    c.act((r) => quickSocket(r, r.inventory[0].uid));
    expect(c.run!.inventory).toHaveLength(0);
    expect(c.undo()).toBe(true);
    expect(c.run!.inventory).toHaveLength(1);
    expect(c.undo()).toBe(true);
    expect(c.run!.inventory).toHaveLength(0);
    expect(c.canUndo).toBe(false);
  });
});

describe('comparing an item with every slot it could go into', () => {
  it('gives a ring both ring slots, each with what it would replace', () => {
    const { run, uid } = setup();
    run.build.level = 45;
    const worn = makeItem(uid, 'ring_fire', 5);
    run.build.equipment.ring1 = worn;
    const ring = makeItem(uid, 'ring_cold', 5);
    run.inventory.push(ring);
    const slots = compareSlots(run, ring.uid);
    expect(slots.map((s) => s.slot)).toEqual(['ring1', 'ring2']);
    expect(slots.map((s) => s.label)).toEqual(['Ring 1', 'Ring 2']);
    expect(slots[0].equipped?.uid).toBe(worn.uid);
    expect(slots[0].toBag.map((x) => x.uid)).toEqual([worn.uid]);
    expect(slots[0].alsoMoves).toEqual([]);
    expect(slots[1].equipped).toBeUndefined();
    expect(slots[1].toBag).toEqual([]);
    expect(slots.filter((s) => s.best)).toHaveLength(1);
    // The empty slot adds the ring on top of the worn one, so it is the better of the two here.
    expect(slots[1].best).toBe(true);
    expect(slots.every((s) => s.delta !== null)).toBe(true);
  });

  it('agrees with the slot the list shows for the item', () => {
    const { run, uid } = setup('vanguard');
    run.build.level = 40;
    const a = makeItem(uid, 'sword_2', 20, 0, 'rare');
    const b = makeItem(uid, 'ring_all', 40);
    run.inventory.push(a, b);
    const infos = itemInfos(run);
    for (const it of [a, b]) {
      const best = compareSlots(run, it.uid).find((s) => s.best);
      expect(best?.slot ?? null).toBe(infos.get(it.uid)!.slot);
    }
  });

  it('lets a one-hander go in either hand unless a two-hander is worn', () => {
    const { run, uid } = setup('vanguard');
    const sword = makeItem(uid, 'sword_1', 1);
    run.inventory.push(sword);
    const slots = compareSlots(run, sword.uid);
    expect(slots.map((s) => s.slot)).toEqual(['mainHand', 'offHand']);
    expect(slots[0].check.ok).toBe(true);
    expect(slots[1].check).toMatchObject({ ok: false, reason: 'Two-handed weapon equipped' });
    expect(slots[1].delta).toBeNull();
  });

  it('says what a two-hander sends back to the bag, and that is what equip does', () => {
    const { run, uid } = setup('vanguard');
    const sword = makeItem(uid, 'sword_1', 1);
    const shield = makeItem(uid, 'shield_ar_1', 1);
    run.build.equipment.mainHand = sword;
    run.build.equipment.offHand = shield;
    const mace = makeItem(uid, 'mace2_2', 15);
    run.inventory.push(mace);
    const [main] = compareSlots(run, mace.uid);
    expect(main.slot).toBe('mainHand');
    expect(main.toBag.map((x) => x.uid).sort()).toEqual([sword.uid, shield.uid].sort());
    expect(main.alsoMoves.map((x) => x.uid)).toEqual([shield.uid]);
    // The delta is measured without the shield, as equip leaves the character.
    expect(main.delta).not.toBeNull();
    const before = run.inventory.map((x) => x.uid);
    expect(equip(run, mace.uid, 'mainHand').ok).toBe(true);
    const came = run.inventory.map((x) => x.uid).filter((u) => !before.includes(u));
    expect(came.sort()).toEqual([sword.uid, shield.uid].sort());
  });

  it('names the attribute an item is short of', () => {
    const { run, uid } = setup('vanguard');
    run.build.level = 70;
    const ward = makeItem(uid, 'shield_es_4', 60);
    run.inventory.push(ward);
    const [c] = compareSlots(run, ward.uid);
    expect(c.check.ok).toBe(false);
    expect(c.check.short).toBeDefined();
    expect(c.check.short!.have).toBeLessThan(c.check.short!.need);
  });

  it('dry equip leaves the run alone', () => {
    const { run, uid } = setup('vanguard');
    const sword = makeItem(uid, 'sword_1', 1);
    run.inventory.push(sword);
    const inv = JSON.stringify(run.inventory);
    const build = JSON.stringify(run.build);
    dryEquip(run, sword.uid, 'mainHand');
    expect(JSON.stringify(run.inventory)).toBe(inv);
    expect(JSON.stringify(run.build)).toBe(build);
  });

  it('compares a flask with the five slots and marks the one a plain equip uses', () => {
    const { run, uid } = setup();
    run.build.flasks = run.build.flasks.map((_f, i) => ({
      ...makeFlask(uid, i === 3 ? 'flask_life_1' : 'flask_mana_1', 20),
      name: `f${i}`,
    }));
    const flask = makeFlask(uid, 'flask_life_2', 20);
    run.inventory.push(flask);
    const slots = compareFlasks(run, flask.uid);
    expect(slots).toHaveLength(5);
    const chosen = slots.find((s) => s.chosen)!;
    const r = quickEquip(run, flask.uid);
    expect(r.flask).toBe(chosen.idx);
    expect(chosen.idx).toBe(3);
  });
});

describe('affix summaries', () => {
  it("lists the names of an item's affixes without their numbers, and counts the rest", () => {
    const { run, uid } = setup();
    const it = makeItem(uid, 'ring_fire', 40, 0, 'rare');
    it.affixes = [
      { family: 'life', tier: 1, mods: [mod('life', 'base', 10)] },
      { family: 'fireRes', tier: 1, mods: [mod('res.fire', 'base', 10)] },
      { family: 'coldRes', tier: 1, mods: [mod('res.cold', 'base', 10)] },
      { family: 'lightRes', tier: 1, mods: [mod('res.lightning', 'base', 10)] },
    ];
    const s = affixSummary(it);
    expect(s).toMatch(/^.+, .+, .+ \+1$/);
    expect(s).not.toMatch(/\d{2}/);
    expect(affixSummary(it, 5)).not.toMatch(/\+\d$/);
    expect(run).toBeDefined();
  });
});

describe('searching', () => {
  it('finds an item by its name, its base or the words of its affixes', () => {
    const { uid } = setup();
    const ring = makeItem(uid, 'ring_fire', 40, 0, 'rare');
    ring.affixes = [{ family: 'fireRes', tier: 1, mods: [mod('res.fire', 'base', 22)] }];
    const text = searchText(ring);
    expect(text).toContain(ring.name.toLowerCase());
    expect(text).toMatch(/fire/);
    expect(searchText(makeGem(uid, 'kindle'))).toContain('kindle');
  });
});
