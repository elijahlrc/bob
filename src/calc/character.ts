import {
  ATTACK_LEVEL_MAX,
  ATTACK_LEVEL_MIN,
  BASE_ACCURACY,
  BASE_EVASION,
  BASE_LIFE,
  BASE_MANA,
  BASE_MOVE_SPEED,
  DEX_ACCURACY,
  DEX_EVASION_INC,
  FISTS,
  INT_ES_INC,
  INT_MANA,
  STR_LIFE,
  STR_MELEE_PHYS_INC,
} from '../data/constants';
import { classDef } from '../data/classes';
import { itemBase, isWeaponClass } from '../data/bases';
import { gemDef, type AuraGemDef, type GemDef, type SupportGemDef } from '../data/gems';
import { getTree } from '../data/tree';
import {
  EQUIP_SLOTS,
  type Attrs,
  type Build,
  type EquipSlot,
  type GemItem,
  type Item,
} from '../data/types';
import { ModDB, type ModCtx } from '../mods/modDb';
import {
  condBit,
  mod,
  tagMask,
  type CondId,
  type Mod,
  type SkillTag,
  type StatId,
} from '../mods/types';
import { expectedAilments, expectedHit, NO_SHIFT, type Defence, type TargetState } from './combat';
import { defenceFromDb } from './defence';
import { flaskSpec, type FlaskSpec } from './flasks';
import { armourReduction, effectiveRes, hitChance, monsterHit } from './formulas';
import {
  DEFAULT_ATTACK,
  DEFAULT_BOW_ATTACK,
  gemLevel,
  gemMods,
  levelValue,
  resolveActive,
  type SkillDef,
} from './gems';
import { itemGlobalMods, socketedGemBonus, weaponStats } from './items';
import { referenceMonster } from './monster';
import { buildProfile, type HandStats, type SkillProfile } from './skill';

export type CalcConfig = {
  /** Conditions assumed true (calc engine toggles). */
  conds?: CondId[];
  /** Area level for the reference monster. */
  areaLevel?: number;
  resistPenalty?: number;
  /** Distance to the target for distance-scaled skills. */
  targetDistance?: number;
};

export type SocketedGem = {
  gem: GemItem;
  def: GemDef;
  slot: EquipSlot;
  socket: number;
  level: number;
};

export type SkillChoice = {
  key: string;
  gemUid: number | null;
  skill: SkillDef;
  supports: SocketedGem[];
  costMult: number;
  usable: boolean;
  reason?: string;
};

export type AuraState = {
  gem: SocketedGem;
  def: AuraGemDef;
  reserved: number;
  active: boolean;
};

export type SkillSheet = {
  name: string;
  id: string;
  isDefault: boolean;
  avgHit: number;
  perType: number[];
  critChance: number;
  critMulti: number;
  hitChance: number;
  usesPerSec: number;
  stunChance: number;
  hitDps: number;
  igniteDps: number;
  bleedDps: number;
  poisonDps: number;
  ailmentDps: number;
  totalDps: number;
  /** Fraction of uses the mana (or life) regeneration can pay for. */
  sustain: number;
  /** DPS blending in the default attack for the unsustained share. */
  sustainedDps: number;
  cost: number;
  range: number;
};

export type CharacterSheet = {
  level: number;
  attrs: Attrs;
  life: number;
  mana: number;
  es: number;
  reservedMana: number;
  reservedLife: number;
  armour: number;
  evasion: number;
  blockAttack: number;
  blockSpell: number;
  res: number[];
  maxRes: number[];
  stunThreshold: number;
  stunAvoid: number;
  moveSpeed: number;
  lifeRegen: number;
  manaRegen: number;
  skill: SkillSheet;
  ehp: number;
  auras: { name: string; reserved: number; active: boolean }[];
  warnings: string[];
};

const DUAL_TAGS: SkillTag[] = ['dualWield'];
const SHIELD_TAGS: SkillTag[] = ['shield'];

function supportApplies(s: SupportGemDef, skill: SkillDef): boolean {
  return s.supports.length === 0 || s.supports.some((t) => skill.tags.includes(t));
}

/**
 * The calc engine (§8.1). Construct once per build change; query profiles and defences by
 * condition mask (cached) from the sim, or `sheet()` for the UI.
 */
