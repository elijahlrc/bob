import {
  ATTACK_LEVEL_MAX,
  ATTACK_LEVEL_MIN,
  DUAL_WIELD_BLOCK,
  DUAL_WIELD_MORE_PHYS,
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
  spellBaseDamage,
} from '../data/constants';
import { MINIONS, MINION_ENEMY_RES } from '../data/minions';
import { minionUptime } from './minion';
import {
  CHARGE_KINDS,
  chargeMods,
  hasChargeSource,
  maxChargesOf,
  noCharges,
  type ChargeCounts,
  type ChargeKind,
} from './charges';
import {
  ASSUMED_RAGE,
  BASE_MAX_RAGE,
  BUFFS,
  BUFF_IDS,
  DYN_SHIFT,
  hasRageSource,
  hasRecoverSource,
  rageMods,
  type BuffId,
} from '../data/buffs';
import { classDef } from '../data/classes';
import {
  ALL_HEX_IDS,
  BASE_HEX_LIMIT,
  HEXES,
  HEX_SECONDS,
  hexEffect,
  hexTotals,
  type HexId,
} from '../data/hexes';
import type { TriggerDef } from '../data/triggers';
import { itemBase, isWeaponClass } from '../data/bases';
import {
  MAX_GEM_LEVEL,
  gemDef,
  type AuraGemDef,
  type GemDef,
  type SupportGemDef,
} from '../data/gems';
import { resolveSupports, typesAllow } from '../data/skillTypes';
import { getTree } from '../data/tree';
import { KEYSTONES } from '../data/tree/keystones';
import {
  EQUIP_SLOTS,
  type Attrs,
  type Build,
  type EquipSlot,
  type GemItem,
  type Item,
} from '../data/types';
import { CondIndex, ModDB, type ModCtx } from '../mods/modDb';
import { AURA_CONDS, WIELD_CONDS } from './staticConds';
import {
  mod,
  tagMask,
  type CondId,
  type Mod,
  type SkillTag,
  type StatId,
  maskAnd,
  maskOr,
  SKILL_TAGS,
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
  gemTagsOf,
  levelValue,
  resolveActive,
  type SkillDef,
} from './gems';
import {
  armourStats,
  grantedKeystones,
  itemGlobalMods,
  itemHasRule,
  itemMods,
  socketedGemBonus,
  socketedReservationReduction,
  weaponStats,
} from './items';
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
  /**
   * Steady-state conditions for planning (EXPANSION 5.10), added to `conds`: what is true for most of a
   * fight. 'clearing' assumes recent kills, hits taken and flask use; 'boss' is the same without kills.
   */
  steady?: SteadyMode;
  /** Extra mods on the player (map affixes). */
  extraMods?: Mod[];
  /**
   * Charges held right now (the sim passes them). Without it the sheet assumes the maximum of every kind that has a
   * source, as it does for conditions.
   */
  charges?: ChargeCounts;
};

export type SteadyMode = 'clearing' | 'boss';

/** The incoming damage mix of the reference monster: shares of physical, lightning, cold, fire and chaos. */
export const DEFAULT_HIT_MIX: readonly number[] = [0.5, 0.14, 0.14, 0.14, 0.08];

const nodeModsCache = new WeakMap<object, Mod[]>();

/** What an allocated passive gives, with its source (the same objects every time: the passive tree never changes). */
function nodeMods(n: { mods: readonly Mod[] }, id: number): Mod[] {
  let out = nodeModsCache.get(n);
  if (!out)
    nodeModsCache.set(
      n,
      (out = n.mods.map((m) => ({ ...m, source: { kind: 'tree' as const, id: String(id) } }))),
    );
  return out;
}

export type SocketedGem = {
  gem: GemItem;
  def: GemDef;
  slot: EquipSlot;
  socket: number;
  level: number;
};

/** What a skill puts on the ground instead of casting: a totem or a brand (shoots on its own), a trap or a mine (goes off when enemies come). */
export type DeployKind = 'totem' | 'brand' | 'trap' | 'mine';

function deployKind(own: readonly string[], all: ReadonlySet<string>): DeployKind | undefined {
  for (const k of ['totem', 'brand', 'trap', 'mine'] as const)
    if (all.has(k) || own.includes(k)) return k;
  return undefined;
}

/** The Blasphemy support on a curse skill, if there is one: the curse is a standing aura, not a cast. */
export function blasphemyOf(c: SkillChoice): { reservePct: number } | undefined {
  if (c.skill.utility?.kind !== 'curse') return undefined;
  for (const s of c.supports) {
    const b = (s.def as SupportGemDef).blasphemy;
    if (b) return b;
  }
  return undefined;
}

export type SkillChoice = {
  key: string;
  gemUid: number | null;
  skill: SkillDef;
  supports: SocketedGem[];
  /** Skill tags the supports add (a totem support adds `totem`). */
  addedTags: SkillTag[];
  costMult: number;
  usable: boolean;
  reason?: string;
  /** The skill's cost is paid in life instead of mana. */
  costsLife: boolean;
  /** Cast only by a trigger: never the primary skill. */
  triggered?: boolean;
  /** The skill is put on the ground as a totem, brand, trap or mine (a support or the gem itself makes it so). */
  deploy?: DeployKind;
};

/** A trigger an equipped item carries, with the skills it can cast. */
export type TriggerSource = {
  /** Unique within the character: slot and index. */
  key: string;
  def: TriggerDef;
  slot: EquipSlot;
  /** The skills the trigger casts (for `castSocketed` and `castGranted` effects). */
  skills: SkillChoice[];
  /** Tags the triggering skill use must carry. */
  tagMask: number;
};

/** One triggered skill on the sheet: how often it fires and what it does. */
export type TriggeredSheet = {
  key: string;
  /** The slot of the item whose trigger casts it. */
  source: EquipSlot;
  skill: SkillSheet;
  usesPerSec: number;
  dps: number;
  manaPerSec: number;
};

/** One secondary skill on the sheet: how often it is cast and what it does. */
/** A hex the character applies on hit: which, at what gem level, and its effect after curse effect, in percent. */
export type PlayerHex = { id: HexId; level: number; effect: number };

export type SecondarySheet = {
  key: string;
  skill: SkillSheet;
  /** Seconds between casts: the cooldown, or the use time if that is longer. */
  cooldown: number;
  usesPerSec: number;
  dps: number;
  manaPerSec: number;
};

