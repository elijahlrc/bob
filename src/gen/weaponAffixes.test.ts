import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { itemReq, weaponStats } from '../calc/items';
import { FAMILIES, TOP_TIER_WEIGHT, familyMods, family, slotWeight } from '../data/affixes';
import { isWeaponClass, ITEM_BASES, itemBase } from '../data/bases';
import type { AffixRoll, Item } from '../data/types';
import { modText, modsText } from '../mods/text';
import { mod } from '../mods/types';
import { shownTier, rangeText } from '../run/craftPlan';
import { newRun } from '../run/run';
import { makeGem, makeItem } from './items';
import { eligible, itemTags } from './loot';

let n = 91000;
const uid = () => n++;

const WEAPONS = ITEM_BASES.filter((b) => isWeaponClass(b.itemClass) && b.id.endsWith('_5'));
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

describe('which weapons roll which affixes', () => {
  it('a rune dagger rolls spell affixes and a warstaff does not', () => {
    expect(itemTags(itemBase('runedagger_5')).has('casterWeapon')).toBe(true);
    expect(itemTags(itemBase('warstaff_5')).has('casterWeapon')).toBe(false);
    expect(rolls('runedagger_5').has('spellDamageWeapon')).toBe(true);
    expect(rolls('runedagger_5').has('fireAsChaos')).toBe(true);
    expect(rolls('warstaff_5').has('spellDamageWeapon')).toBe(false);
    expect(rolls('warstaff_5').has('castSpeed')).toBe(false);
    // The staff of the same class still does.
    expect(rolls('staff_5').has('spellDamageWeapon2h')).toBe(true);
    expect(rolls('staff_5').has('spellDamageWeapon')).toBe(false);
    expect(rolls('dagger_5').has('spellDamageWeapon')).toBe(false);
  });

  it('attributes follow the kind of weapon', () => {
    const has = (b: string, f: string) => rolls(b).has(f);
    expect([has('wand_5', 'str'), has('wand_5', 'dex'), has('wand_5', 'int')]).toEqual([
      false,
      false,
      true,
    ]);
    expect([has('bow_5', 'str'), has('bow_5', 'dex'), has('bow_5', 'int')]).toEqual([
      false,
      true,
      false,
    ]);
    expect([has('mace_5', 'str'), has('mace_5', 'dex'), has('mace_5', 'int')]).toEqual([
      true,
      false,
      false,
    ]);
    expect([has('claw_5', 'str'), has('claw_5', 'dex'), has('claw_5', 'int')]).toEqual([
      false,
      true,
      true,
    ]);
  });

  it('claws and daggers roll mana and mana regeneration, melee weapons do not roll cast speed', () => {
    for (const b of ['claw_5', 'dagger_5']) {
      expect(rolls(b).has('mana')).toBe(true);
      expect(rolls(b).has('manaRegen')).toBe(true);
    }
    expect(rolls('sword_5').has('mana')).toBe(false);
    expect(rolls('sword_5').has('castSpeedWeapon')).toBe(false);
  });

  it('every weapon rolls resistances, local accuracy and leech, and armour keeps the global accuracy', () => {
    for (const b of WEAPONS) {
      const r = rolls(b.id);
      for (const f of ['fireRes', 'chaosRes', 'accuracyLocal', 'physAcc', 'lifeLeechPhys'])
        expect(r.has(f), `${b.id} ${f}`).toBe(true);
      expect(r.has('accuracy'), `${b.id} accuracy`).toBe(false);
    }
    const helm = itemTags(itemBase('helmet_ar_1'));
    expect(eligible(family('accuracy'), helm, 'rare')).toBe(true);
    expect(eligible(family('accuracyLocal'), helm, 'rare')).toBe(false);
  });

  it('kind-specific affixes reach only their kind', () => {
    expect(rolls('bow_5').has('bowGemLevel')).toBe(true);
    expect(rolls('sword_5').has('bowGemLevel')).toBe(false);
    expect(rolls('sword_5').has('meleeGemLevel')).toBe(true);
    expect(rolls('bow_5').has('meleeGemLevel')).toBe(false);
    expect(rolls('bow_5').has('extraArrow')).toBe(true);
    expect(rolls('bow_5').has('projectileSpeed')).toBe(true);
    expect(rolls('wand_5').has('projectileSpeed')).toBe(true);
    expect(rolls('sword_5').has('projectileSpeed')).toBe(false);
  });

  it('a family can be made rarer on weapons than elsewhere', () => {
    const weapon = itemTags(itemBase('sword_5'));
    const armour = itemTags(itemBase('body_ar_1'));
    expect(slotWeight(family('fireRes'), weapon)).toBeLessThan(1);
    expect(slotWeight(family('fireRes'), armour)).toBe(1);
  });

  it('every new weapon affix can be rolled by some weapon and reads as a line', () => {
    const ids = [
      'physAcc',
      'accuracyLocal',
      'accuracyPct',
      'lifeLeechPhys',
      'manaLeechPhys',
      'lifeOnKill',
      'manaOnKill',
      'addChaosLocal',
      'reqReduction',
      'dotMulti',
      'spellMana',
      'fireDamage',
      'fireDamageSfx',
      'spellCrit',
      'burnDamage',
      'projectileSpeed',
      'fireDot',
      'chaosDot',
      'physAsChaos',
      'spellDamageWeapon',
      'spellDamageWeapon2h',
      'castSpeedWeapon',
      'aspdLocalRanged',
      'addFireLocal2h',
      'addFireLocalBow',
      'igniteChanceWeapon',
      'bleedWeapon',
      'poisonWeapon',
      'weaponGemLevel',
      'spellGemLevel',
      'fireGemLevel',
      'meleeGemLevel',
      'bowGemLevel',
      'extraArrow',
    ];
    for (const id of ids) {
      const f = family(id);
      expect(
        WEAPONS.some((b) => eligible(f, itemTags(b), 'rare')),
        id,
      ).toBe(true);
      for (const line of modsText(
        familyMods(
          f,
          f.tiers[0].ranges.map((r) => r[0]),
        ),
      ))
        expect(line, id).not.toMatch(/undefined|NaN|\bstat\b/);
    }
  });
});

