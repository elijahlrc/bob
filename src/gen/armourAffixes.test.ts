import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { armourStats, itemReq } from '../calc/items';
import { FAMILIES, familyMods, family } from '../data/affixes';
import { ITEM_BASES, itemBase } from '../data/bases';
import type { AffixRoll, Item } from '../data/types';
import { modsText } from '../mods/text';
import { newRun } from '../run/run';
import { Rng } from '../core/rng';
import { makeItem } from './items';
import { eligible, itemTags, rollAffix, rollBase, rollItemOf } from './loot';

let n = 93000;
const uid = () => n++;

const rolls = (baseId: string): Set<string> => {
  const tags = itemTags(itemBase(baseId));
  return new Set(FAMILIES.filter((f) => eligible(f, tags, 'rare')).map((f) => f.id));
};

/** An item with an affix of a family at a tier, rolled to the top of its range. */
function withAffix(baseId: string, familyId: string, tier?: number): Item {
  const f = family(familyId);
  const t = f.tiers[(tier ?? f.tiers.length) - 1];
  const roll: AffixRoll = {
    family: familyId,
    tier: t.tier,
    mods: familyMods(
      f,
      t.ranges.map((r) => r[1]),
    ),
  };
  const it = makeItem(uid, baseId, 84, 3, 'rare');
  it.affixes = [roll];
  return it;
}

const ARMOUR = ITEM_BASES.filter((b) => b.defenceType && b.id.endsWith('_4'));
const JEWELLERY = ITEM_BASES.filter((b) =>
  ['ring', 'amulet', 'belt', 'quiver'].includes(b.itemClass),
);