export class Character {
  readonly build: Build;
  readonly config: Required<CalcConfig>;
  readonly attrs: Attrs;
  readonly db: ModDB;
  readonly gems: SocketedGem[] = [];
  readonly auras: AuraState[] = [];
  readonly reservedMana: number = 0;
  readonly reservedLife: number = 0;
  readonly actives: SkillChoice[] = [];
  readonly primary: SkillChoice;
  readonly defaultAttack: SkillChoice;
  readonly hands: HandStats[];
  readonly dualWielding: boolean;
  readonly holdingShield: boolean;
  readonly flasks: FlaskSpec[];
  readonly relevantConds: number;
  readonly configConds: number;
  readonly warnings: string[] = [];
  private profiles = new Map<string, SkillProfile>();
  private defences = new Map<number, Defence>();
  private flaskDbs = new Map<number, ModDB>();
  readonly statValue: (s: StatId) => number;

  constructor(build: Build, config: CalcConfig = {}) {
    this.build = build;
    this.config = {
      conds: config.conds ?? [],
      areaLevel: config.areaLevel ?? build.level,
      resistPenalty: config.resistPenalty ?? 0,
      targetDistance: config.targetDistance ?? 4,
    };
    let cc = 0;
    for (const c of this.config.conds) cc |= condBit(c);
    this.configConds = cc;
    const cls = classDef(build.classId);
    const level = build.level;

    // Weapons and loadout.
    const main = build.equipment.mainHand;
    const off = build.equipment.offHand;
    const offBase = off ? itemBase(off.baseId) : null;
    this.dualWielding = !!(main && off && offBase && isWeaponClass(offBase.itemClass));
    this.holdingShield = offBase?.itemClass === 'shield';
    if (main) {
      this.hands = [weaponStats(main)];
      if (this.dualWielding) this.hands.push(weaponStats(off!));
    } else {
      this.hands = [
        {
          flats: [
            [FISTS.min, FISTS.max],
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
          ],
          aps: FISTS.aps,
          crit: FISTS.crit,
          range: 1.2,
          tags: ['unarmed'],
        },
      ];
    }

    // 1. Static mods: class, level, tree, items.
    const mods: Mod[] = [
      mod('str', 'base', cls.attrs.str, { source: { kind: 'class', id: cls.id } }),
      mod('dex', 'base', cls.attrs.dex, { source: { kind: 'class', id: cls.id } }),
      mod('int', 'base', cls.attrs.int, { source: { kind: 'class', id: cls.id } }),
      mod('life', 'base', BASE_LIFE(level)),
      mod('mana', 'base', BASE_MANA(level)),
      mod('evasion', 'base', BASE_EVASION(level)),
      mod('accuracy', 'base', BASE_ACCURACY(level)),
      mod('moveSpeed', 'base', BASE_MOVE_SPEED),
      mod('damage.min', 'base', ATTACK_LEVEL_MIN * level, {
        damageTypes: ['physical'],
        tags: ['attack'],
      }),
      mod('damage.max', 'base', ATTACK_LEVEL_MAX * level, {
        damageTypes: ['physical'],
        tags: ['attack'],
      }),
    ];
    const tree = getTree();
    for (const id of build.allocated) {
      const n = tree.nodes[id];
      if (n) for (const m of n.mods) mods.push({ ...m, source: { kind: 'tree', id: String(id) } });
    }
    for (const slot of EQUIP_SLOTS) {
      const it = build.equipment[slot];
      if (it) mods.push(...itemGlobalMods(it));
    }
    const db0 = new ModDB(mods);
    const ctx0: ModCtx = { tags: 0, ancestry: 0, conds: cc, statValue: () => 0 };

    // 2. Attributes.
    const all = db0.sum('base', 'allAttr', ctx0);
    const attr = (s: 'str' | 'dex' | 'int') =>
      Math.round((db0.sum('base', s, ctx0) + all) * db0.mult(s, ctx0));
    this.attrs = { str: attr('str'), dex: attr('dex'), int: attr('int') };
    const attrs = this.attrs;
    this.statValue = (s: StatId) =>
      s === 'str'
        ? attrs.str
        : s === 'dex'
          ? attrs.dex
          : s === 'int'
            ? attrs.int
            : s === 'level'
              ? level
              : 0;
    const src = { kind: 'base' as const, id: 'attributes' };
    const aMods: Mod[] = [
      mod('life', 'base', attrs.str * STR_LIFE, { source: src }),
      mod('damage', 'inc', attrs.str * STR_MELEE_PHYS_INC, {
        damageTypes: ['physical'],
        tags: ['melee'],
        source: src,
      }),
      mod('accuracy', 'base', attrs.dex * DEX_ACCURACY, { source: src }),
      mod('mana', 'base', attrs.int * INT_MANA, { source: src }),
      mod('es', 'inc', attrs.int * INT_ES_INC, { source: src }),
    ];
    if (db0.flag('strongarm', ctx0))
      aMods.push(
        mod('damage', 'inc', attrs.str * STR_MELEE_PHYS_INC, {
          damageTypes: ['physical'],
          tags: ['projectile', 'attack'],
          source: src,
        }),
      );
    if (!db0.flag('evasionToArmour', ctx0))
      aMods.push(mod('evasion', 'inc', attrs.dex * DEX_EVASION_INC, { source: src }));
    db0.addAll(aMods);

    // 3. Gems.
    for (const slot of EQUIP_SLOTS) {
      const it = build.equipment[slot];
      if (!it) continue;
      const bonus = socketedGemBonus(it);
      it.sockets.forEach((g, socket) => {
        if (!g) return;
        const def = gemDef(g.gemId);
        this.gems.push({ gem: g, def, slot, socket, level: gemLevel(def, level, attrs, bonus) });
      });
    }
    const weaponTags = new Set<SkillTag>(this.hands.flatMap((h) => h.tags));
    for (const sg of this.gems) {
      if (sg.def.kind !== 'active') continue;
      const skill = resolveActive(sg.def, sg.level);
      if (skill.behaviour.kind === 'melee' && skill.behaviour.range2h && weaponTags.has('twoHand'))
        skill.behaviour = { ...skill.behaviour, range: skill.behaviour.range2h };
      const supports = this.gems.filter(
        (o) => o.slot === sg.slot && o.def.kind === 'support' && supportApplies(o.def, skill),
      );
      let costMult = 1;
      for (const s of supports) costMult *= (s.def as SupportGemDef).costMult;
      let usable = true;
      let reason: string | undefined;
      if (skill.requiresWeapon && !skill.requiresWeapon.some((t) => weaponTags.has(t))) {
        usable = false;
        reason = `${skill.name} needs a ${skill.requiresWeapon.join(' or ')}`;
      }
      if (skill.id === 'venomCut' && weaponTags.has('twoHand')) {
        usable = false;
        reason = `${skill.name} needs a one-handed weapon`;
      }
      this.actives.push({
        key: `gem${sg.gem.uid}`,
        gemUid: sg.gem.uid,
        skill,
        supports,
        costMult,
        usable,
        reason,
      });
    }
    const isBow = weaponTags.has('bow');
    const dflt = isBow ? DEFAULT_BOW_ATTACK : DEFAULT_ATTACK;
    this.defaultAttack = {
      key: 'default',
      gemUid: null,
      skill: {
        ...dflt,
        behaviour:
          dflt.behaviour.kind === 'melee'
            ? { kind: 'melee', range: this.hands[0].range }
            : dflt.behaviour,
      },
      supports: [],
      costMult: 1,
      usable: true,
    };
    const chosen =
      this.actives.find((a) => a.gemUid === build.primaryGem) ?? this.actives.find((a) => a.usable);
    if (chosen && !chosen.usable) this.warnings.push(chosen.reason ?? 'Primary skill unusable');
    this.primary = chosen && chosen.usable ? chosen : this.defaultAttack;

    // 4. Auras and reservation.
    const pre = defenceFromDb(db0, ctx0, { isPlayer: true, resistPenalty: 0 });
    const costLife = db0.flag('skillsCostLife', ctx0);
    const pool = costLife ? pre.maxLife : pre.maxMana;
    const red = Math.min(0.95, db0.sum('base', 'reducedReservation', ctx0) / 100);
    let reserved = 0;
    const auraEffect = db0.mult('auraEffect', ctx0);
    for (const sg of this.gems) {
      if (sg.def.kind !== 'aura') continue;
      const def = sg.def;
      const base = def.reservePct
        ? (def.reservePct / 100) * pool
        : levelValue(def.reserveFlat ?? 0, sg.level);
      const r = Math.ceil(base * (1 - red));
      const active = reserved + r <= pool;
      if (active) {
        reserved += r;
        db0.addAll(
          gemMods(def.mods, sg.level, def.id).map((m) => ({
            ...m,
            value: m.value * auraEffect,
            source: { kind: 'aura', id: def.id },
          })),
        );
      } else {
        this.warnings.push(`${def.name} is inactive: not enough ${costLife ? 'life' : 'mana'}`);
      }
      this.auras.push({ gem: sg, def, reserved: r, active });
    }
    if (costLife) this.reservedLife = reserved;
    else this.reservedMana = reserved;
    this.db = db0;
    this.relevantConds = db0.condsUsed() | condBit('onLowLife') | condBit('overloadActive');
    this.flasks = build.flasks.filter((f) => f !== null).map((f) => flaskSpec(f!, db0));
  }