describe('the 3.9 rules for a weapon kind', () => {
  const has = (b: string, f: string) => rolls(b).has(f);

  it('ailment chances are for the kinds of weapon that have them', () => {
    expect(has('wand_5', 'igniteChanceWeapon')).toBe(true);
    expect(has('staff_5', 'igniteChanceWeapon2h')).toBe(true);
    expect(has('staff_5', 'igniteChanceWeapon')).toBe(false);
    expect(has('sword_5', 'igniteChanceWeapon')).toBe(false);
    expect(has('sword_5', 'bleedWeapon')).toBe(true);
    expect(has('bow_5', 'bleedWeapon')).toBe(true);
    expect(has('claw_5', 'bleedWeapon')).toBe(false);
    expect(has('claw_5', 'poisonWeapon')).toBe(true);
    expect(has('mace_5', 'poisonWeapon')).toBe(false);
    // Gloves keep the plain chances; no weapon rolls them.
    for (const b of WEAPONS)
      for (const f of ['igniteChance', 'bleedChance', 'poisonChance'])
        expect(has(b.id, f), b.id + ' ' + f).toBe(false);
    expect(eligible(family('bleedChance'), itemTags(itemBase('gloves_ar_1')), 'rare')).toBe(true);
  });

  it('the bleed and poison hybrids carry damage with the ailment', () => {
    const f = family('bleedWeapon');
    expect(f.mods.map((m) => m.stat)).toEqual(['chance.bleed', 'damage']);
    expect(
      modsText(
        familyMods(
          f,
          f.tiers[0].ranges.map((r) => r[1]),
        ),
      ).join(' '),
    ).toMatch(/20% chance to cause Bleeding .* increased Damage with Bleeding/);
  });

  it('stun threshold is for maces, swords, axes, sceptres and staves', () => {
    for (const b of ['mace_5', 'sword_5', 'axe_5', 'sceptre_5', 'staff_5'])
      expect(has(b, 'enemyStunThreshold'), b).toBe(true);
    for (const b of ['bow_5', 'wand_5', 'claw_5', 'dagger_5'])
      expect(has(b, 'enemyStunThreshold'), b).toBe(false);
  });

  it('area of effect is not a weapon affix and socketed gem levels are +1 on attack weapons', () => {
    for (const b of WEAPONS) expect(has(b.id, 'areaEffect'), b.id).toBe(false);
    expect(has('sword_5', 'weaponGemLevel')).toBe(true);
    expect(has('bow_5', 'weaponGemLevel')).toBe(true);
    expect(has('wand_5', 'weaponGemLevel')).toBe(false);
    expect(has('staff_5', 'weaponGemLevel')).toBe(false);
    expect(has('sword_5', 'gemLevel')).toBe(false);
    expect(family('weaponGemLevel').tiers.at(-1)!.ranges[0]).toEqual([1, 1]);
  });

  it('flat damage has a scale for one hand, two hands and the bow', () => {
    const top = (id: string) => family(id).tiers.at(-1)!.ranges[1][1];
    expect(top('addFireLocal')).toBeLessThan(top('addFireLocalBow'));
    expect(top('addFireLocalBow')).toBeLessThan(top('addFireLocal2h'));
    expect(has('sword_5', 'addFireLocal')).toBe(true);
    expect(has('sword2_5', 'addFireLocal2h')).toBe(true);
    expect(has('sword2_5', 'addFireLocal')).toBe(false);
    expect(has('bow_5', 'addFireLocalBow')).toBe(true);
    expect(has('bow_5', 'addFireLocal2h')).toBe(false);
    expect(has('bow_5', 'addPhysLocal2h')).toBe(true);
    expect(has('wand_5', 'addFireLocal')).toBe(true);
    expect(has('staff_5', 'addFireSpells2h')).toBe(true);
    expect(has('staff_5', 'addFireSpells')).toBe(false);
  });

  it('bows and wands have a lower attack speed ladder, and staves a higher spell ladder than wands', () => {
    const top = (id: string) => family(id).tiers.at(-1)!.ranges[0][1];
    expect(top('aspdLocalRanged')).toBeLessThan(top('aspdLocal'));
    expect(has('bow_5', 'aspdLocalRanged')).toBe(true);
    expect(has('wand_5', 'aspdLocalRanged')).toBe(true);
    expect(has('bow_5', 'aspdLocal')).toBe(false);
    expect(has('sword_5', 'aspdLocal')).toBe(true);
    expect(top('spellDamageWeapon')).toBeLessThan(top('spellDamageWeapon2h'));
    expect(top('castSpeedWeapon')).toBeLessThan(top('castSpeedWeapon2h'));
  });

  it('the top tier of a family is a quarter as likely as the lowest', () => {
    for (const f of FAMILIES.filter((x) => x.tiers.length > 1)) {
      const w = f.tiers.map((x) => x.weight);
      expect(w[w.length - 1] / w[0], f.id).toBeCloseTo(TOP_TIER_WEIGHT, 1);
      expect(w, f.id).toEqual([...w].sort((a, b) => b - a));
    }
  });

  it('the base implicits follow the 3.9 bases', () => {
    const imp = (id: string) =>
      itemBase(id)
        .implicits.map((m) => modText(m))
        .join(' / ');
    expect(imp('mace2_1')).toBe('30% increased Stun Duration on Enemies');
    expect(imp('staff_3')).toBe('+18% to Chance to Block Attack Damage');
    expect(imp('thrust_3')).toBe('+25% to Critical Strike Multiplier');
    expect(imp('dagger_3')).toBe('30% increased Critical Strike Chance');
    expect(imp('axe_3')).toBe('');
    expect(itemBase('bow_1').implicits).toEqual([]);
  });
});