describe('hybrid pieces and defence types', () => {
  it('a piece rolls only the mods of its own set of defences', () => {
    const only = (id: string, yes: string[], no: string[]) => {
      const r = rolls(id);
      for (const f of yes) expect(r.has(f), `${id} ${f}`).toBe(true);
      for (const f of no) expect(r.has(f), `${id} ${f}`).toBe(false);
    };
    only('helmet_ar_4', ['incArmour', 'armourLocalHelm'], ['incEvasion', 'incArEv', 'esLocalHelm']);
    only(
      'helmet_arev_4',
      ['incArEv', 'flatArEvHelm', 'incArEvStun'],
      ['incArmour', 'incEvasion', 'armourLocalHelm', 'evasionLocalHelm', 'incArEs'],
    );
    only('body_eves_4', ['incEvEsBodyShield', 'flatEvEsBodyShield'], ['incEsBodyShield']);
    only('shield_es_4', ['esLocalShield', 'incEsBodyShield'], ['incArmourBodyShield']);
  });

  it('a mod with a ladder for each set of slots is rolled on only one of them', () => {
    const groups = new Map<string, string[]>();
    for (const f of FAMILIES)
      if (f.group) groups.set(f.group, [...(groups.get(f.group) ?? []), f.id]);
    expect(groups.size).toBeGreaterThan(20);
    for (const b of [...ARMOUR, ...JEWELLERY]) {
      const r = rolls(b.id);
      for (const [g, ids] of groups)
        expect(ids.filter((i) => r.has(i)).length, `${b.id} ${g}`).toBeLessThanOrEqual(1);
    }
  });

  it('attributes follow the defence type, helmets add intelligence, gloves dexterity, and shields have them too', () => {
    const attrs = (id: string) =>
      [
        'strGearRingAmulet',
        'dexGearRingAmulet',
        'intGearRingAmulet',
        'intGearHelm',
        'dexGearGlovesQuiver',
      ]
        .filter((f) => rolls(id).has(f))
        .join();
    expect(attrs('body_ev_4')).toBe('dexGearRingAmulet');
    expect(attrs('body_ar_4')).toBe('strGearRingAmulet');
    expect(attrs('body_eves_4')).toBe('dexGearRingAmulet,intGearRingAmulet');
    expect(attrs('helmet_ar_4')).toBe('strGearRingAmulet,intGearHelm');
    expect(attrs('helmet_es_4')).toBe('intGearHelm');
    expect(attrs('gloves_ar_4')).toBe('strGearRingAmulet,dexGearGlovesQuiver');
    expect(attrs('gloves_es_4')).toBe('intGearRingAmulet,dexGearGlovesQuiver');
    expect(attrs('shield_ev_4')).toBe('dexGearRingAmulet');
    expect(rolls('belt_life').has('strGearBelt')).toBe(true);
    expect(rolls('belt_life').has('dexGearGlovesQuiver')).toBe(false);
    expect(rolls('quiver_acc').has('dexGearGlovesQuiver')).toBe(true);
  });

  it('mana rolls on pieces that carry energy shield, and on rings, amulets and belts', () => {
    expect(rolls('body_es_4').has('manaGearArmour')).toBe(true);
    expect(rolls('body_ares_4').has('manaGearArmour')).toBe(true);
    expect(rolls('body_ar_4').has('manaGearArmour')).toBe(false);
    expect(rolls('boots_ev_4').has('manaGearArmour')).toBe(false);
    expect(rolls('shield_eves_4').has('manaGearArmour')).toBe(true);
    expect(rolls('ring_fire').has('manaGearRingAmulet')).toBe(true);
    expect(rolls('belt_life').has('manaGearBelt')).toBe(true);
  });

  it('every family a save can name still resolves', () => {
    // The ids the game offered before the armour pass: an item in a save refers to its affixes by these.
    const before =
      `life mana esGlobal esLocal armourLocal evasionLocal incArmour incEvasion incEs incArEv incArEs incEvEs physLocal addPhysLocal addPhysLocal2h addFireLocal addFireLocal2h addFireLocalBow addColdLocal addColdLocal2h addColdLocalBow addLightLocal addLightLocal2h addLightLocalBow addPhysAttacks addFireAttacks addColdAttacks addLightAttacks addFireSpells addFireSpells2h addColdSpells addColdSpells2h addLightSpells addLightSpells2h spellDamage spellDamageWeapon spellDamageWeapon2h eleAttacks lifeLeech gemLevel weaponGemLevel fireRes coldRes lightRes allRes chaosRes str dex int allAttr aspdLocal aspdLocalRanged aspdGlobal castSpeed castSpeedWeapon castSpeedWeapon2h critLocal critGlobal critMulti accuracy lifeRegen manaRegen lifeOnHit moveSpeed block igniteChance igniteChanceWeapon igniteChanceWeapon2h bleedChance bleedWeapon poisonChance poisonWeapon shockChance shockChanceWeapon shockChanceWeapon2h freezeChance freezeChanceWeapon freezeChanceWeapon2h reservation addChaosAttacks auraEffect areaEffect stunDuration enemyStunThreshold stunAvoid stunThreshold physAcc accuracyLocal accuracyPct lifeLeechPhys manaLeechPhys lifeOnKill manaOnKill addChaosLocal addChaosLocal2h reqReduction dotMulti spellMana fireDamage coldDamage lightDamage fireDamageSfx coldDamageSfx lightDamageSfx spellCrit burnDamage projectileSpeed fireDot coldDot chaosDot physAsChaos fireAsChaos coldAsChaos lightAsChaos spellGemLevel fireGemLevel coldGemLevel lightGemLevel chaosGemLevel physGemLevel meleeGemLevel bowGemLevel extraArrow`.split(
        ' ',
      );
    for (const id of before) expect(() => family(id), id).not.toThrow();
  });

  it('retired mods are still known and roll nowhere', () => {
    for (const id of [
      'gemLevel',
      'igniteChance',
      'bleedChance',
      'poisonChance',
      'shockChance',
      'freezeChance',
      'addChaosAttacks',
      'areaEffect',
      'auraEffect',
      'reservation',
      'stunThreshold',
      'moveSpeed',
    ]) {
      expect(family(id).slots, id).toEqual([]);
      for (const b of ITEM_BASES) expect(rolls(b.id).has(id), `${b.id} ${id}`).toBe(false);
    }
  });
});