/** The DPS a character sheet reports: the primary skill, its triggered skills and its secondary casts. */
export function sheetDps(s: CharacterSheet): number {
  return s.skill.sustainedDps + s.triggeredDps + s.secondaryDps + s.minionDps;
}

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
  /** Skills cast by triggers, and their combined DPS (counted with the primary skill's). */
  triggered: TriggeredSheet[];
  triggeredDps: number;
  /** Hexes put on enemies that are hit. */
  hexes: PlayerHex[];
  /** Secondary casts (EXPANSION 5.5a): every other equipped active skill, cast when ready. */
  secondary: SecondarySheet[];
  secondaryDps: number;
  /** What the summoned minions add, in damage a second (they are assumed standing). */
  minionDps: number;
  ehp: number;
  auras: { name: string; reserved: number; active: boolean }[];
  warnings: string[];
};

/** A secondary skill with no cooldown of its own waits this many of its uses, and at least this long (tunable). */
export const SECONDARY_COOLDOWN_USES = 6;
export const SECONDARY_MIN_COOLDOWN = 3;

const GAIN_STAT = /^(buffOn|chargeOn|rageOn|recover|recoverPct)\./;
const DUAL_TAGS: SkillTag[] = ['dualWield'];
const SHIELD_TAGS: SkillTag[] = ['shield'];

/** Whether a support's rules allow it to support the skill (before other supports add their types). */
function supportApplies(s: SupportGemDef, skill: SkillDef): boolean {
  return typesAllow(s, new Set(skill.types));
}

/**
 * The calc engine (§8.1). Construct once per build change; query profiles and defences by
 * condition mask (cached) from the sim, or `sheet()` for the UI.
 */
export class Character {
  readonly build: Build;
  readonly config: Required<Omit<CalcConfig, 'steady' | 'extraMods' | 'charges'>> &
    Pick<CalcConfig, 'steady' | 'charges'> & { extraMods: Mod[] };
  readonly attrs: Attrs;
  readonly db: ModDB;
  readonly gems: SocketedGem[] = [];
  readonly auras: AuraState[] = [];
  readonly reservedMana: number = 0;
  readonly reservedLife: number = 0;
  readonly actives: SkillChoice[] = [];
  readonly triggers: TriggerSource[] = [];
  readonly primary: SkillChoice;
  /** Charges held, and the most of each kind the character can hold. */
  readonly charges: ChargeCounts;
  readonly chargeMax: ChargeCounts;
  /** The hexes the character puts on the enemies it hits (EXPANSION 5.7), strongest effect first, within the hex limit. */
  readonly hexes: PlayerHex[] = [];
  /** How many of the hexes of the character a target holds at once. */
  hexLimit = BASE_HEX_LIMIT;
  /** A burning aura (Righteous Fire's analog): fire damage to enemies near, and to the character, as a percent of maximum life a second. */
  readonly burn: { pct: number; self: number } = { pct: 0, self: 0 };
  /** The utility skills (curses, buffs, warcries, blinks) the character casts by policy, not as damage. */
  readonly utilities: SkillChoice[] = [];
  /** The curses the character casts as skills (utility gems), strongest first. */
  readonly castCurses: PlayerHex[] = [];
  /** What the sheet assumes an enemy carries: the hit-applied hexes and the cast curses, within the hex limit. */
  readonly sheetHexes: PlayerHex[] = [];
  /** Which kinds of charge something can grant. */
  readonly chargeSource: Record<ChargeKind, boolean>;
  /** Which buffs something can grant (their effects are in the database, behind their conditions), and whether rage. */
  readonly buffSource: Record<BuffId, boolean>;
  readonly rageSource: boolean;
  /** Whether anything can grant a buff or rage (so the sim can skip rolling when nothing can). */
  readonly anyGain: boolean;
  /** The most rage the character can hold. */
  readonly rageMax: number;
  /** The dynamic state (rage) the sheet assumes when none is given: part of the cache key like active flasks. */
  private readonly defaultDyn: number;
  /** Every other usable active skill that the primary's position can reach (see `secondaries`). */
  private secondaryCandidates: SkillChoice[] = [];
  private secondaryCache: SkillChoice[] | null = null;
  readonly defaultAttack: SkillChoice;
  readonly hands: HandStats[];
  readonly dualWielding: boolean;
  /** Tags of the weapons held (staff, bow, twoHand, ...). */
  readonly weaponTags: Set<SkillTag>;
  readonly holdingShield: boolean;
  readonly flasks: FlaskSpec[];
  /** The bit of each condition this character's mods use; every ModDB of the character shares it. */
  readonly cond = new CondIndex();
  configConds: number;
  readonly warnings: string[] = [];
  private profiles = new Map<string, SkillProfile>();
  private skillDbs = new Map<string, ModDB>();
  private defences = new Map<string, Defence>();
  private flaskDbs = new Map<number, ModDB>();
  readonly statValue: (s: StatId) => number;