  private extraTags(): SkillTag[] {
    return [...(this.dualWielding ? DUAL_TAGS : []), ...(this.holdingShield ? SHIELD_TAGS : [])];
  }

  /** The profile of a skill for a condition mask (cached). */
  profile(choice: SkillChoice, conds: number = this.configConds): SkillProfile {
    const c = conds & this.relevantConds;
    const k = `${choice.key}|${c}`;
    let p = this.profiles.get(k);
    if (p) return p;
    const supportMods: Mod[] = [];
    for (const s of choice.supports)
      supportMods.push(...gemMods((s.def as SupportGemDef).mods, s.level, s.def.id));
    const db =
      choice.skill.mods.length || supportMods.length
        ? new ModDB([...this.db.mods(), ...choice.skill.mods, ...supportMods])
        : this.db;
    p = buildProfile({
      skill: choice.skill,
      db,
      hands: choice.skill.type === 'attack' ? this.hands : [],
      extraTags: this.extraTags(),
      costMult: choice.costMult,
      conds: c,
      statValue: this.statValue,
    });
    this.profiles.set(k, p);
    return p;
  }

  private dbForFlasks(flaskMask: number): ModDB {
    if (!flaskMask) return this.db;
    let db = this.flaskDbs.get(flaskMask);
    if (!db) {
      const extra: Mod[] = [];
      this.flasks.forEach((f, i) => {
        if (flaskMask & (1 << i)) extra.push(...f.buff);
      });
      db = new ModDB([...this.db.mods(), ...extra]);
      this.flaskDbs.set(flaskMask, db);
    }
    return db;
  }