describe('the pools against the reference tables', () => {
  // Prefixes and suffixes that can roll at item level 84. The reference game has one prefix and one suffix more on most
  // classes (item rarity), and its accuracy hybrid has a light radius Bob does not.
  const count = (id: string) => {
    const tags = itemTags(itemBase(id));
    const fams = FAMILIES.filter(
      (f) => eligible(f, tags, 'rare') && f.tiers.some((t) => t.minIlvl <= 84),
    );
    return [
      fams.filter((f) => f.type === 'prefix').length,
      fams.filter((f) => f.type === 'suffix').length,
    ];
  };
  it('match the counts of the 3.9 pools less item rarity', () => {
    const want: Record<string, [number, number]> = {
      helmet_ar_4: [7, 11],
      helmet_es_4: [9, 10],
      helmet_arev_4: [8, 12],
      gloves_ev_4: [11, 12],
      boots_es_4: [8, 8],
      body_ar_4: [6, 9],
      body_es_4: [8, 9],
      body_eves_4: [9, 11],
      shield_ar_4: [9, 14],
      shield_ev_4: [7, 15],
      shield_es_4: [21, 15],
      shield_arev_4: [10, 18],
      shield_ares_4: [16, 18],
      shield_eves_4: [15, 20],
      ring_fire: [11, 21],
      amulet_str: [14, 21],
      belt_life: [8, 12],
      quiver_acc: [8, 14],
    };
    for (const [id, c] of Object.entries(want)) expect(count(id), id).toEqual(c);
  });

  it('give each slot the flat defence of its own scale', () => {
    const top = (id: string) => family(id).tiers.at(-1)!.ranges[0][1];
    expect(top('armourLocalHelm')).toBe(138);
    expect(top('armourLocal')).toBe(60);
    expect(top('armourLocalBodyShield')).toBe(400);
    expect(top('armourBelt')).toBe(540);
    expect(top('evasionRing')).toBe(170);
    expect(top('lifeBody')).toBeGreaterThan(top('lifeRing'));
  });

  it('keep jewellery numbers at the reference scale', () => {
    const top = (id: string) => family(id).tiers.at(-1)!.ranges[0][1];
    expect(top('spellDamage')).toBe(26);
    expect(top('castSpeed')).toBe(13);
    expect(top('castSpeedRing')).toBe(7);
    expect(top('aspdGlobalRing')).toBe(7);
    expect(top('lifeLeech')).toBe(0.4);
    expect(family('lifeLeech').tiers[0].minIlvl).toBe(50);
    expect(top('lifeOnHitGearAmulet')).toBe(4);
    expect(top('bootsMoveSpeed')).toBe(35);
    expect(family('bootsMoveSpeed').type).toBe('prefix');
  });
});

describe('what the new mods do', () => {
  const build = (item: Item, slot: 'helmet' | 'body' | 'offHand' | 'belt' = 'offHand') => {
    const b = newRun('vanguard', 1).build;
    b.level = 40;
    b.equipment[slot] = item;
    return new Character(b, { areaLevel: 40 });
  };

  it('avoiding elemental ailments counts for each of them', () => {
    const plain = build(makeItem(uid, 'shield_ev_4', 84)).defence();
    const lit = build(withAffix('shield_ev_4', 'avoidElemental')).defence();
    for (const a of ['ignite', 'shock', 'chill', 'freeze'] as const)
      expect(lit.avoid[a]).toBeGreaterThan(plain.avoid[a]);
    expect(lit.avoid.bleed).toBe(plain.avoid.bleed);
  });

  it('block of spells, dodge and physical damage reduction reach the defences', () => {
    expect(
      build(withAffix('shield_es_4', 'blockSpellShield')).defence().blockSpell,
    ).toBeGreaterThan(build(makeItem(uid, 'shield_es_4', 84)).defence().blockSpell);
    expect(build(withAffix('shield_ev_4', 'dodgeSpell')).defence().dodgeSpell).toBeGreaterThan(0);
    expect(
      build(withAffix('body_ar_4', 'physReduction'), 'body').defence().physReduction,
    ).toBeGreaterThan(0);
  });

  it('a stun hybrid cuts the time you spend stunned', () => {
    const plain = build(makeItem(uid, 'body_ar_4', 84), 'body').defence();
    const lit = build(withAffix('body_ar_4', 'incArmourStun'), 'body').defence();
    expect(lit.stunDurOnSelf).toBeLessThan(plain.stunDurOnSelf);
  });

  it('a pair of defences rolls one value for both and prints as one line', () => {
    const it = withAffix('helmet_arev_4', 'incArEv');
    const [a, b] = it.affixes[0].mods;
    expect(a.value).toBe(b.value);
    expect(modsText(it.affixes[0].mods)).toEqual([`${a.value}% increased Armour and Evasion`]);
    const rng = new Rng(3);
    for (let i = 0; i < 40; i++) {
      const r = rollAffix(rng, itemBase('helmet_arev_4'), 84, 'rare', 'prefix', new Set());
      if (r?.family === 'incArEv') expect(r.mods[0].value).toBe(r.mods[1].value);
    }
  });

  it('reduced attribute requirements work on armour', () => {
    const plain = makeItem(uid, 'body_ar_4', 84);
    expect(itemReq(withAffix('body_ar_4', 'reqReductionGear')).str).toBeLessThan(
      itemReq(plain).str,
    );
  });

  it('defence rolls reach the piece', () => {
    const base = itemBase('body_ar_4').defence!.armour!;
    expect(armourStats(withAffix('body_ar_4', 'armourLocalBodyShield')).armour).toBeGreaterThan(
      base,
    );
    const shield = itemBase('shield_ar_4').defence!.block!;
    expect(armourStats(withAffix('shield_ar_4', 'block')).block).toBeGreaterThan(shield);
  });

  it('an old item keeps the affixes it has', () => {
    // A boots item from before: life and the old movement suffix. Both still resolve and add up.
    const it = makeItem(uid, 'boots_ar_4', 84, 3, 'rare');
    it.affixes = [
      { family: 'life', tier: 3, mods: familyMods(family('life'), [50]) },
      { family: 'moveSpeed', tier: 2, mods: familyMods(family('moveSpeed'), [20]) },
    ];
    expect(modsText(it.affixes.flatMap((a) => a.mods))).toContain('20% increased Movement Speed');
  });
});