  constructor(build: Build, config: CalcConfig = {}) {
    this.build = build;
    this.config = {
      conds: config.conds ?? [],
      areaLevel: config.areaLevel ?? build.level,
      resistPenalty: config.resistPenalty ?? 0,
      targetDistance: config.targetDistance ?? 4,
      steady: config.steady,
      extraMods: config.extraMods ?? [],
      charges: config.charges,
    };
    let cc = 0;
    for (const c of this.config.conds) cc = maskOr(cc, this.cond.bit(c));
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
    this.weaponTags = new Set<SkillTag>(this.hands.flatMap((h) => h.tags));

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
    if (this.dualWielding) {
      // Dual wielding (3.9): 20% more physical attack damage and 15% additional chance to block attacks.
      mods.push(
        mod('damage', 'more', DUAL_WIELD_MORE_PHYS, {
          damageTypes: ['physical'],
          tags: ['attack', 'dualWield'],
        }),
        mod('blockAttack', 'base', DUAL_WIELD_BLOCK),
      );
    }
    const tree = getTree();
    for (const id of build.allocated) {
      const n = tree.nodes[id];
      if (n) mods.push(...nodeMods(n, id));
    }
    for (const slot of EQUIP_SLOTS) {
      const it = build.equipment[slot];
      if (it) mods.push(...itemGlobalMods(it));
    }
    // "Increased defences from your shield": the shield's own defences, more by what the tree and the gear say.
    const shield = build.equipment.offHand;
    if (shield && itemBase(shield.baseId).itemClass === 'shield') {
      const sum = (stat: string) =>
        mods.reduce((t, m) => (m.stat === stat && m.kind === 'inc' ? t + m.value : t), 0) / 100;
      const all = sum('shieldDefences');
      const es = sum('shieldEs');
      const st = armourStats(shield);
      const src = { kind: 'item' as const, id: `shield.${shield.uid}` };
      if (all && st.armour)
        mods.push(mod('armour', 'base', Math.round(st.armour * all), { source: src }));
      if (all && st.evasion)
        mods.push(mod('evasion', 'base', Math.round(st.evasion * all), { source: src }));
      if ((all || es) && st.es)
        mods.push(mod('es', 'base', Math.round(st.es * (all + es)), { source: src }));
    }
    for (const m of this.config.extraMods)
      mods.push({ ...m, source: { kind: 'monster', id: 'map' } });
    // Items can grant a keystone (unless the tree already gave it).
    const have = new Set(build.allocated.map((id) => tree.nodes[id]?.name));
    const granted = new Set<string>();
    for (const slot of EQUIP_SLOTS) {
      const it = build.equipment[slot];
      if (it) for (const id of grantedKeystones(it)) granted.add(id);
    }
    for (const id of granted) {
      const k = KEYSTONES.find((x) => x.id === id);
      if (k && !have.has(k.name))
        for (const m of k.mods) mods.push({ ...m, source: { kind: 'item', id: `keystone.${id}` } });
    }
    // A socketed gem can be a source of charges, buffs, rage or recovery too (a support that grants them to its skill).
    const gemSources: Mod[] = [];
    for (const slot of EQUIP_SLOTS)
      for (const g of build.equipment[slot]?.sockets ?? []) {
        if (!g) continue;
        const gd = gemDef(g.gemId);
        if ('mods' in gd)
          for (const m of gd.mods)
            if (GAIN_STAT.test(m.stat)) gemSources.push({ ...m, value: levelValue(m.value, 20) });
      }
    // What can grant charges, buffs, rage or recovery: worked out once (the charge effects added below grant none).
    const gemsAndMods = [...mods, ...gemSources];
    const buffIdsGranted = new Set<string>();
    for (const m of gemsAndMods)
      if (m.value > 0 && m.stat.startsWith('buffOn.'))
        buffIdsGranted.add(m.stat.slice(m.stat.lastIndexOf('.') + 1));
    // Charges (EXPANSION 5.6): the count the sim reports, or the maximum where something can grant one.
    const held = noCharges();
    const cap = noCharges();
    for (const k of CHARGE_KINDS) {
      cap[k] = maxChargesOf(mods, k);
      held[k] = Math.min(
        cap[k],
        this.config.charges ? this.config.charges[k] : hasChargeSource(gemsAndMods, k) ? cap[k] : 0,
      );
      mods.push(...chargeMods(k, held[k]));
    }
    this.charges = held;
    this.chargeMax = cap;
    this.chargeSource = {
      grit: hasChargeSource(gemsAndMods, 'grit'),
      fervour: hasChargeSource(gemsAndMods, 'fervour'),
      insight: hasChargeSource(gemsAndMods, 'insight'),
    };
    // Buffs: their effects wait behind a condition, so they are only added when something can grant them.
    this.buffSource = Object.fromEntries(BUFF_IDS.map((id) => [id, false])) as Record<
      BuffId,
      boolean
    >;
    // A utility skill in a socket is a source of its buff (it casts it).
    const utilBuffs = new Set<BuffId>();
    for (const slot of EQUIP_SLOTS)
      for (const g of build.equipment[slot]?.sockets ?? []) {
        const gd = g ? gemDef(g.gemId) : null;
        if (gd?.kind === 'active' && gd.utility?.kind === 'buff') utilBuffs.add(gd.utility.buff);
      }
    for (const id of BUFF_IDS) {
      this.buffSource[id] = buffIdsGranted.has(id) || utilBuffs.has(id);
      if (this.buffSource[id]) mods.push(...BUFFS[id].mods);
    }
    this.rageSource = hasRageSource(gemsAndMods);
    this.anyGain =
      this.rageSource ||
      hasRecoverSource(gemsAndMods) ||
      BUFF_IDS.some((id) => this.buffSource[id]);
    this.rageMax =
      BASE_MAX_RAGE + mods.reduce((n, m) => (m.stat === 'maxRage' ? n + m.value : n), 0);
    this.defaultDyn = this.rageSource ? ASSUMED_RAGE << DYN_SHIFT : 0;
    const db0 = new ModDB(mods, this.cond);
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
              : s === 'charges.grit'
                ? held.grit
                : s === 'charges.fervour'
                  ? held.fervour
                  : s === 'charges.insight'
                    ? held.insight
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
    // "Increased global defences" raises armour, evasion and energy shield alike.
    const globalDef = db0.sum('inc', 'globalDefences', ctx0);
    if (globalDef)
      db0.addAll(
        (['armour', 'evasion', 'es'] as const).map((st) =>
          mod(st, 'inc', globalDef, { source: src }),
        ),
      );

    // 3. Gems.
    for (const slot of EQUIP_SLOTS) {
      const it = build.equipment[slot];
      if (!it) continue;
      it.sockets.forEach((g, socket) => {
        if (!g) return;
        const def = gemDef(g.gemId);
        // Gem levels from the item the gem sits in, and from anything that raises every gem of its kind.
        const tags = gemTagsOf(def);
        const bonus =
          socketedGemBonus(it, tags, (st) => (st === 'level' ? level : 0)) +
          db0.sum('base', 'gemLevel', { tags: tagMask(tags), ancestry: 0, conds: 0 });
        this.gems.push({ gem: g, def, slot, socket, level: gemLevel(def, level, attrs, bonus) });
      });
    }
    // "Socketed gems are supported by ...": the item links that support to every gem in it.
    for (const slot of EQUIP_SLOTS) {
      const it = build.equipment[slot];
      if (!it) continue;
      for (const m of itemMods(it)) {
        const granted = m.stat.startsWith('grantSkill.');
        if (!granted && !m.stat.startsWith('socketSupport.')) continue;
        const def = gemDef(m.stat.slice(m.stat.indexOf('.') + 1));
        if (granted ? def.kind === 'support' || def.kind === 'hex' : def.kind !== 'support')
          continue;
        this.gems.push({
          gem: { kind: 'gem', uid: -1 - this.gems.length, gemId: def.id },
          def,
          slot,
          socket: -1,
          level: Math.max(1, Math.min(MAX_GEM_LEVEL, Math.round(m.value))),
        });
      }
    }
    const weaponTags = this.weaponTags;
    const costLifeAll = db0.flag('skillsCostLife', ctx0);
    // Gems in an item with the "socketed gems use life" rule pay and reserve life instead of mana.
    const usesLife = (slot: EquipSlot) =>
      costLifeAll || itemHasRule(build.equipment[slot]!, 'socketedGemsUseLife');
    for (const sg of this.gems) {
      if (sg.def.kind !== 'active') continue;
      let skill = resolveActive(sg.def, sg.level);
      // Supports can add types (a totem support makes the skill a totem), which change what the others may do.
      const linked = this.gems.filter((o) => o.slot === sg.slot && o.def.kind === 'support');
      const resolved = resolveSupports(
        skill.types,
        linked.map((o) => ({ ...(o.def as SupportGemDef), gem: o })),
      );
      const supports = resolved.applied.map((r) => r.gem);
      // A support can raise the level of the skill it supports.
      const levelBonus = supports.reduce((n, s) => {
        const lb = (s.def as SupportGemDef).levelBonus;
        return lb === undefined ? n : n + Math.round(levelValue(lb, s.level));
      }, 0);
      if (levelBonus > 0)
        skill = resolveActive(sg.def, Math.min(MAX_GEM_LEVEL, sg.level + levelBonus));
      if (skill.behaviour.kind === 'melee' && skill.behaviour.range2h && weaponTags.has('twoHand'))
        skill.behaviour = { ...skill.behaviour, range: skill.behaviour.range2h };
      const addedTags = [...resolved.types].filter(
        (t): t is SkillTag =>
          (SKILL_TAGS as readonly string[]).includes(t) && !skill.tags.includes(t as SkillTag),
      );
      let costMult = 1;
      for (const s of supports) costMult *= (s.def as SupportGemDef).costMult;
      let usable = true;
      let reason: string | undefined;
      if (skill.requiresWeapon && !skill.requiresWeapon.some((t) => weaponTags.has(t))) {
        usable = false;
        reason = `${skill.name} needs a ${skill.requiresWeapon.join(' or ')}`;
      }
      if (sg.def.needsDualWield && !this.dualWielding) {
        usable = false;
        reason = `${skill.name} needs two weapons`;
      }
      if (sg.def.needsShield && !this.holdingShield) {
        usable = false;
        reason = `${skill.name} needs a shield`;
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
        addedTags,
        costMult,
        usable,
        reason,
        deploy: deployKind(skill.types, resolved.types),
        costsLife: usesLife(sg.slot),
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
      addedTags: [],
      costMult: 1,
      usable: true,
      costsLife: costLifeAll,
    };
    this.buildTriggers(build);
    // What supports give beyond their own skill: mods for the whole character, and triggers.
    for (const a of this.actives) {
      if (!a.usable || a.gemUid === null) continue;
      for (const s of a.supports) {
        const sd = s.def as SupportGemDef;
        if (sd.global)
          db0.addAll(
            gemMods(sd.global, s.level, sd.id).map((m) => ({
              ...m,
              source: { kind: 'gem' as const, id: sd.id },
            })),
          );
        (sd.extraTriggers ?? []).forEach((t, i) =>
          this.triggers.push({
            key: `sup${s.gem.uid}:${i}`,
            def: t,
            slot: s.slot,
            skills: [],
            tagMask: tagMask(t.tags),
          }),
        );
      }
    }
    const chosen =
      this.actives.find((a) => a.gemUid === build.primaryGem && !a.triggered && !a.skill.utility) ??
      this.actives.find((a) => a.usable && !a.triggered && !a.skill.utility);
    if (chosen && !chosen.usable) this.warnings.push(chosen.reason ?? 'Primary skill unusable');
    this.primary = chosen && chosen.usable ? chosen : this.defaultAttack;
    this.hexes = this.deriveHexes(db0, ctx0);
    this.castCurses = this.deriveCurses(db0, ctx0);
    this.sheetHexes = [
      ...this.hexes,
      ...this.castCurses.filter((c) => !this.hexes.some((h) => h.id === c.id)),
    ]
      .sort((a, b) => b.effect - a.effect)
      .slice(0, this.hexLimit);
    // The enemies the character hits are hexed (for the sheet; the sim tracks it per enemy).
    if (this.sheetHexes.length)
      this.configConds = maskOr(this.configConds, this.cond.peek('targetCursed'));
    const casting = new Set([this.primary.skill.id]);
    for (const a of this.actives) {
      if (!a.usable || a.triggered || a.gemUid === null || casting.has(a.skill.id)) continue;
      casting.add(a.skill.id);
      if (blasphemyOf(a)) continue;
      if (a.skill.utility) this.utilities.push(a);
      else this.secondaryCandidates.push(a);
    }

    // 4. Auras and reservation.
    const pre = defenceFromDb(db0, ctx0, { isPlayer: true, resistPenalty: 0 });
    const red = db0.sum('base', 'reducedReservation', ctx0) / 100;
    let reservedMana = 0;
    let reservedLife = 0;
    const auraEffect = db0.mult('auraEffect', ctx0);
    // A curse under Blasphemy stands as an aura that reserves mana.
    for (const a of this.actives) {
      const b = blasphemyOf(a);
      if (a.usable && b)
        reservedMana += Math.ceil((b.reservePct / 100) * pre.maxMana * (1 - Math.min(0.95, red)));
    }
    for (const sg of this.gems) {
      if (sg.def.kind !== 'aura') continue;
      const def = sg.def;
      const life = usesLife(sg.slot);
      const pool = life ? pre.maxLife : pre.maxMana;
      const base = def.reservePct
        ? (def.reservePct / 100) * pool
        : levelValue(def.reserveFlat ?? 0, sg.level);
      // Global reduced reservation, plus any this gem's item gives its own socketed gems.
      const itemRed = socketedReservationReduction(build.equipment[sg.slot]!) / 100;
      const r = Math.ceil(base * (1 - Math.min(0.95, red + itemRed)));
      const active = (life ? reservedLife : reservedMana) + r <= pool;
      if (active) {
        if (life) reservedLife += r;
        else reservedMana += r;
        db0.addAll(
          gemMods(def.mods, sg.level, def.id).map((m) => ({
            ...m,
            value: m.value * auraEffect,
            source: { kind: 'aura', id: def.id },
          })),
        );
      } else {
        this.warnings.push(`${def.name} is inactive: not enough ${life ? 'life' : 'mana'}`);
      }
      this.auras.push({ gem: sg, def, reserved: r, active });
      if (active)
        (def.triggers ?? []).forEach((t, i) =>
          this.triggers.push({
            key: `aura${sg.gem.uid}:${i}`,
            def: t,
            slot: sg.slot,
            skills: [],
            tagMask: tagMask(t.tags),
          }),
        );
    }
    // Utility buffs act while their timer runs (the sim) or, for the sheet, as if up; marks give their bonuses.
    for (const a of this.utilities) {
      const u = a.skill.utility!;
      if (u.kind === 'buff') {
        const bd = BUFFS[u.buff];
        const uptime = Math.min(
          1,
          (u.seconds * db0.mult('buffDuration', ctx0)) / (u.cooldown ?? u.seconds * 0.9),
        );
        const src = { kind: 'gem' as const, id: a.skill.id };
        const mods = gemMods(u.mods, a.skill.level, a.skill.id);
        // The sheet of a bot's build counts a buff that is only up part of the time by its uptime.
        if (this.config.steady && uptime < 0.5)
          db0.addAll(mods.map((m) => ({ ...m, value: m.value * uptime, source: src })));
        else db0.addAll(mods.map((m) => ({ ...m, condition: { id: bd.cond }, source: src })));
        this.cond.bit(bd.cond);
      } else if (u.kind === 'summon') {
        // The minions are assumed standing: what they give their owner is always on.
        db0.addAll(
          gemMods(u.ownerMods ?? [], a.skill.level, a.skill.id).map((m) => ({
            ...m,
            source: { kind: 'gem' as const, id: a.skill.id },
          })),
        );
      } else if (u.kind === 'curse') {
        const hd = HEXES[u.hex];
        const t = Math.max(0, Math.min(1, (a.skill.level - 1) / 19));
        const mult = db0.mult('curseEffect', ctx0);
        for (const sm of hd.selfMods ?? []) {
          db0.add({
            stat: sm.stat,
            kind: sm.kind,
            value:
              (sm.low + (sm.high - sm.low) * t) *
              (sm.kind === 'base' && sm.stat === 'critMulti' ? 1 : mult),
            tags: sm.tags,
            damageTypes: sm.damageTypes,
            condition: { id: 'targetCursed' },
            source: { kind: 'gem', id: a.skill.id },
          });
        }
        this.cond.bit('targetCursed');
      }
    }
    this.reservedLife = reservedLife;
    this.reservedMana = reservedMana;
    this.burn = {
      pct: Math.max(0, db0.sum('base', 'auraBurn', ctx0)),
      self: Math.max(0, db0.sum('base', 'selfBurn', ctx0)),
    };
    this.db = db0;
    this.flasks = build.flasks.filter((f) => f !== null).map((f) => flaskSpec(f!, db0));
    // Register every condition any mod of this character can use up front (gems, flasks, rage), so a mask built before
    // a skill's database exists still means the same thing in it.
    const registerAll = (list: readonly { condition?: { id: CondId } }[]) => {
      for (const m of list) if (m.condition) this.cond.bit(m.condition.id);
    };
    for (const sg of this.gems) if ('mods' in sg.def) registerAll(sg.def.mods);
    for (const f of this.flasks) registerAll(f.buff);
    registerAll(rageMods(1));
    for (const id of ['onLowLife', 'overloadActive'] as const) this.cond.bit(id);
    // Conditions that never change in a fight: the sheet takes them as true from the start.
    for (const [id, gem] of AURA_CONDS)
      if (this.auras.some((a) => a.active && a.def.id === gem))
        this.configConds = maskOr(this.configConds, this.cond.peek(id));
    for (const [id, tag] of WIELD_CONDS)
      if (this.weaponTags.has(tag)) this.configConds = maskOr(this.configConds, this.cond.peek(id));
    if (this.config.steady)
      this.configConds = maskOr(this.configConds, this.steadyMask(this.config.steady));
  }

  /** Collect the triggers of the equipped items and the skills they cast (EXPANSION 5.5). */
  private buildTriggers(build: Build): void {
    for (const slot of EQUIP_SLOTS) {
      const it = build.equipment[slot];
      (it?.uniqueTriggers ?? []).forEach((def, i) => {
        const key = `${slot}:${i}`;
        const skills: SkillChoice[] = [];
        const eff = def.effect;
        if (eff.kind === 'castSocketed') {
          // The spells socketed in this item become triggered-only.
          for (const sg of this.gems) {
            if (sg.slot !== slot || sg.def.kind !== 'active') continue;
            const idx = this.actives.findIndex((a) => a.gemUid === sg.gem.uid);
            const choice = this.actives[idx];
            if (!choice || choice.skill.type !== 'spell') continue;
            if (!(eff.spellTags ?? []).every((t) => choice.skill.tags.includes(t))) continue;
            const trig = choice.triggered ? choice : this.asTriggered(choice, `trig:${choice.key}`);
            this.actives[idx] = trig;
            skills.push(trig);
          }
        } else if (eff.kind === 'castGranted') {
          const gd = gemDef(eff.skillId);
          if (gd.kind === 'active')
            skills.push(
              this.asTriggered(
                {
                  key: `granted:${eff.skillId}`,
                  gemUid: null,
                  skill: resolveActive(gd, eff.level),
                  supports: [],
                  addedTags: [],
                  costMult: 1,
                  usable: true,
                  costsLife: false,
                },
                `granted:${slot}:${i}:${eff.skillId}`,
              ),
            );
        }
        this.triggers.push({ key, def, slot, skills, tagMask: tagMask(def.tags) });
      });
    }
    // Trigger supports: the spells they are linked to (in the same item) are cast by the trigger.
    for (const sg of this.gems) {
      if (sg.def.kind !== 'support' || !sg.def.trigger) continue;
      const skills: SkillChoice[] = [];
      for (const other of this.gems) {
        if (other.slot !== sg.slot || other.def.kind !== 'active') continue;
        const idx = this.actives.findIndex((a) => a.gemUid === other.gem.uid);
        const choice = this.actives[idx];
        if (!choice || choice.skill.type !== 'spell' || !supportApplies(sg.def, choice.skill))
          continue;
        const trig = choice.triggered ? choice : this.asTriggered(choice, `trig:${choice.key}`);
        this.actives[idx] = trig;
        skills.push(trig);
      }
      const def = sg.def.trigger;
      this.triggers.push({
        key: `${sg.slot}:s${sg.gem.uid}`,
        def,
        slot: sg.slot,
        skills,
        tagMask: tagMask(def.tags),
      });
    }
  }

  private asTriggered(c: SkillChoice, key: string): SkillChoice {
    return {
      ...c,
      key,
      triggered: true,
      skill: { ...c.skill, tags: [...c.skill.tags, 'triggered'] },
    };
  }

  /**
   * The conditions that hold in a typical fight (EXPANSION 5.10). Low life counts when reserved life
   * is at least 65% of the maximum, and recent crits when the primary skill crits at least 20%.
   */
  /**
   * The hexes applied on hit: the hex gems in the same item as the primary skill when Hexing Strikes is there too,
   * and any a unique grants. A hex's level sets its effect, curse effect scales it, and the hex limit caps how many.
   */
  private deriveHexes(db: ModDB, ctx: ModCtx): PlayerHex[] {
    const out: PlayerHex[] = [];
    const prim = this.gems.find((g) => g.gem.uid === this.primary.gemUid);
    if (
      prim &&
      this.gems.some((g) => g.slot === prim.slot && g.def.kind === 'support' && g.def.hexOnHit)
    )
      for (const g of this.gems)
        if (g.slot === prim.slot && g.def.kind === 'hex')
          out.push({ id: g.def.hex, level: g.level, effect: 0 });
    for (const a of this.actives) {
      const u = a.skill.utility;
      if (a.usable && u?.kind === 'curse' && blasphemyOf(a))
        out.push({ id: u.hex, level: a.skill.level, effect: 0 });
    }
    for (const id of ALL_HEX_IDS) {
      const lv = db.sum('base', `hexOnHit.${id}`, ctx);
      if (lv > 0 && !out.some((h) => h.id === id)) out.push({ id, level: lv, effect: 0 });
    }
    const mult = db.mult('curseEffect', ctx);
    for (const h of out) h.effect = Math.round(hexEffect(h.id, h.level) * mult * 10) / 10;
    out.sort((a, b) => b.effect - a.effect);
    this.hexLimit = BASE_HEX_LIMIT + Math.floor(db.sum('base', 'hexLimit', ctx));
    return out.slice(0, this.hexLimit);
  }

  /** The curses cast by utility gems: level sets the effect, curse effect scales it. */
  private deriveCurses(db: ModDB, ctx: ModCtx): PlayerHex[] {
    const out: PlayerHex[] = [];
    const mult = db.mult('curseEffect', ctx);
    for (const a of this.actives) {
      const u = a.skill.utility;
      if (!a.usable || a.triggered || u?.kind !== 'curse') continue;
      out.push({
        id: u.hex,
        level: a.skill.level,
        effect: Math.round(hexEffect(u.hex, a.skill.level) * mult * 10) / 10,
      });
    }
    out.sort((a, b) => b.effect - a.effect);
    return out;
  }

  /** What the character's hexes do to a hit enemy: resistance shifts and physical vulnerability. */
  hexTarget(): {
    resShift: number[];
    vuln: number;
    vulnAll: number;
    damageMult: number;
    speedMult: number;
  } {
    const t = hexTotals(this.sheetHexes);
    return {
      resShift: NO_SHIFT.map((_, i) => -t.res[i]),
      vuln: t.vulnPhys,
      vulnAll: t.vulnAll,
      damageMult: t.damageMult,
      speedMult: t.speedMult,
    };
  }

  steadyMask(mode: SteadyMode): number {
    let m = maskOr(this.cond.peek('hitRecently'), this.cond.peek('usedFlaskRecently'));
    // A buff that something can grant is assumed up, as a charge is assumed held.
    for (const id of BUFF_IDS)
      if (this.buffSource[id]) m = maskOr(m, this.cond.peek(BUFFS[id].cond));
    if (this.sheetHexes.length) m = maskOr(m, this.cond.peek('targetCursed'));
    if (mode === 'clearing') m = maskOr(m, this.cond.peek('killedRecently'));
    const d = this.defence(m);
    if (this.reservedLife >= 0.65 * d.maxLife) m = maskOr(m, this.cond.peek('onLowLife'));
    const hand = this.profile(this.primary, m).hands[0];
    if (hand && hand.critChance >= 0.2) m = maskOr(m, this.cond.peek('critRecently'));
    return m;
  }

  private extraTags(): SkillTag[] {
    return [...(this.dualWielding ? DUAL_TAGS : []), ...(this.holdingShield ? SHIELD_TAGS : [])];
  }

  /** The profile of a skill for a condition mask and a bitmask of active flasks (cached). */
  profile(
    choice: SkillChoice,
    conds: number = this.configConds,
    flaskMask: number = this.defaultDyn,
  ): SkillProfile {
    const c = maskAnd(conds, this.cond.all);
    const k = `${choice.key}|${c}|${flaskMask}`;
    let p = this.profiles.get(k);
    if (p) return p;
    const supportMods: Mod[] = [];
    for (const s of choice.supports)
      supportMods.push(...gemMods((s.def as SupportGemDef).mods, s.level, s.def.id));
    const base = this.dbWith(flaskMask);
    let db = base;
    if (choice.skill.mods.length || supportMods.length) {
      // One database per skill and flask state, shared by every condition mask.
      const dk = `${choice.key}|${flaskMask}`;
      let sdb = this.skillDbs.get(dk);
      if (!sdb)
        this.skillDbs.set(
          dk,
          (sdb = new ModDB([...base.mods(), ...choice.skill.mods, ...supportMods], this.cond)),
        );
      db = sdb;
    }
    p = buildProfile({
      skill: choice.skill,
      db,
      hands: choice.skill.type === 'attack' ? this.hands : [],
      extraTags: [...this.extraTags(), ...choice.addedTags],
      costMult: choice.costMult,
      conds: c,
      statValue: this.statValue,
    });
    // What the skill and its supports give on events (charges, buffs, rage, recovery): rolled when the skill hits.
    p.gains = [...choice.skill.mods, ...supportMods].filter((m) => GAIN_STAT.test(m.stat));
    this.profiles.set(k, p);
    return p;
  }

  /** The mod database with the flasks and the rage in the dynamic mask added (cached): flask bits, then rage << DYN_SHIFT. */
  dbWith(dyn: number): ModDB {
    if (!dyn) return this.db;
    let db = this.flaskDbs.get(dyn);
    if (!db) {
      const flasks = dyn & ((1 << DYN_SHIFT) - 1);
      const extra: Mod[] = rageMods(Math.min(this.rageMax, dyn >> DYN_SHIFT));
      this.flasks.forEach((f, i) => {
        if (flasks & (1 << i)) extra.push(...f.buff);
      });
      db = new ModDB([...this.db.mods(), ...extra], this.cond);
      this.flaskDbs.set(dyn, db);
    }
    return db;
  }

  /** Defences for a condition mask and a bitmask of active flasks (cached). */
  defence(conds: number = this.configConds, flaskMask: number = this.defaultDyn): Defence {
    const c = maskAnd(conds, this.cond.all);
    const k = `${c}|${flaskMask}`;
    let d = this.defences.get(k);
    if (!d) {
      const db = this.dbWith(flaskMask);
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
  skillSheet(
    choice: SkillChoice = this.primary,
    target?: TargetState,
    conds: number = this.configConds,
    /** Uses per second; the default is the skill's own speed. Triggered skills pass their rate. */
    usesOverride?: number,
    /** Mana (or life) per second that triggered skills take from the same pool. */
    resourceTaken = 0,
    /** The share of the character's time the skill has: secondary casts take the rest. */
    timeShare = 1,
  ): SkillSheet {
    const p = this.profile(choice, conds);
    const hexed = this.hexTarget();
    const t: TargetState = target ?? {
      def: referenceMonster(this.config.areaLevel).defence,
      shock: 0,
      resShift: hexed.resShift,
      vuln: hexed.vuln,
      vulnAll: hexed.vulnAll,
    };
    const d = this.config.targetDistance;
    // A totem or brand shoots on its own, whatever the character does; traps and mines go off several at a time.
    const deployN = choice.deploy ? p.deployCount : 1;
    const standing = choice.deploy === 'totem' || choice.deploy === 'brand';
    const usesPerSec =
      usesOverride ??
      (standing ? deployN / p.useTime : (timeShare / p.useTime) * (choice.deploy ? deployN : 1));
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
      const handUses =
        (p.bothHands ? usesPerSec : usesPerSec / n) *
        (choice.triggered ? 1 : 1 + p.repeats) *
        p.pulses;
      const ail = expectedAilments(p, h, t, d, handUses, land);
      ign = Math.max(ign, ail.igniteDps);
      bl = Math.max(bl, ail.bleedDps);
      po += ail.poisonDps;
    }
    // A repeating skill (Echoing Cast) lands several times per use; a triggered one does not repeat.
    const lands = (choice.triggered ? 1 : 1 + p.repeats) * p.pulses;
    let hitDps = perUse * usesPerSec * lands;
    // While its totems and brands stand and shoot, the character itself fights with its weapon.
    if (standing && usesOverride === undefined && choice.gemUid !== null)
      hitDps += this.skillSheet(this.defaultAttack, target, conds).hitDps * 0.9;
    const ailmentDps = ign + bl + po;
    const totalDps = hitDps + ailmentDps;
    // Sustain: the share of uses the resource pool can pay for; the rest fall back to the default attack.
    let sustain = 1;
    let sustainedDps = totalDps;
    if (p.cost > 0 && choice.gemUid !== null && usesOverride === undefined) {
      const d = this.defence(conds);
      const regen = Math.max(0, (choice.costsLife ? d.lifeRegen : d.manaRegen) - resourceTaken);
      // A deployed skill is paid for when it is put down, not at each of its shots.
      const paid = choice.deploy ? timeShare / p.useTime : usesPerSec;
      sustain = Math.min(1, regen / (p.cost * paid));
      if (sustain < 1) {
        const dflt = this.skillSheet(this.defaultAttack, target, conds);
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

  /**
   * Effective HP against the reference monster's hit, split by damage type as `hitMix` says: shares of
   * physical, lightning, cold and fire (§8.1). The default is the typical mix of a map.
   */
  ehp(def: Defence = this.defence(), hitMix: readonly number[] = DEFAULT_HIT_MIX): number {
    const level = this.config.areaLevel;
    const hit = monsterHit(level);
    const mon = referenceMonster(level);
    const pool = def.maxLife - this.reservedLife + def.maxEs;
    let taken = 0;
    const resMult = (t: number) =>
      def.immune[t] ? 0 : 1 - effectiveRes(def.res[t], def.maxRes[t]) / 100;
    for (const [t, w] of hitMix.entries()) {
      let m: number;
      if (t === 0) {
        // A share of physical damage may be taken as another type (and mitigated as that type).
        const physMult = 1 - Math.min(0.9, armourReduction(def.armour, hit) + def.physReduction);
        const moved = def.physTakenAs.reduce((x, y) => x + y, 0);
        m = (1 - moved) * physMult * def.damageTakenType[0];
        for (let u = 1; u < def.physTakenAs.length; u++)
          m += def.physTakenAs[u] * resMult(u) * def.damageTakenType[u];
      } else m = resMult(t) * def.damageTakenType[t];
      taken += w * m;
    }
    // Hexed monsters deal less damage and act more slowly.
    const hexed = this.hexTarget();
    taken *= hexed.damageMult * hexed.speedMult;
    const hc = def.cannotEvade
      ? 1
      : hitChance(mon.defence.maxLife > 0 ? mon.profile(0).hands[0].accuracy : 0, def.evasion);
    const avoid = hc * (1 - def.blockAttack);
    return pool / Math.max(0.01, taken * def.damageTakenMult * avoid);
  }

  /**
   * The skills cast whenever ready (EXPANSION 5.5a): every other usable active skill, one per skill, whose
   * reach is at least the primary's. The character stands where the primary can reach its target, so a
   * shorter-ranged secondary (a melee skill behind a bow) would never fire.
   */
  get secondaries(): SkillChoice[] {
    if (!this.secondaryCache && this.secondaryCandidates.length === 0) this.secondaryCache = [];
    if (!this.secondaryCache) {
      const reach = skillRange(this.profile(this.primary, this.configConds));
      this.secondaryCache = this.secondaryCandidates.filter(
        (c) => skillRange(this.profile(c, this.configConds)) >= reach - 0.05,
      );
    }
    return this.secondaryCache;
  }

  /** Seconds before a secondary skill can be cast again (EXPANSION 5.5a). */
  cooldownOf(choice: SkillChoice, conds: number = this.configConds): number {
    return (
      choice.skill.cooldown ??
      Math.max(
        SECONDARY_MIN_COOLDOWN,
        SECONDARY_COOLDOWN_USES * this.profile(choice, conds).useTime,
      )
    );
  }

  /**
   * How the character's time divides. A secondary is cast, then the primary is used until the cooldown has
   * run out (whole uses: an action in progress is never cut short), and then it is cast again. Its cast takes
   * its use time out of the primary's.
   */
  private secondaryLoad(
    conds: number,
  ): { choice: SkillChoice; cd: number; rate: number; busy: number }[] {
    if (!this.secondaries.length) return [];
    const u = this.profile(this.primary, conds).useTime;
    const rows = this.secondaries.map((choice) => {
      const p = this.profile(choice, conds);
      const cd = Math.max(this.cooldownOf(choice, conds), p.useTime);
      const cycle = p.useTime + Math.ceil((cd - p.useTime) / u - 1e-9) * u;
      const rate = 1 / cycle;
      return { choice, cd, rate, busy: rate * p.useTime };
    });
    // Never starve the primary entirely.
    const total = rows.reduce((a, r) => a + r.busy, 0);
    if (total <= 0.9) return rows;
    return rows.map((r) => ({ ...r, rate: (r.rate * 0.9) / total, busy: (r.busy * 0.9) / total }));
  }

  /** Damage a second of the minions the character's summon skills keep standing, less the time they spend fallen (they are assumed in reach). */
  minionDps(conds: number = this.configConds): number {
    let dps = 0;
    for (const c of this.utilities) {
      const u = c.skill.utility;
      if (u?.kind !== 'summon') continue;
      const def = MINIONS[u.minion];
      const p = this.profile(c, conds);
      const count = Math.max(1, Math.round(levelValue(u.count, c.skill.level)) + p.minionCount);
      const hit = spellBaseDamage(c.skill.level) * def.dmg * p.minionDamage;
      const up = minionUptime(u.minion, this.config.areaLevel, p.minionLife, p.minionTaken);
      dps +=
        count * hit * def.rate * p.minionSpeed * MINION_ENEMY_RES * (1 + def.splash * 0.5) * up;
    }
    return dps;
  }

  /** How the utility skills take the character's time: each is cast once per cooldown (or per buff or curse duration). */
  utilityLoad(
    conds: number = this.configConds,
  ): { choice: SkillChoice; rate: number; busy: number }[] {
    return this.utilities.map((choice) => {
      const u = choice.skill.utility!;
      const p = this.profile(choice, conds);
      const every =
        u.kind === 'buff'
          ? (u.cooldown ?? u.seconds * 0.9)
          : u.kind === 'curse'
            ? HEX_SECONDS * 0.9
            : u.kind === 'summon'
              ? (u.seconds ?? 90)
              : u.cooldown;
      const rate = 1 / Math.max(every, p.useTime);
      return { choice, rate, busy: rate * p.useTime };
    });
  }

  /** The share of time the primary skill has left after the secondary casts and the utility skills. */
  primaryShare(conds: number = this.configConds): number {
    const u = this.utilityLoad(conds).reduce((a, r) => a + r.busy, 0);
    return Math.max(0.1, 1 - this.secondaryLoad(conds).reduce((a, r) => a + r.busy, 0) - u);
  }

  secondarySheets(conds: number = this.configConds, target?: TargetState): SecondarySheet[] {
    return this.secondaryLoad(conds).map(({ choice, cd, rate }) => {
      const sheet = this.skillSheet(choice, target, conds, rate);
      return {
        key: choice.key,
        skill: sheet,
        cooldown: cd,
        usesPerSec: rate,
        dps: sheet.totalDps,
        manaPerSec: this.profile(choice, conds).cost * rate,
      };
    });
  }

  /**
   * The skills the character's triggers cast, with how often each fires (EXPANSION 5.5). Kill, block and
   * hit-taken triggers depend on the fight and are not estimated here.
   */
  triggerSheets(conds: number = this.configConds, target?: TargetState): TriggeredSheet[] {
    const out: TriggeredSheet[] = [];
    if (this.triggers.length === 0) return out;
    const p = this.profile(this.primary, conds);
    const prim = this.skillSheet(
      this.primary,
      target,
      conds,
      undefined,
      0,
      this.primaryShare(conds),
    );
    for (const src of this.triggers) {
      const d = src.def;
      if (!src.skills.length || (src.tagMask & ~p.tagMask) !== 0) continue;
      // The primary skill is used at regular intervals, and each use produces a triggering event with
      // some probability q. After a firing the trigger waits out its cooldown (k uses long) and then
      // fires on the first event that passes its chance.
      let q = 0;
      if (d.on === 'attack') q = p.isAttack ? 1 : 0;
      else if (d.on === 'hit') q = prim.hitChance;
      else if (d.on === 'crit') q = prim.hitChance * prim.critChance;
      const pass = (q * d.chance) / 100;
      if (pass <= 0) continue;
      const interval = 1 / prim.usesPerSec;
      const wait = Math.max(1, Math.ceil(d.cooldown / interval - 1e-9));
      const uses = 1 / (interval * (wait - 1 + 1 / pass));
      const each = uses / src.skills.length;
      for (const c of src.skills) {
        const sheet = this.skillSheet(c, target, conds, each);
        out.push({
          key: src.key,
          source: src.slot,
          skill: sheet,
          usesPerSec: each,
          dps: sheet.totalDps,
          // A triggered skill costs no mana (3.9).
          manaPerSec: 0,
        });
      }
    }
    return out;
  }

  sheet(conds: number = this.configConds): CharacterSheet {
    const d = this.defence(conds);
    const triggered = this.triggerSheets(conds);
    const secondary = this.secondarySheets(conds);
    const triggeredMana =
      triggered.reduce((a, t) => a + t.manaPerSec, 0) +
      secondary.reduce((a, t) => a + t.manaPerSec, 0) +
      this.utilityLoad(conds).reduce((a, r) => a + this.profile(r.choice, conds).cost * r.rate, 0);
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
      skill: this.skillSheet(
        this.primary,
        undefined,
        conds,
        undefined,
        triggeredMana,
        this.primaryShare(conds),
      ),
      triggered,
      triggeredDps: triggered.reduce((a, t) => a + t.dps, 0),
      hexes: this.sheetHexes,
      secondary,
      secondaryDps: secondary.reduce((a, t) => a + t.dps, 0),
      minionDps: this.minionDps(conds),
      ehp: this.ehp(d),
      auras: this.auras.map((a) => ({ name: a.def.name, reserved: a.reserved, active: a.active })),
      warnings: this.warnings,
    };
  }
}

export function skillRange(p: SkillProfile): number {
  return skillReach(p) + (p.skill.travel ?? 0);
}

function skillReach(p: SkillProfile): number {
  const b = p.skill.behaviour;
  if (b.kind === 'melee') return b.range + p.rangeBonus;
  if (b.kind === 'chain') return b.range;
  if (b.kind === 'burst') return b.origin === 'self' ? b.radius * 0.9 : (b.reach ?? b.radius);
  if (b.kind === 'beam') return b.length * 0.9;
  if (b.kind === 'ground') return b.line ? b.line * 0.9 : (b.reach ?? 8);
  return b.range ?? 8;
}

/** Tags of a skill use (for UI and tests). */
export function useTags(p: SkillProfile): number {
  return p.tagMask;
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
    dps:
      b.skill.totalDps +
      b.triggeredDps +
      b.secondaryDps +
      b.minionDps -
      (a.skill.totalDps + a.triggeredDps + a.secondaryDps + a.minionDps),
    life: b.life - a.life,
    es: b.es - a.es,
    mana: b.mana - a.mana,
    res: b.res.map((r, i) => r - a.res[i]),
    ehp: b.ehp - a.ehp,
  };
}