  /** Defences for a condition mask and a bitmask of active flasks (cached). */
  defence(conds: number = this.configConds, flaskMask = 0): Defence {
    const c = conds & this.relevantConds;
    const k = c * 64 + flaskMask;
    let d = this.defences.get(k);
    if (!d) {
      const db = this.dbForFlasks(flaskMask);
      d = defenceFromDb(
        db,
        { tags: 0, ancestry: 0, conds: c, statValue: this.statValue },
        {
          isPlayer: true,
          resistPenalty: this.config.resistPenalty,
          reservedLife: this.reservedLife,
        },
      );
      this.defences.set(k, d);
    }
    return d;
  }

  /** Expected-value skill stats against a target (default: the reference monster). */
  skillSheet(choice: SkillChoice = this.primary, target?: TargetState): SkillSheet {
    const p = this.profile(choice);
    const t: TargetState = target ?? {
      def: referenceMonster(this.config.areaLevel).defence,
      shock: 0,
      resShift: [...NO_SHIFT],
    };
    const d = this.config.targetDistance;
    const usesPerSec = 1 / p.useTime;
    const perType = [0, 0, 0, 0, 0];
    let perUse = 0;
    let hc = 0;
    let stun = 0;
    let cc = 0;
    let cm = 0;
    let ign = 0;
    let bl = 0;
    let po = 0;
    const n = p.hands.length;
    for (const h of p.hands) {
      const ex = expectedHit(p, h, t, d);
      const w = p.bothHands ? 1 : 1 / n;
      for (let i = 0; i < 5; i++) perType[i] += ex.perType[i] / n;
      perUse += ex.perUse * w;
      hc += ex.hitChance / n;
      stun += ex.stunChance / n;
      cc += h.critChance / n;
      cm += h.critMulti / n;
      const land = ex.hitChance * (1 - ex.blockChance);
      const handUses = p.bothHands ? usesPerSec : usesPerSec / n;
      const ail = expectedAilments(p, h, t, d, handUses, land);
      ign = Math.max(ign, ail.igniteDps);
      bl = Math.max(bl, ail.bleedDps);
      po += ail.poisonDps;
    }
    const hitDps = perUse * usesPerSec;
    const ailmentDps = ign + bl + po;
    const totalDps = hitDps + ailmentDps;
    // Sustain: the share of uses the resource pool can pay for; the rest fall back to the default attack.
    let sustain = 1;
    let sustainedDps = totalDps;
    if (p.cost > 0 && choice.gemUid !== null) {
      const d = this.defence();
      const costLife = this.db.flag('skillsCostLife');
      const regen = costLife ? d.lifeRegen : d.manaRegen;
      sustain = Math.min(1, regen / (p.cost * usesPerSec));
      if (sustain < 1) {
        const dflt = this.skillSheet(this.defaultAttack, target);
        sustainedDps = sustain * totalDps + (1 - sustain) * dflt.totalDps;
      }
    }
    return {
      name: choice.skill.name,
      id: choice.skill.id,
      isDefault: choice.gemUid === null,
      avgHit: perType.reduce((a, b) => a + b, 0),
      perType,
      critChance: cc,
      critMulti: cm,
      hitChance: hc,
      usesPerSec,
      stunChance: stun,
      hitDps,
      igniteDps: ign,
      bleedDps: bl,
      poisonDps: po,
      ailmentDps,
      totalDps,
      sustain,
      sustainedDps,
      cost: p.cost,
      range: skillRange(p),
    };
  }