describe('weapon affixes in the engine', () => {
  const build = (weapon: Item, gems: string[], classId = 'mystic') => {
    const b = newRun(classId, 1).build;
    b.level = 40;
    b.equipment.mainHand = weapon;
    b.equipment.offHand = undefined;
    weapon.sockets = gems.map((g) => makeGem(uid, g));
    b.primaryGem = weapon.sockets[0]?.uid;
    b.flasks = [null, null, null, null, null];
    return b;
  };
  const cfg = { areaLevel: 40 };

  it('local accuracy belongs to the weapon, not to the character', () => {
    const w = withAffix('sword_5', 'accuracyLocal');
    const value = w.affixes[0].mods[0].value;
    expect(w.affixes[0].mods[0].local).toBe(true);
    expect(weaponStats(w).accuracy).toBe(value);
  });

  it('physical % and flat damage from the hybrid, chaos and fire rolls reach the weapon', () => {
    const base = weaponStats(makeItem(uid, 'sword_5', 84));
    const hybrid = weaponStats(withAffix('sword_5', 'physAcc'));
    expect(hybrid.flats[0][1]).toBeGreaterThan(base.flats[0][1]);
    expect(hybrid.accuracy!).toBeGreaterThan(base.accuracy!);
    expect(weaponStats(withAffix('sword_5', 'addChaosLocal')).flats[4][1]).toBeGreaterThan(0);
    expect(weaponStats(withAffix('sword_5', 'addChaosLocal')).flats[4][0]).toBeGreaterThan(0);
  });

  it('life on hit works for attacks and not for spells', () => {
    const w = withAffix('wand_5', 'lifeOnHit');
    const spell = new Character(build(w, ['flameBolt']), cfg);
    expect(spell.profile(spell.primary).lifeOnHit).toBe(0);
    const s = withAffix('sword_5', 'lifeOnHit');
    const attack = new Character(build(s, ['crushingBlow'], 'vanguard'), cfg);
    expect(attack.profile(attack.primary).lifeOnHit).toBeGreaterThan(0);
  });

  it('a spell skill gem level affix on a wand raises the gems of that kind', () => {
    const plain = new Character(build(makeItem(uid, 'wand_5', 84), ['flameBolt']), cfg);
    const fire = new Character(build(withAffix('wand_5', 'fireGemLevel'), ['flameBolt']), cfg);
    const cold = new Character(build(withAffix('wand_5', 'coldGemLevel'), ['flameBolt']), cfg);
    const level = (c: Character) => c.gems.find((g) => g.def.id === 'flameBolt')!.level;
    expect(level(fire)).toBeGreaterThan(level(plain));
    expect(level(cold)).toBe(level(plain));
  });

  it('melee gem levels apply to melee gems in the weapon', () => {
    const plain = new Character(
      build(makeItem(uid, 'sword_5', 84), ['crushingBlow'], 'vanguard'),
      cfg,
    );
    const lit = new Character(
      build(withAffix('sword_5', 'meleeGemLevel'), ['crushingBlow'], 'vanguard'),
      cfg,
    );
    const level = (c: Character) => c.gems.find((g) => g.def.id === 'crushingBlow')!.level;
    expect(level(lit)).toBeGreaterThan(level(plain));
  });

  it('an extra arrow adds a projectile to a bow attack', () => {
    const shots = (w: Item) => {
      const c = new Character(build(w, [], 'strider'), cfg);
      return c.profile(c.primary).projectiles;
    };
    expect(shots(withAffix('bow_5', 'extraArrow'))).toBe(shots(makeItem(uid, 'bow_5', 84)) + 1);
  });

  it('reduced attribute requirements lower what the weapon asks for', () => {
    const plain = makeItem(uid, 'sword_5', 84);
    const eased = withAffix('sword_5', 'reqReduction');
    expect(itemReq(eased).str).toBeLessThan(itemReq(plain).str);
    expect(itemReq(eased).dex).toBeLessThan(itemReq(plain).dex);
  });
});

