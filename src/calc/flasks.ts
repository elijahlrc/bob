import { flaskBase, type FlaskKind } from '../data/flasks';
import type { FlaskItem } from '../data/types';
import { ModDB } from '../mods/modDb';
import type { Mod } from '../mods/types';

/** A flask resolved with its affixes and the character's flask mods. */
export type FlaskSpec = {
  uid: number;
  kind: FlaskKind;
  name: string;
  life: number;
  mana: number;
  duration: number;
  maxCharges: number;
  perUse: number;
  instant: boolean;
  /** Mods granted while the flask is active (utility buffs and "during effect" affixes). */
  buff: Mod[];
  removeIgnite: boolean;
  removeFreeze: boolean;
  removeBleed: boolean;
};

export function flaskSpec(f: FlaskItem, charDb: ModDB): FlaskSpec {
  const base = flaskBase(f.baseId);
  const local = new ModDB(f.affixes.flatMap((a) => a.mods));
  const effect = charDb.mult('flaskEffect');
  const recovery = local.mult('flask.amount') * charDb.mult('flaskRecovery');
  const duration = base.duration * local.mult('flask.duration') * charDb.mult('flaskDuration');
  const scale = base.scaleWithIlvl ? 1 + 0.04 * f.ilvl : 1;
  const src = { kind: 'flask' as const, id: String(f.uid) };
  const buff: Mod[] = [
    ...base.buff.map((m) => ({
      ...m,
      value: Math.round(m.value * scale * effect),
      source: src,
    })),
    ...f.affixes
      .flatMap((a) => a.mods)
      .filter((m) => !m.stat.startsWith('flask.') && !m.stat.startsWith('remove'))
      .map((m) => ({ ...m, value: Math.round(m.value * effect), source: src })),
  ];
  return {
    uid: f.uid,
    kind: base.kind,
    name: f.name,
    life: Math.round(base.life * recovery),
    mana: Math.round(base.mana * recovery),
    duration: Math.max(0.5, duration),
    maxCharges: Math.round(base.maxCharges * local.mult('flask.maxCharges')),
    perUse: base.perUse,
    instant: local.flag('flask.instant'),
    buff,
    removeIgnite: local.flag('removeIgnite'),
    removeFreeze: local.flag('removeFreeze'),
    removeBleed: local.flag('removeBleed'),
  };
}