  /** Effective HP against the reference monster's typical hit mix (§8.1). */
  ehp(def: Defence = this.defence()): number {
    const level = this.config.areaLevel;
    const hit = monsterHit(level);
    const mon = referenceMonster(level);
    const pool = def.maxLife - this.reservedLife + def.maxEs;
    const mix: [number, number][] = [
      [0, 0.55],
      [1, 0.15],
      [2, 0.15],
      [3, 0.15],
    ];
    let taken = 0;
    for (const [t, w] of mix) {
      const dmg = hit;
      let m: number;
      if (t === 0) m = 1 - Math.min(0.9, armourReduction(def.armour, dmg) + def.physReduction);
      else m = 1 - effectiveRes(def.res[t], def.maxRes[t]) / 100;
      taken += w * m;
    }
    const hc = def.cannotEvade
      ? 1
      : hitChance(mon.defence.maxLife > 0 ? mon.profile(0).hands[0].accuracy : 0, def.evasion);
    const avoid = hc * (1 - def.blockAttack);
    return pool / Math.max(0.01, taken * def.damageTakenMult * avoid);
  }

  sheet(): CharacterSheet {
    const d = this.defence();
    return {
      level: this.build.level,
      attrs: this.attrs,
      life: d.maxLife,
      mana: d.maxMana,
      es: d.maxEs,
      reservedMana: this.reservedMana,
      reservedLife: this.reservedLife,
      armour: d.armour,
      evasion: d.evasion,
      blockAttack: d.blockAttack,
      blockSpell: d.blockSpell,
      res: d.res.map((r, i) => Math.min(r, d.maxRes[i])),
      maxRes: d.maxRes,
      stunThreshold: d.stunThreshold,
      stunAvoid: d.stunAvoid,
      moveSpeed: d.moveSpeed,
      lifeRegen: d.lifeRegen,
      manaRegen: d.manaRegen,
      skill: this.skillSheet(),
      ehp: this.ehp(d),
      auras: this.auras.map((a) => ({ name: a.def.name, reserved: a.reserved, active: a.active })),
      warnings: this.warnings,
    };
  }
}

export function skillRange(p: SkillProfile): number {
  const b = p.skill.behaviour;
  if (b.kind === 'melee') return b.range;
  if (b.kind === 'chain') return b.range;
  return b.range ?? 8;
}

/** Tags of a skill use (for UI and tests). */
export function useTags(p: SkillProfile): number {
  return p.tagMask | tagMask([]);
}

export type { Item };

/** §8.1: pure, synchronous character sheet for a build. */
export function computeCharacter(build: Build, config: CalcConfig = {}): CharacterSheet {
  return new Character(build, config).sheet();
}

export type SheetDiff = {
  dps: number;
  life: number;
  es: number;
  mana: number;
  res: number[];
  ehp: number;
};

/** Item-compare deltas (§8.1): `b − a`. */
export function diffSheets(a: CharacterSheet, b: CharacterSheet): SheetDiff {
  return {
    dps: b.skill.totalDps - a.skill.totalDps,
    life: b.life - a.life,
    es: b.es - a.es,
    mana: b.mana - a.mana,
    res: b.res.map((r, i) => r - a.res[i]),
    ehp: b.ehp - a.ehp,
  };
}