describe('how a weapon is shown', () => {
  it('tiers are shown with 1 as the strongest', () => {
    expect(shownTier(8, 8)).toBe(1);
    expect(shownTier(1, 8)).toBe(8);
    expect(rangeText(family('physLocal'), 1)).toMatch(/tier 8/);
    expect(rangeText(family('physLocal'), 84)).toMatch(/tiers 1 to 8/);
  });
});

describe('how weapon affixes read', () => {
  it('ailment chances, spell damage and life on hit read plainly', () => {
    expect(modText(mod('chance.ignite', 'base', 12))).toBe('12% chance to Ignite');
    expect(modText(mod('chance.bleed', 'base', 12))).toBe('12% chance to cause Bleeding');
    expect(modText(mod('damage', 'inc', 40, { tags: ['spell'] }))).toBe(
      '40% increased Spell Damage',
    );
    expect(modText(mod('damage', 'inc', 40, { tags: ['spell', 'fire'] }))).toMatch(/with Spells/);
    expect(modText(mod('lifeOnHit', 'base', 3, { tags: ['attack'] }))).toBe(
      'Gain 3 Life per Enemy Hit with Attacks',
    );
    expect(modText(mod('dotMulti', 'base', 20, { damageTypes: ['fire'] }))).toBe(
      '20% to the Fire Damage over Time Multiplier',
    );
  });
});
