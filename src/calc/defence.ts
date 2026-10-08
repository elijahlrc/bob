import { clamp } from '../core/math';
import {
  BASE_MANA_REGEN_PCT,
  BLOCK_CAP,
  DEFAULT_MAX_RES,
  ES_RECHARGE_DELAY,
  ES_RECHARGE_RATE,
  HARD_MAX_RES,
} from '../data/constants';
import type { ModCtx, ModDB } from '../mods/modDb';
import { DAMAGE_TYPES } from '../mods/types';
import type { Defence } from './combat';

export type DefenceOpts = {
  isPlayer: boolean;
  /** Resist penalty (percent) applied to elemental and chaos resistances. */
  resistPenalty: number;
  /** Multiplier on stun threshold (bosses ×4, mini-bosses ×2). */
  stunThreshMult?: number;
  reservedLife?: number;
};

/** Shares of physical hit damage taken as other types (fractions; they never add up to more than 1). */
function physTakenAs(db: ModDB, ctx: ModCtx): number[] {
  const shares = DAMAGE_TYPES.map((t) =>
    t === 'physical' ? 0 : clamp(db.sum('base', `physTakenAs.${t}`, ctx) / 100, 0, 1),
  );
  const total = shares.reduce((a, b) => a + b, 0);
  return total > 1 ? shares.map((s) => s / total) : shares;
}

/** The chance to avoid an ailment: "cannot be X" is 100%. */
function avoidOf(db: ModDB, ctx: ModCtx, name: string): number {
  return clamp(db.sum('base', `avoid.${name}`, ctx) / 100, 0, 1);
}

