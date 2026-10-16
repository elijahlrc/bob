import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { FAMILIES } from '../data/affixes';
import { ITEM_BASES, itemBase } from '../data/bases';
import { FLASK_BASES } from '../data/flasks';
import type { Item } from '../data/types';
import { UNIQUES, uniqueDef } from '../data/uniques';
import {
  GEM_RATE,
  itemTags,
  rollChest,
  rollDrop,
  rollFlask,
  rollItemOf,
  rollMonsterDrops,
  rollSockets,
  rollUnique,
  socketCap,
} from './loot';

let n = 1;
const uid = () => n++;
const famType = (id: string) => FAMILIES.find((f) => f.id === id)!.type;

describe('item data (§11.2–11.3)', () => {
  it('every affix tier range runs from low to high', () => {
    for (const f of FAMILIES)
      for (const t of f.tiers) for (const [lo, hi] of t.ranges) expect(lo).toBeLessThanOrEqual(hi);
  });

  it('every unique has a valid base and a level that fits it', () => {
    for (const u of UNIQUES) {
      const b = itemBase(u.baseId);
      expect(u.level, u.id).toBeGreaterThanOrEqual(b.level);
    }
  });
});

describe('affix rolling (§11.3–11.4)', () => {
  it('respects item level, eligibility and the per-rarity limits', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 2000; i++) {
      const base = ITEM_BASES[rng.int(0, ITEM_BASES.length - 1)];
      const ilvl = rng.int(base.level, 90);
      const rarity = rng.pick(['magic', 'rare'] as const);
      const it = rollItemOf(rng, uid, base, ilvl, rarity);
      const fams = it.affixes.map((a) => a.family);
      expect(new Set(fams).size).toBe(fams.length);
      const pre = fams.filter((f) => famType(f) === 'prefix').length;
      const suf = fams.length - pre;
      if (rarity === 'magic') {
        expect(pre).toBeLessThanOrEqual(1);
        expect(suf).toBeLessThanOrEqual(1);
        expect(fams.length).toBeGreaterThanOrEqual(1);
      } else {
        expect(pre).toBeLessThanOrEqual(3);
        expect(suf).toBeLessThanOrEqual(3);
        expect(fams.length).toBeLessThanOrEqual(6);
      }
      const tags = itemTags(base);
      for (const a of it.affixes) {
        const f = FAMILIES.find((x) => x.id === a.family)!;
        const t = f.tiers[a.tier - 1];
        expect(t.minIlvl).toBeLessThanOrEqual(ilvl);
        expect(f.slots.some((s) => tags.has(s))).toBe(true);
        if (f.rareOnly) expect(rarity).toBe('rare');
        a.mods.forEach((m, k) => {
          expect(m.value).toBeGreaterThanOrEqual(t.ranges[k][0]);
          expect(m.value).toBeLessThanOrEqual(t.ranges[k][1]);
        });
      }
    }
  });

  it('rare items usually get 4–6 affixes', () => {
    const rng = new Rng(8);
    const counts: number[] = [];
    for (let i = 0; i < 300; i++)
      counts.push(rollItemOf(rng, uid, itemBase('body_ar_4'), 80, 'rare').affixes.length);
    expect(counts.every((c) => c >= 4 && c <= 6)).toBe(true);
    expect(counts.filter((c) => c === 6).length).toBeGreaterThan(10);
  });

  it('names magic items from their affixes and rares from word lists', () => {
    const rng = new Rng(9);
    const m = rollItemOf(rng, uid, itemBase('ring_fire'), 30, 'magic');
    expect(m.name).toContain(itemBase('ring_fire').name);
    const r = rollItemOf(rng, uid, itemBase('ring_fire'), 30, 'rare');
    expect(r.name.split(' ')).toHaveLength(2);
    expect(r.name).not.toContain('Ring');
  });

  it('sockets are capped by slot and item level', () => {
    const rng = new Rng(10);
    for (let i = 0; i < 500; i++) {
      expect(rollSockets(rng, itemBase('body_ar_1'), 5)).toBeLessThanOrEqual(2);
      expect(rollSockets(rng, itemBase('sword_5'), 80)).toBeLessThanOrEqual(3);
      expect(rollSockets(rng, itemBase('ring_fire'), 80)).toBe(0);
    }
    expect(socketCap(55)).toBe(6);
  });

  it('uniques roll within their authored ranges', () => {
    const rng = new Rng(11);
    const u = uniqueDef('gravehammer');
    const it = rollUnique(rng, uid, u, 50);
    expect(it.rarity).toBe('unique');
    u.mods.forEach((m, k) => {
      const v = it.uniqueMods![k].value;
      expect(v, m.stat).toBeGreaterThanOrEqual(Math.min(m.min, m.max));
      expect(v, m.stat).toBeLessThanOrEqual(Math.max(m.min, m.max));
    });
  });
});

describe('drop tables (§11.4)', () => {
  it('a magic monster drops more than a normal one, and gems drop at their own rate', () => {
    const rng = new Rng(12);
    let normal = 0;
    let magic = 0;
    let gems = 0;
    const N = 20000;
    const gear = (d: { kind: string }[]) => d.filter((x) => x.kind !== 'gem').length;
    for (let i = 0; i < N; i++) {
      const n = rollMonsterDrops(rng, uid, { ilvl: 30, monster: 'normal' });
      normal += gear(n);
      gems += n.length - gear(n);
      magic += gear(rollMonsterDrops(rng, uid, { ilvl: 30, monster: 'magic' }));
    }
    expect(magic).toBeGreaterThan(normal);
    // Gems drop on their own, at the rate in GEM_RATE.
    expect(gems / N).toBeCloseTo(GEM_RATE.normal, 2);
  });

  it('uniques drop only when their level allows', () => {
    const rng = new Rng(13);
    const N = 5000;
    for (let i = 0; i < N; i++) {
      const d = rollDrop(rng, uid, { ilvl: 10, monster: 'rare' });
      if (d.kind === 'item' && d.rarity === 'unique')
        expect(uniqueDef(d.uniqueId!).level).toBeLessThanOrEqual(10);
    }
  });

  it('chests give magic-or-better items, unique flasks or gems', () => {
    const rng = new Rng(14);
    for (let i = 0; i < 200; i++) {
      const [x] = rollChest(rng, uid, 20);
      if (x.kind === 'item') expect((x as Item).rarity).not.toBe('normal');
      else if (x.kind === 'flask') expect(x.uniqueId).toBeDefined();
      else expect(x.kind).toBe('gem');
    }
  });

  it('flasks respect their level requirement', () => {
    const rng = new Rng(15);
    for (let i = 0; i < 300; i++) {
      const f = rollFlask(rng, uid, 12);
      expect(FLASK_BASES.find((b) => b.id === f.baseId)!.level).toBeLessThanOrEqual(12);
    }
  });
});