describe('the bases', () => {
  it('every shield type exists in four tiers, with the implicit its type is known for', () => {
    for (const t of ['ar', 'ev', 'es', 'arev', 'ares', 'eves'])
      for (let k = 1; k <= 4; k++) expect(itemBase(`shield_${t}_${k}`).defenceType).toBe(t);
    const imp = (id: string) => modsText(itemBase(id).implicits).join(' / ');
    expect(imp('shield_ar_1')).toBe('');
    expect(imp('shield_ar_4')).toBe('+35 to maximum Life');
    expect(imp('shield_ev_4')).toBe('9% increased Movement Speed');
    expect(imp('shield_es_4')).toBe('18% increased Spell Damage');
    expect(imp('shield_ares_4')).toBe('+12% to all Elemental Resistances');
    expect(imp('shield_eves_1')).toBe('2% chance to Dodge Attack Hits');
    expect(imp('shield_eves_2')).toBe('2% chance to Dodge Spell Hits');
  });

  it('jewellery has a base for each kind of implicit, and every one drops', () => {
    expect(JEWELLERY.length).toBeGreaterThan(40);
    expect(new Set(JEWELLERY.map((b) => b.id)).size).toBe(JEWELLERY.length);
    expect(new Set(ITEM_BASES.map((b) => b.name)).size).toBe(ITEM_BASES.length);
    const rng = new Rng(7);
    const seen = new Set<string>();
    for (let i = 0; i < 6000; i++) {
      const b = rollBase(rng, 84);
      if (!b.defenceType && JEWELLERY.includes(b)) seen.add(b.id);
    }
    expect(seen.size).toBe(JEWELLERY.filter((b) => !b.uniqueOnly).length);
  });

  it('a jewellery base has no tier: low and high bases are about as likely', () => {
    const rng = new Rng(11);
    const hits = new Map<string, number>();
    for (let i = 0; i < 9000; i++) {
      const b = rollBase(rng, 84);
      if (b.itemClass === 'ring') hits.set(b.id, (hits.get(b.id) ?? 0) + 1);
    }
    const counts = [...hits.values()];
    expect(Math.max(...counts) / Math.min(...counts)).toBeLessThan(2);
  });

  it('every drop still rolls: rares of every base, at a low and a high level', () => {
    const rng = new Rng(21);
    for (const b of ITEM_BASES) {
      const it = rollItemOf(rng, uid, b, Math.max(b.level, 30), 'rare');
      expect(it.affixes.length, b.id).toBeGreaterThan(0);
    }
  });
});