/** Resolve defensive stats from a mod database (§6.1–6.4). Shared by players and monsters. */
export function defenceFromDb(db: ModDB, ctx: ModCtx, opts: DefenceOpts): Defence {
  const flag = (s: string) => db.flag(s, ctx);
  const lifeIsOne = flag('lifeIsOne');
  const fullLife = Math.max(1, Math.round(db.calc('life', ctx)));
  const maxLife = lifeIsOne ? 1 : fullLife;
  const maxMana = flag('skillsCostLife') ? 0 : Math.max(0, Math.round(db.calc('mana', ctx)));
  const maxEs = Math.max(0, Math.round(db.calc('es', ctx)));

  let armour: number;
  let evasion: number;
  if (flag('evasionToArmour')) {
    armour =
      (db.sum('base', 'armour', ctx) + db.sum('base', 'evasion', ctx)) * db.mult('armour', ctx);
    evasion = 0;
  } else {
    armour = db.calc('armour', ctx);
    evasion = db.calc('evasion', ctx);
  }

  const blockCap = BLOCK_CAP + db.sum('base', 'blockCap', ctx);
  const blockAttack =
    clamp(db.sum('base', 'blockAttack', ctx) * db.more('blockAttack', ctx), 0, blockCap) / 100;
  const blockSpell =
    clamp(db.sum('base', 'blockSpell', ctx) * db.more('blockSpell', ctx), 0, blockCap) / 100;

  const res: number[] = [];
  const maxRes: number[] = [];
  const allEle = db.sum('base', 'resist.allEle', ctx);
  const allEleMax = db.sum('base', 'maxResist.allEle', ctx);
  for (const t of DAMAGE_TYPES) {
    if (t === 'physical') {
      res.push(0);
      maxRes.push(DEFAULT_MAX_RES);
      continue;
    }
    const ele = t !== 'chaos';
    res.push(db.sum('base', `resist.${t}`, ctx) + (ele ? allEle : 0) - opts.resistPenalty);
    maxRes.push(
      Math.min(
        HARD_MAX_RES,
        DEFAULT_MAX_RES + db.sum('base', `maxResist.${t}`, ctx) + (ele ? allEleMax : 0),
      ),
    );
  }

  const noRegen = flag('instantLeechNoRegen');
  const lifeRegen = noRegen
    ? 0
    : (db.sum('base', 'lifeRegen', ctx) + (db.sum('base', 'lifeRegenPct', ctx) / 100) * maxLife) *
      db.mult('lifeRegen', ctx);
  // Increased mana regeneration scales flat regeneration too (3.9).
  const manaRegen =
    (maxMana * ((BASE_MANA_REGEN_PCT + db.sum('base', 'manaRegenPct', ctx)) / 100) +
      db.sum('base', 'manaRegenFlat', ctx)) *
    db.mult('manaRegen', ctx);

  return {
    isPlayer: opts.isPlayer,
    maxLife,
    maxEs,
    maxMana,
    armour: Math.round(armour),
    evasion: Math.round(evasion),
    blockAttack,
    blockSpell,
    res,
    maxRes,
    physReduction: clamp(db.sum('base', 'physReduction', ctx) / 100, 0, 0.9),
    damageTakenMult: db.mult('damageTaken', ctx),
    hitTakenMult: db.mult('hitTaken', ctx),
    ailmentThreshold: opts.isPlayer ? maxLife + maxEs : maxLife,
    // Chaos Inoculation: the stun threshold uses the life the character would have without it (3.9).
    stunThreshold: fullLife * db.mult('stunThreshold', ctx) * (opts.stunThreshMult ?? 1),
    stunAvoid: clamp(db.sum('base', 'stunAvoid', ctx) / 100, 0, 1),
    stunDurOnSelf: Math.max(0, 1 - db.sum('base', 'stunDurationOnSelf', ctx) / 100),
    cannotBeStunned: flag('cannotBeStunned'),
    cannotEvade: flag('cannotEvade'),
    evadeProj: db.sum('base', 'evadeBonus.projectile', ctx) / 100,
    evadeMelee: db.sum('base', 'evadeBonus.melee', ctx) / 100,
    immuneChaos: flag('immuneChaos'),
    manaBeforeLife: flag('manaBeforeLife30') ? 0.3 : 0,
    cannotBeChilled: flag('cannotBeChilled'),
    cannotBeFrozen: flag('cannotBeFrozen'),
    lifeRegen,
    esRecharge: ES_RECHARGE_RATE * maxEs * db.mult('esRechargeRate', ctx),
    esDelay: ES_RECHARGE_DELAY / Math.max(0.1, 1 + db.inc('esRechargeDelay', ctx)),
    manaRegen,
    lifeOnBlockPct: db.sum('base', 'lifeOnBlockPct', ctx) / 100,
    moveSpeed: db.calc('moveSpeed', ctx),
    esProtectsMana: flag('manaBastion'),
    noLifeRegen: noRegen,
    instantLeech: noRegen,
    leechToEs: flag('leechToES'),
    regenToEs: flag('regenToES'),
    chaosHitsEs: flag('chaosNotBypassEs'),
    physTakenAs: physTakenAs(db, ctx),
    damageTakenType: DAMAGE_TYPES.map((t) => db.mult(`damageTaken.${t}`, ctx)),
    unaffectedByShock: flag('unaffectedByShock'),
    cannotBeLeechedFrom: flag('cannotBeLeechedFrom'),
    immuneAilments: flag('immuneAilments'),
    immune: DAMAGE_TYPES.map((t) => t !== 'physical' && t !== 'chaos' && flag(`immune.${t}`)),
    avoid: {
      ignite: avoidOf(db, ctx, 'ignite'),
      shock: avoidOf(db, ctx, 'shock'),
      chill: avoidOf(db, ctx, 'chill'),
      freeze: avoidOf(db, ctx, 'freeze'),
      bleed: avoidOf(db, ctx, 'bleed'),
      poison: avoidOf(db, ctx, 'poison'),
    },
    durOnSelf: {
      ignite: db.mult('durationOnSelf.ignite', ctx),
      shock: db.mult('durationOnSelf.shock', ctx),
      chill: db.mult('durationOnSelf.chill', ctx),
      freeze: db.mult('durationOnSelf.freeze', ctx),
      bleed: db.mult('durationOnSelf.bleed', ctx),
      poison: db.mult('durationOnSelf.poison', ctx),
    },
    flatTakenAttack: DAMAGE_TYPES.map((t) => db.sum('base', `flatTaken.attack.${t}`, ctx)),
    reflect: DAMAGE_TYPES.map((t) => db.sum('base', `reflect.${t}`, ctx)),
    reflectPhysPct: clamp(db.sum('base', 'reflectPhysPct', ctx) / 100, 0, 1),
    leechRate: db.mult('leechRate', ctx),
    noMovingBleed: flag('noMovingBleed'),
    dodgeAttack: clamp(db.sum('base', 'dodgeAttack', ctx) / 100, 0, 0.75),
    dodgeSpell: clamp(db.sum('base', 'dodgeSpell', ctx) / 100, 0, 0.75),
  };
}
