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
  uniqueIdOf,
  socketCap,
} from './loot';

let n = 1;
const uid = () => n++;
const famType = (id: string) => FAMILIES.find((f) => f.id === id)!.type;

describe('item data (§11.2–11.3)', () => {
  it('has every base that can drop (unique-only bases are extra)', () => {
    const count = (p: (b: (typeof ITEM_BASES)[number]) => boolean) =>
      ITEM_BASES.filter((b) => !b.uniqueOnly && p(b)).length;
    expect(count((b) => !!b.weapon)).toBe(60);
    expect(count((b) => ['helmet', 'gloves', 'boots', 'body'].includes(b.itemClass))).toBe(96);
    expect(count((b) => b.itemClass === 'shield')).toBe(12);
    expect(count((b) => b.itemClass === 'ring')).toBe(5);
    expect(count((b) => b.itemClass === 'amulet')).toBe(4);
    expect(count((b) => b.itemClass === 'belt')).toBe(3);
    expect(count((b) => b.itemClass === 'quiver')).toBe(2);
  });

  it('has about 50 affix families and 350 tiers spread over item levels 1–84', () => {
    expect(FAMILIES.length).toBeGreaterThanOrEqual(45);
    const tiers = FAMILIES.flatMap((f) => f.tiers);
    expect(tiers.length).toBeGreaterThanOrEqual(300);
    expect(Math.min(...tiers.map((t) => t.minIlvl))).toBe(1);
    expect(Math.max(...tiers.map((t) => t.minIlvl))).toBeGreaterThanOrEqual(80);
    for (const f of FAMILIES)
      for (const t of f.tiers) for (const [lo, hi] of t.ranges) expect(lo).toBeLessThanOrEqual(hi);
  });

  it('every base has sane requirements', () => {
    for (const b of ITEM_BASES) {
      expect(b.level).toBeGreaterThanOrEqual(1);
      expect(b.level).toBeLessThanOrEqual(100);
      for (const v of Object.values(b.req)) expect(v).toBeLessThanOrEqual(250);
    }
    for (const f of FLASK_BASES) expect(f.level).toBeLessThanOrEqual(100);
  });

  it('has at least 30 uniques with valid bases, levels spread 1–80', () => {
    expect(UNIQUES.length).toBeGreaterThanOrEqual(30);
    for (const u of UNIQUES) {
      const b = itemBase(u.baseId);
      expect(u.level).toBeGreaterThanOrEqual(b.level);
    }
    const levels = UNIQUES.map((u) => u.level);
    expect(Math.min(...levels)).toBeLessThanOrEqual(5);
    expect(Math.max(...levels)).toBeGreaterThanOrEqual(75);
    for (const id of [
      'hollowCrown',
      'gravemarrow',
      'coldheart',
      'rattleBow',
      'emberWrap',
      'ironroot',
      'bloodknot',
      'stormcall',
      'wanderersSash',
      'thornshield',
      'gravehammer',
      'stillstone',
    ])
      expect(uniqueDef(id)).toBeTruthy();
    // At least one unique per starting weapon class.
    for (const cls of ['mace2', 'bow', 'wand', 'sword', 'sceptre', 'dagger'])
      expect(
        UNIQUES.some((u) => itemBase(u.baseId).itemClass === cls),
        cls,
      ).toBe(true);
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
    expect(m.name).toContain('Cinder Ring');
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
    const it = rollUnique(rng, uid, uniqueDef('gravehammer'), 50);
    expect(it.rarity).toBe('unique');
    expect(it.uniqueMods!.find((m) => m.stat === 'enemyStunThreshold')!.value).toBe(40);
  });
});

describe('drop tables (§11.4)', () => {
  it('drop rates match the per-rarity chances', () => {
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
    expect(normal / N).toBeCloseTo(0.08, 1);
    expect(magic / N).toBeCloseTo(0.25, 1);
    // Gems drop on their own, at the rate in GEM_RATE (normal monsters: 0.6%).
    expect(gems / N).toBeCloseTo(GEM_RATE.normal, 2);
    for (let i = 0; i < 50; i++) {
      const d = rollMonsterDrops(rng, uid, { ilvl: 30, monster: 'miniboss' });
      expect(d.length).toBeGreaterThanOrEqual(3);
      // A mini-boss drops a unique from its faction's pool (EXPANSION 6.2).
      expect(d.some((x) => uniqueIdOf(x) !== undefined)).toBe(true);
    }
  });

  it('about 15% of drops are flasks; uniques only when their level allows', () => {
    const rng = new Rng(13);
    let flasks = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) {
      const d = rollDrop(rng, uid, { ilvl: 10, monster: 'rare' });
      if (d.kind === 'flask') flasks++;
      if (d.kind === 'item' && d.rarity === 'unique')
        expect(uniqueDef(d.uniqueId!).level).toBeLessThanOrEqual(10);
    }
    expect(flasks / N).toBeCloseTo(0.15, 1);
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
